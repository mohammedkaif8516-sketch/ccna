"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 11 – Security (ACLs and firewalls) and the outro
 * Transcript range: 21:26 – end
 *
 * Note: the supplied transcript file ends mid-sentence ("...I'll see you guys next"),
 * so the last beat ends the same way.
 *
 * Dependencies: react, motion/react, tailwindcss
 * Usage:  <Section11SecurityOutro onComplete={() => finishCourse()} />
 */

import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/* Transcript                                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "And now we can talk about security a little bit. We have ACLs or access control lists. It's basically just a list of permit and deny statements that you can put on like a router interface.",
  "You could make rules like for example deny guest VLAN traffic from entering the HR VLAN or block all port 23 traffic.",
  "Then the router will check all of these rules against every packet that comes into it from top to bottom.",
  "And ACLs are pretty cool, but you know what's even cooler? Firewalls. Firewalls nowadays can do a bunch of different things. Like for example, they can act as a firewall. They can control traffic. They can be an intrusion prevention system. They can spot intrusions and then just prevent it.",
  "They can be routers, right? They can do NAT and stuff. They can do everything a router can do, but also be more secure. Router firewalls are just very cool.",
  "Firewalls need a whole video on their own because of how complicated they are. But for now, for the purpose of this video, firewall is just a device that's placed on the exterior of the network. It can track sessions and facilitating traffic going into and out of the network.",
  "And that's everything. I just want to give a huge shout out to my four channel members. Thank you guys so much. If you want to become a channel member, you can click the join button beside the subscribe button below, but of course, not required.",
  "The best way you can continue to support me is continue watching my videos and like and subscribe. So, I hope you enjoyed the video. If you want to watch another video, go click this link right here. Uh, but until then, let me know what videos you guys want to see in the comments, and I'll see you guys next",
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

type Rule = { action: "permit" | "deny"; text: string };
const RULES: Rule[] = [
  { action: "deny", text: "Guest VLAN traffic entering the HR VLAN" },
  { action: "deny", text: "All port 23 traffic" },
  { action: "permit", text: "Everything else" },
];

function RuleRow({ r, i, state }: { r: Rule; i: number; state?: "checking" | "match" | "skipped" | "idle" }) {
  const c = r.action === "deny" ? "#FF8A7A" : "#5FD4C4";
  return (
    <motion.div
      layout
      animate={{
        backgroundColor: state === "match" ? `${c}55` : state === "checking" ? "rgba(255,181,71,0.25)" : "rgba(11,36,71,0.7)",
        opacity: state === "skipped" ? 0.35 : 1,
        x: state === "checking" ? 6 : 0,
        boxShadow: state === "match" ? `0 0 16px ${c}88` : "0 0 0 transparent",
      }}
      className="relative flex items-center gap-2 rounded-md px-2 py-1.5 ring-1 ring-[#7FB5FF]/30"
    >
      {state === "checking" && (
        <motion.span layoutId="rule-pkt" className="absolute -left-7 text-base" transition={{ type: "spring", stiffness: 220, damping: 20 }}>
          📦
        </motion.span>
      )}
      <span className="w-4 shrink-0 text-[10px] text-[#7FB5FF]">{i + 1}</span>
      <span className="w-12 shrink-0 rounded px-1 text-center font-mono text-[11px] font-bold text-[#0B2447]" style={{ backgroundColor: c }}>
        {r.action}
      </span>
      <span className="min-w-0 flex-1 text-xs text-[#EAF1FB]">{r.text}</span>
      {state === "match" && (
        <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 10 }} className="text-sm">
          {r.action === "deny" ? "🚫" : "✅"}
        </motion.span>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 – ACL on a router interface                                       */
/* ------------------------------------------------------------------ */

