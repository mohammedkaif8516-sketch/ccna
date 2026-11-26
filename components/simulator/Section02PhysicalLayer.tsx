"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 2 – Layer 1: The physical layer
 * Transcript range: 00:36 – 02:31
 *
 * Dependencies: react, framer-motion, tailwindcss
 * Usage:  <Section02PhysicalLayer onComplete={() => goToSection(3)} />
 *
 * Every sentence of the transcript for this range is in BEATS below, in order.
 * Words are separated by real space characters (copy/paste and screen readers work).
 */

import { Fragment, useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Transcript (00:36 – 02:31)                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "So, let's start with layer 1, the physical layer. Let's say this computer wants to transfer a file to this computer, and they're connected with an Ethernet cable.",
  "This is a very simple example of a network. It's called a point-to-point network. It's not going to get more simple than this. We'll talk more about this later, but we have a problem here. How can these computers actually talk?",
  "Thankfully, that's pretty easy. One of the reasons why it's really easy is because computers don't know anything except for zeros and ones. That's it. These ones and zeros are called bits. And eight bits is one byte. You might have heard that before.",
  "The physical layer has one simple job. Turn those zeros and ones into physical signals that can travel from one side to the other. And the most common way to do this is with an Ethernet cable.",
  "Ethernet cables send pulses of electricity down a copper wire to signify ones and zeros. But their maximum range is like 100 meters because electricity fades. I don't know what this is. Electricity fades over long distances. That 100 m max range kind of sucks.",
  "And this [snorts] is where fiber optic cables come in. These cables send signals using pulses of light instead of electricity. And because of this, these cables are much faster and they can actually go much further than the 100 meters that regular Ethernet cables can go.",
  "And actually, these are the cables that are run under the ocean or in the ocean that connects our whole world together. I don't know if you've seen the memes about like, you know, like the sharks attacking the internet. But yeah, that's actually real. I guess if a shark bites the fiber optic cable, if it's not shielded properly, like the whole internet's gone.",
  "And then we have everyone's favorite, Wi-Fi. All of our modern portable devices like our phones, our laptops, they all have transmitters and receivers built into them. These transmitters and receivers use radio waves to send the zeros and ones instead of a physical cable.",
  "Okay, so sending ones and zeros between two computers is very easy. But what happens if we add a third computer or a fourth computer or like a thousandth computer? You can't run a cable between every single device. That would be crazy. And this brings us to layer two and back to that MAC address from the start.",
];

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]";

