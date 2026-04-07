"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import { authRegister } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function RegistroPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr("Mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await authRegister(nombre, email, password);
      setAuth(res.access_token, res.user);
      router.replace("/");
    } catch (e) {
      setErr(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8 py-12">
      <div className="flex flex-col items-center text-center">
        <BrandLogo size={52} variant="light" className="mb-4 justify-center" />
        <h1 className="text-xl font-bold text-brand-navy dark:text-slate-100">Crear cuenta técnico</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Equipos y trazabilidad por activo
        </p>
      </div>
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="glass-panel space-y-4 p-8"
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase text-brand-teal dark:text-brand-teal-bright">
            Nombre
          </span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-teal-200/80 bg-white/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-brand-teal dark:text-brand-teal-bright">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-teal-200/80 bg-white/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-brand-teal dark:text-brand-teal-bright">
            Contraseña
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-teal-200/80 bg-white/80 px-4 py-3 dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal py-3 font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {loading ? "Creando…" : "Registrarse"}
        </button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-navy underline dark:text-brand-cyan">
            Entrar
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
