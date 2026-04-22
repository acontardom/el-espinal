import { getMachines } from '@/lib/machines'
import { getUserProfile } from '@/lib/auth'
import { MachineTable } from './components/MachineTable'

export default async function MaquinariaPage() {
  const [machines, profile] = await Promise.all([
    getMachines(),
    getUserProfile(),
  ])

  return <MachineTable machines={machines} isAdmin={profile?.role === 'admin' || profile?.role === 'superadmin'} />
}
