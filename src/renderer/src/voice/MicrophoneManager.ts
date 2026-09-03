// ============================================================
// Microphone Manager — Record user voice
// Implements VOIC-1
// ============================================================

export class MicrophoneManager {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private isRecording = false
  private stream: MediaStream | null = null

  /**
   * Start recording audio from the microphone
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) return

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Use WebM with opus codec which is widely supported and explicitly parseable by ffmpeg/Groq
      const options = { mimeType: 'audio/webm;codecs=opus' }
      this.mediaRecorder = new MediaRecorder(this.stream, options)
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(100) // Collect 100ms chunks
      this.isRecording = true
      console.log('[MicrophoneManager] Recording started')
    } catch (error) {
      console.error('[MicrophoneManager] Failed to start recording:', error)
      throw new Error('Gagal mengakses microphone. Pastikan izin microphone diberikan.')
    }
  }

  /**
   * Stop recording and return the audio as an ArrayBuffer
   */
  async stopRecording(): Promise<ArrayBuffer> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('Tidak sedang merekam')
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' })
          const arrayBuffer = await audioBlob.arrayBuffer()
          
          console.log(`[MicrophoneManager] Recording stopped, size: ${arrayBuffer.byteLength} bytes`)
          
          if (arrayBuffer.byteLength < 100) {
            throw new Error('Suara terlalu singkat. Tahan tombol lebih lama.')
          }

          resolve(arrayBuffer)
        } catch (error) {
          reject(error)
        } finally {
          this.cleanup()
        }
      }

      this.mediaRecorder!.stop()
    })
  }

  /**
   * Clean up media stream resources
   */
  private cleanup(): void {
    this.isRecording = false
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }
}
