import { getSales } from "@/actions/sales"
import { Receipt } from "lucide-react"
import { SalesList } from "@/features/sales/components/SalesList"

export default async function SalesPage() {
  const sales = await getSales()

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">
            Historial de <span className="text-emerald-500">Facturación</span>
          </h1>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Ventas Registradas y Facturadas (Sandbox AFIP)
          </p>
        </div>
      </div>

      <SalesList initialSales={sales} />
    </div>
  )
}
