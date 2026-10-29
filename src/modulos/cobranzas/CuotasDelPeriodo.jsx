import { useEffect, useState } from 'react'
import { listarCuotas } from '../../api/cobranzas'
import { Aviso, Boton, Campo, Paginado, claseInput } from '../../components/ui'
import { fecha, moneda, monedaCorta, periodo, periodosRecientes } from '../internos/formato'
import { estaVencida, tieneSaldo } from './cuota'
import EstadoCuota from './EstadoCuota'

const ESPERA_BUSQUEDA = 300
const POR_PAGINA = 20

const ESTADOS = [
  ['', 'Todas'],
  ['pendiente', 'Pendientes'],
  ['parcial', 'Parciales'],
  ['vencida', 'Vencidas'],
  ['pagada', 'Pagadas'],
  ['anulada', 'Anuladas'],
]

function iniciales({ apellido, nombre }) {
  return `${apellido?.[0] ?? ''}${nombre?.[0] ?? ''}`.toUpperCase()
}

const PUNTOS = { neutro: 'bg-accent', ok: 'bg-ok', aviso: 'bg-warn', peligro: 'bg-danger' }

export function Indicador({ etiqueta, valor, detalle, tono = 'neutro', progreso }) {
  return (
    <div className="rounded-sm border border-line bg-surface px-5 py-4">
      <p className="flex items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
        <span className={`h-2 w-2 rounded-full ${PUNTOS[tono]}`} aria-hidden="true" />
        {etiqueta}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <p
          className={`font-serif text-[28px] font-semibold whitespace-nowrap ${tono === 'peligro' ? 'text-danger' : 'text-ink'}`}
          title={moneda(valor)}
        >
          {monedaCorta(valor)}
        </p>
        <p className="text-[14px] whitespace-nowrap text-ink-soft">{detalle}</p>
      </div>
      {progreso !== undefined && (
        <div className="mt-2 h-1 rounded-full bg-accent-soft">
          <div className="h-1 rounded-full bg-ok" style={{ width: `${Math.min(progreso, 100)}%` }} />
        </div>
      )}
    </div>
  )
}

export function Indicadores({ resumen, periodoElegido }) {
  const mes = periodo(periodoElegido).split(' ')[0]
  const cobradoSobreTotal = resumen.facturado > 0 ? Math.round((resumen.cobrado / resumen.facturado) * 100) : 0

  return (
    <div className="grid grid-cols-4 gap-4">
      <Indicador
        etiqueta={`Facturado ${mes}`}
        valor={resumen.facturado}
        detalle={`${resumen.cuotas} ${resumen.cuotas === 1 ? 'cuota' : 'cuotas'}`}
      />
      <Indicador
        etiqueta="Cobrado"
        tono="ok"
        valor={resumen.cobrado}
        detalle={`${cobradoSobreTotal}% del total`}
        progreso={cobradoSobreTotal}
      />
      <Indicador
        etiqueta="Pendiente"
        tono="aviso"
        valor={resumen.pendiente}
        detalle={`${resumen.cuotas_pendientes} ${resumen.cuotas_pendientes === 1 ? 'cuota' : 'cuotas'}`}
      />
      <Indicador
        etiqueta="Vencido"
        tono="peligro"
        valor={resumen.vencido}
        detalle={`${resumen.internos_con_vencidas} ${resumen.internos_con_vencidas === 1 ? 'interno' : 'internos'}`}
      />
    </div>
  )
}

function FilaCuota({ cuota, onAbrir, onPagar }) {
  const { interno } = cuota
  const vencida = estaVencida(cuota)

  return (
    <tr
      onClick={() => onAbrir(interno.id)}
      className="cursor-pointer border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-accent-soft"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[12px] text-ink-soft"
            aria-hidden="true"
          >
            {iniciales(interno)}
          </span>
          <div className="whitespace-nowrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onAbrir(interno.id)
              }}
              className="cursor-pointer text-left font-semibold underline-offset-4 hover:underline focus-visible:underline"
            >
              {interno.apellido}, {interno.nombre}
            </button>
            <p className="font-mono text-[12px] text-ink-soft">{interno.legajo ?? 'Sin legajo'}</p>
          </div>
        </div>
      </td>
      <td className={`px-4 py-3 whitespace-nowrap ${vencida ? 'text-danger' : ''}`}>{fecha(cuota.fecha_vencimiento)}</td>
      <td className="px-4 py-3 text-right font-mono text-[15px] whitespace-nowrap">{moneda(cuota.total)}</td>
      <td className="px-4 py-3">
        <EstadoCuota cuota={cuota} detalle />
      </td>
      <td className="px-4 py-3 text-right">
        {tieneSaldo(cuota) ? (
          <Boton
            variante={vencida ? 'primario' : 'secundario'}
            className="whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation()
              onPagar(interno.id, cuota.id)
            }}
          >
            Registrar pago
          </Boton>
        ) : (
          <span className="font-mono text-[14px] whitespace-nowrap text-ink-soft">
            {cuota.ultimo_pago?.numero_comprobante ?? '—'}
          </span>
        )}
      </td>
    </tr>
  )
}

