import { Fragment, useEffect, useState } from 'react'
import { obtenerCuentaCorriente } from '../../api/cobranzas'
import { Aviso, Boton, Dato, Marca, Seccion } from '../../components/ui'
import { fecha, hoy, moneda, periodo } from '../internos/formato'

function centavos(valor) {
  return Math.round(valor * 100) / 100
}

function tieneSaldo(cuota) {
  return cuota.estado !== 'anulada' && cuota.saldo_pendiente > 0
}

function Pagos({ pagos }) {
  return (
    <table className="w-full text-left text-[15px] text-ink">
      <thead>
        <tr className="border-b border-line font-mono text-[11px] tracking-[0.14em] text-ink-soft uppercase">
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
          <tr key={p.id} className="border-b border-line last:border-b-0">
            <td className="py-2 pr-4">{fecha(p.fecha_pago)}</td>
            <td className="py-2 pr-4 capitalize">{p.medio_pago}</td>
            <td className="py-2 pr-4 font-mono text-[14px] select-text">{p.numero_comprobante ?? '—'}</td>
            <td className="py-2 pr-4">{p.observaciones ?? '—'}</td>
            <td className="py-2 pr-4 text-ink-soft">{p.registrado_por ?? '—'}</td>
            <td className="py-2 text-right font-mono">{moneda(p.monto)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function CuentaCorriente({ id, onVolver }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [abiertas, setAbiertas] = useState(() => new Set())

  useEffect(() => {
    let vivo = true
    obtenerCuentaCorriente(id)
      .then((d) => vivo && setDatos(d))
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

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
        <Aviso>{error}</Aviso>
        <div className="flex gap-3">
          <Boton variante="secundario" icono="volver" onClick={onVolver}>
            Volver a la ficha
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
  const vencidas = conSaldo.filter((c) => c.fecha_vencimiento < hoy())
  const hayAnuladas = cuotas.some((c) => c.estado === 'anulada')

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] tracking-[0.1em] text-ink-soft">
            Cuenta corriente · DNI <span className="select-text">{interno.dni}</span>
          </p>
          <h1 className="mt-1 font-serif text-[28px] font-semibold text-ink">
            {interno.apellido}, {interno.nombre}
          </h1>
        </div>
        <Boton icono="volver" variante="sutil" onClick={onVolver}>
          Volver a la ficha
        </Boton>
      </div>

      <div className="space-y-6">
        <dl className="grid grid-cols-3 gap-x-6 rounded-sm border border-line bg-surface px-7 py-6">
          <Dato etiqueta="Total adeudado">
            <span className="font-mono text-[26px] font-semibold">{moneda(total_adeudado)}</span>
          </Dato>
          <Dato etiqueta="Cuotas con saldo">{conSaldo.length}</Dato>
          <Dato etiqueta="Vencidas impagas">{vencidas.length}</Dato>
        </dl>

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
                      <span className="sr-only">Pagos</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cuotas.map((c) => {
                    const abierta = abiertas.has(c.id)
                    const anulada = c.estado === 'anulada'
                    const vencida = tieneSaldo(c) && c.fecha_vencimiento < hoy()
                    const importe = `py-3 pr-4 text-right font-mono ${anulada ? 'line-through' : ''}`

                    return (
                      <Fragment key={c.id}>
                        <tr className={`border-b border-line ${anulada ? 'text-ink-soft' : ''}`}>
                          <td className="py-3 pr-4 font-semibold capitalize">{periodo(c.periodo)}</td>
                          <td className="py-3 pr-4">
                            {fecha(c.fecha_vencimiento)}
                            {vencida && <span className="block text-[13px] font-semibold">Vencida</span>}
                          </td>
                          <td className={importe}>
                            {moneda(c.total)}
                            {c.interes_aplicado > 0 && (
                              <span className="block text-[13px] text-ink-soft">
                                incluye {moneda(c.interes_aplicado)} de interés
                              </span>
                            )}
                          </td>
                          <td className={importe}>{moneda(centavos(c.total - c.saldo_pendiente))}</td>
                          <td className={`${importe} font-semibold`}>{moneda(c.saldo_pendiente)}</td>
                          <td className="py-3 pr-4">
                            <Marca>{c.estado}</Marca>
                          </td>
                          <td className="py-3 text-right">
                            {c.pagos?.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => alternar(c.id)}
                                aria-expanded={abierta}
                                className="cursor-pointer text-[15px] whitespace-nowrap text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                              >
                                {abierta ? 'Ocultar' : 'Ver'} pagos ({c.pagos.length})
                              </button>
                            ) : (
                              <span className="text-[15px] whitespace-nowrap text-ink-soft">Sin pagos</span>
                            )}
                          </td>
                        </tr>
                        {abierta && (
                          <tr className="border-b border-line bg-paper">
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
      </div>
    </div>
  )
}
