import { pedir } from './cliente'

// ABM de usuarios del sistema. Todo el grupo es solo para el rol administrador.

export async function listarUsuarios({ q, rolId, activo, pagina = 1, porPagina = 20 } = {}) {
  const params = new URLSearchParams({ pagina, por_pagina: porPagina })
  if (q?.trim()) params.set('q', q.trim())
  if (rolId) params.set('rol_id', rolId)
  if (activo !== undefined && activo !== '') params.set('activo', activo)
  const { usuarios, paginacion } = await pedir(`/usuarios?${params}`)
  return { usuarios: usuarios ?? [], paginacion }
}

export async function listarRoles() {
  const { roles } = await pedir('/roles')
  return roles ?? []
}

export async function crearUsuario(datos) {
  const { usuario } = await pedir('/usuarios', { method: 'POST', cuerpo: datos })
  return usuario
}

export async function modificarUsuario(id, datos) {
  const { usuario } = await pedir(`/usuarios/${encodeURIComponent(id)}`, { method: 'PUT', cuerpo: datos })
  return usuario
}

// Además de cambiarla, el back deja los intentos en cero y saca el bloqueo.
export async function reiniciarPassword(id, password) {
  const { usuario } = await pedir(`/usuarios/${encodeURIComponent(id)}/password`, {
    method: 'PUT',
    cuerpo: { password },
  })
  return usuario
}

// Baja y alta lógica: un usuario deshabilitado no puede iniciar sesión.
export async function cambiarEstadoUsuario(id, activo) {
  const { usuario } = await pedir(`/usuarios/${encodeURIComponent(id)}/estado`, {
    method: 'PUT',
    cuerpo: { activo },
  })
  return usuario
}

export async function desbloquearUsuario(id) {
  const { usuario } = await pedir(`/usuarios/${encodeURIComponent(id)}/desbloquear`, { method: 'POST' })
  return usuario
}
