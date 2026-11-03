import { describe, it, expect } from 'vitest'
import { createMemberSchema, updateMemberSchema, membersFilterSchema } from './schemas'

describe('members schemas', () => {
  describe('createMemberSchema', () => {
    it('menerima payload siswa yang valid dengan kelas', () => {
      const res = createMemberSchema.safeParse({
        memberCode: '21100456',
        fullName: 'Ahmad Siswa',
        role: 'student',
        className: 'X TKJ 1',
        majorId: 1,
      })
      expect(res.success).toBe(true)
    })

    it('menolak siswa tanpa kelas', () => {
      const res = createMemberSchema.safeParse({
        memberCode: '21100456',
        fullName: 'Ahmad Siswa',
        role: 'student',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe('Kelas wajib diisi untuk siswa')
      }
    })

    it('menerima guru tanpa kelas', () => {
      const res = createMemberSchema.safeParse({
        memberCode: '19820101',
        fullName: 'Budi Guru',
        role: 'teacher',
        subject: 'Matematika',
      })
      expect(res.success).toBe(true)
    })

    it('menolak nomor induk kurang dari 3 karakter atau lebih dari 30 karakter', () => {
      const tooShort = createMemberSchema.safeParse({
        memberCode: '12',
        fullName: 'Nama Valid',
        role: 'teacher',
      })
      expect(tooShort.success).toBe(false)

      const tooLong = createMemberSchema.safeParse({
        memberCode: 'a'.repeat(31),
        fullName: 'Nama Valid',
        role: 'teacher',
      })
      expect(tooLong.success).toBe(false)
    })
  })

  describe('updateMemberSchema', () => {
    it('menerima pembaruan data anggota yang valid', () => {
      const res = updateMemberSchema.safeParse({
        fullName: 'Nama Baru',
        className: 'XI TKJ 2',
        phone: '081234567890',
      })
      expect(res.success).toBe(true)
    })

    it('menolak nama kurang dari 2 karakter', () => {
      const res = updateMemberSchema.safeParse({
        fullName: 'A',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('membersFilterSchema', () => {
    it('memberikan nilai default untuk filter kosong', () => {
      const res = membersFilterSchema.parse({})
      expect(res.q).toBe('')
      expect(res.role).toBe('all')
      expect(res.status).toBe('all')
      expect(res.page).toBe(1)
    })

    it('melakukan parsing nilai filter yang diberikan', () => {
      const res = membersFilterSchema.parse({
        q: 'ahmad',
        role: 'student',
        status: 'active',
        page: '2',
      })
      expect(res.q).toBe('ahmad')
      expect(res.role).toBe('student')
      expect(res.status).toBe('active')
      expect(res.page).toBe(2)
    })
  })
})
