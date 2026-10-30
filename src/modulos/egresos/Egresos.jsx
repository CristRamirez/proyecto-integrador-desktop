import { useEffect, useRef, useState } from 'react'
import { listarCuotas } from '../../api/cobranzas'
import { listarEgresos } from '../../api/egresos'
import { Aviso, Boton, Estado, Filtro, Marca, Paginado, Vacio, claseCabecera } from '../../components/ui'
import { Indicador } from '../cobranzas/CuotasDelPeriodo'
import { fecha, fechaHoraDesdeUtc, moneda, monedaCorta, periodo, periodoActual, periodosRecientes } from '../internos/formato'
import AnularEgreso from './AnularEgreso'
import { capitalizar, estaAnulado, nombreCategoria } from './egreso'
import FormularioEgreso from './FormularioEgreso'

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
  const anulados = resumen.anulados ? ` · ${resumen.anulados} ${resumen.anulados === 1 ? 'anulado' : 'anulados'}` : ''
  const movimientos = `${resumen.cantidad} ${resumen.cantidad === 1 ? 'movimiento' : 'movimientos'}${anulados}`

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

function FilaEgreso({ egreso, seleccionado, onEditar, onAnular }) {
  const anulado = estaAnulado(egreso)
  const detalle = [egreso.observaciones, egreso.registrado_por && `Cargó ${egreso.registrado_por}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <tr
      className={`border-b border-line-soft last:border-b-0 ${anulado ? 'text-ink-soft' : ''} ${seleccionado ? 'bg-accent-soft/60' : ''}`}
    >
      <td className="px-4 py-3 align-top whitespace-nowrap">{fecha(egreso.fecha)}</td>
      <td className="px-4 py-3 align-top">
        <p className="font-semibold">{egreso.concepto}</p>
        {detalle && <p className="mt-0.5 text-[14px] text-ink-soft">{detalle}</p>}
        {anulado && (
          <p className="mt-1 text-[14px] text-ink">
            Anulado el {fechaHoraDesdeUtc(egreso.anulado_en)}
            {egreso.anulado_por ? ` por ${egreso.anulado_por}` : ''}: {egreso.motivo_anulacion}
          </p>
        )}
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <Marca>{nombreCategoria(egreso.categoria)}</Marca>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <p>{capitalizar(egreso.medio_pago ?? '—')}</p>
        {egreso.comprobante && <p className="font-mono text-[13px] text-ink-soft">{egreso.comprobante}</p>}
      </td>
      <td
        className={`px-4 py-3 text-right align-top font-mono text-[15px] whitespace-nowrap ${anulado ? 'line-through' : ''}`}
      >
        {moneda(egreso.monto)}
      </td>
      <td className="px-4 py-3 text-right align-top">
        {anulado ? (
          <Estado>Anulado</Estado>
        ) : (
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" chico onClick={() => onEditar(egreso)}>
              Editar
            </Boton>
            <Boton variante="sutil" chico onClick={() => onAnular(egreso)}>
              Anular
            </Boton>
          </div>
        )}
      </td>
    </tr>
  )
}

function opcionesDePeriodo(elegido) {
  const lista = periodosRecientes()
  return lista.includes(elegido) ? lista : [...lista, elegido].sort().reverse()
}

export default function Egresos() {
  const [filtros, setFiltros] = useState({ periodo: periodoActual(), categoria: '', pagina: 1 })
  const [panel, setPanel] = useState(null)
  const [aviso, setAviso] = useState(null)
  const refPanel = useRef(null)
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

  useEffect(() => {
    if (panel) refPanel.current?.scrollIntoView({ block: 'nearest' })
  }, [panel])

  function filtrar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor, pagina: 1 }))
  }

  function abrir(tipo, egreso = null) {
    setAviso(null)
    setPanel({ tipo, egreso })
  }

  function cerrarYRecargar(mensaje) {
    setPanel(null)
    setAviso(mensaje)
    setVersion((v) => v + 1)
  }

  function egresoGuardado(egreso) {
    const periodoNuevo = egreso.fecha.slice(0, 7)
    if (panel.tipo === 'editar') {
      const seMovio = periodoNuevo !== periodoElegido
      if (seMovio) setFiltros({ periodo: periodoNuevo, categoria: '', pagina: 1 })
      cerrarYRecargar(
        `Se guardaron los cambios de "${egreso.concepto}".${seMovio ? ` Pasó a los egresos de ${periodo(periodoNuevo)}.` : ''}`
      )
      return
    }
    setFiltros({ periodo: periodoNuevo, categoria: '', pagina: 1 })
    cerrarYRecargar(`Se registró "${egreso.concepto}" por ${moneda(egreso.monto)} en ${nombreCategoria(egreso.categoria)}.`)
  }

  function egresoAnulado(egreso) {
    cerrarYRecargar(`Se anuló "${egreso.concepto}" por ${moneda(egreso.monto)}. Queda en la lista pero ya no suma en los totales.`)
  }

  function desactualizado(mensaje) {
    cerrarYRecargar(`${mensaje}. Se actualizó la lista.`)
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Egresos</h1>
          <p className="mt-1 text-[16px] text-ink-soft">Gastos de la institución en {periodo(periodoElegido)}</p>
        </div>
        {!panel && (
          <Boton icono="mas" className="shrink-0" onClick={() => abrir('registrar')}>
            Registrar egreso
          </Boton>
        )}
      </div>

      {aviso && (
        <div className="mt-6">
          <Aviso tono="ok">{aviso}</Aviso>
        </div>
      )}

      {panel && (
        <div ref={refPanel} className="mt-6 scroll-mt-6">
          {panel.tipo === 'anular' ? (
            <AnularEgreso
              key={`anular-${panel.egreso.id}`}
              egreso={panel.egreso}
              onCancelar={() => setPanel(null)}
              onAnulado={egresoAnulado}
              onDesactualizado={desactualizado}
            />
          ) : (
            <FormularioEgreso
              key={panel.egreso ? `editar-${panel.egreso.id}` : 'registrar'}
              egreso={panel.egreso}
              onCancelar={() => setPanel(null)}
              onGuardado={egresoGuardado}
              onDesactualizado={desactualizado}
            />
          )}
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

      <div className="mt-6 grid grid-cols-[250px_280px] gap-3">
        <Filtro
          etiqueta="Período"
          claseSelect="capitalize"
          value={periodoElegido}
          onChange={(e) => filtrar('periodo', e.target.value)}
        >
          {opcionesDePeriodo(periodoElegido).map((p) => (
            <option key={p} value={p}>
              {periodo(p)}
            </option>
          ))}
        </Filtro>
        <Filtro etiqueta="Categoría" value={categoria} onChange={(e) => filtrar('categoria', e.target.value)}>
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {nombreCategoria(c)}
            </option>
          ))}
        </Filtro>
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
          <Vacio cargando={!datos && cargando}>
            {!datos
              ? cargando
                ? 'Buscando egresos…'
                : 'No se pudieron cargar los egresos.'
              : categoria
                ? 'No hay egresos de esa categoría en el período.'
                : `No hay egresos registrados en ${periodo(periodoElegido)}.`}
          </Vacio>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className={`${claseCabecera} whitespace-nowrap`}>
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Concepto</th>
                <th className="px-4 py-3 font-normal">Categoría</th>
                <th className="px-4 py-3 font-normal">Medio de pago</th>
                <th className="px-4 py-3 text-right font-normal">Monto</th>
                <th className="px-4 py-3 font-normal">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {egresos.map((e) => (
                <FilaEgreso
                  key={e.id}
                  egreso={e}
                  seleccionado={panel?.egreso?.id === e.id}
                  onEditar={(egreso) => abrir('editar', egreso)}
                  onAnular={(egreso) => abrir('anular', egreso)}
                />
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
