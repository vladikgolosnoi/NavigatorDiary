import { useCallback, useEffect, useState } from 'react'
import { BadgeRow } from '../components/BadgeRow'
import { getStageBadge, StageBadgeGrid } from '../components/AchievementBadges'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const ageStatusMap: Record<string, string> = {
  SCOUT: 'Следопыт',
  NAVIGATOR: 'Навигатор',
  NOVATOR: 'Новатор',
  WANDERER: 'Странник'
}

const stageMap: Record<string, string> = {
  START: 'Старт',
  PATH: 'Путь',
  TRAIL: 'Тропа',
  ROUTE: 'Маршрут',
  EXPEDITION: 'Экспедиция',
  SUCCESS: 'Успех'
}

const levelMap: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

type AchievementResponse = {
  age: number
  ageStatus: string
  stage: string
  goalsAchievedCount: number
  specialties: { id: string; specialty: string; level: string }[]
}

export function MyAchievementsPage() {
  const { auth } = useAuth()
  const [achievement, setAchievement] = useState<AchievementResponse | null>(null)
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadAchievement = useCallback(() => {
    if (!auth.token) {
      return
    }
    setErrorMessage('')
    setNotice('')
    apiFetch<AchievementResponse>('/achievements/my', {}, auth.token)
      .then((data) => {
        setAchievement(data)
        setNotice('Статус обновлен.')
      })
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить достижения'))
  }, [auth.token])

  useEffect(() => {
    loadAchievement()
  }, [loadAchievement])

  const shareAchievement = async () => {
    if (!achievement) {
      return
    }
    const text = `Мой статус: ${ageStatusMap[achievement.ageStatus] ?? achievement.ageStatus}, этап: ${stageMap[achievement.stage] ?? achievement.stage}.`
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Короткий текст скопирован в буфер обмена.')
    } catch {
      setNotice(text)
    }
  }

  if (!achievement) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <h1>Мои достижения</h1>
            <p>Здесь появится статус по возрасту и этапы по целям.</p>
            <BadgeRow items={['Статус', 'Этап', 'Специальности']} />
          </div>
        </header>
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      </section>
    )
  }

  const activeStageBadge = getStageBadge(achievement.stage)

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Мои достижения</h1>
          <p>Ваш статус по возрасту, этап по целям и освоенные специальности.</p>
          <BadgeRow items={['Статус', 'Этап', 'Специальности']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={loadAchievement}>
            Обновить статус
          </button>
          <button className="btn ghost" onClick={shareAchievement}>
            Поделиться
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid">
        <article className="card highlight" id="achievements-status">
          <h3>Возрастной статус</h3>
          <p>
            {ageStatusMap[achievement.ageStatus] ?? achievement.ageStatus} ({achievement.age} лет)
          </p>
          <div className="stage-hero">
            <img src={activeStageBadge.icon} alt={activeStageBadge.label} />
            <div>
              <strong>{stageMap[achievement.stage] ?? achievement.stage}</strong>
              <p className="hint">Текущий этап достижений</p>
            </div>
          </div>
          <div className="card-footer">
            <span className="pill">6–22 года</span>
            <span className="pill accent">Статус</span>
          </div>
        </article>
        <article className="card" id="achievements-stage">
          <h3>Этап по целям</h3>
          <p>{stageMap[achievement.stage] ?? achievement.stage}</p>
          <p>Достигнуто целей: {achievement.goalsAchievedCount}</p>
          <StageBadgeGrid activeCode={achievement.stage} compact />
          <div className="card-footer">
            <span className="pill">Старт – Успех</span>
            <span className="pill">Цели</span>
          </div>
        </article>
        <article className="card" id="achievements-specialties">
          <h3>Специальности</h3>
          {achievement.specialties.length ? (
            <div className="tag-list">
              {achievement.specialties.map((spec) => (
                <span key={spec.id} className="tag">
                  {spec.specialty} · {levelMap[spec.level] ?? spec.level}
                </span>
              ))}
            </div>
          ) : (
            <p>Пока нет подтверждённых специальностей.</p>
          )}
        </article>
      </div>
    </section>
  )
}
