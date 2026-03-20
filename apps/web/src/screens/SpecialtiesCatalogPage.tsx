import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

const levelMap: Record<string, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото'
}

const levelDescriptions: Record<SpecialtyLevel['name'], string> = {
  BRONZE: 'Базовый уровень',
  SILVER: 'Средний уровень',
  GOLD: 'Продвинутый уровень'
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
  checklist: { id: string; title: string }[]
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
  const currentSpecialty = activeSpecialties[0] ?? null
  const selectedLevel = activeSpecialty?.levels.find((item) => item.id === selectedLevelId)

  const selectSpecialty = async () => {
    setNotice('')
    setErrorMessage('')
    if (!auth.token) {
      setErrorMessage('Для выбора специальности требуется вход.')
      return
    }
    if (currentSpecialty) {
      setNotice('Сначала снимите текущую специальность, затем выберите новую.')
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

  const cancelSpecialty = async (userSpecialtyId: string) => {
    if (!auth.token) {
      setErrorMessage('Для изменения специальности требуется вход.')
      return
    }
    setNotice('')
    setErrorMessage('')
    try {
      await apiFetch(`/specialties/${userSpecialtyId}/cancel`, { method: 'POST' }, auth.token)
      const updated = await apiFetch<ActiveSpecialty[]>('/specialties/my', {}, auth.token)
      setActiveSpecialties(updated)
      setNotice('Текущая специальность снята. Теперь можно выбрать новую.')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось снять специальность')
    }
  }

  const selectedLabel = useMemo(() => {
    if (!activeSpecialty || !selectedLevelId) {
      return 'Специальность не выбрана'
    }
    const level = activeSpecialty.levels.find((item) => item.id === selectedLevelId)
    return level
      ? `${activeSpecialty.name} (${levelMap[level.name]} — ${levelDescriptions[level.name]})`
      : activeSpecialty.name
  }, [activeSpecialty, selectedLevelId])

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Каталог специальностей</h1>
          <p>Выберите область, специальность и уровень. Одновременно можно вести только одну специальность.</p>
        </div>
        <div className="screen-actions">
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
          <p className="hint">Выберите направление, в котором хотите развиваться.</p>
          {areas.length <= 1 ? (
            <p>{areas[0]?.name ?? 'Области пока не добавлены.'}</p>
          ) : (
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
          )}
        </article>
        <article className="card" id="specialties-list">
          <h3>Специальности</h3>
          <p className="hint">Сначала выберите специальность, затем укажите уровень.</p>
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
          <p className="hint">
            Выберите уровень. Бронза — базовый уровень. Серебро — средний уровень. Золото —
            продвинутый уровень.
          </p>
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
        <article className="card" id="specialties-preview">
          <h3>Чек-лист выбранного уровня</h3>
          {!activeSpecialty ? (
            <p>Сначала выберите специальность.</p>
          ) : !selectedLevel ? (
            <p>После выбора уровня здесь появится чек-лист, с которым можно ознакомиться до подтверждения.</p>
          ) : (
            <>
              <p>
                {activeSpecialty.name} · {levelMap[selectedLevel.name]} — {levelDescriptions[selectedLevel.name]}
              </p>
              <div className="checklist checklist-preview">
                {selectedLevel.checklist.map((item) => (
                  <div key={item.id} className="check-item static">
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn primary"
                type="button"
                onClick={selectSpecialty}
                disabled={Boolean(currentSpecialty)}
              >
                Подтвердить выбор специальности
              </button>
            </>
          )}
        </article>
        <article className="card" id="specialties-video">
          <h3>Видеоподборка</h3>
          <p className="hint">Подборка видео по выбранной специальности.</p>
          <div className="video-card">
            {videoResources.length ? (
              <div className="link-list">
                {videoResources.map((video) => (
                  <a key={video.id} href={video.url} target="_blank" rel="noreferrer">
                    {video.title.replace('Видео-подборка', 'Видеоподборка')}
                  </a>
                ))}
              </div>
            ) : (
              <p>Видеоподборка пока недоступна.</p>
            )}
          </div>
        </article>
      </div>

      <div className="state-grid">
        <article className="card highlight">
          <h3>Текущая активная специальность</h3>
          <p>Активно специальностей: {activeSpecialties.length} / 1</p>
          {currentSpecialty ? (
            <p>
              Текущая специальность: {currentSpecialty.specialty.name} (
              {levelMap[currentSpecialty.level.name]} — {levelDescriptions[currentSpecialty.level.name]})
            </p>
          ) : (
            <p>Сейчас активной специальности нет. Можно выбрать новую после просмотра чек-листа.</p>
          )}
          <p className="hint">Предварительный выбор: {selectedLabel}</p>
          {currentSpecialty ? (
            <button className="btn ghost" type="button" onClick={() => cancelSpecialty(currentSpecialty.id)}>
              Снять текущую специальность
            </button>
          ) : null}
        </article>
      </div>
    </section>
  )
}
