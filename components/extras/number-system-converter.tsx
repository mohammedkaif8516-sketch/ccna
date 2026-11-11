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
 * NumberSystemConverter  (replaces HexBinaryConverter)
 * Pick any "From" and "To" among Decimal, Binary and Hex. The working is shown
 * the way you would do it on paper:
 *   Hex ↔ Binary  : 4-bit nibbles with 8-4-2-1 place values
 *   Decimal → Bin : repeated division by 2, read remainders bottom to top
 *   Decimal → Hex : repeated division by 16, read remainders bottom to top
 *   Binary → Dec  : add up the place values of the 1 bits (click bits to flip)
 *   Hex → Dec     : digit × 16^position, then add
 *
 * Uses BigInt without literals (BigInt(1), not 1n) so it compiles with
 * Next.js's default ES2017 TypeScript target.
 */

type Base = "dec" | "bin" | "hex";
const BASES: { id: Base; label: string }[] = [
  { id: "dec", label: "Decimal" },
  { id: "bin", label: "Binary" },
  { id: "hex", label: "Hex" },
];
const BASE_LABEL: Record<Base, string> = {
  dec: "Decimal",
  bin: "Binary",
  hex: "Hexadecimal",
};

const WEIGHTS = [8, 4, 2, 1];
const HEX_DIGITS = "0123456789ABCDEF".split("");
const SLOW = 2; // animation slow-down factor (1 = fast, higher = slower)

const ZERO = BigInt(0);
const ONE = BigInt(1);
const MAX_DEC = (ONE << BigInt(64)) - ONE; // 64-bit limit for decimal conversions

/* ───────────────────────── parsing ───────────────────────── */

type Cleaned = { error: string } | { error: ""; text: string };

function cleanDec(raw: string): Cleaned {
  const s = raw.trim().replace(/[\s,_]/g, "");
  if (!s) return { error: "Enter a decimal number, such as 170." };
  if (!/^\d+$/.test(s)) return { error: "Decimal uses only the digits 0–9." };
  if (s.length > 20 || BigInt(s) > MAX_DEC)
    return { error: "Keep it at 64 bits or less (up to 18,446,744,073,709,551,615)." };
  return { error: "", text: BigInt(s).toString() };
}

function cleanHex(raw: string): Cleaned {
  const s = raw
    .trim()
    .replace(/^0x/i, "")
    .replace(/[\s:_-]/g, "");
  if (!s) return { error: "Enter a hex value, such as 2F9A or 2001:0DB8." };
  if (!/^[0-9a-fA-F]+$/.test(s)) return { error: "Hex uses only 0–9 and A–F." };
  if (s.length > 32) return { error: "Keep it to 32 hex digits or fewer." };
  return { error: "", text: s.toUpperCase() };
}

function cleanBin(raw: string): Cleaned {
  const s = raw
    .trim()
    .replace(/^0b/i, "")
    .replace(/[\s_.]/g, "");
  if (!s) return { error: "Enter a binary value, such as 1011 0110." };
  if (!/^[01]+$/.test(s)) return { error: "Binary uses only 0 and 1." };
  if (s.length > 128) return { error: "Keep it to 128 bits or fewer." };
  return { error: "", text: s };
}

type Nibble = { digit: string; bits: string };

function hexToNibbles(hex: string): Nibble[] {
  return hex.split("").map((c) => ({
    digit: c,
    bits: parseInt(c, 16).toString(2).padStart(4, "0"),
  }));
}

function binToNibbles(bin: string): { nibbles: Nibble[]; pad: number } {
  const pad = (4 - (bin.length % 4)) % 4;
  const padded = "0".repeat(pad) + bin;
  const nibbles: Nibble[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const bits = padded.slice(i, i + 4);
    nibbles.push({ digit: parseInt(bits, 2).toString(16).toUpperCase(), bits });
  }
  return { nibbles, pad };
}

