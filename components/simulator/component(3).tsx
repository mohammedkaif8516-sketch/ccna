"use client";

import { useState } from "react";
import { C, Chip, NcStyles, Node, Pills, Shell, SLOW, type P } from "./_shared";

/* ───────────────────────── 4. fibre ───────────────────────── */

type FMode = "single" | "multi";
const TRX = [
  { id: "SFP", name: "SFP (Small Form-factor Pluggable)", gbps: 1, dur: 2.4 },
  { id: "SFP+", name: "SFP+", gbps: 10, dur: 1.4 },
  { id: "QSFP", name: "QSFP", gbps: 100, dur: 0.7 },
];

export function FiberLab() {
  const [mode, setMode] = useState<FMode>("single");
  const [trx, setTrx] = useState(0);
  const t = TRX[trx];
  const single = mode === "single";
  const rays = single ? [[0, 0]] : [[-16, 1], [0, 0], [16, -1]];
  const zig = (amp: number, flip: number) => {
    const pts: string[] = [];
    for (let x = 60; x <= 540; x += 40) {
      const k = Math.round((x - 60) / 40) % 2;
      pts.push(`${x},${100 + (k ? amp : -amp) * (flip || 1)}`);
    }
    return pts.join(" ");
  };
  const nodeA: P = { x: 70, y: 70 };
  const nodeB: P = { x: 530, y: 70 };

  return (
    <Shell title="Fibre optic cables: data as light" desc="Fibre sends light, not electricity. Compare single-mode and multi-mode, then see how a transceiver turns digital signals into light.">
      <Pills items={[{ id: "single" as FMode, label: "Single-mode" }, { id: "multi" as FMode, label: "Multi-mode" }]} sel={mode} set={setMode} color={C.FIB} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 200" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Light rays inside a fibre core">
          <rect x={40} y={55} width={520} height={90} rx={14} fill={C.FIB} fillOpacity={0.12} stroke={C.FIB} strokeWidth={2} />
          <text x={50} y={48} fontSize={11} fontWeight={700} fill={C.FIB}>Glass cable</text>
          <rect key={mode} x={40} y={single ? 96 : 80} width={520} height={single ? 8 : 40} fill={C.FIB} fillOpacity={0.3} className="nc-fade" />
          <text x={300} y={single ? 124 : 134} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.FIB}>{single ? "Small glass core" : "Larger glass core"}</text>
          {rays.map(([amp, flip], i) =>
            single ? (
              <line key={`s${i}`} x1={50} y1={100} x2={550} y2={100} stroke={C.AMBER} strokeWidth={3} strokeDasharray="14 10" className="nc-dash" />
            ) : (
              <polyline key={`m${i}`} points={zig(14 + i * 2, flip)} fill="none" stroke={C.AMBER} strokeWidth={2.5} strokeDasharray="10 8" className="nc-dash" />
            )
          )}
          <text x={300} y={186} textAnchor="middle" fontSize={12} fontWeight={700} fill={C.AMBER}>{single ? "💡 A single ray of light" : "💡 Multiple rays of light"}</text>
        </svg>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-background p-4">
          <p className="mb-2 text-xs font-medium">How far can it go?</p>
          <div className="h-4 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: single ? "100%" : "30%", background: C.FIB, transition: "width .8s" }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{single ? "Larger distance, measured in km (e.g. 40 km, 100 km)." : "Shorter distance."}</p>
        </div>
        <div key={mode} className="nc-fade rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: C.FIB }}>
          <p className="text-sm font-semibold" style={{ color: C.FIB }}>{single ? "Single-mode fibre" : "Multi-mode fibre"}</p>
          <p className="mt-1 text-muted-foreground">{single ? "Consists of a small glass core that reflects light waves. It can only transmit a single ray of light. Used to connect countries and distant locations." : "Consists of a larger glass core. It can transmit multiple rays of light over a shorter distance. Used to connect devices inside an environment (LAN, WAN)."}</p>
        </div>
      </div>

      <p className="text-sm font-semibold" style={{ color: C.FIB }}>Transceiver = Transmitter + Receiver</p>
      <Pills items={TRX.map((x, i) => ({ id: String(i), label: `${x.id} · ${x.gbps} Gbps` }))} sel={String(trx)} set={(v) => setTrx(Number(v))} color={C.FIB} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 150" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Transceiver converting digital signals to light">
          <line x1={115} y1={70} x2={485} y2={70} stroke={C.FIB} strokeWidth={4} strokeDasharray="8 6" className="nc-dash" />
          <Node p={nodeA} e="🔀" l="Switch A" stroke={C.FIB} />
          <Node p={nodeB} e="🔀" l="Switch B" stroke={C.FIB} />
          {[170, 430].map((x) => (
            <g key={x}>
              <rect x={x - 22} y={54} width={44} height={32} rx={6} fill={C.FIB} />
              <text x={x} y={74} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{t.id}</text>
            </g>
          ))}
          <Chip key={`d1-${trx}`} a={{ x: 98, y: 70 }} b={{ x: 148, y: 70 }} r={0} label="0101" color={C.AMBER} dur={t.dur * SLOW * 0.3} delay={0} />
          <Chip key={`l-${trx}`} a={{ x: 192, y: 70 }} b={{ x: 408, y: 70 }} r={0} label="💡 light" color={C.FIB} dur={t.dur * SLOW * 0.8} delay={0.3 * SLOW} />
          <Chip key={`d2-${trx}`} a={{ x: 452, y: 70 }} b={{ x: 502, y: 70 }} r={0} label="0101" color={C.AMBER} dur={t.dur * SLOW * 0.3} delay={0.9 * SLOW} />
          <text x={170} y={110} textAnchor="middle" fontSize={10} fill={C.AMBER} fontWeight={700}>digital → light</text>
          <text x={430} y={110} textAnchor="middle" fontSize={10} fill={C.AMBER} fontWeight={700}>light → digital</text>
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        {TRX.map((x, i) => (
          <div key={x.id} className="grid grid-cols-[70px_1fr_80px] items-center gap-2 text-xs">
            <span className="font-semibold" style={i === trx ? { color: C.FIB } : undefined}>{x.id}</span>
            <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${((Math.log10(x.gbps) + 1) / 3) * 100}%`, background: i === trx ? C.FIB : "#adb5bd", transition: "all .5s" }} /></div>
            <span className="font-mono">{x.gbps} Gbps</span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">A transceiver is a small module that plugs into the port of a networking device. The fibre cable connects to the transceiver. It sends and receives data by converting digital signals into light.</p>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <FiberLab />
    </>
  );
}
