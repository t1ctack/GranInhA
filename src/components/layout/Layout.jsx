import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import logoIcon from '@/assets/logo-icon.png'

export default function Layout() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top header */}
        <header className="md:hidden shrink-0 h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center">
          <img src={logoIcon} alt="GranInhA" className="h-6 w-auto" />
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
