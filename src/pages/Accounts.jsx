import { Plus } from 'lucide-react'

const ACCOUNT_TYPES = [
  { type: 'piggy',  label: 'Porquinho', emoji: '🐷' },
  { type: 'card',   label: 'Cartão',    emoji: '💳' },
  { type: 'wallet', label: 'Carteira',  emoji: '👛' },
]

export default function Accounts() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas</h1>
          <p className="text-slate-400 text-sm mt-1">Porquinhos, cartões e carteiras</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nova Conta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACCOUNT_TYPES.map(({ type, label, emoji }) => (
          <button
            key={type}
            className="card flex flex-col items-center gap-2 py-6 hover:border-brand-600 transition-colors cursor-pointer"
          >
            <span className="text-4xl">{emoji}</span>
            <span className="text-sm font-medium text-slate-300">Criar {label}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-14 text-slate-500">
          <span className="text-5xl mb-4">🐷</span>
          <p className="text-sm">Você ainda não tem contas.</p>
          <p className="text-xs mt-1">Clique em <span className="text-brand-400">Nova Conta</span> para começar!</p>
        </div>
      </div>
    </div>
  )
}
