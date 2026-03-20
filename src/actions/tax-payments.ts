"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

// ============================================================
// CRUD DE PAGOS IMPOSITIVOS
// Registra pagos a AFIP: IVA, ganancias, IIBB, monotributo, etc.
// Cada pago está asociado a un período fiscal (YYYYMM).
// ============================================================

/** Listar pagos de impuestos de la empresa activa */
export async function getTaxPayments() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tax_payments')
    .select('*, legal_entity:legal_entities(razon_social, cuit)')
    .eq('company_id', activeCompanyId)
    .order('payment_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching tax payments:", error)
    return []
  }
  return data
}

/** Crear un pago de impuesto */
export async function createTaxPayment(formData: FormData) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No hay empresa activa")

  const supabase = await createClient()

  const { error } = await supabase
    .from('tax_payments')
    .insert({
      company_id: activeCompanyId,
      legal_entity_id: (formData.get('legal_entity_id') as string) || null,
      tax_type: formData.get('tax_type') as string,
      tax_period: formData.get('tax_period') as string,
      amount: parseFloat(formData.get('amount') as string),
      payment_date: (formData.get('payment_date') as string) || new Date().toISOString().split('T')[0],
      receipt_number: (formData.get('receipt_number') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })

  if (error) throw new Error(error.message)

  revalidatePath('/taxes')
  return { success: true }
}

/** Eliminar un pago de impuesto */
export async function deleteTaxPayment(paymentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tax_payments')
    .delete()
    .eq('id', paymentId)

  if (error) throw new Error(error.message)

  revalidatePath('/taxes')
  return { success: true }
}
