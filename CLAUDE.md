@AGENTS.md

# El Espinal — App de gestión interna

## Stack y versiones

| Tecnología | Versión |
|---|---|
| Next.js | 16.2.2 |
| React | 19.2.4 |
| TypeScript | ^5 |
| @supabase/ssr | ^0.10.0 |
| @supabase/supabase-js | ^2.101.1 |
| @base-ui/react | ^1.3.0 |
| Tailwind CSS | ^4 |
| shadcn (CLI) | ^4.1.2 |
| react-hook-form | ^7.72.1 |
| zod | ^4.3.6 |
| @hookform/resolvers | ^5.2.2 |
| lucide-react | ^1.7.0 |
| resend | última |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^3.5.0 |

**Importante:** Este es Next.js 16, NO Next.js 14. Las APIs pueden diferir del conocimiento de entrenamiento. Revisar `node_modules/next/dist/docs/` ante dudas.

---

## Deploy

- **Plataforma:** Vercel + GitHub
- **URL producción:** `el-espinal.vercel.app`
- **CI/CD:** Push a `main` → deploy automático en Vercel
- **Proxy:** `proxy.ts` en la raíz (antes `middleware.ts` — renombrado y función renombrada a `proxy` por convención de Next.js 16)

### Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL        ← URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY   ← anon/public key
SUPABASE_SERVICE_ROLE_KEY       ← service role key (solo servidor, nunca al cliente)
RESEND_API_KEY                  ← para notificaciones por email
```

---

## Estructura de carpetas real y completa

```
maquinaria-app/
├── proxy.ts                                ← guard de rutas + refresco sesión (función exportada: proxy)
├── app/
│   ├── globals.css
│   ├── layout.tsx                          ← root layout con fuentes Geist
│   ├── page.tsx                            ← redirect('/dashboard')
│   ├── actions/
│   │   └── auth.ts                         ← 'use server' a nivel archivo; logout()
│   ├── api/
│   │   ├── admin/
│   │   │   └── users/
│   │   │       ├── route.ts                ← GET listUsers, POST createUser
│   │   │       └── [id]/route.ts           ← PATCH updateUser, DELETE ban/unban
│   │   └── notifications/
│   │       ├── fuel-movement/route.ts      ← POST → triggerFuelMovementNotification
│   │       ├── maintenance-check/route.ts  ← POST → triggerMaintenanceCheckNotification
│   │       └── daily-summary/route.ts      ← POST (requiere x-cron-secret) → triggerDailySummaryNotification
│   ├── (auth)/
│   │   ├── layout.tsx                      ← centra contenido en pantalla
│   │   └── login/
│   │       └── page.tsx                    ← formulario email+password, 'use client'
│   └── (dashboard)/
│       ├── layout.tsx                      ← verifica sesión; admin/superadmin → sidebar; operador → OperadorHeader sin sidebar
│       ├── components/
│       │   └── OperadorHeader.tsx          ← 'use client'; header operador con "← Volver" (oculto en /dashboard) + "El Espinal" + salir
│       ├── dashboard/
│       │   ├── page.tsx                    ← bifurca por rol; admin/superadmin → KPIs + flota; operador → acciones rápidas + horómetros
│       │   └── components/
│       │       └── PanelCombustible.tsx    ← resumen mensual combustible para operador
│       ├── maquinaria/
│       │   ├── page.tsx                    ← admin/superadmin only
│       │   ├── components/
│       │   │   ├── MachineTable.tsx
│       │   │   └── MachineModal.tsx
│       │   └── horometros/
│       │       ├── page.tsx                ← admin: tabla + calendario cumplimiento
│       │       ├── nuevo/
│       │       │   └── page.tsx            ← 'use client'; formulario standalone para operador; redirige a /dashboard al guardar
│       │       └── components/
│       │           ├── HorometroTable.tsx
│       │           ├── HorometroForm.tsx   ← usa browser Supabase client
│       │           └── CumplimientoCalendario.tsx  ← heatmap 30 días
│       ├── combustible/
│       │   ├── page.tsx                    ← admin: estanques + movimientos; redirige operador
│       │   ├── components/
│       │   │   ├── CombustibleClient.tsx   ← tabla admin con lightbox de facturas
│       │   │   ├── TankModal.tsx
│       │   │   ├── MovementModal.tsx       ← carga (estanque+fecha+litros+foto) / descarga (estanque+máquina+fecha+litros)
│       │   │   └── ImageLightbox.tsx       ← lightbox facturas
│       │   └── operador/
│       │       ├── page.tsx                ← menú selector: "Cargar en estación" / "Descargar a máquina"
│       │       ├── carga-estacion/
│       │       │   ├── page.tsx            ← Server Component; fetch tanks + machines
│       │       │   └── components/
│       │       │       └── CargaEstacionClient.tsx  ← dos bloques toggle (estanque / carga directa), foto factura, total calculado
│       │       └── descarga/
│       │           ├── page.tsx            ← Server Component; fetch tanks + machines
│       │           └── components/
│       │               └── DescargaClient.tsx  ← estanque → máquina → fecha → litros
│       ├── mantenciones/
│       │   ├── page.tsx                    ← admin/superadmin only
│       │   └── components/
│       │       ├── MantencionesClient.tsx
│       │       ├── MaintenanceModal.tsx
│       │       └── CompleteModal.tsx
│       ├── clientes/
│       │   ├── page.tsx                    ← admin/superadmin only
│       │   ├── components/
│       │   │   ├── ClientesClient.tsx
│       │   │   └── ClientModal.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── ClientDetailClient.tsx
│       ├── proyectos/
│       │   ├── page.tsx                    ← admin/superadmin only
│       │   ├── components/
│       │   │   ├── ProyectosClient.tsx     ← tabs Activos/Cotizaciones/etc.
│       │   │   └── ProjectModal.tsx
│       │   └── [id]/
│       │       ├── page.tsx                ← fetch project + machineOptions + clients + profile + documents
│       │       └── components/
│       │           ├── ProyectoDetailClient.tsx  ← tabs: Resumen / Hitos / Costos / Maquinaria / Archivos (admin)
│       │           ├── TabHitos.tsx
│       │           ├── TabCostos.tsx
│       │           ├── TabMaquinaria.tsx
│       │           ├── ArchivosTab.tsx     ← upload PDF + fotos; elimina de Storage + DB
│       │           └── PhotoLightbox.tsx   ← lightbox prev/next con nombre y fecha
│       ├── calendario/
│       │   ├── page.tsx                    ← admin/superadmin only
│       │   └── components/
│       │       └── CalendarioClient.tsx    ← Gantt mensual, startTransition
│       ├── configuracion/
│       │   ├── page.tsx                    ← admin/superadmin only; 4 tipos de notificación
│       │   └── components/
│       │       └── NotificationCard.tsx    ← toggle on/off, recipients, threshold, send_hour, prueba
│       └── usuarios/
│           ├── page.tsx                    ← superadmin only
│           └── components/
│               ├── UsuariosClient.tsx      ← tabla con filtro por rol, badges de estado
│               └── UserModal.tsx           ← crear (email+password+nombre+rol) / editar (nombre+rol+ban)
├── components/
│   ├── sidebar.tsx                         ← 'use client'; nav para admin y superadmin (superadmin tiene link /usuarios)
│   └── ui/
│       └── button.tsx                      ← @base-ui/react Button con CVA
└── lib/
    ├── supabase/
    │   ├── client.ts                       ← createBrowserClient (Client Components / uploads)
    │   ├── server.ts                       ← createServerClient con cookies (Server Components / Actions)
    │   └── admin.ts                        ← service role key, bypasea RLS (solo servidor)
    ├── auth.ts                             ← getUser(), getUserProfile() — SIN logout (ver app/actions/auth.ts)
    ├── users.ts                            ← 'use server'; listUsers, createUser, updateUser, banUser, unbanUser — todo con adminClient
    ├── machines.ts                         ← 'use server'; CRUD máquinas
    ├── horometros.ts                       ← 'use server'; reportes + getCumplimiento + getMisHorometros
    ├── combustible.ts                      ← 'use server'; tanks + movements + directFuelEntries + getMyFuelActivity
    ├── mantenciones.ts                     ← 'use server'; mantenciones + checkOverdueMaintenances
    ├── proyectos.ts                        ← 'use server'; CRUD proyectos + hitos + costos + maquinaria
    ├── clientes.ts                         ← 'use server'; CRUD clientes
    ├── calendario.ts                       ← 'use server'; getCalendarioData(month, year)
    ├── documentos.ts                       ← 'use server'; getDocuments + createDocumentRecord + deleteDocument
    ├── dashboard.ts                        ← getDashboardData() con Promise.all
    ├── urgency.ts                          ← utilitario puro SIN 'use server'
    ├── utils.ts                            ← cn() = clsx + tailwind-merge
    └── notifications/
        ├── resend.ts                       ← sendEmail, getRecipients, getThreshold, sentInLast24h
        ├── settings.ts                     ← 'use server'; getNotificationSettings, updateNotificationSettings
        ├── templates.ts                    ← pure functions; fuelMovementTemplate, dailySummaryTemplate, etc.
        └── triggers.ts                     ← NO 'use server'; triggerFuelMovementNotification, triggerMaintenanceCheck, triggerDailySummary
