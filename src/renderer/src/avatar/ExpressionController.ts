// ============================================================
// Expression Controller — Emotion mapping to VRM expressions
// Implements EXPR-1, EXPR-2, EXPR-3
// Maps AI emotion tags to VRM blend shape presets
// ============================================================

import { VRM } from '@pixiv/three-vrm'
import { Emotion } from '../../../shared/types'

/** Mapping from AI emotion to VRM expression preset name */
const EMOTION_MAP: Record<Emotion, string> = {
  neutral: 'neutral',
  happy: 'happy',    // VRM 0.x preset: joy
  sad: 'sad',        // VRM 0.x preset: sorrow
  angry: 'angry',    // VRM 0.x preset: angry
  surprised: 'neutral', // EXPR-3: Fallback to neutral (not available on model)
  relaxed: 'relaxed'    // VRM 0.x preset: fun
}

export class ExpressionController {
  private vrm: VRM
  private currentEmotion: Emotion = 'neutral'
  private targetEmotion: Emotion = 'neutral'
  private transitionProgress: number = 1.0
  private readonly transitionSpeed: number = 3.0 // ~300ms transition

  constructor(vrm: VRM) {
    this.vrm = vrm

    // Log available expressions for debugging
    const expressions = vrm.expressionManager?.expressions.map(e => e.expressionName) || []
    console.log('[ExpressionController] Available expressions:', expressions)
  }

  /**
   * Set the target emotion — will smoothly transition
   * Implements EXPR-1: Change expression based on AI emotion
   */
  setEmotion(emotion: Emotion): void {
    if (emotion === this.targetEmotion) return

    console.log(`[ExpressionController] Emotion: ${this.currentEmotion} → ${emotion}`)
    this.currentEmotion = this.targetEmotion
    this.targetEmotion = emotion
    this.transitionProgress = 0
  }

  /** Reset to neutral */
  reset(): void {
    this.setEmotion('neutral')
  }

  /** Update — called each frame for smooth transitions */
  update(delta: number): void {
    if (this.transitionProgress >= 1.0) return

    this.transitionProgress = Math.min(1.0, this.transitionProgress + delta * this.transitionSpeed)
    const t = this.easeInOut(this.transitionProgress)

    // Fade out current emotion
    if (this.currentEmotion !== 'neutral') {
      const currentPreset = EMOTION_MAP[this.currentEmotion]
      this.setExpression(currentPreset, 1.0 - t)
    }

    // Fade in target emotion
    if (this.targetEmotion !== 'neutral') {
      const targetPreset = EMOTION_MAP[this.targetEmotion]
      this.setExpression(targetPreset, t)
    }

    // When transition complete, update current
    if (this.transitionProgress >= 1.0) {
      this.currentEmotion = this.targetEmotion
    }
  }

  /**
   * Set a specific expression value
   * Implements EXPR-3: Fallback to neutral if expression not available
   */
  private setExpression(presetName: string, value: number): void {
    if (!this.vrm.expressionManager) return

    try {
      this.vrm.expressionManager.setValue(presetName, value)
    } catch {
      // Expression not found — fallback to neutral (EXPR-3)
      console.warn(`[ExpressionController] Expression "${presetName}" not found, using neutral`)
    }
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }
}
