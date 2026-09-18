const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '')

const CLAVE_TOKEN = 'sesion.token'
const CLAVE_USUARIO = 'sesion.usuario'

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

function leerUsuarioGuardado() {
  try {
    const crudo = localStorage.getItem(CLAVE_USUARIO)
    return crudo ? JSON.parse(crudo) : null
  } catch {
    return null
  }
}

function guardarSesion(token, usuario) {
  try {
    localStorage.setItem(CLAVE_TOKEN, token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
  } catch {
    /* */
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
  } catch {
    /* */
  }
}

function normalizarUsuario(u) {
  return {
    id: u.id,
    nombre: u.nombreCompleto || u.nombreUsuario,
    nombreUsuario: u.nombreUsuario,
    rol: u.rol,
  }
}

async function pedir(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, opciones)
  } catch {
    const err = new Error('Falta conectar la API con el backend')
    err.codigo = 'SIN_CONEXION'
    throw err
  }

  let cuerpo = null
  try {
    cuerpo = await respuesta.json()
  } catch {
    cuerpo = null
  }

  if (!respuesta.ok || !cuerpo?.ok) {
    const err = new Error(cuerpo?.error?.mensaje || 'Ocurrió un error inesperado')
    err.status = respuesta.status
    err.codigo = cuerpo?.error?.codigo
    throw err
  }

  return cuerpo
}

export async function login(nombreUsuario, password) {
  const cuerpo = await pedir('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_usuario: nombreUsuario.trim(), password }),
  })

  const usuario = normalizarUsuario(cuerpo.usuario)
  guardarSesion(cuerpo.token, usuario)
  return { token: cuerpo.token, usuario }
}

export async function restaurarSesion() {
  const token = leerToken()
  if (!token) return null

  try {
    await pedir('/auth/yo', { headers: { Authorization: `Bearer ${token}` } })
  } catch (err) {
    if (err.status === 401) {
      cerrarSesion()
      return null
    }
    throw err
  }

  const usuario = leerUsuarioGuardado()
  return usuario ? { token, usuario } : null
}
