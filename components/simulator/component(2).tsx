"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { C, Chip, NcStyles, Shell, SLOW, Tip } from "./_shared";

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

export default function Page() {
  return (
    <>
      <NcStyles />
      <CoaxLab />
    </>
  );
}
