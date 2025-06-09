import { useState } from "react"
import Login from "../components/Login"
import Register from "../components/Register"

function Home() {
  const [showLogin, setShowLogin] = useState(true)

  const toggleAuth = () => {
    setShowLogin(!showLogin)
  }

  return (
    <div className="relative size-full min-h-screen">
      <div className="absolute inset-0 bg-[url('../../src/assets/rose-8252992_1280.jpg')] bg-auto bg-left bg-no-repeat z-0" />
      <div className="absolute inset-0 bg-black/40 z-10">
        <div className="flex items-center gap-4 mt-5 ml-10">
          <img src="../../src/assets/logo.png" alt="Logo" className="h-20" />
          <h1 className="text-4xl font-semibold italic text-white">Harmonic Notations</h1>
        </div>
      </div>
      <div className="relative z-20 flex justify-end">
        {showLogin ? <Login onToggle={toggleAuth} /> : <Register onToggle={toggleAuth} />}
      </div>
    </div>
  )
}

export default Home