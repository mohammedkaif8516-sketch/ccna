import { useEffect, useState, type CSSProperties } from "react";

/**
 * Access & trunk ports: interactive visual lab (CCNA)
 * Visuals only. Light/dark aware through CSS variables.
 * Usage: <AccessPortLab />
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
    --c-gray:#5a6577; --t-gray:#eef0f4; --on-gray:#ffffff;
    --c-red:#e11d48; --t-red:#fdecef;
    --err:#b91c1c;
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
      --c-gray:#9aa6b8; --t-gray:#232b37; --on-gray:#0f1620;
      --c-red:#fb7185; --t-red:#3a1a22;
      --err:#ff8a8a;
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
    --c-gray:#9aa6b8; --t-gray:#232b37; --on-gray:#0f1620;
    --c-red:#fb7185; --t-red:#3a1a22;
    --err:#ff8a8a;
  }

  @keyframes al-pass   { from { transform: translateX(0); } to { transform: translateX(var(--dx)); } }
  @keyframes al-stop   { 0% { transform: translateX(0) scale(1); opacity:1; }
                         65% { transform: translateX(var(--dx)) scale(1); opacity:1; }
                         100% { transform: translateX(var(--dx)) scale(.3); opacity:0; } }
  @keyframes al-flash  { 0%,55% { opacity:0; } 70% { opacity:1; } 100% { opacity:0; } }
  @keyframes al-packet { from { transform: translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; }
                         to { transform: translateX(300px); opacity:0; } }
  @keyframes al-pulse  { 0%,100% { stroke-opacity:.95; } 50% { stroke-opacity:.2; } }
  @keyframes al-type   { from { width:0; } to { width:var(--w); } }
  @keyframes al-line   { from { opacity:0; transform: translateY(3px); } to { opacity:1; transform:none; } }
  @keyframes al-pop    { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 100% { transform: scale(1); } }
  @keyframes al-shake  { 0%,100% { transform:none; } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); }
                         60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
  .al-pass { animation: al-pass 2.2s linear forwards; }
  .al-stop { animation: al-stop 1.3s ease-in forwards; }
  .al-flash { animation: al-flash 1.3s linear forwards; }
  .al-packet { animation: al-packet 1.8s linear infinite; }
  .al-pulse { animation: al-pulse 1.2s ease-in-out infinite; }
  .al-line { animation: al-line .3s ease-out both; }
  .al-pop { animation: al-pop .5s ease-out; }
  .al-shake { animation: al-shake .4s ease-in-out; }
  .al-type { display:inline-block; overflow:hidden; white-space:nowrap; vertical-align:bottom; }
  @media (prefers-reduced-motion: reduce) {
    .al-pass,.al-stop,.al-flash,.al-packet,.al-pulse,.al-pop,.al-shake,.al-line { animation-duration: .01s; animation-iteration-count: 1; }
    .al-type { animation: none !important; width: auto !important; }
  }
`;

// ---------- data ----------
const VLANS = [
  { id: 10, name: "HR", subnet: "192.168.10.0/24" },
  { id: 20, name: "IT", subnet: "192.168.20.0/24" },
  { id: 30, name: "Marketing", subnet: "192.168.30.0/24" },
  { id: 40, name: "Management", subnet: "192.168.40.0/24" },
];
const VNAME: Record<number, string> = { 1: "default", 10: "HR", 20: "IT", 30: "Marketing", 40: "Management" };
const VC: Record<number, string> = {
  1: "var(--c-gray)", 10: "var(--c-blue)", 20: "var(--c-teal)", 30: "var(--c-orange)", 40: "var(--c-purple)",
};
const VT: Record<number, string> = {
  1: "var(--t-gray)", 10: "var(--t-blue)", 20: "var(--t-teal)", 30: "var(--t-orange)", 40: "var(--t-purple)",
};
const VON: Record<number, string> = {
  1: "var(--on-gray)", 10: "var(--on-blue)", 20: "var(--on-teal)", 30: "var(--on-orange)", 40: "var(--on-purple)",
};

interface Port {
  vlan: number;
  mode: "dynamic" | "access";
  desc: string;
  shut: boolean;
}
const SLOTS = 6;
const PPS = 4;
const TOTAL = SLOTS * PPS;
const sName = (i: number) => `Fa${Math.floor(i / PPS)}/${i % PPS}`;
const fName = (i: number) => `FastEthernet${Math.floor(i / PPS)}/${i % PPS}`;
const defaultPort = (): Port => ({ vlan: 1, mode: "dynamic", desc: "", shut: false });

// Step-by-step config of f0/0
const CMDS = [
  { cmd: "interface f0/0", out: [] as string[] },
  { cmd: "description CCTV-VLAN30", out: [] },
  { cmd: "switchport mode access", out: [] },
  { cmd: "switchport access vlan 30", out: [] },
  {
    cmd: "no sh",
    out: [
      "%LINK-3-UPDOWN: Interface FastEthernet0/0, changed state to up",
      "%LINEPROTO-5-UPDOWN: Line protocol on Interface FastEthernet0/0, changed state to up",
    ],
  },
  { cmd: "exit", out: [] },
];
const SHUFFLE = [3, 0, 5, 1, 4, 2]; // order the chips appear in "Try it" mode
const simPort = (step: number): Port => ({
  vlan: step >= 4 ? 30 : 1,
  mode: step >= 3 ? "access" : "dynamic",
  desc: step >= 2 ? "CCTV-VLAN30" : "",
  shut: step < 5,
});
const promptFor = (i: number) => (i === 0 ? "Switch(config)#" : "Switch(config-if)#");

// ---------- range helpers ----------
function genRange(sel: Set<number>): string {
  const parts: string[] = [];
  for (let s = 0; s < SLOTS; s++) {
    let p = 0;
    while (p < PPS) {
      if (sel.has(s * PPS + p)) {
        let q = p;
        while (q + 1 < PPS && sel.has(s * PPS + q + 1)) q++;
        parts.push(q === p ? `f${s}/${p}` : `f${s}/${p}-${q}`);
        p = q + 1;
      } else p++;
    }
  }
  return parts.join(", ");
}
function parseRange(text: string): { set: Set<number>; bad: boolean } {
  const set = new Set<number>();
  let bad = false;
  text
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((tok) => {
      const m = tok.match(/^f(?:a|astethernet)?\s*(\d+)\s*\/\s*(\d+)(?:\s*-\s*(\d+))?$/i);
      if (!m) { bad = true; return; }
      const s = +m[1], a = +m[2], b = m[3] !== undefined ? +m[3] : a;
      if (s >= SLOTS || a >= PPS || b >= PPS || b < a) { bad = true; return; }
      for (let p = a; p <= b; p++) set.add(s * PPS + p);
    });
  return { set, bad };
}
const EXAMPLE = "f0/0-3, f1/2-3, f2/0-2, f4/3, f5/2";

// ---------- show-command output builders ----------
const pad = (s: string | number, n: number) => String(s).padEnd(n);
interface OutLine { text: string; hi?: boolean }

function buildShowVlan(ports: Port[], focus: number | null): OutLine[] {
  const out: OutLine[] = [
    { text: "VLAN Name                             Status    Ports" },
    { text: "---- -------------------------------- --------- -------------------------------" },
  ];
  [1, 10, 20, 30, 40].forEach((v) => {
    const names = ports.map((p, i) => (p.vlan === v ? sName(i) : "")).filter(Boolean);
    const rows: string[] = [];
    let cur = "";
    names.forEach((n) => {
      const next = cur ? `${cur}, ${n}` : n;
      if (next.length > 31 && cur) { rows.push(cur + ","); cur = n; } else cur = next;
    });
    if (cur || rows.length === 0) rows.push(cur);
    rows.forEach((r, k) =>
      out.push({
        text: k === 0 ? `${pad(v, 5)}${pad(VNAME[v], 33)}${pad("active", 10)}${r}` : `${" ".repeat(48)}${r}`,
        hi: focus === v,
      })
    );
  });
  return out;
}
function buildIpBrief(ports: Port[]): OutLine[] {
  const out: OutLine[] = [{ text: "Interface              IP-Address      OK? Method Status                Protocol" }];
  ports.forEach((p, i) =>
    out.push({
      text: `${pad(fName(i), 23)}${pad("unassigned", 16)}${pad("YES", 5)}${pad("unset", 7)}${pad(p.shut ? "administratively down" : "up", 22)}${p.shut ? "down" : "up"}`,
      hi: p.vlan !== 1 || p.shut,
    })
  );
  return out;
}
function buildStatus(ports: Port[]): OutLine[] {
  const out: OutLine[] = [{ text: "Port      Name               Status       Vlan       Duplex  Speed Type" }];
  ports.forEach((p, i) =>
    out.push({
      text: `${pad(sName(i), 10)}${pad(p.desc.slice(0, 18), 19)}${pad(p.shut ? "disabled" : "connected", 13)}${pad(p.vlan, 11)}${pad("a-full", 8)}${pad("a-100", 6)}10/100BaseTX`,
      hi: p.vlan !== 1 || p.shut,
    })
  );
  return out;
}
function buildRun(p: Port, i: number): OutLine[] {
  const body = [
    "!",
    `interface ${fName(i)}`,
    ...(p.desc ? [` description ${p.desc}`] : []),
    ...(p.vlan !== 1 ? [` switchport access vlan ${p.vlan}`] : []),
    ...(p.mode === "access" ? [" switchport mode access"] : []),
    ...(p.shut ? [" shutdown"] : []),
    "end",
  ];
  const bytes = body.join("\n").length;
  return [
    { text: "Building configuration..." },
    { text: "" },
    { text: `Current configuration : ${bytes} bytes` },
    ...body.map((t) => ({ text: t, hi: t.startsWith(" switchport") || t.startsWith(" description") })),
  ];
}

type VTab = "vlan" | "ipbr" | "status" | "run";
const VTABS: [VTab, string][] = [
  ["vlan", "show vlan"],
  ["ipbr", "sh ip int br"],
  ["status", "sh int status"],
  ["run", "sh run int f0/0"],
];

interface Shot { id: number; vlan: number; blocked: boolean }

// ---------- component ----------
export function AccessPortLab() {
  // shared switch state
  const [step, setStep] = useState(0);
  const [ports, setPorts] = useState<Port[]>(() => {
    const p = Array.from({ length: TOTAL }, defaultPort);
    p[0] = simPort(0);
    return p;
  });
  const [focus, setFocus] = useState<number | null>(null);

  // port types
  const [ptype, setPtype] = useState<"access" | "trunk">("access");
  const [shots, setShots] = useState<Shot[]>([]);
  const [shotId, setShotId] = useState(0);
  const [msg, setMsg] = useState("");

  // config sim
  const [simMode, setSimMode] = useState<"watch" | "try">("watch");
  const [playing, setPlaying] = useState(false);
  const [wrong, setWrong] = useState<{ idx: number; n: number } | null>(null);
  const [misses, setMisses] = useState(0);

  // range tool
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState("");
  const [bad, setBad] = useState(false);
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [echo, setEcho] = useState("");

  // verification
  const [vtab, setVtab] = useState<VTab>("vlan");
  const [runPort, setRunPort] = useState(0);

  function go(n: number) {
    const c = Math.max(0, Math.min(CMDS.length, n));
    setStep(c);
    setPorts((prev) => {
      const next = [...prev];
      next[0] = simPort(c);
      return next;
    });
  }
  function resetSim() {
    setPlaying(false);
    setMisses(0);
    setWrong(null);
    go(0);
  }

  useEffect(() => {
    if (!playing) return;
    if (step >= CMDS.length) { setPlaying(false); return; }
    const t = setTimeout(() => go(step + 1), 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step]);

  function pickChip(idx: number) {
    if (idx === step) { setMisses(0); setWrong(null); go(step + 1); }
    else { setMisses((m) => m + 1); setWrong({ idx, n: Date.now() }); }
  }

  // ----- port type demo -----
  function sendFrame(v: number) {
    const blocked = ptype === "access" && v !== 30;
    const id = shotId + 1;
    setShotId(id);
    setShots((s) => [...s, { id, vlan: v, blocked }]);
    setMsg(
      blocked
        ? `VLAN ${v} frame dropped at the access port. The port only carries VLAN 30.`
        : ptype === "access"
        ? "VLAN 30 frame delivered to the host."
        : `VLAN ${v} frame carried across the trunk.`
    );
  }

  // ----- range tool -----
  function toggle(i: number) {
    const n = new Set(sel);
    if (n.has(i)) n.delete(i); else n.add(i);
    setSel(n);
    setDraft(genRange(n));
    setBad(false);
    setEcho("");
  }
  function onDraft(v: string) {
    setDraft(v);
    const r = parseRange(v);
    setSel(r.set);
    setBad(r.bad);
    setEcho("");
  }
  function applyVlan(v: number) {
    if (sel.size === 0) return;
    setPorts((prev) => {
      const next = [...prev];
      sel.forEach((i) => { next[i] = { ...next[i], vlan: v, mode: "access" }; });
      return next;
    });
    setPopped(new Set(sel));
    setTimeout(() => setPopped(new Set()), 900);
    setEcho(`Switch(config-if-range)# switchport mode access\nSwitch(config-if-range)# switchport access vlan ${v}`);
  }
  function resetPorts() {
    const p = Array.from({ length: TOTAL }, defaultPort);
    p[0] = simPort(step);
    setPorts(p);
    setSel(new Set());
    setDraft("");
    setEcho("");
    setBad(false);
  }

  // ----- verification output -----
  const lines: OutLine[] =
    vtab === "vlan" ? buildShowVlan(ports, focus)
    : vtab === "ipbr" ? buildIpBrief(ports)
    : vtab === "status" ? buildStatus(ports)
    : buildRun(ports[runPort], runPort);

  // ----- derived for sim visual -----
  const sp = simPort(step);
  const inVlan30 = sp.vlan === 30;
  const up = !sp.shut;
  const selectedRing = step >= 1 && step < 6;
  const last = step > 0 ? CMDS[step - 1] : null;

  const btn = (on: boolean, c = "var(--c-blue)", t = "var(--t-blue)"): CSSProperties => ({
    borderColor: on ? c : "var(--line)",
    background: on ? t : "var(--surface)",
  });

  const h2 = "mt-8 text-lg font-semibold";

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

      <h1 className="text-2xl font-bold sm:text-3xl">Access ports lab</h1>

      {/* ---------- VLAN plan legend ---------- */}
      <div className="mt-4 grid grid-cols-2 items-stretch gap-2 sm:grid-cols-4">
        {VLANS.map((v) => {
          const on = focus === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setFocus(on ? null : v.id)}
              aria-pressed={on}
              className="flex h-full flex-col rounded-lg border-2 p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderColor: VC[v.id], background: on ? VT[v.id] : "var(--surface)" }}
            >
              <span
                className="w-fit rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: VC[v.id], color: VON[v.id] }}
              >
                VLAN {v.id}
              </span>
              <span className="mt-1.5 text-sm font-semibold">{v.name}</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{v.subnet}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--faint)" }}>Click a VLAN to spotlight its ports everywhere below.</p>

      {/* ---------- two port types ---------- */}
      <h2 className={h2}>Two port types</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(["access", "trunk"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setPtype(t); setShots([]); setMsg(""); }}
            aria-pressed={ptype === t}
            className="rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...btn(ptype === t), color: ptype === t ? "var(--c-blue)" : "var(--ink)" }}
          >
            {t === "access" ? "Access port" : "Trunk port"}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border p-2 sm:p-3" style={{ borderColor: "var(--line)" }}>
        <svg viewBox="0 0 660 210" className="block h-auto w-full" role="img" aria-label="A switch port connected to a device">
          {/* switch */}
          <rect x={20} y={35} width={170} height={140} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
          <text x={105} y={58} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">Switch</text>

          {/* cable */}
          {ptype === "access" ? (
            <line x1={202} y1={105} x2={470} y2={105} stroke={VC[30]} strokeWidth={5} strokeLinecap="round" />
          ) : (
            [10, 20, 30, 40].map((v, k) => (
              <line key={v} x1={202} y1={93 + k * 8} x2={470} y2={93 + k * 8} stroke={VC[v]} strokeWidth={4} strokeLinecap="round" />
            ))
          )}

          {/* port tile */}
          <rect x={178} y={88} width={26} height={34} rx={5} fill={ptype === "access" ? VC[30] : "var(--ink)"} />
          <text x={191} y={80} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">Fa0/0</text>
          <text x={191} y={140} textAnchor="middle" fontSize={11} fontWeight={700} fill={ptype === "access" ? VC[30] : "var(--ink)"}>
            {ptype === "access" ? "access" : "trunk"}
          </text>
          {ptype === "access" && (
            <g>
              <rect x={150} y={146} width={82} height={17} rx={8.5} fill={VC[30]} />
              <text x={191} y={158} textAnchor="middle" fontSize={10} fontWeight={700} fill={VON[30]}>VLAN 30 only</text>
            </g>
          )}

          {/* far end */}
          {ptype === "access" ? (
            <g>
              <rect x={470} y={78} width={90} height={54} rx={8} fill="var(--surface)" stroke={VC[30]} strokeWidth={2.5} />
              <rect x={484} y={88} width={62} height={26} rx={3} fill="var(--panel)" stroke="var(--line-strong)" />
              <text x={515} y={148} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)">Host</text>
              <rect x={485} y={158} width={60} height={16} rx={8} fill={VC[30]} />
              <text x={515} y={170} textAnchor="middle" fontSize={10} fontWeight={700} fill={VON[30]}>VLAN 30</text>
            </g>
          ) : (
            <g>
              <rect x={470} y={35} width={170} height={140} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
              <text x={555} y={58} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">Switch B</text>
              <rect x={456} y={88} width={26} height={34} rx={5} fill="var(--ink)" />
              <text x={469} y={80} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">trunk</text>
            </g>
          )}

          {/* travelling frames */}
          {shots.map((s) => {
            const dx = s.blocked ? 115 : ptype === "access" ? 380 : 400;
            return (
              <g key={s.id} transform="translate(65,105)">
                <g
                  className={s.blocked ? "al-stop" : "al-pass"}
                  style={{ "--dx": `${dx}px` } as CSSProperties}
                  onAnimationEnd={() => setShots((arr) => arr.filter((x) => x.id !== s.id))}
                >
                  <rect x={-16} y={-10} width={32} height={20} rx={4} fill={VC[s.vlan]} stroke="var(--surface)" strokeWidth={1.5} />
                  <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill={VON[s.vlan]}>{s.vlan}</text>
                </g>
                {s.blocked && (
                  <text x={dx + 28} y={6} textAnchor="middle" fontSize={26} fontWeight={700} fill="var(--c-red)" className="al-flash" opacity={0}>×</text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-center gap-2 px-1 pb-1 text-sm">
          <span className="font-semibold">Send a frame:</span>
          {[10, 20, 30, 40].map((v) => (
            <button
              key={v}
              onClick={() => sendFrame(v)}
              className="rounded-full border-2 px-3 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2"
              style={{ borderColor: VC[v], background: VT[v], color: VC[v] }}
            >
              VLAN {v}
            </button>
          ))}
        </div>
        <div className="min-h-[1.5rem] px-1 pb-1 text-sm" style={{ color: "var(--muted)" }} aria-live="polite">{msg}</div>
      </div>

      {/* ---------- configuration ---------- */}
      <h2 className={h2}>Configure an access port</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(
          [
            ["watch", "Watch it happen"],
            ["try", "You type it in order"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setSimMode(id); resetSim(); }}
            aria-pressed={simMode === id}
            className="rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...btn(simMode === id), color: simMode === id ? "var(--c-blue)" : "var(--ink)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border p-2 sm:p-3" style={{ borderColor: "var(--line)" }}>
        <svg viewBox="0 0 660 260" className="block h-auto w-full" role="img" aria-label="Port moving between VLANs as it is configured">
          {/* lanes */}
          <rect x={8} y={10} width={644} height={110} rx={10} fill="var(--t-gray)" stroke="var(--c-gray)" strokeWidth={inVlan30 ? 1 : 3} style={{ transition: "stroke-width .4s" }} />
          <text x={22} y={32} fontSize={12} fontWeight={700} fill="var(--c-gray)">VLAN 1 (default)</text>
          <rect x={8} y={140} width={644} height={110} rx={10} fill="var(--t-orange)" stroke="var(--c-orange)" strokeWidth={inVlan30 ? 3 : 1} style={{ transition: "stroke-width .4s" }} />
          <text x={22} y={162} fontSize={12} fontWeight={700} fill="var(--c-orange)">VLAN 30 (Marketing)</text>

          {/* the port row slides between lanes */}
          <g transform="translate(0,75)">
            <g style={{ transform: `translateY(${inVlan30 ? 130 : 0}px)`, transition: "transform 1s cubic-bezier(.5,0,.2,1)" }}>
              {/* cable */}
              <line
                x1={150}
                y1={0}
                x2={470}
                y2={0}
                stroke={up ? "var(--ok)" : "var(--link)"}
                strokeWidth={up ? 4 : 2.5}
                strokeDasharray={up ? undefined : "4 6"}
                style={{ transition: "stroke .4s" }}
              />
              <text x={310} y={-10} textAnchor="middle" fontSize={11} fontWeight={700} fill={up ? "var(--ok)" : "var(--err)"}>
                {up ? "link up" : "administratively down"}
              </text>
              {up &&
                [0, 0.6, 1.2].map((d) => (
                  <circle
                    key={d}
                    cx={158}
                    cy={0}
                    r={5}
                    fill={VC[sp.vlan]}
                    className="al-packet"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}

              {/* camera */}
              <rect x={470} y={-22} width={64} height={44} rx={7} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
              <circle cx={502} cy={0} r={11} fill="var(--panel)" stroke="var(--ink)" strokeWidth={1.5} />
              <circle cx={502} cy={0} r={4} fill={up ? "var(--ok)" : "var(--link)"} />
              <text x={502} y={40} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">CCTV cam</text>

              {/* port tile */}
              {selectedRing && (
                <rect x={64} y={-23} width={92} height={46} rx={9} fill="none" stroke="var(--c-red)" strokeWidth={3} className="al-pulse" />
              )}
              <rect
                x={70}
                y={-18}
                width={80}
                height={36}
                rx={6}
                fill={VT[sp.vlan]}
                stroke={VC[sp.vlan]}
                strokeWidth={2.5}
                style={{ transition: "fill .5s, stroke .5s" }}
              />
              <text x={110} y={5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">Fa0/0</text>
              <circle cx={150} cy={0} r={6.5} fill={up ? "var(--ok)" : "var(--err)"} stroke="var(--surface)" strokeWidth={2} style={{ transition: "fill .4s" }} />

              {/* mode pill */}
              <g style={{ opacity: sp.mode === "access" ? 1 : 0, transition: "opacity .5s" }}>
                <rect x={80} y={-40} width={60} height={17} rx={8.5} fill={VC[sp.vlan]} />
                <text x={110} y={-28} textAnchor="middle" fontSize={10} fontWeight={700} fill={VON[sp.vlan]}>access</text>
              </g>

              {/* description */}
              <text
                x={110}
                y={36}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="var(--ink)"
                style={{ opacity: sp.desc ? 1 : 0, transition: "opacity .5s" }}
              >
                {sp.desc || "CCTV-VLAN30"}
              </text>
            </g>
          </g>
        </svg>

        {/* terminal */}
        <div
          className="mt-2 rounded-lg p-3 text-xs leading-relaxed sm:text-sm"
          style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", minHeight: 150 }}
        >
          {step === 0 && <div style={{ color: "#7b8aa0" }}>Switch(config)#</div>}
          {CMDS.slice(0, step).map((c, i) => {
            const fresh = i === step - 1;
            return (
              <div key={i}>
                <div>
                  <span style={{ color: "#7fe6d0" }}>{promptFor(i)}</span>{" "}
                  <span
                    className={fresh ? "al-type" : undefined}
                    style={
                      fresh
                        ? ({ "--w": `${c.cmd.length}ch`, color: "#ffffff", animation: `al-type .7s steps(${c.cmd.length}) both` } as CSSProperties)
                        : { color: "#ffffff" }
                    }
                  >
                    {c.cmd}
                  </span>
                </div>
                {c.out.map((o, k) => (
                  <div key={k} className={fresh ? "al-line" : undefined} style={{ color: "#f5c26b", animationDelay: fresh ? `${0.8 + k * 0.4}s` : undefined }}>
                    {o}
                  </div>
                ))}
              </div>
            );
          })}
          {step > 0 && (
            <div style={{ color: "#7fe6d0" }}>
              {step >= 6 ? "Switch(config)#" : "Switch(config-if)#"}
              <span className="al-pulse" style={{ marginLeft: 4 }}>▌</span>
            </div>
          )}
        </div>

        {/* controls */}
        {simMode === "watch" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <button onClick={() => { setPlaying(false); go(step - 1); }} disabled={step === 0} className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}>
              Back
            </button>
            <button onClick={() => { setPlaying(false); go(step + 1); }} disabled={step >= CMDS.length} className="rounded-lg border-2 px-4 py-1.5 font-semibold disabled:opacity-40" style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}>
              Next command
            </button>
            <button
              onClick={() => { if (step >= CMDS.length) go(0); setPlaying((p) => !p); }}
              className="rounded-lg border px-3 py-1.5 font-semibold"
              style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}
            >
              {playing ? "Pause" : "Auto-play"}
            </button>
            <button onClick={resetSim} className="rounded-lg border px-3 py-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
              Reset
            </button>
            <span className="ml-auto text-xs" style={{ color: "var(--faint)" }}>{step} / {CMDS.length}</span>
          </div>
        ) : (
          <div className="mt-3 text-sm">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="font-semibold">
                {step >= CMDS.length ? "Port configured." : "Tap the next command:"}
              </span>
              <button onClick={resetSim} className="ml-auto rounded-lg border px-3 py-1" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SHUFFLE.filter((idx) => idx >= step).map((idx) => {
                const hint = misses >= 2 && idx === step;
                const isWrong = wrong && wrong.idx === idx;
                return (
                  <button
                    key={isWrong ? `${idx}-${wrong!.n}` : idx}
                    onClick={() => pickChip(idx)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-xs font-semibold sm:text-sm ${isWrong ? "al-shake" : ""}`}
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      borderColor: isWrong ? "var(--err)" : hint ? "var(--c-teal)" : "var(--line-strong)",
                      background: hint ? "var(--t-teal)" : "var(--surface)",
                    }}
                  >
                    {CMDS[idx].cmd}
                  </button>
                );
              })}
            </div>
            {wrong && <div className="mt-1.5 text-xs" style={{ color: "var(--err)" }}>Not that one yet.</div>}
          </div>
        )}
        {last && simMode === "watch" && <div className="sr-only" aria-live="polite">{last.cmd}</div>}
      </div>

      {/* ---------- range ---------- */}
      <h2 className={h2}>Many ports at once: interface range</h2>
      <div className="mt-2 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => onDraft(EXAMPLE)}
            className="rounded-lg border-2 px-3 py-1.5 font-semibold"
            style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}
          >
            Load the example
          </button>
          <button onClick={() => { setSel(new Set()); setDraft(""); setBad(false); setEcho(""); }} className="rounded-lg border px-3 py-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            Clear selection
          </button>
          <button onClick={resetPorts} className="rounded-lg border px-3 py-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            Reset all ports
          </button>
          <span className="ml-auto text-xs" style={{ color: "var(--faint)" }}>Click ports, or type in the command</span>
        </div>

        {/* command line */}
        <div
          className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg p-3 text-xs sm:text-sm"
          style={{ background: "#0e141b", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
        >
          <span style={{ color: "#7fe6d0" }}>Switch(config)#</span>
          <span style={{ color: "#ffffff" }}>interface range</span>
          <input
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            spellCheck={false}
            aria-label="Port range"
            placeholder="f0/0-3, f1/2"
            className="min-w-[10rem] flex-1 rounded border bg-transparent px-2 py-1 outline-none focus-visible:ring-2"
            style={{ borderColor: bad ? "#ff8a8a" : "#3a4658", color: "#f5c26b" }}
          />
        </div>
        {bad && <div className="mt-1 text-xs" style={{ color: "var(--err)" }}>Some of that is not a valid port. Ports here are f0/0 to f5/3.</div>}

        {/* faceplate */}
        <div className="mt-3 overflow-x-auto">
          <div className="inline-block min-w-full rounded-lg border p-3" style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}>
            {Array.from({ length: SLOTS }, (_, s) => (
              <div key={s} className="flex items-center gap-2 py-1">
                <span className="w-7 shrink-0 text-xs font-bold" style={{ color: "var(--muted)" }}>f{s}</span>
                {Array.from({ length: PPS }, (_, p) => {
                  const i = s * PPS + p;
                  const port = ports[i];
                  const selected = sel.has(i);
                  const dim = focus !== null && port.vlan !== focus;
                  return (
                    <button
                      key={i}
                      onClick={() => toggle(i)}
                      aria-pressed={selected}
                      aria-label={`${sName(i)} VLAN ${port.vlan}${selected ? ", selected" : ""}`}
                      className={`relative flex h-12 w-16 flex-col items-center justify-center rounded-md border-2 text-[10px] font-bold leading-tight focus:outline-none focus-visible:ring-2 sm:w-20 sm:text-xs ${popped.has(i) ? "al-pop" : ""}`}
                      style={{
                        borderColor: VC[port.vlan],
                        background: VT[port.vlan],
                        opacity: dim ? 0.3 : 1,
                        boxShadow: selected ? "0 0 0 3px var(--c-red)" : "none",
                        transition: "background .4s, border-color .4s, opacity .3s, box-shadow .15s",
                        animationDelay: popped.has(i) ? `${(Array.from(popped).indexOf(i)) * 40}ms` : undefined,
                      }}
                    >
                      <span>{sName(i)}</span>
                      <span style={{ color: VC[port.vlan] }}>VLAN {port.vlan}</span>
                      {selected && (
                        <span
                          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                          style={{ background: "var(--c-red)", color: "var(--surface)" }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* apply */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{sel.size} port{sel.size === 1 ? "" : "s"} selected. Put them in:</span>
          {VLANS.map((v) => (
            <button
              key={v.id}
              onClick={() => applyVlan(v.id)}
              disabled={sel.size === 0}
              className="rounded-full border-2 px-3 py-1 text-xs font-bold disabled:opacity-40"
              style={{ borderColor: VC[v.id], background: VT[v.id], color: VC[v.id] }}
            >
              VLAN {v.id}
            </button>
          ))}
        </div>
        {echo && (
          <pre
            className="al-line mt-2 overflow-x-auto rounded-lg p-3 text-xs sm:text-sm"
            style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
          >
            {echo}
          </pre>
        )}
      </div>

      {/* ---------- verification ---------- */}
      <h2 className={h2}>Verify</h2>
      <div className="mt-2 flex flex-wrap gap-2" role="tablist">
        {VTABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={vtab === id}
            onClick={() => setVtab(id)}
            className="rounded-lg border-2 px-3 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 sm:text-sm"
            style={{
              ...btn(vtab === id),
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              color: vtab === id ? "var(--c-blue)" : "var(--ink)",
            }}
          >
            {label}
          </button>
        ))}
        {vtab === "run" && (
          <select
            value={runPort}
            onChange={(e) => setRunPort(+e.target.value)}
            aria-label="Port to show"
            className="rounded-lg border px-2 py-1.5 text-sm"
            style={{ borderColor: "var(--line-strong)", background: "var(--surface)", color: "var(--ink)" }}
          >
            {Array.from({ length: TOTAL }, (_, i) => (
              <option key={i} value={i}>{sName(i)}</option>
            ))}
          </select>
        )}
      </div>
      <div
        key={`${vtab}-${runPort}`}
        className="mt-2 max-h-80 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed sm:text-xs"
        style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
      >
        <div style={{ color: "#7fe6d0" }}>
          Switch# {vtab === "run" ? `sh run int ${sName(runPort).replace("Fa", "f")}` : VTABS.find((t) => t[0] === vtab)![1]}
        </div>
        {lines.map((l, i) => (
          <div
            key={i}
            className="al-line"
            style={{
              whiteSpace: "pre",
              animationDelay: `${Math.min(i, 24) * 22}ms`,
              background: l.hi ? "rgba(122,162,255,.16)" : undefined,
              color: l.hi ? "#ffffff" : undefined,
            }}
          >
            {l.text || " "}
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--faint)" }}>
        Outputs update from the ports you configured above. Highlighted rows are ports you changed.
      </p>
    </div>
  );
}