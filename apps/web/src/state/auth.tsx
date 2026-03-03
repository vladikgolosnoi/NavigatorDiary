import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { UserRole } from './navigation'

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
  setAuth: (value: AuthState) => void
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

  return <AuthContext.Provider value={{ auth, setAuth, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
