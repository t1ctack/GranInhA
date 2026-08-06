import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, AlertTriangle, Target } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import AccountCard from '@/components/accounts/AccountCard'
import AccountFormModal from '@/components/accounts/AccountFormModal'
import Modal from '@/components/ui/Modal'
import logoIcon from '@/assets/logo-icon-cropped.png'

function SkeletonCard() {
  return <div className="card h-32 animate-pulse bg-gray-100 dark:bg-dm-muted/60 !p-0" />
}

export default function Accounts() {
  const { accounts, loading, addAccount, updateAccount, removeAccount } = useAccounts()

  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openCreate() { setEditing(null); setShowForm(true) }
  function openEdit(account) { setEditing(account); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null) }

  async function handleSave(data) {
    if (editing) {
      await updateAccount(editing.id, data)
    } else {
      await addAccount(data)
    }
  }

  async function handleDelete(withTransactions) {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      await removeAccount(pendingDelete.id, { withTransactions })
      setPendingDelete(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Contas</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Porquinhos, cartões e carteiras</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/goals" className="btn-ghost flex items-center gap-2">
            <Target size={16} />
            <span className="hidden sm:inline">Metas</span>
          </Link>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Nova Conta</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState onCreateClick={openCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={openEdit}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <AccountFormModal
          initial={editing}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {pendingDelete && (
        <Modal
          title="Excluir conta"
          onClose={() => !deleteLoading && setPendingDelete(null)}
          footer={
            <div className="flex justify-end">
              <button type="button" onClick={() => setPendingDelete(null)} disabled={deleteLoading} className="btn-ghost">
                Cancelar
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                Tem certeza que deseja excluir <strong>{pendingDelete.name}</strong>? O que fazer com o histórico de transações dessa conta?
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDelete(true)}
                disabled={deleteLoading}
                className="w-full text-left px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {deleteLoading ? 'Excluindo…' : 'Excluir conta e histórico'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Remove a conta e todas as transações vinculadas a ela.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(false)}
                disabled={deleteLoading}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-dm-border hover:bg-gray-50 dark:hover:bg-dm-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {deleteLoading ? 'Excluindo…' : 'Excluir apenas a conta'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Mantém o histórico — as transações passam a aparecer como órfãs no Extrato.
                </p>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EmptyState({ onCreateClick }) {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <img src={logoIcon} alt="" className="h-20 w-auto mb-5 opacity-60 animate-float" />
        <p className="font-medium text-gray-700 dark:text-slate-300">Nenhuma conta criada ainda</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-6 max-w-xs">
          Crie porquinhos de poupança, cartões de crédito, carteiras ou contas correntes para começar a controlar suas finanças.
        </p>
        <button onClick={onCreateClick} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Criar primeira conta
        </button>
      </div>
    </div>
  )
}
