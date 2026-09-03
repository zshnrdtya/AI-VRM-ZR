import { useState, useRef, useEffect, useCallback } from 'react'
import { AppStatus, ChatMessage, Emotion } from '../../../shared/types'
import { MicrophoneManager } from '../voice/MicrophoneManager'
import { AudioPlayer } from '../voice/AudioPlayer'

interface UseVoiceInteractionProps {
  onAudioNodeReady: (context: AudioContext, source: AudioNode) => void
  onAddMessage: (message: ChatMessage) => void
  onEmotionChange: (emotion: Emotion) => void
  onGestureChange: (gesture: string) => void
  onAnimationStateChange: (state: 'idle' | 'talking') => void
}

export function useVoiceInteraction({
  onAudioNodeReady,
  onAddMessage,
  onEmotionChange,
  onGestureChange,
  onAnimationStateChange
}: UseVoiceInteractionProps) {
  const [status, setStatus] = useState<AppStatus>('initializing')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const micManagerRef = useRef<MicrophoneManager | null>(null)
  const audioPlayerRef = useRef<AudioPlayer | null>(null)

  // Initialize audio components
  useEffect(() => {
    micManagerRef.current = new MicrophoneManager()
    audioPlayerRef.current = new AudioPlayer()
    
    // Provide audio nodes to LipSyncController
    const { context, source } = audioPlayerRef.current.getLipSyncSource()
    onAudioNodeReady(context, source)
    
    // Set up audio end callback
    audioPlayerRef.current.onEnded(() => {
      setStatus('idle')
      onAnimationStateChange('idle')
      onEmotionChange('neutral')
    })
    
    setStatus('idle')
    
    return () => {
      audioPlayerRef.current?.stop()
    }
  }, [onAudioNodeReady, onAnimationStateChange, onEmotionChange])

  const startListening = useCallback(async () => {
    if (status !== 'idle' && status !== 'error') return
    
    try {
      setErrorMsg(null)
      // Stop any ongoing speech
      audioPlayerRef.current?.stop()
      onAnimationStateChange('idle')
      onEmotionChange('neutral')
      
      await micManagerRef.current?.startRecording()
      setStatus('listening')
    } catch (error) {
      console.error(error)
      setErrorMsg(error instanceof Error ? error.message : 'Gagal mengakses microphone')
      setStatus('error')
    }
  }, [status, onAnimationStateChange, onEmotionChange])

  const stopListening = useCallback(async () => {
    if (status !== 'listening') return
    
    try {
      setStatus('processing')
      
      // 1. Get recorded audio
      const audioBuffer = await micManagerRef.current?.stopRecording()
      if (!audioBuffer) throw new Error('Audio kosong')

      // 2. Send to main process pipeline (STT -> LLM -> TTS)
      const result = await window.electronAPI.pipeline(audioBuffer)
      
      // Add messages to history
      onAddMessage({
        id: Date.now().toString() + '-user',
        role: 'user',
        text: result.transcription,
        createdAt: Date.now()
      })
      
      onAddMessage({
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        text: result.response.text,
        emotion: result.response.emotion as Emotion,
        createdAt: Date.now()
      })
      
      // 3. Play response
      if (result.audioBuffer && result.audioBuffer.byteLength > 0) {
        setStatus('speaking')
        onEmotionChange(result.response.emotion as Emotion)
        if (result.response.gesture) onGestureChange(result.response.gesture)
        onAnimationStateChange('talking')
        await audioPlayerRef.current?.playBuffer(result.audioBuffer)
      } else {
        // If there's no audio, just reset state
        setStatus('idle')
        onAnimationStateChange('idle')
        onEmotionChange('neutral')
      }
      
    } catch (error) {
      console.error(error)
      setErrorMsg(error instanceof Error ? error.message : 'Terjadi kesalahan pada server AI')
      setStatus('error')
      
      // Auto-recover after 3 seconds
      setTimeout(() => {
        setStatus(prev => prev === 'error' ? 'idle' : prev)
      }, 3000)
    }
  }, [status, onAddMessage, onAnimationStateChange, onEmotionChange])

  return {
    status,
    errorMsg,
    startListening,
    stopListening,
    setStatus,
    setErrorMsg
  }
}
