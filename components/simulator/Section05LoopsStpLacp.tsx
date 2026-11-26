"use client"; // harmless in Vite/CRA, required if you use the Next.js app router

/**
 * Section 5 – Switch loops, Spanning Tree Protocol and LACP
 * Transcript range: 06:14 – 08:44
 *
 * Dependencies: react, motion/react, tailwindcss
 * Usage:  <Section05LoopsStpLacp onComplete={() => goToSection(6)} />
 */

import { Fragment, useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ------------------------------------------------------------------ */
/* Transcript (06:14 – 08:44)                                          */
/* ------------------------------------------------------------------ */

const BEATS: string[] = [
  "But what if you start expanding even more? And now you have three switches and you interconnect them together all with trunk ports like this. Perfect.",
  "But what if you want to add a backup cable just in case one of these ports go down or one of these cables go bad. Now if we do this, that's perfect. But there's a huge problem here. And there's a huge problem here because of the nature of how switches work.",
  "Now let's say PC1 on switch one wants to send a message to PC2 on switch 2. Now since switch one doesn't know where PC2 is, it will send an unknown unicast flooding that frame out of every interface except the one it was received on. Now when switch two and switch three get that unknown unicast, they will also send an unknown unicast because they don't know where the destination is either.",
  "And now the problem starts. This unknown unicast loop will continue forever until the switches die. All right, this will create something called a broadcast storm where the switches will keep sending each other frames over and over and over in a cycle.",
  "And because layer 2 doesn't have some kind of like limit on how long a frame will be sent for until it gets dropped, it'll keep cycling forever and ever until the switch's CPU load is so high that it can't route normal traffic or it can't forward normal traffic.",
  "So what's the solution to this? This is where an extremely important concept comes in. Spanning tree protocol or STP. STP will block a redundant interface so that this loop never happens in the first place. But the way it decides which interface to block is a little bit complicated. So I'll go over that in another video.",
  "And talking about connections to different switches, it's kind of impractical for a single Ethernet cable to connect two switches together because let's say we have 50 PCs connect to this switch and they all want to talk to a device on the other switch. That one Ethernet cable is a huge bottleneck. Like imagine all those 50 PCs trying to send traffic over that single wire at the same time. It's not going to work.",
  "And also redundancy. If this one cable breaks, that whole connection is gone. There's no backup.",
  "So one obvious solution is, oh, why don't you just plug in another cable? Well, we just talked about this spanning tree protocol. Spanning tree protocol will block one of these interfaces so that a loop never happens. So the second cable will just sit there doing nothing because it's blocked. I mean technically you could do that just for redundancy because if the primary cable go down then the span the block spanning tree cable will go up. But still it's not good for one cable to carry the load of 50 different computers.",
  "So how do we solve this problem? With something called LACP. LACP lets you take multiple physical cables and bundle them together. So the switch thinks that they're one logical link. And now since the switches only see one logical link, spanning tree won't block that port. And with that one big logical link, the bandwidth goes up and redundancy goes up. And with that, we've learned everything we needed to for the local network. Key word there, local network.",
];

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB547]";
const chip = `rounded-full border border-[#7FB5FF] px-4 py-1.5 text-sm text-[#EAF1FB] hover:bg-[#7FB5FF]/20 disabled:opacity-40 ${ring}`;
const solid = `rounded-full bg-[#FFB547] px-4 py-1.5 text-sm font-semibold text-[#0B2447] disabled:opacity-40 ${ring}`;

const N = { 1: { x: 55, y: 55 }, 2: { x: 245, y: 55 }, 3: { x: 150, y: 150 } } as const;
type NodeId = 1 | 2 | 3;
const E = { a: [1, 2], b: [2, 3], c: [1, 3] } as const;
type EdgeId = keyof typeof E;
type Status = "broken" | "blocked";

