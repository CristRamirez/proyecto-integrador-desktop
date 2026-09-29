import { useEffect, useRef, useState } from 'react'
import { Boton } from '../../components/ui'
import AltaInterno from './AltaInterno'
import InternoCreado from './InternoCreado'

function Padron({ onNuevo }) {
  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Padrón de internos</h1>
        <Boton icono="persona" onClick={onNuevo}>
          Nuevo interno
        </Boton>
      </div>
      <p className="mt-10 border border-dashed border-line-strong px-6 py-10 text-center text-[16px] text-ink-soft rounded-sm">
        La búsqueda del padrón todavía no está disponible.
      </p>
    </div>
  )
}

function Vista({ vista, setVista }) {
  if (vista.tipo === 'alta') {
    return (
      <AltaInterno
        onCancelar={() => setVista({ tipo: 'padron' })}
        onCreado={(interno) => setVista({ tipo: 'creado', interno })}
      />
    )
  }

  if (vista.tipo === 'creado') {
    return (
      <InternoCreado
        interno={vista.interno}
        onOtro={() => setVista({ tipo: 'alta' })}
        onVolver={() => setVista({ tipo: 'padron' })}
      />
    )
  }

  return <Padron onNuevo={() => setVista({ tipo: 'alta' })} />
}

export default function Internos() {
  const [vista, setVista] = useState({ tipo: 'padron' })
  const raiz = useRef(null)

  useEffect(() => {
    raiz.current?.scrollIntoView()
  }, [vista])

  return (
    <div ref={raiz}>
      <Vista vista={vista} setVista={setVista} />
    </div>
  )
}
