import { pedir } from './cliente'

// Los ids con los que el seed carga la tabla medios_pago. Solo se usan mientras el
// back no tenga GET /medios-pago (responde RUTA_NO_ENCONTRADA); cuando lo publique,
// manda su catálogo y esto se puede borrar.
const MEDIOS_PAGO_DEL_SEED = [
  { id: 1, nombre: 'efectivo' },
  { id: 2, nombre: 'transferencia' },
  { id: 3, nombre: 'débito' },
  { id: 4, nombre: 'cheque' },
  { id: 5, nombre: 'obra social' },
]

// El back reconoce el pago de la obra social por el nombre del medio, no por el id.
export const MEDIO_OBRA_SOCIAL = 'obra social'

export async function listarMediosPago() {
  try {
    const { mediosPago } = await pedir('/medios-pago')
    return mediosPago ?? []
  } catch (err) {
    if (err.codigo === 'RUTA_NO_ENCONTRADA') return MEDIOS_PAGO_DEL_SEED
    throw err
  }
}

export async function obtenerCuentaCorriente(idInterno) {
  const { interno, cuotas, total_adeudado } = await pedir(`/internos/${encodeURIComponent(idInterno)}/cuenta-corriente`)
  return { interno, cuotas: cuotas ?? [], total_adeudado: total_adeudado ?? 0 }
}

// Cuotas de un período de todos los internos, con el resumen para los indicadores.
// El back todavía no tiene GET /cuotas: mientras falte responde RUTA_NO_ENCONTRADA
// y la pantalla de Cobranzas cae a la búsqueda por interno.
export async function listarCuotas({ anio, mes, estado, q, pagina = 1, porPagina = 20 }) {
  const params = new URLSearchParams({ anio, mes, pagina, por_pagina: porPagina })
  if (estado) params.set('estado', estado)
  if (q?.trim()) params.set('q', q.trim())
  const { cuotas, paginacion, resumen } = await pedir(`/cuotas?${params}`)
  return { cuotas: cuotas ?? [], paginacion, resumen }
}

export async function registrarPago(idCuota, datos) {
  const { cuota, pagos } = await pedir(`/cuotas/${encodeURIComponent(idCuota)}/pagos`, { method: 'POST', cuerpo: datos })
  return { cuota, pagos: pagos ?? [] }
}
