"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "ccna-completed-v1";
const THEME_KEY = "ccna:theme";

export function progressKey(topicSlug: string, subtopicSlug: string) {
  return `${topicSlug}::${subtopicSlug}`;
}

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeStorage(set: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // storage unavailable (private browsing, quota) — fail silently
  }
}

export function useCompletedTopics() {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  // Populate from localStorage after mount (avoids SSR/window mismatch).
  useEffect(() => {
    setCompleted(readStorage());
  }, []);

  const isCompleted = useCallback(
    (key: string) => completed.has(key),
    [completed],
  );

  const toggle = useCallback((key: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeStorage(next);
      return next;
    });
  }, []);

  return { completed, isCompleted, toggle };
}

// ─────────────────────────────────────────────────────────────
// Theme (light / dark) — class-based, persisted in localStorage
// Same API as before: { dark, toggle }
// ─────────────────────────────────────────────────────────────
type Theme = "light" | "dark";

const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  // keep in sync with the inline value set by the script in layout.tsx
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}

function subscribeTheme(onChange: () => void) {
  // Re-render when the <html> class changes
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Sync when another tab changes the theme
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY && (e.newValue === "light" || e.newValue === "dark")) {
      applyTheme(e.newValue);
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

const getThemeSnapshot = () =>
  document.documentElement.classList.contains("dark");
// Must match DEFAULT_THEME in layout.tsx (true = dark)
const getThemeServerSnapshot = () => true;

export function useTheme() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage unavailable — fail silently
    }
  }, []);

  return { dark, toggle, toggleTheme: toggle };
}
