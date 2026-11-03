import { useEffect, useRef, useState } from 'react'
import { claseCabecera } from '../../components/ui'
import { periodo } from '../internos/formato'
import { SERIES, escala, formatear, formatearEje, mesCorto } from './reporte'

const ALTO = 300
const MARGEN = { arriba: 12, derecha: 8, abajo: 48, izquierda: 84 }
const ANCHO_BARRA = 24
const HUECO = 2
const ANCHO_AYUDA = 256

function useAncho(ref) {
  const [ancho, setAncho] = useState(0)
  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [ref])
  return ancho
}

function barra(x, arriba, ancho, base, redondeada = true) {
  const alto = base - arriba
  if (alto <= 0) return null
  if (!redondeada) return `M${x},${base}V${arriba}H${x + ancho}V${base}Z`
  const r = Math.min(4, ancho / 2, alto)
  return `M${x},${base}V${arriba + r}A${r},${r} 0 0 1 ${x + r},${arriba}H${x + ancho - r}A${r},${r} 0 0 1 ${x + ancho},${arriba + r}V${base}Z`
}

function totalDelMes(lineas, indice) {
  return lineas.reduce((suma, l) => suma + (l.valores[indice] || 0), 0)
}

function Ayuda({ etiqueta, lineas, indice, formato, izquierda, apilado }) {
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-sm border border-line bg-surface px-4 py-3 shadow-sm"
      style={{ left: izquierda, top: MARGEN.arriba, width: ANCHO_AYUDA }}
    >
      <p className="text-[13px] font-medium text-ink-soft capitalize">{periodo(etiqueta)}</p>
      <ul className="mt-2 space-y-1.5">
        {lineas.map((linea, j) => (
          <li key={linea.clave} className="flex items-center gap-2.5">
            <span className={`h-0.5 w-3 shrink-0 rounded-full ${SERIES[j].fondo}`} aria-hidden="true" />
            <span className="font-mono text-[15px] font-semibold text-ink">{formatear(linea.valores[indice], formato)}</span>
            <span className="truncate text-[13px] text-ink-soft">{linea.etiqueta}</span>
          </li>
        ))}
        {apilado && (
          <li className="flex items-center gap-2.5 border-t border-line-soft pt-1.5">
            <span className="w-3 shrink-0" aria-hidden="true" />
            <span className="font-mono text-[15px] font-semibold text-ink">
              {formatear(totalDelMes(lineas, indice), formato)}
            </span>
            <span className="text-[13px] text-ink-soft">Total</span>
          </li>
        )}
      </ul>
    </div>
  )
}

