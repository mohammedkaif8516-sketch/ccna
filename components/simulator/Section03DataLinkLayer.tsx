"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 3 – Layer 2: The data link layer (switches, frames, MAC table)
 * Transcript range: 02:31 – 05:06
 *
 * Dependencies: react, motion/react, tailwindcss
 * Usage:  <Section03DataLinkLayer onComplete={() => goToSection(4)} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/* Transcript (02:31 – 05:06)                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "So layer two, the data link layer, that's what it's what it's called. So what's the solution to this problem when we have a bunch of computers? Well, we can add a device called a switch. With the switch, we can connect a bunch of devices together. And this is actually what we see in modern networks today.",
  "And remember in the beginning how we said that every single device in the planet has a unique identifier called a MAC address. Well, layer 2 uses these MAC addresses. So layer 2 actually wraps those raw zeros and ones into a package called a frame.",
  "And every frame has a lot of things but the most important thing is it has a source MAC address and a destination MAC address.",
  "And there are three different types of destination traffic in a network. We have unicast which is one to one. So this is like sending a frame directly to one MAC address. You can think of it like a private text.",
  "Then we have broadcast which is one to everyone. This is like shouting a message so that every device on your network can hear the message. And broadcast messages have a special MAC address. So if the switch sees that its destination MAC address is all FS that means it's a broadcast address.",
  "And lastly, we have multicast, which is one to many. Um, you can think of this like a group chat. Only a select handful of devices will receive the message. You'll see the importance of these types of traffic, especially unicast and broadcast in just a bit, but for now, let's look at the switch.",
  "Inside of a switch is something called a MAC address table. It's a table that maps a devices MAC address to the port that it's connected to. This is how the switch will know where to send different types of traffic.",
  "So the way the switch works is if it receives a frame on an interface, it will look at the source MAC address and it'll take note of what interface it came in on and then it adds it to the MAC address table.",
  "Then it'll look at the frames destination MAC address and then it will refer back to the MAC address table to see if it has a match. And now there are two possible situations here. One, the switch either knows the MAC address or it doesn't. When it knows the MAC address, then it will forward it out of the port that's specified in the MAC address table. But if it doesn't know the MAC address, then it'll send something called an unknown unicast, which basically takes the frame and floods it out of all the interfaces except for the one it received it on.",
  "And so if the destination is actually connected to the switch, it'll receive the frame and send the reply back. And with that reply, the switch will know what interface that MAC address is on, it'll add it to the MAC address table. And if those two devices want to talk again, they can talk without needing to do this unknown unicast message every single time.",
  "Now, for phones and for laptops, like things that need Wi-Fi, something called an access point can be used and plugged into the switch. Now, this access point is basically like a wireless bridge. It's not a router, as a lot of people think it is. It's not.",
  "Your phone sends frames to the access point by using radio waves and then the AP will translate it onto the Ethernet cable so it can be sent to the switch. So, to the switch, your wireless phone looks just like another MAC address on that port.",
];

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]";
const chip = `rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 ${ring}`;
const solid = `rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] disabled:opacity-40 ${ring}`;

const DEV = [
  { name: "A", icon: "💻", mac: "0A:AA" },
  { name: "B", icon: "🖥️", mac: "0B:BB" },
  { name: "C", icon: "💻", mac: "0C:CC" },
  { name: "D", icon: "🖥️", mac: "0D:DD" },
];

const BROADCAST = "FF:FF:FF:FF:FF:FF";

function useTimers() {
  const t = useRef<number[]>([]);
  useEffect(() => () => t.current.forEach((x) => window.clearTimeout(x)), []);
  return (fn: () => void, ms: number) => {
    t.current.push(window.setTimeout(fn, ms));
  };
}

/** The switch: a bar with a row of port LEDs. `lit` are LED indices (0–7), `glow` flares it. */
function SwitchBar({ label = "Switch", glow = false, lit = [] }: { label?: string; glow?: boolean; lit?: number[] }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={{
        backgroundColor: glow ? "#FFD08A" : "#7FB5FF",
        boxShadow: glow ? "0 0 20px 4px rgba(255,181,71,.7)" : "0 0 0 0 rgba(255,181,71,0)",
      }}
      className="relative flex flex-col items-center justify-center rounded-md py-1 text-xs font-semibold text-[#0B2447]"
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

/** A tiny frame: destination segment, source segment, payload bits. */
function FrameChip({ dst = "#FFB547", src = "#5FD4C4" }: { dst?: string; src?: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex overflow-hidden rounded-[3px] font-mono text-[7px] font-bold leading-none text-[#0B2447]"
      style={{ boxShadow: `0 0 10px ${dst}` }}
    >
      <span className="px-[3px] py-[3px]" style={{ background: dst }}>D</span>
      <span className="px-[3px] py-[3px]" style={{ background: src }}>S</span>
      <span className="bg-[#7FB5FF] px-[3px] py-[3px]">01</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 1 – a switch connects a bunch of devices                            */
/* ------------------------------------------------------------------ */

function SwitchIntroVisual() {
  const [n, setN] = useState(3);
  const reduce = useReducedMotion();
  const icons = ["💻", "🖥️", "📱", "💻", "🖥️", "📱", "💻", "🖥️"];
  const cx = 150;
  const cy = 100;
  const pos = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + 85 * Math.cos(a) * 1.35, y: cy + 70 * Math.sin(a) };
  });
  const ghost: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) ghost.push([i, j]);
  const pairs = [0, 1].map((k) => {
    const a = k % n;
    let b = (a + 1 + Math.floor(n / 2) + k) % n;
    if (b === a) b = (a + 1) % n;
    return [a, b] as const;
  });

  return (
    <div className="flex h-full flex-col items-center gap-2">
      <svg viewBox="0 0 300 200" className="min-h-0 w-full flex-1" role="img" aria-label={`A switch connecting ${n} devices`}>
        {/* the cables you no longer need */}
        {ghost.map(([a, b]) => (
          <line
            key={`g${a}-${b}`}
            x1={pos[a].x}
            y1={pos[a].y}
            x2={pos[b].x}
            y2={pos[b].y}
            stroke="#7FB5FF"
            strokeOpacity={0.12}
            strokeDasharray="3 4"
          />
        ))}
        {pos.map((p, i) => (
          <Fragment key={i}>
            <motion.line
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#7FB5FF"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
            {!reduce && (
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={14}
                fill="none"
                stroke="#FFB547"
                initial={{ opacity: 0.8, scale: 0.3 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.8 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            )}
            <motion.g
              animate={reduce ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 2.6 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            >
              <motion.text
                x={p.x}
                y={p.y + 8}
                textAnchor="middle"
                fontSize="24"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 14 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {icons[i]}
              </motion.text>
            </motion.g>
          </Fragment>
        ))}
        {/* frames hopping device → switch → device */}
        {!reduce &&
          pairs.map(([a, b], k) => (
            <Fragment key={`${n}-${k}`}>
              <motion.circle
                r={9}
                fill="#FFB547"
                fillOpacity={0.3}
                initial={{ cx: pos[a].x, cy: pos[a].y }}
                animate={{ cx: [pos[a].x, cx, pos[b].x], cy: [pos[a].y, cy, pos[b].y] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: k * 1.3, ease: "linear" }}
              />
              <motion.circle
                r={4}
                fill="#FFE2A8"
                initial={{ cx: pos[a].x, cy: pos[a].y }}
                animate={{ cx: [pos[a].x, cx, pos[b].x], cy: [pos[a].y, cy, pos[b].y] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: k * 1.3, ease: "linear" }}
              />
            </Fragment>
          ))}
        <motion.rect
          x={cx - 32}
          y={cy - 14}
          width="64"
          height="30"
          rx="5"
          fill="#FFB547"
          stroke="#FFD08A"
          animate={reduce ? undefined : { strokeOpacity: [0.2, 0.9, 0.2], strokeWidth: [1, 4, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0B2447">
          Switch
        </text>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.rect
            key={i}
            x={cx - 28 + i * 7.5}
            y={cy + 7}
            width="5"
            height="3"
            rx="1"
            animate={{ fill: i < n ? "#0B2447" : "rgba(11,36,71,.3)" }}
          />
        ))}
      </svg>
      <div className="flex gap-2">
        <button type="button" className={solid} disabled={n >= 8} onClick={() => setN((v) => Math.min(8, v + 1))}>
          Plug in a device
        </button>
        <button type="button" className={chip} disabled={n <= 2} onClick={() => setN((v) => Math.max(2, v - 1))}>
          Unplug one
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – zeros and ones wrapped into a frame                             */
/* ------------------------------------------------------------------ */

function WrapVisual() {
  const [wrapped, setWrapped] = useState(false);
  const reduce = useReducedMotion();
  const bits = "0100110101101001".split("");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative">
        <AnimatePresence>
          {wrapped && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0, y: 10, scale: 0.4, rotate: -20 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
              className="absolute -right-2 -top-7 z-10 text-2xl"
            >
              📦
            </motion.span>
          )}
        </AnimatePresence>
        <motion.div
          layout
          className="relative flex flex-wrap items-center justify-center gap-1 overflow-hidden rounded-xl border-2 px-3 py-3"
          animate={{
            borderColor: wrapped ? "#FFB547" : "rgba(127,181,255,0)",
            backgroundColor: wrapped ? "rgba(255,181,71,0.08)" : "rgba(0,0,0,0)",
            boxShadow: wrapped ? "0 0 24px rgba(255,181,71,.3)" : "0 0 0 rgba(0,0,0,0)",
          }}
        >
          {/* wrapping-paper sweep */}
          {!reduce && (
            <motion.span
              key={`sweep-${wrapped}`}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#FFB547]/40 to-transparent"
              initial={{ left: "-40%" }}
              animate={{ left: "140%" }}
              transition={{ duration: 0.9 }}
            />
          )}
          {/* marching border */}
          {wrapped && !reduce && (
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <motion.rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx="10"
                fill="none"
                stroke="#FFB547"
                strokeWidth="2"
                strokeDasharray="6 6"
                animate={{ strokeDashoffset: [0, -24] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          )}
          <AnimatePresence>
            {wrapped && (
              <motion.span
                key="dst"
                initial={{ opacity: 0, x: -30, scale: 0.7 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="rounded bg-[#FFB547] px-2 py-1 font-mono text-xs font-bold text-[#0B2447]"
              >
                Destination MAC
              </motion.span>
            )}
            {wrapped && (
              <motion.span
                key="src"
                initial={{ opacity: 0, x: -30, scale: 0.7 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.12 }}
                className="rounded bg-[#5FD4C4] px-2 py-1 font-mono text-xs font-bold text-[#0B2447]"
              >
                Source MAC
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span layout className="font-mono text-lg tracking-widest text-[#EAF1FB]">
            {bits.map((b, i) => (
              <motion.span
                key={i}
                className="inline-block"
                animate={
                  reduce
                    ? undefined
                    : wrapped
                      ? { opacity: 1, color: "#EAF1FB" }
                      : { opacity: [0.5, 1, 0.5], y: [0, -2, 0], color: b === "1" ? "#FFB547" : "#7FB5FF" }
                }
                transition={{ duration: 1.6, repeat: wrapped ? 0 : Infinity, delay: i * 0.07 }}
              >
                {b}
              </motion.span>
            ))}
          </motion.span>
        </motion.div>
      </div>
      <p className="text-sm text-[#7FB5FF]">{wrapped ? "A frame" : "Raw zeros and ones"}</p>
      <button type="button" className={solid} onClick={() => setWrapped((w) => !w)}>
        {wrapped ? "Unwrap" : "Wrap them in a frame"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – frame anatomy                                                   */
/* ------------------------------------------------------------------ */

function FrameAnatomyVisual() {
  const parts = [
    { id: "dst", label: "Destination MAC", value: "0B:BB:...", color: "#FFB547", note: "The most important thing: where the frame is going." },
    { id: "src", label: "Source MAC", value: "0A:AA:...", color: "#5FD4C4", note: "The most important thing: where the frame came from." },
    { id: "rest", label: "A lot of other things", value: "0110 1001 ...", color: "#7FB5FF", note: "A frame has a lot of things." },
  ];
  const [sel, setSel] = useState("dst");
  const reduce = useReducedMotion();
  const cur = parts.find((p) => p.id === sel)!;
  const widths: Record<string, string> = { dst: "w-7", src: "w-7", rest: "w-14" };
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      {/* the frame in flight between two computers */}
      <div className="flex w-full items-center gap-2">
        <motion.div
          animate={{ scale: sel === "src" ? 1.25 : 1, opacity: sel === "dst" ? 0.5 : 1 }}
          className="flex flex-col items-center"
        >
          <span
            className="rounded-full px-1 text-2xl"
            style={{ boxShadow: sel === "src" ? "0 0 18px 4px rgba(95,212,196,.7)" : "none" }}
          >
            {DEV[0].icon}
          </span>
          <span className="font-mono text-[9px] text-[#5FD4C4]">{DEV[0].mac}</span>
        </motion.div>
        <div className="relative h-8 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-[#7FB5FF]/40" />
          <motion.div
            className="absolute top-1/2 flex gap-0.5"
            style={{ y: "-50%" }}
            initial={{ left: "0%" }}
            animate={reduce ? { left: "30%" } : { left: ["0%", "62%"] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
          >
            {parts.map((p) => (
              <motion.span
                key={p.id}
                aria-hidden
                className={`block h-5 rounded-[3px] ${widths[p.id]}`}
                style={{ backgroundColor: p.color }}
                animate={{
                  opacity: sel === p.id ? 1 : 0.35,
                  scaleY: sel === p.id ? 1.3 : 1,
                  boxShadow: sel === p.id ? `0 0 14px ${p.color}` : "0 0 0 transparent",
                }}
              />
            ))}
          </motion.div>
        </div>
        <motion.div
          animate={{ scale: sel === "dst" ? 1.25 : 1, opacity: sel === "src" ? 0.5 : 1 }}
          className="flex flex-col items-center"
        >
          <span
            className="rounded-full px-1 text-2xl"
            style={{ boxShadow: sel === "dst" ? "0 0 18px 4px rgba(255,181,71,.7)" : "none" }}
          >
            {DEV[1].icon}
          </span>
          <span className="font-mono text-[9px] text-[#FFB547]">{DEV[1].mac}</span>
        </motion.div>
      </div>

      <div className="grid w-full grid-cols-3 gap-2">
        {parts.map((p) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setSel(p.id)}
            aria-pressed={sel === p.id}
            animate={{
              y: sel === p.id ? -6 : 0,
              opacity: sel === p.id ? 1 : 0.6,
              boxShadow: sel === p.id ? `0 8px 22px ${p.color}66` : "0 0 0 transparent",
            }}
            whileHover={{ opacity: 1 }}
            className={`rounded-lg px-2 py-4 text-center text-[#0B2447] ${ring}`}
            style={{ backgroundColor: p.color }}
          >
            <div className="text-xs font-bold sm:text-sm">{p.label}</div>
            <div className="mt-1 font-mono text-[10px] sm:text-xs">{p.value}</div>
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={cur.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="h-10 text-center text-sm text-[#EAF1FB]"
        >
          {cur.note}
        </motion.p>
      </AnimatePresence>
      <p className="text-xs text-[#7FB5FF]/80">Tap each part of the frame</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4, 5, 6 – unicast / broadcast / multicast                           */
/* ------------------------------------------------------------------ */

type Mode = "unicast" | "broadcast" | "multicast";

const MODE_INFO: Record<Mode, { title: string; analogy: string; icon: string }> = {
  unicast: { title: "Unicast: one to one", analogy: "A private text", icon: "💬" },
  broadcast: { title: "Broadcast: one to everyone", analogy: "Shouting a message", icon: "📢" },
  multicast: { title: "Multicast: one to many", analogy: "A group chat", icon: "👥" },
};

function TrafficVisual({ mode }: { mode: Mode }) {
  const receivers = [1, 2, 3, 4, 5];
  const [pick, setPick] = useState<number[]>(mode === "unicast" ? [2] : mode === "multicast" ? [1, 3] : receivers);
  const [firing, setFiring] = useState(0);
  const reduce = useReducedMotion();
  const toggle = (i: number) => {
    if (mode === "broadcast") return;
    if (mode === "unicast") setPick([i]);
    else setPick((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };
  const destMac =
    mode === "broadcast" ? BROADCAST : mode === "unicast" ? `00:00:00:00:00:0${pick[0] + 1}` : "A group of MACs";
  const info = MODE_INFO[mode];
  const colX = (r: number) => ((r - 0.5) / 5) * 100;
  const dstColor = mode === "broadcast" ? "#FF8A7A" : "#FFB547";
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#EAF1FB]">
          <motion.span
            key={`ico-${firing}`}
            className="mr-2 inline-block"
            aria-hidden
            animate={firing > 0 && !reduce ? { rotate: [0, -18, 18, -12, 12, 0], scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.6 }}
          >
            {info.icon}
          </motion.span>
          {info.title}
        </p>
        <p className="text-xs text-[#7FB5FF]">{info.analogy}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-lg bg-[#0B2447] px-2 py-2 font-mono text-[11px] text-[#EAF1FB] ring-1 ring-[#7FB5FF]/30 sm:text-xs">
        <span className="text-[#7FB5FF]">Destination MAC</span>
        <motion.span
          key={destMac}
          className="font-bold text-[#FFB547]"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {destMac}
        </motion.span>
      </div>

      {/* sender → switch */}
      <div className="relative grid grid-cols-5 items-center">
        <div className="flex flex-col items-center">
          <span className="text-3xl">📱</span>
          <span className="text-[11px] text-[#EAF1FB]">Sender</span>
        </div>
        <div className="col-span-3 px-2">
          <SwitchBar glow={firing > 0} lit={pick.map((r) => r - 1)} />
        </div>
        {/* wire from the sender to the switch */}
        <div aria-hidden className="absolute left-[10%] top-[40%] h-px w-[40%] bg-[#7FB5FF]/40" />
        {firing > 0 && !reduce && (
          <motion.span
            key={`c0-${firing}`}
            className="absolute top-[40%] -mt-2"
            style={{ marginLeft: -14 }}
            initial={{ left: "10%", opacity: 0 }}
            animate={{ left: "50%", opacity: 1 }}
            transition={{ left: { duration: 0.6, ease: "easeIn" }, opacity: { duration: 0.15 } }}
          >
            <FrameChip dst={dstColor} />
          </motion.span>
        )}
        {mode === "broadcast" &&
          firing > 0 &&
          !reduce &&
          [0, 1, 2].map((k) => (
            <motion.span
              key={`ring-${firing}-${k}`}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 rounded-full border-2 border-[#FF8A7A]"
              style={{ x: "-50%", y: "-50%" }}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 3.5, opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.2, delay: 0.55 + k * 0.25 }}
            />
          ))}
      </div>

      {/* switch → receivers */}
      <div className="relative h-7">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden>
          {receivers.map((r) => {
            const on = pick.includes(r);
            return (
              <path
                key={r}
                d={`M50 0 L50 8 L${colX(r)} 8 L${colX(r)} 28`}
                fill="none"
                stroke={on ? "#FFB547" : "#7FB5FF"}
                strokeOpacity={on ? 0.9 : 0.2}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {firing > 0 &&
          !reduce &&
          pick.map((r) => (
            <motion.span
              key={`c-${firing}-${r}`}
              className="absolute"
              style={{ marginLeft: -14 }}
              initial={{ left: "50%", top: "-20%", opacity: 0 }}
              animate={{ left: ["50%", `${colX(r)}%`, `${colX(r)}%`], top: ["-20%", "20%", "100%"], opacity: [1, 1, 0.9] }}
              transition={{ delay: 0.6, duration: 0.8, times: [0, 0.4, 1], ease: "linear" }}
            >
              <FrameChip dst={dstColor} />
            </motion.span>
          ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {receivers.map((r) => {
          const on = pick.includes(r);
          return (
            <motion.button
              key={`${r}-${firing}`}
              type="button"
              onClick={() => toggle(r)}
              aria-pressed={on}
              animate={
                firing > 0 && on && !reduce
                  ? { scale: [1, 1.2, 1], borderColor: ["#7FB5FF", "#FFB547", "#FFB547"] }
                  : { borderColor: on ? "#FFB547" : "rgba(127,181,255,0.3)" }
              }
              transition={{ delay: firing > 0 ? 1.3 + r * 0.04 : 0, duration: 0.5 }}
              className={`relative flex flex-col items-center gap-0.5 rounded-lg border-2 bg-[#0B2447]/60 py-2 ${ring}`}
            >
              {mode === "multicast" && on && (
                <motion.span
                  aria-hidden
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-2 text-xs"
                >
                  👥
                </motion.span>
              )}
              <span className="text-2xl" style={{ opacity: on ? 1 : 0.45 }}>💻</span>
              <span className={`text-[10px] ${on ? "text-[#FFB547]" : "text-[#7FB5FF]"}`}>{on ? "Receives" : "Ignores"}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button type="button" className={solid} disabled={pick.length === 0} onClick={() => setFiring((f) => f + 1)}>
          Send the frame
        </button>
        {mode !== "broadcast" && (
          <span className="text-xs text-[#7FB5FF]">{mode === "unicast" ? "Tap a computer to choose" : "Tap to add or remove members"}</span>
        )}
      </div>
    </div>
  );
}

const UnicastVisual = () => <TrafficVisual mode="unicast" />;
const BroadcastVisual = () => <TrafficVisual mode="broadcast" />;
const MulticastVisual = () => <TrafficVisual mode="multicast" />;

/* ------------------------------------------------------------------ */
/* 7 – MAC address table                                               */
/* ------------------------------------------------------------------ */

function MacTableVisual() {
  const [hot, setHot] = useState<number | null>(null);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <SwitchBar lit={hot === null ? [] : [hot * 2]} glow={hot !== null} />
        <div className="grid grid-cols-4 gap-2">
          {DEV.map((d, i) => (
            <div key={d.name} className="flex flex-col items-center">
              {/* cable from the port up to the switch */}
              <div className="relative h-4 w-0.5 overflow-hidden rounded">
                <motion.div
                  className="h-full w-full"
                  animate={{ backgroundColor: hot === i ? "#FFB547" : "rgba(127,181,255,.4)" }}
                />
                {hot === i && !reduce && (
                  <motion.span
                    className="absolute left-0 h-1.5 w-full bg-white"
                    initial={{ top: "100%" }}
                    animate={{ top: "-30%" }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>
              <motion.button
                type="button"
                onMouseEnter={() => setHot(i)}
                onMouseLeave={() => setHot(null)}
                onFocus={() => setHot(i)}
                onBlur={() => setHot(null)}
                onClick={() => setHot(hot === i ? null : i)}
                animate={{ scale: hot === i ? 1.08 : 1 }}
                className={`flex w-full flex-col items-center whitespace-nowrap rounded-lg border-2 py-2 ${ring} ${hot === i ? "border-[#FFB547] bg-[#FFB547]/10" : "border-[#7FB5FF]/30"}`}
              >
                <span className="text-[10px] text-[#7FB5FF]">Port {i + 1}</span>
                <span className="text-2xl">{d.icon}</span>
                <span className="font-mono text-[10px] text-[#EAF1FB]">{d.mac}</span>
              </motion.button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-[#7FB5FF] sm:mt-3">Tap a device, or a row of the table</p>
      </div>
      <div className="w-full shrink-0 overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40 sm:w-40">
        <div className="bg-[#7FB5FF] px-2 py-1 text-center text-xs font-bold text-[#0B2447]">MAC address table</div>
        <table className="w-full whitespace-nowrap text-xs text-[#EAF1FB]">
          <thead>
            <tr className="bg-[#0B2447] text-[#7FB5FF]">
              <th className="px-2 py-1 text-left font-normal">MAC</th>
              <th className="px-2 py-1 text-left font-normal">Port</th>
            </tr>
          </thead>
          <tbody>
            {DEV.map((d, i) => (
              <motion.tr
                key={d.name}
                initial={reduce ? false : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.12 }}
                onClick={() => setHot(hot === i ? null : i)}
                className={`cursor-pointer border-l-4 font-mono transition-colors ${
                  hot === i ? "border-white bg-[#FFB547] text-[#0B2447]" : "border-transparent"
                }`}
              >
                <td className="px-2 py-1 sm:py-1.5">{d.mac}</td>
                <td className="px-2 py-1 sm:py-1.5">{i + 1}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8, 9, 10 – the switch learning, forwarding and flooding             */
/* ------------------------------------------------------------------ */

type Flash = "flood" | "hit" | "src";
type Flight = { s: number; d: number; kind: "known" | "flood" };

function SwitchSim({ hint }: { hint: string }) {
  const [src, setSrc] = useState(0);
  const [dst, setDst] = useState(1);
  const [table, setTable] = useState<Record<number, number>>({});
  const [flash, setFlash] = useState<Record<number, Flash>>({});
  const [log, setLog] = useState(hint);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [run, setRun] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const later = useTimers();
  const reduce = useReducedMotion();

  const send = () => {
    if (src === dst || busy) return;
    setBusy(true);
    setRun((r) => r + 1);
    const t = { ...table, [src]: src + 1 };
    setTable(t);
    setPhase(1);
    if (dst in t) {
      setFlight({ s: src, d: dst, kind: "known" });
      setFlash({ [src]: "src", [dst]: "hit" });
      setLog(`Noted ${DEV[src].mac} on port ${src + 1}. ${DEV[dst].mac} is in the table, so forward out port ${dst + 1} only.`);
      later(() => setPhase(2), 600);
      later(() => {
        setFlash({});
        setBusy(false);
        setPhase(0);
      }, 1600);
    } else {
      setFlight({ s: src, d: dst, kind: "flood" });
      const f: Record<number, Flash> = {};
      DEV.forEach((_, i) => (f[i] = i === src ? "src" : "flood"));
      setFlash(f);
      setLog(`Noted ${DEV[src].mac} on port ${src + 1}. ${DEV[dst].mac} is unknown: unknown unicast, flood out every port except port ${src + 1}.`);
      later(() => setPhase(2), 600);
      later(() => {
        setPhase(3);
        setTable((p) => ({ ...p, [dst]: dst + 1 }));
        setFlash({ [dst]: "src", [src]: "hit" });
        setLog(`${DEV[dst].name} sent the reply back. Now the switch knows ${DEV[dst].mac} is on port ${dst + 1}.`);
      }, 1500);
      later(() => setPhase(4), 2100);
      later(() => {
        setFlash({});
        setBusy(false);
        setPhase(0);
      }, 3000);
    }
  };

  const reset = () => {
    setTable({});
    setFlash({});
    setLog(hint);
    setPhase(0);
  };

  const rows = Object.entries(table)
    .map(([d, p]) => ({ d: Number(d), p }))
    .sort((a, b) => a.p - b.p);

  const X = (i: number) => ((i + 0.5) / 4) * 100;
  const showAt = (i: number) => {
    if (!flight || phase === 0) return false;
    if (phase === 1) return i === flight.s;
    if (phase === 2) return flight.kind === "known" ? i === flight.d : i !== flight.s;
    if (phase === 3) return i === flight.d;
    return i === flight.s;
  };

  const seg = (value: number, set: (n: number) => void, label: string) => (
    <div className="flex items-center gap-1.5">
      <span className="w-9 text-xs text-[#7FB5FF]">{label}</span>
      {DEV.map((d, i) => (
        <button
          key={d.name}
          type="button"
          onClick={() => set(i)}
          aria-pressed={value === i}
          className={`h-7 w-7 rounded-md text-xs font-bold ${ring} ${value === i ? "bg-[#FFB547] text-[#0B2447]" : "bg-[#0B2447] text-[#EAF1FB] ring-1 ring-[#7FB5FF]/40"}`}
        >
          {d.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="grid grid-cols-4 gap-1.5">
          {DEV.map((d, i) => {
            const f = flash[i];
            const border = f === "flood" ? "#FFB547" : f === "hit" ? "#5FD4C4" : f === "src" ? "#FFFFFF" : "rgba(127,181,255,0.3)";
            return (
              <motion.div
                key={d.name}
                animate={{
                  borderColor: border,
                  scale: f ? 1.06 : 1,
                  boxShadow: f ? `0 0 16px ${border}88` : "0 0 0 transparent",
                }}
                className="relative flex flex-col items-center whitespace-nowrap rounded-lg border-2 bg-[#0B2447]/60 py-1.5"
              >
                <motion.span
                  aria-hidden
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                  animate={{ backgroundColor: f === "flood" ? "#FFB547" : f === "hit" ? "#5FD4C4" : f === "src" ? "#FFFFFF" : "#3B5B88" }}
                />
                <span className="text-xl">{d.icon}</span>
                <span className="font-mono text-[10px] text-[#EAF1FB]">{d.mac}</span>
                <span className="text-[10px] text-[#7FB5FF]">Port {i + 1}</span>
              </motion.div>
            );
          })}
        </div>

        {/* cables + frames in flight */}
        <div className="relative h-7" aria-hidden>
          {DEV.map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded"
              style={{ left: `${X(i)}%` }}
              animate={{ backgroundColor: showAt(i) ? "#FFB547" : "rgba(127,181,255,.35)" }}
            />
          ))}
          {!reduce &&
            DEV.map((_, i) => {
              if (!showAt(i) || !flight) return null;
              const up = phase === 2 || phase === 4;
              const color = phase === 2 && flight.kind === "flood" ? "#FFB547" : phase >= 3 ? "#7FB5FF" : "#5FD4C4";
              return (
                <motion.span
                  key={`${run}-${phase}-${i}`}
                  className="absolute"
                  style={{ left: `${X(i)}%`, marginLeft: -14 }}
                  initial={{ top: up ? "100%" : "-15%", opacity: 0 }}
                  animate={{ top: up ? "-15%" : "100%", opacity: [0, 1, 1, 0] }}
                  transition={{ top: { duration: 0.55, ease: "easeInOut" }, opacity: { duration: 0.55, times: [0, 0.2, 0.8, 1] } }}
                >
                  <FrameChip dst={color} />
                </motion.span>
              );
            })}
        </div>
        <SwitchBar
          glow={phase === 2 && flight?.kind === "flood"}
          lit={Object.keys(table).map((k) => Number(k) * 2)}
        />
        <div className="space-y-1.5">
          {seg(src, setSrc, "From")}
          {seg(dst, setDst, "To")}
        </div>
        <div className="flex gap-2">
          <button type="button" className={solid} onClick={send} disabled={src === dst || busy}>
            Send frame
          </button>
          <button type="button" className={chip} onClick={reset}>
            Clear table
          </button>
        </div>
        <p className="min-h-[3.2rem] text-xs leading-snug text-[#EAF1FB]" aria-live="polite">
          {log}
        </p>
      </div>
      <div className="w-full shrink-0 overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40 sm:w-36 sm:self-start">
        <div className="bg-[#7FB5FF] px-2 py-1 text-center text-[11px] font-bold text-[#0B2447]">MAC address table</div>
        <div className="min-h-[7rem] text-xs text-[#EAF1FB]">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div
                key={r.d}
                initial={{ opacity: 0, backgroundColor: "#FFB547", x: 16 }}
                animate={{ opacity: 1, backgroundColor: "rgba(255,181,71,0)", x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.9 }}
                className="flex justify-between px-2 py-1.5 font-mono"
              >
                <span>{DEV[r.d].mac}</span>
                <span>Port {r.p}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {rows.length === 0 && (
            <motion.p
              className="px-2 py-3 text-center text-[#7FB5FF]"
              animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Empty
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}

const LearnVisual = () => <SwitchSim hint="The table starts empty. Send a frame and watch what the switch takes note of." />;
const ForwardFloodVisual = () => <SwitchSim hint="Send to a device the switch hasn't seen yet, then send to one it knows." />;
const ReplyVisual = () => <SwitchSim hint="Send A to B, then send A to B again. The second time there is no flooding." />;

/* ------------------------------------------------------------------ */
/* 11 – access point                                                   */
/* ------------------------------------------------------------------ */

function AccessPointVisual() {
  const [crossed, setCrossed] = useState(false);
  const reduce = useReducedMotion();
  const CYCLE = 3;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1 text-2xl">
            <motion.span animate={reduce ? undefined : { y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>📱</motion.span>
            <motion.span animate={reduce ? undefined : { y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.4 }}>💻</motion.span>
          </div>
          <span className="text-[11px] text-[#EAF1FB]">Phones and laptops</span>
        </div>

        {/* radio link */}
        <div className="relative mx-1 h-12 flex-1 overflow-hidden">
          {!reduce &&
            [0, 1, 2].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute left-0 top-1/2 h-8 w-8 rounded-full border-2 border-[#7FB5FF]"
                style={{ y: "-50%" }}
                animate={{ scale: [0.4, 3.2], opacity: [0.7, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
              />
            ))}
          {!reduce && (
            <motion.span
              aria-hidden
              className="absolute top-1/2 -ml-3"
              style={{ y: "-50%" }}
              animate={{ left: ["0%", "100%", "100%"], opacity: [1, 1, 0] }}
              transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.4, 1], ease: "linear" }}
            >
              <FrameChip dst="#7FB5FF" src="#7FB5FF" />
            </motion.span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <motion.span
            className="text-3xl"
            animate={reduce ? undefined : { scale: [1, 1, 1.3, 1, 1], filter: ["brightness(1)", "brightness(1)", "brightness(1.8)", "brightness(1)", "brightness(1)"] }}
            transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.38, 0.45, 0.55, 1] }}
          >
            📡
          </motion.span>
          <span className="text-[11px] text-[#EAF1FB]">Access point</span>
        </div>

        {/* ethernet link */}
        <div className="relative mx-2 h-1.5 w-14 rounded bg-[#5FD4C4]" aria-label="Ethernet cable">
          {!reduce && (
            <motion.span
              aria-hidden
              className="absolute -top-2 -ml-3"
              animate={{ left: ["0%", "0%", "100%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.42, 0.7, 1], ease: "linear" }}
            >
              <FrameChip dst="#5FD4C4" src="#5FD4C4" />
            </motion.span>
          )}
        </div>
        <div className="w-20">
          <SwitchBar lit={[4]} />
        </div>
      </div>
      <p className="text-sm text-[#7FB5FF]">A wireless bridge, plugged into the switch.</p>

      <div className="flex items-center gap-3">
        <motion.span
          aria-hidden
          className="relative text-2xl"
          animate={crossed && !reduce ? { rotate: [0, -12, 12, -6, 0], opacity: 0.45 } : { opacity: crossed ? 0.45 : 0.9 }}
        >
          🔀
          <motion.span
            className="absolute left-1/2 top-1/2 h-[3px] w-9 origin-center -translate-x-1/2 rounded bg-[#FF8A7A]"
            style={{ rotate: -40 }}
            animate={{ scaleX: crossed ? 1 : 0 }}
          />
        </motion.span>
        <button type="button" onClick={() => setCrossed((c) => !c)} className={chip} aria-pressed={crossed}>
          <span className="relative inline-block">
            Is it a router?
            <motion.span
              className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-[#FFB547]"
              animate={{ scaleX: crossed ? 1 : 0 }}
            />
          </span>
          <AnimatePresence>
            {crossed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="ml-2 inline-block overflow-hidden whitespace-nowrap font-semibold text-[#FFB547]">
                It's not.
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12 – phone frame → AP → switch                                      */
/* ------------------------------------------------------------------ */

function ApTranslateVisual() {
  const [stage, setStage] = useState(-1);
  const later = useTimers();
  const reduce = useReducedMotion();
  const labels = ["Radio waves to the access point", "The AP puts it on the Ethernet cable", "The switch sees a MAC address on a port"];
  const run = () => {
    setStage(0);
    later(() => setStage(1), 1400);
    later(() => setStage(2), 2800);
  };
  const left = ["10%", "46%", "84%"];
  const dot = ["4%", "50%", "96%"];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="relative flex items-center justify-between px-1">
        <div className="relative flex flex-col items-center">
          {stage === 0 &&
            !reduce &&
            [0, 1, 2].map((k) => (
              <motion.span
                key={`w-${k}`}
                aria-hidden
                className="absolute left-1/2 top-4 h-10 w-10 rounded-full border-2 border-[#7FB5FF]"
                style={{ x: "-50%", y: "-50%" }}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.3, delay: k * 0.35 }}
              />
            ))}
          <span className="relative text-3xl">📱</span>
          <span className="text-[11px] text-[#EAF1FB]">Your phone</span>
        </div>
        <div className="flex flex-col items-center">
          <motion.span
            className="text-3xl"
            animate={stage === 1 && !reduce ? { scale: [1, 1.35, 1], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
            transition={{ duration: 0.8 }}
          >
            📡
          </motion.span>
          <span className="text-[11px] text-[#EAF1FB]">AP</span>
        </div>
        <div className="flex w-20 flex-col items-center gap-1">
          <SwitchBar glow={stage === 2} lit={stage >= 2 ? [4] : []} />
          <span className="text-[11px] text-[#EAF1FB]">Port 5</span>
        </div>
        {stage >= 0 && (
          <motion.span
            className="absolute -top-5 text-xl"
            initial={{ left: left[0] }}
            animate={{
              left: left[Math.min(stage, 2)],
              textShadow: stage === 0 ? "0 0 14px #7FB5FF" : "0 0 14px #5FD4C4",
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            ✉️
          </motion.span>
        )}
      </div>
      <div className="relative flex">
        <div className="h-1.5 flex-1 rounded-l bg-[repeating-linear-gradient(90deg,#7FB5FF_0_6px,transparent_6px_12px)]" />
        <div className="h-1.5 flex-1 rounded-r bg-[#5FD4C4]" />
        {stage >= 0 && (
          <motion.span
            aria-hidden
            className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full"
            initial={{ left: dot[0] }}
            animate={{
              left: dot[Math.min(stage, 2)],
              backgroundColor: stage === 0 ? "#7FB5FF" : "#5FD4C4",
              boxShadow: stage === 0 ? "0 0 12px 3px rgba(127,181,255,.8)" : "0 0 12px 3px rgba(95,212,196,.8)",
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        )}
      </div>
      <p className="h-5 text-center text-sm text-[#EAF1FB]" aria-live="polite">
        {stage >= 0 ? labels[stage] : "Send a frame from the phone."}
      </p>
      <div className="mx-auto w-48 overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40">
        <div className="bg-[#7FB5FF] px-2 py-1 text-center text-[11px] font-bold text-[#0B2447]">MAC address table</div>
        <div className="h-8 text-xs">
          <AnimatePresence>
            {stage >= 2 && (
              <motion.div
                initial={{ opacity: 0, backgroundColor: "#FFB547", x: 20 }}
                animate={{ opacity: 1, backgroundColor: "rgba(255,181,71,0)", x: 0 }}
                transition={{ duration: 1 }}
                className="flex justify-between px-2 py-2 font-mono text-[#EAF1FB]"
              >
                <span>3C:22:FB:8A:01:5D</span>
                <span>Port 5</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <button type="button" className={`${solid} mx-auto`} onClick={run}>
        Send from the phone
      </button>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  SwitchIntroVisual,
  WrapVisual,
  FrameAnatomyVisual,
  UnicastVisual,
  BroadcastVisual,
  MulticastVisual,
  MacTableVisual,
  LearnVisual,
  ForwardFloodVisual,
  ReplyVisual,
  AccessPointVisual,
  ApTranslateVisual,
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

// Stage height on phones, per beat (from sm up it is always 22rem). The MAC-table beat and the
// three switch simulations stack their table under the devices on narrow screens, so they get more room.
const STAGE_H = [
  "h-80", "h-80", "h-80", "h-80", "h-80", "h-80",
  "h-[23rem]", "h-[28rem]", "h-[28rem]", "h-[28rem]",
  "h-80", "h-80",
];

export default function Section03DataLinkLayer({ onComplete }: Props) {
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
      aria-label="Section 3: Layer 2, the data link layer"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Layer 2: The data link layer</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
          {/* mini layer stack: Layer 2 is lit, Layer 1 stays softly on */}
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

        <div className={`relative overflow-hidden rounded-xl border border-[#7FB5FF]/30 bg-[#0B2447]/70 p-4 transition-[height] duration-300 sm:h-[22rem] ${STAGE_H[step]}`}>
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

        <p key={step} className="min-h-[11rem] font-serif text-lg leading-relaxed sm:text-xl">
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
              On to VLANs
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
