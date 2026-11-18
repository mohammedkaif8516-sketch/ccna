"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
 * DhcpServerConfig
 * Company BSOFT: R1 (Cisco IOL router) is the DHCP server for 3 departments
 * (Sales, HR, IT) over one trunk to SW1. Tab 1 builds the config step by step
 * (switch, router, DHCP pools). Tab 2 runs `ip dhcp` on each VPC and animates
 * the DORA exchange through the switch to the router.
 */

const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)
const HOP = 1.1 * SLOW;

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#7048e8";
const mono = "ui-monospace, monospace";

const BCAST_IP = "255.255.255.255";
const BCAST_MAC = "FFFF.FFFF.FFFF";

/* ───────────────────────── company data ───────────────────────── */

type Dept = "sales" | "hr" | "it";

const DEPTS: Record<
  Dept,
  { name: string; vlan: number; net: string; color: string; leaseCmd: string; leaseText: string }
> = {
  sales: { name: "Sales", vlan: 10, net: "192.168.10", color: "#1c7ed6", leaseCmd: "lease 2 0", leaseText: "2 days" },
  hr: { name: "HR", vlan: 20, net: "192.168.20", color: "#d6336c", leaseCmd: "lease 1", leaseText: "1 day" },
  it: { name: "IT", vlan: 30, net: "192.168.30", color: "#0c8599", leaseCmd: "lease 0 8", leaseText: "8 hours" },
};
const DEPT_LIST: Dept[] = ["sales", "hr", "it"];

/* ───────────────────────── topology ───────────────────────── */

type PcId = "pc1" | "pc2" | "pc3" | "pc4" | "pc5" | "pc6";
type NodeId = "r1" | "sw1" | PcId;
type Kind = "pc" | "switch" | "router";
type NodeDef = {
  x: number;
  y: number;
  kind: Kind;
  name: string;
  info: string;
  dept?: Dept;
  port?: string;
  mac?: string;
};

const PCS: PcId[] = ["pc1", "pc2", "pc3", "pc4", "pc5", "pc6"];

const pc = (x: number, name: string, dept: Dept, port: string, mac: string): NodeDef => ({
  x,
  y: 410,
  kind: "pc",
  name,
  dept,
  port,
  mac,
  info: `${name}: a VPCS in ${DEPTS[dept].name} (VLAN ${DEPTS[dept].vlan}). It has no IP until you type: ip dhcp`,
});

const NODES: Record<NodeId, NodeDef> = {
  r1: {
    x: 420,
    y: 75,
    kind: "router",
    name: "R1",
    mac: "aabb.cc00.1000",
    info: "R1 (IOL router): the DHCP server AND the gateway (.1) for all 3 VLANs.",
  },
  sw1: {
    x: 420,
    y: 245,
    kind: "switch",
    name: "SW1",
    info: "SW1 (IOL switch): puts each port in a VLAN and sends all VLANs to R1 on one trunk.",
  },
  pc1: pc(100, "VPC1", "sales", "e0/1", "0050.7966.6801"),
  pc2: pc(230, "VPC2", "sales", "e0/2", "0050.7966.6802"),
  pc3: pc(380, "VPC3", "hr", "e0/3", "0050.7966.6803"),
  pc4: pc(510, "VPC4", "hr", "e1/0", "0050.7966.6804"),
  pc5: pc(645, "VPC5", "it", "e1/1", "0050.7966.6805"),
  pc6: pc(775, "VPC6", "it", "e1/2", "0050.7966.6806"),
};

const LINKS: [NodeId, NodeId][] = [
  ["r1", "sw1"],
  ["sw1", "pc1"],
  ["sw1", "pc2"],
  ["sw1", "pc3"],
  ["sw1", "pc4"],
  ["sw1", "pc5"],
  ["sw1", "pc6"],
];
const linkKey = (a: NodeId, b: NodeId) => [a, b].sort().join("-");
const radius = (id: NodeId) => ({ pc: 40, switch: 34, router: 40 })[NODES[id].kind];

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

const BANDS: Record<Dept, { x: number; w: number }> = {
  sales: { x: 30, w: 270 },
  hr: { x: 310, w: 270 },
  it: { x: 590, w: 240 },
};

/* ───────────────────────── configuration steps ───────────────────────── */

type Pkt = { from: NodeId; to: NodeId; label: string; color: string; delay?: number };
type Line = { p: string; t: string; c?: string; d?: "sw1" | "r1" };
type CfgStep = {
  phase: number;
  ds?: number; // DHCP step number (1 to 7)
  dev: "sw1" | "r1";
  title: string;
  text: string;
  tip?: string;
  lines: Line[];
  packets?: Pkt[];
  focus: NodeId[];
};

const l = (p: string, t: string, c?: string, d?: "sw1" | "r1"): Line => ({ p, t, c, d });

const S = "SW1(config)#";
const SV = "SW1(config-vlan)#";
const SR = "SW1(config-if-range)#";
const SI = "SW1(config-if)#";
const R = "R1(config)#";
const RI = "R1(config-if)#";
const RS = "R1(config-subif)#";
const RD = "R1(dhcp-config)#";

