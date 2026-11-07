import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { materialKeys } from './keys'
import type { UploadMaterialFormData, UpdateMaterialFormData } from '../schemas'

// 1. Guru Mengunggah Bahan Ajar Baru (FR-MAT-01, BR-20)
export function useUploadMaterialMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UploadMaterialFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Pengguna tidak terotentikasi')
      }

      const file = data.file
      const lastDotIndex = file.name.lastIndexOf('.')
      const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : ''
      const rawBase = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name
      const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
      const fileUid = crypto.randomUUID()
      const storagePath = `${user.id}/${fileUid}-${cleanBase}${ext}`

      // Unggah berkas ke bucket materials (FR-MAT-01, PRD §13.4)
      const uploadRes = await supabase.storage.from('materials').upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })
      unwrap(uploadRes)

      try {
        const insertRes = await supabase
          .from('teaching_materials')
          .insert({
            teacher_id: user.id,
            title: data.title,
            subject: data.subject,
            description: data.description || null,
            major_id: data.majorId ? Number(data.majorId) : null,
            grade_level: data.gradeLevel ? Number(data.gradeLevel) : null,
            file_path: storagePath,
            file_name: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            status: 'published',
          })
          .select()
          .single()

        return unwrap(insertRes)
      } catch (insertErr) {
        // Rollback upload berkas jika insert basis data gagal
        await supabase.storage.from('materials').remove([storagePath])
        throw insertErr
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all })
    },
  })
}

// 2. Guru Mengubah Metadata Bahan Ajar (FR-MAT-02)
export function useUpdateMaterialMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateMaterialFormData }) => {
      const res = await supabase
        .from('teaching_materials')
        .update({
          title: data.title,
          subject: data.subject,
          description: data.description || null,
          major_id: data.majorId ? Number(data.majorId) : null,
          grade_level: data.gradeLevel ? Number(data.gradeLevel) : null,
        })
        .eq('id', id)
        .select()
        .single()

      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all })
    },
  })
}

// 3. Guru atau Pustakawan Menghapus Bahan Ajar (FR-MAT-02, BR-20)
export function useDeleteMaterialMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: number; filePath: string }) => {
      // Hapus berkas dari storage terlebih dahulu
      if (filePath) {
        await supabase.storage.from('materials').remove([filePath])
      }

      // Hapus baris di basis data
      const res = await supabase.from('teaching_materials').delete().eq('id', id)
      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all })
    },
  })
}

// 4. Pustakawan Mengubah Visibilitas Bahan Ajar (FR-MAT-04)
export function useSetMaterialVisibilityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      visible,
      reason,
    }: {
      id: number
      visible: boolean
      reason?: string
    }) => {
      const res = await supabase.rpc('set_material_visibility', {
        p_material_id: id,
        p_visible: visible,
        p_reason: reason || undefined,
      })
      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all })
    },
  })
}

// 5. Unduh Bahan Ajar via Signed URL + Counter (FR-MAT-03, FR-MAT-05, TC-MAT-03)
export function useDownloadMaterialMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      filePath,
      fileName,
    }: {
      id: number
      filePath: string
      fileName: string
    }) => {
      // 1. Tambah counter unduhan
      const countRes = await supabase.rpc('increment_material_downloads', {
        p_material_id: id,
      })
      unwrap(countRes)

      // 2. Buat signed URL berumur 60 detik (PRD §8 FR-MAT-03, design.md §1)
      const signedRes = await supabase.storage.from('materials').createSignedUrl(filePath, 60)
      const signedData = unwrap(signedRes)

      if (!signedData?.signedUrl) {
        throw new Error('Gagal menghasilkan URL unduhan bahan ajar')
      }

      // 3. Picu unduhan di peramban
      const response = await fetch(signedData.signedUrl)
      if (!response.ok) {
        throw new Error(`Gagal mengunduh berkas: ${response.statusText}`)
      }
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(objectUrl)

      return signedData.signedUrl
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all })
    },
  })
}
