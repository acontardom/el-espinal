import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/auth'
import { listUsers } from '@/lib/users'
import { UsuariosClient } from './components/UsuariosClient'

export default async function UsuariosPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'superadmin') redirect('/dashboard')

  const users = await listUsers()

  return <UsuariosClient users={users} currentUserId={profile.id} />
}
