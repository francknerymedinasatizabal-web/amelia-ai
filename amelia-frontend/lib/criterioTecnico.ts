import type { ParsedDiagnostico } from "@/lib/diagnosticoParser";

export type NivelConfianza = "Alta" | "Media" | "Baja";
export type NivelRiesgo = "Bajo" | "Medio" | "Alto";

export type CriterioTecnico = {
  confianza: NivelConfianza;
  tiempoReparacion: string;
  riesgo: NivelRiesgo;
};

const P = (s: string) => s.toLowerCase();

/** Heurística determinista: guía profesional sin llamar a IA extra. */
export function inferirCriterioTecnico(
  problema: string,
  fuente: string,
  parsed: ParsedDiagnostico | null
): CriterioTecnico {
  const p = P(problema);

  let confianza: NivelConfianza = "Media";
  if (fuente === "cache") confianza = "Alta";
  if (parsed && parsed.pasos.length >= 3 && fuente === "cache") confianza = "Alta";
  if (!parsed && fuente === "openai") confianza = "Baja";

  let tiempoReparacion = "30–45 min";
  if (
    /el[eé]ctric|enciende|capacitor|tablero|voltaje|disparo|protecci[oó]n/.test(p)
  ) {
    tiempoReparacion = "45–90 min";
  } else if (/gotea|drenaje|agua|condensado/.test(p)) {
    tiempoReparacion = "30–60 min";
  } else if (/no enfr[ií]|gas|presi[oó]n|fuga|recarga|manifold/.test(p)) {
    tiempoReparacion = "60–120 min";
  } else if (/ruido|vibraci[oó]n|rodamiento/.test(p)) {
    tiempoReparacion = "40–70 min";
  }

  let riesgo: NivelRiesgo = "Medio";
  if (
    /chispa|quemad|cable pelado|220|380|descarga|electrocu/.test(p) ||
    /alta tensi[oó]n/.test(p)
  ) {
    riesgo = "Alto";
  } else if (/fuga de gas|refrigerante|isocianato|llama|soldadura/.test(p)) {
    riesgo = "Alto";
  } else if (/gotea|agua|drenaje|condensado|slip|escalera|azotea/.test(p)) {
    riesgo = "Medio";
  } else if (/ruido|filtro|caudal/.test(p)) {
    riesgo = "Bajo";
  } else {
    riesgo = "Medio";
  }

  return { confianza, tiempoReparacion, riesgo };
}
