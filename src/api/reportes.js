import { pedir } from './cliente'

export async function listarReportes() {
  const { reportes } = await pedir('/reportes')
  return reportes ?? []
}

export async function generarReporte(id, { desde, hasta }) {
  const params = new URLSearchParams({ desde, hasta })
  const { titulo, codigo, rango, tarjetas, serie, indicadores, detalle } = await pedir(
    `/reportes/${encodeURIComponent(id)}?${params}`
  )
  return {
    id,
    titulo,
    codigo,
    rango,
    tarjetas: tarjetas ?? [],
    serie: serie ?? { etiquetas: [], lineas: [] },
    indicadores: indicadores ?? [],
    detalle: detalle ?? null,
  }
}
