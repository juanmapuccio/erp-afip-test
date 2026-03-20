"use client"

import React, { useEffect, useState, useCallback } from "react"
import { getLegalEntities, setActiveLegalEntity } from "@/actions/company"
import { useWorkspace } from "@/store/use-workspace"
import { formatCuit } from "@/lib/utils"

type LegalEntity = {
  id: string
  razon_social: string
  cuit: string
  is_default: boolean
}

/**
 * Atajo de teclado (Ctrl+L) para cambiar rápidamente
 * entre razones sociales / CUITs activos.
 *
 * Muestra un flash turquesa al cambiar y persiste
 * la selección en cookie + Zustand.
 *
 * Solo se renderiza si hay 2+ entidades legales activas.
 */
export function LegalEntitySwitcher() {
  const [entidades, setEntidades] = useState<LegalEntity[]>([])
  const [indiceActivo, setIndiceActivo] = useState(0)
  const [mostrarFlash, setMostrarFlash] = useState(false)
  const setClientLegalEntityId = useWorkspace((s) => s.setActiveLegalEntityId)

  useEffect(() => {
    const cargar = async () => {
      const data = await getLegalEntities()
      setEntidades(data as LegalEntity[])
      // Inicializar con la entidad default
      const defaultIdx = (data as LegalEntity[]).findIndex(e => e.is_default)
      if (defaultIdx >= 0) setIndiceActivo(defaultIdx)
    }
    cargar()
  }, [])

  const manejarTeclaPresionada = useCallback((e: KeyboardEvent) => {
    // Ctrl+L → cambiar CUIT activo
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      if (entidades.length < 2) return

      const siguienteIndice = (indiceActivo + 1) % entidades.length
      const siguienteEntidad = entidades[siguienteIndice]

      setIndiceActivo(siguienteIndice)

      // Persistir cambio en cookie y Zustand
      setActiveLegalEntity(siguienteEntidad.id)
      setClientLegalEntityId(siguienteEntidad.id)

      // Mostrar flash visual turquesa
      setMostrarFlash(true)
      setTimeout(() => setMostrarFlash(false), 800)
    }
  }, [entidades, indiceActivo, setClientLegalEntityId])

  useEffect(() => {
    window.addEventListener('keydown', manejarTeclaPresionada)
    return () => window.removeEventListener('keydown', manejarTeclaPresionada)
  }, [manejarTeclaPresionada])

  const entidadActiva = entidades[indiceActivo] || null

  // No renderizar nada si hay menos de 2 entidades
  if (entidades.length < 2) return null

  return (
    <>
      {/* Flash turquesa al cambiar con Ctrl+L */}
      {mostrarFlash && entidadActiva && (
        <div className="fixed inset-0 z-[9999] pointer-events-none transition-opacity" style={{
          background: 'linear-gradient(135deg, rgba(103, 232, 249, 0.15) 0%, rgba(45, 212, 191, 0.10) 100%)',
          animation: 'fadeInOut 0.8s ease-in-out',
        }}>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 px-4 py-2 rounded-full text-sm font-semibold shadow-lg border border-cyan-200 dark:border-cyan-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            {entidadActiva.razon_social} — {formatCuit(entidadActiva.cuit)}
          </div>
        </div>
      )}

      {/* Badge flotante bottom-right: muestra CUIT activo y atajo */}
      {entidadActiva && (
        <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 shadow-lg text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span className="font-medium">{entidadActiva.razon_social}</span>
          <span className="text-zinc-400">|</span>
          <span className="text-zinc-500">{formatCuit(entidadActiva.cuit)}</span>
          <kbd className="ml-2 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+L</kbd>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
