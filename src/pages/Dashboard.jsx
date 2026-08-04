import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const summaryCards = [
  { label: 'Saldo Total', value: 'R$ 0,00', icon: Wallet, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { label: 'Entradas',    value: 'R$ 0,00', icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Saídas',     value: 'R$ 0,00', icon: TrendingDown,  color: 'text-red-400',     bg: 'bg-red-500/10' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Olá! 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Aqui está seu resumo financeiro</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`${bg} p-3 rounded-xl`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">{label}</p>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Suas Contas</h2>
        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
          <span className="text-4xl mb-3">🐷</span>
          <p className="text-sm">Nenhuma conta criada ainda.</p>
          <p className="text-xs mt-1">Vá em <span className="text-brand-400">Contas</span> para criar seu primeiro porquinho!</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Últimas Transações</h2>
        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm">Nenhuma transação registrada.</p>
        </div>
      </div>
    </div>
  )
}
