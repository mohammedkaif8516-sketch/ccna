"use client";

import { useEffect, useState } from "react";
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
 * PacketFlowSimulator
 * Rebuilds the topology from your diagram (PC1, PC2, PC3 and a switch with
 * ports 0/1, 0/2, 0/3) and walks through:
 *   1. AND  : is the destination in my own network?
 *   2. ARP  : broadcast request, switch learning and flooding, unicast reply
 *   3. Data : ICMP echo and echo reply
 * Tables persist between pings, so a second ping skips ARP. Pick any source
 * and destination, or choose an address in another network to see the AND
 * check fail. Clear the ARP caches or the switch MAC table to replay parts.
 */

const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)

/* ───────────────────────── topology data ───────────────────────── */

type PcId = "pc1" | "pc2" | "pc3";
type NodeId = PcId | "sw";

const PCS: Record<PcId, { id: PcId; name: string; ip: string; mac: string; port: string }> = {
  pc1: { id: "pc1", name: "PC1", ip: "192.168.1.1", mac: "aaa", port: "0/1" },
  pc2: { id: "pc2", name: "PC2", ip: "192.168.1.2", mac: "bbb", port: "0/2" },
  pc3: { id: "pc3", name: "PC3", ip: "192.168.1.3", mac: "ccc", port: "0/3" },
};
const PC_IDS: PcId[] = ["pc1", "pc2", "pc3"];
const MASK = "255.255.255.0";
const EXT_IP = "192.168.2.10";
const BCAST_MAC = "ffff.ffff.ffff";

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";

/** Where packet chips start and end on each cable (SVG units). */
const LINKS: Record<PcId, { pc: [number, number]; sw: [number, number] }> = {
  pc1: { pc: [160, 165], sw: [312, 165] },
  pc2: { pc: [560, 75], sw: [404, 145] },
  pc3: { pc: [560, 255], sw: [404, 185] },
};

/* ───────────────────────── tables and steps ───────────────────────── */

type Tables = {
  arp: Record<PcId, Record<string, string>>; // per PC: ip -> mac
  mac: Record<string, string>; // switch: mac -> port
};
const emptyTables = (): Tables => ({ arp: { pc1: {}, pc2: {}, pc3: {} }, mac: {} });
const cloneTables = (t: Tables): Tables => ({
  arp: { pc1: { ...t.arp.pc1 }, pc2: { ...t.arp.pc2 }, pc3: { ...t.arp.pc3 } },
  mac: { ...t.mac },
});

type Mut =
  | { t: "arp"; pc: PcId; ip: string; mac: string }
  | { t: "mac"; mac: string; port: string };

type Pkt = { from: NodeId; to: NodeId; label: string; reply: boolean };

type AndInfo = { destIp: string; srcNet: string; res: string; local: boolean };

type SimStep = {
  phase: "and" | "arp" | "traffic";
  title: string;
  text: string;
  packets: Pkt[];
  frame?: [string, string][];
  discard?: PcId[];
  accept?: PcId[];
  mutations: Mut[];
  and?: AndInfo;
};

function applySteps(base: Tables, steps: SimStep[]): Tables {
  const t = cloneTables(base);
  for (const s of steps)
    for (const m of s.mutations) {
      if (m.t === "arp") t.arp[m.pc][m.ip] = m.mac;
      else t.mac[m.mac] = m.port;
    }
  return t;
}

function andIp(ip: string, mask: string): string {
  const a = ip.split(".").map(Number);
  const m = mask.split(".").map(Number);
  return a.map((o, i) => o & m[i]).join(".");
}
const toBin = (ip: string) =>
  ip.split(".").map((o) => Number(o).toString(2).padStart(8, "0"));

