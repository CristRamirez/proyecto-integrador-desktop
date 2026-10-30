import { useEffect, useState } from 'react'
import { listarCuotas } from '../../api/cobranzas'
import { buscarInternos } from '../../api/internos'
import { Avatar, Aviso, Boton, Cargando, Icono, Marca, claseCabecera, claseFila } from '../../components/ui'
import { Indicadores } from '../cobranzas/CuotasDelPeriodo'
import EstadoCuota from '../cobranzas/EstadoCuota'
import { fecha, moneda, periodo, periodoActual } from '../internos/formato'

const FECHA_LARGA = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

const claseTitulo = 'font-serif text-[20px] font-semibold text-ink'

function saludo() {
  const hora = new Date().getHours()
  if (hora < 13) return 'Buen día'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

async function contarInternos(filtros) {
  const { paginacion } = await buscarInternos({ ...filtros, porPagina: 1 })
  return paginacion?.total ?? 0
}

function Cifra({ etiqueta, valor, detalle, punto }) {
  return (
    <div className="rounded-sm border border-line bg-surface px-5 py-4">
      <p className="flex items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">
        <span className={`h-2 w-2 rounded-full ${punto}`} aria-hidden="true" />
        {etiqueta}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-serif text-[28px] font-semibold text-ink">{valor}</p>
        {detalle && <p className="text-[14px] text-ink-soft">{detalle}</p>}
      </div>
    </div>
  )
}

function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

function BloqueInternos() {
  const [datos, setDatos] = useState(null)

  useEffect(() => {
    let vivo = true
    Promise.all([
      contarInternos({ estado: 'activo' }),
      contarInternos({ estado: 'activo', judicializado: '1' }),
      contarInternos({ estado: 'egresado' }),
    ])
      .then(([activos, judicializados, egresados]) => vivo && setDatos({ activos, judicializados, egresados }))
      .catch((err) => vivo && setDatos({ error: err.message }))
    return () => {
      vivo = false
    }
  }, [])

  return (
    <section>
      <h2 className={`mb-3 ${claseTitulo}`}>Internos</h2>
      {!datos ? (
        <Cargando className="py-8">Cargando internos…</Cargando>
      ) : datos.error ? (
        <Aviso>{datos.error}</Aviso>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Cifra etiqueta="Activos" valor={datos.activos} detalle="en el padrón" punto="bg-ok" />
          <Cifra
            etiqueta="Judicializados"
            valor={datos.judicializados}
            detalle={`${porcentaje(datos.judicializados, datos.activos)}% de los activos`}
            punto="bg-danger"
          />
          <Cifra etiqueta="Egresados" valor={datos.egresados} detalle="con historial" punto="bg-accent" />
        </div>
      )}
    </section>
  )
}

function CuotasVencidas({ cuotas, total, sinGenerar, actual, onIr }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className={claseTitulo}>Cuotas vencidas para reclamar</h2>
        {total > 0 && (
          <Boton variante="secundario" chico onClick={() => onIr('cobranzas', { tipo: 'vencidas' })}>
            Ver las {total} en Cobranzas
            <Icono nombre="derecha" className="h-4 w-4" />
          </Boton>
        )}
      </div>
      <div className="overflow-hidden rounded-sm border border-line bg-surface">
        {cuotas.length === 0 ? (
          <p className="px-6 py-8 text-center text-[16px] text-ink-soft">
            {sinGenerar ? `Todavía no se generaron las cuotas de ${periodo(actual)}.` : 'No hay cuotas vencidas este mes.'}
          </p>
        ) : (
          <table className="w-full text-left text-[16px] text-ink">
            <thead>
              <tr className={claseCabecera}>
                <th className="px-4 py-3 font-normal">Interno</th>
                <th className="px-4 py-3 font-normal">Venció</th>
                <th className="px-4 py-3 text-right font-normal">Saldo</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c) => (
                <tr key={c.id} className={claseFila}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar apellido={c.interno.apellido} nombre={c.interno.nombre} />
                      <div>
                        <p className="font-semibold">
                          {c.interno.apellido}, {c.interno.nombre}
                        </p>
                        <p className="font-mono text-[12px] text-ink-soft">{c.interno.legajo ?? 'Sin legajo'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-danger">{fecha(c.fecha_vencimiento)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[15px] whitespace-nowrap">
                    {moneda(c.saldo_pendiente)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoCuota cuota={c} detalle />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Boton
                      variante="secundario"
                      chico
                      onClick={() => onIr('cobranzas', { tipo: 'cuenta', id: c.interno.id, cuota: c.id })}
                    >
                      Registrar pago
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function BloqueCobranzas({ onIr }) {
  const [datos, setDatos] = useState(null)
  const actual = periodoActual()

  useEffect(() => {
    let vivo = true
    const [anio, mes] = periodoActual().split('-').map(Number)
    Promise.all([listarCuotas({ anio, mes, porPagina: 1 }), listarCuotas({ anio, mes, estado: 'vencida', porPagina: 5 })])
      .then(
        ([todas, vencidas]) =>
          vivo &&
          setDatos({
            resumen: todas.resumen,
            vencidas: vencidas.cuotas,
            total: vencidas.paginacion?.total ?? vencidas.cuotas.length,
          })
      )
      .catch((err) => vivo && setDatos(err.codigo === 'RUTA_NO_ENCONTRADA' ? { enProgreso: true } : { error: err.message }))
    return () => {
      vivo = false
    }
  }, [])

  return (
    <>
      <section>
        <h2 className={`mb-3 ${claseTitulo}`}>Cobranzas de {periodo(actual)}</h2>
        {!datos ? (
          <Cargando className="py-8">Cargando cobranzas…</Cargando>
        ) : datos.enProgreso ? (
          <div className="rounded-sm border border-line bg-surface px-7 py-6">
            <Marca>En progreso</Marca>
            <p className="mt-4 text-[16px] text-ink-soft">Los indicadores de cobranza todavía no están disponibles.</p>
          </div>
        ) : datos.error ? (
          <Aviso>{datos.error}</Aviso>
        ) : (
          datos.resumen && <Indicadores resumen={datos.resumen} periodoElegido={actual} />
        )}
      </section>

      {datos?.vencidas && (
        <CuotasVencidas
          cuotas={datos.vencidas}
          total={datos.total}
          sinGenerar={datos.resumen?.cuotas === 0}
          actual={actual}
          onIr={onIr}
        />
      )}
    </>
  )
}

export default function Inicio({ modulos = [], usuario, onIr }) {
  const conInternos = modulos.includes('internos')
  const conCobranzas = modulos.includes('cobranzas')
  const nombre = usuario?.nombre?.split(' ')[0]

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
      <div>
        <h1 className="font-serif text-[28px] font-semibold text-ink">
          {saludo()}
          {nombre ? `, ${nombre}` : ''}
        </h1>
        <p className="mt-1 text-[16px] text-ink-soft first-letter:uppercase">{FECHA_LARGA.format(new Date())}</p>
      </div>

      {conInternos && <BloqueInternos />}
      {conCobranzas && <BloqueCobranzas onIr={onIr} />}
    </div>
  )
}
