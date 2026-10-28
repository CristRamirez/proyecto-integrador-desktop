export const CATEGORIAS_SUGERIDAS = ['sueldos', 'servicios', 'alimentos', 'medicamentos', 'mantenimiento', 'limpieza', 'impuestos']

export const EGRESO_DESACTUALIZADO = ['EGRESO_ANULADO', 'EGRESO_YA_ANULADO', 'EGRESO_NO_ENCONTRADO']

export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function nombreCategoria(categoria) {
  return categoria ? capitalizar(categoria) : 'Sin categoría'
}

export function estaAnulado(egreso) {
  return egreso.estado === 'anulado'
}
