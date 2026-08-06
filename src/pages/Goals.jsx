import { Link } from 'react-router-dom'
import { Settings2, Target } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { TYPE_META } from '@/components/accounts/AccountCard'
import GoalProgress from '@/components/accounts/GoalProgress'
import { goalProgress } from '@/services/goals'

function SkeletonCard() {
  return <div className="card h-24 animate-pulse bg-gray-100 dark:bg-dm-muted/60 !p-0" />
}

export default function Goals() {
  const { accounts, loading } = useAccounts()

  const goalAccounts = accounts
    .filter(a => a.goalAmount != null && a.goalAmount > 0)
    .map(a => ({ ...a, _progress: goalProgress(a.balance ?? 0, a.goalAmount) }))
    .sort((a, b) => b._progress.pct - a._progress.pct)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Metas</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Progresso das suas metas de economia</p>
        </div>
        <Link to="/accounts" className="btn-ghost flex items-center gap-2">
          <Settings2 size={16} />
          <span className="hidden sm:inline">Gerenciar contas</span>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : goalAccounts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {goalAccounts.map(account => (
            <GoalListItem key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  )
}

function GoalListItem({ account }) {
  const meta  = TYPE_META[account.type] ?? TYPE_META.other
  const color = account.color ?? '#22c55e'

  return (
    <div className="card" style={{ borderLeftColor: color, borderLeftWidth: '3px' }}>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-xl w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}22` }}
        >
          {meta.emoji}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug truncate text-gray-900 dark:text-slate-100">{account.name}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{meta.label}</p>
        </div>
      </div>

      <GoalProgress
        balance={account.balance ?? 0}
        goalAmount={account.goalAmount}
        goalDate={account.goalDate}
        color={color}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Target size={40} className="text-gray-300 dark:text-slate-600 mb-4" />
        <p className="font-medium text-gray-700 dark:text-slate-300">Nenhuma meta definida ainda</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-6 max-w-xs">
          Defina um valor-alvo em alguma das suas contas para acompanhar o progresso por aqui.
        </p>
        <Link to="/accounts" className="btn-primary flex items-center gap-2">
          Ir para Contas
        </Link>
      </div>
    </div>
  )
}
