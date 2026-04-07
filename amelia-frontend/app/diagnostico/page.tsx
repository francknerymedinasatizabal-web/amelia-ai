"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import Card from "@/components/Card";
import DiagnosticResult from "@/components/DiagnosticResult";
import Loader from "@/components/Loader";
import {
  diagnostico as apiDiagnostico,
  guardar,
  listEquipos,
  type Equipo,
} from "@/lib/api";
import { inferirCriterioTecnico } from "@/lib/criterioTecnico";
import { parseDiagnosticoText } from "@/lib/diagnosticoParser";
import { useAmeliaStore } from "@/store/useAmeliaStore";
import { useAuthStore } from "@/store/authStore";

const RAPIDAS = [
  { emoji: "❄️", label: "No enfría", texto: "El equipo no enfría correctamente" },
  { emoji: "💧", label: "Gotea agua", texto: "Gotea agua del equipo interior" },
  { emoji: "🔊", label: "Ruido extraño", texto: "Ruido extraño en el ventilador o compresor" },
  { emoji: "⚡", label: "No enciende", texto: "El equipo no enciende" },
  { emoji: "🧊", label: "Se congela", texto: "Se congela el evaporador o tuberías" },
  { emoji: "🔥", label: "Compresor caliente", texto: "El compresor está muy caliente" },
  { emoji: "💨", label: "Poco caudal", texto: "Poco caudal de aire por las rejillas" },
  { emoji: "🔌", label: "Falla eléctrica", texto: "Falla eléctrica o disparo de protección" },
];

