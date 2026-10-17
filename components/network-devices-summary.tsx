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
 * NetworkDevicesTrafficFlow  (CCNA Topic 04)
 *   1 Core idea            : what does each device look at?
 *   2 Frame flow           : same frame through a hub, a switch and a router
 *   3 Inside a switch      : CAM table, forwarding decisions, manageable vs not
 *   4 Communication types  : unicast, multicast, broadcast, anycast
 *   5 Loops & small things : STP on/off, CSMA/CD vs CSMA/CA, ASIC
 *   6 Common mistakes      : wrong belief on the front, the truth on the back
 *   7 Interview prep       : 30-second answer and the thirteen usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";
const DOMAIN_COLORS = [AMBER, BLUE, GREEN, PURPLE];
const mono = "ui-monospace, monospace";
const HOP = 1.4; // seconds one chip takes to cross one cable
const BCAST_MAC = "ffff.ffff.ffff";

const TABS = [
  { id: "core", label: "1 · Core idea" },
  { id: "flow", label: "2 · Frame flow" },
  { id: "switch", label: "3 · Inside a switch" },
  { id: "comm", label: "4 · Communication types" },
  { id: "stp", label: "5 · Loops & small things" },
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

function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function SimpleTable({ head, rows, hit }: { head: string[]; rows: string[][]; hit?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[420px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t" style={hit === i ? { color: GREEN, fontWeight: 600 } : undefined}>
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 font-mono">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── 1 · core idea ───────────────────────── */

const DEVICES = [
  {
    id: "hub",
    name: "Hub",
    layer: "Layer 1 · Physical",
    looks: "Nothing. It cannot make decisions.",
    duplex: "Half",
    domains: "1 broadcast · 1 collision (all ports together)",
    used: "No. Legacy lab gear only.",
    reads: [false, false, false],
    verb: "repeats",
    talkers: "Only 1 device can talk at a time",
  },
  {
    id: "sw2",
    name: "Switch (L2)",
    layer: "Layer 2 · Data Link",
    looks: "Destination MAC address",
    duplex: "Full, per port",
    domains: "1 broadcast (by default) · 1 collision per port",
    used: "Everywhere",
    reads: [false, true, false],
    verb: "forwards",
    talkers: "Many devices can talk at once",
  },
  {
    id: "sw3",
    name: "Switch (L3 / MLS)",
    layer: "Layer 3 · Network",
    looks: "MAC, and IP when routing is on",
    duplex: "Full, per port",
    domains: "Like an L2 switch, plus routing between VLANs",
    used: "Enterprise core and distribution",
    reads: [false, true, true],
    verb: "forwards and routes",
    talkers: "Many devices can talk at once",
  },
  {
    id: "router",
    name: "Router",
    layer: "Layer 3 · Network",
    looks: "Destination IP address",
    duplex: "Full, per port",
    domains: "1 broadcast · 1 collision per interface",
    used: "Everywhere, at the edge and in the core",
    reads: [false, false, true],
    verb: "routes",
    talkers: "Many devices can talk at once",
  },
] as const;

const HEADERS = [
  { l: "Layer 1", t: "Bits on the wire" },
  { l: "Layer 2", t: "Ethernet header: source MAC, destination MAC" },
  { l: "Layer 3", t: "IP header: source IP, destination IP, TTL" },
];

function CoreSection() {
  const [id, setId] = useState<(typeof DEVICES)[number]["id"]>("hub");
  const d = DEVICES.find((x) => x.id === id)!;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">One question defines every device</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          When a frame or packet arrives, what does the device look at before deciding where to send it? That single
          answer separates hubs, switches and routers. Tables, domains and duplex all follow from it.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Badge variant="secondary">Hub repeats</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="secondary">Switch forwards</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="secondary">Router routes</Badge>
          <span className="text-[11px] font-normal text-muted-foreground">Each one sees more of the packet than the one before.</span>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Pick a device</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEVICES.map((x) => (
            <Pick key={x.id} active={id === x.id} onClick={() => setId(x.id)}>{x.name}</Pick>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">What this device reads in an arriving frame:</p>
          {HEADERS.map((h, i) => {
            const on = d.reads[i];
            const repeated = d.id === "hub" && i === 0;
            return (
              <div
                key={h.l}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-all"
                style={{
                  borderColor: on ? GREEN : repeated ? AMBER : undefined,
                  background: on ? `${GREEN}14` : repeated ? `${AMBER}14` : undefined,
                  opacity: on || repeated ? 1 : 0.5,
                }}
              >
                <span className="w-14 font-mono font-bold">{h.l}</span>
                <span className="flex-1">{h.t}</span>
                <span className="font-semibold" style={{ color: on ? GREEN : repeated ? AMBER : undefined }}>
                  {on ? "reads, decides" : repeated ? "just repeats it" : "ignores"}
                </span>
              </div>
            );
          })}
        </div>

        <div key={id} className="n4-fade mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ["Layer", d.layer],
            ["Looks at", d.looks],
            ["Duplex", d.duplex],
            ["Domains", d.domains],
            ["Still used?", d.used],
            ["At the same time", d.talkers],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="text-xs font-medium">{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">Why hubs died</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
            <li>A hub repeats every bit out of every other port.</li>
            <li>All devices share one collision domain, so only one can talk at a time.</li>
            <li>No error checking: corrupted frames are repeated too.</li>
          </ul>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Why switches won</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
            <li>A switch learns which MAC lives on which port.</li>
            <li>It forwards a frame only where it needs to go.</li>
            <li>Each port is its own collision domain, so many devices transmit at once.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* ───────────────────────── 2 · frame flow ───────────────────────── */

type FKind = "pc" | "hub" | "sw" | "router" | "server";
type FNode = { x: number; y: number; kind: FKind; name: string; sub?: string };
type FPkt = { from: string; to: string; label: string; reply?: boolean; delay?: number };
type FStep = {
  title: string;
  text: string;
  packets: FPkt[];
  focus?: string[];
  accept?: string[];
  discard?: string[];
  cam?: [string, string][];
  frame?: [string, string][];
  route?: { rows: string[][]; hit: number };
};
type Scn = {
  vb: [number, number];
  nodes: Record<string, FNode>;
  links: [string, string, number][];
  portLabels?: Record<string, string>; // PC id -> port label drawn near the switch
  labels?: [number, number, string, "start" | "middle" | "end"][];
  bcast: { x: number; y: number; w: number; h: number; label: string }[];
  domainNote: string;
  cam0: Record<string, string>;
  showCam: boolean;
  steps: FStep[];
};

const fr = (op: string, sIp: string, dIp: string, sMac: string, dMac: string, ttl?: string): [string, string][] => {
  const rows: [string, string][] = [["Type", op], ["Src IP", sIp], ["Dest IP", dIp], ["Src MAC", sMac], ["Dest MAC", dMac]];
  if (ttl) rows.push(["TTL", ttl]);
  return rows;
};
const mf = (sMac: string, dMac: string): [string, string][] => [["Src MAC", sMac], ["Dest MAC", dMac]];

const four = (center: FNode, centerId: string): Record<string, FNode> => ({
  [centerId]: center,
  a: { x: 60, y: 48, kind: "pc", name: "PC-A", sub: "aaa" },
  b: { x: 60, y: 152, kind: "pc", name: "PC-B", sub: "bbb" },
  c: { x: 340, y: 48, kind: "pc", name: "PC-C", sub: "ccc" },
  d: { x: 340, y: 152, kind: "pc", name: "PC-D", sub: "ddd" },
});

function hubScenario(): Scn {
  return {
    vb: [400, 200],
    nodes: four({ x: 200, y: 100, kind: "hub", name: "Hub" }, "hub"),
    links: [["hub", "a", 0], ["hub", "b", 0], ["hub", "c", 0], ["hub", "d", 0]],
    bcast: [{ x: 6, y: 4, w: 388, h: 192, label: "1 broadcast domain · 1 collision domain" }],
    domainNote: "All 4 PCs share 1 collision domain. A broadcast reaches every PC, they just drop it if it is not for them.",
    cam0: {},
    showCam: false,
    steps: [
      {
        title: "PC-A listens, then sends",
        text: "PC-A checks that the medium is free (CSMA/CD) and sends the frame to PC-C.",
        packets: [{ from: "a", to: "hub", label: "Frame" }],
        frame: mf("aaa", "ccc"),
        focus: ["a"],
      },
      {
        title: "The hub repeats it out of every other port",
        text: "A hub has no table and reads nothing. It repeats the signal out of every other port: PC-B, PC-C and PC-D.",
        packets: [
          { from: "hub", to: "b", label: "Frame" },
          { from: "hub", to: "c", label: "Frame" },
          { from: "hub", to: "d", label: "Frame" },
        ],
        frame: mf("aaa", "ccc"),
      },
      {
        title: "Who accepts it?",
        text: "PC-B and PC-D read the destination MAC, see it is not theirs and discard it. PC-C sees its own MAC and accepts.",
        packets: [],
        discard: ["b", "d"],
        accept: ["c"],
        frame: mf("aaa", "ccc"),
      },
      {
        title: "Bandwidth is shared",
        text: "While PC-A was talking, nobody else could. If two PCs transmit at the same time there is a collision, and both back off and try again.",
        packets: [],
        focus: ["a", "b", "c", "d"],
      },
    ],
  };
}

function switchScenario(knows: boolean): Scn {
  const steps: FStep[] = [
    {
      title: "A frame arrives on a port",
      text: "The switch receives an Ethernet frame from PC-A on port 1. The frame carries a source MAC, a destination MAC and a payload.",
      packets: [{ from: "a", to: "sw", label: "Frame" }],
      frame: mf("aaa", "ccc"),
    },
    {
      title: "The switch learns the source",
      text: knows
        ? "It reads the source MAC and the port it arrived on and writes aaa = port 1 into the CAM table. It already knows ccc = port 3 from earlier traffic."
        : "It reads the source MAC and the port it arrived on and writes aaa = port 1 into the CAM table. Next time it knows where aaa lives.",
      packets: [],
      focus: ["sw"],
      cam: [["aaa", "1"]],
    },
  ];
  if (knows) {
    steps.push({
      title: "Known destination: forward out one port",
      text: "ccc is in the CAM table on port 3, so the switch forwards the frame only out of port 3. PC-B and PC-D never see it, and their ports stay quiet.",
      packets: [{ from: "sw", to: "c", label: "Frame" }],
      accept: ["c"],
      frame: mf("aaa", "ccc"),
    });
  } else {
    steps.push(
      {
        title: "Unknown destination: flood",
        text: "The CAM table has no entry for ccc, so the switch floods the frame out of every port except the one it arrived on. PC-B and PC-D discard it. PC-C accepts it.",
        packets: [
          { from: "sw", to: "b", label: "Frame" },
          { from: "sw", to: "c", label: "Frame" },
          { from: "sw", to: "d", label: "Frame" },
        ],
        discard: ["b", "d"],
        accept: ["c"],
        frame: mf("aaa", "ccc"),
      },
      {
        title: "PC-C replies and the table fills in",
        text: "The reply arrives on port 3, so the switch learns ccc = port 3. It already knows aaa, so the reply goes out of port 1 only.",
        packets: [
          { from: "c", to: "sw", label: "Reply", reply: true },
          { from: "sw", to: "a", label: "Reply", reply: true, delay: 1 },
        ],
        accept: ["a"],
        cam: [["ccc", "3"]],
        frame: mf("ccc", "aaa"),
      },
      {
        title: "From now on: no flooding",
        text: "The table is complete. The next frame from PC-A to PC-C goes only out of port 3. PC-B and PC-D never see it.",
        packets: [
          { from: "a", to: "sw", label: "Frame" },
          { from: "sw", to: "c", label: "Frame", delay: 1 },
        ],
        accept: ["c"],
        frame: mf("aaa", "ccc"),
      },
    );
  }
  return {
    vb: [400, 200],
    nodes: four({ x: 200, y: 100, kind: "sw", name: "Switch" }, "sw"),
    links: [["sw", "a", 0], ["sw", "b", 1], ["sw", "c", 2], ["sw", "d", 3]],
    portLabels: { a: "1", b: "2", c: "3", d: "4" },
    bcast: [{ x: 6, y: 4, w: 388, h: 192, label: "1 broadcast domain" }],
    domainNote: "4 separate collision domains, one per port (the four coloured cables). Still 1 shared broadcast domain.",
    cam0: knows ? { ccc: "3" } : {},
    showCam: true,
    steps,
  };
}

function routerScenario(): Scn {
  return {
    vb: [680, 200],
    nodes: {
      a: { x: 60, y: 100, kind: "pc", name: "PC-A", sub: "192.168.1.10 · aaa" },
      sw1: { x: 190, y: 100, kind: "sw", name: "SW1" },
      r: { x: 335, y: 100, kind: "router", name: "Router" },
      sw2: { x: 480, y: 100, kind: "sw", name: "SW2" },
      s: { x: 620, y: 100, kind: "server", name: "Server", sub: "192.168.2.10 · sss" },
    },
    links: [["a", "sw1", 0], ["sw1", "r", 1], ["r", "sw2", 2], ["sw2", "s", 3]],
    labels: [
      [335, 158, "Gi0/0 (192.168.1.1): rr1", "middle"],
      [335, 174, "Gi0/1 (192.168.2.1): rr2", "middle"],
    ],
    bcast: [
      { x: 6, y: 20, w: 262, h: 170, label: "Broadcast domain 1 (192.168.1.0/24)" },
      { x: 402, y: 20, w: 272, h: 170, label: "Broadcast domain 2 (192.168.2.0/24)" },
    ],
    domainNote: "Each router interface is its own broadcast domain and its own collision domain. Broadcasts stop at the router.",
    cam0: {},
    showCam: false,
    steps: [
      {
        title: "PC-A sees the server is on another network",
        text: "PC-A ANDs the server IP with its mask: 192.168.2.10 gives 192.168.2.0, which is not its own network 192.168.1.0. The server is remote, so the frame must go to the default gateway (the router).",
        packets: [],
        focus: ["a"],
      },
      {
        title: "ARP: what is the router MAC?",
        text: "The destination MAC must be the router interface, not the server. PC-A knows the gateway IP but not its MAC, so it sends an ARP broadcast. The switches flood it inside broadcast domain 1, and the router does not pass it on.",
        packets: [
          { from: "a", to: "sw1", label: "ARP Request" },
          { from: "sw1", to: "r", label: "ARP Request", delay: 1 },
        ],
        frame: fr("ARP request", "192.168.1.10", "192.168.1.1", "aaa", BCAST_MAC),
        accept: ["r"],
      },
      {
        title: "ARP reply",
        text: "The router answers with the MAC of its Gi0/0 interface: rr1. PC-A saves it.",
        packets: [
          { from: "r", to: "sw1", label: "ARP Reply", reply: true },
          { from: "sw1", to: "a", label: "ARP Reply", reply: true, delay: 1 },
        ],
        frame: fr("ARP reply", "192.168.1.1", "192.168.1.10", "rr1", "aaa"),
        accept: ["a"],
      },
      {
        title: "PC-A sends the frame to the router",
        text: "The destination IP is the server, but the destination MAC is the router. The switch just forwards by MAC.",
        packets: [
          { from: "a", to: "sw1", label: "Frame" },
          { from: "sw1", to: "r", label: "Frame", delay: 1 },
        ],
        frame: fr("Data", "192.168.1.10", "192.168.2.10", "aaa", "rr1", "64"),
        accept: ["r"],
      },
      {
        title: "The router strips the frame and reads the IP",
        text: "The router removes the Ethernet header and reads the destination IP. It checks the routing table, and the longest-prefix match wins: /24 is more specific than the default route /0.",
        packets: [],
        focus: ["r"],
        route: {
          rows: [
            ["192.168.1.0/24", "Gi0/0 (connected)"],
            ["192.168.2.0/24", "Gi0/1 (connected)"],
            ["0.0.0.0/0", "via ISP (default route)"],
          ],
          hit: 1,
        },
      },
      {
        title: "A new frame for the next hop",
        text: "The router rebuilds the Layer 2 header with new MACs (it ARPs for the server first if it does not know sss) and lowers the TTL by one. The IP addresses never change, only the MACs do: one frame per hop.",
        packets: [
          { from: "r", to: "sw2", label: "Frame" },
          { from: "sw2", to: "s", label: "Frame", delay: 1 },
        ],
        frame: fr("Data", "192.168.1.10", "192.168.2.10", "rr2", "sss", "63"),
        accept: ["s"],
      },
    ],
  };
}

function nodeRadius(k: FKind) {
  return k === "pc" || k === "server" ? 46 : 35;
}
function flowEdge(nodes: Record<string, FNode>, a: string, b: string): [number, number, number, number] {
  const A = nodes[a];
  const B = nodes[b];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const ra = nodeRadius(A.kind);
  const rb = nodeRadius(B.kind);
  return [A.x + ux * ra, A.y + uy * ra, B.x - ux * rb, B.y - uy * rb];
}

function FlowDiagram({
  scn,
  step,
  stepKey,
  domains,
}: {
  scn: Scn;
  step: FStep | null;
  stepKey: string;
  domains: boolean;
}) {
  const { nodes } = scn;
  const linkColor: Record<string, string> = {};
  const active = new Set<string>();
  step?.packets.forEach((p) => {
    linkColor[[p.from, p.to].sort().join("-")] = p.reply ? BLUE : RED;
    active.add(p.from);
    active.add(p.to);
  });
  step?.focus?.forEach((f) => active.add(f));
  const maxDelay = step ? Math.max(0, ...step.packets.map((p) => p.delay ?? 0)) : 0;
  const markerDelay = step && step.packets.length > 0 ? (maxDelay + 1) * HOP : 0;

  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-3">
      <svg
        viewBox={`0 0 ${scn.vb[0]} ${scn.vb[1]}`}
        className="mx-auto w-full"
        style={{ minWidth: scn.vb[0] > 500 ? 600 : 360, maxWidth: scn.vb[0] > 500 ? 820 : 520 }}
        role="img"
        aria-label="Network diagram"
      >
        {domains &&
          scn.bcast.map((b) => (
            <g key={b.label}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} fill="none" stroke={AMBER} strokeWidth={1.5} strokeDasharray="6 5" />
              <text x={b.x + 10} y={b.y + 15} fontSize={10} fontWeight={600} fill={AMBER}>{b.label}</text>
            </g>
          ))}

        {scn.links.map(([a, b, ci]) => {
          const key = [a, b].sort().join("-");
          const [x0, y0, x1, y1] = flowEdge(nodes, a, b);
          const c = domains ? DOMAIN_COLORS[ci % 4] : linkColor[key];
          return (
            <line
              key={key}
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

        {scn.portLabels &&
          Object.entries(scn.portLabels).map(([pc, label]) => {
            const sw = nodes.sw;
            const p = nodes[pc];
            const dx = p.x - sw.x;
            const dy = p.y - sw.y;
            const len = Math.hypot(dx, dy);
            const px = sw.x + (dx / len) * 56;
            const py = sw.y + (dy / len) * 56;
            return (
              <text key={pc} x={px} y={py + 4} textAnchor="middle" fontSize={11} fontFamily={mono} className="fill-foreground">
                p{label}
              </text>
            );
          })}

        {scn.labels?.map(([x, y, t, anchor], i) => (
          <text key={i} x={x} y={y} textAnchor={anchor} fontSize={10} fontFamily={mono} className="fill-foreground">{t}</text>
        ))}

        {Object.entries(nodes).map(([id, n]) => {
          const on = active.has(id);
          const ok = step?.accept?.includes(id);
          const no = step?.discard?.includes(id);
          const stroke = ok ? GREEN : no ? RED : on ? AMBER : "currentColor";
          const sw = ok || no || on ? 3.5 : 2;
          const isBox = n.kind === "pc" || n.kind === "server";
          const top = isBox ? n.y - 28 : n.y - 43;
          return (
            <g key={id}>
              {isBox ? (
                <rect x={n.x - 42} y={n.y - 19} width={84} height={38} rx={4} className="fill-background" stroke={stroke} strokeWidth={sw} style={{ transition: "stroke .4s" }} />
              ) : (
                <circle cx={n.x} cy={n.y} r={33} className="fill-background" stroke={stroke} strokeWidth={sw} strokeDasharray={undefined} style={{ transition: "stroke .4s" }} />
              )}
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={n.kind === "router" ? 12 : 13} fontWeight={600} className="fill-foreground">{n.name}</text>
              {n.sub && (
                <text x={n.x} y={n.y + (isBox ? 34 : 48)} textAnchor="middle" fontSize={10} fontFamily={mono} className="fill-foreground">{n.sub}</text>
              )}
              {(ok || no) && (
                <g key={`${stepKey}-${id}`} className="n4-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text x={n.x} y={top} textAnchor="middle" fontSize={11} fontWeight={700} fill={ok ? GREEN : RED}>
                    {ok ? "✓ accepts" : "✕ discards"}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {step?.packets.map((p, i) => {
          const [x0, y0, x1, y1] = flowEdge(nodes, p.from, p.to);
          const w = p.label.length * 6 + 18;
          return (
            <g
              key={`${stepKey}-${i}`}
              className="n4-pkt"
              style={
                {
                  "--x0": `${x0}px`,
                  "--y0": `${y0}px`,
                  "--x1": `${x1}px`,
                  "--y1": `${y1}px`,
                  animationDelay: `${(p.delay ?? 0) * HOP}s`,
                } as CSSProperties
              }
            >
              <rect x={-w / 2} y={-11} width={w} height={22} rx={6} fill={p.reply ? BLUE : RED} stroke="#fff" strokeWidth={1.5} />
              <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>{p.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FlowSection() {
  const [scnId, setScnId] = useState<1 | 2 | 3>(2);
  const [knows, setKnows] = useState(false);
  const [step, setStep] = useState(0);
  const [domains, setDomains] = useState(false);

  const scn = scnId === 1 ? hubScenario() : scnId === 2 ? switchScenario(knows) : routerScenario();
  const n = scn.steps.length;
  const current = step > 0 ? scn.steps[step - 1] : null;

  const cam: Record<string, string> = { ...scn.cam0 };
  const fresh = new Set<string>();
  scn.steps.slice(0, step).forEach((s, i) =>
    s.cam?.forEach(([mac, port]) => {
      const isNew = cam[mac] !== port;
      cam[mac] = port;
      if (i === step - 1 && isNew) fresh.add(mac);
    }),
  );

  const pick = (id: 1 | 2 | 3) => { setScnId(id); setStep(0); };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pick active={scnId === 1} onClick={() => pick(1)}>1 · PC-A → PC-C on a hub</Pick>
        <Pick active={scnId === 2} onClick={() => pick(2)}>2 · PC-A → PC-C on a switch</Pick>
        <Pick active={scnId === 3} onClick={() => pick(3)}>3 · PC-A → Server via a router</Pick>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {scnId === 2 && (
          <Button size="sm" variant="outline" onClick={() => { setKnows((k) => !k); setStep(0); }}>
            {knows ? "Start with: PC-C already learned" : "Start with: empty CAM table"} (tap to switch)
          </Button>
        )}
        <Button size="sm" variant={domains ? "default" : "outline"} onClick={() => setDomains((d) => !d)}>
          {domains ? "Hide domains" : "Show domains"}
        </Button>
      </div>

      <FlowDiagram scn={scn} step={current} stepKey={`${scnId}-${knows}-${step}`} domains={domains} />

      {domains && (
        <p className="n4-fade text-xs font-medium" style={{ color: AMBER }}>{scn.domainNote}</p>
      )}

      <Panel>
        {current ? (
          <div key={`${scnId}-${knows}-${step}`} className="n4-fade flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Step {step} of {n}</p>
            <p className="text-sm font-semibold">{current.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">{current.text}</p>

            {current.route && (
              <SimpleTable head={["Router routing table: network", "Exit"]} rows={current.route.rows} hit={current.route.hit} />
            )}
            {current.frame && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[300px] text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      {current.frame.map(([h]) => (
                        <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      {current.frame.map(([h, v], i) => (
                        <td key={h} className={`px-3 py-2 font-mono ${i === 0 ? "font-sans font-semibold" : ""}`} style={h.includes("MAC") ? { color: BLUE } : undefined}>{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {step === n && (
              <p className="text-xs font-medium" style={{ color: GREEN }}>
                {scnId === 1 && "Done. A hub sends everything everywhere and only one device can talk at a time."}
                {scnId === 2 && "Done. The switch learns from every frame it sees, and once it knows a MAC it stops flooding."}
                {scnId === 3 && "Done. IP addresses stayed the same end to end, only the MAC addresses changed at each hop."}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            Press Next step to follow one frame. Hub repeats, switch forwards, router routes.
          </p>
        )}
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        <Button size="sm" disabled={step >= n} onClick={() => setStep((s) => Math.min(n, s + 1))}>
          {step === 0 ? "Start" : "Next step"}
        </Button>
        <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep(0)}>Reset</Button>
      </div>

      {scn.showCam && (
        <Panel>
          <p className="text-xs font-semibold">Switch CAM table</p>
          {Object.keys(cam).length === 0 ? (
            <p className="mt-1 text-[11px] text-muted-foreground">empty</p>
          ) : (
            Object.entries(cam)
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([mac, port]) => (
                <p key={mac} className={`mt-1 font-mono text-[11px] ${fresh.has(mac) ? "n4-fade font-bold" : "text-muted-foreground"}`} style={fresh.has(mac) ? { color: GREEN } : undefined}>
                  port {port} = {mac}
                </p>
              ))
          )}
        </Panel>
      )}

      <Tip>Red chips travel toward the destination, blue chips are replies. IPs stay the same end to end, MACs change at every router.</Tip>
    </div>
  );
}

/* ───────────────────────── 3 · inside a switch ───────────────────────── */

const CAM_ROWS = [
  ["aaa", "Fa0/1", "dynamic", "1"],
  ["bbb", "Fa0/2", "dynamic", "1"],
  ["ccc", "Fa0/3", "static", "1"],
  ["ddd", "Fa0/4", "dynamic", "10"],
];

type Outcome = "known" | "unknown" | "bcast";
const OUTCOMES: Record<Outcome, { label: string; dest: string; out: number[]; text: string }> = {
  known: { label: "Known unicast", dest: "ccc (in table: port 3)", out: [3], text: "The destination MAC is in the CAM table, so the frame is forwarded out of exactly one port." },
  unknown: { label: "Unknown unicast", dest: "eee (not in table)", out: [2, 3, 4], text: "The destination MAC is not in the table, so the switch floods the frame out of every port except the one it came in on." },
  bcast: { label: "Broadcast", dest: BCAST_MAC, out: [2, 3, 4], text: "A broadcast is always flooded out of every port except the one it came in on." },
};

const FEATURES: { f: string; m: boolean; n: boolean }[] = [
  { f: "Console port", m: true, n: false },
  { f: "Configurable and monitorable", m: true, n: false },
  { f: "VLANs", m: true, n: false },
  { f: "STP tuning", m: true, n: false },
  { f: "Port security", m: true, n: false },
  { f: "SNMP", m: true, n: false },
  { f: "Plug and play", m: false, n: true },
];

function SwitchSection() {
  const [out, setOut] = useState<Outcome>("known");
  const [managed, setManaged] = useState(true);
  const o = OUTCOMES[out];
  const px = [90, 160, 230, 300];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">What a switch decides, one frame at a time</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A frame arrives on port 1 from PC-A. Pick what kind of destination it has.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(OUTCOMES) as Outcome[]).map((k) => (
            <Pick key={k} active={out === k} onClick={() => setOut(k)}>{OUTCOMES[k].label}</Pick>
          ))}
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border bg-background p-2">
          <svg viewBox="0 0 400 190" className="mx-auto w-full min-w-[320px] max-w-[460px]" role="img" aria-label="Switch with four ports">
            <rect x={50} y={30} width={300} height={56} rx={8} className="fill-background" stroke="currentColor" strokeWidth={2} />
            <text x={200} y={64} textAnchor="middle" fontSize={14} fontWeight={600} className="fill-foreground">Switch</text>
            {[1, 2, 3, 4].map((p, i) => {
              const ingress = p === 1;
              const egress = o.out.includes(p);
              const c = ingress ? BLUE : egress ? GREEN : undefined;
              return (
                <g key={p}>
                  <line x1={px[i]} y1={86} x2={px[i]} y2={140} stroke={c ?? "currentColor"} strokeOpacity={c ? 1 : 0.35} strokeWidth={c ? 3 : 2} strokeDasharray={egress && !ingress ? "6 4" : undefined} className={egress && !ingress ? "n4-dash" : undefined} />
                  <rect x={px[i] - 14} y={72} width={28} height={16} rx={3} fill={c ?? "transparent"} stroke={c ?? "currentColor"} strokeWidth={1.5} />
                  <text x={px[i]} y={84} textAnchor="middle" fontSize={11} fontWeight={700} fill={c ? "#fff" : undefined} className={c ? undefined : "fill-foreground"}>{p}</text>
                  <rect x={px[i] - 28} y={140} width={56} height={26} rx={4} className="fill-background" stroke={c ?? "currentColor"} strokeWidth={c ? 3 : 2} />
                  <text x={px[i]} y={157} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">PC-{"ABCD"[i]}</text>
                  <text x={px[i]} y={182} textAnchor="middle" fontSize={10} fontFamily={mono} className="fill-foreground">{["aaa", "bbb", "ccc", "ddd"][i]}</text>
                </g>
              );
            })}
            <text x={370} y={22} textAnchor="end" fontSize={10} fontFamily={mono} className="fill-foreground">dest MAC: {o.dest}</text>
          </svg>
        </div>
        <p className="mt-2 text-xs font-medium" style={{ color: GREEN }}>
          {out === "known" ? "Forward out port 3 only." : "Flood out ports 2, 3 and 4 (not port 1)."}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{o.text}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Blue port = frame arrived. Green port = frame leaves.</p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The CAM table</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          MAC table and CAM table are the same thing. CAM stands for Content Addressable Memory, the fast memory a switch
          uses to look up a MAC address. The switch learns only from the <span className="font-semibold">source</span> MAC of every frame it sees.
        </p>
        <div className="mt-3">
          <SimpleTable head={["MAC address", "Port", "Type", "VLAN"]} rows={CAM_ROWS} />
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
          <li>Dynamic entries are learned automatically and age out after a while if the device goes quiet (300 seconds by default on Cisco).</li>
          <li>Static entries are typed in by an administrator and stay until removed.</li>
          <li>It stores MAC addresses, never IP addresses.</li>
        </ul>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Manageable vs non-manageable</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={managed} onClick={() => setManaged(true)}>Manageable</Pick>
          <Pick active={!managed} onClick={() => setManaged(false)}>Non-manageable</Pick>
        </div>
        <div className="mt-3 grid gap-1 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const has = managed ? f.m : f.n;
            const anyOther = managed ? f.n : f.m;
            if (!has && !anyOther) return null;
            return (
              <p key={f.f} className="flex items-center gap-2 text-xs" style={{ color: has ? undefined : RED, opacity: has ? 1 : 0.7 }}>
                <span style={{ color: has ? GREEN : RED }}>{has ? "✓" : "✕"}</span>
                {f.f}
              </p>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {managed
            ? "Used in enterprise and data-center networks. Higher price."
            : "Used at home and in small offices. Just forwards frames, lowest price."}
        </p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">L2 switch vs L3 switch (MLS)</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
            <li>An L2 switch forwards using the MAC table only.</li>
            <li>An L3 switch (multilayer switch) can also read the IP header and route using a routing table.</li>
            <li>Routing is disabled by default. You enable it (on Cisco: <span className="font-mono">ip routing</span>) and then give interfaces or VLANs an IP address.</li>
          </ul>
        </Panel>
        <Tip title="Observer">
          A switch is fundamentally an observer. Every frame it sees teaches it where one MAC address lives.
        </Tip>
      </div>
    </div>
  );
}

/* ───────────────────────── 4 · communication types ───────────────────────── */

type Comm = "unicast" | "multicast" | "broadcast" | "anycast";
const COMMS: Record<Comm, { name: string; pattern: string; example: string; recv: boolean[]; note: string }> = {
  unicast: { name: "Unicast", pattern: "One to one", example: "A PC talking to a web server.", recv: [false, false, true, false, false], note: "Only the one destination receives it." },
  multicast: { name: "Multicast", pattern: "One to a group", example: "A video stream to subscribers.", recv: [true, false, true, true, false], note: "Only hosts that joined the group receive it. The others ignore it." },
  broadcast: { name: "Broadcast", pattern: "One to all", example: "An ARP request on an IPv4 LAN.", recv: [true, true, true, true, true], note: "Every host on the local segment receives it." },
  anycast: { name: "Anycast", pattern: "One to the nearest", example: "DNS root servers and CDNs.", recv: [false, true, false, false, false], note: "Several hosts share the same address. The routing system delivers to the closest one." },
};
const HOPS = ["5 hops", "1 hop", "4 hops", "3 hops", "6 hops"];

function CommSection() {
  const [t, setT] = useState<Comm>("unicast");
  const [v6, setV6] = useState(false);
  const c = COMMS[t];
  const blocked = v6 && t === "broadcast";
  const ry = [30, 65, 100, 135, 170];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">How many receivers process one transmission?</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(Object.keys(COMMS) as Comm[]).map((k) => (
            <Pick key={k} active={t === k} onClick={() => setT(k)}>{COMMS[k].name}</Pick>
          ))}
          <span className="mx-1 text-muted-foreground">|</span>
          <Pick active={!v6} onClick={() => setV6(false)}>IPv4</Pick>
          <Pick active={v6} onClick={() => setV6(true)}>IPv6</Pick>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border bg-background p-2">
          <svg viewBox="0 0 400 200" className="mx-auto w-full min-w-[320px] max-w-[460px]" role="img" aria-label="One sender and five receivers" style={{ opacity: blocked ? 0.35 : 1 }}>
            {ry.map((y, i) => {
              const on = !blocked && c.recv[i];
              return (
                <g key={y}>
                  <line x1={90} y1={100} x2={290} y2={y} stroke={on ? RED : "currentColor"} strokeOpacity={on ? 1 : 0.25} strokeWidth={on ? 3 : 1.5} style={{ transition: "all .4s" }} />
                  <rect x={290} y={y - 14} width={64} height={28} rx={4} className="fill-background" stroke={on ? GREEN : "currentColor"} strokeWidth={on ? 3.5 : 2} style={{ transition: "stroke .4s" }} />
                  <text x={322} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">Host {i + 1}</text>
                  <text x={362} y={y + 4} fontSize={10} fontWeight={700} fill={on ? GREEN : RED}>{blocked ? "" : on ? "✓" : "✕"}</text>
                  {t === "anycast" && !blocked && (
                    <text x={190} y={(100 + y) / 2 - 6 + (i - 2) * 3} fontSize={9} fontFamily={mono} className="fill-foreground">{HOPS[i]}</text>
                  )}
                </g>
              );
            })}
            <rect x={26} y={84} width={64} height={32} rx={4} className="fill-background" stroke={BLUE} strokeWidth={3} />
            <text x={58} y={104} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-foreground">Sender</text>
          </svg>
        </div>

        {blocked ? (
          <div className="n4-fade mt-3 rounded-lg border px-3 py-2 text-xs leading-5" style={{ borderColor: RED, color: RED }}>
            <span className="font-semibold">IPv6 has no broadcast.</span> Multicast does the same job, but only wakes the hosts that need it. For example, ARP is replaced by Neighbor Discovery, which uses multicast.
          </div>
        ) : (
          <div key={`${t}${v6}`} className="n4-fade mt-3 grid gap-2 sm:grid-cols-3">
            {[
              ["Pattern", c.pattern],
              ["Example", c.example],
              ["Who receives", c.note],
            ].map(([k, vv]) => (
              <div key={k} className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
                <p className="text-xs font-medium">{vv}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tip title="Memory hook">
          Multicast = everyone who <span className="font-semibold">joined</span> receives. Anycast = only the <span className="font-semibold">closest</span> one receives. They are not the same.
        </Tip>
        <Tip title="IPv6">
          IPv6 removed broadcast and uses multicast instead. Anycast is not new to IPv6 (DNS root servers use it on IPv4 too), but IPv6 made it a standard address type.
        </Tip>
      </div>
    </div>
  );
}

/* ───────────────────────── 5 · loops and small things ───────────────────────── */

const SP = { s1: { x: 200, y: 42 }, s2: { x: 80, y: 150 }, s3: { x: 320, y: 150 } };
const WIRED = [
  "Listen: is the wire free?",
  "Send the frame.",
  "Two devices sent at once? Collision detected.",
  "Both stop, wait a random time and try again.",
];
const WIRELESS = [
  "Listen: is the air free?",
  "Wait a random time first, to avoid a collision.",
  "Send the frame.",
  "Wait for an acknowledgement. No ACK means it was lost, so send again.",
];

function StpSection() {
  const [on, setOn] = useState(true);
  const [wired, setWired] = useState(true);
  const links: [keyof typeof SP, keyof typeof SP][] = [["s1", "s2"], ["s1", "s3"], ["s2", "s3"]];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Spanning Tree Protocol (STP)</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Three switches joined in a triangle give redundancy, but also a loop. Switch STP on and off and watch a broadcast.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" variant={on ? "default" : "outline"} onClick={() => setOn((v) => !v)}>
            STP: {on ? "ON (default)" : "OFF"}
          </Button>
          <Badge variant="secondary" style={{ color: on ? GREEN : RED }}>
            {on ? "✓ Loop-free" : "✕ Broadcast storm"}
          </Badge>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border bg-background p-2">
          <svg viewBox="0 0 400 200" className="mx-auto w-full min-w-[320px] max-w-[460px]" role="img" aria-label="Three switches in a triangle">
            {links.map(([a, b]) => {
              const blocked = on && a === "s2" && b === "s3";
              return (
                <line key={a + b} x1={SP[a].x} y1={SP[a].y} x2={SP[b].x} y2={SP[b].y} stroke={on ? (blocked ? RED : "currentColor") : RED} strokeOpacity={blocked ? 0.9 : on ? 0.45 : 0.9} strokeWidth={on ? 2 : 3} strokeDasharray={blocked ? "6 5" : undefined} />
              );
            })}
            {(Object.keys(SP) as (keyof typeof SP)[]).map((k, i) => (
              <g key={k}>
                <circle cx={SP[k].x} cy={SP[k].y} r={28} className="fill-background" stroke={!on ? RED : "currentColor"} strokeWidth={2.5} />
                <text x={SP[k].x} y={SP[k].y + 5} textAnchor="middle" fontSize={13} fontWeight={600} className="fill-foreground">SW{i + 1}</text>
              </g>
            ))}
            {on && (
              <g>
                <rect x={300} y={118} width={22} height={22} rx={4} fill={RED} />
                <text x={311} y={134} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff">✕</text>
                <text x={200} y={178} textAnchor="middle" fontSize={11} fontWeight={600} fill={RED}>blocked port: no loop possible</text>
              </g>
            )}
            {!on &&
              [0, 1, 2].map((i) => (
                <g key={i} className="n4-loop" style={{ animationDelay: `${-i}s` }}>
                  <rect x={-24} y={-10} width={48} height={20} rx={6} fill={RED} stroke="#fff" strokeWidth={1.5} />
                  <text textAnchor="middle" y={4} fontSize={9} fontWeight={600} fill="#fff" fontFamily={mono}>Bcast</text>
                </g>
              ))}
            {on && (
              <>
                {(["s2", "s3"] as const).map((k, i) => (
                  <g key={`${k}-${on}`} className="n4-pkt" style={{ "--x0": `${SP.s1.x}px`, "--y0": `${SP.s1.y}px`, "--x1": `${SP[k].x}px`, "--y1": `${SP[k].y}px`, animationDelay: `${i * 0.1}s` } as CSSProperties}>
                    <rect x={-24} y={-10} width={48} height={20} rx={6} fill={RED} stroke="#fff" strokeWidth={1.5} />
                    <text textAnchor="middle" y={4} fontSize={9} fontWeight={600} fill="#fff" fontFamily={mono}>Bcast</text>
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {on
            ? "STP detects the redundant path and blocks one port. The broadcast reaches every switch once and stops. If another link fails, the blocked port can be reopened."
            : "Without STP the broadcast circles the triangle forever. Layer 2 frames have no TTL, so the loop eats all the bandwidth. You rarely, if ever, want STP off."}
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Sharing the medium</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={wired} onClick={() => setWired(true)}>CSMA/CD (wired)</Pick>
          <Pick active={!wired} onClick={() => setWired(false)}>CSMA/CA (wireless)</Pick>
        </div>
        <ol key={String(wired)} className="n4-fade mt-3 list-decimal space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
          {(wired ? WIRED : WIRELESS).map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {wired
            ? "CD = Collision Detection. Used on half-duplex wired Ethernet, such as hubs."
            : "CA = Collision Avoidance. Wireless devices cannot easily hear a collision while they transmit, so they avoid it instead."}
        </p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { t: "ASIC", d: "A hardware chip inside a switch that forwards frames at line rate, so the switch keeps up with huge traffic without slowing down." },
          { t: "Error checking", d: "Each switch port has buffer memory. A switch can check a frame before forwarding it (store-and-forward mode checks the whole frame). A hub repeats bad frames too." },
          { t: "STP default", d: "STP is enabled by default on switches. It blocks redundant ports to stop Layer 2 loops." },
        ].map((x) => (
          <Panel key={x.t}>
            <p className="text-sm font-semibold">{x.t}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{x.d}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── 6 · common mistakes ───────────────────────── */

const MYTHS = [
  { wrong: "A hub and a switch do basically the same thing.", right: "A hub repeats every bit out of every other port (1 collision domain). A switch forwards by MAC and gives each port its own collision domain." },
  { wrong: "Switches break up broadcast domains.", right: "By default every switch port is in the same broadcast domain. Routers split broadcast domains. VLANs also split them, but moving traffic between VLANs needs a router or an L3 switch." },
  { wrong: "A switch stores IP addresses.", right: "The CAM table stores MAC addresses (with port, type and VLAN), not IPs. IP belongs to Layer 3 devices." },
  { wrong: "Hubs have error checking.", right: "Hubs have no error checking and repeat corrupted frames too. A switch has per-port buffer memory and can check frames before forwarding." },
  { wrong: "STP is optional and usually off.", right: "STP is on by default. You would have to disable it explicitly, and you rarely should." },
  { wrong: "An L3 switch routes out of the box.", right: "Routing is disabled by default on an L3 / MLS switch. You enable it and give interfaces or VLANs an IP address." },
  { wrong: "Anycast is another word for multicast.", right: "Multicast = one to a group (everyone who joined receives). Anycast = one to the nearest (only the closest instance receives)." },
  { wrong: "IPv6 still uses broadcast.", right: "IPv6 removed broadcast. Multicast does the same job, and anycast is a standard address type." },
  { wrong: "The router reads the MAC to decide where to send a packet.", right: "The router decides using the destination IP and its routing table. It uses a MAC only to build the new frame for the next hop." },
  { wrong: "Every router port shares one broadcast domain.", right: "Each router interface is its own broadcast domain and its own collision domain. That is why routers stop broadcasts." },
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
            <button key={i} type="button" onClick={() => toggle(i)} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50" style={{ borderColor: shown ? GREEN : undefined }}>
              <p className="text-xs font-semibold" style={{ color: RED }}>✕ Wrong</p>
              <p className="mt-1 text-sm font-medium">{m.wrong}</p>
              {shown ? (
                <div className="n4-fade mt-3 border-t pt-3">
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
  { q: "What layer is a hub, and how does it forward traffic?", a: ["Layer 1 (Physical). It has no table and cannot make decisions.", "It repeats every incoming signal out of every other port.", "Half-duplex. All ports share one collision domain and one broadcast domain."] },
  { q: "Why are hubs no longer used?", a: ["Every device shares one collision domain, so only one can transmit at a time.", "No error checking: corrupted frames get repeated.", "A loop of hubs repeats traffic forever and eats all the bandwidth."] },
  { q: "What is CSMA/CD, and where does it apply?", a: ["Carrier Sense Multiple Access with Collision Detection, the wired access rule for half-duplex Ethernet.", "A device listens first. If two talk at once there is a collision, and both back off.", "CSMA/CA (Collision Avoidance) is the wireless equivalent, because wireless cannot easily detect collisions."] },
  { q: "What does a switch look at when it forwards a frame?", a: ["The destination MAC address in the Ethernet header.", "It learns the source MAC into its CAM table.", "Known destination: forward out one port. Unknown or broadcast: flood out all ports except the incoming one."] },
  { q: "What is stored in a CAM table?", a: ["MAC address, switch port, static or dynamic type, and VLAN.", "MAC table and CAM table are the same thing. CAM is the type of memory the switch uses."] },
  { q: "Manageable vs non-manageable switches?", a: ["Non-manageable: no console port, no configuration, basic forwarding, home and small office.", "Manageable: console port, VLANs, STP tuning, port security, SNMP, enterprise and data center."] },
  { q: "L2 switch vs L3 switch (MLS): what changes?", a: ["An L2 switch forwards frames using the MAC table only.", "An L3 switch also reads the Layer 3 header and routes using a routing table.", "Routing is disabled by default on an L3 switch. You enable it per interface or per VLAN."] },
  { q: "What is an ASIC and why does it matter?", a: ["Application-Specific Integrated Circuit: a dedicated hardware chip in a switch.", "It forwards frames in hardware at line rate, so the switch handles huge traffic without slowing down."] },
  { q: "How does a router decide where to forward a packet?", a: ["It reads the destination IP in the packet header.", "It consults its routing table (connected, static or learned from a routing protocol).", "The longest-prefix match wins, and the packet leaves out that interface with a new Layer 2 header and TTL minus 1."] },
  { q: "Broadcast vs collision domains: who splits what?", a: ["A switch splits collision domains (one per port) but keeps one broadcast domain by default. VLANs split broadcast domains on a switch.", "A router splits both: every interface is its own broadcast and collision domain.", "That is why routers stop broadcasts and switches do not."] },
  { q: "What does Spanning Tree Protocol do?", a: ["Prevents Layer 2 loops by detecting redundant paths and blocking one of the ports.", "Enabled by default on switches.", "Without it, a closed loop circulates frames forever and eats all the bandwidth."] },
  { q: "Explain unicast, multicast, broadcast and anycast.", a: ["Unicast: one to one.", "Multicast: one to a group. Only members process it.", "Broadcast: one to all on the local segment.", "Anycast: one to the nearest. Several hosts share one address and routing delivers to the closest."] },
  { q: "Why does IPv6 remove broadcast?", a: ["Broadcasts interrupt every host on the segment, which is wasteful.", "Multicast delivers the same result but only to interested hosts.", "IPv6 also made anycast a standard address type."] },
];

function InterviewSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Network devices are classified by which header they read before deciding where to send traffic. A hub is Layer 1:
          it repeats every bit out of every other port, runs half-duplex, and puts every device in one collision domain. A
          switch is Layer 2: it learns source MACs into a CAM table, forwards known destinations out one port, and gives each
          port its own collision domain. An L3 switch adds IP routing on top, and routing is disabled by default. A router is
          Layer 3: it reads the destination IP, consults its routing table and forwards between networks, and each
          interface is its own broadcast and collision domain. Spanning Tree Protocol prevents Layer 2 loops. And
          communication types describe how many receivers process a transmission: unicast, multicast, broadcast and anycast.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">Practice it out loud until it flows without notes.</p>
      </Panel>

      <div className="flex flex-col gap-2">
        {QA.map((x, i) => {
          const isOpen = open === i;
          return (
            <div key={x.q} className="rounded-xl border bg-background">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                  {x.q}
                </span>
                <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <ul className="n4-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">Hub repeats, switch forwards, router routes. Each one sees more of the packet than the one before.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function NetworkDevicesSummary() {
  const [tab, setTab] = useState<TabId>("core");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n4-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes n4-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes n4-pop  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes n4-loop { 0% { transform: translate(200px, 42px); } 33.3% { transform: translate(80px, 150px); } 66.6% { transform: translate(320px, 150px); } 100% { transform: translate(200px, 42px); } }
        @keyframes n4-dash { to { stroke-dashoffset: -20; } }
        .n4-pkt  { animation: n4-move ${HOP}s ease-in-out both; }
        .n4-fade { animation: n4-fade .5s ease-out both; }
        .n4-pop  { animation: n4-pop .4s ease-out both; }
        .n4-loop { transform: translate(200px, 42px); animation: n4-loop 3s linear infinite; }
        .n4-dash { animation: n4-dash 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .n4-pkt, .n4-fade, .n4-pop, .n4-loop, .n4-dash { animation: none; opacity: 1; }
          .n4-pkt { transform: translate(var(--x1), var(--y1)); }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 04: Network devices and traffic flow</CardTitle>
            <CardDescription className="mt-1">
              Hub repeats, switch forwards, router routes. Seven short sections, tap through them in any order.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Pick key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pick>
          ))}
        </div>

        <div key={tab}>
          {tab === "core" && <CoreSection />}
          {tab === "flow" && <FlowSection />}
          {tab === "switch" && <SwitchSection />}
          {tab === "comm" && <CommSection />}
          {tab === "stp" && <StpSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}