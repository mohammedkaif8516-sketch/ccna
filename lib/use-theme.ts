"use client";

import { useCallback, useSyncExternalStore } from "react";

export const THEME_KEY = "ccna:theme";
type Theme = "light" | "dark";

const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}

function subscribe(onChange: () => void) {
  // Re-render whenever the <html> class changes (toggle in this tab)
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

const getSnapshot = () => document.documentElement.classList.contains("dark");
// Must match DEFAULT_THEME in layout.tsx
const getServerSnapshot = () => true;

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((theme: Theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* private mode / storage blocked: theme still applies for this session */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setTheme]);

  return { dark, setTheme, toggleTheme };
}