```

---

## Módulos completados

| Módulo | Ruta | Roles con acceso |
|---|---|---|
| Autenticación | `/login` | Todos |
| Dashboard admin | `/dashboard` | admin, superadmin |
| Dashboard operador | `/dashboard` | operador |
| Maquinaria | `/maquinaria` | admin, superadmin |
| Horómetros — admin | `/maquinaria/horometros` | admin, superadmin |
| Horómetros — operador | `/maquinaria/horometros/nuevo` | operador |
| Combustible — admin | `/combustible` | admin, superadmin |
| Combustible operador — menú | `/combustible/operador` | operador |
| Combustible operador — carga estación | `/combustible/operador/carga-estacion` | operador |
| Combustible operador — descarga | `/combustible/operador/descarga` | operador |
| Mantenciones | `/mantenciones` | admin, superadmin |
| Clientes | `/clientes`, `/clientes/[id]` | admin, superadmin |
| Proyectos — lista | `/proyectos` | admin, superadmin |
| Proyectos — detalle | `/proyectos/[id]` | admin, superadmin |
| Calendario operativo | `/calendario` | admin, superadmin |
| Configuración notificaciones | `/configuracion` | admin, superadmin |
| Gestión de usuarios | `/usuarios` | superadmin |

---

## Base de datos Supabase

### Tablas y campos exactos

```
profiles
  id uuid (= auth.uid())
  full_name text
  role text  → 'superadmin' | 'admin' | 'operador'

