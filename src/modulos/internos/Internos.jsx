import { useEffect, useRef, useState } from 'react'
import CuentaCorriente from '../cobranzas/CuentaCorriente'
import FichaInterno from './FichaInterno'
import FormularioInterno from './FormularioInterno'
import InternoCreado from './InternoCreado'
import Padron from './Padron'

function Vista({ vista, setVista, conCobranzas }) {
  if (vista.tipo === 'alta') {
    return (
      <FormularioInterno
        onCancelar={() => setVista({ tipo: 'padron' })}
        onGuardado={(interno) => setVista({ tipo: 'creado', interno })}
        onAbrirFicha={(id) => setVista({ tipo: 'ficha', id })}
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
        onCuentaCorriente={conCobranzas ? () => setVista({ tipo: 'cuenta', id: vista.id }) : undefined}
      />
    )
  }

  if (vista.tipo === 'cuenta') {
    return <CuentaCorriente id={vista.id} onVolver={() => setVista({ tipo: 'ficha', id: vista.id })} />
  }

  return <Padron onNuevo={() => setVista({ tipo: 'alta' })} onAbrir={(id) => setVista({ tipo: 'ficha', id })} />
}

// La cuenta corriente cuelga de la ficha pero es de Cobranzas: el back pide los
// dos módulos, así que sin cobranzas el botón queda deshabilitado.
export default function Internos({ modulos = [] }) {
  const [vista, setVista] = useState({ tipo: 'padron' })
  const raiz = useRef(null)
  const conCobranzas = modulos.includes('cobranzas')

  useEffect(() => {
    raiz.current?.scrollIntoView()
  }, [vista])

  return (
    <div ref={raiz}>
      <Vista vista={vista} setVista={setVista} conCobranzas={conCobranzas} />
    </div>
  )
}
