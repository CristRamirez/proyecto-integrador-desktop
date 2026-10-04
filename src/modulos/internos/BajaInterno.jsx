import { useState } from 'react'
import { bajaInterno } from '../../api/internos'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { hoy } from './formato'

const MAXIMO_MOTIVO = 500

function validar({ motivo, fecha_egreso }, ingreso) {
  const errores = {}
  if (!motivo.trim()) errores.motivo = 'Falta el motivo'
  else if (motivo.trim().length > MAXIMO_MOTIVO) errores.motivo = `Máximo ${MAXIMO_MOTIVO} caracteres`

  if (!fecha_egreso) errores.fecha_egreso = 'Falta la fecha de egreso'
  else if (fecha_egreso > hoy()) errores.fecha_egreso = 'No puede ser una fecha futura'
  else if (ingreso && fecha_egreso < ingreso) errores.fecha_egreso = 'No puede ser anterior a la fecha de ingreso'

  return errores
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'MOTIVO_INVALIDO':
      return { motivo: err.message }
    case 'FECHA_INVALIDA':
      return { fecha_egreso: err.message }
    default:
      return { general: err.message }
  }
}

export default function BajaInterno({ interno, onCancelar, onBaja }) {
  const [form, setForm] = useState({ motivo: '', fecha_egreso: hoy() })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const ingreso = interno.fecha_ingreso?.slice(0, 10)

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  async function confirmar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(form, ingreso)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      const actualizado = await bajaInterno(interno.id, { motivo: form.motivo.trim(), fecha_egreso: form.fecha_egreso })
      onBaja(actualizado)
    } catch (err) {
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo="Dar de baja">
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          El interno pasa a egresado y deja de figurar entre los activos. No se borra: la ficha sigue disponible.
        </p>

        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <Campo etiqueta="Fecha de egreso" obligatorio error={errores.fecha_egreso}>
            <input
              type="date"
              className={claseInput}
              value={form.fecha_egreso}
              min={ingreso}
              max={hoy()}
              onChange={(e) => cambiar('fecha_egreso', e.target.value)}
              aria-invalid={!!errores.fecha_egreso}
            />
          </Campo>
          <Campo etiqueta="Motivo" obligatorio error={errores.motivo} className="col-span-3">
            <textarea
              rows={3}
              maxLength={MAXIMO_MOTIVO}
              className={`${claseInput} h-auto py-3`}
              value={form.motivo}
              onChange={(e) => cambiar('motivo', e.target.value)}
              placeholder="Alta médica, traslado, fallecimiento…"
              aria-invalid={!!errores.motivo}
              autoFocus
            />
            <p className="mt-1.5 text-right font-mono text-[12px] text-ink-soft">
              {form.motivo.length}/{MAXIMO_MOTIVO}
            </p>
          </Campo>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" icono="check" disabled={guardando}>
            {guardando ? 'Registrando…' : 'Confirmar baja'}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
