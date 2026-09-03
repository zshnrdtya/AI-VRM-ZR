// ============================================================
// Animation Controller — Procedural idle, talking, blink
// Implements ANIM-1 to ANIM-5
// All animations are procedural (no embedded animation files)
// ============================================================

import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm'
import * as THREE from 'three'

export type AnimationState = 'idle' | 'talking'

export class AnimationController {
  private vrm: VRM
  private state: AnimationState = 'idle'
  private elapsed: number = 0

  // Blink control
  private blinkTimer: number = 0
  private nextBlinkAt: number = 3
  private blinkProgress: number = 0
  private isBlinking: boolean = false

  // Idle breathing & movement
  private breathPhase: number = 0
  private bodySwayPhase: number = 0

  // Eye movement (occasional glance)
  private nextGlanceAt: number = 2
  private eyeTimer: number = 0
  private eyeTargetX: number = 0
  private eyeTargetY: number = 0
  private currentEyeX: number = 0
  private currentEyeY: number = 0

  // Gestures
  private activeGesture: string = 'none'
  private gestureTimer: number = 0
  private talkGesturePhase: number = 0

  constructor(vrm: VRM) {
    this.vrm = vrm
    this.nextBlinkAt = this.randomBlinkInterval()
    this.applyDefaultPose()
  }

