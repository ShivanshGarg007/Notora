import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, token } = useAuth();

  console.log('ProtectedRoute - Auth state:', {
    hasUser: !!user,
    hasToken: !!token,
    loading,
    userPreview: user ? { id: user._id, name: user.name, role: user.role } : null
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !token) {
    console.log('ProtectedRoute - No user or token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 