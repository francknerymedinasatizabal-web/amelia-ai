"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Moon, Sun } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { getTheme, setTheme } from "@/components/ThemeProvider";
import { useAuthStore } from "@/store/authStore";

const PUBLIC = new Set(["/login", "/registro"]);

type NavItem = { href: string; label: string };

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const links: NavItem[] = useMemo(() => {
    const rol = user?.rol ?? "tecnico";
    if (rol === "admin") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/equipos", label: "Equipos" },
        { href: "/preventivo", label: "Preventivo" },
        { href: "/correctivo", label: "Correctivo" },
        { href: "/chat", label: "Chat" },
        { href: "/camara", label: "Cámara" },
      ];
    }
    if (rol === "cliente") {
      return [
        { href: "/dashboard", label: "Mis equipos" },
        { href: "/equipos", label: "Activos" },
      ];
    }
    return [
      { href: "/dashboard", label: "Inicio" },
      { href: "/equipos", label: "Mis equipos" },
      { href: "/preventivo", label: "Preventivo" },
      { href: "/correctivo", label: "Correctivo" },
      { href: "/chat", label: "Chat" },
      { href: "/camara", label: "Cámara" },
    ];
  }, [user?.rol]);

  useEffect(() => {
    setDark(getTheme() === "dark");
  }, []);

  function toggleTheme() {
    const next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    setDark(next === "dark");
  }

  const isPublic = PUBLIC.has(pathname);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link
          href={token ? "/dashboard" : "/login"}
          className="group flex min-w-0 items-center gap-2 font-semibold text-white transition duration-300 hover:text-brand-cyan"
        >
          <BrandLogo size={34} variant="nav" />
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!isPublic && token && (
            <nav className="flex max-w-[72vw] flex-wrap items-center gap-1 sm:gap-2">
              {links.map(({ href, label }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
                return (
                  <Link key={href} href={href}>
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className={`inline-block rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ${
                        active
                          ? "bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-lg ring-1 ring-white/15"
                          : "text-teal-100/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {label}
                    </motion.span>
                  </Link>
                );
              })}
            </nav>
          )}
          {!isPublic && token && user && (
            <span className="hidden max-w-[120px] truncate text-xs text-teal-100/90 sm:inline">
              {user.nombre}
            </span>
          )}
          {!isPublic && token && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="flex h-9 items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2 text-xs font-medium text-white transition hover:bg-white/20"
              title="Salir"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            aria-label={dark ? "Modo claro" : "Modo oscuro"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
