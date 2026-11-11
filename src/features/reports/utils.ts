import React from 'react'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'
import type { ReportType } from './schemas'
import type { ReportRow } from './api/queries'

export interface ReportColumnConfig {
  header: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

export function getReportColumns(type: ReportType): ReportColumnConfig[] {
  switch (type) {
    case 'loans':
      return [
        { header: 'No', key: 'index', width: 4, align: 'center' },
        { header: 'Tgl Pinjam', key: 'loaned_at', width: 12, align: 'center' },
        { header: 'Nomor Induk', key: 'member_code', width: 12, align: 'left' },
        { header: 'Nama Anggota', key: 'member_name', width: 20, align: 'left' },
        { header: 'Kelas', key: 'class_name', width: 10, align: 'center' },
        { header: 'Judul Buku', key: 'title', width: 25, align: 'left' },
        { header: 'Eksemplar', key: 'copy_code', width: 12, align: 'center' },
        { header: 'Jatuh Tempo', key: 'due_date', width: 12, align: 'center' },
        { header: 'Tgl Kembali', key: 'returned_at', width: 12, align: 'center' },
        { header: 'Status', key: 'status', width: 10, align: 'center' },
      ]
    case 'returns':
      return [
        { header: 'No', key: 'index', width: 4, align: 'center' },
        { header: 'Tgl Kembali', key: 'returned_at', width: 12, align: 'center' },
        { header: 'Nomor Induk', key: 'member_code', width: 12, align: 'left' },
        { header: 'Nama Anggota', key: 'member_name', width: 20, align: 'left' },
        { header: 'Kelas', key: 'class_name', width: 10, align: 'center' },
        { header: 'Judul Buku', key: 'title', width: 25, align: 'left' },
        { header: 'Eksemplar', key: 'copy_code', width: 12, align: 'center' },
        { header: 'Terlambat (Hari)', key: 'days_overdue', width: 14, align: 'center' },
        { header: 'Denda (Rp)', key: 'fine_amount', width: 14, align: 'right' },
        { header: 'Status Denda', key: 'fine_status', width: 12, align: 'center' },
      ]
    case 'overdue':
      return [
        { header: 'No', key: 'index', width: 4, align: 'center' },
        { header: 'Nomor Induk', key: 'member_code', width: 12, align: 'left' },
        { header: 'Nama Anggota', key: 'member_name', width: 20, align: 'left' },
        { header: 'Kelas', key: 'class_name', width: 10, align: 'center' },
        { header: 'Judul Buku', key: 'title', width: 25, align: 'left' },
        { header: 'Eksemplar', key: 'copy_code', width: 12, align: 'center' },
        { header: 'Jatuh Tempo', key: 'due_date', width: 12, align: 'center' },
        { header: 'Terlambat (Hari)', key: 'days_overdue', width: 14, align: 'center' },
        { header: 'Tarif/Hari', key: 'daily_fine_snapshot', width: 12, align: 'right' },
        { header: 'Estimasi Denda', key: 'estimated_fine', width: 14, align: 'right' },
      ]
    case 'fines':
      return [
        { header: 'No', key: 'index', width: 4, align: 'center' },
        { header: 'Tgl Tagihan', key: 'created_at', width: 12, align: 'center' },
        { header: 'Nomor Induk', key: 'member_code', width: 12, align: 'left' },
        { header: 'Nama Anggota', key: 'member_name', width: 20, align: 'left' },
        { header: 'Kelas', key: 'class_name', width: 10, align: 'center' },
        { header: 'Judul Buku', key: 'title', width: 25, align: 'left' },
        { header: 'Jenis Denda', key: 'type', width: 12, align: 'center' },
        { header: 'Nominal', key: 'amount', width: 14, align: 'right' },
        { header: 'Status', key: 'status', width: 10, align: 'center' },
        { header: 'Tgl Bayar', key: 'paid_at', width: 12, align: 'center' },
        { header: 'Alasan Bebas', key: 'waived_reason', width: 20, align: 'left' },
      ]
    case 'inventory':
      return [
        { header: 'No', key: 'index', width: 4, align: 'center' },
        { header: 'Judul Buku', key: 'title', width: 25, align: 'left' },
        { header: 'ISBN', key: 'isbn', width: 14, align: 'center' },
        { header: 'Kategori', key: 'category_name', width: 16, align: 'left' },
        { header: 'Pengarang', key: 'authors', width: 20, align: 'left' },
        { header: 'Total', key: 'total_copies', width: 8, align: 'center' },
        { header: 'Tersedia', key: 'available_copies', width: 9, align: 'center' },
        { header: 'Dipinjam', key: 'on_loan_copies', width: 9, align: 'center' },
        { header: 'Dipesan', key: 'reserved_copies', width: 8, align: 'center' },
        { header: 'Rusak', key: 'damaged_copies', width: 8, align: 'center' },
        { header: 'Hilang', key: 'lost_copies', width: 8, align: 'center' },
        { header: 'Ditarik', key: 'withdrawn_copies', width: 8, align: 'center' },
      ]
    case 'member_activity':
      return [
        { header: 'No', key: 'index', width: 4, align: 'center' },
        { header: 'Nomor Induk', key: 'member_code', width: 12, align: 'left' },
        { header: 'Nama Lengkap', key: 'full_name', width: 22, align: 'left' },
        { header: 'Peran', key: 'role', width: 10, align: 'center' },
        { header: 'Kelas', key: 'class_name', width: 10, align: 'center' },
        { header: 'Total Pinjam', key: 'total_loans', width: 12, align: 'center' },
        { header: 'Dikembalikan', key: 'returned_loans', width: 12, align: 'center' },
        { header: 'Pernah Terlambat', key: 'overdue_loans', width: 14, align: 'center' },
      ]
    case 'popular_books':
      return [
        { header: 'Peringkat', key: 'index', width: 8, align: 'center' },
        { header: 'Judul Buku', key: 'title', width: 35, align: 'left' },
        { header: 'Pengarang', key: 'authors', width: 25, align: 'left' },
        { header: 'Kategori', key: 'category_name', width: 18, align: 'left' },
        { header: 'Frekuensi Pinjam', key: 'borrow_count', width: 16, align: 'center' },
      ]
  }
}

export function formatReportCellValue(
  _type: ReportType,
  key: string,
  value: unknown,
  _row: ReportRow,
  index: number
): string {
  if (key === 'index') {
    return String(index + 1)
  }

  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (key === 'loaned_at' || key === 'returned_at' || key === 'created_at' || key === 'paid_at') {
    return formatDate(value as string)
  }

  if (key === 'due_date') {
    return formatDate(value as string)
  }

  if (key === 'amount' || key === 'fine_amount' || key === 'estimated_fine' || key === 'daily_fine_snapshot') {
    return formatRupiah(Number(value))
  }

  const str = typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : '-'

  if (key === 'status') {
    if (str === 'active') return 'Aktif'
    if (str === 'returned') return 'Kembali'
    if (str === 'lost') return 'Hilang'
    if (str === 'unpaid') return 'Belum Lunas'
    if (str === 'paid') return 'Lunas'
    if (str === 'waived') return 'Dibebaskan'
    return str
  }

  if (key === 'fine_status') {
    if (str === 'unpaid') return 'Belum Lunas'
    if (str === 'paid') return 'Lunas'
    if (str === 'waived') return 'Dibebaskan'
    return str
  }

  if (key === 'type') {
    if (str === 'late') return 'Keterlambatan'
    if (str === 'damage') return 'Kerusakan'
    if (str === 'loss') return 'Kehilangan'
    return str
  }

  if (key === 'role') {
    if (str === 'student') return 'Siswa'
    if (str === 'teacher') return 'Guru'
    if (str === 'librarian') return 'Pustakawan'
    return str
  }

  return str
}

export interface ExportReportParams {
  type: ReportType
  reportTitle: string
  periodText: string
  officerName: string
  schoolName: string
  libraryName: string
  address: string
  data: ReportRow[]
}

interface XlsxFileWriter {
  toFile: (fileName: string) => Promise<void>
}

// 1. Ekspor ke Excel (*.xlsx) dengan lazy load write-excel-file
export async function exportReportToExcel(params: ExportReportParams): Promise<void> {
  const writeXlsxModule = await import('write-excel-file/browser')
  const writeXlsxFile = writeXlsxModule.default as unknown as (
    data: Record<string, unknown>[],
    options: {
      columns: Array<{
        column: string
        type: StringConstructor
        value: (row: Record<string, unknown>) => string
        width: number
      }>
    }
  ) => XlsxFileWriter

  const columns = getReportColumns(params.type)

  const objects = params.data.map((row, idx) => {
    const obj: Record<string, unknown> = {}
    const rowRecord = row as Record<string, unknown>
    columns.forEach((col) => {
      obj[col.key] = formatReportCellValue(params.type, col.key, rowRecord[col.key], row, idx)
    })
    return obj
  })

  const xlsxColumns = columns.map((col) => ({
    column: col.header,
    type: String,
    value: (row: Record<string, unknown>): string => {
      const val = row[col.key]
      return typeof val === 'string' ? val : '-'
    },
    width: Math.max(12, col.width ?? 15),
  }))

  const safeFilename = `${params.reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.xlsx`

  await writeXlsxFile(objects, { columns: xlsxColumns }).toFile(safeFilename)
}

// 2. Ekspor ke PDF (A4) dengan kop resmi sekolah dan lazy load @react-pdf/renderer
export async function exportReportToPdf(params: ExportReportParams): Promise<void> {
  const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer')
  const columns = getReportColumns(params.type)
  const isLandscape = columns.length > 7

  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    headerContainer: {
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: '#111827',
      borderBottomStyle: 'solid',
      paddingBottom: 8,
      marginBottom: 12,
    },
    schoolTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    libraryTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      marginTop: 2,
      textAlign: 'center',
    },
    addressText: {
      fontSize: 8,
      color: '#4b5563',
      marginTop: 2,
      textAlign: 'center',
    },
    metaSection: {
      marginBottom: 10,
    },
    reportName: {
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 8,
      color: '#4b5563',
      marginTop: 2,
    },
    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: '#f3f4f6',
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e7eb',
    },
    th: {
      padding: 4,
      fontWeight: 'bold',
      fontSize: 7.5,
      color: '#111827',
    },
    td: {
      padding: 4,
      fontSize: 7,
      color: '#374151',
    },
    footerSection: {
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    signatureBlock: {
      width: 160,
      alignItems: 'center',
    },
    signatureDate: {
      fontSize: 8,
      marginBottom: 40,
    },
    signatureName: {
      fontSize: 8,
      fontWeight: 'bold',
      textDecoration: 'underline',
    },
    signatureRole: {
      fontSize: 7.5,
      color: '#4b5563',
      marginTop: 1,
    },
  })

  const totalWidth = columns.reduce((acc, c) => acc + (c.width ?? 10), 0)

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', orientation: isLandscape ? 'landscape' : 'portrait', style: styles.page },
      // Kop Sekolah
      React.createElement(
        View,
        { style: styles.headerContainer },
        React.createElement(Text, { style: styles.schoolTitle }, params.schoolName),
        React.createElement(Text, { style: styles.libraryTitle }, params.libraryName),
        React.createElement(Text, { style: styles.addressText }, params.address)
      ),
      // Metadata Laporan
      React.createElement(
        View,
        { style: styles.metaSection },
        React.createElement(Text, { style: styles.reportName }, params.reportTitle),
        React.createElement(
          View,
          { style: styles.metaRow },
          React.createElement(Text, null, `Periode: ${params.periodText}`),
          React.createElement(Text, null, `Tanggal Cetak: ${formatDateTime(new Date())}`)
        )
      ),
      // Tabel Data
      React.createElement(
        View,
        { style: styles.table },
        // Header
        React.createElement(
          View,
          { style: styles.tableHeaderRow },
          ...columns.map((col) =>
            React.createElement(
              Text,
              {
                key: col.key,
                style: [
                  styles.th,
                  {
                    width: `${((col.width ?? 10) / totalWidth) * 100}%`,
                    textAlign: col.align ?? 'left',
                  },
                ],
              },
              col.header
            )
          )
        ),
        // Rows
        ...params.data.map((row, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.tableRow },
            ...columns.map((col) =>
              React.createElement(
                Text,
                {
                  key: col.key,
                  style: [
                    styles.td,
                    {
                      width: `${((col.width ?? 10) / totalWidth) * 100}%`,
                      textAlign: col.align ?? 'left',
                    },
                  ],
                },
                formatReportCellValue(params.type, col.key, (row as Record<string, unknown>)[col.key], row, idx)
              )
            )
          )
        )
      ),
      // Tanda Tangan Pustakawan
      React.createElement(
        View,
        { style: styles.footerSection },
        React.createElement(
          View,
          { style: styles.signatureBlock },
          React.createElement(Text, { style: styles.signatureDate }, `Benteng, ${formatDate(new Date())}`),
          React.createElement(Text, { style: styles.signatureName }, params.officerName || 'Pustakawan'),
          React.createElement(Text, { style: styles.signatureRole }, 'Petugas Perpustakaan')
        )
      )
    )
  )

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${params.reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
