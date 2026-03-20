import { getDashboardStats } from "@/actions/dashboard"
import { getActiveCompanyId, getUserCompanies } from "@/actions/company"
import { createClient } from "@/lib/server"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, AlertTriangle, Receipt, Landmark,
  ArrowUpRight, ArrowDownRight, Plus, ScanLine, 
  History, Wallet, ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

/** 
 * Mini Componente para gráficos de tendencia (Sparkline SVG)
 */
function Sparkline({ data, color }: { data: number[], color: string }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 100
  const height = 30
  
  // Si todos los valores son iguales a 0 y el max es 1 por el fallback
  const isAllZero = data.every(v => v === 0)
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = isAllZero ? height / 2 : height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("w-20 h-8", color)}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export default async function DashboardPage() {
  const activeCompanyId = await getActiveCompanyId()
  const companies = await getUserCompanies()
  const activeCompany = companies.find(c => c.id === activeCompanyId)
  const stats = await getDashboardStats()

  const monthName = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  // Datos para sparklines
  const salesTendency = stats.ventas7Dias.map(d => d.total)
  const expensesTendency = stats.gastos7Dias.map(d => d.total)

  return (
    <div className="space-y-10 pb-10">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">
            Resumen <span className="text-emerald-500">General</span>
          </h1>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {activeCompany?.name} • {monthName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button className="h-12 bg-black dark:bg-white text-white dark:text-black px-6 rounded-2xl font-bold text-xs shadow-xl hover:scale-105 transition-all active:scale-95 group">
              <ScanLine className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              NUEVA VENTA
            </Button>
          </Link>
          <Link href="/expenses">
            <Button variant="outline" className="h-12 border-zinc-200 dark:border-zinc-800 px-6 rounded-2xl font-bold text-xs shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              REGISTRAR GASTO
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards — Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas hoy */}
        <div className="relative group bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-soft hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <Sparkline data={salesTendency} color="text-emerald-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ventas Hoy</p>
          <p className="text-3xl font-black tracking-tighter mt-1">
            ${stats.ventasHoy.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Ventas mes */}
        <div className="relative group bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-soft hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold">
              <ArrowUpRight className="w-3 h-3" />
              TENDENCIA
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ventas del Mes</p>
          <p className="text-3xl font-black tracking-tighter mt-1">
            ${stats.ventasMes.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Gastos mes */}
        <div className="relative group bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-soft hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <Sparkline data={expensesTendency} color="text-red-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Gastos del Mes</p>
          <p className="text-3xl font-black tracking-tighter mt-1">
            ${stats.gastosMes.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Balance Status */}
        <div className={cn(
          "relative group p-6 rounded-[2rem] border shadow-soft transition-all duration-300 overflow-hidden",
          stats.balanceMes >= 0 
            ? "bg-emerald-500/5 border-emerald-500/20" 
            : "bg-red-500/5 border-red-500/20"
        )}>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              stats.balanceMes >= 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            )}>
              {stats.balanceMes >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance Neto</p>
          </div>
          <p className="text-3xl font-black tracking-tighter mt-1 relative z-10">
            ${stats.balanceMes.toLocaleString('es-AR')}
          </p>
          {/* Abstract BG element */}
          <div className={cn(
            "absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20",
            stats.balanceMes >= 0 ? "bg-emerald-500" : "bg-red-500"
          )} />
        </div>
      </div>

      {/* Main Content: Stats & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-soft overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                  <History className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Actividad Reciente</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Últimas operaciones del sistema</p>
                </div>
              </div>
              <Link href="/sales" className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1 group">
                Historial Completo <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="p-4">
              <div className="space-y-1">
                {stats.ventasRecientes.length === 0 ? (
                  <div className="p-10 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest italic opacity-50">Sin actividad registrada</div>
                ) : stats.ventasRecientes.map((v: any) => (
                  <div key={v.id} className="p-4 flex items-center justify-between rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-all">
                        <ShoppingCart className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Venta #{v.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                          {new Date(v.created_at).toLocaleDateString()} • {v.payment_method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+${Number(v.grand_total).toLocaleString('es-AR')}</p>
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full text-emerald-600 dark:text-emerald-400 font-black">COMPLETADA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Secundary KPIs */}
        <div className="space-y-8">
          {/* Stock Alerts Card */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-soft">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Inventario</p>
            </div>
            
            <h3 className="text-2xl font-black tracking-tighter mb-2 italic">Alertas de Stock</h3>
            <p className="text-sm text-zinc-500 mb-8">Tenés <span className="text-amber-600 font-bold">{stats.productosStockBajo}</span> productos por debajo del límite mínimo.</p>
            
            <Link href="/products?filter=low-stock">
              <Button className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                GESTIONAR STOCK
              </Button>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="bg-zinc-900 dark:bg-zinc-100 p-8 rounded-[2.5rem] text-white dark:text-black shadow-2xl relative overflow-hidden transition-transform hover:scale-[1.02]">
             <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-black/10 flex items-center justify-center mb-6">
                  <Wallet className="w-5 h-5 font-bold" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Giro Comercial Mes</p>
                <p className="text-4xl font-black tracking-tighter mt-1">
                  ${(stats.ventasMes + stats.comprasMes).toLocaleString('es-AR')}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Actividad de Fondos</p>
                </div>
             </div>
             {/* Dynamic Decoration */}
             <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-blue-500/30 blur-[60px] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
