import { Suspense } from "react";
import DashboardClient from "./DashboardClient";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

/**
 * Datos: el JWT está en localStorage (`amelia-auth`), por eso el fetch a
 * `NEXT_PUBLIC_API_URL` se hace en `DashboardClient` (cliente), no en un Server Component.
 * `loading.tsx` muestra el mismo esqueleto al navegar a esta ruta.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}
