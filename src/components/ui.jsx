const ICONOS = {
  mas: 'M12 5v14M5 12h14',
  cruz: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  volver: 'M19 12H5M11 6l-6 6 6 6',
  persona: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6',
  alerta: 'M12 3L2 20h20L12 3zM12 10v4M12 17h.01',
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
  primario: 'bg-primary text-white hover:bg-primary-hover',
  secundario: 'border border-line-strong bg-surface text-ink hover:bg-accent-soft',
  sutil: 'text-ink-soft hover:bg-accent-soft hover:text-ink',
}

export function Boton({ icono, variante = 'primario', children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xs px-[18px] text-[15px] font-semibold transition-colors duration-150 disabled:cursor-default disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
    >
      {icono && <Icono nombre={icono} className="h-[18px] w-[18px]" />}
      {children}
    </button>
  )
}

export function Etiqueta({ children, obligatorio }) {
  return (
    <span className="mb-2 block font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
      {children}
      {obligatorio && <span className="ml-1 text-danger">*</span>}
    </span>
  )
}

export const claseInput =
  'h-11 w-full rounded-xs border border-line-strong bg-white px-3.5 text-[16px] text-ink transition-shadow duration-150 focus:border-ink focus:ring-3 focus:ring-ink/12 focus:outline-none aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/12 disabled:bg-accent-soft disabled:text-ink-soft'

export function Campo({ etiqueta, obligatorio, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <Etiqueta obligatorio={obligatorio}>{etiqueta}</Etiqueta>
      {children}
      {error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[14px] font-medium text-danger">
          <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </label>
  )
}

export function Seccion({ titulo, children }) {
  return (
    <section className="border border-line bg-surface px-7 py-6 rounded-sm">
      <h2 className="mb-5 font-serif text-[20px] font-semibold text-ink">{titulo}</h2>
      {children}
    </section>
  )
}

export function Dato({ etiqueta, className = '', children }) {
  return (
    <div className={className}>
      <dt className="font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">{etiqueta}</dt>
      <dd className="mt-1 text-[17px] text-ink">{children || children === 0 ? children : '—'}</dd>
    </div>
  )
}

export function Marca({ children }) {
  return (
    <span className="inline-block rounded-xs border border-ink px-2 py-0.5 font-mono text-[12px] tracking-[0.08em] text-ink uppercase">
      {children}
    </span>
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
