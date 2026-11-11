"use client";

/**
 * DHCP + Inter-VLAN Labs (two branch offices in ONE file).
 *
 *  BR_BLR  192.168.XX.0/24, gateway .100 → Router-on-a-stick (R1) is gateway AND DHCP server.
 *  BR_US   10.10.XX.0/24,   gateway .254 → Multilayer switch (MLS1) with SVIs is gateway AND DHCP server.
 *
 * Both branches: VLANs 10/20/30/40, 3 devices in a line, 4 VPCs per device, and every switch-to-switch connection is
 * FOUR parallel cables bundled into one LACP port-channel (one side active, the other passive). The trunk is
 * configured only on the port-channel interface. Hosts get their address with "ip dhcp".
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable (with the offset prop) / Note from netsim.tsx, plus Router, Switch and VPC components.
 * MLS1 uses the Switch component: it must run a Layer 3 switch image (ip routing, interface vlan).
 * Device ids are unique across both labs because the "netlab:run" event is global.
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

const DNS = "8.8.8.8";
const DOMAIN = "www.BSOFT.com";

/* ───────────────────────── data model ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "switch" | "router" | "pc"; lines: Line[] };
const L = (cmd: string, note?: string): Line => ({ cmd, note });

const VLANS: [number, string][] = [
  [10, "HR"],
  [20, "IT"],
  [30, "Marketing"],
  [40, "Management"],
];

type SwitchSpec = {
  id: string;
  x: number;
  y: number;
  ports: string[];
  /** access port for VLAN 10, 20, 30, 40 (in this order) */
  access: [string, string, string, string];
  /** host id for VLAN 10, 20, 30, 40 */
  hosts: [string, string, string, string];
  /** Layer 3 switch: ip routing + SVIs + DHCP server */
  l3?: boolean;
  /** trunk port towards the router (router-on-a-stick) */
  uplink?: string;
};
/** a = ACTIVE side, b = PASSIVE side; aPorts[i] is cabled to bPorts[i] */
type Link = { a: string; b: string; po: number; aPorts: string[]; bPorts: string[] };
type Lab = {
  id: string;
  site: string;
  title: string;
  base: string; // "192.168." or "10.10."
  gw: number; // last octet of the gateway
  width: number;
  height: number;
  router?: { id: string; x: number; y: number; port: string };
  switches: SwitchSpec[];
  links: Link[];
  gwOwner: (v: number) => string;
  objectives: React.ReactNode[];
  explain: React.ReactNode;
  expected: React.ReactNode;
};

const PORTS12 = ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3", "e2/0", "e2/1", "e2/2", "e2/3"];
const PORTS8 = PORTS12.slice(0, 8);
const fullName = (p: string) => "Ethernet" + p.slice(1);
const OFFS = [-87, -29, 29, 87];
const net = (lab: Lab, v: number) => `${lab.base}${v}`; // "192.168.10"

/* ───────────────────────── the two labs ───────────────────────── */

