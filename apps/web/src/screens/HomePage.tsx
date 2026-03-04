import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeRow } from '../components/BadgeRow'
import { LogoCluster } from '../components/LogoCluster'
import { MascotBadgeRow, StageBadgeGrid } from '../components/AchievementBadges'
import { apiFetch, ApiError } from '../api/client'
import { scrollToSectionById } from '../utils/scroll'

const initialAnnouncements = [
  {
    id: 'ann-1',
    title: 'Фестиваль навигаторов уже скоро',
    body: 'Готовьте презентации команд и расскажите о своих достижениях.'
  },
  {
    id: 'ann-2',
    title: 'Неделя командных вызовов',
    body: 'Выберите одну цель, которая объединит всю команду.'
  },
  {
    id: 'ann-3',
    title: 'Ярмарка специальностей',
    body: 'Встречайте новые специальности и попробуйте себя в роли эксперта.'
  }
]

type Announcement = {
  id: string
  title: string
  body: string
}

export function HomePage() {
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [errorMessage, setErrorMessage] = useState('')

  const focusAnnouncements = () => {
    scrollToSectionById('home-announcements')
  }

  useEffect(() => {
    let active = true
    apiFetch<Announcement[]>('/announcements/public')
      .then((data) => {
        if (active && Array.isArray(data)) {
          setAnnouncements(data)
        }
      })
      .catch((error: ApiError) => {
        if (active) {
          setErrorMessage(error.message || 'Не удалось загрузить анонсы')
        }
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Главная</h1>
          <p>Привет! Здесь собраны важные новости и события проекта.</p>
          <BadgeRow items={['Приветствие', 'Анонсы', 'Новости команды']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={focusAnnouncements}>
            Смотреть анонсы
          </button>
          <button className="btn ghost" onClick={() => navigate('/chat')}>
            Перейти в чат
          </button>
        </div>
      </header>

      <div id="home-welcome">
        <LogoCluster />
      </div>

      <div className="card">
        <h3>Значки этапов</h3>
        <p>Собирайте значки этапов и отмечайте новые достижения команды.</p>
        <MascotBadgeRow />
        <StageBadgeGrid compact />
      </div>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid" id="home-announcements">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="card">
            <h3>{announcement.title}</h3>
            <p>{announcement.body}</p>
            <div className="card-footer">
              <span className="pill">Анонс</span>
              <span className="pill accent">Важно</span>
            </div>
          </article>
        ))}
      </div>

      <div className="card-grid" id="home-team">
        <article className="card highlight">
          <h3>Новости команды</h3>
          <p>Обсуждайте цели, поддерживайте друг друга и делитесь успехами.</p>
          <button className="btn ghost" onClick={() => navigate('/chat')}>
            Перейти в чат
          </button>
        </article>
        <article className="card">
          <h3>Командный ритм</h3>
          <p>Ставьте реакции и отмечайте прогресс раз в неделю — так команда растет вместе.</p>
        </article>
      </div>
    </section>
  )
}
