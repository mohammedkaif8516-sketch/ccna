"use client";

import { useState } from "react";
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
 * IpAddressingExplainer  (CCNA Topic 05)
 *   1 Big picture        : two sides of an address, the mask line, IPv4 vs IPv6
 *   2 Classes and ranges : class explorer, address checker, private and special ranges
 *   3 Powers of two      : hosts per prefix, formulas, "how many hosts do I need?"
 *   4 Subnet visualizer  : type any address and prefix, see everything
 *   5 Step by step       : the six-step subnetting method on a live example
 *   6 FLSM vs VLSM       : same job, two ways, see the waste
 *   7 Common mistakes    : wrong belief on the front, the truth on the back
 *   8 Interview prep     : 30-second answer and the usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";

const TABS = [
  { id: "big", label: "1 · Big picture" },
  { id: "classes", label: "2 · Classes and ranges" },
  { id: "powers", label: "3 · Powers of two" },
  { id: "viz", label: "4 · Subnet visualizer" },
  { id: "steps", label: "5 · Step by step" },
  { id: "vlsm", label: "6 · FLSM vs VLSM" },
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

function SimpleTable({ head, rows, hit }: { head: string[]; rows: string[][]; hit?: number }) {
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
            <tr key={i} className="border-t" style={hit === i ? { color: GREEN, fontWeight: 600 } : undefined}>
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
      <p className="break-words font-mono text-xs font-semibold" style={color ? { color } : undefined}>{v}</p>
    </div>
  );
}

/* ───────────────────────── IP maths ───────────────────────── */

