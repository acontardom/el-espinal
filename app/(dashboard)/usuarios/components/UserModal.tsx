'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@base-ui/react/dialog'
import { X, Loader2, ShieldOff } from 'lucide-react'
import { createUser, updateUser, banUser, unbanUser, type UserWithProfile } from '@/lib/users'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  full_name: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['admin', 'operador']),
})

const editSchema = z.object({
  full_name: z.string().min(1, 'Requerido'),
  role: z.enum(['admin', 'operador']),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  'block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'
const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

// ─── Props ────────────────────────────────────────────────────────────────────

type Props =
  | { mode: 'create'; open: boolean; onOpenChange: (o: boolean) => void; user?: never }
  | { mode: 'edit'; open: boolean; onOpenChange: (o: boolean) => void; user: UserWithProfile }

// ─── Create form ─────────────────────────────────────────────────────────────

function CreateForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
    useForm<CreateForm>({
      resolver: zodResolver(createSchema),
      defaultValues: { role: 'operador' },
    })

  async function onSubmit(data: CreateForm) {
    console.log('[CreateForm] enviando:', JSON.stringify(data))
    const res = await createUser(data)
    console.log('[CreateForm] respuesta:', JSON.stringify(res))
    if (res.error) { setError('root', { message: res.error }); return }
    reset()
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div>
        <label className={labelClass}>Nombre completo <span className="text-red-500">*</span></label>
        <input {...register('full_name')} className={inputClass} placeholder="Nombre Apellido" />
        {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Email <span className="text-red-500">*</span></label>
        <input {...register('email')} type="email" className={inputClass} placeholder="usuario@ejemplo.com" />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Contraseña temporal <span className="text-red-500">*</span></label>
        <input {...register('password')} type="password" className={inputClass} placeholder="Mínimo 8 caracteres" />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Rol <span className="text-red-500">*</span></label>
        <select {...register('role')} className={inputClass}>
          <option value="operador">Operador</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {errors.root && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errors.root.message}</p>}
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onDone} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
          {isSubmitting && <Loader2 size={13} className="animate-spin" />}
          {isSubmitting ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditForm({ user, onDone }: { user: UserWithProfile; onDone: () => void }) {
  const router = useRouter()
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
    useForm<EditForm>({ resolver: zodResolver(editSchema) })

  useEffect(() => {
    reset({
      full_name: user.full_name ?? '',
      role: user.role === 'superadmin' ? 'admin' : user.role,
    })
  }, [user, reset])

  async function onSubmit(data: EditForm) {
    console.log('[EditForm] enviando a updateUser id:', user.id, '| data:', JSON.stringify(data))
    const res = await updateUser(user.id, data)
    console.log('[EditForm] respuesta:', JSON.stringify(res))
    if (res.error) { setError('root', { message: res.error }); return }
    router.refresh()
    onDone()
  }

  async function handleBanToggle() {
    const action = user.is_banned ? 'reactivar' : 'suspender'
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.full_name ?? user.email}?`)) return
    const res = user.is_banned ? await unbanUser(user.id) : await banUser(user.id)
    if (res.error) { setError('root', { message: res.error }); return }
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div>
        <label className={labelClass}>Nombre completo <span className="text-red-500">*</span></label>
        <input {...register('full_name')} className={inputClass} />
        {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
      </div>
      {user.role !== 'superadmin' && (
        <div>
          <label className={labelClass}>Rol</label>
          <select {...register('role')} className={inputClass}>
            <option value="operador">Operador</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      )}
      {errors.root && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errors.root.message}</p>}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-100">
        {user.role !== 'superadmin' && (
          <button
            type="button"
            onClick={handleBanToggle}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              user.is_banned
                ? 'text-green-700 hover:bg-green-50'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <ShieldOff size={14} />
            {user.is_banned ? 'Reactivar usuario' : 'Suspender usuario'}
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button type="button" onClick={onDone} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
            {isSubmitting && <Loader2 size={13} className="animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

export function UserModal({ mode, open, onOpenChange, user }: Props) {
  const title = mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-zinc-900">{title}</Dialog.Title>
            <Dialog.Close className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
              <X size={16} />
            </Dialog.Close>
          </div>
          {mode === 'create' ? (
            <CreateForm onDone={() => onOpenChange(false)} />
          ) : (
            <EditForm user={user} onDone={() => onOpenChange(false)} />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
