"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * TransportLayer
 * 1 TransportIntro   – the core layer: segmentation, sequencing, error control, flow control
 * 2 SegmentationLab  – split data by MTU (1500 / jumbo 9216), number segments, reassemble after out-of-order arrival, MSS
 * 3 MemoryUnits      – Byte to Exabyte, each step x1024
 * 4 PduLab           – Segment, Packet, Frame, Bits as headers are added and removed
 * 5 TcpUdpLab        – ACKs, a lost segment, TCP vs UDP
 * 6 ErrorControlLab  – hash attached to the TCP header, flip one bit and see the check fail
 * 7 WindowingLab     – flow control: single windowing vs sliding windowing, with a missing packet
 * 8 TransportQuiz    – practice questions
 * Rule to remember: the Transport layer is not about transporting, it is about making the data reliable.
 */

const SLOW = 1.4; // animation slow-down factor (1 = fast, higher = slower)

const C = {
  TL: "#1971c2",
  SEG: "#e8590c",
  SEQ: "#9c36b5",
  ERR: "#d6336c",
  FLOW: "#0c8599",
  TCP: "#1c7ed6",
  UDP: "#f08c00",
  GREEN: "#2f9e44",
  RED: "#c92a2a",
  AMBER: "#f08c00",
  GREY: "#868e96",
};
const PAL = ["#1971c2", "#e8590c", "#9c36b5", "#2f9e44", "#d6336c", "#0c8599", "#f08c00", "#7d4e2d"];
const mono = "ui-monospace, monospace";

type P = { x: number; y: number };
type Dir = "fwd" | "back";

/* ───────────────────────── shared helpers ───────────────────────── */

const edge = (A: P, B: P, r = 28): [number, number, number, number] => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return [A.x + ux * r, A.y + uy * r, B.x - ux * r, B.y - uy * r];
};

function lineProps(a: P, b: P) {
  const [x1, y1, x2, y2] = edge(a, b);
  return { x1, y1, x2, y2 };
}

/** loop = repeats forever, once = plays one time and stays at the end */
function Chip({
  a, b, r = 28, label, color, dur, delay, mode = "loop",
}: {
  a: P; b: P; r?: number; label: string; color: string; dur: number; delay: number; mode?: "loop" | "once";
}) {
  const [x0, y0, x1, y1] = edge(a, b, r);
  const w = label.length * 6.2 + 16;
  return (
    <g
      className={mode === "once" ? "tl-pkt tl-once" : "tl-pkt"}
      style={
        {
          "--x0": `${x0}px`,
          "--y0": `${y0}px`,
          "--x1": `${x1}px`,
          "--y1": `${y1}px`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        } as CSSProperties
      }
    >
      <rect x={-w / 2} y={-10} width={w} height={20} rx={6} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={10} fontWeight={600} fill="#fff" fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

function Node({ p, e, l, stroke, sub, sw = 2.5 }: { p: P; e: string; l: string; stroke: string; sub?: string; sw?: number }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={28} className="fill-background" stroke={stroke} strokeWidth={sw} style={{ transition: "stroke .4s" }} />
      <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26}>{e}</text>
      <text x={p.x} y={p.y + 46} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{l}</text>
      {sub && <text x={p.x} y={p.y + 60} textAnchor="middle" fontSize={10} fill={C.GREY}>{sub}</text>}
    </g>
  );
}

function Shell({ title, desc, badge = "Interactive", children }: { title: string; desc: string; badge?: string; children: ReactNode }) {
  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{desc}</CardDescription>
          </div>
          <Badge variant="secondary">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

const Tip = ({ color, children }: { color: string; children: ReactNode }) => (
  <p className="rounded-lg px-3 py-2 text-xs leading-5" style={{ background: `${color}18`, color }}>💡 {children}</p>
);

const Pills = <T extends string>({ items, sel, set, color }: { items: { id: T; label: string; color?: string }[]; sel: T; set: (v: T) => void; color: string }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((x) => {
      const c = x.color ?? color;
      return (
        <button key={x.id} onClick={() => set(x.id)} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          style={sel === x.id ? { background: c, borderColor: c, color: "#fff" } : { borderColor: `${c}66`, color: c }}>
          {x.label}
        </button>
      );
    })}
  </div>
);

type Fact = { t: string; easy: string };

