import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

function ProtectedRoute() {
  const { status, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingSpinner label="Loading…" />
  if (status === 'anon') return <Navigate to="/login" state={{ from: location }} replace />
  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <ErrorMessage
          message="Couldn't load your account. Check your connection and try again."
          onRetry={retry}
        />
      </div>
    )
  }
  return <Outlet />
}

export default ProtectedRoute
