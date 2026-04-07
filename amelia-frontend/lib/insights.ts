import type { Mantenimiento } from "@/lib/api";
import { parseCreated } from "@/lib/dashboardStats";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Comparación últimos 7 días vs 7 días anteriores + hotspots por equipo. */
export function buildDashboardInsights(items: Mantenimiento[]): string[] {
  const out: string[] = [];
  const now = startOfDay(new Date());
  const end = new Date(now);
  const startRecent = new Date(now);
  startRecent.setDate(startRecent.getDate() - 7);
  const startPrev = new Date(startRecent);
  startPrev.setDate(startPrev.getDate() - 7);

  let recent = 0;
  let prev = 0;
  const byEquipo7d = new Map<string, number>();

  for (const m of items) {
    const d = parseCreated(m);
    if (!d) continue;
    const day = startOfDay(d);
    if (day >= startRecent && day <= end) {
      recent += 1;
      const eq = (m.equipo_nombre || m.equipo || "").trim() || "Sin etiquetar";
      byEquipo7d.set(eq, (byEquipo7d.get(eq) || 0) + 1);
    } else if (day >= startPrev && day < startRecent) {
      prev += 1;
    }
  }

  for (const [eq, n] of byEquipo7d) {
    if (n >= 3) {
      out.push(`⚠️ **${eq}** presenta **${n}** fallas en los últimos 7 días.`);
    }
  }

  if (prev > 0 && recent > prev) {
    const pct = Math.round(((recent - prev) / prev) * 100);
    out.push(`📈 Incremento del **${pct}%** en fallas vs. la semana anterior (${recent} vs ${prev}).`);
  } else if (prev === 0 && recent >= 2) {
    out.push(`📈 Actividad reciente: **${recent}** registros en 7 días (sin baseline previo).`);
  } else if (recent < prev && prev > 0) {
    const pct = Math.round(((prev - recent) / prev) * 100);
    out.push(`📉 **-${pct}%** de fallas vs. la semana anterior — buena señal operativa.`);
  }

  if (out.length === 0 && items.length > 0) {
    out.push("✅ Sin alertas críticas: la actividad está estable respecto al periodo anterior.");
  }

  return out;
}
