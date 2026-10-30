import { useEffect, useRef, useState } from 'react'
import { listarHistoricoParametros, obtenerParametros } from '../../api/parametros'
import { Aviso, Boton, Cargando, Dato, Marca, Seccion } from '../../components/ui'
import { fecha, moneda } from '../internos/formato'
import FormularioParametros from './FormularioParametros'

function Historico({ configuraciones }) {
  return (
    <table className="w-full text-left text-[16px] text-ink">
      <thead>
        <tr className="border-b border-line text-[13px] font-medium text-ink-soft">
          <th className="py-3 pr-4 font-normal">Desde</th>
          <th className="py-3 pr-4 text-right font-normal">Cuota</th>
          <th className="py-3 pr-4 text-right font-normal">Mora</th>
          <th className="py-3 pr-4 font-normal">Vence</th>
          <th className="py-3 pr-4 font-normal">Definido por</th>
          <th className="py-3 font-normal">Observaciones</th>
        </tr>
      </thead>
      <tbody>
        {configuraciones.map((c) => (
          <tr key={c.id} className="border-b border-line last:border-b-0">
            <td className="py-3 pr-4 whitespace-nowrap">
              {fecha(c.creado_en)}
              {!!c.es_actual && (
                <span className="ml-2">
                  <Marca tono="ok">Vigente</Marca>
                </span>
              )}
            </td>
            <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">{moneda(c.valor_cuota)}</td>
            <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">{moneda(c.valor_mora)}</td>
            <td className="py-3 pr-4 whitespace-nowrap">Día {c.dia_vencimiento}</td>
            <td className="py-3 pr-4 text-ink-soft">{c.definido_por ?? '—'}</td>
            <td className="py-3">{c.observaciones ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function Parametros() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [editando, setEditando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const arriba = useRef(null)

  useEffect(() => {
    let vivo = true
    Promise.all([obtenerParametros(), listarHistoricoParametros()])
      .then(([vigente, historico]) => vivo && setDatos({ vigente, historico }))
      .catch((err) => vivo && setError(err.message))
    return () => {
      vivo = false
    }
  }, [intento])

  function guardados() {
    setEditando(false)
    setAviso('Los nuevos valores ya rigen para las próximas cuotas que se generen. Las ya generadas no cambian.')
    setIntento((n) => n + 1)
    arriba.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
        <Aviso>{error}</Aviso>
        <Boton
          onClick={() => {
            setError(null)
            setIntento((n) => n + 1)
          }}
        >
          Reintentar
        </Boton>
      </div>
    )
  }

  if (!datos) {
    return (
      <Cargando>Cargando parámetros…</Cargando>
    )
  }

  const { vigente, historico } = datos

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div ref={arriba} className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Parámetros de cobranza</h1>
          <p className="mt-1 text-[16px] text-ink-soft">Los valores con los que se generan las cuotas.</p>
        </div>
        {!editando && (
          <Boton
            icono={vigente ? undefined : 'mas'}
            className="shrink-0"
            onClick={() => {
              setAviso(null)
              setEditando(true)
            }}
          >
            {vigente ? 'Cambiar valores' : 'Cargar parámetros'}
          </Boton>
        )}
      </div>

      {aviso && (
        <div className="mb-6">
          <Aviso tono="ok">{aviso}</Aviso>
        </div>
      )}

      <div className="space-y-6">
        {editando && (
          <FormularioParametros vigente={vigente} onCancelar={() => setEditando(false)} onGuardado={guardados} />
        )}

        <Seccion titulo="Vigentes">
          {vigente ? (
            <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
              <Dato etiqueta="Valor de la cuota">
                <span className="font-mono">{moneda(vigente.valor_cuota)}</span>
              </Dato>
              <Dato etiqueta="Interés por mora">
                <span className="font-mono">{moneda(vigente.valor_mora)}</span>
              </Dato>
              <Dato etiqueta="Vencimiento">Día {vigente.dia_vencimiento} de cada mes</Dato>
              <Dato etiqueta="Rigen desde">{fecha(vigente.creado_en)}</Dato>
              <Dato etiqueta="Definidos por">{vigente.definido_por}</Dato>
              <Dato etiqueta="Observaciones">{vigente.observaciones}</Dato>
            </dl>
          ) : (
            <p className="text-[16px] text-ink-soft">
              Todavía no se cargaron parámetros. Hasta que se carguen no se pueden generar cuotas.
            </p>
          )}
        </Seccion>

        {historico.length > 0 && (
          <Seccion titulo="Histórico">
            <Historico configuraciones={historico} />
          </Seccion>
        )}
      </div>
    </div>
  )
}