/** "10110" → "0001 0110" */
function group4(bits: string): string {
  const padded = bits.padStart(Math.ceil(bits.length / 4) * 4, "0");
  return padded.match(/.{4}/g)!.join(" ");
}

function divSteps(n: bigint, base: number) {
  const b = BigInt(base);
  const steps: { dividend: string; quotient: string; remainder: number }[] = [];
  let cur = n;
  do {
    const q = cur / b;
    steps.push({
      dividend: cur.toString(),
      quotient: q.toString(),
      remainder: Number(cur % b),
    });
    cur = q;
  } while (cur > ZERO);
  return steps;
}

/* ───────────────────────── pieces ───────────────────────── */

function NibbleCard({
  nibble,
  index,
  direction,
  onToggle,
}: {
  nibble: Nibble;
  index: number;
  direction: "hex2bin" | "bin2hex";
  onToggle?: (bitIndex: number) => void;
}) {
  const lit = WEIGHTS.filter((_, i) => nibble.bits[i] === "1");
  const value = lit.reduce((a, b) => a + b, 0);
  const delay = `${Math.min(index, 8) * 0.12 * SLOW}s`;

  return (
    <div
      className="vns-in flex w-[148px] shrink-0 flex-col items-center rounded-xl border bg-background p-3"
      style={{ animationDelay: delay }}
    >
      <div
        className={`mb-3 flex size-12 items-center justify-center rounded-lg border-2 font-mono text-2xl font-semibold ${
          direction === "bin2hex"
            ? "border-primary bg-primary/10 text-primary"
            : "border-dashed text-foreground"
        }`}
      >
        {nibble.digit}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {WEIGHTS.map((w, i) => {
          const on = nibble.bits[i] === "1";
          const cls = `flex size-8 items-center justify-center rounded-md border font-mono text-sm font-semibold transition-colors duration-300 ${
            on
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-muted/40 text-muted-foreground"
          }`;
          return (
            <div key={w} className="flex flex-col items-center gap-1">
              {onToggle ? (
                <button
                  type="button"
                  onClick={() => onToggle(i)}
                  aria-label={`Bit worth ${w}, currently ${on ? 1 : 0}. Click to flip.`}
                  aria-pressed={on}
                  className={`${cls} cursor-pointer outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring`}
                >
                  {on ? 1 : 0}
                </button>
              ) : (
                <div className={cls}>{on ? 1 : 0}</div>
              )}
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {w}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center font-mono text-[11px] leading-4 text-muted-foreground">
        {lit.length ? lit.join(" + ") : "0"} = {value}
        <br />
        <span className="font-semibold text-foreground">
          {value} → {nibble.digit}
        </span>
      </p>
    </div>
  );
}

/** Decimal → binary / hex by repeated division */
function DivisionTable({ value, base }: { value: bigint; base: 2 | 16 }) {
  const steps = divSteps(value, base);
  const digits = steps
    .map((s) => s.remainder.toString(16).toUpperCase())
    .reverse()
    .join("");
  const answer = base === 2 ? group4(digits) : digits;

  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-4">
      <div className="min-w-[320px]">
        <div className="mb-2 grid grid-cols-[1.2fr_1fr_1fr] gap-2 text-[11px] font-medium text-muted-foreground">
          <span>Divide</span>
          <span>Quotient</span>
          <span>Remainder{base === 16 ? " (hex digit)" : ""}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {steps.map((s, i) => (
            <div
              key={i}
              className="vns-in grid grid-cols-[1.2fr_1fr_1fr] items-center gap-2 font-mono text-xs"
              style={{ animationDelay: `${Math.min(i, 10) * 0.12 * SLOW}s` }}
            >
              <span>
                {s.dividend} ÷ {base}
              </span>
              <span className="text-muted-foreground">{s.quotient}</span>
              <span>
                <span className="inline-flex min-w-8 justify-center rounded-md border border-primary bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  {s.remainder}
                  {base === 16 && s.remainder > 9
                    ? ` → ${s.remainder.toString(16).toUpperCase()}`
                    : ""}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Stop when the quotient is 0. Read the remainders from{" "}
          <span className="font-medium text-foreground">bottom to top</span>:{" "}
          <span className="font-mono font-semibold text-foreground">{answer}</span>
        </p>
      </div>
    </div>
  );
}

/** Binary → decimal: add the place values of the 1 bits */
function PlaceValueStrip({
  bits,
  onToggle,
}: {
  bits: string;
  onToggle: (index: number) => void;
}) {
  const n = bits.length;
  const cells = bits.split("").map((b, i) => ({
    on: b === "1",
    weight: (ONE << BigInt(n - 1 - i)).toString(),
  }));
  const lit = cells.filter((c) => c.on).map((c) => c.weight);
  const total = cells
    .filter((c) => c.on)
    .reduce((a, c) => a + BigInt(c.weight), ZERO);

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="overflow-x-auto pb-2">
        <div className="flex w-max gap-1.5">
          {cells.map((c, i) => (
            <div
              key={i}
              className="vns-in flex flex-col items-center gap-1"
              style={{ animationDelay: `${Math.min(i, 16) * 0.06 * SLOW}s` }}
            >
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {c.weight}
              </span>
              <button
                type="button"
                onClick={() => onToggle(i)}
                aria-pressed={c.on}
                aria-label={`Bit worth ${c.weight}, currently ${c.on ? 1 : 0}. Click to flip.`}
                className={`flex size-9 items-center justify-center rounded-md border font-mono text-sm font-semibold outline-none transition-colors duration-300 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring ${
                  c.on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {c.on ? 1 : 0}
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
        {lit.length ? lit.join(" + ") : "0"} ={" "}
        <span className="font-semibold text-foreground">{total.toString()}</span>
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Click any bit to flip it. Only the bits that are 1 are added.
      </p>
    </div>
  );
}

/** Hex → decimal: digit × 16^position */
function HexPowersTable({ hex }: { hex: string }) {
  const n = hex.length;
  const rows = hex.split("").map((d, i) => {
    const pos = n - 1 - i;
    const weight = ONE << BigInt(4 * pos);
    const dv = BigInt(parseInt(d, 16));
    return { d, dv, pos, weight, product: dv * weight };
  });
  const total = rows.reduce((a, r) => a + r.product, ZERO);

  return (
    <div className="overflow-x-auto rounded-xl border bg-background p-4">
      <div className="min-w-[420px]">
        <div className="mb-2 grid grid-cols-[0.6fr_0.6fr_1.4fr_1.2fr] gap-2 text-[11px] font-medium text-muted-foreground">
          <span>Digit</span>
          <span>Value</span>
          <span>Place value</span>
          <span>Digit × place</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((r, i) => (
            <div
              key={i}
              className="vns-in grid grid-cols-[0.6fr_0.6fr_1.4fr_1.2fr] items-center gap-2 font-mono text-xs"
              style={{ animationDelay: `${Math.min(i, 10) * 0.12 * SLOW}s` }}
            >
              <span className="inline-flex size-7 items-center justify-center rounded-md border border-dashed font-semibold">
                {r.d}
              </span>
              <span>{r.dv.toString()}</span>
              <span className="text-muted-foreground">
                16^{r.pos} = {r.weight.toString()}
              </span>
              <span className="font-semibold text-primary">
                {r.dv.toString()} × {r.weight.toString()} = {r.product.toString()}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
          {rows.map((r) => r.product.toString()).join(" + ")} ={" "}
          <span className="font-semibold text-foreground">{total.toString()}</span>
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function NumberSystemConverter() {
  const [from, setFromState] = useState<Base>("hex");
  const [to, setToState] = useState<Base>("bin");
  const [decInput, setDecInput] = useState("170");
  const [hexInput, setHexInput] = useState("2F9A");
  const [binInput, setBinInput] = useState("1011 0110 0011");

  // Picking the same base on both sides swaps the other side instead
  const setFrom = (b: Base) => {
    if (b === to) setToState(from);
    setFromState(b);
  };
  const setTo = (b: Base) => {
    if (b === from) setFromState(to);
    setToState(b);
  };

  const mode = `${from}2${to}`;

  const cleaned = useMemo(() => {
    const c =
      from === "dec"
        ? cleanDec(decInput)
        : from === "hex"
          ? cleanHex(hexInput)
          : cleanBin(binInput);
    if (c.error) return c;
    if (to === "dec") {
      if (from === "bin" && c.text.length > 64)
        return { error: "For decimal output keep binary to 64 bits or fewer." };
      if (from === "hex" && c.text.length > 16)
        return { error: "For decimal output keep hex to 16 digits or fewer." };
    }
    const value = BigInt(
      from === "dec" ? c.text : from === "hex" ? `0x${c.text}` : `0b${c.text}`,
    );
    return { error: "" as const, text: c.text, value };
  }, [from, to, decInput, hexInput, binInput]);

  const input = from === "dec" ? decInput : from === "hex" ? hexInput : binInput;
  const setInput =
    from === "dec" ? setDecInput : from === "hex" ? setHexInput : setBinInput;

  const toggleNibbleBit = (nibbleIndex: number, bitIndex: number) => {
    if (cleaned.error) return;
    const { nibbles } = binToNibbles(cleaned.text);
    const flat = nibbles.map((n) => n.bits).join("");
    const pos = nibbleIndex * 4 + bitIndex;
    const flipped =
      flat.slice(0, pos) + (flat[pos] === "1" ? "0" : "1") + flat.slice(pos + 1);
    setBinInput(group4(flipped));
  };

  const toggleBit = (index: number) => {
    if (cleaned.error) return;
    const flat = cleaned.text;
    const flipped =
      flat.slice(0, index) +
      (flat[index] === "1" ? "0" : "1") +
      flat.slice(index + 1);
    setBinInput(group4(flipped));
  };

  const append = (digit: string) => {
    if (from === "hex") {
      setHexInput((v) => (v.trim() === "" ? digit : v + digit));
    } else if (from === "bin") {
      const bits = parseInt(digit, 16).toString(2).padStart(4, "0");
      setBinInput((v) => (v.trim() === "" ? bits : `${v.trim()} ${bits}`));
    }
  };

  /* what to show */
  let note = "";
  let resultText = "";
  let body: React.ReactNode = null;

  if (!cleaned.error) {
    const value = cleaned.value;

    if (mode === "hex2bin") {
      const nibbles = hexToNibbles(cleaned.text);
      note = `${nibbles.length} hex digit${nibbles.length > 1 ? "s" : ""} × 4 bits = ${nibbles.length * 4} bits${
        nibbles.length % 2 === 0
          ? ` (${nibbles.length / 2} byte${nibbles.length > 2 ? "s" : ""})`
          : ""
      }.`;
      resultText = nibbles.map((n) => n.bits).join(" ");
      body = (
        <div className="flex flex-wrap gap-3">
          {nibbles.map((n, i) => (
            <NibbleCard key={i} nibble={n} index={i} direction="hex2bin" />
          ))}
        </div>
      );
    } else if (mode === "bin2hex") {
      const { nibbles, pad } = binToNibbles(cleaned.text);
      note =
        pad > 0
          ? `Padded with ${pad} leading zero${pad > 1 ? "s" : ""} on the left so the bits split into groups of 4.`
          : `${cleaned.text.length} bits ÷ 4 = ${nibbles.length} hex digit${nibbles.length > 1 ? "s" : ""}.`;
      resultText = `0x${nibbles.map((n) => n.digit).join("")}`;
      body = (
        <>
          <div className="flex flex-wrap gap-3">
            {nibbles.map((n, i) => (
              <NibbleCard
                key={i}
                nibble={n}
                index={i}
                direction="bin2hex"
                onToggle={(b) => toggleNibbleBit(i, b)}
              />
            ))}
          </div>
          <p className="-mt-2 text-[11px] text-muted-foreground">
            Click any bit to flip it and watch the hex digit change.
          </p>
        </>
      );
    } else if (mode === "dec2bin") {
      note = "Divide by 2 again and again. Each remainder is one bit.";
      resultText = group4(value.toString(2));
      body = <DivisionTable value={value} base={2} />;
    } else if (mode === "dec2hex") {
      note = "Divide by 16 again and again. Each remainder is one hex digit (10–15 become A–F).";
      resultText = `0x${value.toString(16).toUpperCase()}`;
      body = <DivisionTable value={value} base={16} />;
    } else if (mode === "bin2dec") {
      note = "Each bit position is worth double the one to its right. Add up the positions that hold a 1.";
      resultText = value.toString();
      body = <PlaceValueStrip bits={cleaned.text} onToggle={toggleBit} />;
    } else if (mode === "hex2dec") {
      note = "Each hex digit is multiplied by 16 raised to its position, counting from 0 on the right.";
      resultText = value.toString();
      body = <HexPowersTable hex={cleaned.text} />;
    }
  }

  const placeholder =
    from === "dec" ? "170" : from === "hex" ? "2F9A or 2001:0DB8" : "1011 0110 0011";

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes vns-in {
          from { opacity: 0; transform: translateY(10px) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
        .vns-in { animation: vns-in ${0.45 * SLOW}s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .vns-in { animation: none; } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Number system converter</CardTitle>
            <CardDescription className="mt-1">
              Convert between decimal, binary and hex and see the working.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* From / To switches */}
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          {(
            [
              ["From", from, setFrom],
              ["To", to, setTo],
            ] as const
          ).map(([label, current, set]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
              <div className="inline-flex rounded-lg border bg-background p-1">
                {BASES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => set(b.id)}
                    aria-pressed={current === b.id}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      current === b.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <label className="block text-xs font-medium">
          {BASE_LABEL[from]} value
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-2 bg-background font-mono"
            placeholder={placeholder}
            inputMode={from === "hex" ? "text" : "numeric"}
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        {/* Tap-to-add grid (hex and binary input only) */}
        {from !== "dec" && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              Tap a digit to add it {from === "bin" ? "as 4 bits " : ""}to the
              input:
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {HEX_DIGITS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => append(d)}
                  className="flex flex-col items-center rounded-md border bg-background py-1.5 outline-none transition-colors hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-mono text-sm font-semibold">{d}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {parseInt(d, 16).toString(2).padStart(4, "0")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {cleaned.error && (
          <p role="alert" className="mt-4 text-xs font-medium text-destructive">
            {cleaned.error}
          </p>
        )}

        {!cleaned.error && (
          <div className="mt-6 flex flex-col gap-5">
            <p className="text-xs text-muted-foreground">{note}</p>

            {/* Remounted on mode change so the working animates in again */}
            <div key={mode} className="flex flex-col gap-4">
              {body}
            </div>

            {/* Result */}
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Result · {BASE_LABEL[to]}
              </p>
              <p className="mt-1 break-all font-mono text-lg font-semibold">
                {resultText}
              </p>
              <div className="mt-3 grid gap-2 border-t pt-3 text-xs sm:grid-cols-3">
                <p>
                  <span className="text-muted-foreground">Decimal </span>
                  <span className="break-all font-mono font-medium">
                    {cleaned.value.toString()}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Binary </span>
                  <span className="break-all font-mono font-medium">
                    {group4(cleaned.value.toString(2))}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Hex </span>
                  <span className="break-all font-mono font-medium">
                    0x{cleaned.value.toString(16).toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}