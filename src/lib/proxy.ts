import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Rutas públicas: accesibles sin autenticación
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.startsWith('/select-company') ||
    request.nextUrl.pathname.startsWith('/select-cuit')

  if (!user && !isPublicRoute) {
    // Sin sesión y ruta protegida → redirigir al login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // VALIDACIÓN DE CONTEXTO (Multi-tenancy)
  if (user && !isPublicRoute) {
    const activeCompanyId = request.cookies.get('nodosur_active_company_id')?.value
    const activeLegalEntityId = request.cookies.get('nodosur_active_legal_entity_id')?.value

    // 1. Validar Empresa
    if (!activeCompanyId) {
      const url = request.nextUrl.clone()
      url.pathname = '/select-company'
      return NextResponse.redirect(url)
    }

    // 2. Validar CUIT (Legal Entity)
    if (!activeLegalEntityId) {
      const url = request.nextUrl.clone()
      url.pathname = '/select-cuit'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
