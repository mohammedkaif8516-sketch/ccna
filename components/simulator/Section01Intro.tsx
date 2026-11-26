"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 1 – Intro: the MAC address and the four layers
 * Transcript range: 00:00 – 00:36
 *
 * Dependencies: react, framer-motion, tailwindcss
 * Usage:  <Section01Intro onComplete={() => goToSection(2)} />
 *
 * Every sentence of the transcript for this range is in BEATS below,
 * in order, split only at sentence boundaries.
 */

import { Fragment, useCallback, useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Transcript (verbatim, 00:00 – 00:36)                                */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "It all starts with this. This is a MAC address, a unique identifier burned into every single device on the entire planet.",
  "Your phone, your PC, your internet connected fridge. None of these devices can communicate without one.",
  "And this single line of characters is the foundation for every networking concept that we're going to go over in this video. And actually, it's the foundation for every computer networking concept like in general.",
  "So, by the end of this video, you're going to understand the journey of how data actually flows from the physical cables that are plugged into the wall all the way to how your traffic finds a server on the other side of the world.",
  "Now, to make this easier to follow, we're going to look at the internet from the ground up in four layers.",
];

const MAC = "A4:83:E7:2F:19:C0";
const BYTES = MAC.split(":");

const DEVICES = [
  { id: "phone", icon: "📱", name: "Your phone", mac: "3C:22:FB:8A:01:5D" },
  { id: "pc", icon: "💻", name: "Your PC", mac: "00:1A:2B:3C:4D:5E" },
  { id: "fridge", icon: "❄️", name: "Your internet connected fridge", mac: "D8:0F:99:B1:6E:42" },
];

const LAYERS = [
  { n: 4, name: "Layer 4", sub: "Transport", color: "#FFB547" },
  { n: 3, name: "Layer 3", sub: "Network", color: "#7FB5FF" },
  { n: 2, name: "Layer 2", sub: "Data link", color: "#5FD4C4" },
  { n: 1, name: "Layer 1", sub: "Physical", color: "#EAF1FB" },
];

/* ------------------------------------------------------------------ */
/* Visuals – one per beat                                              */
/* ------------------------------------------------------------------ */

