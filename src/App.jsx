import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

export default function App() {
  const [modulo, setModulo] = useState('internos')

  return (
    <div className="flex h-full">
      <Sidebar activo={modulo} onSelect={setModulo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar seccion="Internos" />
        <main className="min-h-0 flex-1" />
      </div>
    </div>
  )
}
