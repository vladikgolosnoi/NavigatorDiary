import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [specialties, setSpecialties] = useState<SpecialtyPayload[]>([])
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadSpecialties = useCallback(() => {
    if (!auth.token) {
      return
    }
    setErrorMessage('')
    apiFetch<SpecialtyPayload[]>('/specialties/my', {}, auth.token)
      .then((data) => setSpecialties(data))
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить специальности'))
  }, [auth.token])

  useEffect(() => {
    loadSpecialties()
  }, [loadSpecialties])

  const toggleChecklist = async (userSpecialtyId: string, itemId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(
        `/specialties/${userSpecialtyId}/checklist`,
        {
          method: 'POST',
          body: JSON.stringify({ checklistItemId: itemId })
        },
        auth.token
      )
      setSpecialties((prev) =>
        prev.map((specialty) =>
          specialty.id === userSpecialtyId
            ? {
                ...specialty,
                checklistProgress: specialty.checklistProgress.map((item) =>
                  item.id === itemId ? { ...item, checked: true } : item
                )
              }
            : specialty
        )
      )
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось отметить пункт')
    }
  }

  const cancelSpecialty = async (userSpecialtyId: string) => {
    if (!auth.token) {
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/specialties/${userSpecialtyId}/cancel`, { method: 'POST' }, auth.token)
      setSpecialties((prev) => prev.filter((item) => item.id !== userSpecialtyId))
      setNotice('Специальность снята. Теперь можно выбрать другую.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось снять специальность')
    }
  }

  const specialtiesWithMeta = useMemo(
    () =>
      specialties.map((specialty) => {
        const checklist = specialty.checklistProgress ?? specialty.level.checklist
        const checkedCount = checklist.filter((item) => item.checked).length
        const total = checklist.length
        const allChecked = total > 0 && checkedCount === total
        const materials = specialty.specialty.resources.filter((item) => item.type === 'MATERIAL')
        const needsOrganizer = specialty.level.name === 'SILVER' || specialty.level.name === 'GOLD'
        const approverLabel = needsOrganizer ? 'организатора' : 'руководителя команды'

        return {
          ...specialty,
          checklist,
          checkedCount,
          total,
          allChecked,
          materials,
          approverLabel
        }
      }),
    [specialties]
  )

  const readyForConfirmation = specialtiesWithMeta.filter((item) => item.allChecked)
  const allMaterials = specialtiesWithMeta.flatMap((item) =>
    item.materials.map((material) => ({
      ...material,
      specialtyName: item.specialty.name
    }))
  )
  const progressLabels = useMemo(
    () =>
      specialtiesWithMeta.map((item) => ({
        id: item.id,
        label: `${item.specialty.name}: ${item.checkedCount} / ${item.total}`
      })),
    [specialtiesWithMeta]
  )

  if (specialties.length === 0) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <h1>Мои специальности</h1>
            <p>Сейчас нет активной специальности. Выберите одну и ведите её до подтверждения.</p>
            <BadgeRow items={['Чек-лист', 'Материалы', 'Статусы']} />
          </div>
          <div className="screen-actions">
            <button className="btn primary" onClick={() => navigate('/specialties/catalog')}>
              Открыть каталог
            </button>
          </div>
        </header>
        {notice ? <div className="info-banner">{notice}</div> : null}
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        <div className="state-grid">
          <article className="card highlight">
            <h3>Выберите специальность</h3>
            <p>
              Откройте каталог, выберите специальность и уровень. После этого здесь появятся
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

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Мои специальности</h1>
          <p>Ведите одну текущую специальность, отмечайте чек-лист и следите за подтверждением.</p>
          <BadgeRow items={['Чек-лист', 'Материалы', 'Статусы']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={loadSpecialties}>
            Обновить статус
          </button>
          <button className="btn ghost" onClick={() => navigate('/specialties/catalog')}>
            Открыть каталог
          </button>
        </div>
      </header>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {readyForConfirmation.length ? (
        <div className="info-banner">
          Чек-лист заполнен у {readyForConfirmation.length} спец.
          {readyForConfirmation.length === 1 ? ' Ожидайте подтверждение.' : ' Ожидайте подтверждения.'}
        </div>
      ) : null}

      <div className="card-grid">
        <article className="card" id="specialties-status">
          <h3>Текущая специальность</h3>
          <p>Активно: {specialtiesWithMeta.length} / 1</p>
          <div className="tag-list">
            {specialtiesWithMeta.map((item) => (
              <span key={item.id} className="tag">
                {item.specialty.name} · {levelMap[item.level.name] ?? item.level.name}
              </span>
            ))}
          </div>
          <div className="card-footer">
            <span className="pill">Одна активная</span>
            <span className="pill accent">Смена через отказ</span>
          </div>
        </article>
        <article className="card">
          <h3>Этапы чек-листа</h3>
          <img className="progress-illustration" src={checklistSteps} alt="Шкала чек-листа" />
          <p>Если передумали, снимите текущую специальность и выберите новую в каталоге.</p>
        </article>
        <article className="card" id="specialties-checklist">
          <h3>Прогресс по чек-листам</h3>
          <div className="stack-list">
            {progressLabels.map((item) => (
              <div key={item.id} className="stack-item">
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="card" id="specialties-materials">
          <h3>Материалы</h3>
          <p className="hint">Здесь собраны материалы по всем текущим специальностям.</p>
          <div className="link-list">
            {allMaterials.length ? (
              allMaterials.map((material) => (
                <a key={material.id} href={material.url} target="_blank" rel="noreferrer">
                  {material.specialtyName} — {material.title}
                </a>
              ))
            ) : (
              <span>Материалы пока недоступны.</span>
            )}
          </div>
        </article>
      </div>

      <div className="specialty-stack">
        {specialtiesWithMeta.map((specialty) => (
          <article key={specialty.id} className="card specialty-detail-card">
            <div className="specialty-detail-head">
              <div>
                <h3>{specialty.specialty.name}</h3>
                <p>
                  Уровень: {levelMap[specialty.level.name] ?? specialty.level.name} · Статус:{' '}
                  {statusMap[specialty.status] ?? specialty.status}
                </p>
              </div>
              <div className="card-footer">
                <span className="pill">
                  {specialty.checkedCount} / {specialty.total}
                </span>
                <span className="pill accent">{specialty.allChecked ? 'Готово к подтверждению' : 'В работе'}</span>
                {!specialty.allChecked ? (
                  <button className="btn ghost btn-inline" type="button" onClick={() => cancelSpecialty(specialty.id)}>
                    Снять специальность
                  </button>
                ) : null}
              </div>
            </div>

            {specialty.allChecked ? (
              <div className="info-banner">
                Чек-лист заполнен. Ожидайте подтверждение от {specialty.approverLabel}.
              </div>
            ) : null}

            <div className="card-grid">
              <article className="card specialty-inner-card">
                <h4>Чек-лист</h4>
                <div className="checklist">
                  {specialty.checklist.map((item) => (
                    <label key={item.id} className="check-item">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        disabled={item.checked}
                        onChange={() => toggleChecklist(specialty.id, item.id)}
                      />
                      <span>{item.title}</span>
                    </label>
                  ))}
                </div>
              </article>
              <article className="card specialty-inner-card">
                <h4>Материалы</h4>
                <div className="link-list">
                  {specialty.materials.length ? (
                    specialty.materials.map((material) => (
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
          </article>
        ))}
      </div>
    </section>
  )
}
