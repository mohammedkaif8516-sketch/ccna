"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 8 – DHCP and DNS
 * Transcript range: 16:07 – 17:49
 *
 * Dependencies: react, framer-motion, tailwindcss
 * Usage:  <Section08DhcpDns onComplete={() => goToSection(9)} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Transcript                                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "But, okay, let's take a break from routers and talk about IP addresses again. We know that every device has to have an IP address if it wants to connect to the network or the internet. Have you ever wondered why you never have to manually configure it yourself? And this is all because of something called DHCP.",
  "A DHCP leases out IP addresses to clients or devices. And they can also provide other information like like default gateway or DNS server.",
  "So when your device first joins a network, one of the first things it does, or I think it's the first thing it does, is it'll yell out looking for a DHCP server. It'll be like, \"Yo, I need an IP address. Is there a DHCP server here?\" And this is the first part of the four-step Dora process of receiving an IP address from a DHCP server.",
  "And then you can open up a browser and you can type in youtube.com. But then you quickly realize, bro, what? YouTube.com is not an IP address. How does your PC know where to send traffic to? Is that magic? A little bit. But more accurately, it's because of DNS.",
  "DNS maps IP addresses to domain names. And this is because humans, you know, like me and you, not AI yet, we tend to remember names better than numbers.",
  "Certain DNS records are typically stored on your computer, but you obviously wouldn't have every single domain in the entire world in your local DNS like DNS cache or DNS store on your computer.",
  "So instead, yeah, when you type YouTube.com into your browser, assuming that you don't have an entry for it in your PC, your device will go ask DNS server that you actually just got from DHCP, hey, what's the IP address for youtube.com? It'll send the traffic to the DNS server.",
  "If that specific DNS server doesn't know, which is pretty common because not every DNS server will know everything, the DNS server will ask other DNS servers until it finds the answer and gives it to you.",
  "And then your device has all the missing pieces it needs to wrap the packet with a source IP, destination IP, and send it out to the internet.",
];

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]";
const chip = `rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 disabled:opacity-40 ${ring}`;
const solid = `rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] disabled:opacity-40 ${ring}`;

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

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="min-h-[2.5rem] text-center text-[13px] leading-snug text-[#EAF1FB] sm:text-sm" aria-live="polite">
      {children}
    </p>
  );
}

type HopNode = { icon: string; label: string; sub?: string; active?: boolean; badge?: string };

