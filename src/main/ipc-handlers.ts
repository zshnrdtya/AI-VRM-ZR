// ============================================================
// IPC Handlers — Secure communication between Main and Renderer
// Implements CFG-2: Context isolation + preload script
// ============================================================

import { ipcMain, BrowserWindow, dialog } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import { AIServiceManager } from './services/AIServiceManager'
import { saveWindowPosition, getConfig, saveConfig } from './config'

export function setupIpcHandlers(mainWindow: BrowserWindow, aiService: AIServiceManager): void {
  // ---- Window Management (DESK-1 to DESK-6, APPC-1 to APPC-3) ----

  ipcMain.on(IPC_CHANNELS.WINDOW_HIDE, () => {
    mainWindow.hide()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_SHOW, () => {
    mainWindow.show()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow.close()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MOVE, (_event, { x, y }: { x: number; y: number }) => {
    mainWindow.setPosition(x, y)
    saveWindowPosition({ x, y })
  })

  ipcMain.on(
    IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE,
    (_event, ignore: boolean, options?: { forward: boolean }) => {
      mainWindow.setIgnoreMouseEvents(ignore, options)
    }
  )

  // ---- AI Pipeline (VOIC-2, AI-1, TTS-1) ----

  ipcMain.handle(
    IPC_CHANNELS.AI_TRANSCRIBE,
    async (_event, audioData: ArrayBuffer): Promise<string> => {
      try {
        const buffer = Buffer.from(audioData)
        return await aiService.transcribe(buffer)
      } catch (error) {
        console.error('[IPC] Transcription error:', error)
        throw error
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AI_CHAT,
    async (_event, text: string): Promise<{ text: string; emotion: string }> => {
      try {
        return await aiService.chat(text)
      } catch (error) {
        console.error('[IPC] Chat error:', error)
        throw error
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AI_SPEAK,
    async (_event, text: string): Promise<ArrayBuffer> => {
      try {
        const buffer = await aiService.speak(text)
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
      } catch (error) {
        console.error('[IPC] TTS error:', error)
        throw error
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AI_PIPELINE,
    async (
      _event,
      audioData: ArrayBuffer
    ): Promise<{
      transcription: string
      response: { text: string; emotion: string }
      audioBuffer: ArrayBuffer
    }> => {
      try {
        const buffer = Buffer.from(audioData)
        const result = await aiService.pipeline(buffer)
        return {
          transcription: result.transcription,
          response: result.response,
          audioBuffer: result.audioBuffer.buffer.slice(
            result.audioBuffer.byteOffset,
            result.audioBuffer.byteOffset + result.audioBuffer.byteLength
          ) as ArrayBuffer
        }
      } catch (error) {
        console.error('[IPC] Pipeline error:', error)
        throw error
      }
    }
  )

  // ---- Config ----

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    return getConfig()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (_event, config: Record<string, unknown>) => {
    await saveConfig(config)
    return getConfig()
  })

  // ---- Agent Mode ----

  ipcMain.handle(IPC_CHANNELS.AGENT_PICK_FOLDER, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Pilih Folder Project',
      properties: ['openDirectory']
    })
    
    if (canceled || filePaths.length === 0) {
      return null
    }
    
    return filePaths[0]
  })

  ipcMain.handle(IPC_CHANNELS.AGENT_ACTIVATE, async (_event, folderPath: string) => {
    return await aiService.activateAgent(folderPath, (state, msg) => {
      mainWindow.webContents.send('agent:state', { state, msg })
    })
  })
}
