const MONTHS_PT = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
]

const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCurrency(value) {
  return currencyFmt.format(value ?? 0)
}

/** Converts a Firestore Timestamp, JS Date, or date string to a JS Date */
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

/** Returns "Hoje", "Ontem", "12 de janeiro", "12 de jan. de 2023" */
export function dayLabel(dateValue) {
  const d = toDate(dateValue)
  if (!d || isNaN(d)) return 'Sem data'
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(d, today)) return 'Hoje'
  if (isSameDay(d, yesterday)) return 'Ontem'
  const label = `${d.getDate()} de ${MONTHS_PT[d.getMonth()]}`
  return d.getFullYear() !== today.getFullYear() ? `${label} de ${d.getFullYear()}` : label
}

export function formatTime(dateValue) {
  const d = toDate(dateValue)
  if (!d || isNaN(d)) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Groups a flat sorted array of transactions into [{ label, items }] by calendar day */
export function groupByDay(transactions) {
  const groups = []
  const seen = new Map()
  for (const tx of transactions) {
    const label = dayLabel(tx.date)
    if (!seen.has(label)) {
      const g = { label, items: [] }
      groups.push(g)
      seen.set(label, g)
    }
    seen.get(label).items.push(tx)
  }
  return groups
}

export function isCurrentMonth(dateValue) {
  const d = toDate(dateValue)
  if (!d || isNaN(d)) return false
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

/** "YYYY-MM-DDTHH:MM" — correct value for datetime-local inputs */
export function toDatetimeLocal(date = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

/** "YYYY-MM-DD" — correct value for date inputs */
export function todayDateStr(date = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}`
}

/** Parses BRL-style strings: "1.234,56" → 1234.56 */
export function parseBRL(raw) {
  return Number(String(raw).replace(/\./g, '').replace(',', '.'))
}
