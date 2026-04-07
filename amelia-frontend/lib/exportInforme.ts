/** Informe PDF diagnóstico (jsPDF 4.x). */
import { jsPDF } from "jspdf";
import type { CriterioTecnico } from "@/lib/criterioTecnico";

export type InformePayload = {
  equipo: string;
  problema: string;
  diagnostico: string;
  fuente: string;
  ms: number;
  criterio: CriterioTecnico;
  tecnico?: string;
  fecha?: string;
};

export function buildInformeTexto(p: InformePayload): string {
  const lines = [
    "══════════════════════════════════════",
    "  CENTRAL DE AIRES DEL PACÍFICO",
    "  INFORME TÉCNICO — AMELIA (HVAC)",
    "══════════════════════════════════════",
    "",
    `Fecha: ${new Date().toISOString().slice(0, 10)}`,
    p.tecnico ? `Técnico: ${p.tecnico}` : null,
    p.fecha ? `Visita: ${p.fecha}` : null,
    "",
    "— EQUIPO —",
    p.equipo,
    "",
    "— SÍNTOMA —",
    p.problema,
    "",
    "— CRITERIO —",
    `Confianza: ${p.criterio.confianza}`,
    `Tiempo estimado de intervención: ${p.criterio.tiempoReparacion}`,
    `Riesgo operativo: ${p.criterio.riesgo}`,
    "",
    "— FUENTE / LATENCIA —",
    `${p.fuente} · ${p.ms} ms`,
    "",
    "— DIAGNÓSTICO —",
    p.diagnostico,
    "",
    "──────────────────────────────────────",
    "Documento generado por Amelia (Central de Aires del Pacífico) · uso en campo",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export function downloadTextoPlano(payload: InformePayload, filename = "amelia-informe.txt") {
  const blob = new Blob([buildInformeTexto(payload)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadInformePdf(payload: InformePayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const body = buildInformeTexto(payload);
  const split = doc.splitTextToSize(body, 180);
  const lines = Array.isArray(split) ? split : [split];
  let y = 22;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 39, 68);
  doc.text("CENTRAL DE AIRES DEL PACÍFICO", 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(13, 148, 136);
  doc.text("Informe técnico · Amelia", 14, 19);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  for (const line of lines) {
    if (y > 285) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, 14, y);
    y += 4.8;
  }
  doc.save(`amelia-informe-${Date.now()}.pdf`);
}