/** Blend from calm blue to alarm red. t in 0..1. */
function heatColor(t: number) {
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(127 + 128 * k)},${Math.round(181 - 43 * k)},${Math.round(255 - 133 * k)})`;
}

/** A frame flying from one switch to another (stays at the destination). */
function Dot({ from, to, delay = 0, dur = 1, color = "#FFB547", repeat = 0 }: { from: NodeId; to: NodeId; delay?: number; dur?: number; color?: string; repeat?: number }) {
  const A = N[from];
  const B = N[to];
  const t = { duration: dur, delay, repeat, ease: "linear" as const };
  return (
    <>
      <motion.circle r="9" fill={color} fillOpacity={0.3} initial={{ cx: A.x, cy: A.y, opacity: 0 }} animate={{ cx: B.x, cy: B.y, opacity: 1 }} transition={t} />
      <motion.circle r="5" fill={color} initial={{ cx: A.x, cy: A.y, opacity: 0 }} animate={{ cx: B.x, cy: B.y, opacity: 1 }} transition={t} />
    </>
  );
}

/** A frame that follows a multi-hop route forever. */
function RouteDot({ path, delay = 0, dur = 2, color = "#FFB547" }: { path: NodeId[]; delay?: number; dur?: number; color?: string }) {
  const xs = path.map((p) => N[p].x);
  const ys = path.map((p) => N[p].y);
  const t = { duration: dur, delay, repeat: Infinity, ease: "linear" as const };
  return (
    <>
      <motion.circle r="9" fill={color} fillOpacity={0.3} initial={{ cx: xs[0], cy: ys[0], opacity: 0 }} animate={{ cx: xs, cy: ys, opacity: 1 }} transition={t} />
      <motion.circle r="5" fill={color} initial={{ cx: xs[0], cy: ys[0], opacity: 0 }} animate={{ cx: xs, cy: ys, opacity: 1 }} transition={t} />
    </>
  );
}

/** A frame circling 1 → 2 → 3 → 1 forever. */
function LoopDot({ delay = 0, dur = 3, color = "#FFB547" }: { delay?: number; dur?: number; color?: string }) {
  return <RouteDot path={[1, 2, 3, 1]} delay={delay} dur={dur} color={color} />;
}

/** An expanding ring at a switch: "the frame is being flooded from here". */
function Ring({ at, delay = 0, color = "#FFB547" }: { at: NodeId; delay?: number; color?: string }) {
  return (
    <motion.circle
      cx={N[at].x}
      cy={N[at].y}
      fill="none"
      stroke={color}
      strokeWidth={2}
      initial={{ r: 10, opacity: 0.8 }}
      animate={{ r: 48, opacity: 0 }}
      transition={{ duration: 1.3, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

function Topology({
  edges,
  status = {},
  onEdge,
  label,
  children,
  heat = 0,
  alarm = false,
}: {
  edges: EdgeId[];
  status?: Partial<Record<EdgeId, Status>>;
  onEdge?: (e: EdgeId) => void;
  label?: string;
  children?: ReactNode;
  heat?: number;
  alarm?: boolean;
}) {
  const reduce = useReducedMotion();
  const nodeFill = heatColor(heat);
  const edgeColor = heat > 0 ? heatColor(Math.min(1, heat + 0.2)) : "#7FB5FF";
  return (
    <svg viewBox="0 0 300 190" className="h-full w-full" role="img" aria-label={label ?? "Three switches connected by cables"}>
      {edges.map((e) => {
        const A = N[E[e][0]];
        const B = N[E[e][1]];
        const s = status[e];
        const len = Math.hypot(B.x - A.x, B.y - A.y);
        const port = (P: { x: number; y: number }, Q: { x: number; y: number }) => ({
          x: P.x + ((Q.x - P.x) / len) * 34,
          y: P.y + ((Q.y - P.y) / len) * 34,
        });
        const pa = port(A, B);
        const pb = port(B, A);
        const col = s === "broken" ? "#FF8A7A" : s === "blocked" ? "#FFB547" : edgeColor;
        return (
          <g key={e}>
            {!s && (
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeOpacity={0.18} strokeWidth={9} strokeLinecap="round" />
            )}
            <motion.line
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke={col}
              strokeWidth={3}
              strokeOpacity={s === "blocked" ? 0.7 : 1}
              strokeDasharray={s ? "6 5" : undefined}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
            {!s && !reduce && (
              <motion.line
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke="#FFFFFF"
                strokeOpacity={0.4}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray="1 11"
                animate={{ strokeDashoffset: [0, -12] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
            {/* port lights at both ends of the cable */}
            <circle cx={pa.x} cy={pa.y} r={3.5} fill={s === "broken" ? "#FF8A7A" : "#5FD4C4"} stroke="#0B2447" strokeWidth={1} />
            <circle cx={pb.x} cy={pb.y} r={3.5} fill={s === "broken" ? "#FF8A7A" : s === "blocked" ? "#FFB547" : "#5FD4C4"} stroke="#0B2447" strokeWidth={1} />
            {onEdge && (
              <line
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Cable ${e}: ${s ?? "working"}. Activate to toggle.`}
                onClick={() => onEdge(e)}
                onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && onEdge(e)}
              />
            )}
            {s && (
              <motion.text
                x={(A.x + B.x) / 2}
                y={(A.y + B.y) / 2 + 6}
                textAnchor="middle"
                fontSize="16"
                initial={{ scale: 0 }}
                animate={s === "broken" && !reduce ? { scale: 1, opacity: [1, 0.35, 1] } : { scale: 1, opacity: 1 }}
                transition={s === "broken" ? { opacity: { duration: 0.6, repeat: Infinity } } : { type: "spring", stiffness: 300, damping: 12 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {s === "broken" ? "✖️" : "✋"}
              </motion.text>
            )}
          </g>
        );
      })}
      {([1, 2, 3] as NodeId[]).map((i) => (
        <motion.g
          key={i}
          animate={alarm && !reduce ? { x: [0, -1.5, 1.5, -1, 0] } : { x: 0 }}
          transition={alarm ? { duration: 0.35, repeat: Infinity } : { duration: 0.2 }}
        >
          {i !== 3 && <line x1={N[i].x} y1={N[i].y - 17} x2={N[i].x} y2={N[i].y - 12} stroke="#7FB5FF" strokeWidth={2} />}
          <motion.rect
            x={N[i].x - 28}
            y={N[i].y - 12}
            width="56"
            height="24"
            rx="4"
            animate={{ fill: nodeFill }}
            style={{ filter: heat > 0.5 ? `drop-shadow(0 0 6px ${nodeFill})` : "none" }}
          />
          <text x={N[i].x} y={N[i].y + 1} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0B2447">
            Switch {i}
          </text>
          {Array.from({ length: 6 }).map((_, k) => (
            <motion.rect
              key={k}
              x={N[i].x - 18 + k * 7}
              y={N[i].y + 5}
              width="5"
              height="3"
              rx="1"
              fill="#0B2447"
              animate={reduce ? undefined : { opacity: alarm ? [1, 0.2, 1] : k % 2 ? [1, 0.35, 1] : 1 }}
              transition={{ duration: alarm ? 0.3 : 1.4, repeat: Infinity, delay: k * 0.1 }}
            />
          ))}
        </motion.g>
      ))}
      <text x={N[1].x} y={N[1].y - 20} textAnchor="middle" fontSize="12" fill="#EAF1FB">💻 PC1</text>
      <text x={N[2].x} y={N[2].y - 20} textAnchor="middle" fontSize="12" fill="#EAF1FB">💻 PC2</text>
      {children}
    </svg>
  );
}

