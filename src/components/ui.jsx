const ICONOS = {
  mas: 'M12 5v14M5 12h14',
  cruz: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  volver: 'M19 12H5M11 6l-6 6 6 6',
  persona: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6',
  alerta: 'M12 3L2 20h20L12 3zM12 10v4M12 17h.01',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
  inicio: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z',
  billete: 'M4 6h16a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0120 18H4a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 014 6zM12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  recibo: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6',
  ajustes: 'M20 7h-9M14 17H4M17 20a3 3 0 100-6 3 3 0 000 6zM7 10a3 3 0 100-6 3 3 0 000 6z',
  salir: 'M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 16l-4-4 4-4M6 12h10',
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

const MARCAS = {
  neutro: 'bg-accent-soft text-ink-soft',
  ok: 'bg-ok-soft text-ok-ink',
  aviso: 'bg-warn-soft text-warn-ink',
  peligro: 'bg-danger-soft text-danger',
}

export function Marca({ tono = 'neutro', children }) {
  return (
    <span
      className={`inline-block rounded-xs px-2 py-0.5 font-mono text-[12px] tracking-[0.08em] uppercase ${MARCAS[tono]}`}
    >
      {children}
    </span>
  )
}

const AVISOS = {
  peligro: { clase: 'border-danger/25 bg-danger-soft/70 text-danger', icono: 'alerta', rol: 'alert' },
  ok: { clase: 'border-ok/30 bg-ok-soft/70 text-ok-ink', icono: 'check', rol: 'status' },
  neutro: { clase: 'border-line bg-head text-ink', icono: 'info', rol: 'status' },
}

export function Aviso({ tono = 'peligro', children }) {
  const { clase, icono, rol } = AVISOS[tono]
  return (
    <div role={rol} className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-[16px] font-medium ${clase}`}>
      <Icono nombre={icono} className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
