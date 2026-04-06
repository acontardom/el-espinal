'use client'

import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatLabel(d: Date): string {
  return d.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DayState = 'reported' | 'missed' | 'weekend' | 'future' | 'today_reported' | 'today_missed'

type DayInfo = {
  date: Date
  dateStr: string
  dayNum: number
  state: DayState
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  /** Array of 'YYYY-MM-DD' strings that have a report */
  reportedDates: string[]
  days?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CumplimientoCalendario({ reportedDates, days = 30 }: Props) {
  const reportedSet = new Set(reportedDates)
  const todayStr = toDateStr(new Date())

  // Build the array of day objects from oldest → newest
  const dayInfos: DayInfo[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const dateStr = toDateStr(d)
    const dow = d.getDay() // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6
    const isToday = dateStr === todayStr
    const isFuture = dateStr > todayStr
    const hasReport = reportedSet.has(dateStr)

    let state: DayState
    if (isFuture) {
      state = 'future'
    } else if (isWeekend) {
      state = 'weekend'
    } else if (isToday) {
      state = hasReport ? 'today_reported' : 'today_missed'
    } else {
      state = hasReport ? 'reported' : 'missed'
    }

    dayInfos.push({ date: d, dateStr, dayNum: d.getDate(), state })
  }

  // Count workday compliance
  const workdays = dayInfos.filter(
    (d) => d.state !== 'weekend' && d.state !== 'future'
  )
  const reported = workdays.filter(
    (d) => d.state === 'reported' || d.state === 'today_reported'
  ).length
  const pct = workdays.length > 0 ? Math.round((reported / workdays.length) * 100) : 0

  // Pad the start so first day aligns to its weekday column (Mon=0...Sun=6)
  // We use Monday-first layout: Mon=0 Tue=1 ... Sun=6
  const firstDow = dayInfos[0].date.getDay() // 0=Sun...6=Sat
  const padStart = firstDow === 0 ? 6 : firstDow - 1 // convert to Mon-first

  // Cell style map
  const cellBase =
    'relative flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-all select-none'

  const stateStyle: Record<DayState, string> = {
    reported:       'bg-green-500 text-white',
    today_reported: 'bg-green-500 text-white ring-2 ring-offset-1 ring-green-700',
    missed:         'bg-red-100 text-red-600',
    today_missed:   'bg-red-100 text-red-600 ring-2 ring-offset-1 ring-red-400',
    weekend:        'bg-zinc-100 text-zinc-400',
    future:         'bg-white text-zinc-200 border border-zinc-100',
  }

  const stateTooltip: Record<DayState, string> = {
    reported:       'Reportado',
    today_reported: 'Reportado (hoy)',
    missed:         'Sin reporte',
    today_missed:   'Pendiente (hoy)',
    weekend:        'Fin de semana',
    future:         '',
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Cumplimiento — últimos {days} días</h3>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            pct >= 80
              ? 'bg-green-100 text-green-700'
              : pct >= 50
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
          )}
        >
          {pct}%
        </span>
      </div>

      {/* Day-of-week headers (Mon–Sun) */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="flex h-6 items-center justify-center text-[10px] font-medium text-zinc-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding cells at start */}
        {Array.from({ length: padStart }).map((_, i) => (
          <div key={`pad-${i}`} className="h-8 w-8" />
        ))}

        {/* Day cells */}
        {dayInfos.map((day) => (
          <div
            key={day.dateStr}
            className="group relative flex justify-center"
          >
            <div
              className={cn(cellBase, stateStyle[day.state])}
              aria-label={`${formatLabel(day.date)} — ${stateTooltip[day.state] || ''}`}
            >
              {day.dayNum}
            </div>

            {/* Tooltip */}
            {day.state !== 'future' && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                <span className="capitalize">{formatLabel(day.date)}</span>
                <br />
                <span
                  className={
                    day.state === 'reported' || day.state === 'today_reported'
                      ? 'text-green-400'
                      : day.state === 'weekend'
                        ? 'text-zinc-400'
                        : 'text-red-400'
                  }
                >
                  {stateTooltip[day.state]}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 flex items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
        <span>
          <span className="font-semibold text-zinc-900">{reported}</span> de{' '}
          <span className="font-semibold text-zinc-900">{workdays.length}</span> días hábiles reportados
        </span>
        <div className="ml-auto flex items-center gap-3">
          <LegendDot color="bg-green-500" label="Reportado" />
          <LegendDot color="bg-red-100 border border-red-200" label="Sin reporte" />
          <LegendDot color="bg-zinc-100" label="Fin de semana" />
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', color)} />
      {label}
    </span>
  )
}
