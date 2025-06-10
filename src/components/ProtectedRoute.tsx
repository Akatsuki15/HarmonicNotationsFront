import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si estamos en '/', siempre renderiza los hijos
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  useEffect(() => {
    if (!isAuthenticated && !loading && location.pathname !== '/') {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname !== '/') {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute; 