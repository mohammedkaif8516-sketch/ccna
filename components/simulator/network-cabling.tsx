"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
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
 * NetworkCabling
 * 1 TwistedPairLab – STP vs UTP layers, Cat 3 / 5 / 5e / 6 twists per inch, 100 m limit
 * 2 CoaxLab        – peel the layers of a coaxial cable
 * 3 QuickReference – cable comparison table
 * 4 FiberLab       – single-mode vs multi-mode light rays, SFP / SFP+ / QSFP transceivers
 * 5 ColorCodeLab   – build the EIA/TIA-568B pinout and see Tx / Rx pins
 * 6 CablingLab     – straight-through, crossover and Auto MDI/MDI-X
 * 7 PoELab         – one cable for data + power, detection steps, standards
 * 8 CableQuiz      – practice questions
 * Rule to remember: copper carries electricity, fibre carries light, and the pin order decides which cable you need.
 */

const SLOW = 1.4; // animation slow-down factor (1 = fast, higher = slower)

const C = {
  TP: "#1971c2",
  COAX: "#e8590c",
  FIB: "#0c8599",
  CODE: "#9c36b5",
  CAB: "#2f9e44",
  POE: "#f08c00",
  RED: "#c92a2a",
  GREEN: "#2f9e44",
  AMBER: "#f08c00",
  BLUE: "#1c7ed6",
  COPPER: "#b87333",
};
const mono = "ui-monospace, monospace";

type P = { x: number; y: number };

/* ───────────────────────── shared pieces ───────────────────────── */

