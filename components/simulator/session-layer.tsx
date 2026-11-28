"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * SessionLayer
 * 1 SessionLifecycle – establish, maintain, recover and terminate a session (recovery ON/OFF)
 * 2 DuplexLab        – simplex, half-duplex and full-duplex with "who speaks" buttons
 * 3 DuplexCompare    – the three communication types side by side
 * 4 SessionQuiz      – practice questions
 * Rule to remember: the Session layer (5) opens, keeps, closes and rescues sessions, and decides which way traffic may flow.
 */

const SLOW = 1.4; // animation slow-down factor (1 = fast, higher = slower)

const C = {
  SES: "#1971c2",
  SIMPLEX: "#e8590c",
  HALF: "#f08c00",
  FULL: "#2f9e44",
  PURPLE: "#9c36b5",
  PINK: "#d6336c",
  TEAL: "#0c8599",
  GREEN: "#2f9e44",
  RED: "#c92a2a",
  AMBER: "#f08c00",
  LBLUE: "#1c7ed6",
  GREY: "#868e96",
};
const mono = "ui-monospace, monospace";

type P = { x: number; y: number };

/* ───────────────────────── shared helpers ───────────────────────── */

const edge = (A: P, B: P, r = 28): [number, number, number, number] => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return [A.x + ux * r, A.y + uy * r, B.x - ux * r, B.y - uy * r];
};

