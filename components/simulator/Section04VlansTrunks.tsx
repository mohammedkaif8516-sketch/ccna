"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 4 – VLANs and trunks
 * Transcript range: 05:06 – 06:14
 *
 * Dependencies: react, framer-motion, tailwindcss
 * Usage:  <Section04VlansTrunks onComplete={() => goToSection(5)} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Transcript (05:06 – 06:14)                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "Let's say you work for a company that has different departments. As you add more devices to the switch, remember those unknown unicast messages that get flooded out of all the ports if a switch doesn't know the MAC address? Well, these create a ton of background noise and it's actually a security problem if everyone's on the same network.",
  "One way to solve this issue would be to um buy a different switch for every single department, but that's very expensive. I don't know if you have the money for that. I don't.",
  "But the better way to solve it would be to use VLANs. VLANs logically split up a switch into multiple isolated networks. You can do this by setting different ports to different VLANs on the switch.",
  "For example, ports 1 to 10 can be on like the HR VLAN. Ports 11 to 20 can be on the IT VLAN. Ports 21 to 30 can be on the guest VLAN. Something like that.",
  "And by splitting up the overall network into like smaller networks, those broadcast messages get contained. I don't know if I've made it clear already, but broadcast messages stay within the network that they were created on.",
  "Now, let's say you start expanding your network and you need to buy another switch because you literally ran out of ports on this switch. You can connect these switches together with something called a trunk.",
  "A trunk is just a port that's able to carry multiple VLANs. And it does this by adding a small VLAN ID tag on each frame.",
];

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]";
const chip = `rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 disabled:opacity-40 ${ring}`;
const solid = `rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] disabled:opacity-40 ${ring}`;

const VLANS = [
  { name: "HR", color: "#FFB547", id: 10 },
  { name: "IT", color: "#5FD4C4", id: 20 },
  { name: "Guest", color: "#FF8A7A", id: 30 },
];
const NEUTRAL = "#7FB5FF";

