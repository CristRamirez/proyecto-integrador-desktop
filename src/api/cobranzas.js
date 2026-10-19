import { pedir } from './cliente'

export async function obtenerCuentaCorriente(idInterno) {
  const { interno, cuotas, total_adeudado } = await pedir(`/internos/${encodeURIComponent(idInterno)}/cuenta-corriente`)
  return { interno, cuotas: cuotas ?? [], total_adeudado: total_adeudado ?? 0 }
}
