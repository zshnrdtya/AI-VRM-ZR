import React, { useMemo } from 'react'
import { chatStyles } from '../../styles/chatStyles'

export interface MarkdownProps {
  children?: React.ReactNode
  className?: string
  href?: string
}

export function useMarkdownComponents(isMobile: boolean) {
  return useMemo(
    () => ({
      p: ({ children }: MarkdownProps) => (
        <p
          style={{
            ...chatStyles.messageText,
            fontSize: isMobile ? '14px' : '14.5px',
            lineHeight: isMobile ? '1.55' : '1.65',
            color: 'var(--text-lead)',
            margin: '0 0 8px 0'
          }}
        >
          {children}
        </p>
      ),
      strong: ({ children }: MarkdownProps) => (
        <strong style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{children}</strong>
      ),
      em: ({ children }: MarkdownProps) => (
        <em style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{children}</em>
      ),
      ul: ({ children }: MarkdownProps) => (
        <ul
          style={{
            margin: '4px 0 8px 0',
            paddingLeft: '20px',
            listStyleType: 'disc',
            color: 'var(--text-lead)'
          }}
        >
          {children}
        </ul>
      ),
      ol: ({ children }: MarkdownProps) => (
        <ol
          style={{
            margin: '4px 0 8px 0',
            paddingLeft: '20px',
            listStyleType: 'decimal',
            color: 'var(--text-lead)'
          }}
        >
          {children}
        </ol>
      ),
      li: ({ children }: MarkdownProps) => (
        <li
          style={{
            margin: '3px 0',
            fontSize: isMobile ? '14px' : '14.5px',
            lineHeight: isMobile ? '1.5' : '1.6',
            color: 'var(--text-lead)'
          }}
        >
          {children}
        </li>
      ),
      code: ({ children, className }: MarkdownProps) => {
        const isCodeBlock = Boolean(className)
        if (isCodeBlock) {
          return (
            <code
              style={{
                fontFamily: 'Consolas, Menlo, Monaco, monospace',
                fontSize: '13px',
                color: 'var(--text-lead)'
              }}
            >
              {children}
            </code>
          )
        }
        return (
          <code
            style={{
              backgroundColor: 'var(--bg-badge)',
              padding: '2px 5px',
              borderRadius: '4px',
              fontSize: '0.9em',
              fontFamily: 'Consolas, Menlo, Monaco, monospace',
              color: 'var(--accent-blue-text)',
              wordBreak: 'break-word'
            }}
          >
            {children}
          </code>
        )
      },
      pre: ({ children }: MarkdownProps) => (
        <pre
          style={{
            backgroundColor: 'var(--bg-card-solid)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 14px',
            overflowX: 'auto',
            margin: '8px 0',
            fontSize: '13px'
          }}
        >
          {children}
        </pre>
      ),
      a: ({ href, children }: MarkdownProps) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent-blue-text)',
            textDecoration: 'underline',
            wordBreak: 'break-all'
          }}
        >
          {children}
        </a>
      ),
      blockquote: ({ children }: MarkdownProps) => (
        <blockquote
          style={{
            borderLeft: '3px solid var(--accent-blue)',
            paddingLeft: '12px',
            margin: '8px 0',
            color: 'var(--text-lead)',
            fontStyle: 'italic',
            backgroundColor: 'var(--accent-blue-subtle)',
            paddingTop: '4px',
            paddingBottom: '4px',
            borderRadius: '0 6px 6px 0'
          }}
        >
          {children}
        </blockquote>
      ),
      h1: ({ children }: MarkdownProps) => (
        <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>
          {children}
        </h1>
      ),
      h2: ({ children }: MarkdownProps) => (
        <h2 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, margin: '6px 0 4px 0', color: 'var(--text-primary)' }}>
          {children}
        </h2>
      ),
      h3: ({ children }: MarkdownProps) => (
        <h3 style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 600, margin: '6px 0 3px 0', color: 'var(--text-primary)' }}>
          {children}
        </h3>
      ),
      table: ({ children }: MarkdownProps) => (
        <div style={{ width: '100%', overflowX: 'auto', margin: '10px 0', WebkitOverflowScrolling: 'touch' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: isMobile ? '13px' : '14px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {children}
          </table>
        </div>
      ),
      thead: ({ children }: MarkdownProps) => (
        <thead style={{ backgroundColor: 'var(--hover-bg, rgba(0,0,0,0.06))' }}>
          {children}
        </thead>
      ),
      tbody: ({ children }: MarkdownProps) => (
        <tbody>{children}</tbody>
      ),
      tr: ({ children }: MarkdownProps) => (
        <tr
          style={{
            borderBottom: '1px solid var(--border-color)',
            transition: 'background-color 0.15s ease'
          }}
        >
          {children}
        </tr>
      ),
      th: ({ children }: MarkdownProps) => (
        <th
          style={{
            border: '1px solid var(--border-color)',
            padding: '8px 12px',
            textAlign: 'left',
            fontWeight: 650,
            color: 'var(--text-primary)',
            backgroundColor: 'var(--hover-bg, rgba(0,0,0,0.08))'
          }}
        >
          {children}
        </th>
      ),
      td: ({ children }: MarkdownProps) => (
        <td
          style={{
            border: '1px solid var(--border-color)',
            padding: '8px 12px',
            textAlign: 'left',
            color: 'var(--text-secondary)'
          }}
        >
          {children}
        </td>
      )
    }),
    [isMobile]
  )
}
