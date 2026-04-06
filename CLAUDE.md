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

**Importante:** Este es Next.js 16, NO Next.js 14. Las APIs pueden diferir del conocimiento de entrenamiento. Revisar `node_modules/next/dist/docs/` ante dudas.

---

## Estructura de carpetas real

```
maquinaria-app/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              ← centra contenido en pantalla
│   │   └── login/
│   │       └── page.tsx            ← formulario email+password, 'use client'
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← verifica sesión, sidebar + header
│   │   ├── dashboard/
│   │   │   └── page.tsx            ← KPIs, flota, últimos movimientos
│   │   ├── maquinaria/
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── MachineTable.tsx
│   │   │   │   └── MachineModal.tsx
│   │   │   └── horometros/
│   │   │       ├── page.tsx
│   │   │       └── components/
│   │   │           ├── HorometroTable.tsx
│   │   │           └── HorometroForm.tsx
│   │   ├── combustible/
│   │   │   ├── page.tsx            ← acepta searchParams: mes, anio
│   │   │   └── components/
│   │   │       ├── CombustibleClient.tsx
│   │   │       ├── TankModal.tsx
│   │   │       └── MovementModal.tsx
│   │   ├── mantenciones/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── MantencionesClient.tsx
│   │   │       ├── MaintenanceModal.tsx
│   │   │       └── CompleteModal.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ClientesClient.tsx
│   │   │   │   └── ClientModal.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx                    ← detalle cliente + proyectos
│   │   │       └── ClientDetailClient.tsx      ← botón editar
│   │   └── proyectos/
│   │       ├── page.tsx
│   │       ├── components/
│   │       │   ├── ProyectosClient.tsx         ← tabla con tabs Activos/Cotizaciones/etc.
│   │       │   └── ProjectModal.tsx
│   │       └── [id]/
│   │           ├── page.tsx                    ← detalle proyecto
│   │           └── components/
│   │               ├── ProyectoDetailClient.tsx ← tabs Resumen/Hitos/Costos/Maquinaria
│   │               ├── TabHitos.tsx
│   │               ├── TabCostos.tsx
│   │               └── TabMaquinaria.tsx
│   ├── globals.css
│   ├── layout.tsx                  ← root layout con fuentes Geist
│   └── page.tsx                    ← redirect('/dashboard')
├── components/
│   ├── sidebar.tsx                 ← 'use client', recibe prop role
│   └── ui/
│       └── button.tsx              ← @base-ui/react Button con CVA
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← createBrowserClient (browser)
│   │   └── server.ts               ← createServerClient con cookies
│   ├── auth.ts                     ← getUser(), getUserProfile(), logout()
│   ├── machines.ts                 ← 'use server', CRUD máquinas
│   ├── horometros.ts               ← 'use server', reportes + máquinas activas
│   ├── combustible.ts              ← 'use server', estanques + movimientos
│   ├── mantenciones.ts             ← 'use server', mantenciones + check vencidas
│   ├── urgency.ts                  ← utilitario puro (sin 'use server')
│   ├── dashboard.ts                ← getDashboardData() con Promise.all x7
│   ├── clientes.ts                 ← 'use server', CRUD clientes (createClientRecord/updateClientRecord para no colisionar con createClient de Supabase)
│   ├── proyectos.ts                ← 'use server', CRUD proyectos + hitos + costos + asignación de maquinaria
│   └── utils.ts                    ← cn() = clsx + tailwind-merge
├── middleware.ts                   ← refresco sesión, guard de rutas
└── .env.local                      ← NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Módulos completados

| Módulo | Ruta | Estado |
|---|---|---|
| Autenticación | `/login` | ✅ Completo |
| Dashboard | `/dashboard` | ✅ Completo |
| Maquinaria — registro | `/maquinaria` | ✅ Completo |
| Horómetros | `/maquinaria/horometros` | ✅ Completo |
| Combustible | `/combustible` | ✅ Completo |
| Mantenciones | `/mantenciones` | ✅ Completo |
| Clientes | `/clientes`, `/clientes/[id]` | ✅ Completo |
| Proyectos | `/proyectos`, `/proyectos/[id]` | ✅ Completo |
| Calendario operativo | — | ⏳ Pendiente |

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
  price_per_liter numeric?  (solo cargas)
  supplier text?             (solo cargas)
  invoice_number text?       (solo cargas)
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
  type text
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
  date date
  notes text?
  created_at timestamptz

project_machines
  id uuid
  project_id uuid → projects.id
  machine_id uuid → machines.id
  assigned_date date
  end_date date?
  notes text?
  created_at timestamptz
```

### RLS
Todas las tablas tienen RLS activado. Las policies usan `auth.uid() is not null` para acceso general. La tabla `profiles` tuvo un problema histórico con policies recursivas — usar `auth.jwt()` para leer roles, no hacer SELECT a profiles dentro de una policy de profiles.

---

## Sistema de roles

| Funcionalidad | admin | operador |
|---|---|---|
| Ver Dashboard | ✅ | ✅ |
| Ver Maquinaria (solo lectura) | ✅ | ❌ (no aparece en sidebar) |
| Crear/editar máquinas | ✅ | ❌ |
| Ver y registrar Horómetros | ✅ | ✅ |
| Ver Combustible | ✅ | ❌ |
| Registrar movimientos combustible | ✅ | ❌ |
| Crear/editar estanques | ✅ | ❌ |
| Ver Mantenciones | ✅ | ❌ |
| Crear/completar mantenciones | ✅ | ❌ |
| Ver Proyectos y Clientes | ✅ | ❌ |
| Crear/editar proyectos y clientes | ✅ | ❌ |

