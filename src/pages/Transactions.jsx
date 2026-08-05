import { useState } from 'react'
import { Plus } from 'lucide-react'
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
  const { transactions, loading, createTransaction, deleteTransaction } = useTransactions()
  const { accounts } = useAccounts()

  const [showForm,      setShowForm]      = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))
  const groups     = groupByDay(transactions)

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Extrato</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Histórico de transações</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Transação</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

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
