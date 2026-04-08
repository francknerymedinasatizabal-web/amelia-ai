import type { EquipoEstadoVista, OrdenTrabajoEstadoVista } from "@/lib/dashboard-types";

const equipoEtiqueta: Record<EquipoEstadoVista, string> = {
  operativo: "Operativo",
  fallo: "En Fallo",
  mantenimiento: "Mantenimiento",
};

const otEtiqueta: Record<OrdenTrabajoEstadoVista, string> = {
  urgente: "Urgente",
  en_curso: "En curso",
  completa: "Completa",
};

type Props =
  | { tipo: "equipo"; estado: EquipoEstadoVista }
  | { tipo: "ot"; estado: OrdenTrabajoEstadoVista };

export default function StatusBadge(props: Props) {
  const estado = props.estado;
  const label =
    props.tipo === "equipo" ? equipoEtiqueta[estado as EquipoEstadoVista] : otEtiqueta[estado as OrdenTrabajoEstadoVista];

  const cls =
    estado === "operativo" || estado === "completa"
      ? "border border-cap-teal/20 bg-cap-teal/10 text-teal-800 dark:text-teal-200"
      : estado === "fallo" || estado === "urgente"
        ? "border border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:text-red-300"
        : "border border-amber-200 bg-amber-500/10 text-amber-800 dark:border-amber-500/30 dark:text-amber-200";

  const dotCls =
    estado === "operativo" || estado === "completa"
      ? "bg-cap-teal"
      : estado === "fallo" || estado === "urgente"
        ? "bg-red-500"
        : "bg-amber-500";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${dotCls}`} aria-hidden />
      {label}
    </span>
  );
}
