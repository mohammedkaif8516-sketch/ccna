"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  Binary,
  Calculator,
  ChevronRight,
  CircleDot,
  Globe,
  Hash,
  Layers,
  Lightbulb,
  Lock,
  MessageCircleQuestion,
  Network,
  ShieldCheck,
  Split,
  Table2,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   IP Addressing & Subnetting — Summary
   Structure: Big Picture · Cheat Sheet · How It Works ·
              Misconceptions · Subnet Visualizer (signature) ·
              Interview Prep
   Register as SUMMARY_VIEWS.ip = IpAddressingSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const IP_CSS = `
.ip-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.ip-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .ip-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.ip-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .ip-root .osi-solid{background:hsl(var(--h) 68% 52%)}
@keyframes ipFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.ip-root .osi-fade{animation:ipFade .22s ease-out both}
@media (prefers-reduced-motion:reduce){.ip-root .osi-fade{animation:none}}
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

const ADDRESS_CLASSES = [
  {
    cls: "A",
    range: "1 – 126",
    mask: "255.0.0.0",
    prefix: "/8",
    structure: "N · H · H · H",
    note: "10.0.0.0/8 is private; 127.0.0.0/8 is loopback; rest is public",
    hue: 335,
  },
  {
    cls: "B",
    range: "128 – 191",
    mask: "255.255.0.0",
    prefix: "/16",
    structure: "N · N · H · H",
    note: "172.16.0.0/12 is the private slice inside B",
    hue: 290,
  },
  {
    cls: "C",
    range: "192 – 223",
    mask: "255.255.255.0",
    prefix: "/24",
    structure: "N · N · N · H",
    note: "192.168.0.0/16 is the private slice inside C",
    hue: 150,
  },
  {
    cls: "D",
    range: "224 – 239",
    mask: "n/a",
    prefix: "n/a",
    structure: "Multicast groups",
    note: "No network, host, or broadcast addresses. Each IP is a multicast group",
    hue: 185,
  },
  {
    cls: "E",
    range: "240 – 255",
    mask: "n/a",
    prefix: "n/a",
    structure: "Research",
    note: "Reserved for scientific and research use",
    hue: 215,
  },
];

const PRIVATE_RANGES = [
  { range: "10.0.0.0/8", cls: "A", size: "/8" },
  { range: "172.16.0.0/12", cls: "B", size: "/12" },
  { range: "192.168.0.0/16", cls: "C", size: "/16" },
];

const POWERS_OF_TWO = [
  { bits: 1, addrs: 2, prefix: "/31" },
  { bits: 2, addrs: 4, prefix: "/30" },
  { bits: 3, addrs: 8, prefix: "/29" },
  { bits: 4, addrs: 16, prefix: "/28" },
  { bits: 5, addrs: 32, prefix: "/27" },
  { bits: 6, addrs: 64, prefix: "/26" },
  { bits: 7, addrs: 128, prefix: "/25" },
  { bits: 8, addrs: 256, prefix: "/24" },
];

// ─────────────────────────────────────────────────────────────
// Helpers for the visualizer
// ─────────────────────────────────────────────────────────────

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums.reduce((acc, n) => (acc * 256 + n) >>> 0, 0);
}

function intToIp(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function toBinaryOctets(ip: string): string[] {
  const n = ipToInt(ip);
  if (n === null) return [];
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].map((o) =>
    o.toString(2).padStart(8, "0"),
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Big Picture
// ─────────────────────────────────────────────────────────────

function BigPictureTab() {
  return (
    <div className="space-y-6">
      <div style={hue(215)} className="osi-tint rounded-xl border px-3.5 py-3.5">
        <p className="osi-ink text-xs font-semibold">What an IP address is</p>
        <p className="mt-1 text-sm leading-relaxed">
          An IP address is a <strong>logical address</strong> assigned by the
          network engineer to identify a device on the network. Every address
          has two sides: the <strong>network side</strong> (which network it
          belongs to) and the <strong>host side</strong> (which device on that
          network). The subnet mask draws the line between them.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border bg-background px-3 py-2 font-mono text-[11px] leading-5">
{`192.168.1.1
|_______|  |
Network    Host side
side`}
        </pre>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div style={hue(150)} className="osi-tint rounded-xl border px-3.5 py-3">
          <p className="osi-ink text-sm font-semibold">IPv4</p>
          <Bullets
            items={[
              "32 bits → ~4 billion addresses",
              "Written in decimal octets, e.g. 8.8.8.8",
              "Each octet is 8 bits, e.g. 8 = 00001000",
            ]}
          />
        </div>
        <div style={hue(290)} className="osi-tint rounded-xl border px-3.5 py-3">
          <p className="osi-ink text-sm font-semibold">IPv6</p>
          <Bullets
            items={[
              "128 bits → astronomically larger space",
              "Written in hexadecimal, e.g. AD12:1306:1034:0000:1111:2222:3333:4444",
              "8 fields of 16 bits each",
            ]}
          />
        </div>
      </div>

      <div>
        <Label>Why subnets exist</Label>
        <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed">
          Without subnetting, every device would sit in one giant network.
          Broadcasts would reach millions of hosts, address blocks would be
          handed out in wasteful chunks, and there would be no simple way to
          tell "this device is local" from "this device is remote".
          Subnetting breaks big networks into smaller ones — one broadcast
          domain each, one gateway each, sized to fit the actual need.
        </div>
      </div>

      <Callout icon={Globe}>
        The mask is not decoration. It is the rule that decides which part of
        an IP is the <em>network</em> and which part is the <em>host</em>.
        Everything else in this topic follows from that.
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
        <Label>IP address classes</Label>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Class</th>
                <th className="px-3 py-2 font-medium">First octet</th>
                <th className="px-3 py-2 font-medium">Default mask</th>
                <th className="px-3 py-2 font-medium">Prefix</th>
                <th className="px-3 py-2 font-medium">Structure</th>
              </tr>
            </thead>
            <tbody>
              {ADDRESS_CLASSES.map((c) => (
                <tr key={c.cls} className="border-t">
                  <td className="px-3 py-2 font-semibold">{c.cls}</td>
                  <td className="px-3 py-2 font-mono">{c.range}</td>
                  <td className="px-3 py-2 font-mono">{c.mask}</td>
                  <td className="px-3 py-2 font-mono">{c.prefix}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.structure}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Private ranges</Label>
          <div className="overflow-hidden rounded-xl border bg-card">
            {PRIVATE_RANGES.map((p, i, arr) => (
              <div
                key={p.range}
                className={cx(
                  "grid grid-cols-[1fr_60px_60px] items-center gap-3 px-3.5 py-2.5",
                  i !== arr.length - 1 && "border-b",
                )}
              >
                <span className="font-mono text-xs">{p.range}</span>
                <span className="text-center text-xs">Class {p.cls}</span>
                <span className="text-right text-xs font-mono">
                  {p.size}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            All the rest of Class A, B, C is public and globally routable.
          </p>
        </div>

        <div>
          <Label>Special addresses</Label>
          <div className="space-y-1.5">
            {[
              { a: "127.0.0.0/8", d: "Loopback — device tests itself" },
              { a: "169.254.0.0/16", d: "Link-local (APIPA) if DHCP fails" },
              { a: "0.0.0.0", d: "This host / any interface" },
              { a: "255.255.255.255", d: "Limited broadcast" },
              { a: "224.0.0.0/4", d: "Class D multicast groups" },
            ].map((s) => (
              <div
                key={s.a}
                className="flex items-start gap-2.5 rounded-lg border bg-card px-3 py-2"
              >
                <span className="shrink-0 font-mono text-xs">{s.a}</span>
                <span className="min-w-0 text-[11px] text-muted-foreground">
                  {s.d}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>Powers of two — hosts per prefix</Label>
        <div className="overflow-hidden rounded-xl border bg-card">
          {POWERS_OF_TWO.map((p, i, arr) => (
            <div
              key={p.prefix}
              className={cx(
                "grid grid-cols-[80px_80px_1fr] items-center gap-3 px-3.5 py-2",
                i !== arr.length - 1 && "border-b",
              )}
            >
              <span className="font-mono text-xs">{p.prefix}</span>
              <span className="font-mono text-xs text-muted-foreground">
                2^{p.bits} = {p.addrs}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {p.addrs === 256 ? "Class C boundary" : `Block size ${p.addrs}`}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Usable hosts = addresses − 2 (network and broadcast).
        </p>
      </div>

      <div>
        <Label>Key formulas</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { t: "Total addresses", d: "2^(32 − prefix)" },
            { t: "Usable hosts", d: "2^(32 − prefix) − 2" },
            { t: "Block size", d: "256 − mask value in the interesting octet" },
            { t: "Network address", d: "IP AND mask" },
            { t: "Broadcast address", d: "Network OR inverse mask" },
            { t: "Number of subnets", d: "2^(borrowed bits)" },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-lg border bg-card px-3 py-2"
            >
              <p className="text-xs font-medium">{f.t}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Callout icon={Table2}>
        If you can write the address-class table and the powers-of-two table
        from memory, subnetting questions become arithmetic instead of
        guesswork.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · How It Works (step-by-step)
// ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    title: "Write the IP and mask",
    hue: 215,
    text: "Start with the address and prefix, e.g. 192.168.10.77/26. Convert the prefix to a dotted mask: /26 = 255.255.255.192.",
  },
  {
    title: "Find the interesting octet",
    hue: 150,
    text: "The interesting octet is where the mask is neither 255 nor 0. For a /26, that is the fourth octet, with mask value 192.",
  },
  {
    title: "Calculate the block size",
    hue: 185,
    text: "Block size = 256 − mask value. 256 − 192 = 64. Every subnet grows by 64 in the interesting octet.",
  },
  {
    title: "Locate the subnet boundaries",
    hue: 255,
    text: "Subnets start at multiples of 64: .0, .64, .128, .192. Our address .77 falls in the .64 block.",
  },
  {
    title: "Derive network and broadcast",
    hue: 290,
    text: "Network = first address in the block (192.168.10.64). Broadcast = last address in the block (192.168.10.127).",
  },
  {
    title: "List the usable host range",
    hue: 335,
    text: "Usable hosts sit strictly between network and broadcast: 192.168.10.65 → 192.168.10.126. That is 62 usable hosts.",
  },
];

function HowItWorksTab() {
  const [step, setStep] = useState(0);
  const current = HOW_STEPS[step];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Walk through solving one subnet question step by step. Use Next /
        Previous or click any step below.
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
    wrong: "The IP address alone tells you the network.",
    right:
      "You need the address AND the mask. 10.0.0.1 could be one network of 16 million hosts, or thousands of small ones — the mask decides.",
  },
  {
    wrong: "Class A/B/C still controls how networks are assigned today.",
    right:
      "Classful addressing is legacy. Real networks use CIDR — any prefix length is allowed. The classes are still useful vocabulary and for spotting private ranges.",
  },
  {
    wrong: "127.0.0.0/8 is the private range for Class A.",
    right:
      "10.0.0.0/8 is the private range. 127.0.0.0/8 is the loopback range — the device talking to itself.",
  },
  {
    wrong: "IPv6 is just IPv4 with more addresses.",
    right:
      "IPv6 is a different protocol: 128-bit addresses, hexadecimal notation, no broadcast (multicast + anycast instead), and simpler headers.",
  },
  {
    wrong: "The first and last address of a subnet are usable.",
    right:
      "The first address is the network address and the last is the broadcast address. Neither is assigned to a host on normal subnets.",
  },
  {
    wrong: "VLSM wastes more than FLSM.",
    right:
      "FLSM gives every subnet the same size — wasteful when needs differ. VLSM assigns each subnet exactly what it needs. VLSM saves addresses.",
  },
  {
    wrong: "Block size equals the mask value.",
    right:
      "Block size equals 256 minus the mask value in the interesting octet. A /26 has mask value 192 in the fourth octet, so block size is 64, not 192.",
  },
  {
    wrong: "Two devices with the same IP will simply 'share' the address.",
    right:
      "Duplicate IPs cause an IP conflict. Both hosts lose reliability — one may fail to send, and the other may stop receiving.",
  },
  {
    wrong: "Any private IP can talk to the internet directly.",
    right:
      "Private addresses are not routable on the internet. They need NAT to be translated to a public address before leaving the local network.",
  },
  {
    wrong: "IANA hands IP addresses directly to end customers.",
    right:
      "IANA → RIRs → ISPs → customers. Each layer allocates large blocks downward and keeps the global space consistent.",
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
        If you can explain all ten of these in your own words, subnetting
        questions stop being tricky — they become arithmetic.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Binary & Subnet Visualizer (signature)
// ─────────────────────────────────────────────────────────────

function SubnetVisualizerTab() {
  const [ip, setIp] = useState("192.168.10.77");
  const [cidr, setCidr] = useState("26");

  const result = useMemo(() => {
    const n = ipToInt(ip);
    const prefix = Number(cidr);
    if (n === null) return { error: "Enter a valid IPv4 address." };
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32)
      return { error: "CIDR must be between 0 and 32." };

    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (n & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : total - 2;
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;

    // Interesting octet — where the mask is neither 255 nor 0
    const maskOctets = [mask >>> 24, (mask >>> 16) & 255, (mask >>> 8) & 255, mask & 255];
    const interestingIdx = maskOctets.findIndex((o) => o !== 0 && o !== 255);
    const blockSize = interestingIdx === -1 ? null : 256 - maskOctets[interestingIdx];

    return {
      error: "",
      prefix,
      network,
      broadcast,
      first,
      last,
      total,
      usable,
      blockSize,
      interestingIdx,
      maskOctets,
      ipBinary: toBinaryOctets(ip),
      maskBinary: toBinaryOctets(intToIp(mask)),
    };
  }, [ip, cidr]);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Type any IPv4 address and prefix. See the binary split between
        network and host bits, and the exact subnet boundaries that fall out
        of it.
      </p>

      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
          <label className="text-xs font-medium">
            IPv4 address
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="192.168.10.77"
            />
          </label>
          <label className="text-xs font-medium">
            Prefix
            <input
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              inputMode="numeric"
              placeholder="26"
            />
          </label>
        </div>

        {result.error && (
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">
            {result.error}
          </p>
        )}

        {!result.error && "network" in result && (
          <div className="mt-5 space-y-5">
            {/* Binary visual */}
            <div>
              <Label>Binary split — network bits vs host bits</Label>
              <div className="space-y-2">
                {[0, 1, 2, 3].map((octet) => {
                  const ipBits = result.ipBinary[octet] ?? "00000000";
                  const maskBits = result.maskBinary[octet] ?? "00000000";
                  return (
                    <div key={octet} className="flex items-center gap-2">
                      <span className="w-12 shrink-0 text-[10px] font-mono text-muted-foreground">
                        Octet {octet + 1}
                      </span>
                      <div className="flex gap-0.5">
                        {ipBits.split("").map((bit, i) => {
                          const isNetwork = maskBits[i] === "1";
                          return (
                            <span
                              key={i}
                              style={hue(isNetwork ? 215 : 150)}
                              className={cx(
                                "flex size-6 items-center justify-center rounded font-mono text-[10px] font-semibold",
                                isNetwork
                                  ? "osi-solid"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                              )}
                            >
                              {bit}
                            </span>
                          );
                        })}
                      </div>
                      <span className="ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                        = {parseInt(ipBits, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded bg-[var(--accent)]" />
                  Network bits (from the mask)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded bg-emerald-500/40" />
                  Host bits (free for devices)
                </span>
              </div>
            </div>

            {/* Facts */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["Network", `${intToIp(result.network)}/${result.prefix}`],
                ["Broadcast", intToIp(result.broadcast)],
                ["First host", intToIp(result.first)],
                ["Last host", intToIp(result.last)],
                ["Total addresses", String(result.total)],
                ["Usable hosts", String(result.usable)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border bg-background p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {k}
                  </p>
                  <p className="mt-0.5 break-all font-mono text-xs font-medium">
                    {v}
                  </p>
                </div>
              ))}
            </div>

            {/* Block math */}
            {result.blockSize !== null && result.interestingIdx !== -1 && (
              <div
                style={hue(290)}
                className="osi-tint rounded-xl border px-3.5 py-3"
              >
                <p className="osi-ink text-xs font-semibold">
                  How the boundaries were found
                </p>
                <ul className="mt-2 space-y-1 text-xs leading-relaxed">
                  <li>
                    Interesting octet = #4 (mask value{" "}
                    <span className="font-mono">
                      {result.maskOctets[result.interestingIdx]}
                    </span>
                    )
                  </li>
                  <li>
                    Block size = 256 −{" "}
                    <span className="font-mono">
                      {result.maskOctets[result.interestingIdx]}
                    </span>{" "}
                    ={" "}
                    <span className="font-mono font-semibold">
                      {result.blockSize}
                    </span>
                  </li>
                  <li>
                    Subnets begin at multiples of{" "}
                    <span className="font-mono">{result.blockSize}</span>
                  </li>
                  <li>
                    Our IP{" "}
                    <span className="font-mono">{ip}</span> falls in the block
                    starting at{" "}
                    <span className="font-mono">{intToIp(result.network)}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <Callout icon={Binary}>
        Every subnet question is just this: read the mask, find the block
        size, locate the address inside the block, and derive the two
        endpoints.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Interview Prep
// ─────────────────────────────────────────────────────────────

const PITCH =
  "An IP address is a logical address with two sides — a network side and a host side. The subnet mask draws the line between them. IPv4 is 32 bits written as four decimal octets; IPv6 is 128 bits written in hexadecimal. Classful addressing splits IPv4 into five classes — A, B, C are unicast, D is multicast, E is research. Class A, B, and C each have a private slice — 10/8, 172.16/12, 192.168/16 — that is not routable on the public internet. Subnetting divides a big network into smaller ones to control broadcast size and avoid address waste. FLSM uses equal-size subnets, VLSM matches size to need. Every subnet has a network address, a broadcast address, and a usable host range strictly between them.";

const QA: Array<{ q: string; a: string[] }> = [
  {
    q: "What is an IP address, and why does it have two sides?",
    a: [
      "It is a logical address assigned to a device so other devices can find it.",
      "Every address has a network side (which network) and a host side (which device on that network).",
      "The subnet mask draws the line between them.",
    ],
  },
  {
    q: "Compare IPv4 and IPv6.",
    a: [
      "IPv4 — 32 bits, written as four decimal octets, about 4 billion addresses.",
      "IPv6 — 128 bits, written in hexadecimal, 8 fields of 16 bits.",
      "IPv6 also removes broadcast (using multicast and anycast) and simplifies the header.",
    ],
  },
  {
    q: "Name the IP address classes and their ranges.",
    a: [
      "A — 1–126, /8 default mask.",
      "B — 128–191, /16 default mask.",
      "C — 192–223, /24 default mask.",
      "D — 224–239, multicast.",
      "E — 240–255, research.",
    ],
  },
  {
    q: "What are the private IP ranges?",
    a: [
      "10.0.0.0/8 — the private slice inside Class A.",
      "172.16.0.0/12 — the private slice inside Class B.",
      "192.168.0.0/16 — the private slice inside Class C.",
      "Private addresses are not routable on the public internet. They need NAT to reach it.",
    ],
  },
  {
    q: "What is 127.0.0.0/8?",
    a: [
      "The loopback range — the device talking to itself.",
      "127.0.0.1 is the classic loopback address used to test the local TCP/IP stack.",
      "It sits inside Class A, but it is not the private range; 10.0.0.0/8 is the private one.",
    ],
  },
  {
    q: "Why does subnetting exist?",
    a: [
      "To break a large network into smaller ones — one broadcast domain per subnet.",
      "To match the number of hosts to the actual need, avoiding address waste.",
      "To create a clear boundary between local and remote traffic, using a default gateway.",
    ],
  },
  {
    q: "Explain the difference between FLSM and VLSM.",
    a: [
      "FLSM — Fixed Length Subnet Mask — every subnet is the same size.",
      "VLSM — Variable Length Subnet Mask — each subnet gets exactly the size it needs.",
      "VLSM saves addresses; FLSM is simpler but wasteful when needs differ.",
    ],
  },
  {
    q: "How do you quickly find the network and broadcast of an address?",
    a: [
      "Convert the prefix to a dotted mask, e.g. /26 = 255.255.255.192.",
      "Find the interesting octet (where the mask is not 0 or 255), and compute block size = 256 − mask value.",
      "Subnets start at multiples of the block size. The network is the block start; the broadcast is the next block start minus one.",
    ],
  },
  {
    q: "For 192.168.10.77/26, what are the network and broadcast?",
    a: [
      "/26 → mask 255.255.255.192 → block size 64.",
      "Subnets start at .0, .64, .128, .192. .77 falls in the .64 block.",
      "Network: 192.168.10.64. Broadcast: 192.168.10.127. Usable hosts: .65 to .126, which is 62 hosts.",
    ],
  },
  {
    q: "Why are two addresses reserved in every subnet?",
    a: [
      "The first address is the network address — all host bits set to 0.",
      "The last address is the broadcast address — all host bits set to 1.",
      "Neither is assigned to a host, which is why usable = 2^(host bits) − 2.",
    ],
  },
  {
    q: "What is IANA, and how does allocation work?",
    a: [
      "IANA (Internet Assigned Numbers Authority) is the top-level coordinator of IP addresses, ASNs, and protocol parameters.",
      "Allocation flows IANA → RIRs → ISPs → end customers.",
      "This hierarchy is why address classes and private ranges are globally consistent.",
    ],
  },
  {
    q: "What happens if two devices have the same IP?",
    a: [
      "An IP conflict occurs. Frames may be sent to the wrong device or dropped.",
      "The network usually shows intermittent connectivity, not a clean failure — that makes it tricky to diagnose.",
      "Tools: arp -a, ping duplicates, DHCP lease logs.",
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
  { id: "visualizer", label: "Subnet Visualizer" },
  { id: "prep", label: "Interview Prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function IpAddressingSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <div className="ip-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{IP_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 05 · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          IP Addressing & Subnetting
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Logical addressing, CIDR notation, and the binary math behind
          efficient networks — with a live subnet visualizer.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="IP addressing sections"
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
        {tab === "visualizer" && <SubnetVisualizerTab />}
        {tab === "prep" && <InterviewPrepTab />}
      </div>
    </div>
  );
}