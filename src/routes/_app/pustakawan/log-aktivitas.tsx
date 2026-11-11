import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  activityLogFilterSchema,
  ACTIVITY_ACTIONS,
  type ActivityLogFilter,
} from '@/features/activity-log/schemas'
import {
  activityLogsQueryOptions,
  officersListQueryOptions,
  type ActivityLogItem,
} from '@/features/activity-log/api/queries'
import { formatDateTime } from '@/lib/format'

export const Route = createFileRoute('/_app/pustakawan/log-aktivitas')({
  validateSearch: (search) => activityLogFilterSchema.parse(search),
  loader: ({ context, location }) => {
    const filter = activityLogFilterSchema.parse(location.search)
    return Promise.all([
      context.queryClient.ensureQueryData(activityLogsQueryOptions(filter)),
      context.queryClient.ensureQueryData(officersListQueryOptions()),
    ])
  },
  component: LogAktivitasPage,
})

function LogAktivitasPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: logResult } = useQuery(activityLogsQueryOptions(search))
  const { data: officers } = useQuery(officersListQueryOptions())

  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null)

  const updateFilters = (patch: Partial<ActivityLogFilter>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        page: patch.page !== undefined ? patch.page : 1,
      }),
    })
  }

  const logs = logResult?.data ?? []
  const totalCount = logResult?.count ?? 0
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.max(1, search.page)

  const getActionBadge = (action: string) => {
    if (action.startsWith('loan_request.')) {
      return <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">{action}</Badge>
    }
    if (action.startsWith('loan.')) {
      return <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">{action}</Badge>
    }
    if (action.startsWith('fine.')) {
      return <Badge variant="outline" className="border-purple-500 text-purple-700 dark:text-purple-400">{action}</Badge>
    }
    if (action.startsWith('member.')) {
      return <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400">{action}</Badge>
    }
    if (action.startsWith('policy.') || action.startsWith('setting.')) {
      return <Badge variant="outline" className="border-indigo-500 text-indigo-700 dark:text-indigo-400">{action}</Badge>
    }
    return <Badge variant="secondary">{action}</Badge>
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Log Aktivitas Sistem</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Jejak audit seluruh perubahan transaksi sirkulasi, eksemplar, denda, dan akun anggota (FR-LOG-01, FR-LOG-02)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filter Jenis Aksi */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Jenis Aksi
              </label>
              <select
                value={search.action}
                onChange={(e) => updateFilters({ action: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Semua Jenis Aksi</option>
                {ACTIVITY_ACTIONS.filter((a) => a !== 'all').map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Petugas */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Petugas / Aktor
              </label>
              <select
                value={search.officerId}
                onChange={(e) => updateFilters({ officerId: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Semua Petugas / Sistem</option>
                {officers?.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.full_name} ({officer.member_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Dari Tanggal */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Dari Tanggal
              </label>
              <Input
                type="date"
                value={search.from}
                onChange={(e) => updateFilters({ from: e.target.value })}
                className="text-xs h-8"
              />
            </div>

            {/* Filter Sampai Tanggal */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Sampai Tanggal
              </label>
              <Input
                type="date"
                value={search.to}
                onChange={(e) => updateFilters({ to: e.target.value })}
                className="text-xs h-8"
              />
            </div>
          </div>

          {(search.action !== 'all' || search.officerId || search.from || search.to) && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  void navigate({
                    search: { action: 'all', officerId: '', from: '', to: '', page: 1 },
                  })
                }
                className="text-xs gap-1.5"
              >
                <RotateCcw className="size-3" />
                <span>Reset Filter</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabel Log Aktivitas */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b px-5 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Daftar Catatan Audit ({totalCount} Entri)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-40">Waktu (WITA)</th>
                  <th className="py-2.5 px-4 font-semibold">Aksi</th>
                  <th className="py-2.5 px-4 font-semibold">Aktor / Petugas</th>
                  <th className="py-2.5 px-4 font-semibold">Entitas</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Tidak ada catatan aktivitas yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="py-2.5 px-4">{getActionBadge(item.action)}</td>
                      <td className="py-2.5 px-4">
                        {item.actor ? (
                          <div className="leading-tight">
                            <span className="font-medium text-foreground block">
                              {item.actor.full_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {item.actor.member_code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Sistem / Otomatis</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        <span className="text-muted-foreground">{item.entity_type}</span>
                        {item.entity_id && (
                          <span className="text-foreground ml-1">#{item.entity_id}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(item)}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Info className="size-3.5" />
                          <span>Detail</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginasi */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => updateFilters({ page: currentPage - 1 })}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Sebelumnya</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => updateFilters({ page: currentPage + 1 })}
                  className="h-8 gap-1 text-xs"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Rincian Log */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Rincian Log Audit #{selectedLog?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3">
                <div>
                  <span className="text-muted-foreground block">Waktu Pencatatan:</span>
                  <span className="font-mono font-medium">
                    {formatDateTime(selectedLog.created_at)} WITA
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Aksi Sistem:</span>
                  <span className="font-medium">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Petugas / Aktor:</span>
                  <span className="font-medium">
                    {selectedLog.actor?.full_name ?? 'Sistem Otomatis'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Entitas:</span>
                  <span className="font-mono font-medium">
                    {selectedLog.entity_type} {selectedLog.entity_id ? `(#${selectedLog.entity_id})` : ''}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold block mb-1">Data Payload Detail (JSON):</span>
                <pre className="rounded-lg border bg-muted/60 p-3 text-[11px] font-mono overflow-x-auto max-h-60 [scrollbar-width:thin]">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
