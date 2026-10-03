import { useEffect, useState } from 'react'
import { buscarInternos } from '../../api/internos'
import { Aviso, Boton, Campo, Marca, claseInput } from '../../components/ui'
import { fecha } from './formato'

const ESPERA_BUSQUEDA = 300

export default function Padron({ onNuevo, onAbrir }) {
  const [texto, setTexto] = useState('')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('activo')
  const [judicializado, setJudicializado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(texto)
      setPagina(1)
    }, ESPERA_BUSQUEDA)
    return () => clearTimeout(t)
  }, [texto])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    buscarInternos({ q, estado, judicializado, pagina })
      .then((r) => {
        if (!vivo) return
        setResultado(r)
        setError(null)
      })
      .catch((err) => vivo && setError(err.message))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [q, estado, judicializado, pagina])

  function filtrar(setter) {
    return (e) => {
      setter(e.target.value)
      setPagina(1)
    }
  }

  const internos = resultado?.internos ?? []
  const paginacion = resultado?.paginacion

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Padrón de internos</h1>
        <Boton icono="persona" onClick={onNuevo}>
          Nuevo interno
        </Boton>
      </div>

      <div className="mt-8 grid grid-cols-[1fr_200px_200px] gap-4">
        <Campo etiqueta="Buscar">
          <input
            type="search"
            className={claseInput}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="DNI, apellido, nombre o legajo"
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Estado">
          <select className={claseInput} value={estado} onChange={filtrar(setEstado)}>
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="egresado">Egresados</option>
          </select>
        </Campo>
        <Campo etiqueta="Situación judicial">
          <select className={claseInput} value={judicializado} onChange={filtrar(setJudicializado)}>
            <option value="">Todos</option>
            <option value="1">Judicializados</option>
            <option value="0">No judicializados</option>
          </select>
        </Campo>
      </div>

      {error && (
        <div className="mt-6">
          <Aviso>{error}</Aviso>
        </div>
      )}

      <div className={`mt-6 border border-line bg-surface rounded-sm ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
        {internos.length === 0 ? (
          <p className="px-6 py-10 text-center text-[16px] text-ink-soft">
            {cargando ? 'Buscando…' : error ? 'No se pudo cargar el padrón.' : 'No hay internos que coincidan con la búsqueda.'}
          </p>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className="border-b border-line font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
                <th className="px-5 py-3 font-normal">Apellido y nombre</th>
                <th className="px-5 py-3 font-normal">DNI</th>
                <th className="px-5 py-3 font-normal">Legajo</th>
                <th className="px-5 py-3 font-normal">Ingreso</th>
                <th className="px-5 py-3 font-normal">Estado</th>
                <th className="px-5 py-3 font-normal">Señales</th>
              </tr>
            </thead>
            <tbody>
              {internos.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => onAbrir(i.id)}
                  className="cursor-pointer border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-accent-soft"
                >
                  <td className="px-5 py-4 font-semibold">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAbrir(i.id)
                      }}
                      className="cursor-pointer text-left underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {i.apellido}, {i.nombre}
                    </button>
                  </td>
                  <td className="px-5 py-4 font-mono">{i.dni}</td>
                  <td className="px-5 py-4 font-mono text-[14px]">{i.legajo ?? '—'}</td>
                  <td className="px-5 py-4">{fecha(i.fecha_ingreso)}</td>
                  <td className="px-5 py-4 capitalize">{i.estado}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {i.tiene_deuda && <Marca>Deuda</Marca>}
                      {!!i.judicializado && <Marca>Judicial</Marca>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {paginacion && paginacion.total > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4 text-[15px] text-ink-soft">
          <p>
            {paginacion.total} {paginacion.total === 1 ? 'interno' : 'internos'} · página {paginacion.pagina} de{' '}
            {paginacion.total_paginas}
          </p>
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => setPagina((p) => p - 1)} disabled={cargando || paginacion.pagina <= 1}>
              Anterior
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => setPagina((p) => p + 1)}
              disabled={cargando || paginacion.pagina >= paginacion.total_paginas}
            >
              Siguiente
            </Boton>
          </div>
        </div>
      )}
    </div>
  )
}
