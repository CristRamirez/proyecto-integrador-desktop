import { fecha, moneda, monedaCorta, periodo, periodoActual } from '../internos/formato'

export const LISTOS = ['balance', 'cuenta-corriente', 'clasificacion', 'medios-pago', 'egresos', 'egresos-internos', 'deuda']

export const APILADOS = ['cuenta-corriente', 'clasificacion', 'medios-pago', 'egresos', 'egresos-internos']

const FORMATO_DE_LA_SERIE = { 'egresos-internos': 'numero' }

export const SERIE_DE_LA_TARJETA = { recuperados: 'alta_terapeutica', abandonos: 'abandono' }

export const NOTA_INDICADORES = {
  'cuenta-corriente': 'Los porcentajes son sobre los internos con cuotas que vencen en el rango.',
  clasificacion: 'Muestran la situación de hoy de los internos activos, no dependen del rango elegido.',
  egresos: 'Los porcentajes son sobre el total de egresos del rango, sin contar los anulados.',
  'egresos-internos': 'Los porcentajes son sobre los egresos del rango. Los egresos sin tipo cargado cuentan como Otro.',
}

const GRUPOS_INDICADORES = {
  egresos: [
    { prefijo: 'participacion_', titulo: 'Por medio de pago' },
    { prefijo: 'categoria_', titulo: 'Categorías que más gastaron' },
  ],
  'egresos-internos': [
    { prefijo: 'porcentaje_', titulo: 'Por tipo de egreso' },
    { claves: ['egresos', 'dias_promedio_estadia'], titulo: 'Egresos y estadía' },
  ],
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

export function colorDeIndicador({ clave, valor }, clavesDeLaSerie) {
  if (valor < 0) return 'bg-danger'
  if (BARRA_INDICADOR[clave]) return BARRA_INDICADOR[clave]
  const j = clavesDeLaSerie.indexOf(clave.replace(/^(participacion|porcentaje)_/, ''))
  return j === -1 ? 'bg-accent' : SERIES[j].fondo
}

export function agruparIndicadores({ id, indicadores }) {
  const grupos = GRUPOS_INDICADORES[id]
  if (!grupos) return [{ titulo: null, indicadores }]
  return grupos
    .map(({ prefijo, claves, titulo }) => ({
      titulo,
      indicadores: indicadores.filter((i) => (prefijo ? i.clave.startsWith(prefijo) : claves.includes(i.clave))),
    }))
    .filter((grupo) => grupo.indicadores.length > 0)
}

export function columnasDeIndicadores(cantidad) {
  if (cantidad % 5 === 0) return 'grid-cols-5'
  if (cantidad === 4) return 'grid-cols-4'
  return 'grid-cols-3'
}

export function totalDelMes(lineas, indice) {
  return lineas.reduce((suma, l) => suma + (l.valores[indice] || 0), 0)
}

export function totalDeLaLinea(linea) {
  return linea.valores.reduce((suma, v) => suma + v, 0)
}

export function lineasDeLaTabla({ etiquetas, lineas }, apilado) {
  if (!apilado) return lineas
  return [...lineas, { clave: 'total', etiqueta: 'Total', valores: etiquetas.map((_, i) => totalDelMes(lineas, i)) }]
}

export function tieneSerie({ serie }) {
  return serie.lineas.length > 0
}

export function tieneDetalle({ detalle }) {
  return Boolean(detalle?.columnas?.length)
}

export function sinMovimientos({ serie }) {
  return serie.lineas.every((l) => l.valores.every((v) => !v))
}

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

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}(?:[ T]|$)/
const PERIODO_ISO = /^\d{4}-\d{2}$/

export function formatear(valor, formato) {
  if (valor === null || valor === undefined) return '—'
  if (formato === 'moneda') return moneda(valor)
  if (formato === 'porcentaje') return `${DECIMAL.format(valor)} %`
  if (formato === 'numero') return DECIMAL.format(valor)
  if (Array.isArray(valor)) return valor.map((v) => formatear(v, formato)).join(', ')
  if (typeof valor === 'string' && FECHA_ISO.test(valor)) return fecha(valor)
  if (typeof valor === 'string' && PERIODO_ISO.test(valor)) return `${mesCorto(valor)} ${valor.slice(0, 4)}`
  return String(valor)
}

export function esTextoLargo(valor) {
  return Array.isArray(valor) || String(valor ?? '').length > 40
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
  if (FORMATO_DE_LA_SERIE[reporte.id]) return FORMATO_DE_LA_SERIE[reporte.id]
  const claves = reporte.serie.lineas.map((l) => l.clave)
  return reporte.tarjetas.find((t) => claves.includes(t.clave))?.formato ?? 'moneda'
}

export function escala(maximo, enteros = false) {
  if (maximo <= 0) return { tope: 1, marcas: [0] }
  const paso0 = maximo / 4
  const potencia = 10 ** Math.floor(Math.log10(paso0))
  const candidato = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= paso0)
  const paso = enteros ? Math.max(1, Math.ceil(candidato)) : candidato
  const cantidad = Math.ceil(maximo / paso)
  return { tope: paso * cantidad, marcas: Array.from({ length: cantidad + 1 }, (_, i) => i * paso) }
}
