"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Equipo } from "@/lib/api";
import {
  dashboardAdmin,
  dashboardCliente,
  dashboardTecnico,
  listEquipos,
} from "@/lib/api";
import type { TarjetaKpiProps } from "@/lib/dashboard-types";
import {
  contarEquiposEnFallo,
  equipoToFila,
  filaBasicaTecnico,
  ordenarEquiposPorRiesgo,
  porcentajeOperativos,
} from "@/lib/dashboard-map";
import { MOCK_ORDENES_TRABAJO, contarOtsPendientesMock } from "@/lib/mock-dashboard-data";
import DashboardSidebar, { buildSidebarNav } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import KPICard from "@/components/dashboard/KPICard";
import EquipmentTable from "@/components/dashboard/EquipmentTable";
import WorkOrderList from "@/components/dashboard/WorkOrderList";
import Loader from "@/components/Loader";
import { useAuthStore } from "@/store/authStore";

function initialsFromNombre(nombre: string) {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0]! + p[p.length - 1]![0]!).toUpperCase();
}

function etiquetaRol(rol?: string) {
  if (rol === "admin") return "Administrador";
  if (rol === "cliente") return "Cliente";
  return "Técnico";
}

function subtituloFecha() {
  try {
    const d = new Date();
    const fecha = new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(d);
    return `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)} · Zona Pacífico`;
  } catch {
    return "Zona Pacífico";
  }
}

type TecnicoEquipoDash = { id: number; nombre: string; score: number };
type ClienteEquipoDash = {
  id: number;
  nombre: string;
  score: number;
  ultimo_servicio: string | null;
};

