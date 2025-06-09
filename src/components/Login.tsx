import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AuthService } from "../services/authService";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onToggle: () => void;
}

function Login({ onToggle }: LoginProps) {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState(
        {
        email: '',
        password: ''
        }
    )
    const [message, setMessage ] = useState('')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        // mensaje por post al api del backend
        try{
        await AuthService.loginUser(form.email, form.password) 
        setMessage('login successfull')
        login(); // Set authentication state to true
        navigate("/scores");
        }catch(error){
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        setMessage(msg)
        }
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, name } = e.target
        setForm({ ...form, [name]: value, })
    }

  return (
    <div>
      <form className="max-w-lg mx-auto min-w-lg pt-30 px-10 bg-violet-300 min-h-screen" onSubmit={handleSubmit}>
        <h2 className="text-3xl font-semibold">Inicia Sesión</h2>
        <div className="mb-5 mt-30 px-3">
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-black">Your email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5" placeholder="name@flowbite.com" required />
        </div>
        <div className="mb-5 px-3">
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-black">Your password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} id="password" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5" required />
        </div>
        <button type="submit" className="ml-4 text-white bg-cyan-500 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Submit</button>
        <button type="button" onClick={onToggle} className="ml-50 text-white bg-pink-500 hover:bg-pink-700 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Registrarse</button>
        {message}
      </form>
    </div>
  )
}

export default Login