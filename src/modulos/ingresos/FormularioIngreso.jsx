import { useEffect, useState } from 'react'
import { MEDIO_OBRA_SOCIAL, listarMediosPago } from '../../api/cobranzas'
import { listarCategoriasIngreso, registrarIngreso } from '../../api/ingresos'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { capitalizar } from '../egresos/egreso'
import { hoy } from '../internos/formato'
import { CATEGORIAS_SUGERIDAS } from './ingreso'

const MAXIMO_CONCEPTO = 200
const MAXIMO_CATEGORIA = 60
const MAXIMO_COMPROBANTE = 100
const MAXIMO_OBSERVACIONES = 500

function centavos(valor) {
  return Math.round(valor * 100) / 100
}

const formularioVacio = () => ({
  concepto: '',
  categoria: '',
  monto: '',
  medio_pago_id: '',
  fecha: hoy(),
  comprobante: '',
  observaciones: '',
})

function validar(form) {
  const errores = {}
  const concepto = form.concepto.trim()
  const categoria = form.categoria.trim()
  const monto = centavos(Number(form.monto))

  if (!concepto) errores.concepto = 'Falta el concepto'
  else if (concepto.length > MAXIMO_CONCEPTO) errores.concepto = `Máximo ${MAXIMO_CONCEPTO} caracteres`

  if (!categoria) errores.categoria = 'Falta el origen'
  else if (categoria.length > MAXIMO_CATEGORIA) errores.categoria = `Máximo ${MAXIMO_CATEGORIA} caracteres`

  if (form.monto === '') errores.monto = 'Falta el monto'
  else if (!Number.isFinite(monto) || monto <= 0) errores.monto = 'Tiene que ser un número mayor a cero'

  if (!form.medio_pago_id) errores.medio_pago_id = 'Falta el medio de pago'

  if (!form.fecha) errores.fecha = 'Falta la fecha'
  else if (form.fecha > hoy()) errores.fecha = 'No puede ser una fecha futura'

  if (form.comprobante.trim().length > MAXIMO_COMPROBANTE) errores.comprobante = `Máximo ${MAXIMO_COMPROBANTE} caracteres`
  if (form.observaciones.trim().length > MAXIMO_OBSERVACIONES)
    errores.observaciones = `Máximo ${MAXIMO_OBSERVACIONES} caracteres`

  return errores
}

function armarCuerpo(form) {
  const cuerpo = {
    concepto: form.concepto.trim(),
    categoria: form.categoria.trim().toLowerCase(),
    monto: centavos(Number(form.monto)),
    medio_pago_id: Number(form.medio_pago_id),
    fecha: form.fecha,
  }
  const comprobante = form.comprobante.trim()
  const observaciones = form.observaciones.trim()

  if (comprobante) cuerpo.comprobante = comprobante
  if (observaciones) cuerpo.observaciones = observaciones

  return cuerpo
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'CONCEPTO_INVALIDO':
      return { concepto: err.message }
    case 'CATEGORIA_INVALIDA':
      return { categoria: err.message }
    case 'MONTO_INVALIDO':
      return { monto: err.message }
    case 'MEDIO_PAGO_INEXISTENTE':
      return { medio_pago_id: err.message }
    case 'FECHA_INVALIDA':
      return { fecha: err.message }
    case 'COMPROBANTE_INVALIDO':
      return { comprobante: err.message }
    case 'OBSERVACIONES_INVALIDAS':
      return { observaciones: err.message }
    default:
      return { general: err.message }
  }
}

// Un ingreso no se edita: si se cargó mal, se anula y se vuelve a cargar.
export default function FormularioIngreso({ onCancelar, onGuardado }) {
  const [form, setForm] = useState(formularioVacio)
  const [errores, setErrores] = useState({})
  const [mediosPago, setMediosPago] = useState(null)
  const [categorias, setCategorias] = useState(CATEGORIAS_SUGERIDAS)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vivo = true
    listarMediosPago()
      .then((lista) => vivo && setMediosPago(lista.filter((m) => m.nombre !== MEDIO_OBRA_SOCIAL)))
      .catch(() => vivo && setErrores((e) => ({ ...e, medio_pago_id: 'No se pudieron cargar los medios de pago' })))
    listarCategoriasIngreso()
      .then((usadas) => vivo && setCategorias([...new Set([...usadas, ...CATEGORIAS_SUGERIDAS])].sort()))
      .catch(() => {})
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

    const encontrados = validar(form)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      onGuardado(await registrarIngreso(armarCuerpo(form)))
    } catch (err) {
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo="Registrar ingreso">
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          Plata que entra a la institución y no es una cuota: donaciones, subsidios, eventos. Se suma a los ingresos
          del mes de la fecha que elijas.
        </p>

        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <Campo etiqueta="Concepto" obligatorio error={errores.concepto} className="col-span-2">
            <input
              type="text"
              maxLength={MAXIMO_CONCEPTO}
              className={claseInput}
              value={form.concepto}
              onChange={(e) => cambiar('concepto', e.target.value)}
              placeholder="Donación de la cooperadora"
              aria-invalid={!!errores.concepto}
              autoFocus
            />
          </Campo>

          <Campo etiqueta="Monto" obligatorio error={errores.monto}>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              className={`${claseInput} font-mono`}
              value={form.monto}
              onChange={(e) => cambiar('monto', e.target.value)}
              placeholder="0,00"
              aria-invalid={!!errores.monto}
            />
          </Campo>

          <Campo etiqueta="Origen" obligatorio error={errores.categoria}>
            <input
              type="text"
              list="categorias-ingreso"
              maxLength={MAXIMO_CATEGORIA}
              className={claseInput}
              value={form.categoria}
              onChange={(e) => cambiar('categoria', e.target.value)}
              placeholder="Elegir o escribir uno nuevo"
              aria-invalid={!!errores.categoria}
            />
            <datalist id="categorias-ingreso">
              {categorias.map((c) => (
                <option key={c} value={capitalizar(c)} />
              ))}
            </datalist>
          </Campo>

          <Campo etiqueta="Medio de pago" obligatorio error={errores.medio_pago_id}>
            <select
              className={claseInput}
              value={form.medio_pago_id}
              onChange={(e) => cambiar('medio_pago_id', e.target.value)}
              aria-invalid={!!errores.medio_pago_id}
              disabled={!mediosPago}
            >
              <option value="">{mediosPago ? 'Elegir…' : 'Cargando…'}</option>
              {(mediosPago ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {capitalizar(m.nombre)}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Fecha" obligatorio error={errores.fecha}>
            <input
              type="date"
              className={claseInput}
              value={form.fecha}
              max={hoy()}
              onChange={(e) => cambiar('fecha', e.target.value)}
              aria-invalid={!!errores.fecha}
            />
          </Campo>

          <Campo etiqueta="Número de recibo" error={errores.comprobante}>
            <input
              type="text"
              maxLength={MAXIMO_COMPROBANTE}
              className={`${claseInput} font-mono`}
              value={form.comprobante}
              onChange={(e) => cambiar('comprobante', e.target.value)}
              placeholder="R-0001-00000123"
              aria-invalid={!!errores.comprobante}
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
            {guardando ? 'Registrando…' : 'Registrar ingreso'}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
