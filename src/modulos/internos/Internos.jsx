import { useEffect, useRef, useState } from 'react'
import FichaInterno from './FichaInterno'
import FormularioInterno from './FormularioInterno'
import InternoCreado from './InternoCreado'
import Padron from './Padron'

function Vista({ vista, setVista }) {
  if (vista.tipo === 'alta') {
    return (
      <FormularioInterno
        onCancelar={() => setVista({ tipo: 'padron' })}
        onGuardado={(interno) => setVista({ tipo: 'creado', interno })}
      />
    )
  }

  if (vista.tipo === 'editar') {
    return (
      <FormularioInterno
        interno={vista.interno}
        onCancelar={() => setVista({ tipo: 'ficha', id: vista.interno.id })}
        onGuardado={(interno) => setVista({ tipo: 'ficha', id: interno.id, interno, guardado: true })}
      />
    )
  }

  if (vista.tipo === 'creado') {
    return (
      <InternoCreado
        interno={vista.interno}
        onOtro={() => setVista({ tipo: 'alta' })}
        onVolver={() => setVista({ tipo: 'padron' })}
        onVerFicha={() => setVista({ tipo: 'ficha', id: vista.interno.id })}
      />
    )
  }

  if (vista.tipo === 'ficha') {
    return (
      <FichaInterno
        id={vista.id}
        inicial={vista.interno}
        guardado={vista.guardado}
        onVolver={() => setVista({ tipo: 'padron' })}
        onEditar={(interno) => setVista({ tipo: 'editar', interno })}
      />
    )
  }

  return <Padron onNuevo={() => setVista({ tipo: 'alta' })} onAbrir={(id) => setVista({ tipo: 'ficha', id })} />
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
