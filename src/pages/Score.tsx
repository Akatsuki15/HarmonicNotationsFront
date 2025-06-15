import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import { ScoreService } from "../services/scoreService"
import { useAuth } from "../context/AuthContext"
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { NotationService } from "../services/notationService";
import toast from 'react-hot-toast';
import { Toolbar } from "../components/Toolbar";

interface Score {
  id: string;
  title: string;
  musicxml_url: string;
  pdf_url: string;
  lastModified: string;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  pageNumber: number;
}

interface DrawStroke {
  pageNumber: number;
  color: string;
  points: {x:number, y:number}[];
}

function Score() {
    const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [score, setScore] = useState<Score | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mode, setMode] = useState<'none' | 'text' | 'draw'>('none')
  const [drawing, setDrawing] = useState(false)
  const [drawPoints, setDrawPoints] = useState<DrawStroke[]>([])
  const [rectStart, setRectStart] = useState<{x:number, y:number}|null>(null)
  const [rectCurrent, setRectCurrent] = useState<{x:number, y:number}|null>(null)
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [undoStack, setUndoStack] = useState<{annotations: Annotation[], drawPoints: DrawStroke[]}[]>([])
  const [redoStack, setRedoStack] = useState<{annotations: Annotation[], drawPoints: DrawStroke[]}[]>([])
  const [drawColor, setDrawColor] = useState<string>('#000000')
  const [currentPage, setCurrentPage] = useState(1)
  const [currentStroke, setCurrentStroke] = useState<DrawStroke | null>(null)
  // Ref para el número de página visible
  const currentPageRef = useRef(1)

  // Refs sincronizados para anotaciones y trazos
  const annotationsRef = useRef<Annotation[]>([])
  const drawPointsRef = useRef<DrawStroke[]>([])

  const pdfPageRef = useRef<HTMLDivElement>(null)

  const [pdfCanvasRect, setPdfCanvasRect] = useState<{top:number, left:number, width:number, height:number}|null>(null)

  const [pdfReady, setPdfReady] = useState(false)

  // Inicializar el estado y las refs
  useEffect(() => {
    // Forzar la primera página al cargar
    currentPageRef.current = 1
    setCurrentPage(1)
    
    // Sincronizar refs con el estado inicial
    annotationsRef.current = annotations
    drawPointsRef.current = drawPoints
  }, []) // Solo al montar el componente

  // Sincronizar refs con el estado cuando cambia
  useEffect(() => {
    annotationsRef.current = annotations
  }, [annotations])

  useEffect(() => {
    drawPointsRef.current = drawPoints
  }, [drawPoints])

  // Detectar página visible en el visor
  const handlePageChange = (e: {currentPage: number}) => {
    const newPage = e.currentPage
    currentPageRef.current = newPage
    setCurrentPage(newPage)
    // Guardar el trazo actual si existe
    if (currentStroke && currentStroke.points.length > 1) {
      setDrawPoints(points => [...points, currentStroke])
      setCurrentStroke(null)
    }
    // Forzar reseteo del área de referencia y canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (pdfPageRef.current) {
      // Forzar reflow
      pdfPageRef.current.style.outline = '2px solid orange';
      setTimeout(() => { 
        if (pdfPageRef.current) {
          pdfPageRef.current.style.outline = '2px solid red';
          // Actualizar el rectángulo del canvas después del reflow
          const pageLayer = pdfPageRef.current.querySelector('canvas, .rpv-core__page-layer') as HTMLCanvasElement | null;
          if (pageLayer) {
            const containerRect = pdfPageRef.current.getBoundingClientRect();
            const pageRect = pageLayer.getBoundingClientRect();
            setPdfCanvasRect({
              top: pageRect.top - containerRect.top,
              left: pageRect.left - containerRect.left,
              width: pageRect.width,
              height: pageRect.height
            });
          }
        }
      }, 200);
    }
  }

  // Cargar anotaciones cuando el PDF esté listo
  useEffect(() => {
    if (pdfReady && isAuthenticated && id) {
      setTimeout(() => {
        loadNotations()
      }, 2000)
    }
  }, [pdfReady, isAuthenticated, id])

  // Marcar PDF como listo cuando se carga la primera página
  const handleDocumentLoad = () => {
    setPdfReady(true)
  }

  // Handle drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'draw' || !pdfPageRef.current) return
    pushToUndo()
    setDrawing(true)
    const pageLayer = pdfPageRef.current.querySelector('canvas, .rpv-core__page-layer') as HTMLCanvasElement | null;
    if (pageLayer) {
      const pageRect = pageLayer.getBoundingClientRect();
      const xInCanvas = e.clientX - pageRect.left;
      const yInCanvas = e.clientY - pageRect.top;
      if (xInCanvas < 0 || yInCanvas < 0 || xInCanvas > pageRect.width || yInCanvas > pageRect.height) return;
      const x = xInCanvas / pageRect.width;
      const y = yInCanvas / pageRect.height;
      const pageNum = currentPage; // base 0
      const stroke = { pageNumber: pageNum, color: drawColor, points: [{x, y}] }
      setCurrentStroke(stroke)
      console.log('Iniciando trazo en página', pageNum, stroke)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!drawing || mode !== 'draw' || !currentStroke || !pdfPageRef.current) return
    const pageLayer = pdfPageRef.current.querySelector('canvas, .rpv-core__page-layer') as HTMLCanvasElement | null;
    if (pageLayer) {
      const pageRect = pageLayer.getBoundingClientRect();
      const xInCanvas = e.clientX - pageRect.left;
      const yInCanvas = e.clientY - pageRect.top;
      if (xInCanvas < 0 || yInCanvas < 0 || xInCanvas > pageRect.width || yInCanvas > pageRect.height) return;
      const x = xInCanvas / pageRect.width;
      const y = yInCanvas / pageRect.height;
      setCurrentStroke(stroke => stroke ? { ...stroke, points: [...stroke.points, {x, y}] } : null)
    }
  }

  const handleCanvasMouseUp = () => {
    if (drawing && mode === 'draw' && currentStroke && currentStroke.points.length > 1) {
      setDrawPoints(points => [...points, currentStroke])
      setCurrentStroke(null)
    }
    setDrawing(false)
  }

  // Handle placing annotation by rectangle
  const handlePdfMouseDown = (e: React.MouseEvent) => {
    if (mode === 'text' && pdfPageRef.current) {
      const pageLayer = pdfPageRef.current.querySelector('canvas, .rpv-core__page-layer') as HTMLCanvasElement | null;
      if (pageLayer) {
        const pageRect = pageLayer.getBoundingClientRect();
        const xInCanvas = e.clientX - pageRect.left;
        const yInCanvas = e.clientY - pageRect.top;
        if (xInCanvas < 0 || yInCanvas < 0 || xInCanvas > pageRect.width || yInCanvas > pageRect.height) return;
        setRectStart({x: xInCanvas, y: yInCanvas})
        setRectCurrent({x: xInCanvas, y: yInCanvas})
        setDrawing(true)
      }
    }
  }
  const handlePdfMouseMove = (e: React.MouseEvent) => {
    if (mode === 'text' && drawing && pdfPageRef.current) {
      const pageLayer = pdfPageRef.current.querySelector('canvas, .rpv-core__page-layer') as HTMLCanvasElement | null;
      if (pageLayer) {
        const pageRect = pageLayer.getBoundingClientRect();
        const xInCanvas = e.clientX - pageRect.left;
        const yInCanvas = e.clientY - pageRect.top;
        if (xInCanvas < 0 || yInCanvas < 0 || xInCanvas > pageRect.width || yInCanvas > pageRect.height) return;
        setRectCurrent({x: xInCanvas, y: yInCanvas})
      }
    }
  }
  const handlePdfMouseUp = () => {
    if (mode === 'text' && drawing && rectStart && rectCurrent && pdfPageRef.current) {
      const pageLayer = pdfPageRef.current.querySelector('canvas, .rpv-core__page-layer') as HTMLCanvasElement | null;
      if (pageLayer) {
        const pageRect = pageLayer.getBoundingClientRect();
        const x = Math.min(rectStart.x, rectCurrent.x) / pageRect.width;
        const y = Math.min(rectStart.y, rectCurrent.y) / pageRect.height;
        const w = Math.abs(rectCurrent.x - rectStart.x) / pageRect.width;
        const h = Math.abs(rectCurrent.y - rectStart.y) / pageRect.height;
        if (w > 0.01 && h > 0.01) {
          pushToUndo()
          const id = Math.random().toString(36).substr(2, 9)
          const pageNum = currentPage; // base 0
          const annotation = { id, x, y, width: w, height: h, text: '', pageNumber: pageNum }
          setAnnotations(prev => {
            console.log('Añadiendo anotación en página', pageNum, annotation)
            return [...prev, annotation]
          })
          setEditingId(id)
        }
        setRectStart(null)
        setRectCurrent(null)
        setDrawing(false)
        setMode('none')
      }
    }
  }

  // Ocultar el Navbar
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';
    return () => {
      if (navbar) navbar.style.display = '';
    }
  }, [])

    useEffect(() => {
    if (isAuthenticated && id) {
      loadScore()
    }
  }, [isAuthenticated, id])

  const loadScore = async () => {
    try {
      const data = await ScoreService.getScore(id!)
      if (!data.pdf_url) {
        throw new Error("No hay archivo PDF para esta partitura")
      }
      setScore(data)
    } catch (err) {
      setError("Error al cargar la partitura: " + err)
    } finally {
      setLoading(false)
    }
  }

  const loadNotations = async () => {
    try {
      const notationData = await NotationService.getNotations(id!)
      console.log('Respuesta completa del servidor:', notationData)

      // Si no hay datos o está vacío, simplemente retornamos
      if (!notationData || !Array.isArray(notationData) || notationData.length === 0) {
        console.log('No hay datos de notación')
        return
      }

      // Procesar todas las notaciones
      let allAnnotations: Annotation[] = []
      let allDrawPoints: DrawStroke[] = []

      notationData.forEach(notation => {
        console.log('Procesando notación:', notation)

        // Si el contenido es un string, intentamos parsearlo
        let content
        if (typeof notation.content === 'string') {
          try {
            content = JSON.parse(notation.content)
          } catch (e) {
            console.error('Error al parsear el contenido:', e)
            return
          }
        } else {
          content = notation.content
        }

        console.log('Contenido procesado:', content)

        // Acumular anotaciones y trazos
        if (content?.annotations?.length > 0) {
          allAnnotations = [...allAnnotations, ...content.annotations]
        }

        if (content?.drawPoints?.length > 0) {
          allDrawPoints = [...allDrawPoints, ...content.drawPoints]
        }
      })

      // Actualizar el estado con todas las anotaciones y trazos
      if (allAnnotations.length > 0) {
        console.log('Anotaciones encontradas:', allAnnotations)
        setAnnotations(allAnnotations)
      } else {
        console.log('No se encontraron anotaciones')
      }

      if (allDrawPoints.length > 0) {
        console.log('Trazos encontrados:', allDrawPoints)
        setDrawPoints(allDrawPoints)
        // Forzar el renderizado de los trazos
        setTimeout(() => {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
              const w = canvasRef.current.width
              const h = canvasRef.current.height
              
              allDrawPoints.forEach((stroke: DrawStroke) => {
                if (stroke.pageNumber === currentPage) {
                  ctx.strokeStyle = stroke.color
                  ctx.beginPath()
                  stroke.points.forEach((pt: {x: number, y: number}, i: number) => {
                    if (i === 0) ctx.moveTo(pt.x * w, pt.y * h)
                    else ctx.lineTo(pt.x * w, pt.y * h)
                  })
                  ctx.stroke()
                }
              })
            }
          }
        }, 100)
      } else {
        console.log('No se encontraron trazos')
      }
    } catch (err) {
      console.error("Error al cargar las anotaciones:", err)
    }
  }

  const handleBack = () => navigate(-1)
  const handleSave = async () => {
    if (!id) return;
    
    try {
      await NotationService.createNotation(id, {
        content: {
          annotations,
          drawPoints
        }
      })
      toast.success('Anotaciones guardadas correctamente')
    } catch (error) {
      console.error('Error al guardar las anotaciones:', error);
      toast.error('Error al guardar las anotaciones');
    }
  }
  const handleDownload = async () => {
    if (!score?.pdf_url) return;
    await new Promise(r => setTimeout(r, 0));
    let exportDrawPoints = [...drawPointsRef.current];
    if (currentStroke && currentStroke.points.length > 1) {
      exportDrawPoints = [...exportDrawPoints, currentStroke];
    }
    let exportAnnotations = [...annotationsRef.current];
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((ta) => {
      const id = ta.closest('[data-annotation-id]')?.getAttribute('data-annotation-id');
      if (id) {
        exportAnnotations = exportAnnotations.map(a => a.id === id ? { ...a, text: (ta as HTMLTextAreaElement).value } : a);
      }
    });
    const loadingTask = pdfjsLib.getDocument(score.pdf_url);
    const pdf = await loadingTask.promise;
    const pdfDoc = new jsPDF({ unit: 'px', format: [1190, 1683] });
    for (let pageNum = 0; pageNum < pdf.numPages; pageNum++) {
      if (pageNum > 0) pdfDoc.addPage();
      const page = await pdf.getPage(pageNum + 1);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const strokes = exportDrawPoints.filter(stroke => stroke.pageNumber === pageNum);
      strokes.forEach(stroke => {
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 2;
        stroke.points.forEach((pt, i) => {
          const x = pt.x * viewport.width;
          const y = pt.y * viewport.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      });
      const pageAnnotations = exportAnnotations.filter(a => a.pageNumber === pageNum);
      pageAnnotations.forEach(a => {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'transparent';
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = 2;
        ctx.fillRect(a.x * viewport.width, a.y * viewport.height, a.width * viewport.width, a.height * viewport.height);
        ctx.strokeRect(a.x * viewport.width, a.y * viewport.height, a.width * viewport.width, a.height * viewport.height);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#222';
        ctx.font = '16px Arial';
        ctx.textBaseline = 'top';
        ctx.fillText(a.text, (a.x * viewport.width) + 4, (a.y * viewport.height) + 4, a.width * viewport.width - 8);
        ctx.restore();
      });
      const imgData = canvas.toDataURL('image/png');
      pdfDoc.addImage(imgData, 'PNG', 0, 0, viewport.width, viewport.height);
    }
    pdfDoc.save(`${score.title || 'partitura'}.pdf`);
  }

  // Helper para guardar el estado actual en el stack de undo
  const pushToUndo = () => {
    setUndoStack(stack => [...stack, {
      annotations: JSON.parse(JSON.stringify(annotations)),
      drawPoints: JSON.parse(JSON.stringify(drawPoints)),
    }])
    setRedoStack([])
  }

  // Editar anotación
  const handleAnnotationChange = (id: string, value: string) => {
    pushToUndo()
    setAnnotations(annots => annots.map(a => a.id === id ? { ...a, text: value } : a))
  }

  // Renderizar anotaciones en pantalla con proporciones
  const renderAnnotations = () => {
    if (!pdfCanvasRect) return null;
    const w = pdfCanvasRect.width;
    const h = pdfCanvasRect.height;
    const offsetLeft = pdfCanvasRect.left;
    const offsetTop = pdfCanvasRect.top;

    const currentPageAnnotations = annotations.filter(a => a.pageNumber === currentPage)
    console.log('Renderizando anotaciones para página', currentPage, currentPageAnnotations)

    return currentPageAnnotations.map(a => (
      <div
        key={a.id}
        data-annotation-id={a.id}
        style={{ 
          position: 'absolute', 
          left: offsetLeft + a.x * w, 
          top: offsetTop + a.y * h, 
          width: a.width * w, 
          height: a.height * h,
          transform: 'none'
        }}
        className="rounded px-2 py-1 text-sm cursor-pointer pointer-events-auto flex items-center"
        onDoubleClick={() => setEditingId(a.id)}
      >
        {editingId === a.id ? (
          <textarea
            className="bg-white/80 border rounded px-1 py-0.5 text-sm w-full h-full resize-none"
            value={a.text}
            autoFocus
            onChange={e => handleAnnotationChange(a.id, e.target.value)}
            onBlur={() => setEditingId(null)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) setEditingId(null) }}
            style={{ minHeight: 20, minWidth: 40 }}
          />
        ) : (
          <span style={{whiteSpace:'pre-wrap'}}>{a.text || <span className="text-gray-400">(doble clic para editar)</span>}</span>
        )}
      </div>
    ))
  }

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const pdfArea = pdfPageRef.current
    if (!canvas || !pdfArea) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2
    const w = canvas.width
    const h = canvas.height

    // Renderizar trazos de la página actual
    const currentPageStrokes = drawPoints.filter(stroke => stroke.pageNumber === currentPage)
    console.log('Renderizando trazos para página', currentPage, currentPageStrokes)
    
    currentPageStrokes.forEach(stroke => {
      ctx.strokeStyle = stroke.color
      ctx.beginPath()
      stroke.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x * w, pt.y * h)
        else ctx.lineTo(pt.x * w, pt.y * h)
      })
      ctx.stroke()
    })

    // Renderizar trazo actual si existe
    if (drawing && mode === 'draw' && currentStroke && currentStroke.pageNumber === currentPage) {
      ctx.strokeStyle = currentStroke.color
      ctx.beginPath()
      currentStroke.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x * w, pt.y * h)
        else ctx.lineTo(pt.x * w, pt.y * h)
      })
      ctx.stroke()
    }
  }, [drawPoints, mode, drawColor, drawing, currentStroke, currentPage, pdfPageRef.current?.offsetWidth, pdfPageRef.current?.offsetHeight])

  // Actualizar la posición y tamaño del canvas de PDF.js para alinear el canvas de dibujo
  useEffect(() => {
    if (!pdfPageRef.current) return;
    const updateRect = () => {
      const pageLayer = pdfPageRef.current?.querySelector('canvas, .rpv-core__page-layer') as HTMLCanvasElement | null;
      if (pageLayer) {
        const containerRect = pdfPageRef.current.getBoundingClientRect();
        const pageRect = pageLayer.getBoundingClientRect();
        setPdfCanvasRect({
          top: pageRect.top - containerRect.top,
          left: pageRect.left - containerRect.left,
          width: pageRect.width,
          height: pageRect.height
        });
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [currentPage, pdfPageRef.current?.offsetWidth, pdfPageRef.current?.offsetHeight]);

  if (!isAuthenticated) {
    return <div>Por favor, inicia sesión para acceder a esta página</div>
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* Barra superior tipo editor */}
      <div className="w-full flex items-center px-6 py-3 shadow-sm border-b bg-white" style={{position: 'sticky', top: 0, zIndex: 50}}>
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-4 rounded transition">Volver</button>
          <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded transition">Guardar</button>
          <button onClick={handleDownload} className="bg-green-500 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded transition">Descargar</button>
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-xl font-bold text-gray-800 truncate text-center">{score?.title}</span>
        </div>
        <div className="w-32" /> {/* Espacio para balancear la barra */}
      </div>

      {/* Barra de herramientas tipo Google Docs */}
      <Toolbar
        mode={mode}
        setMode={setMode}
        drawColor={drawColor}
        setDrawColor={setDrawColor}
        undoStack={undoStack}
        redoStack={redoStack}
        setUndoStack={setUndoStack}
        setRedoStack={setRedoStack}
        annotations={annotations}
        drawPoints={drawPoints}
        setAnnotations={setAnnotations}
        setDrawPoints={setDrawPoints}
      />

      {/* Documento PDF centrado con overlay para anotaciones y dibujo */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-2 bg-white">
        <div
          className="rounded-lg overflow-hidden bg-white flex flex-col items-center relative"
          style={{width: '100%', maxWidth: 900, minHeight: 600, position: 'relative'}}
          ref={pdfContainerRef}
        >
          <div 
            ref={pdfPageRef} 
            style={{position:'relative', width:'100%', height:'100%'}} 
            onMouseDown={handlePdfMouseDown}
            onMouseMove={handlePdfMouseMove}
            onMouseUp={handlePdfMouseUp}
          >
            {score?.pdf_url && (
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.min.js`}>
                <Viewer 
                  fileUrl={score.pdf_url} 
                  onPageChange={handlePageChange}
                  onDocumentLoad={handleDocumentLoad}
                  defaultScale={SpecialZoomLevel.PageFit}
                />
              </Worker>
            )}
            {/* Overlay para anotaciones de texto */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex: 20}}>
              {/* Rectangle preview while drawing */}
              {mode==='text' && drawing && rectStart && rectCurrent && pdfPageRef.current && (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(rectStart.x, rectCurrent.x),
                    top: Math.min(rectStart.y, rectCurrent.y),
                    width: Math.abs(rectCurrent.x - rectStart.x),
                    height: Math.abs(rectCurrent.y - rectStart.y),
                    border: '2px dashed #2563eb',
                    background: 'rgba(37,99,235,0.05)',
                    zIndex: 21
                  }}
                />
              )}
              {renderAnnotations()}
            </div>
            {/* Overlay para dibujo */}
            {pdfCanvasRect && (
              <canvas
                ref={canvasRef}
                width={pdfCanvasRect.width}
                height={pdfCanvasRect.height}
                className="absolute pointer-events-auto"
                style={{
                  zIndex: 19,
                  display: 'block',
                  top: pdfCanvasRect.top,
                  left: pdfCanvasRect.left,
                  width: pdfCanvasRect.width,
                  height: pdfCanvasRect.height,
                  pointerEvents: mode === 'draw' ? 'auto' : 'none'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            )}
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            Última modificación: {score?.lastModified ? new Date(score.lastModified).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Score