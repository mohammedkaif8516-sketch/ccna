"use client";

import { useState } from "react";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/lib/quizzes";
import type { QuizScore } from "@/lib/use-quiz-scores";

export function QuizView({
  quiz,
  best,
  onFinish,
  onBack,
}: {
  quiz: Quiz;
  best?: QuizScore;
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = quiz.questions.length;
  const q = quiz.questions[index];
  const answered = picked !== null;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setDone(true);
      onFinish(score, total);
    }
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

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
        {total} questions
        {best && ` · Best score ${best.best}/${best.total}`}
      </p>

      {done ? (
        <div className="mt-10 rounded-xl border p-8 text-center">
          <p className="text-5xl font-semibold tabular-nums">
            {score}/{total}
          </p>
          <p className="mt-3 text-muted-foreground">
            {score === total
              ? "Perfect. This group is solid."
              : score >= Math.ceil(total * 0.7)
                ? "Good. Review the explanations you missed and retry."
                : "Go back through the notes in this group, then retry."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={restart} className="gap-2">
              <RotateCcw className="size-4" />
              Retake quiz
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to notes
            </Button>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}