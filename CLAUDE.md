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
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^3.5.0 |

**Importante:** Este es Next.js 16, NO Next.js 14. Las APIs pueden diferir del conocimiento de entrenamiento. Revisar `node_modules/next/dist/docs/` ante dudas.

---

## Deploy

- **Plataforma:** Vercel + GitHub
- **CI/CD:** Push a `main` → deploy automático en Vercel
- **Variables de entorno en Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Variables locales:** `.env.local` (mismo par de variables)

---

## Estructura de carpetas real

```
maquinaria-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx                          ← root layout con fuentes Geist
│   ├── page.tsx                            ← redirect('/dashboard')
│   ├── (auth)/
│   │   ├── layout.tsx                      ← centra contenido en pantalla
│   │   └── login/
│   │       └── page.tsx                    ← formulario email+password, 'use client'
│   └── (dashboard)/
│       ├── layout.tsx                      ← verifica sesión, sidebar + header
│       ├── dashboard/
│       │   ├── page.tsx                    ← bifurca admin vs operador, getDashboardData / getMisHorometros + getCumplimiento + getMyFuelActivity
│       │   └── components/
│       │       └── PanelCombustible.tsx    ← resumen mensual de combustible para operador
│       ├── maquinaria/
│       │   ├── page.tsx
│       │   ├── components/
│       │   │   ├── MachineTable.tsx
│       │   │   └── MachineModal.tsx
│       │   └── horometros/
│       │       ├── page.tsx
│       │       └── components/
│       │           ├── HorometroTable.tsx
│       │           ├── HorometroForm.tsx   ← usa browser Supabase client (operadores reportan desde browser)
│       │           └── CumplimientoCalendario.tsx  ← heatmap 30 días, 'use client'
│       ├── combustible/
│       │   ├── page.tsx                    ← acepta searchParams: mes, anio; bifurca admin/operador
│       │   └── components/
│       │       ├── CombustibleClient.tsx   ← admin: estanques + movimientos + factura; operador: solo mis movimientos
│       │       ├── TankModal.tsx
│       │       ├── MovementModal.tsx       ← carga: estanque+fecha+litros+foto factura; descarga: estanque+máquina+fecha+litros
│       │       └── ImageLightbox.tsx       ← lightbox para facturas (click fuera o Escape cierra)
│       ├── mantenciones/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── MantencionesClient.tsx
│       │       ├── MaintenanceModal.tsx
│       │       └── CompleteModal.tsx
│       ├── clientes/
│       │   ├── page.tsx
│       │   ├── components/
│       │   │   ├── ClientesClient.tsx
│       │   │   └── ClientModal.tsx
│       │   └── [id]/
│       │       ├── page.tsx                ← detalle cliente + proyectos asociados
│       │       └── ClientDetailClient.tsx
│       ├── proyectos/
│       │   ├── page.tsx
│       │   ├── components/
│       │   │   ├── ProyectosClient.tsx     ← tabla con tabs Activos/Cotizaciones/etc.
│       │   │   └── ProjectModal.tsx
│       │   └── [id]/
│       │       ├── page.tsx                ← fetch project + machineOptions + clients + profile + documents
│       │       └── components/
│       │           ├── ProyectoDetailClient.tsx  ← tabs: Resumen / Hitos / Costos / Maquinaria / Archivos (admin)
│       │           ├── TabHitos.tsx
│       │           ├── TabCostos.tsx
│       │           ├── TabMaquinaria.tsx
│       │           ├── ArchivosTab.tsx     ← upload documentos (PDF) y fotos; elimina de Storage + DB
│       │           └── PhotoLightbox.tsx   ← lightbox con prev/next, nombre y fecha
│       └── calendario/
│           ├── page.tsx
│           └── components/
│               └── CalendarioClient.tsx    ← Gantt mensual, navegación sin page reload vía startTransition
├── components/
│   ├── sidebar.tsx                         ← 'use client', recibe prop role
│   └── ui/
│       └── button.tsx                      ← @base-ui/react Button con CVA
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       ← createBrowserClient (browser / uploads)
│   │   └── server.ts                       ← createServerClient con cookies (Server Components / Actions)
│   ├── auth.ts                             ← getUser(), getUserProfile(), logout()
│   ├── machines.ts                         ← 'use server', CRUD máquinas
│   ├── horometros.ts                       ← 'use server', reportes + getCumplimiento + getMisHorometros
│   ├── combustible.ts                      ← 'use server', estanques + movimientos + getMyFuelActivity
│   ├── mantenciones.ts                     ← 'use server', mantenciones + checkOverdueMaintenances
│   ├── proyectos.ts                        ← 'use server', CRUD proyectos + hitos + costos + maquinaria asignada
│   ├── clientes.ts                         ← 'use server', CRUD clientes (createClientRecord/updateClientRecord)
│   ├── calendario.ts                       ← 'use server', getCalendarioData(month, year)
│   ├── documentos.ts                       ← 'use server', getDocuments + createDocumentRecord + deleteDocument
│   ├── dashboard.ts                        ← getDashboardData() con Promise.all x7
│   ├── urgency.ts                          ← utilitario puro SIN 'use server' — getUrgency(m)
│   └── utils.ts                            ← cn() = clsx + tailwind-merge
├── middleware.ts                           ← refresco sesión, guard de rutas
└── .env.local                              ← NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Módulos completados

| Módulo | Ruta | Estado |
|---|---|---|
| Autenticación | `/login` | ✅ Completo |
| Dashboard — admin | `/dashboard` (role=admin) | ✅ Completo |
| Dashboard — operador | `/dashboard` (role=operador) | ✅ Completo |
| Maquinaria — registro | `/maquinaria` | ✅ Completo |
| Horómetros | `/maquinaria/horometros` | ✅ Completo |
| Combustible — admin | `/combustible` (role=admin) | ✅ Completo |
| Combustible — operador | `/combustible` (role=operador) | ✅ Completo |
| Mantenciones | `/mantenciones` | ✅ Completo |
| Clientes | `/clientes`, `/clientes/[id]` | ✅ Completo |
| Proyectos — lista | `/proyectos` | ✅ Completo |
| Proyectos — detalle | `/proyectos/[id]` (Resumen, Hitos, Costos, Maquinaria, Archivos) | ✅ Completo |
| Calendario operativo | `/calendario` | ✅ Completo |

---

## Base de datos Supabase

### Tablas y campos principales

```
profiles
  id uuid (= auth.uid())
  full_name text
  role text  → 'admin' | 'operador'

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
  invoice_image_url text?    ← URL pública en bucket 'facturas' (solo cargas con foto)
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
  cost_date date          ← campo es cost_date, NO date
  notes text?
  created_at timestamptz

