"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Trash2, ShoppingBag, Package } from "lucide-react"
import { createPurchase, cancelPurchase } from "@/actions/purchases"

type Purchase = {
  id: string
  purchase_date: string
  invoice_type: string | null
  invoice_number: string | null
  subtotal: number
  tax_total: number
  grand_total: number
  status: string
  payment_method: string | null
  notes: string | null
  supplier?: { name: string } | null
}

type Product = { id: string; name: string; sku: string | null; cost_price: number }
type Supplier = { id: string; name: string }

/**
 * Página de compras.
 * Permite registrar compras con items (similar a POS pero de entrada).
 * Cada compra actualiza el stock automáticamente.
 */
export default function PurchasesPage({
  initialPurchases,
  products,
  suppliers,
}: {
  initialPurchases: Purchase[]
  products: Product[]
  suppliers: Supplier[]
}) {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Estado del formulario de nueva compra
  const [supplierId, setSupplierId] = useState("")
  const [invoiceType, setInvoiceType] = useState("B")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<{ product_id: string; quantity: number; unit_cost: number; tax_rate: number }[]>([])

  // Totales
  const totalCompras = purchases.filter(p => p.status !== 'cancelled').reduce((sum, p) => sum + Number(p.grand_total), 0)

  const addItem = () => {
    setItems(prev => [...prev, { product_id: "", quantity: 1, unit_cost: 0, tax_rate: 21 }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      // Auto-llenar costo al seleccionar producto
      if (field === 'product_id') {
        const product = products.find(p => p.id === value)
        if (product) updated.unit_cost = product.cost_price || 0
      }
      return updated
    }))
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
  const itemsTax = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost * item.tax_rate / 100), 0)
  const itemsTotal = itemsSubtotal + itemsTax

  const handleSubmit = () => {
    if (items.length === 0) { setError("Agregá al menos un item"); return }
    if (items.some(i => !i.product_id)) { setError("Seleccioná un producto para cada item"); return }
    setError("")

    startTransition(async () => {
      try {
        await createPurchase({
          supplier_id: supplierId || undefined,
          invoice_type: invoiceType,
          invoice_number: invoiceNumber || undefined,
          purchase_date: purchaseDate,
          payment_method: paymentMethod || undefined,
          notes: notes || undefined,
          items,
        })
        setShowForm(false)
        resetForm()
        window.location.reload()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const resetForm = () => {
    setSupplierId("")
    setInvoiceNumber("")
    setPaymentMethod("")
    setNotes("")
    setItems([])
  }

  const handleCancel = (purchaseId: string) => {
    if (!confirm("¿Cancelar esta compra? No se revertirá el stock automáticamente.")) return
    startTransition(async () => {
      await cancelPurchase(purchaseId)
      setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: 'cancelled' } : p))
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-500" />
            Compras
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {purchases.filter(p => p.status !== 'cancelled').length} compras — Total: ${totalCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setError(""); addItem() }} className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
          <Plus className="w-4 h-4" /> Nueva Compra
        </Button>
      </div>

      {/* Tabla de compras */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left p-4 font-semibold">Fecha</th>
                  <th className="text-left p-4 font-semibold">Proveedor</th>
                  <th className="text-left p-4 font-semibold">Comprobante</th>
                  <th className="text-right p-4 font-semibold">Subtotal</th>
                  <th className="text-right p-4 font-semibold">IVA</th>
                  <th className="text-right p-4 font-semibold">Total</th>
                  <th className="text-center p-4 font-semibold">Estado</th>
                  <th className="text-right p-4 font-semibold w-20"></th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-zinc-400">No hay compras registradas aún.</td></tr>
                ) : purchases.map(p => (
                  <tr key={p.id} className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition ${p.status === 'cancelled' ? 'opacity-50' : ''}`}>
                    <td className="p-4 font-mono text-xs">{new Date(p.purchase_date).toLocaleDateString('es-AR')}</td>
                    <td className="p-4">{p.supplier?.name || '—'}</td>
                    <td className="p-4 text-xs">
                      {p.invoice_type && <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded mr-1">{p.invoice_type}</span>}
                      {p.invoice_number || '—'}
                    </td>
                    <td className="p-4 text-right">${Number(p.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right text-zinc-500">${Number(p.tax_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right font-bold">${Number(p.grand_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' :
                        p.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                      }`}>
                        {p.status === 'paid' ? 'Pagada' : p.status === 'cancelled' ? 'Anulada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {p.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(p.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition" title="Anular">
                          <X className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal — Nueva Compra */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 shadow-2xl border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                Nueva Compra
              </CardTitle>
              <button onClick={() => { setShowForm(false); resetForm() }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">{error}</div>}

              <div className="space-y-4">
                {/* Encabezado de compra */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <option value="">Sin proveedor</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo Comp.</Label>
                    <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <option value="A">Factura A</option>
                      <option value="B">Factura B</option>
                      <option value="C">Factura C</option>
                      <option value="M">Factura M</option>
                      <option value="X">Interno</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>N° Comprobante</Label>
                    <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="0001-00000001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Medio de pago</Label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <option value="">—</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="cheque">Cheque</option>
                      <option value="tarjeta_credito">Tarjeta Crédito</option>
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4" /> Items
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                      <Plus className="w-3 h-3" /> Agregar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
                        <div className="col-span-4 space-y-1">
                          {index === 0 && <Label className="text-xs">Producto</Label>}
                          <select value={item.product_id} onChange={e => updateItem(index, 'product_id', e.target.value)} className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                            <option value="">Seleccionar...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">Cantidad</Label>}
                          <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="h-9 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">Costo Unit.</Label>}
                          <Input type="number" step="0.01" value={item.unit_cost} onChange={e => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)} className="h-9 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          {index === 0 && <Label className="text-xs">% IVA</Label>}
                          <select value={item.tax_rate} onChange={e => updateItem(index, 'tax_rate', parseFloat(e.target.value))} className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                            <option value="0">0%</option>
                            <option value="10.5">10.5%</option>
                            <option value="21">21%</option>
                            <option value="27">27%</option>
                          </select>
                        </div>
                        <div className="col-span-1 space-y-1 text-right">
                          {index === 0 && <Label className="text-xs">Subtotal</Label>}
                          <p className="h-9 flex items-center justify-end text-xs font-medium">
                            ${(item.quantity * item.unit_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeItem(index)} className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded transition">
                            <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1 text-right">
                  <p className="text-sm text-zinc-500">Subtotal: <span className="font-medium text-black dark:text-white">${itemsSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></p>
                  <p className="text-sm text-zinc-500">IVA: <span className="font-medium text-black dark:text-white">${itemsTax.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></p>
                  <p className="text-lg font-bold">Total: ${itemsTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={isPending || items.length === 0} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    {isPending ? "Registrando..." : "Registrar Compra"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
