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
import { DownloadIcon, Loader2Icon, PrinterIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { CardMember } from '../types'
import { generateQrCodeDataUrl } from '../utils'
import { downloadSingleCardPdf } from '../api/print-cards'

interface SingleCardDialogProps {
  member: CardMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SingleCardDialog({
  member,
  open,
  onOpenChange,
}: SingleCardDialogProps) {
  const [qrUrl, setQrUrl] = React.useState<string>('')
  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    if (member?.member_code && open) {
      let isMounted = true
      generateQrCodeDataUrl(member.member_code).then((url) => {
        if (isMounted) setQrUrl(url)
      })
      return () => {
        isMounted = false
      }
    }
  }, [member?.member_code, open])

  if (!member) return null

  const handleDownload = async () => {
    try {
      setIsGenerating(true)
      await downloadSingleCardPdf(member)
      toast.success(`Kartu anggota ${member.full_name} berhasil diunduh.`)
      onOpenChange(false)
    } catch (err) {
      toast.error('Gagal mencetak kartu anggota: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsGenerating(false)
    }
  }

  const roleText =
    member.role === 'student'
      ? 'SISWA'
      : member.role === 'teacher'
        ? 'GURU'
        : 'PUSTAKAWAN'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrinterIcon className="h-5 w-5 text-primary" />
            Cetak Kartu Anggota Individu
          </DialogTitle>
          <DialogDescription>
            Standar ID-1 (85,6 × 54 mm) format PDF siap cetak.
          </DialogDescription>
        </DialogHeader>

        {/* Pratinjau Visual Kartu ID-1 */}
        <div className="flex justify-center p-2">
          <div className="w-[340px] h-[214px] rounded-lg border border-slate-300 bg-white p-3 shadow-md flex flex-col justify-between select-none">
            {/* Header */}
            <div className="text-center border-b border-sky-500 pb-1.5">
              <h4 className="text-[10px] font-black text-blue-900 tracking-wide uppercase">
                SMK NEGERI 1 SELAYAR
              </h4>
              <p className="text-[8px] text-sky-700 font-medium">PERPUSTAKAAN SEKOLAH</p>
              <div className="mt-1 bg-slate-900 text-white text-[7.5px] font-bold py-0.5 rounded tracking-wider">
                KARTU ANGGOTA PERPUSTAKAAN
              </div>
            </div>

            {/* Konten Utama */}
            <div className="flex items-center justify-between gap-3 my-auto py-1">
              <div className="flex-1 space-y-1">
                <div className="text-[11px] font-bold text-slate-900 leading-tight">
                  {member.full_name}
                </div>
                <div className="text-[9.5px] font-mono font-semibold text-slate-700">
                  {member.member_code}
                </div>
                <div className="inline-block px-1.5 py-0.5 text-[8px] font-bold rounded bg-sky-100 text-sky-800">
                  {roleText}
                </div>
                {member.role === 'student' && (
                  <div className="text-[8px] text-slate-600">
                    {member.class_name && <div>Kelas: {member.class_name}</div>}
                    {member.major_name && <div>Jurusan: {member.major_name}</div>}
                  </div>
                )}
                {member.role === 'teacher' && member.subject && (
                  <div className="text-[8px] text-slate-600">Mapel: {member.subject}</div>
                )}
                {member.role === 'librarian' && member.position && (
                  <div className="text-[8px] text-slate-600">Jabatan: {member.position}</div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-[64px] h-[64px] object-contain"
                  />
                ) : (
                  <div className="w-[64px] h-[64px] bg-slate-200 animate-pulse rounded" />
                )}
                <span className="text-[7px] font-mono text-slate-600 mt-0.5">
                  {member.member_code}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-1 text-center">
              <p className="text-[6.5px] text-slate-500 italic">
                Kartu ini sah sebagai identitas peminjaman di Perpustakaan SMKN 1 Selayar
              </p>
            </div>
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
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4" />
            )}
            Unduh PDF (ID-1)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
