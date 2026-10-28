import { useEffect, useState } from 'react'
import { listarCuotas } from '../../api/cobranzas'
import { listarEgresos } from '../../api/egresos'
import { Aviso, Boton, Campo, Marca, claseInput } from '../../components/ui'
import { Indicador, Paginado } from '../cobranzas/CuotasDelPeriodo'
import { fecha, moneda, monedaCorta, periodo, periodoActual, periodosRecientes } from '../internos/formato'
import { capitalizar, nombreCategoria } from './egreso'
import RegistrarEgreso from './RegistrarEgreso'

const POR_PAGINA = 20

function SinDato({ etiqueta, detalle }) {
  return (
    <div className="rounded-sm border border-line bg-surface px-5 py-4">
      <p className="flex items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
        <span className="h-2 w-2 rounded-full bg-line-strong" aria-hidden="true" />
        {etiqueta}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-serif text-[28px] font-semibold text-ink-soft">—</p>
        <p className="text-[14px] whitespace-nowrap text-ink-soft">{detalle}</p>
      </div>
    </div>
  )
}

function Balance({ resumen, cobrado, periodoElegido }) {
  const mes = periodo(periodoElegido).split(' ')[0]
  const movimientos = `${resumen.cantidad} ${resumen.cantidad === 1 ? 'movimiento' : 'movimientos'}`

  if (cobrado === null) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <Indicador etiqueta={`Egresos ${mes}`} valor={resumen.total} detalle={movimientos} />
        <SinDato etiqueta="Cobrado" detalle="No disponible" />
        <SinDato etiqueta="Resultado" detalle="No disponible" />
      </div>
    )
  }

  const resultado = Math.round((cobrado - resumen.total) * 100) / 100
  let detalleResultado = 'Sin movimientos'
  if (cobrado > 0) detalleResultado = `Se gastó el ${Math.round((resumen.total / cobrado) * 100)}% de lo cobrado`
  else if (resumen.total > 0) detalleResultado = 'Sin cobros en el mes'

  return (
    <div className="grid grid-cols-3 gap-4">
      <Indicador etiqueta={`Egresos ${mes}`} valor={resumen.total} detalle={movimientos} />
      <Indicador etiqueta="Cobrado" tono="ok" valor={cobrado} detalle="Cuotas del período" />
      <Indicador
        etiqueta="Resultado"
        tono={resultado < 0 ? 'peligro' : 'ok'}
        valor={resultado}
        detalle={detalleResultado}
      />
    </div>
  )
}

