"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { C, Chip, NcStyles, Pills, Shell, SLOW, Tip, type P } from "./_shared";

/* ───────────────────────── 1. twisted pair ───────────────────────── */

type Layer = "jacket" | "pair" | "wire" | "copper";
const LAYER_INFO: Record<Layer, { t: string; d: string }> = {
  jacket: { t: "Insulation above all pairs", d: "The outer plastic layer wraps all 4 pairs together and protects them. Every twisted pair cable has it." },
  pair: { t: "Insulation above each pair", d: "Only shielded cable has this extra layer. Each pair gets its own shield so the pairs disturb each other less." },
  wire: { t: "Insulation above each thin copper wire", d: "Every wire has its own coloured coating so the wires never touch. This colour is the code you use when crimping." },
  copper: { t: "Thin copper wire", d: "The conductor in the centre. It carries the signal." },
};
const PAIRS = [
  { x: 108, y: 88, c: "orange", hex: "#f76707" },
  { x: 192, y: 88, c: "blue", hex: "#1c7ed6" },
  { x: 108, y: 172, c: "green", hex: "#2f9e44" },
  { x: 192, y: 172, c: "brown", hex: "#7d4e2d" },
];

type CatId = "3" | "5" | "5e" | "6";
const CATS: { id: CatId; label: string; twists: number; note: string }[] = [
  { id: "3", label: "Category 3", twists: 3, note: "3 twists per inch." },
  { id: "5", label: "Category 5", twists: 5, note: "5 twists per inch." },
  { id: "5e", label: "Cat 5e", twists: 5, note: "Pairs are also twisted around each other, not only the two wires inside each pair." },
  { id: "6", label: "Category 6", twists: 6, note: "6 twists per inch, with improved insulation." },
];

const wave = (n: number, W: number, A: number, y: number, phase = 0) => {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 4) pts.push(`${40 + x},${(y + A * Math.sin((2 * Math.PI * n * x) / W + phase)).toFixed(1)}`);
  return pts.join(" ");
};

