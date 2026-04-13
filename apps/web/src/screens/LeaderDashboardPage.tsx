import { useCallback, useEffect, useState } from 'react'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const levelLabels: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

type PendingUser = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  birthDate?: string
  email?: string | null
  createdAt: string
}

type PendingGoal = {
  id: string
  reactionCount: number
  updatedAt: string
  user: { id: string; firstName: string; lastName: string }
  goal: { id: string; name: string }
}

type PendingSpecialty = {
  id: string
  completedAt?: string | null
  user: { id: string; firstName: string; lastName: string }
  specialty: { id: string; name: string }
  level: { id: string; name: string }
}

type LeaderAnalyticsOverview = {
  generatedAt: string
  summary: {
    teamsTotal: number
    activeUsersTotal: number
    navigatorsTotal: number
    leadersTotal: number
    goalsSelectedTotal: number
    goalsAchievedTotal: number
    specialtiesSelectedTotal: number
    specialtiesCompletedTotal: number
  }
  teamStats: Array<{
    teamId: string
    teamName: string
    city: string
    institution: string
    membersTotal: number
    navigatorsTotal: number
    leadersTotal: number
    goalsSelected: number
    goalsAchieved: number
    specialtiesSelected: number
    specialtiesCompleted: number
    uniqueSpecialties: string[]
  }>
  specialtyBreakdown: Array<{
    specialtyName: string
    level: string
    usersTotal: number
    teams: string[]
  }>
  goalStatusBreakdown: Array<{ status: string; label: string; count: number }>
  specialtyStatusBreakdown: Array<{ status: string; label: string; count: number }>
  specialtyLevelBreakdown: Array<{ level: string; label: string; count: number }>
  userStats: Array<{
    userId: string
    fullName: string
    teamName: string
    role: string
    goalsSelected: number
    goalsAchieved: number
    specialtiesSelected: number
    specialtiesCompleted: number
  }>
  goalRows: Array<{
    id: string
    fullName: string
    teamName: string
    role: string
    goalName: string
    competencyName: string
    sphereName: string
    statusLabel: string
    reactions: number
    lastProgressAt: string
  }>
  specialtyRows: Array<{
    id: string
    fullName: string
    teamName: string
    role: string
    specialtyName: string
    levelLabel: string
    statusLabel: string
    checklistDone: number
    checklistTotal: number
    startedAt: string
    confirmedAt: string
  }>
}

