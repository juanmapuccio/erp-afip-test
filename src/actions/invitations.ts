"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'
import { getActiveCompanyId } from './company'

/**
 * Crear una invitación para un nuevo empleado.
 * Genera un token único de 1 sola vez que dura 7 días.
 * Solo usuarios admin pueden invitar (RLS lo garantiza).
 */
export async function createInvitation(formData: FormData) {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) throw new Error("No active company")

  const email = formData.get('email') as string
  const role = formData.get('role') as string || 'employee'

  if (!email) throw new Error("Email es obligatorio")

  const supabase = await createClient()

  // Verificar que el usuario actual esté autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      company_id: activeCompanyId,
      invited_by: user.id,
      email: email.toLowerCase().trim(),
      role,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error("Ya existe una invitación para este email en esta empresa")
    }
    throw new Error(error.message)
  }

  revalidatePath('/settings')

  // Devolver el link de invitación (basado en token)
  const inviteLink = `/auth/accept-invite?token=${invitation.token}`
  return { success: true, inviteLink, token: invitation.token }
}

/**
 * Aceptar una invitación usando el token.
 * Si el usuario ya está logueado: lo agrega como miembro.
 * Si no tiene cuenta: crea una nueva con la contraseña provista.
 */
export async function acceptInvitation(token: string, password?: string) {
  const supabase = await createClient()

  // Buscar invitación por token (no aceptada aún)
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single()

  if (error || !invitation) {
    throw new Error("Invitación inválida o ya utilizada")
  }

  // Verificar que no haya expirado
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error("Esta invitación ha expirado")
  }

  // Verificar si el usuario ya está logueado
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (currentUser) {
    // Usuario existente → solo agregarlo como miembro de la empresa
    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: invitation.company_id,
        user_id: currentUser.id,
        role: invitation.role as any,
      })

    if (memberError) {
      if (memberError.code === '23505') {
        throw new Error("Ya sos miembro de esta empresa")
      }
      throw new Error(memberError.message)
    }
  } else if (password) {
    // Crear cuenta nueva con el email de la invitación
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
    })

    if (signUpError || !signUpData.user) {
      throw new Error(signUpError?.message || "Error al crear la cuenta")
    }

    // Agregar a company_members con el rol de la invitación
    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: invitation.company_id,
        user_id: signUpData.user.id,
        role: invitation.role as any,
      })

    if (memberError) throw new Error(memberError.message)
  } else {
    throw new Error("Se requiere una contraseña para crear tu cuenta")
  }

  // Marcar invitación como aceptada
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return { success: true, companyId: invitation.company_id }
}

/** Listar invitaciones pendientes (no aceptadas) de la empresa activa */
export async function getPendingInvitations() {
  const activeCompanyId = await getActiveCompanyId()
  if (!activeCompanyId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('company_id', activeCompanyId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching invitations:", error)
    return []
  }
  return data
}

/** Revocar (eliminar) una invitación pendiente */
export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  return { success: true }
}
