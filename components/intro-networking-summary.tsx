"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Check,
  ChevronRight,
  Cloud,
  Cctv,
  Globe,
  HardDrive,
  Home,
  Laptop,
  Layers,
  Lightbulb,
  Lock,
  MapPin,
  MessageCircleQuestion,
  Network,
  Phone,
  Printer,
  Server,
  ShieldCheck,
  Smartphone,
  Tv,
  Users,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   Introduction to Networking — Summary
   Structure: Big Picture · Cheat Sheet · How It Works ·
              Common Misconceptions · Network Picker (signature) ·
              Interview Prep
   Register as SUMMARY_VIEWS.intro = IntroNetworkingSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const INTRO_CSS = `
.intro-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.intro-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .intro-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.intro-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .intro-root .osi-solid{background:hsl(var(--h) 68% 52%)}
@keyframes introFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.intro-root .osi-fade{animation:introFade .22s ease-out both}
@media (prefers-reduced-motion:reduce){.intro-root .osi-fade{animation:none}}
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

const DEVICES: { icon: LucideIcon; label: string }[] = [
  { icon: Laptop, label: "Computers" },
  { icon: Smartphone, label: "Mobile & tablets" },
  { icon: Printer, label: "Printers" },
  { icon: Server, label: "Servers" },
  { icon: Lock, label: "Auth devices" },
  { icon: Cctv, label: "CCTV cameras" },
];

const SERVICES: { icon: LucideIcon; label: string }[] = [
  { icon: HardDrive, label: "Files & documents" },
  { icon: Users, label: "Email & IM" },
  { icon: Globe, label: "Websites" },
  { icon: Cloud, label: "Databases" },
  { icon: Tv, label: "Streaming audio / video" },
  { icon: Phone, label: "Audio / video calls" },
];

/** A tiny story so "exchanging information" stops being abstract. */
const PACKET_STORY: { step: string; what: string }[] = [
  { step: "You type a URL", what: "Your browser asks for a page from a server." },
  { step: "A name becomes a number", what: "DNS turns www.example.com into an IP address." },
  { step: "Data is chopped up", what: "The message is split into small pieces called packets." },
  { step: "Each packet is addressed", what: "Source IP + destination IP + a port number." },
  { step: "Routers pass them along", what: "Each router picks the next hop toward the destination." },
  { step: "The server replies", what: "Packets come back and your browser reassembles the page." },
];

const NET_TYPES: Array<{
  code: string;
  full: string;
  hue: number;
  icon: LucideIcon;
  scope: string;
  ownership: string;
  example: string;
  rule: string;
}> = [
  { code: "PAN", full: "Personal Area Network", hue: 335, icon: Smartphone, scope: "Around one person (~10 m)", ownership: "Private — you", example: "Phone to earbuds, smartwatch", rule: "Fits on or around your body" },
  { code: "LAN", full: "Local Area Network", hue: 150, icon: Home, scope: "One building or small site", ownership: "Private — you or your org", example: "Home Wi-Fi, one office floor", rule: "You can walk across it in minutes" },
  { code: "CAN", full: "Campus Area Network", hue: 165, icon: Building2, scope: "Several buildings, one site", ownership: "Private — one organization", example: "University or corporate campus", rule: "Multiple LANs, one owner, one site" },
  { code: "MAN", full: "Metropolitan Area Network", hue: 185, icon: Building2, scope: "A whole city", ownership: "Public — usually an ISP", example: "ACT Fibernet, Hathway", rule: "Spans a city, needs a carrier" },
  { code: "WAN", full: "Wide Area Network", hue: 215, icon: Globe, scope: "Countries, continents", ownership: "Carrier / ISP managed", example: "The Internet, Vi, JIO, Airtel", rule: "Crosses long distances via carriers" },
  { code: "SAN", full: "Storage Area Network", hue: 255, icon: HardDrive, scope: "Purpose-built, inside a DC", ownership: "Private — dedicated", example: "Data-center storage fabric", rule: "Not about distance — about storage" },
];

const HOST_ROLES: Array<{
  role: string;
  hue: number;
  icon: LucideIcon;
  blurb: string;
  asks: string;
  gives: string;
}> = [
  { role: "Client", hue: 215, icon: Laptop, blurb: "Requests information or services.", asks: "Sends the request", gives: "—" },
  { role: "Server", hue: 150, icon: Server, blurb: "Provides information or services.", asks: "—", gives: "Sends the response" },
  { role: "Peer", hue: 290, icon: ArrowRightLeft, blurb: "Can both request and provide.", asks: "Yes", gives: "Yes" },
];

const ARCHITECTURES: Array<{
  name: string;
  hue: number;
  icon: LucideIcon;
  oneLiner: string;
  wins: string[];
  loses: string[];
  where: string;
}> = [
  {
    name: "Client / Server",
    hue: 215,
    icon: Server,
    oneLiner: "Centralized: one (or a few) servers hold the data and answer every client.",
    wins: ["Easy to access and manage", "Centralized security, backups, and updates", "Cost-effective once you scale past a handful of users"],
    loses: ["The server is a single point of failure", "Server down = data gone or unreachable", "Fixing it means redundant / backup servers in other locations"],
    where: "Websites, email, almost every enterprise app",
  },
  {
    name: "Mainframe / Terminal",
    hue: 290,
    icon: Server,
    oneLiner: "All thinking happens on the mainframe. The terminal is a dumb I/O device — keyboard in, screen out.",
    wins: ["Central compute and data — nothing leaks to the endpoint", "Thin terminals are cheap and easy to replace", "Very tight control over the workload"],
    loses: ["Terminal has zero local processing power", "If the mainframe stops, every terminal stops"],
    where: "Banks, airlines, legacy enterprise",
  },
  {
    name: "Peer-to-Peer",
    hue: 150,
    icon: Users,
    oneLiner: "No dedicated server. Every host is a client and a server at the same time.",
    wins: ["No central server to buy or maintain", "Cheap to set up for a small group", "Scales with the peers, not with hardware"],
    loses: ["No central control, security, or audit trail", "Hard to back up reliably", "One slow peer can slow everyone down"],
    where: "Small home networks, file sharing, torrents",
  },
];

// ─────────────────────────────────────────────────────────────
// Tab · Big Picture
// ─────────────────────────────────────────────────────────────

function BigPictureTab() {
  return (
    <div className="space-y-6">
      <div style={hue(215)} className="osi-tint rounded-xl border px-3.5 py-3.5">
        <p className="osi-ink text-xs font-semibold">What a network is</p>
        <p className="mt-1 text-sm leading-relaxed">
          A <span className="font-semibold">computer network</span> is a
          collection of devices connected through a wired or wireless medium,
          for one specific purpose:{" "}
          <span className="font-semibold">exchanging information</span>.
        </p>
        <p className="mt-2 text-xs italic text-muted-foreground">
          Devices + medium + purpose = network. Remove any one and it stops
          being a network.
        </p>
      </div>

      <div>
        <Label>What "exchanging information" actually looks like</Label>
        <div className="overflow-hidden rounded-xl border bg-card">
          {PACKET_STORY.map((s, i) => (
            <div
              key={s.step}
              className="flex items-start gap-3 border-b px-3.5 py-2.5 last:border-0"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.step}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {s.what}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div style={hue(335)} className="osi-tint rounded-xl border px-3.5 py-3.5">
          <p className="osi-ink text-xs font-semibold">Protocol</p>
          <p className="mt-1 text-sm leading-relaxed">
            A set of rules that two devices agree on so they can talk. Same
            protocol both ends = communication works.
          </p>
          <p className="mt-2 text-xs italic text-muted-foreground">
            Analogy: a shared language. Two people must speak the same one.
          </p>
        </div>
        <div style={hue(185)} className="osi-tint rounded-xl border px-3.5 py-3.5">
          <p className="osi-ink text-xs font-semibold">Reference model</p>
          <p className="mt-1 text-sm leading-relaxed">
            A blueprint for how devices <em>should</em> behave, so different
            vendors interoperate.
          </p>
          <p className="mt-2 text-xs italic text-muted-foreground">
            Analogy: a building code — not the wiring, but the rules that make
            the wiring work together.
          </p>
        </div>
      </div>

      <Callout>
        Every protocol, every device, every model in this course exists to
        make one of the six steps above happen — reliably, quickly, and
        safely.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Cheat Sheet
// ─────────────────────────────────────────────────────────────

const PROTOCOLS = ["HTTP", "HTTPS", "FTP", "TFTP", "SFTP", "SMTP"];

function CheatSheetTab() {
  return (
    <div className="space-y-6">
      <div>
        <Label>Network types at a glance</Label>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Scope</th>
                <th className="px-3 py-2 font-medium">Ownership</th>
                <th className="px-3 py-2 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              {NET_TYPES.map((n) => (
                <tr key={n.code} className="border-t">
                  <td className="px-3 py-2">
                    <span className="font-semibold">{n.code}</span>
                    <span className="ml-1 text-muted-foreground">
                      — {n.full}
                    </span>
                  </td>
                  <td className="px-3 py-2">{n.scope}</td>
                  <td className="px-3 py-2">{n.ownership}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {n.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Common protocols</Label>
          <div className="flex flex-wrap gap-1.5">
            {PROTOCOLS.map((p) => (
              <Chip key={p}>{p}</Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Reference models</Label>
          <div className="flex flex-wrap gap-1.5">
            <Chip>OSI — 7 layers (ISO)</Chip>
            <Chip>TCP/IP — 4 layers (practical)</Chip>
          </div>
        </div>
      </div>

      <div>
        <Label>Host roles — who asks, who answers</Label>
        <div className="overflow-hidden rounded-xl border bg-card">
          {HOST_ROLES.map((r, i, arr) => (
            <div
              key={r.role}
              className={cx(
                "grid grid-cols-[110px_1fr_1fr] items-center gap-3 px-3.5 py-2.5",
                i !== arr.length - 1 && "border-b",
              )}
            >
              <span className="text-sm font-semibold">{r.role}</span>
              <span className="text-xs">
                <span className="text-muted-foreground">Asks: </span>
                {r.asks}
              </span>
              <span className="text-xs">
                <span className="text-muted-foreground">Provides: </span>
                {r.gives}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Callout icon={Layers}>
        If you can say one full sentence for each row of these tables, you own
        Topic 01.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · How It Works (step-by-step)
// ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    title: "Devices are connected",
    layer: 1,
    hue: 150,
    text: "Two or more devices are physically joined — copper, fiber, or radio. At this point nothing can be sent yet; there is only a link.",
  },
  {
    title: "They agree on a protocol",
    layer: 7,
    hue: 335,
    text: "Both ends speak the same rules. HTTP for a web page, SMTP for mail. Same protocol on both ends = communication is possible.",
  },
  {
    title: "Data is chopped into packets",
    layer: 4,
    hue: 215,
    text: "The full message is split into small packets. If one packet is lost, only that one is retransmitted — not the whole file.",
  },
  {
    title: "Each packet is addressed",
    layer: 3,
    hue: 185,
    text: "Every packet gets a source IP, a destination IP, and a port number so the receiving machine knows which app to hand it to.",
  },
  {
    title: "Routers pass the packets along",
    layer: 3,
    hue: 255,
    text: "Routers look at the destination IP and forward the packet hop by hop toward the destination network.",
  },
  {
    title: "The receiver rebuilds the message",
    layer: 7,
    hue: 150,
    text: "The destination host reassembles the packets in order and passes the complete message up to the application — a page, an image, an email.",
  },
];

function HowItWorksTab() {
  const [step, setStep] = useState(0);
  const current = HOW_STEPS[step];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        A single message moving from one device to another — step by step.
        Use the buttons or click a step below.
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
          <p className="osi-ink text-xs font-semibold">
            Step {step + 1} · Layer {current.layer}
          </p>
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
                i === step ? "osi-tint" : "bg-card hover:bg-[var(--accent-soft)]",
              )}
            >
              <span
                className={cx(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  i === step
                    ? "osi-solid"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">{s.title}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                Layer {s.layer}
              </span>
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
    wrong: "A network needs a server.",
    right:
      "A network needs devices, a medium, and a purpose. Servers are optional — P2P proves it.",
  },
  {
    wrong: "Protocol and program are the same.",
    right:
      "A protocol is a rulebook. A program (Chrome, Outlook) uses the rulebook.",
  },
  {
    wrong: "The internet is a LAN.",
    right:
      "The internet is a WAN — a collection of LANs spanning continents, run by carriers.",
  },
  {
    wrong: "A VPN is a type of network.",
    right:
      "A VPN is a virtual tunnel that runs on top of an existing network. Site-to-site or remote-access.",
  },
  {
    wrong: "A host is always a client.",
    right:
      "A host can be a client, a server, or a peer — it depends on what it is doing, not what it is.",
  },
  {
    wrong: "Client/Server has no downside.",
    right:
      "The server is a single point of failure. That is why backups and redundancy exist.",
  },
  {
    wrong: "OSI and TCP/IP are the same model.",
    right:
      "OSI is 7 layers (ISO). TCP/IP is 4 layers. TCP/IP is what the internet actually runs on.",
  },
  {
    wrong: "SAN is just a big LAN.",
    right:
      "SAN is purpose-built for storage — high capacity, high speed, low loss. It is not about distance.",
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
        {MISCONCEPTIONS.map((t, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-start gap-2.5 border-b border-destructive/30 bg-destructive/5 px-3.5 py-2.5">
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                ✗ Wrong
              </span>
              <p className="min-w-0 text-sm">{t.wrong}</p>
            </div>
            <div className="flex items-start gap-2.5 bg-emerald-500/5 px-3.5 py-2.5">
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                ✓ Right
              </span>
              <p className="min-w-0 text-sm">{t.right}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout icon={Network}>
        If you can explain each of these eight pairs in your own words, you
        understand Topic 01 — not just memorized it.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Network Picker (signature)
// ─────────────────────────────────────────────────────────────

const PICKER_SCENARIOS: Array<{
  text: string;
  answer: string; // code of the network type
  why: string;
}> = [
  {
    text: "Your phone is streaming music to your wireless earbuds on the bus.",
    answer: "PAN",
    why: "It is a personal network — around one person, over Bluetooth, ~10 metres.",
  },
  {
    text: "The Wi-Fi in your house connects your laptop, TV, and printer.",
    answer: "LAN",
    why: "One building, private, high speed — the classic Local Area Network.",
  },
  {
    text: "A university has 12 buildings connected to one backbone network.",
    answer: "CAN",
    why: "Multiple LANs, one owner, one physical site — a Campus Area Network.",
  },
  {
    text: "A city-wide ISP connects subscribers across the metro area.",
    answer: "MAN",
    why: "A public network covering a whole city, run by a carrier.",
  },
  {
    text: "You load a webpage hosted on a server in another country.",
    answer: "WAN",
    why: "The traffic crosses continents through carrier networks — that is a WAN.",
  },
  {
    text: "A data centre has a dedicated high-speed fabric just for disk storage.",
    answer: "SAN",
    why: "Storage Area Network — purpose-built, high speed, low loss. Not about distance.",
  },
  {
    text: "A branch office connects to HQ through an encrypted tunnel over the internet.",
    answer: "VPN",
    why: "A VPN is a technique, not a type. It is a virtual tunnel through whatever network you already have.",
  },
];

function NetworkPickerTab() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const q = PICKER_SCENARIOS[i];
  const isCorrect = picked === q.answer;
  const isLast = i === PICKER_SCENARIOS.length - 1;

  const options = ["PAN", "LAN", "CAN", "MAN", "WAN", "SAN", "VPN"];

  const next = () => {
    if (isLast) {
      setI(0);
      setPicked(null);
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Read the scenario. Pick the network type that best fits. This is the
        signature drill for Topic 01 — the fastest way to make PAN, LAN, CAN,
        MAN, WAN, SAN and VPN stop looking like random letters.
      </p>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Scenario {i + 1} of {PICKER_SCENARIOS.length}
          </span>
          <span>Pick the type</span>
        </div>

        <p className="text-base font-medium leading-relaxed">{q.text}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {options.map((o) => {
            const right = picked !== null && o === q.answer;
            const wrong = picked === o && o !== q.answer;
            return (
              <button
                key={o}
                type="button"
                onClick={() => picked === null && setPicked(o)}
                disabled={picked !== null}
                className={cx(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                  picked === null && "hover:bg-[var(--accent-soft)]",
                  right && "border-emerald-500 bg-emerald-500/10",
                  wrong && "border-destructive bg-destructive/10",
                  picked !== null && !right && !wrong && "opacity-50",
                )}
              >
                {o}
                {right && (
                  <Check className="ml-1.5 inline size-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="osi-fade mt-4 space-y-3">
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm leading-relaxed">
              <span className="font-semibold">
                {isCorrect ? "Correct. " : `Answer: ${q.answer}. `}
              </span>
              {q.why}
            </p>
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLast ? "Start over" : "Next scenario"}
            </button>
          </div>
        )}
      </div>

      <Callout icon={Lightbulb}>
        Memory hook: <strong>P</strong>ersonal → <strong>L</strong>ocal →{" "}
        <strong>C</strong>ampus → <strong>M</strong>etro → <strong>W</strong>ide.
        Distance grows left to right. <strong>SAN</strong> and{" "}
        <strong>VPN</strong> are the odd ones — one is about storage, the
        other is a technique.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Interview Prep
// ─────────────────────────────────────────────────────────────

const PITCH =
  "A computer network is a collection of devices connected through a wired or wireless medium, with the purpose of exchanging information. Networks are classified by scope — PAN, LAN, CAN, MAN, WAN — and by purpose, like SAN for storage. Devices play roles: client, server, or peer. Architectures decide where the data and thinking live: client/server, mainframe/terminal, or peer-to-peer. Two reference models describe all this — OSI (7 layers) for teaching and troubleshooting, TCP/IP (4 layers) for what the internet actually runs on.";

const QA: Array<{ q: string; a: string[] }> = [
  {
    q: "What is a computer network?",
    a: [
      "A collection of devices connected through a wired or wireless medium, for the specific purpose of exchanging information.",
      "Three things are needed: devices, a medium, and a purpose. Remove any one and it is not a network.",
    ],
  },
  {
    q: "What is the difference between a protocol and a reference model?",
    a: [
      "A protocol is a set of rules two devices agree on so they can communicate.",
      "A reference model is a blueprint that describes how devices should behave — it lets vendors interoperate. OSI and TCP/IP are the two you should know.",
    ],
  },
  {
    q: "Explain the network types PAN, LAN, CAN, MAN, WAN.",
    a: [
      "PAN — around one person, ~10 m. Phone to earbuds.",
      "LAN — one building or site. Home Wi-Fi.",
      "CAN — several buildings on one campus, one owner.",
      "MAN — a city, usually run by an ISP.",
      "WAN — countries and continents. The internet is the biggest WAN.",
    ],
  },
  {
    q: "Where does a SAN fit?",
    a: [
      "A Storage Area Network is purpose-built for high-speed, high-capacity storage access — usually inside a data centre.",
      "It is not about distance; it is about the purpose. That is why it does not slot into the PAN → WAN ladder.",
    ],
  },
  {
    q: "What is a VPN and where does it belong?",
    a: [
      "A VPN is a virtual tunnel through a public network (usually the internet) that carries private traffic securely.",
      "Two common types: site-to-site (branch to HQ) and remote-access / SSL VPN (one user to the office).",
      "It is a technique, not a network type — it rides on whatever network you already have.",
    ],
  },
  {
    q: "What is a host?",
    a: [
      "Any device with an assigned IP address that generates and receives network traffic.",
      "Computers, phones, printers, servers, IoT devices — all hosts. Routers and switches are infrastructure.",
    ],
  },
  {
    q: "Explain the three roles a host can play.",
    a: [
      "Client — requests services. Server — provides services. Peer — does both.",
      "These are roles, not device types. Your laptop is a client when you browse, a server when you share a file, and a peer when you torrent.",
    ],
  },
  {
    q: "Compare Client/Server, Mainframe/Terminal, and Peer-to-Peer.",
    a: [
      "Client/Server — centralized server, easy to manage, but a single point of failure.",
      "Mainframe/Terminal — all compute and storage on the mainframe; terminals are I/O only.",
      "Peer-to-Peer — no central server, every host is client and server. Cheap, but no central control.",
    ],
  },
  {
    q: "What are the trade-offs of centralized architectures?",
    a: [
      "You get central control, centralized security, and easier management.",
      "But the server or mainframe becomes a single point of failure. That is why real deployments add redundant / backup servers in different locations.",
    ],
  },
  {
    q: "Walk me through what happens when you type a URL.",
    a: [
      "DNS resolves the name to an IP address.",
      "The host builds a request and splits the data into packets.",
      "Each packet gets source IP, destination IP, and port numbers.",
      "Routers forward packets hop by hop toward the destination network.",
      "The server replies, and the response travels back the same way.",
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
        Everything else is a follow-up question you can now answer.
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
  { id: "picker", label: "Network Picker" },
  { id: "prep", label: "Interview Prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function IntroNetworkingSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <div className="intro-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{INTRO_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 01 · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Introduction to Networking
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The vocabulary, the network types, host roles, and the three
          architectures — with a scenario drill to lock the acronyms in.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Introduction to networking sections"
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
        {tab === "picker" && <NetworkPickerTab />}
        {tab === "prep" && <InterviewPrepTab />}
      </div>
    </div>
  );
}