export function LeaderDashboardPage() {
  const { auth, setAuth } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [pendingGoals, setPendingGoals] = useState<PendingGoal[]>([])
  const [pendingSpecialties, setPendingSpecialties] = useState<PendingSpecialty[]>([])
  const [analytics, setAnalytics] = useState<LeaderAnalyticsOverview | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [currentTeam, setCurrentTeam] = useState<{
    id: string
    name: string
    city?: string | null
    institution?: string | null
    status: string
  } | null>(null)
  const [teamDraft, setTeamDraft] = useState({ name: '', institution: '' })
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [savingTeam, setSavingTeam] = useState(false)

  const loadDashboard = useCallback(() => {
    if (!auth.token) {
      return
    }
    setErrorMessage('')
    apiFetch<PendingUser[]>('/users/pending', {}, auth.token)
      .then(setPendingUsers)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить пользователей'))

    apiFetch<PendingGoal[]>('/goals/pending', {}, auth.token)
      .then(setPendingGoals)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить цели'))

    apiFetch<PendingSpecialty[]>('/specialties/pending', {}, auth.token)
      .then(setPendingSpecialties)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить специальности'))

    apiFetch<{
      team: {
        id: string
        name: string
        city?: string | null
        institution?: string | null
        status: string
      } | null
    }>('/users/me', {}, auth.token)
      .then((profile) => setCurrentTeam(profile.team))
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить данные команды'))

    setAnalyticsLoading(true)
    apiFetch<LeaderAnalyticsOverview>('/analytics/leader/overview', {}, auth.token)
      .then(setAnalytics)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить сводку команды'))
      .finally(() => setAnalyticsLoading(false))
  }, [auth.token])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const approveUser = async (userId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/auth/approve-user/${userId}`, { method: 'POST' }, auth.token)
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId))
      setNotice('Пользователь подтверждён.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось подтвердить пользователя')
    }
  }

  const rejectUser = async (userId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/auth/reject-user/${userId}`, { method: 'POST' }, auth.token)
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId))
      setNotice('Пользователь отклонён.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отклонить пользователя')
    }
  }

  const confirmGoal = async (goalId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/goals/${goalId}/confirm`, { method: 'POST' }, auth.token)
      setPendingGoals((prev) => prev.filter((goal) => goal.id !== goalId))
      setNotice('Цель подтверждена.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось подтвердить цель')
    }
  }

  const confirmSpecialty = async (specialtyId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/specialties/${specialtyId}/confirm`, { method: 'POST' }, auth.token)
      setPendingSpecialties((prev) => prev.filter((spec) => spec.id !== specialtyId))
      setNotice('Специальность подтверждена.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось подтвердить специальность')
    }
  }

  const rejectSpecialty = async (specialtyId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/specialties/${specialtyId}/reject`, { method: 'POST' }, auth.token)
      setPendingSpecialties((prev) => prev.filter((spec) => spec.id !== specialtyId))
      setNotice('Специальность отклонена и может быть подана повторно.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отклонить специальность')
    }
  }

  const createTeam = async () => {
    setNotice('')
    setErrorMessage('')
    if (teamDraft.name.trim().length < 2) {
      setErrorMessage('Укажите название команды.')
      return
    }
    if (teamDraft.institution.trim().length < 2) {
      setErrorMessage('Укажите образовательное учреждение.')
      return
    }
    if (currentTeam) {
      setErrorMessage('У руководителя уже есть привязанная команда.')
      return
    }

    try {
      setSavingTeam(true)
      const createdTeam = await apiFetch<{
        id: string
        name: string
        city?: string | null
        institution?: string | null
        status: string
      }>(
        '/teams/leader/create',
        {
          method: 'POST',
          body: JSON.stringify({
            name: teamDraft.name.trim(),
            institution: teamDraft.institution.trim()
          })
        },
        auth.token
      )
      setCurrentTeam(createdTeam)
      setAuth((prev) =>
        prev.user
          ? {
              ...prev,
              user: {
                ...prev.user,
                teamId: createdTeam.id
              }
            }
          : prev
      )
      setTeamDraft({ name: '', institution: '' })
      setNotice('Заявка на новую команду отправлена организатору.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось создать заявку на команду')
    } finally {
      setSavingTeam(false)
    }
  }

  const formatDisplayDate = (value: string) =>
    value ? new Date(value).toLocaleDateString('ru-RU') : '—'

  const analyticsCards = analytics
    ? [
        { label: 'Участники команды', value: analytics.summary.activeUsersTotal },
        { label: 'Навигаторы', value: analytics.summary.navigatorsTotal },
        { label: 'Руководители', value: analytics.summary.leadersTotal },
        { label: 'Выбрано целей', value: analytics.summary.goalsSelectedTotal },
        { label: 'Достигнуто целей', value: analytics.summary.goalsAchievedTotal },
        { label: 'Подтверждено специальностей', value: analytics.summary.specialtiesCompletedTotal }
      ]
    : []

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Панель руководителя</h1>
          <p>Подтверждение участников, целей и специальностей команды.</p>
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={loadDashboard}>
            Обновить
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid" id="leader-approvals">
        <article className="card" id="leader-users">
          <h3>Пользователи на подтверждение</h3>
          {pendingUsers.length ? (
            <div className="stack-list">
              {pendingUsers.map((user) => (
                <div key={user.id} className="stack-item">
                  <div>
                    <strong>{user.lastName} {user.firstName}</strong>
                    <p>{user.email || 'email не указан'}</p>
                  </div>
                  <div className="stack-actions">
                    <button className="btn ghost" onClick={() => approveUser(user.id)}>
                      Подтвердить
                    </button>
                    <button className="btn ghost" onClick={() => rejectUser(user.id)}>
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Нет пользователей на подтверждение.</p>
          )}
        </article>
        <article className="card" id="leader-goals">
          <h3>Цели на подтверждение</h3>
          {pendingGoals.length ? (
            <div className="stack-list">
              {pendingGoals.map((goal) => (
                <div key={goal.id} className="stack-item">
                  <div>
                    <strong>{goal.goal.name}</strong>
                    <p>
                      {goal.user.lastName} {goal.user.firstName} · реакций: {goal.reactionCount}
                    </p>
                  </div>
                  <button className="btn ghost" onClick={() => confirmGoal(goal.id)}>
                    Подтвердить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>Нет целей для подтверждения.</p>
          )}
        </article>
        <article className="card" id="leader-create-team">
          <h3>Создать команду</h3>
          <p>Новая команда уйдёт организатору на подтверждение. У руководителя может быть только одна команда.</p>
          {currentTeam ? (
            <div className="inline-card profile-team-card">
              <h4>Моя команда</h4>
              <div className="stack-list">
                <div className="stack-item">
                  <div>
                    <strong>{currentTeam.name}</strong>
                    <p>{currentTeam.institution || 'Учреждение не указано'}</p>
                    <p>{currentTeam.city || 'Город не указан'}</p>
                  </div>
                  <span className="pill">{currentTeam.status === 'ACTIVE' ? 'Активна' : 'На подтверждении'}</span>
                </div>
              </div>
            </div>
          ) : null}
          <label className="field">
            Название команды
            <input
              className="input"
              value={teamDraft.name}
              onChange={(event) => setTeamDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Например, Дружина Ростова"
            />
          </label>
          <label className="field">
            Образовательное учреждение
            <input
              className="input"
              value={teamDraft.institution}
              onChange={(event) =>
                setTeamDraft((prev) => ({ ...prev, institution: event.target.value }))
              }
              placeholder="Например, школа № 12"
            />
          </label>
          <button
            className="btn primary"
            type="button"
            onClick={createTeam}
            disabled={savingTeam || Boolean(currentTeam)}
          >
            {currentTeam ? 'Команда уже привязана' : 'Создать команду'}
          </button>
        </article>
        <article className="card">
          <h3>Специальности (бронза)</h3>
          {pendingSpecialties.length ? (
            <div className="stack-list">
              {pendingSpecialties.map((spec) => (
                <div key={spec.id} className="stack-item">
                  <div>
                    <strong>{spec.specialty.name}</strong>
                    <p>
                      {spec.user.lastName} {spec.user.firstName} · {levelLabels[spec.level.name] ?? spec.level.name}
                    </p>
                  </div>
                  <div className="stack-actions">
                    <button className="btn ghost" onClick={() => confirmSpecialty(spec.id)}>
                      Подтвердить
                    </button>
                    <button className="btn ghost" onClick={() => rejectSpecialty(spec.id)}>
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Нет специальностей для подтверждения.</p>
          )}
        </article>
      </div>

      <div className="card-grid" id="leader-analytics">
        <article className="card highlight">
          <h3>Сводка команды</h3>
          <p className="hint">
            Руководитель видит ту же картину по своей команде: цели, специальности и общий прогресс участников.
          </p>
          <div className="stack-actions">
            {analytics ? <span className="pill">Обновлено: {formatDisplayDate(analytics.generatedAt)}</span> : null}
          </div>
          {analyticsLoading ? (
            <p>Загружаю сводку...</p>
          ) : analytics ? (
            <>
              <div className="analytics-summary-grid">
                {analyticsCards.map((item) => (
                  <div key={item.label} className="analytics-stat">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="analytics-chip-grid">
                {analytics.goalStatusBreakdown.map((item) => (
                  <span key={`leader-goal-${item.status}`} className="pill">
                    {item.label}: {item.count}
                  </span>
                ))}
                {analytics.specialtyStatusBreakdown.map((item) => (
                  <span key={`leader-specialty-${item.status}`} className="pill accent">
                    {item.label}: {item.count}
                  </span>
                ))}
                {analytics.specialtyLevelBreakdown.map((item) => (
                  <span key={`leader-level-${item.level}`} className="pill">
                    {item.label}: {item.count}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p>Сводка пока недоступна.</p>
          )}
        </article>

        <article className="card">
          <h3>По моей команде</h3>
          {analytics?.teamStats.length ? (
            <div className="analytics-table">
              {analytics.teamStats.map((team) => (
                <div key={team.teamId} className="analytics-row">
                  <div className="analytics-row-main">
                    <strong>{team.teamName}</strong>
                    <p>{[team.city, team.institution].filter(Boolean).join(' · ') || 'Данные команды'}</p>
                    <small>
                      Участники: {team.membersTotal} · Навигаторы: {team.navigatorsTotal} · Руководители: {team.leadersTotal}
                    </small>
                  </div>
                  <div className="analytics-metric">
                    <span>Цели</span>
                    <strong>{team.goalsAchieved} / {team.goalsSelected}</strong>
                  </div>
                  <div className="analytics-metric">
                    <span>Спец.</span>
                    <strong>{team.specialtiesCompleted} / {team.specialtiesSelected}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>У руководителя пока нет активной команды.</p>
          )}
        </article>

        <article className="card">
          <h3>Выбор специальностей</h3>
          {analytics?.specialtyBreakdown.length ? (
            <div className="stack-list">
              {analytics.specialtyBreakdown.slice(0, 8).map((item) => (
                <div key={`${item.specialtyName}-${item.level}`} className="stack-item">
                  <div>
                    <strong>{item.specialtyName} · {item.level}</strong>
                    <p>Команд: {item.teams.length}</p>
                  </div>
                  <div className="stack-actions">
                    <span className="pill">{item.usersTotal} участников</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Пока нет выбранных специальностей.</p>
          )}
        </article>

        <article className="card">
          <h3>Кто уже продвигается лучше всех</h3>
          {analytics?.userStats.length ? (
            <div className="stack-list">
              {analytics.userStats.slice(0, 8).map((user) => (
                <div key={user.userId} className="stack-item">
                  <div>
                    <strong>{user.fullName}</strong>
                    <p>{user.teamName} · {user.role}</p>
                  </div>
                  <div className="stack-actions">
                    <span className="pill">Цели: {user.goalsAchieved} / {user.goalsSelected}</span>
                    <span className="pill accent">Спец.: {user.specialtiesCompleted} / {user.specialtiesSelected}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Пока нет данных по пользователям.</p>
          )}
        </article>

        <article className="card">
          <h3>Детали по целям</h3>
          {analytics?.goalRows.length ? (
            <div className="analytics-table">
              {analytics.goalRows.map((row) => (
                <div key={row.id} className="analytics-row analytics-row-detailed">
                  <div className="analytics-row-main">
                    <strong>{row.goalName}</strong>
                    <p>{row.fullName} · {row.teamName || 'Без команды'} · {row.role}</p>
                    <small>{row.sphereName} · {row.competencyName}</small>
                  </div>
                  <div className="analytics-metric">
                    <span>Статус</span>
                    <strong>{row.statusLabel}</strong>
                  </div>
                  <div className="analytics-metric">
                    <span>Реакции</span>
                    <strong>{row.reactions}</strong>
                  </div>
                  <div className="analytics-metric">
                    <span>Прогресс</span>
                    <strong>{formatDisplayDate(row.lastProgressAt)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>По целям пока нет данных.</p>
          )}
        </article>

        <article className="card">
          <h3>Детали по специальностям</h3>
          {analytics?.specialtyRows.length ? (
            <div className="analytics-table">
              {analytics.specialtyRows.map((row) => (
                <div key={row.id} className="analytics-row analytics-row-detailed">
                  <div className="analytics-row-main">
                    <strong>{row.specialtyName} · {row.levelLabel}</strong>
                    <p>{row.fullName} · {row.teamName || 'Без команды'} · {row.role}</p>
                    <small>Чек-лист: {row.checklistDone} / {row.checklistTotal}</small>
                  </div>
                  <div className="analytics-metric">
                    <span>Статус</span>
                    <strong>{row.statusLabel}</strong>
                  </div>
                  <div className="analytics-metric">
                    <span>Начата</span>
                    <strong>{formatDisplayDate(row.startedAt)}</strong>
                  </div>
                  <div className="analytics-metric">
                    <span>Подтверждена</span>
                    <strong>{formatDisplayDate(row.confirmedAt)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>По специальностям пока нет данных.</p>
          )}
        </article>
      </div>
    </section>
  )
}
