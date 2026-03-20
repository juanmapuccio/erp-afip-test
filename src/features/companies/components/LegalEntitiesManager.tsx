"use client"

import React, { useEffect, useState, useTransition } from "react"
import { createLegalEntity, getLegalEntities, setDefaultLegalEntity, deactivateLegalEntity } from "@/actions/company"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Plus, Star, StarOff, Trash2, X } from "lucide-react"
import { validateCuit, formatCuit } from "@/lib/utils"

const TAX_CONDITIONS = [
  { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
  { value: 'monotributista', label: 'Monotributista' },
  { value: 'exento', label: 'Exento' },
  { value: 'consumidor_final', label: 'Consumidor Final' },
  { value: 'no_responsable', label: 'No Responsable' },
]

const TAX_LABELS: Record<string, string> = {
  responsable_inscripto: 'Resp. Inscripto',
  monotributista: 'Monotributista',
  exento: 'Exento',
  consumidor_final: 'Cons. Final',
  no_responsable: 'No Responsable',
}

type LegalEntity = {
  id: string
  razon_social: string
  cuit: string
  domicilio: string | null
  ciudad: string | null
  provincia: string | null
  codigo_postal: string | null
  tax_condition: string
  is_default: boolean
  is_active: boolean
}

export function LegalEntitiesManager() {
  const [entities, setEntities] = useState<LegalEntity[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [cuitValid, setCuitValid] = useState<boolean | null>(null)

  const loadEntities = async () => {
    const data = await getLegalEntities()
    setEntities(data as LegalEntity[])
  }

  useEffect(() => {
    loadEntities()
  }, [])

  const handleCreate = async (formData: FormData) => {
    setError("")
    startTransition(async () => {
      try {
        await createLegalEntity(formData)
        setShowForm(false)
        setCuitValid(null)
        await loadEntities()
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      try {
        await setDefaultLegalEntity(id)
        await loadEntities()
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const handleDeactivate = (id: string) => {
    if (!confirm("¿Desactivar esta razón social?")) return
    startTransition(async () => {
      try {
        await deactivateLegalEntity(id)
        await loadEntities()
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const handleCuitInput = (value: string) => {
    if (value.replace(/-/g, '').length === 11) {
      setCuitValid(validateCuit(value))
    } else {
      setCuitValid(null)
    }
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5" /> Razones Sociales / CUIT
        </CardTitle>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="w-4 h-4" /> Agregar
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Entity list */}
        {entities.length === 0 && !showForm && (
          <p className="text-sm text-zinc-400 text-center py-4">No hay razones sociales configuradas.</p>
        )}

        <div className="space-y-3">
          {entities.map(entity => (
            <div key={entity.id} className={`p-4 rounded-xl border transition-all ${
              entity.is_default
                ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{entity.razon_social}</p>
                    {entity.is_default && (
                      <span className="text-xs bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">CUIT: {formatCuit(entity.cuit)}</p>
                  <p className="text-xs text-zinc-400">{TAX_LABELS[entity.tax_condition] || entity.tax_condition}</p>
                  {entity.domicilio && (
                    <p className="text-xs text-zinc-400">{[entity.domicilio, entity.ciudad, entity.provincia].filter(Boolean).join(', ')}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {!entity.is_default && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(entity.id)} title="Establecer como default" disabled={isPending}>
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDeactivate(entity.id)} title="Desactivar" disabled={isPending} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Nueva Razón Social</p>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setError(""); setCuitValid(null) }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form action={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="le_razon" className="text-xs">Razón Social *</Label>
                  <Input id="le_razon" name="razon_social" placeholder="NODO SUR S.A." required className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="le_cuit" className="text-xs">CUIT *</Label>
                  <Input
                    id="le_cuit"
                    name="cuit"
                    placeholder="XX-XXXXXXXX-X"
                    required
                    onChange={e => handleCuitInput(e.target.value)}
                    className={`h-9 text-sm ${cuitValid === true ? 'border-emerald-500' : cuitValid === false ? 'border-red-500' : ''}`}
                  />
                  {cuitValid === false && <p className="text-xs text-red-500">CUIT inválido</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="le_tax" className="text-xs">Condición IVA *</Label>
                <select
                  id="le_tax"
                  name="tax_condition"
                  required
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {TAX_CONDITIONS.map(tc => (
                    <option key={tc.value} value={tc.value}>{tc.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="le_dom" className="text-xs">Domicilio</Label>
                <Input id="le_dom" name="domicilio" placeholder="Calle 123" className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="le_city" className="text-xs">Ciudad</Label>
                  <Input id="le_city" name="ciudad" placeholder="Rosario" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="le_prov" className="text-xs">Provincia</Label>
                  <Input id="le_prov" name="provincia" placeholder="Santa Fe" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="le_cp" className="text-xs">CP</Label>
                  <Input id="le_cp" name="codigo_postal" placeholder="2000" className="h-9 text-sm" />
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full h-9 text-sm bg-black dark:bg-white text-white dark:text-black">
                {isPending ? "Guardando..." : "Guardar Razón Social"}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
