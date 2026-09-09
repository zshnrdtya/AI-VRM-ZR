import React, { useState, useRef, useEffect, useMemo } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useLiveQuery } from 'dexie-react-hooks'
import ReactMarkdown from 'react-markdown'
import { db, MessageItem } from '../lib/db'
import LOGO_URL from '../assets/logo-zz.png'
import {
  Menu,
  Plus,
  Trash2,
  SendHorizontal,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Compass,
  Copy,
  Check
} from 'lucide-react'

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
  const [streamingText, setStreamingText] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
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
      // Aturan Gemini API: pesan terakhir dalam riwayat yang dimasukkan ke startChat harus ber-role 'model'
      while (history.length > 0 && history[history.length - 1].role === 'user') {
        history.pop()
      }
      conversationHistoryRef.current = history.slice(-20)
    } else {
      conversationHistoryRef.current = []
    }
  }, [messages])

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingText])

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

      // Pastikan history untuk startChat selalu berpasangan dan pesan terakhir adalah dari 'model'
      const validHistory = conversationHistoryRef.current.filter((item, idx, arr) => {
        if (idx === arr.length - 1 && item.role === 'user') return false
        return true
      })

      // Loop coba model-model teks terbaik dengan streaming
      for (const modelName of TEXT_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `Kamu adalah Zeera AI, asisten virtual cerdas, ramah, dan solutif.
Di mode Text Chat ini, jawablah pertanyaan atau obrolan pengguna dengan jelas, runtut, dan informatif layaknya asisten berbasis teks profesional.
Gunakan bahasa Indonesia yang santai, sopan, bersahabat, dan mudah dipahami.
Format respon dalam teks biasa atau markdown yang rapi tanpa perlu objek JSON.

[IDENTITAS DEVELOPER & PENCIPTA]:
Kamu (Zeera) diciptakan dan dikembangkan oleh "Raditya Rai Zeeshan". 
- Raditya adalah seorang Full-stack Developer dan murid di SMKN 1 Depok, jurusan Pengembangan Perangkat Lunak dan Gim.
- Dia juga merupakan founder dari Z - Project.
- Jika pengguna bertanya "Siapa developer kamu?", "Siapa yang membuatmu?", atau "Kamu buatan siapa?", kamu harus menjawab dengan bangga bahwa kamu diciptakan oleh Raditya Rai Zeeshan.
- Jika pengguna bertanya "Apakah kamu kenal Raditya Rai Zeeshan?", "Siapa itu Raditya?", atau sejenisnya, kamu harus menjawab dengan antusias: "Tentu saja aku kenal! Raditya Rai Zeeshan adalah developer hebat yang menciptakan aku. Dia seorang Full-stack Developer dari SMKN 1 Depok!"`
          })

          const chatSession = model.startChat({
            history: validHistory
          })

          const result = await chatSession.sendMessageStream(text)
          let fullText = ''

          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullText += chunkText
            setStreamingText(fullText)
          }

          aiReply = fullText.trim()
          if (aiReply) break
        } catch (err: any) {
          console.warn(`[Zeera Chat] Model ${modelName} kendala, mencoba fallback:`, err.message || err)
          lastError = err
          setStreamingText('')
        }
      }

      if (!aiReply) {
        throw lastError || new Error('Gagal mendapatkan respon dari server Gemini.')
      }

      // 2. Simpan balasan AI ke IndexedDB setelah selesai streaming
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
      setStreamingText('')
    } catch (err: any) {
      console.error('[Zeera Text Chat] Error detail:', err)
      setStreamingText('')

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
      setStreamingText('')
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

  // Salin isi pesan balasan AI ke clipboard dengan feedback visual selama 2 detik
  const handleCopy = (id: string, text: string) => {
    if (!text) return
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedId(id)
        setTimeout(() => {
          setCopiedId((prev) => (prev === id ? null : prev))
        }, 2000)
      })
      .catch((err) => {
        console.error('[Zeera Chat] Gagal menyalin pesan:', err)
      })
  }

  // Komponen markdown styling yang digunakan untuk pesan tersimpan maupun streaming
  const markdownComponents = useMemo(
    () => ({
      p: ({ children }: any) => (
        <p
          style={{
            ...chatStyles.messageText,
            fontSize: isMobile ? '14px' : '14.5px',
            lineHeight: isMobile ? '1.55' : '1.65',
            color: 'var(--text-lead)',
            margin: '0 0 8px 0'
          }}
        >
          {children}
        </p>
      ),
      strong: ({ children }: any) => (
        <strong style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{children}</strong>
      ),
      em: ({ children }: any) => (
        <em style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{children}</em>
      ),
      ul: ({ children }: any) => (
        <ul
          style={{
            margin: '4px 0 8px 0',
            paddingLeft: '20px',
            listStyleType: 'disc',
            color: 'var(--text-lead)'
          }}
        >
          {children}
        </ul>
      ),
      ol: ({ children }: any) => (
        <ol
          style={{
            margin: '4px 0 8px 0',
            paddingLeft: '20px',
            listStyleType: 'decimal',
            color: 'var(--text-lead)'
          }}
        >
          {children}
        </ol>
      ),
      li: ({ children }: any) => (
        <li
          style={{
            margin: '3px 0',
            fontSize: isMobile ? '14px' : '14.5px',
            lineHeight: isMobile ? '1.5' : '1.6',
            color: 'var(--text-lead)'
          }}
        >
          {children}
        </li>
      ),
      code: ({ children, className }: any) => {
        const isCodeBlock = Boolean(className)
        if (isCodeBlock) {
          return (
            <code
              style={{
                fontFamily: 'Consolas, Menlo, Monaco, monospace',
                fontSize: '13px',
                color: 'var(--text-lead)'
              }}
            >
              {children}
            </code>
          )
        }
        return (
          <code
            style={{
              backgroundColor: 'var(--bg-badge)',
              padding: '2px 5px',
              borderRadius: '4px',
              fontSize: '0.9em',
              fontFamily: 'Consolas, Menlo, Monaco, monospace',
              color: 'var(--accent-blue-text)',
              wordBreak: 'break-word'
            }}
          >
            {children}
          </code>
        )
      },
      pre: ({ children }: any) => (
        <pre
          style={{
            backgroundColor: 'var(--bg-card-solid)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 14px',
            overflowX: 'auto',
            margin: '8px 0',
            fontSize: '13px'
          }}
        >
          {children}
        </pre>
      ),
      a: ({ href, children }: any) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-blue-text)',
            textDecoration: 'underline',
            wordBreak: 'break-all'
          }}
        >
          {children}
        </a>
      ),
      blockquote: ({ children }: any) => (
        <blockquote
          style={{
            borderLeft: '3px solid var(--accent-blue)',
            paddingLeft: '12px',
            margin: '8px 0',
            color: 'var(--text-lead)',
            fontStyle: 'italic',
            backgroundColor: 'var(--accent-blue-subtle)',
            paddingTop: '4px',
            paddingBottom: '4px',
            borderRadius: '0 6px 6px 0'
          }}
        >
          {children}
        </blockquote>
      ),
      h1: ({ children }: any) => (
        <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>
          {children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, margin: '6px 0 4px 0', color: 'var(--text-primary)' }}>
          {children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3 style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 600, margin: '6px 0 3px 0', color: 'var(--text-primary)' }}>
          {children}
        </h3>
      )
    }),
    [isMobile]
  )

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
            <Trash2 size={isMobile ? 18 : 13} />
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
                  { text: 'Halo Zeera, ceritakan tentang dirimu!', icon: MessageSquare },
                  { text: 'Berikan ide topik menarik hari ini', icon: Lightbulb },
                  { text: 'Bantu buatkan rencana kegiatan mingguan', icon: Compass }
                ].map((item, idx) => {
                  const IconComp = item.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(item.text)}
                      style={{
                        ...chatStyles.suggestionChip,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <IconComp size={14} color="var(--accent-blue-text)" />
                      <span>{item.text}</span>
                    </button>
                  )
                })}
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
                  {isUser ? (
                    <p
                      style={{
                        ...chatStyles.messageText,
                        fontSize: isMobile ? '14px' : '14.5px',
                        lineHeight: isMobile ? '1.5' : '1.6'
                      }}
                    >
                      {msg.text}
                    </p>
                  ) : (
                    <div style={chatStyles.markdownContainer}>
                      <ReactMarkdown components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {isUser ? (
                    <span style={chatStyles.timestamp}>{msg.timestamp}</span>
                  ) : (
                    <div style={chatStyles.bubbleFooter}>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        style={{
                          ...chatStyles.copyButton,
                          color: copiedId === msg.id ? '#10b981' : 'var(--text-secondary)',
                          borderColor:
                            copiedId === msg.id ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
                          backgroundColor:
                            copiedId === msg.id ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-badge)'
                        }}
                        title={copiedId === msg.id ? 'Tersalin ke clipboard!' : 'Salin pesan'}
                        aria-label={copiedId === msg.id ? 'Tersalin' : 'Salin pesan'}
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={12} />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                      <span style={{ ...chatStyles.timestamp, marginTop: 0 }}>{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Streaming Message Bubble (Khusus saat AI sedang mengetik/streaming respon) */}
          {streamingText.length > 0 && (
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
                  maxWidth: isMobile ? '86%' : '72%',
                  padding: isMobile ? '10px 14px' : '12px 18px',
                  borderRadius: isMobile ? '14px' : '16px'
                }}
              >
                <div style={chatStyles.markdownContainer}>
                  <ReactMarkdown components={markdownComponents}>
                    {streamingText}
                  </ReactMarkdown>
                </div>
                <span style={chatStyles.timestamp}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}

          {/* Typing Indicator (Hanya tampil saat loading dan belum ada teks yang di-stream) */}
          {isLoading && !streamingText && (
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
                  borderRadius: isMobile ? '14px' : '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={13} color="var(--accent-blue-text)" />
                <span
                  style={{
                    ...chatStyles.typingText,
                    fontSize: isMobile ? '12px' : '13px'
                  }}
                >
                  Zeera sedang mengetik...
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
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Kirim</span>
            <SendHorizontal size={14} />
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
    backgroundColor: 'var(--bg-main)',
    backgroundImage: 'var(--bg-gradient)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background-color 0.25s ease'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-header)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-color)',
    zIndex: 10,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
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
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--accent-blue-text)',
    fontWeight: 500
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
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
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  newChatBtn: {
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--accent-blue)',
    color: 'var(--accent-blue-text)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    boxShadow: 'var(--card-shadow)'
  },
  clearBtn: {
    backgroundColor: 'var(--btn-secondary-bg)',
    border: '1px solid var(--btn-secondary-border)',
    color: 'var(--btn-secondary-text)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 500,
    boxShadow: 'var(--card-shadow)'
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
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    flexShrink: 0,
    boxShadow: 'var(--card-shadow)'
  },
  bubble: {
    padding: '12px 18px',
    borderRadius: '16px',
    lineHeight: '1.6',
    boxShadow: 'var(--card-shadow)',
    userSelect: 'text',
    WebkitUserSelect: 'text'
  },
  userBubble: {
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    borderBottomRightRadius: '4px'
  },
  assistantBubble: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(12px)',
    borderBottomLeftRadius: '4px',
    boxShadow: 'var(--card-shadow)'
  },
  messageText: {
    margin: 0,
    fontSize: '14.5px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    cursor: 'text'
  },
  markdownContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    cursor: 'text'
  },
  timestamp: {
    display: 'block',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
    textAlign: 'right',
    userSelect: 'none'
  },
  bubbleFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '6px',
    paddingTop: '4px',
    borderTop: '1px solid var(--border-color)',
    gap: '8px'
  },
  copyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'var(--bg-badge)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  },
  typingText: {
    fontSize: '13px',
    color: 'var(--accent-blue-text)',
    fontStyle: 'italic'
  },
  footer: {
    backgroundColor: 'var(--bg-footer)',
    backdropFilter: 'blur(18px)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '12px',
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  inputCard: {
    maxWidth: '850px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '10px',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.25s ease'
  },
  textarea: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
    padding: '4px 6px',
    maxHeight: '120px'
  },
  sendBtn: {
    backgroundColor: 'var(--accent-blue)',
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
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: 'var(--card-shadow)'
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
    color: 'var(--text-primary)'
  },
  emptyDesc: {
    margin: '0 0 18px 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  suggestionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%'
  },
  suggestionChip: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  }
}
