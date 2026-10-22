const DE_CONFIGURACION = ['parametros', 'auditoria', 'configuracion']

const NOMBRES = {
  configuracion: 'Configuración',
}

export function armarMenu(modulos) {
  const propios = modulos.filter((m) => !DE_CONFIGURACION.includes(m))
  const conConfiguracion = modulos.some((m) => DE_CONFIGURACION.includes(m))
  return conConfiguracion ? [...propios, 'configuracion'] : propios
}

export function etiqueta(nombre) {
  return NOMBRES[nombre] ?? nombre.charAt(0).toUpperCase() + nombre.slice(1)
}
