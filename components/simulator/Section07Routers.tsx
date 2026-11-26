"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 7 – Routers: default gateway, routing tables, static/dynamic/default routes
 * Transcript range: 13:12 – 16:10
 *
 * Dependencies: react, framer-motion, tailwindcss
 * Usage:  <Section07Routers onComplete={() => goToSection(8)} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Transcript                                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "Okay, so now that we're all caught up, let's look at this scenario. What if PC1 wants to talk to a computer on a completely different network? Meaning PC1 wants to talk to a computer that has an IP address that has a different network portion than its own.",
  "This is where a second major device comes in, a router. A router is a device that can read IP addresses. So when PC1 wants to send a packet to a different network, it'll check the destination address and it'll realize, whoa, this isn't in the same network as me. I can't send this directly to that computer.",
  "So instead, it actually sends it to something called the default gateway. If you ever manually assign an IP address to your computer, you've probably seen this default gateway option. The default gateway often times is your router, your layer 3 device.",
  "And notice that switches connect devices within the same network and routers connect different networks together. Remember that.",
  "And now we can do something like this. We can have two completely different networks connected together with this router. Or we can have something like this. We can have one switch with different VLANs. But in order for these VLANs to talk to one another, since different VLANs are on different networks, they need a router as well. Inter VLAN routing. You might have heard that before.",
  "But how does a router work? How does a router know where to send traffic to? Well, it uses something called a routing table. It's like the layer 3 version of a MAC address table. The routing table tells the router which interface to send traffic out of depending on the destination of the packet.",
  "So looking at this example, by default, routers will put the network its own interfaces are in into the routing table. So without making any changes at all, the routing table would look like this.",
  "So if PC1 wants to send traffic to PC2, PC1 will recognize that PC2 is not in the same network and it will send that traffic first to its default gateway, which is the router. Then the router will look in its routing table to see if there's a match. It will see a match saying all traffic destined for this network send it out of this interface. This is perfect for this network.",
  "But what if we expand just a little bit? What if we add another router? Now we have the problem where not all networks are directly connected. If PC1 wants to send traffic to PC3, R1 won't know where to send that traffic because PC3's network is not directly connected to router 1, which means that PC3's network isn't in the routing table by default.",
  "This is where static and dynamic routes come in. These routes tell the router which path to take to get to the given destination. I mean pretty self-explanatory, but static routes are manually set. They are manually configured onto the router.",
  "Whereas dynamic routes like OSPF, EIGRP, BGP, you might have heard these before. This type of routing has the routers actually communicate with each other to share the routing information so that they can figure out like the best paths to different destinations.",
  "Also in dynamic routing, if one path breaks, the routers since they're communicating with one another, they'll be able to communicate to find the next best path. They'll be able to tell each other, \"Yo, don't use this route. It's broken. Use this route instead.\" But with static routes, if that route breaks, um, yo, GG.",
  "And there's also something called a default route. If your router finds no matches in its routing table instead of just straight up dropping that traffic, it'll forward it to a certain destination that might know where it is. Often times, like the default route leads to an ISP, like your internet service provider.",
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

type HopNode = { icon: string; label: string; sub?: string; active?: boolean; color?: string; badge?: string };

