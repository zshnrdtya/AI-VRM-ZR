import React, { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, MessageItem } from '../lib/db'
import LOGO_URL from '../assets/logo-zz.png'

interface ChatModeProps {
  isMobile: boolean
  onOpenSidebar: () => void
  activeSessionId: string
  onSessionChange: (id: string) => void
  onCreateNewSession: () => void
}

// Model prioritas untuk text chat (gemini-3.1-flash-lite sangat cepat dan stabil)
const TEXT_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest'
]

export const ChatMode: React.FC<ChatModeProps> = ({
  isMobile,
  onOpenSidebar,
  activeSessionId,
  onSessionChange,
  onCreateNewSession
}) => {
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Riwayat obrolan sesi untuk konteks Gemini
  const conversationHistoryRef = useRef<{ role: 'user' | 'model'; parts: [{ text: string }] }[]>([])

  // Muat riwayat pesan secara reaktif dari IndexedDB berdasarkan activeSessionId
  const messages: MessageItem[] = useLiveQuery(
    async () => {
      if (!activeSessionId) return []
      const list = await db.messages.where('sessionId').equals(activeSessionId).toArray()
      return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    },
    [activeSessionId],
    []
  ) || []

  // Sinkronisasi riwayat obrolan multi-turn ke conversationHistoryRef untuk konteks Gemini
  useEffect(() => {
    if (messages && messages.length > 0) {
      const history: { role: 'user' | 'model'; parts: [{ text: string }] }[] = []
      for (const msg of messages) {
        if (msg.role === 'user') {
          history.push({ role: 'user', parts: [{ text: msg.text }] })
        } else if (msg.role === 'assistant') {
          // Aturan Gemini API: pesan pertama di history harus ber-role 'user'
          if (history.length > 0) {
            history.push({ role: 'model', parts: [{ text: msg.text }] })
          }
        }
      }
      conversationHistoryRef.current = history.slice(-20)
    } else {
      conversationHistoryRef.current = []
    }
  }, [messages])

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    const text = inputMessage.trim()
    if (!text || isLoading || !activeSessionId) return

    const now = Date.now()
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsgId = 'msg_' + now + '_' + Math.random().toString(36).substring(2, 7)

    // 1. Simpan pesan pengguna langsung ke IndexedDB
    try {
      await db.messages.add({
        id: userMsgId,
        sessionId: activeSessionId,
        role: 'user',
        text: text,
        timestamp: timeStr,
        createdAt: now
      })

      // Fitur Auto-Title: Jika judul sesi masih default "Percakapan Baru", update dengan 3-5 kata pertama
      const currentSession = await db.sessions.get(activeSessionId)
      if (currentSession && (currentSession.title === 'Percakapan Baru' || !currentSession.title)) {
        const words = text.trim().split(/\s+/).slice(0, 5).join(' ')
        const newTitle = words.length > 28 ? words.substring(0, 28) + '...' : words
        await db.sessions.update(activeSessionId, { title: newTitle, updatedAt: now })
      } else {
        await db.sessions.update(activeSessionId, { updatedAt: now })
      }
    } catch (dbErr) {
      console.error('[Zeera DB] Gagal menyimpan pesan user:', dbErr)
    }

    setInputMessage('')
    setIsLoading(true)

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      await db.messages.add({
        id: 'err_' + Date.now(),
        sessionId: activeSessionId,
        role: 'assistant',
        text: '⚠️ Kunci VITE_GEMINI_API_KEY belum dikonfigurasi di file .env Anda. Mohon periksa kembali.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      })
      setIsLoading(false)
      return
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      let aiReply = ''
      let lastError: any = null

      // Loop coba model-model teks terbaik
      for (const modelName of TEXT_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `Kamu adalah Zeera AI, asisten virtual cerdas, ramah, dan solutif.
Di mode Text Chat ini, jawablah pertanyaan atau obrolan pengguna dengan jelas, runtut, dan informatif layaknya asisten berbasis teks profesional.
Gunakan bahasa Indonesia yang santai, sopan, bersahabat, dan mudah dipahami.
Format respon dalam teks biasa atau markdown yang rapi tanpa perlu objek JSON.`
          })

          const chatSession = model.startChat({
            history: conversationHistoryRef.current
          })

          const sendPromise = chatSession.sendMessage(text)
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout pada model ${modelName}`)), 12000)
          )

          const result = await Promise.race([sendPromise, timeoutPromise])
          aiReply = result.response.text().trim()
          if (aiReply) break
        } catch (err: any) {
          console.warn(`[Zeera Chat] Model ${modelName} kendala, mencoba fallback:`, err.message || err)
          lastError = err
        }
      }

      if (!aiReply) {
        throw lastError || new Error('Gagal mendapatkan respon dari server Gemini.')
      }

      // 2. Simpan balasan AI ke IndexedDB
      const aiNow = Date.now()
      await db.messages.add({
        id: 'ai_' + aiNow + '_' + Math.random().toString(36).substring(2, 7),
        sessionId: activeSessionId,
        role: 'assistant',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: aiNow
      })
      await db.sessions.update(activeSessionId, { updatedAt: aiNow })
    } catch (err: any) {
      console.error('[Zeera Text Chat] Error detail:', err)

      const rawErrMsg = (err?.message || String(err || '')).toLowerCase()
      let errorDetail = 'Waduh, sepertinya sedang ada kendala jaringan atau sistem. Coba kirim ulang pesanmu ya!'

      if (rawErrMsg.includes('503') || rawErrMsg.includes('unavailable') || rawErrMsg.includes('high demand')) {
        errorDetail = 'Maaf ya, server Zeera saat ini sedang sangat penuh atau sedang dalam perbaikan. Coba sapa aku lagi beberapa menit ke depan ya! 🙏'
      } else if (rawErrMsg.includes('api_key_invalid') || rawErrMsg.includes('403')) {
        errorDetail = 'Sepertinya ada kendala pada kunci akses API (API Key). Mohon periksa kembali pengaturannya.'
      }

      await db.messages.add({
        id: 'err_' + Date.now(),
        sessionId: activeSessionId,
        role: 'assistant',
        text: errorDetail,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Hapus seluruh sesi ini dari database
  const handleDeleteCurrentChat = async () => {
    if (!activeSessionId) return
    if (confirm('Hapus percakapan ini secara permanen?')) {
      try {
        await db.messages.where('sessionId').equals(activeSessionId).delete()
        await db.sessions.delete(activeSessionId)
        conversationHistoryRef.current = []

        // Beralih ke sesi lain yang tersedia, atau buat sesi baru
        const remaining = await db.sessions.orderBy('updatedAt').reverse().first()
        if (remaining) {
          onSessionChange(remaining.id)
        } else {
          onCreateNewSession()
        }
      } catch (err) {
        console.error('[Zeera DB] Gagal menghapus sesi:', err)
      }
    }
  }

  return (
    <div style={chatStyles.container}>
      {/* Top Header */}
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
              ☰
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
            <span>➕</span>
            {!isMobile && <span>Chat Baru</span>}
          </button>
          <button
            onClick={handleDeleteCurrentChat}
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
            <span>🗑️</span>
            {!isMobile && <span>Hapus Chat</span>}
          </button>
        </div>
      </header>

      {/* Message History Area */}
      <div
        style={{
          ...chatStyles.chatArea,
          padding: isMobile ? '16px 12px' : '24px 16px'
        }}
      >
        <div
          style={{
            ...chatStyles.messagesList,
            gap: isMobile ? '12px' : '18px'
          }}
        >
          {/* Empty state bila percakapan belum ada pesan */}
          {messages.length === 0 && (
            <div style={chatStyles.emptyContainer}>
              <div style={chatStyles.emptyIconWrapper}>
                <img src={LOGO_URL} alt="Zeera" style={chatStyles.emptyLogo} />
              </div>
              <h3 style={chatStyles.emptyTitle}>Mulai Mengobrol dengan Zeera</h3>
              <p style={chatStyles.emptyDesc}>
                {isMobile
                  ? 'Ketik pesan atau pilih salah satu topik di bawah untuk memulai percakapan.'
                  : 'Mode chat teks ini bekerja secara offline-first dengan database lokal. Ajukan pertanyaan, minta ringkasan, atau diskusikan ide.'}
              </p>
              <div style={chatStyles.suggestionsWrapper}>
                {[
                  '👋 Halo Zeera, ceritakan tentang dirimu!',
                  '💡 Berikan ide topik menarik hari ini',
                  '💻 Bantu buatkan rencana kegiatan mingguan'
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputMessage(prompt.replace(/^[^\s]+\s/, ''))}
                    style={chatStyles.suggestionChip}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                style={{
                  ...chatStyles.messageRow,
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: isMobile ? '8px' : '12px'
                }}
              >
                {!isUser && (
                  <img
                    src={LOGO_URL}
                    alt="Zeera"
                    style={{
                      ...chatStyles.avatarIcon,
                      width: isMobile ? '30px' : '34px',
                      height: isMobile ? '30px' : '34px'
                    }}
                  />
                )}
                <div
                  style={{
                    ...chatStyles.bubble,
                    ...(isUser ? chatStyles.userBubble : chatStyles.assistantBubble),
                    maxWidth: isMobile ? '86%' : '72%',
                    padding: isMobile ? '10px 14px' : '12px 18px',
                    borderRadius: isMobile ? '14px' : '16px'
                  }}
                >
                  <p
                    style={{
                      ...chatStyles.messageText,
                      fontSize: isMobile ? '14px' : '14.5px',
                      lineHeight: isMobile ? '1.5' : '1.6'
                    }}
                  >
                    {msg.text}
                  </p>
                  <span style={chatStyles.timestamp}>{msg.timestamp}</span>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div
              style={{
                ...chatStyles.messageRow,
                justifyContent: 'flex-start',
                gap: isMobile ? '8px' : '12px'
              }}
            >
              <img
                src={LOGO_URL}
                alt="Zeera"
                style={{
                  ...chatStyles.avatarIcon,
                  width: isMobile ? '30px' : '34px',
                  height: isMobile ? '30px' : '34px'
                }}
              />
              <div
                style={{
                  ...chatStyles.bubble,
                  ...chatStyles.assistantBubble,
                  padding: isMobile ? '8px 14px' : '12px 18px',
                  borderRadius: isMobile ? '14px' : '16px'
                }}
              >
                <span
                  style={{
                    ...chatStyles.typingText,
                    fontSize: isMobile ? '12px' : '13px'
                  }}
                >
                  ✨ Zeera sedang mengetik...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Box */}
      <footer
        style={{
          ...chatStyles.footer,
          paddingTop: isMobile ? '8px' : '12px',
          paddingLeft: isMobile ? '12px' : '24px',
          paddingRight: isMobile ? '12px' : '24px',
          paddingBottom: isMobile
            ? 'max(14px, calc(10px + env(safe-area-inset-bottom, 0px)))'
            : 'calc(18px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div
          style={{
            ...chatStyles.inputCard,
            padding: isMobile ? '6px 8px 6px 12px' : '8px 12px'
          }}
        >
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={
              isMobile
                ? 'Ketik pesan...'
                : 'Ketik pertanyaan untuk Zeera... (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)'
            }
            style={{
              ...chatStyles.textarea,
              fontSize: isMobile ? '15px' : '14px'
            }}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              ...chatStyles.sendBtn,
              padding: isMobile ? '8px 14px' : '9px 18px',
              opacity: inputMessage.trim() && !isLoading ? 1 : 0.45,
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed'
            }}
          >
            {isMobile ? 'Kirim' : 'Kirim ➔'}
          </button>
        </div>
      </footer>
    </div>
  )
}

const chatStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: '#070b15',
    backgroundImage: 'radial-gradient(ellipse at top, #0f1c3f 0%, #070b15 70%)',
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 16, 32, 0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 10
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    margin: 0,
    fontWeight: 700,
    letterSpacing: '0.3px',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: '11px',
    color: '#60a5fa',
    fontWeight: 500
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
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
    cursor: 'pointer'
  },
  newChatBtn: {
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#93c5fd',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  clearBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#cbd5e1',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 500
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column'
  },
  messagesList: {
    maxWidth: '850px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%'
  },
  avatarIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    objectFit: 'contain',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
  },
  bubble: {
    padding: '12px 18px',
    borderRadius: '16px',
    lineHeight: '1.6',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
  },
  userBubble: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    borderBottomRightRadius: '4px'
  },
  assistantBubble: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#f1f5f9',
    backdropFilter: 'blur(12px)',
    borderBottomLeftRadius: '4px'
  },
  messageText: {
    margin: 0,
    fontSize: '14.5px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  timestamp: {
    display: 'block',
    fontSize: '10px',
    opacity: 0.55,
    marginTop: '6px',
    textAlign: 'right'
  },
  typingText: {
    fontSize: '13px',
    color: '#93c5fd',
    fontStyle: 'italic'
  },
  footer: {
    backgroundColor: 'rgba(8, 14, 28, 0.94)',
    backdropFilter: 'blur(18px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '12px'
  },
  inputCard: {
    maxWidth: '850px',
    margin: '0 auto',
    backgroundColor: '#10182b',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  },
  textarea: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
    padding: '4px 6px',
    maxHeight: '120px'
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    margin: 'auto',
    padding: '24px 16px',
    maxWidth: '460px'
  },
  emptyIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.2)'
  },
  emptyLogo: {
    width: '42px',
    height: '42px',
    objectFit: 'contain'
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '17px',
    fontWeight: 700,
    color: '#ffffff'
  },
  emptyDesc: {
    margin: '0 0 18px 0',
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.5'
  },
  suggestionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%'
  },
  suggestionChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
}
