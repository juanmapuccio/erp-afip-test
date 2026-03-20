"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { createProduct } from "@/actions/products"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import React from "react"

// For client components we fetch categories in a wrapper or pass as props.
// Since we are not passing props yet from a server parent, we'll fetch client side or just build a basic form first.
// Oh wait! Next.js App Router forms can just execute the action. 
// But we need categories data for the select input!
import { getCategories } from "@/actions/categories"

export default function NewProductPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = React.useState<any[]>([])

  React.useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createProduct(formData)
        router.push('/products')
      } catch (error) {
        console.error(error)
        alert('Error al crear el producto. Verifique los campos requeridos.')
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Producto</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
        <form action={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" required placeholder="Ej: Zapatilla Nike Air Max" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Código</Label>
                <Input id="sku" name="sku" placeholder="Ej: ZAP-NK-001" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Categoría</Label>
              <select 
                id="category_id" 
                name="category_id" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Input id="description" name="description" placeholder="Breve descripción..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Costo ($)</Label>
                <Input id="cost_price" name="cost_price" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio de Venta ($) <span className="text-red-500">*</span></Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" required placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Inicial</Label>
                <Input id="stock_quantity" name="stock_quantity" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stock Mínimo (Alerta)</Label>
                <Input id="min_stock" name="min_stock" type="number" min="0" defaultValue="0" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-zinc-100 dark:border-zinc-800 gap-3">
            <Link href="/products" className={buttonVariants({ variant: "outline" })}>
              Cancelar
            </Link>
            <Button disabled={isPending} type="submit" className="bg-black dark:bg-white">
              {isPending ? "Guardando..." : "Guardar Producto"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
