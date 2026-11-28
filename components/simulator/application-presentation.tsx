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
 * ApplicationPresentationLayers
 * 1 LayerMap          – OSI stack, the Application layer only talks to the Presentation layer
 * 2 AppLayerLab       – HTTP, HTTPS, FTP, SMTP: the app is outside the layer, the protocol is inside
 * 3 ResponsibilitiesWalk – identify partner, check resource availability, synchronize (with a busy server)
 * 4 PresentationLab   – sender and receiver walkthrough: syntax, machine data, compression, encryption
 * 5 CompareTable      – Layer 7 and Layer 6 side by side
 * 6 LayerQuiz         – practice questions
 * Rule to remember: Application = the protocols behind your apps. Presentation = translate, compress, encrypt.
 */

const SLOW = 1.4; // animation slow-down factor (1 = fast, higher = slower)

const C = {
  APP: "#1971c2",
  PRE: "#9c36b5",
  TEAL: "#0c8599",
  ORANGE: "#e8590c",
  PINK: "#d6336c",
  AMBER: "#f08c00",
  GREEN: "#2f9e44",
  RED: "#c92a2a",
  LBLUE: "#1c7ed6",
  GREY: "#868e96",
};
const mono = "ui-monospace, monospace";

type P = { x: number; y: number };

/* ───────────────────────── shared helpers ───────────────────────── */

const edge = (A: P, B: P, r = 28): [number, number, number, number] => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return [A.x + ux * r, A.y + uy * r, B.x - ux * r, B.y - uy * r];
};

