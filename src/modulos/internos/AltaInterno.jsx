import { useEffect, useRef, useState } from 'react'
import { altaInterno, listarObrasSociales, verificarDni } from '../../api/internos'
import { Aviso, Boton, Campo, Etiqueta, claseInput } from '../../components/ui'

const MINIMO_CONTACTOS = 2

const contactoVacio = () => ({ clave: crypto.randomUUID(), nombre: '', parentesco: '', telefono: '', email: '' })

const formularioVacio = () => ({
  apellido: '',
  nombre: '',
  dni: '',
  fecha_nacimiento: '',
  fecha_ingreso: '',
  obra_social_id: '',
  judicializado: false,
  datos_salud: '',
  contactos: Array.from({ length: MINIMO_CONTACTOS }, contactoVacio),
})

function hoy() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DNI = /^\d{7,8}$/

const mensajeDuplicado = (interno) => `Ya hay un interno activo con este DNI: ${interno.apellido}, ${interno.nombre}`

function validar(f) {
  const errores = {}

  if (!f.apellido.trim()) errores.apellido = 'Falta el apellido'
  if (!f.nombre.trim()) errores.nombre = 'Falta el nombre'

  const dni = f.dni.trim()
  if (!dni) errores.dni = 'Falta el DNI'
  else if (!DNI.test(dni)) errores.dni = 'El DNI tiene que tener 7 u 8 números, sin puntos'

  if (f.fecha_nacimiento && f.fecha_nacimiento > hoy()) errores.fecha_nacimiento = 'No puede ser una fecha futura'
  if (f.fecha_ingreso && f.fecha_ingreso > hoy()) errores.fecha_ingreso = 'No puede ser una fecha futura'

  const contactos = f.contactos.map((c) => {
    const e = {}
    if (!c.nombre.trim()) e.nombre = 'Falta el nombre'
    if (!c.telefono.trim() && !c.email.trim()) e.telefono = 'Cargá un teléfono o un email'
    if (c.email.trim() && !EMAIL.test(c.email.trim())) e.email = 'El email no es válido'
    return e
  })
  if (contactos.some((e) => Object.keys(e).length)) errores.contactos = contactos

  if (f.contactos.length < MINIMO_CONTACTOS) {
    errores.contactosGeneral = `Hay que cargar al menos ${MINIMO_CONTACTOS} contactos familiares`
  }

  return errores
}

function armarCuerpo(f) {
  return {
    apellido: f.apellido.trim(),
    nombre: f.nombre.trim(),
    dni: f.dni.trim(),
    fecha_nacimiento: f.fecha_nacimiento || null,
    fecha_ingreso: f.fecha_ingreso || null,
    obra_social_id: f.obra_social_id ? Number(f.obra_social_id) : null,
    judicializado: f.judicializado ? 1 : 0,
    datos_salud: f.datos_salud.trim() || null,
    contactos: f.contactos.map(({ nombre, parentesco, telefono, email }) => ({
      nombre: nombre.trim(),
      parentesco: parentesco.trim() || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
    })),
  }
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'DNI_INVALIDO':
    case 'DNI_DUPLICADO':
      return { dni: err.message }
    case 'CONTACTOS_INSUFICIENTES':
    case 'CONTACTO_INVALIDO':
      return { contactosGeneral: err.message }
    case 'OBRA_SOCIAL_INEXISTENTE':
      return { obra_social_id: err.message }
    default:
      return { general: err.message }
  }
}

function Seccion({ titulo, children }) {
  return (
    <section className="border border-line bg-surface px-7 py-6 rounded-sm">
      <h2 className="mb-5 font-serif text-[20px] font-semibold text-ink">{titulo}</h2>
      {children}
    </section>
  )
}

