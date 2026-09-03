// ============================================================
// Electron Main Process — Entry Point
// Implements DESK-1 to DESK-6: Window behavior
// Implements CFG-1, CFG-2, CFG-3: Security & configuration
// ============================================================

import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupIpcHandlers } from './ipc-handlers'
import { createTray, destroyTray } from './tray'
import { AIServiceManager } from './services/AIServiceManager'
import { loadConfig, getWindowPosition, saveWindowPosition } from './config'

// Load environment variables
import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: join(app.getAppPath(), '.env') })
if (!process.env.GEMINI_API_KEY) {
  dotenvConfig({ path: join(process.cwd(), '.env') })
}

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  // Get saved position or default to bottom-right corner
  const savedPos = getWindowPosition()
  const windowWidth = 450 // Wider to prevent hand clipping
  const windowHeight = 600 // Half-body height
  const defaultX = screenWidth - windowWidth - 20
  const defaultY = screenHeight - windowHeight - 20

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: savedPos?.x ?? defaultX,
    y: savedPos?.y ?? defaultY,

    // DESK-1: Transparent background
    transparent: true,
    // DESK-2: Frameless window
    frame: false,
    // DESK-3: Always on top
    alwaysOnTop: true,

    // Additional window behavior
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',

    // CFG-2: Context isolation + preload script
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // Needed for preload script
    }
  })

  // DESK-3: Ensure always on top with highest level
  mainWindow.setAlwaysOnTop(true, 'floating')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open devtools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Constrain window to screen bounds
  mainWindow.on('moved', () => {
    if (!mainWindow) return
    const bounds = mainWindow.getBounds()
    const display = screen.getDisplayMatching(bounds)
    const workArea = display.workArea

    let { x, y, width, height } = bounds
    let clamped = false

    if (x < workArea.x) { x = workArea.x; clamped = true }
    if (y < workArea.y) { y = workArea.y; clamped = true }
    if (x + width > workArea.x + workArea.width) { x = workArea.x + workArea.width - width; clamped = true }
    if (y + height > workArea.y + workArea.height) { y = workArea.y + workArea.height - height; clamped = true }

    if (clamped) {
      mainWindow.setBounds({ x, y, width, height })
    }

    // Save the new clamped position
    saveWindowPosition({ x, y }).catch(console.error)
  })

  return mainWindow
}

// Initialize the application
app.whenReady().then(async () => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.ai-vtuber.desktop-assistant')

  // Load configuration
  await loadConfig()

  // Initialize AI Service Manager
  const aiService = new AIServiceManager({
    sttProvider: process.env.GEMINI_API_KEY ? 'gemini' : (process.env.GROQ_API_KEY ? 'groq' : 'mock'),
    llmProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'mock',
    ttsProvider: 'edge-tts', // Free natural neural voices
    groqApiKey: process.env.GROQ_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID
  })

  // Create the main window
  const win = createWindow()

  // Setup IPC handlers
  setupIpcHandlers(win, aiService)

  // Create system tray
  createTray(win)

  // Optimize window shortcuts
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  destroyTray()
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
