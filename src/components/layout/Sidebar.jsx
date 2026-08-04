import { NavLink } from 'react-router-dom'
import { PiggyBank, LayoutDashboard, ArrowLeftRight, MessageSquare, Settings } from 'lucide-react'

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Início' },
  { to: '/accounts',   icon: PiggyBank,        label: 'Contas' },
  { to: '/transactions',icon: ArrowLeftRight,  label: 'Extrato' },
  { to: '/chat',       icon: MessageSquare,    label: 'Chat' },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 bg-slate-900 border-r border-slate-800 p-4 gap-2 shrink-0">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <span className="text-2xl">🐷</span>
        <span className="text-xl font-bold tracking-tight text-brand-400">GranInhA</span>
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
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors duration-150">
        <Settings size={18} />
        Configurações
      </button>
    </aside>
  )
}
