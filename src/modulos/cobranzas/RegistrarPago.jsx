import { useEffect, useState } from 'react'
import { MEDIO_OBRA_SOCIAL, listarMediosPago, registrarPago } from '../../api/cobranzas'
import { listarObrasSociales } from '../../api/internos'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { fecha, hoy, moneda, periodo } from '../internos/formato'

const MAXIMO_COMPROBANTE = 50
const MAXIMO_OBSERVACIONES = 500

// Si la cuota cambió del lado del back (la pagó otro, la anularon) el formulario ya
// no sirve: se cierra y se recarga la cuenta corriente.
const CUOTA_DESACTUALIZADA = ['CUOTA_SIN_SALDO', 'CUOTA_ANULADA', 'CUOTA_NO_ENCONTRADA']

function centavos(valor) {
  return Math.round(valor * 100) / 100
}

function etiqueta(nombre) {
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

function validar(form, saldo, porObraSocial) {
  const errores = {}
  const monto = centavos(Number(form.monto))

  if (form.monto === '') errores.monto = 'Falta el monto'
  else if (!Number.isFinite(monto) || monto <= 0) errores.monto = 'Tiene que ser un número mayor a cero'
  else if (monto > saldo) errores.monto = `No puede superar el saldo pendiente (${moneda(saldo)})`

  if (!form.medio_pago_id) errores.medio_pago_id = 'Falta el medio de pago'
  else if (porObraSocial && !form.obra_social_id) errores.obra_social_id = 'Falta la obra social que paga'

  if (!form.fecha_pago) errores.fecha_pago = 'Falta la fecha de pago'
  else if (form.fecha_pago > hoy()) errores.fecha_pago = 'No puede ser una fecha futura'

  if (form.numero_comprobante.trim().length > MAXIMO_COMPROBANTE)
    errores.numero_comprobante = `Máximo ${MAXIMO_COMPROBANTE} caracteres`
  if (form.observaciones.trim().length > MAXIMO_OBSERVACIONES)
    errores.observaciones = `Máximo ${MAXIMO_OBSERVACIONES} caracteres`

  return errores
}

function armarCuerpo(form, porObraSocial) {
  const cuerpo = {
    medio_pago_id: Number(form.medio_pago_id),
    monto: centavos(Number(form.monto)),
    fecha_pago: form.fecha_pago,
  }
  const comprobante = form.numero_comprobante.trim()
  const observaciones = form.observaciones.trim()

  if (comprobante) cuerpo.numero_comprobante = comprobante
  if (observaciones) cuerpo.observaciones = observaciones
  if (porObraSocial) cuerpo.obra_social_id = Number(form.obra_social_id)

  return cuerpo
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'MONTO_INVALIDO':
    case 'MONTO_MAYOR_AL_SALDO':
      return { monto: err.message }
    case 'MEDIO_PAGO_INEXISTENTE':
      return { medio_pago_id: err.message }
    case 'OBRA_SOCIAL_REQUERIDA':
    case 'OBRA_SOCIAL_INEXISTENTE':
      return { obra_social_id: err.message }
    case 'FECHA_INVALIDA':
      return { fecha_pago: err.message }
    case 'COMPROBANTE_INVALIDO':
      return { numero_comprobante: err.message }
    case 'OBSERVACIONES_INVALIDAS':
      return { observaciones: err.message }
    default:
      return { general: err.message }
  }
}

