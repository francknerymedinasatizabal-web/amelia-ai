import type { jsPDF } from "jspdf";

/** Data URL lista para guardar en `pdf_url` o descargar. Compatible jsPDF 4.x */
export function pdfToDataUri(doc: jsPDF): string {
  return doc.output("datauristring");
}
