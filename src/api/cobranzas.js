import { pedir } from './cliente'

// El back todavía no expone el catálogo (no hay GET /medios-pago). Son los ids con
// los que el seed carga la tabla medios_pago; cuando exista el endpoint se consulta.
export const MEDIOS_PAGO = [
  { id: 1, nombre: 'efectivo' },
  { id: 2, nombre: 'transferencia' },
  { id: 3, nombre: 'débito' },
  { id: 4, nombre: 'cheque' },
  { id: 5, nombre: 'obra social' },
]

export const MEDIO_OBRA_SOCIAL = 5

export async function obtenerCuentaCorriente(idInterno) {
  const { interno, cuotas, total_adeudado } = await pedir(`/internos/${encodeURIComponent(idInterno)}/cuenta-corriente`)
  return { interno, cuotas: cuotas ?? [], total_adeudado: total_adeudado ?? 0 }
}

export async function registrarPago(idCuota, datos) {
  const { cuota, pagos } = await pedir(`/cuotas/${encodeURIComponent(idCuota)}/pagos`, { method: 'POST', cuerpo: datos })
  return { cuota, pagos: pagos ?? [] }
}
