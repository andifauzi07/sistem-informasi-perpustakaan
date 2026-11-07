import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { History, Calendar, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { memberHistoryFilterSchema } from '@/features/circulation/schemas'
import { memberLoanHistoryQueryOptions } from '@/features/circulation/api/queries'
import { LOAN_STATUS_LABELS, RETURN_CONDITION_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/format'

export const Route = createFileRoute('/_app/riwayat')({
  validateSearch: (search) => memberHistoryFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      memberLoanHistoryQueryOptions(context.profile.id, deps)
    )
  },
  component: RiwayatPeminjamanPage,
})

function RiwayatPeminjamanPage() {
  const { profile } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: historyResult } = useSuspenseQuery(
    memberLoanHistoryQueryOptions(profile.id, search)
  )

  const updateSearch = (patch: Partial<typeof search>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        page: patch.page ?? 1,
      }),
    })
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="size-6 text-primary" />
          <span>Riwayat Peminjaman</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftar buku yang telah selesai dikembalikan atau tercatat hilang.
        </p>
      </div>

      {/* Filter Periode & Status (FR-CIR-05) */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="from-date">Dari Tanggal Pinjam</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="from-date"
                  type="date"
                  value={search.from || ''}
                  onChange={(e) => updateSearch({ from: e.target.value || undefined })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to-date">Sampai Tanggal Pinjam</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="to-date"
                  type="date"
                  value={search.to || ''}
                  onChange={(e) => updateSearch({ to: e.target.value || undefined })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status Akhir</Label>
              <Select
                value={search.status}
                onValueChange={(val) =>
                  updateSearch({ status: val as 'all' | 'returned' | 'lost' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua (Dikembalikan & Hilang)</SelectItem>
                  <SelectItem value="returned">Dikembalikan</SelectItem>
                  <SelectItem value="lost">Hilang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel / Kartu Riwayat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Total Riwayat ({historyResult.count})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul Buku</TableHead>
                <TableHead>Kode Eksemplar</TableHead>
                <TableHead>Tgl Pinjam</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Tgl Selesai</TableHead>
                <TableHead>Status & Kondisi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyResult.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Belum ada riwayat peminjaman pada periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                historyResult.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.title || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.copy_code || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.loaned_at ? formatDate(item.loaned_at) : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.due_date ? formatDate(item.due_date) : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.returned_at
                        ? formatDate(item.returned_at)
                        : item.lost_at
                          ? formatDate(item.lost_at)
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={item.status === 'lost' ? 'destructive' : 'secondary'}
                        >
                          {item.status ? LOAN_STATUS_LABELS[item.status] : '-'}
                        </Badge>
                        {item.return_condition && (
                          <span className="text-xs text-muted-foreground">
                            ({RETURN_CONDITION_LABELS[item.return_condition as 'good' | 'damaged'] || item.return_condition})
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginasi */}
      {historyResult.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Halaman {historyResult.page} dari {historyResult.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={historyResult.page <= 1}
              onClick={() => updateSearch({ page: historyResult.page - 1 })}
            >
              <ArrowLeft className="size-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={historyResult.page >= historyResult.totalPages}
              onClick={() => updateSearch({ page: historyResult.page + 1 })}
            >
              Berikutnya
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
