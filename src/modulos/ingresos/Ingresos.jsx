import { useEffect, useRef, useState } from 'react'
import { listarCuotas } from '../../api/cobranzas'
import { listarIngresos } from '../../api/ingresos'
import { Aviso, Boton, Estado, Filtro, Marca, Paginado, Vacio, claseCabecera } from '../../components/ui'
import { Indicador } from '../cobranzas/CuotasDelPeriodo'
import { PorCategoria, SinDato } from '../egresos/Egresos'
import { capitalizar, estaAnulado, nombreCategoria, opcionesDePeriodo } from '../egresos/egreso'
import { fecha, fechaHoraDesdeUtc, moneda, periodo, periodoActual } from '../internos/formato'
import AnularIngreso from './AnularIngreso'
import FormularioIngreso from './FormularioIngreso'

const POR_PAGINA = 20

// Los extras se muestran junto a lo cobrado de cuotas, para ver cuánto entró en total.
function Balance({ resumen, cobrado, periodoElegido }) {
  const mes = periodo(periodoElegido).split(' ')[0]
  const anulados = resumen.anulados ? ` · ${resumen.anulados} ${resumen.anulados === 1 ? 'anulado' : 'anulados'}` : ''
  const movimientos = `${resumen.cantidad} ${resumen.cantidad === 1 ? 'movimiento' : 'movimientos'}${anulados}`

  if (cobrado === null) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <Indicador etiqueta={`Ingresos extras ${mes}`} tono="ok" valor={resumen.total} detalle={movimientos} />
        <SinDato etiqueta="Cobrado de cuotas" detalle="No disponible" />
        <SinDato etiqueta="Total ingresado" detalle="No disponible" />
      </div>
    )
  }

  const total = Math.round((cobrado + resumen.total) * 100) / 100
  const detalleTotal = total > 0 ? `Los extras son el ${Math.round((resumen.total / total) * 100)}%` : 'Sin movimientos'

  return (
    <div className="grid grid-cols-3 gap-4">
      <Indicador etiqueta={`Ingresos extras ${mes}`} tono="ok" valor={resumen.total} detalle={movimientos} />
      <Indicador etiqueta="Cobrado de cuotas" tono="ok" valor={cobrado} detalle="Cuotas del período" />
      <Indicador etiqueta="Total ingresado" tono="ok" valor={total} detalle={detalleTotal} />
    </div>
  )
}

