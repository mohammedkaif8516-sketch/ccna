"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * TcpSimulator
 * Tab 1  3-way handshake   : step through SYN, SYN-ACK, ACK with your own ISNs.
 *                            Also try a closed port (the server answers RST).
 * Tab 2  4-way termination : FIN, ACK, FIN, ACK, TIME-WAIT. Also shows the
 *                            half-close and the combined 3-segment close.
 * Tab 3  Sliding window    : send segments, receive ACKs, change the receive
 *                            window and the congestion window, hit a zero window.
 */

const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)

const CLIENT_COLOR = "#1971c2";
const SERVER_COLOR = "#e8590c";
const RST_COLOR = "#c92a2a";
const TIMER_COLOR = "#862e9c";

/* ───────────────────────── small helpers ───────────────────────── */

function num(v: string, fallback: number) {
  const x = Number(v);
  return Number.isInteger(x) && x >= 0 && x <= 4294967294 ? x : fallback;
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border bg-background p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-xs font-medium">
      {label}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-40 bg-background font-mono"
        inputMode="numeric"
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}

/* ───────────────────────── sequence diagram ───────────────────────── */

type Step = {
  from: "client" | "server" | "timer";
  flags: string;
  seq?: number;
  ack?: number;
  len?: number;
  title: string;
  meaning: string;
  math?: string;
  client: string; // client state after this step
  server: string; // server state after this step
};

