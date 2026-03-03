import { useLocalStorage } from './useLocalStorage'

export function useScreenDraft(pathname: string) {
  const key = `navigator.screenDraft:${pathname}`
  return useLocalStorage<string>(key, '')
}
