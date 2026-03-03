import { useCallback, useEffect, useState } from 'react'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const levelLabels: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

type PendingTeam = {
  id: string
  name: string
  city: string
  institution: string
  createdAt: string
}

type PendingGoal = {
  id: string
  reactionCount: number
  updatedAt: string
  user: { id: string; firstName: string; lastName: string; teamId?: string | null }
  goal: { id: string; name: string }
}

type PendingUser = {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  birthDate?: string
  email?: string | null
  createdAt: string
  team?: { id: string; name: string; city?: string | null; institution?: string | null } | null
}

type PendingSpecialty = {
  id: string
  completedAt?: string | null
  user: { id: string; firstName: string; lastName: string; teamId?: string | null }
  specialty: { id: string; name: string }
  level: { id: string; name: string }
}

type Announcement = {
  id: string
  title: string
  body: string
  isActive: boolean
  publishedAt?: string | null
  createdAt: string
}

type AppealMessage = {
  id: string
  userId?: string | null
  content: string
  createdAt: string
}

type OrganizerAppeal = {
  id: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  createdAt: string
  user: { id: string; firstName: string; lastName: string; email?: string | null }
  team?: { id: string; name: string; city?: string | null } | null
  messages: AppealMessage[]
}

export function OrganizerDashboardPage() {
  const { auth } = useAuth()
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [pendingGoals, setPendingGoals] = useState<PendingGoal[]>([])
  const [pendingSpecialties, setPendingSpecialties] = useState<PendingSpecialty[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [appeals, setAppeals] = useState<OrganizerAppeal[]>([])
  const [appealReplies, setAppealReplies] = useState<Record<string, string>>({})

  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', isActive: true })

  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadDashboard = useCallback(() => {
    if (!auth.token) {
      return
    }
    setErrorMessage('')
    apiFetch<PendingTeam[]>('/teams/pending', {}, auth.token)
      .then(setPendingTeams)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить команды'))

    apiFetch<PendingUser[]>('/users/pending', {}, auth.token)
      .then(setPendingUsers)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить пользователей'))

    apiFetch<PendingGoal[]>('/goals/pending', {}, auth.token)
      .then(setPendingGoals)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить цели'))

    apiFetch<PendingSpecialty[]>('/specialties/pending', {}, auth.token)
      .then(setPendingSpecialties)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить специальности'))

    apiFetch<Announcement[]>('/announcements', {}, auth.token)
      .then(setAnnouncements)
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить анонсы'))

    apiFetch<OrganizerAppeal[]>('/appeals', {}, auth.token)
      .then((data) => {
        setAppeals(data)
        setAppealReplies((prev) => {
          const next = { ...prev }
          data.forEach((appeal) => {
            if (!next[appeal.id]) {
              next[appeal.id] = ''
            }
          })
          return next
        })
      })
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить обращения'))
  }, [auth.token])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const approveTeam = async (teamId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/auth/approve-team/${teamId}`, { method: 'POST' }, auth.token)
      setPendingTeams((prev) => prev.filter((team) => team.id !== teamId))
      setNotice('Команда подтверждена.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось подтвердить команду')
    }
  }

  const rejectTeam = async (teamId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/auth/reject-team/${teamId}`, { method: 'POST' }, auth.token)
      setPendingTeams((prev) => prev.filter((team) => team.id !== teamId))
      setNotice('Команда отклонена.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отклонить команду')
    }
  }

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

  const submitAnnouncement = async () => {
    if (!auth.token) {
      return
    }
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      setErrorMessage('Заполните заголовок и текст анонса.')
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      const created = await apiFetch<Announcement>(
        '/announcements',
        {
          method: 'POST',
          body: JSON.stringify({
            title: announcementForm.title.trim(),
            body: announcementForm.body.trim(),
            isActive: announcementForm.isActive
          })
        },
        auth.token
      )
      setAnnouncements((prev) => [created, ...prev])
      setAnnouncementForm({ title: '', body: '', isActive: true })
      setNotice('Анонс создан.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось создать анонс')
    }
  }

  const toggleAnnouncement = async (announcement: Announcement) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      const updated = await apiFetch<Announcement>(
        `/announcements/${announcement.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: announcement.title,
            body: announcement.body,
            isActive: !announcement.isActive
          })
        },
        auth.token
      )
      setAnnouncements((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setNotice(updated.isActive ? 'Анонс опубликован.' : 'Анонс скрыт.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось обновить анонс')
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/announcements/${id}`, { method: 'DELETE' }, auth.token)
      setAnnouncements((prev) => prev.filter((item) => item.id !== id))
      setNotice('Анонс удалён.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось удалить анонс')
    }
  }

  const replyToAppeal = async (appealId: string) => {
    if (!auth.token) {
      return
    }
    const message = appealReplies[appealId]?.trim() ?? ''
    if (!message) {
      setErrorMessage('Введите текст ответа для обращения.')
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(
        `/appeals/${appealId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ message })
        },
        auth.token
      )
      setAppealReplies((prev) => ({ ...prev, [appealId]: '' }))
      setNotice('Ответ отправлен.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отправить ответ')
    }
  }

  const closeAppeal = async (appealId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/appeals/${appealId}/close`, { method: 'POST' }, auth.token)
      setNotice('Обращение закрыто.')
      loadDashboard()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось закрыть обращение')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Панель организатора</h1>
          <p>Подтверждения команд и участников, а также управление анонсами проекта.</p>
          <BadgeRow items={['Подтверждения', 'Анонсы', 'Права организатора']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={loadDashboard}>
            Обновить
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid" id="organizer-approvals">
        <article className="card">
          <h3>Команды на подтверждение</h3>
          {pendingTeams.length ? (
            <div className="stack-list">
              {pendingTeams.map((team) => (
                <div key={team.id} className="stack-item">
                  <div>
                    <strong>{team.name}</strong>
                    <p>{team.city} · {team.institution}</p>
                  </div>
                  <div className="stack-actions">
                    <button className="btn ghost" onClick={() => approveTeam(team.id)}>
                      Подтвердить
                    </button>
                    <button className="btn ghost" onClick={() => rejectTeam(team.id)}>
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Нет команд на подтверждение.</p>
          )}
        </article>
        <article className="card">
          <h3>Пользователи на подтверждение</h3>
          {pendingUsers.length ? (
            <div className="stack-list">
              {pendingUsers.map((user) => (
                <div key={user.id} className="stack-item">
                  <div>
                    <strong>{user.lastName} {user.firstName}</strong>
                    <p>
                      {user.team ? `${user.team.name}${user.team.city ? ` · ${user.team.city}` : ''}` : 'Без команды'}
                    </p>
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
        <article className="card">
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
        <article className="card">
          <h3>Специальности на подтверждение</h3>
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

      <div className="card-grid">
        <article className="card" id="organizer-announcements">
          <h3>Анонсы</h3>
          <div className="form-stack">
            <input
              className="input"
              value={announcementForm.title}
              onChange={(event) =>
                setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Заголовок анонса"
            />
            <textarea
              className="note-input"
              value={announcementForm.body}
              onChange={(event) =>
                setAnnouncementForm((prev) => ({ ...prev, body: event.target.value }))
              }
              placeholder="Текст анонса"
            />
            <label className="field inline">
              <input
                type="checkbox"
                checked={announcementForm.isActive}
                onChange={(event) =>
                  setAnnouncementForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Публиковать сразу
            </label>
            <button className="btn primary" onClick={submitAnnouncement}>
              Создать анонс
            </button>
          </div>
          <div className="stack-list">
            {announcements.map((item) => (
              <div key={item.id} className="stack-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
                <div className="stack-actions">
                  <button className="btn ghost" onClick={() => toggleAnnouncement(item)}>
                    {item.isActive ? 'Скрыть' : 'Опубликовать'}
                  </button>
                  <button className="btn ghost" onClick={() => deleteAnnouncement(item.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="card" id="organizer-appeals">
          <h3>Обращения онлайн-консультанта</h3>
          {appeals.length ? (
            <div className="stack-list">
              {appeals.map((appeal) => (
                <div key={appeal.id} className="stack-item">
                  <div>
                    <strong>{appeal.subject}</strong>
                    <p>
                      {appeal.user.lastName} {appeal.user.firstName}
                      {appeal.team ? ` · ${appeal.team.name}` : ''}
                      {` · статус: ${appeal.status}`}
                    </p>
                    <div className="appeal-messages">
                      {appeal.messages.slice(-3).map((message) => (
                        <div key={message.id} className="appeal-message">
                          {message.content}
                        </div>
                      ))}
                    </div>
                    {appeal.status !== 'CLOSED' ? (
                      <textarea
                        className="note-input"
                        value={appealReplies[appeal.id] ?? ''}
                        onChange={(event) =>
                          setAppealReplies((prev) => ({ ...prev, [appeal.id]: event.target.value }))
                        }
                        placeholder="Ответ консультанта"
                      />
                    ) : null}
                  </div>
                  <div className="stack-actions">
                    <button
                      className="btn ghost"
                      onClick={() => replyToAppeal(appeal.id)}
                      disabled={appeal.status === 'CLOSED'}
                    >
                      Ответить
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => closeAppeal(appeal.id)}
                      disabled={appeal.status === 'CLOSED'}
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Пока нет обращений от пользователей.</p>
          )}
        </article>
        <article className="card">
          <h3>Командные начисления</h3>
          <p>
            Начисление веточек за командные мероприятия выполняется в разделе
            «Хатка бобра».
          </p>
          <div className="card-footer">
            <span className="pill">Участие: 10</span>
            <span className="pill">Активное участие: 15</span>
            <span className="pill accent">Победа: 20</span>
          </div>
        </article>
      </div>
    </section>
  )
}
