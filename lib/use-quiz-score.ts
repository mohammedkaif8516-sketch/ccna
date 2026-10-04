"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ccna-quiz-scores-v1";

export type QuizScore = {
  best: number;
  total: number;
  attempts: number;
  lastAt: number;
};

function readAll(): Record<string, QuizScore> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, QuizScore>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, QuizScore>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable (private browsing, quota) — fail silently
  }
}

export function useQuizScores() {
  const [scores, setScores] = useState<Record<string, QuizScore>>({});

  // Populate from localStorage after mount (avoids SSR/window mismatch).
  useEffect(() => {
    setScores(readAll());
  }, []);

  const bestFor = useCallback(
    (quizId: string): QuizScore | undefined => scores[quizId],
    [scores],
  );

  const saveScore = useCallback(
    (quizId: string, score: number, total: number) => {
      setScores((prev) => {
        const existing = prev[quizId];
        const next: Record<string, QuizScore> = {
          ...prev,
          [quizId]: {
            best: Math.max(existing?.best ?? 0, score),
            total,
            attempts: (existing?.attempts ?? 0) + 1,
            lastAt: Date.now(),
          },
        };
        writeAll(next);
        return next;
      });
    },
    [],
  );

  return { scores, bestFor, saveScore };
}