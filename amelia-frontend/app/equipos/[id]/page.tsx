"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Download, Wrench } from "lucide-react";
import Card from "@/components/Card";
import Loader from "@/components/Loader";
import {
  getEquipo,
  getEquipoQr,
  listHistorialServicios,
  postEquipoScore,
  type Equipo,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function scoreBadge(score: number | null | undefined) {
  if (score == null) return { text: "—", cls: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100" };
  if (score >= 80) return { text: `Óptimo (${score})`, cls: "bg-emerald-500/90 text-white" };
  if (score >= 60) return { text: `Atención (${score})`, cls: "bg-amber-500 text-white" };
  return { text: `Riesgo (${score})`, cls: "bg-red-600 text-white" };
}

function EquipoFichaInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Number(params.id);
  const user = useAuthStore((s) => s.user);
  const [eq, setEq] = useState<(Equipo & { cliente_nombre?: string | null }) | null>(null);
  const [hist, setHist] = useState<
    Awaited<ReturnType<typeof listHistorialServicios>>["items"] | null
  >(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrBusy, setQrBusy] = useState(false);
  const timerRef = useRef<number | null>(null);
  const started = useRef(false);

  const servicio = searchParams.get("servicio");

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      const [e, h] = await Promise.all([getEquipo(id), listHistorialServicios(id)]);
      setEq(e);
      setHist(h.items);
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setErr("ID inválido");
      setLoading(false);
      return;
    }
    refresh();
  }, [id, refresh]);

  useEffect(() => {
    if (!servicio || started.current) return;
    if (servicio !== "preventivo" && servicio !== "correctivo") return;
    started.current = true;
    timerRef.current = window.setInterval(() => {
      /* cronómetro en segundo plano — UI opcional */
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [servicio]);

  async function onDownloadQr() {
    setQrBusy(true);
    try {
      const { png_base64, url } = await getEquipoQr(id);
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${png_base64}`;
      a.download = `qr-equipo-${id}.png`;
      a.click();
      if (!eq?.qr_code && url) {
        setEq((prev) => (prev ? { ...prev, qr_code: url } : prev));
      }
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setQrBusy(false);
    }
  }

  async function onRecalcScore() {
    if (user?.rol === "cliente") return;
    try {
      const r = await postEquipoScore(id);
      setEq((prev) => (prev ? { ...prev, score: r.score, score_actualizado: r.score_actualizado ?? null } : prev));
    } catch (e) {
      setErr(String((e as Error).message || e));
    }
  }

  if (loading) return <Loader />;
  if (err || !eq) {
    return (
      <Card className="p-6 text-red-700 dark:text-red-300">
        {err || "No encontrado"}
      </Card>
    );
  }

  const badge = scoreBadge(eq.score);
  const isCliente = user?.rol === "cliente";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eq.codigo && (
            <p className="mb-2 inline-block rounded-lg bg-brand-navy/10 px-2 py-1 font-mono text-sm font-bold text-brand-navy dark:bg-teal-950/50 dark:text-brand-cyan">
              {eq.codigo}
            </p>
          )}
          <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100">{eq.nombre}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {[eq.tipo, eq.sede || eq.ubicacion].filter(Boolean).join(" · ") || "—"}
          </p>
          {eq.cliente_nombre && (
            <p className="mt-1 text-sm text-slate-500">Cliente: {eq.cliente_nombre}</p>
          )}
        </div>
        <span className={`rounded-2xl px-4 py-2 text-sm font-bold shadow ${badge.cls}`}>{badge.text}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-brand-navy dark:text-slate-100">Datos</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Marca / modelo</dt>
              <dd>
                {[eq.marca, eq.modelo].filter(Boolean).join(" ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Capacidad (BTU)</dt>
              <dd>{eq.capacidad_btu ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Instalación</dt>
              <dd>{eq.fecha_instalacion ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Serie</dt>
              <dd>{eq.numero_serie ?? "—"}</dd>
            </div>
          </dl>
          {!isCliente && (
            <button
              type="button"
              onClick={onRecalcScore}
              className="mt-4 w-full rounded-xl border border-brand-teal/40 py-3 text-sm font-semibold text-brand-navy dark:text-slate-200"
            >
              Recalcular salud (IA)
            </button>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-brand-navy dark:text-slate-100">Código QR</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Pégalo en el equipo. Al escanear se abre esta ficha.
          </p>
          <p className="mt-2 break-all font-mono text-xs text-slate-500">{eq.qr_code}</p>
          <button
            type="button"
            disabled={qrBusy}
            onClick={onDownloadQr}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            <Download className="h-5 w-5" />
            {qrBusy ? "Generando…" : "Descargar PNG"}
          </button>
        </Card>
      </div>

      {!isCliente && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/preventivo?equipo=${id}`}
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal px-6 py-4 text-lg font-bold text-white shadow-lg sm:max-w-xs"
          >
            <ClipboardList className="h-6 w-6" />
            Nuevo preventivo
          </Link>
          <Link
            href={`/correctivo?equipo=${id}`}
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-brand-teal px-6 py-4 text-lg font-bold text-brand-navy dark:text-slate-100 sm:max-w-xs"
          >
            <Wrench className="h-6 w-6" />
            Nuevo correctivo
          </Link>
        </div>
      )}

      {eq.memoria_ia && (
        <Card className="p-5">
          <h2 className="font-semibold text-brand-navy dark:text-slate-100">Memoria del equipo</h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">{eq.memoria_ia}</p>
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-brand-navy dark:text-slate-100">Historial</h2>
        {!hist || hist.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">Sin servicios registrados aún.</p>
        ) : (
          <ul className="space-y-3">
            {hist.map((h) => (
              <motion.li key={`${h.tipo}-${h.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-medium text-brand-navy dark:bg-teal-950/50 dark:text-brand-cyan">
                      {h.tipo}
                    </span>
                    <p className="mt-1 font-medium text-brand-navy dark:text-slate-100">{h.tecnico}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{h.fecha}</p>
                    {h.duracion_minutos != null && (
                      <p className="text-xs text-slate-500">Duración: {Math.round(h.duracion_minutos)} min</p>
                    )}
                  </div>
                  {h.pdf_url && (
                    <a
                      href={h.pdf_url}
                      download
                      className="rounded-xl bg-brand-teal/20 px-3 py-2 text-sm font-semibold text-brand-navy dark:text-brand-cyan"
                    >
                      PDF
                    </a>
                  )}
                </Card>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function EquipoFichaPage() {
  return (
    <Suspense fallback={<Loader />}>
      <EquipoFichaInner />
    </Suspense>
  );
}
