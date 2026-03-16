function isValidDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function normalizeDateValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    if (!isValidDateParts(Number(year), Number(month), Number(day))) {
      return null
    }
    return `${year}-${month}-${day}`
  }

  const ruMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (ruMatch) {
    const [, day, month, year] = ruMatch
    if (!isValidDateParts(Number(year), Number(month), Number(day))) {
      return null
    }
    return `${year}-${month}-${day}`
  }

  return null
}

export function formatDateForDisplay(value: string) {
  const normalized = normalizeDateValue(value)
  if (!normalized) {
    return value
  }
  const [year, month, day] = normalized.split('-')
  return `${day}.${month}.${year}`
}

export function maskDateInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const normalized = normalizeDateValue(trimmed)
  if (normalized) {
    return formatDateForDisplay(normalized)
  }

  const digits = trimmed.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) {
    return digits
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}