function connected(edges: EdgeId[], broken: Partial<Record<EdgeId, Status>>) {
  const live = edges.filter((e) => !broken[e]);
  const seen = new Set<number>([1]);
  let grew = true;
  while (grew) {
    grew = false;
    live.forEach((e) => {
      const [a, b] = E[e];
      if (seen.has(a) !== seen.has(b)) {
        seen.add(a);
        seen.add(b);
        grew = true;
      }
    });
  }
  return seen.size === 3;
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="min-h-[2.5rem] text-center text-[13px] leading-snug text-[#EAF1FB] sm:text-sm" aria-live="polite">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* 1 – three switches, trunk ports                                     */
/* ------------------------------------------------------------------ */

const TRUNK_COLORS = ["#FFB547", "#5FD4C4", "#FF8A7A"];

function ChainVisual() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex h-full flex-col items-center gap-2">
      <div className="min-h-0 w-full flex-1">
        <Topology edges={on ? ["a", "b"] : []}>
          {on && (
            <>
              {TRUNK_COLORS.map((c, k) => (
                <Fragment key={c}>
                  <Dot from={1} to={2} color={c} dur={1.6} delay={0.6 + k * 0.5} repeat={Infinity} />
                  <Dot from={2} to={1} color={c} dur={1.8} delay={1 + k * 0.5} repeat={Infinity} />
                  <Dot from={2} to={3} color={c} dur={1.6} delay={0.8 + k * 0.5} repeat={Infinity} />
                  <Dot from={3} to={2} color={c} dur={1.8} delay={1.2 + k * 0.5} repeat={Infinity} />
                </Fragment>
              ))}
            </>
          )}
        </Topology>
      </div>
      <Caption>{on ? "Three switches, interconnected with trunk ports." : "Three switches, no links yet."}</Caption>
      <button type="button" className={on ? chip : solid} onClick={() => setOn((o) => !o)}>
        {on ? "Unplug the trunks" : "Interconnect with trunk ports"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 – backup cable                                                    */
/* ------------------------------------------------------------------ */

function BackupVisual() {
  const [backup, setBackup] = useState(false);
  const [broken, setBroken] = useState<Partial<Record<EdgeId, Status>>>({});
  const edges: EdgeId[] = backup ? ["a", "b", "c"] : ["a", "b"];
  const ok = connected(edges, broken);
  const toggle = (e: EdgeId) => setBroken((p) => ({ ...p, [e]: p[e] ? undefined : "broken" }));
  const route: NodeId[] | null = !broken.a ? [1, 2] : backup && !broken.c && !broken.b ? [1, 3, 2] : null;
  return (
    <div className="flex h-full flex-col items-center gap-2">
      <div className="min-h-0 w-full flex-1">
        <Topology edges={edges} status={broken} onEdge={toggle}>
          {route && (
            <Fragment key={route.join("")}>
              {[0, 1, 2].map((k) => (
                <RouteDot key={k} path={route} delay={k * 0.7} dur={route.length === 2 ? 1.6 : 2.4} color="#5FD4C4" />
              ))}
            </Fragment>
          )}
        </Topology>
      </div>
      <Caption>{ok ? "Everything can still talk." : "A cable went bad and a switch is cut off."} Tap a cable to break or fix it.</Caption>
      <button type="button" className={solid} disabled={backup} onClick={() => setBackup(true)}>
        Add a backup cable
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 – flooding step by step                                           */
/* ------------------------------------------------------------------ */

function FloodStepsVisual() {
  const [stage, setStage] = useState(0);
  const text = [
    "PC1 on switch 1 wants to send a message to PC2 on switch 2.",
    "Switch 1 doesn't know where PC2 is. It floods the frame out of every interface except the one it was received on.",
    "Switch 2 and switch 3 get that unknown unicast. They don't know the destination either, so they send one too.",
  ];
  return (
    <div className="flex h-full flex-col items-center gap-2">
      <div className="min-h-0 w-full flex-1">
        <Topology edges={["a", "b", "c"]}>
          {stage === 0 && (
            <motion.text
              x={N[1].x + 34}
              y={N[1].y - 18}
              fontSize="14"
              animate={{ y: [N[1].y - 18, N[1].y - 24, N[1].y - 18], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              ✉️
            </motion.text>
          )}
          {stage === 1 && (
            <>
              <Ring at={1} />
              <Ring at={1} delay={0.6} />
              <Dot key="s1a" from={1} to={2} />
              <Dot key="s1b" from={1} to={3} />
            </>
          )}
          {stage === 2 && (
            <>
              <Ring at={2} />
              <Ring at={3} />
              <Dot key="s2a" from={2} to={3} />
              <Dot key="s2b" from={3} to={2} />
            </>
          )}
        </Topology>
      </div>
      <Caption>{text[stage]}</Caption>
      <div className="flex items-center gap-3">
        <div className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((k) => (
            <motion.span key={k} className="h-2 w-2 rounded-full" animate={{ backgroundColor: k <= stage ? "#FFB547" : "rgba(127,181,255,.35)", scale: k === stage ? 1.4 : 1 }} />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={solid} disabled={stage >= 2} onClick={() => setStage((s) => s + 1)}>
            Next step
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
/* 4 – broadcast storm                                                 */
/* ------------------------------------------------------------------ */

function StormVisual() {
  const [running, setRunning] = useState(false);
  const [frames, setFrames] = useState(2);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setFrames((f) => Math.min(f * 2, 1_048_576)), 900);
    return () => window.clearInterval(id);
  }, [running]);
  const dots = Math.min(frames, 18);
  const heat = running ? Math.min(1, Math.log2(frames) / 18) : 0;
  return (
    <div className="relative flex h-full flex-col items-center gap-2">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-xl"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,138,122,0) 30%, rgba(255,60,60,.55) 100%)" }}
        animate={{ opacity: heat * 0.9 }}
      />
      <div className="relative min-h-0 w-full flex-1">
        <Topology edges={["a", "b", "c"]} heat={heat} alarm={running && heat > 0.3}>
          {running && (
            <>
              <Ring at={1} color="#FF8A7A" />
              <Ring at={2} color="#FF8A7A" delay={0.4} />
              <Ring at={3} color="#FF8A7A" delay={0.8} />
              {Array.from({ length: dots }, (_, i) => (
                <LoopDot key={i} delay={i * 0.17} dur={2.4} color={i % 2 ? "#FFB547" : "#FF8A7A"} />
              ))}
            </>
          )}
        </Topology>
      </div>
      <motion.p
        key={running ? Math.log2(frames) : "idle"}
        className="relative font-mono text-sm text-[#FFB547]"
        aria-live="off"
        initial={reduce ? false : { scale: 1.25 }}
        animate={{ scale: 1, color: heat > 0.6 ? "#FF8A7A" : "#FFB547" }}
      >
        Frames cycling: {running ? frames.toLocaleString() : 1}
      </motion.p>
      <div className="relative flex flex-wrap justify-center gap-2">
        <button type="button" className={solid} disabled={running} onClick={() => setRunning(true)}>
          Send the unknown unicast
        </button>
        <button type="button" className={chip} onClick={() => { setRunning(false); setFrames(2); }}>
          Reset
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5 – no limit, CPU climbs                                            */
/* ------------------------------------------------------------------ */

function CpuVisual() {
  const [laps, setLaps] = useState(0);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [probe, setProbe] = useState<{ id: number; dropped: boolean } | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setLaps((l) => l + 1), 1200);
    return () => window.clearInterval(id);
  }, []);
  const cpu = Math.min(100, laps * 7);
  const sendNormal = () => {
    const dropped = cpu >= 90;
    setVerdict(dropped ? "Dropped. The switch can't forward normal traffic." : "Delivered. For now.");
    setProbe((p) => ({ id: (p?.id ?? 0) + 1, dropped }));
  };
  const mid = { x: (N[1].x + N[2].x) / 2, y: (N[1].y + N[2].y) / 2 };
  return (
    <div className="flex h-full flex-col items-center gap-2">
      <div className="min-h-0 w-full flex-1">
        <Topology edges={["a", "b", "c"]} heat={cpu / 100} alarm={cpu > 80}>
          <LoopDot dur={1.2} />
          <LoopDot dur={1.2} delay={0.6} color="#FF8A7A" />
          {probe && (
            <Fragment key={probe.id}>
              <motion.circle
                r="6"
                fill="#5FD4C4"
                stroke="#FFFFFF"
                strokeWidth={1.5}
                initial={{ cx: N[1].x, cy: N[1].y, opacity: 1 }}
                animate={probe.dropped ? { cx: mid.x, cy: mid.y, opacity: [1, 1, 0] } : { cx: N[2].x, cy: N[2].y, opacity: [1, 1, 0] }}
                transition={{ duration: 1.1, ease: "linear" }}
              />
              {probe.dropped && (
                <motion.text
                  x={mid.x}
                  y={mid.y - 8}
                  textAnchor="middle"
                  fontSize="16"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                  transition={{ delay: 0.9, duration: 1.2 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                >
                  ✖️
                </motion.text>
              )}
            </Fragment>
          )}
        </Topology>
      </div>
      <div className="w-full space-y-1.5 px-2">
        <div className="flex justify-between gap-2 text-xs text-[#EAF1FB]">
          <span>Laps so far: {laps}</span>
          <span className="text-right">Limit before it's dropped: none</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#EAF1FB]">
          <span className="w-16">CPU load</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#0B2447]">
            <motion.div className="h-full" animate={{ width: `${cpu}%`, backgroundColor: cpu > 80 ? "#FF8A7A" : cpu > 50 ? "#FFB547" : "#5FD4C4" }} />
          </div>
          <span className="w-9 text-right font-mono">{cpu}%</span>
          <motion.span
            aria-hidden
            className="w-4 text-sm"
            animate={{ opacity: cpu > 80 ? [1, 0.4, 1] : 0, scale: cpu > 80 ? [1, 1.3, 1] : 0.5 }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            🔥
          </motion.span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <button type="button" className={solid} onClick={sendNormal}>
          Send normal traffic
        </button>
        <span className="min-h-5 text-xs text-[#7FB5FF]" aria-live="polite">{verdict}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6 – STP blocks a redundant interface                                */
/* ------------------------------------------------------------------ */

function StpVisual() {
  const [stp, setStp] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <div className="flex h-full flex-col items-center gap-2">
      <div className="min-h-0 w-full flex-1">
        <Topology edges={["a", "b", "c"]} status={stp ? { c: "blocked" } : {}} heat={run > 0 && !stp ? 0.7 : 0} alarm={run > 0 && !stp}>
          {stp && <Ring at={3} color="#FFB547" />}
          {run > 0 && !stp && [0, 1, 2, 3].map((i) => <LoopDot key={`${run}-${i}`} delay={i * 0.5} dur={2} color="#FF8A7A" />)}
          {run > 0 && stp && (
            <>
              <Dot key={`${run}-1`} from={1} to={2} dur={0.9} />
              <Dot key={`${run}-2`} from={2} to={3} dur={0.9} delay={0.9} />
            </>
          )}
        </Topology>
      </div>
      <Caption>
        {run === 0 ? "Turn STP on or off, then send a frame." : stp ? "The redundant interface is blocked. The frame stops. No loop." : "No STP: the frame loops forever."}
      </Caption>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" role="switch" aria-checked={stp} className={stp ? solid : chip} onClick={() => { setStp((s) => !s); setRun(0); }}>
          Spanning tree protocol: {stp ? "on" : "off"}
        </button>
        <button type="button" className={chip} onClick={() => setRun((r) => r + 1)}>
          Send a frame
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Two-switch scenes (7, 8, 9, 10)                                     */
/* ------------------------------------------------------------------ */

function Block({ label, pcs, busy = false, dim = false }: { label: string; pcs: number; busy?: boolean; dim?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1">
      <div className="text-center text-[11px] text-[#EAF1FB]">{pcs} PC{pcs === 1 ? "" : "s"}</div>
      <div className="flex h-8 flex-wrap justify-center gap-px text-[10px] leading-none">
        {Array.from({ length: Math.min(pcs, 12) }, (_, i) => (
          <motion.span
            key={i}
            animate={{
              opacity: dim ? 0.25 : busy && !reduce ? [1, 0.45, 1] : 1,
              filter: dim ? "grayscale(1)" : "grayscale(0)",
            }}
            transition={{ duration: 1.1, repeat: busy ? Infinity : 0, delay: (i % 6) * 0.12 }}
          >
            💻
          </motion.span>
        ))}
      </div>
      <motion.div
        className="w-full rounded-md py-1 text-center text-xs font-semibold text-[#0B2447]"
        animate={{ backgroundColor: dim ? "#4A6C99" : "#7FB5FF" }}
      >
        {label}
      </motion.div>
    </div>
  );
}

/* 7 – one cable, many PCs */
function BottleneckVisual() {
  const [pcs, setPcs] = useState(8);
  const reduce = useReducedMotion();
  const load = Math.min(100, pcs * 2);
  const hot = pcs >= 30;
  const dur = 2.2 + load / 35;
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex items-center">
        <Block label="Switch 1" pcs={pcs} busy />
        <div className="relative mx-2 h-10 min-w-0 flex-1">
          <motion.div
            className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded"
            animate={{
              backgroundColor: hot ? "#FF8A7A" : "#7FB5FF",
              boxShadow: hot ? ["0 0 4px 1px rgba(255,138,122,.4)", "0 0 16px 4px rgba(255,138,122,.8)", "0 0 4px 1px rgba(255,138,122,.4)"] : "0 0 0 transparent",
            }}
            transition={{ duration: 0.8, repeat: hot ? Infinity : 0 }}
          />
          {Array.from({ length: Math.min(pcs, 24) }, (_, i) => (
            <motion.span
              key={`${i}-${Math.round(dur * 10)}`}
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#FFB547]"
              style={{ boxShadow: "0 0 6px #FFB547" }}
              initial={{ left: "0%" }}
              animate={{ left: "96%" }}
              transition={{ duration: dur, repeat: Infinity, ease: "linear", delay: (i / 24) * dur }}
            />
          ))}
          {hot && !reduce && (
            <motion.span
              aria-hidden
              className="absolute right-0 top-0 text-sm"
              animate={{ opacity: [0, 1, 0], y: [0, -6, -10] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            >
              💢
            </motion.span>
          )}
          <p className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-[#EAF1FB]">One Ethernet cable</p>
        </div>
        <Block label="Switch 2" pcs={1} />
      </div>
      <div>
        <div className="mb-1 flex justify-between gap-2 text-xs text-[#EAF1FB]">
          <span>Traffic on the single wire</span>
          <span className={hot ? "text-[#FF8A7A]" : "text-[#5FD4C4]"}>{hot ? "Huge bottleneck" : "Fine so far"}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#0B2447]">
          <motion.div className="h-full" animate={{ width: `${load}%`, backgroundColor: hot ? "#FF8A7A" : "#5FD4C4" }} />
        </div>
      </div>
      <label className="block text-sm text-[#EAF1FB]">
        <span className="mb-1 flex justify-between gap-2">
          <span className="leading-tight">PCs on switch 1 talking to the other switch</span>
          <span className="font-mono text-[#FFB547]">{pcs}</span>
        </span>
        <input type="range" min={1} max={50} value={pcs} onChange={(e) => setPcs(Number(e.target.value))} className={`w-full accent-[#FFB547] ${ring}`} />
      </label>
    </div>
  );
}

/* 8 – one cable, no backup */
function NoBackupVisual() {
  const [broken, setBroken] = useState(false);
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex h-full flex-col items-center justify-center gap-5"
      key={broken ? "b" : "ok"}
      animate={broken && !reduce ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex w-full items-center">
        <Block label="Switch 1" pcs={6} busy={!broken} />
        <button
          type="button"
          onClick={() => setBroken((b) => !b)}
          aria-pressed={broken}
          aria-label="Single cable between the switches. Activate to break or fix it."
          className={`relative mx-2 h-10 min-w-0 flex-1 ${ring}`}
        >
          <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded" style={{ backgroundColor: broken ? "#FF8A7A" : "#7FB5FF", opacity: broken ? 0.6 : 1 }} />
          {/* traffic flows until the cable breaks */}
          {!broken && !reduce &&
            [0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#FFB547]"
                style={{ boxShadow: "0 0 6px #FFB547" }}
                initial={{ left: "0%" }}
                animate={{ left: "94%" }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: i * 0.45 }}
              />
            ))}
          {broken && (
            <>
              <motion.span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                ✖️
              </motion.span>
              {!reduce &&
                [0, 1, 2].map((k) => (
                  <motion.span
                    key={k}
                    aria-hidden
                    className="absolute left-1/2 top-1/2 text-sm"
                    animate={{ x: (k - 1) * 22, y: [-4, -22 - k * 4], opacity: [1, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: k * 0.25 }}
                  >
                    ⚡
                  </motion.span>
                ))}
            </>
          )}
        </button>
        <Block label="Switch 2" pcs={1} dim={broken} />
      </div>
      <Caption>{broken ? "That whole connection is gone. There's no backup." : "Tap the cable to break it."}</Caption>
    </motion.div>
  );
}

/* 9 – second cable blocked by STP */
function BlockedSecondVisual() {
  const [down, setDown] = useState(false);
  const reduce = useReducedMotion();
  const active = down ? "backup" : "primary";
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex items-center">
        <Block label="Switch 1" pcs={50} busy />
        <div className="mx-2 min-w-0 flex-1 space-y-2">
          {(["primary", "backup"] as const).map((c) => {
            const isDown = c === "primary" && down;
            const blocked = c === "backup" && !down;
            const flowing = !isDown && !blocked;
            return (
              <div key={c} className="relative h-11">
                <span className="absolute inset-x-0 top-0 text-center text-[10px] leading-tight text-[#EAF1FB]">
                  {isDown ? "Primary cable: down ✖️" : blocked ? "Second cable: blocked ✋" : c === "primary" ? "Primary cable" : "Second cable: up"}
                </span>
                <motion.div
                  className="absolute bottom-2 left-0 right-0 h-1.5 rounded"
                  animate={{
                    backgroundColor: isDown ? "#FF8A7A" : blocked ? "rgba(0,0,0,0)" : "#5FD4C4",
                    boxShadow: flowing ? "0 0 10px rgba(95,212,196,.6)" : "0 0 0 transparent",
                  }}
                  style={{ borderTop: blocked ? "3px dashed #FFB547" : undefined }}
                />
                {flowing &&
                  !reduce &&
                  Array.from({ length: c === "primary" ? 10 : 10 }, (_, i) => (
                    <motion.span
                      key={`${c}-${i}`}
                      aria-hidden
                      className="absolute bottom-[7px] h-2 w-2 rounded-full bg-[#FFB547]"
                      style={{ boxShadow: "0 0 6px #FFB547" }}
                      initial={{ left: "0%" }}
                      animate={{ left: "94%" }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: (i / 10) * 1.6 }}
                    />
                  ))}
                {isDown && (
                  <motion.span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 text-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    ✖️
                  </motion.span>
                )}
              </div>
            );
          })}
        </div>
        <Block label="Switch 2" pcs={1} />
      </div>
      <div>
        <div className="mb-1 text-xs text-[#EAF1FB]">All 50 PCs ride on the {active} cable</div>
        <div className="h-3 overflow-hidden rounded-full bg-[#0B2447]">
          <motion.div
            className="h-full w-full bg-[#FF8A7A]"
            animate={reduce ? undefined : { opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        </div>
      </div>
      <div className="flex justify-center">
        <button type="button" className={solid} onClick={() => setDown((d) => !d)}>
          {down ? "Fix the primary cable" : "Break the primary cable"}
        </button>
      </div>
    </div>
  );
}

/* 10 – LACP bundle */
function LacpVisual() {
  const [n, setN] = useState(3);
  const [dead, setDead] = useState<number[]>([]);
  const reduce = useReducedMotion();
  const alive = Array.from({ length: n }, (_, i) => i).filter((i) => !dead.includes(i)).length;
  const toggle = (i: number) => setDead((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex items-center">
        <Block label="Switch 1" pcs={50} busy />
        <div className="relative mx-2 min-w-0 flex-1">
          <motion.div
            layout
            animate={{ boxShadow: alive > 0 ? `0 0 ${8 + alive * 6}px rgba(255,181,71,.45)` : "0 0 0 transparent" }}
            className="space-y-2 rounded-2xl border-2 border-[#FFB547] bg-[#FFB547]/10 px-3 py-3"
          >
            {Array.from({ length: n }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={dead.includes(i)}
                aria-label={`Cable ${i + 1}: ${dead.includes(i) ? "broken" : "working"}. Activate to toggle.`}
                className={`relative block h-3 w-full ${ring}`}
              >
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded" style={{ backgroundColor: dead.includes(i) ? "#FF8A7A" : "#5FD4C4", opacity: dead.includes(i) ? 0.5 : 1 }} />
                {!dead.includes(i) &&
                  !reduce &&
                  [0, 1].map((k) => (
                    <motion.span
                      key={k}
                      aria-hidden
                      className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FFE2A8]"
                      initial={{ left: "0%" }}
                      animate={{ left: "94%" }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i * 0.25 + k * 0.7 }}
                    />
                  ))}
                {dead.includes(i) && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs">✖️</span>}
              </button>
            ))}
          </motion.div>
          <p className="mt-1 text-center text-xs font-semibold text-[#FFB547]">One logical link</p>
        </div>
        <Block label="Switch 2" pcs={1} />
      </div>
      <div className="space-y-1.5 text-xs text-[#EAF1FB]">
        <div className="flex items-center gap-2">
          <span className="w-20 sm:w-24">Bandwidth</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#0B2447]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#5FD4C4] to-[#9AF0E2]"
              animate={{ width: `${(alive / 4) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
            />
          </div>
          <motion.span key={alive} className="w-8 text-right font-mono" initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
            {alive}×
          </motion.span>
        </div>
        <p className="text-center text-[#7FB5FF]">
          {alive === 0 ? "All cables down." : "Spanning tree sees one link, so it won't block this port."}
          {n > 1 && alive > 0 && alive < n ? " A cable is down and the link is still up." : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className={solid} disabled={n >= 4} onClick={() => setN((v) => v + 1)}>
          Bundle another cable
        </button>
        <button type="button" className={chip} disabled={n <= 1} onClick={() => { setN((v) => v - 1); setDead((d) => d.filter((x) => x < n - 1)); }}>
          Remove one
        </button>
      </div>
      <p className="text-center text-[11px] text-[#7FB5FF]/80">Tap a cable to break it</p>
    </div>
  );
}

const VISUALS: ComponentType[] = [
  ChainVisual,
  BackupVisual,
  FloodStepsVisual,
  StormVisual,
  CpuVisual,
  StpVisual,
  BottleneckVisual,
  NoBackupVisual,
  BlockedSecondVisual,
  LacpVisual,
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

export default function Section05LoopsStpLacp({ onComplete }: Props) {
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
      aria-label="Section 5: Loops, spanning tree and LACP"
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
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Loops, spanning tree and LACP</h2>
            <p className="mt-1 text-sm text-[#7FB5FF]">
              Part {step + 1} of {BEATS.length}
            </p>
          </div>
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

        <div className="relative h-[22rem] overflow-hidden rounded-xl border border-[#7FB5FF]/30 bg-[#0B2447]/70 p-4 sm:h-[24rem]">
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
              On to layer 3
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
