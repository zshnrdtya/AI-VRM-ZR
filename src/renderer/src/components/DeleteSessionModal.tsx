import React from 'react'

interface DeleteSessionModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const DeleteSessionModal: React.FC<DeleteSessionModalProps> = ({
  isOpen,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '350px',
          boxShadow: 'var(--card-shadow, 0 10px 25px rgba(0,0,0,0.2))',
          textAlign: 'center'
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '18px' }}>
          Konfirmasi Hapus
        </h3>
        <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
          Yakin chat sama zeera mau di hapus?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
