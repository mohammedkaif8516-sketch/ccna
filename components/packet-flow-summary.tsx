"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Box,
  ChevronRight,
  CircleDot,
  EthernetPort,
  Flag,
  GitCompare,
  Layers,
  Lightbulb,
  MessageCircleQuestion,
  Network,
  Package,
  Router as RouterIcon,
  Send,
  ShieldCheck,
  Sparkles,
  Split,
  Target,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   Packet Flow — Summary
   Structure per group: Big Picture · Cheat Sheet · How It Works ·
                        Misconceptions · Signature · Interview Prep
   Groups: Same Network · Between Networks · PDU Names
   Register as SUMMARY_VIEWS.packetflow = PacketFlowSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const PF_CSS = `
.pf-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.pf-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .pf-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.pf-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .pf-root .osi-solid{background:hsl(var(--h) 68% 52%)}
.pf-root .pf-prompt{background:#0d1117;color:#7ee787;border-color:#30363d}
.dark .pf-root .pf-prompt{background:#050810;color:#7ee787}
@keyframes pfFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes pfPulse{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
.pf-root .osi-fade{animation:pfFade .22s ease-out both}
.pf-root .pf-pulse{animation:pfPulse 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.pf-root .osi-fade,.pf-root .pf-pulse{animation:none}}
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
    <pre className="pf-prompt overflow-x-auto rounded-xl border px-3.5 py-3 font-mono text-[11px] leading-5">
      <code>{children}</code>
    </pre>
  );
}

function KVGrid({ items }: { items: Array<[string, string]> }) {
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

// ═════════════════════════════════════════════════════════════
// GROUP 1 · Same Network
// ═════════════════════════════════════════════════════════════

function SameNetworkGroup() {
  const [step, setStep] = useState(0);

  const STEPS = [
    {
      t: "1. AND operation",
      h: 215,
      text: "PC1 ANDs the destination IP with its own mask. Result = 192.168.1.0 = its own network, so PC2 is local. Deliver directly, no gateway.",
    },
    {
      t: "2. ARP request (broadcast)",
      h: 150,
      text: "PC1 doesn't know PC2's MAC. It broadcasts 'who has 192.168.1.2?' with Dest MAC ffff.ffff.ffff. The switch learns PC1's MAC and floods.",
    },
    {
      t: "3. ARP reply (unicast)",
      h: 185,
      text: "PC2 recognizes its own IP and replies directly to PC1's MAC. The switch learns PC2's MAC and forwards out one port.",
    },
    {
      t: "4. ICMP echo",
      h: 290,
      text: "PC1 now has PC2's MAC. The switch already knows where PC2 lives. The echo frame goes only out PC2's port.",
    },
    {
      t: "5. ICMP echo reply",
      h: 335,
      text: "PC2 sends the reply back to PC1. No ARP needed — both sides have each other's MACs already.",
    },
  ];

  return (
    <GroupShell
      title="Group 1"
      subtitle="Packet Flow Within the Same Network"
      icon={Network}
    >
      <BigBlock title="Big Picture — three steps, every time" hue={215}>
        <p className="text-sm leading-relaxed">
          Any host sending to any destination walks the same three-step
          sequence before a single bit of real data goes on the wire:
        </p>
        <Bullets
          items={[
            "(i) AND — is the destination local or remote?",
            "(ii) ARP — what is the MAC address I need?",
            "(iii) Traffic — send the actual data.",
          ]}
        />
        <p className="text-sm leading-relaxed">
          If the destination is on the same subnet, ARP is for the destination
          itself. If it is remote, ARP is for the default gateway.
        </p>
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>Broadcast addresses</Label>
            <SimpleTable
              headers={["Layer", "Broadcast"]}
              rows={[
                ["Layer 3 (IP)", "255.255.255.255"],
                ["Layer 2 (MAC)", "ffff.ffff.ffff"],
              ]}
              minWidth={280}
            />
          </div>

          <div>
            <Label>AND truth table</Label>
            <SimpleTable
              headers={["A", "B", "A AND B"]}
              rows={[
                ["0", "0", "0"],
                ["0", "1", "0"],
                ["1", "0", "0"],
                ["1", "1", "1"],
              ]}
              minWidth={200}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Result equals the host's own network → destination is local.
            </p>
          </div>

          <div>
            <Label>ARP messages</Label>
            <SimpleTable
              headers={["Message", "Src IP", "Target IP", "Src MAC", "Dest MAC"]}
              rows={[
                ["Request", "192.168.1.1", "192.168.1.2", "aaa", "ffff.ffff.ffff"],
                ["Reply", "192.168.1.2", "192.168.1.1", "bbb", "aaa"],
              ]}
            />
          </div>

          <div>
            <Label>Final state</Label>
            <SimpleTable
              headers={["Device", "Table"]}
              rows={[
                ["PC1 ARP", "192.168.1.2 = bbb"],
                ["PC2 ARP", "192.168.1.1 = aaa"],
                ["SW1 MAC table", "aaa = 0/0, bbb = 0/2"],
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — the 5 packets on the wire</SubHead>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{STEPS[step].t}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div
            style={hue(STEPS[step].h)}
            className="osi-tint osi-fade mt-4 rounded-xl border px-3.5 py-3.5"
          >
            <p className="osi-ink text-xs font-semibold">{STEPS[step].t}</p>
            <p className="mt-1 text-sm leading-relaxed">{STEPS[step].text}</p>
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
                setStep((s) => Math.min(STEPS.length - 1, s + 1))
              }
              disabled={step === STEPS.length - 1}
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
              wrong: "ARP is only used between networks.",
              right:
                "ARP is used any time a host needs a MAC address. Same network = ARP for the destination; different network = ARP for the gateway.",
            },
            {
              wrong: "The ARP reply is also a broadcast.",
              right:
                "The request is a broadcast. The reply is unicast — the responder already knows the requester's MAC from the request frame.",
            },
            {
              wrong: "A switch always floods every frame.",
              right:
                "A switch only floods broadcast, multicast, and unknown-unicast frames. Once it knows a MAC, it forwards only out the correct port.",
            },
            {
              wrong: "ARP replies let the switch learn MACs.",
              right:
                "The switch learns from the SOURCE MAC of every frame — both requests and replies. It doesn't care about the message type.",
            },
            {
              wrong: "Hosts always ARP for the destination IP.",
              right:
                "Only if the destination is on the same subnet. If it's remote, they ARP for the gateway.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: PC1 pings PC2 (same LAN)</SubHead>
        <CodeBlock>
          {`Topology: PC1 (1.1) — SW1 — PC2 (1.2), PC3 (1.3), gateway (1.100)