/** loop = repeats forever, "once" = plays one time and stays at the end */
function Chip({
  a, b, r = 28, label, color, dur, delay, mode = "loop",
}: {
  a: P; b: P; r?: number; label: string; color: string; dur: number; delay: number; mode?: "loop" | "once";
}) {
  const [x0, y0, x1, y1] = edge(a, b, r);
  const w = label.length * 6.2 + 16;
  return (
    <g
      className={mode === "once" ? "sl-pkt sl-once" : "sl-pkt"}
      style={
        {
          "--x0": `${x0}px`,
          "--y0": `${y0}px`,
          "--x1": `${x1}px`,
          "--y1": `${y1}px`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        } as CSSProperties
      }
    >
      <rect x={-w / 2} y={-10} width={w} height={20} rx={6} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

function Node({ p, e, l, stroke, sub, sw = 2.5 }: { p: P; e: string; l: string; stroke: string; sub?: string; sw?: number }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={28} className="fill-background" stroke={stroke} strokeWidth={sw} style={{ transition: "stroke .4s" }} />
      <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26}>{e}</text>
      <text x={p.x} y={p.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{l}</text>
      {sub && <text x={p.x} y={p.y + 60} textAnchor="middle" fontSize={10} fill={C.GREY}>{sub}</text>}
    </g>
  );
}

function Shell({ title, desc, badge = "Interactive", children }: { title: string; desc: string; badge?: string; children: ReactNode }) {
  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{desc}</CardDescription>
          </div>
          <Badge variant="secondary">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

const Tip = ({ color, children }: { color: string; children: ReactNode }) => (
  <p className="rounded-lg px-3 py-2 text-xs leading-5" style={{ background: `${color}18`, color }}>💡 {children}</p>
);

const Pills = <T extends string>({ items, sel, set, color }: { items: { id: T; label: string; color?: string }[]; sel: T; set: (v: T) => void; color: string }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((x) => {
      const c = x.color ?? color;
      return (
        <button key={x.id} onClick={() => set(x.id)} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          style={sel === x.id ? { background: c, borderColor: c, color: "#fff" } : { borderColor: `${c}66`, color: c }}>
          {x.label}
        </button>
      );
    })}
  </div>
);

type Fact = { t: string; easy: string };

function FactList({ facts, color }: { facts: Fact[]; color: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {facts.map((f, i) => {
        const on = open === i;
        return (
          <button key={i} onClick={() => setOpen(on ? null : i)}
            className="rounded-lg border px-3 py-2 text-left text-xs leading-5 transition-colors hover:bg-muted/40"
            style={on ? { borderColor: color, background: `${color}10` } : undefined}>
            <span className="font-medium">{on ? "▾" : "▸"} {f.t}</span>
            {on && <span className="sl-fade mt-1 block text-muted-foreground">💬 {f.easy}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── 1. session lifecycle ───────────────────────── */

type SState = "open" | "broken" | "closed";
type Dir = "fwd" | "back";
type SStep = {
  phase: number;
  title: string;
  text: string;
  chips: { dir: Dir; label: string; color: string; delay: number }[];
  state: SState;
  progress: number;
  mark?: boolean;
};

const PHASES = ["1 · Establish", "2 · Maintain", "3 · Recover", "4 · Terminate"];
const STACK: { n: number; name: string }[] = [
  { n: 7, name: "Application" }, { n: 6, name: "Presentation" }, { n: 5, name: "Session" }, { n: 4, name: "Transport" },
  { n: 3, name: "Network" }, { n: 2, name: "Data link" }, { n: 1, name: "Physical" },
];

function buildSteps(rec: boolean): SStep[] {
  return [
    {
      phase: 0, title: "Step 1: establish the session",
      text: "The client asks the server to open a session. The server agrees. Now both sides know they are in a conversation.",
      chips: [{ dir: "fwd", label: "open session?", color: C.AMBER, delay: 0 }, { dir: "back", label: "session opened", color: C.GREEN, delay: 1 }],
      state: "open", progress: 0,
    },
    {
      phase: 1, title: "Step 2: maintain the session while data flows",
      text: "While the session is open, data moves and the layer keeps the conversation going. In this example 40% of a file is sent and a bookmark is saved at 40%, a point to come back to if something goes wrong.",
      chips: [{ dir: "fwd", label: "file part 1", color: C.LBLUE, delay: 0 }, { dir: "back", label: "got it", color: C.GREEN, delay: 1 }],
      state: "open", progress: 40, mark: true,
    },
    {
      phase: 1, title: "Step 2: still maintaining",
      text: "More data is sent. The file is now 60% sent.",
      chips: [{ dir: "fwd", label: "file part 2", color: C.LBLUE, delay: 0 }, { dir: "back", label: "got it", color: C.GREEN, delay: 1 }],
      state: "open", progress: 60, mark: true,
    },
    {
      phase: 2, title: "The connection breaks",
      text: "The link drops in the middle of the transfer. The session is broken and the file is only partly sent. Something must recover it.",
      chips: [{ dir: "fwd", label: "✕ lost", color: C.RED, delay: 0 }],
      state: "broken", progress: 60, mark: true,
    },
    rec
      ? {
          phase: 2, title: "Step 3: recover the session",
          text: "The Session layer re-establishes the session and continues from the last bookmark at 40%. Only the missing part is sent again, so no work is wasted.",
          chips: [{ dir: "back", label: "resume from 40%", color: C.AMBER, delay: 0 }, { dir: "fwd", label: "part 2 again", color: C.LBLUE, delay: 1 }],
          state: "open", progress: 40, mark: true,
        }
      : {
          phase: 2, title: "Without recovery: start again",
          text: "Nothing remembers where the transfer stopped, so the whole file must be sent again from 0%. This is the pain that session recovery removes.",
          chips: [{ dir: "fwd", label: "restart from 0%", color: C.RED, delay: 0 }],
          state: "open", progress: 0,
        },
    {
      phase: 1, title: "Step 2: maintain until the end",
      text: rec ? "The rest of the file is sent over the recovered session." : "The whole file is sent all over again.",
      chips: [{ dir: "fwd", label: rec ? "last part" : "whole file", color: C.LBLUE, delay: 0 }, { dir: "back", label: "got it", color: C.GREEN, delay: 1 }],
      state: "open", progress: 100, mark: rec,
    },
    {
      phase: 3, title: "Step 4: terminate the session",
      text: "Both sides agree the conversation is finished and close the session, freeing the resources it was using.",
      chips: [{ dir: "fwd", label: "I am done", color: C.AMBER, delay: 0 }, { dir: "back", label: "session closed", color: C.GREEN, delay: 1 }],
      state: "closed", progress: 100,
    },
  ];
}

const SES_FACTS: Fact[] = [
  { t: "The Session layer is the 5th layer.", easy: "It sits in the middle of the stack, under the Presentation layer and above the Transport layer." },
  { t: "It is responsible for establishing sessions between client and server.", easy: "Like dialling a call and waiting for the other person to pick up." },
  { t: "It is responsible for maintaining sessions between client and server.", easy: "Like staying on the call and keeping it alive while you talk." },
  { t: "It is responsible for terminating sessions between client and server.", easy: "Like both sides saying goodbye and hanging up properly." },
  { t: "It is responsible for recovering sessions between client and server.", easy: "If the call drops, you call back and carry on where you stopped. Use the recovery switch above to compare." },
];

export function SessionLifecycle() {
  const [rec, setRec] = useState(true);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = buildSteps(rec);
  const N = steps.length;
  const done = step >= N;
  const cur = step > 0 ? steps[step - 1] : null;
  const curPhase = cur ? cur.phase : -1;
  const state: SState = cur ? cur.state : "closed";
  const progress = cur ? cur.progress : 0;

  const cl: P = { x: 90, y: 100 };
  const sv: P = { x: 510, y: 100 };
  const lane = (d: Dir): [P, P] => (d === "fwd" ? [{ x: 124, y: 86 }, { x: 476, y: 86 }] : [{ x: 476, y: 114 }, { x: 124, y: 114 }]);
  const col = state === "open" ? C.GREEN : state === "broken" ? C.RED : C.GREY;
  const stateLabel = state === "open" ? "Session open" : state === "broken" ? "Session broken" : step === 0 ? "No session yet" : "Session closed";

  useEffect(() => {
    if (!playing) return;
    if (step >= N) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => Math.min(N, s + 1)), 5200);
    return () => clearTimeout(t);
  }, [playing, step, N]);

  return (
    <Shell title="Session layer (5): open, keep, close and rescue a session" desc="A client sends a file to a server. Follow the session from the first hello to the goodbye, break the connection and see what recovery saves.">
      <div className="flex flex-wrap items-center gap-1.5">
        {STACK.map((l) => (
          <span key={l.n} className="rounded-md border px-2 py-1 text-[11px] font-medium"
            style={l.n === 5 ? { background: C.SES, borderColor: C.SES, color: "#fff" } : { color: C.GREY }}>
            {l.n} · {l.name}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PHASES.map((label, i) => (
          <span key={label} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={i === curPhase ? { background: C.SES, borderColor: C.SES, color: "#fff" } : { color: C.GREY }}>
            {label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 190" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="A client and a server sharing a session">
          <rect x={124} y={66} width={352} height={62} rx={31} fill={col} fillOpacity={state === "closed" ? 0.04 : 0.1} stroke={col}
            strokeWidth={3} strokeDasharray="9 7" strokeOpacity={state === "closed" ? 0.5 : 1} className={state === "open" ? "sl-dash" : ""} style={{ transition: "all .4s" }} />
          <text x={300} y={58} textAnchor="middle" fontSize={11} fontWeight={700} fill={col}>{stateLabel}</text>
          {state === "broken" && (
            <text key={`brk-${step}`} x={300} y={105} textAnchor="middle" fontSize={26} className="sl-pop">💥</text>
          )}
          <Node p={cl} e="💻" l="Client" stroke={state === "broken" ? C.RED : C.SES} sw={3} />
          <Node p={sv} e="🖥️" l="Server" stroke={state === "broken" ? C.RED : C.SES} sw={3} />
          {cur?.chips.map((c, i) => {
            const [a, b] = lane(c.dir);
            return <Chip key={`${step}-${rec}-${i}`} a={a} b={b} r={0} label={c.label} color={c.color} dur={1.2 * SLOW} delay={c.delay * 1.2 * SLOW} mode="once" />;
          })}
        </svg>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium">File sent</span>
          <Badge variant="secondary" style={{ color: col }}>{stateLabel}</Badge>
        </div>
        <div className="relative h-4 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: state === "broken" ? C.RED : C.SES, transition: "width .8s" }} />
          {cur?.mark && <div className="absolute top-0 h-full w-0.5" style={{ left: "40%", background: C.AMBER }} />}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{progress}% sent</span>
          {cur?.mark && <span style={{ color: C.AMBER }}>🔖 bookmark at 40% (example)</span>}
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4">
        {cur ? (
          <div key={`${step}-${rec}`} className="sl-fade flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Step {step} of {N}</p>
            <p className="text-sm font-semibold">{cur.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">{cur.text}</p>
            {done && (
              <p className="text-xs font-medium" style={{ color: C.GREEN }}>
                {rec ? "Recovered: only 60% of the file was ever at risk, and the transfer carried on." : "No recovery: the full file had to be sent twice."}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">Press Start to follow a file transfer. The connection will break halfway. Switch session recovery off first to see the difference.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={step <= 1} onClick={() => { setPlaying(false); setStep((s) => Math.max(1, s - 1)); }}>Back</Button>
        {step === 0 || done ? (
          <Button size="sm" onClick={() => { setPlaying(false); setStep(1); }}>{done ? "Replay" : "Start"}</Button>
        ) : (
          <Button size="sm" onClick={() => { setPlaying(false); setStep((s) => Math.min(N, s + 1)); }}>Next step</Button>
        )}
        <Button size="sm" variant="outline" disabled={step === 0 || done} onClick={() => setPlaying((v) => !v)}>{playing ? "Pause" : "Auto-play"}</Button>
        <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => { setPlaying(false); setStep(0); }}>Reset</Button>
        <Button size="sm" variant={rec ? "default" : "outline"} onClick={() => { setRec((v) => !v); setStep(0); setPlaying(false); }}
          style={rec ? { background: C.GREEN, color: "#fff" } : { background: C.RED, color: "#fff" }}>
          Session recovery: {rec ? "ON" : "OFF"}
        </Button>
      </div>

      <FactList facts={SES_FACTS} color={C.SES} />
      <Tip color={C.SES}>Establish, maintain, terminate, recover. Those four verbs are the Session layer's whole job between client and server.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 2. duplex lab ───────────────────────── */

type DM = "simplex" | "half" | "full";
type Act = "A" | "B" | "both" | null;
type Res = "ok" | "blocked" | "collide" | null;

const DUPLEX: Record<DM, {
  label: string; color: string; dir: string; a: [string, string]; b: [string, string]; example: string; analogy: string; spA: string; spB: string; msgA: string; msgB: string;
}> = {
  simplex: { label: "Simplex", color: C.SIMPLEX, dir: "→ one way only", a: ["🗼", "FM radio station"], b: ["📻", "Radio"], example: "FM radio", analogy: "A one-way street: cars can only go in one direction.", spA: "Station", spB: "Radio", msgA: "music", msgB: "reply" },
  half: { label: "Half-duplex", color: C.HALF, dir: "⇄ two ways, one at a time", a: ["🎙️", "Walkie-talkie 1"], b: ["🎙️", "Walkie-talkie 2"], example: "Walkie-talkie", analogy: "A single-lane bridge: traffic goes both ways, but one direction at a time.", spA: "Walkie 1", spB: "Walkie 2", msgA: "over", msgB: "copy, over" },
  full: { label: "Full-duplex", color: C.FULL, dir: "⇄ two ways, at the same time", a: ["📱", "Phone 1"], b: ["📱", "Phone 2"], example: "Mobile phone", analogy: "A two-lane road: cars travel both ways at once.", spA: "Phone 1", spB: "Phone 2", msgA: "hello", msgB: "hi there" },
};

function outcome(mode: DM, act: Act): { a: Res; b: Res; msg: string; good: boolean } {
  if (!act) return { a: null, b: null, msg: "Press one of the buttons to make a device speak and see what this type of communication allows.", good: true };
  const d = DUPLEX[mode];
  if (mode === "simplex") {
    if (act === "A") return { a: "ok", b: null, msg: `${d.a[1]} sends and ${d.b[1]} receives. This is the only direction simplex allows.`, good: true };
    if (act === "B") return { a: null, b: "blocked", msg: `${d.b[1]} cannot answer. Simplex is one-way only, so there is no path back to the sender.`, good: false };
    return { a: "ok", b: "blocked", msg: `Only the sender gets through. The ${d.b[1]} can never talk back, even at the same time.`, good: false };
  }
  if (mode === "half") {
    if (act === "A") return { a: "ok", b: null, msg: "Walkie-talkie 1 speaks while 2 listens. Then they swap, so one speaks at a time.", good: true };
    if (act === "B") return { a: null, b: "ok", msg: "Walkie-talkie 2 speaks while 1 listens. Two-way is possible, but only one direction at a time.", good: true };
    return { a: "collide", b: "collide", msg: "Both pressed talk at once and the messages collide. Half-duplex is not simultaneous, so nobody is heard. They must take turns.", good: false };
  }
  if (act === "A") return { a: "ok", b: null, msg: "Phone 1 speaks and Phone 2 hears it.", good: true };
  if (act === "B") return { a: null, b: "ok", msg: "Phone 2 speaks and Phone 1 hears it.", good: true };
  return { a: "ok", b: "ok", msg: "Both talk at the same moment and both messages arrive. Full-duplex is simultaneous two-way communication.", good: true };
}

const DUP_FACTS: Fact[] = [
  { t: "Simplex: one-way communication only. Example: FM radio.", easy: "The radio station always sends and your radio only receives. You cannot talk back through it." },
  { t: "Half-duplex: two-way communication, but not simultaneous. Example: walkie-talkie.", easy: "Both people can talk, but only one at a time. You say 'over' to hand the turn to the other person." },
  { t: "Full-duplex: simultaneous two-way communication. Example: mobile phone.", easy: "You can talk and listen at the same moment, like on a normal phone call." },
  { t: "The Session layer defines the direction traffic can flow.", easy: "It decides whether a conversation is one-way, take-turns or both-at-once." },
];

export function DuplexLab() {
  const [mode, setMode] = useState<DM>("simplex");
  const [act, setAct] = useState<Act>(null);
  const [n, setN] = useState(0);
  const d = DUPLEX[mode];
  const o = outcome(mode, act);
  const A: P = { x: 90, y: 110 };
  const B: P = { x: 510, y: 110 };
  const topA: P = { x: 124, y: 92 };
  const topB: P = { x: 476, y: 92 };
  const botA: P = { x: 476, y: 128 };
  const botB: P = { x: 124, y: 128 };
  const dur = 1.8 * SLOW;
  const go = (a: Act) => { setAct(a); setN((v) => v + 1); };
  const stroke = (r: Res) => (r === "ok" ? C.GREEN : r === "blocked" || r === "collide" ? C.RED : d.color);

  return (
    <Shell title="Types of communication: who is allowed to speak?" desc="Pick a type, then press the buttons to make one device, the other, or both speak at the same time.">
      <Pills items={(Object.keys(DUPLEX) as DM[]).map((k) => ({ id: k, label: DUPLEX[k].label, color: DUPLEX[k].color }))} sel={mode} set={(v) => { setMode(v); setAct(null); setN((x) => x + 1); }} color={d.color} />

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 210" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Two devices and the directions traffic can flow">
          <text x={300} y={30} textAnchor="middle" fontSize={13} fontWeight={700} fill={d.color}>{d.dir}</text>
          <line x1={124} y1={92} x2={476} y2={92} stroke={d.color} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="7 6" className="sl-dash" />
          {mode === "simplex" ? (
            <g>
              <line x1={124} y1={128} x2={476} y2={128} stroke={C.GREY} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="3 6" />
              <text x={300} y={133} textAnchor="middle" fontSize={14} fontWeight={700} fill={C.RED}>✕ no way back</text>
            </g>
          ) : (
            <line x1={124} y1={128} x2={476} y2={128} stroke={d.color} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="7 6" className="sl-dash" />
          )}
          {mode === "half" && <text x={300} y={152} textAnchor="middle" fontSize={10} fontWeight={600} fill={d.color}>one shared channel: take turns</text>}
          {mode === "full" && <text x={300} y={152} textAnchor="middle" fontSize={10} fontWeight={600} fill={d.color}>two lanes: both directions together</text>}

          <Node p={A} e={d.a[0]} l={d.a[1]} stroke={stroke(o.a)} sw={o.a ? 4 : 2.5} />
          <Node p={B} e={d.b[0]} l={d.b[1]} stroke={stroke(o.b)} sw={o.b ? 4 : 2.5} />

          {o.a === "ok" && [0, 1].map((i) => <Chip key={`a-${mode}-${act}-${n}-${i}`} a={topA} b={topB} r={0} label={d.msgA} color={d.color} dur={dur} delay={i * 0.9 * SLOW} />)}
          {o.b === "ok" && [0, 1].map((i) => <Chip key={`b-${mode}-${act}-${n}-${i}`} a={botA} b={botB} r={0} label={d.msgB} color={C.LBLUE} dur={dur} delay={i * 0.9 * SLOW} />)}
          {o.a === "collide" && (
            <g key={`col-${mode}-${n}`}>
              <Chip a={topA} b={{ x: 290, y: 110 }} r={0} label={d.msgA} color={C.RED} dur={dur} delay={0} />
              <Chip a={botA} b={{ x: 310, y: 110 }} r={0} label={d.msgB} color={C.RED} dur={dur} delay={0} />
              <text x={300} y={118} textAnchor="middle" fontSize={26} className="sl-pop" style={{ animationDelay: `${dur * 0.8}s` }}>💥</text>
            </g>
          )}
          {o.b === "blocked" && (
            <text key={`bl-${n}`} x={B.x} y={B.y - 40} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED} className="sl-pop">✕ cannot send</text>
          )}
          {o.a === "ok" && o.b === "blocked" && null}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={act === "A" ? "default" : "outline"} onClick={() => go("A")} style={act === "A" ? { background: d.color } : undefined}>{d.spA} speaks</Button>
        <Button size="sm" variant={act === "B" ? "default" : "outline"} onClick={() => go("B")} style={act === "B" ? { background: d.color } : undefined}>{d.spB} speaks</Button>
        <Button size="sm" variant={act === "both" ? "default" : "outline"} onClick={() => go("both")} style={act === "both" ? { background: d.color } : undefined}>Both speak at once</Button>
        <Button size="sm" variant="ghost" disabled={!act} onClick={() => { setAct(null); setN((v) => v + 1); }}>Reset</Button>
      </div>

      <p key={`${mode}-${act}-${n}`} className="sl-fade rounded-xl border bg-background p-4 text-xs leading-5"
        style={act ? { borderColor: o.good ? C.GREEN : C.RED, color: o.good ? C.GREEN : C.RED } : undefined}>
        {o.msg}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div key={`ex-${mode}`} className="sl-fade rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: `${d.color}88` }}>
          <p className="text-sm font-semibold" style={{ color: d.color }}>{d.label}</p>
          <p className="mt-1 text-muted-foreground">Example: {d.example}.</p>
        </div>
        <Tip color={d.color}>{d.analogy}</Tip>
      </div>

      <FactList facts={DUP_FACTS} color={C.SES} />
    </Shell>
  );
}

/* ───────────────────────── 3. compare ───────────────────────── */

export function DuplexCompare() {
  const [sel, setSel] = useState<DM>("simplex");
  const rows: [string, string, string, string][] = [
    ["Direction", "One way only", "Two ways", "Two ways"],
    ["At the same time?", "Not applicable", "No, one at a time", "Yes, simultaneous"],
    ["Example", "FM radio", "Walkie-talkie", "Mobile phone"],
    ["Road picture", "One-way street", "Single-lane bridge", "Two-lane road"],
  ];
  const keys: DM[] = ["simplex", "half", "full"];
  return (
    <Shell title="Simplex, half-duplex and full-duplex side by side" desc="Pick a type to highlight its column." badge="Cheat sheet">
      <Pills items={keys.map((k) => ({ id: k, label: DUPLEX[k].label, color: DUPLEX[k].color }))} sel={sel} set={setSel} color={DUPLEX[sel].color} />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium" />
              {keys.map((k) => <th key={k} className="px-3 py-2 text-left font-medium" style={sel === k ? { color: DUPLEX[k].color } : undefined}>{DUPLEX[k].label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t">
                <td className="px-3 py-2 font-semibold">{r[0]}</td>
                {keys.map((k, i) => (
                  <td key={k} className="px-3 py-2" style={sel === k ? { background: `${DUPLEX[k].color}10`, color: DUPLEX[k].color, fontWeight: 600 } : undefined}>{r[i + 1]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2">
        {keys.map((k) => (
          <div key={k} className="grid grid-cols-[100px_1fr] items-center gap-2 text-xs">
            <span className="font-semibold" style={{ color: DUPLEX[k].color }}>{DUPLEX[k].label}</span>
            <div className="flex h-5 items-center gap-1 rounded-full bg-muted px-2 font-mono text-[11px]" style={sel === k ? { outline: `2px solid ${DUPLEX[k].color}` } : undefined}>
              {k === "simplex" ? "→" : k === "half" ? "→ then ←" : "→ and ← together"}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/* ───────────────────────── 4. quiz ───────────────────────── */

const QS: { q: string; o: string[]; a: number; why: string }[] = [
  { q: "Which number is the Session layer?", o: ["3rd", "4th", "5th", "6th"], a: 2, why: "The Session layer is the 5th layer." },
  { q: "Which job does the Session layer NOT do?", o: ["Establish sessions", "Maintain sessions", "Terminate and recover sessions", "Turn user data into machine data"], a: 3, why: "Converting data is the Presentation layer's job. The Session layer establishes, maintains, terminates and recovers sessions." },
  { q: "What does the Session layer define about traffic?", o: ["Its colour", "The direction it can flow", "Its cable type", "Its IP address"], a: 1, why: "It defines the direction traffic can flow: simplex, half-duplex or full-duplex." },
  { q: "Which type is one-way communication only?", o: ["Simplex", "Half-duplex", "Full-duplex", "All of them"], a: 0, why: "Simplex is one way only." },
  { q: "FM radio is an example of…", o: ["Simplex", "Half-duplex", "Full-duplex", "None of these"], a: 0, why: "The station sends and the radio only receives." },
  { q: "A walkie-talkie is an example of…", o: ["Simplex", "Half-duplex", "Full-duplex", "None of these"], a: 1, why: "Two-way, but not simultaneous." },
  { q: "A mobile phone call is an example of…", o: ["Simplex", "Half-duplex", "Full-duplex", "None of these"], a: 2, why: "Both people can talk at the same time." },
  { q: "Which type is two-way but NOT simultaneous?", o: ["Simplex", "Half-duplex", "Full-duplex", "Broadcast"], a: 1, why: "Half-duplex: the sides take turns." },
  { q: "Which type allows simultaneous two-way communication?", o: ["Simplex", "Half-duplex", "Full-duplex", "One-way"], a: 2, why: "Full-duplex." },
  { q: "A session breaks halfway through a transfer. Which Session layer job helps?", o: ["Establishing", "Recovering", "Compressing", "Encrypting"], a: 1, why: "Recovering brings the session back so the work can continue." },
];

export function SessionQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QS.length;
  const q = QS[Math.min(i, QS.length - 1)];

  return (
    <Shell title="Session layer check" desc="Ten quick questions on sessions and communication types." badge="Practice">
      {done ? (
        <div className="sl-fade rounded-xl border bg-background p-4 text-sm">
          <p className="font-semibold">You scored {score} out of {QS.length}.</p>
          <p className="mt-1 text-xs text-muted-foreground">{score === QS.length ? "Perfect score." : "Revisit the labs above for the ones you missed."}</p>
        </div>
      ) : (
        <div key={i} className="sl-fade rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Question {i + 1} of {QS.length}</p>
          <p className="mt-1 text-sm font-medium">{q.q}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.o.map((o, k) => {
              const right = pick !== null && k === q.a;
              const wrong = pick === k && k !== q.a;
              return (
                <Button key={o} size="sm" variant="outline" disabled={pick !== null}
                  onClick={() => { setPick(k); if (k === q.a) setScore((s) => s + 1); }}
                  style={right ? { background: C.GREEN, color: "#fff", opacity: 1 } : wrong ? { background: C.RED, color: "#fff", opacity: 1 } : undefined}>
                  {o}
                </Button>
              );
            })}
          </div>
          {pick !== null && (
            <p className="sl-fade mt-3 text-xs leading-5" style={{ color: pick === q.a ? C.GREEN : C.RED }}>
              {pick === q.a ? "Correct. " : "Not quite. "}<span className="text-muted-foreground">{q.why}</span>
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {!done && pick !== null && <Button size="sm" onClick={() => { setPick(null); setI((x) => x + 1); }}>{i === QS.length - 1 ? "See score" : "Next question"}</Button>}
        <Button size="sm" variant="ghost" onClick={() => { setI(0); setPick(null); setScore(0); }}>Restart</Button>
      </div>
    </Shell>
  );
}

/* ───────────────────────── main export ───────────────────────── */

export function SessionLayer() {
  return (
    <div>
      <style>{`
        @keyframes sl-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes sl-travel { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes sl-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes sl-dash { to { stroke-dashoffset: -26; } }
        @keyframes sl-pop { from { opacity: 0; } to { opacity: 1; } }
        .sl-pkt  { animation: sl-move 2s linear infinite both; }
        .sl-once { animation-name: sl-travel; animation-iteration-count: 1; animation-timing-function: ease-in-out; animation-fill-mode: both; }
        .sl-fade { animation: sl-fade ${0.5 * SLOW}s ease-out both; }
        .sl-dash { animation: sl-dash ${1.2 * SLOW}s linear infinite; }
        .sl-pop  { animation: sl-pop ${0.4 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .sl-pkt, .sl-fade, .sl-dash, .sl-pop { animation: none; opacity: 1; } .sl-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>
      <p className="text-sm text-muted-foreground">
        The Session layer establishes, maintains, terminates and recovers sessions between client and server, and defines the direction traffic can flow.
      </p>
      <SessionLifecycle />
      <DuplexLab />
      <DuplexCompare />
      <SessionQuiz />
    </div>
  );
}

export default SessionLayer;