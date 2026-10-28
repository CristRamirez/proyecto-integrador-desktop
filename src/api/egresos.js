import { pedir } from './cliente'

export async function listarEgresos({ anio, mes, categoria, pagina = 1, porPagina = 20 }) {
  const params = new URLSearchParams({ anio, mes, pagina, por_pagina: porPagina })
  if (categoria) params.set('categoria', categoria)
  const { egresos, paginacion, resumen } = await pedir(`/egresos?${params}`)
  return { egresos: egresos ?? [], paginacion, resumen }
}

export async function listarCategoriasEgreso() {
  const { categorias } = await pedir('/egresos/categorias')
  return categorias ?? []
}

export async function registrarEgreso(datos) {
  const { egreso } = await pedir('/egresos', { method: 'POST', cuerpo: datos })
  return egreso
}

export async function modificarEgreso(id, datos) {
  const { egreso } = await pedir(`/egresos/${encodeURIComponent(id)}`, { method: 'PUT', cuerpo: datos })
  return egreso
}

export async function anularEgreso(id, motivo) {
  const { egreso } = await pedir(`/egresos/${encodeURIComponent(id)}/anular`, { method: 'POST', cuerpo: { motivo } })
  return egreso
}
