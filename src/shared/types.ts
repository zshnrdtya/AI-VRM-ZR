// ============================================================
// Shared types between Main and Renderer processes
// ============================================================

/** Application status states */
export type AppStatus = 'initializing' | 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 
  'reading_project' | 'planning' | 'clarifying' | 'confirming' | 'executing'

/** Emotion types supported by the avatar */
export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'relaxed'

/** Chat message structure */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  text: string
  emotion?: Emotion
  createdAt: number
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}

/** AI response from LLM */
export interface AIResponse {
  text: string
  emotion: Emotion
  gesture?: 'nod' | 'wave' | 'thinking' | 'happy' | 'surprised' | 'pointing' | 'none'
  toolCalls?: ToolCall[]
}

/** A Tool Call requested by the LLM */
export interface ToolCall {
  id: string
  name: string
  args: Record<string, any>
}

/** Result of a Tool Call to send back to the LLM */
export interface ToolResult {
  id: string
  result: any
}

/** Conversation session */
export interface Conversation {
  id: string
  startedAt: number
  messages: ChatMessage[]
}

/** Window position config */
export interface WindowPosition {
  x: number
  y: number
}

/** App configuration */
export interface AppConfig {
  windowPosition?: WindowPosition
  avatarVisible: boolean
  vrmModelPath: string
  lastProjectFolder?: string
}

/** IPC channel names — single source of truth */
export const IPC_CHANNELS = {
  // Window management
  WINDOW_MOVE: 'window:move',
  WINDOW_HIDE: 'window:hide',
  WINDOW_SHOW: 'window:show',
  WINDOW_CLOSE: 'window:close',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_SET_IGNORE_MOUSE: 'window:set-ignore-mouse',

  // AI pipeline
  AI_TRANSCRIBE: 'ai:transcribe',
  AI_CHAT: 'ai:chat',
  AI_SPEAK: 'ai:speak',
  AI_PIPELINE: 'ai:pipeline',

  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // Agent Mode
  AGENT_PICK_FOLDER: 'agent:pick-folder',
  AGENT_ACTIVATE: 'agent:activate'
} as const