export default function GraficoMensual({ serie, formato, apilado = false }) {
  const ref = useRef(null)
  const ancho = useAncho(ref)
  const [activo, setActivo] = useState(null)
  const { etiquetas, lineas } = serie

  const maximo = apilado
    ? Math.max(0, ...etiquetas.map((_, i) => totalDelMes(lineas, i)))
    : Math.max(0, ...lineas.flatMap((l) => l.valores))
  const { tope, marcas } = escala(maximo)
  const anchoPlot = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha)
  const altoPlot = ALTO - MARGEN.arriba - MARGEN.abajo
  const base = MARGEN.arriba + altoPlot
  const banda = etiquetas.length ? anchoPlot / etiquetas.length : 0
  const columnas = apilado ? 1 : lineas.length
  const anchoBarra = Math.max(2, Math.min(ANCHO_BARRA, (banda * 0.7 - HUECO * (columnas - 1)) / Math.max(1, columnas)))
  const anchoGrupo = anchoBarra * columnas + HUECO * (columnas - 1)
  const y = (valor) => base - (Math.max(0, valor) / tope) * altoPlot
  const inicioBanda = (i) => MARGEN.izquierda + banda * i

  function segmentos(i, inicioGrupo) {
    if (!apilado) {
      return lineas.map((linea, j) => ({
        clave: linea.clave,
        j,
        d: barra(inicioGrupo + j * (anchoBarra + HUECO), y(linea.valores[i]), anchoBarra, base),
      }))
    }
    const visibles = lineas.map((linea, j) => ({ linea, j })).filter(({ linea }) => linea.valores[i] > 0)
    let acumulado = 0
    return visibles.map(({ linea, j }, k) => {
      const abajo = y(acumulado) - (k > 0 ? HUECO : 0)
      acumulado += linea.valores[i]
      return { clave: linea.clave, j, d: barra(inicioGrupo, y(acumulado), anchoBarra, abajo, k === visibles.length - 1) }
    })
  }

  let izquierdaAyuda = 0
  if (activo !== null) {
    const derecha = inicioBanda(activo + 1) + 8
    izquierdaAyuda = derecha + ANCHO_AYUDA <= ancho ? derecha : Math.max(0, inicioBanda(activo) - 8 - ANCHO_AYUDA)
  }

  return (
    <div ref={ref} className="relative" style={{ height: ALTO }} onPointerLeave={() => setActivo(null)}>
      {ancho > 0 && (
        <svg
          width={ancho}
          height={ALTO}
          role="img"
          aria-label={`Gráfico de barras por mes: ${lineas.map((l) => l.etiqueta).join(', ')}`}
          className="block"
        >
          {marcas.map((marca) => (
            <g key={marca}>
              <line
                x1={MARGEN.izquierda}
                x2={ancho - MARGEN.derecha}
                y1={y(marca)}
                y2={y(marca)}
                className={marca === 0 ? 'stroke-line-strong' : 'stroke-line-soft'}
                strokeWidth="1"
              />
              <text
                x={MARGEN.izquierda - 12}
                y={y(marca)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-ink-soft font-mono text-[13px] tabular-nums"
              >
                {formatearEje(marca, formato)}
              </text>
            </g>
          ))}

          {etiquetas.map((etiqueta, i) => {
            const centro = inicioBanda(i) + banda / 2
            const inicioGrupo = centro - anchoGrupo / 2
            return (
              <g key={etiqueta}>
                {activo === i && (
                  <rect x={inicioBanda(i)} y={MARGEN.arriba} width={banda} height={altoPlot} className="fill-accent-soft/70" />
                )}
                {segmentos(i, inicioGrupo).map(
                  ({ clave, j, d }) => d && <path key={clave} d={d} className={SERIES[j].relleno} />
                )}
                <text x={centro} y={base + 20} textAnchor="middle" className="fill-ink-soft text-[13px]">
                  {mesCorto(etiqueta)}
                </text>
                {(i === 0 || etiqueta.endsWith('-01')) && (
                  <text x={centro} y={base + 38} textAnchor="middle" className="fill-ink-faint font-mono text-[12px]">
                    {etiqueta.slice(0, 4)}
                  </text>
                )}
                <rect
                  x={inicioBanda(i)}
                  y={MARGEN.arriba}
                  width={banda}
                  height={altoPlot + MARGEN.abajo}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${periodo(etiqueta)}: ${lineas.map((l) => `${l.etiqueta} ${formatear(l.valores[i], formato)}`).join(', ')}`}
                  onPointerEnter={() => setActivo(i)}
                  onFocus={() => setActivo(i)}
                  onBlur={() => setActivo(null)}
                  className="outline-none"
                />
              </g>
            )
          })}
        </svg>
      )}
      {activo !== null && (
        <Ayuda
          etiqueta={etiquetas[activo]}
          lineas={lineas}
          indice={activo}
          formato={formato}
          izquierda={izquierdaAyuda}
          apilado={apilado}
        />
      )}
    </div>
  )
}

export function TablaMensual({ serie, formato, apilado = false }) {
  const { etiquetas } = serie
  const lineas = apilado
    ? [...serie.lineas, { clave: 'total', etiqueta: 'Total', valores: etiquetas.map((_, i) => totalDelMes(serie.lineas, i)) }]
    : serie.lineas
  const totales = lineas.map((l) => l.valores.reduce((suma, v) => suma + v, 0))

  return (
    <div className="overflow-x-auto rounded-sm border border-line">
      <table className="w-full text-left text-[16px] text-ink">
        <thead>
          <tr className={`${claseCabecera} whitespace-nowrap`}>
            <th className="px-4 py-3 font-normal">Mes</th>
            {lineas.map((l) => (
              <th key={l.clave} className="px-4 py-3 text-right font-normal">
                {l.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {etiquetas.map((etiqueta, i) => (
            <tr key={etiqueta} className="border-b border-line-soft">
              <td className="px-4 py-2.5 capitalize">{periodo(etiqueta)}</td>
              {lineas.map((l) => (
                <td key={l.clave} className="px-4 py-2.5 text-right font-mono text-[15px] whitespace-nowrap tabular-nums">
                  {formatear(l.valores[i], formato)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-head font-semibold">
            <td className="px-4 py-2.5">Total</td>
            {totales.map((total, j) => (
              <td key={lineas[j].clave} className="px-4 py-2.5 text-right font-mono text-[15px] whitespace-nowrap tabular-nums">
                {formatear(total, formato)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
