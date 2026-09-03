import { AppStatus } from '../../../shared/types'

interface StatusIndicatorProps {
  status: AppStatus
  errorMsg?: string | null
}

export function StatusIndicator({ status, errorMsg }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'initializing':
        return { text: 'Inisialisasi...', color: 'status-gray', icon: '⏳' }
      case 'idle':
        return { text: 'Siap', color: 'status-green', icon: '✨' }
      case 'listening':
        return { text: 'Mendengarkan...', color: 'status-blue pulse', icon: '🎙️' }
      case 'processing':
        return { text: 'Memikirkan...', color: 'status-purple', icon: '🤔' }
      case 'speaking':
        return { text: 'Berbicara', color: 'status-pink', icon: '💬' }
      case 'error':
        return { text: errorMsg || 'Terjadi kesalahan', color: 'status-red', icon: '⚠️' }
      case 'reading_project':
        return { text: 'Membaca Project...', color: 'status-blue', icon: '📁' }
      case 'planning':
        return { text: 'Menyusun Plan...', color: 'status-purple', icon: '🧠' }
      case 'clarifying':
        return { text: 'Klarifikasi...', color: 'status-pink pulse', icon: '❓' }
      case 'confirming':
        return { text: 'Menunggu Konfirmasi', color: 'status-yellow pulse', icon: '⚠️' }
      case 'executing':
        return { text: 'Mengeksekusi...', color: 'status-red', icon: '⚡' }
      default:
        return { text: '', color: '', icon: '' }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`status-indicator ${config.color}`}>
      <span className="status-icon">{config.icon}</span>
      <span className="status-text">{config.text}</span>
    </div>
  )
}