project_machines
  id uuid
  project_id uuid → projects.id
  machine_id uuid → machines.id
  start_date date         ← campo es start_date, NO assigned_date
  end_date date?
  notes text?
  created_at timestamptz

project_documents
  id uuid
  project_id uuid → projects.id
  name text
  file_url text           ← URL pública en bucket 'project-files'
  file_type text          ← MIME type (application/pdf, image/jpeg, etc.)
  category text  → 'documento' | 'foto'
  size_bytes bigint?
  uploaded_by uuid → profiles.id
  created_at timestamptz
```

### SQL para crear project_documents

```sql
CREATE TABLE project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  category text NOT NULL CHECK (category IN ('documento', 'foto')),
  size_bytes bigint,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users" ON project_documents FOR ALL USING (auth.uid() IS NOT NULL);
```

### SQL para agregar invoice_image_url a tank_movements

```sql
ALTER TABLE tank_movements ADD COLUMN IF NOT EXISTS invoice_image_url text;
```

### RLS

Todas las tablas tienen RLS activado. Las policies usan `auth.uid() is not null` para acceso general. La tabla `profiles` tuvo un problema histórico con policies recursivas — usar `auth.jwt()` para leer roles, **no** hacer SELECT a profiles dentro de una policy de profiles.

**Problema histórico con JWT:** PostgREST interpreta el claim `role` del JWT como DB role. Solución: renombrar el claim a `app_role` en el custom JWT hook de Supabase.

---

## Supabase Storage — Buckets

| Bucket | Uso | Acceso |
|---|---|---|
| `facturas` | Fotos de facturas de carga de combustible. Ruta: `facturas/{timestamp}_{random}.{ext}` | Público |
| `project-files` | Documentos (PDF) y fotos de proyectos. Rutas: `{project_id}/documentos/{timestamp}_{filename}` y `{project_id}/fotos/{timestamp}_{filename}` | Público |

**Upload siempre desde el browser** (Client Component con `createClient` de `@/lib/supabase/client`). Luego se llama a un Server Action para insertar el registro en la DB.

**Delete:** El Server Action `deleteDocument` extrae el path desde la URL pública:
```typescript
const marker = '/storage/v1/object/public/project-files/'
const storagePath = fileUrl.slice(fileUrl.indexOf(marker) + marker.length)
await supabase.storage.from('project-files').remove([storagePath])
```

---

## Sistema de roles

| Funcionalidad | admin | operador |
|---|---|---|
| Ver Dashboard | ✅ (KPIs + flota + movimientos) | ✅ (cumplimiento + combustible propio) |
| Ver Maquinaria | ✅ | ❌ |
| Crear/editar máquinas | ✅ | ❌ |
| Ver y registrar Horómetros | ✅ | ✅ |
| Ver Combustible completo | ✅ | ❌ |
| Registrar movimientos combustible | ✅ | ✅ (solo sus propios) |
| Crear/editar estanques | ✅ | ❌ |
| Ver Mantenciones | ✅ | ❌ |
| Crear/completar mantenciones | ✅ | ❌ |
| Ver Clientes | ✅ | ❌ |
| Crear/editar clientes | ✅ | ❌ |
| Ver Proyectos | ✅ | ❌ |
| Crear/editar proyectos | ✅ | ❌ |
| Tab Archivos en proyectos | ✅ | ❌ |
| Ver Calendario | ✅ | ❌ |

**Implementación:**
- El rol se obtiene desde `profiles.role` vía `getUserProfile()` en cada Server Component que lo necesita.
- Se pasa como prop `isAdmin: boolean` a los Client Components.
- El `Sidebar` recibe `role` como prop desde el layout del dashboard.
- Dos arrays de `navItems` separados: `adminNavItems` (8 items) y `operadorNavItems` (3 items).

---

## Patrones de código

### 1. Server Component + Client Component split

```
page.tsx (Server) — fetch data, getUserProfile → isAdmin
  └── XxxClient.tsx (Client) — estado, modales, interactividad
        └── XxxModal.tsx (Client) — formulario con react-hook-form
              └── serverAction() — lib/xxx.ts con 'use server'
