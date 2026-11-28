import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// Adjust this path to wherever VerticalSubnetLine lives in your project:
import { VerticalSubnetLine } from "./vertical-subnet-line";

/* ------------------------------------------------------------------ */
/* Core helpers (module scope, so they are available everywhere)       */
/* If you already define these elsewhere, delete these and import them */
/* ------------------------------------------------------------------ */

type Block = {
  label: string;
  requested: number;
  prefix: number;
  blockSize: number;
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  usable: number;
  waste: number;
};

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function intToIp(n: number): string {
  return [
    Math.floor(n / 16777216) % 256,
    Math.floor(n / 65536) % 256,
    Math.floor(n / 256) % 256,
    n % 256,
  ].join(".");
}

/** Smallest prefix whose block holds `hosts` usable addresses (min block /30). */
function prefixForHosts(hosts: number): number {
  let bits = 2;
  while (2 ** bits - 2 < hosts) bits++;
  return Math.max(0, 32 - bits);
}

/* ------------------------------------------------------------------ */
/* Small shared helpers                                                */
/* ------------------------------------------------------------------ */

const ORD = ["1st", "2nd", "3rd", "4th"];

function prefixToMask(p: number) {
  return p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
}

/** smallest n such that 2^n >= value */
function bitsFor(value: number) {
  let n = 0;
  while (2 ** n < value) n++;
  return n;
}

