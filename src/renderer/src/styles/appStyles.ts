import React from 'react'

export // Styling adaptif berbasis CSS Variables (Dark & Light Mode)
const styles: { [key: string]: React.CSSProperties } = {
  appRoot: {
    display: 'flex',
    flexDirection: 'row',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'hidden',
    userSelect: 'none',
    touchAction: 'manipulation',
    transition: 'background-color 0.25s ease, color 0.25s ease'
  },

  // MOBILE BACKDROP
  mobileBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 45
  },

  // SIDEBAR STYLES
  sidebar: {
    width: '260px',
    minWidth: '260px',
    height: '100%',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 30,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)'
  },
  sidebarLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
  },
  sidebarBrandTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: 'var(--text-primary)'
  },
  sidebarBrandSubtitle: {
    fontSize: '11px',
    color: 'var(--accent-blue-text)',
    fontWeight: 500
  },
  sidebarCloseBtn: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: 'var(--card-shadow)'
  },
  themeToggleBtn: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  themeToggleCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 14px',
    marginBottom: '12px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: 'var(--card-shadow)',
    minHeight: '42px'
  },
  themeToggleText: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  themeBadge: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: 'var(--accent-blue-subtle)',
    color: 'var(--accent-blue-text)'
  },
  navMenu: {
    padding: '16px 14px 8px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 14px',
    backgroundColor: 'var(--bg-nav-item)',
    border: '1px solid transparent',
    borderRadius: '12px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  navItemActive: {
    backgroundColor: 'var(--bg-nav-item-active)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--card-shadow)'
  },
  navIcon: {
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  navTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  navDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)'
  },

  // RIWAYAT CHAT SIDEBAR STYLES
  historySection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '8px 14px',
    borderTop: '1px solid var(--border-color)'
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 2px 8px 2px'
  },
  historyTitle: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase'
  },
  newChatMiniBtn: {
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    color: 'var(--accent-blue-text)',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  historyList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingRight: '2px'
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  },
  historyItemActive: {
    backgroundColor: 'var(--bg-nav-item-active)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)'
  },
  historyItemIcon: {
    fontSize: '13px',
    flexShrink: 0
  },
  historyItemText: {
    flex: 1,
    fontSize: '12.5px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  historyActionBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  historyDeleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  historyEmpty: {
    fontSize: '11.5px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    padding: '16px 0',
    fontStyle: 'italic'
  },

  sidebarFooter: {
    padding: '16px 14px',
    borderTop: '1px solid var(--border-color)'
  },
  creatorCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 14px',
    transition: 'all 0.25s ease',
    boxShadow: 'var(--card-shadow)'
  },
  creatorHeader: {
    marginBottom: '4px'
  },
  creatorTag: {
    fontSize: '9px',
    fontWeight: 700,
    color: 'var(--accent-blue-text)',
    backgroundColor: 'var(--accent-blue-subtle)',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.6px'
  },
  creatorName: {
    margin: '4px 0 2px 0',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  creatorRole: {
    margin: '0 0 10px 0',
    fontSize: '11px',
    color: 'var(--text-secondary)'
  },
  portfolioButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    padding: '7px 10px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'background-color 0.2s ease'
  },

  // CONTENT AREA STYLES
  contentArea: {
    flex: 1,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-main)',
    backgroundImage: 'var(--bg-gradient)',
    transition: 'background-color 0.25s ease'
  },
  tabView: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    position: 'relative'
  },

  // HEADER STYLES
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-header)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-color)',
    zIndex: 20,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0
  },
  hamburgerBtn: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '18px',
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  brandTitle: {
    margin: 0,
    fontWeight: 700,
    letterSpacing: '0.3px',
    color: 'var(--text-primary)'
  },
  headerBadge: {
    fontSize: '11px',
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    color: 'var(--accent-blue-text)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600,
    boxShadow: 'var(--card-shadow)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    boxShadow: 'var(--card-shadow)'
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease'
  },
  statusText: {
    fontWeight: 500,
    color: 'var(--text-secondary)'
  },
  headerPortoBtn: {
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    color: 'var(--accent-blue-text)',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },

  // 3D MAIN STAGE
  mainArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  canvasContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayChatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    pointerEvents: 'none',
    zIndex: 10,
    boxSizing: 'border-box'
  },
  bubbleWrapper: {
    display: 'flex',
    flex: 1,
    pointerEvents: 'none'
  },
  leftUserBubble: {
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: '16px 16px 4px 16px',
    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
    pointerEvents: 'auto',
    wordBreak: 'break-word',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  rightAiBubble: {
    backgroundColor: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '14px 20px',
    borderRadius: '16px 16px 16px 4px',
    boxShadow: 'var(--card-shadow)',
    pointerEvents: 'auto',
    wordBreak: 'break-word',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  bubbleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    marginBottom: '6px'
  },
  userBubbleAuthor: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#dbeafe',
    letterSpacing: '0.2px'
  },
  userBubbleTime: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: '0.2px'
  },
  aiBubbleAuthor: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--accent-blue-text)',
    letterSpacing: '0.2px'
  },
  aiBubbleTime: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    letterSpacing: '0.2px'
  },
  bubbleText: {
    margin: 0,
    fontSize: '13.5px',
    lineHeight: '1.55',
    color: 'inherit',
    whiteSpace: 'pre-wrap'
  },
  errorBanner: {
    position: 'absolute',
    top: '70px',
    zIndex: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#fca5a5',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '12px'
  },

  // FOOTER CONTROL BAR
  footerBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'var(--bg-footer)',
    backdropFilter: 'blur(18px)',
    borderTop: '1px solid var(--border-color)',
    zIndex: 20,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  statusHint: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textAlign: 'center'
  },
  inputCard: {
    width: '100%',
    maxWidth: '780px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.25s ease'
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    minWidth: 0
  },
  micButton: {
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  sendButton: {
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 600,
    flexShrink: 0,
    transition: 'all 0.2s ease'
  },

  // ABOUT & GUIDE TAB STYLES
  aboutScrollArea: {
    flex: 1,
    overflowY: 'auto'
  },
  aboutContainer: {
    maxWidth: '860px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  aboutCard: {
    backgroundColor: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.25s ease'
  },
  aboutCardBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    color: 'var(--accent-blue-text)',
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    padding: '3px 8px',
    borderRadius: '6px',
    marginBottom: '8px'
  },
  aboutCardTitle: {
    margin: '0 0 10px 0',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  aboutCardLead: {
    lineHeight: '1.6',
    color: 'var(--text-lead)',
    margin: '0 0 16px 0'
  },
  aboutPortoBox: {
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px 18px',
    boxShadow: 'var(--card-shadow)'
  },
  bigPortoButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  guideGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '14px'
  },
  guideItem: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px 16px',
    transition: 'all 0.25s ease',
    boxShadow: 'var(--card-shadow)'
  },
  guideIcon: {
    fontSize: '22px',
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  guideContent: {
    flex: 1
  },
  guideHeading: {
    margin: '0 0 4px 0',
    fontSize: '14.5px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  guideText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.55',
    color: 'var(--text-secondary)'
  },
  techBadgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px'
  },
  techBadge: {
    backgroundColor: 'var(--bg-badge)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-badge)',
    fontSize: '12px',
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: '6px'
  },
  watermarkContainer: {
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto'
  },
  watermarkLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    letterSpacing: '0.3px',
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  }
}
