import { useEffect, useState } from 'react'
import { listarAuditoria, opcionesDeAuditoria } from '../../api/auditoria'
import { Aviso, Boton, Filtro, FiltroFecha, Paginado, claseCabecera } from '../../components/ui'
import { fechaHoraDesdeUtc, hoy, moneda } from '../internos/formato'

const POR_PAGINA = 50

const ACCIONES = {
  alta: 'Alta',
  modificacion: 'Modificación',
  baja: 'Baja',
  reingreso: 'Reingreso',
  anulacion: 'Anulación',
  generacion: 'Generación de cuotas',
  mora: 'Cálculo de mora',
  login: 'Inicio de sesión',
}

const ENTIDADES = {
  internos: 'Internos',
  pagos: 'Pagos',
  cuotas: 'Cuotas',
  egresos: 'Egresos',
  usuarios: 'Usuarios',
  modulos: 'Módulos',
  roles: 'Roles',
  configuracion_cuotas: 'Parámetros de cobranza',
}

const IMPORTES = ['monto', 'valor_cuota', 'valor_mora', 'valor_base', 'interes_total', 'total', 'saldo_pendiente']

function nombreDe(diccionario, clave) {
  return diccionario[clave] ?? clave.charAt(0).toUpperCase() + clave.slice(1).replaceAll('_', ' ')
}

function campo(clave) {
  return clave.replaceAll('_', ' ')
}

function valorLegible(clave, valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (Array.isArray(valor)) return valor.length > 6 ? `${valor.length} elementos` : valor.join(', ') || '—'
  if (typeof valor === 'object') return JSON.stringify(valor)
  if (typeof valor === 'boolean') return valor ? 'sí' : 'no'
  if (typeof valor === 'number' && IMPORTES.includes(clave)) return moneda(valor)
  return String(valor)
}

function Cambio({ clave, cambio }) {
  if (cambio && typeof cambio === 'object' && 'antes' in cambio) {
    return (
      <>
        {valorLegible(clave, cambio.antes)} → <span className="font-semibold">{valorLegible(clave, cambio.despues)}</span>
      </>
    )
  }
  // Los datos sensibles (salud) llegan sin valores, solo marcados como modificados.
  if (cambio && typeof cambio === 'object' && cambio.modificado) return <span className="italic">se modificó</span>
  return valorLegible(clave, cambio)
}

// En las modificaciones el back manda { cambios: { campo: { antes, despues } } } solo
// con lo que cambió; en el resto, los datos sueltos de la operación.
function Detalle({ detalle }) {
  if (!detalle || typeof detalle !== 'object') return <span className="text-ink-soft">—</span>

  const { cambios, ...resto } = detalle
  const filasCambios = cambios && typeof cambios === 'object' ? Object.entries(cambios) : []
  const filasResto = Object.entries(resto)
  if (!filasCambios.length && !filasResto.length) return <span className="text-ink-soft">—</span>

  return (
    <ul className="space-y-0.5 text-[14px]">
      {filasCambios.map(([clave, cambio]) => (
        <li key={`c-${clave}`}>
          <span className="text-ink-soft">{campo(clave)}:</span> <Cambio clave={clave} cambio={cambio} />
        </li>
      ))}
      {filasResto.map(([clave, valor]) => (
        <li key={`r-${clave}`}>
          <span className="text-ink-soft">{campo(clave)}:</span> {valorLegible(clave, valor)}
        </li>
      ))}
    </ul>
  )
}