Step 1 — AND
  Dest 192.168.1.2 AND mask 255.255.255.0 = 192.168.1.0
  Matches PC1's own network → local → no gateway needed

Step 2 — ARP request (broadcast)
  Src 192.168.1.1 → Target 192.168.1.2
  Src MAC aaa → Dest MAC ffff.ffff.ffff
  Switch learns aaa on port 0/0, floods out 0/2 and 0/3
  PC3 discards. Gateway discards. PC2 answers.

Step 3 — ARP reply (unicast)
  Src 192.168.1.2 → Dest 192.168.1.1
  Src MAC bbb → Dest MAC aaa
  Switch learns bbb on 0/2, forwards out 0/0

Step 4 — ICMP echo
  Src 1.1 → Dest 1.2, MACs aaa → bbb
  Switch forwards only out 0/2

Step 5 — ICMP echo reply
  Src 1.2 → Dest 1.1, MACs bbb → aaa
  Switch forwards only out 0/0

Result: ping succeeds. No ARP in steps 4 or 5 — caches are full.`}
        </CodeBlock>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "Walk me through a ping within a LAN.",
              a: [
                "1. AND check — is the destination local?",
                "2. ARP broadcast to find the destination's MAC.",
                "3. ARP unicast reply back to the sender.",
                "4. ICMP echo from sender to receiver (unicast).",
                "5. ICMP echo reply back (unicast).",
              ],
            },
            {
              q: "Why does a host need MAC addresses if it already has IP addresses?",
              a: [
                "Ethernet frames are delivered within a single Layer 2 segment — they need a MAC address to identify the destination NIC on the wire.",
                "IP works end to end; MAC works hop by hop.",
              ],
            },
            {
              q: "What does the switch learn and when?",
              a: [
                "It learns the SOURCE MAC of every incoming frame and the port it came in on.",
                "It stores that in the MAC (CAM) table, along with the learning type and VLAN.",
              ],
            },
            {
              q: "How does the switch know where to forward a frame?",
              a: [
                "It looks up the DESTINATION MAC in its MAC table.",
                "Known unicast → forward out one port. Unknown unicast or broadcast → flood out all ports except the incoming one.",
              ],
            },
            {
              q: "What if the ARP cache already has the entry?",
              a: [
                "The host skips ARP entirely and sends the frame directly.",
                "ARP entries age out after a few minutes, so most long-lived conversations do not re-ARP.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 2 · Between Networks
// ═════════════════════════════════════════════════════════════

function BetweenNetworksGroup() {
  const [dir, setDir] = useState<"forward" | "reply">("forward");
  const [step, setStep] = useState(0);

  const FORWARD = [
    {
      t: "PC1 — AND + ARP for gateway",
      h: 215,
      text: "PC1 sees PC3 (2.1) is on a different network. ARP broadcast for the gateway (1.100). Gateway replies with its MAC ccc. ICMP echo goes to the gateway, not to PC3.",
    },
    {
      t: "R1 — strips + routes + ARPs next hop",
      h: 150,
      text: "R1 reads Dest IP 2.1 and finds the route via next hop 3.2. It ARPs for 3.2 (not 2.1) and rebuilds the frame with new MACs. TTL drops by 1.",
    },
    {
      t: "R2 — strips + routes + ARPs PC3",
      h: 185,
      text: "R2 reads Dest IP 2.1, sees the 2.0 network is directly connected. ARPs for PC3's MAC (ggg). Rebuilds the frame. TTL drops by 1.",
    },
    {
      t: "PC3 receives the echo",
      h: 290,
      text: "SW2 already learned ggg and forwards only out PC3's port. PC3 accepts the frame. Ping success on the forward path.",
    },
  ];

  const REPLY = [
    {
      t: "PC3 — AND + ARP cache lookup",
      h: 335,
      text: "PC3 sees PC1 (1.1) is on a different network. Needs the gateway's MAC — and it is already in the ARP cache from the forward path. No ARP needed.",
    },
    {
      t: "R2 — strips + routes + ARP cache lookup",
      h: 255,
      text: "R2 reads Dest IP 1.1, finds the route via 3.1. ARP table already has 3.1 = ddd. No ARP. Rebuilds the frame. TTL drops by 1.",
    },
    {
      t: "R1 — strips + routes + ARP cache lookup",
      h: 215,
      text: "R1 reads Dest IP 1.1, sees 1.0 is directly connected. ARP table already has 1.1 = aaa. No ARP. Rebuilds the frame. TTL drops by 1.",
    },
    {
      t: "PC1 receives the reply",
      h: 150,
      text: "SW1 forwards only out PC1's port. PC1 accepts. Ping succeeded. Zero ARPs on the reply path — the forward path warmed every cache.",
    },
  ];

  const steps = dir === "forward" ? FORWARD : REPLY;
  const current = steps[step];

  return (
    <GroupShell
      title="Group 2"
      subtitle="Packet Flow Between Networks (PC1 ↔ PC3)"
      icon={ArrowLeftRight}
    >
      <BigBlock title="Big Picture — the golden rule" hue={215}>
        <p className="text-sm leading-relaxed">
          Between networks, the same three steps happen at every hop — AND,
          ARP (if needed), send — but with one twist:
        </p>
        <div
          style={hue(215)}
          className="rounded-lg border bg-card px-3.5 py-3 text-center"
        >
          <p className="text-sm font-semibold">
            IP addresses stay the same end to end.
          </p>
          <p className="text-sm font-semibold">
            MAC addresses change at every hop.
          </p>
        </div>
        <p className="text-sm leading-relaxed">
          Each router strips the old Ethernet header, decides where to send
          the packet based on Dest IP, ARPs for the next hop (not the final
          target), and builds a fresh frame. TTL drops by 1 at every router.
        </p>
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>MAC addresses per hop</Label>
            <SimpleTable
              headers={["Hop", "Src MAC", "Dest MAC"]}
              rows={[
                ["PC1 → R1", "aaa (PC1)", "ccc (R1 gateway)"],
                ["R1 → R2", "ddd (R1)", "eee (R2)"],
                ["R2 → PC3", "nnn (R2)", "ggg (PC3)"],
              ]}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              IP addresses on every hop: 192.168.1.1 → 192.168.2.1, unchanged.
            </p>
          </div>

          <div>
            <Label>ARP count per direction</Label>
            <SimpleTable
              headers={["Direction", "ARPs sent", "Why"]}
              rows={[
                ["Forward (PC1 → PC3)", "3", "PC1 for gateway, R1 for R2, R2 for PC3"],
                ["Reply (PC3 → PC1)", "0", "All caches already filled by the forward path"],
              ]}
            />
          </div>

          <div>
            <Label>Table state after the forward path</Label>
            <SimpleTable
              headers={["Device", "Table"]}
              rows={[
                ["PC1 ARP", "1.100 = ccc"],
                ["R1 ARP", "1.1 = aaa, 3.2 = eee"],
                ["R2 ARP", "3.1 = ddd, 2.1 = ggg"],
                ["PC3 ARP", "2.100 = nnn"],
                ["SW1 MAC table", "aaa = 0/0, ccc = 0/3"],
                ["SW2 MAC table", "nnn = 0/0, ggg = 0/1"],
              ]}
            />
          </div>

          <div>
            <Label>Router behaviour in one line</Label>
            <Bullets
              items={[
                "Strip the old frame header.",
                "Read Dest IP.",
                "Consult the routing table — pick the next hop.",
                "ARP for the NEXT HOP (not the final destination).",
                "Rebuild the frame with new MACs.",
                "Decrement TTL.",
                "Forward.",
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — one direction at a time</SubHead>

        <div className="mb-4 inline-flex rounded-lg border bg-card p-1">
          {(
            [
              { id: "forward", label: "Forward path" },
              { id: "reply", label: "Reply path" },
            ] as const
          ).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDir(d.id);
                setStep(0);
              }}
              aria-pressed={dir === d.id}
              className={cx(
                "rounded-md px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                dir === d.id
                  ? "bg-[var(--accent)] text-white"
                  : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {step + 1} of {steps.length}
            </span>
            <span>{current.t}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div
            style={hue(current.h)}
            className="osi-tint osi-fade mt-4 rounded-xl border px-3.5 py-3.5"
          >
            <p className="osi-ink text-xs font-semibold">{current.t}</p>
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
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={step === steps.length - 1}
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
              wrong: "MAC addresses stay the same end to end.",
              right:
                "MAC addresses change at every router hop. Each router strips the old frame and builds a new one.",
            },
            {
              wrong: "IP addresses change at every hop.",
              right:
                "IP addresses stay the same end to end (unless NAT is involved). Only MACs change.",
            },
            {
              wrong: "Routers ARP for the final destination.",
              right:
                "Routers ARP for the NEXT HOP only. R1 ARPs for R2 (3.2), not for PC3 (2.1).",
            },
            {
              wrong: "TTL stays the same across the network.",
              right:
                "TTL drops by 1 at every router. When it hits zero, the packet is discarded and ICMP Time Exceeded is returned.",
            },
            {
              wrong: "PC1 sends the ICMP echo directly to PC3.",
              right:
                "PC1 sends it to the gateway's MAC address. PC3 is the destination IP, but the frame is addressed to R1.",
            },
            {
              wrong: "The reply path needs 3 new ARPs too.",
              right:
                "Zero new ARPs — the forward path already filled every ARP cache. That is why the reply is faster.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: the full journey (one table)</SubHead>
        <CodeBlock>
          {`FORWARD — PC1 (1.1) → PC3 (2.1)

