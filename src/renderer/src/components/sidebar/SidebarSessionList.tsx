import React, { useState } from 'react'
import { Plus, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { SessionItem, db } from '../../lib/db'
import { styles } from '../../styles/appStyles'

interface SidebarSessionListProps {
  sessions: SessionItem[]
  activeSessionId: string
  activeTab: 'assistant' | 'chat' | 'about'
  onSelectSession: (sessionId: string) => void
  onStartNewChat: () => void
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void
}

export const SidebarSessionList: React.FC<SidebarSessionListProps> = ({
  sessions,
  activeSessionId,
  activeTab,
  onSelectSession,
  onStartNewChat,
  onDeleteSession
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitleValue, setEditTitleValue] = useState('')

  const handleSaveRename = async (sessionId: string) => {
    if (editTitleValue.trim() !== '') {
      await db.sessions.update(sessionId, { title: editTitleValue.trim() })
    }
    setEditingSessionId(null)
    setEditTitleValue('')
  }

  const filteredSessions = sessions.filter((s) => s.title !== 'Percakapan Baru')

  return (
    <div style={styles.historySection}>
      <div style={styles.historyHeader}>
        <span style={styles.historyTitle}>Riwayat Chat</span>
        <button
          onClick={onStartNewChat}
          style={{
            ...styles.newChatMiniBtn,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Buat Sesi Chat Baru"
        >
          <Plus size={11} />
          <span>Baru</span>
        </button>
      </div>
      <div style={styles.historyList}>
        {filteredSessions.length === 0 ? (
          <div style={styles.historyEmpty}>Belum ada riwayat</div>
        ) : (
          filteredSessions.map((sess) => {
            const isActive = activeTab === 'chat' && activeSessionId === sess.id
            const isEditing = editingSessionId === sess.id

            return (
              <div
                key={sess.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelectSession(sess.id)
                  }
                }}
                style={{
                  ...styles.historyItem,
                  ...(isActive ? styles.historyItemActive : {})
                }}
                title={isEditing ? undefined : sess.title}
              >
                <span
                  style={{
                    ...styles.historyItemIcon,
                    color: isActive ? 'var(--accent-blue-text)' : 'var(--text-secondary)',
                    display: 'flex'
                  }}
                >
                  <MessageSquare size={13} />
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onBlur={() => handleSaveRename(sess.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(sess.id)
                      if (e.key === 'Escape') {
                        setEditingSessionId(null)
                        setEditTitleValue('')
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '13px',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                ) : (
                  <>
                    <span
                      style={{
                        ...styles.historyItemText,
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectSession(sess.id)}
                    >
                      {sess.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSessionId(sess.id)
                          setEditTitleValue(sess.title)
                        }}
                        style={styles.historyActionBtn}
                        title="Ganti Nama Chat"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => onDeleteSession(e, sess.id)}
                        style={styles.historyDeleteBtn}
                        title="Hapus percakapan ini"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
