"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

// ============================================================
// CRUD DE COMPRAS
// Una compra tiene N items (purchase_items).
// Cada compra puede estar vinculada a un proveedor y entidad legal.
// Al confirmar, se generan movimientos de inventario (entrada).
// ============================================================

/** Listar compras de la empresa activa (últimas 100) */
export async function getPurchases() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(name)')
    .eq('company_id', activeCompanyId)
    .order('purchase_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching purchases:", error)
    return []
  }
  return data
}

/** Crear una compra con sus items */
export async function createPurchase(purchaseData: {
  supplier_id?: string
  invoice_type?: string
  invoice_number?: string
  purchase_date?: string
  payment_method?: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    unit_cost: number
    tax_rate: number
  }[]
}) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No hay empresa activa")

  const supabase = await createClient()

  // Obtener member_id del usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: member } = await supabase
    .from('company_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', activeCompanyId)
    .single()

  // Calcular totales
  let subtotal = 0
  let taxTotal = 0
  const processedItems = purchaseData.items.map(item => {
    const lineSubtotal = item.quantity * item.unit_cost
    const taxAmount = lineSubtotal * (item.tax_rate / 100)
    const lineTotal = lineSubtotal + taxAmount
    subtotal += lineSubtotal
    taxTotal += taxAmount
    return {
      product_id: item.product_id,
      company_id: activeCompanyId,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      tax_rate: item.tax_rate,
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      line_total: parseFloat(lineTotal.toFixed(2)),
    }
  })

  const grandTotal = subtotal + taxTotal

  // Insertar la compra
  const { data: purchase, error } = await supabase
    .from('purchases')
    .insert({
      company_id: activeCompanyId,
      member_id: member?.id || null,
      supplier_id: purchaseData.supplier_id || null,
      invoice_type: purchaseData.invoice_type || null,
      invoice_number: purchaseData.invoice_number || null,
      purchase_date: purchaseData.purchase_date || new Date().toISOString().split('T')[0],
      payment_method: purchaseData.payment_method || null,
      notes: purchaseData.notes || null,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_total: parseFloat(taxTotal.toFixed(2)),
      discount_total: 0,
      grand_total: parseFloat(grandTotal.toFixed(2)),
      status: 'paid',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Insertar items
  const itemsWithPurchaseId = processedItems.map(item => ({
    ...item,
    purchase_id: purchase.id,
  }))

  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(itemsWithPurchaseId)

  if (itemsError) throw new Error(itemsError.message)

  // Actualizar stock de cada producto y generar movimientos de inventario
  for (const item of purchaseData.items) {
    // Leer stock actual (columna real: stock_quantity)
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    if (product) {
      const newStock = product.stock_quantity + item.quantity

      // Actualizar stock del producto
      await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', item.product_id)

      // Registrar movimiento de inventario
      // movement_type es enum: 'in' | 'out'
      // stock_after es obligatorio
      await supabase.from('inventory_movements').insert({
        product_id: item.product_id,
        company_id: activeCompanyId,
        movement_type: 'in',
        quantity: item.quantity,
        stock_after: newStock,
        notes: `Compra #${purchase.invoice_number || purchase.id.slice(0, 8)}`,
        purchase_id: purchase.id,
      })
    }
  }

  revalidatePath('/purchases')
  revalidatePath('/products')
  return { success: true, purchaseId: purchase.id }
}

/** Cancelar una compra (no elimina, cambia status) */
export async function cancelPurchase(purchaseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'cancelled' })
    .eq('id', purchaseId)

  if (error) throw new Error(error.message)

  revalidatePath('/purchases')
  return { success: true }
}
