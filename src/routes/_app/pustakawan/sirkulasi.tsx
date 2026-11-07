import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ScanBarcode,
  UserCheck,
  BookUp,
  BookDown,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Clock,
  UserX,
  History,
} from 'lucide-react'
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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CodeInput } from '@/components/CodeInput'
import {
  lookupMemberByCode,
  lookupCopyByCode,
  returnRequestedLoansQueryOptions,
  type MemberLookupResult,
  type CopyLookupResult,
} from '@/features/circulation/api/queries'
import {
  useCheckoutCopyMutation,
  useCheckinCopyMutation,
} from '@/features/circulation/api/mutations'
import { ROLE_LABELS } from '@/lib/labels'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/pustakawan/sirkulasi')({
  component: MejaSirkulasiPage,
})

interface SessionTransactionLog {
  id: string
  mode: 'checkout' | 'checkin'
  timestamp: string
  memberInfo: string
  copyCode: string
  bookTitle: string
  summaryText: string
}

function MejaSirkulasiPage() {
  const [activeTab, setActiveTab] = useState<'pinjam' | 'kembali'>('pinjam')

  // State Mode Pinjam (Checkout — FR-CIR-09)
  const [memberCodeInput, setMemberCodeInput] = useState('')
  const [isLookingUpMember, setIsLookingUpMember] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberLookupResult | null>(null)
  const [checkoutCopyInput, setCheckoutCopyInput] = useState('')

  // State Mode Kembali (Check-in — FR-CIR-10)
  const [checkinCopyInput, setCheckinCopyInput] = useState('')
  const [isLookingUpCopy, setIsLookingUpCopy] = useState(false)
  const [scannedCopyForCheckin, setScannedCopyForCheckin] =
    useState<CopyLookupResult | null>(null)
  const [returnCondition, setReturnCondition] = useState<'good' | 'damaged'>('good')
  const [damageFineInput, setDamageFineInput] = useState('')
  const [checkinNotes, setCheckinNotes] = useState('')

  // Riwayat 10 transaksi terakhir sesi ini (PRD §15.3)
  const [sessionHistory, setSessionHistory] = useState<SessionTransactionLog[]>([])

  // Antrean pengembalian menunggu konfirmasi (FR-CIR-11)
  const { data: returnQueue = [] } = useQuery(returnRequestedLoansQueryOptions())

  const checkoutMutation = useCheckoutCopyMutation()
  const checkinMutation = useCheckinCopyMutation()

  const appendSessionLog = (entry: Omit<SessionTransactionLog, 'id' | 'timestamp'>) => {
    setSessionHistory((prev) => [
      {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 9),
    ])
  }

  // Langkah 1 Mode Pinjam: Cari / Scan Nomor Induk Anggota
  const handleLookupMember = async (code: string) => {
    setIsLookingUpMember(true)
    try {
      const member = await lookupMemberByCode(code)
      setSelectedMember(member)
      setCheckoutCopyInput('')
      toast.success(`Anggota dipilih: ${member.full_name} (${member.member_code})`)
    } catch (err) {
      toast.error(toUserMessage(err))
    } finally {
      setIsLookingUpMember(false)
    }
  }

  // Langkah 2 Mode Pinjam: Scan / Proses Kode Eksemplar untuk Anggota Terpilih
  const handleCheckoutCopy = async (copyCode: string) => {
    if (!selectedMember) return
    try {
      const loan = await checkoutMutation.mutateAsync({
        memberId: selectedMember.id,
        copyCode,
      })

      const dueDateText = loan?.due_date ? formatDate(loan.due_date) : '-'
      toast.success(
        `Peminjaman berhasil! Kode: ${copyCode.toUpperCase()} • Jatuh tempo: ${dueDateText}`
      )

      appendSessionLog({
        mode: 'checkout',
        memberInfo: `${selectedMember.full_name} (${selectedMember.member_code})`,
        copyCode: copyCode.toUpperCase(),
        bookTitle: `Eksemplar ${copyCode.toUpperCase()}`,
        summaryText: `Jatuh tempo: ${dueDateText}`,
      })

      setCheckoutCopyInput('')
      // Segarkan data ringkasan anggota agar kuota & daftar approved ter-update (tetap di langkah 2 sesuai PRD §15.3)
      const refreshedMember = await lookupMemberByCode(selectedMember.member_code)
      setSelectedMember(refreshedMember)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  // Langkah 1 Mode Kembali: Scan / Cari Eksemplar yang Dikembalikan
  const handleLookupCopyForCheckin = async (code: string) => {
    setIsLookingUpCopy(true)
    try {
      const copyInfo = await lookupCopyByCode(code)
      if (copyInfo.copy_status !== 'on_loan' || !copyInfo.active_loan) {
        toast.error(toUserMessage('COPY_NOT_ON_LOAN'))
        setScannedCopyForCheckin(null)
        return
      }
      setScannedCopyForCheckin(copyInfo)
      setReturnCondition('good')
      setDamageFineInput('')
      setCheckinNotes('')
    } catch (err) {
      toast.error(toUserMessage(err))
      setScannedCopyForCheckin(null)
    } finally {
      setIsLookingUpCopy(false)
    }
  }

  // Langkah 2 Mode Kembali: Konfirmasi Pengembalian
  const handleConfirmCheckin = async () => {
    if (!scannedCopyForCheckin) return

    const parsedDamageFine =
      returnCondition === 'damaged' && damageFineInput.trim()
        ? Number(damageFineInput)
        : undefined

    if (
      returnCondition === 'damaged' &&
      parsedDamageFine !== undefined &&
      (Number.isNaN(parsedDamageFine) || parsedDamageFine <= 0)
    ) {
      toast.error('Nominal denda kerusakan harus berupa angka positif.')
      return
    }

    try {
      const result = await checkinMutation.mutateAsync({
        copyCode: scannedCopyForCheckin.copy_code,
        condition: returnCondition,
        damageFine: parsedDamageFine,
        notes: checkinNotes.trim() || undefined,
      })

      const fineInfo =
        result.late_fine > 0 || result.damage_fine > 0
          ? `Denda tercatat: ${formatRupiah(result.late_fine + result.damage_fine)}`
          : 'Tepat waktu (Tanpa denda)'

      toast.success(
        `Pengembalian berhasil dikonfirmasi! ${fineInfo}`
      )

      appendSessionLog({
        mode: 'checkin',
        memberInfo: `${scannedCopyForCheckin.active_loan?.full_name || '-'} (${scannedCopyForCheckin.active_loan?.member_code || '-'})`,
        copyCode: scannedCopyForCheckin.copy_code,
        bookTitle: scannedCopyForCheckin.book_title,
        summaryText: fineInfo,
      })

      setScannedCopyForCheckin(null)
      setCheckinCopyInput('')
      setReturnCondition('good')
      setDamageFineInput('')
      setCheckinNotes('')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header & Pemilih Tab Mode Pinjam / Kembali */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ScanBarcode className="size-6 text-primary" />
            <span>Meja Layanan Sirkulasi</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Proses peminjaman (checkout) dan pengembalian (check-in) buku dengan scanner USB atau
            kamera.
          </p>
        </div>

        <div className="inline-flex rounded-lg border bg-muted p-1">
          <Button
            type="button"
            variant={activeTab === 'pinjam' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pinjam')}
            className="gap-1.5"
          >
            <BookUp className="size-4" />
            <span>Mode Pinjam (Checkout)</span>
          </Button>
          <Button
            type="button"
            variant={activeTab === 'kembali' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('kembali')}
            className="gap-1.5"
          >
            <BookDown className="size-4" />
            <span>Mode Kembali (Check-in)</span>
            {returnQueue.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {returnQueue.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* TAB 1: MODE PINJAM / CHECKOUT (FR-CIR-09) */}
      {activeTab === 'pinjam' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            {/* Langkah 1: Pilih / Pindai Anggota */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Langkah 1 — Pindai Kartu Anggota (NIS / NIP)
                  </CardTitle>
                  {selectedMember && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(null)
                        setMemberCodeInput('')
                        setCheckoutCopyInput('')
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <UserX className="size-3.5" />
                      <span>Selesai / Ganti Anggota</span>
                    </Button>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Pindai QR Kartu Anggota atau ketik nomor induk lalu tekan Enter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeInput
                  id="checkout-member-input"
                  value={memberCodeInput}
                  onChange={setMemberCodeInput}
                  onSubmit={(code) => {
                    void handleLookupMember(code)
                  }}
                  placeholder="Ketik atau pindai NIS / NIP anggota..."
                  disabled={isLookingUpMember}
                  autoFocus={!selectedMember}
                  submitLabel={isLookingUpMember ? 'Mencari...' : 'Pilih Anggota'}
                />
              </CardContent>
            </Card>

            {/* Langkah 2: Pindai Kode Eksemplar Buku */}
            {selectedMember && (
              <Card className="border-primary/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Langkah 2 — Pindai Barcode Eksemplar Buku
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pindai barcode Code 128 pada buku atau klik salah satu pengajuan siap ambil di
                    panel kanan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeInput
                    id="checkout-copy-input"
                    value={checkoutCopyInput}
                    onChange={setCheckoutCopyInput}
                    onSubmit={(code) => {
                      void handleCheckoutCopy(code)
                    }}
                    placeholder="Pindai barcode eksemplar (misal: B000001)..."
                    disabled={checkoutMutation.isPending || !selectedMember.is_active}
                    autoFocus={true}
                    submitLabel={
                      checkoutMutation.isPending ? 'Memproses...' : 'Konfirmasi Pinjam'
                    }
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel Ringkasan Anggota & Pengajuan Approved */}
          <div className="lg:col-span-5 space-y-6">
            {selectedMember ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserCheck className="size-5 text-emerald-600" />
                        <span>{selectedMember.full_name}</span>
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        {selectedMember.member_code} • {ROLE_LABELS[selectedMember.role]}
                        {selectedMember.class_name ? ` (${selectedMember.class_name})` : ''}
                      </CardDescription>
                    </div>
                    <Badge variant={selectedMember.is_active ? 'default' : 'destructive'}>
                      {selectedMember.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* Statistik Kuota Pinjaman */}
                  <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3">
                    <div>
                      <span className="text-muted-foreground block">Pinjaman Aktif</span>
                      <span className="text-base font-bold text-foreground">
                        {selectedMember.active_loans_count} / {selectedMember.max_active_loans}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Melewati Tenggat</span>
                      <span
                        className={`text-base font-bold ${
                          selectedMember.overdue_loans_count > 0
                            ? 'text-destructive'
                            : 'text-foreground'
                        }`}
                      >
                        {selectedMember.overdue_loans_count} buku
                      </span>
                    </div>
                  </div>

                  {/* Kotak Peringatan Denda Belum Lunas (FR-FIN-07, BR-12, TC-FIN-03) */}
                  {selectedMember.unpaid_fines_total > 0 && (
                    <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <p className="font-semibold">
                          Peringatan Denda Belum Lunas:{' '}
                          {formatRupiah(selectedMember.unpaid_fines_total)}
                        </p>
                        <p className="mt-0.5 opacity-90">
                          Anggota tetap dapat meminjam buku sesuai aturan bisnis BR-12. Ingatkan
                          anggota untuk melunasi denda.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Daftar Pengajuan Approved Siap Diambil */}
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      Pengajuan Disetujui / Siap Diambil (
                      {selectedMember.approved_requests.length})
                    </p>
                    {selectedMember.approved_requests.length === 0 ? (
                      <p className="text-muted-foreground">
                        Tidak ada pengajuan berstatus siap diambil. Peminjaman akan diproses sebagai
                        pinjam langsung (walk-in).
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedMember.approved_requests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between gap-2 rounded-md border bg-background p-2.5"
                          >
                            <div>
                              <p className="font-medium text-foreground">{req.book_title}</p>
                              <p className="text-muted-foreground font-mono">
                                Alokasi: <strong>{req.reserved_copy_code || '-'}</strong>
                              </p>
                            </div>
                            {req.reserved_copy_code && (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={checkoutMutation.isPending}
                                onClick={() => {
                                  void handleCheckoutCopy(req.reserved_copy_code!)
                                }}
                              >
                                Serahkan ({req.reserved_copy_code})
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Pindai atau masukkan nomor induk anggota pada Langkah 1 untuk menampilkan
                  ringkasan kuota dan daftar buku yang dipesan.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MODE KEMBALI / CHECK-IN (FR-CIR-10 & FR-CIR-11) */}
      {activeTab === 'kembali' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Pindai Kode Eksemplar yang Dikembalikan
                </CardTitle>
                <CardDescription className="text-xs">
                  Pindai barcode Code 128 pada buku untuk menampilkan data peminjam dan perhitungan
                  denda otomatis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeInput
                  id="checkin-copy-input"
                  value={checkinCopyInput}
                  onChange={setCheckinCopyInput}
                  onSubmit={(code) => {
                    void handleLookupCopyForCheckin(code)
                  }}
                  placeholder="Pindai atau ketik kode eksemplar (misal: B000001)..."
                  disabled={isLookingUpCopy || checkinMutation.isPending}
                  autoFocus={true}
                  submitLabel={isLookingUpCopy ? 'Memeriksa...' : 'Cek Eksemplar'}
                />
              </CardContent>
            </Card>

            {/* Kartu Ringkasan Pengembalian & Konfirmasi Kondisi */}
            {scannedCopyForCheckin && scannedCopyForCheckin.active_loan && (
              <Card className="border-primary/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {scannedCopyForCheckin.book_title}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-0.5">
                        Kode Eksemplar: {scannedCopyForCheckin.copy_code}
                      </CardDescription>
                    </div>
                    {scannedCopyForCheckin.active_loan.days_overdue > 0 ? (
                      <Badge variant="destructive">
                        Terlambat {scannedCopyForCheckin.active_loan.days_overdue} hari
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white">Tepat Waktu</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Peminjam</span>
                      <span className="font-semibold text-foreground">
                        {scannedCopyForCheckin.active_loan.full_name} (
                        {scannedCopyForCheckin.active_loan.member_code})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Tanggal Pinjam & Tenggat</span>
                      <span className="font-medium text-foreground">
                        {formatDate(scannedCopyForCheckin.active_loan.loaned_at)} →{' '}
                        {formatDate(scannedCopyForCheckin.active_loan.due_date)}
                      </span>
                    </div>
                  </div>

                  {scannedCopyForCheckin.active_loan.estimated_fine > 0 && (
                    <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                      <span>
                        Denda Keterlambatan Otomatis (
                        {scannedCopyForCheckin.active_loan.days_overdue} hari ×{' '}
                        {formatRupiah(scannedCopyForCheckin.active_loan.daily_fine_snapshot)}):
                      </span>
                      <span className="text-sm font-bold">
                        {formatRupiah(scannedCopyForCheckin.active_loan.estimated_fine)}
                      </span>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Kondisi Buku Saat Dikembalikan *</Label>
                      <Select
                        value={returnCondition}
                        onValueChange={(val) =>
                          setReturnCondition(val as 'good' | 'damaged')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Baik (Tersedia Kembali)</SelectItem>
                          <SelectItem value="damaged">Rusak (Perlu Perbaikan / Denda)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {returnCondition === 'damaged' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="damage-fine">Nominal Denda Kerusakan (Rp)</Label>
                        <Input
                          id="damage-fine"
                          type="number"
                          min={0}
                          placeholder="Contoh: 25000"
                          value={damageFineInput}
                          onChange={(e) => setDamageFineInput(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkin-notes">Catatan Kondisi (Opsional)</Label>
                    <Input
                      id="checkin-notes"
                      placeholder="Catatan tambahan..."
                      value={checkinNotes}
                      onChange={(e) => setCheckinNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setScannedCopyForCheckin(null)}
                    >
                      Batal
                    </Button>
                    <Button
                      disabled={checkinMutation.isPending}
                      onClick={() => {
                        void handleConfirmCheckin()
                      }}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>
                        {checkinMutation.isPending
                          ? 'Memproses Check-in...'
                          : 'Konfirmasi Pengembalian'}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Daftar Pengembalian Menunggu Konfirmasi (FR-CIR-11) */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RotateCcw className="size-4 text-primary" />
                  <span>Pengembalian Menunggu Konfirmasi ({returnQueue.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar buku yang ditandai "Ajukan Pengembalian" oleh anggota (FR-CIR-11).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                {returnQueue.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground">
                    Tidak ada pengajuan pengembalian yang menunggu konfirmasi.
                  </p>
                ) : (
                  returnQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-md border p-3"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-muted-foreground">
                          {item.full_name} ({item.member_code}) • Kode:{' '}
                          <strong className="font-mono">{item.copy_code}</strong>
                        </p>
                        {item.return_requested_at && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>Diajukan: {formatDateTime(item.return_requested_at)}</span>
                          </p>
                        )}
                      </div>
                      {item.copy_code && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setCheckinCopyInput(item.copy_code!)
                            void handleLookupCopyForCheckin(item.copy_code!)
                          }}
                        >
                          Proses
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Riwayat 10 Transaksi Terakhir Sesi Ini (PRD §15.3) */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="size-4 text-primary" />
              <span>Riwayat Transaksi Sesi Ini ({sessionHistory.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {sessionHistory.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={log.mode === 'checkout' ? 'default' : 'secondary'}>
                    {log.mode === 'checkout' ? 'PINJAM' : 'KEMBALI'}
                  </Badge>
                  <span className="font-mono font-semibold">{log.copyCode}</span>
                  <span>— {log.memberInfo}</span>
                </div>
                <span className="text-muted-foreground">{log.summaryText}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
