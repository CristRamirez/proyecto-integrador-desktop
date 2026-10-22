import { Marca, Seccion } from '../../components/ui'

export default function Usuarios() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Usuarios</h1>
        <p className="mt-1 text-[16px] text-ink-soft">
          Las cuentas de acceso al sistema, con su rol y los módulos que habilita.
        </p>
      </div>

      <Seccion titulo="Usuarios del sistema">
        <Marca>En progreso</Marca>
        <p className="mt-4 text-[16px] text-ink-soft">
          El alta, la modificación y la baja de usuarios todavía no están disponibles.
        </p>
      </Seccion>
    </div>
  )
}
