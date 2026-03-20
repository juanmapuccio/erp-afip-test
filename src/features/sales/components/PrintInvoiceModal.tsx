/**
 * Modal de Impresión de Factura.
 * Utiliza React Portals para renderizarse en la raíz del DOM y evitar conflictos de CSS.
 * Optimizado para impresión en hoja A4.
 */
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, Printer, Download, 
  CheckCircle2, AlertCircle, Loader2 
} from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'
import { Button } from "@/components/ui/button"
import { getSaleQRUrl } from "@/actions/afip"

interface PrintInvoiceModalProps {
  sale: any
  onClose: () => void
}

const paymentMethodMap: Record<string, string> = {
  cash: "EFECTIVO",
  card: "TARJETA",
  transfer: "TRANSFERENCIA",
  other: "OTROS",
}

export function PrintInvoiceModal({ sale, onClose }: PrintInvoiceModalProps) {
  const [urlQr, setUrlQr] = useState<string | null>(null)
  const [estaCargando, setEstaCargando] = useState(true)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
    async function cargarQr() {
      try {
        const urlResultado = await getSaleQRUrl(sale.id)
        setUrlQr(urlResultado)
      } catch (err) {
        console.error("Error al obtener URL del QR:", err)
      } finally {
        setEstaCargando(false)
      }
    }
    cargarQr()
  }, [sale.id])

  if (!montado) return null

  const manejarImpresion = () => {
    window.print()
  }

  const modalContent = (
    <div id="print-root" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col border border-zinc-100 dark:border-zinc-800">
        
        {/* Header - No Imprimir */}
        <div className="px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-100">
                Vista Previa <span className="text-emerald-500">Factura</span>
              </h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                Comprobante Oficial {sale.invoice_type} - {sale.invoice_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={manejarImpresion}
              variant="outline"
              className="rounded-xl font-bold text-xs uppercase tracking-widest gap-2 h-10 px-5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-all group"
            >
              <X className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Invoice Body - Area de Impresión */}
        <div id="printable-invoice" className="flex-1 overflow-y-auto p-12 bg-white text-zinc-900 print:p-0 print:overflow-visible overflow-x-hidden">
          <div className="max-w-3xl mx-auto space-y-12 print:max-w-none">
            
            {/* Cabecera Factura */}
            <div className="grid grid-cols-2 gap-8 border-2 border-zinc-900 p-8 rounded-none relative">
              {/* Letra del Comprobante */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border-2 border-zinc-900 bg-white flex items-center justify-center font-black text-3xl">
                {sale.invoice_type || 'B'}
              </div>

              {/* Lado Izquierdo - Emisor */}
              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tighter uppercase">NODO SUR</h2>
                <div className="text-xs font-bold text-zinc-600 space-y-1">
                  <p>Razón Social: Nodo Sur IT Services S.A.</p>
                  <p>Domicilio: Calle Ficticia 123 - Rosario, SF</p>
                  <p>Condición IVA: Responsable Inscripto</p>
                </div>
              </div>

              {/* Lado Derecho - Datos Fiscales */}
              <div className="text-right space-y-4">
                <h3 className="text-xl font-black tracking-tight uppercase">FACTURA</h3>
                <div className="text-xs font-bold text-zinc-600 space-y-1 uppercase">
                  <p className="text-lg text-black font-black">{sale.invoice_number}</p>
                  <p>Fecha: {new Intl.DateTimeFormat('es-AR').format(new Date(sale.created_at))}</p>
                  <p>CUIT: 30-71111111-9</p>
                  <p>Ingresos Brutos: 123-456789-0</p>
                  <p>Inicio Actividades: 01/01/2024</p>
                </div>
              </div>
            </div>

            {/* Datos Receptor */}
            <div className="border-2 border-zinc-900 p-6">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-tight">
                <div>
                  <p className="text-zinc-400 mb-1">Cliente / Receptor</p>
                  <p className="text-sm font-black text-black">{sale.client?.name || 'Consumidor Final'}</p>
                  <p className="mt-2 text-zinc-600">CUIT: {sale.client?.cuit || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 mb-1">Condición Pago</p>
                  <p className="text-sm font-black text-black uppercase">{paymentMethodMap[sale.payment_method] || sale.payment_method}</p>
                  <p className="mt-2 text-zinc-600">Condición IVA: {sale.client?.tax_condition || 'Consumidor Final'}</p>
                </div>
              </div>
            </div>

            {/* Tabla Detalle */}
            <div className="border border-zinc-900">
              <table className="w-full text-left text-xs uppercase tracking-tight font-bold">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="px-4 py-3 border-r border-zinc-900">Cant</th>
                    <th className="px-4 py-3 border-r border-zinc-900">Producto</th>
                    <th className="px-4 py-3 border-r border-zinc-900 text-right">Unitario</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {sale.sale_items?.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-3 border-r border-zinc-900">{item.quantity}</td>
                      <td className="px-4 py-3 border-r border-zinc-900">{item.product?.name || 'Producto'}</td>
                      <td className="px-4 py-3 border-r border-zinc-900 text-right">${(item.unit_price ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${(item.line_total ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-900 font-black bg-zinc-50">
                    <td colSpan={3} className="px-4 py-4 text-right border-r border-zinc-900">TOTAL</td>
                    <td className="px-4 py-4 text-right text-lg">${Number(sale.grand_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pie de Factura - ARCA (Ex-AFIP) */}
            <div className="flex items-end justify-between border-t border-zinc-200 pt-8">
              <div className="flex items-center gap-6">
                <div className="p-2 border border-zinc-200">
                  {estaCargando ? (
                    <div className="w-32 h-32 flex items-center justify-center bg-zinc-50">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                    </div>
                  ) : urlQr ? (
                    <QRCodeSVG value={urlQr} size={128} level="M" />
                  ) : (
                    <div className="w-32 h-32 bg-zinc-50 flex items-center justify-center flex-col text-[10px] text-zinc-400 font-bold p-4 text-center">
                      <AlertCircle className="w-6 h-6 mb-2" />
                      QR No Disponible
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img src="/images/ARCA_logo.png" alt="ARCA" className="h-8 opacity-90 object-contain" />
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pt-0.5">Comprobante Autorizado por ARCA</p>
                  </div>
                  <div className="text-[12px] font-black space-y-0.5">
                    <p>CAE: {sale.cae}</p>
                    <p>Vto. CAE: {sale.cae_due_date ? new Intl.DateTimeFormat('es-AR').format(new Date(sale.cae_due_date)) : 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="text-right text-[10px] font-bold text-zinc-400 uppercase leading-relaxed max-w-[200px]">
                Esta factura ha sido validada por el servidor de ARCA (Agencia de Recaudación y Control Aduanero).
              </div>
            </div>

          </div>
        </div>

        {/* Footer info - No Imprimir */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 text-center print:hidden">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            ERP NodoSur • Módulo de Facturación Electrónica v1.0
          </p>
        </div>
      </div>

      {/* 
          Estilos globales dinámicos para el modo impresión.
          Aquí forzamos el tamaño A4, el ocultamiento de la interfaz web 
          y aseguramos que los colores de fondo se impriman.
      */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          /* Ocultar absolutamente todo en el body que no sea nuestro root */
          body > *:not(#print-root) {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          /* Asegurar que el modal y el área de impresión sean visibles */
          #print-root {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: auto !important;
            background: white !important;
            display: block !important;
            visibility: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Forzar el contenedor interno a display block y remover límites de altura */
          #print-root > div {
            display: block !important;
            max-height: none !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          /* Ocultar el Header del modal y otros decorativos */
          .print\\:hidden, #print-root > div > div:first-child, #print-root > div > div:last-child {
            display: none !important;
          }
          /* El contenedor específico de la factura */
          #printable-invoice {
            display: block !important;
            visibility: visible !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 20mm !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Forzar bordes y colores */
          .border-zinc-900, .border-2 { border-color: black !important; }
          .bg-zinc-100, .bg-zinc-50 { background-color: #f4f4f5 !important; }
          
          /* Evitar cortes extraños */
          * { overflow: visible !important; }
        }
      `}</style>
    </div>
  )

  return createPortal(modalContent, document.body)
}
