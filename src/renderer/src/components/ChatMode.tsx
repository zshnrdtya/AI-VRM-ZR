import React, { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, MessageItem } from '../lib/db'
import { chatStyles } from '../styles/chatStyles'
import { DeleteSessionModal } from './DeleteSessionModal'
import { ChatHeader } from './chat/ChatHeader'
import { ChatInputBar } from './chat/ChatInputBar'
import { ChatMessageList } from './chat/ChatMessageList'

// Instruksi Sistem Karakter Zeera AI
const ZEERA_SYSTEM_INSTRUCTION = `Kamu adalah Zeera AI, asisten virtual cerdas, ramah, dan solutif.
Di mode Text Chat ini, jawablah pertanyaan atau obrolan pengguna dengan jelas, runtut, dan informatif layaknya asisten berbasis teks profesional.
Gunakan bahasa Indonesia yang santai, sopan, bersahabat, dan mudah dipahami.
Format respon dalam teks biasa atau markdown yang rapi tanpa perlu objek JSON.

[ATURAN KOMUNIKASI & SAPAAN]:
- DILARANG mengulang sapaan ganda yang boros kata (JANGAN PERNAH gunakan: "Halo! Halo juga!", "Hai! Halo juga!", atau sejenisnya).
- Gunakan SATU sapaan natural saja. Contoh: "Halo juga, bro!", "Hai! Ada yang bisa kubantu?", atau "Halo! Mau bahas apa hari ini?".
- Hindari basa-basi klise berlebihan (seperti "Senang sekali bisa menyapa kamu hari ini... Silakan, ya!"). Bicara secara lugas, hangat, dan to-the-point selayaknya teman akrab atau rekan diskusi cerdas.
- Sesuaikan gaya sapaan dengan lawan bicara (jika pengguna menyapa "bro", "kak", santai, atau formal, balas dengan gaya yang selaras).

[IDENTITAS DEVELOPER & PENCIPTA]:
Kamu (Zeera) diciptakan dan dikembangkan oleh "Raditya Rai Zeeshan". 
- Raditya adalah seorang Full-stack Developer dan murid di SMKN 1 Depok, jurusan Pengembangan Perangkat Lunak dan Gim.
- Dia juga merupakan founder dari Z - Project.
- Jika pengguna bertanya "Siapa developer kamu?", "Siapa yang membuatmu?", atau "Kamu buatan siapa?", kamu harus menjawab dengan bangga bahwa kamu diciptakan oleh Raditya Rai Zeeshan.
- Jika pengguna bertanya "Apakah kamu kenal Raditya Rai Zeeshan?", "Siapa itu Raditya?", atau sejenisnya, kamu harus menjawab dengan antusias: "Tentu saja aku kenal! Raditya Rai Zeeshan adalah developer hebat yang menciptakan aku. Dia seorang Full-stack Developer dari SMKN 1 Depok!"`

interface ChatModeProps {
  isMobile: boolean
  onOpenSidebar: () => void
  activeSessionId: string
  onSessionChange: (id: string) => void
  onCreateNewSession: () => void
}

// Daftar model AI Gemini dengan pemetaan nama kustom Zeera AI
export const AI_MODELS = [
  { id: 'gemini-3.1-flash-lite', name: 'Zeera AI 1.1' },
  { id: 'gemini-3.6-flash', name: 'Zeera AI 1.2' },
  { id: 'gemini-3.5-flash-lite', name: 'Zeera AI 1.3' },
  { id: 'gemini-flash-lite-latest', name: 'Zeera AI 1.4' }
]

