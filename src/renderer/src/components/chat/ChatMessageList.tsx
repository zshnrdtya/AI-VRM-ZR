import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MessageSquare, Lightbulb, Compass, Copy, Check, Sparkles } from 'lucide-react'
import { MessageItem } from '../../lib/db'
import { chatStyles } from '../../styles/chatStyles'
import { useMarkdownComponents } from './useMarkdownComponents'
import LOGO_URL from '../../assets/logo-zeera.jpeg'

interface ChatMessageListProps {
  isMobile: boolean
  messages: MessageItem[]
  isLoading: boolean
  streamingText: string
  onSelectSuggestion: (text: string) => void
}

/**
 * Memeriksa apakah dua timestamp berada pada hari kalender yang sama
 */
function isSameDay(ts1?: number, ts2?: number): boolean {
  if (!ts1 || !ts2) return false
  const d1 = new Date(ts1)
  const d2 = new Date(ts2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Memformat timestamp menjadi pemisah tanggal yang mudah dibaca:
 * 'Hari Ini', 'Kemarin', atau tanggal lengkap Indonesia
 */
function formatDateDivider(timestamp?: number): string {
  if (!timestamp) return 'Hari Ini'
  const date = new Date(timestamp)
  const now = new Date()

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const oneDay = 24 * 60 * 60 * 1000

  if (target === today) {
    return 'Hari Ini'
  } else if (target === today - oneDay) {
    return 'Kemarin'
  } else {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  isMobile,
  messages,
  isLoading,
  streamingText,
  onSelectSuggestion
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const markdownComponents = useMarkdownComponents(isMobile)

  // Otomatis scroll ke pesan terbaru saat riwayat bertambah atau teks di-stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingText])

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
      .catch((err: unknown) => {
        console.error('[Zeera Chat] Gagal menyalin pesan:', err)
      })
  }

  return (
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
        {/* Tampilan awal saat percakapan belum memiliki pesan */}
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
                    onClick={() => onSelectSuggestion(item.text)}
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

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          const msgTime = msg.createdAt || Date.now()
          const prevMsg = index > 0 ? messages[index - 1] : null
          const prevTime = prevMsg ? prevMsg.createdAt || msgTime : undefined
          const showDateDivider = index === 0 || !isSameDay(msgTime, prevTime)
          const formattedDateString = formatDateDivider(msgTime)

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div style={chatStyles.dateDividerContainer}>
                  <div style={chatStyles.dateDividerLine} />
                  <span style={chatStyles.dateDividerText}>{formattedDateString}</span>
                  <div style={chatStyles.dateDividerLine} />
                </div>
              )}
              <div
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {isUser ? (
                    <span style={{ ...chatStyles.timestamp, color: 'rgba(255, 255, 255, 0.8)' }}>
                      {msg.timestamp}
                    </span>
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
            </React.Fragment>
          )
        })}

        {/* Bubble khusus saat AI sedang streaming respon balasan */}
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
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {streamingText}
                </ReactMarkdown>
              </div>
              <span style={chatStyles.timestamp}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Indikator mengetik saat menunggu stream dimulai */}
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
  )
}
