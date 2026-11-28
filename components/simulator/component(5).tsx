"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { C, Chip, DATA_ROLE, NcStyles, Node, PINS, Pills, Shell, SLOW, type P, type Wire } from "./_shared";

/* ───────────────────────── 6. cabling types ───────────────────────── */

const DEV: Record<string, [string, string]> = { Switch: ["🔀", "Switch"], PC: ["💻", "PC"], Router: ["📡", "Router"], Firewall: ["🛡️", "Firewall"] };
const DPAIRS: { a: string; b: string }[] = [
  { a: "Switch", b: "PC" }, { a: "Switch", b: "Router" }, { a: "Switch", b: "Firewall" },
  { a: "Router", b: "Firewall" }, { a: "Switch", b: "Switch" }, { a: "Router", b: "Router" },
];
const XMAP = [2, 5, 0, 3, 4, 1, 6, 7]; // crossover: left pin i lands on right pin XMAP[i]

export function CablingLab() {
  const [pi, setPi] = useState(0);
  const [cable, setCable] = useState<"straight" | "cross">("straight");
  const [mdix, setMdix] = useState(false);
  const [n, setN] = useState(0);
  const pair = DPAIRS[pi];
  const same = pair.a === pair.b;
  const needs = same ? "cross" : "straight";
  const works = mdix || cable === needs;
  const A: P = { x: 150, y: 40 };
  const B: P = { x: 450, y: 40 };
  const rowY = (i: number) => 118 + i * 31;
  const mapR = (i: number) => (cable === "cross" ? XMAP[i] : i);
  const wireColor = (w: Wire) => w.base;

  return (
    <Shell title="Cabling types: straight-through, crossover and Auto MDI/MDI-X" desc="Choose two devices and a cable, then see the pin-to-pin wiring and whether the link comes up.">
      <Pills items={DPAIRS.map((p, i) => ({ id: String(i), label: `${p.a} ↔ ${p.b}` }))} sel={String(pi)} set={(v) => { setPi(Number(v)); setN((x) => x + 1); }} color={C.CAB} />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={cable === "straight" ? "default" : "outline"} onClick={() => { setCable("straight"); setN((x) => x + 1); }} style={cable === "straight" ? { background: C.CAB } : undefined}>Straight-through</Button>
        <Button size="sm" variant={cable === "cross" ? "default" : "outline"} onClick={() => { setCable("cross"); setN((x) => x + 1); }} style={cable === "cross" ? { background: C.CAB } : undefined}>Crossover</Button>
        <Button size="sm" variant={mdix ? "default" : "outline"} onClick={() => { setMdix((v) => !v); setN((x) => x + 1); }} style={mdix ? { background: C.AMBER, color: "#fff" } : undefined}>Auto MDI/MDI-X: {mdix ? "ON" : "OFF"}</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 380" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Pin wiring between two devices">
          <Node p={A} e={DEV[pair.a][0]} l={pair.a} stroke={works ? C.GREEN : C.RED} />
          <Node p={B} e={DEV[pair.b][0]} l={pair.b} stroke={works ? C.GREEN : C.RED} />
          <line x1={178} y1={40} x2={422} y2={40} stroke={works ? C.GREEN : C.RED} strokeWidth={3} strokeDasharray="7 6" className="nc-dash" />
          <Chip key={`f${n}`} a={A} b={B} label={works ? "data" : "✕ Tx meets Tx"} color={works ? C.GREEN : C.RED} dur={2 * SLOW} delay={0} />
          <Chip key={`r${n}`} a={B} b={A} label={works ? "reply" : "no link"} color={works ? C.BLUE : C.RED} dur={2 * SLOW} delay={1 * SLOW} />
          {PINS.map((p, i) => (
            <g key={i}>
              <text x={105} y={rowY(i) + 4} textAnchor="end" fontSize={10} fill="#868e96">{i + 1} {DATA_ROLE[i + 1] ?? ""}</text>
              <rect x={115} y={rowY(i) - 8} width={30} height={16} rx={3} fill={wireColor(p)} />
              {p.stripe && <rect x={115} y={rowY(i) - 2} width={30} height={4} fill="#fff" />}
              <text x={495} y={rowY(i) + 4} textAnchor="start" fontSize={10} fill="#868e96">{i + 1} {DATA_ROLE[i + 1] ?? ""}</text>
              <rect x={455} y={rowY(i) - 8} width={30} height={16} rx={3} fill={wireColor(PINS[cable === "cross" ? XMAP[i] : i])} />
              {PINS[cable === "cross" ? XMAP[i] : i].stripe && <rect x={455} y={rowY(i) - 2} width={30} height={4} fill="#fff" />}
              <g key={`${cable}-${i}`} className="nc-fade">
                <line x1={145} y1={rowY(i)} x2={455} y2={rowY(mapR(i))} stroke={wireColor(p)} strokeWidth={3} />
                {p.stripe && <line x1={145} y1={rowY(i)} x2={455} y2={rowY(mapR(i))} stroke="#fff" strokeWidth={1.5} strokeDasharray="5 5" />}
              </g>
            </g>
          ))}
          <text x={130} y={106} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-foreground">Side 1</text>
          <text x={470} y={106} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-foreground">Side 2</text>
        </svg>
      </div>
      <p key={`${pi}-${cable}-${mdix}`} className="nc-fade rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: works ? C.GREEN : C.RED, color: works ? C.GREEN : C.RED }}>
        {works
          ? mdix
            ? "Link is up. Auto MDI/MDI-X lets the devices identify their neighbour and swap Rx/Tx pins themselves, so either cable works."
            : same ? "Link is up. Same-type devices need a crossover cable." : "Link is up. Different-type devices use a straight-through cable."
          : same ? "No link. Same-type devices transmit on the same pins, so both sides talk and nobody listens. Use a crossover cable or turn on Auto MDI/MDI-X."
            : "No link. Different-type devices already transmit and receive on opposite pins, so crossing the wires breaks it. Use straight-through."}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-background p-4 text-xs leading-5">
          <p className="text-sm font-semibold" style={{ color: C.CAB }}>Straight-through</p>
          <p className="text-muted-foreground">Different device types: Switch ↔ PC, Switch ↔ Router, Switch ↔ Firewall, Router ↔ Firewall. Both ends use the same pin/colour mapping.</p>
        </div>
        <div className="rounded-xl border bg-background p-4 text-xs leading-5">
          <p className="text-sm font-semibold" style={{ color: C.CAB }}>Crossover</p>
          <p className="text-muted-foreground">Same device types: Switch to Switch, Router to Router. Pins 1 and 2 swap with pins 3 and 6. No longer strictly required because of Auto MDI/MDI-X.</p>
        </div>
      </div>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <CablingLab />
    </>
  );
}
