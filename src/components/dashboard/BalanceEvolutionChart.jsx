import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'
import { formatCurrency, toDate, dayLabel, formatTime } from '@/services/formatters'
import logoIcon from '@/assets/logo-icon-cropped.png'

const DAYS_WINDOW = 30

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfDay(d) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

/** Sum of every account's opening balance, recovered as current total minus all known deltas. */
function openingBalanceFor(withDates, totalBalance) {
  const totalDelta = withDates.reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : -tx.amount), 0)
  return (totalBalance ?? totalDelta) - totalDelta
}

/** One point per calendar day in the visible window — for activity spread across multiple days. */
function buildDailySeries(withDates, totalBalance) {
  const dailyDelta = new Map()
  for (const tx of withDates) {
    const key = dateKey(startOfDay(tx._date))
    const delta = tx.type === 'income' ? tx.amount : -tx.amount
    dailyDelta.set(key, (dailyDelta.get(key) ?? 0) + delta)
  }

  const today = startOfDay(new Date())
  const earliestWanted = new Date(today)
  earliestWanted.setDate(today.getDate() - (DAYS_WINDOW - 1))

  const firstTxDay = startOfDay(withDates.reduce((min, tx) => (tx._date < min ? tx._date : min), withDates[0]._date))
  const rangeStart = firstTxDay > earliestWanted ? firstTxDay : earliestWanted

  // Baseline: opening balance plus every delta that happened strictly before the visible range.
  let running = openingBalanceFor(withDates, totalBalance)
  for (const [key, delta] of dailyDelta) {
    const [y, m, d] = key.split('-').map(Number)
    if (new Date(y, m - 1, d) < rangeStart) running += delta
  }

  const series = []
  for (let d = new Date(rangeStart); d <= today; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d)
    running += dailyDelta.get(key) ?? 0
    series.push({
      key,
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      tooltipLabel: dayLabel(d),
      balance: running,
    })
  }
  return series
}

/** One point per transaction, chronologically — for activity confined to a single calendar day. */
function buildIntradaySeries(withDates, totalBalance) {
  const sorted = [...withDates].sort((a, b) => a._date - b._date)

  let running = openingBalanceFor(withDates, totalBalance)
  const series = [{
    key: 'start',
    label: 'Início',
    tooltipLabel: 'Saldo inicial do dia',
    balance: running,
  }]

  sorted.forEach((tx, i) => {
    const delta = tx.type === 'income' ? tx.amount : -tx.amount
    running += delta
    series.push({
      key: tx.id ?? `${tx._date.getTime()}-${i}`,
      label: formatTime(tx._date),
      tooltipLabel: `${dayLabel(tx._date)}, ${formatTime(tx._date)}`,
      balance: running,
    })
  })
  return series
}

/**
 * Builds the balance series to plot, picking the granularity that actually shows
 * an evolution: one point per day when activity spans multiple days, or one point
 * per transaction (intraday) when everything happened on a single calendar day —
 * otherwise a single-day day-by-day series would collapse to one flat point.
 */
function buildBalanceSeries(transactions, totalBalance) {
  const withDates = transactions
    .map(tx => ({ ...tx, _date: toDate(tx.date) }))
    .filter(tx => tx._date && !isNaN(tx._date))

  if (withDates.length === 0) return { mode: 'empty', series: [] }

  const dayKeys = new Set(withDates.map(tx => dateKey(startOfDay(tx._date))))

  return dayKeys.size === 1
    ? { mode: 'intraday', series: buildIntradaySeries(withDates, totalBalance) }
    : { mode: 'daily', series: buildDailySeries(withDates, totalBalance) }
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-white dark:bg-dm-muted border border-gray-200 dark:border-dm-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-400 dark:text-slate-500 mb-0.5">{point.tooltipLabel}</p>
      <p className="font-semibold tabular-nums text-gray-900 dark:text-slate-100">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export default function BalanceEvolutionChart({ transactions, totalBalance, loading }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { mode, series } = useMemo(() => buildBalanceSeries(transactions, totalBalance), [transactions, totalBalance])

  const gridColor = isDark ? '#262626' : '#e5e7eb'
  const tickColor = isDark ? '#64748b' : '#9ca3af'
  const lineColor = isDark ? '#4ade80' : '#16a34a'

  const tickInterval = series.length > 10 ? Math.ceil(series.length / 6) - 1 : 0

  return (
    <div className="card h-full">
      <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">
        Evolução do Saldo
        {mode === 'intraday' && (
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-slate-500">(hoje, por transação)</span>
        )}
      </h2>

      {loading ? (
        <div className="h-56 rounded-xl animate-pulse bg-gray-100 dark:bg-dm-muted/60" />
      ) : mode === 'empty' ? (
        <div className="flex flex-col items-center justify-center h-56 text-gray-400 dark:text-slate-500">
          <img src={logoIcon} alt="" className="h-14 w-auto mb-2 opacity-50 animate-float" />
          <p className="text-sm text-center">Ainda não há dados suficientes para exibir o gráfico.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <AreaChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={v => formatCurrency(v).replace(/,00$/, '')}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor }} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#balanceGradient)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
