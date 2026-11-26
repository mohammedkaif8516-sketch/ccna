"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 10 – Layer 4: Ports, segments, TCP and UDP
 * Transcript range: 20:01 – 21:26
 *
 * Dependencies: react, framer-motion, tailwindcss
 * Usage:  <Section10TransportLayer onComplete={() => goToSection(11)} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Transcript                                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "But what is a port? And that's when we get into the final layer, layer four. So layer 3 gets your traffic across the world and lands right in front of the front door of that computer that you're trying to reach.",
  "But there's a small problem. That computer is probably running a bunch of different applications like Discord, Spotify, Google Chrome. Once the data reaches that IP address, how does it know which application to open or which application requires that?",
  "And this is where ports come in. If we use the same analogy that we use for IP addresses, if an IP address is your house number, the port is like the person living in that house like who is this for?",
  "And every service or application uses a specific port. Some very common ones are port 80 for HTTP or port 443 for HTTPS or port 53 for DNS. There's a bunch of different ports.",
  "And now that we know which port our data is going to, layer 4 wraps our packet into something called a segment. And the segment adds among other things a source port and a destination port.",
  "And to actually send these segments between ports, layer 4 gives us two main methods, TCP and UDP.",
  "TCP is reliable and it will resend traffic if the traffic gets lost.",
  "This is very useful for downloading things like GTA 6. Can't miss a single byte out of that 500 million gigabytes that game is, or else you won't be able to run it, or else the game will be corrupt.",
  "But UDP on the other hand is not reliable, but it's much faster. So think of things like Discord calls. Like it's not too big of a deal if the quality drops for a second as long as you're getting it in real time. So where where speed matters.",
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

type HopNode = { icon: string; label: string; sub?: string; active?: boolean };

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

const APPS = [
  { name: "Discord", icon: "💬" },
  { name: "Spotify", icon: "🎵" },
  { name: "Google Chrome", icon: "🌐" },
];

/* ------------------------------------------------------------------ */
/* 1 – layer 3 lands at the front door                                 */
/* ------------------------------------------------------------------ */

