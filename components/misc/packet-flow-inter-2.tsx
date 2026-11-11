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
 * ReplyPacketFlow
 * Reply path of the ping: PC3 (192.168.2.1) sends the ICMP echo-reply back to
 * PC1 (192.168.1.1) through SW2, R2, R1 and SW1. The tables start already
 * filled from the forward path, so no ARP is needed at all. The entry used at
 * each step is highlighted in amber.
 */

const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)
const HOP = 1.1 * SLOW;
const MASK = "255.255.255.0";

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const mono = "ui-monospace, monospace";

/* ───────────────────────── topology ───────────────────────── */

type NodeId = "pc1" | "pc2" | "pc3" | "pc4" | "sw1" | "sw2" | "r1" | "r2";
type ArpDev = "pc1" | "r1" | "r2" | "pc3";
type SwId = "sw1" | "sw2";

type NodeDef = { x: number; y: number; kind: "router" | "switch" | "pc"; name: string; mac?: string; ip?: string };

const NODES: Record<NodeId, NodeDef> = {
  r1: { x: 145, y: 125, kind: "router", name: "R1" },
  r2: { x: 695, y: 125, kind: "router", name: "R2" },
  sw1: { x: 145, y: 335, kind: "switch", name: "SW1" },
  sw2: { x: 695, y: 335, kind: "switch", name: "SW2" },
  pc1: { x: 70, y: 510, kind: "pc", name: "PC1", mac: "aaa", ip: "[1.1]" },
  pc2: { x: 230, y: 510, kind: "pc", name: "PC2", mac: "bbb", ip: "[1.2]" },
  pc3: { x: 630, y: 510, kind: "pc", name: "PC3", mac: "ggg", ip: "[2.1]" },
  pc4: { x: 780, y: 510, kind: "pc", name: "PC4", mac: "hhh", ip: "[2.2]" },
};
const LINKS: [NodeId, NodeId][] = [
  ["r1", "r2"],
  ["r1", "sw1"],
  ["r2", "sw2"],
  ["sw1", "pc1"],
  ["sw1", "pc2"],
  ["sw2", "pc3"],
  ["sw2", "pc4"],
];
const linkKey = (a: NodeId, b: NodeId) => [a, b].sort().join("-");
const radius = (id: NodeId) => (NODES[id].kind === "pc" ? 44 : 46);

function edge(a: NodeId, b: NodeId): [number, number, number, number] {
  const A = NODES[a];
  const B = NODES[b];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return [A.x + ux * radius(a), A.y + uy * radius(a), B.x - ux * radius(b), B.y - uy * radius(b)];
}

/* ───────────────────────── tables and steps ───────────────────────── */

/** State left behind by the forward path. Nothing changes during the reply. */
const START = {
  arp: {
    pc1: { "1.100": "ccc" },
    r1: { "1.1": "aaa", "3.2": "eee" },
    r2: { "3.1": "ddd", "2.1": "ggg" },
    pc3: { "2.100": "nnn" },
  } as Record<ArpDev, Record<string, string>>,
  mac: {
    sw1: { aaa: "0/0", ccc: "0/3" },
    sw2: { nnn: "0/0", ggg: "0/1" },
  } as Record<SwId, Record<string, string>>,
};

type Pkt = { from: NodeId; to: NodeId; label: string; delay?: number };

type Step = {
  phase: number;
  title: string;
  text: string;
  packets: Pkt[];
  focus?: NodeId[];
  frame?: [string, string][];
  route?: { device: string; rows: [string, string][]; hit: number };
  accept?: NodeId[];
  used: string[]; // table entries read in this step, e.g. "arp:pc3:2.100", "mac:sw2:ggg"
  and?: boolean;
  noArp?: string;
};

