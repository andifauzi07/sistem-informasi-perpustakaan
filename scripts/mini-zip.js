// Mini Zip creator dengan forward slash murni Node.js (PRD compliant, zero deps)
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

export function createZip(sourceDir, outZipPath) {
  const files = []

  function walk(currentDir, relativePath = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      const rel = relativePath ? `${relativePath}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(fullPath, rel)
      } else {
        files.push({ fullPath, relName: rel.replace(/\\/g, '/') })
      }
    }
  }

  walk(sourceDir)

  const localHeaders = []
  const centralHeaders = []
  let offset = 0

  for (const file of files) {
    const rawData = fs.readFileSync(file.fullPath)
    const compressed = zlib.deflateRawSync(rawData)
    const nameBuf = Buffer.from(file.relName, 'utf-8')

    // CRC32
    const crc = crc32(rawData)

    // Local file header (30 bytes + nameLen)
    const localHeader = Buffer.alloc(30 + nameBuf.length)
    localHeader.writeUInt32LE(0x04034b50, 0) // PK\x03\x04
    localHeader.writeUInt16LE(20, 4) // Version needed
    localHeader.writeUInt16LE(0, 6) // Flags
    localHeader.writeUInt16LE(8, 8) // Compression: Deflate
    localHeader.writeUInt16LE(0, 10) // Mod time
    localHeader.writeUInt16LE(0, 12) // Mod date
    localHeader.writeUInt32LE(crc, 14) // CRC32
    localHeader.writeUInt32LE(compressed.length, 18) // Compressed size
    localHeader.writeUInt32LE(rawData.length, 22) // Uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26) // File name length
    localHeader.writeUInt16LE(0, 28) // Extra field length
    nameBuf.copy(localHeader, 30)

    localHeaders.push(localHeader, compressed)

    // Central directory header (46 bytes + nameLen)
    const centralHeader = Buffer.alloc(46 + nameBuf.length)
    centralHeader.writeUInt32LE(0x02014b50, 0) // PK\x01\x02
    centralHeader.writeUInt16LE(20, 4) // Version made by
    centralHeader.writeUInt16LE(20, 6) // Version needed
    centralHeader.writeUInt16LE(0, 8) // Flags
    centralHeader.writeUInt16LE(8, 10) // Compression: Deflate
    centralHeader.writeUInt16LE(0, 12) // Mod time
    centralHeader.writeUInt16LE(0, 14) // Mod date
    centralHeader.writeUInt32LE(crc, 16) // CRC32
    centralHeader.writeUInt32LE(compressed.length, 20) // Compressed size
    centralHeader.writeUInt32LE(rawData.length, 24) // Uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28) // File name length
    centralHeader.writeUInt16LE(0, 30) // Extra field length
    centralHeader.writeUInt16LE(0, 32) // File comment length
    centralHeader.writeUInt16LE(0, 34) // Disk number start
    centralHeader.writeUInt16LE(0, 36) // Internal attributes
    centralHeader.writeUInt32LE(0, 38) // External attributes
    centralHeader.writeUInt32LE(offset, 42) // Local header offset
    nameBuf.copy(centralHeader, 46)

    centralHeaders.push(centralHeader)

    offset += localHeader.length + compressed.length
  }

  const centralStart = offset
  const centralSize = centralHeaders.reduce((acc, h) => acc + h.length, 0)

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // PK\x05\x06
  eocd.writeUInt16LE(0, 4) // Disk number
  eocd.writeUInt16LE(0, 6) // Central directory start disk
  eocd.writeUInt16LE(files.length, 8) // Total entries this disk
  eocd.writeUInt16LE(files.length, 10) // Total entries
  eocd.writeUInt32LE(centralSize, 12) // Central directory size
  eocd.writeUInt32LE(centralStart, 16) // Central directory offset
  eocd.writeUInt16LE(0, 20) // Comment length

  const allBuffers = [...localHeaders, ...centralHeaders, eocd]
  fs.writeFileSync(outZipPath, Buffer.concat(allBuffers))
}

function crc32(buf) {
  let crc = ~0
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return ~crc >>> 0
}
