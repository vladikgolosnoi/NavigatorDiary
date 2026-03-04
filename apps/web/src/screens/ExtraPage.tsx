import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'
import { scrollToSectionById } from '../utils/scroll'

type AppealMessage = {
  id: string
  content: string
  createdAt: string
}

type Appeal = {
  id: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  createdAt: string
  messages: AppealMessage[]
}

const statusMap: Record<Appeal['status'], string> = {
  OPEN: 'Открыто',
  IN_PROGRESS: 'В работе',
  CLOSED: 'Закрыто'
}

export function ExtraPage() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [appealReplies, setAppealReplies] = useState<Record<string, string>>({})

  const loadAppeals = useCallback(() => {
    if (!auth.token) {
      setAppeals([])
      return
    }
    apiFetch<Appeal[]>('/appeals/my', {}, auth.token)
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
      .catch(() => {
        // ignore
      })
  }, [auth.token])

  useEffect(() => {
    loadAppeals()
  }, [loadAppeals])

  const focusTerms = () => {
    setNotice('Правила доступны ниже на странице.')
    scrollToSectionById('extra-terms')
  }

  const focusConsultant = () => {
    setNotice('Откройте блок онлайн-консультанта ниже на странице.')
    scrollToSectionById('extra-chat')
  }

  const sendToConsultant = async () => {
    setNotice('')
    setErrorMessage('')
    if (!auth.token) {
      setErrorMessage('Для обращения к консультанту выполните вход.')
      navigate('/auth/user#auth-user-login')
      return
    }
    if (message.trim().length < 3) {
      setErrorMessage('Введите сообщение (минимум 3 символа).')
      return
    }
    try {
      setSending(true)
      await apiFetch(
        '/appeals',
        {
          method: 'POST',
          body: JSON.stringify({
            subject: 'Онлайн-консультант',
            message: message.trim()
          })
        },
        auth.token
      )
      setNotice('Сообщение консультанту отправлено.')
      setMessage('')
      loadAppeals()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отправить сообщение консультанту')
    } finally {
      setSending(false)
    }
  }

  const replyAppeal = async (appealId: string) => {
    if (!auth.token) {
      return
    }
    const text = appealReplies[appealId]?.trim() ?? ''
    if (!text) {
      setErrorMessage('Введите сообщение для ответа.')
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(
        `/appeals/${appealId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ message: text })
        },
        auth.token
      )
      setAppealReplies((prev) => ({ ...prev, [appealId]: '' }))
      setNotice('Ответ отправлен консультанту.')
      loadAppeals()
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
      loadAppeals()
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось закрыть обращение')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Дополнительно</h1>
          <p>Условия использования, конфиденциальность и онлайн-консультант.</p>
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={focusTerms}>
            Открыть правила
          </button>
          <button className="btn ghost" onClick={focusConsultant}>
            Онлайн-консультант
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid">
        <article className="card" id="extra-terms">
          <h3>Условия использования</h3>
          <p>
            Проект предназначен для подростков и молодежи. Пользователь обязуется соблюдать правила
            общения и безопасного поведения.
          </p>
        </article>
        <article className="card" id="extra-privacy">
          <h3>Конфиденциальность</h3>
          <p>
            Все данные хранятся на сервере проекта и не передаются третьим лицам.
          </p>
        </article>
        <article className="card" id="extra-chat">
          <h3>Онлайн-консультант</h3>
          <p>Раздел для связи с онлайн-консультантом проекта.</p>
          <label className="field">
            Вопрос консультанту
            <textarea
              className="note-input"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Опишите вопрос или проблему"
            />
          </label>
          <button className="btn primary" onClick={sendToConsultant} disabled={sending}>
            Отправить
          </button>
          {auth.token ? (
            <div className="stack-list">
              {appeals.length ? (
                appeals.map((appeal) => (
                  <div key={appeal.id} className="stack-item">
                    <div>
                      <strong>{appeal.subject}</strong>
                      <p>Статус: {statusMap[appeal.status]}</p>
                      <div className="appeal-messages">
                        {appeal.messages.slice(-3).map((appealMessage) => (
                          <div key={appealMessage.id} className="appeal-message">
                            {appealMessage.content}
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
                          placeholder="Ваш ответ консультанту"
                        />
                      ) : null}
                    </div>
                    <div className="stack-actions">
                      <button
                        className="btn ghost"
                        onClick={() => replyAppeal(appeal.id)}
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
                ))
              ) : (
                <p>Ваших обращений пока нет.</p>
              )}
            </div>
          ) : (
            <p className="hint">Чтобы видеть ответы консультанта, войдите в аккаунт.</p>
          )}
        </article>
      </div>
    </section>
  )
}
