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
 * DhcpDoraFlow
 * A new PC (PC1) boots with no IP and gets one from a DHCP server using
 * Discover, Offer, Request, Ack (DORA). Packets animate through a real
 * switch, and the switch MAC table, server lease table and PC1 config
 * update live. Tap a device to learn what it does.
 */

const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)
const HOP = 1.1 * SLOW;

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#7048e8";
const mono = "ui-monospace, monospace";

const BCAST_MAC = "FFFF.FFFF.FFFF";
const BCAST_IP = "255.255.255.255";
const OFFERED_IP = "192.168.1.50";

/* ───────────────────────── topology ───────────────────────── */

type NodeId = "pc1" | "pc2" | "sw1" | "r1" | "srv";
type Kind = "pc" | "switch" | "router" | "server";

type NodeDef = { x: number; y: number; kind: Kind; name: string; mac?: string; ip?: string; info: string };

const NODES: Record<NodeId, NodeDef> = {
  r1: {
    x: 420, y: 62, kind: "router", name: "Router", mac: "rrr", ip: "192.168.1.1",
    info: "Router: the default gateway (192.168.1.1). It does not hand out IPs here.",
  },
  sw1: {
    x: 420, y: 235, kind: "switch", name: "Switch",
    info: "Switch: forwards frames by MAC address. A broadcast is flooded out every other port.",
  },
  pc1: {
    x: 110, y: 235, kind: "pc", name: "PC1", mac: "aaa", ip: "0.0.0.0",
    info: "PC1: a brand new client. It just booted and has no IP address yet.",
  },
  srv: {
    x: 730, y: 235, kind: "server", name: "DHCP Server", mac: "ccc", ip: "192.168.1.10",
    info: "DHCP Server: owns a pool of IPs (192.168.1.50 to .100) and hands them out.",
  },
  pc2: {
    x: 420, y: 425, kind: "pc", name: "PC2", mac: "bbb", ip: "192.168.1.20",
    info: "PC2: already configured. It is not a DHCP server, so it ignores DHCP broadcasts.",
  },
};

const LINKS: [NodeId, NodeId][] = [
  ["pc1", "sw1"],
  ["pc2", "sw1"],
  ["srv", "sw1"],
  ["r1", "sw1"],
];
const linkKey = (a: NodeId, b: NodeId) => [a, b].sort().join("-");
const radius = (id: NodeId) => ({ pc: 48, switch: 50, router: 46, server: 50 })[NODES[id].kind];

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

/* ───────────────────────── steps ───────────────────────── */

type Pkt = { from: NodeId; to: NodeId; label: string; color: string; delay?: number };

type Step = {
  phase: number;
  title: string;
  text: string;
  tip?: string;
  cast?: string;
  packets: Pkt[];
  focus?: NodeId[];
  frame?: [string, string][];
  accept?: NodeId[];
  drop?: NodeId[];
  used: string[]; // table entries touched in this step
  offer?: boolean;
  done?: boolean;
};

const fr = (
  msg: string, sPort: string, dPort: string, sIp: string, dIp: string, sMac: string, dMac: string,
): [string, string][] => [
  ["Message", msg],
  ["Src UDP", sPort],
  ["Dst UDP", dPort],
  ["Src IP", sIp],
  ["Dst IP", dIp],
  ["Src MAC", sMac],
  ["Dst MAC", dMac],
];

