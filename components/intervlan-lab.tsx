"use client";

/**
 * Inter-VLAN Lab — 3 switches, 12 VPCs, 1 router (R16), VLANs 10/20/30/40.
 *
 * No trunks anywhere: every switch port is an ACCESS port, and each VLAN has its own cable between neighbouring
 * switches. R16 is connected to SW1 with FOUR cables, one per VLAN, so each R16 interface is the default gateway of
 * one VLAN (192.168.X.254). The router routes between the connected subnets, so hosts in DIFFERENT VLANs can now talk.
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable (with the offset prop) / Note from netsim.tsx, plus Router, Switch and VPC components.
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import VPC from "./VPC";
import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = { padding: "6px 10px", textAlign: "left", verticalAlign: "top" };

/* ───────────────────────── answer key data ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "switch" | "router" | "pc"; lines: Line[] };
const L = (cmd: string, note?: string): Line => ({ cmd, note });

const VLANS: [number, string][] = [
  [10, "HR"],
  [20, "IT"],
  [30, "Marketing"],
  [40, "Management"],
];

// [port, vlan, note] — every port is an access port (hosts, switch-to-switch links, router links)
type P = [string, number, string];
const PORTS: Record<string, P[]> = {
  SW1: [
    ["e0/3", 10, "VPC4"],
    ["e1/0", 20, "VPC5"],
    ["e0/0", 30, "VPC6"],
    ["e0/2", 40, "VPC7"],
    ["e1/3", 10, "link to SW2"],
    ["e1/2", 20, "link to SW2"],
    ["e1/1", 30, "link to SW2"],
    ["e0/1", 40, "link to SW2"],
    ["e2/0", 10, "link to R16 e0/0"],
    ["e2/1", 20, "link to R16 e0/1"],
    ["e2/2", 30, "link to R16 e0/2"],
    ["e2/3", 40, "link to R16 e0/3"],
  ],
  SW2: [
    ["e0/2", 10, "VPC8"],
    ["e0/3", 20, "VPC9"],
    ["e1/0", 30, "VPC10"],
    ["e1/1", 40, "VPC11"],
    ["e2/0", 10, "link to SW1"],
    ["e1/3", 20, "link to SW1"],
    ["e1/2", 30, "link to SW1"],
    ["e0/1", 40, "link to SW1"],
    ["e2/3", 10, "link to SW3"],
    ["e2/2", 20, "link to SW3"],
    ["e2/1", 30, "link to SW3"],
    ["e0/0", 40, "link to SW3"],
  ],
  SW3: [
    ["e0/1", 10, "VPC12"],
    ["e0/2", 20, "VPC14"],
    ["e0/3", 30, "VPC13"],
    ["e1/0", 40, "VPC15"],
    ["e1/3", 10, "link to SW2"],
    ["e1/2", 20, "link to SW2"],
    ["e1/1", 30, "link to SW2"],
    ["e0/0", 40, "link to SW2"],
  ],
};

// R16: one interface per VLAN, the .254 address is the default gateway of that VLAN
const R16: [string, number][] = [
  ["e0/0", 10],
  ["e0/1", 20],
  ["e0/2", 30],
  ["e0/3", 40],
];

const ANSWER_KEY: KeyDevice[] = [
  ...Object.entries(PORTS).map(([id, ports]): KeyDevice => {
    const lines: Line[] = [];
    for (const [v, name] of VLANS) {
      lines.push(L(`vlan ${v}`));
      lines.push(L(` name ${name}`));
    }
    for (const [port, vlan, note] of ports) {
      lines.push(L(`interface ${port}`, `${note} · VLAN ${vlan}`));
      lines.push(L(" switchport mode access"));
      lines.push(L(` switchport access vlan ${vlan}`));
      lines.push(L(" no shutdown"));
    }
    return { id, kind: "switch", lines };
  }),
  {
    id: "R16",
    kind: "router",
    lines: R16.flatMap(([port, vlan]) => [
      L(`interface ${port}`, `VLAN ${vlan} gateway`),
      L(` ip address 192.168.${vlan}.254 255.255.255.0`),
      L(" no shutdown"),
    ]),
  },
  ...[
    ["VPC4", 10, 1], ["VPC5", 20, 1], ["VPC6", 30, 1], ["VPC7", 40, 1],
    ["VPC8", 10, 2], ["VPC9", 20, 2], ["VPC10", 30, 2], ["VPC11", 40, 2],
    ["VPC12", 10, 3], ["VPC14", 20, 3], ["VPC13", 30, 3], ["VPC15", 40, 3],
  ].map(
    ([id, vlan, host]): KeyDevice => ({
      id: id as string,
      kind: "pc",
      lines: [L(`ip 192.168.${vlan}.${host}/24 192.168.${vlan}.254`)],
    }),
  ),
];

const MEMBERS = [
  { vlan: "10 · HR", subnet: "192.168.10.0/24", gw: "192.168.10.254 (R16 e0/0)", hosts: "VPC4 (.1) · VPC8 (.2) · VPC12 (.3)" },
  { vlan: "20 · IT", subnet: "192.168.20.0/24", gw: "192.168.20.254 (R16 e0/1)", hosts: "VPC5 (.1) · VPC9 (.2) · VPC14 (.3)" },
  { vlan: "30 · Marketing", subnet: "192.168.30.0/24", gw: "192.168.30.254 (R16 e0/2)", hosts: "VPC6 (.1) · VPC10 (.2) · VPC13 (.3)" },
  { vlan: "40 · Management", subnet: "192.168.40.0/24", gw: "192.168.40.254 (R16 e0/3)", hosts: "VPC7 (.1) · VPC11 (.2) · VPC15 (.3)" },
];

const SWITCH_PORTS: Record<string, string[]> = {
  SW1: ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3", "e2/0", "e2/1", "e2/2", "e2/3"],
  SW2: ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3", "e2/0", "e2/1", "e2/2", "e2/3"],
  SW3: ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3"],
};
const fullName = (p: string) => "Ethernet" + p.slice(1);

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(new CustomEvent("netlab:run", { detail: { device, commands, config } }));
}

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const color =
    first === "interface" || first === "vlan"
      ? "#c084fc"
      : first === "switchport" || first === "no" || first === "name" || first === "ip" || first === "channel-group"
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
        runOnDevice(device.id, cmds, device.kind !== "pc");
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
              device.kind !== "pc"
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
      <div style={{ padding: 6, display: open ? "block" : "none", font: MONO, overflowX: "auto" }}>
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── the lab ───────────────────────── */

