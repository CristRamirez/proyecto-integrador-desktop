const ORDEN = ['internos', 'cobranzas', 'ingresos', 'egresos', 'reportes']

const DE_CONFIGURACION = ['parametros', 'usuarios', 'auditoria', 'configuracion']

const NOMBRES = {
  configuracion: 'Configuración',
}

function posicion(modulo) {
  const i = ORDEN.indexOf(modulo)
  return i === -1 ? ORDEN.length : i
}

// Ingresos y egresos no son módulos propios en el back: los pide el de cobranzas.
export function armarMenu(modulos) {
  const conCaja = modulos.includes('cobranzas') ? [...new Set([...modulos, 'ingresos', 'egresos'])] : modulos
  const propios = conCaja
    .filter((m) => m !== 'inicio' && !DE_CONFIGURACION.includes(m))
    .sort((a, b) => posicion(a) - posicion(b))
  const conConfiguracion = modulos.some((m) => DE_CONFIGURACION.includes(m))
  const menu = ['inicio', ...propios]
  return conConfiguracion ? [...menu, 'configuracion'] : menu
}

export function etiqueta(nombre) {
  return NOMBRES[nombre] ?? nombre.charAt(0).toUpperCase() + nombre.slice(1)
}
