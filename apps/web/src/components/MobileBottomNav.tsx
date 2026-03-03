import { NavLink, useLocation } from 'react-router-dom'
import { getVisibleTopNavItems } from '../state/navigation'
import { useAuth } from '../state/auth'

const iconMap: Record<string, string> = {
  '/home': '🏠',
  '/goals/my': '🎯',
  '/specialties/my': '🧭',
  '/achievements': '🏆',
  '/beaver-hut': '🦫',
  '/chat': '💬',
  '/profile': '👤',
  '/leader': '📋',
  '/organizer': '🛠️',
  '/extra': 'ℹ️'
}

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
        return (
          <NavLink key={item.path} to={item.path} className={`mobile-nav-link${isActive ? ' active' : ''}`}>
            <span className="mobile-nav-icon">{iconMap[item.path] ?? '•'}</span>
            <span className="mobile-nav-label">{item.shortLabel ?? item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
