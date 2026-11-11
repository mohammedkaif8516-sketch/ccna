import { useMemo, useState } from "react";

/**
 * Cisco 3-tier network architecture (CCNA)
 * Self-contained. Uses Tailwind core utility classes + inline styles.
 * Usage: <ThreeTierArchitecture />
 */

type Layer = "isp" | "edge" | "core" | "dist" | "access" | "end";
type LayerTab = "edge" | "core" | "dist" | "access";
type FlowId = "vlan" | "internet";

interface NodeDef {
  id: string;
  label: string;
  sub?: string;
  layer: Layer;
  x: number;
  y: number;
}

const COLORS: Record<Layer, string> = {
  isp: "var(--c-gray)",
  edge: "var(--c-purple)",
  core: "var(--c-blue)",
  dist: "var(--c-teal)",
  access: "var(--c-orange)",
  end: "var(--c-orange)",
};

// text colour that sits on top of each layer's solid colour
const ON: Record<Layer, string> = {
  isp: "var(--on-gray)",
  edge: "var(--on-purple)",
  core: "var(--on-blue)",
  dist: "var(--on-teal)",
  access: "var(--on-orange)",
  end: "var(--on-orange)",
};

const TINTS: Record<LayerTab, string> = {
  edge: "var(--t-purple)",
  core: "var(--t-blue)",
  dist: "var(--t-teal)",
  access: "var(--t-orange)",
};

const NODES: NodeDef[] = [
  { id: "isp1", label: "ISP 1", layer: "isp", x: 320, y: 40 },
  { id: "isp2", label: "ISP 2", layer: "isp", x: 440, y: 40 },
  { id: "edge1", label: "Edge R1", layer: "edge", x: 320, y: 110 },
  { id: "edge2", label: "Edge R2", layer: "edge", x: 440, y: 110 },
  { id: "core1", label: "Core 1", layer: "core", x: 320, y: 200 },
  { id: "core2", label: "Core 2", layer: "core", x: 440, y: 200 },
  { id: "dist1", label: "Dist 1", sub: "MLS", layer: "dist", x: 320, y: 300 },
  { id: "dist2", label: "Dist 2", sub: "MLS", layer: "dist", x: 440, y: 300 },
  { id: "acc1", label: "Access 1", layer: "access", x: 190, y: 400 },
  { id: "acc2", label: "Access 2", layer: "access", x: 320, y: 400 },
  { id: "acc3", label: "Access 3", layer: "access", x: 440, y: 400 },
  { id: "acc4", label: "Access 4", layer: "access", x: 570, y: 400 },
  { id: "pc1", label: "PCs", sub: "VLAN 10", layer: "end", x: 190, y: 480 },
  { id: "srv", label: "Servers", sub: "VLAN 20", layer: "end", x: 320, y: 480 },
  { id: "pc3", label: "PCs", sub: "VLAN 10", layer: "end", x: 440, y: 480 },
  { id: "pc4", label: "PCs", sub: "VLAN 30", layer: "end", x: 570, y: 480 },
];

// [from, to, bundle?]  (bundle = commonly an EtherChannel uplink)
const EDGES: [string, string, boolean?][] = [
  ["isp1", "edge1"],
  ["isp2", "edge2"],
  ["edge1", "core1"],
  ["edge1", "core2"],
  ["edge2", "core1"],
  ["edge2", "core2"],
  ["core1", "core2"],
  ["core1", "dist1", true],
  ["core1", "dist2", true],
  ["core2", "dist1", true],
  ["core2", "dist2", true],
  ["dist1", "dist2"],
  ["dist1", "acc1", true],
  ["dist1", "acc2", true],
  ["dist1", "acc3", true],
  ["dist1", "acc4", true],
  ["dist2", "acc1", true],
  ["dist2", "acc2", true],
  ["dist2", "acc3", true],
  ["dist2", "acc4", true],
  ["acc1", "pc1"],
  ["acc2", "srv"],
  ["acc3", "pc3"],
  ["acc4", "pc4"],
];

