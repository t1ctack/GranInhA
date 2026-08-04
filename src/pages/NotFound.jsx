import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <span className="text-7xl mb-6">🐷</span>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-slate-400 mb-6">Esse porquinho fugiu do chiqueiro.</p>
      <Link to="/" className="btn-primary">
        Voltar para o início
      </Link>
    </div>
  )
}
