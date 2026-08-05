import { NavLink } from 'react-router-dom'
import { PiggyBank, LayoutDashboard, ArrowLeftRight, MessageSquare, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import logoFull from '@/assets/logo-full.png'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Início' },
  { to: '/accounts',    icon: PiggyBank,        label: 'Contas' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Extrato' },
  { to: '/chat',        icon: MessageSquare,    label: 'Chat' },
]

export default function Sidebar() {
  const { user, signOut }  = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-4 gap-2 shrink-0">
      <div className="px-2 py-3 mb-4">
        <img src={logoFull} alt="GranInhA" className="h-12 w-auto" />
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
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-slate-800 pt-3 mt-1 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-150"
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
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
