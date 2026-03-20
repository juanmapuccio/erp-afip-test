"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signup } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, ArrowLeft, ArrowRight, Check, User, FileText, Key } from "lucide-react"
import Link from "next/link"
import { validateCuit, formatCuit } from "@/lib/utils"

const TAX_CONDITIONS = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'exento', label: 'Exento' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
  { value: 'no_responsable', label: 'No Responsable' },
]

const STEPS = [
  { title: 'Tu Cuenta', icon: User, description: 'Datos de acceso' },
  { title: 'Tu Empresa', icon: Building2, description: 'Nombre comercial' },
  { title: 'Datos Fiscales', icon: FileText, description: 'Razón social y CUIT' },
]

export default function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Step 1
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [devKey, setDevKey] = useState("")

  // Step 2
  const [companyName, setCompanyName] = useState("")

  // Step 3
  const [razonSocial, setRazonSocial] = useState("")
  const [cuit, setCuit] = useState("")
  const [cuitValid, setCuitValid] = useState<boolean | null>(null)
  const [domicilio, setDomicilio] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [provincia, setProvincia] = useState("")
  const [codigoPostal, setCodigoPostal] = useState("")
  const [taxCondition, setTaxCondition] = useState("monotributista")

  const handleCuitChange = (value: string) => {
    // Solo permitir números y guiones
    const cleanValue = value.replace(/[^\d-]/g, "")
    const numericValue = cleanValue.replace(/-/g, "")

    // Auto-formatear mientras escribe
    let formatted = numericValue
    if (numericValue.length > 2) {
      formatted = `${numericValue.slice(0, 2)}-${numericValue.slice(2)}`
    }
    if (numericValue.length > 10) {
      formatted = `${numericValue.slice(0, 2)}-${numericValue.slice(2, 10)}-${numericValue.slice(10, 11)}`
    }

    setCuit(formatted)

    // Validar solo cuando tiene los 11 dígitos
    if (numericValue.length === 11) {
      setCuitValid(validateCuit(numericValue))
    } else {
      setCuitValid(null)
    }
  }

  const canAdvance = () => {
    if (step === 0) return email && password && confirmPassword && password === confirmPassword && password.length >= 6 && devKey.trim().length > 0
    if (step === 1) return companyName.trim().length > 0
    if (step === 2) return razonSocial && cuit && cuitValid === true && taxCondition
    return false
  }

  const handleSubmit = () => {
    setError("")
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('email', email)
        formData.set('password', password)
        formData.set('devKey', devKey)
        // Company and fiscal data will be used after email confirmation in onboarding
        // For now, store them in sessionStorage so onboarding can pick them up
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('register_company', JSON.stringify({
            name: companyName,
            razon_social: razonSocial,
            cuit: cuit.replace(/-/g, ''),
            domicilio,
            ciudad,
            provincia,
            codigo_postal: codigoPostal,
            tax_condition: taxCondition,
          }))
        }
        await signup(formData)
      } catch (e: any) {
        setError(e.message || "Error al registrar")
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="max-w-lg w-full shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="mx-auto bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-xl flex items-center justify-center font-black mb-4 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Crear Cuenta</CardTitle>
          <CardDescription className="text-zinc-500">
            Registrate en 3 pasos para comenzar con tu ERP.
          </CardDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-emerald-500 text-white' :
                  i === step ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' :
                  'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium pt-2">{STEPS[step].description}</p>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input id="confirmPassword" type="password" placeholder="Repetir tu contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-11" />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="devKey" className="text-zinc-900 dark:text-zinc-100 font-bold flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-500" />
                    Clave de Desarrollador
                  </Label>
                </div>
                <Input 
                  id="devKey" 
                  type="password" 
                  placeholder="Requerido para el alta" 
                  value={devKey} 
                  onChange={e => setDevKey(e.target.value)} 
                  className="h-11 border-emerald-100 dark:border-emerald-900/30 focus-visible:ring-emerald-500" 
                />
                <p className="text-[10px] text-zinc-400 font-medium italic">
                  * Esta clave es proporcionada por los administradores de Nodo Sur.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Company */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre Comercial</Label>
                <Input id="companyName" placeholder="Ej: Nodo Sur" value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-11" />
                <p className="text-xs text-zinc-400">El nombre con el que se reconoce tu negocio.</p>
              </div>
            </div>
          )}

          {/* Step 3: Fiscal */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input id="razonSocial" placeholder="Ej: NODO SUR S.A." value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Input
                  id="cuit"
                  placeholder="XX-XXXXXXXX-X"
                  value={cuit}
                  onChange={e => handleCuitChange(e.target.value)}
                  maxLength={13}
                  className={`h-11 ${cuitValid === true ? 'border-emerald-500 focus-visible:ring-emerald-500' : cuitValid === false ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {!cuit && <p className="text-xs text-zinc-400">Podés usar para probar: 20-11111111-2</p>}
                {cuitValid === false && <p className="text-xs text-red-500 font-medium animate-pulse">CUIT incompleto — debe tener 11 números</p>}
                {cuitValid === true && <p className="text-xs text-emerald-500 font-medium">✓ CUIT válido</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxCondition">Condición frente al IVA</Label>
                <select
                  id="taxCondition"
                  value={taxCondition}
                  onChange={e => setTaxCondition(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {TAX_CONDITIONS.map(tc => (
                    <option key={tc.value} value={tc.value}>{tc.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="domicilio">Domicilio</Label>
                  <Input id="domicilio" placeholder="Calle 123" value={domicilio} onChange={e => setDomicilio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input id="ciudad" placeholder="Rosario" value={ciudad} onChange={e => setCiudad(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input id="provincia" placeholder="Santa Fe" value={provincia} onChange={e => setProvincia(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoPostal">Código Postal</Label>
                  <Input id="codigoPostal" placeholder="2000" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Anterior
              </Button>
            ) : (
              <Link href="/login" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition">
                ← Ya tengo cuenta
              </Link>
            )}

            {step < 2 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                Siguiente <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canAdvance() || isPending} className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                {isPending ? "Registrando..." : "Crear Cuenta"} <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
