import { useState, type ChangeEvent, type FormEvent } from "react";
import { AuthService } from "../services/authService";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface RegisterProps {
  onToggle: () => void;
  mobile?: boolean;
}

function Register({ onToggle, mobile }: RegisterProps) {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState(
        {
            name: '',
            email: '',
            password: ''
        }
    )
    const [message, setMessage ] = useState('')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        // mensaje por post al api del backend
        try{
        await AuthService.registerUser(form) 
        setMessage('register successfull')
        await login(); // Set authentication state to true
        navigate("/profile");
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
      <form className={`mx-auto pt-10 px-4 ${mobile ? 'bg-violet-300 min-h-screen flex flex-col justify-center' : 'mx-auto min-w-lg pt-30 px-10 bg-violet-300 min-h-screen'} `} onSubmit={handleSubmit}>
        <h2 className={`text-3xl font-semibold ${mobile ? 'text-center' : 'mt-30'}`}>Registrate</h2>
        <div className="mb-5 mt-8 px-1">
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-black">Nickname</label>
          <input type="name" name="name" value={form.name} onChange={handleChange} id="name"
            className={`bg-gray-50 border border-gray-300 text-gray-900 ${mobile ? 'text-base' : 'text-sm'} rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2 ${mobile ? 'py-2 px-3' : ''}`}
            required />
        </div>
        <div className="mb-5 px-1">
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-black">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} id="email"
            className={`bg-gray-50 border border-gray-300 text-gray-900 ${mobile ? 'text-base' : 'text-sm'} rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2 ${mobile ? 'py-2 px-3' : ''}`}
            placeholder="name@flowbite.com" required />
        </div>
        <div className="mb-5 px-1">
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-black">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} id="password"
            className={`bg-gray-50 border border-gray-300 text-gray-900 ${mobile ? 'text-base' : 'text-sm'} rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2 ${mobile ? 'py-2 px-3' : ''}`}
            required />
        </div>
        <button type="submit"
          className={`${mobile ? 'text-base py-2 px-4' : 'text-sm py-2.5 px-5 ml-4 mr-48'} text-white bg-cyan-500 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg`}
        >Submit</button>
        <button type="button" onClick={onToggle}
          className={`mt-2 ${mobile ? 'text-base py-2 px-4' : 'text-sm py-2.5 px-5'} text-white bg-pink-500 hover:bg-pink-700 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg`}
        >Iniciar Sesión</button>
        {message && <div className="mt-2 text-center text-red-600">{message}</div>}
      </form>
    </div>
  )
}

export default Register