import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

export interface BarcodeItem {
  code: string
  title: string
  barcodeDataUrl: string
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  labelCard: {
    width: '31%', // 3 kolom per baris di kertas A4
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  schoolName: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#444444',
    textAlign: 'center',
    marginBottom: 2,
  },
  bookTitle: {
    fontSize: 7,
    color: '#222222',
    textAlign: 'center',
    marginBottom: 4,
    maxLines: 2,
  },
  barcodeImage: {
    width: 140,
    height: 35,
    marginBottom: 2,
  },
  codeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textAlign: 'center',
    color: '#000000',
  },
})

interface BarcodePdfDocumentProps {
  items: BarcodeItem[]
}

export function BarcodePdfDocument({ items }: BarcodePdfDocumentProps) {
  return (
    <Document title="Label Barcode Eksemplar - SMKN 1 Selayar">
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Label Barcode Koleksi - SMKN 1 Selayar</Text>
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.code} style={styles.labelCard}>
              <Text style={styles.schoolName}>PERPUSTAKAAN SMKN 1 SELAYAR</Text>
              <Text style={styles.bookTitle}>
                {item.title.length > 40 ? `${item.title.slice(0, 38)}...` : item.title}
              </Text>
              {item.barcodeDataUrl ? (
                <Image src={item.barcodeDataUrl} style={styles.barcodeImage} />
              ) : null}
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
