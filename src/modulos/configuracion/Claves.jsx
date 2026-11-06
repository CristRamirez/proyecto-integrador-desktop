import { useEffect, useRef, useState } from 'react'
import { cambiarEstadoClave, eliminarClave, listarClaves } from '../../api/claves'
import { Aviso, Boton, Estado, Vacio, claseCabecera } from '../../components/ui'
import { fechaHoraDesdeUtc } from '../internos/formato'
import { CLAVE_DESACTUALIZADA } from './clave'
import FormularioClave from './FormularioClave'

function ultimoCambio(clave) {
  if (clave.modificado_en) return `${clave.modificada_por ?? 'Sin usuario'} · ${fechaHoraDesdeUtc(clave.modificado_en)}`
  return `${clave.cargada_por ?? 'Sin usuario'} · ${fechaHoraDesdeUtc(clave.creado_en)}`
}

function ConfirmarEliminar({ clave, onCancelar, onEliminada, onDesactualizado }) {
  const [error, setError] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  async function eliminar() {
    if (eliminando) return
    setEliminando(true)
    try {
      await eliminarClave(clave.id)
      onEliminada(clave)
    } catch (err) {
      if (CLAVE_DESACTUALIZADA.includes(err.codigo)) {
        onDesactualizado(err.message)
        return
      }
      setError(err.message)
      setEliminando(false)
    }
  }

  return (
    <section className="rounded-sm border border-danger/30 bg-surface px-7 py-6">
      <h2 className="mb-3 font-serif text-[20px] font-semibold text-ink">Eliminar la clave de {clave.servicio}</h2>
      <p className="text-[16px] text-ink">
        La integración deja de funcionar y la clave no se puede recuperar. Si solo querés pausarla, desactivala.
      </p>
      {error && (
        <div className="mt-4">
          <Aviso>{error}</Aviso>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3 border-t border-line pt-6">
        <Boton variante="secundario" onClick={onCancelar} disabled={eliminando}>
          Cancelar
        </Boton>
        <Boton variante="peligroLleno" icono="cruz" onClick={eliminar} disabled={eliminando}>
          {eliminando ? 'Eliminando…' : 'Eliminar clave'}
        </Boton>
      </div>
    </section>
  )
}

function FilaClave({ clave, seleccionada, cambiando, onEditar, onCambiarEstado, onEliminar }) {
  return (
    <tr className={`border-b border-line-soft last:border-b-0 ${seleccionada ? 'bg-accent-soft/60' : ''}`}>
      <td className="px-4 py-3 align-top">
        <p className="font-mono font-semibold">{clave.servicio}</p>
        {clave.descripcion && <p className="mt-0.5 text-[14px] text-ink-soft">{clave.descripcion}</p>}
      </td>
      <td className="px-4 py-3 align-top font-mono whitespace-nowrap text-ink-soft">•••• {clave.termina_en}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <Estado tono={clave.activo ? 'ok' : 'neutro'}>{clave.activo ? 'Activa' : 'Inactiva'}</Estado>
      </td>
      <td className="px-4 py-3 align-top text-[14px] text-ink-soft">{ultimoCambio(clave)}</td>
      <td className="px-4 py-3 text-right align-top">
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" chico onClick={() => onEditar(clave)}>
            Editar
          </Boton>
          <Boton variante="sutil" chico onClick={() => onCambiarEstado(clave)} disabled={cambiando}>
            {clave.activo ? 'Desactivar' : 'Activar'}
          </Boton>
          <Boton variante="sutil" chico onClick={() => onEliminar(clave)}>
            Eliminar
          </Boton>
        </div>
      </td>
    </tr>
  )
}

export default function Claves() {
  const [claves, setClaves] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [panel, setPanel] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [cambiando, setCambiando] = useState(null)
  const refPanel = useRef(null)

  useEffect(() => {
    let vivo = true
    listarClaves()
      .then((lista) => {
        if (!vivo) return
        setClaves(lista)
        setError(null)
      })
      .catch((err) => vivo && setError(err.message))
    return () => {
      vivo = false
    }
  }, [intento])

  useEffect(() => {
    if (panel) refPanel.current?.scrollIntoView({ block: 'nearest' })
  }, [panel])

  function abrir(tipo, clave = null) {
    setAviso(null)
    setPanel({ tipo, clave })
  }

  function cerrarYRecargar(mensaje) {
    setPanel(null)
    setAviso(mensaje)
    setIntento((n) => n + 1)
  }

  function claveGuardada(clave) {
    cerrarYRecargar(
      panel.clave ? `Se guardaron los cambios de ${clave.servicio}.` : `Se guardó la clave de ${clave.servicio}, que termina en ${clave.termina_en}.`,
    )
  }

  async function cambiarEstado(clave) {
    if (cambiando) return
    setAviso(null)
    setCambiando(clave.id)
    try {
      const actualizada = await cambiarEstadoClave(clave.id, !clave.activo)
      cerrarYRecargar(`La clave de ${actualizada.servicio} quedó ${actualizada.activo ? 'activa' : 'inactiva'}.`)
    } catch (err) {
      if (CLAVE_DESACTUALIZADA.includes(err.codigo)) cerrarYRecargar(`${err.message}. Se actualizó la lista.`)
      else setError(err.message)
    }
    setCambiando(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold text-ink">Claves de integración</h1>
          <p className="mt-1 text-[16px] text-ink-soft">
            Claves y tokens para conectar el sistema con otros servicios. Solo se muestran sus últimos 4 caracteres.
          </p>
        </div>
        {!panel && (
          <Boton icono="mas" className="shrink-0" onClick={() => abrir('nueva')}>
            Nueva clave
          </Boton>
        )}
      </div>

      {aviso && (
        <div className="mb-6">
          <Aviso tono="ok">{aviso}</Aviso>
        </div>
      )}

      {panel && (
        <div ref={refPanel} className="mb-6 scroll-mt-6">
          {panel.tipo === 'eliminar' ? (
            <ConfirmarEliminar
              key={`eliminar-${panel.clave.id}`}
              clave={panel.clave}
              onCancelar={() => setPanel(null)}
              onEliminada={(c) => cerrarYRecargar(`Se eliminó la clave de ${c.servicio}.`)}
              onDesactualizado={(mensaje) => cerrarYRecargar(`${mensaje}. Se actualizó la lista.`)}
            />
          ) : (
            <FormularioClave
              key={panel.clave ? `editar-${panel.clave.id}` : 'nueva'}
              clave={panel.clave}
              onCancelar={() => setPanel(null)}
              onGuardado={claveGuardada}
              onDesactualizado={(mensaje) => cerrarYRecargar(`${mensaje}. Se actualizó la lista.`)}
            />
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <Aviso>{error}</Aviso>
          </div>
          <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </Boton>
        </div>
      )}

      <div className="overflow-x-auto rounded-sm border border-line bg-surface">
        {!claves?.length ? (
          <Vacio cargando={!claves && !error} onReintentar={() => setIntento((n) => n + 1)}>
            {!claves
              ? error
                ? 'No se pudieron cargar las claves.'
                : 'Buscando las claves…'
              : 'Todavía no hay claves cargadas.'}
          </Vacio>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className={`${claseCabecera} whitespace-nowrap`}>
                <th className="px-4 py-3 font-normal">Servicio</th>
                <th className="px-4 py-3 font-normal">Clave</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Último cambio</th>
                <th className="px-4 py-3 font-normal">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {claves.map((c) => (
                <FilaClave
                  key={c.id}
                  clave={c}
                  seleccionada={panel?.clave?.id === c.id}
                  cambiando={cambiando === c.id}
                  onEditar={(clave) => abrir('editar', clave)}
                  onCambiarEstado={cambiarEstado}
                  onEliminar={(clave) => abrir('eliminar', clave)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
