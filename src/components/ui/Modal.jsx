import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * `footer`, when provided, renders outside the scrollable body — a shrink-0 row
 * pinned to the bottom of the modal, so primary actions (Salvar/Confirmar/Cancelar)
 * stay reachable no matter how tall the body content gets. Submit buttons that live
 * in the footer but need to trigger a <form> in the body should use the HTML
 * `form="<id>"` attribute rather than nesting, since they're DOM siblings.
 */
export default function Modal({ title, onClose, footer, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-dm-surface border border-gray-200 dark:border-dm-border w-full max-w-md shadow-2xl animate-slide-up flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] rounded-t-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dm-border shrink-0">
          <h2 className="font-semibold text-base text-gray-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="btn-ghost w-11 h-11 -mr-2 flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 overflow-y-auto flex-1 min-h-0">{children}</div>

        {footer && (
          <div
            className="shrink-0 px-5 py-4 border-t border-gray-200 dark:border-dm-border"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