function FilaIngreso({ ingreso, seleccionado, onAnular }) {
  const anulado = estaAnulado(ingreso)
  const detalle = [ingreso.observaciones, ingreso.registrado_por && `Cargó ${ingreso.registrado_por}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <tr
      className={`border-b border-line-soft last:border-b-0 ${anulado ? 'text-ink-soft' : ''} ${seleccionado ? 'bg-accent-soft/60' : ''}`}
    >
      <td className="px-4 py-3 align-top whitespace-nowrap">{fecha(ingreso.fecha)}</td>
      <td className="px-4 py-3 align-top">
        <p className="font-semibold">{ingreso.concepto}</p>
        {detalle && <p className="mt-0.5 text-[14px] text-ink-soft">{detalle}</p>}
        {anulado && (
          <p className="mt-1 text-[14px] text-ink">
            Anulado el {fechaHoraDesdeUtc(ingreso.anulado_en)}
            {ingreso.anulado_por ? ` por ${ingreso.anulado_por}` : ''}: {ingreso.motivo_anulacion}
          </p>
        )}
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <Marca>{nombreCategoria(ingreso.categoria)}</Marca>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <p>{capitalizar(ingreso.medio_pago ?? '—')}</p>
        {ingreso.comprobante && <p className="font-mono text-[13px] text-ink-soft">{ingreso.comprobante}</p>}
      </td>
      <td
        className={`px-4 py-3 text-right align-top font-mono text-[15px] whitespace-nowrap ${anulado ? 'line-through' : ''}`}
      >
        {moneda(ingreso.monto)}
      </td>
      <td className="px-4 py-3 text-right align-top">
        {anulado ? (
          <Estado>Anulado</Estado>
        ) : (
          <Boton variante="sutil" chico onClick={() => onAnular(ingreso)}>
            Anular
          </Boton>
        )}
      </td>
    </tr>
  )
}

export default function Ingresos() {
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
    Promise.all([listarIngresos({ anio, mes, categoria, pagina, porPagina: POR_PAGINA }), cobradoDelMes])
      .then(([ingresos, cobrado]) => vivo && setRespuesta({ clave, datos: { ...ingresos, cobrado, periodo: periodoElegido } }))
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

  function abrir(tipo, ingreso = null) {
    setAviso(null)
    setPanel({ tipo, ingreso })
  }

  function cerrarYRecargar(mensaje) {
    setPanel(null)
    setAviso(mensaje)
    setVersion((v) => v + 1)
  }

  function ingresoGuardado(ingreso) {
    setFiltros({ periodo: ingreso.fecha.slice(0, 7), categoria: '', pagina: 1 })
    cerrarYRecargar(`Se registró "${ingreso.concepto}" por ${moneda(ingreso.monto)} en ${nombreCategoria(ingreso.categoria)}.`)
  }

  function ingresoAnulado(ingreso) {
    cerrarYRecargar(`Se anuló "${ingreso.concepto}" por ${moneda(ingreso.monto)}. Queda en la lista pero ya no suma en los totales.`)
  }

  function desactualizado(mensaje) {
    cerrarYRecargar(`${mensaje}. Se actualizó la lista.`)
  }

  const cargando = respuesta?.clave !== clave
  const datos = respuesta?.datos
  const error = !cargando && respuesta?.error
  const ingresos = datos?.ingresos ?? []
  const resumen = datos?.resumen
  const categorias = (resumen?.por_categoria ?? []).map((c) => c.categoria).filter(Boolean)
  if (categoria && !categorias.includes(categoria)) categorias.push(categoria)

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Ingresos</h1>
          <p className="mt-1 text-[16px] text-ink-soft">
            Ingresos de la institución que no son cuotas, en {periodo(periodoElegido)}
          </p>
        </div>
        {!panel && (
          <Boton icono="mas" className="shrink-0" onClick={() => abrir('registrar')}>
            Registrar ingreso
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
            <AnularIngreso
              key={`anular-${panel.ingreso.id}`}
              ingreso={panel.ingreso}
              onCancelar={() => setPanel(null)}
              onAnulado={ingresoAnulado}
              onDesactualizado={desactualizado}
            />
          ) : (
            <FormularioIngreso onCancelar={() => setPanel(null)} onGuardado={ingresoGuardado} />
          )}
        </div>
      )}

      {resumen && (
        <div className={`mt-6 space-y-4 ${cargando ? 'opacity-60' : ''}`}>
          <Balance resumen={resumen} cobrado={datos.cobrado} periodoElegido={datos.periodo} />
          {resumen.por_categoria.length > 0 && (
            <PorCategoria
              titulo="Por origen"
              resumen={resumen}
              elegida={categoria}
              onElegir={(c) => filtrar('categoria', c)}
            />
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
        <Filtro etiqueta="Origen" value={categoria} onChange={(e) => filtrar('categoria', e.target.value)}>
          <option value="">Todos</option>
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
        {ingresos.length === 0 ? (
          <Vacio cargando={!datos && cargando} onReintentar={() => setIntento((n) => n + 1)}>
            {!datos
              ? cargando
                ? 'Buscando los ingresos del período…'
                : 'No se pudieron cargar los ingresos.'
              : categoria
                ? 'No hay ingresos de ese origen en el período.'
                : `No hay ingresos extras registrados en ${periodo(periodoElegido)}.`}
          </Vacio>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className={`${claseCabecera} whitespace-nowrap`}>
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Concepto</th>
                <th className="px-4 py-3 font-normal">Origen</th>
                <th className="px-4 py-3 font-normal">Medio de pago</th>
                <th className="px-4 py-3 text-right font-normal">Monto</th>
                <th className="px-4 py-3 font-normal">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((i) => (
                <FilaIngreso
                  key={i.id}
                  ingreso={i}
                  seleccionado={panel?.ingreso?.id === i.id}
                  onAnular={(ingreso) => abrir('anular', ingreso)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {datos?.paginacion && ingresos.length > 0 && (
        <Paginado
          paginacion={datos.paginacion}
          cantidad={ingresos.length}
          cargando={cargando}
          unidad={['ingreso', 'ingresos']}
          onPagina={(p) => setFiltros((f) => ({ ...f, pagina: p }))}
        />
      )}
    </div>
  )
}
