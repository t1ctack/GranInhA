import { useState, useEffect } from 'react'

const STORAGE_KEY = 'graninha:transactions'

export function useTransactions() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  function addTransaction(tx) {
    const newTx = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...tx,
    }
    setTransactions(prev => [newTx, ...prev])
    return newTx
  }

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return { transactions, addTransaction, totalIncome, totalExpense }
}
