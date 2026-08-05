import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { toDatetimeLocal, parseBRL } from '@/services/formatters'

export default function TransactionFormModal({ accounts, onSave, onClose }) {
  const [form, setForm] = useState({
    type:        'expense',
    accountId:   accounts[0]?.id ?? '',
    amount:      '',
    description: '',
    date:        toDatetimeLocal(),
  })
  const [errs, setErrs]     = useState({})
  const [saving, setSaving] = useState(false)

  function field(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errs[key]) setErrs(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const e = {}
    if (!form.accountId) e.accountId = 'Selecione uma conta'
    const parsed = parseBRL(form.amount)
    if (!form.amount || isNaN(parsed) || parsed <= 0) e.amount = 'Informe um valor maior que zero'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length) { setErrs(validation); return }
    setSaving(true)
    try {
      await onSave({
        type:        form.type,
        accountId:   form.accountId,
        amount:      parseBRL(form.amount),
        description: form.description.trim(),
        date:        form.date,
      })
      onClose()
    } catch (err) {
      console.error('Erro ao salvar transação:', err)
    } finally {
      setSaving(false)
    }
  }

  const isIncome = form.type === 'income'

  return (
    <Modal title="Nova Transação" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Type toggle */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Tipo</label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            {[
              { value: 'expense', label: 'Saída',   Icon: TrendingDown, activeClass: 'bg-red-600 text-white shadow-md' },
              { value: 'income',  label: 'Entrada',  Icon: TrendingUp,   activeClass: 'bg-emerald-600 text-white shadow-md' },
            ].map(({ value, label, Icon, activeClass }) => (
              <button
                key={value}
                type="button"
                onClick={() => field('type', value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  form.type === value ? activeClass : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Conta</label>
          {accounts.length === 0 ? (
            <p className="text-sm text-amber-400 bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-500/20">
              Crie uma conta antes de registrar transações.
            </p>
          ) : (
            <>
              <select
                className={`input ${errs.accountId ? 'ring-2 ring-red-500 border-transparent' : ''}`}
                value={form.accountId}
                onChange={e => field('accountId', e.target.value)}
              >
                <option value="">Selecione uma conta…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errs.accountId && <p className="text-red-400 text-xs mt-1">{errs.accountId}</p>}
            </>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Valor</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              R$
            </span>
            <input
              className={`input pl-9 ${errs.amount ? 'ring-2 ring-red-500 border-transparent' : ''}`}
              placeholder="0,00"
              value={form.amount}
              onChange={e => field('amount', e.target.value)}
              inputMode="decimal"
              autoFocus
            />
          </div>
          {errs.amount && <p className="text-red-400 text-xs mt-1">{errs.amount}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Descrição <span className="text-slate-600">(opcional)</span>
          </label>
          <input
            className="input"
            placeholder="Ex: Mercado do mês"
            value={form.description}
            onChange={e => field('description', e.target.value)}
            maxLength={120}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Data e hora</label>
          <input
            type="datetime-local"
            className="input"
            value={form.date}
            onChange={e => field('date', e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || accounts.length === 0}
            className={`font-medium px-4 py-2 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {saving
              ? 'Salvando…'
              : isIncome ? 'Registrar entrada' : 'Registrar saída'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
