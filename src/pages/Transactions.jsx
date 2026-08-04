import { Plus, Filter } from 'lucide-react'

export default function Transactions() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Extrato</h1>
          <p className="text-slate-400 text-sm mt-1">Histórico de transações</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-2">
            <Filter size={16} />
            Filtrar
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Transação
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col items-center justify-center py-14 text-slate-500">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-sm">Nenhuma transação encontrada.</p>
          <p className="text-xs mt-1">
            Adicione manualmente ou use o{' '}
            <span className="text-brand-400">Chat</span> com linguagem natural.
          </p>
        </div>
      </div>
    </div>
  )
}
