import { useState } from 'react'
import { Plus, Trophy } from 'lucide-react'
import { useChallenges } from '@/hooks/useChallenges'
import { useAccounts } from '@/hooks/useAccounts'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import ChallengeFormModal from '@/components/challenges/ChallengeFormModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { CHALLENGE_TYPES } from '@/constants/challenges'

function SkeletonCard() {
  return <div className="card h-32 animate-pulse bg-gray-100 dark:bg-dm-muted/60 !p-0" />
}

export default function Challenges() {
  const { challenges, loading, createChallenge, deleteChallenge } = useChallenges()
  const { accounts } = useAccounts()

  const [showForm,      setShowForm]      = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      await deleteChallenge(pendingDelete.id)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Desafios</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Crie o hábito de economizar, um passo de cada vez</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Desafio</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState onCreateClick={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map(c => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              account={accountMap[c.accountId]}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ChallengeFormModal
          accounts={accounts}
          onSave={createChallenge}
          onClose={() => setShowForm(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Excluir desafio"
          description={`Isso vai remover o "${CHALLENGE_TYPES[pendingDelete.type]?.label ?? 'Desafio'}" e seu progresso. As transações já criadas pelos checkpoints concluídos não serão apagadas.`}
          confirmLabel="Excluir"
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
        <Trophy size={40} className="text-gray-300 dark:text-slate-600 mb-4" />
        <p className="font-medium text-gray-700 dark:text-slate-300">Nenhum desafio ainda</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-6 max-w-xs">
          Comece um desafio de 52 semanas, 30 dias ou personalizado e transforme economizar em um hábito visual.
        </p>
        <button onClick={onCreateClick} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Criar primeiro desafio
        </button>
      </div>
    </div>
  )
}
