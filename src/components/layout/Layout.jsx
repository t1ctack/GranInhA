import { Outlet } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useTheme } from '@/contexts/ThemeContext'
import logoIcon from '@/assets/logo-icon.png'

export default function Layout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top header */}
        <header className="md:hidden shrink-0 h-10 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-4 flex items-center justify-between">
          <img src={logoIcon} alt="GranInhA" className="h-6 w-auto" />
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dark-muted transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
