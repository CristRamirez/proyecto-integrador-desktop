import { listarCuotas } from '../../api/cobranzas'
import { generarReporte } from '../../api/reportes'
import { listarUsuarios } from '../../api/usuarios'
import { diasDesde, fecha, moneda, periodo, periodoActual } from '../internos/formato'
import { rangoDe } from '../reportes/reporte'

// Los avisos no los manda el back: se arman con lo que ya devuelven los listados
// y los reportes. Cada uno lleva a la pantalla donde se resuelve (`destino`) y
// una `firma` que cambia cuando cambia el dato, para saber si ya se vio.

const DIAS_DE_ANTICIPO = 4

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`
}

async function avisosDeCuotas() {
  const actual = periodoActual()
  const [anio, mes] = actual.split('-').map(Number)
  const nombreMes = periodo(actual).split(' ')[0]
  const [todas, vencidas] = await Promise.all([
    listarCuotas({ anio, mes, porPagina: 1 }),
    listarCuotas({ anio, mes, estado: 'vencida', porPagina: 1 }),
  ])
  const resumen = todas.resumen ?? {}
  const avisos = []

  if (!resumen.cuotas) {
    avisos.push({
      id: 'sin-generar',
      tono: 'aviso',
      titulo: `Faltan generar las cuotas de ${nombreMes}`,
      detalle: 'Ningún interno tiene todavía la cuota de este mes.',
      destino: ['cobranzas'],
      firma: `sin-generar:${actual}`,
    })
    return avisos
  }

  const cantidadVencidas = vencidas.paginacion?.total ?? vencidas.cuotas.length
  if (cantidadVencidas > 0) {
    avisos.push({
      id: 'vencidas',
      tono: 'peligro',
      titulo: `${plural(cantidadVencidas, 'cuota vencida', 'cuotas vencidas')} sin pagar`,
      detalle: `${plural(resumen.internos_con_vencidas ?? 0, 'interno', 'internos')} · ${moneda(resumen.vencido)} vencido en ${nombreMes}`,
      destino: ['cobranzas', { tipo: 'vencidas' }],
      firma: `vencidas:${actual}:${cantidadVencidas}`,
    })
  }

  const vence = todas.cuotas[0]?.fecha_vencimiento
  const pendientes = resumen.cuotas_pendientes ?? 0
  const faltan = vence ? -diasDesde(vence) : -1
  if (pendientes > 0 && faltan >= 0 && faltan <= DIAS_DE_ANTICIPO) {
    avisos.push({
      id: 'por-vencer',
      tono: 'aviso',
      titulo: faltan === 0 ? `Hoy vencen ${plural(pendientes, 'cuota', 'cuotas')}` : `${plural(pendientes, 'cuota vence', 'cuotas vencen')} el ${fecha(vence)}`,
      detalle:
        faltan === 0
          ? 'Las que no registren ningún pago entran en mora mañana.'
          : `Faltan ${plural(faltan, 'día', 'días')}. Después del vencimiento se aplica la mora.`,
      destino: ['cobranzas'],
      firma: `por-vencer:${actual}:${pendientes}:${faltan}`,
    })
  }

  return avisos
}

// La deuda sale del reporte RP-08 con el mismo rango que usa la pantalla de
// reportes por defecto, así el número coincide al abrirlo.
async function avisoDeDeuda() {
  const { tarjetas } = await generarReporte('deuda', rangoDe(periodoActual(), 'anio'))
  const valor = (clave) => tarjetas.find((t) => t.clave === clave)?.valor ?? 0
  const total = valor('total_adeudado')
  const internos = valor('internos_con_deuda')
  if (total <= 0) return []

  return [
    {
      id: 'deuda',
      tono: 'aviso',
      titulo: `${plural(internos, 'interno', 'internos')} con deuda`,
      detalle: `${moneda(total)} adeudados en los últimos 12 meses`,
      destino: ['reportes', { reporte: 'deuda' }],
      firma: `deuda:${internos}:${total}`,
    },
  ]
}

async function avisoDeUsuarios() {
  const { usuarios } = await listarUsuarios({ porPagina: 100 })
  const bloqueados = usuarios.filter((u) => u.bloqueado)
  if (!bloqueados.length) return []

  return [
    {
      id: 'bloqueados',
      tono: 'peligro',
      titulo: `${plural(bloqueados.length, 'usuario bloqueado', 'usuarios bloqueados')}`,
      detalle: `${bloqueados.map((u) => u.nombre_usuario).join(', ')}. Superaron los intentos de ingreso.`,
      destino: ['configuracion', { pestana: 'usuarios' }],
      firma: `bloqueados:${bloqueados.map((u) => u.id).sort().join(',')}`,
    },
  ]
}

// Solo se consulta lo que el rol puede ver: el back rechazaría el resto. Si una
// consulta falla, sus avisos no aparecen y los demás siguen.
export async function buscarAvisos({ modulos, rol }) {
  const consultas = []
  if (modulos.includes('cobranzas')) consultas.push(avisosDeCuotas())
  if (modulos.includes('reportes')) consultas.push(avisoDeDeuda())
  if (rol === 'administrador') consultas.push(avisoDeUsuarios())

  const resultados = await Promise.allSettled(consultas)
  return resultados.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}

// Lo ya visto se recuerda por usuario en esta computadora. Si el navegador no
// deja guardar, todos los avisos cuentan como nuevos y la campana sigue andando.
function claveVistos(usuarioId) {
  return `avisos.vistos.${usuarioId}`
}

export function leerVistos(usuarioId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(claveVistos(usuarioId)) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function guardarVistos(usuarioId, firmas) {
  try {
    localStorage.setItem(claveVistos(usuarioId), JSON.stringify(firmas))
  } catch {
    // Sin almacenamiento no se recuerda qué se vio.
  }
}
