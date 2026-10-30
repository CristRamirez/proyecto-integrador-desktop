import { useEffect, useRef, useState } from 'react'
import { listarRoles, listarUsuarios } from '../../api/usuarios'
import {
  Avatar,
  Aviso,
  Boton,
  Buscador,
  Estado,
  Filtro,
  Icono,
  Marca,
  Paginado,
  Vacio,
  claseCabecera,
  claseFila,
} from '../../components/ui'
import { fecha } from '../internos/formato'
import AccesoUsuario from './AccesoUsuario'
import FormularioUsuario from './FormularioUsuario'
import { etiquetaRol } from './usuario'

const ESPERA_BUSQUEDA = 300
const POR_PAGINA = 20

function EstadoUsuario({ usuario }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Estado tono={usuario.activo ? 'ok' : 'neutro'}>{usuario.activo ? 'Habilitado' : 'Deshabilitado'}</Estado>
      {usuario.bloqueado && <Estado tono="peligro">Bloqueado</Estado>}
    </span>
  )
}

function FilaUsuario({ usuario, esPropio, onAbrir }) {
  return (
    <tr onClick={() => onAbrir(usuario)} className={`group cursor-pointer ${claseFila}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar nombreCompleto={usuario.nombre_completo} />
          <div className="whitespace-nowrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onAbrir(usuario)
              }}
              className="cursor-pointer text-left font-semibold underline-offset-4 hover:underline focus-visible:underline"
            >
              {usuario.nombre_completo}
            </button>
            {esPropio && <span className="ml-2 text-[14px] text-ink-soft">(vos)</span>}
            <p className="font-mono text-[13px] text-ink-soft">{usuario.nombre_usuario}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-ink-soft">{usuario.email ?? '—'}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Marca>{etiquetaRol(usuario.rol)}</Marca>
      </td>
      <td className="px-4 py-3">
        <EstadoUsuario usuario={usuario} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">{fecha(usuario.creado_en)}</td>
      <td className="px-4 py-3 text-line-strong transition-colors duration-150 group-hover:text-ink">
        <Icono nombre="derecha" className="h-[18px] w-[18px]" />
      </td>
    </tr>
  )
}

function Encabezado({ titulo, subtitulo, children }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[28px] font-semibold text-ink">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-[16px] text-ink-soft">{subtitulo}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Usuarios({ usuario: actual }) {
  const [vista, setVista] = useState({ tipo: 'lista' })
  const [filtros, setFiltros] = useState({ q: '', rolId: '', activo: '', pagina: 1 })
  const [texto, setTexto] = useState('')
  const [roles, setRoles] = useState([])
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const [aviso, setAviso] = useState(null)
  const raiz = useRef(null)
  const clave = `${filtros.q}|${filtros.rolId}|${filtros.activo}|${filtros.pagina}|${intento}`

  useEffect(() => {
    raiz.current?.scrollIntoView()
  }, [vista])

  useEffect(() => {
    let vivo = true
    listarRoles()
      .then((lista) => vivo && setRoles(lista))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (texto === filtros.q) return
    const t = setTimeout(() => setFiltros((f) => ({ ...f, q: texto, pagina: 1 })), ESPERA_BUSQUEDA)
    return () => clearTimeout(t)
  }, [texto, filtros.q])

  useEffect(() => {
    let vivo = true
    listarUsuarios({ ...filtros, porPagina: POR_PAGINA })
      .then((datos) => vivo && setRespuesta({ clave, datos }))
      .catch((err) => vivo && setRespuesta({ clave, error: err.message }))
    return () => {
      vivo = false
    }
  }, [clave, filtros])

  function filtrar(campo) {
    return (e) => setFiltros((f) => ({ ...f, [campo]: e.target.value, pagina: 1 }))
  }

  function volverALista(mensaje) {
    setAviso(mensaje ?? null)
    setVista({ tipo: 'lista' })
    setIntento((n) => n + 1)
  }

  if (vista.tipo === 'alta') {
    return (
      <div ref={raiz} className="mx-auto max-w-5xl px-8 py-6">
        <Boton icono="volver" variante="sutil" chico className="mb-3 -ml-3.5" onClick={() => volverALista()}>
          Volver a usuarios
        </Boton>
        <Encabezado titulo="Nuevo usuario" subtitulo="Con el nombre de usuario y la contraseña inicia sesión." />
        <FormularioUsuario
          roles={roles}
          onCancelar={() => volverALista()}
          onGuardado={(u) =>
            volverALista(`Se creó el usuario ${u.nombre_usuario} con el rol ${etiquetaRol(u.rol)}. Ya puede iniciar sesión.`)
          }
        />
      </div>
    )
  }

  if (vista.tipo === 'editar') {
    const { usuario } = vista
    return (
      <div ref={raiz} className="mx-auto max-w-5xl px-8 py-6">
        <Boton icono="volver" variante="sutil" chico className="mb-3 -ml-3.5" onClick={() => volverALista()}>
          Volver a usuarios
        </Boton>
        <Encabezado titulo={usuario.nombre_completo} subtitulo={`${usuario.nombre_usuario} · ${etiquetaRol(usuario.rol)}`} />
        {aviso && (
          <div className="mb-6">
            <Aviso tono="ok">{aviso}</Aviso>
          </div>
        )}
        <div className="space-y-6">
          <FormularioUsuario
            key={usuario.id}
            usuario={usuario}
            roles={roles}
            onCancelar={() => volverALista()}
            onGuardado={(u) => volverALista(`Se guardaron los cambios de ${u.nombre_usuario}.`)}
          />
          <AccesoUsuario
            usuario={usuario}
            esPropio={usuario.id === actual?.id}
            onActualizado={(u, mensaje) => {
              setAviso(mensaje)
              setVista({ tipo: 'editar', usuario: u })
              setIntento((n) => n + 1)
              raiz.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </div>
      </div>
    )
  }

  // Mientras llega la respuesta nueva se sigue mostrando la anterior, atenuada.
  const cargando = respuesta?.clave !== clave
  const datos = respuesta?.datos
  const error = !cargando && respuesta?.error
  const usuarios = datos?.usuarios ?? []

  return (
    <div ref={raiz} className="mx-auto max-w-5xl px-8 py-8">
      <Encabezado titulo="Usuarios" subtitulo="Las cuentas de acceso al sistema, con su rol y los módulos que habilita.">
        <Boton
          icono="mas"
          className="shrink-0"
          onClick={() => {
            setAviso(null)
            setVista({ tipo: 'alta' })
          }}
        >
          Nuevo usuario
        </Boton>
      </Encabezado>

      {aviso && (
        <div className="mb-6">
          <Aviso tono="ok">{aviso}</Aviso>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-[1fr_220px_240px]">
        <Buscador
          className="col-span-2 xl:col-span-1"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Usuario, nombre o email"
          autoFocus
        />
        <Filtro etiqueta="Rol" value={filtros.rolId} onChange={filtrar('rolId')}>
          <option value="">Todos</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {etiquetaRol(r.nombre)}
            </option>
          ))}
        </Filtro>
        <Filtro etiqueta="Estado" value={filtros.activo} onChange={filtrar('activo')}>
          <option value="">Todos</option>
          <option value="1">Habilitados</option>
          <option value="0">Deshabilitados</option>
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

      <div
        className={`mt-6 overflow-x-auto rounded-sm border border-line bg-surface ${cargando ? 'opacity-60' : ''}`}
        aria-busy={cargando}
      >
        {usuarios.length === 0 ? (
          <Vacio cargando={!datos && cargando}>
            {!datos
              ? cargando
                ? 'Buscando usuarios…'
                : 'No se pudieron cargar los usuarios.'
              : 'No hay usuarios que coincidan con la búsqueda.'}
          </Vacio>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className={claseCabecera}>
                <th className="px-4 py-3 font-normal">Usuario</th>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Rol</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Alta</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <FilaUsuario
                  key={u.id}
                  usuario={u}
                  esPropio={u.id === actual?.id}
                  onAbrir={(elegido) => {
                    setAviso(null)
                    setVista({ tipo: 'editar', usuario: elegido })
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {datos?.paginacion && usuarios.length > 0 && (
        <Paginado
          paginacion={datos.paginacion}
          cantidad={usuarios.length}
          cargando={cargando}
          unidad={['usuario', 'usuarios']}
          onPagina={(p) => setFiltros((f) => ({ ...f, pagina: p }))}
        />
      )}
    </div>
  )
}
