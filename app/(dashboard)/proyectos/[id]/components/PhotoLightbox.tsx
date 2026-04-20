'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { type ProjectDocument } from '@/lib/documentos'

function formatFecha(d: string) {
  const date = d.split('T')[0]
  const [y, m, day] = date.split('-')
  return `${day}/${m}/${y}`
}

type Props = {
  photos: ProjectDocument[]
  initialIndex: number
  onClose: () => void
}

export function PhotoLightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const current = photos[index]

  function prev() {
    setIndex((i) => (i === 0 ? photos.length - 1 : i - 1))
  }

  function next() {
    setIndex((i) => (i === photos.length - 1 ? 0 : i + 1))
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          aria-label="Anterior"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.file_url}
        alt={current.name}
        className="max-h-[80vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
          aria-label="Siguiente"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Caption */}
      <div
        className="mt-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-white">{current.name}</p>
        <p className="mt-0.5 text-xs text-white/60">{formatFecha(current.created_at)}</p>
        {photos.length > 1 && (
          <p className="mt-1 text-xs text-white/40">
            {index + 1} / {photos.length}
          </p>
        )}
      </div>
    </div>
  )
}
