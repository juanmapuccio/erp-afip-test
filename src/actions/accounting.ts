"use server"

import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

// ============================================================
// LIBRO DIARIO (Journal Entries)
// Cada operación contable genera un asiento con N líneas.
// Debe = Haber siempre (partida doble).
// Los asientos se crean automáticamente via triggers de ventas/gastos.
// ============================================================

/** Listar asientos contables con sus líneas y cuentas */
export async function getJournalEntries(filters?: {
  from?: string
  to?: string
  referenceType?: string
}) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()

  let query = supabase
    .from('journal_entries')
    .select(`
      id, entry_date, description, reference_type, reference_id, created_at,
      legal_entity:legal_entities(razon_social),
      lines:journal_entry_lines(
        id, debit, credit, description,
        account:accounts(code, name, account_type)
      )
    `)
    .eq('company_id', activeCompanyId)
    .order('entry_date', { ascending: false })
    .limit(100)

  // Filtros opcionales
  if (filters?.from) {
    query = query.gte('entry_date', filters.from)
  }
  if (filters?.to) {
    query = query.lte('entry_date', filters.to)
  }
  if (filters?.referenceType) {
    query = query.eq('reference_type', filters.referenceType)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching journal entries:", error)
    return []
  }

  return data
}

/** Obtener el plan de cuentas de la empresa */
export async function getChartOfAccounts() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('id, code, name, account_type, is_active')
    .eq('company_id', activeCompanyId)
    .eq('is_active', true)
    .order('code')

  if (error) {
    console.error("Error fetching accounts:", error)
    return []
  }
  return data
}

/** Resumen de sumas y saldos por cuenta */
export async function getTrialBalance() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('journal_entry_lines')
    .select('debit, credit, account:accounts(code, name, account_type)')
    .eq('company_id', activeCompanyId)

  if (error) {
    console.error("Error fetching trial balance:", error)
    return []
  }

  // Agrupar por cuenta
  const accountMap = new Map<string, {
    code: string; name: string; type: string;
    totalDebit: number; totalCredit: number
  }>()

  for (const line of (data || [])) {
    const acc = line.account as any
    if (!acc) continue
    const key = acc.code
    const existing = accountMap.get(key) || {
      code: acc.code, name: acc.name, type: acc.account_type,
      totalDebit: 0, totalCredit: 0
    }
    existing.totalDebit += Number(line.debit)
    existing.totalCredit += Number(line.credit)
    accountMap.set(key, existing)
  }

  return Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code))
}
