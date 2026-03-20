"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

export type CartItem = {
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export async function createSale(
  totalAmount: number, 
  paymentMethod: string, 
  items: CartItem[],
  legalEntityId?: string | null,
  invoiceType: string = 'B'
) {
  if (!items.length) {
    throw new Error("El carrito está vacío")
  }

  const supabase = await createClient()

  // Mapear los items asegurando los tipos correctos para el JSONB
  const payloadItems = items.map(item => ({
    product_id: item.product_id,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    subtotal: Number(item.subtotal)
  }))

  const { data: saleId, error } = await supabase
    .rpc('process_sale', {
      p_total_amount: totalAmount,
      p_payment_method: paymentMethod,
      p_items: payloadItems,
      p_legal_entity_id: legalEntityId,
      p_invoice_type: invoiceType
    })

  if (error) {
    console.error("Error creating sale:", error)
    throw new Error(error.message || "Error al procesar la venta")
  }

  // Reload cache for sales, products (stock changed), and dashboard
  revalidatePath('/sales')
  revalidatePath('/products')
  revalidatePath('/')

  return { success: true, saleId }
}

export async function getSales() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        product:products(name)
      )
    `)
    .eq('company_id', activeCompanyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching sales:", error)
    return []
  }

  return data
}
