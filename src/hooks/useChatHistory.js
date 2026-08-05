import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

function chatRef(uid) {
  return collection(db, 'users', uid, 'chatMessages')
}

/**
 * One-time load of the last 100 chat messages from Firestore.
 * After that, manages state locally and persists asynchronously.
 * history === null  →  still loading
 * history === []    →  no prior messages (fresh chat)
 */
export function useChatHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState(null)

  useEffect(() => {
    if (!user) return
    const q = query(chatRef(user.uid), orderBy('ts', 'asc'), limit(100))
    getDocs(q)
      .then(snap => {
        setHistory(
          snap.docs.map(d => ({
            id:   d.id,
            role: d.data().role,
            text: d.data().text,
            ts:   d.data().ts?.toMillis() ?? Date.now(),
          }))
        )
      })
      .catch(err => {
        console.error('Failed to load chat history:', err)
        setHistory([])
      })
  }, [user])

  /**
   * Persists an array of { role, text } objects to Firestore.
   * Uses client-side millisecond offsets so ordering is preserved even
   * when two messages land in the same batch commit.
   */
  async function saveMessages(msgs) {
    if (!user || !msgs.length) return
    const base  = Date.now()
    const batch = writeBatch(db)
    msgs.forEach((msg, i) => {
      batch.set(doc(chatRef(user.uid)), {
        role: msg.role,
        text: msg.text,
        ts:   Timestamp.fromMillis(base + i),
      })
    })
    await batch.commit()
  }

  return { history, saveMessages }
}
