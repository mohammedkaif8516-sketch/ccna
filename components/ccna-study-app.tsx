"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCompletedTopics, progressKey, useTheme } from "@/lib/use-completed";
import { useMemo, useState, useTransition } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  topics,
  type Diagram,
  type NoteBlock,
  type Subtopic,
  type Topic,
} from "@/lib/topics";
import {
  Brackets,
  Terminal,
  Route,
  Cable,
  Check,
  ChevronRight,
  ChevronLeft,
  Layers3,
  Menu,
  Moon,
  Network,
  PanelLeft,
  Router,
  ListChecks,
  Sun,
  ArrowLeft,
  ArrowRightLeft
} from "lucide-react";
import { quizById } from "@/lib/quizzes";
import { QuizView } from "@/components/quiz-view";
import { useQuizScores } from "@/lib/use-quiz-score";
import type { QuizScore } from "@/lib/use-quiz-score";
import { quizFor, quizzes, type Quiz } from "@/lib/quizzes";
import { useVisitHistory, type VisitEntry } from "@/lib/use-visit-history";
import { VisitTree } from "@/components/visit-tree";
import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// Helper: convert dotted IP to 32-bit uint and back
// ─────────────────────────────────────────────────────────────

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums.reduce((acc, n) => (acc * 256 + n) >>> 0, 0);
}

