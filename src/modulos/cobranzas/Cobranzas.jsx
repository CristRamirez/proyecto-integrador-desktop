import { useEffect, useRef, useState } from 'react'
import { Aviso, Boton } from '../../components/ui'
import Padron from '../internos/Padron'
import { fecha, moneda, periodo, periodoActual } from '../internos/formato'
import CuentaCorriente from './CuentaCorriente'
import CuotasDelPeriodo from './CuotasDelPeriodo'
import GenerarCuotas from './GenerarCuotas'

function plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`
}

function resultadoDeGenerar({ periodo: { anio, mes }, valor_cuota, fecha_vencimiento, internos_activos, creadas, omitidas }) {
  const nombre = periodo(`${anio}-${String(mes).padStart(2, '0')}`)
  if (internos_activos === 0) return `No hay internos activos: no se generó ninguna cuota de ${nombre}.`
  if (creadas === 0) return `No se generó ninguna cuota: los ${plural(internos_activos, 'interno activo', 'internos activos')} ya tenían la de ${nombre}.`

  const yaLaTenian = omitidas > 0 ? ` ${plural(omitidas, 'interno ya la tenía', 'internos ya la tenían')}.` : ''
  return `Se ${creadas === 1 ? 'generó' : 'generaron'} ${plural(creadas, 'cuota', 'cuotas')} de ${nombre} por ${moneda(valor_cuota)}, con vencimiento el ${fecha(fecha_vencimiento)}.${yaLaTenian}`
}

// La pantalla principal lista las cuotas del período (GET /cuotas). Si el back no
// tuviera ese endpoint se entra buscando al interno en el padrón, que usa GET /internos
// y por eso pide también el módulo internos. Los filtros viven acá para que no se
// pierdan al ir y volver de la cuenta corriente.
export default function Cobranzas() {
  const [vista, setVista] = useState({ tipo: 'lista' })
  const [filtros, setFiltros] = useState(() => ({ periodo: periodoActual(), estado: '', q: '', pagina: 1 }))
  const [sinListado, setSinListado] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [version, setVersion] = useState(0)
  const raiz = useRef(null)

  useEffect(() => {
    raiz.current?.scrollIntoView()
  }, [vista])

  function abrirCuenta(id, cuota) {
    setAviso(null)
    setGenerando(false)
    setVista({ tipo: 'cuenta', id, cuota })
  }

  // Después de generar se muestra el período generado y se vuelve a pedir el listado.
  function cuotasGeneradas(resultado) {
    const { anio, mes } = resultado.periodo
    setGenerando(false)
    setAviso(resultadoDeGenerar(resultado))
    setFiltros((f) => ({ ...f, periodo: `${anio}-${String(mes).padStart(2, '0')}`, pagina: 1 }))
    setVersion((v) => v + 1)
  }

  const acciones = !generando && (
    <Boton
      icono="mas"
      className="shrink-0"
      onClick={() => {
        setAviso(null)
        setGenerando(true)
      }}
    >
      Generar cuotas
    </Boton>
  )

  const debajoDelTitulo = (
    <>
      {aviso && (
        <div className="mt-6">
          <Aviso>{aviso}</Aviso>
        </div>
      )}
      {generando && (
        <div className="mt-6">
          <GenerarCuotas
            periodoInicial={filtros.periodo}
            onCancelar={() => setGenerando(false)}
            onGeneradas={cuotasGeneradas}
          />
        </div>
      )}
    </>
  )

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
        key={version}
        titulo="Cobranzas"
        subtitulo="Buscá al interno para ver su cuenta corriente y registrar pagos."
        onAbrir={(id) => abrirCuenta(id)}
        acciones={acciones}
      >
        {debajoDelTitulo}
      </Padron>
    )
  } else {
    pantalla = (
      <CuotasDelPeriodo
        key={version}
        filtros={filtros}
        onFiltros={setFiltros}
        onSinListado={setSinListado}
        onAbrir={(id) => abrirCuenta(id)}
        onPagar={abrirCuenta}
        acciones={acciones}
      >
        {debajoDelTitulo}
      </CuotasDelPeriodo>
    )
  }

  return <div ref={raiz}>{pantalla}</div>
}
