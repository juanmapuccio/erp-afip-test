import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import {
  getLegalEntities,
  getActiveCompanyId,
  setActiveLegalEntity,
} from "@/actions/company"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { formatCuit } from "@/lib/utils"

/**
 * Página de selección de CUIT (razón social).
 *
 * Se muestra cuando el usuario tiene 2+ CUITs activos
 * y no ha elegido uno en la sesión actual.
 * Si solo tiene 1 CUIT, el layout lo auto-selecciona sin pasar por acá.
 */
export default async function SelectCuitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) redirect('/onboarding')

  const legalEntities = await getLegalEntities()

  // Si solo 1 o 0 CUITs, no debería llegar acá → redirigir al dashboard
  if (legalEntities.length <= 1) {
    if (legalEntities.length === 1) {
      await setActiveLegalEntity(legalEntities[0].id)
    }
    redirect('/')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="max-w-md w-full shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="mx-auto bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-xl flex items-center justify-center font-black mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Elegir Razón Social</CardTitle>
          <CardDescription>¿Bajo qué CUIT querés facturar hoy?</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-3">
            {(legalEntities as any[]).map((entity) => (
              <form key={entity.id} action={async () => {
                "use server"
                await setActiveLegalEntity(entity.id)
                redirect('/')
              }}>
                <button
                  type="submit"
                  className="w-full p-4 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white hover:shadow-md transition-all group"
                >
                  <p className="font-semibold text-lg group-hover:text-black dark:group-hover:text-white transition">
                    {entity.razon_social}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    CUIT: {formatCuit(entity.cuit)}
                    {entity.is_default && (
                      <span className="ml-2 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        default
                      </span>
                    )}
                  </p>
                </button>
              </form>
            ))}
          </div>

          <p className="text-xs text-zinc-400 text-center mt-6">
            Podés cambiar en cualquier momento con <kbd className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+L</kbd>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
