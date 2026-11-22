"use client";

/**
 * NAT + OSPF Diamond Lab — two CE branches, a four-router OSPF core, default routes, local DHCP.
 *
 *   BR_BLR (192.168.XX.0/24, gw .100)  RBLR (CE, NAT, DHCP) ── SW1 ═LACP═ SW2 ═LACP═ SW3
 *   Core   OSPF 100, area 0, links 200.10.XX.0/24, four routers in a diamond:
 *
 *                      R2 (2.2.2.1)
 *                    1 /          \ 2
 *     RBLR ─5─ R1 (1.1.1.1)        R3 (3.3.3.1) ─6─ MLS1
 *                    3 \          / 4
 *                      R4 (4.4.4.1)
 *
 *   BR_US  (10.10.XX.0/24, gw .100)    MLS1 (CE, NAT SVI, DHCP) ═LACP═ SW4 ═LACP═ SW5
 *
 * The two CE devices are not in OSPF. Each one has a default route towards the core and translates (PAT) its private
 * subnets to the address of its core-facing interface. Each CE is also the DHCP server of its own branch.
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable (with the offset prop) / Note from netsim.tsx, plus Router, Switch and VPC components.
 * MLS1 uses the Switch component: it must run a Layer 3 switch image (ip routing, no switchport, interface vlan, NAT).
 * Device ids are unique because the "netlab:run" event is global.
 */
import { NetLab, Cable, Note } from "@/components/simulator/netsim";
import Router from "@/components/simulator/Router";
import Switch from "@/components/simulator/Switch"; import VPC from "@/components/simulator/VPC";

import { useState } from "react";
import { Copy, Check, Play } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = { padding: "6px 10px", textAlign: "left", verticalAlign: "top" };

const DNS = "8.8.8.8";
const DOMAIN = "www.BSOFT.com";
const OSPF_PROC = 100;

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
  y: number;
  ports: string[];
  access: [string, string, string, string]; // access port for VLAN 10, 20, 30, 40
  hosts: [string, string, string, string]; // host id for VLAN 10, 20, 30, 40
  l3?: boolean; // MLS: ip routing + SVIs + routed uplink + NAT + DHCP
  uplink?: string; // trunk port towards the router (router-on-a-stick)
};
/** a = ACTIVE side, b = PASSIVE side; aPorts[i] is cabled to bPorts[i] */
type Bundle = { a: string; b: string; po: number; aPorts: string[]; bPorts: string[] };
type Branch = {
  site: string;
  cx: number; // x of the switch column
  base: string; // "192.168." or "10.10."
  gw: number;
  lan: string; // network used by the NAT access-list
  switches: SwitchSpec[];
  bundles: Bundle[];
};

const PORTS12 = ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3", "e2/0", "e2/1", "e2/2", "e2/3"];
const PORTS8 = PORTS12.slice(0, 8);
const fullName = (p: string) => "Ethernet" + p.slice(1);
const OFFS = [-87, -29, 29, 87];

const BLR: Branch = {
  site: "BR_BLR",
  cx: 500,
  base: "192.168.",
  gw: 100,
  lan: "192.168.0.0",
  switches: [
    { id: "SW1", y: 250, ports: PORTS12, access: ["e0/3", "e1/0", "e0/0", "e0/2"], hosts: ["VPC1", "VPC2", "VPC3", "VPC4"], uplink: "e2/0" },
    { id: "SW2", y: 600, ports: PORTS12, access: ["e0/2", "e0/3", "e1/0", "e1/1"], hosts: ["VPC5", "VPC6", "VPC7", "VPC8"] },
    { id: "SW3", y: 950, ports: PORTS8, access: ["e0/1", "e0/2", "e0/3", "e1/0"], hosts: ["VPC9", "VPC10", "VPC11", "VPC12"] },
  ],
  bundles: [
    { a: "SW1", b: "SW2", po: 1, aPorts: ["e1/3", "e1/2", "e1/1", "e0/1"], bPorts: ["e2/0", "e1/3", "e1/2", "e0/1"] },
    { a: "SW2", b: "SW3", po: 2, aPorts: ["e2/3", "e2/2", "e2/1", "e0/0"], bPorts: ["e1/3", "e1/2", "e1/1", "e0/0"] },
  ],
};

