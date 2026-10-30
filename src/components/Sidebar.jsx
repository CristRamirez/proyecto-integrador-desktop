import { etiqueta } from '../modulos/menu'
import { Icono } from './ui'

const ICONO_MODULO = {
  inicio: 'inicio',
  internos: 'persona',
  cobranzas: 'billete',
  egresos: 'recibo',
  configuracion: 'ajustes',
}

export default function Sidebar({ modulos = [], activo, onSelect }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-rail-line bg-rail">
      <div className="flex h-14 items-center gap-3 border-b border-rail-line px-4">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-xs bg-primary font-serif text-[14px] font-semibold text-white"
        >
          GI
        </span>
        <span className="text-[15px] leading-tight font-semibold text-white">Gestión de Internos</span>
      </div>

      <nav className="flex-1 px-3 pt-4">
        {modulos.length === 0 ? (
          <p className="px-3 py-3 text-[14px] text-rail-soft/70">
            Sin módulos para tu rol
          </p>
        ) : (
          <ul className="space-y-1">
            {modulos.map((nombre) => {
              const activa = activo === nombre
              const icono = ICONO_MODULO[nombre]
              return (
                <li key={nombre}>
                  <button
                    type="button"
                    onClick={() => onSelect(nombre)}
                    aria-current={activa ? 'page' : undefined}
                    className={`relative flex h-10.5 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-left text-[15px] transition-colors duration-150 ${
                      activa
                        ? 'bg-primary font-semibold text-white'
                        : 'text-rail-soft hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {icono ? (
                      <Icono nombre={icono} className="h-[18px] w-[18px] shrink-0" />
                    ) : (
                      <span className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    )}
                    {etiqueta(nombre)}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-rail-line px-6 py-3 font-mono text-[12px] tracking-[0.08em] text-rail-soft/70">
        v1.0
      </div>
    </aside>
  )
}
