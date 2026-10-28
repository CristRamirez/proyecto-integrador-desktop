import { pedir } from './cliente'

// Registro de auditoría (regla 13): solo para el rol administrador.

export async function listarAuditoria({ usuarioId, accion, entidad, desde, hasta, pagina = 1, porPagina = 50 } = {}) {
  const params = new URLSearchParams({ pagina, por_pagina: porPagina })
  if (usuarioId) params.set('usuario_id', usuarioId)
  if (accion) params.set('accion', accion)
  if (entidad) params.set('entidad', entidad)
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const { registros, paginacion } = await pedir(`/auditoria?${params}`)
  return { registros: registros ?? [], paginacion }
}

// Las acciones y entidades que ya aparecen en el registro, y todos los usuarios.
export async function opcionesDeAuditoria() {
  const { acciones, entidades, usuarios } = await pedir('/auditoria/filtros')
  return { acciones: acciones ?? [], entidades: entidades ?? [], usuarios: usuarios ?? [] }
}
