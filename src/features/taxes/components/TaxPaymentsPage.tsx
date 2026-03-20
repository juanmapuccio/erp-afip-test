"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Trash2, Landmark } from "lucide-react"
import { createTaxPayment, deleteTaxPayment } from "@/actions/tax-payments"

const TAX_TYPES = [
  { value: 'iva', label: 'IVA' },
  { value: 'ganancias', label: 'Ganancias' },
  { value: 'ingresos_brutos', label: 'Ingresos Brutos' },
  { value: 'monotributo', label: 'Monotributo' },
  { value: 'autonomos', label: 'Autónomos' },
  { value: 'sellos', label: 'Sellos' },
  { value: 'otros', label: 'Otros' },
]

type TaxPayment = {
  id: string
  tax_type: string
  tax_period: string
  amount: number
  payment_date: string
  receipt_number: string | null
  notes: string | null
  legal_entity?: { razon_social: string; cuit: string } | null
}

export default function TaxPaymentsPage({ initialPayments }: { initialPayments: TaxPayment[] }) {
  const [payments, setPayments] = useState<TaxPayment[]>(initialPayments)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Agrupar por tipo para el resumen
  const byType = TAX_TYPES.map(type => ({
    ...type,
    total: payments.filter(p => p.tax_type === type.value).reduce((sum, p) => sum + Number(p.amount), 0),
    count: payments.filter(p => p.tax_type === type.value).length,
  })).filter(t => t.count > 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await createTaxPayment(formData)
        setShowForm(false)
        window.location.reload()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const handleDelete = (paymentId: string) => {
    if (!confirm("¿Eliminar este pago?")) return
    startTransition(async () => {
      await deleteTaxPayment(paymentId)
      setPayments(prev => prev.filter(p => p.id !== paymentId))
    })
  }

  // Generar período actual en formato YYYYMM
  const currentPeriod = new Date().toISOString().slice(0, 7).replace('-', '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-violet-500" />
            Pagos de Impuestos
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {payments.length} pagos — Total: ${totalPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setError("") }} className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
          <Plus className="w-4 h-4" /> Nuevo Pago
        </Button>
      </div>

      {/* Resumen por tipo */}
      {byType.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {byType.map(t => (
            <div key={t.value} className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">{t.label}</p>
              <p className="text-lg font-bold mt-1">${t.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-zinc-400">{t.count} pago{t.count > 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left p-4 font-semibold">Fecha Pago</th>
                  <th className="text-left p-4 font-semibold">Impuesto</th>
                  <th className="text-left p-4 font-semibold">Período</th>
                  <th className="text-left p-4 font-semibold">Entidad</th>
                  <th className="text-right p-4 font-semibold">Monto</th>
                  <th className="text-left p-4 font-semibold">Comprobante</th>
                  <th className="text-right p-4 font-semibold w-20"></th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-zinc-400">No hay pagos de impuestos registrados.</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    <td className="p-4 font-mono text-xs">{new Date(p.payment_date).toLocaleDateString('es-AR')}</td>
                    <td className="p-4">
                      <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-1 rounded-full">
                        {TAX_TYPES.find(t => t.value === p.tax_type)?.label || p.tax_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {p.tax_period.length === 6 ? `${p.tax_period.slice(4, 6)}/${p.tax_period.slice(0, 4)}` : p.tax_period}
                    </td>
                    <td className="p-4 text-xs text-zinc-500">{p.legal_entity?.razon_social || '—'}</td>
                    <td className="p-4 text-right font-bold">${Number(p.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-xs text-zinc-500">{p.receipt_number || '—'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
                        <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                      </button>
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
          <Card className="w-full max-w-lg mx-4 shadow-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>Nuevo Pago de Impuesto</CardTitle>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="tax_type">Impuesto *</Label>
                    <select id="tax_type" name="tax_type" required className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      {TAX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_period">Período Fiscal *</Label>
                    <Input id="tax_period" name="tax_period" required defaultValue={currentPeriod} placeholder="YYYYMM ej: 202503" />
                    <p className="text-xs text-zinc-400">Formato: YYYYMM</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto *</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Fecha Pago</Label>
                    <Input id="payment_date" name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt_number">N° Comprobante</Label>
                  <Input id="receipt_number" name="receipt_number" placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input id="notes" name="notes" placeholder="Observaciones..." />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isPending} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    {isPending ? "Guardando..." : "Registrar Pago"}
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