function PorCategoria({ resumen, elegida, onElegir }) {
  return (
    <section className="rounded-sm border border-line bg-surface px-6 py-5">
      <h2 className="mb-3 font-serif text-[20px] font-semibold text-ink">Por categoría</h2>
      <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
        {resumen.por_categoria.map((c) => {
          const parte = resumen.total > 0 ? (c.total / resumen.total) * 100 : 0
          const activa = !!c.categoria && elegida === c.categoria
          return (
            <li key={c.categoria ?? 'sin-categoria'}>
              <button
                type="button"
                disabled={!c.categoria}
                onClick={() => onElegir(activa ? '' : c.categoria)}
                aria-pressed={activa}
                title={activa ? 'Quitar el filtro' : 'Ver solo esta categoría'}
                className={`w-full cursor-pointer rounded-xs px-3 py-2 text-left transition-colors duration-150 disabled:cursor-default ${
                  activa ? 'bg-accent-soft' : 'hover:bg-accent-soft'
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className={`text-[16px] text-ink ${activa ? 'font-semibold' : ''}`}>
                    {nombreCategoria(c.categoria)}
                    <span className="ml-2 font-mono text-[12px] text-ink-soft">
                      {c.cantidad} {c.cantidad === 1 ? 'mov.' : 'movs.'}
                    </span>
                  </span>
                  <span className="font-mono text-[15px] whitespace-nowrap text-ink" title={moneda(c.total)}>
                    {monedaCorta(c.total)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-1 flex-1 rounded-full bg-line">
                    <div className="h-1 rounded-full bg-accent" style={{ width: `${parte}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono text-[12px] text-ink-soft">{Math.round(parte)}%</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function FilaEgreso({ egreso }) {
  const detalle = [egreso.observaciones, egreso.registrado_por && `Cargó ${egreso.registrado_por}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-4 py-3 align-top whitespace-nowrap">{fecha(egreso.fecha)}</td>
      <td className="px-4 py-3 align-top">
        <p className="font-semibold">{egreso.concepto}</p>
        {detalle && <p className="mt-0.5 text-[14px] text-ink-soft">{detalle}</p>}
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <Marca>{nombreCategoria(egreso.categoria)}</Marca>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">{capitalizar(egreso.medio_pago ?? '—')}</td>
      <td className="px-4 py-3 align-top font-mono text-[14px] whitespace-nowrap text-ink-soft">
        {egreso.comprobante ?? '—'}
      </td>
      <td className="px-4 py-3 text-right align-top font-mono text-[15px] whitespace-nowrap">{moneda(egreso.monto)}</td>
    </tr>
  )
}

function opcionesDePeriodo(elegido) {
  const lista = periodosRecientes()
  return lista.includes(elegido) ? lista : [...lista, elegido].sort().reverse()
}

export default function Egresos() {
  const [filtros, setFiltros] = useState({ periodo: periodoActual(), categoria: '', pagina: 1 })
  const [registrando, setRegistrando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [version, setVersion] = useState(0)
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const { periodo: periodoElegido, categoria, pagina } = filtros
  const clave = `${periodoElegido}|${categoria}|${pagina}|${version}|${intento}`

  useEffect(() => {
    let vivo = true
    const [anio, mes] = periodoElegido.split('-').map(Number)
    const cobradoDelMes = listarCuotas({ anio, mes, porPagina: 1 })
      .then(({ resumen }) => resumen?.cobrado ?? 0)
      .catch(() => null)
    Promise.all([listarEgresos({ anio, mes, categoria, pagina, porPagina: POR_PAGINA }), cobradoDelMes])
      .then(([egresos, cobrado]) => vivo && setRespuesta({ clave, datos: { ...egresos, cobrado, periodo: periodoElegido } }))
      .catch((err) => vivo && setRespuesta({ clave, error: err.message }))
    return () => {
      vivo = false
    }
  }, [clave, periodoElegido, categoria, pagina])

  function filtrar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor, pagina: 1 }))
  }

  function egresoRegistrado(egreso) {
    setRegistrando(false)
    setAviso(`Se registró "${egreso.concepto}" por ${moneda(egreso.monto)} en ${nombreCategoria(egreso.categoria)}.`)
    setFiltros({ periodo: egreso.fecha.slice(0, 7), categoria: '', pagina: 1 })
    setVersion((v) => v + 1)
  }

  const cargando = respuesta?.clave !== clave
  const datos = respuesta?.datos
  const error = !cargando && respuesta?.error
  const egresos = datos?.egresos ?? []
  const resumen = datos?.resumen
  const categorias = (resumen?.por_categoria ?? []).map((c) => c.categoria).filter(Boolean)
  if (categoria && !categorias.includes(categoria)) categorias.push(categoria)

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Egresos</h1>
          <p className="mt-1 text-[16px] text-ink-soft">Gastos de la institución en {periodo(periodoElegido)}</p>
        </div>
        {!registrando && (
          <Boton
            icono="mas"
            className="shrink-0"
            onClick={() => {
              setAviso(null)
              setRegistrando(true)
            }}
          >
            Registrar egreso
          </Boton>
        )}
      </div>

      {aviso && (
        <div className="mt-6">
          <Aviso>{aviso}</Aviso>
        </div>
      )}

      {registrando && (
        <div className="mt-6">
          <RegistrarEgreso onCancelar={() => setRegistrando(false)} onRegistrado={egresoRegistrado} />
        </div>
      )}

      {resumen && (
        <div className={`mt-6 space-y-4 ${cargando ? 'opacity-60' : ''}`}>
          <Balance resumen={resumen} cobrado={datos.cobrado} periodoElegido={datos.periodo} />
          {resumen.por_categoria.length > 0 && (
            <PorCategoria resumen={resumen} elegida={categoria} onElegir={(c) => filtrar('categoria', c)} />
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-[220px_260px] gap-4">
        <Campo etiqueta="Período">
          <select
            className={`${claseInput} capitalize`}
            value={periodoElegido}
            onChange={(e) => filtrar('periodo', e.target.value)}
          >
            {opcionesDePeriodo(periodoElegido).map((p) => (
              <option key={p} value={p}>
                {periodo(p)}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Categoría">
          <select className={claseInput} value={categoria} onChange={(e) => filtrar('categoria', e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {nombreCategoria(c)}
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
        {egresos.length === 0 ? (
          <p className="px-6 py-10 text-center text-[16px] text-ink-soft">
            {!datos
              ? cargando
                ? 'Buscando egresos…'
                : 'No se pudieron cargar los egresos.'
              : resumen?.cantidad === 0
                ? `No hay egresos registrados en ${periodo(periodoElegido)}.`
                : 'No hay egresos de esa categoría en el período.'}
          </p>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className="border-b border-line font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Concepto</th>
                <th className="px-4 py-3 font-normal">Categoría</th>
                <th className="px-4 py-3 font-normal">Medio de pago</th>
                <th className="px-4 py-3 font-normal">Comprobante</th>
                <th className="px-4 py-3 text-right font-normal">Monto</th>
              </tr>
            </thead>
            <tbody>
              {egresos.map((e) => (
                <FilaEgreso key={e.id} egreso={e} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {datos?.paginacion && egresos.length > 0 && (
        <Paginado
          paginacion={datos.paginacion}
          cantidad={egresos.length}
          cargando={cargando}
          unidad={['egreso', 'egresos']}
          onPagina={(p) => setFiltros((f) => ({ ...f, pagina: p }))}
        />
      )}
    </div>
  )
}
