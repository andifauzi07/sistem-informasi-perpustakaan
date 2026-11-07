import { describe, expect, it } from 'vitest'
import {
  validateMaterialFile,
  uploadMaterialFormSchema,
  updateMaterialSchema,
  hideMaterialSchema,
  materialsFilterSchema,
  MAX_MATERIAL_FILE_SIZE,
} from './schemas'

describe('Materials Schemas & Validation (FR-MAT, BR-20)', () => {
  it('memvalidasi berkas valid (PDF, DOCX, PPTX, XLSX <= 10 MB) (TC-MAT-01)', () => {
    const validPdf = validateMaterialFile({
      name: 'modul-jaringan.pdf',
      size: 5 * 1024 * 1024,
      type: 'application/pdf',
    })
    expect(validPdf.valid).toBe(true)

    const validDocx = validateMaterialFile({
      name: 'tugas-rpl.docx',
      size: 2 * 1024 * 1024,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(validDocx.valid).toBe(true)

    const validPptx = validateMaterialFile({
      name: 'presentasi-ai.pptx',
      size: 8 * 1024 * 1024,
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })
    expect(validPptx.valid).toBe(true)

    const validXlsx = validateMaterialFile({
      name: 'nilai-siswa.xlsx',
      size: 1 * 1024 * 1024,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(validXlsx.valid).toBe(true)
  })

  it('menolak berkas yang melebihi batas 10 MB (TC-MAT-02, BR-20)', () => {
    const oversizedFile = validateMaterialFile({
      name: 'video-materi.pdf',
      size: MAX_MATERIAL_FILE_SIZE + 1024, // 10 MB + 1 KB
      type: 'application/pdf',
    })
    expect(oversizedFile.valid).toBe(false)
    expect(oversizedFile.error).toContain('10 MB')
  })

  it('menolak berkas dengan jenis terlarang seperti .exe atau .zip (TC-MAT-02)', () => {
    const exeFile = validateMaterialFile({
      name: 'program-jahat.exe',
      size: 1024 * 1024,
      type: 'application/x-msdownload',
    })
    expect(exeFile.valid).toBe(false)
    expect(exeFile.error).toContain('PDF, DOCX, PPTX, atau XLSX')

    const zipFile = validateMaterialFile({
      name: 'arsip.zip',
      size: 1024 * 1024,
      type: 'application/zip',
    })
    expect(zipFile.valid).toBe(false)
  })

  it('memvalidasi metadata bahan ajar judul dan mapel (FR-MAT-01, FR-MAT-02)', () => {
    // Judul terlalu pendek (< 3 karakter)
    const shortTitle = updateMaterialSchema.safeParse({
      title: 'AB',
      subject: 'Informatika',
    })
    expect(shortTitle.success).toBe(false)

    // Mapel kosong
    const emptySubject = updateMaterialSchema.safeParse({
      title: 'Materi Jaringan Komputer',
      subject: '',
    })
    expect(emptySubject.success).toBe(false)

    // Data valid
    const validData = updateMaterialSchema.safeParse({
      title: 'Modul Jaringan Komputer Dasar',
      subject: 'Informatika',
      gradeLevel: 10,
      majorId: 1,
      description: 'Pengenalan topologi star dan bus',
    })
    expect(validData.success).toBe(true)
  })

  it('menolak tingkat kelas di luar 10, 11, atau 12', () => {
    const invalidGrade = updateMaterialSchema.safeParse({
      title: 'Modul Bahasa Indonesia',
      subject: 'Bahasa Indonesia',
      gradeLevel: 9,
    })
    expect(invalidGrade.success).toBe(false)
  })

  it('mewajibkan alasan saat menyembunyikan bahan ajar (FR-MAT-04, TC-MAT-05)', () => {
    const emptyReason = hideMaterialSchema.safeParse({
      reason: '   ',
    })
    expect(emptyReason.success).toBe(false)

    const validReason = hideMaterialSchema.safeParse({
      reason: 'Materi kurikulum 2013, perlu diperbarui ke Kurikulum Merdeka',
    })
    expect(validReason.success).toBe(true)
  })

  it('memberikan nilai default aman pada skema filter bahan ajar (FR-MAT-03)', () => {
    const filter = materialsFilterSchema.parse({})
    expect(filter.q).toBe('')
    expect(filter.subject).toBe('')
    expect(filter.page).toBe(1)
    expect(filter.gradeLevel).toBeUndefined()
  })

  it('memvalidasi formulir upload bahan ajar mewajibkan berkas (FR-MAT-01)', () => {
    const parsed = uploadMaterialFormSchema.safeParse({
      title: 'Materi Pemrograman Web',
      subject: 'Informatika',
    })
    expect(parsed.success).toBe(false)
  })
})
