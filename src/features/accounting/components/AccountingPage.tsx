"use client"

import React, { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, ChevronRight, Filter, BarChart3 } from "lucide-react"

type JournalLine = {
  id: string
  debit: number
  credit: number
  description: string | null
  account: { code: string; name: string; account_type: string } | null
}

type JournalEntry = {
  id: string
  entry_date: string
  description: string | null
  reference_type: string | null
  reference_id: string | null
  created_at: string
  legal_entity: { razon_social: string } | null
  lines: JournalLine[]
}

type TrialBalanceRow = {
  code: string
  name: string
  type: string
  totalDebit: number
  totalCredit: number
}

/**
 * Página del Libro Diario.
 * Muestra asientos contables con sus líneas (partida doble),
 * filtros por fecha/tipo, y balance de sumas y saldos.
 */
export default function AccountingPage({
  initialEntries,
  trialBalance,
}: {
  initialEntries: JournalEntry[]
  trialBalance: TrialBalanceRow[]
}) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showBalance, setShowBalance] = useState(false)

  // Totales generales
  const totalDebit = entries.reduce((sum, e) =>
    sum + e.lines.reduce((s, l) => s + Number(l.debit), 0), 0)
  const totalCredit = entries.reduce((sum, e) =>
    sum + e.lines.reduce((s, l) => s + Number(l.credit), 0), 0)

  const toggleEntry = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpandedIds(new Set(entries.map(e => e.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // Colores por tipo de referencia
  const refTypeColor = (type: string | null) => {
    switch (type) {
      case 'sale': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      case 'expense': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'purchase': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'
    }
  }

  const refTypeLabel = (type: string | null) => {
    switch (type) {
      case 'sale': return 'Venta'
      case 'expense': return 'Gasto'
      case 'purchase': return 'Compra'
      default: return type || 'Manual'
    }
  }

  // Color por tipo de cuenta
  const accountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-blue-600'
      case 'liability': return 'text-amber-600'
      case 'equity': return 'text-purple-600'
      case 'revenue': return 'text-emerald-600'
      case 'expense': return 'text-red-600'
      default: return 'text-zinc-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            Libro Diario
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {entries.length} asientos — Debe: ${totalDebit.toLocaleString('es-AR', { minimumFractionDigits: 2 })} | Haber: ${totalCredit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            {Math.abs(totalDebit - totalCredit) < 0.01
              ? <span className="ml-2 text-emerald-600 font-medium">✓ Balanceado</span>
              : <span className="ml-2 text-red-600 font-medium">✗ Desbalance: ${(totalDebit - totalCredit).toFixed(2)}</span>
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)} className="gap-1">
            <BarChart3 className="w-4 h-4" />
            {showBalance ? 'Asientos' : 'Sumas y Saldos'}
          </Button>
          <Button variant="outline" size="sm" onClick={expandAll}>Expandir todos</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>Colapsar</Button>
        </div>
      </div>

      {/* ======== VISTA: Sumas y Saldos ======== */}
      {showBalance && (
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" /> Balance de Sumas y Saldos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="text-left p-4 font-semibold">Código</th>
                    <th className="text-left p-4 font-semibold">Cuenta</th>
                    <th className="text-left p-4 font-semibold">Tipo</th>
                    <th className="text-right p-4 font-semibold">Total Debe</th>
                    <th className="text-right p-4 font-semibold">Total Haber</th>
                    <th className="text-right p-4 font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-zinc-400">No hay movimientos aún.</td></tr>
                  ) : trialBalance.map(row => {
                    const saldo = row.totalDebit - row.totalCredit
                    return (
                      <tr key={row.code} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                        <td className="p-4 font-mono text-xs font-bold">{row.code}</td>
                        <td className="p-4 font-medium">{row.name}</td>
                        <td className="p-4">
                          <span className={`text-xs font-medium ${accountTypeColor(row.type)}`}>
                            {row.type === 'asset' ? 'Activo' : row.type === 'liability' ? 'Pasivo' :
                             row.type === 'equity' ? 'PN' : row.type === 'revenue' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono">${row.totalDebit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-mono">${row.totalCredit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className={`p-4 text-right font-bold font-mono ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ${saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 font-bold">
                    <td colSpan={3} className="p-4">TOTALES</td>
                    <td className="p-4 text-right font-mono">
                      ${trialBalance.reduce((s, r) => s + r.totalDebit, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono">
                      ${trialBalance.reduce((s, r) => s + r.totalCredit, 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono">
                      ${(trialBalance.reduce((s, r) => s + r.totalDebit, 0) - trialBalance.reduce((s, r) => s + r.totalCredit, 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======== VISTA: Asientos ======== */}
      {!showBalance && (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-12 text-center text-zinc-400">
                No hay asientos contables registrados. Se generan automáticamente al realizar ventas o registrar gastos.
              </CardContent>
            </Card>
          ) : entries.map(entry => {
            const isExpanded = expandedIds.has(entry.id)
            const entryDebit = entry.lines.reduce((s, l) => s + Number(l.debit), 0)
            const entryCredit = entry.lines.reduce((s, l) => s + Number(l.credit), 0)

            return (
              <div key={entry.id}
                   className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all">
                {/* Header del asiento — clic para expandir */}
                <button
                  onClick={() => toggleEntry(entry.id)}
                  className="w-full px-5 py-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition text-left"
                >
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-zinc-400">
                        {new Date(entry.entry_date).toLocaleDateString('es-AR')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${refTypeColor(entry.reference_type)}`}>
                        {refTypeLabel(entry.reference_type)}
                      </span>
                      <span className="text-sm font-medium truncate">{entry.description}</span>
                    </div>
                    {entry.legal_entity && (
                      <p className="text-xs text-zinc-400 mt-0.5">{entry.legal_entity.razon_social}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">${entryDebit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-zinc-400">{entry.lines.length} líneas</p>
                  </div>
                </button>

                {/* Líneas del asiento (expandido) */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-xs text-zinc-500">
                          <th className="text-left px-5 py-2 font-medium">Cuenta</th>
                          <th className="text-left px-5 py-2 font-medium">Detalle</th>
                          <th className="text-right px-5 py-2 font-medium">Debe</th>
                          <th className="text-right px-5 py-2 font-medium">Haber</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map(line => (
                          <tr key={line.id} className="border-t border-zinc-50 dark:border-zinc-800/50">
                            <td className="px-5 py-2">
                              <span className={`font-mono text-xs font-bold ${accountTypeColor(line.account?.account_type || '')}`}>
                                {line.account?.code}
                              </span>
                              <span className="ml-2 text-xs">{line.account?.name}</span>
                            </td>
                            <td className="px-5 py-2 text-xs text-zinc-500">{line.description}</td>
                            <td className="px-5 py-2 text-right font-mono">
                              {Number(line.debit) > 0
                                ? <span className="font-medium">${Number(line.debit).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                : <span className="text-zinc-300">—</span>
                              }
                            </td>
                            <td className="px-5 py-2 text-right font-mono">
                              {Number(line.credit) > 0
                                ? <span className="font-medium">${Number(line.credit).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                : <span className="text-zinc-300">—</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/50 font-bold text-xs">
                          <td colSpan={2} className="px-5 py-2 text-right">TOTALES</td>
                          <td className="px-5 py-2 text-right font-mono">${entryDebit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-2 text-right font-mono">${entryCredit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