export default function DiagnosticoPage() {
  const authUser = useAuthStore((s) => s.user);
  const setDiagnosticoLoading = useAmeliaStore((s) => s.setDiagnosticoLoading);
  const setLastDiagnosticoMeta = useAmeliaStore((s) => s.setLastDiagnosticoMeta);
  const setCampoContext = useAmeliaStore((s) => s.setCampoContext);
  const loadHistorial = useAmeliaStore((s) => s.loadHistorial);

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoId, setEquipoId] = useState<number | "">("");
  const [problema, setProblema] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [fecha, setFecha] = useState("");
  const [solucion, setSolucion] = useState("");
  const [resultado, setResultado] = useState("");
  const [fuente, setFuente] = useState<string | null>(null);
  const [ms, setMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (authUser?.nombre) setTecnico((t) => t || authUser.nombre);
  }, [authUser?.nombre]);

  useEffect(() => {
    listEquipos()
      .then(setEquipos)
      .catch(() => setEquipos([]));
  }, []);

  const equipoNombre =
    equipoId === ""
      ? ""
      : equipos.find((e) => e.id === equipoId)?.nombre || "";

  async function generar() {
    setError(null);
    if (equipoId === "") {
      setError("Selecciona un activo registrado (Equipos).");
      return;
    }
    if (!problema.trim()) {
      setError("Describe el síntoma.");
      return;
    }
    setLoading(true);
    setDiagnosticoLoading(true);
    setResultado("");
    setFuente(null);
    setStep(2);
    const t0 = performance.now();
    try {
      const res = await apiDiagnostico(equipoNombre, problema.trim());
      const elapsed = Math.round(performance.now() - t0);
      setResultado(res.diagnostico);
      setFuente(res.fuente);
      setMs(elapsed);
      setLastDiagnosticoMeta({
        fuente: res.fuente,
        ms: elapsed,
        at: Date.now(),
      });
      setCampoContext({
        equipo: equipoNombre,
        problema: problema.trim(),
        resumenDiagnostico: res.diagnostico.slice(0, 1200),
        fuente: res.fuente,
        at: Date.now(),
      });
      setStep(3);
    } catch (e) {
      setError(String((e as Error).message || e));
      setStep(1);
    } finally {
      setLoading(false);
      setDiagnosticoLoading(false);
    }
  }

  async function onGuardar() {
    setError(null);
    if (!resultado.trim() || equipoId === "") return;
    const parsed = parseDiagnosticoText(resultado);
    const crit = inferirCriterioTecnico(problema, fuente || "openai", parsed);
    setSaving(true);
    try {
      await guardar({
        equipo_id: Number(equipoId),
        problema: problema.trim(),
        tecnico: tecnico.trim(),
        fecha: fecha.trim(),
        diagnostico: resultado,
        solucion: solucion.trim(),
        riesgo: crit.riesgo,
        tiempo_estimado: crit.tiempoReparacion,
      });
      setSolucion("");
      await loadHistorial();
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setSaving(false);
    }
  }

  function copyAll() {
    const blob = `${equipoNombre}\n${problema}\n\n${resultado}`;
    void navigator.clipboard.writeText(blob);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const parsed = resultado ? parseDiagnosticoText(resultado) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy md:text-3xl dark:text-slate-100">
            Diagnóstico guiado
          </h1>
          <p className="mt-1 max-w-xl text-slate-600 dark:text-slate-400">
            Cada caso queda ligado a un <strong>activo</strong> y al técnico autenticado.
          </p>
        </div>
        <div className="flex rounded-2xl border border-white/30 bg-white/40 p-1 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                step >= n
                  ? "bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-md"
                  : "text-brand-teal dark:text-slate-400"
              }`}
            >
              {n === 1 ? "Contexto" : n === 2 ? "Análisis" : "Resultado"}
            </span>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-navy dark:text-slate-100">
          <Sparkles className="h-4 w-4 text-brand-teal" />
          Falla frecuente — un toque rellena el síntoma
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {RAPIDAS.map((b, i) => (
            <motion.button
              key={b.label}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setProblema(b.texto);
                setStep(1);
              }}
              className="flex items-center gap-2 rounded-2xl border border-teal-200/60 bg-white/60 px-3 py-3 text-left text-sm font-medium text-brand-navy shadow-md backdrop-blur transition-all duration-300 hover:border-brand-teal hover:shadow-xl dark:border-teal-700/30 dark:bg-slate-900/50 dark:text-slate-100"
            >
              <span className="text-xl" aria-hidden>
                {b.emoji}
              </span>
              {b.label}
            </motion.button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-teal dark:text-slate-400">
              Activo / equipo (registrado)
            </span>
            <select
              className="mt-1.5 w-full rounded-xl border border-teal-200/80 bg-white/70 px-4 py-3 text-brand-navy shadow-inner outline-none backdrop-blur dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
              value={equipoId === "" ? "" : String(equipoId)}
              onChange={(e) =>
                setEquipoId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">— Seleccionar equipo —</option>
              {equipos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigo ? `${e.codigo} · ` : ""}
                  {e.nombre}
                  {e.ubicacion ? ` · ${e.ubicacion}` : ""}
                </option>
              ))}
            </select>
            {equipos.length === 0 && (
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                No hay equipos.{" "}
                <Link href="/equipos" className="font-semibold underline">
                  Crea activos aquí
                </Link>
                .
              </p>
            )}
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-teal dark:text-slate-400">
              Síntoma / problema
            </span>
            <textarea
              className="mt-1.5 min-h-[100px] w-full rounded-xl border border-teal-200/80 bg-white/70 px-4 py-3 text-brand-navy shadow-inner outline-none backdrop-blur dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              placeholder="Qué ve el cliente, qué midió el técnico…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-teal dark:text-slate-400">
              Técnico (firma en informe)
            </span>
            <input
              className="mt-1.5 w-full rounded-xl border border-teal-200/80 bg-white/70 px-4 py-3 outline-none backdrop-blur dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              placeholder={authUser?.nombre || "Nombre"}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-teal dark:text-slate-400">
              Fecha visita
            </span>
            <input
              className="mt-1.5 w-full rounded-xl border border-teal-200/80 bg-white/70 px-4 py-3 outline-none backdrop-blur dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              placeholder="2026-04-06"
            />
          </label>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generar}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal px-6 py-3.5 font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl disabled:opacity-60"
        >
          {loading ? "Procesando…" : "Ejecutar análisis guiado"}
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </Card>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 shadow-lg backdrop-blur dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="p-8" hover={false}>
              <Loader
                label="Analizando caso técnico…"
                sublabel="Cruce con base local y, si hace falta, modelo ligero"
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && resultado && fuente && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <DiagnosticResult
            equipo={equipoNombre}
            problema={problema}
            parsed={parsed}
            raw={resultado}
            fuente={fuente}
            ms={ms}
            onCopy={copyAll}
            copied={copied}
            tecnico={tecnico.trim()}
            fecha={fecha.trim()}
          />

          <Card className="p-6">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-teal dark:text-slate-400">
                Solución aplicada en campo
              </span>
              <textarea
                className="mt-1.5 min-h-[88px] w-full rounded-xl border border-teal-200/80 bg-white/70 px-4 py-3 outline-none backdrop-blur focus:ring-2 focus:ring-brand-teal dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                placeholder="Piezas cambiadas, presiones finales, observaciones…"
              />
            </label>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGuardar}
              disabled={saving}
              className="mt-4 rounded-2xl border-2 border-brand-teal/40 bg-white/80 px-5 py-2.5 font-semibold text-brand-navy shadow-lg backdrop-blur transition-all duration-300 hover:border-brand-teal disabled:opacity-60 dark:border-brand-teal/50 dark:bg-slate-900/60 dark:text-slate-100"
            >
              {saving ? "Guardando en historial…" : "Guardar mantenimiento"}
            </motion.button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
