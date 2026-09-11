import { useEffect, useRef, useState } from 'react'
import { VRMUtils } from '@pixiv/three-vrm'
import { Emotion } from '../../../shared/types'
import { VRMScene } from '../avatar/VRMScene'
import { AnimationController } from '../avatar/AnimationController'
import { ExpressionController } from '../avatar/ExpressionController'
import { LipSyncController } from '../avatar/LipSyncController'

interface AvatarCanvasProps {
  modelUrl: string
  emotion: Emotion
  gesture: string
  animationState: 'idle' | 'talking'
  onControllersReady: (controllers: { lipSync: LipSyncController }) => void
  theme?: 'dark' | 'light'
}

export function AvatarCanvas({ 
  modelUrl, 
  emotion, 
  gesture, 
  animationState, 
  onControllersReady,
  theme = 'dark'
}: AvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for controllers to keep them alive
  const sceneRef = useRef<VRMScene | null>(null)
  const animCtrlRef = useRef<AnimationController | null>(null)
  const exprCtrlRef = useRef<ExpressionController | null>(null)
  
  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Create scene matching container size
    const container = canvasRef.current.parentElement
    const initialWidth = container?.clientWidth || window.innerWidth
    const initialHeight = container?.clientHeight || window.innerHeight

    const scene = new VRMScene(
      canvasRef.current, 
      initialWidth, 
      initialHeight
    )
    sceneRef.current = scene
    
    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current) return
      const parent = canvasRef.current.parentElement
      const w = parent?.clientWidth || window.innerWidth
      const h = parent?.clientHeight || window.innerHeight
      scene.resize(w, h)
    }
    window.addEventListener('resize', handleResize)
    
    let isMounted = true;
    
    // Load model
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    // Simulasi progress dinamis agar angka persentase langsung aktif bergerak mulus
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev < 35) return prev + 5
        if (prev < 70) return prev + 3
        if (prev < 88) return prev + 2
        if (prev < 96) return prev + 1
        return prev
      })
    }, 120)
    
    scene.loadVRM(modelUrl, (progress) => {
      setLoadingProgress((prev) => Math.max(prev, progress))
    })
    .then((vrm) => {
      clearInterval(progressInterval)
      setLoadingProgress(100)

      if (!isMounted) {
        // If unmounted while loading, clean up the loaded VRM
        VRMUtils.deepDispose(vrm.scene)
        return
      }

      // Initialize controllers
      const animCtrl = new AnimationController(vrm)
      const exprCtrl = new ExpressionController(vrm)
      const lipSyncCtrl = new LipSyncController(vrm)
      
      animCtrlRef.current = animCtrl
      exprCtrlRef.current = exprCtrl
      
      // Register update callbacks
      scene.onUpdate((delta) => {
        animCtrl.update(delta)
        exprCtrl.update(delta)
        lipSyncCtrl.update(delta)
      })
      
      // Start render loop
      scene.start()

      // Berikan jeda halus agar persentase 100% sempat terbaca sebelum overlay memudar
      setTimeout(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      }, 250)
      
      // Notify parent
      onControllersReady({ lipSync: lipSyncCtrl })
    })
    .catch((err) => {
      clearInterval(progressInterval)
      console.error(err)
      setError(err.message)
      setIsLoading(false)
    })
    
    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(progressInterval)
      window.removeEventListener('resize', handleResize)
      scene.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl]) // Only re-run if modelUrl changes
  
  // Handle state changes
  useEffect(() => {
    if (animCtrlRef.current) {
      animCtrlRef.current.setState(animationState)
    }
  }, [animationState])
  
  useEffect(() => {
    if (exprCtrlRef.current) {
      exprCtrlRef.current.setEmotion(emotion)
    }
  }, [emotion])

  useEffect(() => {
    if (animCtrlRef.current) {
      animCtrlRef.current.playGesture(gesture)
    }
  }, [gesture])

  return (
    <div 
      className="avatar-container" 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: theme === 'light' ? '#e2e8f0' : 'transparent',
        transition: 'background-color 0.3s ease'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="avatar-canvas" 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text" style={{ transition: 'all 0.3s ease' }}>
            Sebentar ya, Zeeranya siap-siap dulu... {loadingProgress}%
          </div>
          <div
            style={{
              width: '180px',
              maxWidth: '80vw',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px'
            }}
          >
            <div
              style={{
                width: `${loadingProgress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: '2px',
                transition: 'width 0.25s ease'
              }}
            />
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <div className="error-text">Gagal memuat: {error}</div>
        </div>
      )}
    </div>
  )
}
