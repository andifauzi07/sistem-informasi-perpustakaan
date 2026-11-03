import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useImportMembersMutation, type ImportRowPayload, type ImportResultItem } from '../api/mutations'
import { parseMemberRows, type ParsedMemberRow } from '../excel-parser'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Major = Database['public']['Tables']['majors']['Row']

interface ImportMembersDialogProps {
  majors: Major[]
}

type ParsedRow = ParsedMemberRow

const BATCH_SIZE = 50

export function ImportMembersDialog({ majors }: ImportMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importResults, setImportResults] = useState<ImportResultItem[] | null>(null)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportMembersMutation()

  // Unduh template resmi Excel/CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      'nomor_induk,nama,peran,kelas,kode_jurusan,mapel,telepon\n' +
      '2110001,Ahmad Siswa,siswa,X TKJ 1,TKJ,,081234567890\n' +
      '198205012010011002,Budi Guru,guru,,,Matematika,081234567891\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'template_anggota_sip.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Template impor berhasil diunduh')
  }

  // Baca file Excel secara Lazy Load (NFR-PE-03)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setFileName(file.name)
    setImportResults(null)
    setImportProgress(null)

    try {
      // Lazy load library read-excel-file hanya saat dibutuhkan
      const { default: readXlsxFile } = await import('read-excel-file/browser')
      const parsedOutput = (await readXlsxFile(file)) as unknown
      const rawRows: unknown[][] = Array.isArray(parsedOutput)
        ? (parsedOutput.length > 0 && typeof parsedOutput[0] === 'object' && parsedOutput[0] !== null && 'data' in parsedOutput[0]
            ? (parsedOutput[0] as { data: unknown[][] }).data
            : (parsedOutput as unknown[][]))
        : []

      if (!rawRows || rawRows.length <= 1) {
        toast.error('Berkas Excel kosong atau tidak memiliki baris data.')
        setIsParsing(false)
        return
      }

      // Baris pertama adalah header
      const validated = parseMemberRows(rawRows.slice(1), majors)
      setParsedRows(validated)
    } catch (err) {
      toast.error('Gagal membaca berkas Excel: ' + toUserMessage(err))
    } finally {
      setIsParsing(false)
    }
  }

  // Eksekusi proses impor dalam batch ≤ 50 baris
  const handleProcessImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid)
    if (validRows.length === 0) {
      toast.error('Tidak ada baris data valid untuk diimpor.')
      return
    }

    const majorCodeMap = new Map(majors.map((m) => [m.code.toUpperCase(), m.id]))
    const allResults: ImportResultItem[] = []

    // Masukkan baris yang sudah gagal di validasi awal ke laporan
    for (const invalid of parsedRows.filter((r) => !r.isValid)) {
      allResults.push({
        row: invalid.memberCode || 'Data Tidak Lengkap',
        status: 'gagal',
        message: invalid.errorReason,
      })
    }

    const payloads: ImportRowPayload[] = validRows.map((r) => ({
      member_code: r.memberCode,
      full_name: r.fullName,
      role: r.role,
      class_name: r.className || undefined,
      major_id: r.majorCode ? majorCodeMap.get(r.majorCode) : undefined,
      subject: r.subject || undefined,
      phone: r.phone || undefined,
    }))

    const totalBatches = Math.ceil(payloads.length / BATCH_SIZE)

    try {
      for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
        const chunk = payloads.slice(i, i + BATCH_SIZE)
        const currentBatch = Math.floor(i / BATCH_SIZE) + 1
        setImportProgress({ current: currentBatch, total: totalBatches })

        const res = await importMutation.mutateAsync(chunk)
        if (res.results) {
          allResults.push(...res.results)
        }
      }

      setImportResults(allResults)
      toast.success('Proses impor selesai!')
    } catch (err) {
      toast.error('Galat saat proses impor: ' + toUserMessage(err))
    } finally {
      setImportProgress(null)
    }
  }

  // Unduh kredensial akun baru yang dibuat
  const handleDownloadCredentials = () => {
    if (!importResults) return
    const created = importResults.filter((r) => r.status === 'dibuat' && r.temp_password)
    if (created.length === 0) {
      toast.info('Tidak ada akun baru yang memerlukan password sementara.')
      return
    }

    const csvContent =
      'nomor_induk,password_sementara\n' +
      created.map((c) => `${c.row},${c.temp_password}`).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'kredensial_anggota_baru.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Berkas kredensial berhasil diunduh')
  }

  const handleResetDialog = () => {
    setFileName(null)
    setParsedRows([])
    setImportResults(null)
    setImportProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setOpen(false)
  }

  const validCount = parsedRows.filter((r) => r.isValid).length
  const invalidCount = parsedRows.filter((r) => !r.isValid).length

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? setOpen(true) : handleResetDialog())}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="size-4" />
          <span>Impor Excel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            <span>Impor Anggota Massal dari Excel</span>
          </DialogTitle>
          <DialogDescription>
            Unggah berkas spreadsheet format .xlsx sesuai template. Baris akan diproses secara bertahap (batch ≤ 50 baris).
          </DialogDescription>
        </DialogHeader>

        {/* Hasil Akhir Impor */}
        {importResults ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-4 text-center">
              <div>
                <span className="text-xs text-muted-foreground">Akun Dibuat</span>
                <p className="text-2xl font-bold text-emerald-600">
                  {importResults.filter((r) => r.status === 'dibuat').length}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Diperbarui</span>
                <p className="text-2xl font-bold text-blue-600">
                  {importResults.filter((r) => r.status === 'diperbarui').length}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Gagal</span>
                <p className="text-2xl font-bold text-destructive">
                  {importResults.filter((r) => r.status === 'gagal').length}
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Induk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((res, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono font-medium">{res.row}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            res.status === 'dibuat'
                              ? 'default'
                              : res.status === 'diperbarui'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {res.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {res.message || (res.temp_password ? `Password: ${res.temp_password}` : '—')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={handleDownloadCredentials}
                className="gap-2"
              >
                <Download className="size-4" />
                <span>Unduh Daftar Kredensial (.csv)</span>
              </Button>
              <Button onClick={handleResetDialog}>Tutup</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Template dan Unggah */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold">Gunakan Format Template Resmi</span>
                <p className="text-xs text-muted-foreground">
                  Pastikan kolom sesuai dengan format: nomor_induk, nama, peran, kelas, kode_jurusan, mapel, telepon.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 shrink-0"
              >
                <Download className="size-4" />
                <span>Unduh Template</span>
              </Button>
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  void handleFileChange(e)
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition hover:bg-muted/50"
              >
                <Upload className="mb-2 size-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {fileName ? fileName : 'Pilih atau seret berkas Excel (.xlsx) ke sini'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Maksimal 500 baris per berkas untuk performa optimal
                </span>
              </div>
            </div>

            {/* Pratinjau Baris */}
            {isParsing && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span>Membaca dan memvalidasi berkas spreadsheet...</span>
              </div>
            )}

            {parsedRows.length > 0 && !isParsing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Total baris: <strong className="text-foreground">{parsedRows.length}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="size-3.5" /> {validCount} Valid
                    </span>
                    {invalidCount > 0 && (
                      <span className="flex items-center gap-1 text-destructive font-medium">
                        <AlertCircle className="size-3.5" /> {invalidCount} Tidak Valid
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nomor Induk</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Validasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, i) => (
                        <TableRow key={i} className={!row.isValid ? 'bg-destructive/5' : undefined}>
                          <TableCell className="font-mono text-xs">{row.memberCode}</TableCell>
                          <TableCell className="text-xs">{row.fullName}</TableCell>
                          <TableCell className="text-xs">{row.role}</TableCell>
                          <TableCell className="text-xs">{row.className || '—'}</TableCell>
                          <TableCell className="text-xs">
                            {row.isValid ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                Valid
                              </Badge>
                            ) : (
                              <span className="text-destructive font-medium">{row.errorReason}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Indikator Progres Import */}
            {importProgress && (
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted p-3 text-sm font-medium">
                <RefreshCw className="size-4 animate-spin text-primary" />
                <span>
                  Memproses batch {importProgress.current} dari {importProgress.total}...
                </span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={handleResetDialog} disabled={Boolean(importProgress)}>
                Batal
              </Button>
              <Button
                onClick={() => {
                  void handleProcessImport()
                }}
                disabled={validCount === 0 || Boolean(importProgress)}
              >
                {importProgress ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Mengimpor...
                  </>
                ) : (
                  `Mulai Impor (${validCount} baris)`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
