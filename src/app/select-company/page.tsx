import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { getUserCompanies, setActiveCompany } from "@/actions/company"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default async function SelectCompanyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const companies = await getUserCompanies()

  // If only 1 company, auto-select and redirect
  if (companies.length <= 1) {
    if (companies.length === 1) {
      await setActiveCompany(companies[0].id, false)
    }
    redirect('/')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="max-w-md w-full shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="mx-auto bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-xl flex items-center justify-center font-black mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Seleccionar Empresa</CardTitle>
          <CardDescription>Elegí con qué empresa querés trabajar.</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-3">
            {companies.map((company: any) => (
              <form key={company.id} action={async () => {
                "use server"
                await setActiveCompany(company.id)
              }}>
                <button
                  type="submit"
                  className="w-full p-4 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white hover:shadow-md transition-all group"
                >
                  <p className="font-semibold text-lg group-hover:text-black dark:group-hover:text-white transition">
                    {company.name}
                  </p>
                </button>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
