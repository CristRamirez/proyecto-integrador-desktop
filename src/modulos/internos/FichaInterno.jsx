import { useEffect, useState } from 'react'
import { obtenerInterno } from '../../api/internos'
import { Aviso, Boton, Dato, Marca, Seccion } from '../../components/ui'
import { edad, fecha, fechaHora } from './formato'

function Contactos({ contactos }) {
  if (!contactos?.length) return <p className="text-[16px] text-ink-soft">No tiene contactos cargados.</p>

  return (
    <table className="w-full text-left text-[16px] text-ink">
      <thead>
        <tr className="border-b border-line font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
          <th className="py-3 pr-5 font-normal">Nombre</th>
          <th className="py-3 pr-5 font-normal">Parentesco</th>
          <th className="py-3 pr-5 font-normal">Teléfono</th>
          <th className="py-3 font-normal">Email</th>
        </tr>
      </thead>
      <tbody>
        {contactos.map((c) => (
          <tr key={c.id} className="border-b border-line last:border-b-0">
            <td className="py-3 pr-5 font-semibold">{c.nombre}</td>
            <td className="py-3 pr-5">{c.parentesco ?? '—'}</td>
            <td className="py-3 pr-5 font-mono select-text">{c.telefono ?? '—'}</td>
            <td className="py-3 select-text">{c.email ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Historial({ historial }) {
  const ordenado = [...(historial ?? [])].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
  if (!ordenado.length) return <p className="text-[16px] text-ink-soft">Sin cambios de estado registrados.</p>

  return (
    <ol className="relative ml-2 border-l-2 border-line-strong">
      {ordenado.map((h) => (
        <li key={h.id} className="relative pb-6 pl-7 last:pb-0">
          <span className="absolute top-1.5 -left-[7px] h-3 w-3 rounded-full border-2 border-surface bg-rail" />
          <p className="font-mono text-[13px] tracking-[0.06em] text-ink-soft">{fechaHora(h.fecha)}</p>
          <p className="mt-1 text-[17px] font-semibold text-ink capitalize">{h.estado}</p>
          <p className="mt-0.5 text-[15px] text-ink">{h.motivo ?? 'Sin motivo indicado'}</p>
          {h.usuario && <p className="mt-0.5 text-[14px] text-ink-soft">Registrado por {h.usuario}</p>}
        </li>
      ))}
    </ol>
  )
}

export default function FichaInterno({ id, onVolver }) {
  const [interno, setInterno] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    obtenerInterno(id)
      .then((i) => vivo && setInterno(i))
      .catch((err) => vivo && setError(err.status === 404 ? 'El interno no existe.' : err.message))
    return () => {
      vivo = false
    }
  }, [id, intento])

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
        <Aviso>{error}</Aviso>
        <div className="flex gap-3">
          <Boton variante="secundario" icono="volver" onClick={onVolver}>
            Volver al padrón
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

  if (!interno) {
    return (
      <p className="py-16 text-center font-mono text-[13px] tracking-[0.18em] text-ink-soft uppercase" aria-busy="true">
        Cargando ficha…
      </p>
    )
  }

  const legajo = interno.legajos?.[0]
  const años = edad(interno.fecha_nacimiento)

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] tracking-[0.1em] text-ink-soft select-text">{legajo?.numero ?? 'Sin legajo'}</p>
          <h1 className="mt-1 font-serif text-[28px] font-semibold text-ink">
            {interno.apellido}, {interno.nombre}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Marca>{interno.estado}</Marca>
            {!!interno.judicializado && <Marca>Judicial</Marca>}
            {interno.tiene_deuda && <Marca>Deuda</Marca>}
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Boton icono="volver" variante="sutil" onClick={onVolver}>
            Volver
          </Boton>
          <Boton variante="secundario" disabled title="Disponible cuando esté el módulo de Cobranzas">
            Cuenta corriente
          </Boton>
        </div>
      </div>

      <div className="space-y-6">
        <Seccion titulo="Datos personales">
          <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
            <Dato etiqueta="DNI">
              <span className="font-mono select-text">{interno.dni}</span>
            </Dato>
            <Dato etiqueta="Fecha de nacimiento">
              {interno.fecha_nacimiento && `${fecha(interno.fecha_nacimiento)}${años !== null ? ` (${años} años)` : ''}`}
            </Dato>
            <Dato etiqueta="Fecha de ingreso">{fecha(interno.fecha_ingreso)}</Dato>
          </dl>
        </Seccion>

        <Seccion titulo="Salud y cobertura">
          <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
            <Dato etiqueta="Obra social">{interno.obra_social ?? 'Sin obra social'}</Dato>
            <Dato etiqueta="Situación judicial">{interno.judicializado ? 'Judicializado' : 'No judicializado'}</Dato>
            <Dato etiqueta="Datos de salud" className="col-span-3">
              {interno.datos_salud && <span className="whitespace-pre-line">{interno.datos_salud}</span>}
            </Dato>
          </dl>
        </Seccion>

        <Seccion titulo="Contactos familiares">
          <Contactos contactos={interno.contactos} />
        </Seccion>

        <Seccion titulo="Historial de estados">
          <Historial historial={interno.historial} />
        </Seccion>
      </div>
    </div>
  )
}
