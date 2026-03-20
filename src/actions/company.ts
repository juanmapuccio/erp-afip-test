"use server"

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { validateCuit } from '@/lib/utils'

export async function getUserCompanies(): Promise<{id: string, name: string}[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('company_members')
    .select('company:companies(*)')
    .eq('user_id', user.id)

  if (error) {
    console.error("Error fetching companies:", error)
    return []
  }

  return data.map(member => member.company as any)
}

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string
  const razon_social = formData.get('razon_social') as string || null
  const cuit = formData.get('cuit') as string || null
  const domicilio = formData.get('domicilio') as string || null
  const ciudad = formData.get('ciudad') as string || null
  const provincia = formData.get('provincia') as string || null
  const codigo_postal = formData.get('codigo_postal') as string || null
  const tax_condition = formData.get('tax_condition') as string || 'monotributista'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Validate CUIT if provided
  if (cuit && !validateCuit(cuit)) {
    throw new Error("CUIT inválido. Verificá el formato XX-XXXXXXXX-X.")
  }

  // Call the secure RPC function (now accepts optional fiscal params)
  const rpcParams: Record<string, any> = { company_name: name }
  if (razon_social && cuit) {
    rpcParams.p_razon_social = razon_social
    rpcParams.p_cuit = cuit.replace(/-/g, '')
    rpcParams.p_domicilio = domicilio
    rpcParams.p_ciudad = ciudad
    rpcParams.p_provincia = provincia
    rpcParams.p_codigo_postal = codigo_postal
    rpcParams.p_tax_condition = tax_condition
  }

  const { data: companyId, error: rpcError } = await supabase
    .rpc('create_new_company', rpcParams)

  if (rpcError || !companyId) {
    throw new Error(rpcError?.message || "Error creating company")
  }

  // Sembrar plan de cuentas básico argentino para la empresa nueva
  // Esto permite que los triggers de asientos contables funcionen
  await supabase.rpc('seed_chart_of_accounts', { p_company_id: companyId })

  // Set the newly created company as the active one
  await setActiveCompany(companyId as string, false)
  return { success: true }
}

export async function setActiveCompany(companyId: string, shouldRedirect = true) {
  const cookieStore = await cookies()
  cookieStore.set('nodosur_active_company_id', companyId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  
  revalidatePath('/', 'layout')
  if (shouldRedirect) {
    redirect('/')
  }
}

/** Lee la cookie de empresa activa */
export async function getActiveCompanyId() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('nodosur_active_company_id')
  return cookie?.value || null
}

// ============================================================
// ENTIDAD LEGAL ACTIVA (CUIT en sesión)
// ============================================================

/**
 * Setea la entidad legal (CUIT) activa en cookie.
 * Se usa tanto al login (auto-select) como al cambiar con Ctrl+L.
 */
export async function setActiveLegalEntity(legalEntityId: string) {
  const cookieStore = await cookies()
  cookieStore.set('nodosur_active_legal_entity_id', legalEntityId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  })
  revalidatePath('/', 'layout')
}

/** Lee la cookie de entidad legal (CUIT) activa */
export async function getActiveLegalEntityId() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('nodosur_active_legal_entity_id')
  return cookie?.value || null
}

// ============================================================
// CRUD DE ENTIDADES LEGALES (razones sociales / CUITs)
// ============================================================

export async function getLegalEntities() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('legal_entities')
    .select('*')
    .eq('company_id', activeCompanyId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })

  if (error) {
    console.error("Error fetching legal entities:", error)
    return []
  }
  return data
}

export async function createLegalEntity(formData: FormData) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No active company")

  const razon_social = formData.get('razon_social') as string
  const cuit = formData.get('cuit') as string
  const domicilio = formData.get('domicilio') as string || null
  const ciudad = formData.get('ciudad') as string || null
  const provincia = formData.get('provincia') as string || null
  const codigo_postal = formData.get('codigo_postal') as string || null
  const tax_condition = formData.get('tax_condition') as string

  if (!razon_social || !cuit || !tax_condition) {
    throw new Error("Razón social, CUIT y condición IVA son obligatorios")
  }
  if (!validateCuit(cuit)) {
    throw new Error("CUIT inválido. Verificá el formato XX-XXXXXXXX-X.")
  }

  const supabase = await createClient()

  // Check if this is the first entity (make it default)
  const { count } = await supabase
    .from('legal_entities')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', activeCompanyId)
    .eq('is_active', true)

  const isFirst = (count ?? 0) === 0

  const { error } = await supabase
    .from('legal_entities')
    .insert({
      company_id: activeCompanyId,
      razon_social,
      cuit: cuit.replace(/-/g, ''),
      domicilio,
      ciudad,
      provincia,
      codigo_postal,
      tax_condition,
      is_default: isFirst
    })

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  return { success: true }
}

export async function setDefaultLegalEntity(legalEntityId: string) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No active company")

  const supabase = await createClient()

  // Remove current default
  await supabase
    .from('legal_entities')
    .update({ is_default: false })
    .eq('company_id', activeCompanyId)
    .eq('is_default', true)

  // Set new default
  const { error } = await supabase
    .from('legal_entities')
    .update({ is_default: true })
    .eq('id', legalEntityId)
    .eq('company_id', activeCompanyId)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  return { success: true }
}

export async function deactivateLegalEntity(legalEntityId: string) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No active company")

  const supabase = await createClient()
  const { error } = await supabase
    .from('legal_entities')
    .update({ is_active: false, is_default: false })
    .eq('id', legalEntityId)
    .eq('company_id', activeCompanyId)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  return { success: true }
}
