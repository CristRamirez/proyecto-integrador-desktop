import { useEffect, useState } from 'react'
import { MEDIO_OBRA_SOCIAL, listarMediosPago } from '../../api/cobranzas'
import { listarCategoriasEgreso, modificarEgreso, registrarEgreso } from '../../api/egresos'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { hoy } from '../internos/formato'
import { CATEGORIAS_SUGERIDAS, EGRESO_DESACTUALIZADO, capitalizar } from './egreso'

const MAXIMO_CONCEPTO = 200
const MAXIMO_CATEGORIA = 60
const MAXIMO_COMPROBANTE = 100
const MAXIMO_OBSERVACIONES = 500

function centavos(valor) {
  return Math.round(valor * 100) / 100
}

function formularioDe(egreso) {
  if (!egreso) {
    return { concepto: '', categoria: '', monto: '', medio_pago_id: '', fecha: hoy(), comprobante: '', observaciones: '' }
  }
  return {
    concepto: egreso.concepto ?? '',
    categoria: egreso.categoria ? capitalizar(egreso.categoria) : '',
    monto: String(egreso.monto),
    medio_pago_id: String(egreso.medio_pago_id ?? ''),
    fecha: String(egreso.fecha).slice(0, 10),
    comprobante: egreso.comprobante ?? '',
    observaciones: egreso.observaciones ?? '',
  }
}

function validar(form) {
  const errores = {}
  const concepto = form.concepto.trim()
  const categoria = form.categoria.trim()
  const monto = centavos(Number(form.monto))

  if (!concepto) errores.concepto = 'Falta el concepto'
  else if (concepto.length > MAXIMO_CONCEPTO) errores.concepto = `Máximo ${MAXIMO_CONCEPTO} caracteres`

  if (!categoria) errores.categoria = 'Falta la categoría'
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

export default function FormularioEgreso({ egreso, onCancelar, onGuardado, onDesactualizado }) {
  const [inicial] = useState(() => formularioDe(egreso))
  const [form, setForm] = useState(inicial)
  const [errores, setErrores] = useState({})
  const [mediosPago, setMediosPago] = useState(null)
  const [categorias, setCategorias] = useState(CATEGORIAS_SUGERIDAS)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vivo = true
    listarMediosPago()
      .then((lista) => vivo && setMediosPago(lista.filter((m) => m.nombre !== MEDIO_OBRA_SOCIAL)))
      .catch(() => vivo && setErrores((e) => ({ ...e, medio_pago_id: 'No se pudieron cargar los medios de pago' })))
    listarCategoriasEgreso()
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
      const cuerpo = armarCuerpo(form)
      onGuardado(egreso ? await modificarEgreso(egreso.id, cuerpo) : await registrarEgreso(cuerpo))
    } catch (err) {
      if (egreso && EGRESO_DESACTUALIZADO.includes(err.codigo)) {
        onDesactualizado(err.message)
        return
      }
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  const sinCambios = !!egreso && JSON.stringify(armarCuerpo(form)) === JSON.stringify(armarCuerpo(inicial))
  let textoBoton = guardando ? 'Registrando…' : 'Registrar egreso'
  if (egreso) textoBoton = guardando ? 'Guardando…' : 'Guardar cambios'

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo={egreso ? 'Editar egreso' : 'Registrar egreso'}>
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          {egreso
            ? `Cargado por ${egreso.registrado_por ?? 'otro usuario'}. Los cambios quedan registrados en la auditoría.`
            : 'Gasto de la institución, no atado a ningún interno. Se suma a los egresos del mes de la fecha que elijas.'}
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
              placeholder="Factura de luz de octubre"
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

          <Campo etiqueta="Categoría" obligatorio error={errores.categoria}>
            <input
              type="text"
              list="categorias-egreso"
              maxLength={MAXIMO_CATEGORIA}
              className={claseInput}
              value={form.categoria}
              onChange={(e) => cambiar('categoria', e.target.value)}
              placeholder="Elegir o escribir una nueva"
              aria-invalid={!!errores.categoria}
            />
            <datalist id="categorias-egreso">
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

          <Campo etiqueta="Número de comprobante" error={errores.comprobante}>
            <input
              type="text"
              maxLength={MAXIMO_COMPROBANTE}
              className={`${claseInput} font-mono`}
              value={form.comprobante}
              onChange={(e) => cambiar('comprobante', e.target.value)}
              placeholder="B-0001-00012345"
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
          <Boton type="submit" icono="check" disabled={guardando || sinCambios}>
            {textoBoton}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
