import { useState } from "react";

/**
 * Traffic forwarding methods in switches (CCNA)
 * Self-contained. Uses Tailwind core utility classes + a little inline style.
 * Usage: <SwitchForwardingMethods />
 */

type MethodId = "sf" | "ct" | "ff";

interface Method {
  id: MethodId;
  name: string;
  alias: string;
  color: string; // main colour
  tint: string; // background tint
  on: string; // text colour used on top of the main colour
  readUpTo: number; // % of the frame bar the switch reads before it decides
  readLabel: string;
  oneLiner: string;
  analogy: string;
  how: string[];
  speed: number; // 1-3
  checking: number; // 1-3
  bestFor: string;
  crc: "Yes" | "No" | "Partly";
}

const METHODS: Method[] = [
  {
    id: "sf",
    name: "Store & forward",
    alias: "Slowest, safest",
    color: "var(--c-blue)",
    tint: "var(--t-blue)",
    on: "var(--on-blue)",
    readUpTo: 100,
    readLabel: "The whole frame, including the FCS at the end",
    oneLiner:
      "Wait for the entire frame, check it for damage, then forward it.",
    analogy:
      "A mail room that opens every parcel, checks nothing is broken, and only then sends it on. Safe, but each parcel waits longer.",
    how: [
      "The switchport copies the entire frame into buffer memory.",
      "It runs a CRC (Cyclic Redundancy Check) on the frame to see if it was damaged.",
      "Good frame: forward it. Bad frame: drop it.",
    ],
    speed: 1,
    checking: 3,
    bestFor:
      "Sensitive environments where a corrupted frame must never be passed on.",
    crc: "Yes",
  },
  {
    id: "ct",
    name: "Cut-through",
    alias: "Fastest, no checking",
    color: "var(--c-orange)",
    tint: "var(--t-orange)",
    on: "var(--on-orange)",
    readUpTo: 12,
    readLabel: "Only the destination MAC (first 6 bytes)",
    oneLiner:
      "Read just enough to know where it is going, then start sending immediately.",
    analogy:
      "A sorting clerk who glances at the address label and throws the parcel straight onto the right truck. Very quick, but damaged parcels get through too.",
    how: [
      "The switchport reads only the start of the header: the destination MAC (usually the first 6 bytes).",
      "It looks up that MAC and starts forwarding right away, while the rest of the frame is still arriving.",
      "No error checking happens, so bad frames can be forwarded.",
    ],
    speed: 3,
    checking: 1,
    bestFor:
      "Real-time traffic such as voice and video, where low delay matters most.",
    crc: "No",
  },
  {
    id: "ff",
    name: "Modified cut-through",
    alias: "Fragment-free, the middle ground",
    color: "var(--c-teal)",
    tint: "var(--t-teal)",
    on: "var(--on-teal)",
    readUpTo: 50,
    readLabel: "The first 64 bytes of the frame",
    oneLiner:
      "Read the first 64 bytes, where most damage happens, then forward.",
    analogy:
      "A clerk who checks the address AND quickly inspects the box for the most common kind of damage, then sends it. Faster than a full check, safer than none.",
    how: [
      "The switchport copies the first 64 bytes into buffer memory.",
      "It uses them to learn the destination MAC and to catch most collision fragments and corruption.",
      "Then it starts forwarding. It never checks the FCS at the end, so the check is not complete.",
    ],
    speed: 2,
    checking: 2,
    bestFor:
      "A balance: faster than store & forward, with some protection against bad frames.",
    crc: "Partly",
  },
];

// Stylised frame (widths are NOT to scale; real payloads are far bigger)
const FRAME_PARTS = [
  {
    label: "Dest MAC",
    sub: "6 bytes",
    w: 12,
    tip: "Who the frame is for. The switch needs this to forward.",
  },
  {
    label: "Src MAC",
    sub: "6 bytes",
    w: 12,
    tip: "Who sent it. The switch learns this for its MAC table.",
  },
  { label: "Type", sub: "2 bytes", w: 8, tip: "What is inside, e.g. IPv4." },
  {
    label: "Payload (start)",
    sub: "to byte 64",
    w: 18,
    tip: "The first part of the data. Counts toward the first 64 bytes.",
  },
  {
    label: "Payload (rest)",
    sub: "up to 1500 bytes",
    w: 38,
    tip: "The remaining data.",
  },
  {
    label: "FCS",
    sub: "4 bytes",
    w: 12,
    tip: "Frame Check Sequence: the CRC result stored at the very end. Only store & forward gets to see it.",
  },
];

function Dots({ n, color }: { n: number; color: string }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${n} out of 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: i <= n ? color : "var(--dot-off)" }}
        />
      ))}
    </span>
  );
}

