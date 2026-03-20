/**
 * Componente principal de la lista de Facturación.
 * Maneja el estado de carga, la solicitud de CAE y la apertura del modal de impresión.
 */
'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, Wallet, CheckCircle2, 
  FileText, Loader2, Sparkles, AlertCircle 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { requestCAEForSale } from "@/actions/afip"
import { useRouter } from 'next/navigation'
import { PrintInvoiceModal } from './PrintInvoiceModal'

interface SalesListProps {
  initialSales: any[]
}

const paymentMethodMap: Record<string, string> = {
  cash: "EFECTIVO",
  card: "TARJETA",
  transfer: "TRANSFERENCIA",
  other: "OTROS",
}

export function SalesList({ initialSales }: SalesListProps) {
  const router = useRouter()
  const [montado, setMontado] = useState(false)
  const [idsProcesando, setIdsProcesando] = useState<Set<string>>(new Set())
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMontado(true)
  }, [])

  if (!montado) {
    return <div className="p-20 text-center animate-pulse text-zinc-400 font-black uppercase tracking-widest">Cargando Facturación...</div>
  }

  /**
   * Procesa la facturación de una venta.
   * Solicita el CAE al servidor y refresca la lista al terminar.
   */
  async function handleBill(saleId: string) {
    if (idsProcesando.has(saleId)) return
    
    setIdsProcesando(prev => new Set(prev).add(saleId))
    setError(null)
    
    try {
      const result = await requestCAEForSale(saleId)
      if (result.success) {
        router.refresh() // Recargar datos del servidor
      }
    } catch (err: any) {
      console.error("Error facturando sale:", err)
      setError(err.message || "Error al solicitar CAE")
    } finally {
      setIdsProcesando(prev => {
        const next = new Set(prev)
        next.delete(saleId)
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-soft transition-all">
        {initialSales.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-zinc-300" />
            </div>
            <p className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Sin Ventas Registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Factura</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Fecha y Hora</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Condición</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Total</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">CAE / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {initialSales.map((sale: any) => {
                  const estaProcesando = idsProcesando.has(sale.id)
                  
                  return (
                    <tr key={sale.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-200">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-black text-xs">
                            {sale.invoice_type || (sale.cae ? '?' : 'B')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                              {sale.invoice_number || `TK-${sale.id.slice(-6).toUpperCase()}`}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">ID: {sale.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                            {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(sale.created_at))}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-3 h-3 text-zinc-400" />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                            {paymentMethodMap[sale.payment_method] || sale.payment_method}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-base font-black text-zinc-900 dark:text-zinc-100">
                          ${Number(sale.grand_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        {sale.cae ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 w-fit">
                              <CheckCircle2 className="w-3.2 h-3.2" />
                              CAE: {sale.cae}
                            </div>
                            <Button
                              onClick={() => setVentaSeleccionada(sale)}
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                              title="Ver Comprobante"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleBill(sale.id)}
                            disabled={estaProcesando || sale.status !== 'confirmed'}
                            className={cn(
                              "h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                              sale.status === 'confirmed' 
                                ? "bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-lg shadow-zinc-200 dark:shadow-none"
                                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                            )}
                          >
                            {estaProcesando ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                PROCESANDO...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-2" />
                                FACTURAR AFIP
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Impresión */}
      {ventaSeleccionada && (
        <PrintInvoiceModal 
          sale={ventaSeleccionada} 
          onClose={() => setVentaSeleccionada(null)} 
        />
      )}
    </div>
  )
}
