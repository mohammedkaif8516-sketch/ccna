
"use client";

/**
 * MLS Ring Lab — All VLANs Allowed on All Trunks.
 *
 * PHYSICAL:
 * Four multilayer switches connected in a square.
 * Exactly ONE physical cable per side.
 * Every physical cable is configured as a trunk.
 * ALL VLANs are allowed on ALL trunks.
 * No EtherChannel, no channel-group, no port-channel.
 *
 * LOGICAL:
 * MLS1 (SW1) ↔ MLS4 (SW4): EIGRP over VLAN 14 (10.14.0.0/24)
 * MLS3 (SW3) ↔ MLS2 (SW2): OSPF over VLAN 23 (10.23.0.0/24)
 *
 * VLAN 14 and VLAN 23 are carried across all four trunks.
 * STP prevents Layer 2 loops by selecting forwarding/blocking ports.
 *
 * Needs NetLab / Cable / Note from netsim.tsx, plus Switch.
 */

import { NetLab, Cable, Note } from "@/components/simulator/netsim";
import Switch from "@/components/simulator/Switch";import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";

const CELL: React.CSSProperties = {
  padding: "6px 10px",
  textAlign: "left",
  verticalAlign: "top",
};

/* ───────────────────────── answer key data ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "switch"; lines: Line[] };

const L = (cmd: string, note?: string): Line => ({ cmd, note });

type Trunk = [string, string, string];

type Sw = {
  trunks: Trunk[];
  svi?: { vlan: number; ip: string };
  lo: string;
  proto: "eigrp" | "ospf";
  routed: boolean;
  transit?: number;
};

const SWITCHES: Record<string, Sw> = {
  SW1: {
    trunks: [
      ["e0/0", "SW2 e0/0 (top link)", "all"],
      ["e0/3", "SW3 e0/2 (left link)", "all"],
    ],
    svi: { vlan: 14, ip: "10.14.0.1" },
    lo: "1.1.1.1",
    proto: "eigrp",
    routed: true,
    transit: 23,
  },

  SW2: {
    trunks: [
      ["e0/0", "SW1 e0/0 (top link)", "all"],
      ["e0/3", "SW4 e0/2 (right link)", "all"],
    ],
    svi: { vlan: 23, ip: "10.23.0.2" },
    lo: "2.2.2.2",
    proto: "ospf",
    routed: true,
    transit: 14,
  },

  SW3: {
    trunks: [
      ["e0/2", "SW1 e0/3 (left link)", "all"],
      ["e0/1", "SW4 e0/1 (bottom link)", "all"],
    ],
    svi: { vlan: 23, ip: "10.23.0.3" },
    lo: "3.3.3.3",
    proto: "ospf",
    routed: true,
  },

  SW4: {
    trunks: [
      ["e0/2", "SW2 e0/3 (right link)", "all"],
      ["e0/1", "SW3 e0/1 (bottom link)", "all"],
    ],
    svi: { vlan: 14, ip: "10.14.0.4" },
    lo: "4.4.4.4",
    proto: "eigrp",
    routed: true,
  },
};

const ANSWER_KEY: KeyDevice[] = Object.entries(SWITCHES).map(
  ([id, s]) => {
    const lines: Line[] = [];

    lines.push(
      L("ip routing", "Enable Layer 3 routing on the multilayer switch")
    );

    lines.push(L("vlan 14"));
    lines.push(L(" name EIGRP-LINK"));

    lines.push(L("vlan 23"));
    lines.push(L(" name OSPF-LINK"));

    // Configure every physical trunk.
    for (const [port, peer] of s.trunks) {
      lines.push(L(`interface ${port}`, `Trunk to ${peer}`));

      lines.push(
        L(
          " switchport trunk encapsulation dot1q",
          "Configure 802.1Q encapsulation first if supported/required"
        )
      );

      lines.push(
        L(" switchport mode trunk", "Make the physical interface a trunk")
      );

      lines.push(
        L(
          " switchport trunk allowed vlan all",
          "Allow every VLAN on this trunk"
        )
      );

      lines.push(L(" no shutdown"));
    }

    // Configure the Layer 3 SVI.
    if (s.svi) {
      lines.push(
        L(
          `interface vlan ${s.svi.vlan}`,
          "Layer 3 interface for the logical connection"
        )
      );

      lines.push(
        L(` ip address ${s.svi.ip} 255.255.255.0`)
      );

      lines.push(L(" no shutdown"));
    }

    // Loopback.
    lines.push(
      L("interface loopback0", "Test destination / Router ID")
    );

    lines.push(
      L(` ip address ${s.lo} 255.255.255.255`)
    );

    // EIGRP configuration.
    if (s.proto === "eigrp") {
      lines.push(L("router eigrp 100"));
      lines.push(L(" network 10.14.0.0 0.0.0.255"));
      lines.push(L(` network ${s.lo} 0.0.0.0`));
      lines.push(L(" no auto-summary"));
    }

    // OSPF configuration.
    else {
      lines.push(L("router ospf 1"));
      lines.push(L(` router-id ${s.lo}`));
      lines.push(L(" network 10.23.0.0 0.0.0.255 area 0"));
      lines.push(L(` network ${s.lo} 0.0.0.0 area 0`));
    }

    return { id, kind: "switch", lines };
  }
);

/* ───────────────────────── VLAN table ───────────────────────── */

