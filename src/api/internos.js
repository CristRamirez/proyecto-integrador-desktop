import { pedir } from './cliente'

export async function listarObrasSociales() {
  const { obrasSociales } = await pedir('/obras-sociales')
  return obrasSociales ?? []
}

export async function buscarInternos({ q, estado, judicializado, pagina = 1, porPagina = 20 } = {}) {
  const params = new URLSearchParams()
  if (q?.trim()) params.set('q', q.trim())
  if (estado) params.set('estado', estado)
  if (judicializado !== undefined && judicializado !== '') params.set('judicializado', judicializado)
  params.set('pagina', pagina)
  params.set('por_pagina', porPagina)
  const { internos, paginacion } = await pedir(`/internos?${params}`)
  return { internos: internos ?? [], paginacion }
}

export async function obtenerInterno(id) {
  const { interno } = await pedir(`/internos/${encodeURIComponent(id)}`)
  return interno
}

// `activo`: el interno activo con ese DNI, que no se puede repetir. `egresado`: la
// persona ya estuvo internada; no se da de alta otra vez, se reingresa desde su ficha.
export async function verificarDni(dni) {
  const { duplicado, interno, egresado } = await pedir(`/internos/verificar-dni/${encodeURIComponent(dni)}`)
  return { activo: duplicado ? interno : null, egresado: egresado ?? null }
}

export async function altaInterno(datos) {
  const { interno } = await pedir('/internos', { method: 'POST', cuerpo: datos })
  return interno
}

export async function bajaInterno(id, datos) {
  const { interno } = await pedir(`/internos/${encodeURIComponent(id)}/baja`, { method: 'POST', cuerpo: datos })
  return interno
}

// Vuelve a activo y le abre un legajo nuevo; los anteriores quedan en la ficha.
export async function reingresarInterno(id, datos) {
  const { interno } = await pedir(`/internos/${encodeURIComponent(id)}/reingreso`, { method: 'POST', cuerpo: datos })
  return interno
}

export async function modificarInterno(id, cambios) {
  const { interno } = await pedir(`/internos/${encodeURIComponent(id)}`, { method: 'PUT', cuerpo: cambios })
  return interno
}
