"use client";

import { useCallback, useEffect, useState } from "react";

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
// ─────────────────────────────────────────────────────────────
export function useTheme() {
  const [dark, setDark] = useState(false);

  // Sync from the class that the pre-hydration script already set on <html>.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
      try {
        window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        // storage unavailable — fail silently
      }
      return next;
    });
  }, []);

  return { dark, toggle };
}