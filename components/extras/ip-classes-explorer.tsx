"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * IpClassesExplorer
 * 1. A bar for the whole first-octet space (0–255). Each class gets a slice
 *    sized by how many first-octet values it owns. Click a slice to load an
 *    example address.
 * 2. Type any IPv4 address: a marker lands on the bar, the class lights up, and
 *    the address is split into Network (N) and Host (H) octets with its default mask.
 * 3. For classes A, B and C the network, host range, broadcast and usable hosts
 *    are worked out. For D and E it explains why none of those exist.
 */

type ClassId = "A" | "B" | "C" | "D" | "E";

type ClassInfo = {
  id: ClassId;
  color: string;
  first: number; // first value of the first octet
  last: number; // last value of the first octet
  shownRange: string; // what to say in the table
  fullRange: string;
  leadingBits: string; // fixed leading bits of the first octet
  hostOctets: number; // 0 for D and E
  mask: string;
  cidr: string;
  structure: string;
  purpose: string;
  example: string;
  facts: string[];
};

const CLASSES: ClassInfo[] = [
  {
    id: "A",
    color: "#1971c2",
    first: 0,
    last: 127,
    shownRange: "1 – 126",
    fullRange: "1.0.0.0 – 126.255.255.255",
    leadingBits: "0",
    hostOctets: 3,
    mask: "255.0.0.0",
    cidr: "/8",
    structure: "N | H | H | H",
    purpose: "Unicast, for very large networks",
    example: "10.20.30.40",
    facts: [
      "10.0.0.0/8 is a private network.",
      "127.0.0.0/8 is the loopback range (127.0.0.1 – 127.255.255.255).",
      "The rest of Class A is public.",
    ],
  },
  {
    id: "B",
    color: "#2f9e44",
    first: 128,
    last: 191,
    shownRange: "128 – 191",
    fullRange: "128.0.0.0 – 191.255.255.255",
    leadingBits: "10",
    hostOctets: 2,
    mask: "255.255.0.0",
    cidr: "/16",
    structure: "N | N | H | H",
    purpose: "Unicast, for medium-sized networks",
    example: "150.10.10.10",
    facts: [
      "Example: 150.10.10.10 with mask 255.255.0.0.",
      "Network 150.10.0.0/16: hosts 150.10.0.1 – 150.10.255.254, broadcast 150.10.255.255.",
      "Usable hosts: 2^16 − 2 = 65,534.",
    ],
  },
  {
    id: "C",
    color: "#e8590c",
    first: 192,
    last: 223,
    shownRange: "192 – 223",
    fullRange: "192.0.0.0 – 223.255.255.255",
    leadingBits: "110",
    hostOctets: 1,
    mask: "255.255.255.0",
    cidr: "/24",
    structure: "N | N | N | H",
    purpose: "Unicast, for small networks",
    example: "192.168.10.14",
    facts: [
      "Example: 192.168.10.0/24 is the network address.",
      "Hosts 192.168.10.1 – 192.168.10.254, broadcast 192.168.10.255.",
      "Usable hosts: 2^8 − 2 = 254.",
    ],
  },
  {
    id: "D",
    color: "#862e9c",
    first: 224,
    last: 239,
    shownRange: "224 – 239",
    fullRange: "224.0.0.0 – 239.255.255.255",
    leadingBits: "1110",
    hostOctets: 0,
    mask: "None",
    cidr: "—",
    structure: "Multicast group",
    purpose: "Reserved for multicasting",
    example: "224.0.0.5",
    facts: [
      "Each address represents a multicast group, not a single device.",
      "No network address, broadcast address, usable IP address or subnet mask.",
    ],
  },
  {
    id: "E",
    color: "#c92a2a",
    first: 240,
    last: 255,
    shownRange: "240 – 255",
    fullRange: "240.0.0.0 – 255.255.255.255",
    leadingBits: "1111",
    hostOctets: 0,
    mask: "None",
    cidr: "—",
    structure: "Reserved",
    purpose: "Reserved for scientific and research purposes",
    example: "240.1.1.1",
    facts: [
      "No network address, no broadcast address, no usable IP.",
      "No subnetting and no subnet mask.",
    ],
  },
];

const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)

function parseIp(raw: string): number[] | null {
  const s = raw.trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return null;
  const parts = s.split(".").map(Number);
  return parts.every((n) => n >= 0 && n <= 255) ? parts : null;
}

function classOf(firstOctet: number): ClassId {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D";
  return "E";
}

function addressType(ip: number[], cls: ClassId): { label: string; note: string } {
  const [a, b] = ip;
  if (cls === "D") return { label: "Multicast", note: "Group address" };
  if (cls === "E") return { label: "Reserved", note: "Not for normal hosts" };
  if (a === 127) return { label: "Loopback", note: "127.0.0.0/8 · points back at your own device" };
  if (a === 0) return { label: "Reserved", note: "0.0.0.0/8 · “this network”" };
  if (a === 10) return { label: "Private", note: "10.0.0.0/8" };
  if (a === 172 && b >= 16 && b <= 31) return { label: "Private", note: "172.16.0.0/12" };
  if (a === 192 && b === 168) return { label: "Private", note: "192.168.0.0/16" };
  return { label: "Public", note: "Routable on the internet" };
}

