import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <div className="loading-spinner" role="status" aria-live="polite">Loading...</div>
  }

  return currentUser ? children : <Navigate to="/login" />
}