machines
  id uuid
  code text (unique)
  name text
  type text
  brand text?
  model text?
  year int?
  status text  → 'activo' | 'inactivo' | 'en_mantencion'
  current_hours numeric?
  maintenance_interval_hours numeric?
  last_maintenance_hours numeric?
  notes text?
  created_at timestamptz

hourly_reports
  id uuid
  machine_id uuid → machines.id
  operator_id uuid → profiles.id
  reported_date date
  hours_reading numeric
  notes text?
  created_at timestamptz
  UNIQUE: (machine_id, reported_date)

maintenances
  id uuid
  machine_id uuid → machines.id
  type text
  description text?
  status text  → 'programada' | 'realizada' | 'vencida'
  scheduled_date date?
  scheduled_hours numeric?
  done_date date?
  done_hours numeric?
  cost numeric?
  provider text?
  notes text?
  created_by uuid → profiles.id
  created_at timestamptz

tanks
  id uuid
  code text (unique)
  name text
  capacity_liters numeric?
  current_liters numeric (default 0)
  status text  → 'activo' | 'inactivo'
  notes text?
  created_at timestamptz

tank_movements
  id uuid
  type text  → 'carga' | 'descarga'
  tank_id uuid → tanks.id
  machine_id uuid? → machines.id  (solo descargas)
  movement_date date
  liters numeric
  meter_reading numeric?
  price_per_liter numeric?
  supplier text?
  invoice_number text?
  invoice_image_url text?    ← URL pública bucket 'facturas'
  notes text?
  created_by uuid → profiles.id
  created_at timestamptz

