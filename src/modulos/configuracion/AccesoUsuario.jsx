import { useState } from 'react'
import { cambiarEstadoUsuario, desbloquearUsuario, reiniciarPassword } from '../../api/usuarios'
import { Aviso, Boton, Campo, Dato, Marca, Seccion, claseInput } from '../../components/ui'
import { fecha } from '../internos/formato'
import { MAXIMO_PASSWORD, MINIMO_PASSWORD, validarPassword } from './usuario'

// Contraseña, bloqueo y estado tienen endpoints propios en el back, por eso van
// aparte de los datos: cada acción se aplica sola y avisa el resultado.
export default function AccesoUsuario({ usuario, esPropio, onActualizado }) {
  const [abierto, setAbierto] = useState(null)
  const [form, setForm] = useState({ password: '', repetida: '' })
  const [errores, setErrores] = useState({})
  const [trabajando, setTrabajando] = useState(false)
  const habilitado = !!usuario.activo
  const quien = usuario.nombre_completo || usuario.nombre_usuario

  function abrir(cual) {
    setAbierto(cual)
    setErrores({})
    setForm({ password: '', repetida: '' })
  }

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  async function ejecutar(accion, mensaje) {
    if (trabajando) return
    setTrabajando(true)
    setErrores({})
    try {
      const actualizado = await accion()
      setAbierto(null)
      onActualizado(actualizado, mensaje)
    } catch (err) {
      setErrores(err.codigo === 'PASSWORD_INVALIDA' ? { password: err.message } : { general: err.message })
    } finally {
      setTrabajando(false)
    }
  }

  function guardarPassword(e) {
    e.preventDefault()
    const encontrados = validarPassword(form.password, form.repetida)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return
    ejecutar(
      () => reiniciarPassword(usuario.id, form.password),
      `Se cambió la contraseña de ${quien}. Si estaba bloqueado, ya puede volver a ingresar.`
    )
  }

  return (
    <Seccion titulo="Acceso">
      <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
        <Dato etiqueta="Estado">
          <span className="flex flex-wrap items-center gap-2">
            {habilitado ? 'Habilitado' : 'Deshabilitado'}
            {usuario.bloqueado && <Marca tono="peligro">Bloqueado</Marca>}
          </span>
        </Dato>
        <Dato etiqueta="Inicio de sesión">
          {!habilitado
            ? 'No puede ingresar'
            : usuario.bloqueado
              ? 'Bloqueado por intentos fallidos'
              : 'Puede ingresar'}
        </Dato>
        <Dato etiqueta="Alta">{fecha(usuario.creado_en)}</Dato>
      </dl>

      {errores.general && (
        <div className="mt-5">
          <Aviso>{errores.general}</Aviso>
        </div>
      )}

      {abierto === 'password' && (
        <form onSubmit={guardarPassword} noValidate className="mt-6 border-t border-line pt-6">
          <p className="mb-4 text-[15px] text-ink-soft">
            Para cuando se olvidó la contraseña. Además de cambiarla, saca el bloqueo por intentos fallidos.
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Campo etiqueta="Contraseña nueva" obligatorio error={errores.password}>
              <input
                type="password"
                className={claseInput}
                value={form.password}
                onChange={(e) => cambiar('password', e.target.value)}
                maxLength={MAXIMO_PASSWORD}
                autoComplete="new-password"
                aria-invalid={!!errores.password}
                autoFocus
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
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setAbierto(null)} disabled={trabajando}>
              Cancelar
            </Boton>
            <Boton type="submit" icono="check" disabled={trabajando}>
              {trabajando ? 'Guardando…' : 'Guardar contraseña'}
            </Boton>
          </div>
        </form>
      )}

      {abierto === 'deshabilitar' && (
        <div className="mt-6 border-t border-line pt-6">
          <Aviso tono="neutro">
            ¿Deshabilitar a {quien}? No va a poder iniciar sesión hasta que se lo vuelva a habilitar. Lo que cargó
            queda registrado igual.
          </Aviso>
          <div className="mt-5 flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setAbierto(null)} disabled={trabajando}>
              Cancelar
            </Boton>
            <Boton
              icono="cruz"
              variante="peligroLleno"
              disabled={trabajando}
              onClick={() =>
                ejecutar(
                  () => cambiarEstadoUsuario(usuario.id, false),
                  `${quien} quedó deshabilitado: ya no puede iniciar sesión.`
                )
              }
            >
              {trabajando ? 'Deshabilitando…' : 'Sí, deshabilitar'}
            </Boton>
          </div>
        </div>
      )}

      {!abierto && (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-6">
          {esPropio && <p className="mr-auto text-[14px] text-ink-soft">Es tu usuario: no podés deshabilitarlo.</p>}
          {usuario.bloqueado && habilitado && (
            <Boton
              variante="secundario"
              disabled={trabajando}
              onClick={() => ejecutar(() => desbloquearUsuario(usuario.id), `${quien} ya puede volver a ingresar.`)}
            >
              Desbloquear
            </Boton>
          )}
          <Boton variante="secundario" disabled={trabajando} onClick={() => abrir('password')}>
            Reiniciar contraseña
          </Boton>
          {habilitado
            ? !esPropio && (
                <Boton variante="peligro" disabled={trabajando} onClick={() => abrir('deshabilitar')}>
                  Deshabilitar
                </Boton>
              )
            : (
                <Boton
                  icono="check"
                  disabled={trabajando}
                  onClick={() =>
                    ejecutar(
                      () => cambiarEstadoUsuario(usuario.id, true),
                      `${quien} quedó habilitado: ya puede iniciar sesión.`
                    )
                  }
                >
                  Habilitar
                </Boton>
              )}
        </div>
      )}
    </Seccion>
  )
}
