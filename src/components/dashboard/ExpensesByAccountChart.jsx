import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, isCurrentMonth } from '@/services/formatters'
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
        accountId,
        name: acc?.name ?? 'Conta removida',
        color: acc?.color ?? FALLBACK_COLOR,
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
      <p className="text-gray-900 dark:text-slate-100 font-medium mb-0.5">{d.name}</p>
      <p className="font-semibold tabular-nums text-red-500 dark:text-red-400">{formatCurrency(d.value)}</p>
    </div>
  )
}

export default function ExpensesByAccountChart({ transactions, accounts, loading }) {
  const data = useMemo(() => buildExpensesByAccount(transactions, accounts), [transactions, accounts])
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="card h-full">
      <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Gastos por Conta (mês atual)</h2>

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
                  <Cell key={d.accountId} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <ul className="w-full sm:w-1/2 space-y-2">
            {data.map(d => (
              <li key={d.accountId} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
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
