import { useEffect, useRef, useState } from 'react'
import { Camera, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface CameraScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDetected: (code: string) => void
}

interface BarcodeDetectionResult {
  rawValue?: string
}

interface NativeBarcodeDetector {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectionResult[]>
}

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[]
}) => NativeBarcodeDetector

// Komponen pemindai kamera lazy-load untuk QR Code & Code 128 (FR-CIR-15)
export default function CameraScanner({
  open,
  onOpenChange,
  onDetected,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let stream: MediaStream | null = null
    let animationId: number | null = null
    let isCancelled = false

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErrorMsg('Kamera tidak tersedia pada peramban atau koneksi non-HTTPS ini.')
          return
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const DetectorClass = (
          window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
        ).BarcodeDetector

        if (!DetectorClass) {
          setErrorMsg(
            'Fitur deteksi barcode kamera belum didukung di peramban ini. Gunakan scanner USB atau ketik kode manual.'
          )
          return
        }

        const detector = new DetectorClass({
          formats: ['code_128', 'qr_code'],
        })

        const scanLoop = async () => {
          if (isCancelled) return
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const results = await detector.detect(videoRef.current)
              const code = results[0]?.rawValue?.trim()
              if (code) {
                onDetected(code)
                return
              }
            } catch {
              // Abaikan frame yang gagal dideteksi
            }
          }
          animationId = window.requestAnimationFrame(() => {
            void scanLoop()
          })
        }

        void scanLoop()
      } catch {
        setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.')
      }
    }

    void startCamera()

    return () => {
      isCancelled = true
      if (animationId !== null) {
        window.cancelAnimationFrame(animationId)
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [open, onDetected])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <span>Pindai Barcode / QR Code</span>
          </DialogTitle>
          <DialogDescription>
            Arahkan kamera ke kode QR Kartu Anggota atau Barcode Code 128 pada label buku.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
            />
            <div className="pointer-events-none absolute inset-6 rounded-md border-2 border-dashed border-emerald-400/80" />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup Kamera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
