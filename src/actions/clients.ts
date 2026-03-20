"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

// ============================================================
// CRUD DE CLIENTES
// Cada cliente pertenece a una empresa (company_id).
// RLS en Supabase garantiza aislamiento por empresa.
// ============================================================

/** Listar todos los clientes activos de la empresa activa */
export async function getClients() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', activeCompanyId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching clients:", error)
    return []
  }
  return data
}

/** Obtener un cliente por ID */
export async function getClient(clientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Crear un cliente nuevo */
export async function createClient2(formData: FormData) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No hay empresa activa")

  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .insert({
      company_id: activeCompanyId,
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      cuit: (formData.get('cuit') as string) || null,
      razon_social: (formData.get('razon_social') as string) || null,
      domicilio: (formData.get('domicilio') as string) || null,
      ciudad: (formData.get('ciudad') as string) || null,
      provincia: (formData.get('provincia') as string) || null,
      tax_condition: (formData.get('tax_condition') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })

  if (error) {
    if (error.code === '23505') throw new Error("Ya existe un cliente con ese CUIT en esta empresa")
    throw new Error(error.message)
  }

  revalidatePath('/clients')
  return { success: true }
}

/** Actualizar un cliente existente */
export async function updateClient(clientId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      cuit: (formData.get('cuit') as string) || null,
      razon_social: (formData.get('razon_social') as string) || null,
      domicilio: (formData.get('domicilio') as string) || null,
      ciudad: (formData.get('ciudad') as string) || null,
      provincia: (formData.get('provincia') as string) || null,
      tax_condition: (formData.get('tax_condition') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', clientId)

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  return { success: true }
}

/** Desactivar un cliente (soft delete) */
export async function deactivateClient(clientId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', clientId)

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  return { success: true }
}
