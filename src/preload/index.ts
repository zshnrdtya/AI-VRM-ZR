// ============================================================
// Preload Script — Secure IPC Bridge
// Implements CFG-2: Context isolation + limited preload
// Only exposes whitelisted IPC channels to renderer
// ============================================================

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'

/** API exposed to the renderer process via contextBridge */
const electronAPI = {
  // ---- Window Management ----
  hideWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_HIDE),
  showWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_SHOW),
  closeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  minimizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  moveWindow: (x: number, y: number) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_MOVE, { x, y }),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE, ignore, options),

  // ---- AI Pipeline ----
  transcribe: (audioData: ArrayBuffer): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_TRANSCRIBE, audioData),

  chat: (text: string): Promise<{ text: string; emotion: string; gesture?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_CHAT, text),

  speak: (text: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_SPEAK, text),

  pipeline: (
    audioData: ArrayBuffer
  ): Promise<{
    transcription: string
    response: { text: string; emotion: string; gesture?: string }
    audioBuffer: ArrayBuffer
  }> => ipcRenderer.invoke(IPC_CHANNELS.AI_PIPELINE, audioData),

  // ---- Config ----
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
  setConfig: (config: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),

  // ---- Agent Mode ----
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.AGENT_PICK_FOLDER),
  activateAgent: (folderPath: string): Promise<string[]> => 
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_ACTIVATE, folderPath),
  onAgentState: (callback: (state: string, msg?: string) => void) => {
    ipcRenderer.on('agent:state', (_event, data) => callback(data.state, data.msg))
  }
}

// Expose the API to the renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for renderer
export type ElectronAPI = typeof electronAPI
