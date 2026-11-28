// physical-layer.tsx
"use client";
import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * PhysicalLayer (Layer 1: binary format, physical transmission)
 * 1. PhysicalExplorer: tap each fact about Layer 1 and watch bits and signals travel along a cable.
 * 2. BinaryLab: type a letter or pick a bit pattern and see it sent as 1s and 0s with signals.
 * 3. DumbHardwareLab: sort devices into "Layer 1 dumb hardware" or "not Layer 1" with a hub demo.
 * Rule to remember: Layer 1 moves bits as signals over the physical medium, and "dumb" hardware with no intelligence lives here.
 */

const SLOW = 1.4;
const C = { BLUE: "#1971c2", GREEN: "#2f9e44", AMBER: "#f08c00", ORANGE: "#e8590c", PURPLE: "#9c36b5", PINK: "#d6336c", TEAL: "#0c8599", RED: "#c92a2a", LBLUE: "#1c7ed6" };
const GREY = "#868e96";
const mono = "ui-monospace, monospace";
type P = { x: number; y: number };

const edge = (A: P, B: P, r = 28): [number, number, number, number] => {
  const dx = B.x - A.x, dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  return [A.x + ux * r, A.y + uy * r, B.x - ux * r, B.y - uy * r];
};

function Chip({ a, b, r = 28, label, color, dur, delay }: { a: P; b: P; r?: number; label: string; color: string; dur: number; delay: number }) {
  const [x0, y0, x1, y1] = edge(a, b, r);
  const w = label.length * 6.2 + 16;
  return (
    <g className="pl-pkt" style={{ "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties}>
      <rect x={-w / 2} y={-10} width={w} height={20} rx={6} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>{label}</text>
    </g>
  );
}

function Node({ p, e, l, stroke, sub }: { p: P; e: string; l: string; stroke: string; sub?: string }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={28} className="fill-background" stroke={stroke} strokeWidth={2.5} style={{ transition: "stroke .4s" }} />
      <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26}>{e}</text>
      <text x={p.x} y={p.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{l}</text>
      {sub && <text x={p.x} y={p.y + 60} textAnchor="middle" fontSize={10} fill={GREY}>{sub}</text>}
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

const Pills = <T extends string>({ items, sel, set, color }: { items: { id: T; label: string }[]; sel: T; set: (v: T) => void; color: string }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((x) => (
      <button key={x.id} onClick={() => set(x.id)} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        style={sel === x.id ? { background: color, borderColor: color, color: "#fff" } : { borderColor: `${color}66`, color }}>
        {x.label}
      </button>
    ))}
  </div>
);

/* ---------- Shared scene types ---------- */
type Id = string;
type SceneNode = { id: Id; x: number; y: number; e: string; l: string; sub?: string };
type Group = { x: number; y: number; w: number; h: number; label: string; color: string };
type Flow = { a: Id; b: Id; label: string; delay: number; color: string };
type Scene = { groups: Group[]; nodes: SceneNode[]; links: [Id, Id][]; flows: Flow[]; dur: number; hot?: Id };

const at = (s: { nodes: SceneNode[] }, id: Id): P => {
  const n = s.nodes.find((q) => q.id === id);
  return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
};

function SceneSvg({ scene, aria, stroke, k, vh = 320, extra }: { scene: Scene; aria: string; stroke: (id: Id) => string; k: string; vh?: number; extra?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-3">
      <svg viewBox={`0 0 600 ${vh}`} className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label={aria}>
        {scene.groups.map((g) => (
          <g key={g.label}>
            <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={12} fill={`${g.color}10`} stroke={`${g.color}88`} strokeDasharray="5 4" />
            <text x={g.x + 8} y={g.y + 16} fontSize={11} fontWeight={600} fill={g.color}>{g.label}</text>
          </g>
        ))}
        {scene.links.map(([a, b]) => {
          const A = at(scene, a), B = at(scene, b);
          return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="pl-dash" stroke={GREY} strokeWidth={2} strokeDasharray="7 6" />;
        })}
        {scene.nodes.map((n) => <Node key={n.id} p={n} e={n.e} l={n.l} sub={n.sub} stroke={stroke(n.id)} />)}
        {scene.flows.map((f, i) => (
          <Chip key={`${k}-${i}`} a={at(scene, f.a)} b={at(scene, f.b)} label={f.label} color={f.color} dur={scene.dur * SLOW} delay={f.delay} />
        ))}
        {extra}
      </svg>
    </div>
  );
}

/* ---------- Section 1: Explorer data ---------- */
const TX: SceneNode = { id: "tx", x: 90, y: 150, e: "💻", l: "Sender" };
const RX: SceneNode = { id: "rx", x: 510, y: 150, e: "🖥️", l: "Receiver" };
const MID: SceneNode = { id: "mid", x: 300, y: 150, e: "🔌", l: "Cable", sub: "Physical medium" };
const LINE: Group[] = [{ x: 15, y: 80, w: 570, h: 170, label: "Physical layer (Layer 1)", color: C.TEAL }];
const mk = (flows: Flow[], hot?: Id): Scene => ({ groups: LINE, nodes: [TX, MID, RX], links: [["tx", "mid"], ["mid", "rx"]], flows, dur: 2.4, hot });

type CId = "medium" | "send" | "signal" | "dumb";
type Concept = { id: CId; label: string; color: string; notes: { fact: string; simple: string }[]; examples: string[]; analogy: string; scene: Scene };

const CONCEPTS: Concept[] = [
  {
    id: "medium", label: "Binary over a cable", color: C.BLUE,
    notes: [
      { fact: "Responsible for transferring data through the physical medium (cables) in binary format.", simple: "Data is turned into 1s and 0s and carried along a real cable." },
    ],
    examples: ["Physical medium", "Cable", "Binary"],
    analogy: "Like Morse code on a wire: only two kinds of signal, but they can spell anything.",
    scene: mk([
      { a: "tx", b: "mid", label: "1 0 1 1", delay: 0, color: C.BLUE },
      { a: "mid", b: "rx", label: "1 0 1 1", delay: 1.2, color: C.BLUE },
    ], "mid"),
  },
  {
    id: "send", label: "Sending and receiving", color: C.GREEN,
    notes: [
      { fact: "Responsible for sending and receiving the data.", simple: "One side puts the bits on the cable. The other side picks them up." },
    ],
    examples: ["Send", "Receive", "Data"],
    analogy: "Like a phone line: one person speaks while the other listens.",
    scene: mk([
      { a: "tx", b: "mid", label: "send", delay: 0, color: C.BLUE },
      { a: "mid", b: "rx", label: "send", delay: 1.2, color: C.BLUE },
      { a: "rx", b: "mid", label: "receive", delay: 2.4, color: C.GREEN },
      { a: "mid", b: "tx", label: "receive", delay: 3.6, color: C.GREEN },
    ]),
  },
  {
    id: "signal", label: "Signals", color: C.AMBER,
    notes: [
      { fact: "Also responsible for sending the signals along with the data.", simple: "The bits travel as signals, so the other end can tell a 1 from a 0." },
    ],
    examples: ["Signal", "Data", "Bits"],
    analogy: "Like a torch: the light going on and off is the signal that carries the message.",
    scene: mk([
      { a: "tx", b: "mid", label: "signal", delay: 0, color: C.AMBER },
      { a: "mid", b: "rx", label: "signal", delay: 1.2, color: C.AMBER },
      { a: "tx", b: "mid", label: "data", delay: 2, color: C.BLUE },
      { a: "mid", b: "rx", label: "data", delay: 3.2, color: C.BLUE },
    ], "mid"),
  },
  {
    id: "dumb", label: "Dumb hardware", color: C.PURPLE,
    notes: [
      { fact: "All the \"dumb\" hardware with no intelligence capability belongs to the Physical layer: cables, consoles, transceivers, CCTV cameras, authentication terminals and hubs.", simple: "These devices only carry or repeat signals. They do not read addresses or make choices." },
    ],
    examples: ["Cables", "Consoles", "Transceivers", "CCTV cameras", "Authentication terminals", "Hubs"],
    analogy: "Like a plain pipe: water goes in one end and comes out the other. The pipe does not decide anything.",
    scene: mk([
      { a: "tx", b: "mid", label: "signal", delay: 0, color: C.PURPLE },
      { a: "mid", b: "rx", label: "signal", delay: 1.2, color: C.PURPLE },
    ], "mid"),
  },
];

export function PhysicalExplorer() {
  const [id, setId] = useState<CId>("medium");
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const c = CONCEPTS.find((x) => x.id === id) ?? CONCEPTS[0];
  return (
    <Shell title="Physical layer (Layer 1)" desc="Layer 1 moves data through the physical medium in binary format and sends and receives the signals.">
      <Pills items={CONCEPTS.map((x) => ({ id: x.id, label: x.label }))} sel={id} set={(v) => { setId(v); setOpen(null); }} color={c.color} />
      <div className={paused ? "pl-paused" : ""}>
        <SceneSvg scene={c.scene} k={id} aria={`Bits and signals travelling along a cable for ${c.label}`}
          stroke={(n) => (c.scene.hot === n ? C.AMBER : GREY)} />
      </div>
      <div><Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>{paused ? "Play animation" : "Pause animation"}</Button></div>
      <div key={id} className="pl-fade flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: c.color }}>Facts from your notes (tap one)</p>
        {c.notes.map((n, i) => (
          <button key={i} onClick={() => setOpen(open === i ? null : i)} className="rounded-xl border bg-background p-3 text-left text-xs leading-5 transition-colors"
            style={{ borderColor: open === i ? c.color : `${c.color}88` }}>
            <span className="font-medium">{n.fact}</span>
            {open === i && <span className="pl-fade mt-1 block text-muted-foreground">💬 {n.simple}</span>}
          </button>
        ))}
        <div className="flex flex-wrap gap-2">
          {c.examples.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}
        </div>
        <Tip color={c.color}>{c.analogy}</Tip>
      </div>
      <Tip color={C.BLUE}>Layer 1 carries bits as signals over the physical medium.</Tip>
    </Shell>
  );
}

/* ---------- Section 2: Binary lab ---------- */
type Msg = { id: string; label: string; text: string; bits: string };
const toBits = (t: string): string => t.split("").map((ch) => ch.charCodeAt(0).toString(2).padStart(8, "0")).join("");
const MSGS: Msg[] = ["A", "Hi", "OK"].map((t) => ({ id: t, label: `Send "${t}"`, text: t, bits: toBits(t) }));

export function BinaryLab() {
  const [sel, setSel] = useState<string>("A");
  const [n, setN] = useState(0);
  const [running, setRunning] = useState(false);
  const m = MSGS.find((x) => x.id === sel) ?? MSGS[0];
  const total = m.bits.length;

  useEffect(() => {
    if (!running) return;
    if (n >= total) { setRunning(false); return; }
    const t = setTimeout(() => setN((v) => v + 1), 250 * SLOW);
    return () => clearTimeout(t);
  }, [running, n, total]);

  const pick = (v: string) => { setSel(v); setN(0); setRunning(false); };
  const sent = m.bits.slice(0, n);
  const finished = n >= total;
  const scene: Scene = { groups: LINE, nodes: [TX, MID, RX], links: [["tx", "mid"], ["mid", "rx"]], flows: running ? [{ a: "tx", b: "mid", label: m.bits[Math.max(n - 1, 0)] ?? "0", delay: 0, color: C.AMBER }, { a: "mid", b: "rx", label: m.bits[Math.max(n - 1, 0)] ?? "0", delay: 0.8, color: C.AMBER }] : [], dur: 1.6, hot: running ? "mid" : undefined };
  const received = finished ? m.text : "";

  return (
    <Shell title="Binary format and signals" desc="Pick a message. The sender turns each letter into 8 bits and sends them as signals. The bits shown are the standard 8-bit codes.">
      <Pills items={MSGS.map((x) => ({ id: x.id, label: x.label }))} sel={sel} set={pick} color={C.BLUE} />
      <div className="rounded-xl border bg-background p-4">
        <p className="text-xs text-muted-foreground">Message to send</p>
        <p className="mt-1 font-mono text-lg font-semibold" style={{ color: C.BLUE }}>{m.text}</p>
        <p className="mt-3 text-xs text-muted-foreground">Bits on the cable ({n} of {total} sent)</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {m.bits.split("").map((b, i) => (
            <span key={`${sel}-${i}`} className={`flex h-7 w-6 items-center justify-center rounded border font-mono text-xs ${i < n ? "pl-pop" : ""}`}
              style={i < n ? { background: b === "1" ? `${C.AMBER}18` : `${C.BLUE}18`, borderColor: b === "1" ? C.AMBER : C.BLUE, color: b === "1" ? C.AMBER : C.BLUE, fontWeight: 700 } : { borderColor: `${GREY}66`, color: GREY }}>
              {b}
            </span>
          ))}
        </div>
      </div>
      <SceneSvg scene={scene} k={`${sel}-${n}`} vh={260} aria="Bits travelling from a sender along a cable to a receiver"
        stroke={(id) => (id === "rx" && finished ? C.GREEN : id === "tx" && running ? C.AMBER : scene.hot === id ? C.AMBER : GREY)}
        extra={finished ? <text key={`${sel}-done`} x={510} y={106} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN} className="pl-fade">✓ received</text> : null} />
      <div key={`${sel}-${finished}`} className="pl-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: finished ? C.GREEN : C.AMBER, color: finished ? C.GREEN : C.AMBER }}>
        {finished ? `The receiver got all ${total} bits and read them back as "${received}".` : running ? "The sender is putting one bit at a time on the cable as a signal." : n > 0 ? "Paused. Press Resume to keep sending." : "Press Send bits to start."}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={finished} onClick={() => setRunning((r) => !r)}>{running ? "Pause" : n === 0 ? "Send bits" : "Resume"}</Button>
        <Button variant="outline" size="sm" onClick={() => { setRunning(false); setN(0); }}>Reset</Button>
      </div>
      <Tip color={C.BLUE}>Rule: everything on the cable is binary, only 1s and 0s sent as signals.</Tip>
    </Shell>
  );
}

/* ---------- Section 3: Dumb hardware lab ---------- */
type Dev = { id: string; e: string; name: string; layer1: boolean; why: string };
const DEVICES: Dev[] = [
  { id: "cable", e: "🔌", name: "Cable", layer1: true, why: "A cable only carries the signal. It has no intelligence." },
  { id: "console", e: "⌨️", name: "Console", layer1: true, why: "A console is listed in your notes as dumb Layer 1 hardware." },
  { id: "trans", e: "📡", name: "Transceiver", layer1: true, why: "A transceiver sends and receives signals and does not make decisions." },
  { id: "cctv", e: "📹", name: "CCTV camera", layer1: true, why: "A CCTV camera is listed in your notes as dumb Layer 1 hardware." },
  { id: "auth", e: "🔒", name: "Authentication terminal", layer1: true, why: "An authentication terminal is listed in your notes as dumb Layer 1 hardware." },
  { id: "hub", e: "🔁", name: "Hub", layer1: true, why: "A hub has no intelligence. It just repeats the signal." },
  { id: "switch", e: "🔀", name: "Switch", layer1: false, why: "A switch is smarter. It reads MAC addresses, so it is a Layer 2 device." },
  { id: "router", e: "🏢", name: "Router", layer1: false, why: "A router reads IP addresses, so it is a Layer 3 device." },
];
type Guess = Record<string, boolean | undefined>;

export function DumbHardwareLab() {
  const [guess, setGuess] = useState<Guess>({});
  const [sel, setSel] = useState<string>("cable");
  const [hubOn, setHubOn] = useState(true);
  const d = DEVICES.find((x) => x.id === sel) ?? DEVICES[0];
  const g = guess[d.id];
  const answered = Object.keys(guess).length;
  const right = DEVICES.filter((x) => guess[x.id] === x.layer1).length;

  const hubNodes: SceneNode[] = [
    { id: "a", x: 80, y: 70, e: "💻", l: "PC A" },
    { id: "b", x: 80, y: 230, e: "💻", l: "PC B" },
    { id: "h", x: 300, y: 150, e: "🔁", l: "Hub", sub: "Layer 1" },
    { id: "c", x: 520, y: 70, e: "💻", l: "PC C" },
    { id: "d", x: 520, y: 230, e: "💻", l: "PC D" },
  ];
  const hubLinks: [Id, Id][] = [["a", "h"], ["b", "h"], ["h", "c"], ["h", "d"]];
  const hubScene: Scene = {
    groups: [], nodes: hubNodes, links: hubLinks, dur: 2.4, hot: "h",
    flows: hubOn
      ? [{ a: "a", b: "h", label: "signal", delay: 0, color: C.PURPLE }, { a: "h", b: "b", label: "signal", delay: 1.2, color: C.PURPLE }, { a: "h", b: "c", label: "signal", delay: 1.2, color: C.PURPLE }, { a: "h", b: "d", label: "signal", delay: 1.2, color: C.PURPLE }]
      : [{ a: "a", b: "h", label: "signal", delay: 0, color: C.PURPLE }],
  };

  return (
    <Shell title="Dumb hardware at Layer 1" desc="Tap a device, then decide if it is Layer 1 dumb hardware. Then see what a hub does.">
      <div className="flex flex-wrap gap-2">
        {DEVICES.map((x) => {
          const gs = guess[x.id];
          const style: CSSProperties = sel === x.id
            ? { background: C.PURPLE, borderColor: C.PURPLE, color: "#fff" }
            : gs === undefined ? { borderColor: `${C.PURPLE}66`, color: C.PURPLE }
            : gs === x.layer1 ? { borderColor: C.GREEN, color: C.GREEN, background: `${C.GREEN}18` }
            : { borderColor: C.RED, color: C.RED, background: `${C.RED}18` };
          return (
            <button key={x.id} onClick={() => setSel(x.id)} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors" style={style}>
              {x.e} {x.name}
            </button>
          );
        })}
      </div>
      <div key={`${sel}-${g}`} className="pl-fade rounded-xl border bg-background p-4" style={{ borderColor: g === undefined ? `${C.PURPLE}88` : g === d.layer1 ? C.GREEN : C.RED }}>
        <p className="text-sm font-semibold" style={{ color: C.PURPLE }}>{d.e} {d.name}: is it dumb Layer 1 hardware?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={g !== undefined} onClick={() => setGuess((p) => ({ ...p, [d.id]: true }))}>Yes, Layer 1</Button>
          <Button size="sm" variant="outline" disabled={g !== undefined} onClick={() => setGuess((p) => ({ ...p, [d.id]: false }))}>No, higher layer</Button>
        </div>
        {g !== undefined && (
          <p className="pl-fade mt-2 text-xs leading-5" style={{ color: g === d.layer1 ? C.GREEN : C.RED }}>
            {g === d.layer1 ? "✓ Correct. " : "✕ Not quite. "}{d.why}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Answered {answered} of {DEVICES.length}. Correct: {right}.</p>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: C.PURPLE }}>Hub demo: a hub has no intelligence</p>
        <Pills<"on" | "off"> items={[{ id: "on", label: "Hub repeats to all ports" }, { id: "off", label: "Show only the input" }]} sel={hubOn ? "on" : "off"} set={(v) => setHubOn(v === "on")} color={C.PURPLE} />
        <SceneSvg scene={hubScene} k={hubOn ? "on" : "off"} aria="PC A sends a signal into a hub and the hub repeats it to every other port" stroke={(n) => (n === "h" ? C.AMBER : GREY)} />
        <div key={String(hubOn)} className="pl-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: C.AMBER, color: C.AMBER }}>
          {hubOn ? "The hub does not read any address. It repeats the signal out of every other port." : "PC A sends a signal into the hub. Press the other button to see where the hub sends it."}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setGuess({})}>Reset answers</Button>
      </div>
      <Tip color={C.PURPLE}>Rule: no intelligence means Layer 1. Cables, consoles, transceivers, CCTV cameras, authentication terminals and hubs.</Tip>
    </Shell>
  );
}

