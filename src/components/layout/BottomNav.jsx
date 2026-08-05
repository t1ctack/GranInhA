import { NavLink } from 'react-router-dom'
import { PiggyBank, LayoutDashboard, ArrowLeftRight, MessageSquare } from 'lucide-react'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Início' },
  { to: '/accounts',    icon: PiggyBank,        label: 'Contas' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Extrato' },
  { to: '/chat',        icon: MessageSquare,    label: 'Chat' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-dm-surface border-t border-gray-200 dark:border-dm-border flex z-50">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors duration-150 ${
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-gray-400 dark:text-slate-500'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
