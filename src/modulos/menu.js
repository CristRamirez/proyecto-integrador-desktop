const ORDEN = ['internos', 'cobranzas']

const DE_CONFIGURACION = ['parametros', 'auditoria', 'configuracion']

const NOMBRES = {
  configuracion: 'Configuración',
}

function posicion(modulo) {
  const i = ORDEN.indexOf(modulo)
  return i === -1 ? ORDEN.length : i
}

export function armarMenu(modulos) {
  const propios = modulos
    .filter((m) => m !== 'inicio' && !DE_CONFIGURACION.includes(m))
    .sort((a, b) => posicion(a) - posicion(b))
  const conConfiguracion = modulos.some((m) => DE_CONFIGURACION.includes(m))
  const menu = ['inicio', ...propios]
  return conConfiguracion ? [...menu, 'configuracion'] : menu
}

export function etiqueta(nombre) {
  return NOMBRES[nombre] ?? nombre.charAt(0).toUpperCase() + nombre.slice(1)
}