const BLR: Lab = {
  id: "blr",
  site: "BR_BLR",
  title: "BR_BLR · Router-on-a-Stick + DHCP",
  base: "192.168.",
  gw: 100,
  width: 1000,
  height: 1150,
  router: { id: "R1", x: 500, y: 70, port: "e0/0" },
  switches: [
    { id: "SW1", x: 500, y: 250, ports: PORTS12, access: ["e0/3", "e1/0", "e0/0", "e0/2"], hosts: ["VPC1", "VPC2", "VPC3", "VPC4"], uplink: "e2/0" },
    { id: "SW2", x: 500, y: 600, ports: PORTS12, access: ["e0/2", "e0/3", "e1/0", "e1/1"], hosts: ["VPC5", "VPC6", "VPC7", "VPC8"] },
    { id: "SW3", x: 500, y: 950, ports: PORTS8, access: ["e0/1", "e0/2", "e0/3", "e1/0"], hosts: ["VPC9", "VPC10", "VPC11", "VPC12"] },
  ],
  links: [
    { a: "SW1", b: "SW2", po: 1, aPorts: ["e1/3", "e1/2", "e1/1", "e0/1"], bPorts: ["e2/0", "e1/3", "e1/2", "e0/1"] },
    { a: "SW2", b: "SW3", po: 2, aPorts: ["e2/3", "e2/2", "e2/1", "e0/0"], bPorts: ["e1/3", "e1/2", "e1/1", "e0/0"] },
  ],
  gwOwner: (v) => `R1 e0/0.${v}`,
  objectives: [
    <>Create VLANs <code>10</code> (HR), <code>20</code> (IT), <code>30</code> (Marketing) and <code>40</code> (Management) on <strong>all three</strong> switches.</>,
    <>Put every VPC-facing port in its VLAN with <code>switchport mode access</code> and <code>switchport access vlan X</code>.</>,
    <>Bundle SW1–SW2 into <strong>Port-channel 1</strong> and SW2–SW3 into <strong>Port-channel 2</strong>, both with <strong>LACP</strong>: <code>channel-group N mode active</code> on the upper switch and <code>channel-group N mode passive</code> on the lower one, on every member port.</>,
    <>Configure the trunk <strong>only on the port-channel interfaces</strong> (<code>switchport trunk encapsulation dot1q</code>, <code>switchport mode trunk</code>, <code>switchport trunk allowed vlan 10,20,30,40</code>). Members only get the <code>channel-group</code> command.</>,
    <>Make SW1 <code>e2/0</code> (the port to R1) a trunk as well. One cable carries all four VLANs.</>,
    <>On R1 bring up <code>e0/0</code> (no IP address) and create the sub-interfaces <code>e0/0.10</code> to <code>e0/0.40</code>, each with <code>encapsulation dot1Q X</code> and the gateway <code>192.168.X.100 255.255.255.0</code>.</>,
    <>Configure R1 as DHCP server. Exclude the gateway address, then for every VLAN create a pool with <code>network</code>, <code>default-router</code>, <code>dns-server</code>, <code>domain-name</code> and <code>lease 2 0</code>.</>,
    <>On every VPC type <code>ip dhcp</code>, then confirm with <code>show ip</code>. Each VPC must have an address of its own VLAN and the gateway <code>.100</code>.</>,
    <>Verify with <code>show etherchannel summary</code>, <code>show interfaces trunk</code>, and on R1 <code>show ip dhcp binding</code>, <code>show ip dhcp pool</code> and <code>show ip route</code>.</>,
    <>Test same-VLAN pings across switches and different-VLAN pings (for example VPC1 → VPC2). Run <code>trace</code> and read the first hop (<code>.100</code>).</>,
    <>Break something: shut one member port of a bundle and see that pings continue. Then <code>shutdown</code> R1 <code>e0/0.20</code>, run <code>ip dhcp</code> again on a VLAN 20 host (it no longer gets an address) and restore it.</>,
    <>Save with <code>copy running-config startup-config</code> and test <code>reload</code>.</>,
  ],
  explain: (
    <>
      R1 has one physical port to SW1, split into four sub-interfaces. Each sub-interface is the gateway (<code>.100</code>)
      of its VLAN and also the place where DHCP requests arrive: a host broadcasts a DHCP Discover, the frame travels up
      the trunk tagged with its VLAN, and R1 answers from the pool whose network matches that sub-interface. The DHCP server
      is on the same segment as the clients, so no <code>ip helper-address</code> is needed. The gateway address is excluded
      from the pools so that it is never handed to a host. Between the switches, four cables are bundled into one LACP
      port-channel, so spanning tree sees a single link and none of the cables is blocked.
    </>
  ),
  expected: (
    <>
      <code>show ip dhcp binding</code> on R1 lists the leased addresses (for example 192.168.10.101 for the first VLAN 10
      host). <code>show ip route</code> lists four <code>C</code> networks via <code>Ethernet0/0.10</code> to <code>.40</code>.
      <code> trace 192.168.20.101</code> from a VLAN 10 host shows 192.168.10.100 as hop 1.
    </>
  ),
};

