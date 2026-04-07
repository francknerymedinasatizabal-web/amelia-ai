"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send } from "lucide-react";
import ChatMessageBody from "@/components/ChatMessageBody";
import { chat as apiChat, type ChatMessage } from "@/lib/api";
import { useAmeliaStore, type CampoContext } from "@/store/useAmeliaStore";
import { useAuthStore } from "@/store/authStore";

const CHIPS = [
  "Presiones R410A en operación normal",
  "Evaporador congelado: causas",
  "Cómo revisar capacitor de arranque",
  "Drenaje tapado: pasos",
  "Compresor arranca y corta seguido",
  "Diferencia R22 vs R410A",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-teal-200/60 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-teal-700/40 dark:bg-slate-900/80">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-brand-navy to-brand-teal text-lg shadow-md">
        🤖
      </span>
      <div>
        <p className="text-sm font-medium text-brand-navy dark:text-slate-100">Amelia está pensando…</p>
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-brand-navy to-brand-teal"
              animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function buildContextoCampo(ctx: CampoContext | null): string | undefined {
  if (!ctx) return undefined;
  return [
    `Contexto automático de campo:`,
    `Equipo referenciado: ${ctx.equipo}.`,
    `Síntoma previo: ${ctx.problema}.`,
    `Resumen último diagnóstico (${ctx.fuente}): ${ctx.resumenDiagnostico.slice(0, 900)}`,
  ].join("\n");
}

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const campoContext = useAmeliaStore((s) => s.campoContext);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Soy **Amelia**, **asistente técnico industrial** HVAC. Pregunta por **presiones**, **eléctrica**, **drenajes**, **gas** o **seguridad** — respuestas cortas y accionables.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollDown();
  }, [messages, loading, scrollDown]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: t };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const payload = next.filter((m) => m.role !== "system");
      const res = await apiChat(
        payload,
        buildContextoCampo(useAmeliaStore.getState().campoContext)
      );
      setMessages((prev) => [...prev, { role: "assistant", content: res.respuesta }]);
    } catch (e) {
      setError(String((e as Error).message || e));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="rounded-2xl border border-white/30 bg-gradient-to-r from-brand-navy to-brand-teal p-6 text-white shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Chat técnico industrial</h1>
        <p className="mt-1 text-sm text-teal-50/95">
          Formato enriquecido · historial recortado a 6 turnos ·{" "}
          {user?.nombre ? (
            <>
              Técnico: <strong>{user.nombre}</strong>
            </>
          ) : (
            "Sesión de técnico"
          )}
        </p>
      </div>

      {campoContext && (
        <div className="mt-4 rounded-2xl border border-teal-200/60 bg-white/50 p-4 text-sm shadow-lg backdrop-blur dark:border-teal-700/40 dark:bg-slate-900/50">
          <p className="font-semibold text-brand-navy dark:text-slate-100">
            Contexto activo del último diagnóstico
          </p>
          <p className="mt-1 text-slate-700 dark:text-slate-300">
            <strong>{campoContext.equipo}</strong> — {campoContext.problema.slice(0, 120)}
            {campoContext.problema.length > 120 ? "…" : ""}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Se envía al backend como contexto de campo (no cuenta como turno de chat).
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {CHIPS.map((c) => (
          <motion.button
            key={c}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => send(c)}
            disabled={loading}
            className="shrink-0 rounded-full border border-teal-200/80 bg-white/70 px-4 py-2 text-xs font-semibold text-brand-navy shadow-md backdrop-blur transition-all duration-300 hover:border-brand-teal hover:shadow-lg disabled:opacity-50"
          >
            {c}
          </motion.button>
        ))}
      </div>

      {error && (
        <p className="mt-2 rounded-2xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-800 shadow-lg backdrop-blur">
          {error}
        </p>
      )}

      <div
        ref={listRef}
        className="mt-4 flex min-h-[420px] flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-white/25 bg-white/30 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.role === "user";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${mine ? "flex-row-reverse" : "flex-row"}`}
              >
                {!mine && (
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal text-white shadow-lg ring-2 ring-white/40">
                    <Bot className="h-5 w-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] shadow">
                      🔧
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 shadow-lg ${
                    mine
                      ? "rounded-br-md bg-gradient-to-r from-brand-navy to-brand-teal text-white"
                      : "rounded-bl-md border border-teal-100/80 bg-white/90 text-brand-navy backdrop-blur dark:border-teal-700/30 dark:bg-slate-900/70 dark:text-slate-50"
                  }`}
                >
                  {mine ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  ) : (
                    <div className="prose-brand">
                      <ChatMessageBody content={m.content} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="mt-4 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="flex-1 rounded-2xl border border-teal-200/80 bg-white/70 px-4 py-3.5 text-brand-navy shadow-inner outline-none backdrop-blur transition focus:ring-2 focus:ring-brand-teal dark:border-teal-700/40 dark:bg-slate-900/60 dark:text-slate-50"
          placeholder={
            user?.nombre ? `${user.nombre}: escribe y Enter…` : "Escribe y pulsa Enter…"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-teal px-6 py-3 font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Enviar
        </motion.button>
      </form>
    </div>
  );
}
