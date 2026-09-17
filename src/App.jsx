import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './components/Login'

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [modulo, setModulo] = useState('internos')

  if (!sesion) return <Login onLogin={setSesion} />

  return (
    <div className="flex h-full">
      <Sidebar activo={modulo} onSelect={setModulo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar seccion="Internos" usuario={sesion.usuario} onLogout={() => setSesion(null)} />
        <main className="min-h-0 flex-1" />
      </div>
    </div>
  )
}
