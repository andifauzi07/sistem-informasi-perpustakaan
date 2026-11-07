import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { ScanLine, Camera, CornerDownLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const LazyCameraScanner = lazy(() => import('./CameraScanner'))

export interface CodeInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onSubmit: (code: string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  submitLabel?: string
  enableCamera?: boolean
}

// Komponen input pemindai USB keyboard wedge + pemicu kamera lazy (FR-CIR-15, TC-CIR-17)
export function CodeInput({
  id = 'code-input',
  value,
  onChange,
  onSubmit,
  placeholder = 'Pindai barcode atau ketik kode lalu tekan Enter...',
  disabled = false,
  autoFocus = true,
  submitLabel = 'Proses',
  enableCamera = true,
}: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  useEffect(() => {
    if (autoFocus && !disabled && !cameraOpen) {
      inputRef.current?.focus()
    }
  }, [autoFocus, disabled, cameraOpen])

  const handleTrigger = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleTrigger()
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className="h-11 pl-9 font-mono text-base"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleTrigger}
            disabled={disabled || !value.trim()}
            className="h-11 gap-1.5 flex-1 sm:flex-initial"
          >
            <CornerDownLeft className="size-4" />
            <span>{submitLabel}</span>
          </Button>

          {enableCamera && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCameraOpen(true)}
              disabled={disabled}
              className="h-11 gap-1.5"
              title="Pindai dengan Kamera"
            >
              <Camera className="size-4" />
              <span className="hidden md:inline">Scan Kamera</span>
            </Button>
          )}
        </div>
      </div>

      {cameraOpen && (
        <Suspense fallback={null}>
          <LazyCameraScanner
            open={cameraOpen}
            onOpenChange={setCameraOpen}
            onDetected={(detectedCode) => {
              onChange(detectedCode)
              setCameraOpen(false)
              onSubmit(detectedCode.trim())
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