const BANDS: { tab: LayerTab; label: string; y: number; h: number }[] = [
  { tab: "edge", label: "Edge", y: 8, h: 140 },
  { tab: "core", label: "Core", y: 168, h: 64 },
  { tab: "dist", label: "Distribution", y: 266, h: 68 },
  { tab: "access", label: "Access", y: 362, h: 162 },
];

const LAYER_INFO: Record<
  LayerTab,
  {
    name: string;
    role: string;
    points: string[];
    devices: string;
    remember: string;
  }
> = {
  edge: {
    name: "Edge routers",
    role: "Connect your network to the outside world (the ISPs).",
    points: [
      "Sit between the core and the ISPs.",
      "Usually two edge routers, each with its own ISP link, so losing one ISP does not cut you off.",
    ],
    devices: "Routers",
    remember:
      "Edge routers are not a fourth tier. They are just how the core reaches the ISPs.",
  },
  core: {
    name: "Core layer",
    role: "The high-speed backbone. Its only job is to move traffic fast.",
    points: [
      "Connects the distribution layers to each other.",
      "Connects the edge routers (and so the ISPs) to the rest of the network.",
      "Kept simple and quick: no heavy policy work here.",
    ],
    devices: "High-end, high-speed Layer 3 switches",
    remember: "Core = speed and availability.",
  },
  dist: {
    name: "Distribution layer",
    role: "The middle layer. It applies policy and ties many access switches together.",
    points: [
      "Policy enforcement (for example, deciding what traffic is allowed).",
      "Inter-VLAN routing: SVIs on multilayer switches (MLS) route between VLANs.",
      "Aggregation: collects the uplinks from many access switches into one place.",
    ],
    devices: "Multilayer switches (Layer 2 + Layer 3)",
    remember: "Distribution = policy + inter-VLAN routing + aggregation.",
  },
  access: {
    name: "Access layer",
    role: "Where end devices plug in.",
    points: [
      "Connects servers, PCs and other end devices.",
      "Layer 2 switching with VLAN access ports.",
      "Each access switch uplinks to the distribution layer.",
    ],
    devices: "Layer 2 switches",
    remember: "Access = end devices, L2 switching, VLAN access ports.",
  },
};

const GLOSSARY: [string, string][] = [
  [
    "VLAN",
    "A virtual LAN: a way to split one physical switch into separate Layer 2 networks. Devices in different VLANs cannot talk directly; they need a router.",
  ],
  [
    "SVI",
    "Switch Virtual Interface: a virtual Layer 3 interface on a switch, one per VLAN. It acts as that VLAN's default gateway.",
  ],
  [
    "MLS",
    "Multilayer switch: a switch that can also route (Layer 3). It is what lets a switch do inter-VLAN routing with SVIs.",
  ],
  [
    "EtherChannel",
    "Bundles several physical links into one logical link. You get more bandwidth, and the bundle keeps working if one member link fails.",
  ],
  [
    "Single point of failure",
    "One device or link whose failure takes something down. Doubling up devices and links at every layer removes it.",
  ],
];

// --- path finding (breadth-first search, skipping any failed device) ---
function findPath(
  from: string,
  targets: string[],
  failed: string | null,
): string[] | null {
  const adj: Record<string, string[]> = {};
  EDGES.forEach(([a, b]) => {
    (adj[a] ||= []).push(b);
    (adj[b] ||= []).push(a);
  });
  const seen = new Set<string>([from]);
  const queue: string[][] = [[from]];
  while (queue.length) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (targets.includes(last)) return path;
    for (const n of adj[last] || []) {
      if (n === failed || seen.has(n)) continue;
      seen.add(n);
      queue.push([...path, n]);
    }
  }
  return null;
}

const key = (a: string, b: string) => [a, b].sort().join("|");
const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

function hopNote(
  id: string,
  flow: FlowId,
  index: number,
  last: boolean,
): string {
  const n = nodeById(id);
  if (n.layer === "end")
    return index === 0 ? "Sends the traffic." : "Receives the traffic.";
  if (n.layer === "access") return "Layer 2 switching inside the VLAN.";
  if (n.layer === "dist")
    return flow === "vlan"
      ? "The SVIs on this multilayer switch route VLAN 10 to VLAN 20. Traffic turns around here and never reaches the core."
      : "Applies policy and routes the traffic up toward the core.";
  if (n.layer === "core") return "Passes the traffic along at high speed.";
  if (n.layer === "edge") return "Hands the traffic to the ISP.";
  return last ? "Out to the internet." : "";
}

