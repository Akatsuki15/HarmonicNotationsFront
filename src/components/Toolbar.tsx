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
  points: {x: number, y: number}[];
}

type StateSnapshot = {
  annotations: Annotation[];
  drawPoints: DrawStroke[];
}

interface ToolbarProps {
  mode: 'none' | 'text' | 'draw'
  setMode: (mode: 'none' | 'text' | 'draw') => void
  drawColor: string
  setDrawColor: (color: string) => void
  undoStack: StateSnapshot[]
  redoStack: StateSnapshot[]
  setUndoStack: (stack: StateSnapshot[]) => void
  setRedoStack: (stack: StateSnapshot[]) => void
  annotations: Annotation[]
  drawPoints: DrawStroke[]
  setAnnotations: (annotations: Annotation[]) => void
  setDrawPoints: (points: DrawStroke[]) => void
}

export function Toolbar({
  mode,
  setMode,
  drawColor,
  setDrawColor,
  undoStack,
  redoStack,
  setUndoStack,
  setRedoStack,
  annotations,
  drawPoints,
  setAnnotations,
  setDrawPoints
}: ToolbarProps) {
  // Deshacer
  const handleUndo = () => {
    if (undoStack.length === 0) return
    const currentState: StateSnapshot = {
      annotations: JSON.parse(JSON.stringify(annotations)),
      drawPoints: JSON.parse(JSON.stringify(drawPoints))
    }
    setRedoStack([currentState, ...redoStack])
    const prev = undoStack[undoStack.length - 1]
    setAnnotations(prev.annotations)
    setDrawPoints(prev.drawPoints)
    setUndoStack(undoStack.slice(0, -1))
  }

  // Rehacer
  const handleRedo = () => {
    if (redoStack.length === 0) return
    const currentState: StateSnapshot = {
      annotations: JSON.parse(JSON.stringify(annotations)),
      drawPoints: JSON.parse(JSON.stringify(drawPoints))
    }
    setUndoStack([...undoStack, currentState])
    const next = redoStack[0]
    setAnnotations(next.annotations)
    setDrawPoints(next.drawPoints)
    setRedoStack(redoStack.slice(1))
  }

  return (
    <div className="w-full bg-gray-100 border-b px-2 py-1 flex items-center justify-center gap-1 overflow-x-auto text-gray-700 text-lg select-none" style={{zIndex: 49, position: 'sticky', top: 56}}>
      <button 
        className="p-2 hover:bg-gray-200 rounded" 
        title="Deshacer" 
        onClick={handleUndo} 
        disabled={undoStack.length === 0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      <button 
        className="p-2 hover:bg-gray-200 rounded" 
        title="Rehacer" 
        onClick={handleRedo} 
        disabled={redoStack.length === 0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <span className="mx-2 border-l h-6 border-gray-300"></span>
      <button className="p-2 hover:bg-gray-200 rounded" title="Color de dibujo">
        <input
          type="color"
          value={drawColor}
          onChange={e => setDrawColor(e.target.value)}
          style={{ width: 24, height: 24, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
        />
      </button>
      <button 
        className={`p-2 hover:bg-gray-200 rounded ${mode==='text'?'bg-blue-100':''}`} 
        title="Añadir texto" 
        onClick={()=>setMode(mode==='text'?'none':'text')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4zm2 2h4v2H8V6zm0 4h4v2H8v-2z" clipRule="evenodd" />
        </svg>
      </button>
      <button 
        className={`p-2 hover:bg-gray-200 rounded ${mode==='draw'?'bg-blue-100':''}`} 
        title="Dibujar" 
        onClick={()=>setMode(mode==='draw'?'none':'draw')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  )
} 