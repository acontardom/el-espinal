'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from './supabase/admin'
import { getUserProfile } from './auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'superadmin' | 'admin' | 'operador'

export type UserWithProfile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  last_sign_in_at: string | null
  is_banned: boolean
}

export type CreateUserInput = {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'operador'
}

export type UpdateUserInput = {
  full_name?: string
  role?: 'admin' | 'operador'
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireSuperAdmin(): Promise<void> {
  const profile = await getUserProfile()
  if (profile?.role !== 'superadmin') throw new Error('No autorizado')
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<UserWithProfile[]> {
  await requireSuperAdmin()

  const admin = createAdminClient()

  const [authRes, profilesRes] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profiles').select('id, full_name, role'),  // admin bypasea RLS
  ])

  if (authRes.error) throw new Error(authRes.error.message)

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p as { id: string; full_name: string | null; role: UserRole }])
  )

  return authRes.data.users.map((u) => {
    const profile = profileMap.get(u.id)
    const banned =
      u.banned_until != null &&
      u.banned_until !== 'none' &&
      new Date(u.banned_until) > new Date()
    return {
      id: u.id,
      email: u.email ?? '',
      full_name: profile?.full_name ?? null,
      role: (profile?.role ?? 'operador') as UserRole,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      is_banned: banned,
    }
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createUser(input: CreateUserInput): Promise<{ error?: string }> {
  await requireSuperAdmin()

  const admin = createAdminClient()

  console.log('[createUser] Creando auth user:', input.email, '| role:', input.role, '| full_name:', input.full_name)

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })
  if (error) {
    console.error('[createUser] Error al crear auth user:', error.message)
    return { error: error.message }
  }
  if (!data.user) return { error: 'No se pudo crear el usuario' }

  console.log('[createUser] Auth user creado, id:', data.user.id, '— esperando trigger...')

  // Esperar que el trigger de Supabase cree la fila en profiles
  await new Promise((r) => setTimeout(r, 800))

  // Usar admin client para bypassear RLS — el supabase client normal
  // sólo puede editar el perfil del propio usuario (auth.uid() = id)
  const { error: profileError } = await admin
    .from('profiles')
    .update({ full_name: input.full_name, role: input.role })
    .eq('id', data.user.id)

  if (profileError) {
    console.error('[createUser] Error al actualizar perfil:', profileError.message)
    return { error: 'Usuario creado pero no se pudo guardar el perfil: ' + profileError.message }
  }

  console.log('[createUser] Perfil actualizado correctamente')

  revalidatePath('/usuarios')
  return {}
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<{ error?: string }> {
  await requireSuperAdmin()

  console.log('[updateUser] id:', id, '| input:', JSON.stringify(input))

  // Usar admin client para bypassear RLS
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  console.log('[updateUser] resultado:', JSON.stringify(data), '| error:', error?.message)

  if (error) return { error: error.message }
  revalidatePath('/usuarios')
  return {}
}

export async function banUser(id: string): Promise<{ error?: string }> {
  await requireSuperAdmin()

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: '87600h',
  })
  if (error) return { error: error.message }
  revalidatePath('/usuarios')
  return {}
}

export async function unbanUser(id: string): Promise<{ error?: string }> {
  await requireSuperAdmin()

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: 'none',
  })
  if (error) return { error: error.message }
  revalidatePath('/usuarios')
  return {}
}
