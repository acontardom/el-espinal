// Pure functions — no server dependencies, safe to call anywhere server-side

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string): string {
  const date = d.includes('T') ? d.split('T')[0] : d
  const [y, m, day] = date.split('-')
  return `${day}/${m}/${y}`
}

function fmtN(n: number | null | undefined, dec = 1): string {
  if (n == null) return '—'
  return n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>El Espinal</title>
</head>
<body style="margin:0;padding:24px 16px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#18181b;padding:22px 28px;">
      <div style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">El Espinal</div>
      <div style="font-size:12px;color:#71717a;margin-top:3px;">Sistema de gestión de maquinaria</div>
    </div>
    <div style="background:#ffffff;padding:28px;">
      ${content}
    </div>
    <div style="background:#f4f4f5;padding:14px 28px;text-align:center;border-top:1px solid #e4e4e7;">
      <p style="margin:0;font-size:11px;color:#a1a1aa;">Mensaje automático — no responder a este correo.</p>
    </div>
  </div>
</body>
</html>`
}

function badge(text: string, color: { bg: string; text: string }): string {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${color.bg};color:${color.text};">${text}</span>`
}

function infoTable(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      (r) => `<tr>
        <td style="padding:8px 0;font-size:13px;color:#71717a;width:40%;vertical-align:top;">${r.label}</td>
        <td style="padding:8px 0;font-size:13px;color:#18181b;font-weight:500;">${r.value}</td>
      </tr>`
    )
    .join('')
  return `<table style="width:100%;border-collapse:collapse;">${cells}</table>`
}

function sectionTitle(text: string): string {
  return `<h3 style="margin:24px 0 10px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">${text}</h3>`
}

// ─── Fuel Movement ────────────────────────────────────────────────────────────

type FuelMovementData = {
  type: 'carga' | 'descarga'
  movement_date: string
  liters: number
  tank: { code: string; name: string; current_liters?: number } | null
  machine?: { code: string; name: string } | null
  operator?: string | null
}

export function fuelMovementTemplate(data: FuelMovementData): { subject: string; html: string } {
  const isCarga = data.type === 'carga'
  const accent = isCarga
    ? { bg: '#dbeafe', text: '#1d4ed8' }
    : { bg: '#ffedd5', text: '#c2410c' }
  const tipoLabel = isCarga ? '⬆ Carga a estanque' : '⬇ Descarga a máquina'

  const rows: { label: string; value: string }[] = [
    { label: 'Tipo', value: tipoLabel },
    { label: 'Estanque', value: data.tank ? `${data.tank.code} — ${data.tank.name}` : '—' },
    { label: 'Litros', value: `${fmtN(data.liters, 1)} L` },
  ]
  if (!isCarga && data.machine) {
    rows.push({ label: 'Máquina', value: `${data.machine.code} — ${data.machine.name}` })
  }
  if (data.operator) rows.push({ label: 'Operador', value: data.operator })
  rows.push({ label: 'Fecha', value: fmt(data.movement_date) })
  if (data.tank?.current_liters != null) {
    rows.push({ label: 'Stock resultante', value: `${fmtN(data.tank.current_liters, 1)} L` })
  }

  const subject = `🛢️ Movimiento de combustible — El Espinal`
  const html = layout(`
    <div style="margin-bottom:20px;">${badge(tipoLabel, accent)}</div>
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#18181b;">
      ${fmtN(data.liters, 1)} litros ${isCarga ? 'cargados' : 'descargados'}
    </h2>
    ${infoTable(rows)}
  `)
  return { subject, html }
}

// ─── Daily Summary ────────────────────────────────────────────────────────────

type DailySummaryData = {
  date: string
  reports: Array<{
    machine?: { code: string; name: string } | null
    hours_reading: number
    operator?: { full_name: string | null } | null
  }>
  allMachines: Array<{ id: string; code: string; name: string }>
  reportedMachineIds: Set<string>
  movements: Array<{
    type: string
    liters: number
    tank?: { code: string; name: string } | null
    machine?: { code: string; name: string } | null
  }>
  tanks: Array<{
    code: string
    name: string
    current_liters: number
    capacity_liters: number | null
  }>
}

