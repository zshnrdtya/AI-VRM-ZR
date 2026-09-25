import React from 'react'
import LOGO_URL from '../assets/logo-zeera.jpeg'

interface SplashScreenProps {
  show: boolean
  isFadingOut: boolean
  isMobile: boolean
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ show, isFadingOut, isMobile }) => {
  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-main, #0b1120)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: isFadingOut ? 'none' : 'auto'
      }}
    >
      <div style={{ animation: 'pulse 1.5s infinite', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={LOGO_URL}
          alt="Zeera Logo"
          style={{
            width: isMobile ? '64px' : '76px',
            height: isMobile ? '64px' : '76px',
            borderRadius: '20px',
            marginBottom: '18px',
            objectFit: 'cover',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
            border: '1px solid var(--border-color)'
          }}
        />
        <h1
          style={{
            fontSize: isMobile ? '36px' : '48px',
            fontWeight: 'bold',
            color: '#3b82f6',
            margin: 0,
            letterSpacing: '2px',
            textAlign: 'center'
          }}
        >
          ZEERA AI
        </h1>
      </div>
      <p
        style={{
          color: 'var(--text-secondary, #94a3b8)',
          marginTop: '15px',
          fontSize: isMobile ? '13px' : '14px',
          letterSpacing: '1px',
          textAlign: 'center'
        }}
      >
        Developed by Raditya Rai Zeeshan
      </p>
      <p
        style={{
          color: 'var(--text-secondary, #94a3b8)',
          marginTop: '5px',
          fontSize: isMobile ? '11px' : '12px',
          letterSpacing: '0.5px',
          textAlign: 'center',
          opacity: 0.8
        }}
      >
        A Z - Project
      </p>
    </div>
  )
}