function FactList({ facts, color }: { facts: Fact[]; color: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {facts.map((f, i) => {
        const on = open === i;
        return (
          <button key={i} onClick={() => setOpen(on ? null : i)}
            className="rounded-lg border px-3 py-2 text-left text-xs leading-5 transition-colors hover:bg-muted/40"
            style={on ? { borderColor: color, background: `${color}10` } : undefined}>
            <span className="font-medium">{on ? "▾" : "▸"} {f.t}</span>
            {on && <span className="tl-fade mt-1 block text-muted-foreground">💬 {f.easy}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  step, N, playing, setStep, setPlaying, startLabel = "Start", ms = 5200,
}: {
  step: number; N: number; playing: boolean; setStep: (f: (s: number) => number) => void; setPlaying: (v: boolean | ((p: boolean) => boolean)) => void; startLabel?: string; ms?: number;
}) {
  const done = step >= N;
  useEffect(() => {
    if (!playing) return;
    if (step >= N) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => Math.min(N, s + 1)), ms);
    return () => clearTimeout(t);
  }, [playing, step, N, ms, setPlaying, setStep]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={step <= 1} onClick={() => { setPlaying(false); setStep((s) => Math.max(1, s - 1)); }}>Back</Button>
      {step === 0 || done ? (
        <Button size="sm" onClick={() => { setPlaying(false); setStep(() => 1); }}>{done ? "Replay" : startLabel}</Button>
      ) : (
        <Button size="sm" onClick={() => { setPlaying(false); setStep((s) => Math.min(N, s + 1)); }}>Next step</Button>
      )}
      <Button size="sm" variant="outline" disabled={step === 0 || done} onClick={() => setPlaying((v) => !v)}>{playing ? "Pause" : "Auto-play"}</Button>
      <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => { setPlaying(false); setStep(() => 0); }}>Reset</Button>
    </div>
  );
}

/* ───────────────────────── 1. intro ───────────────────────── */

type RespId = "seg" | "seq" | "err" | "flow";
type Resp = { id: RespId; label: string; emoji: string; color: string; p: P; chip: string; easy: string; analogy: string };
const CEN: P = { x: 300, y: 125 };

const RESP: Resp[] = [
  { id: "seg", label: "Segmentation", emoji: "✂️", color: C.SEG, p: { x: 100, y: 55 }, chip: "small pieces", easy: "On the sender side, the entire data is cut into smaller pieces so it can be transferred through the network easily.", analogy: "Like cutting a big pizza into slices that fit in the box." },
  { id: "seq", label: "Sequencing", emoji: "🔢", color: C.SEQ, p: { x: 500, y: 55 }, chip: "seq #1, #2...", easy: "Every segment gets a sequence number, in order, so the receiving device can put the data back together correctly.", analogy: "Like numbering the pages of a book before posting them one by one." },
  { id: "err", label: "Error control", emoji: "🛡️", color: C.ERR, p: { x: 100, y: 195 }, chip: "hash check", easy: "When using TCP, the layer makes sure the data was not damaged on the way, using a hash value that is compared at both ends.", analogy: "Like a seal on a parcel: a broken seal means someone changed what is inside." },
  { id: "flow", label: "Flow control", emoji: "🚦", color: C.FLOW, p: { x: 500, y: 195 }, chip: "right speed", easy: "Controls the flow of traffic so communication stays smooth and the receiver is not flooded.", analogy: "Like a traffic light that keeps cars moving without a jam." },
];

const INTRO_FACTS: Fact[] = [
  { t: "Also called the core layer and the heart of OSI.", easy: "Layer 4 sits in the middle of the stack, which is why it gets these names." },
  { t: "It is not responsible for transporting data as the name suggests, but for the reliability of the data.", easy: "The lower layers move the data. The Transport layer makes sure it arrives complete, in order and undamaged." },
  { t: "Its main functionality is segmentation and sequencing.", easy: "Cut the data into pieces (segmentation) and number the pieces (sequencing). The next lab shows both." },
];

export function TransportIntro() {
  const [sel, setSel] = useState<RespId>("seg");
  const r = RESP.find((x) => x.id === sel) ?? RESP[0];
  return (
    <Shell title="Transport layer (4): the heart of OSI" desc="Its job is reliability, not transport. Tap one of its four responsibilities to see what it means.">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" style={{ color: C.RED }}>❤️ Core layer</Badge>
        <Badge variant="secondary" style={{ color: C.TL }}>Heart of OSI</Badge>
        <Badge variant="secondary" style={{ color: C.GREEN }}>Reliability of data</Badge>
      </div>
      <Pills items={RESP.map((x) => ({ id: x.id, label: `${x.emoji} ${x.label}`, color: x.color }))} sel={sel} set={setSel} color={r.color} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 270" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="The Transport layer and its four responsibilities">
          {RESP.map((x) => (
            <line key={x.id} {...lineProps(CEN, x.p)} stroke={x.id === sel ? x.color : C.GREY} strokeOpacity={x.id === sel ? 1 : 0.4}
              strokeWidth={x.id === sel ? 3.5 : 2} strokeDasharray="7 6" className="tl-dash" />
          ))}
          <circle cx={CEN.x} cy={CEN.y} r={28} fill="none" stroke={C.RED} strokeWidth={3} className="tl-ring" style={{ transformOrigin: `${CEN.x}px ${CEN.y}px` }} />
          <Node p={CEN} e="❤️" l="Transport layer (4)" stroke={C.RED} sw={3.5} />
          {RESP.map((x) => (
            <g key={x.id} className="cursor-pointer" onClick={() => setSel(x.id)}>
              <Node p={x.p} e={x.emoji} l={x.label} stroke={x.id === sel ? x.color : C.GREY} sw={x.id === sel ? 4 : 2.5} />
            </g>
          ))}
          <Chip key={sel} a={CEN} b={r.p} label={r.chip} color={r.color} dur={1.8 * SLOW} delay={0} />
        </svg>
      </div>
      <div key={sel} className="tl-fade rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: `${r.color}88` }}>
        <p className="text-sm font-semibold" style={{ color: r.color }}>{r.emoji} {r.label}</p>
        <p className="mt-1 text-muted-foreground">{r.easy}</p>
        <p className="mt-2 rounded-lg px-3 py-2" style={{ background: `${r.color}18`, color: r.color }}>💡 {r.analogy}</p>
      </div>
      <FactList facts={INTRO_FACTS} color={C.TL} />
    </Shell>
  );
}

/* ───────────────────────── 2. segmentation lab ───────────────────────── */

const SIZES = [3000, 6000, 9000, 12000];
const SEG_FACTS: Fact[] = [
  { t: "Segmentation: on the sender side, the entire data is segmented into smaller pieces so it can be easily transferred through the network.", easy: "Small pieces are easier to move and easier to resend if one goes wrong." },
  { t: "Sequencing: every segment is assigned a sequence number in order, so the receiving device can reassemble the data correctly.", easy: "Pieces can arrive in any order. The numbers tell the receiver how to line them up again. Try the Send step." },
  { t: "Data is segmented as per the MTU configured on the device, which is 1500 bytes by default.", easy: "MTU is the biggest piece a device will send in one go. Change it above to see the number of segments change." },
  { t: "MSS (Maximum Segment Size) is the payload portion of the MTU.", easy: "The MTU includes headers. Take the headers away and what is left for real data is the MSS." },
  { t: "A jumbo frame extends this up to 9216 bytes.", easy: "A bigger MTU means fewer, larger segments for the same data." },
];

export function SegmentationLab() {
  const [size, setSize] = useState(6000);
  const [mtu, setMtu] = useState<1500 | 9216>(1500);
  const [stage, setStage] = useState(0);
  const n = Math.ceil(size / mtu);
  const segs = Array.from({ length: n }, (_, i) => ({ n: i + 1, bytes: i < n - 1 ? mtu : size - mtu * (n - 1) }));
  const sorted = segs.map((s) => s.n);
  const arrival = [...sorted].sort((a, b) => ((a * 7) % 11) - ((b * 7) % 11));
  const order = stage === 2 ? arrival : sorted;
  const hdr = 40;
  const labels = ["Segment the data", "Send over the network", "Reassemble by sequence number"];
  const texts = [
    `The whole ${size.toLocaleString("en-US")} bytes sit in one piece. That is too big to send in one go when the MTU is ${mtu.toLocaleString("en-US")} bytes.`,
    `The data is cut into ${n} segment${n > 1 ? "s" : ""} of at most ${mtu.toLocaleString("en-US")} bytes, and each one gets a sequence number.`,
    n > 1 ? "The segments take different paths and arrive in a different order. Without the numbers, the receiver would build a broken file." : "Only one segment, so there is nothing to reorder. Try a larger data size or the default MTU.",
    "The receiver sorts the segments by sequence number and rebuilds the original data correctly.",
  ];
  const A: P = { x: 70, y: 60 };
  const B: P = { x: 530, y: 60 };
  const reset = () => setStage(0);

  return (
    <Shell title="Segmentation and sequencing with the MTU" desc="Choose a data size and an MTU. Cut the data into numbered segments, send them, and watch the receiver put them back in order.">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Data size:</span>
        <Pills items={SIZES.map((s) => ({ id: String(s), label: `${s.toLocaleString("en-US")} B` }))} sel={String(size)} set={(v) => { setSize(Number(v)); reset(); }} color={C.SEG} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">MTU:</span>
        <Pills items={[{ id: "1500", label: "1500 B (default)" }, { id: "9216", label: "9216 B (jumbo frame)" }]} sel={String(mtu)} set={(v) => { setMtu(Number(v) as 1500 | 9216); reset(); }} color={C.SEG} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 130" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Sender and receiver">
          <line {...lineProps(A, B)} stroke={C.SEG} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="7 6" className="tl-dash" />
          <Node p={A} e="💻" l="Sender" stroke={C.SEG} />
          <Node p={B} e="🖥️" l="Receiver" stroke={stage === 3 ? C.GREEN : C.SEG} sw={stage === 3 ? 4 : 2.5} />
          {stage === 2 && arrival.map((sn, i) => (
            <Chip key={`${size}-${mtu}-${sn}`} a={A} b={B} label={`seg ${sn}`} color={PAL[(sn - 1) % 8]} dur={2.6 * SLOW} delay={i * 0.55 * SLOW} />
          ))}
          {stage === 3 && <text x={530} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={C.GREEN} className="tl-pop">✓ rebuilt</text>}
        </svg>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <p className="mb-2 text-xs font-medium">
          {stage === 0 ? "Sender: whole data" : stage === 1 ? "Sender: numbered segments" : stage === 2 ? "Receiver: arrival order (mixed up)" : "Receiver: sorted by sequence number"}
        </p>
        {stage === 0 ? (
          <div className="tl-fade rounded-lg border-2 px-3 py-3 text-xs font-semibold" style={{ borderColor: C.SEG, background: `${C.SEG}18`, color: C.SEG }}>
            Whole data: {size.toLocaleString("en-US")} bytes
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {order.map((sn, i) => {
              const sg = segs[sn - 1];
              const col = PAL[(sn - 1) % 8];
              return (
                <div key={`${stage}-${sn}`} className="tl-pop min-w-[84px] rounded-lg border-2 px-3 py-2 text-center"
                  style={{ borderColor: col, background: `${col}14`, animationDelay: `${i * 0.15 * SLOW}s`, outline: stage === 3 ? `2px solid ${C.GREEN}` : stage === 2 && n > 1 ? `2px dashed ${C.AMBER}` : undefined, outlineOffset: 2 }}>
                  <p className="text-xs font-semibold">Segment {sn}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{sg.bytes.toLocaleString("en-US")} B</p>
                  <p className="text-[10px] font-bold" style={{ color: C.SEQ }}>seq #{sn}</p>
                </div>
              );
            })}
          </div>
        )}
        <p key={stage} className="tl-fade mt-3 text-xs leading-5 text-muted-foreground">{texts[stage]}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {stage < 3 && <Button size="sm" onClick={() => setStage((s) => s + 1)} style={{ background: C.SEG, color: "#fff" }}>{labels[stage]}</Button>}
        <Button size="sm" variant="ghost" disabled={stage === 0} onClick={reset}>Reset</Button>
        <Badge variant="secondary" style={{ color: C.SEG }}>{n} segment{n > 1 ? "s" : ""}</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground">To keep it simple, pieces are counted by MTU, as in the notes.</p>

      <div className="rounded-xl border bg-background p-4">
        <p className="mb-2 text-xs font-medium">Inside one {mtu.toLocaleString("en-US")}-byte MTU (not to scale)</p>
        <div className="flex h-9 overflow-hidden rounded-lg border text-[10px] font-semibold text-white">
          <div className="flex items-center justify-center px-2" style={{ flex: "0 0 22%", background: C.GREY }}>headers</div>
          <div className="flex flex-1 items-center justify-center px-2" style={{ background: C.SEG }}>payload = MSS</div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Example only: with {hdr} bytes of headers, MSS = {mtu.toLocaleString("en-US")} − {hdr} = {(mtu - hdr).toLocaleString("en-US")} bytes. MSS is the payload portion of the MTU.
        </p>
      </div>
      <FactList facts={SEG_FACTS} color={C.SEG} />
      <Tip color={C.SEG}>Cut by the MTU, number every piece, and let the receiver sort them. That is how the Transport layer keeps data in order.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 3. memory units ───────────────────────── */

const UNITS = ["Byte", "Kilobyte", "Megabyte", "Gigabyte", "Terabyte", "Petabyte", "Exabyte"];
const SHORT = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
const bytesOf = (i: number): bigint => {
  let v = BigInt(1);
  for (let k = 0; k < i; k++) v *= BigInt(1024);
  return v;
};

export function MemoryUnits() {
  const [sel, setSel] = useState(2);
  const [amt, setAmt] = useState(1);
  const col = PAL[sel % 8];
  const total = BigInt(amt) * bytesOf(sel);

  return (
    <Shell title="Memory units: every step up is × 1024" desc="Tap a unit to see what it equals. The Transport layer talks in bytes, so these sizes matter for MTU and segments.">
      <div className="flex flex-col gap-2">
        {UNITS.map((u, i) => {
          const width = Math.max(6, (bytesOf(i).toString().length / 19) * 100);
          const on = sel === i;
          return (
            <button key={u} onClick={() => setSel(i)} className="grid grid-cols-[110px_1fr_90px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40"
              style={on ? { borderColor: PAL[i % 8], background: `${PAL[i % 8]}10` } : undefined}>
              <span className="font-semibold" style={on ? { color: PAL[i % 8] } : undefined}>1 {u}</span>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${width}%`, background: on ? PAL[i % 8] : C.GREY, transition: "all .5s" }} />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{i === 0 ? "8 bits" : `1024 ${SHORT[i - 1]}`}</span>
            </button>
          );
        })}
      </div>

      <div key={sel} className="tl-fade rounded-xl border bg-background p-4 text-xs leading-5" style={{ borderColor: `${col}88` }}>
        <p className="text-sm font-semibold" style={{ color: col }}>
          {sel === 0 ? "1 Byte = 8 bits" : `1 ${UNITS[sel]} = 1024 ${UNITS[sel - 1]}s`}
        </p>
        {sel === 0 && (
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="tl-pop flex h-8 w-8 items-center justify-center rounded-md border font-mono text-xs font-bold text-white" style={{ background: i % 3 === 0 ? C.TL : C.SEQ, animationDelay: `${i * 0.1 * SLOW}s` }}>
                {i % 3 === 0 ? 1 : 0}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="number" min={1} max={1024} value={amt} aria-label="Amount"
            onChange={(e) => setAmt(Math.max(1, Math.min(1024, Math.floor(Number(e.target.value)) || 1)))}
            className="w-24 rounded-md border bg-background px-2 py-1 font-mono text-xs" />
          <span>{SHORT[sel]} =</span>
          <span className="break-all font-mono font-semibold" style={{ color: col }}>{total.toLocaleString("en-US")} bytes</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[320px] text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left font-medium">Unit</th><th className="px-3 py-2 text-left font-medium">Equals</th></tr></thead>
          <tbody>
            {UNITS.map((u, i) => (
              <tr key={u} className="border-t" style={i === sel ? { color: PAL[i % 8], fontWeight: 600, background: `${PAL[i % 8]}10` } : undefined}>
                <td className="px-3 py-2">1 {u}</td>
                <td className="px-3 py-2">{i === 0 ? "8 bits" : `1024 ${UNITS[i - 1]}s`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.TL}>8 bits make a byte. After that, every unit is 1024 of the one before it.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 4. PDU lab ───────────────────────── */

const PDUS = [
  { layer: "Transport", pdu: "Segment", color: C.TCP, header: "Transport header", trailer: false },
  { layer: "Network", pdu: "Packet", color: C.FLOW, header: "Network header", trailer: false },
  { layer: "Data-Link", pdu: "Frame", color: C.SEQ, header: "Data-link header", trailer: true },
  { layer: "Physical", pdu: "Bits", color: C.ERR, header: "", trailer: false },
];
const DOWN_TXT = [
  "The upper layers hand the data down to the Transport layer.",
  "Transport layer: the data is segmented and gets a transport header. The PDU is a Segment.",
  "Network layer: a network header is added around the segment. The PDU is a Packet.",
  "Data-Link layer: a data-link header and trailer are added. The PDU is a Frame.",
  "Physical layer: the frame becomes bits (0s and 1s) that travel on the cable. The PDU is Bits.",
];
const UP_TXT = [
  "The transport header is removed and the original data goes up to the upper layers.",
  "The packet's header is removed. The Transport layer works with a Segment again, checks the sequence numbers and reassembles.",
  "The frame's header and trailer are removed. The Network layer works with a Packet.",
  "Bits are grouped back into a Frame at the Data-Link layer.",
  "The Physical layer receives Bits from the cable.",
];
const BITS = "01001000 01100101 01101100 01101100 01101111";

function Nest({ lvl }: { lvl: number }) {
  if (lvl === 4) {
    return (
      <div className="tl-pop rounded-lg border-2 p-3" style={{ borderColor: C.ERR, background: `${C.ERR}10` }}>
        <p className="mb-1 text-[11px] font-bold" style={{ color: C.ERR }}>Bits</p>
        <p className="break-all font-mono text-xs">{BITS}</p>
      </div>
    );
  }
  let el: ReactNode = (
    <div className="flex items-center rounded-md border-2 border-dashed px-3 py-2 text-xs font-semibold" style={{ borderColor: C.GREY }}>Data</div>
  );
  for (let i = 0; i < lvl; i++) {
    const p = PDUS[i];
    const inner = el;
    el = (
      <div className="tl-pop rounded-lg border-2 p-2" style={{ borderColor: p.color, background: `${p.color}10` }}>
        <p className="mb-1 text-[11px] font-bold" style={{ color: p.color }}>{p.pdu}</p>
        <div className="flex items-stretch gap-1">
          <span className="flex items-center rounded px-2 py-1 text-[10px] font-semibold text-white" style={{ background: p.color }}>{p.header}</span>
          {inner}
          {p.trailer && <span className="flex items-center rounded px-2 py-1 text-[10px] font-semibold text-white" style={{ background: p.color }}>trailer</span>}
        </div>
      </div>
    );
  }
  return <>{el}</>;
}

export function PduLab() {
  const [dir, setDir] = useState<"down" | "up">("down");
  const [lvl, setLvl] = useState(0);
  const down = dir === "down";
  const done = down ? lvl === 4 : lvl === 0;
  const cur = lvl > 0 ? PDUS[lvl - 1] : null;
  const next = () => setLvl((l) => (down ? Math.min(4, l + 1) : Math.max(0, l - 1)));
  const back = () => setLvl((l) => (down ? Math.max(0, l - 1) : Math.min(4, l + 1)));
  const rows: { l: number; name: string; pdu: string; color: string }[] = [
    { l: 0, name: "Upper layers", pdu: "Data", color: C.GREY },
    ...PDUS.map((p, i) => ({ l: i + 1, name: p.layer, pdu: p.pdu, color: p.color })),
  ];

  return (
    <Shell title="PDU: the name of the data at each layer" desc="As data goes down the layers it is wrapped and renamed. On the receiver it is unwrapped on the way up.">
      <Pills items={[{ id: "down" as const, label: "Sender: going down" }, { id: "up" as const, label: "Receiver: going up" }]} sel={dir} set={(v) => { setDir(v); setLvl(v === "down" ? 0 : 4); }} color={C.TL} />
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <button key={r.name} onClick={() => setLvl(r.l)} className="flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40"
              style={lvl === r.l ? { borderColor: r.color, background: `${r.color}14`, fontWeight: 600 } : undefined}>
              <span>{r.name}</span>
              <span className="font-mono" style={{ color: r.color }}>{r.pdu}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div key={`${dir}-${lvl}`} className="rounded-xl border bg-background p-4" style={{ borderColor: cur ? `${cur.color}88` : undefined }}>
            <Nest lvl={lvl} />
          </div>
          <p key={`t-${dir}-${lvl}`} className="tl-fade rounded-xl border bg-background p-4 text-xs leading-5 text-muted-foreground">
            <span className="font-semibold" style={{ color: cur?.color ?? C.GREY }}>{cur ? `${cur.layer} layer · ${cur.pdu}: ` : "Data: "}</span>
            {down ? DOWN_TXT[lvl] : UP_TXT[lvl]}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={down ? lvl === 0 : lvl === 4} onClick={back}>Back</Button>
        <Button size="sm" disabled={done} onClick={next} style={{ background: C.TL, color: "#fff" }}>{down ? "Go down a layer" : "Go up a layer"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setLvl(down ? 0 : 4)}>Reset</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[320px] text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left font-medium">Layer</th><th className="px-3 py-2 text-left font-medium">PDU name</th></tr></thead>
          <tbody>
            {PDUS.map((p, i) => (
              <tr key={p.layer} className="border-t" style={lvl === i + 1 ? { color: p.color, fontWeight: 600, background: `${p.color}10` } : undefined}>
                <td className="px-3 py-2">{p.layer}</td><td className="px-3 py-2">{p.pdu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.TL}>PDU (Protocol Data Unit) is just the name of the data at each layer: Segment, Packet, Frame, Bits.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 5. TCP vs UDP ───────────────────────── */

type TChip = { dir: Dir; label: string; color: string; delay: number; lost?: boolean };
type TStep = { title: string; text: string; chips: TChip[]; sent: number[]; recv: number[]; acked: number[] };
const TU_LOSS = 3;

function buildTU(tcp: boolean, loss: boolean): TStep[] {
  const s: TStep[] = [];
  const sent: number[] = [];
  const recv: number[] = [];
  const acked: number[] = [];
  const snap = (title: string, text: string, chips: TChip[]) => s.push({ title, text, chips, sent: [...sent], recv: [...recv], acked: [...acked] });
  for (let n = 1; n <= 4; n++) {
    sent.push(n);
    if (loss && n === TU_LOSS) {
      snap(`Segment ${n} is lost on the way`,
        tcp ? "The receiver never sees it, so it sends no ACK for segment 3." : "The receiver never sees it. UDP has no receipts, so the sender is not told.",
        [{ dir: "fwd", label: `seg ${n}`, color: C.RED, delay: 0, lost: true }]);
      continue;
    }
    recv.push(n);
    if (tcp) {
      acked.push(n);
      snap(`Send segment ${n}, get an ACK`, "The receiver sends a receipt (ACK) confirming the data arrived without issues.",
        [{ dir: "fwd", label: `seg ${n}`, color: C.TCP, delay: 0 }, { dir: "back", label: `ACK ${n}`, color: C.GREEN, delay: 1 }]);
    } else {
      snap(`Send segment ${n}`, "The segment is sent. UDP does not wait for any receipt.", [{ dir: "fwd", label: `seg ${n}`, color: C.UDP, delay: 0 }]);
    }
  }
  if (tcp && loss) {
    recv.push(TU_LOSS);
    acked.push(TU_LOSS);
    snap("No ACK for segment 3: send it again", "The sender noticed segment 3 was never acknowledged and sends it again. Now everything is confirmed.",
      [{ dir: "fwd", label: "seg 3 again", color: C.AMBER, delay: 0 }, { dir: "back", label: "ACK 3", color: C.GREEN, delay: 1 }]);
  }
  if (!tcp) {
    snap("Transfer finished",
      loss ? "Segment 3 is gone for good. Nobody sent a receipt, so nobody noticed and nothing was resent." : "Everything arrived this time, but the sender never got a receipt, so it cannot be sure.", []);
  }
  return s;
}

const TU_FACTS: Fact[] = [
  { t: "The Transport layer has two protocols: TCP (Transmission Control Protocol) and UDP (User Datagram Protocol).", easy: "TCP is careful and reliable. UDP just sends." },
  { t: "Acknowledgements (ACK): the receiver sends a receipt to the sender confirming data was received without issues. This only happens with TCP.", easy: "Like a delivery signature. Switch to UDP above and notice that no receipts come back." },
];

export function TcpUdpLab() {
  const [tcp, setTcp] = useState(true);
  const [loss, setLoss] = useState(true);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = buildTU(tcp, loss);
  const N = steps.length;
  const cur = step > 0 ? steps[step - 1] : null;
  const done = step >= N;
  const col = tcp ? C.TCP : C.UDP;
  const SND: P = { x: 70, y: 85 };
  const RCV: P = { x: 530, y: 85 };
  const lane = (d: Dir): [P, P] => (d === "fwd" ? [{ x: 124, y: 70 }, { x: 476, y: 70 }] : [{ x: 476, y: 100 }, { x: 124, y: 100 }]);
  const reset = () => { setStep(0); setPlaying(false); };
  const rows: [string, string, string][] = [
    ["Full name", "Transmission Control Protocol", "User Datagram Protocol"],
    ["Acknowledgements (ACK)", "Yes", "No"],
    ["Flow control", "Yes", "No"],
    ["Window size agreed in handshake", "Yes", "No"],
    ["Lost data", "Noticed and sent again", "Not noticed, not resent"],
  ];

  return (
    <Shell title="TCP vs UDP: who checks that data arrived?" desc="Send four segments. Segment 3 can get lost on the way. See what TCP does and what UDP does not do.">
      <Pills items={[{ id: "TCP", label: "TCP", color: C.TCP }, { id: "UDP", label: "UDP", color: C.UDP }]} sel={tcp ? "TCP" : "UDP"} set={(v) => { setTcp(v === "TCP"); reset(); }} color={col} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 170" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="A sender sending four segments to a receiver">
          <line x1={124} y1={70} x2={476} y2={70} stroke={col} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="7 6" className="tl-dash" />
          <line x1={124} y1={100} x2={476} y2={100} stroke={tcp ? C.GREEN : C.GREY} strokeOpacity={tcp ? 0.45 : 0.2} strokeWidth={2} strokeDasharray="7 6" className="tl-dash" />
          {!tcp && <text x={300} y={104} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED}>✕ no ACKs come back</text>}
          <Node p={SND} e="💻" l="Sender" stroke={col} sw={3} />
          <Node p={RCV} e="🖥️" l="Receiver" stroke={col} sw={3} />
          {cur?.chips.map((c, i) => {
            const [a, b0] = lane(c.dir);
            const b = c.lost ? { x: 300, y: b0.y } : b0;
            return (
              <g key={`${step}-${tcp}-${loss}-${i}`}>
                <Chip a={a} b={b} r={0} label={c.label} color={c.color} dur={1.2 * SLOW} delay={c.delay * 1.2 * SLOW} mode="once" />
                {c.lost && <text x={300} y={b0.y + 8} textAnchor="middle" fontSize={24} className="tl-pop" style={{ animationDelay: `${(c.delay + 1) * 1.2 * SLOW}s` }}>💥</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[{ who: "Sender", note: tcp ? "✓ = ACK received" : "sent (no receipts)" }, { who: "Receiver", note: "✕ = never arrived" }].map((side, si) => (
          <div key={side.who} className="rounded-xl border bg-background p-3">
            <p className="mb-2 text-xs font-medium">{side.who} <span className="font-normal text-muted-foreground">· {side.note}</span></p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => {
                const sentIt = cur?.sent.includes(n) ?? false;
                const got = cur?.recv.includes(n) ?? false;
                const ack = cur?.acked.includes(n) ?? false;
                const state = si === 0 ? (ack ? "ok" : sentIt ? "wait" : "todo") : got ? "ok" : sentIt ? "bad" : "todo";
                const c = state === "ok" ? C.GREEN : state === "bad" ? C.RED : state === "wait" ? C.AMBER : C.GREY;
                return (
                  <div key={`${step}-${n}-${state}`} className="tl-pop rounded-lg border-2 px-2 py-2 text-center text-xs font-semibold" style={{ borderColor: c, background: `${c}14`, color: state === "todo" ? C.GREY : c }}>
                    {n} {state === "ok" ? "✓" : state === "bad" ? "✕" : ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-background p-4">
        {cur ? (
          <div key={`${step}-${tcp}-${loss}`} className="tl-fade flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Step {step} of {N}</p>
            <p className="text-sm font-semibold">{cur.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">{cur.text}</p>
            {done && (
              <p className="text-xs font-medium" style={{ color: tcp || !loss ? C.GREEN : C.RED }}>
                {tcp ? "TCP: every segment is confirmed." : loss ? "UDP: one segment is missing and nobody knows." : "UDP: delivered, with no proof."}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">Press Start. Try TCP and UDP with the lost segment switched on and off.</p>
        )}
      </div>

      <Stepper step={step} N={N} playing={playing} setStep={setStep} setPlaying={setPlaying} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => { setLoss((v) => !v); reset(); }} style={loss ? { background: C.RED, color: "#fff" } : undefined}>
          Lose segment 3: {loss ? "ON" : "OFF"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[520px] text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left font-medium" /><th className="px-3 py-2 text-left font-medium" style={{ color: C.TCP }}>TCP</th><th className="px-3 py-2 text-left font-medium" style={{ color: C.UDP }}>UDP</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t">
                <td className="px-3 py-2 font-semibold">{r[0]}</td>
                <td className="px-3 py-2" style={tcp ? { background: `${C.TCP}10`, color: C.TCP, fontWeight: 600 } : undefined}>{r[1]}</td>
                <td className="px-3 py-2" style={!tcp ? { background: `${C.UDP}10`, color: C.UDP, fontWeight: 600 } : undefined}>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FactList facts={TU_FACTS} color={C.TCP} />
      <Tip color={C.TCP}>Receipts (ACKs), error control and flow control all belong to TCP. UDP has none of them.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 6. error control ───────────────────────── */

const hash = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};
const bin8 = (c: number) => c.toString(2).padStart(8, "0");
const vis = (c: string) => (c === " " ? "␣" : c);

function HexDiff({ a, b }: { a: string; b: string }) {
  return (
    <span className="font-mono">
      {[...a].map((ch, i) => <span key={i} style={ch !== b[i] ? { color: C.RED, fontWeight: 700 } : undefined}>{ch}</span>)}
    </span>
  );
}

const ERR_FACTS: Fact[] = [
  { t: "When using TCP, ensuring data integrity is the Transport layer's responsibility.", easy: "Integrity means the data arrives exactly as it was sent." },
  { t: "The sender generates a hash value (a math value based on the data, using hashing algorithms) and attaches it to the TCP header.", easy: "A hash is like a fingerprint of the data. The same data always gives the same fingerprint." },
  { t: "Once the data reaches the destination, the destination machine also generates a hash value based on the received data and compares both hash values.", easy: "The receiver makes its own fingerprint and checks it against the one in the header." },
  { t: "If the hashes match, the data is not corrupted. Even a 1-bit change produces a different hash value, failing the integrity check.", easy: "Flip one bit in the lab and the whole fingerprint changes." },
];

export function ErrorControlLab() {
  const [msg, setMsg] = useState("Hello");
  const [flip, setFlip] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const data = msg || "Hello";
  const f = flip !== null && flip < data.length ? flip : null;
  const received = f === null ? data : data.slice(0, f) + String.fromCharCode(data.charCodeAt(f) ^ 1) + data.slice(f + 1);
  const h1 = hash(data);
  const h2 = hash(received);
  const match = h1 === h2;
  const N = 5;
  const titles = [
    "", "Step 1: the sender hashes the data", "Step 2: the hash is attached to the TCP header", "Step 3: the segment travels across the network",
    "Step 4: the receiver hashes what it received", "Step 5: compare both hash values",
  ];
  const texts = [
    "",
    "A hashing algorithm turns the data payload into a short hash value, a math value based on the data. This is a toy hash for demonstration, and real systems use stronger algorithms.",
    "The hash value is placed in the TCP header, right in front of the payload.",
    "Click any letter in the payload to flip one bit, as if the data got damaged on the way. Or leave it alone.",
    "The destination machine runs the same hashing algorithm on the data it actually received.",
    match ? "Both hash values are the same, so the data is not corrupted." : "The hash values are different, so the data is corrupted. The integrity check fails.",
  ];
  const A: P = { x: 70, y: 60 };
  const B: P = { x: 530, y: 60 };
  const reset = () => { setStep(0); setPlaying(false); };
  const flipInfo = f !== null ? { o: data[f], n: received[f], ob: bin8(data.charCodeAt(f)), nb: bin8(received.charCodeAt(f)) } : null;

  return (
    <Shell title="Error control: is the data still the same?" desc="Follow the hash value from sender to receiver. Then damage the data by flipping a single bit and watch the check fail.">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="tl-msg">Data payload:</label>
        <input id="tl-msg" value={msg} maxLength={10} onChange={(e) => { setMsg(e.target.value); setFlip(null); reset(); }} className="rounded-md border bg-background px-3 py-1.5 font-mono text-xs" />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 130" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="A segment with a hash travelling to the receiver">
          <line {...lineProps(A, B)} stroke={C.ERR} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="7 6" className="tl-dash" />
          <Node p={A} e="💻" l="Sender" stroke={step >= 1 ? C.ERR : C.GREY} />
          <Node p={B} e="🖥️" l="Receiver" stroke={step >= 5 ? (match ? C.GREEN : C.RED) : step >= 3 ? C.ERR : C.GREY} sw={step >= 5 ? 4 : 2.5} />
          {step === 3 && <Chip key={`ec-${flip}`} a={A} b={B} label={f !== null ? "data + hash (damaged)" : "data + hash"} color={f !== null ? C.RED : C.ERR} dur={2.2 * SLOW} delay={0} mode="once" />}
          {step >= 5 && <text key={`v-${match}`} x={530} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill={match ? C.GREEN : C.RED} className="tl-pop">{match ? "✓ accepted" : "✕ corrupted"}</text>}
        </svg>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border bg-background p-4 text-xs">
          <p className="mb-2 font-semibold" style={{ color: C.ERR }}>Sender</p>
          <p className="mb-1 text-muted-foreground">Data payload</p>
          <div className="flex flex-wrap gap-1">
            {[...data].map((ch, i) => (
              <button key={i} disabled={step !== 3} onClick={() => setFlip(flip === i ? null : i)}
                className="min-w-[28px] rounded-md border px-2 py-1 font-mono text-sm transition-colors enabled:hover:bg-muted/60"
                style={step === 3 && f === i ? { borderColor: C.RED, background: `${C.RED}18`, color: C.RED } : undefined}>
                {vis(ch)}
              </button>
            ))}
          </div>
          {step >= 1 && (
            <p key={`h1-${data}`} className="tl-fade mt-3">Hash: <span className="rounded px-2 py-0.5 font-mono font-semibold" style={{ background: `${C.ERR}18`, color: C.ERR }}>{h1}</span></p>
          )}
          {step >= 2 && (
            <div key={`pk-${data}`} className="tl-fade mt-3 flex overflow-hidden rounded-lg border text-[11px]">
              <span className="px-2 py-2 font-semibold text-white" style={{ background: C.TCP }}>TCP header · hash {h1}</span>
              <span className="flex-1 px-2 py-2 font-mono">{data}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-background p-4 text-xs">
          <p className="mb-2 font-semibold" style={{ color: C.ERR }}>Receiver</p>
          {step >= 3 ? (
            <>
              <p className="mb-1 text-muted-foreground">Data received</p>
              <div key={`rx-${flip}-${data}`} className="tl-fade flex flex-wrap gap-1">
                {[...received].map((ch, i) => (
                  <span key={i} className="min-w-[28px] rounded-md border px-2 py-1 text-center font-mono text-sm" style={i === f ? { borderColor: C.RED, background: `${C.RED}18`, color: C.RED } : undefined}>{vis(ch)}</span>
                ))}
              </div>
              {flipInfo && <p className="mt-2 text-[11px] text-muted-foreground">1-bit change: {vis(flipInfo.o)} ({flipInfo.ob}) became {vis(flipInfo.n)} ({flipInfo.nb})</p>}
            </>
          ) : <p className="text-muted-foreground">Waiting for data.</p>}
          {step >= 4 && (
            <p key={`h2-${h2}`} className="tl-fade mt-3">Hash of received data: <span className="rounded px-2 py-0.5" style={{ background: `${C.ERR}18` }}><HexDiff a={h2} b={h1} /></span></p>
          )}
          {step >= 5 && (
            <p key={`cmp-${match}`} className="tl-fade mt-3 rounded-lg border-2 px-3 py-2 font-semibold" style={{ borderColor: match ? C.GREEN : C.RED, color: match ? C.GREEN : C.RED }}>
              {match ? "✓ Hashes match: not corrupted" : "✕ Hashes differ: integrity check fails"}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4">
        {step > 0 ? (
          <div key={`${step}-${flip}`} className="tl-fade flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Step {step} of {N}</p>
            <p className="text-sm font-semibold">{titles[step]}</p>
            <p className="text-xs leading-5 text-muted-foreground">{texts[step]}</p>
            {step === N && !match && <p className="text-xs font-medium" style={{ color: C.RED }}>Even a 1-bit change produces a different hash value.</p>}
          </div>
        ) : <p className="text-xs leading-5 text-muted-foreground">Press Start. At step 3, click a letter to damage the data.</p>}
      </div>
      <Stepper step={step} N={N} playing={playing} setStep={setStep} setPlaying={setPlaying} />
      <FactList facts={ERR_FACTS} color={C.ERR} />
      <Tip color={C.ERR}>Same data, same hash. Change even one bit and the hash changes, so the receiver knows something went wrong.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 7. windowing lab ───────────────────────── */

type Seg = "todo" | "ack" | "lost";
type WChip = { dir: Dir; label: string; color: string; delay: number; lost?: boolean };
type WStep = { isRound: boolean; title: string; text: string; win: number | null; sent: number[]; status: Seg[]; chips: WChip[] };
const TOTAL = 12;
const WIN_LOSS = 7;

function buildWin(sliding: boolean, loss: boolean): WStep[] {
  const st: Seg[] = Array<Seg>(TOTAL + 1).fill("todo");
  const out: WStep[] = [];
  const contiguous = () => { let k = 0; while (k < TOTAL && st[k + 1] === "ack") k++; return k; };
  const snap = (isRound: boolean, title: string, text: string, win: number | null, sent: number[], chips: WChip[]) =>
    out.push({ isRound, title, text, win, sent, chips, status: [...st] });
  let r = 0;

  if (!sliding) {
    let lostDone = false;
    for (let n = 1; n <= TOTAL; n++) {
      const rounds = loss && n === WIN_LOSS && !lostDone ? 2 : 1;
      for (let k = 0; k < rounds; k++) {
        r++;
        const lost = rounds === 2 && k === 0;
        st[n] = lost ? "lost" : "ack";
        const chips: WChip[] = [{ dir: "fwd", label: `seg ${n}`, color: lost ? C.RED : C.TCP, delay: 0, lost }];
        if (!lost) chips.push({ dir: "back", label: `ACK ${n}`, color: C.GREEN, delay: 1 });
        snap(true, `Round ${r}: segment ${n}${k === 1 ? " again" : ""}`,
          lost ? "Segment 7 is lost. The sender waited for an ACK that never came, so it has to send it again."
            : "One segment goes out, and the sender waits for its ACK before sending the next one.", 1, [n], chips);
        if (lost) lostDone = true;
      }
    }
    return out;
  }

  snap(false, "Handshake: agree on a window size", "Sender and receiver agree on a window size through the TCP handshake. Here they agree on 2 segments.", 2, [],
    [{ dir: "fwd", label: "SYN", color: C.TCP, delay: 0 }, { dir: "back", label: "SYN-ACK · window 2", color: C.GREEN, delay: 1 }, { dir: "fwd", label: "ACK", color: C.TCP, delay: 2 }]);

  let win = 2, prev = 2, next = 1;
  let retrans: number | null = null;
  let lostDone = false;
  while (next <= TOTAL || retrans !== null) {
    r++;
    const used = win;
    const re = retrans;
    const segs: number[] = [];
    if (retrans !== null) { segs.push(retrans); retrans = null; }
    while (segs.length < used && next <= TOTAL) segs.push(next++);
    const lostSeg = loss && !lostDone && segs.includes(WIN_LOSS) ? WIN_LOSS : null;
    segs.forEach((n) => { st[n] = n === lostSeg ? "lost" : "ack"; });
    const ack = contiguous();
    const chips: WChip[] = segs.map((n, i) => ({ dir: "fwd" as Dir, label: `seg ${n}`, color: n === lostSeg ? C.RED : C.TCP, delay: i * 0.3, lost: n === lostSeg }));
    if (ack > 0) chips.push({ dir: "back", label: `ACK ${ack}`, color: C.GREEN, delay: segs.length * 0.3 + 0.9 });
    let text: string;
    if (lostSeg !== null) {
      lostDone = true;
      retrans = lostSeg;
      win = prev;
      text = `Window size ${used}: segments ${segs.join(", ")} go out together. Segment ${lostSeg} goes missing. The sender reverts to the previous window size (${win}) and will retransmit segment ${lostSeg}.`;
    } else {
      prev = used;
      const finished = next > TOTAL;
      win = used + 1;
      text = re !== null
        ? `Window size ${used}: the missing segment ${re} is sent again, together with the new segments ${segs.filter((x) => x !== re).join(", ") || "none"}. ${finished ? "That finishes the transfer." : `Then the sender tries to negotiate a bigger window: ${win}.`}`
        : `Window size ${used}: segments ${segs.join(", ")} go out together without waiting for each ACK. ${finished ? "These are the last segments, so the transfer is done." : `All arrived, so the sender tries to negotiate a bigger window: ${win}.`}`;
    }
    snap(true, `Round ${r}: window size ${used}`, text, used, segs, chips);
  }
  return out;
}

const WIN_FACTS: Fact[] = [
  { t: "Flow control controls the flow of traffic to ensure smoother communication.", easy: "It stops the sender from going too fast or too slow for the network." },
  { t: "Flow control only happens in TCP. There is no flow control in UDP.", easy: "UDP simply sends and never adjusts." },
  { t: "Single windowing (old approach): inefficient, sends segments one by one.", easy: "Send one, wait for its ACK, send the next. A lot of waiting." },
  { t: "Sliding windowing: sender and receiver agree on a window size through the TCP handshake.", easy: "The window is how many segments may be on the way before an ACK is needed." },
  { t: "After the handshake, the sender constantly tries to negotiate (increase) the window size.", easy: "If everything is going well, the sender asks to send more at once." },
  { t: "When a packet goes missing, the sender reverts to the previous window size and retransmits the missing packet. This happens continuously throughout the transmission.", easy: "A missing segment is a warning to slow down a little. Turn on the loss switch to see it." },
];

export function WindowingLab() {
  const [sliding, setSliding] = useState(true);
  const [loss, setLoss] = useState(true);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = buildWin(sliding, loss);
  const N = steps.length;
  const cur = step > 0 ? steps[step - 1] : null;
  const done = step >= N;
  const col = sliding ? C.FLOW : C.RED;
  const rS = buildWin(false, loss).filter((s) => s.isRound).length;
  const rW = buildWin(true, loss).filter((s) => s.isRound).length;
  const bars: { l: string; v: number; c: string }[] = [{ l: "Single windowing", v: rS, c: C.RED }, { l: "Sliding windowing", v: rW, c: C.GREEN }];
  const SND: P = { x: 70, y: 90 };
  const RCV: P = { x: 530, y: 90 };
  const lane = (d: Dir): [P, P] => (d === "fwd" ? [{ x: 124, y: 74 }, { x: 476, y: 74 }] : [{ x: 476, y: 108 }, { x: 124, y: 108 }]);
  const reset = () => { setStep(0); setPlaying(false); };

  return (
    <Shell title="Flow control and windowing: single vs sliding" desc="Send 12 segments. Single windowing waits for every ACK. Sliding windowing sends more at once, and reacts when a segment goes missing.">
      <Pills items={[{ id: "sliding", label: "Sliding windowing", color: C.FLOW }, { id: "single", label: "Single windowing (old)", color: C.RED }]} sel={sliding ? "sliding" : "single"} set={(v) => { setSliding(v === "sliding"); reset(); }} color={col} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" style={{ color: col }}>Window size: {cur?.win ?? (sliding ? "?" : 1)}</Badge>
        <Button size="sm" variant="outline" onClick={() => { setLoss((v) => !v); reset(); }} style={loss ? { background: C.RED, color: "#fff" } : undefined}>Lose segment 7: {loss ? "ON" : "OFF"}</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 190" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="Segments and ACKs between a sender and a receiver">
          <line x1={124} y1={74} x2={476} y2={74} stroke={col} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="7 6" className="tl-dash" />
          <line x1={124} y1={108} x2={476} y2={108} stroke={C.GREEN} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="7 6" className="tl-dash" />
          <Node p={SND} e="💻" l="Sender" stroke={col} sw={3} />
          <Node p={RCV} e="🖥️" l="Receiver" stroke={col} sw={3} />
          {cur?.chips.map((c, i) => {
            const [a, b0] = lane(c.dir);
            const b = c.lost ? { x: 300, y: b0.y } : b0;
            return (
              <g key={`${step}-${sliding}-${loss}-${i}`}>
                <Chip a={a} b={b} r={0} label={c.label} color={c.color} dur={1.2 * SLOW} delay={c.delay * SLOW} mode="once" />
                {c.lost && <text x={300} y={b0.y + 8} textAnchor="middle" fontSize={22} className="tl-pop" style={{ animationDelay: `${(c.delay + 1.2) * SLOW}s` }}>💥</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <p className="mb-2 text-xs font-medium">Segments <span className="font-normal text-muted-foreground">· amber outline = in the current window · green = ACKed · red = lost</span></p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
          {Array.from({ length: TOTAL }, (_, i) => i + 1).map((n) => {
            const s: Seg = cur ? cur.status[n] : "todo";
            const inWin = cur?.sent.includes(n) ?? false;
            const c = s === "ack" ? C.GREEN : s === "lost" ? C.RED : C.GREY;
            return (
              <div key={`${step}-${n}`} className="tl-pop rounded-md border-2 py-2 text-center text-xs font-semibold"
                style={{ borderColor: inWin ? C.AMBER : `${c}66`, background: `${c}${s === "todo" ? "10" : "20"}`, color: s === "todo" ? C.GREY : c, outline: inWin ? `2px solid ${C.AMBER}` : undefined, outlineOffset: 1 }}>
                {n}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4">
        {cur ? (
          <div key={`${step}-${sliding}-${loss}`} className="tl-fade flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Step {step} of {N}</p>
            <p className="text-sm font-semibold">{cur.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">{cur.text}</p>
            {done && <p className="text-xs font-medium" style={{ color: C.GREEN }}>All 12 segments delivered in {sliding ? rW : rS} rounds.</p>}
          </div>
        ) : <p className="text-xs leading-5 text-muted-foreground">Press Start. Run it once with each method and compare the number of rounds below.</p>}
      </div>
      <Stepper step={step} N={N} playing={playing} setStep={setStep} setPlaying={setPlaying} />

      <div className="rounded-xl border bg-background p-4">
        <p className="mb-2 text-xs font-medium">Rounds needed to send 12 segments (fewer is faster)</p>
        {bars.map((b) => (
          <div key={b.l} className="mb-2 grid grid-cols-[130px_1fr_70px] items-center gap-2 text-xs">
            <span>{b.l}</span>
            <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(b.v / Math.max(rS, rW)) * 100}%`, background: b.c, transition: "width .5s" }} /></div>
            <span className="font-mono">{b.v} rounds</span>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Window sizes here are examples. Real sizes depend on the devices and the network.</p>
      </div>
      <FactList facts={WIN_FACTS} color={C.FLOW} />
      <Tip color={C.FLOW}>Single windowing: 1, ACK, 2, ACK, 3, ACK. Sliding windowing: agree a window, keep raising it, and fall back when a packet goes missing.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 8. quiz ───────────────────────── */

const QS: { q: string; o: string[]; a: number; why: string }[] = [
  { q: "Which layer is called the core layer and the heart of OSI?", o: ["Application", "Transport", "Network", "Physical"], a: 1, why: "The Transport layer (4)." },
  { q: "What is the Transport layer really responsible for?", o: ["Moving data on the cable", "The reliability of the data", "Choosing IP addresses", "Drawing web pages"], a: 1, why: "Despite its name, it is about reliability, not transporting." },
  { q: "What is the main functionality of the Transport layer?", o: ["Routing and switching", "Segmentation and sequencing", "Compression only", "Cabling"], a: 1, why: "Segmentation and sequencing." },
  { q: "What is the default MTU?", o: ["576 bytes", "1500 bytes", "9216 bytes", "65,535 bytes"], a: 1, why: "1500 bytes by default." },
  { q: "A jumbo frame extends the MTU up to…", o: ["1500 bytes", "4096 bytes", "9216 bytes", "1 MB"], a: 2, why: "Up to 9216 bytes." },
  { q: "How many Bytes are in 1 Kilobyte?", o: ["8", "100", "1000", "1024"], a: 3, why: "1 Kilobyte = 1024 Bytes." },
  { q: "What is the PDU name at the Network layer?", o: ["Segment", "Packet", "Frame", "Bits"], a: 1, why: "Transport: Segment. Network: Packet. Data-Link: Frame. Physical: Bits." },
  { q: "What is the PDU name at the Transport layer?", o: ["Segment", "Packet", "Frame", "Bits"], a: 0, why: "The Transport layer's PDU is the Segment." },
  { q: "Which protocol sends acknowledgements (ACKs)?", o: ["UDP", "TCP", "Both", "Neither"], a: 1, why: "ACKs only happen with TCP." },
  { q: "What does the sender attach to the TCP header for error control?", o: ["A hash value", "A MAC address", "A cable colour", "A window size only"], a: 0, why: "A hash value generated from the data." },
  { q: "What happens if even 1 bit of the data changes?", o: ["The hash stays the same", "The hash changes and the check fails", "Nothing is checked", "The window grows"], a: 1, why: "Even a 1-bit change produces a different hash value." },
  { q: "Where does flow control happen?", o: ["Only in TCP", "Only in UDP", "In both TCP and UDP", "Only at the Physical layer"], a: 0, why: "Flow control only happens in TCP. There is none in UDP." },
  { q: "What is single windowing?", o: ["Sending segments one by one", "Sending all segments at once", "Encrypting segments", "Dropping segments"], a: 0, why: "The old, inefficient approach that sends segments one by one." },
  { q: "In sliding windowing, what does the sender do when a packet goes missing?", o: ["Doubles the window", "Reverts to the previous window size and retransmits it", "Stops forever", "Switches to UDP"], a: 1, why: "It reverts to the previous window size and retransmits the missing packet." },
];

export function TransportQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QS.length;
  const q = QS[Math.min(i, QS.length - 1)];

  return (
    <Shell title="Transport layer check" desc="Fourteen quick questions on layer 4." badge="Practice">
      {done ? (
        <div className="tl-fade rounded-xl border bg-background p-4 text-sm">
          <p className="font-semibold">You scored {score} out of {QS.length}.</p>
          <p className="mt-1 text-xs text-muted-foreground">{score === QS.length ? "Perfect score." : "Revisit the labs above for the ones you missed."}</p>
        </div>
      ) : (
        <div key={i} className="tl-fade rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Question {i + 1} of {QS.length}</p>
          <p className="mt-1 text-sm font-medium">{q.q}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.o.map((o, k) => {
              const right = pick !== null && k === q.a;
              const wrong = pick === k && k !== q.a;
              return (
                <Button key={o} size="sm" variant="outline" disabled={pick !== null}
                  onClick={() => { setPick(k); if (k === q.a) setScore((s) => s + 1); }}
                  style={right ? { background: C.GREEN, color: "#fff", opacity: 1 } : wrong ? { background: C.RED, color: "#fff", opacity: 1 } : undefined}>
                  {o}
                </Button>
              );
            })}
          </div>
          {pick !== null && (
            <p className="tl-fade mt-3 text-xs leading-5" style={{ color: pick === q.a ? C.GREEN : C.RED }}>
              {pick === q.a ? "Correct. " : "Not quite. "}<span className="text-muted-foreground">{q.why}</span>
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {!done && pick !== null && <Button size="sm" onClick={() => { setPick(null); setI((x) => x + 1); }}>{i === QS.length - 1 ? "See score" : "Next question"}</Button>}
        <Button size="sm" variant="ghost" onClick={() => { setI(0); setPick(null); setScore(0); }}>Restart</Button>
      </div>
    </Shell>
  );
}

/* ───────────────────────── main export ───────────────────────── */

export function TransportLayer() {
  return (
    <div>
      <style>{`
        @keyframes tl-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes tl-travel { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes tl-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes tl-dash { to { stroke-dashoffset: -26; } }
        @keyframes tl-pop { 0% { opacity: 0; transform: scale(.6); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes tl-ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.5); } }
        .tl-pkt { animation: tl-move 2s linear infinite both; }
        .tl-once { animation-name: tl-travel; animation-iteration-count: 1; animation-timing-function: ease-in-out; animation-fill-mode: both; }
        .tl-fade { animation: tl-fade ${0.5 * SLOW}s ease-out both; }
        .tl-dash { animation: tl-dash ${1.2 * SLOW}s linear infinite; }
        .tl-pop { animation: tl-pop ${0.4 * SLOW}s ease-out both; transform-box: fill-box; transform-origin: center; }
        .tl-ring { animation: tl-ring ${1.6 * SLOW}s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tl-pkt, .tl-fade, .tl-dash, .tl-pop, .tl-ring { animation: none; opacity: 1; } .tl-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>
      <p className="text-sm text-muted-foreground">
        The Transport layer, also called the core layer and the heart of OSI, is responsible for the reliability of data through segmentation, sequencing, error control and flow control.
      </p>
      <TransportIntro />
      <SegmentationLab />
      <MemoryUnits />
      <PduLab />
      <TcpUdpLab />
      <ErrorControlLab />
      <WindowingLab />
      <TransportQuiz />
    </div>
  );
}

export default TransportLayer;