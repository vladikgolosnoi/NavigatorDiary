import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeRow } from '../components/BadgeRow'
import { MascotBadgeRow } from '../components/AchievementBadges'
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

type TeamOption = {
  id: string
  name: string
  city?: string | null
  institution?: string | null
}

type TeamMember = {
  id: string
  firstName: string
  lastName: string
  role: string
}

export function BeaverHutPage() {
  const { auth } = useAuth()
  const [data, setData] = useState<BeaverHutData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  const [teams, setTeams] = useState<TeamOption[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [awardType, setAwardType] = useState<'PARTICIPATION' | 'ACTIVE_PARTICIPATION' | 'WIN'>('PARTICIPATION')
  const [awardNote, setAwardNote] = useState('')
  const [awarding, setAwarding] = useState(false)
  const [adjustment, setAdjustment] = useState({
    resourceType: 'ACORN' as 'ACORN' | 'TWIG' | 'LOG',
    amount: '',
    note: ''
  })
  const [adjusting, setAdjusting] = useState(false)

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
      .catch(() => undefined)
  }, [])

  const isOrganizer = auth.user?.role === 'ORGANIZER'

  useEffect(() => {
    if (!isOrganizer || !auth.token || !selectedTeamId) {
      return
    }
    apiFetch<TeamMember[]>(`/teams/${selectedTeamId}/users`, {}, auth.token)
      .then((payload) => {
        setTeamMembers(payload)
        if (payload.length > 0) {
          setSelectedUserId((prev) => (payload.some((user) => user.id === prev) ? prev : payload[0].id))
        } else {
          setSelectedUserId('')
        }
      })
      .catch((error: ApiError) => {
        setErrorMessage(error.message || 'Не удалось загрузить участников команды')
      })
  }, [auth.token, isOrganizer, selectedTeamId])

  const teamLabel = (team: TeamOption) => {
    const parts = [team.name, team.institution].filter(Boolean)
    return parts.join(' · ')
  }

  const awardBranches = async () => {
    if (!auth.token) {
      setErrorMessage('Для начисления желудей требуется вход.')
      return
    }
    if (!selectedTeamId) {
      setErrorMessage('Выберите команду для начисления желудей.')
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
      setNotice(`Начислено: ${response.amount} желудей каждому участнику (${response.awarded} чел.).`)
      setAwardNote('')
      loadData()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось начислить жёлуди')
    } finally {
      setAwarding(false)
    }
  }

  const adjustResource = async () => {
    if (!auth.token) {
      setErrorMessage('Для корректировки ресурсов требуется вход.')
      return
    }
    if (!selectedUserId) {
      setErrorMessage('Выберите участника.')
      return
    }

    const amount = Number(adjustment.amount)
    if (!Number.isInteger(amount) || amount === 0) {
      setErrorMessage('Укажите целое число. Положительное — начисление, отрицательное — списание.')
      return
    }

    setErrorMessage('')
    setNotice('')
    try {
      setAdjusting(true)
      const response = await apiFetch<{ resourceLabel: string; amount: number }>(
        '/beaver-hut/adjust',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: selectedUserId,
            resourceType: adjustment.resourceType,
            amount,
            note: adjustment.note.trim() || undefined
          })
        },
        auth.token
      )
      setAdjustment((prev) => ({ ...prev, amount: '', note: '' }))
      setNotice(
        `${response.resourceLabel}: ${response.amount > 0 ? 'начислено' : 'списано'} ${Math.abs(response.amount)}.`
      )
      loadData()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось скорректировать баланс')
    } finally {
      setAdjusting(false)
    }
  }

  const summaryCards = useMemo(() => getBeaverSummaryCards(data), [data])

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Хатка бобра</h1>
          <p>Сокровища вашего прогресса: веточки, жёлуди и поленья.</p>
          <BadgeRow items={['Веточки', 'Жёлуди', 'Поленья']} />
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
            <li>Веточки: старт 6, путь 24, тропа 48, маршрут 72, экспедиция 144, успех 216.</li>
            <li>Жёлуди: участие 10, активное участие 15, победа 20.</li>
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
            <p>Пока нет подтверждённых специальностей.</p>
          )}
        </article>
        <article className="card">
          <h3>История начислений</h3>
          {data?.twigAwards?.length ? (
            <div className="notification-list">
              {data.twigAwards.map((award) => (
                <div key={award.id} className="notification-item">
                  <header>
                    <strong>{branchTypeLabels[award.type] ?? award.type}</strong>
                    <span>{new Date(award.createdAt).toLocaleDateString()}</span>
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
      </div>

      {data?.adjustments?.length ? (
        <article className="card">
          <h3>История корректировок</h3>
          <div className="notification-list">
            {data.adjustments.map((adjustmentItem) => (
              <div key={adjustmentItem.id} className="notification-item">
                <header>
                  <strong>{resourceLabels[adjustmentItem.resourceType]}</strong>
                  <span>{new Date(adjustmentItem.createdAt).toLocaleDateString()}</span>
                </header>
                <p>
                  {adjustmentItem.amount > 0 ? '+' : ''}
                  {adjustmentItem.amount} · {adjustmentItem.note || 'Корректировка организатором'}
                </p>
                {adjustmentItem.organizer ? <small>Изменил: {adjustmentItem.organizer}</small> : null}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {isOrganizer ? (
        <div className="card-grid">
          <div className="form-card">
            <h3>Начислить жёлуди команде</h3>
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
              Начислить жёлуди
            </button>
          </div>

          <div className="form-card" id="beaver-adjustments">
            <h3>Начислить или снять ресурсы</h3>
            <p>Положительное число начисляет ресурс, отрицательное — списывает.</p>
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
              Участник
              <select
                className="input"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                {teamMembers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.lastName} {user.firstName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Ресурс
              <select
                className="input"
                value={adjustment.resourceType}
                onChange={(event) =>
                  setAdjustment((prev) => ({
                    ...prev,
                    resourceType: event.target.value as typeof adjustment.resourceType
                  }))
                }
              >
                <option value="ACORN">Веточки</option>
                <option value="TWIG">Жёлуди</option>
                <option value="LOG">Поленья</option>
              </select>
            </label>
            <label className="field">
              Количество
              <input
                className="input"
                value={adjustment.amount}
                onChange={(event) => setAdjustment((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="Например: 10 или -5"
                inputMode="numeric"
              />
            </label>
            <label className="field">
              Комментарий
              <input
                className="input"
                value={adjustment.note}
                onChange={(event) => setAdjustment((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Например: участие в мастер-классе"
              />
            </label>
            <button className="btn primary" onClick={adjustResource} disabled={adjusting}>
              Сохранить корректировку
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