function AclAttachVisual() {
  const [on, setOn] = useState(false);
  const reduce = useReducedMotion();
  const list = (
    <motion.div
      layoutId="acl-card"
      className="w-full space-y-1.5 rounded-lg bg-[#123A6B] p-2 ring-1 ring-[#FFB547]"
      style={{ boxShadow: "0 0 18px rgba(255,181,71,.25)" }}
    >
      <p className="text-[11px] font-semibold text-[#FFB547]">Access control list</p>
      {RULES.map((r, i) => (
        <RuleRow key={i} r={r} i={i} />
      ))}
    </motion.div>
  );
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:items-center sm:gap-4">
        <div className="sm:min-h-[9.5rem]">{!on && list}</div>
        <motion.div
          animate={{ boxShadow: on ? "0 0 20px rgba(95,212,196,.35)" : "0 0 0 transparent" }}
          className="rounded-xl border-2 border-[#5FD4C4] bg-[#5FD4C4]/10 p-2"
        >
          <p className="mb-2 text-center text-sm font-semibold text-[#EAF1FB]">📟 Router</p>
          <div className="rounded-lg border-2 border-dashed border-[#7FB5FF]/60 p-1.5">
            <p className="mb-1 text-center text-[10px] text-[#7FB5FF]">Interface</p>
            <div className="min-h-[2.5rem] sm:min-h-[7.5rem]">{on && list}</div>
          </div>
        </motion.div>
      </div>
      {/* traffic reaching the interface: with the list on, some of it is stopped */}
      <div className="relative h-8 overflow-hidden rounded bg-[#0B2447]/60" aria-hidden>
        <div className="absolute inset-y-0 left-[70%] w-0.5 bg-[#FFB547]/70" />
        {!reduce &&
          [0, 1, 2, 3].map((i) => {
            const blocked = on && i % 2 === 1;
            return (
              <motion.span
                key={`${on}-${i}`}
                className="absolute top-1/2 -translate-y-1/2 text-base"
                initial={{ left: "-4%" }}
                animate={blocked ? { left: ["-4%", "64%", "64%"], opacity: [1, 1, 0] } : { left: "104%" }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: i * 0.6 }}
              >
                📦
              </motion.span>
            );
          })}
        {on && (
          <motion.span
            className="absolute left-[70%] top-1/2 -translate-y-1/2 text-base"
            animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            🚫
          </motion.span>
        )}
      </div>
      <Caption>{on ? "A list of permit and deny statements, on a router interface." : "A list of permit and deny statements."}</Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={() => setOn((o) => !o)}>
        {on ? "Take it off the interface" : "Put it on the router interface"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – the example rules                                               */
/* ------------------------------------------------------------------ */

const PACKETS = [
  { id: "gh", label: "Guest VLAN → HR VLAN", guestToHr: true, port: 443 },
  { id: "t23", label: "IT VLAN → a server on port 23", guestToHr: false, port: 23 },
  { id: "web", label: "HR VLAN → web on port 443", guestToHr: false, port: 443 },
];

function RuleTestVisual() {
  const [on, setOn] = useState([true, true]);
  const [pk, setPk] = useState<string | null>(null);
  const [fly, setFly] = useState<{ id: number; blocked: boolean } | null>(null);
  const reduce = useReducedMotion();
  const isBlocked = (x: (typeof PACKETS)[number], rules = on) => (rules[0] && x.guestToHr) || (rules[1] && x.port === 23);
  const p = PACKETS.find((x) => x.id === pk);
  const blocked = p ? isBlocked(p) : false;
  const send = (x: (typeof PACKETS)[number]) => {
    setPk(x.id);
    setFly((f) => ({ id: (f?.id ?? 0) + 1, blocked: isBlocked(x) }));
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="space-y-1.5">
        {RULES.slice(0, 2).map((r, i) => (
          <button key={i} type="button" role="switch" aria-checked={on[i]} onClick={() => setOn((s) => s.map((v, j) => (j === i ? !v : v)))} className={`flex w-full items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-left ${ring} ${on[i] ? "border-[#FF8A7A] bg-[#FF8A7A]/10" : "border-[#7FB5FF]/30 opacity-60"}`}>
            <span className="text-xs text-[#EAF1FB]">
              <b className="text-[#FF8A7A]">deny</b> {r.text}
            </span>
            <span className="text-[11px] text-[#7FB5FF]">{on[i] ? "on" : "off"}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-[#7FB5FF]">Try some traffic</p>
      <div className="flex flex-wrap justify-center gap-2">
        {PACKETS.map((x) => (
          <button key={x.id} type="button" aria-pressed={pk === x.id} onClick={() => send(x)} className={`rounded-full border px-3 py-1 text-xs ${ring} ${pk === x.id ? "border-[#FFB547] bg-[#FFB547]/15 text-[#EAF1FB]" : "border-[#7FB5FF]/40 text-[#7FB5FF]"}`}>
            📦 {x.label}
          </button>
        ))}
      </div>
      {/* the packet runs at the router's gate */}
      <div className="relative h-10 overflow-hidden rounded bg-[#0B2447]/60" aria-hidden>
        <span className="absolute left-[55%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">🧱</span>
        {fly && !reduce && (
          <>
            <motion.span
              key={fly.id}
              className="absolute top-1/2 -translate-y-1/2 text-lg"
              initial={{ left: "4%" }}
              animate={fly.blocked ? { left: ["4%", "46%", "38%", "4%"] } : { left: ["4%", "46%", "94%"] }}
              transition={{ duration: 1.7, times: fly.blocked ? [0, 0.5, 0.62, 1] : [0, 0.5, 1], ease: "easeInOut" }}
            >
              📦
            </motion.span>
            <motion.span
              key={`fx-${fly.id}`}
              className="absolute left-[55%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, delay: 0.8 }}
            >
              {fly.blocked ? "💥" : "✨"}
            </motion.span>
          </>
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${pk}-${blocked}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`mx-auto rounded-xl px-5 py-2 text-sm font-bold text-[#0B2447] ${!p ? "bg-[#7FB5FF]/40 text-[#EAF1FB]" : blocked ? "bg-[#FF8A7A]" : "bg-[#5FD4C4]"}`}>
          {!p ? "Pick a packet" : blocked ? "🚫 Blocked" : "✅ Allowed"}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – top to bottom                                                   */
/* ------------------------------------------------------------------ */

function TopDownVisual() {
  const [pk, setPk] = useState(PACKETS[2].id);
  const [step, setStep] = useState(-1);
  const [matched, setMatched] = useState<number | null>(null);
  const { later, clear } = useTimers();
  const p = PACKETS.find((x) => x.id === pk)!;
  const matchIndex = p.guestToHr ? 0 : p.port === 23 ? 1 : 2;
  const run = () => {
    clear();
    setMatched(null);
    setStep(0);
    for (let i = 1; i <= matchIndex; i++) later(() => setStep(i), i * 900);
    later(() => setMatched(matchIndex), matchIndex * 900 + 800);
  };
  const state = (i: number) => (matched !== null ? (i === matched ? "match" : i > matched ? "skipped" : "idle") : step === i ? "checking" : "idle");
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {PACKETS.map((x) => (
          <button key={x.id} type="button" aria-pressed={pk === x.id} onClick={() => { setPk(x.id); setStep(-1); setMatched(null); clear(); }} className={`rounded-full border px-3 py-1 text-xs ${ring} ${pk === x.id ? "border-[#FFB547] bg-[#FFB547]/15 text-[#EAF1FB]" : "border-[#7FB5FF]/40 text-[#7FB5FF]"}`}>
            📦 {x.label}
          </button>
        ))}
      </div>
      <div className="relative space-y-1.5 pl-8">
        <span className="absolute left-1 top-0 text-xs text-[#7FB5FF]">↓</span>
        <div aria-hidden className="absolute bottom-2 left-[14px] top-5 w-0.5 rounded bg-[#7FB5FF]/25" />
        {RULES.map((r, i) => (
          <RuleRow key={i} r={r} i={i} state={state(i)} />
        ))}
      </div>
      <Caption>
        {matched === null ? "The router checks every packet against the rules from top to bottom." : `Rule ${matched + 1} matched: ${RULES[matched].action === "deny" ? "🚫 blocked" : "✅ permitted"}.`}
      </Caption>
      <button type="button" className={`${solid} mx-auto`} onClick={run}>
        Check the packet
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 – what firewalls can do                                           */
/* ------------------------------------------------------------------ */

const FW = [
  { t: "Act as a firewall", icon: "🧱" },
  { t: "Control traffic", icon: "🚦" },
  { t: "Intrusion prevention system", icon: "🛡️" },
];

function FirewallAbilitiesVisual() {
  const [sel, setSel] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="grid grid-cols-3 gap-2">
        {FW.map((f, i) => (
          <motion.button
            key={f.t}
            type="button"
            aria-pressed={sel === i}
            onClick={() => setSel(i)}
            animate={{ boxShadow: sel === i ? "0 0 16px rgba(255,181,71,.4)" : "0 0 0 transparent" }}
            className={`rounded-lg border-2 px-2 py-2 text-center ${ring} ${sel === i ? "border-[#FFB547] bg-[#FFB547]/10" : "border-[#7FB5FF]/30"}`}
          >
            <div className="text-2xl">{f.icon}</div>
            <div className="text-[11px] leading-tight text-[#EAF1FB]">{f.t}</div>
          </motion.button>
        ))}
      </div>
      <div className="relative h-32 overflow-hidden rounded-xl bg-[#0B2447]/80 ring-1 ring-[#7FB5FF]/30">
        <AnimatePresence mode="wait">
          <motion.div key={sel} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl"
              animate={reduce ? undefined : { filter: ["drop-shadow(0 0 0 #FFB547)", "drop-shadow(0 0 14px #FFB547)", "drop-shadow(0 0 0 #FFB547)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {FW[sel].icon}
            </motion.span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl">🌐</span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl">🏢</span>
            {sel === 0 &&
              [0, 1].map((i) => (
                <Fragment key={i}>
                  <motion.span className="absolute top-1/2 -translate-y-1/2 text-lg" initial={{ left: "14%" }} animate={{ left: "40%" }} transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 0.5, delay: i * 0.7 }}>
                    👾
                  </motion.span>
                  <motion.span
                    className="absolute left-[42%] top-[30%] text-lg"
                    animate={{ opacity: [0, 1, 0], scale: [0.4, 1.4, 1.6] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.3, delay: 1.3 + i * 0.7 }}
                  >
                    💥
                  </motion.span>
                </Fragment>
              ))}
            {sel === 1 &&
              [0, 1, 2, 3].map((i) => (
                <motion.span key={i} className="absolute top-1/2 -translate-y-1/2 text-lg" initial={{ left: "14%", opacity: 1 }} animate={i % 2 ? { left: "40%", opacity: [1, 1, 0] } : { left: "82%" }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45 }}>
                  {i % 2 ? "🚫" : "📦"}
                </motion.span>
              ))}
            {sel === 2 && (
              <>
                <motion.span className="absolute left-[18%] top-1/2 -translate-y-1/2 text-2xl" animate={{ x: [0, 40, 40, 40], opacity: [1, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  🕵️
                </motion.span>
                <motion.span className="absolute left-[44%] top-3 rounded bg-[#FF8A7A] px-1.5 text-[10px] font-bold text-[#0B2447]" animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, times: [0.2, 0.35, 0.65, 0.8] }}>
                  Intrusion spotted
                </motion.span>
                <motion.span className="absolute left-[56%] top-[58%] text-xl" animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.5, 0.5, 1.3, 1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                  ✋
                </motion.span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <Caption>
        {sel === 0 ? "They can act as a firewall." : sel === 1 ? "They can control traffic." : "They can spot intrusions and then just prevent it."}
      </Caption>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – a firewall can do everything a router can, and more             */
/* ------------------------------------------------------------------ */

function RouterFirewallVisual() {
  const [fw, setFw] = useState(false);
  const reduce = useReducedMotion();
  const base = ["Routes traffic between networks", "Does NAT and stuff"];
  const extra = ["Controls traffic", "Intrusion prevention system", "More secure"];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex justify-center gap-2">
        {[false, true].map((v) => (
          <button key={String(v)} type="button" aria-pressed={fw === v} onClick={() => setFw(v)} className={`rounded-full px-5 py-1.5 text-sm ${ring} ${fw === v ? "bg-[#FFB547] font-semibold text-[#0B2447]" : "border border-[#7FB5FF]/60 text-[#EAF1FB]"}`}>
            {v ? "Firewall" : "Router"}
          </button>
        ))}
      </div>
      <motion.div
        layout
        animate={{ boxShadow: fw && !reduce ? ["0 0 0 rgba(255,181,71,0)", "0 0 22px rgba(255,181,71,.5)", "0 0 0 rgba(255,181,71,0)"] : "0 0 0 transparent" }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
        className={`mx-auto w-full max-w-xs space-y-2 rounded-xl border-2 p-3 ${fw ? "border-[#FFB547] bg-[#FFB547]/10" : "border-[#5FD4C4] bg-[#5FD4C4]/10"}`}
      >
        <p className="text-center text-sm font-semibold text-[#EAF1FB]">{fw ? "🧱 Router firewall" : "📟 Router"}</p>
        {base.map((b) => (
          <motion.div layout key={b} className="rounded bg-[#0B2447]/70 px-2 py-1.5 text-xs text-[#EAF1FB]">
            ✅ {b}
          </motion.div>
        ))}
        <AnimatePresence>
          {fw &&
            extra.map((x, i) => (
              <motion.div key={x} layout initial={{ opacity: 0, x: -24, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.15, type: "spring", stiffness: 260, damping: 18 }} className="rounded bg-[#FFB547] px-2 py-1.5 text-xs font-semibold text-[#0B2447]">
                ➕ {x}
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
      <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#0B2447]" aria-hidden>
        <motion.div
          className="h-full bg-gradient-to-r from-[#5FD4C4] to-[#FFB547]"
          animate={{ width: fw ? "100%" : "40%" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <Caption>{fw ? "Everything a router can do, but also more secure. Router firewalls are just very cool." : "A router routes and does NAT."}</Caption>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – firewall at the exterior, tracking sessions                     */
/* ------------------------------------------------------------------ */

function PerimeterVisual() {
  const [sessions, setSessions] = useState<string[]>([]);
  const [msg, setMsg] = useState("A firewall sits on the exterior of the network.");
  const [flight, setFlight] = useState<{ id: number; dir: "out" | "in"; pass: boolean } | null>(null);
  const reduce = useReducedMotion();
  const open = () => {
    setSessions((s) => (s.includes("PC1 ⇄ youtube.com") ? s : [...s, "PC1 ⇄ youtube.com"]));
    setMsg("Traffic going out. The firewall tracks the session.");
    setFlight((f) => ({ id: (f?.id ?? 0) + 1, dir: "out", pass: true }));
  };
  const back = () => {
    const pass = sessions.length > 0;
    setMsg(pass ? "Return traffic for a tracked session: let in." : "Traffic coming in with no session: blocked.");
    setFlight((f) => ({ id: (f?.id ?? 0) + 1, dir: "in", pass }));
  };
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="relative">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-xl border-2 border-dashed border-[#5FD4C4] p-2 text-center">
            <p className="text-[11px] text-[#5FD4C4]">The network</p>
            <p className="text-2xl">💻 🖥️</p>
            <p className="rounded bg-[#7FB5FF] text-[10px] font-semibold text-[#0B2447]">Switch</p>
          </div>
          <motion.div animate={{ boxShadow: ["0 0 0 0 rgba(255,181,71,0)", "0 0 0 8px rgba(255,181,71,0.35)", "0 0 0 0 rgba(255,181,71,0)"] }} transition={{ repeat: Infinity, duration: 2.4 }} className="rounded-lg bg-[#FFB547] px-2 py-3 text-center text-xs font-bold text-[#0B2447]">
            🧱
            <br />
            Firewall
          </motion.div>
          <div className="rounded-xl border-2 border-dashed border-[#7FB5FF] p-2 text-center">
            <p className="text-[11px] text-[#7FB5FF]">Outside</p>
            <p className="text-3xl">🌐</p>
          </div>
        </div>
        {/* the packet crossing the firewall */}
        {flight && !reduce && (
          <>
            <motion.span
              key={flight.id}
              aria-hidden
              className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-xl"
              style={{ marginLeft: -10 }}
              initial={{ left: flight.dir === "out" ? "14%" : "86%" }}
              animate={
                flight.dir === "out"
                  ? { left: ["14%", "50%", "86%"] }
                  : flight.pass
                    ? { left: ["86%", "50%", "14%"] }
                    : { left: ["86%", "58%", "74%"] }
              }
              transition={{ duration: 1.6, ease: "easeInOut" }}
            >
              📦
            </motion.span>
            <motion.span
              key={`fx-${flight.id}`}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-2xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, delay: 0.7 }}
            >
              {flight.pass ? "✅" : "🚫"}
            </motion.span>
          </>
        )}
      </div>
      <div className="mx-auto w-full max-w-xs overflow-hidden rounded-lg ring-1 ring-[#7FB5FF]/40">
        <div className="bg-[#7FB5FF] px-2 py-1 text-center text-[11px] font-bold text-[#0B2447]">Tracked sessions</div>
        <div className="min-h-[2.2rem] bg-[#0B2447]/70 px-2 py-1.5 font-mono text-xs text-[#EAF1FB]">
          <AnimatePresence>
            {sessions.map((s) => (
              <motion.p key={s} initial={{ opacity: 0, backgroundColor: "#FFB547", x: 16 }} animate={{ opacity: 1, backgroundColor: "rgba(255,181,71,0)", x: 0 }} transition={{ duration: 0.9 }}>
                {s}
              </motion.p>
            ))}
          </AnimatePresence>
          {sessions.length === 0 && <span className="text-[#7FB5FF]">None yet</span>}
        </div>
      </div>
      <Caption>{msg}</Caption>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={solid} onClick={open}>
          Send traffic out
        </button>
        <button type="button" className={chip} onClick={back}>
          Traffic comes in
        </button>
        <button type="button" className={chip} onClick={() => { setSessions([]); setFlight(null); setMsg("A firewall sits on the exterior of the network."); }}>
          Reset
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7 – that's everything                                               */
/* ------------------------------------------------------------------ */

function RecapVisual() {
  const layers = [
    { n: "Layer 4", t: "Ports, segments, TCP and UDP", c: "#FFB547" },
    { n: "Layer 3", t: "IP addresses, routers, DHCP, DNS, NAT", c: "#7FB5FF" },
    { n: "Layer 2", t: "MAC addresses, switches, VLANs, STP, LACP", c: "#5FD4C4" },
    { n: "Layer 1", t: "Cables, light and radio waves", c: "#EAF1FB" },
  ];
  const [done, setDone] = useState<string[]>([]);
  const reduce = useReducedMotion();
  const all = done.length === 4;
  return (
    <div className="relative flex h-full flex-col justify-center gap-3 overflow-hidden">
      {/* confetti when every layer is ticked */}
      {all && !reduce &&
        Array.from({ length: 16 }, (_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute bottom-0 text-base"
            style={{ left: `${(i * 6.3) % 96}%` }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{ y: -260 - (i % 4) * 30, opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 220 }}
            transition={{ duration: 2.2 + (i % 3) * 0.3, delay: (i % 5) * 0.12 }}
          >
            {i % 3 === 0 ? "🎉" : i % 3 === 1 ? "✨" : "❤️"}
          </motion.span>
        ))}
      <div className="relative space-y-1.5">
        {layers.map((l, k) => {
          const on = done.includes(l.n);
          return (
            <motion.button
              key={l.n}
              type="button"
              aria-pressed={on}
              onClick={() => setDone((d) => (d.includes(l.n) ? d.filter((x) => x !== l.n) : [...d, l.n]))}
              animate={{ opacity: on ? 1 : 0.7, x: on ? 6 : 0, boxShadow: on ? `0 0 16px ${l.c}99` : "0 0 0 transparent" }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[#0B2447] ${ring}`}
              style={{ backgroundColor: l.c }}
            >
              <span>
                <b className="text-sm">{l.n}</b> <span className="text-xs">{l.t}</span>
              </span>
              <motion.span key={String(on)} className="text-lg" initial={{ scale: 0.4, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 10 }}>
                {on ? "✅" : "⬜"}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.span key={i} className="text-2xl" animate={reduce ? {} : { y: [0, -8, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.25 }}>
            ❤️
          </motion.span>
        ))}
      </div>
      <Caption>A huge shout out to my four channel members. Thank you guys so much.</Caption>
      <p className="text-center text-xs text-[#7FB5FF]">{all ? "That's everything." : "Tap each layer as you check it off"}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 8 – support, then finish                                            */
/* ------------------------------------------------------------------ */

function SupportVisual() {
  const acts = [
    { id: "like", icon: "👍", off: "Like", on: "Liked" },
    { id: "sub", icon: "🔔", off: "Subscribe", on: "Subscribed" },
    { id: "com", icon: "💬", off: "Comment", on: "Commented" },
  ];
  const [on, setOn] = useState<string[]>([]);
  const [bursts, setBursts] = useState<Record<string, number>>({});
  const reduce = useReducedMotion();
  const all = on.length === 3;
  const toggle = (id: string) => {
    if (!on.includes(id)) setBursts((b) => ({ ...b, [id]: (b[id] ?? 0) + 1 }));
    setOn((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  return (
    <div className="relative flex h-full flex-col justify-center gap-4 overflow-hidden">
      {all && !reduce &&
        Array.from({ length: 18 }, (_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute bottom-0 text-lg"
            style={{ left: `${(i * 5.7) % 96}%` }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{ y: -280 - (i % 4) * 25, opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 240 }}
            transition={{ duration: 2.4 + (i % 3) * 0.3, delay: (i % 6) * 0.1 }}
          >
            {i % 3 === 0 ? "🎉" : i % 3 === 1 ? "✨" : "🎓"}
          </motion.span>
        ))}
      <div className="relative grid grid-cols-3 gap-3">
        {acts.map((a) => {
          const v = on.includes(a.id);
          return (
            <motion.button
              key={a.id}
              type="button"
              aria-pressed={v}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(a.id)}
              animate={{ backgroundColor: v ? "#FFB547" : "rgba(11,36,71,0.7)", boxShadow: v ? "0 0 20px rgba(255,181,71,.6)" : "0 0 0 transparent" }}
              className={`relative rounded-xl py-5 text-center ring-1 ring-[#7FB5FF]/40 ${ring} ${v ? "text-[#0B2447]" : "text-[#EAF1FB]"}`}
            >
              {v && !reduce &&
                [0, 1, 2, 3, 4, 5].map((k) => {
                  const ang = (k / 6) * Math.PI * 2;
                  return (
                    <motion.span
                      key={`${a.id}-${bursts[a.id]}-${k}`}
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 text-sm"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                      animate={{ x: Math.cos(ang) * 42, y: Math.sin(ang) * 42, opacity: 0, scale: 1.2 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      {a.icon}
                    </motion.span>
                  );
                })}
              <motion.div
                animate={v ? (a.id === "sub" ? { rotate: [0, -28, 28, -18, 18, 0], scale: [1, 1.4, 1] } : { rotate: [0, -20, 20, 0], scale: [1, 1.4, 1] }) : {}}
                transition={{ duration: 0.7 }}
                className="text-3xl"
              >
                {a.icon}
              </motion.div>
              <div className="text-xs font-semibold">{v ? a.on : a.off}</div>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {all && (
          <motion.div initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 240, damping: 14 }} className="relative mx-auto rounded-2xl bg-[#5FD4C4] px-5 py-3 text-center font-semibold text-[#0B2447]" style={{ boxShadow: "0 0 26px rgba(95,212,196,.6)" }}>
            🎓 You made it through the whole journey
            <p className="text-xs font-normal">From the cable in the wall to a server on the other side of the world</p>
          </motion.div>
        )}
      </AnimatePresence>
      <Caption>{all ? "See you next time." : "The best way to keep supporting: keep watching, and like and subscribe."}</Caption>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  AclAttachVisual,
  RuleTestVisual,
  TopDownVisual,
  FirewallAbilitiesVisual,
  RouterFirewallVisual,
  PerimeterVisual,
  RecapVisual,
  SupportVisual,
];

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

type Props = { onComplete?: () => void };

// Stage height on phones, per beat (from sm up it is always 24rem).
const STAGE_H = [
  "h-[28rem]", "h-[26rem]", "h-[26rem]", "h-[22rem]",
  "h-[24rem]", "h-[24rem]", "h-[24rem]", "h-[22rem]",
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

export default function Section11SecurityOutro({ onComplete }: Props) {
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
      aria-label="Section 11: Security and wrap-up"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Security: ACLs and firewalls</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
          {/* the whole stack, every layer on */}
          <div className="flex flex-col gap-1 pt-1" aria-hidden>
            {LAYER_BARS.map((c) => (
              <motion.span
                key={c}
                className="block h-1.5 w-9 rounded-sm"
                style={{ backgroundColor: c }}
                animate={reduce ? undefined : { boxShadow: [`0 0 0 ${c}00`, `0 0 10px ${c}`, `0 0 0 ${c}00`] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: LAYER_BARS.indexOf(c) * 0.3 }}
              />
            ))}
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

        <p key={step} className="min-h-[10rem] font-serif text-lg leading-relaxed sm:text-xl">
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
              Finish the course
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
