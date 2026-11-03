"use client";

/**
 * MLS Ring Lab — physical works as logical.
 *
 * PHYSICAL: four multilayer switches in a square. Between neighbours there is exactly ONE cable, and that one cable is
 * a trunk configured directly on the physical port (no EtherChannel, no channel-group, no bundling anywhere).
 * LOGICAL:  two "diagonal" links that do not exist as cables:
 *             MLS1 (SW1) ↔ MLS4 (SW4)  runs EIGRP   over VLAN 14  (10.14.0.0/24)
 *             MLS3 (SW3) ↔ MLS2 (SW2)  runs OSPF    over VLAN 23  (10.23.0.0/24)
 * Each VLAN is carried over the square by pruning the trunks (switchport trunk allowed vlan …), so it follows one path:
 *             VLAN 14: SW1 → SW2 → SW4   (SW2 only passes the VLAN along at Layer 2)
 *             VLAN 23: SW3 → SW1 → SW2   (SW1 only passes the VLAN along at Layer 2)
 *
 * Every device starts in its factory state. Click a device in the PHYSICAL diagram → console.
 * The LOGICAL diagram is a plain SVG picture: it cannot be clicked.
 * Needs NetLab / Cable / Note from netsim.tsx, plus the Switch component.
 */
import { NetLab, Cable, Note } from "./netsim";
import Switch from "./Switch";
import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = { padding: "6px 10px", textAlign: "left", verticalAlign: "top" };

