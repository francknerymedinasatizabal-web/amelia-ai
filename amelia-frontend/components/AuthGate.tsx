"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const PUBLIC = new Set(["/login", "/registro"]);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (PUBLIC.has(pathname)) return;
    if (!token) router.replace("/login");
  }, [ready, pathname, token, router]);

  if (!ready && !PUBLIC.has(pathname)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-600 dark:text-slate-400">
        Cargando…
      </div>
    );
  }

  if (!PUBLIC.has(pathname) && !token) {
    return null;
  }

  return children;
}
