import { getCategories, createCategory, deleteCategory } from "@/actions/categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag, Trash2 } from "lucide-react"

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Creation Form */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 pb-6 md:pb-0 md:pr-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Nueva Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (formData) => {
                "use server"
                await createCategory(formData)
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Ej: Zapatillas" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full">Agregar</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                No hay categorías registradas aún.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                      <td className="px-6 py-4 font-medium">{cat.name}</td>
                      <td className="px-6 py-4 text-right">
                        <form action={async () => {
                          "use server"
                          await deleteCategory(cat.id)
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
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
