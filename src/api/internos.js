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

export async function verificarDni(dni) {
  const { duplicado, interno } = await pedir(`/internos/verificar-dni/${encodeURIComponent(dni)}`)
  return duplicado ? interno : null
}

export async function altaInterno(datos) {
  const { interno } = await pedir('/internos', { method: 'POST', cuerpo: datos })
  return interno
}

export async function bajaInterno(id, datos) {
  const { interno } = await pedir(`/internos/${encodeURIComponent(id)}/baja`, { method: 'POST', cuerpo: datos })
  return interno
}

export async function modificarInterno(id, cambios) {
  const { interno } = await pedir(`/internos/${encodeURIComponent(id)}`, { method: 'PUT', cuerpo: cambios })
  return interno
}
