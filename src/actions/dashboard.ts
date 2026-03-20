"use server"

import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

// ============================================================
// ESTADÍSTICAS DEL DASHBOARD
// Reúne datos de ventas, gastos, compras, stock y 
// actividad reciente para mostrar en la pantalla principal.
// ============================================================

export type DashboardStats = {
  ventasHoy: number
  ventasMes: number
  gastosHoy: number
  gastosMes: number
  comprasMes: number
  impuestosMes: number
  balanceMes: number
  totalProductos: number
  productosStockBajo: number
  ventasRecientes: any[]
  gastosRecientes: any[]
  ventas7Dias: { fecha: string; total: number }[]
  gastos7Dias: { fecha: string; total: number }[]
}

/** Obtener todas las métricas del dashboard */
export async function getDashboardStats(): Promise<DashboardStats> {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) {
    return emptyStats()
  }

  const supabase = await createClient()
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  
  // Fecha de hace 7 días para tendencias
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  // --- Ventas del día ---
  const { data: salesToday } = await supabase
    .from('sales')
    .select('grand_total')
    .eq('company_id', activeCompanyId)
    .neq('status', 'cancelled')
    .gte('created_at', todayStr + 'T00:00:00')

  const ventasHoy = (salesToday || []).reduce((sum, s) => sum + Number(s.grand_total), 0)

  // --- Ventas del mes ---
  const { data: salesMonth } = await supabase
    .from('sales')
    .select('grand_total')
    .eq('company_id', activeCompanyId)
    .neq('status', 'cancelled')
    .gte('created_at', firstOfMonth + 'T00:00:00')

  const ventasMes = (salesMonth || []).reduce((sum, s) => sum + Number(s.grand_total), 0)

  // --- Tendencia 7 días (Ventas) ---
  const { data: salesHistory } = await supabase
    .from('sales')
    .select('grand_total, created_at')
    .eq('company_id', activeCompanyId)
    .neq('status', 'cancelled')
    .gte('created_at', sevenDaysAgoStr + 'T00:00:00')

  const ventas7Dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dStr = d.toISOString().split('T')[0]
    const total = (salesHistory || [])
      .filter(s => s.created_at.startsWith(dStr))
      .reduce((sum, s) => sum + Number(s.grand_total), 0)
    return { fecha: dStr, total }
  })

  // --- Gastos del día y mes ---
  const { data: expensesMonth } = await supabase
    .from('expenses')
    .select('amount, tax_amount, expense_date')
    .eq('company_id', activeCompanyId)
    .gte('expense_date', sevenDaysAgoStr) // Pedimos desde hace 7 días para cubrir todo

  const gastosHoy = (expensesMonth || [])
    .filter(e => e.expense_date === todayStr)
    .reduce((sum, e) => sum + Number(e.amount) + Number(e.tax_amount), 0)

  const gastosMes = (expensesMonth || [])
    .filter(e => e.expense_date >= firstOfMonth)
    .reduce((sum, e) => sum + Number(e.amount) + Number(e.tax_amount), 0)

  const gastos7Dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dStr = d.toISOString().split('T')[0]
    const total = (expensesMonth || [])
      .filter(e => e.expense_date === dStr)
      .reduce((sum, e) => sum + Number(e.amount) + Number(e.tax_amount), 0)
    return { fecha: dStr, total }
  })

  // --- Compras del mes ---
  const { data: purchasesMonth } = await supabase
    .from('purchases')
    .select('grand_total')
    .eq('company_id', activeCompanyId)
    .neq('status', 'cancelled')
    .gte('purchase_date', firstOfMonth)

  const comprasMes = (purchasesMonth || []).reduce((sum, p) => sum + Number(p.grand_total), 0)

  // --- Impuestos del mes ---
  const { data: taxesMonth } = await supabase
    .from('tax_payments')
    .select('amount')
    .eq('company_id', activeCompanyId)
    .gte('payment_date', firstOfMonth)

  const impuestosMes = (taxesMonth || []).reduce((sum, t) => sum + Number(t.amount), 0)

  // --- Productos y stock bajo ---
  const { data: products } = await supabase
    .from('products')
    .select('id, stock_quantity, min_stock')
    .eq('company_id', activeCompanyId)
    .eq('is_active', true)

  const totalProductos = products?.length || 0
  const productosStockBajo = (products || []).filter(p => p.stock_quantity <= p.min_stock).length

  // --- Últimas 5 ventas ---
  const { data: ventasRecientes } = await supabase
    .from('sales')
    .select('id, grand_total, payment_method, status, created_at')
    .eq('company_id', activeCompanyId)
    .order('created_at', { ascending: false })
    .limit(5)

  // --- Últimos 5 gastos ---
  const { data: gastosRecientes } = await supabase
    .from('expenses')
    .select('id, description, category, amount, tax_amount, expense_date')
    .eq('company_id', activeCompanyId)
    .order('expense_date', { ascending: false })
    .limit(5)

  const balanceMes = ventasMes - gastosMes - comprasMes - impuestosMes

  return {
    ventasHoy,
    ventasMes,
    gastosHoy,
    gastosMes,
    comprasMes,
    impuestosMes,
    balanceMes,
    totalProductos,
    productosStockBajo,
    ventasRecientes: ventasRecientes || [],
    gastosRecientes: gastosRecientes || [],
    ventas7Dias,
    gastos7Dias,
  }
}

function emptyStats(): DashboardStats {
  return {
    ventasHoy: 0, ventasMes: 0, gastosHoy: 0, gastosMes: 0,
    comprasMes: 0, impuestosMes: 0, balanceMes: 0,
    totalProductos: 0, productosStockBajo: 0,
    ventasRecientes: [], gastosRecientes: [],
    ventas7Dias: [], gastos7Dias: [],
  }
}
