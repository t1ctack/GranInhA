import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, MoreVertical, AlertTriangle, Eraser, SlidersHorizontal, X, SearchX } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactionFilters } from '@/hooks/useTransactionFilters'
import TransactionFormModal from '@/components/transactions/TransactionFormModal'
import TransactionFiltersModal from '@/components/transactions/TransactionFiltersModal'
import TransactionItem from '@/components/transactions/TransactionItem'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { groupByDay, formatCurrency, toDate } from '@/services/formatters'
import { getPeriodRange, PERIOD_OPTIONS } from '@/services/dateRanges'
import { DEFAULT_CATEGORY_ID, getCategory } from '@/constants/categories'
import logoIcon from '@/assets/logo-icon-cropped.png'

function SkeletonRow() {
  return <div className="h-14 rounded-xl animate-pulse bg-gray-100 dark:bg-dm-muted/60 my-1" />
}

export default function Transactions() {
  const {
    transactions, loading, createTransaction, deleteTransaction,
    bulkDeleteTransactions, deleteAllTransactions,
  } = useTransactions()
  const { accounts } = useAccounts()

  const {
    filters, toggleAccount, toggleCategory, setType, setPeriod, setCustomRange,
    clearAccounts, clearCategories, clearType, clearPeriod, clearFilters, activeCount,
  } = useTransactionFilters()

  const [showForm,        setShowForm]        = useState(false)
  const [showFilters,     setShowFilters]     = useState(false)
  const [pendingDelete,   setPendingDelete]   = useState(null)
  const [deleteLoading,   setDeleteLoading]   = useState(false)
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [showOrphanConfirm,   setShowOrphanConfirm]   = useState(false)
  const [orphanLoading,       setOrphanLoading]       = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [clearAllLoading,     setClearAllLoading]     = useState(false)

  const menuRef = useRef(null)

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))
  const orphanTxs  = transactions.filter(t => !accountMap[t.accountId])

  const filtered = useMemo(() => {
    const [from, to] = getPeriodRange(filters.period, filters.dateFrom, filters.dateTo)
    return transactions.filter(t => {
      if (filters.accountIds.length && !filters.accountIds.includes(t.accountId)) return false
      if (filters.type !== 'all' && t.type !== filters.type) return false
      const catId = t.category ?? DEFAULT_CATEGORY_ID
      if (filters.categoryIds.length && !filters.categoryIds.includes(catId)) return false
      if (from || to) {
        const d = toDate(t.date)
        if (from && d < from) return false
        if (to   && d > to)   return false
      }
      return true
    })
  }, [transactions, filters])

  const summary = useMemo(() => {
    let income = 0, expense = 0
    for (const t of filtered) {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense, net: income - expense }
  }, [filtered])

  const groups = groupByDay(filtered)

  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      await deleteTransaction(pendingDelete)
      setPendingDelete(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleClearOrphans() {
    setOrphanLoading(true)
    try {
      await bulkDeleteTransactions(orphanTxs.map(t => t.id))
      setShowOrphanConfirm(false)
    } finally {
      setOrphanLoading(false)
    }
  }

  async function handleClearAll() {
    setClearAllLoading(true)
    try {
      await deleteAllTransactions()
      setShowClearAllConfirm(false)
    } finally {
      setClearAllLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Extrato</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Histórico de transações</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(true)} className="btn-ghost relative flex items-center gap-2">
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtrar</span>
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[10px] font-bold leading-none w-4 h-4 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Nova Transação</span>
            <span className="sm:hidden">Nova</span>
          </button>

          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="btn-ghost !p-2.5"
              aria-label="Opções do extrato"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-20 bg-white dark:bg-dm-muted border border-gray-200 dark:border-dm-border rounded-xl shadow-xl w-56 overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); setShowClearAllConfirm(true) }}
                  disabled={transactions.length === 0}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <Eraser size={14} />
                  Limpar todo o histórico
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.accountIds.length > 0 && (
            <ActiveChip label={accountsChipLabel(filters.accountIds, accounts)} onRemove={clearAccounts} />
          )}
          {filters.type !== 'all' && (
            <ActiveChip label={filters.type === 'income' ? 'Entradas' : 'Saídas'} onRemove={clearType} />
          )}
          {filters.categoryIds.length > 0 && (
            <ActiveChip label={categoriesChipLabel(filters.categoryIds)} onRemove={clearCategories} />
          )}
          {filters.period !== 'all' && (
            <ActiveChip label={periodChipLabel(filters)} onRemove={clearPeriod} />
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 transition-colors"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* Orphan transactions banner */}
      {orphanTxs.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-gray-700 dark:text-slate-300">
              {orphanTxs.length} {orphanTxs.length > 1 ? 'transações pertencem' : 'transação pertence'} a contas que foram excluídas.
            </p>
          </div>
          <button
            onClick={() => setShowOrphanConfirm(true)}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0 whitespace-nowrap"
          >
            Limpar transações órfãs
          </button>
        </div>
      )}

      {/* Filtered summary */}
      {!loading && filtered.length > 0 && (
        <div className="card grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Entradas</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(summary.income)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Saídas</p>
            <p className="text-sm font-semibold text-red-500 dark:text-red-400 tabular-nums">
              {formatCurrency(summary.expense)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Saldo</p>
            <p className={`text-sm font-semibold tabular-nums ${summary.net < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-slate-100'}`}>
              {formatCurrency(summary.net)}
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="card">
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : filtered.length === 0 ? (
        <EmptyFilteredState onClear={clearFilters} />
      ) : (
        <div className="space-y-4">
          {groups.map(({ label, items }) => (
            <div key={label} className="card">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                {label}
              </h3>
              {items.map(tx => (
                <TransactionItem
                  key={tx.id}
                  tx={tx}
                  account={accountMap[tx.accountId]}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <TransactionFormModal
          accounts={accounts}
          onSave={createTransaction}
          onClose={() => setShowForm(false)}
        />
      )}

      {showFilters && (
        <TransactionFiltersModal
          accounts={accounts}
          filters={filters}
          toggleAccount={toggleAccount}
          toggleCategory={toggleCategory}
          setType={setType}
          setPeriod={setPeriod}
          setCustomRange={setCustomRange}
          clearAccounts={clearAccounts}
          clearCategories={clearCategories}
          clearFilters={clearFilters}
          activeCount={activeCount}
          onClose={() => setShowFilters(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Desfazer transação"
          description={`Isso vai reverter ${pendingDelete.type === 'income' ? 'a entrada' : 'a saída'} de ${formatCurrency(pendingDelete.amount)} e atualizar o saldo da conta.`}
          confirmLabel="Desfazer"
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}

      {showOrphanConfirm && (
        <ConfirmDialog
          title="Limpar transações órfãs"
          description={`Isso vai remover ${orphanTxs.length} ${orphanTxs.length > 1 ? 'transações vinculadas' : 'transação vinculada'} a contas que não existem mais. Suas contas atuais não serão afetadas.`}
          confirmLabel="Limpar"
          danger
          loading={orphanLoading}
          onConfirm={handleClearOrphans}
          onClose={() => setShowOrphanConfirm(false)}
        />
      )}

      {showClearAllConfirm && (
        <ConfirmDialog
          title="Limpar todo o histórico"
          description="Isso vai apagar PERMANENTEMENTE todas as suas transações. Suas contas e saldos atuais não serão alterados — apenas o histórico de lançamentos. Essa ação não pode ser desfeita."
          confirmLabel="Apagar tudo"
          danger
          requireTypedConfirmation="CONFIRMAR"
          loading={clearAllLoading}
          onConfirm={handleClearAll}
          onClose={() => setShowClearAllConfirm(false)}
        />
      )}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <img src={logoIcon} alt="" className="h-20 w-auto mb-5 opacity-60 animate-float" />
        <p className="font-medium text-gray-700 dark:text-slate-300">Nenhuma transação ainda</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-6 max-w-xs">
          Registre entradas e saídas manualmente ou use o chat com linguagem natural.
        </p>
        <button onClick={onAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Primeira transação
        </button>
      </div>
    </div>
  )
}

function EmptyFilteredState({ onClear }) {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX size={40} className="text-gray-300 dark:text-slate-600 mb-4" />
        <p className="font-medium text-gray-700 dark:text-slate-300">Nenhuma transação encontrada</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-6 max-w-xs">
          Nenhum lançamento corresponde aos filtros selecionados.
        </p>
        <button onClick={onClear} className="btn-primary">
          Limpar filtros
        </button>
      </div>
    </div>
  )
}

function ActiveChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand-600/10 text-brand-700 dark:text-brand-400 text-xs font-medium pl-3 pr-1.5 py-1 rounded-full">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remover filtro: ${label}`}
        className="hover:bg-brand-600/20 rounded-full p-0.5 transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  )
}

function accountsChipLabel(ids, accounts) {
  if (ids.length === 1) return accounts.find(a => a.id === ids[0])?.name ?? '1 conta'
  return `${ids.length} contas`
}

function categoriesChipLabel(ids) {
  if (ids.length === 1) return getCategory(ids[0]).label
  return `${ids.length} categorias`
}

function periodChipLabel(filters) {
  if (filters.period === 'custom') {
    const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).toLocaleDateString('pt-BR') : '…'
    const to   = filters.dateTo   ? new Date(`${filters.dateTo}T00:00:00`).toLocaleDateString('pt-BR')   : '…'
    return `${from} – ${to}`
  }
  return PERIOD_OPTIONS.find(p => p.value === filters.period)?.label ?? 'Personalizado'
}
