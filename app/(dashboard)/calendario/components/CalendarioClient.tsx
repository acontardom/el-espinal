'use client'

import { useState, useTransition, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getCalendarioData,
  type CalendarMachine,
  type CalendarAssignment,
} from '@/lib/calendario'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_WIDTH = 36   // px per day column
const ROW_HEIGHT = 56  // px per machine row
const MACHINE_COL_WIDTH = 184 // px for the fixed left column

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DOW_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

// Project color palette
const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
  '#14b8a6', '#a855f7', '#64748b', '#dc2626', '#0d9488',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProjectColor(projectId: string): string {
  let hash = 0
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) & 0x7fffffff
  }
  return PALETTE[hash % PALETTE.length]
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay() // 0=Sun, 6=Sat
}

function formatDateShort(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

/**
 * Returns the 1-indexed day columns [colStart, colEnd] (inclusive) within the
 * given month, clamped to the month boundaries. Returns null if no overlap.
 */
function getBarSpan(
  assignment: CalendarAssignment,
  month: number,
  year: number,
  totalDays: number
): { colStart: number; colEnd: number } | null {
  const mm = String(month).padStart(2, '0')
  const firstDay = `${year}-${mm}-01`
  const lastDay = `${year}-${mm}-${String(totalDays).padStart(2, '0')}`

  const assignEnd = assignment.end_date ?? lastDay

  // No overlap
  if (assignment.start_date > lastDay) return null
  if (assignEnd < firstDay) return null

  const startClamped = assignment.start_date < firstDay ? firstDay : assignment.start_date
  const endClamped = assignEnd > lastDay ? lastDay : assignEnd

  const colStart = parseInt(startClamped.split('-')[2], 10)
  const colEnd = parseInt(endClamped.split('-')[2], 10)

  return { colStart, colEnd }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  initialMonth: number
  initialYear: number
  initialMachines: CalendarMachine[]
  initialAssignments: CalendarAssignment[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarioClient({
  initialMonth,
  initialYear,
  initialMachines,
  initialAssignments,
}: Props) {
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [machines, setMachines] = useState(initialMachines)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [isPending, startTransition] = useTransition()
  const [filterType, setFilterType] = useState('')
  const [filterProject, setFilterProject] = useState('')

  const today = new Date()
  const isCurrentMonth =
    month === today.getMonth() + 1 && year === today.getFullYear()
  const totalDays = getDaysInMonth(year, month)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  // ── Navigation ─────────────────────────────────────────────────────────────

  function navigateTo(newMonth: number, newYear: number) {
    startTransition(async () => {
      const data = await getCalendarioData(newMonth, newYear)
      setMonth(newMonth)
      setYear(newYear)
      setMachines(data.machines)
      setAssignments(data.assignments)
      setFilterProject('') // reset project filter on month change
    })
  }

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    navigateTo(d.getMonth() + 1, d.getFullYear())
  }

  function nextMonth() {
    const d = new Date(year, month, 1)
    navigateTo(d.getMonth() + 1, d.getFullYear())
  }

  function goToday() {
    navigateTo(today.getMonth() + 1, today.getFullYear())
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const machineTypes = useMemo(
    () => [...new Set(machines.map((m) => m.type))].sort(),
    [machines]
  )

  const projects = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>()
    for (const a of assignments) {
      if (a.project) map.set(a.project.id, a.project)
    }
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code))
  }, [assignments])

  const assignmentsByMachine = useMemo(() => {
    const map = new Map<string, CalendarAssignment[]>()
    for (const a of assignments) {
      if (!map.has(a.machine_id)) map.set(a.machine_id, [])
      map.get(a.machine_id)!.push(a)
    }
    return map
  }, [assignments])

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (filterType && m.type !== filterType) return false
      if (filterProject) {
        return assignments.some(
          (a) => a.machine_id === m.id && a.project_id === filterProject
        )
      }
      return true
    })
  }, [machines, assignments, filterType, filterProject])

  const availableMachines = useMemo(
    () =>
      machines.filter(
        (m) => !assignmentsByMachine.has(m.id) && (!filterType || m.type === filterType)
      ),
    [machines, assignmentsByMachine, filterType]
  )

  const hasFilters = filterType !== '' || filterProject !== ''

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Calendario operativo</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {machines.length} máquina{machines.length !== 1 ? 's' : ''} activa
            {machines.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Hoy
            </button>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
            <button
              onClick={prevMonth}
              disabled={isPending}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[160px] text-center text-sm font-medium text-zinc-900 capitalize">
              {MONTHS_ES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              disabled={isPending}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        >
          <option value="">Todos los tipos</option>
          {machineTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setFilterType(''); setFilterProject('') }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-50"
          >
            <X size={13} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Gantt grid ── */}
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-zinc-200 bg-white transition-opacity duration-150',
          isPending && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="overflow-x-auto">
          {/* The inner container sets the total width so scroll works */}
          <div style={{ minWidth: MACHINE_COL_WIDTH + totalDays * DAY_WIDTH }}>

            {/* ── Days header ── */}
            <div className="flex border-b border-zinc-200 bg-zinc-50">
              {/* Machine column header */}
              <div
                className="shrink-0 border-r border-zinc-200 sticky left-0 bg-zinc-50 z-20 flex items-end px-3 py-2"
                style={{ width: MACHINE_COL_WIDTH }}
              >
                <span className="text-xs font-medium text-zinc-500">Máquina</span>
              </div>

              {/* Day number headers */}
              <div className="flex">
                {days.map((day) => {
                  const dow = getDayOfWeek(year, month, day)
                  const isWeekend = dow === 0 || dow === 6
                  const isTodayCol = isCurrentMonth && day === today.getDate()
                  return (
                    <div
                      key={day}
                      className={cn(
                        'shrink-0 flex flex-col items-center justify-center border-r border-zinc-200 py-1.5',
                        isWeekend ? 'bg-zinc-100' : 'bg-zinc-50',
                        isTodayCol && '!bg-blue-50'
                      )}
                      style={{ width: DAY_WIDTH }}
                    >
                      <span
                        className={cn(
                          'text-xs font-semibold leading-none tabular-nums',
                          isTodayCol
                            ? 'text-blue-600'
                            : isWeekend
                              ? 'text-zinc-400'
                              : 'text-zinc-600'
                        )}
                      >
                        {day}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 text-[9px] leading-none',
                          isTodayCol ? 'text-blue-400' : isWeekend ? 'text-zinc-400' : 'text-zinc-300'
                        )}
                      >
                        {DOW_ES[dow]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Machine rows ── */}
            {filteredMachines.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-400">
                No hay máquinas que coincidan con los filtros.
              </div>
            ) : (
              filteredMachines.map((machine, idx) => {
                const machineAssignments = assignmentsByMachine.get(machine.id) ?? []
                const isEven = idx % 2 === 0

                return (
                  <div
                    key={machine.id}
                    className={cn(
                      'flex border-b border-zinc-100 last:border-0',
                      isEven ? 'bg-white' : 'bg-zinc-50/40'
                    )}
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Fixed machine name column */}
                    <div
                      className={cn(
                        'shrink-0 flex flex-col justify-center border-r border-zinc-200 px-3 sticky left-0 z-10',
                        isEven ? 'bg-white' : 'bg-zinc-50/40'
                      )}
                      style={{ width: MACHINE_COL_WIDTH }}
                    >
                      <span className="font-mono text-[10px] leading-none text-zinc-400">
                        {machine.code}
                      </span>
                      <span className="mt-0.5 truncate text-sm font-medium leading-tight text-zinc-900">
                        {machine.name}
                      </span>
                      <span className="truncate text-[11px] leading-none text-zinc-400">
                        {machine.type}
                      </span>
                    </div>

                    {/* Days area with bars */}
                    <div
                      className="relative"
                      style={{ width: totalDays * DAY_WIDTH, height: ROW_HEIGHT }}
                    >
                      {/* Day cell backgrounds */}
                      {days.map((day) => {
                        const dow = getDayOfWeek(year, month, day)
                        const isWeekend = dow === 0 || dow === 6
                        const isTodayCol = isCurrentMonth && day === today.getDate()
                        return (
                          <div
                            key={day}
                            className={cn(
                              'absolute h-full border-r border-zinc-100',
                              isWeekend && 'bg-zinc-100/50',
                              isTodayCol && '!bg-blue-50/60'
                            )}
                            style={{ left: (day - 1) * DAY_WIDTH, width: DAY_WIDTH }}
                          />
                        )
                      })}

                      {/* Assignment bars */}
                      {machineAssignments.map((assignment) => {
                        const span = getBarSpan(assignment, month, year, totalDays)
                        if (!span) return null

                        const color = assignment.project
                          ? getProjectColor(assignment.project.id)
                          : '#94a3b8'

                        const barLeft = (span.colStart - 1) * DAY_WIDTH + 2
                        const barWidth = (span.colEnd - span.colStart + 1) * DAY_WIDTH - 4

                        const tooltip = [
                          assignment.project?.name ?? 'Sin proyecto',
                          assignment.project?.client?.name
                            ? `Cliente: ${assignment.project.client.name}`
                            : null,
                          `Inicio: ${formatDateShort(assignment.start_date)}`,
                          assignment.end_date
                            ? `Fin: ${formatDateShort(assignment.end_date)}`
                            : 'Sin fecha de fin',
                          assignment.daily_rate != null
                            ? `Tarifa diaria: $${assignment.daily_rate.toLocaleString('es-CL')}`
                            : null,
                          assignment.hourly_rate != null
                            ? `Tarifa hora: $${assignment.hourly_rate.toLocaleString('es-CL')}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join('\n')

                        return (
                          <div
                            key={assignment.id}
                            title={tooltip}
                            className="absolute flex items-center overflow-hidden rounded-md px-1.5 cursor-default select-none"
                            style={{
                              left: barLeft,
                              width: barWidth,
                              top: 10,
                              bottom: 10,
                              backgroundColor: color,
                              opacity: 0.88,
                            }}
                          >
                            {barWidth > 48 && (
                              <span className="truncate text-[11px] font-semibold text-white drop-shadow-sm">
                                {assignment.project?.code ?? ''}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Proyectos
          </span>
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: getProjectColor(p.id) }}
              />
              <span className="font-mono text-xs text-zinc-400">{p.code}</span>
              <span className="text-sm text-zinc-700">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Available machines ── */}
      {availableMachines.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Disponibles este mes
            </h2>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {availableMachines.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableMachines.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5"
              >
                <Truck size={14} className="shrink-0 text-zinc-300" strokeWidth={1.5} />
                <div>
                  <p className="font-mono text-[10px] leading-none text-zinc-400">
                    {m.code}
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-tight text-zinc-900">
                    {m.name}
                  </p>
                  <p className="text-[11px] leading-none text-zinc-400">{m.type}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
