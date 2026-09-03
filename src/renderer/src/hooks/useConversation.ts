import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from '../../../shared/types'

export function useConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    addMessage,
    clearMessages
  }
}
