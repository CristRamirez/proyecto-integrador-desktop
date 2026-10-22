import { useState } from 'react'
import Parametros from '../parametros/Parametros'
import Auditoria from './Auditoria'

const PESTANAS = [
  { id: 'parametros', titulo: 'Parámetros', Pantalla: Parametros },
  { id: 'auditoria', titulo: 'Auditoría', Pantalla: Auditoria },
]

export default function Configuracion() {
  const [actual, setActual] = useState(PESTANAS[0].id)
  const { Pantalla } = PESTANAS.find((p) => p.id === actual)

  return (
    <>
      <div className="mx-auto max-w-5xl px-8 pt-6">
        <nav className="flex gap-2 border-b border-line">
          {PESTANAS.map((p) => {
            const activa = p.id === actual
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActual(p.id)}
                aria-current={activa ? 'page' : undefined}
                className={`-mb-px cursor-pointer border-b-2 px-4 py-3 text-[16px] transition-colors duration-150 ${
                  activa ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {p.titulo}
              </button>
            )
          })}
        </nav>
      </div>
      <Pantalla />
    </>
  )
}
