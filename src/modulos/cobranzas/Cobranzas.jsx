import { useEffect, useRef, useState } from 'react'
import Padron from '../internos/Padron'
import { periodoActual } from '../internos/formato'
import CuentaCorriente from './CuentaCorriente'
import CuotasDelPeriodo from './CuotasDelPeriodo'

// La pantalla principal lista las cuotas del período (GET /cuotas). Mientras el back
// no tenga ese endpoint se entra buscando al interno en el padrón, que usa GET /internos
// y por eso pide también el módulo internos. Los filtros viven acá para que no se
// pierdan al ir y volver de la cuenta corriente.
export default function Cobranzas() {
  const [vista, setVista] = useState({ tipo: 'lista' })
  const [filtros, setFiltros] = useState(() => ({ periodo: periodoActual(), estado: '', q: '', pagina: 1 }))
  const [sinListado, setSinListado] = useState(false)
  const raiz = useRef(null)

  useEffect(() => {
    raiz.current?.scrollIntoView()
  }, [vista])

  function abrirCuenta(id, cuota) {
    setVista({ tipo: 'cuenta', id, cuota })
  }

  let pantalla
  if (vista.tipo === 'cuenta') {
    pantalla = (
      <CuentaCorriente
        id={vista.id}
        cuotaInicial={vista.cuota}
        etiquetaVolver="Volver a Cobranzas"
        onVolver={() => setVista({ tipo: 'lista' })}
      />
    )
  } else if (sinListado) {
    pantalla = (
      <Padron
        titulo="Cobranzas"
        subtitulo="Buscá al interno para ver su cuenta corriente y registrar pagos."
        onAbrir={(id) => abrirCuenta(id)}
      />
    )
  } else {
    pantalla = (
      <CuotasDelPeriodo
        filtros={filtros}
        onFiltros={setFiltros}
        onSinListado={setSinListado}
        onAbrir={(id) => abrirCuenta(id)}
        onPagar={abrirCuenta}
      />
    )
  }

  return <div ref={raiz}>{pantalla}</div>
}
