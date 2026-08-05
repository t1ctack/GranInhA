import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

/**
 * `requireTypedConfirmation`, when set to a phrase (e.g. "CONFIRMAR"), keeps the
 * confirm button disabled until the user types that exact phrase — used for
 * irreversible, wide-blast-radius actions.
 */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  danger = false,
  loading = false,
  requireTypedConfirmation = null,
  onConfirm,
  onClose,
}) {
  const [typed, setTyped] = useState('')
  const locked = Boolean(requireTypedConfirmation) && typed.trim() !== requireTypedConfirmation

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{description}</p>
        </div>

        {requireTypedConfirmation && (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Digite <span className="font-semibold text-gray-700 dark:text-slate-200">{requireTypedConfirmation}</span> para confirmar
            </label>
            <input
              className="input"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={requireTypedConfirmation}
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || locked}
            className={`font-medium px-4 py-2 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'btn-primary'
            }`}
          >
            {loading ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
