import logoDruzhina from '../assets/brand/logo-druzhina.jpg'
import iconEmotional from '../assets/icons/icon-emotional.jpg'
import iconIntellectual from '../assets/icons/icon-intellectual.jpg'
import iconPhysical from '../assets/icons/icon-physical.jpg'
import iconSocial from '../assets/icons/icon-social.jpg'
import iconSpiritual from '../assets/icons/icon-spiritual.jpg'
import iconCharacter from '../assets/icons/icon-character.jpg'

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
  sphereLinks?: Partial<Record<DevelopmentIconKey, string>>
  mainLink?: string
}

export function LogoCluster({ showIcons = true, sphereLinks, mainLink }: LogoClusterProps) {
  const renderCard = (href: string | undefined, className: string, image: string, label: string) => {
    if (!href) {
      return (
        <div className={className}>
          <img src={image} alt={label} />
          <span>{label}</span>
        </div>
      )
    }

    return (
      <a className={`${className} logo-link`} href={href} target="_blank" rel="noreferrer">
        <img src={image} alt={label} />
        <span>{label}</span>
      </a>
    )
  }

  return (
    <div className="logo-cluster">
      {renderCard(mainLink, 'logo-card logo-main', logoDruzhina, 'Дружина навигаторов')}
      {showIcons
        ? developmentIcons.map((icon) =>
            renderCard(sphereLinks?.[icon.key], 'logo-card logo-icon', icon.src, icon.label)
          )
        : null}
    </div>
  )
}
