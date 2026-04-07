import type { jsPDF } from "jspdf";

/**
 * Dibuja texto con ajuste de línea (splitTextToSize) y salto de página si hace falta.
 * Devuelve la coordenada Y final.
 */
export function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  pageBottom = 280
): number {
  const raw = doc.splitTextToSize(text.trim() || "—", maxWidth);
  const lines = Array.isArray(raw) ? raw : [String(raw)];
  let y = startY;
  for (const line of lines) {
    if (y > pageBottom) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}
