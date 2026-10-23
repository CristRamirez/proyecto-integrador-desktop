import { useEffect, useState } from 'react'
import { obtenerCuentaCorriente } from '../../api/cobranzas'
import { reingresarInterno } from '../../api/internos'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { fecha, hoy, moneda } from './formato'

const MAXIMO_MOTIVO = 500

function validar({ motivo, fecha_ingreso }, egreso) {
  const errores = {}
  if (motivo.trim().length > MAXIMO_MOTIVO) errores.motivo = `Máximo ${MAXIMO_MOTIVO} caracteres`

  if (!fecha_ingreso) errores.fecha_ingreso = 'Falta la fecha de ingreso'
  else if (fecha_ingreso > hoy()) errores.fecha_ingreso = 'No puede ser una fecha futura'
  else if (egreso && fecha_ingreso < egreso) errores.fecha_ingreso = `No puede ser anterior al último egreso (${fecha(egreso)})`

  return errores
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'MOTIVO_INVALIDO':
      return { motivo: err.message }
    case 'FECHA_INVALIDA':
      return { fecha_ingreso: err.message }
    default:
      return { general: err.message }
  }
}

// La deuda de estadías anteriores no impide el reingreso: solo se avisa. Sin el
// módulo de cobranzas no se puede consultar, y entonces no se muestra nada.
export default function ReingresoInterno({ interno, conCobranzas, onCancelar, onReingreso }) {
  const [form, setForm] = useState({ motivo: '', fecha_ingreso: hoy() })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [deuda, setDeuda] = useState(0)
  const egreso = interno.legajos?.filter((l) => l.fecha_egreso).at(-1)?.fecha_egreso?.slice(0, 10)

  useEffect(() => {
    if (!conCobranzas) return
    let vivo = true
    obtenerCuentaCorriente(interno.id)
      .then((c) => vivo && setDeuda(c.total_adeudado))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [interno.id, conCobranzas])

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  async function confirmar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(form, egreso)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      const actualizado = await reingresarInterno(interno.id, {
        fecha_ingreso: form.fecha_ingreso,
        motivo: form.motivo.trim() || null,
      })
      onReingreso(actualizado)
    } catch (err) {
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo="Registrar reingreso">
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          El interno vuelve a activo con un legajo nuevo. Los legajos anteriores, el historial y la cuenta corriente
          siguen en esta ficha.
        </p>

        {deuda > 0 && (
          <div className="mb-5">
            <Aviso>Tiene {moneda(deuda)} adeudados de estadías anteriores. El reingreso no lo impide.</Aviso>
          </div>
        )}

        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <Campo etiqueta="Fecha de ingreso" obligatorio error={errores.fecha_ingreso}>
            <input
              type="date"
              className={claseInput}
              value={form.fecha_ingreso}
              min={egreso}
              max={hoy()}
              onChange={(e) => cambiar('fecha_ingreso', e.target.value)}
              aria-invalid={!!errores.fecha_ingreso}
            />
          </Campo>
          <Campo etiqueta="Motivo" error={errores.motivo} className="col-span-3">
            <textarea
              rows={3}
              maxLength={MAXIMO_MOTIVO}
              className={`${claseInput} h-auto py-3`}
              value={form.motivo}
              onChange={(e) => cambiar('motivo', e.target.value)}
              placeholder="Si queda vacío se registra como «Reingreso»"
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
            {guardando ? 'Registrando…' : 'Confirmar reingreso'}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
