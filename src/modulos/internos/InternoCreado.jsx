import { Boton, Dato, Icono } from '../../components/ui'
import { fecha } from './formato'

export default function InternoCreado({ interno, onOtro, onVolver, onVerFicha }) {
  const legajo = interno.legajos?.[0]?.numero

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div role="status" className="flex items-start gap-4 border border-line-strong bg-surface px-7 py-6 rounded-sm">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rail text-white">
          <Icono nombre="check" />
        </span>
        <div>
          <h1 className="font-serif text-[24px] font-semibold text-ink">Interno registrado</h1>
          <p className="mt-1 text-[16px] text-ink-soft">
            {interno.apellido}, {interno.nombre} quedó activo en el padrón.
          </p>
        </div>
      </div>

      <div className="mt-6 border border-line bg-surface px-7 py-6 rounded-sm">
        <p className="font-mono text-[12px] tracking-[0.14em] text-ink-soft uppercase">Legajo asignado</p>
        <p className="mt-1 font-mono text-[28px] font-medium text-ink select-text">{legajo}</p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
          <Dato etiqueta="DNI">{interno.dni}</Dato>
          <Dato etiqueta="Fecha de ingreso">{fecha(interno.fecha_ingreso)}</Dato>
          <Dato etiqueta="Obra social">{interno.obra_social}</Dato>
          <Dato etiqueta="Judicializado">{interno.judicializado ? 'Sí' : 'No'}</Dato>
          <Dato etiqueta="Contactos familiares">{interno.contactos?.length}</Dato>
          <Dato etiqueta="Estado">{interno.estado}</Dato>
        </dl>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Boton variante="secundario" icono="volver" onClick={onVolver}>
          Volver al padrón
        </Boton>
        <Boton variante="secundario" icono="persona" onClick={onVerFicha}>
          Ver ficha
        </Boton>
        <Boton icono="mas" onClick={onOtro}>
          Cargar otro interno
        </Boton>
      </div>
    </div>
  )
}
