"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  Camera,
  LayoutDashboard,
  MessageCircle,
  ClipboardList,
  MoreHorizontal,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeAlert?: boolean;
};

function NavRow({
  href,
  label,
  icon: Icon,
  active,
  badge,
  badgeAlert,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
  badgeAlert?: boolean;
}) {
  return (
    <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 420, damping: 28 }}>
      <Link
        href={href}
        className={`group relative mb-1 flex items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-[13px] transition-colors ${
          active
            ? "bg-gradient-to-r from-cap-teal/25 to-transparent font-medium text-white shadow-inner shadow-black/10 ring-1 ring-cap-teal/35"
            : "font-normal text-white/65 hover:bg-white/[0.07] hover:text-white"
        }`}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-y-1 left-0 w-1 rounded-full bg-gradient-to-b from-cap-teal to-brand-teal-bright"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        <Icon
          className={`relative z-[1] h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${
            active ? "text-teal-200" : "opacity-75"
          }`}
          strokeWidth={1.85}
          aria-hidden
        />
        <span className="relative z-[1] min-w-0 flex-1 truncate">{label}</span>
        {badge != null && badge > 0 && (
          <span
            className={`relative z-[1] ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-sm ${
              badgeAlert ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-cap-teal to-emerald-600"
            }`}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    </motion.div>
  );
}

export default function DashboardSidebar({
  userName,
  userRoleLabel,
  initials,
  navPrincipal,
  navGestion,
}: {
  userName: string;
  userRoleLabel: string;
  initials: string;
  navPrincipal: SidebarNavItem[];
  navGestion: SidebarNavItem[];
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-gradient-to-b from-[#0c2238] via-cap-navy to-[#0a1e32] shadow-[4px_0_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur-xl md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:w-[260px] md:min-w-[260px] md:border-b-0 md:border-r md:border-white/10">
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cap-teal via-emerald-500 to-cap-navy text-[15px] font-bold tracking-tight text-white shadow-lg shadow-cap-teal/25 ring-1 ring-white/20">
          CA
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug tracking-tight text-white">Central de Aires</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/45">del Pacífico Ltda.</p>
        </div>
      </div>

      <div className="mx-4 mb-2 mt-4 flex items-center gap-2.5 rounded-xl border border-cap-teal/30 bg-cap-teal/15 px-3.5 py-2 shadow-inner shadow-black/10 backdrop-blur-sm">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-teal-bright shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
        </span>
        <span className="text-[11px] font-bold tracking-[0.2em] text-teal-100/95">AMELIA IA</span>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-3 pb-3 pt-1">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">Principal</p>
        {navPrincipal.map((item) => (
          <NavRow
            key={`${item.href}-${item.label}`}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.badge}
            badgeAlert={item.badgeAlert}
            active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))}
          />
        ))}

        {navGestion.length > 0 && (
          <>
            <p className="mt-4 px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
              Gestión
            </p>
            {navGestion.map((item) => (
              <NavRow
                key={`${item.href}-${item.label}-g`}
                href={item.href}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                badgeAlert={item.badgeAlert}
                active={
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
                }
              />
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-white/[0.07] px-3 py-4">
        <div className="flex w-full cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.07]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cap-teal to-cap-navy text-[12px] font-semibold text-white shadow-md ring-2 ring-white/10">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{userName}</div>
            <div className="truncate text-xs text-white/45">{userRoleLabel}</div>
          </div>
          <MoreHorizontal className="h-4 w-4 shrink-0 text-white/35" aria-hidden />
        </div>
      </div>
    </aside>
  );
}

export function buildSidebarNav(
  rol: string | undefined,
  otsPendientes: number,
  equiposEnFallo: number
): { principal: SidebarNavItem[]; gestion: SidebarNavItem[] } {
  if (rol === "cliente") {
    return {
      principal: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/equipos", label: "Equipos", icon: Wind, badge: equiposEnFallo || undefined, badgeAlert: true },
      ],
      gestion: [],
    };
  }

  if (rol === "admin") {
    return {
      principal: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        {
          href: "/ots/nueva",
          label: "Órdenes de Trabajo",
          icon: ClipboardList,
          badge: otsPendientes || undefined,
        },
        {
          href: "/equipos",
          label: "Equipos",
          icon: Wind,
          badge: equiposEnFallo || undefined,
          badgeAlert: equiposEnFallo > 0,
        },
      ],
      gestion: [
        { href: "/preventivo", label: "Mantenimientos", icon: CalendarDays },
        { href: "/diagnostico", label: "Reportes", icon: BarChart3 },
        { href: "/camara", label: "Cámara", icon: Camera },
        { href: "/chat", label: "Chat IA", icon: MessageCircle },
      ],
    };
  }

  return {
    principal: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        href: "/ots/nueva",
        label: "Órdenes de Trabajo",
        icon: ClipboardList,
        badge: otsPendientes || undefined,
      },
      {
        href: "/equipos",
        label: "Equipos",
        icon: Wind,
        badge: equiposEnFallo || undefined,
        badgeAlert: equiposEnFallo > 0,
      },
    ],
    gestion: [
      { href: "/preventivo", label: "Mantenimientos", icon: CalendarDays },
      { href: "/correctivo", label: "Correctivo", icon: ClipboardList },
      { href: "/chat", label: "Chat", icon: MessageCircle },
      { href: "/camara", label: "Cámara", icon: Camera },
    ],
  };
}
