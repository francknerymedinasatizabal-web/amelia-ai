"use client";

import { useEffect, type ReactNode } from "react";

const STORAGE = "amelia-theme";

export function initThemeFromStorage() {
  if (typeof document === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE);
    const root = document.documentElement;
    if (saved === "dark" || saved === "light") {
      root.classList.toggle("dark", saved === "dark");
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    }
  } catch {
    /* ignore */
  }
}

export function setTheme(mode: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  try {
    localStorage.setItem(STORAGE, mode);
  } catch {
    /* ignore */
  }
}

export function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initThemeFromStorage();
  }, []);
  return children;
}
