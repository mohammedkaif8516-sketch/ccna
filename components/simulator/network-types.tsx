"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
 * NetworkTypes
 * Four interactive pieces for the "Types of Networks" notes:
 *   1. ScopeLadder   – PAN → LAN → CAN → MAN → WAN as zoom-out rings
 *   2. TypeExplorer  – animated scene + click-to-explain facts for LAN, WAN, MAN, SAN, CAN, PAN
 *   3. VpnLab        – site-to-site, remote access and IP-masking with a VPN on/off switch
 *   4. NetworkQuiz   – "Which network is this?" practice
 * Rule to remember: the network TYPE is decided by scope (how far), owner (who runs it)
 * and purpose (what it is for).
 */

const SLOW = 1.4; // animation slow-down factor (1 = fast, higher = slower)

const C = {
  LAN: "#2f9e44",
  WAN: "#1971c2",
  MAN: "#f08c00",
  SAN: "#9c36b5",
  CAN: "#e8590c",
  PAN: "#d6336c",
  VPN: "#0c8599",
  RED: "#c92a2a",
  GREEN: "#2f9e44",
};
const mono = "ui-monospace, monospace";

type TypeId = "LAN" | "WAN" | "MAN" | "SAN" | "CAN" | "PAN";

/* ───────────────────────── scene engine ───────────────────────── */

type SNode = { id: string; x: number; y: number; e: string; l: string };
type Scene = {
  groups?: { x: number; y: number; w: number; h: number; l: string }[];
  nodes: SNode[];
  links: [string, string][];
  flows: { a: string; b: string; label: string; delay: number }[];
  dur: number; // seconds for one packet to cross a cable
};

const edge = (A: SNode, B: SNode, r = 28): [number, number, number, number] => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return [A.x + ux * r, A.y + uy * r, B.x - ux * r, B.y - uy * r];
};

