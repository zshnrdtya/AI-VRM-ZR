import React from 'react'
import { Menu, AlertTriangle } from 'lucide-react'
import { Emotion, AppStatus } from '../../../shared/types'
import { AvatarCanvas } from './AvatarCanvas'
import { LipSyncController } from '../avatar/LipSyncController'
import MODEL_URL from '../assets/model.vrm?url'
import { styles } from '../styles/appStyles'
import { AssistantFooter } from './assistant/AssistantFooter'

interface AssistantTabProps {
  isMobile: boolean
  activeTab: string
  onOpenSidebar: () => void
  status: AppStatus
  emotion: Emotion
  gesture: string
  animationState: 'idle' | 'talking'
  onControllersReady: (controllers: { lipSync: LipSyncController }) => void
  theme: 'dark' | 'light'
  currentUserMsg: { text: string; timestamp: string } | null
  currentAiMsg: { text: string; timestamp: string } | null
  errorMessage: string | null
  isListening: boolean
  onToggleListening: () => void
  inputText: string
  onInputChange: (text: string) => void
  onSendMessage: () => void
}

export const AssistantTab: React.FC<AssistantTabProps> = ({
  isMobile,
  activeTab,
  onOpenSidebar,
  status,
  emotion,
  gesture,
  animationState,
  onControllersReady,
  theme,
  currentUserMsg,
  currentAiMsg,
  errorMessage,
  isListening,
  onToggleListening,
  inputText,
  onInputChange,
  onSendMessage
}) => {
  return (
    <div
      style={{
        ...styles.tabView,
        display: activeTab === 'assistant' ? 'flex' : 'none'
      }}
    >
      {/* Top Header */}
      <header
        style={{
          ...styles.header,
          paddingTop: isMobile ? 'max(6px, env(safe-area-inset-top, 0px))' : '0',
          paddingLeft: isMobile ? '14px' : '28px',
          paddingRight: isMobile ? '14px' : '28px',
          height: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px',
          minHeight: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px'
        }}
      >
        <div style={styles.headerLeft}>
          {isMobile && (
            <button
              onClick={() => onOpenSidebar()}
              style={styles.hamburgerBtn}
              title="Buka Menu"
              aria-label="Buka Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <h1
            style={{
              ...styles.brandTitle,
              fontSize: isMobile ? '15px' : '17px'
            }}
          >
            Zeera AI Avatar
          </h1>
          {!isMobile && <span style={styles.headerBadge}>Interactive 3D</span>}
        </div>

        <div style={styles.headerRight}>
          <div
            style={{
              ...styles.statusPill,
              padding: isMobile ? '4px 10px' : '6px 14px'
            }}
          >
            <span
              style={{
                ...styles.statusDot,
                backgroundColor:
                  status === 'speaking'
                    ? '#10b981'
                    : status === 'listening'
                    ? '#ef4444'
                    : status === 'processing'
                    ? '#f59e0b'
                    : status === 'error'
                    ? '#f87171'
                    : '#3b82f6'
              }}
            />
            <span
              style={{
                ...styles.statusText,
                fontSize: isMobile ? '11.5px' : '13px'
              }}
            >
              {status === 'speaking'
                ? 'Speaking'
                : status === 'listening'
                ? 'Listening...'
                : status === 'processing'
                ? 'Thinking...'
                : status === 'error'
                ? 'Error'
                : 'Online'}
            </span>
          </div>
        </div>
      </header>

      {/* 3D Canvas Main Stage */}
      <main style={styles.mainArea}>
        {/* 3D Canvas */}
        <div style={styles.canvasContainer}>
          <AvatarCanvas
            modelUrl={MODEL_URL}
            emotion={emotion}
            gesture={gesture}
            animationState={animationState}
            onControllersReady={onControllersReady}
            theme={theme}
          />
        </div>

        {/* Floating Chat Bubbles Overlay (Left: User, Right: Zeera AI) */}
        <div
          style={{
            ...styles.overlayChatContainer,
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            padding: isMobile ? '12px 14px' : '0 40px',
            gap: isMobile ? '12px' : '24px'
          }}
        >
          {/* Balon Pengguna (Kiri) */}
          <div
            style={{
              ...styles.bubbleWrapper,
              justifyContent: 'flex-start',
              alignItems: isMobile ? 'flex-start' : 'center'
            }}
          >
            {currentUserMsg && (
              <div
                style={{
                  ...styles.leftUserBubble,
                  maxWidth: isMobile ? '82%' : '320px',
                  position: 'relative'
                }}
              >
                {!isMobile && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      borderLeft: '8px solid var(--accent-blue)'
                    }}
                  />
                )}
                <div style={styles.bubbleHeader}>
                  <span style={styles.userBubbleAuthor}>Anda</span>
                  <span style={styles.userBubbleTime}>{currentUserMsg.timestamp}</span>
                </div>
                <p style={styles.bubbleText}>{currentUserMsg.text}</p>
              </div>
            )}
          </div>

          {/* Balon AI (Kanan) */}
          <div
            style={{
              ...styles.bubbleWrapper,
              justifyContent: 'flex-end',
              alignItems: isMobile ? 'flex-end' : 'center'
            }}
          >
            {currentAiMsg && (
              <div
                style={{
                  ...styles.rightAiBubble,
                  maxWidth: isMobile ? '88%' : '360px'
                }}
              >
                <div style={styles.bubbleHeader}>
                  <span style={styles.aiBubbleAuthor}>Zeera</span>
                  <span style={styles.aiBubbleTime}>{currentAiMsg.timestamp}</span>
                </div>
                <p style={{ ...styles.bubbleText, color: 'var(--text-primary)' }}>
                  {currentAiMsg.text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div style={{ ...styles.errorBanner, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="#fca5a5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </main>

      {/* Bottom Control Bar */}
      <AssistantFooter
        isMobile={isMobile}
        status={status}
        isListening={isListening}
        onToggleListening={onToggleListening}
        inputText={inputText}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
      />
    </div>
  )
}
