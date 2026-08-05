import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, isCurrentMonth } from '@/services/formatters'
import { CATEGORIES, getCategory } from '@/constants/categories'
import { useTheme } from '@/contexts/ThemeContext'
import logoIcon from '@/assets/logo-icon-cropped.png'

const FALLBACK_COLOR = '#94a3b8'

function buildExpensesByAccount(transactions, accounts) {
  const totals = new Map()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !isCurrentMonth(tx.date)) continue
    totals.set(tx.accountId, (totals.get(tx.accountId) ?? 0) + tx.amount)
  }

  return [...totals.entries()]
    .map(([accountId, value]) => {
      const acc = accounts.find(a => a.id === accountId)
      return {
        key: accountId,
        name: acc?.name ?? 'Conta removida',
        color: acc?.color ?? FALLBACK_COLOR,
        emoji: null,
        value,
      }
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

function buildExpensesByCategory(transactions, isDark) {
  const totals = new Map()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !isCurrentMonth(tx.date)) continue
    const catId = tx.category ?? CATEGORIES.at(-1).id
    totals.set(catId, (totals.get(catId) ?? 0) + tx.amount)
  }

  return [...totals.entries()]
    .map(([catId, value]) => {
      const cat = getCategory(catId)
      return {
        key: catId,
        name: cat.label,
        color: isDark ? cat.colorDark : cat.color,
        emoji: cat.emoji,
        value,
      }
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white dark:bg-dm-muted border border-gray-200 dark:border-dm-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-900 dark:text-slate-100 font-medium mb-0.5">
        {d.emoji ? `${d.emoji} ` : ''}{d.name}
      </p>
      <p className="font-semibold tabular-nums text-red-500 dark:text-red-400">{formatCurrency(d.value)}</p>
    </div>
  )
}

const MODES = [
  { id: 'account',  label: 'Por conta' },
  { id: 'category', label: 'Por categoria' },
]

export default function ExpensesByAccountChart({ transactions, accounts, loading }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [mode, setMode] = useState('account')

  const data = useMemo(
    () => mode === 'account'
      ? buildExpensesByAccount(transactions, accounts)
      : buildExpensesByCategory(transactions, isDark),
    [mode, transactions, accounts, isDark]
  )
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h2 className="font-semibold text-gray-900 dark:text-slate-100">Gastos do mês</h2>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dm-muted rounded-lg">
          {MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors duration-150 ${
                mode === m.id
                  ? 'bg-white dark:bg-dm-hover text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-56 rounded-xl animate-pulse bg-gray-100 dark:bg-dm-muted/60" />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-gray-400 dark:text-slate-500">
          <img src={logoIcon} alt="" className="h-14 w-auto mb-2 opacity-50 animate-float" />
          <p className="text-sm text-center">Ainda não há dados suficientes para exibir o gráfico.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={192} className="sm:!w-1/2 shrink-0">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="none"
              >
                {data.map(d => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <ul className="w-full sm:w-1/2 space-y-2">
            {data.map(d => (
              <li key={d.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  {d.emoji ? (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0"
                      style={{ backgroundColor: `${d.color}22` }}
                    >
                      {d.emoji}
                    </span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  )}
                  <span className="truncate text-gray-700 dark:text-slate-300">{d.name}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums font-medium text-gray-900 dark:text-slate-100">
                    {formatCurrency(d.value)}
                  </span>
                  <span className="tabular-nums text-gray-400 dark:text-slate-500 w-9 text-right">
                    {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