/** A row of nodes with a packet that slides to node index `pos` (null = hidden). */
function Hops({ nodes, pos, packet = "📦" }: { nodes: HopNode[]; pos: number | null; packet?: string }) {
  const n = nodes.length;
  const reduce = useReducedMotion();
  const spring = { type: "spring" as const, stiffness: 90, damping: 16 };
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-6 h-1 -translate-y-1/2 rounded bg-[#7FB5FF]/40" style={{ marginInline: `${50 / n}%` }} />
      {pos !== null && (
        <motion.div
          aria-hidden
          className="absolute top-6 h-1 -translate-y-1/2 rounded bg-[#FFB547]"
          style={{ left: `${50 / n}%` }}
          initial={false}
          animate={{ width: `${(pos / n) * 100}%` }}
          transition={spring}
        />
      )}
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {nodes.map((nd, i) => (
          <div key={i} className="relative flex flex-col items-center text-center">
            <AnimatePresence>
              {nd.badge && (
                <motion.span
                  key={nd.badge}
                  aria-hidden
                  initial={{ scale: 0, y: 6 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 12 }}
                  className="absolute -top-2 right-[10%] z-10 text-sm"
                >
                  {nd.badge}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              animate={{ scale: nd.active ? 1.15 : 1, boxShadow: nd.active ? "0 0 18px rgba(255,181,71,.6)" : "0 0 0 transparent" }}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${nd.active ? "bg-[#FFB547]/25 ring-2 ring-[#FFB547]" : "bg-[#0B2447]"}`}
            >
              {nd.icon}
              {pos === i && !reduce && (
                <motion.span
                  key={`arr-${i}-${pos}`}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#FFB547]"
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.3 }}
                />
              )}
            </motion.div>
            <span className="mt-1 text-xs font-semibold leading-tight text-[#EAF1FB]">{nd.label}</span>
            {nd.sub && <span className="break-words font-mono text-[9px] leading-tight text-[#7FB5FF] sm:text-[10px]">{nd.sub}</span>}
          </div>
        ))}
      </div>
      {pos !== null && (
        <>
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-0 text-2xl"
              style={{ x: "-50%" }}
              initial={false}
              animate={{ left: `${((pos + 0.5) / n) * 100}%`, y: -2, opacity: 0.3 }}
              transition={{ ...spring, delay: 0.14 }}
            >
              {packet}
            </motion.div>
          )}
          <motion.div
            className="pointer-events-none absolute top-0 text-2xl"
            style={{ x: "-50%" }}
            initial={false}
            animate={{ left: `${((pos + 0.5) / n) * 100}%`, y: -2 }}
            transition={spring}
          >
            {packet}
          </motion.div>
        </>
      )}
    </div>
  );
}

const GW = "192.168.1.1";

/* ------------------------------------------------------------------ */
/* 1 – you never configure it yourself                                 */
/* ------------------------------------------------------------------ */

function AutoIpVisual() {
  const [joined, setJoined] = useState(false);
  const reduce = useReducedMotion();
  const fields = [
    { l: "IP address", v: "192.168.1.100" },
    { l: "Subnet mask", v: "255.255.255.0" },
    { l: "Default gateway", v: GW },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <motion.div
        animate={{ boxShadow: joined ? "0 0 24px rgba(95,212,196,.35)" : "0 0 0 transparent" }}
        className="mx-auto w-full max-w-xs space-y-2 rounded-xl bg-[#0B2447] p-4 ring-1 ring-[#7FB5FF]/30"
      >
        <p className="flex items-center justify-between text-sm font-semibold text-[#EAF1FB]">
          <span>
            <motion.span
              className="inline-block"
              animate={joined && !reduce ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : { scale: 1, opacity: joined ? 1 : 0.5 }}
              transition={{ duration: 1.4, repeat: joined ? Infinity : 0 }}
            >
              📶
            </motion.span>{" "}
            Home Wi-Fi
          </span>
          <span className={`text-xs ${joined ? "text-[#5FD4C4]" : "text-[#7FB5FF]"}`}>{joined ? "Connected" : "Not connected"}</span>
        </p>
        {fields.map((f, i) => (
          <div key={f.l} className="relative flex items-center justify-between overflow-hidden rounded bg-[#123A6B]/60 px-2 py-1.5 text-xs">
            <span className="text-[#EAF1FB]">{f.l}</span>
            <AnimatePresence mode="wait">
              {joined ? (
                <motion.span key="v" className="font-mono" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                  {f.v.split("").map((c, k) => (
                    <motion.span
                      key={k}
                      className="inline-block"
                      initial={{ opacity: 0, y: 6, color: "#FFB547" }}
                      animate={{ opacity: 1, y: 0, color: "#EAF1FB" }}
                      transition={{ delay: reduce ? 0 : 0.5 + i * 0.35 + k * 0.03 }}
                    >
                      {c}
                    </motion.span>
                  ))}
                </motion.span>
              ) : (
                <motion.span key="e" exit={{ opacity: 0 }} className="font-mono text-[#7FB5FF]/50">
                  not set
                </motion.span>
              )}
            </AnimatePresence>
            {joined && !reduce && (
              <motion.span
                aria-hidden
                className="absolute top-1/2 -translate-y-1/2 text-[10px]"
                initial={{ left: "100%", opacity: 1 }}
                animate={{ left: "55%", opacity: 0 }}
                transition={{ delay: 0.3 + i * 0.35, duration: 0.5 }}
              >
                ✨
              </motion.span>
            )}
          </div>
        ))}
      </motion.div>
      <Caption>{joined ? "You never typed any of that in. ✨" : "No IP address yet."}</Caption>
      <button type="button" className={`${joined ? chip : solid} mx-auto`} onClick={() => setJoined((j) => !j)}>
        {joined ? "Leave the network" : "Join the network"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – DHCP leases addresses plus extra info                           */
/* ------------------------------------------------------------------ */

function LeaseVisual() {
  const names = ["PC1", "Phone", "Laptop", "TV"];
  const [leases, setLeases] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [fly, setFly] = useState<{ id: number; idx: number } | null>(null);
  const reduce = useReducedMotion();
  const lease = (n: string) => {
    if (!(n in leases)) setFly({ id: (fly?.id ?? 0) + 1, idx: names.indexOf(n) });
    setLeases((p) => (n in p ? p : { ...p, [n]: 100 + Object.keys(p).length }));
    setSel(n);
  };
  const X = (i: number) => ((i + 0.5) / 4) * 100;
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <motion.div
        animate={{ boxShadow: fly ? ["0 0 0 rgba(95,212,196,0)", "0 0 18px rgba(95,212,196,.7)", "0 0 0 rgba(95,212,196,0)"] : "0 0 0 transparent" }}
        key={fly?.id ?? 0}
        className="mx-auto flex w-full max-w-sm items-center justify-between rounded-lg bg-[#5FD4C4] px-4 py-2 text-[#0B2447]"
      >
        <span className="text-sm font-semibold">🗄️ DHCP server</span>
        <span className="font-mono text-xs">Leased out: {Object.keys(leases).length}</span>
      </motion.div>
      <div className="relative h-6" aria-hidden>
        {names.map((n, i) => (
          <div
            key={n}
            className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded"
            style={{ left: `${X(i)}%`, backgroundColor: n in leases ? "#FFB547" : "rgba(127,181,255,.3)" }}
          />
        ))}
        {fly && !reduce && (
          <motion.span
            key={fly.id}
            className="absolute text-base"
            style={{ left: `${X(fly.idx)}%`, marginLeft: -9 }}
            initial={{ top: "-30%", opacity: 1 }}
            animate={{ top: "90%", opacity: [1, 1, 0] }}
            transition={{ duration: 0.7, ease: "easeIn" }}
          >
            🎫
          </motion.span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {names.map((n) => (
          <button key={n} type="button" aria-pressed={sel === n} onClick={() => lease(n)} className={`relative overflow-hidden rounded-lg border-2 py-2 text-center ${ring} ${sel === n ? "border-[#FFB547] bg-[#FFB547]/10" : "border-[#7FB5FF]/30"}`}>
            <div className="text-2xl">{n === "Phone" ? "📱" : n === "TV" ? "📺" : "💻"}</div>
            <div className="text-xs text-[#EAF1FB]">{n}</div>
            <div className="font-mono text-[10px] text-[#FFB547]">{n in leases ? `.${leases[n]}` : "no lease"}</div>
            {n in leases && !reduce && (
              <motion.span
                aria-hidden
                className="absolute bottom-0 left-0 h-0.5 bg-[#5FD4C4]"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 24, ease: "linear", repeat: Infinity }}
              />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={sel ?? "none"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-1 w-full max-w-sm rounded-lg bg-[#0B2447] p-3 ring-1 ring-[#7FB5FF]/30">
          {sel ? (
            <div className="space-y-1 text-xs text-[#EAF1FB]">
              <p className="font-semibold text-[#FFB547]">What {sel} got from DHCP</p>
              {[
                ["IP address", `192.168.1.${leases[sel]}`],
                ["Default gateway", GW],
                ["DNS server", GW],
              ].map(([k, v], i) => (
                <motion.p key={k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.12 }} className="flex justify-between">
                  <span>{k}</span>
                  <span className="font-mono">{v}</span>
                </motion.p>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-[#7FB5FF]">Tap a device to lease it an IP address</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – the first step of DORA                                          */
/* ------------------------------------------------------------------ */

function DoraVisual() {
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="min-h-[3.2rem]">
        <AnimatePresence mode="wait">
          {run > 0 && (
            <motion.p
              key={run}
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
              className="mx-auto w-52 rounded-xl bg-[#EAF1FB] px-3 py-1.5 text-center text-xs font-semibold text-[#0B2447]"
            >
              "Yo, I need an IP address. Is there a DHCP server here?"
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="relative flex items-center justify-between px-4">
        <div className="relative text-center">
          <motion.div
            className="text-4xl"
            animate={run > 0 && !reduce ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : {}}
            key={`pc-${run}`}
            transition={{ duration: 0.6 }}
          >
            💻
          </motion.div>
          <div className="text-xs text-[#EAF1FB]">New device</div>
        </div>
        <div aria-hidden className="absolute left-14 right-14 top-1/2 h-0.5 -translate-y-1/2 bg-[#7FB5FF]/30" />
        {run > 0 && !reduce && (
          <div className="pointer-events-none absolute left-14 top-1/2">
            {[0, 1, 2].map((i) => (
              <motion.span key={`${run}-${i}`} className="absolute h-10 w-10 -translate-y-1/2 rounded-full border-2 border-[#FFB547]" initial={{ scale: 0.3, opacity: 0.8 }} animate={{ scale: 5, opacity: 0 }} transition={{ duration: 2, delay: i * 0.5 }} />
            ))}
          </div>
        )}
        {run > 0 && !reduce &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={`pk-${run}-${i}`}
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 text-base"
              initial={{ left: "22%", opacity: 0 }}
              animate={{ left: "74%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, delay: i * 0.35, ease: "linear" }}
            >
              📣
            </motion.span>
          ))}
        <div className="relative text-center">
          <motion.div
            key={`srv-${run}`}
            className="text-4xl"
            animate={run > 0 && !reduce ? { scale: [1, 1, 1.3, 1], filter: ["brightness(1)", "brightness(1)", "brightness(1.8)", "brightness(1)"] } : {}}
            transition={{ duration: 1.8, times: [0, 0.7, 0.85, 1] }}
          >
            🗄️
          </motion.div>
          <div className="text-xs text-[#EAF1FB]">DHCP server</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {["D", "O", "R", "A"].map((l, i) => (
          <motion.div
            key={l}
            animate={{
              opacity: i === 0 && run > 0 ? 1 : 0.35,
              backgroundColor: i === 0 && run > 0 ? "#FFB547" : "#0B2447",
              boxShadow: i === 0 && run > 0 ? "0 0 20px rgba(255,181,71,.6)" : "0 0 0 transparent",
              scale: i === 0 && run > 0 ? [1, 1.12, 1] : 1,
            }}
            className="rounded-lg py-4 text-center font-mono text-2xl font-bold text-[#EAF1FB] ring-1 ring-[#7FB5FF]/40"
            style={i === 0 && run > 0 ? { color: "#0B2447" } : undefined}
          >
            {l}
          </motion.div>
        ))}
      </div>
      <Caption>{run > 0 ? "The first part of the four-step Dora process." : "Four steps in the Dora process. Join a network to start the first one."}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={() => setRun((r) => r + 1)}>
        Join the network
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 – youtube.com is not an IP address                                */
/* ------------------------------------------------------------------ */

function BrowserVisual() {
  const [stage, setStage] = useState(0);
  const reduce = useReducedMotion();
  const url = "youtube.com";
  const labels = ["Type in youtube.com", "Send traffic", "Is that magic?", "Start over"];
  const text = [
    "A browser, an empty address bar.",
    "Typed in youtube.com...",
    "Bro, what? YouTube.com is not an IP address. How does your PC know where to send traffic to?",
    "A little bit. But more accurately, it's because of DNS.",
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="overflow-hidden rounded-lg bg-[#EAF1FB] ring-1 ring-[#7FB5FF]/40">
        <div className="flex items-center gap-1.5 bg-[#C9D8EE] px-3 py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF8A7A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFB547]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5FD4C4]" />
        </div>
        <div className="px-3 py-2">
          <div className="flex h-8 items-center rounded-full bg-white px-3 font-mono text-sm text-[#0B2447]">
            {stage >= 1 && (
              <motion.span className="mr-1.5 text-xs text-[#FF3B3B]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }}>
                ▶
              </motion.span>
            )}
            {stage >= 1 &&
              url.split("").map((c, i) => (
                <motion.span key={`${stage > 0}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: stage === 1 ? i * 0.07 : 0 }}>
                  {c}
                </motion.span>
              ))}
            <motion.span
              aria-hidden
              className="ml-0.5 inline-block h-4 w-0.5 bg-[#0B2447]"
              animate={reduce ? undefined : { opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          </div>
          {/* loading bar: starts, then stalls */}
          <div className="mt-2 h-1 overflow-hidden rounded bg-[#C9D8EE]">
            <motion.div
              className="h-full"
              animate={{ width: stage === 0 ? "0%" : stage === 1 ? "55%" : "55%", backgroundColor: stage >= 2 ? "#FF8A7A" : "#5FD4C4", opacity: stage >= 2 && !reduce ? [1, 0.4, 1] : 1 }}
              transition={{ width: { duration: 0.8 }, opacity: { duration: 0.8, repeat: Infinity } }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 text-center">
        {stage >= 1 && (
          <motion.span
            key={`pk-${stage >= 2}`}
            className="text-xl"
            animate={reduce ? undefined : stage >= 2 ? { x: [0, -4, 4, -3, 3, 0] } : { x: [0, 6, 0] }}
            transition={{ duration: stage >= 2 ? 0.6 : 0.9, repeat: Infinity }}
          >
            📦
          </motion.span>
        )}
        <span className="rounded-lg bg-[#0B2447] px-3 py-2 font-mono text-xs text-[#EAF1FB] ring-1 ring-[#7FB5FF]/30">
          Destination IP: <span className={stage >= 2 ? "text-[#FF8A7A]" : "text-[#7FB5FF]"}>{stage >= 2 ? "???" : "—"}</span>
        </span>
        <AnimatePresence>
          {stage === 3 && (
            <motion.span initial={{ opacity: 0, scale: 0.4, rotate: -30 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} className="rounded-lg bg-[#FFB547] px-3 py-2 text-sm font-bold text-[#0B2447]" style={{ boxShadow: "0 0 18px rgba(255,181,71,.7)" }}>
              ✨ DNS
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <Caption>{text[stage]}</Caption>
      <button type="button" className={`${stage === 3 ? chip : solid} mx-auto`} onClick={() => setStage((s) => (s + 1) % 4)}>
        {labels[stage]}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – names vs numbers                                                */
/* ------------------------------------------------------------------ */

function NamesNumbersVisual() {
  const rows = [
    { name: "youtube.com", ip: "203.0.113.17" },
    { name: "wikipedia.org", ip: "198.51.100.42" },
    { name: "example.com", ip: "192.0.2.80" },
  ];
  const [forgot, setForgot] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center text-xs text-[#7FB5FF]">
        <span>Domain names</span>
        <span className="w-6" />
        <span>IP addresses</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.name} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <motion.div
            animate={{ boxShadow: forgot ? "0 0 16px rgba(255,181,71,.6)" : "0 0 0 transparent" }}
            className="rounded-lg bg-[#FFB547] py-2 text-center text-[13px] font-semibold text-[#0B2447] sm:text-sm"
          >
            {r.name}
          </motion.div>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.2 }}
            className="w-6 text-center text-[#7FB5FF]"
          >
            ⟷
          </motion.span>
          <div className="relative">
            <motion.div
              animate={{ filter: forgot ? "blur(5px)" : "blur(0px)", opacity: forgot ? 0.3 : 1 }}
              transition={{ delay: forgot ? i * 0.4 : 0, duration: 0.8 }}
              className="rounded-lg bg-[#0B2447] py-2 text-center font-mono text-[11px] text-[#EAF1FB] ring-1 ring-[#7FB5FF]/30 sm:text-xs"
            >
              {r.ip}
            </motion.div>
            {forgot &&
              !reduce &&
              r.ip.replace(/\./g, "").slice(0, 5).split("").map((d, k) => (
                <motion.span
                  key={`${i}-${k}`}
                  aria-hidden
                  className="pointer-events-none absolute top-1 font-mono text-xs text-[#7FB5FF]"
                  style={{ left: `${12 + k * 17}%` }}
                  initial={{ opacity: 0.9, y: 0 }}
                  animate={{ opacity: 0, y: -22, x: (k - 2) * 6 }}
                  transition={{ duration: 1.2, delay: i * 0.4 + k * 0.1 }}
                >
                  {d}
                </motion.span>
              ))}
          </div>
        </div>
      ))}
      <Caption>{forgot ? "The numbers are gone. The names stuck. Humans remember names better than numbers." : "DNS maps IP addresses to domain names."}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={() => setForgot((f) => !f)}>
        {forgot ? "Show the numbers" : "Try to remember them"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – the local DNS cache can't hold the world                        */
/* ------------------------------------------------------------------ */

function CacheVisual() {
  const domains = [
    { d: "example.com", cached: true },
    { d: "youtube.com", cached: false },
    { d: "wikipedia.org", cached: true },
    { d: "some-tiny-blog.net", cached: false },
    { d: "mail.example.org", cached: false },
    { d: "news.example.net", cached: true },
  ];
  const [res, setRes] = useState<Record<string, boolean>>({});
  const [last, setLast] = useState<{ n: number; idx: number; cached: boolean } | null>(null);
  const reduce = useReducedMotion();
  const test = (x: { d: string; cached: boolean }, k: number) => {
    setRes((p) => ({ ...p, [x.d]: x.cached }));
    setLast((l) => ({ n: (l?.n ?? 0) + 1, cached: x.cached, idx: x.cached ? k % 3 : 3 + ((k * 17 + 11) % 97) }));
  };
  return (
    <div className="flex h-full gap-3">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-xs text-[#7FB5FF]">Look up a domain on this computer</p>
        {domains.map((x, k) => {
          const r = res[x.d];
          return (
            <motion.button
              key={x.d}
              type="button"
              onClick={() => test(x, k)}
              whileTap={{ scale: 0.97 }}
              className={`flex w-full flex-col items-start rounded-md border px-2 py-1 text-left ${ring} ${r === undefined ? "border-[#7FB5FF]/30" : r ? "border-[#5FD4C4] bg-[#5FD4C4]/10" : "border-[#FF8A7A] bg-[#FF8A7A]/10"}`}
            >
              <span className="font-mono text-xs text-[#EAF1FB]">{x.d}</span>
              <motion.span
                key={String(r)}
                className="text-[11px]"
                initial={reduce ? false : { opacity: 0, x: -6, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
              >
                {r === undefined ? "🔍" : r ? "✅ In the local DNS cache" : "❌ Not stored here"}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-lg bg-[#0B2447] p-2 ring-1 ring-[#7FB5FF]/30">
        <div className="grid grid-cols-10 gap-[2px]">
          {Array.from({ length: 100 }, (_, i) => {
            const hit = last && last.idx === i;
            return (
              <motion.span
                key={`${i}-${hit ? last!.n : 0}`}
                initial={{ opacity: 0 }}
                animate={
                  hit && !reduce
                    ? { opacity: 1, scale: [1, 2.6, 1], backgroundColor: last!.cached ? "#5FD4C4" : "#FF8A7A" }
                    : { opacity: 1, scale: 1, backgroundColor: i < 3 ? "#5FD4C4" : "#2A5A94" }
                }
                transition={hit ? { duration: 0.7 } : { delay: i * 0.01 }}
                className="aspect-square rounded-[1px]"
              />
            );
          })}
        </div>
        <p className="text-center text-[10px] leading-tight text-[#EAF1FB]">Every single domain in the entire world</p>
        <p className="text-center text-[10px] leading-tight text-[#5FD4C4]">Your DNS cache: the tiny teal bit</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 – ask the DNS server from DHCP                                    */
/* ------------------------------------------------------------------ */

function AskDnsVisual() {
  const [stage, setStage] = useState(0);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const run = () => {
    clear();
    setStage(1);
    later(() => setStage(2), 1200);
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="mx-auto w-full max-w-xs rounded-lg bg-[#0B2447] p-3 text-xs ring-1 ring-[#7FB5FF]/30">
        <p className="mb-1 font-semibold text-[#7FB5FF]">My PC's DNS cache</p>
        <motion.p
          key={stage >= 1 ? "no" : "looking"}
          animate={stage >= 1 && !reduce ? { x: [0, -4, 4, -2, 2, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`font-mono ${stage >= 1 ? "text-[#FF8A7A]" : "text-[#EAF1FB]/60"}`}
        >
          {stage >= 1 ? "youtube.com: no entry" : "Looking up youtube.com..."}
        </motion.p>
      </div>
      <div className="min-h-[2.2rem]">
        <AnimatePresence>
          {stage === 2 && (
            <motion.p initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="mx-auto w-56 rounded-xl bg-[#EAF1FB] px-3 py-1 text-center text-[11px] font-semibold text-[#0B2447]">
              "Hey, what's the IP address for youtube.com?"
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <Hops nodes={[{ icon: "💻", label: "My PC" }, { icon: "🗄️", label: "DNS server", sub: "The one DHCP gave me", active: stage === 2 }]} pos={stage === 0 ? null : stage === 1 ? 0 : 1} packet="✉️" />
      <Caption>{stage === 2 ? "It sends the traffic to the DNS server." : "No entry in the PC means the device goes and asks."}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={run}>
        Type youtube.com into the browser
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8 – DNS servers asking other DNS servers                            */
/* ------------------------------------------------------------------ */

function ChainVisual() {
  const [pos, setPos] = useState<number | null>(null);
  const [msg, setMsg] = useState("Not every DNS server will know everything.");
  const [back, setBack] = useState(false);
  const { later, clear } = useTimers();
  const run = () => {
    clear();
    setBack(false);
    setPos(0);
    setMsg("Asking the first DNS server...");
    later(() => { setPos(1); }, 100);
    later(() => setMsg("DNS server 1 doesn't know. Pretty common. It asks another one."), 1300);
    later(() => setPos(2), 2300);
    later(() => setMsg("DNS server 2 doesn't know either. It asks another one."), 3500);
    later(() => setPos(3), 4500);
    later(() => setMsg("DNS server 3 knows. The answer gets passed back."), 5700);
    later(() => { setBack(true); setPos(2); }, 6700);
    later(() => setPos(1), 7900);
    later(() => setPos(0), 9100);
    later(() => setMsg("The DNS server found the answer and gave it to you."), 10100);
  };
  const badge = (i: number): string | undefined => {
    if (pos === null) return undefined;
    if (i === 3 && (pos === 3 || back)) return "💡";
    if (!back) {
      if ((i === 1 && pos >= 2) || (i === 2 && pos >= 3)) return "🤷";
      return undefined;
    }
    if (i < 3 && i >= pos && i > 0) return "✅";
    return undefined;
  };
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Hops
        nodes={[
          { icon: "💻", label: "My PC", badge: back && pos === 0 ? "✅" : undefined },
          { icon: "🗄️", label: "DNS 1", active: pos === 1, badge: badge(1) },
          { icon: "🗄️", label: "DNS 2", active: pos === 2, badge: badge(2) },
          { icon: "🗄️", label: "DNS 3", active: pos === 3, badge: badge(3) },
        ]}
        pos={pos}
        packet={back ? "✅" : "❓"}
      />
      <Caption>{msg}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={run}>
        Ask for youtube.com
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9 – all the missing pieces                                          */
/* ------------------------------------------------------------------ */

function PiecesVisual() {
  const pieces = [
    { id: "src", label: "Source IP", from: "from DHCP", value: "192.168.1.100", color: "#FFB547" },
    { id: "dst", label: "Destination IP", from: "from DNS", value: "203.0.113.17", color: "#5FD4C4" },
    { id: "data", label: "Data", from: "your request", value: "📄", color: "#EAF1FB" },
  ];
  const [got, setGot] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const reduce = useReducedMotion();
  const all = got.length === 3;
  const toggle = (id: string) => {
    setSent(false);
    setGot((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-3 gap-2">
        {pieces.map((p) => {
          const on = got.includes(p.id);
          return (
            <motion.button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(p.id)}
              whileTap={{ scale: 0.95 }}
              animate={{ boxShadow: on ? `0 0 16px ${p.color}66` : "0 0 0 transparent", backgroundColor: on ? `${p.color}18` : "rgba(0,0,0,0)" }}
              className={`relative rounded-lg border-2 py-3 text-center ${on ? "border-solid" : "border-dashed"} ${ring}`}
              style={{ borderColor: p.color }}
            >
              {on && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-2 text-xs">
                  ✅
                </motion.span>
              )}
              <div className="text-xs font-semibold leading-tight" style={{ color: p.color }}>{p.label}</div>
              <div className="text-[10px] text-[#7FB5FF]">{p.from}</div>
              <div className="mt-1 h-5 font-mono text-[10px] text-[#EAF1FB] sm:text-xs">
                <motion.span key={String(on)} className="inline-block" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  {on ? p.value : "?"}
                </motion.span>
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-xl bg-[#0B2447]/80 ring-1 ring-[#7FB5FF]/30">
        {/* afterimages while it flies out */}
        {sent && !reduce &&
          [1, 2, 3].map((k) => (
            <motion.div
              key={`ghost-${k}`}
              aria-hidden
              className="absolute left-1/2 h-8 w-24 -translate-x-1/2 rounded-lg border-2 border-[#FFB547]"
              initial={{ x: 0, opacity: 0.5 }}
              animate={{ x: 260, opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeIn", delay: k * 0.06 }}
            />
          ))}
        <motion.div
          layout
          className="relative flex items-center gap-1.5 rounded-lg border-2 px-2 py-2"
          style={{ borderColor: all ? "#FFB547" : "rgba(127,181,255,0.3)", boxShadow: all ? "0 0 18px rgba(255,181,71,.45)" : "none" }}
          animate={sent ? { x: 260, opacity: 0 } : { x: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeIn" }}
        >
          {pieces.map((p) => (
            <AnimatePresence key={p.id}>
              {got.includes(p.id) && (
                <motion.span initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#0B2447]" style={{ backgroundColor: p.color }}>
                  {p.id === "data" ? "📄" : p.label}
                </motion.span>
              )}
            </AnimatePresence>
          ))}
          {got.length === 0 && <span className="px-2 text-xs text-[#7FB5FF]">Empty packet</span>}
        </motion.div>
        <motion.span
          key={sent ? "arrived" : "idle"}
          className="absolute right-3 text-2xl"
          animate={sent && !reduce ? { scale: [1, 1, 1.4, 1], filter: ["brightness(1)", "brightness(1)", "brightness(1.8)", "brightness(1)"] } : {}}
          transition={{ duration: 1.4, times: [0, 0.75, 0.88, 1] }}
        >
          ☁️
        </motion.span>
      </div>
      <Caption>{sent ? "Out to the internet." : all ? "All the missing pieces. Wrapped up and ready." : "Tap each piece to put it in the packet."}</Caption>
      <button type="button" className={`${solid} mx-auto`} disabled={!all || sent} onClick={() => setSent(true)}>
        Send it out to the internet
      </button>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  AutoIpVisual,
  LeaseVisual,
  DoraVisual,
  BrowserVisual,
  NamesNumbersVisual,
  CacheVisual,
  AskDnsVisual,
  ChainVisual,
  PiecesVisual,
];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

// Stage height on phones, per beat (from sm up it is always 24rem).
const STAGE_H = [
  "h-[22rem]", "h-[22rem]", "h-[24rem]", "h-[22rem]", "h-[24rem]",
  "h-[22rem]", "h-[24rem]", "h-[22rem]", "h-[22rem]",
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

export default function Section08DhcpDns({ onComplete }: Props) {
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
      aria-label="Section 8: DHCP and DNS"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">DHCP and DNS</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
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

        <p key={step} className="min-h-[9.5rem] font-serif text-lg leading-relaxed sm:text-xl">
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
              On to private IPs and NAT
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
