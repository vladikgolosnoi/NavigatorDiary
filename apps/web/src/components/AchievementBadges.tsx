import badgeBeaver from '../assets/badges/badge-beaver.png'
import badgeRoute from '../assets/badges/badge-route.png'
import badgeTrail from '../assets/badges/badge-trail.png'
import badgeStart from '../assets/badges/badge-start.png'
import badgeExpedition from '../assets/badges/badge-expedition.png'
import badgePath from '../assets/badges/badge-path.png'
import badgeSuccess from '../assets/badges/badge-success.png'

export type AchievementStageCode =
  | 'START'
  | 'PATH'
  | 'TRAIL'
  | 'ROUTE'
  | 'EXPEDITION'
  | 'SUCCESS'

type StageBadge = {
  code: AchievementStageCode
  label: string
  icon: string
}

type MascotBadge = {
  code: 'BEAVER'
  label: string
  icon: string
}

export const stageBadges: StageBadge[] = [
  { code: 'START', label: 'Старт', icon: badgeStart },
  { code: 'PATH', label: 'Путь', icon: badgePath },
  { code: 'TRAIL', label: 'Тропа', icon: badgeTrail },
  { code: 'ROUTE', label: 'Маршрут', icon: badgeRoute },
  { code: 'EXPEDITION', label: 'Экспедиция', icon: badgeExpedition },
  { code: 'SUCCESS', label: 'Успех', icon: badgeSuccess }
]

export const mascotBadges: MascotBadge[] = [
  { code: 'BEAVER', label: 'Бобр', icon: badgeBeaver }
]

export function getStageBadge(code?: string) {
  return stageBadges.find((item) => item.code === code) ?? stageBadges[0]
}

type StageBadgeGridProps = {
  activeCode?: string
  compact?: boolean
}

export function StageBadgeGrid({ activeCode, compact = false }: StageBadgeGridProps) {
  return (
    <div className={`stage-badge-grid${compact ? ' compact' : ''}`}>
      {stageBadges.map((badge) => (
        <article
          key={badge.code}
          className={`stage-badge-card${activeCode === badge.code ? ' active' : ''}`}
        >
          <img src={badge.icon} alt={badge.label} />
          <span>{badge.label}</span>
        </article>
      ))}
    </div>
  )
}

export function MascotBadgeRow() {
  return (
    <div className="mascot-badge-row">
      {mascotBadges.map((badge) => (
        <article key={badge.code} className="mascot-badge-card">
          <img src={badge.icon} alt={badge.label} />
          <span>{badge.label}</span>
        </article>
      ))}
    </div>
  )
}
