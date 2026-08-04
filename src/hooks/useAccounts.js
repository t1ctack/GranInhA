import { useState, useEffect } from 'react'

// Local storage key — will migrate to Firebase in the next step
const STORAGE_KEY = 'graninha:accounts'

export function useAccounts() {
  const [accounts, setAccounts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  }, [accounts])

  function addAccount(account) {
    const newAccount = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      balance: 0,
      ...account,
    }
    setAccounts(prev => [...prev, newAccount])
    return newAccount
  }

  function updateBalance(id, delta) {
    setAccounts(prev =>
      prev.map(acc => acc.id === id ? { ...acc, balance: acc.balance + delta } : acc)
    )
  }

  function removeAccount(id) {
    setAccounts(prev => prev.filter(acc => acc.id !== id))
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  return { accounts, addAccount, updateBalance, removeAccount, totalBalance }
}
