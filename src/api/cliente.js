const BASE = (import.meta.env.VITE_API_URL ?? 'https://proyecto-integrador-backend.ramirezcris-cpr.workers.dev/api').replace(/\/+$/, '')

const CLAVE_TOKEN = 'sesion.token'

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

const alVencer = new Set()

export function onSesionVencida(fn) {
  alVencer.add(fn)
  return () => alVencer.delete(fn)
}

export async function pedir(ruta, { method = 'GET', cuerpo, conToken = true, headers = {} } = {}) {
  const opciones = { method, headers: { ...headers } }

  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json'
    opciones.body = JSON.stringify(cuerpo)
  }

  const token = conToken ? leerToken() : null
  if (token) opciones.headers.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, opciones)
  } catch {
    const err = new Error('No se pudo conectar con el servidor')
    err.codigo = 'SIN_CONEXION'
    throw err
  }

  let datos = null
  try {
    datos = await respuesta.json()
  } catch {
    datos = null
  }

  if (!respuesta.ok || !datos?.ok) {
    const err = new Error(datos?.error?.mensaje || 'Ocurrió un error inesperado')
    err.status = respuesta.status
    err.codigo = datos?.error?.codigo

    if (respuesta.status === 401 && token) alVencer.forEach((fn) => fn())

    throw err
  }

  return datos
}