/** The switch: a bar with a row of port LEDs. `lit` are LED indices (0–7); `glow` flares it. */
function SwitchBar({
  label = "Switch",
  className = "",
  glow = false,
  lit = [],
  alarm = false,
}: {
  label?: string;
  className?: string;
  glow?: boolean;
  lit?: number[];
  alarm?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={{
        backgroundColor: alarm ? "#FF8A7A" : glow ? "#FFD08A" : "#7FB5FF",
        boxShadow: alarm
          ? "0 0 18px 3px rgba(255,138,122,.7)"
          : glow
            ? "0 0 18px 3px rgba(255,181,71,.6)"
            : "0 0 0 0 rgba(255,181,71,0)",
      }}
      className={`flex flex-col items-center justify-center rounded-md py-1 text-xs font-semibold text-[#0B2447] ${className}`}
    >
      {label}
      <span className="mt-0.5 flex gap-[3px]" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => {
          const on = lit.includes(i);
          return (
            <motion.span
              key={i}
              className="h-1 w-1.5 rounded-[1px]"
              animate={{
                backgroundColor: on ? "#0B2447" : "rgba(11,36,71,.28)",
                opacity: !reduce && i % 3 === 0 && !on ? [1, 0.4, 1] : 1,
              }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
            />
          );
        })}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 – everyone on one network: flooding creates noise                 */
/* ------------------------------------------------------------------ */

const EQ = [0.5, 0.9, 0.6, 1, 0.7, 0.95, 0.55, 0.85, 0.65, 0.8];

function NoiseVisual() {
  const [sender, setSender] = useState<number | null>(null);
  const [shot, setShot] = useState(0);
  const [noise, setNoise] = useState(0);
  const reduce = useReducedMotion();
  const fire = (i: number) => {
    setSender(i);
    setShot((s) => s + 1);
    setNoise((n) => Math.min(100, n + 14));
  };
  const eqMax = 3 + noise * 0.21;
  const eqColor = noise > 60 ? "#FF8A7A" : noise > 30 ? "#FFB547" : "#5FD4C4";
  const xs = [16.7, 50, 83.3];
  return (
    <motion.div
      className="flex h-full flex-col gap-2"
      animate={noise > 60 && !reduce ? { x: [0, -1.5, 1.5, -1, 1, 0] } : { x: 0 }}
      transition={noise > 60 ? { duration: 0.5, repeat: Infinity } : { duration: 0.2 }}
    >
      <p className="text-center text-xs text-[#7FB5FF]">Tap a device to send an unknown unicast</p>
      <SwitchBar label="One switch, one network" glow={shot > 0} lit={[0, 1, 2, 3, 4, 5, 6, 7]} />

      {/* cables to each department, pulsing when a flood goes out */}
      <div className="relative h-4" aria-hidden>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 16" preserveAspectRatio="none">
          {xs.map((x) => (
            <motion.path
              key={x}
              d={`M${x} 0 L${x} 16`}
              fill="none"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              animate={{ stroke: shot > 0 ? "#FFB547" : NEUTRAL, strokeOpacity: shot > 0 ? 0.9 : 0.4 }}
            />
          ))}
        </svg>
        {!reduce &&
          shot > 0 &&
          xs.map((x) => (
            <motion.span
              key={`${shot}-${x}`}
              className="absolute -ml-1 h-2 w-2 rounded-full bg-[#FFE2A8]"
              style={{ left: `${x}%`, boxShadow: "0 0 8px 2px rgba(255,181,71,.8)" }}
              initial={{ top: "-20%", opacity: 1 }}
              animate={{ top: "100%", opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          ))}
      </div>

      <div className="relative overflow-hidden rounded-lg">
        <div className="grid grid-cols-3 gap-2">
          {VLANS.map((v, g) => (
            <div key={v.name} className="space-y-1.5 rounded-lg p-1.5 ring-1 ring-[#7FB5FF]/20">
              <p className="text-center text-[10px] font-semibold leading-tight sm:text-[11px]" style={{ color: v.color }}>
                {v.name} department
              </p>
              <div className="grid grid-cols-3 gap-1">
                {[0, 1, 2].map((k) => {
                  const i = g * 3 + k;
                  const heard = shot > 0 && sender !== i;
                  return (
                    <motion.button
                      key={`${i}-${shot}`}
                      type="button"
                      onClick={() => fire(i)}
                      aria-label={`${v.name} device ${k + 1}`}
                      animate={heard && !reduce ? { scale: [1, 1.25, 1], backgroundColor: [`${v.color}00`, `${v.color}66`, `${v.color}00`] } : {}}
                      transition={{ duration: 0.7, delay: heard ? 0.35 : 0 }}
                      className={`relative rounded-md py-1 text-lg ring-1 ring-[#7FB5FF]/30 sm:text-xl ${ring} ${sender === i ? "bg-white/20" : ""}`}
                    >
                      {sender === i && !reduce && (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 m-auto h-6 w-6 rounded-full border-2 border-white"
                          initial={{ scale: 0.3, opacity: 0.9 }}
                          animate={{ scale: 9, opacity: 0 }}
                          transition={{ duration: 1 }}
                        />
                      )}
                      💻
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between gap-2 text-xs text-[#EAF1FB]">
          <span>Background noise</span>
          <span className={`text-right leading-tight ${noise > 60 ? "text-[#FF8A7A]" : "text-[#7FB5FF]"}`}>
            {noise > 60 ? "Everyone hears everything" : "Everyone's on the same network"}
          </span>
        </div>
        <div className="flex items-end gap-3">
          <div className="mb-1 h-2.5 flex-1 overflow-hidden rounded-full bg-[#0B2447]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#5FD4C4] via-[#FFB547] to-[#FF8A7A]"
              animate={{ width: `${noise}%` }}
            />
          </div>
          <div className="flex h-6 items-end gap-0.5" aria-hidden>
            {EQ.map((h, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-sm"
                animate={{
                  backgroundColor: eqColor,
                  height: noise === 0 ? 2 : reduce ? h * eqMax : [h * eqMax * 0.35, h * eqMax, h * eqMax * 0.35],
                }}
                transition={{ duration: 0.45 + i * 0.06, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </div>
      <button type="button" className={`${chip} mx-auto`} onClick={() => { setNoise(0); setShot(0); setSender(null); }}>
        Quiet it down
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – a switch per department is expensive                            */
/* ------------------------------------------------------------------ */

function BuySwitchVisual() {
  const [bought, setBought] = useState(0);
  const reduce = useReducedMotion();
  const left = 100 - bought * 34;
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="grid grid-cols-3 gap-2">
        {VLANS.map((v, i) => {
          const has = i < bought;
          return (
            <div key={v.name} className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold" style={{ color: v.color }}>
                {v.name}
              </span>
              <AnimatePresence mode="wait">
                {has ? (
                  <motion.div
                    key="on"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    className="w-full"
                  >
                    <SwitchBar label="New switch" glow lit={[0, 1, 2]} />
                  </motion.div>
                ) : (
                  <motion.div key="off" exit={{ opacity: 0 }} className="w-full rounded-md border-2 border-dashed border-[#7FB5FF]/40 py-1 text-center text-xs text-[#7FB5FF]/60">
                    No switch yet
                  </motion.div>
                )}
              </AnimatePresence>
              {/* cable to the department's computer */}
              <div className="relative h-4 w-0.5">
                <div className="absolute inset-0 border-l border-dashed border-[#7FB5FF]/30" />
                <motion.div
                  className="absolute inset-0 origin-top rounded"
                  style={{ backgroundColor: v.color }}
                  animate={{ scaleY: has ? 1 : 0 }}
                  transition={{ delay: has ? 0.25 : 0, duration: 0.25 }}
                />
              </div>
              <motion.span
                className="text-2xl"
                animate={{
                  opacity: has ? 1 : 0.35,
                  filter: has ? `grayscale(0) drop-shadow(0 0 8px ${v.color})` : "grayscale(1) drop-shadow(0 0 0 transparent)",
                  scale: has ? [1, 1.25, 1] : 1,
                }}
                transition={{ delay: has ? 0.4 : 0, duration: 0.4 }}
              >
                💻
              </motion.span>
            </div>
          );
        })}
      </div>
      <div className="relative">
        <div className="mb-1 flex justify-between text-xs text-[#EAF1FB]">
          <span>Money left</span>
          <span>{bought === 0 ? "💰" : left > 0 ? "💸" : "💸 Nothing."}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#0B2447]">
          <motion.div
            className="h-full"
            animate={{ width: `${Math.max(left, 0)}%`, backgroundColor: left < 40 ? "#FF8A7A" : "#5FD4C4" }}
          />
        </div>
        {/* coins flying out of the wallet on every purchase */}
        {bought > 0 &&
          !reduce &&
          [0, 1, 2, 3, 4].map((k) => (
            <motion.span
              key={`${bought}-${k}`}
              aria-hidden
              className="pointer-events-none absolute text-sm"
              style={{ left: `${Math.max(left, 0) - 2}%`, top: 12 }}
              initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
              animate={{ opacity: 0, y: -34, x: (k - 2) * 16, rotate: (k - 2) * 40 }}
              transition={{ duration: 0.9, delay: k * 0.05 }}
            >
              💸
            </motion.span>
          ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={solid} disabled={bought >= 3} onClick={() => setBought((b) => b + 1)}>
          Buy a switch for a department
        </button>
        <button type="button" className={chip} onClick={() => setBought(0)} disabled={bought === 0}>
          Start over
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – assign ports to VLANs                                           */
/* ------------------------------------------------------------------ */

function AssignPortsVisual() {
  const [ports, setPorts] = useState<(number | null)[]>(Array(9).fill(null));
  const cycle = (i: number) =>
    setPorts((p) => p.map((v, j) => (j === i ? (v === null ? 0 : v === 2 ? null : v + 1) : v)));
  const counts = VLANS.map((_, g) => ports.filter((x) => x === g).length);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <SwitchBar label="One physical switch" lit={ports.map((v, i) => (v === null ? -1 : i % 8)).filter((x) => x >= 0)} />
      <div>
        <div className="grid grid-cols-9 gap-1.5">
          {ports.map((v, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => cycle(i)}
              whileTap={{ scale: 0.85 }}
              animate={{
                backgroundColor: v === null ? "#0B2447" : VLANS[v].color,
                boxShadow: v === null ? "0 0 0 transparent" : `0 0 12px ${VLANS[v].color}99`,
              }}
              aria-label={`Port ${i + 1}: ${v === null ? "no VLAN" : VLANS[v].name + " VLAN"}. Tap to change.`}
              className={`flex aspect-square flex-col items-center justify-center rounded-md text-[10px] font-bold ring-1 ring-[#7FB5FF]/40 ${ring} ${v === null ? "text-[#EAF1FB]" : "text-[#0B2447]"}`}
            >
              {i + 1}
            </motion.button>
          ))}
        </div>
        {/* a device plugged into each port, lighting up in its VLAN colour */}
        <div className="mt-1 grid grid-cols-9 gap-1.5" aria-hidden>
          {ports.map((v, i) => (
            <div key={i} className="flex flex-col items-center">
              <motion.span
                className="h-1.5 w-0.5 rounded"
                animate={{ backgroundColor: v === null ? "rgba(127,181,255,.25)" : VLANS[v].color }}
              />
              <motion.span
                className="text-sm leading-none"
                animate={{
                  opacity: v === null ? 0.3 : 1,
                  filter: v === null ? "grayscale(1) drop-shadow(0 0 0 transparent)" : `grayscale(0) drop-shadow(0 0 5px ${VLANS[v].color})`,
                  scale: v === null ? 1 : [1, 1.3, 1],
                }}
                transition={{ duration: 0.3 }}
              >
                💻
              </motion.span>
            </div>
          ))}
        </div>
      </div>
      {/* how the switch is carved up */}
      <div className="flex h-2.5 overflow-hidden rounded-full bg-[#0B2447]" aria-hidden>
        {VLANS.map((v, g) => (
          <motion.div
            key={v.name}
            style={{ backgroundColor: v.color }}
            animate={{ width: `${(counts[g] / 9) * 100}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {VLANS.map((v, g) => (
          <motion.div
            key={v.name}
            layout
            animate={{ boxShadow: counts[g] > 0 ? `0 0 14px ${v.color}55` : "0 0 0 transparent" }}
            className="min-h-[3.4rem] rounded-lg border-2 p-2 text-center"
            style={{ borderColor: v.color }}
          >
            <p className="text-xs font-semibold" style={{ color: v.color }}>
              {v.name} VLAN
            </p>
            <p className="break-words font-mono text-[11px] text-[#EAF1FB] sm:text-xs">
              {ports.map((x, i) => (x === g ? i + 1 : null)).filter(Boolean).join(", ") || "none"}
            </p>
          </motion.div>
        ))}
      </div>
      <p className="text-center text-xs text-[#7FB5FF]">Tap a port to put it on a VLAN</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 – ports 1–10 HR, 11–20 IT, 21–30 guest                            */
/* ------------------------------------------------------------------ */

function RangesVisual() {
  const [sel, setSel] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const ranges = ["1 to 10", "11 to 20", "21 to 30"];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <SwitchBar label="Ports 1 to 30" lit={[0, 1, 2, 3, 4, 5, 6, 7]} />
      <div className="space-y-1">
        {VLANS.map((v, g) => {
          const on = sel === null || sel === g;
          return (
            <motion.div
              key={v.name}
              className="relative grid grid-cols-10 gap-1 rounded-md p-0.5"
              animate={{
                backgroundColor: sel === g ? `${v.color}22` : "rgba(0,0,0,0)",
                opacity: on ? 1 : 0.3,
                boxShadow: sel === g ? `0 0 16px ${v.color}55` : "0 0 0 transparent",
              }}
            >
              {Array.from({ length: 10 }, (_, k) => {
                const i = g * 10 + k;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={sel === g && !reduce ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                    transition={sel === g ? { delay: k * 0.04, duration: 0.4 } : { delay: i * 0.015 }}
                    className="flex aspect-square items-center justify-center rounded text-[10px] font-bold text-[#0B2447]"
                    style={{ backgroundColor: v.color }}
                  >
                    {i + 1}
                  </motion.div>
                );
              })}
              {/* traffic stays inside its own VLAN row */}
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 h-1.5 w-1.5 rounded-full bg-white"
                  style={{ y: "-50%", boxShadow: `0 0 8px 2px ${v.color}` }}
                  initial={{ left: "2%" }}
                  animate={{ left: "96%" }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: g * 0.7, repeatType: "reverse" }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {VLANS.map((v, g) => (
          <button
            key={v.name}
            type="button"
            aria-pressed={sel === g}
            onClick={() => setSel(sel === g ? null : g)}
            className={`rounded-lg border-2 px-2 py-2 text-center transition-colors ${ring}`}
            style={{ borderColor: v.color, backgroundColor: sel === g ? `${v.color}33` : "transparent" }}
          >
            <div className="text-xs font-semibold" style={{ color: v.color }}>
              {v.name} VLAN
            </div>
            <div className="text-[11px] text-[#EAF1FB]">Ports {ranges[g]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – broadcasts are contained                                        */
/* ------------------------------------------------------------------ */

function ContainedVisual() {
  const [on, setOn] = useState(true);
  const [from, setFrom] = useState<number | null>(null);
  const [shot, setShot] = useState(0);
  const reduce = useReducedMotion();
  const fire = (i: number) => {
    setFrom(i);
    setShot((s) => s + 1);
  };
  const heardBy = (i: number) => from !== null && from !== i && (!on || Math.floor(i / 3) === Math.floor(from / 3));
  const count = from === null ? 0 : Array.from({ length: 9 }, (_, i) => i).filter(heardBy).length;
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" role="switch" aria-checked={on} onClick={() => { setOn((o) => !o); setFrom(null); setShot(0); }} className={chip}>
          VLANs: {on ? "on" : "off"}
        </button>
        <p className="text-xs text-[#7FB5FF]">Tap a device to broadcast</p>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-xl">
        {/* with VLANs off, everyone shares one big outline */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed"
          animate={{ borderColor: on ? "rgba(127,181,255,0)" : "rgba(255,138,122,.7)" }}
        />
        <div className="grid h-full grid-cols-3 gap-2 p-0.5">
          {VLANS.map((v, g) => (
            <motion.div
              key={v.name}
              animate={{ boxShadow: on ? `0 0 0 2px ${v.color}, 0 0 16px ${v.color}55` : "0 0 0 1px rgba(127,181,255,.2)" }}
              className={`relative flex flex-col gap-1.5 rounded-lg p-2 ${on ? "overflow-hidden" : ""}`}
            >
              <p className="text-center text-[11px] font-semibold" style={{ color: v.color }}>
                {on ? `${v.name} VLAN` : "Same network"}
              </p>
              {[0, 1, 2].map((k) => {
                const i = g * 3 + k;
                const heard = heardBy(i);
                return (
                  <motion.button
                    key={`${i}-${shot}`}
                    type="button"
                    onClick={() => fire(i)}
                    aria-label={`${v.name} device ${k + 1}`}
                    animate={heard && !reduce ? { scale: [1, 1.2, 1], backgroundColor: ["rgba(0,0,0,0)", `${v.color}88`, `${v.color}33`] } : { backgroundColor: from === i ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0)" }}
                    transition={{ delay: heard ? 0.25 : 0, duration: 0.5 }}
                    className={`relative rounded-md py-1.5 text-xl ring-1 ring-[#7FB5FF]/30 ${ring} ${from !== null && !heard && from !== i ? "opacity-40" : ""}`}
                  >
                    {from === i && !reduce && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 m-auto h-7 w-7 rounded-full border-2"
                        style={{ borderColor: v.color }}
                        initial={{ scale: 0.3, opacity: 0.9 }}
                        animate={{ scale: on ? 6 : 14, opacity: 0 }}
                        transition={{ duration: on ? 0.9 : 1.2 }}
                      />
                    )}
                    💻
                  </motion.button>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>
      <p className="h-5 text-center text-sm text-[#EAF1FB]" aria-live="polite">
        {from === null ? "Nothing sent yet." : `Heard by ${count} ${count === 1 ? "device" : "devices"}.${on ? " It stayed in its own network." : ""}`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – out of ports, add a switch, connect with a trunk                */
/* ------------------------------------------------------------------ */

function ExpandVisual() {
  const [n, setN] = useState(2);
  const [second, setSecond] = useState(false);
  const reduce = useReducedMotion();
  const full = n >= 4;
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <SwitchBar label="Switch 1" alarm={full} lit={Array.from({ length: n }, (_, i) => i * 2)} />
          <div className="mt-1 grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="relative flex h-10 items-center justify-center rounded border border-[#7FB5FF]/40 bg-[#0B2447] text-base sm:text-xl">
                <motion.span
                  aria-hidden
                  className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full"
                  animate={{
                    backgroundColor: i < n ? (full ? "#FF8A7A" : "#5FD4C4") : "#2A4A75",
                    opacity: full && i < n && !reduce ? [1, 0.3, 1] : 1,
                  }}
                  transition={{ duration: 0.7, repeat: full ? Infinity : 0 }}
                />
                <AnimatePresence>{i < n && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>💻</motion.span>}</AnimatePresence>
              </div>
            ))}
          </div>
          <p className={`mt-1 text-center text-xs ${full ? "text-[#FF8A7A]" : "text-[#7FB5FF]"}`}>{full ? "Ran out of ports." : `${4 - n} ports free`}</p>
        </div>
        <div className="relative mt-1 w-12 text-center sm:w-16">
          <AnimatePresence>
            {second && (
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="origin-left">
                <div className="relative h-2 overflow-hidden rounded bg-[#FFB547]">
                  {!reduce && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0"
                      style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.6) 0 5px, transparent 5px 12px)" }}
                      animate={{ backgroundPositionX: ["0px", "12px"] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
                {/* frames of every colour sharing the one cable */}
                {!reduce &&
                  VLANS.map((v, k) => (
                    <motion.span
                      key={v.name}
                      aria-hidden
                      className="absolute top-0 h-2 w-2 rounded-sm"
                      style={{ backgroundColor: v.color, boxShadow: `0 0 6px ${v.color}` }}
                      animate={{ left: k % 2 === 0 ? ["0%", "85%"] : ["85%", "0%"] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: k * 0.45 }}
                    />
                  ))}
                <p className="mt-1 text-xs font-semibold text-[#FFB547]">Trunk</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0 flex-1">
          <AnimatePresence>
            {second ? (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }}>
                <SwitchBar label="Switch 2" glow lit={[]} />
                <div className="mt-1 grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="relative h-10 rounded border border-[#7FB5FF]/40 bg-[#0B2447]">
                      <motion.span
                        aria-hidden
                        className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#5FD4C4]"
                        animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-center text-xs text-[#5FD4C4]">Plenty of ports</p>
              </motion.div>
            ) : (
              <motion.div
                animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-md border-2 border-dashed border-[#7FB5FF]/30 py-8 text-center text-xs text-[#7FB5FF]/60"
              >
                Another switch?
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={solid} disabled={full} onClick={() => setN((v) => v + 1)}>
          Plug in a device
        </button>
        <button type="button" className={chip} disabled={!full || second} onClick={() => setSecond(true)}>
          Buy another switch
        </button>
        <button type="button" className={chip} onClick={() => { setN(2); setSecond(false); }}>
          Reset
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 – trunk carries multiple VLANs with a VLAN ID tag                 */
/* ------------------------------------------------------------------ */

function TagVisual() {
  const [frames, setFrames] = useState<{ id: number; v: number }[]>([]);
  const [out, setOut] = useState([0, 0, 0]);
  const [inn, setInn] = useState([0, 0, 0]);
  const uid = useRef(0);
  const reduce = useReducedMotion();
  const send = (v: number) => {
    setFrames((f) => [...f, { id: uid.current++, v }]);
    setOut((o) => o.map((c, i) => (i === v ? c + 1 : c)));
  };
  const done = (id: number, v: number) => {
    setFrames((f) => f.filter((x) => x.id !== id));
    setInn((o) => o.map((c, i) => (i === v ? c + 1 : c)));
  };
  const pcs = (counts: number[]) => (
    <div className="mt-1 flex justify-around">
      {VLANS.map((v, i) => (
        <div key={v.name} className="flex flex-col items-center gap-0.5">
          <motion.span
            key={`${i}-${counts[i]}`}
            className="text-xl"
            animate={
              counts[i] > 0 && !reduce
                ? {
                    scale: [1, 1.4, 1],
                    filter: [`drop-shadow(0 0 0 ${v.color})`, `drop-shadow(0 0 9px ${v.color})`, `drop-shadow(0 0 0 ${v.color})`],
                  }
                : {}
            }
            transition={{ duration: 0.6 }}
          >
            💻
          </motion.span>
          <span className="h-1 w-5 rounded" style={{ backgroundColor: v.color }} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex items-start">
        <div className="w-20 shrink-0">
          <SwitchBar label="Switch 1" glow={frames.length > 0} lit={[0, 3, 5]} />
          {pcs(out)}
        </div>
        <div className="relative mx-2 mt-1 flex-1">
          <p className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-[#FFB547]">Trunk port</p>
          <div className="relative h-[26px] overflow-hidden">
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded bg-[#FFB547]">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.55) 0 6px, transparent 6px 14px)" }}
                  animate={{ backgroundPositionX: ["0px", "14px"] }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
            {frames.map((f) => (
              <motion.div
                key={f.id}
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                onAnimationComplete={() => done(f.id, f.v)}
                className="absolute top-1/2 flex -translate-x-0 -translate-y-1/2 items-center gap-0.5"
                style={{ marginLeft: "-4.6rem" }}
              >
                {/* the tag is added on entry and peeled off before delivery */}
                <motion.span
                  className="rounded-sm px-1 font-mono text-[10px] font-bold text-[#0B2447]"
                  style={{ backgroundColor: "#EAF1FB", boxShadow: "0 0 10px rgba(234,241,251,.8)" }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.15, 1, 0.4] }}
                  transition={{ duration: 1.8, times: [0, 0.2, 0.8, 1] }}
                >
                  VLAN {VLANS[f.v].id}
                </motion.span>
                <span className="h-5 w-6 rounded-sm" style={{ backgroundColor: VLANS[f.v].color, boxShadow: `0 0 10px ${VLANS[f.v].color}` }} />
              </motion.div>
            ))}
          </div>
        </div>
        <div className="w-20 shrink-0">
          <SwitchBar label="Switch 2" glow={frames.length > 0} lit={[1, 4, 6]} />
          {pcs(inn)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {VLANS.map((v, i) => (
          <button
            key={v.name}
            type="button"
            onClick={() => send(i)}
            className={`rounded-lg border-2 px-2 py-2 text-xs font-semibold transition-colors hover:bg-white/5 ${ring}`}
            style={{ borderColor: v.color, color: v.color }}
          >
            Send a {v.name} frame
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-[#7FB5FF]">One cable, many VLANs, each frame carries a small VLAN ID tag</p>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  NoiseVisual,
  BuySwitchVisual,
  AssignPortsVisual,
  RangesVisual,
  ContainedVisual,
  ExpandVisual,
  TagVisual,
];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

// Stage height on phones, per beat (from sm up it is always 22rem).
const STAGE_H = ["h-[22rem]", "h-80", "h-[22rem]", "h-80", "h-80", "h-[22rem]", "h-80"];

const DRIFT = [
  { l: 8, t: 20, d: 0 },
  { l: 22, t: 78, d: 1.2 },
  { l: 41, t: 12, d: 2.1 },
  { l: 63, t: 85, d: 0.6 },
  { l: 78, t: 30, d: 1.7 },
  { l: 92, t: 70, d: 2.8 },
];

const LAYER_BARS = ["#FFB547", "#7FB5FF", "#5FD4C4", "#EAF1FB"]; // layers 4 → 1

export default function Section04VlansTrunks({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const last = BEATS.length - 1;
  const reduce = useReducedMotion();

  const goTo = useCallback(
    (i: number) => {
      const n = Math.min(Math.max(i, 0), last);
      setDir(n >= step ? 1 : -1);
      setStep(n);
    },
    [last, step],
  );
  const go = useCallback((d: number) => goTo(step + d), [goTo, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const Visual = VISUALS[step];
  const words = BEATS[step].split(" ");

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 40, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -40, scale: 1.02 }),
  };

  return (
    <section
      className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl text-[#EAF1FB] shadow-2xl"
      style={{
        backgroundColor: "#123A6B",
        backgroundImage:
          "linear-gradient(rgba(127,181,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(127,181,255,.12) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
      aria-label="Section 4: VLANs and trunks"
    >
      <div className="h-1 bg-[#0B2447]">
        <motion.div
          className="h-full bg-[#FFB547]"
          style={{ boxShadow: "0 0 10px 1px rgba(255,181,71,.8)" }}
          animate={{ width: `${((step + 1) / BEATS.length) * 100}%` }}
          transition={{ duration: reduce ? 0 : 0.4 }}
        />
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">VLANs and trunks</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
          {/* mini layer stack: VLANs live on Layer 2 */}
          <div className="flex flex-col gap-1 pt-1" aria-hidden>
            {LAYER_BARS.map((c, i) => {
              const lit = i === 2;
              const done = i === 3;
              return (
                <motion.span
                  key={c}
                  className="block h-1.5 w-9 rounded-sm"
                  style={{ backgroundColor: c }}
                  animate={{ opacity: lit ? 1 : done ? 0.55 : 0.22, boxShadow: lit ? `0 0 10px ${c}` : "0 0 0 transparent" }}
                />
              );
            })}
          </div>
        </header>

        <div
          className={`relative overflow-hidden rounded-xl border border-[#7FB5FF]/30 bg-[#0B2447]/70 p-4 transition-[height] duration-300 sm:h-[22rem] ${STAGE_H[step]}`}
        >
          {!reduce &&
            DRIFT.map((m, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="pointer-events-none absolute h-1 w-1 rounded-full bg-[#7FB5FF]"
                style={{ left: `${m.l}%`, top: `${m.t}%` }}
                animate={{ y: [0, -14, 0], opacity: [0.1, 0.5, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, delay: m.d, ease: "easeInOut" }}
              />
            ))}
          {[
            "left-1.5 top-1.5 border-l-2 border-t-2",
            "right-1.5 top-1.5 border-r-2 border-t-2",
            "bottom-1.5 left-1.5 border-b-2 border-l-2",
            "bottom-1.5 right-1.5 border-b-2 border-r-2",
          ].map((c) => (
            <span key={c} aria-hidden className={`pointer-events-none absolute h-3 w-3 border-[#FFB547]/60 ${c}`} />
          ))}

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              className="relative h-full"
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduce ? 0 : 0.28 }}
            >
              <Visual />
            </motion.div>
          </AnimatePresence>
        </div>

        <p key={step} className="min-h-[9rem] font-serif text-lg leading-relaxed sm:text-xl">
          <span className="sr-only">{BEATS[step]}</span>
          {words.map((w, i) => (
            <Fragment key={i}>
              <motion.span
                aria-hidden
                className="inline-block"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.25 }}
              >
                {w}
              </motion.span>
              {" "}
            </Fragment>
          ))}
        </p>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={step === 0}
            className={`rounded-full border border-[#7FB5FF]/60 px-4 py-2 text-sm transition-opacity hover:bg-[#7FB5FF]/20 disabled:opacity-30 ${ring}`}
          >
            Back
          </button>

          <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Parts of this section">
            {BEATS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Go to part ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all ${ring} ${
                  i === step ? "w-6 bg-[#FFB547]" : i < step ? "w-2.5 bg-[#FFB547]/60" : "w-2.5 bg-[#7FB5FF]/50"
                }`}
              />
            ))}
          </div>

          {step < last ? (
            <motion.button
              type="button"
              onClick={() => go(1)}
              animate={reduce ? undefined : { boxShadow: ["0 0 0 0 rgba(255,181,71,.6)", "0 0 0 10px rgba(255,181,71,0)"] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className={`rounded-full bg-[#FFB547] px-5 py-2 text-sm font-semibold text-[#0B2447] transition-transform hover:scale-105 ${ring}`}
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={onComplete}
              animate={reduce ? undefined : { boxShadow: ["0 0 0 0 rgba(255,181,71,.6)", "0 0 0 12px rgba(255,181,71,0)"] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className={`rounded-full bg-[#FFB547] px-5 py-2 text-sm font-semibold text-[#0B2447] transition-transform hover:scale-105 ${ring}`}
            >
              On to loops
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