function build(srcId: PcId, dstKey: PcId | "ext", tables: Tables): SimStep[] {
  const S = PCS[srcId];
  const steps: SimStep[] = [];
  const sim = cloneTables(tables);

  const destIp = dstKey === "ext" ? EXT_IP : PCS[dstKey].ip;
  const srcNet = andIp(S.ip, MASK);
  const res = andIp(destIp, MASK);
  const local = srcNet === res;

  steps.push({
    phase: "and",
    title: "Step 1: AND operation",
    text: local
      ? `${S.name} does an AND between the destination IP and its own mask, in binary, and compares the result with its own network. ${res} is the same as ${S.name} own network (${srcNet}), so the destination is local. Deliver directly, no gateway needed. Move on to ARP.`
      : `${S.name} does an AND between the destination IP and its own mask, in binary. The result is ${res}, which is different from ${S.name} own network (${srcNet}). The destination is in another network, so ${S.name} would send the packet to its default gateway instead. This topology has no gateway, so the simulation stops here.`,
    packets: [],
    mutations: [],
    and: { destIp, srcNet, res, local },
  });
  if (!local) return steps;

  const D = PCS[dstKey as PcId];
  const others = PC_IDS.filter((p) => p !== srcId && p !== D.id).map((p) => PCS[p]);
  const otherNames = others.map((o) => o.name).join(" and ");
  const floodPorts = [D.port, ...others.map((o) => o.port)].join(", ");

  const learn = (mac: string, port: string) => {
    const isNew = sim.mac[mac] !== port;
    sim.mac[mac] = port;
    return isNew;
  };
  const verb = (isNew: boolean) => (isNew ? "learns" : "already knows");
  const fr = (op: string, sIp: string, dIp: string, sMac: string, dMac: string): [string, string][] => [
    ["Operation", op],
    ["Src IP", sIp],
    ["Dest IP", dIp],
    ["Src MAC", sMac],
    ["Dest MAC", dMac],
  ];

  /* ── Step 2: ARP ── */
  if (sim.arp[srcId][D.ip]) {
    steps.push({
      phase: "arp",
      title: "Step 2: ARP cache hit, no ARP needed",
      text: `${S.name} checks its ARP cache and finds ${D.ip} = ${sim.arp[srcId][D.ip]}. It already knows the destination MAC address, so no ARP request is sent. Go straight to the traffic.`,
      packets: [],
      mutations: [],
    });
  } else {
    const isNewS = learn(S.mac, S.port);
    steps.push({
      phase: "arp",
      title: "Step 2: ARP request (broadcast)",
      text: `${S.name} knows ${D.name} IP address but not its MAC address, and without it the frame cannot be built. ${S.name} checks its ARP cache, which has no entry for ${D.ip}, so it has to ask. It sends an ARP request as a broadcast to ${BCAST_MAC} (${S.name} to everyone). The frame arrives on switch port ${S.port}, so the switch ${verb(isNewS)} the source MAC: ${S.mac} = ${S.port}.`,
      packets: [{ from: S.id, to: "sw", label: "ARP Request", reply: false }],
      frame: fr("ARP request", S.ip, D.ip, S.mac, BCAST_MAC),
      mutations: [{ t: "mac", mac: S.mac, port: S.port }],
    });
    steps.push({
      phase: "arp",
      title: "Step 2: the switch floods the broadcast",
      text: `The destination MAC is the broadcast address, which never appears in a MAC table. The switch floods the frame out of every port except the one it arrived on (${floodPorts}).`,
      packets: [D, ...others].map((p) => ({ from: "sw" as NodeId, to: p.id, label: "ARP Request", reply: false })),
      frame: fr("ARP request", S.ip, D.ip, S.mac, BCAST_MAC),
      mutations: [],
    });
    steps.push({
      phase: "arp",
      title: "Step 2: who accepts the request",
      text: `${otherNames} discards the request because the target IP is not theirs. ${D.name} recognizes its own IP (${D.ip}) and learns ${S.name} into its ARP cache: ${S.ip} = ${S.mac}.`,
      packets: [],
      discard: others.map((o) => o.id),
      accept: [D.id],
      mutations: [{ t: "arp", pc: D.id, ip: S.ip, mac: S.mac }],
    });
    const isNewD = learn(D.mac, D.port);
    steps.push({
      phase: "arp",
      title: "Step 2: ARP reply (unicast)",
      text: `${D.name} sends the ARP reply. It is unicast, not broadcast, because ${D.name} now knows ${S.name} MAC address. The switch receives it on port ${D.port} and ${verb(isNewD)} ${D.mac} = ${D.port}.`,
      packets: [{ from: D.id, to: "sw", label: "ARP Reply", reply: true }],
      frame: fr("ARP reply", D.ip, S.ip, D.mac, S.mac),
      mutations: [{ t: "mac", mac: D.mac, port: D.port }],
    });
    steps.push({
      phase: "arp",
      title: "Step 2: the reply reaches the sender",
      text: `The switch finds ${S.mac} in its MAC table and forwards the reply only out of port ${S.port}. ${S.name} receives it and updates its ARP cache: ${D.ip} = ${D.mac}. ARP is finished.`,
      packets: [{ from: "sw", to: S.id, label: "ARP Reply", reply: true }],
      frame: fr("ARP reply", D.ip, S.ip, D.mac, S.mac),
      accept: [S.id],
      mutations: [{ t: "arp", pc: S.id, ip: D.ip, mac: D.mac }],
    });
  }

  /* ── Step 3: traffic ── */
  const isNewS2 = learn(S.mac, S.port);
  steps.push({
    phase: "traffic",
    title: "Step 3: ICMP echo request",
    text: `${S.name} now has everything it needs and sends the ICMP echo to ${D.name}, using destination MAC ${D.mac}. The switch receives it on port ${S.port}${isNewS2 ? ` and learns ${S.mac} = ${S.port}` : `, where ${S.mac} is already in its table`}.`,
    packets: [{ from: S.id, to: "sw", label: "ICMP echo", reply: false }],
    frame: fr("ICMP echo", S.ip, D.ip, S.mac, D.mac),
    mutations: [{ t: "mac", mac: S.mac, port: S.port }],
  });

  if (sim.mac[D.mac]) {
    steps.push({
      phase: "traffic",
      title: "Step 3: the switch forwards the echo",
      text: `The switch finds ${D.mac} in its MAC table and forwards the frame only out of port ${D.port} to ${D.name}. ${otherNames} never sees it. ${D.name} receives the echo.`,
      packets: [{ from: "sw", to: D.id, label: "ICMP echo", reply: false }],
      frame: fr("ICMP echo", S.ip, D.ip, S.mac, D.mac),
      accept: [D.id],
      mutations: [],
    });
  } else {
    steps.push({
      phase: "traffic",
      title: "Step 3: unknown unicast is flooded",
      text: `The switch has no entry for ${D.mac}, so it does not know which port leads to ${D.name}. It floods the frame out of all other ports (${floodPorts}). ${otherNames} discards it because the destination MAC is not theirs, and ${D.name} accepts it.`,
      packets: [D, ...others].map((p) => ({ from: "sw" as NodeId, to: p.id, label: "ICMP echo", reply: false })),
      frame: fr("ICMP echo", S.ip, D.ip, S.mac, D.mac),
      discard: others.map((o) => o.id),
      accept: [D.id],
      mutations: [],
    });
  }

  const isNewD2 = learn(D.mac, D.port);
  steps.push({
    phase: "traffic",
    title: "Step 3: ICMP echo reply",
    text: `${D.name} answers with the echo reply. The switch receives it on port ${D.port}${isNewD2 ? ` and learns ${D.mac} = ${D.port}` : `, where ${D.mac} is already in its table`}.`,
    packets: [{ from: D.id, to: "sw", label: "ICMP echo reply", reply: true }],
    frame: fr("ICMP echo reply", D.ip, S.ip, D.mac, S.mac),
    mutations: [{ t: "mac", mac: D.mac, port: D.port }],
  });
  steps.push({
    phase: "traffic",
    title: "Step 3: the echo reply reaches the sender",
    text: `The switch finds ${S.mac} in its MAC table and forwards the reply only out of port ${S.port}. ${S.name} receives the echo reply. The ping succeeded.`,
    packets: [{ from: "sw", to: S.id, label: "ICMP echo reply", reply: true }],
    frame: fr("ICMP echo reply", D.ip, S.ip, D.mac, S.mac),
    accept: [S.id],
    mutations: [],
  });

  return steps;
}

