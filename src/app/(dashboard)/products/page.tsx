import { getProducts, deleteProduct } from "@/actions/products"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, Package, Trash2, Edit } from "lucide-react"
import Link from "next/link"

export default async function ProductsPage() {
  const products = await getProducts()
  
  // Filter active products logically
  const activeProducts = products.filter(p => p.is_active)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-zinc-500 mt-1">Gestiona tu catálogo e inventario.</p>
        </div>
        <Link href="/products/new" className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-9 px-4 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 transition-all shrink-0 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {activeProducts.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-500 text-center">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Tu catálogo está vacío</p>
            <p className="text-sm mt-1 mb-6">Agrega tu primer producto para comenzar a vender.</p>
            <Link href="/products/new" className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-9 px-4 border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-all shadow-sm">
              Crear Producto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {activeProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-zinc-500">{product.sku || '-'}</td>
                    <td className="px-6 py-4 text-zinc-500">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-xs">
                        {product.category?.name || 'Sin Categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      ${product.price?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        product.stock_quantity <= product.min_stock 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                       {/* Edit button placeholder */}
                      <Button variant="ghost" size="icon" className="opacity-60 hover:opacity-100 transition" disabled>
                        <Edit className="w-4 h-4" />
                      </Button>

                      <form action={async () => {
                        "use server"
                        await deleteProduct(product.id)
                      }}>
                        <Button variant="ghost" size="icon" type="submit" className="text-red-500 opacity-60 hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
