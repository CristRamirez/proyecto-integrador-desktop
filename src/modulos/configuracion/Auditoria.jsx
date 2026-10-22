import { Marca, Seccion } from '../../components/ui'

export default function Auditoria() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Auditoría</h1>
        <p className="mt-1 text-[16px] text-ink-soft">
          Registro de cada alta, modificación y baja, con el usuario, la fecha y la hora.
        </p>
      </div>

      <Seccion titulo="Registro de auditoría">
        <Marca>En progreso</Marca>
        <p className="mt-4 text-[16px] text-ink-soft">
          La consulta del registro todavía no está disponible. Va a permitir filtrar por usuario, acción y fecha.
        </p>
      </Seccion>
    </div>
  )
}
