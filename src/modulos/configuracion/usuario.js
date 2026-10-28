export const MINIMO_PASSWORD = 8
export const MAXIMO_PASSWORD = 72

// Misma regla que el back (8 a 72 caracteres) más la repetición, que solo se pide acá.
export function validarPassword(password, repetida) {
  if (!password) return { password: 'Falta la contraseña' }
  if (password.length < MINIMO_PASSWORD) return { password: `Tiene que tener al menos ${MINIMO_PASSWORD} caracteres` }
  if (password.length > MAXIMO_PASSWORD) return { password: `Máximo ${MAXIMO_PASSWORD} caracteres` }
  if (password !== repetida) return { repetida: 'Las contraseñas no coinciden' }
  return {}
}

export function etiquetaRol(nombre) {
  return nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : '—'
}