/* ───────────────────────── topology drawing ───────────────────────── */

const NODE_BOX: Record<PcId, { x: number; y: number }> = {
  pc1: { x: 20, y: 130 },
  pc2: { x: 560, y: 40 },
  pc3: { x: 560, y: 220 },
};

function Chip({ pkt, idx, stepKey }: { pkt: Pkt; idx: number; stepKey: number }) {
  const color = pkt.reply ? BLUE : RED;
  const pcId = (pkt.from === "sw" ? pkt.to : pkt.from) as PcId;
  const link = LINKS[pcId];
  const [x0, y0] = pkt.from === "sw" ? link.sw : link.pc;
  const [x1, y1] = pkt.from === "sw" ? link.pc : link.sw;
  const w = pkt.label.length * 6 + 18;
  return (
    <g
      key={`${stepKey}-${idx}`}
      className="pf-pkt"
      style={
        {
          "--x0": `${x0}px`,
          "--y0": `${y0}px`,
          "--x1": `${x1}px`,
          "--y1": `${y1}px`,
        } as React.CSSProperties
      }
    >
      <rect
        x={-w / 2}
        y={-11}
        width={w}
        height={22}
        rx={6}
        fill={color}
        stroke="#fff"
        strokeWidth={1.5}
      />
      <text
        textAnchor="middle"
        y={4}
        fontSize={10}
        fontWeight={600}
        fill="#fff"
        fontFamily="ui-monospace, monospace"
      >
        {pkt.label}
      </text>
    </g>
  );
}

