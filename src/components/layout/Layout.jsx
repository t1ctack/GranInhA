import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import AccountMenu from './AccountMenu'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import logoIcon from '@/assets/logo-icon-cropped.png'

export default function Layout() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top header */}
        <header className="layout-header md:hidden shrink-0 h-10 border-b px-4 flex items-center justify-between">
          <img src={logoIcon} alt="GranInhA" className="h-6 w-auto" />
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="relative p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dm-muted transition-colors before:absolute before:-inset-2 before:content-['']"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setShowAccountMenu(true)}
              className="relative rounded-full before:absolute before:-inset-2 before:content-['']"
              aria-label="Minha conta"
            >
              <img
                src={user?.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName ?? 'U')}&background=16a34a&color=fff`}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-[calc(5rem_+_env(safe-area-inset-bottom))] md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />

      {showAccountMenu && <AccountMenu onClose={() => setShowAccountMenu(false)} />}
    </div>
  )
}
