import { useState } from "react";

/**
 * VLAN concepts, ranges & advantages (Interactive Supplement)
 * Stripped down to just the interactive diagram and quick-reference facts.
 */
const THEME_CSS = `
  .sw {
    --ink:#1b2330; --muted:#445063; --faint:#5f6b7d;
    --line:#dde2ea; --line-strong:#b9c1cd; --panel:#f8f9fb; --surface:#ffffff; --head:#f1f3f7;
    --dot-off:#d6dbe3; --link:#8b95a5;
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
    :root:not(.light):not([data-theme="light"]) .sw {
      --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
      --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
      --dot-off:#3a4455; --link:#6b7686;
      --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
      --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
      --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
      --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
      --c-gray:#9aa6b8; --on-gray:#0f1620;
      --c-red:#fb7185; --t-red:#3a1a22;
      --err:#ff8a8a; --err-bg:#3a1b1e; --err-text:#ffc1c1;
      --ok-text:#7fe6d0;
    }
  }
  :root.dark .sw, .dark .sw, [data-theme="dark"] .sw {
    --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
    --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
    --dot-off:#3a4455; --link:#6b7686;
    --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
    --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
    --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
    --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
    --c-gray:#9aa6b8; --on-gray:#0f1620;
    --c-red:#fb7185; --t-red:#3a1a22;
    --err:#ff8a8a; --err-bg:#3a1b1e; --err-text:#ffc1c1;
    --ok-text:#7fe6d0;
  }
  @keyframes vl-flow { to { stroke-dashoffset: -24; } }
  .vl-flow { stroke-dasharray: 8 4; animation: vl-flow 0.9s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .vl-flow { animation: none; } }
`;

const VLAN_COLOR: Record<number, string> = {
  1: "var(--c-gray)", 10: "var(--c-blue)", 20: "var(--c-teal)", 50: "var(--c-orange)",
};
const VLAN_ON: Record<number, string> = {
  1: "var(--on-gray)", 10: "var(--on-blue)", 20: "var(--on-teal)", 50: "var(--on-orange)",
};
const VLAN_SUBNET: Record<number, string> = {
  1: "one shared network", 10: "192.168.10.0/24", 20: "192.168.20.0/24", 50: "192.168.50.0/24",
};

interface Pc { id: string; label: string; vlan: number; }
const PCS: Pc[] = [
  { id: "hr1", label: "HR 1", vlan: 10 },
  { id: "it1", label: "IT 1", vlan: 20 },
  { id: "sa1", label: "Sales 1", vlan: 50 },
  { id: "hr2", label: "HR 2", vlan: 10 },
  { id: "it2", label: "IT 2", vlan: 20 },
  { id: "sa2", label: "Sales 2", vlan: 50 },
];
const pcX = (i: number) => 80 + i * 100;
const SW = { x: 330, y: 100 };
const RT = { x: 580, y: 100 };

type Mode = "flat" | "vlan";

