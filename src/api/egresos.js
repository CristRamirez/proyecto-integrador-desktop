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