/* ───────────────────────── answer key data ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "switch"; lines: Line[] };
const L = (cmd: string, note?: string): Line => ({ cmd, note });

// [port, what it connects to, allowed VLANs on this trunk]
type Trunk = [string, string, string];
type Sw = {
  trunks: Trunk[];
  svi?: { vlan: number; ip: string };
  lo: string;
  proto: "eigrp" | "ospf";
  routed: boolean; // has an SVI and runs the protocol
  transit?: number; // VLAN that only passes through this switch
};

const SWITCHES: Record<string, Sw> = {
  SW1: {
    trunks: [
      ["e0/0", "SW2 e0/0 (top link)", "14,23"],
      ["e0/3", "SW3 e0/2 (left link)", "23"],
    ],
    svi: { vlan: 14, ip: "10.14.0.1" },
    lo: "1.1.1.1",
    proto: "eigrp",
    routed: true,
    transit: 23,
  },
  SW2: {
    trunks: [
      ["e0/0", "SW1 e0/0 (top link)", "14,23"],
      ["e0/3", "SW4 e0/2 (right link)", "14"],
    ],
    svi: { vlan: 23, ip: "10.23.0.2" },
    lo: "2.2.2.2",
    proto: "ospf",
    routed: true,
    transit: 14,
  },
  SW3: {
    trunks: [
      ["e0/2", "SW1 e0/3 (left link)", "23"],
      ["e0/1", "SW4 e0/1 (bottom link)", "none"],
    ],
    svi: { vlan: 23, ip: "10.23.0.3" },
    lo: "3.3.3.3",
    proto: "ospf",
    routed: true,
  },
  SW4: {
    trunks: [
      ["e0/2", "SW2 e0/3 (right link)", "14"],
      ["e0/1", "SW3 e0/1 (bottom link)", "none"],
    ],
    svi: { vlan: 14, ip: "10.14.0.4" },
    lo: "4.4.4.4",
    proto: "eigrp",
    routed: true,
  },
};

const ANSWER_KEY: KeyDevice[] = Object.entries(SWITCHES).map(([id, s]) => {
  const n = id.slice(2);
  const lines: Line[] = [];
  lines.push(L("ip routing", "this multilayer switch also routes"));
  lines.push(L("vlan 14"));
  lines.push(L(" name EIGRP-LINK"));
  lines.push(L("vlan 23"));
  lines.push(L(" name OSPF-LINK"));
  for (const [port, peer, allowed] of s.trunks) {
    lines.push(L(`interface ${port}`, `trunk to ${peer}`));
    lines.push(L(" switchport trunk encapsulation dot1q", "must come first on this switch image"));
    lines.push(L(" switchport mode trunk", "the single cable is the trunk"));
    lines.push(L(` switchport trunk allowed vlan ${allowed}`, allowed === "none" ? "idle link, kept as a spare path" : undefined));
    lines.push(L(" no shutdown"));
  }
  if (s.svi) {
    lines.push(L(`interface vlan ${s.svi.vlan}`, `Layer 3 side of the logical link`));
    lines.push(L(` ip address ${s.svi.ip} 255.255.255.0`));
    lines.push(L(" no shutdown"));
  }
  lines.push(L("interface loopback0", "test destination"));
  lines.push(L(` ip address ${s.lo} 255.255.255.255`));
  if (s.proto === "eigrp") {
    lines.push(L("router eigrp 100"));
    lines.push(L(" network 10.14.0.0 0.0.0.255"));
    lines.push(L(` network ${s.lo} 0.0.0.0`));
    lines.push(L(" no auto-summary"));
  } else {
    lines.push(L("router ospf 1"));
    lines.push(L(` router-id ${s.lo}`));
    lines.push(L(" network 10.23.0.0 0.0.0.255 area 0"));
    lines.push(L(` network ${s.lo} 0.0.0.0 area 0`));
  }
  void n;
  return { id, kind: "switch", lines };
});

const VLAN_TABLE = [
  { vlan: "14 · EIGRP-LINK", logical: "SW1 (MLS 1) ↔ SW4 (MLS 4)", path: "SW1 → top link → SW2 → right link → SW4", transit: "SW2 (Layer 2 only)", subnet: "10.14.0.0/24 · SW1 .1 · SW4 .4", proto: "EIGRP 100" },
  { vlan: "23 · OSPF-LINK", logical: "SW3 (MLS 3) ↔ SW2 (MLS 2)", path: "SW3 → left link → SW1 → top link → SW2", transit: "SW1 (Layer 2 only)", subnet: "10.23.0.0/24 · SW3 .3 · SW2 .2", proto: "OSPF 1 · area 0" },
];

const TRUNK_TABLE = [
  { link: "Top", ports: "SW1 e0/0 ↔ SW2 e0/0", allowed: "14, 23" },
  { link: "Left", ports: "SW1 e0/3 ↔ SW3 e0/2", allowed: "23" },
  { link: "Right", ports: "SW2 e0/3 ↔ SW4 e0/2", allowed: "14" },
  { link: "Bottom", ports: "SW3 e0/1 ↔ SW4 e0/1", allowed: "none (spare)" },
];

const fullName = (p: string) => "Ethernet" + p.slice(1);

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(new CustomEvent("netlab:run", { detail: { device, commands, config } }));
}

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const color =
    first === "interface" || first === "vlan" || first === "router"
      ? "#c084fc"
      : first === "switchport" || first === "no" || first === "name" || first === "ip" || first === "encapsulation" || first === "router-id" || first === "network" || first === "channel-group"
        ? "#38bdf8"
        : "inherit";
  return (
    <span style={{ whiteSpace: "pre" }}>
      {" ".repeat(indent)}
      <span style={{ color, fontWeight: 600 }}>{first}</span> {rest.join(" ")}
    </span>
  );
}

function KeyLine({ device, index }: { device: KeyDevice; index: number }) {
  const [state, setState] = useState<"idle" | "ran" | "copied">("idle");
  const { lines } = device;
  const { cmd, note } = lines[index];

  // Indented line → include its parent ("interface …" / "vlan …") so it works from any mode.
  let cmds = [cmd.trim()];
  if (cmd.startsWith(" "))
    for (let i = index - 1; i >= 0; i--)
      if (!lines[i].cmd.startsWith(" ")) {
        cmds = [lines[i].cmd.trim(), cmd.trim()];
        break;
      }

  const flash = (s: "ran" | "copied") => {
    setState(s);
    setTimeout(() => setState("idle"), 1200);
  };

  return (
    <div
      onClick={() => {
        runOnDevice(device.id, cmds, true);
        flash("ran");
      }}
      title="Click to run on this device"
      className="group flex items-center rounded-md px-2 py-[3px] cursor-pointer transition-colors hover:bg-sky-500/10"
      style={{ background: state === "ran" ? "rgba(34,197,94,.18)" : undefined }}
    >
      <Colored cmd={cmd} />
      {note && (
        <span
          style={{
            marginLeft: 12,
            font: "11px/1.3 ui-sans-serif,system-ui,sans-serif",
            opacity: 0.55,
            whiteSpace: "normal",
          }}
        >
          {note}
        </span>
      )}
      <span className="ml-auto flex items-center gap-2 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title="Copy only"
          className="text-muted-foreground hover:text-foreground"
          onClick={async (e) => {
            e.stopPropagation();
            await navigator.clipboard.writeText(cmd.trim());
            flash("copied");
          }}
        >
          {state === "copied" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
        </button>
        {state === "ran" ? <Check className="size-3.5 text-green-500" /> : <Play className="size-3.5 text-sky-500" />}
      </span>
    </div>
  );
}

function DeviceCard({ device }: { device: KeyDevice }) {
  return (
    <div style={{ border: "1px solid rgba(128,128,128,.25)", borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: "6px 10px",
          background: "rgba(128,128,128,.12)",
          font: "600 12px ui-sans-serif,system-ui",
        }}
      >
        {device.id}
        <button
          onClick={() =>
            runOnDevice(
              device.id,
              device.lines.map((l) => l.cmd.trim()),
              true,
            )
          }
          className="ml-auto inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-[11px] text-white hover:bg-sky-500"
        >
          <Zap className="size-3" /> Run all
        </button>
      </div>
      <div style={{ padding: 6, font: MONO, overflowX: "auto" }}>
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── logical diagram (picture only) ───────────────────────── */

