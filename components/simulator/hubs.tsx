"use client";
import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Hubs (CSMA/CD, half-duplex, broadcast and collision domains)
 * 1. HubExplorer: tap each fact about hubs and watch signals move through a hub.
 * 2. HubBroadcastLab: send a frame into a hub, see every other port get it, and see who accepts or discards.
 * 3. CsmaLab: CSMA/CD and CSMA/CA, with a medium free or busy check and a collision demo.
 * 4. DomainLab: one broadcast domain and one collision domain on a hub, including corrupted frames.
 * 5. LoopLab: a closed connection with no Spanning Tree makes an infinite loop.
 * 6. QuickReference: one table with every fact.
 * 7. HubQuiz: practice quiz.
 * Rule to remember: a hub has no table, so it always broadcasts to every other port, and all its ports share one broadcast domain and one collision domain.
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
    <g className="hb-pkt" style={{ "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties}>
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
          return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="hb-dash" stroke={GREY} strokeWidth={2} strokeDasharray="7 6" />;
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

/* ---------- Shared hub topology ---------- */
const PA: SceneNode = { id: "a", x: 80, y: 70, e: "💻", l: "PC A" };
const PB: SceneNode = { id: "b", x: 80, y: 250, e: "💻", l: "PC B" };
const HUB: SceneNode = { id: "h", x: 300, y: 160, e: "🔁", l: "Hub", sub: "Layer 1" };
const PCC: SceneNode = { id: "c", x: 520, y: 70, e: "💻", l: "PC C" };
const PD: SceneNode = { id: "d", x: 520, y: 250, e: "💻", l: "PC D" };
const HNODES: SceneNode[] = [PA, PB, HUB, PCC, PD];
const HLINKS: [Id, Id][] = [["a", "h"], ["b", "h"], ["h", "c"], ["h", "d"]];
const HOSTS: Id[] = ["a", "b", "c", "d"];
const hubGroup = (label: string, color: string): Group[] => [{ x: 15, y: 20, w: 570, h: 285, label, color }];
const mk = (flows: Flow[], groups: Group[], hot?: Id): Scene => ({ groups, nodes: HNODES, links: HLINKS, flows, dur: 2.4, hot });

/* ---------- Section 1: Explorer data ---------- */
type CId = "what" | "nodecision" | "broadcast" | "duplex" | "csma" | "domains" | "loops";
type Concept = { id: CId; label: string; color: string; notes: { fact: string; simple: string }[]; examples: string[]; analogy: string; scene: Scene };

const spread = (label: string, color: string, from: Id = "a"): Flow[] => [
  { a: from, b: "h", label, delay: 0, color },
  ...HOSTS.filter((x) => x !== from).map((x) => ({ a: "h", b: x, label, delay: 1.2, color })),
];

const CONCEPTS: Concept[] = [
  {
    id: "what", label: "What a hub is", color: C.BLUE,
    notes: [
      { fact: "A hub is a Layer 1 device (it belongs to the Physical layer).", simple: "A hub only works with signals, so it sits at the bottom layer." },
      { fact: "A hub is used to connect host devices inside a network, but it is not used anymore.", simple: "It joined computers together, but newer devices replaced it." },
    ],
    examples: ["Layer 1", "Physical layer", "Not used anymore"],
    analogy: "Like a multi-socket extension lead: whatever goes into one socket shows up on all the others.",
    scene: mk(spread("signal", C.BLUE), hubGroup("One network", C.BLUE), "h"),
  },
  {
    id: "nodecision", label: "No decisions", color: C.RED,
    notes: [
      { fact: "A hub cannot take any decision because it has no database or table to keep connected-device information.", simple: "It does not remember which device is on which port." },
      { fact: "With no table or intelligent forwarding capability, a hub cannot forward traffic intelligently.", simple: "It cannot pick one port. It has nothing to look up." },
    ],
    examples: ["No table", "No database", "No decisions"],
    analogy: "Like a loudspeaker that has no idea who is listening. It just makes noise for everyone.",
    scene: mk([{ a: "a", b: "h", label: "frame", delay: 0, color: C.BLUE }, { a: "h", b: "b", label: "?", delay: 1.2, color: C.RED }], hubGroup("One network", C.BLUE), "h"),
  },
  {
    id: "broadcast", label: "Always broadcasts", color: C.AMBER,
    notes: [
      { fact: "A hub always broadcasts incoming traffic.", simple: "Every frame is copied out of all the other ports." },
      { fact: "The destination device accepts the traffic after checking the L2 and L3 header. Other devices discard it.", simple: "Only the right device keeps the frame. The rest throw it away." },
    ],
    examples: ["Broadcast", "L2 header", "L3 header", "Accept", "Discard"],
    analogy: "Like shouting a name in a room: everyone hears it, but only that person answers.",
    scene: mk(spread("frame", C.BLUE), hubGroup("One network", C.BLUE), "h"),
  },
  {
    id: "duplex", label: "Half-duplex", color: C.PURPLE,
    notes: [{ fact: "A hub operates in half-duplex.", simple: "Devices can send or receive at one time, but not both together." }],
    examples: ["Half-duplex"],
    analogy: "Like a walkie-talkie: you press to talk, then let go to listen.",
    scene: mk([
      { a: "a", b: "h", label: "send", delay: 0, color: C.BLUE },
      { a: "h", b: "a", label: "wait", delay: 1.6, color: C.AMBER },
    ], hubGroup("One network", C.BLUE), "h"),
  },
  {
    id: "csma", label: "CSMA/CD and CSMA/CA", color: C.TEAL,
    notes: [
      { fact: "CSMA/CD (Carrier Sense Multiple Access / Collision Detection) is used to identify whether the medium is free or not before sending signals to client machines.", simple: "A device first listens to see if the cable is quiet." },
      { fact: "CSMA/CA (Carrier Sense Multiple Access / Collision Avoidance) is the wireless equivalent.", simple: "It is the same idea, but for wireless." },
    ],
    examples: ["CSMA/CD", "CSMA/CA", "Carrier Sense", "Wireless"],
    analogy: "Like waiting for a quiet moment in a meeting before you speak.",
    scene: mk([{ a: "a", b: "h", label: "free?", delay: 0, color: C.TEAL }, { a: "h", b: "a", label: "free", delay: 1.2, color: C.GREEN }], hubGroup("One network", C.BLUE), "a"),
  },
  {
    id: "domains", label: "Broadcast and collision domains", color: C.ORANGE,
    notes: [
      { fact: "A broadcast domain is an area where a broadcast message can spread. On a hub, all ports belong to a single broadcast domain, and it broadcasts to everyone except the incoming port.", simple: "Every port hears every broadcast, except the one it came from." },
      { fact: "A collision domain is an area where collisions can occur. On a hub, all ports belong to a single collision domain.", simple: "Any two devices on the hub can crash into each other." },
      { fact: "There is no error checking on hub ports, so a hub forwards corrupted frames as well.", simple: "A damaged frame is passed on like a good one." },
    ],
    examples: ["Broadcast domain", "Collision domain", "Corrupted frames"],
    analogy: "Like one small room: everyone hears every shout, and two people talking at once is a mess.",
    scene: mk(spread("broadcast", C.AMBER), [{ x: 15, y: 20, w: 570, h: 285, label: "One broadcast domain + one collision domain", color: C.ORANGE }], "h"),
  },
  {
    id: "loops", label: "No Spanning Tree", color: C.PINK,
    notes: [
      { fact: "There is no Spanning Tree (STP) in hubs, so hubs can create loops in the topology if there is a closed connection.", simple: "Nothing stops a circle of cables from forming." },
      { fact: "Because there is no STP, these become infinite loops that consume all available bandwidth.", simple: "The frame goes round and round forever and fills the network." },
    ],
    examples: ["No STP", "Loop", "Infinite loop", "Bandwidth"],
    analogy: "Like a roundabout with no exit: cars keep circling until the road is full.",
    scene: {
      groups: hubGroup("Closed connection", C.PINK),
      nodes: [{ id: "h1", x: 150, y: 160, e: "🔁", l: "Hub 1" }, { id: "h2", x: 450, y: 70, e: "🔁", l: "Hub 2" }, { id: "h3", x: 450, y: 250, e: "🔁", l: "Hub 3" }],
      links: [["h1", "h2"], ["h2", "h3"], ["h3", "h1"]],
      flows: [{ a: "h1", b: "h2", label: "loop", delay: 0, color: C.RED }, { a: "h2", b: "h3", label: "loop", delay: 0.8, color: C.RED }, { a: "h3", b: "h1", label: "loop", delay: 1.6, color: C.RED }],
      dur: 2.4, hot: "h1",
    },
  },
];

export function HubExplorer() {
  const [id, setId] = useState<CId>("what");
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const c = CONCEPTS.find((x) => x.id === id) ?? CONCEPTS[0];
  return (
    <Shell title="Hubs" desc="A hub is a Layer 1 device that cannot make forwarding decisions, so it always broadcasts incoming traffic to every other port.">
      <Pills items={CONCEPTS.map((x) => ({ id: x.id, label: x.label }))} sel={id} set={(v) => { setId(v); setOpen(null); }} color={c.color} />
      <div className={paused ? "hb-paused" : ""}>
        <SceneSvg scene={c.scene} k={id} aria={`Signals moving through a hub for ${c.label}`} stroke={(n) => (c.scene.hot === n ? C.AMBER : GREY)} />
      </div>
      <div><Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>{paused ? "Play animation" : "Pause animation"}</Button></div>
      <div key={id} className="hb-fade flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: c.color }}>Facts from your notes (tap one)</p>
        {c.notes.map((n, i) => (
          <button key={i} onClick={() => setOpen(open === i ? null : i)} className="rounded-xl border bg-background p-3 text-left text-xs leading-5 transition-colors"
            style={{ borderColor: open === i ? c.color : `${c.color}88` }}>
            <span className="font-medium">{n.fact}</span>
            {open === i && <span className="hb-fade mt-1 block text-muted-foreground">💬 {n.simple}</span>}
          </button>
        ))}
        <div className="flex flex-wrap gap-2">{c.examples.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}</div>
        <Tip color={c.color}>{c.analogy}</Tip>
      </div>
      <Tip color={C.BLUE}>A hub has no table, so it cannot choose a port. It repeats the signal to every other port.</Tip>
    </Shell>
  );
}

/* ---------- Section 2: Broadcast lab ---------- */
type Host = { id: Id; name: string };
const HOST_LIST: Host[] = [{ id: "a", name: "PC A" }, { id: "b", name: "PC B" }, { id: "c", name: "PC C" }, { id: "d", name: "PC D" }];

export function HubBroadcastLab() {
  const [src, setSrc] = useState<Id>("a");
  const [dst, setDst] = useState<Id>("c");
  const [sent, setSent] = useState(0);
  const dstOptions = HOST_LIST.filter((h) => h.id !== src);
  const realDst = dst === src ? (dstOptions[0]?.id ?? "b") : dst;
  const others = HOSTS.filter((x) => x !== src);
  const scene: Scene = { groups: hubGroup("One network", C.BLUE), nodes: HNODES, links: HLINKS, dur: 2.4, hot: "h", flows: sent > 0 ? spread("frame", C.BLUE, src) : [] };
  const nameOf = (id: Id) => HOST_LIST.find((h) => h.id === id)?.name ?? id;
  const srcName = nameOf(src), dstName = nameOf(realDst);

  return (
    <Shell title="Send a frame into a hub" desc="Pick who sends and who the frame is for. Then see how the hub treats the frame. Everything here is an example.">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Sender</p>
        <Pills items={HOST_LIST.map((h) => ({ id: h.id, label: h.name }))} sel={src} set={(v) => { setSrc(v); setSent(0); }} color={C.BLUE} />
        <p className="text-xs text-muted-foreground">Destination</p>
        <Pills items={dstOptions.map((h) => ({ id: h.id, label: h.name }))} sel={realDst} set={(v) => { setDst(v); setSent(0); }} color={C.PURPLE} />
      </div>
      <SceneSvg scene={scene} k={`${src}-${realDst}-${sent}`} aria={`${srcName} sends a frame into a hub and the hub repeats it to every other port`}
        stroke={(n) => (sent > 0 && n === realDst ? C.GREEN : sent > 0 && others.includes(n) ? C.RED : n === "h" ? C.AMBER : GREY)}
        extra={sent > 0 ? others.map((n) => {
          const p = at(scene, n);
          const ok = n === realDst;
          return <text key={`${src}-${realDst}-${sent}-${n}`} x={p.x} y={p.y - 40} textAnchor="middle" fontSize={11} fontWeight={700} fill={ok ? C.GREEN : C.RED} className="hb-fade" style={{ animationDelay: `${1.8 * SLOW}s` }}>{ok ? "✓ accepts" : "✕ discards"}</text>;
        }) : null} />
      <div key={`${sent}-${src}-${realDst}`} className="hb-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: sent > 0 ? C.AMBER : GREY, color: sent > 0 ? C.AMBER : GREY }}>
        {sent > 0
          ? `The hub copies the frame to every port except ${srcName}'s port. ${dstName} checks the L2 and L3 header and accepts it. The other devices discard it.`
          : "Press Send frame to see what the hub does."}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setSent((s) => s + 1)}>{sent === 0 ? "Send frame" : "Send again"}</Button>
        <Button variant="outline" size="sm" onClick={() => setSent(0)}>Reset</Button>
      </div>
      <Tip color={C.AMBER}>Rule: the hub broadcasts to every other port. Only the destination device accepts the frame.</Tip>
    </Shell>
  );
}

/* ---------- Section 3: CSMA lab ---------- */
type Mode = "cd" | "ca";
type Wire = "free" | "busy";
type CsmaInfo = { label: string; full: string; env: string; color: string };
const CSMA: Record<Mode, CsmaInfo> = {
  cd: { label: "CSMA/CD", full: "Carrier Sense Multiple Access / Collision Detection", env: "Wired (hubs)", color: C.TEAL },
  ca: { label: "CSMA/CA", full: "Carrier Sense Multiple Access / Collision Avoidance", env: "Wireless", color: C.PURPLE },
};
const CSMA_STEPS: { id: Wire; label: string }[] = [{ id: "free", label: "Medium is free" }, { id: "busy", label: "Medium is busy" }];

export function CsmaLab() {
  const [mode, setMode] = useState<Mode>("cd");
  const [wire, setWire] = useState<Wire>("free");
  const info = CSMA[mode];
  const free = wire === "free";
  const scene: Scene = {
    groups: hubGroup(info.env, info.color), nodes: HNODES, links: HLINKS, dur: 2.4, hot: "h",
    flows: free ? spread("data", C.BLUE) : [{ a: "c", b: "h", label: "busy", delay: 0, color: C.RED }, { a: "a", b: "h", label: "wait", delay: 0.4, color: C.AMBER }],
  };
  const col = free ? C.GREEN : C.RED;
  return (
    <Shell title="Check the medium first" desc="Before sending, a device checks if the medium is free. Change the medium and see what the sender does.">
      <Pills<Mode> items={[{ id: "cd", label: "CSMA/CD" }, { id: "ca", label: "CSMA/CA" }]} sel={mode} set={setMode} color={info.color} />
      <div key={mode} className="hb-fade rounded-xl border bg-background p-4" style={{ borderColor: `${info.color}88` }}>
        <p className="text-sm font-semibold" style={{ color: info.color }}>{info.label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{info.full}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {mode === "cd" ? "💬 Used to identify whether the medium is free or not before sending signals to client machines." : "💬 This is the wireless equivalent of CSMA/CD."}
        </p>
      </div>
      <Pills<Wire> items={CSMA_STEPS} sel={wire} set={setWire} color={C.AMBER} />
      <SceneSvg scene={scene} k={`${mode}-${wire}`} aria="PC A checks whether the medium is free before it sends through the hub"
        stroke={(n) => (n === "a" ? col : n === "h" ? C.AMBER : GREY)} />
      <div key={`${mode}-${wire}`} className="hb-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>
        {free ? "✓ PC A listens and the medium is free, so PC A sends its signals." : "✕ PC A listens and the medium is busy, so PC A waits before it sends."}
      </div>
      <Tip color={C.TEAL}>Rule: CSMA/CD is for wired networks like hubs, and CSMA/CA is the wireless equivalent.</Tip>
    </Shell>
  );
}

/* ---------- Section 4: Domain lab ---------- */
type Dom = "broadcast" | "collision" | "corrupt";
type DomInfo = { label: string; color: string; msg: string; flows: Flow[]; stroke: (n: Id) => string };
const bad = (n: Id): string => (n === "a" ? C.GREY_PLACEHOLDER : GREY);
void bad;
const DOMS: Record<Dom, DomInfo> = {
  broadcast: {
    label: "Broadcast domain", color: C.AMBER,
    msg: "All hub ports are in a single broadcast domain. The hub sends the broadcast to everyone except the incoming port.",
    flows: spread("broadcast", C.AMBER),
    stroke: (n) => (n === "a" ? GREY : n === "h" ? C.AMBER : C.GREEN),
  },
  collision: {
    label: "Collision domain", color: C.RED,
    msg: "All hub ports are in a single collision domain. If PC A and PC B send at the same time, their signals collide.",
    flows: [{ a: "a", b: "h", label: "frame", delay: 0, color: C.BLUE }, { a: "b", b: "h", label: "frame", delay: 0, color: C.BLUE }],
    stroke: (n) => (n === "a" || n === "b" || n === "h" ? C.RED : GREY),
  },
  corrupt: {
    label: "Corrupted frames", color: C.ORANGE,
    msg: "There is no error checking on hub ports. The hub forwards a corrupted frame just like a good one.",
    flows: spread("corrupt", C.RED),
    stroke: (n) => (n === "h" ? C.AMBER : n === "a" ? GREY : C.RED),
  },
};
const DOM_ORDER: Dom[] = ["broadcast", "collision", "corrupt"];

export function DomainLab() {
  const [d, setD] = useState<Dom>("broadcast");
  const v = DOMS[d];
  const scene: Scene = { groups: hubGroup(d === "collision" ? "One collision domain" : "One broadcast domain and one collision domain", v.color), nodes: HNODES, links: HLINKS, dur: 2.4, hot: "h", flows: v.flows };
  return (
    <Shell title="Broadcast domain and collision domain" desc="A domain is an area. Pick one and see how far it reaches on a hub.">
      <Pills<Dom> items={DOM_ORDER.map((x) => ({ id: x, label: DOMS[x].label }))} sel={d} set={setD} color={v.color} />
      <SceneSvg scene={scene} k={d} aria={`A hub showing the ${v.label}`} stroke={v.stroke}
        extra={d === "collision" ? <text key="boom" x={300} y={112} textAnchor="middle" fontSize={22} className="hb-pop">💥</text> : null} />
      <div key={d} className="hb-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: v.color, color: v.color }}>{v.msg}</div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Domain</th><th className="px-3 py-2">Meaning</th><th className="px-3 py-2">On a hub</th></tr></thead>
          <tbody>
            {[
              { id: "broadcast" as Dom, name: "Broadcast domain", mean: "Where a broadcast message can spread", hub: "All ports in one" },
              { id: "collision" as Dom, name: "Collision domain", mean: "Where collisions can occur", hub: "All ports in one" },
            ].map((r) => (
              <tr key={r.id} className="border-t" style={d === r.id ? { background: `${DOMS[r.id].color}18`, color: DOMS[r.id].color, fontWeight: 700 } : undefined}>
                <td className="px-3 py-2">{r.name}</td><td className="px-3 py-2">{r.mean}</td><td className="px-3 py-2">{r.hub}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.ORANGE}>Rule: a hub has one broadcast domain and one collision domain, and it does no error checking.</Tip>
    </Shell>
  );
}

/* ---------- Section 5: Loop lab ---------- */
const LOOP_NODES: SceneNode[] = [
  { id: "h1", x: 150, y: 160, e: "🔁", l: "Hub 1" },
  { id: "h2", x: 450, y: 70, e: "🔁", l: "Hub 2" },
  { id: "h3", x: 450, y: 250, e: "🔁", l: "Hub 3" },
];
const LOOP_LINKS: [Id, Id][] = [["h1", "h2"], ["h2", "h3"], ["h3", "h1"]];

export function LoopLab() {
  const [closed, setClosed] = useState(false);
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (!closed) { return; }
    const t = setInterval(() => setRound((r) => Math.min(r + 1, 10)), 800 * SLOW);
    return () => clearInterval(t);
  }, [closed]);

  const links: [Id, Id][] = closed ? LOOP_LINKS : LOOP_LINKS.slice(0, 2);
  const flows: Flow[] = closed
    ? [{ a: "h1", b: "h2", label: "frame", delay: 0, color: C.RED }, { a: "h2", b: "h3", label: "frame", delay: 0.8, color: C.RED }, { a: "h3", b: "h1", label: "frame", delay: 1.6, color: C.RED }]
    : [{ a: "h1", b: "h2", label: "frame", delay: 0, color: C.BLUE }, { a: "h2", b: "h3", label: "frame", delay: 1.2, color: C.BLUE }];
  const scene: Scene = { groups: hubGroup(closed ? "Closed connection" : "Open connection", closed ? C.RED : C.GREEN), nodes: LOOP_NODES, links, flows, dur: 2.4, hot: closed ? "h1" : undefined };
  const load = closed ? round * 10 : 0;
  const col = closed ? C.RED : C.GREEN;
  const toggle = () => { setClosed((c) => !c); setRound(0); };

  return (
    <Shell title="Loops without Spanning Tree" desc="Close the cable between the hubs and watch the bandwidth fill up. The load bar is only an illustration.">
      <SceneSvg scene={scene} k={`${closed}`} aria="Three hubs connected in a triangle, with a frame going round in a loop"
        stroke={(n) => (closed ? C.RED : n === "h1" ? C.GREEN : GREY)} />
      <div className="rounded-xl border bg-background p-4">
        <p className="text-xs text-muted-foreground">Bandwidth used (illustration)</p>
        <div className="mt-2 h-3 rounded-full bg-muted">
          <div className="h-3 rounded-full" style={{ width: `${load}%`, background: col, transition: "width .5s, background .4s" }} />
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{load === 0 ? "Almost nothing" : load >= 100 ? "100%: all available bandwidth used" : `${load}% and rising`}</p>
      </div>
      <div key={`${closed}-${load >= 100}`} className="hb-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>
        {closed
          ? "✕ The connection is closed and there is no STP. The frame goes round forever and uses up all available bandwidth."
          : "✓ The connection is open, so the frame reaches the end and stops. There is no loop."}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={toggle}>{closed ? "Open the connection" : "Close the connection"}</Button>
      </div>
      <Tip color={C.PINK}>Rule: no Spanning Tree means a closed connection becomes an infinite loop.</Tip>
    </Shell>
  );
}

/* ---------- Section 6: Quick reference ---------- */
const REF: { topic: string; detail: string }[] = [
  { topic: "Layer", detail: "Layer 1 (Physical layer)" },
  { topic: "Use", detail: "Connects host devices inside a network, but not used anymore" },
  { topic: "Decisions", detail: "None, because it has no database or table for connected devices" },
  { topic: "Forwarding", detail: "Not intelligent. It always broadcasts incoming traffic." },
  { topic: "Who accepts", detail: "The destination device, after checking the L2 and L3 header. Others discard." },
  { topic: "Duplex", detail: "Half-duplex" },
  { topic: "CSMA/CD", detail: "Carrier Sense Multiple Access / Collision Detection: checks if the medium is free before sending" },
  { topic: "CSMA/CA", detail: "Carrier Sense Multiple Access / Collision Avoidance: the wireless equivalent" },
  { topic: "Broadcast domain", detail: "Where a broadcast can spread. Hub: all ports in one, sent to everyone except the incoming port." },
  { topic: "Collision domain", detail: "Where collisions can occur. Hub: all ports in one." },
  { topic: "Error checking", detail: "None on hub ports, so corrupted frames are forwarded too" },
  { topic: "Spanning Tree", detail: "None, so a closed connection makes an infinite loop that uses all bandwidth" },
];

export function QuickReference() {
  return (
    <Shell title="Quick reference" desc="Every fact about hubs in one table." badge="Reference">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Topic</th><th className="px-3 py-2">Detail</th></tr></thead>
          <tbody>{REF.map((r) => <tr key={r.topic} className="border-t"><td className="px-3 py-2 font-semibold">{r.topic}</td><td className="px-3 py-2">{r.detail}</td></tr>)}</tbody>
        </table>
      </div>
      <Tip color={C.BLUE}>Hub = Layer 1 + no table + always broadcasts + half-duplex + one domain of each kind.</Tip>
    </Shell>
  );
}

/* ---------- Section 7: Quiz ---------- */
type Q = { q: string; opts: string[]; ans: number; why: string };
const QUIZ: Q[] = [
  { q: "Which layer does a hub belong to?", opts: ["Layer 1", "Layer 2", "Layer 3", "Layer 4"], ans: 0, why: "A hub is a Layer 1 device in the Physical layer." },
  { q: "Why can a hub not take decisions?", opts: ["It has no table or database of connected devices", "It is too fast", "It has too many ports", "It uses wireless"], ans: 0, why: "A hub keeps no table, so it has nothing to decide with." },
  { q: "What does a hub do with incoming traffic?", opts: ["Sends it to one port", "Always broadcasts it", "Deletes it", "Stores it"], ans: 1, why: "A hub always broadcasts incoming traffic." },
  { q: "Who accepts the traffic from a hub?", opts: ["Every device", "Only the destination device", "Only the first device", "No device"], ans: 1, why: "The destination device accepts after checking the L2 and L3 header. Others discard it." },
  { q: "Which duplex mode does a hub use?", opts: ["Full-duplex", "Half-duplex", "No duplex", "Triple-duplex"], ans: 1, why: "A hub operates in half-duplex." },
  { q: "What does CSMA/CD check?", opts: ["If the medium is free before sending", "The cable colour", "The MAC table size", "The IP address"], ans: 0, why: "CSMA/CD identifies whether the medium is free or not before sending signals." },
  { q: "What is the wireless equivalent of CSMA/CD?", opts: ["CSMA/CA", "STP", "ARP", "DNS"], ans: 0, why: "CSMA/CA (Collision Avoidance) is the wireless equivalent." },
  { q: "How many broadcast domains does a hub have?", opts: ["One for each port", "Two", "A single one for all ports", "None"], ans: 2, why: "On a hub, all ports belong to a single broadcast domain." },
  { q: "How many collision domains does a hub have?", opts: ["One for each port", "A single one for all ports", "Two", "None"], ans: 1, why: "On a hub, all ports belong to a single collision domain." },
  { q: "What happens to a corrupted frame on a hub?", opts: ["It is fixed", "It is forwarded as well", "It is blocked", "It is returned"], ans: 1, why: "There is no error checking on hub ports, so corrupted frames are forwarded too." },
  { q: "What happens with a closed connection between hubs?", opts: ["An infinite loop that uses all bandwidth", "Nothing", "Faster speed", "A new MAC table"], ans: 0, why: "There is no STP, so the loop never stops and uses all available bandwidth." },
];

export function HubQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ[i];
  const answer = (n: number) => { if (pick !== null) return; setPick(n); if (n === q.ans) setScore((s) => s + 1); };
  const next = () => { if (i === QUIZ.length - 1) setDone(true); else { setI(i + 1); setPick(null); } };
  const restart = () => { setI(0); setPick(null); setScore(0); setDone(false); };
  return (
    <Shell title="Practice quiz" desc="Test what you learned about hubs." badge="Quiz">
      {done ? (
        <div className="hb-fade rounded-xl border bg-background p-4 text-center">
          <p className="text-sm font-semibold" style={{ color: C.GREEN }}>You scored {score} out of {QUIZ.length}.</p>
          <div className="mt-3"><Button size="sm" onClick={restart}>Restart</Button></div>
        </div>
      ) : (
        <div key={i} className="hb-fade flex flex-col gap-3">
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
          {pick !== null && <p className="hb-fade text-xs leading-5 text-muted-foreground">💬 {q.why}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={pick === null} onClick={next}>{i === QUIZ.length - 1 ? "See score" : "Next question"}</Button>
            <Button size="sm" variant="outline" onClick={restart}>Restart</Button>
          </div>
        </div>
      )}
      <Tip color={C.PURPLE}>Remember: no table, always broadcasts, half-duplex, one domain of each kind, no STP.</Tip>
    </Shell>
  );
}

/* ---------- Main ---------- */
export function Hubs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <style>{`
@keyframes hb-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
@keyframes hb-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes hb-dash { to { stroke-dashoffset: -26; } }
@keyframes hb-pop  { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
@keyframes hb-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
@keyframes hb-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.hb-pkt  { animation: hb-move 2s linear infinite both; }
.hb-fade { animation: hb-fade ${0.5 * SLOW}s ease-out both; }
.hb-dash { animation: hb-dash ${1.2 * SLOW}s linear infinite; }
.hb-pop  { animation: hb-pop ${0.4 * SLOW}s ease-out both; transform-box: fill-box; transform-origin: center; }
.hb-ring { animation: hb-ring ${1.6 * SLOW}s ease-out infinite; }
.hb-shake { animation: hb-shake .4s ease-in-out; }
.hb-paused .hb-pkt, .hb-paused .hb-dash { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .hb-pkt, .hb-fade, .hb-dash, .hb-pop, .hb-ring, .hb-shake { animation: none; opacity: 1; } .hb-pkt { transform: translate(var(--x1), var(--y1)); } }
`}</style>
      <h1 className="text-xl font-semibold">Hubs: CSMA/CD, half-duplex, broadcast and collision domains</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">A hub is a Layer 1 device that cannot make forwarding decisions, so it always broadcasts incoming traffic to every other port.</p>
      <HubExplorer />
      <HubBroadcastLab />
      <CsmaLab />
      <DomainLab />
      <LoopLab />
      <QuickReference />
      <HubQuiz />
    </div>
  );
}

export default Hubs;