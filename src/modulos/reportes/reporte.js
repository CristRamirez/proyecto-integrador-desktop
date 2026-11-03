import { moneda, monedaCorta, periodo, periodoActual } from '../internos/formato'

export const LISTOS = ['balance', 'cuenta-corriente']

export const APILADOS = ['cuenta-corriente']

export const NOTA_INDICADORES = {
  'cuenta-corriente': 'Los porcentajes son sobre los internos con cuotas que vencen en el rango.',
}

export const BARRA_INDICADOR = {
  en_mora: 'bg-danger',
  al_dia: 'bg-ok',
}

export const RANGOS = [
  { id: 'mes', etiqueta: 'Mes', meses: 1 },
  { id: 'trimestre', etiqueta: 'Trimestre', meses: 3 },
  { id: 'semestre', etiqueta: 'Semestre', meses: 6 },
  { id: 'anio', etiqueta: 'Año', meses: 12 },
]

export const SERIES = [
  { fondo: 'bg-serie-1', relleno: 'fill-serie-1' },
  { fondo: 'bg-serie-2', relleno: 'fill-serie-2' },
  { fondo: 'bg-serie-3', relleno: 'fill-serie-3' },
  { fondo: 'bg-serie-4', relleno: 'fill-serie-4' },
  { fondo: 'bg-serie-5', relleno: 'fill-serie-5' },
]

export function estaListo(reporte) {
  return reporte.disponible && LISTOS.includes(reporte.id)
}

function aFecha(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function rangoDe(cierre, rango) {
  const { meses } = RANGOS.find((r) => r.id === rango)
  const [anio, mes] = cierre.split('-').map(Number)
  return { desde: aFecha(new Date(anio, mes - meses, 1)), hasta: aFecha(new Date(anio, mes, 0)) }
}

export function mesesDeCierre() {
  const [anio, mes] = periodoActual().split('-').map(Number)
  const lista = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(anio, mes - 1 - i, 1)
    lista.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return lista
}

export function nombreDelRango({ desde, hasta }) {
  const inicio = desde.slice(0, 7)
  const fin = hasta.slice(0, 7)
  return inicio === fin ? periodo(fin) : `${periodo(inicio)} a ${periodo(fin)}`
}

export function mesCorto(etiqueta) {
  return periodo(etiqueta).slice(0, 3)
}

const DECIMAL = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

export function formatear(valor, formato) {
  if (valor === null || valor === undefined) return '—'
  if (formato === 'moneda') return moneda(valor)
  if (formato === 'porcentaje') return `${DECIMAL.format(valor)} %`
  if (formato === 'numero') return DECIMAL.format(valor)
  return String(valor)
}

export function formatearCorto(valor, formato) {
  return formato === 'moneda' ? monedaCorta(valor) : formatear(valor, formato)
}

const COMPACTO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

export function formatearEje(valor, formato) {
  const prefijo = formato === 'moneda' ? '$ ' : ''
  if (Math.abs(valor) >= 1e6) return `${prefijo}${COMPACTO.format(valor / 1e6)} M`
  if (Math.abs(valor) >= 1e3) return `${prefijo}${COMPACTO.format(valor / 1e3)} mil`
  return `${prefijo}${COMPACTO.format(valor)}`
}

export function formatoDeLaSerie(reporte) {
  const claves = reporte.serie.lineas.map((l) => l.clave)
  return reporte.tarjetas.find((t) => claves.includes(t.clave))?.formato ?? 'moneda'
}

export function escala(maximo) {
  if (maximo <= 0) return { tope: 1, marcas: [0] }
  const paso0 = maximo / 4
  const potencia = 10 ** Math.floor(Math.log10(paso0))
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= paso0)
  const cantidad = Math.ceil(maximo / paso)
  return { tope: paso * cantidad, marcas: Array.from({ length: cantidad + 1 }, (_, i) => i * paso) }
}
