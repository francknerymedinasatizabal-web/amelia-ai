"use client";

import { motion } from "framer-motion";
import { ListTodo } from "lucide-react";
import type { OrdenDeTrabajo } from "@/lib/dashboard-types";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default function WorkOrderList({
  titulo = "Órdenes de Trabajo Recientes",
  ordenes,
}: {
  titulo?: string;
  ordenes: OrdenDeTrabajo[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/55 p-6 shadow-[0_8px_30px_-14px_rgba(15,39,68,0.2)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-slate-900/50 dark:shadow-[0_8px_30px_-14px_rgba(0,0,0,0.5)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-cap-navy/10 blur-3xl dark:bg-cap-navy/25"
      />
      <div className="relative mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cap-teal/15 text-cap-teal dark:bg-cap-teal/20 dark:text-teal-300">
          <ListTodo className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <h2 className="text-[15px] font-semibold tracking-tight text-cap-navy dark:text-slate-100">{titulo}</h2>
      </div>
      {ordenes.length === 0 ? (
        <p className="relative py-10 text-center text-sm text-slate-500 dark:text-slate-400">Sin órdenes de trabajo.</p>
      ) : (
        <ul className="relative divide-y divide-slate-200/80 dark:divide-white/[0.06]">
          {ordenes.map((ot, i) => (
            <motion.li
              key={ot.codigo}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 py-3.5 first:pt-0"
            >
              <span className="mt-0.5 shrink-0 rounded-lg bg-gradient-to-br from-cap-teal/20 to-cap-teal/5 px-2.5 py-1 text-[10px] font-bold tracking-wide text-cap-teal ring-1 ring-cap-teal/20 dark:from-cap-teal/25 dark:to-transparent dark:text-teal-200">
                {ot.codigo}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-slate-800 dark:text-slate-100">{ot.descripcion}</p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{ot.meta}</p>
              </div>
              <div className="ml-auto shrink-0 pt-0.5">
                <StatusBadge tipo="ot" estado={ot.estado} />
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
