"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ClipboardCopy,
  FileDown,
  FileText,
  Search,
  Shield,
  Timer,
  Wrench,
} from "lucide-react";
import type { ParsedDiagnostico } from "@/lib/diagnosticoParser";
import { PARSER_VERSION } from "@/lib/diagnosticoParser";
import { inferirCriterioTecnico } from "@/lib/criterioTecnico";
import { downloadInformePdf, downloadTextoPlano, type InformePayload } from "@/lib/exportInforme";
import Card from "@/components/Card";

type Props = {
  equipo: string;
  problema: string;
  parsed: ParsedDiagnostico | null;
  raw: string;
  fuente: string;
  ms: number;
  onCopy: () => void;
  copied?: boolean;
  tecnico?: string;
  fecha?: string;
};

function Badge({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: string;
  tone?: "brand" | "amber" | "emerald" | "rose";
}) {
  const tones = {
    brand:
      "border-teal-300/50 bg-teal-50/95 text-brand-navy dark:border-teal-500/40 dark:bg-brand-navy/50 dark:text-teal-100",
    amber:
      "border-amber-300/50 bg-amber-50/95 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-100",
    emerald:
      "border-emerald-300/50 bg-emerald-50/95 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-100",
    rose: "border-rose-300/50 bg-rose-50/95 text-rose-950 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-100",
  };
  return (
    <div
      className={`flex flex-col rounded-xl border px-3 py-2 shadow-sm backdrop-blur ${tones[tone]}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-slate-600 dark:text-slate-300">—</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-2 text-sm leading-relaxed text-slate-900 dark:text-slate-100"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-teal-100 text-xs font-bold text-brand-navy dark:bg-brand-navy/80 dark:text-teal-200">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DiagnosticResult({
  equipo,
  problema,
  parsed,
  raw,
  fuente,
  ms,
  onCopy,
  copied,
  tecnico,
  fecha,
}: Props) {
  const fuenteLabel =
    fuente === "cache" ? "Base de datos local" : fuente === "openai" ? "IA (gpt-4o-mini)" : fuente;

  const criterio = useMemo(
    () => inferirCriterioTecnico(problema, fuente, parsed),
    [problema, fuente, parsed]
  );

  const solucionItems = [
    ...(parsed?.pasos || []).map((p) => `Paso: ${p}`),
    ...(parsed?.herramientas || []).map((h) => `Herramienta: ${h}`),
  ];

  const informePayload: InformePayload = {
    equipo,
    problema,
    diagnostico: raw,
    fuente,
    ms,
    criterio,
    tecnico,
    fecha,
  };

  const toneRiesgo: "rose" | "amber" | "emerald" =
    criterio.riesgo === "Alto" ? "rose" : criterio.riesgo === "Medio" ? "amber" : "emerald";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-brand-navy dark:bg-brand-navy/80 dark:text-teal-100">
            {fuenteLabel}
          </span>
          <span className="rounded-full border border-teal-200/80 bg-white/60 px-3 py-1 text-xs font-medium text-brand-navy backdrop-blur dark:border-teal-700/50 dark:bg-slate-900/60 dark:text-teal-200">
            ⚡ {ms} ms
          </span>
          <span className="rounded-full border border-dashed border-teal-300/60 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-teal-500/40 dark:text-slate-400">
            parser v{PARSER_VERSION}
          </span>
        </div>
        <div className="flex w-full flex-col items-end gap-2 sm:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal dark:text-brand-teal-bright">
            Generar informe técnico
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onCopy}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white/70 px-4 py-2 text-sm font-semibold text-brand-navy shadow-md backdrop-blur transition-all duration-300 hover:scale-105 hover:border-brand-teal hover:shadow-lg dark:border-teal-700/50 dark:bg-slate-900/70 dark:text-teal-100"
            >
              <ClipboardCopy className="h-4 w-4" />
              {copied ? "Copiado" : "Copiar diagnóstico"}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => downloadTextoPlano(informePayload)}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white/70 px-4 py-2 text-sm font-semibold text-brand-navy shadow-md backdrop-blur dark:border-teal-700/50 dark:bg-slate-900/70 dark:text-teal-100"
            >
              <FileText className="h-4 w-4" />
              Texto estructurado
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => downloadInformePdf(informePayload)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Badge label="Nivel de confianza" value={criterio.confianza} tone="brand" />
        <Badge label="Tiempo estimado" value={criterio.tiempoReparacion} tone="amber" />
        <Badge label="Riesgo operativo" value={criterio.riesgo} tone={toneRiesgo} />
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/20 bg-white/30 p-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-navy dark:text-teal-200">
          <Shield className="h-4 w-4" />
          Criterio técnico (heurística de campo)
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 font-mono text-[10px] normal-case text-brand-navy dark:bg-brand-navy/80 dark:text-teal-200">
            <Timer className="h-3 w-3" />
            orientativo — validar con medición
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-brand-navy dark:text-teal-200">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal text-lg text-white shadow-md">
              🔍
            </span>
            <h3 className="font-semibold">Contexto</h3>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-teal dark:text-brand-teal-bright">
            Equipo
          </p>
          <p className="mt-1 text-sm font-medium text-brand-navy dark:text-slate-50">{equipo || "—"}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand-teal dark:text-brand-teal-bright">
            Problema reportado
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-900 dark:text-slate-100">{problema}</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-brand-navy dark:text-teal-200">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/90 text-white shadow-md">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 className="font-semibold">
              {parsed ? "Causas probables" : "Diagnóstico técnico"}
            </h3>
          </div>
          {parsed ? (
            <List items={parsed.causas} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 dark:text-slate-200">
              {raw}
            </pre>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-brand-navy dark:text-teal-200">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-md">
              <Wrench className="h-5 w-5" />
            </span>
            <h3 className="font-semibold">Plan de acción</h3>
          </div>
          {parsed && solucionItems.length > 0 ? (
            <List items={solucionItems} />
          ) : parsed ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">Sin pasos parseados; revisa el texto.</p>
          ) : (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              Formato no segmentado: prioriza el bloque central y, si aplica, copia el informe
              completo al acta de trabajo.
            </p>
          )}
        </Card>
      </div>

      {parsed && (
        <Card className="p-4" hover={false}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-teal dark:text-brand-teal-bright">
            <Search className="h-3.5 w-3.5" />
            Texto técnico completo
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-brand-navy/5 p-3 font-mono text-xs leading-relaxed text-brand-navy dark:bg-teal-950/30 dark:text-slate-100">
            {raw}
          </pre>
        </Card>
      )}
      {!parsed && (
        <Card className="p-4" hover={false}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-teal dark:text-brand-teal-bright">
            <Search className="h-3.5 w-3.5" />
            Copia para acta
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-brand-navy/5 p-3 font-mono text-xs leading-relaxed text-brand-navy dark:bg-teal-950/30 dark:text-slate-100">
            {raw}
          </pre>
        </Card>
      )}
    </motion.div>
  );
}
