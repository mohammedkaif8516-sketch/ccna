"use client";

import type { CSSProperties, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SLOW = 1.4; // animation slow-down factor (1 = fast, higher = slower)

export const C = {
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
export const mono = "ui-monospace, monospace";

export type P = { x: number; y: number };

/* ───────────────────────── shared pieces ───────────────────────── */

export function Shell({ title, desc, badge = "Interactive", children }: { title: string; desc: string; badge?: string; children: ReactNode }) {
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

export function Chip({
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

export function Node({ p, e, l, stroke, sub }: { p: P; e: string; l: string; stroke: string; sub?: string }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={28} className="fill-background" stroke={stroke} strokeWidth={2.5} style={{ transition: "stroke .4s" }} />
      <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26}>{e}</text>
      <text x={p.x} y={p.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{l}</text>
      {sub && <text x={p.x} y={p.y + 60} textAnchor="middle" fontSize={10} fill="#868e96">{sub}</text>}
    </g>
  );
}

export const Tip = ({ color, children }: { color: string; children: ReactNode }) => (
  <p className="rounded-lg px-3 py-2 text-xs leading-5" style={{ background: `${color}18`, color }}>💡 {children}</p>
);

export const Pills = <T extends string>({ items, sel, set, color }: { items: { id: T; label: string }[]; sel: T; set: (v: T) => void; color: string }) => (
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
export type Wire = { n: number; name: string; base: string; stripe: boolean };
export const PINS: Wire[] = [
  { n: 1, name: "Orange White", base: "#f76707", stripe: true },
  { n: 2, name: "Orange", base: "#f76707", stripe: false },
  { n: 3, name: "Green White", base: "#2f9e44", stripe: true },
  { n: 4, name: "Blue", base: "#1c7ed6", stripe: false },
  { n: 5, name: "Blue White", base: "#1c7ed6", stripe: true },
  { n: 6, name: "Green", base: "#2f9e44", stripe: false },
  { n: 7, name: "Brown White", base: "#7d4e2d", stripe: true },
  { n: 8, name: "Brown", base: "#7d4e2d", stripe: false },
];
export const sw = (w: Wire) => (w.stripe ? `repeating-linear-gradient(45deg, ${w.base} 0 6px, #fff 6px 12px)` : w.base);
export const DATA_ROLE: Record<number, string> = { 1: "Tx", 2: "Tx", 3: "Rx", 6: "Rx" };

/* animation keyframes: render once per page that uses any lab */
export function NcStyles() {
  return (
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
  );
}
