"use client"

import { useEffect } from "react"
import { useWorkspace } from "@/store/use-workspace"

/**
 * Componente invisible que sincroniza las cookies del servidor
 * con el estado Zustand del cliente al montar.
 *
 * Recibe los IDs resueltos por el layout del servidor y los persiste
 * en cookies + Zustand. Esto resuelve el problema de Next.js 16 donde
 * los Server Components no pueden setear cookies durante el render.
 */
export function WorkspaceInitializer({
  activeCompanyId,
  activeLegalEntityId,
}: {
  activeCompanyId?: string | null
  activeLegalEntityId?: string | null
}) {
  const { setActiveCompanyId, setActiveLegalEntityId, initializeFromCookie } = useWorkspace()

  useEffect(() => {
    // Primero intentar leer cookies existentes
    initializeFromCookie()

    // Luego sincronizar con los valores resueltos por el servidor
    if (activeCompanyId) {
      setActiveCompanyId(activeCompanyId)
    }
    if (activeLegalEntityId) {
      setActiveLegalEntityId(activeLegalEntityId)
    }
  }, [activeCompanyId, activeLegalEntityId, setActiveCompanyId, setActiveLegalEntityId, initializeFromCookie])

  return null // Solo ejecuta side-effects, no renderiza nada
}
