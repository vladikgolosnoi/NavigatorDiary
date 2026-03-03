import { useLocation, useNavigate } from 'react-router-dom'
import type { SubMenuItem } from '../state/navigation'

type SubNavProps = {
  items: SubMenuItem[]
}

export function SubNav({ items }: SubNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentHash = location.hash ? location.hash.replace('#', '') : ''

  const handleClick = (anchor?: string) => {
    if (!anchor || typeof document === 'undefined') {
      return
    }
    const nextHash = `#${anchor}`
    navigate({ pathname: location.pathname, hash: nextHash }, { replace: true })
    window.setTimeout(() => {
      const element = document.getElementById(anchor)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }

  return (
    <div className="sub-nav">
      {items.map((item, index) => {
        const isActive = currentHash
          ? item.anchor === currentHash
          : index === 0
        if (item.anchor) {
          return (
            <button
              key={item.label}
              type="button"
              className={`sub-link${isActive ? ' active' : ''}`}
              onClick={() => handleClick(item.anchor)}
            >
              {item.label}
            </button>
          )
        }
        return (
          <span key={item.label} className={`sub-link static${isActive ? ' active' : ''}`}>
            {item.label}
          </span>
        )
      })}
    </div>
  )
}
