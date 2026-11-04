import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Printer, Loader2, CheckSquare, Square } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { bookCopiesQueryOptions } from '../api/queries'
import { COPY_STATUS_LABELS } from '@/lib/labels'
import type { Database } from '@/types/database.types'

type Book = Database['public']['Tables']['books']['Row']

interface PrintBarcodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: Book | null
}

export function PrintBarcodeDialog({ open, onOpenChange, book }: PrintBarcodeDialogProps) {
  if (!book) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="size-5 text-primary" />
            <span>Cetak Label Barcode: {book.title}</span>
          </DialogTitle>
          <DialogDescription>
            Pilih eksemplar fisik yang ingin dicetak label barcodenya dalam format dokumen PDF A4 (Code 128).
          </DialogDescription>
        </DialogHeader>

        <PrintBarcodeContent book={book} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PrintBarcodeContent({ book, onClose }: { book: Book; onClose: () => void }) {
  const { data: copies } = useSuspenseQuery(bookCopiesQueryOptions(book.id))
  const [selectedCopyIds, setSelectedCopyIds] = useState<number[]>(copies.map((c) => c.id))
  const [isGenerating, setIsGenerating] = useState(false)

  const toggleSelectAll = () => {
    if (selectedCopyIds.length === copies.length) {
      setSelectedCopyIds([])
    } else {
      setSelectedCopyIds(copies.map((c) => c.id))
    }
  }

  const toggleCopy = (id: number) => {
    if (selectedCopyIds.includes(id)) {
      setSelectedCopyIds(selectedCopyIds.filter((item) => item !== id))
    } else {
      setSelectedCopyIds([...selectedCopyIds, id])
    }
  }

  const handleGeneratePdf = async () => {
    if (selectedCopyIds.length === 0) {
      toast.error('Pilih minimal satu eksemplar untuk dicetak')
      return
    }

    try {
      setIsGenerating(true)
      toast.info('Menyiapkan barcode Code 128...')

      // Lazy load bwip-js dan @react-pdf/renderer (NFR-PE-03 / CLAUDE.md §8)
      const bwipModule = await import('bwip-js')
      const bwipjs = (bwipModule as unknown as { default?: typeof bwipModule }).default || bwipModule
      const { pdf } = await import('@react-pdf/renderer')
      const { BarcodePdfDocument } = await import('./BarcodePdfDocument')

      const selectedCopies = copies.filter((c) => selectedCopyIds.includes(c.id))

      // Generate barcode PNG Data URL untuk setiap eksemplar
      const items = await Promise.all(
        selectedCopies.map(async (copy) => {
          const canvas = document.createElement('canvas')
          await new Promise<void>((resolve, reject) => {
            try {
              bwipjs.toCanvas(canvas, {
                bcid: 'code128',
                text: copy.code,
                scale: 3,
                height: 10,
                includetext: false,
              })
              resolve()
            } catch (e) {
              reject(e instanceof Error ? e : new Error(String(e)))
            }
          })

          return {
            code: copy.code,
            title: book.title,
            barcodeDataUrl: canvas.toDataURL('image/png'),
          }
        })
      )

      toast.info('Menyusun lembar PDF A4...')
      const blob = await pdf(<BarcodePdfDocument items={items} />).toBlob()
      const url = URL.createObjectURL(blob)

      // Unduh dokumen PDF secara otomatis
      const a = document.createElement('a')
      a.href = url
      a.download = `label-barcode-${book.title.replace(/[^A-Za-z0-9]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success(`Berhasil mengunduh label barcode untuk ${items.length} eksemplar`)
      onClose()
    } catch {
      toast.error('Gagal membuat dokumen PDF label barcode')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between border-b pb-2">
        <span className="text-sm font-medium">
          Terpilih {selectedCopyIds.length} dari {copies.length} eksemplar
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleSelectAll}
          className="h-8 gap-1.5 text-xs"
        >
          {selectedCopyIds.length === copies.length ? (
            <>
              <CheckSquare className="size-3.5 text-primary" />
              <span>Batal Pilih Semua</span>
            </>
          ) : (
            <>
              <Square className="size-3.5" />
              <span>Pilih Semua</span>
            </>
          )}
        </Button>
      </div>

      <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
        {copies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Buku ini belum memiliki eksemplar fisik.
          </p>
        ) : (
          copies.map((copy) => {
            const isSelected = selectedCopyIds.includes(copy.id)
            return (
              <div
                key={copy.id}
                onClick={() => toggleCopy(copy.id)}
                className={`flex items-center justify-between rounded-md border p-2.5 text-sm transition cursor-pointer ${
                  isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent onClick
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="font-mono font-semibold text-foreground">
                      {copy.code}
                    </span>
                    {copy.notes && (
                      <span className="ml-2 text-xs text-muted-foreground">({copy.notes})</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {COPY_STATUS_LABELS[copy.status]}
                </span>
              </div>
            )
          })
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>
          Batal
        </Button>
        <Button
          type="button"
          onClick={() => {
            void handleGeneratePdf()
          }}
          disabled={isGenerating || copies.length === 0 || selectedCopyIds.length === 0}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Membuat PDF...</span>
            </>
          ) : (
            <>
              <Printer className="size-4" />
              <span>Unduh PDF Label (A4)</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}
