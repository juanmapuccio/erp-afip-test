"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Trash2, Receipt } from "lucide-react"
import { createExpense, deleteExpense } from "@/actions/expenses"

const CATEGORIES = [
  { value: 'alquiler', label: '🏠 Alquiler' },
  { value: 'servicios', label: '💡 Servicios' },
  { value: 'sueldos', label: '👥 Sueldos' },
  { value: 'mantenimiento', label: '🔧 Mantenimiento' },
  { value: 'publicidad', label: '📢 Publicidad' },
  { value: 'impuestos', label: '🏛️ Impuestos' },
  { value: 'transporte', label: '🚚 Transporte' },
  { value: 'insumos', label: '📦 Insumos' },
  { value: 'otros', label: '📋 Otros' },
]

type Expense = {
  id: string
  category: string
  description: string
  amount: number
  tax_rate: number
  tax_amount: number
  expense_date: string
  payment_method: string | null
  receipt_number: string | null
  notes: string | null
  supplier?: { name: string } | null
}

export default function ExpensesPage({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Calcular totales
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await createExpense(formData)
        setShowForm(false)
        window.location.reload()
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const handleDelete = (expenseId: string) => {
    if (!confirm("¿Eliminar este gasto?")) return
    startTransition(async () => {
      await deleteExpense(expenseId)
      setExpenses(prev => prev.filter(e => e.id !== expenseId))
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-red-500" />
            Gastos
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {expenses.length} gastos — Total: ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setError("") }} className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </Button>
      </div>

      {/* Resumen por categoría */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {CATEGORIES.map(cat => {
          const catTotal = expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + Number(e.amount), 0)
          if (catTotal === 0) return null
          return (
            <div key={cat.value} className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-lg">{cat.label.split(' ')[0]}</p>
              <p className="text-xs font-bold mt-1">${catTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
          )
        })}
      </div>

      {/* Tabla de gastos */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left p-4 font-semibold">Fecha</th>
                  <th className="text-left p-4 font-semibold">Categoría</th>
                  <th className="text-left p-4 font-semibold">Descripción</th>
                  <th className="text-left p-4 font-semibold">Proveedor</th>
                  <th className="text-right p-4 font-semibold">Monto</th>
                  <th className="text-right p-4 font-semibold">IVA</th>
                  <th className="text-right p-4 font-semibold w-20"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-zinc-400">No hay gastos registrados aún.</td></tr>
                ) : expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    <td className="p-4 font-mono text-xs">{new Date(exp.expense_date).toLocaleDateString('es-AR')}</td>
                    <td className="p-4">
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                        {CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                      </span>
                    </td>
                    <td className="p-4">{exp.description}</td>
                    <td className="p-4 text-zinc-500">{exp.supplier?.name || '—'}</td>
                    <td className="p-4 text-right font-medium">${Number(exp.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right text-zinc-500">${Number(exp.tax_amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(exp.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
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
          <Card className="w-full max-w-lg mx-4 shadow-2xl border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>Nuevo Gasto</CardTitle>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <select id="category" name="category" required className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                    {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Input id="description" name="description" required placeholder="Detalle del gasto" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto *</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">% IVA</Label>
                    <select id="tax_rate" name="tax_rate" defaultValue="21" className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <option value="0">0% (Exento)</option>
                      <option value="10.5">10.5%</option>
                      <option value="21">21%</option>
                      <option value="27">27%</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">Fecha</Label>
                    <Input id="expense_date" name="expense_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Medio de Pago</Label>
                    <select id="payment_method" name="payment_method" className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <option value="">Sin especificar</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta_debito">Tarjeta Débito</option>
                      <option value="tarjeta_credito">Tarjeta Crédito</option>
                      <option value="cheque">Cheque</option>
                    </select>
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
                    {isPending ? "Guardando..." : "Registrar Gasto"}
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
