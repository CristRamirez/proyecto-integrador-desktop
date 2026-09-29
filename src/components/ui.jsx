const ICONOS = {
  mas: 'M12 5v14M5 12h14',
  cruz: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  volver: 'M19 12H5M11 6l-6 6 6 6',
  persona: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6',
}

export function Icono({ nombre, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={ICONOS[nombre]} />
    </svg>
  )
}

const VARIANTES = {
  primario: 'bg-rail text-white hover:bg-accent',
  secundario: 'border border-line-strong bg-surface text-ink hover:bg-accent-soft',
  sutil: 'text-ink-soft hover:bg-accent-soft hover:text-ink',
}

export function Boton({ icono, variante = 'primario', children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xs px-5 text-[16px] font-semibold transition-colors duration-150 disabled:cursor-default disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
    >
      {icono && <Icono nombre={icono} />}
      {children}
    </button>
  )
}

export function Etiqueta({ children, obligatorio }) {
  return (
    <span className="mb-2 block font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
      {children}
      {obligatorio && <span className="ml-1 text-ink">*</span>}
    </span>
  )
}

export const claseInput =
  'h-12 w-full rounded-xs border border-line-strong bg-white px-4 text-[16px] text-ink aria-invalid:border-ink aria-invalid:border-2'

export function Campo({ etiqueta, obligatorio, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <Etiqueta obligatorio={obligatorio}>{etiqueta}</Etiqueta>
      {children}
      {error && <p className="mt-1.5 text-[14px] font-semibold text-ink">{error}</p>}
    </label>
  )
}

export function Aviso({ children }) {
  return (
    <p
      role="alert"
      className="border-l-4 border-ink bg-accent-soft px-4 py-3 text-[16px] font-semibold text-ink"
    >
      {children}
    </p>
  )
}
