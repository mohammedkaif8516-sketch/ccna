"use client";

import { useState } from "react";
import { C, Chip, Node, NcStyles, Pills, Shell, SLOW, Tip, type P } from "./_shared";

/**
 * EthernetStandards
 * Pick a standard, see its speed on a log scale, a packet racing at that speed,
 * and the medium / port / reach in three small tiles.
 */

const STDS = [
  { id: "10BASE-T", mbps: 10, speed: "10 Mbps", name: "Ethernet", med: "Copper", port: "RJ-45", reach: "100 m", suffix: "twisted pair" },
  { id: "100BASE-TX", mbps: 100, speed: "100 Mbps", name: "Fast Ethernet", med: "Copper", port: "RJ-45", reach: "100 m", suffix: "twisted pair" },
  { id: "1000BASE-T", mbps: 1000, speed: "1 Gbps", name: "Gigabit Ethernet", med: "Copper", port: "RJ-45", reach: "100 m", suffix: "twisted pair" },
  { id: "10GBASE-SR", mbps: 10000, speed: "10 Gbps", name: "10 Gigabit", med: "Fibre", port: "SFP+", reach: "Multi-mode, short", suffix: "short-range fibre" },
  { id: "40GBASE-SR4", mbps: 40000, speed: "40 Gbps", name: "40 Gigabit", med: "Fibre", port: "QSFP", reach: "Multi-mode, short", suffix: "short-range fibre, 4 lanes" },
  { id: "100GBASE-SR4", mbps: 100000, speed: "100 Gbps", name: "100 Gigabit", med: "Fibre", port: "QSFP", reach: "Multi-mode, short", suffix: "short-range fibre, 4 lanes" },
  { id: "400GBASE-SR8", mbps: 400000, speed: "400 Gbps", name: "400 Gigabit", med: "Fibre", port: "QSFP-DD", reach: "Multi-mode, short", suffix: "short-range fibre, 8 lanes" },
];

const bar = (mbps: number) => ((Math.log10(mbps) - 0.5) / (5.6 - 0.5)) * 100;

export function EthernetStandards() {
  const [i, setI] = useState(2);
  const s = STDS[i];
  const copper = s.med === "Copper";
  const col = copper ? C.TP : C.FIB;
  const dur = Math.max(0.6, 3.2 - i * 0.45) * SLOW;
  const A: P = { x: 70, y: 60 };
  const B: P = { x: 530, y: 60 };
  const [spd, , kind] = [s.id.split("BASE")[0], "BASE", s.id.split("BASE-")[1]];

  return (
    <Shell title="Ethernet standards: 10 Mbps to 400 Gbps" desc="Pick a standard. Faster standards move the same frame in less time.">
      <Pills items={STDS.map((x, k) => ({ id: String(k), label: x.speed }))} sel={String(i)} set={(v) => setI(Number(v))} color={C.TP} />

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 130" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Packet speed for the chosen Ethernet standard">
          <line x1={98} y1={60} x2={502} y2={60} stroke={col} strokeWidth={4} strokeDasharray="8 6" className="nc-dash" />
          <Node p={A} e="💻" l="Sender" stroke={col} />
          <Node p={B} e="🔀" l="Receiver" stroke={col} />
          <Chip key={s.id} a={A} b={B} label={s.speed} color={col} dur={dur} delay={0} />
        </svg>
      </div>

      <div key={s.id} className="nc-fade rounded-xl border bg-background p-4">
        <p className="text-sm font-semibold" style={{ color: col }}>{s.name} · <span className="font-mono">{s.id}</span></p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border px-3 py-1" style={{ borderColor: col }}><b>{spd}</b> speed</span>
          <span className="rounded-full border px-3 py-1" style={{ borderColor: col }}><b>BASE</b> baseband</span>
          <span className="rounded-full border px-3 py-1" style={{ borderColor: col }}><b>{kind}</b> {s.suffix}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          {[["Medium", s.med], ["Port", s.port], ["Reach", s.reach]].map(([k, v]) => (
            <div key={k} className="rounded-lg border p-2">
              <p className="text-[10px] text-muted-foreground">{k}</p>
              <p className="font-semibold" style={{ color: col }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {STDS.map((x, k) => (
          <div key={x.id} className="grid grid-cols-[80px_1fr_70px] items-center gap-2 text-xs">
            <span className="font-semibold" style={k === i ? { color: col } : undefined}>{x.speed}</span>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${bar(x.mbps)}%`, background: k === i ? col : "#adb5bd", transition: "all .5s" }} />
            </div>
            <span className="font-mono text-[10px]">{x.med}</span>
          </div>
        ))}
      </div>

      <Tip color={C.TP}>Copper tops out at 1 Gbps here. Beyond that, fibre.</Tip>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <EthernetStandards />
    </>
  );
}
