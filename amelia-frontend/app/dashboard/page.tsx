"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ClipboardList, Wrench } from "lucide-react";
import Card from "@/components/Card";
import Loader from "@/components/Loader";
import { dashboardAdmin, dashboardCliente, dashboardTecnico, listAlertas } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function scoreColor(s: number | null | undefined) {
  if (s == null) return "text-slate-500";
  if (s >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (s >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreLabel(s: number | null | undefined) {
  if (s == null) return "—";
  if (s >= 80) return "Óptimo";
  if (s >= 60) return "Atención";
  return "Riesgo";
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user) as AuthUser | null;
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [alertas, setAlertas] = useState<
    Array<{ tipo: string; equipo_id: number; equipo_nombre: string; detalle: string }>
  >([]);

  useEffect(() => {
    if (!user?.rol) {
      setLoading(false);
      return;
    }
    setErr(null);
    const run = async () => {
      try {
        if (user.rol === "admin") {
          const [d, a] = await Promise.all([dashboardAdmin(), listAlertas()]);
          setData(d);
          setAlertas(a.alertas ?? []);
        } else if (user.rol === "tecnico") {
          setData(await dashboardTecnico());
        } else {
          setData(await dashboardCliente());
        }
      } catch (e) {
        setErr(String((e as Error).message || e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.rol]);

  if (!user) return <Loader />;

  if (loading) return <Loader />;

  if (err) {
    return (
      <Card className="p-6 text-red-700 dark:text-red-300">
        <p>{err}</p>
        <p className="mt-2 text-sm">Comprueba que el backend esté en marcha y tu sesión sea válida.</p>
      </Card>
    );
  }

  if (user.rol === "admin" && data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100">Panel administración</h1>
          <p className="text-slate-600 dark:text-slate-400">Visión global de operaciones</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <p className="text-sm text-slate-500">Equipos activos</p>
            <p className="text-3xl font-bold text-brand-navy dark:text-slate-100">
              {String(data.total_equipos ?? "—")}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Preventivos este mes</p>
            <p className="text-3xl font-bold text-brand-teal">
              {String((data.servicios_mes as { preventivos?: number })?.preventivos ?? "—")}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Correctivos este mes</p>
            <p className="text-3xl font-bold text-brand-teal">
              {String((data.servicios_mes as { correctivos?: number })?.correctivos ?? "—")}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Equipos en riesgo (score &lt; 60)</p>
            <p className="text-3xl font-bold text-red-600">
              {String(data.equipos_riesgo_score ?? "—")}
            </p>
          </Card>
        </div>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-brand-navy dark:text-slate-100">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas predictivas
          </h2>
          {alertas.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">Sin alertas por ahora.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {alertas.map((a, i) => (
                <motion.li
                  key={`${a.equipo_id}-${a.tipo}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-brand-navy dark:text-slate-100">{a.equipo_nombre}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{a.detalle}</p>
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                        {a.tipo}
                      </span>
                    </div>
                    <Link
                      href={`/equipos/${a.equipo_id}`}
                      className="rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      Ver equipo
                    </Link>
                  </Card>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/equipos"
            className="rounded-xl border border-brand-teal/40 px-4 py-3 font-medium text-brand-navy dark:text-slate-200"
          >
            Gestionar equipos
          </Link>
          <Link
            href="/preventivo"
            className="rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-4 py-3 font-semibold text-white"
          >
            Nuevo preventivo
          </Link>
        </div>
      </div>
    );
  }

  if (user.rol === "tecnico" && data) {
    const equipos = (data.equipos as Array<{ id: number; nombre: string; score: number }>) ?? [];
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100">Tu día de campo</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Servicios completados este mes:{" "}
            <strong>{String(data.servicios_completados_mes ?? 0)}</strong>
          </p>
        </div>
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-brand-navy dark:text-slate-100">
            <Wrench className="h-5 w-5" />
            Equipos asignados
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {equipos.map((e) => (
              <li key={e.id}>
                <Link href={`/equipos/${e.id}`}>
                  <Card className="p-4 transition hover:ring-2 hover:ring-brand-teal/40">
                    <p className="font-semibold text-brand-navy dark:text-slate-100">{e.nombre}</p>
                    <p className={`text-2xl font-bold ${scoreColor(e.score)}`}>
                      {e.score ?? "—"} <span className="text-sm font-normal">{scoreLabel(e.score)}</span>
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {equipos.length === 0 && (
            <p className="text-slate-600 dark:text-slate-400">Aún no tienes equipos asignados.</p>
          )}
        </section>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/preventivo"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-r from-brand-navy to-brand-teal px-5 py-3 font-semibold text-white"
          >
            <ClipboardList className="h-5 w-5" />
            Preventivo
          </Link>
          <Link
            href="/correctivo"
            className="inline-flex min-h-[48px] items-center rounded-xl border border-brand-teal/50 px-5 py-3 font-semibold text-brand-navy dark:text-slate-200"
          >
            Correctivo
          </Link>
        </div>
      </div>
    );
  }

  if (user.rol === "cliente" && data) {
    const equipos = (data.equipos as Array<{ id: number; nombre: string; score: number; ultimo_servicio: string | null }>) ?? [];
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy dark:text-slate-100">Mis equipos</h1>
          <p className="text-slate-600 dark:text-slate-400">Historial e informes disponibles por activo</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {equipos.map((e) => (
            <li key={e.id}>
              <Link href={`/equipos/${e.id}`}>
                <Card className="p-5">
                  <p className="font-semibold text-brand-navy dark:text-slate-100">{e.nombre}</p>
                  <p className={`mt-2 text-3xl font-bold ${scoreColor(e.score)}`}>
                    Salud {e.score ?? "—"} — {scoreLabel(e.score)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Último servicio: {e.ultimo_servicio ?? "—"}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
        {equipos.length === 0 && (
          <p className="text-slate-600">Tu técnico aún no ha vinculado equipos a tu cuenta.</p>
        )}
      </div>
    );
  }

  return <p className="text-slate-600">No hay datos de panel para este rol.</p>;
}
