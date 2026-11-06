import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './components/Login'
import { restaurarSesion, cerrarSesion } from './api/auth'
import { onSesionVencida } from './api/cliente'
import Inicio from './modulos/inicio/Inicio'
import Internos from './modulos/internos/Internos'
import Cobranzas from './modulos/cobranzas/Cobranzas'
import Ingresos from './modulos/ingresos/Ingresos'
import Egresos from './modulos/egresos/Egresos'
import Reportes from './modulos/reportes/Reportes'
import Configuracion from './modulos/configuracion/Configuracion'
import { armarMenu, etiqueta } from './modulos/menu'
import { Cargando } from './components/ui'

const PANTALLAS = {
  inicio: Inicio,
  internos: Internos,
  cobranzas: Cobranzas,
  ingresos: Ingresos,
  egresos: Egresos,
  reportes: Reportes,
  configuracion: Configuracion,
}

function EnConstruccion() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[16px] text-ink-soft">Este módulo todavía está en construcción.</p>
    </div>
  )
}

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [modulo, setModulo] = useState(null)
  const [accion, setAccion] = useState(null)
  const [navegacion, setNavegacion] = useState(0)
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

  // Una acción (abrir las vencidas, un reporte) vuelve a montar la pantalla aunque
  // ya se esté en ese módulo, para que la tome; el menú solo cambia de módulo.
  function ir(destino, nuevaAccion = null) {
    setModulo(destino)
    setAccion(nuevaAccion)
    if (nuevaAccion) setNavegacion((n) => n + 1)
  }

  function salir() {
    cerrarSesion()
    ir(null)
    setSesion(null)
  }

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center bg-paper">
        <Cargando className="">Verificando tu sesión…</Cargando>
      </div>
    )
  }

  if (!sesion) return <Login onLogin={setSesion} />

  const modulos = sesion.usuario.modulos ?? []
  const menu = armarMenu(modulos)
  const activo = menu.includes(modulo) ? modulo : (menu[0] ?? null)
  const Pantalla = PANTALLAS[activo] ?? EnConstruccion

  return (
    <div className="flex h-full print:block print:h-auto">
      <Sidebar modulos={menu} activo={activo} onSelect={ir} />
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <Topbar
          seccion={activo ? etiqueta(activo) : '—'}
          usuario={sesion.usuario}
          modulos={modulos}
          onIr={ir}
          onLogout={salir}
        />
        <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible">
          <Pantalla key={`${activo}:${navegacion}`} modulos={modulos} usuario={sesion.usuario} accion={accion} onIr={ir} />
        </main>
      </div>
    </div>
  )
}
