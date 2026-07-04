import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingSpinner label="Loading…" />
  if (status === 'anon') return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

export default ProtectedRoute
