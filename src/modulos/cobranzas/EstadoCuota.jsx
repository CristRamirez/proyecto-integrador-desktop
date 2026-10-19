import { diasDesde, moneda } from '../internos/formato'
import { estaVencida, tieneSaldo } from './cuota'

function aspecto(cuota) {
  if (cuota.estado === 'anulada') return { etiqueta: 'Anulada', fondo: 'bg-accent-soft', punto: 'bg-line-strong' }
  if (!tieneSaldo(cuota)) return { etiqueta: 'Pagada', fondo: 'bg-ok-soft', punto: 'bg-ok' }
  if (estaVencida(cuota)) return { etiqueta: 'Vencida', fondo: 'bg-danger-soft', punto: 'bg-danger' }
  if (cuota.estado === 'parcial') return { etiqueta: 'Parcial', fondo: 'bg-accent-soft', punto: 'bg-accent' }
  return { etiqueta: 'Pendiente', fondo: 'bg-warn-soft', punto: 'bg-warn' }
}

// Con detalle suma "hace N días" si está vencida y "resta $X" si tiene pagos parciales.
export default function EstadoCuota({ cuota, detalle = false }) {
  const { etiqueta, fondo, punto } = aspecto(cuota)
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
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[14px] text-ink ${fondo}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${punto}`} aria-hidden="true" />
        {etiqueta}
      </span>
      {extras.map((texto) => (
        <span key={texto} className={`text-[13px] ${vencida ? 'text-danger' : 'text-ink-soft'}`}>
          {texto}
        </span>
      ))}
    </span>
  )
}