const VLAN_TABLE = [
  {
    vlan: "14 · EIGRP-LINK",
    logical: "SW1 (MLS 1) ↔ SW4 (MLS 4)",
    path: "All trunks permit VLAN 14; STP selects the forwarding path",
    transit: "SW2 and/or SW3 at Layer 2, depending on STP",
    subnet: "10.14.0.0/24 · SW1 .1 · SW4 .4",
    proto: "EIGRP 100",
  },
  {
    vlan: "23 · OSPF-LINK",
    logical: "SW3 (MLS 3) ↔ SW2 (MLS 2)",
    path: "All trunks permit VLAN 23; STP selects the forwarding path",
    transit: "SW1 and/or SW4 at Layer 2, depending on STP",
    subnet: "10.23.0.0/24 · SW3 .3 · SW2 .2",
    proto: "OSPF 1 · area 0",
  },
];

/* ───────────────────────── trunk table ───────────────────────── */

const TRUNK_TABLE = [
  {
    link: "Top",
    ports: "SW1 e0/0 ↔ SW2 e0/0",
    allowed: "ALL VLANs",
  },
  {
    link: "Left",
    ports: "SW1 e0/3 ↔ SW3 e0/2",
    allowed: "ALL VLANs",
  },
  {
    link: "Right",
    ports: "SW2 e0/3 ↔ SW4 e0/2",
    allowed: "ALL VLANs",
  },
  {
    link: "Bottom",
    ports: "SW3 e0/1 ↔ SW4 e0/1",
    allowed: "ALL VLANs",
  },
];

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(
  device: string,
  commands: string[],
  config = false
) {
  window.dispatchEvent(
    new CustomEvent("netlab:run", {
      detail: { device, commands, config },
    })
  );
}

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");

  const color =
    first === "interface" ||
    first === "vlan" ||
    first === "router"
      ? "#c084fc"
      : first === "switchport" ||
          first === "no" ||
          first === "name" ||
          first === "ip" ||
          first === "encapsulation" ||
          first === "router-id" ||
          first === "network" ||
          first === "channel-group"
        ? "#38bdf8"
        : "inherit";

  return (
    <span style={{ whiteSpace: "pre-wrap", flexShrink: 1, minWidth: 0 }}>
      {" ".repeat(indent)}
      <span style={{ color, fontWeight: 600 }}>
        {first}
      </span>{" "}
      {rest.join(" ")}
    </span>
  );
}