export  function VlanConcepts() {
  const [mode, setMode] = useState<Mode>("flat");
  const [sender, setSender] = useState("hr1");
  const [target, setTarget] = useState("bcast");
  const [l3, setL3] = useState(false);

  const vlanOf = (p: Pc) => (mode === "flat" ? 1 : p.vlan);
  const s = PCS.find((p) => p.id === sender)!;
  const effTarget = target === sender ? "bcast" : target;
  const t = effTarget === "bcast" ? null : PCS.find((p) => p.id === effTarget)!;

  let kind: "bcast" | "switched" | "routed" | "blocked";
  let receivers: string[] = [];
  let title = "";
  let body = "";

  if (!t) {
    kind = "bcast";
    receivers = PCS.filter((p) => p.id !== s.id && vlanOf(p) === vlanOf(s)).map((p) => p.id);
    const n = receivers.length;
    title = `${s.label} sends a broadcast in VLAN ${vlanOf(s)}`;
    if (mode === "flat") {
      body = `Every port is in VLAN 1, which is one broadcast domain. All ${n} other PCs receive the broadcast, even the ones that never needed it.`;
    } else {
      const names = receivers.map((id) => PCS.find((p) => p.id === id)!.label).join(", ");
      body = `Only the ${n} other PC${n === 1 ? "" : "s"} in VLAN ${vlanOf(s)} (${names}) receive it. The other ${5 - n} never see it, which means less wasted traffic.`;
    }
    if (l3) body += " Adding a Layer 3 device does not change this: routers do not forward broadcasts.";
  } else if (vlanOf(s) === vlanOf(t)) {
    kind = "switched";
    title = `${s.label} to ${t.label}: same VLAN`;
    body = `Both are in VLAN ${vlanOf(s)}, so the switch forwards the frame using its MAC address table. This is Layer 2 switching, and no router is needed.`;
  } else if (l3) {
    kind = "routed";
    title = `${s.label} to ${t.label}: routed between VLANs`;
    body = `VLAN ${vlanOf(s)} (${VLAN_SUBNET[vlanOf(s)]}) and VLAN ${vlanOf(t)} (${VLAN_SUBNET[vlanOf(t)]}) are different networks. The frame goes up to the Layer 3 device, which routes it into the other VLAN and back down through the switch. This is inter-VLAN routing.`;
  } else {
    kind = "blocked";
    title = `${s.label} to ${t.label}: no path`;
    body = `They are in different VLANs, so they are on different networks, and there is no Layer 3 device to connect them. The traffic goes nowhere. Turn on “Add a Layer 3 device” to fix it.`;
  }

  const litPcs = new Set<string>([s.id, ...(t ? [t.id] : []), ...receivers]);
  const routerLit = kind === "routed";
  const resultColor = kind === "blocked" ? "var(--err)" : kind === "routed" ? "var(--c-purple)" : "var(--c-teal)";
  const resultBg = kind === "blocked" ? "var(--err-bg)" : kind === "routed" ? "var(--t-purple)" : "var(--t-teal)";

  const btn = (on: boolean, c = "var(--c-blue)", tint = "var(--t-blue)") => ({
    borderColor: on ? c : "var(--line)",
    background: on ? tint : "var(--surface)",
  });

  return (
    <div
      className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", color: "var(--ink)", borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <style>{THEME_CSS}</style>

      <h2 className="text-xl font-bold">Interactive: Broadcasts and Inter-VLAN Routing</h2>
      <p className="mt-1 text-sm mb-4" style={{ color: "var(--muted)" }}>
        Use the controls below the diagram to see how a switch handles broadcasts, same-VLAN traffic, and inter-VLAN traffic.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {([
          ["flat", "No VLANs", "Every port in VLAN 1"],
          ["vlan", "VLANs configured", "HR 10, IT 20, Sales 50"],
        ] as [Mode, string, string][]).map(([id, name, sub]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className="rounded-lg border-2 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={btn(mode === id)}
          >
            <div className="text-sm font-semibold" style={{ color: mode === id ? "var(--c-blue)" : "var(--ink)" }}>{name}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>{sub}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border p-2 sm:p-3" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <svg viewBox="0 0 660 300" className="block h-auto w-full" role="img" aria-label="Six PCs connected to one switch">
          {PCS.map((p, i) => {
            const lit = litPcs.has(p.id);
            const isRecv = receivers.includes(p.id) || (t && p.id === t.id && kind !== "blocked");
            const stroke = kind === "blocked" && t && p.id === t.id ? "var(--err)" : lit ? "var(--c-red)" : "var(--link)";
            return (
              <line
                key={p.id} x1={SW.x} y1={SW.y + 20} x2={pcX(i)} y2={215}
                stroke={stroke} strokeWidth={lit ? 3 : 1.5}
                strokeDasharray={kind === "blocked" && t && p.id === t.id ? "3 4" : undefined}
                className={lit && (isRecv || p.id === s.id) && kind !== "blocked" ? "vl-flow" : undefined}
              />
            );
          })}
          {l3 && (
            <line
              x1={SW.x + 65} y1={SW.y} x2={RT.x - 55} y2={RT.y}
              stroke={routerLit ? "var(--c-red)" : "var(--link)"}
              strokeWidth={routerLit ? 3 : 1.5} className={routerLit ? "vl-flow" : undefined}
            />
          )}

          <rect x={SW.x - 65} y={SW.y - 20} width={130} height={40} rx={7} fill="var(--c-blue)" />
          <text x={SW.x} y={SW.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--on-blue)">Switch</text>

          {l3 && (
            <g>
              <rect x={RT.x - 55} y={RT.y - 20} width={110} height={40} rx={7} fill="var(--c-purple)" />
              <text x={RT.x} y={RT.y - 2} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--on-purple)">Layer 3 device</text>
              <text x={RT.x} y={RT.y + 12} textAnchor="middle" fontSize={10} fill="var(--on-purple)">router / MLS</text>
            </g>
          )}

          {PCS.map((p, i) => {
            const v = vlanOf(p);
            const isSender = p.id === s.id;
            const isRecv = receivers.includes(p.id) || (t !== null && p.id === t.id && kind !== "blocked");
            const isBlockedTarget = kind === "blocked" && t !== null && p.id === t.id;
            const dim = !litPcs.has(p.id);
            const x = pcX(i);
            return (
              <g key={p.id} onClick={() => setSender(p.id)} style={{ cursor: "pointer" }} opacity={dim ? 0.5 : 1}>
                <rect
                  x={x - 40} y={215} width={80} height={44} rx={8} fill="var(--surface)"
                  stroke={isBlockedTarget ? "var(--err)" : isSender || isRecv ? "var(--c-red)" : VLAN_COLOR[v]}
                  strokeWidth={isSender || isRecv || isBlockedTarget ? 3.5 : 2}
                  strokeDasharray={isBlockedTarget ? "4 3" : undefined}
                />
                <text x={x} y={234} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)">{p.label}</text>
                <rect x={x - 28} y={241} width={56} height={14} rx={7} fill={VLAN_COLOR[v]} />
                <text x={x} y={251.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={VLAN_ON[v]}>VLAN {v}</text>
                {isSender && <text x={x} y={279} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--c-red)">sender</text>}
                {isRecv && !isSender && <text x={x} y={279} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--c-red)">receives</text>}
                {isBlockedTarget && <text x={x} y={279} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--err)">blocked</text>}
              </g>
            );
          })}
        </svg>
        <p className="px-2 pb-1 text-xs" style={{ color: "var(--faint)" }}>
          Click a PC to make it the sender. Red moving line = traffic. Faded PCs are not involved.
        </p>
      </div>

      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <div className="mb-1 font-semibold">Sender</div>
          <div className="flex flex-wrap gap-2">
            {PCS.map((p) => (
              <button
                key={p.id} onClick={() => setSender(p.id)} aria-pressed={sender === p.id}
                className="rounded-full border px-3 py-1 focus:outline-none focus-visible:ring-2"
                style={{ ...btn(sender === p.id, "var(--c-red)", "var(--t-red)"), fontWeight: sender === p.id ? 700 : 400 }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="vl-target" className="mb-1 block font-semibold">It sends</label>
          <select
            id="vl-target" value={effTarget} onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus-visible:ring-2"
            style={{ borderColor: "var(--line-strong)", background: "var(--surface)", color: "var(--ink)" }}
          >
            <option value="bcast">A broadcast (to everyone it can reach)</option>
            {PCS.filter((p) => p.id !== sender).map((p) => (
              <option key={p.id} value={p.id}>To {p.label}</option>
            ))}
          </select>
          <label className="mt-3 flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={l3} onChange={(e) => setL3(e.target.checked)} />
            Add a Layer 3 device (router or MLS)
          </label>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-2 p-4" style={{ borderColor: resultColor, background: resultBg }} aria-live="polite">
        <div className="font-semibold" style={{ color: resultColor }}>{title}</div>
        <p className="mt-1 text-sm leading-relaxed">{body}</p>
      </div>

      {/* Exam recap - kept minimal since it's the only text left */}
      <div className="mt-8 rounded-xl border p-4 text-sm leading-relaxed" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
        <h3 className="font-semibold">Quick Reference</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><b>Default VLAN:</b> VLAN 1 (cannot be deleted).</li>
          <li><b>Ranges:</b> Old (normal) 1–1005. New (extended) 1–4094.</li>
          <li><b>Same VLAN:</b> Layer 2 switching. <b>Different VLANs:</b> Requires a Layer 3 device.</li>
          <li><b>Best practice:</b> Park unused ports in a dedicated VLAN (e.g., VLAN 999).</li>
        </ul>
      </div>
    </div>
  );
}