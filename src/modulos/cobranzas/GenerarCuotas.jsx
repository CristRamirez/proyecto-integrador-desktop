import { useState } from 'react'
import { generarCuotas } from '../../api/cobranzas'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { periodo, periodosRecientes } from '../internos/formato'

export default function GenerarCuotas({ periodoInicial, onCancelar, onGeneradas }) {
  const [periodoElegido, setPeriodoElegido] = useState(periodoInicial)
  const [error, setError] = useState(null)
  const [generando, setGenerando] = useState(false)

  async function confirmar(e) {
    e.preventDefault()
    if (generando) return

    setGenerando(true)
    setError(null)
    const [anio, mes] = periodoElegido.split('-').map(Number)
    try {
      onGeneradas(await generarCuotas({ anio, mes }))
    } catch (err) {
      setError(err.message)
      setGenerando(false)
    }
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo="Generar cuotas del período">
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          Crea la cuota a cada interno activo que todavía no tenga la del período, con el valor de los parámetros de
          cobranza vigentes. Los que ya la tienen se saltean, así que se puede volver a correr sin duplicar.
        </p>

        {error && (
          <div className="mb-5">
            <Aviso>{error}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-3 gap-x-6">
          <Campo etiqueta="Período" obligatorio>
            <select
              className={`${claseInput} capitalize`}
              value={periodoElegido}
              onChange={(e) => {
                setPeriodoElegido(e.target.value)
                setError(null)
              }}
              autoFocus
            >
              {periodosRecientes().map((p) => (
                <option key={p} value={p}>
                  {periodo(p)}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
          <Boton variante="secundario" onClick={onCancelar} disabled={generando}>
            Cancelar
          </Boton>
          <Boton type="submit" icono="check" disabled={generando}>
            {generando ? 'Generando…' : `Generar cuotas de ${periodo(periodoElegido)}`}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
