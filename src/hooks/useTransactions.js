import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  runTransaction,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { isCurrentMonth } from '@/services/formatters'

function txsRef(uid) {
  return collection(db, 'users', uid, 'transactions')
}

function accountDocRef(uid, accountId) {
  return doc(db, 'users', uid, 'accounts', accountId)
}

export function useTransactions(maxItems = 200) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(txsRef(user.uid), orderBy('date', 'desc'), limit(maxItems))
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user, maxItems])

  /** Atomically writes the transaction and updates the account balance */
  async function createTransaction({ type, accountId, amount, description, date }) {
    const newTxRef  = doc(txsRef(user.uid))
    const accRef    = accountDocRef(user.uid, accountId)
    const delta     = type === 'income' ? amount : -amount

    await runTransaction(db, async (t) => {
      const accSnap = await t.get(accRef)
      if (!accSnap.exists()) throw new Error('Conta não encontrada')
      const balance = accSnap.data().balance ?? 0
      t.update(accRef, { balance: balance + delta })
      t.set(newTxRef, {
        type,
        accountId,
        amount,
        description: description?.trim() ?? '',
        date: Timestamp.fromDate(new Date(date)),
        createdAt: serverTimestamp(),
      })
    })
  }

  /** Atomically reverses the balance change and removes the transaction */
  async function deleteTransaction(tx) {
    const txDocRef = doc(db, 'users', user.uid, 'transactions', tx.id)
    const accRef   = accountDocRef(user.uid, tx.accountId)
    const delta    = tx.type === 'income' ? -tx.amount : tx.amount

    await runTransaction(db, async (t) => {
      const accSnap = await t.get(accRef)
      // If the account was deleted, still remove the transaction (no balance to revert)
      if (accSnap.exists()) {
        const balance = accSnap.data().balance ?? 0
        t.update(accRef, { balance: balance + delta })
      }
      t.delete(txDocRef)
    })
  }

  const monthlyIncome = transactions
    .filter(t => t.type === 'income'  && isCurrentMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && isCurrentMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  return { transactions, loading, createTransaction, deleteTransaction, monthlyIncome, monthlyExpense }
}
