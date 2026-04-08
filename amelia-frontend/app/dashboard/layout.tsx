/**
 * A ancho completo respecto al `main` con max-w-6xl: el panel queda alineado al viewport.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 -ml-[50vw] w-screen max-w-[100vw] overflow-x-hidden">{children}</div>
  );
}