export default function AltaInterno({ onCancelar, onCreado }) {
  const [form, setForm] = useState(formularioVacio)
  const [errores, setErrores] = useState({})
  const [obrasSociales, setObrasSociales] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [duplicado, setDuplicado] = useState(null)
  const arriba = useRef(null)
  const dniConsultado = useRef('')

  useEffect(() => {
    let vivo = true
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

  function cambiarDni(valor) {
    cambiar('dni', valor)
    if (valor !== dniConsultado.current) {
      dniConsultado.current = ''
      setDuplicado(null)
    }
  }

  async function consultarDni() {
    const dni = form.dni.trim()
    if (!DNI.test(dni) || dni === dniConsultado.current) return
    dniConsultado.current = dni
    try {
      const interno = await verificarDni(dni)
      if (dniConsultado.current === dni) setDuplicado(interno ? { dni, interno } : null)
    } catch {
      if (dniConsultado.current === dni) dniConsultado.current = ''
    }
  }

  function cambiarContacto(i, campo, valor) {
    setForm((f) => ({
      ...f,
      contactos: f.contactos.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)),
    }))
    setErrores((e) => {
      if (!e.contactos?.[i]) return e
      const contactos = e.contactos.slice()
      contactos[i] = { ...contactos[i], [campo]: undefined, ...(campo === 'email' || campo === 'telefono' ? { telefono: undefined } : {}) }
      return { ...e, contactos }
    })
  }

  function agregarContacto() {
    setForm((f) => ({ ...f, contactos: [...f.contactos, contactoVacio()] }))
  }

  function quitarContacto(i) {
    setForm((f) => ({ ...f, contactos: f.contactos.filter((_, j) => j !== i) }))
    setErrores((e) => (e.contactos ? { ...e, contactos: e.contactos.filter((_, j) => j !== i) } : e))
  }

  async function guardar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(form)
    if (!encontrados.dni && duplicado?.dni === form.dni.trim()) encontrados.dni = mensajeDuplicado(duplicado.interno)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) {
      arriba.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setGuardando(true)
    try {
      const interno = await altaInterno(armarCuerpo(form))
      onCreado(interno)
    } catch (err) {
      setErrores(errorDelBack(err))
      setGuardando(false)
      arriba.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const hayErrores = Object.values(errores).some(Boolean)
  const maximo = hoy()

  return (
    <form onSubmit={guardar} noValidate className="mx-auto max-w-4xl px-8 py-8">
      <div ref={arriba} className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Alta de interno</h1>
          <p className="mt-1 text-[15px] text-ink-soft">Los campos con * son obligatorios.</p>
        </div>
        <Boton icono="volver" variante="sutil" onClick={onCancelar} disabled={guardando}>
          Volver
        </Boton>
      </div>

      {hayErrores && (
        <div className="mb-6">
          <Aviso>{errores.general ?? 'Revisá los datos marcados antes de guardar.'}</Aviso>
        </div>
      )}

      <div className="space-y-6">
        <Seccion titulo="Datos personales">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Campo etiqueta="Apellido" obligatorio error={errores.apellido}>
              <input
                className={claseInput}
                value={form.apellido}
                onChange={(e) => cambiar('apellido', e.target.value)}
                aria-invalid={!!errores.apellido}
                autoFocus
              />
            </Campo>
            <Campo etiqueta="Nombre" obligatorio error={errores.nombre}>
              <input
                className={claseInput}
                value={form.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                aria-invalid={!!errores.nombre}
              />
            </Campo>
            <Campo etiqueta="DNI" obligatorio error={errores.dni ?? (duplicado && mensajeDuplicado(duplicado.interno))}>
              <input
                className={claseInput}
                value={form.dni}
                onChange={(e) => cambiarDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onBlur={consultarDni}
                inputMode="numeric"
                placeholder="Sin puntos"
                aria-invalid={!!errores.dni || !!duplicado}
              />
            </Campo>
            <Campo etiqueta="Fecha de nacimiento" error={errores.fecha_nacimiento}>
              <input
                type="date"
                className={claseInput}
                value={form.fecha_nacimiento}
                max={maximo}
                onChange={(e) => cambiar('fecha_nacimiento', e.target.value)}
                aria-invalid={!!errores.fecha_nacimiento}
              />
            </Campo>
            <Campo etiqueta="Fecha de ingreso" error={errores.fecha_ingreso}>
              <input
                type="date"
                className={claseInput}
                value={form.fecha_ingreso}
                max={maximo}
                onChange={(e) => cambiar('fecha_ingreso', e.target.value)}
                aria-invalid={!!errores.fecha_ingreso}
              />
              {!errores.fecha_ingreso && (
                <p className="mt-1.5 text-[14px] text-ink-soft">Si queda vacía se toma la de hoy. Después no se puede cambiar.</p>
              )}
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Salud y cobertura">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Campo etiqueta="Obra social" error={errores.obra_social_id}>
              <select
                className={claseInput}
                value={form.obra_social_id}
                onChange={(e) => cambiar('obra_social_id', e.target.value)}
                aria-invalid={!!errores.obra_social_id}
              >
                <option value="">Sin obra social</option>
                {obrasSociales.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <div>
              <Etiqueta>Situación judicial</Etiqueta>
              <label className="flex h-12 cursor-pointer items-center gap-3 text-[16px] text-ink">
                <input
                  type="checkbox"
                  className="h-5 w-5 cursor-pointer accent-rail"
                  checked={form.judicializado}
                  onChange={(e) => cambiar('judicializado', e.target.checked)}
                />
                Judicializado
              </label>
            </div>
            <Campo etiqueta="Datos de salud" className="col-span-2">
              <textarea
                rows={4}
                className={`${claseInput} h-auto py-3`}
                value={form.datos_salud}
                onChange={(e) => cambiar('datos_salud', e.target.value)}
                placeholder="Diagnósticos, medicación, alergias, observaciones"
              />
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Contactos familiares">
          <p className="-mt-3 mb-5 text-[15px] text-ink-soft">
            Mínimo {MINIMO_CONTACTOS}. Cada contacto necesita un teléfono o un email.
          </p>

          {errores.contactosGeneral && (
            <div className="mb-5">
              <Aviso>{errores.contactosGeneral}</Aviso>
            </div>
          )}

          <ol className="space-y-5">
            {form.contactos.map((c, i) => {
              const e = errores.contactos?.[i] ?? {}
              return (
                <li key={c.clave} className="border-t border-line pt-5 first:border-t-0 first:pt-0">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold text-ink">Contacto {i + 1}</p>
                    <Boton
                      icono="cruz"
                      variante="sutil"
                      className="h-10 px-3 text-[15px]"
                      onClick={() => quitarContacto(i)}
                      disabled={form.contactos.length <= MINIMO_CONTACTOS}
                      title={form.contactos.length <= MINIMO_CONTACTOS ? `Tiene que haber al menos ${MINIMO_CONTACTOS}` : undefined}
                    >
                      Quitar
                    </Boton>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Campo etiqueta="Nombre y apellido" obligatorio error={e.nombre}>
                      <input
                        className={claseInput}
                        value={c.nombre}
                        onChange={(ev) => cambiarContacto(i, 'nombre', ev.target.value)}
                        aria-invalid={!!e.nombre}
                      />
                    </Campo>
                    <Campo etiqueta="Parentesco">
                      <input
                        className={claseInput}
                        value={c.parentesco}
                        onChange={(ev) => cambiarContacto(i, 'parentesco', ev.target.value)}
                        placeholder="Hijo/a, sobrino/a…"
                      />
                    </Campo>
                    <Campo etiqueta="Teléfono" error={e.telefono}>
                      <input
                        type="tel"
                        className={claseInput}
                        value={c.telefono}
                        onChange={(ev) => cambiarContacto(i, 'telefono', ev.target.value)}
                        aria-invalid={!!e.telefono}
                      />
                    </Campo>
                    <Campo etiqueta="Email" error={e.email}>
                      <input
                        type="email"
                        className={claseInput}
                        value={c.email}
                        onChange={(ev) => cambiarContacto(i, 'email', ev.target.value)}
                        aria-invalid={!!e.email}
                      />
                    </Campo>
                  </div>
                </li>
              )
            })}
          </ol>

          <Boton icono="mas" variante="secundario" className="mt-6" onClick={agregarContacto}>
            Agregar contacto
          </Boton>
        </Seccion>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t border-line pt-6">
        <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>
        <Boton type="submit" icono="check" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar interno'}
        </Boton>
      </div>
    </form>
  )
}
