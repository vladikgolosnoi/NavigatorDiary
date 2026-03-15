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

export function LeaderDashboardPage() {
  const { auth } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [pendingGoals, setPendingGoals] = useState<PendingGoal[]>([])
  const [pendingSpecialties, setPendingSpecialties] = useState<PendingSpecialty[]>([])
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
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось подтвердить специальность')
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

    try {
      setSavingTeam(true)
      await apiFetch(
        '/auth/register-team',
        {
          method: 'POST',
          body: JSON.stringify({
            name: teamDraft.name.trim(),
            institution: teamDraft.institution.trim()
          })
        },
        auth.token
      )
      setTeamDraft({ name: '', institution: '' })
      setNotice('Заявка на новую команду отправлена организатору.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось создать заявку на команду')
    } finally {
      setSavingTeam(false)
    }
  }

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
          <p>Новая команда уйдёт организатору на подтверждение.</p>
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
            disabled={savingTeam}
          >
            Создать команду
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
                  <button className="btn ghost" onClick={() => confirmSpecialty(spec.id)}>
                    Подтвердить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>Нет специальностей для подтверждения.</p>
          )}
        </article>
      </div>
    </section>
  )
}
