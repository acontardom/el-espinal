import { NextRequest, NextResponse } from 'next/server'
import { triggerDailySummaryNotification } from '@/lib/notifications/triggers'

// Called by an external cron (Vercel Cron or similar).
// Protect with CRON_SECRET env var.
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await triggerDailySummaryNotification()
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
