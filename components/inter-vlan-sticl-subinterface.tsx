"use client";

/**
 * Router-on-a-Stick Lab — 3 switches, 12 VPCs, 1 router (R16), VLANs 10/20/30/40.
 *
 * Method 2: ONE trunk between R16 and SW1, ONE trunk between SW1–SW2 and ONE trunk between SW2–SW3.
 * Each trunk carries all four VLANs with 802.1Q tags. R16 has a single physical interface (e0/0) split into four
 * sub-interfaces (e0/0.10 … e0/0.40); each sub-interface is the default gateway (192.168.X.254) of one VLAN.
 * Host ports stay ACCESS ports.
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable / Note from netsim.tsx, plus Router, Switch and VPC components.
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import VPC from "./VPC";
import { useState } from "react";
import { Copy, Check, Play } from "lucide-react";

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

// Access ports (hosts): [port, vlan, note]
type P = [string, number, string];
const ACCESS: Record<string, P[]> = {
  SW1: [
    ["e0/3", 10, "VPC4"],
    ["e1/0", 20, "VPC5"],
    ["e0/0", 30, "VPC6"],
    ["e0/2", 40, "VPC7"],
  ],
  SW2: [
    ["e0/2", 10, "VPC8"],
    ["e0/3", 20, "VPC9"],
    ["e1/0", 30, "VPC10"],
    ["e1/1", 40, "VPC11"],
  ],
  SW3: [
    ["e0/1", 10, "VPC12"],
    ["e0/2", 20, "VPC14"],
    ["e0/3", 30, "VPC13"],
    ["e1/0", 40, "VPC15"],
  ],
};

// Trunk ports: [port, note]
const TRUNKS: Record<string, [string, string][]> = {
  SW1: [
    ["e2/0", "trunk to R16 e0/0"],
    ["e1/3", "trunk to SW2 e2/0"],
  ],
  SW2: [
    ["e2/0", "trunk to SW1 e1/3"],
    ["e2/3", "trunk to SW3 e1/3"],
  ],
  SW3: [["e1/3", "trunk to SW2 e2/3"]],
};

// R16: one physical port, one sub-interface per VLAN
const SUBS: [number, string][] = VLANS.map(([v, name]) => [v, name]);

const ANSWER_KEY: KeyDevice[] = [
  ...Object.keys(ACCESS).map((id): KeyDevice => {
    const lines: Line[] = [];
    for (const [v, name] of VLANS) {
      lines.push(L(`vlan ${v}`));
      lines.push(L(` name ${name}`));
    }
    for (const [port, note] of TRUNKS[id]) {
      lines.push(L(`interface ${port}`, note));
      lines.push(L(" switchport trunk encapsulation dot1q", "needed on IOL L2 images"));
      lines.push(L(" switchport mode trunk"));
      lines.push(L(" switchport trunk allowed vlan 10,20,30,40"));
      lines.push(L(" no shutdown"));
    }
    for (const [port, vlan, note] of ACCESS[id]) {
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
    lines: [
      L("interface e0/0", "physical port: no IP address"),
      L(" no shutdown"),
      ...SUBS.flatMap(([vlan, name]) => [
        L(`interface e0/0.${vlan}`, `${name} gateway`),
        L(` encapsulation dot1Q ${vlan}`),
        L(` ip address 192.168.${vlan}.254 255.255.255.0`),
        L(" no shutdown"),
      ]),
    ],
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
  { vlan: "10 · HR", subnet: "192.168.10.0/24", gw: "192.168.10.254 (R16 e0/0.10)", hosts: "VPC4 (.1) · VPC8 (.2) · VPC12 (.3)" },
  { vlan: "20 · IT", subnet: "192.168.20.0/24", gw: "192.168.20.254 (R16 e0/0.20)", hosts: "VPC5 (.1) · VPC9 (.2) · VPC14 (.3)" },
  { vlan: "30 · Marketing", subnet: "192.168.30.0/24", gw: "192.168.30.254 (R16 e0/0.30)", hosts: "VPC6 (.1) · VPC10 (.2) · VPC13 (.3)" },
  { vlan: "40 · Management", subnet: "192.168.40.0/24", gw: "192.168.40.254 (R16 e0/0.40)", hosts: "VPC7 (.1) · VPC11 (.2) · VPC15 (.3)" },
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
      : ["switchport", "no", "name", "ip", "encapsulation"].includes(first)
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
              device.kind !== "pc",
            );
            setRan(true);
            setTimeout(() => setRan(false), 2500);
          }}
          className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-white transition-colors ${
            ran ? "bg-green-600 hover:bg-green-500" : "bg-sky-600 hover:bg-sky-500"
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

export function RouterOnAStickLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 1000, gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ overflowX: "auto" }}>
        <NetLab title="Router-on-a-Stick Lab" width={1000} height={1150}>
          <Note x={500} y={25} size={22}>RouterOnAStick1</Note>

          {/* ── single trunk links ── */}
          <Cable a="R16:e0/0" b="SW1:e2/0" />
          <Cable a="SW1:e1/3" b="SW2:e2/0" />
          <Cable a="SW2:e2/3" b="SW3:e1/3" />

          {/* ── SW1 hosts ── */}
          <Cable a="SW1:e0/3" b="VPC4:eth0" bTag=".1" />
          <Cable a="SW1:e1/0" b="VPC5:eth0" bTag=".1" />
          <Cable a="SW1:e0/0" b="VPC6:eth0" bTag=".1" />
          <Cable a="SW1:e0/2" b="VPC7:eth0" bTag=".1" />

          {/* ── SW2 hosts ── */}
          <Cable a="SW2:e0/2" b="VPC8:eth0" bTag=".2" />
          <Cable a="SW2:e0/3" b="VPC9:eth0" bTag=".2" />
          <Cable a="SW2:e1/0" b="VPC10:eth0" bTag=".2" />
          <Cable a="SW2:e1/1" b="VPC11:eth0" bTag=".2" />

          {/* ── SW3 hosts ── */}
          <Cable a="SW3:e0/1" b="VPC12:eth0" bTag=".3" />
          <Cable a="SW3:e0/2" b="VPC14:eth0" bTag=".3" />
          <Cable a="SW3:e0/3" b="VPC13:eth0" bTag=".3" />
          <Cable a="SW3:e1/0" b="VPC15:eth0" bTag=".3" />

          {/* trunk labels */}
          <Note x={640} y={170}>Trunk · VLAN 10,20,30,40 · dot1q</Note>
          <Note x={640} y={425}>Trunk · VLAN 10,20,30,40 · dot1q</Note>
          <Note x={640} y={775}>Trunk · VLAN 10,20,30,40 · dot1q</Note>
          <Note x={700} y={50}>e0/0.10 · .20 · .30 · .40 = gateways (.254)</Note>

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

          {/* router: only one physical port is used */}
          <Router id="R16" x={500} y={70} ports={["Ethernet0/0"]} />

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
            Configure the links SW1–SW2 (<code>e1/3</code> ↔ <code>e2/0</code>) and SW2–SW3 (<code>e2/3</code> ↔{" "}
            <code>e1/3</code>) as <strong>trunks</strong>: <code>switchport trunk encapsulation dot1q</code> (if the
            switch asks for it) and <code>switchport mode trunk</code>.
          </li>
          <li>
            Configure SW1 <code>e2/0</code> (the port to R16) as a trunk too, so that all four VLANs travel over one
            cable.
          </li>
          <li>
            On R16 bring up the physical <code>e0/0</code> with <code>no shutdown</code> and <strong>no IP address</strong>.
            Then create four sub-interfaces: <code>e0/0.10</code>, <code>.20</code>, <code>.30</code>, <code>.40</code>. Each
            gets <code>encapsulation dot1Q X</code> and the gateway address <code>192.168.X.254 255.255.255.0</code>.
          </li>
          <li>
            Give each VPC its IP and the <strong>default gateway of its VLAN</strong>:{" "}
            <code>ip 192.168.10.1/24 192.168.10.254</code> and so on.
          </li>
          <li>
            Verify with <code>show interfaces trunk</code> on the switches and <code>show ip interface brief</code> and{" "}
            <code>show ip route</code> on R16: four connected (<code>C</code>) networks, each via its own sub-interface.
          </li>
          <li>
            Test <strong>same-VLAN</strong> pings (<code>VPC4 → VPC8</code>) and then <strong>different-VLAN</strong> pings
            (<code>VPC4 → VPC5</code>, <code>VPC4 → VPC15</code>). All should work. Run <code>trace</code> from a VPC and
            read the first hop.
          </li>
          <li>
            Break something on purpose: <code>shutdown</code> sub-interface <code>e0/0.20</code> and see that VLAN 20 still
            reaches its own hosts but not the other VLANs. Restore it, then <code>shutdown</code> the physical{" "}
            <code>e0/0</code> and see that <strong>all</strong> inter-VLAN traffic stops (single point of failure).
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
            A trunk carries many VLANs over one cable by adding an 802.1Q tag (the VLAN ID) to every frame. R16 uses one
            physical port, split into four logical sub-interfaces. Each sub-interface matches one tag with{" "}
            <code>encapsulation dot1Q X</code> and holds the gateway address of that VLAN. A packet from VPC4 to VPC5 goes to
            192.168.10.254, enters R16 tagged with VLAN 10, is routed, and leaves through the same cable tagged with VLAN 20.
            This is why the design is called router on a stick: the packet goes in and out of the same port. It needs only
            one cable per link, but all inter-VLAN traffic shares that one link.
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
            Expected: <code>show ip route</code> on R16 lists the four networks as <code>C</code> via{" "}
            <code>Ethernet0/0.10</code> to <code>.40</code>. <code>show interfaces trunk</code> lists the three trunk ports
            with VLANs 10,20,30,40 allowed and forwarding. Every VPC can ping every other VPC.{" "}
            <code>trace 192.168.20.2</code> from VPC4 shows 192.168.10.254 as hop 1 and the target as hop 2.
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

export default RouterOnAStickLab;