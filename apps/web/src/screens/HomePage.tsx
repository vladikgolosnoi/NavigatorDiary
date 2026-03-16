import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import { LogoCluster } from '../components/LogoCluster'
import { useAuth } from '../state/auth'

const sphereLinks = {
  intellectual: 'https://rsdmo.ru/page95471836.html',
  physical: 'https://rsdmo.ru/page80881566.html',
  emotional: 'https://rsdmo.ru/page97984836.html',
  social: 'https://rsdmo.ru/page81393986.html',
  spiritual: 'https://rsdmo.ru/page81357916.html',
  character: 'https://rsdmo.ru/page81356256.html'
} as const

const projectLink = 'https://rsdmo.ru/page77671096.html'

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
            Приветствуем вас в движении &laquo;Дружина навигаторов&raquo;. Участвовать легко,
            соберите команду навигаторов в составе от 7 до 9 человек и 1 взрослого. Участники
            команд организуют активности и выполняют вызовы, развивая личные качества,
            приобретая полезные навыки и просто веселясь. Активности можно выбрать по сферам
            развития, исходя из интересов навигаторов.
          </p>
          {showSphereLinks ? (
            <p className="home-note">Нажмите на значок сферы, чтобы открыть подборку активностей.</p>
          ) : null}
        </div>
        <div className="home-brand">
          <LogoCluster
            showIcons={showSphereLinks}
            sphereLinks={showSphereLinks ? sphereLinks : undefined}
            mainLink={projectLink}
          />
        </div>
      </div>

      {showSphereLinks ? (
        <div className="card-grid" id="home-announcements">
          <article className="card highlight">
            <h2>Анонсы мероприятий</h2>
            <p>
              Здесь отображаются последние объявления организаторов для навигаторов и
              руководителей команд.
            </p>
            <div className="card-footer">
              <span className="pill">Команды</span>
              <span className="pill accent">События проекта</span>
            </div>
          </article>

          {announcements.length ? (
            announcements.map((item) => (
              <article key={item.id} className="card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div className="card-footer">
                  <span className="pill">
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
    </section>
  )
}
