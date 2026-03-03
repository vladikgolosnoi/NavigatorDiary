import { useEffect, useState } from 'react'
import { FormField } from '../components/FormField'
import { BadgeRow } from '../components/BadgeRow'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import type { UserRole } from '../state/navigation'

type TeamOption = {
  id: string
  name: string
  city?: string | null
  institution?: string | null
}

const emptyUserRegister = {
  lastName: '',
  firstName: '',
  middleName: '',
  birthDate: '',
  teamId: '',
  email: '',
  password: ''
}

const emptyUserLogin = {
  email: '',
  password: ''
}

type UserStatus = {
  pending: boolean
  ticket?: string
  submittedAt?: string
}

function getAge(birthDate: string) {
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1
  }
  return age
}

export function AuthUserPage() {
  const [mode, setMode] = useLocalStorage<'login' | 'register'>('auth.user.mode', 'login')
  const [loginData, setLoginData] = useLocalStorage('auth.user.login', emptyUserLogin)
  const [registerData, setRegisterData] = useLocalStorage('auth.user.register', emptyUserRegister)
  const [status, setStatus] = useLocalStorage<UserStatus>('auth.user.status', { pending: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loginNotice, setLoginNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [teamsError, setTeamsError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [teams, setTeams] = useState<TeamOption[]>([])

  useEffect(() => {
    if (location.hash === '#auth-user-register') {
      setMode('register')
    }
    if (location.hash === '#auth-user-login') {
      setMode('login')
    }
  }, [location.hash, setMode])

  useEffect(() => {
    let active = true
    setTeamsError('')
    apiFetch<TeamOption[]>('/teams/public')
      .then((data) => {
        if (!active) {
          return
        }
        setTeams(data)
      })
      .catch((error: ApiError) => {
        if (active) {
          setTeamsError(error.message || 'Не удалось загрузить список команд')
        }
      })
    return () => {
      active = false
    }
  }, [])

  const getTeamLabel = (team: TeamOption) => {
    const parts = [team.name, team.city].filter(Boolean)
    return parts.join(' · ')
  }

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    const nextErrors: Record<string, string> = {}
    if (registerData.lastName.trim().length < 2) {
      nextErrors.lastName = 'Введите фамилию'
    }
    if (registerData.firstName.trim().length < 2) {
      nextErrors.firstName = 'Введите имя'
    }
    if (!registerData.birthDate) {
      nextErrors.birthDate = 'Укажите дату рождения'
    } else {
      const age = getAge(registerData.birthDate)
      if (age === null) {
        nextErrors.birthDate = 'Неверный формат даты'
      } else if (age < 6 || age > 22) {
        nextErrors.birthDate = 'Возраст должен быть от 6 до 22 лет'
      }
    }
    if (!registerData.teamId) {
      nextErrors.teamId = 'Выберите команду'
    }
    if (registerData.email.trim().length < 5) {
      nextErrors.email = 'Укажите email для входа'
    }
    if (registerData.password.trim().length < 6) {
      nextErrors.password = 'Пароль должен быть не короче 6 символов'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      try {
        setLoading(true)
        const response = await apiFetch<{ id: string; status: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            middleName: registerData.middleName,
            birthDate: registerData.birthDate,
            email: registerData.email,
            password: registerData.password,
            teamId: registerData.teamId
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
    setErrorMessage('')
    const nextErrors: Record<string, string> = {}
    if (loginData.email.trim().length < 5) {
      nextErrors.email = 'Введите email'
    }
    if (loginData.password.trim().length < 6) {
      nextErrors.password = 'Введите пароль'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      try {
        setLoading(true)
        const response = await apiFetch<{
          accessToken: string
          user: {
            id: string
            firstName: string
            lastName: string
            middleName?: string
            role: UserRole
            teamId?: string
          }
        }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: loginData.email,
            password: loginData.password
          })
        })
        setAuth({ token: response.accessToken, user: response.user })
        const redirect = typeof window !== 'undefined' ? window.localStorage.getItem('auth.redirect') : null
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('auth.redirect')
        }
        navigate(redirect || '/home')
      } catch (error) {
        const apiError = error as ApiError
        setLoginNotice('')
        setErrorMessage(apiError.message || 'Не удалось выполнить вход')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Авторизация / Регистрация пользователя</h1>
          <p>Регистрация доступна после подтверждения руководителем команды.</p>
          <BadgeRow items={['Фамилия и имя', 'Дата рождения', 'Выбор команды']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={() => navigate('/extra#extra-chat')}>
            Задать вопрос
          </button>
          <button className="btn ghost" onClick={() => navigate('/extra')}>
            Правила участия
          </button>
        </div>
      </header>

      {status.pending ? (
        <div className="card status-card">
          <h3>Заявка на регистрацию отправлена</h3>
          <p>
            Статус: <strong>ожидает подтверждения руководителем</strong>
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
      {teamsError ? <div className="error-banner">{teamsError}</div> : null}

      <div className="toggle">
        <button
          type="button"
          className={mode === 'login' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setMode('login')}
        >
          Вход
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setMode('register')}
        >
          Регистрация
        </button>
      </div>

      <div className="form-grid">
        {mode === 'login' ? (
          <form className="form-card" id="auth-user-login" onSubmit={submitLogin}>
            <h3>Вход в аккаунт</h3>
            <FormField label="Email" error={errors.email}>
              <input
                className="input"
                type="email"
                value={loginData.email}
                onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Пароль" error={errors.password}>
              <input
                className="input"
                type="password"
                value={loginData.password}
                onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                placeholder="Пароль"
              />
            </FormField>
            {loginNotice ? <div className="info-banner">{loginNotice}</div> : null}
            <button className="btn primary" type="submit" disabled={loading}>
              Войти
            </button>
          </form>
        ) : (
          <form className="form-card" id="auth-user-register" onSubmit={submitRegister}>
            <h3>Регистрация навигатора</h3>
            <FormField label="Фамилия" error={errors.lastName}>
              <input
                className="input"
                value={registerData.lastName}
                onChange={(event) => setRegisterData({ ...registerData, lastName: event.target.value })}
                placeholder="Иванов"
              />
            </FormField>
            <FormField label="Имя" error={errors.firstName}>
              <input
                className="input"
                value={registerData.firstName}
                onChange={(event) => setRegisterData({ ...registerData, firstName: event.target.value })}
                placeholder="Иван"
              />
            </FormField>
            <FormField label="Отчество">
              <input
                className="input"
                value={registerData.middleName}
                onChange={(event) => setRegisterData({ ...registerData, middleName: event.target.value })}
                placeholder="Иванович"
              />
            </FormField>
            <FormField label="Дата рождения" error={errors.birthDate}>
              <input
                className="input"
                type="date"
                value={registerData.birthDate}
                onChange={(event) => setRegisterData({ ...registerData, birthDate: event.target.value })}
              />
            </FormField>
            <FormField label="Команда" error={errors.teamId}>
              <select
                className="input"
                value={registerData.teamId}
                onChange={(event) => setRegisterData({ ...registerData, teamId: event.target.value })}
              >
                <option value="">Выберите команду</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {getTeamLabel(team)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Email" error={errors.email}>
              <input
                className="input"
                type="email"
                value={registerData.email}
                onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Пароль" error={errors.password}>
              <input
                className="input"
                type="password"
                value={registerData.password}
                onChange={(event) => setRegisterData({ ...registerData, password: event.target.value })}
                placeholder="Минимум 6 символов"
              />
            </FormField>
            <button className="btn primary" type="submit" disabled={loading}>
              Отправить заявку
            </button>
          </form>
        )}

        <aside className="form-card muted" id="auth-user-help">
          <h3>Подсказки</h3>
          <p>После регистрации руководитель команды подтвердит вашу заявку.</p>
          <ul className="list">
            <li>Подготовьте правильные данные и дату рождения.</li>
            <li>Если команды нет, попросите руководителя создать ее.</li>
            <li>Доступ к целям появится после подтверждения.</li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
