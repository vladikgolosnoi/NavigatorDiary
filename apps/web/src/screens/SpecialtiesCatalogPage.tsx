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
  const [hasActiveSpecialty, setHasActiveSpecialty] = useState(false)

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
    apiFetch('/specialties/my', {}, auth.token)
      .then((data) => {
        setHasActiveSpecialty(Boolean(data))
      })
      .catch(() => {
        setHasActiveSpecialty(false)
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
    if (hasActiveSpecialty) {
      setNotice('Можно иметь только одну активную специальность.')
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
      setHasActiveSpecialty(true)
      setNotice('Специальность выбрана. Переходите к чек-листу.')
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

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Каталог специальностей</h1>
          <p>Выберите область, специальность и уровень. Активна только одна специальность.</p>
          <BadgeRow items={['Область', 'Видео', 'Специальность', 'Уровень']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={selectSpecialty}>
            Выбрать специальность
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('/specialties/my')}>
            Моя специальность
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
          <p>Статус: {hasActiveSpecialty ? 'Активна' : 'Не выбрана'}</p>
          <div className="card-footer">
            <span className="pill">Одна специальность</span>
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
