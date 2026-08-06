import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ChevronLeft, Check, Trophy } from 'lucide-react'
import { useChallenges } from '@/hooks/useChallenges'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { CHALLENGE_TYPES, periodLabel } from '@/constants/challenges'
import { DEFAULT_CATEGORY_ID } from '@/constants/categories'
import { formatCurrency } from '@/services/formatters'
import Confetti from '@/components/challenges/Confetti'

function compactAmount(v) {
  return v % 1 === 0 ? `R$${v}` : `R$${v.toFixed(2).replace('.', ',')}`
}

export default function ChallengeDetail() {
  const { id } = useParams()
  const { challenges, loading, markPeriodCompleted } = useChallenges()
  const { accounts } = useAccounts()
  const { createTransaction } = useTransactions()

  const [completingIndex, setCompletingIndex] = useState(null)

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card h-24 animate-pulse bg-gray-100 dark:bg-dm-muted/60 !p-0" />
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="card aspect-square animate-pulse bg-gray-100 dark:bg-dm-muted/60 !p-0" />
          ))}
        </div>
      </div>
    )
  }

  const challenge = challenges.find(c => c.id === id)
  if (!challenge) return <Navigate to="/challenges" replace />

  const account       = accounts.find(a => a.id === challenge.accountId)
  const typeInfo      = CHALLENGE_TYPES[challenge.type]
  const unit          = challenge.unit
  const totalAmount   = challenge.periodValues.reduce((s, v) => s + v, 0)
  const savedAmount   = challenge.completedPeriods.reduce((s, idx) => s + (challenge.periodValues[idx] ?? 0), 0)
  const pct           = challenge.totalPeriods > 0 ? challenge.completedPeriods.length / challenge.totalPeriods : 0
  const completed     = challenge.totalPeriods > 0 && challenge.completedPeriods.length >= challenge.totalPeriods
  const startDateLabel = new Date(`${challenge.startDate}T00:00:00`).toLocaleDateString('pt-BR')

  async function handleComplete(index) {
    if (challenge.completedPeriods.includes(index) || !account) return
    setCompletingIndex(index)
    try {
      await createTransaction({
        type:        'income',
        accountId:   challenge.accountId,
        amount:      challenge.periodValues[index],
        description: `${typeInfo?.label ?? 'Desafio'} - ${periodLabel(unit)} ${index + 1}`,
        date:        new Date(),
        category:    DEFAULT_CATEGORY_ID,
      })
      await markPeriodCompleted(challenge.id, index)
    } catch (err) {
      console.error('Erro ao concluir checkpoint do desafio:', err)
    } finally {
      setCompletingIndex(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/challenges"
          className="text-xs text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 mb-2 transition-colors w-fit"
        >
          <ChevronLeft size={14} /> Desafios
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{typeInfo?.label ?? 'Desafio'}</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          {account ? account.name : 'Conta excluída'} · início em {startDateLabel}
        </p>
      </div>

      {/* Progress summary */}
      <div className="card relative overflow-hidden">
        {completed && <Confetti />}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            <span className="font-semibold text-gray-900 dark:text-slate-100">{challenge.completedPeriods.length}</span> de {challenge.totalPeriods} concluídos
            {' · '}
            <span className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(savedAmount)}</span> de {formatCurrency(totalAmount)}
          </p>
          {completed && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Trophy size={13} /> Desafio Concluído! 🏆
            </span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 dark:bg-dm-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pct, 1) * 100}%`, backgroundColor: completed ? '#10b981' : (account?.color ?? '#22c55e') }}
          />
        </div>
      </div>

      {!account && (
        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-sm text-gray-700 dark:text-slate-300">
          A conta vinculada a este desafio foi excluída — não é possível concluir novos checkpoints.
        </div>
      )}

      {/* Checkpoint grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {challenge.periodValues.map((value, index) => {
          const done      = challenge.completedPeriods.includes(index)
          const isPending = completingIndex === index

          return (
            <button
              key={index}
              type="button"
              disabled={done || isPending || !account}
              onClick={() => handleComplete(index)}
              title={`${periodLabel(unit)} ${index + 1} · ${formatCurrency(value)}`}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 p-1 transition-all duration-150 ${
                done
                  ? 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'border-gray-200 dark:border-dm-border hover:bg-gray-50 dark:hover:bg-dm-hover text-gray-500 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {done ? <Check size={16} /> : <span className="text-[10px] font-semibold">{index + 1}</span>}
              <span className="text-[9px] tabular-nums leading-none">{compactAmount(value)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
