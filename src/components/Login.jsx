import { useState } from 'react'
import { login } from '../api/auth'
import { Aviso, Etiqueta, Icono } from './ui'

const PUNTOS = [
  'Búsqueda por DNI, apellido o legajo',
  'Cuenta corriente y registro de pagos',
  'Módulos habilitados según el rol del usuario',
]

const claseCampo =
  'h-12 w-full rounded-xs border border-line-strong bg-white pl-11 text-[17px] text-ink transition-shadow duration-150 focus:border-ink focus:ring-3 focus:ring-ink/12 focus:outline-none'

const claseIcono = 'pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint'

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (cargando) return
    setError('')
    setCargando(true)
    try {
      const sesion = await login(usuario, clave)
      onLogin(sesion)
    } catch (err) {
      setError(err.message)
      setCargando(false)
    }
  }

  return (
    <div className="flex h-full bg-paper">
      <section className="hidden w-[44%] max-w-[640px] shrink-0 flex-col justify-between gap-10 bg-rail px-14 pt-14 pb-10 text-rail-soft lg:flex">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent font-serif text-[17px] font-semibold text-white"
          >
            GI
          </span>
          <span className="text-[16px] font-semibold text-white">Gestión de Internos</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-serif text-[40px] leading-[1.15] font-semibold text-white">
            Registro y seguimiento de internos.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed">
            Padrón, fichas personales, situación judicial, cuotas y egresos en un solo lugar.
          </p>
          <ul className="mt-8 space-y-3.5">
            {PUNTOS.map((punto) => (
              <li key={punto} className="flex items-center gap-3.5 text-[15px]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-rail-active text-rail-mark">
                  <Icono nombre="check" className="h-4 w-4" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-rail-line pt-5 font-mono text-[13px] tracking-[0.08em] text-rail-soft/80">
          v1.0
        </div>
      </section>

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <form onSubmit={enviar} className="w-full max-w-md rounded-sm border border-line bg-surface px-10 pt-10 pb-8">
          <h2 className="font-serif text-[30px] leading-tight font-semibold text-ink">Iniciar sesión</h2>
          <p className="mt-1.5 text-[15px] text-ink-soft">Ingresá con tu usuario institucional.</p>

          {error && (
            <div className="mt-6">
              <Aviso>{error}</Aviso>
            </div>
          )}

          <div className="mt-7">
            <label htmlFor="login-usuario">
              <Etiqueta>Usuario</Etiqueta>
            </label>
            <div className="relative">
              <Icono nombre="persona" className={claseIcono} />
              <input
                id="login-usuario"
                type="text"
                name="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className={`${claseCampo} pr-4`}
              />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="login-clave">
              <Etiqueta>Contraseña</Etiqueta>
            </label>
            <div className="relative">
              <Icono nombre="candado" className={claseIcono} />
              <input
                id="login-clave"
                type={verClave ? 'text' : 'password'}
                name="clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="off"
                className={`${claseCampo} pr-12`}
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={verClave}
                className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xs text-ink-soft transition-colors duration-150 hover:bg-accent-soft hover:text-ink"
              >
                <Icono nombre={verClave ? 'ojoCerrado' : 'ojo'} className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="mt-8 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xs bg-primary text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-primary-hover disabled:cursor-default disabled:opacity-60"
          >
            {cargando ? (
              'Ingresando…'
            ) : (
              <>
                Ingresar
                <Icono nombre="flecha" className="h-[18px] w-[18px]" />
              </>
            )}
          </button>

          <p className="mt-7 border-t border-line-soft pt-5 text-center text-[14px] text-ink-soft">
            ¿Problemas para ingresar? Hablá con el administrador del sistema.
          </p>
        </form>
      </main>
    </div>
  )
}
