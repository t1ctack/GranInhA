import Modal from '@/components/ui/Modal'
import { TYPE_META } from '@/components/accounts/AccountCard'
import { CATEGORIES } from '@/constants/categories'
import { PERIOD_OPTIONS } from '@/services/dateRanges'

const TYPE_TOGGLE_OPTIONS = [
  { value: 'all',     label: 'Todas' },
  { value: 'income',  label: 'Entradas' },
  { value: 'expense', label: 'Saídas' },
]

function Chip({ active, onClick, children, activeColor = '#16a34a' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
        active
          ? 'border-transparent text-white'
          : 'border-gray-200 dark:border-dm-border text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dm-hover'
      }`}
      style={active ? { backgroundColor: activeColor } : undefined}
    >
      {children}
    </button>
  )
}

export default function TransactionFiltersModal({
  accounts,
  filters,
  toggleAccount, toggleCategory, setType, setPeriod, setCustomRange,
  clearAccounts, clearCategories, clearFilters, activeCount,
  onClose,
}) {
  return (
    <Modal
      title="Filtros"
      onClose={onClose}
      footer={
        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={clearFilters}
            disabled={activeCount === 0}
            className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Limpar filtros
          </button>
          <button type="button" onClick={onClose} className="btn-primary">
            Aplicar
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Tipo</label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 dark:bg-dm-muted rounded-xl">
            {TYPE_TOGGLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                aria-pressed={filters.type === opt.value}
                className={`py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  filters.type === opt.value
                    ? 'bg-white dark:bg-dm-surface text-gray-900 dark:text-slate-100 shadow-md'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Conta</label>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <Chip active={filters.accountIds.length === 0} onClick={clearAccounts}>
                Todas as contas
              </Chip>
              {accounts.map(a => (
                <Chip
                  key={a.id}
                  active={filters.accountIds.includes(a.id)}
                  onClick={() => toggleAccount(a.id)}
                  activeColor={a.color ?? '#16a34a'}
                >
                  {TYPE_META[a.type]?.emoji ?? '💰'} {a.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Categoria</label>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filters.categoryIds.length === 0} onClick={clearCategories}>
              Todas as categorias
            </Chip>
            {CATEGORIES.map(cat => (
              <Chip
                key={cat.id}
                active={filters.categoryIds.includes(cat.id)}
                onClick={() => toggleCategory(cat.id)}
                activeColor={cat.color}
              >
                {cat.emoji} {cat.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Período</label>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map(opt => (
              <Chip key={opt.value} active={filters.period === opt.value} onClick={() => setPeriod(opt.value)}>
                {opt.label}
              </Chip>
            ))}
            <Chip active={filters.period === 'custom'} onClick={() => setPeriod('custom')}>
              Personalizado
            </Chip>
          </div>

          {filters.period === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">De</label>
                <input
                  type="date"
                  className="input"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={e => setCustomRange(e.target.value, filters.dateTo)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Até</label>
                <input
                  type="date"
                  className="input"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={e => setCustomRange(filters.dateFrom, e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
