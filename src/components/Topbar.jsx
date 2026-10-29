import { Icono } from './ui'

function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export default function Topbar({ seccion, usuario, onLogout }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface pr-4 pl-8">
      <p className="font-mono text-[12px] tracking-[0.16em] text-ink uppercase">
        {seccion}
      </p>

      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-[14px] font-semibold text-ink">{usuario.nombre}</p>
            <p className="text-[13px] text-ink-soft first-letter:uppercase">{usuario.rol}</p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-accent-soft font-mono text-[12px] text-ink-soft"
          >
            {iniciales(usuario.nombre)}
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="ml-4 flex cursor-pointer items-center gap-2 border-l border-line py-2 pl-4 text-[14px] text-ink-soft transition-colors duration-150 hover:text-ink"
        >
          <Icono nombre="salir" className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
