"use client";

import type { ReactNode } from "react";

/** Formatea respuestas tipo lista / negritas simples sin markdown completo. */
export default function ChatMessageBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listBuf: string[] = [];
  let key = 0;

  function flushList() {
    if (!listBuf.length) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="mt-2 list-none space-y-1.5 pl-0">
        {listBuf.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-brand-navy to-brand-teal"
              aria-hidden
            />
            <span>{formatInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = /^[-•·*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    if (isBullet) {
      const item = trimmed.replace(/^[-•·*]\s+/, "").replace(/^\d+\.\s+/, "");
      listBuf.push(item);
      continue;
    }
    flushList();
    if (!trimmed) {
      blocks.push(<div key={`br-${key++}`} className="h-2" />);
      continue;
    }
    if (trimmed.startsWith("```")) {
      blocks.push(
        <pre
          key={`pre-${key++}`}
          className="mt-2 overflow-x-auto rounded-xl border border-teal-200/60 bg-brand-navy/5 p-3 font-mono text-xs text-brand-navy"
        >
          {trimmed.replace(/^```\w*/, "").replace(/```$/, "")}
        </pre>
      );
      continue;
    }
    blocks.push(
      <p
        key={`p-${key++}`}
        className="text-sm leading-relaxed text-brand-navy dark:text-slate-50"
      >
        {formatInline(trimmed)}
      </p>
    );
  }
  flushList();

  return <div className="space-y-1">{blocks}</div>;
}

function formatInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <strong key={i} className="font-semibold text-brand-navy">
          {m[1]}
        </strong>
      );
    }
    return part;
  });
}
