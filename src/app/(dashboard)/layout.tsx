import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import {
  getUserCompanies,
  getActiveCompanyId,
  getLegalEntities,
  getActiveLegalEntityId,
} from "@/actions/company"
import { Sidebar } from "@/components/layout/Sidebar"
import { CompanySwitcher } from "@/features/companies/components/CompanySwitcher"
import { WorkspaceInitializer } from "@/components/shared/WorkspaceInitializer"
import { LegalEntitySwitcher } from "@/features/companies/components/LegalEntitySwitcher"

/**
 * Layout principal del dashboard.
 *
 * Flujo de acceso (según diagrama mental 2):
 * 1. ¿Autenticado? → si no, redirige a /login
 * 2. ¿Tiene empresas? → si no, redirige a /onboarding
 * 3. ¿Empresa activa en cookie? → si no, usa la primera (cookie se setea en el cliente)
 * 4. ¿Tiene CUITs activos?
 *    - 0 CUITs → entra sin CUIT (todavía no cargó datos fiscales)
 *    - 1 CUIT → usa esa (cookie se setea en el cliente)
 *    - 2+ CUITs y no hay cookie → redirige a /select-cuit
 * 5. Renderiza dashboard con empresa + CUIT activo en header
 *
 * IMPORTANTE: No se pueden setear cookies durante el render de un Server Component.
 * Las cookies se sincronizan en el cliente via WorkspaceInitializer.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Cargar empresas del usuario
  const companies = await getUserCompanies()
  const cookieCompanyId = await getActiveCompanyId()

  if (companies.length === 0) {
    // Sin empresas → forzar onboarding
    redirect('/onboarding')
  }

  // 3. Resolver empresa activa (sin setear cookie — eso lo hace el cliente)
  const activeCompanyId = cookieCompanyId || companies[0].id

  // 4. Verificar CUITs activos para la empresa seleccionada
  const legalEntities = await getLegalEntities()
  const cookieLegalEntityId = await getActiveLegalEntityId()

  let activeLegalEntityId: string | null = cookieLegalEntityId

  if (legalEntities.length === 1 && !activeLegalEntityId) {
    // Solo 1 CUIT → usar esa (cookie se setea en el cliente)
    activeLegalEntityId = legalEntities[0].id
  } else if (legalEntities.length > 1 && !activeLegalEntityId) {
    // 2+ CUITs sin selección → redirigir a selector
    redirect('/select-cuit')
  }

  // Buscar la entidad legal activa para mostrar en el header
  const activeLegalEntity = legalEntities.find(
    (le: any) => le.id === activeLegalEntityId
  ) || null

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Inicializador: sincroniza empresa y CUIT activos a cookies del cliente */}
      <WorkspaceInitializer
        activeCompanyId={activeCompanyId}
        activeLegalEntityId={activeLegalEntityId}
      />
      <LegalEntitySwitcher />

      {/* Sidebar con navegación principal */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Header: muestra empresa activa + CUIT activo */}
        <header className="flex items-center justify-between h-20 px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
              Gestión <span className="text-emerald-500">Operativa</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                {activeLegalEntity?.razon_social || "Sin Entidad Fiscal"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <CompanySwitcher
              companies={companies}
              activeCompanyId={activeCompanyId}
              legalEntities={legalEntities}
              activeLegalEntity={activeLegalEntity}
            />
          </div>
        </header>

        {/* Dynamic Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
