import logoDruzhina from '../assets/brand/logo-druzhina-clean.png'
import iconEmotional from '../assets/icons-cropped/icon-emotional.png'
import iconIntellectual from '../assets/icons-cropped/icon-intellectual.png'
import iconPhysical from '../assets/icons-cropped/icon-physical.png'
import iconSocial from '../assets/icons-cropped/icon-social.png'
import iconSpiritual from '../assets/icons-cropped/icon-spiritual.png'
import iconCharacter from '../assets/icons-cropped/icon-character.png'

export const developmentIcons = [
  { key: 'emotional', src: iconEmotional, label: 'Эмоциональное развитие' },
  { key: 'intellectual', src: iconIntellectual, label: 'Интеллектуальное развитие' },
  { key: 'physical', src: iconPhysical, label: 'Физическое развитие' },
  { key: 'social', src: iconSocial, label: 'Социальное развитие' },
  { key: 'spiritual', src: iconSpiritual, label: 'Духовное развитие' },
  { key: 'character', src: iconCharacter, label: 'Развитие характера' }
] as const

type DevelopmentIconKey = (typeof developmentIcons)[number]['key']

type LogoClusterProps = {
  showIcons?: boolean
  showMain?: boolean
  compact?: boolean
  sphereLinks?: Partial<Record<DevelopmentIconKey, string>>
  mainLink?: string
}

export function LogoCluster({
  showIcons = true,
  showMain = true,
  compact = false,
  sphereLinks,
  mainLink
}: LogoClusterProps) {
  const renderCard = (
    href: string | undefined,
    className: string,
    image: string,
    label: string,
    description?: string
  ) => {
    if (!href) {
      return (
        <div className={className} title={label}>
          <img src={image} alt={label} />
          <span>{label}</span>
          {description ? <small>{description}</small> : null}
        </div>
      )
    }

    return (
      <a className={`${className} logo-link`} href={href} target="_blank" rel="noreferrer" title={label}>
        <img src={image} alt={label} />
        <span>{label}</span>
        {description ? <small>{description}</small> : null}
      </a>
    )
  }

  return (
    <div className={`logo-cluster${compact ? ' compact' : ''}`}>
      {showMain ? renderCard(mainLink, 'logo-card logo-main', logoDruzhina, 'Сайт проекта') : null}
      {showIcons
        ? developmentIcons.map((icon) => {
          const href = sphereLinks?.[icon.key]
          return href ? (
            <a
              key={icon.key}
              className={`logo-card logo-icon${compact ? ' compact' : ''} logo-link`}
              href={href}
              target="_blank"
              rel="noreferrer"
              title={icon.label}
            >
                <img src={icon.src} alt={icon.label} />
                <span>{icon.label}</span>
              </a>
            ) : (
              <div key={icon.key} className={`logo-card logo-icon${compact ? ' compact' : ''}`} title={icon.label}>
                <img src={icon.src} alt={icon.label} />
                <span>{icon.label}</span>
              </div>
            )
          })
        : null}
    </div>
  )
}
