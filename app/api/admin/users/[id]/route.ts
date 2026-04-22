import { NextRequest, NextResponse } from 'next/server'
import { updateUser, banUser, unbanUser } from '@/lib/users'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await updateUser(id, body)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    const status = msg === 'No autorizado' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const result = body.unban ? await unbanUser(id) : await banUser(id)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    const status = msg === 'No autorizado' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
