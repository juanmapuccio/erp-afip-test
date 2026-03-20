import { getSuppliers } from "@/actions/suppliers"
import SuppliersPage from "@/features/suppliers/components/SuppliersPage"

export default async function SuppliersRoute() {
  const suppliers = await getSuppliers()
  return <SuppliersPage initialSuppliers={suppliers as any} />
}
