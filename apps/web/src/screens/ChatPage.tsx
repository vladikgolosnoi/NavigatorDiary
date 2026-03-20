import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError, getApiOrigin } from '../api/client'
import { useAuth } from '../state/auth'
import { io, Socket } from 'socket.io-client'

type ChatMessageApi = {
  id: string
  type: 'USER' | 'SYSTEM'
  content: string
  createdAt: string
  user?: { id: string; firstName: string; lastName: string } | null
  reactions?: { id: string; userId: string; reaction: string }[]
}

type ChatMessageView = {
  id: string
  type: 'user' | 'system'
  author: string
  content: string
  createdAt: string
  reactions: string[]
}

const reactionPalette = ['👍', '🔥', '✅', '🎉']

export function ChatPage() {
  const { auth } = useAuth()
  const [messages, setMessages] = useState<ChatMessageView[]>([])
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const feedRef = useRef<HTMLDivElement | null>(null)

  const teamId = auth.user?.teamId

  const mapMessage = (message: ChatMessageApi): ChatMessageView => {
    const author = message.user ? `${message.user.lastName} ${message.user.firstName}` : 'Система'
    return {
      id: message.id,
      type: message.type === 'SYSTEM' ? 'system' : 'user',
      author,
      content: message.content,
      createdAt: message.createdAt,
      reactions: message.reactions ? message.reactions.map((reaction) => reaction.reaction) : []
    }
  }

  const loadMessages = useCallback(
    async (showNotice = false) => {
      if (!auth.token || !teamId) {
        return
      }
      try {
        const data = await apiFetch<ChatMessageApi[]>(`/chat/messages?limit=50`, {}, auth.token)
        const mapped = data.map(mapMessage)
        setMessages(mapped)
        if (showNotice) {
          setNotice('Лента сообщений обновлена.')
        }
      } catch (error) {
        const apiError = error as ApiError
        setErrorMessage(apiError.message || 'Не удалось загрузить чат')
      }
    },
    [auth.token, teamId]
  )

  useEffect(() => {
    loadMessages(false)
  }, [loadMessages])

  useEffect(() => {
    if (!auth.token || !teamId) {
      return
    }
    const socket = io(getApiOrigin(), {
      transports: ['polling', 'websocket'],
      auth: {
        token: auth.token
      },
      timeout: 6000,
      reconnectionAttempts: 3
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { teamId })
    })

    socket.on('chat:message', (message: ChatMessageApi) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev
        }
        return [mapMessage(message), ...prev]
      })
    })

    socket.on('chat:reaction', (payload: { messageId: string; reaction: string }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === payload.messageId && !message.reactions.includes(payload.reaction)
            ? { ...message, reactions: [...message.reactions, payload.reaction] }
            : message
        )
      )
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [auth.token, teamId])

  const sendMessage = async () => {
    if (!auth.token) {
      setErrorMessage('Для отправки сообщения требуется вход.')
      return
    }
    if (text.trim().length === 0) {
      return
    }
    try {
      const response = await apiFetch<ChatMessageApi>(
        '/chat/messages',
        {
          method: 'POST',
          body: JSON.stringify({ content: text })
        },
        auth.token
      )
      setMessages((prev) => [mapMessage(response), ...prev])
      setText('')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отправить сообщение')
    }
  }

  const addReaction = async (id: string, reaction: string) => {
    if (!auth.token) {
      setErrorMessage('Для реакции требуется вход.')
      return
    }
    try {
      await apiFetch(
        '/chat/messages/react',
        {
          method: 'POST',
          body: JSON.stringify({ messageId: id, reaction })
        },
        auth.token
      )
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id && !message.reactions.includes(reaction)
            ? { ...message, reactions: [...message.reactions, reaction] }
            : message
        )
      )
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось поставить реакцию')
    }
  }

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [messages])

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Чат команды</h1>
          <p>Общение команды, реакции и автоматические сообщения о достижениях.</p>
          <BadgeRow items={['Лента', 'Реакции', 'Отправка']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={() => loadMessages(true)}>
            Обновить ленту
          </button>
          <button
            className="btn ghost"
            onClick={() => feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            К сообщениям
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="chat-layout">
        <div className="chat-compose" id="chat-compose">
          <textarea
            placeholder="Напишите сообщение..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button className="btn primary" onClick={sendMessage}>
            Отправить
          </button>
        </div>
        <div className="chat-feed" id="chat-feed" ref={feedRef}>
          <article className="chat-card system" id="chat-reactions">
            <header>
              <strong>Реакции</strong>
              <span>поддержка команды</span>
            </header>
            <p>Ставьте эмодзи под сообщениями, чтобы поддержать участников.</p>
            <div className="tag-list">
              {reactionPalette.map((reaction) => (
                <span key={reaction} className="tag">
                  {reaction}
                </span>
              ))}
            </div>
          </article>
          {sortedMessages.map((message) => (
            <article key={message.id} className={`chat-card ${message.type}`}>
              <header>
                <strong>{message.author}</strong>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </header>
              <p>{message.content}</p>
              <div className="chat-reactions">
                {reactionPalette.map((reaction) => (
                  <button
                    key={`${message.id}-${reaction}`}
                    type="button"
                    className={`reaction${message.reactions.includes(reaction) ? ' active' : ''}`}
                    onClick={() => addReaction(message.id, reaction)}
                  >
                    {reaction}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
