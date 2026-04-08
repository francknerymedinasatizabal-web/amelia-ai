import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Nueva OT — Amelia",
  description: "Abrir un mantenimiento preventivo o correctivo",
};

export default function NuevaOtPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-cap-teal hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-cap-navy dark:text-slate-100">Nueva orden de trabajo</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Elige el tipo de intervención. Los datos se registran en el backend según el flujo elegido.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/preventivo"
          className="flex flex-col gap-3 rounded-2xl border border-cap-teal/25 bg-white/80 p-6 shadow-sm transition hover:border-cap-teal/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60"
        >
          <ClipboardList className="h-8 w-8 text-cap-teal" aria-hidden />
          <span className="font-semibold text-cap-navy dark:text-slate-100">Preventivo</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">Checklist y registro programado</span>
        </Link>
        <Link
          href="/correctivo"
          className="flex flex-col gap-3 rounded-2xl border border-cap-teal/25 bg-white/80 p-6 shadow-sm transition hover:border-cap-teal/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60"
        >
          <Wrench className="h-8 w-8 text-cap-teal" aria-hidden />
          <span className="font-semibold text-cap-navy dark:text-slate-100">Correctivo</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">Diagnóstico y reparación</span>
        </Link>
      </div>
    </div>
  );
}