/** A computer with a status LED, a soft glow while it is busy, and an optional arrival burst. */
function Computer({
  label,
  icon = "🖥️",
  active = false,
  burst = false,
  extra,
}: {
  label: string;
  icon?: string;
  active?: boolean;
  burst?: boolean;
  extra?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex w-20 flex-col items-center gap-1 text-center">
      <div className="relative">
        {active && !reduce && (
          <motion.span
            aria-hidden
            className="absolute -inset-3 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,181,71,.35), transparent 70%)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        )}
        <motion.span
          className="relative block text-4xl"
          animate={reduce ? undefined : { y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {icon}
        </motion.span>
        <motion.span
          aria-hidden
          className="absolute -right-1 top-0 h-2 w-2 rounded-full"
          animate={{ backgroundColor: active ? "#5FD4C4" : "#3B5B88", opacity: active && !reduce ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.5, repeat: active ? Infinity : 0 }}
        />
        {burst &&
          !reduce &&
          [0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k / 6) * Math.PI * 2;
            return (
              <motion.span
                key={k}
                aria-hidden
                className="absolute left-1/2 top-1/2 text-xs"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: Math.cos(a) * 34, y: Math.sin(a) * 34, opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                ✨
              </motion.span>
            );
          })}
      </div>
      <span className="text-xs text-[#EAF1FB]">{label}</span>
      {extra}
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="block text-sm text-[#EAF1FB]">
      <span className="mb-1 flex justify-between">
        <span>{props.label}</span>
        <span className="font-mono text-[#FFB547]">
          {props.value}
          {props.unit}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className={`w-full accent-[#FFB547] ${ring}`}
      />
    </label>
  );
}

/** A distance ruler: the filled bar grows with the slider, the 100 m mark is dashed, and the zone past it turns red. */
function Ruler({ dist, max }: { dist: number; max: number }) {
  const reduce = useReducedMotion();
  const pct = Math.min(100, (dist / max) * 100);
  const mark = (100 / max) * 100;
  return (
    <div className="relative h-5" aria-hidden>
      <div className="absolute inset-x-0 top-2 h-1.5 rounded-full bg-[#0B2447]" />
      {max > 100 && <div className="absolute top-2 h-1.5 bg-[#FF8A7A]/25" style={{ left: `${mark}%`, right: 0 }} />}
      <motion.div
        className="absolute left-0 top-2 h-1.5 rounded-full bg-[#7FB5FF]"
        animate={{ width: `${Math.min(pct, mark)}%` }}
        transition={{ duration: reduce ? 0 : 0.15 }}
      />
      {pct > mark && (
        <motion.div
          className="absolute top-2 h-1.5 bg-[#FF8A7A]"
          style={{ left: `${mark}%` }}
          animate={{ width: `${pct - mark}%` }}
          transition={{ duration: reduce ? 0 : 0.15 }}
        />
      )}
      <div className="absolute top-0 h-5 border-l border-dashed border-[#FFB547]" style={{ left: `${mark}%` }} />
      <span className="absolute -top-0.5 ml-1 text-[9px] text-[#FFB547]" style={{ left: `${mark}%` }}>
        100 m
      </span>
      <motion.span
        className="absolute top-[5px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[#0B2447] bg-[#FFB547]"
        animate={{ left: `${pct}%` }}
        transition={{ duration: reduce ? 0 : 0.15 }}
      />
    </div>
  );
}

/**
 * A cable lane. Pulses leave the sender at full brightness and arrive at `strength` (0–1),
 * so the fading is visible along the wire. `speed` is seconds per crossing (smaller = faster).
 */
function Lane(props: {
  label: string;
  icon: string;
  strength: number;
  color: string;
  speed?: number;
  variant?: "copper" | "fiber";
}) {
  const reduce = useReducedMotion();
  const speed = props.speed ?? 2.4;
  const dead = props.strength <= 0.02;
  const bars = dead ? 0 : Math.max(1, Math.ceil(props.strength * 4));
  const tail = Math.round((0.12 + 0.88 * props.strength) * 255)
    .toString(16)
    .padStart(2, "0");
  const zig = Array.from({ length: 11 }, (_, i) => `${i * 20},${i % 2 ? 31 : 9}`).join(" ");
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-[#EAF1FB]">
        <span>{props.label}</span>
        <span className="flex items-center gap-2">
          <span className="flex items-end gap-0.5" aria-hidden>
            {[0, 1, 2, 3].map((k) => (
              <motion.span
                key={k}
                className="w-1 rounded-sm"
                style={{ height: 4 + k * 3 }}
                animate={{ backgroundColor: k < bars ? "#5FD4C4" : "#2A4A75" }}
              />
            ))}
          </span>
          <span className={dead ? "text-[#FF8A7A]" : "text-[#5FD4C4]"}>
            {dead ? "Signal lost" : `Signal ${Math.round(props.strength * 100)}%`}
          </span>
        </span>
      </div>
      <div className="relative h-10 overflow-hidden rounded-md bg-[#0B2447] ring-1 ring-[#7FB5FF]/30">
        {/* sender flare */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-10"
          style={{ background: `linear-gradient(90deg, ${props.color}55, transparent)` }}
        />
        {props.variant === "fiber" ? (
          <>
            <div className="absolute inset-x-0 top-1.5 bottom-1.5 border-y border-[#5FD4C4]/40 bg-[#5FD4C4]/10" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden>
              <motion.polyline
                points={zig}
                fill="none"
                stroke={props.color}
                strokeOpacity={0.55}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
                animate={reduce ? undefined : { strokeDashoffset: [0, -18] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </>
        ) : (
          <div
            className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2"
            style={{ background: `linear-gradient(90deg, ${props.color}, ${props.color}${tail})` }}
          />
        )}
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute top-2 text-lg"
            style={{ color: props.color, textShadow: `0 0 10px ${props.color}` }}
            initial={{ left: "-8%" }}
            animate={
              reduce
                ? { left: `${i * 25}%`, opacity: props.strength }
                : {
                    left: ["-8%", "104%"],
                    opacity: [1, Math.max(0, props.strength)],
                    scale: [1.15, 0.6 + 0.4 * props.strength],
                  }
            }
            transition={{ duration: speed, repeat: Infinity, ease: "linear", delay: (i * speed) / 4 }}
          >
            {props.icon}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visuals – one per beat                                              */
/* ------------------------------------------------------------------ */

const STREAM = "011010010110".split("");

/* 1 – two computers, one cable, a file travels across as a stream of bits */
function FileTransferVisual() {
  const [run, setRun] = useState(0);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(true);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex w-full items-center">
        <Computer
          label="Sender"
          active={busy}
          extra={
            <span className="h-1 w-12 overflow-hidden rounded bg-[#123A6B]" aria-hidden>
              <motion.span
                key={`s-${run}`}
                className="block h-full bg-[#7FB5FF]"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: reduce ? 0 : 1.8, ease: "easeInOut" }}
              />
            </span>
          }
        />
        <div className="relative mx-2 h-1.5 flex-1 rounded bg-[#7FB5FF]">
          {/* RJ45 plugs */}
          <span aria-hidden className="absolute -left-1.5 top-1/2 h-3.5 w-2.5 -translate-y-1/2 rounded-sm bg-[#C9D6EA]" />
          <span aria-hidden className="absolute -right-1.5 top-1/2 h-3.5 w-2.5 -translate-y-1/2 rounded-sm bg-[#C9D6EA]" />
          {/* wire glows while data is moving */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded"
            animate={{ boxShadow: busy ? "0 0 14px 3px rgba(255,181,71,.55)" : "0 0 0px 0px rgba(255,181,71,0)" }}
          />
          {/* the file, chopped into bits riding the wire */}
          {!reduce &&
            busy &&
            STREAM.map((ch, i) => (
              <motion.span
                key={`${run}-b${i}`}
                aria-hidden
                className="absolute -top-[5px] rounded bg-[#0B2447] px-px font-mono text-[10px] leading-none text-[#FFB547]"
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: "96%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.3, delay: 0.1 + i * 0.1, ease: "linear" }}
              >
                {ch}
              </motion.span>
            ))}
          <motion.span
            key={run}
            className="absolute -top-4 text-xl"
            initial={{ left: "0%" }}
            animate={{ left: "88%" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            onAnimationComplete={() => {
              setSent(true);
              setBusy(false);
            }}
          >
            📄
          </motion.span>
          <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap text-[11px] text-[#7FB5FF]">
            Ethernet cable
          </span>
        </div>
        <Computer
          label={sent ? "Got the file" : "Receiver"}
          active={busy}
          burst={sent}
          extra={
            <span className="h-1 w-12 overflow-hidden rounded bg-[#123A6B]" aria-hidden>
              <motion.span
                key={`r-${run}`}
                className="block h-full bg-[#5FD4C4]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: reduce ? 0 : 1.8, ease: "easeInOut" }}
              />
            </span>
          }
        />
      </div>
      <button
        type="button"
        onClick={() => {
          setSent(false);
          setBusy(true);
          setRun((r) => r + 1);
        }}
        className={`rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 ${ring}`}
      >
        Transfer the file
      </button>
    </div>
  );
}

/* 2 – point-to-point */
function PointToPointVisual() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <motion.div
        animate={{
          borderColor: open ? "#FFB547" : "rgba(127,181,255,0.3)",
          boxShadow: open ? "0 0 26px rgba(255,181,71,.35)" : "0 0 0 rgba(0,0,0,0)",
        }}
        className="relative flex w-full items-center rounded-xl border-2 border-dashed px-3 py-5"
      >
        {open && !reduce && (
          <motion.span
            key="burst"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#FFB547]"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        )}
        <Computer label="Computer 1" active={open} />
        <div className="relative mx-2 h-1.5 flex-1 rounded bg-[#7FB5FF]">
          <span aria-hidden className="absolute -left-1.5 top-1/2 h-3.5 w-2.5 -translate-y-1/2 rounded-sm bg-[#C9D6EA]" />
          <span aria-hidden className="absolute -right-1.5 top-1/2 h-3.5 w-2.5 -translate-y-1/2 rounded-sm bg-[#C9D6EA]" />
          {!reduce &&
            [0, 1].map((i) => (
              <Fragment key={i}>
                <motion.span
                  aria-hidden
                  className="absolute -top-[3px] h-3 w-3 rounded-full bg-[#FFE2A8]"
                  style={{ boxShadow: "0 0 10px 3px rgba(255,181,71,.7)" }}
                  initial={{ left: "0%" }}
                  animate={{ left: "96%" }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: i * 1.1 }}
                />
                <motion.span
                  aria-hidden
                  className="absolute top-[7px] h-2 w-2 rounded-full bg-[#5FD4C4]"
                  style={{ boxShadow: "0 0 8px 2px rgba(95,212,196,.7)" }}
                  initial={{ left: "96%" }}
                  animate={{ left: "0%" }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: i * 1.3 }}
                />
              </Fragment>
            ))}
          <AnimatePresence>
            {open && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0, scale: 0, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-9 left-1/2 -translate-x-1/2 text-2xl"
              >
                🔗
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <Computer label="Computer 2" active={open} />
      </motion.div>
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-pressed={open}
          animate={open ? {} : { scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className={`rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] ${ring}`}
        >
          {open ? "Point-to-point network" : "Name this network"}
        </motion.button>
        <AnimatePresence mode="wait">
          <motion.span
            key={open ? "ok" : "q"}
            className="text-2xl"
            aria-hidden
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
          >
            {open ? "✅" : "❓"}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* 3 – bits and bytes */
const PLACE = [128, 64, 32, 16, 8, 4, 2, 1];

function BitsVisual() {
  const [bits, setBits] = useState<number[]>([0, 1, 0, 0, 1, 1, 0, 1]);
  const value = parseInt(bits.join(""), 2);
  const glyph = value >= 33 && value <= 126 ? String.fromCharCode(value) : null;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex gap-1.5 sm:gap-2" role="group" aria-label="One byte, eight bits">
        {bits.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.span
              aria-hidden
              animate={{ color: b ? "#FFB547" : "#7FB5FF", opacity: b ? 1 : 0.5 }}
              className="font-mono text-[10px]"
            >
              {PLACE[i]}
            </motion.span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              whileHover={{ y: -2 }}
              animate={{
                backgroundColor: b ? "#FFB547" : "#0B2447",
                color: b ? "#0B2447" : "#EAF1FB",
                boxShadow: b ? "0 0 16px rgba(255,181,71,.75)" : "0 0 0 rgba(255,181,71,0)",
              }}
              onClick={() => setBits((p) => p.map((x, j) => (j === i ? 1 - x : x)))}
              aria-label={`Bit ${i + 1}, currently ${b}. Tap to flip.`}
              className={`h-11 w-8 rounded-md font-mono text-xl font-bold ring-1 ring-[#7FB5FF]/50 sm:h-12 sm:w-10 ${ring}`}
            >
              <motion.span
                key={b}
                className="block"
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {b}
              </motion.span>
            </motion.button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-[#7FB5FF]">
        <span className="h-px w-10 bg-[#7FB5FF]" />8 bits = 1 byte
        <span className="h-px w-10 bg-[#7FB5FF]" />
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm text-[#EAF1FB]">
          This byte holds the number{" "}
          <motion.span
            key={value}
            className="inline-block font-mono text-[#FFB547]"
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {value}
          </motion.span>
        </p>
        {glyph && (
          <motion.span
            key={glyph}
            aria-hidden
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#123A6B] font-mono text-sm text-[#FFB547] ring-1 ring-[#FFB547]/50"
          >
            {glyph}
          </motion.span>
        )}
      </div>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#123A6B]" aria-hidden>
        <motion.div
          className="h-full bg-gradient-to-r from-[#7FB5FF] to-[#FFB547]"
          animate={{ width: `${(value / 255) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        />
      </div>
      <div className="flex items-center gap-3">
        <p className="text-xs text-[#7FB5FF]/80">Tap any bit to flip it between 0 and 1</p>
        <button
          type="button"
          aria-label="Randomize the byte"
          onClick={() => setBits(Array.from({ length: 8 }, () => (Math.random() < 0.5 ? 0 : 1)))}
          className={`rounded-full border border-[#7FB5FF]/60 px-2 py-0.5 text-sm hover:bg-[#7FB5FF]/20 ${ring}`}
        >
          🎲
        </button>
        <button
          type="button"
          aria-label="Clear all bits"
          onClick={() => setBits([0, 0, 0, 0, 0, 0, 0, 0])}
          className={`rounded-full border border-[#7FB5FF]/60 px-2 py-0.5 text-sm hover:bg-[#7FB5FF]/20 ${ring}`}
        >
          ⟲
        </button>
      </div>
    </div>
  );
}

/* 4 – bits become a physical signal */
function SignalVisual() {
  const bits = [0, 1, 0, 0, 1, 1, 0, 1];
  const W = 36;
  const hi = 22;
  const lo = 68;
  const DUR = 2.4;
  let d = `M0 ${bits[0] ? hi : lo}`;
  bits.forEach((b, i) => {
    const y = b ? hi : lo;
    d += ` L${i * W} ${y} L${(i + 1) * W} ${y}`;
  });
  // a window that steps across one bit at a time, in sync with the drawing
  const winX: number[] = [];
  const winT: number[] = [];
  bits.forEach((_, i) => {
    winX.push(i * W, i * W);
    winT.push(i / bits.length, (i + 1) / bits.length - 0.001);
  });
  winX.push((bits.length - 1) * W);
  winT.push(1);

  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <svg viewBox={`-10 0 ${bits.length * W + 16} 92`} className="w-full max-w-md" role="img" aria-label="Zeros and ones drawn as a voltage signal">
        {!reduce && (
          <motion.rect
            key={`win-${run}`}
            y={8}
            width={W}
            height={74}
            rx={3}
            fill="#FFB547"
            fillOpacity={0.09}
            initial={{ x: 0 }}
            animate={{ x: winX }}
            transition={{ duration: DUR, times: winT, ease: "linear" }}
          />
        )}
        <line x1="-6" x2={bits.length * W + 6} y1={hi} y2={hi} stroke="#7FB5FF" strokeOpacity=".2" strokeDasharray="3 4" />
        <line x1="-6" x2={bits.length * W + 6} y1={lo} y2={lo} stroke="#7FB5FF" strokeOpacity=".2" strokeDasharray="3 4" />
        <text x="-9" y={hi + 3} fontSize="8" fill="#7FB5FF" fontFamily="monospace">1</text>
        <text x="-9" y={lo + 3} fontSize="8" fill="#7FB5FF" fontFamily="monospace">0</text>
        {bits.map((_, i) => (
          <line key={i} x1={i * W} x2={i * W} y1={10} y2={78} stroke="#7FB5FF" strokeOpacity=".12" />
        ))}
        {/* soft glow under the trace */}
        <motion.path
          key={`g-${run}`}
          d={d}
          fill="none"
          stroke="#FFB547"
          strokeOpacity={0.25}
          strokeWidth="9"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: DUR, ease: "linear" }}
        />
        <motion.path
          key={run}
          d={d}
          fill="none"
          stroke="#FFB547"
          strokeWidth="3"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: DUR, ease: "linear" }}
        />
        {!reduce && (
          <g key={`cur-${run}`}>
            <circle r="9" fill="#FFB547" fillOpacity="0.3">
              <animateMotion dur={`${DUR}s`} path={d} fill="freeze" />
            </circle>
            <circle r="4" fill="#FFE2A8">
              <animateMotion dur={`${DUR}s`} path={d} fill="freeze" />
            </circle>
          </g>
        )}
        {bits.map((b, i) => (
          <motion.text
            key={`${run}-${i}`}
            x={i * W + W / 2}
            y="88"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
            initial={{ fill: reduce ? "#FFB547" : "#7FB5FF" }}
            animate={{ fill: "#FFB547" }}
            transition={{ delay: reduce ? 0 : (i * DUR) / bits.length, duration: 0.2 }}
          >
            {b}
          </motion.text>
        ))}
      </svg>
      <p className="text-sm text-[#EAF1FB]">Zeros and ones in, a physical signal out.</p>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className={`rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 ${ring}`}
      >
        Send the signal
      </button>
    </div>
  );
}

/* 5 – copper fades */
function CopperVisual() {
  const [dist, setDist] = useState(20);
  const strength = Math.max(0, 1 - dist / 100);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>🖥️</span>
        <div className="flex-1">
          <Lane label="Ethernet cable, copper wire" icon="⚡" strength={strength} color="#FFB547" />
        </div>
        <motion.span
          className="text-2xl"
          aria-hidden
          animate={{ opacity: 0.25 + 0.75 * strength, filter: strength <= 0.02 ? "grayscale(1)" : "grayscale(0)" }}
        >
          🖥️
        </motion.span>
      </div>
      <Ruler dist={dist} max={150} />
      <Slider label="Cable length" value={dist} min={0} max={150} unit=" m" onChange={setDist} />
      <p className="h-5 text-center text-sm text-[#7FB5FF]" aria-live="polite">
        {dist >= 100 ? "Past 100 m the electricity has faded out." : dist > 60 ? "Electricity fades over long distances." : "Drag the slider to stretch the cable."}
      </p>
    </div>
  );
}

/* 6 – fiber vs copper */
function FiberVisual() {
  const [dist, setDist] = useState(60);
  const copper = Math.max(0, 1 - dist / 100);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <Lane label="Ethernet, electricity" icon="⚡" strength={copper} color="#FFB547" speed={2.8} />
      <Lane label="Fiber optic, pulses of light" icon="💡" strength={1} color="#5FD4C4" speed={1.2} variant="fiber" />
      <Ruler dist={dist} max={500} />
      <Slider label="Distance" value={dist} min={0} max={500} unit=" m" onChange={setDist} />
      <p className="h-5 text-center text-sm text-[#7FB5FF]" aria-live="polite">
        {dist > 100 ? "Ethernet gave up. Light keeps going." : "Stretch it past 100 m."}
      </p>
    </div>
  );
}

/* 7 – the shark */
const BUBBLES = [
  { l: 12, d: 0, s: 5 },
  { l: 27, d: 1.4, s: 4 },
  { l: 41, d: 2.6, s: 6 },
  { l: 58, d: 0.7, s: 4 },
  { l: 71, d: 3.1, s: 5 },
  { l: 88, d: 1.9, s: 3 },
];

function OceanVisual() {
  const [cut, setCut] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col gap-3">
      <motion.div
        animate={cut && !reduce ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex-1 overflow-hidden rounded-lg bg-gradient-to-b from-[#1B5FA8] to-[#0B2447]"
      >
        {/* light rays from the surface */}
        {!reduce &&
          [18, 45, 72].map((l, i) => (
            <motion.span
              key={l}
              aria-hidden
              className="absolute -top-4 h-[70%] w-10 origin-top -skew-x-12 bg-gradient-to-b from-white/20 to-transparent"
              style={{ left: `${l}%` }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 1.2 }}
            />
          ))}
        {/* surface waves */}
        <motion.div
          aria-hidden
          className="absolute left-0 top-0 h-3 w-[200%]"
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <svg className="h-full w-full" viewBox="0 0 400 12" preserveAspectRatio="none">
            <path
              d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 T250 6 T300 6 T350 6 T400 6 V0 H0 Z"
              fill="rgba(255,255,255,.35)"
            />
          </svg>
        </motion.div>

        {/* bubbles */}
        {!reduce &&
          BUBBLES.map((b, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full border border-white/50"
              style={{ left: `${b.l}%`, width: b.s * 2, height: b.s * 2 }}
              initial={{ bottom: "8%", opacity: 0 }}
              animate={{ bottom: "92%", opacity: [0, 0.7, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: b.d, ease: "easeIn" }}
            />
          ))}
        {/* background fish */}
        {!reduce &&
          [
            { top: "38%", dur: 14, d: 0 },
            { top: "52%", dur: 18, d: 5 },
          ].map((f, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute text-lg opacity-60"
              initial={{ left: "-8%" }}
              animate={{ left: "108%" }}
              transition={{ duration: f.dur, repeat: Infinity, ease: "linear", delay: f.d }}
              style={{ top: f.top, scaleX: -1 }}
            >
              🐟
            </motion.span>
          ))}
        {/* sea floor */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-[#C9A66B]/60 to-transparent" />
        {[22, 63, 86].map((l, i) => (
          <motion.span
            key={l}
            aria-hidden
            className="absolute bottom-2 origin-bottom text-lg"
            style={{ left: `${l}%` }}
            animate={reduce ? undefined : { rotate: [-6, 6, -6] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            🌿
          </motion.span>
        ))}

        <motion.span
          className="absolute left-2 top-3 text-3xl"
          animate={{ opacity: 1 }}
        >
          🌎
        </motion.span>
        <motion.span
          className="absolute right-2 top-3 text-3xl"
          animate={{ opacity: cut ? 0.35 : 1, filter: cut ? "grayscale(1)" : "grayscale(0)" }}
        >
          🌍
        </motion.span>

        {/* cable on the sea floor */}
        <div className="absolute bottom-6 left-4 right-4 h-1.5">
          <motion.div
            className="absolute inset-y-0 left-0 rounded bg-[#5FD4C4]"
            animate={{ width: cut ? "44%" : "100%", boxShadow: "0 0 10px 2px rgba(95,212,196,.55)" }}
          />
          {cut && <div className="absolute inset-y-0 right-0 rounded bg-[#2E4A66]" style={{ width: "44%" }} />}
          {/* data pulses: all the way across, or only up to the break */}
          {!reduce &&
            [0, 1, 2, 3].map((i) => (
              <motion.span
                key={`${cut}-${i}`}
                aria-hidden
                className="absolute -top-[3px] h-3 w-3 rounded-full bg-[#E9FFFB]"
                style={{ boxShadow: "0 0 10px 3px rgba(95,212,196,.9)" }}
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: cut ? "44%" : "98%", opacity: cut ? [0, 1, 1, 0] : [0, 1, 1, 0] }}
                transition={{ duration: cut ? 1.6 : 3, repeat: Infinity, ease: "linear", delay: i * (cut ? 0.4 : 0.75) }}
              />
            ))}
          {cut && (
            <>
              <motion.span
                className="absolute left-1/2 -top-4 -translate-x-1/2 text-xl"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                💥
              </motion.span>
              {!reduce &&
                [0, 1, 2].map((k) => (
                  <motion.span
                    key={k}
                    aria-hidden
                    className="absolute left-[44%] top-0 text-sm"
                    animate={{ x: [0, (k - 1) * 22], y: [0, -26 - k * 4], opacity: [1, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: k * 0.25 }}
                  >
                    ⚡
                  </motion.span>
                ))}
            </>
          )}
        </div>

        <motion.span
          className="absolute bottom-8 text-4xl"
          initial={{ left: "5%", scaleX: -1 }}
          animate={
            cut
              ? { left: "44%", scaleX: -1, scale: [1, 1.35, 1] }
              : reduce
                ? { left: "30%", scaleX: -1 }
                : { left: ["5%", "82%", "5%"], scaleX: [-1, -1, 1, 1] }
          }
          transition={
            cut
              ? { duration: 0.8 }
              : {
                  left: { duration: 9, repeat: Infinity, ease: "easeInOut" },
                  scaleX: { duration: 9, repeat: Infinity, times: [0, 0.49, 0.5, 1], ease: "linear" },
                }
          }
        >
          🦈
        </motion.span>

        {/* blackout on the far side */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[#020C1C]"
          animate={{ opacity: cut ? 0.45 : 0 }}
          transition={{ duration: 0.6 }}
        />

        <AnimatePresence>
          {cut && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-10 text-center font-serif text-lg font-bold text-white"
            >
              The whole internet's gone.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
      <button
        type="button"
        onClick={() => setCut((c) => !c)}
        className={`mx-auto rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] ${ring}`}
      >
        {cut ? "Repair the cable" : "Let the shark bite"}
      </button>
    </div>
  );
}

/* 8 – Wi-Fi */
const AIR_BITS = "01101001".split("");

function WifiGlyph({ on }: { on: boolean }) {
  const reduce = useReducedMotion();
  const arcs = ["M5 10 A10 10 0 0 1 19 10", "M8 13 A6 6 0 0 1 16 13", "M10.5 16 A2.5 2.5 0 0 1 13.5 16"];
  return (
    <svg viewBox="0 0 24 20" className="h-5 w-6" aria-hidden>
      {arcs.map((p, i) => (
        <motion.path
          key={i}
          d={p}
          fill="none"
          stroke="#FFB547"
          strokeWidth={2}
          strokeLinecap="round"
          animate={on && !reduce ? { opacity: [0.2, 1, 0.2] } : { opacity: on ? 1 : 0.2 }}
          transition={{ duration: 1.2, repeat: Infinity, delay: (2 - i) * 0.2 }}
        />
      ))}
      <circle cx="12" cy="19" r="1.4" fill="#FFB547" opacity={on ? 1 : 0.2} />
    </svg>
  );
}

function WifiVisual() {
  const [from, setFrom] = useState<0 | 1>(0);
  const reduce = useReducedMotion();
  const devices = [
    { icon: "📱", name: "Phone" },
    { icon: "💻", name: "Laptop" },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="relative flex w-full items-center justify-between px-6">
        {/* the cable that is NOT there */}
        <div aria-hidden className="absolute left-24 right-24 top-1/2 border-t border-dashed border-[#7FB5FF]/25" />
        <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[170%] text-sm opacity-40">
          ✂️
        </span>

        {devices.map((d, i) => (
          <button
            key={d.name}
            type="button"
            onClick={() => setFrom(i as 0 | 1)}
            aria-pressed={from === i}
            className={`relative z-10 flex flex-col items-center gap-1 rounded-xl p-3 transition-colors ${ring} ${from === i ? "bg-[#FFB547]/15" : ""}`}
          >
            <WifiGlyph on={from === i} />
            <motion.span
              className="text-4xl"
              animate={from === i && !reduce ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 1.2, repeat: from === i ? Infinity : 0 }}
            >
              {d.icon}
            </motion.span>
            <span className="text-xs text-[#EAF1FB]">{from === i ? "Transmitting" : "Receiving"}</span>
            {/* signal bars light up on the receiver */}
            <span className="flex items-end gap-0.5" aria-hidden>
              {[0, 1, 2, 3].map((k) => (
                <motion.span
                  key={k}
                  className="w-1 rounded-sm"
                  style={{ height: 4 + k * 3 }}
                  animate={
                    from === i
                      ? { backgroundColor: "#2A4A75" }
                      : reduce
                        ? { backgroundColor: "#5FD4C4" }
                        : { backgroundColor: ["#2A4A75", "#5FD4C4", "#2A4A75"] }
                  }
                  transition={{ duration: 1.6, repeat: Infinity, delay: k * 0.2 }}
                />
              ))}
            </span>
          </button>
        ))}

        {/* radio waves */}
        {!reduce &&
          [0, 1, 2, 3].map((i) => (
            <motion.div
              key={`${from}-${i}`}
              className="absolute top-1/2 h-16 w-16 rounded-full border-2 border-[#7FB5FF]"
              style={{ y: "-50%", left: from === 0 ? "1.5rem" : undefined, right: from === 1 ? "1.5rem" : undefined }}
              animate={{ scale: [0.4, 4], opacity: [0.7, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
            />
          ))}

        {/* zeros and ones riding the waves */}
        {!reduce &&
          AIR_BITS.map((ch, i) => (
            <motion.span
              key={`${from}-b${i}`}
              aria-hidden
              className="absolute top-1/2 z-0 -translate-y-1/2 font-mono text-base font-bold text-[#FFB547]"
              style={{ textShadow: "0 0 8px #FFB547" }}
              initial={{ opacity: 0, left: from === 0 ? "24%" : "76%" }}
              animate={{ left: from === 0 ? ["24%", "76%"] : ["76%", "24%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: i * 0.27 }}
            >
              {ch}
            </motion.span>
          ))}
      </div>
      <p className="font-mono text-lg tracking-[0.4em] text-[#FFB547]">
        {AIR_BITS.map((ch, i) => (
          <Fragment key={`${from}-t${i}`}>
            <motion.span
              className="inline-block"
              animate={reduce ? undefined : { opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.27 }}
            >
              {ch}
            </motion.span>
            {i < AIR_BITS.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </p>
      <p className="text-sm text-[#EAF1FB]">Radio waves instead of a physical cable. Tap a device to swap roles.</p>
    </div>
  );
}

/* 9 – the cable explosion */
function MeshVisual() {
  const [n, setN] = useState(4);
  const [hot, setHot] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const cx = 100;
  const cy = 100;
  const r = 76;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const lines: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) lines.push([i, j]);
  const cables = (n * (n - 1)) / 2;
  const heat = Math.min(1, (cables - 1) / 60);
  const stroke = `rgb(${Math.round(127 + 128 * heat)},${Math.round(181 - 43 * heat)},${Math.round(255 - 133 * heat)})`;
  const step = Math.max(1, Math.floor(lines.length / 4));
  const pulseLines = lines.filter((_, i) => i % step === 0).slice(0, 4);

  return (
    <div className="flex h-full items-center gap-4">
      <svg viewBox="0 0 200 200" className="h-full max-h-72 flex-1" role="img" aria-label={`${n} computers each cabled to every other`}>
        {lines.map(([a, b]) => {
          const isHot = hot !== null && (hot === a || hot === b);
          return (
            <motion.line
              key={`${a}-${b}`}
              initial={{ x1: pts[a].x, y1: pts[a].y, x2: pts[b].x, y2: pts[b].y, pathLength: 0, stroke }}
              animate={{
                x1: pts[a].x,
                y1: pts[a].y,
                x2: pts[b].x,
                y2: pts[b].y,
                pathLength: 1,
                stroke: isHot ? "#FFB547" : stroke,
                strokeOpacity: hot === null ? 0.35 + 0.35 * heat : isHot ? 1 : 0.08,
                strokeWidth: isHot ? 2.2 : 1.2,
              }}
              transition={{ duration: 0.4 }}
            />
          );
        })}
        {!reduce &&
          pulseLines.map(([a, b], k) => (
            <motion.circle
              key={`${n}-p${k}`}
              r={2.5}
              fill="#FFE2A8"
              initial={{ cx: pts[a].x, cy: pts[a].y, opacity: 0 }}
              animate={{ cx: [pts[a].x, pts[b].x], cy: [pts[a].y, pts[b].y], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: k * 0.5, ease: "linear" }}
            />
          ))}
        {pts.map((p, i) => (
          <motion.g
            key={i}
            initial={{ x: p.x, y: p.y, opacity: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 1 }}
            transition={{ duration: 0.4 }}
            onMouseEnter={() => setHot(i)}
            onMouseLeave={() => setHot(null)}
            onClick={() => setHot((h) => (h === i ? null : i))}
            style={{ cursor: "pointer" }}
          >
            {!reduce && n <= 8 && (
              <motion.circle
                r={9}
                fill="none"
                stroke="#FFB547"
                strokeWidth={1}
                animate={{ r: [9, 15], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />
            )}
            <circle r={hot === i ? 10 : 9} fill="#FFB547" stroke="#0B2447" strokeWidth="2" />
            <text y={3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0B2447" fontFamily="monospace">
              {n - 1}
            </text>
          </motion.g>
        ))}
      </svg>
      <div className="w-40 space-y-3 sm:w-48">
        <Slider label="Computers" value={n} min={2} max={16} onChange={setN} />
        <p className="text-sm text-[#EAF1FB]">
          Cables needed:{" "}
          <motion.span
            key={cables}
            className="inline-block font-mono text-xl font-bold text-[#FFB547]"
            initial={{ y: -8, opacity: 0, scale: 1.3 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
          >
            {cables}
          </motion.span>
        </p>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#123A6B]" aria-hidden>
          <motion.div
            className="h-full bg-gradient-to-r from-[#7FB5FF] via-[#FFB547] to-[#FF8A7A]"
            animate={{ width: `${(cables / 120) * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />
        </div>
        <p className="text-xs text-[#7FB5FF]">Every device cabled to every other device.</p>
      </div>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  FileTransferVisual,
  PointToPointVisual,
  BitsVisual,
  SignalVisual,
  CopperVisual,
  FiberVisual,
  OceanVisual,
  WifiVisual,
  MeshVisual,
];

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

const LAYER_BARS = ["#FFB547", "#7FB5FF", "#5FD4C4", "#EAF1FB"]; // layers 4 → 1

export default function Section02PhysicalLayer({ onComplete }: Props) {
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
      aria-label="Section 2: Layer 1, the physical layer"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Layer 1: The physical layer</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
          {/* mini layer stack: Layer 1 is lit */}
          <div className="flex flex-col gap-1 pt-1" aria-hidden>
            {LAYER_BARS.map((c, i) => {
              const lit = i === 3;
              return (
                <motion.span
                  key={c}
                  className="block h-1.5 w-9 rounded-sm"
                  style={{ backgroundColor: c }}
                  animate={{ opacity: lit ? 1 : 0.22, boxShadow: lit ? `0 0 10px ${c}` : "0 0 0 transparent" }}
                />
              );
            })}
          </div>
        </header>

        <div className="relative h-80 overflow-hidden rounded-xl border border-[#7FB5FF]/30 bg-[#0B2447]/70 p-4 sm:h-[22rem]">
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

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={step === 0}
            className={`rounded-full border border-[#7FB5FF]/60 px-4 py-2 text-sm transition-opacity hover:bg-[#7FB5FF]/20 disabled:opacity-30 ${ring}`}
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
              On to layer 2
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
