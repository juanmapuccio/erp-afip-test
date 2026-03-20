# Estructura del Proyecto: ERP NodoSur

Este documento detalla la organización de carpetas y archivos del sistema, siguiendo patrones modernos de **Next.js (App Router)** y **Feature-Sliced Design (FSD)** adaptado.

## 📂 Directorio Raíz `/`
- `package.json`: Dependencias y scripts del proyecto.
- `next.config.js`: Configuración de Next.js.
- `tailwind.config.ts`: Configuración de estilos y diseño.
- `.env.local`: Variables de entorno (Supabase URL/Key).
- `PROJECT_STRUCTURE.md`: Este documento.
- `schemas_temp/`: Carpeta con diagramas ERD, flujo de negocio y reportes de análisis.

## 📂 Directorio Fuente `/src`

### 1. `app/` (Enrutamiento y Layouts)
Utiliza el App Router de Next.js 15+.
- `(auth)/`: Rutas de autenticación (Register).
- `(dashboard)/`: Rutas protegidas que comparten el sidebar y layout principal.
  - `accounting/`: Libro Diario y Balance.
  - `clients/`, `suppliers/`: Gestión de contactos.
  - `expenses/`, `purchases/`: Gestión de egresos.
  - `pos/`: Punto de Venta interactivo.
  - `products//`, `categories/`: Inventario.
  - `sales/`: Historial de ventas.
  - `taxes/`: Pagos de impuestos.
- `auth/accept-invite/`: Onboarding de nuevos miembros.
- `login/`: Página de acceso.
- `select-company/`, `select-cuit/`: Switchers de contexto multi-empresa.

### 2. `features/` (Módulos por Dominio)
Contiene la lógica pesada de UI, organizada por entidad de negocio. Cada subcarpeta suele tener una carpeta `components/`.
- `accounting/`: Componentes del Libro Diario.
- `auth/`: Forms de login, registro e invitaciones.
- `companies/`: Switchers de empresa y CUIT.
- `expenses/`, `purchases/`, `sales/`: Tablas y formularios de transacciones.
- `products/`: Catálogo y gestión de stock.

### 3. `actions/` (Server Actions)
Encapsula la lógica de comunicación con Supabase desde el servidor.
- `accounting.ts`: Consultas de asientos y balances.
- `auth.ts`, `invitations.ts`: Gestión de usuarios.
- `company.ts`: Lógica de multi-tenancy y selección de contexto.
- `sales.ts`, `purchases.ts`: Procesamiento de transacciones comerciales.
- `products.ts`, `categories.ts`: CRUD de catálogo.

### 4. `components/` (Componentes Compartidos)
- `ui/`: Componentes base (Botones, Inputs, Cards).
- `layout/`: Sidebar, Navbar y wrappers estructurales.
- `shared/`: Componentes transversales (WorkspaceInitializer, etc.).

### 5. `lib/` (Singletons y Utilidades)
- `supabase.ts`: Cliente de Supabase para Client Components.
- `server.ts`: Cliente de Supabase para Server Components/Actions.
- `utils.ts`: Utilidades de clases (cn) y formateo.
- `proxy.ts`: Interceptor de peticiones para manejo de errores/logs.

### 6. `store/` (Estado Global)
Utiliza **Zustand** para persistencia en cliente.
- `use-workspace.ts`: Mantiene la empresa y el CUIT activo a través de la sesión.

### 7. `types/` (Tipado TypeScript)
- Interfaces y tipos globales compartidos entre frontend y backend.

---
## 💡 Resumen de Flujo de Datos
1.  **UI (app/features)**: Captura input del usuario.
2.  **Server Action (actions)**: Procesa la lógica, valida permisos (RLS) y muta la DB.
3.  **Supabase (PostgreSQL)**: Persiste datos y dispara Triggers contables automáticos.
4.  **Revalidación**: `revalidatePath` actualiza la UI instantáneamente con los nuevos datos.
