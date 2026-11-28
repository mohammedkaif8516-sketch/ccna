"use client";
import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Switches (MAC/CAM tables, intelligent forwarding, manageable vs non-manageable, Layer 2 vs Layer 3/MLS, ASIC)
 * 1. SwitchExplorer: tap each fact about switches and watch frames move through a switch.
 * 2. LearningLab: step-by-step trip of frames with a live CAM table (learn, broadcast, unicast).
 * 3. BufferLab: interface buffer memory checks a frame for errors before forwarding.
 * 4. TypesLab: non-manageable vs manageable switches.
 * 5. L3Lab: L2 switch vs L3 switch (MLS), with routing disabled by default.
 * 6. AsicLab: the ASIC and high-speed forwarding.
 * 7. DomainLab: one shared broadcast domain, one collision domain per port.
 * 8. QuickReference: one table with every fact.
 * Rule to remember: a switch learns source MACs, unicasts when it knows the destination, broadcasts when it does not, and gives every port its own collision domain.
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
    <g className="sw-pkt" style={{ "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties}>
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
          return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="sw-dash" stroke={GREY} strokeWidth={2} strokeDasharray="7 6" />;
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

/* ---------- Shared switch topology ---------- */
const PA: SceneNode = { id: "a", x: 80, y: 70, e: "💻", l: "PC A", sub: "Port 1" };
const PB: SceneNode = { id: "b", x: 80, y: 250, e: "💻", l: "PC B", sub: "Port 2" };
const SWN: SceneNode = { id: "s", x: 300, y: 160, e: "🔌", l: "Switch", sub: "Layer 2" };
const PCC: SceneNode = { id: "c", x: 520, y: 70, e: "💻", l: "PC C", sub: "Port 3" };
const PD: SceneNode = { id: "d", x: 520, y: 250, e: "💻", l: "PC D", sub: "Port 4" };
const SNODES: SceneNode[] = [PA, PB, SWN, PCC, PD];
const SLINKS: [Id, Id][] = [["a", "s"], ["b", "s"], ["s", "c"], ["s", "d"]];
const HOSTS: Id[] = ["a", "b", "c", "d"];
const grp = (label: string, color: string): Group[] => [{ x: 15, y: 20, w: 570, h: 290, label, color }];
const mk = (flows: Flow[], groups: Group[], hot?: Id, dur = 2.4): Scene => ({ groups, nodes: SNODES, links: SLINKS, flows, dur, hot });
const spread = (label: string, color: string, from: Id = "a"): Flow[] => [
  { a: from, b: "s", label, delay: 0, color },
  ...HOSTS.filter((x) => x !== from).map((x) => ({ a: "s", b: x, label, delay: 1.2, color })),
];

/* ---------- Section 1: Explorer data ---------- */
type CId = "what" | "cam" | "fwd" | "err" | "types" | "l3" | "asic" | "dom";
type Concept = { id: CId; label: string; color: string; notes: { fact: string; simple: string }[]; examples: string[]; analogy: string; scene: Scene };

const ADMIN_NODES: SceneNode[] = [PA, PB, SWN, PCC, { id: "adm", x: 300, y: 45, e: "⌨️", l: "Admin", sub: "Console" }];

const CONCEPTS: Concept[] = [
  {
    id: "what", label: "What a switch is", color: C.BLUE,
    notes: [
      { fact: "A switch is a Layer 2 device that operates in the Data-Link layer.", simple: "A switch works with frames and MAC addresses." },
      { fact: "A switch enables L2 connectivity (connectivity inside the network).", simple: "It lets devices in the same network talk to each other." },
      { fact: "A switch maintains the MAC address table, also called the CAM (Content Addressable Memory) table.", simple: "It keeps a list in memory. The list has two names." },
    ],
    examples: ["Layer 2", "Data-Link layer", "L2 connectivity", "CAM table"],
    analogy: "Like a receptionist who knows which desk each person sits at and sends each message straight there.",
    scene: mk([{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "b", label: "frame", delay: 1.2, color: C.BLUE }], grp("One network (L2 connectivity)", C.BLUE), "s"),
  },
  {
    id: "cam", label: "CAM table", color: C.GREEN,
    notes: [
      { fact: "The CAM table stores the MAC address.", simple: "It remembers which device owns which address." },
      { fact: "The CAM table stores the switch port.", simple: "It remembers which port the device is behind." },
      { fact: "The CAM table stores whether it was learned as static or dynamic.", simple: "Dynamic means the switch learned it by itself. Static means it was added by hand." },
      { fact: "The CAM table stores the VLAN.", simple: "It also remembers which VLAN the entry belongs to." },
    ],
    examples: ["MAC address", "Switch port", "Static", "Dynamic", "VLAN"],
    analogy: "Like a seating chart with a name, a seat number and a team colour.",
    scene: mk([{ a: "a", b: "s", label: "src MAC", delay: 0, color: C.PURPLE }, { a: "s", b: "c", label: "Port 3", delay: 1.2, color: C.GREEN }], grp("One network (L2 connectivity)", C.BLUE), "s"),
  },
  {
    id: "fwd", label: "Intelligent forwarding", color: C.AMBER,
    notes: [
      { fact: "When a switch receives a frame, it checks the source and destination MAC address.", simple: "It reads who sent the frame and who it is for." },
      { fact: "If the source MAC address is new, the switch stores that information in the MAC address table.", simple: "A new sender gets written into the table." },
      { fact: "If the destination MAC address is not in the table, the switch broadcasts the traffic.", simple: "If it does not know the receiver, it asks everyone by sending to every other port." },
      { fact: "If the destination MAC address is in the table, the switch unicasts the traffic.", simple: "If it knows the receiver, it sends to that one port only." },
      { fact: "A switch is basically an observing device. It observes every incoming frame and learns from it.", simple: "Each frame teaches the switch something new." },
    ],
    examples: ["Source MAC", "Destination MAC", "Broadcast", "Unicast", "Learning"],
    analogy: "Like a new waiter who writes down where each guest sits, and asks the whole room only when a guest is unknown.",
    scene: mk(spread("unknown dst", C.AMBER), grp("Destination not in the table: broadcast", C.AMBER), "s"),
  },
  {
    id: "err", label: "Error checking", color: C.RED,
    notes: [
      { fact: "A switch can perform error checking, since every switch port has buffer memory for checking headers (errors).", simple: "Each port holds the frame for a moment and checks the header." },
      { fact: "Interface buffer memory is used for error checking before forwarding.", simple: "The check happens first. Only then does the frame move on." },
    ],
    examples: ["Buffer memory", "Header check", "Before forwarding"],
    analogy: "Like a post office clerk who looks at each parcel before it goes on the van.",
    scene: mk([{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "c", label: "checked", delay: 1.2, color: C.GREEN }], grp("One network (L2 connectivity)", C.BLUE), "s"),
  },
  {
    id: "types", label: "Types of switches", color: C.PURPLE,
    notes: [
      { fact: "Non-manageable switches are non-manageable and non-configurable.", simple: "You cannot change their settings." },
      { fact: "Non-manageable switches have no console port.", simple: "There is nowhere to plug in to configure them." },
      { fact: "Non-manageable switches provide the basic switching function (forwarding frames inside the network).", simple: "They only do the plain job of moving frames." },
      { fact: "Non-manageable switches have a lower price and are ideal for small office or home network environments.", simple: "They are cheap and fine for small places." },
      { fact: "Manageable switches can be configured and managed, and a console port is present.", simple: "You can plug in and change the settings." },
      { fact: "Manageable switches provide switch functionality and more, are ideal for large enterprise environments, and have a higher price.", simple: "They do more and cost more, so big companies use them." },
    ],
    examples: ["Non-manageable", "Manageable", "L2 switch", "L3 switch (MLS)"],
    analogy: "Like a plain light switch versus a smart control panel: one just works, the other can be set up.",
    scene: { groups: [], nodes: ADMIN_NODES, links: [["a", "s"], ["s", "c"], ["adm", "s"]], flows: [{ a: "adm", b: "s", label: "config", delay: 0, color: C.GREEN }, { a: "a", b: "s", label: "frame", delay: 1, color: C.BLUE }, { a: "s", b: "c", label: "frame", delay: 2.2, color: C.BLUE }], dur: 2.4, hot: "s" },
  },
  {
    id: "l3", label: "L2 vs L3 (MLS)", color: C.TEAL,
    notes: [
      { fact: "L2 switches operate in the Data-Link layer, forward frames between devices based only on the MAC table, and can only check Layer 2 headers.", simple: "An L2 switch only looks at MAC addresses." },
      { fact: "L3 switches (also called MLS, Multi-Layer Switch) provide both L2 and L3 functionality, so they can perform switching and routing.", simple: "An L3 switch can switch and route." },
      { fact: "An L3 switch forwards frames based on the MAC table after checking the L2 header, and can also forward packets based on the routing table after checking the L3 header.", simple: "It uses the MAC table for frames and the routing table for packets." },
      { fact: "Routing is disabled by default on an L3 switch.", simple: "You must turn routing on yourself." },
    ],
    examples: ["L2 switch", "L3 switch", "MLS", "Routing table", "Routing off by default"],
    analogy: "Like a street guide (L2) versus a guide who also knows the roads between towns (L3).",
    scene: { groups: [], nodes: [PA, { id: "s", x: 300, y: 160, e: "🔀", l: "L3 switch", sub: "L2 + L3" }, PCC], links: [["a", "s"], ["s", "c"]], flows: [{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "c", label: "packet", delay: 1.2, color: C.BLUE }], dur: 2.4, hot: "s" },
  },
  {
    id: "asic", label: "ASIC", color: C.ORANGE,
    notes: [
      { fact: "ASIC (Application Specific Integrated Circuit) is responsible for high-speed data traffic forwarding in switches.", simple: "It is the part that moves frames very fast." },
      { fact: "An ASIC is a special hardware circuit that helps switches handle high volumes of traffic.", simple: "It is built just for this job, so lots of traffic is no problem." },
    ],
    examples: ["ASIC", "Special hardware circuit", "High speed"],
    analogy: "Like a conveyor belt built for parcels: much faster than carrying each one by hand.",
    scene: mk([
      { a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "b", b: "s", label: "frame", delay: 0.3, color: C.BLUE },
      { a: "s", b: "c", label: "frame", delay: 0.6, color: C.BLUE }, { a: "s", b: "d", label: "frame", delay: 0.9, color: C.BLUE },
    ], grp("Fast forwarding", C.ORANGE), "s", 1.2),
  },
  {
    id: "dom", label: "Domains", color: C.PINK,
    notes: [
      { fact: "Every switch port belongs to a single (shared) broadcast domain.", simple: "A broadcast reaches every port on the switch." },
      { fact: "Every switch port has its own collision domain.", simple: "Each port is its own separate space, so devices do not crash into each other." },
    ],
    examples: ["Broadcast domain", "Collision domain", "One per port"],
    analogy: "Like a classroom with one loudspeaker for everyone, but a private desk for each student.",
    scene: mk(spread("broadcast", C.AMBER), grp("One shared broadcast domain", C.PINK), "s"),
  },
];

export function SwitchExplorer() {
  const [id, setId] = useState<CId>("what");
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const c = CONCEPTS.find((x) => x.id === id) ?? CONCEPTS[0];
  return (
    <Shell title="Switches" desc="A switch is a Layer 2 device that maintains a MAC/CAM table and forwards frames intelligently based on what it has learned.">
      <Pills items={CONCEPTS.map((x) => ({ id: x.id, label: x.label }))} sel={id} set={(v) => { setId(v); setOpen(null); }} color={c.color} />
      <div className={paused ? "sw-paused" : ""}>
        <SceneSvg scene={c.scene} k={id} aria={`Frames moving through a switch for ${c.label}`} stroke={(n) => (c.scene.hot === n ? C.AMBER : GREY)} />
      </div>
      <div><Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>{paused ? "Play animation" : "Pause animation"}</Button></div>
      <div key={id} className="sw-fade flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: c.color }}>Facts from your notes (tap one)</p>
        {c.notes.map((n, i) => (
          <button key={i} onClick={() => setOpen(open === i ? null : i)} className="rounded-xl border bg-background p-3 text-left text-xs leading-5 transition-colors"
            style={{ borderColor: open === i ? c.color : `${c.color}88` }}>
            <span className="font-medium">{n.fact}</span>
            {open === i && <span className="sw-fade mt-1 block text-muted-foreground">💬 {n.simple}</span>}
          </button>
        ))}
        <div className="flex flex-wrap gap-2">{c.examples.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}</div>
        <Tip color={c.color}>{c.analogy}</Tip>
      </div>
      <Tip color={C.BLUE}>A switch learns from every frame, so it can send traffic only where it needs to go.</Tip>
    </Shell>
  );
}

/* ---------- Section 2: Learning lab ---------- */
type Pk = { from: Id; to: Id; label: string; delay?: number; color?: string };
type Row = { mac: string; port: string; kind: string; vlan: string; dev: string };
type Step = {
  phase: number; title: string; text: string; packets: Pk[]; focus: Id[];
  frame?: [string, string][]; accept?: Id[]; discard?: Id[]; adds?: Row[]; match?: string;
};
const MAC_A = "00:00:5E:00:53:0A";
const MAC_C = "00:00:5E:00:53:0C";
const PHASES = ["Send", "Learn", "Broadcast", "Reply", "Unicast"];
const FRAME1: [string, string][] = [["Destination MAC", MAC_C], ["Source MAC", MAC_A], ["Checksum", "hash value"], ["Data", "your data"]];
const FRAME2: [string, string][] = [["Destination MAC", MAC_A], ["Source MAC", MAC_C], ["Checksum", "hash value"], ["Data", "your reply"]];
const FC: Record<string, string> = { "Destination MAC": C.PURPLE, "Source MAC": C.BLUE, Checksum: C.AMBER };
const STEPS: Step[] = [
  { phase: 0, title: "PC A sends a frame to PC C", text: "PC A adds the Layer 2 header with the source and destination MAC address. The frame goes to the switch.", packets: [{ from: "a", to: "s", label: "frame" }], focus: ["a"], frame: FRAME1 },
  { phase: 1, title: "The switch learns the source MAC", text: "The source MAC address is new, so the switch stores it in the MAC address table with Port 1.", packets: [], focus: ["s"], adds: [{ mac: MAC_A, port: "Port 1", kind: "Dynamic", vlan: "VLAN 1", dev: "PC A" }] },
  { phase: 2, title: "The destination is not in the table", text: "The switch does not know PC C yet, so it broadcasts the frame out of every other port.", packets: [{ from: "s", to: "b", label: "frame", color: C.AMBER }, { from: "s", to: "c", label: "frame", color: C.AMBER }, { from: "s", to: "d", label: "frame", color: C.AMBER }], focus: ["s"] },
  { phase: 2, title: "Only the destination accepts", text: "PC C checks the header and accepts the frame. PC B and PC D discard it.", packets: [], focus: [], accept: ["c"], discard: ["b", "d"] },
  { phase: 3, title: "PC C replies", text: "PC C sends a reply to PC A. The source MAC is new, so the switch stores PC C with Port 3.", packets: [{ from: "c", to: "s", label: "reply" }], focus: ["c", "s"], frame: FRAME2, adds: [{ mac: MAC_C, port: "Port 3", kind: "Dynamic", vlan: "VLAN 1", dev: "PC C" }] },
  { phase: 4, title: "The switch unicasts the reply", text: "PC A is in the table, so the switch sends the frame out of Port 1 only.", packets: [{ from: "s", to: "a", label: "reply" }], focus: ["s"], match: MAC_A, accept: ["a"] },
];

export function LearningLab() {
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
  const scene: Scene = { groups: grp("One network", C.BLUE), nodes: SNODES, links: SLINKS, dur: 2, flows: (cur?.packets ?? []).map((p) => ({ a: p.from, b: p.to, label: p.label, delay: p.delay ?? 0, color: p.color ?? C.BLUE })) };
  const accept = cur?.accept ?? [];
  const discard = cur?.discard ?? [];
  const badges = [...accept.map((n) => ({ n, ok: true })), ...discard.map((n) => ({ n, ok: false }))];
  const badgeDelay = cur && cur.packets.length > 0 ? 1.8 * SLOW : 0.3;
  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (step === 0 || step >= N) setStep(1);
    setPlaying(true);
  };
  const curPhase = cur ? cur.phase : -1;

  return (
    <Shell title="Watch a switch learn" desc="Follow the frames and see how the CAM table fills up. MAC addresses and VLAN are examples.">
      <div className="flex flex-wrap gap-2">
        {PHASES.map((p, i) => {
          const state = curPhase < 0 ? "todo" : i === curPhase ? "active" : i < curPhase ? "done" : "todo";
          return (
            <span key={p} className="rounded-full border px-3 py-1 text-xs font-medium"
              style={state === "active" ? { background: C.AMBER, borderColor: C.AMBER, color: "#fff" } : state === "done" ? { background: `${C.GREEN}18`, borderColor: `${C.GREEN}66`, color: C.GREEN } : { borderColor: `${GREY}66`, color: GREY }}>
              {i + 1}. {p}
            </span>
          );
        })}
      </div>
      <SceneSvg scene={scene} k={`${step}`} aria="Frames moving between four PCs and a switch"
        stroke={(n) => (accept.includes(n) ? C.GREEN : discard.includes(n) ? C.RED : cur?.focus.includes(n) ? C.AMBER : GREY)}
        extra={badges.map((b) => {
          const p = at(scene, b.n);
          return <text key={`${step}-${b.n}`} x={p.x} y={p.y - 40} textAnchor="middle" fontSize={11} fontWeight={700} fill={b.ok ? C.GREEN : C.RED} className="sw-fade" style={{ animationDelay: `${badgeDelay}s` }}>{b.ok ? "✓ accepts" : "✕ discards"}</text>;
        })} />
      <div key={step} className="sw-fade rounded-xl border bg-background p-4" style={{ borderColor: cur ? `${C.AMBER}88` : undefined }}>
        <p className="text-sm font-semibold" style={{ color: C.AMBER }}>{cur ? `Step ${step} of ${N}: ${cur.title}` : `Step 0 of ${N}`}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{cur ? cur.text : "Press Start to follow the frames."}</p>
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
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-muted/50"><tr><th className="px-3 py-2">MAC address</th><th className="px-3 py-2">Switch port</th><th className="px-3 py-2">Learning</th><th className="px-3 py-2">VLAN</th><th className="px-3 py-2">Device</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr className="border-t"><td colSpan={5} className="px-3 py-2 text-muted-foreground">Empty. The switch has not learned any MAC address yet.</td></tr>}
              {rows.map((r, i) => {
                const fresh = i >= prevCount && step > 0;
                const hit = cur?.match === r.mac;
                return (
                  <tr key={`${step}-${r.mac}`} className={`border-t ${fresh ? "sw-fade font-bold" : ""}`}
                    style={fresh ? { background: `${C.GREEN}18`, color: C.GREEN } : hit ? { background: `${C.AMBER}18`, color: C.AMBER, fontWeight: 700 } : undefined}>
                    <td className="px-3 py-2 font-mono">{r.mac}</td><td className="px-3 py-2">{r.port}</td><td className="px-3 py-2">{r.kind}</td><td className="px-3 py-2">{r.vlan}</td><td className="px-3 py-2">{r.dev}</td>
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
      <Tip color={C.AMBER}>Rule: new source MAC means learn it. Unknown destination means broadcast. Known destination means unicast.</Tip>
    </Shell>
  );
}

/* ---------- Section 3: Buffer lab ---------- */
type Frm = "good" | "bad";
const BN: SceneNode[] = [
  { id: "a", x: 80, y: 120, e: "💻", l: "PC A" },
  { id: "s", x: 300, y: 120, e: "🔌", l: "Switch", sub: "Buffer memory" },
  { id: "c", x: 520, y: 120, e: "💻", l: "PC C" },
];
const BSTEPS: { id: string; text: string }[] = [
  { id: "in", text: "The frame enters the interface and waits in the buffer memory." },
  { id: "chk", text: "The switch checks the header for errors." },
  { id: "out", text: "Only then does the switch forward the frame." },
];

export function BufferLab() {
  const [f, setF] = useState<Frm>("good");
  const ok = f === "good";
  const col = ok ? C.GREEN : C.RED;
  const scene: Scene = {
    groups: [], nodes: BN, links: [["a", "s"], ["s", "c"]], dur: 2.4, hot: "s",
    flows: ok ? [{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "c", label: "frame", delay: 1.2, color: C.GREEN }] : [{ a: "a", b: "s", label: "bad frame", delay: 0, color: C.RED }],
  };
  return (
    <Shell title="Interface buffer memory" desc="Every switch port has buffer memory. The switch checks the header for errors before it forwards a frame.">
      <Pills<Frm> items={[{ id: "good", label: "Good frame" }, { id: "bad", label: "Frame with an error" }]} sel={f} set={setF} color={C.BLUE} />
      <SceneSvg scene={scene} k={f} vh={230} aria="A frame is checked in the switch buffer memory before it is forwarded"
        stroke={(n) => (n === "s" ? col : n === "c" && ok ? C.GREEN : GREY)}
        extra={ok
          ? <text key="ok" x={520} y={76} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN} className="sw-fade" style={{ animationDelay: `${1.8 * SLOW}s` }}>✓ accepts</text>
          : <text key="bad" x={300} y={76} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED} className="sw-fade" style={{ animationDelay: `${1.0 * SLOW}s` }}>✕ discards</text>} />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Step</th><th className="px-3 py-2">What the switch does</th></tr></thead>
          <tbody>
            {BSTEPS.map((s, i) => (
              <tr key={`${f}-${s.id}`} className="border-t" style={i === 1 || (i === 2 && ok) ? { background: `${i === 2 ? C.GREEN : col}18`, color: i === 2 ? C.GREEN : col, fontWeight: 700 } : undefined}>
                <td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{s.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div key={f} className="sw-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>
        {ok ? "✓ The header check passes, so the switch forwards the frame." : "✕ The header check finds an error, so the switch does not forward the frame."}
      </div>
      <Tip color={C.RED}>Rule: a switch can check for errors because every port has buffer memory. The check happens before forwarding.</Tip>
    </Shell>
  );
}

/* ---------- Section 4: Types lab ---------- */
type TKey = "non" | "man";
const TYPES: Record<TKey, { label: string; color: string; price: number; msg: string }> = {
  non: { label: "Non-manageable switch", color: C.ORANGE, price: 30, msg: "This switch is non-configurable and has no console port. It only does the basic switching function, so it fits a small office or home network." },
  man: { label: "Manageable switch", color: C.PURPLE, price: 85, msg: "This switch can be configured and managed through its console port. It does switching and more, so it fits large enterprise environments." },
};
const TROWS: { f: string; non: string; man: string }[] = [
  { f: "Configurable", non: "No, non-configurable", man: "Yes, can be configured and managed" },
  { f: "Console port", non: "No console port", man: "Console port is present" },
  { f: "Function", non: "Basic switching (forwarding frames inside the network)", man: "Switch functionality and more" },
  { f: "Price", non: "Lower", man: "Higher" },
  { f: "Ideal for", non: "Small office or home network", man: "Large enterprise environment" },
];

export function TypesLab() {
  const [t, setT] = useState<TKey>("non");
  const v = TYPES[t];
  const man = t === "man";
  const nodes: SceneNode[] = [
    { id: "a", x: 80, y: 160, e: "💻", l: "PC A" },
    { id: "s", x: 300, y: 160, e: "🔌", l: "Switch" },
    { id: "b", x: 520, y: 160, e: "💻", l: "PC B" },
    { id: "adm", x: 300, y: 50, e: "⌨️", l: "Admin", sub: "Console" },
  ];
  const scene: Scene = {
    groups: [], nodes, dur: 2.4, hot: "s",
    links: man ? [["a", "s"], ["s", "b"], ["adm", "s"]] : [["a", "s"], ["s", "b"]],
    flows: man
      ? [{ a: "adm", b: "s", label: "config", delay: 0, color: C.GREEN }, { a: "a", b: "s", label: "frame", delay: 1, color: C.BLUE }, { a: "s", b: "b", label: "frame", delay: 2.2, color: C.BLUE }]
      : [{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "b", label: "frame", delay: 1.2, color: C.BLUE }],
  };
  return (
    <Shell title="Types of switches" desc="Pick a type and see what you can and cannot do with it.">
      <Pills<TKey> items={[{ id: "non", label: "Non-manageable" }, { id: "man", label: "Manageable" }]} sel={t} set={setT} color={v.color} />
      <SceneSvg scene={scene} k={t} vh={260} aria={`A ${v.label} with two PCs and an admin console`} stroke={(n) => (n === "adm" ? (man ? C.GREEN : GREY) : n === "s" ? C.AMBER : GREY)}
        extra={<text key={t} x={300} y={122} textAnchor="middle" fontSize={11} fontWeight={700} fill={man ? C.GREEN : C.RED} className="sw-fade">{man ? "✓ console port" : "✕ no console port"}</text>} />
      <div key={t} className="sw-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: v.color, color: v.color }}>{v.msg}</div>
      <div className="rounded-xl border bg-background p-4">
        <p className="text-xs text-muted-foreground">Price (relative, illustration)</p>
        <div className="mt-2 h-3 rounded-full bg-muted">
          <div className="h-3 rounded-full" style={{ width: `${v.price}%`, background: v.color, transition: "width .5s, background .4s" }} />
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{man ? "Higher price" : "Lower price"}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2"> </th><th className="px-3 py-2">Non-manageable</th><th className="px-3 py-2">Manageable</th></tr></thead>
          <tbody>
            {TROWS.map((r) => (
              <tr key={r.f} className="border-t">
                <td className="px-3 py-2 font-semibold">{r.f}</td>
                <td className="px-3 py-2" style={t === "non" ? { background: `${C.ORANGE}18`, color: C.ORANGE, fontWeight: 700 } : undefined}>{r.non}</td>
                <td className="px-3 py-2" style={t === "man" ? { background: `${C.PURPLE}18`, color: C.PURPLE, fontWeight: 700 } : undefined}>{r.man}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.PURPLE}>Rule: no console port means non-manageable and low cost. A console port means manageable, with more features and a higher price.</Tip>
    </Shell>
  );
}

/* ---------- Section 5: L2 vs L3 lab ---------- */
type Kind = "l2" | "l3";
type Dest = "same" | "other";
type Outcome = { ok: boolean; msg: string };
const outcome = (k: Kind, d: Dest, routing: boolean): Outcome => {
  if (d === "same") return { ok: true, msg: k === "l2" ? "✓ The L2 switch checks the Layer 2 header and forwards the frame using the MAC table." : "✓ The L3 switch checks the L2 header and forwards the frame using the MAC table." };
  if (k === "l2") return { ok: false, msg: "✕ An L2 switch can only check Layer 2 headers, so it cannot use a routing table to reach another network." };
  return routing
    ? { ok: true, msg: "✓ Routing is on. The L3 switch checks the L3 header and forwards the packet using the routing table." }
    : { ok: false, msg: "✕ Routing is disabled by default on an L3 switch, so the packet cannot reach the other network yet. Turn routing on." };
};
const L3ROWS: { f: string; l2: string; l3: string }[] = [
  { f: "Layer", l2: "Data-Link layer", l3: "Data-Link and Network layers" },
  { f: "Also called", l2: "L2 switch", l3: "MLS (Multi-Layer Switch)" },
  { f: "Functions", l2: "Switching", l3: "Switching and routing" },
  { f: "Forwards using", l2: "MAC table only", l3: "MAC table (frames) and routing table (packets)" },
  { f: "Checks", l2: "Layer 2 headers only", l3: "L2 header and L3 header" },
  { f: "Routing", l2: "Not available", l3: "Disabled by default" },
];

export function L3Lab() {
  const [kind, setKind] = useState<Kind>("l2");
  const [dest, setDest] = useState<Dest>("same");
  const [routing, setRouting] = useState(false);
  const o = outcome(kind, dest, routing);
  const col = o.ok ? C.GREEN : C.RED;
  const target: Id = dest === "same" ? "b" : "c";
  const nodes: SceneNode[] = [
    { id: "a", x: 80, y: 70, e: "💻", l: "PC A" },
    { id: "b", x: 80, y: 250, e: "💻", l: "PC B" },
    { id: "s", x: 300, y: 160, e: kind === "l2" ? "🔌" : "🔀", l: kind === "l2" ? "L2 switch" : "L3 switch", sub: kind === "l2" ? "MAC table only" : "MLS" },
    { id: "c", x: 520, y: 160, e: "🖥️", l: "PC C", sub: "Other network" },
  ];
  const groups: Group[] = [{ x: 15, y: 20, w: 340, h: 290, label: "Network A", color: C.BLUE }, { x: 440, y: 100, w: 150, h: 140, label: "Network B", color: C.TEAL }];
  const flows: Flow[] = dest === "same"
    ? [{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "b", label: "frame", delay: 1.2, color: C.BLUE }]
    : o.ok
      ? [{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "c", label: "packet", delay: 1.2, color: C.BLUE }]
      : [{ a: "a", b: "s", label: "packet", delay: 0, color: C.RED }];
  const scene: Scene = { groups, nodes, links: [["a", "s"], ["b", "s"], ["s", "c"]], flows, dur: 2.4, hot: "s" };
  const key = `${kind}-${dest}-${routing}`;
  return (
    <Shell title="L2 switch vs L3 switch (MLS)" desc="Pick a switch and a destination. L3 switches can also route, but routing is off until you turn it on.">
      <Pills<Kind> items={[{ id: "l2", label: "L2 switch" }, { id: "l3", label: "L3 switch (MLS)" }]} sel={kind} set={setKind} color={C.TEAL} />
      <Pills<Dest> items={[{ id: "same", label: "PC A to PC B (same network)" }, { id: "other", label: "PC A to PC C (other network)" }]} sel={dest} set={setDest} color={C.BLUE} />
      <SceneSvg scene={scene} k={key} aria="PC A sends traffic through an L2 or L3 switch to a PC in the same or another network"
        stroke={(n) => (n === "s" ? (o.ok ? C.AMBER : C.RED) : o.ok && n === target ? C.GREEN : GREY)}
        extra={o.ok
          ? <text key={`ok-${key}`} x={at(scene, target).x} y={at(scene, target).y - 40} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN} className="sw-fade" style={{ animationDelay: `${1.8 * SLOW}s` }}>✓ accepts</text>
          : <text key={`no-${key}`} x={300} y={116} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED} className="sw-fade" style={{ animationDelay: `${0.8 * SLOW}s` }}>✕ cannot route</text>} />
      <div key={key} className="sw-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>{o.msg}</div>
      {kind === "l3" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={routing ? "default" : "outline"} onClick={() => setRouting((r) => !r)}>{routing ? "Routing is on. Turn it off" : "Routing is off (default). Turn it on"}</Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2"> </th><th className="px-3 py-2">L2 switch</th><th className="px-3 py-2">L3 switch (MLS)</th></tr></thead>
          <tbody>
            {L3ROWS.map((r) => (
              <tr key={r.f} className="border-t">
                <td className="px-3 py-2 font-semibold">{r.f}</td>
                <td className="px-3 py-2" style={kind === "l2" ? { background: `${C.TEAL}18`, color: C.TEAL, fontWeight: 700 } : undefined}>{r.l2}</td>
                <td className="px-3 py-2" style={kind === "l3" ? { background: `${C.TEAL}18`, color: C.TEAL, fontWeight: 700 } : undefined}>{r.l3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.TEAL}>Rule: an L2 switch uses the MAC table. An L3 switch can also use the routing table, but routing is disabled by default.</Tip>
    </Shell>
  );
}

/* ---------- Section 6: ASIC lab ---------- */
type Load = "light" | "heavy";
export function AsicLab() {
  const [load, setLoad] = useState<Load>("heavy");
  const [asic, setAsic] = useState(true);
  const heavy = load === "heavy";
  const flows: Flow[] = heavy
    ? [
      { a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "b", b: "s", label: "frame", delay: 0.3, color: C.BLUE },
      { a: "s", b: "c", label: "frame", delay: 0.6, color: C.BLUE }, { a: "s", b: "d", label: "frame", delay: 0.9, color: C.BLUE },
      { a: "c", b: "s", label: "frame", delay: 1.2, color: C.BLUE }, { a: "s", b: "a", label: "frame", delay: 1.5, color: C.BLUE },
    ]
    : [{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "s", b: "c", label: "frame", delay: 1.2, color: C.BLUE }];
  const scene: Scene = { groups: grp("Switch forwarding traffic", asic ? C.GREEN : C.RED), nodes: SNODES, links: SLINKS, flows, dur: asic ? 1.2 : 3.2, hot: "s" };
  const bad = heavy && !asic;
  const col = bad ? C.RED : C.GREEN;
  const speed = asic ? 95 : 40;
  const traffic = heavy ? 90 : 20;
  const msg = !heavy
    ? "Traffic is light, so the switch copes either way. The ASIC matters when traffic is high."
    : asic
      ? "✓ The ASIC is a special hardware circuit built for high-speed forwarding, so the switch handles the high volume."
      : "✕ Without the special hardware circuit, the switch struggles to keep up with the high volume of traffic.";
  return (
    <Shell title="ASIC (Application Specific Integrated Circuit)" desc="The ASIC does high-speed forwarding in a switch. The bars are only an illustration.">
      <Pills<Load> items={[{ id: "light", label: "Light traffic" }, { id: "heavy", label: "High volume of traffic" }]} sel={load} set={setLoad} color={C.BLUE} />
      <div><Button size="sm" variant={asic ? "default" : "outline"} onClick={() => setAsic((a) => !a)}>{asic ? "ASIC is on. Turn it off" : "ASIC is off. Turn it on"}</Button></div>
      <SceneSvg scene={scene} k={`${load}-${asic}`} aria="Frames moving quickly or slowly through a switch depending on the ASIC" stroke={(n) => (n === "s" ? (bad ? C.RED : C.AMBER) : GREY)} />
      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <div>
          <p className="text-xs text-muted-foreground">Traffic load (illustration)</p>
          <div className="mt-1 h-3 rounded-full bg-muted"><div className="h-3 rounded-full" style={{ width: `${traffic}%`, background: C.BLUE, transition: "width .5s" }} /></div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Forwarding speed (illustration)</p>
          <div className="mt-1 h-3 rounded-full bg-muted"><div className="h-3 rounded-full" style={{ width: `${speed}%`, background: asic ? C.GREEN : C.RED, transition: "width .5s, background .4s" }} /></div>
        </div>
      </div>
      <div key={`${load}-${asic}`} className="sw-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>{msg}</div>
      <Tip color={C.ORANGE}>Rule: the ASIC is the special hardware circuit that gives a switch high-speed forwarding.</Tip>
    </Shell>
  );
}

/* ---------- Section 7: Domain lab ---------- */
type Dom = "broadcast" | "collision";
const DN: SceneNode[] = [
  { id: "a", x: 80, y: 60, e: "💻", l: "PC A", sub: "Port 1" },
  { id: "b", x: 80, y: 260, e: "💻", l: "PC B", sub: "Port 2" },
  { id: "s", x: 300, y: 160, e: "🔌", l: "Switch", sub: "Layer 2" },
  { id: "c", x: 520, y: 60, e: "💻", l: "PC C", sub: "Port 3" },
  { id: "d", x: 520, y: 260, e: "💻", l: "PC D", sub: "Port 4" },
];
const DGROUPS: Record<Dom, Group[]> = {
  broadcast: [{ x: 15, y: 5, w: 570, h: 330, label: "One shared broadcast domain", color: C.PINK }],
  collision: [
    { x: 15, y: 10, w: 150, h: 125, label: "Port 1 domain", color: C.GREEN },
    { x: 15, y: 205, w: 150, h: 130, label: "Port 2 domain", color: C.GREEN },
    { x: 435, y: 10, w: 150, h: 125, label: "Port 3 domain", color: C.GREEN },
    { x: 435, y: 205, w: 150, h: 130, label: "Port 4 domain", color: C.GREEN },
  ],
};
const DMSG: Record<Dom, string> = {
  broadcast: "Every switch port belongs to a single (shared) broadcast domain, so a broadcast reaches every other port.",
  collision: "Every switch port has its own collision domain. PC A and PC B send at the same time, but there is no collision.",
};

export function DomainLab() {
  const [d, setD] = useState<Dom>("broadcast");
  const col = d === "broadcast" ? C.PINK : C.GREEN;
  const flows: Flow[] = d === "broadcast"
    ? spread("broadcast", C.AMBER)
    : [{ a: "a", b: "s", label: "frame", delay: 0, color: C.BLUE }, { a: "b", b: "s", label: "frame", delay: 0, color: C.BLUE }];
  const scene: Scene = { groups: DGROUPS[d], nodes: DN, links: SLINKS, flows, dur: 2.4, hot: "s" };
  return (
    <Shell title="Broadcast domain and collision domain" desc="A switch shares one broadcast domain across all ports, but gives each port its own collision domain.">
      <Pills<Dom> items={[{ id: "broadcast", label: "Broadcast domain" }, { id: "collision", label: "Collision domains" }]} sel={d} set={setD} color={col} />
      <SceneSvg scene={scene} k={d} vh={340} aria={`A switch showing the ${d} domain`}
        stroke={(n) => (n === "s" ? C.AMBER : d === "collision" ? C.GREEN : GREY)} />
      <div key={d} className="sw-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>{DMSG[d]}</div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Domain</th><th className="px-3 py-2">On a switch</th><th className="px-3 py-2">How many</th></tr></thead>
          <tbody>
            {([
              { id: "broadcast" as Dom, name: "Broadcast domain", on: "Every port belongs to a single (shared) one", n: "One for the whole switch" },
              { id: "collision" as Dom, name: "Collision domain", on: "Every port has its own", n: "One per port" },
            ]).map((r) => (
              <tr key={r.id} className="border-t" style={d === r.id ? { background: `${col}18`, color: col, fontWeight: 700 } : undefined}>
                <td className="px-3 py-2">{r.name}</td><td className="px-3 py-2">{r.on}</td><td className="px-3 py-2">{r.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.PINK}>Rule: one shared broadcast domain, but one collision domain per port.</Tip>
    </Shell>
  );
}

/* ---------- Section 8: Quick reference ---------- */
const REF: { topic: string; detail: string }[] = [
  { topic: "Layer", detail: "Layer 2 device, operates in the Data-Link layer" },
  { topic: "Job", detail: "Enables L2 connectivity (connectivity inside the network)" },
  { topic: "Table", detail: "MAC address table, also called the CAM (Content Addressable Memory) table" },
  { topic: "CAM table stores", detail: "MAC address, switch port, static or dynamic learning, VLAN" },
  { topic: "Checks on every frame", detail: "Source and destination MAC address" },
  { topic: "New source MAC", detail: "Stored in the MAC address table" },
  { topic: "Destination not in table", detail: "The switch broadcasts the traffic" },
  { topic: "Destination in table", detail: "The switch unicasts the traffic" },
  { topic: "Observing device", detail: "Observes every incoming frame and learns from it" },
  { topic: "Error checking", detail: "Every port has buffer memory to check headers (errors) before forwarding" },
  { topic: "Non-manageable switch", detail: "Non-configurable, no console port, basic switching, lower price, small office or home" },
  { topic: "Manageable switch", detail: "Configurable and manageable, console port present, switching and more, large enterprise, higher price" },
  { topic: "L2 switch", detail: "Data-Link layer, forwards frames using only the MAC table, checks only Layer 2 headers" },
  { topic: "L3 switch (MLS)", detail: "Multi-Layer Switch: L2 and L3 functionality, switching and routing" },
  { topic: "L3 forwarding", detail: "Frames by MAC table after the L2 header check. Packets by routing table after the L3 header check." },
  { topic: "L3 routing default", detail: "Routing is disabled by default" },
  { topic: "ASIC", detail: "Application Specific Integrated Circuit: special hardware for high-speed forwarding of high traffic volumes" },
  { topic: "Broadcast domain", detail: "Every switch port belongs to a single (shared) broadcast domain" },
  { topic: "Collision domain", detail: "Every switch port has its own collision domain" },
];

export function QuickReference() {
  return (
    <Shell title="Quick reference" desc="Every fact about switches in one table." badge="Reference">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Topic</th><th className="px-3 py-2">Detail</th></tr></thead>
          <tbody>{REF.map((r) => <tr key={r.topic} className="border-t"><td className="px-3 py-2 font-semibold">{r.topic}</td><td className="px-3 py-2">{r.detail}</td></tr>)}</tbody>
        </table>
      </div>
      <Tip color={C.BLUE}>Switch = Layer 2 + CAM table + learn, unicast or broadcast + one collision domain per port.</Tip>
    </Shell>
  );
}

/* ---------- Section 9: Quiz ---------- */
type Q = { q: string; opts: string[]; ans: number; why: string };
const QUIZ: Q[] = [
  { q: "Which layer does a switch operate in?", opts: ["Physical layer", "Data-Link layer", "Network layer", "Transport layer"], ans: 1, why: "A switch is a Layer 2 device in the Data-Link layer." },
  { q: "What is another name for the MAC address table?", opts: ["Routing table", "CAM table", "DNS table", "ARP cable"], ans: 1, why: "It is also called the CAM (Content Addressable Memory) table." },
  { q: "Which of these does the CAM table NOT store?", opts: ["MAC address", "Switch port", "VLAN", "Screen size"], ans: 3, why: "It stores the MAC address, switch port, static or dynamic learning, and VLAN." },
  { q: "What does a switch do when the source MAC address is new?", opts: ["Deletes the frame", "Stores it in the MAC address table", "Sends it to the router", "Ignores it"], ans: 1, why: "A new source MAC address is stored in the MAC address table." },
  { q: "What happens when the destination MAC address is not in the table?", opts: ["The switch unicasts", "The switch broadcasts", "The switch shuts down", "The switch routes it"], ans: 1, why: "If the destination is not in the table, the switch broadcasts the traffic." },
  { q: "What happens when the destination MAC address is in the table?", opts: ["Unicast", "Broadcast", "Discard all", "Loop forever"], ans: 0, why: "If it is in the table, the switch unicasts the traffic." },
  { q: "Why can a switch check frames for errors?", opts: ["Every port has buffer memory for checking headers", "It has a screen", "It has a console", "It uses wireless"], ans: 0, why: "Every switch port has buffer memory for checking headers (errors) before forwarding." },
  { q: "Which switch has no console port?", opts: ["Manageable", "Non-manageable", "L3 switch", "Enterprise switch"], ans: 1, why: "Non-manageable switches have no console port and cannot be configured." },
  { q: "Which switch is ideal for large enterprise environments?", opts: ["Non-manageable", "Manageable", "A hub", "A cable"], ans: 1, why: "Manageable switches suit large enterprises and have a higher price." },
  { q: "What does MLS stand for?", opts: ["Multi-Layer Switch", "Main Local Server", "Media Link Signal", "Multiple Line Socket"], ans: 0, why: "An L3 switch is also called an MLS, a Multi-Layer Switch." },
  { q: "What can an L3 switch do that an L2 switch cannot?", opts: ["Routing as well as switching", "Make coffee", "Remove the MAC table", "Use only hubs"], ans: 0, why: "An L3 switch provides both L2 and L3 functionality: switching and routing." },
  { q: "What is the default routing state on an L3 switch?", opts: ["Enabled", "Disabled", "Random", "Only on weekends"], ans: 1, why: "Routing is disabled by default on an L3 switch." },
  { q: "What is the ASIC used for?", opts: ["Storing passwords", "High-speed data traffic forwarding", "Printing frames", "Naming ports"], ans: 1, why: "The ASIC is a special hardware circuit for high-speed forwarding of high traffic volumes." },
  { q: "How many collision domains does a switch have?", opts: ["One for the whole switch", "One per port", "None", "Two"], ans: 1, why: "Every switch port has its own collision domain." },
  { q: "How is the broadcast domain set up on a switch?", opts: ["One per port", "Every port is in a single shared one", "There is none", "Only two ports share one"], ans: 1, why: "Every switch port belongs to a single (shared) broadcast domain." },
];

export function SwitchQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ[i];
  const answer = (n: number) => { if (pick !== null) return; setPick(n); if (n === q.ans) setScore((s) => s + 1); };
  const next = () => { if (i === QUIZ.length - 1) setDone(true); else { setI(i + 1); setPick(null); } };
  const restart = () => { setI(0); setPick(null); setScore(0); setDone(false); };
  return (
    <Shell title="Practice quiz" desc="Test what you learned about switches." badge="Quiz">
      {done ? (
        <div className="sw-fade rounded-xl border bg-background p-4 text-center">
          <p className="text-sm font-semibold" style={{ color: C.GREEN }}>You scored {score} out of {QUIZ.length}.</p>
          <div className="mt-3"><Button size="sm" onClick={restart}>Restart</Button></div>
        </div>
      ) : (
        <div key={i} className="sw-fade flex flex-col gap-3">
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
          {pick !== null && <p className="sw-fade text-xs leading-5 text-muted-foreground">💬 {q.why}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={pick === null} onClick={next}>{i === QUIZ.length - 1 ? "See score" : "Next question"}</Button>
            <Button size="sm" variant="outline" onClick={restart}>Restart</Button>
          </div>
        </div>
      )}
      <Tip color={C.PURPLE}>Remember: learn, unicast, broadcast, buffer check, console port, MLS, ASIC, one collision domain per port.</Tip>
    </Shell>
  );
}

/* ---------- Main ---------- */
export function Switches() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <style>{`
@keyframes sw-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
@keyframes sw-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes sw-dash { to { stroke-dashoffset: -26; } }
@keyframes sw-pop  { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
@keyframes sw-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
@keyframes sw-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.sw-pkt  { animation: sw-move 2s linear infinite both; }
.sw-fade { animation: sw-fade ${0.5 * SLOW}s ease-out both; }
.sw-dash { animation: sw-dash ${1.2 * SLOW}s linear infinite; }
.sw-pop  { animation: sw-pop ${0.4 * SLOW}s ease-out both; transform-box: fill-box; transform-origin: center; }
.sw-ring { animation: sw-ring ${1.6 * SLOW}s ease-out infinite; }
.sw-shake { animation: sw-shake .4s ease-in-out; }
.sw-paused .sw-pkt, .sw-paused .sw-dash { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .sw-pkt, .sw-fade, .sw-dash, .sw-pop, .sw-ring, .sw-shake { animation: none; opacity: 1; } .sw-pkt { transform: translate(var(--x1), var(--y1)); } }
`}</style>
      <h1 className="text-xl font-semibold">Switches: MAC/CAM tables, intelligent forwarding, types, L2 vs L3 and ASIC</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">A switch is a Layer 2 device that maintains a MAC/CAM table and forwards frames intelligently based on what it has learned.</p>
      <SwitchExplorer />
      <LearningLab />
      <BufferLab />
      <TypesLab />
      <L3Lab />
      <AsicLab />
      <DomainLab />
      <QuickReference />
      <SwitchQuiz />
    </div>
  );
}

export default Switches;