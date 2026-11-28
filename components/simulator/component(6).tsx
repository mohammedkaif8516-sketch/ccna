"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { C, Chip, NcStyles, Node, Pills, Shell, SLOW, type P } from "./_shared";

/* ───────────────────────── 7. PoE ───────────────────────── */

const POE_DEVICES = [
  { id: "cam", e: "📹", l: "IP camera", poe: true },
  { id: "ap", e: "📶", l: "Wi-Fi access point", poe: true },
  { id: "lap", e: "💻", l: "Laptop", poe: false },
];
const STANDARDS = [
  { id: "802.3af", name: "PoE (original)", w: 15.4 },
  { id: "802.3at", name: "PoE+", w: 30 },
  { id: "802.3bt T3", name: "PoE++ (Type 3)", w: 60 },
  { id: "802.3bt T4", name: "PoE++ (Type 4)", w: 90 },
];
const NEEDS = [
  { l: "IP phone", w: 6 },
  { l: "Basic IP camera", w: 12 },
  { l: "Wi-Fi access point", w: 25 },
  { l: "Large camera", w: 55 },
  { l: "High-power device", w: 80 },
];
const STEPS = ["Detect", "Test signal", "Supply power"];

export function PoELab() {
  const [usePoe, setUsePoe] = useState(true);
  const [dev, setDev] = useState("cam");
  const [step, setStep] = useState(0);
  const [need, setNeed] = useState(1);
  const d = POE_DEVICES.find((x) => x.id === dev)!;
  const sw: P = { x: 90, y: 90 };
  const pd: P = { x: 510, y: 90 };
  const wall: P = { x: 300, y: 190 };

  const flows = (): { a: P; b: P; r?: number; label: string; color: string; delay: number }[] => {
    if (step === 1) return [{ a: sw, b: pd, label: "👋 anyone PoE?", color: C.AMBER, delay: 0 }];
    if (step === 2) return d.poe ? [{ a: pd, b: sw, label: "yes, PoE!", color: C.GREEN, delay: 0 }] : [{ a: pd, b: sw, label: "✕ no answer", color: C.RED, delay: 0 }];
    if (step === 3) return d.poe
      ? [{ a: sw, b: pd, label: "⚡ power", color: C.AMBER, delay: 0 }, { a: sw, b: pd, label: "data", color: C.BLUE, delay: 0.7 }]
      : [{ a: sw, b: pd, label: "data only", color: C.BLUE, delay: 0 }];
    return [];
  };
  const stepText = [
    "Press Next to follow what the PoE switch does when a device is plugged in.",
    "1. The PoE switch detects that a device is on the other end of the cable.",
    d.poe ? "2. The switch sends a small test signal first. The device answers that it supports PoE." : "2. The switch sends a small test signal. A laptop does not support PoE, so it never answers.",
    d.poe ? "3. Once confirmed, the switch supplies the required power along with the data." : "3. No PoE reply, so no power is sent. Ordinary devices like laptops are not damaged.",
  ];
  const powered = step === 3 && d.poe;

  return (
    <Shell title="Power over Ethernet (PoE): one cable, two jobs" desc="A single Ethernet cable carries both data and electrical power, so devices can be installed without a separate power outlet.">
      <div className="flex gap-2">
        <Button size="sm" variant={!usePoe ? "default" : "outline"} onClick={() => setUsePoe(false)} style={!usePoe ? { background: C.RED } : undefined}>Without PoE</Button>
        <Button size="sm" variant={usePoe ? "default" : "outline"} onClick={() => setUsePoe(true)} style={usePoe ? { background: C.POE } : undefined}>With PoE</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 250" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Cabling with and without PoE">
          <line x1={118} y1={90} x2={482} y2={90} stroke={C.BLUE} strokeWidth={4} strokeDasharray="8 6" className="nc-dash" />
          {!usePoe && (
            <g className="nc-fade">
              <polyline points="300,170 300,140 510,140 510,122" fill="none" stroke={C.AMBER} strokeWidth={4} strokeDasharray="8 6" className="nc-dash" />
              <text x={wall.x} y={wall.y + 12} textAnchor="middle" fontSize={26}>🔌</text>
              <text x={wall.x} y={wall.y + 38} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">Wall socket + adapter</text>
              <Chip key="p-off" a={{ x: 300, y: 165 }} b={{ x: 510, y: 125 }} r={0} label="⚡ power" color={C.AMBER} dur={3 * SLOW} delay={0} />
            </g>
          )}
          <Node p={sw} e="🔀" l={usePoe ? "PoE switch (PSE)" : "Switch"} stroke={usePoe ? C.POE : "#868e96"} />
          <Node p={pd} e="📹" l={usePoe ? "IP camera (PD)" : "IP camera"} stroke={usePoe ? C.POE : "#868e96"} />
          <Chip key={`d-${usePoe}`} a={sw} b={pd} label="data" color={C.BLUE} dur={2.6 * SLOW} delay={0} />
          {usePoe && <Chip key="p-on" a={sw} b={pd} label="⚡ power" color={C.AMBER} dur={2.6 * SLOW} delay={1.3 * SLOW} />}
          <text x={300} y={72} textAnchor="middle" fontSize={12} fontWeight={700} fill={usePoe ? C.POE : C.RED}>{usePoe ? "1 cable: data + power" : "2 cables: data and power"}</text>
        </svg>
      </div>
      <ul className="flex flex-col gap-1 pl-5 text-xs leading-5 text-muted-foreground marker:text-primary">
        <li>Place devices where there is no power outlet nearby, like a camera on the ceiling.</li>
        <li>One run of cable instead of two: cleaner and cheaper.</li>
        <li>Power many devices from one switch, so you can reboot or shut them down remotely.</li>
      </ul>

      <p className="text-sm font-semibold" style={{ color: C.POE }}>How PoE works: plug in a device</p>
      <Pills items={POE_DEVICES.map((x) => ({ id: x.id, label: `${x.e} ${x.l}` }))} sel={dev} set={(v) => { setDev(v); setStep(0); }} color={C.POE} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 170" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="PoE detection steps">
          <line x1={118} y1={90} x2={482} y2={90} stroke={powered ? C.AMBER : "#868e96"} strokeOpacity={powered ? 1 : 0.5} strokeWidth={4} strokeDasharray="8 6" className="nc-dash" />
          <Node p={sw} e="🔀" l="PoE switch (PSE)" stroke={C.POE} />
          <Node p={pd} e={d.e} l={d.l} stroke={step === 3 ? (d.poe ? C.GREEN : C.RED) : "#868e96"} sub={d.poe ? "PD" : "not PoE"} />
          {step === 3 && <text x={510} y={44} textAnchor="middle" fontSize={11} fontWeight={700} fill={d.poe ? C.GREEN : C.RED} className="nc-fade">{d.poe ? "✓ powered" : "✕ no power sent (safe)"}</text>}
          {flows().map((f, i) => (
            <Chip key={`${dev}-${step}-${i}`} a={f.a} b={f.b} label={f.label} color={f.color} dur={2.2 * SLOW} delay={f.delay * SLOW} />
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <span key={s} className="rounded-full border px-3 py-1 text-xs font-medium" style={step === i + 1 ? { background: C.POE, borderColor: C.POE, color: "#fff" } : step > i + 1 ? { borderColor: C.POE, color: C.POE } : undefined}>{i + 1} · {s}</span>
        ))}
      </div>
      <p key={`${step}-${dev}`} className="nc-fade rounded-xl border bg-background p-4 text-xs leading-5 text-muted-foreground">{stepText[step]}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        <Button size="sm" disabled={step === 3} onClick={() => setStep((s) => Math.min(3, s + 1))} style={{ background: C.POE, color: "#fff" }}>Next step</Button>
        <Button size="sm" variant="ghost" onClick={() => setStep(0)}>Reset</Button>
      </div>

      <p className="text-sm font-semibold" style={{ color: C.POE }}>Match the standard to the power needed</p>
      <Pills items={NEEDS.map((x, i) => ({ id: String(i), label: `${x.l} (~${x.w} W)` }))} sel={String(need)} set={(v) => setNeed(Number(v))} color={C.POE} />
      <div className="flex flex-col gap-2">
        {STANDARDS.map((s) => {
          const ok = s.w >= NEEDS[need].w;
          return (
            <div key={s.id} className="grid grid-cols-[110px_1fr_70px] items-center gap-2 text-xs sm:grid-cols-[150px_1fr_90px]">
              <span className="font-mono font-semibold" style={{ color: ok ? C.GREEN : C.RED }}>{s.id} <span className="font-sans font-normal text-muted-foreground">{s.name}</span></span>
              <div className="relative h-4 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${(s.w / 90) * 100}%`, background: ok ? C.GREEN : "#adb5bd", transition: "all .5s" }} />
                <div className="absolute top-0 h-full w-0.5" style={{ left: `${(NEEDS[need].w / 90) * 100}%`, background: C.RED }} />
              </div>
              <span className="font-mono">{ok ? "✓ " : "✕ "}{s.w} W</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">The red line is the power the device needs. The device wattages are rough examples. Max power per port comes from the standard.</p>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3"><span className="font-semibold" style={{ color: C.POE }}>PSE</span> (Power Sourcing Equipment) provides power. Example: a PoE switch.</div>
        <div className="rounded-lg border bg-background p-3"><span className="font-semibold" style={{ color: C.POE }}>PD</span> (Powered Device) receives power. Example: IP camera, access point.</div>
      </div>
      <p className="text-xs text-muted-foreground">Common PoE devices: wireless access points, IP cameras (CCTV), IP phones (VoIP), door access control, some LED lighting.</p>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <PoELab />
    </>
  );
}
