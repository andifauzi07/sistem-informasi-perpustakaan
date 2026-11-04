// Utilitas Domain Koleksi & Sampul Buku (FR-COL-03, FR-COL-04)

export interface CompressedImageResult {
  blob: Blob
  width: number
  height: number
  size: number
}

/**
 * Mengompresi file gambar peramban ke WebP dengan lebar maksimal 600px dan target ukuran <= 60 KB.
 * Menggunakan Canvas API native tanpa library pihak ketiga (Ponytail Decision Ladder).
 */
export async function compressCoverImage(
  file: File,
  maxWidth = 600,
  maxSizeBytes = 60 * 1024
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Gagal menginisialisasi 2D Canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Coba kompresi dengan level kualitas bertingkat untuk mencapai <= 60 KB
      const attemptCompression = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal menghasilkan blob WebP dari canvas'))
              return
            }

            if (blob.size > maxSizeBytes && quality > 0.4) {
              attemptCompression(quality - 0.15)
            } else {
              resolve({
                blob,
                width,
                height,
                size: blob.size,
              })
            }
          },
          'image/webp',
          quality
        )
      }

      attemptCompression(0.8)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal memuat file gambar untuk kompresi'))
    }

    img.src = url
  })
}

/**
 * Format nomor urut eksemplar ke standar 6 digit (contoh: 1 -> B000001)
 */
export function formatCopyCode(sequence: number): string {
  const num = Math.max(1, Math.floor(sequence))
  return `B${String(num).padStart(6, '0')}`
}

/**
 * Normalisasi nomor ISBN: menghapus tanda hubung, spasi, dan karakter non-alfanumerik
 */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9X]/gi, '').toUpperCase()
}
