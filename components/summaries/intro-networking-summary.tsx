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
 * IntroToNetworking  (CCNA Topic 01)
 * Seven small sections, each one interactive:
 *   1 What is a network   : switch off devices / medium / purpose and see it break
 *   2 Packet story        : step through a page load, with layer badges
 *   3 Network types       : PAN, LAN, CAN, MAN, WAN, SAN on a distance ladder
 *   4 Roles & architecture: client / server / peer, then "what if the centre fails?"
 *   5 Protocols & models  : common protocols and OSI vs TCP/IP side by side
 *   6 Common mistakes     : wrong belief on the front, the truth on the back
 *   7 Interview prep      : 30-second answer and the ten usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const mono = "ui-monospace, monospace";

const TABS = [
  { id: "what", label: "1 · What is a network" },
  { id: "story", label: "2 · Packet story" },
  { id: "types", label: "3 · Network types" },
  { id: "roles", label: "4 · Roles & architectures" },
  { id: "models", label: "5 · Protocols & models" },
  { id: "myths", label: "6 · Common mistakes" },
  { id: "interview", label: "7 · Interview prep" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ───────────────────────── small helpers ───────────────────────── */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-background p-4 ${className}`}>{children}</div>;
}

function Tip({ title = "Remember", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-primary">{title}: </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function Pick({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── 1 · what is a network ───────────────────────── */

const PARTS = [
  {
    id: "devices",
    label: "Devices",
    icon: "💻",
    hint: "Computers, phones, printers, servers, CCTV cameras, authentication devices",
    broken: "Cable and a purpose, but nothing to plug in. There is nobody to talk.",
  },
  {
    id: "medium",
    label: "Medium",
    icon: "🔌",
    hint: "Wired (copper, fiber) or wireless (radio)",
    broken: "Two laptops with no link between them. Each one works, but they cannot send anything to each other.",
  },
  {
    id: "purpose",
    label: "Purpose",
    icon: "🎯",
    hint: "Exchanging information",
    broken: "Devices cabled together but exchanging nothing is just connected hardware.",
  },
] as const;

const SERVICES = [
  "Files & documents",
  "Email & IM",
  "Websites",
  "Databases",
  "Streaming audio/video",
  "Audio/video calls",
];

function WhatSection() {
  const [on, setOn] = useState<Record<string, boolean>>({ devices: true, medium: true, purpose: true });
  const missing = PARTS.filter((p) => !on[p.id]);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">A network is a group of devices, joined by a medium, so they can exchange information.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tap a piece to switch it off and see what happens.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {PARTS.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOn((s) => ({ ...s, [p.id]: !s[p.id] }))}
                className={`flex flex-col items-center rounded-xl border px-5 py-3 text-xs font-semibold transition-all ${
                  on[p.id] ? "border-primary/50 bg-primary/5" : "border-dashed opacity-40 line-through"
                }`}
                aria-pressed={on[p.id]}
              >
                <span className="text-2xl">{p.icon}</span>
                {p.label}
              </button>
              {i < PARTS.length - 1 && <span className="text-lg text-muted-foreground">+</span>}
            </div>
          ))}
          <span className="text-lg text-muted-foreground">=</span>
          <Badge
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            style={{ color: missing.length === 0 ? GREEN : RED }}
          >
            {missing.length === 0 ? "✓ A network" : "✕ Not a network"}
          </Badge>
        </div>

        <div className="mt-3 min-h-[40px] text-xs leading-5 text-muted-foreground">
          {missing.length === 0 ? (
            <ul className="flex flex-col gap-1">
              {PARTS.map((p) => (
                <li key={p.id}>
                  <span className="font-semibold text-foreground">{p.label}:</span> {p.hint}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-1">
              {missing.map((p) => (
                <li key={p.id} style={{ color: RED }}>
                  <span className="font-semibold">No {p.label.toLowerCase()}.</span> {p.broken}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">What do networks carry?</p>
        <p className="mt-1 text-xs text-muted-foreground">Everything a network does is one of these services.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            t: "Protocol",
            d: "A set of rules two devices agree on so they can talk. Same protocol on both ends means communication works.",
            a: "Analogy: a shared language.",
          },
          {
            t: "Reference model",
            d: "A blueprint for how devices should behave, so different vendors' equipment works together. OSI and TCP/IP are the two to know.",
            a: "Analogy: a building code.",
          },
          {
            t: "Host",
            d: "An end device that sends or receives data: a PC, phone, server, printer. Routers and switches are intermediate devices that move traffic between hosts.",
            a: "Hosts are the start and end of a conversation.",
          },
        ].map((c) => (
          <Panel key={c.t}>
            <p className="text-sm font-semibold">{c.t}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{c.d}</p>
            <p className="mt-2 text-xs font-medium text-primary">{c.a}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── 2 · packet story ───────────────────────── */

type StoryStep = {
  title: string;
  text: string;
  layer: string;
  active: string[];
  chip?: { x0: number; y0: number; x1: number; y1: number; label: string; reply?: boolean; long?: boolean };
  panel?: "pieces" | "header" | "rebuild";
};

const N: Record<string, { x: number; y: number; label: string; kind: "box" | "circle" }> = {
  you: { x: 70, y: 135, label: "You", kind: "box" },
  dns: { x: 180, y: 42, label: "DNS", kind: "box" },
  r1: { x: 240, y: 135, label: "R", kind: "circle" },
  r2: { x: 400, y: 135, label: "R", kind: "circle" },
  srv: { x: 570, y: 135, label: "Server", kind: "box" },
};
const STORY_LINKS: [string, string, boolean?][] = [
  ["you", "r1"],
  ["r1", "r2"],
  ["r2", "srv"],
  ["you", "dns", true],
];

const STORY: StoryStep[] = [
  {
    title: "You type a URL",
    layer: "Layer 7 · Application",
    text: "You type www.example.com. Your browser (the client) is about to ask a server for a page. A physical link must already exist (Layer 1), otherwise nothing can be sent at all.",
    active: ["you"],
  },
  {
    title: "A name becomes a number",
    layer: "Layer 7 · Application",
    text: "Computers route by IP address, not by name. DNS turns www.example.com into an IP address, for example 203.0.113.10.",
    active: ["you", "dns"],
    chip: { x0: 180, y0: 62, x1: 100, y1: 112, label: "203.0.113.10", reply: true },
  },
  {
    title: "Data is chopped into pieces",
    layer: "Layer 4 · Transport",
    text: "Your request is split into small pieces. If one piece is lost, only that piece is sent again, not the whole message.",
    active: ["you"],
    panel: "pieces",
  },
  {
    title: "Each piece is addressed",
    layer: "Layer 3 + 4 · Network and Transport",
    text: "Each piece gets a source IP and a destination IP (Layer 3, so routers know where it is going) and a port number (Layer 4, so the server knows which application should receive it). Port 443 means HTTPS.",
    active: ["you"],
    panel: "header",
  },
  {
    title: "Routers pass them along",
    layer: "Layer 3 · Network",
    text: "Each router reads the destination IP and picks the next hop toward the destination network. Hop by hop, the packets reach the server.",
    active: ["r1", "r2"],
    chip: { x0: 110, y0: 135, x1: 525, y1: 135, label: "Packets", long: true },
  },
  {
    title: "The server replies, your browser rebuilds",
    layer: "Layer 4 up to Layer 7",
    text: "The server sends its answer back the same way. Your computer puts the pieces back in order and hands the complete page to the browser.",
    active: ["srv", "you"],
    chip: { x0: 525, y0: 135, x1: 110, y1: 135, label: "Reply", reply: true, long: true },
    panel: "rebuild",
  },
];

function StorySection() {
  const [i, setI] = useState(0);
  const s = STORY[i];

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-wrap gap-2">
        {STORY.map((st, k) => (
          <Pick key={k} active={k === i} onClick={() => setI(k)}>
            {k + 1}
          </Pick>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 640 200" className="mx-auto min-w-[560px] max-w-[760px]" role="img" aria-label="You, DNS, two routers and a server">
          {STORY_LINKS.map(([a, b, dashed]) => (
            <line
              key={a + b}
              x1={N[a].x}
              y1={N[a].y}
              x2={N[b].x}
              y2={N[b].y}
              stroke="currentColor"
              strokeOpacity={0.45}
              strokeWidth={2}
              strokeDasharray={dashed ? "5 5" : undefined}
            />
          ))}
          {Object.entries(N).map(([id, n]) => {
            const on = s.active.includes(id);
            const stroke = on ? AMBER : "currentColor";
            return n.kind === "circle" ? (
              <g key={id}>
                <circle cx={n.x} cy={n.y} r={26} className="fill-background" stroke={stroke} strokeWidth={on ? 3.5 : 2} style={{ transition: "stroke .4s" }} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={14} fontWeight={600} className="fill-foreground">{n.label}</text>
              </g>
            ) : (
              <g key={id}>
                <rect x={n.x - 40} y={n.y - 20} width={80} height={40} rx={4} className="fill-background" stroke={stroke} strokeWidth={on ? 3.5 : 2} style={{ transition: "stroke .4s" }} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={14} fontWeight={600} className="fill-foreground">{n.label}</text>
              </g>
            );
          })}
          <text x={N.you.x} y={N.you.y + 38} textAnchor="middle" fontSize={11} fontFamily={mono} className="fill-foreground">client</text>
          <text x={N.srv.x} y={N.srv.y + 38} textAnchor="middle" fontSize={11} fontFamily={mono} className="fill-foreground">example.com</text>
          <text x={320} y={185} textAnchor="middle" fontSize={11} fontFamily={mono} className="fill-foreground">R = router</text>

          {s.chip && (
            <g
              key={i}
              className={s.chip.long ? "n1-chip-long" : "n1-chip"}
              style={
                {
                  "--x0": `${s.chip.x0}px`,
                  "--y0": `${s.chip.y0}px`,
                  "--x1": `${s.chip.x1}px`,
                  "--y1": `${s.chip.y1}px`,
                } as CSSProperties
              }
            >
              <rect x={-s.chip.label.length * 3.2 - 9} y={-11} width={s.chip.label.length * 6.4 + 18} height={22} rx={6} fill={s.chip.reply ? BLUE : RED} stroke="#fff" strokeWidth={1.5} />
              <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>{s.chip.label}</text>
            </g>
          )}
        </svg>
      </div>

      <Panel>
        <div key={i} className="n1-fade flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">Step {i + 1} of {STORY.length}</p>
            <Badge variant="secondary">{s.layer}</Badge>
          </div>
          <p className="text-sm font-semibold">{s.title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{s.text}</p>

          {s.panel === "pieces" && (
            <div className="flex flex-wrap gap-2">
              {["piece 1", "piece 2", "piece 3", "piece 4"].map((p) => (
                <span key={p} className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-[11px]">{p}</span>
              ))}
            </div>
          )}
          {s.panel === "header" && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[420px] text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {["Source IP", "Destination IP", "Destination port", "Data"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t font-mono">
                    <td className="px-3 py-2">192.0.2.10 (you)</td>
                    <td className="px-3 py-2">203.0.113.10 (server)</td>
                    <td className="px-3 py-2">443 (HTTPS)</td>
                    <td className="px-3 py-2">piece 1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {s.panel === "rebuild" && (
            <div className="flex flex-wrap items-center gap-2">
              {["1", "2", "3", "4"].map((p) => (
                <span key={p} className="rounded-md border px-3 py-2 font-mono text-[11px]" style={{ borderColor: BLUE, color: BLUE }}>{p}</span>
              ))}
              <span className="text-muted-foreground">→</span>
              <Badge style={{ color: GREEN }} variant="secondary">complete web page</Badge>
            </div>
          )}
        </div>
      </Panel>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>Back</Button>
        <Button size="sm" disabled={i === STORY.length - 1} onClick={() => setI((v) => Math.min(STORY.length - 1, v + 1))}>Next step</Button>
      </div>

      <Tip title="Exam detail">
        Beginners say "packet" for every piece of data. Strictly, the unit at Layer 4 is a segment, at Layer 3 a packet,
        and at Layer 2 a frame. You will meet these names again in the OSI section.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 3 · network types ───────────────────────── */

const TYPES = [
  { id: "PAN", name: "Personal Area Network", scope: "Around one person (about 10 m)", owner: "Private: you", example: "Phone to earbuds, smartwatch", rule: "Fits on or around your body", bar: 8 },
  { id: "LAN", name: "Local Area Network", scope: "One building or small site", owner: "Private: you or your organization", example: "Home Wi-Fi, one office floor", rule: "You can walk across it in minutes", bar: 22 },
  { id: "CAN", name: "Campus Area Network", scope: "Several buildings, one site", owner: "Private: one organization", example: "University or corporate campus", rule: "Multiple LANs, one owner, one site", bar: 40 },
  { id: "MAN", name: "Metropolitan Area Network", scope: "A whole city", owner: "Usually an ISP or carrier", example: "City-wide fiber broadband (ACT Fibernet, Hathway)", rule: "Spans a city, needs a carrier", bar: 62 },
  { id: "WAN", name: "Wide Area Network", scope: "Countries and continents", owner: "Carriers / ISPs", example: "The Internet, mobile and telecom carriers (Jio, Airtel, Vi)", rule: "Crosses long distances using carriers", bar: 100 },
  { id: "SAN", name: "Storage Area Network", scope: "Inside a data centre", owner: "Private, dedicated", example: "Data-centre storage fabric", rule: "Not about distance, about storage", bar: 0 },
] as const;

function TypesSection() {
  const [sel, setSel] = useState<(typeof TYPES)[number]["id"]>("LAN");
  const t = TYPES.find((x) => x.id === sel)!;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Pick a type to see it</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TYPES.slice(0, 5).map((x, i) => (
            <div key={x.id} className="flex items-center gap-2">
              <Pick active={sel === x.id} onClick={() => setSel(x.id)}>{x.id}</Pick>
              {i < 4 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
          <span className="mx-1 text-muted-foreground">|</span>
          <Pick active={sel === "SAN"} onClick={() => setSel("SAN")}>SAN</Pick>
        </div>

        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            {t.bar > 0 ? (
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${t.bar}%` }} />
            ) : (
              <div className="h-full w-full opacity-60" style={{ background: `repeating-linear-gradient(45deg, ${AMBER}55, ${AMBER}55 8px, transparent 8px, transparent 16px)` }} />
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t.bar > 0 ? "Distance grows from left to right." : "SAN does not fit on the distance ladder. It is classified by purpose."}
          </p>
        </div>

        <div key={sel} className="n1-fade mt-4 grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-base font-semibold">{t.id} <span className="text-sm font-normal text-muted-foreground">{t.name}</span></p>
          </div>
          {[
            ["Scope", t.scope],
            ["Who owns it", t.owner],
            ["Example", t.example],
            ["Rule of thumb", t.rule],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="text-xs font-medium">{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Tip title="Memory hook">
        <span className="font-semibold">P</span>ersonal → <span className="font-semibold">L</span>ocal → <span className="font-semibold">C</span>ampus → <span className="font-semibold">M</span>etro → <span className="font-semibold">W</span>ide. Distance grows each step.
      </Tip>

      <Panel>
        <p className="text-sm font-semibold">VPN is not a network type</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          A VPN is a virtual, encrypted tunnel that rides on top of a network you already have, usually the internet. It
          lets private traffic travel safely over a public network.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">Site-to-site: branch office to HQ</Badge>
          <Badge variant="secondary">Remote-access: one user to the office</Badge>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 4 · roles and architectures ───────────────────────── */

const ROLES = [
  { id: "client", label: "Client", asks: true, gives: false, d: "Requests information or services. Sends the request." },
  { id: "server", label: "Server", asks: false, gives: true, d: "Provides information or services. Sends the response." },
  { id: "peer", label: "Peer", asks: true, gives: true, d: "Does both: requests and provides." },
] as const;
const ACTIVITIES: { label: string; role: (typeof ROLES)[number]["id"] }[] = [
  { label: "Browsing a website", role: "client" },
  { label: "Sharing a file from your laptop", role: "server" },
  { label: "Downloading with a torrent", role: "peer" },
];

type ArchId = "cs" | "mf" | "p2p";
const ARCHS: Record<
  ArchId,
  { name: string; one: string; wins: string[]; loses: string[]; where: string; centre: string; fail: string; failNote: string; okNote: string }
> = {
  cs: {
    name: "Client / Server",
    one: "Centralized: one (or a few) servers hold the data and answer every client.",
    wins: ["Easy to access and manage", "Central security, backups and updates", "Cost-effective once you grow past a handful of users"],
    loses: ["The server is a single point of failure", "Server down means the data is unreachable for everyone", "Fix: redundant or backup servers in other locations"],
    where: "Websites, email, almost every enterprise app",
    centre: "Server",
    fail: "Server goes down",
    failNote: "Every client loses access to the data. The clients themselves are fine, but they have nothing to talk to.",
    okNote: "All clients can reach the server.",
  },
  mf: {
    name: "Mainframe / Terminal",
    one: "All thinking happens on the mainframe. A terminal is just a keyboard and screen.",
    wins: ["Central compute and data, nothing is stored on the endpoint", "Terminals are cheap and easy to replace", "Very tight control over the workload"],
    loses: ["A terminal has no processing power of its own", "If the mainframe stops, every terminal stops"],
    where: "Banks, airlines, legacy enterprise",
    centre: "Mainframe",
    fail: "Mainframe goes down",
    failNote: "Every terminal goes blank. Without local processing there is nothing left to do.",
    okNote: "All terminals work through the mainframe.",
  },
  p2p: {
    name: "Peer-to-Peer",
    one: "No dedicated server. Every host is a client and a server at the same time.",
    wins: ["No central server to buy or maintain", "Cheap to set up for a small group", "Grows with the number of peers"],
    loses: ["No central control, security or audit trail", "Hard to back up reliably", "One slow peer can slow everyone down"],
    where: "Small home networks, file sharing, torrents",
    centre: "Peer",
    fail: "One peer goes down",
    failNote: "Only that peer is lost. The other three keep talking to each other.",
    okNote: "Every peer can reach every other peer.",
  },
};

function ArchDiagram({ kind, failed }: { kind: ArchId; failed: boolean }) {
  const outer = [
    { x: 55, y: 45 },
    { x: 55, y: 155 },
    { x: 345, y: 45 },
    { x: 345, y: 155 },
  ];
  const c = { x: 200, y: 100 };
  const box = (x: number, y: number, w: number, label: string, dead: boolean, key: string, big = false) => (
    <g key={key}>
      <rect
        x={x - w / 2}
        y={y - (big ? 22 : 17)}
        width={w}
        height={big ? 44 : 34}
        rx={4}
        className="fill-background"
        stroke={dead ? RED : "currentColor"}
        strokeWidth={dead ? 3.5 : 2}
        style={{ transition: "stroke .4s" }}
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={12} fontWeight={600} fill={dead ? RED : undefined} className={dead ? undefined : "fill-foreground"}>
        {label}
      </text>
    </g>
  );

  if (kind === "p2p") {
    const pairs: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    return (
      <svg viewBox="0 0 400 200" className="mx-auto w-full max-w-[460px]" role="img" aria-label="Four peers all connected to each other">
        {pairs.map(([a, b]) => {
          const dead = failed && (a === 0 || b === 0);
          return (
            <line key={`${a}${b}`} x1={outer[a].x} y1={outer[a].y} x2={outer[b].x} y2={outer[b].y}
              stroke={dead ? RED : "currentColor"} strokeOpacity={dead ? 0.8 : 0.45} strokeWidth={2} strokeDasharray={dead ? "5 5" : undefined} />
          );
        })}
        {outer.map((p, i) => box(p.x, p.y, 70, "Peer", failed && i === 0, `p${i}`))}
      </svg>
    );
  }

  const centreLabel = kind === "cs" ? "Server" : "Mainframe";
  const leaf = kind === "cs" ? "Client" : "Terminal";
  return (
    <svg viewBox="0 0 400 200" className="mx-auto w-full max-w-[460px]" role="img" aria-label={`${centreLabel} connected to four ${leaf.toLowerCase()}s`}>
      {outer.map((p, i) => (
        <line key={i} x1={c.x} y1={c.y} x2={p.x} y2={p.y} stroke={failed ? RED : "currentColor"} strokeOpacity={failed ? 0.8 : 0.45} strokeWidth={2} strokeDasharray={failed ? "5 5" : undefined} />
      ))}
      {outer.map((p, i) => box(p.x, p.y, 80, leaf, false, `l${i}`))}
      {box(c.x, c.y, 100, centreLabel, failed, "c", true)}
      {failed && outer.map((p, i) => (
        <text key={`x${i}`} x={p.x} y={p.y + 32} textAnchor="middle" fontSize={10} fontWeight={700} fill={RED}>
          {kind === "cs" ? "no access" : "blank"}
        </text>
      ))}
    </svg>
  );
}

function RolesSection() {
  const [act, setAct] = useState(0);
  const [arch, setArch] = useState<ArchId>("cs");
  const [failed, setFailed] = useState(false);
  const a = ARCHS[arch];
  const activeRole = ACTIVITIES[act].role;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Client, server and peer are roles, not device types</p>
        <p className="mt-1 text-xs text-muted-foreground">One laptop, three different roles. Pick what it is doing right now.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIVITIES.map((x, i) => (
            <Pick key={x.label} active={act === i} onClick={() => setAct(i)}>{x.label}</Pick>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => {
            const on = r.id === activeRole;
            return (
              <div key={r.id} className={`rounded-lg border p-3 transition-all ${on ? "border-primary bg-primary/5" : "opacity-50"}`}>
                <p className="text-sm font-semibold">{r.label} {on && <span style={{ color: GREEN }}>✓</span>}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{r.d}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">asks: {r.asks ? "yes" : "no"}</Badge>
                  <Badge variant="secondary">gives: {r.gives ? "yes" : "no"}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Architectures: where do the data and the thinking live?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(ARCHS) as ArchId[]).map((k) => (
            <Pick key={k} active={arch === k} onClick={() => { setArch(k); setFailed(false); }}>{ARCHS[k].name}</Pick>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{a.one}</p>

        <div className="mt-3 rounded-xl border bg-background p-2">
          <ArchDiagram kind={arch} failed={failed} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" variant={failed ? "outline" : "default"} onClick={() => setFailed((f) => !f)}>
            {failed ? "Bring it back" : `What if: ${a.fail}?`}
          </Button>
          <p className="text-xs font-medium" style={{ color: failed ? RED : GREEN }}>
            {failed ? a.failNote : a.okNote}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold" style={{ color: GREEN }}>Wins</p>
            <ul className="mt-1 list-disc pl-4 text-xs leading-5 text-muted-foreground">
              {a.wins.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold" style={{ color: RED }}>Loses</p>
            <ul className="mt-1 list-disc pl-4 text-xs leading-5 text-muted-foreground">
              {a.loses.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Used in:</span> {a.where}</p>
      </Panel>

      <Tip>Centralized means easy to manage but one point of failure. Peer-to-peer means no single point of failure but no central control.</Tip>
    </div>
  );
}

/* ───────────────────────── 5 · protocols and models ───────────────────────── */

const PROTOCOLS = [
  { name: "HTTP", job: "Web pages", port: "80", secure: false, note: "Plain text. Anyone on the path can read it." },
  { name: "HTTPS", job: "Web pages, encrypted", port: "443", secure: true, note: "HTTP protected by encryption." },
  { name: "FTP", job: "File transfer", port: "20/21", secure: false, note: "Needs a login, but sends everything in plain text." },
  { name: "SFTP", job: "File transfer, encrypted", port: "22", secure: true, note: "Secure file transfer that runs over SSH." },
  { name: "TFTP", job: "Very simple file transfer", port: "69", secure: false, note: "No login, no encryption, uses UDP. Common for backing up Cisco configs." },
  { name: "SMTP", job: "Sending email", port: "25", secure: false, note: "Moves mail from your mail client to a server and between servers." },
];

const OSI = [
  { n: 7, name: "Application", unit: "Data", ex: "HTTP, SMTP, DNS: what the user's app talks to" },
  { n: 6, name: "Presentation", unit: "Data", ex: "Formatting, compression, encryption" },
  { n: 5, name: "Session", unit: "Data", ex: "Starting, keeping and ending conversations" },
  { n: 4, name: "Transport", unit: "Segment", ex: "TCP and UDP, port numbers" },
  { n: 3, name: "Network", unit: "Packet", ex: "IP addresses, routers" },
  { n: 2, name: "Data Link", unit: "Frame", ex: "MAC addresses, switches" },
  { n: 1, name: "Physical", unit: "Bits", ex: "Cables, radio, electrical signals" },
];
const TCPIP = [
  { name: "Application", rows: [7, 6, 5] },
  { name: "Transport", rows: [4] },
  { name: "Internet", rows: [3] },
  { name: "Network Access", rows: [2, 1] },
];

function ModelsSection() {
  const [sel, setSel] = useState<string | null>("Internet");
  const hi = TCPIP.find((t) => t.name === sel)?.rows ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Common protocols</p>
        <p className="mt-1 text-xs text-muted-foreground">Notice the pairs: HTTP → HTTPS and FTP → SFTP. The "S" versions add security.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOLS.map((p) => (
            <div key={p.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-semibold">{p.name}</p>
                <Badge variant="secondary" style={{ color: p.secure ? GREEN : AMBER }}>
                  {p.secure ? "🔒 secure" : "plain"}
                </Badge>
              </div>
              <p className="mt-1 text-xs font-medium">{p.job}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{p.note}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">port {p.port}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          A protocol is the rulebook. A program such as Chrome or Outlook is software that follows the rulebook.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Two reference models</p>
        <p className="mt-1 text-xs text-muted-foreground">
          OSI has 7 layers (from ISO) and is used for teaching and troubleshooting. TCP/IP has 4 layers and is what the
          internet actually runs on. Tap a TCP/IP layer to see which OSI layers it covers.
        </p>

        <div className="mt-3 overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-[150px_1fr] gap-x-3">
            <p className="pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">TCP/IP (4)</p>
            <p className="pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">OSI (7)</p>
          </div>
          <div className="grid min-w-[520px] grid-cols-[150px_1fr] gap-x-3 gap-y-1" style={{ gridTemplateRows: "repeat(7, auto)" }}>
            {TCPIP.map((t) => {
              const top = 7 - Math.max(...t.rows) + 1;
              const on = sel === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSel(on ? null : t.name)}
                  style={{ gridColumn: 1, gridRow: `${top} / span ${t.rows.length}` }}
                  className={`rounded-lg border px-2 text-xs font-semibold transition-colors ${
                    on ? "border-primary bg-primary text-primary-foreground" : "bg-muted/40 hover:border-primary/50"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
            {OSI.map((l, idx) => {
              const on = hi.includes(l.n);
              return (
                <div
                  key={l.n}
                  style={{ gridColumn: 2, gridRow: idx + 1 }}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors ${
                    on ? "border-primary bg-primary/10" : sel ? "opacity-50" : ""
                  }`}
                >
                  <span className="w-5 font-mono font-bold">{l.n}</span>
                  <span className="w-24 font-semibold">{l.name}</span>
                  <span className="w-16 text-muted-foreground">{l.unit}</span>
                  <span className="hidden flex-1 text-muted-foreground sm:block">{l.ex}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tip title="OSI memory hook (7 to 1)">
          <span className="font-semibold">A</span>ll <span className="font-semibold">P</span>eople <span className="font-semibold">S</span>eem <span className="font-semibold">T</span>o <span className="font-semibold">N</span>eed <span className="font-semibold">D</span>ata <span className="font-semibold">P</span>rocessing. Or from layer 1 up: Please Do Not Throw Sausage Pizza Away.
        </Tip>
        <Tip title="Good to know">
          Cisco and many textbooks teach TCP/IP as 4 layers, but some books split Network Access into Data Link and
          Physical and call it 5 layers. The mapping above is the same either way.
        </Tip>
      </div>
    </div>
  );
}

/* ───────────────────────── 6 · common mistakes ───────────────────────── */

const MYTHS = [
  { wrong: "A network needs a server.", right: "A network needs devices, a medium and a purpose. Servers are optional, and peer-to-peer proves it." },
  { wrong: "Protocol and program are the same thing.", right: "A protocol is a rulebook. A program (Chrome, Outlook) uses the rulebook." },
  { wrong: "The internet is a LAN.", right: "The internet is a network of networks, the biggest WAN. It joins countless LANs across continents and is run by carriers." },
  { wrong: "A VPN is a type of network.", right: "A VPN is a virtual tunnel that runs on top of an existing network, either site-to-site or remote-access." },
  { wrong: "A host is always a client.", right: "A host can act as a client, a server or a peer. It depends on what it is doing, not what it is." },
  { wrong: "Client/Server has no downside.", right: "The server is a single point of failure, which is why backups and redundant servers exist." },
  { wrong: "OSI and TCP/IP are the same model.", right: "OSI has 7 layers (ISO) and is a teaching and troubleshooting model. TCP/IP has 4 layers and is what the internet runs on." },
  { wrong: "A SAN is just a big LAN.", right: "A SAN is built for storage: high capacity, high speed, low loss. It is about purpose, not distance." },
];

function MythsSection() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Tap a card to flip it from the wrong belief to the truth.</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(open.size === MYTHS.length ? new Set() : new Set(MYTHS.map((_, i) => i)))}>
          {open.size === MYTHS.length ? "Hide all" : "Show all"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MYTHS.map((m, i) => {
          const shown = open.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50"
              style={{ borderColor: shown ? GREEN : undefined }}
            >
              <p className="text-xs font-semibold" style={{ color: RED }}>✕ Wrong</p>
              <p className="mt-1 text-sm font-medium">{m.wrong}</p>
              {shown ? (
                <div className="n1-fade mt-3 border-t pt-3">
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>✓ Right</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.right}</p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">Tap to see the truth</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 7 · interview prep ───────────────────────── */

const QA: { q: string; a: string[] }[] = [
  { q: "What is a computer network?", a: ["A collection of devices connected through a wired or wireless medium, to exchange information.", "It needs three things: devices, a medium and a purpose."] },
  { q: "What is the difference between a protocol and a reference model?", a: ["A protocol is a set of rules two devices agree on so they can communicate.", "A reference model is a blueprint of how devices should behave, so vendors interoperate. OSI and TCP/IP are the two to know."] },
  { q: "Explain PAN, LAN, CAN, MAN and WAN.", a: ["PAN: around one person, about 10 m (phone to earbuds).", "LAN: one building or site (home Wi-Fi).", "CAN: several buildings on one campus, one owner.", "MAN: a city, usually run by an ISP.", "WAN: countries and continents. The internet is the biggest one."] },
  { q: "Where does a SAN fit?", a: ["A Storage Area Network is built for fast, high-capacity storage access, usually inside a data centre.", "It is about purpose, not distance, so it does not sit on the PAN to WAN ladder."] },
  { q: "What is a VPN and where does it belong?", a: ["A virtual tunnel through a public network (usually the internet) that carries private traffic securely.", "Types: site-to-site (branch to HQ) and remote-access (one user to the office).", "It is a technique, not a network type. It rides on a network you already have."] },
  { q: "What is a host?", a: ["An end device that sends or receives data: computers, phones, printers, servers, IoT devices.", "Routers and switches are intermediate devices that move traffic between hosts."] },
  { q: "Explain the three roles a host can play.", a: ["Client requests services. Server provides services. Peer does both.", "They are roles, not device types. A laptop is a client when browsing, a server when sharing a file and a peer when using a torrent."] },
  { q: "Compare Client/Server, Mainframe/Terminal and Peer-to-Peer.", a: ["Client/Server: a central server, easy to manage, but a single point of failure.", "Mainframe/Terminal: all compute and storage on the mainframe, terminals only do input and output.", "Peer-to-Peer: no central server, every host is client and server. Cheap, but no central control."] },
  { q: "What are the trade-offs of centralized architectures?", a: ["Upside: central control, central security, easier management.", "Downside: the server or mainframe is a single point of failure. Real deployments add redundant or backup servers in different locations."] },
  { q: "What happens when you type a URL?", a: ["DNS resolves the name to an IP address.", "The data is split into pieces, and each piece is given source IP, destination IP and port numbers.", "Routers forward the pieces hop by hop toward the destination network.", "The server replies the same way, and your computer rebuilds the page."] },
];

function InterviewSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          A computer network is a collection of devices connected through a wired or wireless medium, with the purpose of
          exchanging information. Networks are classified by scope (PAN, LAN, CAN, MAN, WAN) and by purpose, like SAN for
          storage. Devices play roles: client, server or peer. Architectures decide where the data and thinking live:
          client/server, mainframe/terminal or peer-to-peer. Two reference models describe all this: OSI (7 layers) for
          teaching and troubleshooting, and TCP/IP (4 layers) for what the internet actually runs on.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">Practice it out loud until it flows without notes.</p>
      </Panel>

      <div className="flex flex-col gap-2">
        {QA.map((x, i) => {
          const on = open === i;
          return (
            <div key={x.q} className="rounded-xl border bg-background">
              <button
                type="button"
                onClick={() => setOpen(on ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={on}
              >
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                  {x.q}
                </span>
                <span className="text-muted-foreground">{on ? "−" : "+"}</span>
              </button>
              {on && (
                <ul className="n1-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Goal">
        Every protocol, device and model in this course exists to make the six packet-story steps happen reliably,
        quickly and safely. If you can explain each mistake card in your own words, you understand Topic 01 and have not
        just memorized it.
      </Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function IntroNetworkingSummary() {
  const [tab, setTab] = useState<TabId>("what");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n1-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes n1-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .n1-chip { animation: n1-move 2.2s ease-in-out both; }
        .n1-chip-long { animation: n1-move 3.6s ease-in-out both; }
        .n1-fade { animation: n1-fade .5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .n1-chip, .n1-chip-long, .n1-fade { animation: none; opacity: 1; } .n1-chip, .n1-chip-long { transform: translate(var(--x1), var(--y1)); } }
      `}</style>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 01: Introduction to networking</CardTitle>
            <CardDescription className="mt-1">
              Devices + medium + purpose. Seven short sections, tap through them in any order.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Pick key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </Pick>
          ))}
        </div>

        <div key={tab}>
          {tab === "what" && <WhatSection />}
          {tab === "story" && <StorySection />}
          {tab === "types" && <TypesSection />}
          {tab === "roles" && <RolesSection />}
          {tab === "models" && <ModelsSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}