import { getPurchases } from "@/actions/purchases"
import { getSuppliers } from "@/actions/suppliers"
import { createClient } from "@/lib/server"
import { getActiveCompanyId } from "@/actions/company"
import PurchasesPage from "@/features/purchases/components/PurchasesPage"

/**
 * Server Component que carga compras, productos y proveedores
 * para el formulario de nueva compra.
 */
export default async function PurchasesRoute() {
  const purchases = await getPurchases()
  const suppliers = await getSuppliers()

  // Cargar productos para el selector de items
  const activeCompanyId = await getActiveCompanyId()
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, cost_price')
    .eq('company_id', activeCompanyId!)
    .eq('is_active', true)
    .order('name')

  return (
    <PurchasesPage
      initialPurchases={purchases as any}
      products={(products || []) as any}
      suppliers={suppliers as any}
    />
  )
}
