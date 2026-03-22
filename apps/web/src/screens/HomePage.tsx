import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import { LogoCluster } from '../components/LogoCluster'
import { SupportFooter } from '../components/SupportFooter'
import { useAuth } from '../state/auth'
import partnerEducation from '../assets/partners/education-rostov-mark.png'
import partnerDtdm from '../assets/partners/dtdm-rostov.jpg'
import partnerDgtu from '../assets/partners/dgtu-hearts.png'
import partnerLibi from '../assets/partners/libi.png'
import logoDruzhina from '../assets/brand/logo-druzhina-clean.png'

const sphereLinks = {
  intellectual: 'https://rsdmo.ru/page95471836.html',
  physical: 'https://rsdmo.ru/page80881566.html',
  emotional: 'https://rsdmo.ru/page97984836.html',
  social: 'https://rsdmo.ru/page81393986.html',
  spiritual: 'https://rsdmo.ru/page81357916.html',
  character: 'https://rsdmo.ru/page81356256.html'
} as const

const projectLink = 'https://rsdmo.ru/page77671096.html'
const eventsLink = 'https://t.me/druzhinaevents2025'

const partners: ReadonlyArray<{
  name: string
  href: string
  logo: string
  logoClassName?: string
}> = [
  {
    name: 'Управление образования города Ростова-на-Дону',
    href: 'https://rostov-gorod.ru/administration/structure/office/uo/',
    logo: partnerEducation,
    logoClassName: 'partner-logo-education'
  },
  {
    name: 'Дворец творчества детей и молодежи',
    href: 'https://dtdm-rostov.ru/',
    logo: partnerDtdm
  },
  {
    name: 'Волонтерский центр ДГТУ «Горящие сердца»',
    href: 'https://vk.com/heartsdonstu',
    logo: partnerDgtu
  },
  {
    name: 'Центр развития «ЛИБИ»',
    href: 'https://libi.pro/',
    logo: partnerLibi
  }
] as const

type Announcement = {
  id: string
  title: string
  body: string
  createdAt?: string
  publishedAt?: string
}

export function HomePage() {
  const { auth } = useAuth()
  const showSphereLinks = auth.user?.role === 'LEADER' || auth.user?.role === 'NAVIGATOR'
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    if (!showSphereLinks) {
      setAnnouncements([])
      return
    }

    apiFetch<Announcement[]>('/announcements/public')
      .then((items) => setAnnouncements(items.slice(0, 3)))
      .catch(() => setAnnouncements([]))
  }, [showSphereLinks])

  return (
    <section className="screen home-screen">
      <div className="home-hero" id="home-welcome">
        <div className="home-copy">
          <h1>Главная</h1>
          <p>
            Приветствуем вас в движении &laquo;Дружина навигаторов&raquo; Ростовского Союза
            детских и молодежных организаций!
            <br />
            Участвовать легко, соберите команду навигаторов в составе от 7 до 9 человек и 1
            взрослого. Участники команд организуют активности и выполняют вызовы, развивая личные
            качества, приобретая полезные навыки и просто веселясь. Активности можно выбрать по
            сферам развития, исходя из своих интересов.
          </p>
        </div>
      </div>

      <section className="card home-project-card" id="home-project">
        <div className="home-project-card__copy">
          <h2>Сайт проекта</h2>
          <p>Откройте официальный сайт движения, чтобы посмотреть материалы и новости проекта.</p>
        </div>
        <a className="home-project-link" href={projectLink} target="_blank" rel="noreferrer" aria-label="Сайт проекта">
          <img src={logoDruzhina} alt="Дружина навигаторов" />
          <span>Открыть сайт</span>
        </a>
      </section>

      {showSphereLinks ? (
        <div className="card-grid home-announcements-grid" id="home-announcements">
          <article className="card highlight home-announcements-intro">
            <h2>Анонсы мероприятий</h2>
            <p>
              Здесь отображаются последние объявления организаторов для навигаторов и
              руководителей команд.
            </p>
            <div className="card-footer">
              <a className="btn ghost btn-inline" href={eventsLink} target="_blank" rel="noreferrer">
                События проекта
              </a>
            </div>
          </article>

          {announcements.length ? (
            announcements.map((item) => (
              <article key={item.id} className="card home-announcement-card">
                <h3>{item.title}</h3>
                <p className="home-announcement-body">{item.body}</p>
                <div className="card-footer">
                  <span className="pill home-announcement-date">
                    {new Date(item.publishedAt ?? item.createdAt ?? Date.now()).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <article className="card">
              <h3>Пока нет новых анонсов</h3>
              <p>Когда организатор опубликует мероприятие, оно появится здесь.</p>
            </article>
          )}
        </div>
      ) : null}

      {showSphereLinks ? (
        <section className="card home-brand-panel" id="home-spheres">
          <div className="partners-head">
            <div>
              <h2>Активности</h2>
            </div>
          </div>
          <LogoCluster showMain={false} compact sphereLinks={sphereLinks} />
        </section>
      ) : null}

      <section className="card partners-panel" id="home-partners">
        <div className="partners-head">
          <div>
            <h2>Партнеры</h2>
          </div>
        </div>
        <div className="partners-grid">
          {partners.map((partner) => (
            <a key={partner.name} className="partner-card" href={partner.href} target="_blank" rel="noreferrer">
              <img className={partner.logoClassName} src={partner.logo} alt={partner.name} />
              <span>{partner.name}</span>
            </a>
          ))}
        </div>
      </section>

      <SupportFooter />
    </section>
  )
}
