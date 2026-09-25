import React from 'react'
import {
  X,
  MessageSquare,
  Bot,
  BookOpen,
  Sun,
  Moon,
  Globe,
  ExternalLink
} from 'lucide-react'
import { SessionItem } from '../lib/db'
import LOGO_URL from '../assets/logo-zeera.jpeg'
import { styles } from '../styles/appStyles'
import { SidebarSessionList } from './sidebar/SidebarSessionList'

interface SidebarProps {
  isMobile: boolean
  isSidebarOpen: boolean
  onCloseSidebar: () => void
  activeTab: 'assistant' | 'chat' | 'about'
  onTabChange: (tab: 'assistant' | 'chat' | 'about') => void
  sessions: SessionItem[]
  activeSessionId: string
  onSelectSession: (sessionId: string) => void
  onStartNewChat: () => void
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobile,
  isSidebarOpen,
  onCloseSidebar,
  activeTab,
  onTabChange,
  sessions,
  activeSessionId,
  onSelectSession,
  onStartNewChat,
  onDeleteSession,
  theme,
  toggleTheme
}) => {
  return (
    <aside
      className={`sidebar-nav ${isMobile ? 'sidebar-mobile' : 'sidebar-desktop'}`}
      style={{
        ...styles.sidebar,
        minWidth: isMobile ? 'auto' : '260px',
        ...(isMobile
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              maxWidth: '85vw',
              zIndex: 50,
              transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              boxShadow: isSidebarOpen ? '8px 0 32px rgba(0,0,0,0.7)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              paddingTop: 'max(10px, env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }
          : {
              position: 'relative',
              transform: 'none'
            })
      }}
    >
      {/* Brand Header with Theme Toggle & Close Button on Mobile */}
      <div
        style={{
          ...styles.sidebarHeader,
          padding: isMobile ? '16px 14px' : '20px',
          gap: isMobile ? '8px' : '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px', minWidth: 0, flex: 1 }}>
          <img
            src={LOGO_URL}
            alt="Zeera Logo"
            style={{
              ...styles.sidebarLogo,
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: isMobile ? '8px' : '10px'
            }}
          />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <h2
              style={{
                ...styles.sidebarBrandTitle,
                fontSize: isMobile ? '15.5px' : '17px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              Zeera AI
            </h2>
            <span
              style={{
                ...styles.sidebarBrandSubtitle,
                fontSize: isMobile ? '10.5px' : '11px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                display: 'block'
              }}
            >
              Virtual 3D Assistant
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '8px',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              ...styles.themeToggleBtn,
              width: isMobile ? '38px' : '36px',
              height: isMobile ? '38px' : '36px',
              borderRadius: isMobile ? '10px' : '8px'
            }}
            title={theme === 'dark' ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
            aria-label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
          </button>
          {isMobile && (
            <button
              onClick={() => onCloseSidebar()}
              style={{
                ...styles.sidebarCloseBtn,
                width: '38px',
                height: '38px',
                borderRadius: '10px'
              }}
              title="Tutup Menu"
              aria-label="Tutup Menu"
            >
              <X size={19} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={styles.navMenu}>
        {/* Menu 1: AI Text Chat */}
        <button
          onClick={onStartNewChat}
          style={{
            ...styles.navItem,
            ...(activeTab === 'chat' ? styles.navItemActive : {})
          }}
        >
          <span
            style={{
              ...styles.navIcon,
              color: activeTab === 'chat' ? 'var(--accent-blue-text)' : 'var(--text-secondary)'
            }}
          >
            <MessageSquare size={19} />
          </span>
          <div style={styles.navTextWrapper}>
            <span style={styles.navTitle}>AI Text Chat</span>
            <span style={styles.navDesc}>Mode Teks Tanpa Suara</span>
          </div>
        </button>

        {/* Menu 2: AI Asisten Virtual */}
        <button
          onClick={() => onTabChange('assistant')}
          style={{
            ...styles.navItem,
            ...(activeTab === 'assistant' ? styles.navItemActive : {})
          }}
        >
          <span
            style={{
              ...styles.navIcon,
              color: activeTab === 'assistant' ? 'var(--accent-blue-text)' : 'var(--text-secondary)'
            }}
          >
            <Bot size={19} />
          </span>
          <div style={styles.navTextWrapper}>
            <span style={styles.navTitle}>AI Asisten Virtual</span>
            <span style={styles.navDesc}>Avatar 3D & Percakapan</span>
          </div>
        </button>

        {/* Menu 3: Filosofi & Panduan */}
        <button
          onClick={() => onTabChange('about')}
          style={{
            ...styles.navItem,
            ...(activeTab === 'about' ? styles.navItemActive : {})
          }}
        >
          <span
            style={{
              ...styles.navIcon,
              color: activeTab === 'about' ? 'var(--accent-blue-text)' : 'var(--text-secondary)'
            }}
          >
            <BookOpen size={19} />
          </span>
          <div style={styles.navTextWrapper}>
            <span style={styles.navTitle}>Filosofi & Panduan</span>
            <span style={styles.navDesc}>Makna Brand & Tata Cara</span>
          </div>
        </button>
      </nav>

      {/* Riwayat Chat Section */}
      <SidebarSessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeTab={activeTab}
        onSelectSession={onSelectSession}
        onStartNewChat={onStartNewChat}
        onDeleteSession={onDeleteSession}
      />

      {/* Sidebar Footer: Theme Toggle & Creator Portfolio */}
      <div
        style={{
          ...styles.sidebarFooter,
          padding: isMobile ? '14px 14px 18px 14px' : '16px 14px'
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            ...styles.themeToggleCard,
            padding: isMobile ? '11px 14px' : '10px 14px',
            marginBottom: isMobile ? '14px' : '12px',
            borderRadius: '12px'
          }}
          title={theme === 'dark' ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
          aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
            <span
              style={{
                ...styles.themeToggleText,
                fontSize: isMobile ? '13px' : '12.5px'
              }}
            >
              {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            </span>
          </span>
          <span style={styles.themeBadge}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>

        <div style={styles.creatorCard}>
          <div style={styles.creatorHeader}>
            <span style={styles.creatorTag}>DEVELOPER</span>
          </div>
          <h4 style={styles.creatorName}>Raditya Rai Zeeshan</h4>
          <p style={styles.creatorRole}>Creator of Zeera AI</p>
          <a
            href="https://radityarz.my.id"
            target="_blank"
            rel="noreferrer"
            style={styles.portfolioButton}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={13} /> radityarz.my.id
            </span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </aside>
  )
}
