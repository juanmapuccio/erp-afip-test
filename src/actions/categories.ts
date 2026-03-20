"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

export async function getCategories() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', activeCompanyId)
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data
}

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  const activeCompanyId = await getActiveCompanyId()
  
  if (!name || !activeCompanyId) throw new Error("Missing data")

  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .insert([{ 
      name,
      company_id: activeCompanyId 
    }])

  if (error) throw new Error(error.message)
  
  revalidatePath('/categories')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/categories')
  return { success: true }
}
