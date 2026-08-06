import { useState, useMemo } from 'react'
import Modal from '@/components/ui/Modal'
import { CHALLENGE_TYPES, buildPeriodValues, periodLabel, periodDate } from '@/constants/challenges'
import { formatCurrency, todayDateStr } from '@/services/formatters'

function parseBRL(raw) {
  return Number(String(raw).replace(/\./g, '').replace(',', '.'))
}

const UNIT_OPTIONS = [
  { value: 'weeks', label: 'Semanas' },
  { value: 'days',  label: 'Dias' },
]

export default function ChallengeFormModal({ accounts, onSave, onClose }) {
  const [form, setForm] = useState({
    type:          'week52',
    accountId:     accounts[0]?.id ?? '',
    startDate:     todayDateStr(),
    dailyValue:    '',
    customTotal:   '',
    customPeriods: '10',
    customUnit:    'weeks',
  })
  const [errs, setErrs]     = useState({})
  const [saving, setSaving] = useState(false)

  function field(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errs[key]) setErrs(prev => ({ ...prev, [key]: null }))
  }

  const unit = form.type === 'custom' ? form.customUnit : CHALLENGE_TYPES[form.type].unit

  const periodValues = useMemo(() => {
    if (form.type === 'days30') {
      return buildPeriodValues('days30', { dailyValue: parseBRL(form.dailyValue) || 0 })
    }
    if (form.type === 'custom') {
      return buildPeriodValues('custom', {
        totalAmount:  parseBRL(form.customTotal) || 0,
        totalPeriods: parseInt(form.customPeriods, 10) || 0,
      })
    }
    return buildPeriodValues('week52')
  }, [form.type, form.dailyValue, form.customTotal, form.customPeriods])

  const totalAmount = periodValues.reduce((s, v) => s + v, 0)

  function validate() {
    const e = {}
    if (!form.accountId) e.accountId = 'Selecione uma conta'

    if (form.type === 'days30') {
      const v = parseBRL(form.dailyValue)
      if (!form.dailyValue || isNaN(v) || v <= 0) e.dailyValue = 'Informe um valor diário maior que zero'
    }

    if (form.type === 'custom') {
      const total   = parseBRL(form.customTotal)
      const periods = parseInt(form.customPeriods, 10)
      if (!form.customTotal || isNaN(total) || total <= 0) e.customTotal = 'Informe um valor total maior que zero'
      if (!periods || periods < 2 || periods > 104) e.customPeriods = 'Escolha entre 2 e 104 períodos'
    }

    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length) { setErrs(validation); return }

    setSaving(true)
    try {
      await onSave({
        type:      form.type,
        accountId: form.accountId,
        startDate: form.startDate,
        unit,
        periodValues,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Novo Desafio" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Tipo de desafio</label>
          <div className="space-y-2">
            {Object.values(CHALLENGE_TYPES).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => field('type', t.id)}
                aria-pressed={form.type === t.id}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors duration-150 ${
                  form.type === t.id
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-gray-200 dark:border-dm-border hover:bg-gray-50 dark:hover:bg-dm-hover'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{t.label}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t.tagline}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Type-specific config */}
        {form.type === 'days30' && (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Valor diário</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">R$</span>
              <input
                className={`input pl-9 ${errs.dailyValue ? 'ring-2 ring-red-500 border-transparent' : ''}`}
                placeholder="5,00"
                value={form.dailyValue}
                onChange={e => field('dailyValue', e.target.value)}
                inputMode="decimal"
                autoFocus
              />
            </div>
            {errs.dailyValue && <p className="text-red-400 text-xs mt-1">{errs.dailyValue}</p>}
          </div>
        )}

        {form.type === 'custom' && (
          <>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Valor total desejado</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">R$</span>
                <input
                  className={`input pl-9 ${errs.customTotal ? 'ring-2 ring-red-500 border-transparent' : ''}`}
                  placeholder="1.000,00"
                  value={form.customTotal}
                  onChange={e => field('customTotal', e.target.value)}
                  inputMode="decimal"
                  autoFocus
                />
              </div>
              {errs.customTotal && <p className="text-red-400 text-xs mt-1">{errs.customTotal}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Períodos</label>
                <input
                  type="number"
                  min="2"
                  max="104"
                  className={`input ${errs.customPeriods ? 'ring-2 ring-red-500 border-transparent' : ''}`}
                  value={form.customPeriods}
                  onChange={e => field('customPeriods', e.target.value)}
                />
                {errs.customPeriods && <p className="text-red-400 text-xs mt-1">{errs.customPeriods}</p>}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Unidade</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-dm-muted rounded-xl">
                  {UNIT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field('customUnit', opt.value)}
                      aria-pressed={form.customUnit === opt.value}
                      className={`py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                        form.customUnit === opt.value
                          ? 'bg-white dark:bg-dm-surface text-gray-900 dark:text-slate-100 shadow-md'
                          : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Account */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Conta</label>
          {accounts.length === 0 ? (
            <p className="text-sm text-amber-400 bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-500/20">
              Crie uma conta antes de iniciar um desafio.
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

        {/* Start date */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Data de início</label>
          <input
            type="date"
            className="input"
            value={form.startDate}
            onChange={e => field('startDate', e.target.value)}
          />
        </div>

        {/* Preview */}
        {periodValues.length > 0 && (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Prévia do cronograma ({periodValues.length} {periodLabel(unit).toLowerCase()}{periodValues.length > 1 ? 's' : ''})
            </label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-dm-border divide-y divide-gray-100 dark:divide-dm-border/60">
              {periodValues.map((v, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="text-gray-500 dark:text-slate-400">
                    {periodLabel(unit)} {i + 1} · {periodDate(form.startDate, i, unit).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-slate-200 tabular-nums">{formatCurrency(v)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              Total ao final: <span className="font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(totalAmount)}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={saving || accounts.length === 0} className="btn-primary">
            {saving ? 'Criando…' : 'Criar desafio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
