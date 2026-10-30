import { useState } from 'react'
import { anularEgreso } from '../../api/egresos'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { fecha, moneda } from '../internos/formato'
import { EGRESO_DESACTUALIZADO, nombreCategoria } from './egreso'

const MAXIMO_MOTIVO = 500

function validar(motivo) {
  const texto = motivo.trim()
  if (!texto) return { motivo: 'Falta el motivo' }
  if (texto.length > MAXIMO_MOTIVO) return { motivo: `Máximo ${MAXIMO_MOTIVO} caracteres` }
  return {}
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'MOTIVO_INVALIDO':
    case 'DATOS_INCOMPLETOS':
      return { motivo: err.message }
    default:
      return { general: err.message }
  }
}

export default function AnularEgreso({ egreso, onCancelar, onAnulado, onDesactualizado }) {
  const [motivo, setMotivo] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  async function confirmar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(motivo)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      onAnulado(await anularEgreso(egreso.id, motivo.trim()))
    } catch (err) {
      if (EGRESO_DESACTUALIZADO.includes(err.codigo)) {
        onDesactualizado(err.message)
        return
      }
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo="Anular egreso" tono="peligro">
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          <span className="font-semibold text-ink">{egreso.concepto}</span> · {nombreCategoria(egreso.categoria)} ·{' '}
          {fecha(egreso.fecha)} · <span className="font-mono font-semibold text-ink">{moneda(egreso.monto)}</span>
        </p>
        <p className="mb-5 text-[16px] text-ink">
          No se borra: queda en la lista como anulado, con el motivo, y deja de sumar en los totales del mes.
        </p>

        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <Campo etiqueta="Motivo" obligatorio error={errores.motivo}>
          <textarea
            rows={3}
            maxLength={MAXIMO_MOTIVO}
            className={`${claseInput} h-auto py-3`}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setErrores({})
            }}
            placeholder="Cargado dos veces, monto equivocado…"
            aria-invalid={!!errores.motivo}
            autoFocus
          />
          <p className="mt-1.5 text-right font-mono text-[12px] text-ink-soft">
            {motivo.length}/{MAXIMO_MOTIVO}
          </p>
        </Campo>

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" variante="peligroLleno" icono="cruz" disabled={guardando}>
            {guardando ? 'Anulando…' : 'Confirmar anulación'}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
