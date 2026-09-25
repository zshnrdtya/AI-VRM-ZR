import React from 'react'

export const chatStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--bg-main)',
    backgroundImage: 'var(--bg-gradient)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background-color 0.25s ease'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-header)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-color)',
    zIndex: 10,
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    margin: 0,
    fontWeight: 700,
    letterSpacing: '0.3px',
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--accent-blue-text)',
    fontWeight: 500
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
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
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  },
  newChatBtn: {
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--accent-blue)',
    color: 'var(--accent-blue-text)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    boxShadow: 'var(--card-shadow)'
  },
  clearBtn: {
    backgroundColor: 'var(--btn-secondary-bg)',
    border: '1px solid var(--btn-secondary-border)',
    color: 'var(--btn-secondary-text)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 500,
    boxShadow: 'var(--card-shadow)'
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column'
  },
  messagesList: {
    maxWidth: '850px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  dateDividerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '20px 0',
    width: '100%',
    userSelect: 'none'
  },
  dateDividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border-color, #334155)'
  },
  dateDividerText: {
    margin: '0 15px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary, #94a3b8)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%'
  },
  avatarIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    objectFit: 'contain',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    flexShrink: 0,
    boxShadow: 'var(--card-shadow)'
  },
  bubble: {
    padding: '12px 18px',
    borderRadius: '16px',
    lineHeight: '1.6',
    boxShadow: 'var(--card-shadow)',
    userSelect: 'text',
    WebkitUserSelect: 'text'
  },
  userBubble: {
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    borderBottomRightRadius: '4px'
  },
  assistantBubble: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(12px)',
    borderBottomLeftRadius: '4px',
    boxShadow: 'var(--card-shadow)'
  },
  messageText: {
    margin: 0,
    fontSize: '14.5px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    cursor: 'text'
  },
  markdownContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    cursor: 'text'
  },
  timestamp: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginTop: '6px',
    textAlign: 'right',
    userSelect: 'none',
    letterSpacing: '0.2px'
  },
  bubbleFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '6px',
    paddingTop: '4px',
    borderTop: '1px solid var(--border-color)',
    gap: '8px'
  },
  copyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'var(--bg-badge)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  },
  typingText: {
    fontSize: '13px',
    color: 'var(--accent-blue-text)',
    fontStyle: 'italic'
  },
  footer: {
    backgroundColor: 'var(--bg-footer)',
    backdropFilter: 'blur(18px)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '12px',
    transition: 'background-color 0.25s ease, border-color 0.25s ease'
  },
  inputCard: {
    maxWidth: '850px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '8px 12px',
    gap: '10px',
    boxShadow: 'var(--card-shadow)',
    transition: 'all 0.25s ease'
  },
  textarea: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
    padding: '8px 6px',
    minHeight: '38px',
    maxHeight: '120px',
    overflowY: 'auto',
    lineHeight: '1.5'
  },
  sendBtn: {
    backgroundColor: 'var(--accent-blue)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    margin: 'auto',
    padding: '24px 16px',
    maxWidth: '460px'
  },
  emptyIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    backgroundColor: 'var(--accent-blue-subtle)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: 'var(--card-shadow)'
  },
  emptyLogo: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    objectFit: 'cover'
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  emptyDesc: {
    margin: '0 0 18px 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  suggestionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%'
  },
  suggestionChip: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--card-shadow)'
  }
}
