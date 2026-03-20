import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const weekMs = 7 * 24 * 60 * 60 * 1000
const finalProgressStep = 5
const progressPercentages = [0, 15, 30, 50, 75, 100]

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

  const nextMarkDate = useMemo(() => {
    return goals.reduce<Record<string, string | null>>((acc, goal) => {
      if (!goal.lastProgressAt) {
        acc[goal.id] = null
      } else {
        const next = new Date(new Date(goal.lastProgressAt).getTime() + weekMs)
        acc[goal.id] = next.toLocaleDateString('ru-RU')
      }
      return acc
    }, {})
  }, [goals])

  const getProgressStep = (goal: UserGoal) => {
    if (goal.status === 'ACHIEVED' || goal.status === 'PENDING_CONFIRMATION') {
      return finalProgressStep
    }
    return Math.min(goal.progressCount ?? 0, finalProgressStep)
  }

  const markProgress = async (goal: UserGoal) => {
    if (!auth.token) {
      setErrorMessage('Для отметки прогресса требуется вход.')
      return
    }

    const currentStep = getProgressStep(goal)
    const nextStep = currentStep + 1

    if (nextStep > finalProgressStep) {
      setNotice('Для этой цели прогресс уже отмечен полностью.')
      return
    }

    setNotice('')
    setErrorMessage('')

    try {
      await apiFetch(
        `/goals/${goal.id}/progress`,
        {
          method: 'POST',
          body: JSON.stringify({ step: nextStep })
        },
        auth.token
      )

      const nextStatus = nextStep >= finalProgressStep ? 'PENDING_CONFIRMATION' : 'IN_PROGRESS'
      setNotice(
        nextStep >= finalProgressStep
          ? 'Цель отмечена как достигнутая. Теперь команда может поддержать её реакциями.'
          : 'Прогресс сохранён.'
      )
      setGoals((prev) =>
        prev.map((item) =>
          item.id === goal.id
            ? {
                ...item,
                status: nextStatus,
                progressCount: nextStep,
                lastProgressAt: new Date().toISOString()
              }
            : item
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
      await apiFetch(
        `/goals/${goalId}/comment`,
        {
          method: 'PATCH',
          body: JSON.stringify({ comment })
        },
        auth.token
      )
      setNotice('Комментарий сохранён.')
      setGoals((prev) => prev.map((goal) => (goal.id === goalId ? { ...goal, comment } : goal)))
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось сохранить комментарий')
    }
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
      setNotice('Реакция отправлена.')
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
          <p>Выбранные цели появляются здесь. Следующий шаг по каждой цели доступен раз в неделю.</p>
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={() => navigate('/goals/catalog')}>
            Открыть каталог
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="state-grid">
        <article className="card highlight" id="goals-progress">
          <h3>Как работает прогресс</h3>
          <p>Прогресс отмечается по шкале: 0% → 15% → 30% → 50% → 75% → 100%.</p>
          <p className="hint">Новый шаг открывается через 1 неделю после предыдущей отметки.</p>
        </article>
        <article className="card" id="goals-comments">
          <h3>Комментарии</h3>
          <p>Для каждой цели можно сохранить собственную заметку или план действий.</p>
        </article>
      </div>

      {teamGoals.length ? (
        <div className="card-grid">
          <article className="card">
            <h3>Поддержка целей команды</h3>
            <p>Здесь появляются цели, которые другие навигаторы уже отметили как достигнутые.</p>
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
                    <button className="btn ghost" onClick={() => supportGoal(goal.id)} disabled={goal.reacted}>
                      {goal.reacted ? 'Голос принят' : 'Поддержать'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {goals.length === 0 ? (
        <article className="card" id="goals-list">
          <h3>Пока нет выбранных целей</h3>
          <p>Откройте каталог, выберите цели и сохраните их — после этого они появятся здесь.</p>
          <button className="btn primary" type="button" onClick={() => navigate('/goals/catalog')}>
            Перейти в каталог целей
          </button>
        </article>
      ) : (
        <div className="card-grid" id="goals-list">
          {goals.map((goal) => {
            const currentStep = getProgressStep(goal)
            const nextStep = currentStep + 1
            const canAdvance =
              goal.status !== 'ACHIEVED' &&
              goal.status !== 'PENDING_CONFIRMATION' &&
              currentStep < finalProgressStep &&
              canMark[goal.id]

            return (
              <article key={goal.id} className="card">
                <h3>{goal.goal.name}</h3>
                <p>Статус: {statusMap[goal.status] ?? goal.status}</p>
                <p>Текущий прогресс: {progressPercentages[currentStep]}%</p>
                <p>
                  Последняя отметка:{' '}
                  {goal.lastProgressAt ? new Date(goal.lastProgressAt).toLocaleDateString('ru-RU') : 'нет данных'}
                </p>
                {!canMark[goal.id] && nextMarkDate[goal.id] ? (
                  <p>Следующий шаг станет доступен: {nextMarkDate[goal.id]}</p>
                ) : null}

                <div className="goal-progress-scale" aria-label={`Шкала прогресса для цели ${goal.goal.name}`}>
                  {progressPercentages.map((percent, index) => {
                    const isCurrent = index === currentStep
                    const isCompleted = index < currentStep
                    const isClickable = index === nextStep && canAdvance
                    return (
                      <button
                        key={percent}
                        type="button"
                        className={`goal-progress-step${isCompleted ? ' completed' : ''}${isCurrent ? ' current' : ''}${isClickable ? ' clickable' : ''}`}
                        onClick={() => markProgress(goal)}
                        disabled={!isClickable}
                        aria-label={`Отметить прогресс ${percent}%`}
                      >
                        <strong>{percent}%</strong>
                      </button>
                    )
                  })}
                </div>

                <p className="hint">Активности для этой цели будут добавлены позже.</p>

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
                  className="btn primary"
                  type="button"
                  onClick={() => markProgress(goal)}
                  disabled={!canAdvance}
                >
                  Добавить прогресс
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
