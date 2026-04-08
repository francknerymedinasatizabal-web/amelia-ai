"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, ClipboardList, TriangleAlert } from "lucide-react";
import type { KpiIconoVariante, TarjetaKpiProps } from "@/lib/dashboard-types";

const iconos: Record<KpiIconoVariante, typeof Activity> = {
  teal: Activity,
  green: CheckCircle2,
  amber: ClipboardList,
  red: TriangleAlert,
};

const fondoIcono: Record<KpiIconoVariante, string> = {
  teal: "bg-cap-teal/15 text-cap-teal shadow-inner shadow-cap-teal/10",
  green: "bg-emerald-500/15 text-emerald-600 shadow-inner shadow-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-500/15 text-amber-600 shadow-inner shadow-amber-500/10 dark:text-amber-400",
  red: "bg-red-500/15 text-red-600 shadow-inner shadow-red-500/10 dark:text-red-400",
};

const barGradient: Record<KpiIconoVariante, string> = {
  teal: "from-cap-teal to-brand-teal-bright",
  green: "from-emerald-500 to-teal-400",
  amber: "from-amber-500 to-orange-400",
  red: "from-red-500 to-rose-400",
};

/** Barras decorativas tipo “spark” (solo estética, alturas en px) */
const sparkPx: Record<KpiIconoVariante, number[]> = {
  teal: [12, 20, 14, 24, 17],
  green: [16, 24, 18, 28, 21],
  amber: [11, 17, 14, 20, 13],
  red: [14, 22, 16, 26, 15],
};

export default function KPICard({ icono, tendencia, valor, etiqueta, indicadorPct }: TarjetaKpiProps) {
  const Icon = iconos[icono];
  const trendCls =
    tendencia.variante === "up"
      ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/25"
      : "bg-red-500/10 text-red-700 ring-1 ring-red-500/15 dark:text-red-300 dark:ring-red-500/20";

  const pct = indicadorPct != null ? Math.max(0, Math.min(100, indicadorPct)) : null;
  const sparks = sparkPx[icono];

  return (
    <motion.div
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 28 } }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/60 bg-white/55 p-5 shadow-[0_8px_30px_-12px_rgba(15,39,68,0.18)] backdrop-blur-xl transition-shadow duration-300 hover:border-cap-teal/25 hover:shadow-[0_12px_40px_-12px_rgba(13,148,136,0.25)] dark:border-white/[0.08] dark:bg-slate-900/45 dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] dark:hover:border-cap-teal/30"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-cap-teal/15 via-transparent to-transparent opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:from-cap-teal/20"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${fondoIcono[icono]}`}
          aria-hidden
        >
          <Icon className="h-5 w-5 stroke-[1.75]" />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ${trendCls}`}>
          {tendencia.texto}
        </span>
      </div>

      <div className="relative">
        <div className="text-[1.75rem] font-semibold tabular-nums tracking-tight text-cap-navy dark:text-slate-50">
          {valor}
        </div>
        <div className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">{etiqueta}</div>
      </div>

      <div className="relative flex items-end justify-between gap-3 pt-1">
        <div className="flex h-8 flex-1 items-end gap-1">
          {sparks.map((px, i) => (
            <motion.span
              key={i}
              initial={{ scaleY: 0.3, opacity: 0.4 }}
              animate={{ scaleY: 1, opacity: 0.85 }}
              transition={{ delay: 0.04 * i + 0.1, type: "spring", stiffness: 380, damping: 24 }}
              className="w-full max-w-[10px] origin-bottom rounded-sm bg-gradient-to-t from-cap-navy/25 to-cap-teal/50 dark:from-slate-600/50 dark:to-cap-teal/45"
              style={{ height: px }}
            />
          ))}
        </div>
      </div>

      {pct != null && (
        <div className="relative">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/90 ring-1 ring-black/[0.04] dark:bg-slate-700/90 dark:ring-white/5">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${barGradient[icono]}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Actividad</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{pct}%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
