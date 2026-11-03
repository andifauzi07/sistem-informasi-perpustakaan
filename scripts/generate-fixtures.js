import fs from 'node:fs'
import path from 'node:path'
import readXlsxFile from 'read-excel-file/node'
import { createZip } from './mini-zip.js'

function generateXlsx(targetFilePath, rows) {
  const tempDir = path.resolve('e2e/fixtures/_temp_' + Math.random().toString(36).substring(7))
  const xlDir = path.join(tempDir, 'xl')
  const xlRelsDir = path.join(xlDir, '_rels')
  const worksheetsDir = path.join(xlDir, 'worksheets')
  const relsDir = path.join(tempDir, '_rels')

  fs.mkdirSync(xlRelsDir, { recursive: true })
  fs.mkdirSync(worksheetsDir, { recursive: true })
  fs.mkdirSync(relsDir, { recursive: true })

  fs.writeFileSync(
    path.join(tempDir, '[Content_Types].xml'),
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  )

  fs.writeFileSync(
    path.join(relsDir, '.rels'),
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  )

  fs.writeFileSync(
    path.join(xlDir, 'workbook.xml'),
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  )

  fs.writeFileSync(
    path.join(xlRelsDir, 'workbook.xml.rels'),
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
  )

  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const rowsXml = rows
    .map((row, rIdx) => {
      const rowNum = rIdx + 1
      const cellsXml = row
        .map((val, cIdx) => {
          if (val === undefined || val === null || val === '') return ''
          const colLetter = cols[cIdx]
          const escaped = String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          return `<c r="${colLetter}${rowNum}" t="inlineStr"><is><t>${escaped}</t></is></c>`
        })
        .join('')
      return `<row r="${rowNum}">${cellsXml}</row>`
    })
    .join('')

  fs.writeFileSync(
    path.join(worksheetsDir, 'sheet1.xml'),
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowsXml}</sheetData>
</worksheet>`
  )

  const targetDir = path.dirname(path.resolve(targetFilePath))
  fs.mkdirSync(targetDir, { recursive: true })

  const absTarget = path.resolve(targetFilePath)
  if (fs.existsSync(absTarget)) fs.unlinkSync(absTarget)

  createZip(tempDir, absTarget)
  fs.rmSync(tempDir, { recursive: true, force: true })
}

// 1. Fixture Valid Members (TC-MBR-03)
const validRows = [
  ['nomor_induk', 'nama', 'peran', 'kelas', 'kode_jurusan', 'mapel', 'telepon'],
  ['21108001', 'Budi Santoso', 'siswa', 'X TKJ 1', 'TKJ', '', '08121111001'],
  ['21108002', 'Siti Rahma', 'siswa', 'X RPL 1', 'RPL', '', '08121111002'],
  ['198501012010011001', 'Dra. Fatimah', 'guru', '', '', 'Bahasa Indonesia', '08121111003'],
]
generateXlsx('e2e/fixtures/valid-members.xlsx', validRows)

// 2. Fixture Mixed Members (TC-MBR-04)
const mixedRows = [
  ['nomor_induk', 'nama', 'peran', 'kelas', 'kode_jurusan', 'mapel', 'telepon'],
  ['21108010', 'Hendra Valid', 'siswa', 'X TKJ 1', 'TKJ', '', '08121111010'],
  ['21', 'Invalid Pendek', 'siswa', 'X TKJ 1', 'TKJ', '', ''], // Invalid: < 3 karakter
]
generateXlsx('e2e/fixtures/mixed-members.xlsx', mixedRows)

// 3. Fixture Existing Member (TC-MBR-05)
const existingRows = [
  ['nomor_induk', 'nama', 'peran', 'kelas', 'kode_jurusan', 'mapel', 'telepon'],
  ['SISWA01', 'Ahmad Siswa Terupdate', 'siswa', 'XI TKJ 1', 'TKJ', '', '08999999999'],
]
generateXlsx('e2e/fixtures/existing-members.xlsx', existingRows)

console.log('Fixtures generated! Verifying with read-excel-file...')
const readBack = await readXlsxFile('e2e/fixtures/valid-members.xlsx')
console.log('Read back valid rows count:', readBack.length, JSON.stringify(readBack))
