import { useEffect, useState } from 'react'
import { buscarInternos } from '../../api/internos'
import { Avatar, Aviso, Boton, Buscador, Estado, Filtro, Icono, Marca, Paginado, claseCabecera, claseFila } from '../../components/ui'
import { edad, fecha } from './formato'

const ESPERA_BUSQUEDA = 300
const POR_PAGINA = 20

// También lo usa Cobranzas para elegir el interno: ahí no se dan altas, así que sin
// onNuevo no aparece el botón. acciones va a la derecha del título y children debajo.
export default function Padron({
  titulo = 'Padrón de internos',
  subtitulo = 'Personas registradas en la institución.',
  onNuevo,
  onAbrir,
  acciones,
  children,
}) {
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
    buscarInternos({ q, estado, judicializado, pagina, porPagina: POR_PAGINA })
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
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-[16px] text-ink-soft">{subtitulo}</p>}
        </div>
        {acciones}
        {onNuevo && (
          <Boton icono="mas" onClick={onNuevo}>
            Nuevo interno
          </Boton>
        )}
      </div>

      {children}

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-[1fr_220px_270px]">
        <Buscador
          className="col-span-2 xl:col-span-1"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="DNI, apellido, nombre o legajo"
          autoFocus
        />
        <Filtro etiqueta="Estado" value={estado} onChange={filtrar(setEstado)}>
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="egresado">Egresados</option>
        </Filtro>
        <Filtro etiqueta="Situación judicial" value={judicializado} onChange={filtrar(setJudicializado)}>
          <option value="">Todos</option>
          <option value="1">Judicializados</option>
          <option value="0">No judicializados</option>
        </Filtro>
      </div>

      {error && (
        <div className="mt-6">
          <Aviso>{error}</Aviso>
        </div>
      )}

      <div
        className={`mt-6 overflow-x-auto rounded-sm border border-line bg-surface ${cargando ? 'opacity-60' : ''}`}
        aria-busy={cargando}
      >
        {internos.length === 0 ? (
          <p className="px-6 py-10 text-center text-[16px] text-ink-soft">
            {cargando ? 'Buscando…' : error ? 'No se pudo cargar el padrón.' : 'No hay internos que coincidan con la búsqueda.'}
          </p>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className={claseCabecera}>
                <th className="px-4 py-3 font-normal">Apellido y nombre</th>
                <th className="px-4 py-3 font-normal">DNI</th>
                <th className="px-4 py-3 font-normal">Legajo</th>
                <th className="hidden px-4 py-3 font-normal xl:table-cell">Ingreso</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Señales</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {internos.map((i) => {
                const años = edad(i.fecha_nacimiento)
                return (
                  <tr key={i.id} onClick={() => onAbrir(i.id)} className={`group cursor-pointer ${claseFila}`}>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[180px] items-center gap-3">
                        <Avatar apellido={i.apellido} nombre={i.nombre} />
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onAbrir(i.id)
                            }}
                            className="cursor-pointer text-left font-semibold underline-offset-4 hover:underline focus-visible:underline"
                          >
                            {i.apellido}, {i.nombre}
                          </button>
                          {años !== null && <p className="text-[13px] text-ink-soft">{años} años</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[15px] whitespace-nowrap">{i.dni}</td>
                    <td className="px-4 py-3 font-mono text-[14px] whitespace-nowrap">
                      {i.legajo ?? <span className="font-sans text-ink-faint">Sin asignar</span>}
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap xl:table-cell">{fecha(i.fecha_ingreso)}</td>
                    <td className="px-4 py-3">
                      <Estado tono={i.estado === 'activo' ? 'ok' : 'neutro'}>
                        <span className="capitalize">{i.estado}</span>
                      </Estado>
                    </td>
                    <td className="px-4 py-3">
                      {i.tiene_deuda || i.judicializado ? (
                        <div className="flex flex-wrap gap-2">
                          {i.tiene_deuda && <Marca tono="aviso">Deuda</Marca>}
                          {!!i.judicializado && <Marca tono="peligro">Judicial</Marca>}
                        </div>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-line-strong transition-colors duration-150 group-hover:text-ink">
                      <Icono nombre="derecha" className="h-[18px] w-[18px]" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {paginacion && internos.length > 0 && (
        <Paginado
          paginacion={{ por_pagina: POR_PAGINA, ...paginacion }}
          cantidad={internos.length}
          cargando={cargando}
          onPagina={setPagina}
          unidad={['interno', 'internos']}
        />
      )}
    </div>
  )
}