// Plain SVG on purpose: it is NOT a NetLab, so nothing in it can be clicked or opens a console.
const LN: Record<string, { x: number; y: number; lo: string }> = {
  SW1: { x: 150, y: 90, lo: "Lo0 1.1.1.1" },
  SW2: { x: 650, y: 90, lo: "Lo0 2.2.2.2" },
  SW3: { x: 150, y: 330, lo: "Lo0 3.3.3.3" },
  SW4: { x: 650, y: 330, lo: "Lo0 4.4.4.4" },
};

function LogicalDiagram() {
  return (
    <svg
      role="img"
      aria-label="Logical topology: EIGRP between SW1 and SW4, OSPF between SW3 and SW2 (picture only)"
      viewBox="0 0 800 420"
      style={{ width: "100%", minWidth: 560, height: "auto", pointerEvents: "none", userSelect: "none", display: "block" }}
    >
      {/* EIGRP: SW1 ↔ SW4 */}
      <line x1={150} y1={90} x2={650} y2={330} stroke="#38bdf8" strokeWidth={3} />
      <text x={300} y={146} fontSize={14} fontWeight={700} fill="#38bdf8" textAnchor="middle" transform="rotate(25.6 300 146)">
        EIGRP 100 · VLAN 14 · 10.14.0.0/24
      </text>
      {/* OSPF: SW3 ↔ SW2 */}
      <line x1={150} y1={330} x2={650} y2={90} stroke="#f87171" strokeWidth={3} />
      <text x={300} y={290} fontSize={14} fontWeight={700} fill="#f87171" textAnchor="middle" transform="rotate(-25.6 300 290)">
        OSPF 1 · VLAN 23 · 10.23.0.0/24
      </text>
      {/* host tags */}
      <text x={205} y={118} fontSize={13} fontWeight={700} fill="#22d3ee">.1</text>
      <text x={575} y={310} fontSize={13} fontWeight={700} fill="#22d3ee">.4</text>
      <text x={205} y={318} fontSize={13} fontWeight={700} fill="#22d3ee">.3</text>
      <text x={578} y={118} fontSize={13} fontWeight={700} fill="#22d3ee">.2</text>
      {Object.entries(LN).map(([id, p]) => (
        <g key={id}>
          <rect x={p.x - 38} y={p.y - 18} width={76} height={36} rx={6} fill="rgba(128,128,128,.35)" stroke="currentColor" strokeWidth={1.2} />
          <text x={p.x} y={p.y + 5} fontSize={14} fontWeight={700} textAnchor="middle" fill="currentColor">{id}</text>
          <text x={p.x} y={p.y + (p.y < 200 ? -28 : 40)} fontSize={11} textAnchor="middle" fill="currentColor" opacity={0.75}>
            MLS {id.slice(2)} · {p.lo}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ───────────────────────── the lab ───────────────────────── */

export function MlsRingLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 1000, gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: "600 13px ui-sans-serif,system-ui", margin: "0 0 6px" }}>
          Physical (what you build and configure: click a device)
        </div>
        <div style={{ overflowX: "auto" }}>
          <NetLab title="MLS Ring (physical)" width={1000} height={700}>
            <Note x={500} y={340} size={16}>one trunk cable per side</Note>

            <Cable a="SW1:e0/0" b="SW2:e0/0" />
            <Cable a="SW1:e0/3" b="SW3:e0/2" />
            <Cable a="SW2:e0/3" b="SW4:e0/2" />
            <Cable a="SW3:e0/1" b="SW4:e0/1" />

            <Note x={500} y={80}>trunk · VLAN 14,23</Note>
            <Note x={270} y={340}>trunk · VLAN 23</Note>
            <Note x={870} y={340}>trunk · VLAN 14</Note>
            <Note x={500} y={600}>trunk · none (spare)</Note>

            <Switch id="SW1" x={200} y={140} ports={["Ethernet0/0", "Ethernet0/3"]} />
            <Switch id="SW2" x={800} y={140} ports={["Ethernet0/0", "Ethernet0/3"]} />
            <Switch id="SW3" x={200} y={540} ports={["Ethernet0/1", "Ethernet0/2"]} />
            <Switch id="SW4" x={800} y={540} ports={["Ethernet0/1", "Ethernet0/2"]} />
          </NetLab>
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ font: "600 13px ui-sans-serif,system-ui", margin: "0 0 6px" }}>
          Logical (what the network must behave like: picture only, not clickable)
        </div>
        <div style={{ overflowX: "auto", border: "1px solid rgba(128,128,128,.25)", borderRadius: 10, padding: 8 }}>
          <LogicalDiagram />
        </div>
      </div>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Study the two diagrams. Physically the four switches form a square with <strong>one cable per side</strong>.
            Logically there are two links across the square: <strong>EIGRP between SW1 and SW4</strong> and{" "}
            <strong>OSPF between SW3 and SW2</strong>. Those links exist only as VLANs.
          </li>
          <li>
            On all four switches enable routing with <code>ip routing</code> and create VLAN <code>14</code> (EIGRP-LINK) and
            VLAN <code>23</code> (OSPF-LINK).
          </li>
          <li>
            Turn <strong>each single cable into a trunk directly on its physical port</strong> (
            <code>switchport trunk encapsulation dot1q</code>, <code>switchport mode trunk</code>). There is no bundling: no{" "}
            <code>channel-group</code> and no port-channel anywhere.
          </li>
          <li>
            Prune every trunk with <code>switchport trunk allowed vlan …</code> so that VLAN 14 follows SW1 → SW2 → SW4 and
            VLAN 23 follows SW3 → SW1 → SW2, and the bottom link carries neither (<code>allowed vlan none</code>). This keeps
            each VLAN free of loops.
          </li>
          <li>
            Create the Layer 3 interfaces: <code>interface vlan 14</code> on SW1 (10.14.0.1) and SW4 (10.14.0.4), and{" "}
            <code>interface vlan 23</code> on SW3 (10.23.0.3) and SW2 (10.23.0.2), all /24 and with{" "}
            <code>no shutdown</code>. SW2 and SW1 get no address in the VLAN they only pass along.
          </li>
          <li>Create <code>Loopback0</code> on every switch (<code>N.N.N.N/32</code>).</li>
          <li>
            Ping across each logical link: <code>SW1 → 10.14.0.4</code> and <code>SW3 → 10.23.0.2</code>.
          </li>
          <li>
            Run <strong>EIGRP 100</strong> on SW1 and SW4 (VLAN 14 network and loopback, <code>no auto-summary</code>) and{" "}
            <strong>OSPF 1 area 0</strong> on SW3 and SW2 (VLAN 23 network and loopback, router ID = loopback).
          </li>
          <li>
            Verify with <code>show ip eigrp neighbors</code> on SW1, <code>show ip ospf neighbor</code> on SW3,{" "}
            <code>show interfaces trunk</code> everywhere and <code>show ip route</code>. SW1 reaches 4.4.4.4 and SW3 reaches
            2.2.2.2, but SW1 does <strong>not</strong> reach 2.2.2.2 (the two routing domains are separate).
          </li>
          <li>
            Break something on purpose: <code>shutdown</code> the top link on SW1 and watch both neighbours drop. Then re-route
            by editing the allowed lists with <code>switchport trunk allowed vlan add …</code>: VLAN 14 over SW1 → SW3 → SW4 and
            VLAN 23 over SW3 → SW4 → SW2 (this uses the spare bottom link). Remove the added VLANs again before you bring the top
            link back, otherwise the square becomes a loop.
          </li>
          <li>
            Save with <code>copy running-config startup-config</code> and test <code>reload</code>.
          </li>
        </ol>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What the network should look like</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            A trunk can carry several VLANs over one cable, so each side of the square is a single trunk and no port bundling
            is needed. A VLAN is a virtual cable: VLAN 14 joins SW1 and SW4 even though they are not cabled to each other,
            because SW2 in the middle simply forwards the VLAN at Layer 2. The SVI is the multilayer switch's IP address inside a
            VLAN, so SW1 and SW4 see each other as neighbours on 10.14.0.0/24 and form the EIGRP adjacency, while SW3 and SW2 do
            the same for OSPF on 10.23.0.0/24. The top link is shared: it is one cable carrying both VLANs, each with its own
            tag.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 560 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>VLAN</th>
                  <th style={CELL}>Logical link</th>
                  <th style={CELL}>Path over the square</th>
                  <th style={CELL}>Subnet</th>
                  <th style={CELL}>Protocol</th>
                </tr>
              </thead>
              <tbody>
                {VLAN_TABLE.map((v) => (
                  <tr key={v.vlan} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{v.vlan}</td>
                    <td style={CELL}>{v.logical}</td>
                    <td style={CELL}>{v.path} (transit: {v.transit})</td>
                    <td style={{ ...CELL, font: MONO }}>{v.subnet}</td>
                    <td style={CELL}>{v.proto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Physical link</th>
                  <th style={CELL}>Ports (all trunks)</th>
                  <th style={CELL}>Allowed VLANs</th>
                </tr>
              </thead>
              <tbody>
                {TRUNK_TABLE.map((t) => (
                  <tr key={t.link} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{t.link}</td>
                    <td style={{ ...CELL, font: MONO }}>{t.ports}</td>
                    <td style={CELL}>{t.allowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: <code>show interfaces trunk</code> lists only the physical ports (no Po interfaces) with the allowed
            lists above. <code>show ip eigrp neighbors</code> on SW1 shows 10.14.0.4, and <code>show ip ospf neighbor</code> on
            SW3 shows 2.2.2.2 in the FULL state.
          </p>
        </div>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Answer key (click a line to run it, or "Run all" per device)
        </summary>
        <div
          style={{
            marginTop: 8,
            maxHeight: 520,
            overflowY: "auto",
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
          }}
        >
          {ANSWER_KEY.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      </details>
    </div>
  );
}

export default MlsRingLab;