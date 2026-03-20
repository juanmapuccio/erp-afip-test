"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

// ============================================================
// CRUD DE PROVEEDORES
// Misma estructura que clientes pero sin consumidor_final.
// ============================================================

/** Listar todos los proveedores activos */
export async function getSuppliers() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', activeCompanyId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching suppliers:", error)
    return []
  }
  return data
}

/** Crear un proveedor nuevo */
export async function createSupplier(formData: FormData) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No hay empresa activa")

  const supabase = await createClient()

  const { error } = await supabase
    .from('suppliers')
    .insert({
      company_id: activeCompanyId,
      name: formData.get('name') as string,
      razon_social: (formData.get('razon_social') as string) || null,
      cuit: (formData.get('cuit') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      domicilio: (formData.get('domicilio') as string) || null,
      ciudad: (formData.get('ciudad') as string) || null,
      provincia: (formData.get('provincia') as string) || null,
      tax_condition: (formData.get('tax_condition') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })

  if (error) {
    if (error.code === '23505') throw new Error("Ya existe un proveedor con ese CUIT en esta empresa")
    throw new Error(error.message)
  }

  revalidatePath('/suppliers')
  return { success: true }
}

/** Actualizar un proveedor */
export async function updateSupplier(supplierId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('suppliers')
    .update({
      name: formData.get('name') as string,
      razon_social: (formData.get('razon_social') as string) || null,
      cuit: (formData.get('cuit') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      domicilio: (formData.get('domicilio') as string) || null,
      ciudad: (formData.get('ciudad') as string) || null,
      provincia: (formData.get('provincia') as string) || null,
      tax_condition: (formData.get('tax_condition') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', supplierId)

  if (error) throw new Error(error.message)

  revalidatePath('/suppliers')
  return { success: true }
}

/** Desactivar un proveedor (soft delete) */
export async function deactivateSupplier(supplierId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', supplierId)

  if (error) throw new Error(error.message)

  revalidatePath('/suppliers')
  return { success: true }
}
