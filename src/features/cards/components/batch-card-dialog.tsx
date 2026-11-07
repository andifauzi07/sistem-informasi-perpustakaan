import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DownloadIcon, FileTextIcon, Loader2Icon, PrinterIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { CardMember } from '../types'
import { downloadBatchCardsPdf } from '../api/print-cards'

interface BatchCardDialogProps {
  members: CardMember[]
  filterTitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BatchCardDialog({
  members,
  filterTitle,
  open,
  onOpenChange,
}: BatchCardDialogProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)

  const count = members.length
  const totalPages = Math.ceil(count / 10)

  const handleDownload = async () => {
    if (count === 0) {
      toast.error('Tidak ada data anggota untuk dicetak.')
      return
    }

    try {
      setIsGenerating(true)
      const filename = filterTitle
        ? `kartu-anggota-${filterTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.pdf`
        : 'kartu-anggota-massal.pdf'

      await downloadBatchCardsPdf(members, filename)
      toast.success(`Berhasil mengunduh dokumen cetak ${count} kartu anggota (${totalPages} halaman A4).`)
      onOpenChange(false)
    } catch (err) {
      toast.error('Gagal mencetak kartu massal: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrinterIcon className="h-5 w-5 text-primary" />
            Cetak Kartu Massal Lembar A4
          </DialogTitle>
          <DialogDescription>
            Dokumen A4 standar memuat 10 kartu ID-1 per halaman lengkap dengan garis potong (FR-CARD-02).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Ringkasan Cetak */}
          <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Kategori / Filter:</span>
              <span className="font-semibold text-slate-900">{filterTitle || 'Semua Terpilih'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Jumlah Anggota:</span>
              <span className="font-bold text-primary">{count} orang</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tata Letak:</span>
              <span className="text-slate-800">10 kartu / lembar (2 kolom × 5 baris)</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t">
              <span className="font-medium text-slate-800">Total Kertas A4:</span>
              <span className="font-bold text-slate-900">{totalPages} lembar</span>
            </div>
          </div>

          {/* Keterangan Tambahan */}
          <div className="text-xs text-muted-foreground flex items-start gap-2">
            <FileTextIcon className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              Setiap kartu memiliki dimensi standar ID-1 (85,6 × 54 mm) dan dilengkapi garis panduan potong putus-putus untuk mempermudah pemotongan rapi.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating || count === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4" />
            )}
            Unduh PDF ({count} Kartu / {totalPages} Lembar)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
