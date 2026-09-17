import avatar from '../assets/avatar.svg'

export default function Topbar({ seccion, usuario, onLogout }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface pr-4 pl-6">
      <p className="font-mono text-[12px] tracking-[0.1em] text-ink-soft uppercase">
        {seccion}
      </p>

      <div className="flex items-center">
        <div className="flex items-center gap-3 border-l border-line py-2 pl-4">
          <div className="text-right leading-tight">
            <p className="text-[14px] font-semibold text-ink">{usuario.nombre}</p>
            <p className="text-[13px] text-ink-soft">{usuario.rol}</p>
          </div>
          <img src={avatar} alt="" className="h-9 w-9 rounded-xs border border-line object-cover" />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="ml-4 cursor-pointer border-l border-line py-2 pl-4 text-[13px] text-ink-soft transition-colors duration-150 hover:text-ink"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
