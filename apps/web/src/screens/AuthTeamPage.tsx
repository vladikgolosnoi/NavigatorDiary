import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { BadgeRow } from '../components/BadgeRow'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { apiFetch, ApiError } from '../api/client'

const emptyTeamRegistration = {
  city: '',
  institution: '',
  teamName: ''
}

const emptyTeamLogin = {
  teamCode: ''
}

type TeamStatus = {
  pending: boolean
  ticket?: string
  submittedAt?: string
}

type TeamOption = {
  id: string
  name: string
  city?: string | null
  institution?: string | null
}

export function AuthTeamPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useLocalStorage<'login' | 'register'>('auth.team.mode', 'login')
  const [loginData, setLoginData] = useLocalStorage('auth.team.login', emptyTeamLogin)
  const [registerData, setRegisterData] = useLocalStorage('auth.team.register', emptyTeamRegistration)
  const [status, setStatus] = useLocalStorage<TeamStatus>('auth.team.status', { pending: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loginNotice, setLoginNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (location.hash === '#auth-team-register') {
      setMode('register')
    }
    if (location.hash === '#auth-team-login') {
      setMode('login')
    }
  }, [location.hash, setMode])

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    const nextErrors: Record<string, string> = {}

    if (registerData.city.trim().length < 2) {
      nextErrors.city = 'Укажите населенный пункт'
    }
    if (registerData.institution.trim().length < 2) {
      nextErrors.institution = 'Укажите образовательное учреждение'
    }
    if (registerData.teamName.trim().length < 2) {
      nextErrors.teamName = 'Укажите название команды'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      try {
        setLoading(true)
        const response = await apiFetch<{ id: string; status: string }>('/auth/register-team', {
          method: 'POST',
          body: JSON.stringify({
            name: registerData.teamName,
            city: registerData.city,
            institution: registerData.institution
          })
        })
        setStatus({ pending: true, ticket: response.id, submittedAt: new Date().toISOString() })
      } catch (error) {
        const apiError = error as ApiError
        setErrorMessage(apiError.message || 'Не удалось отправить заявку')
      } finally {
        setLoading(false)
      }
    }
  }

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (loginData.teamCode.trim().length < 3) {
      nextErrors.teamCode = 'Введите код или название команды'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setLoginNotice('')
      setErrorMessage('')
      setLoading(true)
      try {
        const teams = await apiFetch<TeamOption[]>('/teams/public')
        const lookup = loginData.teamCode.trim().toLowerCase()
        const match = teams.find(
          (team) =>
            team.id === loginData.teamCode.trim() ||
            team.name.toLowerCase().includes(lookup)
        )
        if (!match) {
          setLoginNotice('Команда не найдена. Проверьте название или код.')
          return
        }
        setLoginNotice(
          `Команда найдена: ${match.name}. Вход выполняется через учетную запись руководителя.`
        )
        navigate('/auth/user#auth-user-login')
      } catch (error) {
        const apiError = error as ApiError
        setErrorMessage(apiError.message || 'Не удалось проверить команду')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Авторизация / Регистрация команды</h1>
          <p>Регистрация команды доступна после подтверждения организатором проекта.</p>
          <BadgeRow items={['Населенный пункт', 'Учреждение', 'Название команды']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={() => navigate('/extra#extra-chat')}>
            Связаться с консультантом
          </button>
          <button className="btn ghost" onClick={() => navigate('/extra')}>
            Получить памятку
          </button>
        </div>
      </header>

      {status.pending ? (
        <div className="card status-card">
          <h3>Заявка на регистрацию команды отправлена</h3>
          <p>
            Статус: <strong>ожидает подтверждения организатором</strong>
          </p>
          <p>
            Номер заявки: <strong>{status.ticket}</strong>
          </p>
          <p>Дата отправки: {status.submittedAt ? new Date(status.submittedAt).toLocaleString() : ''}</p>
          <button
            className="btn ghost"
            onClick={() => setStatus({ pending: false })}
            type="button"
          >
            Сбросить заявку
          </button>
        </div>
      ) : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="toggle">
        <button
          type="button"
          className={mode === 'login' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setMode('login')}
        >
          Вход команды
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setMode('register')}
        >
          Регистрация команды
        </button>
      </div>

      <div className="form-grid">
        {mode === 'login' ? (
          <form className="form-card" id="auth-team-login" onSubmit={submitLogin}>
            <h3>Авторизация команды</h3>
            <FormField label="Код или название команды" error={errors.teamCode}>
              <input
                className="input"
                value={loginData.teamCode}
                onChange={(event) => setLoginData({ ...loginData, teamCode: event.target.value })}
                placeholder="Например, Навигаторы-Ростов"
              />
            </FormField>
            {loginNotice ? <div className="info-banner">{loginNotice}</div> : null}
            <button className="btn primary" type="submit" disabled={loading}>
              Войти
            </button>
          </form>
        ) : (
          <form className="form-card" id="auth-team-register" onSubmit={submitRegister}>
            <h3>Регистрация новой команды</h3>
            <FormField label="Населенный пункт" error={errors.city}>
              <input
                className="input"
                value={registerData.city}
                onChange={(event) => setRegisterData({ ...registerData, city: event.target.value })}
                placeholder="Ростов-на-Дону"
              />
            </FormField>
            <FormField label="Образовательное учреждение" error={errors.institution}>
              <input
                className="input"
                value={registerData.institution}
                onChange={(event) => setRegisterData({ ...registerData, institution: event.target.value })}
                placeholder="Гимназия №..."
              />
            </FormField>
            <FormField label="Название команды" error={errors.teamName}>
              <input
                className="input"
                value={registerData.teamName}
                onChange={(event) => setRegisterData({ ...registerData, teamName: event.target.value })}
                placeholder="Навигаторы света"
              />
            </FormField>
            <button className="btn primary" type="submit" disabled={loading}>
              Отправить заявку
            </button>
          </form>
        )}

        <aside className="form-card muted" id="auth-team-help">
          <h3>Что дальше</h3>
          <p>После регистрации организатор подтвердит команду. Это может занять до 1-2 дней.</p>
          <ul className="list">
            <li>Проверьте корректность данных команды.</li>
            <li>Подготовьте список участников и руководителя.</li>
            <li>Следите за уведомлениями на главной странице.</li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
