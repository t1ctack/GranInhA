/** Progress info for a savings goal. Returns null when there's no valid goal amount. */
export function goalProgress(balance, goalAmount) {
  if (!goalAmount || goalAmount <= 0) return null
  const pct = balance / goalAmount
  return {
    pct,
    pctClamped: Math.min(Math.max(pct, 0), 1),
    reached: balance >= goalAmount,
  }
}

/** Whole days between today and a "YYYY-MM-DD" target date (negative = overdue). */
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}
