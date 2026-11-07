import { useRouter, Link, type ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { toUserMessage } from '@/lib/errors'

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const detailMessage = error ? toUserMessage(error) : null

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-6">
      <div
        role="alert"
        className="w-full rounded-2xl border border-destructive/25 bg-card p-6 shadow-sm space-y-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              Terjadi galat saat memuat halaman ini.
            </p>
            {detailMessage && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {detailMessage}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => {
              reset()
              // Memuat ulang loader rute; reset() saja hanya cukup untuk galat render.
              void router.invalidate()
            }}
          >
            <RotateCcw className="size-4" />
            <span>Coba lagi</span>
          </button>

          <Link
            to="/beranda"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <Home className="size-4" />
            <span>Ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