export function SwitchForwardingMethods() {
  const [active, setActive] = useState<MethodId>("sf");
  const [hovered, setHovered] = useState<number | null>(null);
  const m = METHODS.find((x) => x.id === active)!;

  // where each frame part starts, so we can colour the portion that was read
  let acc = 0;
  const parts = FRAME_PARTS.map((p) => {
    const start = acc;
    acc += p.w;
    return { ...p, start };
  });

  return (
    <div
      className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 sm:p-6 md:p-8 shadow-sm"
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: "var(--ink)",
        borderColor: "var(--line)",
        background: "var(--surface)",
      }}
    >
      <style>{`
        .sw {
          --ink:#1b2330; --muted:#445063; --faint:#5f6b7d;
          --line:#dde2ea; --line-strong:#b9c1cd; --panel:#f8f9fb; --surface:#ffffff; --head:#f1f3f7;
          --dot-off:#d6dbe3; --link:#8b95a5; --dead-link:#d4a5a5;
          --c-blue:#2b5fd9; --t-blue:#eaf0fd; --on-blue:#ffffff;
          --c-orange:#c2410c; --t-orange:#fdeee5; --on-orange:#ffffff;
          --c-teal:#0f7f6c; --t-teal:#e3f4f0; --on-teal:#ffffff;
          --c-purple:#7c3aed; --t-purple:#f1ebfd; --on-purple:#ffffff;
          --c-gray:#5a6577; --on-gray:#ffffff;
          --c-red:#e11d48; --t-red:#fdecef;
          --err:#b91c1c; --err-bg:#fde8e8; --err-text:#7f1d1d;
          --ok-text:#0b5c4e;
          color:var(--ink);
        }
        @media (prefers-color-scheme: dark) {
          :root:not(.light):not([data-theme="light"]) .sw { --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
          --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
          --dot-off:#3a4455; --link:#6b7686; --dead-link:#6a4a4f;
          --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
          --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
          --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
          --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
          --c-gray:#9aa6b8; --on-gray:#0f1620;
          --c-red:#fb7185; --t-red:#3a1a22;
          --err:#ff8a8a; --err-bg:#3a1b1e; --err-text:#ffc1c1;
          --ok-text:#7fe6d0; }
        }
        :root.dark .sw, .dark .sw, [data-theme="dark"] .sw { --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
          --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
          --dot-off:#3a4455; --link:#6b7686; --dead-link:#6a4a4f;
          --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
          --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
          --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
          --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
          --c-gray:#9aa6b8; --on-gray:#0f1620;
          --c-red:#fb7185; --t-red:#3a1a22;
          --err:#ff8a8a; --err-bg:#3a1b1e; --err-text:#ffc1c1;
          --ok-text:#7fe6d0; }
      `}</style>
      {/* Header */}
      <h1 className="text-2xl font-bold sm:text-3xl">
        How a switch forwards frames
      </h1>
      <p
        className="mt-2 text-base leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        When a frame arrives at a switch, the switch has to decide:{" "}
        <b>how much of this frame do I look at before I send it on?</b> Looking
        at more means catching more errors, but it takes longer. That trade-off
        (speed vs error checking) is the whole topic.
      </p>

      {/* Key terms for beginners */}
      <div className="mt-5 grid items-stretch gap-3 sm:grid-cols-3">
        {[
          [
            "Frame",
            "A packet of data at Layer 2 (Ethernet). It has a header, the data, and a trailer.",
          ],
          [
            "MAC address",
            "The hardware address of a device. The switch reads the destination MAC to know which port to send the frame out of.",
          ],
          [
            "CRC / FCS",
            "A maths check on the frame. The sender stores the result in the FCS at the end. The receiver redoes the maths: if it does not match, the frame was damaged.",
          ],
        ].map(([t, d]) => (
          <div
            key={t}
            className="flex h-full flex-col rounded-lg border p-3 text-sm leading-relaxed"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <div className="font-semibold">{t}</div>
            <div style={{ color: "var(--muted)" }}>{d}</div>
          </div>
        ))}
      </div>

      {/* Method selector */}
      <h2 className="mt-8 text-lg font-semibold">Pick a method</h2>
      <div role="tablist" className="mt-2 grid gap-2 sm:grid-cols-3">
        {METHODS.map((x) => {
          const on = x.id === active;
          return (
            <button
              key={x.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(x.id)}
              className="rounded-lg border-2 px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: on ? x.color : "var(--line)",
                background: on ? x.tint : "var(--surface)",
              }}
            >
              <div
                className="font-semibold"
                style={{ color: on ? x.color : "var(--ink)" }}
              >
                {x.name}
              </div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                {x.alias}
              </div>
            </button>
          );
        })}
      </div>

      {/* Frame visual */}
      <div
        className="mt-5 rounded-xl border p-4"
        style={{ borderColor: m.color, background: m.tint }}
      >
        <p className="text-base font-medium" style={{ color: m.color }}>
          {m.oneLiner}
        </p>

        <div className="mt-4 text-sm font-semibold">
          An Ethernet frame, left to right as it arrives
        </div>
        <div className="relative mt-2">
          {/* frame parts */}
          <div
            className="flex overflow-hidden rounded-md border"
            style={{
              borderColor: "var(--line-strong)",
              background: "var(--surface)",
            }}
          >
            {parts.map((p, i) => {
              const read = p.start + p.w <= m.readUpTo + 0.01;
              return (
                <div
                  key={p.label}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex min-h-[64px] flex-col items-center justify-center border-r px-0.5 text-center last:border-r-0"
                  style={{
                    width: `${p.w}%`,
                    borderColor: "var(--line-strong)",
                    background: read ? m.color : "var(--surface)",
                    color: read ? m.on : "var(--muted)",
                    transition: "background 500ms ease, color 500ms ease",
                    transitionDelay: read ? `${p.start * 8}ms` : "0ms",
                  }}
                >
                  <span className="text-[10px] font-semibold leading-tight sm:text-xs">
                    {p.label}
                  </span>
                  <span className="text-[9px] leading-tight opacity-80 sm:text-[11px]">
                    {p.sub}
                  </span>
                </div>
              );
            })}
          </div>

          {/* decision marker */}
          <div
            className="pointer-events-none absolute -bottom-1 top-0 w-0.5"
            style={{
              left: `${m.readUpTo}%`,
              background: "var(--ink)",
              transition: "left 500ms ease",
              transform: m.readUpTo === 100 ? "translateX(-2px)" : undefined,
            }}
          />
        </div>

        <div className="mt-3 flex items-start gap-2 text-sm">
          <span
            className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm"
            style={{ background: m.color }}
          />
          <span>
            <b>Coloured part = what the switch reads.</b> {m.readLabel}. The
            black line marks the moment the switch has what it needs.
          </span>
        </div>

        <div
          className="mt-2 min-h-[2.5rem] text-sm"
          style={{ color: "var(--muted)" }}
          aria-live="polite"
        >
          {hovered !== null ? (
            <span>
              <b>{parts[hovered].label}:</b> {parts[hovered].tip}
            </span>
          ) : (
            <span>Hover over a part of the frame to see what it is.</span>
          )}
        </div>
        <div className="text-xs" style={{ color: "var(--faint)" }}>
          Part widths are simplified for the picture, not to scale.
        </div>
      </div>

      {/* How it works + analogy */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--line)" }}
        >
          <h3 className="font-semibold">What happens, step by step</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {m.how.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--line)" }}
        >
          <h3 className="font-semibold">Think of it like this</h3>
          <p className="mt-2 text-sm leading-relaxed">{m.analogy}</p>
          <h3 className="mt-4 font-semibold">Use it when</h3>
          <p className="mt-1 text-sm leading-relaxed">{m.bestFor}</p>
        </div>
      </div>

      {/* Scorecard for the selected method */}
      <div
        className="mt-5 grid grid-cols-3 gap-3 rounded-xl border p-4 text-sm"
        style={{ borderColor: "var(--line)" }}
      >
        <div>
          <div className="mb-1 font-semibold">Speed</div>
          <Dots n={m.speed} color={m.color} />
        </div>
        <div>
          <div className="mb-1 font-semibold">Error checking</div>
          <Dots n={m.checking} color={m.color} />
        </div>
        <div>
          <div className="mb-1 font-semibold">Checks CRC?</div>
          <span className="font-medium" style={{ color: m.color }}>
            {m.crc}
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <h2 className="mt-8 text-lg font-semibold">Side by side</h2>
      <div
        className="mt-2 overflow-x-auto rounded-xl border"
        style={{ borderColor: "var(--line)" }}
      >
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr style={{ background: "var(--head)" }}>
              <th className="w-[22%] p-3 font-semibold">Method</th>
              <th className="w-[44%] p-3 font-semibold">Reads</th>
              <th className="w-[17%] p-3 font-semibold">Speed</th>
              <th className="w-[17%] p-3 font-semibold">Error checking</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map((x) => (
              <tr
                key={x.id}
                onClick={() => setActive(x.id)}
                className="cursor-pointer border-t"
                style={{
                  borderColor: "var(--line)",
                  background: x.id === active ? x.tint : "transparent",
                }}
              >
                <td className="p-3 font-semibold" style={{ color: x.color }}>
                  {x.name}
                </td>
                <td className="p-3">{x.readLabel}</td>
                <td className="p-3">
                  <Dots n={x.speed} color={x.color} />
                </td>
                <td className="p-3">
                  <Dots n={x.checking} color={x.color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exam helpers */}
      <div
        className="mt-6 rounded-xl border p-4 text-sm leading-relaxed"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        <h3 className="font-semibold">Remember it for the exam</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            The more of the frame the switch reads, the <b>slower</b> it is but
            the <b>safer</b> it is.
          </li>
          <li>
            Store &amp; forward = reads <b>everything</b>. Fragment-free = reads{" "}
            <b>64 bytes</b>. Cut-through = reads <b>6 bytes</b>.
          </li>
          <li>
            Fragment-free sits in the middle: it is the &ldquo;modified&rdquo;
            version of cut-through, and it exists because most collisions and
            corruption show up within the first 64 bytes.
          </li>
          <li>
            Voice and video care about delay more than the odd lost frame, so
            cut-through suits them.
          </li>
        </ul>
      </div>
    </div>
  );
}
