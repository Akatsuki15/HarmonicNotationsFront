import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'
import Scores from './pages/Scores'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './pages/Profile'
import Score from './pages/Score'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className='flex flex-col'>
          <Navbar/>
          <div className="flex grow justify-center items-center">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/scores" 
                element={
                  <ProtectedRoute>
                    <Scores />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/score/:id"
                element={
                  <ProtectedRoute>
                    <Score />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