const US: Branch = {
  site: "BR_US",
  cx: 2500,
  base: "10.10.",
  gw: 100,
  lan: "10.10.0.0",
  switches: [
    { id: "MLS1", y: 250, ports: PORTS12, access: ["e0/3", "e1/0", "e0/0", "e0/2"], hosts: ["VPC13", "VPC14", "VPC15", "VPC16"], l3: true },
    { id: "SW4", y: 600, ports: PORTS12, access: ["e0/2", "e0/3", "e1/0", "e1/1"], hosts: ["VPC17", "VPC18", "VPC19", "VPC20"] },
    { id: "SW5", y: 950, ports: PORTS8, access: ["e0/1", "e0/2", "e0/3", "e1/0"], hosts: ["VPC21", "VPC22", "VPC23", "VPC24"] },
  ],
  bundles: [
    { a: "MLS1", b: "SW4", po: 1, aPorts: ["e1/3", "e1/2", "e1/1", "e0/1"], bPorts: ["e2/0", "e1/3", "e1/2", "e0/1"] },
    { a: "SW4", b: "SW5", po: 2, aPorts: ["e2/3", "e2/2", "e2/1", "e0/0"], bPorts: ["e1/3", "e1/2", "e1/1", "e0/0"] },
  ],
};
const BRANCHES = [BLR, US];

const net = (br: Branch, v: number) => `${br.base}${v}`; // "192.168.10"

/* ── the OSPF core: four routers in a diamond, loopbacks and point-to-point links 200.10.N.0/24 ── */

// R1 = left (towards BR_BLR), R2 = top, R3 = right (towards BR_US), R4 = bottom
const LOOP: Record<string, string> = { R1: "1.1.1.1", R2: "2.2.2.1", R3: "3.3.3.1", R4: "4.4.4.1" };

type CoreLink = {
  n: number;
  a: string; ap: string; aHost: number;
  b: string; bp: string; bHost: number;
  nx: number; ny: number; // where the label sits
};
const CORE: CoreLink[] = [
  { n: 1, a: "R1", ap: "e0/1", aHost: 1, b: "R2", bp: "e0/0", bHost: 2, nx: 1160, ny: 185 },
  { n: 2, a: "R2", ap: "e0/1", aHost: 1, b: "R3", bp: "e0/0", bHost: 2, nx: 1840, ny: 185 },
  { n: 3, a: "R1", ap: "e0/2", aHost: 1, b: "R4", bp: "e0/0", bHost: 2, nx: 1160, ny: 450 },
  { n: 4, a: "R4", ap: "e0/1", aHost: 1, b: "R3", bp: "e0/1", bHost: 2, nx: 1840, ny: 450 },
  { n: 5, a: "R1", ap: "e0/0", aHost: 1, b: "RBLR", bp: "e0/1", bHost: 2, nx: 730, ny: 120 },
  { n: 6, a: "R3", ap: "e0/2", aHost: 1, b: "MLS1", bp: "e2/0", bHost: 2, nx: 2260, ny: 235 },
];

/** The CE devices: translated (outside) port and the core router address used as next hop of the default route */
const CE: Record<string, { out: string; next: string; br: Branch }> = {
  RBLR: { out: "e0/1", next: "200.10.5.1", br: BLR },
  MLS1: { out: "e2/0", next: "200.10.6.1", br: US },
};

// positions of the routers (MLS1 and the switches come from their branch)
const ROUTERS: { id: string; x: number; y: number; ports: string[] }[] = [
  { id: "RBLR", x: 500, y: 70, ports: ["e0/0", "e0/1"] },
  { id: "R1", x: 1000, y: 300, ports: ["e0/0", "e0/1", "e0/2"] },
  { id: "R2", x: 1500, y: 120, ports: ["e0/0", "e0/1"] },
  { id: "R3", x: 2000, y: 300, ports: ["e0/0", "e0/1", "e0/2"] },
  { id: "R4", x: 1500, y: 500, ports: ["e0/0", "e0/1"] },
];