export function InterVlanLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 1000, gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ overflowX: "auto" }}>
        <NetLab title="Inter-VLAN Lab" width={1000} height={1150}>
          <Note x={500} y={25} size={22}>InterVLAN1</Note>

          {/* ── R16 ↔ SW1: one access link per VLAN (each router port = gateway of one VLAN) ── */}
          <Cable a="R16:e0/0" b="SW1:e2/0" offset={-87} />
          <Cable a="R16:e0/1" b="SW1:e2/1" offset={-29} />
          <Cable a="R16:e0/2" b="SW1:e2/2" offset={29} />
          <Cable a="R16:e0/3" b="SW1:e2/3" offset={87} />

          {/* ── SW1 hosts ── */}
          <Cable a="SW1:e0/3" b="VPC4:eth0" bTag=".1" />
          <Cable a="SW1:e1/0" b="VPC5:eth0" bTag=".1" />
          <Cable a="SW1:e0/0" b="VPC6:eth0" bTag=".1" />
          <Cable a="SW1:e0/2" b="VPC7:eth0" bTag=".1" />

          {/* ── SW1 ↔ SW2: one access link per VLAN ── */}
          <Cable a="SW1:e1/3" b="SW2:e2/0" offset={-87} />
          <Cable a="SW1:e1/2" b="SW2:e1/3" offset={-29} />
          <Cable a="SW1:e1/1" b="SW2:e1/2" offset={29} />
          <Cable a="SW1:e0/1" b="SW2:e0/1" offset={87} />

          {/* ── SW2 hosts ── */}
          <Cable a="SW2:e0/2" b="VPC8:eth0" bTag=".2" />
          <Cable a="SW2:e0/3" b="VPC9:eth0" bTag=".2" />
          <Cable a="SW2:e1/0" b="VPC10:eth0" bTag=".2" />
          <Cable a="SW2:e1/1" b="VPC11:eth0" bTag=".2" />

          {/* ── SW2 ↔ SW3: one access link per VLAN ── */}
          <Cable a="SW2:e2/3" b="SW3:e1/3" offset={-87} />
          <Cable a="SW2:e2/2" b="SW3:e1/2" offset={-29} />
          <Cable a="SW2:e2/1" b="SW3:e1/1" offset={29} />
          <Cable a="SW2:e0/0" b="SW3:e0/0" offset={87} />

          {/* ── SW3 hosts ── */}
          <Cable a="SW3:e0/1" b="VPC12:eth0" bTag=".3" />
          <Cable a="SW3:e0/2" b="VPC14:eth0" bTag=".3" />
          <Cable a="SW3:e0/3" b="VPC13:eth0" bTag=".3" />
          <Cable a="SW3:e1/0" b="VPC15:eth0" bTag=".3" />

          {/* VLAN number beside each parallel cable (left → right = 10, 20, 30, 40) */}
          {[170, 425, 775].map((y) =>
            [420, 478, 536, 594].map((x, i) => (
              <Note key={`${y}-${x}`} x={x} y={y}>
                {String((i + 1) * 10)}
              </Note>
            )),
          )}
          <Note x={720} y={170}>R16 gateways · .254</Note>

          {/* VLAN / IP labels beside every VPC */}
          <Note x={110} y={170}>VLAN 10 · 192.168.10.1</Note>
          <Note x={110} y={310}>VLAN 20 · 192.168.20.1</Note>
          <Note x={890} y={170}>VLAN 30 · 192.168.30.1</Note>
          <Note x={890} y={310}>VLAN 40 · 192.168.40.1</Note>

          <Note x={110} y={520}>VLAN 10 · 192.168.10.2</Note>
          <Note x={110} y={660}>VLAN 20 · 192.168.20.2</Note>
          <Note x={890} y={520}>VLAN 30 · 192.168.30.2</Note>
          <Note x={890} y={660}>VLAN 40 · 192.168.40.2</Note>

          <Note x={110} y={870}>VLAN 10 · 192.168.10.3</Note>
          <Note x={110} y={1010}>VLAN 20 · 192.168.20.3</Note>
          <Note x={890} y={870}>VLAN 30 · 192.168.30.3</Note>
          <Note x={890} y={1010}>VLAN 40 · 192.168.40.3</Note>

          {/* router */}
          <Router id="R16" x={500} y={70} ports={["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"]} />

          {/* switches */}
          <Switch id="SW1" x={500} y={250} ports={SWITCH_PORTS.SW1.map(fullName)} />
          <Switch id="SW2" x={500} y={600} ports={SWITCH_PORTS.SW2.map(fullName)} />
          <Switch id="SW3" x={500} y={950} ports={SWITCH_PORTS.SW3.map(fullName)} />

          {/* VPCs: left = VLAN 10 / 20, right = VLAN 30 / 40 */}
          <VPC id="VPC4" x={150} y={210} />
          <VPC id="VPC5" x={150} y={350} />
          <VPC id="VPC6" x={850} y={210} />
          <VPC id="VPC7" x={850} y={350} />

          <VPC id="VPC8" x={150} y={560} />
          <VPC id="VPC9" x={150} y={700} />
          <VPC id="VPC10" x={850} y={560} />
          <VPC id="VPC11" x={850} y={700} />

          <VPC id="VPC12" x={150} y={910} />
          <VPC id="VPC14" x={150} y={1050} />
          <VPC id="VPC13" x={850} y={910} />
          <VPC id="VPC15" x={850} y={1050} />
        </NetLab>
      </div>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Create VLANs <code>10</code> (HR), <code>20</code> (IT), <code>30</code> (Marketing) and <code>40</code>{" "}
            (Management) on <strong>all three</strong> switches.
          </li>
          <li>
            Put every VPC-facing port in its VLAN with <code>switchport mode access</code> and{" "}
            <code>switchport access vlan X</code>.
          </li>
          <li>
            Configure the switch-to-switch links <strong>also as access ports</strong>, one VLAN per link (VLAN 10, 20, 30,
            40 from left to right). Do <strong>not</strong> use <code>switchport mode trunk</code> anywhere.
          </li>
          <li>
            Configure the four SW1 ports that go to R16 (<code>e2/0</code> to <code>e2/3</code>) as access ports in VLAN
            10, 20, 30 and 40 in the same order.
          </li>
          <li>
            On R16 give each interface the <strong>gateway address of its VLAN</strong>: <code>e0/0</code> =
            192.168.10.254, <code>e0/1</code> = 192.168.20.254, <code>e0/2</code> = 192.168.30.254, <code>e0/3</code> =
            192.168.40.254 (all /24) and bring them up with <code>no shutdown</code>.
          </li>
          <li>
            Give each VPC its IP and the <strong>default gateway of its VLAN</strong>:{" "}
            <code>ip 192.168.10.1/24 192.168.10.254</code> and so on.
          </li>
          <li>
            On R16 verify with <code>show ip interface brief</code> and <code>show ip route</code>: four connected (
            <code>C</code>) networks, one per VLAN.
          </li>
          <li>
            Test <strong>same-VLAN</strong> pings (<code>VPC4 → VPC8</code>) and then <strong>different-VLAN</strong> pings
            (<code>VPC4 → VPC5</code>, <code>VPC4 → VPC15</code>). All should now work. Run <code>trace</code> from a VPC
            and read the first hop.
          </li>
          <li>
            Break something on purpose: <code>shutdown</code> R16 <code>e0/1</code> and see that VLAN 20 can still reach
            its own hosts but no longer reaches the other VLANs. Then restore it.
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
            VLANs are separate broadcast domains and subnets, so a host can only reach another VLAN through a router. R16
            has one interface in each VLAN, which makes it the default gateway of all four subnets. A packet from VPC4 to
            VPC5 goes to its gateway 192.168.10.254, R16 sends it out the VLAN 20 interface, and the answer comes back the
            same way. Because the ports are all access ports, each VLAN needs its own cable between the switches and its own
            cable to the router. That uses many ports, which is exactly the problem that a trunk with sub-interfaces
            (router on a stick) solves later.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>VLAN</th>
                  <th style={CELL}>Subnet</th>
                  <th style={CELL}>Gateway</th>
                  <th style={CELL}>Hosts</th>
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map((m) => (
                  <tr key={m.vlan} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{m.vlan}</td>
                    <td style={{ ...CELL, font: MONO }}>{m.subnet}</td>
                    <td style={{ ...CELL, font: MONO }}>{m.gw}</td>
                    <td style={CELL}>{m.hosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: <code>show ip route</code> on R16 lists the four networks as <code>C</code> (connected) and the four{" "}
            <code>L</code> addresses. Every VPC can ping every other VPC. <code>trace 192.168.20.2</code> from VPC4 shows
            192.168.10.254 as hop 1 and the target as hop 2.
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
            alignItems: "start",
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

export default InterVlanLab;