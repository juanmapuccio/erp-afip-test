export type TipoComprobante   = 1 | 6 | 11
export type TipoDocumento     = 80 | 86 | 96 | 99
export type IdAlicuotaIVA     = 3 | 4 | 5 | 6
export type CondicionIVA      = 1 | 4 | 5 | 6 | 13
export type LetraComprobante  = 'A' | 'B' | 'C'

export interface VoucherData {
  puntoDeVenta:         number
  tipoComprobante:      TipoComprobante
  concepto:             1 | 2 | 3
  tipoDocReceptor:      TipoDocumento
  nroDocReceptor:       number
  importeTotal:         number
  importeNeto:          number
  importeIVA:           number
  condicionIVAReceptor: CondicionIVA
  alicuotasIVA: Array<{
    id:            IdAlicuotaIVA
    baseImponible: number
    importe:       number
  }>
}

export interface CAEResponse {
  CAE:           string
  CAEFchVto:     string  // yyyy-mm-dd
  voucherNumber: number
}

export interface SaleCAEResult {
  success:       boolean
  invoiceNumber: string  // formato PPPP-NNNNNNNN
  invoiceType:   LetraComprobante
  cae:           string
  caeDueDate:    string
}