const US: Lab = {
  id: "us",
  site: "BR_US",
  title: "BR_US · MLS with SVIs + DHCP",
  base: "10.10.",
  gw: 254,
  width: 1000,
  height: 1000,
  switches: [
    { id: "MLS1", x: 500, y: 110, ports: PORTS8, access: ["e0/3", "e1/0", "e0/0", "e0/2"], hosts: ["VPC13", "VPC14", "VPC15", "VPC16"], l3: true },
    { id: "SW4", x: 500, y: 460, ports: PORTS12, access: ["e0/2", "e0/3", "e1/0", "e1/1"], hosts: ["VPC17", "VPC18", "VPC19", "VPC20"] },
    { id: "SW5", x: 500, y: 810, ports: PORTS8, access: ["e0/1", "e0/2", "e0/3", "e1/0"], hosts: ["VPC21", "VPC22", "VPC23", "VPC24"] },
  ],
  links: [
    { a: "MLS1", b: "SW4", po: 1, aPorts: ["e1/3", "e1/2", "e1/1", "e0/1"], bPorts: ["e2/0", "e1/3", "e1/2", "e0/1"] },
    { a: "SW4", b: "SW5", po: 2, aPorts: ["e2/3", "e2/2", "e2/1", "e0/0"], bPorts: ["e1/3", "e1/2", "e1/1", "e0/0"] },
  ],
  gwOwner: (v) => `MLS1 interface Vlan${v}`,
  objectives: [
    <>Create VLANs <code>10</code> (HR), <code>20</code> (IT), <code>30</code> (Marketing) and <code>40</code> (Management) on <strong>all three</strong> switches, MLS1 included.</>,
    <>Put every VPC-facing port in its VLAN with <code>switchport mode access</code> and <code>switchport access vlan X</code>, also on MLS1.</>,
    <>Bundle MLS1–SW4 into <strong>Port-channel 1</strong> and SW4–SW5 into <strong>Port-channel 2</strong>, both with <strong>LACP</strong>: <code>mode active</code> on the upper device and <code>mode passive</code> on the lower one.</>,
    <>Configure the trunk only on the port-channel interfaces (<code>switchport trunk encapsulation dot1q</code>, <code>switchport mode trunk</code>, allowed VLANs 10,20,30,40).</>,
    <>Enable routing on MLS1 with <code>ip routing</code>, then create an SVI for each VLAN: <code>interface vlan X</code>, <code>ip address 10.10.X.254 255.255.255.0</code>, <code>no shutdown</code>.</>,
    <>Configure MLS1 as DHCP server. Exclude <code>10.10.X.254</code>, then create a pool per VLAN with <code>network</code>, <code>default-router 10.10.X.254</code>, <code>dns-server</code>, <code>domain-name</code> and <code>lease 2 0</code>.</>,
    <>On every VPC type <code>ip dhcp</code> and confirm with <code>show ip</code>: an address of its VLAN and the gateway <code>.254</code>.</>,
    <>Verify with <code>show etherchannel summary</code>, <code>show ip interface brief</code>, <code>show ip route</code> and <code>show ip dhcp binding</code> on MLS1.</>,
    <>Test same-VLAN and different-VLAN pings (for example VPC13 → VPC14). Run <code>trace</code> from a VPC on SW5: hop 1 is the <code>.254</code> SVI.</>,
    <>Break something: shut one member port of a bundle (pings continue), then <code>shutdown</code> <code>interface vlan 20</code> on MLS1 and see that VLAN 20 loses its gateway and DHCP. Restore it.</>,
    <>Save with <code>copy running-config startup-config</code> and test <code>reload</code>.</>,
  ],
  explain: (
    <>
      MLS1 is a Layer 3 switch. Each SVI (<code>interface vlan X</code>) is a virtual router interface inside VLAN X, with the
      gateway address <code>.254</code>. With <code>ip routing</code> enabled, the MLS routes between the SVIs in hardware, so no
      router and no extra cable are needed. DHCP works the same way as on a router: the Discover arrives in VLAN X and the
      pool whose network matches the SVI answers. An SVI is only up/up if the VLAN exists and at least one port in that VLAN is
      up, which is true here because the port-channel trunk carries the VLAN. The LACP bundles act as single trunk links
      between MLS1, SW4 and SW5.
    </>
  ),
  expected: (
    <>
      <code>show ip interface brief</code> on MLS1 shows Vlan10 to Vlan40 up/up with their <code>.254</code> addresses.{" "}
      <code>show ip dhcp binding</code> lists the leases (for example 10.10.10.1 for the first VLAN 10 host).{" "}
      <code>trace 10.10.20.1</code> from a VLAN 10 host shows 10.10.10.254 as hop 1.
    </>
  ),
};

