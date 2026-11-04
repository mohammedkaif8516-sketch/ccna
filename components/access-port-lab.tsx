"use client";

/**
 * Access-Port Lab (Intra-VLAN only) — 3 switches, 12 VPCs, VLANs 10/20/30/40.
 *
 * NO trunks, NO router: every port (host-facing AND switch-to-switch) is an access port.
 * Because an access port carries a single VLAN, each VLAN gets its own physical link between
 * the switches (4 links SW1–SW2, 4 links SW2–SW3). Only hosts in the same VLAN can talk.
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable / Note from netsim.tsx, plus Switch and VPC components.
 */
import { NetLab, Cable, Note } from "./netsim";
import Switch from "./Switch";
import VPC from "./VPC";
import { useState } from "react";
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
type KeyDevice = { id: string; kind: "switch" | "pc"; lines: Line[] };
const L = (cmd: string, note?: string): Line => ({ cmd, note });

const v_lan: [number, string, string][] = [
  [10, "HR", "192.168.10.0/24"],
  [20, "IT", "192.168.20.0/24"],
  [30, "Marketing", "192.168.30.0/24"],
  [40, "Management", "192.168.40.0/24"],
];

// [port, vlan, note]
type P = [string, number, string];

const SWITCHES: Record<string, P[]> = {
  SW1: [
    ["e0/3", 10, "VPC4"],
    ["e1/0", 20, "VPC5"],
    ["e0/0", 30, "VPC6"],
    ["e0/2", 40, "VPC7"],
    ["e1/3", 10, "link to SW2"],
    ["e1/2", 20, "link to SW2"],
    ["e1/1", 30, "link to SW2"],
    ["e0/1", 40, "link to SW2"],
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

const SWITCH_PORTS: Record<string, string[]> = {
  SW1: ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3"],
  SW2: [
    "e0/0",
    "e0/1",
    "e0/2",
    "e0/3",
    "e1/0",
    "e1/1",
    "e1/2",
    "e1/3",
    "e2/0",
    "e2/1",
    "e2/2",
    "e2/3",
  ],
  SW3: ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3"],
};
const fullName = (p: string) => "Ethernet" + p.slice(1);

const ANSWER_KEY: KeyDevice[] = [
  ...Object.entries(SWITCHES).map(([id, ports]): KeyDevice => {
    const lines: Line[] = [];
    for (const [v, name] of v_lan) {
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
  { id: "VPC4", kind: "pc", lines: [L("ip 192.168.10.1/24")] },
  { id: "VPC5", kind: "pc", lines: [L("ip 192.168.20.1/24")] },
  { id: "VPC6", kind: "pc", lines: [L("ip 192.168.30.1/24")] },
  { id: "VPC7", kind: "pc", lines: [L("ip 192.168.40.1/24")] },
  { id: "VPC8", kind: "pc", lines: [L("ip 192.168.10.2/24")] },
  { id: "VPC9", kind: "pc", lines: [L("ip 192.168.20.2/24")] },
  { id: "VPC10", kind: "pc", lines: [L("ip 192.168.30.2/24")] },
  { id: "VPC11", kind: "pc", lines: [L("ip 192.168.40.2/24")] },
  { id: "VPC12", kind: "pc", lines: [L("ip 192.168.10.3/24")] },
  { id: "VPC14", kind: "pc", lines: [L("ip 192.168.20.3/24")] },
  { id: "VPC13", kind: "pc", lines: [L("ip 192.168.30.3/24")] },
  { id: "VPC15", kind: "pc", lines: [L("ip 192.168.40.3/24")] },
];

const MEMBERS = [
  {
    vlan: "10 · HR",
    subnet: "192.168.10.0/24",
    hosts: "VPC4 (.1) · VPC8 (.2) · VPC12 (.3)",
  },
  {
    vlan: "20 · IT",
    subnet: "192.168.20.0/24",
    hosts: "VPC5 (.1) · VPC9 (.2) · VPC14 (.3)",
  },
  {
    vlan: "30 · Marketing",
    subnet: "192.168.30.0/24",
    hosts: "VPC6 (.1) · VPC10 (.2) · VPC13 (.3)",
  },
  {
    vlan: "40 · Management",
    subnet: "192.168.40.0/24",
    hosts: "VPC7 (.1) · VPC11 (.2) · VPC15 (.3)",
  },
];

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(
    new CustomEvent("netlab:run", { detail: { device, commands, config } }),
  );
}

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const color =
    first === "interface" || first === "vlan"
      ? "#c084fc"
      : first === "switchport" ||
          first === "no" ||
          first === "name" ||
          first === "ip"
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
        runOnDevice(device.id, cmds, device.kind === "switch");
        flash("ran");
      }}
      title="Click to run on this device"
      className="group flex items-center rounded-md px-2 py-[3px] cursor-pointer transition-colors hover:bg-sky-500/10"
      style={{
        background: state === "ran" ? "rgba(34,197,94,.18)" : undefined,
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

function DeviceCard({ device }: { device: KeyDevice }) {
  const [ran, setRan] = useState(false);
  return (
    <div
      style={{
        border: "1px solid rgba(128,128,128,.25)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
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
          type="button"
          onClick={() => {
            runOnDevice(
              device.id,
              device.lines.map((l) => l.cmd.trim()),
              device.kind === "switch"
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
      <div style={{ padding: 6, font: MONO, overflowX: "auto" }}>
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── the lab ───────────────────────── */

export function AccessPortLabS() {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        maxWidth: 1000,
        gridTemplateColumns: "minmax(0, 1fr)",
        width: "100%",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <NetLab title="Access Port Lab (Intra-VLAN)" width={1000} height={1000}>
          <Note x={500} y={25} size={22}>
            Intra-VLAN · access ports only
          </Note>

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

          {/* link labels: VLAN carried by each inter-switch link (left → right) */}
          <Note x={420} y={285}>
            10
          </Note>
          <Note x={478} y={285}>
            20
          </Note>
          <Note x={536} y={285}>
            30
          </Note>
          <Note x={594} y={285}>
            40
          </Note>
          <Note x={420} y={635}>
            10
          </Note>
          <Note x={478} y={635}>
            20
          </Note>
          <Note x={536} y={635}>
            30
          </Note>
          <Note x={594} y={635}>
            40
          </Note>

          {/* VLAN / IP labels beside every VPC */}
          <Note x={110} y={30}>
            VLAN 10 · 192.168.10.1
          </Note>
          <Note x={110} y={170}>
            VLAN 20 · 192.168.20.1
          </Note>
          <Note x={890} y={30}>
            VLAN 30 · 192.168.30.1
          </Note>
          <Note x={890} y={170}>
            VLAN 40 · 192.168.40.1
          </Note>

          <Note x={110} y={380}>
            VLAN 10 · 192.168.10.2
          </Note>
          <Note x={110} y={520}>
            VLAN 20 · 192.168.20.2
          </Note>
          <Note x={890} y={380}>
            VLAN 30 · 192.168.30.2
          </Note>
          <Note x={890} y={520}>
            VLAN 40 · 192.168.40.2
          </Note>

          <Note x={110} y={730}>
            VLAN 10 · 192.168.10.3
          </Note>
          <Note x={110} y={870}>
            VLAN 20 · 192.168.20.3
          </Note>
          <Note x={890} y={730}>
            VLAN 30 · 192.168.30.3
          </Note>
          <Note x={890} y={870}>
            VLAN 40 · 192.168.40.3
          </Note>

          {/* switches */}
          <Switch
            id="SW1"
            x={500}
            y={110}
            ports={SWITCH_PORTS.SW1.map(fullName)}
          />
          <Switch
            id="SW2"
            x={500}
            y={460}
            ports={SWITCH_PORTS.SW2.map(fullName)}
          />
          <Switch
            id="SW3"
            x={500}
            y={810}
            ports={SWITCH_PORTS.SW3.map(fullName)}
          />

          {/* VPCs: left = VLAN 10 / 20, right = VLAN 30 / 40 */}
          <VPC id="VPC4" x={150} y={70} />
          <VPC id="VPC5" x={150} y={210} />
          <VPC id="VPC6" x={850} y={70} />
          <VPC id="VPC7" x={850} y={210} />

          <VPC id="VPC8" x={150} y={420} />
          <VPC id="VPC9" x={150} y={560} />
          <VPC id="VPC10" x={850} y={420} />
          <VPC id="VPC11" x={850} y={560} />

          <VPC id="VPC12" x={150} y={770} />
          <VPC id="VPC14" x={150} y={910} />
          <VPC id="VPC13" x={850} y={770} />
          <VPC id="VPC15" x={850} y={910} />
        </NetLab>
      </div>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Objectives
        </summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Create VLANs <code>10</code> (HR), <code>20</code> (IT),{" "}
            <code>30</code> (Marketing) and <code>40</code> (Management) on{" "}
            <strong>all three</strong> switches. VLANs are local to each switch,
            so every switch needs its own copy.
          </li>
          <li>
            Put every VPC-facing port in its VLAN with{" "}
            <code>switchport mode access</code> and{" "}
            <code>switchport access vlan X</code>.
          </li>
          <li>
            Configure the switch-to-switch links{" "}
            <strong>also as access ports</strong>, one VLAN per link, following
            the VLAN number written on each blue line (10, 20, 30, 40). Do{" "}
            <strong>not</strong> use <code>switchport mode trunk</code>{" "}
            anywhere.
          </li>
          <li>
            Give each VPC an IP from its VLAN's subnet (
            <code>ip 192.168.X.N/24</code>, no gateway needed because there is
            no router).
          </li>
          <li>
            Verify with <code>show vlan brief</code>,{" "}
            <code>show interfaces status</code> and{" "}
            <code>show running-config</code>. Every port must appear in exactly
            one VLAN.
          </li>
          <li>
            Test <strong>same-VLAN</strong> pings (they work) and{" "}
            <strong>different-VLAN</strong> pings (they fail):{" "}
            <code>VPC4 → VPC8</code>, <code>VPC4 → VPC12</code> OK;{" "}
            <code>VPC4 → VPC5</code> fails.
          </li>
          <li>
            Break something on purpose: <code>shutdown</code> the VLAN 20 link
            between SW1 and SW2 and watch VPC5 lose VPC9 and VPC14 while VLAN
            10, 30 and 40 keep working. Then restore it.
          </li>
          <li>
            Save with <code>copy running-config startup-config</code> and test{" "}
            <code>reload</code>.
          </li>
        </ol>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          What the network should look like
        </summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            An access port belongs to exactly one VLAN, so it can only carry
            that VLAN's frames. With no trunks, each VLAN needs a dedicated
            cable between neighbouring switches: 4 links SW1–SW2 and 4 links
            SW2–SW3. There is no router, so there is no inter-VLAN routing: only
            hosts in the same VLAN can reach each other.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}
            >
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>VLAN</th>
                  <th style={CELL}>Subnet</th>
                  <th style={CELL}>Hosts</th>
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map((m) => (
                  <tr
                    key={m.vlan}
                    style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}
                  >
                    <td style={{ ...CELL, fontWeight: 600 }}>{m.vlan}</td>
                    <td style={{ ...CELL, font: MONO }}>{m.subnet}</td>
                    <td style={CELL}>{m.hosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: pings inside a VLAN (for example{" "}
            <code>VPC6 → VPC10 → VPC13</code>) succeed; any ping between two
            different VLANs times out. <code>show vlan brief</code> on SW2 lists
            4 host ports plus 2 link ports (one up, one down) in each of the
            four VLANs, and no port is a trunk.
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

export default AccessPortLabS;
