import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <nav className="fixed w-full z-30 top-0 start-0 bg-white/80 backdrop-blur">
        <div className="max-w-screen flex flex-wrap items-center justify-between mx-auto p-4">
          <div className="flex justify-start space-x-3 rtl:space-x-reverse ml-12">
            <img src="../../src/assets/logo.png" className="h-14" alt="Flowbite Logo" />
            <span className="self-center text-2xl font-semibold italic whitespace-nowrap">Harmonic Notations</span>
          </div>
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => navigate('/scores')}
              className="text-cyan-700 hover:text-cyan-900 font-semibold text-lg px-6 py-2 rounded transition-colors"
            >
              Mis partituras
            </button>
          </div>
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
            <button
              onClick={() => navigate('/profile')}
              type="button"
              className="text-white bg-cyan-500 hover:bg-cyan-700 focus:ring-4 focus:outline-none focus:ring-cyan-300 font-medium rounded-lg text-sm px-8 py-2 mr-12 text-center"
            >
              Perfil
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;