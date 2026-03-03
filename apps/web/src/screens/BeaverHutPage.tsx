import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeRow } from '../components/BadgeRow'
import { MascotBadgeRow } from '../components/AchievementBadges'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const branchTypeLabels: Record<string, string> = {
  PARTICIPATION: 'Участие в мероприятии',
  ACTIVE_PARTICIPATION: 'Активное участие',
  WIN: 'Победа'
}

const levelLabels: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

const branchAmountLabels: Record<string, string> = {
  PARTICIPATION: '10 веточек',
  ACTIVE_PARTICIPATION: '15 веточек',
  WIN: '20 веточек'
}

type BeaverHutData = {
  acorns: number
  twigs: number
  logs: number
  achievedGoalsCount: number
  completedSpecialties: { id: string; specialty: string; level: string; completedAt?: string | null }[]
  twigAwards: {
    id: string
    type: string
    amount: number
    note?: string | null
    createdAt: string
    organizer?: string | null
  }[]
}

type TeamOption = {
  id: string
  name: string
  city?: string | null
  institution?: string | null
}

export function BeaverHutPage() {
  const { auth } = useAuth()
  const [data, setData] = useState<BeaverHutData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  const [teams, setTeams] = useState<TeamOption[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [awardType, setAwardType] = useState<'PARTICIPATION' | 'ACTIVE_PARTICIPATION' | 'WIN'>('PARTICIPATION')
  const [awardNote, setAwardNote] = useState('')
  const [awarding, setAwarding] = useState(false)

  const loadData = useCallback(() => {
    if (!auth.token) {
      return
    }
    setErrorMessage('')
    apiFetch<BeaverHutData>('/beaver-hut/my', {}, auth.token)
      .then((payload) => {
        setData(payload)
      })
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить данные хатки'))
  }, [auth.token])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    apiFetch<TeamOption[]>('/teams/public')
      .then((payload) => {
        setTeams(payload)
        if (payload.length > 0) {
          setSelectedTeamId((prev) => prev || payload[0].id)
        }
      })
      .catch(() => {
        // ignore
      })
  }, [])

  const isOrganizer = auth.user?.role === 'ORGANIZER'

  const teamLabel = (team: TeamOption) => {
    const parts = [team.name, team.city].filter(Boolean)
    return parts.join(' · ')
  }

  const awardBranches = async () => {
    if (!auth.token) {
      setErrorMessage('Для начисления веточек требуется вход.')
      return
    }
    if (!selectedTeamId) {
      setErrorMessage('Выберите команду для начисления веточек.')
      return
    }
    setErrorMessage('')
    setNotice('')
    try {
      setAwarding(true)
      const response = await apiFetch<{ awarded: number; amount: number }>(
        '/beaver-hut/branches/award',
        {
          method: 'POST',
          body: JSON.stringify({
            teamId: selectedTeamId,
            type: awardType,
            note: awardNote.trim() || undefined
          })
        },
        auth.token
      )
      setNotice(`Начислено: ${response.amount} веточек каждому участнику (${response.awarded} чел.).`)
      setAwardNote('')
      loadData()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось начислить веточки')
    } finally {
      setAwarding(false)
    }
  }

  const summaryCards = useMemo(() => {
    return [
      { id: 'beaver-acorns', title: 'Жёлуди', value: data?.acorns ?? 0, note: 'За личные достижения целей' },
      { id: 'beaver-twigs', title: 'Веточки', value: data?.twigs ?? 0, note: 'За командные мероприятия' },
      { id: 'beaver-logs', title: 'Поленья', value: data?.logs ?? 0, note: 'За освоенные специальности' }
    ]
  }, [data])

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Хатка бобра</h1>
          <p>Сокровища вашего прогресса: жёлуди, веточки и поленья.</p>
          <BadgeRow items={['Жёлуди', 'Веточки', 'Поленья']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={loadData}>
            Обновить
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid">
        {summaryCards.map((card) => (
          <article key={card.title} className="card highlight" id={card.id}>
            <h3>{card.title}</h3>
            <p className="score-value">{card.value}</p>
            <p>{card.note}</p>
          </article>
        ))}
        <article className="card">
          <h3>Правила начисления</h3>
          <MascotBadgeRow />
          <ul className="list">
            <li>Жёлуди: старт 6, путь 24, тропа 48, маршрут 72, экспедиция 144, успех 216.</li>
            <li>Веточки: участие 10, активное участие 15, победа 20.</li>
            <li>Поленья: бронза 10, серебро 20, золото 30.</li>
          </ul>
        </article>
      </div>

      <div className="state-grid">
        <article className="card">
          <h3>Освоенные специальности</h3>
          {data?.completedSpecialties?.length ? (
            <div className="tag-list">
              {data.completedSpecialties.map((spec) => (
                <span key={spec.id} className="tag">
                  {spec.specialty} · {levelLabels[spec.level] ?? spec.level}
                </span>
              ))}
            </div>
          ) : (
            <p>Пока нет подтвержденных специальностей.</p>
          )}
        </article>
        <article className="card">
          <h3>История веточек</h3>
          {data?.twigAwards?.length ? (
            <div className="notification-list">
              {data.twigAwards.map((award) => (
                <div key={award.id} className="notification-item">
                  <header>
                    <strong>{branchTypeLabels[award.type] ?? award.type}</strong>
                    <span>{new Date(award.createdAt).toLocaleDateString()}</span>
                  </header>
                  <p>{award.note || branchAmountLabels[award.type] || `${award.amount} веточек`}</p>
                  {award.organizer ? <small>Начислил: {award.organizer}</small> : null}
                </div>
              ))}
            </div>
          ) : (
            <p>Начислений веточек пока нет.</p>
          )}
        </article>
      </div>

      {isOrganizer ? (
        <div className="form-card">
          <h3>Начислить веточки команде</h3>
          <label className="field">
            Команда
            <select
              className="input"
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamLabel(team)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Основание
            <select
              className="input"
              value={awardType}
              onChange={(event) => setAwardType(event.target.value as typeof awardType)}
            >
              <option value="PARTICIPATION">Участие в мероприятии</option>
              <option value="ACTIVE_PARTICIPATION">Активное участие</option>
              <option value="WIN">Победа</option>
            </select>
          </label>
          <label className="field">
            Комментарий (опционально)
            <input
              className="input"
              value={awardNote}
              onChange={(event) => setAwardNote(event.target.value)}
              placeholder="Например: Турслёт 2026"
            />
          </label>
          <button className="btn primary" onClick={awardBranches} disabled={awarding}>
            Начислить веточки
          </button>
        </div>
      ) : null}
    </section>
  )
}
