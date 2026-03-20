/**
 * Acciones de Servidor para la integración con AFIP.
 * Estas funciones se ejecutan solo en el servidor por seguridad.
 */
'use server'

import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'
import {
  requestCAE, mapSaleToVoucher,
  tipoToLetra, generateAfipQRUrl,
} from '@/lib/afip/billing'
import type { SaleCAEResult } from '@/lib/afip/types'

// ── Solicitar CAE para una venta ──────────────────────────

/**
 * Esta es la función principal que solicita el CAE.
 * 1. Busca los datos de la venta y las entidades legales en Supabase.
 * 2. Mapea los datos al formato AFIP.
 * 3. Llama al Web Service de AFIP para obtener el CAE.
 * 4. Guarda el resultado y actualiza el número de factura en la base de datos.
 */
export async function requestCAEForSale(
  idVenta: string
): Promise<SaleCAEResult> {
  const idEmpresaActiva = await getActiveCompanyId()
  if (!idEmpresaActiva) throw new Error('No hay empresa activa')

  const supabase = await createClient()

  // Buscamos los datos de la venta preservando los nombres de campos de la BD
  const { data: venta, error } = await supabase
    .from('sales')
    .select(`
      id, grand_total, subtotal, tax_total,
      legal_entity_id, invoice_number, created_at,
      cae, cae_due_date,
      legal_entity:legal_entities (
        cuit, tax_condition, afip_pos_number
      ),
      client:clients (cuit, tax_condition)
    `)
    .eq('id', idVenta)
    .eq('company_id', idEmpresaActiva)
    .single()

  if (error || !venta)        throw new Error('Venta no encontrada')
  
  // Normalizar relaciones (manejo de arrays accidentales en tipos de Supabase)
  const entidadLegal = Array.isArray(venta.legal_entity) ? venta.legal_entity[0] : venta.legal_entity
  const cliente = Array.isArray(venta.client) ? venta.client[0] : venta.client

  if (!entidadLegal)    throw new Error('Sin entidad legal asignada')
  if (venta.cae)         throw new Error('Esta venta ya tiene CAE')

  // Mapeo a formato AFIP (manteniendo consistencia con tipos de la BD)
  const datosComprobante = mapSaleToVoucher({
    grand_total:  venta.grand_total,
    subtotal:     venta.subtotal,
    tax_total:    venta.tax_total,
    legal_entity: entidadLegal as any,
    client:       cliente as any,
  })

  // Solicitud al Web Service de AFIP
  const resultadoCae = await requestCAE(datosComprobante)

  const tipoFactura   = tipoToLetra(datosComprobante.tipoComprobante)
  const numeroFactura = [
    String(datosComprobante.puntoDeVenta).padStart(5, '0'),
    String(resultadoCae.voucherNumber).padStart(8, '0'),
  ].join('-')

  // Actualización de la venta en Supabase
  await supabase
    .from('sales')
    .update({
      invoice_number: numeroFactura,
      invoice_type:   tipoFactura,
      cae:            resultadoCae.CAE,
      cae_due_date:   resultadoCae.CAEFchVto,
      status:         'confirmed',
    })
    .eq('id', idVenta)

  // Actualización del contador en la entidad legal
  const campoContador = `afip_last_invoice_${tipoFactura.toLowerCase()}`
  await supabase
    .from('legal_entities')
    .update({ [campoContador]: resultadoCae.voucherNumber })
    .eq('id', venta.legal_entity_id)

  return {
    success: true,
    invoiceNumber: numeroFactura,
    invoiceType:   tipoFactura,
    cae:           resultadoCae.CAE,
    caeDueDate:    resultadoCae.CAEFchVto,
  }
}

// ── Test de conexión ──────────────────────────────────────

export async function testAfipConnection() {
  try {
    const { createAfipClient } = await import('@/lib/afip/client')
    const afip = createAfipClient()
    await afip.ElectronicBilling.getLastVoucher(1, 6)
    return { ok: true, env: process.env.AFIP_ENV ?? 'sandbox' }
  } catch (err: any) {
    return { ok: false, env: process.env.AFIP_ENV ?? 'sandbox', error: err.message }
  }
}

// ── URL del QR AFIP para el comprobante impreso ───────────

export async function getSaleQRUrl(idVenta: string): Promise<string | null> {
  const idEmpresaActiva = await getActiveCompanyId()
  if (!idEmpresaActiva) return null

  const supabase = await createClient()
  const { data: venta } = await supabase
    .from('sales')
    .select(`
      grand_total, cae, invoice_number, created_at,
      legal_entity:legal_entities(cuit, afip_pos_number)
    `)
    .eq('id', idVenta)
    .eq('company_id', idEmpresaActiva)
    .single()

  if (!venta?.cae || !venta.legal_entity) return null

  const [ptoVta, nroCmp] = (venta.invoice_number ?? '00001-1').split('-')
  const entidadLegal = Array.isArray(venta.legal_entity) ? venta.legal_entity[0] : venta.legal_entity
  
  if (!entidadLegal) return null

  return generateAfipQRUrl({
    fecha:           venta.created_at.split('T')[0],
    cuit:            entidadLegal.cuit,
    afipPosNumber:   ptoVta,
    tipoComprobante: 6,
    voucherNumber:   parseInt(nroCmp),
    grand_total:     venta.grand_total,
    tipoDocReceptor: 99,
    nroDocReceptor:  0,
    cae:             venta.cae,
  })
}
