"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 6 – Layer 3: IP addresses, subnet masks, ARP and the life of a packet
 * Transcript range: 08:44 – 13:12 (sponsor segment skipped)
 *
 * Dependencies: react, framer-motion, tailwindcss
 * Usage:  <Section06NetworkLayerIpArp onComplete={() => goToSection(7)} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Transcript                                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "The only type of address we've seen so far is a MAC address. And if the whole internet ran on MAC addresses, switches would have to flood traffic to billions of devices just to find one MAC address, just to find one computer. That would suck.",
  "To actually send data across the world, we need another type of address to tell us where that network is and another type of device that can read those addresses because remember switches can only read MAC addresses. Layer two. So this brings us to layer three, the network layer.",
  "This new address is probably something that isn't new to a lot of you. It's an IP address unlike a permanent MAC address that's unique to the device itself and cannot be changed. I mean, technically it can be changed, but you get the point. An IP address changes constantly whenever you move it to different networks.",
  "You've also probably seen this thing or this thing alongside an IP address and that's called the subnet mask. Subnet masks tell the computer which part of the IP address is a network portion and which part is the host portion. You can think of the network portion like your street name and then the host portion like your house number.",
  "This way your computer knows if traffic is destined for its own network or if it's traffic destined for another network. And this is actually much more important than you might initially think.",
  "If the destination is on your network is on the same network, this is what will happen. Let's say PC1 192.168.1.100 wants to send a message to PC2 192.168.1.101. But PC1 knows the switch only reads MAC addresses. If it just throws an IP address at the switch, the switch is going to look at that and be like, \"Yo, what what am I looking at?\"",
  "So before sending actual traffic, PC1 uses something called ARP, address resolution protocol. So PC1 sends ARP request that basically says, \"Who is 192.168.1.101? Send me your MAC address now.\" And this is quite literally what it says. Look at this.",
  "And PC2 is going to be like, \"Oh, shoot. I'm 192.168.1.101. Let me send my MAC address.\" So PC1 is going to receive that MAC address and add it to its internal ARP table. And an ARP table is just a table of IP address to MAC address mappings so that the PC doesn't have to send an ARP request every single time. So now when PC1 wants to send a message to PC2 again, it'll just refer to that ARP table and it'll be able to send traffic to the switch. No problem.",
  "Okay, I just threw everything at you there. Let's just quickly look at this from the top. So we can see the life of a packet. So first PC1 will create a packet which is just the data you want to send wrapped up with a source IP and a destination IP.",
  "Then PC1 looks at the destination IP and sees that they're on the same network. Then it'll check its ARP table to see if it has a MAC entry for this specific IP address. If it isn't there, PC1 will send an ARP request to the network asking for the MAC address of this IP address.",
  "Then after this, PC1 takes the packet and wraps it inside a layer 2 frame, adding its own source MAC address and destination MAC address. Then PC1 will turn that frame into a bunch of zeros and ones and send it down that Ethernet cable as electrical signals to the switch.",
  "Then the switch will receive that frame. It'll read the destination MAC address and look at its own MAC address table. If it finds a match, it'll forward it out of that corresponding port. If it doesn't, it'll send an unknown unicast message which floods the frame out of all the ports except for the one it was received on. So that way it'll find the MAC address of that PC of PC2.",
];

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]";
const chip = `rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 disabled:opacity-40 ${ring}`;
const solid = `rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] disabled:opacity-40 ${ring}`;

const PC1_IP = "192.168.1.100";
const PC2_IP = "192.168.1.101";
const PC1_MAC = "3C:22:FB:8A:01:5D";
const PC2_MAC = "00:1A:2B:3C:4D:5E";

function useTimers() {
  const t = useRef<number[]>([]);
  useEffect(() => () => t.current.forEach((x) => window.clearTimeout(x)), []);
  return {
    later: (fn: () => void, ms: number) => {
      t.current.push(window.setTimeout(fn, ms));
    },
    clear: () => {
      t.current.forEach((x) => window.clearTimeout(x));
      t.current = [];
    },
  };
}

/** The switch: a bar with a row of port LEDs. */
function SwitchBar({
  label = "Switch",
  className = "",
  glow = false,
  confused = false,
  lit = [],
}: {
  label?: string;
  className?: string;
  glow?: boolean;
  confused?: boolean;
  lit?: number[];
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={{
        backgroundColor: confused ? "#FF8A7A" : glow ? "#FFD08A" : "#7FB5FF",
        boxShadow: confused
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
                opacity: confused && !reduce ? [1, 0.2, 1] : !reduce && i % 3 === 0 && !on ? [1, 0.4, 1] : 1,
              }}
              transition={{ duration: confused ? 0.4 : 1.4, repeat: Infinity, delay: i * 0.12 }}
            />
          );
        })}
      </span>
    </motion.div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="min-h-[2.5rem] text-center text-[13px] leading-snug text-[#EAF1FB] sm:text-sm" aria-live="polite">
      {children}
    </p>
  );
}

