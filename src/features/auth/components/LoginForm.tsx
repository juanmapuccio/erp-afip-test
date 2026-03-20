"use client"

import { useState } from "react"
import { login } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Building, Key, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function LoginForm({ error, message }: { error?: string; message?: string }) {
  const [loginType, setLoginType] = useState<'email' | 'employee'>('email')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsPending(true)
    // El formAction del botón se encargará de llamar a la Server Action
  }

  return (
    <Card className="w-full shadow-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <CardHeader className="space-y-1 text-center pb-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 relative">
        <div className="mx-auto bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl mb-4 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          NS
        </div>
        <CardTitle className="text-3xl font-black tracking-tighter">Nodo Sur ERP</CardTitle>
        <CardDescription className="text-zinc-500 font-medium">
          Accede a la gestión operativa de tu empresa
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-8">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-8">
          <button
            onClick={() => setLoginType('email')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all",
              loginType === 'email' 
                ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Mail className="w-4 h-4" />
            Administrador
          </button>
          <button
            onClick={() => setLoginType('employee')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all",
              loginType === 'employee' 
                ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <User className="w-4 h-4" />
            Empleado
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/50 font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        {message === 'check-email' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl text-sm mb-6 border border-emerald-200 dark:border-emerald-900/50 font-medium text-center shadow-inner">
            ✉️ Revisá tu bandeja de entrada para confirmar tu cuenta.
          </div>
        )}

        <form action={login} onSubmit={handleSubmit} className="space-y-6">
          {loginType === 'email' ? (
            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="admin@empresa.com" 
                  required 
                  className="h-12 pl-11 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-black dark:focus-visible:ring-white transition-all"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 group">
                <Label htmlFor="companyId" className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">ID de Empresa / CUIT</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-5 h-5 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  <Input 
                    id="companyId" 
                    name="companyId" 
                    type="text" 
                    placeholder="8 caracteres o CUIT" 
                    required 
                    className="h-12 pl-11 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-black dark:focus-visible:ring-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Usuario de Empleado</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  <Input 
                    id="username" 
                    name="username" 
                    type="text" 
                    placeholder="ej: jdoe" 
                    required 
                    className="h-12 pl-11 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-black dark:focus-visible:ring-white transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2 group">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Contraseña</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-5 h-5 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••"
                required 
                className="h-12 pl-11 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-black dark:focus-visible:ring-white transition-all"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full h-12 font-bold text-base bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xl rounded-xl transition-all active:scale-[0.98] mt-4"
          >
            {isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Accediendo...</>
            ) : (
              "Ingresar al Sistema"
            )}
          </Button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <Link 
            href="/register" 
            className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition group"
          >
            <span>¿Sos nuevo? Registra tu empresa</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <div className="flex justify-center gap-4">
            <Link 
              href="/auth/accept-invite" 
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition underline underline-offset-4"
            >
              Invitación recibida
            </Link>
            <span className="text-zinc-200 dark:text-zinc-800">|</span>
            <Link 
              href="#" 
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            >
              Soporte IT
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
