"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, Cpu, ImagePlus, Factory, ScanLine } from "lucide-react";
import Card from "@/components/Card";
import ChatMessageBody from "@/components/ChatMessageBody";
import Loader from "@/components/Loader";
import VisionOverlay from "@/components/VisionOverlay";
import { camara as apiCamara, createEquipo } from "@/lib/api";

function inferTipoDesdePlaca(ex: Record<string, unknown>): string {
  const nombre = String(ex.nombre_equipo ?? "").toLowerCase();
  const ref = String(ex.referencia ?? "").toLowerCase();
  const blob = `${nombre} ${ref}`;
  if (/chill|enfriadora/.test(blob)) return "chiller";
  if (/compres|compressor/.test(blob)) return "compresor";
  if (/\bahu\b|manejadora|rtu/.test(blob)) return "ahu";
  if (/split|multi|cassette|vrf/.test(blob)) return "split";
  return "otro";
}

const PREGUNTAS = [
  "¿Qué problema ves?",
  "¿Está dañado o desgastado?",
  "¿Hay signos de fuga o corrosión?",
];

function fileToBase64(file: File): Promise<{ b64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = r.result as string;
      const m = res.match(/^data:([^;]+);base64,(.+)$/);
      if (m) resolve({ mime: m[1], b64: m[2] });
      else reject(new Error("No se pudo leer la imagen"));
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function CamaraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [mime, setMime] = useState("image/jpeg");
  const [pregunta, setPregunta] = useState(PREGUNTAS[0]);
  const [modoVision, setModoVision] = useState<"diagnostico" | "placa">("diagnostico");
  const [camOn, setCamOn] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [extraccion, setExtraccion] = useState<Record<string, unknown> | null>(null);
  const [draftNombre, setDraftNombre] = useState("");
  const [draftTipo, setDraftTipo] = useState("split");
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearErr, setCrearErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCam = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("No se pudo acceder a la cámara. Prueba subir una foto.");
    }
  }, []);

  const capturar = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setPreview(dataUrl);
    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (m) {
      setMime(m[1]);
      setBase64(m[2]);
    }
    stopCam();
  }, [stopCam]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    try {
      const { b64, mime: m } = await fileToBase64(f);
      setBase64(b64);
      setMime(m || "image/png");
      setPreview(`data:${m};base64,${b64}`);
    } catch (err) {
      setError(String((err as Error).message || err));
    }
    e.target.value = "";
  }

  async function analizar() {
    if (!base64) {
      setError("Selecciona o captura una imagen primero.");
      return;
    }
    setError(null);
    setCrearErr(null);
    setLoading(true);
    setResultado(null);
    setExtraccion(null);
    setMs(null);
    setTokens(null);
    const t0 = performance.now();
    try {
      const res = await apiCamara(base64, pregunta, mime, modoVision);
      setResultado(res.analisis);
      setMs(Math.round(performance.now() - t0));
      setTokens(res.tokens ?? null);
      if (res.extraccion && typeof res.extraccion === "object") {
        setExtraccion(res.extraccion);
        const ex = res.extraccion;
        const nom = String(ex.nombre_equipo ?? "").trim();
        setDraftNombre(nom || "Equipo desde placa");
        setDraftTipo(inferTipoDesdePlaca(res.extraccion));
      }
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  }

  async function crearEquipoDesdePlaca() {
    if (!extraccion) return;
    setCrearErr(null);
    setCrearLoading(true);
    try {
      await createEquipo({
        nombre: draftNombre.trim() || "Equipo desde placa",
        tipo: draftTipo,
        ubicacion: "",
        placa_json: JSON.stringify(extraccion),
      });
      router.push("/equipos");
    } catch (e) {
      setCrearErr(String((e as Error).message || e));
    } finally {
      setCrearLoading(false);
    }
  }

  const hasFrame = Boolean(preview || camOn);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/30 bg-gradient-to-r from-brand-navy to-brand-teal p-6 text-white shadow-2xl">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ScanLine className="h-7 w-7" />
          Inspección visual IA
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-teal-50/95">
          Modo diagnóstico: hallazgos en campo. Modo placa: lectura asistida de datos de fabricante
          (JSON) y alta rápida de activo con código CAP.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {!camOn ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={startCam}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal px-6 py-4 font-semibold text-white shadow-xl"
          >
            <CameraIcon className="h-6 w-6" />
            Usar cámara
          </motion.button>
        ) : (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={capturar}
              className="rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal px-5 py-3 font-semibold text-white shadow-lg"
            >
              Capturar foto
            </motion.button>
            <button
              type="button"
              onClick={stopCam}
              className="rounded-2xl border border-white/40 bg-white/20 px-5 py-3 font-medium text-brand-navy backdrop-blur"
            >
              Cerrar cámara
            </button>
          </>
        )}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-brand-teal/50 bg-white/50 px-5 py-3 font-semibold text-brand-navy shadow-lg backdrop-blur"
        >
          <ImagePlus className="h-5 w-5" />
          Subir de galería
        </motion.button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>

      <motion.div
        layout
        className="relative overflow-hidden rounded-2xl border border-white/30 bg-brand-navy/20 shadow-2xl backdrop-blur-xl"
        style={{ minHeight: "min(70vh, 560px)" }}
      >
        <AnimatePresence mode="wait">
          {camOn && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[min(70vh,560px)] w-full bg-black"
            >
              <video
                ref={videoRef}
                className="h-full min-h-[min(70vh,560px)] w-full object-cover"
                playsInline
                muted
              />
            </motion.div>
          )}
        </AnimatePresence>
        {preview && !camOn && (
          <div className="relative mx-auto min-h-[min(70vh,560px)] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Vista previa del componente"
              className="mx-auto h-full min-h-[min(70vh,560px)] w-full object-contain bg-gradient-to-b from-brand-navy/40 to-slate-900/80"
            />
            {resultado && modoVision === "diagnostico" && (
              <VisionOverlay show seed={resultado + pregunta} />
            )}
          </div>
        )}
        {!hasFrame && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-teal-100">
            <Cpu className="h-14 w-14 opacity-60" />
            <p className="max-w-sm text-sm">
              Captura o sube una imagen nítida del equipo. Amelia analiza con visión en modo
              detail bajo para optimizar costo.
            </p>
          </div>
        )}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-brand-navy/60 backdrop-blur-md"
            >
              <div className="mx-4 w-full max-w-md rounded-2xl border border-white/25 bg-white/85 p-6 shadow-2xl backdrop-blur-xl">
                <Loader
                  label={modoVision === "placa" ? "Leyendo placa…" : "Analizando componente…"}
                  sublabel={modoVision === "placa" ? "Visión alta · JSON estructurado" : "Modelo de visión · espera unos segundos"}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setModoVision("diagnostico")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            modoVision === "diagnostico"
              ? "bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-lg"
              : "border border-teal-200/80 bg-white/60 text-brand-navy dark:bg-slate-900/50"
          }`}
        >
          <ScanLine className="h-4 w-4" />
          Diagnóstico visual
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setModoVision("placa")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            modoVision === "placa"
              ? "bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-lg"
              : "border border-teal-200/80 bg-white/60 text-brand-navy dark:bg-slate-900/50"
          }`}
        >
          <Factory className="h-4 w-4" />
          Leer placa de datos
        </motion.button>
      </div>

      {modoVision === "diagnostico" && (
        <div className="flex flex-wrap gap-2">
          {PREGUNTAS.map((p) => (
            <motion.button
              key={p}
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPregunta(p)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                pregunta === p
                  ? "bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-lg"
                  : "border border-teal-200/80 bg-white/60 text-brand-navy backdrop-blur hover:border-brand-teal"
              }`}
            >
              {p}
            </motion.button>
          ))}
        </div>
      )}

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={analizar}
        disabled={loading || !base64}
        className="rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal px-8 py-3.5 font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl disabled:opacity-50"
      >
        {loading
          ? "Procesando imagen…"
          : modoVision === "placa"
            ? "Extraer datos de la placa"
            : "Ejecutar análisis visual"}
      </motion.button>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 shadow-lg backdrop-blur">
          {error}
        </p>
      )}

      <AnimatePresence>
        {resultado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-brand-navy">
                {modoVision === "placa" ? "EXTRACCIÓN PLACA" : "INFORME TÉCNICO"}
              </span>
              {ms != null && (
                <span className="rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-navy backdrop-blur">
                  Latencia {ms} ms
                </span>
              )}
              {tokens != null && (
                <span className="rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-xs font-medium text-brand-navy">
                  Tokens ~{tokens}
                </span>
              )}
            </div>
            <Card className="p-6" hover={false}>
              {modoVision === "placa" && extraccion && (
                <div className="space-y-8">
                  <div className="rounded-2xl border border-teal-200/80 bg-white/60 p-4 dark:bg-slate-900/40">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-brand-teal">
                      Ficha técnica (lectura asistida)
                    </h3>
                    <dl className="mt-3 grid gap-2 text-sm text-slate-800 dark:text-slate-200 sm:grid-cols-2">
                      {[
                        ["Nombre", extraccion.nombre_equipo],
                        ["Referencia", extraccion.referencia],
                        ["Capacidad BTU", extraccion.capacidad_btu],
                        ["Refrigerante", extraccion.refrigerante],
                        ["Voltaje", extraccion.voltaje],
                        ["Corriente", extraccion.corriente],
                        ["Observaciones", extraccion.observaciones],
                      ].map(([k, v]) => (
                        <div key={String(k)} className="flex flex-col gap-0.5">
                          <dt className="text-[10px] font-bold uppercase text-brand-teal">{String(k)}</dt>
                          <dd className="font-mono text-xs">
                            {v != null && v !== "" ? String(v) : "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="rounded-2xl border border-dashed border-brand-teal/40 bg-teal-50/30 p-4 dark:bg-slate-900/30">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-brand-navy dark:text-slate-200">
                      Registrar activo en CMMS
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Se generará un código industrial tipo CAP-CH-001 según el tipo. Ajusta nombre y
                      tipo antes de guardar.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="flex min-w-[180px] flex-1 flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-brand-teal">Nombre</span>
                        <input
                          className="rounded-xl border border-teal-200/80 bg-white px-3 py-2 text-sm dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
                          value={draftNombre}
                          onChange={(e) => setDraftNombre(e.target.value)}
                        />
                      </label>
                      <label className="flex min-w-[160px] flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-brand-teal">Tipo</span>
                        <select
                          className="rounded-xl border border-teal-200/80 bg-white px-3 py-2 text-sm dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
                          value={draftTipo}
                          onChange={(e) => setDraftTipo(e.target.value)}
                        >
                          <option value="chiller">Chiller</option>
                          <option value="compresor">Compresor</option>
                          <option value="ahu">AHU</option>
                          <option value="split">Split</option>
                          <option value="otro">Otro</option>
                        </select>
                      </label>
                    </div>
                    {crearErr && (
                      <p className="mt-2 text-sm text-red-700 dark:text-red-300">{crearErr}</p>
                    )}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      disabled={crearLoading}
                      onClick={crearEquipoDesdePlaca}
                      className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60 sm:w-auto sm:px-8"
                    >
                      {crearLoading ? "Creando activo…" : "Crear equipo con estos datos"}
                    </motion.button>
                  </div>
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 lg:col-span-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-brand-teal">
                      Respuesta JSON (referencia)
                    </h3>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-brand-navy/5 p-3 font-mono text-xs text-brand-navy dark:text-slate-200">
                      {resultado}
                    </pre>
                  </div>
                </div>
              )}
              {modoVision === "placa" && !extraccion && resultado && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-sm text-amber-900">
                    No se pudo parsear JSON. Revisa el texto o vuelve a capturar con más luz.
                  </p>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-brand-navy">
                    {resultado}
                  </pre>
                </div>
              )}
              {modoVision === "diagnostico" && (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-brand-teal">
                      Resumen ejecutivo
                    </h3>
                    <p className="mt-2 text-sm text-slate-700">
                      Generado por Amelia a partir de la imagen y la pregunta seleccionada.
                      Valida siempre en campo con medición.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 lg:col-span-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-brand-teal">
                      Detalle estructurado
                    </h3>
                    <div className="mt-3 text-brand-navy">
                      <ChatMessageBody content={resultado} />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
