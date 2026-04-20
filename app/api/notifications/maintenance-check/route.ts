import { NextRequest, NextResponse } from 'next/server'
import { triggerMaintenanceCheckNotification } from '@/lib/notifications/triggers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { machine_id, current_hours } = body as { machine_id?: string; current_hours?: number }
    if (!machine_id || current_hours == null) {
      return NextResponse.json({ error: 'machine_id y current_hours requeridos' }, { status: 400 })
    }
    await triggerMaintenanceCheckNotification(machine_id, current_hours)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
