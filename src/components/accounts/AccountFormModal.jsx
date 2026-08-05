import { useState } from 'react'
import Modal from '@/components/ui/Modal'

const ACCOUNT_TYPES = [
  { value: 'piggy',       label: 'Porquinho 🐷' },
  { value: 'credit_card', label: 'Cartão de Crédito 💳' },
  { value: 'wallet',      label: 'Carteira 👛' },
  { value: 'checking',    label: 'Conta Corrente 🏦' },
  { value: 'other',       label: 'Outro 📁' },
]

export const PALETTE = [
  { label: 'Índigo',   value: '#6366f1' },
  { label: 'Roxo',     value: '#a855f7' },
  { label: 'Rosa',     value: '#ec4899' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja',  value: '#f97316' },
  { label: 'Amarelo',  value: '#eab308' },
  { label: 'Verde',    value: '#22c55e' },
  { label: 'Azul',     value: '#3b82f6' },
]

function parseBalance(raw) {
  // Accepts "1.234,56" or "1234.56" or "1234,56"
  return Number(raw.replace(/\./g, '').replace(',', '.'))
}

export default function AccountFormModal({ initial, onSave, onClose }) {
  const isEditing = Boolean(initial)

  const [form, setForm] = useState({
    name:    initial?.name  ?? '',
    type:    initial?.type  ?? 'piggy',
    color:   initial?.color ?? '#22c55e',
    balance: '',             // only shown on create
  })
  const [errors, setSaving_] = useState({})  // reused for errors + saving below
  const [errs, setErrs]     = useState({})
  const [saving, setSaving]  = useState(false)

  function field(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errs[key]) setErrs(prev => ({ ...prev, [key]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!isEditing) {
      if (form.balance === '') {
        e.balance = 'Informe o saldo inicial (pode ser 0)'
      } else if (isNaN(parseBalance(form.balance))) {
        e.balance = 'Valor inválido'
      }
    }
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length) { setErrs(validation); return }

    setSaving(true)
    try {
      const data = {
        name:  form.name.trim(),
        type:  form.type,
        color: form.color,
      }
      if (!isEditing) data.balance = parseBalance(form.balance)
      await onSave(data)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEditing ? 'Editar Conta' : 'Nova Conta'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Nome da conta</label>
          <input
            className={`input ${errs.name ? 'ring-2 ring-red-500 border-transparent' : ''}`}
            placeholder="Ex: Porquinho do Inter"
            value={form.name}
            onChange={e => field('name', e.target.value)}
            autoFocus
            maxLength={60}
          />
          {errs.name && <p className="text-red-400 text-xs mt-1">{errs.name}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Tipo</label>
          <select
            className="input"
            value={form.type}
            onChange={e => field('type', e.target.value)}
          >
            {ACCOUNT_TYPES.map(t => (
              <option key={t.value} value={t.value} className="bg-slate-800">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Initial balance — only on create */}
        {!isEditing && (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Saldo inicial</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                R$
              </span>
              <input
                className={`input pl-9 ${errs.balance ? 'ring-2 ring-red-500 border-transparent' : ''}`}
                placeholder="0,00"
                value={form.balance}
                onChange={e => field('balance', e.target.value)}
                inputMode="decimal"
              />
            </div>
            {errs.balance && <p className="text-red-400 text-xs mt-1">{errs.balance}</p>}
            <p className="text-slate-500 text-xs mt-1">O saldo só pode ser alterado através de transações após a criação.</p>
          </div>
        )}

        {/* Color palette */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Cor</label>
          <div className="flex gap-2 flex-wrap">
            {PALETTE.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                title={label}
                onClick={() => field('color', value)}
                className="w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: value,
                  outline: form.color === value ? `3px solid ${value}` : '3px solid transparent',
                  outlineOffset: '2px',
                }}
                aria-label={label}
                aria-pressed={form.color === value}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar conta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
