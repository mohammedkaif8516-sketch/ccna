"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ccna-auto-next-v1";

export function useAutoNext() {
  const [enabled, setEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "off") setEnabled(false);
      else if (raw === "on") setEnabled(true);
      // if missing, keep default (true)
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { enabled, toggle };
}