function Chip({
  x0, y0, x1, y1, label, color, dur, delay, paused,
}: {
  x0: number; y0: number; x1: number; y1: number; label: string; color: string; dur: number; delay: number; paused: boolean;
}) {
  const w = label.length * 6.2 + 16;
  return (
    <g
      className="nt-pkt"
      style={
        {
          "--x0": `${x0}px`,
          "--y0": `${y0}px`,
          "--x1": `${x1}px`,
          "--y1": `${y1}px`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          animationPlayState: paused ? "paused" : "running",
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

function SceneView({ scene, color, paused }: { scene: Scene; color: string; paused: boolean }) {
  const byId = Object.fromEntries(scene.nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 600 320" className="mx-auto min-w-[560px] max-w-[760px]" role="img" aria-label="Animated network diagram">
      {scene.groups?.map((g) => (
        <g key={g.l}>
          <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={18} fill={color} fillOpacity={0.07} stroke={color} strokeWidth={2} strokeDasharray="6 5" />
          <text x={g.x + 14} y={g.y + 20} fontSize={12} fontWeight={700} fill={color}>
            {g.l}
          </text>
        </g>
      ))}
      {scene.links.map(([a, b]) => {
        const [x0, y0, x1, y1] = edge(byId[a], byId[b]);
        return (
          <line key={a + b} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeOpacity={0.55} strokeWidth={2.5}
            strokeDasharray="7 6" className="nt-dash" style={{ animationPlayState: paused ? "paused" : "running" }} />
        );
      })}
      {scene.nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={28} className="fill-background" stroke={color} strokeWidth={2.5} />
          <text x={n.x} y={n.y + 9} textAnchor="middle" fontSize={26}>{n.e}</text>
          <text x={n.x} y={n.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{n.l}</text>
        </g>
      ))}
      {scene.flows.map((f, i) => {
        const [x0, y0, x1, y1] = edge(byId[f.a], byId[f.b]);
        return <Chip key={i} x0={x0} y0={y0} x1={x1} y1={y1} label={f.label} color={color}
          dur={scene.dur * SLOW} delay={f.delay * SLOW} paused={paused} />;
      })}
    </svg>
  );
}

/* ───────────────────────── type data ───────────────────────── */

type Fact = { t: string; easy: string };
type TypeDef = {
  id: TypeId; name: string; emoji: string; color: string;
  scope: string; owner: string; purpose: string;
  facts: Fact[]; examples: string[]; analogy: string; scene: Scene;
};

const TYPES: TypeDef[] = [
  {
    id: "LAN", name: "Local Area Network", emoji: "🏢", color: C.LAN,
    scope: "One home, office or building", owner: "An administrator or a group of engineers in one organization",
    purpose: "Fast, private data transmission over a short distance",
    facts: [
      { t: "A single network (or a few networks) in a small geographical area.", easy: "Think of one floor of an office. Every device is close together and joined by the same switch and router." },
      { t: "A private network for private data transmission.", easy: "Only people the organization allows can use it. Your office files are not open to the public." },
      { t: "A high-speed network.", easy: "Short cables mean little delay, so copying a big file to the office printer or server is quick." },
      { t: "Managed by a person, administrator or group of engineers under an organization.", easy: "Someone owns it and fixes it. At home that is you, in a company it is the IT team." },
    ],
    examples: ["Office building", "Home", "Campus floor"],
    analogy: "A LAN is like the corridors inside one building: private, short and fast.",
    scene: {
      groups: [{ x: 50, y: 26, w: 500, h: 266, l: "One office building = one LAN" }],
      nodes: [
        { id: "rt", x: 300, y: 80, e: "📡", l: "Router" },
        { id: "sw", x: 300, y: 165, e: "🔀", l: "Switch" },
        { id: "pc", x: 140, y: 225, e: "💻", l: "PC" },
        { id: "pr", x: 300, y: 235, e: "🖨️", l: "Printer" },
        { id: "ph", x: 460, y: 225, e: "📱", l: "Phone" },
      ],
      links: [["rt", "sw"], ["sw", "pc"], ["sw", "pr"], ["sw", "ph"]],
      flows: [
        { a: "pc", b: "sw", label: "print job", delay: 0 },
        { a: "sw", b: "pr", label: "print job", delay: 0.5 },
        { a: "ph", b: "sw", label: "request", delay: 0.9 },
        { a: "sw", b: "rt", label: "to internet", delay: 1.4 },
      ],
      dur: 1.2,
    },
  },
  {
    id: "WAN", name: "Wide Area Network", emoji: "🌍", color: C.WAN,
    scope: "Cities, countries and continents", owner: "An organization or ISP",
    purpose: "Join many LANs that are far apart",
    facts: [
      { t: "A collection of LANs in a large geographical area. Simply, the internet.", easy: "Your office LAN in Bengaluru and another LAN in Delhi cannot share one cable, so a provider links them across the country." },
      { t: "Managed by an organization or ISP.", easy: "You cannot lay cables across a country yourself. You rent the link from an Internet Service Provider." },
      { t: "Example: Vi, Jio, Airtel.", easy: "When you pay for mobile data or broadband from these companies you are using their WAN to reach the internet." },
    ],
    examples: ["Vi", "Jio", "Airtel"],
    analogy: "A WAN is like the national highway system that joins every city's local roads.",
    scene: {
      nodes: [
        { id: "isp", x: 300, y: 150, e: "☁️", l: "ISP (Jio / Airtel / Vi)" },
        { id: "a", x: 80, y: 60, e: "🏢", l: "LAN · Bengaluru" },
        { id: "b", x: 80, y: 245, e: "🏠", l: "LAN · Chennai" },
        { id: "c", x: 520, y: 60, e: "🏭", l: "LAN · Delhi" },
        { id: "d", x: 520, y: 245, e: "🏫", l: "LAN · Mumbai" },
      ],
      links: [["a", "isp"], ["b", "isp"], ["c", "isp"], ["d", "isp"]],
      flows: [
        { a: "a", b: "isp", label: "data", delay: 0 },
        { a: "isp", b: "c", label: "data", delay: 1.2 },
        { a: "d", b: "isp", label: "reply", delay: 2.4 },
        { a: "isp", b: "b", label: "reply", delay: 3.6 },
      ],
      dur: 2.4,
    },
  },
  {
    id: "MAN", name: "Metropolitan Area Network", emoji: "🏙️", color: C.MAN,
    scope: "One whole city", owner: "A service provider, sold to the public",
    purpose: "Connect many sites across a city",
    facts: [
      { t: "A public network that spans across a city.", easy: "Bigger than one building or campus, smaller than a country. It is a fibre network laid under the streets of a city." },
      { t: "Example: ACT Fibernet, Hathway.", easy: "These providers lay fibre across a city like Bengaluru and sell broadband to homes and offices." },
    ],
    examples: ["ACT Fibernet", "Hathway"],
    analogy: "A MAN is like a city's metro network: it links neighbourhoods, not countries.",
    scene: {
      groups: [{ x: 24, y: 18, w: 552, h: 288, l: "One city = one MAN" }],
      nodes: [
        { id: "hub", x: 300, y: 160, e: "📡", l: "Provider hub" },
        { id: "n1", x: 100, y: 75, e: "🏢", l: "Offices" },
        { id: "n2", x: 500, y: 75, e: "🏬", l: "Mall" },
        { id: "n3", x: 100, y: 235, e: "🏠", l: "Homes" },
        { id: "n4", x: 500, y: 235, e: "🏥", l: "Hospital" },
      ],
      links: [["hub", "n1"], ["hub", "n2"], ["hub", "n3"], ["hub", "n4"], ["n1", "n2"], ["n3", "n4"]],
      flows: [
        { a: "n1", b: "hub", label: "fibre", delay: 0 },
        { a: "hub", b: "n4", label: "fibre", delay: 0.8 },
        { a: "n3", b: "hub", label: "fibre", delay: 1.6 },
        { a: "hub", b: "n2", label: "fibre", delay: 2.4 },
      ],
      dur: 1.6,
    },
  },
  {
    id: "SAN", name: "Storage Area Network", emoji: "🗄️", color: C.SAN,
    scope: "Inside a data centre", owner: "The data centre or company that runs the storage",
    purpose: "One job: store data and serve it to servers",
    facts: [
      { t: "A network used for a single purpose: storing and accessing information and providing services.", easy: "Unlike a LAN that carries everything, a SAN only moves data between servers and big storage boxes." },
      { t: "High-capacity devices, high speed and low-loss connectivity.", easy: "Low-loss means almost no data is dropped. Storage must be fast and reliable or databases slow down." },
      { t: "Example: data centre network.", easy: "The storage racks behind apps like online banking or video streaming sit on a SAN." },
    ],
    examples: ["Data centre network"],
    analogy: "A SAN is like a warehouse with its own private express conveyor belts, used only for moving goods in and out.",
    scene: {
      groups: [{ x: 30, y: 22, w: 540, h: 276, l: "Data centre (SAN)" }],
      nodes: [
        { id: "s1", x: 100, y: 85, e: "🖥️", l: "App server" },
        { id: "s2", x: 100, y: 235, e: "🖥️", l: "DB server" },
        { id: "sw", x: 300, y: 160, e: "⚡", l: "SAN switch" },
        { id: "d1", x: 500, y: 70, e: "🗄️", l: "Storage 1" },
        { id: "d2", x: 500, y: 160, e: "🗄️", l: "Storage 2" },
        { id: "d3", x: 500, y: 250, e: "🗄️", l: "Storage 3" },
      ],
      links: [["s1", "sw"], ["s2", "sw"], ["sw", "d1"], ["sw", "d2"], ["sw", "d3"]],
      flows: [
        { a: "s1", b: "sw", label: "block", delay: 0 },
        { a: "sw", b: "d1", label: "block", delay: 0.3 },
        { a: "s2", b: "sw", label: "block", delay: 0.6 },
        { a: "sw", b: "d3", label: "block", delay: 0.9 },
        { a: "d2", b: "sw", label: "read", delay: 1.2 },
        { a: "sw", b: "s1", label: "read", delay: 1.5 },
      ],
      dur: 0.8,
    },
  },
  {
    id: "CAN", name: "Campus Area Network", emoji: "🎓", color: C.CAN,
    scope: "A campus with several buildings", owner: "The campus IT team",
    purpose: "Join the LANs of many buildings",
    facts: [
      { t: "A network inside a campus with multiple locations and buildings.", easy: "A college has a library, hostel, labs and an admin block. Each has its own LAN, and the CAN joins them together." },
    ],
    examples: ["University", "Company campus"],
    analogy: "A CAN is a LAN of LANs: the bridges and roads that link all the buildings of one campus.",
    scene: {
      groups: [{ x: 24, y: 18, w: 552, h: 288, l: "College campus = CAN" }],
      nodes: [
        { id: "core", x: 300, y: 160, e: "🔀", l: "Campus core" },
        { id: "lib", x: 100, y: 80, e: "📚", l: "Library LAN" },
        { id: "hos", x: 100, y: 240, e: "🛏️", l: "Hostel LAN" },
        { id: "lab", x: 500, y: 80, e: "🔬", l: "Labs LAN" },
        { id: "adm", x: 500, y: 240, e: "🏛️", l: "Admin LAN" },
      ],
      links: [["core", "lib"], ["core", "hos"], ["core", "lab"], ["core", "adm"]],
      flows: [
        { a: "lib", b: "core", label: "e-book", delay: 0 },
        { a: "core", b: "lab", label: "e-book", delay: 1 },
        { a: "hos", b: "core", label: "login", delay: 2 },
        { a: "core", b: "adm", label: "login", delay: 3 },
      ],
      dur: 1.8,
    },
  },
  {
    id: "PAN", name: "Personal Area Network", emoji: "🧑", color: C.PAN,
    scope: "Around one person, a few metres", owner: "You",
    purpose: "Connect your own personal devices",
    facts: [
      { t: "A personal network at home.", easy: "Your phone, watch, earbuds and laptop talk to each other, usually over Bluetooth or home Wi-Fi." },
      { t: "Technically, a PAN is a LAN.", easy: "It is just a very small LAN that belongs to one person. That is why exams often treat it as a special case of LAN." },
    ],
    examples: ["Phone + smartwatch", "Earbuds"],
    analogy: "A PAN is the invisible bubble of devices that travels with you.",
    scene: {
      groups: [{ x: 90, y: 22, w: 420, h: 276, l: "Within a few metres of you" }],
      nodes: [
        { id: "me", x: 300, y: 160, e: "🧑", l: "You" },
        { id: "w", x: 160, y: 85, e: "⌚", l: "Watch" },
        { id: "e", x: 440, y: 85, e: "🎧", l: "Earbuds" },
        { id: "p", x: 160, y: 235, e: "📱", l: "Phone" },
        { id: "l", x: 440, y: 235, e: "💻", l: "Laptop" },
      ],
      links: [["me", "w"], ["me", "e"], ["me", "p"], ["me", "l"]],
      flows: [
        { a: "w", b: "me", label: "steps", delay: 0 },
        { a: "p", b: "e", label: "music", delay: 0.8 },
        { a: "l", b: "p", label: "sync", delay: 1.6 },
      ],
      dur: 1.2,
    },
  },
];
const TYPE = Object.fromEntries(TYPES.map((t) => [t.id, t])) as Record<TypeId, TypeDef>;

/* ───────────────────────── 1. scope ladder ───────────────────────── */

const LADDER: { id: TypeId; r: number; size: string }[] = [
  { id: "WAN", r: 190, size: "Countries and continents" },
  { id: "MAN", r: 148, size: "A city" },
  { id: "CAN", r: 108, size: "A campus" },
  { id: "LAN", r: 70, size: "A building" },
  { id: "PAN", r: 34, size: "One person" },
];

export function ScopeLadder() {
  const [sel, setSel] = useState<TypeId>("LAN");
  const [auto, setAuto] = useState(false);
  const t = TYPE[sel];

  useEffect(() => {
    if (!auto) return;
    const order = LADDER.map((l) => l.id).reverse();
    const id = setTimeout(() => setSel((s) => order[(order.indexOf(s) + 1) % order.length]), 3200);
    return () => clearTimeout(id);
  }, [auto, sel]);

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Network types by size: zoom out from PAN to WAN</CardTitle>
            <CardDescription className="mt-1">
              Network types describe scope, ownership and purpose. Tap a ring to see how far each one reaches and who runs it.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid items-center gap-4 md:grid-cols-[400px_1fr]">
          <div className="rounded-xl border bg-background p-3">
            <svg viewBox="0 0 400 400" className="mx-auto max-w-[400px]" role="img" aria-label="Concentric rings from PAN to WAN">
              {LADDER.map(({ id, r }) => {
                const on = id === sel;
                const col = TYPE[id].color;
                return (
                  <g key={id} onClick={() => { setAuto(false); setSel(id); }} className="cursor-pointer">
                    <circle cx={200} cy={210} r={r} fill={col} fillOpacity={on ? 0.28 : 0.1} stroke={col} strokeWidth={on ? 4 : 2}
                      style={{ transition: "all .4s" }} />
                    {on && <circle cx={200} cy={210} r={r} fill="none" stroke={col} strokeWidth={2} className="nt-ring" />}
                    <text x={200} y={210 - r + 20} textAnchor="middle" fontSize={id === "PAN" ? 11 : 14} fontWeight={700} fill={col}>
                      {id}
                    </text>
                  </g>
                );
              })}
              <text x={200} y={216} textAnchor="middle" fontSize={22}>{sel === "PAN" ? "🧑" : ""}</text>
            </svg>
          </div>

          <div key={sel} className="nt-fade flex flex-col gap-3 rounded-xl border bg-background p-4" style={{ borderColor: t.color }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{t.emoji}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: t.color }}>{t.id} · {t.name}</p>
                <p className="text-xs text-muted-foreground">{LADDER.find((l) => l.id === sel)?.size}</p>
              </div>
            </div>
            <dl className="grid gap-2 text-xs leading-5">
              {[["Scope", t.scope], ["Who manages it", t.owner], ["Used for", t.purpose], ["Examples", t.examples.join(", ")]].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
                  <dt className="font-medium">{k}</dt>
                  <dd className="text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-lg px-3 py-2 text-xs leading-5" style={{ background: `${t.color}18`, color: t.color }}>
              💡 {t.analogy}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LADDER.slice().reverse().map(({ id }) => (
            <Button key={id} size="sm" variant={sel === id ? "default" : "outline"} onClick={() => { setAuto(false); setSel(id); }}
              style={sel === id ? { background: TYPE[id].color, borderColor: TYPE[id].color } : undefined}>
              {id}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setAuto((a) => !a)}>{auto ? "Pause tour" : "Auto tour"}</Button>
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">
          SAN and VPN are not about size. A SAN is about its single purpose (storage) and a VPN is about security. See the next two sections.
        </p>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 2. type explorer ───────────────────────── */

export function TypeExplorer() {
  const [sel, setSel] = useState<TypeId>("LAN");
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const t = TYPE[sel];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Meet each network type</CardTitle>
            <CardDescription className="mt-1">
              Pick a type to watch data move through it. Tap any note to see it explained in simple words.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((x) => {
            const on = x.id === sel;
            return (
              <button
                key={x.id}
                onClick={() => { setSel(x.id); setOpen(null); }}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={on ? { background: x.color, borderColor: x.color, color: "#fff" } : { borderColor: `${x.color}66`, color: x.color }}
              >
                {x.emoji} {x.id}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-background p-3">
          <SceneView key={sel} scene={t.scene} color={t.color} paused={paused} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)}>{paused ? "Resume animation" : "Pause animation"}</Button>
          <Badge variant="secondary" style={{ color: t.color }}>{t.scope}</Badge>
        </div>

        <div key={sel} className="nt-fade rounded-xl border bg-background p-4" style={{ borderColor: `${t.color}88` }}>
          <p className="text-sm font-semibold" style={{ color: t.color }}>{t.id} · {t.name}</p>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">Managed by: {t.owner}. Used for: {t.purpose}.</p>
          <div className="flex flex-col gap-2">
            {t.facts.map((f, i) => {
              const on = open === i;
              return (
                <button
                  key={i}
                  onClick={() => setOpen(on ? null : i)}
                  className="rounded-lg border px-3 py-2 text-left text-xs leading-5 transition-colors hover:bg-muted/40"
                  style={on ? { borderColor: t.color, background: `${t.color}10` } : undefined}
                >
                  <span className="font-medium">{on ? "▾" : "▸"} {f.t}</span>
                  {on && <span className="nt-fade mt-1 block text-muted-foreground">💬 {f.easy}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Examples:</span>
            {t.examples.map((e) => (
              <Badge key={e} variant="secondary" style={{ color: t.color }}>{e}</Badge>
            ))}
          </div>
          <p className="mt-3 rounded-lg px-3 py-2 text-xs leading-5" style={{ background: `${t.color}18`, color: t.color }}>
            💡 {t.analogy}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 3. VPN lab ───────────────────────── */

type VMode = "site" | "remote" | "anon";
const VMODES: Record<VMode, {
  tab: string; left: [string, string]; right: [string, string]; text: string;
  dest: { off: string; on: string }; destTitle: string;
}> = {
  site: {
    tab: "Site-to-site VPN", left: ["🏢", "Branch office"], right: ["🏛️", "HQ office"],
    text: "Two office gateways build one permanent tunnel. Everyone in the branch reaches HQ as if they were on the same LAN, and nobody has to install anything on their own PC.",
    destTitle: "What HQ sees",
    dest: { off: "Branch traffic arrives across the open internet from a public IP.", on: "Branch traffic arrives inside the tunnel and looks like it came from the HQ's own private network." },
  },
  remote: {
    tab: "Remote access VPN", left: ["🧑‍💻", "Employee at home"], right: ["🏢", "Office network"],
    text: "One person's machine connects to the office. This is also called a user VPN or SSL VPN. It connects individual client machines, not whole offices.",
    destTitle: "What the office sees",
    dest: { off: "A random home IP asking for office files. The office blocks it.", on: "The laptop is inside the tunnel and gets an office address, so it can use office servers like a colleague." },
  },
  anon: {
    tab: "Mask my IP", left: ["🧑", "You"], right: ["🛡️", "VPN server"],
    text: "The website only ever talks to the VPN server, so it sees the server's IP, not yours. Your apparent location changes and you gain anonymity.",
    destTitle: "What the website sees",
    dest: { off: "IP 203.0.113.7 · Bengaluru, India (this is you)", on: "IP 198.51.100.20 · Frankfurt, Germany (the VPN server)" },
  },
};

export function VpnLab() {
  const [mode, setMode] = useState<VMode>("site");
  const [on, setOn] = useState(false);
  const m = VMODES[mode];
  const color = on ? C.GREEN : C.RED;
  const label = on ? "🔒 x9F#kQ2" : "pw=1234";

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">VPN lab: a private tunnel through the internet</CardTitle>
            <CardDescription className="mt-1">
              A VPN is a virtual tunnel through the public internet that carries private traffic securely. Flip the switch to compare.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(VMODES) as VMode[]).map((k) => (
            <button key={k} onClick={() => setMode(k)} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={mode === k ? { background: C.VPN, borderColor: C.VPN, color: "#fff" } : { borderColor: `${C.VPN}66`, color: C.VPN }}>
              {VMODES[k].tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-background p-3">
          <svg viewBox="0 0 600 270" className="mx-auto min-w-[560px] max-w-[760px]" role="img" aria-label="Data travelling across the internet with or without a VPN tunnel">
            <ellipse cx={300} cy={110} rx={120} ry={66} fill="#1971c2" fillOpacity={0.1} stroke="#1971c2" strokeWidth={2} strokeDasharray="6 5" />
            <text x={300} y={62} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1971c2">☁️ Public internet</text>

            {on && (
              <g key={mode} className="nt-fade">
                <rect x={118} y={86} width={364} height={48} rx={24} fill={C.GREEN} fillOpacity={0.16} stroke={C.GREEN} strokeWidth={3}
                  strokeDasharray="10 7" className="nt-dash" />
                <text x={300} y={152} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN}>Encrypted tunnel</text>
              </g>
            )}

            {[{ x: 70, d: m.left }, { x: 530, d: m.right }].map(({ x, d }) => (
              <g key={d[1]}>
                <circle cx={x} cy={110} r={34} className="fill-background" stroke={C.VPN} strokeWidth={2.5} />
                <text x={x} y={120} textAnchor="middle" fontSize={30}>{d[0]}</text>
                <text x={x} y={166} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{d[1]}</text>
              </g>
            ))}

            {[0, 1, 2].map((i) => (
              <Chip key={`${mode}-${on}-${i}`} x0={104} y0={110} x1={496} y1={110} label={label} color={color}
                dur={4 * SLOW} delay={i * 1.3 * SLOW} paused={false} />
            ))}

            <g opacity={0.95}>
              <text x={300} y={218} textAnchor="middle" fontSize={26}>🕵️</text>
              <text x={300} y={244} textAnchor="middle" fontSize={11} fontWeight={600} fill={on ? C.GREEN : C.RED}>
                {on ? "Snooper sees only scrambled text" : "Snooper can read everything"}
              </text>
            </g>
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setOn((v) => !v)} style={{ background: on ? C.GREEN : C.RED, color: "#fff" }}>
            VPN is {on ? "ON" : "OFF"}: turn {on ? "off" : "on"}
          </Button>
        </div>

        <div key={`${mode}-${on}`} className="nt-fade grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-background p-4 text-xs leading-5">
            <p className="mb-1 text-sm font-semibold" style={{ color: C.VPN }}>{m.tab}</p>
            <p className="text-muted-foreground">{m.text}</p>
          </div>
          <div className="rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: color }}>
            <p className="mb-1 text-sm font-semibold" style={{ color }}>{m.destTitle}</p>
            <p className="font-mono text-muted-foreground">{on ? m.dest.on : m.dest.off}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 4. quiz ───────────────────────── */

const CHOICES = ["PAN", "LAN", "CAN", "MAN", "WAN", "SAN", "VPN"] as const;
type Choice = (typeof CHOICES)[number];
const QS: { q: string; a: Choice; why: string }[] = [
  { q: "Computers and a printer inside one office building, managed by the company's IT team.", a: "LAN", why: "Small area, private, high speed, managed by one organization." },
  { q: "Jio and Airtel link millions of LANs across the whole country.", a: "WAN", why: "A collection of LANs over a large area, run by ISPs. Simply, the internet." },
  { q: "ACT Fibernet sells broadband across all of Bengaluru.", a: "MAN", why: "A public network that spans one city." },
  { q: "Servers read and write to big, fast, low-loss storage in a data centre.", a: "SAN", why: "A network with a single purpose: storing and accessing data." },
  { q: "A university joins its library, hostel and lab networks together.", a: "CAN", why: "A network across multiple buildings and locations in one campus." },
  { q: "Your watch, earbuds and phone talk to each other near you.", a: "PAN", why: "A personal network around one person. Technically a small LAN." },
  { q: "A branch office reaches HQ through an encrypted tunnel over the internet.", a: "VPN", why: "A virtual tunnel through the public internet that carries private traffic securely." },
];

export function NetworkQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Choice | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QS.length;
  const q = QS[Math.min(i, QS.length - 1)];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Which network is this?</CardTitle>
            <CardDescription className="mt-1">Read the situation and choose the network type.</CardDescription>
          </div>
          <Badge variant="secondary">Practice</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {done ? (
          <div className="nt-fade rounded-xl border bg-background p-4 text-sm">
            <p className="font-semibold">You scored {score} out of {QS.length}.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {score === QS.length ? "Perfect. You know all seven." : "Revisit the explorer above for the ones you missed."}
            </p>
          </div>
        ) : (
          <div key={i} className="nt-fade rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">Question {i + 1} of {QS.length}</p>
            <p className="mt-1 text-sm font-medium">{q.q}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CHOICES.map((c) => {
                const right = pick && c === q.a;
                const wrong = pick === c && c !== q.a;
                return (
                  <Button key={c} size="sm" variant="outline" disabled={!!pick}
                    onClick={() => { setPick(c); if (c === q.a) setScore((s) => s + 1); }}
                    style={right ? { background: C.GREEN, color: "#fff", opacity: 1 } : wrong ? { background: C.RED, color: "#fff", opacity: 1 } : undefined}>
                    {c}
                  </Button>
                );
              })}
            </div>
            {pick && (
              <p className="nt-fade mt-3 text-xs leading-5" style={{ color: pick === q.a ? C.GREEN : C.RED }}>
                {pick === q.a ? "Correct. " : `Not quite, it is ${q.a}. `}
                <span className="text-muted-foreground">{q.why}</span>
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {!done && pick && <Button size="sm" onClick={() => { setPick(null); setI((x) => x + 1); }}>{i === QS.length - 1 ? "See score" : "Next question"}</Button>}
          <Button size="sm" variant="ghost" onClick={() => { setI(0); setPick(null); setScore(0); }}>Restart</Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── main export ───────────────────────── */

export function NetworkTypes() {
  return (
    <div>
      <style>{`
        @keyframes nt-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes nt-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes nt-dash { to { stroke-dashoffset: -26; } }
        @keyframes nt-ring { 0% { opacity: .8; transform: scale(1); } 100% { opacity: 0; transform: scale(1.12); } }
        .nt-pkt  { animation: nt-move 2s linear infinite both; }
        .nt-fade { animation: nt-fade ${0.5 * SLOW}s ease-out both; }
        .nt-dash { animation: nt-dash ${1.2 * SLOW}s linear infinite; }
        .nt-ring { transform-origin: 200px 210px; animation: nt-ring ${1.6 * SLOW}s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .nt-pkt, .nt-fade, .nt-dash, .nt-ring { animation: none; opacity: 1; } .nt-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>
      <p className="text-sm text-muted-foreground">
        Network types describe scope, ownership and purpose: from a single office LAN up to a global WAN, plus specialized types like SAN and VPN.
      </p>
      <ScopeLadder />
      <TypeExplorer />
      <VpnLab />
      <NetworkQuiz />
    </div>
  );
}

export default NetworkTypes;