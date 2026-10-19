import { pedir } from './cliente'

// Valores con los que se generan las cuotas. Solo para el rol administrador.

export async function obtenerParametros() {
  const { configuracion } = await pedir('/parametros')
  return configuracion ?? null
}

export async function listarHistoricoParametros() {
  const { configuraciones } = await pedir('/parametros/historico')
  return configuraciones ?? []
}

// Nunca edita la vigente: el back crea una nueva y archiva la anterior en el histórico.
export async function guardarParametros(datos) {
  const { configuracion } = await pedir('/parametros', { method: 'POST', cuerpo: datos })
  return configuracion
}