/** mode: undefined = loops, "once" = plays one time and stays, number = time slot 0..3 inside a shared loop */
function Chip({
  a, b, r = 28, label, color, dur, delay, mode,
}: {
  a: P; b: P; r?: number; label: string; color: string; dur: number; delay: number; mode?: number | "once";
}) {
  const [x0, y0, x1, y1] = edge(a, b, r);
  const w = label.length * 6.2 + 16;
  const cls = mode === "once" ? "ap-pkt ap-once" : typeof mode === "number" ? `ap-pkt ap-s${mode}` : "ap-pkt";
  return (
    <g
      className={cls}
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

const Pills = <T extends string>({ items, sel, set, color }: { items: { id: T; label: string }[]; sel: T; set: (v: T) => void; color: string }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((x) => (
      <button key={x.id} onClick={() => set(x.id)} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        style={sel === x.id ? { background: color, borderColor: color, color: "#fff" } : { borderColor: `${color}66`, color }}>
        {x.label}
      </button>
    ))}
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
            {on && <span className="ap-fade mt-1 block text-muted-foreground">💬 {f.easy}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── 1. layer map ───────────────────────── */

const LAYERS: { n: number; name: string; note?: string }[] = [
  { n: 7, name: "Application", note: "HTTP, HTTPS, FTP, SMTP" },
  { n: 6, name: "Presentation", note: "syntax, compression, encryption" },
  { n: 5, name: "Session" },
  { n: 4, name: "Transport" },
  { n: 3, name: "Network" },
  { n: 2, name: "Data link" },
  { n: 1, name: "Physical" },
];
const ry = (n: number) => 20 + (7 - n) * 46;
const layerColor = (n: number) => (n === 7 ? C.APP : n === 6 ? C.PRE : C.GREY);

export function LayerMap() {
  const [tgt, setTgt] = useState<number | null>(null);
  const [k, setK] = useState(0);
  const pick = (n: number) => { setTgt(n); setK((v) => v + 1); };
  const lname = LAYERS.find((l) => l.n === tgt)?.name ?? "";
  const allowed = tgt === 6;
  const y7 = ry(7) + 19;
  const y6 = ry(6) + 19;
  const yt = tgt ? ry(tgt) + 19 : y7;

  return (
    <Shell title="Where the top two layers sit" desc="The Application layer (7) is the interface between the user and the network. Click a layer to test who it can talk to directly.">
      <Pills items={[6, 5, 4, 3, 2, 1].map((n) => ({ id: String(n), label: `Layer ${n} · ${LAYERS.find((l) => l.n === n)?.name}` }))}
        sel={tgt === null ? "" : String(tgt)} set={(v) => pick(Number(v))} color={C.APP} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 350" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="The seven OSI layers">
          <Node p={{ x: 70, y: ry(7) + 19 }} e="🧑" l="User" stroke={C.APP} />
          <Node p={{ x: 70, y: ry(1) + 19 }} e="☁️" l="Network" stroke={C.GREY} />
          <line x1={100} y1={y7} x2={150} y2={y7} stroke={C.APP} strokeWidth={2.5} strokeDasharray="7 6" className="ap-dash" />
          <line x1={100} y1={ry(1) + 19} x2={150} y2={ry(1) + 19} stroke={C.GREY} strokeWidth={2} strokeDasharray="7 6" className="ap-dash" />
          {LAYERS.map((l) => {
            const col = layerColor(l.n);
            const hot = l.n === 7 || l.n === 6;
            const isT = tgt === l.n;
            return (
              <g key={`${l.n}-${isT ? k : 0}`} className={`${l.n !== 7 ? "cursor-pointer" : ""} ${isT && !allowed ? "ap-shake" : ""}`} onClick={() => l.n !== 7 && pick(l.n)}>
                <rect x={150} y={ry(l.n)} width={300} height={38} rx={10} fill={col} fillOpacity={hot ? 0.18 : 0.06}
                  stroke={isT ? (allowed ? C.GREEN : C.RED) : col} strokeWidth={isT ? 4 : hot ? 3 : 1.5} style={{ transition: "stroke .3s" }} />
                <text x={165} y={ry(l.n) + 24} fontSize={13} fontWeight={700} className="fill-foreground">{l.n} · {l.name}</text>
                {l.note && <text x={440} y={ry(l.n) + 23} textAnchor="end" fontSize={10} fill={col}>{l.note}</text>}
              </g>
            );
          })}
          {allowed && (
            <g key={`ok-${k}`}>
              <Chip a={{ x: 300, y: y7 }} b={{ x: 300, y: y6 }} r={0} label="data" color={C.APP} dur={1.6 * SLOW} delay={0} />
              <Chip a={{ x: 380, y: y6 }} b={{ x: 380, y: y7 }} r={0} label="data" color={C.GREEN} dur={1.6 * SLOW} delay={0.8 * SLOW} />
            </g>
          )}
          {tgt !== null && !allowed && (
            <g key={`no-${k}`} className="ap-fade">
              <path d={`M450 ${y7} C 540 ${y7}, 540 ${yt}, 450 ${yt}`} fill="none" stroke={C.RED} strokeWidth={3} strokeDasharray="6 5" />
              <text x={548} y={(y7 + yt) / 2} fontSize={11} fontWeight={700} fill={C.RED}>✕ not direct</text>
            </g>
          )}
        </svg>
      </div>
      <p key={`${tgt}-${k}`} className="ap-fade rounded-xl border bg-background p-4 text-xs leading-5"
        style={{ borderColor: tgt === null ? undefined : allowed ? C.GREEN : C.RED, color: tgt === null ? undefined : allowed ? C.GREEN : C.RED }}>
        {tgt === null
          ? "Pick a layer to see whether the Application layer can talk to it directly."
          : allowed
            ? "Yes. The Application layer hands data to the Presentation layer and takes data back from it. This is the only layer it interacts with."
            : `No. The Application layer cannot talk to layer ${tgt} (${lname}) directly. It only interacts with the Presentation layer.`}
      </p>
      <Tip color={C.APP}>Layer 7 touches the user on one side and only layer 6 on the other.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 2. application layer lab ───────────────────────── */

type ProtoId = "HTTP" | "HTTPS" | "FTP" | "SMTP";
type Proto = { id: ProtoId; color: string; app: [string, string]; server: [string, string]; act: string; req: string; res: string; easy: string };

const PROTOS: Proto[] = [
  { id: "HTTP", color: C.APP, app: ["🌐", "Web browser"], server: ["🖥️", "Web server"], act: "open page", req: "GET page", res: "web page", easy: "HTTP is the set of rules a browser and a web server follow to ask for and send web pages." },
  { id: "HTTPS", color: C.GREEN, app: ["🌐", "Web browser"], server: ["🖥️", "Web server"], act: "open page", req: "🔒 GET page", res: "🔒 web page", easy: "HTTPS is the secure version of HTTP. The browser and the server still follow web rules, with the conversation protected." },
  { id: "FTP", color: C.ORANGE, app: ["📁", "FTP client"], server: ["🗄️", "FTP server"], act: "pick file", req: "upload file", res: "file saved", easy: "FTP is the set of rules for moving files from one computer to another." },
  { id: "SMTP", color: C.PINK, app: ["✉️", "Email app"], server: ["📮", "Mail server"], act: "press send", req: "send mail", res: "mail accepted", easy: "SMTP is the set of rules for sending email to a mail server." },
];

const APP_FACTS: Fact[] = [
  { t: "Acts as an interface between the user and the network.", easy: "You never touch cables or routers directly. This layer is the doorway between you and the network." },
  { t: "Works based on application layer protocols: HTTP, HTTPS, FTP, SMTP.", easy: "A protocol is a set of rules. Each of these covers one kind of job: web pages, secure web pages, file transfer and email." },
  { t: "These protocols control the user applications we interact with. The applications themselves are not part of the layer, but the protocols are.", easy: "Chrome or an email app are outside the layer. The rules they follow to talk over the network are the layer. Use the highlight button above to see it." },
  { t: "Other responsibilities: synchronizing communication, determining resource availability, identifying communication partners.", easy: "These are shown step by step in the walkthrough below." },
  { t: "The Application layer only interacts with the Presentation layer.", easy: "It passes data to layer 6 and receives data from layer 6, and never talks to the other layers directly." },
];

export function AppLayerLab() {
  const [id, setId] = useState<ProtoId>("HTTP");
  const [reveal, setReveal] = useState(false);
  const p = PROTOS.find((x) => x.id === id)!;
  const app: P = { x: 70, y: 130 };
  const pro: P = { x: 300, y: 130 };
  const srv: P = { x: 530, y: 130 };
  const cyc = 6 * SLOW;

  return (
    <Shell title="Application layer: protocols, not apps" desc="Pick a protocol and watch a request travel. The application you click is outside the layer. The protocol that controls it is inside.">
      <Pills items={PROTOS.map((x) => ({ id: x.id, label: x.id }))} sel={id} set={setId} color={p.color} />
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 270" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="An application, its protocol inside the Application layer, and a server">
          <rect x={170} y={30} width={260} height={200} rx={16} fill={p.color} fillOpacity={0.07} stroke={p.color} strokeWidth={2} strokeDasharray="6 5" />
          <text x={184} y={50} fontSize={12} fontWeight={700} fill={p.color}>Application layer (7)</text>
          <line {...lineProps(app, pro)} stroke={p.color} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="7 6" className="ap-dash" />
          <line {...lineProps(pro, srv)} stroke={p.color} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="7 6" className="ap-dash" />
          <Node p={app} e={p.app[0]} l={p.app[1]} stroke={reveal ? C.RED : C.GREY} />
          <Node p={pro} e="⚙️" l={`${p.id} protocol`} stroke={p.color} sw={3.5} />
          <Node p={srv} e={p.server[0]} l={p.server[1]} stroke={C.GREY} />
          {reveal && (
            <g key={`rv-${id}`} className="ap-fade">
              <text x={70} y={200} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.RED}>✕ not in the layer</text>
              <text x={300} y={200} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.GREEN}>✓ part of the layer</text>
            </g>
          )}
          <g key={id}>
            <Chip a={app} b={pro} label={p.act} color={C.AMBER} dur={cyc} delay={0} mode={0} />
            <Chip a={pro} b={srv} label={p.req} color={p.color} dur={cyc} delay={0} mode={1} />
            <Chip a={srv} b={pro} label={p.res} color={C.GREEN} dur={cyc} delay={0} mode={2} />
            <Chip a={pro} b={app} label="result" color={C.LBLUE} dur={cyc} delay={0} mode={3} />
          </g>
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={reveal ? "default" : "outline"} onClick={() => setReveal((v) => !v)} style={reveal ? { background: p.color } : undefined}>
          {reveal ? "Hide highlight" : "Highlight what is in the layer"}
        </Button>
        <Badge variant="secondary" style={{ color: p.color }}>Protocols: HTTP, HTTPS, FTP, SMTP</Badge>
      </div>
      <p key={id} className="ap-fade rounded-xl border bg-background p-4 text-xs leading-5 text-muted-foreground" style={{ borderColor: `${p.color}88` }}>
        <span className="font-semibold" style={{ color: p.color }}>{p.id}:</span> {p.easy}
      </p>
      <FactList facts={APP_FACTS} color={C.APP} />
      <Tip color={C.APP}>Apps are what you click. Protocols are the rules behind them, and only the rules belong to layer 7.</Tip>
    </Shell>
  );
}

function lineProps(a: P, b: P) {
  const [x1, y1, x2, y2] = edge(a, b);
  return { x1, y1, x2, y2 };
}

/* ───────────────────────── 3. responsibilities walkthrough ───────────────────────── */

type Side = "pc" | "srv";
type RChip = { dir: "fwd" | "back"; label: string; color: string; delay: number };
type RStep = { phase: number; title: string; text: string; chips: RChip[]; accept?: Side[]; deny?: Side[] };

const PHASES = ["1 · Identify partner", "2 · Check availability", "3 · Synchronize"];

function rSteps(busy: boolean): RStep[] {
  const s: RStep[] = [
    {
      phase: 1, title: "Step 1: identify the communication partner",
      text: "Before anything is sent, the email app must know who it is talking to. It asks for the mail server and the server answers with its identity.",
      chips: [{ dir: "fwd", label: "who are you?", color: C.AMBER, delay: 0 }, { dir: "back", label: "I am the mail server", color: C.GREEN, delay: 1 }],
      accept: ["srv"],
    },
    {
      phase: 2, title: "Step 2: determine resource availability",
      text: busy
        ? "The app asks if the server can take the mail. The server is busy, so it answers that it cannot right now."
        : "The app asks if the server is ready and has room to take the mail. The server answers that it is ready.",
      chips: [{ dir: "fwd", label: "ready for mail?", color: C.AMBER, delay: 0 }, { dir: "back", label: busy ? "busy, try later" : "ready, space free", color: busy ? C.RED : C.GREEN, delay: 1 }],
      accept: busy ? undefined : ["srv"],
      deny: busy ? ["srv"] : undefined,
    },
  ];
  if (busy) {
    s.push({
      phase: 2, title: "Communication is not started",
      text: "The resource is not available, so the application layer does not start sending. The app can try again later. Switch the server back to ready to see the full flow.",
      chips: [], deny: ["srv"],
    });
  } else {
    s.push({
      phase: 3, title: "Step 3: synchronize the communication",
      text: "Both sides agree when to start and take turns. The app sends only when the server says go, and the server confirms each piece it receives.",
      chips: [
        { dir: "fwd", label: "start now?", color: C.AMBER, delay: 0 },
        { dir: "back", label: "go ahead", color: C.GREEN, delay: 1 },
        { dir: "fwd", label: "mail data", color: C.APP, delay: 2 },
        { dir: "back", label: "got it", color: C.GREEN, delay: 3 },
      ],
      accept: ["pc", "srv"],
    });
  }
  return s;
}

export function ResponsibilitiesWalk() {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = rSteps(busy);
  const N = steps.length;
  const done = step >= N;
  const cur = step > 0 ? steps[step - 1] : null;
  const curPhase = cur ? cur.phase - 1 : -1;
  const pc: P = { x: 90, y: 105 };
  const srv: P = { x: 510, y: 105 };
  const lane = (d: "fwd" | "back"): [P, P] => (d === "fwd" ? [{ x: 124, y: 92 }, { x: 476, y: 92 }] : [{ x: 476, y: 120 }, { x: 124, y: 120 }]);
  const maxD = cur ? Math.max(0, ...cur.chips.map((c) => c.delay)) : 0;
  const badgeDelay = (maxD + 1) * 1.2 * SLOW;

  useEffect(() => {
    if (!playing) return;
    if (step >= N) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => Math.min(N, s + 1)), 5500);
    return () => clearTimeout(t);
  }, [playing, step, N]);

  return (
    <Shell title="Application layer duties: a mail is about to be sent" desc="Besides running the protocols, the layer identifies partners, checks resources and synchronizes the conversation. Step through it, then try a busy server.">
      <div className="flex flex-wrap gap-2">
        {PHASES.map((label, i) => (
          <span key={label} className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={i === curPhase ? { background: C.APP, borderColor: C.APP, color: "#fff" } : i < curPhase ? { borderColor: `${C.APP}66`, background: `${C.APP}18`, color: C.APP } : { color: C.GREY }}>
            {label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 220" className="mx-auto min-w-[520px] max-w-[760px]" role="img" aria-label="An email app and a mail server negotiating">
          <line x1={124} y1={92} x2={476} y2={92} stroke={C.APP} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="7 6" className="ap-dash" />
          <line x1={124} y1={120} x2={476} y2={120} stroke={C.APP} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="7 6" className="ap-dash" />
          <Node p={pc} e="💻" l="Email app (PC)" stroke={cur?.accept?.includes("pc") ? C.GREEN : C.APP} sw={3} sub="Application layer" />
          <Node p={srv} e="📮" l="Mail server" stroke={cur?.deny?.includes("srv") ? C.RED : cur?.accept?.includes("srv") ? C.GREEN : C.APP} sw={3} sub={busy ? "currently busy" : "ready"} />
          {([["pc", pc], ["srv", srv]] as [Side, P][]).map(([id, pos]) => {
            const ok = cur?.accept?.includes(id);
            const no = cur?.deny?.includes(id);
            if (!ok && !no) return null;
            return (
              <text key={`${step}-${id}`} x={pos.x} y={pos.y - 40} textAnchor="middle" fontSize={12} fontWeight={700} fill={ok ? C.GREEN : C.RED}
                className="ap-pop" style={{ animationDelay: `${badgeDelay}s` }}>
                {ok ? "✓ ready" : "✕ not available"}
              </text>
            );
          })}
          {cur?.chips.map((c, i) => {
            const [a, b] = lane(c.dir);
            return <Chip key={`${step}-${busy}-${i}`} a={a} b={b} r={0} label={c.label} color={c.color} dur={1.2 * SLOW} delay={c.delay * 1.2 * SLOW} mode="once" />;
          })}
        </svg>
      </div>

      <div className="rounded-xl border bg-background p-4">
        {cur ? (
          <div key={`${step}-${busy}`} className="ap-fade flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Step {step} of {N}</p>
            <p className="text-sm font-semibold">{cur.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">{cur.text}</p>
            {done && !busy && <p className="text-xs font-medium" style={{ color: C.GREEN }}>All three jobs are done, so the mail can now be sent safely.</p>}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">Press Start to follow an email app preparing to talk to a mail server. You can make the server busy first and see what changes.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={step <= 1} onClick={() => { setPlaying(false); setStep((s) => Math.max(1, s - 1)); }}>Back</Button>
        {step === 0 || done ? (
          <Button size="sm" onClick={() => { setPlaying(false); setStep(1); }}>{done ? "Replay" : "Start"}</Button>
        ) : (
          <Button size="sm" onClick={() => { setPlaying(false); setStep((s) => Math.min(N, s + 1)); }}>Next step</Button>
        )}
        <Button size="sm" variant="outline" disabled={step === 0 || done} onClick={() => setPlaying((v) => !v)}>{playing ? "Pause" : "Auto-play"}</Button>
        <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => { setPlaying(false); setStep(0); }}>Reset</Button>
        <Button size="sm" variant="outline" onClick={() => { setBusy((v) => !v); setStep(0); setPlaying(false); }} style={busy ? { background: C.RED, color: "#fff" } : undefined}>
          Server is {busy ? "busy" : "ready"}: switch
        </Button>
      </div>
      <Tip color={C.APP}>Identify who, check if they are available, then agree on timing. Only then does the data flow.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 4. presentation lab ───────────────────────── */

type Form = "user" | "raw" | "compressed" | "encrypted" | "machine";
type NK = "sApp" | "sPre" | "net" | "rPre" | "rApp";
type PStep = { title: string; text: string; data: string; form: Form; side: "Sender side" | "Network" | "Receiver side"; from?: NK; to?: NK; label?: string; active: NK[] };

const FORM: Record<Form, { label: string; color: string }> = {
  user: { label: "User data (with syntax)", color: C.APP },
  raw: { label: "Plain data (no syntax)", color: C.TEAL },
  compressed: { label: "Compressed data", color: C.ORANGE },
  encrypted: { label: "Encrypted data", color: C.PINK },
  machine: { label: "Machine data (bits)", color: C.PRE },
};

const NPOS: Record<NK, P> = {
  sApp: { x: 100, y: 75 }, sPre: { x: 100, y: 195 }, net: { x: 300, y: 195 }, rPre: { x: 500, y: 195 }, rApp: { x: 500, y: 75 },
};

const cleanText = (s: string) => s.replace(/[^a-zA-Z ]/g, "").slice(0, 14);
const wrap = (t: string) => `<b>${t}</b>  (message.txt)`;
const toBits = (s: string) => [...s].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
const rle = (s: string) => {
  let o = "";
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    const n = j - i;
    o += n > 1 ? `${n}${s[i]}` : s[i];
    i = j;
  }
  return o;
};
const unrle = (s: string) => s.replace(/(\d+)(.)/g, (_m: string, n: string, c: string) => c.repeat(Number(n)));
const shift = (s: string, k: number) =>
  s.replace(/[a-z]/gi, (ch) => {
    const b = ch <= "Z" ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - b + k + 26) % 26) + b);
  });

function buildPSteps(t: string, comp: boolean, enc: boolean): { steps: PStep[]; payload: string } {
  const s: PStep[] = [];
  let p = t;
  s.push({ title: "Application layer hands over user data", text: "The user data still has its syntax: formatting tags and a file extension. This is how people and apps see it.", data: wrap(t), form: "user", side: "Sender side", from: "sApp", to: "sPre", label: "user data", active: ["sApp", "sPre"] });
  s.push({ title: "Presentation layer removes the syntax", text: "The data syntax and the extension are removed, because the network does not need them. Only the real data is left.", data: t, form: "raw", side: "Sender side", active: ["sPre"] });
  if (comp) {
    p = rle(p);
    s.push({ title: "Compress the data (if required)", text: "Compression makes the data smaller so it is faster to send. This example uses simple run-length counting: 4e means four e letters.", data: p, form: "compressed", side: "Sender side", active: ["sPre"] });
  }
  if (enc) {
    p = shift(p, 3);
    s.push({ title: "Encrypt the data (if required)", text: "Encryption scrambles the data so nobody on the way can read it. This example shifts every letter by 3, and real encryption is far stronger.", data: p, form: "encrypted", side: "Sender side", active: ["sPre"] });
  }
  const bits = toBits(p);
  s.push({ title: "Convert user data into machine data", text: "Computers only understand 0s and 1s. Every character becomes 8 bits.", data: bits, form: "machine", side: "Sender side", active: ["sPre"] });
  s.push({ title: "Machine data goes down and across the network", text: "The lower layers carry the machine data across the network to the receiver.", data: bits, form: "machine", side: "Network", from: "sPre", to: "net", label: "machine data", active: ["sPre", "net"] });
  s.push({ title: "Machine data arrives at the receiver", text: "The receiver's lower layers pass the machine data up to its Presentation layer.", data: bits, form: "machine", side: "Network", from: "net", to: "rPre", label: "machine data", active: ["net", "rPre"] });
  s.push({ title: "Convert machine data back", text: "The 0s and 1s are turned back into characters.", data: p, form: enc ? "encrypted" : comp ? "compressed" : "raw", side: "Receiver side", active: ["rPre"] });
  if (enc) {
    p = shift(p, -3);
    s.push({ title: "Decrypt the data", text: "The scrambled data is turned back into readable data with the matching key (shift by 3 backwards).", data: p, form: comp ? "compressed" : "raw", side: "Receiver side", active: ["rPre"] });
  }
  if (comp) {
    p = unrle(p);
    s.push({ title: "Decompress the data", text: "The counts are expanded back into the full data.", data: p, form: "raw", side: "Receiver side", active: ["rPre"] });
  }
  s.push({ title: "Reattach the syntax", text: "The syntax and extension are put back so the data is in the user data format again.", data: wrap(t), form: "user", side: "Receiver side", active: ["rPre"] });
  s.push({ title: "Present the data to the Application layer", text: "The Presentation layer hands the finished user data to the Application layer, which shows it to the user.", data: wrap(t), form: "user", side: "Receiver side", from: "rPre", to: "rApp", label: "user data", active: ["rPre", "rApp"] });
  let payload = t;
  if (comp) payload = rle(payload);
  if (enc) payload = shift(payload, 3);
  return { steps: s, payload };
}

const PRE_FACTS: Fact[] = [
  { t: "On the sender side, removes data syntaxes and extensions and converts user data into machine data.", easy: "Formatting and file extensions are for humans and apps. The network only needs raw 0s and 1s." },
  { t: "On the receiver side, converts machine data back into user data format by reattaching syntaxes, then presents it to the Application layer.", easy: "The receiver does the same job in reverse, then hands a normal file or message to layer 7." },
  { t: "Also responsible for compression and encryption, if required.", easy: "Compression makes data smaller. Encryption makes it unreadable to outsiders. Use the toggles above to see both. They only happen when needed." },
];

export function PresentationLab() {
  const [text, setText] = useState("Heeello");
  const [comp, setComp] = useState(false);
  const [enc, setEnc] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const t = cleanText(text).trim() || "Hello";
  const { steps, payload } = buildPSteps(t, comp, enc);
  const N = steps.length;
  const done = step >= N;
  const cur = step > 0 ? steps[step - 1] : null;
  const shown = cur ?? { data: wrap(t), form: "user" as Form };
  const base = t.length * 8;
  const sent = payload.length * 8;
  const max = Math.max(base, sent) || 1;
  const tags = `${comp ? "compress " : ""}${enc ? "encrypt" : ""}`.trim();
  const baseColor: Record<NK, string> = { sApp: C.APP, sPre: C.PRE, net: C.TEAL, rPre: C.PRE, rApp: C.APP };
  const nodeLabel: Record<NK, [string, string]> = {
    sApp: ["💻", "Application (7)"], sPre: ["🔧", "Presentation (6)"], net: ["☁️", "Lower layers + network"], rPre: ["🔧", "Presentation (6)"], rApp: ["🖥️", "Application (7)"],
  };

  useEffect(() => {
    if (!playing) return;
    if (step >= N) { setPlaying(false); return; }
    const id = setTimeout(() => setStep((s) => Math.min(N, s + 1)), 5000);
    return () => clearTimeout(id);
  }, [playing, step, N]);

  const reset = () => { setPlaying(false); setStep(0); };

  return (
    <Shell title="Presentation layer: translate, compress, encrypt" desc="Type a short message and follow it from the sender's Application layer, through the Presentation layer, across the network and back up to the receiver.">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="ap-msg">Message (letters only):</label>
        <input id="ap-msg" value={text} onChange={(e) => { setText(cleanText(e.target.value)); reset(); }} maxLength={14}
          className="rounded-md border bg-background px-3 py-1.5 font-mono text-xs" />
        <Button size="sm" variant={comp ? "default" : "outline"} onClick={() => { setComp((v) => !v); reset(); }} style={comp ? { background: C.ORANGE } : undefined}>Compression: {comp ? "ON" : "OFF"}</Button>
        <Button size="sm" variant={enc ? "default" : "outline"} onClick={() => { setEnc((v) => !v); reset(); }} style={enc ? { background: C.PINK } : undefined}>Encryption: {enc ? "ON" : "OFF"}</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background p-3">
        <svg viewBox="0 0 600 290" className="mx-auto min-w-[560px] max-w-[760px]" role="img" aria-label="Sender and receiver layers with the network in between">
          <text x={100} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={C.APP}>Sender side</text>
          <text x={500} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={C.APP}>Receiver side</text>
          {([["sApp", "sPre"], ["sPre", "net"], ["net", "rPre"], ["rPre", "rApp"]] as [NK, NK][]).map(([a, b]) => (
            <line key={a + b} {...lineProps(NPOS[a], NPOS[b])} stroke={C.GREY} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="7 6" className="ap-dash" />
          ))}
          {(Object.keys(NPOS) as NK[]).map((k) => (
            <Node key={k} p={NPOS[k]} e={nodeLabel[k][0]} l={nodeLabel[k][1]} stroke={cur?.active.includes(k) ? C.AMBER : baseColor[k]} sw={cur?.active.includes(k) ? 4 : 2.5}
              sub={(k === "sPre" || k === "rPre") && tags ? tags : undefined} />
          ))}
          {cur?.from && cur.to && cur.label && (
            <Chip key={`pc-${step}-${comp}-${enc}`} a={NPOS[cur.from]} b={NPOS[cur.to]} label={cur.label} color={FORM[cur.form].color} dur={1.3 * SLOW} delay={0} mode="once" />
          )}
        </svg>
      </div>

      <div className="rounded-xl border bg-background p-4" style={{ borderColor: `${FORM[shown.form].color}88` }}>
        {cur ? (
          <div key={`${step}-${comp}-${enc}`} className="ap-fade flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">Step {step} of {N}</p>
              <Badge variant="secondary">{cur.side}</Badge>
            </div>
            <p className="text-sm font-semibold">{cur.title}</p>
            <p className="text-xs leading-5 text-muted-foreground">{cur.text}</p>
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">Press Start. The sender begins with user data. Switch compression and encryption on to see the extra steps that happen only when required.</p>
        )}
        <div key={`d-${step}`} className="ap-fade mt-3 rounded-lg border px-3 py-2" style={{ borderColor: FORM[shown.form].color, background: `${FORM[shown.form].color}10` }}>
          <p className="text-[11px] font-semibold" style={{ color: FORM[shown.form].color }}>{FORM[shown.form].label}</p>
          <p className="mt-1 break-all font-mono text-xs">{shown.data}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={step <= 1} onClick={() => { setPlaying(false); setStep((s) => Math.max(1, s - 1)); }}>Back</Button>
        {step === 0 || done ? (
          <Button size="sm" onClick={() => { setPlaying(false); setStep(1); }}>{done ? "Replay" : "Start"}</Button>
        ) : (
          <Button size="sm" onClick={() => { setPlaying(false); setStep((s) => Math.min(N, s + 1)); }}>Next step</Button>
        )}
        <Button size="sm" variant="outline" disabled={step === 0 || done} onClick={() => setPlaying((v) => !v)}>{playing ? "Pause" : "Auto-play"}</Button>
        <Button size="sm" variant="ghost" disabled={step === 0} onClick={reset}>Reset</Button>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <p className="mb-2 text-xs font-medium">Bits sent over the network (example)</p>
        {[["Without compression", base, C.GREY], ["With your settings", sent, comp ? C.ORANGE : C.PRE]].map(([label, v, col]) => (
          <div key={label as string} className="mb-2 grid grid-cols-[130px_1fr_70px] items-center gap-2 text-xs">
            <span>{label as string}</span>
            <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${((v as number) / max) * 100}%`, background: col as string, transition: "width .5s" }} /></div>
            <span className="font-mono">{v as number} bits</span>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Try a message with repeated letters such as "Heeello" and turn compression on.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[480px] text-xs">
          <thead className="bg-muted/50"><tr>{["", "Sender side", "Receiver side"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {[
              ["Syntax and extensions", "Removed", "Reattached"],
              ["Data form", "User data to machine data", "Machine data to user data"],
              ["If required", "Compress, then encrypt", "Decrypt, then decompress"],
              ["Hands the data to", "Lower layers", "Application layer"],
            ].map((r) => (
              <tr key={r[0]} className="border-t">
                <td className="px-3 py-2 font-semibold" style={{ color: C.PRE }}>{r[0]}</td><td className="px-3 py-2">{r[1]}</td><td className="px-3 py-2">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FactList facts={PRE_FACTS} color={C.PRE} />
      <Tip color={C.PRE}>Sender: strip syntax, convert to bits. Receiver: bits back to data, reattach syntax. Compression and encryption only when required.</Tip>
    </Shell>
  );
}

/* ───────────────────────── 5. compare ───────────────────────── */

export function CompareTable() {
  const [sel, setSel] = useState<"7" | "6">("7");
  const col = sel === "7" ? C.APP : C.PRE;
  const rows: [string, string, string][] = [
    ["Main job", "Interface between the user and the network", "Translate user data to machine data and back"],
    ["What it uses", "Protocols: HTTP, HTTPS, FTP, SMTP", "Syntax handling, compression, encryption"],
    ["Talks to", "Only the Presentation layer", "The Application layer and the layers below"],
    ["Other duties", "Synchronize, check resources, identify partners", "Compress and encrypt, if required"],
    ["Is the app part of it?", "No. The protocols are, the apps are not", "Not applicable"],
  ];
  return (
    <Shell title="Layer 7 and layer 6 side by side" desc="Pick a layer to highlight its column." badge="Cheat sheet">
      <Pills items={[{ id: "7" as const, label: "7 · Application" }, { id: "6" as const, label: "6 · Presentation" }]} sel={sel} set={setSel} color={col} />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left font-medium" /><th className="px-3 py-2 text-left font-medium" style={sel === "7" ? { color: C.APP } : undefined}>7 · Application</th><th className="px-3 py-2 text-left font-medium" style={sel === "6" ? { color: C.PRE } : undefined}>6 · Presentation</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t">
                <td className="px-3 py-2 font-semibold">{r[0]}</td>
                <td className="px-3 py-2" style={sel === "7" ? { background: `${C.APP}10`, color: C.APP, fontWeight: 600 } : undefined}>{r[1]}</td>
                <td className="px-3 py-2" style={sel === "6" ? { background: `${C.PRE}10`, color: C.PRE, fontWeight: 600 } : undefined}>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

/* ───────────────────────── 6. quiz ───────────────────────── */

const QS: { q: string; o: string[]; a: number; why: string }[] = [
  { q: "Which layer is the interface between the user and the network?", o: ["Application", "Presentation", "Session", "Physical"], a: 0, why: "The Application layer (7)." },
  { q: "Which of these are Application layer protocols?", o: ["HTTP, HTTPS, FTP, SMTP", "Only HTTP", "Cat 5, Cat 6", "SFP, QSFP"], a: 0, why: "HTTP, HTTPS, FTP and SMTP." },
  { q: "Is a web browser itself part of the Application layer?", o: ["Yes, the app is the layer", "No, only the protocols are", "Only on the receiver", "Only when encrypted"], a: 1, why: "The applications are not part of the layer, but the protocols that control them are." },
  { q: "Which job is NOT done by the Application layer?", o: ["Synchronizing communication", "Determining resource availability", "Identifying communication partners", "Compressing and encrypting data"], a: 3, why: "Compression and encryption belong to the Presentation layer." },
  { q: "Which layer does the Application layer interact with?", o: ["Session", "Transport", "Presentation", "All layers"], a: 2, why: "Only the Presentation layer." },
  { q: "Which layer converts user data into machine data on the sender?", o: ["Application", "Presentation", "Network", "Data link"], a: 1, why: "The Presentation layer removes syntaxes and extensions, then converts to machine data." },
  { q: "What does the receiver's Presentation layer do with machine data?", o: ["Deletes it", "Encrypts it again", "Converts it back and reattaches syntaxes", "Sends it to layer 1"], a: 2, why: "It restores the user data format, then presents it to the Application layer." },
  { q: "Which layer handles compression and encryption, if required?", o: ["Application", "Presentation", "Transport", "Physical"], a: 1, why: "The Presentation layer." },
  { q: "Which protocol is used to send email?", o: ["HTTP", "FTP", "SMTP", "HTTPS"], a: 2, why: "SMTP." },
  { q: "On the receiver side, the Presentation layer presents data to which layer?", o: ["Application", "Session", "Network", "Presentation again"], a: 0, why: "The Application layer, which shows it to the user." },
];

export function LayerQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QS.length;
  const q = QS[Math.min(i, QS.length - 1)];

  return (
    <Shell title="Layer 7 and 6 check" desc="Ten quick questions on the Application and Presentation layers." badge="Practice">
      {done ? (
        <div className="ap-fade rounded-xl border bg-background p-4 text-sm">
          <p className="font-semibold">You scored {score} out of {QS.length}.</p>
          <p className="mt-1 text-xs text-muted-foreground">{score === QS.length ? "Perfect score." : "Revisit the labs above for the ones you missed."}</p>
        </div>
      ) : (
        <div key={i} className="ap-fade rounded-xl border bg-background p-4">
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
            <p className="ap-fade mt-3 text-xs leading-5" style={{ color: pick === q.a ? C.GREEN : C.RED }}>
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

export function ApplicationPresentationLayers() {
  return (
    <div>
      <style>{`
        @keyframes ap-move { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes ap-travel { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 10% { opacity: 1; } 100% { opacity: 1; transform: translate(var(--x1), var(--y1)); } }
        @keyframes ap-s0 { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 1% { opacity: 1; } 24% { opacity: 1; } 25%, 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes ap-s1 { 0%, 25% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 26% { opacity: 1; } 49% { opacity: 1; } 50%, 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes ap-s2 { 0%, 50% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 51% { opacity: 1; } 74% { opacity: 1; } 75%, 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes ap-s3 { 0%, 75% { opacity: 0; transform: translate(var(--x0), var(--y0)); } 76% { opacity: 1; } 99% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)); } }
        @keyframes ap-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes ap-dash { to { stroke-dashoffset: -26; } }
        @keyframes ap-pop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ap-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .ap-pkt { animation: ap-move 2s linear infinite both; }
        .ap-once { animation-name: ap-travel; animation-iteration-count: 1; animation-timing-function: ease-in-out; animation-fill-mode: both; }
        .ap-s0 { animation-name: ap-s0; } .ap-s1 { animation-name: ap-s1; } .ap-s2 { animation-name: ap-s2; } .ap-s3 { animation-name: ap-s3; }
        .ap-fade { animation: ap-fade ${0.5 * SLOW}s ease-out both; }
        .ap-dash { animation: ap-dash ${1.2 * SLOW}s linear infinite; }
        .ap-pop { animation: ap-pop ${0.4 * SLOW}s ease-out both; }
        .ap-shake { animation: ap-shake .4s ease-in-out; }
        @media (prefers-reduced-motion: reduce) { .ap-pkt, .ap-fade, .ap-dash, .ap-pop, .ap-shake { animation: none; opacity: 1; } .ap-pkt { transform: translate(var(--x1), var(--y1)); } }
      `}</style>
      <p className="text-sm text-muted-foreground">
        The Application layer (7) is the interface between the user and the network, and the Presentation layer (6) prepares the data: it translates, and compresses and encrypts it when required.
      </p>
      <LayerMap />
      <AppLayerLab />
      <ResponsibilitiesWalk />
      <PresentationLab />
      <CompareTable />
      <LayerQuiz />
    </div>
  );
}

export default ApplicationPresentationLayers;