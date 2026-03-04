import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'
import progressSteps from '../assets/illustrations/progress-steps.png'
import { scrollToSectionById } from '../utils/scroll'

const weekMs = 7 * 24 * 60 * 60 * 1000

type GoalActivity = {
  id: string
  title: string
  url: string
}

type UserGoal = {
  id: string
  status: string
  comment?: string | null
  lastProgressAt?: string | null
  reactionCount?: number
  progressCount?: number
  goal: {
    id: string
    name: string
    activities: GoalActivity[]
  }
}

type TeamGoal = {
  id: string
  status: string
  reactionCount: number
  reacted: boolean
  user: { id: string; firstName: string; lastName: string }
  goal: { id: string; name: string }
}

const statusMap: Record<string, string> = {
  SELECTED: 'Выбрана',
  IN_PROGRESS: 'В процессе',
  PENDING_CONFIRMATION: 'Ожидает подтверждения',
  ACHIEVED: 'Достигнута'
}

const progressLabels = ['Старт', 'Лучше', 'Ещё лучше', 'Почти достигнута', 'Достигнута']

export function MyGoalsPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [teamGoals, setTeamGoals] = useState<TeamGoal[]>([])
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<UserGoal[]>('/goals/my', {}, auth.token)
      .then((data) => {
        setGoals(data)
        const drafts: Record<string, string> = {}
        data.forEach((goal) => {
          drafts[goal.id] = goal.comment ?? ''
        })
        setCommentDrafts(drafts)
      })
      .catch((error: ApiError) => {
        setErrorMessage(error.message || 'Не удалось загрузить цели')
      })
  }, [auth.token])

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<TeamGoal[]>('/goals/team', {}, auth.token)
      .then((data) => setTeamGoals(data))
      .catch(() => undefined)
  }, [auth.token])

  const markProgress = async (goalId: string) => {
    if (!auth.token) {
      setErrorMessage('Для отметки прогресса требуется вход.')
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/goals/${goalId}/progress`, { method: 'POST', body: JSON.stringify({}) }, auth.token)
      setNotice('Прогресс сохранен!')
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                status: goal.status === 'SELECTED' ? 'IN_PROGRESS' : goal.status,
                lastProgressAt: new Date().toISOString()
              }
            : goal
        )
      )
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отметить прогресс')
    }
  }

  const saveComment = async (goalId: string) => {
    if (!auth.token) {
      setErrorMessage('Для сохранения комментария требуется вход.')
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      const comment = commentDrafts[goalId] ?? ''
      await apiFetch(`/goals/${goalId}/comment`, {
        method: 'PATCH',
        body: JSON.stringify({ comment })
      }, auth.token)
      setNotice('Комментарий сохранен.')
      setGoals((prev) => prev.map((goal) => (goal.id === goalId ? { ...goal, comment } : goal)))
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось сохранить комментарий')
    }
  }

  const canMark = useMemo(() => {
    return goals.reduce<Record<string, boolean>>((acc, goal) => {
      if (!goal.lastProgressAt) {
        acc[goal.id] = true
      } else {
        const diff = Date.now() - new Date(goal.lastProgressAt).getTime()
        acc[goal.id] = diff >= weekMs
      }
      return acc
    }, {})
  }, [goals])

  const getProgressStep = (goal: UserGoal) => {
    if (goal.status === 'ACHIEVED') {
      return progressLabels.length - 1
    }
    const count = goal.progressCount ?? 0
    return Math.min(count, progressLabels.length - 1)
  }

  const nextMarkDate = useMemo(() => {
    return goals.reduce<Record<string, string | null>>((acc, goal) => {
      if (!goal.lastProgressAt) {
        acc[goal.id] = null
      } else {
        const next = new Date(new Date(goal.lastProgressAt).getTime() + weekMs)
        acc[goal.id] = next.toLocaleDateString()
      }
      return acc
    }, {})
  }, [goals])

  const focusProgress = () => {
    if (goals.length === 0) {
      setNotice('Пока нет целей. Выберите их в каталоге.')
      return
    }
    setNotice('Выберите цель ниже и нажмите «Отметить прогресс».')
    scrollToSectionById('goals-list')
  }

  const supportGoal = async (goalId: string) => {
    if (!auth.token) {
      setErrorMessage('Для поддержки цели требуется вход.')
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      const response = await apiFetch<{ reactionCount: number }>(
        `/goals/${goalId}/react`,
        { method: 'POST' },
        auth.token
      )
      setTeamGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId
            ? { ...goal, reacted: true, reactionCount: response.reactionCount }
            : goal
        )
      )
      setNotice('Реакция отправлена. Спасибо за поддержку!')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось поставить реакцию')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Мои цели</h1>
          <p>Отмечайте прогресс по целям не чаще одного раза в неделю.</p>
          <BadgeRow items={['Список', 'Прогресс', 'Комментарии']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={focusProgress}>
            Добавить прогресс
          </button>
          <button className="btn ghost" onClick={() => navigate('/goals/catalog')}>
            Открыть каталог
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="state-grid">
        <article className="card highlight" id="goals-progress">
          <h3>Прогресс</h3>
          <p>Отмечайте следующий уровень не чаще одного раза в неделю.</p>
          <img className="progress-illustration" src={progressSteps} alt="Шкала прогресса целей" />
          <div className="card-footer">
            <span className="pill">1 раз в неделю</span>
            <span className="pill accent">Шкала прогресса</span>
          </div>
        </article>
        <article className="card" id="goals-comments">
          <h3>Комментарии</h3>
          <p>Добавляйте заметки и планы действий — они сохраняются в каждой цели.</p>
          <div className="card-footer">
            <span className="pill">Заметки</span>
          </div>
        </article>
      </div>

      {teamGoals.length ? (
        <div className="card-grid">
          <article className="card">
            <h3>Поддержка целей команды</h3>
            <p>Поддержите цели других навигаторов — нужно минимум 5 голосов.</p>
            <div className="stack-list">
              {teamGoals.map((goal) => (
                <div key={goal.id} className="stack-item">
                  <div>
                    <strong>{goal.goal.name}</strong>
                    <p>
                      {goal.user.lastName} {goal.user.firstName} · реакций: {goal.reactionCount}
                    </p>
                  </div>
                  <div className="stack-actions">
                    <button
                      className="btn ghost"
                      onClick={() => supportGoal(goal.id)}
                      disabled={goal.reacted}
                    >
                      {goal.reacted ? 'Голос принят' : 'Поддержать'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      <div className="card-grid" id="goals-list">
        {goals.map((goal) => (
          <article key={goal.id} className="card">
            <h3>{goal.goal.name}</h3>
            <p>Статус: {statusMap[goal.status] ?? goal.status}</p>
            <p>Уровень прогресса: {progressLabels[getProgressStep(goal)]}</p>
            <p>
              Последняя отметка:{' '}
              {goal.lastProgressAt ? new Date(goal.lastProgressAt).toLocaleDateString() : 'нет данных'}
            </p>
            {!canMark[goal.id] && nextMarkDate[goal.id] ? (
              <p>Следующая отметка: {nextMarkDate[goal.id]}</p>
            ) : null}
            <div className="card-footer">
              <span className="pill">Активности</span>
              <span className="pill accent">1 раз в неделю</span>
            </div>
            <p className="hint">
              Здесь ты можешь найти идеи для активностей, которые помогут достигнуть цели.
            </p>
            <div className="link-list">
              {goal.goal.activities.map((activity) => (
                <a key={activity.id} href={activity.url} target="_blank" rel="noreferrer">
                  {activity.title}
                </a>
              ))}
            </div>
            <div className="comment-box">
              <label>Комментарий к цели</label>
              <textarea
                value={commentDrafts[goal.id] ?? ''}
                onChange={(event) =>
                  setCommentDrafts((prev) => ({ ...prev, [goal.id]: event.target.value }))
                }
                placeholder="Добавьте заметку или план действий"
              />
              <button className="btn ghost" type="button" onClick={() => saveComment(goal.id)}>
                Сохранить комментарий
              </button>
            </div>
            <button
              className="btn ghost"
              onClick={() => markProgress(goal.id)}
              type="button"
              disabled={!canMark[goal.id]}
            >
              Отметить прогресс
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
