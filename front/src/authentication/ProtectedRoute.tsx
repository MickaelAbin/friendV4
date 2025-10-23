import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from './AuthProvider'

export const ProtectedRoute = () => {
  const { user, loading } = useAuthContext()

  if (loading) {
    return <div className="page-centered">Chargement...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

