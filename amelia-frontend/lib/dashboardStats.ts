import type { Mantenimiento } from "@/lib/api";

export function parseCreated(m: Mantenimiento): Date | null {
  if (!m.creado_en) return null;
  const t = Date.parse(m.creado_en.replace(" ", "T"));
  return Number.isNaN(t) ? null : new Date(t);
}

export function startOfThisMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function formatDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Últimos `days` días con conteo de mantenimientos por día (para gráfica). */
export function fallasPorDia(items: Mantenimiento[], days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const labels: string[] = [];
  const counts: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDayKey(d);
    labels.push(
      d.toLocaleDateString("es", { weekday: "short", day: "numeric" })
    );
    const n = items.filter((m) => {
      const c = parseCreated(m);
      return c && formatDayKey(c) === key;
    }).length;
    counts.push(n);
  }
  return labels.map((name, i) => ({ name, fallas: counts[i] }));
}

/** Agregación por semana (lunes) últimas `weeks` semanas. */
export function tendenciaSemanal(items: Mantenimiento[], weeks = 6) {
  function mondayOf(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
  }

  const buckets: { key: string; label: string; count: number }[] = [];
  const anchor = mondayOf(new Date());
  for (let w = weeks - 1; w >= 0; w--) {
    const start = new Date(anchor);
    start.setDate(start.getDate() - w * 7);
    const key = formatDayKey(start);
    buckets.push({
      key,
      label: `Sem ${start.toLocaleDateString("es", { day: "numeric", month: "short" })}`,
      count: 0,
    });
  }

  for (const m of items) {
    const c = parseCreated(m);
    if (!c) continue;
    const wk = mondayOf(c);
    const k = formatDayKey(wk);
    const b = buckets.find((x) => x.key === k);
    if (b) b.count += 1;
  }

  return buckets.map((b) => ({ name: b.label, registros: b.count }));
}

export function equipoMasProblematico(items: Mantenimiento[]): {
  nombre: string;
  count: number;
} | null {
  const map = new Map<string, number>();
  for (const m of items) {
    const label =
      (m.equipo_nombre || m.equipo || "").trim() || "Sin etiquetar";
    map.set(label, (map.get(label) || 0) + 1);
  }
  let best: { nombre: string; count: number } | null = null;
  for (const [nombre, count] of map) {
    if (!best || count > best.count) best = { nombre, count };
  }
  return best;
}
