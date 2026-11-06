import { useState } from 'react'
import { crearClave, modificarClave } from '../../api/claves'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { CLAVE_DESACTUALIZADA } from './clave'

const MAXIMO_SERVICIO = 60
const MAXIMO_DESCRIPCION = 200
const MINIMO_VALOR = 8
const MAXIMO_VALOR = 500

function validar(form, editando) {
  const errores = {}
  const servicio = form.servicio.trim()
  const valor = form.valor.trim()

  if (!servicio) errores.servicio = 'Falta el servicio'
  else if (servicio.length > MAXIMO_SERVICIO) errores.servicio = `Máximo ${MAXIMO_SERVICIO} caracteres`

  if (form.descripcion.trim().length > MAXIMO_DESCRIPCION) errores.descripcion = `Máximo ${MAXIMO_DESCRIPCION} caracteres`

  if (!valor && !editando) errores.valor = 'Falta la clave'
  else if (valor && (valor.length < MINIMO_VALOR || valor.length > MAXIMO_VALOR))
    errores.valor = `Tiene que tener entre ${MINIMO_VALOR} y ${MAXIMO_VALOR} caracteres`

  return errores
}

function armarCuerpo(form) {
  const cuerpo = { servicio: form.servicio.trim().toLowerCase(), descripcion: form.descripcion.trim() || null }
  const valor = form.valor.trim()
  if (valor) cuerpo.valor = valor
  return cuerpo
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'SERVICIO_INVALIDO':
    case 'SERVICIO_DUPLICADO':
      return { servicio: err.message }
    case 'DESCRIPCION_INVALIDA':
      return { descripcion: err.message }
    case 'CLAVE_INVALIDA':
      return { valor: err.message }
    default:
      return { general: err.message }
  }
}

export default function FormularioClave({ clave, onCancelar, onGuardado, onDesactualizado }) {
  const editando = !!clave
  const [form, setForm] = useState({ servicio: clave?.servicio ?? '', descripcion: clave?.descripcion ?? '', valor: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  async function confirmar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(form, editando)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      const cuerpo = armarCuerpo(form)
      onGuardado(editando ? await modificarClave(clave.id, cuerpo) : await crearClave(cuerpo))
    } catch (err) {
      if (editando && CLAVE_DESACTUALIZADA.includes(err.codigo)) {
        onDesactualizado(err.message)
        return
      }
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  let textoBoton = guardando ? 'Guardando…' : 'Guardar clave'
  if (editando) textoBoton = guardando ? 'Guardando…' : 'Guardar cambios'

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo={editando ? `Editar la clave de ${clave.servicio}` : 'Nueva clave'}>
        <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
          {editando
            ? `Termina en ${clave.termina_en}. Dejá la clave vacía para no cambiarla.`
            : 'Una vez guardada no se vuelve a mostrar: solo se ven sus últimos 4 caracteres.'}
        </p>

        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Campo etiqueta="Servicio" obligatorio error={errores.servicio}>
            <input
              type="text"
              maxLength={MAXIMO_SERVICIO}
              className={`${claseInput} font-mono`}
              value={form.servicio}
              onChange={(e) => cambiar('servicio', e.target.value)}
              placeholder="mercadopago"
              aria-invalid={!!errores.servicio}
              autoFocus
            />
          </Campo>

          <Campo etiqueta={editando ? 'Clave nueva' : 'Clave'} obligatorio={!editando} error={errores.valor}>
            <input
              type="password"
              maxLength={MAXIMO_VALOR}
              className={`${claseInput} font-mono`}
              value={form.valor}
              onChange={(e) => cambiar('valor', e.target.value)}
              placeholder={editando ? 'Sin cambios' : undefined}
              autoComplete="new-password"
              aria-invalid={!!errores.valor}
            />
          </Campo>

          <Campo etiqueta="Para qué se usa" error={errores.descripcion} className="col-span-2">
            <input
              type="text"
              maxLength={MAXIMO_DESCRIPCION}
              className={claseInput}
              value={form.descripcion}
              onChange={(e) => cambiar('descripcion', e.target.value)}
              placeholder="Cobro de cuotas con link de pago"
              aria-invalid={!!errores.descripcion}
            />
          </Campo>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" icono="check" disabled={guardando}>
            {textoBoton}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
