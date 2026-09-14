const MODULOS = [{ id: 'internos', label: 'Internos' }]

export default function Sidebar({ activo, onSelect }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-rail-line bg-rail">
      <div className="flex h-14 items-center border-b border-rail-line px-4">
        <span className="font-serif text-[17px] leading-none font-semibold text-white">
          Gestión de Internos
        </span>
      </div>

      <nav className="flex-1 pt-6">
        <p className="px-4 pb-2.5 font-mono text-[11px] tracking-[0.18em] text-rail-soft/55 uppercase">
          Módulos
        </p>

        <ul>
          {MODULOS.map(({ id, label }) => {
            const activa = activo === id
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-current={activa ? 'page' : undefined}
                  className={`w-full cursor-pointer px-4 py-3 text-left text-[15px] transition-colors duration-150 ${
                    activa
                      ? 'bg-accent font-semibold text-white'
                      : 'text-rail-soft hover:bg-white/6 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-rail-line px-4 py-3 font-mono text-[11px] text-rail-soft/60">
        v0.1
      </div>
    </aside>
  )
}
