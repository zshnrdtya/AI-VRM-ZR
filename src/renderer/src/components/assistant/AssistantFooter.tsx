import React from 'react'
import { Mic, Square, Sparkles, Volume2, AlertTriangle, Send, Heart } from 'lucide-react'
import { AppStatus } from '../../../../shared/types'
import { styles } from '../../styles/appStyles'

interface AssistantFooterProps {
  isMobile: boolean
  status: AppStatus
  isListening: boolean
  onToggleListening: () => void
  inputText: string
  onInputChange: (text: string) => void
  onSendMessage: () => void
}

export const AssistantFooter: React.FC<AssistantFooterProps> = ({
  isMobile,
  status,
  isListening,
  onToggleListening,
  inputText,
  onInputChange,
  onSendMessage
}) => {
  return (
    <footer
      style={{
        ...styles.footerBar,
        paddingTop: isMobile ? '10px' : '14px',
        paddingLeft: isMobile ? '14px' : '24px',
        paddingRight: isMobile ? '14px' : '24px',
        paddingBottom: isMobile
          ? 'max(30px, calc(18px + env(safe-area-inset-bottom, 0px)))'
          : 'calc(18px + env(safe-area-inset-bottom, 0px))'
      }}
    >
      {/* Status Hint */}
      <div
        style={{
          ...styles.statusHint,
          fontSize: isMobile ? '11px' : '12px',
          marginBottom: isMobile ? '6px' : '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
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
          <span>
            {isMobile
              ? 'Ketik atau klik mic untuk bicara'
              : 'Ketik pesan atau klik ikon mikrofon untuk berbicara'}
          </span>
        )}
      </div>

      {/* Input Bar */}
      <div
        style={{
          ...styles.inputCard,
          padding: isMobile ? '4px 6px' : '6px 10px',
          borderRadius: isMobile ? '12px' : '14px'
        }}
      >
        <button
          onClick={onToggleListening}
          style={{
            ...styles.micButton,
            width: isMobile ? '38px' : '40px',
            height: isMobile ? '38px' : '40px',
            backgroundColor: isListening ? '#ef4444' : 'var(--bg-badge)',
            boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'var(--card-shadow)'
          }}
          title={isListening ? 'Hentikan rekaman suara' : 'Mulai bicara dengan suara'}
          aria-label={isListening ? 'Hentikan rekaman' : 'Mulai bicara'}
        >
          {isListening ? <Square size={16} fill="white" /> : <Mic size={18} color="var(--text-primary)" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
          placeholder={isMobile ? 'Tanya Zeera...' : 'Ketik pesan atau pertanyaan untuk Zeera di sini...'}
          style={{
            ...styles.textInput,
            fontSize: '14px',
            padding: isMobile ? '6px 8px' : '8px 12px'
          }}
          disabled={status === 'processing'}
        />

        <button
          onClick={onSendMessage}
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
          aria-label="Kirim pesan"
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
  )
}
