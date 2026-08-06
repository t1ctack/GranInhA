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
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

function accountsRef(uid) {
  return collection(db, 'users', uid, 'accounts')
}

function transactionsRef(uid) {
  return collection(db, 'users', uid, 'transactions')
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

  async function updateAccount(id, { name, type, color, goalAmount = null, goalDate = null }) {
    await updateDoc(doc(db, 'users', user.uid, 'accounts', id), { name, type, color, goalAmount, goalDate })
  }

  /** Deletes the account. When `withTransactions` is true, also deletes every
   *  transaction linked to it — otherwise they're left as orphaned history. */
  async function removeAccount(id, { withTransactions = false } = {}) {
    if (!withTransactions) {
      await deleteDoc(doc(db, 'users', user.uid, 'accounts', id))
      return
    }

    const snap = await getDocs(query(transactionsRef(user.uid), where('accountId', '==', id)))
    const refs = [...snap.docs.map(d => d.ref), doc(db, 'users', user.uid, 'accounts', id)]

    const CHUNK = 450 // stays under Firestore's 500-write batch limit
    for (let i = 0; i < refs.length; i += CHUNK) {
      const batch = writeBatch(db)
      refs.slice(i, i + CHUNK).forEach(ref => batch.delete(ref))
      await batch.commit()
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance ?? 0), 0)

  return { accounts, loading, addAccount, updateAccount, updateBalance, removeAccount, totalBalance }
}