export function dailySummaryTemplate(data: DailySummaryData): { subject: string; html: string } {
  const { date, reports, allMachines, reportedMachineIds, movements, tanks } = data
  const noReport = allMachines.filter((m) => !reportedMachineIds.has(m.id))
  const cargas = movements.filter((m) => m.type === 'carga')
  const descargas = movements.filter((m) => m.type === 'descarga')

  // Section 1: Horómetros
  let horometrosHtml = ''
  if (reports.length === 0) {
    horometrosHtml = `<p style="font-size:13px;color:#a1a1aa;margin:0;">Sin reportes hoy.</p>`
  } else {
    const rows = reports
      .map(
        (r) => `<tr style="border-bottom:1px solid #f4f4f5;">
          <td style="padding:7px 8px;font-size:13px;color:#18181b;">${r.machine ? `${r.machine.code} — ${r.machine.name}` : '—'}</td>
          <td style="padding:7px 8px;font-size:13px;color:#18181b;text-align:right;">${fmtN(r.hours_reading, 1)} h</td>
          <td style="padding:7px 8px;font-size:13px;color:#52525b;">${r.operator?.full_name ?? '—'}</td>
        </tr>`
      )
      .join('')
    horometrosHtml = `
      <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f4f4f5;">
          <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:left;">Equipo</th>
          <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:right;">Horas</th>
          <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:left;">Operador</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`
  }

  let noReportHtml = ''
  if (noReport.length > 0) {
    const items = noReport.map((m) => `<li style="font-size:13px;color:#71717a;">${m.code} — ${m.name}</li>`).join('')
    noReportHtml = `
      <div style="margin-top:12px;padding:12px 16px;background:#fef9c3;border-radius:8px;border:1px solid #fef08a;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#854d0e;">Sin reporte (${noReport.length}):</p>
        <ul style="margin:0;padding-left:18px;">${items}</ul>
      </div>`
  }

  // Section 2: Combustible
  let combustibleHtml = ''
  if (movements.length === 0) {
    combustibleHtml = `<p style="font-size:13px;color:#a1a1aa;margin:0;">Sin movimientos hoy.</p>`
  } else {
    const rows = movements
      .map(
        (m) => `<tr style="border-bottom:1px solid #f4f4f5;">
          <td style="padding:7px 8px;font-size:13px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${m.type === 'carga' ? '#dbeafe' : '#ffedd5'};color:${m.type === 'carga' ? '#1d4ed8' : '#c2410c'};">
              ${m.type === 'carga' ? '⬆ Carga' : '⬇ Descarga'}
            </span>
          </td>
          <td style="padding:7px 8px;font-size:13px;color:#18181b;">${m.tank ? `${m.tank.code} — ${m.tank.name}` : '—'}</td>
          <td style="padding:7px 8px;font-size:13px;color:#52525b;">${m.machine ? m.machine.code : '—'}</td>
          <td style="padding:7px 8px;font-size:13px;color:#18181b;text-align:right;font-weight:500;">${fmtN(m.liters, 1)} L</td>
        </tr>`
      )
      .join('')
    combustibleHtml = `
      <div style="margin-bottom:8px;font-size:13px;color:#52525b;">
        ${cargas.length} carga${cargas.length !== 1 ? 's' : ''} · ${descargas.length} descarga${descargas.length !== 1 ? 's' : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f4f4f5;">
          <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:left;">Tipo</th>
          <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:left;">Estanque</th>
          <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:left;">Máquina</th>
          <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:right;">Litros</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`
  }

  // Section 3: Estanques
  const tankRows = tanks
    .map((t) => {
      const pct = t.capacity_liters ? Math.round((t.current_liters / t.capacity_liters) * 100) : null
      return `<tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:7px 8px;font-size:13px;color:#18181b;">${t.code} — ${t.name}</td>
        <td style="padding:7px 8px;font-size:13px;color:#18181b;text-align:right;font-weight:500;">${fmtN(t.current_liters, 0)} L</td>
        <td style="padding:7px 8px;font-size:13px;color:#52525b;text-align:right;">${t.capacity_liters ? `${fmtN(t.capacity_liters, 0)} L` : '—'}</td>
        <td style="padding:7px 8px;font-size:13px;text-align:right;">
          ${pct != null ? `<span style="color:${pct > 50 ? '#16a34a' : pct > 20 ? '#d97706' : '#dc2626'};font-weight:600;">${pct}%</span>` : '—'}
        </td>
      </tr>`
    })
    .join('')

  const subject = `📋 Resumen diario — El Espinal ${fmt(date)}`
  const html = layout(`
    <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#18181b;">Resumen del día</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#71717a;">${fmt(date)}</p>

    ${sectionTitle(`Horómetros — ${reports.length} de ${allMachines.length} equipos`)}
    ${horometrosHtml}
    ${noReportHtml}

    ${sectionTitle('Combustible')}
    ${combustibleHtml}

    ${sectionTitle('Stock de estanques')}
    <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
      <thead><tr style="background:#f4f4f5;">
        <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:left;">Estanque</th>
        <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:right;">Stock</th>
        <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:right;">Capacidad</th>
        <th style="padding:8px;font-size:12px;font-weight:600;color:#71717a;text-align:right;">%</th>
      </tr></thead>
      <tbody>${tankRows || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#a1a1aa;font-size:13px;">Sin estanques activos</td></tr>'}</tbody>
    </table>
  `)
  return { subject, html }
}

