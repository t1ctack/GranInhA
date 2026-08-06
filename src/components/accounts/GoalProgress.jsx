import { PartyPopper, Clock } from 'lucide-react'
import { formatCurrency } from '@/services/formatters'
import { goalProgress, daysUntil } from '@/services/goals'

function daysLabel(days, reached) {
  if (days > 1)   return `Faltam ${days} dias`
  if (days === 1) return 'Falta 1 dia'
  if (days === 0) return 'Prazo é hoje'
  if (reached)    return 'Concluída dentro do prazo'
  return `Prazo encerrado há ${Math.abs(days)} dia${Math.abs(days) > 1 ? 's' : ''}`
}

/** Renders nothing when the account has no valid goal amount set. */
export default function GoalProgress({ balance, goalAmount, goalDate, color = '#22c55e' }) {
  const progress = goalProgress(balance, goalAmount)
  if (!progress) return null

  const { pct, pctClamped, reached } = progress
  const days = daysUntil(goalDate)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-gray-500 dark:text-slate-400 tabular-nums">
          {formatCurrency(Math.max(balance, 0))} de {formatCurrency(goalAmount)} ({Math.round(pct * 100)}%)
        </p>
        {reached && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
            <PartyPopper size={12} />
            Meta atingida!
          </span>
        )}
      </div>

      <div className="h-2 rounded-full bg-gray-100 dark:bg-dm-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pctClamped * 100}%`, backgroundColor: reached ? '#10b981' : color }}
        />
      </div>

      {goalDate && (
        <p className={`text-[11px] flex items-center gap-1 ${!reached && days < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'}`}>
          <Clock size={11} className="shrink-0" />
          {daysLabel(days, reached)}
        </p>
      )}
    </div>
  )
}