function FrontDoorVisual() {
  const [sent, setSent] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-semibold text-[#0B2447]">
        {[
          { n: "Layer 1", c: "#EAF1FB" },
          { n: "Layer 2", c: "#5FD4C4" },
          { n: "Layer 3", c: "#7FB5FF" },
          { n: "Layer 4", c: "#FFB547" },
        ].map((l, i) => (
          <motion.div
            key={l.n}
            animate={{
              opacity: i === 3 ? (sent ? 1 : 0.35) : 1,
              scale: i === 3 && sent ? 1.08 : 1,
              boxShadow: i === 3 && sent && !reduce ? ["0 0 0 rgba(255,181,71,0)", "0 0 20px rgba(255,181,71,.9)", "0 0 0 rgba(255,181,71,0)"] : "0 0 0 transparent",
            }}
            transition={{ boxShadow: { duration: 1.4, repeat: Infinity }, delay: i === 3 ? 0.6 : 0 }}
            className="rounded-md py-2"
            style={{ backgroundColor: l.c }}
          >
            {l.n}
          </motion.div>
        ))}
      </div>
      <div className="relative">
        <Hops nodes={[{ icon: "🌍", label: "Across the world" }, { icon: "🚪", label: "Front door of that computer", sub: "192.168.1.100", active: sent }]} pos={sent ? 1 : 0} />
        {sent && !reduce &&
          [0, 1].map((k) => (
            <motion.span
              key={k}
              aria-hidden
              className="absolute right-[18%] top-0 text-sm"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: [0, -10], x: [0, k ? 6 : -6] }}
              transition={{ duration: 0.8, delay: 1.1 + k * 0.25 }}
            >
              ✊
            </motion.span>
          ))}
      </div>
      <Caption>{sent ? "Layer 3 got your traffic across the world and landed it right in front of the front door." : "The final layer is next: layer four."}</Caption>
      <button type="button" className={`${sent ? chip : solid} mx-auto`} onClick={() => setSent((s) => !s)}>
        {sent ? "Send it again" : "Send it across the world"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – which application is it for?                                    */
/* ------------------------------------------------------------------ */

function WhichAppVisual() {
  const [asked, setAsked] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  const xs = [16.7, 50, 83.3];
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="mx-auto flex items-center gap-2 rounded-lg bg-[#0B2447] px-3 py-2 ring-1 ring-[#7FB5FF]/30">
        <motion.span className="text-2xl" animate={reduce ? undefined : { y: [0, -3, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          📦
        </motion.span>
        <span className="font-mono text-xs text-[#EAF1FB]">Arrived at 192.168.1.100</span>
      </div>
      {/* the packet looks around: which one is it for? */}
      <div className="relative h-8" aria-hidden>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 32" preserveAspectRatio="none">
          {APPS.map((a, i) => {
            const on = asked === a.name;
            return (
              <path
                key={a.name}
                d={`M50 0 L50 8 L${xs[i]} 8 L${xs[i]} 32`}
                fill="none"
                stroke={on ? "#FFB547" : "#7FB5FF"}
                strokeOpacity={on ? 1 : 0.3}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {!reduce &&
          xs.map((x, i) => (
            <motion.span
              key={`q-${i}-${asked ?? "none"}`}
              className="absolute -ml-1.5 text-xs"
              style={{ left: `${x}%` }}
              initial={{ top: "0%", opacity: 0 }}
              animate={{ top: "85%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }}
            >
              ❓
            </motion.span>
          ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {APPS.map((a, i) => (
          <motion.button
            key={`${a.name}-${asked === a.name ? n : 0}`}
            type="button"
            onClick={() => { setAsked(a.name); setN((v) => v + 1); }}
            animate={asked === a.name ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`relative rounded-xl border-2 py-4 text-center ${ring} ${asked === a.name ? "border-[#FFB547] bg-[#FFB547]/10" : "border-[#7FB5FF]/30 bg-[#0B2447]/60"}`}
          >
            <motion.div
              className="text-3xl"
              animate={reduce ? undefined : { rotate: [0, -4, 4, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
            >
              {a.icon}
            </motion.div>
            <div className="text-xs text-[#EAF1FB]">{a.name}</div>
            <AnimatePresence>
              {asked === a.name && (
                <motion.span initial={{ opacity: 0, scale: 0, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-3 right-1 text-xl">
                  ❓
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      <Caption>{asked ? "Is it for this one? Nothing on the packet says." : "That computer is probably running a bunch of different applications. Tap one."}</Caption>
      <p className="text-center text-xs text-[#7FB5FF]">How does it know which application to open?</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – IP = house number, port = the person                            */
/* ------------------------------------------------------------------ */

function HouseVisual() {
  const [to, setTo] = useState<number | null>(null);
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div>
        <div aria-hidden className="mx-auto h-4 w-28 bg-[#FFB547]" style={{ clipPath: "polygon(50% 0, 0 100%, 100% 100%)" }} />
        <div className="mx-auto w-full max-w-sm rounded-xl border-2 border-[#FFB547] bg-[#FFB547]/10 p-3">
          <p className="text-center text-sm font-semibold text-[#EAF1FB]">
            🏠 House <span className="font-mono text-[#FFB547]">192.168.1.100</span>
            <span className="ml-2 text-xs font-normal text-[#7FB5FF]">(the IP address is the house number)</span>
          </p>
          <div className="relative mt-3">
            {to !== null && !reduce && (
              <motion.span
                key={`l-${to}-${n}`}
                aria-hidden
                className="absolute z-10 text-lg"
                style={{ marginLeft: -9 }}
                initial={{ left: "50%", top: -52, opacity: 0 }}
                animate={{ left: `${((to + 0.5) / 3) * 100}%`, top: -2, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                ✉️
              </motion.span>
            )}
            <div className="grid grid-cols-3 gap-2">
              {APPS.map((a, i) => (
                <motion.button
                  key={a.name}
                  type="button"
                  aria-pressed={to === i}
                  onClick={() => { setTo(i); setN((v) => v + 1); }}
                  animate={{
                    scale: to === i ? 1.1 : 1,
                    backgroundColor: to === i ? "rgba(95,212,196,0.3)" : "rgba(11,36,71,0.7)",
                    boxShadow: to === i ? "0 0 16px rgba(95,212,196,.5)" : "0 0 0 transparent",
                  }}
                  className={`rounded-lg py-3 text-center ${ring}`}
                >
                  <motion.div
                    key={String(to === i)}
                    className="text-2xl"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 12, delay: to === i ? 0.6 : 0 }}
                  >
                    {to === i ? "🙋" : "🧑"}
                  </motion.div>
                  <div className="text-[11px] text-[#EAF1FB]">{a.name}</div>
                  <div className="text-[10px] text-[#5FD4C4]">a port</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={to ?? "none"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto rounded-lg bg-[#EAF1FB] px-4 py-2 text-center text-sm font-semibold text-[#0B2447]">
          {to === null ? "✉️ Who is this for?" : `✉️ House 192.168.1.100, for ${APPS[to].name}`}
        </motion.div>
      </AnimatePresence>
      <p className="text-center text-xs text-[#7FB5FF]">The port is like the person living in that house. Tap a resident to deliver the letter.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 – common ports                                                    */
/* ------------------------------------------------------------------ */

function PortsVisual() {
  const cards = [
    { port: 80, svc: "HTTP", icon: "🌐" },
    { port: 443, svc: "HTTPS", icon: "🔒" },
    { port: 53, svc: "DNS", icon: "📖" },
  ];
  const [flipped, setFlipped] = useState<number[]>([]);
  const reduce = useReducedMotion();
  const sprinkle = [20, 21, 22, 25, 67, 110, 123, 143, 161, 389, 993, 3306, 3389, 5432, 8080, 9090];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="grid grid-cols-3 gap-3" style={{ perspective: 800 }}>
        {cards.map((c, i) => {
          const on = flipped.includes(c.port);
          return (
            <button key={c.port} type="button" aria-pressed={on} aria-label={`Port ${c.port}. Tap to flip.`} onClick={() => setFlipped((f) => (f.includes(c.port) ? f.filter((x) => x !== c.port) : [...f, c.port]))} className={`relative h-28 rounded-xl ${ring}`}>
              <motion.div className="absolute inset-0" animate={{ rotateY: on ? 180 : 0 }} transition={{ type: "spring", stiffness: 140, damping: 16 }} style={{ transformStyle: "preserve-3d" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-[#0B2447] ring-1 ring-[#7FB5FF]/40" style={{ backfaceVisibility: "hidden" }}>
                  <span className="text-xs text-[#7FB5FF]">Port</span>
                  <span className="font-mono text-3xl font-bold text-[#FFB547]">{c.port}</span>
                  {i === 0 && !flipped.length && (
                    <motion.span
                      className="mt-1 text-[10px] text-[#7FB5FF]"
                      animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    >
                      tap to flip
                    </motion.span>
                  )}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-[#FFB547]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: "0 0 20px rgba(255,181,71,.5)" }}>
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[11px] text-[#0B2447]">Port {c.port} is for</span>
                  <span className="text-2xl font-bold text-[#0B2447]">{c.svc}</span>
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {sprinkle.map((p, i) => (
          <motion.span
            key={p}
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 0.6 } : { opacity: [0.2, 0.8, 0.2], y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, delay: (i % 8) * 0.3 }}
            className="rounded bg-[#0B2447] px-1.5 py-0.5 font-mono text-[10px] text-[#7FB5FF]"
          >
            {p}
          </motion.span>
        ))}
      </div>
      <Caption>Every service or application uses a specific port. There's a bunch of different ports.</Caption>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – the segment                                                     */
/* ------------------------------------------------------------------ */

function SegmentVisual() {
  const [wrapped, setWrapped] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="relative">
        <AnimatePresence>
          {wrapped && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0, y: 10, scale: 0.4, rotate: -20 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
              className="absolute -right-2 -top-6 z-10 text-2xl"
            >
              📦
            </motion.span>
          )}
        </AnimatePresence>
        <motion.div
          layout
          animate={{ boxShadow: wrapped ? "0 0 24px rgba(255,181,71,.3)" : "0 0 0 transparent" }}
          className={`relative flex flex-col items-center gap-2 overflow-hidden rounded-xl p-3 ${wrapped ? "border-2 border-[#FFB547] bg-[#FFB547]/10" : ""}`}
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
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap justify-center gap-2">
                <motion.span initial={{ x: -24, scale: 0.7 }} animate={{ x: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="rounded bg-[#FFB547] px-2 py-1 font-mono text-xs font-bold text-[#0B2447]">Source port 52814</motion.span>
                <motion.span initial={{ x: 24, scale: 0.7 }} animate={{ x: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }} className="rounded bg-[#5FD4C4] px-2 py-1 font-mono text-xs font-bold text-[#0B2447]">Destination port 443</motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div layout className="flex flex-col items-center gap-1 rounded-lg border-2 border-[#7FB5FF] bg-[#7FB5FF]/10 p-2">
            <span className="rounded bg-[#7FB5FF] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0B2447]">Source IP · Destination IP</span>
            <motion.span
              className="rounded bg-[#EAF1FB] px-3 py-1 text-sm font-semibold text-[#0B2447]"
              animate={reduce || wrapped ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              📄 Data
            </motion.span>
          </motion.div>
        </motion.div>
      </div>
      <p className="text-center text-sm text-[#7FB5FF]">{wrapped ? "A segment (among other things, it has the two ports)" : "A packet"}</p>
      <button type="button" className={solid} onClick={() => setWrapped((w) => !w)}>
        {wrapped ? "Unwrap" : "Layer 4 wraps it into a segment"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – TCP and UDP                                                     */
/* ------------------------------------------------------------------ */

function ForkVisual() {
  const [sel, setSel] = useState<"tcp" | "udp" | null>(null);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="relative mx-auto overflow-hidden rounded-lg bg-[#FFB547] px-4 py-2 text-sm font-semibold text-[#0B2447]">
        Segments, port to port
        {!reduce && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            initial={{ left: "-30%" }}
            animate={{ left: "130%" }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          { id: "tcp", name: "TCP", tag: "Reliable", dur: 2.4 },
          { id: "udp", name: "UDP", tag: "Much faster", dur: 0.9 },
        ] as const).map((m) => (
          <motion.button
            key={m.id}
            type="button"
            aria-pressed={sel === m.id}
            onClick={() => setSel(m.id)}
            animate={{ scale: sel === m.id ? 1.05 : 1, borderColor: sel === m.id ? "#FFB547" : "rgba(127,181,255,0.4)", boxShadow: sel === m.id ? "0 0 20px rgba(255,181,71,.35)" : "0 0 0 transparent" }}
            className={`rounded-xl border-2 bg-[#0B2447]/70 px-3 py-5 text-center ${ring}`}
          >
            <div className="font-mono text-3xl font-bold text-[#EAF1FB]">{m.name}</div>
            <AnimatePresence>
              {sel === m.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-sm text-[#FFB547]">
                  {m.tag}
                </motion.div>
              )}
            </AnimatePresence>
            {/* a little taste of how each one behaves */}
            <div className="relative mt-3 h-4" aria-hidden style={{ opacity: sel === m.id ? 1 : 0.5 }}>
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded bg-[#7FB5FF]/40" />
              {!reduce &&
                [0, 1, 2].map((k) => (
                  <motion.span
                    key={k}
                    className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#FFE2A8]"
                    initial={{ left: "0%" }}
                    animate={{ left: "92%" }}
                    transition={{ duration: m.dur, repeat: Infinity, ease: "linear", delay: (k * m.dur) / 3 }}
                  />
                ))}
              {m.id === "tcp" && !reduce &&
                [0, 1].map((k) => (
                  <motion.span
                    key={`ack-${k}`}
                    className="absolute -top-1 text-[9px] text-[#5FD4C4]"
                    initial={{ left: "92%" }}
                    animate={{ left: "0%" }}
                    transition={{ duration: m.dur, repeat: Infinity, ease: "linear", delay: 0.6 + k * 1.2 }}
                  >
                    ✓
                  </motion.span>
                ))}
            </div>
          </motion.button>
        ))}
      </div>
      <Caption>Two main methods. Tap each one.</Caption>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 – TCP resends lost segments                                       */
/* ------------------------------------------------------------------ */

type Seg = "idle" | "ok" | "lost" | "resent";

function TcpVisual() {
  const [segs, setSegs] = useState<Seg[]>(Array(6).fill("idle"));
  const [busy, setBusy] = useState(false);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const delivered = segs.filter((s) => s === "ok" || s === "resent").length;
  const run = () => {
    clear();
    setBusy(true);
    setSegs(Array(6).fill("idle"));
    for (let i = 0; i < 6; i++) later(() => setSegs((p) => p.map((s, j) => (j === i ? (i === 2 ? "lost" : "ok") : s))), 500 + i * 500);
    later(() => setSegs((p) => p.map((s, j) => (j === 2 ? "resent" : s))), 4200);
    later(() => setBusy(false), 4800);
  };
  const color: Record<Seg, string> = { idle: "#0B2447", ok: "#5FD4C4", lost: "#FF8A7A", resent: "#FFB547" };
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="grid grid-cols-6 gap-2">
        {segs.map((s, i) => (
          <motion.div
            key={`${i}-${s}`}
            initial={s === "idle" ? false : { y: -22, opacity: 0.2, scale: 0.8 }}
            animate={{
              y: 0,
              opacity: 1,
              backgroundColor: color[s],
              scale: s === "resent" ? [1, 1.25, 1] : 1,
              x: s === "lost" && !reduce ? [0, -5, 5, -3, 3, 0] : 0,
              boxShadow: s === "resent" ? "0 0 16px rgba(255,181,71,.8)" : s === "lost" ? "0 0 14px rgba(255,138,122,.7)" : "0 0 0 transparent",
            }}
            transition={{ duration: 0.45, type: s === "idle" ? "tween" : "spring", stiffness: 260, damping: 16 }}
            className="flex h-14 flex-col items-center justify-center rounded-lg text-[#0B2447] ring-1 ring-[#7FB5FF]/40"
          >
            <motion.span
              className="text-lg"
              animate={s === "resent" && !reduce ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.7 }}
            >
              {s === "lost" ? "✖️" : s === "idle" ? "" : s === "resent" ? "🔁" : "✓"}
            </motion.span>
            <span className={`text-[10px] font-bold ${s === "idle" ? "text-[#7FB5FF]" : ""}`}>#{i + 1}</span>
          </motion.div>
        ))}
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#0B2447]">
        <motion.div className="h-full bg-gradient-to-r from-[#5FD4C4] to-[#9AF0E2]" animate={{ width: `${(delivered / 6) * 100}%` }} />
      </div>
      <Caption>{segs[2] === "lost" ? "Segment #3 got lost..." : segs[2] === "resent" ? "TCP resent it. Everything arrived." : "Send six segments over TCP."}</Caption>
      <button type="button" className={`${solid} mx-auto`} disabled={busy} onClick={run}>
        Send with TCP
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8 – the GTA 6 download                                              */
/* ------------------------------------------------------------------ */

function GameVisual() {
  const TOTAL = 80;
  const HOLE = 31;
  const [tcp, setTcp] = useState(true);
  const [prog, setProg] = useState(0);
  const [note, setNote] = useState("");
  const [running, setRunning] = useState(false);
  const [resending, setResending] = useState(false);
  const [result, setResult] = useState<"ok" | "bad" | null>(null);
  const id = useRef<number | null>(null);
  const pause = useRef(0);
  const reduce = useReducedMotion();
  useEffect(() => () => { if (id.current) window.clearInterval(id.current); }, []);

  const start = () => {
    if (id.current) window.clearInterval(id.current);
    pause.current = 0;
    setProg(0);
    setNote("");
    setResult(null);
    setResending(false);
    setRunning(true);
    let p = 0;
    id.current = window.setInterval(() => {
      if (p === HOLE && tcp && pause.current < 12) {
        pause.current++;
        setResending(true);
        setNote("A byte got lost. TCP is resending it...");
        return;
      }
      setResending(false);
      p++;
      setProg(p);
      if (p === HOLE + 1 && !tcp) setNote("A byte got lost and nothing resends it...");
      if (p >= TOTAL) {
        if (id.current) window.clearInterval(id.current);
        setRunning(false);
        setResult(tcp ? "ok" : "bad");
        setNote(tcp ? "Every byte arrived. The game runs." : "Missing a byte. The game is corrupt.");
      }
    }, 55);
  };

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-[#EAF1FB]">
          <motion.span
            className="inline-block"
            animate={
              reduce
                ? undefined
                : result === "bad"
                  ? { x: [0, -3, 3, -2, 2, 0], rotate: [0, -6, 6, 0], filter: "grayscale(1)" }
                  : result === "ok"
                    ? { scale: [1, 1.3, 1], filter: "grayscale(0)" }
                    : { filter: "grayscale(0)" }
            }
            transition={{ duration: 0.6, repeat: result === "bad" ? Infinity : 0, repeatDelay: 1 }}
          >
            🎮
          </motion.span>{" "}
          GTA 6
          <AnimatePresence>
            {result && (
              <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 300, damping: 10 }} className="text-base">
                {result === "ok" ? "🎉" : "💥"}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="text-xs text-[#7FB5FF]">500 million gigabytes</span>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}>
        {Array.from({ length: TOTAL }, (_, i) => {
          const done = i < prog;
          const bad = done && i === HOLE && !tcp;
          const isResending = i === HOLE && tcp && resending;
          return (
            <motion.span
              key={i}
              className="aspect-square rounded-[2px]"
              animate={{
                backgroundColor: bad ? "#FF8A7A" : isResending ? "#FFB547" : done ? "#5FD4C4" : "#2A5A94",
                scale: isResending && !reduce ? [1, 1.7, 1] : done && i === prog - 1 && !reduce ? [1.4, 1] : 1,
              }}
              transition={isResending ? { duration: 0.5, repeat: Infinity } : { duration: 0.2 }}
            />
          );
        })}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#0B2447]">
        <div className="h-full bg-[#FFB547] transition-all" style={{ width: `${(prog / TOTAL) * 100}%` }} />
      </div>
      <Caption>{note || "Can't miss a single byte."}</Caption>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" role="switch" aria-checked={tcp} disabled={running} className={chip} onClick={() => setTcp((t) => !t)}>
          Reliable (TCP): {tcp ? "on" : "off"}
        </button>
        <button type="button" className={solid} disabled={running} onClick={start}>
          Download the game
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9 – UDP, real time                                                  */
/* ------------------------------------------------------------------ */

const EQ = [0.5, 0.8, 0.6, 1, 0.7, 0.9, 0.55, 0.85, 0.65, 0.95, 0.6, 0.8];

function UdpVisual() {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();
  const tcpLeft = run ? ["0%", "40%", "40%", "100%"] : "0%";
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs text-[#EAF1FB]">UDP: not reliable, much faster</p>
          <div className="relative h-5 rounded bg-[#0B2447]">
            <div className="absolute inset-0 overflow-hidden rounded">
              <motion.div key={`u${run}`} className="h-full bg-[#5FD4C4]" initial={{ width: run ? "0%" : "0%" }} animate={{ width: run ? "100%" : "0%" }} transition={{ duration: reduce ? 0 : 2.2, ease: "linear" }} onAnimationComplete={() => run && setDone(true)} />
            </div>
            <motion.span
              key={`ur${run}`}
              aria-hidden
              className="absolute -top-1 text-base"
              style={{ x: "-70%" }}
              initial={{ left: "0%" }}
              animate={{ left: run ? "100%" : "0%" }}
              transition={{ duration: reduce ? 0 : 2.2, ease: "linear" }}
            >
              🚀
            </motion.span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-[#EAF1FB]">TCP: stops to resend what got lost</p>
          <div className="relative h-5 rounded bg-[#0B2447]">
            <div className="absolute inset-0 overflow-hidden rounded">
              <motion.div key={`t${run}`} className="h-full bg-[#FFB547]" initial={{ width: "0%" }} animate={{ width: run ? ["0%", "40%", "40%", "100%"] : "0%" }} transition={{ duration: reduce ? 0 : 4, times: [0, 0.35, 0.6, 1], ease: "linear" }} />
            </div>
            <motion.span
              key={`tr${run}`}
              aria-hidden
              className="absolute -top-1 text-base"
              style={{ x: "-70%" }}
              initial={{ left: "0%" }}
              animate={{ left: tcpLeft }}
              transition={{ duration: reduce ? 0 : 4, times: [0, 0.35, 0.6, 1], ease: "linear" }}
            >
              🚚
            </motion.span>
            {run > 0 && !reduce && (
              <motion.span
                key={`stop${run}`}
                aria-hidden
                className="absolute -top-5 text-sm"
                style={{ left: "40%", x: "-50%" }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0] }}
                transition={{ duration: 1.8, delay: 1.3, times: [0, 0.15, 0.85, 1] }}
              >
                🔁
              </motion.span>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-[#0B2447] p-3 ring-1 ring-[#7FB5FF]/30">
        <div className="mb-1 flex justify-between gap-2 text-xs text-[#EAF1FB]">
          <span>💬 Discord call quality</span>
          <span className="text-right text-[#7FB5FF]">{done ? "Real time, no waiting" : run ? "A dip for a second..." : "Waiting"}</span>
        </div>
        <div className="flex h-6 items-end gap-0.5" aria-hidden>
          {EQ.map((h, i) => (
            <motion.span
              key={`${run}-${i}`}
              className="flex-1 rounded-sm bg-[#5FD4C4]"
              initial={{ height: `${h * 100}%` }}
              animate={
                run && !reduce
                  ? { height: [`${h * 100}%`, `${h * 100}%`, `${h * 28}%`, `${h * 100}%`, `${h * 70}%`, `${h * 100}%`] }
                  : { height: `${h * 100}%` }
              }
              transition={{ duration: 2.2, times: [0, 0.4, 0.55, 0.75, 0.88, 1], delay: i * 0.01 }}
            />
          ))}
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-[#123A6B]">
          <motion.div key={`q${run}`} className="h-full bg-[#5FD4C4]" initial={{ width: "100%" }} animate={{ width: run ? ["100%", "100%", "55%", "100%"] : "100%" }} transition={{ duration: 2.2, times: [0, 0.4, 0.55, 0.75] }} />
        </div>
      </div>
      <Caption>{done ? "It's not too big of a deal if the quality drops for a second, as long as you're getting it in real time." : "Race them."}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={() => { setDone(false); setRun((r) => r + 1); }}>
        {run ? "Race again" : "Start the race"}
      </button>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  FrontDoorVisual,
  WhichAppVisual,
  HouseVisual,
  PortsVisual,
  SegmentVisual,
  ForkVisual,
  TcpVisual,
  GameVisual,
  UdpVisual,
];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

// Stage height on phones, per beat (from sm up it is always 24rem).
const STAGE_H = [
  "h-[22rem]", "h-[24rem]", "h-[22rem]", "h-[22rem]", "h-[22rem]",
  "h-[22rem]", "h-[22rem]", "h-[22rem]", "h-[24rem]",
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

export default function Section10TransportLayer({ onComplete }: Props) {
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
      aria-label="Section 10: Layer 4, ports, TCP and UDP"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Layer 4: Ports, TCP and UDP</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
          {/* mini layer stack: Layer 4 is lit, Layers 1–3 stay softly on */}
          <div className="flex flex-col gap-1 pt-1" aria-hidden>
            {LAYER_BARS.map((c, i) => {
              const lit = i === 0;
              return (
                <motion.span
                  key={c}
                  className="block h-1.5 w-9 rounded-sm"
                  style={{ backgroundColor: c }}
                  animate={{ opacity: lit ? 1 : 0.55, boxShadow: lit ? `0 0 10px ${c}` : "0 0 0 transparent" }}
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

        <p key={step} className="min-h-[9rem] font-serif text-lg leading-relaxed sm:text-xl">
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
              On to security
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
