import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const levelMap: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

type Area = {
  id: string
  name: string
}

type SpecialtyResource = {
  id: string
  type: 'VIDEO' | 'MATERIAL'
  title: string
  url: string
}

type SpecialtyLevel = {
  id: string
  name: 'BRONZE' | 'SILVER' | 'GOLD'
}

type Specialty = {
  id: string
  name: string
  resources: SpecialtyResource[]
  levels: SpecialtyLevel[]
}

type ActiveSpecialty = {
  id: string
  status: string
  specialty: { id: string; name: string }
  level: { name: 'BRONZE' | 'SILVER' | 'GOLD' }
}

export function SpecialtiesCatalogPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [areas, setAreas] = useState<Area[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [activeAreaId, setActiveAreaId] = useState<string>('')
  const [activeSpecialtyId, setActiveSpecialtyId] = useState<string>('')
  const [selectedLevelId, setSelectedLevelId] = useState<string>('')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeSpecialties, setActiveSpecialties] = useState<ActiveSpecialty[]>([])

  useEffect(() => {
    apiFetch<Area[]>('/catalogs/areas', {}, auth.token)
      .then((data) => {
        setAreas(data)
        if (data.length > 0) {
          setActiveAreaId((prev) => prev || data[0].id)
        }
      })
      .catch((error: ApiError) => {
        setErrorMessage(error.message || 'Не удалось загрузить области')
      })
  }, [auth.token])

  useEffect(() => {
    if (!activeAreaId) {
      return
    }
    apiFetch<Specialty[]>(`/catalogs/specialties?areaId=${activeAreaId}`, {}, auth.token)
      .then((data) => {
        setSpecialties(data)
        if (data.length > 0) {
          setActiveSpecialtyId((prev) => prev || data[0].id)
          setSelectedLevelId('')
        }
      })
      .catch((error: ApiError) => {
        setErrorMessage(error.message || 'Не удалось загрузить специальности')
      })
  }, [activeAreaId, auth.token])

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<ActiveSpecialty[]>('/specialties/my', {}, auth.token)
      .then((data) => {
        setActiveSpecialties(data)
      })
      .catch(() => {
        setActiveSpecialties([])
      })
  }, [auth.token])

  const activeSpecialty = useMemo(
    () => specialties.find((spec) => spec.id === activeSpecialtyId) ?? specialties[0],
    [specialties, activeSpecialtyId]
  )

  const videoResources = activeSpecialty?.resources.filter((res) => res.type === 'VIDEO') ?? []

  const selectSpecialty = async () => {
    setNotice('')
    setErrorMessage('')
    if (!auth.token) {
      setErrorMessage('Для выбора специальности требуется вход.')
      return
    }
    if (activeSpecialties.length >= 3) {
      setNotice('Можно иметь не более трёх активных специальностей.')
      return
    }
    if (activeSpecialties.some((item) => item.specialty.id === activeSpecialty?.id)) {
      setNotice('Эта специальность уже выбрана.')
      return
    }
    if (!activeSpecialty || !selectedLevelId) {
      setNotice('Выберите специальность и уровень.')
      return
    }
    try {
      await apiFetch(
        '/specialties/select',
        {
          method: 'POST',
          body: JSON.stringify({
            specialtyId: activeSpecialty.id,
            levelId: selectedLevelId
          })
        },
        auth.token
      )
      const updated = await apiFetch<ActiveSpecialty[]>('/specialties/my', {}, auth.token)
      setActiveSpecialties(updated)
      setNotice('Специальность добавлена. Переходите к чек-листам.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось выбрать специальность')
    }
  }

  const selectedLabel = useMemo(() => {
    if (!activeSpecialty || !selectedLevelId) {
      return 'Специальность не выбрана'
    }
    const level = activeSpecialty.levels.find((item) => item.id === selectedLevelId)
    return `${activeSpecialty.name} (${level ? levelMap[level.name] : ''})`
  }, [activeSpecialty, selectedLevelId])

  const activeLabels = activeSpecialties.map((item) => `${item.specialty.name} · ${levelMap[item.level.name]}`)

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Каталог специальностей</h1>
          <p>Выберите область, специальность и уровень. Одновременно можно вести до трёх специальностей.</p>
          <BadgeRow items={['Область', 'Видео', 'Специальность', 'Уровень']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={selectSpecialty}>
            Выбрать специальность
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('/specialties/my')}>
            Мои специальности
          </button>
        </div>
      </header>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {notice ? <div className="info-banner">{notice}</div> : null}

      <div className="card-grid">
        <article className="card" id="specialties-areas">
          <h3>Области</h3>
          <p className="hint">Комментарий: выбери область.</p>
          <div className="chip-grid">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={`chip${area.id === activeAreaId ? ' active' : ''}`}
                onClick={() => {
                  setActiveAreaId(area.id)
                  setActiveSpecialtyId('')
                }}
              >
                {area.name}
              </button>
            ))}
          </div>
        </article>
        <article className="card" id="specialties-video">
          <h3>Видео о специальностях</h3>
          <p className="hint">Комментарий: узнай больше.</p>
          <div className="video-card">
            {videoResources.length ? (
              <div className="link-list">
                {videoResources.map((video) => (
                  <a key={video.id} href={video.url} target="_blank" rel="noreferrer">
                    {video.title}
                  </a>
                ))}
              </div>
            ) : (
              <p>Видео недоступно</p>
            )}
          </div>
        </article>
        <article className="card" id="specialties-list">
          <h3>Специальности</h3>
          <p className="hint">Комментарий: выбери специальность.</p>
          <div className="chip-grid">
            {specialties.map((specialty) => (
              <button
                key={specialty.id}
                type="button"
                className={`chip${specialty.id === activeSpecialtyId ? ' active' : ''}`}
                onClick={() => {
                  setActiveSpecialtyId(specialty.id)
                  setSelectedLevelId('')
                }}
              >
                <span className="chip-icon">{specialty.name.slice(0, 1)}</span>
                {specialty.name}
              </button>
            ))}
          </div>
        </article>
        <article className="card" id="specialties-level">
          <h3>Уровни</h3>
          <p className="hint">Комментарий: выбери уровень.</p>
          <div className="chip-grid">
            {activeSpecialty?.levels.map((level) => (
              <button
                key={level.id}
                type="button"
                className={`chip${selectedLevelId === level.id ? ' active' : ''}`}
                onClick={() => setSelectedLevelId(level.id)}
              >
                {levelMap[level.name] ?? level.name}
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="state-grid">
        <article className="card highlight">
          <h3>Мой выбор</h3>
          <p>{selectedLabel}</p>
          <p>Активно специальностей: {activeSpecialties.length} / 3</p>
          {activeLabels.length ? (
            <div className="tag-list">
              {activeLabels.map((label) => (
                <span key={label} className="tag">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          <div className="card-footer">
            <span className="pill">До 3 активных</span>
            <span className="pill accent">Чек-лист</span>
          </div>
        </article>
        <article className="card">
          <h3>Подсказка</h3>
          <p>Просмотрите видео и материалы, прежде чем выбирать уровень.</p>
        </article>
      </div>
    </section>
  )
}