// ─── Maintenance Warning ──────────────────────────────────────────────────────

type MaintenanceAlertData = {
  machine: { code: string; name: string; current_hours?: number | null }
  maintenance: { type: string; description?: string | null; scheduled_hours?: number | null }
  currentHours: number
  horasRestantes: number
}

export function maintenanceWarningTemplate(data: MaintenanceAlertData): { subject: string; html: string } {
  const { machine, maintenance, currentHours, horasRestantes } = data
  const subject = `⚠️ Mantención próxima — ${machine.code} ${machine.name}`
  const html = layout(`
    <div style="margin-bottom:16px;padding:12px 16px;background:#fef9c3;border-radius:8px;border:1px solid #fef08a;">
      <span style="font-size:14px;font-weight:600;color:#854d0e;">⚠️ Mantención próxima</span>
    </div>
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#18181b;">
      ${machine.code} — ${machine.name}
    </h2>
    ${infoTable([
      { label: 'Tipo de mantención', value: maintenance.type },
      ...(maintenance.description ? [{ label: 'Descripción', value: maintenance.description }] : []),
      { label: 'Horas actuales', value: `${fmtN(currentHours, 1)} h` },
      { label: 'Horas programadas', value: maintenance.scheduled_hours ? `${fmtN(maintenance.scheduled_hours, 1)} h` : '—' },
      { label: 'Horas restantes', value: `${fmtN(horasRestantes, 1)} h` },
    ])}
    <div style="margin-top:20px;padding:12px 16px;background:#f4f4f5;border-radius:8px;">
      <p style="margin:0;font-size:13px;color:#52525b;">Programa la mantención antes de que el equipo alcance las horas límite.</p>
    </div>
  `)
  return { subject, html }
}

export function maintenanceOverdueTemplate(data: MaintenanceAlertData): { subject: string; html: string } {
  const { machine, maintenance, currentHours, horasRestantes } = data
  const subject = `🚨 Mantención VENCIDA — ${machine.code} ${machine.name}`
  const html = layout(`
    <div style="margin-bottom:16px;padding:12px 16px;background:#fee2e2;border-radius:8px;border:1px solid #fca5a5;">
      <span style="font-size:14px;font-weight:600;color:#991b1b;">🚨 Mantención VENCIDA</span>
    </div>
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#18181b;">
      ${machine.code} — ${machine.name}
    </h2>
    ${infoTable([
      { label: 'Tipo de mantención', value: maintenance.type },
      ...(maintenance.description ? [{ label: 'Descripción', value: maintenance.description }] : []),
      { label: 'Horas actuales', value: `${fmtN(currentHours, 1)} h` },
      { label: 'Horas programadas', value: maintenance.scheduled_hours ? `${fmtN(maintenance.scheduled_hours, 1)} h` : '—' },
      { label: 'Horas vencidas', value: `${fmtN(Math.abs(horasRestantes), 1)} h` },
    ])}
    <div style="margin-top:20px;padding:12px 16px;background:#fee2e2;border-radius:8px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#991b1b;">
        Este equipo ha superado las horas de mantención programadas. Se requiere acción inmediata.
      </p>
    </div>
  `)
  return { subject, html }
}
