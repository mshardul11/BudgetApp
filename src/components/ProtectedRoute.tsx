import { ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth()

  useEffect(() => {
    console.log('[ProtectedRoute] loading:', loading)
    console.log('[ProtectedRoute] currentUser:', currentUser)
  }, [loading, currentUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    console.log('[ProtectedRoute] Redirecting to /login because user is not authenticated')
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
} 