// acciones va a la derecha del título; children, debajo (avisos y el panel de generar).
export default function CuotasDelPeriodo({ filtros, onFiltros, onAbrir, onPagar, onSinListado, acciones, children }) {
  const { periodo: periodoElegido, estado, q, pagina } = filtros
  const [texto, setTexto] = useState(q)
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const clave = `${periodoElegido}|${estado}|${q}|${pagina}|${intento}`

  useEffect(() => {
    if (texto === q) return
    const t = setTimeout(() => onFiltros((f) => ({ ...f, q: texto, pagina: 1 })), ESPERA_BUSQUEDA)
    return () => clearTimeout(t)
  }, [texto, q, onFiltros])

  useEffect(() => {
    let vivo = true
    const [anio, mes] = periodoElegido.split('-').map(Number)
    listarCuotas({ anio, mes, estado, q, pagina, porPagina: POR_PAGINA })
      .then((datos) => vivo && setRespuesta({ clave, datos }))
      .catch((err) => {
        if (!vivo) return
        if (err.codigo === 'RUTA_NO_ENCONTRADA') onSinListado(true)
        else setRespuesta({ clave, error: err.message })
      })
    return () => {
      vivo = false
    }
  }, [clave, periodoElegido, estado, q, pagina, onSinListado])

  function filtrar(campo) {
    return (e) => onFiltros((f) => ({ ...f, [campo]: e.target.value, pagina: 1 }))
  }

  // Mientras llega la respuesta nueva se sigue mostrando la anterior, atenuada.
  const cargando = respuesta?.clave !== clave
  const datos = respuesta?.datos
  const error = !cargando && respuesta?.error
  const cuotas = datos?.cuotas ?? []

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Cobranzas</h1>
          <p className="mt-1 text-[16px] text-ink-soft">Cuotas de {periodo(periodoElegido)}</p>
        </div>
        {acciones}
      </div>

      {children}

      {datos?.resumen && (
        <div className={`mt-6 ${cargando ? 'opacity-60' : ''}`}>
          <Indicadores resumen={datos.resumen} periodoElegido={periodoElegido} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-[1fr_220px_200px] gap-4">
        <Campo etiqueta="Buscar">
          <input
            type="search"
            className={claseInput}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Interno por apellido, DNI o legajo"
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Período">
          <select className={`${claseInput} capitalize`} value={periodoElegido} onChange={filtrar('periodo')}>
            {periodosRecientes().map((p) => (
              <option key={p} value={p}>
                {periodo(p)}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Estado">
          <select className={claseInput} value={estado} onChange={filtrar('estado')}>
            {ESTADOS.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1">
            <Aviso>{error}</Aviso>
          </div>
          <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </Boton>
        </div>
      )}

      <div
        className={`mt-6 overflow-x-auto rounded-sm border border-line bg-surface ${cargando ? 'opacity-60' : ''}`}
        aria-busy={cargando}
      >
        {cuotas.length === 0 ? (
          <p className="px-6 py-10 text-center text-[16px] text-ink-soft">
            {!datos
              ? cargando
                ? 'Buscando cuotas…'
                : 'No se pudieron cargar las cuotas.'
              : datos.resumen?.cuotas === 0
                ? `Todavía no se generaron las cuotas de ${periodo(periodoElegido)}.`
                : 'No hay cuotas que coincidan con la búsqueda.'}
          </p>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className="border-b border-line font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
                <th className="px-4 py-3 font-normal">Interno</th>
                <th className="px-4 py-3 font-normal">Vence</th>
                <th className="px-4 py-3 text-right font-normal">Importe</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 text-right font-normal">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c) => (
                <FilaCuota key={c.id} cuota={c} onAbrir={onAbrir} onPagar={onPagar} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {datos?.paginacion && cuotas.length > 0 && (
        <Paginado
          paginacion={datos.paginacion}
          cantidad={cuotas.length}
          cargando={cargando}
          onPagina={(p) => onFiltros((f) => ({ ...f, pagina: p }))}
        />
      )}
    </div>
  )
}
