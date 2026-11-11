import { useEffect, useState, type CSSProperties } from "react";

/**
 * Trunk ports, tagging, ISL vs 802.1Q: interactive visual lab (CCNA)
 * Visuals only. Light/dark aware through CSS variables. Shares its look with AccessPortLab.
 * Usage: <TrunkPortLab />
 */

const THEME_CSS = `
  .sw {
    --ink:#1b2330; --muted:#445063; --faint:#5f6b7d;
    --line:#dde2ea; --line-strong:#b9c1cd; --panel:#f8f9fb; --surface:#ffffff; --head:#f1f3f7;
    --link:#8b95a5; --ok:#15803d;
    --c-blue:#2b5fd9; --t-blue:#eaf0fd; --on-blue:#ffffff;
    --c-orange:#c2410c; --t-orange:#fdeee5; --on-orange:#ffffff;
    --c-teal:#0f7f6c; --t-teal:#e3f4f0; --on-teal:#ffffff;
    --c-purple:#7c3aed; --t-purple:#f1ebfd; --on-purple:#ffffff;
    --c-pink:#be185d; --t-pink:#fce7f3; --on-pink:#ffffff;
    --c-gray:#5a6577; --t-gray:#eef0f4; --on-gray:#ffffff;
    --c-red:#e11d48; --t-red:#fdecef;
    --err:#b91c1c; --err-bg:#fde8e8;
    color:var(--ink);
  }
  @media (prefers-color-scheme: dark) {
    :root:not(.light):not([data-theme="light"]) .sw {
      --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
      --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
      --link:#6b7686; --ok:#4ade80;
      --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
      --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
      --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
      --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
      --c-pink:#f472b6; --t-pink:#3b1a2c; --on-pink:#2a0a1b;
      --c-gray:#9aa6b8; --t-gray:#232b37; --on-gray:#0f1620;
      --c-red:#fb7185; --t-red:#3a1a22;
      --err:#ff8a8a; --err-bg:#3a1b1e;
    }
  }
  :root.dark .sw, .dark .sw, [data-theme="dark"] .sw {
    --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
    --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
    --link:#6b7686; --ok:#4ade80;
    --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
    --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
    --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
    --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
    --c-pink:#f472b6; --t-pink:#3b1a2c; --on-pink:#2a0a1b;
    --c-gray:#9aa6b8; --t-gray:#232b37; --on-gray:#0f1620;
    --c-red:#fb7185; --t-red:#3a1a22;
    --err:#ff8a8a; --err-bg:#3a1b1e;
  }

  @keyframes tp-pulse { 0%,100% { stroke-opacity:.95; } 50% { stroke-opacity:.2; } }
  @keyframes tp-flash { 0% { opacity:0; transform: scale(.4); } 60% { opacity:1; transform: scale(1.2); } 100% { opacity:1; transform: scale(1); } }
  @keyframes tp-line  { from { opacity:0; transform: translateY(3px); } to { opacity:1; transform:none; } }
  @keyframes tp-lane  { to { stroke-dashoffset: -20; } }
  .tp-pulse { animation: tp-pulse 1.2s ease-in-out infinite; }
  .tp-flash { animation: tp-flash .45s ease-out both; transform-box: fill-box; transform-origin: center; }
  .tp-line  { animation: tp-line .3s ease-out both; }
  .tp-lane  { stroke-dasharray: 10 10; animation: tp-lane .8s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .tp-pulse,.tp-flash,.tp-line,.tp-lane { animation-duration: .01s; animation-iteration-count: 1; }
  }
`;

