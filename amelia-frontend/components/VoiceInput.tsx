"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

type Props = {
  value: string;
  onChange: (text: string) => void;
  className?: string;
  label?: string;
};

/** Web Speech API — Chrome / Edge; Safari iOS con permiso de micrófono. */
export default function VoiceInput({ value, onChange, className = "", label }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const W = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    setSupported(!!SR);
    if (!SR) return;
    const r = new SR();
    r.lang = "es-ES";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (ev: SpeechRecognitionEvent) => {
      const t = Array.from(ev.results)
        .map((x) => x[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!t) return;
      const prev = valueRef.current.trim();
      onChangeRef.current(prev ? `${prev} ${t}` : t);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recRef.current = r;
    return () => {
      try {
        r.stop();
      } catch {
        /* noop */
      }
      recRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const r = recRef.current;
    if (!r) return;
    if (listening) {
      r.stop();
      setListening(false);
      return;
    }
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [listening]);

  if (!supported) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {label ? `${label} — ` : ""}Dictado no disponible en este navegador.
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {label && <span className="text-sm font-medium text-brand-navy dark:text-slate-200">{label}</span>}
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex min-h-[48px] min-w-[48px] items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition ${
          listening ? "bg-red-600 ring-2 ring-red-300" : "bg-gradient-to-r from-brand-navy to-brand-teal"
        }`}
        aria-pressed={listening}
      >
        {listening ? <MicOff className="h-5 w-5 shrink-0" /> : <Mic className="h-5 w-5 shrink-0" />}
        {listening ? "Detener" : "Dictar"}
      </button>
    </div>
  );
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: ArrayLike<{ 0: { transcript: string } }>;
}
