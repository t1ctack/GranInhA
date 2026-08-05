import { useState, useRef, useEffect } from 'react'
import { Plus, MoreVertical, AlertTriangle, Eraser } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import TransactionFormModal from '@/components/transactions/TransactionFormModal'
import TransactionItem from '@/components/transactions/TransactionItem'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { groupByDay, formatCurrency } from '@/services/formatters'
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

  const [showForm,        setShowForm]        = useState(false)
  const [pendingDelete,   setPendingDelete]   = useState(null)
  const [deleteLoading,   setDeleteLoading]   = useState(false)
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [showOrphanConfirm,   setShowOrphanConfirm]   = useState(false)
  const [orphanLoading,       setOrphanLoading]       = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [clearAllLoading,     setClearAllLoading]     = useState(false)

  const menuRef = useRef(null)

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))
  const groups     = groupByDay(transactions)
  const orphanTxs  = transactions.filter(t => !accountMap[t.accountId])

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

      {/* Body */}
      {loading ? (
        <div className="card">
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
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