/* Beat 1 – the MAC address burns in, byte by byte. Hover / tap a byte to see its 8 bits. */
function MacVisual() {
  const [burn, setBurn] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const total = MAC.length * 0.07;
  const bits = sel === null ? null : parseInt(BYTES[sel], 16).toString(2).padStart(8, "0");

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <span className="text-sm text-[#7FB5FF]">A MAC address</span>

      <button
        type="button"
        onClick={() => setBurn((b) => b + 1)}
        aria-label="Burn the MAC address in again"
        className="relative rounded-lg px-3 py-2 font-mono text-2xl font-bold tracking-wider text-[#EAF1FB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547] sm:text-4xl"
      >
        {/* heat glow behind the characters while burning */}
        {!reduce && (
          <motion.span
            key={`glow-${burn}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{ background: "radial-gradient(ellipse at center, rgba(255,181,71,.35), transparent 70%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: total + 0.6, times: [0, 0.4, 1] }}
          />
        )}

        <span className="relative flex items-center justify-center">
          {BYTES.map((b, bi) => {
            const settled = bi < 3 ? "#FFD08A" : "#EAF1FB";
            return (
              <Fragment key={bi}>
                <span
                  onMouseEnter={() => setSel(bi)}
                  onMouseLeave={() => setSel(null)}
                  onClick={() => setSel(bi)}
                  className={`inline-flex rounded px-0.5 transition-colors ${
                    sel === bi ? "bg-[#FFB547]/25 ring-1 ring-[#FFB547]/70" : ""
                  }`}
                >
                  {b.split("").map((ch, ci) => {
                    const i = bi * 3 + ci;
                    return (
                      <motion.span
                        key={`${burn}-${i}`}
                        className="inline-block"
                        initial={
                          reduce
                            ? false
                            : { opacity: 0, y: -18, scale: 1.5, color: "#FFB547", textShadow: "0 0 18px #FFB547" }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1, color: settled, textShadow: "0 0 0px #FFB547" }}
                        transition={{ delay: reduce ? 0 : i * 0.07, duration: 0.5, type: "spring", stiffness: 260, damping: 16 }}
                      >
                        {ch}
                      </motion.span>
                    );
                  })}
                </span>
                {bi < BYTES.length - 1 && (
                  <motion.span
                    key={`${burn}-c${bi}`}
                    className="inline-block text-[#7FB5FF]/70"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduce ? 0 : (bi * 3 + 2) * 0.07, duration: 0.4 }}
                  >
                    :
                  </motion.span>
                )}
              </Fragment>
            );
          })}
        </span>

        {/* burning line with a glowing spark at its tip */}
        <span className="relative mt-2 block h-[3px]">
          <motion.span
            key={`line-${burn}`}
            className="absolute inset-0 block origin-left rounded bg-[#FFB547]"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: total }}
          />
          {!reduce && (
            <motion.span
              key={`spark-${burn}`}
              aria-hidden
              className="absolute -top-[5px] block h-[13px] w-[13px] -translate-x-1/2 rounded-full bg-[#FFE2A8]"
              style={{ boxShadow: "0 0 14px 6px rgba(255,181,71,.9)" }}
              initial={{ left: "0%", opacity: 1 }}
              animate={{ left: "100%", opacity: [1, 1, 0] }}
              transition={{ delay: 0.2, duration: total, times: [0, 0.92, 1], ease: "linear" }}
            />
          )}
        </span>
      </button>

      {/* manufacturer half / device half */}
      <motion.div
        key={`br-${burn}`}
        className="flex w-full max-w-md px-3"
        initial={reduce ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : total + 0.3, duration: 0.4 }}
        aria-hidden
      >
        <div className="flex-[9] pr-1">
          <div className="h-2 rounded-b border-x-2 border-b-2 border-[#FFD08A]/80" />
          <div className="mt-0.5 text-center text-[10px] text-[#FFD08A] sm:text-xs">Manufacturer</div>
        </div>
        <div className="flex-[8] pl-1">
          <div className="h-2 rounded-b border-x-2 border-b-2 border-[#EAF1FB]/70" />
          <div className="mt-0.5 text-center text-[10px] text-[#EAF1FB] sm:text-xs">Device</div>
        </div>
      </motion.div>

      {/* the 8 bits behind the hovered byte */}
      <div className="flex h-7 items-center gap-1" aria-hidden>
        {Array.from({ length: 8 }).map((_, k) => {
          const on = bits ? bits[k] === "1" : false;
          return (
            <motion.span
              key={`${sel}-${k}`}
              initial={reduce ? false : { rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: bits ? 1 : 0.18 }}
              transition={{ delay: reduce ? 0 : k * 0.03, duration: 0.25 }}
              className={`flex h-6 w-5 items-center justify-center rounded font-mono text-xs ${
                on ? "bg-[#FFB547] text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#7FB5FF]"
              }`}
            >
              {bits ? bits[k] : ""}
            </motion.span>
          );
        })}
      </div>

      <span className="text-xs text-[#7FB5FF]/80">Tap it to burn it in again</span>
    </div>
  );
}

/* Beat 2 – three devices, one network. Each MAC "unlocks" the device's link to the hub. */
function DevicesVisual() {
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const count = Object.values(shown).filter(Boolean).length;
  const reduce = useReducedMotion();
  const xs = [50, 150, 250];

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="grid w-full grid-cols-3 gap-3">
        {DEVICES.map((d) => {
          const on = !!shown[d.id];
          return (
            <motion.button
              key={d.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
              onClick={() => setShown((s) => ({ ...s, [d.id]: !s[d.id] }))}
              aria-pressed={on}
              className={`relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border p-3 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547] ${
                on ? "border-[#FFB547] bg-[#FFB547]/10" : "border-[#7FB5FF]/40 bg-[#0B2447]/60"
              }`}
            >
              {on && !reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#FFB547]/30 to-transparent"
                  initial={{ left: "-40%" }}
                  animate={{ left: "140%" }}
                  transition={{ duration: 0.8 }}
                />
              )}
              <motion.span
                animate={on ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1] } : { y: reduce ? 0 : [0, -3, 0] }}
                transition={on ? { duration: 0.5 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl"
              >
                {d.icon}
              </motion.span>
              <span className="text-xs leading-tight text-[#EAF1FB]">{d.name}</span>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.span
                    initial={{ opacity: 0, height: 0, scale: 0.7 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded bg-[#FFB547]/15 px-1 font-mono text-[10px] text-[#FFB547] sm:text-xs"
                  >
                    {d.mac}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* links from each device to the shared network */}
      <svg className="h-10 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden>
        {DEVICES.map((d, i) => {
          const on = !!shown[d.id];
          const path = `M${xs[i]} 0 C${xs[i]} 22 150 16 150 40`;
          return (
            <g key={d.id}>
              <path
                d={path}
                fill="none"
                stroke={on ? "#FFB547" : "#7FB5FF"}
                strokeOpacity={on ? 0.9 : 0.35}
                strokeWidth={2}
                strokeDasharray={on ? "0" : "4 5"}
                vectorEffect="non-scaling-stroke"
              />
              {on && !reduce && (
                <circle r={3.5} fill="#FFE2A8">
                  <animateMotion dur="1.4s" repeatCount="indefinite" path={path} begin={`${i * 0.25}s`} />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* network hub: fills up as each device identifies itself */}
      <div className="relative -mt-0.5 flex items-center justify-center">
        {count > 0 && !reduce && (
          <motion.span
            aria-hidden
            className="absolute h-9 w-9 rounded-full border border-[#FFB547]"
            animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <motion.div
          animate={{ borderColor: count === 3 ? "#FFB547" : "#7FB5FF", scale: count === 3 ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.4 }}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 bg-[#123A6B] text-lg"
        >
          🌐
        </motion.div>
        <div className="absolute -right-10 flex gap-1" aria-hidden>
          {[0, 1, 2].map((k) => (
            <motion.span
              key={k}
              animate={{ backgroundColor: k < count ? "#FFB547" : "rgba(127,181,255,.3)", scale: k < count ? [1, 1.5, 1] : 1 }}
              className="h-2 w-2 rounded-full"
            />
          ))}
        </div>
      </div>

      <p className="mt-2 h-5 text-sm text-[#7FB5FF]" aria-live="polite">
        {count === 3 ? "Three devices, three different MAC addresses." : "Tap a device to see its MAC address."}
      </p>
    </div>
  );
}

const ORBIT = ["Frames", "Switches", "IP addresses", "Ports", "Routing", "NAT"];

/* Beat 3 – the MAC is the root; every concept grows from it. Hover a concept to light its branch. */
function FoundationVisual() {
  const reduce = useReducedMotion();
  const [hot, setHot] = useState<number | null>(null);
  const pts = ORBIT.map((_, i) => {
    const a = (i / ORBIT.length) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + 40 * Math.cos(a), y: 50 + 40 * Math.sin(a) };
  });

  return (
    <div className="relative flex h-full items-center justify-center">
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-24 w-24 rounded-full border border-[#FFB547]"
            animate={{ scale: [0.5, 2.6], opacity: [0.6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
          />
        ))}

      {/* branches */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {pts.map((p, i) => (
          <motion.line
            key={i}
            x1={50}
            y1={50}
            x2={p.x}
            y2={p.y}
            stroke={hot === i ? "#FFB547" : "#7FB5FF"}
            strokeOpacity={hot === i ? 1 : 0.4}
            strokeWidth={hot === i ? 2.5 : 1.2}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }}
          />
        ))}
      </svg>

      {/* pulses travelling from the MAC out to each concept */}
      {!reduce &&
        pts.map((p, i) => (
          <motion.span
            key={`dot-${i}`}
            aria-hidden
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFE2A8]"
            style={{ boxShadow: "0 0 8px 2px rgba(255,181,71,.8)" }}
            animate={{ left: ["50%", `${p.x}%`], top: ["50%", `${p.y}%`], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 + i * 0.35, ease: "easeIn", times: [0, 0.1, 0.9, 1] }}
          />
        ))}

      <motion.div
        animate={reduce ? undefined : { boxShadow: ["0 0 0px #FFB547", "0 0 22px #FFB547", "0 0 0px #FFB547"] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="z-10 rounded-xl border border-[#FFB547] bg-[#0B2447] px-3 py-2 text-center font-mono text-xs text-[#EAF1FB] sm:text-sm"
      >
        {MAC}
      </motion.div>

      {ORBIT.map((label, i) => (
        <div
          key={label}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%` }}
        >
          <motion.span
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={{ duration: 3 + (i % 3) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            className="block"
          >
            <motion.span
              tabIndex={0}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              onTouchStart={() => setHot(i)}
              whileHover={{ scale: 1.15 }}
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, backgroundColor: hot === i ? "#FFB547" : "#123A6B", color: hot === i ? "#0B2447" : "#EAF1FB" }}
              transition={{ delay: hot === null ? 0.3 + i * 0.12 : 0, duration: 0.25 }}
              className="block cursor-pointer rounded-full px-2.5 py-1 text-[11px] ring-1 ring-[#7FB5FF]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547] sm:text-xs"
            >
              {label}
            </motion.span>
          </motion.span>
        </div>
      ))}
    </div>
  );
}

