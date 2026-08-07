import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { PiggyBank, LayoutDashboard, ArrowLeftRight, MessageSquare, LogOut, RefreshCw, Sun, Moon, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import Footer from './Footer'
import logoFull from '@/assets/logo-full-cropped.png'
import logoFullLight from '@/assets/logo-full-light-cropped.png'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Início' },
  { to: '/accounts',    icon: PiggyBank,        label: 'Contas' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Extrato' },
  { to: '/challenges',   icon: Trophy,          label: 'Desafios' },
  { to: '/chat',        icon: MessageSquare,    label: 'Chat' },
]

export default function Sidebar() {
  const { user, signOut, switchAccount }  = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [switching, setSwitching] = useState(false)

  async function handleSwitchAccount() {
    setSwitching(true)
    try {
      await switchAccount()
    } catch (err) {
      console.error(err)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <aside className="sidebar hidden md:flex flex-col w-60 border-r p-4 gap-2 shrink-0">
      <div className="py-3 mb-4 overflow-hidden">
        <img src={theme === 'light' ? logoFullLight : logoFull} alt="GranInhA" className="h-16 w-auto block" />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-600/10 text-brand-700 dark:bg-brand-600/20 dark:text-brand-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-dm-muted'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-dm-border pt-3 mt-1 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-dm-muted transition-colors duration-150"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <img
              src={user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}&background=16a34a&color=fff`}
              alt={user.displayName ?? 'avatar'}
              className="w-7 h-7 rounded-full shrink-0"
            />
            <span className="text-xs text-gray-600 dark:text-slate-300 truncate">{user.displayName}</span>
          </div>
        )}
        <button
          onClick={handleSwitchAccount}
          disabled={switching}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-dm-muted transition-colors duration-150 disabled:opacity-50"
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

        <div className="pt-2">
          <Footer />
        </div>
      </div>
    </aside>
  )
}
