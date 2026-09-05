import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, SessionItem } from './lib/db'
import { Emotion, AppStatus } from '../../shared/types'
import { AvatarCanvas } from './components/AvatarCanvas'
import { ChatMode } from './components/ChatMode'
import { LipSyncController } from './avatar/LipSyncController'
import { AudioPlayer } from './voice/AudioPlayer'
import MODEL_URL from './assets/model.vrm?url'
import LOGO_URL from './assets/logo-zz.png'

type NavTab = 'assistant' | 'chat' | 'about'
const STORAGE_KEY = 'zeera_active_session_id'

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assistant')
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Ambil seluruh daftar sesi dari IndexedDB secara reaktif
  const sessions: SessionItem[] = useLiveQuery(
    () => db.sessions.orderBy('updatedAt').reverse().toArray(),
    [],
    []
  ) || []

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
      } catch (err) {
        console.error('[Zeera DB] Error ensureSession:', err)
      }
    }
    ensureSession()
  }, [])

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId)
    localStorage.setItem(STORAGE_KEY, sessionId)
    handleTabChange('chat')
  }

  // Mulai sesi chat baru: selalu buka sesi yang benar-benar bersih (0 pesan user)
  const handleStartNewChat = async () => {
    try {
      // 1. Jika activeSessionId saat ini sudah benar-benar kosong (0 pesan user), langsung gunakan
      if (activeSessionId) {
        const currentSession = await db.sessions.get(activeSessionId)
        if (currentSession) {
          const userMsgCount = await db.messages
            .where('sessionId')
            .equals(activeSessionId)
            .filter((m) => m.role === 'user')
            .count()
          if (userMsgCount === 0) {
            handleTabChange('chat')
            return
          }
        }
      }

      // 2. Cari apakah ada sesi lain di database yang masih kosong (0 pesan user)
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
          handleTabChange('chat')
          return
        }
      }

      // 3. Jika semua sesi sudah ada percakapannya, buat sesi baru yang benar-benar 0
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
      handleTabChange('chat')
    } catch (err) {
      console.error('[Zeera DB] Error handleStartNewChat:', err)
      handleTabChange('chat')
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (confirm('Hapus sesi percakapan ini?')) {
      await db.messages.where('sessionId').equals(sessionId).delete()
      await db.sessions.delete(sessionId)
      if (activeSessionId === sessionId) {
        handleStartNewChat()
      }
    }
  }

  const [emotion, setEmotion] = useState<Emotion>('neutral')
  const [gesture, setGesture] = useState<string>('none')
  const [animationState, setAnimationState] = useState<'idle' | 'talking'>('idle')
  const [lipSync, setLipSync] = useState<LipSyncController | null>(null)

  const [status, setStatus] = useState<AppStatus>('idle')
  const [inputText, setInputText] = useState('')
  const [lastResponse, setLastResponse] = useState<string>('Halo! Aku Zeera, asisten virtual 3D-mu. Ada yang bisa kubantu hari ini?')
  const [isListening, setIsListening] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioPlayerRef = useRef<AudioPlayer | null>(null)
  const conversationHistoryRef = useRef<{ role: 'user' | 'model'; parts: [{ text: string }] }[]>([])

  // Setup AudioPlayer
  useEffect(() => {
    const player = new AudioPlayer()
    audioPlayerRef.current = player
    return () => {
      player.stop()
    }
  }, [])

  // Responsive mobile detector
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Trigger resize when switching tabs to ensure 3D canvas scales properly
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab)
    if (isMobile) {
      setIsSidebarOpen(false)
    }

    // Hentikan suara/TTS jika keluar dari tab avatar 3D
    if (tab !== 'assistant') {
      window.speechSynthesis?.cancel()
      audioPlayerRef.current?.stop()
      if (lipSync) lipSync.setSpeaking(false)
      setAnimationState('idle')
    }

    if (tab === 'assistant') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 60)
    }
  }

  // Setup Web Speech API (Browser STT)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'id-ID'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        setStatus('listening')
        setErrorMessage(null)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInputText(transcript)
          handleSendMessage(transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error !== 'no-speech') {
          setErrorMessage('Gagal menangkap suara. Coba ketik pesanmu.')
        }
        setStatus('idle')
      }

      recognition.onend = () => {
        setIsListening(false)
        setStatus((prev) => (prev === 'listening' ? 'idle' : prev))
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Toggle Microphone
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Browser Anda belum mendukung Speech Recognition. Silakan gunakan Google Chrome atau Microsoft Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setStatus('idle')
    } else {
      try {
        window.speechSynthesis.cancel()
        audioPlayerRef.current?.stop()
        if (lipSync) lipSync.setSpeaking(false)
        setAnimationState('idle')
        recognitionRef.current.start()
      } catch (err) {
        console.error('Error starting mic:', err)
      }
    }
  }

  // Play Speech with Microsoft Edge TTS (or fallback to Web Speech)
  const speakResponse = useCallback(async (text: string) => {
    const cleanText = text.replace(/[*_#`~[\]]/g, '').trim()
    if (!cleanText) {
      setStatus('idle')
      return
    }

    setStatus('speaking')
    setAnimationState('talking')

    // Stop audio lama jika ada
    audioPlayerRef.current?.stop()

    // 1. Prioritaskan Microsoft Edge TTS (/api/tts - suara id-ID-GadisNeural kawaii)
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(cleanText)}`)
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer()
        if (arrayBuffer.byteLength > 0 && audioPlayerRef.current) {
          audioPlayerRef.current.onEnded(() => {
            setStatus('idle')
            setAnimationState('idle')
            setEmotion('neutral')
          })
          await audioPlayerRef.current.playBuffer(arrayBuffer)
          return
        }
      }
    } catch (edgeErr) {
      console.warn('[Zeera] Edge-TTS server tidak merespon, fallback ke Web Speech...', edgeErr)
    }

    // 2. Fallback: browser SpeechSynthesis jika endpoint /api/tts tidak tersedia
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'id-ID'
      utterance.rate = 1.05
      utterance.pitch = 1.15

      const voices = window.speechSynthesis.getVoices()
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'))
      if (idVoice) {
        utterance.voice = idVoice
      }

      utterance.onstart = () => {
        if (lipSync) lipSync.setSpeaking(true)
      }
      utterance.onend = () => {
        setStatus('idle')
        setAnimationState('idle')
        setEmotion('neutral')
        if (lipSync) lipSync.setSpeaking(false)
      }
      utterance.onerror = () => {
        setStatus('idle')
        setAnimationState('idle')
        if (lipSync) lipSync.setSpeaking(false)
      }

      window.speechSynthesis.speak(utterance)
    } else {
      setStatus('idle')
      setAnimationState('idle')
    }
  }, [lipSync])

  // Model respon kilat & stabil yang terbukti aktif
  const FAST_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash'
  ]

  // Kirim Pesan ke Gemini LLM dengan respon cepat & automatic fallback
  const handleSendMessage = async (textOverride?: string) => {
    const message = (textOverride !== undefined ? textOverride : inputText).trim()
    if (!message || status === 'processing' || status === 'speaking') return

    setInputText('')
    setErrorMessage(null)
    setStatus('processing')

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      const fallback = 'Kunci VITE_GEMINI_API_KEY belum diset di file .env. Mohon periksa kembali konfigurasi Anda.'
      setLastResponse(fallback)
      setStatus('error')
      setErrorMessage(fallback)
      return
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      let rawText = ''
      let lastError: any = null

      // Loop coba model yang paling cepat dan stabil
      for (const modelName of FAST_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `Kamu adalah Zeera, asisten virtual 3D anime yang ceria, ramah, dan bersahabat.
Gaya bicaramu santai, sopan, dan ekspresif seperti teman akrab.
Jawablah secara ringkas dan natural (1 sampai 2 kalimat saja) agar nyaman didengar.

Respon WAJIB berupa objek JSON murni:
{
  "text": "isi jawaban singkat santai",
  "emotion": "happy" | "neutral" | "sad" | "surprised" | "relaxed",
  "gesture": "nod" | "wave" | "thinking" | "none"
}
HANYA keluarkan raw JSON tanpa kutipan backtick (\`\`\`json).`
          })

          const chatSession = model.startChat({
            history: conversationHistoryRef.current
          })

          // Beri waktu tunggu wajar hingga 12 detik agar tidak putus prematur
          const sendPromise = chatSession.sendMessage(message)
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout pada model ${modelName}`)), 12000)
          )

          const result = await Promise.race([sendPromise, timeoutPromise])
          rawText = result.response.text().trim()
          if (rawText) break // Berhasil mendapatkan respon kilat!
        } catch (err: any) {
          console.warn(`[Zeera Avatar] Model ${modelName} kendala, mencoba fallback...`, err.message || err)
          lastError = err
        }
      }

      if (!rawText) {
        throw lastError || new Error('Gagal mendapatkan respon dari server Gemini.')
      }

      let parsed: { text: string; emotion?: Emotion; gesture?: string }
      try {
        const cleanedJson = rawText.replace(/^```(json)?\n?/i, '').replace(/```$/i, '').trim()
        parsed = JSON.parse(cleanedJson)
      } catch {
        parsed = {
          text: rawText,
          emotion: 'happy',
          gesture: 'nod'
        }
      }

      // Simpan riwayat yang berhasil saja
      conversationHistoryRef.current.push({
        role: 'user',
        parts: [{ text: message }]
      })
      conversationHistoryRef.current.push({
        role: 'model',
        parts: [{ text: parsed.text }]
      })

      if (conversationHistoryRef.current.length > 16) {
        conversationHistoryRef.current = conversationHistoryRef.current.slice(-16)
      }

      setLastResponse(parsed.text)
      if (parsed.emotion) setEmotion(parsed.emotion)
      if (parsed.gesture) setGesture(parsed.gesture)

      speakResponse(parsed.text)
    } catch (err: any) {
      console.error('Gemini API error:', err)
      const errText = 'Maaf, sepertinya sedang ada kendala koneksi ke server AI.'
      setLastResponse(errText)
      setErrorMessage(err?.message || 'Terjadi kesalahan pada Gemini API')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const handleControllersReady = useCallback((controllers: { lipSync: LipSyncController }) => {
    setLipSync(controllers.lipSync)
    if (audioPlayerRef.current) {
      const { context, source } = audioPlayerRef.current.getLipSyncSource()
      controllers.lipSync.connect(context, source)
    }
  }, [])

  return (
    <div style={styles.appRoot}>
      {/* Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={styles.mobileBackdrop}
        />
      )}

      {/* ============================================================ */}
      {/* SIDEBAR NAVIGATION */}
      {/* ============================================================ */}
      <aside
        style={{
          ...styles.sidebar,
          ...(isMobile
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '280px',
                zIndex: 50,
                transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                boxShadow: isSidebarOpen ? '8px 0 32px rgba(0,0,0,0.7)' : 'none',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                paddingTop: 'max(10px, env(safe-area-inset-top, 0px))',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))'
              }
            : {
                position: 'relative',
                transform: 'none'
              })
        }}
      >
        {/* Brand Header with Close Button on Mobile */}
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={LOGO_URL} alt="Zeera Logo" style={styles.sidebarLogo} />
            <div>
              <h2 style={styles.sidebarBrandTitle}>Zeera AI</h2>
              <span style={styles.sidebarBrandSubtitle}>Virtual 3D Assistant</span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={styles.sidebarCloseBtn}
              title="Tutup Menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={styles.navMenu}>
          {/* Menu 1: AI Text Chat */}
          <button
            onClick={handleStartNewChat}
            style={{
              ...styles.navItem,
              ...(activeTab === 'chat' ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>💬</span>
            <div style={styles.navTextWrapper}>
              <span style={styles.navTitle}>AI Text Chat</span>
              <span style={styles.navDesc}>Mode Teks Tanpa Suara</span>
            </div>
          </button>

          {/* Menu 2: AI Asisten Virtual */}
          <button
            onClick={() => handleTabChange('assistant')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'assistant' ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>🤖</span>
            <div style={styles.navTextWrapper}>
              <span style={styles.navTitle}>AI Asisten Virtual</span>
              <span style={styles.navDesc}>Avatar 3D & Percakapan</span>
            </div>
          </button>

          {/* Menu 3: Tentang & Panduan */}
          <button
            onClick={() => handleTabChange('about')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'about' ? styles.navItemActive : {})
            }}
          >
            <span style={styles.navIcon}>📖</span>
            <div style={styles.navTextWrapper}>
              <span style={styles.navTitle}>Tentang & Panduan</span>
              <span style={styles.navDesc}>Info Pembuat & Tata Cara</span>
            </div>
          </button>
        </nav>

        {/* Riwayat Chat Section */}
        <div style={styles.historySection}>
          <div style={styles.historyHeader}>
            <span style={styles.historyTitle}>Riwayat Chat</span>
            <button
              onClick={handleStartNewChat}
              style={styles.newChatMiniBtn}
              title="Buat Sesi Chat Baru"
            >
              + Baru
            </button>
          </div>
          <div style={styles.historyList}>
            {sessions.filter((s) => s.title !== 'Percakapan Baru').length === 0 ? (
              <div style={styles.historyEmpty}>Belum ada riwayat</div>
            ) : (
              sessions
                .filter((s) => s.title !== 'Percakapan Baru')
                .map((sess) => {
                  const isActive = activeTab === 'chat' && activeSessionId === sess.id
                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      style={{
                        ...styles.historyItem,
                        ...(isActive ? styles.historyItemActive : {})
                      }}
                      title={sess.title}
                    >
                      <span style={styles.historyItemIcon}>💭</span>
                      <span style={styles.historyItemText}>{sess.title}</span>
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        style={styles.historyDeleteBtn}
                        title="Hapus percakapan ini"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        {/* Sidebar Footer: Creator & Portfolio */}
        <div style={styles.sidebarFooter}>
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
              <span>🌐 radityarz.my.id</span>
              <span style={{ fontSize: '12px' }}>↗</span>
            </a>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div style={styles.contentArea}>
        {/* TAB 1: AI ASISTEN VIRTUAL (Main 3D Experience) */}
        <div style={{
          ...styles.tabView,
          display: activeTab === 'assistant' ? 'flex' : 'none'
        }}>
          {/* Top Header */}
          <header style={{
            ...styles.header,
            paddingTop: isMobile ? 'max(6px, env(safe-area-inset-top, 0px))' : '0',
            paddingLeft: isMobile ? '14px' : '28px',
            paddingRight: isMobile ? '14px' : '28px',
            height: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px',
            minHeight: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px'
          }}>
            <div style={styles.headerLeft}>
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  style={styles.hamburgerBtn}
                  title="Buka Menu"
                >
                  ☰
                </button>
              )}
              <h1 style={{
                ...styles.brandTitle,
                fontSize: isMobile ? '15px' : '17px'
              }}>
                Zeera AI Avatar
              </h1>
              {!isMobile && <span style={styles.headerBadge}>Interactive 3D</span>}
            </div>

            <div style={styles.headerRight}>
              <div style={{
                ...styles.statusPill,
                padding: isMobile ? '4px 10px' : '6px 14px'
              }}>
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
                <span style={{
                  ...styles.statusText,
                  fontSize: isMobile ? '11.5px' : '13px'
                }}>
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
            {/* Speech Bubble */}
            {lastResponse && (
              <div style={{
                ...styles.speechBubbleWrapper,
                top: isMobile ? '8px' : '14px',
                padding: isMobile ? '0 12px' : '0 20px'
              }}>
                <div style={{
                  ...styles.speechBubble,
                  maxWidth: isMobile ? '94%' : '520px',
                  padding: isMobile ? '8px 14px' : '10px 20px',
                  borderRadius: isMobile ? '12px' : '16px'
                }}>
                  <p style={{
                    ...styles.speechText,
                    fontSize: isMobile ? '13px' : '14px'
                  }}>
                    {lastResponse}
                  </p>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div style={styles.errorBanner}>
                ⚠️ {errorMessage}
              </div>
            )}

            {/* 3D Canvas */}
            <div style={styles.canvasContainer}>
              <AvatarCanvas
                modelUrl={MODEL_URL}
                emotion={emotion}
                gesture={gesture}
                animationState={animationState}
                onControllersReady={handleControllersReady}
              />
            </div>
          </main>

          {/* Bottom Control Bar */}
          <footer style={{
            ...styles.footerBar,
            paddingTop: isMobile ? '10px' : '14px',
            paddingLeft: isMobile ? '14px' : '24px',
            paddingRight: isMobile ? '14px' : '24px',
            paddingBottom: isMobile
              ? 'max(30px, calc(18px + env(safe-area-inset-bottom, 0px)))'
              : 'calc(18px + env(safe-area-inset-bottom, 0px))'
          }}>
            {/* Status Hint */}
            <div style={{
              ...styles.statusHint,
              fontSize: isMobile ? '11px' : '12px',
              marginBottom: isMobile ? '6px' : '8px'
            }}>
              {status === 'listening' && '🎙️ Mendengarkan... (Bicara sekarang)'}
              {status === 'processing' && '✨ Zeera sedang memproses...'}
              {status === 'speaking' && '🔊 Zeera sedang berbicara...'}
              {status === 'error' && '⚠️ Terjadi kendala, coba lagi'}
              {status === 'idle' && (isMobile ? 'Ketik atau klik mic untuk bicara' : 'Ketik pesan atau klik ikon mikrofon untuk berbicara')}
            </div>

            {/* Input Bar */}
            <div style={{
              ...styles.inputCard,
              padding: isMobile ? '4px 6px' : '6px 10px',
              borderRadius: isMobile ? '12px' : '14px'
            }}>
              <button
                onClick={toggleListening}
                style={{
                  ...styles.micButton,
                  width: isMobile ? '38px' : '40px',
                  height: isMobile ? '38px' : '40px',
                  backgroundColor: isListening ? '#ef4444' : '#1e293b',
                  boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'none'
                }}
                title={isListening ? 'Hentikan rekaman suara' : 'Mulai bicara dengan suara'}
              >
                {isListening ? '⏹️' : '🎙️'}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isMobile ? 'Tanya Zeera...' : 'Ketik pesan atau pertanyaan untuk Zeera di sini...'}
                style={{
                  ...styles.textInput,
                  fontSize: '14px',
                  padding: isMobile ? '6px 8px' : '8px 12px'
                }}
                disabled={status === 'processing'}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || status === 'processing'}
                style={{
                  ...styles.sendButton,
                  padding: isMobile ? '8px 14px' : '8px 20px',
                  fontSize: isMobile ? '13px' : '14px',
                  opacity: inputText.trim() && status !== 'processing' ? 1 : 0.45,
                  cursor: inputText.trim() && status !== 'processing' ? 'pointer' : 'not-allowed'
                }}
              >
                Kirim
              </button>
            </div>

            {/* Watermark Branding */}
            <div style={styles.watermarkContainer}>
              <a
                href="https://radityarz.my.id"
                target="_blank"
                rel="noreferrer"
                style={{
                  ...styles.watermarkLink,
                  fontSize: isMobile ? '10px' : '11.5px'
                }}
              >
                Developed with 💙 by <span style={{ color: 'rgba(147, 197, 253, 0.9)', fontWeight: 600 }}>Raditya Rai Zeeshan</span>
              </a>
            </div>
          </footer>
        </div>

        {/* TAB 2: AI TEXT CHAT (BARU) */}
        <div style={{
          ...styles.tabView,
          display: activeTab === 'chat' ? 'flex' : 'none'
        }}>
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

        {/* TAB 3: TENTANG & PANDUAN PROYEK */}
        <div style={{
          ...styles.tabView,
          display: activeTab === 'about' ? 'flex' : 'none'
        }}>
          {/* Header */}
          <header style={{
            ...styles.header,
            paddingTop: isMobile ? 'max(6px, env(safe-area-inset-top, 0px))' : '0',
            paddingLeft: isMobile ? '14px' : '28px',
            paddingRight: isMobile ? '14px' : '28px',
            height: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px',
            minHeight: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px'
          }}>
            <div style={styles.headerLeft}>
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  style={styles.hamburgerBtn}
                  title="Buka Menu"
                >
                  ☰
                </button>
              )}
              <h1 style={{
                ...styles.brandTitle,
                fontSize: isMobile ? '15px' : '17px'
              }}>
                {isMobile ? 'Tentang & Panduan' : 'Tentang & Panduan Penggunaan'}
              </h1>
            </div>
            <div style={styles.headerRight}>
              <a
                href="https://radityarz.my.id"
                target="_blank"
                rel="noreferrer"
                style={{
                  ...styles.headerPortoBtn,
                  fontSize: isMobile ? '12px' : '13px',
                  padding: isMobile ? '5px 10px' : '6px 14px'
                }}
              >
                {isMobile ? 'Porto ↗' : 'radityarz.my.id ↗'}
              </a>
            </div>
          </header>

          {/* Scrollable About & Guide Content */}
          <div style={{
            ...styles.aboutScrollArea,
            paddingTop: isMobile ? '16px' : '28px',
            paddingLeft: isMobile ? '14px' : '36px',
            paddingRight: isMobile ? '14px' : '36px',
            paddingBottom: isMobile ? 'max(40px, calc(20px + env(safe-area-inset-bottom, 0px)))' : '36px'
          }}>
            <div style={styles.aboutContainer}>
              {/* Creator Card */}
              <div style={{
                ...styles.aboutCard,
                padding: isMobile ? '18px 16px' : '24px 28px'
              }}>
                <div style={styles.aboutCardBadge}>PENGEMBANG UTAMA</div>
                <h2 style={{
                  ...styles.aboutCardTitle,
                  fontSize: isMobile ? '19px' : '22px'
                }}>Raditya Rai Zeeshan</h2>
                <p style={{
                  ...styles.aboutCardLead,
                  fontSize: isMobile ? '13.5px' : '15px'
                }}>
                  Proyek <strong>AI VTuber Zeera</strong> ini dirancang dan dikembangkan secara mandiri oleh{' '}
                  <strong style={{ color: '#60a5fa' }}>Raditya Rai Zeeshan</strong> sebagai platform asisten virtual
                  berbasis web yang menggabungkan model karakter 3D anime interaktif, kecerdasan buatan, dan sintesis suara natural.
                </p>
                <div style={styles.aboutPortoBox}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#94a3b8' }}>
                    Kunjungi portofolio resmi saya:
                  </p>
                  <a
                    href="https://radityarz.my.id"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...styles.bigPortoButton,
                      fontSize: isMobile ? '13px' : '14px',
                      padding: isMobile ? '9px 14px' : '10px 18px',
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: 'center'
                    }}
                  >
                    <span>🚀 radityarz.my.id</span>
                  </a>
                </div>
              </div>

              {/* Panduan Penggunaan */}
              <div style={{
                ...styles.aboutCard,
                padding: isMobile ? '18px 16px' : '24px 28px'
              }}>
                <div style={styles.aboutCardBadge}>TATA CARA PENGGUNAAN</div>
                <h3 style={{
                  ...styles.aboutCardTitle,
                  fontSize: isMobile ? '18px' : '22px'
                }}>Cara Berinteraksi dengan Zeera</h3>

                <div style={styles.guideGrid}>
                  {/* Step 1 */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={styles.guideIcon}>🤖</div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>1. Mode AI Asisten Virtual (Avatar 3D & Suara Natural)</h4>
                      <p style={styles.guideText}>
                        Rasakan pengalaman interaksi virtual yang hidup bersama avatar 3D anime interaktif berbasis model <strong>Pixiv VRM</strong>. Avatar dilengkapi dengan simulasi bernafas alami (<em>idle</em>), kedipan mata otomatis (<em>blink</em>), ekspresi wajah responsif (senang, terkejut, rileks), serta gestur dinamis.
                      </p>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <li><strong>Percakapan Suara Real-Time:</strong> Tekan tombol <strong>Mikrofon (🎙️)</strong> di bar kontrol bawah untuk berbicara langsung dalam bahasa Indonesia.</li>
                        <li><strong>Sintesis Suara & Lip-Sync:</strong> Zeera merespon dengan suara natural <em>Microsoft Edge Neural TTS (id-ID-GadisNeural)</em> yang dipadukan dengan sinkronisasi gerakan bibir (<em>Lip-Sync</em>) presisi via Web Audio API.</li>
                        <li><strong>Input Teks Cepat:</strong> Anda juga dapat mengetik pesan singkat di kotak input bawah dan menekan Enter.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 2 (FITUR TERBARU) */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px',
                    borderColor: 'rgba(59, 130, 246, 0.35)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)'
                  }}>
                    <div style={{ ...styles.guideIcon, backgroundColor: 'rgba(37, 99, 235, 0.25)' }}>💬</div>
                    <div style={styles.guideContent}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <h4 style={{ ...styles.guideHeading, margin: 0 }}>2. Mode AI Text Chat & Manajemen Sesi (Local-First)</h4>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#38bdf8',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>FITUR TERBARU</span>
                      </div>
                      <p style={styles.guideText}>
                        Ruang obrolan teks modern bertema <em>Dark Navy</em> ala ChatGPT yang ditenagai oleh <strong>Google Gemini AI (gemini-3.1-flash-lite)</strong>. Mode ini beroperasi dalam format teks murni tanpa suara (<em>silent mode</em>), ideal untuk kebutuhan belajar, coding, diskusi panjang, atau saat berada di ruang publik.
                      </p>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.65' }}>
                        <li><strong>Penyimpanan Persisten (IndexedDB):</strong> Riwayat percakapan Anda otomatis tersimpan di memori browser secara <em>local-first</em> menggunakan database Dexie. Riwayat tidak akan hilang meskipun Anda merefresh browser, serta menjamin privasi penuh tanpa perlu server database terpisah.</li>
                        <li><strong>Daftar Riwayat di Sidebar:</strong> Semua percakapan yang pernah Anda lakukan tercatat rapi di panel samping kiri dan dapat diakses kembali kapan saja.</li>
                        <li><strong>Fitur Auto-Title Otomatis:</strong> Saat Anda memulai obrolan baru, sistem secara cerdas menamai judul percakapan dari kalimat pembuka Anda.</li>
                        <li><strong>Navigasi Chat Baru Instan:</strong> Mengklik menu utama <strong>AI Text Chat</strong> di sidebar atau tombol <strong>+ Baru</strong> akan selalu membuka lembar obrolan baru (0 pesan), sehingga Anda bebas memulai topik baru tanpa menimpa sesi lama.</li>
                        <li><strong>Pintasan Keyboard Efisien:</strong> Tekan <strong>Enter</strong> untuk mengirim pesan, atau <strong>Shift + Enter</strong> untuk menyisipkan baris baru di textarea.</li>
                        <li><strong>Manajemen & Hapus Sesi:</strong> Hapus obrolan yang tidak diperlukan melalui tombol <strong>✕</strong> di daftar riwayat sidebar atau tombol <strong>🗑️ Hapus Chat</strong> di header.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={styles.guideIcon}>⚡</div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>3. Arsitektur Performa Tanpa Reload (CSS-Based Multi-Stage)</h4>
                      <p style={styles.guideText}>
                        Sistem navigasi dirancang dengan arsitektur performa tinggi. Berpindah antara mode <strong>AI Asisten Virtual</strong>, <strong>AI Text Chat</strong>, dan <strong>Panduan</strong> berjalan seketika tanpa perlu me-reload model karakter 3D atau merusak WebGL Context Three.js. Suara TTS juga otomatis dihentikan saat Anda berpindah ke mode teks demi menjaga ketenangan Anda.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={styles.guideIcon}>📱</div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>4. Tampilan Responsif Layar Smartphone</h4>
                      <p style={styles.guideText}>
                        Antarmuka Zeera AI sepenuhnya adaptif untuk perangkat ponsel cerdas dan tablet. Pada layar mobile, sidebar navigasi berubah menjadi menu geser (<em>drawer overlay</em>) yang dapat dibuka melalui tombol hamburger (<strong>☰</strong>) di pojok kiri atas, dan kamera panggung 3D secara otomatis menyesuaikan rasio vertikal layar.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={styles.guideIcon}>💡</div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>5. Tips Berinteraksi dengan Zeera AI</h4>
                      <p style={styles.guideText}>
                        Zeera diprogram dengan kepribadian yang ceria, ramah, santai, dan solutif layaknya teman akrab. Anda dapat menyapa santai, meminta saran kreatif, membahas pemrograman, berdiskusi topik sains, atau meminta Zeera menceritakan lelucon menghibur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech Stack Card */}
              <div style={{
                ...styles.aboutCard,
                padding: isMobile ? '18px 16px' : '24px 28px'
              }}>
                <div style={styles.aboutCardBadge}>ARSITEKTUR & TEKNOLOGI</div>
                <h3 style={{
                  ...styles.aboutCardTitle,
                  fontSize: isMobile ? '18px' : '22px'
                }}>Teknologi yang Digunakan</h3>
                <div style={styles.techBadgeContainer}>
                  <span style={styles.techBadge}>React 18</span>
                  <span style={styles.techBadge}>Vite 5</span>
                  <span style={styles.techBadge}>TypeScript</span>
                  <span style={styles.techBadge}>Three.js (WebGL)</span>
                  <span style={styles.techBadge}>Pixiv Three-VRM</span>
                  <span style={styles.techBadge}>Google Gemini AI (gemini-3.1-flash-lite)</span>
                  <span style={styles.techBadge}>IndexedDB & Dexie.js</span>
                  <span style={styles.techBadge}>dexie-react-hooks (Live Queries)</span>
                  <span style={styles.techBadge}>Local-First Architecture</span>
                  <span style={styles.techBadge}>Auto-Title Session Engine</span>
                  <span style={styles.techBadge}>ChatGPT-Style Chat UI</span>
                  <span style={styles.techBadge}>Multi-Turn Conversation Memory</span>
                  <span style={styles.techBadge}>Microsoft Edge Neural TTS (GadisNeural)</span>
                  <span style={styles.techBadge}>Web Audio API (Realtime Lip-Sync)</span>
                  <span style={styles.techBadge}>Web Speech Recognition (Browser STT)</span>
                </div>
              </div>

              {/* Watermark in About Tab */}
              <div style={{ ...styles.watermarkContainer, marginTop: '8px', paddingBottom: '16px' }}>
                <a
                  href="https://radityarz.my.id"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...styles.watermarkLink,
                    fontSize: isMobile ? '11px' : '12px'
                  }}
                >
                  Developed with 💙 by <span style={{ color: 'rgba(147, 197, 253, 0.9)', fontWeight: 600 }}>Raditya Rai Zeeshan</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Styling Pure Dark Navy / Responsive Look
const styles: { [key: string]: React.CSSProperties } = {
  appRoot: {
    display: 'flex',
    flexDirection: 'row',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#070b15',
    color: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'hidden',
    userSelect: 'none',
    touchAction: 'none'
  },

  // MOBILE BACKDROP
  mobileBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 45
  },

  // SIDEBAR STYLES
  sidebar: {
    width: '260px',
    minWidth: '260px',
    height: '100%',
    backgroundColor: '#0a1024',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 30
  },
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
  },
  sidebarLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    objectFit: 'contain',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
  },
  sidebarBrandTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: '#ffffff'
  },
  sidebarBrandSubtitle: {
    fontSize: '11px',
    color: '#818cf8',
    fontWeight: 500
  },
  sidebarCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    color: '#94a3b8',
    fontSize: '16px',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  navMenu: {
    padding: '16px 14px 8px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 14px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: '12px',
    color: '#94a3b8',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  navItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    color: '#ffffff',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2)'
  },
  navIcon: {
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  navTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f1f5f9'
  },
  navDesc: {
    fontSize: '11px',
    color: '#64748b'
  },

  // RIWAYAT CHAT SIDEBAR STYLES
  historySection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '8px 14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 2px 8px 2px'
  },
  historyTitle: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  newChatMiniBtn: {
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    color: '#60a5fa',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  historyList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingRight: '2px'
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  },
  historyItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    color: '#ffffff'
  },
  historyItemIcon: {
    fontSize: '13px',
    flexShrink: 0
  },
  historyItemText: {
    flex: 1,
    fontSize: '12.5px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  historyDeleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    opacity: 0.6,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  historyEmpty: {
    fontSize: '11.5px',
    color: '#475569',
    textAlign: 'center',
    padding: '16px 0',
    fontStyle: 'italic'
  },

  sidebarFooter: {
    padding: '16px 14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
  },
  creatorCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px 14px'
  },
  creatorHeader: {
    marginBottom: '4px'
  },
  creatorTag: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.6px'
  },
  creatorName: {
    margin: '4px 0 2px 0',
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff'
  },
  creatorRole: {
    margin: '0 0 10px 0',
    fontSize: '11px',
    color: '#94a3b8'
  },
  portfolioButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    padding: '7px 10px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'background-color 0.2s ease'
  },

  // CONTENT AREA STYLES
  contentArea: {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#070b15',
    backgroundImage: 'radial-gradient(ellipse at top, #0f1c3f 0%, #070b15 70%)'
  },
  tabView: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    position: 'relative'
  },

  // HEADER STYLES
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 16, 32, 0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 20
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0
  },
  hamburgerBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '18px',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  },
  brandTitle: {
    margin: 0,
    fontWeight: 700,
    letterSpacing: '0.3px',
    color: '#ffffff'
  },
  headerBadge: {
    fontSize: '11px',
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    color: '#60a5fa',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(19, 29, 56, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px'
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease'
  },
  statusText: {
    fontWeight: 500,
    color: '#cbd5e1'
  },
  headerPortoBtn: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    border: '1px solid rgba(37, 99, 235, 0.4)',
    color: '#60a5fa',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'all 0.2s ease'
  },

  // 3D MAIN STAGE
  mainArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  speechBubbleWrapper: {
    position: 'absolute',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none'
  },
  speechBubble: {
    backgroundColor: 'rgba(11, 20, 42, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
    pointerEvents: 'auto'
  },
  speechText: {
    margin: 0,
    lineHeight: '1.5',
    color: '#e2e8f0',
    textAlign: 'center'
  },
  errorBanner: {
    position: 'absolute',
    top: '70px',
    zIndex: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#fca5a5',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '12px'
  },

  // FOOTER CONTROL BAR
  footerBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 14, 28, 0.94)',
    backdropFilter: 'blur(18px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 20
  },
  statusHint: {
    color: '#64748b',
    fontWeight: 500,
    textAlign: 'center'
  },
  inputCard: {
    width: '100%',
    maxWidth: '780px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#10182b',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    minWidth: 0
  },
  micButton: {
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s ease'
  },
  sendButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 600,
    flexShrink: 0,
    transition: 'all 0.2s ease'
  },

  // ABOUT & GUIDE TAB STYLES
  aboutScrollArea: {
    flex: 1,
    overflowY: 'auto'
  },
  aboutContainer: {
    maxWidth: '860px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  aboutCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
  },
  aboutCardBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    color: '#60a5fa',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: '3px 8px',
    borderRadius: '6px',
    marginBottom: '8px'
  },
  aboutCardTitle: {
    margin: '0 0 10px 0',
    fontWeight: 700,
    color: '#ffffff'
  },
  aboutCardLead: {
    lineHeight: '1.6',
    color: '#cbd5e1',
    margin: '0 0 16px 0'
  },
  aboutPortoBox: {
    backgroundColor: 'rgba(10, 16, 32, 0.85)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '14px 18px'
  },
  bigPortoButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  guideGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '14px'
  },
  guideItem: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(10, 16, 32, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '14px 16px'
  },
  guideIcon: {
    fontSize: '22px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  guideContent: {
    flex: 1
  },
  guideHeading: {
    margin: '0 0 4px 0',
    fontSize: '14.5px',
    fontWeight: 600,
    color: '#f8fafc'
  },
  guideText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.55',
    color: '#94a3b8'
  },
  techBadgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px'
  },
  techBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: '6px'
  },
  watermarkContainer: {
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto'
  },
  watermarkLink: {
    color: 'rgba(148, 163, 184, 0.45)',
    textDecoration: 'none',
    letterSpacing: '0.3px',
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  }
}
