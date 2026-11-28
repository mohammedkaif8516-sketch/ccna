"use client";
import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * NetworkLayer (Layer 3: packets, IP headers, routing basics)
 * 1. NetworkLayerExplorer: tap each fact about Layer 3 and watch packets move between networks.
 * 2. PacketJourney: step-by-step trip of one packet with a live routing table.
 * 3. IpHeaderLab: the IP header fields and the checksum test (intact or damaged).
 * 4. SwitchLab: switch and MAC address table compared with the router.
 * 5. QuickReference: one table with every fact.
 * 6. NetworkLayerQuiz: practice quiz.
 * Rule to remember: Layer 3 reads the IP header and sends the packet along the best path between networks.
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
    <g className="nl-pkt" style={{ "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties}>
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
          return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="nl-dash" stroke={GREY} strokeWidth={2} strokeDasharray="7 6" />;
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
const PC: SceneNode = { id: "pc", x: 80, y: 150, e: "💻", l: "PC", sub: "Source" };
const RT: SceneNode = { id: "r", x: 300, y: 150, e: "🔀", l: "Router", sub: "Layer 3" };
const SV: SceneNode = { id: "srv", x: 520, y: 150, e: "🖥️", l: "Server", sub: "Destination" };
const GROUPS: Group[] = [
  { x: 15, y: 80, w: 130, h: 170, label: "Network A", color: C.BLUE },
  { x: 455, y: 80, w: 130, h: 170, label: "Network B", color: C.TEAL },
];
const BASE: [Id, Id][] = [["pc", "r"], ["r", "srv"]];
const mk = (flows: Flow[], hot?: Id): Scene => ({ groups: GROUPS, nodes: [PC, RT, SV], links: BASE, flows, dur: 2.4, hot });

type CId = "fwd" | "router" | "enc" | "best" | "old" | "err";
type Concept = { id: CId; label: string; color: string; notes: { fact: string; simple: string }[]; examples: string[]; analogy: string; scene: Scene };

const CONCEPTS: Concept[] = [
  {
    id: "fwd", label: "Packets and forwarding", color: C.BLUE,
    notes: [
      { fact: "The PDU name is packet.", simple: "At Layer 3 the data is wrapped as a packet." },
      { fact: "Responsible for forwarding packets based on the IP header (source IP, destination IP).", simple: "The layer reads who sent the packet and where it must go, then passes it on." },
      { fact: "IP belongs to the Network layer, so this layer is responsible for communication between networks.", simple: "When two devices sit in different networks, Layer 3 connects them." },
    ],
    examples: ["Packet", "Source IP", "Destination IP"],
    analogy: "Like a parcel: the address label on the outside tells each post office where to send it next.",
    scene: mk([
      { a: "pc", b: "r", label: "packet", delay: 0, color: C.BLUE },
      { a: "r", b: "srv", label: "packet", delay: 1.2, color: C.BLUE },
    ]),
  },
  {
    id: "router", label: "Router", color: C.AMBER,
    notes: [
      { fact: "A router belongs to the Network layer, so it is called a Layer 3 device.", simple: "Routers work with IP addresses, so they live at Layer 3." },
    ],
    examples: ["Router", "Layer 3 device"],
    analogy: "Like a road junction sign that points each car toward the right town.",
    scene: mk([
      { a: "pc", b: "r", label: "dst IP", delay: 0, color: C.BLUE },
      { a: "r", b: "srv", label: "dst IP", delay: 1.2, color: C.BLUE },
    ], "r"),
  },
  {
    id: "enc", label: "Encapsulation", color: C.PURPLE,
    notes: [
      { fact: "Responsible for encapsulation and decapsulation of the IP header.", simple: "The sender adds the IP header (encapsulation). The receiver removes it (decapsulation)." },
    ],
    examples: ["Encapsulation", "Decapsulation", "IP header"],
    analogy: "Like putting a letter in an envelope with an address, then opening the envelope at the other end.",
    scene: mk([
      { a: "pc", b: "r", label: "IP hdr + data", delay: 0, color: C.PURPLE },
      { a: "r", b: "srv", label: "IP hdr + data", delay: 1.2, color: C.PURPLE },
    ]),
  },
  {
    id: "best", label: "Best path", color: C.GREEN,
    notes: [
      { fact: "Responsible for finding the best path between networks.", simple: "If there are several routes, the router picks the best one." },
      { fact: "Once calculated, the best path is stored in the routing table, and the router forwards traffic based on these available routes.", simple: "The router saves the result in a routing table and looks there for every packet." },
    ],
    examples: ["Best path", "Routing table"],
    analogy: "Like a satnav that picks one route and remembers it for the trip.",
    scene: {
      groups: GROUPS,
      nodes: [PC, { id: "r", x: 300, y: 60, e: "🔀", l: "Router 1", sub: "Best path" }, { id: "r2", x: 300, y: 250, e: "🔀", l: "Router 2", sub: "Other route" }, SV],
      links: [["pc", "r"], ["pc", "r2"], ["r", "srv"], ["r2", "srv"]],
      flows: [
        { a: "pc", b: "r", label: "best path", delay: 0, color: C.GREEN },
        { a: "r", b: "srv", label: "best path", delay: 1.2, color: C.GREEN },
      ],
      dur: 2.4, hot: "r",
    },
  },
  {
    id: "old", label: "Older protocols", color: C.ORANGE,
    notes: [
      { fact: "Before IP, other protocols existed for this purpose: IPX (Internetwork Packet Exchange) and AppleTalk.", simple: "IPX and AppleTalk did the same job before IP took over." },
    ],
    examples: ["IPX", "AppleTalk", "IP"],
    analogy: "Like old phone systems that each had their own numbering before one shared standard.",
    scene: mk([
      { a: "pc", b: "r", label: "IPX", delay: 0, color: C.ORANGE },
      { a: "pc", b: "r", label: "AppleTalk", delay: 1, color: C.PURPLE },
      { a: "pc", b: "r", label: "IP", delay: 2, color: C.GREEN },
    ]),
  },
  {
    id: "err", label: "Error control", color: C.RED,
    notes: [
      { fact: "Also responsible for error control: the IP header contains a hash (checksum) value to check packet integrity.", simple: "The checksum lets the receiver test that the header was not changed or damaged." },
    ],
    examples: ["Checksum", "Hash value", "Integrity"],
    analogy: "Like a seal on a jar: if the seal is broken, you know something changed.",
    scene: mk([
      { a: "pc", b: "r", label: "checksum", delay: 0, color: C.AMBER },
      { a: "r", b: "srv", label: "checksum", delay: 1.2, color: C.AMBER },
    ]),
  },
];

export function NetworkLayerExplorer() {
  const [id, setId] = useState<CId>("fwd");
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const c = CONCEPTS.find((x) => x.id === id) ?? CONCEPTS[0];
  return (
    <Shell title="Network layer (Layer 3)" desc="Layer 3 forwards packets using the IP header and finds the best path between networks.">
      <Pills items={CONCEPTS.map((x) => ({ id: x.id, label: x.label }))} sel={id} set={(v) => { setId(v); setOpen(null); }} color={c.color} />
      <div className={paused ? "nl-paused" : ""}>
        <SceneSvg scene={c.scene} k={id} aria={`Packets moving between network A and network B for ${c.label}`}
          stroke={(n) => (c.scene.hot === n ? C.AMBER : GREY)} />
      </div>
      <div><Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>{paused ? "Play animation" : "Pause animation"}</Button></div>
      <div key={id} className="nl-fade flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: c.color }}>Facts from your notes (tap one)</p>
        {c.notes.map((n, i) => (
          <button key={i} onClick={() => setOpen(open === i ? null : i)} className="rounded-xl border bg-background p-3 text-left text-xs leading-5 transition-colors"
            style={{ borderColor: open === i ? c.color : `${c.color}88` }}>
            <span className="font-medium">{n.fact}</span>
            {open === i && <span className="nl-fade mt-1 block text-muted-foreground">💬 {n.simple}</span>}
          </button>
        ))}
        <div className="flex flex-wrap gap-2">
          {c.examples.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}
        </div>
        <Tip color={c.color}>{c.analogy}</Tip>
      </div>
      <Tip color={C.BLUE}>Layer 3 reads the IP header and sends the packet toward its destination network.</Tip>
    </Shell>
  );
}

/* ---------- Section 2: Packet journey ---------- */
type Route = { net: string; via: string; port: string };
type Step = {
  phase: number; title: string; text: string;
  packets: { from: Id; to: Id; label: string; delay?: number }[];
  focus: Id[]; frame?: [string, string][]; accept?: Id[]; adds?: Route[]; match?: number;
};
const PHASES = ["Setup", "Send", "Forward", "Receive"];
const FRAME: [string, string][] = [["Source IP", "192.0.2.10"], ["Destination IP", "198.51.100.20"], ["Checksum", "hash value"], ["Data", "your data"]];
const FC: Record<string, string> = { "Source IP": C.BLUE, "Destination IP": C.PURPLE, Checksum: C.AMBER };
const STEPS: Step[] = [
  { phase: 0, title: "The best path is calculated", text: "The router works out the best path between networks. It stores the result in its routing table.", packets: [], focus: ["r"],
    adds: [{ net: "192.0.2.0/24", via: "Network A", port: "Port 1" }, { net: "198.51.100.0/24", via: "Network B", port: "Port 2" }] },
  { phase: 1, title: "The PC adds the IP header", text: "This is encapsulation. The PC wraps the data in a packet with source IP, destination IP and a checksum.", packets: [{ from: "pc", to: "r", label: "packet" }], focus: ["pc"], frame: FRAME },
  { phase: 2, title: "The router reads the destination IP", text: "The router looks for the destination IP in its routing table and finds the matching route.", packets: [], focus: ["r"], match: 1 },
  { phase: 2, title: "The router forwards the packet", text: "The router sends the packet out of the port in the matching route.", packets: [{ from: "r", to: "srv", label: "packet" }], focus: ["r"], match: 1 },
  { phase: 3, title: "The server removes the IP header", text: "The server checks the checksum. Then it removes the IP header (decapsulation) and reads the data.", packets: [], focus: [], accept: ["srv"] },
];

export function PacketJourney() {
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
  const routes = STEPS.slice(0, step).flatMap((s) => s.adds ?? []);
  const prevCount = STEPS.slice(0, Math.max(step - 1, 0)).flatMap((s) => s.adds ?? []).length;
  const frame = [...STEPS.slice(0, step)].reverse().find((s) => s.frame)?.frame;
  const scene: Scene = { groups: GROUPS, nodes: [PC, RT, SV], links: BASE, dur: 2, flows: (cur?.packets ?? []).map((p) => ({ a: p.from, b: p.to, label: p.label, delay: p.delay ?? 0, color: C.BLUE })) };
  const accept = cur?.accept ?? [];
  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (step === 0 || step >= N) setStep(1);
    setPlaying(true);
  };
  const curPhase = cur ? cur.phase : -1;

  return (
    <Shell title="Follow one packet" desc="Watch a packet go from a PC in network A to a server in network B. IP addresses are examples.">
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
      <SceneSvg scene={scene} k={`${step}`} aria="A packet travelling from a PC through a router to a server"
        stroke={(n) => (accept.includes(n) ? C.GREEN : cur?.focus.includes(n) ? C.AMBER : GREY)}
        extra={accept.map((n) => {
          const p = at(scene, n);
          return <text key={`${step}-${n}`} x={p.x} y={p.y - 40} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN} className="nl-fade" style={{ animationDelay: `${0.5 * SLOW}s` }}>✓ accepts</text>;
        })} />
      <div key={step} className="nl-fade rounded-xl border bg-background p-4" style={{ borderColor: cur ? `${C.AMBER}88` : undefined }}>
        <p className="text-sm font-semibold" style={{ color: C.AMBER }}>{cur ? `Step ${step} of ${N}: ${cur.title}` : `Step 0 of ${N}`}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{cur ? cur.text : "Press Start to follow the packet."}</p>
      </div>
      {frame && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="bg-muted/50"><tr>{frame.map(([h]) => <th key={h} className="px-3 py-2" style={{ color: FC[h] }}>{h}</th>)}</tr></thead>
            <tbody><tr className="border-t">{frame.map(([h, v]) => <td key={h} className="px-3 py-2 font-mono" style={{ color: FC[h] }}>{v}</td>)}</tr></tbody>
          </table>
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold" style={{ color: C.GREEN }}>Router routing table (example)</p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="bg-muted/50"><tr><th className="px-3 py-2">Network</th><th className="px-3 py-2">Where</th><th className="px-3 py-2">Send out of</th></tr></thead>
            <tbody>
              {routes.length === 0 && <tr className="border-t"><td colSpan={3} className="px-3 py-2 text-muted-foreground">Empty. The best path is not stored yet.</td></tr>}
              {routes.map((r, i) => {
                const fresh = i >= prevCount && step > 0;
                const hit = cur?.match === i;
                return (
                  <tr key={`${step}-${r.net}`} className={`border-t ${fresh ? "nl-fade font-bold" : ""}`}
                    style={fresh ? { background: `${C.GREEN}18`, color: C.GREEN } : hit ? { background: `${C.AMBER}18`, color: C.AMBER, fontWeight: 700 } : undefined}>
                    <td className="px-3 py-2 font-mono">{r.net}</td><td className="px-3 py-2">{r.via}</td><td className="px-3 py-2">{r.port}</td>
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
      <Tip color={C.AMBER}>Rule: the router checks the destination IP, finds the route in its table, and forwards the packet.</Tip>
    </Shell>
  );
}

/* ---------- Section 3: IP header lab ---------- */
type HF = { id: string; label: string; value: string; color: string; simple: string };
const HFIELDS: HF[] = [
  { id: "src", label: "Source IP", value: "192.0.2.10", color: C.BLUE, simple: "This says who sent the packet. Replies go back to this address." },
  { id: "dst", label: "Destination IP", value: "198.51.100.20", color: C.PURPLE, simple: "This says where the packet must go. The router uses it to choose the route." },
  { id: "sum", label: "Checksum", value: "hash value", color: C.AMBER, simple: "This hash value is used to check packet integrity. The receiver tests it for errors." },
  { id: "more", label: "Other fields", value: "more fields", color: GREY, simple: "A real IP header has more fields. Your notes focus on the three on the left." },
];
type Arrive = "ok" | "bad";

export function IpHeaderLab() {
  const [sel, setSel] = useState("src");
  const [mode, setMode] = useState<Arrive>("ok");
  const f = HFIELDS.find((x) => x.id === sel) ?? HFIELDS[0];
  const ok = mode === "ok";
  const col = ok ? C.GREEN : C.RED;
  const scene: Scene = {
    groups: [],
    nodes: [{ id: "s", x: 130, y: 80, e: "💻", l: "Sender" }, { id: "d", x: 470, y: 80, e: "🖥️", l: "Receiver" }],
    links: [["s", "d"]],
    flows: [{ a: "s", b: "d", label: ok ? "packet + hash" : "hash mismatch", delay: 0, color: ok ? C.BLUE : C.RED }],
    dur: 2.4,
  };
  return (
    <Shell title="IP header segment" desc="Tap a field in the header. Then test what the checksum does.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {HFIELDS.map((h) => (
          <button key={h.id} onClick={() => setSel(h.id)} className="rounded-xl border p-3 text-left transition-colors"
            style={{ borderColor: sel === h.id ? h.color : `${h.color}66`, background: sel === h.id ? `${h.color}18` : undefined }}>
            <span className="block text-xs font-semibold" style={{ color: h.color }}>{h.label}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">{h.value}</span>
          </button>
        ))}
      </div>
      <div key={sel} className="nl-fade rounded-xl border bg-background p-4" style={{ borderColor: `${f.color}88` }}>
        <p className="text-sm font-semibold" style={{ color: f.color }}>{f.label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">💬 {f.simple}</p>
      </div>
      <Pills<Arrive> items={[{ id: "ok", label: "Packet arrives intact" }, { id: "bad", label: "Packet is damaged" }]} sel={mode} set={setMode} color={C.BLUE} />
      <SceneSvg scene={scene} k={mode} vh={190} aria="A packet with a checksum going from a sender to a receiver"
        stroke={(n) => (n === "d" ? col : GREY)}
        extra={<text key={mode} x={470} y={36} textAnchor="middle" fontSize={11} fontWeight={700} fill={col} className="nl-fade" style={{ animationDelay: `${1.6 * SLOW}s` }}>{ok ? "✓ accepts" : "✕ discards"}</text>} />
      <div key={mode} className="nl-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>
        {ok ? "The checksum matches, so the header is intact. The packet is accepted." : "The checksum does not match, so the packet was changed or damaged. The packet is discarded."}
      </div>
      <Tip color={C.AMBER}>Rule: the IP header holds source IP, destination IP and a checksum for error control.</Tip>
    </Shell>
  );
}

/* ---------- Section 4: Switch and MAC table ---------- */
type Dest = "same" | "other";
const SWN: SceneNode[] = [
  { id: "pa", x: 80, y: 70, e: "💻", l: "PC A" },
  { id: "pb", x: 80, y: 230, e: "💻", l: "PC B" },
  { id: "sw", x: 250, y: 150, e: "🔌", l: "Switch", sub: "Layer 2" },
  { id: "r", x: 420, y: 150, e: "🔀", l: "Router", sub: "Layer 3" },
  { id: "srv", x: 550, y: 150, e: "🖥️", l: "Server" },
];
const SWG: Group[] = [
  { x: 15, y: 20, w: 300, h: 280, label: "Network A", color: C.BLUE },
  { x: 490, y: 100, w: 100, h: 130, label: "Network B", color: C.TEAL },
];
const SWL: [Id, Id][] = [["pa", "sw"], ["pb", "sw"], ["sw", "r"], ["r", "srv"]];
const MACS = [
  { dev: "PC A", mac: "00:00:5E:00:53:0A", port: "Port 1" },
  { dev: "PC B", mac: "00:00:5E:00:53:0B", port: "Port 2" },
  { dev: "Router", mac: "00:00:5E:00:53:0C", port: "Port 3" },
];
const SWF: Record<Dest, { flows: Flow[]; hot: Id; row: number; msg: string }> = {
  same: {
    flows: [{ a: "pa", b: "sw", label: "frame", delay: 0, color: C.BLUE }, { a: "sw", b: "pb", label: "frame", delay: 1.2, color: C.BLUE }],
    hot: "sw", row: 1, msg: "PC B is in the same network. The switch checks its MAC address table and sends the frame out of Port 2.",
  },
  other: {
    flows: [{ a: "pa", b: "sw", label: "frame", delay: 0, color: C.BLUE }, { a: "sw", b: "r", label: "frame", delay: 1, color: C.BLUE }, { a: "r", b: "srv", label: "packet", delay: 2, color: C.BLUE }],
    hot: "r", row: 2, msg: "The server is in another network. The switch passes the frame to the router, and the router forwards the packet using its routing table.",
  },
};
const CMP = [
  { item: "Looks at", sw: "MAC address", rt: "IP address" },
  { item: "Uses a table of", sw: "MAC addresses", rt: "Routes" },
  { item: "Connects", sw: "Devices in one network", rt: "Different networks" },
  { item: "Data unit", sw: "Frame", rt: "Packet" },
];

export function SwitchLab() {
  const [d, setD] = useState<Dest>("same");
  const v = SWF[d];
  const scene: Scene = { groups: SWG, nodes: SWN, links: SWL, flows: v.flows, dur: 3, hot: v.hot };
  return (
    <Shell title="Switch network and MAC address table" desc="Your notes only have a heading here, so this is a short starter. MAC addresses are examples.">
      <Pills<Dest> items={[{ id: "same", label: "PC A to PC B (same network)" }, { id: "other", label: "PC A to server (other network)" }]} sel={d} set={setD} color={C.TEAL} />
      <SceneSvg scene={scene} k={d} aria="A switch with two PCs and a router leading to a server in another network" stroke={(n) => (n === v.hot ? C.AMBER : GREY)} />
      <div key={d} className="nl-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: C.AMBER, color: C.AMBER }}>{v.msg}</div>
      <div>
        <p className="mb-2 text-sm font-semibold" style={{ color: C.TEAL }}>Switch MAC address table (example)</p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="bg-muted/50"><tr><th className="px-3 py-2">Device</th><th className="px-3 py-2">MAC address</th><th className="px-3 py-2">Port</th></tr></thead>
            <tbody>
              {MACS.map((m, i) => (
                <tr key={`${d}-${m.dev}`} className="border-t" style={v.row === i ? { background: `${C.AMBER}18`, color: C.AMBER, fontWeight: 700 } : undefined}>
                  <td className="px-3 py-2">{m.dev}</td><td className="px-3 py-2 font-mono">{m.mac}</td><td className="px-3 py-2">{m.port}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2"> </th><th className="px-3 py-2">Switch</th><th className="px-3 py-2">Router</th></tr></thead>
          <tbody>
            {CMP.map((r) => <tr key={r.item} className="border-t"><td className="px-3 py-2 font-semibold">{r.item}</td><td className="px-3 py-2">{r.sw}</td><td className="px-3 py-2">{r.rt}</td></tr>)}
          </tbody>
        </table>
      </div>
      <Tip color={C.TEAL}>Rule: a switch moves frames inside one network, and a router moves packets between networks.</Tip>
    </Shell>
  );
}

/* ---------- Section 5: Quick reference ---------- */
const REF: { topic: string; detail: string }[] = [
  { topic: "Layer", detail: "Network layer (3rd layer)" },
  { topic: "PDU name", detail: "Packet" },
  { topic: "Forwards based on", detail: "IP header (source IP, destination IP)" },
  { topic: "Works between", detail: "Networks (IP belongs to this layer)" },
  { topic: "Device", detail: "Router (a Layer 3 device)" },
  { topic: "Header job", detail: "Encapsulation and decapsulation of the IP header" },
  { topic: "Best path", detail: "Calculated, then stored in the routing table. The router forwards using these routes." },
  { topic: "Older protocols", detail: "IPX (Internetwork Packet Exchange), AppleTalk" },
  { topic: "Error control", detail: "Hash (checksum) value in the IP header checks packet integrity" },
];

export function QuickReference() {
  return (
    <Shell title="Quick reference" desc="Every fact about Layer 3 in one table." badge="Reference">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Topic</th><th className="px-3 py-2">Detail</th></tr></thead>
          <tbody>{REF.map((r) => <tr key={r.topic} className="border-t"><td className="px-3 py-2 font-semibold">{r.topic}</td><td className="px-3 py-2">{r.detail}</td></tr>)}</tbody>
        </table>
      </div>
      <Tip color={C.BLUE}>Layer 3 = packets + IP + routers + best path.</Tip>
    </Shell>
  );
}

/* ---------- Section 6: Quiz ---------- */
type Q = { q: string; opts: string[]; ans: number; why: string };
const QUIZ: Q[] = [
  { q: "What is the PDU name at the Network layer?", opts: ["Frame", "Packet", "Segment", "Bit"], ans: 1, why: "At Layer 3 the PDU is called a packet." },
  { q: "Which layer is the Network layer?", opts: ["1st", "2nd", "3rd", "4th"], ans: 2, why: "The Network layer is the 3rd layer." },
  { q: "What does Layer 3 use to forward packets?", opts: ["The IP header", "The cable colour", "The port speed", "The screen size"], ans: 0, why: "It forwards using the IP header: source IP and destination IP." },
  { q: "Why is a router called a Layer 3 device?", opts: ["It stores files", "It belongs to the Network layer", "It makes power", "It has three ports"], ans: 1, why: "A router belongs to the Network layer." },
  { q: "What does encapsulation of the IP header mean?", opts: ["Deleting the data", "Adding the IP header to the data", "Cooling the router", "Changing the cable"], ans: 1, why: "The sender adds the IP header. The receiver removes it (decapsulation)." },
  { q: "Where is the best path stored after it is calculated?", opts: ["In the routing table", "In the cable", "In the monitor", "In the MAC address"], ans: 0, why: "The best path is stored in the routing table, and the router forwards using it." },
  { q: "Which of these were used before IP?", opts: ["HTTP and DNS", "IPX and AppleTalk", "USB and HDMI", "Wi-Fi and Bluetooth"], ans: 1, why: "IPX and AppleTalk existed before IP." },
  { q: "What does the checksum in the IP header do?", opts: ["Speeds up the packet", "Checks packet integrity", "Chooses the colour", "Names the device"], ans: 1, why: "The hash (checksum) value is used for error control and checks integrity." },
];

export function NetworkLayerQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ[i];
  const answer = (n: number) => { if (pick !== null) return; setPick(n); if (n === q.ans) setScore((s) => s + 1); };
  const next = () => { if (i === QUIZ.length - 1) setDone(true); else { setI(i + 1); setPick(null); } };
  const restart = () => { setI(0); setPick(null); setScore(0); setDone(false); };
  return (
    <Shell title="Practice quiz" desc="Test what you learned about the Network layer." badge="Quiz">
      {done ? (
        <div className="nl-fade rounded-xl border bg-background p-4 text-center">
          <p className="text-sm font-semibold" style={{ color: C.GREEN }}>You scored {score} out of {QUIZ.length}.</p>
          <div className="mt-3"><Button size="sm" onClick={restart}>Restart</Button></div>
        </div>
      ) : (
        <div key={i} className="nl-fade flex flex-col gap-3">
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
          {pick !== null && <p className="nl-fade text-xs leading-5 text-muted-foreground">💬 {q.why}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={pick === null} onClick={next}>{i === QUIZ.length - 1 ? "See score" : "Next question"}</Button>
            <Button size="sm" variant="outline" onClick={restart}>Restart</Button>
          </div>
        </div>
      )}
      <Tip color={C.PURPLE}>Remember: packet, IP header, router, best path, checksum.</Tip>
    </Shell>
  );
}

/* ---------- Main ---------- */
export function NetworkLayer() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <style>{`
@keyframes nl-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
@keyframes nl-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes nl-dash { to { stroke-dashoffset: -26; } }
@keyframes nl-pop  { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
@keyframes nl-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
@keyframes nl-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.nl-pkt  { animation: nl-move 2s linear infinite both; }
.nl-fade { animation: nl-fade ${0.5 * SLOW}s ease-out both; }
.nl-dash { animation: nl-dash ${1.2 * SLOW}s linear infinite; }
.nl-pop  { animation: nl-pop ${0.4 * SLOW}s ease-out both; transform-box: fill-box; transform-origin: center; }
.nl-ring { animation: nl-ring ${1.6 * SLOW}s ease-out infinite; }
.nl-shake { animation: nl-shake .4s ease-in-out; }
.nl-paused .nl-pkt, .nl-paused .nl-dash { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .nl-pkt, .nl-fade, .nl-dash, .nl-pop, .nl-ring, .nl-shake { animation: none; opacity: 1; } .nl-pkt { transform: translate(var(--x1), var(--y1)); } }
`}</style>
      <h1 className="text-xl font-semibold">Network layer: packets, IP headers, routing basics</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Layer 3 is responsible for forwarding packets based on the IP header (source and destination IP) and finding the best path between networks.</p>
      <NetworkLayerExplorer />
      <PacketJourney />
      <IpHeaderLab />
      <SwitchLab />
      <QuickReference />
      <NetworkLayerQuiz />
    </div>
  );
}

export default NetworkLayer;