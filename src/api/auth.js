import { pedir, leerToken } from './cliente'

const CLAVE_TOKEN = 'sesion.token'
const CLAVE_USUARIO = 'sesion.usuario'

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
    modulos: Array.isArray(u.modulos) ? u.modulos : [],
  }
}

export async function login(nombreUsuario, password) {
  const cuerpo = await pedir('/auth/login', {
    method: 'POST',
    cuerpo: { nombre_usuario: nombreUsuario.trim(), password },
    conToken: false,
  })

  const usuario = normalizarUsuario(cuerpo.usuario)
  guardarSesion(cuerpo.token, usuario)
  return { token: cuerpo.token, usuario }
}

export async function restaurarSesion() {
  const token = leerToken()
  if (!token) return null

  try {
    await pedir('/auth/yo')
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
