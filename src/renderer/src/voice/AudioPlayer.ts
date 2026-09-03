// ============================================================
// Audio Player — Play TTS output and provide node for LipSync
// ============================================================

export class AudioPlayer {
  private audioContext: AudioContext
  private audioBufferSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode
  private isPlaying = false
  private onEndedCallback: (() => void) | null = null

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.gainNode = this.audioContext.createGain()
    this.gainNode.connect(this.audioContext.destination)
  }

  /**
   * Get the AudioContext and the source node for LipSyncController
   */
  getLipSyncSource(): { context: AudioContext; source: AudioNode } {
    return {
      context: this.audioContext,
      source: this.gainNode // Connect LipSync to the gain node
    }
  }

  /**
   * Play an audio buffer from the TTS service
   */
  async playBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
    if (this.isPlaying) {
      this.stop()
    }

    try {
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Decode the audio data
      // We need to copy the ArrayBuffer because decodeAudioData detaches it
      const bufferCopy = arrayBuffer.slice(0)
      const audioBuffer = await this.audioContext.decodeAudioData(bufferCopy)

      // Create and configure source
      this.audioBufferSource = this.audioContext.createBufferSource()
      this.audioBufferSource.buffer = audioBuffer
      this.audioBufferSource.connect(this.gainNode)

      // Handle end event
      this.audioBufferSource.onended = () => {
        this.isPlaying = false
        if (this.onEndedCallback) {
          this.onEndedCallback()
        }
      }

      // Play
      this.audioBufferSource.start(0)
      this.isPlaying = true
      console.log('[AudioPlayer] Playing audio')
    } catch (error) {
      console.error('[AudioPlayer] Failed to play audio:', error)
      throw new Error('Gagal memutar audio')
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.audioBufferSource && this.isPlaying) {
      try {
        this.audioBufferSource.stop()
      } catch (e) {
        // Ignore if already stopped
      }
      this.isPlaying = false
    }
  }

  /**
   * Set callback for when playback ends
   */
  onEnded(callback: () => void): void {
    this.onEndedCallback = callback
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      // Smooth volume change
      this.gainNode.gain.setTargetAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime,
        0.1
      )
    }
  }
}
