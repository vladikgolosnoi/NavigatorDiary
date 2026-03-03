export function addMonths(date: Date, months: number) {
  const result = new Date(date)
  const day = result.getDate()
  result.setMonth(result.getMonth() + months)

  if (result.getDate() < day) {
    result.setDate(0)
  }

  return result
}
