import { Trash2, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatTime } from '@/services/formatters'
import { getCategory } from '@/constants/categories'
import { useTheme } from '@/contexts/ThemeContext'

const ACCOUNT_EMOJI = {
  piggy:       '🐷',
  credit_card: '💳',
  wallet:      '👛',
  checking:    '🏦',
  other:       '📁',
}

export default function TransactionItem({ tx, account, onDelete }) {
  const { theme } = useTheme()
  const isIncome      = tx.type === 'income'
  const isOrphan      = !account
  const accountName   = account?.name  ?? 'Conta excluída'
  const accountEmoji  = ACCOUNT_EMOJI[account?.type] ?? '💰'
  const category      = getCategory(tx.category)
  const categoryColor = theme === 'dark' ? category.colorDark : category.color

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-gray-100 dark:border-dm-border/60 last:border-0 ${isOrphan ? 'opacity-60' : ''}`}>
      {/* Category icon */}
      <div
        className="p-2 rounded-xl shrink-0 flex items-center justify-center w-9 h-9"
        style={{ backgroundColor: `${categoryColor}22` }}
      >
        <span className="text-base leading-none">{category.emoji}</span>
      </div>

      {/* Description + account + category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate text-gray-900 dark:text-slate-100">
          {tx.description || (isIncome ? 'Entrada' : 'Saída')}
        </p>
        <p className={`text-xs mt-0.5 truncate flex items-center gap-1 ${isOrphan ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'}`}>
          {isOrphan && <AlertTriangle size={11} className="shrink-0" />}
          {category.label} · {accountEmoji} {accountName} · {formatTime(tx.date)}
        </p>
      </div>

      {/* Amount + delete */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
          {isIncome ? '+' : '−'}{formatCurrency(tx.amount)}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(tx)}
            aria-label="Desfazer transação"
            className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors w-11 h-11 -mr-2 flex items-center justify-center rounded-lg hover:bg-red-500/10 shrink-0"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
