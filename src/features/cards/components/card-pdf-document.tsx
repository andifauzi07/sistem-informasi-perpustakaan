import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { CardMember } from '../types'
import {
  CARD_ID1_WIDTH_PT,
  CARD_ID1_HEIGHT_PT,
  A4_MARGIN_HORIZONTAL_PT,
  A4_MARGIN_VERTICAL_PT,
} from '../utils'

const styles = StyleSheet.create({
  singlePage: {
    width: CARD_ID1_WIDTH_PT,
    height: CARD_ID1_HEIGHT_PT,
    padding: 0,
    backgroundColor: '#ffffff',
  },
  cardContainer: {
    width: CARD_ID1_WIDTH_PT,
    height: CARD_ID1_HEIGHT_PT,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  librarySubtitle: {
    fontSize: 5.5,
    color: '#0369a1',
    textAlign: 'center',
    marginTop: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#0284c7',
    marginVertical: 3,
  },
  cardTitle: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  body: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 2,
  },
  infoCol: {
    flex: 1,
    paddingRight: 6,
  },
  fullName: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  memberCode: {
    fontSize: 6.5,
    color: '#1e293b',
    marginTop: 1.5,
    fontFamily: 'Helvetica-Bold',
  },
  roleLabel: {
    fontSize: 6,
    color: '#0284c7',
    marginTop: 1.5,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 5.5,
    color: '#475569',
    marginTop: 1.5,
  },
  qrCol: {
    width: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 50,
    height: 50,
  },
  qrCodeText: {
    fontSize: 5,
    color: '#334155',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 2,
    marginTop: 2,
  },
  footerText: {
    fontSize: 4.5,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Tata Letak Cetak Massal Lembar A4 (FR-CARD-02)
  a4Page: {
    width: 595.28,
    height: 841.89,
    paddingTop: A4_MARGIN_VERTICAL_PT,
    paddingBottom: A4_MARGIN_VERTICAL_PT,
    paddingLeft: A4_MARGIN_HORIZONTAL_PT,
    paddingRight: A4_MARGIN_HORIZONTAL_PT,
    backgroundColor: '#ffffff',
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CARD_ID1_WIDTH_PT * 2,
    height: CARD_ID1_HEIGHT_PT * 5,
  },
  gridCell: {
    width: CARD_ID1_WIDTH_PT,
    height: CARD_ID1_HEIGHT_PT,
    borderWidth: 0.5,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
})

function getRoleLabel(role: CardMember['role']): string {
  switch (role) {
    case 'student':
      return 'SISWA'
    case 'teacher':
      return 'GURU'
    case 'librarian':
      return 'PUSTAKAWAN'
    default:
      return 'ANGGOTA'
  }
}

export function CardView({
  member,
  qrDataUrl,
}: {
  member: CardMember
  qrDataUrl: string
}) {
  return (
    <View style={styles.cardContainer}>
      {/* Header Kartu */}
      <View style={styles.header}>
        <Text style={styles.schoolName}>SMK NEGERI 1 SELAYAR</Text>
        <Text style={styles.librarySubtitle}>PERPUSTAKAAN SEKOLAH</Text>
        <View style={styles.headerDivider} />
        <Text style={styles.cardTitle}>KARTU ANGGOTA PERPUSTAKAAN</Text>
      </View>

      {/* Bagian Utama (Identitas + QR) */}
      <View style={styles.body}>
        <View style={styles.infoCol}>
          <Text style={styles.fullName}>{member.full_name}</Text>
          <Text style={styles.memberCode}>No: {member.member_code}</Text>
          <Text style={styles.roleLabel}>{getRoleLabel(member.role)}</Text>
          {member.role === 'student' && (
            <>
              {member.class_name && (
                <Text style={styles.detailText}>Kelas: {member.class_name}</Text>
              )}
              {member.major_name && (
                <Text style={styles.detailText}>Jurusan: {member.major_name}</Text>
              )}
            </>
          )}
          {member.role === 'teacher' && member.subject && (
            <Text style={styles.detailText}>Mapel: {member.subject}</Text>
          )}
          {member.role === 'librarian' && member.position && (
            <Text style={styles.detailText}>Jabatan: {member.position}</Text>
          )}
        </View>

        <View style={styles.qrCol}>
          {qrDataUrl ? (
            <Image style={styles.qrImage} src={qrDataUrl} />
          ) : (
            <View style={[styles.qrImage, { backgroundColor: '#f1f5f9' }]} />
          )}
          <Text style={styles.qrCodeText}>{member.member_code}</Text>
        </View>
      </View>

      {/* Footer Kartu */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Kartu ini sah sebagai identitas peminjaman di Perpustakaan SMKN 1 Selayar
        </Text>
      </View>
    </View>
  )
}

// Dokumen PDF Kartu Tunggal Format ID-1 (FR-CARD-01, BR-20)
export function SingleCardPdfDocument({
  member,
  qrDataUrl,
}: {
  member: CardMember
  qrDataUrl: string
}) {
  return (
    <Document title={`Kartu-${member.member_code}`}>
      <Page size={[CARD_ID1_WIDTH_PT, CARD_ID1_HEIGHT_PT]} style={styles.singlePage}>
        <CardView member={member} qrDataUrl={qrDataUrl} />
      </Page>
    </Document>
  )
}

// Dokumen PDF Lembar A4 Cetak Massal (10 kartu/halaman) (FR-CARD-02)
export function BatchCardPdfDocument({
  items,
}: {
  items: Array<{ member: CardMember; qrDataUrl: string }>
}) {
  // Pecah daftar anggota menjadi halaman per 10 kartu
  const chunkSize = 10
  const pages: Array<Array<{ member: CardMember; qrDataUrl: string }>> = []
  for (let i = 0; i < items.length; i += chunkSize) {
    pages.push(items.slice(i, i + chunkSize))
  }

  return (
    <Document title="Kartu-Anggota-Massal-A4">
      {pages.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.a4Page}>
          <View style={styles.gridContainer}>
            {chunk.map((item, idx) => (
              <View key={idx} style={styles.gridCell}>
                <CardView member={item.member} qrDataUrl={item.qrDataUrl} />
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  )
}