```

### 2. Server Actions en lib/

Todos los archivos `lib/*.ts` que hacen mutaciones usan `'use server'` al inicio del archivo. Todas las funciones del archivo **deben ser `async`**. Las funciones puras deben estar en archivos separados SIN `'use server'`.

```typescript
// ✅ Correcto
'use server'
export async function createMachine(input: MachineInput) { ... }

// ❌ Error: función no-async en archivo 'use server'
'use server'
export function getUrgency(m: Maintenance) { ... }  // BUILD ERROR
```

### 3. Cliente Supabase

- **Server Components / Server Actions:** `import { createClient } from '@/lib/supabase/server'` → `await createClient()`
- **Client Components (uploads, auth desde browser):** `import { createClient } from '@/lib/supabase/client'` → `createClient()` (sin await)
- **Middleware:** instancia directa con `createServerClient` de `@supabase/ssr`

### 4. Obtener perfil del usuario

```typescript
// En Server Components:
import { getUserProfile } from '@/lib/auth'
const profile = await getUserProfile()
const isAdmin = profile?.role === 'admin'
```

### 5. Formularios (modales)

- `react-hook-form` + `zod` + `@hookform/resolvers/zod`
- Dialog: `import { Dialog } from '@base-ui/react/dialog'`
  - Usar: `Dialog.Root`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`, `Dialog.Close`, `Dialog.Title`
- **CRÍTICO:** `Dialog.Close` de `@base-ui` NO soporta `asChild`. El botón Cancelar debe ser `<button onClick={() => onOpenChange(false)}>`, nunca `<Dialog.Close asChild>`.
- Importación correcta: `@base-ui/react/dialog` (NO `@base-ui-components/react/dialog`)

### 6. Campos numéricos en zod v4

`z.preprocess` da tipo `unknown` como INPUT en zod v4, rompiendo los tipos de `@hookform/resolvers`. Patrón correcto:

```typescript
// ✅ Correcto para campos numéricos opcionales
amount: z
  .any()
  .transform((v): number | null => {
    if (v === '' || v === undefined || v === null) return null
    return Number(v)
  })
  .pipe(z.number().positive().nullable())
  .optional()

// ❌ Rompe el build en producción (Vercel)
amount: z.preprocess((v) => v === '' ? null : Number(v), z.number().nullable())
```

### 7. Revalidación tras mutaciones

```typescript
import { revalidatePath } from 'next/cache'
revalidatePath('/maquinaria')  // invalida caché → Server Component re-fetches
```

En Client Components: llamar `router.refresh()` después de mutations con Server Actions que no revalidan automáticamente (uploads en storage seguidos de createDocumentRecord).

### 8. searchParams en page.tsx (Next.js 16)

```typescript
type SearchParams = Promise<{ mes?: string; anio?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams  // DEBE awaitarse
}
```

### 9. Supabase join type cast

Supabase infiere resultados de joins como `any[]`. Usar `as unknown as Type[]` en lugar de `as Type[]`:

```typescript
// ✅ Correcto
return (data ?? []) as unknown as TankMovement[]

// ❌ Error de TypeScript en builds estrictos
return (data ?? []) as TankMovement[]
```

### 10. Formato de números y fechas

```typescript
// Pesos chilenos
n.toLocaleString('es-CL')

// Con decimales
n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Fechas (DB guarda date como string 'YYYY-MM-DD')
function formatFecha(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// Fechas con timestamp (created_at es timestamptz)
function formatFechaTs(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}
```

### 11. Uploads a Supabase Storage (desde Client Component)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { error } = await supabase.storage
  .from('facturas')
  .upload(fileName, file, { upsert: true })
const { data } = supabase.storage
  .from('facturas')
  .getPublicUrl(fileName)
// data.publicUrl → guardar en DB via Server Action
```

### 12. Nombres de columnas críticos (errores históricos)

- `project_machines` usa `start_date` (NO `assigned_date`)
- `project_costs` usa `cost_date` (NO `date`)
- Enum `projects.type`: valores DB son `destronque`, `preparacion_suelo`, `tranque`, `obra_civil`, `mixto`

---

## Deuda técnica y problemas conocidos

1. **`lib/auth.ts` — `getUser()` duplicado:** `getUserProfile()` es un alias de `getUser()`. Se puede simplificar.

2. **`getUrgency` duplicada:** Lógica de semáforo existe en `lib/urgency.ts` y también inline en `dashboard/page.tsx` como `getFleetUrgency()` (el shape de `FleetMachine` difiere de `Maintenance`).

3. **Stock de combustible no es transaccional:** `createMovement()` hace insert + read + update en secuencia. Sin transacción, dos cargas simultáneas pueden causar race condition en `current_liters`. Mitigar con RPC en Supabase.

4. **`checkOverdueMaintenances()` en cada page load:** Se ejecuta en cada visita a `/mantenciones`. En producción considerar moverlo a un cron job.

5. **Sin paginación:** Las tablas de horómetros, movimientos y mantenciones traen todos los registros.

6. **Módulo Horómetros no verifica rol** en el Server Component — cualquier usuario autenticado puede acceder a `/maquinaria/horometros`.

7. **shadcn UI parcialmente inicializado:** Solo existe `components/ui/button.tsx`. Los demás componentes (Input, Select, Badge) no están instalados — se usan elementos HTML nativos con clases Tailwind directas.

---

## Pendientes y próximos pasos

| Feature | Tecnología sugerida | Prioridad |
|---|---|---|
| Notificaciones por email (mantenciones vencidas, hitos) | Resend | Alta |
| App mobile para operadores | Expo (React Native) | Alta |
| Reportes exportables (PDF / Excel) | react-pdf o xlsx | Media |
| Notificaciones WhatsApp | Twilio | Media |
| Dominio propio | Vercel Domains / Cloudflare | Baja |
