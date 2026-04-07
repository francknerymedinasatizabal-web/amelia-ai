import { create } from "zustand";
import { persist } from "zustand/middleware";
import { historial as fetchHistorial, type Mantenimiento } from "@/lib/api";

type DiagnosticoMeta = {
  fuente: string;
  ms: number;
  at: number;
};

/** Contexto de campo para chat / continuidad (último análisis). */
export type CampoContext = {
  equipo: string;
  problema: string;
  resumenDiagnostico: string;
  fuente: string;
  at: number;
};

type AmeliaState = {
  historial: Mantenimiento[];
  historialLoading: boolean;
  historialError: string | null;
  loadHistorial: (equipoId?: number) => Promise<void>;

  diagnosticoLoading: boolean;
  setDiagnosticoLoading: (v: boolean) => void;
  lastDiagnosticoMeta: DiagnosticoMeta | null;
  setLastDiagnosticoMeta: (m: DiagnosticoMeta | null) => void;

  campoContext: CampoContext | null;
  setCampoContext: (c: CampoContext | null) => void;
};

export const useAmeliaStore = create<AmeliaState>()(
  persist(
    (set) => ({
      historial: [],
      historialLoading: false,
      historialError: null,

      loadHistorial: async (equipoId?: number) => {
        set({ historialLoading: true, historialError: null });
        try {
          const data = await fetchHistorial(equipoId);
          set({ historial: data, historialLoading: false });
        } catch (e) {
          set({
            historialError: String((e as Error).message || e),
            historialLoading: false,
          });
        }
      },

      diagnosticoLoading: false,
      setDiagnosticoLoading: (v) => set({ diagnosticoLoading: v }),

      lastDiagnosticoMeta: null,
      setLastDiagnosticoMeta: (m) => set({ lastDiagnosticoMeta: m }),

      campoContext: null,
      setCampoContext: (c) => set({ campoContext: c }),
    }),
    {
      name: "amelia-store",
      partialize: (s) => ({
        campoContext: s.campoContext,
      }),
    }
  )
);
