"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  ChevronRight,
  CircleDot,
  Clock,
  Flag,
  Gauge,
  GitBranch,
  Globe,
  Hash,
  Layers,
  Lightbulb,
  Lock,
  MapPin,
  MessageCircleQuestion,
  Network,
  Radio,
  Route as RouteIcon,
  Router as RouterIcon,
  Send,
  ShieldCheck,
  Split,
  Table2,
  Terminal,
  Timer,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   Routing — Summary
   Structure per group: Big Picture · Cheat Sheet · How It Works ·
                        Misconceptions · Signature · Interview Prep
   Groups: Basics · Static & Default · Dynamic & RIP ·
           EIGRP · OSPF · Redistribution · OSPF Advanced
   Register as SUMMARY_VIEWS.routing = RoutingSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const RT_CSS = `
.rt-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.rt-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .rt-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.rt-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .rt-root .osi-solid{background:hsl(var(--h) 68% 52%)}
.rt-root .rt-prompt{background:#0d1117;color:#7ee787;border-color:#30363d}
.dark .rt-root .rt-prompt{background:#050810;color:#7ee787}
@keyframes rtFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.rt-root .osi-fade{animation:rtFade .22s ease-out both}
@media (prefers-reduced-motion:reduce){.rt-root .osi-fade{animation:none}}
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

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="rt-prompt overflow-x-auto rounded-xl border px-3.5 py-3 font-mono text-[11px] leading-5">
      <code>{children}</code>
    </pre>
  );
}

// ─────────────────────────────────────────────────────────────
// Big-Picture / Cheat-Sheet helpers (shared across groups)
// ─────────────────────────────────────────────────────────────

function BigBlock({
  title,
  hue: h,
  children,
}: {
  title: string;
  hue: number;
  children: ReactNode;
}) {
  return (
    <div style={hue(h)} className="osi-tint rounded-xl border px-3.5 py-3.5">
      <p className="osi-ink text-xs font-semibold">{title}</p>
      <div className="mt-1.5 space-y-2">{children}</div>
    </div>
  );
}

function KVGrid({
  items,
}: {
  items: Array<[string, string]>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg border bg-card px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {k}
          </p>
          <p className="mt-0.5 break-words font-mono text-xs font-medium">
            {v}
          </p>
        </div>
      ))}
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
  minWidth = 480,
}: {
  headers: string[];
  rows: string[][];
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table
        className="w-full text-left text-xs"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MisconceptionList({
  items,
}: {
  items: Array<{ wrong: string; right: string }>;
}) {
  return (
    <div className="space-y-2">
      {items.map((m, i) => (
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
  );
}

function QaList({ items }: { items: Array<{ q: string; a: string[] }> }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
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
  );
}

function GroupShell({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <header className="flex items-start gap-3 border-l-2 border-[var(--accent)] pl-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </p>
          <h2 className="text-lg font-semibold tracking-tight">{subtitle}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function SubHead({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 mt-1 text-sm font-semibold tracking-tight">
      {children}
    </h3>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 1 · Routing Basics
// ═════════════════════════════════════════════════════════════

function BasicsGroup() {
  return (
    <GroupShell
      title="Group 1"
      subtitle="Routing Basics & Static Routing"
      icon={RouteIcon}
    >
      <BigBlock title="Big Picture — how a router decides" hue={215}>
        <p className="text-sm leading-relaxed">
          A router forwards traffic from one network to another using its{" "}
          <strong>routing table</strong>. The table holds the best-known path
          to every reachable destination. Two kinds of entries matter:
        </p>
        <Bullets
          items={[
            "Known (Connected, C) — directly attached networks. Free knowledge.",
            "Unknown — everything else. Routes must be added: manually (Static, S) or dynamically (via a routing protocol).",
          ]}
        />
        <p className="text-sm leading-relaxed">
          The table is the router's map. Without an entry, the router drops
          the packet.
        </p>
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>Route codes you will see in the table</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { c: "C", d: "Connected" },
                { c: "S", d: "Static" },
                { c: "R", d: "RIP" },
                { c: "D", d: "EIGRP internal" },
                { c: "EX", d: "EIGRP external" },
                { c: "O", d: "OSPF intra-area" },
                { c: "O IA", d: "OSPF inter-area" },
                { c: "E1/E2", d: "OSPF external" },
              ].map((x) => (
                <div
                  key={x.c}
                  className="rounded-lg border bg-card px-3 py-2"
                >
                  <p className="font-mono text-sm font-semibold">{x.c}</p>
                  <p className="text-[10px] text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Static route syntax</Label>
            <CodeBlock>
              {`(conf)# ip route <network> <mask> <next-hop>
