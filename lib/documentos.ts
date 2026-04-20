'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentCategory = 'documento' | 'foto'

export type ProjectDocument = {
  id: string
  project_id: string
  name: string
  file_url: string
  file_type: string
  category: DocumentCategory
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

export type DocumentInput = {
  project_id: string
  name: string
  file_url: string
  file_type: string
  category: DocumentCategory
  size_bytes?: number | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getDocuments(projectId: string): Promise<ProjectDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ProjectDocument[]
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createDocumentRecord(
  input: DocumentInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No hay sesión activa.' }

  const { error } = await supabase.from('project_documents').insert([
    { ...input, uploaded_by: user.id },
  ])
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${input.project_id}`)
  return {}
}

export async function deleteDocument(
  id: string,
  fileUrl: string,
  projectId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Extract storage path from public URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/project-files/{path}
  const marker = '/storage/v1/object/public/project-files/'
  const markerIndex = fileUrl.indexOf(marker)
  if (markerIndex !== -1) {
    const storagePath = fileUrl.slice(markerIndex + marker.length)
    await supabase.storage.from('project-files').remove([storagePath])
  }

  const { error } = await supabase.from('project_documents').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return {}
}