function intToIp(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function prefixForHosts(hosts: number): number {
  let needed = 1;
  while (needed < hosts + 2) needed *= 2;
  return 32 - Math.log2(needed);
}

type GroupBlock = {
  name: string | null;
  items: Subtopic[];
  quiz?: Quiz;
};

type Block = {
  label: string;
  requested: number;
  prefix: number;
  blockSize: number;
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  usable: number;
  waste: number;
};

export function SubnetPlanner() {
  const [baseIp, setBaseIp] = useState("192.168.10.0");
  const [baseCidr, setBaseCidr] = useState("24");
  const [needsText, setNeedsText] = useState("35, 40, 50, 45");
  const [mode, setMode] = useState<"vlsm" | "flsm">("vlsm");

  const result = useMemo(() => {
    const baseInt = ipToInt(baseIp);
    const basePrefix = Number(baseCidr);
    if (baseInt === null) return { error: "Enter a valid base IPv4 address." };
    if (!Number.isInteger(basePrefix) || basePrefix < 0 || basePrefix > 32)
      return { error: "CIDR must be a whole number from 0 to 32." };

    const needs = needsText
      .split(/[\s,]+/)
      .map((x) => Number(x))
      .filter((x) => x > 0);
    if (needs.length === 0)
      return { error: "Enter at least one host requirement." };
    if (needs.some((n) => !Number.isInteger(n)))
      return { error: "Host requirements must be whole numbers." };

    const baseMask =
      basePrefix === 0 ? 0 : (0xffffffff << (32 - basePrefix)) >>> 0;
    const parentNetwork = (baseInt & baseMask) >>> 0;
    const parentSize = 2 ** (32 - basePrefix);

    // Sort largest-first for both modes
    const sorted = [...needs].sort((a, b) => b - a);

    // FLSM: everyone gets the prefix the LARGEST requirement needs
    const uniformPrefix = mode === "flsm" ? prefixForHosts(sorted[0]) : null;

    const blocks: Block[] = [];
    let cursor = parentNetwork;
    const parentEnd = parentNetwork + parentSize - 1;

    for (let i = 0; i < sorted.length; i++) {
      const requested = sorted[i];
      const prefix =
        mode === "flsm" ? uniformPrefix! : prefixForHosts(requested);

      if (prefix < basePrefix) {
        return {
          error: `Block ${i + 1} needs ${requested} hosts, which is larger than the /${basePrefix} parent network.`,
        };
      }
      const blockSize = 2 ** (32 - prefix);
      const aligned = Math.ceil(cursor / blockSize) * blockSize;
      const network = aligned;
      const broadcast = network + blockSize - 1;
      if (broadcast > parentEnd) {
        return {
          error: "Not enough space in the parent network for all requirements.",
        };
      }
      const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : blockSize - 2;
      blocks.push({
        label: `N${i + 1}`,
        requested,
        prefix,
        blockSize,
        network,
        broadcast,
        firstHost: prefix >= 31 ? network : network + 1,
        lastHost: prefix >= 31 ? broadcast : broadcast - 1,
        usable,
        waste: usable - requested,
      });
      cursor = broadcast + 1;
    }

    const used = cursor - parentNetwork;
    const free = parentSize - used;

    return {
      error: "",
      basePrefix,
      parentNetwork,
      parentSize,
      blocks,
      used,
      free,
      uniformPrefix,
    };
  }, [baseIp, baseCidr, needsText, mode]);

  const colors = [
    "#1971c2",
    "#2f9e44",
    "#e8590c",
    "#862e9c",
    "#c92a2a",
    "#0c8599",
    "#f08c00",
    "#5f3dc4",
  ];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Subnet planner</CardTitle>
            <CardDescription className="mt-1">
              Enter a base network and how many PCs each subnet needs.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* FLSM / VLSM mode switch */}
        <div className="mb-5 inline-flex rounded-lg border bg-background p-1">
          <button
            type="button"
            onClick={() => setMode("flsm")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "flsm"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            FLSM — fixed size
          </button>
          <button
            type="button"
            onClick={() => setMode("vlsm")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "vlsm"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            VLSM — variable size
          </button>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid gap-4 sm:grid-cols-[1fr_140px_2fr]"
        >
          <label className="text-xs font-medium">
            Base network
            <Input
              value={baseIp}
              onChange={(e) => setBaseIp(e.target.value)}
              className="mt-2 bg-background"
              placeholder="192.168.10.0"
            />
          </label>
          <label className="text-xs font-medium">
            CIDR
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                /
              </span>
              <Input
                value={baseCidr}
                onChange={(e) => setBaseCidr(e.target.value)}
                className="bg-background pl-7"
                inputMode="numeric"
              />
            </div>
          </label>
          <label className="text-xs font-medium">
            Hosts per subnet (comma separated)
            <Input
              value={needsText}
              onChange={(e) => setNeedsText(e.target.value)}
              className="mt-2 bg-background"
              placeholder="35, 40, 50, 45"
            />
          </label>
        </form>

        {result.error && (
          <p role="alert" className="mt-4 text-xs font-medium text-destructive">
            {result.error}
          </p>
        )}

        {!result.error && "blocks" in result && (
          <div className="mt-6 flex flex-col gap-6">
            {/* Mode summary line */}
            <p className="text-xs text-muted-foreground">
              {mode === "flsm" ? (
                <>
                  <span className="font-semibold text-foreground">FLSM:</span>{" "}
                  every subnet gets the same size — /{result.uniformPrefix} —
                  because it fits the largest requirement.
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">VLSM:</span>{" "}
                  each subnet gets the smallest block that fits its own
                  requirement.
                </>
              )}
            </p>

            {/* Horizontal subnet line */}
            <div className="overflow-x-auto rounded-xl border bg-background p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Subnet line — {intToIp(result.parentNetwork)}/
                {result.basePrefix}
              </p>
              <div className="flex min-w-full" style={{ height: 60 }}>
                {result.blocks.map((b, i) => {
                  const widthPct = (b.blockSize / result.parentSize) * 100;
                  return (
                    <div
                      key={b.label}
                      className="relative flex flex-col justify-between border-r last:border-r-0"
                      style={{
                        width: `${widthPct}%`,
                        minWidth: 60,
                        backgroundColor: colors[i % colors.length] + "18",
                        borderColor: colors[i % colors.length],
                        borderTop: `3px solid ${colors[i % colors.length]}`,
                      }}
                    >
                      <div className="flex flex-1 flex-col items-center justify-center px-1 py-2 text-center">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: colors[i % colors.length] }}
                        >
                          {b.label} · /{b.prefix}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {b.requested} PCs
                        </span>
                      </div>
                    </div>
                  );
                })}
                {result.free > 0 && (
                  <div
                    className="relative flex items-center justify-center border-t-[3px] border-t-dashed border-t-muted-foreground/40"
                    style={{
                      width: `${(result.free / result.parentSize) * 100}%`,
                      minWidth: 40,
                    }}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      free ({result.free})
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>{intToIp(result.parentNetwork)}</span>
                <span>
                  {intToIp(result.parentNetwork + result.parentSize - 1)}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Block</th>
                    <th className="px-3 py-2 text-left font-medium">Needs</th>
                    <th className="px-3 py-2 text-left font-medium">Prefix</th>
                    <th className="px-3 py-2 text-left font-medium">Size</th>
                    <th className="px-3 py-2 text-left font-medium">Network</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Host range
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Broadcast
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Waste</th>
                  </tr>
                </thead>
                <tbody>
                  {result.blocks.map((b, i) => (
                    <tr key={b.label} className="border-t">
                      <td
                        className="px-3 py-2 font-semibold"
                        style={{ color: colors[i % colors.length] }}
                      >
                        {b.label}
                      </td>
                      <td className="px-3 py-2">{b.requested}</td>
                      <td className="px-3 py-2 font-mono">/{b.prefix}</td>
                      <td className="px-3 py-2 font-mono">{b.blockSize}</td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(b.network)}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(b.firstHost)} – {intToIp(b.lastHost)}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(b.broadcast)}
                      </td>
                      <td className="px-3 py-2 font-mono">{b.waste}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Allocated {result.used} of {result.parentSize} addresses ·{" "}
              {result.free} still free.
              {mode === "flsm"
                ? " FLSM wastes more addresses when requirements differ in size."
                : " Blocks are sorted largest-first so smaller subnets pack into the gaps."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const iconMap = {
  network: Network,
  layers: Layers3,
  cable: Cable,
  router: Router,
  brackets: Brackets,
  terminal: Terminal,
  route: Route,
  'arrow-right-left': ArrowRightLeft,
};

function SquareLoader() {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2.5 animate-pulse rounded-[3px] bg-primary"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function DiagramLightbox({
  diagram,
  onClose,
}: {
  diagram: Diagram | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!diagram) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [diagram, onClose]);

  if (!diagram) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={diagram.alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm sm:p-8"
    >
      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-4">
          <img
            src={diagram.src}
            alt={diagram.alt}
            className="max-h-[80vh] w-auto max-w-full object-contain"
          />
        </div>
        {diagram.caption && (
          <figcaption className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
            {diagram.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

function groupSubtopicsWithQuiz(
  subtopics: Subtopic[],
  topicSlug: string,
): GroupBlock[] {
  const groups: GroupBlock[] = [];

  // Merge by name regardless of position. Map preserves insertion order.
  const byName = new Map<string | null, GroupBlock>();
  for (const s of subtopics) {
    const name = s.group ?? null;
    let group = byName.get(name);
    if (!group) {
      group = { name, items: [] };
      byName.set(name, group);
      groups.push(group); // insertion order = first appearance
    }
    group.items.push(s);
  }

  // Attach group quizzes
  for (const group of groups) {
    if (!group.name) continue;
    const q = quizFor(topicSlug, group.name);
    if (q) group.quiz = q;
  }

  const hasGroups = subtopics.some((s) => s.group != null);
  const finalQuiz = quizzes.find(
    (q) => q.topicSlug === topicSlug && q.final === true,
  );

  if (
    !hasGroups &&
    !finalQuiz &&
    groups.length === 1 &&
    groups[0].name === null
  ) {
    const topicWideQuiz = quizFor(topicSlug, null);
    if (topicWideQuiz) groups[0].quiz = topicWideQuiz;
  }

  if (!hasGroups && finalQuiz) {
    groups.push({ name: null, items: [], quiz: finalQuiz });
  }

  return groups;
}

function Sidebar({
  selected,
  selectedQuizId,
  onSelect,
  onSelectQuiz,
  completed,
  bestFor,
  mobile = false,
}: {
  selected?: string;
  selectedQuizId?: string;
  onSelect: (topic: Topic, subtopic: Subtopic) => void;
  onSelectQuiz: (quizId: string) => void;
  completed: Set<string>;
  bestFor: (quizId: string) => QuizScore | undefined;
  mobile?: boolean;
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Find which topic contains the currently selected subtopic
  const topicWithActive = useMemo(() => {
    if (!selected) return null;
    for (const topic of topics) {
      if (topic.subtopics.some((s) => s.slug === selected)) return topic.slug;
    }
    return null;
  }, [selected]);

  // Controlled accordion state — all topics open by default
  const [openTopics, setOpenTopics] = useState<string[]>(() =>
    topics.map((t) => t.slug),
  );

  // Whenever the active topic changes, make sure it's expanded
  useEffect(() => {
    if (!topicWithActive) return;
    setOpenTopics((prev) =>
      prev.includes(topicWithActive) ? prev : [...prev, topicWithActive],
    );
  }, [topicWithActive]);

  // After mount / when active changes / when topics expand → scroll active into view
  useEffect(() => {
    if (!mobile) return;
    if (!selected) return;
    const container = scrollRef.current;
    if (!container) return;

    let attempts = 0;
    let raf = 0;

    const tryScroll = () => {
      attempts++;
      const el = activeRef.current;
      if (el && el.offsetParent !== null) {
        // The target is now in the DOM and visible. Scroll it to the middle
        // of the container using its bounding box so nested offsets are correct.
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const target =
          container.scrollTop +
          (elRect.top - containerRect.top) -
          container.clientHeight / 2 +
          elRect.height / 2;
        container.scrollTo({
          top: Math.max(0, target),
          behavior: "instant" as ScrollBehavior,
        });
        return;
      }
      if (attempts < 10) {
        raf = requestAnimationFrame(tryScroll);
      }
    };

    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [selected, mobile]);

  return (
    <aside
      className={
        mobile
          ? "flex h-full flex-col bg-background"
          : "hidden h-full w-72 shrink-0 flex-col border-r bg-sidebar/40 lg:flex"
      }
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Curriculum
        </p>
        <Accordion
          type="multiple"
          value={openTopics}
          onValueChange={setOpenTopics}
          className="w-full"
        >
          {topics.map((topic) => {
            const Icon = iconMap[topic.icon as keyof typeof iconMap] ?? Network;
            const doneCount = topic.subtopics.filter((s) =>
              completed.has(progressKey(topic.slug, s.slug)),
            ).length;
            const totalCount = topic.subtopics.length;
            const topicPercent =
              totalCount === 0 ? 0 : (doneCount / totalCount) * 100;
            return (
              <div key={topic.slug} className="relative pl-2">
                <div className="absolute left-0 top-0 h-full w-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`w-full transition-all duration-300 ${
                      topicPercent === 100 ? "bg-primary" : "bg-primary/60"
                    }`}
                    style={{ height: `${topicPercent}%` }}
                  />
                </div>
                <AccordionItem value={topic.slug} className="border-b-0">
                  <AccordionTrigger className="rounded-md px-3 py-2.5 text-left text-xs font-medium hover:bg-accent hover:no-underline [&>svg]:size-3.5">
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{topic.title}</span>
                      <span className="shrink-0 text-[10px] font-normal tabular-nums text-muted-foreground">
                        {doneCount}/{totalCount}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-0">
                    <div className="ml-5 border-l pl-3">
                      {groupSubtopicsWithQuiz(topic.subtopics, topic.slug).map(
                        (group, gi) => {
                          const groupDone = group.items.filter((s) =>
                            completed.has(progressKey(topic.slug, s.slug)),
                          ).length;
                          const isQuizActive =
                            group.quiz?.id === selectedQuizId;
                          const score = group.quiz
                            ? bestFor(group.quiz.id)
                            : undefined;

                          return (
                            <div
                              key={`${group.name ?? "tail"}-${gi}`}
                              className={group.name && gi > 0 ? "mt-3" : ""}
                            >
                              {group.name && (
                                <p className="flex items-center justify-between px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                                  <span>{group.name}</span>
                                  <span className="font-normal tabular-nums">
                                    {groupDone}/{group.items.length}
                                  </span>
                                </p>
                              )}

                              {group.items.map((subtopic, index) => {
                                const isActive = selected === subtopic.slug;
                                const isDone = completed.has(
                                  progressKey(topic.slug, subtopic.slug),
                                );
                                return (
                                  <button
                                    key={`${subtopic.slug}-${index}`}
                                    ref={isActive ? activeRef : null}
                                    onClick={() => onSelect(topic, subtopic)}
                                    className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-xs leading-4 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring ${
                                      isActive
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    }`}
                                  >
                                    <ChevronRight
                                      className={`mt-0.5 size-3 shrink-0 ${
                                        isActive ? "text-primary" : "opacity-50"
                                      }`}
                                    />
                                    <span className="flex-1">
                                      {subtopic.title}
                                    </span>
                                    {isDone && (
                                      <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                                    )}
                                  </button>
                                );
                              })}

                              {group.quiz && (
                                <button
                                  ref={isQuizActive ? activeRef : null}
                                  onClick={() => onSelectQuiz(group.quiz!.id)}
                                  className={`mt-1 flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-xs leading-4 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring ${
                                    isQuizActive
                                      ? "bg-primary/10 font-medium text-primary"
                                      : "text-foreground/80 hover:bg-accent"
                                  }`}
                                >
                                  <ListChecks className="mt-0.5 size-3 shrink-0 text-primary" />
                                  <span className="flex-1 font-medium">
                                    Quiz
                                  </span>
                                  <span className="mt-px shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                    {score
                                      ? `${score.best}/${score.total}`
                                      : "Not taken"}
                                  </span>
                                </button>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </div>
            );
          })}
        </Accordion>
      </div>
    </aside>
  );
}

type DiagramSlotProps = {
  diagram: {
    src: string;
    alt: string;
    caption?: string;
    placeholder?: boolean;
  };
  onOpen: (d: { src: string; alt: string; caption?: string }) => void;
  wide?: boolean;
};

function DiagramSlot({ diagram, onOpen, wide = false }: DiagramSlotProps) {
  // Placeholder mode — diagram is still just a string caption in topics.ts
  if (diagram.placeholder || !diagram.src) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border bg-background">
          <PanelLeft className="size-4 text-muted-foreground" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          {diagram.caption}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Image not yet added
        </p>
      </div>
    );
  }

  // Real image mode
  return (
    <figure
      className={
        wide
          ? "flex flex-col overflow-hidden rounded-xl border bg-card"
          : "flex h-80 flex-col overflow-hidden rounded-xl border bg-card"
      }
    >
      <button
        type="button"
        onClick={() => onOpen(diagram)}
        aria-label={`Open ${diagram.alt} larger`}
        className="flex min-h-0 flex-1 cursor-zoom-in items-center justify-center bg-background p-3 transition-colors hover:bg-accent/30"
      >
        <img
          src={diagram.src}
          alt={diagram.alt}
          className={wide ? "h-auto w-full" : "h-full w-full object-contain"}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </button>
      {diagram.caption && (
        <figcaption className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
          {diagram.caption}
        </figcaption>
      )}
    </figure>
  );
}

function NoteBlockView({ block }: { block: NoteBlock }) {
  if (block.type === "heading")
    return (
      <h2 className="mt-8 text-lg font-semibold tracking-tight first:mt-0">
        {block.text}
      </h2>
    );
  if (block.type === "paragraph")
    return (
      <p className="text-sm leading-7 text-muted-foreground">{block.text}</p>
    );
  if (block.type === "bullets")
    return (
      <ul className="flex flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  if (block.type === "code")
    return (
      <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-6 text-foreground">
        <code>{block.code}</code>
      </pre>
    );
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {block.headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rows.map((row, rowIndex) => (
            <TableRow key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function QuickReference({ items }: { items: Subtopic["quickReference"] }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        Quick Reference
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <Separator />
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

function SubnetCalculator() {
  const [ip, setIp] = useState("10.20.30.77");
  const [cidr, setCidr] = useState("26");
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | Record<string, string>>(null);

  const calculate = (event: React.FormEvent) => {
    event.preventDefault();
    const octets = ip.trim().split(".").map(Number);
    const prefix = Number(cidr);
    if (
      octets.length !== 4 ||
      octets.some(
        (octet) => !Number.isInteger(octet) || octet < 0 || octet > 255,
      ) ||
      !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())
    ) {
      setError("Enter a valid IPv4 address, such as 192.168.10.14.");
      setResult(null);
      return;
    }
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      setError("CIDR must be a whole number from 0 to 32.");
      setResult(null);
      return;
    }
    const value = octets.reduce((acc, octet) => acc * 256 + octet, 0) >>> 0;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (value & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const format = (num: number) =>
      [num >>> 24, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
    const total = 2 ** (32 - prefix);
    const usable =
      prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.max(0, total - 2);
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;
    const dotted = format(mask);
    setError("");
    setResult({
      network: `${format(network)}/${prefix}`,
      broadcast: format(broadcast),
      first: format(first),
      last: format(last),
      hosts: usable.toLocaleString(),
      mask: dotted,
    });
  };

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Subnetting calculator</CardTitle>
            <CardDescription className="mt-1">
              Check your block boundaries as you study.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={calculate}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <label className="flex-1 text-xs font-medium">
            IP address
            <Input
              value={ip}
              onChange={(event) => setIp(event.target.value)}
              className="mt-2 bg-background"
              placeholder="192.168.10.14"
            />
          </label>
          <label className="w-full text-xs font-medium sm:w-32">
            CIDR prefix
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                /
              </span>
              <Input
                value={cidr}
                onChange={(event) => setCidr(event.target.value)}
                className="bg-background pl-7"
                inputMode="numeric"
              />
            </div>
          </label>
          <Button type="submit" className="sm:w-auto">
            Calculate
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
        {result && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Network address", result.network],
              ["Broadcast address", result.broadcast],
              ["First usable host", result.first],
              ["Last usable host", result.last],
              ["Total usable hosts", result.hosts],
              ["Subnet mask", result.mask],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 break-all font-mono text-xs font-medium">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard({
  visitHistory,
  onSelectVisit,
  onClearHistory,
}: {
  visitHistory: VisitEntry[];
  onSelectVisit: (entry: VisitEntry) => void;
  onClearHistory: () => void;
}) {
  // First visit — no history yet
  if (visitHistory.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="mb-8 text-primary animate-pulse">
            <ArrowLeft className="size-20" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Start from the sidebar
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Pick any topic on the left to open it here. Your study session will
            load in this space.
          </p>
        </div>
      </div>
    );
  }

  // There's history — show the animated tree
    return (
    <div className="glass-canvas flex min-h-full items-start justify-center px-4 py-10 sm:px-6 lg:px-10">
      <div className="relative z-10 w-full max-w-2xl">
        <VisitTree
          entries={visitHistory}
          onSelect={onSelectVisit}
          onClear={onClearHistory}
        />
      </div>
    </div>
  );
}


export default function CcnaStudyApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dark, toggle: toggleTheme } = useTheme();
  const [lightbox, setLightbox] = useState<Diagram | null>(null);
  const { completed, isCompleted, toggle } = useCompletedTopics();
  const { bestFor, saveScore } = useQuizScores();
  const { entries: visitHistory, record: recordVisit, clear: clearVisitHistory } = useVisitHistory();
  const [isPending, startTransition] = useTransition();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Read topic + sub from the URL on every render
  // 1. Read params from URL
  const topicSlug = searchParams.get("topic");
  const subSlug = searchParams.get("sub");
  const quizParam = searchParams.get("quiz");

  // 2. Resolve the normal subtopic (unchanged from before)
  const selected = useMemo(() => {
    if (!topicSlug || !subSlug) return null;
    const topic = topics.find((t) => t.slug === topicSlug);
    if (!topic) return null;
    const subtopic = topic.subtopics.find((s) => s.slug === subSlug);
    if (!subtopic) return null;
    return { topic, subtopic };
  }, [topicSlug, subSlug]);

  // 3. Resolve the quiz (NEW)
  const selectedQuiz = useMemo(() => {
    if (!quizParam) return null;
    return quizById(quizParam) ?? null;
  }, [quizParam]);

  // 4. Two navigation actions
  const selectQuiz = (quizId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quiz", quizId);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setMobileOpen(false);
  };

  const select = (topic: Topic, subtopic: Subtopic) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("topic", topic.slug);
    params.set("sub", subtopic.slug);
    params.delete("quiz");
    recordVisit({
      slug: subtopic.slug,
      topicSlug: topic.slug,
      title: subtopic.title,
      topicTitle: topic.title,
      group: subtopic.group,
    });
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setMobileOpen(false);
  };

  const flatList = useMemo(
    () =>
      topics.flatMap((t) =>
        t.subtopics.map((s) => ({ topic: t, subtopic: s })),
      ),
    [],
  );
  const currentIndex = useMemo(() => {
    if (!selected) return -1;
    return flatList.findIndex(
      (item) =>
        item.topic.slug === selected.topic.slug &&
        item.subtopic.slug === selected.subtopic.slug,
    );
  }, [flatList, selected]);
  const prevItem = currentIndex > 0 ? flatList[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < flatList.length - 1
      ? flatList[currentIndex + 1]
      : null;

  const goHome = () => {
    startTransition(() => {
      router.push("/", { scroll: false });
    });
    setMobileOpen(false);
  };
  const current = selected?.subtopic;
  const currentIcon = selected
    ? iconMap[selected.topic.icon as keyof typeof iconMap]
    : null;

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <Sidebar
          selected={current?.slug}
          selectedQuizId={selectedQuiz?.id}
          onSelect={select}
          onSelectQuiz={selectQuiz}
          completed={completed}
          bestFor={bestFor}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
                aria-label="Open curriculum"
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">CCNA curriculum</SheetTitle>
                <Sidebar
                  selected={current?.slug}
                  selectedQuizId={selectedQuiz?.id}
                  onSelect={select}
                  onSelectQuiz={selectQuiz}
                  completed={completed}
                  bestFor={bestFor}
                  mobile
                />
              </SheetContent>
            </Sheet>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <button
                type="button"
                onClick={goHome}
                className="transition-colors hover:text-foreground"
              >
                CCNA Notes
              </button>
              {selected && (
                <>
                  <ChevronRight className="size-3" />
                  <button
                    type="button"
                    onClick={goHome}
                    className="transition-colors hover:text-foreground"
                  >
                    {selected.topic.title}
                  </button>
                  <ChevronRight className="size-3" />
                  <span className="text-foreground">
                    {selected.subtopic.title}
                  </span>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  dark ? "Switch to light mode" : "Switch to dark mode"
                }
                onClick={toggleTheme}
              >
                {dark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </header>
          <main className="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-x-contain">
            {isPending && (
              <div className="absolute inset-0 z-20 flex items-start justify-center bg-background/70 pt-24 backdrop-blur-[1px]">
                <SquareLoader />
              </div>
            )}
            {selectedQuiz ? (
              <QuizView
                quiz={selectedQuiz}
                best={bestFor(selectedQuiz.id)}
                onFinish={(score, total, length) =>
                  saveScore(selectedQuiz.id, score, total, length)
                }
                onBack={goHome}
              />
            ) : current ? (
              <article className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goHome}
                  className="mb-6 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="size-4 rotate-180" />
                  Back to Dashboard
                </Button>
                <div className="mb-8 flex items-start gap-4">
                  <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                    {currentIcon &&
                      (() => {
                        const Icon = currentIcon;
                        return <Icon className="size-5" />;
                      })()}
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{selected.topic.title}</Badge>
                      <span className="text-xs text-muted-foreground">
                        · Notes
                      </span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                      {current.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {current.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  {current.blocks.map((block, index) => (
                    <NoteBlockView
                      block={block}
                      key={`${block.type}-${index}`}
                    />
                  ))}
                </div>
                {current.diagrams && (
                  <div className="mt-8 flex flex-col gap-4">
                    {(() => {
                      // Normalize: strings become placeholder entries, objects pass through.
                      const normalized = current.diagrams.map((d, i) =>
                        typeof d === "string"
                          ? {
                              src: "",
                              alt: d,
                              caption: d,
                              placeholder: true,
                              _key: `str-${i}-${d}`,
                            }
                          : { ...d, _key: d.src },
                      );

                      // If there's only ONE diagram in the subtopic, treat it as wide by default.
                      const onlyOne = normalized.length === 1;

                      const isWide = (d: { src: string }) =>
                        onlyOne || d.src.includes("_wide");

                      const narrow = normalized.filter((d) => !isWide(d));
                      const wide = normalized.filter((d) => isWide(d));

                      return (
                        <>
                          {narrow.length > 0 && (
                            <div
                              className={
                                narrow.length === 1
                                  ? ""
                                  : "grid gap-4 sm:grid-cols-2"
                              }
                            >
                              {narrow.map((diagram) => (
                                <DiagramSlot
                                  key={diagram._key}
                                  diagram={diagram}
                                  onOpen={setLightbox}
                                />
                              ))}
                            </div>
                          )}
                          {wide.map((diagram) => (
                            <DiagramSlot
                              key={diagram._key}
                              diagram={diagram}
                              onOpen={setLightbox}
                              wide
                            />
                          ))}
                        </>
                      );
                    })()}
                  </div>
                )}
                {current.slug === "subnetting-calculations" && (
                  <>
                    <SubnetCalculator />
                    <SubnetPlanner />
                  </>
                )}
                <div className="mt-10 flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      prevItem && select(prevItem.topic, prevItem.subtopic)
                    }
                    disabled={!prevItem}
                    aria-label={
                      prevItem
                        ? `Previous: ${prevItem.subtopic.title}`
                        : "No previous topic"
                    }
                    title={prevItem ? prevItem.subtopic.title : undefined}
                    className="flex w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <div className="flex-1">
                    <QuickReference items={current.quickReference} />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      nextItem && select(nextItem.topic, nextItem.subtopic)
                    }
                    disabled={!nextItem}
                    aria-label={
                      nextItem
                        ? `Next: ${nextItem.subtopic.title}`
                        : "No next topic"
                    }
                    title={nextItem ? nextItem.subtopic.title : undefined}
                    className="flex w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggle(progressKey(selected.topic.slug, current.slug))
                    }
                    aria-label={
                      isCompleted(
                        progressKey(selected.topic.slug, current.slug),
                      )
                        ? "Mark as not completed"
                        : "Mark as completed"
                    }
                    className="group relative flex w-11 shrink-0 items-center justify-center transition-transform hover:scale-110"
                  >
                    <Check
                      strokeWidth={3}
                      className={`size-6 transition-colors ${
                        isCompleted(
                          progressKey(selected.topic.slug, current.slug),
                        )
                          ? "text-primary"
                          : "text-muted-foreground/40 group-hover:text-muted-foreground"
                      }`}
                    />
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background opacity-0 shadow transition-opacity group-hover:opacity-100">
                      {isCompleted(
                        progressKey(selected.topic.slug, current.slug),
                      )
                        ? "Completed"
                        : "Mark as completed"}
                    </span>
                  </button>
                </div>
              </article>
            ) : (
              <Dashboard
                visitHistory={visitHistory}
                onClearHistory={clearVisitHistory}
                onSelectVisit={(entry) => {
                  const topic = topics.find((t) => t.slug === entry.topicSlug);
                  const subtopic = topic?.subtopics.find(
                    (s) => s.slug === entry.slug,
                  );
                  if (topic && subtopic) select(topic, subtopic);
                }}
              />
            )}
          </main>
        </div>
      </div>
      <DiagramLightbox diagram={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
