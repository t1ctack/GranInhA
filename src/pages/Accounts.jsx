import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import AccountCard from '@/components/accounts/AccountCard'
import AccountFormModal from '@/components/accounts/AccountFormModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
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

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      await removeAccount(pendingDelete.id)
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
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Conta</span>
          <span className="sm:hidden">Nova</span>
        </button>
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
        <ConfirmDialog
          title="Excluir conta"
          description={`Tem certeza que deseja excluir "${pendingDelete.name}"? As transações associadas não serão mais exibidas.`}
          confirmLabel="Excluir conta"
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => setPendingDelete(null)}
        />
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
