// ============================================================
// System Tray — Context menu for hide/show, minimize, close
// Implements APPC-1, APPC-2, APPC-3
// ============================================================

import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): Tray {
  // Create a simple tray icon (16x16 colored square)
  const icon = nativeImage.createEmpty()

  tray = new Tray(
    nativeImage.createFromBuffer(createTrayIconBuffer(), { width: 16, height: 16 })
  )

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Tampilkan Avatar',
      click: () => {
        mainWindow.show()
        mainWindow.setAlwaysOnTop(true, 'floating')
      }
    },
    {
      label: 'Sembunyikan Avatar',
      click: () => {
        mainWindow.hide()
      }
    },
    { type: 'separator' },
    {
      label: 'Minimize',
      click: () => {
        mainWindow.minimize()
      }
    },
    { type: 'separator' },
    {
      label: 'Keluar',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Zeera - AI Desktop Assistant')
  tray.setContextMenu(contextMenu)

  // Double-click to toggle visibility
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.setAlwaysOnTop(true, 'floating')
    }
  })

  return tray
}

function createTrayIconBuffer(): Buffer {
  // Create a simple 16x16 RGBA icon (pink/magenta color for VTuber theme)
  const size = 16
  const channels = 4 // RGBA
  const buffer = Buffer.alloc(size * size * channels)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * channels
      // Create a rounded square with gradient
      const cx = x - size / 2 + 0.5
      const cy = y - size / 2 + 0.5
      const dist = Math.sqrt(cx * cx + cy * cy)

      if (dist < size / 2 - 1) {
        buffer[idx] = 230 // R
        buffer[idx + 1] = 100 // G
        buffer[idx + 2] = 200 // B
        buffer[idx + 3] = 255 // A
      } else if (dist < size / 2) {
        buffer[idx] = 180 // R
        buffer[idx + 1] = 70 // G
        buffer[idx + 2] = 160 // B
        buffer[idx + 3] = 200 // A
      } else {
        buffer[idx + 3] = 0 // Transparent
      }
    }
  }

  return buffer
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