/* Beat 4 – the packet's trip. Stations light up in layer colours as the data passes. */
const STATIONS = ["#EAF1FB", "#5FD4C4", "#7FB5FF", "#FFB547", "#EAF1FB"];
const TRIP = 3.2;

function JourneyVisual() {
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-5 px-2">
      <div className="flex items-end justify-between">
        <motion.div
          key={`start-${run}`}
          className="text-center"
          animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-3xl">🔌</div>
          <div className="mt-1 max-w-[7rem] text-xs text-[#EAF1FB]">Physical cables plugged into the wall</div>
        </motion.div>
        <motion.div
          key={`end-${run}`}
          className="relative text-center"
          animate={reduce ? undefined : { scale: [1, 1, 1.2, 1] }}
          transition={{ duration: TRIP + 0.5, times: [0, 0.85, 0.93, 1] }}
        >
          <div className="text-3xl">🌍</div>
          <div className="mt-1 max-w-[7rem] text-xs text-[#EAF1FB]">A server on the other side of the world</div>
        </motion.div>
      </div>

      <div className="relative mx-2 h-8">
        {/* rail */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#0B2447]" />
        <motion.div
          key={`bar-${run}`}
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#7FB5FF] to-[#FFB547]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: TRIP, ease: "linear" }}
        />

        {/* stations */}
        {STATIONS.map((c, i) => {
          const t = (i / (STATIONS.length - 1)) * TRIP;
          return (
            <div
              key={`${run}-${i}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(i / (STATIONS.length - 1)) * 100}%` }}
            >
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: c }}
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
                  transition={{ delay: t, duration: 0.7 }}
                />
              )}
              <motion.span
                className="block h-4 w-4 rounded-full border-2"
                initial={{ backgroundColor: "#0B2447", borderColor: "#7FB5FF" }}
                animate={{ backgroundColor: c, borderColor: c, scale: [1, 1.4, 1] }}
                transition={{ delay: reduce ? 0 : t, duration: 0.35 }}
              />
            </div>
          );
        })}

        {/* comet trail */}
        {!reduce &&
          [3, 2, 1].map((k) => (
            <motion.span
              key={`trail-${run}-${k}`}
              aria-hidden
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#FFB547]"
              style={{ marginLeft: -4, opacity: 0.18 * (4 - k) }}
              initial={{ left: "0%" }}
              animate={{ left: "100%" }}
              transition={{ duration: TRIP, ease: "linear", delay: k * 0.07 }}
            />
          ))}

        {/* the packet */}
        <motion.div
          key={`pkt-${run}`}
          className="absolute -top-3 text-xl"
          style={{ marginLeft: -12 }}
          initial={{ left: "0%" }}
          animate={{ left: "100%", y: reduce ? 0 : [0, -3, 0, -3, 0, -3, 0] }}
          transition={{ left: { duration: TRIP, ease: "linear" }, y: { duration: TRIP, ease: "easeInOut" } }}
        >
          📦
        </motion.div>
      </div>

      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="mx-auto rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] transition-colors hover:bg-[#7FB5FF]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]"
      >
        Send the data again
      </button>
    </div>
  );
}

