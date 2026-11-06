import { Fragment, useEffect, useState } from 'react'
import { generarReporte, listarReportes } from '../../api/reportes'
import { Aviso, Boton, Cargando, Filtro, Vacio, claseCabecera } from '../../components/ui'
import { fecha, hoy, periodo, periodoActual } from '../internos/formato'
import { exportarExcel, exportarPdf } from './exportar'
import GraficoMensual, { TablaMensual } from './GraficoMensual'
import {
  APILADOS,
  NOTA_INDICADORES,
  RANGOS,
  SERIES,
  SERIE_DE_LA_TARJETA,
  agruparIndicadores,
  colorDeIndicador,
  columnasDeIndicadores,
  esTextoLargo,
  estaListo,
  formatear,
  formatearCorto,
  formatoDeLaSerie,
  mesesDeCierre,
  nombreDelRango,
  rangoDe,
  sinMovimientos,
  tieneDetalle,
  tieneSerie,
} from './reporte'

function Tarjeta({ tarjeta, color }) {
  const negativo = tarjeta.formato === 'moneda' && tarjeta.valor < 0
  return (
    <div className="rounded-sm border border-line bg-surface px-5 py-4">
      <p className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
        <span className={`h-2 w-2 rounded-full ${color ?? 'bg-line-strong'}`} aria-hidden="true" />
        {tarjeta.etiqueta}
      </p>
      <p
        className={`mt-2 font-serif text-[28px] font-semibold whitespace-nowrap ${negativo ? 'text-danger' : 'text-ink'}`}
        title={formatear(tarjeta.valor, tarjeta.formato)}
      >
        {formatearCorto(tarjeta.valor, tarjeta.formato)}
      </p>
    </div>
  )
}

function Tarjetas({ reporte }) {
  const claves = reporte.serie.lineas.map((l) => l.clave)
  return (
    <div className="grid grid-cols-3 gap-4">
      {reporte.tarjetas.map((t) => {
        const j = claves.indexOf(SERIE_DE_LA_TARJETA[t.clave] ?? t.clave)
        return <Tarjeta key={t.clave} tarjeta={t} color={j === -1 ? null : SERIES[j].fondo} />
      })}
    </div>
  )
}

