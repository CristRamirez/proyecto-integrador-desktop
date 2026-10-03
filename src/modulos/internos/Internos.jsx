import { useEffect, useRef, useState } from 'react'
import AltaInterno from './AltaInterno'
import FichaInterno from './FichaInterno'
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
        onVerFicha={() => setVista({ tipo: 'ficha', id: vista.interno.id })}
      />
    )
  }

  if (vista.tipo === 'ficha') {
    return <FichaInterno id={vista.id} onVolver={() => setVista({ tipo: 'padron' })} />
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