Hop          Src IP   Dest IP  Src MAC  Dest MAC  ARP?
PC1 → R1     1.1      2.1      aaa      ccc       yes (for gateway)
R1 → R2      1.1      2.1      ddd      eee       yes (for R2)
R2 → PC3     1.1      2.1      nnn      ggg       yes (for PC3)

REPLY — PC3 (2.1) → PC1 (1.1)

Hop          Src IP   Dest IP  Src MAC  Dest MAC  ARP?
PC3 → R2     2.1      1.1      ggg      nnn       no (already cached)
R2 → R1      2.1      1.1      eee      ddd       no (already cached)
R1 → PC1     2.1      1.1      ccc      aaa       no (already cached)

TTL: 64 (start) → 63 (after R1) → 62 (after R2) → delivered`}
        </CodeBlock>
        <Callout icon={Target}>
          The single most important thing to internalize:{" "}
          <strong>IP = end to end, MAC = hop by hop.</strong>
        </Callout>
      </div>

      <div>
        <SubHead>Interview prep</SubHead>
        <QaList
          items={[
            {
              q: "How does PC1 know PC3 is on a different network?",
              a: [
                "PC1 ANDs PC3's IP (2.1) with its own subnet mask (255.255.255.0).",
                "The result 192.168.2.0 does not equal PC1's own network 192.168.1.0, so PC3 is remote.",
              ],
            },
            {
              q: "Who does PC1 ARP for when the destination is remote?",
              a: [
                "The default gateway, not the final destination.",
                "PC1 needs the gateway's MAC so it can hand the frame over for forwarding.",
              ],
            },
            {
              q: "What changes and what stays the same across a router?",
              a: [
                "Stays: source IP, destination IP, and the payload.",
                "Changes: source MAC, destination MAC, and TTL (drops by 1).",
              ],
            },
            {
              q: "What does a router do the moment it receives a frame?",
              a: [
                "It checks the Dest MAC is its own — if not, it drops the frame.",
                "If yes, it strips the header, reads the Dest IP, and consults its routing table.",
              ],
            },
            {
              q: "Why does the reply path need no ARP?",
              a: [
                "Every ARP request and reply on the forward path taught the responder the requester's MAC.",
                "By the time the reply flows, every device along the path already has the MAC it needs.",
              ],
            },
            {
              q: "What if a router's routing table has no route to the destination?",
              a: [
                "The router drops the packet and sends an ICMP Destination Unreachable back to the source.",
                "In practice, if a default route is configured, it forwards there instead.",
              ],
            },
          ]}
        />
      </div>
    </GroupShell>
  );
}

// ═════════════════════════════════════════════════════════════
// GROUP 3 · PDU Names
// ═════════════════════════════════════════════════════════════

function PduGroup() {
  return (
    <GroupShell
      title="Group 3"
      subtitle="PDU Names — Segment, Packet, Frame, Bits"
      icon={Package}
    >
      <BigBlock title="Big Picture — one chunk of data, four names" hue={215}>
        <p className="text-sm leading-relaxed">
          A <strong>PDU</strong> (Protocol Data Unit) is the name for a chunk
          of data at a given layer. The bytes on the wire are the same, but
          what you call them depends on <em>which layer you are talking
          about</em>.
        </p>
        <SimpleTable
          headers={["Layer", "PDU name"]}
          rows={[
            ["Layer 4 — Transport", "Segment (TCP) or Datagram (UDP)"],
            ["Layer 3 — Network", "Packet"],
            ["Layer 2 — Data Link", "Frame"],
            ["Layer 1 — Physical", "Bits"],
          ]}
          minWidth={320}
        />
      </BigBlock>

      <div>
        <SubHead>Cheat Sheet</SubHead>
        <div className="space-y-4">
          <div>
            <Label>Which word to use — two simple rules</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <div
                style={hue(215)}
                className="osi-tint rounded-xl border px-3.5 py-3"
              >
                <p className="osi-ink text-sm font-semibold">
                  If IP is in focus → packet
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Talking about routers, routing tables, or Dest IP? The unit
                  is a packet.
                </p>
              </div>
              <div
                style={hue(150)}
                className="osi-tint rounded-xl border px-3.5 py-3"
              >
                <p className="osi-ink text-sm font-semibold">
                  If MAC is in focus → frame
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Talking about switches, ARP, or Ethernet headers? The unit is
                  a frame.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label>Where ARP fits</Label>
            <p className="text-sm leading-relaxed">
              ARP sits between Layer 2 and Layer 3. It carries an IP address in
              its payload, but it travels inside an Ethernet frame — so the
              switch sees it as a frame, and it is correct to say{" "}
              <em>ARP reply frame</em> when talking about what the switch
              does.
            </p>
          </div>

          <div>
            <Label>How the encasulation builds up</Label>
            <CodeBlock>
              {`Application data
  ↓ TCP header added     → Segment
  ↓ IP header added      → Packet
  ↓ Ethernet header + FCS → Frame
  ↓ Converted to signal   → Bits`}
            </CodeBlock>
          </div>
        </div>
      </div>

      <div>
        <SubHead>How it works — one ICMP echo from four views</SubHead>
        <Bullets
          items={[
            "Transport view: there is no TCP/UDP header here — ICMP lives at Layer 3, so this is not a segment.",
            "Network view: source IP + destination IP + ICMP payload = an IP packet.",
            "Data Link view: the same packet inside an Ethernet header and FCS trailer = a frame.",
            "Physical view: the frame converted to voltage / light pulses = bits.",
          ]}
        />
        <Callout icon={Layers}>
          Same bytes, four names. The layer you are working at decides which
          word is correct.
        </Callout>
      </div>

      <div>
        <SubHead>Common misconceptions</SubHead>
        <MisconceptionList
          items={[
            {
              wrong: "Packet and frame are interchangeable.",
              right:
                "A packet is Layer 3 (IP addressing). A frame is Layer 2 (MAC addressing). Use the layer to pick the word.",
            },
            {
              wrong: "A segment is what the switch sees.",
              right:
                "A switch sees a frame — it reads the MAC addresses in the Ethernet header, not the TCP header.",
            },
            {
              wrong: "ARP is a Layer 3 protocol so it travels as a packet.",
              right:
                "ARP travels inside an Ethernet frame. The switch processes it as a frame.",
            },
            {
              wrong: "UDP produces segments.",
              right:
                "TCP produces segments. UDP produces datagrams. The Transport PDU name depends on the protocol.",
            },
            {
              wrong: "'Bits' and 'frame' mean the same thing.",
              right:
                "Bits are the raw signal at Layer 1. A frame is the structured Layer 2 unit that becomes bits when transmitted.",
            },
          ]}
        />
      </div>

      <div>
        <SubHead>Signature: name the PDU quiz</SubHead>
        <div className="space-y-2">
          {[
            { q: "Switch reads the destination MAC address.", a: "Frame (Layer 2)" },
            { q: "Router checks the routing table.", a: "Packet (Layer 3)" },
            { q: "TCP assigns sequence numbers.", a: "Segment (Layer 4)" },
            { q: "UDP checksum is calculated.", a: "Datagram (Layer 4)" },
            { q: "ARP reply arrives at PC1.", a: "Frame (Layer 2) — ARP rides inside Ethernet" },
            { q: "The NIC transmits voltage on the wire.", a: "Bits (Layer 1)" },
            { q: "ICMP echo request is built.", a: "Packet (Layer 3)" },
            { q: "An FCS is appended to detect corruption.", a: "Frame (Layer 2)" },
          ].map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border bg-card px-3.5 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  {i + 1}. {item.q}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed">
                {item.a}
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
              q: "What is a PDU?",
              a: [
                "Protocol Data Unit — the general name for a chunk of data at any layer.",
                "Each layer calls it something different: segment, packet, frame, bits.",
              ],
            },
            {
              q: "Why does the name change if it is the same data?",
              a: [
                "Because each layer adds or removes its own header.",
                "The name reflects which layer you are looking at, not the bytes themselves.",
              ],
            },
            {
              q: "What does a switch process — packets or frames?",
              a: [
                "Frames. It reads the source and destination MAC addresses in the Ethernet header.",
                "It never looks at the IP addresses inside.",
              ],
            },
            {
              q: "What does a router process?",
              a: [
                "Packets. It strips the Ethernet header, reads the destination IP, and consults its routing table.",
                "It rebuilds a new frame for the next hop.",
              ],
            },
            {
              q: "Which PDU name applies to TCP but not UDP?",
              a: [
                "Segment. TCP produces segments.",
                "UDP produces datagrams.",
              ],
            },
            {
              q: "What does ARP actually travel as?",
              a: [
                "An Ethernet frame. ARP packets carry IP addresses inside, but the wire sees an Ethernet frame — the same framing MAC learning depends on.",
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
  { id: "same", label: "Same Network" },
  { id: "between", label: "Between Networks" },
  { id: "pdu", label: "PDU Names" },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

export function PacketFlowSummary() {
  const [group, setGroup] = useState<GroupId>("same");

  return (
    <div className="pf-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{PF_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Packet Flow · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Packet Flow
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          How a packet actually gets from one host to another — within a
          network, between networks, and what to call the bytes at each stop.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Packet flow groups"
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
                ? "bg-[var(--accent)] text-white font-medium"
                : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-w-0">
        {group === "same" && <SameNetworkGroup />}
        {group === "between" && <BetweenNetworksGroup />}
        {group === "pdu" && <PduGroup />}
      </div>
    </div>
  );
}