/* ───────────────────────── answer key builder ───────────────────────── */

function dhcpLines(lab: Lab): Line[] {
  const out: Line[] = [];
  VLANS.forEach(([v], i) =>
    out.push(L(`ip dhcp excluded-address ${net(lab, v)}.${lab.gw}`, i === 0 ? "keep the gateway out of the pools" : undefined)),
  );
  for (const [v, name] of VLANS) {
    out.push(L(`ip dhcp pool VLAN${v}`, `${name} · step 1: create the pool`));
    out.push(L(` network ${net(lab, v)}.0 255.255.255.0`, "step 2: network"));
    out.push(L(` default-router ${net(lab, v)}.${lab.gw}`, "step 3: gateway"));
    out.push(L(` dns-server ${DNS}`, "step 4: DNS"));
    out.push(L(` domain-name ${DOMAIN}`, "step 5: domain"));
    out.push(L(" lease 2 0", "step 6: 2 days 0 hours"));
  }
  return out;
}

function buildKey(lab: Lab): KeyDevice[] {
  const key: KeyDevice[] = [];

  if (lab.router) {
    const lines: Line[] = [L(`interface ${lab.router.port}`, "physical port: no IP address"), L(" no shutdown")];
    for (const [v, name] of VLANS) {
      lines.push(L(`interface ${lab.router.port}.${v}`, `${name} gateway`));
      lines.push(L(` encapsulation dot1Q ${v}`));
      lines.push(L(` ip address ${net(lab, v)}.${lab.gw} 255.255.255.0`));
      lines.push(L(" no shutdown"));
    }
    lines.push(...dhcpLines(lab));
    key.push({ id: lab.router.id, kind: "router", lines });
  }

  for (const s of lab.switches) {
    const lines: Line[] = [];
    for (const [v, name] of VLANS) {
      lines.push(L(`vlan ${v}`));
      lines.push(L(` name ${name}`));
    }
    if (s.l3) lines.push(L("ip routing", "turns the switch into a router"));
    s.access.forEach((port, i) => {
      lines.push(L(`interface ${port}`, `${s.hosts[i]} · VLAN ${VLANS[i][0]}`));
      lines.push(L(" switchport mode access"));
      lines.push(L(` switchport access vlan ${VLANS[i][0]}`));
      lines.push(L(" no shutdown"));
    });
    if (s.uplink) {
      lines.push(L(`interface ${s.uplink}`, `trunk to ${lab.router?.id}`));
      lines.push(L(" switchport trunk encapsulation dot1q", "must come first on this switch image"));
      lines.push(L(" switchport mode trunk"));
      lines.push(L(" switchport trunk allowed vlan 10,20,30,40"));
      lines.push(L(" no shutdown"));
    }
    for (const l of lab.links) {
      if (l.a !== s.id && l.b !== s.id) continue;
      const active = l.a === s.id;
      const members = active ? l.aPorts : l.bPorts;
      const mode = active ? "active" : "passive";
      const peer = active ? l.b : l.a;
      for (const m of members) {
        lines.push(L(`interface ${m}`, `member of Po${l.po} (to ${peer})`));
        lines.push(L(` channel-group ${l.po} mode ${mode}`, "LACP"));
        lines.push(L(" no shutdown"));
      }
      lines.push(L(`interface port-channel ${l.po}`, `trunk to ${peer}: applies to all members`));
      lines.push(L(" switchport trunk encapsulation dot1q", "must come first on this switch image"));
      lines.push(L(" switchport mode trunk"));
      lines.push(L(" switchport trunk allowed vlan 10,20,30,40"));
    }
    if (s.l3) {
      for (const [v, name] of VLANS) {
        lines.push(L(`interface vlan ${v}`, `${name} gateway (SVI)`));
        lines.push(L(` ip address ${net(lab, v)}.${lab.gw} 255.255.255.0`));
        lines.push(L(" no shutdown"));
      }
      lines.push(...dhcpLines(lab));
    }
    key.push({ id: s.id, kind: "switch", lines });
  }

  for (const s of lab.switches)
    for (const h of s.hosts) key.push({ id: h, kind: "pc", lines: [L("ip dhcp", "gets address, mask, gateway and DNS")] });

  return key;
}

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(new CustomEvent("netlab:run", { detail: { device, commands, config } }));
}