export function TwistedPairLab() {
  const [shield, setShield] = useState(false);
  const [layer, setLayer] = useState<Layer>("jacket");
  const [cat, setCat] = useState<CatId>("5");
  const [len, setLen] = useState(60);
  const cur = CATS.find((c) => c.id === cat)!;
  const W = 440;
  const y1 = cat === "5e" ? 52 : 85;
  const hi = (l: Layer, base: string) => (layer === l ? C.AMBER : base);
  const ok = len <= 100;
  const px = 70 + (len / 150) * 460;
  const A: P = { x: 40, y: 60 };
  const B: P = { x: px + 10, y: 60 };

  return (
    <Shell title="Twisted pair cable: layers, twists and limits" desc="8 wires in 4 pairs, each with a colour code. Tap a layer in the cross-section, switch shielding, pick a category and stretch the cable.">
      <div className="grid items-center gap-4 md:grid-cols-[300px_1fr]">
        <div className="rounded-xl border bg-background p-3">
          <svg viewBox="0 0 300 260" className="mx-auto max-w-[300px]" role="img" aria-label="Cross-section of a twisted pair cable">
            <defs>
              {PAIRS.map((p) => (
                <pattern key={p.c} id={`nc-str-${p.c}`} patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(45)">
                  <rect width={8} height={8} fill={p.hex} />
                  <rect width={4} height={8} fill="#fff" />
                </pattern>
              ))}
            </defs>
            <circle cx={150} cy={130} r={108} fill="#868e96" fillOpacity={0.18} stroke={hi("jacket", "#868e96")} strokeWidth={layer === "jacket" ? 5 : 3} className="cursor-pointer" onClick={() => setLayer("jacket")} />
            {PAIRS.map((p) => (
              <g key={p.c}>
                {shield && (
                  <circle cx={p.x} cy={p.y} r={34} fill="#adb5bd" fillOpacity={0.45} stroke={hi("pair", "#868e96")} strokeWidth={layer === "pair" ? 4 : 2} className="nc-fade cursor-pointer" onClick={() => setLayer("pair")} />
                )}
                {[-14, 14].map((dx, k) => (
                  <g key={k}>
                    <circle cx={p.x + dx} cy={p.y} r={13} fill={k === 0 ? p.hex : `url(#nc-str-${p.c})`} stroke={hi("wire", "#fff")} strokeWidth={layer === "wire" ? 3 : 1.5} className="cursor-pointer" onClick={() => setLayer("wire")} />
                    <circle cx={p.x + dx} cy={p.y} r={6} fill={C.COPPER} stroke={hi("copper", "#7a4a1d")} strokeWidth={layer === "copper" ? 3 : 1} className="cursor-pointer" onClick={() => setLayer("copper")} />
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={shield ? "default" : "outline"} onClick={() => { setShield(true); }} style={shield ? { background: C.TP } : undefined}>Shielded (STP)</Button>
            <Button size="sm" variant={!shield ? "default" : "outline"} onClick={() => { setShield(false); if (layer === "pair") setLayer("jacket"); }} style={!shield ? { background: C.TP } : undefined}>Unshielded (UTP)</Button>
            <Badge variant="secondary" style={{ color: C.TP }}>{shield ? "3 layers of insulation" : "2 layers of insulation"}</Badge>
          </div>
          <div key={`${layer}-${shield}`} className="nc-fade rounded-xl border bg-background p-4" style={{ borderColor: C.TP }}>
            <p className="text-sm font-semibold" style={{ color: C.TP }}>{LAYER_INFO[layer].t}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{LAYER_INFO[layer].d}</p>
          </div>
          <ul className="flex flex-col gap-1 pl-5 text-xs leading-5 text-muted-foreground marker:text-primary">
            <li>{shield ? "Shielded: one layer above each thin copper wire, one above each pair, one above all pairs." : "Unshielded: one layer above each thin copper wire and one above all pairs."}</li>
            <li>Pair colours: orange, blue, green and brown, each with a white-striped partner.</li>
          </ul>
        </div>
      </div>

      <Pills items={CATS.map((c) => ({ id: c.id, label: c.label }))} sel={cat} set={setCat} color={C.TP} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 520 200" className="mx-auto min-w-[480px] max-w-[760px]" role="img" aria-label="Twists per inch">
          {cat === "6" && <polyline key={`g-${cat}`} points={wave(cur.twists, W, 14, y1)} fill="none" stroke="#868e96" strokeOpacity={0.35} strokeWidth={14} strokeLinecap="round" className="nc-fade" />}
          <polyline key={`a-${cat}`} points={wave(cur.twists, W, 14, y1)} fill="none" stroke="#f76707" strokeWidth={6} strokeLinecap="round" className="nc-fade" />
          <polyline key={`b-${cat}`} points={wave(cur.twists, W, 14, y1, Math.PI)} fill="none" stroke="#ffd8a8" strokeWidth={6} strokeLinecap="round" className="nc-fade" />
          {cat === "5e" && (
            <g className="nc-fade">
              <polyline points={wave(cur.twists, W, 14, 118, Math.PI / 3)} fill="none" stroke="#1c7ed6" strokeWidth={6} strokeLinecap="round" />
              <polyline points={wave(cur.twists, W, 14, 118, Math.PI / 3 + Math.PI)} fill="none" stroke="#a5d8ff" strokeWidth={6} strokeLinecap="round" />
              <text x={500} y={88} textAnchor="end" fontSize={10} fontWeight={700} fill={C.TP}>↕ pairs twist around each other too</text>
            </g>
          )}
          <line x1={40} y1={172} x2={480} y2={172} stroke="currentColor" strokeOpacity={0.5} strokeWidth={2} />
          <text x={260} y={194} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">1 inch</text>
          {Array.from({ length: cur.twists }).map((_, k) => (
            <g key={`${cat}-${k}`} className="nc-pop" style={{ animationDelay: `${k * 0.3 * SLOW}s` }}>
              <circle cx={40 + (W * (k + 0.5)) / cur.twists} cy={160} r={10} fill={C.TP} />
              <text x={40 + (W * (k + 0.5)) / cur.twists} y={164} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{k + 1}</text>
            </g>
          ))}
        </svg>
      </div>
      <p key={cat} className="nc-fade text-xs leading-5 text-muted-foreground"><span className="font-semibold" style={{ color: C.TP }}>{cur.label}:</span> {cur.note} Categories are defined by the number of twists per inch.</p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left font-medium">Category</th><th className="px-3 py-2 text-left font-medium">Twists per inch / notes</th></tr></thead>
          <tbody>
            {CATS.map((c) => (
              <tr key={c.id} className="border-t" style={c.id === cat ? { color: C.TP, fontWeight: 600, background: `${C.TP}10` } : undefined}>
                <td className="px-3 py-2">{c.label}</td><td className="px-3 py-2">{c.id === "5e" ? c.note : c.note.replace(".", "")}{c.id === "6" ? "" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border bg-background p-3">
        <p className="mb-1 text-xs font-medium">Stretch the cable: {len} m</p>
        <input type="range" min={10} max={150} step={5} value={len} onChange={(e) => setLen(Number(e.target.value))} className="w-full" aria-label="Cable length in metres" />
        <div className="overflow-x-auto">
          <svg viewBox="0 0 600 110" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Signal over cable length">
            <line x1={70} y1={60} x2={px} y2={60} stroke={ok ? C.GREEN : C.RED} strokeWidth={4} strokeDasharray="8 6" className="nc-dash" />
            <line x1={70 + (460 * 100) / 150} y1={30} x2={70 + (460 * 100) / 150} y2={92} stroke={C.RED} strokeWidth={2} strokeDasharray="3 3" />
            <text x={70 + (460 * 100) / 150} y={24} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED}>100 m limit</text>
            <text x={40} y={66} textAnchor="middle" fontSize={26}>💻</text>
            <text x={px + 12} y={66} textAnchor="middle" fontSize={26}>🔀</text>
            <Chip key={`${len}`} a={A} b={B} r={22} label={ok ? "1 Gbps max" : "weak signal"} color={ok ? C.GREEN : C.RED} dur={2 * SLOW} delay={0} />
          </svg>
        </div>
        <p className="text-xs" style={{ color: ok ? C.GREEN : C.RED }}>{ok ? "Within 100 m: the signal arrives clean, up to 1 Gbps." : "Longer than 100 m: the signal fades. Add a switch or use fibre."}</p>
      </div>
      <Tip color={C.TP}>Limitations of twisted pair: maximum distance 100 metres, maximum speed 1 Gbps.</Tip>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <TwistedPairLab />
    </>
  );
}
