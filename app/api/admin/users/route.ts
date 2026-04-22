import { NextRequest, NextResponse } from 'next/server'
import { listUsers, createUser } from '@/lib/users'

export async function GET() {
  try {
    const users = await listUsers()
    return NextResponse.json(users)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    const status = msg === 'No autorizado' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createUser(body)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    const status = msg === 'No autorizado' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
