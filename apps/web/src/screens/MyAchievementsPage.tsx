import { useCallback, useEffect, useState } from 'react'
import { getStageBadge, StageBadgeGrid } from '../components/AchievementBadges'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'
import {
  BeaverHutData,
  branchAmountLabels,
  branchTypeLabels,
  getBeaverSummaryCards,
  levelLabels,
  resourceLabels
} from '../features/beaverHut'

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

const stageDescriptions: Record<string, string> = {
  START: 'Старт - достигнуто до 23 целей.',
  PATH: 'Путь - достигнуто более 24 целей. Можно получить значок этапа.',
  TRAIL: 'Тропа - достигнуто более 48 целей. Можно получить значок этапа.',
  ROUTE: 'Маршрут - достигнуто более 72 целей. Можно получить значок этапа.',
  EXPEDITION: 'Экспедиция - достигнуто более 144 целей. Можно получить значок этапа.',
  SUCCESS: 'Успех - достигнуто более 216 целей. Можно получить значок этапа.'
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
  const [beaverData, setBeaverData] = useState<BeaverHutData | null>(null)
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const summaryCards = getBeaverSummaryCards(beaverData)

  const loadAchievement = useCallback(() => {
    if (!auth.token) {
      return
    }
    setErrorMessage('')
    setNotice('')
    apiFetch<AchievementResponse>('/achievements/my', {}, auth.token)
      .then((data) => {
        setAchievement(data)
      })
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить достижения'))

    apiFetch<BeaverHutData>('/beaver-hut/my', {}, auth.token)
      .then(setBeaverData)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить ресурсы'))
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
          <p>Ваш статус по возрасту, этап по целям, освоенные специальности и накопленные ресурсы.</p>
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
        </article>
        <article className="card" id="achievements-stage">
          <h3>Этап по целям</h3>
          <p>{stageMap[achievement.stage] ?? achievement.stage}</p>
          <p>Достигнуто целей: {achievement.goalsAchievedCount}</p>
          <p className="hint">{stageDescriptions[achievement.stage] ?? 'Этап обновится автоматически после достижения целей.'}</p>
          <StageBadgeGrid activeCode={achievement.stage} compact />
        </article>
        <article className="card" id="achievements-specialties">
          <h3>Полученные специальности</h3>
          {achievement.specialties.length ? (
            <div className="tag-list">
              {achievement.specialties.map((spec) => (
                <span key={spec.id} className="tag">
                  {spec.specialty} · {levelLabels[spec.level] ?? spec.level}
                </span>
              ))}
            </div>
          ) : (
            <p>Пока нет подтверждённых специальностей.</p>
          )}
        </article>
      </div>

      <div className="card-grid" id="achievements-beaver">
        {summaryCards.map((card) => (
          <article key={card.id} className="card highlight">
            <h3>{card.title}</h3>
            <p className="score-value">{card.value}</p>
            <p>{card.note}</p>
          </article>
        ))}
      </div>

      <div className="card-grid">
        <article className="card">
          <h3>История начислений</h3>
          {beaverData?.twigAwards.length ? (
            <div className="notification-list">
              {beaverData.twigAwards.map((award) => (
                <div key={award.id} className="notification-item">
                  <header>
                    <strong>{branchTypeLabels[award.type] ?? award.type}</strong>
                    <span>{new Date(award.createdAt).toLocaleDateString('ru-RU')}</span>
                  </header>
                  <p>{award.note || branchAmountLabels[award.type] || `${award.amount} желудей`}</p>
                  {award.organizer ? <small>Начислил: {award.organizer}</small> : null}
                </div>
              ))}
            </div>
          ) : (
            <p>Начислений желудей пока нет.</p>
          )}
        </article>

        <article className="card">
          <h3>История корректировок</h3>
          {beaverData?.adjustments.length ? (
            <div className="notification-list">
              {beaverData.adjustments.map((item) => (
                <div key={item.id} className="notification-item">
                  <header>
                    <strong>{resourceLabels[item.resourceType]}</strong>
                    <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                  </header>
                  <p>
                    {item.amount > 0 ? '+' : ''}
                    {item.amount} · {item.note || 'Корректировка организатором'}
                  </p>
                  {item.organizer ? <small>Изменил: {item.organizer}</small> : null}
                </div>
              ))}
            </div>
          ) : (
            <p>Корректировок пока нет.</p>
          )}
        </article>
      </div>
    </section>
  )
}
