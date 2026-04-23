import { createClient } from './supabase/server'

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: 'superadmin' | 'admin' | 'operador'
}

export async function getUser(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: user.id,
    email: user.email!,
    full_name: profile.full_name,
    role: profile.role,
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return getUser()
}

