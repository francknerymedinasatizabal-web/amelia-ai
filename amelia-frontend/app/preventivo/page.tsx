"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import Card from "@/components/Card";
import { pdfToDataUri } from "@/lib/pdf/dataUrl";
import { drawWrappedText } from "@/lib/pdf/wrapText";
import Loader from "@/components/Loader";
import VoiceInput from "@/components/VoiceInput";
import { listEquipos, preventivoChecklist, preventivoGuardar, type Equipo } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function PreventivoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const preEquipo = searchParams.get("equipo");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoId, setEquipoId] = useState<number>(preEquipo ? Number(preEquipo) : 0);
  const [tipo, setTipo] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [checks, setChecks] = useState<Record<number, "ok" | "na" | null>>({});
  const [obs, setObs] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t0 = useRef<number | null>(null);

  useEffect(() => {
    listEquipos()
      .then(setEquipos)
      .catch(() => setEquipos([]));
  }, []);

  useEffect(() => {
    t0.current = Date.now();
  }, []);

  const nombreEquipo = useMemo(() => equipos.find((e) => e.id === equipoId)?.nombre ?? "", [equipos, equipoId]);

  const loadChecklist = useCallback(async () => {
    if (!tipo) return;
    setErr(null);
    setBusy(true);
    try {
      const r = await preventivoChecklist(tipo);
      setItems(r.items);
      setChecks({});
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setBusy(false);
    }
  }, [tipo]);

  async function finalizar() {
    if (!equipoId) {
      setErr("Selecciona un equipo");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const t1 = Date.now();
      const dur = t0.current ? (t1 - t0.current) / 60000 : null;
      const checklist_json = items.map((text, i) => ({
        item: text,
        estado: checks[i] ?? null,
      }));
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Informe de mantenimiento preventivo", 14, 18);
      doc.setFontSize(11);
      doc.text(`Equipo: ${nombreEquipo}`, 14, 28);
      doc.text(`Técnico: ${user?.nombre ?? ""}`, 14, 34);
      doc.text(`Fecha: ${new Date().toLocaleString("es")}`, 14, 40);
      if (dur != null) doc.text(`Duración aprox: ${dur.toFixed(1)} min`, 14, 46);
      let y = 56;
      doc.text("Checklist:", 14, y);
      y += 8;
      items.forEach((t, i) => {
        const st = checks[i] === "ok" ? "Hecho" : checks[i] === "na" ? "N/A" : "—";
        const line = `${i + 1}. ${t} [${st}]`;
        doc.text(line, 14, y);
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      y += 6;
      doc.text("Observaciones:", 14, y);
      y += 8;
      y = drawWrappedText(doc, obs || "—", 14, y, 180, 7);
      const pdfDataUrl = pdfToDataUri(doc);

      await preventivoGuardar({
        equipo_id: equipoId,
        checklist_json,
        observaciones: obs,
        tiempo_inicio: t0.current ? new Date(t0.current).toISOString() : null,
        tiempo_fin: new Date().toISOString(),
        duracion_minutos: dur,
        pdf_url: pdfDataUrl,
      });
      router.push(`/equipos/${equipoId}`);
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setBusy(false);
    }
  }

  if (user?.rol === "cliente") {
    return <Card className="p-6">Los clientes no registran preventivos.</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100">Mantenimiento preventivo</h1>
        <p className="text-slate-600 dark:text-slate-400">Checklist guiado — el cronómetro corre en segundo plano</p>
      </div>

      <Card className="space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-medium text-brand-navy dark:text-slate-200">Equipo</span>
          <select
            className="mt-2 w-full rounded-xl border border-teal-200/80 bg-white px-4 py-3 text-lg dark:border-teal-700/40 dark:bg-slate-900/60"
            value={equipoId || ""}
            onChange={(e) => setEquipoId(Number(e.target.value))}
          >
            <option value="">Selecciona…</option>
            {equipos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.codigo ? `${e.codigo} — ` : ""}
                {e.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-brand-navy dark:text-slate-200">Tipo para checklist</span>
          <select
            className="mt-2 w-full rounded-xl border border-teal-200/80 bg-white px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Selecciona tipo…</option>
            <option value="split">Split</option>
            <option value="central">Central</option>
            <option value="cassette">Cassette</option>
            <option value="piso techo">Piso techo</option>
            <option value="ventilacion">Ventilación</option>
            <option value="chiller">Chiller</option>
          </select>
        </label>

        <button
          type="button"
          onClick={loadChecklist}
          disabled={busy || !tipo}
          className="w-full rounded-xl bg-brand-navy px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          Generar checklist (IA)
        </button>
      </Card>

      {items.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-brand-navy dark:text-slate-100">Lista de verificación</h2>
          <ul className="mt-4 space-y-4">
            {items.map((text, i) => (
              <li key={i} className="rounded-xl border border-teal-100/80 p-4 dark:border-teal-900/40">
                <p className="font-medium text-brand-navy dark:text-slate-100">{text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setChecks((c) => ({ ...c, [i]: "ok" }))}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      checks[i] === "ok" ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    Hecho
                  </button>
                  <button
                    type="button"
                    onClick={() => setChecks((c) => ({ ...c, [i]: "na" }))}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      checks[i] === "na" ? "bg-slate-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    No aplica
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <label className="mt-6 block">
            <span className="text-sm font-medium">Observaciones</span>
            <textarea
              className="mt-2 w-full rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              rows={4}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Escribe o dicta…"
            />
          </label>
          <VoiceInput value={obs} onChange={setObs} className="mt-3" label="Voz" />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="button"
            disabled={busy}
            onClick={finalizar}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal py-4 text-lg font-bold text-white shadow-lg disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Finalizar y generar PDF"}
          </button>
        </Card>
      )}

      <Link href="/equipos" className="inline-block text-sm text-brand-teal underline">
        Volver a equipos
      </Link>
    </div>
  );
}

export default function PreventivoPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PreventivoInner />
    </Suspense>
  );
}
