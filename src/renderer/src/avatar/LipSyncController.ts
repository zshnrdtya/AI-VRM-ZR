// ============================================================
// Lip Sync Controller — Frequency band analysis
// Implements LIPS-1, LIPS-2, LIPS-3
// ============================================================

import { VRM } from '@pixiv/three-vrm'

export class LipSyncController {
  private vrm: VRM
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  
  // Smoothing values
  private currentA = 0
  private currentI = 0
  private currentU = 0
  private currentE = 0
  private currentO = 0
  
  private isConnected = false
  private smoothingFactor = 0.15 // Lower = smoother and more natural

  constructor(vrm: VRM) {
    this.vrm = vrm
  }

  /**
   * Connect to an audio context and source node
   */
  connect(audioContext: AudioContext, sourceNode: AudioNode): void {
    if (this.isConnected && this.audioContext === audioContext) return

    this.audioContext = audioContext
    this.analyser = this.audioContext.createAnalyser()
    
    // Configure analyser
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.4
    
    // Connect source to analyser (source should also be connected to destination elsewhere)
    sourceNode.connect(this.analyser)
    
    const bufferLength = this.analyser.frequencyBinCount
    this.dataArray = new Uint8Array(bufferLength)
    
    this.isConnected = true
    console.log('[LipSyncController] Connected to audio source')
  }

  /**
   * Disconnect from audio source
   */
  disconnect(): void {
    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }
    this.isConnected = false
    this.reset()
  }

  /**
   * Reset all mouth shapes to 0
   */
  reset(): void {
    this.currentA = 0
    this.currentI = 0
    this.currentU = 0
    this.currentE = 0
    this.currentO = 0
    this.applyBlendShapes()
  }

  /**
   * Update — called each frame
   * Analyzes audio frequency and maps to A/I/U/E/O
   */
  update(_delta: number): void {
    if (!this.isConnected || !this.analyser || !this.vrm.expressionManager) {
      return
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray)
    
    // Calculate volume per frequency band
    // Sample rate is typically 44100Hz or 48000Hz. 
    // Nyquist is ~22050Hz. fftSize 512 means 256 bins.
    // Each bin is ~86Hz.
    
    // Low band (U, O) - roughly 100-500Hz (bins 1 to 6)
    const volLow = this.getAverageVolume(1, 6)
    
    // Mid band (A) - roughly 500-1500Hz (bins 6 to 18)
    const volMid = this.getAverageVolume(6, 18)
    
    // High band (I, E) - roughly 1500-4000Hz (bins 18 to 47)
    const volHigh = this.getAverageVolume(18, 47)
    
    // Overall volume to detect silence
    const volOverall = this.getAverageVolume(1, 50)
    
    // Silence threshold
    if (volOverall < 10) {
      // Smoothly close mouth
      this.currentA = this.lerp(this.currentA, 0, this.smoothingFactor)
      this.currentI = this.lerp(this.currentI, 0, this.smoothingFactor)
      this.currentU = this.lerp(this.currentU, 0, this.smoothingFactor)
      this.currentE = this.lerp(this.currentE, 0, this.smoothingFactor)
      this.currentO = this.lerp(this.currentO, 0, this.smoothingFactor)
    } else {
      // Normalize values (0-255 to 0-1 range with a multiplier for sensitivity)
      const sensitivity = 2.0 // Increased for better response to TTS
      const normLow = Math.min(1.0, (volLow / 255) * sensitivity)
      const normMid = Math.min(1.0, (volMid / 255) * sensitivity)
      const normHigh = Math.min(1.0, (volHigh / 255) * sensitivity)
      
      // Map to specific vowels (Heuristic approach)
      let targetA = 0
      let targetI = 0
      let targetU = 0
      let targetE = 0
      let targetO = 0
      
      // Determine dominant vowel based on frequency bands
      if (normMid > normLow && normMid > normHigh) {
        // Mid is dominant -> 'A' (open mouth)
        targetA = normMid
      } else if (normHigh > normMid && normHigh > normLow) {
        // High is dominant -> 'I' or 'E' (wide mouth)
        targetI = normHigh * 0.7
        targetE = normHigh * 0.3
      } else if (normLow > normMid && normLow > normHigh) {
        // Low is dominant -> 'U' or 'O' (round mouth)
        targetO = normLow * 0.6
        targetU = normLow * 0.4
      } else {
        // Mixed, just open mouth slightly
        targetA = volOverall / 255
      }

      // Smooth transitions
      this.currentA = this.lerp(this.currentA, targetA, this.smoothingFactor)
      this.currentI = this.lerp(this.currentI, targetI, this.smoothingFactor)
      this.currentU = this.lerp(this.currentU, targetU, this.smoothingFactor)
      this.currentE = this.lerp(this.currentE, targetE, this.smoothingFactor)
      this.currentO = this.lerp(this.currentO, targetO, this.smoothingFactor)
    }
    
    this.applyBlendShapes()
  }

  private applyBlendShapes(): void {
    if (!this.vrm.expressionManager) return
    
    // Safely apply expression values
    const setExpr = (preset: string, value: number) => {
      try {
        this.vrm.expressionManager!.setValue(preset, value)
      } catch (e) {
        // Ignore if expression doesn't exist
      }
    }
    
    setExpr('a', this.currentA)
    setExpr('i', this.currentI)
    setExpr('u', this.currentU)
    setExpr('e', this.currentE)
    setExpr('o', this.currentO)
  }

  private getAverageVolume(startIndex: number, endIndex: number): number {
    let sum = 0
    const count = endIndex - startIndex
    if (count <= 0) return 0
    
    for (let i = startIndex; i < endIndex; i++) {
      sum += this.dataArray[i]
    }
    return sum / count
  }
  
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor
  }
}
