import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TopNav } from './TopNav'
import { AuthProvider } from '../state/auth'

describe('TopNav', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows login link for guests', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <TopNav />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Войти')).toBeInTheDocument()
  })

  it('shows organizer link for organizer role', () => {
    window.localStorage.setItem(
      'auth.state',
      JSON.stringify({
        token: 'token',
        user: {
          id: 'user-1',
          firstName: 'Иван',
          lastName: 'Иванов',
          role: 'ORGANIZER',
          teamId: null
        }
      })
    )

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AuthProvider>
          <TopNav />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Организатор' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Иван Иванов/i })).toBeInTheDocument()
    expect(screen.getByText('Выйти')).toBeInTheDocument()
  })
})
