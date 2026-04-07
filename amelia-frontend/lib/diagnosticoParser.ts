export type ParsedDiagnostico = {
  causas: string[];
  pasos: string[];
  herramientas: string[];
};

/** Versión del parser (reglas + regex fallback). Futuro: v3 embeddings. */
export const PARSER_VERSION = "2.1.0";

function cleanLine(line: string): string {
  return line
    .replace(/^\d+\.\s*/, "")
    .replace(/^[•·\-–]\s*/, "")
    .trim();
}

/** Parser línea a línea (cache / OpenAI estándar). */
function parseLineMode(text: string): ParsedDiagnostico | null {
  const causas: string[] = [];
  const pasos: string[] = [];
  const herr: string[] = [];
  let mode: "causas" | "pasos" | "herr" | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (/^🔍/u.test(line) || /POSIBLES\s+CAUSAS/i.test(line) || /^🔍\s*CAUSAS/i.test(line)) {
      mode = "causas";
      continue;
    }
    if (
      /^🔧/u.test(line) ||
      /PASOS\s+DE\s+VERIFICACIÓN/i.test(line) ||
      (/^🔧\s*PASOS/u.test(line) && !/CAUSAS/i.test(line))
    ) {
      mode = "pasos";
      continue;
    }
    if (/^🛠️/u.test(line) || /^HERRAMIENTAS/i.test(line)) {
      mode = "herr";
      continue;
    }
    if (!mode) continue;

    const cleaned = cleanLine(line);
    if (!cleaned) continue;

    if (mode === "causas") causas.push(cleaned);
    else if (mode === "pasos") pasos.push(cleaned);
    else herr.push(cleaned);
  }

  if (!causas.length && !pasos.length && !herr.length) return null;

  return {
    causas: causas.length ? causas : ["Ver texto completo abajo."],
    pasos,
    herramientas: herr,
  };
}

/** Fallback: bloques separados por emojis (variaciones de IA). */
function parseEmojiSplit(text: string): ParsedDiagnostico | null {
  const t = text.replace(/\r\n/g, "\n");
  const chunks = t.split(/(?=🔍|🔧|🛠️)/u);
  let causas: string[] = [];
  let pasos: string[] = [];
  let herr: string[] = [];

  for (const ch of chunks) {
    const s = ch.trim();
    if (!s) continue;
    if (s.startsWith("🔍")) {
      causas = s
        .split("\n")
        .slice(1)
        .map(cleanLine)
        .filter(Boolean);
    } else if (s.startsWith("🔧")) {
      pasos = s
        .split("\n")
        .slice(1)
        .map(cleanLine)
        .filter(Boolean);
    } else if (s.startsWith("🛠️")) {
      herr = s
        .split("\n")
        .slice(1)
        .map(cleanLine)
        .filter(Boolean);
    }
  }

  if (!causas.length && !pasos.length && !herr.length) return null;
  return {
    causas: causas.length ? causas : ["Revisar texto íntegro."],
    pasos,
    herramientas: herr,
  };
}

/** Fallback regex tolerante (sin depender de saltos de línea perfectos). */
function parseRegexFallback(text: string): ParsedDiagnostico | null {
  const t = text.replace(/\r\n/g, "\n");

  const toLines = (s: string) =>
    s
      .split("\n")
      .map(cleanLine)
      .filter(Boolean);

  const cMatch = t.match(
    /(?:🔍[^\n]*|POSIBLES\s+CAUSAS[^\n]*)([\s\S]*?)(?=🔧|🛠️|PASOS\s+DE|HERRAMIENTAS|$)/i
  );
  const pMatch = t.match(
    /(?:🔧[^\n]*|PASOS[^\n]*)([\s\S]*?)(?=🛠️|HERRAMIENTAS|$)/i
  );
  const hMatch = t.match(/(?:🛠️[^\n]*|HERRAMIENTAS[^\n]*)([\s\S]*)/i);

  const causas = cMatch ? toLines(cMatch[1].trim()) : [];
  const pasos = pMatch ? toLines(pMatch[1].trim()) : [];
  const herr = hMatch ? toLines(hMatch[1].trim()) : [];

  if (!causas.length && !pasos.length && !herr.length) return null;

  return {
    causas: causas.length ? causas : ["Revisar texto íntegro."],
    pasos,
    herramientas: herr,
  };
}

export function parseDiagnosticoText(text: string): ParsedDiagnostico | null {
  if (!text.trim()) return null;
  return (
    parseLineMode(text) ?? parseEmojiSplit(text) ?? parseRegexFallback(text)
  );
}
