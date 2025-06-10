import { useState, useEffect } from "react"
import Login from "../components/Login"
import Register from "../components/Register"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router"

function Home() {
  const [showLogin, setShowLogin] = useState(true)
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/scores")
    }
  }, [isAuthenticated, navigate])

  const toggleAuth = () => {
    setShowLogin(!showLogin)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen min-h-screen overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[url('../../src/assets/rose-8252992_1280.jpg')] bg-cover bg-center bg-no-repeat z-0 hidden sm:block" />
      <div className="absolute inset-0 w-full h-full bg-black/40 z-10 hidden sm:block" />
      <div className="flex items-center gap-4 mt-5 ml-10 absolute z-20 hidden sm:flex">
        <img src="../../src/assets/logo.png" alt="Logo" className="h-20" />
        <h1 className="text-4xl font-semibold italic text-white">Harmonic Notations</h1>
      </div>
      <div className="sm:hidden flex flex-col items-center justify-center w-full h-full bg-violet-300">
        <div className="flex flex-col items-center mb-6 mt-8">
          <img src="../../src/assets/logo.png" alt="Logo" className="h-16 mt-30" />
          <h1 className="text-2xl font-semibold italic text-white">Harmonic Notations</h1>
        </div>
        <div className="w-full px-4 flex justify-center">
          <div className="w-full max-w-xs">
            {showLogin ? <Login onToggle={toggleAuth} mobile /> : <Register onToggle={toggleAuth} mobile />}
          </div>
        </div>
      </div>
      <div className="relative z-30 flex justify-end h-full items-center sm:justify-end items-center w-full hidden sm:flex">
        <div className="w-full h-full flex items-center justify-center sm:justify-end">
          {showLogin ? <Login onToggle={toggleAuth} /> : <Register onToggle={toggleAuth} />}
        </div>
      </div>
    </div>
  )
}

export default Home