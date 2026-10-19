import { hoy } from '../internos/formato'

export function tieneSaldo(cuota) {
  return cuota.estado !== 'anulada' && cuota.saldo_pendiente > 0
}

// El back guarda pendiente, parcial, pagada o anulada; "vencida" se deduce de la
// fecha hasta que el cálculo de mora (BS-11) la marque del lado del servidor.
export function estaVencida(cuota) {
  return cuota.estado === 'vencida' || (tieneSaldo(cuota) && cuota.fecha_vencimiento < hoy())
}
