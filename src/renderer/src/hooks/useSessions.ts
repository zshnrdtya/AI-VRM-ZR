import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, SessionItem } from '../lib/db'

export const STORAGE_KEY = 'zeera_active_session_id'

export function useSessions(onTabChange: (tab: 'assistant' | 'chat' | 'about') => void) {
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  // Ambil seluruh daftar sesi dari IndexedDB secara reaktif
  const sessions: SessionItem[] =
    useLiveQuery(() => db.sessions.orderBy('updatedAt').reverse().toArray(), [], []) || []

  // Pastikan selalu ada minimal 1 sesi percakapan bersih saat aplikasi dibuka
  useEffect(() => {
    const ensureSession = async () => {
      try {
        const allSessions = await db.sessions.orderBy('updatedAt').reverse().toArray()
        let emptySession: SessionItem | null = null

        // Cari sesi yang masih benar-benar kosong (0 pesan dari pengguna)
        for (const s of allSessions) {
          const userMsgCount = await db.messages
            .where('sessionId')
            .equals(s.id)
            .filter((m) => m.role === 'user')
            .count()
          if (userMsgCount === 0) {
            emptySession = s
            break
          }
        }

        if (emptySession) {
          setActiveSessionId(emptySession.id)
          localStorage.setItem(STORAGE_KEY, emptySession.id)
        } else {
          // Buat sesi kosong awal
          const newId = 'session_' + Date.now()
          const now = Date.now()
          await db.sessions.add({
            id: newId,
            title: 'Percakapan Baru',
            createdAt: now,
            updatedAt: now
          })
          await db.messages.add({
            id: 'welcome_' + now,
            sessionId: newId,
            role: 'assistant',
            text: 'Halo! Aku Zeera di ruang percakapan teks. Tanyakan apa saja padaku, dan aku akan menjawab secara lengkap dalam format teks tanpa suara.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: now
          })
          setActiveSessionId(newId)
          localStorage.setItem(STORAGE_KEY, newId)
        }
      } catch (err: unknown) {
        console.error('[Zeera DB] Error ensureSession:', err)
      }
    }
    ensureSession()
  }, [])

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId)
    localStorage.setItem(STORAGE_KEY, sessionId)
    onTabChange('chat')
  }

  // Mulai sesi chat baru: selalu buka sesi yang benar-benar bersih (0 pesan user)
  const handleStartNewChat = async () => {
    try {
      if (activeSessionId) {
        const currentSession = await db.sessions.get(activeSessionId)
        if (currentSession) {
          const userMsgCount = await db.messages
            .where('sessionId')
            .equals(activeSessionId)
            .filter((m) => m.role === 'user')
            .count()
          if (userMsgCount === 0) {
            onTabChange('chat')
            return
          }
        }
      }

      const allSessions = await db.sessions.orderBy('updatedAt').reverse().toArray()
      for (const s of allSessions) {
        const count = await db.messages
          .where('sessionId')
          .equals(s.id)
          .filter((m) => m.role === 'user')
          .count()
        if (count === 0) {
          setActiveSessionId(s.id)
          localStorage.setItem(STORAGE_KEY, s.id)
          onTabChange('chat')
          return
        }
      }

      const newId = 'session_' + Date.now()
      const now = Date.now()
      await db.sessions.add({
        id: newId,
        title: 'Percakapan Baru',
        createdAt: now,
        updatedAt: now
      })
      await db.messages.add({
        id: 'welcome_' + now,
        sessionId: newId,
        role: 'assistant',
        text: 'Halo! Aku Zeera di ruang percakapan teks. Tanyakan apa saja padaku, dan aku akan menjawab secara lengkap dalam format teks tanpa suara.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: now
      })

      setActiveSessionId(newId)
      localStorage.setItem(STORAGE_KEY, newId)
      onTabChange('chat')
    } catch (err: unknown) {
      console.error('[Zeera DB] Error handleStartNewChat:', err)
      onTabChange('chat')
    }
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setSessionToDelete(sessionId)
  }

  const confirmDeleteSession = async () => {
    if (sessionToDelete) {
      try {
        await db.messages.where('sessionId').equals(sessionToDelete).delete()
        await db.sessions.delete(sessionToDelete)
        if (activeSessionId === sessionToDelete) {
          handleStartNewChat()
        }
      } catch (err: unknown) {
        console.error('[Zeera DB] Gagal menghapus sesi:', err)
      } finally {
        setSessionToDelete(null)
      }
    }
  }

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    sessionToDelete,
    setSessionToDelete,
    handleSelectSession,
    handleStartNewChat,
    handleDeleteSession,
    confirmDeleteSession
  }
}
