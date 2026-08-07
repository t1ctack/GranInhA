import { useState } from 'react'
import { LogOut, RefreshCw } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Footer from './Footer'
import { useAuth } from '@/contexts/AuthContext'

export default function AccountMenu({ onClose }) {
  const { user, signOut, switchAccount } = useAuth()
  const [switching, setSwitching] = useState(false)

  async function handleSwitchAccount() {
    setSwitching(true)
    try {
      await switchAccount()
      onClose()
    } catch (err) {
      console.error(err)
      setSwitching(false)
    }
  }

  return (
    <Modal title="Minha conta" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}&background=16a34a&color=fff`}
              alt={user.displayName ?? 'avatar'}
              className="w-10 h-10 rounded-full shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={handleSwitchAccount}
            disabled={switching}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-dm-muted transition-colors duration-150 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            {switching ? 'Trocando…' : 'Trocar de conta'}
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-dm-border pt-4">
          <Footer />
        </div>
      </div>
    </Modal>
  )
}
