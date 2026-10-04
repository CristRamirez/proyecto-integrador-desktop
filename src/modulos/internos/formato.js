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

export function edad(nacimiento) {
  if (!nacimiento) return null
  const [anio, mes, dia] = nacimiento.slice(0, 10).split('-').map(Number)
  const hoy = new Date()
  let años = hoy.getFullYear() - anio
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) años--
  return años
}
