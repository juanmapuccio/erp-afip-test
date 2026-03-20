"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

export async function getProducts() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq('company_id', activeCompanyId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const category_id = formData.get('category_id') as string || null
  const sku = formData.get('sku') as string || null
  const description = formData.get('description') as string || null
  const price = parseFloat(formData.get('price') as string) || 0
  const cost_price = parseFloat(formData.get('cost_price') as string) || 0
  const stock_quantity = parseInt(formData.get('stock_quantity') as string) || 0
  const min_stock = parseInt(formData.get('min_stock') as string) || 0

  const activeCompanyId = await getActiveCompanyId()
  if (!name || !activeCompanyId) throw new Error("Missing required data")

  const supabase = await createClient()
  
  // Create product
  const { data: product, error } = await supabase
    .from('products')
    .insert([{
      company_id: activeCompanyId,
      name,
      category_id,
      sku,
      description,
      price,
      cost_price,
      stock_quantity,
      min_stock
    }])
    .select()
    .single()

  if (error || !product) throw new Error(error?.message || "Failed to create product")
  
  // If initial stock > 0, we create an initial movement
  if (stock_quantity > 0) {
    await supabase.from('inventory_movements').insert([{
      company_id: activeCompanyId,
      product_id: product.id,
      movement_type: 'in',
      quantity: stock_quantity,
      stock_after: stock_quantity,
      notes: 'Initial stock on creation'
    }])
  }
  
  revalidatePath('/products')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  // Logic soft deletion
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/products')
  return { success: true }
}