const fr = (sIp: string, dIp: string, sMac: string, dMac: string, ttl?: string): [string, string][] => {
  const rows: [string, string][] = [
    ["Protocol", "ICMP echo-reply"],
    ["Src IP", sIp],
    ["Dest IP", dIp],
    ["Src MAC", sMac],
    ["Dest MAC", dMac],
  ];
  if (ttl) rows.push(["TTL", ttl]);
  return rows;
};

const STEPS: Step[] = [
  {
    phase: 1,
    title: "Step 1: AND operation on PC3 (local or remote)",
    text: "PC3 replies to 192.168.1.1. It does an AND between that address and its own mask, in binary. The result is 192.168.1.0, but PC3's own network is 192.168.2.0. They are different, so PC1 is remote. PC3 must send the reply to its default gateway (R2, 2.100).",
    packets: [],
    focus: ["pc3"],
    used: [],
    and: true,
  },
  {
    phase: 2,
    title: "Step 2: ARP on PC3, cache hit",
    text: "PC3 needs the MAC of the gateway 2.100. It is already in its cache (2.100 = nnn), learned from R2's ARP request during the forward path. No ARP is needed.",
    packets: [],
    focus: ["pc3"],
    used: ["arp:pc3:2.100"],
    noArp: "PC3 ARP cache hit: 2.100 = nnn",
  },
  {
    phase: 3,
    title: "Step 3: PC3 sends the echo-reply to R2",
    text: "The destination IP is PC1 (the final target), but the destination MAC is nnn (R2, not PC1). SW2 already has the source ggg = 0/1, and it knows the destination nnn = 0/0, so it forwards the frame only out of port 0/0 to R2. PC4 never sees it.",
    packets: [
      { from: "pc3", to: "sw2", label: "Echo reply" },
      { from: "sw2", to: "r2", label: "Echo reply", delay: 1 },
    ],
    frame: fr("192.168.2.1", "192.168.1.1", "ggg", "nnn"),
    accept: ["r2"],
    used: ["mac:sw2:ggg", "mac:sw2:nnn"],
  },
  {
    phase: 4,
    title: "Step 4: R2 routes the packet",
    text: "The destination MAC is nnn, which is R2's own, so it accepts the frame. It removes the Ethernet header and reads Dest IP = 1.1. Routing table: 192.168.1.0/24 via next hop 3.1, out of the 3.0 link. It needs the MAC of 3.1, and its ARP table already has 3.1 = ddd from the forward path. No ARP is needed. The TTL is reduced by 1.",
    packets: [],
    focus: ["r2"],
    route: {
      device: "R2 routing table",
      rows: [
        ["192.168.1.0/24", "via 192.168.3.1"],
        ["192.168.2.0/24", "directly connected (0/0, 2.100)"],
        ["192.168.3.0/24", "directly connected"],
      ],
      hit: 0,
    },
    used: ["arp:r2:3.1"],
    noArp: "R2 ARP cache hit: 3.1 = ddd",
  },
  {
    phase: 5,
    title: "Step 5: R2 forwards the reply to R1",
    text: "There is no switch on the 3.0 link, so the frame goes straight to R1. The IPs are unchanged (2.1 to 1.1). The source MAC is eee (R2's 3.0 interface) and the destination MAC is ddd (R1's 3.0 interface).",
    packets: [{ from: "r2", to: "r1", label: "Echo reply" }],
    frame: fr("192.168.2.1", "192.168.1.1", "eee", "ddd", "TTL - 1"),
    accept: ["r1"],
    used: [],
  },
  {
    phase: 6,
    title: "Step 6: R1 routes the packet",
    text: "The destination MAC is ddd, which is R1's own, so it accepts the frame. It removes the Ethernet header and reads Dest IP = 1.1. 192.168.1.0/24 is directly connected on its 1.100 interface, so no next router is needed. It needs PC1's MAC, and its ARP table already has 1.1 = aaa, learned from PC1's ARP request in the forward path. No ARP is needed. The TTL is reduced by 1 again.",
    packets: [],
    focus: ["r1"],
    route: {
      device: "R1 routing table",
      rows: [
        ["192.168.1.0/24", "directly connected (0/0, 1.100)"],
        ["192.168.2.0/24", "via 192.168.3.2"],
        ["192.168.3.0/24", "directly connected"],
      ],
      hit: 0,
    },
    used: ["arp:r1:1.1"],
    noArp: "R1 ARP cache hit: 1.1 = aaa",
  },
  {
    phase: 7,
    title: "Step 7: R1 forwards the reply to PC1",
    text: "The source MAC is ccc (R1's 1.100 interface) and the destination MAC is aaa (PC1). SW1 knows the source ccc = 0/3 and the destination aaa = 0/0, so it forwards the frame only out of port 0/0. PC2 never sees it. PC1 accepts it because the MAC and the IP both match. The ping is successful.",
    packets: [
      { from: "r1", to: "sw1", label: "Echo reply" },
      { from: "sw1", to: "pc1", label: "Echo reply", delay: 1 },
    ],
    frame: fr("192.168.2.1", "192.168.1.1", "ccc", "aaa", "TTL - 2"),
    accept: ["pc1"],
    used: ["mac:sw1:ccc", "mac:sw1:aaa"],
  },
];
const N = STEPS.length;

