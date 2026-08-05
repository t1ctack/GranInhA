import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useAuth } from '@/contexts/AuthContext'
import TransactionFormModal from '@/components/transactions/TransactionFormModal'
import TransactionItem from '@/components/transactions/TransactionItem'
import BalanceEvolutionChart from '@/components/dashboard/BalanceEvolutionChart'
import ExpensesByAccountChart from '@/components/dashboard/ExpensesByAccountChart'
import { formatCurrency } from '@/services/formatters'
import { TYPE_META } from '@/components/accounts/AccountCard'
import logoIcon from '@/assets/logo-icon-cropped.png'

function SkeletonCard() {
  return <div className="card h-20 animate-pulse bg-gray-100 dark:bg-dm-muted/60 !p-0" />
}

export default function Dashboard() {
  const { user } = useAuth()
  const { accounts, loading: loadingAccounts, totalBalance } = useAccounts()
  const { transactions, loading: loadingTxs, createTransaction, monthlyIncome, monthlyExpense } = useTransactions()

  const [showForm, setShowForm] = useState(false)

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))
  const recentTxs  = transactions.slice(0, 5)
  const firstName  = user?.displayName?.split(' ')[0] ?? 'você'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Olá, {firstName}! 👋</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Aqui está seu resumo financeiro</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Nova Transação</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Summary cards */}
      {loadingAccounts || loadingTxs ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Saldo Total"
            value={formatCurrency(totalBalance)}
            icon={Wallet}
            color="text-brand-600 dark:text-brand-400"
            bg="bg-brand-500/10"
          />
          <SummaryCard
            label={`Entradas (${new Date().toLocaleDateString('pt-BR', { month: 'short' })})`}
            value={formatCurrency(monthlyIncome)}
            icon={TrendingUp}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <SummaryCard
            label={`Saídas (${new Date().toLocaleDateString('pt-BR', { month: 'short' })})`}
            value={formatCurrency(monthlyExpense)}
            icon={TrendingDown}
            color="text-red-500 dark:text-red-400"
            bg="bg-red-500/10"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BalanceEvolutionChart transactions={transactions} loading={loadingTxs} />
        <ExpensesByAccountChart transactions={transactions} accounts={accounts} loading={loadingTxs || loadingAccounts} />
      </div>

      {/* Accounts */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">Suas Contas</h2>
          <Link to="/accounts" className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors">
            Ver todas <ArrowRight size={12} />
          </Link>
        </div>

        {loadingAccounts ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 rounded-xl animate-pulse bg-gray-100 dark:bg-dm-muted/60" />)}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-400 dark:text-slate-500">
            <img src={logoIcon} alt="" className="h-14 w-auto mb-2 opacity-50 animate-float" />
            <p className="text-sm">Nenhuma conta ainda.</p>
            <Link to="/accounts" className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-1 transition-colors">
              Criar minha primeira conta →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.slice(0, 4).map(acc => {
              const meta = TYPE_META[acc.type] ?? TYPE_META.other
              return (
                <div key={acc.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dm-muted/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ backgroundColor: `${acc.color ?? '#22c55e'}22` }}
                    >
                      {meta.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-tight text-gray-900 dark:text-slate-100">{acc.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{meta.label}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${acc.balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-slate-200'}`}>
                    {formatCurrency(acc.balance ?? 0)}
                  </span>
                </div>
              )
            })}
            {accounts.length > 4 && (
              <Link to="/accounts" className="block text-center text-xs text-gray-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 py-2 transition-colors">
                + {accounts.length - 4} conta{accounts.length - 4 > 1 ? 's' : ''} a mais
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">Últimas Transações</h2>
          <Link to="/transactions" className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors">
            Ver extrato <ArrowRight size={12} />
          </Link>
        </div>

        {loadingTxs ? (
          <div className="space-y-1 mt-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-gray-100 dark:bg-dm-muted/60" />)}
          </div>
        ) : recentTxs.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-400 dark:text-slate-500">
            <img src={logoIcon} alt="" className="h-14 w-auto mb-2 opacity-50 animate-float" />
            <p className="text-sm">Nenhuma transação registrada.</p>
            <button onClick={() => setShowForm(true)} className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-1 transition-colors">
              Registrar primeira transação →
            </button>
          </div>
        ) : (
          recentTxs.map(tx => (
            <TransactionItem
              key={tx.id}
              tx={tx}
              account={accountMap[tx.accountId]}
              onDelete={null}
            />
          ))
        )}
      </div>

      {showForm && (
        <TransactionFormModal
          accounts={accounts}
          onSave={createTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`${bg} p-3 rounded-xl shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 dark:text-slate-400 text-xs truncate">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  )
}
