import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'

export function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-4">
      <p>Terjadi galat saat memuat halaman ini.</p>
      <button
        type="button"
        className="min-h-11 rounded-md bg-primary px-4 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onClick={() => {
          reset()
          // Memuat ulang loader rute; reset() saja hanya cukup untuk galat render.
          void router.invalidate()
        }}
      >
        Coba lagi
      </button>
    </div>
  )
}
