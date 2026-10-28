import { useState } from 'react'
import { crearUsuario, modificarUsuario } from '../../api/usuarios'
import { Aviso, Boton, Campo, Seccion, claseInput } from '../../components/ui'
import { MAXIMO_PASSWORD, MINIMO_PASSWORD, etiquetaRol, validarPassword } from './usuario'

// Mismas reglas que el back: el nombre de usuario se guarda en minúsculas y solo
// admite letras sin acento, números, punto, guion y guion bajo.
const NOMBRE_USUARIO = /^[a-z0-9._-]{3,40}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAXIMO_NOMBRE = 120
const MAXIMO_EMAIL = 120

function formularioDesde(usuario) {
  return {
    nombre_usuario: usuario?.nombre_usuario ?? '',
    nombre_completo: usuario?.nombre_completo ?? '',
    email: usuario?.email ?? '',
    rol_id: usuario ? String(usuario.rol_id) : '',
    password: '',
    repetida: '',
  }
}

function armarCuerpo(form, editando) {
  const cuerpo = {
    nombre_usuario: form.nombre_usuario.trim().toLowerCase(),
    nombre_completo: form.nombre_completo.trim(),
    email: form.email.trim() || null,
    rol_id: Number(form.rol_id),
  }
  if (!editando) cuerpo.password = form.password
  return cuerpo
}

function validar(form, editando, original) {
  const errores = {}
  const nombreUsuario = form.nombre_usuario.trim().toLowerCase()
  const email = form.email.trim()

  if (!nombreUsuario) errores.nombre_usuario = 'Falta el nombre de usuario'
  else if (!NOMBRE_USUARIO.test(nombreUsuario))
    errores.nombre_usuario = 'De 3 a 40 caracteres: letras sin acento, números, punto, guion o guion bajo'

  if (!form.nombre_completo.trim()) errores.nombre_completo = 'Falta el nombre y apellido'
  else if (form.nombre_completo.trim().length > MAXIMO_NOMBRE) errores.nombre_completo = `Máximo ${MAXIMO_NOMBRE} caracteres`

  if (email.length > MAXIMO_EMAIL) errores.email = `Máximo ${MAXIMO_EMAIL} caracteres`
  else if (email && !EMAIL.test(email)) errores.email = 'El email no tiene un formato válido'

  if (!form.rol_id) errores.rol_id = 'Falta el rol'

  if (!editando) Object.assign(errores, validarPassword(form.password, form.repetida))

  if (editando && !Object.keys(errores).length) {
    const cuerpo = armarCuerpo(form, true)
    const sinCambios =
      cuerpo.nombre_usuario === original.nombre_usuario &&
      cuerpo.nombre_completo === original.nombre_completo &&
      (cuerpo.email ?? null) === (original.email ?? null) &&
      cuerpo.rol_id === original.rol_id
    if (sinCambios) errores.general = 'No hay cambios para guardar.'
  }

  return errores
}

function errorDelBack(err) {
  switch (err.codigo) {
    case 'NOMBRE_USUARIO_INVALIDO':
    case 'USUARIO_DUPLICADO':
      return { nombre_usuario: err.message }
    case 'NOMBRE_INVALIDO':
      return { nombre_completo: err.message }
    case 'EMAIL_INVALIDO':
    case 'EMAIL_DUPLICADO':
      return { email: err.message }
    case 'PASSWORD_INVALIDA':
      return { password: err.message }
    case 'ROL_INEXISTENTE':
      return { rol_id: err.message }
    default:
      return { general: err.message }
  }
}

export default function FormularioUsuario({ usuario, roles, onCancelar, onGuardado }) {
  const editando = !!usuario
  const [form, setForm] = useState(() => formularioDesde(usuario))
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  async function confirmar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrados = validar(form, editando, usuario)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return

    setGuardando(true)
    try {
      const cuerpo = armarCuerpo(form, editando)
      onGuardado(editando ? await modificarUsuario(usuario.id, cuerpo) : await crearUsuario(cuerpo))
    } catch (err) {
      setErrores(errorDelBack(err))
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={confirmar} noValidate>
      <Seccion titulo="Datos del usuario">
        {errores.general && (
          <div className="mb-5">
            <Aviso>{errores.general}</Aviso>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Campo etiqueta="Nombre de usuario" obligatorio error={errores.nombre_usuario}>
            <input
              type="text"
              className={`${claseInput} font-mono`}
              value={form.nombre_usuario}
              onChange={(e) => cambiar('nombre_usuario', e.target.value)}
              maxLength={40}
              autoComplete="off"
              spellCheck={false}
              placeholder="mcarrasco"
              aria-invalid={!!errores.nombre_usuario}
              autoFocus
            />
            {!errores.nombre_usuario && (
              <p className="mt-1.5 text-[14px] text-ink-soft">Es con el que inicia sesión. Se guarda en minúsculas.</p>
            )}
          </Campo>

          <Campo etiqueta="Nombre y apellido" obligatorio error={errores.nombre_completo}>
            <input
              type="text"
              className={claseInput}
              value={form.nombre_completo}
              onChange={(e) => cambiar('nombre_completo', e.target.value)}
              maxLength={MAXIMO_NOMBRE}
              aria-invalid={!!errores.nombre_completo}
            />
          </Campo>

          <Campo etiqueta="Email" error={errores.email}>
            <input
              type="email"
              className={claseInput}
              value={form.email}
              onChange={(e) => cambiar('email', e.target.value)}
              maxLength={MAXIMO_EMAIL}
              autoComplete="off"
              aria-invalid={!!errores.email}
            />
          </Campo>

          <Campo etiqueta="Rol" obligatorio error={errores.rol_id}>
            <select
              className={claseInput}
              value={form.rol_id}
              onChange={(e) => cambiar('rol_id', e.target.value)}
              aria-invalid={!!errores.rol_id}
            >
              <option value="">Elegir…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {etiquetaRol(r.nombre)}
                </option>
              ))}
            </select>
            {!errores.rol_id && (
              <p className="mt-1.5 text-[14px] text-ink-soft">El rol decide qué módulos ve en el menú.</p>
            )}
          </Campo>

          {!editando && (
            <>
              <Campo etiqueta="Contraseña" obligatorio error={errores.password}>
                <input
                  type="password"
                  className={claseInput}
                  value={form.password}
                  onChange={(e) => cambiar('password', e.target.value)}
                  maxLength={MAXIMO_PASSWORD}
                  autoComplete="new-password"
                  aria-invalid={!!errores.password}
                />
                {!errores.password && (
                  <p className="mt-1.5 text-[14px] text-ink-soft">Al menos {MINIMO_PASSWORD} caracteres.</p>
                )}
              </Campo>
              <Campo etiqueta="Repetir contraseña" obligatorio error={errores.repetida}>
                <input
                  type="password"
                  className={claseInput}
                  value={form.repetida}
                  onChange={(e) => cambiar('repetida', e.target.value)}
                  maxLength={MAXIMO_PASSWORD}
                  autoComplete="new-password"
                  aria-invalid={!!errores.repetida}
                />
              </Campo>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" icono="check" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
          </Boton>
        </div>
      </Seccion>
    </form>
  )
}