direct_fuel_entries              ← cargas directas al estanque del equipo (sin pasar por estanque)
  id uuid
  machine_id uuid → machines.id
  entry_date date              ← OJO: es entry_date, NO movement_date
  liters numeric
  invoice_image_url text?
  notes text?
  created_by uuid → profiles.id
  created_at timestamptz

clients
  id uuid
  name text
  rut text?
  contact_name text?
  contact_email text?
  contact_phone text?
  address text?
  notes text?
  created_at timestamptz

projects
  id uuid
  code text (unique)
  name text
  type text  → 'destronque' | 'preparacion_suelo' | 'tranque' | 'obra_civil' | 'mixto'
  status text  → 'cotizacion' | 'activo' | 'pausado' | 'terminado' | 'cancelado'
  contract_type text?  → 'precio_fijo' | 'por_hitos'
  contract_amount numeric?
  client_id uuid? → clients.id
  location text?
  start_date date?
  end_date date?
  notes text?
  created_at timestamptz

project_milestones
  id uuid
  project_id uuid → projects.id
  name text
  description text?
  amount numeric?
  status text  → 'pendiente' | 'completado' | 'facturado'
  due_date date?
  completed_date date?
  invoiced_date date?
  invoice_number text?
  notes text?
  created_at timestamptz

project_costs
  id uuid
  project_id uuid → projects.id
  type text  → 'maquinaria_propia' | 'subcontrato' | 'material' | 'combustible' | 'otro'
  description text
  amount numeric
  cost_date date             ← es cost_date, NO date
  notes text?
  created_at timestamptz

project_machines
  id uuid
  project_id uuid → projects.id
  machine_id uuid → machines.id
  start_date date            ← es start_date, NO assigned_date
  end_date date?
  notes text?
  created_at timestamptz

project_documents
  id uuid
  project_id uuid → projects.id
  name text
  file_url text              ← URL pública bucket 'project-files'
  file_type text             ← MIME type
  category text  → 'documento' | 'foto'
  size_bytes bigint?
  uploaded_by uuid → profiles.id
  created_at timestamptz

notification_settings
  id uuid
  alert_type text  → 'fuel_movement' | 'daily_summary' | 'maintenance_warning' | 'maintenance_overdue'
  enabled boolean
  recipients text[]
  threshold_hours numeric?   ← para maintenance_warning
  send_hour int?             ← para daily_summary (hora UTC)
  updated_at timestamptz

notification_log
  id uuid
  alert_type text
  sent_at timestamptz
  recipients text[]
  subject text?