**Implementación:** El rol se obtiene desde `profiles.role` vía `getUserProfile()` en cada Server Component que lo necesita. Se pasa como prop `isAdmin: boolean` a los Client Components. El `Sidebar` recibe `role` como prop desde el layout del dashboard.

---

## Patrones de código

### 1. Server Component + Client Component split

```
page.tsx (Server) — fetch data
  └── XxxClient.tsx (Client) — estado, modales, interactividad
        └── XxxModal.tsx (Client) — formulario con react-hook-form
              └── serverAction() — lib/xxx.ts con 'use server'
```

### 2. Server Actions en lib/

Todos los archivos `lib/*.ts` que hacen mutaciones usan `'use server'` al inicio del archivo. Todas las funciones del archivo deben ser `async`. Las funciones puras (como `getUrgency()`) deben estar en archivos separados SIN `'use server'` — ver `lib/urgency.ts`.

```typescript
// ✅ Correcto
'use server'
export async function createMachine(input: MachineInput) { ... }

// ❌ Error: función no-async en archivo 'use server'
'use server'
export function getUrgency(m: Maintenance) { ... }  // BUILD ERROR
```

### 3. Cliente Supabase

- **Server Components / Server Actions:** `import { createClient } from '@/lib/supabase/server'` — usa cookies, `await createClient()`
- **Client Components (mutaciones desde browser):** `import { createClient } from '@/lib/supabase/client'` — solo en casos necesarios como `HorometroForm`
- **Middleware:** instancia directa con `createServerClient` de `@supabase/ssr`

### 4. Obtener perfil del usuario

```typescript
// En Server Components:
import { getUserProfile } from '@/lib/auth'
const profile = await getUserProfile()
const isAdmin = profile?.role === 'admin'

// getUserProfile() hace:
// 1. supabase.auth.getUser() → valida JWT en servidor de Supabase
// 2. .from('profiles').select('full_name, role') → trae rol real
```

### 5. Formularios (modales)

- `react-hook-form` + `zod` + `@hookform/resolvers/zod`
- Dialog: `@base-ui/react/dialog` — Dialog.Root, Dialog.Portal, Dialog.Backdrop, Dialog.Popup, Dialog.Close
- **IMPORTANTE:** `Dialog.Close` de `@base-ui` NO soporta `asChild`. El botón Cancelar debe ser `<button onClick={() => onOpenChange(false)}>`, nunca `<Dialog.Close asChild><Button>`.
- Campos numéricos opcionales usan `z.preprocess` para convertir `""` → `null`

### 6. Revalidación tras mutaciones

```typescript
import { revalidatePath } from 'next/cache'
revalidatePath('/maquinaria')  // invalida caché → Server Component re-fetches
```

### 7. Campos numéricos nullables

```typescript
// Siempre ?? 0 o ?? null antes de operaciones
(tank.current_liters ?? 0).toLocaleString('es-CL')
Math.max(0, (tank.current_liters ?? 0) - input.liters)
```

### 8. Formato de números

```typescript
// Pesos chilenos
n.toLocaleString('es-CL')

// Con decimales
n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
```

### 9. Fechas (strings, no Date objects)

La DB guarda fechas como `date` (string `YYYY-MM-DD`). Para mostrar:
```typescript
function formatFecha(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`  // → DD/MM/YYYY
}
```

### 10. searchParams en page.tsx (Next.js 16)

```typescript
type SearchParams = Promise<{ mes?: string; anio?: string }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams  // debe awaitearse
  ...
}
```

---

## Deuda técnica y problemas conocidos

1. **`lib/auth.ts` — `getUser()` duplicado:** `getUserProfile()` es un alias de `getUser()`, ambas hacen lo mismo. Se puede simplificar a una sola función en el futuro.

2. **`getUrgency` duplicada:** La lógica de semáforo existe en `lib/urgency.ts` (para el módulo Mantenciones) y también inline en `dashboard/page.tsx` como `getFleetUrgency()` porque el shape del tipo `FleetMachine` difiere de `Maintenance`. Considerar unificar el tipo o la función.

3. **Stock de combustible no es transaccional:** `createMovement()` hace insert + read + update en secuencia. Sin transacción, dos cargas simultáneas podrían causar race condition en `current_liters`. Mitigar con una RPC en Supabase que haga el cálculo atómico.

4. **`checkOverdueMaintenances()` en cada page load:** Se ejecuta en cada visita a `/mantenciones`. En producción con muchas mantenciones, considerar moverlo a un cron job o Supabase Edge Function.

5. **Sin paginación:** Las tablas de horómetros, movimientos y mantenciones traen todos los registros. Agregar paginación cuando el volumen crezca.

6. **El módulo Horómetros no verifica el rol** en el Server Component — cualquier usuario autenticado puede acceder a `/maquinaria/horometros` aunque no aparezca en el sidebar del operador.

7. **shadcn UI parcialmente inicializado:** Solo existe `components/ui/button.tsx`. Los demás componentes shadcn (Input, Select, Badge, etc.) no están instalados — se usan elementos HTML nativos con clases Tailwind directas.

---

## Módulos pendientes

### Calendario operativo
Vista de calendario que muestre: mantenciones programadas, asignaciones de máquinas a proyectos, alertas. Depende de los módulos de Proyectos y Mantenciones (ya completos).
