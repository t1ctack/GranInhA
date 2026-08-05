import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import logoFull from '@/assets/logo-full.png'
import logoIcon from '@/assets/logo-icon.png'

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [busy, setBusy]   = useState(false)

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <img src={logoIcon} alt="GranInhA" className="h-16 w-auto animate-float" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleGoogle() {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      navigate('/', { replace: true })
    } catch (err) {
      setError('Não foi possível entrar com o Google. Tente novamente.')
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-5">
          <img
            src={logoIcon}
            alt="GranInhA"
            className="h-24 w-auto animate-float drop-shadow-[0_0_24px_rgba(74,222,128,0.35)]"
          />
          <img src={logoFull} alt="GranInhA" className="h-10 w-auto" />
          <p className="text-gray-500 dark:text-slate-400 text-sm text-center leading-relaxed">
            Controle financeiro pessoal com porquinhos,<br />cartões e carteiras
          </p>
        </div>

        {/* Card */}
        <div className="card w-full flex flex-col gap-4">
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
            Entre para acessar suas contas
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-50 dark:hover:bg-slate-100 text-gray-900 font-medium px-4 py-3 rounded-xl border border-gray-200 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {busy ? 'Entrando…' : 'Entrar com Google'}
          </button>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs text-center">{error}</p>
          )}
        </div>

        <p className="text-gray-400 dark:text-slate-600 text-xs text-center">
          Seus dados ficam salvos de forma segura no Firebase.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
