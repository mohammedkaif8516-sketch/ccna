"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Eye,
  Filter,
  Gauge,
  GitBranch,
  Layers,
  Lightbulb,
  MessageCircleQuestion,
  Network,
  Radio,
  Route,
  Router as RouterIcon,
  Send,
  ShieldCheck,
  Shuffle,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   Network Devices & Traffic Flow — Summary
   Structure: Big Picture · Cheat Sheet · How It Works ·
              Misconceptions · Device Flow (signature) ·
              Interview Prep
   Register as SUMMARY_VIEWS.devices = NetworkDevicesSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const NET_CSS = `
.net-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.net-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .net-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.net-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .net-root .osi-solid{background:hsl(var(--h) 68% 52%)}
@keyframes netFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes netPulse{0%{opacity:.35}50%{opacity:1}100%{opacity:.35}}
.net-root .osi-fade{animation:netFade .22s ease-out both}
.net-root .net-pulse{animation:netPulse 1.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.net-root .osi-fade,.net-root .net-pulse{animation:none}}
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

/** Short device cards used by Big Picture + Cheat Sheet. */
const DEVICES = [
  {
    name: "Hub",
    layer: 1,
    hue: 35,
    icon: Boxes,
    lookup: "Nothing",
    duplex: "Half",
    domains: "1 broadcast · 1 collision (all ports)",
    stillUsed: "No — legacy lab gear only",
  },
  {
    name: "Switch (L2)",
    layer: 2,
    hue: 150,
    icon: Network,
    lookup: "Destination MAC",
    duplex: "Full per port",
    domains: "1 broadcast · 1 collision per port",
    stillUsed: "Everywhere",
  },
  {
    name: "Switch (L3 / MLS)",
    layer: 3,
    hue: 185,
    icon: Layers,
    lookup: "MAC + IP (routing on)",
    duplex: "Full per port",
    domains: "Like L2 + routing between VLANs",
    stillUsed: "Enterprise core / distribution",
  },
  {
    name: "Router",
    layer: 3,
    hue: 215,
    icon: RouterIcon,
    lookup: "Destination IP",
    duplex: "Full per port",
    domains: "1 broadcast · 1 collision per port",
    stillUsed: "Everywhere — edge and core",
  },
];

const DEVICE_TABLE = DEVICES.map((d) => ({
  name: d.name,
  layer: `L${d.layer}`,
  lookup: d.lookup,
  domains: d.domains,
}));

const COMM_TYPES = [
  {
    type: "Unicast",
    hue: 215,
    icon: Send,
    one: "One-to-one",
    example: "A PC talking to a web server.",
  },
  {
    type: "Multicast",
    hue: 150,
    icon: Users,
    one: "One-to-group",
    example: "A video stream to subscribers. Used in IPv6 where broadcast was removed.",
  },
  {
    type: "Broadcast",
    hue: 335,
    icon: Radio,
    one: "One-to-all",
    example: "ARP request on an IPv4 LAN. Removed in IPv6.",
  },
  {
    type: "Anycast",
    hue: 255,
    icon: Target,
    one: "One-to-nearest",
    example: "DNS root servers, CDNs. Routed to the closest instance.",
  },
];

// ─────────────────────────────────────────────────────────────
// Tab · Big Picture
// ─────────────────────────────────────────────────────────────

function BigPictureTab() {
  return (
    <div className="space-y-6">
      <div style={hue(215)} className="osi-tint rounded-xl border px-3.5 py-3.5">
        <p className="osi-ink text-xs font-semibold">
          One question defines every device
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          When a frame or packet arrives, what does the device <em>look at</em>{" "}
          before deciding where to send it? That single question separates
          hubs, switches, and routers cleanly. Everything else — tables,
          domains, duplex — falls out of the answer.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          return (
            <div
              key={d.name}
              style={hue(d.hue)}
              className="osi-tint rounded-xl border px-3.5 py-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="osi-solid flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="osi-ink text-sm font-semibold">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Layer {d.layer}
                  </p>
                </div>
              </div>
              <dl className="mt-3 space-y-1.5 text-[11px]">
                {[
                  ["Looks at", d.lookup],
                  ["Duplex", d.duplex],
                  ["Domains", d.domains],
                  ["Still used", d.stillUsed],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[68px_1fr] gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 break-words font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <div style={hue(150)} className="osi-tint rounded-xl border px-3.5 py-3.5">
        <p className="osi-ink text-xs font-semibold">
          Why hubs died and switches won
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          A hub repeats every bit out of every other port, so every device on
          the hub shares one collision domain — only one device can talk at a
          time. A switch learns which MAC is on which port and forwards frames
          only where they need to go. Each port becomes its own collision
          domain, so many devices can transmit at once.
        </p>
      </div>

      <Callout icon={Lightbulb}>
        Read any device claim and ask: which header does it read? The layer
        and the behaviour follow automatically.
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
        <Label>Device comparison</Label>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Device</th>
                <th className="px-3 py-2 font-medium">Layer</th>
                <th className="px-3 py-2 font-medium">Looks at</th>
                <th className="px-3 py-2 font-medium">Domains</th>
              </tr>
            </thead>
            <tbody>
              {DEVICE_TABLE.map((d) => (
                <tr key={d.name} className="border-t">
                  <td className="px-3 py-2 font-medium">{d.name}</td>
                  <td className="px-3 py-2 font-mono">{d.layer}</td>
                  <td className="px-3 py-2">{d.lookup}</td>
                  <td className="px-3 py-2 text-muted-foreground">{d.domains}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Communication types</Label>
          <div className="overflow-hidden rounded-xl border bg-card">
            {COMM_TYPES.map((c, i, arr) => (
              <div
                key={c.type}
                className={cx(
                  "grid grid-cols-[90px_1fr] items-center gap-3 px-3.5 py-2.5",
                  i !== arr.length - 1 && "border-b",
                )}
              >
                <span className="text-sm font-semibold">{c.type}</span>
                <span className="text-xs text-muted-foreground">
                  {c.one}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            IPv6 has no broadcast. It uses multicast and adds anycast.
          </p>
        </div>

        <div>
          <Label>Switch CAM table — what it stores</Label>
          <div className="rounded-xl border bg-card p-3 text-sm">
            <ul className="space-y-1.5">
              {[
                "MAC address",
                "Switch port",
                "Static or dynamic learning",
                "VLAN / WLAN",
              ].map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <CircuitBoard className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Same table, two names: MAC table / CAM table.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div style={hue(290)} className="osi-tint rounded-xl border px-3.5 py-3">
          <p className="osi-ink text-xs font-semibold">Manageable switches</p>
          <Bullets
            items={[
              "Console port present — configurable and monitorable",
              "Runs VLANs, STP tuning, port security, SNMP",
              "Enterprise / data-center environments",
              "Higher price",
            ]}
          />
        </div>
        <div style={hue(35)} className="osi-tint rounded-xl border px-3.5 py-3">
          <p className="osi-ink text-xs font-semibold">Non-manageable switches</p>
          <Bullets
            items={[
              "No console port — plug and play",
              "Just forwards frames — no configuration",
              "Home / small office environments",
              "Lowest price",
            ]}
          />
        </div>
      </div>

      <div>
        <Label>Small things worth remembering</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { icon: Shuffle, t: "CSMA/CD", d: "Wired: listen before sending, detect collisions." },
            { icon: Radio, t: "CSMA/CA", d: "Wireless: listen, then avoid the collision." },
            { icon: GitBranch, t: "STP", d: "Enabled by default. Blocks redundant ports to stop loops." },
            { icon: Cpu, t: "ASIC", d: "Hardware chip that forwards frames at line rate inside a switch." },
            { icon: ShieldCheck, t: "Error checking", d: "Each switch port has buffer memory and checks frame headers." },
            { icon: Eye, t: "Observation", d: "A switch is fundamentally an observer — every frame teaches it." },
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

      <Callout icon={Layers}>
        If you can say one sentence per row of the device table and one per
        communication type, you own Topic 04.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · How It Works (step-by-step)
// ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    title: "A frame arrives on a port",
    hue: 150,
    text: "The switch receives an Ethernet frame on one of its ports. The frame carries source MAC, destination MAC, and a payload.",
  },
  {
    title: "The switch learns the source",
    hue: 185,
    text: "It reads the source MAC and the port it arrived on and writes them into the CAM table. Next time it knows where that MAC lives.",
  },
  {
    title: "It looks up the destination",
    hue: 255,
    text: "It searches the CAM table for the destination MAC. Three outcomes: known → forward out one port; unknown → flood; broadcast → flood.",
  },
  {
    title: "If the port is a router, L3 begins",
    hue: 215,
    text: "When the frame reaches a router, its header is stripped and the packet's destination IP is looked up in the routing table.",
  },
  {
    title: "Router picks the best path",
    hue: 290,
    text: "Longest-prefix match wins. The router forwards out the chosen interface, rewrites the Layer 2 header for the next hop, and drops the TTL by one.",
  },
  {
    title: "STP keeps it from looping",
    hue: 335,
    text: "If a switch detects a redundant path, STP blocks one port so frames do not loop forever. Loops would otherwise eat all the bandwidth.",
  },
];

function HowItWorksTab() {
  const [step, setStep] = useState(0);
  const current = HOW_STEPS[step];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Follow one frame from a PC into a switch and then out through a
        router. Use Next / Previous or click any step below.
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
    wrong: "A hub and a switch do basically the same thing.",
    right:
      "A hub repeats every bit out of every other port (1 collision domain). A switch forwards based on MAC and gives each port its own collision domain.",
  },
  {
    wrong: "Switches break up broadcast domains.",
    right:
      "Switches do NOT break broadcast domains — every port is in the same one. Only routers (or VLANs on an L3 switch) split broadcast domains.",
  },
  {
    wrong: "A switch stores IP addresses.",
    right:
      "The CAM table stores MAC addresses, not IPs. IP information belongs to Layer 3 devices.",
  },
  {
    wrong: "Hubs have error checking.",
    right:
      "Hubs have no error checking. They forward corrupted frames too. Switches check headers using per-port buffer memory.",
  },
  {
    wrong: "STP is optional and usually off.",
    right:
      "STP is enabled by default on switches. You have to disable it explicitly — and you rarely should.",
  },
  {
    wrong: "An L3 switch routes out of the box.",
    right:
      "Routing is disabled by default on an L3 / MLS switch. You have to enable it per interface or per VLAN.",
  },
  {
    wrong: "Anycast is another word for multicast.",
    right:
      "Multicast = one-to-group (everyone who joined receives). Anycast = one-to-nearest (only the closest instance receives).",
  },
  {
    wrong: "IPv6 still uses broadcast.",
    right:
      "IPv6 removed broadcast entirely. It uses multicast for the same purpose and added anycast as a new delivery type.",
  },
  {
    wrong: "The router reads the MAC to decide where to send a packet.",
    right:
      "The router reads the destination IP and consults its routing table. It does use the MAC of the next hop to rewrite the new frame, but the decision is IP-based.",
  },
  {
    wrong: "Every router port shares one broadcast domain.",
    right:
      "Each router port is its own broadcast domain and its own collision domain. That is why routers stop broadcasts.",
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
        If you can explain all ten of these in your own words, you understand
        the traffic-flow half of Topic 04 — not just the device names.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Device Flow (signature)
// ─────────────────────────────────────────────────────────────

type FlowScenario = {
  title: string;
  device: "hub" | "switch" | "router";
  source: string;
  destination: string;
  path: string[];
  steps: string[];
  domainNote: string;
};

const FLOW_SCENARIOS: FlowScenario[] = [
  {
    title: "PC-A → PC-C on a hub",
    device: "hub",
    source: "PC-A",
    destination: "PC-C",
    path: ["PC-A", "Hub", "PC-B", "PC-C", "PC-D"],
    steps: [
      "PC-A checks the medium is free (CSMA/CD) and sends the frame.",
      "The hub repeats the signal out of every other port — PC-B, PC-C, PC-D.",
      "PC-B and PC-D read the destination MAC, see it is not theirs, and discard.",
      "PC-C sees its own MAC and accepts the frame.",
      "Bandwidth is shared: while PC-A was talking, no one else could.",
    ],
    domainNote: "All 4 PCs share 1 collision domain. Broadcast reaches every PC — they just drop it if it is not theirs.",
  },
  {
    title: "PC-A → PC-C on a switch",
    device: "switch",
    source: "PC-A",
    destination: "PC-C",
    path: ["PC-A", "Switch", "PC-C"],
    steps: [
      "Switch receives the frame on PC-A's port.",
      "It learns: 'PC-A's MAC is on port 1' → writes to CAM table.",
      "It looks up PC-C's MAC. If known, it forwards only out PC-C's port.",
      "If the destination MAC is unknown, it floods — but the moment PC-C replies, the table is complete.",
      "PC-B and PC-D never see the frame. Their ports stay quiet.",
    ],
    domainNote: "4 separate collision domains — each port is independent. Still 1 shared broadcast domain.",
  },
  {
    title: "PC-A → Server on another network (via router)",
    device: "router",
    source: "PC-A",
    destination: "Server",
    path: ["PC-A", "Switch", "Router", "Switch", "Server"],
    steps: [
      "PC-A sees the server is on a different network and sends the frame to the default gateway (the router).",
      "Destination MAC is the router's interface, not the server's — PC-A uses ARP to learn it.",
      "The router strips the frame, reads the packet's destination IP.",
      "It consults its routing table, picks the best path, and rebuilds the frame with a new source/destination MAC.",
      "The packet's IP addresses never change. Only the MACs do — one frame per hop.",
    ],
    domainNote: "The router has 1 broadcast domain and 1 collision domain per interface. Broadcasts stop at the router.",
  },
];

const DEVICE_LABEL = {
  hub: { name: "Hub", hue: 35, icon: Boxes },
  switch: { name: "Switch", hue: 150, icon: Network },
  router: { name: "Router", hue: 215, icon: RouterIcon },
};

function FlowTab() {
  const [i, setI] = useState(0);
  const s = FLOW_SCENARIOS[i];
  const DeviceIcon = DEVICE_LABEL[s.device].icon;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Same source, same destination, three different devices in the middle.
        Watch how hub, switch, and router each handle the exact same frame —
        that is the whole point of Topic 04.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {FLOW_SCENARIOS.map((f, idx) => {
          const d = DEVICE_LABEL[f.device];
          const active = idx === i;
          return (
            <button
              key={f.title}
              type="button"
              onClick={() => setI(idx)}
              style={hue(d.hue)}
              className={cx(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                active
                  ? "osi-tint font-medium"
                  : "bg-card hover:bg-[var(--accent-soft)]",
              )}
            >
              <d.icon className="size-3.5" />
              {d.name}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <span
            style={hue(DEVICE_LABEL[s.device].hue)}
            className="osi-solid flex size-8 shrink-0 items-center justify-center rounded-lg"
          >
            <DeviceIcon className="size-4" />
          </span>
          <p className="text-sm font-semibold">{s.title}</p>
        </div>

        {/* Path visualization */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {s.path.map((node, idx) => {
            const isEndpoint = idx === 0 || idx === s.path.length - 1;
            const isMiddleDevice =
              !isEndpoint &&
              (node === "Hub" || node === "Switch" || node === "Router");
            const nodeHue =
              node === "Hub"
                ? 35
                : node === "Switch"
                  ? 150
                  : node === "Router"
                    ? 215
                    : 200;
            return (
              <span key={`${node}-${idx}`} className="flex items-center gap-1.5">
                <span
                  style={hue(nodeHue)}
                  className={cx(
                    "rounded-md border px-2 py-1 text-[11px] font-medium",
                    isMiddleDevice ? "osi-tint" : "bg-muted/60",
                  )}
                >
                  {node}
                </span>
                {idx < s.path.length - 1 && (
                  <ChevronRight className="size-3 text-muted-foreground" />
                )}
              </span>
            );
          })}
        </div>

        <div className="space-y-1.5">
          {s.steps.map((step, idx) => (
            <div
              key={step}
              className="flex items-start gap-2.5 rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent)]">
                {idx + 1}
              </span>
              <span className="min-w-0 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>

        <div
          style={hue(DEVICE_LABEL[s.device].hue)}
          className="osi-tint mt-4 rounded-xl border px-3.5 py-2.5"
        >
          <p className="osi-ink text-[11px] font-semibold uppercase tracking-wide">
            Domains at a glance
          </p>
          <p className="mt-1 text-sm leading-relaxed">{s.domainNote}</p>
        </div>
      </div>

      <Callout icon={Lightbulb}>
        Rule of thumb: <strong>hub repeats</strong>, <strong>switch
        forwards</strong>, <strong>router routes</strong>. Each one sees more
        of the packet than the previous.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Interview Prep
// ─────────────────────────────────────────────────────────────

const PITCH =
  "Network devices are classified by which header they read before deciding where to send traffic. A hub is Layer 1 — it repeats every bit out of every other port, uses half-duplex, and puts every device in one collision domain. A switch is Layer 2 — it learns source MACs into a CAM table, forwards known destinations out one port, and gives each port its own collision domain. An L3 switch, or MLS, adds IP-based routing on top and has routing disabled by default. A router is Layer 3 — it reads the destination IP, consults its routing table, and forwards between networks. Each router interface is its own broadcast and collision domain. Spanning Tree Protocol prevents Layer 2 loops. And communication types describe how many receivers process a transmission: unicast, multicast, broadcast, and anycast.";

const QA: Array<{ q: string; a: string[] }> = [
  {
    q: "What layer is a hub, and how does it forward traffic?",
    a: [
      "Layer 1 (Physical). It has no table and cannot make decisions.",
      "It repeats every incoming signal out of every other port.",
      "Operates half-duplex. All ports share one collision domain and one broadcast domain.",
    ],
  },
  {
    q: "Why are hubs no longer used?",
    a: [
      "Every device shares one collision domain, so only one device can transmit at a time.",
      "They have no error checking — corrupted frames get forwarded.",
      "Without STP, closed loops become infinite loops that consume all bandwidth.",
    ],
  },
  {
    q: "What is CSMA/CD, and where does it apply?",
    a: [
      "Carrier Sense Multiple Access / Collision Detection — the wired medium-access rule.",
      "A device listens first. If two devices talk at once, a collision happens and both back off.",
      "CSMA/CA (Collision Avoidance) is the wireless equivalent, because wireless cannot easily detect collisions.",
    ],
  },
  {
    q: "What does a switch look at when it forwards a frame?",
    a: [
      "The destination MAC address in the Ethernet header.",
      "It learns the source MAC into its CAM table.",
      "Known destination → unicast out one port. Unknown or broadcast → flood out all ports except the incoming one.",
    ],
  },
  {
    q: "What is stored in a CAM table?",
    a: [
      "MAC address, switch port, static or dynamic learning, VLAN / WLAN.",
      "MAC table and CAM table are the same thing — CAM is the type of memory the switch uses.",
    ],
  },
  {
    q: "Manageable vs non-manageable switches?",
    a: [
      "Non-manageable — no console port, no configuration, basic forwarding, home / SOHO.",
      "Manageable — console port, VLANs, STP tuning, port security, SNMP, enterprise / data-center.",
    ],
  },
  {
    q: "L2 switch vs L3 switch (MLS) — what changes?",
    a: [
      "An L2 switch forwards frames using the MAC table only.",
      "An L3 switch (Multi-Layer Switch) also checks the L3 header and routes using a routing table.",
      "Routing is disabled by default on an L3 switch — you enable it per interface or per VLAN.",
    ],
  },
  {
    q: "What is an ASIC and why does it matter?",
    a: [
      "Application-Specific Integrated Circuit — a dedicated hardware chip in a switch.",
      "It performs packet forwarding in hardware at line rate, so the switch can handle huge traffic volumes without slowing down.",
    ],
  },
  {
    q: "How does a router decide where to forward a packet?",
    a: [
      "It reads the destination IP in the packet header.",
      "It consults its routing table — connected, static, or learned via a routing protocol.",
      "The best (longest-prefix) match wins, and the packet is forwarded out that interface.",
    ],
  },
  {
    q: "Broadcast vs collision domains — who splits what?",
    a: [
      "A switch splits collision domains (one per port) but keeps one shared broadcast domain.",
      "A router splits both: every interface is its own broadcast and collision domain.",
      "That is why routers stop broadcasts and switches do not.",
    ],
  },
  {
    q: "What does Spanning Tree Protocol do?",
    a: [
      "Prevents Layer 2 loops by detecting redundant paths and blocking one of the ports.",
      "Enabled by default on switches.",
      "Without STP, a closed loop becomes an infinite loop that eats all bandwidth.",
    ],
  },
  {
    q: "Explain unicast, multicast, broadcast, anycast.",
    a: [
      "Unicast — one-to-one.",
      "Multicast — one-to-group. Only members of the group process it.",
      "Broadcast — one-to-all on the local segment.",
      "Anycast — one-to-nearest. Multiple hosts share the same address; the routing fabric delivers to the closest one.",
    ],
  },
  {
    q: "Why does IPv6 remove broadcast?",
    a: [
      "Broadcasts wake every host on the segment, which is wasteful at IPv6 scale.",
      "Multicast delivers the same intent but only to interested hosts.",
      "IPv6 also formalized anycast as a standard delivery type.",
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
  { id: "flow", label: "Device Flow" },
  { id: "prep", label: "Interview Prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function NetworkDevicesSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <div className="net-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{NET_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 04 · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Network Devices & Traffic Flow
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Hubs, switches, and routers — what each one looks at, how it
          forwards, and how the same frame travels through each of them.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Network devices sections"
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
        {tab === "flow" && <FlowTab />}
        {tab === "prep" && <InterviewPrepTab />}
      </div>
    </div>
  );
}