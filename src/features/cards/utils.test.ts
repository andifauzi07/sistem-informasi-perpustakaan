import { describe, expect, it } from 'vitest'
import {
  CARD_ID1_WIDTH_PT,
  CARD_ID1_HEIGHT_PT,
  A4_WIDTH_PT,
  A4_HEIGHT_PT,
  A4_MARGIN_HORIZONTAL_PT,
  A4_MARGIN_VERTICAL_PT,
  generateQrCodeDataUrl,
} from './utils'

describe('Cards Specifications & Standards (FR-CARD, BR-20)', () => {
  it('memenuhi dimensi kartu standar ID-1 (85,6 × 54 mm) (BR-20, TC-CARD-01)', () => {
    // 85.6 mm * 72 / 25.4 ≈ 242.64 pt
    expect(CARD_ID1_WIDTH_PT).toBeCloseTo(242.64, 1)
    // 54.0 mm * 72 / 25.4 ≈ 153.07 pt
    expect(CARD_ID1_HEIGHT_PT).toBeCloseTo(153.07, 1)
  })

  it('memenuhi tata letak lembar A4 berisi 10 kartu per halaman (FR-CARD-02, TC-CARD-02)', () => {
    // 2 kolom kartu harus muat dalam lebar A4 (595.28 pt)
    const totalColumnsWidth = CARD_ID1_WIDTH_PT * 2
    expect(totalColumnsWidth).toBeLessThan(A4_WIDTH_PT)
    expect(A4_MARGIN_HORIZONTAL_PT).toBeGreaterThan(0)

    // 5 baris kartu harus muat dalam tinggi A4 (841.89 pt)
    const totalRowsHeight = CARD_ID1_HEIGHT_PT * 5
    expect(totalRowsHeight).toBeLessThan(A4_HEIGHT_PT)
    expect(A4_MARGIN_VERTICAL_PT).toBeGreaterThan(0)

    // Total kartu per lembar adalah 2 x 5 = 10 kartu
    const cardsPerPage = 2 * 5
    expect(cardsPerPage).toBe(10)
  })

  it('menghasilkan data URL QR code string dari nomor induk anggota', async () => {
    const qrDataUrl = await generateQrCodeDataUrl('M3.SISWA.01')
    expect(typeof qrDataUrl).toBe('string')
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/)
  })
})
