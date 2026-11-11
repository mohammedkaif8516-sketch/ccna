"use client";

import { useMemo } from "react";

/**
 * VerticalSubnetLine
 * Recreates the hand-drawn "number line" from your notebook:
 *   0 ─ network address
 *   [ host range ]
 *   63 ─ broadcast
 *   64 ─ network address (next subnet) ...
 * Drawn top → bottom, animated, and stretched vertically in proportion
 * to block size (with a minimum height so labels never collide).
 */

type LineBlock = {
  label: string;
  requested: number;
  prefix: number;
  blockSize: number;
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  usable: number;
};

type Props = {
  blocks: LineBlock[];
  parentNetwork: number;
  parentSize: number;
  free: number;
  basePrefix: number;
  colors: string[];
  intToIp: (n: number) => string;
};

const MIN_BLOCK_H = 190; // px – enough room for 3 annotations
const TOTAL_H = 760; // px – proportional height of the whole /24-style line
const AXIS_X = 84; // px from left edge of the drawing area
const SLOW = 2.2; // animation slow-down factor: 1 = original speed, higher = slower

export function VerticalSubnetLine({
  blocks,
  parentNetwork,
  parentSize,
  free,
  basePrefix,
  colors,
  intToIp,
}: Props) {
  const rows = useMemo(() => {
    const list = blocks.map((b, i) => ({
      key: b.label,
      block: b,
      color: colors[i % colors.length],
      height: Math.max(MIN_BLOCK_H, (b.blockSize / parentSize) * TOTAL_H),
      delay: 0.55 + i * 0.45,
      free: false as const,
    }));
    return list;
  }, [blocks, parentSize, colors]);

  const freeHeight =
    free > 0 ? Math.max(90, (free / parentSize) * TOTAL_H) : 0;
  const totalHeight = rows.reduce((s, r) => s + r.height, 0) + freeHeight;
  const drawDuration = 0.6 + rows.length * 0.45;
  const lastOffset = parentSize - 1;

  // Replay the animation whenever the layout actually changes
  const replayKey = blocks
    .map((b) => `${b.network}-${b.prefix}-${b.requested}`)
    .join("|");

  const off = (n: number) => n - parentNetwork;
  const lastOctet = (n: number) => intToIp(n).split(".").pop();

  return (
    <div
      key={replayKey}
      className="vsl-paper overflow-x-auto rounded-xl border bg-background p-4"
    >
      <style>{`
        .vsl-paper {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 27px,
            color-mix(in oklab, currentColor 7%, transparent) 27px,
            color-mix(in oklab, currentColor 7%, transparent) 28px
          );
        }
        @keyframes vsl-draw  { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes vsl-fade  { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
        @keyframes vsl-tick  { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes vsl-fill  { from { opacity: 0; } to { opacity: 1; } }
        .vsl-axis    { transform-origin: top; animation: vsl-draw var(--dur) cubic-bezier(.4,0,.2,1) both; }
        .vsl-tick    { transform-origin: left; animation: vsl-tick ${0.35 * SLOW}s ease-out both; }
        .vsl-bracket { transform-origin: top; animation: vsl-draw ${0.55 * SLOW}s ease-out both; }
        .vsl-text    { animation: vsl-fade ${0.45 * SLOW}s ease-out both; }
        .vsl-wash    { animation: vsl-fill ${0.6 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .vsl-axis, .vsl-tick, .vsl-bracket, .vsl-text, .vsl-wash { animation: none !important; }
        }
      `}</style>

      <p className="mb-4 text-xs font-medium text-muted-foreground">
        Subnet line — {intToIp(parentNetwork)}/{basePrefix}
      </p>

      <div
        className="relative min-w-[420px]"
        style={{ height: totalHeight + 28 }}
      >
        {/* The main vertical axis — draws itself top to bottom */}
        <div
          className="vsl-axis absolute w-[2px] bg-foreground/70"
          style={
            {
              left: AXIS_X,
              top: 0,
              height: totalHeight,
              "--dur": `${drawDuration * SLOW}s`,
            } as React.CSSProperties
          }
        />

        {(() => {
          let y = 0;
          const out: React.ReactNode[] = [];

          rows.forEach((r, i) => {
            const b = r.block;
            const top = y;
            y += r.height;
            const d = r.delay;

            out.push(
              <div
                key={r.key}
                className="absolute left-0 right-0"
                style={{ top, height: r.height }}
              >
                {/* soft colour wash behind this block */}
                <div
                  className="vsl-wash absolute inset-y-0 right-0 rounded-md"
                  style={{
                    left: AXIS_X + 4,
                    backgroundColor: r.color + "10",
                    animationDelay: `${d * SLOW}s`,
                  }}
                />

                {/* top boundary tick (network address) */}
                <div
                  className="vsl-tick absolute h-[2px]"
                  style={{
                    left: AXIS_X - 12,
                    width: 26,
                    top: 0,
                    backgroundColor: r.color,
                    animationDelay: `${d * SLOW}s`,
                  }}
                />

                {/* left column: block name + need */}
                <div
                  className="vsl-text absolute left-0 flex flex-col"
                  style={{
                    top: r.height / 2 - 22,
                    width: AXIS_X - 18,
                    animationDelay: `${(d + 0.15) * SLOW}s`,
                  }}
                >
                  <span
                    className="text-sm font-semibold leading-tight"
                    style={{ color: r.color }}
                  >
                    {b.label}
                  </span>
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    ({b.requested})
                  </span>
                  <span className="font-mono text-[11px] leading-tight text-muted-foreground">
                    /{b.prefix}
                  </span>
                </div>

                {/* offset number just under the top tick */}
                <span
                  className="vsl-text absolute font-mono text-xs font-semibold"
                  style={{
                    left: AXIS_X - 44,
                    top: 6,
                    width: 30,
                    textAlign: "right",
                    color: r.color,
                    animationDelay: `${(d + 0.1) * SLOW}s`,
                  }}
                >
                  {off(b.network)}
                </span>

                {/* network address label */}
                <div
                  className="vsl-text absolute text-xs"
                  style={{
                    left: AXIS_X + 22,
                    top: 4,
                    animationDelay: `${(d + 0.2) * SLOW}s`,
                  }}
                >
                  <span className="text-muted-foreground">Network address </span>
                  <span className="font-mono font-medium">
                    {intToIp(b.network)}
                  </span>
                </div>

                {/* host-range bracket */}
                <div
                  className="vsl-bracket absolute rounded-l-sm border-y-2 border-l-2"
                  style={{
                    left: AXIS_X + 22,
                    top: 34,
                    bottom: 34,
                    width: 14,
                    borderColor: r.color,
                    animationDelay: `${(d + 0.3) * SLOW}s`,
                  }}
                />
                <div
                  className="vsl-text absolute flex flex-col justify-center text-xs"
                  style={{
                    left: AXIS_X + 46,
                    top: 34,
                    bottom: 34,
                    animationDelay: `${(d + 0.5) * SLOW}s`,
                  }}
                >
                  <span className="font-medium">Host range</span>
                  <span className="font-mono text-muted-foreground">
                    {intToIp(b.firstHost)} – {intToIp(b.lastHost)}
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">
                    {b.usable} usable · .{lastOctet(b.firstHost)} to .
                    {lastOctet(b.lastHost)}
                  </span>
                </div>

                {/* broadcast offset number just above the bottom tick */}
                <span
                  className="vsl-text absolute font-mono text-xs font-semibold"
                  style={{
                    left: AXIS_X - 44,
                    bottom: 6,
                    width: 30,
                    textAlign: "right",
                    color: r.color,
                    animationDelay: `${(d + 0.6) * SLOW}s`,
                  }}
                >
                  {off(b.broadcast)}
                </span>

                {/* broadcast address label */}
                <div
                  className="vsl-text absolute text-xs"
                  style={{
                    left: AXIS_X + 22,
                    bottom: 4,
                    animationDelay: `${(d + 0.65) * SLOW}s`,
                  }}
                >
                  <span className="text-muted-foreground">
                    Broadcast address{" "}
                  </span>
                  <span className="font-mono font-medium">
                    {intToIp(b.broadcast)}
                  </span>
                </div>
              </div>,
            );

            // boundary tick after the block (broadcast | next network)
            out.push(
              <div
                key={`${r.key}-end`}
                className="vsl-tick absolute h-[2px]"
                style={{
                  left: AXIS_X - 12,
                  width: 26,
                  top: y,
                  backgroundColor: r.color,
                  animationDelay: `${(d + 0.55) * SLOW}s`,
                }}
              />,
            );
          });

          // Free tail
          if (free > 0) {
            const d = 0.55 + rows.length * 0.45;
            out.push(
              <div
                key="free"
                className="vsl-text absolute right-0 flex items-center justify-center rounded-md border-2 border-dashed text-xs text-muted-foreground"
                style={{
                  left: AXIS_X + 22,
                  top: y + 6,
                  height: freeHeight - 12,
                  animationDelay: `${d * SLOW}s`,
                }}
              >
                Free · {free} addresses ({intToIp(parentNetwork + parentSize - free)}{" "}
                – {intToIp(parentNetwork + lastOffset)})
              </div>,
            );
            out.push(
              <span
                key="free-end"
                className="vsl-text absolute font-mono text-xs font-semibold text-muted-foreground"
                style={{
                  left: AXIS_X - 44,
                  top: totalHeight - 16,
                  width: 30,
                  textAlign: "right",
                  animationDelay: `${d * SLOW}s`,
                }}
              >
                {lastOffset}
              </span>,
            );
          }

          return out;
        })()}
      </div>
    </div>
  );
}