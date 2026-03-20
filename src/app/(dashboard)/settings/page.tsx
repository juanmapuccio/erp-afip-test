import { LegalEntitiesManager } from "@/features/companies/components/LegalEntitiesManager"

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-zinc-500 text-sm mt-1">Administrá tu empresa y razones sociales.</p>
      </div>

      <LegalEntitiesManager />
    </div>
  )
}
