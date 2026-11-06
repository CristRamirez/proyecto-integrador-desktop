import { pedir } from './cliente'

// Ingresos de la institución que no son cuotas: donaciones, subsidios, eventos.
export async function listarIngresos({ anio, mes, categoria, pagina = 1, porPagina = 20 }) {
  const params = new URLSearchParams({ anio, mes, pagina, por_pagina: porPagina })
  if (categoria) params.set('categoria', categoria)
  const { ingresos, paginacion, resumen } = await pedir(`/ingresos?${params}`)
  return { ingresos: ingresos ?? [], paginacion, resumen }
}

export async function listarCategoriasIngreso() {
  const { categorias } = await pedir('/ingresos/categorias')
  return categorias ?? []
}

export async function registrarIngreso(datos) {
  const { ingreso } = await pedir('/ingresos', { method: 'POST', cuerpo: datos })
  return ingreso
}

export async function anularIngreso(id, motivo) {
  const { ingreso } = await pedir(`/ingresos/${encodeURIComponent(id)}/anular`, { method: 'POST', cuerpo: { motivo } })
  return ingreso
}
