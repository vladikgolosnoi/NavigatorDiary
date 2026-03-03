import { ReactElement, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'

export function RequireAuth({ children }: { children: ReactElement }) {
  const { auth } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!auth.token && typeof window !== 'undefined') {
      window.localStorage.setItem('auth.redirect', location.pathname)
    }
  }, [auth.token, location.pathname])

  if (!auth.token) {
    return <Navigate to="/auth/user" replace />
  }

  return children
}