function FilaRegistro({ registro }) {
  return (
    <tr className="border-b border-line-soft align-top last:border-b-0">
      <td className="px-4 py-3 font-mono text-[14px] whitespace-nowrap">{fechaHoraDesdeUtc(registro.fecha)}</td>
      <td className="px-4 py-3">
        {registro.usuario_id ? (
          <>
            <p className="font-semibold">{registro.usuario_nombre ?? registro.usuario}</p>
            {registro.usuario_nombre && <p className="font-mono text-[13px] text-ink-soft">{registro.usuario}</p>}
          </>
        ) : (
          <p className="text-ink-soft">Sistema (automático)</p>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">{nombreDe(ACCIONES, registro.accion)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {nombreDe(ENTIDADES, registro.entidad)}
        {registro.entidad_id && <span className="ml-1 font-mono text-[13px] text-ink-soft">#{registro.entidad_id}</span>}
      </td>
      <td className="px-4 py-3">
        <Detalle detalle={registro.detalle} />
      </td>
    </tr>
  )
}

const SIN_FILTROS = { usuarioId: '', accion: '', entidad: '', desde: '', hasta: '', pagina: 1 }

export default function Auditoria() {
  const [filtros, setFiltros] = useState(SIN_FILTROS)
  const [opciones, setOpciones] = useState({ acciones: [], entidades: [], usuarios: [] })
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const clave = `${Object.values(filtros).join('|')}|${intento}`
  const conFiltros = Object.entries(filtros).some(([k, v]) => k !== 'pagina' && v)

  useEffect(() => {
    let vivo = true
    opcionesDeAuditoria()
      .then((o) => vivo && setOpciones(o))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    let vivo = true
    listarAuditoria({ ...filtros, porPagina: POR_PAGINA })
      .then((datos) => vivo && setRespuesta({ clave, datos }))
      .catch((err) => vivo && setRespuesta({ clave, error: err.message }))
    return () => {
      vivo = false
    }
  }, [clave, filtros])

  function filtrar(nombre) {
    return (e) => setFiltros((f) => ({ ...f, [nombre]: e.target.value, pagina: 1 }))
  }

  // Mientras llega la respuesta nueva se sigue mostrando la anterior, atenuada.
  const cargando = respuesta?.clave !== clave
  const datos = respuesta?.datos
  const error = !cargando && respuesta?.error
  const registros = datos?.registros ?? []

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Auditoría</h1>
          <p className="mt-1 text-[16px] text-ink-soft">
            Registro de cada alta, modificación y baja, con el usuario, la fecha y la hora.
          </p>
        </div>
        {conFiltros && (
          <Boton variante="secundario" icono="cruz" className="shrink-0" onClick={() => setFiltros(SIN_FILTROS)}>
            Quitar filtros
          </Boton>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Filtro etiqueta="Usuario" value={filtros.usuarioId} onChange={filtrar('usuarioId')}>
          <option value="">Todos</option>
          {opciones.usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre ? `${u.nombre} (${u.usuario})` : u.usuario}
            </option>
          ))}
        </Filtro>
        <Filtro etiqueta="Acción" value={filtros.accion} onChange={filtrar('accion')}>
          <option value="">Todas</option>
          {opciones.acciones.map((a) => (
            <option key={a} value={a}>
              {nombreDe(ACCIONES, a)}
            </option>
          ))}
        </Filtro>
        <Filtro etiqueta="Sobre" value={filtros.entidad} onChange={filtrar('entidad')}>
          <option value="">Todo</option>
          {opciones.entidades.map((e) => (
            <option key={e} value={e}>
              {nombreDe(ENTIDADES, e)}
            </option>
          ))}
        </Filtro>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <FiltroFecha
          etiqueta="Desde"
          className="w-60"
          value={filtros.desde}
          max={filtros.hasta || hoy()}
          onChange={filtrar('desde')}
        />
        <FiltroFecha
          etiqueta="Hasta"
          className="w-60"
          value={filtros.hasta}
          min={filtros.desde || undefined}
          max={hoy()}
          onChange={filtrar('hasta')}
        />
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

      <div
        className={`mt-6 overflow-x-auto rounded-sm border border-line bg-surface ${cargando ? 'opacity-60' : ''}`}
        aria-busy={cargando}
      >
        {registros.length === 0 ? (
          <p className="px-6 py-10 text-center text-[16px] text-ink-soft">
            {!datos
              ? cargando
                ? 'Buscando registros…'
                : 'No se pudo cargar el registro de auditoría.'
              : conFiltros
                ? 'No hay registros que coincidan con los filtros.'
                : 'Todavía no hay registros.'}
          </p>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className={claseCabecera}>
                <th className="px-4 py-3 font-normal">Fecha y hora</th>
                <th className="px-4 py-3 font-normal">Usuario</th>
                <th className="px-4 py-3 font-normal">Acción</th>
                <th className="px-4 py-3 font-normal">Sobre</th>
                <th className="px-4 py-3 font-normal">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <FilaRegistro key={r.id} registro={r} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {datos?.paginacion && registros.length > 0 && (
        <Paginado
          paginacion={datos.paginacion}
          cantidad={registros.length}
          cargando={cargando}
          unidad={['registro', 'registros']}
          onPagina={(p) => setFiltros((f) => ({ ...f, pagina: p }))}
        />
      )}
    </div>
  )
}
