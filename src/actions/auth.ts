"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import crypto from 'crypto'

/**
 * Genera el email interno para empleados basado en username y companyId.
 */
function getInternalEmail(username: string, companyId: string) {
  const cleanId = companyId.replace(/-/g, '').toLowerCase()
  return `${username.toLowerCase()}@${cleanId}.nodosur.internal`
}

/**
 * Genera el hash SHA-256 de una cadena.
 */
function hashKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Iniciar sesión con email o username.
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const companyId = formData.get('companyId') as string // Solo requerido para username

  let loginEmail = email

  // Si es login por empleado, construimos el email interno
  if (username && companyId) {
    loginEmail = getInternalEmail(username, companyId)
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  })

  if (error) {
    const errorMsg = error.message === 'Invalid login credentials' 
      ? 'Credenciales incorrectas' 
      : error.message
    redirect('/login?error=' + encodeURIComponent(errorMsg))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Registrar un nuevo usuario.
 * Requiere la clave de desarrollador para autorizar el registro.
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const devKey = formData.get('devKey') as string

  // Validación de Clave de Desarrollador
  const expectedHash = process.env.DEV_REGISTRATION_KEY_HASH
  if (!devKey || hashKey(devKey) !== expectedHash) {
    redirect('/login?error=' + encodeURIComponent('Clave de desarrollador inválida o no proporcionada.'))
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/onboarding`,
    }
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // Redirigir al login con aviso de verificar email
  revalidatePath('/', 'layout')
  redirect('/login?message=check-email')
}

/**
 * Cerrar sesión del usuario actual.
 * Limpia la sesión de Supabase Auth y redirige a /login.
 * Las cookies de empresa/CUIT persisten pero no tienen efecto
 * sin sesión activa.
 */
export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
