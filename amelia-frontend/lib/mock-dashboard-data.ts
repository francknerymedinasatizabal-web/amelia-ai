import type { OrdenDeTrabajo } from "@/lib/dashboard-types";

/** Mock de OTs hasta exista endpoint dedicado en el backend. */
export const MOCK_ORDENES_TRABAJO: OrdenDeTrabajo[] = [
  {
    codigo: "OT-0892",
    descripcion: "Revisión de condensador — Bodega Norte",
    meta: "Asignado: Luis G. · Hoy 09:30",
    estado: "urgente",
  },
  {
    codigo: "OT-0891",
    descripcion: "Limpieza filtros — AC Cassette Lobby",
    meta: "Asignado: María P. · Hoy 08:00",
    estado: "en_curso",
  },
  {
    codigo: "OT-0890",
    descripcion: "Carga de gas refrigerante — Gerencia",
    meta: "Asignado: Carlos M. · Ayer 15:00",
    estado: "completa",
  },
  {
    codigo: "OT-0889",
    descripcion: "Inspección preventiva — Torre A VRF",
    meta: "Asignado: Juan R. · Ayer 10:00",
    estado: "completa",
  },
];

export function contarOtsPendientesMock(ots: OrdenDeTrabajo[]): number {
  return ots.filter((o) => o.estado === "urgente" || o.estado === "en_curso").length;
}