/* Beat 5 – four layers stack up from the ground. Click a layer to spotlight it. */
function LayersVisual() {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full gap-3">
      <div className="flex min-w-0 flex-1 flex-col justify-end gap-2 pb-1">
        {LAYERS.map((l) => {
          const on = active === l.n;
          const dim = active !== null && !on;
          return (
            <motion.button
              key={l.n}
              type="button"
              onClick={() => setActive(on ? null : l.n)}
              aria-pressed={on}
              initial={reduce ? false : { opacity: 0, y: -60 }}
              animate={{ opacity: dim ? 0.45 : 1, y: 0, scale: on ? 1.04 : 1 }}
              whileHover={{ x: 4 }}
              transition={{ delay: reduce ? 0 : (l.n - 1) * 0.35, type: "spring", stiffness: 260, damping: 14 }}
              className="relative flex items-center justify-between overflow-hidden rounded-lg px-4 py-2 text-left text-[#0B2447] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                backgroundColor: l.color,
                boxShadow: on
                  ? `inset 0 -4px 0 rgba(0,0,0,.18), 0 0 0 3px #0B2447, 0 0 0 5px ${l.color}, 0 0 22px 2px ${l.color}`
                  : "inset 0 -4px 0 rgba(0,0,0,.18)",
              }}
            >
              {on && !reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  initial={{ left: "-30%" }}
                  animate={{ left: "130%" }}
                  transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.4 }}
                />
              )}
              <span className="relative font-semibold">{l.name}</span>
              <span className="relative text-sm">{l.sub}</span>
            </motion.button>
          );
        })}
        <div
          className="mt-1 h-2 rounded"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(127,181,255,.55) 0 2px, transparent 2px 7px)",
            borderTop: "3px solid rgba(127,181,255,.6)",
          }}
          aria-hidden
        />
        <p className="text-center text-xs text-[#7FB5FF]">The ground. We start building from here.</p>
      </div>

      {/* "build upward" rail */}
      <div className="relative flex w-5 flex-col items-center py-1" aria-hidden>
        <div className="w-[2px] flex-1 rounded bg-gradient-to-t from-[#EAF1FB]/80 via-[#7FB5FF]/50 to-[#FFB547]/80" />
        {!reduce &&
          [0, 1, 2].map((k) => (
            <motion.span
              key={k}
              className="absolute text-xs text-[#FFB547]"
              initial={{ bottom: "6%", opacity: 0 }}
              animate={{ bottom: "86%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: 1.6 + k * 0.8, ease: "easeOut" }}
            >
              ▲
            </motion.span>
          ))}
      </div>
    </div>
  );
}

