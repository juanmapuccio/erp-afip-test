"use client"

import { useTransition } from "react"
import { Building2, ChevronsUpDown, FileText } from "lucide-react"
import { setActiveCompany, setActiveLegalEntity } from "@/actions/company"
import { useWorkspace } from "@/store/use-workspace"
import { useEffect } from "react"
import { formatCuit } from "@/lib/utils"

/**
 * Selector de empresa + CUIT activo en el header del dashboard.
 *
 * Diagrama 1: Cada venta registra user_id, company_id, legal_entity_id.
 * Este componente muestra ambos selectores para que siempre se sepa
 * con qué empresa y bajo qué CUIT se está operando.
 */
export function CompanySwitcher({
  companies,
  activeCompanyId,
  legalEntities,
  activeLegalEntity,
}: {
  companies: any[]
  activeCompanyId: string | null
  legalEntities: any[]
  activeLegalEntity: any | null
}) {
  const [estaPendiente, iniciarTransicion] = useTransition()
  const {
    setActiveCompanyId: setClientCompanyId,
    setActiveLegalEntityId: setClientLegalEntityId,
    activeCompanyId: idEstadoCliente,
  } = useWorkspace()

  // Sincronizar estado del servidor → cliente al montar
  useEffect(() => {
    if (activeCompanyId) {
      setClientCompanyId(activeCompanyId)
    }
    if (activeLegalEntity?.id) {
      setClientLegalEntityId(activeLegalEntity.id)
    }
  }, [activeCompanyId, activeLegalEntity, setClientCompanyId, setClientLegalEntityId])

  const empresaActiva = companies.find((c) => c.id === idEstadoCliente) || companies[0]

  /** Cambia la empresa activa (cookie + Zustand) */
  const alSeleccionarEmpresa = (companyId: string) => {
    iniciarTransicion(async () => {
      await setActiveCompany(companyId)
      setClientCompanyId(companyId)
    })
  }

  /** Cambia la entidad legal activa (cookie + Zustand) */
  const alSeleccionarEntidadLegal = (entityId: string) => {
    iniciarTransicion(async () => {
      await setActiveLegalEntity(entityId)
      setClientLegalEntityId(entityId)
    })
  }

  return (
    <div className="flex items-center gap-3 ml-4">
      {/* Selector de empresa */}
      <div className="relative">
        <select
          disabled={estaPendiente}
          className="appearance-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-10 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all cursor-pointer"
          value={empresaActiva?.id || ""}
          onChange={(e) => alSeleccionarEmpresa(e.target.value)}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      </div>

      {/* Selector de CUIT / razón social (solo visible si hay entidades legales) */}
      {legalEntities.length > 0 && (
        <>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <div className="relative">
            <select
              disabled={estaPendiente}
              className="appearance-none bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 rounded-lg pl-10 pr-10 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer text-cyan-800 dark:text-cyan-200"
              value={activeLegalEntity?.id || ""}
              onChange={(e) => alSeleccionarEntidadLegal(e.target.value)}
            >
              {legalEntities.map((entity: any) => (
                <option key={entity.id} value={entity.id}>
                  {entity.razon_social} — {formatCuit(entity.cuit)}
                </option>
              ))}
            </select>
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500 pointer-events-none" />
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500 pointer-events-none" />
          </div>
        </>
      )}
    </div>
  )
}
