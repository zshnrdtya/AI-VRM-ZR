import OpenAI from 'openai'

export default async function handler(req, res) {
  // Izinkan metode POST saja
  if (req.method !== 'POST') {
    if (typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
  }

  try {
    // Ambil payload pesan dan model dari frontend
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        // ignore parse error
      }
    } else if (!body) {
      const buffers = []
      for await (const chunk of req) {
        buffers.push(chunk)
      }
      const rawText = Buffer.concat(buffers).toString('utf-8')
      if (rawText) {
        body = JSON.parse(rawText)
      }
    }

    const { messages, model } = body || {}

    // Inisialisasi OpenAI client di sisi server (backend proxy)
    const xkiroClient = new OpenAI({
      baseURL: 'https://api.xkiro.com/v1',
      // Mengambil API Key dari Environment Variable Vercel / server
      apiKey:
        process.env.VITE_XKIRO_API_KEY ||
        process.env.XKIRO_API_KEY ||
        'sk-xt-f04df9308330689bcff3cd305875c63623bfed78d5da4739'
    })

    // Minta response streaming dari xKiro
    const response = await xkiroClient.chat.completions.create({
      model: model || 'qwen/qwen3.8-max:free',
      messages: messages,
      stream: true
    })

    // Atur header agar browser memahami ini adalah data stream
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Teruskan (pipe) chunk dari xKiro langsung ke frontend
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('API Error:', error)
    if (!res.headersSent) {
      if (typeof res.status === 'function') {
        res.status(500).json({ error: 'Terjadi kesalahan pada server proxy' })
      } else {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Terjadi kesalahan pada server proxy' }))
      }
    }
  }
}
