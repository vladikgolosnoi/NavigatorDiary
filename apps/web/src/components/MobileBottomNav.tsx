import { NavLink, useLocation } from 'react-router-dom'
import { getVisibleTopNavItems } from '../state/navigation'
import { useAuth } from '../state/auth'

export function MobileBottomNav() {
  const location = useLocation()
  const { auth } = useAuth()

  const items = getVisibleTopNavItems(auth.user?.role ?? null, Boolean(auth.token)).slice(0, 6)
  if (items.length === 0) {
    return null
  }

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Мобильная навигация"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const isActive = item.match.some((prefix) => location.pathname.startsWith(prefix))
        const label = item.shortLabel ?? item.label
        return (
          <NavLink key={item.path} to={item.path} className={`mobile-nav-link${isActive ? ' active' : ''}`}>
            <span className="mobile-nav-indicator" />
            <span className="mobile-nav-label">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