// ---------- data ----------
const VLAN_IDS = [1, 10, 20, 30, 40, 2000];
const NATIVE_IDS = [1, 10, 20, 30, 40];
const VNAME: Record<number, string> = { 1: "default", 10: "HR", 20: "IT", 30: "Marketing", 40: "Management", 2000: "extended" };
const VC: Record<number, string> = {
  1: "var(--c-gray)", 10: "var(--c-blue)", 20: "var(--c-teal)", 30: "var(--c-orange)", 40: "var(--c-purple)", 2000: "var(--c-pink)",
};
const VT: Record<number, string> = {
  1: "var(--t-gray)", 10: "var(--t-blue)", 20: "var(--t-teal)", 30: "var(--t-orange)", 40: "var(--t-purple)", 2000: "var(--t-pink)",
};
const VON: Record<number, string> = {
  1: "var(--on-gray)", 10: "var(--on-blue)", 20: "var(--on-teal)", 30: "var(--on-orange)", 40: "var(--on-purple)", 2000: "var(--on-pink)",
};

type Encap = "dot1q" | "isl";
type Vendor = "cisco" | "other";

// token x position (centre) per stage
const STAGE_X = [50, 140, 280, 350, 420, 560, 650];
const LAST_STAGE = 6;
const FAIL_STAGE = 2;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function TrunkPortLab() {
  const [vlan, setVlan] = useState(10);
  const [native, setNative] = useState(1);
  const [encap, setEncap] = useState<Encap>("dot1q");
  const [vendor, setVendor] = useState<Vendor>("cisco");
  const [stage, setStage] = useState(-1); // -1 = idle
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<"slow" | "normal">("slow");

  // ---- what happens to this frame ----
  const linkOk = !(encap === "isl" && vendor === "other");
  const rangeOk = encap === "dot1q" || vlan <= 1005;
  const failReason: "link" | "range" | null = !linkOk ? "link" : !rangeOk ? "range" : null;
  const failed = failReason !== null;
  const tagged = encap === "isl" || vlan !== native;
  const maxStage = failed ? FAIL_STAGE : LAST_STAGE;

  useEffect(() => {
    if (!running) return;
    if (stage >= maxStage) { setRunning(false); return; }
    const t = setTimeout(() => setStage((s) => s + 1), speed === "slow" ? 2800 : 1100);
    return () => clearTimeout(t);
  }, [running, stage, maxStage, speed]);

  function change(fn: () => void) {
    fn();
    setStage(-1);
    setRunning(false);
  }
  function send() {
    setStage(0);
    setRunning(true);
  }
  function toggleRun() {
    if (running) { setRunning(false); return; }
    if (stage >= 0 && stage < maxStage) { setRunning(true); return; }
    send();
  }
  function nextStep() {
    setRunning(false);
    setStage((s) => (s < 0 || s >= maxStage ? 0 : s + 1));
  }
  function prevStep() {
    setRunning(false);
    setStage((s) => Math.max(-1, s - 1));
  }
  function jumpTo(i: number) {
    setRunning(false);
    setStage(i);
  }

  const tagOpen = tagged && !failed && stage >= 2 && stage <= 4;
  const atFail = failed && stage >= FAIL_STAGE;
  const tokenX = stage < 0 ? STAGE_X[0] : STAGE_X[Math.min(stage, LAST_STAGE)];

  let caption = "Pick a VLAN and send a frame.";
  if (stage >= 0) {
    if (atFail) {
      caption = failReason === "link"
        ? "Dropped: other vendors do not support ISL, so the trunk never comes up."
        : `Dropped: ISL only supports VLANs 1-1005, and this is VLAN ${vlan}.`;
    } else {
      caption = [
        "Host sends a normal frame.",
        "Access port: the frame stays untagged.",
        !tagged ? `VLAN ${vlan} is the native VLAN: no tag is added.`
          : encap === "isl" ? "Trunk port attaches the 26-byte ISL tag."
          : "Trunk port attaches the 4-byte VLAN tag.",
        tagged ? "Tagged frame crosses the trunk." : "Untagged frame crosses the trunk.",
        !tagged ? "Switch B sees no tag: it is the native VLAN."
          : `Switch B trunk port reads the tag: VLAN ${vlan}.`,
        `${tagged ? "Tag removed. " : ""}Forwarded only to VLAN ${vlan} access ports.`,
        `Delivered to the host in VLAN ${vlan}.`,
      ][stage];
    }
  }

  const btn = (on: boolean, c = "var(--c-blue)", t = "var(--t-blue)"): CSSProperties => ({
    borderColor: on ? c : "var(--line)",
    background: on ? t : "var(--surface)",
  });
  const h2 = "mt-8 text-lg font-semibold";

  // frame-strip field box
  const field = (label: string, key: string) => (
    <div
      key={key}
      className="shrink-0 rounded-md border px-2.5 py-2 text-center text-[11px] font-semibold sm:text-xs"
      style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}
    >
      {label}
    </div>
  );
  const tagBox = (kind: Encap, label: string, wide: number) => {
    const open = tagOpen && encap === kind;
    return (
      <div
        key={`tag-${kind}`}
        className="shrink-0 overflow-hidden whitespace-nowrap rounded-md text-center text-[11px] font-bold sm:text-xs"
        style={{
          maxWidth: open ? wide : 0,
          opacity: open ? 1 : 0,
          padding: open ? "8px 10px" : "8px 0",
          borderWidth: open ? 2 : 0,
          borderStyle: "solid",
          borderColor: VC[vlan],
          background: VC[vlan],
          color: VON[vlan],
          boxShadow: open && stage === 4 ? "0 0 0 3px var(--c-red)" : "none",
          transition: "max-width .6s ease, opacity .6s ease, padding .6s ease, box-shadow .3s",
        }}
      >
        {label}
      </div>
    );
  };

  const pinLeft = Math.min(97, (vlan / 4094) * 100);

  return (
    <div
      className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: "var(--ink)",
        borderColor: "var(--line)",
        background: "var(--surface)",
      }}
    >
      <style>{THEME_CSS}</style>

      <h1 className="text-2xl font-bold sm:text-3xl">Trunk ports lab</h1>

      {/* ---------- controls ---------- */}
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <div className="mb-1 font-semibold">Frame from VLAN</div>
          <div className="flex flex-wrap gap-2">
            {VLAN_IDS.map((v) => (
              <button
                key={v}
                onClick={() => change(() => setVlan(v))}
                aria-pressed={vlan === v}
                className="rounded-full border-2 px-3 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2"
                style={{ borderColor: VC[v], background: vlan === v ? VT[v] : "var(--surface)", color: VC[v], boxShadow: vlan === v ? `0 0 0 2px ${VC[v]}` : "none" }}
              >
                VLAN {v} <span className="font-normal opacity-80">{VNAME[v]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-stretch gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 font-semibold">Tagging protocol</div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["dot1q", "IEEE 802.1Q", "dot1q, newer Cisco default"],
                ["isl", "ISL", "Inter-Switch Link"],
              ] as [Encap, string, string][]).map(([id, name, sub]) => (
                <button
                  key={id}
                  onClick={() => change(() => setEncap(id))}
                  aria-pressed={encap === id}
                  className="flex h-full flex-col rounded-lg border-2 px-3 py-2 text-left focus:outline-none focus-visible:ring-2"
                  style={btn(encap === id)}
                >
                  <span className="font-semibold" style={{ color: encap === id ? "var(--c-blue)" : "var(--ink)" }}>{name}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 font-semibold">Switch B is</div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["cisco", "Cisco", "same vendor"],
                ["other", "Other vendor", "multivendor"],
              ] as [Vendor, string, string][]).map(([id, name, sub]) => (
                <button
                  key={id}
                  onClick={() => change(() => setVendor(id))}
                  aria-pressed={vendor === id}
                  className="flex h-full flex-col rounded-lg border-2 px-3 py-2 text-left focus:outline-none focus-visible:ring-2"
                  style={btn(vendor === id)}
                >
                  <span className="font-semibold" style={{ color: vendor === id ? "var(--c-blue)" : "var(--ink)" }}>{name}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ opacity: encap === "dot1q" ? 1 : 0.4, transition: "opacity .3s" }}>
          <div className="mb-1 font-semibold">Native VLAN</div>
          <div className="flex flex-wrap gap-2">
            {NATIVE_IDS.map((v) => (
              <button
                key={v}
                onClick={() => change(() => setNative(v))}
                disabled={encap !== "dot1q"}
                aria-pressed={native === v}
                className="rounded-full border-2 px-3 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2"
                style={{ ...btn(native === v, VC[v], VT[v]), color: VC[v] }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- journey ---------- */}
      <h2 className={h2}>Follow the frame</h2>
      <div className="mt-2 rounded-xl border p-2 sm:p-3" style={{ borderColor: "var(--line)" }}>
        <svg viewBox="0 0 700 230" className="block h-auto w-full" role="img" aria-label="A frame crossing a trunk between two switches">
          {/* switches */}
          <rect x={140} y={40} width={140} height={150} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
          <text x={210} y={62} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">Switch A</text>
          <text x={210} y={80} textAnchor="middle" fontSize={10} fill="var(--muted)">Cisco</text>
          <rect x={420} y={40} width={140} height={150} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
          <text x={490} y={62} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">Switch B</text>
          <text x={490} y={80} textAnchor="middle" fontSize={10} fill="var(--muted)">{vendor === "cisco" ? "Cisco" : "Other vendor"}</text>

          {/* hosts */}
          {[{ x: 10, n: "Host A" }, { x: 610, n: "Host B" }].map((h) => (
            <g key={h.n}>
              <rect x={h.x} y={85} width={80} height={60} rx={8} fill="var(--surface)" stroke={VC[vlan]} strokeWidth={2.5} style={{ transition: "stroke .4s" }} />
              <rect x={h.x + 14} y={95} width={52} height={22} rx={3} fill="var(--panel)" stroke="var(--line-strong)" />
              <text x={h.x + 40} y={133} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">{h.n}</text>
              <rect x={h.x + 12} y={152} width={56} height={16} rx={8} fill={VC[vlan]} style={{ transition: "fill .4s" }} />
              <text x={h.x + 40} y={163.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={VON[vlan]}>VLAN {vlan}</text>
            </g>
          ))}

          {/* access cables */}
          <line x1={90} y1={115} x2={128} y2={115} stroke={VC[vlan]} strokeWidth={5} strokeLinecap="round" style={{ transition: "stroke .4s" }} />
          <line x1={572} y1={115} x2={610} y2={115} stroke={VC[vlan]} strokeWidth={5} strokeLinecap="round" style={{ transition: "stroke .4s" }} />

          {/* trunk cable */}
          {linkOk ? (
            [10, 20, 30, 40].map((v, k) => (
              <line key={v} x1={292} y1={103 + k * 8} x2={408} y2={103 + k * 8} stroke={VC[v]} strokeWidth={4} strokeLinecap="round" />
            ))
          ) : (
            <g>
              <line x1={292} y1={115} x2={408} y2={115} stroke="var(--err)" strokeWidth={3} className="tp-lane" />
              <text x={350} y={122} textAnchor="middle" fontSize={26} fontWeight={700} fill="var(--err)">×</text>
            </g>
          )}
          <text x={350} y={88} textAnchor="middle" fontSize={11} fontWeight={700} fill={linkOk ? "var(--ink)" : "var(--err)"}>
            {linkOk ? (encap === "dot1q" ? "802.1Q trunk" : "ISL trunk") : "no trunk"}
          </text>

          {/* ports */}
          {[
            { x: 140, kind: "access" as const },
            { x: 280, kind: "trunk" as const },
            { x: 420, kind: "trunk" as const },
            { x: 560, kind: "access" as const },
          ].map((p) => (
            <g key={p.x}>
              <rect x={p.x - 12} y={98} width={24} height={34} rx={5} fill={p.kind === "trunk" ? "var(--ink)" : VC[vlan]} style={{ transition: "fill .4s" }} />
              <text x={p.x} y={150} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink)">{p.kind}</text>
              <text x={p.x} y={163} textAnchor="middle" fontSize={9} fill="var(--muted)">{p.kind === "trunk" ? "tagged" : "untagged"}</text>
            </g>
          ))}
          {encap === "dot1q" && (
            <g>
              {[280, 420].map((x) => (
                <g key={x}>
                  <rect x={x - 33} y={170} width={66} height={15} rx={7.5} fill={VT[native]} stroke={VC[native]} strokeWidth={1.5} style={{ transition: "fill .4s, stroke .4s" }} />
                  <text x={x} y={181} textAnchor="middle" fontSize={9} fontWeight={700} fill={VC[native]}>native {native}</text>
                </g>
              ))}
            </g>
          )}

          {/* travelling frame */}
          {stage >= 0 && (
            <g transform="translate(0,115)">
              <g style={{ transform: `translateX(${tokenX}px)`, transition: `transform ${speed === "slow" ? 1.8 : 0.9}s cubic-bezier(.5,0,.3,1)`, opacity: atFail ? 0.35 : 1 }}>
                <rect x={-18} y={-11} width={36} height={22} rx={4} fill={VC[vlan]} stroke="var(--surface)" strokeWidth={1.5} />
                <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill={VON[vlan]}>{vlan}</text>
                {tagOpen && (
                  <g className="tp-line">
                    <rect x={encap === "isl" ? -30 : -18} y={-25} width={encap === "isl" ? 60 : 36} height={11} rx={3} fill="var(--surface)" stroke={VC[vlan]} strokeWidth={2} />
                    <text x={0} y={-16.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={VC[vlan]}>{encap === "isl" ? "ISL tag" : "tag"}</text>
                  </g>
                )}
              </g>
              {atFail && (
                <text x={280} y={-26} textAnchor="middle" fontSize={34} fontWeight={700} fill="var(--c-red)" className="tp-flash">×</text>
              )}
            </g>
          )}
        </svg>

        <div
          className="mx-1 mb-1 rounded-lg border-2 px-3 py-2 text-sm font-medium"
          style={{
            borderColor: atFail ? "var(--err)" : "var(--line)",
            background: atFail ? "var(--err-bg)" : "var(--panel)",
            minHeight: "2.5rem",
          }}
          aria-live="polite"
        >
          {caption}
        </div>

        {/* frame on the wire */}
        <div className="mt-3 px-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Frame on the wire</span>
            {stage >= 0 && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{
                  background: tagOpen ? VC[vlan] : "var(--t-gray)",
                  color: tagOpen ? VON[vlan] : "var(--muted)",
                  transition: "background .4s",
                }}
              >
                {tagOpen ? `Tagged, VLAN ${vlan}` : "Untagged"}
              </span>
            )}
          </div>
          <div className="flex items-stretch gap-1.5 overflow-x-auto pb-2">
            {tagBox("isl", "ISL tag 26 B", 130)}
            {field("Dst MAC", "dst")}
            {field("Src MAC", "src")}
            {tagBox("dot1q", `VLAN tag 4 B`, 130)}
            {field("IP header", "ip")}
            {field("TCP header", "tcp")}
            {field("Data payload", "data")}
          </div>
        </div>

        {/* step dots */}
        <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1" role="group" aria-label="Jump to step">
          {Array.from({ length: maxStage + 1 }, (_, i) => {
            const done = i < stage;
            const now = i === stage;
            return (
              <button
                key={i}
                onClick={() => jumpTo(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={now}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold focus:outline-none focus-visible:ring-2"
                style={{
                  borderColor: now || done ? (atFail && i === FAIL_STAGE ? "var(--err)" : VC[vlan]) : "var(--line-strong)",
                  background: now ? (atFail && i === FAIL_STAGE ? "var(--err)" : VC[vlan]) : done ? VT[vlan] : "var(--surface)",
                  color: now ? VON[vlan] : "var(--ink)",
                  transition: "background .3s, border-color .3s",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* buttons */}
        <div className="flex flex-wrap items-center gap-2 px-1 pb-1 pt-3 text-sm">
          <button
            onClick={prevStep}
            disabled={stage < 0}
            className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40"
            style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}
          >
            Previous step
          </button>
          <button
            onClick={nextStep}
            className="rounded-lg border-2 px-4 py-1.5 font-semibold"
            style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}
          >
            {stage >= maxStage ? "Replay from step 1" : stage < 0 ? "Start, step 1" : "Next step"}
          </button>
          <button
            onClick={toggleRun}
            className="rounded-lg border px-3 py-1.5 font-semibold"
            style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}
          >
            {running ? "Pause" : stage >= 0 && stage < maxStage ? "Resume auto" : stage >= maxStage ? "Auto-play again" : "Auto-play"}
          </button>
          <button
            onClick={() => { setStage(-1); setRunning(false); }}
            className="rounded-lg border px-3 py-1.5"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            Reset
          </button>
          <div className="ml-auto flex items-center gap-1.5 text-xs">
            <span style={{ color: "var(--faint)" }}>Auto speed</span>
            {(["slow", "normal"] as const).map((sp) => (
              <button
                key={sp}
                onClick={() => setSpeed(sp)}
                aria-pressed={speed === sp}
                className="rounded-full border px-2.5 py-1 font-semibold"
                style={btn(speed === sp)}
              >
                {sp === "slow" ? "Slow" : "Normal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- ISL vs dot1q ---------- */}
      <h2 className={h2}>ISL vs 802.1Q</h2>
      <div className="mt-2 grid items-stretch gap-3 sm:grid-cols-2">
        {/* tag size */}
        <div className="flex h-full flex-col rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <div className="text-sm font-semibold">Tag size</div>
          <div className="mt-3 space-y-3">
            {([
              ["isl", "ISL", 26, "var(--c-orange)"],
              ["dot1q", "802.1Q", 4, "var(--c-teal)"],
            ] as [Encap, string, number, string][]).map(([id, name, bytes, color]) => (
              <div key={id} style={{ opacity: encap === id ? 1 : 0.4, transition: "opacity .3s" }}>
                <div className="mb-1 flex justify-between text-xs font-bold" style={{ color }}>
                  <span>{name}</span>
                  <span>{bytes} bytes</span>
                </div>
                <div className="h-5 w-full rounded" style={{ background: "var(--head)" }}>
                  <div
                    className="h-5 rounded"
                    style={{ width: `${(bytes / 26) * 100}%`, background: color, transition: "width .6s ease" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* range */}
        <div className="flex h-full flex-col rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
          <div className="text-sm font-semibold">VLAN range supported</div>
          <div className="relative mt-6">
            <div className="flex h-6 w-full overflow-hidden rounded border" style={{ borderColor: "var(--line-strong)" }}>
              <div style={{ width: `${(1005 / 4094) * 100}%`, background: "var(--c-blue)" }} />
              <div className="flex-1" style={{ background: "var(--c-purple)" }} />
            </div>
            {/* pin for the chosen VLAN */}
            <div
              className="absolute -top-5 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${pinLeft}%`, transition: "left .5s ease" }}
            >
              <span className="rounded px-1.5 text-[10px] font-bold" style={{ background: VC[vlan], color: VON[vlan] }}>{vlan}</span>
              <span style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${VC[vlan]}` }} />
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs font-bold">
            <div style={{ opacity: encap === "isl" ? 1 : 0.4, transition: "opacity .3s" }}>
              <div className="h-1.5 border-x-2 border-b-2" style={{ width: `${(1005 / 4094) * 100}%`, borderColor: "var(--c-blue)" }} />
              <span style={{ color: "var(--c-blue)" }}>ISL: 1-1005</span>
            </div>
            <div style={{ opacity: encap === "dot1q" ? 1 : 0.4, transition: "opacity .3s" }}>
              <div className="h-1.5 w-full border-x-2 border-b-2" style={{ borderColor: "var(--c-purple)" }} />
              <span style={{ color: "var(--c-purple)" }}>802.1Q: 1-4094</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs" style={{ color: "var(--faint)" }}>
        Change the options at the top, then send the frame again to see what changes.
      </p>
    </div>
  );
}