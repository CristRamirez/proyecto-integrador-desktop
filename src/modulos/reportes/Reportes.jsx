import { useEffect, useState } from 'react'
import { generarReporte, listarReportes } from '../../api/reportes'
import { Aviso, Boton, Cargando, Filtro, Vacio } from '../../components/ui'
import { periodo, periodoActual } from '../internos/formato'
import GraficoMensual, { TablaMensual } from './GraficoMensual'
import {
  APILADOS,
  BARRA_INDICADOR,
  NOTA_INDICADORES,
  RANGOS,
  SERIES,
  estaListo,
  formatear,
  formatearCorto,
  formatoDeLaSerie,
  mesesDeCierre,
  nombreDelRango,
  rangoDe,
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
        const j = claves.indexOf(t.clave)
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
  const sinMovimientos = lineas.every((l) => l.valores.every((v) => !v))

  return (
    <section className="rounded-sm border border-line bg-surface px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-serif text-[20px] font-semibold text-ink">Mes a mes</h2>
        {!sinMovimientos && (
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
            <Boton variante="secundario" chico onClick={() => setVerTabla((v) => !v)}>
              {verTabla ? 'Ver gráfico' : 'Ver tabla'}
            </Boton>
          </div>
        )}
      </div>
      {sinMovimientos ? (
        <Vacio>No hubo movimientos en el rango elegido.</Vacio>
      ) : verTabla ? (
        <TablaMensual serie={reporte.serie} formato={formato} apilado={apilado} />
      ) : (
        <GraficoMensual serie={reporte.serie} formato={formato} apilado={apilado} />
      )}
    </section>
  )
}

function Indicadores({ indicadores, nota }) {
  return (
    <section className="rounded-sm border border-line bg-surface px-6 py-5">
      <h2 className="font-serif text-[20px] font-semibold text-ink">Indicadores</h2>
      {nota && <p className="mt-1 text-[14px] text-ink-soft">{nota}</p>}
      <ul className="mt-4 grid grid-cols-3 gap-x-8 gap-y-5">
        {indicadores.map((i) => (
          <li key={i.clave}>
            <p className="text-[14px] text-ink-soft">{i.etiqueta}</p>
            <p className={`mt-1 font-mono text-[20px] ${i.valor < 0 ? 'text-danger' : 'text-ink'}`}>
              {formatear(i.valor, i.formato)}
            </p>
            {i.formato === 'porcentaje' && (
              <div className="mt-2 h-1 rounded-full bg-line">
                <div
                  className={`h-1 rounded-full ${i.valor < 0 ? 'bg-danger' : (BARRA_INDICADOR[i.clave] ?? 'bg-accent')}`}
                  style={{ width: `${Math.min(Math.abs(i.valor), 100)}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Reportes() {
  const [catalogo, setCatalogo] = useState(null)
  const [intentoCatalogo, setIntentoCatalogo] = useState(0)
  const [filtros, setFiltros] = useState({ reporte: null, rango: 'anio', cierre: periodoActual() })
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)

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
  }

  if (!catalogo) {
    return <Cargando>Cargando reportes…</Cargando>
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

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <h1 className="font-serif text-[28px] font-semibold text-ink">Reportes</h1>
      <p className="mt-1 text-[16px] text-ink-soft">
        {elegido ? `${elegido.titulo}, ${nombreDelRango(rango)}` : 'Todavía no hay reportes para consultar.'}
      </p>

      {elegido && (
        <>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_220px_260px] gap-3">
            <Filtro etiqueta="Reporte" value={elegido.id} onChange={(e) => filtrar('reporte', e.target.value)}>
              {reportes.map((r) => (
                <option key={r.id} value={r.id} disabled={!estaListo(r)}>
                  {r.codigo} · {r.titulo}
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

          {reporte ? (
            <div className={`mt-6 space-y-4 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
              <Tarjetas reporte={reporte} />
              <PorMes key={reporte.id} reporte={reporte} />
              {reporte.indicadores.length > 0 && (
                <Indicadores indicadores={reporte.indicadores} nota={NOTA_INDICADORES[reporte.id]} />
              )}
            </div>
          ) : (
            !error && (
              <div className="mt-6 rounded-sm border border-line bg-surface">
                <Vacio cargando>Armando el reporte…</Vacio>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
