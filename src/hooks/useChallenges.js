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

function challengesRef(uid) {
  return collection(db, 'users', uid, 'challenges')
}

export function useChallenges() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(challengesRef(user.uid), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user])

  async function createChallenge({ type, accountId, startDate, unit, periodValues }) {
    const docRef = await addDoc(challengesRef(user.uid), {
      type,
      accountId,
      startDate,
      unit,
      totalPeriods: periodValues.length,
      periodValues,
      completedPeriods: [],
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  /** Marks a period as completed — the caller is responsible for creating the matching
   *  income transaction first (see ChallengeDetail), this only updates the checklist. */
  async function markPeriodCompleted(challengeId, periodIndex) {
    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge || challenge.completedPeriods.includes(periodIndex)) return
    const next = [...challenge.completedPeriods, periodIndex].sort((a, b) => a - b)
    await updateDoc(doc(db, 'users', user.uid, 'challenges', challengeId), { completedPeriods: next })
  }

  async function deleteChallenge(id) {
    await deleteDoc(doc(db, 'users', user.uid, 'challenges', id))
  }

  return { challenges, loading, createChallenge, markPeriodCompleted, deleteChallenge }
}
