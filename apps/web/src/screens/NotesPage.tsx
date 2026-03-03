import { useEffect, useState } from 'react'
import { BadgeRow } from '../components/BadgeRow'
import { apiFetch, ApiError } from '../api/client'
import { useAuth } from '../state/auth'

type Note = {
  id: string
  content: string
  createdAt: string
}

export function NotesPage() {
  const { auth } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!auth.token) {
      return
    }
    apiFetch<Note[]>('/notes', {}, auth.token)
      .then((data) => setNotes(data))
      .catch((error: ApiError) => setErrorMessage(error.message || 'Не удалось загрузить заметки'))
  }, [auth.token])

  const addNote = async () => {
    if (!auth.token) {
      setErrorMessage('Для сохранения заметки требуется вход.')
      return
    }
    if (!draft.trim()) {
      return
    }
    try {
      const newNote = await apiFetch<Note>(
        '/notes',
        {
          method: 'POST',
          body: JSON.stringify({ content: draft.trim() })
        },
        auth.token
      )
      setNotes((prev) => [newNote, ...prev])
      setDraft('')
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось сохранить заметку')
    }
  }

  const removeNote = async (id: string) => {
    if (!auth.token) {
      return
    }
    try {
      await apiFetch(`/notes/${id}`, { method: 'DELETE' }, auth.token)
      setNotes(notes.filter((note) => note.id !== id))
    } catch (error) {
      const apiError = error as ApiError
      setErrorMessage(apiError.message || 'Не удалось удалить заметку')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <h1>Анонимные заметки</h1>
          <p>Личные заметки, доступные только вам.</p>
          <BadgeRow items={['Создать', 'Список']} />
        </div>
        <div className="screen-actions">
          <button className="btn primary" onClick={addNote}>
            Сохранить заметку
          </button>
          <button className="btn ghost" onClick={() => setDraft('')}>
            Очистить черновик
          </button>
        </div>
      </header>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="card-grid">
        <article className="card" id="notes-create">
          <h3>Новая заметка</h3>
          <textarea
            className="note-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Запишите мысль или идею"
          />
          <button className="btn ghost" type="button" onClick={() => setDraft('')}>
            Очистить
          </button>
        </article>
        <article className="card" id="notes-list">
          <h3>Мои заметки</h3>
          <div className="note-list">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <p>{note.content}</p>
                <small>{new Date(note.createdAt).toLocaleString()}</small>
                <button className="btn ghost" onClick={() => removeNote(note.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
