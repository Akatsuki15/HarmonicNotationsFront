import { useState, useEffect, useRef } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useNavigate } from "react-router"
import { ScoreService } from "../services/scoreService"
import { useAuth } from "../context/AuthContext"
import type { Score } from "../models/Score"
import toast from 'react-hot-toast'

function Scores() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [scores, setScores] = useState<Score[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [showTitleModal, setShowTitleModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadScores()
    }
  }, [isAuthenticated])

  const loadScores = async () => {
    try {
      const data = await ScoreService.getScores()
      setScores(data)
    } catch (error) {
      toast.error(`Error al cargar las partituras: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setShowTitleModal(true)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Por favor, selecciona un archivo PDF")
      return
    }

    if (!title.trim()) {
      toast.error("Por favor, ingresa un título para la partitura")
      return
    }

    try {
      const userId = "user-id" // Reemplazar con el ID real del usuario
      await ScoreService.createScore(file, userId, title)
      toast.success("Partitura subida exitosamente")
      setFile(null)
      setTitle("")
      setShowTitleModal(false)
      loadScores() // Recargar la lista de partituras
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al subir la partitura"
      toast.error(msg)
    }
  }

  if (!isAuthenticated) {
    return <div>Por favor, inicia sesión para acceder a esta página</div>
  }

  return (
    <div className="container mx-10 px-4 py-8 mt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Partituras</h1>
        <div>
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Nueva Partitura
          </button>
        </div>
      </div>

      {/* Modal para el título */}
      {showTitleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Añadir título a la partitura</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Título de la partitura
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTitleModal(false)
                    setFile(null)
                    setTitle("")
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Subir Partitura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scores.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No has añadido partituras
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scores.map((score) => (
            <div key={score.id} className="border rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{score.title}</h2>
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/score/${score.id}`)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Ver Partitura
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Scores
