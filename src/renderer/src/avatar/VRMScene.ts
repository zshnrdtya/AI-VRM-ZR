// ============================================================
// VRM Scene — Three.js scene setup + VRM model loader
// Implements AVTR-1, AVTR-2, AVTR-3, AVTR-4
// ============================================================

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm'

export class VRMScene {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly clock: THREE.Clock

  vrm: VRM | null = null
  private animationId: number | null = null
  private updateCallbacks: ((delta: number) => void)[] = []

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // Scene setup
    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock()

    // Camera — positioned for upper body/face view
    this.camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100)
    this.camera.position.set(0, 1.25, 2.2)
    this.camera.lookAt(0, 1.15, 0)

    // Renderer with transparency (DESK-1)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0) // Fully transparent
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    // Lighting
    this.setupLighting()
  }

  private setupLighting(): void {
    // Ambient light — soft fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    this.scene.add(ambient)

    // Main directional light — front-top
    const mainLight = new THREE.DirectionalLight(0xfff5ee, 1.2)
    mainLight.position.set(1, 2, 3)
    this.scene.add(mainLight)

    // Fill light — softer from left
    const fillLight = new THREE.DirectionalLight(0xeef0ff, 0.5)
    fillLight.position.set(-2, 1, 1)
    this.scene.add(fillLight)

    // Rim light — behind for separation
    const rimLight = new THREE.DirectionalLight(0xffd0e0, 0.4)
    rimLight.position.set(0, 1, -2)
    this.scene.add(rimLight)
  }

  /**
   * Load VRM model
   * @param url - Path to the VRM file
   * @param onProgress - Progress callback (0-100)
   */
  async loadVRM(
    url: string,
    onProgress?: (percent: number) => void
  ): Promise<VRM> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()

      // Register VRM plugin (supports both VRM 0.x and 1.0)
      loader.register((parser) => new VRMLoaderPlugin(parser))

      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm as VRM

          if (!vrm) {
            reject(new Error('File bukan format VRM yang valid'))
            return
          }

          // Rotate model to face camera (VRM default is facing +Z)
          vrm.scene.rotation.y = Math.PI

          // Add to scene
          this.scene.add(vrm.scene)
          this.vrm = vrm

          // Adjust camera based on head position
          const headNode = vrm.humanoid?.getNormalizedBoneNode('head')
          if (headNode) {
            const headPos = new THREE.Vector3()
            headNode.getWorldPosition(headPos)
            
            // Frame for a half-body shot (from waist to above head)
            // with enough horizontal width to see gestures
            this.camera.position.set(0, headPos.y - 0.1, headPos.y > 0 ? headPos.y * 1.6 : 2.2)
            this.camera.lookAt(0, headPos.y - 0.15, 0)
          }

          console.log('[VRMScene] Model loaded successfully')
          console.log('[VRMScene] Expression names:', vrm.expressionManager?.expressions.map(e => e.expressionName))

          resolve(vrm)
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            onProgress?.(percent)
          }
        },
        (error) => {
          console.error('[VRMScene] Failed to load VRM:', error)
          reject(new Error(`Gagal memuat model VRM: ${error}`))
        }
      )
    })
  }

  /** Register an update callback to be called each frame */
  onUpdate(callback: (delta: number) => void): void {
    this.updateCallbacks.push(callback)
  }

  /** Remove an update callback */
  offUpdate(callback: (delta: number) => void): void {
    this.updateCallbacks = this.updateCallbacks.filter((cb) => cb !== callback)
  }

  /** Start the render loop */
  start(): void {
    const animate = (): void => {
      this.animationId = requestAnimationFrame(animate)
      const delta = this.clock.getDelta()

      // Update VRM (spring bones, etc.)
      if (this.vrm) {
        this.vrm.update(delta)
      }

      // Run all update callbacks
      for (const cb of this.updateCallbacks) {
        cb(delta)
      }

      // Render
      this.renderer.render(this.scene, this.camera)
    }

    animate()
  }

  /** Stop the render loop */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /** Resize the renderer */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  /** Cleanup resources */
  dispose(): void {
    this.stop()
    this.renderer.dispose()
    if (this.vrm) {
      this.scene.remove(this.vrm.scene)
    }
  }
}
