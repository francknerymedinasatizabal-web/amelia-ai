"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import Card from "@/components/Card";
import { pdfToDataUri } from "@/lib/pdf/dataUrl";
import { drawWrappedText } from "@/lib/pdf/wrapText";
import Loader from "@/components/Loader";
import VoiceInput from "@/components/VoiceInput";
import {
  correctivoDiagnostico,
  correctivoGuardar,
  listEquipos,
  type Equipo,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const SINTOMAS = [
  "no enfría",
  "ruido extraño",
  "no enciende",
  "gotea agua",
  "mal olor",
  "display apagado",
  "otro",
];

function CorrectivoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const preEquipo = searchParams.get("equipo");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoId, setEquipoId] = useState<number>(preEquipo ? Number(preEquipo) : 0);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [desc, setDesc] = useState("");
  const [causa, setCausa] = useState("");
  const [pasos, setPasos] = useState<string[]>([]);
  const [acciones, setAcciones] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t0 = useRef<number | null>(null);

  useEffect(() => {
    listEquipos().then(setEquipos).catch(() => setEquipos([]));
  }, []);

  useEffect(() => {
    t0.current = Date.now();
  }, []);

  const nombreEquipo = equipos.find((e) => e.id === equipoId)?.nombre ?? "";

  const pedirIa = useCallback(async () => {
    if (!equipoId) {
      setErr("Selecciona equipo");
      return;
    }
    const sintomas = Object.entries(sel)
      .filter(([, v]) => v)
      .map(([k]) => k);
    setBusy(true);
    setErr(null);
    try {
      const r = await correctivoDiagnostico(sintomas, desc);
      setCausa(r.causa_probable);
      setPasos(r.pasos);
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setBusy(false);
    }
  }, [sel, desc, equipoId]);

  async function finalizar() {
    if (!equipoId) {
      setErr("Selecciona equipo");
      return;
    }
    setBusy(true);
    try {
      const sintomas_json = Object.entries(sel)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const t1 = Date.now();
      const dur = t0.current ? (t1 - t0.current) / 60000 : null;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Informe correctivo", 14, 18);
      doc.setFontSize(11);
      doc.text(`Equipo: ${nombreEquipo}`, 14, 28);
      doc.text(`Técnico: ${user?.nombre ?? ""}`, 14, 34);
      doc.text(`Fecha: ${new Date().toLocaleString("es")}`, 14, 40);
      let y = drawWrappedText(doc, `Causa probable: ${causa}`, 14, 50, 180, 6) + 4;
      doc.text("Pasos sugeridos:", 14, y);
      y += 8;
      pasos.forEach((p, i) => {
        doc.text(`${i + 1}. ${p}`, 14, y);
        y += 6;
      });
      y += 4;
      doc.text("Acciones realizadas:", 14, y);
      y += 8;
      y = drawWrappedText(doc, acciones || "—", 14, y, 180, 7);
      const pdfDataUrl = pdfToDataUri(doc);

      await correctivoGuardar({
        equipo_id: equipoId,
        sintomas_json,
        descripcion: desc,
        causa,
        pasos_json: pasos,
        acciones_realizadas: acciones,
        fotos_urls: [],
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
    return <Card className="p-6">Los clientes no registran correctivos.</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100">Correctivo</h1>
        <p className="text-slate-600 dark:text-slate-400">Síntomas rápidos + IA de apoyo</p>
      </div>

      <Card className="space-y-4 p-6">
        <label className="block">
          <span className="text-sm font-medium">Equipo</span>
          <select
            className="mt-2 w-full rounded-xl border px-4 py-3 text-lg dark:bg-slate-900/60"
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

        <div>
          <p className="text-sm font-medium">Síntomas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SINTOMAS.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-teal-200/80 px-3 py-2 dark:border-teal-800"
              >
                <input
                  type="checkbox"
                  checked={!!sel[s]}
                  onChange={(e) => setSel((x) => ({ ...x, [s]: e.target.checked }))}
                />
                <span className="capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Descripción</span>
          <textarea
            className="mt-2 w-full rounded-xl border px-4 py-3 dark:bg-slate-900/60"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </label>
        <VoiceInput value={desc} onChange={setDesc} label="Dictar descripción" />

        <button
          type="button"
          onClick={pedirIa}
          disabled={busy}
          className="w-full rounded-xl bg-brand-navy py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Consultando IA…" : "Obtener causa y pasos (IA)"}
        </button>
      </Card>

      {(causa || pasos.length > 0) && (
        <Card className="space-y-3 p-6">
          <h2 className="font-semibold text-brand-navy dark:text-slate-100">Propuesta IA</h2>
          <p className="text-slate-800 dark:text-slate-200">{causa}</p>
          <ol className="list-decimal space-y-2 pl-5">
            {pasos.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>

          <label className="block">
            <span className="text-sm font-medium">¿Qué hiciste en campo?</span>
            <textarea
              className="mt-2 w-full rounded-xl border px-4 py-3 dark:bg-slate-900/60"
              rows={4}
              value={acciones}
              onChange={(e) => setAcciones(e.target.value)}
            />
          </label>
          <VoiceInput value={acciones} onChange={setAcciones} label="Dictar acciones" />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="button"
            onClick={finalizar}
            disabled={busy}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal py-4 text-lg font-bold text-white"
          >
            Guardar e informe PDF
          </button>
        </Card>
      )}

      <Link href="/equipos" className="text-sm text-brand-teal underline">
        Volver
      </Link>
    </div>
  );
}

export default function CorrectivoPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CorrectivoInner />
    </Suspense>
  );
}