const VISUALS: ComponentType[] = [MacVisual, DevicesVisual, FoundationVisual, JourneyVisual, LayersVisual];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

const DRIFT = [
  { l: 8, t: 20, d: 0 },
  { l: 22, t: 78, d: 1.2 },
  { l: 41, t: 12, d: 2.1 },
  { l: 63, t: 85, d: 0.6 },
  { l: 78, t: 30, d: 1.7 },
  { l: 92, t: 70, d: 2.8 },
];

export default function Section01Intro({ onComplete }: Props) {
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
      aria-label="Section 1: The MAC address and the four layers"
    >
      {/* progress */}
      <div className="h-1 bg-[#0B2447]">
        <motion.div
          className="h-full bg-[#FFB547]"
          style={{ boxShadow: "0 0 10px 1px rgba(255,181,71,.8)" }}
          animate={{ width: `${((step + 1) / BEATS.length) * 100}%` }}
          transition={{ duration: reduce ? 0 : 0.4 }}
        />
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        <header>
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">It all starts with a MAC address</h2>
          <p className="mt-1 text-sm text-[#7FB5FF]">
            Part {step + 1} of {BEATS.length}
          </p>
        </header>

        {/* visual stage */}
        <div className="relative h-72 overflow-hidden rounded-xl border border-[#7FB5FF]/30 bg-[#0B2447]/70 p-4 sm:h-80">
          {/* drifting data motes */}
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
          {/* corner brackets */}
          {["left-1.5 top-1.5 border-l-2 border-t-2", "right-1.5 top-1.5 border-r-2 border-t-2", "bottom-1.5 left-1.5 border-b-2 border-l-2", "bottom-1.5 right-1.5 border-b-2 border-r-2"].map(
            (c) => (
              <span key={c} aria-hidden className={`pointer-events-none absolute h-3 w-3 border-[#FFB547]/60 ${c}`} />
            ),
          )}

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

        {/* narration – word-by-word reveal */}
        <p key={step} className="min-h-[7.5rem] font-serif text-lg leading-relaxed sm:text-xl">
          {/* Plain text for screen readers and copy/paste */}
          <span className="sr-only">{BEATS[step]}</span>
          {words.map((w, i) => (
            <Fragment key={i}>
              <motion.span
                aria-hidden
                className="inline-block"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.25 }}
              >
                {w}
              </motion.span>
              {/* a real space character between words */}
              {" "}
            </Fragment>
          ))}
        </p>

        {/* controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={step === 0}
            className="rounded-full border border-[#7FB5FF]/60 px-4 py-2 text-sm transition-opacity hover:bg-[#7FB5FF]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547] disabled:opacity-30"
          >
            Back
          </button>

          <div className="flex gap-2" role="tablist" aria-label="Parts of this section">
            {BEATS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Go to part ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547] ${
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
              className="rounded-full bg-[#FFB547] px-5 py-2 text-sm font-semibold text-[#0B2447] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={onComplete}
              animate={reduce ? undefined : { boxShadow: ["0 0 0 0 rgba(255,181,71,.6)", "0 0 0 12px rgba(255,181,71,0)"] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="rounded-full bg-[#FFB547] px-5 py-2 text-sm font-semibold text-[#0B2447] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Start with the physical layer
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