/* ---------- Main ---------- */
export function PhysicalLayer() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <style>{`
@keyframes pl-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
@keyframes pl-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes pl-dash { to { stroke-dashoffset: -26; } }
@keyframes pl-pop  { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
@keyframes pl-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
@keyframes pl-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.pl-pkt  { animation: pl-move 2s linear infinite both; }
.pl-fade { animation: pl-fade ${0.5 * SLOW}s ease-out both; }
.pl-dash { animation: pl-dash ${1.2 * SLOW}s linear infinite; }
.pl-pop  { animation: pl-pop ${0.4 * SLOW}s ease-out both; }
.pl-ring { animation: pl-ring ${1.6 * SLOW}s ease-out infinite; }
.pl-shake { animation: pl-shake .4s ease-in-out; }
.pl-paused .pl-pkt, .pl-paused .pl-dash { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .pl-pkt, .pl-fade, .pl-dash, .pl-pop, .pl-ring, .pl-shake { animation: none; opacity: 1; } .pl-pkt { transform: translate(var(--x1), var(--y1)); } }
`}</style>
      <h1 className="text-xl font-semibold">Physical layer: binary format, physical transmission</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Layer 1 is responsible for transferring data through the physical medium in binary format, along with sending and receiving the signals.</p>
      <PhysicalExplorer />
      <BinaryLab />
      <DumbHardwareLab />
    </div>
  );
}

export default PhysicalLayer;