"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  ChevronRight,
  CircleDot,
  Flag,
  Gauge,
  Hash,
  Layers,
  Lightbulb,
  MessageCircleQuestion,
  Plug,
  Radio,
  Send,
  ShieldCheck,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   Transport Layer Protocols & Ports — Summary
   Structure: Big Picture · Cheat Sheet · How It Works ·
              Misconceptions · Handshake Animation (signature) ·
              Interview Prep
   Register as SUMMARY_VIEWS.transport = TransportLayerSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const TP_CSS = `
.tp-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.tp-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .tp-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.tp-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .tp-root .osi-solid{background:hsl(var(--h) 68% 52%)}
@keyframes tpFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes tpArrow{0%{opacity:.3;transform:translateX(-6px)}50%{opacity:1;transform:translateX(0)}100%{opacity:.3;transform:translateX(6px)}}
.tp-root .osi-fade{animation:tpFade .22s ease-out both}
.tp-root .tp-arrow{animation:tpArrow 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tp-root .osi-fade,.tp-root .tp-arrow{animation:none}}
`;

// ─────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] leading-4 text-foreground/80">
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-sm leading-relaxed">
          <ChevronRight className="mt-1 size-3 shrink-0 text-muted-foreground" />
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({
  children,
  icon: Icon = Lightbulb,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex gap-2.5 rounded-xl border bg-[var(--accent-soft)] px-3.5 py-3 text-sm leading-relaxed">
      <Icon className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const TCP_UDP = [
  {
    label: "TCP",
    hue: 215,
    icon: Truck,
    tagline: "Reliable, ordered, connection-oriented",
    facts: [
      "Connection-oriented — handshake before data",
      "Guaranteed delivery, ordered segments",
      "Flow control (windowing), retransmission",
      "Advanced error checking",
      "20-byte header minimum",
      "Used by: HTTP, HTTPS, FTP, SMTP, SSH",
    ],
  },
  {
    label: "UDP",
    hue: 150,
    icon: Zap,
    tagline: "Fast, connectionless, best-effort",
    facts: [
      "Connectionless — no handshake",
      "No delivery guarantee, no reorder",
      "No flow control, no acknowledgement",
      "Basic error checking only",
      "8-byte header",
      "Used by: TFTP, RTP, RTCP, DHCP, DNS, VoIP",
    ],
  },
];

const TCP_FLAGS = [
  {
    flag: "SYN",
    hue: 215,
    icon: Send,
    purpose: "Open a connection",
    detail: "Client sends SYN to say 'I want to connect' and to advertise its starting sequence number.",
  },
  {
    flag: "ACK",
    hue: 150,
    icon: ShieldCheck,
    purpose: "Acknowledge receipt",
    detail: "Confirms a segment was received. Almost every segment after the initial SYN carries ACK.",
  },
  {
    flag: "FIN",
    hue: 185,
    icon: Flag,
    purpose: "Graceful close",
    detail: "Says 'I have nothing more to send.' The other side finishes and then also sends FIN.",
  },
  {
    flag: "PSH",
    hue: 255,
    icon: ArrowRight,
    purpose: "Push to application",
    detail: "Tells the receiver to hand the data up immediately instead of buffering it.",
  },
  {
    flag: "URG",
    hue: 35,
    icon: Zap,
    purpose: "Urgent data inside",
    detail: "Flags urgent data (e.g. Ctrl+C in a terminal). Forwarded before regular queued data.",
  },
  {
    flag: "RST",
    hue: 335,
    icon: AlertTriangle,
    purpose: "Forceful reset",
    detail: "Kills the connection with no handshake. Used on corrupted, delayed, or unrecoverable streams.",
  },
];

const PROTOCOL_NUMBERS = [
  { proto: "ICMP", number: "1" },
  { proto: "IGMP", number: "2" },
  { proto: "TCP", number: "6" },
  { proto: "UDP", number: "17" },
];

const PORT_RANGES = [
  { range: "0 – 1023", kind: "Well-known", example: "HTTP = 80, HTTPS = 443, SSH = 22" },
  { range: "1024 – 49151", kind: "Registered", example: "MySQL = 3306, RDP = 3389" },
  { range: "49152 – 65535", kind: "Ephemeral", example: "Client-side source ports (dynamic)" },
];

const COMMON_PORTS = [
  ["20 / 21", "FTP (data / control)"],
  ["22", "SSH"],
  ["23", "Telnet"],
  ["25", "SMTP"],
  ["53", "DNS"],
  ["67 / 68", "DHCP"],
  ["69", "TFTP"],
  ["80", "HTTP"],
  ["110", "POP3"],
  ["143", "IMAP"],
  ["161 / 162", "SNMP"],
  ["443", "HTTPS"],
  ["3389", "RDP"],
];

// ─────────────────────────────────────────────────────────────
// Tab · Big Picture
// ─────────────────────────────────────────────────────────────

function BigPictureTab() {
  return (
    <div className="space-y-6">
      <div style={hue(215)} className="osi-tint rounded-xl border px-3.5 py-3.5">
        <p className="osi-ink text-xs font-semibold">What the Transport Layer is</p>
        <p className="mt-1 text-sm leading-relaxed">
          Layer 4. It takes data from an application on one host and delivers
          it to the right <strong>process</strong> on another host. Two things
          decide how: the <strong>protocol</strong> (TCP for reliability, UDP
          for speed) and the <strong>port number</strong> (which application
          on the receiving host should get the data).
        </p>
        <p className="mt-2 text-xs italic text-muted-foreground">
          IP finds the host. The port finds the application. The protocol
          decides how reliable the delivery is.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TCP_UDP.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.label}
              style={hue(p.hue)}
              className="osi-tint rounded-xl border px-3.5 py-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="osi-solid flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="osi-ink text-sm font-semibold">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.tagline}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Bullets items={p.facts} />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <Label>Why both exist</Label>
        <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed">
          TCP trades speed for reliability. Every byte is numbered, every
          receipt is acknowledged, and anything lost is retransmitted. That is
          what a file download needs. UDP trades reliability for speed — no
          handshake, no acknowledgement, no reorder. A live voice call would
          rather drop a syllable than wait for a retransmit. Neither is
          "better". They solve different problems.
        </div>
      </div>

      <Callout icon={Layers}>
        Layer 4 sits between the network that delivers packets and the
        applications that produce and consume data. Everything above
        (application protocols) depends on it; everything below (IP) carries
        it.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Cheat Sheet
// ─────────────────────────────────────────────────────────────

function CheatSheetTab() {
  return (
    <div className="space-y-6">
      <div>
        <Label>TCP vs UDP side by side</Label>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Property</th>
                <th className="px-3 py-2 font-medium">TCP</th>
                <th className="px-3 py-2 font-medium">UDP</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Connection", "Oriented (handshake)", "Connectionless"],
                ["Reliability", "Guaranteed", "Best-effort"],
                ["Ordering", "Reordered by seq #", "No reorder"],
                ["Flow control", "Yes (windowing)", "No"],
                ["Header size", "20 bytes min", "8 bytes"],
                ["Speed", "Slower, more overhead", "Fast, minimal overhead"],
                ["Typical use", "Web, mail, file, SSH", "DNS, VoIP, streaming, DHCP"],
              ].map((row) => (
                <tr key={row[0]} className="border-t">
                  <td className="px-3 py-2 font-medium">{row[0]}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row[1]}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>TCP flags</Label>
          <div className="overflow-hidden rounded-xl border bg-card">
            {TCP_FLAGS.map((f, i, arr) => (
              <div
                key={f.flag}
                style={hue(f.hue)}
                className={cx(
                  "grid grid-cols-[60px_1fr] items-center gap-3 px-3.5 py-2.5",
                  i !== arr.length - 1 && "border-b",
                )}
              >
                <span className="osi-ink text-sm font-bold">{f.flag}</span>
                <span className="text-xs text-muted-foreground">
                  {f.purpose}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Protocol numbers (in the IP header)</Label>
          <div className="overflow-hidden rounded-xl border bg-card">
            {PROTOCOL_NUMBERS.map((p, i, arr) => (
              <div
                key={p.proto}
                className={cx(
                  "grid grid-cols-[1fr_60px] items-center gap-3 px-3.5 py-2.5",
                  i !== arr.length - 1 && "border-b",
                )}
              >
                <span className="text-sm font-medium">{p.proto}</span>
                <span className="text-right font-mono text-xs">
                  {p.number}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            TCP = 6, UDP = 17. Memorize these two.
          </p>
        </div>
      </div>

      <div>
        <Label>Port ranges</Label>
        <div className="overflow-hidden rounded-xl border bg-card">
          {PORT_RANGES.map((p, i, arr) => (
            <div
              key={p.range}
              className={cx(
                "grid grid-cols-[130px_110px_1fr] items-center gap-3 px-3.5 py-2.5",
                i !== arr.length - 1 && "border-b",
              )}
            >
              <span className="font-mono text-xs">{p.range}</span>
              <span className="text-xs font-medium">{p.kind}</span>
              <span className="text-[11px] text-muted-foreground">
                {p.example}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Ports worth memorizing</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COMMON_PORTS.map(([port, svc]) => (
            <div
              key={port}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
            >
              <span className="font-mono text-xs font-semibold">{port}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {svc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>MTU, MSS, header sizes</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { t: "MTU", d: "Maximum Transmission Unit — largest frame a link can carry. Ethernet default: 1500." },
            { t: "MSS", d: "Maximum Segment Size — payload after subtracting IP + TCP headers. Usually MTU − 40 = 1460." },
            { t: "TCP header", d: "20 bytes minimum, up to 60 with options." },
            { t: "UDP header", d: "8 bytes fixed." },
            { t: "IP header", d: "20 bytes minimum (IPv4)." },
            { t: "Negotiation", d: "MSS is agreed during the SYN / SYN-ACK handshake." },
          ].map((b) => (
            <div
              key={b.t}
              className="rounded-lg border bg-card px-3 py-2"
            >
              <p className="text-xs font-medium">{b.t}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                {b.d}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Callout icon={Hash}>
        If you can write the flag list, the port ranges, and the TCP/UDP
        header sizes from memory, Layer 4 questions become lookups.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · How It Works
// ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    title: "Client picks a source port",
    hue: 215,
    text: "The browser chooses an ephemeral port — say 51514 — as its source. The destination port is 443 (HTTPS).",
  },
  {
    title: "SYN goes out",
    hue: 150,
    text: "The client sends a TCP segment with the SYN flag set and a random initial sequence number, plus a proposed MSS.",
  },
  {
    title: "SYN-ACK comes back",
    hue: 185,
    text: "The server acknowledges the client's sequence number with ACK, and sends its own SYN and initial sequence number.",
  },
  {
    title: "Client ACKs",
    hue: 255,
    text: "The client ACKs the server's SYN. Both sides now know each other's sequence numbers. The connection is open.",
  },
  {
    title: "Data flows with sequencing",
    hue: 290,
    text: "Every byte is numbered. Missing segments are detected and retransmitted. Sliding window controls how much data is in flight.",
  },
  {
    title: "Graceful close (or reset)",
    hue: 335,
    text: "Either side sends FIN to close. The other side finishes and sends its own FIN. Four segments, done. RST aborts instead.",
  },
];

function HowItWorksTab() {
  const [step, setStep] = useState(0);
  const current = HOW_STEPS[step];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Follow one TCP connection from the initial SYN to the closing FIN.
        Use Next / Previous or click any step below.
      </p>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {HOW_STEPS.length}
          </span>
          <span>{current.title}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${((step + 1) / HOW_STEPS.length) * 100}%` }}
          />
        </div>
        <div
          style={hue(current.hue)}
          className="osi-tint osi-fade mt-4 rounded-xl border px-3.5 py-3.5"
        >
          <p className="osi-ink text-xs font-semibold">Step {step + 1}</p>
          <p className="mt-1 text-sm leading-relaxed">{current.text}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setStep((s) => Math.min(HOW_STEPS.length - 1, s + 1))
            }
            disabled={step === HOW_STEPS.length - 1}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <ol className="space-y-2">
        {HOW_STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => setStep(i)}
              style={hue(s.hue)}
              className={cx(
                "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                i === step
                  ? "osi-tint"
                  : "bg-card hover:bg-[var(--accent-soft)]",
              )}
            >
              <span
                className={cx(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  i === step ? "osi-solid" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Common Misconceptions
// ─────────────────────────────────────────────────────────────

const MISCONCEPTIONS = [
  {
    wrong: "TCP is always better than UDP.",
    right:
      "TCP is reliable but slower. UDP is faster with no guarantees. Live voice / video need UDP; a file download needs TCP.",
  },
  {
    wrong: "TCP and IP are the same protocol.",
    right:
      "TCP is Layer 4 (transport, end-to-end). IP is Layer 3 (addressing and routing). They work together but do different jobs.",
  },
  {
    wrong: "A port number identifies the host.",
    right:
      "The port identifies the application on the host. The IP address identifies the host.",
  },
  {
    wrong: "MSS and MTU are the same thing.",
    right:
      "MTU is the frame size on the wire, usually 1500. MSS is the payload after subtracting IP and TCP headers — usually 1460.",
  },
  {
    wrong: "UDP has no error checking at all.",
    right:
      "UDP has a basic checksum. It detects some corruption, but it does not retransmit or reorder — that is the real difference from TCP.",
  },
  {
    wrong: "The three-way handshake is optional.",
    right:
      "For TCP it is mandatory. Both sides must exchange SYN and ACK before any data flows.",
  },
  {
    wrong: "RST and FIN do the same thing.",
    right:
      "FIN closes the connection gracefully (both sides say goodbye). RST kills it immediately with no handshake.",
  },
  {
    wrong: "Port 80 and port 443 are TCP only.",
    right:
      "HTTP and HTTPS conventionally use TCP, but they can also run over UDP in specific cases (HTTP/3 runs over QUIC, which is UDP-based).",
  },
  {
    wrong: "Well-known ports are the only valid ports.",
    right:
      "Any number from 0 to 65535 is a valid port. Well-known ports are just the ones standardized by IANA.",
  },
  {
    wrong: "A client uses its own well-known port.",
    right:
      "The client uses an ephemeral port (49152–65535) as its source. The well-known port is the destination — the service it is contacting.",
  },
];

function MisconceptionsTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        The small confusions that quietly cost marks. Read the wrong line,
        then read the right one.
      </p>

      <div className="space-y-2">
        {MISCONCEPTIONS.map((m, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-start gap-2.5 border-b border-destructive/30 bg-destructive/5 px-3.5 py-2.5">
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                ✗ Wrong
              </span>
              <p className="min-w-0 text-sm">{m.wrong}</p>
            </div>
            <div className="flex items-start gap-2.5 bg-emerald-500/5 px-3.5 py-2.5">
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                ✓ Right
              </span>
              <p className="min-w-0 text-sm">{m.right}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout icon={AlertTriangle}>
        If you can explain all ten of these in your own words, Layer 4
        questions stop being tricky.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Handshake Animation (signature)
// ─────────────────────────────────────────────────────────────

type Packet = {
  from: "client" | "server";
  flag: string;
  flag2?: string;
  hue: number;
  label: string;
};

const SEQUENCES: Record<
  "establish" | "terminate" | "abort",
  { title: string; blurb: string; packets: Packet[] }
> = {
  establish: {
    title: "3-way handshake — establishing",
    blurb:
      "Both sides exchange their starting sequence numbers. After the third packet, the connection is open.",
    packets: [
      { from: "client", flag: "SYN", hue: 215, label: "I want to connect. My seq = X." },
      { from: "server", flag: "SYN", flag2: "ACK", hue: 150, label: "Acknowledged. My seq = Y." },
      { from: "client", flag: "ACK", hue: 185, label: "Acknowledged. Let's talk." },
    ],
  },
  terminate: {
    title: "4-way handshake — terminating",
    blurb:
      "Both sides must say goodbye separately, because TCP is full-duplex. Four packets, then the connection is gone.",
    packets: [
      { from: "client", flag: "FIN", hue: 215, label: "I have nothing more to send." },
      { from: "server", flag: "ACK", hue: 150, label: "Understood." },
      { from: "server", flag: "FIN", hue: 255, label: "I also have nothing more to send." },
      { from: "client", flag: "ACK", hue: 185, label: "Understood. Goodbye." },
    ],
  },
  abort: {
    title: "RST — forceful reset",
    blurb:
      "One side has had enough. No handshake, no goodbye — the connection is killed immediately.",
    packets: [
      { from: "client", flag: "RST", hue: 335, label: "Kill the connection now." },
    ],
  },
};

function HandshakeTab() {
  const [mode, setMode] = useState<keyof typeof SEQUENCES>("establish");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const seq = SEQUENCES[mode];
  const total = seq.packets.length;

  // Auto-play the sequence
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= total) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [playing, total]);

  const changeMode = (m: keyof typeof SEQUENCES) => {
    setMode(m);
    setStep(0);
    setPlaying(false);
  };

  const onPlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (step >= total - 1) setStep(0);
    setPlaying(true);
  };

  const visiblePackets = seq.packets.slice(0, step + 1);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Watch the packets flow between Client and Server. Switch modes to see
        how TCP establishes, terminates, and force-resets a connection.
      </p>

      {/* Mode switch */}
      <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-card p-1">
        {(
          [
            { id: "establish", label: "Establish (3-way)" },
            { id: "terminate", label: "Terminate (4-way)" },
            { id: "abort", label: "RST abort" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => changeMode(m.id)}
            aria-pressed={mode === m.id}
            className={cx(
              "rounded-md px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
              mode === m.id
                ? "bg-[var(--accent)] text-white"
                : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">{seq.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {seq.blurb}
        </p>

        {/* Timeline */}
        <div className="relative mt-5">
          {/* Header row */}
          <div className="grid grid-cols-[80px_1fr_80px] items-center gap-2 pb-2">
            <div className="text-right text-[11px] font-semibold">Client</div>
            <div />
            <div className="text-left text-[11px] font-semibold">Server</div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {visiblePackets.map((p, i) => {
              const fromClient = p.from === "client";
              return (
                <div
                  key={i}
                  className="osi-fade grid grid-cols-[80px_1fr_80px] items-center gap-2"
                >
                  <div
                    className={cx(
                      "text-[10px]",
                      fromClient ? "text-right text-foreground" : "text-right text-transparent",
                    )}
                  >
                    {fromClient ? "→" : "·"}
                  </div>
                  <div className="relative flex items-center justify-center">
                    <div
                      className={cx(
                        "flex w-full items-center gap-2",
                        fromClient ? "justify-start" : "justify-end",
                      )}
                    >
                      <div
                        style={hue(p.hue)}
                        className={cx(
                          "osi-tint tp-arrow flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5",
                        )}
                      >
                        <Flag className="osi-ink size-3.5" />
                        <span className="osi-ink text-xs font-bold">
                          {p.flag}
                          {p.flag2 ? ` + ${p.flag2}` : ""}
                        </span>
                      </div>
                      <ArrowRight
                        className={cx(
                          "size-3.5 shrink-0 text-muted-foreground",
                          !fromClient && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
                  <div
                    className={cx(
                      "text-[10px]",
                      !fromClient ? "text-left text-foreground" : "text-left text-transparent",
                    )}
                  >
                    {!fromClient ? "←" : "·"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation of current packet */}
        {visiblePackets.length > 0 && (
          <div
            style={hue(visiblePackets[visiblePackets.length - 1].hue)}
            className="osi-tint osi-fade mt-5 rounded-xl border px-3.5 py-3"
          >
            <p className="osi-ink text-[11px] font-semibold uppercase tracking-wide">
              Packet {visiblePackets.length} of {total}
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              {visiblePackets[visiblePackets.length - 1].label}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
            className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onPlay}
            className="rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.min(total - 1, s + 1));
            }}
            disabled={step >= total - 1}
            className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStep(0);
            }}
            className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
          >
            Restart
          </button>
          <span className="ml-auto text-[11px] text-muted-foreground">
            Step {step + 1} of {total}
          </span>
        </div>
      </div>

      {/* Flag reference */}
      <div>
        <Label>Flags used in this drill</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TCP_FLAGS.filter((f) =>
            seq.packets.some((p) => p.flag === f.flag || p.flag2 === f.flag),
          ).map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.flag}
                style={hue(f.hue)}
                className="osi-tint flex items-start gap-2.5 rounded-lg border px-3 py-2"
              >
                <Icon className="osi-ink mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="osi-ink text-xs font-bold">{f.flag}</p>
                  <p className="mt-0.5 text-[11px] leading-4">{f.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Callout icon={ArrowLeftRight}>
        Mnemonic: <strong>S</strong>ome <strong>A</strong>pplications{" "}
        <strong>F</strong>inish, <strong>S</strong>ome <strong>R</strong>eset.
        SYN, ACK, FIN, and RST are the four flags you actually see on the wire
        most often.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Interview Prep
// ─────────────────────────────────────────────────────────────

const PITCH =
  "The Transport layer, Layer 4, delivers data between processes on two hosts using TCP or UDP. TCP is connection-oriented, reliable, ordered, and carries a 20-byte header minimum — used by web, mail, and file transfer. UDP is connectionless, fast, best-effort, and carries an 8-byte header — used by DNS, VoIP, streaming, and DHCP. TCP establishes connections with a three-way handshake and closes them with a four-way handshake. Port numbers identify the application, split into well-known (0–1023), registered (1024–49151), and ephemeral (49152–65535). Protocol numbers in the IP header identify the transport protocol — TCP is 6, UDP is 17.";

const QA: Array<{ q: string; a: string[] }> = [
  {
    q: "What layer does TCP and UDP sit at, and what do they do?",
    a: [
      "Layer 4 — Transport.",
      "They deliver data between two specific processes on two hosts, using port numbers to identify the process.",
    ],
  },
  {
    q: "Compare TCP and UDP in a couple of sentences.",
    a: [
      "TCP is connection-oriented, reliable, ordered, and slower — used when accuracy matters.",
      "UDP is connectionless, best-effort, fast, and has no reorder or retransmission — used when speed matters more than perfection.",
    ],
  },
  {
    q: "What is the three-way handshake?",
    a: [
      "1. Client sends SYN with its starting sequence number.",
      "2. Server replies SYN-ACK, acknowledging the client and sending its own sequence number.",
      "3. Client sends ACK. Connection is established.",
    ],
  },
  {
    q: "What is the four-way handshake?",
    a: [
      "A graceful close of a TCP connection. Both directions must be closed independently.",
      "Sequence: FIN → ACK → FIN → ACK.",
    ],
  },
  {
    q: "What does RST do?",
    a: [
      "Forcefully terminates a TCP connection without the handshake.",
      "Used when the connection is unreliable: too many retransmissions, out-of-order or corrupted packets, drops, or intentionally too much delay.",
    ],
  },
  {
    q: "Name the TCP flags.",
    a: [
      "SYN — open a connection.",
      "ACK — acknowledge a segment.",
      "FIN — graceful close.",
      "PSH — push data to the application now.",
      "URG — urgent data inside.",
      "RST — forcefully reset.",
    ],
  },
  {
    q: "What port ranges should I remember?",
    a: [
      "Well-known: 0–1023 (HTTP 80, HTTPS 443, SSH 22).",
      "Registered: 1024–49151 (MySQL 3306, RDP 3389).",
      "Ephemeral: 49152–65535 — client-side source ports.",
    ],
  },
  {
    q: "What is the difference between a protocol number and a port number?",
    a: [
      "Protocol number identifies the transport protocol itself, and lives in the IP header — TCP is 6, UDP is 17, ICMP is 1.",
      "Port number identifies the application and lives in the TCP or UDP header.",
    ],
  },
  {
    q: "Explain MTU and MSS.",
    a: [
      "MTU — Maximum Transmission Unit — largest frame a link can carry. Ethernet default is 1500 bytes.",
      "MSS — Maximum Segment Size — the payload after subtracting IP and TCP headers. Normally 1500 − 20 − 20 = 1460.",
      "MSS is negotiated during the handshake.",
    ],
  },
  {
    q: "Why is DNS usually on UDP but sometimes on TCP?",
    a: [
      "Standard DNS queries are small and benefit from UDP's low overhead.",
      "Large responses — zone transfers, DNSSEC — exceed typical UDP packet sizes and switch to TCP.",
    ],
  },
  {
    q: "The TCP header is 20 bytes minimum. What makes it longer?",
    a: [
      "Options — MSS negotiation, window scaling, selective ACK, and timestamps.",
      "With options, the TCP header can reach 60 bytes.",
    ],
  },
  {
    q: "What is flow control, and how does TCP implement it?",
    a: [
      "Flow control prevents the sender from overwhelming the receiver.",
      "TCP uses a sliding window — the receiver advertises how much data it can accept, and the sender respects that window.",
    ],
  },
];

function InterviewPrepTab() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-6">
      <section>
        <Label>Your 30-second answer</Label>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm leading-relaxed">{PITCH}</p>
        </div>
      </section>

      <section>
        <Label>Questions interviewers ask</Label>
        <div className="space-y-2">
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full min-w-0 items-center gap-3 px-3.5 py-3 text-left outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <MessageCircleQuestion className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {item.q}
                  </span>
                  <ChevronRight
                    className={cx(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="osi-fade space-y-2 border-t px-3.5 pb-3.5 pt-3 text-sm leading-relaxed">
                    {item.a.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Callout icon={ShieldCheck}>
        Practice the 30-second pitch out loud until it flows without notes.
        Every follow-up question below is now answerable.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "big", label: "Big Picture" },
  { id: "cheat", label: "Cheat Sheet" },
  { id: "how", label: "How It Works" },
  { id: "misconceptions", label: "Misconceptions" },
  { id: "handshake", label: "Handshake Drill" },
  { id: "prep", label: "Interview Prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TransportLayerSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <div className="tp-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{TP_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 06 · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Transport Layer Protocols & Ports
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          TCP and UDP behaviour, the handshakes, TCP flags, and how port
          numbers identify services — with a live handshake animation.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Transport layer sections"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-card p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "shrink-0 rounded-lg px-3.5 py-2 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
              tab === t.id
                ? "bg-[var(--accent)] font-medium text-white"
                : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-w-0">
        {tab === "big" && <BigPictureTab />}
        {tab === "cheat" && <CheatSheetTab />}
        {tab === "how" && <HowItWorksTab />}
        {tab === "misconceptions" && <MisconceptionsTab />}
        {tab === "handshake" && <HandshakeTab />}
        {tab === "prep" && <InterviewPrepTab />}
      </div>
    </div>
  );
}