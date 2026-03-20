"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

// ============================================================
// CRUD DE GASTOS OPERATIVOS
// Categorías: alquiler, servicios, sueldos, mantenimiento,
// publicidad, impuestos, transporte, insumos, otros
// ============================================================

/** Listar gastos de la empresa activa (últimos 100) */
export async function getExpenses() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*, supplier:suppliers(name)')
    .eq('company_id', activeCompanyId)
    .order('expense_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching expenses:", error)
    return []
  }
  return data
}

/** Crear un gasto */
export async function createExpense(formData: FormData) {
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

  const amount = parseFloat(formData.get('amount') as string)
  const taxRate = parseFloat(formData.get('tax_rate') as string) || 0
  const taxAmount = amount * (taxRate / 100)

  const { error } = await supabase
    .from('expenses')
    .insert({
      company_id: activeCompanyId,
      member_id: member?.id || null,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      amount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      expense_date: (formData.get('expense_date') as string) || new Date().toISOString().split('T')[0],
      payment_method: (formData.get('payment_method') as string) || null,
      receipt_number: (formData.get('receipt_number') as string) || null,
      supplier_id: (formData.get('supplier_id') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })

  if (error) throw new Error(error.message)

  revalidatePath('/expenses')
  return { success: true }
}

/** Eliminar un gasto */
export async function deleteExpense(expenseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) throw new Error(error.message)

  revalidatePath('/expenses')
  return { success: true }
}
