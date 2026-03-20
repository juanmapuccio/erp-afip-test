"use client"

import { use, useEffect, useState, useTransition } from "react"
import { createCompany, setActiveCompany } from "@/actions/company"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkspace } from "@/store/use-workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Plus, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

const TAX_CONDITIONS = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'exento', label: 'Exento' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
  { value: 'no_responsable', label: 'No Responsable' },
]

export default function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ hasCompanies?: string }>
}) {
  const { setActiveCompanyId } = useWorkspace()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  
  const resolvedSearchParams = use(searchParams)
  const hasMultipleCompanies = resolvedSearchParams.hasCompanies === 'true'

  // Pre-fill from sessionStorage (set during /register flow)
  const [companyName, setCompanyName] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [cuit, setCuit] = useState("")
  const [domicilio, setDomicilio] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [provincia, setProvincia] = useState("")
  const [codigoPostal, setCodigoPostal] = useState("")
  const [taxCondition, setTaxCondition] = useState("monotributista")

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('register_company')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          setCompanyName(data.name || "")
          setRazonSocial(data.razon_social || "")
          setCuit(data.cuit || "")
          setDomicilio(data.domicilio || "")
          setCiudad(data.ciudad || "")
          setProvincia(data.provincia || "")
          setCodigoPostal(data.codigo_postal || "")
          setTaxCondition(data.tax_condition || "monotributista")
          // Clean up after reading
          sessionStorage.removeItem('register_company')
        } catch {}
      }
    }
  }, [])

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await createCompany(formData)
        router.push('/')
        router.refresh()
      } catch (error) {
        console.error(error)
        alert('Error al crear la empresa')
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="max-w-lg w-full shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center pb-8 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="mx-auto bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-xl flex items-center justify-center font-black mb-4 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Tu Empresa</CardTitle>
          <CardDescription className="text-zinc-500">
            {hasMultipleCompanies 
              ? "Para comenzar, selecciona o crea tu espacio de trabajo."
              : "Completá los datos para configurar tu empresa."}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Nombre Comercial</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Ej: Nodo Sur" 
                required 
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="h-11 focus-visible:ring-offset-2 transition-all"
              />
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-sm font-semibold mb-3">Datos Fiscales</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Razón Social</Label>
                    <Input id="razon_social" name="razon_social" placeholder="NODO SUR S.A." value={razonSocial} onChange={e => setRazonSocial(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input id="cuit" name="cuit" placeholder="XX-XXXXXXXX-X" value={cuit} onChange={e => setCuit(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_condition">Condición IVA</Label>
                  <select
                    id="tax_condition"
                    name="tax_condition"
                    value={taxCondition}
                    onChange={e => setTaxCondition(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    {TAX_CONDITIONS.map(tc => (
                      <option key={tc.value} value={tc.value}>{tc.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domicilio">Domicilio</Label>
                  <Input id="domicilio" name="domicilio" placeholder="Calle 123" value={domicilio} onChange={e => setDomicilio(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input id="ciudad" name="ciudad" placeholder="Rosario" value={ciudad} onChange={e => setCiudad(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input id="provincia" name="provincia" placeholder="Santa Fe" value={provincia} onChange={e => setProvincia(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_postal">CP</Label>
                    <Input id="codigo_postal" name="codigo_postal" placeholder="2000" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6">
              <Button disabled={isPending} type="submit" className="w-full h-11 font-medium bg-black dark:bg-white hover:bg-zinc-800 shadow-sm transition-all active:scale-[0.98]">
                {isPending ? "Creando..." : "Crear Empresa"} <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>

          {hasMultipleCompanies && (
            <div className="mt-6 text-center text-sm text-zinc-500">
              <p>O usa el selector de empresas si ya tienes otras.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
