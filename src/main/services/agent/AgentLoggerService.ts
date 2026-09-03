import fs from 'fs/promises'
import path from 'path'

export interface AgentAction {
  type: 'read' | 'write' | 'scan' | 'git' | 'plan' | 'error'
  target?: string
  details?: string
  timestamp: string
}

export class AgentLoggerService {
  private logFile: string
  private sessionLogs: AgentAction[] = []

  constructor(appDataPath: string) {
    // Store logs in the app's user data directory
    const logDir = path.join(appDataPath, 'logs')
    this.logFile = path.join(logDir, 'agent-actions.log')
    
    // Ensure log directory exists asynchronously
    fs.mkdir(logDir, { recursive: true }).catch(console.error)
  }

  /**
   * Log an action to memory and file
   */
  async log(action: Omit<AgentAction, 'timestamp'>): Promise<void> {
    const fullAction: AgentAction = {
      ...action,
      timestamp: new Date().toISOString()
    }
    
    this.sessionLogs.push(fullAction)
    
    const logLine = `[${fullAction.timestamp}] [${fullAction.type}] ${fullAction.target ? `target=${fullAction.target} ` : ''}${fullAction.details || ''}\n`
    
    try {
      await fs.appendFile(this.logFile, logLine, 'utf-8')
      console.log(`[AgentLogger] ${logLine.trim()}`)
    } catch (error) {
      console.error('[AgentLogger] Failed to write to log file:', error)
    }
  }

  /**
   * Get logs for current session
   */
  getSessionLogs(): AgentAction[] {
    return this.sessionLogs
  }

  /**
   * Clear session logs
   */
  clearSession(): void {
    this.sessionLogs = []
  }
}
