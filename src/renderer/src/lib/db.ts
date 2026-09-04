import Dexie, { type Table } from 'dexie'

export interface SessionItem {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface MessageItem {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
  createdAt?: number
}

export class ZeeraDatabase extends Dexie {
  sessions!: Table<SessionItem, string>
  messages!: Table<MessageItem, string>

  constructor() {
    super('ZeeraDatabase')
    this.version(1).stores({
      sessions: 'id, title, createdAt, updatedAt',
      messages: 'id, sessionId, role, text, timestamp'
    })
  }
}

export const db = new ZeeraDatabase()
