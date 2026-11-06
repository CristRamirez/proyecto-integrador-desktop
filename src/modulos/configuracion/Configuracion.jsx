import { useState } from 'react'
import Parametros from '../parametros/Parametros'
import Auditoria from './Auditoria'
import Claves from './Claves'
import Usuarios from './Usuarios'

const PESTANAS = [
  { id: 'parametros', titulo: 'Parámetros', Pantalla: Parametros },
  { id: 'usuarios', titulo: 'Usuarios', Pantalla: Usuarios },
  { id: 'auditoria', titulo: 'Auditoría', Pantalla: Auditoria },
  { id: 'claves', titulo: 'Claves de integración', Pantalla: Claves, soloAdministrador: true },
]

// Cada pestaña es un módulo del rol: se muestran solo las que tiene, así nadie
// entra a una que el back le va a rechazar. Un módulo "configuracion" las abre todas.
// Las claves no son un módulo: el back las deja solo al rol administrador.
function pestanasDelRol(modulos, rol) {
  const propias = modulos.includes('configuracion') ? PESTANAS : PESTANAS.filter((p) => modulos.includes(p.id))
  const claves = rol === 'administrador' ? PESTANAS.filter((p) => p.soloAdministrador) : []
  return [...new Set([...propias.filter((p) => !p.soloAdministrador), ...claves])]
}

export default function Configuracion({ modulos = [], usuario, accion }) {
  const visibles = pestanasDelRol(modulos, usuario?.rol)
  const [actual, setActual] = useState(visibles.find((p) => p.id === accion?.pestana)?.id ?? visibles[0]?.id)
  const pestana = visibles.find((p) => p.id === actual) ?? visibles[0]

  if (!pestana) {
    return (
      <p className="py-16 text-center text-[16px] text-ink-soft">
        Tu rol no tiene opciones de configuración
      </p>
    )
  }

  const { Pantalla } = pestana

  return (
    <>
      <div className="mx-auto max-w-5xl px-8 pt-6">
        <nav className="flex gap-2 border-b border-line">
          {visibles.map((p) => {
            const activa = p.id === pestana.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActual(p.id)}
                aria-current={activa ? 'page' : undefined}
                className={`-mb-px cursor-pointer border-b-2 px-4 py-3 text-[16px] transition-colors duration-150 ${
                  activa ? 'border-primary font-semibold text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {p.titulo}
              </button>
            )
          })}
        </nav>
      </div>
      <Pantalla key={pestana.id} usuario={usuario} />
    </>
  )
}