/* ───────────────────────── answer key builder ───────────────────────── */

function loopbackLines(dev: string): Line[] {
  return [L("interface loopback 0", "router id and test address"), L(` ip address ${LOOP[dev]} 255.255.255.255`)];
}

function linkLines(dev: string): Line[] {
  const out: Line[] = [];
  for (const k of CORE) {
    if (k.a !== dev && k.b !== dev) continue;
    const mine = k.a === dev;
    const port = mine ? k.ap : k.bp;
    const host = mine ? k.aHost : k.bHost;
    const peer = mine ? k.b : k.a;
    out.push(L(`interface ${port}`, `link ${k.n} to ${peer}`));
    if (dev === "MLS1") out.push(L(" no switchport", "routed port"));
    out.push(L(` description to-${peer}`));
    out.push(L(` ip address 200.10.${k.n}.${host} 255.255.255.0`));
    if (CE[dev]) out.push(L(" ip nat outside", "translated side, towards the core"));
    out.push(L(" no shutdown"));
  }
  return out;
}

/** core routers only: the CE devices use a default route instead of OSPF */
function ospfLines(dev: string): Line[] {
  return [
    L(`router ospf ${OSPF_PROC}`, `OSPF process ${OSPF_PROC}`),
    L(" network 200.10.0.0 0.0.255.255 area 0", "all core links (including the links to the CEs)"),
    L(` network ${LOOP[dev]} 0.0.0.0 area 0`, "loopback"),
  ];
}

/** CE: PAT of the whole branch to the core-facing address + default route to the core */
function natLines(dev: string): Line[] {
  const { out, next, br } = CE[dev];
  return [
    L(`access-list 1 permit ${br.lan} 0.0.255.255`, "which private addresses may be translated"),
    L(`ip nat inside source list 1 interface ${out} overload`, "PAT: every host shares the link address"),
    L(`ip route 0.0.0.0 0.0.0.0 ${next}`, "default route to the core"),
  ];
}

/** CE: DHCP server of its own branch */
function dhcpLines(br: Branch): Line[] {
  const out: Line[] = [];
  VLANS.forEach(([v], i) => {
    out.push(L(`ip dhcp excluded-address ${net(br, v)}.${br.gw}`, i === 0 ? "keep the gateways out of the pools" : undefined));
  });
  for (const [v, name] of VLANS) {
    out.push(L(`ip dhcp pool ${br.site}_VLAN${v}`, `${name} · step 1: pool`));
    out.push(L(` network ${net(br, v)}.0 255.255.255.0`, "step 2: network"));
    out.push(L(` default-router ${net(br, v)}.${br.gw}`, "step 3: gateway"));
    out.push(L(` dns-server ${DNS}`, "step 4: DNS"));
    out.push(L(` domain-name ${DOMAIN}`, "step 5: domain"));
    out.push(L(" lease 2 0", "step 6: 2 days 0 hours"));
  }
  return out;
}

function switchLines(br: Branch, s: SwitchSpec): Line[] {
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
    lines.push(L(`interface ${s.uplink}`, "trunk to RBLR"));
    lines.push(L(" switchport trunk encapsulation dot1q", "must come first on this switch image"));
    lines.push(L(" switchport mode trunk"));
    lines.push(L(" switchport trunk allowed vlan 10,20,30,40"));
    lines.push(L(" no shutdown"));
  }
  for (const b of br.bundles) {
    if (b.a !== s.id && b.b !== s.id) continue;
    const active = b.a === s.id;
    const peer = active ? b.b : b.a;
    for (const m of active ? b.aPorts : b.bPorts) {
      lines.push(L(`interface ${m}`, `member of Po${b.po} (to ${peer})`));
      lines.push(L(` channel-group ${b.po} mode ${active ? "active" : "passive"}`, "LACP"));
      lines.push(L(" no shutdown"));
    }
    lines.push(L(`interface port-channel ${b.po}`, `trunk to ${peer}: applies to all members`));
    lines.push(L(" switchport trunk encapsulation dot1q", "must come first on this switch image"));
    lines.push(L(" switchport mode trunk"));
    lines.push(L(" switchport trunk allowed vlan 10,20,30,40"));
  }
  if (s.l3) {
    for (const [v, name] of VLANS) {
      lines.push(L(`interface vlan ${v}`, `${name} gateway (SVI)`));
      lines.push(L(` description GW-VLAN${v}`));
      lines.push(L(` ip address ${net(br, v)}.${br.gw} 255.255.255.0`));
      lines.push(L(" ip nat inside", "private side"));
      lines.push(L(" no shutdown"));
    }
    lines.push(...linkLines(s.id), ...natLines(s.id), ...dhcpLines(br));
  }
  return lines;
}