const toInt = (o: number[]) => (((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0);
const toIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
const maskInt = (p: number) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
const bitAt = (n: number, i: number) => (n >>> (31 - i)) & 1;

function parseIp(s: string): number[] | null {
  const parts = s.trim().split(".");
  if (parts.length !== 4) return null;
  const o = parts.map((x) => (/^\d{1,3}$/.test(x) ? Number(x) : NaN));
  return o.some((x) => Number.isNaN(x) || x > 255) ? null : o;
}

function calc(octets: number[], p: number) {
  const ip = toInt(octets);
  const m = maskInt(p);
  const net = (ip & m) >>> 0;
  const bc = (net | (~m >>> 0)) >>> 0;
  const total = 2 ** (32 - p);
  const usable = p === 32 ? 1 : p === 31 ? 2 : total - 2;
  const first = p >= 31 ? net : net + 1;
  const last = p === 32 ? net : p === 31 ? bc : bc - 1;
  const oct = p >= 32 ? 4 : Math.min(4, Math.floor(p / 8) + 1);
  const maskOctets = [m >>> 24, (m >>> 16) & 255, (m >>> 8) & 255, m & 255];
  const mv = maskOctets[oct - 1];
  const block = 256 - mv;
  return { ip, m, net, bc, total, usable, first, last, oct, mv, block, maskOctets, ipOctets: octets };
}

function classify(o: number[]) {
  const [a, b] = o;
  const isPrivate = a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  let cls = "";
  let kind = "";
  if (o.every((x) => x === 255)) { cls = "E (range)"; kind = "Limited broadcast (255.255.255.255)"; }
  else if (a === 0) { cls = "Reserved"; kind = o.every((x) => x === 0) ? "This host / any interface (0.0.0.0)" : "Reserved (0.0.0.0/8)"; }
  else if (a === 127) { cls = "A range"; kind = "Loopback (127.0.0.0/8). The device talks to itself."; }
  else if (a === 169 && b === 254) { cls = "B"; kind = "Link-local / APIPA (169.254.0.0/16). DHCP failed."; }
  else if (a <= 126) { cls = "A"; kind = isPrivate ? "Private (10.0.0.0/8)" : "Public unicast"; }
  else if (a <= 191) { cls = "B"; kind = isPrivate ? "Private (172.16.0.0/12)" : "Public unicast"; }
  else if (a <= 223) { cls = "C"; kind = isPrivate ? "Private (192.168.0.0/16)" : "Public unicast"; }
  else if (a <= 239) { cls = "D"; kind = "Multicast group (224.0.0.0/4)"; }
  else { cls = "E"; kind = "Reserved for research / experimental"; }
  return { cls, kind, isPrivate };
}

function Bits({ ip, p, small = false }: { ip: number; p: number; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono">
      {[0, 1, 2, 3].map((g) => (
        <div key={g} className="flex gap-px">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const i = g * 8 + k;
            const net = i < p;
            return (
              <span
                key={i}
                className={`flex items-center justify-center rounded-sm ${small ? "h-5 w-3.5 text-[10px]" : "h-6 w-4 text-xs"}`}
                style={{ background: net ? `${BLUE}22` : `${AMBER}22`, color: net ? BLUE : AMBER, fontWeight: 600 }}
              >
                {bitAt(ip, i)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
      <span><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: BLUE }} />network bits</span>
      <span><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: AMBER }} />host bits</span>
    </div>
  );
}

/* ───────────────────────── 1 · big picture ───────────────────────── */

const V6 = [
  ["Size", "32 bits, about 4.3 billion addresses", "128 bits, about 3.4 x 10^38 addresses"],
  ["Notation", "Four decimal octets: 8.8.8.8", "Eight hex fields: AD12:1306:1034:0000:1111:2222:3333:4444"],
  ["Structure", "Each octet is 8 bits (8 = 00001000)", "Each field is 16 bits"],
  ["Broadcast", "Yes", "No. Uses multicast and anycast instead."],
  ["Header", "Variable length, more fields", "Fixed length, simpler"],
];

function BigSection() {
  const [p, setP] = useState(24);
  const [v, setV] = useState<"4" | "6">("4");
  const ip = toInt([192, 168, 1, 1]);
  const o = [192, 168, 1, 1];
  const split = (i: number) => {
    const lo = i * 8;
    const bitsNet = Math.max(0, Math.min(8, p - lo));
    return bitsNet === 8 ? "net" : bitsNet === 0 ? "host" : "mixed";
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">An IP address is a logical address with two sides</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The network engineer (or DHCP) assigns it to identify a device. The <span className="font-semibold text-foreground">network side</span> says
          which network the device is on. The <span className="font-semibold text-foreground">host side</span> says which device on that network.
          The subnet mask draws the line between them.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">Logical: it can change, unlike a MAC address</Badge>
          <Badge variant="secondary">Layer 3 of OSI</Badge>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Move the line</p>
        <p className="mt-1 text-xs text-muted-foreground">Drag the prefix. The mask decides where the network side ends.</p>
        <input
          type="range"
          min={8}
          max={30}
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          className="mt-3 w-full accent-primary"
          aria-label="Prefix length"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">/{p}</Badge>
          <span className="font-mono text-xs">{toIp(maskInt(p))}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 font-mono text-lg font-bold">
          {o.map((x, i) => {
            const s = split(i);
            return (
              <span key={i} className="flex items-center gap-2">
                <span style={{ color: s === "net" ? BLUE : s === "host" ? AMBER : PURPLE }}>{x}</span>
                {i < 3 && <span className="text-muted-foreground">.</span>}
              </span>
            );
          })}
        </div>
        <div className="mt-2"><Bits ip={ip} p={p} /></div>
        <div className="mt-2"><Legend /></div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold" style={{ color: BLUE }}>{p} network bits</span> and{" "}
          <span className="font-semibold" style={{ color: AMBER }}>{32 - p} host bits</span>.
          {p % 8 !== 0 && <> Purple means the line cuts through the middle of that octet.</>}
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">IPv4 vs IPv6</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={v === "4"} onClick={() => setV("4")}>IPv4</Pick>
          <Pick active={v === "6"} onClick={() => setV("6")}>IPv6</Pick>
        </div>
        <div key={v} className="n5-fade mt-3 flex flex-col gap-3">
          {v === "4" ? (
            <>
              <p className="font-mono text-sm">8.8.8.8 = 00001000.00001000.00001000.00001000</p>
              <p className="text-xs leading-5 text-muted-foreground">Four octets, each 0 to 255, separated by dots. 32 bits in total.</p>
            </>
          ) : (
            <>
              <p className="break-all font-mono text-sm">AD12:1306:1034:0000:1111:2222:3333:4444</p>
              <p className="text-xs leading-5 text-muted-foreground">Eight fields of 16 bits each, in hexadecimal, separated by colons. 128 bits in total.</p>
              <Bullets items={["Drop leading zeros in a field: 0000 becomes 0, 0db8 becomes db8.", "Replace one run of all-zero fields with :: (only once per address). 2001:0db8:0000:0000:0000:0000:0000:0001 becomes 2001:db8::1."]} />
            </>
          )}
        </div>
        <div className="mt-3">
          <SimpleTable head={["", "IPv4", "IPv6"]} rows={V6} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Why subnets exist</p>
        <div className="mt-2">
          <Bullets
            items={[
              "Without subnets, every device sits in one giant network and broadcasts reach everyone.",
              "Address blocks would be handed out in wasteful chunks.",
              "There would be no simple way to tell local from remote traffic.",
              "Subnetting makes smaller networks: one broadcast domain and one default gateway each, sized to the real need.",
            ]}
          />
        </div>
      </Panel>

      <Tip>The mask is not decoration. It is the rule that decides which part of an IP is network and which part is host. Everything else follows from that.</Tip>
    </div>
  );
}

/* ───────────────────────── 2 · classes and ranges ───────────────────────── */

const CLASSES = [
  { c: "A", first: "1 to 126", mask: "255.0.0.0", pre: "/8", struct: ["N", "H", "H", "H"], hosts: "16,777,214", note: "10.0.0.0/8 is private. 127.0.0.0/8 is loopback. The rest is public." },
  { c: "B", first: "128 to 191", mask: "255.255.0.0", pre: "/16", struct: ["N", "N", "H", "H"], hosts: "65,534", note: "172.16.0.0/12 (172.16 to 172.31) is the private slice." },
  { c: "C", first: "192 to 223", mask: "255.255.255.0", pre: "/24", struct: ["N", "N", "N", "H"], hosts: "254", note: "192.168.0.0/16 is the private slice." },
  { c: "D", first: "224 to 239", mask: "none", pre: "none", struct: ["M", "M", "M", "M"], hosts: "none", note: "Multicast. No network, host or broadcast. Each address is a group." },
  { c: "E", first: "240 to 255", mask: "none", pre: "none", struct: ["R", "R", "R", "R"], hosts: "none", note: "Reserved for research and experiments." },
];

const PRIVATE = [
  ["10.0.0.0/8", "A", "10.0.0.0 to 10.255.255.255", "16,777,216"],
  ["172.16.0.0/12", "B", "172.16.0.0 to 172.31.255.255", "1,048,576"],
  ["192.168.0.0/16", "C", "192.168.0.0 to 192.168.255.255", "65,536"],
];

const SPECIAL = [
  ["127.0.0.0/8", "Loopback. The device tests itself (127.0.0.1)."],
  ["169.254.0.0/16", "Link-local (APIPA). A host gives itself one when DHCP fails."],
  ["0.0.0.0", "This host, or any interface."],
  ["255.255.255.255", "Limited broadcast. Stays on the local network."],
  ["224.0.0.0/4", "Class D multicast groups."],
];

function ClassesSection() {
  const [sel, setSel] = useState(2);
  const [txt, setTxt] = useState("172.20.5.9");
  const k = CLASSES[sel];
  const o = parseIp(txt);
  const r = o ? classify(o) : null;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">The five classes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CLASSES.map((x, i) => (
            <Pick key={x.c} active={sel === i} onClick={() => setSel(i)}>Class {x.c}</Pick>
          ))}
        </div>
        <div key={sel} className="n5-fade mt-3 flex flex-col gap-3">
          <div className="flex gap-1.5">
            {k.struct.map((s, i) => (
              <span
                key={i}
                className="flex h-9 w-14 items-center justify-center rounded-md border font-mono text-xs font-bold"
                style={{ color: s === "N" ? BLUE : s === "H" ? AMBER : PURPLE, borderColor: s === "N" ? BLUE : s === "H" ? AMBER : PURPLE }}
              >
                {s === "N" ? "Network" : s === "H" ? "Host" : s === "M" ? "Group" : "Reserved"}
              </span>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <Mini k="First octet" v={k.first} />
            <Mini k="Default mask" v={k.mask} />
            <Mini k="Prefix" v={k.pre} />
            <Mini k="Usable hosts" v={k.hosts} color={GREEN} />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{k.note}</p>
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            1 to 126 skips 127 on purpose: 127 is loopback. Classes are legacy vocabulary. Real networks use CIDR, where any prefix length is allowed.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Check an address</p>
        <input
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm"
          placeholder="e.g. 192.168.1.1"
          aria-label="IPv4 address"
        />
        {r ? (
          <div className="n5-fade mt-3 grid gap-2 sm:grid-cols-3">
            <Mini k="Class" v={r.cls} />
            <Mini k="Type" v={r.kind} color={r.isPrivate ? AMBER : GREEN} />
            <Mini k="Internet-routable?" v={r.isPrivate || r.cls.startsWith("Reserved") ? "No (needs NAT)" : o![0] === 127 || (o![0] === 169 && o![1] === 254) ? "No" : o![0] >= 224 ? "Special use" : "Yes"} />
          </div>
        ) : (
          <p className="mt-3 text-xs" style={{ color: RED }}>Enter four numbers from 0 to 255, separated by dots.</p>
        )}
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Private ranges</p>
        <div className="mt-3">
          <SimpleTable head={["Range", "Class", "Spans", "Addresses"]} rows={PRIVATE} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Private addresses are not routable on the internet. To go out, they need NAT to be translated to a public address. All the rest of Class A, B and C is public.
        </p>
        <div className="mt-3">
          <Tip>Memory hook: 10 (one block of 8), 172.16 (/12, so 16 to 31), 192.168 (/16).</Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Special addresses</p>
        <div className="mt-3">
          <SimpleTable head={["Address", "What it is"]} rows={SPECIAL} />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 3 · powers of two ───────────────────────── */

const FORMULAS = [
  ["Total addresses", "2^(32 − prefix)"],
  ["Usable hosts", "2^(32 − prefix) − 2"],
  ["Block size", "256 − mask value in the interesting octet"],
  ["Network address", "IP AND mask"],
  ["Broadcast address", "Network OR inverse mask"],
  ["Number of subnets", "2^(borrowed bits)"],
];

const PREFIXES = [32, 31, 30, 29, 28, 27, 26, 25, 24];

function PowersSection() {
  const [pi, setPi] = useState(8);
  const [need, setNeed] = useState("50");
  const p = PREFIXES[pi];
  const total = 2 ** (32 - p);
  const n = Number(need);
  const valid = Number.isInteger(n) && n >= 1 && n <= 1_000_000;
  const hb = valid ? Math.ceil(Math.log2(n + 2)) : 0;
  const np = 32 - hb;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Hosts per prefix</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap a prefix. The pattern: each step smaller doubles the addresses.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PREFIXES.map((x, i) => (
            <Pick key={x} active={pi === i} onClick={() => setPi(i)}>/{x}</Pick>
          ))}
        </div>
        <div key={p} className="n5-fade mt-3 grid gap-2 sm:grid-cols-4">
          <Mini k="Mask" v={toIp(maskInt(p))} />
          <Mini k="Addresses" v={`2^${32 - p} = ${total}`} />
          <Mini k="Usable hosts" v={p === 32 ? "1 (single host)" : p === 31 ? "2 (point-to-point only)" : String(total - 2)} color={GREEN} />
          <Mini k="Block size (last octet)" v={String(256 - (maskInt(p) & 255))} />
        </div>
        <div className="mt-3">
          <SimpleTable
            head={["Prefix", "Mask", "Addresses", "Usable hosts"]}
            rows={PREFIXES.map((x) => [
              `/${x}`,
              toIp(maskInt(x)),
              `2^${32 - x} = ${2 ** (32 - x)}`,
              x === 32 ? "1" : x === 31 ? "2 (RFC 3021)" : String(2 ** (32 - x) - 2),
            ])}
            hit={pi}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Rule">Usable hosts = addresses − 2 (network and broadcast). /24 is the Class C boundary.</Tip>
          <Tip title="Careful">
            Classic rule: /31 has no usable hosts. RFC 3021 allows /31 on point-to-point links, with both addresses usable. /32 is a single host address, like a loopback.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">How many hosts do I need?</p>
        <input
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          inputMode="numeric"
          className="mt-2 w-40 rounded-lg border bg-background px-3 py-2 font-mono text-sm"
          aria-label="Hosts needed"
        />
        {valid ? (
          <div className="n5-fade mt-3 flex flex-col gap-2">
            <div className="grid gap-2 sm:grid-cols-4">
              <Mini k="Host bits needed" v={String(hb)} />
              <Mini k="Prefix" v={`/${np}`} color={GREEN} />
              <Mini k="Usable hosts" v={String(2 ** hb - 2)} />
              <Mini k="Spare" v={String(2 ** hb - 2 - n)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Add 2 for network and broadcast ({n} + 2 = {n + 2}), then find the next power of two: 2^{hb} = {2 ** hb}. So {hb} host bits, so /{np}.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs" style={{ color: RED }}>Enter a whole number from 1 to 1,000,000.</p>
        )}
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Key formulas</p>
        <div className="mt-3">
          <SimpleTable head={["Formula", "Expression"]} rows={FORMULAS} />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 4 · subnet visualizer ───────────────────────── */

function VizSection() {
  const [txt, setTxt] = useState("192.168.10.77");
  const [pre, setPre] = useState(26);
  const o = parseIp(txt);
  const c = o ? calc(o, pre) : null;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Subnet visualizer</p>
        <p className="mt-1 text-xs text-muted-foreground">Type any IPv4 address and choose a prefix.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
            className="w-44 rounded-lg border bg-background px-3 py-2 font-mono text-sm"
            aria-label="IPv4 address"
          />
          <span className="font-mono text-lg">/</span>
          <input
            type="number"
            min={0}
            max={32}
            value={pre}
            onChange={(e) => setPre(Math.max(0, Math.min(32, Number(e.target.value) || 0)))}
            className="w-20 rounded-lg border bg-background px-3 py-2 font-mono text-sm"
            aria-label="Prefix length"
          />
        </div>
        <input
          type="range"
          min={0}
          max={32}
          value={pre}
          onChange={(e) => setPre(Number(e.target.value))}
          className="mt-3 w-full accent-primary"
          aria-label="Prefix slider"
        />
      </Panel>

      {!c ? (
        <p className="text-xs" style={{ color: RED }}>Enter four numbers from 0 to 255, separated by dots.</p>
      ) : (
        <div className="n5-fade flex flex-col gap-4">
          <Panel>
            <p className="text-sm font-semibold">Binary split</p>
            <div className="mt-3 flex flex-col gap-2">
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">IP address</p>
                <Bits ip={c.ip} p={pre} />
              </div>
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">Mask ({toIp(c.m)})</p>
                <Bits ip={c.m} p={pre} />
              </div>
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">Network address (host bits all 0)</p>
                <Bits ip={c.net} p={pre} />
              </div>
              <div>
                <p className="mb-1 text-[11px] text-muted-foreground">Broadcast address (host bits all 1)</p>
                <Bits ip={c.bc} p={pre} />
              </div>
            </div>
            <div className="mt-3"><Legend /></div>
          </Panel>

          <Panel>
            <div className="grid gap-2 sm:grid-cols-2">
              <Mini k="Network address" v={`${toIp(c.net)}/${pre}`} color={BLUE} />
              <Mini k="Broadcast address" v={toIp(c.bc)} color={RED} />
              <Mini k="First host" v={toIp(c.first)} color={GREEN} />
              <Mini k="Last host" v={toIp(c.last)} color={GREEN} />
              <Mini k="Subnet mask" v={toIp(c.m)} />
              <Mini k="Wildcard (inverse) mask" v={toIp(~c.m >>> 0)} />
              <Mini k="Total addresses" v={String(c.total)} />
              <Mini k="Usable hosts" v={String(c.usable)} />
            </div>
            {pre >= 31 && (
              <div className="mt-3">
                <Tip title="Note">
                  {pre === 32 ? "/32 is a single host address. There is no network or broadcast." : "/31 is for point-to-point links (RFC 3021). Both addresses are usable, with no network or broadcast."}
                </Tip>
              </div>
            )}
          </Panel>

          <Panel>
            <p className="text-sm font-semibold">Block math</p>
            <div className="mt-2">
              <Bullets
                items={[
                  `Interesting octet = #${c.oct} (mask value ${c.mv}).`,
                  `Block size = 256 − ${c.mv} = ${c.block}.`,
                  `Subnets begin at multiples of ${c.block} in octet ${c.oct}.`,
                  `${toIp(c.ip)} falls in the block starting at ${toIp(c.net)}.`,
                ]}
              />
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── 5 · step by step ───────────────────────── */

const PRESETS = [
  { ip: "192.168.10.77", p: 26 },
  { ip: "172.16.45.200", p: 20 },
  { ip: "10.1.5.130", p: 27 },
];

function StepsSection() {
  const [pi, setPi] = useState(0);
  const [i, setI] = useState(0);
  const pr = PRESETS[pi];
  const o = parseIp(pr.ip)!;
  const c = calc(o, pr.p);
  const octVal = o[c.oct - 1];
  const start = Math.floor(octVal / c.block) * c.block;
  const mults: number[] = [];
  for (let v = 0; v < 256 && mults.length < 6; v += c.block) mults.push(v);
  const more = 256 / c.block > mults.length;

  const STEPS = [
    {
      t: "Write the IP and mask",
      d: `Start with ${pr.ip}/${pr.p}. Convert the prefix to a dotted mask: /${pr.p} = ${toIp(c.m)}.`,
    },
    {
      t: "Find the interesting octet",
      d: `It is the octet where the mask is neither 255 nor 0 (for an exact /8, /16 or /24, it is the first octet with mask 0). Here it is octet ${c.oct}, with mask value ${c.mv}.`,
    },
    {
      t: "Calculate the block size",
      d: `Block size = 256 − mask value = 256 − ${c.mv} = ${c.block}. Every subnet grows by ${c.block} in octet ${c.oct}.`,
    },
    {
      t: "Locate the subnet boundaries",
      d: `Subnets start at multiples of ${c.block}: ${mults.join(", ")}${more ? ", ..." : ""}. Our octet is ${octVal}, so it falls in the block that starts at ${start}.`,
    },
    {
      t: "Derive network and broadcast",
      d: `Network = first address of the block = ${toIp(c.net)}. Broadcast = last address of the block = ${toIp(c.bc)} (next block start minus one).`,
    },
    {
      t: "List the usable host range",
      d: `Usable hosts sit strictly between network and broadcast: ${toIp(c.first)} to ${toIp(c.last)}. That is ${c.usable} usable hosts.`,
    },
  ];
  const s = STEPS[i];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Pick an example</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((x, k) => (
            <Pick key={x.ip} active={pi === k} onClick={() => { setPi(k); setI(0); }}>{x.ip}/{x.p}</Pick>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STEPS.map((_, k) => (
            <Pick key={k} active={k === i} onClick={() => setI(k)}>{k + 1}</Pick>
          ))}
        </div>
      </Panel>

      <Panel>
        <div key={`${pi}-${i}`} className="n5-fade flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">Step {i + 1} of {STEPS.length}</p>
            <Badge variant="secondary">{pr.ip}/{pr.p}</Badge>
          </div>
          <p className="text-sm font-semibold">{s.t}</p>
          <p className="text-xs leading-5 text-muted-foreground">{s.d}</p>

          {i >= 3 && (
            <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
              <p className="mb-2 text-[11px] text-muted-foreground">Octet {c.oct} from 0 to 255, split into blocks of {c.block}</p>
              <div className="flex min-w-max gap-1">
                {Array.from({ length: Math.min(256 / c.block, 16) }, (_, k) => {
                  const b = k * c.block;
                  const here = b === start;
                  return (
                    <div
                      key={b}
                      className="rounded-md border px-2 py-2 text-center font-mono text-[11px]"
                      style={{ borderColor: here ? GREEN : undefined, background: here ? `${GREEN}18` : undefined, color: here ? GREEN : undefined, fontWeight: here ? 700 : 400 }}
                    >
                      {b}
                    </div>
                  );
                })}
                {256 / c.block > 16 && <span className="self-center text-xs text-muted-foreground">...</span>}
              </div>
            </div>
          )}
          {i === 4 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Mini k="Network" v={toIp(c.net)} color={BLUE} />
              <Mini k="Broadcast" v={toIp(c.bc)} color={RED} />
            </div>
          )}
          {i === 5 && (
            <div className="grid gap-2 sm:grid-cols-3">
              <Mini k="First host" v={toIp(c.first)} color={GREEN} />
              <Mini k="Last host" v={toIp(c.last)} color={GREEN} />
              <Mini k="Usable hosts" v={String(c.usable)} />
            </div>
          )}
        </div>
      </Panel>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>Back</Button>
        <Button size="sm" disabled={i === STEPS.length - 1} onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}>Next step</Button>
      </div>

      <Tip>Every subnet question is the same: read the mask, find the block size, locate the address inside its block, derive the two endpoints.</Tip>
    </div>
  );
}

/* ───────────────────────── 6 · FLSM vs VLSM ───────────────────────── */

const NEEDS = [
  { name: "Sales", h: 60 },
  { name: "Engineering", h: 30 },
  { name: "Guests", h: 20 },
  { name: "Servers", h: 10 },
];

function allocate(mode: "flsm" | "vlsm") {
  const maxBits = Math.ceil(Math.log2(Math.max(...NEEDS.map((n) => n.h)) + 2));
  let off = 0;
  return NEEDS.map((n) => {
    const bits = mode === "flsm" ? maxBits : Math.ceil(Math.log2(n.h + 2));
    const size = 2 ** bits;
    const row = { ...n, start: off, size, prefix: 32 - bits, usable: size - 2 };
    off += size;
    return row;
  });
}

function VlsmSection() {
  const [mode, setMode] = useState<"flsm" | "vlsm">("flsm");
  const rows = allocate(mode);
  const used = rows.reduce((a, r) => a + r.size, 0);
  const wasted = rows.reduce((a, r) => a + (r.usable - r.h), 0);
  const COL = [BLUE, GREEN, AMBER, PURPLE];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">One job, two ways</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Split 192.168.10.0/24 for four departments: Sales 60 hosts, Engineering 30, Guests 20, Servers 10.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={mode === "flsm"} onClick={() => setMode("flsm")}>FLSM: all the same size</Pick>
          <Pick active={mode === "vlsm"} onClick={() => setMode("vlsm")}>VLSM: size to need</Pick>
        </div>

        <div key={mode} className="n5-fade mt-3 flex flex-col gap-3">
          <div className="flex h-8 overflow-hidden rounded-lg border bg-muted/40">
            {rows.map((r, k) => (
              <div
                key={r.name}
                className="flex items-center justify-center text-[10px] font-semibold text-white"
                style={{ width: `${(r.size / 256) * 100}%`, background: COL[k] }}
                title={`${r.name}: ${r.size} addresses`}
              >
                {r.size >= 32 ? r.name : ""}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Bar = the 256 addresses of the /24. Grey space on the right is still free.</p>

          <SimpleTable
            head={["Subnet", "Needs", "Network", "Usable", "Wasted"]}
            rows={rows.map((r) => [r.name, String(r.h), `192.168.10.${r.start}/${r.prefix}`, String(r.usable), String(r.usable - r.h)])}
          />

          <div className="grid gap-2 sm:grid-cols-3">
            <Mini k="Addresses used" v={`${used} of 256`} />
            <Mini k="Addresses still free" v={String(256 - used)} color={GREEN} />
            <Mini k="Unused hosts inside subnets" v={String(wasted)} color={wasted > 40 ? RED : GREEN} />
          </div>
        </div>
      </Panel>

      <Tip>
        FLSM is simple but wasteful when needs differ, because every subnet must fit the biggest one. VLSM gives each subnet exactly the size it needs and saves addresses. With VLSM, allocate the biggest subnet first.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 7 · common mistakes ───────────────────────── */

const MYTHS = [
  { wrong: "The IP address alone tells you the network.", right: "You need the address AND the mask. 10.0.0.1 could be one network of 16 million hosts, or thousands of small ones. The mask decides." },
  { wrong: "Class A, B and C still control how networks are assigned.", right: "Classful addressing is legacy. Real networks use CIDR, where any prefix length is allowed. Classes are still useful vocabulary and for spotting private ranges." },
  { wrong: "127.0.0.0/8 is the private range for Class A.", right: "10.0.0.0/8 is the private range. 127.0.0.0/8 is loopback: the device talking to itself." },
  { wrong: "IPv6 is just IPv4 with more addresses.", right: "IPv6 is a different protocol: 128-bit addresses, hexadecimal, no broadcast (multicast and anycast instead), and a simpler header." },
  { wrong: "The first and last address of a subnet are usable.", right: "The first is the network address and the last is the broadcast address. Neither is given to a host on a normal subnet." },
  { wrong: "VLSM wastes more than FLSM.", right: "FLSM makes every subnet the same size, which wastes addresses when needs differ. VLSM gives each subnet what it needs, so it saves addresses." },
  { wrong: "Block size equals the mask value.", right: "Block size = 256 minus the mask value in the interesting octet. A /26 has mask value 192, so the block size is 64, not 192." },
  { wrong: "Two devices with the same IP just share it.", right: "It causes an IP conflict. Traffic may go to the wrong device or fail, so connectivity becomes intermittent for one or both hosts." },
  { wrong: "Any private IP can talk to the internet directly.", right: "Private addresses are not routable on the internet. NAT must translate them to a public address first." },
  { wrong: "IANA hands IP addresses straight to end customers.", right: "IANA gives large blocks to the five RIRs (ARIN, RIPE NCC, APNIC, LACNIC, AFRINIC). RIRs give blocks to ISPs, and ISPs give addresses to customers." },
  { wrong: "A /24 has 256 hosts.", right: "A /24 has 256 addresses but 254 usable hosts, because the network and broadcast addresses are not assigned to hosts." },
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
                <div className="n5-fade mt-3 border-t pt-3">
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
  { q: "What is an IP address, and why does it have two sides?", a: ["It is a logical address assigned to a device so other devices can find it.", "Every address has a network side (which network) and a host side (which device on that network).", "The subnet mask draws the line between them."] },
  { q: "Compare IPv4 and IPv6.", a: ["IPv4 is 32 bits, written as four decimal octets, about 4.3 billion addresses.", "IPv6 is 128 bits, written in hexadecimal as 8 fields of 16 bits.", "IPv6 also removes broadcast (it uses multicast and anycast) and has a simpler header."] },
  { q: "Name the IP address classes and their ranges.", a: ["A: 1 to 126, default mask /8.", "B: 128 to 191, default mask /16.", "C: 192 to 223, default mask /24.", "D: 224 to 239, multicast. E: 240 to 255, reserved for research.", "127 is skipped because it is loopback."] },
  { q: "What are the private IP ranges?", a: ["10.0.0.0/8 (inside Class A).", "172.16.0.0/12, which is 172.16.0.0 to 172.31.255.255 (inside Class B).", "192.168.0.0/16 (inside Class C).", "They are not routable on the internet and need NAT to reach it."] },
  { q: "What is 127.0.0.0/8?", a: ["The loopback range: the device talking to itself.", "127.0.0.1 is the classic address, used to test the local TCP/IP stack.", "It is not the private range. 10.0.0.0/8 is."] },
  { q: "What is 169.254.0.0/16?", a: ["The link-local range, also called APIPA.", "A host gives itself an address from it when DHCP fails. Seeing one usually means the DHCP server is unreachable."] },
  { q: "Why does subnetting exist?", a: ["To break a large network into smaller ones, each with its own broadcast domain.", "To match the size of each network to the real need and avoid wasting addresses.", "To create a clear boundary between local and remote traffic through a default gateway."] },
  { q: "Explain the difference between FLSM and VLSM.", a: ["FLSM (Fixed Length Subnet Mask): every subnet is the same size.", "VLSM (Variable Length Subnet Mask): each subnet gets exactly the size it needs.", "VLSM saves addresses. FLSM is simpler but wasteful when needs differ."] },
  { q: "How do you quickly find the network and broadcast of an address?", a: ["Convert the prefix to a dotted mask, for example /26 = 255.255.255.192.", "Find the interesting octet and calculate block size = 256 − mask value.", "Subnets start at multiples of the block size. The network is the start of the block. The broadcast is the next block start minus one."] },
  { q: "For 192.168.10.77/26, what are the network and broadcast?", a: ["/26 gives mask 255.255.255.192 and block size 64.", "Subnets start at .0, .64, .128, .192. The address .77 falls in the .64 block.", "Network: 192.168.10.64. Broadcast: 192.168.10.127. Usable: .65 to .126, which is 62 hosts."] },
  { q: "Why are two addresses reserved in every subnet?", a: ["The first is the network address: all host bits are 0.", "The last is the broadcast address: all host bits are 1.", "Neither is given to a host, which is why usable hosts = 2^(host bits) − 2. (/31 and /32 are special cases.)"] },
  { q: "How many hosts do you need a /27 for 25 devices?", a: ["25 + 2 = 27, and the next power of two is 32 = 2^5, so 5 host bits.", "32 − 5 = /27, which gives 30 usable hosts."] },
  { q: "What is IANA, and how does allocation work?", a: ["IANA (Internet Assigned Numbers Authority) coordinates IP addresses, AS numbers and protocol parameters at the top level.", "Blocks flow from IANA to the five RIRs, then to ISPs, then to customers. India falls under APNIC.", "This keeps the global address space consistent."] },
  { q: "What happens if two devices have the same IP?", a: ["An IP conflict. Traffic can go to the wrong device or be lost.", "Symptoms are usually intermittent connectivity, not a clean failure, which makes it tricky to diagnose.", "Check with arp -a (look for the same IP with different MACs), the DHCP lease logs, and the OS conflict warning."] },
];

function InterviewSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          An IP address is a logical address with two sides: a network side and a host side. The subnet mask draws the line
          between them. IPv4 is 32 bits written as four decimal octets. IPv6 is 128 bits written in hexadecimal. Classful
          addressing splits IPv4 into five classes: A, B and C are unicast, D is multicast, E is research. Each of A, B and C
          has a private slice (10/8, 172.16/12, 192.168/16) that is not routable on the public internet. Subnetting divides a
          big network into smaller ones to control broadcast size and avoid wasting addresses. FLSM uses equal-size subnets,
          VLSM matches size to need. Every subnet has a network address, a broadcast address, and a usable host range strictly
          between them.
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
                <ul className="n5-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">Read the mask, find the block size, locate the block, derive network and broadcast. Usable = addresses − 2.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function IpAddressingSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n5-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .n5-fade { animation: n5-fade .5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .n5-fade { animation: none; opacity: 1; } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 05: IP addressing and subnetting</CardTitle>
            <CardDescription className="mt-1">
              Addresses, masks, classes and subnets. Eight short sections, tap through them in any order.
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
          {tab === "classes" && <ClassesSection />}
          {tab === "powers" && <PowersSection />}
          {tab === "viz" && <VizSection />}
          {tab === "steps" && <StepsSection />}
          {tab === "vlsm" && <VlsmSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}