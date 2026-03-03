import { createContext, useContext } from 'react'

export type LastState = {
  path: string
  title: string
  savedAt: string
}

export const LAST_STATE_KEY = 'navigator.lastState'

export const LastStateContext = createContext<LastState | null>(null)

export function useLastState() {
  return useContext(LastStateContext)
}
