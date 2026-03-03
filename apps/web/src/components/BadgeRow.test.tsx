import { render, screen } from '@testing-library/react'
import { BadgeRow } from './BadgeRow'

describe('BadgeRow', () => {
  it('renders all badges', () => {
    render(<BadgeRow items={['Сфера', 'Цели', 'Прогресс']} />)

    expect(screen.getByText('Сфера')).toBeInTheDocument()
    expect(screen.getByText('Цели')).toBeInTheDocument()
    expect(screen.getByText('Прогресс')).toBeInTheDocument()
  })
})
