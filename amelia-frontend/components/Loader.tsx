"use client";

import { motion } from "framer-motion";

type LoaderProps = {
  label?: string;
  sublabel?: string;
};

export default function Loader({ label = "Analizando…", sublabel }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="relative h-16 w-16">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-teal-200 dark:border-teal-800"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-1 rounded-full border-2 border-transparent border-t-brand-teal border-r-brand-cyan"
          animate={{ rotate: -360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-gradient-to-r from-brand-navy to-brand-teal"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-brand-navy dark:text-slate-100">{label}</p>
        {sublabel && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{sublabel}</p>}
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-gradient-to-r from-brand-navy to-brand-teal"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.12,
            }}
          />
        ))}
      </div>
    </div>
  );
}