const STEPS: Step[] = [
  {
    phase: 1,
    title: "Step 1: PC1 boots with no IP",
    text: "PC1 has no IP address (0.0.0.0) and does not know who is on the network. It needs an IP from a DHCP server.",
    tip: "DORA = Discover, Offer, Request, Ack.",
    packets: [],
    focus: ["pc1"],
    used: [],
  },
  {
    phase: 2,
    title: "Step 2: Discover (D)",
    text: "PC1 shouts: “Is there a DHCP server?” The switch learns aaa is on port 0/1, then floods the broadcast out every other port. PC2 and the router ignore it. The server accepts it.",
    tip: "Broadcast at both layers: IP 255.255.255.255 and MAC FFFF.FFFF.FFFF.",
    cast: "Broadcast",
    packets: [
      { from: "pc1", to: "sw1", label: "Discover", color: BLUE },
      { from: "sw1", to: "pc2", label: "Discover", color: BLUE, delay: 1 },
      { from: "sw1", to: "r1", label: "Discover", color: BLUE, delay: 1 },
      { from: "sw1", to: "srv", label: "Discover", color: BLUE, delay: 1 },
    ],
    frame: fr("Discover (1)", "68", "67", "0.0.0.0", BCAST_IP, "aaa", BCAST_MAC),
    accept: ["srv"],
    drop: ["pc2", "r1"],
    used: ["mac:aaa"],
  },
  {
    phase: 3,
    title: "Step 3: Server prepares an offer",
    text: "The server takes the first free IP from its pool and reserves it for aaa. It packs the settings PC1 will need.",
    packets: [],
    focus: ["srv"],
    offer: true,
    used: ["lease"],
  },
  {
    phase: 4,
    title: "Step 4: Offer (O)",
    text: "The server sends the offer to PC1's MAC (aaa). The switch already knows aaa = 0/1, so only PC1 gets it (PC2 sees nothing). It also learns ccc = 0/3. PC1 still has no IP.",
    tip: "Client port is 68, server port is 67.",
    cast: "Sent to PC1's MAC",
    packets: [
      { from: "srv", to: "sw1", label: "Offer", color: GREEN },
      { from: "sw1", to: "pc1", label: "Offer", color: GREEN, delay: 1 },
    ],
    frame: fr("Offer (2)", "67", "68", "192.168.1.10", BCAST_IP, "ccc", "aaa"),
    accept: ["pc1"],
    used: ["mac:ccc", "mac:aaa"],
  },
  {
    phase: 5,
    title: "Step 5: Request (R)",
    text: "PC1 says: “Yes, I'll take 192.168.1.50!” It is still a broadcast, so any other DHCP server knows its offer was not chosen. The server accepts it.",
    tip: "PC1 still uses 0.0.0.0 as its source IP.",
    cast: "Broadcast",
    packets: [
      { from: "pc1", to: "sw1", label: "Request", color: AMBER },
      { from: "sw1", to: "pc2", label: "Request", color: AMBER, delay: 1 },
      { from: "sw1", to: "r1", label: "Request", color: AMBER, delay: 1 },
      { from: "sw1", to: "srv", label: "Request", color: AMBER, delay: 1 },
    ],
    frame: fr("Request (3)", "68", "67", "0.0.0.0", BCAST_IP, "aaa", BCAST_MAC),
    accept: ["srv"],
    drop: ["pc2", "r1"],
    used: ["mac:aaa"],
  },
  {
    phase: 6,
    title: "Step 6: Acknowledgment (A)",
    text: "The server confirms: “It's yours for 24 hours.” The lease is saved as bound, and the Ack goes only to PC1.",
    cast: "Sent to PC1's MAC",
    packets: [
      { from: "srv", to: "sw1", label: "Ack", color: PURPLE },
      { from: "sw1", to: "pc1", label: "Ack", color: PURPLE, delay: 1 },
    ],
    frame: fr("Ack (4)", "67", "68", "192.168.1.10", BCAST_IP, "ccc", "aaa"),
    accept: ["pc1"],
    used: ["mac:ccc", "mac:aaa", "lease"],
  },
  {
    phase: 7,
    title: "Step 7: PC1 is configured",
    text: "PC1 applies the settings. It now has a real IP and can talk to the network.",
    packets: [],
    focus: ["pc1"],
    used: ["cfg"],
    done: true,
  },
];
const N = STEPS.length;

const PHASES = ["1 · Boot", "2 · Discover", "3 · Pick IP", "4 · Offer", "5 · Request", "6 · Ack", "7 · Done"];

const OFFER_ITEMS: [string, string][] = [
  ["IP address", OFFERED_IP],
  ["Subnet mask", "255.255.255.0"],
  ["Gateway", "192.168.1.1"],
  ["DNS server", "8.8.8.8"],
  ["Lease time", "24 hours"],
];

