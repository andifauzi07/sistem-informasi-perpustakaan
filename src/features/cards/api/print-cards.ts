import type { CardMember } from '../types'
import { generateQrCodeDataUrl } from '../utils'

export async function generateSingleCardPdfBlob(member: CardMember): Promise<Blob> {
  const [qrDataUrl, { pdf }, { SingleCardPdfDocument }] = await Promise.all([
    generateQrCodeDataUrl(member.member_code),
    import('@react-pdf/renderer'),
    import('../components/card-pdf-document'),
  ])

  const documentElement = SingleCardPdfDocument({ member, qrDataUrl })
  return await pdf(documentElement).toBlob()
}

export async function downloadSingleCardPdf(member: CardMember): Promise<void> {
  const blob = await generateSingleCardPdfBlob(member)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kartu-${member.member_code}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export async function generateBatchCardsPdfBlob(members: CardMember[]): Promise<Blob> {
  const [{ pdf }, { BatchCardPdfDocument }, items] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/card-pdf-document'),
    Promise.all(
      members.map(async (member) => {
        const qrDataUrl = await generateQrCodeDataUrl(member.member_code)
        return { member, qrDataUrl }
      })
    ),
  ])

  const documentElement = BatchCardPdfDocument({ items })
  return await pdf(documentElement).toBlob()
}

export async function downloadBatchCardsPdf(members: CardMember[], filename = 'kartu-anggota-massal-a4.pdf'): Promise<void> {
  const blob = await generateBatchCardsPdfBlob(members)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
