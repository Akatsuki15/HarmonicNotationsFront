import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="bg-cyan-100 rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-cyan-700 mb-6 text-center">Perfil de usuario</h2>
        <div className="mb-4">
          <span className="block text-gray-700 font-semibold">Nombre:</span>
          <span className="block text-lg">{user.name}</span>
        </div>
        <div className="mb-4">
          <span className="block text-gray-700 font-semibold">Email:</span>
          <span className="block text-lg">{user.email}</span>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="mt-6 w-full bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Profile;
