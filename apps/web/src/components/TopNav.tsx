import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getVisibleTopNavItems } from '../state/navigation'
import { useAuth } from '../state/auth'
import logoDruzhina from '../assets/brand/logo-druzhina-clean.png'

const roleLabels: Record<string, string> = {
  ORGANIZER: 'Организатор',
  LEADER: 'Руководитель',
  NAVIGATOR: 'Навигатор'
}

export function TopNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { auth, signOut } = useAuth()
  const navItems = getVisibleTopNavItems(auth.user?.role ?? null, Boolean(auth.token))
  const userLabel = auth.user
    ? `${auth.user.firstName} ${auth.user.lastName}`.trim()
    : ''
  const initials = auth.user
    ? `${auth.user.firstName?.[0] ?? ''}${auth.user.lastName?.[0] ?? ''}`.trim() || auth.user.firstName?.[0] || 'Н'
    : ''
  const [compactUser, setCompactUser] = useState(false)
  const [compactNav, setCompactNav] = useState(false)
  const displayName = compactUser && auth.user ? auth.user.firstName : userLabel

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const userMedia = window.matchMedia('(max-width: 520px)')
    const navMedia = window.matchMedia('(max-width: 1500px)')
    const update = () => {
      setCompactUser(userMedia.matches)
      setCompactNav(navMedia.matches)
    }
    update()
    userMedia.addEventListener('change', update)
    navMedia.addEventListener('change', update)
    return () => {
      userMedia.removeEventListener('change', update)
      navMedia.removeEventListener('change', update)
    }
  }, [])

  return (
    <header className="top-nav">
      <div className="brand">
        <div className="brand-mark">
          <img src={logoDruzhina} alt="Дружина навигаторов" />
        </div>
        <div className="brand-text">
          <span>Дневник навигатора</span>
          <small>путь роста и достижений</small>
        </div>
      </div>
      <nav className="top-nav-links">
        {navItems.map((item) => {
          const isActive = item.match.some((prefix) => location.pathname.startsWith(prefix))
          const label = compactNav && item.shortLabel ? item.shortLabel : item.label
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`top-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          )
        })}
      </nav>
      <nav className="role-nav">
        {auth.user ? (
          <>
            <button type="button" className="role-chip role-chip-button" onClick={() => navigate('/profile')}>
              <span className="role-chip-avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="role-chip-copy">
                <span className="role-chip-name">{displayName}</span>
                <small>{roleLabels[auth.user.role] ?? auth.user.role}</small>
              </span>
            </button>
            <button type="button" className="role-link" onClick={signOut}>
              Выйти
            </button>
          </>
        ) : (
          <NavLink to="/auth/user" className="role-link">
            Войти
          </NavLink>
        )}
      </nav>
    </header>
  )
}