  /** Apply relaxed A-pose to avoid T-pose and reset animated bones */
  private applyDefaultPose(): void {
    const leftUpperArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm)
    const rightUpperArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm)
    const leftLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm)
    const rightLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm)

    if (leftUpperArm) { leftUpperArm.rotation.set(0, 0, 1.1) } // Lower arm (around 65 degrees)
    if (rightUpperArm) { rightUpperArm.rotation.set(0, 0, -1.1) }

    if (leftLowerArm) { leftLowerArm.rotation.set(0, 0, 0.2) } // Slight elbow bend
    if (rightLowerArm) { rightLowerArm.rotation.set(0, 0, -0.2) }

    // Reset torso and head to prevent cumulative rotation (spinning bug)
    const spine = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine)
    if (spine) spine.rotation.set(0, 0, 0)
    
    const upperChest = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.UpperChest)
    if (upperChest) upperChest.rotation.set(0, 0, 0)

    const head = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head)
    if (head) head.rotation.set(0, 0, 0)
  }

  /** Set animation state */
  setState(state: AnimationState): void {
    if (this.state !== state) {
      console.log(`[AnimationController] State: ${this.state} → ${state}`)
      this.state = state
      if (state === 'talking') {
        this.talkGesturePhase = 0
      } else {
        // If going back to idle, clear the explicit gesture if it's not a loop
        if (this.activeGesture !== 'none') {
          this.activeGesture = 'none'
        }
      }
    }
  }

  /** Trigger a specific gesture */
  playGesture(gesture: string): void {
    if (gesture && gesture !== 'none') {
      console.log(`[AnimationController] Playing gesture: ${gesture}`)
      this.activeGesture = gesture
      this.gestureTimer = 0
    } else {
      this.activeGesture = 'none'
    }
  }

  /** Update animations — called each frame */
  update(delta: number): void {
    this.elapsed += delta
    this.breathPhase += delta
    this.bodySwayPhase += delta * 0.5
    
    if (this.activeGesture !== 'none') {
      this.gestureTimer += delta
      // Auto reset gesture after 3 seconds for transient gestures
      if (this.gestureTimer > 3.0 && ['nod', 'wave', 'pointing', 'surprised'].includes(this.activeGesture)) {
        this.activeGesture = 'none'
      }
    }

    // Apply baseline default pose each frame so additive animations work
    this.applyDefaultPose()

    // Always update blink and eyes
    this.updateBlink(delta)
    this.updateEyes(delta)

    // State-specific animations
    if (this.state === 'idle') {
      this.updateIdle(delta)
    } else if (this.state === 'talking') {
      this.updateTalking(delta)
    }

    // Apply specific gesture overrides
    if (this.activeGesture !== 'none') {
      this.applyGesture(delta)
    }
  }

  // ---- Blink (ANIM-3) ----

  private updateBlink(delta: number): void {
    this.blinkTimer += delta

    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkAt) {
      this.isBlinking = true
      this.blinkProgress = 0
    }

    if (this.isBlinking) {
      this.blinkProgress += delta * 8 // Speed of blink

      let blinkValue: number
      if (this.blinkProgress < 0.5) {
        // Closing
        blinkValue = this.blinkProgress * 2
      } else if (this.blinkProgress < 1.0) {
        // Opening
        blinkValue = 1 - (this.blinkProgress - 0.5) * 2
      } else {
        // Done
        blinkValue = 0
        this.isBlinking = false
        this.blinkTimer = 0
        this.nextBlinkAt = this.randomBlinkInterval()
      }

      this.vrm.expressionManager?.setValue('blink', blinkValue)
    }
  }

  private updateEyes(delta: number): void {
    this.eyeTimer += delta

    if (this.eyeTimer >= this.nextGlanceAt) {
      // Pick a new glance direction
      this.eyeTimer = 0
      this.nextGlanceAt = 1 + Math.random() * 4 // glance every 1-5 seconds

      // 60% chance to look at center (user), 40% chance to glance around
      if (Math.random() > 0.4) {
        this.eyeTargetX = 0
        this.eyeTargetY = 0
      } else {
        this.eyeTargetX = (Math.random() - 0.5) * 0.2 // Left/Right
        this.eyeTargetY = (Math.random() - 0.5) * 0.1 // Up/Down
      }
    }

    // Smooth transition to eye target
    this.currentEyeX += (this.eyeTargetX - this.currentEyeX) * delta * 5
    this.currentEyeY += (this.eyeTargetY - this.currentEyeY) * delta * 5

    const leftEye = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftEye)
    const rightEye = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightEye)

    if (leftEye) {
      leftEye.rotation.y = this.currentEyeX
      leftEye.rotation.x = this.currentEyeY
    }
    if (rightEye) {
      rightEye.rotation.y = this.currentEyeX
      rightEye.rotation.x = this.currentEyeY
    }
  }

  // ---- Idle Animation (ANIM-1) ----

  private updateIdle(delta: number): void {
    // Breathing — subtle chest/spine movement
    const breathAmount = Math.sin(this.breathPhase * 1.5) * 0.003
    const spine = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine)
    if (spine) {
      spine.rotation.x += breathAmount
    }

    // Subtle head movement — slow gentle sway
    const head = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head)
    if (head && this.activeGesture !== 'nod') {
      head.rotation.y += Math.sin(this.bodySwayPhase * 0.8) * 0.03
      head.rotation.x += Math.sin(this.bodySwayPhase * 0.6) * 0.015 - 0.01
      head.rotation.z += Math.sin(this.bodySwayPhase * 1.0) * 0.01
    }

    // Subtle body sway (weight shift) - ONLY ROTATION, avoid position to prevent clipping into ground
    const upperBody = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.UpperChest)
    if (upperBody) {
      upperBody.rotation.z += Math.sin(this.bodySwayPhase * 1.2) * 0.008
    }
    
    // Occasional idle hand micro-movements
    const leftLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm)
    const rightLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm)
    if (this.activeGesture === 'none') {
      if (leftLowerArm) leftLowerArm.rotation.z += Math.sin(this.breathPhase * 0.5) * 0.01
      if (rightLowerArm) rightLowerArm.rotation.z -= Math.sin(this.breathPhase * 0.5) * 0.01
    }
  }

  // ---- Talking Animation (ANIM-2) ----

  private updateTalking(delta: number): void {
    this.talkGesturePhase += delta

    // More active breathing when talking
    const breathAmount = Math.sin(this.breathPhase * 2.2) * 0.005
    const spine = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine)
    if (spine) {
      spine.rotation.x += breathAmount
    }

    // Head nods and tilts — more animated when talking
    const head = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head)
    if (head && this.activeGesture !== 'nod') {
      head.rotation.x += Math.sin(this.talkGesturePhase * 2.5) * 0.02 - 0.02
      head.rotation.y += Math.sin(this.talkGesturePhase * 1.8) * 0.03
      head.rotation.z += Math.sin(this.talkGesturePhase * 0.9) * 0.02
    }

    // Upper body slight movement
    const upperBody = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.UpperChest)
    if (upperBody) {
      upperBody.rotation.z += Math.sin(this.talkGesturePhase * 0.5) * 0.015
      upperBody.rotation.x += Math.sin(this.talkGesturePhase * 0.8) * 0.008
    }

    // Subtle arm gestures if no specific gesture is active
    if (this.activeGesture === 'none') {
      const leftUpperArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm)
      const rightUpperArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm)
      const leftLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm)
      const rightLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm)

      if (leftUpperArm) leftUpperArm.rotation.z += Math.sin(this.talkGesturePhase * 1.2) * 0.04
      if (rightUpperArm) rightUpperArm.rotation.z -= Math.sin(this.talkGesturePhase * 1.5 + 0.5) * 0.04
      
      if (leftLowerArm) leftLowerArm.rotation.z += Math.abs(Math.sin(this.talkGesturePhase * 1.2)) * 0.1
      if (rightLowerArm) rightLowerArm.rotation.z -= Math.abs(Math.sin(this.talkGesturePhase * 1.5)) * 0.1
    }
  }

  // ---- Gestures ----
  private applyGesture(delta: number): void {
    const leftUpperArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm)
    const rightUpperArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm)
    const leftLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftLowerArm)
    const rightLowerArm = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightLowerArm)
    const head = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head)
    
    // Smooth intro factor for gesture
    const t = Math.min(this.gestureTimer * 3.0, 1.0)
    
    switch (this.activeGesture) {
      case 'nod':
        if (head) {
          head.rotation.x += Math.sin(this.gestureTimer * 6) * 0.15 * t
        }
        break
      case 'wave':
        if (rightUpperArm && rightLowerArm) {
          // Raise arm
          rightUpperArm.rotation.z = this.lerp(rightUpperArm.rotation.z, -1.8, t)
          rightUpperArm.rotation.x = this.lerp(rightUpperArm.rotation.x, 0.2, t)
          // Wave hand
          rightLowerArm.rotation.z = this.lerp(rightLowerArm.rotation.z, Math.sin(this.gestureTimer * 8) * 0.4 - 0.2, t)
        }
        break
      case 'thinking':
        if (rightUpperArm && rightLowerArm && head) {
          // Hand to chin
          rightUpperArm.rotation.z = this.lerp(rightUpperArm.rotation.z, -1.4, t)
          rightUpperArm.rotation.x = this.lerp(rightUpperArm.rotation.x, 0.5, t)
          rightLowerArm.rotation.z = this.lerp(rightLowerArm.rotation.z, -1.8, t)
          // Tilt head slightly
          head.rotation.z = this.lerp(head.rotation.z, 0.1, t)
          head.rotation.y = this.lerp(head.rotation.y, 0.2, t)
        }
        break
      case 'happy':
        if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
          // Both arms up slightly
          leftUpperArm.rotation.z = this.lerp(leftUpperArm.rotation.z, 1.4, t)
          rightUpperArm.rotation.z = this.lerp(rightUpperArm.rotation.z, -1.4, t)
          leftLowerArm.rotation.z = this.lerp(leftLowerArm.rotation.z, 0.8, t)
          rightLowerArm.rotation.z = this.lerp(rightLowerArm.rotation.z, -0.8, t)
          
          // Bouncy motion - apply slight rotation to chest instead of hips position
          const upperBody = this.vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.UpperChest)
          if (upperBody) upperBody.rotation.x += Math.abs(Math.sin(this.gestureTimer * 5)) * 0.02 * t
        }
        break
      case 'surprised':
        if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm && head) {
          // Hands near chest / face, leaning back
          leftUpperArm.rotation.z = this.lerp(leftUpperArm.rotation.z, 1.2, t)
          leftUpperArm.rotation.x = this.lerp(leftUpperArm.rotation.x, 0.3, t)
          rightUpperArm.rotation.z = this.lerp(rightUpperArm.rotation.z, -1.2, t)
          rightUpperArm.rotation.x = this.lerp(rightUpperArm.rotation.x, 0.3, t)
          
          leftLowerArm.rotation.z = this.lerp(leftLowerArm.rotation.z, 1.5, t)
          rightLowerArm.rotation.z = this.lerp(rightLowerArm.rotation.z, -1.5, t)
          
          if (head) head.rotation.x = this.lerp(head.rotation.x, -0.1, t) // head back
        }
        break
      case 'pointing':
        if (rightUpperArm && rightLowerArm) {
          // Point forward
          rightUpperArm.rotation.z = this.lerp(rightUpperArm.rotation.z, -1.3, t)
          rightUpperArm.rotation.x = this.lerp(rightUpperArm.rotation.x, 0.8, t)
          rightUpperArm.rotation.y = this.lerp(rightUpperArm.rotation.y, 0.5, t)
          rightLowerArm.rotation.z = this.lerp(rightLowerArm.rotation.z, -0.1, t) // Straight
        }
        break
    }
  }

  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor
  }

  // ---- Utilities ----

  private randomBlinkInterval(): number {
    // Random interval between 2-6 seconds
    return 2 + Math.random() * 4
  }
}
