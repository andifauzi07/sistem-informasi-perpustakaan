import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
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
import { memberFinesQueryOptions } from '@/features/fines/api/queries'
import { FINE_STATUS_LABELS, FINE_TYPE_LABELS } from '@/lib/labels'
import { formatDate, formatRupiah } from '@/lib/format'

export const Route = createFileRoute('/_app/denda')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      memberFinesQueryOptions(context.profile.id)
    )
  },
  component: DendaSayaPage,
})

function DendaSayaPage() {
  const { profile } = Route.useRouteContext()
  const { data } = useSuspenseQuery(memberFinesQueryOptions(profile.id))

  const { fines, unpaidTotal } = data

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="size-6 text-primary" />
          <span>Denda Saya</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Rincian denda keterlambatan, kerusakan, atau kehilangan buku perpustakaan.
        </p>
      </div>

      {/* Ringkasan Total Belum Lunas (FR-FIN-05, TC-FIN-04) */}
      <Card
        className={
          unpaidTotal > 0
            ? 'border-destructive/40 bg-destructive/5'
            : 'border-emerald-500/30 bg-emerald-500/5'
        }
      >
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {unpaidTotal > 0 ? (
              <AlertTriangle className="size-6 text-destructive shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Denda Belum Lunas
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {formatRupiah(unpaidTotal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {unpaidTotal > 0
                  ? 'Pembayaran denda dilakukan secara tunai di meja layanan perpustakaan.'
                  : 'Anda tidak memiliki tunggakan denda yang belum dibayar.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daftar Rincian Denda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Tagihan & Riwayat Denda ({fines.length})</CardTitle>
          <CardDescription className="text-xs">
            Menampilkan seluruh catatan denda beserta status penyelesaiannya.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Buku & Eksemplar</TableHead>
                <TableHead>Jenis Denda</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Tidak ada catatan denda untuk akun Anda.
                  </TableCell>
                </TableRow>
              ) : (
                fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="text-xs">
                      {formatDate(fine.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {fine.loan?.copy?.book?.title || 'Buku Perpustakaan'}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Kode: {fine.loan?.copy?.code || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{FINE_TYPE_LABELS[fine.type]}</div>
                      {fine.days_late && (
                        <span className="text-muted-foreground">
                          ({fine.days_late} hari terlambat)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatRupiah(fine.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          fine.status === 'unpaid'
                            ? 'destructive'
                            : fine.status === 'paid'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {FINE_STATUS_LABELS[fine.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fine.status === 'paid' && fine.paid_at
                        ? `Lunas pada ${formatDate(fine.paid_at)}`
                        : fine.status === 'waived' && fine.waived_reason
                          ? `Dibebaskan: ${fine.waived_reason}`
                          : fine.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