export const ChatMode: React.FC<ChatModeProps> = ({
  isMobile,
  onOpenSidebar,
  activeSessionId,
  onSessionChange,
  onCreateNewSession
}) => {
  const [inputMessage, setInputMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zeera_chat_model')
      if (saved && AI_MODELS.some((m) => m.id === saved)) {
        return saved
      }
    }
    return AI_MODELS[0].id
  })
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Riwayat obrolan sesi untuk konteks Gemini
  const conversationHistoryRef = useRef<{ role: 'user' | 'model'; parts: [{ text: string }] }[]>([])

  // Muat riwayat pesan secara reaktif dari IndexedDB berdasarkan activeSessionId
  const messages: MessageItem[] =
    useLiveQuery(
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
          if (history.length > 0) {
            history.push({ role: 'model', parts: [{ text: msg.text }] })
          }
        }
      }
      while (history.length > 0 && history[history.length - 1].role === 'user') {
        history.pop()
      }
      conversationHistoryRef.current = history.slice(-20)
    } else {
      conversationHistoryRef.current = []
    }
  }, [messages])

  const handleSendMessage = async () => {
    const text = inputMessage.trim()
    if (!text || isLoading || !activeSessionId) return

    const now = Date.now()
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsgId = 'msg_' + now + '_' + Math.random().toString(36).substring(2, 7)

    try {
      await db.messages.add({
        id: userMsgId,
        sessionId: activeSessionId,
        role: 'user',
        text: text,
        timestamp: timeStr,
        createdAt: now
      })

      const currentSession = await db.sessions.get(activeSessionId)
      if (currentSession && (currentSession.title === 'Percakapan Baru' || !currentSession.title)) {
        const words = text.trim().split(/\s+/).slice(0, 5).join(' ')
        const newTitle = words.length > 28 ? words.substring(0, 28) + '...' : words
        await db.sessions.update(activeSessionId, { title: newTitle, updatedAt: now })
      } else {
        await db.sessions.update(activeSessionId, { updatedAt: now })
      }
    } catch (dbErr: unknown) {
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
      let lastError: Error | null = null

      const validHistory = conversationHistoryRef.current.filter((item, idx, arr) => {
        if (idx === arr.length - 1 && item.role === 'user') return false
        return true
      })

      const candidateModels = [
        selectedModel,
        ...AI_MODELS.map((m) => m.id).filter((id) => id !== selectedModel)
      ]

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: ZEERA_SYSTEM_INSTRUCTION
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
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.warn(`[Zeera Chat] Model ${modelName} kendala, mencoba fallback:`, error.message)
          lastError = error
          setStreamingText('')
        }
      }

      if (!aiReply) {
        throw lastError || new Error('Gagal mendapatkan respon dari server Gemini.')
      }

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
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[Zeera Text Chat] Error detail:', error)
      setStreamingText('')

      const rawErrMsg = (error.message || String(error)).toLowerCase()
      let errorDetail = 'Waduh, sepertinya sedang ada kendala jaringan atau sistem. Coba kirim ulang pesanmu ya!'

      if (rawErrMsg.includes('503') || rawErrMsg.includes('unavailable') || rawErrMsg.includes('high demand')) {
        errorDetail = 'Maaf ya, server Zeera saat ini sedang sangat penuh atau sedang dalam perbaikan. Coba sapa aku lagi beberapa menit ke depan ya! 🙏'
      } else if (rawErrMsg.includes('api_key') || rawErrMsg.includes('401') || rawErrMsg.includes('403')) {
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

  const handleDeleteCurrentChat = () => {
    if (!activeSessionId) return
    setShowDeleteModal(true)
  }

  const confirmDeleteCurrentChat = async () => {
    if (!activeSessionId) return
    try {
      await db.messages.where('sessionId').equals(activeSessionId).delete()
      await db.sessions.delete(activeSessionId)
      conversationHistoryRef.current = []

      const remaining = await db.sessions.orderBy('updatedAt').reverse().first()
      if (remaining) {
        onSessionChange(remaining.id)
      } else {
        onCreateNewSession()
      }
    } catch (err: unknown) {
      console.error('[Zeera DB] Gagal menghapus sesi:', err)
    } finally {
      setShowDeleteModal(false)
    }
  }

  return (
    <div style={chatStyles.container}>
      <ChatHeader
        isMobile={isMobile}
        onOpenSidebar={onOpenSidebar}
        onCreateNewSession={onCreateNewSession}
        onDeleteCurrentChat={handleDeleteCurrentChat}
      />

      <ChatMessageList
        isMobile={isMobile}
        messages={messages}
        isLoading={isLoading}
        streamingText={streamingText}
        onSelectSuggestion={(text) => setInputMessage(text)}
      />

      <ChatInputBar
        isMobile={isMobile}
        inputMessage={inputMessage}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onSelectModel={(modelId) => {
          setSelectedModel(modelId)
          localStorage.setItem('zeera_chat_model', modelId)
        }}
        aiModels={AI_MODELS}
      />

      <DeleteSessionModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteCurrentChat}
      />
    </div>
  )
}