(conf)# ip route 192.168.2.0 255.255.255.0 192.168.4.2`}
            </CodeBlock>
          </div>

          <div>
            <Label>Static vs Dynamic at a glance</Label>
            <SimpleTable
              headers={["Aspect", "Static", "Dynamic"]}
              rows={[
                ["Config effort", "Per router, per network", "Once per router"],
                ["CPU load", "Minimal", "Higher"],
                ["Bandwidth", "None", "Used for updates"],
                ["Fault tolerance", "None", "Automatic"],
                ["Control", "Total", "Protocol decides"],
                ["Fits", "Small / stable", "Large / changing"],
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — a static route in 5 steps</SubHead>
        <Bullets
          items={[
            "Router powers up. Only its own connected networks appear in the table as C.",
            "Anything not connected is unknown — pings to it fail.",
            "Admin runs `ip route <network> <mask> <next-hop>` for each unknown network.",
            "Table entry appears as S. Router now knows the next hop toward that network.",
            "Every downstream router needs the same treatment — static routing does not propagate.",
          ]}
        />
        <Callout>
          Static routing is a chain of manual instructions. Every router has to
          know its part of the story.
        </Callout>
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "A router automatically knows every network.",
              right:
                "It only knows directly connected networks until you add static or dynamic routes.",
            },
            {
              wrong: "One static route is enough for the whole network.",
              right:
                "Every router between the source and destination needs its own route. Statics don't propagate.",
            },
            {
              wrong: "Static routing is 'old' — dynamic is always better.",
              right:
                "Static is preferred for small stable networks, default routes, and security-sensitive paths.",
            },
            {
              wrong: "Any next-hop IP works in a static route.",
              right:
                "The next-hop must be reachable — usually on a directly connected subnet — or the router can't forward to it.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: 3-router worked example</SubHead>
        <p className="mb-3 text-sm text-muted-foreground">
          Classic R1–R2–R3 topology. Fill the gap manually, then check.
        </p>
        <CodeBlock>
          {`R1 — f0/0 → 192.168.1.0/24 (LAN1)
     f0/1 → 192.168.6.0/24 (LAN6)
     f0/2 → 192.168.4.0/24 (to R2)

To reach: R1 needs statics for 192.168.2.0, .3.0, .5.0, .7.0
          all via 192.168.4.2

R2 needs statics for 192.168.1.0, .3.0, .6.0, .7.0
          .1.0 / .6.0 via 192.168.4.1
          .3.0 / .7.0 via 192.168.5.2`}
        </CodeBlock>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "What is a routing table?",
              a: [
                "A database of the best paths to every reachable destination network.",
                "Populated from connected interfaces, static routes, and dynamic protocols.",
                "Forwarding decisions are made by consulting this table.",
              ],
            },
            {
              q: "Connected vs unknown networks?",
              a: [
                "Connected — directly attached; the router knows them automatically (code C).",
                "Unknown — not directly attached; routes must be added manually (S) or learned dynamically.",
              ],
            },
            {
              q: "When would you prefer static routing?",
              a: [
                "Small, stable networks. Default routes toward an ISP. Security-sensitive paths where you want deterministic forwarding.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 2 · Static & Default Routing
// ═════════════════════════════════════════════════════════════

function StaticGroup() {
  const adRows = [
    ["Connected", "0"],
    ["Static", "1"],
    ["Default", "1"],
    ["EIGRP Summary", "5"],
    ["EBGP", "20"],
    ["EIGRP Internal", "90"],
    ["OSPF", "110"],
    ["RIP", "120"],
    ["EIGRP External", "170"],
    ["IBGP", "200"],
  ];

  return (
    <GroupShell
      title="Group 2"
      subtitle="Administrative Distance, Floating Statics, Default Routing"
      icon={Split}
    >
      <BigBlock title="Big Picture — how a router picks the best route" hue={215}>
        <p className="text-sm leading-relaxed">
          When multiple routes reach the same destination, the router applies
          three tie-breakers in order. This is the single most important
          concept in the topic.
        </p>
        <Bullets
          items={[
            "1. Longest prefix match — the more specific route wins, always.",
            "2. Lowest metric — among routes from the same protocol, lower is better.",
            "3. Lowest Administrative Distance (AD) — between protocols, lower AD means more trustworthy.",
          ]}
        />
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>Default Administrative Distances</Label>
            <SimpleTable
              headers={["Route source", "AD"]}
              rows={adRows}
              minWidth={280}
            />
          </div>

          <div>
            <Label>Advanced statics</Label>
            <KVGrid
              items={[
                ["Floating static", "ip route ... <next-hop> <higher-AD>"],
                ["Null0 route", "ip route <net> <mask> null0"],
                ["Default route", "ip route 0.0.0.0 0.0.0.0 <next-hop>"],
                ["Default AD", "1 (same as static)"],
                ["Load balancing", "Equal-cost, automatic"],
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — the 4 selection scenarios</SubHead>
        <Bullets
          items={[
            "Scenario 1 — static to /24 and static to /25, ping .30.1 → /25 wins. Longest prefix beats AD.",
            "Scenario 2 — same routes, ping .30.254 → /24 wins, because .30.254 isn't inside the /25.",
            "Scenario 3 — two EIGRP routes to same /24, metrics 1000 vs 2000 → lower metric wins.",
            "Scenario 4 — EIGRP (AD 90) vs OSPF (AD 110) vs Static (AD 1) → Static wins. Lowest AD.",
            "Two statics to the same /24 with same AD → load-balanced across both.",
          ]}
        />
        <Callout icon={RouteIcon}>
          Remember: prefix first, metric second, AD third. Prefix always wins.
        </Callout>
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "Lower AD always wins.",
              right:
                "Only among routes of equal prefix length. Longest prefix beats everything else first.",
            },
            {
              wrong: "Floating static routes use a different command.",
              right:
                "Same `ip route` command, just an extra AD value at the end. Higher AD = less preferred = backup.",
            },
            {
              wrong: "Null0 routes drop all traffic to the router.",
              right:
                "Only traffic for the specified network is discarded. Everything else flows normally.",
            },
            {
              wrong: "Default routes override specific routes.",
              right:
                "Specific routes always win. The default route is only used when nothing else matches.",
            },
            {
              wrong: "Two static routes to the same destination = one wins, one fails.",
              right:
                "Same AD = equal-cost = load-balanced across both, unless one has a higher AD (floating static).",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: AD scenario drill</SubHead>
        <p className="mb-3 text-sm text-muted-foreground">
          Read each scenario, pick the winning route, then check.
        </p>
        <div className="space-y-3">
          {[
            {
              q: "Static /24 via R2 and Static /25 via R4 — which wins for 192.168.30.1?",
              a: "/25 wins. Longest prefix match.",
            },
            {
              q: "Same routes — which wins for 192.168.30.254?",
              a: "/24 wins. .254 isn't inside the /25 range.",
            },
            {
              q: "EIGRP metric 1000 vs EIGRP metric 2000, same /24. Which wins?",
              a: "Metric 1000. Same protocol, same AD, so lower metric wins.",
            },
            {
              q: "EIGRP (90), OSPF (110), Static (1) — all same /24. Which wins?",
              a: "Static. Lowest AD wins between protocols.",
            },
            {
              q: "Two statics to the same /24, both AD 1. What happens?",
              a: "The router load-balances across both paths.",
            },
          ].map((s, i) => (
            <details
              key={i}
              className="group rounded-xl border bg-card px-3.5 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  {i + 1}. {s.q}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed">
                {s.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "What is Administrative Distance?",
              a: [
                "A trust rating between routing sources. Lower is more trusted.",
                "Only used to break ties when prefix and metric are equal.",
              ],
            },
            {
              q: "How does the router choose between two routes to the same network?",
              a: [
                "1. Longest prefix match.",
                "2. Lowest metric.",
                "3. Lowest Administrative Distance.",
              ],
            },
            {
              q: "What is a floating static route?",
              a: [
                "A static route configured with a higher AD than the primary route, so it is only used if the primary fails.",
                "This is how you build primary/backup paths with static routing.",
              ],
            },
            {
              q: "What is a Null0 route for?",
              a: [
                "Discarding traffic to a specific network — a controlled blackhole.",
                "Common in summarization to prevent loops.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 3 · Dynamic & RIP
// ═════════════════════════════════════════════════════════════

function RipGroup() {
  const [timerStep, setTimerStep] = useState(0);

  const TIMER_STEPS = [
    {
      t: "Update (30 s)",
      h: 215,
      text: "Router sends the full routing table to its neighbors.",
    },
    {
      t: "Invalid (180 s)",
      h: 185,
      text: "No update heard for a route — its metric becomes 16 (unreachable), and the route enters hold-down.",
    },
    {
      t: "Hold-down (180 s)",
      h: 290,
      text: "RIP refuses new information about the route during this window.",
    },
    {
      t: "Flush (240 s)",
      h: 335,
      text: "Route is fully removed from the table.",
    },
  ];

  return (
    <GroupShell
      title="Group 3"
      subtitle="Dynamic Routing & RIP"
      icon={Radio}
    >
      <BigBlock title="Big Picture — IGP vs EGP, and where RIP fits" hue={215}>
        <p className="text-sm leading-relaxed">
          Dynamic protocols fall into two families by <strong>scope</strong>:
        </p>
        <Bullets
          items={[
            "IGP — Interior Gateway Protocol — routes inside one organization. Examples: RIP, EIGRP, OSPF.",
            "EGP — Exterior Gateway Protocol — routes between organizations. Example: BGP.",
          ]}
        />
        <p className="text-sm leading-relaxed">
          Within IGPs, they differ by algorithm:
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { n: "RIP", t: "Distance Vector", h: 150 },
            { n: "EIGRP", t: "Hybrid", h: 290 },
            { n: "OSPF", t: "Link State", h: 215 },
            { n: "BGP", t: "Path Vector (EGP)", h: 335 },
          ].map((x) => (
            <div
              key={x.n}
              style={hue(x.h)}
              className="osi-tint rounded-lg border px-3 py-2"
            >
              <p className="osi-ink text-sm font-semibold">{x.n}</p>
              <p className="text-[10px] text-muted-foreground">{x.t}</p>
            </div>
          ))}
        </div>
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>RIP facts to memorize</Label>
            <KVGrid
              items={[
                ["Metric", "Hop count"],
                ["Algorithm", "Bellman-Ford"],
                ["Max hops", "15 (16 = unreachable)"],
                ["Update interval", "30 s"],
                ["Transport", "UDP port 520"],
                ["AD", "120"],
                ["Load balancing", "Equal-cost (default on)"],
              ]}
            />
          </div>

          <div>
            <Label>RIPv1 vs RIPv2</Label>
            <SimpleTable
              headers={["Feature", "RIPv1", "RIPv2"]}
              rows={[
                ["Addressing", "Classful", "Classless"],
                ["VLSM / FLSM", "Not supported", "Supported"],
                ["Updates", "Broadcast (255.255.255.255)", "Multicast (224.0.0.9)"],
                ["Authentication", "No", "Yes"],
              ]}
            />
          </div>

          <div>
            <Label>RIP timers</Label>
            <SimpleTable
              headers={["Timer", "Default", "What it does"]}
              rows={[
                ["Update", "30 s", "How often updates are sent"],
                ["Invalid", "180 s", "When to mark route as unreachable (16)"],
                ["Hold-down", "180 s", "How long to reject new info about a route"],
                ["Flush", "240 s", "When to fully remove the route"],
              ]}
            />
          </div>

          <div>
            <Label>Key commands</Label>
            <CodeBlock>
              {`(conf)# router rip
(conf-router)# version 2
               network 192.168.1.0
               no auto-summary
               passive-interface default
               no passive-interface f0/0
               timers basic 5 15 20 30`}
            </CodeBlock>
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — RIP timer lifecycle</SubHead>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {timerStep + 1} of {TIMER_STEPS.length}
            </span>
            <span>{TIMER_STEPS[timerStep].t}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{
                width: `${((timerStep + 1) / TIMER_STEPS.length) * 100}%`,
              }}
            />
          </div>
          <div
            style={hue(TIMER_STEPS[timerStep].h)}
            className="osi-tint osi-fade mt-4 rounded-xl border px-3.5 py-3.5"
          >
            <p className="osi-ink text-xs font-semibold">
              {TIMER_STEPS[timerStep].t}
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              {TIMER_STEPS[timerStep].text}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTimerStep((s) => Math.max(0, s - 1))}
              disabled={timerStep === 0}
              className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setTimerStep((s) =>
                  Math.min(TIMER_STEPS.length - 1, s + 1),
                )
              }
              disabled={timerStep === TIMER_STEPS.length - 1}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "RIP supports networks of any size.",
              right:
                "RIP caps at 15 hops. Anything 16 hops away is unreachable. Big networks need EIGRP or OSPF.",
            },
            {
              wrong: "RIPv1 supports subnetting.",
              right:
                "RIPv1 is classful only. For VLSM/FLSM you need RIPv2.",
            },
            {
              wrong: "Passive interface stops advertising the network.",
              right:
                "Passive stops SENDING hellos/updates, but the network is still advertised out of other interfaces.",
            },
            {
              wrong: "auto-summary is a good default.",
              right:
                "It summarizes classless networks back to their classful form, which breaks VLSM designs. Disable it on RIPv2.",
            },
            {
              wrong: "Timers can be changed freely per router.",
              right:
                "They must match on every router in the topology, or convergence goes haywire.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: RIP in action</SubHead>
        <p className="mb-3 text-sm text-muted-foreground">
          RIPv1 advertises 3 connected networks as classful. RIPv2 can advertise
          classless /26s. The difference determines whether VLSM works.
        </p>
        <CodeBlock>
          {`RIPv1 — one classful entry per network
  C 192.168.1.0/24  ->  broadcast to 255.255.255.255
  C 192.168.2.0/24  ->  broadcast to 255.255.255.255
  C 192.168.3.0/24  ->  broadcast to 255.255.255.255

RIPv2 — one classless entry per subnet
  C 192.168.1.0/26  ->  multicast to 224.0.0.9
  C 192.168.1.64/26 ->  multicast to 224.0.0.9
  C 192.168.1.128/26 -> multicast to 224.0.0.9`}
        </CodeBlock>
        <Callout>
          Rule: if your network uses subnets or VLSM, you need RIPv2 (or
          anything classless).
        </Callout>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "What is RIP's metric, and what is its hard limit?",
              a: [
                "Hop count — the number of routers a packet must pass through.",
                "15 maximum. A metric of 16 means unreachable.",
              ],
            },
            {
              q: "Why does RIPv2 exist?",
              a: [
                "RIPv1 is classful and can't handle VLSM.",
                "RIPv2 is classless and uses multicast (224.0.0.9) instead of broadcast.",
              ],
            },
            {
              q: "What is the difference between equal-cost and unequal-cost load balancing?",
              a: [
                "Equal-cost — router balances traffic across paths with identical metrics.",
                "Unequal-cost — router balances across paths with different metrics (needs variance in EIGRP).",
              ],
            },
            {
              q: "How do you speed up RIP convergence?",
              a: [
                "Lower the timers — update/invalid/hold-down/flush — but do it consistently on every router, or you get instability.",
              ],
            },
            {
              q: "Why is passive-interface useful?",
              a: [
                "It stops sending routing updates toward end-user LANs where no routers exist.",
                "Reduces bandwidth, increases security.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 4 · EIGRP
// ═════════════════════════════════════════════════════════════

function EigrpGroup() {
  const [seq, setSeq] = useState(0);

  const SEQ = [
    {
      t: "1. Hello exchange",
      h: 215,
      text: "R1 sends multicast Hello to 224.0.0.10. If AS, K-values, and password match, a neighborship forms.",
    },
    {
      t: "2. Neighbor up",
      h: 150,
      text: "Both routers appear in each other's neighbor table. Hello timer = 5 s, Hold-down = 15 s.",
    },
    {
      t: "3. Full update (unicast)",
      h: 185,
      text: "Once neighbors, they exchange full topology — all routes are advertised, via unicast RTP.",
    },
    {
      t: "4. ACK back",
      h: 255,
      text: "Every reliable packet (Update, Reply) gets an ACK. Unicast back to sender.",
    },
    {
      t: "5. DUAL runs",
      h: 290,
      text: "Each router runs the DUAL algorithm. Best path becomes the Successor (S). Backups become Feasible Successors (FS).",
    },
    {
      t: "6. Converged",
      h: 335,
      text: "Topology table contains every route, marked Active (searching) or Passive (stable). Normal state is Passive.",
    },
  ];

  return (
    <GroupShell
      title="Group 4"
      subtitle="EIGRP — Hybrid Routing Protocol"
      icon={GitBranch}
    >
      <BigBlock title="Big Picture — why EIGRP exists" hue={290}>
        <p className="text-sm leading-relaxed">
          EIGRP combines the simplicity of distance-vector (hop count) with the
          intelligence of link-state (bandwidth). That's why it's called{" "}
          <strong>hybrid</strong> or <strong>advanced distance-vector</strong>.
        </p>
        <Bullets
          items={[
            "Cisco-proprietary until 2013 — now an open standard.",
            "Classless: supports VLSM and subnets.",
            "Triggered updates: only sends when topology actually changes.",
            "Uses its own transport protocol (Protocol 88), not TCP or UDP.",
            "Reliable Transport Protocol (RTP) guarantees delivery of important packets.",
            "AS number identifies the autonomous system (16-bit, 1–65536).",
          ]}
        />
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>Key facts</Label>
            <KVGrid
              items={[
                ["Protocol number", "88 (not TCP/UDP)"],
                ["Algorithm", "DUAL"],
                ["Multicast", "224.0.0.10"],
                ["Hello / Hold", "5s / 15s (1:3)"],
                ["AS range", "1 – 65536"],
                ["Hop limit", "255 max (default 100)"],
                ["Load balance", "4 default, 16 max"],
                ["AD internal", "90"],
                ["AD external", "170"],
                ["AD summary", "5"],
              ]}
            />
          </div>

          <div>
            <Label>Route codes</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { c: "D", d: "Internal EIGRP (AD 90)" },
                { c: "EX", d: "External EIGRP (AD 170)" },
                { c: "D*", d: "Candidate default" },
              ].map((x) => (
                <div
                  key={x.c}
                  className="rounded-lg border bg-card px-3 py-2"
                >
                  <p className="font-mono text-sm font-semibold">{x.c}</p>
                  <p className="text-[10px] text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Metric K-values</Label>
            <SimpleTable
              headers={["K", "Parameter", "Default"]}
              rows={[
                ["K1", "Bandwidth", "Enabled (1)"],
                ["K2", "Load", "Disabled (0)"],
                ["K3", "Delay", "Enabled (1)"],
                ["K4", "Reliability", "Disabled (0)"],
                ["K5", "MTU", "Disabled (0)"],
              ]}
            />
            <CodeBlock>
              {`metric = 256 × (BW + delay)      (with default K-values)
BW    = 10^7 / bandwidth(kbps)
delay = delay(µs) / 10`}
            </CodeBlock>
          </div>

          <div>
            <Label>Terminology</Label>
            <SimpleTable
              headers={["Term", "Meaning"]}
              rows={[
                ["Successor (S)", "Best path"],
                ["Feasible Successor (FS)", "Backup path"],
                ["Advertised Distance (AD)", "Metric as advertised by a neighbor"],
                ["Feasible Distance (FD)", "Router's own metric to the destination"],
                ["Feasibility Condition", "FD > AD — the loop-free backup test"],
              ]}
            />
          </div>

          <div>
            <Label>7 packet types</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["Hello", "Update", "Ack", "Query", "Reply", "SIA Query", "SIA Reply"].map(
                (p) => (
                  <Chip key={p}>{p}</Chip>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — neighbor to converged</SubHead>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {seq + 1} of {SEQ.length}
            </span>
            <span>{SEQ[seq].t}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${((seq + 1) / SEQ.length) * 100}%` }}
            />
          </div>
          <div
            style={hue(SEQ[seq].h)}
            className="osi-tint osi-fade mt-4 rounded-xl border px-3.5 py-3.5"
          >
            <p className="osi-ink text-xs font-semibold">{SEQ[seq].t}</p>
            <p className="mt-1 text-sm leading-relaxed">{SEQ[seq].text}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setSeq((s) => Math.max(0, s - 1))}
              disabled={seq === 0}
              className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setSeq((s) => Math.min(SEQ.length - 1, s + 1))}
              disabled={seq === SEQ.length - 1}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "EIGRP uses TCP or UDP for transport.",
              right:
                "EIGRP has its own transport — Protocol 88, running on top of IP directly.",
            },
            {
              wrong: "EIGRP sends periodic updates like RIP.",
              right:
                "EIGRP is triggered-only. It sends updates only when the topology changes.",
            },
            {
              wrong: "The AS number is optional.",
              right:
                "It is mandatory and must match between neighbors, or no adjacency forms.",
            },
            {
              wrong: "Any neighbor can be a Feasible Successor.",
              right:
                "Only if FD > AD — the loop-free condition. Otherwise it can't be used as a backup.",
            },
            {
              wrong: "Null0 routes drop all traffic.",
              right:
                "Only traffic matching that specific route is dropped. Used to prevent loops after summarization.",
            },
            {
              wrong: "Variance works with any metric difference.",
              right:
                "Variance × FD gives the metric ceiling. Only paths at or below that value qualify.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: neighbor + metric + path selection</SubHead>
        <CodeBlock>
          {`Neighborship conditions (all must match):
  L1 connectivity · same subnet · same AS · same password · same K-values

R1 → R2 (same AS 100)  →  neighbors OK
R1 → R3 (AS 100 vs 200) →  no adjacency

Metric formula (default K1=1, K3=1):
  metric = 256 × (10^7 / BW_kbps + delay_µs / 10)

Path selection from R1 to 192.168.40.0/24:
  via R5 — metric 3000  (Successor, best)
  via R2 — metric 4000  (Feasible Successor)
  via R6 — metric 5000  (not used, fails condition)`}
        </CodeBlock>
        <Callout icon={GitBranch}>
          EIGRP's real superpower: it already knows the backup path before the
          primary fails. Convergence is nearly instant when a Feasible
          Successor exists.
        </Callout>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "Why is EIGRP called 'hybrid'?",
              a: [
                "It uses hop count (distance-vector) and bandwidth (link-state) together in its metric.",
                "Hence 'advanced distance-vector' or 'hybrid'.",
              ],
            },
            {
              q: "What is the DUAL algorithm?",
              a: [
                "Diffusing Update Algorithm — EIGRP's path calculation engine.",
                "Picks the Successor (best) and Feasible Successors (loop-free backups).",
              ],
            },
            {
              q: "What is the Feasibility Condition?",
              a: [
                "FD > AD — the router's own distance to a destination must be greater than the neighbor's advertised distance.",
                "It is what guarantees a backup path is loop-free.",
              ],
            },
            {
              q: "What are the EIGRP neighbor conditions?",
              a: [
                "Layer 1 connectivity up.",
                "Same subnet, same AS number, same K-values, same password (if authentication is on).",
              ],
            },
            {
              q: "What is the difference between equal-cost and unequal-cost load balancing?",
              a: [
                "Equal-cost — automatic, across paths with identical metrics.",
                "Unequal-cost — needs variance configured. Formula: metric ≤ variance × FD.",
              ],
            },
            {
              q: "What does stuck-in-active (SIA) mean?",
              a: [
                "The best path failed and no Feasible Successor exists, so the router queries neighbors and waits for a Reply.",
                "If no Reply within 3 × 60 s cycles, the route is removed.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 5 · OSPF Theory
// ═════════════════════════════════════════════════════════════

function OspfGroup() {
  const [state, setState] = useState(0);

  const STATES = [
    {
      s: "Down",
      h: 335,
      text: "No Hellos received. The router doesn't even know the neighbor exists.",
    },
    {
      s: "Init",
      h: 290,
      text: "A Hello arrived, but the neighbor hasn't listed this router in its own Hello yet.",
    },
    {
      s: "Two-Way",
      h: 255,
      text: "Both sides have seen each other in Hellos. DR/BDR election happens here on broadcast networks.",
    },
    {
      s: "ExStart",
      h: 215,
      text: "Master/slave negotiation — who starts the DBD exchange, and at what sequence number.",
    },
    {
      s: "Exchange",
      h: 185,
      text: "DBD packets summarize each LSDB so the other side knows what it needs.",
    },
    {
      s: "Loading",
      h: 150,
      text: "LSR / LSU exchange — each router requests and receives the missing LSAs.",
    },
    {
      s: "Full",
      h: 130,
      text: "LSDBs are identical. Routes can be installed. The adjacency is complete.",
    },
  ];

  return (
    <GroupShell
      title="Group 5"
      subtitle="OSPF — Link-State Routing"
      icon={Network}
    >
      <BigBlock title="Big Picture — how OSPF thinks" hue={215}>
        <p className="text-sm leading-relaxed">
          OSPF is a <strong>link-state</strong> protocol. Where distance-vector
          protocols only know what neighbors tell them, OSPF builds a complete
          map of the topology and runs <strong>Shortest Path First</strong> on
          that map to find the best route.
        </p>
        <Bullets
          items={[
            "Open standard — developed by IETF, supported by every vendor.",
            "Metric is called cost, derived from interface bandwidth.",
            "IGP — runs inside one autonomous system.",
            "OSPFv2 = IPv4, OSPFv3 = IPv6.",
            "Splits large networks into areas to control database size.",
          ]}
        />
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>Cost</Label>
            <CodeBlock>
              {`Cost = Reference Bandwidth / Interface Bandwidth
Default reference BW = 100 Mbps

Ethernet       100 / 10      = 10
Fast Ethernet  100 / 100     = 1
Gig Ethernet   100 / 1000    = 0.1 -> rounds to 1   (the problem)

Fix: reference-bandwidth 1000
  Fast Ethernet  10
  Gig Ethernet   1`}
            </CodeBlock>
          </div>

          <div>
            <Label>Areas</Label>
            <SimpleTable
              headers={["Area", "Purpose"]}
              rows={[
                ["Area 0 (backbone)", "Hub — every other area must connect here"],
                ["Standard", "Any number; Cisco recommends ≤ 50 routers"],
                ["Stub", "Filters LSA 4, 5; default route injected"],
                ["Total Stub", "Filters LSA 3, 4, 5; default replaces both"],
                ["NSSA", "Like stub but allows LSA 5→7 conversion for ASBR"],
                ["Total NSSA", "NSSA + blocks LSA 3"],
              ]}
            />
          </div>

          <div>
            <Label>Packet types (5)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { c: "Hello", h: 215, d: "Adjacency" },
                { c: "DBD", h: 185, d: "DB descriptor" },
                { c: "LSR", h: 150, d: "Request LSAs" },
                { c: "LSU", h: 290, d: "Send LSAs" },
                { c: "LSAck", h: 335, d: "Confirm" },
              ].map((x) => (
                <div
                  key={x.c}
                  style={hue(x.h)}
                  className="osi-tint rounded-lg border px-3 py-2"
                >
                  <p className="osi-ink text-sm font-bold">{x.c}</p>
                  <p className="text-[10px] text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Key facts</Label>
            <KVGrid
              items={[
                ["Hello / Dead", "10 s / 40 s (1:4)"],
                ["DR multicast", "224.0.0.5"],
                ["BDR multicast", "224.0.0.6"],
                ["AD", "110"],
                ["Process ID", "1–65536 (locally significant)"],
                ["LSAs", "9 total, 7 common"],
              ]}
            />
          </div>

          <div>
            <Label>Router types</Label>
            <SimpleTable
              headers={["Router", "Role"]}
              rows={[
                ["ABR", "Between standard area and backbone (Area 0)"],
                ["ASBR", "Between two autonomous systems; does redistribution"],
                ["DR", "Designated Router in a broadcast segment"],
                ["BDR", "Backup DR"],
                ["DROther", "Everything else"],
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — adjacency states</SubHead>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              State {state + 1} of {STATES.length}
            </span>
            <span>{STATES[state].s}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${((state + 1) / STATES.length) * 100}%` }}
            />
          </div>
          <div
            style={hue(STATES[state].h)}
            className="osi-tint osi-fade mt-4 rounded-xl border px-3.5 py-3.5"
          >
            <p className="osi-ink text-xs font-semibold">
              {STATES[state].s}
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              {STATES[state].text}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setState((s) => Math.max(0, s - 1))}
              disabled={state === 0}
              className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setState((s) => Math.min(STATES.length - 1, s + 1))
              }
              disabled={state === STATES.length - 1}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "OSPF uses hop count as its metric.",
              right:
                "OSPF uses cost, derived from interface bandwidth. Lower cost is better.",
            },
            {
              wrong: "OSPF Process ID must match between neighbors.",
              right:
                "Process ID is locally significant. Neighbors can run different process IDs. Areas must match.",
            },
            {
              wrong: "Every area can be total stub.",
              right:
                "The ASBR's own area cannot be stub or total stub — use NSSA / Total NSSA instead.",
            },
            {
              wrong: "DR/BDR election happens once and never changes.",
              right:
                "It happens once and is non-preemptive. A higher-priority router joining later does NOT take over — it waits.",
            },
            {
              wrong: "OSPF Hellos and Dead timers can be any value.",
              right:
                "They must match on both neighbors (it's an adjacency condition). And they must keep the 1:4 ratio.",
            },
            {
              wrong: "A DROther forms a Full adjacency with every other DROther.",
              right:
                "On the same broadcast segment, DROthers only reach Two-Way with each other. Full adjacencies happen with the DR and BDR only.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: OSPF end-to-end</SubHead>
        <CodeBlock>
          {`Enable OSPF 100 on R1 with a loopback as Router-ID:

  interface loopback 0
    ip address 1.1.1.1 255.255.255.255
    no shutdown
    exit

  router ospf 100
    router-id 1.1.1.1
    network 192.168.1.0 0.0.0.255 area 1
    network 0.0.0.0 area 1
    passive-interface default
    no passive-interface f0/0
    exit

Neighborship conditions (all must match):
  Same area · same subnet · same timers · same MTU
  Same auth · same stub flag · DIFFERENT router-id

Wildcard mask:
  255.255.255.255 - subnet_mask = wildcard

  255.255.255.0   -> 0.0.0.255
  255.255.255.128 -> 0.0.0.127
  255.255.255.252 -> 0.0.0.3`}
        </CodeBlock>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "Why is OSPF called link-state?",
              a: [
                "Every router floods its own links to every other router in the area.",
                "Each router builds a complete map of the topology and runs SPF on it.",
              ],
            },
            {
              q: "What's the difference between OSPFv2 and OSPFv3?",
              a: [
                "OSPFv2 is for IPv4. OSPFv3 is for IPv6.",
                "OSPFv1 was experimental only and never deployed.",
              ],
            },
            {
              q: "What is the ABR?",
              a: [
                "Area Border Router — sits between a standard area and the backbone (Area 0).",
                "Generates LSA 3 (summary) and LSA 4 (ASBR summary) between areas.",
              ],
            },
            {
              q: "What is the ASBR?",
              a: [
                "Autonomous System Border Router — connects two autonomous systems.",
                "Redistribution happens here. Generates LSA 5 (external).",
              ],
            },
            {
              q: "What is the DR/BDR election based on?",
              a: [
                "Highest OSPF priority (default 1, range 0–255).",
                "Tie-break by highest Router-ID.",
                "Priority 0 = never participates.",
                "Non-preemptive — once elected, stays until failure.",
              ],
            },
            {
              q: "Why is the reference bandwidth a problem?",
              a: [
                "Default 100 Mbps means Fast Ethernet and Gigabit get the same cost (1).",
                "Fix: raise reference bandwidth (e.g. to 1000) — same value on every router.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 6 · Redistribution
// ═════════════════════════════════════════════════════════════

function RedistributionGroup() {
  return (
    <GroupShell
      title="Group 6"
      subtitle="Route Redistribution between OSPF and EIGRP"
      icon={ArrowLeftRight}
    >
      <BigBlock title="Big Picture — why redistribute" hue={185}>
        <p className="text-sm leading-relaxed">
          When two routing domains meet, each speaks its own protocol. To share
          routes across the boundary, one router — the{" "}
          <strong>ASBR</strong> — is configured to translate between them. That
          process is redistribution.
        </p>
        <Bullets
          items={[
            "OSPF and OSPF — same protocol, different processes.",
            "EIGRP and EIGRP — same protocol, different AS numbers.",
            "OSPF and EIGRP — different protocols, different metrics → metric required on one side.",
          ]}
        />
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>Redistribution commands</Label>
            <SimpleTable
              headers={["Direction", "Command (on the ASBR)"]}
              rows={[
                ["OSPF → OSPF", "redistribute ospf 200 subnets"],
                ["EIGRP → EIGRP", "redistribute eigrp 200 (metric carried)"],
                ["OSPF → EIGRP", "redistribute ospf 100 metric <bw> <delay> <rel> <load> <mtu>"],
                ["EIGRP → OSPF", "redistribute eigrp 200 subnets"],
              ]}
            />
          </div>

          <div>
            <Label>Metric fields in the OSPF-into-EIGRP command</Label>
            <SimpleTable
              headers={["Field", "Example", "Notes"]}
              rows={[
                ["Bandwidth (kbps)", "10000", "10 Mbps"],
                ["Delay (10 µs)", "100", "1 ms"],
                ["Reliability", "255", "255 = max"],
                ["Load", "1", "1 = min load"],
                ["MTU", "1500", "Ethernet default"],
              ]}
            />
            <CodeBlock>
              {`router eigrp 200
  redistribute ospf 100 metric 10000 100 255 1 1500
  exit`}
            </CodeBlock>
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — 4 steps to redistribute</SubHead>
        <Bullets
          items={[
            "1. Identify the ASBR — the router that touches both domains.",
            "2. On the ASBR, go into the target protocol's router config.",
            "3. Issue redistribute <source> — with metric if the target is EIGRP.",
            "4. Verify with show ip route, show ip protocols, and the target's show commands.",
          ]}
        />
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "Redistribute works in both directions automatically.",
              right:
                "You configure redistribution per direction, per router. Doing one side is not enough.",
            },
            {
              wrong: "OSPF-to-OSPF redistribution needs a metric.",
              right:
                "OSPF-to-OSPF just needs the subnets keyword — the metric is comparable.",
            },
            {
              wrong: "EIGRP-to-EIGRP redistribution needs a metric.",
              right:
                "No — the metric is carried across because both sides use the same metric format.",
            },
            {
              wrong: "You can pick any numbers for EIGRP redistribution metric.",
              right:
                "Pick values that make sense for the network — wrong values give wrong metric, wrong best path.",
            },
            {
              wrong: "subnets keyword is optional.",
              right:
                "Without subnets, only classful routes get redistributed. Most real networks use subnets.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: ASBR configuration on both sides</SubHead>
        <CodeBlock>
          {`ASBR connecting OSPF 100 (left) to EIGRP 200 (right)

  ! Pull EIGRP into OSPF
  router ospf 100
    redistribute eigrp 200 subnets
    exit

  ! Push OSPF into EIGRP (metric required)
  router eigrp 200
    redistribute ospf 100 metric 10000 100 255 1 1500
    exit

Verify:
  show ip route              - see redistributed routes
  show ip protocols          - see which protocols are redistributing
  show run | section ospf
  show run | section eigrp`}
        </CodeBlock>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "What is redistribution?",
              a: [
                "The process of sharing routes between two different routing domains.",
                "It runs on the ASBR — the router between the two domains.",
              ],
            },
            {
              q: "Why does OSPF-into-EIGRP need a metric?",
              a: [
                "OSPF uses cost; EIGRP uses a composite metric (bandwidth + delay). They're not compatible.",
                "So you supply a seed metric when redistributing into EIGRP.",
              ],
            },
            {
              q: "What does the subnets keyword do?",
              a: [
                "Without it, OSPF only redistributes classful networks.",
                "With it, classless subnets get redistributed too — which is what you normally want.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 7 · OSPF Advanced
// ═════════════════════════════════════════════════════════════

function OspfAdvancedGroup() {
  return (
    <GroupShell
      title="Group 7"
      subtitle="OSPF Advanced — Stub Areas, Virtual Links, LSA Types"
      icon={Layers}
    >
      <BigBlock title="Big Picture — the OSPF toolkit" hue={255}>
        <p className="text-sm leading-relaxed">
          Once basic OSPF works, four advanced features handle scale and edge
          cases:
        </p>
        <Bullets
          items={[
            "Stub areas — filter external routes to save memory/CPU on small areas.",
            "Virtual links — connect a stranded area back to Area 0 through a transit area.",
            "LSA types — understand what information floods and where.",
            "Path manipulation — change cost to steer traffic deterministically.",
          ]}
        />
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>LSA types (the ones that matter)</Label>
            <SimpleTable
              headers={["Type", "Name", "Generated by", "Purpose"]}
              rows={[
                ["1", "Router", "Every OSPF router", "Intra-area links"],
                ["2", "Network", "DR", "Broadcast segment members"],
                ["3", "Summary", "ABR", "Inter-area routes"],
                ["4", "ASBR Summary", "ABR", "Locate the ASBR"],
                ["5", "External", "ASBR", "External routes"],
                ["6", "Multicast", "—", "MOSPF (not used in practice)"],
                ["7", "NSSA", "ASBR inside NSSA", "External routes in NSSA"],
              ]}
            />
          </div>

          <div>
            <Label>Stub area comparison</Label>
            <SimpleTable
              headers={["Area type", "Blocks", "Default route?", "Extras allowed"]}
              rows={[
                ["Stub", "LSA 4, 5", "Yes", "LSA 3"],
                ["Total stub", "LSA 3, 4, 5", "Yes", "—"],
                ["NSSA", "LSA 4, 5", "No", "LSA 3, LSA 7"],
                ["Total NSSA", "LSA 3, 4, 5", "Yes", "LSA 7"],
              ]}
            />
          </div>

          <div>
            <Label>Virtual link commands</Label>
            <CodeBlock>
              {`! On both ABRs, inside the OSPF process
router ospf 100
  area <transit-area-id> virtual-link <remote-ABR-router-id>
  exit

show ip ospf virtual-link`}
            </CodeBlock>
          </div>

          <div>
            <Label>Path manipulation</Label>
            <CodeBlock>
              {`! Per-interface cost
interface f0/0
  ip ospf cost 50
  exit

! Reference bandwidth — must match on every router
router ospf 100
  auto-cost reference-bandwidth 1000
  exit`}
            </CodeBlock>
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — when to reach for each feature</SubHead>
        <Bullets
          items={[
            "Slow convergence in a small branch — make the branch area stub, reduce LSA count.",
            "An area got accidentally separated from Area 0 — configure a virtual link through the transit area.",
            "ASBR is inside what used to be a stub — switch to NSSA so external routes can flow.",
            "Fast and Gig links look identical — raise the reference bandwidth so cost reflects reality.",
            "Primary path isn't being used — raise cost on the backup interface, or lower it on the preferred.",
          ]}
        />
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "Stub is one type.",
              right:
                "Four: Stub, Total Stub, NSSA, Total NSSA. Each blocks a different set of LSAs.",
            },
            {
              wrong: "Plain NSSA gets a default route automatically.",
              right:
                "It doesn't. You need Total NSSA (no-summary) or an explicit default-information-originate.",
            },
            {
              wrong: "Virtual links can route around any problem.",
              right:
                "They only fix an area that is stranded from Area 0. They don't fix broken adjacency conditions.",
            },
            {
              wrong: "The stub setting is per-router.",
              right:
                "It must match on every router in the area. It's a neighborship condition.",
            },
            {
              wrong: "Reference bandwidth is a per-router setting.",
              right:
                "It must be the same on every router, or different routers will disagree about cost and loops appear.",
            },
            {
              wrong: "E1 and E2 are the same.",
              right:
                "E1 adds internal cost; E2 does not. E1 is preferred when both are present for the same destination.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: stub area design</SubHead>
        <CodeBlock>
          {`Topology: ABR between Area 0 and Area 20 (small branch)
ASBR sits inside Area 20, redistributing external routes

Plain stub (Area 20 stub):
  - Blocks LSA 4 and 5
  - Default route injected by ABR
  - But: LSA 5 cannot be generated inside Area 20, so ASBR is blocked

Result: use NSSA instead.

Area 20 NSSA:
  - Still blocks LSA 4, 5
  - ASBR generates LSA 7 (E2 -> N2)
  - LSA 7 converted back to LSA 5 at the ABR
  - Rest of AS sees external routes as normal

Verify:
  show ip route
  show ip ospf database
  show run | section ospf`}
        </CodeBlock>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "Why does OSPF need areas at all?",
              a: [
                "OSPF has no hop-count limit, so a flat AS could carry hundreds of routers.",
                "Areas partition the topology so each router only needs to know its own area's detail.",
              ],
            },
            {
              q: "How does a stub area save memory?",
              a: [
                "By blocking LSA 4 and 5 (external routes).",
                "The ABR injects a single default route instead, replacing potentially hundreds of entries.",
              ],
            },
            {
              q: "When do you use a virtual link?",
              a: [
                "When an area is separated from Area 0 by another area.",
                "The virtual link tunnels OSPF adjacency between two ABRs through the transit area.",
              ],
            },
            {
              q: "What is the difference between E1 and E2?",
              a: [
                "E1 carries internal cost accumulated inside the AS — it grows as it crosses the topology.",
                "E2 does not — it stays a fixed value.",
                "E2 is the default; E1 is preferred if both exist for the same destination.",
              ],
            },
            {
              q: "How do you influence OSPF path selection?",
              a: [
                "Change the interface cost — `ip ospf cost <value>`.",
                "Or raise the reference bandwidth so cost reflects modern link speeds.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────

const GROUPS = [
  { id: "basics", label: "Basics" },
  { id: "static", label: "Static & Default" },
  { id: "rip", label: "Dynamic & RIP" },
  { id: "eigrp", label: "EIGRP" },
  { id: "ospf", label: "OSPF" },
  { id: "redist", label: "Redistribution" },
  { id: "ospfadv", label: "OSPF Advanced" },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

export function RoutingSummary() {
  const [group, setGroup] = useState<GroupId>("basics");

  return (
    <div className="rt-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{RT_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 08 · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Routing
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The biggest topic in the course, broken into seven groups. Pick a
          group below — each has Big Picture, Cheat Sheet, How It Works,
          Misconceptions, a Signature drill, and Interview Prep.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Routing groups"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-card p-1"
      >
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={group === g.id}
            onClick={() => setGroup(g.id)}
            className={cx(
              "shrink-0 rounded-lg px-3.5 py-2 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
              group === g.id
                ? "bg-[var(--accent)] font-medium text-white"
                : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-w-0">
        {group === "basics" && <BasicsGroup />}
        {group === "static" && <StaticGroup />}
        {group === "rip" && <RipGroup />}
        {group === "eigrp" && <EigrpGroup />}
        {group === "ospf" && <OspfGroup />}
        {group === "redist" && <RedistributionGroup />}
        {group === "ospfadv" && <OspfAdvancedGroup />}
      </div>
    </div>
  );
}