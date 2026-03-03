import logoDruzhina from '../assets/brand/logo-druzhina.jpg'
import iconEmotional from '../assets/icons/icon-emotional.jpg'
import iconIntellectual from '../assets/icons/icon-intellectual.jpg'
import iconPhysical from '../assets/icons/icon-physical.jpg'
import iconSocial from '../assets/icons/icon-social.jpg'
import iconSpiritual from '../assets/icons/icon-spiritual.jpg'
import iconCharacter from '../assets/icons/icon-character.jpg'

const developmentIcons = [
  { src: iconEmotional, label: 'Эмоциональное развитие' },
  { src: iconIntellectual, label: 'Интеллектуальное развитие' },
  { src: iconPhysical, label: 'Физическое развитие' },
  { src: iconSocial, label: 'Социальное развитие' },
  { src: iconSpiritual, label: 'Духовное развитие' },
  { src: iconCharacter, label: 'Развитие характера' }
]

export function LogoCluster() {
  return (
    <div className="logo-cluster">
      <div className="logo-card logo-main">
        <img src={logoDruzhina} alt="Дружина навигаторов" />
        <span>Дружина навигаторов</span>
      </div>
      {developmentIcons.map((icon) => (
        <div key={icon.label} className="logo-card logo-icon">
          <img src={icon.src} alt={icon.label} />
          <span>{icon.label}</span>
        </div>
      ))}
    </div>
  )
}