export default function RegistrarPago({ cuota, onCancelar, onRegistrado, onDesactualizada }) {
  const saldo = centavos(cuota.saldo_pendiente)
  const [form, setForm] = useState({
    monto: String(saldo),
    medio_pago_id: '',
    obra_social_id: '',
    fecha_pago: hoy(),
    numero_comprobante: '',
    observaciones: '',
  })
  const [errores, setErrores] = useState({})
  const [mediosPago, setMediosPago] = useState(null)
  const [obrasSociales, setObrasSociales] = useState([])
  const [guardando, setGuardando] = useState(false)
  const medioElegido = mediosPago?.find((m) => String(m.id) === form.medio_pago_id)
  const porObraSocial = medioElegido?.nombre === MEDIO_OBRA_SOCIAL
  const monto = centavos(Number(form.monto))

  useEffect(() => {
    let vivo = true
    listarMediosPago()
      .then((lista) => vivo && setMediosPago(lista))
      .catch(() => vivo && setErrores((e) => ({ ...e, medio_pago_id: 'No se pudieron cargar los medios de pago' })))
    listarObrasSociales()
      .then((lista) => vivo && setObrasSociales(lista))
      .catch(() => vivo && setErrores((e) => ({ ...e, obra_social_id: 'No se pudieron cargar las obras sociales' })))
    return () => {
      vivo = false
    }
  }, [])

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  async function confirmar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(form, saldo, porObraSocial)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      onRegistrado(await registrarPago(cuota.id, armarCuerpo(form, porObraSocial)))
    } catch (err) {
      if (CUOTA_DESACTUALIZADA.includes(err.codigo)) {
        onDesactualizada(err.message)
        return
      }
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  let resultado = null
  if (!errores.monto && monto > 0 && monto <= saldo) {
    resultado = monto === saldo ? 'Pago total: la cuota queda pagada.' : `Pago parcial: quedan ${moneda(centavos(saldo - monto))}.`
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo="Registrar pago">
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          Cuota de {periodo(cuota.periodo)} · vence el {fecha(cuota.fecha_vencimiento)} · saldo pendiente{' '}
          <span className="font-mono font-semibold text-ink">{moneda(saldo)}</span>
        </p>

        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <Campo etiqueta="Monto" obligatorio error={errores.monto}>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              max={saldo}
              step="0.01"
              className={`${claseInput} font-mono`}
              value={form.monto}
              onChange={(e) => cambiar('monto', e.target.value)}
              aria-invalid={!!errores.monto}
              autoFocus
            />
            {resultado && <p className="mt-1.5 text-[14px] text-ink-soft">{resultado}</p>}
          </Campo>

          <Campo etiqueta="Medio de pago" obligatorio error={errores.medio_pago_id}>
            <select
              className={claseInput}
              value={form.medio_pago_id}
              onChange={(e) => {
                cambiar('medio_pago_id', e.target.value)
                setErrores((er) => ({ ...er, obra_social_id: undefined }))
              }}
              aria-invalid={!!errores.medio_pago_id}
              disabled={!mediosPago}
            >
              <option value="">{mediosPago ? 'Elegir…' : 'Cargando…'}</option>
              {(mediosPago ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {etiqueta(m.nombre)}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Fecha de pago" obligatorio error={errores.fecha_pago}>
            <input
              type="date"
              className={claseInput}
              value={form.fecha_pago}
              max={hoy()}
              onChange={(e) => cambiar('fecha_pago', e.target.value)}
              aria-invalid={!!errores.fecha_pago}
            />
          </Campo>

          {porObraSocial && (
            <Campo etiqueta="Obra social que paga" obligatorio error={errores.obra_social_id}>
              <select
                className={claseInput}
                value={form.obra_social_id}
                onChange={(e) => cambiar('obra_social_id', e.target.value)}
                aria-invalid={!!errores.obra_social_id}
              >
                <option value="">Elegir…</option>
                {obrasSociales.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.nombre}
                  </option>
                ))}
              </select>
            </Campo>
          )}

          <Campo etiqueta="Número de comprobante" error={errores.numero_comprobante}>
            <input
              type="text"
              maxLength={MAXIMO_COMPROBANTE}
              className={`${claseInput} font-mono`}
              value={form.numero_comprobante}
              onChange={(e) => cambiar('numero_comprobante', e.target.value)}
              placeholder="0001-00012345"
              aria-invalid={!!errores.numero_comprobante}
            />
          </Campo>

          <Campo etiqueta="Observaciones" error={errores.observaciones} className="col-span-3">
            <textarea
              rows={2}
              maxLength={MAXIMO_OBSERVACIONES}
              className={`${claseInput} h-auto py-3`}
              value={form.observaciones}
              onChange={(e) => cambiar('observaciones', e.target.value)}
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
            {guardando ? 'Registrando…' : 'Confirmar pago'}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
