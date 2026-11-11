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
 * RoutedPacketFlow
 * Forward path of a ping from PC1 (192.168.1.1) to PC3 (192.168.2.1) across
 * SW1, R1, R2 and SW2. Walks through 7 steps:
 *   1 AND, 2 ARP for the gateway, 3 echo to the gateway, 4 R1 routes,
 *   5 R1 forwards to R2, 6 R2 routes and ARPs for PC3, 7 R2 delivers to PC3.
 * Rule to remember: IP stays the same end to end, MAC changes at every hop.
 */

const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)
const HOP = 1.1 * SLOW; // seconds one chip takes to cross one cable
const MASK = "255.255.255.0";
const BCAST = "ffff.ffff.ffff";

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";

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

/** Start and end point of a chip travelling a -> b, trimmed to the node edges. */
function edge(a: NodeId, b: NodeId): [number, number, number, number] {
  const A = NODES[a];
  const B = NODES[b];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const ra = radius(a);
  const rb = radius(b);
  return [A.x + ux * ra, A.y + uy * ra, B.x - ux * rb, B.y - uy * rb];
}

/* ───────────────────────── tables and steps ───────────────────────── */

type Tables = {
  arp: Record<ArpDev, Record<string, string>>;
  mac: Record<SwId, Record<string, string>>;
};
const emptyTables = (): Tables => ({
  arp: { pc1: {}, r1: {}, r2: {}, pc3: {} },
  mac: { sw1: {}, sw2: {} },
});

type Mut =
  | { t: "arp"; dev: ArpDev; ip: string; mac: string }
  | { t: "mac"; sw: SwId; mac: string; port: string };

type Pkt = { from: NodeId; to: NodeId; label: string; reply?: boolean; delay?: number };

type Step = {
  phase: number; // 1..7
  title: string;
  text: string;
  packets: Pkt[];
  focus?: NodeId[];
  frame?: [string, string][];
  route?: { device: string; rows: [string, string][]; hit: number };
  accept?: NodeId[];
  discard?: NodeId[];
  mutations: Mut[];
  and?: boolean;
};

