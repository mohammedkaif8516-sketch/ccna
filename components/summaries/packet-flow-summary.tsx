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
 * PacketFlowSummary
 *   1 Big picture        : AND, ARP, Traffic. Live AND calculator and truth table
 *   2 Same network       : animated ping PC1 to PC2 (cold caches or warm caches)
 *   3 Between networks   : animated forward and reply path through R1 and R2,
 *                          router behaviour in 7 steps, IP stays / MAC changes
 *   4 PDU names          : segment, datagram, packet, frame, bits being built up
 *   5 Common mistakes    : wrong belief on the front, the truth on the back
 *   6 Interview prep     : the usual questions, filtered by group
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";
const mono = "ui-monospace, monospace";
const HOP = 1.4; // seconds one chip takes to cross one cable
const BCAST_MAC = "ffff.ffff.ffff";
const MASK = "255.255.255.0";

const TABS = [
  { id: "big", label: "1 · Big picture" },
  { id: "same", label: "2 · Same network" },
  { id: "between", label: "3 · Between networks" },
  { id: "pdu", label: "4 · PDU names" },
  { id: "myths", label: "5 · Common mistakes" },
  { id: "interview", label: "6 · Interview prep" },
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

function SimpleTable({ head, rows }: { head: string[]; rows: string[][] }) {
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
            <tr key={i} className="border-t">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold" : "font-mono"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const andIp = (ip: string, mask: string) => {
  const a = ip.split(".").map(Number);
  const m = mask.split(".").map(Number);
  return a.map((o, i) => o & m[i]).join(".");
};
const toBin = (ip: string) => ip.split(".").map((o) => Number(o).toString(2).padStart(8, "0"));

function AndBits({ dest, own, ownNet }: { dest: string; own: string; ownNet?: string }) {
  const res = andIp(dest, MASK);
  const net = ownNet ?? andIp(own, MASK);
  const local = res === net;
  const rows: [string, string, string[]][] = [
    ["Dest IP", dest, toBin(dest)],
    ["Mask", MASK, toBin(MASK)],
    ["AND result", res, toBin(res)],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
      <div key={dest + own} className="min-w-[520px] font-mono text-[11px]">
        {rows.map(([label, dotted, octets], r) => (
          <div key={label} className="ph-fade grid grid-cols-[90px_1fr_110px] items-center gap-2 py-1" style={{ animationDelay: `${r * 0.5}s` }}>
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
        <div className="ph-fade mt-2 flex flex-wrap items-center gap-2 border-t pt-2 font-sans text-xs" style={{ animationDelay: "1.5s" }}>
          <span className="text-muted-foreground">Own network ({own} AND {MASK}):</span>
          <span className="font-mono font-semibold">{net}</span>
          <Badge variant="secondary" style={{ color: local ? GREEN : RED }}>
            {local ? "Same network: local" : "Different network: remote"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 1 · big picture ───────────────────────── */

const DESTS = ["192.168.1.2", "192.168.2.1", "10.0.0.5"];

function BigSection() {
  const [dest, setDest] = useState(DESTS[0]);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const local = andIp(dest, MASK) === "192.168.1.0";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Three steps, every time</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Any host sending to any destination walks the same sequence before a single bit of real data goes on the wire.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["1", "AND", "Is the destination local or remote?"],
            ["2", "ARP", "What MAC address do I need?"],
            ["3", "Traffic", "Send the actual data."],
          ].map(([n, t, d], i) => (
            <div key={t} className="ph-glow rounded-xl border bg-background p-3" style={{ animationDelay: `${i * 2}s` }}>
              <p className="text-xs text-muted-foreground">Step {n}</p>
              <p className="text-sm font-semibold">{t}</p>
              <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium text-primary">
          Same subnet: ARP for the destination itself. Remote: ARP for the default gateway.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Try the AND yourself</p>
        <p className="mt-1 text-xs text-muted-foreground">PC1 is 192.168.1.1 with mask {MASK}. Pick a destination.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DESTS.map((d) => (
            <Pick key={d} active={dest === d} onClick={() => setDest(d)}>{d}</Pick>
          ))}
        </div>
        <div className="mt-3">
          <AndBits dest={dest} own="192.168.1.1" />
        </div>
        <div key={dest} className="ph-fade mt-3 rounded-lg border px-3 py-2 text-xs leading-5" style={{ borderColor: local ? GREEN : RED, animationDelay: "1.7s" }}>
          {local ? (
            <>
              <span className="font-semibold" style={{ color: GREEN }}>Local. </span>
              Deliver directly, no gateway. PC1 ARPs for <span className="font-mono">{dest}</span> itself.
            </>
          ) : (
            <>
              <span className="font-semibold" style={{ color: RED }}>Remote. </span>
              PC1 hands the frame to its default gateway. PC1 ARPs for <span className="font-mono">192.168.1.100</span>, not for {dest}.
            </>
          )}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">AND truth table</p>
          <p className="mt-1 text-xs text-muted-foreground">Tap A and B to flip the bits.</p>
          <div className="mt-3 flex items-center gap-2 font-mono text-sm">
            <button type="button" onClick={() => setA((v) => 1 - v)} className="h-9 w-9 rounded-md border font-bold transition-colors hover:border-primary/60" style={{ background: a ? `${GREEN}22` : undefined }}>{a}</button>
            <span className="text-muted-foreground">AND</span>
            <button type="button" onClick={() => setB((v) => 1 - v)} className="h-9 w-9 rounded-md border font-bold transition-colors hover:border-primary/60" style={{ background: b ? `${GREEN}22` : undefined }}>{b}</button>
            <span className="text-muted-foreground">=</span>
            <span key={`${a}${b}`} className="ph-pop flex h-9 w-9 items-center justify-center rounded-md border-2 font-bold" style={{ borderColor: a & b ? GREEN : RED, color: a & b ? GREEN : RED }}>{a & b}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Only 1 AND 1 gives 1. The mask keeps the network bits and zeroes the host bits.</p>
          <p className="mt-1 text-xs font-medium">Result equals the host's own network: the destination is local.</p>
        </Panel>

        <Panel>
          <p className="text-sm font-semibold">Broadcast addresses</p>
          <div className="mt-3">
            <SimpleTable head={["Layer", "Broadcast"]} rows={[["Layer 3 (IP)", "255.255.255.255"], ["Layer 2 (MAC)", BCAST_MAC]]} />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            An ARP request is a Layer 2 broadcast (destination MAC {BCAST_MAC}). ARP does not use an IP header at all, so
            255.255.255.255 is for IP traffic such as a DHCP discover.
          </p>
        </Panel>
      </div>

      <Tip title="The golden rule">IP addresses stay the same end to end. MAC addresses change at every hop.</Tip>
    </div>
  );
}

/* ───────────────────────── simulation engine ───────────────────────── */

type NodeSpec = { x: number; y: number; kind: "pc" | "gw" | "sw" | "router"; name: string; sub?: string; w?: number; h?: number; r?: number };
type Pkt = { from: string; to: string; label: string; reply?: boolean; delay?: number };
type Mut = { t: "arp"; dev: string; ip: string; mac: string } | { t: "mac"; sw: string; mac: string; port: string };
type SStep = {
  tag?: string;
  title: string;
  text: string;
  packets: Pkt[];
  focus?: string[];
  accept?: string[];
  discard?: string[];
  frame?: [string, string][];
  route?: { rows: string[][]; hit: number };
  and?: { dest: string; own: string; ownNet?: string };
  mut?: Mut[];
  used?: string[];
  arpReq?: boolean;
};
type Tables = { arp: Record<string, Record<string, string>>; mac: Record<string, Record<string, string>> };
type SimSpec = {
  vb: [number, number];
  minW: number;
  nodes: Record<string, NodeSpec>;
  links: [string, string][];
  ports: [string, string, string][]; // switch, neighbour, label
  labels: [number, number, string, "start" | "middle" | "end"][];
  arpDevs: { id: string; name: string; mac: string }[];
  swDevs: { id: string; name: string }[];
  start: Tables;
  steps: SStep[];
  done: string;
};

const fr = (op: string, sIp: string, dIp: string, sMac: string, dMac: string, ttl?: string): [string, string][] => {
  const rows: [string, string][] = [["Type", op], ["Src IP", sIp], ["Dest IP", dIp], ["Src MAC", sMac], ["Dest MAC", dMac]];
  if (ttl) rows.push(["TTL", ttl]);
  return rows;
};

function applyMuts(base: Tables, steps: SStep[]): Tables {
  const t: Tables = { arp: {}, mac: {} };
  for (const k of Object.keys(base.arp)) t.arp[k] = { ...base.arp[k] };
  for (const k of Object.keys(base.mac)) t.mac[k] = { ...base.mac[k] };
  for (const s of steps)
    for (const m of s.mut ?? []) {
      if (m.t === "arp") t.arp[m.dev][m.ip] = m.mac;
      else t.mac[m.sw][m.mac] = m.port;
    }
  return t;
}

function edgePts(nodes: Record<string, NodeSpec>, a: string, b: string): [number, number, number, number] {
  const A = nodes[a];
  const B = nodes[b];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const rad = (n: NodeSpec) =>
    n.r ? n.r + 3 : Math.min((n.w! / 2) / (Math.abs(ux) || 1e-6), (n.h! / 2) / (Math.abs(uy) || 1e-6)) + 3;
  return [A.x + ux * rad(A), A.y + uy * rad(A), B.x - ux * rad(B), B.y - uy * rad(B)];
}

function SimDiagram({ sim, step, stepKey }: { sim: SimSpec; step: SStep | null; stepKey: string }) {
  const { nodes } = sim;
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
      <svg viewBox={`0 0 ${sim.vb[0]} ${sim.vb[1]}`} className="mx-auto w-full" style={{ minWidth: sim.minW, maxWidth: sim.vb[0] + 40 }} role="img" aria-label="Network diagram">
        {sim.links.map(([a, b]) => {
          const k = [a, b].sort().join("-");
          const [x0, y0, x1, y1] = edgePts(nodes, a, b);
          const c = linkColor[k];
          return (
            <line key={k} x1={x0} y1={y0} x2={x1} y2={y1} stroke={c ?? "currentColor"} strokeOpacity={c ? 1 : 0.45} strokeWidth={c ? 3 : 2} style={{ transition: "stroke .4s" }} />
          );
        })}

        {sim.ports.map(([sw, other, label]) => {
          const s = nodes[sw];
          const o = nodes[other];
          const dx = o.x - s.x;
          const dy = o.y - s.y;
          const len = Math.hypot(dx, dy);
          const ux = dx / len;
          const uy = dy / len;
          const px = s.x + ux * ((s.r ?? 33) + 20) - uy * 11;
          const py = s.y + uy * ((s.r ?? 33) + 20) + ux * 11 + 4;
          return (
            <text key={sw + other} x={px} y={py} textAnchor="middle" fontSize={11} fontFamily={mono} className="fill-foreground">{label}</text>
          );
        })}

        {sim.labels.map(([x, y, t, anchor], i) => (
          <text key={i} x={x} y={y} textAnchor={anchor} fontSize={11} fontFamily={mono} className="fill-foreground">{t}</text>
        ))}

        {Object.entries(nodes).map(([id, n]) => {
          const on = active.has(id);
          const ok = step?.accept?.includes(id);
          const no = step?.discard?.includes(id);
          const stroke = ok ? GREEN : no ? RED : on ? AMBER : "currentColor";
          const sw = ok || no || on ? 3.5 : 2;
          const isBox = !n.r;
          const big = isBox && (n.h ?? 0) >= 60;
          const top = isBox ? n.y - n.h! / 2 - 8 : n.y - n.r! - 10;
          const lines = (n.sub ?? "").split(" · ");
          return (
            <g key={id}>
              {isBox ? (
                <rect x={n.x - n.w! / 2} y={n.y - n.h! / 2} width={n.w} height={n.h} rx={4} className="fill-background" stroke={stroke} strokeWidth={sw} style={{ transition: "stroke .4s" }} />
              ) : (
                <circle cx={n.x} cy={n.y} r={n.r} className="fill-background" stroke={stroke} strokeWidth={sw} style={{ transition: "stroke .4s" }} />
              )}
              <text x={n.x} y={big ? n.y - 8 : n.y + 5} textAnchor="middle" fontSize={n.kind === "router" ? 14 : 14} fontWeight={600} className="fill-foreground">{n.name}</text>
              {n.sub && big &&
                lines.map((l, i) => (
                  <text key={i} x={n.x} y={n.y + 11 + i * 17} textAnchor="middle" fontSize={12} fontFamily={mono} className="fill-foreground">{l}</text>
                ))}
              {n.sub && !big && (
                <text x={n.x} y={n.y + (isBox ? n.h! / 2 + 15 : n.r! + 16)} textAnchor="middle" fontSize={11} fontFamily={mono} className="fill-foreground">{n.sub}</text>
              )}
              {(ok || no) && (
                <g key={`${stepKey}-${id}`} className="ph-pop" style={{ animationDelay: `${markerDelay}s` }}>
                  <text x={n.x} y={top} textAnchor="middle" fontSize={12} fontWeight={700} fill={ok ? GREEN : RED}>{ok ? "✓ accepts" : "✕ discards"}</text>
                </g>
              )}
            </g>
          );
        })}

        {step?.packets.map((p, i) => {
          const [x0, y0, x1, y1] = edgePts(nodes, p.from, p.to);
          const w = p.label.length * 6 + 18;
          return (
            <g
              key={`${stepKey}-${i}`}
              className="ph-pkt"
              style={{ "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px`, animationDelay: `${(p.delay ?? 0) * HOP}s` } as CSSProperties}
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

function Sim({ sim, intro }: { sim: SimSpec; intro: string }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const n = sim.steps.length;
  const done = step >= n;
  const current = step > 0 ? sim.steps[step - 1] : null;

  const view = applyMuts(sim.start, sim.steps.slice(0, step));
  const prev = applyMuts(sim.start, sim.steps.slice(0, Math.max(0, step - 1)));
  const fresh = new Set<string>();
  if (step > 0) {
    for (const sw of Object.keys(view.mac))
      for (const m of Object.keys(view.mac[sw])) if (prev.mac[sw][m] !== view.mac[sw][m]) fresh.add(`mac:${sw}:${m}`);
    for (const d of Object.keys(view.arp))
      for (const ip of Object.keys(view.arp[d])) if (prev.arp[d][ip] !== view.arp[d][ip]) fresh.add(`arp:${d}:${ip}`);
  }
  const used = new Set(current?.used ?? []);
  const arpSent = sim.steps.slice(0, step).filter((s) => s.arpReq).length;

  useEffect(() => {
    if (!playing) return;
    if (step >= n) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(n, s + 1)), 5500);
    return () => clearTimeout(t);
  }, [playing, step, n]);

  const rowCls = (k: string) =>
    fresh.has(k) ? "ph-fade font-bold" : used.has(k) ? "font-bold" : "text-muted-foreground";
  const rowCol = (k: string) => (fresh.has(k) ? GREEN : used.has(k) ? AMBER : undefined);

  return (
    <div className="flex flex-col gap-4">
      <SimDiagram sim={sim} step={current} stepKey={`${step}`} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">ARP requests sent: <span className="ml-1 font-mono font-bold" style={{ color: arpSent === 0 ? GREEN : AMBER }}>{arpSent}</span></Badge>
        {step > 0 && <Badge variant="secondary">Step {step} of {n}</Badge>}
      </div>

      <Panel>
        {current ? (
          <div key={step} className="ph-fade flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {current.tag && <Badge variant="secondary">{current.tag}</Badge>}
              <p className="text-sm font-semibold">{current.title}</p>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{current.text}</p>
            {current.and && <AndBits dest={current.and.dest} own={current.and.own} ownNet={current.and.ownNet} />}
            {current.route && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[420px] text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Routing table: network</th>
                      <th className="px-3 py-2 text-left font-medium">Next hop / exit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.route.rows.map(([net, via], i) => (
                      <tr key={net} className="border-t" style={i === current.route!.hit ? { color: GREEN, fontWeight: 600 } : undefined}>
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
                <table className="w-full min-w-[420px] text-xs">
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
            {done && <p className="text-xs font-medium" style={{ color: GREEN }}>{sim.done}</p>}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">{intro}</p>
        )}
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={step <= 1} onClick={() => { setPlaying(false); setStep((s) => Math.max(1, s - 1)); }}>Back</Button>
        {done ? (
          <Button size="sm" onClick={() => { setPlaying(false); setStep(1); }}>Replay</Button>
        ) : (
          <Button size="sm" onClick={() => { setPlaying(false); setStep((s) => Math.min(n, s + 1)); }}>{step === 0 ? "Start" : "Next step"}</Button>
        )}
        <Button size="sm" variant="outline" disabled={step === 0 || done} onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Auto-play"}</Button>
        <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => { setPlaying(false); setStep(0); }}>Reset</Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">ARP table of each device</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sim.arpDevs.map((d) => {
            const rows = Object.entries(view.arp[d.id]);
            return (
              <div key={d.id} className="rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">{d.name} <span className="font-mono font-normal text-muted-foreground">{d.mac}</span></p>
                {rows.length === 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">empty</p>
                ) : (
                  rows.map(([ip, mac]) => (
                    <p key={ip} className={`mt-1 font-mono text-[11px] ${rowCls(`arp:${d.id}:${ip}`)}`} style={{ color: rowCol(`arp:${d.id}:${ip}`) }}>{ip} = {mac}</p>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">MAC table of each switch</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {sim.swDevs.map((d) => {
            const rows = Object.entries(view.mac[d.id]).sort((a, b) => a[1].localeCompare(b[1]));
            return (
              <div key={d.id} className="rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">{d.name}</p>
                {rows.length === 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">empty</p>
                ) : (
                  rows.map(([mac, port]) => (
                    <p key={mac} className={`mt-1 font-mono text-[11px] ${rowCls(`mac:${d.id}:${mac}`)}`} style={{ color: rowCol(`mac:${d.id}:${mac}`) }}>{port} = {mac}</p>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Red chips travel toward the destination, blue chips are replies. New table entries are green, entries read at this step are amber.
      </p>
    </div>
  );
}

/* ───────────────────────── 2 · same network ───────────────────────── */

const G1_NODES: Record<string, NodeSpec> = {
  sw: { x: 220, y: 115, kind: "sw", name: "SW1", r: 36 },
  pc1: { x: 65, y: 50, kind: "pc", name: "PC1", sub: "aaa · 1.1", w: 90, h: 38 },
  pc3: { x: 65, y: 185, kind: "pc", name: "PC3", sub: "ccc · 1.3", w: 90, h: 38 },
  pc2: { x: 375, y: 50, kind: "pc", name: "PC2", sub: "bbb · 1.2", w: 90, h: 38 },
  gw: { x: 375, y: 185, kind: "gw", name: "Gateway", sub: "ddd · 1.100", w: 90, h: 38 },
};
const G1_LINKS: [string, string][] = [["sw", "pc1"], ["sw", "pc3"], ["sw", "pc2"], ["sw", "gw"]];
const G1_PORTS: [string, string, string][] = [["sw", "pc1", "0/0"], ["sw", "pc3", "0/1"], ["sw", "pc2", "0/2"], ["sw", "gw", "0/3"]];
const G1_FULL: Tables = { arp: { pc1: { "1.2": "bbb" }, pc2: { "1.1": "aaa" } }, mac: { sw: { aaa: "0/0", bbb: "0/2" } } };
const G1_EMPTY: Tables = { arp: { pc1: {}, pc2: {} }, mac: { sw: {} } };

function sameSim(warm: boolean): SimSpec {
  const and: SStep = {
    tag: "1 · AND",
    title: "AND operation",
    text: "PC1 ANDs the destination IP with its own mask. The result 192.168.1.0 is its own network, so PC2 is local. Deliver directly, no gateway needed.",
    packets: [],
    focus: ["pc1"],
    and: { dest: "192.168.1.2", own: "192.168.1.1" },
  };
  const steps: SStep[] = warm
    ? [
        and,
        {
          tag: "2 · ARP skipped",
          title: "ARP cache hit",
          text: "PC1 checks its ARP cache and finds 1.2 = bbb. It already knows the destination MAC, so no ARP request is sent. ARP entries age out after a few minutes, so long conversations rarely re-ARP.",
          packets: [],
          focus: ["pc1"],
          used: ["arp:pc1:1.2"],
        },
        {
          tag: "4 · ICMP echo",
          title: "ICMP echo, straight to PC2",
          text: "The switch already knows bbb = 0/2, so the echo frame goes only out of port 0/2. PC3 and the gateway never see it.",
          packets: [{ from: "pc1", to: "sw", label: "ICMP echo" }, { from: "sw", to: "pc2", label: "ICMP echo", delay: 1 }],
          frame: fr("ICMP echo", "192.168.1.1", "192.168.1.2", "aaa", "bbb"),
          accept: ["pc2"],
          used: ["mac:sw:aaa", "mac:sw:bbb"],
        },
        {
          tag: "5 · ICMP echo reply",
          title: "ICMP echo reply",
          text: "PC2 replies. Both sides have each other's MACs, so there is no ARP. The switch forwards only out of port 0/0.",
          packets: [{ from: "pc2", to: "sw", label: "Echo reply", reply: true }, { from: "sw", to: "pc1", label: "Echo reply", reply: true, delay: 1 }],
          frame: fr("ICMP echo reply", "192.168.1.2", "192.168.1.1", "bbb", "aaa"),
          accept: ["pc1"],
          used: ["mac:sw:aaa", "mac:sw:bbb"],
        },
      ]
    : [
        and,
        {
          tag: "2 · ARP request",
          title: "ARP request (broadcast)",
          text: "PC1 does not know PC2's MAC, so it asks everyone: who has 192.168.1.2? The destination MAC is the broadcast address. The frame arrives on port 0/0, so the switch learns aaa = 0/0.",
          packets: [{ from: "pc1", to: "sw", label: "ARP Request" }],
          frame: fr("ARP request", "192.168.1.1", "192.168.1.2", "aaa", BCAST_MAC),
          mut: [{ t: "mac", sw: "sw", mac: "aaa", port: "0/0" }],
          arpReq: true,
        },
        {
          tag: "2 · ARP request",
          title: "The switch floods the broadcast",
          text: "A broadcast is never in a MAC table, so the switch floods it out of every other port (0/1, 0/2, 0/3). PC3 and the gateway discard it because the target IP is not theirs. PC2 recognizes its own IP and learns PC1 into its ARP cache: 1.1 = aaa.",
          packets: [
            { from: "sw", to: "pc3", label: "ARP Request" },
            { from: "sw", to: "pc2", label: "ARP Request" },
            { from: "sw", to: "gw", label: "ARP Request" },
          ],
          frame: fr("ARP request", "192.168.1.1", "192.168.1.2", "aaa", BCAST_MAC),
          discard: ["pc3", "gw"],
          accept: ["pc2"],
          mut: [{ t: "arp", dev: "pc2", ip: "1.1", mac: "aaa" }],
        },
        {
          tag: "3 · ARP reply",
          title: "ARP reply (unicast)",
          text: "PC2 replies directly to PC1's MAC, not to everyone, because the request already told it who asked. The reply arrives on port 0/2, so the switch learns bbb = 0/2.",
          packets: [{ from: "pc2", to: "sw", label: "ARP Reply", reply: true }],
          frame: fr("ARP reply", "192.168.1.2", "192.168.1.1", "bbb", "aaa"),
          mut: [{ t: "mac", sw: "sw", mac: "bbb", port: "0/2" }],
        },
        {
          tag: "3 · ARP reply",
          title: "The reply reaches PC1",
          text: "The switch knows aaa = 0/0 and forwards the reply out of one port only. PC1 saves 1.2 = bbb. ARP is finished.",
          packets: [{ from: "sw", to: "pc1", label: "ARP Reply", reply: true }],
          frame: fr("ARP reply", "192.168.1.2", "192.168.1.1", "bbb", "aaa"),
          accept: ["pc1"],
          mut: [{ t: "arp", dev: "pc1", ip: "1.2", mac: "bbb" }],
        },
        {
          tag: "4 · ICMP echo",
          title: "ICMP echo",
          text: "PC1 now has PC2's MAC. The switch already knows where PC2 lives, so the echo goes only out of port 0/2.",
          packets: [{ from: "pc1", to: "sw", label: "ICMP echo" }, { from: "sw", to: "pc2", label: "ICMP echo", delay: 1 }],
          frame: fr("ICMP echo", "192.168.1.1", "192.168.1.2", "aaa", "bbb"),
          accept: ["pc2"],
          used: ["mac:sw:aaa", "mac:sw:bbb"],
        },
        {
          tag: "5 · ICMP echo reply",
          title: "ICMP echo reply",
          text: "PC2 sends the reply back. No ARP is needed, because both sides already have each other's MAC. The switch forwards only out of port 0/0.",
          packets: [{ from: "pc2", to: "sw", label: "Echo reply", reply: true }, { from: "sw", to: "pc1", label: "Echo reply", reply: true, delay: 1 }],
          frame: fr("ICMP echo reply", "192.168.1.2", "192.168.1.1", "bbb", "aaa"),
          accept: ["pc1"],
          used: ["mac:sw:aaa", "mac:sw:bbb"],
        },
      ];
  return {
    vb: [440, 235],
    minW: 380,
    nodes: G1_NODES,
    links: G1_LINKS,
    ports: G1_PORTS,
    labels: [],
    arpDevs: [{ id: "pc1", name: "PC1", mac: "aaa" }, { id: "pc2", name: "PC2", mac: "bbb" }],
    swDevs: [{ id: "sw", name: "SW1" }],
    start: warm ? G1_FULL : G1_EMPTY,
    steps,
    done: warm
      ? "Done. With every cache full, the ping needs no ARP at all."
      : "Done. Ping succeeds, and there was no ARP in steps 4 or 5 because the caches were full by then. Tables keep what they learned: try the warm run.",
  };
}

function SameSection() {
  const [warm, setWarm] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">PC1 pings PC2 on the same LAN</p>
        <p className="mt-1 text-xs text-muted-foreground">Topology: PC1 (1.1), PC2 (1.2), PC3 (1.3) and the gateway (1.100) on SW1. Five packets on the wire.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={!warm} onClick={() => setWarm(false)}>Cold start: empty tables</Pick>
          <Pick active={warm} onClick={() => setWarm(true)}>Warm start: caches full</Pick>
        </div>
      </Panel>
      <Sim key={String(warm)} sim={sameSim(warm)} intro="Press Start to follow the ping. On a cold start every table is empty, so PC1 has to ARP first. Switch to the warm start to see ARP skipped." />
      <Tip>The switch learns from the SOURCE MAC of every frame it sees, requests and replies alike. It does not care about the message type.</Tip>
    </div>
  );
}

/* ───────────────────────── 3 · between networks ───────────────────────── */

const G2_NODES: Record<string, NodeSpec> = {
  r1: { x: 145, y: 125, kind: "router", name: "R1", r: 45 },
  r2: { x: 695, y: 125, kind: "router", name: "R2", r: 45 },
  sw1: { x: 145, y: 335, kind: "sw", name: "SW1", r: 45 },
  sw2: { x: 695, y: 335, kind: "sw", name: "SW2", r: 45 },
  pc1: { x: 70, y: 510, kind: "pc", name: "PC1", sub: "aaa · [1.1]", w: 110, h: 76 },
  pc2: { x: 230, y: 510, kind: "pc", name: "PC2", sub: "bbb · [1.2]", w: 110, h: 76 },
  pc3: { x: 630, y: 510, kind: "pc", name: "PC3", sub: "ggg · [2.1]", w: 110, h: 76 },
  pc4: { x: 780, y: 510, kind: "pc", name: "PC4", sub: "hhh · [2.2]", w: 110, h: 76 },
};
const G2_LINKS: [string, string][] = [["r1", "r2"], ["r1", "sw1"], ["r2", "sw2"], ["sw1", "pc1"], ["sw1", "pc2"], ["sw2", "pc3"], ["sw2", "pc4"]];
const G2_PORTS: [string, string, string][] = [
  ["sw1", "r1", "0/3"], ["sw1", "pc1", "0/0"], ["sw1", "pc2", "0/2"],
  ["sw2", "r2", "0/0"], ["sw2", "pc3", "0/1"], ["sw2", "pc4", "0/2"],
];
const G2_LABELS: [number, number, string, "start" | "middle" | "end"][] = [
  [420, 108, "3.0", "middle"], [205, 116, ".1", "start"], [205, 136, "ddd", "start"], [635, 116, ".2", "end"], [635, 136, "eee", "end"],
  [155, 195, ".100", "start"], [155, 213, "ccc", "start"], [705, 195, ".100", "start"], [705, 213, "nnn", "start"],
  [10, 335, "1.0/24", "start"], [830, 335, "2.0/24", "end"],
];
const G2_EMPTY: Tables = { arp: { pc1: {}, r1: {}, r2: {}, pc3: {} }, mac: { sw1: {}, sw2: {} } };

const G2_FWD: SStep[] = [
  {
    tag: "PC1 · AND",
    title: "AND: the destination is remote",
    text: "PC1 ANDs 192.168.2.1 with its mask and gets 192.168.2.0, which is not its own network 192.168.1.0. PC3 is on a different network, so PC1 must hand the frame to its default gateway (192.168.1.100).",
    packets: [],
    focus: ["pc1"],
    and: { dest: "192.168.2.1", own: "192.168.1.1" },
  },
  {
    tag: "PC1 · ARP",
    title: "PC1 ARPs for the gateway, not for PC3",
    text: "PC1 knows the gateway IP but not its MAC. The gateway is in the same network, so this is Layer 2 and needs a MAC address. SW1 learns aaa = 0/0.",
    packets: [{ from: "pc1", to: "sw1", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.1.1", "192.168.1.100", "aaa", BCAST_MAC),
    mut: [{ t: "mac", sw: "sw1", mac: "aaa", port: "0/0" }],
    arpReq: true,
  },
  {
    tag: "PC1 · ARP",
    title: "SW1 floods, only R1 answers",
    text: "SW1 floods the broadcast out of 0/2 and 0/3. PC2 ignores it. R1 sees its own IP and answers. R1 also learns from the request and saves 1.1 = aaa.",
    packets: [{ from: "sw1", to: "pc2", label: "ARP Request" }, { from: "sw1", to: "r1", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.1.1", "192.168.1.100", "aaa", BCAST_MAC),
    discard: ["pc2"],
    accept: ["r1"],
    mut: [{ t: "arp", dev: "r1", ip: "1.1", mac: "aaa" }],
  },
  {
    tag: "PC1 · ARP",
    title: "R1 replies (unicast)",
    text: "R1 replies with the MAC of its 1.100 interface: ccc. SW1 learns ccc = 0/3.",
    packets: [{ from: "r1", to: "sw1", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.1.100", "192.168.1.1", "ccc", "aaa"),
    mut: [{ t: "mac", sw: "sw1", mac: "ccc", port: "0/3" }],
  },
  {
    tag: "PC1 · ARP",
    title: "The reply reaches PC1",
    text: "SW1 forwards the reply only out of 0/0. PC1 saves 1.100 = ccc in its ARP cache.",
    packets: [{ from: "sw1", to: "pc1", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.1.100", "192.168.1.1", "ccc", "aaa"),
    accept: ["pc1"],
    mut: [{ t: "arp", dev: "pc1", ip: "1.100", mac: "ccc" }],
  },
  {
    tag: "PC1 · Send",
    title: "ICMP echo goes to the gateway",
    text: "The destination IP is PC3 (the final target), but the destination MAC is ccc (the gateway, not PC3). PC1 is saying: deliver this to R1, who will take it toward 2.1. SW1 already knows ccc = 0/3.",
    packets: [{ from: "pc1", to: "sw1", label: "ICMP echo" }, { from: "sw1", to: "r1", label: "ICMP echo", delay: 1 }],
    frame: fr("ICMP echo", "192.168.1.1", "192.168.2.1", "aaa", "ccc", "64"),
    accept: ["r1"],
    used: ["mac:sw1:ccc"],
  },
  {
    tag: "R1 · Route",
    title: "R1 strips, reads the IP, picks the next hop",
    text: "R1 removes the old Ethernet header and reads Dest IP 2.1. The routing table says 192.168.2.0/24 via next hop 3.2. Its ARP table only has 1.1 = aaa, but it needs the MAC of 3.2.",
    packets: [],
    focus: ["r1"],
    route: { rows: [["192.168.1.0/24", "connected (0/0)"], ["192.168.2.0/24", "via 192.168.3.2"], ["192.168.3.0/24", "connected"]], hit: 1 },
  },
  {
    tag: "R1 · ARP",
    title: "R1 ARPs for the next hop (3.2), not for 2.1",
    text: "There is no switch on the 3.0 link, so the broadcast goes straight to R2. R2 learns 3.1 = ddd from the request.",
    packets: [{ from: "r1", to: "r2", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.3.1", "192.168.3.2", "ddd", BCAST_MAC),
    accept: ["r2"],
    mut: [{ t: "arp", dev: "r2", ip: "3.1", mac: "ddd" }],
    arpReq: true,
  },
  {
    tag: "R1 · ARP",
    title: "R2 replies",
    text: "R2 answers with the MAC of its 3.2 interface: eee. R1 saves 3.2 = eee.",
    packets: [{ from: "r2", to: "r1", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.3.2", "192.168.3.1", "eee", "ddd"),
    accept: ["r1"],
    mut: [{ t: "arp", dev: "r1", ip: "3.2", mac: "eee" }],
  },
  {
    tag: "R1 · Forward",
    title: "R1 forwards the echo to R2 with a fresh frame",
    text: "The IPs are unchanged, the MACs are new (ddd to eee), and the TTL drops by 1.",
    packets: [{ from: "r1", to: "r2", label: "ICMP echo" }],
    frame: fr("ICMP echo", "192.168.1.1", "192.168.2.1", "ddd", "eee", "63"),
    accept: ["r2"],
  },
  {
    tag: "R2 · Route",
    title: "R2 strips, reads the IP, finds PC3 is directly connected",
    text: "The destination MAC eee is R2's own, so it accepts the frame, removes the header and reads Dest IP 2.1. The 2.0 network is directly connected on its 2.100 interface, so no next router is needed. It has no MAC for 2.1 yet.",
    packets: [],
    focus: ["r2"],
    route: { rows: [["192.168.1.0/24", "via 192.168.3.1"], ["192.168.2.0/24", "connected (0/0, 2.100)"], ["192.168.3.0/24", "connected"]], hit: 1 },
  },
  {
    tag: "R2 · ARP",
    title: "R2 ARPs for PC3",
    text: "R2 broadcasts from its 2.100 interface (MAC nnn). SW2 learns nnn = 0/0.",
    packets: [{ from: "r2", to: "sw2", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.2.100", "192.168.2.1", "nnn", BCAST_MAC),
    mut: [{ t: "mac", sw: "sw2", mac: "nnn", port: "0/0" }],
    arpReq: true,
  },
  {
    tag: "R2 · ARP",
    title: "SW2 floods, PC3 answers",
    text: "SW2 floods out of 0/1 and 0/2. PC4 ignores it. PC3 recognizes its own IP and learns 2.100 = nnn.",
    packets: [{ from: "sw2", to: "pc3", label: "ARP Request" }, { from: "sw2", to: "pc4", label: "ARP Request" }],
    frame: fr("ARP request", "192.168.2.100", "192.168.2.1", "nnn", BCAST_MAC),
    accept: ["pc3"],
    discard: ["pc4"],
    mut: [{ t: "arp", dev: "pc3", ip: "2.100", mac: "nnn" }],
  },
  {
    tag: "R2 · ARP",
    title: "PC3 replies (unicast)",
    text: "PC3 replies straight to nnn. SW2 learns ggg = 0/1.",
    packets: [{ from: "pc3", to: "sw2", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.2.1", "192.168.2.100", "ggg", "nnn"),
    mut: [{ t: "mac", sw: "sw2", mac: "ggg", port: "0/1" }],
  },
  {
    tag: "R2 · ARP",
    title: "The reply reaches R2",
    text: "SW2 forwards the reply only out of 0/0. R2 saves 2.1 = ggg.",
    packets: [{ from: "sw2", to: "r2", label: "ARP Reply", reply: true }],
    frame: fr("ARP reply", "192.168.2.1", "192.168.2.100", "ggg", "nnn"),
    accept: ["r2"],
    mut: [{ t: "arp", dev: "r2", ip: "2.1", mac: "ggg" }],
  },
  {
    tag: "R2 · Forward",
    title: "R2 delivers the echo to PC3",
    text: "SW2 already knows ggg = 0/1, so it forwards the frame only out of 0/1. PC4 never sees it. PC3 accepts it because the MAC and the IP both match. The TTL is now 62.",
    packets: [{ from: "r2", to: "sw2", label: "ICMP echo" }, { from: "sw2", to: "pc3", label: "ICMP echo", delay: 1 }],
    frame: fr("ICMP echo", "192.168.1.1", "192.168.2.1", "nnn", "ggg", "62"),
    accept: ["pc3"],
    used: ["mac:sw2:ggg"],
  },
];

const G2_REPLY: SStep[] = [
  {
    tag: "PC3 · AND",
    title: "AND: PC1 is remote",
    text: "PC3 ANDs 192.168.1.1 with its mask and gets 192.168.1.0, which is not its own network 192.168.2.0. It must send the reply to its default gateway (R2, 2.100).",
    packets: [],
    focus: ["pc3"],
    and: { dest: "192.168.1.1", own: "192.168.2.1" },
  },
  {
    tag: "PC3 · ARP cache",
    title: "ARP cache hit, no ARP needed",
    text: "PC3 needs the MAC of the gateway 2.100. It is already in its cache (2.100 = nnn), learned from R2's ARP request on the forward path.",
    packets: [],
    focus: ["pc3"],
    used: ["arp:pc3:2.100"],
  },
  {
    tag: "PC3 · Send",
    title: "PC3 sends the echo reply to R2",
    text: "The destination IP is PC1, but the destination MAC is nnn (R2, not PC1). SW2 knows ggg = 0/1 and nnn = 0/0, so it forwards only out of 0/0.",
    packets: [{ from: "pc3", to: "sw2", label: "Echo reply", reply: true }, { from: "sw2", to: "r2", label: "Echo reply", reply: true, delay: 1 }],
    frame: fr("ICMP echo reply", "192.168.2.1", "192.168.1.1", "ggg", "nnn", "64"),
    accept: ["r2"],
    used: ["mac:sw2:ggg", "mac:sw2:nnn"],
  },
  {
    tag: "R2 · Route",
    title: "R2 routes, ARP cache hit",
    text: "R2 reads Dest IP 1.1 and finds 192.168.1.0/24 via 3.1. Its ARP table already has 3.1 = ddd from the forward path. No ARP.",
    packets: [],
    focus: ["r2"],
    route: { rows: [["192.168.1.0/24", "via 192.168.3.1"], ["192.168.2.0/24", "connected (0/0, 2.100)"], ["192.168.3.0/24", "connected"]], hit: 0 },
    used: ["arp:r2:3.1"],
  },
  {
    tag: "R2 · Forward",
    title: "R2 forwards the reply to R1",
    text: "A fresh frame: source eee (R2's 3.0 interface), destination ddd (R1's 3.0 interface). The TTL drops by 1.",
    packets: [{ from: "r2", to: "r1", label: "Echo reply", reply: true }],
    frame: fr("ICMP echo reply", "192.168.2.1", "192.168.1.1", "eee", "ddd", "63"),
    accept: ["r1"],
  },
  {
    tag: "R1 · Route",
    title: "R1 routes, ARP cache hit",
    text: "R1 reads Dest IP 1.1. The 1.0 network is directly connected on its 1.100 interface. Its ARP table already has 1.1 = aaa, learned from PC1's ARP request. No ARP.",
    packets: [],
    focus: ["r1"],
    route: { rows: [["192.168.1.0/24", "connected (0/0, 1.100)"], ["192.168.2.0/24", "via 192.168.3.2"], ["192.168.3.0/24", "connected"]], hit: 0 },
    used: ["arp:r1:1.1"],
  },
  {
    tag: "R1 · Forward",
    title: "R1 delivers the reply to PC1",
    text: "Source ccc (R1's 1.100 interface), destination aaa (PC1). SW1 knows ccc = 0/3 and aaa = 0/0, so it forwards only out of 0/0. PC1 accepts it. The TTL is now 62.",
    packets: [{ from: "r1", to: "sw1", label: "Echo reply", reply: true }, { from: "sw1", to: "pc1", label: "Echo reply", reply: true, delay: 1 }],
    frame: fr("ICMP echo reply", "192.168.2.1", "192.168.1.1", "ccc", "aaa", "62"),
    accept: ["pc1"],
    used: ["mac:sw1:ccc", "mac:sw1:aaa"],
  },
];

function betweenSim(dir: "fwd" | "rev"): SimSpec {
  const base: Omit<SimSpec, "start" | "steps" | "done"> = {
    vb: [840, 580],
    minW: 680,
    nodes: G2_NODES,
    links: G2_LINKS,
    ports: G2_PORTS,
    labels: G2_LABELS,
    arpDevs: [
      { id: "pc1", name: "PC1", mac: "aaa" },
      { id: "r1", name: "R1", mac: "ccc / ddd" },
      { id: "r2", name: "R2", mac: "eee / nnn" },
      { id: "pc3", name: "PC3", mac: "ggg" },
    ],
    swDevs: [{ id: "sw1", name: "SW1" }, { id: "sw2", name: "SW2" }],
  };
  if (dir === "fwd")
    return { ...base, start: G2_EMPTY, steps: G2_FWD, done: "Forward path done. 3 ARPs were needed. The ARP caches and MAC tables keep what they learned, so the reply needs none." };
  return { ...base, start: applyMuts(G2_EMPTY, G2_FWD), steps: G2_REPLY, done: "Reply path done. Zero ARPs: the forward path warmed every cache. IP = end to end, MAC = hop by hop." };
}

const ROUTER_STEPS = [
  "Strip the old frame header.",
  "Read the Dest IP.",
  "Consult the routing table and pick the next hop.",
  "ARP for the NEXT HOP, not the final destination.",
  "Rebuild the frame with new MACs.",
  "Decrement the TTL.",
  "Forward.",
];

function RouterRecipe() {
  const [i, setI] = useState(-1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (i >= ROUTER_STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((v) => v + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, i]);

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold">What a router does with every frame</p>
        <Button size="sm" variant="outline" onClick={() => { setI(0); setPlaying(true); }}>{i >= ROUTER_STEPS.length - 1 ? "Replay" : "Play"}</Button>
      </div>
      <ol className="mt-3 flex flex-col gap-1.5">
        {ROUTER_STEPS.map((s, k) => {
          const on = k === i;
          const past = k < i;
          return (
            <li key={s} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-all" style={{ borderColor: on ? AMBER : past ? GREEN : undefined, background: on ? `${AMBER}14` : past ? `${GREEN}10` : undefined, opacity: i === -1 || on || past ? 1 : 0.5 }}>
              <span className="w-5 font-mono font-bold">{k + 1}</span>
              <span className="flex-1">{s}</span>
              <span style={{ color: GREEN }}>{past ? "✓" : ""}</span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

const HOP_DATA = {
  fwd: [
    { name: "PC1 → R1", sMac: "aaa", dMac: "ccc", ttl: "64", arp: "yes, for the gateway" },
    { name: "R1 → R2", sMac: "ddd", dMac: "eee", ttl: "63", arp: "yes, for R2" },
    { name: "R2 → PC3", sMac: "nnn", dMac: "ggg", ttl: "62", arp: "yes, for PC3" },
  ],
  rev: [
    { name: "PC3 → R2", sMac: "ggg", dMac: "nnn", ttl: "64", arp: "no, already cached" },
    { name: "R2 → R1", sMac: "eee", dMac: "ddd", ttl: "63", arp: "no, already cached" },
    { name: "R1 → PC1", sMac: "ccc", dMac: "aaa", ttl: "62", arp: "no, already cached" },
  ],
};

function HopPanel({ dir }: { dir: "fwd" | "rev" }) {
  const [hop, setHop] = useState(0);
  const h = HOP_DATA[dir][hop];
  const sIp = dir === "fwd" ? "1.1" : "2.1";
  const dIp = dir === "fwd" ? "2.1" : "1.1";
  return (
    <Panel>
      <p className="text-sm font-semibold">IP stays, MAC changes</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {HOP_DATA[dir].map((x, k) => (
          <Pick key={x.name} active={hop === k} onClick={() => setHop(k)}>{x.name}</Pick>
        ))}
      </div>
      <div key={`${dir}${hop}`} className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          ["Src IP", sIp, false],
          ["Dest IP", dIp, false],
          ["TTL", h.ttl, true],
          ["Src MAC", h.sMac, true],
          ["Dest MAC", h.dMac, true],
          ["ARP needed?", h.arp, false],
        ].map(([k, v, changes]) => (
          <div key={String(k)} className="ph-pop rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="font-mono text-xs font-semibold" style={{ color: changes ? BLUE : undefined }}>
              {String(k).includes("IP") && "🔒 "}{v}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Locked fields never change end to end. Blue fields change at every router.</p>
    </Panel>
  );
}

function BetweenSection() {
  const [dir, setDir] = useState<"fwd" | "rev">("fwd");
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">The same three steps happen at every hop</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          AND, ARP if needed, send. Each router strips the old Ethernet header, decides using the Dest IP, ARPs for the
          next hop (not the final target) and builds a fresh frame. The TTL drops by 1 at every router.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={dir === "fwd"} onClick={() => setDir("fwd")}>Forward: PC1 → PC3 (3 ARPs)</Pick>
          <Pick active={dir === "rev"} onClick={() => setDir("rev")}>Reply: PC3 → PC1 (0 ARPs)</Pick>
        </div>
      </Panel>

      <Sim
        key={dir}
        sim={betweenSim(dir)}
        intro={dir === "fwd" ? "Press Start to follow the ping from PC1 to PC3. All tables begin empty. Watch the ARP counter climb to 3." : "Press Start to follow the echo reply from PC3 back to PC1. The tables begin filled with what the forward path learned. Watch the ARP counter stay at 0."}
      />

      <HopPanel key={`hop-${dir}`} dir={dir} />
      <RouterRecipe />

      <Panel>
        <p className="text-sm font-semibold">ARPs per direction</p>
        <div className="mt-3">
          <SimpleTable head={["Direction", "ARPs sent", "Why"]} rows={[["Forward (PC1 → PC3)", "3", "PC1 for the gateway, R1 for R2, R2 for PC3"], ["Reply (PC3 → PC1)", "0", "All caches already filled by the forward path"]]} />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 4 · PDU names ───────────────────────── */

type PieceKind = "l2" | "l3" | "l4" | "data";
type Piece = { label: string; sub?: string; k: PieceKind };
const KCOLOR: Record<PieceKind, string> = { l2: PURPLE, l3: BLUE, l4: GREEN, data: AMBER };

type Proto = "tcp" | "udp" | "icmp";
type Stage = { layer: string; pdu: string; text: string; pieces: Piece[] };

function stagesFor(p: Proto): Stage[] {
  const data: Piece = { label: p === "icmp" ? "ICMP echo" : "Application data", sub: p === "icmp" ? "message + payload" : "e.g. an HTTP request", k: "data" };
  const l4: Piece = p === "tcp" ? { label: "TCP header", sub: "ports, sequence numbers", k: "l4" } : { label: "UDP header", sub: "ports, checksum", k: "l4" };
  const ip: Piece = { label: "IP header", sub: "src IP, dest IP", k: "l3" };
  const eth: Piece = { label: "Ethernet header", sub: "src MAC, dest MAC", k: "l2" };
  const fcs: Piece = { label: "FCS", sub: "detects corruption", k: "l2" };
  const bits: Piece = { label: "1 0 1 1 0 0 1 0 ...", sub: "voltage, light or radio", k: "data" };
  const start: Stage = {
    layer: p === "icmp" ? "Layer 3" : "Layer 7",
    pdu: "Data",
    text: p === "icmp" ? "ICMP lives at Layer 3. There is no TCP or UDP header, so there is no segment or datagram. The ICMP message goes straight into an IP packet." : "The application creates its data. Nothing is addressed yet.",
    pieces: [data],
  };
  const out: Stage[] = [start];
  if (p !== "icmp")
    out.push({
      layer: "Layer 4",
      pdu: p === "tcp" ? "Segment" : "Datagram",
      text: p === "tcp" ? "A TCP header is added: the result is a segment. TCP produces segments." : "A UDP header is added: the result is a datagram. UDP produces datagrams, not segments.",
      pieces: [l4, data],
    });
  out.push(
    { layer: "Layer 3", pdu: "Packet", text: "An IP header is added: the result is a packet. If IP is in focus (routers, routing tables, Dest IP), say packet.", pieces: p === "icmp" ? [ip, data] : [ip, l4, data] },
    { layer: "Layer 2", pdu: "Frame", text: "An Ethernet header and an FCS trailer are added: the result is a frame. If MAC is in focus (switches, ARP, Ethernet headers), say frame.", pieces: p === "icmp" ? [eth, ip, data, fcs] : [eth, ip, l4, data, fcs] },
    { layer: "Layer 1", pdu: "Bits", text: "The NIC converts the frame into a signal: voltage, light pulses or radio. These are bits.", pieces: [bits] },
  );
  return out;
}

const VIEWS = [
  { id: "t", name: "Transport view", pdu: "No segment", text: "There is no TCP or UDP header here. ICMP lives at Layer 3, so this is not a segment.", hi: [] as number[] },
  { id: "n", name: "Network view", pdu: "Packet", text: "Source IP + destination IP + ICMP payload = an IP packet.", hi: [1, 2] },
  { id: "d", name: "Data Link view", pdu: "Frame", text: "The same packet inside an Ethernet header and FCS trailer = a frame.", hi: [0, 1, 2, 3] },
  { id: "p", name: "Physical view", pdu: "Bits", text: "The frame converted to voltage or light pulses = bits.", hi: [] as number[] },
];
const ICMP_FRAME: Piece[] = [
  { label: "Ethernet header", sub: "MACs", k: "l2" },
  { label: "IP header", sub: "IPs", k: "l3" },
  { label: "ICMP echo", sub: "payload", k: "data" },
  { label: "FCS", sub: "trailer", k: "l2" },
];

const PDU_ROWS = [
  ["Switch reads the destination MAC address", "Frame", "Layer 2"],
  ["Router checks the routing table", "Packet", "Layer 3"],
  ["TCP assigns sequence numbers", "Segment", "Layer 4"],
  ["UDP checksum is calculated", "Datagram", "Layer 4"],
  ["ARP reply arrives at PC1", "Frame (ARP rides inside Ethernet)", "Layer 2"],
  ["The NIC transmits voltage on the wire", "Bits", "Layer 1"],
  ["ICMP echo request is built", "Packet", "Layer 3"],
  ["An FCS is appended to detect corruption", "Frame", "Layer 2"],
];

function PieceRow({ pieces, hi }: { pieces: Piece[]; hi?: number[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
      <div className="flex min-w-max items-stretch gap-1.5">
        {pieces.map((p, k) => {
          const c = KCOLOR[p.k];
          const dim = hi !== undefined && !hi.includes(k);
          return (
            <div key={`${p.label}${k}`} className="ph-fade rounded-md border px-3 py-2 transition-opacity" style={{ borderColor: c, background: `${c}14`, animationDelay: `${k * 0.08}s`, opacity: dim ? 0.3 : 1 }}>
              <p className="text-xs font-semibold" style={{ color: c }}>{p.label}</p>
              {p.sub && <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.sub}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PduSection() {
  const [proto, setProto] = useState<Proto>("tcp");
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState("n");
  const stages = stagesFor(proto);
  const s = stages[Math.min(i, stages.length - 1)];
  const v = VIEWS.find((x) => x.id === view)!;

  useEffect(() => {
    if (!playing) return;
    if (i >= stages.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((x) => x + 1), 1800);
    return () => clearTimeout(t);
  }, [playing, i, stages.length]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">One chunk of data, four names</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          A PDU (Protocol Data Unit) is the name for a chunk of data at a given layer. Each layer adds its own header, so
          the unit grows as it goes down, and the name depends on which layer you are talking about.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[["Layer 4", "Segment (TCP) or Datagram (UDP)"], ["Layer 3", "Packet"], ["Layer 2", "Frame"], ["Layer 1", "Bits"]].map(([l, n]) => (
            <div key={l} className="rounded-lg border bg-background px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{l}</p>
              <p className="text-xs font-semibold">{n}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">Watch the encapsulation build up</p>
          <Pick active={proto === "tcp"} onClick={() => { setProto("tcp"); setI(0); setPlaying(false); }}>TCP</Pick>
          <Pick active={proto === "udp"} onClick={() => { setProto("udp"); setI(0); setPlaying(false); }}>UDP</Pick>
          <Pick active={proto === "icmp"} onClick={() => { setProto("icmp"); setI(0); setPlaying(false); }}>ICMP (ping)</Pick>
        </div>

        <div key={`${proto}-${i}`} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{s.layer}</Badge>
            <span className="ph-pop text-base font-bold" style={{ color: GREEN }}>{s.pdu}</span>
          </div>
          <PieceRow pieces={s.pieces} />
          <p className="ph-fade text-xs leading-5 text-muted-foreground">{s.text}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled={i === 0} onClick={() => { setPlaying(false); setI((x) => Math.max(0, x - 1)); }}>Back</Button>
          <Button size="sm" disabled={i >= stages.length - 1} onClick={() => { setPlaying(false); setI((x) => x + 1); }}>Add next layer</Button>
          <Button size="sm" variant="outline" onClick={() => { setI(0); setPlaying(true); }}>{playing ? "Restart" : "Auto-play"}</Button>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">Which word to use: two simple rules</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
            <li><span className="font-semibold text-foreground">IP in focus → packet.</span> Routers, routing tables, Dest IP.</li>
            <li><span className="font-semibold text-foreground">MAC in focus → frame.</span> Switches, ARP, Ethernet headers.</li>
          </ul>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Where ARP fits</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            ARP sits between Layer 2 and Layer 3. It carries an IP address inside its message, but it travels inside an
            Ethernet frame, so the switch sees a frame. Saying "ARP reply frame" is correct.
          </p>
          <div className="mt-2">
            <PieceRow pieces={[{ label: "Ethernet header", sub: "MACs", k: "l2" }, { label: "ARP message", sub: "carries IP + MAC", k: "l3" }, { label: "FCS", k: "l2" }]} />
          </div>
        </Panel>
      </div>

      <Panel>
        <p className="text-sm font-semibold">One ICMP echo, four views</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIEWS.map((x) => (
            <Pick key={x.id} active={view === x.id} onClick={() => setView(x.id)}>{x.name}</Pick>
          ))}
        </div>
        <div key={view} className="mt-3 flex flex-col gap-3">
          <PieceRow pieces={view === "p" ? [{ label: "1 0 1 1 0 0 1 0 ...", sub: "voltage, light or radio", k: "data" }] : ICMP_FRAME} hi={view === "p" ? [0] : v.hi} />
          <p className="ph-fade text-xs leading-5 text-muted-foreground">
            <span className="font-semibold" style={{ color: GREEN }}>{v.pdu}. </span>{v.text}
          </p>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Situation to PDU name</p>
        <div className="mt-3">
          <SimpleTable head={["Situation", "PDU", "Layer"]} rows={PDU_ROWS} />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 5 · common mistakes ───────────────────────── */

type Group = 1 | 2 | 3;
const GROUP_NAME: Record<Group, string> = { 1: "Same network", 2: "Between networks", 3: "PDU names" };

const MYTHS: { g: Group; wrong: string; right: string }[] = [
  { g: 1, wrong: "ARP is only used between networks.", right: "ARP is used any time a host needs a MAC address. Same network: ARP for the destination. Different network: ARP for the gateway." },
  { g: 1, wrong: "The ARP reply is also a broadcast.", right: "The request is a broadcast. The reply is unicast, because the responder already knows the requester's MAC from the request frame." },
  { g: 1, wrong: "A switch always floods every frame.", right: "A switch only floods broadcast, multicast and unknown-unicast frames. Once it knows a MAC, it forwards only out the correct port." },
  { g: 1, wrong: "Only ARP replies let the switch learn MACs.", right: "The switch learns from the SOURCE MAC of every frame, requests and replies alike. It does not care about the message type." },
  { g: 1, wrong: "Hosts always ARP for the destination IP.", right: "Only if the destination is on the same subnet. If it is remote, they ARP for the gateway." },
  { g: 1, wrong: "An ARP request is sent to 255.255.255.255.", right: "An ARP request is a Layer 2 broadcast to ffff.ffff.ffff. ARP has no IP header. 255.255.255.255 is the Layer 3 broadcast used by IP traffic such as DHCP." },
  { g: 2, wrong: "MAC addresses stay the same end to end.", right: "MAC addresses change at every router hop. Each router strips the old frame and builds a new one." },
  { g: 2, wrong: "IP addresses change at every hop.", right: "IP addresses stay the same end to end (unless NAT is involved). Only the MACs change." },
  { g: 2, wrong: "Routers ARP for the final destination.", right: "Routers ARP for the NEXT HOP only. R1 ARPs for R2 (3.2), not for PC3 (2.1)." },
  { g: 2, wrong: "TTL stays the same across the network.", right: "TTL drops by 1 at every router. At zero the packet is discarded and ICMP Time Exceeded is returned." },
  { g: 2, wrong: "PC1 sends the ICMP echo directly to PC3.", right: "PC1 sends it to the gateway's MAC address. PC3 is the destination IP, but the frame is addressed to R1." },
  { g: 2, wrong: "The reply path needs 3 new ARPs too.", right: "Zero new ARPs. The forward path already filled every ARP cache, which is why the reply is faster." },
  { g: 3, wrong: "Packet and frame are interchangeable.", right: "A packet is Layer 3 (IP addressing). A frame is Layer 2 (MAC addressing). Use the layer to pick the word." },
  { g: 3, wrong: "A segment is what the switch sees.", right: "A switch sees a frame. It reads the MAC addresses in the Ethernet header, not the TCP header." },
  { g: 3, wrong: "ARP is a Layer 3 protocol so it travels as a packet.", right: "ARP travels inside an Ethernet frame. The switch processes it as a frame." },
  { g: 3, wrong: "UDP produces segments.", right: "TCP produces segments. UDP produces datagrams. The Transport PDU name depends on the protocol." },
  { g: 3, wrong: "Bits and frame mean the same thing.", right: "Bits are the raw signal at Layer 1. A frame is the structured Layer 2 unit that becomes bits when transmitted." },
];

function GroupFilter({ g, setG }: { g: 0 | Group; setG: (v: 0 | Group) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pick active={g === 0} onClick={() => setG(0)}>All</Pick>
      {([1, 2, 3] as Group[]).map((x) => (
        <Pick key={x} active={g === x} onClick={() => setG(x)}>{GROUP_NAME[x]}</Pick>
      ))}
    </div>
  );
}

function MythsSection() {
  const [g, setG] = useState<0 | Group>(0);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const list = MYTHS.map((m, i) => ({ ...m, i })).filter((m) => g === 0 || m.g === g);
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const allOpen = list.every((m) => open.has(m.i));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <GroupFilter g={g} setG={setG} />
        <Button size="sm" variant="outline" onClick={() => setOpen((s) => { const n = new Set(s); list.forEach((m) => (allOpen ? n.delete(m.i) : n.add(m.i))); return n; })}>
          {allOpen ? "Hide all" : "Show all"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Tap a card to flip it from the wrong belief to the truth.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((m) => {
          const shown = open.has(m.i);
          return (
            <button key={m.i} type="button" onClick={() => toggle(m.i)} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50" style={{ borderColor: shown ? GREEN : undefined }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: RED }}>✕ Wrong</p>
                <span className="text-[10px] text-muted-foreground">{GROUP_NAME[m.g]}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{m.wrong}</p>
              {shown ? (
                <div className="ph-fade mt-3 border-t pt-3">
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

/* ───────────────────────── 6 · interview prep ───────────────────────── */

const QA: { g: Group; q: string; a: string[] }[] = [
  { g: 1, q: "Walk me through a ping within a LAN.", a: ["1. AND check: is the destination local?", "2. ARP broadcast to find the destination's MAC.", "3. ARP unicast reply back to the sender.", "4. ICMP echo from sender to receiver (unicast).", "5. ICMP echo reply back (unicast)."] },
  { g: 1, q: "Why does a host need MAC addresses if it already has IP addresses?", a: ["Ethernet frames are delivered within a single Layer 2 segment, so they need a MAC address to identify the destination NIC on the wire.", "IP works end to end. MAC works hop by hop."] },
  { g: 1, q: "What does the switch learn, and when?", a: ["It learns the SOURCE MAC of every incoming frame and the port it came in on.", "It stores that in the MAC (CAM) table, along with the learning type and VLAN."] },
  { g: 1, q: "How does the switch know where to forward a frame?", a: ["It looks up the DESTINATION MAC in its MAC table.", "Known unicast: forward out one port.", "Unknown unicast or broadcast: flood out all ports except the incoming one."] },
  { g: 1, q: "What if the ARP cache already has the entry?", a: ["The host skips ARP entirely and sends the frame directly.", "ARP entries age out after a few minutes, so most long-lived conversations do not re-ARP."] },
  { g: 2, q: "How does PC1 know PC3 is on a different network?", a: ["PC1 ANDs PC3's IP (2.1) with its own subnet mask (255.255.255.0).", "The result 192.168.2.0 does not equal PC1's own network 192.168.1.0, so PC3 is remote."] },
  { g: 2, q: "Who does PC1 ARP for when the destination is remote?", a: ["The default gateway, not the final destination.", "PC1 needs the gateway's MAC so it can hand the frame over for forwarding."] },
  { g: 2, q: "What changes and what stays the same across a router?", a: ["Stays: source IP, destination IP and the payload.", "Changes: source MAC, destination MAC and the TTL (drops by 1)."] },
  { g: 2, q: "What does a router do the moment it receives a frame?", a: ["It checks that the Dest MAC is its own. If not, it drops the frame.", "If yes, it strips the header, reads the Dest IP and consults its routing table."] },
  { g: 2, q: "Why does the reply path need no ARP?", a: ["Every ARP request and reply on the forward path taught the responder the requester's MAC.", "By the time the reply flows, every device along the path already has the MAC it needs."] },
  { g: 2, q: "What if a router has no route to the destination?", a: ["The router drops the packet and sends an ICMP Destination Unreachable back to the source.", "If a default route is configured, it forwards there instead."] },
  { g: 3, q: "What is a PDU?", a: ["Protocol Data Unit: the general name for a chunk of data at any layer.", "Each layer calls it something different: segment, packet, frame, bits."] },
  { g: 3, q: "Why does the name change if it is the same data?", a: ["Because each layer adds or removes its own header.", "The name reflects which layer you are looking at, not the bytes themselves."] },
  { g: 3, q: "What does a switch process, packets or frames?", a: ["Frames. It reads the source and destination MAC addresses in the Ethernet header.", "It never looks at the IP addresses inside."] },
  { g: 3, q: "What does a router process?", a: ["Packets. It strips the Ethernet header, reads the destination IP and consults its routing table.", "It rebuilds a new frame for the next hop."] },
  { g: 3, q: "Which PDU name applies to TCP but not UDP?", a: ["Segment. TCP produces segments. UDP produces datagrams."] },
  { g: 3, q: "What does ARP actually travel as?", a: ["An Ethernet frame. The ARP message carries IP addresses inside, but the wire sees an Ethernet frame, the same framing MAC learning depends on."] },
];

function InterviewSection() {
  const [g, setG] = useState<0 | Group>(0);
  const [open, setOpen] = useState<number | null>(0);
  const list = QA.map((x, i) => ({ ...x, i })).filter((x) => g === 0 || x.g === g);

  return (
    <div className="flex flex-col gap-4">
      <GroupFilter g={g} setG={(v) => { setG(v); setOpen(null); }} />
      <div className="flex flex-col gap-2">
        {list.map((x, n) => {
          const isOpen = open === x.i;
          return (
            <div key={x.i} className="rounded-xl border bg-background">
              <button type="button" onClick={() => setOpen(isOpen ? null : x.i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{n + 1}.</span>
                  {x.q}
                </span>
                <span className="flex items-center gap-2">
                  <span className="hidden text-[10px] text-muted-foreground sm:inline">{GROUP_NAME[x.g]}</span>
                  <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
                </span>
              </button>
              {isOpen && (
                <ul className="ph-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <Tip title="The one thing to internalize">IP = end to end. MAC = hop by hop.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function PacketFlowSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes ph-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes ph-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes ph-pop  { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
        @keyframes ph-glow { 0%, 100% { box-shadow: none; } 15%, 30% { box-shadow: 0 0 0 2px ${AMBER}; } 45% { box-shadow: none; } }
        .ph-pkt  { animation: ph-move ${HOP}s ease-in-out both; }
        .ph-fade { animation: ph-fade .5s ease-out both; }
        .ph-pop  { animation: ph-pop .4s ease-out both; }
        .ph-glow { animation: ph-glow 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ph-pkt, .ph-fade, .ph-pop, .ph-glow { animation: none; opacity: 1; }
          .ph-pkt { transform: translate(var(--x1), var(--y1)); }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Packet flow: summary</CardTitle>
            <CardDescription className="mt-1">
              AND, ARP, traffic. IP stays, MAC changes. Same network, between networks and PDU names in six short sections.
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
          {tab === "big" && <BigSection />}
          {tab === "same" && <SameSection />}
          {tab === "between" && <BetweenSection />}
          {tab === "pdu" && <PduSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}
