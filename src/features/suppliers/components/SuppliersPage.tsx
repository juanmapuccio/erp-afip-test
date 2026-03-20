"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, X, Pencil, Trash2, Truck } from "lucide-react"
import { createSupplier, updateSupplier, deactivateSupplier } from "@/actions/suppliers"
import { formatCuit } from "@/lib/utils"

const TAX_CONDITIONS = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'exento', label: 'Exento' },
  { value: 'no_responsable', label: 'No Responsable' },
]

type Supplier = {
  id: string
  name: string
  razon_social: string | null
  cuit: string | null
  email: string | null
  phone: string | null
  domicilio: string | null
  ciudad: string | null
  provincia: string | null
  tax_condition: string | null
  notes: string | null
}

export default function SuppliersPage({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cuit?.includes(search) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        if (editing) {
          await updateSupplier(editing.id, formData)
        } else {
          await createSupplier(formData)
        }
        setShowForm(false)
        setEditing(null)
        window.location.reload()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const handleDeactivate = (supplierId: string) => {
    if (!confirm("¿Desactivar este proveedor?")) return
    startTransition(async () => {
      await deactivateSupplier(supplierId)
      setSuppliers(prev => prev.filter(s => s.id !== supplierId))
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-500" />
            Proveedores
          </h2>
          <p className="text-sm text-zinc-500 mt-1">{suppliers.length} proveedores activos</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); setError("") }} className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input placeholder="Buscar por nombre, CUIT o email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left p-4 font-semibold">Nombre</th>
                  <th className="text-left p-4 font-semibold">CUIT</th>
                  <th className="text-left p-4 font-semibold">Condición IVA</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Teléfono</th>
                  <th className="text-right p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-zinc-400">
                    {search ? "Sin resultados" : "No hay proveedores aún. ¡Cargá el primero!"}
                  </td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    <td className="p-4">
                      <p className="font-medium">{s.name}</p>
                      {s.razon_social && <p className="text-xs text-zinc-400">{s.razon_social}</p>}
                    </td>
                    <td className="p-4 font-mono text-xs">{s.cuit ? formatCuit(s.cuit) : '—'}</td>
                    <td className="p-4">
                      {s.tax_condition ? (
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                          {TAX_CONDITIONS.find(t => t.value === s.tax_condition)?.label || s.tax_condition}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-4 text-zinc-500">{s.email || '—'}</td>
                    <td className="p-4 text-zinc-500">{s.phone || '—'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(s); setShowForm(true); setError("") }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                          <Pencil className="w-4 h-4 text-zinc-500" />
                        </button>
                        <button onClick={() => handleDeactivate(s.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
                          <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4 shadow-2xl border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</CardTitle>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" name="name" required defaultValue={editing?.name || ''} placeholder="Nombre del proveedor" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input id="cuit" name="cuit" defaultValue={editing?.cuit || ''} placeholder="XX-XXXXXXXX-X" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_condition">Condición IVA</Label>
                    <select id="tax_condition" name="tax_condition" defaultValue={editing?.tax_condition || ''} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <option value="">Sin especificar</option>
                      {TAX_CONDITIONS.map(tc => <option key={tc.value} value={tc.value}>{tc.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social</Label>
                  <Input id="razon_social" name="razon_social" defaultValue={editing?.razon_social || ''} placeholder="Razón social formal" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={editing?.email || ''} placeholder="proveedor@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" defaultValue={editing?.phone || ''} placeholder="+54 341 ..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="domicilio">Domicilio</Label>
                    <Input id="domicilio" name="domicilio" defaultValue={editing?.domicilio || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input id="ciudad" name="ciudad" defaultValue={editing?.ciudad || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input id="provincia" name="provincia" defaultValue={editing?.provincia || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input id="notes" name="notes" defaultValue={editing?.notes || ''} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancelar</Button>
                  <Button type="submit" disabled={isPending} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    {isPending ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Proveedor"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
