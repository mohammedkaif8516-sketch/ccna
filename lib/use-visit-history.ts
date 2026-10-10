"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ccna-visit-history-v1";
const MAX_ENTRIES = 20;

export type VisitEntry = {
  slug: string;
  topicSlug: string;
  title: string;
  topicTitle: string;
  group?: string;
  count: number;
  lastAt: number;
};

function readAll(): VisitEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VisitEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: VisitEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function useVisitHistory() {
  const [entries, setEntries] = useState<VisitEntry[]>([]);

  useEffect(() => {
    setEntries(readAll());
  }, []);

  const record = useCallback((entry: Omit<VisitEntry, "count" | "lastAt">) => {
    setEntries((prev) => {
      const existingIdx = prev.findIndex((e) => e.slug === entry.slug);
      let next: VisitEntry[];

      if (existingIdx === -1) {
        // new subtopic
        next = [
          { ...entry, count: 1, lastAt: Date.now() },
          ...prev,
        ];
      } else {
        // existing — bump count, update timestamp, move to the front
        const existing = prev[existingIdx];
        const updated: VisitEntry = {
          ...existing,
          // refresh fields in case titles changed
          title: entry.title,
          topicSlug: entry.topicSlug,
          topicTitle: entry.topicTitle,
          group: entry.group,
          count: existing.count + 1,
          lastAt: Date.now(),
        };
        next = [updated, ...prev.slice(0, existingIdx), ...prev.slice(existingIdx + 1)];
      }

      next = next.slice(0, MAX_ENTRIES);
      writeAll(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    writeAll([]);
  }, []);

  return { entries, record, clear };
}