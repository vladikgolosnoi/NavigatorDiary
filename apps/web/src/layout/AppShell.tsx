import { Outlet, useLocation } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { SubNav } from '../components/SubNav'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { getScreenTitle, getSubMenu } from '../state/navigation'
import { LastStateContext, LAST_STATE_KEY, LastState } from '../state/lastState'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useEffect } from 'react'

export function AppShell() {
  const location = useLocation()
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
        <TopNav />
        <SubNav items={getSubMenu(location.pathname)} />
        <main className="main-content">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </LastStateContext.Provider>
  )
}
