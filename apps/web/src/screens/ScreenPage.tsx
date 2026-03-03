import { useLocation } from 'react-router-dom'
import { ScreenConfig } from '../state/navigation'
import { BadgeRow } from '../components/BadgeRow'
import { LogoCluster } from '../components/LogoCluster'
import { useScreenDraft } from '../hooks/useScreenDraft'
import { useLastState } from '../state/lastState'
import { useState } from 'react'

export function ScreenPage({ title, description, badges, showLogos }: ScreenConfig) {
  const location = useLocation()
  const [draft, setDraft] = useScreenDraft(location.pathname)
  const lastState = useLastState()
  const [notice, setNotice] = useState('')

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
          <BadgeRow items={badges} />
        </div>
        <div className="screen-actions">
          <button
            className="btn primary"
            onClick={() => setNotice('Подсказки будут добавлены на этом экране.')}
          >
            Открыть подсказки
          </button>
          <button
            className="btn ghost"
            onClick={() => setNotice('Прогресс сохраняется автоматически.')}
          >
            Сохранить прогресс
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}

      {showLogos ? <LogoCluster /> : null}

      <div className="card-grid">
        <article className="card">
          <h3>Что дальше</h3>
          <p>Выберите следующий шаг и отметьте его прогрессом или задачей.</p>
          <div className="card-footer">
            <span className="pill">Совет дня</span>
            <span className="pill accent">Командная задача</span>
          </div>
        </article>
        <article className="card">
          <h3>Фокус недели</h3>
          <p>Один небольшой шаг каждую неделю дает устойчивый результат.</p>
          <div className="card-footer">
            <span className="pill">1 раз в неделю</span>
            <span className="pill">Отметка прогресса</span>
          </div>
        </article>
        <article className="card">
          <h3>Поддержка команды</h3>
          <p>Используйте чат, реакции и комментарии для взаимной помощи.</p>
          <div className="card-footer">
            <span className="pill">Командный чат</span>
            <span className="pill">Реакции</span>
          </div>
        </article>
      </div>

      <div className="state-grid">
        <article className="card highlight">
          <h3>Последнее сохраненное состояние</h3>
          {lastState ? (
            <p>
              Экран: <strong>{lastState.title}</strong> · {new Date(lastState.savedAt).toLocaleString()}
            </p>
          ) : (
            <p>Пока нет сохраненных данных. Перейдите по экрану, чтобы сохранить состояние.</p>
          )}
          <div className="card-footer">
            <span className="pill">LocalStorage</span>
            <span className="pill accent">Автосохранение</span>
          </div>
        </article>
        <article className="card">
          <h3>Мой черновик на этом экране</h3>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Запишите идею или заметку. Текст сохраняется автоматически."
          />
          <div className="card-footer">
            <span className="pill">Восстановление данных</span>
            <span className="pill">Локальный черновик</span>
          </div>
        </article>
      </div>
    </section>
  )
}
