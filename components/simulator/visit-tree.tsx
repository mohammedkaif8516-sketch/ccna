"use client";

import { ChevronRight, Folder, FolderTree, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VisitEntry } from "@/lib/use-visit-history";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "Today", "Yesterday", weekday for the last week, otherwise a date */
function dayLabel(ms: number): string {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(ms)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(ms).toLocaleDateString(undefined, { weekday: "long" });
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────
// One visited subtopic
// ─────────────────────────────────────────────────────────────

function VisitNode({
  entry,
  delay,
  latest,
  onSelect,
}: {
  entry: VisitEntry;
  delay: number;
  latest: boolean;
  onSelect: () => void;
}) {
  const parentLabel = entry.group ?? entry.topicTitle;
  const ParentIcon = entry.group ? Folder : FolderTree;
  const count = entry.count ?? 1;

  return (
    <li
      className="relative min-w-0 pl-8"
      style={{ animation: `visitNodeIn 360ms cubic-bezier(0.2, 0.9, 0.3, 1.1) ${delay}ms both` }}
    >
      {/* dot on the timeline rail; the newest visit is the one filled dot */}
      <span
        aria-hidden
        className={`absolute left-[7px] top-[21px] size-[9px] rounded-full border-2 border-background ${
          latest ? "bg-primary ring-4 ring-primary/15" : "bg-muted-foreground/40"
        }`}
      />

      <button
        type="button"
        onClick={onSelect}
        className="glass glass-hover group flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            <ParentIcon className="size-3 shrink-0" />
            <span className="truncate">{parentLabel}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {count > 1 && (
            <span
              title={`Opened ${count} times`}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              ×{count}
            </span>
          )}
          <span className="text-[11px] tabular-nums text-muted-foreground">{relativeTime(entry.lastAt)}</span>
          <ChevronRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </div>
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// The timeline
// ─────────────────────────────────────────────────────────────

export function VisitTree({
  entries: rawEntries,
  onSelect,
  onClear,
}: {
  entries: VisitEntry[];
  onSelect: (entry: VisitEntry) => void;
  onClear: () => void;
}) {
  // Hide any summary-page entries that were recorded before we stopped
  const entries = rawEntries.filter((e) => !e.slug.startsWith("summary-"));

  // Nothing to show → the empty-state is rendered by the caller
  if (entries.length === 0) return null;

  // bucket by day, keeping the incoming (most recent first) order
  const days: { label: string; items: { entry: VisitEntry; i: number }[] }[] = [];
  entries.forEach((entry, i) => {
    const label = dayLabel(entry.lastAt);
    const last = days[days.length - 1];
    if (last && last.label === label) last.items.push({ entry, i });
    else days.push({ label, items: [{ entry, i }] });
  });

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <header className="mb-8 flex w-full min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">Pick up where you left off</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "subtopic" : "subtopics"} visited, newest first
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="size-3.5" />
          Clear history
        </Button>
      </header>

      <div className="space-y-7 pb-4">
        {days.map((day) => (
          <section key={day.label}>
            <h3 className="mb-3 pl-8 text-xs font-medium text-muted-foreground">{day.label}</h3>
            <ol className="relative space-y-2 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-px before:bg-border">
              {day.items.map(({ entry, i }) => (
                <VisitNode
                  key={`${entry.slug}-${i}`}
                  entry={entry}
                  delay={Math.min(i * 60, 480)}
                  latest={i === 0}
                  onSelect={() => onSelect(entry)}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}