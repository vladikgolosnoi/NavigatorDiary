import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

type AppealMessage = {
  id?: string
  author?: string
  content: string
  createdAt: string
  userId?: string
}

type Appeal = {
  id: string
  subject: string
  status: string
  messages: AppealMessage[]
}

export function AppealsPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const statusSummary = useMemo(() => {
    return appeals.reduce<Record<string, number>>((acc, appeal) => {
      acc[appeal.status] = (acc[appeal.status] ?? 0) + 1
      return acc
    }, {})
  }, [appeals])

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<Appeal[]>('/appeals/my', {}, auth.token)
      .then((data) => setAppeals(data))
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить обращения'))
  }, [auth.token])

  const createAppeal = async () => {
    if (!auth.token) {
      setErrorMessage('Для отправки обращения требуется вход.')
      return
    }
    if (!subject.trim() || !message.trim()) {
      return
    }
    try {
      const newAppeal = await apiFetch<Appeal>(
        '/appeals',
        {
          method: 'POST',
          body: JSON.stringify({ subject: subject.trim(), message: message.trim() })
        },
        auth.token
      )
      setAppeals((prev) => [newAppeal, ...prev])
      setSubject('')
      setMessage('')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отправить обращение')
    }
  }

  const replyToAppeal = async (appealId: string) => {
    if (!auth.token) {
      return
    }
    const draft = replyDrafts[appealId]
    if (!draft?.trim()) {
      return
    }
    try {
      const response = await apiFetch<AppealMessage>(
        `/appeals/${appealId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ message: draft.trim() })
        },
        auth.token
      )
      setAppeals((prev) =>
        prev.map((appeal) =>
          appeal.id === appealId
            ? { ...appeal, messages: [...appeal.messages, response] }
            : appeal
        )
      )
      setReplyDrafts((prev) => ({ ...prev, [appealId]: '' }))
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отправить сообщение')
    }
  }

  const closeAppeal = async (appealId: string) => {
    if (!auth.token) {
      return
    }
    try {
      await apiFetch(`/appeals/${appealId}/close`, { method: 'POST' }, auth.token)
      setAppeals((prev) => prev.map((appeal) => (appeal.id === appealId ? { ...appeal, status: 'CLOSED' } : appeal)))
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось закрыть обращение')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Обращения к организаторам</h1>
          <p>Задайте вопрос или отправьте запрос организаторам проекта.</p>
          <BadgeRow items={['Мои обращения', 'Новое обращение', 'Статусы']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={createAppeal}>
            Отправить обращение
          </button>
          <button className="btn ghost" onClick={() => navigate('/extra')}>
            Справка
          </button>
        </div>
      </header>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid">
        <article className="card" id="appeals-new">
          <h3>Новое обращение</h3>
          <input
            className="input"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Тема обращения"
          />
          <textarea
            className="note-input"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Опишите ваш вопрос"
          />
        </article>
        <article className="card" id="appeals-status">
          <h3>Статусы обращений</h3>
          <p>Открытые: {statusSummary.OPEN ?? 0}</p>
          <p>В работе: {statusSummary.IN_PROGRESS ?? 0}</p>
          <p>Закрытые: {statusSummary.CLOSED ?? 0}</p>
        </article>
        <article className="card" id="appeals-list">
          <h3>Мои обращения</h3>
          <div className="appeal-list">
            {appeals.map((appeal) => (
              <div key={appeal.id} className="appeal-card">
                <header>
                  <strong>{appeal.subject}</strong>
                  <span>{appeal.status}</span>
                </header>
                <div className="appeal-messages">
                  {appeal.messages.map((msg, index) => {
                    const isMine = msg.userId && msg.userId === auth.user?.id
                    return (
                      <div
                        key={`${appeal.id}-${index}`}
                        className={`appeal-message ${isMine ? 'user' : 'org'}`}
                      >
                        <p>{msg.content}</p>
                        <small>{new Date(msg.createdAt).toLocaleString()}</small>
                      </div>
                    )
                  })}
                </div>
                <div className="appeal-actions">
                  <input
                    className="input"
                    value={replyDrafts[appeal.id] ?? ''}
                    onChange={(event) =>
                      setReplyDrafts((prev) => ({ ...prev, [appeal.id]: event.target.value }))
                    }
                    placeholder="Ответить"
                  />
                  <div className="card-footer">
                    <button className="btn ghost" onClick={() => replyToAppeal(appeal.id)}>
                      Ответить
                    </button>
                    <button className="btn ghost" onClick={() => closeAppeal(appeal.id)}>
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