```

### RLS

Todas las tablas tienen RLS activado con policy `auth.uid() IS NOT NULL` para acceso general.

**Excepción `profiles`:** operaciones admin (listUsers, updateUser, createUser) usan `createAdminClient()` con service role key para bypassear RLS — el cliente normal solo puede leer/editar el propio perfil.

**Problema histórico con JWT:** PostgREST interpreta el claim `role` del JWT como DB role. Solución: renombrar el claim a `app_role` en el custom JWT hook de Supabase.

---

## Supabase Storage — Buckets

| Bucket | Uso | Ruta de archivo |
|---|---|---|
| `facturas` | Fotos de facturas de cargas de combustible | `facturas/{timestamp}_{random}.{ext}` |
| `project-files` | Documentos PDF y fotos de proyectos | `{project_id}/documentos/{ts}_{name}` y `{project_id}/fotos/{ts}_{name}` |

**Uploads siempre desde el browser** (Client Component con `createClient` de `@/lib/supabase/client`). Luego Server Action inserta el registro en DB.

**Delete — extraer path desde URL pública:**
```typescript
const marker = '/storage/v1/object/public/project-files/'
const storagePath = fileUrl.slice(fileUrl.indexOf(marker) + marker.length)
await supabase.storage.from('project-files').remove([storagePath])
```

---

## Supabase Edge Functions

### `send-notifications`

Maneja 4 tipos de eventos. Se invoca desde triggers PostgreSQL:

| Tipo | Trigger de origen | Descripción |
|---|---|---|
| `fuel_movement` | `on_fuel_movement_insert` en `tank_movements` | Email al registrar una carga/descarga de estanque |
| `hourly_report` | `on_hourly_report_insert` en `hourly_reports` | Email al registrar un horómetro |
| `direct_fuel` | `on_direct_fuel_insert` en `direct_fuel_entries` | Email al registrar una carga directa a equipo |
| `daily_summary` | Cron job a las 23:00 UTC (20:00 hora Chile) | Resumen diario de operaciones |

---

## Triggers PostgreSQL

```
on_fuel_movement_insert  → AFTER INSERT ON tank_movements       → llama Edge Function send-notifications
on_hourly_report_insert  → AFTER INSERT ON hourly_reports       → llama Edge Function send-notifications
on_direct_fuel_insert    → AFTER INSERT ON direct_fuel_entries  → llama Edge Function send-notifications
cron daily-summary       → 23:00 UTC diario                     → llama Edge Function send-notifications con type=daily_summary
```

Las notificaciones las maneja Supabase server-side. La app web **no dispara notificaciones** directamente — los API routes en `app/api/notifications/` existen como respaldo manual pero no se llaman en el flujo normal.

---

## Sistema de roles

| Funcionalidad | superadmin | admin | operador |
|---|---|---|---|
| Gestión de usuarios | ✅ | ❌ | ❌ |
| Dashboard completo (KPIs + flota) | ✅ | ✅ | ❌ |
| Dashboard operador (horómetros + combustible) | ✅ | ✅ | ✅ |
| Maquinaria — registro y edición | ✅ | ✅ | ❌ |
| Horómetros — ver historial y admin | ✅ | ✅ | ❌ |
| Horómetros — registrar nuevo | ✅ | ✅ | ✅ |
| Combustible — vista admin completa | ✅ | ✅ | ❌ |
| Combustible — cargar/descargar | ✅ | ✅ | ✅ |
| Mantenciones | ✅ | ✅ | ❌ |
| Clientes y Proyectos | ✅ | ✅ | ❌ |
| Archivos en proyectos | ✅ | ✅ | ❌ |
| Calendario operativo | ✅ | ✅ | ❌ |
| Configuración notificaciones | ✅ | ✅ | ❌ |

**Detección de isAdmin en Server Components:**
```typescript
const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
```

**Sidebar:**
- `superadmin` → `superadminNavItems` (todos los links admin + /usuarios)
- `admin` → `adminNavItems`
- `operador` → sin sidebar; usa `OperadorHeader` con "← Volver"

---

## Patrones de código establecidos

### 1. Split Server / Client Component

```
page.tsx (Server) — fetch data, getUserProfile → isAdmin
  └── XxxClient.tsx (Client) — estado, modales, interactividad
        └── XxxModal.tsx (Client) — formulario con react-hook-form
              └── serverAction() — lib/xxx.ts con 'use server'