/** "Interesting octet" + block size in that octet (same convention as the cheat sheet). */
function octetStep(p: number) {
  if (p >= 32) return { octet: 4, step: 1 };
  return {
    octet: Math.min(4, Math.floor(p / 8) + 1),
    step: p % 8 === 0 ? 256 : 2 ** (8 - (p % 8)),
  };
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border bg-background p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.value
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

function Line({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 font-mono text-xs leading-relaxed">
      {children}
    </div>
  );
}

/** 32-bit mask. Network bits = primary, borrowed bits = amber, host bits = muted. */
function MaskBits({
  prefix,
  basePrefix,
}: {
  prefix: number;
  basePrefix?: number;
}) {
  const netEnd = basePrefix ?? prefix;
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-1 font-mono text-sm">
      {[0, 1, 2, 3].map((o) => (
        <span key={o} className="inline-flex">
          {Array.from({ length: 8 }, (_, b) => {
            const i = o * 8 + b;
            const cls =
              i < netEnd
                ? "font-bold text-primary"
                : i < prefix
                  ? "font-bold text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground/60";
            return (
              <span key={b} className={cls}>
                {i < prefix ? "1" : "0"}
              </span>
            );
          })}
          {o < 3 && <span className="ml-1 text-muted-foreground">.</span>}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Interactive "Steps to perform subnetting"                        */
/* ------------------------------------------------------------------ */

const STEP_TITLES = [
  "Best block size",
  "Bit position",
  "Next network",
  "Previous broadcast",
  "First host",
  "Last host",
  "Subnet mask",
];

function SubnetSteps({
  blocks,
  parentNetwork,
  mode,
  colors,
}: {
  blocks: Block[];
  parentNetwork: number;
  mode: "vlsm" | "flsm";
  colors: string[];
}) {
  const [sel, setSel] = useState(0);
  const [step, setStep] = useState(0);

  const idx = Math.min(sel, blocks.length - 1);
  const b = blocks[idx];
  const prev = idx > 0 ? blocks[idx - 1] : null;
  const color = colors[idx % colors.length];

  const content = (() => {
    switch (step) {
      case 0: {
        const e = 32 - b.prefix;
        const rows = [e - 1, e, e + 1]
          .filter((x) => x >= 1 && x <= 32)
          .map((x) => ({
            x,
            size: 2 ** x,
            usable: x === 1 ? 2 : 2 ** x - 2,
          }));
        return (
          <>
            <p className="text-xs text-muted-foreground">
              Pick the smallest power of two that holds the hosts plus the
              network and broadcast addresses — that wastes the fewest IPs.
              {mode === "flsm" &&
                " In FLSM every subnet is forced to the size of the largest requirement."}
            </p>
            <Line>
              {b.requested} hosts + 2 = {b.requested + 2} → block size ={" "}
              <b>{b.blockSize}</b> (2^{e})
            </Line>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium">Block</th>
                    <th className="px-3 py-1.5 text-left font-medium">Usable</th>
                    <th className="px-3 py-1.5 text-left font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.x}
                      className={`border-t ${r.x === e ? "bg-primary/10 font-semibold" : ""}`}
                    >
                      <td className="px-3 py-1.5 font-mono">{r.size}</td>
                      <td className="px-3 py-1.5 font-mono">{r.usable}</td>
                      <td className="px-3 py-1.5">
                        {r.usable < b.requested
                          ? "too small"
                          : r.x === e
                            ? mode === "flsm"
                              ? "forced by largest subnet"
                              : "best fit"
                            : "wastes more"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Line>
              waste = {b.usable} usable − {b.requested} needed = <b>{b.waste}</b>
            </Line>
          </>
        );
      }
      case 1: {
        const hostBits = 32 - b.prefix;
        const lastOctet = Math.max(1, Math.ceil(b.prefix / 8));
        const bitInOct = b.prefix - 8 * (lastOctet - 1);
        const { octet, step: inc } = octetStep(b.prefix);
        return (
          <>
            <p className="text-xs text-muted-foreground">
              Block size = 2^(host bits). The bit just left of the host bits is
              the last network bit — its place value is the step size.
            </p>
            <Line>
              {b.blockSize} = 2^{hostBits} → {hostBits} host bits
            </Line>
            <Line>
              32 − {hostBits} = <b>/{b.prefix}</b> network bits
            </Line>
            <Line>
              last network bit = bit {b.prefix} from the left (bit {bitInOct} of
              the {ORD[lastOctet - 1]} octet, place value{" "}
              {2 ** (8 - bitInOct)})
            </Line>
            <Line>
              subnets step by <b>{inc}</b> in the {ORD[octet - 1]} octet
            </Line>
            <MaskBits prefix={b.prefix} />
          </>
        );
      }
      case 2: {
        return (
          <>
            <p className="text-xs text-muted-foreground">
              Add the previous block size to the previous network address to
              get the next network address.
            </p>
            {prev ? (
              <>
                <Line>
                  {intToIp(prev.network)} + {prev.blockSize} ={" "}
                  {intToIp(prev.network + prev.blockSize)}
                </Line>
                {prev.network + prev.blockSize !== b.network && (
                  <Line>
                    rounded up to a multiple of {b.blockSize} →{" "}
                    {intToIp(b.network)}
                  </Line>
                )}
              </>
            ) : (
              <Line>
                first subnet starts at the parent network:{" "}
                <b>{intToIp(parentNetwork)}</b>
              </Line>
            )}
            <Line>
              {b.label} network address = <b>{intToIp(b.network)}</b>
            </Line>
          </>
        );
      }
      case 3: {
        return (
          <>
            <p className="text-xs text-muted-foreground">
              Subtract 1 from a network address to get the broadcast address of
              the network before it.
            </p>
            {prev ? (
              <Line>
                {intToIp(b.network)} − 1 = <b>{intToIp(b.network - 1)}</b> →
                broadcast of {prev.label}
              </Line>
            ) : (
              <Line>
                {b.label} is the first subnet, so there is no previous network.
              </Line>
            )}
            <Line>
              same trick for this subnet: {intToIp(b.network + b.blockSize)} − 1
              = <b>{intToIp(b.broadcast)}</b> → broadcast of {b.label}
            </Line>
          </>
        );
      }
      case 4: {
        return (
          <>
            <p className="text-xs text-muted-foreground">
              Add 1 to the network address to get the first host IP.
              {b.prefix >= 31 &&
                " (/31 and /32 reserve no network/broadcast address, so the first host equals the network address.)"}
            </p>
            <Line>
              {intToIp(b.network)} + {b.prefix >= 31 ? 0 : 1} ={" "}
              <b>{intToIp(b.firstHost)}</b>
            </Line>
          </>
        );
      }
      case 5: {
        return (
          <>
            <p className="text-xs text-muted-foreground">
              Subtract 1 from the broadcast address to get the last host IP.
            </p>
            <Line>
              {intToIp(b.broadcast)} − {b.prefix >= 31 ? 0 : 1} ={" "}
              <b>{intToIp(b.lastHost)}</b>
            </Line>
            <Line>
              usable range: {intToIp(b.firstHost)} – {intToIp(b.lastHost)} (
              {b.usable} hosts)
            </Line>
          </>
        );
      }
      default: {
        return (
          <>
            <p className="text-xs text-muted-foreground">
              Count the 1 bits in the network portion — that is the prefix
              length. Write those bits out and convert each octet to decimal.
            </p>
            <MaskBits prefix={b.prefix} />
            <Line>
              {b.prefix} one-bits → /{b.prefix} →{" "}
              <b>{intToIp(prefixToMask(b.prefix))}</b>
            </Line>
          </>
        );
      }
    }
  })();

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Steps to perform subnetting</h3>
        <Badge variant="secondary">Live from your inputs</Badge>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Pick a subnet, then walk through the seven steps with your own numbers.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {blocks.map((x, i) => (
          <button
            key={x.label}
            type="button"
            onClick={() => setSel(i)}
            className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
              i === idx ? "text-white" : "bg-background hover:bg-muted"
            }`}
            style={
              i === idx
                ? {
                    backgroundColor: colors[i % colors.length],
                    borderColor: colors[i % colors.length],
                  }
                : { color: colors[i % colors.length] }
            }
          >
            {x.label} · {x.requested}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {STEP_TITLES.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              i === step
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {i + 1}. {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
            style={{ backgroundColor: color }}
          >
            {step + 1}
          </span>
          {STEP_TITLES[step]}
          <span className="text-xs font-normal text-muted-foreground">
            · {b.label} (/{b.prefix})
          </span>
        </div>
        {content}
      </div>

      <div className="mt-3 flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          type="button"
          disabled={step === STEP_TITLES.length - 1}
          onClick={() => setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Class A / B / C subnetting examples (interactive)                */
/* ------------------------------------------------------------------ */

type ClassKey = "A" | "B" | "C";

const CLASS_INFO: Record<
  ClassKey,
  {
    title: string;
    prefix: number;
    lead: string;
    range: string;
    example: string;
    hosts: string;
    min: number;
    max: number;
  }
> = {
  A: {
    title: "Class A",
    prefix: 8,
    lead: "0",
    range: "1 – 126",
    example: "10.0.0.0",
    hosts: "1000",
    min: 1,
    max: 126,
  },
  B: {
    title: "Class B",
    prefix: 16,
    lead: "10",
    range: "128 – 191",
    example: "172.16.0.0",
    hosts: "500",
    min: 128,
    max: 191,
  },
  C: {
    title: "Class C",
    prefix: 24,
    lead: "110",
    range: "192 – 223",
    example: "192.168.1.0",
    hosts: "25",
    min: 192,
    max: 223,
  },
};

function ClassSubnetting() {
  const [cls, setCls] = useState<ClassKey>("C");
  const [by, setBy] = useState<"subnets" | "hosts">("subnets");
  const [ip, setIp] = useState(CLASS_INFO.C.example);
  const [val, setVal] = useState("4");

  const info = CLASS_INFO[cls];

  function pickClass(k: ClassKey) {
    setCls(k);
    setIp(CLASS_INFO[k].example);
    setVal(by === "subnets" ? "4" : CLASS_INFO[k].hosts);
  }
  function pickBy(m: "subnets" | "hosts") {
    setBy(m);
    setVal(m === "subnets" ? "4" : info.hosts);
  }

  const calc = useMemo(() => {
    const baseInt = ipToInt(ip);
    if (baseInt === null) return { error: "Enter a valid IPv4 address." };
    const n = Number(val);
    if (!Number.isInteger(n) || n < 1)
      return { error: "Enter a whole number of 1 or more." };
    if (n > 2 ** 24) return { error: "That number is too large for this demo." };

    const dp = info.prefix;
    const network = (baseInt & prefixToMask(dp)) >>> 0;
    const first = baseInt >>> 24;
    const classWarning =
      first < info.min || first > info.max
        ? `${ip} is not a ${info.title} address (first octet ${info.range}) — the maths still works the same.`
        : "";

    const newPrefix = by === "subnets" ? dp + bitsFor(n) : 32 - bitsFor(n + 2);
    const borrow = newPrefix - dp;
    if (borrow < 0)
      return {
        error: `${n} hosts is more than a ${info.title} network holds (${(2 ** (32 - dp) - 2).toLocaleString("en-US")}).`,
      };
    if (newPrefix > 30)
      return { error: "The result would be smaller than /30 — ask for less." };

    const blockSize = 2 ** (32 - newPrefix);
    const count = 2 ** borrow;
    const mask = prefixToMask(newPrefix);

    const idxs: number[] =
      count <= 9
        ? Array.from({ length: count }, (_, i) => i)
        : [...Array.from({ length: 8 }, (_, i) => i), -1, count - 1];

    return {
      error: "",
      classWarning,
      dp,
      n,
      newPrefix,
      borrow,
      blockSize,
      count,
      mask,
      network,
      usable: blockSize - 2,
      idxs,
    };
  }, [ip, val, by, info]);

  const presets = by === "subnets" ? [2, 4, 8, 16, 32] : [10, 30, 60, 100, 500];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={cls}
          onChange={pickClass}
          options={[
            { value: "A", label: "Class A" },
            { value: "B", label: "Class B" },
            { value: "C", label: "Class C" },
          ]}
        />
        <Segmented
          value={by}
          onChange={pickBy}
          options={[
            { value: "subnets", label: "I know the subnets" },
            { value: "hosts", label: "I know the hosts" },
          ]}
        />
      </div>

      <div className="grid gap-3 text-xs sm:grid-cols-4">
        {[
          ["Leading bits", info.lead],
          ["First octet", info.range],
          ["Default mask", `/${info.prefix} · ${intToIp(prefixToMask(info.prefix))}`],
          ["Hosts / network", (2 ** (32 - info.prefix) - 2).toLocaleString("en-US")],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-background px-3 py-2">
            <div className="text-muted-foreground">{k}</div>
            <div className="font-mono font-semibold">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">
          {info.title} network address
          <Input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="mt-2 bg-background font-mono"
          />
        </label>
        <label className="text-xs font-medium">
          {by === "subnets" ? "Subnets needed" : "Hosts needed per subnet"}
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="mt-2 bg-background font-mono"
            inputMode="numeric"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setVal(String(p))}
                className="rounded-full border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        </label>
      </div>

      {calc.error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {calc.error}
        </p>
      )}

      {!calc.error && "count" in calc && (
        <>
          {calc.classWarning && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {calc.classWarning}
            </p>
          )}

          <div className="rounded-xl border p-4">
            <h4 className="mb-2 text-sm font-semibold">Worked example</h4>
            <ol className="flex flex-col gap-2 text-xs">
              <li>
                <span className="font-semibold">1. Bits to borrow — </span>
                {by === "subnets" ? (
                  <>
                    2^{calc.borrow} = {calc.count} ≥ {calc.n} subnets → borrow{" "}
                    <b>{calc.borrow}</b> bit{calc.borrow === 1 ? "" : "s"}
                  </>
                ) : (
                  <>
                    2^{32 - calc.newPrefix} − 2 = {calc.usable} ≥ {calc.n} hosts
                    → keep <b>{32 - calc.newPrefix}</b> host bits, borrow{" "}
                    <b>{calc.borrow}</b>
                  </>
                )}
              </li>
              <li>
                <span className="font-semibold">2. New prefix — </span>/
                {calc.dp} + {calc.borrow} = <b>/{calc.newPrefix}</b>
              </li>
              <li className="flex flex-col gap-1">
                <span>
                  <span className="font-semibold">3. Subnet mask — </span>
                  <b className="font-mono">{intToIp(calc.mask)}</b>
                </span>
                <MaskBits prefix={calc.newPrefix} basePrefix={calc.dp} />
                <span className="text-[11px] text-muted-foreground">
                  blue = original network bits · amber = borrowed bits · grey =
                  host bits
                </span>
              </li>
              <li>
                <span className="font-semibold">4. Block size — </span>
                {(() => {
                  const { octet, step } = octetStep(calc.newPrefix);
                  const maskOctet = (calc.mask >>> (8 * (4 - octet))) & 255;
                  return (
                    <>
                      256 − {maskOctet} = {256 - maskOctet}; subnets step by{" "}
                      <b>{step}</b> in the {ORD[octet - 1]} octet ({calc.blockSize}{" "}
                      addresses each)
                    </>
                  );
                })()}
              </li>
              <li>
                <span className="font-semibold">5. Result — </span>
                <b>{calc.count.toLocaleString("en-US")}</b> subnets ×{" "}
                <b>{calc.usable.toLocaleString("en-US")}</b> usable hosts
              </li>
            </ol>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Network</th>
                  <th className="px-3 py-2 text-left font-medium">Host range</th>
                  <th className="px-3 py-2 text-left font-medium">Broadcast</th>
                </tr>
              </thead>
              <tbody>
                {calc.idxs.map((i, k) => {
                  if (i === -1)
                    return (
                      <tr key={`gap-${k}`} className="border-t">
                        <td
                          colSpan={4}
                          className="px-3 py-1.5 text-center text-muted-foreground"
                        >
                          … {(calc.count - 9).toLocaleString("en-US")} more
                          subnets …
                        </td>
                      </tr>
                    );
                  const net = calc.network + i * calc.blockSize;
                  const bc = net + calc.blockSize - 1;
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-semibold">{i + 1}</td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(net)}/{calc.newPrefix}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(net + 1)} – {intToIp(bc - 1)}
                      </td>
                      <td className="px-3 py-2 font-mono">{intToIp(bc)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Static CIDR / block size reference table                         */
/* ------------------------------------------------------------------ */

const REF_ROWS = Array.from({ length: 25 }, (_, i) => {
  const p = i + 8;
  const total = 2 ** (32 - p);
  const { octet, step } = octetStep(p);
  return {
    p,
    mask: intToIp(prefixToMask(p)),
    block: `${step} (${ORD[octet - 1]} octet)`,
    total: total.toLocaleString("en-US"),
    usable:
      p === 31
        ? "0 (or 2 point-to-point per RFC 3021)"
        : p === 32
          ? "0 (host route)"
          : (total - 2).toLocaleString("en-US"),
  };
});

function CidrReference({ highlight }: { highlight: number[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        IPv4 block size and subnet mask reference, /8 to /32.
        {highlight.length > 0 && " Prefixes used in your planner are highlighted."}
      </p>
      <div className="max-h-[28rem] overflow-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">CIDR</th>
              <th className="px-3 py-2 text-left font-medium">Subnet mask</th>
              <th className="px-3 py-2 text-left font-medium">Block size (step)</th>
              <th className="px-3 py-2 text-left font-medium">Total addresses</th>
              <th className="px-3 py-2 text-left font-medium">Usable hosts</th>
            </tr>
          </thead>
          <tbody>
            {REF_ROWS.map((r) => (
              <tr
                key={r.p}
                className={`border-t ${highlight.includes(r.p) ? "bg-primary/10 font-semibold" : ""}`}
              >
                <td className="px-3 py-1.5 font-mono">/{r.p}</td>
                <td className="px-3 py-1.5 font-mono">{r.mask}</td>
                <td className="px-3 py-1.5 font-mono">{r.block}</td>
                <td className="px-3 py-1.5 font-mono">{r.total}</td>
                <td className="px-3 py-1.5 font-mono">{r.usable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function SubnetPlanner() {
  const [baseIp, setBaseIp] = useState("192.168.10.0");
  const [baseCidr, setBaseCidr] = useState("24");
  const [needsText, setNeedsText] = useState("35, 40, 50, 45");
  const [mode, setMode] = useState<"vlsm" | "flsm">("vlsm");
  const [view, setView] = useState<"planner" | "classes">("planner");
  const [showRef, setShowRef] = useState(true);

  const result = useMemo(() => {
    const baseInt = ipToInt(baseIp);
    const basePrefix = Number(baseCidr);
    if (baseInt === null) return { error: "Enter a valid base IPv4 address." };
    if (!Number.isInteger(basePrefix) || basePrefix < 0 || basePrefix > 32)
      return { error: "CIDR must be a whole number from 0 to 32." };

    const needs = needsText
      .split(/[\s,]+/)
      .map((x) => Number(x))
      .filter((x) => x > 0);
    if (needs.length === 0)
      return { error: "Enter at least one host requirement." };
    if (needs.some((n) => !Number.isInteger(n)))
      return { error: "Host requirements must be whole numbers." };

    const baseMask =
      basePrefix === 0 ? 0 : (0xffffffff << (32 - basePrefix)) >>> 0;
    const parentNetwork = (baseInt & baseMask) >>> 0;
    const parentSize = 2 ** (32 - basePrefix);

    // Keep the order the user typed: first value = N1, second = N2, ...
    const sorted = [...needs];
    const uniformPrefix =
      mode === "flsm" ? prefixForHosts(Math.max(...needs)) : null;

    const blocks: Block[] = [];
    let cursor = parentNetwork;
    const parentEnd = parentNetwork + parentSize - 1;

    for (let i = 0; i < sorted.length; i++) {
      const requested = sorted[i];
      const prefix =
        mode === "flsm" ? uniformPrefix! : prefixForHosts(requested);

      if (prefix < basePrefix) {
        return {
          error: `Block ${i + 1} needs ${requested} hosts, which is larger than the /${basePrefix} parent network.`,
        };
      }
      const blockSize = 2 ** (32 - prefix);
      const aligned = Math.ceil(cursor / blockSize) * blockSize;
      const network = aligned;
      const broadcast = network + blockSize - 1;
      if (broadcast > parentEnd) {
        return {
          error: "Not enough space in the parent network for all requirements.",
        };
      }
      const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : blockSize - 2;
      blocks.push({
        label: `N${i + 1}`,
        requested,
        prefix,
        blockSize,
        network,
        broadcast,
        firstHost: prefix >= 31 ? network : network + 1,
        lastHost: prefix >= 31 ? broadcast : broadcast - 1,
        usable,
        waste: usable - requested,
      });
      cursor = broadcast + 1;
    }

    const used = cursor - parentNetwork;
    const free = parentSize - used;

    return {
      error: "",
      basePrefix,
      parentNetwork,
      parentSize,
      blocks,
      used,
      free,
      uniformPrefix,
    };
  }, [baseIp, baseCidr, needsText, mode]);

  const colors = [
    "#1971c2",
    "#2f9e44",
    "#e8590c",
    "#862e9c",
    "#c92a2a",
    "#0c8599",
    "#f08c00",
    "#5f3dc4",
  ];

  const usedPrefixes =
    !result.error && "blocks" in result
      ? Array.from(new Set(result.blocks!.map((b) => b.prefix)))
      : [];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Subnet planner</CardTitle>
            <CardDescription className="mt-1">
              Plan subnets, follow the steps, try class A/B/C examples and look
              up block sizes.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-5">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "planner", label: "Planner & steps" },
              { value: "classes", label: "Class A / B / C" },
            ]}
          />
        </div>

        {view === "classes" && <ClassSubnetting />}

        {view === "planner" && (
          <>
            <div className="mb-5">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "flsm", label: "FLSM — fixed size" },
                  { value: "vlsm", label: "VLSM — variable size" },
                ]}
              />
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="grid gap-4 sm:grid-cols-[1fr_140px_2fr]"
            >
              <label className="text-xs font-medium">
                Base network
                <Input
                  value={baseIp}
                  onChange={(e) => setBaseIp(e.target.value)}
                  className="mt-2 bg-background"
                  placeholder="192.168.10.0"
                />
              </label>
              <label className="text-xs font-medium">
                CIDR
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                    /
                  </span>
                  <Input
                    value={baseCidr}
                    onChange={(e) => setBaseCidr(e.target.value)}
                    className="bg-background pl-7"
                    inputMode="numeric"
                  />
                </div>
              </label>
              <label className="text-xs font-medium">
                Hosts per subnet (comma separated)
                <Input
                  value={needsText}
                  onChange={(e) => setNeedsText(e.target.value)}
                  className="mt-2 bg-background"
                  placeholder="35, 40, 50, 45"
                />
              </label>
            </form>

            {result.error && (
              <p
                role="alert"
                className="mt-4 text-xs font-medium text-destructive"
              >
                {result.error}
              </p>
            )}

            {!result.error && "blocks" in result && (
              <div className="mt-6 flex flex-col gap-6">
                <p className="text-xs text-muted-foreground">
                  {mode === "flsm" ? (
                    <>
                      <span className="font-semibold text-foreground">
                        FLSM:
                      </span>{" "}
                      every subnet gets the same size — /{result.uniformPrefix} —
                      because it fits the largest requirement.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">
                        VLSM:
                      </span>{" "}
                      each subnet gets the smallest block that fits its own
                      requirement.
                    </>
                  )}
                </p>

                <VerticalSubnetLine
                  blocks={result.blocks!}
                  parentNetwork={result.parentNetwork!}
                  parentSize={result.parentSize!}
                  free={result.free!}
                  basePrefix={result.basePrefix!}
                  colors={colors}
                  intToIp={intToIp}
                />

                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Block</th>
                        <th className="px-3 py-2 text-left font-medium">Needs</th>
                        <th className="px-3 py-2 text-left font-medium">Prefix</th>
                        <th className="px-3 py-2 text-left font-medium">Size</th>
                        <th className="px-3 py-2 text-left font-medium">
                          Network
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Host range
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Broadcast
                        </th>
                        <th className="px-3 py-2 text-left font-medium">Waste</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.blocks!.map((b, i) => (
                        <tr key={b.label} className="border-t">
                          <td
                            className="px-3 py-2 font-semibold"
                            style={{ color: colors[i % colors.length] }}
                          >
                            {b.label}
                          </td>
                          <td className="px-3 py-2">{b.requested}</td>
                          <td className="px-3 py-2 font-mono">/{b.prefix}</td>
                          <td className="px-3 py-2 font-mono">{b.blockSize}</td>
                          <td className="px-3 py-2 font-mono">
                            {intToIp(b.network)}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {intToIp(b.firstHost)} – {intToIp(b.lastHost)}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {intToIp(b.broadcast)}
                          </td>
                          <td className="px-3 py-2 font-mono">{b.waste}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Allocated {result.used} of {result.parentSize} addresses ·{" "}
                  {result.free} still free.
                  {mode === "flsm"
                    ? " FLSM wastes more addresses when requirements differ in size."
                    : " Blocks are allocated in the order you entered them."}
                  {(() => {
                    const skipped =
                      result.used! -
                      result.blocks!.reduce((s, b) => s + b.blockSize, 0);
                    return skipped > 0
                      ? ` ${skipped} addresses were skipped to keep blocks aligned — entering larger subnets first avoids this.`
                      : "";
                  })()}
                </p>

                <SubnetSteps
                  blocks={result.blocks!}
                  parentNetwork={result.parentNetwork!}
                  mode={mode}
                  colors={colors}
                />
              </div>
            )}
          </>
        )}

        {/* CIDR reference — always visible, whichever tab is open */}
        <div className="mt-8 rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">CIDR & block size reference</h3>
            <button
              type="button"
              onClick={() => setShowRef((s) => !s)}
              className="rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showRef ? "Hide" : "Show"}
            </button>
          </div>
          {showRef && <CidrReference highlight={usedPrefixes} />}
        </div>
      </CardContent>
    </Card>
  );
}