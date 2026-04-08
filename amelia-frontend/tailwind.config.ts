import type { Config } from "tailwindcss";

/** Central de Aires del Pacífico — navy + teal corporativo */
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Mapea --navy, --teal, --bg (no pisar la escala `teal` de Tailwind) */
        cap: {
          navy: "var(--navy)",
          teal: "var(--teal)",
          bg: "var(--bg)",
        },
        brand: {
          navy: "#0f2744",
          "navy-deep": "#071a2e",
          teal: "#0d9488",
          "teal-bright": "#14b8a6",
          cyan: "#22d3ee",
        },
      },
    },
  },
  plugins: [],
};

export default config;
