import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './components/Login'
import { restaurarSesion, cerrarSesion } from './api/auth'

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [modulo, setModulo] = useState('internos')
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

  function salir() {
    cerrarSesion()
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

  return (
    <div className="flex h-full">
      <Sidebar activo={modulo} onSelect={setModulo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar seccion="Internos" usuario={sesion.usuario} onLogout={salir} />
        <main className="min-h-0 flex-1" />
      </div>
    </div>
  )
}
