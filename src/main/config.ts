// ============================================================
// Config Manager — JSON persistence for app settings
// Implements CFG-1 (secure config) + AppSettings/AvatarConfig
// ============================================================

import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { AppConfig, WindowPosition } from '../shared/types'

const CONFIG_FILE = join(app.getPath('userData'), 'config.json')

const DEFAULT_CONFIG: AppConfig = {
  avatarVisible: true,
  vrmModelPath: ''
}

let currentConfig: AppConfig = { ...DEFAULT_CONFIG }

export async function loadConfig(): Promise<AppConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8')
    currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(data) }
  } catch {
    currentConfig = { ...DEFAULT_CONFIG }
  }
  return currentConfig
}

export async function saveConfig(config: Partial<AppConfig>): Promise<void> {
  currentConfig = { ...currentConfig, ...config }
  await fs.writeFile(CONFIG_FILE, JSON.stringify(currentConfig, null, 2), 'utf-8')
}

export function getConfig(): AppConfig {
  return { ...currentConfig }
}

export async function saveWindowPosition(pos: WindowPosition): Promise<void> {
  await saveConfig({ windowPosition: pos })
}

export function getWindowPosition(): WindowPosition | undefined {
  return currentConfig.windowPosition
}