const BLUE = new Set([
  "switchport", "no", "name", "ip", "channel-group", "encapsulation", "network", "default-router",
  "dns-server", "domain-name", "lease",
]);

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const isPool = first === "ip" && rest[0] === "dhcp" && rest[1] === "pool";
  const color = first === "interface" || first === "vlan" || isPool ? "#c084fc" : BLUE.has(first) ? "#38bdf8" : "inherit";
  return (
    <span style={{ whiteSpace: "pre-wrap", flexShrink: 1, minWidth: 0 }}>
      {" ".repeat(indent)}
      <span style={{ color, fontWeight: 600 }}>{first}</span> {rest.join(" ")}
    </span>
  );
}

function KeyLine({ device, index }: { device: KeyDevice; index: number }) {
  const [state, setState] = useState<"idle" | "ran" | "copied">("idle");
  const { lines } = device;
  const { cmd, note } = lines[index];

  // Indented line → include its parent ("interface …" / "vlan …" / "ip dhcp pool …") so it works from any mode.
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

/* ───────────────────────── one lab (generic view) ───────────────────────── */

// host slots relative to the switch: [x, dy] for VLAN 10, 20, 30, 40, and the label slots beside them
const HOST_SLOT: [number, number][] = [[150, -40], [150, 100], [850, -40], [850, 100]];
const NOTE_SLOT: [number, number][] = [[110, -80], [110, 60], [890, -80], [890, 60]];

function LabView({ lab }: { lab: Lab }) {
  const key = buildKey(lab);
  const top = lab.switches[0];
  const swById = Object.fromEntries(lab.switches.map((s) => [s.id, s]));
  const bundleRows = lab.links.map((l) => ({
    po: `Po${l.po}`,
    link: `${l.a} ↔ ${l.b}`,
    modes: `${l.a} active · ${l.b} passive`,
    ports: `${l.a} ${l.aPorts.join(", ")} ↔ ${l.b} ${l.bPorts.join(", ")}`,
  }));

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: "100%", gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ overflowX: "clip" }}>
        <NetLab title={lab.title} width={lab.width} height={lab.height}>
          <Note x={500} y={25} size={22}>{lab.site}</Note>

          {/* router ↔ first switch: one trunk */}
          {lab.router && <Cable a={`${lab.router.id}:${lab.router.port}`} b={`${top.id}:${top.uplink}`} />}

          {/* host cables */}
          {lab.switches.flatMap((s) =>
            s.hosts.map((h, i) => <Cable key={`h-${h}`} a={`${s.id}:${s.access[i]}`} b={`${h}:eth0`} />),
          )}

          {/* LACP bundles: four cables each */}
          {lab.links.flatMap((l) =>
            l.aPorts.map((p, i) => (
              <Cable key={`l-${l.po}-${i}`} a={`${l.a}:${p}`} b={`${l.b}:${l.bPorts[i]}`} offset={OFFS[i]} />
            )),
          )}

          {/* labels: beside the cables, never on them */}
          {lab.router && (
            <Note x={640} y={(lab.router.y + top.y) / 2}>Trunk · VLAN 10,20,30,40 · dot1q</Note>
          )}
          {lab.router && <Note x={720} y={45}>{lab.router.id} · DHCP server · gateway .{lab.gw}</Note>}
          {!lab.router && <Note x={660} y={top.y - 70}>{top.id} · SVIs .{lab.gw} · DHCP server</Note>}
          {lab.links.map((l) => (
            <Note key={`n-${l.po}`} x={720} y={(swById[l.a].y + swById[l.b].y) / 2}>
              {`Po${l.po} · LACP · trunk`}
            </Note>
          ))}

          {/* VLAN / subnet labels beside every VPC */}
          {lab.switches.flatMap((s) =>
            s.hosts.map((h, i) => (
              <Note key={`t-${h}`} x={NOTE_SLOT[i][0]} y={s.y + NOTE_SLOT[i][1]}>
                {`VLAN ${VLANS[i][0]} · DHCP ${net(lab, VLANS[i][0])}.x`}
              </Note>
            )),
          )}

          {/* devices */}
          {lab.router && (
            <Router id={lab.router.id} x={lab.router.x} y={lab.router.y} ports={[fullName(lab.router.port)]} />
          )}
          {lab.switches.map((s) => (
            <Switch key={s.id} id={s.id} x={s.x} y={s.y} ports={s.ports.map(fullName)} />
          ))}
          {lab.switches.flatMap((s) =>
            s.hosts.map((h, i) => <VPC key={`v-${h}`} id={h} x={HOST_SLOT[i][0]} y={s.y + HOST_SLOT[i][1]} />),
          )}
        </NetLab>
      </div>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          {lab.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ol>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What the network should look like</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>{lab.explain}</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Bundle</th>
                  <th style={CELL}>Between</th>
                  <th style={CELL}>LACP modes</th>
                  <th style={CELL}>Member ports</th>
                </tr>
              </thead>
              <tbody>
                {bundleRows.map((b) => (
                  <tr key={b.po} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{b.po}</td>
                    <td style={CELL}>{b.link}</td>
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
                  <th style={CELL}>Gateway</th>
                  <th style={CELL}>Hosts (DHCP)</th>
                </tr>
              </thead>
              <tbody>
                {VLANS.map(([v, name], i) => (
                  <tr key={v} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{`${v} · ${name}`}</td>
                    <td style={{ ...CELL, font: MONO }}>{`${net(lab, v)}.0/24`}</td>
                    <td style={{ ...CELL, font: MONO }}>{`${net(lab, v)}.${lab.gw} (${lab.gwOwner(v)})`}</td>
                    <td style={CELL}>{lab.switches.map((s) => s.hosts[i]).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: <code>show etherchannel summary</code> lists Po1 and Po2 with flags <code>SU</code>, protocol LACP and
            all four members flagged <code>P</code>. {lab.expected}
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
          {key.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      </details>
    </div>
  );
}

/* ───────────────────────── exports ───────────────────────── */

export function BrBlrLab() {
  return <LabView lab={BLR} />;
}

export function BrUsLab() {
  return <LabView lab={US} />;
}

/** Both labs, one after the other. */
export function DhcpInterVlanLabs() {
  const H2: React.CSSProperties = { font: "600 18px ui-sans-serif,system-ui", margin: "0 0 10px" };
  return (
    <div style={{ display: "grid", gap: 48, width: "100%" }}>
      <section>
        <h2 style={H2}>BR_BLR · 192.168.XX.0/24 · gateway .100 · Router-on-a-stick + DHCP</h2>
        <BrBlrLab />
      </section>
      <section>
        <h2 style={H2}>BR_US · 10.10.XX.0/24 · gateway .254 · MLS (SVI) + DHCP</h2>
        <BrUsLab />
      </section>
    </div>
  );
}

export default DhcpInterVlanLabs;