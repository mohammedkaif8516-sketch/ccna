"use client";

/**
 * EtherChannel Lab (Intra-VLAN) — 3 switches, 12 VPCs, VLANs 10/20/30/40.
 *
 * Each switch-to-switch connection is FOUR parallel cables bundled into one logical port-channel:
 *   SW1–SW2 → Port-channel 1 (LACP:  SW1 active,    SW2 passive)
 *   SW2–SW3 → Port-channel 2 (PAgP:  SW2 desirable, SW3 auto)
 * The trunk (encapsulation dot1q, mode trunk, allowed VLANs) is configured ONLY on the port-channel
 * interface; the member ports just get "channel-group N mode X" and inherit the trunk from it.
 * There is no router, so only hosts in the same VLAN can talk.
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable (with the offset prop) / Note from netsim.tsx, plus Switch and VPC components.
 */
import { NetLab, Cable, Note } from "./netsim";
import Switch from "./Switch";
import VPC from "./VPC";
import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = { padding: "6px 10px", textAlign: "left", verticalAlign: "top" };

/* ───────────────────────── answer key data ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "switch" | "pc"; lines: Line[] };
const L = (cmd: string, note?: string): Line => ({ cmd, note });

const VLANS: [number, string][] = [
  [10, "HR"],
  [20, "IT"],
  [30, "Marketing"],
  [40, "Management"],
];

// [port, vlan, note] — access ports
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

// One bundle per switch-to-switch connection. Members are physical cables; the trunk lives on the port-channel.
type Bundle = { po: number; mode: string; members: string[]; peer: string };
const BUNDLES: Record<string, Bundle[]> = {
  SW1: [{ po: 1, mode: "active", members: ["e0/1", "e1/1", "e1/2", "e1/3"], peer: "SW2" }],
  SW2: [
    { po: 1, mode: "passive", members: ["e0/1", "e1/2", "e1/3", "e2/0"], peer: "SW1" },
    { po: 2, mode: "desirable", members: ["e0/0", "e2/1", "e2/2", "e2/3"], peer: "SW3" },
  ],
  SW3: [{ po: 2, mode: "auto", members: ["e0/0", "e1/1", "e1/2", "e1/3"], peer: "SW2" }],
};

const ANSWER_KEY: KeyDevice[] = [
  ...Object.keys(ACCESS).map((id): KeyDevice => {
    const lines: Line[] = [];
    for (const [v, name] of VLANS) {
      lines.push(L(`vlan ${v}`));
      lines.push(L(` name ${name}`));
    }
    for (const [port, vlan, note] of ACCESS[id]) {
      lines.push(L(`interface ${port}`, `${note} · VLAN ${vlan}`));
      lines.push(L(" switchport mode access"));
      lines.push(L(` switchport access vlan ${vlan}`));
      lines.push(L(" no shutdown"));
    }
    for (const b of BUNDLES[id]) {
      // 1) members: ONLY the channel-group command (they inherit everything else from the port-channel)
      for (const m of b.members) {
        lines.push(L(`interface ${m}`, `member of Po${b.po} (to ${b.peer})`));
        lines.push(L(` channel-group ${b.po} mode ${b.mode}`));
        lines.push(L(" no shutdown"));
      }
      // 2) the trunk is configured once, on the port-channel
      lines.push(L(`interface port-channel ${b.po}`, `trunk to ${b.peer}: applies to all members`));
      lines.push(L(" switchport trunk encapsulation dot1q", "must come first on this switch image"));
      lines.push(L(" switchport mode trunk"));
      lines.push(L(" switchport trunk allowed vlan 10,20,30,40"));
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
  { vlan: "10 · HR", subnet: "192.168.10.0/24", hosts: "VPC4 (.1) · VPC8 (.2) · VPC12 (.3)" },
  { vlan: "20 · IT", subnet: "192.168.20.0/24", hosts: "VPC5 (.1) · VPC9 (.2) · VPC14 (.3)" },
  { vlan: "30 · Marketing", subnet: "192.168.30.0/24", hosts: "VPC6 (.1) · VPC10 (.2) · VPC13 (.3)" },
  { vlan: "40 · Management", subnet: "192.168.40.0/24", hosts: "VPC7 (.1) · VPC11 (.2) · VPC15 (.3)" },
];

const BUNDLE_TABLE = [
  { po: "Po1", link: "SW1 ↔ SW2", proto: "LACP", modes: "SW1 active · SW2 passive", ports: "SW1 e0/1, e1/1, e1/2, e1/3 ↔ SW2 e0/1, e1/2, e1/3, e2/0" },
  { po: "Po2", link: "SW2 ↔ SW3", proto: "PAgP", modes: "SW2 desirable · SW3 auto", ports: "SW2 e0/0, e2/1, e2/2, e2/3 ↔ SW3 e0/0, e1/1, e1/2, e1/3" },
];

const SWITCH_PORTS: Record<string, string[]> = {
  SW1: ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3"],
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
        runOnDevice(device.id, cmds, device.kind === "switch");
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
      <div style={{ padding: 6, display: open ? "block" : "none", font: MONO, overflowX: "auto" }}>
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── the lab ───────────────────────── */

