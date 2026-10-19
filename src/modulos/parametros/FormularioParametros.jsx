import { useState } from 'react'
import { guardarParametros } from '../../api/parametros'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'

const MAXIMO_OBSERVACIONES = 500

function formularioDesde(vigente) {
  return {
    valor_cuota: vigente ? String(vigente.valor_cuota) : '',
    valor_mora: vigente ? String(vigente.valor_mora) : '0',
    dia_vencimiento: vigente ? String(vigente.dia_vencimiento) : '10',
    observaciones: '',
  }
}

function validar(form, vigente) {
  const errores = {}
  const cuota = Number(form.valor_cuota)
  const mora = form.valor_mora === '' ? 0 : Number(form.valor_mora)
  const dia = Number(form.dia_vencimiento)

  if (form.valor_cuota === '') errores.valor_cuota = 'Falta el valor de la cuota'
  else if (!Number.isFinite(cuota) || cuota <= 0) errores.valor_cuota = 'Tiene que ser un número mayor a cero'

  if (!Number.isFinite(mora) || mora < 0) errores.valor_mora = 'Tiene que ser un número mayor o igual a cero'

  if (form.dia_vencimiento === '') errores.dia_vencimiento = 'Falta el día de vencimiento'
  else if (!Number.isInteger(dia) || dia < 1 || dia > 31) errores.dia_vencimiento = 'Tiene que ser un día entre 1 y 31'

  if (form.observaciones.trim().length > MAXIMO_OBSERVACIONES)
    errores.observaciones = `Máximo ${MAXIMO_OBSERVACIONES} caracteres`

  // Guardar lo mismo solo sumaría una fila repetida al histórico.
  const iguales =
    vigente && cuota === vigente.valor_cuota && mora === vigente.valor_mora && dia === vigente.dia_vencimiento
  if (!Object.keys(errores).length && iguales) errores.general = 'Los valores son los mismos que los vigentes.'

  return errores
}

function armarCuerpo(form) {
  const cuerpo = {
    valor_cuota: Number(form.valor_cuota),
    valor_mora: form.valor_mora === '' ? 0 : Number(form.valor_mora),
    dia_vencimiento: Number(form.dia_vencimiento),
  }
  const observaciones = form.observaciones.trim()
  if (observaciones) cuerpo.observaciones = observaciones
  return cuerpo
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'DIA_INVALIDO':
      return { dia_vencimiento: err.message }
    case 'OBSERVACIONES_INVALIDAS':
      return { observaciones: err.message }
    default:
      return { general: err.message }
  }
}

export default function FormularioParametros({ vigente, onCancelar, onGuardado }) {
  const [form, setForm] = useState(() => formularioDesde(vigente))
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const dia = Number(form.dia_vencimiento)

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  async function confirmar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(form, vigente)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      onGuardado(await guardarParametros(armarCuerpo(form)))
    } catch (err) {
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo={vigente ? 'Cambiar valores' : 'Cargar parámetros'}>
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          Rigen desde que se guardan, para las cuotas que se generen de ahí en adelante. Las cuotas ya generadas no
          cambian y los valores anteriores quedan en el histórico.
        </p>

        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <Campo etiqueta="Valor de la cuota" obligatorio error={errores.valor_cuota}>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              className={`${claseInput} font-mono`}
              value={form.valor_cuota}
              onChange={(e) => cambiar('valor_cuota', e.target.value)}
              aria-invalid={!!errores.valor_cuota}
              autoFocus
            />
          </Campo>

          <Campo etiqueta="Interés por mora" error={errores.valor_mora}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`${claseInput} font-mono`}
              value={form.valor_mora}
              onChange={(e) => cambiar('valor_mora', e.target.value)}
              aria-invalid={!!errores.valor_mora}
            />
            {!errores.valor_mora && <p className="mt-1.5 text-[14px] text-ink-soft">Por pago fuera de término.</p>}
          </Campo>

          <Campo etiqueta="Día de vencimiento" obligatorio error={errores.dia_vencimiento}>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              step="1"
              className={`${claseInput} font-mono`}
              value={form.dia_vencimiento}
              onChange={(e) => cambiar('dia_vencimiento', e.target.value)}
              aria-invalid={!!errores.dia_vencimiento}
            />
            {!errores.dia_vencimiento && dia > 28 && dia <= 31 && (
              <p className="mt-1.5 text-[14px] text-ink-soft">En los meses que no lo tienen, vence el último día.</p>
            )}
          </Campo>

          <Campo etiqueta="Observaciones" error={errores.observaciones} className="col-span-3">
            <textarea
              rows={2}
              maxLength={MAXIMO_OBSERVACIONES}
              className={`${claseInput} h-auto py-3`}
              value={form.observaciones}
              onChange={(e) => cambiar('observaciones', e.target.value)}
              placeholder="Aumento de noviembre, ajuste por inflación…"
              aria-invalid={!!errores.observaciones}
            />
            <p className="mt-1.5 text-right font-mono text-[12px] text-ink-soft">
              {form.observaciones.length}/{MAXIMO_OBSERVACIONES}
            </p>
          </Campo>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" icono="check" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar valores'}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