const fr = (op: string, sIp: string, dIp: string, sMac: string, dMac: string, ttl?: string): [string, string][] => {
  const rows: [string, string][] = [
    ["Operation", op],
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
    title: "Step 1: AND operation (local or remote)",
    text: "PC1 does an AND between the destination IP and its own mask, in binary. The result is 192.168.2.0, but PC1's own network is 192.168.1.0. The destination is remote, so PC1 cannot deliver it directly. It must hand the packet to its default gateway (192.168.1.100).",
    packets: [],
    focus: ["pc1"],
    mutations: [],
    and: true,
  },
  {
    phase: 2,
    title: "Step 2: PC1 sends an ARP request for the gateway",
    text: "PC1 knows the gateway IP but not its MAC. The gateway is in the same network, so the communication is Layer 2 and cannot happen without a MAC address. Note that PC1 ARPs for the gateway, not for PC3. Its ARP cache is empty. The frame arrives on SW1 port 0/0, so SW1 learns aaa = 0/0.",
    packets: [{ from: "pc1", to: "sw1", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.1.1", "192.168.1.100", "aaa", BCAST),
    mutations: [{ t: "mac", sw: "sw1", mac: "aaa", port: "0/0" }],
  },
  {
    phase: 2,
    title: "Step 2: SW1 floods the broadcast",
    text: "The destination MAC is the broadcast address, so SW1 floods the frame out of its other ports (0/2 and 0/3). PC2 ignores it because the target IP is not its own. R1 sees its own IP (192.168.1.100) and answers. R1 also learns from the request and saves 1.1 = aaa in its ARP table.",
    packets: [
      { from: "sw1", to: "pc2", label: "ARP Request" },
      { from: "sw1", to: "r1", label: "ARP Request" },
    ],
    frame: fr("ARP request", "192.168.1.1", "192.168.1.100", "aaa", BCAST),
    discard: ["pc2"],
    accept: ["r1"],
    mutations: [{ t: "arp", dev: "r1", ip: "1.1", mac: "aaa" }],
  },
  {
    phase: 2,
    title: "Step 2: R1 sends the ARP reply (unicast)",
    text: "R1 replies with the MAC of its 1.100 interface, which is ccc. The reply is unicast because R1 already knows PC1's MAC. SW1 receives it on port 0/3 and learns ccc = 0/3.",
    packets: [{ from: "r1", to: "sw1", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.1.100", "192.168.1.1", "ccc", "aaa"),
    mutations: [{ t: "mac", sw: "sw1", mac: "ccc", port: "0/3" }],
  },
  {
    phase: 2,
    title: "Step 2: the reply reaches PC1",
    text: "SW1 finds aaa in its MAC table and forwards the reply only out of port 0/0. PC1 saves 1.100 = ccc in its ARP cache. Now PC1 can build the frame.",
    packets: [{ from: "sw1", to: "pc1", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.1.100", "192.168.1.1", "ccc", "aaa"),
    accept: ["pc1"],
    mutations: [{ t: "arp", dev: "pc1", ip: "1.100", mac: "ccc" }],
  },
  {
    phase: 3,
    title: "Step 3: PC1 sends the ICMP echo to the gateway",
    text: "PC1 is saying: deliver this to R1, who will take it toward 2.1. The destination IP is PC3 (the final target) but the destination MAC is ccc (the gateway, not PC3). SW1 already knows ccc = 0/3, so it forwards the frame only out of port 0/3. PC2 never sees it.",
    packets: [
      { from: "pc1", to: "sw1", label: "ICMP echo" },
      { from: "sw1", to: "r1", label: "ICMP echo", delay: 1 },
    ],
    frame: fr("ICMP echo", "192.168.1.1", "192.168.2.1", "aaa", "ccc"),
    accept: ["r1"],
    mutations: [],
  },
  {
    phase: 4,
    title: "Step 4: R1 routes the packet",
    text: "(i) R1 removes the MAC header and reads Dest IP = 2.1. (ii) It checks the routing table: 192.168.2.0/24 via next hop 3.2. (iii) Its ARP table only has 1.1 = aaa, but it needs the MAC of 3.2, so it must ARP toward R2.",
    packets: [],
    focus: ["r1"],
    route: {
      device: "R1 routing table",
      rows: [
        ["192.168.1.0/24", "directly connected (0/0)"],
        ["192.168.2.0/24", "via 192.168.3.2"],
        ["192.168.3.0/24", "directly connected"],
      ],
      hit: 1,
    },
    mutations: [],
  },
  {
    phase: 4,
    title: "Step 4: R1 sends an ARP request for the next hop",
    text: "R1 asks for 3.2, the next hop, not for 2.1. There is no switch on the 3.0 link, so the broadcast goes straight to R2. R2 learns 3.1 = ddd from the request.",
    packets: [{ from: "r1", to: "r2", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.3.1", "192.168.3.2", "ddd", BCAST),
    accept: ["r2"],
    mutations: [{ t: "arp", dev: "r2", ip: "3.1", mac: "ddd" }],
  },
  {
    phase: 4,
    title: "Step 4: R2 sends the ARP reply",
    text: "R2 answers with the MAC of its 3.2 interface, eee. R1 saves 3.2 = eee. Now R1 knows the MAC of the next hop.",
    packets: [{ from: "r2", to: "r1", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.3.2", "192.168.3.1", "eee", "ddd"),
    accept: ["r1"],
    mutations: [{ t: "arp", dev: "r1", ip: "3.2", mac: "eee" }],
  },
  {
    phase: 5,
    title: "Step 5: R1 forwards the echo to R2",
    text: "The frame goes straight to R2 because there is no switch on the 3.0 link. The IPs are unchanged (1.1 to 2.1), the MACs are new (ddd to eee), and the TTL is reduced by 1.",
    packets: [{ from: "r1", to: "r2", label: "ICMP echo" }],
    frame: fr("ICMP echo", "192.168.1.1", "192.168.2.1", "ddd", "eee", "TTL - 1"),
    accept: ["r2"],
    mutations: [],
  },
  {
    phase: 6,
    title: "Step 6: R2 routes the packet",
    text: "The destination MAC is eee, which is R2's own, so R2 accepts the frame, removes the Ethernet header and reads Dest IP = 2.1. In the routing table 192.168.2.0/24 is directly connected on its 2.100 interface, so no next router is needed. R2 has no MAC for 2.1 yet, so it must ARP for PC3.",
    packets: [],
    focus: ["r2"],
    route: {
      device: "R2 routing table",
      rows: [
        ["192.168.1.0/24", "via 192.168.3.1"],
        ["192.168.2.0/24", "directly connected (0/0, 2.100)"],
        ["192.168.3.0/24", "directly connected"],
      ],
      hit: 1,
    },
    mutations: [],
  },
  {
    phase: 6,
    title: "Step 6: R2 sends an ARP request for PC3",
    text: "R2 broadcasts from its 2.100 interface (MAC nnn). The frame arrives on SW2 port 0/0, so SW2 learns nnn = 0/0.",
    packets: [{ from: "r2", to: "sw2", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.2.100", "192.168.2.1", "nnn", BCAST),
    mutations: [{ t: "mac", sw: "sw2", mac: "nnn", port: "0/0" }],
  },
  {
    phase: 6,
    title: "Step 6: SW2 floods the broadcast",
    text: "SW2 floods the request out of its other ports (0/1 and 0/2). PC4 ignores it. PC3 recognizes its own IP and learns 2.100 = nnn.",
    packets: [
      { from: "sw2", to: "pc3", label: "ARP Request" },
      { from: "sw2", to: "pc4", label: "ARP Request" },
    ],
    frame: fr("ARP request", "192.168.2.100", "192.168.2.1", "nnn", BCAST),
    accept: ["pc3"],
    discard: ["pc4"],
    mutations: [{ t: "arp", dev: "pc3", ip: "2.100", mac: "nnn" }],
  },
  {
    phase: 6,
    title: "Step 6: PC3 sends the ARP reply (unicast)",
    text: "PC3 replies straight to nnn. SW2 receives it on port 0/1 and learns ggg = 0/1.",
    packets: [{ from: "pc3", to: "sw2", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.2.1", "192.168.2.100", "ggg", "nnn"),
    mutations: [{ t: "mac", sw: "sw2", mac: "ggg", port: "0/1" }],
  },
  {
    phase: 6,
    title: "Step 6: the reply reaches R2",
    text: "SW2 forwards the reply only out of port 0/0. R2 saves 2.1 = ggg in its ARP table.",
    packets: [{ from: "sw2", to: "r2", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.2.1", "192.168.2.100", "ggg", "nnn"),
    accept: ["r2"],
    mutations: [{ t: "arp", dev: "r2", ip: "2.1", mac: "ggg" }],
  },
  {
    phase: 7,
    title: "Step 7: R2 forwards the echo to PC3",
    text: "SW2 already knows ggg = 0/1, so it forwards the frame only out of port 0/1. PC4 never sees it. PC3 accepts it because the MAC and the IP both match.",
    packets: [
      { from: "r2", to: "sw2", label: "ICMP echo" },
      { from: "sw2", to: "pc3", label: "ICMP echo", delay: 1 },
    ],
    frame: fr("ICMP echo", "192.168.1.1", "192.168.2.1", "nnn", "ggg", "TTL - 2"),
    accept: ["pc3"],
    mutations: [],
  },
];
const N = STEPS.length;

function applySteps(steps: Step[]): Tables {
  const t = emptyTables();
  for (const s of steps)
    for (const m of s.mutations) {
      if (m.t === "arp") t.arp[m.dev][m.ip] = m.mac;
      else t.mac[m.sw][m.mac] = m.port;
    }
  return t;
}

const toBin = (ip: string) => ip.split(".").map((o) => Number(o).toString(2).padStart(8, "0"));

const PHASES = [
  "1 · AND",
  "2 · ARP gateway",
  "3 · Echo to gateway",
  "4 · R1 routes",
  "5 · R1 to R2",
  "6 · R2 routes",
  "7 · R2 to PC3",
];

/* ───────────────────────── drawing ───────────────────────── */

function Chip({ pkt }: { pkt: Pkt }) {
  const color = pkt.reply ? BLUE : RED;
  const [x0, y0, x1, y1] = edge(pkt.from, pkt.to);
  const w = pkt.label.length * 6 + 18;
  return (
    <g
      className="rp-pkt"
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
      <rect x={-w / 2} y={-11} width={w} height={22} rx={6} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily="ui-monospace, monospace">
        {pkt.label}
      </text>
    </g>
  );
}

const mono = "ui-monospace, monospace";

function Topology({ step, stepKey }: { step: Step | null; stepKey: number }) {
  const linkColor: Record<string, string> = {};
  const active = new Set<NodeId>();
  step?.packets.forEach((p) => {
    linkColor[linkKey(p.from, p.to)] = p.reply ? BLUE : RED;
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
        {/* cables */}
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

        {/* network labels and ports */}
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

        {/* routers and switches */}
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
                <g key={`${stepKey}-${id}`} className="rp-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text x={n.x} y={n.y - 56} textAnchor="middle" fontSize={12} fontWeight={700} fill={GREEN}>
                    ✓ accepts
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* PCs */}
        {(["pc1", "pc2", "pc3", "pc4"] as NodeId[]).map((id) => {
          const n = NODES[id];
          const on = active.has(id);
          const ok = step?.accept?.includes(id);
          const no = step?.discard?.includes(id);
          const stroke = ok ? GREEN : no ? RED : on ? AMBER : "currentColor";
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
                strokeWidth={ok || no || on ? 3.5 : 2}
                style={{ transition: "stroke .4s" }}
              />
              <text x={n.x} y={y + 24} textAnchor="middle" fontSize={14} fontWeight={600} className="fill-foreground">
                {n.name}
              </text>
              <text x={n.x} y={y + 44} textAnchor="middle" fontSize={12} fontFamily={mono} className="fill-foreground">
                {n.mac}
              </text>
              <text x={n.x} y={y + 62} textAnchor="middle" fontSize={12} fontFamily={mono} className="fill-foreground">
                {n.ip}
              </text>
              {(ok || no) && (
                <g key={`${stepKey}-${id}`} className="rp-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text x={n.x} y={y - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill={ok ? GREEN : RED}>
                    {ok ? "✓ accepts" : "✕ discards"}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* moving packets */}
        {step?.packets.map((p, i) => (
          <Chip key={`${stepKey}-${i}`} pkt={p} />
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────── AND panel ───────────────────────── */

function AndPanel() {
  const rows: [string, string, string[]][] = [
    ["Dest IP", "192.168.2.1", toBin("192.168.2.1")],
    ["Mask", MASK, toBin(MASK)],
    ["AND result", "192.168.2.0", toBin("192.168.2.0")],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
      <div className="min-w-[520px] font-mono text-[11px]">
        {rows.map(([label, dotted, octets], r) => (
          <div
            key={label}
            className="rp-fade grid grid-cols-[90px_1fr_110px] items-center gap-2 py-1"
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
          className="rp-fade mt-2 flex flex-wrap items-center gap-2 border-t pt-2 font-sans text-xs"
          style={{ animationDelay: `${1.5 * SLOW}s` }}
        >
          <span className="text-muted-foreground">PC1 own network (192.168.1.1 AND {MASK}):</span>
          <span className="font-mono font-semibold">192.168.1.0</span>
          <Badge variant="secondary" style={{ color: RED }}>
            Different network: remote
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── summary tables ───────────────────────── */

function Journey() {
  const hops: string[][] = [
    ["PC1 to R1", "1.1", "2.1", "aaa", "ccc"],
    ["R1 to R2", "1.1", "2.1", "ddd", "eee"],
    ["R2 to PC3", "1.1", "2.1", "nnn", "ggg"],
  ];
  return (
    <div className="rp-fade overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[480px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {["Hop", "Src IP", "Dest IP", "Src MAC", "Dest MAC"].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hops.map((r) => (
            <tr key={r[0]} className="border-t">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-3 py-2 ${i === 0 ? "font-semibold" : "font-mono"}`}
                  style={i >= 3 ? { color: BLUE } : undefined}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        IP columns never change. MAC columns change at every hop.
      </p>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function RoutedPacketFlow() {
  const [step, setStep] = useState(0); // 0 = not started, 1..N = steps shown
  const [playing, setPlaying] = useState(false);

  const done = step >= N;
  const current = step > 0 ? STEPS[step - 1] : null;
  const view = applySteps(STEPS.slice(0, step));
  const prev = applySteps(STEPS.slice(0, Math.max(0, step - 1)));

  const fresh = new Set<string>();
  if (step > 0) {
    for (const sw of ["sw1", "sw2"] as SwId[])
      for (const m of Object.keys(view.mac[sw]))
        if (prev.mac[sw][m] !== view.mac[sw][m]) fresh.add(`mac:${sw}:${m}`);
    for (const d of ["pc1", "r1", "r2", "pc3"] as ArpDev[])
      for (const ip of Object.keys(view.arp[d]))
        if (prev.arp[d][ip] !== view.arp[d][ip]) fresh.add(`arp:${d}:${ip}`);
  }

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
  const macCards: { id: SwId; name: string }[] = [
    { id: "sw1", name: "SW1" },
    { id: "sw2", name: "SW2" },
  ];

  const Row = ({ k, a, b, isSwitch }: { k: string; a: string; b: string; isSwitch?: boolean }) => {
    const f = fresh.has(k);
    return (
      <p
        className={`mt-1 font-mono text-[11px] ${f ? "rp-fade font-bold" : "text-muted-foreground"}`}
        style={f ? { color: GREEN } : undefined}
      >
        {isSwitch ? `${b} = ${a}` : `${a} = ${b}`}
      </p>
    );
  };

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes rp-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 8% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes rp-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes rp-pop  { from { opacity: 0; } to { opacity: 1; } }
        .rp-pkt  { animation: rp-move ${HOP}s ease-in-out both; }
        .rp-fade { animation: rp-fade ${0.5 * SLOW}s ease-out both; }
        .rp-pop  { animation: rp-pop ${0.4 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rp-pkt, .rp-fade, .rp-pop { animation: none; opacity: 1; } .rp-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Packet flow between networks: forward path</CardTitle>
            <CardDescription className="mt-1">
              A ping from PC1 (192.168.1.1) to PC3 (192.168.2.1) through SW1, R1, R2 and SW2. The IP stays the same end
              to end, the MAC changes at every hop.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Phase pills */}
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

        {/* Explanation */}
        <div className="rounded-xl border bg-background p-4">
          {current ? (
            <div key={step} className="rp-fade flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Step {step} of {N}
              </p>
              <p className="text-sm font-semibold">{current.title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{current.text}</p>

              {current.and && <AndPanel />}

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

              {done && (
                <>
                  <p className="text-xs font-medium" style={{ color: GREEN }}>
                    The echo request reached PC3. The tables below keep what they learned.
                  </p>
                  <Journey />
                </>
              )}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Press Start to follow the ping from PC1 to PC3. All ARP caches and MAC tables begin empty. Watch the Dest
              MAC column: the destination IP is always 2.1, but the frame is addressed to the gateway first, then to R2,
              then to PC3.
            </p>
          )}
        </div>

        {/* Controls */}
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
              {done ? "Replay" : "Start ping"}
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

        {/* Tables */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">ARP table of each device</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {arpCards.map((c) => {
              const rows = Object.entries(view.arp[c.id]);
              return (
                <div key={c.id} className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-semibold">
                    {c.name} <span className="font-mono font-normal text-muted-foreground">{c.mac}</span>
                  </p>
                  {rows.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">empty</p>
                  ) : (
                    rows.map(([ip, mac]) => <Row key={ip} k={`arp:${c.id}:${ip}`} a={ip} b={mac} />)
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">MAC table of each switch</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {macCards.map((c) => {
              const rows = Object.entries(view.mac[c.id]).sort((a, b) => a[1].localeCompare(b[1]));
              return (
                <div key={c.id} className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-semibold">{c.name}</p>
                  {rows.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">empty</p>
                  ) : (
                    rows.map(([mac, port]) => (
                      <Row key={mac} k={`mac:${c.id}:${mac}`} a={mac} b={port} isSwitch />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <ul className="flex flex-col gap-1 pl-5 text-[11px] leading-5 text-muted-foreground marker:text-primary">
          <li>Red packets travel toward the destination. Blue packets are ARP replies.</li>
          <li>
            Layer 2 broadcast: <span className="font-mono">{BCAST}</span>. ARP for a remote host always targets the
            gateway or next hop, never the final destination.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}