function buildKey(): KeyDevice[] {
  const key: KeyDevice[] = [];

  // RBLR: router-on-a-stick gateway, NAT and DHCP server of BR_BLR
  const rb: Line[] = [...linkLines("RBLR"), L("interface e0/0", "trunk to SW1: no IP address"), L(" no shutdown")];
  for (const [v, name] of VLANS) {
    rb.push(L(`interface e0/0.${v}`, `${name} gateway`));
    rb.push(L(` description GW-VLAN${v}`));
    rb.push(L(` encapsulation dot1Q ${v}`));
    rb.push(L(` ip address ${net(BLR, v)}.${BLR.gw} 255.255.255.0`));
    rb.push(L(" ip nat inside", "private side"));
    rb.push(L(" no shutdown"));
  }
  rb.push(...natLines("RBLR"), ...dhcpLines(BLR));
  key.push({ id: "RBLR", kind: "router", lines: rb });

  for (const r of ["R1", "R2", "R3", "R4"])
    key.push({ id: r, kind: "router", lines: [...loopbackLines(r), ...linkLines(r), ...ospfLines(r)] });

  for (const br of BRANCHES)
    for (const s of br.switches) key.push({ id: s.id, kind: "switch", lines: switchLines(br, s) });

  for (const br of BRANCHES)
    for (const s of br.switches)
      for (const h of s.hosts) key.push({ id: h, kind: "pc", lines: [L("ip dhcp", "address, mask, gateway and DNS from the CE")] });

  return key;
}

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(new CustomEvent("netlab:run", { detail: { device, commands, config } }));
}