export default function DashboardClient() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!user?.rol) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        if (user.rol === "admin") {
          const [eq, d] = await Promise.all([listEquipos(), dashboardAdmin()]);
          if (cancelled) return;
          setEquipos(eq);
          setDash(d);
        } else if (user.rol === "tecnico") {
          const [eq, d] = await Promise.all([listEquipos(), dashboardTecnico()]);
          if (cancelled) return;
          setEquipos(eq);
          setDash(d);
        } else {
          const [eq, d] = await Promise.all([listEquipos(), dashboardCliente()]);
          if (cancelled) return;
          setEquipos(eq);
          setDash(d);
        }
      } catch (e) {
        if (!cancelled) setErr(String((e as Error).message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.rol, user?.id]);

  const otsPendientes = useMemo(() => contarOtsPendientesMock(MOCK_ORDENES_TRABAJO), []);
  const equiposEnFallo = useMemo(() => contarEquiposEnFallo(equipos), [equipos]);

  const { principal: navPrincipal, gestion: navGestion } = useMemo(
    () => buildSidebarNav(user?.rol, otsPendientes, equiposEnFallo),
    [user?.rol, otsPendientes, equiposEnFallo]
  );

  const filasEquipos = useMemo(() => {
    if (!user?.rol || !dash) return [];
    if (user.rol === "admin") {
      return ordenarEquiposPorRiesgo(equipos).map(equipoToFila).slice(0, 8);
    }
    if (user.rol === "tecnico") {
      const raw = (dash.equipos as TecnicoEquipoDash[] | undefined) ?? [];
      if (raw.length > 0) {
        return raw.map((e) => filaBasicaTecnico(e.id, e.nombre, e.score));
      }
      return ordenarEquiposPorRiesgo(equipos).map(equipoToFila).slice(0, 8);
    }
    const raw = (dash.equipos as ClienteEquipoDash[] | undefined) ?? [];
    return raw.map((e) =>
      filaBasicaTecnico(
        e.id,
        e.nombre,
        e.score,
        e.ultimo_servicio ? `Último servicio: ${e.ultimo_servicio}` : "—"
      )
    );
  }, [user?.rol, dash, equipos]);

  const kpis: TarjetaKpiProps[] = useMemo(() => {
    if (!user?.rol || !dash) {
      return [
        { icono: "teal", tendencia: { texto: "—", variante: "up" }, valor: "—", etiqueta: "Equipos Activos" },
        { icono: "green", tendencia: { texto: "—", variante: "up" }, valor: "—", etiqueta: "Operativos" },
        { icono: "amber", tendencia: { texto: "—", variante: "down" }, valor: "—", etiqueta: "OTs Pendientes" },
        { icono: "red", tendencia: { texto: "—", variante: "down" }, valor: "—", etiqueta: "En Fallo" },
      ];
    }

    const total =
      user.rol === "admin"
        ? Number(dash.total_equipos ?? equipos.length)
        : user.rol === "tecnico"
          ? (dash.equipos as TecnicoEquipoDash[] | undefined)?.length ?? equipos.length
          : (dash.equipos as ClienteEquipoDash[] | undefined)?.length ?? equipos.length;

    const tec = (dash.equipos as TecnicoEquipoDash[] | undefined) ?? [];
    let pct = porcentajeOperativos(equipos);
    if (user.rol === "tecnico" && tec.length > 0) {
      pct = Math.round((tec.filter((e) => e.score >= 60).length / tec.length) * 100);
    }

    let fallosKpi = equiposEnFallo;
    if (user.rol === "admin") {
      fallosKpi = Number(dash.equipos_riesgo_score ?? equiposEnFallo);
    } else if (user.rol === "tecnico" && tec.length > 0) {
      fallosKpi = tec.filter((e) => e.score < 60).length;
    }

    return [
      {
        icono: "teal",
        tendencia: { texto: "+3%", variante: "up" },
        valor: String(total),
        etiqueta: "Equipos Activos",
        indicadorPct: Math.min(100, Math.max(8, total * 6)),
      },
      {
        icono: "green",
        tendencia: { texto: "+12%", variante: "up" },
        valor: `${pct}%`,
        etiqueta: "Operativos",
        indicadorPct: pct,
      },
      {
        icono: "amber",
        tendencia: { texto: `+${otsPendientes}`, variante: "down" },
        valor: String(otsPendientes),
        etiqueta: "OTs Pendientes",
        indicadorPct: Math.min(100, otsPendientes * 25),
      },
      {
        icono: "red",
        tendencia: { texto: fallosKpi > 0 ? "-1" : "+0", variante: "down" },
        valor: String(fallosKpi),
        etiqueta: "En Fallo",
        indicadorPct: Math.min(100, fallosKpi * 28),
      },
    ];
  }, [user?.rol, dash, equipos, equiposEnFallo, otsPendientes]);

  const tituloPagina =
    user?.rol === "admin"
      ? "Dashboard de Operaciones"
      : user?.rol === "cliente"
        ? "Mis equipos"
        : "Tu día de campo";

  if (!user) return <Loader />;

  if (loading) return <DashboardSkeleton />;

  if (err) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-red-200/80 bg-red-50/70 p-10 text-center shadow-[0_12px_40px_-16px_rgba(220,38,38,0.25)] backdrop-blur-xl dark:border-red-900/40 dark:bg-red-950/50 dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.4)]"
      >
        <p className="max-w-md font-medium text-red-800 dark:text-red-200">{err}</p>
        <p className="max-w-md text-sm text-red-700/90 dark:text-red-300/90">
          Comprueba que el backend esté en marcha ({process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}) y que tu
          sesión sea válida.
        </p>
        <button
          type="button"
          className="mt-1 rounded-xl bg-gradient-to-r from-cap-navy to-cap-teal px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cap-teal/25 transition hover:opacity-95"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </motion.div>
    );
  }

  if (!user.rol) {
    return <p className="text-slate-600 dark:text-slate-400">No hay rol asignado en la sesión.</p>;
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col md:min-h-[calc(100dvh-3.5rem)] md:flex-row">
      <DashboardSidebar
        userName={user.nombre}
        userRoleLabel={etiquetaRol(user.rol)}
        initials={initialsFromNombre(user.nombre)}
        navPrincipal={navPrincipal}
        navGestion={navGestion}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-cap-bg dark:bg-slate-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(13,148,136,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(15,39,68,0.08),transparent_50%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(13,148,136,0.06),transparent_45%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(13,148,136,0.12),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(148,163,184,0.06),transparent_50%)]"
        />
        <DashboardTopbar titulo={tituloPagina} subtitulo={subtituloFecha()} />
        <div className="relative flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
          <motion.div
            className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
            }}
          >
            {kpis.map((k) => (
              <motion.div
                key={k.etiqueta}
                variants={{
                  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
                  show: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { type: "spring", stiffness: 380, damping: 28 },
                  },
                }}
              >
                <KPICard {...k} />
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            className="grid gap-5 lg:grid-cols-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <EquipmentTable filas={filasEquipos} />
            <WorkOrderList ordenes={MOCK_ORDENES_TRABAJO} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
