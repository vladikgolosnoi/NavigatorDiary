import { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/auth'
import type { UserRole } from '../state/navigation'

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactElement }) {
  const { auth } = useAuth()

  if (!auth.token) {
    return <Navigate to="/auth/user" replace />
  }

  if (!auth.user || !roles.includes(auth.user.role)) {
    return <Navigate to="/home" replace />
  }

  return children
}
