import { pedir } from './cliente'

export async function listarObrasSociales() {
  const { obrasSociales } = await pedir('/obras-sociales')
  return obrasSociales ?? []
}

export async function altaInterno(datos) {
  const { interno } = await pedir('/internos', { method: 'POST', cuerpo: datos })
  return interno
}
