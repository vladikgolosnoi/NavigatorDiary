import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const readStateKey = 'announcements.read'

type NotificationItem = {
  id: string
  title: string
  body: string
  createdAt: string
  readAt?: string | null
  scope?: string
}

type Announcement = {
  id: string
  title: string
  body: string
  createdAt?: string
}

type MergedItem = {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  type: 'notification' | 'announcement'
}

export function NotificationsPage() {
  const { auth } = useAuth()
  const location = useLocation()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'announcements'>('all')
  const [readAnnouncements, setReadAnnouncements] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return {}
    }
    try {
      const stored = window.localStorage.getItem(readStateKey)
      return stored ? (JSON.parse(stored) as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<NotificationItem[]>('/notifications/my', {}, auth.token)
      .then((data) => setNotifications(data))
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить уведомления'))
  }, [auth.token])

  useEffect(() => {
    apiFetch<Announcement[]>('/announcements/public')
      .then((data) => setAnnouncements(data))
      .catch(() => {
        // ignore
      })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(readStateKey, JSON.stringify(readAnnouncements))
  }, [readAnnouncements])

  useEffect(() => {
    if (!location.hash) {
      return
    }
    if (location.hash === '#notifications-unread') {
      setActiveFilter('unread')
      setFiltersOpen(true)
    }
    if (location.hash === '#notifications-announcements') {
      setActiveFilter('announcements')
      setFiltersOpen(true)
    }
    if (location.hash === '#notifications-all') {
      setActiveFilter('all')
    }
  }, [location.hash])

  const mergedItems: MergedItem[] = useMemo(() => {
    const notificationItems = notifications.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      read: Boolean(item.readAt),
      type: 'notification' as const
    }))
    const announcementItems = announcements.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt ?? new Date().toISOString(),
      read: Boolean(readAnnouncements[item.id]),
      type: 'announcement' as const
    }))
    return [...notificationItems, ...announcementItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [announcements, notifications, readAnnouncements])

  const unreadCount = useMemo(() => mergedItems.filter((item) => !item.read).length, [mergedItems])
  const announcementOnly = useMemo(
    () => mergedItems.filter((item) => item.type === 'announcement'),
    [mergedItems]
  )
  const filteredItems = useMemo(() => {
    if (activeFilter === 'unread') {
      return mergedItems.filter((item) => !item.read)
    }
    if (activeFilter === 'announcements') {
      return mergedItems.filter((item) => item.type === 'announcement')
    }
    return mergedItems
  }, [mergedItems, activeFilter])

  const markAllRead = async () => {
    if (auth.token) {
      await Promise.all(
        notifications
          .filter((item) => !item.readAt)
          .map((item) => apiFetch(`/notifications/${item.id}/read`, { method: 'POST' }, auth.token))
      ).catch(() => undefined)
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })))
    const nextRead: Record<string, boolean> = {}
    announcements.forEach((item) => {
      nextRead[item.id] = true
    })
    setReadAnnouncements((prev) => ({ ...prev, ...nextRead }))
  }

  const toggleRead = async (item: MergedItem) => {
    if (item.type === 'announcement') {
      setReadAnnouncements((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
      return
    }
    if (!auth.token) {
      setErrorMessage('Для отметки уведомления требуется вход.')
      return
    }
    await apiFetch(`/notifications/${item.id}/read`, { method: 'POST' }, auth.token).catch(() => undefined)
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === item.id
          ? { ...notif, readAt: notif.readAt ? null : new Date().toISOString() }
          : notif
      )
    )
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Центр уведомлений</h1>
          <p>Все сообщения от организаторов и анонсы проекта.</p>
          <BadgeRow items={['Все', 'Непрочитанные', 'Анонсы']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={markAllRead}>
            Отметить все прочитанными
          </button>
          <button className="btn ghost" onClick={() => setFiltersOpen((prev) => !prev)}>
            Настроить фильтры
          </button>
        </div>
      </header>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="anchor-target" id="notifications-all" />
      <div className="anchor-target" id="notifications-unread" />
      <div className="anchor-target" id="notifications-announcements" />

      {filtersOpen ? (
        <div className="filter-bar">
          <button
            type="button"
            className={`chip${activeFilter === 'all' ? ' active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Все
          </button>
          <button
            type="button"
            className={`chip${activeFilter === 'unread' ? ' active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Непрочитанные
          </button>
          <button
            type="button"
            className={`chip${activeFilter === 'announcements' ? ' active' : ''}`}
            onClick={() => setActiveFilter('announcements')}
          >
            Только анонсы
          </button>
        </div>
      ) : null}

      <div className="card-grid">
        <article className="card highlight">
          <h3>Сводка</h3>
          <p>Непрочитанных уведомлений: {unreadCount}</p>
          <div className="card-footer">
            <span className="pill">Уведомления</span>
            <span className="pill accent">Анонсы</span>
          </div>
        </article>
        <article className="card">
          <h3>Анонсы</h3>
          <div className="notification-list">
            {announcementOnly.map((item) => (
              <div key={item.id} className={`notification-item ${item.read ? 'read' : ''}`}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="notification-list">
        {filteredItems.map((item) => (
          <article key={item.id} className={`notification-item ${item.read ? 'read' : ''}`}>
            <header>
              <strong>{item.title}</strong>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </header>
            <p>{item.body}</p>
            <div className="card-footer">
              <span className="pill">{item.type === 'announcement' ? 'Анонс' : 'Уведомление'}</span>
              <button className="btn ghost" onClick={() => toggleRead(item)}>
                {item.read ? 'Сделать непрочитанным' : 'Отметить прочитанным'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
