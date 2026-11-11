import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  BookOpen,
  Receipt,
  Clock,
  Layers,
  Users,
  Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  reportFilterSchema,
  REPORT_LABELS,
  type ReportFilter,
} from '@/features/reports/schemas'
import {
  reportDataQueryOptions,
  getDefaultReportPeriod,
  type FineReportRow,
} from '@/features/reports/api/queries'
import { librarySettingsQueryOptions } from '@/features/settings/api/queries'
import {
  getReportColumns,
  formatReportCellValue,
  exportReportToExcel,
  exportReportToPdf,
} from '@/features/reports/utils'
import { formatDate, formatRupiah } from '@/lib/format'

export const Route = createFileRoute('/_app/pustakawan/laporan/')({
  validateSearch: (search) => reportFilterSchema.parse(search),
  loader: ({ context, location }) => {
    const filter = reportFilterSchema.parse(location.search)
    return Promise.all([
      context.queryClient.ensureQueryData(reportDataQueryOptions(filter)),
      context.queryClient.ensureQueryData(librarySettingsQueryOptions()),
    ])
  },
  component: LaporanPage,
})

function LaporanPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { profile } = Route.useRouteContext()

  const defaultPeriod = getDefaultReportPeriod()
  const activeFrom = search.from || defaultPeriod.from
  const activeTo = search.to || defaultPeriod.to

  const effectiveFilter: ReportFilter = {
    type: search.type,
    from: activeFrom,
    to: activeTo,
  }

  const { data: rows = [], isLoading } = useQuery(
    reportDataQueryOptions(effectiveFilter)
  )
  const { data: settings } = useQuery(librarySettingsQueryOptions())

  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const updateFilters = (patch: Partial<ReportFilter>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    })
  }

  const columns = getReportColumns(search.type)
  const reportTitle = REPORT_LABELS[search.type]
  const periodText =
    search.type === 'inventory'
      ? `Per ${formatDate(new Date())}`
      : `${formatDate(activeFrom)} s.d. ${formatDate(activeTo)}`

  // Handler Ekspor Excel (FR-RPT-09, TC-RPT-02)
  const handleExportExcel = async () => {
    if (rows.length === 0) {
      toast.warning('Tidak ada data laporan untuk diekspor.')
      return
    }

    try {
      setIsExportingExcel(true)
      await exportReportToExcel({
        type: search.type,
        reportTitle,
        periodText,
        officerName: profile.full_name,
        schoolName: settings?.school_name ?? 'SMKN 1 Selayar',
        libraryName: settings?.library_name ?? 'Perpustakaan SMKN 1 Selayar',
        address: settings?.address ?? 'Jl. Pahlawan No. 1, Benteng, Kepulauan Selayar',
        data: rows,
      })
      toast.success('Laporan berhasil diekspor ke Excel (.xlsx)')
    } catch (err) {
      toast.error('Gagal mengekspor laporan ke Excel')
      console.error(err)
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Handler Ekspor PDF (FR-RPT-09, TC-RPT-02)
  const handleExportPdf = async () => {
    if (rows.length === 0) {
      toast.warning('Tidak ada data laporan untuk diekspor.')
      return
    }

    try {
      setIsExportingPdf(true)
      await exportReportToPdf({
        type: search.type,
        reportTitle,
        periodText,
        officerName: profile.full_name,
        schoolName: settings?.school_name ?? 'SMKN 1 Selayar',
        libraryName: settings?.library_name ?? 'Perpustakaan SMKN 1 Selayar',
        address: settings?.address ?? 'Jl. Pahlawan No. 1, Benteng, Kepulauan Selayar',
        data: rows,
      })
      toast.success('Laporan berhasil diekspor ke PDF (A4)')
    } catch (err) {
      toast.error('Gagal mengekspor laporan ke PDF')
      console.error(err)
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Rekapitulasi Statistik Khusus Denda (TC-RPT-04: total = lunas + belum + bebas)
  const finesSummary =
    search.type === 'fines'
      ? (rows as FineReportRow[]).reduce(
          (acc, f) => {
            acc.total += f.amount
            if (f.status === 'paid') acc.paid += f.amount
            if (f.status === 'unpaid') acc.unpaid += f.amount
            if (f.status === 'waived') acc.waived += f.amount
            return acc
          },
          { total: 0, paid: 0, unpaid: 0, waived: 0 }
        )
      : null

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Laporan Perpustakaan</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Rekapitulasi sirkulasi, pengembalian, keterlambatan, denda, dan inventaris dengan ekspor resmi (FR-RPT-01 s.d. FR-RPT-09)
          </p>
        </div>

        {/* Tombol Aksi Ekspor (FR-RPT-09) */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportExcel()}
            disabled={isExportingExcel || rows.length === 0}
            className="gap-1.5 text-xs font-medium"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" />
            <span>{isExportingExcel ? 'Mengekspor...' : 'Ekspor Excel'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => void handleExportPdf()}
            disabled={isExportingPdf || rows.length === 0}
            className="gap-1.5 text-xs font-medium shadow-xs"
          >
            <FileText className="size-4" />
            <span>{isExportingPdf ? 'Mengekspor...' : 'Ekspor PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Kontrol Filter & Pilihan Laporan (FR-RPT-08) */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-4">
          {/* Tabs Pilihan Jenis Laporan */}
          <div className="flex flex-wrap gap-1.5 border-b pb-3">
            {(
              [
                { type: 'loans', label: 'Peminjaman', icon: BookOpen },
                { type: 'returns', label: 'Pengembalian', icon: RotateCcw },
                { type: 'overdue', label: 'Keterlambatan', icon: Clock },
                { type: 'fines', label: 'Denda', icon: Receipt },
                { type: 'inventory', label: 'Inventaris', icon: Layers },
                { type: 'member_activity', label: 'Aktivitas Anggota', icon: Users },
                { type: 'popular_books', label: 'Top 10 Populer', icon: Award },
              ] as const
            ).map((item) => {
              const Icon = item.icon
              const isActive = search.type === item.type
              return (
                <button
                  key={item.type}
                  onClick={() => updateFilters({ type: item.type })}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Form Pemilih Periode Tanggal (WITA) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                Periode Laporan:
              </span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={activeFrom}
                  onChange={(e) => updateFilters({ from: e.target.value })}
                  disabled={search.type === 'inventory'}
                  className="text-xs h-8 w-36"
                />
                <span className="text-xs text-muted-foreground">s.d.</span>
                <Input
                  type="date"
                  value={activeTo}
                  onChange={(e) => updateFilters({ to: e.target.value })}
                  disabled={search.type === 'inventory'}
                  className="text-xs h-8 w-36"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateFilters({
                    from: defaultPeriod.from,
                    to: defaultPeriod.to,
                  })
                }
                className="text-xs h-8"
              >
                <span>Bulan Berjalan</span>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Total Data: <span className="font-semibold text-foreground">{rows.length}</span> baris
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan Finansial Denda (TC-RPT-04) */}
      {finesSummary && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Total Denda Ditagih
              </span>
              <span className="mt-1 text-xl font-bold tracking-tight block">
                {formatRupiah(finesSummary.total)}
              </span>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Denda Lunas
              </span>
              <span className="mt-1 text-xl font-bold tracking-tight text-emerald-600 block">
                {formatRupiah(finesSummary.paid)}
              </span>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Denda Belum Lunas
              </span>
              <span className="mt-1 text-xl font-bold tracking-tight text-amber-600 block">
                {formatRupiah(finesSummary.unpaid)}
              </span>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Denda Dibebaskan
              </span>
              <span className="mt-1 text-xl font-bold tracking-tight text-slate-500 block">
                {formatRupiah(finesSummary.waived)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pratinjau Tabel Interaktif (FR-RPT-08, TC-RPT-01) */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b px-5 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Pratinjau: {reportTitle}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {periodText}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-2.5 px-3 font-semibold ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                      Memuat data laporan...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                      Tidak ada data untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      {columns.map((col) => {
                        const rowRecord = row as Record<string, unknown>
                        const formatted = formatReportCellValue(
                          search.type,
                          col.key,
                          rowRecord[col.key],
                          row,
                          idx
                        )
                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3 ${
                              col.align === 'center'
                                ? 'text-center'
                                : col.align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
                            } ${col.key === 'title' ? 'font-medium text-foreground' : ''}`}
                          >
                            {col.key === 'status' || col.key === 'fine_status' ? (
                              <Badge
                                variant={
                                  formatted === 'Kembali' || formatted === 'Lunas'
                                    ? 'default'
                                    : formatted === 'Aktif' || formatted === 'Belum Lunas'
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className="text-[10px]"
                              >
                                {formatted}
                              </Badge>
                            ) : (
                              formatted
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
