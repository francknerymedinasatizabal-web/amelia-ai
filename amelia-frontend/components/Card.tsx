"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "rounded-2xl border border-white/20 bg-white/40 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45",
        hover
          ? "transition-all duration-300 hover:border-brand-teal/35 hover:shadow-2xl dark:hover:border-brand-teal-bright/30"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}
