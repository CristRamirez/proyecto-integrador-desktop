export function hoy() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function fecha(valor) {
  if (!valor) return '—'
  const [anio, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

export function fechaHora(valor) {
  if (!valor) return '—'
  const hora = valor.slice(11, 16)
  return hora ? `${fecha(valor)} ${hora}` : fecha(valor)
}

const PESOS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

export function moneda(valor) {
  return PESOS.format(valor ?? 0)
}

const PESOS_ENTEROS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const MILLONES = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

// Para los indicadores: "$ 117,8 M" o, debajo del millón, "$ 18.000".
// El compacto de Intl en es-AR da "$18,0 K", que no se usa acá.
export function monedaCorta(valor) {
  const v = valor ?? 0
  return Math.abs(v) >= 1e6 ? `$ ${MILLONES.format(v / 1e6)} M` : PESOS_ENTEROS.format(v)
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// "2026-10" → "octubre 2026"
export function periodo(valor) {
  if (!valor) return '—'
  const [anio, mes] = valor.split('-')
  return `${MESES[Number(mes) - 1] ?? mes} ${anio}`
}

export function periodoActual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function diasDesde(valor) {
  const [anio, mes, dia] = valor.slice(0, 10).split('-').map(Number)
  const [hAnio, hMes, hDia] = hoy().split('-').map(Number)
  return Math.round((Date.UTC(hAnio, hMes - 1, hDia) - Date.UTC(anio, mes - 1, dia)) / 86400000)
}

export function edad(nacimiento) {
  if (!nacimiento) return null
  const [anio, mes, dia] = nacimiento.slice(0, 10).split('-').map(Number)
  const hoy = new Date()
  let años = hoy.getFullYear() - anio
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) años--
  return años
}