export function ThreeTierArchitecture() {
  const [tab, setTab] = useState<LayerTab>("core");
  const [flow, setFlow] = useState<FlowId>("vlan");
  const [failed, setFailed] = useState<string | null>(null);
  const [showBundles, setShowBundles] = useState(false);

  const path = useMemo(() => {
    if (flow === "vlan") return findPath("pc1", ["srv"], failed);
    return findPath("pc1", ["isp1", "isp2"], failed);
  }, [flow, failed]);

  const pathEdges = useMemo(() => {
    const s = new Set<string>();
    if (path)
      for (let i = 0; i < path.length - 1; i++)
        s.add(key(path[i], path[i + 1]));
    return s;
  }, [path]);
  const pathNodes = new Set(path || []);

  const layerOf = (l: Layer): LayerTab =>
    l === "isp" ? "edge" : l === "end" ? "access" : l;
  const info = LAYER_INFO[tab];
  const color = COLORS[tab];

  const FAIL_OPTIONS: { id: string | null; label: string }[] = [
    { id: null, label: "Nothing" },
    { id: "dist1", label: "Dist 1" },
    { id: "core1", label: "Core 1" },
    { id: "edge1", label: "Edge R1" },
  ];

  return (
    <div
      className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 sm:p-6 md:p-8 shadow-sm"
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        borderColor: "var(--line)",
        background: "var(--surface)",
      }}
    >
      {/* ... Keep your two <style> blocks exactly the same here ... */}
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
      <style>{`
        @keyframes tt-flow { to { stroke-dashoffset: -24; } }
        .tt-flow { stroke-dasharray: 8 4; animation: tt-flow 0.9s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .tt-flow { animation: none; } }
      `}</style>

      <h1 className="text-2xl font-bold sm:text-3xl">
        Cisco 3-tier network architecture
      </h1>
      <p
        className="mt-2 text-base leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        Big campus networks are split into three layers so each layer has one
        clear job: <b>Core</b>, <b>Distribution</b> and <b>Access</b>. Edge
        routers connect the core to the ISPs. Traffic climbs from the bottom up:
        Access, then Distribution, then Core.
      </p>

      {/* Diagram */}
      <div
        className="mt-5 rounded-xl border p-2 sm:p-3 bg-background"
        style={{ borderColor: "var(--line)" }}
      >
        <svg
          viewBox="0 0 700 530"
          className="block h-auto w-full"
          role="img"
          aria-label="Three-tier network diagram"
        >
          {/* ... Keep the entire SVG content exactly the same ... */}
          {BANDS.map((b) => (
            <g
              key={b.tab}
              onClick={() => setTab(b.tab)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={4}
                y={b.y}
                width={692}
                height={b.h}
                rx={8}
                fill={TINTS[b.tab]}
                stroke={COLORS[b.tab]}
                strokeWidth={tab === b.tab ? 2.5 : 0.75}
                opacity={tab === b.tab ? 1 : 0.7}
              />
              <text
                x={14}
                y={b.y + 20}
                fontSize={13}
                fontWeight={700}
                fill={COLORS[b.tab]}
              >
                {b.label}
              </text>
            </g>
          ))}

          {EDGES.map(([a, b, bundle]) => {
            const A = nodeById(a);
            const B = nodeById(b);
            const on = pathEdges.has(key(a, b));
            const dead = a === failed || b === failed;
            const bundled = showBundles && bundle;
            const dx = B.x - A.x;
            const dy = B.y - A.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = (-dy / len) * 2.5;
            const ny = (dx / len) * 2.5;
            const stroke = dead
              ? "var(--dead-link)"
              : on
                ? "var(--c-red)"
                : "var(--link)";
            const w = on ? 3 : 1.5;
            const cls = on ? "tt-flow" : undefined;
            return bundled ? (
              <g key={key(a, b)} opacity={dead ? 0.5 : 1}>
                <line
                  x1={A.x + nx}
                  y1={A.y + ny}
                  x2={B.x + nx}
                  y2={B.y + ny}
                  stroke={stroke}
                  strokeWidth={w * 0.8}
                  className={cls}
                />
                <line
                  x1={A.x - nx}
                  y1={A.y - ny}
                  x2={B.x - nx}
                  y2={B.y - ny}
                  stroke={stroke}
                  strokeWidth={w * 0.8}
                  className={cls}
                />
              </g>
            ) : (
              <line
                key={key(a, b)}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke={stroke}
                strokeWidth={w}
                strokeDasharray={dead ? "3 4" : undefined}
                className={cls}
              />
            );
          })}

          {NODES.map((n) => {
            const isEnd = n.layer === "end";
            const w = isEnd ? 104 : 92;
            const h = isEnd ? 34 : 34;
            const dead = n.id === failed;
            const on = pathNodes.has(n.id);
            const c = COLORS[n.layer];
            return (
              <g
                key={n.id}
                onClick={() => setTab(layerOf(n.layer))}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={n.x - w / 2}
                  y={n.y - h / 2}
                  width={w}
                  height={h}
                  rx={isEnd ? 17 : 6}
                  fill={dead ? "var(--err-bg)" : isEnd ? "var(--surface)" : c}
                  stroke={dead ? "var(--err)" : on ? "var(--c-red)" : c}
                  strokeWidth={on || dead ? 3 : 1.5}
                  strokeDasharray={dead ? "4 3" : undefined}
                />
                <text
                  x={n.x}
                  y={n.sub ? n.y - 2 : n.y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill={dead ? "var(--err)" : isEnd ? c : ON[n.layer]}
                >
                  {n.label}
                </text>
                {n.sub && (
                  <text
                    x={n.x}
                    y={n.y + 11}
                    textAnchor="middle"
                    fontSize={10}
                    fill={
                      dead ? "var(--err)" : isEnd ? "var(--muted)" : ON[n.layer]
                    }
                  >
                    {n.sub}
                  </text>
                )}
                {dead && (
                  <text
                    x={n.x + w / 2 - 6}
                    y={n.y - h / 2 + 4}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={700}
                    fill="var(--err)"
                  >
                    ×
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <p className="px-2 pb-1 text-xs" style={{ color: "var(--faint)" }}>
          Click any layer or device to read about it. Red moving line = the path
          the traffic takes.
        </p>
      </div>

      {/* Layer tabs + detail */}
      <div
        role="tablist"
        className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {(["core", "dist", "access", "edge"] as LayerTab[]).map((t) => {
          const on = t === tab;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t)}
              className="rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: on ? COLORS[t] : "var(--line)",
                background: on ? TINTS[t] : "var(--surface)",
                color: on ? COLORS[t] : "var(--ink)",
              }}
            >
              {LAYER_INFO[t].name}
            </button>
          );
        })}
      </div>

      <div
        className="mt-3 rounded-xl border-2 p-4"
        style={{ borderColor: color, background: TINTS[tab] }}
      >
        <h2 className="text-lg font-bold" style={{ color }}>
          {info.name}
        </h2>
        <p className="mt-1 text-base font-medium">{info.role}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          {info.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <b>Typical devices:</b> {info.devices}
        </p>
        <p className="mt-1 text-sm">
          <b>Remember:</b> {info.remember}
        </p>
      </div>

      {/* Traffic follow */}
      <h2 className="mt-8 text-lg font-semibold">Follow the traffic</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Choose where a PC (VLAN 10) is sending data, then try breaking a device
        to see redundancy at work.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(
          [
            ["vlan", "PC to a server in another VLAN"],
            ["internet", "PC to the internet"],
          ] as [FlowId, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFlow(id)}
            aria-pressed={flow === id}
            className="rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              borderColor: flow === id ? "var(--c-red)" : "var(--line)",
              background: flow === id ? "var(--t-red)" : "var(--surface)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">Break a device:</span>
        {FAIL_OPTIONS.map((o) => (
          <button
            key={o.label}
            onClick={() => setFailed(o.id)}
            aria-pressed={failed === o.id}
            className="rounded-full border px-3 py-1 focus:outline-none focus-visible:ring-2"
            style={{
              borderColor:
                failed === o.id ? "var(--err)" : "var(--line-strong)",
              background: failed === o.id ? "var(--err-bg)" : "var(--surface)",
              fontWeight: failed === o.id ? 700 : 400,
            }}
          >
            {o.label}
          </button>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showBundles}
            onChange={(e) => setShowBundles(e.target.checked)}
          />
          Show EtherChannel uplinks
        </label>
      </div>

      <div
        className="mt-3 rounded-xl border p-4"
        style={{ borderColor: "var(--line)" }}
      >
        {path ? (
          <>
            <ol className="space-y-2">
              {path.map((id, i) => {
                const n = nodeById(id);
                return (
                  <li key={id} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: COLORS[n.layer],
                        color: ON[n.layer],
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <b>
                        {n.label}
                        {n.sub && n.layer !== "end"
                          ? ` (${n.sub})`
                          : n.sub
                            ? ` (${n.sub})`
                            : ""}
                        .
                      </b>{" "}
                      {hopNote(id, flow, i, i === path.length - 1)}
                    </span>
                  </li>
                );
              })}
            </ol>
            {failed && (
              <p
                className="mt-3 rounded-md p-2 text-sm"
                style={{
                  background: "var(--err-bg)",
                  color: "var(--err-text)",
                }}
              >
                {nodeById(failed).label} is down, but the traffic found another
                way through the duplicate device in the same layer. That is why
                every layer has redundant devices and links.
              </p>
            )}
            {flow === "vlan" && !failed && (
              <p
                className="mt-3 rounded-md p-2 text-sm"
                style={{ background: "var(--t-teal)", color: "var(--ok-text)" }}
              >
                Notice the core was never used. Inter-VLAN routing happens at
                the distribution layer.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm">No path available.</p>
        )}
      </div>

      {/* How it fits together */}
      <h2 className="mt-8 text-lg font-semibold">How it fits together</h2>
      {/* FIX: Added items-stretch and h-full for equal heights */}
      <div className="mt-2 grid items-stretch gap-3 sm:grid-cols-2">
        {[
          [
            "Traffic direction",
            "Access to Distribution to Core. Edge routers join the core to the ISPs.",
          ],
          [
            "Inter-VLAN routing",
            "SVIs on multilayer switches (MLS), typically at the distribution layer.",
          ],
          [
            "EtherChannel",
            "Commonly used for uplinks between access and distribution, and between distribution and core.",
          ],
          [
            "Redundancy",
            "Redundant links and devices at each layer, so no single point of failure.",
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

      {/* Glossary */}
      <h2 className="mt-8 text-lg font-semibold">Terms to know</h2>
      <dl
        className="mt-2 divide-y rounded-xl border"
        style={{ borderColor: "var(--line)" }}
      >
        {GLOSSARY.map(([t, d]) => (
          <div
            key={t}
            className="p-3 text-sm leading-relaxed"
            style={{ borderColor: "var(--line)" }}
          >
            <dt className="font-semibold">{t}</dt>
            <dd style={{ color: "var(--muted)" }}>{d}</dd>
          </div>
        ))}
      </dl>

      {/* Exam recap */}
      <div
        className="mt-6 rounded-xl border p-4 text-sm leading-relaxed"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        <h3 className="font-semibold">Remember it for the exam</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <b>Core</b>: fast backbone. <b>Distribution</b>: policy, inter-VLAN
            routing, aggregation. <b>Access</b>: end devices.
          </li>
          <li>
            Inter-VLAN routing with SVIs on an MLS lives at the{" "}
            <b>distribution</b> layer.
          </li>
          <li>
            EtherChannel bundles links: access to distribution, and distribution
            to core.
          </li>
          <li>
            Every layer has duplicate devices and links to avoid a single point
            of failure.
          </li>
        </ul>
      </div>
    </div>
  );
}