function PorMes({ reporte }) {
  const [verTabla, setVerTabla] = useState(false)
  const formato = formatoDeLaSerie(reporte)
  const apilado = APILADOS.includes(reporte.id)
  const { lineas } = reporte.serie
  const vacio = sinMovimientos(reporte)

  return (
    <section className={`rounded-sm border border-line bg-surface px-6 py-5 ${verTabla ? '' : 'print:break-inside-avoid'}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-serif text-[20px] font-semibold text-ink">Mes a mes</h2>
        {!vacio && (
          <div className="flex items-center gap-5">
            {lineas.length > 1 && !verTabla && (
              <ul className="flex items-center gap-4">
                {lineas.map((l, j) => (
                  <li key={l.clave} className="flex items-center gap-2 text-[14px] text-ink-soft">
                    <span className={`h-2.5 w-2.5 rounded-[3px] ${SERIES[j].fondo}`} aria-hidden="true" />
                    {l.etiqueta}
                  </li>
                ))}
              </ul>
            )}
            <Boton variante="secundario" chico className="print:hidden" onClick={() => setVerTabla((v) => !v)}>
              {verTabla ? 'Ver gráfico' : 'Ver tabla'}
            </Boton>
          </div>
        )}
      </div>
      {vacio ? (
        <Vacio>No hubo movimientos en el rango elegido.</Vacio>
      ) : verTabla ? (
        <TablaMensual serie={reporte.serie} formato={formato} apilado={apilado} />
      ) : (
        <GraficoMensual serie={reporte.serie} formato={formato} apilado={apilado} />
      )}
    </section>
  )
}

function Indicadores({ reporte }) {
  const nota = NOTA_INDICADORES[reporte.id]
  const claves = reporte.serie.lineas.map((l) => l.clave)
  const grupos = agruparIndicadores(reporte)
  return (
    <section className="rounded-sm border border-line bg-surface px-6 py-5 print:break-inside-avoid">
      <h2 className="font-serif text-[20px] font-semibold text-ink">Indicadores</h2>
      {nota && <p className="mt-1 text-[14px] text-ink-soft">{nota}</p>}
      {grupos.map((grupo) => (
        <div key={grupo.titulo ?? 'todos'} className="mt-5 first-of-type:mt-4">
          {grupo.titulo && <h3 className="mb-3 text-[15px] font-semibold text-ink">{grupo.titulo}</h3>}
          <ListaDeIndicadores
            indicadores={grupo.indicadores}
            claves={claves}
            columnas={grupo.titulo ? 'grid-cols-5' : columnasDeIndicadores(grupo.indicadores.length)}
          />
        </div>
      ))}
    </section>
  )
}

function ListaDeIndicadores({ indicadores, claves, columnas }) {
  return (
    <ul className={`grid items-end gap-x-8 gap-y-5 ${columnas}`}>
      {indicadores.map((i) => (
        <li key={i.clave}>
          <p className="text-[14px] text-ink-soft">{i.etiqueta}</p>
          <p className={`mt-1 font-mono text-[20px] ${i.valor < 0 ? 'text-danger' : 'text-ink'}`}>
            {formatear(i.valor, i.formato)}
          </p>
          {i.formato === 'porcentaje' ? (
            <div className="mt-2 h-1 rounded-full bg-line">
              <div
                className={`h-1 rounded-full ${colorDeIndicador(i, claves)}`}
                style={{ width: `${Math.min(Math.abs(i.valor), 100)}%` }}
              />
            </div>
          ) : (
            <div className="mt-2 h-1" aria-hidden="true" />
          )}
        </li>
      ))}
    </ul>
  )
}

function ValorDeDetalle({ valor, formato }) {
  if (!Array.isArray(valor)) return formatear(valor, formato)
  return valor.map((v, k) => (
    <Fragment key={k}>
      {k > 0 && ', '}
      <span className="whitespace-nowrap">{formatear(v, formato)}</span>
    </Fragment>
  ))
}

function claseDeCelda(valor, formato) {
  if (formato !== 'texto') return 'text-right font-mono text-[15px] whitespace-nowrap tabular-nums print:text-[12px]'
  return esTextoLargo(valor) ? 'min-w-32' : 'whitespace-nowrap'
}

function Detalle({ detalle }) {
  const { columnas, filas } = detalle
  const alinear = (c) => (c.formato === 'texto' ? '' : 'text-right')
  return (
    <section className="rounded-sm border border-line bg-surface px-6 py-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-[20px] font-semibold text-ink">Detalle</h2>
        <p className="text-[14px] text-ink-soft">
          {filas.length} {filas.length === 1 ? 'registro' : 'registros'}
        </p>
      </div>
      {filas.length === 0 ? (
        <Vacio>No hay registros para el rango elegido.</Vacio>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line print:overflow-visible">
          <table className="w-full text-left text-[16px] text-ink print:text-[13px]">
            <thead>
              <tr className={claseCabecera}>
                {columnas.map((c) => (
                  <th key={c.clave} className={`px-3 py-3 align-bottom font-normal print:px-2 ${alinear(c)}`}>
                    {c.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, i) => (
                <tr key={i} className="border-b border-line-soft last:border-b-0 print:break-inside-avoid">
                  {columnas.map((c) => (
                    <td key={c.clave} className={`px-3 py-2.5 print:px-2 ${claseDeCelda(fila[c.clave], c.formato)}`}>
                      <ValorDeDetalle valor={fila[c.clave]} formato={c.formato} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function Reportes({ accion }) {
  const [catalogo, setCatalogo] = useState(null)
  const [intentoCatalogo, setIntentoCatalogo] = useState(0)
  const [filtros, setFiltros] = useState({ reporte: accion?.reporte ?? null, rango: 'anio', cierre: periodoActual() })
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const [exportando, setExportando] = useState(null)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    let vivo = true
    listarReportes()
      .then((reportes) => vivo && setCatalogo({ reportes }))
      .catch((err) => vivo && setCatalogo({ error: err.message }))
    return () => {
      vivo = false
    }
  }, [intentoCatalogo])

  const reportes = catalogo?.reportes ?? []
  const elegido = reportes.find((r) => r.id === filtros.reporte) ?? reportes.find(estaListo)
  const rango = rangoDe(filtros.cierre, filtros.rango)
  const clave = elegido ? `${elegido.id}|${rango.desde}|${rango.hasta}|${intento}` : null

  useEffect(() => {
    if (!clave) return
    let vivo = true
    const [id, desde, hasta] = clave.split('|')
    generarReporte(id, { desde, hasta })
      .then((reporte) => vivo && setRespuesta({ clave, reporte }))
      .catch((err) => vivo && setRespuesta({ clave, error: err.message }))
    return () => {
      vivo = false
    }
  }, [clave])

  function filtrar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }))
    setAviso(null)
  }

  if (!catalogo) {
    return <Cargando onReintentar={() => setIntentoCatalogo((n) => n + 1)}>Buscando los reportes disponibles…</Cargando>
  }

  if (catalogo.error) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Reportes</h1>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1">
            <Aviso>{catalogo.error}</Aviso>
          </div>
          <Boton
            variante="secundario"
            onClick={() => {
              setCatalogo(null)
              setIntentoCatalogo((n) => n + 1)
            }}
          >
            Reintentar
          </Boton>
        </div>
      </div>
    )
  }

  const cargando = respuesta?.clave !== clave
  const error = !cargando && respuesta?.error
  const reporte = !error && respuesta?.reporte

  async function exportar(tipo) {
    setExportando(tipo)
    setAviso(null)
    try {
      const destino = await (tipo === 'excel' ? exportarExcel : exportarPdf)(reporte, rango)
      if (destino) setAviso({ tono: 'ok', texto: `Reporte guardado en ${destino}` })
    } catch {
      setAviso({
        tono: 'peligro',
        texto: 'No se pudo guardar el reporte. Si el archivo está abierto en otro programa, cerralo y probá de nuevo.',
      })
    } finally {
      setExportando(null)
    }
  }

  const sinExportar = !reporte || cargando || exportando !== null

  return (
    <div className="mx-auto max-w-6xl px-8 py-8 print:max-w-none print:p-0">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-serif text-[28px] font-semibold text-ink">Reportes</h1>
          <p className="mt-1 text-[16px] text-ink-soft">
            {elegido ? `${elegido.titulo}, ${nombreDelRango(rango)}` : 'Todavía no hay reportes para consultar.'}
          </p>
          <p className="mt-1 hidden text-[14px] text-ink-soft print:block">Generado el {fecha(hoy())}</p>
        </div>
        {elegido && (
          <div className="flex shrink-0 gap-2 print:hidden">
            <Boton variante="secundario" icono="descarga" disabled={sinExportar} onClick={() => exportar('excel')}>
              {exportando === 'excel' ? 'Exportando…' : 'Exportar a Excel'}
            </Boton>
            <Boton variante="secundario" icono="descarga" disabled={sinExportar} onClick={() => exportar('pdf')}>
              {exportando === 'pdf' ? 'Exportando…' : 'Exportar a PDF'}
            </Boton>
          </div>
        )}
      </div>

      {elegido && (
        <>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_220px_260px] gap-3 print:hidden">
            <Filtro etiqueta="Reporte" value={elegido.id} onChange={(e) => filtrar('reporte', e.target.value)}>
              {reportes.map((r) => (
                <option key={r.id} value={r.id} disabled={!estaListo(r)}>
                  {r.titulo}
                  {estaListo(r) ? '' : ' (próximamente)'}
                </option>
              ))}
            </Filtro>
            <Filtro etiqueta="Rango" value={filtros.rango} onChange={(e) => filtrar('rango', e.target.value)}>
              {RANGOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.etiqueta}
                </option>
              ))}
            </Filtro>
            <Filtro
              etiqueta="Cierre"
              claseSelect="capitalize"
              value={filtros.cierre}
              onChange={(e) => filtrar('cierre', e.target.value)}
            >
              {mesesDeCierre().map((p) => (
                <option key={p} value={p}>
                  {periodo(p)}
                </option>
              ))}
            </Filtro>
          </div>

          {aviso && (
            <div className="mt-6 print:hidden">
              <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center gap-4 print:hidden">
              <div className="flex-1">
                <Aviso>{error}</Aviso>
              </div>
              <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </Boton>
            </div>
          )}

          {reporte ? (
            <div className={`mt-6 space-y-4 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
              <Tarjetas reporte={reporte} />
              {tieneSerie(reporte) && <PorMes key={reporte.id} reporte={reporte} />}
              {reporte.indicadores.length > 0 && <Indicadores reporte={reporte} />}
              {tieneDetalle(reporte) && <Detalle detalle={reporte.detalle} />}
            </div>
          ) : (
            !error && (
              <div className="mt-6 rounded-sm border border-line bg-surface">
                <Vacio cargando onReintentar={() => setIntento((n) => n + 1)}>
                  Calculando el reporte del período elegido…
                </Vacio>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
