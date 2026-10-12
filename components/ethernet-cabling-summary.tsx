"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  Cable,
  Check,
  ChevronRight,
  CircleDot,
  Coins,
  Cpu,
  Gauge,
  Layers,
  Lightbulb,
  MessageCircleQuestion,
  Network,
  Plug,
  Radio,
  ShieldCheck,
  Sparkles,
  Tv,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   Ethernet & Network Cabling — Summary
   Structure: Big Picture · Cheat Sheet · How It Works ·
              Common Misconceptions · Cable Picker (signature) ·
              Interview Prep
   Register as SUMMARY_VIEWS.ethernet = EthernetCablingSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const ETH_CSS = `
.eth-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.eth-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .eth-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.eth-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .eth-root .osi-solid{background:hsl(var(--h) 68% 52%)}
@keyframes ethFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.eth-root .osi-fade{animation:ethFade .22s ease-out both}
@media (prefers-reduced-motion:reduce){.eth-root .osi-fade{animation:none}}
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

const ETHERNET_SPEEDS: { name: string; short: string; mbps: number }[] = [
  { name: "Ethernet", short: "10 Mbps", mbps: 10 },
  { name: "Fast Ethernet", short: "100 Mbps", mbps: 100 },
  { name: "Gigabit Ethernet", short: "1000 Mbps", mbps: 1000 },
  { name: "10 Gigabit", short: "10 Gbps", mbps: 10_000 },
  { name: "25 Gigabit", short: "25 Gbps", mbps: 25_000 },
  { name: "40 Gigabit", short: "40 Gbps", mbps: 40_000 },
  { name: "100 Gigabit", short: "100 Gbps", mbps: 100_000 },
  { name: "200 Gigabit", short: "200 Gbps", mbps: 200_000 },
  { name: "400 Gigabit", short: "400 Gbps", mbps: 400_000 },
];

const CABLE_KINDS: Array<{
  name: string;
  hue: number;
  icon: LucideIcon;
  carries: string;
  built: string;
  best: string;
  avoid: string;
}> = [
  {
    name: "Twisted Pair (UTP / STP)",
    hue: 150,
    icon: Cable,
    carries: "Electrical signal",
    built: "8 wires in 4 twisted pairs",
    best: "Short runs (≤100 m), cheap LAN cabling",
    avoid: "Long distances, noisy industrial environments",
  },
  {
    name: "Coaxial",
    hue: 35,
    icon: Tv,
    carries: "Electrical signal",
    built: "Copper core + 3 insulation layers",
    best: "Television service today",
    avoid: "Modern data networking — legacy only",
  },
  {
    name: "Fiber Optic",
    hue: 255,
    icon: Sparkles,
    carries: "Light",
    built: "Glass core + cladding",
    best: "Long distance, high speed, EMI immunity",
    avoid: "Cheap short runs where copper is fine",
  },
];

const TWISTED_PAIR_CATS = [
  { cat: "Cat 3", detail: "3 twists / inch", note: "Old voice + 10 Mbps Ethernet", speed: "10 Mbps" },
  { cat: "Cat 5", detail: "5 twists / inch", note: "100 Mbps Fast Ethernet", speed: "100 Mbps" },
  { cat: "Cat 5e", detail: "Pairs twisted around each other", note: "Gigabit Ethernet, less crosstalk", speed: "1 Gbps" },
  { cat: "Cat 6", detail: "6 twists / inch + better insulation", note: "Higher bandwidth, tighter tolerances", speed: "10 Gbps" },
];

const FIBER_MODES = [
  {
    mode: "Single-mode",
    hue: 215,
    icon: CircleDot,
    core: "Small core",
    light: "One ray of light",
    distance: "Long distance (km) — 40 km, 100 km",
    use: "Between cities / countries",
  },
  {
    mode: "Multi-mode",
    hue: 150,
    icon: Radio,
    core: "Larger core",
    light: "Many rays of light at once",
    distance: "Short distance",
    use: "Inside one building, LAN / WAN campus",
  },
];

const TRANSCEIVERS = [
  { name: "SFP", speed: "1 Gbps", note: "Small Form-factor Pluggable" },
  { name: "SFP+", speed: "10 Gbps", note: "Faster SFP, same footprint" },
  { name: "QSFP", speed: "100 Gbps", note: "Quad SFP — 4 lanes" },
];

const PINOUT_568B = [
  { pin: 1, color: "Orange / White", group: "orange" },
  { pin: 2, color: "Orange", group: "orange" },
  { pin: 3, color: "Green / White", group: "green" },
  { pin: 4, color: "Blue", group: "blue" },
  { pin: 5, color: "Blue / White", group: "blue" },
  { pin: 6, color: "Green", group: "green" },
  { pin: 7, color: "Brown / White", group: "brown" },
  { pin: 8, color: "Brown", group: "brown" },
];

/** Colour hexes used by the picker so students can visually see the wire. */
const COLOR_HEX: Record<string, { base: string; stripe?: string }> = {
  "Orange / White": { base: "#ffffff", stripe: "#f97316" },
  Orange: { base: "#f97316" },
  "Green / White": { base: "#ffffff", stripe: "#16a34a" },
  Blue: { base: "#2563eb" },
  "Blue / White": { base: "#ffffff", stripe: "#2563eb" },
  Green: { base: "#16a34a" },
  "Brown / White": { base: "#ffffff", stripe: "#78350f" },
  Brown: { base: "#78350f" },
};

const CABLE_TYPES = [
  {
    type: "Straight-through",
    hue: 150,
    icon: Plug,
    connects: "Different device types",
    examples: ["Switch ↔ PC", "Switch ↔ Router", "Router ↔ Firewall"],
    wiring: "Both ends use the same pinout (1→1, 2→2, …)",
  },
  {
    type: "Crossover",
    hue: 335,
    icon: Network,
    connects: "Same device types",
    examples: ["Switch ↔ Switch", "Router ↔ Router", "PC ↔ PC"],
    wiring: "Tx and Rx pairs swapped (1↔3, 2↔6)",
  },
];

const POE_STANDARDS = [
  { std: "802.3af", name: "PoE", watts: "15.4 W" },
  { std: "802.3at", name: "PoE+", watts: "30 W" },
  { std: "802.3bt (Type 3)", name: "PoE++", watts: "60 W" },
  { std: "802.3bt (Type 4)", name: "PoE++", watts: "90 W" },
];

const POE_DEVICES = [
  "Wireless access points",
  "IP cameras (CCTV)",
  "VoIP phones",
  "Door access control",
  "Some LED lighting",
];

// ─────────────────────────────────────────────────────────────
// Tab · Big Picture
// ─────────────────────────────────────────────────────────────

function BigPictureTab() {
  return (
    <div className="space-y-6">
      <div
        style={hue(215)}
        className="osi-tint rounded-xl border px-3.5 py-3.5"
      >
        <p className="osi-ink text-xs font-semibold">
          What Ethernet actually is
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          Ethernet is not a single cable or a single speed. It is a{" "}
          <strong>family of standards</strong> that decides how devices on a
          local network frame bits, address each other, and share the wire.
          It works in both LAN and WAN, and it is standardized by{" "}
          <strong>IEEE</strong>.
        </p>
      </div>

      <div>
        <Label>Where it came from</Label>
        <div className="overflow-hidden rounded-xl border bg-card">
          {[
            { who: "Xerox", what: "First version at 2.94 Mbps, LAN environment" },
            { who: "Three-company consortium", what: "First public version at 10 Mbps" },
            { who: "IEEE", what: "Standardized as Ethernet Version 2" },
            { who: "Today", what: "Open standard — anyone can build Ethernet gear" },
          ].map((r, i, arr) => (
            <div
              key={r.who}
              className={cx(
                "flex items-start gap-3 px-3.5 py-2.5",
                i !== arr.length - 1 && "border-b",
              )}
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.who}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {r.what}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Why Ethernet won</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { icon: Coins, t: "Inexpensive", d: "Cheap hardware, cheap cable" },
            { icon: Plug, t: "Simple to install", d: "RJ-45 crimp and go" },
            { icon: Layers, t: "Flexible & scalable", d: "10 Mbps to 400 Gbps, same idea" },
            { icon: Network, t: "Multi-vendor", d: "Open standard = interoperability" },
          ].map((b) => (
            <div
              key={b.t}
              className="flex items-start gap-2.5 rounded-lg border bg-card px-3 py-2.5"
            >
              <b.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{b.t}</p>
                <p className="text-xs text-muted-foreground">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Callout icon={Lightbulb}>
        Speed upgrades never change the <em>idea</em> of Ethernet — they
        change the encoding and the medium. A 400G link and a 10 Mbps link
        still send frames with source and destination MAC addresses.
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
        <Label>Ethernet speeds at a glance</Label>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Speed</th>
              </tr>
            </thead>
            <tbody>
              {ETHERNET_SPEEDS.map((s) => (
                <tr key={s.name} className="border-t">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {s.short}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {CABLE_KINDS.map((c) => (
          <div
            key={c.name}
            style={hue(c.hue)}
            className="osi-tint rounded-xl border px-3.5 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="osi-solid flex size-7 items-center justify-center rounded-md">
                <c.icon className="size-3.5" />
              </span>
              <p className="osi-ink text-xs font-semibold">{c.name}</p>
            </div>
            <dl className="mt-2 space-y-1 text-[11px]">
              {[
                ["Carries", c.carries],
                ["Built", c.built],
                ["Best", c.best],
                ["Avoid", c.avoid],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[50px_1fr] gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 break-words font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Twisted pair categories</Label>
          <div className="overflow-hidden rounded-xl border bg-card">
            {TWISTED_PAIR_CATS.map((c, i, arr) => (
              <div
                key={c.cat}
                className={cx(
                  "grid grid-cols-[64px_1fr_70px] items-center gap-3 px-3.5 py-2",
                  i !== arr.length - 1 && "border-b",
                )}
              >
                <span className="text-sm font-semibold">{c.cat}</span>
                <span className="text-[11px] text-muted-foreground">
                  {c.detail}
                </span>
                <span className="text-right text-[11px] font-mono">
                  {c.speed}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Fiber transceivers</Label>
          <div className="overflow-hidden rounded-xl border bg-card">
            {TRANSCEIVERS.map((t, i, arr) => (
              <div
                key={t.name}
                className={cx(
                  "grid grid-cols-[80px_1fr_80px] items-center gap-3 px-3.5 py-2.5",
                  i !== arr.length - 1 && "border-b",
                )}
              >
                <span className="text-sm font-semibold">{t.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t.note}
                </span>
                <span className="text-right text-[11px] font-mono">
                  {t.speed}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>PoE standards</Label>
          <div className="overflow-hidden rounded-xl border bg-card">
            {POE_STANDARDS.map((p, i, arr) => (
              <div
                key={p.std}
                className={cx(
                  "flex items-center justify-between gap-3 px-3.5 py-2",
                  i !== arr.length - 1 && "border-b",
                )}
              >
                <span className="text-xs">
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                    {p.std}
                  </span>
                </span>
                <span className="text-xs font-mono">{p.watts}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Twisted pair limits</Label>
          <div className="rounded-xl border bg-card px-3.5 py-3 text-sm">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Max distance</span>
              <span className="font-mono font-medium">100 m</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-muted-foreground">Max speed</span>
              <span className="font-mono font-medium">1 Gbps</span>
            </div>
          </div>
        </div>
      </div>

      <Callout icon={Cable}>
        If you can say one full sentence for each row of these tables, the
        physical layer is genuinely solid.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · How It Works (step-by-step)
// ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    title: "Bits enter the NIC",
    hue: 150,
    text: "The network interface card takes the frame and turns it into an electrical signal, light pulse, or radio wave — depending on the medium.",
  },
  {
    title: "Signal travels on the medium",
    hue: 215,
    text: "The chosen cable carries the signal. Copper carries electricity, fiber carries light, Wi-Fi carries radio.",
  },
  {
    title: "Signal reaches the far end",
    hue: 255,
    text: "The receiving NIC reads the electrical / light / radio signal and converts it back into bits.",
  },
  {
    title: "Ethernet decodes the frame",
    hue: 290,
    text: "The receiving side reads the frame's source and destination MAC addresses and the FCS trailer that detects corruption.",
  },
  {
    title: "Higher layers take over",
    hue: 335,
    text: "If the destination MAC is this device, the packet is passed up to Layer 3. If not, the frame is dropped.",
  },
];

function HowItWorksTab() {
  const [step, setStep] = useState(0);
  const current = HOW_STEPS[step];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        How one Ethernet frame crosses a cable, from the sending NIC to the
        receiving NIC. Use Next / Previous or click a step below.
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
            Step {step + 1}
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
    wrong: "Ethernet is one speed.",
    right:
      "Ethernet is a family: 10 Mbps up to 400 Gbps, all standardized by IEEE.",
  },
  {
    wrong: "Cat 5e is just Cat 5 with a fancy name.",
    right:
      "Cat 5e twists the pairs around each other for less crosstalk and supports Gigabit.",
  },
  {
    wrong: "Fiber is 'just faster copper'.",
    right:
      "Fiber carries light, not electricity — immune to EMI and safe over long distances.",
  },
  {
    wrong: "Single-mode fiber is faster than multi-mode.",
    right:
      "They are similar speeds. Single-mode goes farther; multi-mode is cheaper for short runs.",
  },
  {
    wrong: "Crossover cables are obsolete.",
    right:
      "Auto MDI-X made them optional on modern gear, but old switches and routers still need them.",
  },
  {
    wrong: "All 8 wires in Ethernet carry data.",
    right:
      "Only pins 1, 2, 3, 6 carry data (Tx and Rx). The rest are spare.",
  },
  {
    wrong: "PoE sends power to everything plugged in.",
    right:
      "PoE first checks if the device is PoE-aware. Non-PoE devices get data only.",
  },
  {
    wrong: "PoE+ and PoE++ are the same.",
    right:
      "PoE = 15.4 W, PoE+ = 30 W, PoE++ = 60 W or 90 W. Match the standard to the device.",
  },
  {
    wrong: "Coaxial is dead.",
    right:
      "It is dead for data networking but still standard for TV and cable internet service.",
  },
  {
    wrong: "100 metres is a suggestion.",
    right:
      "It is a hard limit for twisted pair Ethernet. Beyond it, packets start dropping.",
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

      
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Cable & Colour-Code Picker (signature)
// ─────────────────────────────────────────────────────────────

type PickerScenario = {
  scene: string;
  answer: string; // key into PICKS
  why: string;
};

/** One chip per answer the picker can use. */
const PICKS: Record<
  string,
  { label: string; hue: number; icon: LucideIcon }
> = {
  utp5e: { label: "Cat 5e UTP", hue: 150, icon: Cable },
  utp6: { label: "Cat 6 UTP", hue: 165, icon: Cable },
  stp: { label: "Cat 6 STP", hue: 185, icon: ShieldCheck },
  coax: { label: "Coaxial", hue: 35, icon: Tv },
  single: { label: "Single-mode fiber", hue: 215, icon: CircleDot },
  multi: { label: "Multi-mode fiber", hue: 255, icon: Radio },
  straight: { label: "Straight-through", hue: 150, icon: Plug },
  cross: { label: "Crossover", hue: 335, icon: Network },
  af: { label: "802.3af (15.4 W)", hue: 290, icon: Zap },
  at: { label: "802.3at (30 W)", hue: 35, icon: Zap },
  bt: { label: "802.3bt (60/90 W)", hue: 335, icon: Zap },
};

const PICKER_SCENARIOS: PickerScenario[] = [
  {
    scene: "You are running a Gigabit Ethernet cable from a wall jack to a desktop PC, 30 m away, in a normal office.",
    answer: "utp5e",
    why: "Cat 5e UTP handles Gigabit at 100 m — the cheapest option that works.",
  },
  {
    scene: "Same office, but you need 10 Gbps to a workstation 40 m away.",
    answer: "utp6",
    why: "Cat 6 supports 10 Gbps over shorter distances with tighter tolerances.",
  },
  {
    scene: "A factory floor with heavy motors is causing interference on the network cables.",
    answer: "stp",
    why: "Shielded twisted pair (STP) adds extra layers of shielding against EMI.",
  },
  {
    scene: "You need to extend an internet link from one building to another 8 km away.",
    answer: "single",
    why: "Single-mode fiber reaches 40–100 km. Copper tops out at 100 m.",
  },
  {
    scene: "Connecting two switches inside the same data-center rack, 20 m apart.",
    answer: "multi",
    why: "Multi-mode fiber is cheaper and perfect for short campus / intra-DC runs.",
  },
  {
    scene: "An old 100 Mbps ISP modem in the basement needs to reach the TV upstairs. It's already coax.",
    answer: "coax",
    why: "Coaxial is the standard medium for cable internet and television.",
  },
  {
    scene: "You connect a PC to a wall jack that runs to a switch. Which cable do you use?",
    answer: "straight",
    why: "PC and switch are different device types — straight-through is the classic answer.",
  },
  {
    scene: "You connect two old switches directly, no wall jacks, older gear without Auto MDI-X.",
    answer: "cross",
    why: "Same device types = crossover. Auto MDI-X makes it optional on modern gear.",
  },
  {
    scene: "You are powering a small VoIP phone that draws about 7 watts.",
    answer: "af",
    why: "802.3af (PoE) provides up to 15.4 W per port — plenty for a basic phone.",
  },
  {
    scene: "You are powering a modern Wi-Fi 6 access point that draws about 25 watts.",
    answer: "at",
    why: "802.3at (PoE+) provides up to 30 W — the standard for modern APs.",
  },
  {
    scene: "You are powering a pan-tilt-zoom camera with a heater that needs 75 watts.",
    answer: "bt",
    why: "Only 802.3bt (PoE++) reaches 60–90 W per port. af and at cannot.",
  },
];

function CablePickerTab() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const q = PICKER_SCENARIOS[i];
  const isCorrect = picked === q.answer;
  const isLast = i === PICKER_SCENARIOS.length - 1;

  const answerKeys = Object.keys(PICKS);

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
        Read the scenario. Pick the cable, wiring, or PoE standard that fits.
        This is the signature drill for Topic 03 — the fastest way to make
        Cat 5e, Cat 6, STP, UTP, single-mode, multi-mode, straight, crossover,
        and PoE wattages stop looking like trivia.
      </p>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Scenario {i + 1} of {PICKER_SCENARIOS.length}
          </span>
          <span>Pick the best fit</span>
        </div>

        <p className="text-base font-medium leading-relaxed">{q.scene}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {answerKeys.map((k) => {
            const p = PICKS[k];
            const right = picked !== null && k === q.answer;
            const wrong = picked === k && k !== q.answer;
            const Icon = p.icon;
            return (
              <button
                key={k}
                type="button"
                onClick={() => picked === null && setPicked(k)}
                disabled={picked !== null}
                style={hue(p.hue)}
                className={cx(
                  "flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                  picked === null && "hover:bg-[var(--accent-soft)]",
                  right && "border-emerald-500 bg-emerald-500/10",
                  wrong && "border-destructive bg-destructive/10",
                  picked !== null && !right && !wrong && "opacity-50",
                )}
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{p.label}</span>
                {right && (
                  <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="osi-fade mt-4 space-y-3">
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm leading-relaxed">
              <span className="font-semibold">
                {isCorrect ? "Correct. " : `Best answer: ${PICKS[q.answer].label}. `}
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
        Rules of thumb: <strong>Copper for short, fiber for long</strong>;{" "}
        <strong>UTP by default, STP when there is noise</strong>;{" "}
        <strong>straight for different, crossover for same</strong>;{" "}
        <strong>match the PoE standard to the wattage, not the cable</strong>.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Interview Prep
// ─────────────────────────────────────────────────────────────

const PITCH =
  "Ethernet is a family of IEEE standards that defines how devices on a local network frame bits, address each other, and share the medium. It has evolved from 10 Mbps to 400 Gbps while keeping the same framing and MAC addressing. Three families of cable carry it: twisted pair for short runs up to 100 metres, coaxial for legacy and TV service, and fiber for long-distance and EMI-immune links. Twisted pair is categorized by twists-per-inch — Cat 3, 5, 5e, 6. Wiring uses the EIA/TIA-568B standard, with straight-through for different device types and crossover for the same. Power over Ethernet carries data and power over one cable so devices like access points and cameras need no separate outlet.";

const QA: Array<{ q: string; a: string[] }> = [
  {
    q: "What is Ethernet, and who standardized it?",
    a: [
      "Ethernet is a family of networking standards for how devices frame, address, and share a local medium.",
      "It was originally developed at Xerox, then a three-company consortium, and finally standardized by IEEE as Ethernet Version 2.",
    ],
  },
  {
    q: "List the Ethernet speeds from slowest to fastest.",
    a: [
      "10 Mbps (Ethernet), 100 Mbps (Fast Ethernet), 1 Gbps (Gigabit), 10/25/40/100/200/400 Gbps.",
      "Each step increases speed without changing the fundamental frame format.",
    ],
  },
  {
    q: "What is the difference between UTP and STP?",
    a: [
      "UTP (Unshielded Twisted Pair) has two layers of insulation — one around each wire, one around the bundle.",
      "STP (Shielded Twisted Pair) adds a third layer around each pair, giving extra protection against EMI.",
    ],
  },
  {
    q: "What is the difference between Cat 5, Cat 5e, and Cat 6?",
    a: [
      "Cat 5 — 5 twists per inch, supports up to Fast Ethernet.",
      "Cat 5e — pairs are also twisted around each other, reduces crosstalk, supports Gigabit.",
      "Cat 6 — 6 twists per inch with better insulation, supports higher bandwidth.",
    ],
  },
  {
    q: "What are the limits of twisted pair cable?",
    a: [
      "Maximum distance: 100 metres.",
      "Maximum speed: 1 Gbps on standard Cat 5e.",
      "Beyond 100 m the signal attenuates and packets begin to drop.",
    ],
  },
  {
    q: "Single-mode vs multi-mode fiber — which one, when?",
    a: [
      "Single-mode — small core, one ray of light, travels 40–100 km. Used between cities and countries.",
      "Multi-mode — larger core, many rays, shorter distance. Used inside buildings and campuses.",
    ],
  },
  {
    q: "What is a transceiver? Name common types.",
    a: [
      "A transceiver = Transmitter + Receiver. It converts digital signals to light to send over fiber.",
      "SFP (1 Gbps), SFP+ (10 Gbps), QSFP (100 Gbps).",
    ],
  },
  {
    q: "Explain the EIA/TIA-568B standard.",
    a: [
      "It defines the pinout for RJ-45 connectors: pins 1–8 have a fixed colour order (orange-white, orange, green-white, blue, blue-white, green, brown-white, brown).",
      "Only pins 1, 2, 3, and 6 carry data — the Tx and Rx pairs.",
    ],
  },
  {
    q: "Straight-through vs crossover cable — how do you pick?",
    a: [
      "Straight-through for different device types — PC ↔ Switch, Switch ↔ Router.",
      "Crossover for same device types — Switch ↔ Switch, Router ↔ Router.",
      "Auto MDI-X on modern gear makes the distinction optional.",
    ],
  },
  {
    q: "What is PoE, and what problem does it solve?",
    a: [
      "Power over Ethernet sends both data and electrical power over one Ethernet cable.",
      "It removes the need for a separate power outlet near the device — critical for ceiling cameras, wall access points, and VoIP phones.",
    ],
  },
  {
    q: "What are PSE and PD?",
    a: [
      "PSE — Power Sourcing Equipment. It provides power, e.g. a PoE switch.",
      "PD — Powered Device. It receives power, e.g. an IP camera or access point.",
    ],
  },
  {
    q: "Name the PoE standards and their wattages.",
    a: [
      "802.3af — PoE — 15.4 W.",
      "802.3at — PoE+ — 30 W.",
      "802.3bt — PoE++ — 60 W (Type 3) or 90 W (Type 4).",
    ],
  },
  {
    q: "Does PoE ever damage a non-PoE device?",
    a: [
      "No. The PSE sends a small test signal first. Only if the device answers as PoE-aware does the switch supply power.",
      "A laptop plugged into a PoE switch gets data only.",
    ],
  },
  {
    q: "Why is fiber preferred over copper for long distances?",
    a: [
      "Fiber carries light, not electricity, so it is immune to EMI.",
      "It does not attenuate over distance the way copper does — single-mode reaches 40–100 km.",
      "It is also harder to tap, making it inherently more secure.",
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
        Every other answer here is a follow-up you can now handle.
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
  { id: "picker", label: "Cable Picker" },
  { id: "prep", label: "Interview Prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function EthernetCablingSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <div className="eth-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{ETH_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 03 · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Ethernet & Network Cabling
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The standards, the media, and the physical choices that connect
          everything from a 10 Mbps hub to a 400 Gbps backbone — with a
          scenario drill to lock the cable choices in.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Ethernet and cabling sections"
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
        {tab === "picker" && <CablePickerTab />}
        {tab === "prep" && <InterviewPrepTab />}
      </div>
    </div>
  );
}