const CFG: CfgStep[] = [
  {
    phase: 0,
    dev: "sw1",
    title: "Switch: create the VLANs",
    text: "One VLAN per department keeps their broadcasts apart.",
    tip: "Each VLAN = its own network = its own DHCP pool.",
    focus: ["sw1"],
    lines: [
      l(S, "vlan 10"),
      l(SV, "name SALES"),
      l(SV, "vlan 20"),
      l(SV, "name HR"),
      l(SV, "vlan 30"),
      l(SV, "name IT"),
      l(SV, "exit"),
    ],
  },
  {
    phase: 0,
    dev: "sw1",
    title: "Switch: put each VPC port in its VLAN",
    text: "Access ports belong to exactly one VLAN. VPCs just plug in.",
    focus: ["sw1", "pc1", "pc2", "pc3", "pc4", "pc5", "pc6"],
    lines: [
      l(S, "interface range e0/1 - 2"),
      l(SR, "switchport mode access"),
      l(SR, "switchport access vlan 10", "Sales"),
      l(SR, "interface range e0/3 , e1/0"),
      l(SR, "switchport mode access"),
      l(SR, "switchport access vlan 20", "HR"),
      l(SR, "interface range e1/1 - 2"),
      l(SR, "switchport mode access"),
      l(SR, "switchport access vlan 30", "IT"),
      l(SR, "exit"),
    ],
  },
  {
    phase: 0,
    dev: "sw1",
    title: "Switch: trunk to the router",
    text: "One cable carries all 3 VLANs to R1. Every frame gets a VLAN tag.",
    tip: "IOL switches need the encapsulation line before 'mode trunk'.",
    focus: ["sw1", "r1"],
    packets: [
      { from: "sw1", to: "r1", label: "VLAN 10", color: DEPTS.sales.color },
      { from: "sw1", to: "r1", label: "VLAN 20", color: DEPTS.hr.color, delay: 0.5 },
      { from: "sw1", to: "r1", label: "VLAN 30", color: DEPTS.it.color, delay: 1 },
    ],
    lines: [
      l(S, "interface e0/0"),
      l(SI, "switchport trunk encapsulation dot1q", "IOL needs this"),
      l(SI, "switchport mode trunk"),
      l(SI, "no shutdown"),
      l(SI, "exit"),
    ],
  },
  {
    phase: 1,
    dev: "r1",
    title: "Router: one gateway per VLAN",
    text: "R1 gets an IP in every VLAN using sub-interfaces. These .1 addresses are the gateways.",
    tip: "This is router-on-a-stick: one cable, many sub-interfaces.",
    focus: ["r1"],
    lines: [
      l(R, "interface e0/0"),
      l(RI, "no shutdown"),
      l(RI, "interface e0/0.10"),
      l(RS, "encapsulation dot1Q 10"),
      l(RS, "ip address 192.168.10.1 255.255.255.0"),
      l(RS, "interface e0/0.20"),
      l(RS, "encapsulation dot1Q 20"),
      l(RS, "ip address 192.168.20.1 255.255.255.0"),
      l(RS, "interface e0/0.30"),
      l(RS, "encapsulation dot1Q 30"),
      l(RS, "ip address 192.168.30.1 255.255.255.0"),
      l(RS, "exit"),
    ],
  },
  {
    phase: 1,
    dev: "r1",
    title: "Router: keep .1 to .10 for fixed devices",
    text: "Tell DHCP never to hand out the gateway, servers or printers' addresses.",
    tip: "Do this BEFORE the pools, or you may get IP conflicts.",
    focus: ["r1"],
    lines: [
      l(R, "ip dhcp excluded-address 192.168.10.1 192.168.10.10"),
      l(R, "ip dhcp excluded-address 192.168.20.1 192.168.20.10"),
      l(R, "ip dhcp excluded-address 192.168.30.1 192.168.30.10"),
    ],
  },
  {
    phase: 2,
    ds: 1,
    dev: "r1",
    title: "Create the DHCP pool",
    text: "A pool is a bucket of IPs plus settings. The name is only a label.",
    focus: ["r1"],
    lines: [l(R, "ip dhcp pool VLAN10", "prompt changes to (dhcp-config)")],
  },
  {
    phase: 2,
    ds: 2,
    dev: "r1",
    title: "Set the network",
    text: "Which network is this pool for? R1 matches it to the interface the request came in on.",
    focus: ["r1"],
    lines: [l(RD, "network 192.168.10.0 255.255.255.0")],
  },
  {
    phase: 2,
    ds: 3,
    dev: "r1",
    title: "Set the default gateway",
    text: "The gateway clients will use. It is R1's own sub-interface IP.",
    tip: "Never a PC's IP. Use the router's address (.1).",
    focus: ["r1"],
    lines: [l(RD, "default-router 192.168.10.1")],
  },
  {
    phase: 2,
    ds: 4,
    dev: "r1",
    title: "Set the DNS server",
    text: "Where clients look up names like google.com.",
    focus: ["r1"],
    lines: [l(RD, "dns-server 8.8.8.8", "or your company DNS IP")],
  },
  {
    phase: 2,
    ds: 5,
    dev: "r1",
    title: "Set the company domain",
    text: "The domain name clients receive.",
    focus: ["r1"],
    lines: [l(RD, "domain-name bsoft.com")],
  },
  {
    phase: 2,
    ds: 6,
    dev: "r1",
    title: "Set the lease time",
    text: "How long a client may keep the IP. Format: days hours minutes.",
    tip: "'lease infinite' means it never expires.",
    focus: ["r1"],
    lines: [l(RD, "lease 2 0", "2 days 0 hours"), l(RD, "exit")],
  },
  {
    phase: 3,
    ds: 7,
    dev: "r1",
    title: "Repeat for HR and IT",
    text: "Same 6 steps per network. Only the numbers and names change.",
    focus: ["r1"],
    lines: [
      l(R, "ip dhcp pool VLAN20"),
      l(RD, "network 192.168.20.0 255.255.255.0"),
      l(RD, "default-router 192.168.20.1"),
      l(RD, "dns-server 8.8.8.8"),
      l(RD, "domain-name bsoft.com"),
      l(RD, "lease 1", "1 day"),
      l(RD, "exit"),
      l(R, "ip dhcp pool VLAN30"),
      l(RD, "network 192.168.30.0 255.255.255.0"),
      l(RD, "default-router 192.168.30.1"),
      l(RD, "dns-server 8.8.8.8"),
      l(RD, "domain-name bsoft.com"),
      l(RD, "lease 0 8", "8 hours"),
      l(RD, "exit"),
    ],
  },
  {
    phase: 4,
    dev: "r1",
    title: "Save and verify",
    text: "Check the pools, then go to the Test tab and type ip dhcp on every VPC.",
    tip: "VPCS does not ask for DHCP by itself. Run 'ip dhcp' on each one.",
    focus: ["r1", "sw1"],
    lines: [
      l("R1#", "write memory", "save"),
      l("R1#", "show ip dhcp pool", "pools and usage"),
      l("R1#", "show ip dhcp binding", "who has which IP"),
      l("R1#", "show ip dhcp conflict", "IPs already in use"),
      l("R1#", "show ip dhcp server statistics", "D-O-R-A counters"),
      l("SW1#", "show vlan brief", "ports in right VLAN?", "sw1"),
      l("SW1#", "show interfaces trunk", "trunk up?", "sw1"),
    ],
  },
];
const N = CFG.length;

