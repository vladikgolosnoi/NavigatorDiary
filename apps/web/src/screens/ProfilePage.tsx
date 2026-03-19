import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeRow } from '../components/BadgeRow'
import { FormField } from '../components/FormField'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'
import { formatDateForDisplay, maskDateInput, normalizeDateValue } from '../utils/dateInput'

const initialProfile = {
  lastName: '',
  firstName: '',
  middleName: '',
  birthDate: '',
  email: ''
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(initialProfile)
  const [passwords, setPasswords] = useState({ current: '', next: '', repeat: '' })
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState('')
  const { auth, setAuth } = useAuth()
  const role = auth.user?.role

  const primaryAction =
    role === 'NAVIGATOR'
      ? { label: 'Перейти к целям', path: '/goals/my' }
      : role === 'LEADER'
        ? { label: 'Открыть панель руководителя', path: '/leader' }
        : role === 'ORGANIZER'
          ? { label: 'Открыть панель организатора', path: '/organizer' }
          : { label: 'На главную', path: '/home' }

  const secondaryAction =
    role === 'NAVIGATOR'
      ? { label: 'Открыть достижения', path: '/achievements' }
      : role === 'LEADER'
        ? { label: 'Открыть чат команды', path: '/chat' }
        : role === 'ORGANIZER'
          ? { label: 'Открыть хатку бобра', path: '/beaver-hut' }
          : { label: 'Дополнительно', path: '/extra' }

  const quickLinks = [
    {
      title: 'Мои цели',
      description: 'Переходите к списку целей и отметкам прогресса.',
      path: '/goals/my',
      roles: ['NAVIGATOR']
    },
    {
      title: 'Мои специальности',
      description: 'Чек-листы и материалы по специальностям.',
      path: '/specialties/my',
      roles: ['NAVIGATOR']
    },
    {
      title: 'Мои достижения',
      description: 'Статус, этап и полученные уровни.',
      path: '/achievements',
      roles: ['NAVIGATOR']
    },
    {
      title: 'Хатка бобра',
      description: 'Жёлуди, веточки и поленья за достижения.',
      path: '/beaver-hut',
      roles: ['NAVIGATOR']
    },
    {
      title: 'Чат команды',
      description: 'Общение с участниками и реакции.',
      path: '/chat',
      roles: ['NAVIGATOR', 'LEADER']
    },
    {
      title: 'Руководитель',
      description: 'Подтверждения и управление участниками.',
      path: '/leader',
      roles: ['LEADER']
    },
    {
      title: 'Организатор',
      description: 'Панель подтверждений и рассылок.',
      path: '/organizer',
      roles: ['ORGANIZER']
    },
    {
      title: 'Дополнительно',
      description: 'Условия использования и консультант.',
      path: '/extra'
    }
  ]

  const visibleLinks = quickLinks.filter(
    (link) => !link.roles || (role && link.roles.includes(role))
  )

  useEffect(() => {
    const authUser = auth.user

    if (!authUser) {
      return
    }

    setProfile((prev) => ({
      ...prev,
      lastName: prev.lastName || authUser.lastName || '',
      firstName: prev.firstName || authUser.firstName || '',
      middleName: prev.middleName || authUser.middleName || ''
    }))
  }, [auth.user])

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<{
      firstName: string
      lastName: string
      middleName?: string | null
      birthDate: string
      email?: string | null
    }>('/users/me', {}, auth.token)
      .then((data) => {
        const nextProfile = {
          lastName: data.lastName ?? '',
          firstName: data.firstName ?? '',
          middleName: data.middleName ?? '',
          birthDate: data.birthDate ? formatDateForDisplay(new Date(data.birthDate).toISOString().slice(0, 10)) : '',
          email: data.email ?? ''
        }
        setProfile(nextProfile)
        setAuth((prev) =>
          prev.user
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  firstName: data.firstName ?? prev.user.firstName,
                  lastName: data.lastName ?? prev.user.lastName,
                  middleName: data.middleName ?? null
                }
              }
            : prev
        )
      })
      .catch((error: ApiError) => {
        setErrorMessage(error.message || 'Не удалось загрузить профиль')
      })
  }, [auth.token, setAuth])

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setNotice('')
    setErrorMessage('')
    const nextErrors: Record<string, string> = {}
    if (profile.lastName.trim().length < 2) {
      nextErrors.lastName = 'Введите фамилию'
    }
    if (profile.firstName.trim().length < 2) {
      nextErrors.firstName = 'Введите имя'
    }
    if (!profile.birthDate) {
      nextErrors.birthDate = 'Введите дату рождения'
    } else if (!normalizeDateValue(profile.birthDate)) {
      nextErrors.birthDate = 'Неверный формат даты'
    }
    if (profile.email.trim().length < 5) {
      nextErrors.email = 'Введите email'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      if (!auth.token) {
        setErrorMessage('Для сохранения профиля требуется вход.')
        return
      }
      try {
        const normalizedBirthDate = normalizeDateValue(profile.birthDate)
        if (!normalizedBirthDate) {
          setErrors((prev) => ({ ...prev, birthDate: 'Неверный формат даты' }))
          return
        }
        const updatedProfile = await apiFetch<{
          id: string
          firstName: string
          lastName: string
          middleName?: string | null
          birthDate: string
          email?: string | null
        }>('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({
            firstName: profile.firstName,
            lastName: profile.lastName,
            middleName: profile.middleName,
            birthDate: normalizedBirthDate,
            email: profile.email
          })
        }, auth.token)
        setProfile({
          lastName: updatedProfile.lastName ?? '',
          firstName: updatedProfile.firstName ?? '',
          middleName: updatedProfile.middleName ?? '',
          birthDate: updatedProfile.birthDate
            ? formatDateForDisplay(new Date(updatedProfile.birthDate).toISOString().slice(0, 10))
            : '',
          email: updatedProfile.email ?? ''
        })
        setAuth((prev) =>
          prev.user
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  firstName: updatedProfile.firstName ?? prev.user.firstName,
                  lastName: updatedProfile.lastName ?? prev.user.lastName,
                  middleName: updatedProfile.middleName ?? null
                }
              }
            : prev
        )
        setNotice('Данные профиля сохранены.')
      } catch (error) {
        const apiError = error as ApiError
        setErrorMessage(apiError.message || 'Не удалось сохранить профиль')
      }
    }
  }

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setNotice('')
    setErrorMessage('')
    const nextErrors: Record<string, string> = {}
    if (passwords.current.trim().length < 6) {
      nextErrors.current = 'Введите текущий пароль'
    }
    if (passwords.next.trim().length < 6) {
      nextErrors.next = 'Пароль должен быть минимум 6 символов'
    }
    if (passwords.next !== passwords.repeat) {
      nextErrors.repeat = 'Пароли не совпадают'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      if (!auth.token) {
        setErrorMessage('Для смены пароля требуется вход.')
        return
      }
      try {
        await apiFetch('/users/me/change-password', {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: passwords.current,
            newPassword: passwords.next
          })
        }, auth.token)
        setNotice('Пароль обновлен.')
        setPasswords({ current: '', next: '', repeat: '' })
      } catch (error) {
        const apiError = error as ApiError
        setErrorMessage(apiError.message || 'Не удалось изменить пароль')
      }
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Личный кабинет</h1>
          <p>Проверьте данные профиля, смените пароль и переходите к целям.</p>
          <BadgeRow items={['Профиль', 'Смена пароля', 'Переходы']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={() => navigate(primaryAction.path)}>
            {primaryAction.label}
          </button>
          <button className="btn ghost" onClick={() => navigate(secondaryAction.path)}>
            {secondaryAction.label}
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="form-grid">
        <form className="form-card" id="profile-data" onSubmit={submitProfile}>
          <h3>Данные профиля</h3>
          <FormField label="Фамилия" error={errors.lastName}>
            <input
              className="input"
              value={profile.lastName}
              onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
            />
          </FormField>
          <FormField label="Имя" error={errors.firstName}>
            <input
              className="input"
              value={profile.firstName}
              onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
            />
          </FormField>
          <FormField label="Отчество">
            <input
              className="input"
              value={profile.middleName}
              onChange={(event) => setProfile({ ...profile, middleName: event.target.value })}
            />
          </FormField>
          <FormField label="Дата рождения" error={errors.birthDate}>
            <input
              className="input"
              type="text"
              value={profile.birthDate}
              onChange={(event) => setProfile({ ...profile, birthDate: maskDateInput(event.target.value) })}
              inputMode="numeric"
              autoComplete="bday"
              placeholder="ДД.ММ.ГГГГ"
              maxLength={10}
            />
            <small className="field-hint">Можно вводить дату вручную, без долгой прокрутки календаря.</small>
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input
              className="input"
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
          </FormField>
          <button className="btn primary" type="submit">
            Сохранить изменения
          </button>
        </form>

        <div className="form-card" id="profile-password">
          <h3>Смена пароля</h3>
          <form onSubmit={submitPassword} className="form-stack">
            <FormField label="Текущий пароль" error={errors.current}>
              <input
                className="input"
                type="password"
                value={passwords.current}
                onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
              />
            </FormField>
            <FormField label="Новый пароль" error={errors.next}>
              <input
                className="input"
                type="password"
                value={passwords.next}
                onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
              />
            </FormField>
            <FormField label="Повторите пароль" error={errors.repeat}>
              <input
                className="input"
                type="password"
                value={passwords.repeat}
                onChange={(event) => setPasswords({ ...passwords, repeat: event.target.value })}
              />
            </FormField>
            <button className="btn ghost" type="submit">
              Обновить пароль
            </button>
          </form>
        </div>
      </div>

      <div className="card-grid" id="profile-links">
        {visibleLinks.map((link) => (
          <article key={link.title} className="card">
            <h3>{link.title}</h3>
            <p>{link.description}</p>
            <button className="btn ghost" onClick={() => navigate(link.path)}>
              Открыть
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