function KeyLine({
  device,
  index,
}: {
  device: KeyDevice;
  index: number;
}) {
  const [state, setState] = useState<
    "idle" | "ran" | "copied"
  >("idle");

  const { lines } = device;
  const { cmd, note } = lines[index];

  // Include parent configuration mode for indented commands.
  let cmds = [cmd.trim()];

  if (cmd.startsWith(" ")) {
    for (let i = index - 1; i >= 0; i--) {
      if (!lines[i].cmd.startsWith(" ")) {
        cmds = [
          lines[i].cmd.trim(),
          cmd.trim(),
        ];
        break;
      }
    }
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
      style={{
        background:
          state === "ran"
            ? "rgba(34,197,94,.18)"
            : undefined,
      }}
    >
      <Colored cmd={cmd} />

      {note && (
        <span
          style={{
            marginLeft: 12,
            font: "11px/1.3 ui-sans-serif,system-ui,sans-serif",
            opacity: 0.55,
            whiteSpace: "normal",
            minWidth: 0,
            flex: "1 1 0%",
          }}
        >
          {note}
        </span>
      )}

      <span className="ml-auto flex shrink-0 items-center gap-2 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title="Copy only"
          className="text-muted-foreground hover:text-foreground"
          onClick={async (e) => {
            e.stopPropagation();
            await navigator.clipboard.writeText(cmd.trim());
            flash("copied");
          }}
        >
          {state === "copied" ? (
            <Check className="size-3.5 text-green-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>

        {state === "ran" ? (
          <Check className="size-3.5 text-green-500" />
        ) : (
          <Play className="size-3.5 text-sky-500" />
        )}
      </span>
    </div>
  );
}

/* ───────────────────────── device cards ───────────────────────── */

function DeviceCard({ device }: { device: KeyDevice }) {
  const [ran, setRan] = useState(false);
  const [open, setOpen] = useState(false); // collapsed by default
  return (
    <div style={{ alignSelf: "start", border: "1px solid rgba(128,128,128,.25)", borderRadius: 10, overflow: "hidden" }}>
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
        <span
          onClick={() => setOpen((o) => !o)}
          style={{ flex: 1, cursor: "pointer", userSelect: "none" }}
        >
          {open ? "▾" : "▸"} {device.id}
        </span>

        
        <button
          type="button"
          onClick={() => {
            runOnDevice(
              device.id,
              device.lines.map((l) => l.cmd.trim()),
              true
            );
            setRan(true);
            setTimeout(() => setRan(false), 2500);
          }}
          className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-white transition-colors ${
            ran
              ? "bg-green-600 hover:bg-green-500"
              : "bg-sky-600 hover:bg-sky-500"
          }`}
        >
          {ran ? "Ran ✓" : "Run all"}
        </button>
      </div>

      <div
        style={{
          padding: 6,
          display: open ? "block" : "none",
          font: "12px/1.5 ui-monospace,Menlo,Consolas,monospace",
          width: "100%",
          overflowX: "auto",
        }}
      >
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── logical diagram ───────────────────────── */

// Picture only. This diagram cannot be clicked.

const LN: Record<
  string,
  { x: number; y: number; lo: string }
> = {
  SW1: { x: 150, y: 90, lo: "Lo0 1.1.1.1" },
  SW2: { x: 650, y: 90, lo: "Lo0 2.2.2.2" },
  SW3: { x: 150, y: 330, lo: "Lo0 3.3.3.3" },
  SW4: { x: 650, y: 330, lo: "Lo0 4.4.4.4" },
};

function LogicalDiagram() {
  return (
    <svg
      role="img"
      aria-label="Logical topology: EIGRP between SW1 and SW4, OSPF between SW3 and SW2"
      viewBox="0 0 800 420"
      style={{
        width: "100%",
        minWidth: 560,
        height: "auto",
        pointerEvents: "none",
        userSelect: "none",
        display: "block",
      }}
    >
      {/* EIGRP: SW1 ↔ SW4 */}
      <line
        x1={150}
        y1={90}
        x2={650}
        y2={330}
        stroke="#38bdf8"
        strokeWidth={3}
      />

      <text
        x={300}
        y={146}
        fontSize={14}
        fontWeight={700}
        fill="#38bdf8"
        textAnchor="middle"
        transform="rotate(25.6 300 146)"
      >
        EIGRP 100 · VLAN 14 · 10.14.0.0/24
      </text>

      {/* OSPF: SW3 ↔ SW2 */}
      <line
        x1={150}
        y1={330}
        x2={650}
        y2={90}
        stroke="#f87171"
        strokeWidth={3}
      />

      <text
        x={300}
        y={290}
        fontSize={14}
        fontWeight={700}
        fill="#f87171"
        textAnchor="middle"
        transform="rotate(-25.6 300 290)"
      >
        OSPF 1 · VLAN 23 · 10.23.0.0/24
      </text>

      {/* Endpoint IP labels */}
      <text
        x={205}
        y={118}
        fontSize={13}
        fontWeight={700}
        fill="#22d3ee"
      >
        .1
      </text>

      <text
        x={575}
        y={310}
        fontSize={13}
        fontWeight={700}
        fill="#22d3ee"
      >
        .4
      </text>

      <text
        x={205}
        y={318}
        fontSize={13}
        fontWeight={700}
        fill="#22d3ee"
      >
        .3
      </text>

      <text
        x={578}
        y={118}
        fontSize={13}
        fontWeight={700}
        fill="#22d3ee"
      >
        .2
      </text>

      {Object.entries(LN).map(([id, p]) => (
        <g key={id}>
          <rect
            x={p.x - 38}
            y={p.y - 18}
            width={76}
            height={36}
            rx={6}
            fill="rgba(128,128,128,.35)"
            stroke="currentColor"
            strokeWidth={1.2}
          />

          <text
            x={p.x}
            y={p.y + 5}
            fontSize={14}
            fontWeight={700}
            textAnchor="middle"
            fill="currentColor"
          >
            {id}
          </text>

          <text
            x={p.x}
            y={p.y + (p.y < 200 ? -28 : 40)}
            fontSize={11}
            textAnchor="middle"
            fill="currentColor"
            opacity={0.75}
          >
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
    <div
      style={{
        display: "grid",
        gap: 14,
        maxWidth: "100%",
        gridTemplateColumns: "minmax(0, 1fr)",
        alignItems: "start",
        width: "100%",
      }}
    >
      {/* PHYSICAL TOPOLOGY */}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            font: "600 13px ui-sans-serif,system-ui",
            margin: "0 0 6px",
          }}
        >
          Physical (what you build and configure: click a device)
        </div>

        <div style={{ overflowX: "clip" }}>
          <NetLab
            title="MLS Ring — All VLANs Allowed"
            width={1000}
            height={700}
          >
             
            <Cable a="SW1:e0/0" b="SW2:e0/0" />
            <Cable a="SW1:e0/3" b="SW3:e0/2" />
            <Cable a="SW2:e0/3" b="SW4:e0/2" />
            <Cable a="SW3:e0/1" b="SW4:e0/1" />

            <Note x={500} y={80}>
              Allowed · 14 23
            </Note>

            <Note x={270} y={340}>
              Allowed · 14 23
            </Note>

            <Note x={870} y={340}>
              Allowed · 14 23
            </Note>

            <Note x={500} y={600}>
              Allowed · 14 23
            </Note>

            <Switch
              id="SW1"
              x={200}
              y={140}
              ports={["Ethernet0/0", "Ethernet0/3"]}
            />

            <Switch
              id="SW2"
              x={800}
              y={140}
              ports={["Ethernet0/0", "Ethernet0/3"]}
            />

            <Switch
              id="SW3"
              x={200}
              y={540}
              ports={["Ethernet0/1", "Ethernet0/2"]}
            />

            <Switch
              id="SW4"
              x={800}
              y={540}
              ports={["Ethernet0/1", "Ethernet0/2"]}
            />
          </NetLab>
        </div>
      </div>

      {/* LOGICAL TOPOLOGY */}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            font: "600 13px ui-sans-serif,system-ui",
            margin: "0 0 6px",
          }}
        >
          Logical (what the network must behave like: picture only)
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid rgba(128,128,128,.25)",
            borderRadius: 10,
            padding: 8,
          }}
        >
          <LogicalDiagram />
        </div>
      </div>

      {/* OBJECTIVES */}

      <details
        style={{
          font: FONT,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Objectives
        </summary>

        <ol
          style={{
            margin: "8px 0 0 18px",
            padding: 0,
          }}
        >
          <li>
            Study both diagrams. Physically, the four switches form
            a square with <strong>one cable per side</strong>.
            Logically, there are two Layer 3 routing relationships:
            <strong> EIGRP between SW1 and SW4</strong> and
            <strong> OSPF between SW3 and SW2</strong>.
            These logical connections use VLANs carried over the
            physical trunks.
          </li>

          <li>
            On all four switches, enable routing with
            <code> ip routing</code> and create VLAN
            <code> 14</code> (EIGRP-LINK) and VLAN
            <code> 23</code> (OSPF-LINK).
          </li>

          <li>
            Turn each physical cable into a trunk directly on its
            physical port using
            <code> switchport mode trunk</code>.
            Configure 802.1Q encapsulation where the switch image
            requires it. There is no bundling:
            no <code>channel-group</code> and no
            <code>port-channel</code>.
          </li>

          <li>
            Allow <strong>ALL VLANs on ALL four trunks</strong>
            using <code>switchport trunk allowed vlan all</code>.
            Every trunk can now transport VLAN 14 and VLAN 23.
            STP prevents Layer 2 loops by selecting which ports
            forward and which ports block.
          </li>

          <li>
            Create the Layer 3 interfaces:
            <code> interface vlan 14</code> on SW1
            (10.14.0.1) and SW4 (10.14.0.4), and
            <code> interface vlan 23</code> on SW3
            (10.23.0.3) and SW2 (10.23.0.2).
            Configure all as /24 and use
            <code> no shutdown</code>.
            SW1 and SW4 have no IP address in VLAN 23;
            SW2 and SW3 have no IP address in VLAN 14.
          </li>

          <li>
            Create <code>Loopback0</code> on every switch
            using its N.N.N.N/32 address.
          </li>

          <li>
            Test the logical VLAN connections:
            <code> SW1 → 10.14.0.4</code> and
            <code> SW3 → 10.23.0.2</code>.
            Check STP state if connectivity does not work.
          </li>

          <li>
            Run <strong>EIGRP 100</strong> on SW1 and SW4
            (VLAN 14 network and loopback, with
            <code> no auto-summary</code>).
            Run <strong>OSPF 1, area 0</strong> on SW3 and SW2
            (VLAN 23 network and loopback, router ID equal
            to the loopback address).
          </li>

          <li>
            Verify using:
            <ul>
              <li><code>show interfaces trunk</code></li>
              <li><code>show spanning-tree vlan 14</code></li>
              <li><code>show spanning-tree vlan 23</code></li>
              <li><code>show ip eigrp neighbors</code> on SW1</li>
              <li><code>show ip ospf neighbor</code> on SW3</li>
              <li><code>show ip route</code></li>
            </ul>
            SW1 should reach 4.4.4.4 through EIGRP, and SW3
            should reach 2.2.2.2 through OSPF.
            SW1 does not automatically learn 2.2.2.2 because
            EIGRP and OSPF are separate routing domains.
          </li>

          <li>
            <strong>Failure and recovery experiment:</strong>
            Shut down the top link on SW1 using
            <code> interface e0/0</code> followed by
            <code> shutdown</code>.
            Observe STP reconvergence. The previously blocked
            alternate path may become forwarding, depending on
            the STP topology.
            Check EIGRP and OSPF neighbour status after
            convergence. Restore the link using
            <code> no shutdown</code> and observe STP
            reconvergence again.
          </li>

          <li>
            Save the configuration using
            <code> copy running-config startup-config</code>
            and test with <code>reload</code>.
          </li>
        </ol>
      </details>

      {/* EXPECTED NETWORK BEHAVIOUR */}

      <details
        style={{
          font: FONT,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          What the network should look like
        </summary>

        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            All four physical connections are individual trunk
            links. Each trunk allows every VLAN, so VLAN 14 and
            VLAN 23 can travel across the entire square.
            A VLAN behaves like a virtual Layer 2 network.
            STP prevents switching loops by blocking redundant
            Layer 2 paths when necessary.
          </p>

          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            VLAN 14 provides the Layer 2 connection between
            SW1 and SW4. Their SVI addresses are 10.14.0.1
            and 10.14.0.4, allowing EIGRP adjacency.
            VLAN 23 provides the Layer 2 connection between
            SW3 and SW2. Their SVI addresses are 10.23.0.3
            and 10.23.0.2, allowing OSPF adjacency.
          </p>

          <p style={{ margin: "0 0 12px", opacity: 0.75 }}>
            The actual forwarding path is determined by STP,
            not by manually pruning the VLANs. The top link
            can carry both VLAN 14 and VLAN 23 simultaneously.
          </p>

          {/* VLAN TABLE */}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                font: FONT,
                minWidth: 560,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(128,128,128,.12)",
                  }}
                >
                  <th style={CELL}>VLAN</th>
                  <th style={CELL}>Logical link</th>
                  <th style={CELL}>Forwarding path</th>
                  <th style={CELL}>Subnet</th>
                  <th style={CELL}>Protocol</th>
                </tr>
              </thead>

              <tbody>
                {VLAN_TABLE.map((v) => (
                  <tr
                    key={v.vlan}
                    style={{
                      borderTop: "1px solid rgba(128,128,128,.25)",
                    }}
                  >
                    <td
                      style={{
                        ...CELL,
                        fontWeight: 600,
                      }}
                    >
                      {v.vlan}
                    </td>

                    <td style={CELL}>{v.logical}</td>

                    <td style={CELL}>
                      {v.path}
                      <br />
                      <span style={{ opacity: 0.65 }}>
                        Transit: {v.transit}
                      </span>
                    </td>

                    <td style={{ ...CELL, font: MONO }}>
                      {v.subnet}
                    </td>

                    <td style={CELL}>{v.proto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TRUNK TABLE */}

          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table
              style={{
                borderCollapse: "collapse",
                font: FONT,
                minWidth: 420,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(128,128,128,.12)",
                  }}
                >
                  <th style={CELL}>Physical link</th>
                  <th style={CELL}>Ports (all trunks)</th>
                  <th style={CELL}>Allowed VLANs</th>
                </tr>
              </thead>

              <tbody>
                {TRUNK_TABLE.map((t) => (
                  <tr
                    key={t.link}
                    style={{
                      borderTop: "1px solid rgba(128,128,128,.25)",
                    }}
                  >
                    <td
                      style={{
                        ...CELL,
                        fontWeight: 600,
                      }}
                    >
                      {t.link}
                    </td>

                    <td style={{ ...CELL, font: MONO }}>
                      {t.ports}
                    </td>

                    <td style={CELL}>{t.allowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            <strong>Expected verification:</strong>
            <code> show interfaces trunk</code> should list
            the physical trunk ports and show all VLANs as
            allowed. Check
            <code> show spanning-tree vlan 14</code> and
            <code> show spanning-tree vlan 23</code> to identify
            forwarding and blocking ports.
            There should be no port-channel interfaces.
          </p>
        </div>
      </details>

      {/* ANSWER KEY */}

      <details
        style={{
          font: FONT,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
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
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
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