function Shell({ title, desc, badge = "Interactive", children }: { title: string; desc: string; badge?: string; children: ReactNode }) {
  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{desc}</CardDescription>
          </div>
          <Badge variant="secondary">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

function Chip({
  a, b, r = 28, label, color, dur, delay, loop = true,
}: {
  a: P; b: P; r?: number; label: string; color: string; dur: number; delay: number; loop?: boolean;
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const w = label.length * 6.2 + 16;
  return (
    <g
      className={loop ? "nc-pkt" : "nc-pkt nc-once"}
      style={
        {
          "--x0": `${a.x + ux * r}px`,
          "--y0": `${a.y + uy * r}px`,
          "--x1": `${b.x - ux * r}px`,
          "--y1": `${b.y - uy * r}px`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        } as CSSProperties
      }
    >
      <rect x={-w / 2} y={-10} width={w} height={20} rx={6} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

function Node({ p, e, l, stroke, sub }: { p: P; e: string; l: string; stroke: string; sub?: string }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={28} className="fill-background" stroke={stroke} strokeWidth={2.5} style={{ transition: "stroke .4s" }} />
      <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26}>{e}</text>
      <text x={p.x} y={p.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{l}</text>
      {sub && <text x={p.x} y={p.y + 60} textAnchor="middle" fontSize={10} fill="#868e96">{sub}</text>}
    </g>
  );
}

const Tip = ({ color, children }: { color: string; children: ReactNode }) => (
  <p className="rounded-lg px-3 py-2 text-xs leading-5" style={{ background: `${color}18`, color }}>💡 {children}</p>
);

const Pills = <T extends string>({ items, sel, set, color }: { items: { id: T; label: string }[]; sel: T; set: (v: T) => void; color: string }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((x) => (
      <button key={x.id} onClick={() => set(x.id)} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        style={sel === x.id ? { background: color, borderColor: color, color: "#fff" } : { borderColor: `${color}66`, color }}>
        {x.label}
      </button>
    ))}
  </div>
);

/* wire colours (EIA/TIA-568B) */
type Wire = { n: number; name: string; base: string; stripe: boolean };
const PINS: Wire[] = [
  { n: 1, name: "Orange White", base: "#f76707", stripe: true },
  { n: 2, name: "Orange", base: "#f76707", stripe: false },
  { n: 3, name: "Green White", base: "#2f9e44", stripe: true },
  { n: 4, name: "Blue", base: "#1c7ed6", stripe: false },
  { n: 5, name: "Blue White", base: "#1c7ed6", stripe: true },
  { n: 6, name: "Green", base: "#2f9e44", stripe: false },
  { n: 7, name: "Brown White", base: "#7d4e2d", stripe: true },
  { n: 8, name: "Brown", base: "#7d4e2d", stripe: false },
];
const sw = (w: Wire) => (w.stripe ? `repeating-linear-gradient(45deg, ${w.base} 0 6px, #fff 6px 12px)` : w.base);
const DATA_ROLE: Record<number, string> = { 1: "Tx", 2: "Tx", 3: "Rx", 6: "Rx" };

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

/* ───────────────────────── 2. coax ───────────────────────── */

const COAX: { id: string; t: string; d: string; r: number; fill: string; stroke: string }[] = [
  { id: "plastic", t: "Plastic insulation (outer)", d: "The protective outer plastic. It keeps out water, dirt and damage.", r: 105, fill: "#868e96", stroke: "#495057" },
  { id: "mesh", t: "Metallic mesh insulation", d: "A braided metal layer that blocks outside electrical noise.", r: 80, fill: "#ced4da", stroke: "#868e96" },
  { id: "rubber", t: "Synthetic rubber insulation", d: "The insulator that keeps the centre wire apart from the mesh.", r: 52, fill: "#f1e7c8", stroke: "#c9b87a" },
  { id: "copper", t: "Thick copper wire (centre)", d: "The conductor in the middle. It carries the signal.", r: 22, fill: C.COPPER, stroke: "#7a4a1d" },
];

export function CoaxLab() {
  const [peeled, setPeeled] = useState(0);
  const nextIdx = Math.min(peeled, 3);
  const info = COAX[nextIdx];

  return (
    <Shell title="Coaxial cable: peel the layers" desc="A thick copper wire protected by three layers of insulation. Peel it from the outside in.">
      <div className="grid items-center gap-4 md:grid-cols-[300px_1fr]">
        <div className="rounded-xl border bg-background p-3">
          <svg viewBox="0 0 300 260" className="mx-auto max-w-[300px]" role="img" aria-label="Coaxial cable cross-section">
            {COAX.map((l, i) => (
              <g key={l.id} style={{ opacity: i < peeled ? 0 : 1, transform: i < peeled ? "scale(1.12)" : "none", transformOrigin: "150px 130px", transition: "all .6s" }}>
                <circle cx={150} cy={130} r={l.r} fill={l.fill} stroke={i === nextIdx ? C.AMBER : l.stroke} strokeWidth={i === nextIdx ? 4 : 2} />
                {l.id === "mesh" && <circle cx={150} cy={130} r={l.r - 8} fill="none" stroke="#868e96" strokeWidth={6} strokeDasharray="3 3" />}
              </g>
            ))}
          </svg>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {COAX.map((l, i) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={i === nextIdx ? { borderColor: C.COAX, background: `${C.COAX}10`, fontWeight: 600 } : i < peeled ? { opacity: 0.5 } : undefined}>
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: l.fill, border: `2px solid ${l.stroke}` }} />
                {l.t} {i < peeled && "✓ peeled"}
              </div>
            ))}
          </div>
          <div key={nextIdx} className="nc-fade rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: C.COAX }}>
            <p className="text-sm font-semibold" style={{ color: C.COAX }}>{info.t}</p>
            <p className="mt-1 text-muted-foreground">{info.d}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={peeled >= 3} onClick={() => setPeeled((p) => Math.min(3, p + 1))} style={{ background: C.COAX, color: "#fff" }}>Peel next layer</Button>
            <Button size="sm" variant="ghost" disabled={peeled === 0} onClick={() => setPeeled(0)}>Reset</Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 100" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="TV signal over coaxial cable">
          <line x1={70} y1={45} x2={530} y2={45} stroke={C.COAX} strokeWidth={4} strokeDasharray="8 6" className="nc-dash" />
          <text x={50} y={55} textAnchor="middle" fontSize={28}>🛰️</text>
          <text x={550} y={55} textAnchor="middle" fontSize={28}>📺</text>
          <Chip a={{ x: 50, y: 45 }} b={{ x: 550, y: 45 }} r={26} label="TV signal" color={C.COAX} dur={3 * SLOW} delay={0} />
          <Chip a={{ x: 50, y: 45 }} b={{ x: 550, y: 45 }} r={26} label="TV signal" color={C.COAX} dur={3 * SLOW} delay={1.5 * SLOW} />
          <text x={300} y={90} textAnchor="middle" fontSize={11} fontWeight={600} fill={C.COAX}>Still widely used for television service</text>
        </svg>
      </div>
      <Tip color={C.COAX}>Coax is not used in networking anymore. Today your network uses twisted pair or fibre.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 3. quick reference ───────────────────────── */

export function QuickReference() {
  const rows = [
    ["Twisted pair (Cat 3, 5, 5e, 6)", "Electrical signals on 8 copper wires", "Max 100 m, max 1 Gbps", "Connecting devices in a LAN", C.TP],
    ["Coaxial", "Signals on a thick copper wire", "Not given in notes", "Television service (not networking)", C.COAX],
    ["Single-mode fibre", "One ray of light", "Km (e.g. 40 km, 100 km)", "Countries and distant locations", C.FIB],
    ["Multi-mode fibre", "Multiple rays of light", "Shorter distance", "Inside an environment (LAN, WAN)", C.FIB],
  ];
  return (
    <Shell title="Quick reference" desc="All cable types side by side." badge="Cheat sheet">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[620px] text-xs">
          <thead className="bg-muted/50"><tr>{["Cable", "Carries", "Distance / speed", "Used for"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t">
                <td className="px-3 py-2 font-semibold" style={{ color: r[4] }}>{r[0]}</td><td className="px-3 py-2">{r[1]}</td><td className="px-3 py-2">{r[2]}</td><td className="px-3 py-2">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

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

/* ───────────────────────── 5. colour codes ───────────────────────── */

const PALETTE = ["Brown", "Blue White", "Green", "Orange White", "Brown White", "Blue", "Orange", "Green White"];

export function ColorCodeLab() {
  const [placed, setPlaced] = useState<(string | null)[]>(Array(8).fill(null));
  const [showData, setShowData] = useState(true);
  const next = placed.findIndex((p) => p === null);
  const wrong = placed.filter((p, i) => p !== null && p !== PINS[i].name).length;
  const done = next === -1 && wrong === 0;
  const get = (n: string) => PINS.find((p) => p.name === n)!;

  return (
    <Shell title="Build the EIA/TIA-568B cable" desc="Attaching an RJ-45 connector to the cable is called crimping. Place the 8 wires in the correct order, pin 1 to pin 8.">
      <div className="flex flex-wrap gap-2 text-xs">
        {["Orange", "Blue", "Green", "Brown"].map((c) => (
          <Badge key={c} variant="secondary">{c} & {c}-white</Badge>
        ))}
      </div>
      <div className="rounded-xl border bg-background p-4">
        <p className="mb-3 text-xs font-medium">RJ-45 connector (pin 1 on the left)</p>
        <div className="grid grid-cols-8 gap-1.5">
          {placed.map((p, i) => {
            const w = p ? get(p) : null;
            const bad = p !== null && p !== PINS[i].name;
            const good = p !== null && !bad;
            return (
              <div key={`${i}-${p}`} className={`flex flex-col items-center gap-1 ${bad ? "nc-shake" : p ? "nc-pop" : ""}`}>
                <div className="h-20 w-full rounded-md border-2" style={{ background: w ? sw(w) : undefined, borderColor: bad ? C.RED : good ? C.GREEN : i === next ? C.CODE : "#adb5bd", borderStyle: p ? "solid" : "dashed" }} />
                <span className="text-xs font-bold">{i + 1}</span>
                {showData && <span className="text-[10px] font-semibold" style={{ color: DATA_ROLE[i + 1] ? C.CODE : "#868e96" }}>{DATA_ROLE[i + 1] ?? "-"}</span>}
                <span className="h-7 text-center text-[9px] leading-3 text-muted-foreground">{p ?? ""}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((name) => {
          const w = get(name);
          const used = placed.includes(name);
          return (
            <button key={name} disabled={used || next === -1} onClick={() => { const p = [...placed]; p[next] = name; setPlaced(p); }}
              className="flex items-center gap-2 rounded-lg border px-2 py-1 text-xs disabled:opacity-35">
              <span className="inline-block h-5 w-5 rounded" style={{ background: sw(w) }} />{name}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={next === 0} onClick={() => { const i = next === -1 ? 7 : next - 1; const p = [...placed]; p[i] = null; setPlaced(p); }}>Undo</Button>
        <Button size="sm" variant="outline" onClick={() => setPlaced(PINS.map((p) => p.name))}>Show answer</Button>
        <Button size="sm" variant="ghost" onClick={() => setPlaced(Array(8).fill(null))}>Reset</Button>
        <Button size="sm" variant="ghost" onClick={() => setShowData((v) => !v)}>{showData ? "Hide" : "Show"} Tx / Rx</Button>
      </div>
      <p key={`${wrong}-${done}`} className="nc-fade text-xs font-medium" style={{ color: done ? C.GREEN : wrong ? C.RED : "#868e96" }}>
        {done ? "Perfect. This is the EIA/TIA-568B order, ready to crimp." : wrong ? "A red wire is in the wrong place. Press Undo." : "Pick the colour for the highlighted pin."}
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[320px] text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left font-medium">Pin</th><th className="px-3 py-2 text-left font-medium">Colour</th><th className="px-3 py-2 text-left font-medium">Role</th></tr></thead>
          <tbody>
            {PINS.map((p) => (
              <tr key={p.n} className="border-t">
                <td className="px-3 py-2 font-mono">{p.n}</td>
                <td className="px-3 py-2"><span className="mr-2 inline-block h-3 w-6 rounded align-middle" style={{ background: sw(p) }} />{p.name}</td>
                <td className="px-3 py-2" style={DATA_ROLE[p.n] ? { color: C.CODE, fontWeight: 600 } : undefined}>{DATA_ROLE[p.n] ? `${DATA_ROLE[p.n] === "Tx" ? "Tx (transmit)" : "Rx (receive)"}` : "not used for data"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.CODE}>There are 8 wires, but Ethernet only uses 4 of them for data: the Tx (transmit) and Rx (receive) pins.</Tip>
    </Shell>
  );
}

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

/* ───────────────────────── 8. quiz ───────────────────────── */

const QS: { q: string; o: string[]; a: number; why: string }[] = [
  { q: "How many wires are inside a twisted pair cable?", o: ["4", "8", "12", "2"], a: 1, why: "8 wires in 4 pairs, each with a colour code." },
  { q: "Which category has 6 twists per inch and improved insulation?", o: ["Category 3", "Category 5", "Cat 5e", "Category 6"], a: 3, why: "Category 6." },
  { q: "What is the maximum distance of twisted pair?", o: ["10 m", "100 m", "1 km", "40 km"], a: 1, why: "100 metres, with a maximum speed of 1 Gbps." },
  { q: "How many layers of insulation does a shielded twisted pair have?", o: ["1", "2", "3", "4"], a: 2, why: "One above each wire, one above each pair, one above all pairs." },
  { q: "Which cable still brings television service but is not used in networking anymore?", o: ["Coaxial", "Single-mode fibre", "Cat 6", "Crossover"], a: 0, why: "Coaxial cable." },
  { q: "Which fibre connects countries and distant locations?", o: ["Multi-mode", "Single-mode", "Coaxial", "Cat 5e"], a: 1, why: "Single-mode: small core, one ray of light, distances in km." },
  { q: "Which transceiver gives 10 Gbps?", o: ["SFP", "SFP+", "QSFP", "RJ-45"], a: 1, why: "SFP is 1 Gbps, SFP+ is 10 Gbps and QSFP is 100 Gbps." },
  { q: "What colour is pin 1 in EIA/TIA-568B?", o: ["Orange White", "Orange", "Green White", "Blue"], a: 0, why: "Pin 1 is Orange White." },
  { q: "Which cable normally connects a switch to a PC?", o: ["Crossover", "Straight-through", "Coaxial", "Console"], a: 1, why: "Different device types use straight-through." },
  { q: "An IP camera powered by a PoE switch is the…", o: ["PSE", "PD", "MDI-X", "SFP"], a: 1, why: "The camera receives power, so it is the PD. The switch is the PSE." },
  { q: "Which standard gives up to 60 W or 90 W per port?", o: ["802.3af", "802.3at", "802.3bt", "None"], a: 2, why: "802.3bt: PoE++ Type 3 (60 W) and Type 4 (90 W)." },
];

export function CableQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QS.length;
  const q = QS[Math.min(i, QS.length - 1)];

  return (
    <Shell title="Cable check" desc="Eleven quick questions on cables, pinouts and PoE." badge="Practice">
      {done ? (
        <div className="nc-fade rounded-xl border bg-background p-4 text-sm">
          <p className="font-semibold">You scored {score} out of {QS.length}.</p>
          <p className="mt-1 text-xs text-muted-foreground">{score === QS.length ? "Perfect score." : "Revisit the labs above for the ones you missed."}</p>
        </div>
      ) : (
        <div key={i} className="nc-fade rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Question {i + 1} of {QS.length}</p>
          <p className="mt-1 text-sm font-medium">{q.q}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.o.map((o, k) => {
              const right = pick !== null && k === q.a;
              const wrong = pick === k && k !== q.a;
              return (
                <Button key={o} size="sm" variant="outline" disabled={pick !== null} onClick={() => { setPick(k); if (k === q.a) setScore((s) => s + 1); }}
                  style={right ? { background: C.GREEN, color: "#fff", opacity: 1 } : wrong ? { background: C.RED, color: "#fff", opacity: 1 } : undefined}>
                  {o}
                </Button>
              );
            })}
          </div>
          {pick !== null && (
            <p className="nc-fade mt-3 text-xs leading-5" style={{ color: pick === q.a ? C.GREEN : C.RED }}>
              {pick === q.a ? "Correct. " : "Not quite. "}<span className="text-muted-foreground">{q.why}</span>
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {!done && pick !== null && <Button size="sm" onClick={() => { setPick(null); setI((x) => x + 1); }}>{i === QS.length - 1 ? "See score" : "Next question"}</Button>}
        <Button size="sm" variant="ghost" onClick={() => { setI(0); setPick(null); setScore(0); }}>Restart</Button>
      </div>
    </Shell>
  );
}

/* ───────────────────────── main export ───────────────────────── */

export function NetworkCabling() {
  return (
    <div>
      <style>{`
        @keyframes nc-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes nc-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes nc-dash { to { stroke-dashoffset: -26; } }
        @keyframes nc-pop { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes nc-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .nc-pkt  { animation: nc-move 2s linear infinite both; }
        .nc-fade { animation: nc-fade ${0.5 * SLOW}s ease-out both; }
        .nc-dash { animation: nc-dash ${1.2 * SLOW}s linear infinite; }
        .nc-pop  { animation: nc-pop ${0.4 * SLOW}s ease-out both; transform-box: fill-box; transform-origin: center; }
        .nc-shake { animation: nc-shake .4s ease-in-out; }
        @media (prefers-reduced-motion: reduce) { .nc-pkt, .nc-fade, .nc-dash, .nc-pop, .nc-shake { animation: none; opacity: 1; } .nc-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>
      <p className="text-sm text-muted-foreground">
        Copper cables carry electrical signals, fibre carries light. Learn how each is built, how the wires are ordered, which cable connects which devices, and how one cable can even power them.
      </p>
      <TwistedPairLab />
      <CoaxLab />
      <QuickReference />
      <FiberLab />
      <ColorCodeLab />
      <CablingLab />
      <PoELab />
      <CableQuiz />
    </div>
  );
}

export default NetworkCabling;