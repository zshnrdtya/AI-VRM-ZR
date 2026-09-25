import React from 'react'
import { Menu, ExternalLink } from 'lucide-react'
import { styles } from '../styles/appStyles'
import { BrandPhilosophyCard } from './about/BrandPhilosophyCard'
import { GuideCards } from './about/GuideCards'

interface AboutTabProps {
  isMobile: boolean
  onOpenSidebar: () => void
  activeTab: string
}

export const AboutTab: React.FC<AboutTabProps> = ({
  isMobile,
  onOpenSidebar,
  activeTab
}) => {
  return (
    <div
      style={{
        ...styles.tabView,
        display: activeTab === 'about' ? 'flex' : 'none'
      }}
    >
      {/* Header */}
      <header
        style={{
          ...styles.header,
          paddingTop: isMobile ? 'max(6px, env(safe-area-inset-top, 0px))' : '0',
          paddingLeft: isMobile ? '14px' : '28px',
          paddingRight: isMobile ? '14px' : '28px',
          height: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px',
          minHeight: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : '64px'
        }}
      >
        <div style={styles.headerLeft}>
          {isMobile && (
            <button
              onClick={onOpenSidebar}
              style={styles.hamburgerBtn}
              title="Buka Menu"
              aria-label="Buka Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <h1
            style={{
              ...styles.brandTitle,
              fontSize: isMobile ? '15px' : '17px'
            }}
          >
            {isMobile ? 'Filosofi & Panduan' : 'Filosofi Logo & Panduan Zeera'}
          </h1>
        </div>
        <div style={styles.headerRight}>
          <a
            href="https://radityarz.my.id"
            target="_blank"
            rel="noreferrer"
            style={{
              ...styles.headerPortoBtn,
              fontSize: isMobile ? '12px' : '13px',
              padding: isMobile ? '5px 10px' : '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>{isMobile ? 'Porto' : 'radityarz.my.id'}</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </header>

      {/* Scrollable About & Guide Content */}
      <div
        style={{
          ...styles.aboutScrollArea,
          paddingTop: isMobile ? '16px' : '28px',
          paddingLeft: isMobile ? '14px' : '36px',
          paddingRight: isMobile ? '14px' : '36px',
          paddingBottom: isMobile ? 'max(40px, calc(20px + env(safe-area-inset-bottom, 0px)))' : '36px'
        }}
      >
        <div style={styles.aboutContainer}>
          <BrandPhilosophyCard isMobile={isMobile} />
          <GuideCards isMobile={isMobile} />
        </div>
      </div>
    </div>
  )
}
