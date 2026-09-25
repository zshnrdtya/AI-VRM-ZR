import React, { useState, useRef, useEffect } from 'react'
import { SendHorizontal, ChevronDown, Check } from 'lucide-react'
import { chatStyles } from '../../styles/chatStyles'

interface ChatInputBarProps {
  isMobile: boolean
  inputMessage: string
  onInputChange: (text: string) => void
  onSendMessage: () => void
  isLoading: boolean
  selectedModel: string
  onSelectModel: (modelId: string) => void
  aiModels: Array<{ id: string; name: string }>
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  isMobile,
  inputMessage,
  onInputChange,
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModel,
  aiModels
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  return (
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
          padding: isMobile ? '6px 8px 6px 12px' : '8px 12px',
          alignItems: 'flex-end'
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onInput={handleInputResize}
          onKeyDown={handleKeyDown}
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

        {/* Custom Model Selector Dropdown */}
        <div
          ref={modelDropdownRef}
          style={{
            position: 'relative',
            flexShrink: 0,
            marginRight: isMobile ? '4px' : '8px',
            marginBottom: isMobile ? '1px' : '2px'
          }}
        >
          {/* Tombol Pemilih (Trigger) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isLoading && setIsModelDropdownOpen(!isModelDropdownOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!isLoading) setIsModelDropdownOpen(!isModelDropdownOpen)
              }
            }}
            title="Pilih Model AI"
            aria-haspopup="listbox"
            aria-expanded={isModelDropdownOpen}
            style={{
              padding: isMobile ? '6px 10px' : '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              userSelect: 'none',
              boxShadow: 'var(--card-shadow)',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <span>{aiModels.find((m) => m.id === selectedModel)?.name || 'Pilih Model'}</span>
            <ChevronDown
              size={13}
              style={{
                opacity: 0.7,
                transform: isModelDropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                flexShrink: 0
              }}
            />
          </div>

          {/* Daftar Menu Pop-up (Buka ke Atas / Droptop) */}
          {isModelDropdownOpen && (
            <div
              role="listbox"
              aria-label="Daftar Model AI"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                right: 0,
                backgroundColor: 'var(--bg-card-solid)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                padding: '6px 0',
                minWidth: '150px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {aiModels.map((model) => {
                const isSelected = selectedModel === model.id
                return (
                  <div
                    key={model.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectModel(model.id)
                      setIsModelDropdownOpen(false)
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '13px',
                      color: isSelected ? 'var(--accent-blue-text)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--accent-blue-subtle)' : 'transparent',
                      fontWeight: isSelected ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <span>{model.name}</span>
                    {isSelected && (
                      <Check size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            ...chatStyles.sendBtn,
            padding: isMobile ? '8px 14px' : '9px 18px',
            opacity: inputMessage.trim() && !isLoading ? 1 : 0.45,
            cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: isMobile ? '1px' : '2px'
          }}
        >
          <span>Kirim</span>
          <SendHorizontal size={14} />
        </button>
      </div>
    </footer>
  )
}