export function IpClassesExplorer() {
  const [ip, setIp] = useState("150.10.10.10");
  const [lastClass, setLastClass] = useState<ClassId>("B");

  const parsed = useMemo(() => parseIp(ip), [ip]);
  const activeId: ClassId = parsed ? classOf(parsed[0]) : lastClass;
  const active = CLASSES.find((c) => c.id === activeId)!;

  const onType = (value: string) => {
    setIp(value);
    const p = parseIp(value);
    if (p) setLastClass(classOf(p[0]));
  };
  const pick = (c: ClassInfo) => {
    setIp(c.example);
    setLastClass(c.id);
  };

  // Worked-out values for A / B / C
  const calc = useMemo(() => {
    if (!parsed || active.hostOctets === 0) return null;
    const netOctets = 4 - active.hostOctets;
    const network = parsed.map((o, i) => (i < netOctets ? o : 0));
    const broadcast = parsed.map((o, i) => (i < netOctets ? o : 255));
    const first = [...network];
    first[3] += 1;
    const last = [...broadcast];
    last[3] -= 1;
    const bits = active.hostOctets * 8;
    const usable = Math.pow(2, bits) - 2;
    return {
      network: network.join("."),
      broadcast: broadcast.join("."),
      first: first.join("."),
      last: last.join("."),
      usable,
      formula: `2^${bits} − 2`,
    };
  }, [parsed, active]);

  const type = parsed ? addressType(parsed, active.id) : null;
  const netOctets = 4 - active.hostOctets;
  const maskOctets = active.mask === "None" ? null : active.mask.split(".");
  const leadLen = active.leadingBits.length;
  const firstOctetBits = parsed
    ? parsed[0].toString(2).padStart(8, "0")
    : active.leadingBits.padEnd(8, "x");
  const markerLeft = parsed ? ((parsed[0] + 0.5) / 256) * 100 : null;

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes ipc-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes ipc-in   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .ipc-grow { transform-origin: left; animation: ipc-grow ${0.8 * SLOW}s cubic-bezier(.4,0,.2,1) both; }
        .ipc-in   { animation: ipc-in ${0.45 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .ipc-grow, .ipc-in { animation: none; } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">IP address class explorer</CardTitle>
            <CardDescription className="mt-1">
              Type an address or tap a class to see its range, split and default mask.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* 1. First-octet bar */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Every IPv4 address by its first octet (0 – 255)
          </p>
          <div className="overflow-x-auto pb-1">
            <div className="relative min-w-[460px] pt-7">
              {/* marker */}
              {markerLeft !== null && (
                <div
                  className="pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center transition-all duration-700"
                  style={{ left: `${markerLeft}%` }}
                >
                  <span
                    className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
                    style={{ backgroundColor: active.color }}
                  >
                    {parsed![0]}
                  </span>
                  <span
                    className="h-2 w-0.5"
                    style={{ backgroundColor: active.color }}
                  />
                </div>
              )}

              <div className="flex h-14 w-full overflow-hidden rounded-lg border">
                {CLASSES.map((c, i) => {
                  const count = c.last - c.first + 1;
                  const on = c.id === active.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pick(c)}
                      aria-pressed={on}
                      aria-label={`Class ${c.id}, first octet ${c.shownRange}`}
                      className="ipc-grow relative flex flex-col items-center justify-center border-r outline-none transition-opacity last:border-r-0 focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        width: `${(count / 256) * 100}%`,
                        backgroundColor: c.color + (on ? "33" : "14"),
                        borderTop: `4px solid ${c.color}`,
                        opacity: on ? 1 : 0.7,
                        animationDelay: `${i * 0.25 * SLOW}s`,
                      }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{ color: c.color }}
                      >
                        {c.id}
                      </span>
                      {count >= 32 && (
                        <span className="text-[10px] text-muted-foreground">
                          {c.shownRange}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-1 h-4 font-mono text-[10px] text-muted-foreground">
                {[0, 128, 192, 224, 240].map((n) => (
                  <span
                    key={n}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${(n / 256) * 100}%` }}
                  >
                    {n}
                  </span>
                ))}
                <span className="absolute right-0">255</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Input */}
        <label className="block text-xs font-medium">
          IPv4 address
          <Input
            value={ip}
            onChange={(e) => onType(e.target.value)}
            className="mt-2 bg-background font-mono"
            placeholder="150.10.10.10"
            inputMode="decimal"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        {!parsed && (
          <p role="alert" className="-mt-3 text-xs font-medium text-destructive">
            Enter four numbers from 0 to 255 separated by dots, such as 192.168.10.14.
          </p>
        )}

        {/* 3. Class detail — remounts when the class changes so it animates again */}
        <div
          key={active.id}
          className="flex flex-col gap-5 rounded-xl border bg-background p-4"
          style={{ borderTop: `3px solid ${active.color}` }}
        >
          <div className="ipc-in flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="text-lg font-semibold"
              style={{ color: active.color }}
            >
              Class {active.id}
            </span>
            <span className="text-xs text-muted-foreground">{active.purpose}</span>
            {type && (
              <Badge variant="secondary" className="ml-auto">
                {type.label}
              </Badge>
            )}
          </div>
          {type && (
            <p className="ipc-in -mt-3 text-[11px] text-muted-foreground">
              {type.note}
            </p>
          )}

          {/* Octet split */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Structure:{" "}
              <span className="font-mono font-medium text-foreground">
                {active.structure}
              </span>
              {active.hostOctets > 0 && (
                <> · mask {active.mask} ({active.cidr})</>
              )}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => {
                const isNet = active.hostOctets > 0 && i < netOctets;
                const isHost = active.hostOctets > 0 && i >= netOctets;
                const value = parsed ? parsed[i] : "?";
                return (
                  <div
                    key={i}
                    className="ipc-in flex flex-col items-center rounded-lg border-2 px-1 py-2"
                    style={{
                      animationDelay: `${i * 0.2 * SLOW}s`,
                      borderColor: isNet ? active.color : undefined,
                      borderStyle: isNet ? "solid" : "dashed",
                      backgroundColor: isNet ? active.color + "14" : undefined,
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: isNet ? active.color : undefined }}
                    >
                      {isNet ? "Network" : isHost ? "Host" : "Group"}
                    </span>
                    <span
                      className={`font-mono text-lg font-semibold ${
                        isHost ? "text-muted-foreground" : ""
                      }`}
                    >
                      {value}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      mask {maskOctets ? maskOctets[i] : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to spot the class from the first octet */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              First octet in binary. The leading{" "}
              <span className="font-medium text-foreground">
                {leadLen} bit{leadLen > 1 ? "s" : ""}
              </span>{" "}
              (<span className="font-mono">{active.leadingBits}</span>) always mark Class{" "}
              {active.id}.
            </p>
            <div className="flex gap-1.5">
              {firstOctetBits.split("").map((b, i) => (
                <span
                  key={i}
                  className={`ipc-in flex size-8 items-center justify-center rounded-md border font-mono text-sm font-semibold ${
                    i < leadLen ? "text-white" : "bg-muted/40 text-muted-foreground"
                  }`}
                  style={{
                    animationDelay: `${i * 0.08 * SLOW}s`,
                    backgroundColor: i < leadLen ? active.color : undefined,
                    borderColor: i < leadLen ? active.color : undefined,
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Worked values (A / B / C) or the "nothing here" message (D / E) */}
          {calc ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["Network address", calc.network],
                ["First usable host", calc.first],
                ["Last usable host", calc.last],
                ["Broadcast address", calc.broadcast],
                ["Usable hosts", `${calc.formula} = ${calc.usable.toLocaleString()}`],
                ["Default mask", `${active.mask} (${active.cidr})`],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className="ipc-in rounded-lg border bg-background p-3"
                  style={{ animationDelay: `${i * 0.12 * SLOW}s` }}
                >
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="mt-1 break-all font-mono text-xs font-medium">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            parsed === null ? null : (
              <div className="ipc-in grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["Network address", "Broadcast address", "Usable host IPs", "Subnet mask"].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-dashed p-3 text-center"
                    >
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="mt-1 text-xs font-medium">None</p>
                    </div>
                  ),
                )}
              </div>
            )
          )}

          {/* Notes for this class */}
          <ul className="flex flex-col gap-1.5 pl-5 text-xs leading-5 text-muted-foreground marker:text-primary">
            <li>
              Range:{" "}
              <span className="font-mono text-foreground">{active.fullRange}</span>
            </li>
            {active.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        {/* 4. Quick reference (also a selector) */}
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[520px] text-xs">
            <thead className="bg-muted/50">
              <tr>
                {["Class", "First octet", "Starts with", "Structure", "Default mask", "Usable hosts"].map(
                  (h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((c) => {
                const on = c.id === active.id;
                const hostBits = c.hostOctets * 8;
                return (
                  <tr
                    key={c.id}
                    onClick={() => pick(c)}
                    className={`cursor-pointer border-t transition-colors hover:bg-primary/5 ${
                      on ? "bg-primary/10" : ""
                    }`}
                  >
                    <td
                      className="px-3 py-2 font-semibold"
                      style={{ color: c.color }}
                    >
                      {c.id}
                    </td>
                    <td className="px-3 py-2 font-mono">{c.shownRange}</td>
                    <td className="px-3 py-2 font-mono">{c.leadingBits}…</td>
                    <td className="px-3 py-2 font-mono">{c.structure}</td>
                    <td className="px-3 py-2 font-mono">
                      {c.mask === "None" ? "None" : `${c.mask} (${c.cidr})`}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {c.hostOctets === 0
                        ? "None"
                        : (Math.pow(2, hostBits) - 2).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="-mt-3 text-[11px] text-muted-foreground">
          Private ranges: 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16. Loopback:
          127.0.0.0/8.
        </p>
      </CardContent>
    </Card>
  );
}