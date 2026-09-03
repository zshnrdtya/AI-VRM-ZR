/// <reference types="vite/client" />

import { ElectronAPI } from '../preload/index'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

declare module '*.vrm' {
  const content: string
  export default content
}

declare module '*.vrm?url' {
  const content: string
  export default content
}
