import { NavLink, useLocation } from 'react-router-dom'
import { getVisibleTopNavItems } from '../state/navigation'
import { useAuth } from '../state/auth'

function MobileNavGlyph({ path }: { path: string }) {
  switch (path) {
    case '/home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
        </svg>
      )
    case '/goals/my':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="m16.5 7.5 2.5-2.5" />
        </svg>
      )
    case '/specialties/my':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.5 18 7v5.5c0 3.6-2.5 5.8-6 7-3.5-1.2-6-3.4-6-7V7l6-2.5Z" />
          <path d="M9.5 12.5 11 14l3.5-3.5" />
        </svg>
      )
    case '/achievements':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
          <path d="M8 6H5.5A2.5 2.5 0 0 0 8 9" />
          <path d="M16 6h2.5A2.5 2.5 0 0 1 16 9" />
          <path d="M12 11v4" />
          <path d="M9 20h6" />
          <path d="M10 15h4l1 5H9l1-5Z" />
        </svg>
      )
    case '/chat':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6.5h14v9H9l-4 3v-12Z" />
          <path d="M8.5 10.5h7" />
          <path d="M8.5 13.5h4.5" />
        </svg>
      )
    case '/profile':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 19c1.5-3 4-4.5 6.5-4.5S17 16 18.5 19" />
        </svg>
      )
    case '/leader':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="16" cy="8" r="2.25" />
          <path d="M4.5 18c1-2.4 2.9-3.8 5.5-3.8S14.5 15.6 15.5 18" />
          <path d="M14 18c.6-1.8 2-3 4-3 1 0 1.8.2 2.5.8" />
        </svg>
      )
    case '/organizer':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4 18 6.5v5.3c0 3.4-2.2 5.8-6 7.7-3.8-1.9-6-4.3-6-7.7V6.5L12 4Z" />
          <path d="m10.5 12 1.2 1.2 2.8-2.8" />
        </svg>
      )
    case '/extra':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
  }
}

export function MobileBottomNav() {
  const location = useLocation()
  const { auth } = useAuth()

  if (!auth.token) {
    return null
  }

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
            <span className="mobile-nav-icon">
              <MobileNavGlyph path={item.path} />
            </span>
            <span className="mobile-nav-label">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
