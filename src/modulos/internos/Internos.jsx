import { useEffect, useRef, useState } from 'react'
import AltaInterno from './AltaInterno'
import InternoCreado from './InternoCreado'
import Padron from './Padron'

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
