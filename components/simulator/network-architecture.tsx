"use client";

import { useState, type CSSProperties } from "react";
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
 * NetworkArchitectures
 * 1 ArchitectureExplorer – Client/Server, Mainframe/Terminal, Peer-to-Peer with animated scenes
 * 2 ClientServerLab      – crash the server, then add a backup server in another location
 * 3 P2PLab               – click a peer: it becomes a client while others act as servers
 * 4 ArchQuiz             – "Which architecture is this?"
 * Rule to remember: the architecture is decided by WHERE the thinking (processing) and the data live.
 */

const SLOW = 1.4; // animation slow-down factor (1 = fast, higher = slower)

const C = {
  CS: "#1971c2",
  MT: "#9c36b5",
  P2P: "#2f9e44",
  RED: "#c92a2a",
  GREEN: "#2f9e44",
  AMBER: "#f08c00",
};
const mono = "ui-monospace, monospace";

type P = { x: number; y: number };

const edge = (A: P, B: P, r = 28): [number, number, number, number] => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return [A.x + ux * r, A.y + uy * r, B.x - ux * r, B.y - uy * r];
};

function Chip({
  a, b, label, color, dur, delay, paused = false,
}: {
  a: P; b: P; label: string; color: string; dur: number; delay: number; paused?: boolean;
}) {
  const [x0, y0, x1, y1] = edge(a, b);
  const w = label.length * 6.2 + 16;
  return (
    <g
      className="na-pkt"
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

/* ───────────────────────── scenes ───────────────────────── */

type SNode = P & { id: string; e: string; l: string; tag?: "think" | "dumb" };
type Scene = {
  nodes: SNode[];
  links: [string, string][];
  flows: { a: string; b: string; label: string; delay: number; reply?: boolean }[];
  dur: number;
};

function SceneView({ scene, color, paused }: { scene: Scene; color: string; paused: boolean }) {
  const byId = Object.fromEntries(scene.nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 600 320" className="mx-auto min-w-[560px] max-w-[760px]" role="img" aria-label="Animated network architecture diagram">
      {scene.links.map(([a, b]) => {
        const [x0, y0, x1, y1] = edge(byId[a], byId[b]);
        return (
          <line key={a + b} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeOpacity={0.5} strokeWidth={2.5}
            strokeDasharray="7 6" className="na-dash" style={{ animationPlayState: paused ? "paused" : "running" }} />
        );
      })}
      {scene.nodes.map((n) => (
        <g key={n.id}>
          {n.tag === "think" && <circle cx={n.x} cy={n.y} r={28} fill="none" stroke={C.AMBER} strokeWidth={3} className="na-ring" style={{ transformOrigin: `${n.x}px ${n.y}px` }} />}
          <circle cx={n.x} cy={n.y} r={28} className="fill-background" stroke={n.tag === "think" ? C.AMBER : n.tag === "dumb" ? C.RED : color} strokeWidth={2.5} />
          <text x={n.x} y={n.y + 9} textAnchor="middle" fontSize={26}>{n.e}</text>
          <text x={n.x} y={n.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{n.l}</text>
          {n.tag && (
            <text x={n.x} y={n.y - 36} textAnchor="middle" fontSize={10} fontWeight={700} fill={n.tag === "think" ? C.AMBER : C.RED}>
              {n.tag === "think" ? "⚙️ thinks here" : "🚫 no brain"}
            </text>
          )}
        </g>
      ))}
      {scene.flows.map((f, i) => (
        <Chip key={i} a={byId[f.a]} b={byId[f.b]} label={f.label} color={f.reply ? C.GREEN : color}
          dur={scene.dur * SLOW} delay={f.delay * SLOW} paused={paused} />
      ))}
    </svg>
  );
}

type Fact = { k: "good" | "bad" | "fix" | "info"; t: string; easy: string };
type Arch = {
  id: "CS" | "MT" | "P2P"; name: string; emoji: string; color: string; tagline: string;
  facts: Fact[]; analogy: string; scene: Scene;
  where: { processing: string; storage: string; io: string };
};

const KIND: Record<Fact["k"], { dot: string; label: string }> = {
  good: { dot: C.GREEN, label: "Advantage" },
  bad: { dot: C.RED, label: "Disadvantage" },
  fix: { dot: C.AMBER, label: "Solution" },
  info: { dot: "#868e96", label: "Key idea" },
};

const ARCHS: Arch[] = [
  {
    id: "CS", name: "Client/Server", emoji: "🖥️", color: C.CS,
    tagline: "Clients ask. One central server answers.",
    where: { processing: "On the server (clients mostly show the result)", storage: "Central server", io: "Every client device" },
    facts: [
      { k: "info", t: "Client devices connect to a server and request information or services from it.", easy: "When you open a website your phone is the client. It asks, and the server sends back the page." },
      { k: "info", t: "A centralized device and storage setup.", easy: "The data lives in one main place instead of being scattered across everyone's computers." },
      { k: "good", t: "Easily accessible.", easy: "Any client with permission can reach the same server from anywhere on the network." },
      { k: "good", t: "Easily manageable.", easy: "Updating or fixing one server is far easier than touching hundreds of PCs." },
      { k: "good", t: "Centralized security.", easy: "Passwords, firewalls and permissions are set in one place, so it is easier to protect." },
      { k: "good", t: "Centralized data management.", easy: "Backups, copies and records are all handled in one spot." },
      { k: "good", t: "Cost effective.", easy: "Clients can be cheap devices, and you invest in one strong server." },
      { k: "bad", t: "If the server fails, data is lost or inaccessible.", easy: "One broken server means every client is stuck. This is called a single point of failure." },
      { k: "fix", t: "Keep a backup server spread across locations.", easy: "If the main server in one city fails, a copy in another city takes over. Try it in the lab below." },
    ],
    analogy: "Like a restaurant: many customers (clients) order from one kitchen (server).",
    scene: {
      nodes: [
        { id: "s", x: 300, y: 80, e: "🖥️", l: "Server", tag: "think" },
        { id: "c1", x: 80, y: 245, e: "💻", l: "Client 1" },
        { id: "c2", x: 230, y: 245, e: "📱", l: "Client 2" },
        { id: "c3", x: 380, y: 245, e: "💻", l: "Client 3" },
        { id: "c4", x: 520, y: 245, e: "📱", l: "Client 4" },
      ],
      links: [["s", "c1"], ["s", "c2"], ["s", "c3"], ["s", "c4"]],
      flows: [
        { a: "c1", b: "s", label: "request", delay: 0 },
        { a: "s", b: "c1", label: "response", delay: 1.2, reply: true },
        { a: "c3", b: "s", label: "request", delay: 0.6 },
        { a: "s", b: "c3", label: "response", delay: 1.8, reply: true },
        { a: "c2", b: "s", label: "request", delay: 2.4 },
        { a: "s", b: "c2", label: "response", delay: 3.6, reply: true },
      ],
      dur: 1.2,
    },
  },
  {
    id: "MT", name: "Mainframe / Terminal", emoji: "🏛️", color: C.MT,
    tagline: "The terminal types and shows. The mainframe does everything else.",
    where: { processing: "All on the mainframe", storage: "Mainframe", io: "Terminal (keyboard + screen only)" },
    facts: [
      { k: "info", t: "Operates similarly to client/server, but the thinking happens in a very different place.", easy: "Looks like client/server from outside, but the client side here has no brain at all." },
      { k: "info", t: "Mainframe: the central powerhouse where all computing, processing and data storage take place.", easy: "One huge, powerful computer runs every program and keeps every file." },
      { k: "info", t: "Terminal: a dumb device used purely for input (keyboard) and output (display screen).", easy: "It only sends your keystrokes and shows what comes back. It has no local processing power." },
    ],
    analogy: "Like a TV remote and screen: you press buttons and watch, but all the work happens elsewhere.",
    scene: {
      nodes: [
        { id: "m", x: 300, y: 80, e: "🏛️", l: "Mainframe", tag: "think" },
        { id: "t1", x: 100, y: 245, e: "⌨️", l: "Terminal 1", tag: "dumb" },
        { id: "t2", x: 300, y: 245, e: "⌨️", l: "Terminal 2", tag: "dumb" },
        { id: "t3", x: 500, y: 245, e: "⌨️", l: "Terminal 3", tag: "dumb" },
      ],
      links: [["m", "t1"], ["m", "t2"], ["m", "t3"]],
      flows: [
        { a: "t1", b: "m", label: "keystrokes", delay: 0 },
        { a: "m", b: "t1", label: "screen", delay: 1.2, reply: true },
        { a: "t2", b: "m", label: "keystrokes", delay: 0.8 },
        { a: "m", b: "t2", label: "screen", delay: 2, reply: true },
        { a: "t3", b: "m", label: "keystrokes", delay: 1.6 },
        { a: "m", b: "t3", label: "screen", delay: 2.8, reply: true },
      ],
      dur: 1.2,
    },
  },
  {
    id: "P2P", name: "Peer-to-Peer", emoji: "🤝", color: C.P2P,
    tagline: "Everyone is both client and server.",
    where: { processing: "On every peer", storage: "Spread across all peers", io: "Every peer" },
    facts: [
      { k: "info", t: "Unlike centralized models, there is no central machine in charge.", easy: "No boss computer. Everyone is equal, which is why they are called peers." },
      { k: "info", t: "Every host acts as both a client and a server at the same time.", easy: "You download a file from a friend while that friend downloads another file from you." },
      { k: "info", t: "Every peer can request services from others and share its own resources.", easy: "Each device offers its files or printer to others and uses theirs in return. Try the lab below." },
    ],
    analogy: "Like friends swapping books: everyone lends and borrows, with no central library.",
    scene: {
      nodes: [
        { id: "a", x: 300, y: 50, e: "💻", l: "Peer A", tag: "think" },
        { id: "b", x: 500, y: 130, e: "💻", l: "Peer B", tag: "think" },
        { id: "c", x: 430, y: 255, e: "💻", l: "Peer C", tag: "think" },
        { id: "d", x: 170, y: 255, e: "💻", l: "Peer D", tag: "think" },
        { id: "e", x: 100, y: 130, e: "💻", l: "Peer E", tag: "think" },
      ],
      links: [["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"], ["e", "a"], ["a", "c"], ["b", "d"], ["c", "e"], ["d", "a"], ["e", "b"]],
      flows: [
        { a: "a", b: "c", label: "file", delay: 0 },
        { a: "c", b: "a", label: "file", delay: 0.4, reply: true },
        { a: "b", b: "d", label: "request", delay: 0.8 },
        { a: "e", b: "b", label: "file", delay: 1.2, reply: true },
        { a: "d", b: "e", label: "request", delay: 1.6 },
      ],
      dur: 1.6,
    },
  },
];

/* ───────────────────────── 1. explorer ───────────────────────── */

export function ArchitectureExplorer() {
  const [sel, setSel] = useState<Arch["id"]>("CS");
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const a = ARCHS.find((x) => x.id === sel)!;

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Network architectures: who does the thinking?</CardTitle>
            <CardDescription className="mt-1">
              Architecture describes how applications and processing are distributed across the network: centralized, terminal-based or fully distributed.
              Pick one, watch the data move, and tap any note for a simple explanation.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {ARCHS.map((x) => (
            <button key={x.id} onClick={() => { setSel(x.id); setOpen(null); }}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={sel === x.id ? { background: x.color, borderColor: x.color, color: "#fff" } : { borderColor: `${x.color}66`, color: x.color }}>
              {x.emoji} {x.name}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-background p-3">
          <SceneView key={sel} scene={a.scene} color={a.color} paused={paused} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)}>{paused ? "Resume animation" : "Pause animation"}</Button>
          <span className="text-[11px] text-muted-foreground">Amber ring = where processing happens. Red = a device with no brain.</span>
        </div>

        <div key={sel} className="na-fade rounded-xl border bg-background p-4" style={{ borderColor: `${a.color}88` }}>
          <p className="text-sm font-semibold" style={{ color: a.color }}>{a.name}</p>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">{a.tagline}</p>
          <div className="flex flex-col gap-2">
            {a.facts.map((f, i) => {
              const on = open === i;
              return (
                <button key={i} onClick={() => setOpen(on ? null : i)}
                  className="rounded-lg border px-3 py-2 text-left text-xs leading-5 transition-colors hover:bg-muted/40"
                  style={on ? { borderColor: a.color, background: `${a.color}10` } : undefined}>
                  <span className="mr-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: KIND[f.k].dot }}>
                    {KIND[f.k].label}
                  </span>
                  <span className="font-medium">{f.t}</span>
                  {on && <span className="na-fade mt-1 block text-muted-foreground">💬 {f.easy}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-3 rounded-lg px-3 py-2 text-xs leading-5" style={{ background: `${a.color}18`, color: a.color }}>
            💡 {a.analogy}
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[520px] text-xs">
            <thead className="bg-muted/50">
              <tr>
                {["", "Processing", "Data storage", "Input / output"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ARCHS.map((x) => (
                <tr key={x.id} className="border-t" style={x.id === sel ? { color: x.color, fontWeight: 600, background: `${x.color}10` } : undefined}>
                  <td className="px-3 py-2 font-semibold">{x.emoji} {x.name}</td>
                  <td className="px-3 py-2">{x.where.processing}</td>
                  <td className="px-3 py-2">{x.where.storage}</td>
                  <td className="px-3 py-2">{x.where.io}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 2. client/server lab ───────────────────────── */

export function ClientServerLab() {
  const [up, setUp] = useState(true);
  const [backup, setBackup] = useState(false);
  const [n, setN] = useState(0); // restarts packets on every change

  const active: "p" | "b" | null = up ? "p" : backup ? "b" : null;
  const pPos: P = { x: backup ? 170 : 300, y: 75 };
  const bPos: P = { x: 430, y: 75 };
  const target = active === "b" ? bPos : pPos;
  const clients: (P & { e: string; l: string })[] = [
    { x: 90, y: 245, e: "💻", l: "Client 1" },
    { x: 300, y: 245, e: "📱", l: "Client 2" },
    { x: 510, y: 245, e: "💻", l: "Client 3" },
  ];
  const ok = active !== null;
  const color = ok ? C.CS : C.RED;

  const status = !up && !backup
    ? "Server is down and there is no backup: every client is stuck and the data is inaccessible."
    : !up && backup
      ? "Primary server is down, but the backup server in another location answers. Clients keep working."
      : backup
        ? "Everything works, and a backup server in another location holds a copy of the data."
        : "Everything works, but this one server is a single point of failure.";

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Client/server lab: crash the server</CardTitle>
            <CardDescription className="mt-1">
              Centralized means easy to manage, but if the server fails the data is inaccessible. Break it, then fix it with a backup.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="overflow-x-auto rounded-xl border bg-background p-3">
          <svg viewBox="0 0 600 320" className="mx-auto min-w-[560px] max-w-[760px]" role="img" aria-label="Clients talking to a primary server and an optional backup server">
            {backup && (
              <g className="na-fade">
                <rect x={350} y={20} width={160} height={120} rx={16} fill={C.GREEN} fillOpacity={0.07} stroke={C.GREEN} strokeWidth={2} strokeDasharray="6 5" />
                <text x={360} y={38} fontSize={11} fontWeight={700} fill={C.GREEN}>Location B</text>
              </g>
            )}
            {clients.map((c, i) => {
              const [x0, y0, x1, y1] = edge(c, target);
              return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="7 6" className="na-dash" />;
            })}
            {backup && <line x1={edge(pPos, bPos)[0]} y1={edge(pPos, bPos)[1]} x2={edge(pPos, bPos)[2]} y2={edge(pPos, bPos)[3]} stroke={C.GREEN} strokeWidth={2.5} strokeDasharray="4 5" className="na-dash" />}
            {backup && (
              <text x={(pPos.x + bPos.x) / 2} y={pPos.y - 8} textAnchor="middle" fontSize={10} fontWeight={600} fill={C.GREEN}>data copy</text>
            )}

            {[{ p: pPos, e: up ? "🖥️" : "💥", l: "Primary server", c: up ? C.CS : C.RED, think: up }, ...(backup ? [{ p: bPos, e: "🖥️", l: "Backup server", c: C.GREEN, think: active === "b" }] : [])].map((s) => (
              <g key={s.l}>
                {s.think && <circle cx={s.p.x} cy={s.p.y} r={28} fill="none" stroke={C.AMBER} strokeWidth={3} className="na-ring" style={{ transformOrigin: `${s.p.x}px ${s.p.y}px` }} />}
                <circle cx={s.p.x} cy={s.p.y} r={28} className="fill-background" stroke={s.c} strokeWidth={2.5} />
                <text x={s.p.x} y={s.p.y + 9} textAnchor="middle" fontSize={26}>{s.e}</text>
                <text x={s.p.x} y={s.p.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{s.l}</text>
              </g>
            ))}

            {clients.map((c, i) => (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r={28} className="fill-background" stroke={ok ? C.GREEN : C.RED} strokeWidth={2.5} style={{ transition: "stroke .4s" }} />
                <text x={c.x} y={c.y + 9} textAnchor="middle" fontSize={26}>{c.e}</text>
                <text x={c.x} y={c.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{c.l}</text>
                <text x={c.x} y={c.y + 62} textAnchor="middle" fontSize={10} fontWeight={700} fill={ok ? C.GREEN : C.RED}>{ok ? "✓ got data" : "✕ no data"}</text>
              </g>
            ))}

            {clients.map((c, i) => (
              <Chip key={`${n}-${i}`} a={c} b={target} label={ok ? "request" : "no reply"} color={color} dur={1.6 * SLOW} delay={i * 0.6 * SLOW} />
            ))}
          </svg>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" style={{ background: up ? C.RED : C.GREEN, color: "#fff" }} onClick={() => { setUp((v) => !v); setN((v) => v + 1); }}>
            {up ? "Crash the primary server" : "Repair the primary server"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setBackup((v) => !v); setN((v) => v + 1); }}>
            {backup ? "Remove backup server" : "Add backup server in another location"}
          </Button>
        </div>

        <p key={`${up}-${backup}`} className="na-fade rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: ok ? C.GREEN : C.RED, color: ok ? C.GREEN : C.RED }}>
          {status}
        </p>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 3. P2P lab ───────────────────────── */

const PEERS: (P & { l: string; file: string })[] = [
  { x: 300, y: 55, l: "Peer A", file: "song.mp3" },
  { x: 500, y: 130, l: "Peer B", file: "photo.jpg" },
  { x: 430, y: 250, l: "Peer C", file: "notes.pdf" },
  { x: 170, y: 250, l: "Peer D", file: "movie.mp4" },
  { x: 100, y: 130, l: "Peer E", file: "game.zip" },
];

export function P2PLab() {
  const [mode, setMode] = useState<{ t: "one"; from: number } | { t: "all" } | null>(null);
  const [n, setN] = useState(0);

  const roleOf = (i: number): string => {
    if (!mode) return "idle";
    if (mode.t === "all") return "client + server";
    if (i === mode.from) return "client";
    if (i === (mode.from + 2) % 5) return "server";
    return "idle";
  };
  const roleColor = (r: string) => (r === "client" ? C.CS : r === "server" ? C.AMBER : r === "client + server" ? C.GREEN : "#868e96");

  const flows: { a: number; b: number; label: string }[] =
    mode?.t === "one"
      ? [
          { a: mode.from, b: (mode.from + 2) % 5, label: "asks for file" },
          { a: (mode.from + 2) % 5, b: mode.from, label: PEERS[(mode.from + 2) % 5].file },
        ]
      : mode?.t === "all"
        ? PEERS.map((p, i) => ({ a: i, b: (i + 1) % 5, label: p.file }))
        : [];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Peer-to-peer lab: one device, two roles</CardTitle>
            <CardDescription className="mt-1">
              Tap a peer to make it request a file. Watch its role change while the others serve it, then try "Everyone shares".
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="overflow-x-auto rounded-xl border bg-background p-3">
          <svg viewBox="0 0 600 320" className="mx-auto min-w-[560px] max-w-[760px]" role="img" aria-label="Five peers connected in a mesh">
            {PEERS.flatMap((a, i) => PEERS.slice(i + 1).map((b, j) => {
              const [x0, y0, x1, y1] = edge(a, b);
              return <line key={`${i}-${j}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={C.P2P} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="7 6" className="na-dash" />;
            }))}
            {PEERS.map((p, i) => {
              const r = roleOf(i);
              return (
                <g key={i} className="cursor-pointer" onClick={() => { setMode({ t: "one", from: i }); setN((v) => v + 1); }}>
                  <circle cx={p.x} cy={p.y} r={28} className="fill-background" stroke={roleColor(r)} strokeWidth={r === "idle" ? 2.5 : 4} style={{ transition: "stroke .4s" }} />
                  <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26}>💻</text>
                  <text x={p.x} y={p.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{p.l}</text>
                  <text x={p.x} y={p.y + 60} textAnchor="middle" fontSize={10} fontFamily={mono} fill="#868e96">{p.file}</text>
                  {r !== "idle" && (
                    <text key={`${n}-${r}`} x={p.x} y={p.y - 36} textAnchor="middle" fontSize={11} fontWeight={700} fill={roleColor(r)} className="na-fade">
                      {r === "client" ? "📥 client" : r === "server" ? "📤 server" : "📥📤 client + server"}
                    </text>
                  )}
                </g>
              );
            })}
            {flows.map((f, i) => (
              <Chip key={`${n}-${i}`} a={PEERS[f.a]} b={PEERS[f.b]} label={f.label} color={i % 2 === 0 && mode?.t === "one" ? C.CS : C.GREEN}
                dur={1.6 * SLOW} delay={(mode?.t === "all" ? i * 0.25 : i * 1.2) * SLOW} />
            ))}
          </svg>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { setMode({ t: "all" }); setN((v) => v + 1); }}>Everyone shares</Button>
          <Button size="sm" variant="ghost" disabled={!mode} onClick={() => { setMode(null); setN((v) => v + 1); }}>Reset</Button>
        </div>

        <p key={n} className="na-fade rounded-xl border bg-background p-4 text-xs leading-5 text-muted-foreground">
          {!mode && "No peer is in charge. Tap a peer to make it request a file."}
          {mode?.t === "one" && `${PEERS[mode.from].l} is acting as a client and ${PEERS[(mode.from + 2) % 5].l} is acting as a server. In the next request the roles can swap, because every peer can do both.`}
          {mode?.t === "all" && "Every peer is sending its own file and receiving another at the same moment, so each one is a client and a server together."}
        </p>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────── 4. quiz ───────────────────────── */

const CH: { id: Arch["id"]; label: string }[] = [
  { id: "CS", label: "Client/Server" },
  { id: "MT", label: "Mainframe / Terminal" },
  { id: "P2P", label: "Peer-to-Peer" },
];
const QS: { q: string; a: Arch["id"]; why: string }[] = [
  { q: "Phones and laptops request web pages and files from one central machine.", a: "CS", why: "Clients request information and services from a central server." },
  { q: "A keyboard and screen with no processing power. Everything runs on a big central computer.", a: "MT", why: "Terminals are dumb devices used only for input and output." },
  { q: "Every computer shares its own files and also downloads from others.", a: "P2P", why: "Each host acts as both a client and a server." },
  { q: "If the central machine fails, nobody can reach the data. A backup in another location fixes it.", a: "CS", why: "Centralization is the weakness, and a backup server spread across locations is the solution." },
  { q: "All computing, processing and data storage happen in one central powerhouse.", a: "MT", why: "That is the mainframe's job." },
  { q: "Easy to manage and secure because the data lives in one place.", a: "CS", why: "Centralized security and data management are the main advantages." },
  { q: "No central machine. Every host can request services and share resources.", a: "P2P", why: "Fully distributed, with every peer equal." },
];

export function ArchQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Arch["id"] | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QS.length;
  const q = QS[Math.min(i, QS.length - 1)];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Which architecture is this?</CardTitle>
            <CardDescription className="mt-1">Read the situation and choose the architecture.</CardDescription>
          </div>
          <Badge variant="secondary">Practice</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {done ? (
          <div className="na-fade rounded-xl border bg-background p-4 text-sm">
            <p className="font-semibold">You scored {score} out of {QS.length}.</p>
            <p className="mt-1 text-xs text-muted-foreground">{score === QS.length ? "Perfect score." : "Revisit the explorer above for the ones you missed."}</p>
          </div>
        ) : (
          <div key={i} className="na-fade rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">Question {i + 1} of {QS.length}</p>
            <p className="mt-1 text-sm font-medium">{q.q}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CH.map((c) => {
                const right = pick && c.id === q.a;
                const wrong = pick === c.id && c.id !== q.a;
                return (
                  <Button key={c.id} size="sm" variant="outline" disabled={!!pick}
                    onClick={() => { setPick(c.id); if (c.id === q.a) setScore((s) => s + 1); }}
                    style={right ? { background: C.GREEN, color: "#fff", opacity: 1 } : wrong ? { background: C.RED, color: "#fff", opacity: 1 } : undefined}>
                    {c.label}
                  </Button>
                );
              })}
            </div>
            {pick && (
              <p className="na-fade mt-3 text-xs leading-5" style={{ color: pick === q.a ? C.GREEN : C.RED }}>
                {pick === q.a ? "Correct. " : `Not quite, it is ${CH.find((c) => c.id === q.a)?.label}. `}
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

export function NetworkArchitectures() {
  return (
    <div>
      <style>{`
        @keyframes na-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes na-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes na-dash { to { stroke-dashoffset: -26; } }
        @keyframes na-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
        .na-pkt  { animation: na-move 2s linear infinite both; }
        .na-fade { animation: na-fade ${0.5 * SLOW}s ease-out both; }
        .na-dash { animation: na-dash ${1.2 * SLOW}s linear infinite; }
        .na-ring { animation: na-ring ${1.6 * SLOW}s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .na-pkt, .na-fade, .na-dash, .na-ring { animation: none; opacity: 1; } .na-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>
      <p className="text-sm text-muted-foreground">
        Architecture describes how applications and processing responsibilities are distributed across the network: centralized, terminal-based, or fully distributed.
      </p>
      <ArchitectureExplorer />
      <ClientServerLab />
      <P2PLab />
      <ArchQuiz />
    </div>
  );
}

export default NetworkArchitectures;