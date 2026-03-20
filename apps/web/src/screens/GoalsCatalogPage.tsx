import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

type Sphere = {
  id: string
  name: string
}

type AgeGroup = {
  id: string
  name: string
  minAge: number
  maxAge: number
}

type Competency = {
  id: string
  name: string
}

type Goal = {
  id: string
  name: string
}

type SelectionState = {
  selectedGoalIds: string[]
  lastSelectedAt?: string
  nextEligibleAt?: string
}

const initialSelection: SelectionState = {
  selectedGoalIds: []
}

export function GoalsCatalogPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [selection, setSelection] = useLocalStorage<SelectionState>('goals.selection', initialSelection)
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [spheres, setSpheres] = useState<Sphere[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeAgeGroupId, setActiveAgeGroupId] = useLocalStorage<string>('goals.age-group', '')
  const [activeSphereId, setActiveSphereId] = useState<string>('')
  const [activeCompetencyId, setActiveCompetencyId] = useState<string>('')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const canSelect = !selection.nextEligibleAt || new Date(selection.nextEligibleAt) <= new Date()
  const selectionLimitReached = selection.selectedGoalIds.length >= 12

  const nextEligibleDate = useMemo(() => {
    if (!selection.nextEligibleAt) {
      return null
    }
    return new Date(selection.nextEligibleAt)
  }, [selection.nextEligibleAt])

  useEffect(() => {
    let active = true
    apiFetch<AgeGroup[]>('/catalogs/age-groups', {}, auth.token)
      .then((data) => {
        if (!active) {
          return
        }
        setAgeGroups(data)
        if (data.length > 0) {
          const exists = data.some((group) => group.id === activeAgeGroupId)
          if (!exists) {
            setActiveAgeGroupId(data[0].id)
          }
        }
      })
      .catch((error: ApiError) => {
        if (active) {
          setErrorMessage(error.message || 'Не удалось загрузить возрастные группы')
        }
      })
    return () => {
      active = false
    }
  }, [activeAgeGroupId, auth.token, setActiveAgeGroupId])

  useEffect(() => {
    if (!activeAgeGroupId) {
      return
    }
    let active = true
    apiFetch<Sphere[]>(`/catalogs/spheres?ageGroupId=${activeAgeGroupId}`, {}, auth.token)
      .then((data) => {
        if (!active) {
          return
        }
        setSpheres(data)
        if (data.length > 0) {
          const nextSphereId = data.some((sphere) => sphere.id === activeSphereId)
            ? activeSphereId
            : data[0].id
          if (nextSphereId !== activeSphereId) {
            setActiveCompetencyId('')
          }
          setActiveSphereId(nextSphereId)
        } else {
          setActiveSphereId('')
          setActiveCompetencyId('')
          setGoals([])
        }
      })
      .catch((error: ApiError) => {
        if (active) {
          setErrorMessage(error.message || 'Не удалось загрузить сферы')
        }
      })
    return () => {
      active = false
    }
  }, [activeAgeGroupId, activeSphereId, auth.token])

  useEffect(() => {
    if (!activeSphereId || !activeAgeGroupId) {
      return
    }
    let active = true
    apiFetch<Competency[]>(
      `/catalogs/competencies?sphereId=${activeSphereId}&ageGroupId=${activeAgeGroupId}`,
      {},
      auth.token
    )
      .then((data) => {
        if (!active) {
          return
        }
        setCompetencies(data)
        if (data.length > 0) {
          setActiveCompetencyId((prev) => prev || data[0].id)
        } else {
          setActiveCompetencyId('')
          setGoals([])
        }
      })
      .catch((error: ApiError) => {
        if (active) {
          setErrorMessage(error.message || 'Не удалось загрузить компетентности')
        }
      })
    return () => {
      active = false
    }
  }, [activeSphereId, activeAgeGroupId, auth.token])

  useEffect(() => {
    if (!activeCompetencyId || !activeAgeGroupId) {
      return
    }
    let active = true
    apiFetch<Goal[]>(
      `/catalogs/goals?competencyId=${activeCompetencyId}&ageGroupId=${activeAgeGroupId}`,
      {},
      auth.token
    )
      .then((data) => {
        if (active) {
          setGoals(data)
        }
      })
      .catch((error: ApiError) => {
        if (active) {
          setErrorMessage(error.message || 'Не удалось загрузить цели')
        }
      })
    return () => {
      active = false
    }
  }, [activeCompetencyId, activeAgeGroupId, auth.token])

  useEffect(() => {
    setGoals([])
  }, [activeAgeGroupId])

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<{ lastSelectedAt: string | null; nextEligibleAt: string | null }>(
      '/goals/selection-info',
      {},
      auth.token
    )
      .then((data) => {
        setSelection((prev) => ({
          ...prev,
          lastSelectedAt: data.lastSelectedAt ?? undefined,
          nextEligibleAt: data.nextEligibleAt ?? undefined
        }))
      })
      .catch(() => {
        // ignore, selection can be local
      })
  }, [auth.token, setSelection])

  const toggleGoal = (goalId: string) => {
    setNotice('')
    setErrorMessage('')
    if (!canSelect) {
      setNotice('Повторный выбор доступен после установленной даты.')
      return
    }
    if (selection.selectedGoalIds.includes(goalId)) {
      setSelection({
        ...selection,
        selectedGoalIds: selection.selectedGoalIds.filter((id) => id !== goalId)
      })
      return
    }
    if (selectionLimitReached) {
      setNotice('Можно выбрать только 12 целей.')
      return
    }
    setSelection({
      ...selection,
      selectedGoalIds: [...selection.selectedGoalIds, goalId]
    })
  }

  const submitSelection = async () => {
    setNotice('')
    setErrorMessage('')
    if (!auth.token) {
      setErrorMessage('Для выбора целей требуется вход.')
      return
    }
    if (!canSelect) {
      setNotice('Срок ожидания еще не закончился.')
      return
    }
    if (selection.selectedGoalIds.length === 0) {
      setNotice('Выберите хотя бы одну цель.')
      return
    }
    try {
      const response = await apiFetch<{
        nextEligibleAt: string
        selectedAt: string
      }>(
        '/goals/select',
        {
          method: 'POST',
          body: JSON.stringify({ goalIds: selection.selectedGoalIds })
        },
        auth.token
      )
      setSelection({
        selectedGoalIds: selection.selectedGoalIds,
        lastSelectedAt: response.selectedAt,
        nextEligibleAt: response.nextEligibleAt
      })
      navigate('/goals/my')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось сохранить выбор целей')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Каталог целей</h1>
          <p>Выберите возраст, сферу, компетентность и цели. Лимит - 12 целей.</p>
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={submitSelection}>
            Сохранить выбор
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('/goals/my')}>
            Мои цели
          </button>
        </div>
      </header>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {notice ? <div className="info-banner">{notice}</div> : null}

      <div className="card-grid">
        <article className="card" id="goals-age">
          <h3>Возрастная группа</h3>
          <p className="hint">Сначала выберите возрастную группу.</p>
          <div className="chip-grid">
            {ageGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`chip${group.id === activeAgeGroupId ? ' active' : ''}`}
                onClick={() => {
                  setActiveAgeGroupId(group.id)
                  setActiveSphereId('')
                  setActiveCompetencyId('')
                }}
              >
                {group.name}
              </button>
            ))}
          </div>
        </article>
        <article className="card" id="goals-spheres">
          <h3>Сферы развития</h3>
          <p className="hint">Выберите сферу развития, которая вам ближе.</p>
          <div className="chip-grid">
            {spheres.map((sphere) => (
              <button
                key={sphere.id}
                type="button"
                className={`chip${sphere.id === activeSphereId ? ' active' : ''}`}
                onClick={() => {
                  setActiveSphereId(sphere.id)
                  setActiveCompetencyId('')
                }}
              >
                {sphere.name}
              </button>
            ))}
          </div>
        </article>
        <article className="card" id="goals-competencies">
          <h3>Компетентности</h3>
          <p className="hint">Выберите компетентность внутри выбранной сферы.</p>
          <div className="chip-grid">
            {competencies.map((competency) => (
              <button
                key={competency.id}
                type="button"
                className={`chip${competency.id === activeCompetencyId ? ' active' : ''}`}
                onClick={() => setActiveCompetencyId(competency.id)}
              >
                {competency.name}
              </button>
            ))}
          </div>
        </article>
        <article className="card" id="goals-targets">
          <h3>Цели</h3>
          <p className="hint">Выберите цели. За один раз можно сохранить до 12 целей.</p>
          <div className="goal-list">
            {goals.map((goal) => {
              const selected = selection.selectedGoalIds.includes(goal.id)
              return (
                <button
                  key={goal.id}
                  type="button"
                  className={`goal-item${selected ? ' selected' : ''}`}
                  onClick={() => toggleGoal(goal.id)}
                  disabled={!canSelect}
                >
                  <span>{goal.name}</span>
                  <strong>{selected ? 'Выбрано' : 'Выбрать'}</strong>
                </button>
              )
            })}
          </div>
        </article>
      </div>

      <div className="state-grid" id="goals-submit">
        <article className="card highlight">
          <h3>Мой выбор</h3>
          <p>Выбрано целей: {selection.selectedGoalIds.length} / 12</p>
          <p>
            Следующий выбор:{' '}
            {nextEligibleDate ? nextEligibleDate.toLocaleDateString('ru-RU') : 'сразу после первого выбора'}
          </p>
          <p className="hint">Повторный выбор целей открывается через 3 месяца после сохранения.</p>
        </article>
      </div>
    </section>
  )
}
