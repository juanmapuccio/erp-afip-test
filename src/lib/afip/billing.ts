/**
 * Lógica de negocio para el procesamiento de facturas con AFIP.
 * Este archivo se encarga de determinar el tipo de comprobante, 
 * formatear los datos para el SDK y solicitar el CAE.
 */
import { createAfipClient } from './client'
import type {
  VoucherData, CAEResponse,
  TipoComprobante, TipoDocumento,
  CondicionIVA, LetraComprobante,
} from './types'

// ── Helpers ──────────────────────────────────────────────

export function resolveTipoComprobante(
  emisorCondicion: string,
  receptorCondicion?: string
): TipoComprobante {
  if (emisorCondicion === 'monotributista') return 11
  if (
    emisorCondicion === 'responsable_inscripto' &&
    receptorCondicion === 'responsable_inscripto'
  ) return 1
  return 6
}

export function tipoToLetra(tipo: TipoComprobante): LetraComprobante {
  if (tipo === 1)  return 'A'
  if (tipo === 11) return 'C'
  return 'B'
}

export function generateAfipQRUrl(parametros: {
  fecha:           string
  cuit:            string
  afipPosNumber:   string
  tipoComprobante: TipoComprobante
  voucherNumber:   number
  grand_total:     number
  tipoDocReceptor: TipoDocumento
  nroDocReceptor:  number
  cae:             string
}): string {
  const datos = {
    ver:        1,
    fecha:      parametros.fecha,
    cuit:       parseInt(parametros.cuit.replace(/-/g, '')),
    ptoVta:     parseInt(parametros.afipPosNumber),
    tipoCmp:    parametros.tipoComprobante,
    nroCmp:     parametros.voucherNumber,
    importe:    parametros.grand_total,
    moneda:     'PES',
    ctz:        1,
    tipoDocRec: parametros.tipoDocReceptor,
    nroDocRec:  parametros.nroDocReceptor,
    tipoCodAut: 'E',
    codAut:     parseInt(parametros.cae),
  }
  const base64 = Buffer.from(JSON.stringify(datos)).toString('base64')
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`
}

// ── Lógica principal ──────────────────────────────────────

export function mapSaleToVoucher(venta: {
  grand_total:  number
  subtotal:     number
  tax_total:    number
  legal_entity: { tax_condition: string; afip_pos_number?: string }
  client?:      { cuit?: string; tax_condition?: string } | null
}): VoucherData {
  const tipoComprobante = resolveTipoComprobante(
    venta.legal_entity.tax_condition,
    venta.client?.tax_condition
  )

  const tipoDocReceptor: TipoDocumento = venta.client?.cuit ? 80 : 99
  const nroDocReceptor = venta.client?.cuit
    ? parseInt(venta.client.cuit.replace(/-/g, ''))
    : 0

  const mapeoCondicion: Record<string, CondicionIVA> = {
    responsable_inscripto: 1,
    exento:                4,
    consumidor_final:      5,
    monotributista:        6,
    no_responsable:        13,
  }
  const condicionIVAReceptor: CondicionIVA =
    mapeoCondicion[venta.client?.tax_condition ?? 'consumidor_final'] ?? 5

  let importeTotal = parseFloat(venta.grand_total.toFixed(2))
  let importeNeto  = parseFloat(venta.subtotal.toFixed(2))
  let importeIVA   = parseFloat(venta.tax_total.toFixed(2))

  // ── Corrección para Facturas A/B con IVA 0 registrado ─────
  // AFIP exige AlicIva si el neto > 0. Si el usuario no especificó IVA (0), 
  // asumimos que el total ya incluye el 21% y lo recalculamos para AFIP.
  if (tipoComprobante !== 11 && importeIVA === 0 && importeNeto > 0) {
    importeNeto = parseFloat((importeTotal / 1.21).toFixed(2))
    importeIVA  = parseFloat((importeTotal - importeNeto).toFixed(2))
  }

  return {
    puntoDeVenta:         parseInt(venta.legal_entity.afip_pos_number ?? '1'),
    tipoComprobante,
    concepto:             1,
    tipoDocReceptor,
    nroDocReceptor,
    importeTotal,
    importeNeto,
    importeIVA,
    condicionIVAReceptor,
    alicuotasIVA: importeNeto > 0 && tipoComprobante !== 11
      ? [{ id: 5, baseImponible: importeNeto, importe: importeIVA }]
      : [],
  }
}

export async function requestCAE(
  datos: VoucherData,
  cuit?: number
): Promise<CAEResponse> {
  const afip = createAfipClient(cuit)

  const ultimo = await afip.ElectronicBilling.getLastVoucher(
    datos.puntoDeVenta,
    datos.tipoComprobante
  )
  const proximoNumero = ultimo + 1

  const fecha = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().split('T')[0]

  const respuesta = await afip.ElectronicBilling.createVoucher({
    CantReg:               1,
    PtoVta:                datos.puntoDeVenta,
    CbteTipo:              datos.tipoComprobante,
    Concepto:              datos.concepto,
    DocTipo:               datos.tipoDocReceptor,
    DocNro:                datos.nroDocReceptor,
    CbteDesde:             proximoNumero,
    CbteHasta:             proximoNumero,
    CbteFch:               parseInt(fecha.replace(/-/g, '')),
    ImpTotal:              datos.importeTotal,
    ImpTotConc:            0,
    ImpNeto:               datos.importeNeto,
    ImpOpEx:               0,
    ImpIVA:                datos.importeIVA,
    ImpTrib:               0,
    MonId:                 'PES',
    MonCotiz:              1,
    CondicionIVAReceptorId: datos.condicionIVAReceptor,
    Iva: datos.alicuotasIVA.map(iva => ({
      Id:      iva.id,
      BaseImp: iva.baseImponible,
      Importe: iva.importe,
    })),
  })

  return {
    CAE:           respuesta.CAE,
    CAEFchVto:     respuesta.CAEFchVto,
    voucherNumber: proximoNumero,
  }
}