/* ───────────────────────── real device icons ───────────────────────── */

function Icon({ kind, stroke, w }: { kind: Kind; stroke: string; w: number }) {
  const p = { stroke, strokeWidth: w, className: "fill-background", style: { transition: "stroke .4s" } };
  if (kind === "pc")
    return (
      <g>
        <rect x={-32} y={-30} width={64} height={42} rx={4} {...p} />
        <rect x={-26} y={-24} width={52} height={30} rx={2} fill="currentColor" fillOpacity={0.12} />
        <path d="M-18 -15 l6 5 -6 5 M-6 -4 h10" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" />
        <rect x={-6} y={12} width={12} height={8} {...p} />
        <rect x={-20} y={20} width={40} height={5} rx={2} {...p} />
      </g>
    );
  if (kind === "switch")
    return (
      <g>
        <rect x={-46} y={-16} width={92} height={32} rx={5} {...p} />
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={i}>
            <rect x={-38 + i * 10} y={-4} width={7} height={9} rx={1} fill="currentColor" fillOpacity={0.55} />
            <circle cx={-34.5 + i * 10} cy={-9} r={1.6} fill={GREEN} />
          </g>
        ))}
      </g>
    );
  if (kind === "router")
    return (
      <g>
        <path d="M-38 -12 V14 A38 12 0 0 0 38 14 V-12" {...p} />
        <ellipse cx={0} cy={-12} rx={38} ry={12} {...p} />
        <path
          d="M-16 -15 H16 M10 -20 L16 -15 L10 -10 M16 -9 H-16 M-10 -14 L-16 -9 L-10 -4"
          stroke="currentColor"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  return (
    <g>
      <rect x={-28} y={-36} width={56} height={72} rx={5} {...p} />
      {[-30, -8, 14].map((y) => (
        <g key={y}>
          <rect x={-22} y={y} width={44} height={18} rx={3} fill="currentColor" fillOpacity={0.08} stroke="currentColor" strokeOpacity={0.4} />
          <circle cx={-14} cy={y + 9} r={2.6} fill={GREEN} />
          <path d={`M-6 ${y + 9} h18`} stroke="currentColor" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

/* ───────────────────────── drawing ───────────────────────── */

function Chip({ pkt }: { pkt: Pkt }) {
  const [x0, y0, x1, y1] = edge(pkt.from, pkt.to);
  const w = pkt.label.length * 6.4 + 18;
  return (
    <g
      className="dh-pkt"
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
      <rect x={-w / 2} y={-11} width={w} height={22} rx={6} fill={pkt.color} stroke="#fff" strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>
        {pkt.label}
      </text>
    </g>
  );
}

const ipOf = (id: NodeId, step: number) => (id === "pc1" && step >= 7 ? OFFERED_IP : NODES[id].ip);

function Topology({
  step, stepKey, curStep, sel, onSel,
}: {
  step: Step | null;
  stepKey: number;
  curStep: number;
  sel: NodeId | null;
  onSel: (id: NodeId) => void;
}) {
  const linkColor: Record<string, string> = {};
  const active = new Set<NodeId>();
  step?.packets.forEach((p) => {
    linkColor[linkKey(p.from, p.to)] = p.color;
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

  const topOffset: Record<Kind, number> = { pc: 46, router: 42, server: 50, switch: 0 };

  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-3">
      <svg
        viewBox="0 0 840 490"
        className="mx-auto min-w-[680px] max-w-[880px]"
        role="img"
        aria-label="PC1, PC2, a router and a DHCP server connected through one switch"
      >
        {LINKS.map(([a, b]) => {
          const k = linkKey(a, b);
          const c = linkColor[k];
          const [x0, y0, x1, y1] = edge(a, b);
          return (
            <line
              key={k}
              x1={x0} y1={y0} x2={x1} y2={y1}
              stroke={c ?? "currentColor"}
              strokeOpacity={c ? 1 : 0.45}
              strokeWidth={c ? 3 : 2}
              style={{ transition: "stroke .4s" }}
            />
          );
        })}

        {/* switch port labels */}
        {t(355, 225, "0/1", "end")}
        {t(428, 168, "0/2", "start")}
        {t(485, 225, "0/3", "start")}
        {t(428, 350, "0/4", "start")}
        {t(485, 205, "Switch", "start", 14)}

        {(Object.keys(NODES) as NodeId[]).map((id) => {
          const n = NODES[id];
          const on = active.has(id);
          const ok = step?.accept?.includes(id);
          const no = step?.drop?.includes(id);
          const stroke = ok ? GREEN : no ? RED : on ? AMBER : "currentColor";
          const w = ok || no || on ? 3.5 : 2.2;
          const side = id === "r1" || id === "pc2";
          const lx = side ? n.x + 58 : n.x;
          const anchor = side ? "start" : "middle";
          const ly = side ? n.y - 6 : n.y + (n.kind === "server" ? 54 : 44);
          const ip = ipOf(id, curStep);
          const showLabel = n.kind !== "switch";

          return (
            <g key={id} onClick={() => onSel(id)} style={{ cursor: "pointer" }}>
              <rect x={n.x - 60} y={n.y - 50} width={120} height={100} fill="transparent" />
              <g transform={`translate(${n.x} ${n.y})`}>
                <Icon kind={n.kind} stroke={stroke} w={w} />
              </g>
              {sel === id && (
                <circle cx={n.x} cy={n.y} r={58} fill="none" stroke={BLUE} strokeDasharray="5 5" strokeWidth={1.5} />
              )}
              {showLabel && (
                <g>
                  <text x={lx} y={ly} textAnchor={anchor} fontSize={14} fontWeight={600} className="fill-foreground">
                    {n.name}
                  </text>
                  <text x={lx} y={ly + 16} textAnchor={anchor} fontSize={12} fontFamily={mono} className="fill-foreground">
                    {n.mac}
                  </text>
                  <text
                    key={`${id}-${ip}`}
                    x={lx}
                    y={ly + 32}
                    textAnchor={anchor}
                    fontSize={12}
                    fontFamily={mono}
                    fontWeight={id === "pc1" && curStep >= 7 ? 700 : 400}
                    fill={id === "pc1" && curStep >= 7 ? GREEN : undefined}
                    className={id === "pc1" && curStep >= 7 ? "dh-pop" : "fill-foreground"}
                  >
                    {ip}
                  </text>
                </g>
              )}
              {(ok || no) && (
                <g key={`${stepKey}-${id}`} className="dh-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text
                    x={n.x}
                    y={n.y - topOffset[n.kind] - 6}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill={ok ? GREEN : RED}
                  >
                    {ok ? "✓ accepts" : "✗ ignores"}
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

function Row({ text, hot }: { text: string; hot: boolean }) {
  return (
    <p
      className={`mt-1 font-mono text-[11px] ${hot ? "font-bold" : "text-muted-foreground"}`}
      style={hot ? { color: AMBER } : undefined}
    >
      {text}
    </p>
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
    <div className="dh-fade flex flex-col gap-3">
      <p className="text-xs font-medium" style={{ color: GREEN }}>
        PC1 now has {OFFERED_IP}. DORA is complete.
      </p>
      <SummaryTable
        head={["Letter", "Message", "Direction", "Dst IP", "Dst MAC"]}
        colorFrom={4}
        rows={[
          ["D", "Discover", "Client → Server", BCAST_IP, BCAST_MAC],
          ["O", "Offer", "Server → Client", BCAST_IP, "aaa"],
          ["R", "Request", "Client → Server", BCAST_IP, BCAST_MAC],
          ["A", "Ack", "Server → Client", BCAST_IP, "aaa"],
        ]}
      />
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function DhcpDoraFlow() {
  const [step, setStep] = useState(0); // 0 = not started
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState<NodeId | null>(null);

  const done = step >= N;
  const current = step > 0 ? STEPS[step - 1] : null;
  const used = new Set(current?.used ?? []);

  useEffect(() => {
    if (!playing) return;
    if (step >= N) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(N, s + 1)), 6000);
    return () => clearTimeout(t);
  }, [playing, step]);

  const curPhase = current ? current.phase - 1 : -1;

  // live table state
  const macRows: [string, string][] = [];
  if (step >= 2) macRows.push(["aaa", "0/1"]);
  if (step >= 4) macRows.push(["ccc", "0/3"]);

  const leaseState = step >= 6 ? "Bound (24h)" : step >= 3 ? "Offered" : null;

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes dh-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 8% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes dh-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes dh-pop  { from { opacity: 0; } to { opacity: 1; } }
        .dh-pkt  { animation: dh-move ${HOP}s ease-in-out both; }
        .dh-fade { animation: dh-fade ${0.5 * SLOW}s ease-out both; }
        .dh-pop  { animation: dh-pop ${0.4 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .dh-pkt, .dh-fade, .dh-pop { animation: none; opacity: 1; } .dh-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">DHCP: how a PC gets an IP (DORA)</CardTitle>
            <CardDescription className="mt-1">
              PC1 has just booted with no IP. Watch it get one from the DHCP server in 4 messages. Tap any device to see
              what it does.
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

        <Topology step={current} stepKey={step} curStep={step} sel={sel} onSel={setSel} />

        <p className="-mt-2 text-[11px] text-muted-foreground">
          {sel ? `ℹ️ ${NODES[sel].info}` : "👆 Tap a device to learn what it is."}
        </p>

        <div className="rounded-xl border bg-background p-4">
          {current ? (
            <div key={step} className="dh-fade flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Step {step} of {N}
                </p>
                {current.cast && <Badge variant="outline">{current.cast}</Badge>}
              </div>
              <p className="text-sm font-semibold">{current.title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{current.text}</p>

              {current.offer && (
                <div className="flex flex-wrap gap-2">
                  {OFFER_ITEMS.map(([k, v]) => (
                    <span key={k} className="rounded-full border px-3 py-1 text-[11px]">
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="font-mono font-semibold" style={{ color: GREEN }}>
                        {v}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {current.frame && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[560px] text-xs">
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

              {current.tip && <p className="rounded-lg bg-muted/40 px-3 py-2 text-[11px]">💡 {current.tip}</p>}

              {done && <Finale />}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Press Start to follow PC1 as it asks for an IP. Tables below update live, and the entry used at each step
              is highlighted in amber.
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
              {done ? "Replay" : "Start DORA"}
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

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold">Switch MAC table</p>
            {macRows.length === 0 && <Row text="(empty)" hot={false} />}
            {macRows.map(([mac, port]) => (
              <Row key={mac} text={`${port} = ${mac}`} hot={used.has(`mac:${mac}`)} />
            ))}
          </div>

          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold">Server leases</p>
            <Row text="Pool: 192.168.1.50 to .100" hot={false} />
            {leaseState ? (
              <Row text={`${OFFERED_IP} = aaa · ${leaseState}`} hot={used.has("lease")} />
            ) : (
              <Row text="No leases yet" hot={false} />
            )}
          </div>

          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold">PC1 settings</p>
            {step >= 7 ? (
              <div className="dh-fade">
                <Row text={`IP: ${OFFERED_IP}`} hot={used.has("cfg")} />
                <Row text="Mask: 255.255.255.0" hot={used.has("cfg")} />
                <Row text="Gateway: 192.168.1.1" hot={used.has("cfg")} />
                <Row text="DNS: 8.8.8.8" hot={used.has("cfg")} />
              </div>
            ) : step >= 4 ? (
              <Row text={`Offer received: ${OFFERED_IP} (not applied yet)`} hot={step === 4} />
            ) : (
              <Row text="IP: none (0.0.0.0)" hot={false} />
            )}
          </div>
        </div>

        <ul className="flex flex-col gap-1 pl-5 text-[11px] leading-5 text-muted-foreground marker:text-primary">
          <li>Moving dots are the DHCP messages. Green ✓ accepts, red ✗ ignores.</li>
          <li>Discover and Request are broadcasts, so the switch floods them. Offer and Ack go only to PC1.</li>
          <li>Ports: client uses UDP 68, server uses UDP 67.</li>
        </ul>
      </CardContent>
    </Card>
  );
}

export default DhcpDoraFlow;