export function EtherChannelLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: "100%", gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ overflowX: "clip" }}>
        <NetLab title="EtherChannel Lab" width={1000} height={1000}>
          <Note x={500} y={25} size={22}>EtherChannel</Note>

          {/* ── SW1 hosts ── */}
          <Cable a="SW1:e0/3" b="VPC4:eth0" bTag=".1" />
          <Cable a="SW1:e1/0" b="VPC5:eth0" bTag=".1" />
          <Cable a="SW1:e0/0" b="VPC6:eth0" bTag=".1" />
          <Cable a="SW1:e0/2" b="VPC7:eth0" bTag=".1" />

          {/* ── Port-channel 1: SW1 ↔ SW2 (4 member cables) ── */}
          <Cable a="SW1:e1/3" b="SW2:e2/0" offset={-87} />
          <Cable a="SW1:e1/2" b="SW2:e1/3" offset={-29} />
          <Cable a="SW1:e1/1" b="SW2:e1/2" offset={29} />
          <Cable a="SW1:e0/1" b="SW2:e0/1" offset={87} />

          {/* ── SW2 hosts ── */}
          <Cable a="SW2:e0/2" b="VPC8:eth0" bTag=".2" />
          <Cable a="SW2:e0/3" b="VPC9:eth0" bTag=".2" />
          <Cable a="SW2:e1/0" b="VPC10:eth0" bTag=".2" />
          <Cable a="SW2:e1/1" b="VPC11:eth0" bTag=".2" />

          {/* ── Port-channel 2: SW2 ↔ SW3 (4 member cables) ── */}
          <Cable a="SW2:e2/3" b="SW3:e1/3" offset={-87} />
          <Cable a="SW2:e2/2" b="SW3:e1/2" offset={-29} />
          <Cable a="SW2:e2/1" b="SW3:e1/1" offset={29} />
          <Cable a="SW2:e0/0" b="SW3:e0/0" offset={87} />

          {/* ── SW3 hosts ── */}
          <Cable a="SW3:e0/1" b="VPC12:eth0" bTag=".3" />
          <Cable a="SW3:e0/2" b="VPC14:eth0" bTag=".3" />
          <Cable a="SW3:e0/3" b="VPC13:eth0" bTag=".3" />
          <Cable a="SW3:e1/0" b="VPC15:eth0" bTag=".3" />

          {/* bundle labels: beside the cables, never on them */}
          <Note x={720} y={285}>Po1 · LACP · trunk</Note>
          <Note x={720} y={635}>Po2 · PAgP · trunk</Note>

          {/* VLAN / IP labels beside every VPC */}
          <Note x={110} y={30}>VLAN 10 · 192.168.10.1</Note>
          <Note x={110} y={170}>VLAN 20 · 192.168.20.1</Note>
          <Note x={890} y={30}>VLAN 30 · 192.168.30.1</Note>
          <Note x={890} y={170}>VLAN 40 · 192.168.40.1</Note>

          <Note x={110} y={380}>VLAN 10 · 192.168.10.2</Note>
          <Note x={110} y={520}>VLAN 20 · 192.168.20.2</Note>
          <Note x={890} y={380}>VLAN 30 · 192.168.30.2</Note>
          <Note x={890} y={520}>VLAN 40 · 192.168.40.2</Note>

          <Note x={110} y={730}>VLAN 10 · 192.168.10.3</Note>
          <Note x={110} y={870}>VLAN 20 · 192.168.20.3</Note>
          <Note x={890} y={730}>VLAN 30 · 192.168.30.3</Note>
          <Note x={890} y={870}>VLAN 40 · 192.168.40.3</Note>

          {/* switches */}
          <Switch id="SW1" x={500} y={110} ports={SWITCH_PORTS.SW1.map(fullName)} />
          <Switch id="SW2" x={500} y={460} ports={SWITCH_PORTS.SW2.map(fullName)} />
          <Switch id="SW3" x={500} y={810} ports={SWITCH_PORTS.SW3.map(fullName)} />

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
            Bundle the four cables between SW1 and SW2 into <strong>Port-channel 1</strong> with LACP:{" "}
            <code>channel-group 1 mode active</code> on SW1 and <code>channel-group 1 mode passive</code> on SW2, on every
            member port (SW1 e0/1, e1/1, e1/2, e1/3 and SW2 e0/1, e1/2, e1/3, e2/0).
          </li>
          <li>
            Bundle the four cables between SW2 and SW3 into <strong>Port-channel 2</strong> with PAgP:{" "}
            <code>channel-group 2 mode desirable</code> on SW2 and <code>channel-group 2 mode auto</code> on SW3 (SW2 e0/0,
            e2/1, e2/2, e2/3 and SW3 e0/0, e1/1, e1/2, e1/3).
          </li>
          <li>
            Make each bundle a trunk by configuring <strong>only the port-channel interface</strong>:{" "}
            <code>interface port-channel N</code>, <code>switchport trunk encapsulation dot1q</code>,{" "}
            <code>switchport mode trunk</code> and <code>switchport trunk allowed vlan 10,20,30,40</code>. Do{" "}
            <strong>not</strong> type any trunk command on the member ports: they copy the port-channel's settings
            automatically.
          </li>
          <li>
            Give each VPC an IP from its VLAN's subnet (<code>ip 192.168.X.N/24</code>, no gateway because there is no
            router).
          </li>
          <li>
            Verify with <code>show etherchannel summary</code>, <code>show interfaces trunk</code>,{" "}
            <code>show interfaces port-channel 1</code> and <code>show spanning-tree</code>.
          </li>
          <li>
            Test <strong>same-VLAN</strong> pings across switches (they work) and <strong>different-VLAN</strong> pings
            (they fail): <code>VPC4 → VPC8 → VPC12</code> OK; <code>VPC4 → VPC5</code> fails.
          </li>
          <li>
            Break something on purpose: <code>shutdown</code> one member port (for example SW1 e0/1) and keep a ping
            running. The bundle stays up on three links, and pings continue.
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
            An EtherChannel bundles several physical cables into one logical link. Spanning tree sees a single link, so
            none of the four cables is blocked, and the traffic is shared across all of them. The trunk belongs to the
            port-channel interface: whatever you set there is applied to every member port, so the members only carry the{" "}
            <code>channel-group</code> command. Both ends must agree on the protocol: LACP uses{" "}
            <code>active</code>/<code>passive</code>, PAgP uses <code>desirable</code>/<code>auto</code>, and static uses{" "}
            <code>on</code>/<code>on</code>. There is still no router, so only hosts in the same VLAN can reach each other.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Bundle</th>
                  <th style={CELL}>Between</th>
                  <th style={CELL}>Protocol</th>
                  <th style={CELL}>Modes</th>
                  <th style={CELL}>Member ports</th>
                </tr>
              </thead>
              <tbody>
                {BUNDLE_TABLE.map((b) => (
                  <tr key={b.po} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{b.po}</td>
                    <td style={CELL}>{b.link}</td>
                    <td style={CELL}>{b.proto}</td>
                    <td style={CELL}>{b.modes}</td>
                    <td style={{ ...CELL, font: MONO }}>{b.ports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>VLAN</th>
                  <th style={CELL}>Subnet</th>
                  <th style={CELL}>Hosts</th>
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map((m) => (
                  <tr key={m.vlan} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{m.vlan}</td>
                    <td style={{ ...CELL, font: MONO }}>{m.subnet}</td>
                    <td style={CELL}>{m.hosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: <code>show etherchannel summary</code> lists Po1 and Po2 with the flags <code>SU</code> (Layer 2, in
            use), the protocol (LACP or PAgP), and all four member ports flagged <code>P</code> (bundled). The trunk table
            shows Po1 and Po2 only, not the individual members. Pings inside a VLAN succeed; pings between VLANs time out.
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

export default EtherChannelLab;