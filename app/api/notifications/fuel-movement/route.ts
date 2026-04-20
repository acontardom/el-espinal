import { NextRequest, NextResponse } from 'next/server'
import { triggerFuelMovementNotification } from '@/lib/notifications/triggers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movement_id } = body as { movement_id?: string }
    if (!movement_id) {
      return NextResponse.json({ error: 'movement_id requerido' }, { status: 400 })
    }
    await triggerFuelMovementNotification(movement_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
