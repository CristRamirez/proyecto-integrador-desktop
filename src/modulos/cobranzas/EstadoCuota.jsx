import { Estado } from '../../components/ui'
import { diasDesde, moneda } from '../internos/formato'
import { estaVencida, tieneSaldo } from './cuota'

function aspecto(cuota) {
  if (cuota.estado === 'anulada') return { etiqueta: 'Anulada', tono: 'neutro' }
  if (!tieneSaldo(cuota)) return { etiqueta: 'Pagada', tono: 'ok' }
  if (estaVencida(cuota)) return { etiqueta: 'Vencida', tono: 'peligro' }
  if (cuota.estado === 'parcial') return { etiqueta: 'Parcial', tono: 'neutro' }
  return { etiqueta: 'Pendiente', tono: 'aviso' }
}

// Con detalle suma "hace N días" si está vencida y "resta $X" si tiene pagos parciales.
export default function EstadoCuota({ cuota, detalle = false }) {
  const { etiqueta, tono } = aspecto(cuota)
  const vencida = estaVencida(cuota)
  const extras = []

  if (detalle && vencida) {
    const dias = diasDesde(cuota.fecha_vencimiento)
    extras.push(`hace ${dias} ${dias === 1 ? 'día' : 'días'}`)
  }
  if (detalle && tieneSaldo(cuota) && cuota.saldo_pendiente < cuota.total) {
    extras.push(`resta ${moneda(cuota.saldo_pendiente)}`)
  }

  return (
    <span className="inline-flex flex-col items-start gap-1 whitespace-nowrap">
      <Estado tono={tono}>{etiqueta}</Estado>
      {extras.map((texto) => (
        <span key={texto} className={`text-[13px] ${vencida ? 'text-danger' : 'text-ink-soft'}`}>
          {texto}
        </span>
      ))}
    </span>
  )
}
