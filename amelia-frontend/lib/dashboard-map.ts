import type { Equipo } from "@/lib/api";
import type { EquipoEstadoVista, EquipoFilaDashboard } from "@/lib/dashboard-types";

function filaDesdeScore(
  id: number,
  nombre: string,
  ubicacionLinea: string,
  score: number | null
): EquipoFilaDashboard {
  let estado: EquipoEstadoVista;
  let punto: EquipoFilaDashboard["punto"];
  if (score == null) {
    estado = "operativo";
    punto = "warn";
  } else if (score >= 80) {
    estado = "operativo";
    punto = "ok";
  } else if (score >= 60) {
    estado = "mantenimiento";
    punto = "warn";
  } else {
    estado = "fallo";
    punto = "fail";
  }
  return { id, nombre, ubicacionLinea, estado, punto };
}

export function equipoToFila(e: Equipo): EquipoFilaDashboard {
  const partes = [e.ubicacion, e.sede].filter(Boolean) as string[];
  const ubicacionLinea = partes.length > 0 ? partes.join(" · ") : e.cliente_nombre || "—";
  const nombre = e.tipo ? `${e.tipo} — ${e.nombre}` : e.nombre;
  return filaDesdeScore(e.id, nombre, ubicacionLinea, e.score ?? null);
}

/** Fila de tabla cuando solo hay id, nombre y score (p. ej. payload dashboard técnico). */
export function filaBasicaTecnico(
  id: number,
  nombre: string,
  score: number | null | undefined,
  ubicacionLinea = "—"
): EquipoFilaDashboard {
  return filaDesdeScore(id, nombre, ubicacionLinea, score ?? null);
}

export function porcentajeOperativos(equipos: Equipo[]): number {
  if (equipos.length === 0) return 100;
  const ok = equipos.filter((x) => (x.score ?? 70) >= 60).length;
  return Math.round((ok / equipos.length) * 100);
}

export function contarEquiposEnFallo(equipos: Equipo[]): number {
  return equipos.filter((x) => x.score != null && x.score < 60).length;
}

/** Prioriza riesgo (score bajo primero) para el panel de estado */
export function ordenarEquiposPorRiesgo(equipos: Equipo[]): Equipo[] {
  return [...equipos].sort((a, b) => {
    const sa = a.score ?? 999;
    const sb = b.score ?? 999;
    return sa - sb;
  });
}
