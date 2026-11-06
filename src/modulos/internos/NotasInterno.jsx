import { useEffect, useState } from 'react'
import { crearNota, eliminarNota, listarNotas, modificarNota } from '../../api/internos'
import { Aviso, Boton, Cargando, Icono, claseInput } from '../../components/ui'
import { fechaHoraDesdeUtc } from './formato'

const MAXIMO_TEXTO = 1000

function validar(texto) {
  const limpio = texto.trim()
  if (!limpio) return 'Escribí el texto de la nota'
  if (limpio.length > MAXIMO_TEXTO) return `Máximo ${MAXIMO_TEXTO} caracteres`
  return null
}

function autoria(nota) {
  const escrita = `${nota.escrita_por ?? 'Sin usuario'} · ${fechaHoraDesdeUtc(nota.creado_en)}`
  if (!nota.modificado_en) return escrita
  return `${escrita} · Modificada por ${nota.modificada_por ?? 'sin usuario'} el ${fechaHoraDesdeUtc(nota.modificado_en)}`
}

// Sirve para escribir una nota nueva y para corregir una existente. La nueva
// se vacía al guardar; la que se corrige la cierra quien la abrió.
function EditorNota({ inicial = '', nueva = false, textoBoton, onGuardar, onCancelar }) {
  const [texto, setTexto] = useState(inicial)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (guardando) return

    const encontrado = validar(texto)
    setError(encontrado)
    if (encontrado) return

    setGuardando(true)
    try {
      await onGuardar(texto.trim())
      if (nueva) setTexto('')
    } catch (err) {
      setError(err.message)
    }
    setGuardando(false)
  }

  return (
    <form onSubmit={enviar} noValidate>
      <textarea
        rows={3}
        maxLength={MAXIMO_TEXTO}
        className={`${claseInput} h-auto py-3`}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          setError(null)
        }}
        placeholder={nueva ? 'Observaciones que no entran en los otros datos de la ficha' : undefined}
        aria-label={nueva ? 'Nueva nota' : 'Texto de la nota'}
        aria-invalid={!!error}
        autoFocus={!nueva}
      />
      <div className="mt-1.5 flex items-start justify-between gap-4">
        {error ? (
          <p className="flex items-start gap-1.5 text-[14px] font-medium text-danger">
            <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : (
          <span />
        )}
        <p className="font-mono text-[12px] text-ink-soft">
          {texto.length}/{MAXIMO_TEXTO}
        </p>
      </div>
      <div className="mt-3 flex justify-end gap-3">
        {onCancelar && (
          <Boton variante="secundario" chico onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
        )}
        <Boton type="submit" chico icono={nueva ? 'mas' : 'check'} disabled={guardando}>
          {guardando ? 'Guardando…' : textoBoton}
        </Boton>
      </div>
    </form>
  )
}

function ConfirmarEliminar({ onCancelar, onEliminar }) {
  const [error, setError] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  async function eliminar() {
    if (eliminando) return
    setEliminando(true)
    try {
      await onEliminar()
    } catch (err) {
      setError(err.message)
      setEliminando(false)
    }
  }

  return (
    <div className="mt-3 rounded-sm border border-danger/30 bg-danger-soft/40 px-4 py-3">
      <p className="text-[15px] text-ink">¿Eliminar esta nota? El texto queda registrado en la auditoría.</p>
      {error && (
        <div className="mt-3">
          <Aviso>{error}</Aviso>
        </div>
      )}
      <div className="mt-3 flex justify-end gap-3">
        <Boton variante="secundario" chico onClick={onCancelar} disabled={eliminando}>
          Cancelar
        </Boton>
        <Boton variante="peligroLleno" chico icono="cruz" onClick={eliminar} disabled={eliminando}>
          {eliminando ? 'Eliminando…' : 'Eliminar'}
        </Boton>
      </div>
    </div>
  )
}

export default function NotasInterno({ internoId }) {
  const [notas, setNotas] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [editando, setEditando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    let vivo = true
    listarNotas(internoId)
      .then((lista) => vivo && setNotas(lista))
      .catch((err) => vivo && setError(err.message))
    return () => {
      vivo = false
    }
  }, [internoId, intento])

  function reintentar() {
    setError(null)
    setNotas(null)
    setIntento((n) => n + 1)
  }

  async function agregar(texto) {
    const nota = await crearNota(internoId, texto)
    setNotas((lista) => [nota, ...lista])
    setAviso('La nota quedó guardada.')
  }

  async function guardarCambios(notaId, texto) {
    const nota = await modificarNota(internoId, notaId, texto)
    setNotas((lista) => lista.map((n) => (n.id === notaId ? nota : n)))
    setEditando(null)
    setAviso('La nota se modificó.')
  }

  async function eliminar(notaId) {
    await eliminarNota(internoId, notaId)
    setNotas((lista) => lista.filter((n) => n.id !== notaId))
    setEliminando(null)
    setAviso('La nota se eliminó.')
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Aviso>{error}</Aviso>
        <Boton variante="secundario" chico onClick={reintentar}>
          Reintentar
        </Boton>
      </div>
    )
  }

  if (!notas) {
    return (
      <Cargando className="py-6" onReintentar={reintentar}>
        Cargando las notas…
      </Cargando>
    )
  }

  return (
    <div className="space-y-6">
      <EditorNota nueva textoBoton="Agregar nota" onGuardar={agregar} />

      {aviso && <Aviso tono="ok">{aviso}</Aviso>}

      {notas.length ? (
        <ul className="border-t border-line">
          {notas.map((n) => (
            <li key={n.id} className="border-b border-line-soft py-4 last:border-b-0 last:pb-0">
              {editando === n.id ? (
                <EditorNota
                  inicial={n.texto}
                  textoBoton="Guardar cambios"
                  onGuardar={(texto) => guardarCambios(n.id, texto)}
                  onCancelar={() => setEditando(null)}
                />
              ) : (
                <>
                  <p className="text-[16px] whitespace-pre-line text-ink select-text">{n.texto}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[14px] text-ink-soft">{autoria(n)}</p>
                    <div className="flex gap-2">
                      <Boton
                        variante="sutil"
                        chico
                        icono="lapiz"
                        onClick={() => {
                          setAviso(null)
                          setEliminando(null)
                          setEditando(n.id)
                        }}
                      >
                        Modificar
                      </Boton>
                      <Boton
                        variante="sutil"
                        chico
                        icono="cruz"
                        onClick={() => {
                          setAviso(null)
                          setEditando(null)
                          setEliminando(n.id)
                        }}
                      >
                        Eliminar
                      </Boton>
                    </div>
                  </div>
                  {eliminando === n.id && (
                    <ConfirmarEliminar onCancelar={() => setEliminando(null)} onEliminar={() => eliminar(n.id)} />
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[16px] text-ink-soft">Todavía no hay notas.</p>
      )}
    </div>
  )
}
