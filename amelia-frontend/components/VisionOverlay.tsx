"use client";

import { motion } from "framer-motion";

/** Demo visual: bounding box + etiquetas heurísticas (sin visión real en cliente). */
const LABEL_POOL = [
  "Zona analizada",
  "Conexión eléctrica",
  "Capacitor",
  "Serpentín / aleta",
  "Drenaje",
  "Placa electrónica",
];

type Props = {
  show: boolean;
  seed: string;
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export default function VisionOverlay({ show, seed }: Props) {
  if (!show) return null;

  const h = hashString(seed || "amelia");
  const top = 18 + (h % 22);
  const left = 12 + (h % 30);
  const w = 42 + (h % 25);
  const hi = 28 + (h % 20);

  const a = LABEL_POOL[h % LABEL_POOL.length];
  const b = LABEL_POOL[(h >> 3) % LABEL_POOL.length];

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="absolute rounded-xl border-2 border-emerald-400/90 shadow-[0_0_24px_rgba(52,211,153,0.35)]"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${w}%`,
          height: `${hi}%`,
        }}
      >
        <span className="absolute -top-7 left-0 rounded-lg bg-emerald-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
          {a}
        </span>
        <motion.span
          className="absolute -bottom-8 right-0 rounded-lg bg-brand-teal/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {b}
        </motion.span>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-teal/5 to-brand-navy/25" />
    </div>
  );
}
