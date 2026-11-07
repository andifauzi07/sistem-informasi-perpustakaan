import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Plus,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  Download,
  Edit,
  Trash2,
  EyeOff,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  myMaterialsQueryOptions,
  type TeachingMaterialItem,
} from '@/features/materials/api/queries'
import { majorsQueryOptions } from '@/features/members/api/queries'
import { useDownloadMaterialMutation } from '@/features/materials/api/mutations'
import { UploadMaterialDialog } from '@/features/materials/components/upload-material-dialog'
import { EditMaterialDialog } from '@/features/materials/components/edit-material-dialog'
import { DeleteMaterialDialog } from '@/features/materials/components/delete-material-dialog'

export const Route = createFileRoute('/_app/guru/bahan-ajar/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(myMaterialsQueryOptions()),
      context.queryClient.ensureQueryData(majorsQueryOptions()),
    ])
  },
  component: GuruBahanAjarPage,
})

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileName: string, mimeType: string) {
  const lower = (fileName + ' ' + mimeType).toLowerCase()
  if (lower.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
  if (lower.includes('sheet') || lower.includes('xls'))
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
  if (lower.includes('presentation') || lower.includes('ppt'))
    return <Presentation className="h-4 w-4 text-amber-500" />
  return <File className="h-4 w-4 text-blue-500" />
}

function GuruBahanAjarPage() {
  const { profile } = Route.useRouteContext()
  const { data: myMaterials } = useSuspenseQuery(myMaterialsQueryOptions())
  const { data: majors } = useSuspenseQuery(majorsQueryOptions())

  const downloadMutation = useDownloadMaterialMutation()
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TeachingMaterialItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TeachingMaterialItem | null>(null)

  const handleDownload = async (item: TeachingMaterialItem) => {
    try {
      setDownloadingId(item.id)
      await downloadMutation.mutateAsync({
        id: item.id,
        filePath: item.file_path,
        fileName: item.file_name,
      })
      toast.success(`Mengunduh ${item.file_name}`)
    } catch (err) {
      toast.error('Gagal mengunduh berkas: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kelola Bahan Ajar Saya
          </h1>
          <p className="text-sm text-muted-foreground">
            Unggah modul, materi pelajaran, dan lembar kerja untuk diakses siswa (FR-MAT-01, FR-MAT-02).
          </p>
        </div>

        <Button onClick={() => setIsUploadOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Unggah Bahan Ajar Baru
        </Button>
      </div>

      {/* Konten Utama */}
      {myMaterials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              Belum ada bahan ajar yang diunggah
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Mulai bagikan materi pelajaran digital kepada siswa dengan menekan tombol unggah di atas.
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="outline"
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Unggah Materi Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Daftar Bahan Ajar</CardTitle>
            <CardDescription className="text-xs">
              Total {myMaterials.length} dokumen telah diunggah.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Tampilan Desktop Tabel */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materi & Berkas</TableHead>
                    <TableHead>Sasaran</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead>Statistik</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myMaterials.map((item) => {
                    const isHidden = item.status === 'hidden'
                    const isDownloading = downloadingId === item.id

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">{getFileIcon(item.file_name, item.mime_type)}</div>
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-900 text-sm leading-snug">
                                {item.title}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span>{item.subject}</span>
                                <span>&bull;</span>
                                <span className="font-mono text-[11px]">{item.file_name}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="font-medium text-slate-700">
                              {item.grade_level ? `Kelas ${item.grade_level}` : 'Semua Kelas'}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              {item.major ? item.major.name : 'Semua Jurusan'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {formatBytes(item.file_size)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {item.download_count}× diunduh
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isHidden ? (
                            <div className="space-y-1">
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <EyeOff className="h-3 w-3" />
                                Disembunyikan
                              </Badge>
                              {item.hidden_reason && (
                                <p className="text-[10px] text-muted-foreground italic max-w-[150px] truncate" title={item.hidden_reason}>
                                  {item.hidden_reason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                              Terbit
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                void handleDownload(item)
                              }}
                              disabled={isDownloading}
                              title="Unduh Berkas"
                            >
                              {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditTarget(item)}
                              title="Ubah Metadata"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(item)}
                              className="text-destructive hover:text-destructive"
                              title="Hapus Bahan Ajar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Tampilan Mobile Kartu */}
            <div className="divide-y md:hidden">
              {myMaterials.map((item) => {
                const isHidden = item.status === 'hidden'
                const isDownloading = downloadingId === item.id

                return (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(item.file_name, item.mime_type)}
                        <span className="font-semibold text-sm text-slate-900 leading-tight">
                          {item.title}
                        </span>
                      </div>
                      {isHidden ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Disembunyikan
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                          Terbit
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>Mapel: <span className="font-medium text-slate-800">{item.subject}</span></div>
                      <div>
                        Sasaran: {item.grade_level ? `Kelas ${item.grade_level}` : 'Semua Kelas'} &bull; {item.major ? item.major.name : 'Semua Jurusan'}
                      </div>
                      <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                        <span>{formatBytes(item.file_size)}</span>
                        <span>&bull;</span>
                        <span>{item.download_count}× diunduh</span>
                      </div>
                    </div>

                    {isHidden && item.hidden_reason && (
                      <div className="rounded bg-amber-50 p-2 text-xs text-amber-900 border border-amber-200">
                        Alasan: {item.hidden_reason}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 border-t pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void handleDownload(item)
                        }}
                        disabled={isDownloading}
                        className="gap-1.5 text-xs"
                      >
                        {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Unduh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTarget(item)}
                        className="gap-1.5 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Ubah
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        className="gap-1.5 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Unggah */}
      <UploadMaterialDialog
        majors={majors}
        defaultSubject={profile.subject}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />

      {/* Dialog Edit Metadata */}
      <EditMaterialDialog
        material={editTarget}
        majors={majors}
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />

      {/* Dialog Hapus */}
      <DeleteMaterialDialog
        material={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  )
}
