import { createContext, useContext, useEffect } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { UserRole } from './navigation'
import { apiFetch, ApiError } from '../api/client'

export type AuthUser = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  role: UserRole
  teamId?: string | null
}

export type AuthState = {
  token: string | null
  user: AuthUser | null
}

const initialAuthState: AuthState = {
  token: null,
  user: null
}

const AuthContext = createContext<{
  auth: AuthState
  setAuth: Dispatch<SetStateAction<AuthState>>
  signOut: () => void
}>({
  auth: initialAuthState,
  setAuth: () => {},
  signOut: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useLocalStorage<AuthState>('auth.state', initialAuthState)

  const signOut = () => {
    setAuth(initialAuthState)
  }

  useEffect(() => {
    if (!auth.token) {
      return
    }

    apiFetch<{
      firstName: string
      lastName: string
      middleName?: string | null
      role?: UserRole
      team?: { id: string } | null
    }>('/users/me', {}, auth.token)
      .then((profile) => {
        setAuth((prev) => {
          if (!prev.token || !prev.user) {
            return prev
          }

          const nextUser = {
            ...prev.user,
            firstName: profile.firstName ?? prev.user.firstName,
            lastName: profile.lastName ?? prev.user.lastName,
            middleName: profile.middleName ?? null,
            role: profile.role ?? prev.user.role,
            teamId: profile.team?.id ?? prev.user.teamId ?? null
          }

          if (
            nextUser.firstName === prev.user.firstName &&
            nextUser.lastName === prev.user.lastName &&
            nextUser.middleName === (prev.user.middleName ?? null) &&
            nextUser.role === prev.user.role &&
            nextUser.teamId === (prev.user.teamId ?? null)
          ) {
            return prev
          }

          return { ...prev, user: nextUser }
        })
      })
      .catch((error: ApiError) => {
        if (error.status === 401) {
          setAuth(initialAuthState)
        }
      })
  }, [auth.token, setAuth])

  return <AuthContext.Provider value={{ auth, setAuth, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
