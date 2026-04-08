"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, ChevronRight, Plus } from "lucide-react";

export default function DashboardTopbar({
  titulo,
  subtitulo,
  nuevaOtHref = "/ots/nueva",
}: {
  titulo: string;
  subtitulo: string;
  nuevaOtHref?: string;
}) {
  return (
    <header className="relative z-10 flex flex-shrink-0 flex-wrap items-center justify-between gap-4 border-b border-white/50 bg-white/70 px-5 py-4 shadow-[0_1px_0_rgba(15,39,68,0.06)] backdrop-blur-2xl dark:border-white/[0.07] dark:bg-slate-950/75 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)] md:px-8 md:py-4">
      <div className="min-w-0 flex-1">
        <nav className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <span>Operaciones</span>
          <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
          <span className="text-cap-teal dark:text-teal-400/90">Amelia</span>
        </nav>
        <h1 className="text-lg font-semibold tracking-tight text-cap-navy dark:text-slate-50 md:text-xl">{titulo}</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitulo}</p>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cap-navy/10 bg-white/90 text-cap-navy shadow-sm backdrop-blur-sm transition-colors hover:border-cap-teal/30 hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800/90"
          aria-label="Notificaciones"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" aria-hidden />
        </motion.button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href={nuevaOtHref}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cap-navy via-cap-navy to-cap-teal px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(13,148,136,0.55)] ring-1 ring-white/15 transition-shadow hover:shadow-[0_12px_28px_-8px_rgba(13,148,136,0.65)] dark:ring-white/10"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden />
            Nueva OT
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