function Topology({
  step,
  stepKey,
  tables,
  newKeys,
}: {
  step: SimStep | null;
  stepKey: number;
  tables: Tables;
  newKeys: Set<string>;
}) {
  const linkColor: Partial<Record<PcId, string>> = {};
  step?.packets.forEach((p) => {
    const pc = (p.from === "sw" ? p.to : p.from) as PcId;
    linkColor[pc] = p.reply ? BLUE : RED;
  });
  const active = new Set<NodeId>();
  step?.packets.forEach((p) => {
    active.add(p.from);
    active.add(p.to);
  });
  const markerDelay = step && step.packets.length > 0 ? 1.1 * SLOW : 0;

  const macRows = Object.entries(tables.mac)
    .map(([mac, port]) => ({ mac, port }))
    .sort((a, b) => a.port.localeCompare(b.port));

  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-3">
      <svg viewBox="0 0 720 330" className="mx-auto min-w-[640px] max-w-[820px]" role="img" aria-label="Network topology with three PCs and one switch">
        {/* cables */}
        {PC_IDS.map((id) => (
          <line
            key={id}
            x1={LINKS[id].pc[0]}
            y1={LINKS[id].pc[1]}
            x2={LINKS[id].sw[0]}
            y2={LINKS[id].sw[1]}
            stroke={linkColor[id] ?? "currentColor"}
            strokeOpacity={linkColor[id] ? 1 : 0.45}
            strokeWidth={linkColor[id] ? 3 : 2}
            style={{ transition: "stroke .4s" }}
          />
        ))}

        {/* port labels */}
        <text x={296} y={150} textAnchor="end" fontSize={11} className="fill-foreground" fontFamily="ui-monospace, monospace">0/1</text>
        <text x={420} y={130} fontSize={11} className="fill-foreground" fontFamily="ui-monospace, monospace">0/2</text>
        <text x={420} y={212} fontSize={11} className="fill-foreground" fontFamily="ui-monospace, monospace">0/3</text>

        {/* switch */}
        <text x={360} y={96} textAnchor="middle" fontSize={12} className="fill-foreground" fontFamily="ui-monospace, monospace">ddd</text>
        <circle
          cx={360}
          cy={165}
          r={48}
          className="fill-background"
          stroke={active.has("sw") ? "#f08c00" : "currentColor"}
          strokeWidth={active.has("sw") ? 3.5 : 2}
          style={{ transition: "stroke .4s" }}
        />
        <text x={360} y={171} textAnchor="middle" fontSize={16} fontWeight={600} className="fill-foreground">SW</text>

        {/* switch MAC table */}
        <line x1={360} y1={213} x2={360} y2={236} stroke={RED} strokeWidth={2} />
        <rect x={262} y={236} width={196} height={86} rx={8} className="fill-background" stroke={RED} strokeWidth={2} />
        <text x={274} y={254} fontSize={11} fontWeight={600} fill={RED}>SW MAC table</text>
        {macRows.length === 0 && (
          <text x={274} y={276} fontSize={11} className="fill-foreground">empty</text>
        )}
        {macRows.map((r, i) => {
          const fresh = newKeys.has(`mac:${r.mac}`);
          return (
            <text
              key={r.mac}
              x={274}
              y={272 + i * 16}
              fontSize={11}
              fontWeight={fresh ? 700 : 400}
              fill={fresh ? GREEN : undefined}
              className={fresh ? undefined : "fill-foreground"}
              fontFamily="ui-monospace, monospace"
            >
              {r.port} = {r.mac}
            </text>
          );
        })}

        {/* PCs */}
        {PC_IDS.map((id) => {
          const pc = PCS[id];
          const { x, y } = NODE_BOX[id];
          const isActive = active.has(id);
          const accepted = step?.accept?.includes(id);
          const discarded = step?.discard?.includes(id);
          const stroke = accepted ? GREEN : discarded ? RED : isActive ? "#f08c00" : "currentColor";
          return (
            <g key={id}>
              <rect
                x={x}
                y={y}
                width={140}
                height={70}
                rx={4}
                className="fill-background"
                stroke={stroke}
                strokeWidth={accepted || discarded || isActive ? 3.5 : 2}
                style={{ transition: "stroke .4s" }}
              />
              <text x={x + 70} y={y + 30} textAnchor="middle" fontSize={15} fontWeight={600} className="fill-foreground">{pc.name}</text>
              <text x={x + 70} y={y + 52} textAnchor="middle" fontSize={13} className="fill-foreground" fontFamily="ui-monospace, monospace">{pc.mac}</text>
              <text x={x + 70} y={y + 90} textAnchor="middle" fontSize={11} className="fill-foreground" fontFamily="ui-monospace, monospace">{pc.ip}</text>
              {(accepted || discarded) && (
                <g key={`${stepKey}-${id}`} className="pf-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text
                    x={x + 70}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill={accepted ? GREEN : RED}
                  >
                    {accepted ? "✓ accepts" : "✕ discards"}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* moving packets */}
        {step?.packets.map((p, i) => (
          <Chip key={`${stepKey}-${i}`} pkt={p} idx={i} stepKey={stepKey} />
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────── AND panel ───────────────────────── */

function AndPanel({ srcIp, info }: { srcIp: string; info: AndInfo }) {
  const rows: [string, string, string[]][] = [
    ["Destination IP", info.destIp, toBin(info.destIp)],
    ["Source mask", MASK, toBin(MASK)],
    ["AND result", info.res, toBin(info.res)],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
      <div className="min-w-[520px] font-mono text-[11px]">
        {rows.map(([label, dotted, octets], r) => (
          <div
            key={label}
            className="pf-fade grid grid-cols-[110px_1fr_110px] items-center gap-2 py-1"
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
          className="pf-fade mt-2 flex flex-wrap items-center gap-2 border-t pt-2 font-sans text-xs"
          style={{ animationDelay: `${1.5 * SLOW}s` }}
        >
          <span className="text-muted-foreground">
            Own network ({srcIp} AND {MASK}):
          </span>
          <span className="font-mono font-semibold">{info.srcNet}</span>
          <Badge variant="secondary" style={{ color: info.local ? GREEN : RED }}>
            {info.local ? "Same network: local" : "Different network"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

type Run = { steps: SimStep[]; step: number; src: PcId; dst: PcId | "ext" };

export function PacketFlowSimulator() {
  const [src, setSrc] = useState<PcId>("pc1");
  const [dst, setDst] = useState<PcId | "ext">("pc2");
  const [tables, setTables] = useState<Tables>(emptyTables);
  const [run, setRun] = useState<Run | null>(null);
  const [playing, setPlaying] = useState(false);

  const n = run?.steps.length ?? 0;
  const step = run?.step ?? 0;
  const done = !!run && step >= n;

  // Tables as they stand right now (committed tables + effects of the steps shown)
  const view = run ? applySteps(tables, run.steps.slice(0, step)) : tables;
  const prevView = run ? applySteps(tables, run.steps.slice(0, Math.max(0, step - 1))) : tables;
  const current = run && step > 0 ? run.steps[step - 1] : null;

  const newKeys = new Set<string>();
  if (run && step > 0) {
    for (const mac of Object.keys(view.mac))
      if (prevView.mac[mac] !== view.mac[mac]) newKeys.add(`mac:${mac}`);
    for (const pc of PC_IDS)
      for (const ip of Object.keys(view.arp[pc]))
        if (prevView.arp[pc][ip] !== view.arp[pc][ip]) newKeys.add(`arp:${pc}:${ip}`);
  }

  // Save a finished run's learning into the permanent tables
  const settle = (r: Run | null, t: Tables) =>
    r && r.step >= r.steps.length ? applySteps(t, r.steps) : t;

  const startRun = () => {
    const t = settle(run, tables);
    setTables(t);
    setRun({ steps: build(src, dst, t), step: 1, src, dst });
    setPlaying(false);
  };
  const resetRun = () => {
    setTables(settle(run, tables));
    setRun(null);
    setPlaying(false);
  };
  const changeSrc = (v: PcId) => {
    setSrc(v);
    if (dst === v) setDst(PC_IDS.find((p) => p !== v)!);
    resetRun();
  };
  const changeDst = (v: PcId | "ext") => {
    setDst(v);
    resetRun();
  };
  const clearArp = () => {
    setTables((t) => ({ ...settle(run, t), arp: { pc1: {}, pc2: {}, pc3: {} } }));
    setRun(null);
    setPlaying(false);
  };
  const clearMac = () => {
    setTables((t) => ({ ...settle(run, t), mac: {} }));
    setRun(null);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing || !run) return;
    if (run.step >= run.steps.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(
      () => setRun((r) => (r ? { ...r, step: Math.min(r.steps.length, r.step + 1) } : r)),
      3800,
    );
    return () => clearTimeout(t);
  }, [playing, run]);

  const phases: { id: SimStep["phase"]; label: string }[] = [
    { id: "and", label: "1 · AND" },
    { id: "arp", label: "2 · ARP" },
    { id: "traffic", label: "3 · Traffic" },
  ];
  const order = { and: 0, arp: 1, traffic: 2 } as const;
  const curPhase = current ? order[current.phase] : -1;

  const selectCls =
    "h-9 rounded-md border bg-background px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes pf-move { from { transform: translate(var(--x0), var(--y0)); } to { transform: translate(var(--x1), var(--y1)); } }
        @keyframes pf-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes pf-pop  { from { opacity: 0; } to { opacity: 1; } }
        .pf-pkt  { animation: pf-move ${1.1 * SLOW}s ease-in-out both; }
        .pf-fade { animation: pf-fade ${0.5 * SLOW}s ease-out both; }
        .pf-pop  { animation: pf-pop ${0.4 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .pf-pkt, .pf-fade, .pf-pop { animation: none; } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Packet flow simulator</CardTitle>
            <CardDescription className="mt-1">
              Watch a ping travel through AND, ARP and ICMP inside one network.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Who pings whom */}
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <label className="text-xs font-medium">
            <span className="mb-2 block">From</span>
            <select className={selectCls} value={src} onChange={(e) => changeSrc(e.target.value as PcId)}>
              {PC_IDS.map((p) => (
                <option key={p} value={p}>
                  {PCS[p].name} ({PCS[p].ip})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            <span className="mb-2 block">Ping</span>
            <select className={selectCls} value={dst} onChange={(e) => changeDst(e.target.value as PcId | "ext")}>
              {PC_IDS.filter((p) => p !== src).map((p) => (
                <option key={p} value={p}>
                  {PCS[p].name} ({PCS[p].ip})
                </option>
              ))}
              <option value="ext">{EXT_IP} (another network)</option>
            </select>
          </label>
          <p className="pb-2 text-xs text-muted-foreground">
            Mask for all PCs: <span className="font-mono">{MASK}</span>
          </p>
        </div>

        {/* Phase pills */}
        <div className="flex flex-wrap gap-2">
          {phases.map((p, i) => {
            const state = i === curPhase ? "active" : i < curPhase ? "done" : "todo";
            return (
              <span
                key={p.id}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  state === "active"
                    ? "border-primary bg-primary text-primary-foreground"
                    : state === "done"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {p.label}
              </span>
            );
          })}
        </div>

        {/* Topology */}
        <Topology step={current} stepKey={step} tables={view} newKeys={newKeys} />

        {/* Explanation */}
        <div className="rounded-xl border bg-background p-4">
          {current && run ? (
            <div key={step} className="pf-fade flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Step {step} of {n}
              </p>
              <p className="text-sm font-semibold">{current.title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{current.text}</p>
              {current.and && <AndPanel srcIp={PCS[run.src].ip} info={current.and} />}
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
                          <td key={h} className={`px-3 py-2 font-mono ${i === 0 ? "font-sans font-semibold" : ""}`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {done && (
                <p className="text-xs font-medium" style={{ color: current.and && !current.and.local ? RED : GREEN }}>
                  {current.and && !current.and.local
                    ? "Stopped: the destination is not local."
                    : "Finished. The ARP caches and the switch MAC table keep what they learned. Ping again to see ARP skipped."}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Choose who pings whom and press Start. The tables begin empty, so the first ping needs ARP. Ping the same pair
              again and ARP is skipped. Then clear only the switch MAC table and ping again to watch the switch flood the echo.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!run || step <= 1}
            onClick={() => {
              setPlaying(false);
              setRun((r) => (r ? { ...r, step: Math.max(1, r.step - 1) } : r));
            }}
          >
            Back
          </Button>
          {!run || done ? (
            <Button size="sm" onClick={startRun}>
              {done ? "Ping again" : "Start ping"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setPlaying(false);
                setRun((r) => (r ? { ...r, step: Math.min(r.steps.length, r.step + 1) } : r));
              }}
            >
              Next step
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!run || done}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "Pause" : "Auto-play"}
          </Button>
          <Button size="sm" variant="ghost" onClick={clearArp}>
            Clear ARP caches
          </Button>
          <Button size="sm" variant="ghost" onClick={clearMac}>
            Clear switch MAC table
          </Button>
        </div>

        {/* ARP caches */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">ARP cache of each PC</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {PC_IDS.map((id) => {
              const pc = PCS[id];
              const rows = Object.entries(view.arp[id]);
              return (
                <div key={id} className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-semibold">
                    {pc.name} <span className="font-mono font-normal text-muted-foreground">{pc.mac}</span>
                  </p>
                  {rows.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">empty</p>
                  ) : (
                    rows.map(([ip, mac]) => {
                      const fresh = newKeys.has(`arp:${id}:${ip}`);
                      return (
                        <p
                          key={ip}
                          className={`mt-1 font-mono text-[11px] ${fresh ? "pf-fade font-bold" : "text-muted-foreground"}`}
                          style={fresh ? { color: GREEN } : undefined}
                        >
                          {ip} = {mac}
                        </p>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <ul className="flex flex-col gap-1 pl-5 text-[11px] leading-5 text-muted-foreground marker:text-primary">
          <li>
            Layer 3 broadcast: <span className="font-mono">255.255.255.255</span>. Layer 2 broadcast:{" "}
            <span className="font-mono">{BCAST_MAC}</span>.
          </li>
          <li>Red packets travel toward the destination. Blue packets are the replies.</li>
        </ul>
      </CardContent>
    </Card>
  );
}