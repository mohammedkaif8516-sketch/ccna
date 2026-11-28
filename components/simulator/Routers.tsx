"use client";
import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Routers (routing tables, L3 forwarding decisions)
 * 1. RouterBasics: a "router as a hub of networks" panel. Tap an interface to see which network it joins, plus the core facts.
 * 2. RoutingDecisionLab: a drag-free "lookup desk". Type or pick a destination IP, watch the router read the L3 header and match a route.
 * 3. BestPathLab: a map with two possible paths. Block a link and watch the routing table pick a new best path.
 * 4. PortDomainsLab: slide through ports and see that each one owns a broadcast domain and a collision domain.
 * Rule to remember: a router reads the L3 header, finds the best path in its routing table, and forwards the packet out of the matching interface.
 */

const SLOW = 1.4;
const C = { BLUE: "#1971c2", GREEN: "#2f9e44", AMBER: "#f08c00", ORANGE: "#e8590c", PURPLE: "#9c36b5", PINK: "#d6336c", TEAL: "#0c8599", RED: "#c92a2a", LBLUE: "#1c7ed6", COPPER: "#b87333" };
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
    <g className="rr-pkt" style={{ "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties}>
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

function Shell({ title, desc, badge = "Interactive", accent, children }: { title: string; desc: string; badge?: string; accent: string; children: ReactNode }) {
  return (
    <Card className="mt-8 overflow-hidden bg-background" style={{ borderColor: `${accent}88`, borderTopWidth: 4, borderTopColor: accent }}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base" style={{ color: accent }}>{title}</CardTitle>
            <CardDescription className="mt-1">{desc}</CardDescription>
          </div>
          <Badge variant="outline" style={{ borderColor: accent, color: accent }}>{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

const Tip = ({ color, children }: { color: string; children: ReactNode }) => (
  <p className="rounded-lg border-l-4 px-3 py-2 text-xs leading-5" style={{ background: `${color}18`, color, borderColor: color }}>💡 {children}</p>
);

const Pills = <T extends string>({ items, sel, set, color }: { items: { id: T; label: string }[]; sel: T; set: (v: T) => void; color: string }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((x) => (
      <button key={x.id} onClick={() => set(x.id)} className="rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-colors"
        style={sel === x.id ? { background: color, borderColor: color, color: "#fff" } : { borderColor: `${color}66`, color }}>
        {x.label}
      </button>
    ))}
  </div>
);

/* ---------- Shared scene ---------- */
type Id = string;
type SceneNode = { id: Id; x: number; y: number; e: string; l: string; sub?: string };
type Group = { x: number; y: number; w: number; h: number; label: string; color: string };
type Flow = { a: Id; b: Id; label: string; delay: number; color: string };
type Link = { a: Id; b: Id; color?: string; off?: boolean };
type Scene = { groups: Group[]; nodes: SceneNode[]; links: Link[]; flows: Flow[]; dur: number };

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
        {scene.links.map((l) => {
          const A = at(scene, l.a), B = at(scene, l.b);
          return l.off
            ? <line key={l.a + l.b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={C.RED} strokeWidth={2} strokeDasharray="2 8" opacity={0.7} />
            : <line key={l.a + l.b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="rr-dash" stroke={l.color ?? GREY} strokeWidth={2} strokeDasharray="7 6" />;
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

/* ---------- Section 1: Router basics (interface hub) ---------- */
type Iface = { id: string; port: string; net: string; cidr: string; dev: string; e: string; color: string };
const IFACES: Iface[] = [
  { id: "p1", port: "Port 1", net: "Network A", cidr: "192.0.2.0/24", dev: "PC A", e: "💻", color: C.BLUE },
  { id: "p2", port: "Port 2", net: "Network B", cidr: "198.51.100.0/24", dev: "PC B", e: "🖥️", color: C.TEAL },
  { id: "p3", port: "Port 3", net: "Network C", cidr: "203.0.113.0/24", dev: "PC C", e: "📱", color: C.PURPLE },
];
const FACTS: { head: string; items: { fact: string; simple: string }[] }[] = [
  {
    head: "What a router is",
    items: [
      { fact: "A router is a Layer 3 device that operates in the Network layer.", simple: "It works with IP addresses and packets." },
      { fact: "It is used for connecting networks and enabling connectivity between networks.", simple: "It lets devices in different networks talk to each other." },
      { fact: "Each router interface is connected to a network.", simple: "Every port faces one network (LAN)." },
    ],
  },
  {
    head: "How routing works",
    items: [
      { fact: "When traffic (a packet) comes into the router, it takes a forwarding decision based on the L3 header of the packet.", simple: "It reads the IP header, then decides where the packet goes." },
      { fact: "The router has intelligent forwarding capability because it maintains a routing table.", simple: "It keeps a list, so it can choose smartly." },
      { fact: "The routing table contains the best paths (routes) to reach a destination network.", simple: "Each row says which way to go to reach a network." },
      { fact: "The router forwards traffic based on these available best paths. This process is called routing.", simple: "Look up the best path, then send. That is routing." },
    ],
  },
];

export function RouterBasics() {
  const [sel, setSel] = useState<string>("p1");
  const [open, setOpen] = useState<string | null>(null);
  const f = IFACES.find((x) => x.id === sel) ?? IFACES[0];
  const R: P = { x: 300, y: 150 };
  const spots: P[] = [{ x: 90, y: 60 }, { x: 510, y: 60 }, { x: 300, y: 262 }];
  return (
    <Shell title="Router at the centre" desc="A router sits between networks. Tap a port to see which network it connects to. Addresses are examples." accent={C.BLUE}>
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 320" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="A router in the middle with three ports, each connected to a different network">
          {IFACES.map((x, i) => {
            const s = spots[i] ?? R;
            const [x0, y0, x1, y1] = edge(R, s, 30);
            const on = x.id === sel;
            return (
              <g key={x.id} style={{ cursor: "pointer" }} onClick={() => setSel(x.id)}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} className="rr-dash" stroke={on ? x.color : GREY} strokeWidth={on ? 3 : 2} strokeDasharray="7 6" />
                <rect x={s.x - 60} y={s.y - 32} width={120} height={64} rx={12} fill={`${x.color}${on ? "18" : "10"}`} stroke={on ? x.color : `${x.color}88`} strokeWidth={on ? 2.5 : 1.5} strokeDasharray="5 4" />
                <text x={s.x} y={s.y - 6} textAnchor="middle" fontSize={22}>{x.e}</text>
                <text x={s.x} y={s.y + 12} textAnchor="middle" fontSize={11} fontWeight={700} fill={x.color}>{x.net}</text>
                <text x={s.x} y={s.y + 25} textAnchor="middle" fontSize={10} fill={GREY}>{x.dev}</text>
                <text x={(R.x + s.x) / 2} y={(R.y + s.y) / 2 - 6} textAnchor="middle" fontSize={10} fontWeight={700} fill={x.color}>{x.port}</text>
              </g>
            );
          })}
          <Node p={R} e="🔀" l="Router" sub="Layer 3" stroke={f.color} />
          <Chip key={sel} a={R} b={spots[IFACES.findIndex((x) => x.id === sel)] ?? R} r={30} label="packet" color={f.color} dur={2 * SLOW} delay={0} />
        </svg>
      </div>
      <div key={sel} className="rr-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: f.color, color: f.color }}>
        {f.port} is connected to {f.net} ({f.cidr}). Each router interface is connected to a network.
      </div>
      {FACTS.map((g) => (
        <div key={g.head} className="flex flex-col gap-2">
          <p className="text-sm font-semibold" style={{ color: C.BLUE }}>{g.head}</p>
          {g.items.map((it) => (
            <button key={it.fact} onClick={() => setOpen(open === it.fact ? null : it.fact)} className="rounded-xl border-l-4 border bg-background p-3 text-left text-xs leading-5"
              style={{ borderLeftColor: C.BLUE, borderColor: open === it.fact ? C.BLUE : undefined }}>
              <span className="font-medium">{it.fact}</span>
              {open === it.fact && <span className="rr-fade mt-1 block text-muted-foreground">💬 {it.simple}</span>}
            </button>
          ))}
        </div>
      ))}
      <Tip color={C.BLUE}>Think of a router as a junction: every port is a road to a different network.</Tip>
    </Shell>
  );
}

/* ---------- Section 2: Routing decision lab ---------- */
type RouteRow = { net: string; prefix: string; port: string; where: string; color: string };
const TABLE: RouteRow[] = [
  { net: "192.0.2.0/24", prefix: "192.0.2.", port: "Port 1", where: "Network A", color: C.BLUE },
  { net: "198.51.100.0/24", prefix: "198.51.100.", port: "Port 2", where: "Network B", color: C.TEAL },
  { net: "203.0.113.0/24", prefix: "203.0.113.", port: "Port 3", where: "Network C", color: C.PURPLE },
];
const DESTS: string[] = ["192.0.2.25", "198.51.100.40", "203.0.113.60", "8.8.8.8"];
type Phase = 0 | 1 | 2 | 3;
const PH_LABEL: string[] = ["Packet arrives", "Read L3 header", "Look up routing table", "Forward"];

export function RoutingDecisionLab() {
  const [dest, setDest] = useState<string>(DESTS[2] ?? "203.0.113.60");
  const [ph, setPh] = useState<Phase>(0);
  const [auto, setAuto] = useState(false);
  const idx = TABLE.findIndex((r) => dest.startsWith(r.prefix));
  const hit = idx >= 0 ? TABLE[idx] : undefined;

  useEffect(() => {
    if (!auto) return;
    if (ph >= 3) { setAuto(false); return; }
    const t = setTimeout(() => setPh((p) => (p < 3 ? ((p + 1) as Phase) : p)), 2200);
    return () => clearTimeout(t);
  }, [auto, ph]);

  const pick = (d: string) => { setDest(d); setPh(0); setAuto(false); };
  const run = () => { setPh(0); setAuto(true); setTimeout(() => setPh(1), 50); };
  const col = hit ? C.GREEN : C.RED;

  return (
    <Shell title="Routing decision desk" desc="Pick a destination IP. Step through the router's decision. The last address has no route, so you can see what that looks like." accent={C.AMBER}>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Destination IP in the L3 header (example)</p>
        <Pills items={DESTS.map((d) => ({ id: d, label: d }))} sel={dest} set={pick} color={C.AMBER} />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {PH_LABEL.map((l, i) => {
          const state = i === ph ? "active" : i < ph ? "done" : "todo";
          return (
            <div key={l} className="rounded-lg border-2 px-3 py-2 text-center text-[11px] font-semibold"
              style={state === "active" ? { background: `${C.AMBER}18`, borderColor: C.AMBER, color: C.AMBER } : state === "done" ? { borderColor: `${C.GREEN}66`, color: C.GREEN } : { borderColor: `${GREY}55`, color: GREY }}>
              {i + 1}. {l}
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border bg-background p-4">
        <p className="text-xs text-muted-foreground">Packet header</p>
        <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
          <span className="rounded-md px-2 py-1" style={{ background: `${C.BLUE}18`, color: C.BLUE }}>src 192.0.2.10</span>
          <span key={`${dest}-${ph}`} className={`rounded-md px-2 py-1 ${ph === 1 ? "rr-pop" : ""}`} style={{ background: `${ph >= 1 ? C.AMBER : GREY}18`, color: ph >= 1 ? C.AMBER : GREY, fontWeight: ph >= 1 ? 700 : 400 }}>dst {dest}</span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Destination network</th><th className="px-3 py-2">Where</th><th className="px-3 py-2">Send out of</th></tr></thead>
          <tbody>
            {TABLE.map((r, i) => {
              const on = ph >= 2 && i === idx;
              return (
                <tr key={`${dest}-${ph}-${r.net}`} className={`border-t ${on ? "rr-fade" : ""}`} style={on ? { background: `${C.GREEN}18`, color: C.GREEN, fontWeight: 700 } : undefined}>
                  <td className="px-3 py-2 font-mono">{r.net}</td><td className="px-3 py-2">{r.where}</td><td className="px-3 py-2">{r.port}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div key={`${dest}-${ph}`} className="rr-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: ph === 0 ? GREY : ph < 3 ? C.AMBER : col, color: ph === 0 ? GREY : ph < 3 ? C.AMBER : col }}>
        {ph === 0 && "A packet arrives at the router. Press Next to take the forwarding decision."}
        {ph === 1 && "The router reads the L3 header and finds the destination IP."}
        {ph === 2 && (hit ? `The router looks in its routing table and finds the best path: ${hit.net} via ${hit.port}.` : "The router looks in its routing table, but there is no route for this destination in the example table.")}
        {ph === 3 && (hit ? `✓ The router forwards the packet out of ${hit.port} to ${hit.where}. This is routing.` : "✕ No matching route, so this example router cannot forward the packet.")}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={ph >= 3} onClick={() => { setAuto(false); setPh((p) => (p < 3 ? ((p + 1) as Phase) : p)); }}>Next</Button>
        <Button size="sm" variant="outline" onClick={run}>Auto-play</Button>
        <Button size="sm" variant="outline" onClick={() => { setAuto(false); setPh(0); }}>Reset</Button>
      </div>
      <Tip color={C.AMBER}>The decision uses the L3 header. The answer comes from the routing table.</Tip>
    </Shell>
  );
}

/* ---------- Section 3: Best path lab ---------- */
type Path = "top" | "bottom";
const BNODES: SceneNode[] = [
  { id: "a", x: 70, y: 150, e: "💻", l: "PC A" },
  { id: "r1", x: 230, y: 150, e: "🔀", l: "Router 1" },
  { id: "r2", x: 400, y: 50, e: "🔀", l: "Router 2", sub: "Top path" },
  { id: "r3", x: 400, y: 250, e: "🔀", l: "Router 3", sub: "Bottom path" },
  { id: "b", x: 540, y: 150, e: "🖥️", l: "PC B" },
];
const PATHS: Record<Path, { ids: Id[]; label: string }> = {
  top: { ids: ["a", "r1", "r2", "b"], label: "Top path" },
  bottom: { ids: ["a", "r1", "r3", "b"], label: "Bottom path" },
};

export function BestPathLab() {
  const [topDown, setTopDown] = useState(false);
  const [botDown, setBotDown] = useState(false);
  const best: Path | null = !topDown ? "top" : !botDown ? "bottom" : null;
  const links: Link[] = [
    { a: "a", b: "r1" },
    { a: "r1", b: "r2", off: topDown },
    { a: "r2", b: "b", off: topDown },
    { a: "r1", b: "r3", off: botDown },
    { a: "r3", b: "b", off: botDown },
  ].map((l) => ({ ...l, color: best && PATHS[best].ids.includes(l.a) && PATHS[best].ids.includes(l.b) ? C.GREEN : GREY }));
  const flows: Flow[] = best
    ? PATHS[best].ids.slice(0, -1).map((id, i) => ({ a: id, b: PATHS[best].ids[i + 1] ?? "b", label: "packet", delay: i * 1.1, color: C.GREEN }))
    : [{ a: "a", b: "r1", label: "packet", delay: 0, color: C.RED }];
  const scene: Scene = { groups: [], nodes: BNODES, links, flows, dur: 2, };
  const key = `${topDown}-${botDown}`;
  const onPath = (n: Id) => (best ? PATHS[best].ids.includes(n) : false);
  const rows: { dest: string; via: string; state: string; ok: boolean }[] = [
    { dest: "PC B network", via: "Router 2 (top)", state: topDown ? "Down" : "Up", ok: !topDown },
    { dest: "PC B network", via: "Router 3 (bottom)", state: botDown ? "Down" : "Up", ok: !botDown },
  ];
  return (
    <Shell title="Finding the best path" desc="The routing table keeps the best paths to a destination. Break a link and see the router forward over the path that is still available. This is a simple illustration." accent={C.GREEN}>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={topDown ? "default" : "outline"} onClick={() => setTopDown((v) => !v)}>{topDown ? "Fix top path" : "Break top path"}</Button>
        <Button size="sm" variant={botDown ? "default" : "outline"} onClick={() => setBotDown((v) => !v)}>{botDown ? "Fix bottom path" : "Break bottom path"}</Button>
      </div>
      <SceneSvg scene={scene} k={key} aria="Router 1 can send a packet to PC B over a top path or a bottom path" stroke={(n) => (onPath(n) ? C.GREEN : best === null && (n === "r1" || n === "a") ? C.RED : GREY)}
        extra={best === null ? <text key={key} x={300} y={150} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED} className="rr-fade">✕ no route left</text> : null} />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2">Destination</th><th className="px-3 py-2">Route via</th><th className="px-3 py-2">Link</th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const chosen = best !== null && ((best === "top" && i === 0) || (best === "bottom" && i === 1));
              return (
                <tr key={`${key}-${i}`} className="border-t" style={chosen ? { background: `${C.GREEN}18`, color: C.GREEN, fontWeight: 700 } : !r.ok ? { color: C.RED } : undefined}>
                  <td className="px-3 py-2">{r.dest}</td><td className="px-3 py-2">{r.via}{chosen ? " (best path)" : ""}</td><td className="px-3 py-2">{r.state}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div key={key} className="rr-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: best ? C.GREEN : C.RED, color: best ? C.GREEN : C.RED }}>
        {best === "top" && "✓ Both paths work, so the router uses the top route from its routing table."}
        {best === "bottom" && "✓ The top path is down, so the router forwards over the bottom route that is still available."}
        {best === null && "✕ Both paths are down. The routing table has no available route to reach the destination network."}
      </div>
      <Tip color={C.GREEN}>The router forwards traffic based on the available best paths in its routing table.</Tip>
    </Shell>
  );
}

/* ---------- Section 4: Port domains lab ---------- */
export function PortDomainsLab() {
  const [port, setPort] = useState<number>(0);
  const [mode, setMode] = useState<"broadcast" | "collision">("broadcast");
  const nodes: SceneNode[] = [
    { id: "r", x: 300, y: 160, e: "🔀", l: "Router" },
    { id: "a", x: 80, y: 160, e: "💻", l: "PC A", sub: "Port 1" },
    { id: "b", x: 520, y: 70, e: "💻", l: "PC B", sub: "Port 2" },
    { id: "c", x: 520, y: 255, e: "💻", l: "PC C", sub: "Port 3" },
  ];
  const ids: Id[] = ["a", "b", "c"];
  const geom = [{ x: 15, y: 90, w: 130, h: 140 }, { x: 455, y: 5, w: 130, h: 140 }, { x: 455, y: 175, w: 130, h: 140 }];
  const col = mode === "broadcast" ? C.ORANGE : C.TEAL;
  const groups: Group[] = geom.map((g, i) => ({ ...g, label: `Port ${i + 1} ${mode}`, color: i === port ? col : GREY }));
  const src = ids[port] ?? "a";
  const scene: Scene = {
    groups, nodes, dur: 2.4,
    links: ids.map((i) => ({ a: i, b: "r", color: i === src ? col : GREY })),
    flows: mode === "broadcast"
      ? [{ a: src, b: "r", label: "broadcast", delay: 0, color: C.AMBER }]
      : [{ a: src, b: "r", label: "frame", delay: 0, color: C.BLUE }, { a: "r", b: src, label: "frame", delay: 0, color: C.BLUE }],
  };
  return (
    <Shell title="One domain per port" desc="Every router port has its own broadcast domain and its own collision domain. Pick a port and a domain type." accent={C.ORANGE}>
      <Pills items={[0, 1, 2].map((i) => ({ id: String(i), label: `Port ${i + 1}` }))} sel={String(port)} set={(v) => setPort(Number(v))} color={C.ORANGE} />
      <Pills<"broadcast" | "collision"> items={[{ id: "broadcast", label: "Broadcast domain" }, { id: "collision", label: "Collision domain" }]} sel={mode} set={setMode} color={C.TEAL} />
      <SceneSvg scene={scene} k={`${port}-${mode}`} aria={`Port ${port + 1} shown as its own ${mode} domain`} stroke={(n) => (n === src ? col : n === "r" ? C.AMBER : GREY)}
        extra={mode === "broadcast"
          ? <text key={`${port}-b`} x={300} y={112} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED} className="rr-fade" style={{ animationDelay: `${1 * SLOW}s` }}>✕ does not cross the router</text>
          : <text key={`${port}-c`} x={300} y={112} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN} className="rr-fade" style={{ animationDelay: `${1 * SLOW}s` }}>✓ own collision domain</text>} />
      <div key={`${port}-${mode}`} className="rr-fade rounded-xl border-2 p-3 text-xs leading-5" style={{ borderColor: col, color: col }}>
        {mode === "broadcast"
          ? `Port ${port + 1} has its own broadcast domain. A broadcast sent here stays inside this network.`
          : `Port ${port + 1} has its own collision domain. Traffic here cannot collide with traffic on the other ports.`}
      </div>
      <Tip color={C.ORANGE}>Every router port has its own broadcast domain and its own collision domain.</Tip>
    </Shell>
  );
}

/* ---------- Main ---------- */
export function Routers() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <style>{`
@keyframes rr-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
@keyframes rr-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes rr-dash { to { stroke-dashoffset: -26; } }
@keyframes rr-pop  { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
@keyframes rr-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
@keyframes rr-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.rr-pkt  { animation: rr-move 2s linear infinite both; }
.rr-fade { animation: rr-fade ${0.5 * SLOW}s ease-out both; }
.rr-dash { animation: rr-dash ${1.2 * SLOW}s linear infinite; }
.rr-pop  { animation: rr-pop ${0.4 * SLOW}s ease-out both; }
.rr-ring { animation: rr-ring ${1.6 * SLOW}s ease-out infinite; }
.rr-shake { animation: rr-shake .4s ease-in-out; }
@media (prefers-reduced-motion: reduce) { .rr-pkt, .rr-fade, .rr-dash, .rr-pop, .rr-ring, .rr-shake { animation: none; opacity: 1; } .rr-pkt { transform: translate(var(--x1), var(--y1)); } }
`}</style>
      <h1 className="text-xl font-semibold">Routers: routing tables and L3 forwarding decisions</h1>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">A router is a Layer 3 device that connects networks and forwards traffic based on the routing table it maintains.</p>
      <RouterBasics />
      <RoutingDecisionLab />
      <BestPathLab />
      <PortDomainsLab />
    </div>
  );
}

export default Routers;