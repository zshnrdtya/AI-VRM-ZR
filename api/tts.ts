import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

export default async function handler(req: any, res: any) {
  try {
    const text = (req.query?.text as string) || ''
    const voice = (req.query?.voice as string) || process.env.VOICE_NAME || 'id-ID-GadisNeural'
    const pitch = (req.query?.pitch as string) || process.env.VOICE_PITCH || '+22%'
    const rate = (req.query?.rate as string) || process.env.VOICE_RATE || '+8%'

    if (!text.trim()) {
      return res.status(400).send('Missing text parameter')
    }

    const tts = new MsEdgeTTS()
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const readable = tts.toStream(text, { pitch, rate })

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    readable.audioStream.pipe(res)
  } catch (err: any) {
    console.error('[Vercel Edge-TTS Error]:', err)
    res.status(500).send(err.message || 'TTS Error')
  }
}
