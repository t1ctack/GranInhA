import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border w-full max-w-md shadow-2xl animate-slide-up flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] rounded-t-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-border shrink-0">
          <h2 className="font-semibold text-base text-gray-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5 -mr-1" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
