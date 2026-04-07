"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import Card from "@/components/Card";
import { createEquipo, deleteEquipo, listEquipos, type Equipo } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function scoreHint(s: number | null | undefined) {
  if (s == null) return "—";
  if (s >= 80) return "Óptimo";
  if (s >= 60) return "Atención";
  return "Riesgo";
}

export default function EquiposPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [sede, setSede] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [fechaInst, setFechaInst] = useState("");
  const [serie, setSerie] = useState("");
  const [clienteId, setClienteId] = useState("");

  const isCliente = user?.rol === "cliente";
  const isAdmin = user?.rol === "admin";

  async function refresh() {
    setErr(null);
    try {
      setItems(await listEquipos());
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setErr(null);
    try {
      await createEquipo({
        nombre: nombre.trim(),
        tipo: tipo.trim(),
        ubicacion: ubicacion.trim(),
        sede: sede.trim(),
        marca: marca.trim() || undefined,
        modelo: modelo.trim() || undefined,
        capacidad_btu: capacidad ? Number(capacidad) : undefined,
        fecha_instalacion: fechaInst.trim() || undefined,
        numero_serie: serie.trim() || undefined,
        cliente_id: isAdmin && clienteId.trim() ? Number(clienteId) : undefined,
      });
      setNombre("");
      setTipo("");
      setUbicacion("");
      setSede("");
      setMarca("");
      setModelo("");
      setCapacidad("");
      setFechaInst("");
      setSerie("");
      setClienteId("");
      await refresh();
    } catch (e) {
      setErr(String((e as Error).message || e));
    }
  }

  async function onDelete(id: number) {
    if (!confirm("¿Eliminar equipo?")) return;
    try {
      await deleteEquipo(id);
      await refresh();
    } catch (e) {
      setErr(String((e as Error).message || e));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100">
            {isCliente ? "Mis equipos" : "Activos / equipos"}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Código único tipo SPLIT-2025-0042, QR en la ficha del equipo.
          </p>
        </div>
        {!isCliente && (
          <Link
            href="/diagnostico"
            className="rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            Diagnóstico
          </Link>
        )}
      </div>

      {!isCliente && (
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-semibold text-brand-navy dark:text-slate-100">
            <Plus className="h-5 w-5" />
            Alta de equipo
          </h2>
          <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              required
              placeholder="Nombre del activo *"
              className="rounded-xl border border-teal-200/80 bg-white/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <select
              className="rounded-xl border border-teal-200/80 bg-white/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Tipo *</option>
              <option value="split">Split</option>
              <option value="central">Central</option>
              <option value="cassette">Cassette</option>
              <option value="piso techo">Piso techo</option>
              <option value="ventilacion">Ventilación</option>
              <option value="chiller">Chiller</option>
            </select>
            <input
              placeholder="Ubicación / zona"
              className="rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
            <input
              placeholder="Sede / sitio"
              className="rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={sede}
              onChange={(e) => setSede(e.target.value)}
            />
            <input
              placeholder="Marca"
              className="rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />
            <input
              placeholder="Modelo"
              className="rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
            />
            <input
              placeholder="Capacidad BTU"
              inputMode="numeric"
              className="rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value.replace(/[^\d]/g, ""))}
            />
            <input
              type="date"
              className="rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={fechaInst}
              onChange={(e) => setFechaInst(e.target.value)}
            />
            <input
              placeholder="Nº serie (opcional)"
              className="rounded-xl border border-teal-200/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60"
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
            />
            {isAdmin && (
              <input
                placeholder="ID cliente (usuario)"
                className="rounded-xl border border-amber-200/80 px-4 py-3 dark:border-amber-800/50 dark:bg-slate-900/60"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value.replace(/[^\d]/g, ""))}
              />
            )}
            <button
              type="submit"
              className="rounded-xl bg-brand-teal px-4 py-3 font-semibold text-white lg:col-span-3"
            >
              Guardar equipo
            </button>
          </form>
          {err && <p className="mt-3 text-sm text-red-700 dark:text-red-300">{err}</p>}
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-navy dark:text-slate-100">Listado</h2>
        {loading && <p className="text-slate-600">Cargando…</p>}
        {!loading && items.length === 0 && (
          <p className="text-slate-600 dark:text-slate-400">No hay equipos visibles para tu cuenta.</p>
        )}
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((eq, i) => (
            <motion.li
              key={eq.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <Link href={`/equipos/${eq.id}`} className="min-w-0 flex-1">
                  {eq.codigo && (
                    <p className="mb-1 inline-block rounded-lg bg-brand-navy/10 px-2 py-0.5 font-mono text-xs font-bold text-brand-navy dark:bg-teal-950/50 dark:text-brand-cyan">
                      {eq.codigo}
                    </p>
                  )}
                  <p className="font-semibold text-brand-navy dark:text-slate-100">{eq.nombre}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {[eq.tipo, eq.sede || eq.ubicacion].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-teal">
                    Salud: {eq.score ?? "—"} — {scoreHint(eq.score)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm text-brand-cyan">
                    Ver ficha <ExternalLink className="h-4 w-4" />
                  </span>
                </Link>
                {!isCliente && (
                  <button
                    type="button"
                    onClick={() => onDelete(eq.id)}
                    className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </Card>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