```

### 2. Server Actions

Todos los `lib/*.ts` de mutaciones tienen `'use server'` a nivel de archivo. Todas las funciones **deben ser `async`**. Funciones puras van en archivos SIN `'use server'` (ej: `lib/urgency.ts`, `lib/notifications/templates.ts`).

**CRÍTICO — 'use server' inline prohibido en archivos importados por Client Components:**
```typescript
// ❌ NUNCA — causa build error si el archivo es importado por un Client Component
export async function logout() {
  'use server'  // inline → error
  ...
}

// ✅ Correcto — 'use server' al inicio del archivo
// app/actions/auth.ts
'use server'
export async function logout() { ... }
```

### 3. Clientes Supabase — cuándo usar cuál

| Contexto | Import | Instancia |
|---|---|---|
| Server Components / Server Actions | `@/lib/supabase/server` | `await createClient()` |
| Client Components (uploads, browser auth) | `@/lib/supabase/client` | `createClient()` sin await |
| Operaciones admin (bypassear RLS) | `@/lib/supabase/admin` | `createAdminClient()` |
| proxy.ts | `@supabase/ssr` directamente | `createServerClient(...)` |

**Regla de oro:** Para leer/editar perfiles de otros usuarios, siempre usar `createAdminClient()`. El cliente normal solo puede operar sobre el perfil del usuario autenticado.

### 4. Perfil del usuario en Server Components

```typescript
import { getUserProfile } from '@/lib/auth'
const profile = await getUserProfile()
const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
```

### 5. Formularios con react-hook-form

- Dialog: `import { Dialog } from '@base-ui/react/dialog'`
- `Dialog.Close` NO soporta `asChild` — usar `<button onClick={() => onOpenChange(false)}>`
- Importación: `@base-ui/react/dialog` (NO `@base-ui-components/react/dialog`)

### 6. Campos numéricos en zod v4

`z.preprocess` rompe tipos en producción. Patrón correcto:

```typescript
// ✅
amount: z.any().transform((v): number | null => {
  if (v === '' || v === undefined || v === null) return null
  return Number(v)
}).pipe(z.number().positive().nullable()).optional()

// ❌ Rompe el build en Vercel
amount: z.preprocess((v) => v === '' ? null : Number(v), z.number().nullable())
```

### 7. Revalidación + router.refresh()

```typescript
// En server actions:
revalidatePath('/ruta')

// En client components, después de mutaciones:
router.refresh()  // re-ejecuta el Server Component y actualiza los datos
```

### 8. searchParams en page.tsx (Next.js 16)

```typescript
type SearchParams = Promise<{ mes?: string; anio?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams  // DEBE awaitarse — es una Promise en Next.js 16
}
```

### 9. Type cast en joins de Supabase

```typescript
// ✅
return (data ?? []) as unknown as TankMovement[]

// ❌ Error TypeScript en builds estrictos
return (data ?? []) as TankMovement[]
```

### 10. Formato de números y fechas

```typescript
n.toLocaleString('es-CL')
n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// date string 'YYYY-MM-DD' desde DB
function formatFecha(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// timestamptz desde DB
function formatFechaTs(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}
```

### 11. Nombres de columnas críticos (historial de errores)

- `direct_fuel_entries` usa `entry_date` (NO `movement_date`)
- `project_machines` usa `start_date` (NO `assigned_date`)
- `project_costs` usa `cost_date` (NO `date`)
- `projects.type` valores DB: `destronque`, `preparacion_suelo`, `tranque`, `obra_civil`, `mixto`
- `profiles.role` valores: `superadmin`, `admin`, `operador`

---

## Deuda técnica conocida

1. **`getUserProfile()` duplica `getUser()`** — son alias, se puede unificar.
2. **`getFleetUrgency()` duplica `getUrgency()`** — lógica de semáforo existe en dos lugares con distintos shapes.
3. **Stock de combustible no transaccional** — `createMovement()` hace insert + read + update sin transacción. Race condition posible con cargas simultáneas. Mitigar con RPC en Supabase.
4. **`checkOverdueMaintenances()` en cada page load** — ejecuta en cada visita a `/mantenciones`. Mover a cron.
5. **Sin paginación** — horómetros, movimientos y mantenciones traen todos los registros.
6. **shadcn parcialmente inicializado** — solo `components/ui/button.tsx`. Los demás usan HTML nativo con Tailwind.

---

## Pendientes y próximos pasos

| Feature | Notas | Prioridad |
|---|---|---|
| Vista web cargas directas a equipo (admin) | Tabla `direct_fuel_entries` existe, falta vista en panel admin | Alta |
| Vistas analíticas por módulo | En diseño | Media |
| Notificación mantención próxima | Templates listos, falta trigger | Media |
| WhatsApp Twilio | Paralelo a email | Media |
| Reportes exportables PDF/Excel | react-pdf o xlsx | Media |
| Dominio propio | Vercel Domains / Cloudflare | Baja |
| Nuevo APK Android | Con cambios recientes de flujo operador | Alta |
