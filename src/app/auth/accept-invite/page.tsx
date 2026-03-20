"use client"

import React, { useState, useTransition, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { acceptInvitation } from "@/actions/invitations"
import { setActiveCompany } from "@/actions/company"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Loader2 } from "lucide-react"

/**
 * Wrapper con Suspense: Next.js requiere que useSearchParams()
 * esté dentro de un <Suspense> boundary para build estático.
 */
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 font-medium">Token de invitación no encontrado.</p>
            <a href="/login" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white mt-4 inline-block">
              Ir al Login →
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAccept = () => {
    setError("")
    startTransition(async () => {
      try {
        const result = await acceptInvitation(token, password || undefined)
        if (result.success && result.companyId) {
          await setActiveCompany(result.companyId, false)
          setSuccess(true)
          setTimeout(() => router.push('/'), 1500)
        }
      } catch (e: any) {
        setError(e.message || "Error al aceptar la invitación")
      }
    })
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <div className="mx-auto bg-emerald-500 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold">¡Invitación aceptada!</p>
            <p className="text-zinc-500">Redirigiendo al dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="max-w-md w-full shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="mx-auto bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-xl flex items-center justify-center font-black mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Aceptar Invitación</CardTitle>
          <CardDescription>Te han invitado a unirte a una empresa.</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Creá tu contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-zinc-400">Se creará tu cuenta con el email de la invitación.</p>
          </div>

          <Button
            onClick={handleAccept}
            disabled={isPending || password.length < 6}
            className="w-full h-11 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</> : "Aceptar y Unirme"}
          </Button>

          <div className="text-center">
            <a href="/login" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition">
              ← Volver al Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
