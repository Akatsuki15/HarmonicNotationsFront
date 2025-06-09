import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { ScoreService } from "../services/scoreService"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router"

function Scores() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Aquí podrías implementar la lógica para extraer el título de la primera línea del PDF
      // Por ahora lo dejamos como un input separado
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage("Por favor, selecciona un archivo PDF")
      return
    }

    try {
      // Aquí deberías obtener el userId del usuario actual
      const userId = "user-id" // Reemplazar con el ID real del usuario
      await ScoreService.createScore(file, userId, title)
      setMessage("Partitura subida exitosamente")
      setFile(null)
      setTitle("")
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al subir la partitura"
      setMessage(msg)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Subir Partitura</h1>
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pdf">
            Seleccionar archivo PDF
          </label>
          <input
            type="file"
            id="pdf"
            accept=".pdf"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

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
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Subir Partitura
        </button>

        {message && (
          <div className="mt-4 p-4 rounded" style={{ backgroundColor: message.includes("exitosamente") ? "#d4edda" : "#f8d7da" }}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}

export default Scores
