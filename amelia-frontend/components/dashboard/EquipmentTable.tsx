"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import type { EquipoFilaDashboard } from "@/lib/dashboard-types";
import StatusBadge from "@/components/dashboard/StatusBadge";

const dotCls: Record<EquipoFilaDashboard["punto"], string> = {
  ok: "bg-cap-teal shadow-[0_0_0_3px_rgba(13,148,136,0.2)]",
  fail: "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]",
  warn: "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]",
};

export default function EquipmentTable({
  titulo = "Estado de Equipos",
  filas,
  maxFilas = 8,
}: {
  titulo?: string;
  filas: EquipoFilaDashboard[];
  maxFilas?: number;
}) {
  const mostrar = filas.slice(0, maxFilas);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/55 p-6 shadow-[0_8px_30px_-14px_rgba(15,39,68,0.2)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-slate-900/50 dark:shadow-[0_8px_30px_-14px_rgba(0,0,0,0.5)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-cap-teal/10 blur-3xl dark:bg-cap-teal/15"
      />
      <div className="relative mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cap-navy/10 text-cap-navy dark:bg-white/10 dark:text-slate-100">
          <Cpu className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <h2 className="text-[15px] font-semibold tracking-tight text-cap-navy dark:text-slate-100">{titulo}</h2>
      </div>
      {mostrar.length === 0 ? (
        <p className="relative py-10 text-center text-sm text-slate-500 dark:text-slate-400">Sin equipos para mostrar.</p>
      ) : (
        <ul className="relative divide-y divide-slate-200/80 dark:divide-white/[0.06]">
          {mostrar.map((f, i) => (
            <motion.li
              key={f.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/equipos/${f.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl py-3 pl-1 pr-2 transition-colors hover:bg-cap-teal/[0.06] dark:hover:bg-white/[0.04]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotCls[f.punto]}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800 transition-colors group-hover:text-cap-navy dark:text-slate-100 dark:group-hover:text-white">
                      {f.nombre}
                    </p>
                    <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{f.ubicacionLinea}</p>
                  </div>
                </div>
                <StatusBadge tipo="equipo" estado={f.estado} />
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
