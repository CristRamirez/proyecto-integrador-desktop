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

export function edad(nacimiento) {
  if (!nacimiento) return null
  const [anio, mes, dia] = nacimiento.slice(0, 10).split('-').map(Number)
  const hoy = new Date()
  let años = hoy.getFullYear() - anio
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) años--
  return años
}