const PHASES = ["1 · Switch", "2 · Router", "3 · DHCP pool", "4 · Repeat", "5 · Verify"];

const POOL_ROWS: [string, string, number][] = [
  ["pool", "VLAN10", 6],
  ["network", "192.168.10.0 /24", 7],
  ["default-router", "192.168.10.1", 8],
  ["dns-server", "8.8.8.8", 9],
  ["domain-name", "bsoft.com", 10],
  ["lease", "2 days", 11],
];

/* ───────────────────────── test (DORA) stages ───────────────────────── */

type Stage = {
  title: string;
  text: string;
  cast: string;
  packets: Pkt[];
  accept: NodeId[];
  drop: NodeId[];
  frame: [string, string][];
  vpcs: string;
  callout?: string;
  offer?: [string, string][];
};

const fr = (
  msg: string, sp: string, dp: string, sip: string, dip: string, smac: string, dmac: string,
): [string, string][] => [
  ["Message", msg],
  ["Src UDP", sp],
  ["Dst UDP", dp],
  ["Src IP", sip],
  ["Dst IP", dip],
  ["Src MAC", smac],
  ["Dst MAC", dmac],
];

function dhcpItems(pcId: PcId, ip: string): [string, string][] {
  const d = DEPTS[NODES[pcId].dept!];
  return [
    ["IP address", ip],
    ["Mask", "255.255.255.0"],
    ["Gateway", `${d.net}.1`],
    ["DNS", "8.8.8.8"],
    ["Domain", "bsoft.com"],
    ["Lease", d.leaseText],
  ];
}

function buildStages(pcId: PcId, ip: string): Stage[] {
  const n = NODES[pcId];
  const d = DEPTS[n.dept!];
  const peer = PCS.find((p) => p !== pcId && NODES[p].dept === n.dept)!;
  const v = d.vlan;
  const gw = `${d.net}.1`;
  const rmac = NODES.r1.mac!;
  const mac = n.mac!;

  const up = (label: string, color: string): Pkt[] => [
    { from: pcId, to: "sw1", label, color },
    { from: "sw1", to: "r1", label: `${label}·V${v}`, color, delay: 1 },
    { from: "sw1", to: peer, label, color, delay: 1 },
  ];
  const down = (label: string, color: string): Pkt[] => [
    { from: "r1", to: "sw1", label: `${label}·V${v}`, color },
    { from: "sw1", to: pcId, label, color, delay: 1 },
  ];

  return [
    {
      title: "D: Discover",
      text: `${n.name} has no IP, so it broadcasts. SW1 keeps it inside VLAN ${v} (${NODES[peer].name} ignores it) and sends a tagged copy up the trunk.`,
      cast: "Broadcast",
      packets: up("Discover", BLUE),
      accept: ["r1"],
      drop: [peer],
      frame: fr("Discover (1)", "68", "67", "0.0.0.0", BCAST_IP, mac, BCAST_MAC),
      vpcs: "D",
      callout: `Arrived on e0/0.${v} → R1 uses pool VLAN${v} (${d.net}.0/24)`,
    },
    {
      title: "O: Offer",
      text: `R1 picks the first free IP in pool VLAN${v} and offers it with the settings below. Only ${n.name} receives it.`,
      cast: "Sent to client MAC",
      packets: down("Offer", GREEN),
      accept: [pcId],
      drop: [],
      frame: fr("Offer (2)", "67", "68", gw, BCAST_IP, rmac, mac),
      vpcs: "DO",
      offer: dhcpItems(pcId, ip),
    },
    {
      title: "R: Request",
      text: `${n.name} says "I'll take ${ip}!" It is still a broadcast, so any other DHCP server knows it was not chosen.`,
      cast: "Broadcast",
      packets: up("Request", AMBER),
      accept: ["r1"],
      drop: [peer],
      frame: fr("Request (3)", "68", "67", "0.0.0.0", BCAST_IP, mac, BCAST_MAC),
      vpcs: "DOR",
    },
    {
      title: "A: Acknowledgment",
      text: `R1 confirms and saves the binding ${ip} = ${mac}. The lease clock starts (${d.leaseText}).`,
      cast: "Sent to client MAC",
      packets: down("Ack", PURPLE),
      accept: [pcId],
      drop: [],
      frame: fr("Ack (4)", "67", "68", gw, BCAST_IP, rmac, mac),
      vpcs: `DORA IP ${ip}/24 GW ${gw}`,
    },
  ];
}

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
}

