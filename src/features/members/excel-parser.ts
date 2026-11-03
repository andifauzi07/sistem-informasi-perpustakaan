// Utilitas parsing dan validasi berkas Excel anggota (FR-MBR-06, PRD §8.2)

export interface ParsedMemberRow {
  memberCode: string
  fullName: string
  role: 'student' | 'teacher' | 'librarian'
  className?: string
  majorCode?: string
  majorId?: string | number
  subject?: string
  phone?: string
  isValid: boolean
  errorReason?: string
}

export function cellToString(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string' || typeof val === 'number') return String(val).trim()
  return ''
}

export function parseRole(roleRaw: string): 'student' | 'teacher' | 'librarian' | null {
  const normalized = roleRaw.toLowerCase()
  if (normalized === 'guru' || normalized === 'teacher') return 'teacher'
  if (normalized === 'pustakawan' || normalized === 'librarian') return 'librarian'
  if (normalized === 'siswa' || normalized === 'student') return 'student'
  return null
}

export function parseMemberRow(
  row: unknown[],
  majorCodeMap: Map<string, string | number>,
  seenCodes: Set<string>
): ParsedMemberRow {
  const memberCode = cellToString(row[0])
  const fullName = cellToString(row[1])
  const roleRaw = cellToString(row[2])
  const className = cellToString(row[3])
  const majorCode = cellToString(row[4]).toUpperCase()
  const subject = cellToString(row[5])
  const phone = cellToString(row[6])

  const role = parseRole(roleRaw)
  if (!role) {
    return {
      memberCode,
      fullName,
      role: 'student',
      className,
      majorCode,
      subject,
      phone,
      isValid: false,
      errorReason: `Peran '${roleRaw}' tidak valid (gunakan siswa/guru/pustakawan)`,
    }
  }

  if (!memberCode || memberCode.length < 3 || memberCode.length > 30) {
    return {
      memberCode,
      fullName,
      role,
      className,
      majorCode,
      subject,
      phone,
      isValid: false,
      errorReason: 'Nomor induk harus antara 3–30 karakter',
    }
  }

  if (seenCodes.has(memberCode.toLowerCase())) {
    return {
      memberCode,
      fullName,
      role,
      className,
      majorCode,
      subject,
      phone,
      isValid: false,
      errorReason: 'Nomor induk duplikat di dalam berkas',
    }
  }
  seenCodes.add(memberCode.toLowerCase())

  if (!fullName || fullName.length < 2) {
    return {
      memberCode,
      fullName,
      role,
      className,
      majorCode,
      subject,
      phone,
      isValid: false,
      errorReason: 'Nama lengkap minimal 2 karakter',
    }
  }

  if (role === 'student' && !className) {
    return {
      memberCode,
      fullName,
      role,
      className,
      majorCode,
      subject,
      phone,
      isValid: false,
      errorReason: 'Kelas wajib diisi untuk siswa',
    }
  }

  if (majorCode && !majorCodeMap.has(majorCode)) {
    return {
      memberCode,
      fullName,
      role,
      className,
      majorCode,
      subject,
      phone,
      isValid: false,
      errorReason: `Kode jurusan '${majorCode}' tidak dikenal di sistem`,
    }
  }

  return {
    memberCode,
    fullName,
    role,
    className,
    majorCode,
    majorId: majorCode ? majorCodeMap.get(majorCode) : undefined,
    subject,
    phone,
    isValid: true,
  }
}

export function parseMemberRows(
  rows: unknown[][],
  majors: Array<{ id: string | number; code: string }>
): ParsedMemberRow[] {
  const majorCodeMap = new Map(majors.map((m) => [m.code.toUpperCase(), m.id]))
  const seenCodes = new Set<string>()
  return rows.map((row) => parseMemberRow(row, majorCodeMap, seenCodes))
}
