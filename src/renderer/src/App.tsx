import React, { useState, useEffect } from 'react'
import { styles } from './styles/appStyles'
import { SplashScreen } from './components/SplashScreen'
import { Sidebar } from './components/Sidebar'
import { AssistantTab } from './components/AssistantTab'
import { ChatMode } from './components/ChatMode'
import { AboutTab } from './components/AboutTab'
import { DeleteSessionModal } from './components/DeleteSessionModal'
import { useSessions, STORAGE_KEY } from './hooks/useSessions'
import { useAvatarAssistant } from './hooks/useAvatarAssistant'

type NavTab = 'assistant' | 'chat' | 'about'

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assistant')

  const checkIsMobile = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024 || (Boolean(window.matchMedia) && window.matchMedia('(max-width: 1023px)').matches)
  }

  const [isMobile, setIsMobile] = useState(checkIsMobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  // Durasi animasi splash screen saat awal aplikasi dimuat
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, 2000)

    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  // Tema Gelap & Terang dengan penyimpanan lokal
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zeera_theme')
      if (saved === 'light' || saved === 'dark') return saved
    }
    return 'dark'
  })

  useEffect(() => {
    try {
      localStorage.setItem('zeera_theme', theme)
      document.body.classList.toggle('light-theme', theme === 'light')
    } catch (e: unknown) {
      console.warn('[Zeera Theme] Error saving theme:', e)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Listener resize untuk deteksi perangkat seluler / tablet secara responsif
  useEffect(() => {
    const handleResize = () => {
      const mobile = checkIsMobile()
      setIsMobile(mobile)
      if (!mobile) {
        setIsSidebarOpen(false)
      }
    }

    handleResize()

    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 1023px)') : null
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      if (!e.matches) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', handleMediaChange)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (mql && mql.removeEventListener) {
        mql.removeEventListener('change', handleMediaChange)
      }
    }
  }, [])

  const {
    emotion,
    gesture,
    animationState,
    status,
    inputText,
    setInputText,
    currentUserMsg,
    currentAiMsg,
    isListening,
    errorMessage,
    handleControllersReady,
    toggleListening,
    handleSendMessage,
    stopVoice
  } = useAvatarAssistant()

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab)
    if (isMobile) {
      setIsSidebarOpen(false)
    }

    if (tab !== 'assistant') {
      stopVoice()
    }

    if (tab === 'assistant') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 60)
    }
  }

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    sessionToDelete,
    setSessionToDelete,
    handleSelectSession,
    handleStartNewChat,
    handleDeleteSession,
    confirmDeleteSession
  } = useSessions(handleTabChange)

  return (
    <div style={styles.appRoot}>
      {/* Splash Screen Welcome Overlay */}
      <SplashScreen show={showSplash} isFadingOut={isFadingOut} isMobile={isMobile} />

      {/* Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={styles.mobileBackdrop} />
      )}

      {/* Sidebar Navigasi Utama */}
      <Sidebar
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onStartNewChat={handleStartNewChat}
        onDeleteSession={handleDeleteSession}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div style={styles.contentArea}>
        {/* TAB 1: AI Asisten Virtual 3D */}
        <AssistantTab
          isMobile={isMobile}
          activeTab={activeTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          status={status}
          emotion={emotion}
          gesture={gesture}
          animationState={animationState}
          onControllersReady={handleControllersReady}
          theme={theme}
          currentUserMsg={currentUserMsg}
          currentAiMsg={currentAiMsg}
          errorMessage={errorMessage}
          isListening={isListening}
          onToggleListening={toggleListening}
          inputText={inputText}
          onInputChange={setInputText}
          onSendMessage={() => handleSendMessage()}
        />

        {/* TAB 2: AI Text Chat */}
        <div
          style={{
            ...styles.tabView,
            display: activeTab === 'chat' ? 'flex' : 'none'
          }}
        >
          <ChatMode
            isMobile={isMobile}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            activeSessionId={activeSessionId}
            onSessionChange={(id) => {
              setActiveSessionId(id)
              localStorage.setItem(STORAGE_KEY, id)
            }}
            onCreateNewSession={handleStartNewChat}
          />
        </div>

        {/* TAB 3: Tentang & Panduan Proyek */}
        <AboutTab isMobile={isMobile} onOpenSidebar={() => setIsSidebarOpen(true)} activeTab={activeTab} />
      </div>

      {/* Modal Konfirmasi Hapus Sesi */}
      <DeleteSessionModal
        isOpen={Boolean(sessionToDelete)}
        onCancel={() => setSessionToDelete(null)}
        onConfirm={confirmDeleteSession}
      />
    </div>
  )
}
