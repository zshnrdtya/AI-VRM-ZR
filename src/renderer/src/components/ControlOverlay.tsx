import { AppStatus, ChatMessage } from '../../../shared/types'

interface ControlOverlayProps {
  status: AppStatus
  lastAiMessage?: ChatMessage
  onStartListening: () => void
  onStopListening: () => void
  onToggleAgentMode: () => void
  isAgentActive: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function ControlOverlay({
  status,
  lastAiMessage,
  onStartListening,
  onStopListening,
  onToggleAgentMode,
  isAgentActive,
  onMouseEnter,
  onMouseLeave
}: ControlOverlayProps) {
  const isListening = status === 'listening'
  const isProcessing = status === 'processing'
  const isSpeaking = status === 'speaking'
  const isBusy = isProcessing || isSpeaking
  
  const handleClose = () => {
    window.electronAPI.closeWindow()
  }

  const handleMinimize = () => {
    window.electronAPI.minimizeWindow()
  }

  const handleHide = () => {
    window.electronAPI.hideWindow()
  }

  return (
    <div 
      className="control-overlay"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Top Window Controls (Visible on hover) */}
      <div className="window-controls window-drag">
        <button className="win-btn hide" onClick={handleHide} title="Sembunyikan Avatar">👻</button>
        <button className="win-btn min" onClick={handleMinimize} title="Minimize">_</button>
        <button className="win-btn close" onClick={handleClose} title="Tutup">×</button>
      </div>

      {/* Chat Bubble (Visible when there's a recent message) */}
      {lastAiMessage && (
        <div className={`chat-bubble emotion-${lastAiMessage.emotion || 'neutral'}`}>
          <div className="chat-text">{lastAiMessage.text}</div>
        </div>
      )}

      {/* Main Interaction Button */}
      <div className="interaction-container">
        <button 
          className={`mic-button ${isListening ? 'recording' : ''} ${isBusy ? 'busy' : ''}`}
          onClick={() => {
            if (isListening) onStopListening()
            else onStartListening()
          }}
          disabled={isBusy}
          title={isBusy ? 'Sedang sibuk...' : isListening ? 'Klik untuk mengirim' : 'Klik untuk berbicara'}
        >
          {isBusy ? '⏳' : isListening ? '⏹️' : '🎙️'}
        </button>
        <div className="mic-hint">
          {isListening ? 'Klik lagi untuk kirim' : 'Klik untuk ngobrol'}
        </div>
      </div>
      
      {/* Agent Mode Button */}
      <div className="agent-container" style={{ marginTop: '10px' }}>
        <button 
          className={`agent-button ${isAgentActive ? 'active' : ''}`}
          onClick={onToggleAgentMode}
          title={isAgentActive ? 'Matikan Coding Agent' : 'Aktifkan Coding Agent'}
          style={{
            background: isAgentActive ? '#4facfe' : 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px',
            color: 'white',
            padding: '5px 15px',
            fontSize: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s ease'
          }}
        >
          {isAgentActive ? '🤖 Agent Aktif' : '🧑‍💻 Mode Agent'}
        </button>
      </div>
    </div>
  )
}
