import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, MoreVertical, Trash2, ChevronRight } from 'lucide-react'
import { CHALLENGE_TYPES } from '@/constants/challenges'
import { TYPE_META } from '@/components/accounts/AccountCard'
import { formatCurrency } from '@/services/formatters'

export default function ChallengeCard({ challenge, account, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const typeInfo      = CHALLENGE_TYPES[challenge.type]
  const accountMeta   = TYPE_META[account?.type] ?? TYPE_META.other
  const color         = account?.color ?? '#22c55e'
  const totalAmount   = challenge.periodValues.reduce((s, v) => s + v, 0)
  const savedAmount   = challenge.completedPeriods.reduce((s, idx) => s + (challenge.periodValues[idx] ?? 0), 0)
  const pct           = challenge.totalPeriods > 0 ? challenge.completedPeriods.length / challenge.totalPeriods : 0
  const completed     = challenge.totalPeriods > 0 && challenge.completedPeriods.length >= challenge.totalPeriods

  return (
    <div className="card relative flex flex-col gap-3" style={{ borderLeftColor: color, borderLeftWidth: '3px' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-xl w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}22` }}
          >
            {completed ? '🏆' : accountMeta.emoji}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-snug truncate text-gray-900 dark:text-slate-100">
              {typeInfo?.label ?? 'Desafio'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
              {account?.name ?? 'Conta excluída'}
            </p>
          </div>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="btn-ghost w-11 h-11 -mr-1.5 -mt-1 flex items-center justify-center shrink-0"
            aria-label="Opções do desafio"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 bg-white dark:bg-dm-muted border border-gray-200 dark:border-dm-border rounded-xl shadow-xl w-40 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onDelete(challenge) }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors text-left"
              >
                <Trash2 size={14} />
                Excluir desafio
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-gray-500 dark:text-slate-400 tabular-nums">
            {challenge.completedPeriods.length} de {challenge.totalPeriods} · {formatCurrency(savedAmount)} de {formatCurrency(totalAmount)}
          </p>
          {completed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              <Trophy size={12} /> Concluído!
            </span>
          )}
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-dm-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(pct, 1) * 100}%`, backgroundColor: completed ? '#10b981' : color }}
          />
        </div>
      </div>

      <Link
        to={`/challenges/${challenge.id}`}
        className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 self-end transition-colors"
      >
        Ver desafio <ChevronRight size={12} />
      </Link>
    </div>
  )
}
