import { addMonths } from './date'

describe('addMonths', () => {
  it('handles end-of-month overflow', () => {
    const base = new Date(2024, 0, 31)
    const result = addMonths(base, 1)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(1)
    expect(result.getDate()).toBe(29)
  })

  it('adds months without shifting day', () => {
    const base = new Date(2024, 1, 15)
    const result = addMonths(base, 3)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(4)
    expect(result.getDate()).toBe(15)
  })
})
