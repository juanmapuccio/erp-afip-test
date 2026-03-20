"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signout } from "@/actions/auth"
import { useWorkspace } from "@/store/use-workspace"
import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Tags,
  Settings,
  ReceiptText,
  Users,
  Truck,
  Receipt,
  ShoppingBag,
  Landmark,
  BookOpen,
  LogOut,
  Building,
  ChevronDown,
  Circle,
  ShieldCheck,
  User,
} from "lucide-react"

/**
 * Rutas de navegación principal.
 */
const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", color: "text-sky-500" },
  { label: "Punto de Venta", icon: ShoppingCart, href: "/pos", color: "text-emerald-500" },
  { label: "Facturación", icon: ReceiptText, href: "/sales", color: "text-orange-500" },
  { label: "Productos", icon: PackageSearch, href: "/products", color: "text-pink-500" },
  { label: "Categorías", icon: Tags, href: "/categories", color: "text-purple-500" },
  { label: "Clientes", icon: Users, href: "/clients", color: "text-blue-500" },
  { label: "Proveedores", icon: Truck, href: "/suppliers", color: "text-amber-500" },
  { label: "Gastos", icon: Receipt, href: "/expenses", color: "text-red-500" },
  { label: "Compras", icon: ShoppingBag, href: "/purchases", color: "text-indigo-500" },
  { label: "Impuestos", icon: Landmark, href: "/taxes", color: "text-violet-500" },
  { label: "Contabilidad", icon: BookOpen, href: "/accounting", color: "text-amber-500" },
  { label: "Configuración", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { activeCompanyId, activeLegalEntityId, initializeFromCookie } = useWorkspace()
  const [estaCargado, setEstaCargado] = useState(false)

  useEffect(() => {
    initializeFromCookie()
    setEstaCargado(true)
  }, [initializeFromCookie])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 w-64 shadow-sm">
      {/* Header - Brand & Company Selector */}
      <div className="px-6 py-6 border-b border-zinc-100 dark:border-zinc-900">
        <Link href="/" className="flex items-center gap-2 mb-6 group">
          <div className="bg-black dark:bg-white text-white dark:text-black w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
            NS
          </div>
          <h2 className="text-xl font-black tracking-tighter">
            Nodo<span className="text-emerald-500">Sur</span>
          </h2>
        </Link>

        {/* Multi-tenancy Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Contexto Activo</span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          
          <button className="w-full flex items-center gap-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              <Building className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-xs font-bold truncate dark:text-zinc-200">
                {estaCargado ? (activeCompanyId ? `Empresa ID: ${activeCompanyId.slice(0,8)}` : "Sin Empresa") : "Cargando..."}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium truncate">
                {activeLegalEntityId ? `CUIT: ${activeLegalEntityId}` : "Seleccionar CUIT"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <nav className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.href
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white shadow-soft font-bold" 
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 font-medium"
                )}
              >
                <route.icon className={cn(
                  "h-5 w-5 transition-colors", 
                  isActive ? route.color : "text-zinc-400 group-hover:text-zinc-600"
                )} />
                <span className="text-sm">{route.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer - User & Sign Out */}
      <div className="p-4 mt-auto border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-zinc-900">
              <User className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate dark:text-zinc-200 uppercase tracking-tighter">Mi Cuenta</p>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] text-zinc-400 font-bold truncate">ADMINISTRADOR</p>
            </div>
          </div>
        </div>

        <form action={signout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </div>
  )
}