const toBin = (ip: string) => ip.split(".").map((o) => Number(o).toString(2).padStart(8, "0"));

const PHASES = [
  "1 · AND",
  "2 · ARP check",
  "3 · PC3 to R2",
  "4 · R2 routes",
  "5 · R2 to R1",
  "6 · R1 routes",
  "7 · R1 to PC1",
];

/* ───────────────────────── drawing ───────────────────────── */

function Chip({ pkt }: { pkt: Pkt }) {
  const [x0, y0, x1, y1] = edge(pkt.from, pkt.to);
  const w = pkt.label.length * 6 + 18;
  return (
    <g
      className="rv-pkt"
      style={
        {
          "--x0": `${x0}px`,
          "--y0": `${y0}px`,
          "--x1": `${x1}px`,
          "--y1": `${y1}px`,
          animationDelay: `${(pkt.delay ?? 0) * HOP}s`,
        } as CSSProperties
      }
    >
      <rect x={-w / 2} y={-11} width={w} height={22} rx={6} fill={BLUE} stroke="#fff" strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>
        {pkt.label}
      </text>
    </g>
  );
}

function Topology({ step, stepKey }: { step: Step | null; stepKey: number }) {
  const linkColor: Record<string, string> = {};
  const active = new Set<NodeId>();
  step?.packets.forEach((p) => {
    linkColor[linkKey(p.from, p.to)] = BLUE;
    active.add(p.from);
    active.add(p.to);
  });
  step?.focus?.forEach((f) => active.add(f));

  const maxDelay = step ? Math.max(0, ...step.packets.map((p) => p.delay ?? 0)) : 0;
  const markerDelay = step && step.packets.length > 0 ? (maxDelay + 1) * HOP : 0;

  const t = (x: number, y: number, s: string, anchor: "start" | "middle" | "end" = "middle", size = 11) => (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontFamily={mono} className="fill-foreground">
      {s}
    </text>
  );

  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-3">
      <svg
        viewBox="0 0 840 580"
        className="mx-auto min-w-[680px] max-w-[880px]"
        role="img"
        aria-label="Two networks joined by routers R1 and R2, each with a switch and two PCs"
      >
        {LINKS.map(([a, b]) => {
          const k = linkKey(a, b);
          const c = linkColor[k];
          const [x0, y0, x1, y1] = edge(a, b);
          return (
            <line
              key={k}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke={c ?? "currentColor"}
              strokeOpacity={c ? 1 : 0.45}
              strokeWidth={c ? 3 : 2}
              style={{ transition: "stroke .4s" }}
            />
          );
        })}

        {t(420, 108, "3.0", "middle", 14)}
        {t(205, 116, ".1", "start")}
        {t(205, 136, "ddd", "start")}
        {t(635, 116, ".2", "end")}
        {t(635, 136, "eee", "end")}

        {t(155, 195, "0/0  .100", "start")}
        {t(155, 213, "ccc", "start")}
        {t(155, 282, "0/3", "start")}
        {t(705, 195, "0/0  .100", "start")}
        {t(705, 213, "nnn", "start")}
        {t(705, 282, "0/0", "start")}

        {t(95, 420, "0/0", "end")}
        {t(200, 420, "0/2", "start")}
        {t(655, 420, "0/1", "end")}
        {t(760, 420, "0/2", "start")}

        {t(10, 335, "1.0/24", "start", 13)}
        {t(830, 335, "2.0/24", "end", 13)}

        {(["r1", "r2", "sw1", "sw2"] as NodeId[]).map((id) => {
          const n = NODES[id];
          const on = active.has(id);
          const ok = step?.accept?.includes(id);
          const stroke = ok ? GREEN : on ? AMBER : "currentColor";
          return (
            <g key={id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={45}
                className="fill-background"
                stroke={stroke}
                strokeWidth={ok || on ? 3.5 : n.kind === "router" ? 2.5 : 2}
                style={{ transition: "stroke .4s" }}
              />
              <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize={16} fontWeight={600} className="fill-foreground">
                {n.name}
              </text>
              {ok && (
                <g key={`${stepKey}-${id}`} className="rv-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text x={n.x} y={n.y - 56} textAnchor="middle" fontSize={12} fontWeight={700} fill={GREEN}>
                    ✓ accepts
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {(["pc1", "pc2", "pc3", "pc4"] as NodeId[]).map((id) => {
          const n = NODES[id];
          const on = active.has(id);
          const ok = step?.accept?.includes(id);
          const stroke = ok ? GREEN : on ? AMBER : "currentColor";
          const x = n.x - 55;
          const y = n.y - 38;
          return (
            <g key={id}>
              <rect
                x={x}
                y={y}
                width={110}
                height={76}
                rx={4}
                className="fill-background"
                stroke={stroke}
                strokeWidth={ok || on ? 3.5 : 2}
                style={{ transition: "stroke .4s" }}
              />
              <text x={n.x} y={y + 24} textAnchor="middle" fontSize={14} fontWeight={600} className="fill-foreground">
                {n.name}
              </text>
              <text x={n.x} y={y + 44} textAnchor="middle" fontSize={12} fontFamily={mono} fill-foreground>
                {n.mac}
              </text>
              <text x={n.x} y={y + 62} textAnchor="middle" fontSize={12} fontFamily={mono} fill-foreground>
                {n.ip}
              </text>
              {ok && (
                <g key={`${stepKey}-${id}`} className="rv-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text x={n.x} y={y - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill={GREEN}>
                    ✓ accepts
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {step?.packets.map((p, i) => (
          <Chip key={`${stepKey}-${i}`} pkt={p} />
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────── panels ───────────────────────── */

function AndPanel() {
  const rows: [string, string, string[]][] = [
    ["Dest IP", "192.168.1.1", toBin("192.168.1.1")],
    ["Mask", MASK, toBin(MASK)],
    ["AND result", "192.168.1.0", toBin("192.168.1.0")],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
      <div className="min-w-[520px] font-mono text-[11px]">
        {rows.map(([label, dotted, octets], r) => (
          <div
            key={label}
            className="rv-fade grid grid-cols-[90px_1fr_110px] items-center gap-2 py-1"
            style={{ animationDelay: `${r * 0.5 * SLOW}s` }}
          >
            <span className="font-sans text-xs text-muted-foreground">{label}</span>
            <span className={`flex gap-1.5 ${r === 2 ? "font-semibold text-primary" : ""}`}>
              {octets.map((o, i) => (
                <span key={i}>
                  {o}
                  {i < 3 && <span className="text-muted-foreground">.</span>}
                </span>
              ))}
            </span>
            <span className={r === 2 ? "font-semibold text-primary" : ""}>{dotted}</span>
          </div>
        ))}
        <div
          className="rv-fade mt-2 flex flex-wrap items-center gap-2 border-t pt-2 font-sans text-xs"
          style={{ animationDelay: `${1.5 * SLOW}s` }}
        >
          <span className="text-muted-foreground">PC3 own network (192.168.2.1 AND {MASK}):</span>
          <span className="font-mono font-semibold">192.168.2.0</span>
          <Badge variant="secondary" style={{ color: RED }}>
            Different network: remote
          </Badge>
        </div>
      </div>
    </div>
  );
}

function SummaryTable({ head, rows, colorFrom }: { head: string[]; rows: string[][]; colorFrom?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[480px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-3 py-2 ${i === 0 ? "font-semibold" : "font-mono"}`}
                  style={colorFrom !== undefined && i >= colorFrom ? { color: BLUE } : undefined}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Finale() {
  return (
    <div className="rv-fade flex flex-col gap-3">
      <p className="text-xs font-medium" style={{ color: GREEN }}>
        PC1 received the echo-reply. The reply added no new entries to any table.
      </p>
      <SummaryTable
        head={["Hop", "Src IP", "Dest IP", "Src MAC", "Dest MAC"]}
        colorFrom={3}
        rows={[
          ["PC3 to R2", "2.1", "1.1", "ggg", "nnn"],
          ["R2 to R1", "2.1", "1.1", "eee", "ddd"],
          ["R1 to PC1", "2.1", "1.1", "ccc", "aaa"],
        ]}
      />
      <p className="text-[11px] text-muted-foreground">
        Compared with the forward table, the IPs are swapped and every MAC is new for this direction.
      </p>
      <SummaryTable
        head={["", "Forward (echo)", "Reply (echo-reply)"]}
        rows={[
          ["ARPs needed", "3 (PC1 to gateway, R1 to R2, R2 to PC3)", "0"],
          ["Why", "All caches empty", "All caches already filled"],
          ["Src IP to Dest IP", "1.1 to 2.1", "2.1 to 1.1"],
        ]}
      />
    </div>
  );
}

function Row({ text, used }: { text: string; used: boolean }) {
  return (
    <p
      className={`mt-1 font-mono text-[11px] ${used ? "font-bold" : "text-muted-foreground"}`}
      style={used ? { color: AMBER } : undefined}
    >
      {text}
    </p>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function ReplyPacketFlow() {
  const [step, setStep] = useState(0); // 0 = not started
  const [playing, setPlaying] = useState(false);

  const done = step >= N;
  const current = step > 0 ? STEPS[step - 1] : null;
  const used = new Set(current?.used ?? []);

  useEffect(() => {
    if (!playing) return;
    if (step >= N) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(N, s + 1)), 5500);
    return () => clearTimeout(t);
  }, [playing, step]);

  const curPhase = current ? current.phase - 1 : -1;

  const arpCards: { id: ArpDev; name: string; mac: string }[] = [
    { id: "pc1", name: "PC1", mac: "aaa" },
    { id: "r1", name: "R1", mac: "ccc / ddd" },
    { id: "r2", name: "R2", mac: "eee / nnn" },
    { id: "pc3", name: "PC3", mac: "ggg" },
  ];
  const macCards: SwId[] = ["sw1", "sw2"];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes rv-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 8% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes rv-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes rv-pop  { from { opacity: 0; } to { opacity: 1; } }
        .rv-pkt  { animation: rv-move ${HOP}s ease-in-out both; }
        .rv-fade { animation: rv-fade ${0.5 * SLOW}s ease-out both; }
        .rv-pop  { animation: rv-pop ${0.4 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rv-pkt, .rv-fade, .rv-pop { animation: none; opacity: 1; } .rv-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Packet flow between networks: reply path</CardTitle>
            <CardDescription className="mt-1">
              PC3 (192.168.2.1) sends the echo-reply back to PC1 (192.168.1.1). The IP stays the same end to end, the
              MAC changes at every hop. The tables are already filled from the forward path, so no ARP is needed.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {PHASES.map((label, i) => {
            const state = i === curPhase ? "active" : i < curPhase ? "done" : "todo";
            return (
              <span
                key={label}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  state === "active"
                    ? "border-primary bg-primary text-primary-foreground"
                    : state === "done"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>

        <Topology step={current} stepKey={step} />

        <div className="rounded-xl border bg-background p-4">
          {current ? (
            <div key={step} className="rv-fade flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Step {step} of {N}
              </p>
              <p className="text-sm font-semibold">{current.title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{current.text}</p>

              {current.and && <AndPanel />}

              {current.noArp && (
                <p className="text-xs font-medium" style={{ color: GREEN }}>
                  {current.noArp}. No ARP sent.
                </p>
              )}

              {current.route && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[420px] text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">{current.route.device}: network</th>
                        <th className="px-3 py-2 text-left font-medium">Next hop</th>
                      </tr>
                    </thead>
                    <tbody>
                      {current.route.rows.map(([net, via], i) => (
                        <tr
                          key={net}
                          className="border-t"
                          style={i === current.route!.hit ? { color: GREEN, fontWeight: 600 } : undefined}
                        >
                          <td className="px-3 py-2 font-mono">{net}</td>
                          <td className="px-3 py-2 font-mono">{via}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {current.frame && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[480px] text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {current.frame.map(([h]) => (
                          <th key={h} className="px-3 py-2 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        {current.frame.map(([h, v], i) => (
                          <td
                            key={h}
                            className={`px-3 py-2 font-mono ${i === 0 ? "font-sans font-semibold" : ""}`}
                            style={h.includes("MAC") ? { color: BLUE } : undefined}
                          >
                            {v}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {done && <Finale />}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Press Start to follow the echo-reply from PC3 back to PC1. The tables below start with everything learned
              during the forward path. As the reply travels, the entry each device reads is highlighted in amber.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={step <= 1}
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.max(1, s - 1));
            }}
          >
            Back
          </Button>
          {step === 0 || done ? (
            <Button
              size="sm"
              onClick={() => {
                setPlaying(false);
                setStep(1);
              }}
            >
              {done ? "Replay" : "Start reply"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.min(N, s + 1));
              }}
            >
              Next step
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={step === 0 || done} onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Auto-play"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={step === 0}
            onClick={() => {
              setPlaying(false);
              setStep(0);
            }}
          >
            Reset
          </Button>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">ARP table of each device (from the forward path)</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {arpCards.map((c) => (
              <div key={c.id} className="rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">
                  {c.name} <span className="font-mono font-normal text-muted-foreground">{c.mac}</span>
                </p>
                {Object.entries(START.arp[c.id]).map(([ip, mac]) => (
                  <Row key={ip} text={`${ip} = ${mac}`} used={used.has(`arp:${c.id}:${ip}`)} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">MAC table of each switch (from the forward path)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {macCards.map((id) => (
              <div key={id} className="rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">{id.toUpperCase()}</p>
                {Object.entries(START.mac[id])
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([mac, port]) => (
                    <Row key={mac} text={`${port} = ${mac}`} used={used.has(`mac:${id}:${mac}`)} />
                  ))}
              </div>
            ))}
          </div>
        </div>

        <ul className="flex flex-col gap-1 pl-5 text-[11px] leading-5 text-muted-foreground marker:text-primary">
          <li>Blue packets are the echo-reply travelling back. Amber table entries are the ones read at this step.</li>
          <li>
            Switches never change the frame, they only forward it by MAC. Routers rebuild the frame at every hop (new
            MACs, TTL minus 1) but keep the IP addresses.
          </li>
          <li>ARP entries expire after a few minutes, then the ARP happens again.</li>
        </ul>
      </CardContent>
    </Card>
  );
}