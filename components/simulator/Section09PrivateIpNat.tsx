"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 9 – Private vs public IPs, IPv4 running out, IPv6, NAT and PAT
 * Transcript range: 17:49 – 20:01
 *
 * Dependencies: react, motion/react, tailwindcss
 * Usage:  <Section09PrivateIpNat onComplete={() => goToSection(10)} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/* Transcript                                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "Now, there's a pretty big problem with that packet that you're about to send to YouTube. Remember how DHCP gave you this IP address 192.168.1.100? This is actually a private IP address.",
  "And these are the three different IP address ranges. You don't have to memorize them. You'll probably just remember them over time as you see them.",
  "And millions of other homes and offices are using the exact same IP address that you have. And it doesn't help that 192.168.1.x is probably the most common IP address range. Well, why do we do this? I thought IP addresses had to be unique.",
  "Well, there are approximately like 30 billion devices on the internet or in the world. But because of the nature of the four octet IP address, there's only about 4.3 billion different IP addresses, which is quite a lot less than 30 billion. So, we literally ran out of IP addresses.",
  "The people who made IPv4 thought that 4.3 billion IP addresses would be more than enough, but obviously they didn't expect to see how big the internet would explode, and now we don't have enough.",
  "The long-term solution for this is actually IPv6, which is very, very long. There's more IPv6 addresses than there are like grains of sand on the earth or something crazy like that.",
  "But for now, majority of the world just uses the public and private IP addresses. Private IP addresses, as we said before, are not globally routable. But public addresses are. These are the unique IP addresses.",
  "And knowing this, we come to a very interesting and very cool concept. It's called NAT, network address translation. When PC1 wants to access the internet, it will go to the router obviously cuz that's the default gateway. And the router will use NAT. NAT will actually swap out your private IP address and replaces it with your router's public IP address.",
  "This kind of sucks though because what if you have like five different PCs that want to access the internet? There's only one available public IP address. So that means they all have to use that same public IP address. But how will the router know where to send traffic back to if they're all using the same public IP address?",
  "And the answer to that is port address translation. PAT. Along with translating the private IP address to the public IP address, PAT will also assign a port number to it. So when the return traffic comes, the router will be able to differentiate between the different PCs even though they're using the same public IP address because there's a different port number attached to that IP address.",
];

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]";
const chip = `rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 disabled:opacity-40 ${ring}`;
const solid = `rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] disabled:opacity-40 ${ring}`;

const PRIVATE_IP = "192.168.1.100";
const PUBLIC_IP = "203.0.113.50";

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
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 12 }}
                  className="absolute -top-3 right-[8%] z-10 text-2xl"
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

/* ------------------------------------------------------------------ */
/* 1 – the private IP problem                                          */
/* ------------------------------------------------------------------ */

