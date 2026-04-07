import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "@/components/AuthGate";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Amelia — Central de Aires del Pacífico",
  description:
    "Mantenimiento HVAC: diagnóstico, chat técnico y análisis por imagen — Central de Aires del Pacífico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-300">
        <ThemeProvider>
          <AuthGate>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8 pb-16">{children}</main>
          </AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
