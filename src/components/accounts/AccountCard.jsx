import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

export const TYPE_META = {
  piggy:       { label: 'Porquinho',         emoji: '🐷' },
  credit_card: { label: 'Cartão de Crédito', emoji: '💳' },
  wallet:      { label: 'Carteira',          emoji: '👛' },
  checking:    { label: 'Conta Corrente',    emoji: '🏦' },
  other:       { label: 'Outro',             emoji: '📁' },
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AccountCard({ account, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const meta    = TYPE_META[account.type] ?? TYPE_META.other
  const balance = account.balance ?? 0
  const color   = account.color ?? '#22c55e'

  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      className="card relative flex flex-col gap-4"
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      {/* Header: icon + name + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
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

        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="btn-ghost !p-1.5 -mr-1 -mt-0.5"
            aria-label="Opções da conta"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 bg-white dark:bg-dark-muted border border-gray-200 dark:border-dark-border rounded-xl shadow-xl w-36 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit(account) }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors text-left"
              >
                <Pencil size={14} className="text-gray-400 dark:text-slate-400" />
                Editar
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(account) }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors text-left"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Balance */}
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Saldo atual</p>
        <p className={`text-xl font-bold tabular-nums ${balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-slate-100'}`}>
          {fmt.format(balance)}
        </p>
      </div>
    </div>
  )
}
