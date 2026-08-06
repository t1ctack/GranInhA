// Pre-defined savings challenge types. `unit` drives period labeling ("Semana"/"Dia")
// and how checkpoint calendar dates are computed from the challenge's start date.
export const CHALLENGE_TYPES = {
  week52: {
    id:          'week52',
    label:       'Desafio 52 Semanas',
    tagline:     'Guarde R$1 a mais a cada semana, por 52 semanas',
    description: 'Semana 1 = R$1, semana 2 = R$2… até a semana 52 = R$52. Total ao final: R$1.378,00.',
    unit:        'weeks',
    configurable: false,
  },
  days30: {
    id:          'days30',
    label:       'Desafio 30 Dias',
    tagline:     'Guarde um valor fixo, todo dia, por 30 dias',
    description: 'Você escolhe o valor diário — ele se repete pelos 30 dias do desafio.',
    unit:        'days',
    configurable: true,
  },
  custom: {
    id:          'custom',
    label:       'Desafio Personalizado',
    tagline:     'Defina sua meta e o número de períodos',
    description: 'Você escolhe o valor total e quantos períodos quer usar — a gente sugere uma distribuição crescente.',
    unit:        null, // user picks 'weeks' | 'days'
    configurable: true,
  },
}

/** Sum of 1..n — the "shape" the 52-week and custom challenges scale from. */
function triangularNumber(n) {
  return (n * (n + 1)) / 2
}

/** Builds the per-period value schedule for a challenge type + its params. */
export function buildPeriodValues(type, params = {}) {
  switch (type) {
    case 'week52':
      return Array.from({ length: 52 }, (_, i) => i + 1)

    case 'days30': {
      const daily = Number(params.dailyValue) || 0
      return Array.from({ length: 30 }, () => daily)
    }

    case 'custom':
      return buildLinearDistribution(Number(params.totalAmount) || 0, Number(params.totalPeriods) || 0)

    default:
      return []
  }
}

/** Distributes `totalAmount` across `n` linearly increasing periods (period i gets a share
 *  proportional to i+1), rounded to cents with the rounding remainder folded into the last
 *  period so the schedule always sums exactly to totalAmount. */
export function buildLinearDistribution(totalAmount, n) {
  if (n <= 0 || totalAmount <= 0) return []
  const step = totalAmount / triangularNumber(n)
  const values = Array.from({ length: n }, (_, i) => Math.round(step * (i + 1) * 100) / 100)
  const roundedSum = values.reduce((s, v) => s + v, 0)
  const remainder = Math.round((totalAmount - roundedSum) * 100) / 100
  values[n - 1] = Math.round((values[n - 1] + remainder) * 100) / 100
  return values
}

export function periodLabel(unit) {
  return unit === 'days' ? 'Dia' : 'Semana'
}

/** Calendar date for a given period index (0-based), counted from the challenge's start date. */
export function periodDate(startDate, index, unit) {
  const start = new Date(`${startDate}T00:00:00`)
  const step  = unit === 'days' ? 1 : 7
  const d     = new Date(start)
  d.setDate(d.getDate() + index * step)
  return d
}
