import React from 'react'
import { Menu, Plus, Trash2 } from 'lucide-react'
import { chatStyles } from '../../styles/chatStyles'

interface ChatHeaderProps {
  isMobile: boolean
  onOpenSidebar: () => void
  onCreateNewSession: () => void
  onDeleteCurrentChat: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isMobile,
  onOpenSidebar,
  onCreateNewSession,
  onDeleteCurrentChat
}) => {
  return (
    <header
      style={{
        ...chatStyles.header,
        paddingTop: isMobile ? 'max(6px, env(safe-area-inset-top, 0px))' : '0',
        paddingLeft: isMobile ? '12px' : '28px',
        paddingRight: isMobile ? '12px' : '28px',
        height: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px',
        minHeight: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          ...chatStyles.headerLeft,
          gap: isMobile ? '10px' : '12px',
          minWidth: 0,
          flex: 1
        }}
      >
        {isMobile && (
          <button
            onClick={onOpenSidebar}
            style={{ ...chatStyles.hamburgerBtn, flexShrink: 0 }}
            title="Buka Menu"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1
            style={{
              ...chatStyles.title,
              fontSize: isMobile ? '15px' : '17px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}
          >
            Zeera Text Chat
          </h1>
          <span
            style={{
              ...chatStyles.subtitle,
              fontSize: isMobile ? '10.5px' : '11px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block'
            }}
          >
            {isMobile ? 'Tersimpan Lokal' : 'Local-First Persistent Chat (No TTS)'}
          </span>
        </div>
      </div>

      <div
        style={{
          ...chatStyles.headerRight,
          gap: isMobile ? '6px' : '8px',
          flexShrink: 0
        }}
      >
        <button
          onClick={onCreateNewSession}
          style={{
            ...chatStyles.newChatBtn,
            ...(isMobile
              ? {
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  borderRadius: '10px',
                  justifyContent: 'center',
                  fontSize: '15px'
                }
              : {})
          }}
          title="Mulai Percakapan Baru"
          aria-label="Mulai Percakapan Baru"
        >
          <Plus size={isMobile ? 18 : 13} />
          {!isMobile && <span>Chat Baru</span>}
        </button>
        <button
          onClick={onDeleteCurrentChat}
          style={{
            ...chatStyles.clearBtn,
            ...(isMobile
              ? {
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  color: '#fca5a5'
                }
              : {})
          }}
          title="Hapus Percakapan Ini"
          aria-label="Hapus Percakapan Ini"
        >
          <Trash2 size={isMobile ? 18 : 13} />
          {!isMobile && <span>Hapus Chat</span>}
        </button>
      </div>
    </header>
  )
}
