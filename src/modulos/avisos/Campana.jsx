import { useCallback, useEffect, useRef, useState } from 'react'
import { Icono, Marca } from '../../components/ui'
import { buscarAvisos, guardarVistos, leerVistos } from './avisos'

const CADA_CINCO_MINUTOS = 5 * 60 * 1000
const PUNTOS = { peligro: 'bg-danger', aviso: 'bg-warn', neutro: 'bg-accent' }

// Los avisos se vuelven a pedir al abrir la campana y cada cinco minutos. Se dan
// por vistos al cerrarla: mientras está abierta, los nuevos siguen marcados.
export default function Campana({ modulos, usuario, onIr }) {
  const [avisos, setAvisos] = useState(null)
  const [vistos, setVistos] = useState(() => leerVistos(usuario.id))
  const [abierta, setAbierta] = useState(false)
  const [intento, setIntento] = useState(0)
  const raiz = useRef(null)
  const claveModulos = modulos.join(',')
  const rol = usuario.rol

  useEffect(() => {
    let vivo = true
    const consultar = () =>
      buscarAvisos({ modulos: claveModulos ? claveModulos.split(',') : [], rol }).then((lista) => vivo && setAvisos(lista))
    consultar()
    const reloj = setInterval(consultar, CADA_CINCO_MINUTOS)
    return () => {
      vivo = false
      clearInterval(reloj)
    }
  }, [claveModulos, rol, intento])

  const cerrar = useCallback(() => {
    const firmas = (avisos ?? []).map((a) => a.firma)
    setVistos(new Set(firmas))
    guardarVistos(usuario.id, firmas)
    setAbierta(false)
  }, [avisos, usuario.id])

  useEffect(() => {
    if (!abierta) return
    const afuera = (e) => !raiz.current?.contains(e.target) && cerrar()
    const escape = (e) => e.key === 'Escape' && cerrar()
    document.addEventListener('mousedown', afuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', afuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierta, cerrar])

  function abrir() {
    setAbierta(true)
    setIntento((n) => n + 1)
  }

  function elegir(aviso) {
    cerrar()
    onIr(...aviso.destino)
  }

  const nuevos = (avisos ?? []).filter((a) => !vistos.has(a.firma)).length
  let etiqueta = 'Avisos'
  if (nuevos) etiqueta = `Avisos, ${nuevos} ${nuevos === 1 ? 'nuevo' : 'nuevos'}`

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={abierta ? cerrar : abrir}
        aria-expanded={abierta}
        aria-haspopup="dialog"
        aria-label={etiqueta}
        title="Avisos"
        className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 hover:bg-accent-soft hover:text-ink ${
          abierta ? 'bg-accent-soft text-ink' : 'text-ink-soft'
        }`}
      >
        <Icono nombre="campana" className="h-5 w-5" />
        {!abierta && nuevos > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 font-mono text-[11px] font-semibold text-white"
          >
            {nuevos}
          </span>
        )}
      </button>

      {abierta && (
        <div
          role="dialog"
          aria-label="Avisos"
          className="absolute top-11 right-0 z-30 w-[400px] rounded-sm border border-line bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-serif text-[17px] font-semibold text-ink">Avisos</p>
            <button
              type="button"
              onClick={() => setIntento((n) => n + 1)}
              className="cursor-pointer text-[13px] text-ink-soft transition-colors duration-150 hover:text-ink"
            >
              Actualizar
            </button>
          </div>

          {!avisos ? (
            <p className="px-4 py-6 text-center text-[15px] text-ink-soft" aria-busy="true">
              Buscando avisos…
            </p>
          ) : avisos.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-4 py-6 text-[15px] text-ink-soft">
              <Icono nombre="check" className="h-[18px] w-[18px]" />
              No hay avisos: todo al día.
            </p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto py-1">
              {avisos.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => elegir(a)}
                    className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent-soft/60"
                  >
                    <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${PUNTOS[a.tono]}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold text-ink">{a.titulo}</span>
                        {!vistos.has(a.firma) && <Marca tono="peligro">Nuevo</Marca>}
                      </span>
                      <span className="mt-0.5 block text-[14px] text-ink-soft">{a.detalle}</span>
                    </span>
                    <Icono nombre="derecha" className="mt-1 h-4 w-4 shrink-0 text-ink-soft" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
