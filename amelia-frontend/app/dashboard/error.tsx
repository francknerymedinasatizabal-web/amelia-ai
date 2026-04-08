"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50/90 p-8 text-center dark:border-red-900/40 dark:bg-red-950/50">
      <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Error en el dashboard</h2>
      <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error.message || "Algo salió mal."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-xl bg-cap-navy px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
