import { useState } from 'react'
import { login } from '../api/auth'

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
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
    <div className="flex h-full items-center justify-center bg-paper px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-semibold text-ink">Gestión de Internos</h1>
          <p className="mt-3 font-mono text-[13px] tracking-[0.18em] text-ink-soft uppercase">
            Acceso al sistema
          </p>
        </div>

        <form
          onSubmit={enviar}
          className="border border-line-strong bg-surface px-8 py-9 rounded-sm"
        >
          {error && (
            <p
              role="alert"
              className="mb-6 border-l-4 border-ink bg-accent-soft px-4 py-3 text-[16px] font-semibold text-ink"
            >
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-2 block font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
              Usuario
            </span>
            <input
              type="text"
              name="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="h-13 w-full border border-line-strong bg-white px-4 text-[18px] text-ink rounded-xs"
            />
          </label>

          <label className="mt-6 block">
            <span className="mb-2 block font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
              Contraseña
            </span>
            <input
              type="password"
              name="clave"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="off"
              className="h-13 w-full border border-line-strong bg-white px-4 text-[18px] text-ink rounded-xs"
            />
          </label>

          <button
            type="submit"
            disabled={cargando}
            className="mt-8 h-13 w-full cursor-pointer bg-rail text-[18px] font-semibold text-white transition-colors duration-150 hover:bg-accent disabled:cursor-default disabled:opacity-60 rounded-xs"
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
