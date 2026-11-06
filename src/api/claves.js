import { pedir } from './cliente'

// Claves de integración con otros servicios. Solo el rol administrador. La API
// nunca devuelve la clave: solo sus últimos cuatro caracteres (`termina_en`).

export async function listarClaves() {
  const { claves } = await pedir('/claves')
  return claves ?? []
}

export async function crearClave(datos) {
  const { clave } = await pedir('/claves', { method: 'POST', cuerpo: datos })
  return clave
}

// Sin `valor` la clave guardada queda como estaba.
export async function modificarClave(id, datos) {
  const { clave } = await pedir(`/claves/${encodeURIComponent(id)}`, { method: 'PUT', cuerpo: datos })
  return clave
}

export async function cambiarEstadoClave(id, activo) {
  const { clave } = await pedir(`/claves/${encodeURIComponent(id)}/estado`, { method: 'PUT', cuerpo: { activo } })
  return clave
}

export async function eliminarClave(id) {
  await pedir(`/claves/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
