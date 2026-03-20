import { useCallback, useEffect, useState } from 'react'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'
import { levelLabels, resourceDescriptions, resourceLabels } from '../features/beaverHut'

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

    apiFetch<TeamOption[]>('/teams/public')
      .then((payload) => {
        setTeams(payload)
        if (payload.length > 0) {
          setSelectedTeamId((prev) => prev || payload[0].id)
        }
      })
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить команды для начислений'))
  }, [auth.token])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (!auth.token || !selectedTeamId) {
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
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить участников команды'))
  }, [auth.token, selectedTeamId])

  const teamLabel = (team: TeamOption) => {
    const parts = [team.name, team.institution].filter(Boolean)
    return parts.join(' · ')
  }

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

  const awardBranches = async () => {
    if (!auth.token) {
      setErrorMessage('Для начисления желудей требуется вход.')
      return
    }
    if (!selectedTeamId) {
      setErrorMessage('Выберите команду для начисления желудей.')
      return
    }
    setNotice('')
    setErrorMessage('')
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
      setAwardNote('')
      setNotice(`Начислено: ${response.amount} желудей каждому участнику (${response.awarded} чел.).`)
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

    setNotice('')
    setErrorMessage('')
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
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось скорректировать баланс')
    } finally {
      setAdjusting(false)
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
          <p>Подтверждения, анонсы, обращения и управление ресурсами участников на одной странице.</p>
          <BadgeRow items={['Подтверждения', 'Анонсы', 'Ресурсы']} />
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
      </div>

      <div className="card-grid" id="organizer-resources">
        <article className="card">
          <h3>Правила ресурсов</h3>
          <ul className="list">
            <li>{resourceLabels.ACORN}: статусы и продвижение по этапам достижений.</li>
            <li>{resourceLabels.TWIG}: атрибутика, сувениры и бонусы от организаторов.</li>
            <li>{resourceLabels.LOG}: участие в мастер-классах и мероприятиях партнёров.</li>
          </ul>
          <p className="hint">
            За командные мероприятия организатор начисляет жёлуди: участие — 10, активное участие — 15,
            победа — 20.
          </p>
        </article>

        <div className="form-card">
          <h3>Начислить жёлуди команде</h3>
          <label className="field">
            Команда
            <select className="input" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamLabel(team)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Основание
            <select className="input" value={awardType} onChange={(event) => setAwardType(event.target.value as typeof awardType)}>
              <option value="PARTICIPATION">Участие в мероприятии</option>
              <option value="ACTIVE_PARTICIPATION">Активное участие</option>
              <option value="WIN">Победа</option>
            </select>
          </label>
          <label className="field">
            Комментарий
            <input
              className="input"
              value={awardNote}
              onChange={(event) => setAwardNote(event.target.value)}
              placeholder="Например: городской слёт"
            />
          </label>
          <button className="btn primary" type="button" onClick={awardBranches} disabled={awarding}>
            Начислить жёлуди
          </button>
        </div>

        <div className="form-card">
          <h3>Начислить или снять ресурсы</h3>
          <p>{resourceDescriptions[adjustment.resourceType]}</p>
          <label className="field">
            Команда
            <select className="input" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamLabel(team)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Участник
            <select className="input" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
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
              <option value="ACORN">{resourceLabels.ACORN}</option>
              <option value="TWIG">{resourceLabels.TWIG}</option>
              <option value="LOG">{resourceLabels.LOG}</option>
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
              placeholder="Например: победа в конкурсе"
            />
          </label>
          <button className="btn primary" type="button" onClick={adjustResource} disabled={adjusting}>
            Сохранить корректировку
          </button>
        </div>
      </div>
    </section>
  )
}