function Pc({ name, sub, glow }: { name: string; sub?: string; glow?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={{ scale: glow ? 1.1 : 1, backgroundColor: glow ? "rgba(255,181,71,0.18)" : "rgba(0,0,0,0)" }}
      className="relative flex w-24 flex-col items-center rounded-lg px-1 py-1.5 text-center"
    >
      {glow && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-5 h-10 w-10 rounded-full border-2 border-[#FFB547]"
          style={{ x: "-50%", y: "-50%" }}
          animate={{ scale: [0.6, 2.2], opacity: [0.7, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <motion.span
        className="text-3xl"
        animate={reduce ? undefined : { y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        💻
      </motion.span>
      <span className="text-xs font-semibold text-[#EAF1FB]">{name}</span>
      {sub && <span className="font-mono text-[10px] text-[#7FB5FF]">{sub}</span>}
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
/* 1 – flooding the whole internet                                     */
/* ------------------------------------------------------------------ */

const SCALES = [
  { label: "A local network", count: "24 devices", dots: 24 },
  { label: "A city", count: "millions of devices", dots: 72 },
  { label: "The whole internet", count: "billions of devices", dots: 144 },
];

function FloodScaleVisual() {
  const [scale, setScale] = useState(0);
  const [run, setRun] = useState(0);
  const [reached, setReached] = useState(0);
  const reduce = useReducedMotion();
  const s = SCALES[scale];
  const target = s.dots - 3;
  useEffect(() => {
    if (run === 0) {
      setReached(0);
      return;
    }
    let n = 1;
    setReached(1);
    const id = window.setInterval(() => {
      n = Math.min(s.dots, n + Math.ceil(s.dots / 12));
      setReached(n);
      if (n >= s.dots) window.clearInterval(id);
    }, 80);
    return () => window.clearInterval(id);
  }, [run, scale, s.dots]);
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {SCALES.map((x, i) => (
          <button key={x.label} type="button" aria-pressed={scale === i} onClick={() => { setScale(i); setRun(0); }} className={`rounded-full px-3 py-1 text-xs ${ring} ${scale === i ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid flex-1 content-center gap-1.5" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
        {Array.from({ length: s.dots }, (_, i) => {
          const row = Math.floor(i / 24);
          const col = i % 24;
          const dist = Math.hypot(row, col);
          const isSrc = i === 0;
          return (
            <motion.span
              key={`${scale}-${run}-${i}`}
              className="aspect-square rounded-full"
              style={isSrc ? { boxShadow: "0 0 8px 2px rgba(255,255,255,.8)" } : undefined}
              initial={{ backgroundColor: isSrc ? "#FFFFFF" : i === target ? "#5FD4C4" : "#2A5A94" }}
              animate={
                run > 0 && !isSrc
                  ? { backgroundColor: i === target ? "#5FD4C4" : "#FFB547", scale: i === target ? [1, 1.8, 1.4] : [1, 1.5, 1] }
                  : isSrc && !reduce
                    ? { scale: [1, 1.5, 1] }
                    : {}
              }
              transition={isSrc ? { duration: 1.2, repeat: Infinity } : { delay: dist * 0.04, duration: 0.4 }}
            />
          );
        })}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#0B2447]" aria-hidden>
        <motion.div
          className="h-full bg-gradient-to-r from-[#FFB547] to-[#FF8A7A]"
          animate={{ width: `${(reached / s.dots) * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <Caption>
        {run > 0 ? `Flooded to ${s.count}, just to find one computer.` : "The teal dot is the one computer we want."}
      </Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={() => setRun((r) => r + 1)}>
        Find one MAC address
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – we need a new address and a new device                          */
/* ------------------------------------------------------------------ */

function NeedVisual() {
  const [a, setA] = useState(false);
  const [d, setD] = useState(false);
  const reduce = useReducedMotion();
  const both = a && d;
  const card = (on: boolean, set: (b: boolean) => void, icon: string, title: string, body: string) => (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={() => set(!on)}
      whileTap={{ scale: 0.96 }}
      animate={{
        borderColor: on ? "#FFB547" : "rgba(127,181,255,0.4)",
        backgroundColor: on ? "rgba(255,181,71,0.12)" : "rgba(11,36,71,0.6)",
        boxShadow: on ? "0 0 18px rgba(255,181,71,.35)" : "0 0 0 transparent",
      }}
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${ring}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={String(on)}
          className="text-3xl"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
        >
          {on ? "✅" : icon}
        </motion.span>
      </AnimatePresence>
      <span className="text-sm font-semibold text-[#EAF1FB]">{title}</span>
      <span className="text-xs text-[#7FB5FF]">{body}</span>
    </motion.button>
  );
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex gap-3">
        {card(a, setA, "🏷️", "Another type of address", "Tells us where that network is")}
        {card(d, setD, "📟", "Another type of device", "Can read those addresses")}
      </div>
      <div className="relative space-y-1.5">
        <AnimatePresence>
          {both && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 15 }}
              className="relative overflow-hidden rounded-lg bg-[#FFB547] px-4 py-3 text-center font-semibold text-[#0B2447]"
              style={{ boxShadow: "0 0 24px rgba(255,181,71,.6)" }}
            >
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  initial={{ left: "-40%" }}
                  animate={{ left: "140%" }}
                  transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
              Layer 3: The network layer
            </motion.div>
          )}
        </AnimatePresence>
        <div className="rounded-lg bg-[#5FD4C4] px-4 py-2.5 text-center text-sm font-semibold text-[#0B2447]">Layer 2: Switches can only read MAC addresses</div>
        <div className="rounded-lg bg-[#EAF1FB] px-4 py-2 text-center text-sm font-semibold text-[#0B2447]">Layer 1: Physical</div>
      </div>
      <p className="text-center text-xs text-[#7FB5FF]">{both ? "Both pieces found." : "Tap each card to tick it off"}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – MAC stays, IP changes                                           */
/* ------------------------------------------------------------------ */

const NETS = [
  { name: "Home", ip: "192.168.1.23", icon: "🏠" },
  { name: "Cafe", ip: "10.0.0.57", icon: "☕" },
  { name: "Office", ip: "172.16.4.9", icon: "🏢" },
];

function MovingVisual() {
  const [sel, setSel] = useState(0);
  const [from, setFrom] = useState(0);
  const reduce = useReducedMotion();
  const posOf = (i: number) => `${i * 33.333 + 16.666}%`;
  const pick = (i: number) => {
    setFrom(sel);
    setSel(i);
  };
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="relative h-14">
        {/* ghost left behind, ring on arrival */}
        {!reduce && from !== sel && (
          <motion.span
            key={`ghost-${from}-${sel}`}
            aria-hidden
            className="absolute top-0 text-4xl"
            style={{ x: "-50%", left: posOf(from) }}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            💻
          </motion.span>
        )}
        {!reduce && (
          <motion.span
            key={`arrive-${sel}`}
            aria-hidden
            className="absolute top-3 h-10 w-10 rounded-full border-2 border-[#FFB547]"
            style={{ x: "-50%", left: posOf(sel) }}
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
          />
        )}
        <motion.div className="absolute top-0 text-4xl" style={{ x: "-50%" }} animate={{ left: posOf(sel) }} transition={{ type: "spring", stiffness: 120, damping: 16 }}>
          💻
        </motion.div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {NETS.map((n, i) => (
          <button key={n.name} type="button" aria-pressed={sel === i} onClick={() => pick(i)} className={`relative rounded-xl border-2 py-3 text-center transition-colors ${ring} ${sel === i ? "border-[#FFB547] bg-[#FFB547]/10" : "border-[#7FB5FF]/30"}`}>
            <AnimatePresence>
              {sel === i && (
                <motion.span
                  aria-hidden
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 right-1 text-sm"
                >
                  📶
                </motion.span>
              )}
            </AnimatePresence>
            <div className="text-2xl">{n.icon}</div>
            <div className="text-xs text-[#EAF1FB]">{n.name} network</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <motion.div
          className="rounded-lg bg-[#0B2447] p-3 ring-1 ring-[#5FD4C4]/50"
          animate={reduce ? undefined : { boxShadow: ["0 0 0 rgba(95,212,196,0)", "0 0 14px rgba(95,212,196,.4)", "0 0 0 rgba(95,212,196,0)"] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        >
          <p className="text-xs text-[#5FD4C4]">MAC address 🔒</p>
          <p className="mt-1 break-all font-mono text-xs text-[#EAF1FB]">{PC1_MAC}</p>
          <p className="mt-1 text-[11px] text-[#7FB5FF]">Unique to the device itself</p>
        </motion.div>
        <motion.div
          key={`ipbox-${sel}`}
          className="rounded-lg bg-[#0B2447] p-3 ring-1 ring-[#FFB547]/60"
          initial={reduce ? false : { backgroundColor: "rgba(255,181,71,.35)" }}
          animate={{ backgroundColor: "#0B2447" }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs text-[#FFB547]">IP address</p>
          <AnimatePresence mode="wait">
            <motion.p key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-1 font-mono text-xs text-[#EAF1FB]">
              {NETS[sel].ip}
            </motion.p>
          </AnimatePresence>
          <p className="mt-1 text-[11px] text-[#7FB5FF]">Changes with the network</p>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 – subnet mask: network vs host                                    */
/* ------------------------------------------------------------------ */

const OCTETS = [192, 168, 1, 100];
const MASKS: Record<number, string> = { 8: "255.0.0.0", 16: "255.255.0.0", 24: "255.255.255.0" };

function SubnetVisual() {
  const [prefix, setPrefix] = useState(24);
  const net = prefix / 8;
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="grid grid-cols-4 gap-2 text-center font-mono text-xl font-bold text-[#0B2447] sm:text-2xl">
        {OCTETS.map((o, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i < net ? "#FFB547" : "#5FD4C4",
              boxShadow: i < net ? "0 0 14px rgba(255,181,71,.5)" : "0 0 14px rgba(95,212,196,.4)",
            }}
            className="rounded-lg py-3"
          >
            {o}
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-[10px] leading-tight sm:text-xs">
        <motion.div layout className="rounded-md border-t-4 border-[#FFB547] pt-1 text-[#FFB547]" style={{ gridColumn: `span ${net}` }}>
          Network portion: the street name
        </motion.div>
        {net < 4 && (
          <motion.div layout className="rounded-md border-t-4 border-[#5FD4C4] pt-1 text-[#5FD4C4]" style={{ gridColumn: `span ${4 - net}` }}>
            Host portion: the house number
          </motion.div>
        )}
      </div>
      {/* the same split, bit by bit */}
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="text-base">🛣️</span>
        <div className="grid flex-1 gap-px" style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}>
          {Array.from({ length: 32 }, (_, i) => (
            <motion.span
              key={i}
              className="h-2.5 rounded-[1px]"
              animate={{ backgroundColor: i < prefix ? "#FFB547" : "#5FD4C4", scaleY: [1, 1.8, 1] }}
              transition={{ delay: i * 0.01, duration: 0.3 }}
            />
          ))}
        </div>
        <span className="text-base">🏠</span>
      </div>
      <div className="rounded-lg bg-[#0B2447] py-2 text-center text-sm text-[#EAF1FB] ring-1 ring-[#7FB5FF]/30">
        Subnet mask <motion.span key={prefix} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mx-1 inline-block font-mono text-[#FFB547]">{MASKS[prefix]}</motion.span> or <span className="mx-1 font-mono text-[#FFB547]">/{prefix}</span>
      </div>
      <div className="flex justify-center gap-2">
        {[8, 16, 24].map((p) => (
          <button key={p} type="button" aria-pressed={prefix === p} onClick={() => setPrefix(p)} className={`rounded-full px-4 py-1.5 text-sm ${ring} ${prefix === p ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            /{p}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – same network or another network?                                */
/* ------------------------------------------------------------------ */

const DESTS = ["192.168.1.101", "192.168.1.250", "10.0.0.5", "8.8.8.8"];

function SameNetworkVisual() {
  const [dest, setDest] = useState(DESTS[0]);
  const mineOct = PC1_IP.split(".").slice(0, 3);
  const theirOct = dest.split(".").slice(0, 3);
  const mine = mineOct.join(".");
  const theirs = theirOct.join(".");
  const same = mine === theirs;
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-[#0B2447] p-3 ring-1 ring-[#7FB5FF]/30">
          <p className="text-xs text-[#7FB5FF]">My IP (mask /24)</p>
          <p className="font-mono text-sm text-[#EAF1FB]">
            <span className="text-[#FFB547]">{mineOct.map((o, i) => <Fragment key={i}>{i > 0 ? "." : ""}<span>{o}</span></Fragment>)}</span>.100
          </p>
        </div>
        <div className="rounded-lg bg-[#0B2447] p-3 ring-1 ring-[#7FB5FF]/30">
          <p className="text-xs text-[#7FB5FF]">Destination IP</p>
          <p className="font-mono text-sm text-[#EAF1FB]">
            <span className="text-[#FFB547]">
              {theirOct.map((o, i) => (
                <Fragment key={i}>
                  {i > 0 ? "." : ""}
                  <motion.span
                    key={`${dest}-${i}`}
                    className="inline-block"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0, color: o === mineOct[i] ? "#5FD4C4" : "#FF8A7A" }}
                    transition={{ delay: i * 0.06 }}
                  >
                    {o}
                  </motion.span>
                </Fragment>
              ))}
            </span>
            .{dest.split(".")[3]}
          </p>
        </div>
      </div>

      {/* my network boundary */}
      <div className="relative h-14" aria-hidden>
        <motion.div
          className="absolute inset-y-0 left-0 w-[62%] rounded-xl border-2 border-dashed"
          animate={{ borderColor: same ? "rgba(95,212,196,.8)" : "rgba(127,181,255,.5)", backgroundColor: same ? "rgba(95,212,196,.08)" : "rgba(0,0,0,0)" }}
        />
        <span className="absolute left-[7%] top-1/2 -translate-y-1/2 text-2xl">💻</span>
        <motion.div
          className="absolute top-1/2 h-0.5 origin-left rounded"
          style={{ left: "16%", y: "-50%" }}
          animate={{ width: same ? "26%" : "68%", backgroundColor: same ? "#5FD4C4" : "#FF8A7A", opacity: same ? 1 : 0.6 }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        />
        <motion.span
          className="absolute top-1/2 text-2xl"
          style={{ y: "-50%", x: "-50%" }}
          animate={{ left: same ? "50%" : "88%" }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
        >
          💻
        </motion.span>
        <AnimatePresence>
          {!same && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute left-[62%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
            >
              🚧
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={String(same)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className={`rounded-xl py-3 text-center font-semibold text-[#0B2447] ${same ? "bg-[#5FD4C4]" : "bg-[#FF8A7A]"}`}
        >
          {same ? "Same network" : "Destined for another network"}
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-2">
        {DESTS.map((d) => (
          <button key={d} type="button" aria-pressed={dest === d} onClick={() => setDest(d)} className={`rounded-lg border-2 py-2 font-mono text-xs ${ring} ${dest === d ? "border-[#FFB547] bg-[#FFB547]/10 text-[#EAF1FB]" : "border-[#7FB5FF]/30 text-[#7FB5FF]"}`}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – the switch only reads MAC addresses                             */
/* ------------------------------------------------------------------ */

function ConfusedSwitchVisual() {
  const [stage, setStage] = useState(0);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const run = () => {
    clear();
    setStage(1);
    later(() => setStage(2), 1300);
  };
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="relative flex items-center justify-between">
        <div aria-hidden className="absolute left-12 right-12 top-1/2 h-0.5 -translate-y-1/2 bg-[#7FB5FF]/35" />
        <Pc name="PC1" sub={PC1_IP} glow={stage === 1} />
        <div className="relative z-10 flex w-24 flex-col items-center gap-2">
          <AnimatePresence>
            {stage === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 14 }}
                className="absolute -top-10 left-1/2 z-20 w-44 -translate-x-1/2 rounded-xl bg-[#EAF1FB] px-3 py-1.5 text-center text-xs font-semibold text-[#0B2447]"
              >
                "Yo, what what am I looking at?" 🤨
              </motion.div>
            )}
          </AnimatePresence>
          <SwitchBar className="w-full" confused={stage === 2} />
          <span className="text-[10px] text-[#7FB5FF]">Only reads MAC addresses</span>
          {stage === 2 &&
            !reduce &&
            [0, 1, 2].map((k) => (
              <motion.span
                key={k}
                aria-hidden
                className="pointer-events-none absolute top-6 text-base"
                style={{ left: `${20 + k * 30}%` }}
                animate={{ y: [0, -26], opacity: [0, 1, 0], rotate: [-15, 15] }}
                transition={{ duration: 1.3, repeat: Infinity, delay: k * 0.4 }}
              >
                ❓
              </motion.span>
            ))}
        </div>
        <Pc name="PC2" sub={PC2_IP} />
        {stage >= 1 && (
          <motion.div
            key="pkt"
            className="absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0B2447]"
            initial={{ left: "14%", backgroundColor: "#FFB547" }}
            animate={
              stage === 2 && !reduce
                ? { left: "38%", backgroundColor: "#FF8A7A", x: [0, -3, 3, -2, 2, 0] }
                : { left: "38%", backgroundColor: stage === 2 ? "#FF8A7A" : "#FFB547" }
            }
            transition={stage === 2 ? { x: { duration: 0.5, repeat: Infinity } } : { duration: 1.1 }}
          >
            📦 {PC2_IP}
          </motion.div>
        )}
      </div>
      <Caption>{stage === 0 ? "PC1 wants to send a message to PC2." : stage === 1 ? "An IP address, thrown at the switch..." : "The switch has no idea what to do with it."}</Caption>
      <div className="flex justify-center gap-2">
        <button type="button" className={solid} onClick={run}>
          Throw the IP address at the switch
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 – ARP request                                                     */
/* ------------------------------------------------------------------ */

function ArpRequestVisual() {
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <motion.div
        key={run}
        animate={run > 0 ? { boxShadow: ["0 0 0 0 rgba(255,181,71,0)", "0 0 0 6px rgba(255,181,71,0.5)", "0 0 0 0 rgba(255,181,71,0)"] } : {}}
        transition={{ duration: 1.2 }}
        className="rounded-xl bg-[#EAF1FB] px-4 py-3 text-center text-sm font-semibold text-[#0B2447]"
      >
        <span className="mr-2 rounded bg-[#FFB547] px-1.5 py-0.5 font-mono text-xs">ARP request</span>
        Who is {PC2_IP}? Send me your MAC address now.
      </motion.div>
      <div className="relative flex items-center justify-between">
        <div aria-hidden className="absolute left-12 right-12 top-1/2 h-0.5 -translate-y-1/2 bg-[#7FB5FF]/35" />
        <div className="relative z-10">
          <Pc name="PC1" sub={PC1_IP} glow={run > 0} />
        </div>
        <div className="relative z-10 w-24">
          <SwitchBar glow={run > 0} />
        </div>
        <div className="relative z-10 flex flex-col">
          <Pc name="PC2" sub={PC2_IP} />
        </div>
        {run > 0 && !reduce && (
          <motion.span
            key={`req-${run}`}
            aria-hidden
            className="absolute top-1/2 z-20 -translate-y-1/2 rounded bg-[#FFB547] px-1 font-mono text-[9px] font-bold text-[#0B2447]"
            style={{ boxShadow: "0 0 12px #FFB547", marginLeft: -14 }}
            initial={{ left: "16%", opacity: 0 }}
            animate={{ left: ["16%", "50%", "84%"], opacity: [0, 1, 1] }}
            transition={{ duration: 1.8, times: [0, 0.5, 1], ease: "linear" }}
          >
            ARP?
          </motion.span>
        )}
      </div>
      <Caption>{run > 0 ? "PC1 asked the network. And this is quite literally what it says." : "PC1 needs PC2's MAC address first."}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={() => setRun((r) => r + 1)}>
        Send the ARP request
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8 – ARP reply and ARP table                                         */
/* ------------------------------------------------------------------ */

function ArpTableVisual() {
  const [entry, setEntry] = useState(false);
  const [log, setLog] = useState("PC1's ARP table is empty.");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [run, setRun] = useState(0);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const send = () => {
    if (busy) return;
    if (entry) {
      setLog("Found it in the ARP table. No ARP request needed. Traffic goes straight to the switch.");
      return;
    }
    setBusy(true);
    setRun((r) => r + 1);
    setPhase(1);
    setLog(`No entry yet. PC1 asks: "Who is ${PC2_IP}?"`);
    later(() => {
      setPhase(2);
      setLog(`PC2: "Oh, shoot. I'm ${PC2_IP}. Let me send my MAC address."`);
    }, 1300);
    later(() => {
      setEntry(true);
      setPhase(0);
      setLog("PC1 got the MAC address and added it to its internal ARP table. Now it can send traffic to the switch.");
      setBusy(false);
    }, 2800);
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {/* the question and the answer travelling between the two PCs */}
      <div className="relative flex h-10 items-center justify-between px-2" aria-hidden>
        <span className="text-2xl">💻</span>
        <div className="absolute left-10 right-10 top-1/2 h-0.5 -translate-y-1/2 rounded bg-[#7FB5FF]/35" />
        <span className="text-2xl">💻</span>
        {!reduce && phase === 1 && (
          <motion.span
            key={`q-${run}`}
            className="absolute top-1/2 -translate-y-1/2 rounded bg-[#FFB547] px-1 font-mono text-[9px] font-bold text-[#0B2447]"
            style={{ boxShadow: "0 0 12px #FFB547" }}
            initial={{ left: "12%" }}
            animate={{ left: "76%" }}
            transition={{ duration: 1.2, ease: "linear" }}
          >
            Who is {PC2_IP.split(".")[3]}?
          </motion.span>
        )}
        {!reduce && phase === 2 && (
          <motion.span
            key={`a-${run}`}
            className="absolute top-1/2 -translate-y-1/2 rounded bg-[#5FD4C4] px-1 font-mono text-[9px] font-bold text-[#0B2447]"
            style={{ boxShadow: "0 0 12px #5FD4C4" }}
            initial={{ left: "70%" }}
            animate={{ left: "10%" }}
            transition={{ duration: 1.3, ease: "linear" }}
          >
            MAC
          </motion.span>
        )}
      </div>
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40">
        <div className="bg-[#7FB5FF] px-2 py-1 text-center text-xs font-bold text-[#0B2447]">PC1's ARP table</div>
        <div className="grid grid-cols-2 bg-[#0B2447] px-3 py-1 text-xs text-[#7FB5FF]">
          <span>IP address</span>
          <span>MAC address</span>
        </div>
        <div className="h-9">
          <AnimatePresence>
            {entry && (
              <motion.div initial={{ opacity: 0, backgroundColor: "#FFB547", x: 24 }} animate={{ opacity: 1, backgroundColor: "rgba(255,181,71,0)", x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="grid grid-cols-2 gap-1 px-3 py-2 font-mono text-[11px] text-[#EAF1FB] sm:text-xs">
                <span>{PC2_IP}</span>
                <span>{PC2_MAC}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Caption>{log}</Caption>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={solid} onClick={send} disabled={busy}>
          Send a message to PC2
        </button>
        <button type="button" className={chip} disabled={busy || !entry} onClick={() => { clear(); setEntry(false); setPhase(0); setLog("PC1's ARP table is empty."); }}>
          Clear the ARP table
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9 – creating a packet                                               */
/* ------------------------------------------------------------------ */

function PacketVisual() {
  const [wrapped, setWrapped] = useState(false);
  const reduce = useReducedMotion();
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
          animate={{
            borderColor: wrapped ? "#FFB547" : "rgba(255,181,71,0)",
            backgroundColor: wrapped ? "rgba(255,181,71,0.1)" : "rgba(0,0,0,0)",
            boxShadow: wrapped ? "0 0 24px rgba(255,181,71,.3)" : "0 0 0 transparent",
          }}
          className="relative flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-xl border-2 px-3 py-4"
        >
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
          <AnimatePresence>
            {wrapped && (
              <motion.span key="s" initial={{ opacity: 0, x: -30, scale: 0.7 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="rounded bg-[#FFB547] px-2 py-1 font-mono text-xs font-bold text-[#0B2447]">
                Source IP {PC1_IP}
              </motion.span>
            )}
            {wrapped && (
              <motion.span key="d" initial={{ opacity: 0, x: -30, scale: 0.7 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.12 }} className="rounded bg-[#5FD4C4] px-2 py-1 font-mono text-xs font-bold text-[#0B2447]">
                Destination IP {PC2_IP}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            layout
            animate={reduce || wrapped ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="rounded bg-[#EAF1FB] px-3 py-1 text-sm font-semibold text-[#0B2447]"
          >
            📄 The data you want to send
          </motion.span>
        </motion.div>
      </div>
      <p className="text-sm text-[#7FB5FF]">{wrapped ? "A packet" : "Just the data"}</p>
      <button type="button" className={solid} onClick={() => setWrapped((w) => !w)}>
        {wrapped ? "Unwrap" : "Create the packet"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10 – decision path                                                  */
/* ------------------------------------------------------------------ */

function DecisionVisual() {
  const [has, setHas] = useState(false);
  const [n, setN] = useState(0);
  const { later, clear } = useTimers();
  const walk = () => {
    clear();
    setN(1);
    later(() => setN(2), 900);
    later(() => setN(3), 1800);
  };
  const rows = [
    { t: `Looks at the destination IP (${PC2_IP}) and sees it's on the same network.`, c: "#5FD4C4" },
    { t: "Checks its ARP table for a MAC entry for this specific IP address.", c: "#7FB5FF" },
    { t: has ? "There's an entry. It uses that MAC address." : "It isn't there. PC1 sends an ARP request to the network asking for the MAC address of this IP address.", c: has ? "#5FD4C4" : "#FFB547" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="relative space-y-2">
        {/* progress line down the left side */}
        <div aria-hidden className="absolute bottom-6 left-[19px] top-6 w-0.5 rounded bg-[#7FB5FF]/20" />
        <motion.div
          aria-hidden
          className="absolute left-[19px] top-6 w-0.5 rounded bg-[#FFB547]"
          animate={{ height: `calc((100% - 3rem) * ${Math.max(0, n - 1) / 2})` }}
          transition={{ duration: 0.6 }}
        />
        {rows.map((r, i) => (
          <motion.div
            key={`${i}-${has}`}
            animate={{ opacity: n > i ? 1 : 0.25, x: n > i ? 0 : -10, boxShadow: n === i + 1 ? `0 0 18px ${r.c}66` : "0 0 0 transparent" }}
            className="relative flex items-start gap-3 rounded-lg bg-[#0B2447] p-3 ring-1"
            style={{ ["--tw-ring-color" as string]: r.c }}
          >
            <motion.span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-[#0B2447]"
              style={{ backgroundColor: r.c }}
              animate={{ scale: n === i + 1 ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {n > i + 1 ? "✓" : i + 1}
            </motion.span>
            <span className="text-[13px] leading-snug text-[#EAF1FB] sm:text-sm">{r.t}</span>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" role="switch" aria-checked={has} className={chip} onClick={() => { setHas((h) => !h); setN(0); }}>
          ARP table has an entry: {has ? "yes" : "no"}
        </button>
        <button type="button" className={solid} onClick={walk}>
          Walk through it
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11 – packet → frame → bits → signal                                 */
/* ------------------------------------------------------------------ */

const BITS = "0100110101101001 1100101001110010 0110100110010111";

function EncapVisual() {
  const [stage, setStage] = useState(0);
  const reduce = useReducedMotion();
  const labels = [
    "The data.",
    "Wrapped into a packet with a source IP and a destination IP.",
    "Wrapped inside a layer 2 frame, with its own source MAC address and destination MAC address.",
    "The frame turned into a bunch of zeros and ones.",
    "Sent down the Ethernet cable as electrical signals to the switch.",
  ];
  const wave = (() => {
    let d = "M0 20";
    const bits = [0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0];
    bits.forEach((b, i) => {
      const y = b ? 8 : 32;
      d += ` L${i * 20} ${y} L${(i + 1) * 20} ${y}`;
    });
    return d;
  })();
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex min-h-[8.5rem] items-center justify-center">
        {stage < 3 ? (
          <motion.div
            layout
            animate={{ boxShadow: stage >= 2 ? "0 0 20px rgba(95,212,196,.35)" : "0 0 0 transparent" }}
            className={`flex max-w-full flex-col items-center gap-1 rounded-xl p-2 ${stage >= 2 ? "border-2 border-[#5FD4C4] bg-[#5FD4C4]/10" : ""}`}
          >
            {stage >= 2 && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-full break-words rounded bg-[#5FD4C4] px-2 py-0.5 text-center font-mono text-[10px] font-bold text-[#0B2447]"
              >
                Dst MAC {PC2_MAC} · Src MAC {PC1_MAC}
              </motion.span>
            )}
            <motion.div
              layout
              animate={{ boxShadow: stage === 1 ? "0 0 20px rgba(255,181,71,.4)" : "0 0 0 transparent" }}
              className={`flex max-w-full flex-col items-center gap-1 rounded-lg p-2 ${stage >= 1 ? "border-2 border-[#FFB547] bg-[#FFB547]/10" : ""}`}
            >
              {stage >= 1 && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-full break-words rounded bg-[#FFB547] px-2 py-0.5 text-center font-mono text-[10px] font-bold text-[#0B2447]"
                >
                  Src IP {PC1_IP} · Dst IP {PC2_IP}
                </motion.span>
              )}
              <motion.span
                animate={reduce || stage > 0 ? undefined : { y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded bg-[#EAF1FB] px-3 py-1 text-sm font-semibold text-[#0B2447]"
              >
                📄 Data
              </motion.span>
            </motion.div>
          </motion.div>
        ) : (
          <div className="w-full space-y-3">
            <p className="break-all text-center font-mono text-sm tracking-widest text-[#FFB547]">
              {BITS.split("").map((ch, i) => (
                <motion.span
                  key={`${stage}-${i}`}
                  className="inline-block"
                  initial={reduce ? false : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.012 }}
                >
                  {ch === " " ? "\u00A0" : ch}
                </motion.span>
              ))}
            </p>
            {stage === 4 && (
              <>
                <svg viewBox="0 0 240 40" className="mx-auto h-8 w-full max-w-xs" aria-hidden preserveAspectRatio="none">
                  <motion.path
                    d={wave}
                    fill="none"
                    stroke="#FFB547"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4 }}
                  />
                </svg>
                <div className="relative mx-auto h-8 w-full">
                  <div className="absolute left-12 right-12 top-1/2 h-1.5 -translate-y-1/2 rounded bg-[#7FB5FF]" />
                  <span className="absolute left-0 top-0 text-2xl">💻</span>
                  <span className="absolute right-0 top-1 rounded bg-[#7FB5FF] px-1.5 text-xs font-semibold text-[#0B2447]">Switch</span>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="absolute top-1 text-lg" initial={{ left: "12%" }} animate={{ left: "78%" }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "linear" }}>
                      ⚡
                    </motion.span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <Caption>{labels[stage]}</Caption>
      <div className="flex items-center justify-center gap-3">
        <div className="flex gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((k) => (
            <motion.span key={k} className="h-2 w-2 rounded-full" animate={{ backgroundColor: k <= stage ? "#FFB547" : "rgba(127,181,255,.35)", scale: k === stage ? 1.4 : 1 }} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={solid} disabled={stage >= 4} onClick={() => setStage((s) => s + 1)}>
            {stage === 0 ? "Create the packet" : stage === 1 ? "Wrap it in a frame" : stage === 2 ? "Turn it into bits" : "Send it down the cable"}
          </button>
          <button type="button" className={chip} onClick={() => setStage(0)} disabled={stage === 0}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12 – the switch forwards or floods                                  */
/* ------------------------------------------------------------------ */

function SwitchReceiveVisual() {
  const [knows, setKnows] = useState(true);
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  const names = ["PC1", "PC2", "PC3", "PC4"];
  const hit = (i: number) => run > 0 && i !== 0 && (knows ? i === 1 : true);
  const X = (i: number) => ((i + 0.5) / 4) * 100;
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-4 gap-2">
        {names.map((n, i) => (
          <motion.div
            key={`${n}-${run}`}
            animate={hit(i) ? { scale: [1, 1.12, 1], borderColor: [knows ? "#5FD4C4" : "#FFB547"] } : { borderColor: i === 0 && run > 0 ? "#FFFFFF" : "rgba(127,181,255,0.3)" }}
            transition={hit(i) ? { delay: 1.2, duration: 0.5 } : undefined}
            className="flex flex-col items-center whitespace-nowrap rounded-lg border-2 bg-[#0B2447]/60 py-2"
          >
            <span className="text-[10px] text-[#7FB5FF]">Port {i + 1}</span>
            <span className="text-2xl">💻</span>
            <span className="text-[11px] text-[#EAF1FB]">{n}</span>
          </motion.div>
        ))}
      </div>

      {/* cables and the frame travelling through them */}
      <div className="relative h-6" aria-hidden>
        {names.map((_, i) => (
          <div
            key={i}
            className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded"
            style={{ left: `${X(i)}%`, backgroundColor: run > 0 && (i === 0 || hit(i)) ? "#FFB547" : "rgba(127,181,255,.35)" }}
          />
        ))}
        {run > 0 && !reduce && (
          <>
            <motion.span
              key={`in-${run}`}
              className="absolute"
              style={{ left: `${X(0)}%`, marginLeft: -14 }}
              initial={{ top: "-20%", opacity: 0 }}
              animate={{ top: "100%", opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeIn" }}
            >
              <FrameChip dst={knows ? "#5FD4C4" : "#FFB547"} />
            </motion.span>
            {names.map((_, i) =>
              hit(i) ? (
                <motion.span
                  key={`out-${run}-${i}`}
                  className="absolute"
                  style={{ left: `${X(i)}%`, marginLeft: -14 }}
                  initial={{ top: "100%", opacity: 0 }}
                  animate={{ top: "-20%", opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                >
                  <FrameChip dst={knows ? "#5FD4C4" : "#FFB547"} />
                </motion.span>
              ) : null,
            )}
          </>
        )}
      </div>
      <SwitchBar glow={run > 0 && !knows} lit={run > 0 ? [0, ...(knows ? [2] : [2, 4, 6])] : []} />
      <div className="mx-auto w-full max-w-xs overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40">
        <div className="bg-[#7FB5FF] px-2 py-1 text-center text-[11px] font-bold text-[#0B2447]">Switch MAC address table</div>
        <motion.div
          key={String(knows)}
          initial={{ backgroundColor: "rgba(255,181,71,.3)" }}
          animate={{ backgroundColor: "rgba(255,181,71,0)" }}
          transition={{ duration: 0.8 }}
          className="px-2 py-1.5 font-mono text-xs text-[#EAF1FB]"
        >
          {knows ? `${PC2_MAC} → Port 2` : "No entry for PC2's MAC"}
        </motion.div>
      </div>
      <Caption>
        {run === 0 ? "PC1 sends the frame to the switch." : knows ? "It found a match and forwarded the frame out of that corresponding port." : "No match. Unknown unicast: flooded out of all the ports except the one it was received on. That's how it finds PC2."}
      </Caption>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" role="switch" aria-checked={knows} className={chip} onClick={() => { setKnows((k) => !k); setRun(0); }}>
          Switch knows PC2: {knows ? "yes" : "no"}
        </button>
        <button type="button" className={solid} onClick={() => setRun((r) => r + 1)}>
          Send the frame
        </button>
      </div>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  FloodScaleVisual,
  NeedVisual,
  MovingVisual,
  SubnetVisual,
  SameNetworkVisual,
  ConfusedSwitchVisual,
  ArpRequestVisual,
  ArpTableVisual,
  PacketVisual,
  DecisionVisual,
  EncapVisual,
  SwitchReceiveVisual,
];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

// Stage height on phones, per beat (from sm up it is always 24rem).
const STAGE_H = [
  "h-[22rem]", "h-[22rem]", "h-[22rem]", "h-[22rem]",
  "h-[24rem]", "h-[22rem]", "h-[24rem]", "h-[26rem]",
  "h-[22rem]", "h-[28rem]", "h-[24rem]", "h-[28rem]",
];

const DRIFT = [
  { l: 8, t: 20, d: 0 },
  { l: 22, t: 78, d: 1.2 },
  { l: 41, t: 12, d: 2.1 },
  { l: 63, t: 85, d: 0.6 },
  { l: 78, t: 30, d: 1.7 },
  { l: 92, t: 70, d: 2.8 },
];

const LAYER_BARS = ["#FFB547", "#7FB5FF", "#5FD4C4", "#EAF1FB"]; // layers 4 → 1

export default function Section06NetworkLayerIpArp({ onComplete }: Props) {
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
      aria-label="Section 6: Layer 3, IP addresses, subnet masks and ARP"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Layer 3: IP addresses, subnet masks and ARP</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
          {/* mini layer stack: Layer 3 is lit, Layers 1 and 2 stay softly on */}
          <div className="flex flex-col gap-1 pt-1" aria-hidden>
            {LAYER_BARS.map((c, i) => {
              const lit = i === 1;
              const done = i >= 2;
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
          className={`relative overflow-hidden rounded-xl border border-[#7FB5FF]/30 bg-[#0B2447]/70 p-4 transition-[height] duration-300 sm:h-[24rem] ${STAGE_H[step]}`}
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

        <p key={step} className="min-h-[12rem] font-serif text-lg leading-relaxed sm:text-xl">
          <span className="sr-only">{BEATS[step]}</span>
          {words.map((w, i) => (
            <Fragment key={i}>
              <motion.span
                aria-hidden
                className="inline-block"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015, duration: 0.25 }}
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
              On to routers
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
