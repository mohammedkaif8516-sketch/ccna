"use client";

import { useEffect, useState } from "react";
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
 * TransportLayerExplainer  (CCNA Topic 06)
 *   1 Big picture   : IP finds the host, the port finds the app (animated delivery)
 *   2 TCP vs UDP    : lossy-link race, header sizes, side-by-side table
 *   3 Handshakes    : animated 3-way open, 4-way close and RST with live state changes
 *   4 Flags and flow: the six flags, plus a sliding-window playground
 *   5 Ports         : ranges, lookup, ports to memorize, source-port roller
 *   6 Sizes         : MTU and MSS calculator, protocol numbers
 *   7 Common mistakes: wrong belief on the front, the truth on the back
 *   8 Interview prep : 30-second answer and the usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";

const TABS = [
  { id: "big", label: "1 · Big picture" },
  { id: "tcpudp", label: "2 · TCP vs UDP" },
  { id: "hand", label: "3 · Handshakes" },
  { id: "flags", label: "4 · Flags and flow" },
  { id: "ports", label: "5 · Ports" },
  { id: "sizes", label: "6 · Sizes" },
  { id: "myths", label: "7 · Common mistakes" },
  { id: "interview", label: "8 · Interview prep" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ───────────────────────── small helpers ───────────────────────── */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-background p-4 ${className}`}>{children}</div>;
}

function Tip({ title = "Remember", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-primary">{title}: </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function SimpleTable({ head, rows, hit }: { head: string[]; rows: string[][]; hit?: number | number[] }) {
  const hits = Array.isArray(hit) ? hit : hit === undefined ? [] : [hit];
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[480px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t transition-colors" style={hits.includes(i) ? { color: GREEN, fontWeight: 600, background: `${GREEN}10` } : undefined}>
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold" : ""}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

function Mini({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
      <p className="break-words text-xs font-medium" style={color ? { color } : undefined}>{v}</p>
    </div>
  );
}

/* ───────────────────────── 1 · big picture ───────────────────────── */

const SERVICES = [
  { n: "Web (HTTPS)", p: 443, t: "TCP", sp: 51514 },
  { n: "DNS", p: 53, t: "UDP", sp: 49821 },
  { n: "SSH", p: 22, t: "TCP", sp: 60233 },
  { n: "Email (SMTP)", p: 25, t: "TCP", sp: 55102 },
];

function BigSection() {
  const [sel, setSel] = useState(0);
  const s = SERVICES[sel];
  const apps = [...SERVICES].sort((a, b) => a.p - b.p);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Layer 4 delivers data to the right process on another host</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Two things decide how: the <span className="font-semibold text-foreground">protocol</span> (TCP for reliability, UDP for speed)
          and the <span className="font-semibold text-foreground">port number</span> (which application on the receiving host gets the data).
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Mini k="IP address" v="Finds the host" color={BLUE} />
          <Mini k="Port number" v="Finds the application" color={GREEN} />
          <Mini k="Protocol" v="Decides how reliable the delivery is" color={AMBER} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">TCP data unit: segment</Badge>
          <Badge variant="secondary">UDP data unit: datagram</Badge>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Watch a request find its application</p>
        <p className="mt-1 text-xs text-muted-foreground">Pick a service. The destination port picks the app on the server.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICES.map((x, i) => (
            <Pick key={x.n} active={sel === i} onClick={() => setSel(i)}>{x.n}</Pick>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-[110px_1fr_150px] items-center gap-2">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-xs font-semibold">Client</p>
            <p className="font-mono text-[10px] text-muted-foreground">192.168.1.10</p>
            <p key={sel} className="n6-pop mt-1 rounded-md px-1 font-mono text-xs font-bold" style={{ background: `${PURPLE}18`, color: PURPLE }}>
              src {s.sp}
            </p>
          </div>

          <div className="relative h-14">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            <div
              key={sel}
              className="n6-fly absolute top-1/2 -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[10px] font-bold text-white"
              style={{ background: s.t === "TCP" ? BLUE : AMBER }}
            >
              {s.t} :{s.p}
            </div>
          </div>

          <div className="rounded-lg border p-2">
            <p className="text-center text-xs font-semibold">Server</p>
            <p className="text-center font-mono text-[10px] text-muted-foreground">203.0.113.10</p>
            <div className="mt-1 flex flex-col gap-1">
              {apps.map((a) => {
                const on = a.p === s.p;
                return (
                  <div
                    key={a.p + (on ? `-${sel}` : "")}
                    className={`rounded-md border px-2 py-1 text-[11px] transition-all ${on ? "n6-ring font-semibold" : "opacity-40"}`}
                    style={{ borderColor: on ? GREEN : undefined, background: on ? `${GREEN}18` : undefined, color: on ? GREEN : undefined }}
                  >
                    <span className="font-mono">{a.p}</span> {a.n}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p key={`t-${sel}`} className="n6-fade mt-3 text-xs leading-5 text-muted-foreground">
          The client picks a random source port (<span className="font-mono">{s.sp}</span>) so replies find their way back to the right
          program. The destination port <span className="font-mono">{s.p}</span> tells the server which application should receive the
          data. {s.t === "UDP" ? "DNS queries are small, so they usually use UDP." : "This service needs reliable, ordered delivery, so it uses TCP."}
        </p>
      </Panel>

      <Tip>IP finds the host. The port finds the application. The protocol decides how reliable the delivery is.</Tip>
    </div>
  );
}

/* ───────────────────────── 2 · TCP vs UDP ───────────────────────── */

const TCPUDP = [
  ["Connection", "Connection-oriented (handshake first)", "Connectionless (no handshake)"],
  ["Reliability", "Guaranteed delivery or an error is reported", "Best effort, no guarantee"],
  ["Ordering", "Reordered using sequence numbers", "No reordering"],
  ["Flow control", "Yes (sliding window)", "No"],
  ["Error checking", "Checksum, plus sequence numbers and ACKs", "Checksum only (no ACKs, no retransmit)"],
  ["Header size", "20 bytes minimum (up to 60)", "8 bytes fixed"],
  ["Speed", "Slower, more overhead", "Fast, minimal overhead"],
  ["Used by", "HTTP, HTTPS, FTP, SMTP, SSH", "DNS, DHCP, TFTP, VoIP (RTP), streaming"],
];

function simState(mode: "tcp" | "udp", t: number, k: number) {
  const wait = { label: "waiting", color: "", key: "w" };
  if (t < k) return wait;
  if (mode === "udp") return k === 4 ? { label: "lost", color: RED, key: "l" } : { label: "arrived", color: GREEN, key: "a" };
  if (k <= 3) return { label: "arrived", color: GREEN, key: "a" };
  if (k === 4) {
    if (t < 7) return { label: "lost", color: RED, key: "l" };
    if (t === 7) return { label: "resending", color: BLUE, key: "r" };
    return { label: "arrived", color: GREEN, key: "a2" };
  }
  return t < 8 ? { label: "buffered", color: AMBER, key: "b" } : { label: "delivered", color: GREEN, key: "d" };
}

const SIM_MSG: Record<"tcp" | "udp", string[]> = {
  udp: [
    "Press Play to send 6 packets over a link that drops packet 4.",
    "Packet 1 sent. UDP just sends. No handshake first.",
    "Packet 2 sent.",
    "Packet 3 sent.",
    "Packet 4 sent... and lost on the way. UDP does not know and does not care.",
    "Packet 5 sent. No waiting, no ACK.",
    "Packet 6 sent. Done in 6 steps. Packet 4 never arrives and nobody retries. For a voice call, that is one lost syllable.",
  ],
  tcp: [
    "Press Play to send 6 segments over a link that drops segment 4.",
    "Segment 1 sent and acknowledged.",
    "Segment 2 sent and acknowledged.",
    "Segment 3 sent and acknowledged.",
    "Segment 4 is lost. The sender will not get an ACK for it.",
    "Segment 5 arrives, but it is out of order. The receiver buffers it and keeps asking for 4.",
    "Segment 6 arrives and is buffered too.",
    "Timeout: no ACK for segment 4, so the sender retransmits it.",
    "Segment 4 arrives. The buffered 5 and 6 are released, all six delivered in order. Done in 8 steps: slower, but complete.",
  ],
};

function TcpUdpSection() {
  const [mode, setMode] = useState<"tcp" | "udp">("tcp");
  const [t, setT] = useState(0);
  const [play, setPlay] = useState(false);
  const max = mode === "tcp" ? 8 : 6;

  useEffect(() => {
    if (!play) return;
    if (t >= max) { setPlay(false); return; }
    const id = setTimeout(() => setT((v) => v + 1), 800);
    return () => clearTimeout(id);
  }, [play, t, max]);

  const reset = (m: "tcp" | "udp") => { setMode(m); setT(0); setPlay(false); };

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Same lossy link, two protocols</p>
        <p className="mt-1 text-xs text-muted-foreground">Packet 4 will be dropped. See what each protocol does about it.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pick active={mode === "tcp"} onClick={() => reset("tcp")}>TCP</Pick>
          <Pick active={mode === "udp"} onClick={() => reset("udp")}>UDP</Pick>
          <Button size="sm" onClick={() => { if (t >= max) setT(0); setPlay(true); if (t >= max) setTimeout(() => setT(1), 50); else if (t === 0) setT(1); }}>
            {t >= max ? "Replay" : t === 0 ? "Play" : "Resume"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setPlay(false); setT(0); }}>Reset</Button>
        </div>

        <div className="mt-4 grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((k) => {
            const st = simState(mode, t, k);
            return (
              <div
                key={`${mode}-${k}-${st.key}`}
                className="n6-pop flex flex-col items-center gap-1 rounded-lg border py-3"
                style={{ borderColor: st.color || undefined, background: st.color ? `${st.color}14` : undefined, opacity: st.key === "w" ? 0.4 : 1 }}
              >
                <span className="font-mono text-sm font-bold" style={{ color: st.color || undefined }}>{k}</span>
                <span className="text-[10px] font-medium" style={{ color: st.color || undefined }}>{st.label}</span>
              </div>
            );
          })}
        </div>

        <p key={`${mode}-${t}`} className="n6-fade mt-3 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">{SIM_MSG[mode][t]}</p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(t / max) * 100}%`, background: mode === "tcp" ? BLUE : AMBER }} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Header size</p>
        <div className="mt-3 flex flex-col gap-2">
          {[
            { n: "TCP", b: 20, note: "20 bytes minimum, up to 60 with options", c: BLUE },
            { n: "UDP", b: 8, note: "8 bytes fixed", c: AMBER },
          ].map((h) => (
            <div key={h.n} className="flex items-center gap-3 text-xs">
              <span className="w-10 font-semibold">{h.n}</span>
              <div className="h-5 flex-1 rounded bg-muted/40">
                <div className="n6-grow h-full rounded" style={{ width: `${(h.b / 60) * 100}%`, background: h.c }} />
              </div>
              <span className="w-56 text-muted-foreground">{h.note}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Why both exist</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold" style={{ color: BLUE }}>TCP trades speed for reliability</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Every byte is numbered, every receipt is acknowledged, anything lost is retransmitted. Right for a file download.</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold" style={{ color: AMBER }}>UDP trades reliability for speed</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">No handshake, no ACK, no reorder. A live voice call would rather drop a syllable than wait for a retransmit.</p>
          </div>
        </div>
        <div className="mt-3"><Tip>Neither is better. They solve different problems.</Tip></div>
      </Panel>

      <SimpleTable head={["Property", "TCP", "UDP"]} rows={TCPUDP} />
    </div>
  );
}

/* ───────────────────────── 3 · handshakes ───────────────────────── */

type Msg = { from: "c" | "s"; flag: string; info: string; cs: string; ss: string };
type Seq = { name: string; intro: string; init: { cs: string; ss: string }; msgs: Msg[]; tip?: string };

const SEQS: Record<string, Seq> = {
  three: {
    name: "3-way handshake (open)",
    intro: "Both sides exchange starting sequence numbers. After the third segment the connection is open.",
    init: { cs: "CLOSED", ss: "LISTEN" },
    msgs: [
      { from: "c", flag: "SYN", info: "seq = X. I want to connect.", cs: "SYN-SENT", ss: "LISTEN" },
      { from: "s", flag: "SYN + ACK", info: "seq = Y, ack = X+1. Acknowledged, here is my number.", cs: "SYN-SENT", ss: "SYN-RECEIVED" },
      { from: "c", flag: "ACK", info: "ack = Y+1. Acknowledged. Let us talk.", cs: "ESTABLISHED", ss: "ESTABLISHED" },
    ],
    tip: "A SYN uses up one sequence number, which is why the ACK says X+1 and not X.",
  },
  four: {
    name: "4-way handshake (close)",
    intro: "TCP is full-duplex, so each direction is closed on its own. Four segments, then the connection is gone.",
    init: { cs: "ESTABLISHED", ss: "ESTABLISHED" },
    msgs: [
      { from: "c", flag: "FIN", info: "I have nothing more to send.", cs: "FIN-WAIT-1", ss: "ESTABLISHED" },
      { from: "s", flag: "ACK", info: "Understood.", cs: "FIN-WAIT-2", ss: "CLOSE-WAIT" },
      { from: "s", flag: "FIN", info: "I also have nothing more to send.", cs: "FIN-WAIT-2", ss: "LAST-ACK" },
      { from: "c", flag: "ACK", info: "Understood. Goodbye.", cs: "TIME-WAIT", ss: "CLOSED" },
    ],
    tip: "The client then waits in TIME-WAIT (about 1 to 4 minutes) in case its last ACK is lost, and only then moves to CLOSED. If the server has nothing left to send, its ACK and FIN can travel in one segment, giving a 3-segment close.",
  },
  rst: {
    name: "RST (forceful reset)",
    intro: "One side has had enough. No handshake and no goodbye: the connection is killed immediately.",
    init: { cs: "ESTABLISHED", ss: "ESTABLISHED" },
    msgs: [{ from: "c", flag: "RST", info: "Kill the connection now.", cs: "CLOSED", ss: "CLOSED" }],
    tip: "A host also sends RST when a segment arrives for a port nothing is listening on. That is what a connection refused error is.",
  },
};

const FLAGCOL: Record<string, string> = { SYN: GREEN, "SYN + ACK": GREEN, ACK: BLUE, FIN: AMBER, RST: RED };

function HandSection() {
  const [id, setId] = useState("three");
  const [i, setI] = useState(-1);
  const [play, setPlay] = useState(false);
  const sq = SEQS[id];
  const last = sq.msgs.length - 1;
  const cur = i < 0 ? sq.init : sq.msgs[i];
  const cs = i < 0 ? sq.init.cs : (cur as Msg).cs;
  const ss = i < 0 ? sq.init.ss : (cur as Msg).ss;

  useEffect(() => {
    if (!play) return;
    if (i >= last) { setPlay(false); return; }
    const t = setTimeout(() => setI((v) => v + 1), 1300);
    return () => clearTimeout(t);
  }, [play, i, last]);

  const pick = (k: string) => { setId(k); setI(-1); setPlay(false); };
  const done = i >= last;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SEQS).map(([k, v]) => (
            <Pick key={k} active={id === k} onClick={() => pick(k)}>{v.name}</Pick>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{sq.intro}</p>
      </Panel>

      <Panel>
        <div className="flex items-start justify-between gap-2">
          <div className="text-center">
            <p className="text-xs font-semibold">Client</p>
            <p key={cs} className="n6-pop mt-1 rounded-md border px-2 py-1 font-mono text-[11px] font-bold" style={{ borderColor: BLUE, color: BLUE, background: `${BLUE}12` }}>{cs}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold">Server</p>
            <p key={ss} className="n6-pop mt-1 rounded-md border px-2 py-1 font-mono text-[11px] font-bold" style={{ borderColor: PURPLE, color: PURPLE, background: `${PURPLE}12` }}>{ss}</p>
          </div>
        </div>

        <div className="relative mx-10 mt-2 min-h-[6rem] border-x-2 border-dashed px-1 py-2">
          {i < 0 && <p className="pt-6 text-center text-xs text-muted-foreground">Press Next step or Play to start.</p>}
          {sq.msgs.slice(0, i + 1).map((m, k) => {
            const c = FLAGCOL[m.flag] ?? BLUE;
            const toServer = m.from === "c";
            return (
              <div key={`${id}-${k}`} className="py-2">
                <p className="text-center text-[11px]">
                  <span className="mr-1 rounded px-1.5 py-0.5 font-mono font-bold text-white" style={{ background: c }}>{m.flag}</span>
                  <span className="text-muted-foreground">{m.info}</span>
                </p>
                <div className={`${toServer ? "n6-drawR" : "n6-drawL"} mt-1 flex items-center ${toServer ? "" : "flex-row-reverse"}`} style={{ color: c }}>
                  <span className="h-0.5 flex-1" style={{ background: c }} />
                  <span className="text-xs leading-none">{toServer ? "▶" : "◀"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {done && (
          <p className="n6-fade mt-2 text-center text-xs font-semibold" style={{ color: id === "rst" ? RED : GREEN }}>
            {id === "three" ? "Connection open. Data can flow." : id === "four" ? "Connection closed in both directions." : "Connection killed instantly."}
          </p>
        )}
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={i < 0} onClick={() => { setPlay(false); setI((v) => Math.max(-1, v - 1)); }}>Back</Button>
        <Button size="sm" disabled={done} onClick={() => { setPlay(false); setI((v) => Math.min(last, v + 1)); }}>Next step</Button>
        <Button size="sm" variant="outline" onClick={() => { if (done) setI(-1); setPlay((p) => !p); if (done) setTimeout(() => setI(0), 50); }}>
          {play ? "Pause" : done ? "Replay" : "Play"}
        </Button>
      </div>

      {sq.tip && <Tip title="Careful">{sq.tip}</Tip>}

      <SimpleTable
        head={["", "Open", "Close", "Reset"]}
        rows={[
          ["Segments", "3 (SYN, SYN-ACK, ACK)", "4 (FIN, ACK, FIN, ACK)", "1 (RST)"],
          ["Graceful?", "n/a", "Yes, both sides say goodbye", "No, immediate"],
        ]}
      />
    </div>
  );
}

/* ───────────────────────── 4 · flags and flow ───────────────────────── */

const FLAGS = [
  { f: "URG", c: PURPLE, purpose: "Urgent data inside", detail: "Marks urgent data that should be handled before the regular queue. Rarely used today.", seen: "Almost never" },
  { f: "ACK", c: BLUE, purpose: "Acknowledge receipt", detail: "Confirms a segment arrived. Almost every segment after the first SYN carries ACK.", seen: "Nearly every segment" },
  { f: "PSH", c: AMBER, purpose: "Push to application", detail: "Tells the receiver to hand the data to the application now instead of buffering it.", seen: "Interactive traffic, end of a request" },
  { f: "RST", c: RED, purpose: "Forceful reset", detail: "Kills the connection with no handshake. Used on a closed port or an unrecoverable stream.", seen: "Refused or aborted connections" },
  { f: "SYN", c: GREEN, purpose: "Open a connection", detail: "Says I want to connect and advertises the starting sequence number.", seen: "First two segments of a connection" },
  { f: "FIN", c: AMBER, purpose: "Graceful close", detail: "Says I have nothing more to send. The other side finishes, then sends its own FIN.", seen: "End of a connection" },
];

const COMBOS = [
  ["SYN", "Client opens a connection"],
  ["SYN + ACK", "Server accepts and sends its own SYN"],
  ["ACK", "Plain acknowledgment, also the 3rd handshake step"],
  ["PSH + ACK", "Data delivered immediately, and acknowledging earlier data"],
  ["FIN + ACK", "Graceful close"],
  ["RST (or RST + ACK)", "Abort or refuse"],
];

const SEGS = 12;
const CELL = 34;
const GAP = 4;

function FlagsSection() {
  const [sel, setSel] = useState(4);
  const f = FLAGS[sel];

  const [win, setWin] = useState(4);
  const [w, setW] = useState({ base: 1, sent: 1 });
  const [play, setPlay] = useState(false);
  const canSend = w.sent <= SEGS && w.sent < w.base + win;
  const canAck = w.base < w.sent;
  const finished = w.base > SEGS;

  const step = () =>
    setW((s) => {
      if (s.sent <= SEGS && s.sent < s.base + win) return { ...s, sent: s.sent + 1 };
      if (s.base < s.sent) return { ...s, base: s.base + 1 };
      return s;
    });

  useEffect(() => {
    if (!play) return;
    if (finished) { setPlay(false); return; }
    const id = setInterval(step, 650);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, win, finished]);

  const visible = Math.min(win, SEGS - w.base + 1);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">The six TCP flags</p>
        <p className="mt-1 text-xs text-muted-foreground">These are six one-bit switches in the TCP header. Tap a flag.</p>
        <div className="mt-3 grid grid-cols-6 gap-1.5">
          {FLAGS.map((x, i) => {
            const on = sel === i;
            return (
              <button
                key={x.f}
                type="button"
                onClick={() => setSel(i)}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2 transition-all ${on ? "n6-ring scale-105" : "opacity-70 hover:opacity-100"}`}
                style={{ borderColor: on ? x.c : undefined, background: on ? `${x.c}18` : undefined }}
                aria-label={x.f}
              >
                <span className="font-mono text-xs font-bold" style={{ color: x.c }}>{x.f}</span>
                <span className="font-mono text-sm font-bold">{on ? 1 : 0}</span>
              </button>
            );
          })}
        </div>
        <div key={sel} className="n6-fade mt-3 grid gap-2 sm:grid-cols-3">
          <Mini k="Purpose" v={f.purpose} color={f.c} />
          <Mini k="What it does" v={f.detail} />
          <Mini k="Seen when" v={f.seen} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Mnemonic">Header order is URG, ACK, PSH, RST, SYN, FIN: Unskilled Attackers Pester Real Security Folks.</Tip>
          <Tip title="Careful">
            SYN, ACK, FIN and RST are the four you see most on the wire. Newer TCP versions add a few more flag bits (such as ECE and CWR) for congestion signalling.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Flags usually travel in combinations</p>
        <div className="mt-3"><SimpleTable head={["Flags set", "Meaning"]} rows={COMBOS} /></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Sliding window playground</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The receiver advertises a window: how many segments the sender may have in flight without an ACK. Send segments, then ACK them, and watch the window slide.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            Window size: <span className="font-mono font-bold">{win}</span>
            <input type="range" min={1} max={6} value={win} onChange={(e) => setWin(Number(e.target.value))} className="accent-primary" aria-label="Window size" />
          </label>
        </div>

        <div className="mt-4 overflow-x-auto pb-2">
          <div className="relative" style={{ width: SEGS * (CELL + GAP), height: CELL + 14 }}>
            <div
              className="absolute top-0 rounded-lg border-2 transition-all duration-500"
              style={{
                left: (w.base - 1) * (CELL + GAP) - 3,
                width: Math.max(visible, 0) * (CELL + GAP) + 2,
                height: CELL + 10,
                borderColor: BLUE,
                opacity: finished ? 0 : 1,
              }}
            />
            <div className="absolute left-0 top-[5px] flex" style={{ gap: GAP }}>
              {Array.from({ length: SEGS }, (_, n) => {
                const k = n + 1;
                const state = k < w.base ? "acked" : k < w.sent ? "flight" : k < w.base + win ? "usable" : "future";
                const col = state === "acked" ? GREEN : state === "flight" ? BLUE : state === "usable" ? AMBER : undefined;
                return (
                  <div
                    key={k}
                    className={`flex items-center justify-center rounded-md border font-mono text-xs font-bold transition-all duration-500 ${state === "flight" ? "n6-pulse" : ""}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      color: col,
                      borderColor: col,
                      borderStyle: state === "usable" ? "dashed" : "solid",
                      background: state === "acked" || state === "flight" ? `${col}20` : undefined,
                      opacity: state === "future" ? 0.35 : 1,
                    }}
                  >
                    {k}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span style={{ color: GREEN }}>● acknowledged</span>
          <span style={{ color: BLUE }}>● in flight (sent, no ACK yet)</span>
          <span style={{ color: AMBER }}>◌ can send now</span>
          <span>○ outside the window</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={!canSend} onClick={() => setW((s) => ({ ...s, sent: s.sent + 1 }))}>Send next</Button>
          <Button size="sm" variant="outline" disabled={!canAck} onClick={() => setW((s) => ({ ...s, base: s.base + 1 }))}>Receive ACK</Button>
          <Button size="sm" variant="outline" onClick={() => { if (finished) setW({ base: 1, sent: 1 }); setPlay((p) => !p); }}>{play ? "Pause" : finished ? "Replay" : "Auto play"}</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlay(false); setW({ base: 1, sent: 1 }); }}>Reset</Button>
        </div>
        <p className="mt-3 text-xs font-medium">
          {finished
            ? "All segments acknowledged."
            : !canSend && canAck
            ? "Window full. The sender must wait for an ACK before sending more."
            : `${w.sent - w.base} in flight, ${Math.max(0, w.base + win - w.sent)} more allowed right now.`}
        </p>
        <div className="mt-3">
          <Tip title="Flow control">Shrink the window to 1 and the sender goes stop-and-wait. A bigger window keeps the link busy. The receiver controls it so the sender cannot overwhelm it.</Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 5 · ports ───────────────────────── */

const RANGES = [
  { n: "Well-known", r: "0 to 1023", ex: "HTTP 80, HTTPS 443, SSH 22", note: "Standardized by IANA. Servers listen here.", c: GREEN, w: 1 },
  { n: "Registered", r: "1024 to 49151", ex: "MySQL 3306, RDP 3389", note: "Registered with IANA for specific applications.", c: BLUE, w: 1 },
  { n: "Ephemeral", r: "49152 to 65535", ex: "Client-side source ports", note: "Picked at random by the client for each connection. Some systems use a different dynamic range (Linux commonly uses 32768 to 60999).", c: PURPLE, w: 1 },
];

const PORTS: string[][] = [
  ["20", "FTP data", "TCP"],
  ["21", "FTP control", "TCP"],
  ["22", "SSH", "TCP"],
  ["23", "Telnet", "TCP"],
  ["25", "SMTP", "TCP"],
  ["53", "DNS", "UDP (TCP for large replies)"],
  ["67 / 68", "DHCP (server / client)", "UDP"],
  ["69", "TFTP", "UDP"],
  ["80", "HTTP", "TCP"],
  ["110", "POP3", "TCP"],
  ["123", "NTP (extra, common in CCNA)", "UDP"],
  ["143", "IMAP", "TCP"],
  ["161 / 162", "SNMP (queries / traps)", "UDP"],
  ["443", "HTTPS", "TCP (UDP for HTTP/3)"],
  ["514", "Syslog (extra, common in CCNA)", "UDP"],
  ["3389", "RDP", "TCP"],
];

function PortsSection() {
  const [r, setR] = useState(0);
  const [q, setQ] = useState("");
  const [conns, setConns] = useState<number[]>([51514]);
  const rg = RANGES[r];
  const query = q.trim().toLowerCase();
  const hits = PORTS.map((p, i) => ({ p, i })).filter(({ p }) => query && (p[0].split(" / ").includes(query) || p[1].toLowerCase().includes(query))).map((x) => x.i);

  const open = () =>
    setConns((c) => {
      if (c.length >= 5) return [51514];
      let n = 49152 + Math.floor(Math.random() * (65535 - 49152 + 1));
      while (c.includes(n)) n = 49152 + Math.floor(Math.random() * (65535 - 49152 + 1));
      return [...c, n];
    });

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Port ranges</p>
        <p className="mt-1 text-xs text-muted-foreground">Ports run from 0 to 65535. The bar is not to scale.</p>
        <div className="mt-3 flex gap-1.5">
          {RANGES.map((x, i) => (
            <button
              key={x.n}
              type="button"
              onClick={() => setR(i)}
              className="flex-1 rounded-lg border px-2 py-3 text-center text-xs font-semibold transition-all"
              style={{ borderColor: x.c, background: r === i ? x.c : `${x.c}14`, color: r === i ? "#fff" : x.c, transform: r === i ? "scaleY(1.08)" : undefined }}
            >
              {x.n}
            </button>
          ))}
        </div>
        <div key={r} className="n6-fade mt-3 grid gap-2 sm:grid-cols-3">
          <Mini k="Range" v={rg.r} color={rg.c} />
          <Mini k="Examples" v={rg.ex} />
          <Mini k="Notes" v={rg.note} />
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            Any number from 0 to 65535 is a valid port. Well-known ports are just the ones IANA standardized.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Find a port or a service</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try 443, ssh, dns..."
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          aria-label="Search ports"
        />
        <div className="mt-3">
          <SimpleTable head={["Port", "Service", "Transport"]} rows={PORTS} hit={hits} />
        </div>
        {query && hits.length === 0 && <p className="mt-2 text-xs" style={{ color: RED }}>No match in this list.</p>}
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">One server, many connections</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The destination stays the same (port 443). Each connection from the client gets its own random source port, so the replies for each browser tab find the right one.
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {conns.map((sp) => (
            <div key={sp} className="n6-pop flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs">
              <span>192.168.1.10:</span>
              <span className="rounded px-1.5 py-0.5 font-bold" style={{ background: `${PURPLE}18`, color: PURPLE }}>{sp}</span>
              <span className="text-muted-foreground">→</span>
              <span>203.0.113.10:</span>
              <span className="rounded px-1.5 py-0.5 font-bold" style={{ background: `${GREEN}18`, color: GREEN }}>443</span>
              <Badge variant="secondary">TCP</Badge>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={open}>{conns.length >= 5 ? "Start over" : "Open another connection"}</Button>
        </div>
        <div className="mt-3">
          <Tip>A connection is identified by five things: source IP, source port, destination IP, destination port and protocol. Change any one and it is a different connection.</Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 6 · sizes ───────────────────────── */

const PROTO = [
  ["1", "ICMP", "Ping, error messages"],
  ["2", "IGMP", "Multicast group membership"],
  ["6", "TCP", "Reliable transport"],
  ["17", "UDP", "Fast transport"],
  ["47", "GRE", "Tunnels (extra)"],
  ["50", "ESP", "IPsec (extra)"],
  ["88", "EIGRP", "Routing (extra)"],
  ["89", "OSPF", "Routing (extra)"],
];

function SizesSection() {
  const [mtu, setMtu] = useState(1500);
  const mss = mtu - 40;
  const pct = (n: number) => `${(n / mtu) * 100}%`;
  const hi = PROTO.findIndex((x) => x[1] === "TCP");

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">MTU and MSS</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Mini k="MTU" v="Maximum Transmission Unit: the largest packet a link carries (the IP packet, not counting the Ethernet header and trailer). Ethernet default: 1500." />
          <Mini k="MSS" v="Maximum Segment Size: the TCP payload left after the IP and TCP headers. Usually MTU − 40 = 1460." />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pick active={mtu === 1500} onClick={() => setMtu(1500)}>1500 Ethernet</Pick>
          <Pick active={mtu === 1492} onClick={() => setMtu(1492)}>1492 PPPoE</Pick>
          <Pick active={mtu === 9000} onClick={() => setMtu(9000)}>9000 jumbo</Pick>
        </div>
        <label className="mt-3 flex items-center gap-3 text-xs">
          MTU: <span className="w-12 font-mono font-bold">{mtu}</span>
          <input type="range" min={576} max={9000} step={4} value={mtu} onChange={(e) => setMtu(Number(e.target.value))} className="flex-1 accent-primary" aria-label="MTU" />
        </label>

        <div className="mt-4 flex h-9 overflow-hidden rounded-lg border">
          <div className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500" style={{ width: pct(20), background: BLUE, minWidth: 24 }}>IP</div>
          <div className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500" style={{ width: pct(20), background: GREEN, minWidth: 24 }}>TCP</div>
          <div className="flex flex-1 items-center justify-center text-[11px] font-bold transition-all duration-500" style={{ background: `${AMBER}30`, color: AMBER }}>Payload (MSS) {mss}</div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Mini k="IP header" v="20 bytes" color={BLUE} />
          <Mini k="TCP header" v="20 bytes" color={GREEN} />
          <Mini k="MSS" v={`${mtu} − 20 − 20 = ${mss}`} color={AMBER} />
          <Mini k="Frame on the wire" v={`${mtu + 18} bytes (+14 Ethernet header, +4 FCS)`} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">With UDP the payload is {mtu} − 20 − 8 = {mtu - 28} bytes.</p>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Careful">
            Each side announces its own MSS in the SYN options during the handshake, and the smaller one is used. It is announced, not haggled over.
          </Tip>
          <Tip title="Why it matters">
            If a packet is bigger than a link MTU, it must be fragmented or dropped. Setting the MSS keeps TCP segments small enough to avoid that.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Header sizes</p>
        <div className="mt-3">
          <SimpleTable
            head={["Header", "Size"]}
            rows={[
              ["TCP", "20 bytes minimum, up to 60 with options (MSS, window scaling, SACK, timestamps)"],
              ["UDP", "8 bytes fixed"],
              ["IPv4", "20 bytes minimum"],
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Protocol numbers</p>
        <p className="mt-1 text-xs text-muted-foreground">
          They sit in the IPv4 Protocol field (IPv6 calls it Next Header) and tell the receiver which protocol is inside the packet.
        </p>
        <div className="mt-3"><SimpleTable head={["Number", "Protocol", "Used for"]} rows={PROTO} hit={hi} /></div>
        <div className="mt-3"><Tip>TCP = 6, UDP = 17. Memorize these two. The protocol number is in the IP header. The port number is in the TCP or UDP header.</Tip></div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 7 · common mistakes ───────────────────────── */

const MYTHS = [
  { wrong: "TCP is always better than UDP.", right: "TCP is reliable but slower. UDP is faster with no guarantees. Live voice and video suit UDP. A file download needs TCP." },
  { wrong: "TCP and IP are the same protocol.", right: "TCP is Layer 4 (end-to-end delivery between processes). IP is Layer 3 (addressing and routing). They work together but do different jobs." },
  { wrong: "A port number identifies the host.", right: "The IP address identifies the host. The port identifies the application on that host." },
  { wrong: "MSS and MTU are the same thing.", right: "MTU is the largest packet a link carries, usually 1500. MSS is the TCP payload after the IP and TCP headers, usually 1460." },
  { wrong: "UDP has no error checking at all.", right: "UDP has a checksum, so it can detect corruption. What it lacks is acknowledgment, retransmission and reordering." },
  { wrong: "The three-way handshake is optional.", right: "For TCP it is mandatory. Both sides must exchange SYN and ACK before any data flows." },
  { wrong: "RST and FIN do the same thing.", right: "FIN closes gracefully, with both sides saying goodbye. RST kills the connection immediately with no handshake." },
  { wrong: "HTTP and HTTPS are TCP only.", right: "HTTP/1.1 and HTTP/2 run over TCP. HTTP/3 runs over QUIC, which is built on UDP, using port 443." },
  { wrong: "Well-known ports are the only valid ports.", right: "Any number from 0 to 65535 is a valid port. Well-known ports are just the ones standardized by IANA." },
  { wrong: "A client sends from the well-known port.", right: "The client uses a random ephemeral source port. The well-known port is the destination, the service being contacted." },
  { wrong: "DNS is UDP only.", right: "DNS usually uses UDP port 53 for small queries, and switches to TCP port 53 for large replies and zone transfers." },
];

function MythsSection() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Tap a card to flip it from the wrong belief to the truth.</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(open.size === MYTHS.length ? new Set() : new Set(MYTHS.map((_, i) => i)))}>
          {open.size === MYTHS.length ? "Hide all" : "Show all"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MYTHS.map((m, i) => {
          const shown = open.has(i);
          return (
            <button key={i} type="button" onClick={() => toggle(i)} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50" style={{ borderColor: shown ? GREEN : undefined }}>
              <p className="text-xs font-semibold" style={{ color: RED }}>✕ Wrong</p>
              <p className="mt-1 text-sm font-medium">{m.wrong}</p>
              {shown ? (
                <div className="n6-fade mt-3 border-t pt-3">
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>✓ Right</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.right}</p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">Tap to see the truth</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 8 · interview prep ───────────────────────── */

const QA: { q: string; a: string[] }[] = [
  { q: "What layer do TCP and UDP sit at, and what do they do?", a: ["Layer 4, the Transport layer.", "They deliver data between two specific processes on two hosts, using port numbers to identify the process."] },
  { q: "Compare TCP and UDP in a couple of sentences.", a: ["TCP is connection-oriented, reliable, ordered and slower. It is used when accuracy matters.", "UDP is connectionless, best-effort and fast, with no retransmission or reordering. It is used when speed matters more than perfection."] },
  { q: "What is the three-way handshake?", a: ["1. The client sends SYN with its starting sequence number.", "2. The server replies SYN-ACK: it acknowledges the client and sends its own sequence number.", "3. The client sends ACK. The connection is established."] },
  { q: "What is the four-way handshake?", a: ["A graceful close of a TCP connection. Each direction is closed on its own.", "FIN, ACK, FIN, ACK. The side that closes first then waits in TIME-WAIT before the connection is fully gone."] },
  { q: "What does RST do?", a: ["It forcefully terminates a TCP connection with no handshake.", "It is sent when a segment arrives for a closed port, or when a side wants to abort a broken or unwanted connection."] },
  { q: "Name the TCP flags.", a: ["SYN opens a connection. ACK acknowledges a segment. FIN closes gracefully.", "PSH pushes data to the application now. URG marks urgent data. RST resets forcefully."] },
  { q: "What port ranges should I remember?", a: ["Well-known: 0 to 1023 (HTTP 80, HTTPS 443, SSH 22).", "Registered: 1024 to 49151 (MySQL 3306, RDP 3389).", "Ephemeral: 49152 to 65535, used as client-side source ports."] },
  { q: "What is the difference between a protocol number and a port number?", a: ["The protocol number identifies the protocol inside the IP packet and lives in the IP header: ICMP 1, TCP 6, UDP 17.", "The port number identifies the application and lives in the TCP or UDP header."] },
  { q: "Explain MTU and MSS.", a: ["MTU is the largest packet a link can carry. The Ethernet default is 1500 bytes.", "MSS is the TCP payload after subtracting the IP and TCP headers: 1500 − 20 − 20 = 1460.", "Each side announces its MSS in the SYN, and the smaller value is used."] },
  { q: "Why is DNS usually on UDP but sometimes on TCP?", a: ["Normal DNS queries are small, so UDP port 53 gives low overhead.", "Large replies and zone transfers use TCP port 53."] },
  { q: "The TCP header is 20 bytes minimum. What makes it longer?", a: ["Options: MSS, window scaling, selective ACK and timestamps.", "With options the header can reach 60 bytes."] },
  { q: "What is flow control, and how does TCP do it?", a: ["Flow control stops a fast sender from overwhelming a slow receiver.", "TCP uses a sliding window. The receiver advertises how much data it can accept, and the sender stays inside that window."] },
  { q: "How does the OS tell two connections to the same server apart?", a: ["By the five-tuple: source IP, source port, destination IP, destination port and protocol.", "Two browser tabs to the same site use different random source ports."] },
];

function InterviewSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          The Transport layer, Layer 4, delivers data between processes on two hosts using TCP or UDP. TCP is connection-oriented,
          reliable and ordered, with a 20-byte minimum header, and is used by web, mail and file transfer. UDP is connectionless,
          fast and best-effort, with an 8-byte header, and is used by DNS, VoIP, streaming and DHCP. TCP opens a connection with a
          three-way handshake and closes it with a four-way handshake. Port numbers identify the application: well-known (0 to
          1023), registered (1024 to 49151) and ephemeral (49152 to 65535). The protocol number in the IP header identifies the
          transport protocol: TCP is 6 and UDP is 17.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">Practice it out loud until it flows without notes.</p>
      </Panel>

      <div className="flex flex-col gap-2">
        {QA.map((x, i) => {
          const isOpen = open === i;
          return (
            <div key={x.q} className="rounded-xl border bg-background">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                  {x.q}
                </span>
                <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <ul className="n6-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">TCP = reliable, 6, handshake. UDP = fast, 17, no handshake. IP finds the host, the port finds the app.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function TransportLayerSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n6-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes n6-pop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
        @keyframes n6-drawR { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
        @keyframes n6-drawL { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0 0 0 0); } }
        @keyframes n6-fly { from { left: 0; } to { left: calc(100% - 4.5rem); } }
        @keyframes n6-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes n6-ring { 0% { box-shadow: 0 0 0 0 rgba(47,158,68,.55); } 100% { box-shadow: 0 0 0 9px rgba(47,158,68,0); } }
        @keyframes n6-pulse { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .n6-fade { animation: n6-fade .5s ease-out both; }
        .n6-pop { animation: n6-pop .35s ease-out both; }
        .n6-drawR { animation: n6-drawR .9s ease-in-out both; }
        .n6-drawL { animation: n6-drawL .9s ease-in-out both; }
        .n6-fly { animation: n6-fly 1s ease-in-out both; }
        .n6-grow { transform-origin: left; animation: n6-grow .8s ease-out both; }
        .n6-ring { animation: n6-ring 1.2s ease-out .9s 2 backwards; }
        .n6-pulse { animation: n6-pulse 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .n6-fade, .n6-pop, .n6-drawR, .n6-drawL, .n6-fly, .n6-grow, .n6-ring, .n6-pulse { animation: none; opacity: 1; }
          .n6-fly { left: calc(100% - 4.5rem); }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 06: Transport layer, TCP, UDP and ports</CardTitle>
            <CardDescription className="mt-1">
              Reliability, handshakes, flags and port numbers. Eight short sections, tap through them in any order.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Pick key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pick>
          ))}
        </div>

        <div key={tab}>
          {tab === "big" && <BigSection />}
          {tab === "tcpudp" && <TcpUdpSection />}
          {tab === "hand" && <HandSection />}
          {tab === "flags" && <FlagsSection />}
          {tab === "ports" && <PortsSection />}
          {tab === "sizes" && <SizesSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}