import { useState, useRef, useEffect, useCallback } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Emotion } from '../../../shared/types'
import { LipSyncController } from '../avatar/LipSyncController'
import { AudioPlayer } from '../voice/AudioPlayer'

export type AppStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface ISpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onstart: (() => void) | null
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

interface IWindowSpeechRecognition {
  new (): ISpeechRecognition
}

const FAST_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.6-flash']

const AVATAR_SYSTEM_INSTRUCTION = `Kamu adalah Zeera, asisten virtual 3D anime yang ceria, ramah, dan bersahabat.
Gaya bicaramu santai, sopan, dan ekspresif seperti teman akrab.
Jawablah secara ringkas dan natural (1 sampai 2 kalimat saja) agar nyaman didengar.
DILARANG mengulang sapaan ganda (seperti "Halo! Halo juga!"). Gunakan satu sapaan santai dan langsung to-the-point tanpa basa-basi klise.

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

export function useAvatarAssistant() {
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

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const audioPlayerRef = useRef<AudioPlayer | null>(null)
  const conversationHistoryRef = useRef<{ role: 'user' | 'model'; parts: [{ text: string }] }[]>([])

  useEffect(() => {
    const player = new AudioPlayer()
    audioPlayerRef.current = player
    return () => {
      player.stop()
    }
  }, [])

  const stopVoice = useCallback(() => {
    window.speechSynthesis?.cancel()
    audioPlayerRef.current?.stop()
    if (lipSync) lipSync.setSpeaking(false)
    setAnimationState('idle')
  }, [lipSync])

  const speakResponse = useCallback(
    async (text: string) => {
      const cleanText = text.replace(/[*_#`~[\]]/g, '').trim()
      if (!cleanText) {
        setStatus('idle')
        return
      }

      setStatus('speaking')
      setAnimationState('talking')
      audioPlayerRef.current?.stop()

      // Prioritas 1: Edge TTS backend endpoint
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
      } catch (edgeErr: unknown) {
        console.warn('[Zeera] Edge-TTS server tidak merespon, fallback ke Web Speech...', edgeErr)
      }

      // Prioritas 2: Fallback Web Speech Synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = 'id-ID'
        utterance.rate = 1.05
        utterance.pitch = 1.15

        const voices = window.speechSynthesis.getVoices()
        const idVoice = voices.find((v) => v.lang.includes('id') || v.lang.includes('ID'))
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
    },
    [lipSync]
  )

  const handleSendMessage = useCallback(
    async (textOverride?: string) => {
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
        let lastError: Error | null = null

        for (const modelName of FAST_MODELS) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction: AVATAR_SYSTEM_INSTRUCTION
            })

            const chatSession = model.startChat({
              history: conversationHistoryRef.current
            })

            const sendPromise = chatSession.sendMessage(message)
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout pada model ${modelName}`)), 12000)
            )

            const result = await Promise.race([sendPromise, timeoutPromise])
            rawText = result.response.text().trim()
            if (rawText) break
          } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err))
            console.warn(`[Zeera Avatar] Model ${modelName} kendala, mencoba fallback...`, error.message)
            lastError = error
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
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('Gemini API error:', error)
        const errText = 'Maaf, sepertinya sedang ada kendala koneksi ke server AI.'
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setCurrentAiMsg({ text: errText, timestamp: replyTime })
        setErrorMessage(error.message || 'Terjadi kesalahan pada Gemini API')
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      }
    },
    [inputText, status, speakResponse]
  )

  useEffect(() => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: IWindowSpeechRecognition; webkitSpeechRecognition?: IWindowSpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: IWindowSpeechRecognition; webkitSpeechRecognition?: IWindowSpeechRecognition })
        .webkitSpeechRecognition

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass()
      recognition.lang = 'id-ID'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        setStatus('listening')
        setErrorMessage(null)
      }

      recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
        const transcript = event.results[0]?.[0]?.transcript
        if (transcript) {
          setInputText(transcript)
          handleSendMessage(transcript)
        }
      }

      recognition.onerror = (event: { error: string }) => {
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
  }, [handleSendMessage])

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
        stopVoice()
        recognitionRef.current.start()
      } catch (err: unknown) {
        console.error('Error starting mic:', err)
      }
    }
  }

  const handleControllersReady = useCallback((controllers: { lipSync: LipSyncController }) => {
    setLipSync(controllers.lipSync)
    if (audioPlayerRef.current) {
      const { context, source } = audioPlayerRef.current.getLipSyncSource()
      controllers.lipSync.connect(context, source)
    }
  }, [])

  return {
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
  }
}
