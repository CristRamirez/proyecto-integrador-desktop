import { fecha, hoy, periodo } from '../internos/formato'
import {
  APILADOS,
  NOTA_INDICADORES,
  agruparIndicadores,
  formatoDeLaSerie,
  lineasDeLaTabla,
  nombreDelRango,
  sinMovimientos,
  totalDeLaLinea,
} from './reporte'

const TITULO = { fontWeight: 'bold', fontSize: 16 }
const SECCION = { fontWeight: 'bold', fontSize: 13 }
const NOTA = { textColor: '#5f574b' }
const CABECERA = { fontWeight: 'bold', backgroundColor: '#f8f4ec', bottomBorderStyle: 'thin', bottomBorderColor: '#c4b9a6' }
const TOTAL = { fontWeight: 'bold', backgroundColor: '#f8f4ec', topBorderStyle: 'thin', topBorderColor: '#c4b9a6' }

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function celda(valor, formato, estilo = {}) {
  if (valor === null || valor === undefined) return null
  if (formato === 'moneda') return { value: Math.round(valor * 100) / 100, format: '"$" #,##0.00', ...estilo }
  if (formato === 'porcentaje') return { value: Math.round(valor * 1e4) / 1e6, format: '0.0%', ...estilo }
  if (formato === 'numero') return { value: valor, format: Number.isInteger(valor) ? '#,##0' : '#,##0.0', ...estilo }
  return { value: String(valor), ...estilo }
}

function filasPorMes(reporte) {
  if (sinMovimientos(reporte)) return [[{ value: 'No hubo movimientos en el rango elegido.', ...NOTA }]]
  const formato = formatoDeLaSerie(reporte)
  const lineas = lineasDeLaTabla(reporte.serie, APILADOS.includes(reporte.id))
  return [
    [{ value: 'Mes', ...CABECERA }, ...lineas.map((l) => ({ value: l.etiqueta, align: 'right', ...CABECERA }))],
    ...reporte.serie.etiquetas.map((etiqueta, i) => [
      capitalizar(periodo(etiqueta)),
      ...lineas.map((l) => celda(l.valores[i], formato)),
    ]),
    [{ value: 'Total', ...TOTAL }, ...lineas.map((l) => celda(totalDeLaLinea(l), formato, TOTAL))],
  ]
}

function filasDeIndicadores(reporte) {
  if (reporte.indicadores.length === 0) return []
  const nota = NOTA_INDICADORES[reporte.id]
  const filas = [[], [{ value: 'Indicadores', ...SECCION }]]
  if (nota) filas.push([{ value: nota, ...NOTA }])
  agruparIndicadores(reporte).forEach((grupo, k) => {
    if (k > 0) filas.push([])
    if (grupo.titulo) filas.push([{ value: grupo.titulo, fontWeight: 'bold' }])
    filas.push(...grupo.indicadores.map((i) => [i.etiqueta, celda(i.valor, i.formato)]))
  })
  return filas
}

function hojaDelReporte(reporte, rango) {
  return [
    [{ value: reporte.titulo, ...TITULO }],
    [{ value: capitalizar(nombreDelRango(rango)), ...NOTA }],
    [{ value: `Generado el ${fecha(hoy())}`, ...NOTA }],
    [],
    [{ value: 'Totales', ...SECCION }],
    ...reporte.tarjetas.map((t) => [t.etiqueta, celda(t.valor, t.formato)]),
    [],
    [{ value: 'Mes a mes', ...SECCION }],
    ...filasPorMes(reporte),
    ...filasDeIndicadores(reporte),
  ]
}

function columnas(reporte) {
  const cantidad = lineasDeLaTabla(reporte.serie, APILADOS.includes(reporte.id)).length
  return [{ width: 38 }, ...Array.from({ length: Math.max(cantidad, 1) }, () => ({ width: 20 }))]
}

function nombreDeArchivo(reporte, rango) {
  return `${reporte.titulo} - ${nombreDelRango(rango)}`
}

export async function exportarExcel(reporte, rango) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const archivo = writeExcelFile(hojaDelReporte(reporte, rango), { sheet: 'Reporte', columns: columnas(reporte) })
  const nombre = nombreDeArchivo(reporte, rango)
  if (!window.app?.guardarExcel) {
    await archivo.toFile(`${nombre}.xlsx`)
    return null
  }
  const blob = await archivo.toBlob()
  return window.app.guardarExcel(nombre, await blob.arrayBuffer())
}

export async function exportarPdf(reporte, rango) {
  if (!window.app?.guardarPdf) {
    window.print()
    return null
  }
  return window.app.guardarPdf(nombreDeArchivo(reporte, rango))
}
