"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Folder, FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VisitEntry } from "@/lib/use-visit-history";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  const d = new Date(ms);
  return d.toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────
// Single tree node
// ─────────────────────────────────────────────────────────────

function VisitNode({
  entry,
  index,
  isLast,
  onSelect,
}: {
  entry: VisitEntry;
  index: number;
  isLast: boolean;
  onSelect: () => void;
}) {
  // parent label — group if present, otherwise topic
  const parentLabel = entry.group ?? entry.topicTitle;
  const parentType = entry.group ? "group" : "topic";

  return (
    <div
  className="flex w-full min-w-0 flex-col items-center"
  style={{
    animation: `visitNodeIn 420ms cubic-bezier(0.2, 0.9, 0.3, 1.1) ${index * 90}ms both`,
  }}
>
      {/* Parent chip — group or topic */}
      <div className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] text-muted-foreground">
        {parentType === "group" ? (
          <Folder className="size-3" />
        ) : (
          <FolderTree className="size-3" />
        )}
        <span className="max-w-[240px] truncate">{parentLabel}</span>
      </div>

      {/* Line between parent chip and node */}
      <div
        className="h-4 w-px opacity-60"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--accent), transparent)",
          transformOrigin: "top",
          animation: `visitLineIn 220ms ease-out ${index * 90 + 120}ms both`,
        }}
      />

      {/* Node — clickable subtopic card */}
      <button
  type="button"
  onClick={onSelect}
  className="glass glass-hover group flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
>
  {/* Left icon */}
  <div
    className="flex size-9 shrink-0 items-center justify-center rounded-xl"
    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
  >
    <FileText className="size-4" />
  </div>

  {/* Middle: title + time */}
  <div className="min-w-0 flex-1 overflow-hidden">
    <p className="truncate text-sm font-medium text-foreground">
      {entry.title}
    </p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">
      {relativeTime(entry.lastAt)}
    </p>
  </div>

  {/* Right: count badge + chevron */}
  <div className="flex shrink-0 flex-col items-end gap-1">
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums"
      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
    >
      ×{entry.count ?? 1}
    </span>
    <ChevronRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
  </div>
</button>

      {/* Line to the next node (skip after the last) */}
      {!isLast && (
        <div
          className="h-6 w-px opacity-60"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--accent), transparent)",
            transformOrigin: "top",
            animation: `visitLineIn 220ms ease-out ${index * 90 + 260}ms both`,
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// The tree
// ─────────────────────────────────────────────────────────────

export function VisitTree({
  entries,
  onSelect,
  onClear,
}: {
  entries: VisitEntry[];
  onSelect: (entry: VisitEntry) => void;
  onClear: () => void;
}) {
  const [visible, setVisible] = useState(entries.length);

  // When new entries arrive, only animate the new ones, not the whole tree
  useEffect(() => {
    // reset animation counter so new nodes animate in
    setVisible(entries.length);
  }, [entries.length]);

  // Nothing to show → the empty-state is rendered by the caller
  if (entries.length === 0) return null;

  return (
  <div className="flex w-full min-w-0 flex-col items-center">
      <div className="mb-8 flex w-full items-center justify-between gap-4">
        <div>
          <h2
            className="bg-clip-text text-lg font-semibold tracking-tight text-transparent"
            style={{
              backgroundImage: "linear-gradient(to right, #6366f1, #22d3ee)",
            }}
          >
            Your recent study path
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Most recent at the top · {entries.length}{" "}
            {entries.length === 1 ? "subtopic" : "subtopics"} visited
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear history
        </Button>
      </div>

      <div className="flex flex-col items-center pb-4">
        {entries.map((entry, i) => (
          <VisitNode
            key={`${entry.slug}-${i}`}
            entry={entry}
            index={i}
            isLast={i === entries.length - 1}
            onSelect={() => onSelect(entry)}
          />
        ))}
      </div>
    </div>
  );
}
