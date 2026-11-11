import { ArrowLeft, BookOpen, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Topic landing page: header with a progress ring, a "Continue" action, and the subtopics
 * as one grouped list (grouped by `subtopic.group` when present).
 *
 * Adjust the three imports/types below to match your project:
 *   - `Topic` / `Subtopic` types (use whatever your data file exports)
 *   - `topic.icon` (assumed to be a lucide component, like the `Icon` in your sidebar)
 */
import type { Subtopic, Topic } from "@/lib/topics";

function ProgressRing({ value, size = 68 }: { value: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0 text-primary"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(value * 100)} percent complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums text-foreground">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function TopicLanding({
  topic,
  completed,
  progressKey,
  onSelect,
  onBack,
}: {
  topic: Topic;
  completed: Set<string>;
  progressKey: (topicSlug: string, subSlug: string) => string;
  onSelect: (topic: Topic, sub: Subtopic) => void;
  onBack: () => void;
}) {
  const Icon = topic.icon ?? BookOpen;
  const isDone = (s: Subtopic) => completed.has(progressKey(topic.slug, s.slug));
  const total = topic.subtopics.length;
  const doneCount = topic.subtopics.filter(isDone).length;
  const next = topic.subtopics.find((s) => !isDone(s));
  const allDone = total > 0 && doneCount === total;

  // keep the original order, bucket by group
  const groups: { name: string; items: Subtopic[] }[] = [];
  for (const s of topic.subtopics) {
    const name = s.group ?? "";
    const g = groups.find((x) => x.name === name);
    if (g) g.items.push(s);
    else groups.push({ name, items: [s] });
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-10 lg:px-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 mb-8 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Dashboard
      </Button>

      <header className="flex items-center gap-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-primary">
          <Icon className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight">{topic.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "subtopic" : "subtopics"}, {doneCount} completed
          </p>
        </div>
        <ProgressRing value={total ? doneCount / total : 0} />
      </header>

      {total > 0 && (
        <div className="mt-7">
          <Button onClick={() => onSelect(topic, next ?? topic.subtopics[0])} className="gap-2 rounded-full px-5">
            {allDone ? "Review from the start" : doneCount === 0 ? "Start learning" : "Continue where you left off"}
            <ChevronRight className="size-4" />
          </Button>
          {next && doneCount > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Up next: {next.title}</p>
          )}
        </div>
      )}

      <div className="mt-10 space-y-8">
        {groups.map((g) => (
          <section key={g.name || "all"}>
            {g.name && (
              <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">{g.name}</h2>
            )}
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border bg-card">
              {g.items.map((s) => {
                const done = isDone(s);
                return (
                  <li key={s.slug}>
                    <button
                      type="button"
                      onClick={() => onSelect(topic, s)}
                      className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span
                        aria-hidden
                        className={`grid size-5 shrink-0 place-items-center rounded-full transition-colors ${
                          done
                            ? "bg-primary text-primary-foreground"
                            : "border-2 border-muted-foreground/30 group-hover:border-primary/60"
                        }`}
                      >
                        {done && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{s.title}</span>
                        {s.description && (
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                            {s.description}
                          </span>
                        )}
                      </span>
                      <span className="sr-only">{done ? "Completed" : "Not completed"}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}