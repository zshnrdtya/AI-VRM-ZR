import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

function edgeTTSPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'vite-plugin-edge-tts',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req: any, res: any) => {
        try {
          const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
          const text = url.searchParams.get('text') || ''
          const voice = url.searchParams.get('voice') || env.VOICE_NAME || 'id-ID-GadisNeural'
          const pitch = url.searchParams.get('pitch') || env.VOICE_PITCH || '+22%'
          const rate = url.searchParams.get('rate') || env.VOICE_RATE || '+8%'

          if (!text.trim()) {
            res.statusCode = 400
            res.end('Missing text')
            return
          }

          const tts = new MsEdgeTTS()
          await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
          const readable = tts.toStream(text, { pitch, rate })

          res.setHeader('Content-Type', 'audio/mpeg')
          res.setHeader('Cache-Control', 'no-cache')
          readable.audioStream.pipe(res)
        } catch (err: any) {
          console.error('[Edge-TTS Error]:', err)
          res.statusCode = 500
          res.end(err.message || 'TTS Error')
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), edgeTTSPlugin(env)],
    assetsInclude: ['**/*.vrm'],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@renderer': resolve(__dirname, './src/renderer/src'),
        '@shared': resolve(__dirname, './src/shared')
      }
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      target: 'esnext',
      outDir: 'dist'
    }
  }
})
