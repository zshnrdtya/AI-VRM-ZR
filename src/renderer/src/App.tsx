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
import LOGO_URL from './assets/logo-zeera.jpeg'
import LOGO_BANNER_URL from './assets/logo-zeera16-9.jpg'
import {
  MessageSquare,
  Bot,
  BookOpen,
  Plus,
  Trash2,
  Menu,
  X,
  ExternalLink,
  Globe,
  Mic,
  Square,
  Sparkles,
  Volume2,
  AlertTriangle,
  Heart,
  Zap,
  Smartphone,
  Lightbulb,
  Rocket,
  Send,
  Sun,
  Moon
} from 'lucide-react'

type NavTab = 'assistant' | 'chat' | 'about'
const STORAGE_KEY = 'zeera_active_session_id'

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assistant')
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })
  const checkIsMobile = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024 || (Boolean(window.matchMedia) && window.matchMedia('(max-width: 1023px)').matches)
  }

  const [isMobile, setIsMobile] = useState(checkIsMobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // Mulai efek pudar setelah 2 detik
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, 2000)

    // Hilangkan komponen dari DOM setelah transisi pudar selesai (2.5 detik)
    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  // Sistem Tema Dinamis (Dark Mode & Light Mode) dengan persistensi LocalStorage
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
    } catch (e) {
      console.warn('[Zeera Theme] Error saving theme:', e)
    }
  }, [theme])

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
  const [currentUserMsg, setCurrentUserMsg] = useState<{ text: string; timestamp: string } | null>(null)
  const [currentAiMsg, setCurrentAiMsg] = useState<{ text: string; timestamp: string } | null>({
    text: 'Halo! Aku Zeera, asisten virtual 3D-mu. Ada yang bisa kubantu hari ini?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
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

  // Responsive mobile/tablet detector with immediate sync and media query listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = checkIsMobile()
      setIsMobile(mobile)
      if (!mobile) {
        setIsSidebarOpen(false)
      }
    }

    // Run immediately on mount to sync after viewport meta evaluation
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

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setCurrentUserMsg({ text: message, timestamp: nowTime })

    setInputText('')
    setErrorMessage(null)
    setStatus('processing')

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      const fallback = 'Kunci VITE_GEMINI_API_KEY belum diset di file .env. Mohon periksa kembali konfigurasi Anda.'
      setCurrentAiMsg({ text: fallback, timestamp: nowTime })
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
HANYA keluarkan raw JSON tanpa kutipan backtick (\`\`\`json).

[IDENTITAS DEVELOPER & PENCIPTA]:
Kamu (Zeera) diciptakan dan dikembangkan oleh "Raditya Rai Zeeshan". 
- Raditya adalah seorang Full-stack Developer dan murid di SMKN 1 Depok, jurusan Pengembangan Perangkat Lunak dan Gim.
- Dia juga merupakan founder dari Z - Project.
- Jika pengguna bertanya "Siapa developer kamu?", "Siapa yang membuatmu?", atau "Kamu buatan siapa?", kamu harus menjawab dengan bangga bahwa kamu diciptakan oleh Raditya Rai Zeeshan.
- Jika pengguna bertanya "Apakah kamu kenal Raditya Rai Zeeshan?", "Siapa itu Raditya?", atau sejenisnya, kamu harus menjawab dengan antusias: "Tentu saja aku kenal! Raditya Rai Zeeshan adalah developer hebat yang menciptakan aku. Dia seorang Full-stack Developer dari SMKN 1 Depok!"`
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

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setCurrentAiMsg({ text: parsed.text, timestamp: replyTime })
      if (parsed.emotion) setEmotion(parsed.emotion)
      if (parsed.gesture) setGesture(parsed.gesture)

      speakResponse(parsed.text)
    } catch (err: any) {
      console.error('Gemini API error:', err)
      const errText = 'Maaf, sepertinya sedang ada kendala koneksi ke server AI.'
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setCurrentAiMsg({ text: errText, timestamp: replyTime })
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
      {/* Splash Screen Welcome Overlay */}
      {showSplash && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--bg-main, #0b1120)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            opacity: isFadingOut ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: isFadingOut ? 'none' : 'auto'
          }}
        >
          <div style={{ animation: 'pulse 1.5s infinite', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={LOGO_URL}
              alt="Zeera Logo"
              style={{
                width: isMobile ? '64px' : '76px',
                height: isMobile ? '64px' : '76px',
                borderRadius: '20px',
                marginBottom: '18px',
                objectFit: 'cover',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
                border: '1px solid var(--border-color)'
              }}
            />
            <h1
              style={{
                fontSize: isMobile ? '36px' : '48px',
                fontWeight: 'bold',
                color: '#3b82f6',
                margin: 0,
                letterSpacing: '2px',
                textAlign: 'center'
              }}
            >
              ZEERA AI
            </h1>
          </div>
          <p
            style={{
              color: 'var(--text-secondary, #94a3b8)',
              marginTop: '15px',
              fontSize: isMobile ? '13px' : '14px',
              letterSpacing: '1px',
              textAlign: 'center'
            }}
          >
            Developed by Raditya Rai Zeeshan
          </p>
          <p
            style={{
              color: 'var(--text-secondary, #94a3b8)',
              marginTop: '5px',
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: '300',
              textAlign: 'center'
            }}
          >
            A Z - Project
          </p>
        </div>
      )}

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
        <div style={{
          ...styles.sidebarHeader,
          padding: isMobile ? '16px 14px' : '20px',
          gap: isMobile ? '8px' : '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px', minWidth: 0, flex: 1 }}>
            <img src={LOGO_URL} alt="Zeera Logo" style={{
              ...styles.sidebarLogo,
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: isMobile ? '8px' : '10px'
            }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h2 style={{
                ...styles.sidebarBrandTitle,
                fontSize: isMobile ? '15.5px' : '17px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>Zeera AI</h2>
              <span style={{
                ...styles.sidebarBrandSubtitle,
                fontSize: isMobile ? '10.5px' : '11px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                display: 'block'
              }}>Virtual 3D Assistant</span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '8px',
            flexShrink: 0,
            marginLeft: '6px'
          }}>
            <button
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
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
                onClick={() => setIsSidebarOpen(false)}
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
            onClick={handleStartNewChat}
            style={{
              ...styles.navItem,
              ...(activeTab === 'chat' ? styles.navItemActive : {})
            }}
          >
            <span style={{ ...styles.navIcon, color: activeTab === 'chat' ? 'var(--accent-blue-text)' : 'var(--text-secondary)' }}>
              <MessageSquare size={19} />
            </span>
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
            <span style={{ ...styles.navIcon, color: activeTab === 'assistant' ? 'var(--accent-blue-text)' : 'var(--text-secondary)' }}>
              <Bot size={19} />
            </span>
            <div style={styles.navTextWrapper}>
              <span style={styles.navTitle}>AI Asisten Virtual</span>
              <span style={styles.navDesc}>Avatar 3D & Percakapan</span>
            </div>
          </button>

          {/* Menu 3: Filosofi & Panduan */}
          <button
            onClick={() => handleTabChange('about')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'about' ? styles.navItemActive : {})
            }}
          >
            <span style={{ ...styles.navIcon, color: activeTab === 'about' ? 'var(--accent-blue-text)' : 'var(--text-secondary)' }}>
              <BookOpen size={19} />
            </span>
            <div style={styles.navTextWrapper}>
              <span style={styles.navTitle}>Filosofi & Panduan</span>
              <span style={styles.navDesc}>Makna Brand & Tata Cara</span>
            </div>
          </button>
        </nav>

        {/* Riwayat Chat Section */}
        <div style={styles.historySection}>
          <div style={styles.historyHeader}>
            <span style={styles.historyTitle}>Riwayat Chat</span>
            <button
              onClick={handleStartNewChat}
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
                      <span style={{ ...styles.historyItemIcon, color: isActive ? 'var(--accent-blue-text)' : 'var(--text-secondary)', display: 'flex' }}>
                        <MessageSquare size={13} />
                      </span>
                      <span style={styles.historyItemText}>{sess.title}</span>
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        style={styles.historyDeleteBtn}
                        title="Hapus percakapan ini"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        {/* Sidebar Footer: Theme Toggle & Creator Portfolio */}
        <div style={{
          ...styles.sidebarFooter,
          padding: isMobile ? '14px 14px 18px 14px' : '16px 14px'
        }}>
          <button
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
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
              <span style={{
                ...styles.themeToggleText,
                fontSize: isMobile ? '13px' : '12.5px'
              }}>
                {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              </span>
            </span>
            <span style={styles.themeBadge}>
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
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
                  aria-label="Buka Menu"
                >
                  <Menu size={20} />
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
            {/* 3D Canvas */}
            <div style={styles.canvasContainer}>
              <AvatarCanvas
                modelUrl={MODEL_URL}
                emotion={emotion}
                gesture={gesture}
                animationState={animationState}
                onControllersReady={handleControllersReady}
                theme={theme}
              />
            </div>

            {/* Floating Chat Bubbles Overlay (Left: User, Right: Zeera AI) */}
            <div
              style={{
                ...styles.overlayChatContainer,
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: isMobile ? 'space-between' : 'space-between',
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
                    <p style={{ ...styles.bubbleText, color: 'var(--text-primary)' }}>{currentAiMsg.text}</p>
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
              marginBottom: isMobile ? '6px' : '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              {status === 'listening' && (
                <>
                  <Mic size={14} color="#ef4444" />
                  <span>Mendengarkan... (Bicara sekarang)</span>
                </>
              )}
              {status === 'processing' && (
                <>
                  <Sparkles size={14} color="#f59e0b" />
                  <span>Zeera sedang memproses...</span>
                </>
              )}
              {status === 'speaking' && (
                <>
                  <Volume2 size={14} color="#10b981" />
                  <span>Zeera sedang berbicara...</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertTriangle size={14} color="#ef4444" />
                  <span>Terjadi kendala, coba lagi</span>
                </>
              )}
              {status === 'idle' && (
                <span>{isMobile ? 'Ketik atau klik mic untuk bicara' : 'Ketik pesan atau klik ikon mikrofon untuk berbicara'}</span>
              )}
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
                  backgroundColor: isListening ? '#ef4444' : 'var(--bg-badge)',
                  boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'var(--card-shadow)'
                }}
                title={isListening ? 'Hentikan rekaman suara' : 'Mulai bicara dengan suara'}
              >
                {isListening ? <Square size={16} fill="white" /> : <Mic size={18} color="var(--text-primary)" />}
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
                  padding: isMobile ? '8px 14px' : '8px 18px',
                  fontSize: isMobile ? '13px' : '14px',
                  opacity: inputText.trim() && status !== 'processing' ? 1 : 0.45,
                  cursor: inputText.trim() && status !== 'processing' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Kirim</span>
                <Send size={13} />
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
                  fontSize: isMobile ? '10px' : '11.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>Developed with</span>
                <Heart size={12} color="#3b82f6" fill="#3b82f6" />
                <span>by</span>
                <span style={{ color: 'rgba(147, 197, 253, 0.9)', fontWeight: 600 }}>Raditya Rai Zeeshan</span>
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
                  aria-label="Buka Menu"
                >
                  <Menu size={20} />
                </button>
              )}
              <h1 style={{
                ...styles.brandTitle,
                fontSize: isMobile ? '15px' : '17px'
              }}>
                {isMobile ? 'Filosofi & Panduan' : 'Filosofi Logo & Panduan Zeera'}
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
                  padding: isMobile ? '5px 10px' : '6px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>{isMobile ? 'Porto' : 'radityarz.my.id'}</span>
                <ExternalLink size={12} />
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
              {/* Card 1: Identitas Brand & Filosofi Logo Zeera */}
              <div
                style={{
                  ...styles.aboutCard,
                  padding: isMobile ? '18px 16px' : '26px 30px',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={styles.aboutCardBadge}>IDENTITAS BRAND & FILOSOFI LOGO</div>
                <h2
                  style={{
                    ...styles.aboutCardTitle,
                    fontSize: isMobile ? '19px' : '23px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span>Makna & Filosofi Logo Zeera</span>
                </h2>
                <p
                  style={{
                    ...styles.aboutCardLead,
                    fontSize: isMobile ? '13px' : '14.5px',
                    marginBottom: '18px'
                  }}
                >
                  Logo <strong>Zeera</strong> dirancang sebagai representasi visual dari kecerdasan buatan masa depan yang adaptif, berkesinambungan, dan penuh inovasi. Setiap lekukan garis, titik simpul, dan gradasi warna memiliki filosofi mendalam:
                </p>

                {/* Visual Showcase 2-Kolom Seimbang */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: isMobile ? '14px' : '18px',
                    marginBottom: '22px'
                  }}
                >
                  {/* Kolom 1: Banner Widescreen 16:9 */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: 'var(--card-shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        backgroundColor: '#070a14',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={LOGO_BANNER_URL}
                        alt="Logo Zeera Versi 16:9"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        Landscape 16:9
                      </span>
                    </div>
                    <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', flex: 1 }}>
                      <h5
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}
                      >
                        Logo Zeera (Widescreen 16:9)
                      </h5>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4'
                        }}
                      >
                        Format lanskap beresolusi tinggi untuk showcase visual utama, presentasi, dan banner brand.
                      </p>
                    </div>
                  </div>

                  {/* Kolom 2: Logo Square Icon 1:1 */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: 'var(--card-shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        backgroundColor: '#070a14',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px'
                      }}
                    >
                      <img
                        src={LOGO_URL}
                        alt="Logo Zeera Versi 1:1"
                        style={{
                          height: '100%',
                          width: 'auto',
                          aspectRatio: '1/1',
                          objectFit: 'contain',
                          borderRadius: '12px',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                          display: 'block'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        Square 1:1
                      </span>
                    </div>
                    <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', flex: 1 }}>
                      <h5
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}
                      >
                        Logo Zeera (Square Icon 1:1)
                      </h5>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4'
                        }}
                      >
                        Format bujur sangkar presisi untuk identitas favicon web, ikon aplikasi, dan logo avatar sidebar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 Pilar Filosofi Logo */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    marginBottom: '20px'
                  }}
                >
                  {/* 1. Bentuk Dasar (Form & Shape) */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: isMobile ? '14px 14px' : '16px 20px',
                      boxShadow: 'var(--card-shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--accent-blue-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-blue-text)',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        1
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: isMobile ? '15px' : '16px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        Bentuk Dasar (Form & Shape)
                      </h4>
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: isMobile ? '12.5px' : '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6'
                      }}
                    >
                      <li>
                        <strong style={{ color: 'var(--text-primary)' }}>Inisial Huruf &quot;Z&quot; atau Angka &quot;2&quot;:</strong>{' '}
                        Siluet utama logo ini membentuk huruf &quot;Z&quot; (mewakili nama &quot;Zeera&quot;) atau angka &quot;2&quot;. Garisnya dibuat melengkung dan mengalir, melambangkan fleksibilitas, adaptabilitas, dan pergerakan yang dinamis dalam mengikuti perkembangan zaman.
                      </li>
                      <li>
                        <strong style={{ color: 'var(--text-primary)' }}>Simbol Infinity (Tak Terhingga):</strong>{' '}
                        Alur pita yang menyambung dan saling tumpang tindih tanpa ujung membentuk pola menyerupai simbol infinity (∞). Ini bermakna kesinambungan (<em>sustainability</em>), pertumbuhan yang tidak pernah berhenti (<em>continuous improvement</em>), dan potensi kemajuan yang tanpa batas.
                      </li>
                      <li>
                        <strong style={{ color: 'var(--text-primary)' }}>Struktur Pita 3D yang Saling Mengunci:</strong>{' '}
                        Menunjukkan adanya sinergi, kolaborasi, dan ikatan yang kuat. Menandakan bahwa elemen-elemen di dalam sistem/brand saling mendukung untuk menciptakan kesatuan yang kokoh.
                      </li>
                    </ul>
                  </div>

                  {/* 2. Elemen Geometris & Cahaya (Kanan Atas) */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: isMobile ? '14px 14px' : '16px 20px',
                      boxShadow: 'var(--card-shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(168, 85, 247, 0.18)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#c084fc',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        2
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: isMobile ? '15px' : '16px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        Elemen Geometris & Cahaya (Kanan Atas)
                      </h4>
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: isMobile ? '12.5px' : '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6'
                      }}
                    >
                      <li>
                        <strong style={{ color: 'var(--text-primary)' }}>Simpul Jaringan (Network Node) / Rasi Bintang:</strong>{' '}
                        Pada ujung atas terdapat elemen garis-garis yang terhubung menyerupai jaring (koneksi) atau rasi bintang. Ini merepresentasikan teknologi, digitalisasi, konektivitas global, dan kemampuan membangun jaringan yang luas.
                      </li>
                      <li>
                        <strong style={{ color: 'var(--text-primary)' }}>Titik Cahaya (Glowing Dot):</strong>{' '}
                        Titik ungu yang menyala di ujung melambangkan &quot;titik terang&quot;, puncak pencapaian, inovasi, atau percikan ide (<em>spark of idea</em>). Ini menunjukkan bahwa brand ini adalah <em>trendsetter</em> atau penunjuk arah menuju masa depan yang cerah.
                      </li>
                    </ul>
                  </div>

                  {/* 3. Filosofi Warna */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: isMobile ? '14px 14px' : '16px 20px',
                      boxShadow: 'var(--card-shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(236, 72, 153, 0.18)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f472b6',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        3
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: isMobile ? '15px' : '16px',
                          fontWeight: 700,
                          color: 'var(--text-primary)'
                        }}
                      >
                        Filosofi Warna
                      </h4>
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: isMobile ? '12.5px' : '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6'
                      }}
                    >
                      <li>
                        <strong style={{ color: 'var(--text-primary)' }}>Ungu (Purple Gradient):</strong>{' '}
                        Warna dominan ungu melambangkan kreativitas, imajinasi, visi masa depan, dan inovasi. Dalam konteks modern, gradasi ungu sering dikaitkan dengan teknologi tingkat lanjut (seperti AI, cyber, atau metaverse), kecerdasan, dan kualitas yang premium/eksklusif.
                      </li>
                      <li>
                        <strong style={{ color: 'var(--text-primary)' }}>Hitam/Abu-abu Gelap (Pada Dimensi/Bayangan):</strong>{' '}
                        Memberikan efek kedalaman (<em>depth</em>). Warna gelap ini menyimbolkan fondasi yang kuat, profesionalisme, ketegasan, stabilitas, dan keandalan di balik inovasi yang mereka ciptakan.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Kesimpulan Keseluruhan Callout Box */}
                <div
                  style={{
                    backgroundColor: 'var(--accent-blue-subtle)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: '12px',
                    padding: isMobile ? '14px 16px' : '16px 20px',
                    boxShadow: 'var(--card-shadow)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Sparkles size={16} color="var(--accent-blue-text)" />
                    <h5
                      style={{
                        margin: 0,
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: 'var(--accent-blue-text)',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Kesimpulan Keseluruhan
                    </h5>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: isMobile ? '12.5px' : '13.5px',
                      color: 'var(--text-lead)',
                      lineHeight: '1.6'
                    }}
                  >
                    Logo <strong>&quot;Zeera&quot;</strong> ini merepresentasikan sebuah brand atau entitas yang inovatif, visioner, dan berbasis pada teknologi/konektivitas. Brand ini memiliki fondasi yang kuat namun tetap fleksibel, selalu bergerak maju untuk menciptakan pertumbuhan tanpa batas, dan bertujuan untuk menjadi pionir atau cahaya penuntun di industrinya.
                  </p>
                </div>
              </div>

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
                  <strong style={{ color: 'var(--accent-blue-text)' }}>Raditya Rai Zeeshan</strong> sebagai platform asisten virtual
                  berbasis web yang menggabungkan model karakter 3D anime interaktif, kecerdasan buatan, dan sintesis suara natural.
                </p>
                <div style={styles.aboutPortoBox}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
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
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Rocket size={16} />
                    <span>radityarz.my.id</span>
                    <ExternalLink size={13} />
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
                    <div style={styles.guideIcon}>
                      <Bot size={22} color="#60a5fa" />
                    </div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>1. Mode AI Asisten Virtual (Avatar 3D, Suara Natural & Real-Time Loader)</h4>
                      <p style={styles.guideText}>
                        Rasakan pengalaman interaksi virtual yang hidup bersama avatar 3D anime interaktif berbasis model <strong>Pixiv VRM</strong>. Avatar dilengkapi dengan simulasi bernafas alami (<em>idle</em>), kedipan mata otomatis (<em>blink</em>), ekspresi wajah responsif (senang, terkejut, santai), serta gestur dinamis.
                      </p>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-lead)', lineHeight: '1.6' }}>
                        <li><strong>Percakapan Suara Real-Time:</strong> Tekan tombol <strong>Mikrofon</strong> di bar kontrol bawah untuk berbicara langsung dalam Bahasa Indonesia.</li>
                        <li><strong>Sintesis Suara & Lip-Sync:</strong> Zeera merespon dengan suara natural <em>Microsoft Edge Neural TTS (id-ID-GadisNeural)</em> yang dipadukan dengan sinkronisasi gerakan bibir (<em>Lip-Sync</em>) presisi via Web Audio API.</li>
                        <li><strong>Input Teks Cepat:</strong> Anda juga dapat mengetik pesan singkat di kotak input bawah dan menekan Enter.</li>
                        <li><strong>UX Loading Cerdas & Real-Time Progress:</strong> Saat memuat model 3D, sistem menampilkan teks ramah <em>&quot;Sebentar ya, Zeeranya siap-siap dulu...&quot;</em> disertai persentase progres unduhan dan animasi progress bar yang halus secara real-time.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 2 (FITUR TERBARU & MULTI-MODEL) */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px',
                    borderColor: 'rgba(59, 130, 246, 0.4)',
                    backgroundColor: 'var(--bg-card)',
                    boxShadow: 'var(--card-shadow)'
                  }}>
                    <div style={{ ...styles.guideIcon, backgroundColor: 'var(--accent-blue-subtle)' }}>
                      <MessageSquare size={22} color="var(--accent-blue-text)" />
                    </div>
                    <div style={styles.guideContent}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h4 style={{ ...styles.guideHeading, margin: 0 }}>2. Mode AI Text Chat, Multi-Model & Rich Markdown</h4>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--accent-blue-text)',
                          backgroundColor: 'var(--accent-blue-subtle)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>UPDATED</span>
                      </div>
                      <p style={styles.guideText}>
                        Ruang obrolan teks modern bertema ala ChatGPT yang ditenagai oleh mesin AI generasi terbaru. Beroperasi secara <em>silent mode</em> (tanpa suara), ideal untuk coding, riset, diskusi mendalam, maupun konsultasi sehari-hari.
                      </p>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-lead)', lineHeight: '1.65' }}>
                        <li><strong>Model Selector AI (Custom Dropdown):</strong> Pengguna dapat memilih versi model AI secara bebas melalui tombol dropdown pil di samping tombol Kirim:
                          <div style={{ margin: '6px 0 6px 0', padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', lineHeight: '1.6' }}>
                            • <strong>Zeera AI 1.1</strong> (<em>gemini-3.1-flash-lite</em>): Respon cepat & latensi sangat minim.<br />
                            • <strong>Zeera AI 1.2</strong> (<em>gemini-3.6-flash</em>): Kemampuan penalaran paling cerdas & komprehensif.<br />
                            • <strong>Zeera AI 1.3</strong> (<em>gemini-3.5-flash-lite</em>): Keseimbangan akurasi logika dan efisiensi.<br />
                            • <strong>Zeera AI 1.4</strong> (<em>gemini-flash-lite-latest</em>): Rilis stabil mutakhir varian flash-lite.
                          </div>
                          Pilihan model otomatis tersimpan di <code>localStorage</code> sehingga selalu aktif saat kembali.
                        </li>
                        <li><strong>Pemisah Tanggal Otomatis (Date Divider):</strong> Pesan otomatis dipisahkan berdasarkan hari pengiriman kalender dengan label pintar (<em>&quot;Hari Ini&quot;</em>, <em>&quot;Kemarin&quot;</em>, atau format tanggal lengkap Indonesia).</li>
                        <li><strong>Rendering Markdown & Tabel GFM (remark-gfm):</strong> Balasan Zeera mendukung format Markdown lengkap termasuk <strong>tabel data interaktif</strong>, blok sintaks kode dengan penyorotan rapi, daftar ceklis, dan tipografi teks berstruktur.</li>
                        <li><strong>Salin Pesan Sekali Klik:</strong> Setiap pesan dari Zeera dilengkapi tombol salin (<em>Copy to Clipboard</em>) dengan indikator centang visual saat berhasil disalin.</li>
                        <li><strong>Penyimpanan Persisten (Local-First Dexie/IndexedDB):</strong> Seluruh riwayat obrolan tersimpan aman di peramban lokal Anda tanpa server pihak ketiga. Percakapan tidak hilang saat refresh browser.</li>
                        <li><strong>Auto-Title Cerdas & Manajemen Sesi:</strong> Percakapan otomatis diberi judul dari kalimat pembuka pertama Anda. Buat obrolan baru via menu sidebar / tombol <strong>Baru</strong>, atau hapus sesi yang sudah tidak digunakan.</li>
                        <li><strong>Pintasan Keyboard:</strong> Tekan <strong>Enter</strong> untuk mengirim pesan, atau <strong>Shift + Enter</strong> untuk menyisipkan baris baru di kotak teks.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 3 (FITUR TEMA DUAL) */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={{ ...styles.guideIcon, backgroundColor: 'rgba(251, 191, 36, 0.18)' }}>
                      <Sun size={22} color="#f59e0b" />
                    </div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>3. Sistem Tema Dinamis (Mode Gelap & Mode Terang)</h4>
                      <p style={styles.guideText}>
                        Zeera AI dilengkapi sistem tema ganda yang dapat dialihkan kapan saja melalui tombol matahari/bulan di bagian atas sidebar:
                      </p>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-lead)', lineHeight: '1.6' }}>
                        <li><strong>Peralihan Mulus Berbasis CSS Variables:</strong> Menyesuaikan warna latar belakang, card glassmorphic, teks, border, dan bayangan secara serentak tanpa reload halaman.</li>
                        <li><strong>Rendering Kanvas 3D Adaptif:</strong> Background kanvas avatar 3D menyesuaikan palet warna tema secara otomatis tanpa merusak shader material Three.js VRM.</li>
                        <li><strong>Persistensi Tema:</strong> Pilihan mode gelap atau terang Anda tersimpan permanen di memori lokal (<code>localStorage</code>).</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={styles.guideIcon}>
                      <Zap size={22} color="#fbbf24" />
                    </div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>4. Arsitektur Performa Tanpa Reload (CSS-Based Multi-Stage)</h4>
                      <p style={styles.guideText}>
                        Sistem navigasi dirancang dengan arsitektur performa tinggi. Berpindah antara mode <strong>AI Asisten Virtual</strong>, <strong>AI Text Chat</strong>, dan <strong>Filosofi & Panduan</strong> berjalan seketika tanpa perlu me-reload model karakter 3D atau merusak WebGL Context Three.js. Suara TTS juga otomatis dihentikan saat Anda berpindah ke mode teks demi menjaga ketenangan Anda.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={styles.guideIcon}>
                      <Smartphone size={22} color="#a78bfa" />
                    </div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>5. Tampilan Responsif Layar Smartphone</h4>
                      <p style={styles.guideText}>
                        Antarmuka Zeera AI sepenuhnya adaptif untuk perangkat ponsel cerdas dan tablet. Pada layar mobile, sidebar navigasi berubah menjadi menu geser (<em>drawer overlay</em>) yang dapat dibuka melalui tombol hamburger di pojok kiri atas, dan kamera panggung 3D secara otomatis menyesuaikan rasio vertikal layar.
                      </p>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div style={{
                    ...styles.guideItem,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '16px'
                  }}>
                    <div style={styles.guideIcon}>
                      <Lightbulb size={22} color="#34d399" />
                    </div>
                    <div style={styles.guideContent}>
                      <h4 style={styles.guideHeading}>6. Tips Berinteraksi dengan Zeera AI</h4>
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
                  <span style={styles.techBadge}>Realtime Progress Loader</span>
                  <span style={styles.techBadge}>Google Gemini AI (Multi-Model)</span>
                  <span style={styles.techBadge}>Gemini 3.1, 3.5, 3.6 Flash</span>
                  <span style={styles.techBadge}>Custom Model Selector</span>
                  <span style={styles.techBadge}>React Markdown</span>
                  <span style={styles.techBadge}>remark-gfm (GFM Tables)</span>
                  <span style={styles.techBadge}>IndexedDB & Dexie.js</span>
                  <span style={styles.techBadge}>dexie-react-hooks (Live Queries)</span>
                  <span style={styles.techBadge}>Local-First Architecture</span>
                  <span style={styles.techBadge}>Auto-Title Session Engine</span>
                  <span style={styles.techBadge}>Date Divider Engine</span>
                  <span style={styles.techBadge}>Dark & Light Theming (CSS Vars)</span>
                  <span style={styles.techBadge}>ChatGPT-Style Chat UI</span>
                  <span style={styles.techBadge}>Multi-Turn Conversation Memory</span>
                  <span style={styles.techBadge}>Microsoft Edge Neural TTS (GadisNeural)</span>
                  <span style={styles.techBadge}>Web Audio API (Realtime Lip-Sync)</span>
                  <span style={styles.techBadge}>Web Speech Recognition (Browser STT)</span>
                  <span style={styles.techBadge}>Clipboard API (Instant Copy)</span>
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
                    fontSize: isMobile ? '11px' : '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>Developed with</span>
                  <Heart size={12} color="#3b82f6" fill="#3b82f6" />
                  <span>by</span>
                  <span style={{ color: 'rgba(147, 197, 253, 0.9)', fontWeight: 600 }}>Raditya Rai Zeeshan</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Styling adaptif berbasis CSS Variables (Dark & Light Mode)
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
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'hidden',
    userSelect: 'none',
    touchAction: 'manipulation',
    transition: 'background-color 0.25s ease, color 0.25s ease'
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
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 30,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)'
  },
  sidebarLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
  },
  sidebarBrandTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: 'var(--text-primary)'
  },
  sidebarBrandSubtitle: {
    fontSize: '11px',
    color: 'var(--accent-blue-text)',
    fontWeight: 500
  },
  sidebarCloseBtn: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: 'var(--card-shadow)'
  },
  themeToggleBtn: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  themeToggleCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 14px',
    marginBottom: '12px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: 'var(--card-shadow)',
    minHeight: '42px'
  },
  themeToggleText: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  themeBadge: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: 'var(--accent-blue-subtle)',
    color: 'var(--accent-blue-text)'
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
    backgroundColor: 'var(--bg-nav-item)',
    border: '1px solid transparent',
    borderRadius: '12px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  navItemActive: {
    backgroundColor: 'var(--bg-nav-item-active)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--card-shadow)'
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
    color: 'var(--text-primary)'
  },
  navDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)'
  },

  // RIWAYAT CHAT SIDEBAR STYLES
  historySection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '8px 14px',
    borderTop: '1px solid var(--border-color)'
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
    color: 'var(--text-secondary)',
    textTransform: 'uppercase'
  },
  newChatMiniBtn: {
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    color: 'var(--accent-blue-text)',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
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
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  },
  historyItemActive: {
    backgroundColor: 'var(--bg-nav-item-active)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)'
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
    color: 'var(--text-secondary)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  historyEmpty: {
    fontSize: '11.5px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    padding: '16px 0',
    fontStyle: 'italic'
  },

  sidebarFooter: {
    padding: '16px 14px',
    borderTop: '1px solid var(--border-color)'
  },
  creatorCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 14px',
    transition: 'all 0.25s ease',
    boxShadow: 'var(--card-shadow)'
  },
  creatorHeader: {
    marginBottom: '4px'
  },
  creatorTag: {
    fontSize: '9px',
    fontWeight: 700,
    color: 'var(--accent-blue-text)',
    backgroundColor: 'var(--accent-blue-subtle)',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.6px'
  },
  creatorName: {
    margin: '4px 0 2px 0',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  creatorRole: {
    margin: '0 0 10px 0',
    fontSize: '11px',
    color: 'var(--text-secondary)'
  },
  portfolioButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--accent-blue)',
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
    backgroundColor: 'var(--bg-main)',
    backgroundImage: 'var(--bg-gradient)',
    transition: 'background-color 0.25s ease'
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
    backgroundColor: 'var(--bg-header)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-color)',
    zIndex: 20,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0
  },
  hamburgerBtn: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '18px',
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  brandTitle: {
    margin: 0,
    fontWeight: 700,
    letterSpacing: '0.3px',
    color: 'var(--text-primary)'
  },
  headerBadge: {
    fontSize: '11px',
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    color: 'var(--accent-blue-text)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600,
    boxShadow: 'var(--card-shadow)'
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
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    boxShadow: 'var(--card-shadow)'
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease'
  },
  statusText: {
    fontWeight: 500,
    color: 'var(--text-secondary)'
  },
  headerPortoBtn: {
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    color: 'var(--accent-blue-text)',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
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
  overlayChatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    pointerEvents: 'none',
    zIndex: 10,
    boxSizing: 'border-box'
  },
  bubbleWrapper: {
    display: 'flex',
    flex: 1,
    pointerEvents: 'none'
  },
  leftUserBubble: {
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: '16px 16px 4px 16px',
    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
    pointerEvents: 'auto',
    wordBreak: 'break-word',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  rightAiBubble: {
    backgroundColor: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '14px 20px',
    borderRadius: '16px 16px 16px 4px',
    boxShadow: 'var(--card-shadow)',
    pointerEvents: 'auto',
    wordBreak: 'break-word',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  bubbleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    marginBottom: '6px'
  },
  userBubbleAuthor: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#dbeafe',
    letterSpacing: '0.2px'
  },
  userBubbleTime: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: '0.2px'
  },
  aiBubbleAuthor: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--accent-blue-text)',
    letterSpacing: '0.2px'
  },
  aiBubbleTime: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    letterSpacing: '0.2px'
  },
  bubbleText: {
    margin: 0,
    fontSize: '13.5px',
    lineHeight: '1.55',
    color: 'inherit',
    whiteSpace: 'pre-wrap'
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
    backgroundColor: 'var(--bg-footer)',
    backdropFilter: 'blur(18px)',
    borderTop: '1px solid var(--border-color)',
    zIndex: 20,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  statusHint: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textAlign: 'center'
  },
  inputCard: {
    width: '100%',
    maxWidth: '780px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.25s ease'
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    minWidth: 0
  },
  micButton: {
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  sendButton: {
    backgroundColor: 'var(--accent-blue)',
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
    backgroundColor: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.25s ease'
  },
  aboutCardBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    color: 'var(--accent-blue-text)',
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    padding: '3px 8px',
    borderRadius: '6px',
    marginBottom: '8px'
  },
  aboutCardTitle: {
    margin: '0 0 10px 0',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  aboutCardLead: {
    lineHeight: '1.6',
    color: 'var(--text-lead)',
    margin: '0 0 16px 0'
  },
  aboutPortoBox: {
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px 18px',
    boxShadow: 'var(--card-shadow)'
  },
  bigPortoButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
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
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px 16px',
    transition: 'all 0.25s ease',
    boxShadow: 'var(--card-shadow)'
  },
  guideIcon: {
    fontSize: '22px',
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
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
    color: 'var(--text-primary)'
  },
  guideText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.55',
    color: 'var(--text-secondary)'
  },
  techBadgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px'
  },
  techBadge: {
    backgroundColor: 'var(--bg-badge)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-badge)',
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
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    letterSpacing: '0.3px',
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  }
}
