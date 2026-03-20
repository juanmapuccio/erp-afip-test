import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'

const COMPANY_COOKIE = 'nodosur_active_company_id'
const LEGAL_ENTITY_COOKIE = 'nodosur_active_legal_entity_id'

/**
 * Store global del workspace.
 * Mantiene en sincronía las cookies del servidor (source of truth para SSR)
 * con el estado del cliente (para reactividad instantánea).
 */
interface WorkspaceState {
  activeCompanyId: string | null
  activeLegalEntityId: string | null
  setActiveCompanyId: (id: string) => void
  setActiveLegalEntityId: (id: string) => void
  initializeFromCookie: () => void
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeCompanyId: null,
      activeLegalEntityId: null,

      /** Actualiza empresa activa en cookie + Zustand */
      setActiveCompanyId: (id) => {
        Cookies.set(COMPANY_COOKIE, id, { path: '/', expires: 30 })
        set({ activeCompanyId: id })
      },

      /** Actualiza CUIT activo en cookie + Zustand (cambio con Ctrl+L) */
      setActiveLegalEntityId: (id) => {
        Cookies.set(LEGAL_ENTITY_COOKIE, id, { path: '/', expires: 30 })
        set({ activeLegalEntityId: id })
      },

      /** Sincroniza estado del cliente con las cookies del servidor al montar */
      initializeFromCookie: () => {
        const companyId = Cookies.get(COMPANY_COOKIE)
        const legalEntityId = Cookies.get(LEGAL_ENTITY_COOKIE)
        const updates: Partial<WorkspaceState> = {}
        if (companyId) updates.activeCompanyId = companyId
        if (legalEntityId) updates.activeLegalEntityId = legalEntityId
        set(updates)
      }
    }),
    {
      name: 'nodosur-workspace',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage
        // Fallback SSR: no-op storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      partialize: (state) => ({
        activeCompanyId: state.activeCompanyId,
        activeLegalEntityId: state.activeLegalEntityId,
      }),
    }
  )
)