/* ───────────────────────── drawing ───────────────────────── */

type View = { packets: Pkt[]; focus: NodeId[]; accept: NodeId[]; drop: NodeId[] };

function Chip({ pkt }: { pkt: Pkt }) {
  const [x0, y0, x1, y1] = edge(pkt.from, pkt.to);
  const w = pkt.label.length * 6.4 + 18;
  return (
    <g
      className="dc-pkt"
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

function Topology({
  view, stepKey, showGw, trunkOn, dhcp, ips, sel, onPick,
}: {
  view: View;
  stepKey: string;
  showGw: boolean;
  trunkOn: boolean;
  dhcp: "off" | "building" | "on";
  ips: Partial<Record<PcId, string>>;
  sel: NodeId | null;
  onPick: (id: NodeId) => void;
}) {
  const linkColor: Record<string, string> = {};
  const active = new Set<NodeId>();
  view.packets.forEach((p) => {
    linkColor[linkKey(p.from, p.to)] = p.color;
    active.add(p.from);
    active.add(p.to);
  });
  view.focus.forEach((f) => active.add(f));

  const maxDelay = Math.max(0, ...view.packets.map((p) => p.delay ?? 0));
  const markerDelay = view.packets.length > 0 ? (maxDelay + 1) * HOP : 0;
  const halo = { paintOrder: "stroke" as const, strokeWidth: 3, strokeLinejoin: "round" as const };

  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-3">
      <svg
        viewBox="0 0 840 510"
        className="mx-auto min-w-[680px] max-w-[880px]"
        role="img"
        aria-label="Router R1 connected by a trunk to switch SW1, with six VPCs in Sales, HR and IT VLANs"
      >
        {/* department bands */}
        {DEPT_LIST.map((d) => {
          const b = BANDS[d];
          const D = DEPTS[d];
          return (
            <g key={d}>
              <rect
                x={b.x}
                y={335}
                width={b.w}
                height={160}
                rx={12}
                fill={D.color}
                fillOpacity={0.07}
                stroke={D.color}
                strokeOpacity={0.6}
                strokeDasharray="5 4"
              />
              <text x={b.x + b.w / 2} y={486} textAnchor="middle" fontSize={11} fontFamily={mono} fontWeight={600} fill={D.color}>
                {D.name} · VLAN {D.vlan} · {D.net}.0/24
              </text>
            </g>
          );
        })}

        {/* links */}
        {LINKS.map(([a, b]) => {
          const k = linkKey(a, b);
          const c = linkColor[k];
          const [x0, y0, x1, y1] = edge(a, b);
          const trunk = k === "r1-sw1";
          return (
            <line
              key={k}
              x1={x0} y1={y0} x2={x1} y2={y1}
              stroke={c ?? "currentColor"}
              strokeOpacity={c ? 1 : 0.45}
              strokeWidth={c ? 3 : trunk && trunkOn ? 4 : 2}
              style={{ transition: "stroke .4s" }}
            />
          );
        })}

        {/* trunk labels */}
        <text x={430} y={132} fontSize={10} fontFamily={mono} className="fill-foreground">e0/0</text>
        <text x={430} y={206} fontSize={10} fontFamily={mono} className="fill-foreground">e0/0</text>
        {trunkOn && (
          <text x={412} y={168} textAnchor="end" fontSize={11} fontFamily={mono} fontWeight={700} fill={AMBER} className="dc-pop">
            TRUNK · VLAN 10,20,30
          </text>
        )}

        {/* PC port labels */}
        {PCS.map((id) => {
          const [x0, y0, x1, y1] = edge("sw1", id);
          return (
            <text
              key={id}
              x={x1 + (x0 - x1) * 0.2}
              y={y1 + (y0 - y1) * 0.2}
              textAnchor="middle"
              fontSize={10}
              fontFamily={mono}
              className="fill-foreground stroke-background"
              style={halo}
            >
              {NODES[id].port}
            </text>
          );
        })}

        {/* router side text */}
        {showGw &&
          DEPT_LIST.map((d, i) => (
            <text
              key={d}
              x={490}
              y={62 + i * 18}
              fontSize={11}
              fontFamily={mono}
              fontWeight={600}
              fill={DEPTS[d].color}
              className="dc-pop"
            >
              e0/0.{DEPTS[d].vlan} {DEPTS[d].net}.1
            </text>
          ))}

        {/* nodes */}
        {(Object.keys(NODES) as NodeId[]).map((id) => {
          const n = NODES[id];
          const on = active.has(id);
          const ok = view.accept.includes(id);
          const no = view.drop.includes(id);
          const stroke = ok ? GREEN : no ? RED : on ? AMBER : "currentColor";
          const w = ok || no || on ? 3.5 : 2.2;
          const ip = id.startsWith("pc") ? ips[id as PcId] : undefined;

          return (
            <g key={id} onClick={() => onPick(id)} style={{ cursor: "pointer" }}>
              <rect x={n.x - 56} y={n.y - 44} width={112} height={n.kind === "pc" ? 100 : 88} fill="transparent" />
              <g transform={`translate(${n.x} ${n.y})`}>
                <Icon kind={n.kind} stroke={stroke} w={w} />
              </g>
              {sel === id && (
                <circle cx={n.x} cy={n.y} r={n.kind === "switch" ? 56 : 50} fill="none" stroke={BLUE} strokeDasharray="5 5" strokeWidth={1.5} />
              )}

              {n.kind === "pc" && (
                <g>
                  <text x={n.x} y={n.y + 44} textAnchor="middle" fontSize={13} fontWeight={600} className="fill-foreground">
                    {n.name}
                  </text>
                  <text
                    key={`${id}-${ip ?? "none"}`}
                    x={n.x}
                    y={n.y + 60}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily={mono}
                    fontWeight={ip ? 700 : 400}
                    fill={ip ? GREEN : undefined}
                    className={ip ? "dc-pop" : "fill-foreground"}
                    opacity={ip ? 1 : 0.6}
                  >
                    {ip ?? "no IP"}
                  </text>
                </g>
              )}

              {id === "r1" && (
                <g>
                  <text x={n.x - 58} y={n.y - 8} textAnchor="end" fontSize={14} fontWeight={600} className="fill-foreground">R1</text>
                  <text x={n.x - 58} y={n.y + 8} textAnchor="end" fontSize={11} fontFamily={mono} className="fill-foreground">{n.mac}</text>
                  <text
                    x={n.x - 58}
                    y={n.y + 26}
                    textAnchor="end"
                    fontSize={12}
                    fontWeight={700}
                    fill={dhcp === "on" ? GREEN : dhcp === "building" ? AMBER : undefined}
                    className={dhcp === "off" ? "fill-foreground" : ""}
                    opacity={dhcp === "off" ? 0.6 : 1}
                  >
                    {dhcp === "on" ? "✓ DHCP server" : dhcp === "building" ? "… building pools" : "not a DHCP server yet"}
                  </text>
                </g>
              )}

              {id === "sw1" && (
                <text x={n.x + 58} y={n.y + 5} fontSize={14} fontWeight={600} className="fill-foreground">SW1</text>
              )}

              {(ok || no) && (
                <g key={`${stepKey}-${id}`} className="dc-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text
                    x={n.x}
                    y={n.y - (n.kind === "router" ? 32 : 36) - 6}
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

        {view.packets.map((p, i) => (
          <Chip key={`${stepKey}-${i}`} pkt={p} />
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────── small panels ───────────────────────── */

function Check({ ok, hot, text }: { ok: boolean; hot: boolean; text: string }) {
  return (
    <p
      className={`mt-1 font-mono text-[11px] ${hot ? "font-bold" : ok ? "" : "text-muted-foreground/60"}`}
      style={hot ? { color: AMBER } : ok ? { color: GREEN } : undefined}
    >
      {ok ? "✓" : "○"} {text}
    </p>
  );
}

function SimpleTable({ head, rows, colorFrom }: { head: string[]; rows: string[][]; colorFrom?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[480px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t">
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

function FrameTable({ frame }: { frame: [string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[620px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {frame.map(([h]) => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            {frame.map(([h, v], i) => (
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
  );
}

function Chips({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([k, v]) => (
        <span key={k} className="rounded-full border px-3 py-1 text-[11px]">
          <span className="text-muted-foreground">{k}: </span>
          <span className="font-mono font-semibold" style={{ color: GREEN }}>{v}</span>
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function DhcpServerConfig() {
  const [mode, setMode] = useState<"cfg" | "test">("cfg");
  const [step, setStep] = useState(0); // config: 0 = not started
  const [playing, setPlaying] = useState(false);
  const [termDev, setTermDev] = useState<"sw1" | "r1" | null>(null);
  const [sel, setSel] = useState<NodeId | null>(null);
  const [selPc, setSelPc] = useState<PcId>("pc1");
  const [run, setRun] = useState<{ pc: PcId; ip: string; stage: number } | null>(null);
  const [leases, setLeases] = useState<Partial<Record<PcId, string>>>({});
  const termRef = useRef<HTMLDivElement>(null);

  const current = step > 0 ? CFG[step - 1] : null;
  const dev = termDev ?? current?.dev ?? "r1";
  const running = !!run && run.stage <= 4;

  /* auto-play */
  useEffect(() => {
    if (!playing) return;
    if (mode === "cfg") {
      if (step >= N) {
        setPlaying(false);
        return;
      }
      const t = setTimeout(() => {
        setStep((s) => Math.min(N, s + 1));
        setTermDev(null);
      }, 6500);
      return () => clearTimeout(t);
    }
    if (!run || run.stage >= 5) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setRun((r) => (r ? { ...r, stage: Math.min(5, r.stage + 1) } : r)), 6000);
    return () => clearTimeout(t);
  }, [playing, mode, step, run]);

  /* save the lease once DORA is done */
  useEffect(() => {
    if (run && run.stage >= 5) {
      setLeases((m) => (m[run.pc] === run.ip ? m : { ...m, [run.pc]: run.ip }));
    }
  }, [run]);

  /* keep the terminal scrolled to the newest line */
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [step, termDev, mode]);

  const go = (n: number) => {
    setStep(n);
    setTermDev(null);
  };

  const start = () => {
    const d = NODES[selPc].dept!;
    const count = PCS.filter((p) => NODES[p].dept === d && leases[p]).length;
    const ip = leases[selPc] ?? `${DEPTS[d].net}.${11 + count}`;
    setRun({ pc: selPc, ip, stage: 1 });
    setPlaying(true);
  };

  const pick = (id: NodeId) => {
    setSel(id);
    if (mode === "test" && id.startsWith("pc") && !running) setSelPc(id as PcId);
  };

  /* ───── view for the topology ───── */
  const stages = run ? buildStages(run.pc, run.ip) : [];
  const stage = run && run.stage <= 4 ? stages[run.stage - 1] : null;

  const view: View =
    mode === "cfg"
      ? { packets: current?.packets ?? [], focus: current?.focus ?? [], accept: [], drop: [] }
      : {
          packets: stage?.packets ?? [],
          focus: run && run.stage >= 5 ? [run.pc] : !run ? [selPc] : [],
          accept: stage?.accept ?? [],
          drop: stage?.drop ?? [],
        };

  const ips: Partial<Record<PcId, string>> = {};
  if (mode === "test") {
    PCS.forEach((p) => {
      if (leases[p]) ips[p] = leases[p];
    });
    if (run && run.stage >= 5) ips[run.pc] = run.ip;
  }

  const dhcp: "off" | "building" | "on" =
    mode === "test" || step >= 12 ? "on" : step >= 6 ? "building" : "off";
  const showGw = mode === "test" || step >= 4;
  const trunkOn = mode === "test" || step >= 3;
  const stepKey = mode === "cfg" ? `c${step}` : `t${run?.pc ?? "x"}${run?.stage ?? 0}`;

  const curPhase = current ? current.phase : -1;

  /* ───── terminal lines ───── */
  const termLines = CFG.slice(0, step).flatMap((s, si) =>
    s.lines
      .filter((ln) => (ln.d ?? s.dev) === dev)
      .map((ln, li) => ({ ln, si, li, fresh: si === step - 1 })),
  );

  /* ───── bindings table ───── */
  const bound: Partial<Record<PcId, string>> = { ...leases };
  if (run && run.stage >= 4) bound[run.pc] = run.ip;
  const boundRows = PCS.filter((p) => bound[p]).map((p) => [
    bound[p]!,
    NODES[p].mac!,
    DEPTS[NODES[p].dept!].leaseText,
    "Automatic",
  ]);

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes dc-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 8% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes dc-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes dc-pop  { from { opacity: 0; } to { opacity: 1; } }
        .dc-pkt  { animation: dc-move ${HOP}s ease-in-out both; }
        .dc-fade { animation: dc-fade ${0.5 * SLOW}s ease-out both; }
        .dc-pop  { animation: dc-pop ${0.4 * SLOW}s ease-out both; }
        .dc-line { animation: dc-fade 0.5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .dc-pkt, .dc-fade, .dc-pop, .dc-line { animation: none; opacity: 1; } .dc-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">BSOFT: configure a Cisco router as a DHCP server</CardTitle>
            <CardDescription className="mt-1">
              R1 hands out IPs to Sales, HR and IT. Build the config step by step, then run{" "}
              <span className="font-mono">ip dhcp</span> on each VPC and watch DORA happen.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* mode tabs */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "cfg" ? "default" : "outline"}
            onClick={() => {
              setMode("cfg");
              setPlaying(false);
            }}
          >
            1 · Configure
          </Button>
          <Button
            size="sm"
            variant={mode === "test" ? "default" : "outline"}
            onClick={() => {
              setMode("test");
              setPlaying(false);
            }}
          >
            2 · Test on VPCs
          </Button>
        </div>

        {mode === "cfg" && (
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
        )}

        <Topology
          view={view}
          stepKey={stepKey}
          showGw={showGw}
          trunkOn={trunkOn}
          dhcp={dhcp}
          ips={ips}
          sel={mode === "test" && !sel ? selPc : sel}
          onPick={pick}
        />

        <p className="-mt-2 text-[11px] text-muted-foreground">
          {sel
            ? `ℹ️ ${NODES[sel].info}`
            : mode === "test"
              ? "👆 Tap a VPC to choose it, then run ip dhcp."
              : "👆 Tap a device to learn what it is."}
        </p>

        {/* ───────────── CONFIG MODE ───────────── */}
        {mode === "cfg" && (
          <>
            <div className="rounded-xl border bg-background p-4">
              {current ? (
                <div key={step} className="dc-fade flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Step {step} of {N}
                    </p>
                    {current.ds && <Badge variant="outline">DHCP step {current.ds} of 7</Badge>}
                  </div>
                  <p className="text-sm font-semibold">{current.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{current.text}</p>
                  {current.tip && <p className="rounded-lg bg-muted/40 px-3 py-2 text-[11px]">💡 {current.tip}</p>}

                  {step === N && (
                    <div className="dc-fade flex flex-col gap-3">
                      <p className="text-xs font-medium" style={{ color: GREEN }}>
                        R1 is now a DHCP server for 3 networks.
                      </p>
                      <SimpleTable
                        head={["Pool", "Network", "Gateway", "Lease", "Excluded"]}
                        colorFrom={2}
                        rows={DEPT_LIST.map((d) => [
                          `VLAN${DEPTS[d].vlan}`,
                          `${DEPTS[d].net}.0/24`,
                          `${DEPTS[d].net}.1`,
                          DEPTS[d].leaseText,
                          `.1 to .10`,
                        ])}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs leading-5 text-muted-foreground">
                  Press Start. Each step adds real IOS commands to the terminal below, and the checklist fills as you
                  go.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={step <= 1} onClick={() => { setPlaying(false); go(Math.max(1, step - 1)); }}>
                Back
              </Button>
              {step === 0 || step >= N ? (
                <Button size="sm" onClick={() => { setPlaying(false); go(1); }}>
                  {step >= N ? "Replay" : "Start"}
                </Button>
              ) : (
                <Button size="sm" onClick={() => { setPlaying(false); go(Math.min(N, step + 1)); }}>
                  Next step
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={step === 0 || step >= N} onClick={() => setPlaying((p) => !p)}>
                {playing ? "Pause" : "Auto-play"}
              </Button>
              <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => { setPlaying(false); go(0); }}>
                Reset
              </Button>
            </div>

            {/* terminal */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Terminal (IOL console)</p>
                <div className="flex gap-1">
                  {(["r1", "sw1"] as const).map((d) => (
                    <Button key={d} size="sm" variant={dev === d ? "default" : "outline"} className="h-7 px-3 text-xs" onClick={() => setTermDev(d)}>
                      {d.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <div
                ref={termRef}
                className="max-h-72 overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-[11px] leading-5 text-zinc-100"
              >
                {termLines.length === 0 && (
                  <p className="text-zinc-500">{dev.toUpperCase()} has no config yet. Press Start.</p>
                )}
                {termLines.map(({ ln, si, li, fresh }) => (
                  <div
                    key={`${si}-${li}`}
                    className={`whitespace-pre ${fresh ? "dc-line" : ""}`}
                    style={fresh ? { animationDelay: `${li * 0.3}s` } : undefined}
                  >
                    <span className="text-zinc-500">{ln.p} </span>
                    <span className={fresh ? "font-semibold text-amber-300" : ""}>{ln.t}</span>
                    {ln.c && <span className="text-emerald-400">{"   ! " + ln.c}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* checklist cards */}
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">SW1</p>
                <Check ok={step >= 1} hot={step === 1} text="VLANs 10, 20, 30" />
                <Check ok={step >= 2} hot={step === 2} text="Access ports" />
                <Check ok={step >= 3} hot={step === 3} text="Trunk to R1" />
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">R1 basics</p>
                <Check ok={step >= 4} hot={step === 4} text="Sub-interfaces (.1)" />
                <Check ok={step >= 5} hot={step === 5} text="Excluded .1 to .10" />
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">Pool VLAN10</p>
                {POOL_ROWS.map(([k, v, thr]) => (
                  <Check key={k} ok={step >= thr} hot={step === thr} text={`${k} ${v}`} />
                ))}
                <Check ok={step >= 12} hot={step === 12} text="VLAN20 + VLAN30 pools" />
              </div>
            </div>
          </>
        )}

        {/* ───────────── TEST MODE ───────────── */}
        {mode === "test" && (
          <>
            <div className="rounded-xl border bg-background p-4">
              {!run && (
                <p className="text-xs leading-5 text-muted-foreground">
                  Selected: <b>{NODES[selPc].name}</b> ({DEPTS[NODES[selPc].dept!].name}, VLAN{" "}
                  {DEPTS[NODES[selPc].dept!].vlan}). Press the button to type <span className="font-mono">ip dhcp</span>{" "}
                  on it. Try one PC from each department.
                </p>
              )}

              {run && stage && (
                <div key={stepKey} className="dc-fade flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {NODES[run.pc].name} · message {run.stage} of 4
                    </p>
                    <Badge variant="outline">{stage.cast}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{stage.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{stage.text}</p>
                  {stage.callout && (
                    <p className="rounded-lg border px-3 py-2 font-mono text-[11px]" style={{ color: AMBER, borderColor: AMBER }}>
                      🔎 {stage.callout}
                    </p>
                  )}
                  {stage.offer && <Chips items={stage.offer} />}
                  <FrameTable frame={stage.frame} />
                </div>
              )}

              {run && run.stage >= 5 && (
                <div key={stepKey} className="dc-fade flex flex-col gap-3">
                  <p className="text-sm font-semibold" style={{ color: GREEN }}>
                    ✓ {NODES[run.pc].name} is configured
                  </p>
                  <Chips items={dhcpItems(run.pc, run.ip)} />
                  <p className="rounded-lg bg-muted/40 px-3 py-2 text-[11px]">
                    💡 Next: <span className="font-mono">ping {DEPTS[NODES[run.pc].dept!].net}.1</span> to test the
                    gateway, then run <span className="font-mono">ip dhcp</span> on the other VPCs.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={running} onClick={start}>
                Run “ip dhcp” on {NODES[selPc].name}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!run || run.stage >= 5}
                onClick={() => {
                  setPlaying(false);
                  setRun((r) => (r ? { ...r, stage: Math.min(5, r.stage + 1) } : r));
                }}
              >
                Next
              </Button>
              <Button size="sm" variant="outline" disabled={!run || run.stage >= 5} onClick={() => setPlaying((p) => !p)}>
                {playing ? "Pause" : "Auto-play"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!run && Object.keys(leases).length === 0}
                onClick={() => {
                  setPlaying(false);
                  setRun(null);
                  setLeases({});
                }}
              >
                Release all
              </Button>
            </div>

            {/* VPCS console */}
            {run && (
              <div className="rounded-lg bg-zinc-950 p-3 font-mono text-[11px] leading-5 text-zinc-100">
                <div>
                  <span className="text-zinc-500">{NODES[run.pc].name}&gt; </span>
                  <span className="font-semibold text-amber-300">ip dhcp</span>
                </div>
                <div key={run.stage} className="dc-line text-emerald-300">
                  {run.stage >= 4 ? buildStages(run.pc, run.ip)[3].vpcs : buildStages(run.pc, run.ip)[run.stage - 1].vpcs}
                </div>
              </div>
            )}

            {/* bindings */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                R1# show ip dhcp binding
              </p>
              {boundRows.length === 0 ? (
                <p className="rounded-lg border bg-background p-3 text-[11px] text-muted-foreground">
                  (empty) No VPC has an IP yet.
                </p>
              ) : (
                <SimpleTable head={["IP address", "Client MAC", "Lease", "Type"]} rows={boundRows} />
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {DEPT_LIST.map((d) => {
                  const used = PCS.filter((p) => NODES[p].dept === d && bound[p]).length;
                  return (
                    <span
                      key={d}
                      className="rounded-full border px-3 py-1 text-[11px]"
                      style={{ borderColor: DEPTS[d].color, color: DEPTS[d].color }}
                    >
                      pool VLAN{DEPTS[d].vlan}: {used} leased
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ───────────── always visible ───────────── */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Command cheat sheet</p>
          <SimpleTable
            head={["On", "Command", "Tells you"]}
            rows={[
              ["R1", "show ip dhcp pool", "Pools and how many IPs used"],
              ["R1", "show ip dhcp binding", "Who got which IP"],
              ["R1", "show ip dhcp conflict", "IPs found already in use"],
              ["R1", "show ip dhcp server statistics", "D-O-R-A message counters"],
              ["R1", "show ip interface brief", "Are the sub-interfaces up?"],
              ["SW1", "show vlan brief", "Are ports in the right VLAN?"],
              ["SW1", "show interfaces trunk", "Is the trunk up?"],
              ["VPCS", "ip dhcp", "Ask for an IP (run on every VPC)"],
              ["VPCS", "show ip", "See the IP you got"],
              ["VPCS", "ip dhcp -r", "Release the IP"],
            ]}
          />
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="mb-2 text-xs font-semibold">Using a Layer 3 switch (MLS) instead of a router?</p>
          <p className="mb-2 text-[11px] text-muted-foreground">
            No sub-interfaces. Each VLAN gets an SVI. The DHCP pool commands stay exactly the same.
          </p>
          <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 font-mono text-[11px] leading-5 text-zinc-100">
{`MLS(config)# ip routing
MLS(config)# interface vlan 10
MLS(config-if)# ip address 192.168.10.1 255.255.255.0
MLS(config-if)# no shutdown
MLS(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.10
MLS(config)# ip dhcp pool VLAN10
   ... same network / default-router / dns / domain / lease`}
          </pre>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Why a VPC gets no IP</p>
          <ul className="flex flex-col gap-1 pl-5 text-[11px] leading-5 text-muted-foreground marker:text-primary">
            <li>You forgot to type <span className="font-mono">ip dhcp</span> on that VPC.</li>
            <li>Trunk or <span className="font-mono">no shutdown</span> missing, so R1 never sees the Discover.</li>
            <li>VPC port is in the wrong VLAN, so it gets the wrong pool (or none).</li>
            <li>
              <span className="font-mono">network</span> does not match the sub-interface network, so R1 cannot pick
              the pool.
            </li>
            <li>Pool is full, or the excluded range removed too many addresses.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default DhcpServerConfig;