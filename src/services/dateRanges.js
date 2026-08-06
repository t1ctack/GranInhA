export const PERIOD_OPTIONS = [
  { value: 'today',     label: 'Hoje' },
  { value: '7d',        label: 'Últimos 7 dias' },
  { value: 'month',     label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: '3m',        label: 'Últimos 3 meses' },
  { value: 'all',       label: 'Todo o período' },
]

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/** "YYYY-MM-DD" parsed as local midnight (avoids the UTC-shift that plain `new Date(str)` causes) */
function parseLocalDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`)
}

/** Returns [from, to] JS Dates for a period id — either may be null (unbounded). */
export function getPeriodRange(period, customFrom, customTo) {
  const now = new Date()

  switch (period) {
    case 'today':
      return [startOfDay(now), endOfDay(now)]
    case '7d': {
      const from = new Date(now)
      from.setDate(now.getDate() - 6)
      return [startOfDay(from), endOfDay(now)]
    }
    case 'month':
      return [new Date(now.getFullYear(), now.getMonth(), 1), endOfDay(now)]
    case 'lastMonth': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to   = new Date(now.getFullYear(), now.getMonth(), 0)
      return [from, endOfDay(to)]
    }
    case '3m':
      return [new Date(now.getFullYear(), now.getMonth() - 2, 1), endOfDay(now)]
    case 'custom':
      return [
        customFrom ? startOfDay(parseLocalDate(customFrom)) : null,
        customTo   ? endOfDay(parseLocalDate(customTo))     : null,
      ]
    default:
      return [null, null]
  }
}
