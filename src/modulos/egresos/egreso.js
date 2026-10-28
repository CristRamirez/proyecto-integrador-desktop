export const CATEGORIAS_SUGERIDAS = ['sueldos', 'servicios', 'alimentos', 'medicamentos', 'mantenimiento', 'limpieza', 'impuestos']

export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function nombreCategoria(categoria) {
  return categoria ? capitalizar(categoria) : 'Sin categoría'
}
