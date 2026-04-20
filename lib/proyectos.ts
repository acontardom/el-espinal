'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'cotizacion' | 'activo' | 'pausado' | 'terminado' | 'cancelado'
export type ContractType = 'precio_fijo' | 'por_hitos'
export type CostType = 'maquinaria_propia' | 'subcontrato' | 'material' | 'combustible' | 'otro'
export type MilestoneStatus = 'pendiente' | 'completado' | 'facturado'

export type Project = {
  id: string
  code: string
  name: string
  type: string
  status: ProjectStatus
  contract_type: ContractType | null
  contract_amount: number | null
  client_id: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  client: { id: string; name: string } | null
}

export type ProjectWithStats = Project & {
  milestone_count: number
  pending_milestones: number
  total_costs: number
  machine_count: number
}

export type ProjectDetail = Project & {
  milestones: Milestone[]
  costs: ProjectCost[]
  machines: ProjectMachine[]
}

export type Milestone = {
  id: string
  project_id: string
  name: string
  description: string | null
  amount: number | null
  status: MilestoneStatus
  due_date: string | null
  completed_date: string | null
  invoiced_date: string | null
  invoice_number: string | null
  notes: string | null
  created_at: string
}

export type ProjectCost = {
  id: string
  project_id: string
  type: CostType
  description: string
  amount: number
  cost_date: string
  notes: string | null
  created_at: string
}

export type ProjectMachine = {
  id: string
  project_id: string
  machine_id: string
  start_date: string
  end_date: string | null
  notes: string | null
  created_at: string
  machine: { id: string; code: string; name: string; type: string; status: string } | null
}

export type MachineOption = {
  id: string
  code: string
  name: string
  type: string
  status: string
}

export type ProjectInput = {
  code: string
  name: string
  type: string
  status: ProjectStatus
  contract_type?: ContractType | null
  contract_amount?: number | null
  client_id?: string | null
  location?: string | null
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
}

export type MilestoneInput = {
  project_id: string
  name: string
  description?: string | null
  amount?: number | null
  due_date?: string | null
  notes?: string | null
}

export type ProjectCostInput = {
  project_id: string
  type: CostType
  description: string
  amount: number
  cost_date: string
  notes?: string | null
}

export type ProjectMachineInput = {
  project_id: string
  machine_id: string
  start_date: string
  end_date?: string | null
  notes?: string | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getProjects(status?: ProjectStatus): Promise<ProjectWithStats[]> {
  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select('*, client:clients(id, name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const [projectsRes, milestonesRes, costsRes, machinesRes] = await Promise.all([
    query,
    supabase.from('project_milestones').select('id, project_id, status, amount'),
    supabase.from('project_costs').select('id, project_id, amount'),
    supabase.from('project_machines').select('id, project_id'),
  ])

  if (projectsRes.error) throw new Error(projectsRes.error.message)

  // Build stats maps
  const milestoneCountMap = new Map<string, number>()
  const pendingMilestoneMap = new Map<string, number>()
  for (const m of milestonesRes.data ?? []) {
    milestoneCountMap.set(m.project_id, (milestoneCountMap.get(m.project_id) ?? 0) + 1)
    if (m.status === 'pendiente') {
      pendingMilestoneMap.set(m.project_id, (pendingMilestoneMap.get(m.project_id) ?? 0) + 1)
    }
  }

  const costsMap = new Map<string, number>()
  for (const c of costsRes.data ?? []) {
    costsMap.set(c.project_id, (costsMap.get(c.project_id) ?? 0) + (c.amount ?? 0))
  }

  const machineCountMap = new Map<string, number>()
  for (const pm of machinesRes.data ?? []) {
    machineCountMap.set(pm.project_id, (machineCountMap.get(pm.project_id) ?? 0) + 1)
  }

  return (projectsRes.data ?? []).map((p) => ({
    ...(p as unknown as Project),
    client: (p as any).client ?? null,
    milestone_count: milestoneCountMap.get(p.id) ?? 0,
    pending_milestones: pendingMilestoneMap.get(p.id) ?? 0,
    total_costs: costsMap.get(p.id) ?? 0,
    machine_count: machineCountMap.get(p.id) ?? 0,
  }))
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const supabase = await createClient()

  const [projectRes, milestonesRes, costsRes, machinesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*, client:clients(id, name)')
      .eq('id', id)
      .single(),
    supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', id)
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('project_costs')
      .select('*')
      .eq('project_id', id)
      .order('cost_date', { ascending: false }),
    supabase
      .from('project_machines')
      .select('*, machine:machines(id, code, name, type, status)')
      .eq('project_id', id)
      .order('start_date', { ascending: false }),
  ])

  if (projectRes.error || !projectRes.data) return null

  return {
    ...(projectRes.data as unknown as Project),
    client: (projectRes.data as any).client ?? null,
    milestones: (milestonesRes.data ?? []) as Milestone[],
    costs: (costsRes.data ?? []) as ProjectCost[],
    machines: (machinesRes.data ?? []) as ProjectMachine[],
  }
}

export async function getMachineOptions(): Promise<MachineOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('machines')
    .select('id, code, name, type, status')
    .eq('status', 'activo')
    .order('code')
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Project Mutations ────────────────────────────────────────────────────────

export async function createProject(input: ProjectInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').insert([input])
  if (error) return { error: error.message }
  revalidatePath('/proyectos')
  return {}
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').update(input).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
  return {}
}

// ─── Milestone Mutations ──────────────────────────────────────────────────────

export async function createMilestone(input: MilestoneInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_milestones').insert([{ ...input, status: 'pendiente' }])
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${input.project_id}`)
  return {}
}

export async function completeMilestone(
  id: string,
  projectId: string,
  done_date: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_milestones')
    .update({ status: 'completado', completed_date: done_date })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return {}
}

export async function invoiceMilestone(
  id: string,
  projectId: string,
  invoiced_date: string,
  invoice_number: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_milestones')
    .update({ status: 'facturado', invoiced_date, invoice_number })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return {}
}

export async function deleteMilestone(id: string, projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_milestones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return {}
}

// ─── Cost Mutations ───────────────────────────────────────────────────────────

export async function createCost(input: ProjectCostInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_costs').insert([input])
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${input.project_id}`)
  return {}
}

export async function deleteCost(id: string, projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_costs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return {}
}

// ─── Machine Assignment Mutations ─────────────────────────────────────────────

export async function assignMachine(input: ProjectMachineInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_machines').insert([input])
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${input.project_id}`)
  return {}
}

export async function removeProjectMachine(
  id: string,
  projectId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_machines').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return {}
}
