'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Trash2,
  ExternalLink,
  FileText,
  File,
  FileSpreadsheet,
  Loader2,
  Images,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type ProjectDocument,
  createDocumentRecord,
  deleteDocument,
} from '@/lib/documentos'
import { createClient } from '@/lib/supabase/client'
import { PhotoLightbox } from './PhotoLightbox'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function formatFecha(d: string) {
  const date = d.split('T')[0]
  const [y, m, day] = date.split('-')
  return `${day}/${m}/${y}`
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocIcon({ fileType }: { fileType: string }) {
  if (fileType === 'application/pdf')
    return <FileText size={20} className="shrink-0 text-red-500" />
  if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return <FileText size={20} className="shrink-0 text-blue-500" />
  if (
    fileType === 'application/vnd.ms-excel' ||
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return <FileSpreadsheet size={20} className="shrink-0 text-green-600" />
  return <File size={20} className="shrink-0 text-zinc-400" />
}

async function uploadToStorage(
  file: File,
  storagePath: string
): Promise<{ publicUrl: string; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('project-files')
    .upload(storagePath, file, { upsert: true })
  if (error) return { publicUrl: '', error: error.message }
  const { data } = supabase.storage.from('project-files').getPublicUrl(storagePath)
  return { publicUrl: data.publicUrl }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  documents: ProjectDocument[]
  projectId: string
  isAdmin: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ArchivosTab({ documents, projectId, isAdmin }: Props) {
  const router = useRouter()
  const docInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [docUploading, setDocUploading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const docs = documents.filter((d) => d.category === 'documento')
  const photos = documents.filter((d) => d.category === 'foto')

  // ── Document upload ──────────────────────────────────────────────────────

  async function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.type !== 'application/pdf') {
      setDocError('Solo se aceptan archivos PDF.')
      return
    }
    if (file.size > MAX_SIZE) {
      setDocError('El archivo supera los 10 MB.')
      return
    }

    setDocError(null)
    setDocUploading(true)

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${projectId}/documentos/${Date.now()}_${safeName}`
      const { publicUrl, error: storageError } = await uploadToStorage(file, storagePath)
      if (storageError) throw new Error(storageError)

      const res = await createDocumentRecord({
        project_id: projectId,
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        category: 'documento',
        size_bytes: file.size,
      })
      if (res.error) throw new Error(res.error)
      router.refresh()
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Error al subir el archivo.')
    } finally {
      setDocUploading(false)
    }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''

    const oversized = files.find((f) => f.size > MAX_SIZE)
    if (oversized) {
      setPhotoError(`"${oversized.name}" supera los 10 MB.`)
      return
    }

    setPhotoError(null)
    setPhotoUploading(true)

    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `${projectId}/fotos/${Date.now()}_${safeName}`
        const { publicUrl, error: storageError } = await uploadToStorage(file, storagePath)
        if (storageError) throw new Error(storageError)

        const res = await createDocumentRecord({
          project_id: projectId,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          category: 'foto',
          size_bytes: file.size,
        })
        if (res.error) throw new Error(res.error)
      }
      router.refresh()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Error al subir la foto.')
    } finally {
      setPhotoUploading(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(doc: ProjectDocument) {
    const label = doc.category === 'foto' ? 'esta foto' : 'este documento'
    if (!confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) return

    setDeletingId(doc.id)
    const res = await deleteDocument(doc.id, doc.file_url, projectId)
    setDeletingId(null)
    if (res.error) {
      alert(`Error al eliminar: ${res.error}`)
      return
    }
    router.refresh()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Documentos ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Documentos del proyecto</h2>
          {isAdmin && (
            <button
              onClick={() => { setDocError(null); docInputRef.current?.click() }}
              disabled={docUploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {docUploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {docUploading ? 'Subiendo...' : 'Subir documento'}
            </button>
          )}
        </div>

        {docError && (
          <p className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {docError}
          </p>
        )}

        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-10 text-center text-sm text-zinc-400">
            Sin documentos cargados
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <ul className="divide-y divide-zinc-100">
              {docs.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                  <DocIcon fileType={doc.file_type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800">{doc.name}</p>
                    <p className="text-xs text-zinc-400">
                      {formatFecha(doc.created_at)} · {formatBytes(doc.size_bytes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                      title="Abrir"
                    >
                      <ExternalLink size={14} />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="rounded-md p-1.5 text-zinc-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        title="Eliminar"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Fotos ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Fotos de terreno</h2>
          {isAdmin && (
            <button
              onClick={() => { setPhotoError(null); photoInputRef.current?.click() }}
              disabled={photoUploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {photoUploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {photoUploading ? 'Subiendo...' : 'Subir fotos'}
            </button>
          )}
        </div>

        {photoError && (
          <p className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {photoError}
          </p>
        )}

        {photos.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center">
            <Images size={32} className="mb-3 text-zinc-200" strokeWidth={1.5} />
            <p className="text-sm text-zinc-400">Sin fotos cargadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, i) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                {/* Thumbnail */}
                <button
                  className="block w-full"
                  onClick={() => setLightboxIndex(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.file_url}
                    alt={photo.name}
                    className="aspect-square w-full object-cover transition group-hover:opacity-90"
                  />
                </button>

                {/* Hover caption */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/60 px-2 py-1.5 transition group-hover:translate-y-0">
                  <p className="truncate text-xs font-medium text-white">{photo.name}</p>
                  <p className="text-xs text-white/60">{formatFecha(photo.created_at)}</p>
                </div>

                {/* Delete button */}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(photo)}
                    disabled={deletingId === photo.id}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/40 p-1 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100 disabled:opacity-60"
                    title="Eliminar foto"
                  >
                    {deletingId === photo.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hidden file inputs */}
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleDocChange}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*,.heic"
        multiple
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* Photo lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
