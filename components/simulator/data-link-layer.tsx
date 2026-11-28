"use client";
import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * DataLinkLayer (Layer 2: frames, MAC addressing and OUI, CAM tables)
 * 1. DataLinkExplorer: tap each fact about Layer 2 and watch frames move inside a network.
 * 2. MacAddressLab: the 48-bit MAC address, OUI and Host ID, with a bit counter.
 * 3. FrameJourney: step-by-step trip of one frame with a live CAM table.
 * 4. AgingLab: MAC address aging time of 300 seconds with a countdown.
 * 5. QuickReference: one table with every fact.
 * 6. DataLinkQuiz: practice quiz.
 * Rule to remember: Layer 2 reads the destination MAC address, and the switch uses its CAM table to send the frame out of the right switchport.
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
    <g className="dl-pkt" style={{ "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties}>
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
          return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="dl-dash" stroke={GREY} strokeWidth={2} strokeDasharray="7 6" />;
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
const PA: SceneNode = { id: "pa", x: 80, y: 70, e: "💻", l: "PC A" };
const PB: SceneNode = { id: "pb", x: 80, y: 230, e: "💻", l: "PC B" };
const SW: SceneNode = { id: "sw", x: 300, y: 150, e: "🔌", l: "Switch", sub: "Layer 2" };
const PC3: SceneNode = { id: "pc", x: 520, y: 150, e: "🖥️", l: "PC C" };
const LAN: Group[] = [{ x: 15, y: 20, w: 570, h: 285, label: "One network (L2 communication)", color: C.BLUE }];
const LNK: [Id, Id][] = [["pa", "sw"], ["pb", "sw"], ["sw", "pc"]];
const mk = (flows: Flow[], hot?: Id): Scene => ({ groups: LAN, nodes: [PA, PB, SW, PC3], links: LNK, flows, dur: 2.4, hot });

type CId = "frame" | "mac" | "switch" | "cam" | "hdr" | "age";
type Concept = { id: CId; label: string; color: string; notes: { fact: string; simple: string }[]; examples: string[]; analogy: string; scene: Scene };

const CONCEPTS: Concept[] = [
  {
    id: "frame", label: "Frames and the local network", color: C.BLUE,
    notes: [
      { fact: "The PDU name is frame.", simple: "At Layer 2 the data is wrapped as a frame." },
      { fact: "Responsible for communication inside the network (L2 communication), based on the MAC address of devices.", simple: "Devices in the same network find each other by MAC address." },
    ],
    examples: ["Frame", "L2 communication", "MAC address"],
    analogy: "Like passing a note to a neighbour in the same street. You only need their house name, not a city address.",
    scene: mk([
      { a: "pa", b: "sw", label: "frame", delay: 0, color: C.BLUE },
      { a: "sw", b: "pb", label: "frame", delay: 1.2, color: C.BLUE },
    ]),
  },
  {
    id: "mac", label: "MAC address", color: C.PURPLE,
    notes: [
      { fact: "A MAC address (Media Access Control) is a 48-bit address, written in hexadecimal format.", simple: "It is a long number shown with the digits 0 to 9 and the letters A to F." },
      { fact: "It is assigned by the manufacturer on every device, so it is globally unique.", simple: "The maker puts it on the device, and no other device in the world has the same one." },
      { fact: "It has two parts: the first 24 bits are the OUI and the remaining bits are the Host ID.", simple: "One half says who made it. The other half says which device it is." },
    ],
    examples: ["48-bit", "Hexadecimal", "OUI", "Host ID"],
    analogy: "Like a car number plate made at the factory. It stays with the car wherever it goes.",
    scene: mk([
      { a: "pa", b: "sw", label: "src MAC", delay: 0, color: C.PURPLE },
      { a: "sw", b: "pb", label: "dst MAC", delay: 1.2, color: C.PURPLE },
    ]),
  },
  {
    id: "switch", label: "Switch", color: C.AMBER,
    notes: [
      { fact: "A switch is a Layer 2 device because it forwards frames between devices inside the network.", simple: "A switch passes frames between the devices plugged into it." },
    ],
    examples: ["Switch", "Layer 2 device", "Forwards frames"],
    analogy: "Like a receptionist who hands each message to the right desk in one office.",
    scene: mk([
      { a: "pa", b: "sw", label: "frame", delay: 0, color: C.BLUE },
      { a: "sw", b: "pc", label: "frame", delay: 1.2, color: C.BLUE },
    ], "sw"),
  },
  {
    id: "cam", label: "CAM table", color: C.GREEN,
    notes: [
      { fact: "A switch maintains the MAC address table, also called the CAM table (Content Addressable Memory).", simple: "The switch keeps a list in its memory. It has two names: MAC address table and CAM table." },
      { fact: "The table stores the MAC address of connected devices and their switchport information.", simple: "Each row says which MAC address is behind which switchport." },
    ],
    examples: ["CAM table", "MAC address table", "Switchport"],
    analogy: "Like a phone book that says which room each person sits in.",
    scene: mk([
      { a: "pa", b: "sw", label: "dst MAC?", delay: 0, color: C.AMBER },
      { a: "sw", b: "pb", label: "Port 2", delay: 1.2, color: C.GREEN },
    ], "sw"),
  },
  {
    id: "hdr", label: "Layer 2 header", color: C.TEAL,
    notes: [
      { fact: "The Data-Link layer is responsible for encapsulating the Layer 2 header (source and destination MAC address) and decapsulating it.", simple: "The sender adds the header with both MAC addresses. The receiver removes it." },
      { fact: "The Layer 2 header also contains a checksum (hash value) for error checking.", simple: "The receiver can test the frame to see if it was damaged." },
    ],
    examples: ["Source MAC", "Destination MAC", "Checksum", "Encapsulation"],
    analogy: "Like an envelope with a sender name, a receiver name and a seal.",
    scene: mk([
      { a: "pa", b: "sw", label: "L2 hdr + data", delay: 0, color: C.TEAL },
      { a: "sw", b: "pb", label: "L2 hdr + data", delay: 1.2, color: C.TEAL },
    ]),
  },
  {
    id: "age", label: "Aging time", color: C.ORANGE,
    notes: [
      { fact: "MAC address aging time in switches is 300 seconds (5 minutes).", simple: "An unused row is removed after 300 seconds, which is 5 minutes." },
    ],
    examples: ["300 seconds", "5 minutes", "Aging"],
    analogy: "Like a sticky note that is thrown away if nobody reads it for 5 minutes.",
    scene: mk([
      { a: "pa", b: "sw", label: "frame", delay: 0, color: C.BLUE },
      { a: "sw", b: "pb", label: "frame", delay: 1.2, color: C.BLUE },
    ], "sw"),
  },
];

export function DataLinkExplorer() {
  const [id, setId] = useState<CId>("frame");
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const c = CONCEPTS.find((x) => x.id === id) ?? CONCEPTS[0];
  return (
    <Shell title="Data-Link layer (Layer 2)" desc="Layer 2 handles communication inside the network using MAC addresses. Switches keep CAM tables.">
      <Pills items={CONCEPTS.map((x) => ({ id: x.id, label: x.label }))} sel={id} set={(v) => { setId(v); setOpen(null); }} color={c.color} />
      <div className={paused ? "dl-paused" : ""}>
        <SceneSvg scene={c.scene} k={id} aria={`Frames moving through a switch inside one network for ${c.label}`}
          stroke={(n) => (c.scene.hot === n ? C.AMBER : GREY)} />
      </div>
      <div><Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>{paused ? "Play animation" : "Pause animation"}</Button></div>
      <div key={id} className="dl-fade flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: c.color }}>Facts from your notes (tap one)</p>
        {c.notes.map((n, i) => (
          <button key={i} onClick={() => setOpen(open === i ? null : i)} className="rounded-xl border bg-background p-3 text-left text-xs leading-5 transition-colors"
            style={{ borderColor: open === i ? c.color : `${c.color}88` }}>
            <span className="font-medium">{n.fact}</span>
            {open === i && <span className="dl-fade mt-1 block text-muted-foreground">💬 {n.simple}</span>}
          </button>
        ))}
        <div className="flex flex-wrap gap-2">
          {c.examples.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}
        </div>
        <Tip color={c.color}>{c.analogy}</Tip>
      </div>
      <Tip color={C.BLUE}>Layer 2 uses MAC addresses to move frames between devices inside one network.</Tip>
    </Shell>
  );
}

/* ---------- Section 2: MAC address lab ---------- */
type MacPart = { id: "oui" | "host"; label: string; bits: number; hex: string; color: string; simple: string };
const MAC_PARTS: MacPart[] = [
  { id: "oui", label: "OUI", bits: 24, hex: "00:00:5E", color: C.PURPLE, simple: "Organisationally Unique Identifier. The first 24 bits show the manufacturer." },
  { id: "host", label: "Host ID", bits: 24, hex: "00:53:0A", color: C.TEAL, simple: "The remaining bits show the device." },
];
const MAC_FACTS: { fact: string; simple: string }[] = [
  { fact: "48-bit address", simple: "The whole address is 48 bits long." },
  { fact: "Written in hexadecimal format", simple: "It uses the digits 0 to 9 and the letters A to F." },
  { fact: "Assigned by the manufacturer on every device, globally unique", simple: "The maker sets it, and no two devices share it." },
];

export function MacAddressLab() {
  const [sel, setSel] = useState<"oui" | "host">("oui");
  const [open, setOpen] = useState<number | null>(null);
  const part = MAC_PARTS.find((p) => p.id === sel) ?? MAC_PARTS[0];
  const total = 48;
  return (
    <Shell title="MAC address (Media Access Control)" desc="Tap a part of the address. The MAC address below is an example.">
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <div className="mx-auto flex min-w-[360px] max-w-[640px] gap-1">
          {MAC_PARTS.map((p) => (
            <button key={p.id} onClick={() => setSel(p.id)} className="rounded-lg border-2 px-3 py-4 text-center transition-colors"
              style={{ width: `${(p.bits / total) * 100}%`, borderColor: sel === p.id ? p.color : `${p.color}66`, background: sel === p.id ? `${p.color}18` : undefined }}>
              <span className="block font-mono text-sm font-semibold" style={{ color: p.color }}>{p.hex}</span>
              <span className="block text-[11px] font-semibold" style={{ color: p.color }}>{p.label}</span>
              <span className="block text-[11px] text-muted-foreground">{p.bits} bits</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-[11px] text-muted-foreground">24 bits + 24 bits = {total} bits in total</p>
      </div>
      <div key={sel} className="dl-fade rounded-xl border bg-background p-4" style={{ borderColor: `${part.color}88` }}>
        <p className="text-sm font-semibold" style={{ color: part.color }}>{part.label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">💬 {part.simple}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: C.PURPLE }}>Facts from your notes (tap one)</p>
        {MAC_FACTS.map((f, i) => (
          <button key={f.fact} onClick={() => setOpen(open === i ? null : i)} className="rounded-xl border bg-background p-3 text-left text-xs leading-5 transition-colors"
            style={{ borderColor: open === i ? C.PURPLE : `${C.PURPLE}88` }}>
            <span className="font-medium">{f.fact}</span>
            {open === i && <span className="dl-fade mt-1 block text-muted-foreground">💬 {f.simple}</span>}
          </button>
        ))}
      </div>
      <Tip color={C.PURPLE}>Rule: MAC address = 24-bit OUI (manufacturer) + Host ID (device).</Tip>
    </Shell>
  );
}

/* ---------- Section 3: Frame journey ---------- */
type CamRow = { mac: string; port: string; dev: string };
type Step = {
  title: string; text: string;
  packets: { from: Id; to: Id; label: string; delay?: number }[];
  focus: Id[]; frame?: [string, string][]; accept?: Id[]; adds?: CamRow[]; match?: string;
};
const PHASES = ["Send", "Learn", "Forward", "Receive"];
const PHASE_OF = [0, 1, 2, 3];
const FRAME: [string, string][] = [["Destination MAC", "00:00:5E:00:53:0B"], ["Source MAC", "00:00:5E:00:53:0A"], ["Checksum", "hash value"], ["Data", "your data"]];
const FC: Record<string, string> = { "Destination MAC": C.PURPLE, "Source MAC": C.BLUE, Checksum: C.AMBER };
const STEPS: Step[] = [
  { title: "PC A adds the Layer 2 header", text: "This is encapsulation. PC A adds the source MAC, the destination MAC and a checksum to make a frame.", packets: [{ from: "pa", to: "sw", label: "frame" }], focus: ["pa"], frame: FRAME },
  { title: "The switch stores the source MAC", text: "The switch writes PC A's MAC address and its switchport into the CAM table.", packets: [], focus: ["sw"], adds: [{ mac: "00:00:5E:00:53:0A", port: "Port 1", dev: "PC A" }] },
  { title: "The switch finds the destination", text: "The switch looks for the destination MAC in the CAM table. In this example it already knows PC B is on Port 2.", packets: [], focus: ["sw"], adds: [{ mac: "00:00:5E:00:53:0B", port: "Port 2", dev: "PC B" }], match: "00:00:5E:00:53:0B" },
  { title: "The switch forwards the frame", text: "The switch sends the frame out of Port 2 only.", packets: [{ from: "sw", to: "pb", label: "frame" }], focus: ["sw"], match: "00:00:5E:00:53:0B" },
  { title: "PC B removes the Layer 2 header", text: "PC B checks the checksum. Then it removes the header (decapsulation) and reads the data.", packets: [], focus: [], accept: ["pb"] },
];

export function FrameJourney() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const N = STEPS.length;
  useEffect(() => {
    if (!playing) return;
    if (step >= N) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), 5500);
    return () => clearTimeout(t);
  }, [playing, step, N]);

  const cur = step > 0 ? STEPS[step - 1] : undefined;
  const rows = STEPS.slice(0, step).flatMap((s) => s.adds ?? []);
  const prevCount = STEPS.slice(0, Math.max(step - 1, 0)).flatMap((s) => s.adds ?? []).length;
  const frame = [...STEPS.slice(0, step)].reverse().find((s) => s.frame)?.frame;
  const nodes: SceneNode[] = [PA, PB, SW, PC3];
  const scene: Scene = { groups: LAN, nodes, links: LNK, dur: 2, flows: (cur?.packets ?? []).map((p) => ({ a: p.from, b: p.to, label: p.label, delay: p.delay ?? 0, color: C.BLUE })) };
  const accept = cur?.accept ?? [];
  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (step === 0 || step >= N) setStep(1);
    setPlaying(true);
  };
  const curPhase = cur ? PHASE_OF[step - 1] : -1;

  return (
    <Shell title="Follow one frame" desc="Watch a frame go from PC A to PC B through a switch. MAC addresses are examples.">
      <div className="flex flex-wrap gap-2">
        {PHASES.map((p, i) => {
          const state = curPhase < 0 ? "todo" : i === curPhase ? "active" : i < curPhase ? "done" : "todo";
          return (
            <span key={p} className="rounded-full border px-3 py-1 text-xs font-medium"
              style={state === "active" ? { background: C.AMBER, borderColor: C.AMBER, color: "#fff" } : state === "done" ? { background: `${C.GREEN}18`, borderColor: `${C.GREEN}66`, color: C.GREEN } : { borderColor: GREY + "66", color: GREY }}>
              {i + 1}. {p}
            </span>
          );
        })}
      </div>
      <SceneSvg scene={scene} k={`${step}`} aria="A frame travelling from PC A through a switch to PC B"
        stroke={(n) => (accept.includes(n) ? C.GREEN : cur?.focus.includes(n) ? C.AMBER : GREY)}
        extra={accept.map((n) => {
          const p = at(scene, n);
          return <text key={`${step}-${n}`} x={p.x} y={p.y - 40} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN} className="dl-fade" style={{ animationDelay: `${0.5 * SLOW}s` }}>✓ accepts</text>;
        })} />
      <div key={step} className="dl-fade rounded-xl border bg-background p-4" style={{ borderColor: cur ? `${C.AMBER}88` : undefined }}>
        <p className="text-sm font-semibold" style={{ color: C.AMBER }}>{cur ? `Step ${step} of ${N}: ${cur.title}` : `Step 0 of ${N}`}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{cur ? cur.text : "Press Start to follow the frame."}</p>
      </div>
      {frame && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-muted/50"><tr>{frame.map(([h]) => <th key={h} className="px-3 py-2" style={{ color: FC[h] }}>{h}</th>)}</tr></thead>
            <tbody><tr className="border-t">{frame.map(([h, v]) => <td key={h} className="px-3 py-2 font-mono" style={{ color: FC[h] }}>{v}</td>)}</tr></tbody>
          </table>
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold" style={{ color: C.GREEN }}>Switch CAM table (example)</p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="bg-muted/50"><tr><th className="px-3 py-2">MAC address</th><th className="px-3 py-2">Switchport</th><th className="px-3 py-2">Device</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr className="border-t"><td colSpan={3} className="px-3 py-2 text-muted-foreground">Empty. The switch has not learned any MAC address yet.</td></tr>}
              {rows.map((r, i) => {
                const fresh = i >= prevCount && step > 0;
                const hit = cur?.match === r.mac;
                return (
                  <tr key={`${step}-${r.mac}`} className={`border-t ${fresh ? "dl-fade font-bold" : ""}`}
                    style={fresh ? { background: `${C.GREEN}18`, color: C.GREEN } : hit ? { background: `${C.AMBER}18`, color: C.AMBER, fontWeight: 700 } : undefined}>
                    <td className="px-3 py-2 font-mono">{r.mac}</td><td className="px-3 py-2">{r.port}</td><td className="px-3 py-2">{r.dev}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={step === 0} onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }}>Back</Button>
        <Button size="sm" onClick={() => setStep(step >= N ? 1 : step + 1)}>{step === 0 ? "Start" : step >= N ? "Replay" : "Next step"}</Button>
        <Button variant="outline" size="sm" onClick={toggle}>{playing ? "Pause" : "Auto-play"}</Button>
        <Button variant="outline" size="sm" onClick={() => { setPlaying(false); setStep(0); }}>Reset</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Step</th><th className="px-3 py-2">What happens</th></tr></thead>
          <tbody>
            {STEPS.map((s, i) => (
              <tr key={s.title} className="border-t" style={step === i + 1 ? { background: `${C.AMBER}18`, fontWeight: 700 } : undefined}>
                <td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{s.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.AMBER}>Rule: the switch reads the destination MAC, finds it in the CAM table, and sends the frame out of that switchport.</Tip>
    </Shell>
  );
}

/* ---------- Section 4: Aging lab ---------- */
const AGE_TOTAL = 300;
const AGE_ROW: CamRow = { mac: "00:00:5E:00:53:0A", port: "Port 1", dev: "PC A" };
const AGE_FACTS: string[] = ["MAC address aging time in switches is 300 seconds.", "300 seconds is 5 minutes."];

export function AgingLab() {
  const [left, setLeft] = useState(AGE_TOTAL);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (left <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setLeft((s) => Math.max(0, s - 10)), 100);
    return () => clearTimeout(t);
  }, [running, left]);

  const gone = left <= 0;
  const pct = (left / AGE_TOTAL) * 100;
  const col = gone ? C.RED : left <= 60 ? C.AMBER : C.GREEN;
  const mins = Math.floor(left / 60);
  const secs = left % 60;
  return (
    <Shell title="MAC address aging time" desc="Start the timer to see an unused entry age out. The timer is sped up so you do not wait 5 minutes.">
      <div className="rounded-xl border bg-background p-4">
        <p className="text-xs text-muted-foreground">Time left before the entry is removed</p>
        <p className="mt-1 font-mono text-2xl font-semibold" style={{ color: col }}>{mins}:{String(secs).padStart(2, "0")}</p>
        <div className="mt-2 h-3 rounded-full bg-muted">
          <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: col, transition: "width .1s linear, background .4s" }} />
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{left} of {AGE_TOTAL} seconds</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">MAC address</th><th className="px-3 py-2">Switchport</th><th className="px-3 py-2">Device</th></tr></thead>
          <tbody>
            <tr key={gone ? "gone" : "here"} className="dl-fade border-t" style={{ background: `${col}18`, color: col, fontWeight: 700 }}>
              {gone ? <td colSpan={3} className="px-3 py-2">Entry removed. The switch must learn this MAC address again.</td>
                : <><td className="px-3 py-2 font-mono">{AGE_ROW.mac}</td><td className="px-3 py-2">{AGE_ROW.port}</td><td className="px-3 py-2">{AGE_ROW.dev}</td></>}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={gone} onClick={() => setRunning((r) => !r)}>{running ? "Pause timer" : left === AGE_TOTAL ? "Start timer" : "Resume timer"}</Button>
        <Button variant="outline" size="sm" onClick={() => { setRunning(false); setLeft(AGE_TOTAL); }}>Reset</Button>
      </div>
      <div className="flex flex-col gap-1">
        {AGE_FACTS.map((f) => <p key={f} className="text-xs leading-5 text-muted-foreground">• {f}</p>)}
      </div>
      <Tip color={C.ORANGE}>Rule: aging time is 300 seconds (5 minutes).</Tip>
    </Shell>
  );
}

/* ---------- Section 5: Quick reference ---------- */
const REF: { topic: string; detail: string }[] = [
  { topic: "Layer", detail: "Data-Link layer (2nd layer)" },
  { topic: "PDU name", detail: "Frame" },
  { topic: "Works inside", detail: "The network (L2 communication), based on MAC address" },
  { topic: "Device", detail: "Switch (a Layer 2 device that forwards frames inside the network)" },
  { topic: "Switch table", detail: "MAC address table, also called CAM table (Content Addressable Memory)" },
  { topic: "CAM table stores", detail: "MAC address of connected devices and their switchport information" },
  { topic: "MAC address size", detail: "48-bit, written in hexadecimal" },
  { topic: "MAC address origin", detail: "Assigned by the manufacturer on every device, globally unique" },
  { topic: "First 24 bits", detail: "OUI (Organisationally Unique Identifier), the manufacturer" },
  { topic: "Remaining bits", detail: "Host ID, the device" },
  { topic: "Header job", detail: "Encapsulating and decapsulating the Layer 2 header (source and destination MAC)" },
  { topic: "Error check", detail: "Checksum (hash value) in the Layer 2 header" },
  { topic: "Aging time", detail: "300 seconds (5 minutes)" },
];

export function QuickReference() {
  return (
    <Shell title="Quick reference" desc="Every fact about Layer 2 in one table." badge="Reference">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Topic</th><th className="px-3 py-2">Detail</th></tr></thead>
          <tbody>{REF.map((r) => <tr key={r.topic} className="border-t"><td className="px-3 py-2 font-semibold">{r.topic}</td><td className="px-3 py-2">{r.detail}</td></tr>)}</tbody>
        </table>
      </div>
      <Tip color={C.BLUE}>Layer 2 = frames + MAC addresses + switches + CAM table.</Tip>
    </Shell>
  );
}

/* ---------- Section 6: Quiz ---------- */
type Q = { q: string; opts: string[]; ans: number; why: string };
const QUIZ: Q[] = [
  { q: "What is the PDU name at the Data-Link layer?", opts: ["Packet", "Frame", "Segment", "Bit"], ans: 1, why: "At Layer 2 the PDU is called a frame." },
  { q: "Which layer is the Data-Link layer?", opts: ["1st", "2nd", "3rd", "4th"], ans: 1, why: "The Data-Link layer is the 2nd layer." },
  { q: "What does Layer 2 use to communicate inside the network?", opts: ["MAC address", "Cable colour", "Screen size", "Port speed"], ans: 0, why: "L2 communication is based on the MAC address of devices." },
  { q: "Why is a switch a Layer 2 device?", opts: ["It stores files", "It forwards frames between devices inside the network", "It makes power", "It has two ports"], ans: 1, why: "A switch forwards frames between devices inside the network." },
  { q: "What is another name for the MAC address table?", opts: ["Routing table", "CAM table", "DNS table", "Cable table"], ans: 1, why: "It is also called the CAM table (Content Addressable Memory)." },
  { q: "What does the CAM table store?", opts: ["Passwords", "MAC addresses and switchport information", "Web pages", "IP headers only"], ans: 1, why: "It stores the MAC address of connected devices and their switchport information." },
  { q: "How long is a MAC address?", opts: ["24 bits", "32 bits", "48 bits", "128 bits"], ans: 2, why: "A MAC address is 48 bits, written in hexadecimal." },
  { q: "What do the first 24 bits of a MAC address show?", opts: ["The OUI (manufacturer)", "The Host ID", "The checksum", "The switchport"], ans: 0, why: "The first 24 bits are the OUI. The remaining bits are the Host ID." },
  { q: "What is the MAC address aging time in switches?", opts: ["30 seconds", "60 seconds", "300 seconds", "3000 seconds"], ans: 2, why: "The aging time is 300 seconds, which is 5 minutes." },
  { q: "What does the checksum in the Layer 2 header do?", opts: ["Checks for errors", "Chooses the colour", "Names the switch", "Speeds up the cable"], ans: 0, why: "The checksum (hash value) is used for error checking." },
];

export function DataLinkQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ[i];
  const answer = (n: number) => { if (pick !== null) return; setPick(n); if (n === q.ans) setScore((s) => s + 1); };
  const next = () => { if (i === QUIZ.length - 1) setDone(true); else { setI(i + 1); setPick(null); } };
  const restart = () => { setI(0); setPick(null); setScore(0); setDone(false); };
  return (
    <Shell title="Practice quiz" desc="Test what you learned about the Data-Link layer." badge="Quiz">
      {done ? (
        <div className="dl-fade rounded-xl border bg-background p-4 text-center">
          <p className="text-sm font-semibold" style={{ color: C.GREEN }}>You scored {score} out of {QUIZ.length}.</p>
          <div className="mt-3"><Button size="sm" onClick={restart}>Restart</Button></div>
        </div>
      ) : (
        <div key={i} className="dl-fade flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">Question {i + 1} of {QUIZ.length}</p>
          <p className="text-sm font-semibold">{q.q}</p>
          <div className="flex flex-col gap-2">
            {q.opts.map((o, n) => {
              const style: CSSProperties | undefined = pick === null ? undefined
                : n === q.ans ? { background: `${C.GREEN}18`, borderColor: C.GREEN, color: C.GREEN }
                : n === pick ? { background: `${C.RED}18`, borderColor: C.RED, color: C.RED } : undefined;
              return (
                <button key={o} disabled={pick !== null} onClick={() => answer(n)} className="w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors" style={style}>{o}</button>
              );
            })}
          </div>
          {pick !== null && <p className="dl-fade text-xs leading-5 text-muted-foreground">💬 {q.why}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={pick === null} onClick={next}>{i === QUIZ.length - 1 ? "See score" : "Next question"}</Button>
            <Button size="sm" variant="outline" onClick={restart}>Restart</Button>
          </div>
        </div>
      )}
      <Tip color={C.PURPLE}>Remember: frame, MAC address, switch, CAM table, 300 seconds.</Tip>
    </Shell>
  );
}

/* ---------- Main ---------- */
export function DataLinkLayer() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <style>{`
@keyframes dl-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
@keyframes dl-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes dl-dash { to { stroke-dashoffset: -26; } }
@keyframes dl-pop  { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
@keyframes dl-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
@keyframes dl-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.dl-pkt  { animation: dl-move 2s linear infinite both; }
.dl-fade { animation: dl-fade ${0.5 * SLOW}s ease-out both; }
.dl-dash { animation: dl-dash ${1.2 * SLOW}s linear infinite; }
.dl-pop  { animation: dl-pop ${0.4 * SLOW}s ease-out both; transform-box: fill-box; transform-origin: center; }
.dl-ring { animation: dl-ring ${1.6 * SLOW}s ease-out infinite; }
.dl-shake { animation: dl-shake .4s ease-in-out; }
.dl-paused .dl-pkt, .dl-paused .dl-dash { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .dl-pkt, .dl-fade, .dl-dash, .dl-pop, .dl-ring, .dl-shake { animation: none; opacity: 1; } .dl-pkt { transform: translate(var(--x1), var(--y1)); } }
`}</style>
      <h1 className="text-xl font-semibold">Data-Link layer: frames, MAC addressing and OUI, CAM tables</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Layer 2 handles communication inside the network using MAC addresses, and switches maintain CAM tables that map MAC addresses to switchports.</p>
      <DataLinkExplorer />
      <MacAddressLab />
      <FrameJourney />
      <AgingLab />
      <QuickReference />
      <DataLinkQuiz />
    </div>
  );
}

export default DataLinkLayer;