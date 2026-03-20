import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate Argentine CUIT/CUIL using AFIP checksum algorithm.
 * Accepts formats: XX-XXXXXXXX-X or XXXXXXXXXXX (11 digits)
 */
/**
 * Valida el CUIT/CUIL.
 * Por ahora solo verifica que tenga 11 dígitos por pedido del usuario (para testing).
 */
export function validateCuit(cuit: string): boolean {
  const clean = cuit.replace(/-/g, '')
  // Solo verificamos que sean 11 números para permitir datos de prueba
  return /^\d{11}$/.test(clean)
  
  /* 
  // Algoritmo real de AFIP (Módulo 11) - Se activará al conectar con API real
  if (!/^\d{11}$/.test(clean)) return false
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const digits = clean.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 10; i++) sum += digits[i] * multipliers[i]
  const remainder = sum % 11
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder
  return checkDigit === digits[10]
  */
}

/**
 * Format CUIT to XX-XXXXXXXX-X display format.
 */
export function formatCuit(cuit: string): string {
  const clean = cuit.replace(/-/g, '')
  if (clean.length !== 11) return cuit
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
}
