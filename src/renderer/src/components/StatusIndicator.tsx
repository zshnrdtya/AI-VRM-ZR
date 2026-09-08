import React from 'react'
import { AppStatus } from '../../../shared/types'
import {
  Loader2,
  Sparkles,
  Mic,
  Brain,
  MessageSquare,
  AlertTriangle,
  Folder,
  HelpCircle,
  Zap
} from 'lucide-react'

interface StatusIndicatorProps {
  status: AppStatus
  errorMsg?: string | null
}

export function StatusIndicator({ status, errorMsg }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'initializing':
        return { text: 'Inisialisasi...', color: 'status-gray', icon: <Loader2 size={16} className="animate-spin" /> }
      case 'idle':
        return { text: 'Siap', color: 'status-green', icon: <Sparkles size={16} /> }
      case 'listening':
        return { text: 'Mendengarkan...', color: 'status-blue pulse', icon: <Mic size={16} /> }
      case 'processing':
        return { text: 'Memikirkan...', color: 'status-purple', icon: <Brain size={16} /> }
      case 'speaking':
        return { text: 'Berbicara', color: 'status-pink', icon: <MessageSquare size={16} /> }
      case 'error':
        return { text: errorMsg || 'Terjadi kesalahan', color: 'status-red', icon: <AlertTriangle size={16} /> }
      case 'reading_project':
        return { text: 'Membaca Project...', color: 'status-blue', icon: <Folder size={16} /> }
      case 'planning':
        return { text: 'Menyusun Plan...', color: 'status-purple', icon: <Brain size={16} /> }
      case 'clarifying':
        return { text: 'Klarifikasi...', color: 'status-pink pulse', icon: <HelpCircle size={16} /> }
      case 'confirming':
        return { text: 'Menunggu Konfirmasi', color: 'status-yellow pulse', icon: <AlertTriangle size={16} /> }
      case 'executing':
        return { text: 'Mengeksekusi...', color: 'status-red', icon: <Zap size={16} /> }
      default:
        return { text: '', color: '', icon: null }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`status-indicator ${config.color}`}>
      {config.icon && <span className="status-icon">{config.icon}</span>}
      <span className="status-text">{config.text}</span>
    </div>
  )
}
