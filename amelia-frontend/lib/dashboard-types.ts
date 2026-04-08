/**
 * Tipos de vista para el dashboard operativo (alineados al diseño HTML).
 * Los equipos en API usan `Equipo` en `lib/api.ts`; aquí proyectamos filas de tabla.
 */

export type EquipoEstadoVista = "operativo" | "fallo" | "mantenimiento";

export type EquipoFilaDashboard = {
  id: number;
  nombre: string;
  /** Línea secundaria: ubicación, sede o cliente */
  ubicacionLinea: string;
  estado: EquipoEstadoVista;
  /** Semáforo junto al nombre */
  punto: "ok" | "fail" | "warn";
};

export type OrdenTrabajoEstadoVista = "urgente" | "en_curso" | "completa";

export type OrdenDeTrabajo = {
  codigo: string;
  descripcion: string;
  meta: string;
  estado: OrdenTrabajoEstadoVista;
};

export type KpiIconoVariante = "teal" | "green" | "amber" | "red";

export type KpiTendencia = {
  texto: string;
  /** "up" verde, "down" rojo (como en el HTML de referencia) */
  variante: "up" | "down";
};

export type TarjetaKpiProps = {
  icono: KpiIconoVariante;
  tendencia: KpiTendencia;
  valor: string;
  etiqueta: string;
  /** 0–100: barra de contexto visual (opcional; no afecta datos de negocio) */
  indicadorPct?: number;
};
