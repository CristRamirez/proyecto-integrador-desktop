import { Fragment, useEffect, useRef, useState } from 'react'
import { obtenerCuentaCorriente } from '../../api/cobranzas'
import { Aviso, Boton, Seccion } from '../../components/ui'
import { fecha, moneda, periodo } from '../internos/formato'
import { estaVencida, tieneSaldo } from './cuota'
import EstadoCuota from './EstadoCuota'
import RegistrarPago from './RegistrarPago'

function centavos(valor) {
  return Math.round(valor * 100) / 100
}

// Misma regla que el back: las anuladas se listan pero no suman.
function totalAdeudado(cuotas) {
  return cuotas.filter((c) => c.estado !== 'anulada').reduce((total, c) => centavos(total + c.saldo_pendiente), 0)
}

function Resumen({ etiqueta, peligro = false, children }) {
  return (
    <div className="rounded-sm border border-line bg-surface px-5 py-4">
      <p className="font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">{etiqueta}</p>
      <p className={`mt-2 font-serif text-[28px] font-semibold ${peligro ? 'text-danger' : 'text-ink'}`}>{children}</p>
    </div>
  )
}

function Pagos({ pagos }) {
  return (
    <table className="w-full text-left text-[15px] text-ink">
      <thead>
        <tr className="border-b border-line font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
          <th className="py-2 pr-4 font-normal">Fecha</th>
          <th className="py-2 pr-4 font-normal">Medio</th>
          <th className="py-2 pr-4 font-normal">Comprobante</th>
          <th className="py-2 pr-4 font-normal">Observaciones</th>
          <th className="py-2 pr-4 font-normal">Registró</th>
          <th className="py-2 text-right font-normal">Monto</th>
        </tr>
      </thead>
      <tbody>
        {pagos.map((p) => (
          <tr key={p.id} className="border-b border-line-soft last:border-b-0">
            <td className="py-2 pr-4">{fecha(p.fecha_pago)}</td>
            <td className="py-2 pr-4 capitalize">{p.medio_pago}</td>
            <td className="py-2 pr-4 font-mono text-[14px] whitespace-nowrap select-text">{p.numero_comprobante ?? '—'}</td>
            <td className="py-2 pr-4">{p.observaciones ?? '—'}</td>
            <td className="py-2 pr-4 text-ink-soft">{p.registrado_por ?? '—'}</td>
            <td className="py-2 text-right font-mono">{moneda(p.monto)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// cuotaInicial: desde el listado de Cobranzas se llega con "Registrar pago" de una
// cuota puntual, y el formulario se abre apenas carga la cuenta corriente.
export default function CuentaCorriente({ id, cuotaInicial, onVolver, etiquetaVolver = 'Volver a la ficha' }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [abiertas, setAbiertas] = useState(() => new Set())
  const [pagando, setPagando] = useState(null)
  const [aviso, setAviso] = useState(null)
  const arriba = useRef(null)
  const formulario = useRef(null)
  const pagarAlCargar = useRef(cuotaInicial)

  useEffect(() => {
    if (pagando) formulario.current?.scrollIntoView({ behavior: 'smooth' })
  }, [pagando])

  useEffect(() => {
    let vivo = true
    obtenerCuentaCorriente(id)
      .then((d) => {
        if (!vivo) return
        setDatos(d)
        const cuota = pagarAlCargar.current && d.cuotas.find((c) => c.id === pagarAlCargar.current)
        pagarAlCargar.current = null
        if (cuota && tieneSaldo(cuota)) setPagando(cuota)
      })
      .catch((err) => vivo && setError(err.status === 404 ? 'El interno no existe.' : err.message))
    return () => {
      vivo = false
    }
  }, [id, intento])

  function alternar(idCuota) {
    setAbiertas((s) => {
      const nuevas = new Set(s)
      if (nuevas.has(idCuota)) nuevas.delete(idCuota)
      else nuevas.add(idCuota)
      return nuevas
    })
  }

  function abrirPago(cuota) {
    setAviso(null)
    setPagando(cuota)
  }

  // El back devuelve la cuota ya recalculada y todos sus pagos: se reemplaza en la
  // lista sin volver a pedir la cuenta corriente entera.
  function pagoRegistrado({ cuota, pagos }) {
    setDatos((d) => {
      const cuotas = d.cuotas.map((c) => (c.id === cuota.id ? { ...cuota, pagos } : c))
      return { ...d, cuotas, total_adeudado: totalAdeudado(cuotas) }
    })
    setAbiertas((s) => new Set(s).add(cuota.id))
    setPagando(null)
    setAviso({
      tono: 'ok',
      texto:
        cuota.saldo_pendiente > 0
          ? `Pago registrado. La cuota de ${periodo(cuota.periodo)} queda con un saldo de ${moneda(cuota.saldo_pendiente)}.`
          : `Pago registrado. La cuota de ${periodo(cuota.periodo)} quedó pagada.`,
    })
    arriba.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function cuotaDesactualizada(mensaje) {
    setPagando(null)
    setAviso({ tono: 'neutro', texto: `${mensaje}. Se actualizó la cuenta corriente.` })
    setIntento((n) => n + 1)
    arriba.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
        <Aviso>{error}</Aviso>
        <div className="flex gap-3">
          <Boton variante="secundario" icono="volver" onClick={onVolver}>
            {etiquetaVolver}
          </Boton>
          <Boton
            onClick={() => {
              setError(null)
              setIntento((n) => n + 1)
            }}
          >
            Reintentar
          </Boton>
        </div>
      </div>
    )
  }

  if (!datos) {
    return (
      <p className="py-16 text-center font-mono text-[13px] tracking-[0.18em] text-ink-soft uppercase" aria-busy="true">
        Cargando cuenta corriente…
      </p>
    )
  }

  const { interno, cuotas, total_adeudado } = datos
  const conSaldo = cuotas.filter(tieneSaldo)
  const vencidas = cuotas.filter(estaVencida)
  const hayAnuladas = cuotas.some((c) => c.estado === 'anulada')

  return (
    <div className="mx-auto max-w-5xl px-8 py-6">
      <Boton icono="volver" variante="sutil" chico className="-ml-3.5" onClick={onVolver}>
        {etiquetaVolver}
      </Boton>
      <div ref={arriba} className="mt-3 mb-6">
        <p className="font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">Cuenta corriente</p>
        <h1 className="mt-1 font-serif text-[28px] font-semibold text-ink">
          {interno.apellido}, {interno.nombre}
        </h1>
        <p className="mt-1 text-[15px] text-ink-soft">
          DNI <span className="font-mono select-text">{interno.dni}</span>
        </p>
      </div>

      {aviso && (
        <div className="mb-6">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Resumen etiqueta="Total adeudado" peligro={total_adeudado > 0}>
            {moneda(total_adeudado)}
          </Resumen>
          <Resumen etiqueta="Cuotas con saldo">{conSaldo.length}</Resumen>
          <Resumen etiqueta="Vencidas impagas" peligro={vencidas.length > 0}>
            {vencidas.length}
          </Resumen>
        </div>

        <Seccion titulo="Cuotas">
          {cuotas.length === 0 ? (
            <p className="text-[16px] text-ink-soft">El interno todavía no tiene cuotas generadas.</p>
          ) : (
            <>
              <table className="w-full text-left text-[16px] text-ink">
                <thead>
                  <tr className="border-b border-line font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
                    <th className="py-3 pr-4 font-normal">Período</th>
                    <th className="py-3 pr-4 font-normal">Vencimiento</th>
                    <th className="py-3 pr-4 text-right font-normal">Total</th>
                    <th className="py-3 pr-4 text-right font-normal">Pagado</th>
                    <th className="py-3 pr-4 text-right font-normal">Saldo</th>
                    <th className="py-3 pr-4 font-normal">Estado</th>
                    <th className="py-3 font-normal">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cuotas.map((c) => {
                    const abierta = abiertas.has(c.id)
                    const anulada = c.estado === 'anulada'
                    const vencida = estaVencida(c)
                    const importe = `py-3 pr-4 text-right font-mono ${anulada ? 'line-through' : ''}`

                    return (
                      <Fragment key={c.id}>
                        <tr
                          className={`border-b border-line-soft ${anulada ? 'text-ink-soft' : ''} ${pagando?.id === c.id ? 'bg-accent-soft/60' : ''}`}
                        >
                          <td className="py-3 pr-4 font-semibold whitespace-nowrap capitalize">{periodo(c.periodo)}</td>
                          <td className={`py-3 pr-4 ${vencida ? 'text-danger' : ''}`}>{fecha(c.fecha_vencimiento)}</td>
                          <td className={importe}>
                            {moneda(c.total)}
                            {c.interes_aplicado > 0 && (
                              <span className="block text-[13px] text-ink-soft">
                                incluye {moneda(c.interes_aplicado)} de interés
                              </span>
                            )}
                          </td>
                          <td className={importe}>
                            {moneda(centavos(c.total - c.saldo_pendiente))}
                            {c.pagos?.length > 0 && (
                              <button
                                type="button"
                                onClick={() => alternar(c.id)}
                                aria-expanded={abierta}
                                className="block w-full cursor-pointer text-right font-sans text-[13px] whitespace-nowrap text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                              >
                                {abierta
                                  ? 'Ocultar pagos'
                                  : `Ver ${c.pagos.length} ${c.pagos.length === 1 ? 'pago' : 'pagos'}`}
                              </button>
                            )}
                          </td>
                          <td className={`${importe} font-semibold`}>{moneda(c.saldo_pendiente)}</td>
                          <td className="py-3 pr-4">
                            <EstadoCuota cuota={c} />
                          </td>
                          <td className="py-3 text-right">
                            {tieneSaldo(c) && (
                              <Boton
                                variante="secundario"
                                chico
                                onClick={() => abrirPago(c)}
                                disabled={pagando?.id === c.id}
                              >
                                Registrar pago
                              </Boton>
                            )}
                          </td>
                        </tr>
                        {abierta && (
                          <tr className="border-b border-line-soft bg-paper">
                            <td colSpan={7} className="px-4 py-3">
                              <Pagos pagos={c.pagos} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
              {hayAnuladas && (
                <p className="mt-4 text-[14px] text-ink-soft">Las cuotas anuladas no suman al total adeudado.</p>
              )}
            </>
          )}
        </Seccion>

        {pagando && (
          <div ref={formulario}>
            <RegistrarPago
              key={pagando.id}
              cuota={pagando}
              onCancelar={() => setPagando(null)}
              onRegistrado={pagoRegistrado}
              onDesactualizada={cuotaDesactualizada}
            />
          </div>
        )}
      </div>
    </div>
  )
}
