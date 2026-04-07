"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  delay?: number;
  accent?: "brand" | "teal" | "amber";
};

const accents = {
  brand: "from-brand-navy to-brand-teal",
  teal: "from-brand-teal to-brand-cyan",
  amber: "from-amber-500 to-orange-600",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delay = 0,
  accent = "brand",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-white/25 bg-white/35 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/50"
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accents[accent]} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-35`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal/90 dark:text-brand-teal-bright/90">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-brand-navy dark:text-slate-50">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        )}
      </div>
    </motion.div>
  );
}
