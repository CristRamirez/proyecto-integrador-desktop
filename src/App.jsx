import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './components/Login'
import { restaurarSesion, cerrarSesion } from './api/auth'
import { onSesionVencida } from './api/cliente'
import Internos from './modulos/internos/Internos'

const PANTALLAS = {
  internos: Internos,
}

function EnConstruccion() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-[13px] tracking-[0.18em] text-ink-soft uppercase">Módulo en construcción</p>
    </div>
  )
}

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [modulo, setModulo] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    restaurarSesion()
      .then((s) => {
        if (vivo) setSesion(s)
      })
      .catch(() => {
        if (vivo) setSesion(null)
      })
      .finally(() => {
        if (vivo) setCargando(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => onSesionVencida(salir), [])

  function salir() {
    cerrarSesion()
    setModulo(null)
    setSesion(null)
  }

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center bg-paper">
        <p className="font-mono text-[13px] tracking-[0.18em] text-ink-soft uppercase">
          Cargando…
        </p>
      </div>
    )
  }

  if (!sesion) return <Login onLogin={setSesion} />

  const modulos = sesion.usuario.modulos ?? []
  const activo = modulos.includes(modulo) ? modulo : (modulos[0] ?? null)
  const Pantalla = PANTALLAS[activo] ?? EnConstruccion

  return (
    <div className="flex h-full">
      <Sidebar modulos={modulos} activo={activo} onSelect={setModulo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar seccion={activo ?? '—'} usuario={sesion.usuario} onLogout={salir} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Pantalla key={activo} />
        </main>
      </div>
    </div>
  )
}
