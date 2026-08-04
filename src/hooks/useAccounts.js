import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

function accountsRef(uid) {
  return collection(db, 'users', uid, 'accounts')
}

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(accountsRef(user.uid), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(
        snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      )
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  async function addAccount(account) {
    const docRef = await addDoc(accountsRef(user.uid), {
      balance: 0,
      ...account,
      createdAt: serverTimestamp(),
    })
    return { id: docRef.id, ...account }
  }

  async function updateBalance(id, delta) {
    const account = accounts.find(a => a.id === id)
    if (!account) return
    await updateDoc(doc(db, 'users', user.uid, 'accounts', id), {
      balance: account.balance + delta,
    })
  }

  async function removeAccount(id) {
    await deleteDoc(doc(db, 'users', user.uid, 'accounts', id))
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance ?? 0), 0)

  return { accounts, loading, addAccount, updateBalance, removeAccount, totalBalance }
}
