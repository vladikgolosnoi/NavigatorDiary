import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'
import checklistSteps from '../assets/illustrations/checklist-steps.png'

const levelMap: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

const statusMap: Record<string, string> = {
  ACTIVE: 'В процессе',
  COMPLETED: 'Подтверждена',
  CANCELLED: 'Отменена'
}

type ChecklistItem = {
  id: string
  title: string
  checked: boolean
}

type SpecialtyPayload = {
  id: string
  status: string
  specialty: { name: string; resources: { id: string; type: 'VIDEO' | 'MATERIAL'; title: string; url: string }[] }
  level: { name: string; checklist: ChecklistItem[] }
  checklistProgress: ChecklistItem[]
}

export function MySpecialtiesPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [specialty, setSpecialty] = useState<SpecialtyPayload | null>(null)
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadSpecialty = useCallback(() => {
    if (!auth.token) {
      return
    }
    setErrorMessage('')
    apiFetch<SpecialtyPayload | null>('/specialties/my', {}, auth.token)
      .then((data) => setSpecialty(data))
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить специальность'))
  }, [auth.token])

  useEffect(() => {
    loadSpecialty()
  }, [loadSpecialty])

  const toggleChecklist = async (itemId: string) => {
    if (!auth.token || !specialty) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(
        `/specialties/${specialty.id}/checklist`,
        {
          method: 'POST',
          body: JSON.stringify({ checklistItemId: itemId })
        },
        auth.token
      )
      setSpecialty({
        ...specialty,
        checklistProgress: specialty.checklistProgress.map((item) =>
          item.id === itemId ? { ...item, checked: true } : item
        )
      })
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отметить пункт')
    }
  }

  if (!specialty) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <h1>Мои специальности</h1>
            <p>Активная специальность пока не выбрана.</p>
            <BadgeRow items={['Чек-лист', 'Материалы', 'Статусы']} />
          </div>
          <div className="screen-actions">
            <button className="btn primary" onClick={() => navigate('/specialties/catalog')}>
              Открыть каталог
            </button>
          </div>
        </header>
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        <div className="state-grid">
          <article className="card highlight">
            <h3>Выберите специальность</h3>
            <p>
              Откройте каталог, выберите одну специальность и уровень. После этого здесь появятся
              чек-лист, материалы и статус подтверждения.
            </p>
            <button className="btn primary" type="button" onClick={() => navigate('/specialties/catalog')}>
              Перейти в каталог специальностей
            </button>
          </article>
        </div>
      </section>
    )
  }

  const checklist = specialty.checklistProgress ?? specialty.level.checklist
  const allChecked = checklist.every((item) => item.checked)
  const needsOrganizer = specialty.level.name === 'SILVER' || specialty.level.name === 'GOLD'
  const approverLabel = needsOrganizer ? 'организатора' : 'руководителя команды'

  const materials = specialty.specialty.resources.filter((item) => item.type === 'MATERIAL')

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Мои специальности</h1>
          <p>Отмечайте пункты чек-листа и следите за статусом подтверждения.</p>
          <BadgeRow items={['Чек-лист', 'Материалы', 'Статусы']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={loadSpecialty}>
            Обновить статус
          </button>
          <button className="btn ghost" onClick={() => navigate('/specialties/catalog')}>
            Открыть каталог
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {allChecked ? (
        <div className="info-banner">
          Чек-лист заполнен. Ожидайте подтверждение от {approverLabel}.
        </div>
      ) : null}

      <div className="card-grid">
        <article className="card" id="specialties-status">
          <h3>{specialty.specialty.name}</h3>
          <p>Уровень: {levelMap[specialty.level.name] ?? specialty.level.name}</p>
          <p>Статус: {statusMap[specialty.status] ?? specialty.status}</p>
          <div className="card-footer">
            <span className="pill">Чек-лист</span>
            <span className="pill accent">Подтверждение</span>
          </div>
        </article>
        <article className="card">
          <h3>Этапы чек-листа</h3>
          <img className="progress-illustration" src={checklistSteps} alt="Шкала чек-листа" />
          <p>Отмечайте пункты по порядку и следите за прогрессом.</p>
        </article>
        <article className="card" id="specialties-checklist">
          <h3>Чек-лист</h3>
          <div className="checklist">
            {checklist.map((item) => (
              <label key={item.id} className="check-item">
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled={item.checked}
                  onChange={() => toggleChecklist(item.id)}
                />
                <span>{item.title}</span>
              </label>
            ))}
          </div>
        </article>
        <article className="card" id="specialties-materials">
          <h3>Материалы</h3>
          <p className="hint">Здесь ты можешь найти материалы для самообразования.</p>
          <div className="link-list">
            {materials.length ? (
              materials.map((material) => (
                <a key={material.id} href={material.url} target="_blank" rel="noreferrer">
                  {material.title}
                </a>
              ))
            ) : (
              <span>Материалы пока недоступны.</span>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