const BLUE = new Set([
  "switchport", "no", "name", "ip", "channel-group", "encapsulation", "network", "default-router",
  "dns-server", "domain-name", "lease", "description",
]);

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const isPool = first === "ip" && rest[0] === "dhcp" && rest[1] === "pool";
  const color =
    first === "interface" || first === "vlan" || first === "router" || isPool ? "var(--primary)" : BLUE.has(first) ? "var(--accent)" : "inherit";
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

  // Indented line → include its parent ("interface …" / "vlan …" / "router ospf …" / "ip dhcp pool …").
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
      className="group flex flex-wrap items-center rounded-md px-2 py-[3px] cursor-pointer transition-colors hover:bg-primary/10"
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
            flex: "1 1 140px",
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
    <div className="ccna-lab__device glass glass-hover">
      <div
        className="ccna-lab__device-header"
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
            ran ? "bg-green-600 hover:bg-green-500" : "bg-primary hover:bg-primary/90"
          }`}
        >
          {ran ? "Ran ✓" : "Run all"}
        </button>
      </div>
      <div
        className="ccna-lab__device-commands"
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

/* ───────────────────────── the lab ───────────────────────── */

// host slots relative to the switch column: [dx, dy] for VLAN 10, 20, 30, 40 and their labels
const HOST_SLOT: [number, number][] = [[-350, -40], [-350, 100], [350, -40], [350, 100]];
const NOTE_SLOT: [number, number][] = [[-390, -80], [-390, 60], [390, -80], [390, 60]];

const ALL_SWITCHES = BRANCHES.flatMap((b) => b.switches.map((s) => ({ br: b, s })));

export function NatOspfDiamondLab() {
  const key = buildKey();

  return (
    <div className="ccna-lab" style={{ display: "grid", gap: 14, maxWidth: "100%", gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ overflowX: "clip" }}>
        <NetLab title="NAT + OSPF Diamond Lab" width={3000} height={1150}>
          {/* branch titles */}
          <Note x={BLR.cx} y={25} size={22}>BR_BLR · 192.168.XX.0/24 · gw .100</Note>
          <Note x={US.cx} y={25} size={22}>BR_US · 10.10.XX.0/24 · gw .100</Note>

          {/* ── core links (diamond + the two CE links) ── */}
          {CORE.map((k) => (
            <Cable key={`c${k.n}`} a={`${k.a}:${k.ap}`} b={`${k.b}:${k.bp}`} />
          ))}
          {/* RBLR ↔ SW1: one trunk */}
          <Cable a="RBLR:e0/0" b="SW1:e2/0" />

          {/* ── host cables and LACP bundles of both branches ── */}
          {BRANCHES.flatMap((br) => [
            ...br.switches.flatMap((s) =>
              s.hosts.map((h, i) => <Cable key={`h-${h}`} a={`${s.id}:${s.access[i]}`} b={`${h}:eth0`} />),
            ),
            ...br.bundles.flatMap((b) =>
              b.aPorts.map((p, i) => (
                <Cable key={`b-${br.site}-${b.po}-${i}`} a={`${b.a}:${p}`} b={`${b.b}:${b.bPorts[i]}`} offset={OFFS[i]} />
              )),
            ),
          ])}

          {/* ── labels (beside the cables, never on them) ── */}
          {CORE.map((k) => (
            <Note key={`cn${k.n}`} x={k.nx} y={k.ny}>{`Link ${k.n} · 200.10.${k.n}.0/24`}</Note>
          ))}
          <Note x={BLR.cx + 140} y={165}>Trunk · VLAN 10,20,30,40</Note>
          {BRANCHES.flatMap((br) =>
            br.bundles.map((b) => {
              const ya = br.switches.find((s) => s.id === b.a)!.y;
              const yb = br.switches.find((s) => s.id === b.b)!.y;
              return (
                <Note key={`bn-${br.site}-${b.po}`} x={br.cx + 220} y={(ya + yb) / 2}>
                  {`Po${b.po} · LACP · trunk`}
                </Note>
              );
            }),
          )}
          <Note x={340} y={70}>CE · NAT · DHCP</Note>
          <Note x={2690} y={175}>CE · NAT SVIs .100 · DHCP</Note>
          <Note x={1000} y={360}>Lo0 1.1.1.1</Note>
          <Note x={1500} y={55}>Lo0 2.2.2.1</Note>
          <Note x={2000} y={360}>Lo0 3.3.3.1</Note>
          <Note x={1500} y={565}>Lo0 4.4.4.1</Note>
          <Note x={760} y={215}>default route →</Note>
          <Note x={2240} y={330}>← default route</Note>

          {/* centre: what this lab is about */}
          <Note x={1500} y={700} size={20}>OSPF 100 · Area 0 · 200.10.XX.0/24</Note>
          <Note x={1500} y={745}>R1 R2 R3 R4 in a diamond, CEs are not in OSPF</Note>
          <Note x={1500} y={775}>CEs: default route to the core + PAT on the link address</Note>
          <Note x={1500} y={805}>Each CE is the DHCP server of its own branch</Note>

          {/* VLAN / subnet labels beside every VPC */}
          {BRANCHES.flatMap((br) =>
            br.switches.flatMap((s) =>
              s.hosts.map((h, i) => (
                <Note key={`t-${h}`} x={br.cx + NOTE_SLOT[i][0]} y={s.y + NOTE_SLOT[i][1]}>
                  {`VLAN ${VLANS[i][0]} · DHCP ${net(br, VLANS[i][0])}.x`}
                </Note>
              )),
            ),
          )}

          {/* ── devices ── */}
          {ROUTERS.map((r) => (
            <Router key={r.id} id={r.id} x={r.x} y={r.y} ports={r.ports.map(fullName)} />
          ))}
          {ALL_SWITCHES.map(({ br, s }) => (
            <Switch key={s.id} id={s.id} x={br.cx} y={s.y} ports={s.ports.map(fullName)} />
          ))}
          {BRANCHES.flatMap((br) =>
            br.switches.flatMap((s) =>
              s.hosts.map((h, i) => (
                <VPC key={`v-${h}`} id={h} x={br.cx + HOST_SLOT[i][0]} y={s.y + HOST_SLOT[i][1]} />
              )),
            ),
          )}
        </NetLab>
      </div>

      <details className="ccna-lab__panel" style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Create VLANs <code>10</code> (HR), <code>20</code> (IT), <code>30</code> (Marketing) and <code>40</code>{" "}
            (Management) on <strong>all six switches</strong> (SW1, SW2, SW3, MLS1, SW4, SW5).
          </li>
          <li>
            Put every VPC-facing port in its VLAN with <code>switchport mode access</code> and{" "}
            <code>switchport access vlan X</code>.
          </li>
          <li>
            Build the LACP bundles: SW1–SW2 and SW2–SW3 in BR_BLR, MLS1–SW4 and SW4–SW5 in BR_US. Use{" "}
            <code>channel-group N mode active</code> on the upper device and <code>mode passive</code> on the lower one, then
            configure the trunk only on <code>interface port-channel N</code>. Make SW1 <code>e2/0</code> a trunk to RBLR.
          </li>
          <li>
            Address the diamond core: a <code>loopback 0</code> on R1 1.1.1.1, R2 2.2.2.1, R3 3.3.3.1 and R4 4.4.4.1 (all /32),
            and the six links <code>200.10.N.0/24</code> from the table. On MLS1 the port to R3 is a routed port:{" "}
            <code>no switchport</code> first, then <code>ip address</code>.
          </li>
          <li>
            Run OSPF process <code>100</code>, area <code>0</code>, on R1, R2, R3 and R4 only. Advertise{" "}
            <code>200.10.0.0 0.0.255.255</code> and the loopback. RBLR and MLS1 do <strong>not</strong> run OSPF.
          </li>
          <li>
            Verify the core with <code>show ip ospf neighbor</code> (two neighbours on each of R1, R2, R3, R4) and{" "}
            <code>show ip route ospf</code>: every core router must know all loopbacks and links 1 to 6.
          </li>
          <li>
            Configure the gateways. On RBLR, sub-interfaces <code>e0/0.10</code> to <code>.40</code> with{" "}
            <code>encapsulation dot1Q X</code> and <code>192.168.X.100</code>. On MLS1, <code>ip routing</code> and SVIs{" "}
            <code>interface vlan X</code> with <code>10.10.X.100</code>.
          </li>
          <li>
            Make each CE the DHCP server of its branch: exclude the four <code>.100</code> gateways, then create four pools (
            <code>BR_BLR_VLAN10</code> … <code>BR_US_VLAN40</code>) with <code>network</code>, <code>default-router</code>,{" "}
            <code>dns-server</code>, <code>domain-name</code> and <code>lease 2 0</code>.
          </li>
          <li>
            Add a default route on each CE: <code>ip route 0.0.0.0 0.0.0.0 200.10.5.1</code> on RBLR and{" "}
            <code>200.10.6.1</code> on MLS1. Check with <code>show ip route</code> and <code>ping 4.4.4.1</code> from the CE.
          </li>
          <li>
            Configure NAT on both CEs: <code>ip nat inside</code> on every sub-interface or SVI,{" "}
            <code>ip nat outside</code> on the core-facing port, <code>access-list 1</code> for the branch, and{" "}
            <code>ip nat inside source list 1 interface &lt;outside port&gt; overload</code>.
          </li>
          <li>
            On all 24 VPCs type <code>ip dhcp</code> and confirm with <code>show ip</code>: an address of its VLAN, the
            gateway <code>.100</code> and the DNS server.
          </li>
          <li>
            Test across the core: from VPC1 and VPC13 ping every loopback (<code>1.1.1.1</code> … <code>4.4.4.1</code>) and the
            far CE link address (<code>200.10.6.2</code> from BR_BLR, <code>200.10.5.2</code> from BR_US). Read{" "}
            <code>show ip nat translations</code> and <code>show ip nat statistics</code> on the CE. Then ping VPC1 → VPC13:
            it fails on purpose, because private addresses are hidden behind NAT and the core has no route to them.
          </li>
          <li>
            Break something on purpose: <code>shutdown</code> R1 <code>e0/1</code> (link 1). OSPF reconverges through R4 and R3
            and the loopback pings still work. Restore it. Then remove the default route from RBLR and watch the VPCs of
            BR_BLR lose the core. Restore it.
          </li>
          <li>
            Save with <code>copy running-config startup-config</code> on every device and test <code>reload</code>.
          </li>
        </ol>
      </details>

      <details className="ccna-lab__panel" style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What the network should look like</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            The core is four routers in a diamond running OSPF 100 in area 0. The two CE devices are customers of the core, so
            they do not join OSPF: each one sends everything it does not know to the core with a{" "}
            <strong>default route</strong>, and translates (PAT) its private subnets to the address of its core-facing
            interface (<code>200.10.5.2</code> on RBLR, <code>200.10.6.2</code> on MLS1). Because those two link subnets are
            inside <code>200.10.0.0/16</code>, OSPF already carries them everywhere, so replies find their way back. The
            private subnets <code>192.168.X.0</code> and <code>10.10.X.0</code> are never seen in the core. Each CE also holds
            the DHCP pools of its own branch, so a client broadcast is answered by its own gateway and no relay is needed.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Link</th>
                  <th style={CELL}>Network</th>
                  <th style={CELL}>Side A</th>
                  <th style={CELL}>Side B</th>
                </tr>
              </thead>
              <tbody>
                {CORE.map((k) => (
                  <tr key={k.n} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{k.n}</td>
                    <td style={{ ...CELL, font: MONO }}>{`200.10.${k.n}.0/24`}</td>
                    <td style={{ ...CELL, font: MONO }}>{`${k.a} ${k.ap} · 200.10.${k.n}.${k.aHost}`}</td>
                    <td style={{ ...CELL, font: MONO }}>{`${k.b} ${k.bp} · 200.10.${k.n}.${k.bHost}`}</td>
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
                  <th style={CELL}>BR_BLR (gateway RBLR e0/0.X)</th>
                  <th style={CELL}>BR_US (gateway MLS1 Vlan X)</th>
                </tr>
              </thead>
              <tbody>
                {VLANS.map(([v, name], i) => (
                  <tr key={v} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{`${v} · ${name}`}</td>
                    <td style={CELL}>
                      <span style={{ font: MONO }}>{`${net(BLR, v)}.0/24 · gw .${BLR.gw}`}</span>
                      <br />
                      {BLR.switches.map((s) => s.hosts[i]).join(" · ")}
                    </td>
                    <td style={CELL}>
                      <span style={{ font: MONO }}>{`${net(US, v)}.0/24 · gw .${US.gw}`}</span>
                      <br />
                      {US.switches.map((s) => s.hosts[i]).join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: <code>show ip ospf neighbor</code> shows two FULL neighbours on each of R1, R2, R3 and R4 and none on the
            CEs. <code>show ip route</code> on a CE shows <code>S*  0.0.0.0/0</code>. <code>ping 4.4.4.1</code> from any VPC
            works and <code>show ip nat translations</code> on the CE lists the VPC address translated to the link address.{" "}
            <code>ping 10.10.10.x</code> from BR_BLR fails by design. <code>show etherchannel summary</code> shows all four
            members of every bundle flagged <code>P</code>.
          </p>
        </div>
      </details>

      <details className="ccna-lab__panel" style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
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

export default NatOspfDiamondLab;