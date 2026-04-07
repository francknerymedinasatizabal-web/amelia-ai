"use client";

/**
 * Lockup corporativo Central de Aires del Pacífico + producto Amelia.
 * Coloca `public/brand/cap-logo.png` para usar el logo oficial; si no existe, se muestra el monograma vectorial.
 */
import Image from "next/image";
import { useCallback, useState } from "react";

const PNG = "/brand/cap-logo.png";

function Monogram({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="capNavGrad" x1="8" y1="4" x2="36" y2="36">
          <stop stopColor="#0f2744" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#capNavGrad)" />
      <path
        d="M12 28V12h4.2c3.1 0 5.3 2 5.3 4.9 0 2.9-2.2 4.9-5.3 4.9H14.8V28H12zm4.2-9.6c1.4 0 2.4-.9 2.4-2.3 0-1.4-1-2.3-2.4-2.3h-1.5v4.6h1.5z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M24.5 12l5.5 16h-2.8l-1.2-3.7h-5.5L19.3 28h-2.8l5.5-16h2.5zm-.3 9.2L25.8 16l-1.6 5.2h3z"
        fill="#5eead4"
      />
    </svg>
  );
}

type Props = {
  /** Tamaño del icono / logo en px (altura aprox.) */
  size?: number;
  className?: string;
  /** Mostrar bloque de texto junto al logo */
  showText?: boolean;
  /** `nav`: texto claro (barra superior). `light`: texto corporativo en fondos claros. */
  variant?: "nav" | "light";
};

export default function BrandLogo({
  size = 36,
  className = "",
  showText = true,
  variant = "nav",
}: Props) {
  const [useFallback, setUseFallback] = useState(false);

  const onError = useCallback(() => setUseFallback(true), []);

  const titleClass =
    variant === "nav"
      ? "text-white"
      : "text-brand-navy dark:text-slate-100";
  const subClass =
    variant === "nav"
      ? "text-teal-200/90"
      : "text-brand-teal dark:text-brand-teal-bright";

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {!useFallback ? (
          <Image
            src={PNG}
            alt="Central de Aires del Pacífico"
            width={size}
            height={size}
            className="h-full w-full object-contain"
            onError={onError}
            priority
          />
        ) : (
          <Monogram className="h-full w-full" />
        )}
      </div>
      {showText && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className={`truncate text-sm font-bold tracking-tight ${titleClass}`}>Amelia</span>
          <span className={`truncate text-[10px] font-medium ${subClass}`}>
            Central de Aires del Pacífico
          </span>
        </div>
      )}
    </div>
  );
}