/** A row of nodes with a packet that slides to node index `pos` (null = hidden). */
function Hops({
  nodes,
  pos,
  dead,
  packet = "📦",
  route,
}: {
  nodes: HopNode[];
  pos: number | null;
  dead?: boolean;
  packet?: string;
  route?: [number, number];
}) {
  const n = nodes.length;
  const reduce = useReducedMotion();
  const spring = { type: "spring" as const, stiffness: 90, damping: 16 };
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-6 h-1 -translate-y-1/2 rounded bg-[#7FB5FF]/40" style={{ marginInline: `${50 / n}%` }} />
      {/* a hand-written (static) route between two nodes */}
      {route && (
        <motion.div
          aria-hidden
          className="absolute top-6 h-1 -translate-y-1/2 rounded"
          style={{
            left: `${((route[0] + 0.5) / n) * 100}%`,
            width: `${((route[1] - route[0]) / n) * 100}%`,
            backgroundImage: "repeating-linear-gradient(90deg, #FFB547 0 8px, transparent 8px 14px)",
            boxShadow: "0 0 10px rgba(255,181,71,.7)",
          }}
          animate={reduce ? undefined : { backgroundPositionX: ["0px", "14px"] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
      )}
      {/* the part of the path already travelled */}
      {pos !== null && (
        <motion.div
          aria-hidden
          className="absolute top-6 h-1 -translate-y-1/2 rounded"
          style={{ left: `${50 / n}%` }}
          initial={false}
          animate={{ width: `${(pos / n) * 100}%`, backgroundColor: dead ? "#FF8A7A" : "#FFB547" }}
          transition={spring}
        />
      )}
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {nodes.map((nd, i) => (
          <div key={i} className="relative flex flex-col items-center text-center">
            {nd.badge && (
              <span aria-hidden className="absolute -top-1 right-[14%] z-10 text-xs">
                {nd.badge}
              </span>
            )}
            <motion.div
              animate={{
                scale: nd.active ? 1.15 : 1,
                boxShadow: nd.active ? "0 0 18px rgba(255,181,71,.6)" : "0 0 0 transparent",
                borderColor: dead && pos === i ? "#FF8A7A" : nd.active ? "#FFB547" : nd.color ?? "rgba(0,0,0,0)",
              }}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl ${nd.active ? "bg-[#FFB547]/25" : "bg-[#0B2447]"}`}
            >
              {nd.icon}
              {pos === i && !reduce && (
                <motion.span
                  key={`arr-${i}-${pos}-${dead ? "d" : "ok"}`}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl border-2"
                  style={{ borderColor: dead ? "#FF8A7A" : "#FFB547" }}
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
          {/* a faint trail behind the packet */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-0 text-2xl"
              style={{ x: "-50%" }}
              initial={false}
              animate={{ left: `${((pos + 0.5) / n) * 100}%`, y: -2, opacity: 0.3 }}
              transition={{ ...spring, delay: 0.14 }}
            >
              {dead ? "" : packet}
            </motion.div>
          )}
          <motion.div
            className="pointer-events-none absolute top-0 text-2xl"
            style={{ x: "-50%" }}
            initial={false}
            animate={{ left: `${((pos + 0.5) / n) * 100}%`, y: -2, rotate: dead && !reduce ? [0, -14, 14, -8, 0] : 0 }}
            transition={{ ...spring, rotate: { duration: 0.5, delay: 0.3 } }}
          >
            {dead ? "✖️" : packet}
          </motion.div>
        </>
      )}
    </div>
  );
}

type Row = { net: string; out: string; note?: string };

function RTable({
  title = "Routing table",
  head = ["Network", "Out of"],
  rows,
  hot,
  scan = false,
}: {
  title?: string;
  head?: [string, string];
  rows: Row[];
  hot?: number | null;
  scan?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40">
      <div className="bg-[#7FB5FF] px-2 py-1 text-center text-xs font-bold text-[#0B2447]">{title}</div>
      <div className="grid grid-cols-2 bg-[#0B2447] px-3 py-1 text-xs text-[#7FB5FF]">
        <span>{head[0]}</span>
        <span>{head[1]}</span>
      </div>
      <div className="min-h-[3.4rem] bg-[#0B2447]/60">
        <AnimatePresence initial={false}>
          {rows.map((r, i) => (
            <motion.div
              key={r.net}
              initial={{ opacity: 0, x: 14, backgroundColor: "#FFB547" }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundColor:
                  hot === i
                    ? "rgba(95,212,196,0.35)"
                    : scan
                      ? ["rgba(255,181,71,0)", "rgba(255,181,71,0.35)", "rgba(255,181,71,0)"]
                      : "rgba(255,181,71,0)",
              }}
              transition={scan && hot !== i ? { duration: 0.5, delay: i * 0.45 } : { duration: 0.8 }}
              className="grid grid-cols-2 gap-1 px-3 py-1.5 font-mono text-[11px] text-[#EAF1FB] sm:text-xs"
            >
              <span>{r.net}</span>
              <span className="min-w-0">
                {r.out}
                {r.note && <span className="ml-1 font-sans text-[10px] text-[#FFB547]">{r.note}</span>}
                {hot === i && <span className="ml-1 text-[#5FD4C4]">✓</span>}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {rows.length === 0 && <p className="px-3 py-2 text-center text-xs text-[#7FB5FF]">Empty</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 – a completely different network                                  */
/* ------------------------------------------------------------------ */

function DifferentNetworkVisual() {
  const dests = ["10.0.0.5", "172.16.8.20", "203.0.113.9"];
  const [d, setD] = useState<string | null>(null);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <div className="rounded-xl border-2 border-[#FFB547] bg-[#FFB547]/10 p-3 text-center">
          <p className="text-xs text-[#FFB547]">PC1's network</p>
          <p className="my-1 text-3xl">💻</p>
          <p className="font-mono text-xs text-[#EAF1FB]"><span className="text-[#FFB547]">192.168.1</span>.100</p>
        </div>
        <div className="relative flex h-12 w-8 items-center justify-center">
          <AnimatePresence mode="wait">
            {d ? (
              <motion.span key="wall" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-2xl">
                🚧
              </motion.span>
            ) : (
              <motion.span
                key="q"
                className="text-2xl text-[#7FB5FF]"
                animate={reduce ? undefined : { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                exit={{ scale: 0 }}
              >
                ❓
              </motion.span>
            )}
          </AnimatePresence>
          {d && !reduce && (
            <motion.span
              key={d}
              aria-hidden
              className="absolute -top-1 left-0 text-base"
              animate={{ x: [-18, 2, -18] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              📦
            </motion.span>
          )}
        </div>
        <div className="space-y-1.5 rounded-xl border-2 border-dashed border-[#7FB5FF]/50 p-2 text-center">
          <p className="text-xs text-[#7FB5FF]">A completely different network</p>
          {dests.map((x) => (
            <button key={x} type="button" aria-pressed={d === x} onClick={() => setD(x)} className={`block w-full rounded-md border px-1.5 py-1 font-mono text-[10px] sm:text-xs ${ring} ${d === x ? "border-[#5FD4C4] bg-[#5FD4C4]/15 text-[#EAF1FB]" : "border-[#7FB5FF]/30 text-[#7FB5FF]"}`}>
              💻 {x}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={d ?? "none"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg bg-[#0B2447] p-3 text-center text-sm text-[#EAF1FB] ring-1 ring-[#7FB5FF]/30">
          {d ? (
            <>
              Network portion: <span className="font-mono text-[#FFB547]">192.168.1</span> vs{" "}
              <span className="font-mono text-[#5FD4C4]">{d.split(".").slice(0, 3).join(".")}</span>
              <p className="mt-1 text-xs text-[#7FB5FF]">A different network portion than its own.</p>
            </>
          ) : (
            "Tap a computer on the other network."
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – a router reads IP addresses                                     */
/* ------------------------------------------------------------------ */

function RouterReadsVisual() {
  const [sel, setSel] = useState<"switch" | "router" | null>(null);
  const [thought, setThought] = useState(false);
  const reduce = useReducedMotion();
  const seg = (label: string, color: string, on: boolean) => (
    <motion.span
      className="rounded px-2 py-1"
      style={{ backgroundColor: color }}
      animate={{ opacity: sel === null ? 0.8 : on ? 1 : 0.25, scale: on ? 1.12 : 1, boxShadow: on ? `0 0 14px ${color}` : "0 0 0 transparent" }}
    >
      {label}
    </motion.span>
  );
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-2 gap-3">
        {([
          { id: "switch", icon: "🔀", name: "Switch", reads: "MAC addresses", layer: "Layer 2" },
          { id: "router", icon: "📟", name: "Router", reads: "IP addresses", layer: "Layer 3" },
        ] as const).map((c) => (
          <motion.button
            key={c.id}
            type="button"
            aria-pressed={sel === c.id}
            onClick={() => setSel(c.id)}
            whileTap={{ scale: 0.97 }}
            animate={{ borderColor: sel === c.id ? "#FFB547" : "rgba(127,181,255,0.35)", boxShadow: sel === c.id ? "0 0 18px rgba(255,181,71,.35)" : "0 0 0 transparent" }}
            className={`rounded-xl border-2 bg-[#0B2447]/60 p-3 text-center ${ring}`}
          >
            <div className="text-3xl">{c.icon}</div>
            <div className="text-sm font-semibold text-[#EAF1FB]">{c.name}</div>
            <AnimatePresence>
              {sel === c.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-xs text-[#FFB547]">
                  Reads {c.reads} ({c.layer})
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      {/* what each device looks at in a packet */}
      <div className="relative mx-auto flex items-center gap-1 overflow-hidden rounded-lg bg-[#0B2447] p-1.5 font-mono text-[10px] font-bold text-[#0B2447]" aria-hidden>
        {seg("MAC", "#5FD4C4", sel === "switch")}
        {seg("IP", "#FFB547", sel === "router")}
        {seg("Data", "#EAF1FB", false)}
        {sel && !reduce && (
          <motion.span
            key={sel}
            className="absolute inset-y-0 w-4 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            initial={{ left: "-10%" }}
            animate={{ left: "110%" }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
          />
        )}
      </div>
      <div className="relative flex min-h-[5.5rem] items-center justify-center rounded-xl bg-[#0B2447] p-3 ring-1 ring-[#7FB5FF]/30">
        <span className="mr-3 text-3xl">💻</span>
        <div className="text-center">
          <p className="font-mono text-xs text-[#EAF1FB]">PC1 packet to 10.0.0.5</p>
          <AnimatePresence>
            {thought && (
              <motion.p initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="mt-1 text-[13px] font-semibold leading-snug text-[#FFB547] sm:text-sm">
                "Whoa, this isn't in the same network as me. I can't send this directly to that computer."
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <button type="button" className={`${solid} mx-auto`} onClick={() => setThought((t) => !t)}>
        {thought ? "Check again" : "PC1 checks the destination address"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – default gateway                                                 */
/* ------------------------------------------------------------------ */

function GatewayVisual() {
  const [hot, setHot] = useState<string | null>("gw");
  const [pos, setPos] = useState<number | null>(null);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const fields = [
    { id: "ip", label: "IP address", value: "192.168.1.100" },
    { id: "mask", label: "Subnet mask", value: "255.255.255.0" },
    { id: "gw", label: "Default gateway", value: "192.168.1.1" },
  ];
  const send = () => {
    clear();
    setPos(0);
    setHot("gw");
    later(() => setPos(1), 60);
  };
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="mx-auto w-full max-w-xs space-y-1.5 rounded-lg bg-[#0B2447] p-3 ring-1 ring-[#7FB5FF]/30">
        <p className="text-xs font-semibold text-[#7FB5FF]">Manual IP settings</p>
        {fields.map((f) => (
          <motion.button
            key={f.id}
            type="button"
            onClick={() => setHot(f.id)}
            animate={{ boxShadow: hot === f.id && !reduce && f.id === "gw" ? ["0 0 0 rgba(255,181,71,0)", "0 0 12px rgba(255,181,71,.6)", "0 0 0 rgba(255,181,71,0)"] : "0 0 0 transparent" }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs ${ring} ${hot === f.id ? "bg-[#FFB547]/20 ring-1 ring-[#FFB547]" : "bg-[#123A6B]/60"}`}
          >
            <span className="text-[#EAF1FB]">{f.label}</span>
            <span className="font-mono text-[#FFB547]">{f.value}</span>
          </motion.button>
        ))}
      </div>
      <Hops
        nodes={[
          { icon: "💻", label: "PC1", sub: "192.168.1.100" },
          { icon: "📟", label: "Default gateway", sub: "Your router", active: pos === 1, badge: "🚪" },
        ]}
        pos={pos}
      />
      <Caption>{pos === 1 ? "Different network? It goes to the default gateway first." : "Tap a setting, or send to another network."}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={send}>
        Send to another network
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 – switches vs routers                                             */
/* ------------------------------------------------------------------ */

function Pulse({ dir = 1, delay = 0, vertical = false }: { dir?: 1 | -1; delay?: number; vertical?: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.span
      aria-hidden
      className="absolute h-2 w-2 rounded-full bg-[#FFE2A8]"
      style={{ boxShadow: "0 0 8px 2px rgba(255,181,71,.8)", ...(vertical ? { left: "50%", marginLeft: -4 } : { top: "50%", marginTop: -4 }) }}
      animate={vertical ? { top: dir === 1 ? ["0%", "100%"] : ["100%", "0%"] } : { left: dir === 1 ? ["0%", "100%"] : ["100%", "0%"] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay }}
    />
  );
}

function SwitchVsRouterVisual() {
  const [tab, setTab] = useState<"switch" | "router">("switch");
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex justify-center gap-2">
        {(["switch", "router"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`rounded-full px-5 py-1.5 text-sm ${ring} ${tab === t ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {t === "switch" ? "Switch" : "Router"}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
          {tab === "switch" ? (
            <div className="mx-auto w-56 rounded-xl border-2 border-[#FFB547] bg-[#FFB547]/10 p-3 text-center">
              <div className="grid grid-cols-3 text-2xl">
                <span>💻</span>
                <span>💻</span>
                <span>💻</span>
              </div>
              <div className="relative mx-auto grid h-6 grid-cols-3" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded bg-[#7FB5FF]/50" />
                    {i === 0 && <Pulse vertical dir={1} />}
                    {i === 2 && <Pulse vertical dir={-1} delay={0.7} />}
                  </div>
                ))}
              </div>
              <div className="mb-2 rounded bg-[#7FB5FF] py-1 text-xs font-semibold text-[#0B2447]">Switch</div>
              <p className="text-xs text-[#EAF1FB]">One network</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <div className="rounded-xl border-2 border-[#FFB547] bg-[#FFB547]/10 p-2 text-center text-xl">💻<p className="text-[10px] text-[#EAF1FB]">Network 1</p></div>
              <div className="relative h-6 w-6 sm:w-10" aria-hidden>
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#7FB5FF]/50" />
                <Pulse />
              </div>
              <motion.div
                className="rounded bg-[#5FD4C4] px-3 py-2 text-xs font-semibold text-[#0B2447]"
                animate={{ boxShadow: ["0 0 0 rgba(95,212,196,0)", "0 0 16px rgba(95,212,196,.7)", "0 0 0 rgba(95,212,196,0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Router
              </motion.div>
              <div className="relative h-6 w-6 sm:w-10" aria-hidden>
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#7FB5FF]/50" />
                <Pulse dir={-1} delay={0.5} />
              </div>
              <div className="rounded-xl border-2 border-[#5FD4C4] bg-[#5FD4C4]/10 p-2 text-center text-xl">💻<p className="text-[10px] text-[#EAF1FB]">Network 2</p></div>
            </div>
          )}
          <p className="text-center text-sm font-semibold text-[#EAF1FB]">
            {tab === "switch" ? "Switches connect devices within the same network." : "Routers connect different networks together."}
          </p>
        </motion.div>
      </AnimatePresence>
      <p className="text-center text-xs text-[#7FB5FF]">Remember that.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – two networks, or VLANs, joined by a router                      */
/* ------------------------------------------------------------------ */

function TwoScenesVisual() {
  const [scene, setScene] = useState<"nets" | "vlans">("nets");
  const [pos, setPos] = useState<number | null>(null);
  const { later, clear } = useTimers();
  const send = () => {
    clear();
    setPos(0);
    later(() => setPos(1), 80);
    later(() => setPos(2), 1300);
  };
  const nodes: HopNode[] =
    scene === "nets"
      ? [{ icon: "💻", label: "Network 1", color: "#FFB547" }, { icon: "📟", label: "Router", active: pos === 1 }, { icon: "💻", label: "Network 2", color: "#5FD4C4" }]
      : [{ icon: "💻", label: "HR VLAN", color: "#FFB547" }, { icon: "📟", label: "Router", active: pos === 1 }, { icon: "💻", label: "IT VLAN", color: "#5FD4C4" }];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {([["nets", "Two networks"], ["vlans", "One switch, different VLANs"]] as const).map(([id, name]) => (
          <button key={id} type="button" aria-pressed={scene === id} onClick={() => { setScene(id); setPos(null); clear(); }} className={`rounded-full px-4 py-1.5 text-sm ${ring} ${scene === id ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {name}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {scene === "vlans" && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto w-56 rounded bg-[#7FB5FF] py-1 text-center text-xs font-semibold text-[#0B2447]"
          >
            One switch
          </motion.div>
        )}
      </AnimatePresence>
      <Hops nodes={nodes} pos={pos} />
      <Caption>
        {scene === "vlans" ? "Different VLANs are on different networks, so they need a router as well. Inter VLAN routing." : "Two completely different networks, connected together with this router."}
      </Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={send}>
        Send a packet across
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – routing table vs MAC address table                              */
/* ------------------------------------------------------------------ */

function TablesCompareVisual() {
  const [hot, setHot] = useState<number | null>(null);
  const mac = [
    { a: "0A:AA", b: "Port 1" },
    { a: "0B:BB", b: "Port 2" },
  ];
  const rt = [
    { a: "192.168.1.0/24", b: "Interface 1" },
    { a: "192.168.2.0/24", b: "Interface 2" },
  ];
  const tbl = (title: string, layer: string, rows: { a: string; b: string }[]) => (
    <div className="flex-1 overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40">
      <div className="bg-[#7FB5FF] px-2 py-1 text-center text-xs font-bold text-[#0B2447]">{title}</div>
      <p className="bg-[#0B2447] py-0.5 text-center text-[10px] text-[#7FB5FF]">{layer}</p>
      {rows.map((r, i) => (
        <motion.button
          key={i}
          type="button"
          onClick={() => setHot(hot === i ? null : i)}
          onMouseEnter={() => setHot(i)}
          animate={{ scale: hot === i ? 1.03 : 1 }}
          className={`flex w-full justify-between gap-2 px-2 py-2 font-mono text-[11px] ${ring} ${hot === i ? "bg-[#FFB547] text-[#0B2447]" : "text-[#EAF1FB]"}`}
        >
          <span>{r.a}</span>
          <span>{r.b}</span>
        </motion.button>
      ))}
    </div>
  );
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:gap-3">
        {tbl("MAC address table", "Layer 2: MAC → port", mac)}
        <motion.div
          aria-hidden
          className="flex items-center justify-center text-lg text-[#FFB547]"
          animate={{ opacity: hot === null ? 0.3 : 1, scale: hot === null ? 1 : [1, 1.3, 1] }}
          transition={{ duration: 0.4 }}
        >
          <span className="sm:hidden">⇅</span>
          <span className="hidden sm:inline">⇄</span>
        </motion.div>
        {tbl("Routing table", "Layer 3: network → interface", rt)}
      </div>
      <Caption>The routing table is like the layer 3 version of a MAC address table. It tells the router which interface to send traffic out of.</Caption>
      <p className="text-center text-xs text-[#7FB5FF]">Tap a row to match the two tables up</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 – by default, directly connected networks                         */
/* ------------------------------------------------------------------ */

function DefaultTableVisual() {
  const [on, setOn] = useState(false);
  const reduce = useReducedMotion();
  const rows: Row[] = on
    ? [
        { net: "192.168.1.0/24", out: "Interface 1" },
        { net: "192.168.2.0/24", out: "Interface 2" },
      ]
    : [];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div aria-hidden className="absolute left-[16%] right-[16%] top-[38%] h-0.5 overflow-hidden rounded bg-[#7FB5FF]/30">
          <motion.div className="h-full bg-[#5FD4C4]" animate={{ width: on ? "100%" : "0%" }} transition={{ duration: 0.6 }} />
        </div>
        {on && !reduce && (
          <>
            <motion.span aria-hidden className="absolute top-[38%] -mt-1 h-2 w-2 rounded-full bg-[#FFE2A8]" style={{ boxShadow: "0 0 8px 2px rgba(255,181,71,.8)" }} animate={{ left: ["16%", "42%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
            <motion.span aria-hidden className="absolute top-[38%] -mt-1 h-2 w-2 rounded-full bg-[#FFE2A8]" style={{ boxShadow: "0 0 8px 2px rgba(255,181,71,.8)" }} animate={{ left: ["84%", "58%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.6 }} />
          </>
        )}
        <div className="relative z-10 rounded-xl border-2 border-[#FFB547] bg-[#FFB547]/10 px-2 py-2 text-center text-[10px] text-[#EAF1FB] sm:px-3 sm:text-xs">💻<br />192.168.1.0/24</div>
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            className="rounded bg-[#5FD4C4] px-3 py-2 text-sm font-semibold text-[#0B2447]"
            animate={{ boxShadow: on ? "0 0 18px rgba(95,212,196,.7)" : "0 0 0 transparent", opacity: on ? 1 : 0.55 }}
          >
            Router
          </motion.div>
          <div className="mt-1 flex w-full justify-between gap-3 text-[10px] text-[#7FB5FF]">
            <span>Int 1</span>
            <span>Int 2</span>
          </div>
        </div>
        <div className="relative z-10 rounded-xl border-2 border-[#5FD4C4] bg-[#5FD4C4]/10 px-2 py-2 text-center text-[10px] text-[#EAF1FB] sm:px-3 sm:text-xs">💻<br />192.168.2.0/24</div>
      </div>
      <RTable rows={rows} />
      <Caption>{on ? "Without making any changes at all: the networks its own interfaces are in." : "A brand new router, no changes made."}</Caption>
      <button type="button" className={`${on ? chip : solid} mx-auto`} onClick={() => setOn((o) => !o)}>
        {on ? "Power it off" : "Power on the router"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8 – a lookup that matches                                           */
/* ------------------------------------------------------------------ */

function LookupVisual() {
  const [stage, setStage] = useState(0);
  const texts = [
    "PC1 wants to send traffic to PC2.",
    "PC2 is not in the same network, so PC1 sends the traffic first to its default gateway, which is the router.",
    "The router looks in its routing table to see if there's a match.",
    "A match: all traffic destined for this network, send it out of this interface. Perfect for this network.",
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <Hops
        nodes={[{ icon: "💻", label: "PC1", sub: "192.168.1.100" }, { icon: "📟", label: "Router", active: stage === 1 || stage === 2 }, { icon: "💻", label: "PC2", sub: "192.168.2.10", active: stage === 3 }]}
        pos={stage === 0 ? 0 : stage <= 2 ? 1 : 2}
      />
      <RTable
        key={`t-${stage === 2}`}
        rows={[{ net: "192.168.1.0/24", out: "Interface 1" }, { net: "192.168.2.0/24", out: "Interface 2" }]}
        hot={stage >= 3 ? 1 : null}
        scan={stage === 2}
      />
      <Caption>{texts[stage]}</Caption>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((k) => (
            <motion.span key={k} className="h-2 w-2 rounded-full" animate={{ backgroundColor: k <= stage ? "#FFB547" : "rgba(127,181,255,.35)", scale: k === stage ? 1.4 : 1 }} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className={solid} disabled={stage >= 3} onClick={() => setStage((s) => s + 1)}>
            Next step
          </button>
          <button type="button" className={chip} disabled={stage === 0} onClick={() => setStage(0)}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9 & 10 – a second router: no route, then a static route              */
/* ------------------------------------------------------------------ */

function RouteSim({ allowStatic }: { allowStatic: boolean }) {
  const [pos, setPos] = useState<number | null>(null);
  const [dead, setDead] = useState(false);
  const [route, setRoute] = useState(false);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const rows: Row[] = [
    { net: "192.168.1.0/24", out: "Interface 1" },
    { net: "192.168.2.0/24", out: "Interface 2" },
    ...(route ? [{ net: "192.168.3.0/24", out: "Interface 2", note: "static, via R2" }] : []),
  ];
  const send = () => {
    clear();
    setDead(false);
    setPos(0);
    later(() => setPos(1), 80);
    if (route) {
      later(() => setPos(2), 1300);
      later(() => setPos(3), 2500);
    } else {
      later(() => setDead(true), 1500);
    }
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="relative">
        <Hops
          nodes={[{ icon: "💻", label: "PC1" }, { icon: "📟", label: "R1", active: pos === 1 }, { icon: "📟", label: "R2", active: pos === 2 }, { icon: "💻", label: "PC3", sub: "192.168.3.10", active: pos === 3 }]}
          pos={pos}
          dead={dead}
          route={route ? [1, 2] : undefined}
        />
        {dead && !reduce && (
          <motion.span
            aria-hidden
            className="absolute left-[37%] -top-3 text-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
            transition={{ y: { duration: 1, repeat: Infinity } }}
          >
            ❓
          </motion.span>
        )}
      </div>
      <RTable title="R1's routing table" rows={rows} />
      <Caption>
        {pos === null
          ? "PC1 wants to send traffic to PC3."
          : dead
            ? "R1 won't know where to send that traffic: PC3's network isn't directly connected to router 1, so it isn't in the table by default."
            : pos === 3
              ? "Delivered. The route tells the router which path to take."
              : "On its way."}
      </Caption>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={solid} onClick={send}>
          Send to PC3
        </button>
        {allowStatic && (
          <button type="button" className={chip} disabled={route} onClick={() => { setRoute(true); setPos(null); setDead(false); }}>
            Add a static route by hand
          </button>
        )}
        {allowStatic && route && (
          <button type="button" className={chip} onClick={() => { setRoute(false); setPos(null); setDead(false); }}>
            Remove it
          </button>
        )}
      </div>
    </div>
  );
}

const NoRouteVisual = () => <RouteSim allowStatic={false} />;
const StaticVisual = () => <RouteSim allowStatic />;

/* ------------------------------------------------------------------ */
/* 11 – dynamic routing                                                */
/* ------------------------------------------------------------------ */

function DynamicVisual() {
  const protos = ["OSPF", "EIGRP", "BGP"];
  const [proto, setProto] = useState("OSPF");
  const [talk, setTalk] = useState(0);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const learned = talk >= 2;
  const go = () => {
    clear();
    setTalk(1);
    later(() => setTalk(2), 1500);
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex justify-center gap-2">
        {protos.map((p) => (
          <button key={p} type="button" aria-pressed={proto === p} onClick={() => { setProto(p); setTalk(0); clear(); }} className={`rounded-full px-4 py-1 text-sm ${ring} ${proto === p ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {p}
          </button>
        ))}
      </div>
      <div className="relative flex items-center justify-between px-4">
        <motion.div
          className="text-center"
          animate={{ boxShadow: talk >= 1 ? "0 0 16px rgba(95,212,196,.6)" : "0 0 0 transparent" }}
        >
          <div className="rounded bg-[#5FD4C4] px-4 py-2 text-sm font-semibold text-[#0B2447]">R1</div>
        </motion.div>
        <div className="relative mx-3 h-12 flex-1">
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded bg-[#7FB5FF]/50" />
          {talk >= 1 && !reduce &&
            [0, 1, 2].map((k) => (
              <Fragment key={k}>
                <motion.span
                  aria-hidden
                  className="absolute top-[30%] text-sm"
                  animate={{ left: ["0%", "85%"], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: k * 0.5, ease: "linear" }}
                >
                  💬
                </motion.span>
                <motion.span
                  aria-hidden
                  className="absolute top-[55%] text-sm"
                  animate={{ left: ["85%", "0%"], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: k * 0.5 + 0.25, ease: "linear" }}
                >
                  📋
                </motion.span>
              </Fragment>
            ))}
        </div>
        <motion.div
          className="text-center"
          animate={{ boxShadow: talk >= 1 ? "0 0 16px rgba(95,212,196,.6)" : "0 0 0 transparent" }}
        >
          <div className="rounded bg-[#5FD4C4] px-4 py-2 text-sm font-semibold text-[#0B2447]">R2</div>
        </motion.div>
      </div>
      {/* what they say to each other */}
      <div className="flex min-h-[1.6rem] items-start justify-between gap-2 px-1">
        <AnimatePresence>
          {talk >= 1 && (
            <>
              <motion.span key="b1" initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="rounded-lg bg-[#EAF1FB] px-2 py-0.5 text-[10px] font-semibold text-[#0B2447]">
                I know 192.168.3.0/24
              </motion.span>
              <motion.span key="b2" initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.6 }} className="rounded-lg bg-[#FFB547] px-2 py-0.5 text-[10px] font-semibold text-[#0B2447]">
                Here are my networks
              </motion.span>
            </>
          )}
        </AnimatePresence>
      </div>
      <RTable title="R1's routing table" rows={[{ net: "192.168.1.0/24", out: "Interface 1" }, { net: "192.168.2.0/24", out: "Interface 2" }, ...(learned ? [{ net: "192.168.3.0/24", out: "Interface 2", note: `learned (${proto})` }] : [])]} />
      <Caption>{learned ? "The routers shared the routing information and figured out the path." : `Routers using ${proto} communicate with each other.`}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={go} disabled={talk === 1}>
        Let the routers talk
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12 – a path breaks: dynamic vs static                               */
/* ------------------------------------------------------------------ */

function RerouteVisual() {
  const [dynamic, setDynamic] = useState(true);
  const [broken, setBroken] = useState(false);
  const reduce = useReducedMotion();
  const R1 = { x: 40, y: 50 };
  const R2 = { x: 260, y: 50 };
  const R3 = { x: 150, y: 128 };
  const onBackup = broken && dynamic;
  const stuck = broken && !dynamic;
  const path = onBackup ? { xs: [R1.x, R3.x, R2.x], ys: [R1.y, R3.y, R2.y] } : { xs: [R1.x, R2.x], ys: [R1.y, R2.y] };
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex justify-center gap-2">
        {[true, false].map((d) => (
          <button key={String(d)} type="button" aria-pressed={dynamic === d} onClick={() => { setDynamic(d); setBroken(false); }} className={`rounded-full px-4 py-1 text-sm ${ring} ${dynamic === d ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {d ? "Dynamic routing" : "Static route"}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 300 160" className="min-h-0 w-full flex-1" role="img" aria-label="Routers R1, R2 and R3 with a primary and a backup path">
        {/* glow under the live path */}
        {!broken && <line x1={R1.x} y1={R1.y} x2={R2.x} y2={R2.y} stroke="#5FD4C4" strokeOpacity={0.2} strokeWidth="10" strokeLinecap="round" />}
        {onBackup && (
          <>
            <line x1={R1.x} y1={R1.y} x2={R3.x} y2={R3.y} stroke="#5FD4C4" strokeOpacity={0.2} strokeWidth="10" strokeLinecap="round" />
            <line x1={R3.x} y1={R3.y} x2={R2.x} y2={R2.y} stroke="#5FD4C4" strokeOpacity={0.2} strokeWidth="10" strokeLinecap="round" />
          </>
        )}
        <line x1={R1.x} y1={R1.y} x2={R2.x} y2={R2.y} stroke={broken ? "#FF8A7A" : "#5FD4C4"} strokeWidth="3" strokeDasharray={broken ? "6 5" : undefined} />
        <line x1={R1.x} y1={R1.y} x2={R3.x} y2={R3.y} stroke={onBackup ? "#5FD4C4" : "#7FB5FF"} strokeOpacity={onBackup ? 1 : 0.4} strokeWidth="3" />
        <line x1={R3.x} y1={R3.y} x2={R2.x} y2={R2.y} stroke={onBackup ? "#5FD4C4" : "#7FB5FF"} strokeOpacity={onBackup ? 1 : 0.4} strokeWidth="3" />
        {broken && (
          <motion.text
            x={150}
            y={46}
            textAnchor="middle"
            fontSize="16"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            ✖️
          </motion.text>
        )}
        {[["R1", R1], ["R2", R2], ["R3", R3]].map(([n, p]) => {
          const pt = p as { x: number; y: number };
          const lit = onBackup && n === "R3";
          return (
            <g key={n as string}>
              <rect x={pt.x - 18} y={pt.y - 11} width="36" height="22" rx="4" fill={lit ? "#5FD4C4" : "#7FB5FF"} style={{ filter: lit ? "drop-shadow(0 0 6px #5FD4C4)" : "none" }} />
              <text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0B2447">{n as string}</text>
            </g>
          );
        })}
        {/* the routers telling each other about the break */}
        {onBackup && !reduce && (
          <motion.text
            key="gossip"
            fontSize="12"
            initial={{ x: R2.x, y: R2.y - 14, opacity: 0 }}
            animate={{ x: [R2.x, R3.x, R1.x], y: [R2.y - 14, R3.y - 14, R1.y - 14], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6, ease: "linear" }}
          >
            💬
          </motion.text>
        )}
        {!stuck && (
          <>
            <motion.circle
              key={`g-${broken}-${dynamic}`}
              r="9"
              fill="#FFB547"
              fillOpacity={0.3}
              initial={{ cx: path.xs[0], cy: path.ys[0] }}
              animate={{ cx: path.xs, cy: path.ys }}
              transition={{ duration: onBackup ? 3 : 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle
              key={`${broken}-${dynamic}`}
              r="5"
              fill="#FFB547"
              initial={{ cx: path.xs[0], cy: path.ys[0] }}
              animate={{ cx: path.xs, cy: path.ys }}
              transition={{ duration: onBackup ? 3 : 2, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
        {stuck && (
          <>
            <motion.circle
              cx={R1.x + 24}
              cy={R1.y}
              r="5"
              fill="#FF8A7A"
              animate={reduce ? undefined : { opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
            <text x={R1.x + 40} y={R1.y - 14} fontSize="12" fill="#FF8A7A">Traffic stops here</text>
          </>
        )}
      </svg>
      <Caption>
        {!broken
          ? "Traffic flows along the best path."
          : dynamic
            ? "\"Yo, don't use this route. It's broken. Use this route instead.\" The routers told each other."
            : "The static route broke. Yo, GG."}
      </Caption>
      <button type="button" className={`${broken ? chip : solid} mx-auto`} onClick={() => setBroken((b) => !b)}>
        {broken ? "Fix the path" : "Break the path"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 13 – default route                                                  */
/* ------------------------------------------------------------------ */

function DefaultRouteVisual() {
  const [on, setOn] = useState(false);
  const [pos, setPos] = useState<number | null>(null);
  const [dead, setDead] = useState(false);
  const { later, clear } = useTimers();
  const rows: Row[] = [
    { net: "192.168.1.0/24", out: "Interface 1" },
    { net: "192.168.2.0/24", out: "Interface 2" },
    ...(on ? [{ net: "0.0.0.0/0", out: "Interface 3", note: "default → ISP" }] : []),
  ];
  const send = () => {
    clear();
    setDead(false);
    setPos(0);
    later(() => setPos(1), 80);
    if (on) later(() => setPos(2), 1300);
    else later(() => setDead(true), 1500);
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <Hops
        nodes={[{ icon: "💻", label: "PC1", sub: "to 8.8.8.8" }, { icon: "📟", label: "Router", active: pos === 1 }, { icon: "☁️", label: "ISP", sub: "Internet service provider", active: pos === 2 }]}
        pos={pos}
        dead={dead}
        route={on ? [1, 2] : undefined}
      />
      <RTable rows={rows} hot={on && pos === 2 ? 2 : null} />
      <Caption>
        {pos === null
          ? "8.8.8.8 isn't in the routing table."
          : dead
            ? "No match: dropped."
            : pos === 2
              ? "No match, so instead of dropping the traffic, the router forwarded it to a destination that might know where it is."
              : "On its way."}
      </Caption>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" role="switch" aria-checked={on} className={chip} onClick={() => { setOn((o) => !o); setPos(null); setDead(false); }}>
          Default route: {on ? "on" : "off"}
        </button>
        <button type="button" className={solid} onClick={send}>
          Send the traffic
        </button>
      </div>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  DifferentNetworkVisual,
  RouterReadsVisual,
  GatewayVisual,
  SwitchVsRouterVisual,
  TwoScenesVisual,
  TablesCompareVisual,
  DefaultTableVisual,
  LookupVisual,
  NoRouteVisual,
  StaticVisual,
  DynamicVisual,
  RerouteVisual,
  DefaultRouteVisual,
];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

// Stage height on phones, per beat (from sm up it is always 24rem).
const STAGE_H = [
  "h-[22rem]", "h-[24rem]", "h-[24rem]", "h-[22rem]",
  "h-[24rem]", "h-[26rem]", "h-[24rem]", "h-[24rem]",
  "h-[28rem]", "h-[28rem]", "h-[26rem]", "h-[22rem]",
  "h-[26rem]",
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

export default function Section07Routers({ onComplete }: Props) {
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
      aria-label="Section 7: Routers and routing"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Layer 3: Routers and routing</h2>
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

        <p key={step} className="min-h-[11rem] font-serif text-lg leading-relaxed sm:text-xl">
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
              On to DHCP and DNS
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
