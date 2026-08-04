import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

function transactionsRef(uid) {
  return collection(db, 'users', uid, 'transactions')
}

export function useTransactions(maxItems = 50) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(
      transactionsRef(user.uid),
      orderBy('createdAt', 'desc'),
      limit(maxItems),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(
        snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      )
      setLoading(false)
    })

    return unsubscribe
  }, [user, maxItems])

  async function addTransaction(tx) {
    const docRef = await addDoc(transactionsRef(user.uid), {
      ...tx,
      createdAt: serverTimestamp(),
    })
    return { id: docRef.id, ...tx }
  }

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return { transactions, loading, addTransaction, totalIncome, totalExpense }
}
