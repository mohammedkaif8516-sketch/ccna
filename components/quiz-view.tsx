"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quiz, QuizQuestion } from "@/lib/quizzes";
import type { QuizScore } from "@/lib/use-quiz-score";

// Length options for each quiz type
const FINAL_LENGTHS = [10, 15, 30] as const;
const GROUP_LENGTHS = [5, 15, 20] as const;

// Minimum question counts to be playable at all
const FINAL_MIN = 30;
const GROUP_MIN = 20;

const AUTO_ADVANCE_MS = 2900;

type Phase = "choose-length" | "answering" | "done";

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizView({
  quiz,
  best,
  onFinish,
  onBack,
}: {
  quiz: Quiz;
  best?: QuizScore;
  onFinish: (score: number, total: number, length: number) => void;
  onBack: () => void;
}) {
  const isFinal = quiz.final === true;
  const lengths = isFinal ? FINAL_LENGTHS : GROUP_LENGTHS;
  const minimum = isFinal ? FINAL_MIN : GROUP_MIN;
  const totalAvailable = quiz.questions.length;
  const underDevelopment = totalAvailable < minimum;

  const [phase, setPhase] = useState<Phase>("choose-length");
  const [length, setLength] = useState<number | null>(null);
  const [pool, setPool] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = pool.length;
  const q = pool[index];
  const answered = picked !== null;

  // Clear any pending auto-advance timer on unmount or when the question changes
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const start = (chosenLength: number) => {
    const shuffled = shuffle(quiz.questions).slice(0, chosenLength);
    setPool(shuffled);
    setLength(chosenLength);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setPhase("answering");
  };

  const next = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setPhase("done");
      if (length) onFinish(score, total, length);
    }
  };

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
    // Auto-advance after 4s
    autoAdvanceRef.current = setTimeout(() => {
      next();
    }, AUTO_ADVANCE_MS);
  };

  const restart = () => {
    // Go back to the length picker
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setPhase("choose-length");
    setLength(null);
    setPool([]);
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  // ─────────────────────────────────────────────────────────────
  // Under-development gate
  // ─────────────────────────────────────────────────────────────
  if (underDevelopment) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {quiz.title}
        </h1>

        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <p className="text-lg font-medium">Under development</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This quiz needs at least {minimum} questions to run.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Currently {totalAvailable} question{totalAvailable === 1 ? "" : "s"} available.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Choose length
  // ─────────────────────────────────────────────────────────────
  if (phase === "choose-length") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {quiz.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {totalAvailable} questions available
          {best && ` · Best score ${best.best}/${best.total}`}
        </p>

        <p className="mt-8 text-sm font-medium">Choose quiz length</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {lengths.map((len) => {
            const disabled = totalAvailable < len;
            return (
              <button
                key={len}
                type="button"
                disabled={disabled}
                onClick={() => start(len)}
                className={`flex flex-col items-center justify-center rounded-xl border px-4 py-6 text-center outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring ${
                  disabled
                    ? "cursor-not-allowed opacity-40"
                    : "hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <span className="text-2xl font-semibold tabular-nums">
                  {len}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  questions
                </span>
                {disabled && (
                  <span className="mt-2 text-[10px] text-muted-foreground/70">
                    not enough available
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Done
  // ─────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {quiz.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {length} questions
        </p>

        <div className="mt-10 rounded-xl border p-8 text-center">
          <p className="text-5xl font-semibold tabular-nums">
            {score}/{total}
          </p>
          <p className="mt-3 text-muted-foreground">
            {score === total
              ? "Perfect. This set is solid."
              : score >= Math.ceil(total * 0.7)
                ? "Good. Review the explanations you missed and retry."
                : "Go back through the notes, then retry."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={restart} className="gap-2">
              <RotateCcw className="size-4" />
              Take again
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to notes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Answering
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-6 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {quiz.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {length} questions
      </p>

      <div className="mt-8">
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>

        <p className="text-xs tabular-nums text-muted-foreground">
          Question {index + 1} of {total}
        </p>
        <h2 className="mt-2 text-lg font-medium leading-7">{q.prompt}</h2>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer;
            const isPicked = i === picked;
            const state = !answered
              ? "hover:bg-accent"
              : isCorrect
                ? "border-primary bg-primary/10"
                : isPicked
                  ? "border-destructive bg-destructive/10"
                  : "opacity-60";
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${state}`}
              >
                <span className="flex-1">{opt}</span>
                {answered && isCorrect && (
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                )}
                {answered && isPicked && !isCorrect && (
                  <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-5 rounded-lg bg-muted/60 p-4 text-sm leading-6">
            <p className="font-medium">
              {picked === q.answer ? "Correct." : "Not quite."}
            </p>
            <p className="mt-1 text-muted-foreground">{q.explanation}</p>
            <Button onClick={next} className="mt-4">
              {index + 1 < total ? "Next question" : "See result"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}