function PrivateProblemVisual() {
  const [stamp, setStamp] = useState(false);
  const [sent, setSent] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <motion.div
        animate={{ boxShadow: sent && !reduce ? ["0 0 0 rgba(255,138,122,0)", "0 0 20px rgba(255,138,122,.6)", "0 0 0 rgba(255,138,122,0)"] : "0 0 0 transparent" }}
        transition={{ duration: 1.2, repeat: sent ? Infinity : 0 }}
        className="mx-auto w-full max-w-sm rounded-xl bg-[#0B2447] p-3 ring-1 ring-[#7FB5FF]/30"
      >
        <p className="mb-2 text-xs text-[#7FB5FF]">The packet bound for YouTube</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={stamp} onClick={() => setStamp((s) => !s)} className={`relative rounded-lg bg-[#FFB547] px-2 py-1.5 font-mono text-xs font-bold text-[#0B2447] ${ring}`}>
            Source IP {PRIVATE_IP}
            <AnimatePresence>
              {stamp && (
                <motion.span initial={{ scale: 2.2, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="absolute -right-3 -top-3 rounded border-2 border-[#FF8A7A] bg-[#0B2447] px-1.5 py-0.5 font-sans text-[10px] font-extrabold text-[#FF8A7A]">
                  PRIVATE
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <span className="rounded-lg bg-[#5FD4C4] px-2 py-1.5 font-mono text-xs font-bold text-[#0B2447]">Destination: YouTube</span>
        </div>
        <p className="mt-2 text-[11px] text-[#7FB5FF]">Tap the source IP to see what kind of address it is</p>
      </motion.div>
      <Hops
        nodes={[
          { icon: "💻", label: "You", sub: PRIVATE_IP },
          { icon: "🌐", label: "The internet", badge: sent ? "⚠️" : undefined },
          { icon: "▶️", label: "YouTube" },
        ]}
        pos={sent ? 1 : 0}
      />
      <Caption>{sent ? "A pretty big problem with that packet." : "You're about to send it to YouTube."}</Caption>
      <button type="button" className={`${sent ? chip : solid} mx-auto`} onClick={() => setSent((s) => !s)}>
        {sent ? "Take it back" : "Send it to the internet"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – the three private ranges                                        */
/* ------------------------------------------------------------------ */

const RANGES = [
  { cidr: "10.0.0.0/8", span: "10.0.0.0 to 10.255.255.255" },
  { cidr: "172.16.0.0/12", span: "172.16.0.0 to 172.31.255.255" },
  { cidr: "192.168.0.0/16", span: "192.168.0.0 to 192.168.255.255" },
];

function classify(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return 0;
  if (a === 172 && b >= 16 && b <= 31) return 1;
  if (a === 192 && b === 168) return 2;
  return -1;
}

function RangesVisual() {
  const samples = ["10.4.7.2", "172.20.9.9", "192.168.1.100", "8.8.8.8", "172.32.0.1"];
  const [pick, setPick] = useState<string | null>(null);
  const hit = pick ? classify(pick) : null;
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="space-y-2">
        {RANGES.map((r, i) => (
          <motion.div
            key={r.cidr}
            animate={{
              borderColor: hit === i ? "#FFB547" : "rgba(127,181,255,0.3)",
              backgroundColor: hit === i ? "rgba(255,181,71,0.15)" : "rgba(11,36,71,0.6)",
              boxShadow: hit === i ? "0 0 18px rgba(255,181,71,.4)" : "0 0 0 transparent",
              scale: hit === i ? 1.02 : 1,
            }}
            className="relative flex flex-col justify-between gap-0.5 rounded-lg border-2 px-3 py-2 sm:flex-row sm:items-center"
          >
            <span className="font-mono text-sm font-bold text-[#EAF1FB]">{r.cidr}</span>
            <span className="font-mono text-[11px] text-[#7FB5FF]">{r.span}</span>
            <AnimatePresence>
              {hit === i && (
                <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} className="absolute right-2 top-1 text-lg">
                  🔒
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <p className="text-center text-xs text-[#7FB5FF]">
        Tap an address to see where it falls{" "}
        <AnimatePresence>
          {hit === -1 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="inline-block">
              🌍
            </motion.span>
          )}
        </AnimatePresence>
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {samples.map((s) => (
          <button key={s} type="button" aria-pressed={pick === s} onClick={() => setPick(s)} className={`rounded-full border px-3 py-1 font-mono text-xs ${ring} ${pick === s ? "border-[#FFB547] bg-[#FFB547]/15 text-[#EAF1FB]" : "border-[#7FB5FF]/40 text-[#7FB5FF]"}`}>
            {s}
          </button>
        ))}
      </div>
      <Caption>{pick === null ? "You'll probably just remember them over time as you see them." : hit === -1 ? `${pick} isn't in any of them: a public address.` : `${pick} is private, in ${RANGES[hit as number].cidr}.`}</Caption>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – millions of homes share the same IP                             */
/* ------------------------------------------------------------------ */

function SameIpVisual() {
  const [n, setN] = useState(6);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-10 gap-1 text-center sm:grid-cols-12 sm:gap-1.5">
        {Array.from({ length: n }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: (i % 12) * 0.03 }}
            className="rounded-md bg-[#0B2447] py-0.5 ring-1 ring-[#7FB5FF]/30"
          >
            <motion.div
              className="text-sm sm:text-lg"
              animate={reduce ? undefined : { y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: ((i * 7) % 12) * 0.15 }}
            >
              {i % 3 === 0 ? "🏢" : "🏠"}
            </motion.div>
            <div className="font-mono text-[6px] leading-none text-[#FFB547] sm:text-[8px]">.1.100</div>
          </motion.div>
        ))}
      </div>
      <motion.div
        animate={{ boxShadow: n >= 32 && !reduce ? ["0 0 0 rgba(255,181,71,0)", "0 0 18px rgba(255,181,71,.5)", "0 0 0 rgba(255,181,71,0)"] : "0 0 0 transparent" }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="rounded-lg bg-[#0B2447] p-3 text-center ring-1 ring-[#7FB5FF]/30"
      >
        <p className="font-mono text-lg font-bold text-[#FFB547]">192.168.1.x</p>
        <p className="text-xs text-[#EAF1FB]">{n >= 32 ? "Millions of other homes and offices have the exact same IP address as you." : "Probably the most common IP address range."}</p>
      </motion.div>
      <Caption>I thought IP addresses had to be unique. Why do we do this?</Caption>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={solid} disabled={n >= 48} onClick={() => setN((v) => Math.min(48, v * 2))}>
          Add more homes and offices
        </button>
        <button type="button" className={chip} disabled={n === 6} onClick={() => setN(6)}>
          Reset
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 – 30 billion devices, 4.3 billion addresses                       */
/* ------------------------------------------------------------------ */

function RanOutVisual() {
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs text-[#EAF1FB]">Devices in the world: about 30 billion</p>
          <div className="relative h-6 overflow-hidden rounded bg-[#0B2447]">
            <motion.div key={`d${run}`} className="h-full bg-[#FF8A7A]" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.6 }} />
            {/* everything past the dashed line has no address */}
            <div className="absolute inset-y-0 border-l-2 border-dashed border-[#FFB547]" style={{ left: "14.3%" }} />
            <motion.div
              key={`h${run}`}
              className="absolute inset-y-0 right-0"
              style={{ left: "14.3%", backgroundImage: "repeating-linear-gradient(135deg, rgba(11,36,71,.45) 0 4px, transparent 4px 9px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            />
            <motion.span
              key={`w${run}`}
              aria-hidden
              className="absolute right-1 top-0.5 text-sm"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.7, type: "spring", stiffness: 300, damping: 10 }}
            >
              ⚠️
            </motion.span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-[#EAF1FB]">Different IP addresses: only about 4.3 billion</p>
          <div className="h-6 overflow-hidden rounded bg-[#0B2447]">
            <motion.div key={`a${run}`} className="h-full bg-[#5FD4C4]" initial={{ width: 0 }} animate={{ width: "14.3%" }} transition={{ duration: 1.6, delay: 0.3 }} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 font-mono text-xs text-[#0B2447] sm:text-sm">
        {[0, 1, 2, 3].map((i) => (
          <Fragment key={i}>
            <motion.span
              className="rounded bg-[#FFB547] px-2 py-1 font-bold"
              animate={reduce ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
            >
              0–255
            </motion.span>
            {i < 3 && <span className="text-[#7FB5FF]">.</span>}
          </Fragment>
        ))}
      </div>
      <p className="text-center text-xs text-[#7FB5FF]">The nature of the four octet IP address</p>
      <Caption>We literally ran out of IP addresses.</Caption>
      <button type="button" className={`${chip} mx-auto`} onClick={() => setRun((r) => r + 1)}>
        Replay
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – the internet exploded                                           */
/* ------------------------------------------------------------------ */

function ExplodeVisual() {
  const [size, setSize] = useState(15);
  const limit = 40;
  const over = size > limit;
  const reduce = useReducedMotion();
  const dots = Math.round(size / 2);
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div>
        <div className="mb-1 flex justify-between gap-2 text-xs text-[#EAF1FB]">
          <span>How big the internet is</span>
          <span className={`text-right ${over ? "text-[#FF8A7A]" : "text-[#5FD4C4]"}`}>{over ? "Now we don't have enough" : "More than enough"}</span>
        </div>
        <div className="relative h-8 overflow-hidden rounded bg-[#0B2447]">
          <motion.div className="absolute inset-y-0 left-0" animate={{ width: `${size}%`, backgroundColor: over ? "#FF8A7A" : "#5FD4C4" }} />
          <div className="absolute inset-y-0 border-l-2 border-dashed border-[#FFB547]" style={{ left: `${limit}%` }} />
        </div>
        <p className="mt-1 text-xs text-[#FFB547]" style={{ marginLeft: `${limit}%` }}>
          ↑ 4.3 billion IP addresses
        </p>
      </div>
      {/* every device is a dot: the first 20 get an address, the rest don't */}
      <div className="relative grid grid-cols-10 gap-1.5 px-2" aria-hidden>
        {Array.from({ length: dots }, (_, i) => (
          <motion.span
            key={i}
            className="aspect-square rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1, backgroundColor: i < limit / 2 ? "#5FD4C4" : "#FF8A7A" }}
            transition={{ duration: 0.25 }}
          />
        ))}
        {over && !reduce && (
          <motion.span
            key="boom"
            className="absolute -top-3 right-1/2 text-2xl"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.6, 1.2], opacity: [1, 1, 0] }}
            transition={{ duration: 0.8 }}
          >
            💥
          </motion.span>
        )}
      </div>
      <label className="block text-sm text-[#EAF1FB]">
        <span className="mb-1 block">Let the internet explode</span>
        <input type="range" min={5} max={100} value={size} onChange={(e) => setSize(Number(e.target.value))} className={`w-full accent-[#FFB547] ${ring}`} />
      </label>
      <Caption>
        {over ? "They didn't expect to see how big the internet would explode." : "The people who made IPv4 thought this would be more than enough."}
      </Caption>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – IPv6                                                            */
/* ------------------------------------------------------------------ */

function Ipv6Visual() {
  const [v6, setV6] = useState(false);
  const addr = v6 ? "2001:0db8:85a3:0000:0000:8a2e:0370:7334" : "192.168.1.100";
  const sep = v6 ? ":" : ".";
  const parts = addr.split(sep);
  const reduce = useReducedMotion();
  return (
    <div className="relative flex h-full flex-col justify-center gap-4 overflow-hidden">
      {v6 && !reduce &&
        Array.from({ length: 70 }, (_, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute h-1 w-1 rounded-full bg-[#FFB547]/70"
            style={{ left: `${(i * 37) % 100}%` }}
            initial={{ top: "-3%", opacity: 0 }}
            animate={{ top: "103%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3 + (i % 5) * 0.4, repeat: Infinity, delay: (i % 14) * 0.2 }}
          />
        ))}
      <div className="relative z-10 flex justify-center gap-2">
        {[false, true].map((x) => (
          <button key={String(x)} type="button" aria-pressed={v6 === x} onClick={() => setV6(x)} className={`rounded-full px-5 py-1.5 text-sm ${ring} ${v6 === x ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {x ? "IPv6" : "IPv4"}
          </button>
        ))}
      </div>
      <div className="relative z-10 rounded-xl bg-[#0B2447]/90 px-3 py-4 text-center ring-1 ring-[#7FB5FF]/30">
        <AnimatePresence mode="wait">
          <motion.p key={addr} exit={{ opacity: 0 }} className="break-all font-mono text-sm text-[#EAF1FB] sm:text-base">
            {parts.map((p, i) => (
              <Fragment key={i}>
                <motion.span
                  className="inline-block"
                  style={{ color: i % 2 ? "#5FD4C4" : "#FFB547" }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {p}
                </motion.span>
                {i < parts.length - 1 && <span className="text-[#7FB5FF]">{sep}</span>}
              </Fragment>
            ))}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 text-xs text-[#7FB5FF]">{v6 ? "Very, very long." : "About 4.3 billion of these."}</p>
      </div>
      <p className="relative z-10 text-center text-sm text-[#EAF1FB]">{v6 ? "More addresses than grains of sand on the earth. 🏖️" : "The long-term solution is IPv6."}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 – public vs private routability                                   */
/* ------------------------------------------------------------------ */

function RoutableVisual() {
  const [kind, setKind] = useState<"private" | "public">("private");
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  const blocked = kind === "private";
  const ip = kind === "private" ? PRIVATE_IP : PUBLIC_IP;
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {(["private", "public"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setRun(0); }} className={`rounded-full px-4 py-1.5 text-sm ${ring} ${kind === k ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {k === "private" ? `Private ${PRIVATE_IP}` : `Public ${PUBLIC_IP}`}
          </button>
        ))}
      </div>
      <div className="relative h-24 overflow-hidden rounded-xl bg-[#0B2447]/80 ring-1 ring-[#7FB5FF]/30">
        <div className="absolute inset-y-0 left-0 flex w-[45%] items-center justify-center bg-[#123A6B]/60 text-xs text-[#EAF1FB]">🏠 Home network</div>
        <motion.div
          className="absolute inset-y-0 left-[45%] w-1"
          animate={{ backgroundColor: blocked ? "rgba(255,138,122,.7)" : "rgba(95,212,196,.7)", boxShadow: blocked ? "0 0 10px rgba(255,138,122,.8)" : "0 0 10px rgba(95,212,196,.8)" }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 flex w-[53%] items-center justify-end pr-4 text-xs text-[#EAF1FB]"
          animate={{ backgroundColor: run > 0 && !blocked ? "rgba(95,212,196,.15)" : "rgba(0,0,0,0)" }}
          transition={{ delay: run > 0 && !blocked ? 1.2 : 0 }}
        >
          🌍 The global internet
        </motion.div>
        {run > 0 && (
          <motion.div
            key={`${kind}-${run}`}
            className="absolute top-1/2 flex flex-col items-center"
            style={{ x: "-50%", y: "-50%" }}
            initial={{ left: "8%" }}
            animate={{ left: blocked ? "33%" : "72%", rotate: blocked && !reduce ? [0, 0, -12, 12, -6, 0] : 0 }}
            transition={{ left: { duration: 1.5, ease: "easeIn" }, rotate: { duration: 0.6, delay: 1.4 } }}
          >
            <span className="text-xl">📦</span>
            <span className="rounded bg-[#FFB547] px-1 font-mono text-[9px] font-bold text-[#0B2447]">{ip}</span>
          </motion.div>
        )}
        {run > 0 && blocked && (
          <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4, type: "spring", stiffness: 300, damping: 10 }} className="absolute left-[45%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">
            🚫
          </motion.span>
        )}
        {run > 0 && !blocked && (
          <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 10 }} className="absolute right-3 top-2 text-xl">
            ✅
          </motion.span>
        )}
      </div>
      <Caption>
        {run === 0 ? "Send a packet across the internet." : blocked ? "Private IP addresses are not globally routable." : "Public addresses are globally routable. These are the unique IP addresses."}
      </Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={() => setRun((r) => r + 1)}>
        Send it across
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8 – NAT swaps the source IP                                         */
/* ------------------------------------------------------------------ */

function NatVisual() {
  const [pos, setPos] = useState<number | null>(null);
  const { later, clear } = useTimers();
  const reduce = useReducedMotion();
  const run = () => {
    clear();
    setPos(0);
    later(() => setPos(1), 100);
    later(() => setPos(2), 1900);
  };
  const swapped = pos === 2;
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="mx-auto flex flex-wrap items-center justify-center gap-2 rounded-lg bg-[#0B2447] px-3 py-2 ring-1 ring-[#7FB5FF]/30">
        <span className="text-xs text-[#7FB5FF]">Source IP</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={String(swapped)}
            initial={{ opacity: 0, rotateX: 90 }}
            animate={{ opacity: 1, rotateX: 0, boxShadow: swapped ? "0 0 14px rgba(95,212,196,.8)" : "0 0 0 transparent" }}
            exit={{ opacity: 0, rotateX: -90 }}
            className={`rounded px-2 py-0.5 font-mono text-sm font-bold text-[#0B2447] ${swapped ? "bg-[#5FD4C4]" : "bg-[#FFB547]"}`}
          >
            {swapped ? PUBLIC_IP : PRIVATE_IP}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="relative">
        <Hops nodes={[{ icon: "💻", label: "PC1", sub: PRIVATE_IP }, { icon: "📟", label: "Router: NAT", sub: `Public ${PUBLIC_IP}`, active: pos === 1 }, { icon: "🌐", label: "The internet", active: swapped }]} pos={pos} />
        {pos === 1 && !reduce && (
          <motion.span
            key="swap"
            aria-hidden
            className="absolute left-1/2 -top-4 -translate-x-1/2 text-xl"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.3, 1], rotate: 360 }}
            transition={{ duration: 0.9 }}
          >
            🔄
          </motion.span>
        )}
      </div>
      <Caption>
        {pos === null ? "PC1 wants to access the internet. It goes to the router, the default gateway." : pos === 1 ? "NAT swaps out the private IP address..." : swapped ? "...and replaces it with the router's public IP address." : "On its way to the router."}
      </Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={run}>
        Send to the internet
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 9 – five PCs, one public IP                                         */
/* ------------------------------------------------------------------ */

function FivePcsVisual() {
  const [n, setN] = useState(3);
  const [out, setOut] = useState(false);
  const [back, setBack] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="relative space-y-1.5 pr-4">
        {Array.from({ length: n }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-[3fr_auto_2fr] items-center gap-1.5 text-[10px] sm:text-xs">
            <span className="rounded bg-[#0B2447] px-2 py-1 font-mono text-[#EAF1FB] ring-1 ring-[#7FB5FF]/30">💻 PC{i + 1} 192.168.1.{100 + i}</span>
            <span className="relative w-5 text-center text-[#7FB5FF]">
              <motion.span animate={{ opacity: out ? 1 : 0.2 }}>→</motion.span>
              {out && !reduce && (
                <motion.span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FFE2A8]"
                  animate={{ left: ["0%", "100%"] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
                />
              )}
            </span>
            <motion.span
              animate={{ opacity: out ? 1 : 0.2, boxShadow: out && !reduce ? ["0 0 0 rgba(95,212,196,0)", "0 0 10px rgba(95,212,196,.8)", "0 0 0 rgba(95,212,196,0)"] : "0 0 0 transparent" }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="rounded bg-[#5FD4C4] px-2 py-1 text-center font-mono font-bold text-[#0B2447]"
            >
              {PUBLIC_IP}
            </motion.span>
          </motion.div>
        ))}
        {/* the same address, linked together */}
        {out && n > 1 && (
          <motion.span
            aria-hidden
            className="absolute bottom-1.5 right-0 top-1.5 w-3 rounded-r border-y-2 border-r-2 border-[#FFB547]"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            style={{ originY: 0 }}
          />
        )}
      </div>
      <AnimatePresence>
        {back && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mx-auto flex flex-wrap items-center justify-center gap-2 rounded-xl bg-[#EAF1FB] px-3 py-2 text-sm font-semibold text-[#0B2447]">
            📦 Return traffic for {PUBLIC_IP} <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>❓</motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      <Caption>
        {back ? "How will the router know where to send traffic back to?" : out ? "Only one available public IP address, so they all have to use that same one." : `${n} PC${n > 1 ? "s" : ""} want to access the internet.`}
      </Caption>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={chip} disabled={n >= 5 || out} onClick={() => setN((v) => v + 1)}>
          Add a PC
        </button>
        <button type="button" className={solid} disabled={out} onClick={() => setOut(true)}>
          Send them all out
        </button>
        <button type="button" className={chip} disabled={!out} onClick={() => setBack((b) => !b)}>
          {back ? "Hide return traffic" : "Return traffic arrives"}
        </button>
        <button type="button" className={chip} onClick={() => { setOut(false); setBack(false); setN(3); }}>
          Reset
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10 – PAT: add a port number                                         */
/* ------------------------------------------------------------------ */

function PatVisual() {
  const [sent, setSent] = useState(false);
  const [ret, setRet] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const pcs = [0, 1, 2, 3, 4];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {/* the five PCs, each tagged with its own port once sent out */}
      <div className="grid grid-cols-5 gap-1.5">
        {pcs.map((i) => (
          <motion.div
            key={i}
            animate={{ scale: ret === i ? 1.12 : 1, backgroundColor: ret === i ? "rgba(95,212,196,0.25)" : "rgba(0,0,0,0)" }}
            className="flex flex-col items-center rounded-lg py-1"
          >
            <motion.span
              className="text-xl"
              animate={ret === i && !reduce ? { y: [0, -4, 0] } : {}}
              transition={{ duration: 0.5, repeat: ret === i ? Infinity : 0 }}
            >
              💻
            </motion.span>
            <span className="text-[10px] text-[#EAF1FB]">PC{i + 1}</span>
            <motion.span
              className="rounded bg-[#FFB547] px-1 font-mono text-[9px] font-bold text-[#0B2447]"
              initial={false}
              animate={{ opacity: sent ? 1 : 0, scale: sent ? 1 : 0 }}
              transition={{ delay: sent ? i * 0.15 : 0, type: "spring", stiffness: 300, damping: 14 }}
            >
              :{50001 + i}
            </motion.span>
          </motion.div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40">
        <div className="bg-[#7FB5FF] px-2 py-1 text-center text-xs font-bold text-[#0B2447]">Router's PAT table</div>
        <div className="grid grid-cols-2 bg-[#0B2447] px-3 py-1 text-[11px] text-[#7FB5FF]">
          <span>Private IP</span>
          <span>Public IP : port</span>
        </div>
        <div className="min-h-[7.5rem]">
          {pcs.map((i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: sent ? 1 : 0, x: sent ? 0 : 16, backgroundColor: ret === i ? "rgba(95,212,196,0.4)" : "rgba(0,0,0,0)" }}
              transition={{ delay: sent && ret === null ? i * 0.15 : 0 }}
              className="grid grid-cols-2 px-3 py-1 font-mono text-[11px] text-[#EAF1FB]"
            >
              <span>192.168.1.{100 + i}</span>
              <span>
                {PUBLIC_IP}:<span className="font-bold text-[#FFB547]">{50001 + i}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {pcs.map((i) => (
          <button key={i} type="button" disabled={!sent} onClick={() => setRet(i)} className={`rounded-full border px-2 py-1 font-mono text-[10px] disabled:opacity-30 ${ring} ${ret === i ? "border-[#5FD4C4] bg-[#5FD4C4]/20 text-[#EAF1FB]" : "border-[#7FB5FF]/40 text-[#7FB5FF]"}`}>
            📦 to :{50001 + i}
          </button>
        ))}
      </div>
      <Caption>
        {!sent ? "Same public IP for everyone. PAT also assigns a port number." : ret === null ? "Tap a returning packet to see how the router tells the PCs apart." : `Return traffic on port ${50001 + ret} belongs to PC${ret + 1}, even though every PC shares ${PUBLIC_IP}.`}
      </Caption>
      <button type="button" className={`${sent ? chip : solid} mx-auto`} onClick={() => { setSent((s) => !s); setRet(null); }}>
        {sent ? "Clear the table" : "Send all five PCs out"}
      </button>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  PrivateProblemVisual,
  RangesVisual,
  SameIpVisual,
  RanOutVisual,
  ExplodeVisual,
  Ipv6Visual,
  RoutableVisual,
  NatVisual,
  FivePcsVisual,
  PatVisual,
];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

// Stage height on phones, per beat (from sm up it is always 24rem).
const STAGE_H = [
  "h-[24rem]", "h-[26rem]", "h-[28rem]", "h-[22rem]", "h-[24rem]",
  "h-[22rem]", "h-[24rem]", "h-[22rem]", "h-[26rem]", "h-[28rem]",
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

export default function Section09PrivateIpNat({ onComplete }: Props) {
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
      aria-label="Section 9: Private IPs, IPv6, NAT and PAT"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Private IPs, IPv6, NAT and PAT</h2>
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
              On to layer 4
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
