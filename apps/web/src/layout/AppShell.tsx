import { Outlet, useLocation } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { SubNav } from '../components/SubNav'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { getScreenTitle, getSubMenu } from '../state/navigation'
import { LastStateContext, LAST_STATE_KEY, LastState } from '../state/lastState'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useEffect } from 'react'
import { useAuth } from '../state/auth'

export function AppShell() {
  const location = useLocation()
  const { auth } = useAuth()
  const screenTitle = getScreenTitle(location.pathname)
  const [lastState, setLastState] = useLocalStorage<LastState | null>(LAST_STATE_KEY, null)

  useEffect(() => {
    if (location.pathname === '/') {
      return
    }
    setLastState({
      path: location.pathname,
      title: screenTitle,
      savedAt: new Date().toISOString()
    })
  }, [location.pathname, screenTitle, setLastState])

  return (
    <LastStateContext.Provider value={lastState}>
      <div className="app-shell">
        <div className="app-shell__aurora app-shell__aurora--one" aria-hidden="true" />
        <div className="app-shell__aurora app-shell__aurora--two" aria-hidden="true" />
        <div className="app-shell__aurora app-shell__aurora--three" aria-hidden="true" />
        <div className="app-shell__grid" aria-hidden="true" />
        <TopNav />
        <SubNav items={getSubMenu(location.pathname, auth.user?.role ?? null)} />
        <main className="main-content">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </LastStateContext.Provider>
  )
}
