import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/services/firebase'

const AuthContext = createContext(null)

const googleProvider = new GoogleAuthProvider()
// Always show the account picker instead of silently reusing the last Google session.
googleProvider.setCustomParameters({ prompt: 'select_account' })

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  /** Signs the current user out and immediately reopens the Google account picker. */
  async function switchAccount() {
    await firebaseSignOut(auth)
    await signInWithPopup(auth, googleProvider)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, switchAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