function SequenceDiagram({
  steps,
  initial,
  intro,
}: {
  steps: Step[];
  initial: { client: string; server: string };
  intro: string;
}) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const n = steps.length;

  useEffect(() => {
    if (!playing) return;
    if (step >= n) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(n, s + 1)), step === 0 ? 300 : 3200);
    return () => clearTimeout(t);
  }, [playing, step, n]);

  const shown = Math.min(step, n);
  const info = shown > 0 ? steps[shown - 1] : null;
  const state = info ?? initial;

  const colorOf = (s: Step) =>
    s.from === "timer"
      ? TIMER_COLOR
      : s.flags.includes("RST")
        ? RST_COLOR
        : s.from === "client"
          ? CLIENT_COLOR
          : SERVER_COLOR;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border bg-background p-4">
        <div className="min-w-[440px]">
          {/* Headers with live TCP state */}
          <div className="grid grid-cols-[104px_1fr_104px]">
            {(
              [
                ["Client", state.client, CLIENT_COLOR],
                ["Server", state.server, SERVER_COLOR],
              ] as const
            ).map(([who, st, color], i) => (
              <div
                key={who}
                className={`flex flex-col items-center gap-1.5 pb-3 ${i === 1 ? "col-start-3" : ""}`}
              >
                <span className="text-sm font-semibold" style={{ color }}>
                  {who}
                </span>
                <span
                  key={st}
                  className="tcp-pop rounded-md border-2 px-2 py-0.5 text-center font-mono text-[11px] font-semibold"
                  style={{ borderColor: color, backgroundColor: color + "14" }}
                >
                  {st}
                </span>
              </div>
            ))}
          </div>

          {/* Lifelines and messages */}
          <div className="grid min-h-[96px] grid-cols-[104px_1fr_104px]">
            <div className="border-r-2 border-dashed" />
            <div className="px-2">
              {steps.slice(0, shown).map((s, i) => {
                const color = colorOf(s);
                const toRight = s.from === "client";
                return (
                  <div key={i} className="relative h-[76px]">
                    {s.from === "timer" ? (
                      <div
                        className="tcp-label absolute inset-x-0 top-5 mx-auto flex w-fit items-center gap-2 rounded-md border-2 border-dashed px-3 py-1.5 text-xs font-medium"
                        style={{ borderColor: color, color }}
                      >
                        {s.flags}
                      </div>
                    ) : (
                      <>
                        <div className="tcp-label absolute inset-x-0 top-2 text-center">
                          <span
                            className="mr-2 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {i + 1}
                          </span>
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color }}
                          >
                            {s.flags}
                          </span>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            seq={s.seq}
                            {s.ack !== undefined && <> ack={s.ack}</>}
                            {s.len ? <> len={s.len}</> : null}
                          </div>
                        </div>
                        <div
                          className="tcp-line absolute inset-x-0 top-[50px] h-[2px]"
                          style={{
                            backgroundColor: color,
                            transformOrigin: toRight ? "left" : "right",
                          }}
                        />
                        <div
                          className="tcp-head absolute top-11"
                          style={{
                            [toRight ? "right" : "left"]: 0,
                            borderTop: "6px solid transparent",
                            borderBottom: "6px solid transparent",
                            [toRight ? "borderLeft" : "borderRight"]: `10px solid ${color}`,
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
              {shown === 0 && (
                <p className="px-4 pt-8 text-center text-xs text-muted-foreground">
                  Press Start to send the first segment.
                </p>
              )}
            </div>
            <div className="border-l-2 border-dashed" />
          </div>
        </div>
      </div>

      {/* Explanation for the current step */}
      <div className="rounded-xl border bg-background p-4">
        {info ? (
          <div key={shown} className="tcp-label flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Step {shown} of {n}
            </p>
            <p className="text-sm font-semibold" style={{ color: colorOf(info) }}>
              {info.title}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">{info.meaning}</p>
            {info.math && (
              <p className="whitespace-pre-line rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[11px] leading-5">
                {info.math}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">{intro}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={shown === 0}
        >
          Back
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(n, s + 1));
          }}
          disabled={shown >= n}
        >
          {shown === 0 ? "Start" : "Next step"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (shown >= n) setStep(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? "Pause" : shown >= n ? "Replay" : "Auto-play"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

/* ───────────────────────── tab 1: three-way handshake ───────────────────────── */

type HsScenario = "open" | "closed";

function buildHandshake(c: number, s: number, scenario: HsScenario): Step[] {
  const syn: Step = {
    from: "client",
    flags: "SYN",
    seq: c,
    title: "SYN: the client asks to connect",
    meaning:
      "The client picks an initial sequence number (ISN) and sends a segment with only the SYN flag set. It also announces its options: MSS, window scale and SACK permitted.",
    math: `seq = ${c}  (the client ISN, chosen by the client)`,
    client: "SYN-SENT",
    server: scenario === "open" ? "LISTEN" : "CLOSED (no listener)",
  };
  if (scenario === "closed") {
    return [
      syn,
      {
        from: "server",
        flags: "RST, ACK",
        seq: 0,
        ack: c + 1,
        title: "RST: connection refused",
        meaning:
          "Nothing is listening on that port. The server does not start a handshake. It answers with a reset, and the client gives up straight away. A client seeing this knows the host is reachable but the port is closed.",
        math: `ack = ${c} + 1 = ${c + 1}  (the RST acknowledges the SYN)`,
        client: "CLOSED (refused)",
        server: "CLOSED (no listener)",
      },
    ];
  }
  return [
    syn,
    {
      from: "server",
      flags: "SYN, ACK",
      seq: s,
      ack: c + 1,
      title: "SYN-ACK: the server accepts and sends its own ISN",
      meaning:
        "The server confirms the client SYN (ACK) and at the same time sends its own SYN with its own initial sequence number. It also announces its options.",
      math: `ack = ${c} + 1 = ${c + 1}  because the SYN used up one sequence number\nseq = ${s}  (the server own ISN)`,
      client: "SYN-SENT",
      server: "SYN-RECEIVED",
    },
    {
      from: "client",
      flags: "ACK",
      seq: c + 1,
      ack: s + 1,
      title: "ACK: the client confirms. Connection established",
      meaning:
        "The client acknowledges the server SYN. Both sides are now ESTABLISHED and data can flow in both directions. This third segment may already carry data.",
      math: `seq = ${c} + 1 = ${c + 1}\nack = ${s} + 1 = ${s + 1}  because the server SYN used up one sequence number`,
      client: "ESTABLISHED",
      server: "ESTABLISHED",
    },
  ];
}

function HandshakeTab() {
  const [scenario, setScenario] = useState<HsScenario>("open");
  const [cIsn, setCIsn] = useState("1000");
  const [sIsn, setSIsn] = useState("5000");
  const c = num(cIsn, 1000);
  const s = num(sIsn, 5000);
  const steps = useMemo(() => buildHandshake(c, s, scenario), [c, s, scenario]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Seg
          value={scenario}
          onChange={setScenario}
          options={[
            { id: "open", label: "Port is open" },
            { id: "closed", label: "Port is closed" },
          ]}
        />
        <NumField label="Client ISN" value={cIsn} onChange={setCIsn} />
        {scenario === "open" && (
          <NumField label="Server ISN" value={sIsn} onChange={setSIsn} />
        )}
      </div>
      <SequenceDiagram
        key={`hs-${scenario}`}
        steps={steps}
        initial={{
          client: "CLOSED",
          server: scenario === "open" ? "LISTEN" : "CLOSED (no listener)",
        }}
        intro="The client wants to connect to a server port. Change the initial sequence numbers (ISNs) and watch every ACK number follow them. Then switch to a closed port to see a reset."
      />
    </div>
  );
}

/* ───────────────────────── tab 2: four-way termination ───────────────────────── */

type TermScenario = "normal" | "half" | "combined";

function buildTermination(x: number, y: number, scenario: TermScenario): Step[] {
  const DATA = 500;
  const fin1: Step = {
    from: "client",
    flags: "FIN, ACK",
    seq: x,
    ack: y,
    title: "FIN: the client has finished sending",
    meaning:
      "The client closes its sending direction. The client is the active closer, so it will end in TIME-WAIT. The server can still send data to it.",
    math: `seq = ${x}  (the FIN will use up one sequence number)`,
    client: "FIN-WAIT-1",
    server: "CLOSE-WAIT",
  };
  const timer: Step = {
    from: "timer",
    flags: "Timer: wait 2 × MSL, then the client closes",
    title: "TIME-WAIT ends",
    meaning:
      "The active closer waits twice the maximum segment lifetime. This makes sure the last ACK arrived (if it was lost the server would resend its FIN) and lets old stray segments die out. RFC 793 suggests a 2 minute MSL. Linux uses a fixed 60 seconds.",
    client: "CLOSED",
    server: "CLOSED",
  };

  if (scenario === "combined") {
    return [
      fin1,
      {
        from: "server",
        flags: "FIN, ACK",
        seq: y,
        ack: x + 1,
        title: "FIN-ACK: the server acknowledges and closes in one segment",
        meaning:
          "The server had nothing left to send, so the ACK of the client FIN and its own FIN travel together. That is why the close takes three segments here instead of four.",
        math: `ack = ${x} + 1 = ${x + 1}  because the client FIN used up one sequence number\nseq = ${y}`,
        client: "FIN-WAIT-1",
        server: "LAST-ACK",
      },
      {
        from: "client",
        flags: "ACK",
        seq: x + 1,
        ack: y + 1,
        title: "ACK: the client confirms the server FIN",
        meaning:
          "The server receives this ACK and closes immediately. The client moves to TIME-WAIT.",
        math: `ack = ${y} + 1 = ${y + 1}  because the server FIN used up one sequence number`,
        client: "TIME-WAIT",
        server: "CLOSED",
      },
      timer,
    ];
  }

  const ack1: Step = {
    from: "server",
    flags: "ACK",
    seq: y,
    ack: x + 1,
    title: "ACK: the server confirms the FIN",
    meaning:
      "The server acknowledges the client FIN. One direction (client to server) is now closed. The server is in CLOSE-WAIT until its own application closes. This is a half-closed connection.",
    math: `ack = ${x} + 1 = ${x + 1}  because the FIN used up one sequence number`,
    client: "FIN-WAIT-2",
    server: "CLOSE-WAIT",
  };

  if (scenario === "half") {
    const yEnd = y + DATA;
    return [
      fin1,
      ack1,
      {
        from: "server",
        flags: "PSH, ACK",
        seq: y,
        ack: x + 1,
        len: DATA,
        title: "Data: the server can still send (half-close)",
        meaning:
          "The client closed its sending direction, but the server direction is still open. The server sends the rest of its data.",
        math: `bytes ${y} to ${yEnd - 1}  (${DATA} bytes)`,
        client: "FIN-WAIT-2",
        server: "CLOSE-WAIT",
      },
      {
        from: "client",
        flags: "ACK",
        seq: x + 1,
        ack: yEnd,
        title: "ACK: the client acknowledges the data",
        meaning: "The client can still receive and acknowledge, even though it has finished sending.",
        math: `ack = ${y} + ${DATA} = ${yEnd}  (next byte expected)`,
        client: "FIN-WAIT-2",
        server: "CLOSE-WAIT",
      },
      {
        from: "server",
        flags: "FIN, ACK",
        seq: yEnd,
        ack: x + 1,
        title: "FIN: the server has finished sending",
        meaning: "Now the server closes its sending direction too.",
        math: `seq = ${yEnd}`,
        client: "FIN-WAIT-2",
        server: "LAST-ACK",
      },
      {
        from: "client",
        flags: "ACK",
        seq: x + 1,
        ack: yEnd + 1,
        title: "ACK: the client confirms the server FIN",
        meaning: "The server closes at once. The client waits in TIME-WAIT.",
        math: `ack = ${yEnd} + 1 = ${yEnd + 1}`,
        client: "TIME-WAIT",
        server: "CLOSED",
      },
      timer,
    ];
  }

  return [
    fin1,
    ack1,
    {
      from: "server",
      flags: "FIN, ACK",
      seq: y,
      ack: x + 1,
      title: "FIN: the server has finished sending",
      meaning:
        "The server application closes the connection, so the server sends its own FIN. This is the second FIN of the four-way handshake.",
      math: `seq = ${y}  (this FIN will use up one sequence number)`,
      client: "FIN-WAIT-2",
      server: "LAST-ACK",
    },
    {
      from: "client",
      flags: "ACK",
      seq: x + 1,
      ack: y + 1,
      title: "ACK: the client confirms the server FIN",
      meaning:
        "The server receives it and moves to CLOSED. The client enters TIME-WAIT.",
      math: `ack = ${y} + 1 = ${y + 1}  because the server FIN used up one sequence number`,
      client: "TIME-WAIT",
      server: "CLOSED",
    },
    timer,
  ];
}

function TerminationTab() {
  const [scenario, setScenario] = useState<TermScenario>("normal");
  const [xs, setXs] = useState("1300");
  const [ys, setYs] = useState("9000");
  const x = num(xs, 1300);
  const y = num(ys, 9000);
  const steps = useMemo(() => buildTermination(x, y, scenario), [x, y, scenario]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Seg
          value={scenario}
          onChange={setScenario}
          options={[
            { id: "normal", label: "Four segments" },
            { id: "half", label: "Half-close (server still sends)" },
            { id: "combined", label: "Combined (three segments)" },
          ]}
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <NumField label="Client FIN sequence number" value={xs} onChange={setXs} />
        <NumField label="Server next sequence number" value={ys} onChange={setYs} />
      </div>
      <SequenceDiagram
        key={`term-${scenario}`}
        steps={steps}
        initial={{ client: "ESTABLISHED", server: "ESTABLISHED" }}
        intro="The client closes first, so it is the active closer. Each direction is closed separately: one FIN and one ACK per direction. Try the half-close and the combined close to see how the number of segments changes."
      />
    </div>
  );
}

/* ───────────────────────── tab 3: sliding window ───────────────────────── */

const N = 12; // segments in the transfer
const MSS = 1000; // bytes per segment

function WindowTab() {
  const [rwnd, setRwnd] = useState(4);
  const [cwnd, setCwnd] = useState(12);
  const [base, setBase] = useState(0); // segments acknowledged
  const [next, setNext] = useState(0); // next segment to send
  const [log, setLog] = useState<string[]>([
    "Ready. The receiver advertises a window of 4000 bytes.",
  ]);

  const push = (m: string) => setLog((l) => [m, ...l].slice(0, 6));

  const effective = Math.min(rwnd, cwnd);
  const limit = base + effective; // first segment index NOT allowed
  const inFlight = next - base;
  const canSend = next < N && next < limit;
  const done = base >= N;

  const send = () => {
    if (!canSend) return;
    push(`Sent segment ${next + 1}: bytes ${next * MSS + 1} to ${(next + 1) * MSS}`);
    setNext(next + 1);
  };
  const sendAll = () => {
    const target = Math.min(N, limit);
    if (target <= next) return;
    push(
      `Sent segments ${next + 1} to ${target} (${(target - next) * MSS} bytes in one burst)`,
    );
    setNext(target);
  };
  const ack = () => {
    if (inFlight <= 0) return;
    const nb = base + 1;
    push(`ACK ${nb * MSS + 1}, window ${rwnd * MSS}: segment ${nb} confirmed, window slides`);
    setBase(nb);
  };
  const ackAll = () => {
    if (inFlight <= 0) return;
    push(
      `Cumulative ACK ${next * MSS + 1}, window ${rwnd * MSS}: segments ${base + 1} to ${next} confirmed`,
    );
    setBase(next);
  };
  const changeRwnd = (v: number) => {
    if (v === rwnd) return;
    setRwnd(v);
    push(
      v === 0
        ? "Receiver buffer is full: it advertises window = 0 (zero window)"
        : `Receiver advertises a window of ${v * MSS} bytes`,
    );
  };
  const changeCwnd = (v: number) => {
    if (v === cwnd) return;
    setCwnd(v);
    push(`Sender congestion window is now ${v * MSS} bytes`);
  };
  const probe = () =>
    push(`Window probe sent (1 byte). Receiver replies with window = ${rwnd * MSS} bytes`);
  const reset = () => {
    setBase(0);
    setNext(0);
    setRwnd(4);
    setCwnd(12);
    setLog(["Ready. The receiver advertises a window of 4000 bytes."]);
  };

  const windowFrac = Math.max(0, Math.min(effective, N - base)) / N;

  const cells = Array.from({ length: N }, (_, i) => {
    if (i < base) return "acked" as const;
    if (i < next) return "flight" as const;
    if (i < limit) return "ready" as const;
    return "blocked" as const;
  });

  const cellStyle = {
    acked: "border-primary bg-primary text-primary-foreground",
    flight: "border-[#f08c00] bg-[#f08c00]/20 text-foreground",
    ready: "border-dashed border-primary bg-primary/5 text-foreground",
    blocked: "bg-muted/40 text-muted-foreground",
  } as const;
  const cellLabel = {
    acked: "ACKed",
    flight: "in flight",
    ready: "can send",
    blocked: "waiting",
  } as const;

  const stats: [string, string][] = [
    ["ACK number (left edge)", String(Math.min(base, N) * MSS + 1)],
    ["Receive window (rwnd)", `${rwnd * MSS} bytes`],
    ["Congestion window (cwnd)", `${cwnd * MSS} bytes`],
    ["Effective window", `${effective * MSS} bytes`],
    ["Bytes in flight", `${inFlight * MSS}`],
    ["May send up to byte", String(Math.min(N, limit) * MSS)],
  ];

  const limiter =
    rwnd === 0
      ? "Zero window: the sender must stop and wait. It sends window probes until the receiver reopens the window."
      : rwnd <= cwnd
        ? "The receive window is the limit here. That is flow control, protecting the receiver."
        : "The congestion window is the limit here. That is congestion control, protecting the network.";

  const hint = done
    ? "All 12 segments are acknowledged. Press Reset to run it again."
    : next >= N
      ? "All data is sent. Receive the remaining ACKs."
      : !canSend
        ? "The window is full. Receive an ACK so the window slides, or let the receiver advertise a bigger window."
        : "Send a segment, or send everything the window allows.";

  return (
    <div className="flex flex-col gap-5">
      {/* The strip */}
      <div className="overflow-x-auto rounded-xl border bg-background p-4">
        <div className="relative min-w-[700px] pt-9">
          {/* window bracket */}
          <div
            className="absolute top-[22px] h-3 transition-all"
            style={{
              left: `${(Math.min(base, N) / N) * 100}%`,
              width: windowFrac === 0 ? 0 : `${windowFrac * 100}%`,
              transitionDuration: `${0.35 * SLOW}s`,
            }}
          >
            {windowFrac > 0 ? (
              <>
                <div className="h-full rounded-t-md border-2 border-b-0 border-primary" />
                <span className="absolute bottom-full left-0 mb-0.5 whitespace-nowrap text-[11px] font-medium text-primary">
                  window = {effective * MSS} bytes
                </span>
              </>
            ) : (
              <>
                <div
                  className="h-full w-0.5"
                  style={{ backgroundColor: RST_COLOR }}
                />
                <span
                  className="absolute bottom-full left-0 mb-0.5 whitespace-nowrap text-[11px] font-medium"
                  style={{ color: RST_COLOR }}
                >
                  window = 0 (stop)
                </span>
              </>
            )}
          </div>

          <div className="flex gap-1">
            {cells.map((c, i) => (
              <div
                key={i}
                className={`flex h-[72px] flex-1 flex-col items-center justify-center rounded-md border-2 text-center transition-colors ${cellStyle[c]}`}
                style={{ transitionDuration: `${0.25 * SLOW}s` }}
              >
                <span className="font-mono text-sm font-semibold">{i + 1}</span>
                <span className="font-mono text-[10px] opacity-80">
                  {i * MSS + 1}
                </span>
                <span className="mt-0.5 text-[9px] opacity-80">{cellLabel[c]}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Each box is one segment of {MSS} bytes. The number under it is its first byte.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-3">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-xs font-medium">{value}</p>
          </div>
        ))}
      </div>
      <p
        className="rounded-lg border px-3 py-2 text-xs leading-5"
        style={rwnd === 0 ? { borderColor: RST_COLOR, color: RST_COLOR } : undefined}
      >
        {limiter}
      </p>

      {/* Window controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">
          Receive window the receiver advertises: {rwnd * MSS} bytes
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={rwnd}
            onChange={(e) => changeRwnd(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <span className="text-[11px] font-normal text-muted-foreground">
            Drag it down to 0 to see a zero window. Drag it up to simulate the application reading data.
          </span>
        </label>
        <label className="text-xs font-medium">
          Congestion window the sender allows: {cwnd * MSS} bytes
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={cwnd}
            onChange={(e) => changeCwnd(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <span className="text-[11px] font-normal text-muted-foreground">
            The sender uses the smaller of the two windows.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={send} disabled={!canSend}>
            Send next segment
          </Button>
          <Button size="sm" variant="outline" onClick={sendAll} disabled={!canSend}>
            Send all allowed
          </Button>
          <Button size="sm" variant="outline" onClick={ack} disabled={inFlight <= 0}>
            Receive ACK (oldest)
          </Button>
          <Button size="sm" variant="outline" onClick={ackAll} disabled={inFlight <= 0}>
            Receive ACK (all, cumulative)
          </Button>
          {rwnd === 0 && !done && (
            <Button size="sm" variant="outline" onClick={probe}>
              Send window probe
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
      </div>

      {/* Event log */}
      <div className="rounded-xl border bg-background p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Events</p>
        <ul className="flex flex-col gap-1.5">
          {log.map((m, i) => (
            <li
              key={`${log.length}-${i}-${m}`}
              className={`font-mono text-[11px] leading-5 ${
                i === 0 ? "tcp-label text-foreground" : "text-muted-foreground"
              }`}
            >
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

type Tab = "hs" | "term" | "win";

export function TcpSimulator() {
  const [tab, setTab] = useState<Tab>("hs");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes tcp-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes tcp-show { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tcp-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes tcp-pop  { from { opacity: .3; transform: scale(.8); } to { opacity: 1; transform: none; } }
        .tcp-line  { animation: tcp-line ${1.0 * SLOW}s ease-in-out both; }
        .tcp-head  { animation: tcp-show ${0.2 * SLOW}s ease-out ${1.0 * SLOW}s both; }
        .tcp-label { animation: tcp-fade ${0.5 * SLOW}s ease-out both; }
        .tcp-pop   { animation: tcp-pop ${0.4 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .tcp-line, .tcp-head, .tcp-label, .tcp-pop { animation: none; }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">TCP connection simulator</CardTitle>
            <CardDescription className="mt-1">
              Step through the handshakes and play with the sliding window.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <Seg
          value={tab}
          onChange={setTab}
          options={[
            { id: "hs", label: "3-way handshake" },
            { id: "term", label: "4-way termination" },
            { id: "win", label: "Sliding window" },
          ]}
        />
        {tab === "hs" && <HandshakeTab />}
        {tab === "term" && <TerminationTab />}
        {tab === "win" && <WindowTab />}
      </CardContent>
    </Card>
  );
}