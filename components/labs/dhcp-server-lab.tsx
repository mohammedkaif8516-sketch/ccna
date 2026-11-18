"use client";

/**
 * BSOFT · DHCP server labs (two labs in ONE file), converted from the interactive DhcpServerConfig walkthrough.
 *
 *  Lab 1  BSOFT_ROAS  192.168.XX.0/24, gateway .1 → R1 (router-on-a-stick) is gateway AND DHCP server.
 *  Lab 2  BSOFT_SVI   10.10.XX.0/24,   gateway .1 → MLS1 (Layer 3 switch, SVIs) is gateway AND DHCP server.
 *
 * Both labs: Sales (VLAN 10), HR (VLAN 20), IT (VLAN 30), two VPCs each, one trunk (e0/0 on both ends) between the
 * gateway device and the access switch. Lease times differ per department (2 days / 1 day / 8 hours).
 * Each lab starts with a static, non-clickable reference image of the topology, then the real simulator.
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable / Note from netsim.tsx, plus Router, Switch and VPC components.
 * MLS1 uses the Switch component: it must run a Layer 3 switch image (ip routing, interface vlan).
 * Device ids are unique across both labs because the "netlab:run" event is global.
 */
import { NetLab, Cable, Note } from "@/components/simulator/netsim";
import Router from "@/components/simulator/Router";
import Switch from "@/components/simulator/Switch";
import VPC from "@/components/simulator/VPC";

import { useState } from "react";
import { Copy, Check, Play } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = { padding: "6px 10px", textAlign: "left", verticalAlign: "top" };

const DNS = "8.8.8.8";
const DOMAIN = "bsoft.com";

const GREEN = "#2f9e44";
const AMBER = "#f08c00";

/* ───────────────────────── data model ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "switch" | "router" | "pc"; lines: Line[] };
const L = (cmd: string, note?: string): Line => ({ cmd, note });

type Dept = { vlan: number; name: string; color: string; lease: string; leaseText: string };
const DEPTS: Dept[] = [
  { vlan: 10, name: "Sales", color: "#1c7ed6", lease: "lease 2 0", leaseText: "2 days" },
  { vlan: 20, name: "HR", color: "#d6336c", lease: "lease 1", leaseText: "1 day" },
  { vlan: 30, name: "IT", color: "#0c8599", lease: "lease 0 8", leaseText: "8 hours" },
];

/** access ports on the access switch, in host order (two hosts per department) */
const ACCESS = ["e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2"];
const PORTS8 = ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3"];
const TRUNK = "e0/0";
const fullName = (p: string) => "Ethernet" + p.slice(1);
const deptOf = (i: number) => DEPTS[Math.floor(i / 2)];

type Lab = {
  id: string;
  site: string;
  title: string;
  base: string; // "192.168." or "10.10."
  gw: number; // last octet of the gateway
  kind: "router" | "mls";
  gwId: string; // R1 or MLS1
  swId: string; // access switch
  hosts: string[]; // 6 hosts
  gwOwner: (v: number) => string;
  objectives: React.ReactNode[];
  explain: React.ReactNode;
  expected: React.ReactNode;
};

const net = (lab: Lab, v: number) => `${lab.base}${v}`; // "192.168.10"

/* ───────────────────────── the two labs ───────────────────────── */

const ROAS: Lab = {
  id: "roas",
  site: "BSOFT · Router-on-a-Stick",
  title: "BSOFT · Router-on-a-Stick + DHCP",
  base: "192.168.",
  gw: 1,
  kind: "router",
  gwId: "R1",
  swId: "SW1",
  hosts: ["VPC1", "VPC2", "VPC3", "VPC4", "VPC5", "VPC6"],
  gwOwner: (v) => `R1 e0/0.${v}`,
  objectives: [
    <>On SW1 create VLANs <code>10</code> (Sales), <code>20</code> (HR) and <code>30</code> (IT).</>,
    <>Put each VPC port in its VLAN with <code>switchport mode access</code> and <code>switchport access vlan X</code>: <code>e0/1</code>, <code>e0/2</code> → VLAN 10, <code>e0/3</code>, <code>e1/0</code> → VLAN 20, <code>e1/1</code>, <code>e1/2</code> → VLAN 30.</>,
    <>Make SW1 <code>e0/0</code> a trunk to R1 (<code>switchport trunk encapsulation dot1q</code> first, then <code>switchport mode trunk</code>). One cable carries all three VLANs.</>,
    <>On R1 bring up <code>e0/0</code> (no IP address) and create the sub-interfaces <code>e0/0.10</code>, <code>e0/0.20</code>, <code>e0/0.30</code>, each with <code>encapsulation dot1Q X</code> and the gateway <code>192.168.X.1 255.255.255.0</code>.</>,
    <>Exclude <code>.1</code> to <code>.10</code> of every network with <code>ip dhcp excluded-address</code> <strong>before</strong> creating the pools.</>,
    <>Create one pool per VLAN (<code>VLAN10</code>, <code>VLAN20</code>, <code>VLAN30</code>) with <code>network</code>, <code>default-router</code>, <code>dns-server</code>, <code>domain-name</code> and a lease: Sales <code>lease 2 0</code>, HR <code>lease 1</code>, IT <code>lease 0 8</code>.</>,
    <>On every VPC type <code>ip dhcp</code>, then confirm with <code>show ip</code>. Each VPC must have an address of its own VLAN (starting at <code>.11</code>) and the gateway <code>.1</code>.</>,
    <>Verify on R1 with <code>show ip dhcp pool</code>, <code>show ip dhcp binding</code>, <code>show ip dhcp conflict</code>, <code>show ip dhcp server statistics</code> and <code>show ip interface brief</code>. On SW1 use <code>show vlan brief</code> and <code>show interfaces trunk</code>.</>,
    <>Test the gateway (<code>ping 192.168.10.1</code> from VPC1), same-VLAN pings (VPC1 → VPC2) and different-VLAN pings (VPC1 → VPC3). Run <code>trace</code> and read the first hop (<code>.1</code>).</>,
    <>Break something: <code>shutdown</code> R1 <code>e0/0.20</code>, run <code>ip dhcp</code> again on VPC3 (it no longer gets an address), then restore it. Also try moving a VPC port into the wrong VLAN and see which pool it gets.</>,
    <>Save with <code>write memory</code> (or <code>copy running-config startup-config</code>) and test <code>reload</code>.</>,
  ],
  explain: (
    <>
      R1 has one physical port to SW1, split into three sub-interfaces. Each sub-interface is the gateway (<code>.1</code>) of
      its VLAN and also the place where DHCP requests arrive: a VPC broadcasts a DHCP Discover, SW1 keeps it inside the VLAN
      and sends a tagged copy up the trunk, and R1 answers from the pool whose <code>network</code> matches the sub-interface
      it came in on. The DHCP server is on the same segment as the clients, so no <code>ip helper-address</code> is needed.
      Addresses <code>.1</code> to <code>.10</code> are excluded so the gateway, servers and printers keep fixed addresses.
    </>
  ),
  expected: (
    <>
      <code>show ip dhcp binding</code> on R1 lists six leases, for example 192.168.10.11 and .12 for the Sales VPCs.{" "}
      <code>show ip interface brief</code> lists three sub-interfaces up/up. <code>trace 192.168.20.11</code> from VPC1 shows
      192.168.10.1 as hop 1.
    </>
  ),
};

const SVI: Lab = {
  id: "svi",
  site: "BSOFT · MLS with SVIs",
  title: "BSOFT · MLS with SVIs + DHCP",
  base: "10.10.",
  gw: 1,
  kind: "mls",
  gwId: "MLS1",
  swId: "SW2",
  hosts: ["VPC7", "VPC8", "VPC9", "VPC10", "VPC11", "VPC12"],
  gwOwner: (v) => `MLS1 interface Vlan${v}`,
  objectives: [
    <>On <strong>both</strong> MLS1 and SW2 create VLANs <code>10</code> (Sales), <code>20</code> (HR) and <code>30</code> (IT).</>,
    <>On SW2 put each VPC port in its VLAN with <code>switchport mode access</code> and <code>switchport access vlan X</code>: <code>e0/1</code>, <code>e0/2</code> → VLAN 10, <code>e0/3</code>, <code>e1/0</code> → VLAN 20, <code>e1/1</code>, <code>e1/2</code> → VLAN 30.</>,
    <>Make <code>e0/0</code> a trunk on <strong>both</strong> MLS1 and SW2 (<code>switchport trunk encapsulation dot1q</code> first, then <code>switchport mode trunk</code>).</>,
    <>Enable routing on MLS1 with <code>ip routing</code>, then create an SVI for each VLAN: <code>interface vlan X</code>, <code>ip address 10.10.X.1 255.255.255.0</code>, <code>no shutdown</code>. No sub-interfaces and no router are needed.</>,
    <>Exclude <code>.1</code> to <code>.10</code> of every network with <code>ip dhcp excluded-address</code> <strong>before</strong> creating the pools.</>,
    <>Create one pool per VLAN on MLS1 with <code>network</code>, <code>default-router 10.10.X.1</code>, <code>dns-server</code>, <code>domain-name</code> and a lease: Sales <code>lease 2 0</code>, HR <code>lease 1</code>, IT <code>lease 0 8</code>. The pool commands are exactly the same as on a router.</>,
    <>On every VPC type <code>ip dhcp</code> and confirm with <code>show ip</code>: an address of its VLAN (starting at <code>.11</code>) and the gateway <code>.1</code>.</>,
    <>Verify on MLS1 with <code>show ip interface brief</code>, <code>show ip route</code>, <code>show ip dhcp pool</code>, <code>show ip dhcp binding</code> and <code>show interfaces trunk</code>. On SW2 use <code>show vlan brief</code>.</>,
    <>Test the gateway (<code>ping 10.10.10.1</code> from VPC7), same-VLAN pings (VPC7 → VPC8) and different-VLAN pings (VPC7 → VPC9). Run <code>trace</code>: hop 1 is the <code>.1</code> SVI.</>,
    <>Break something: <code>shutdown</code> <code>interface vlan 20</code> on MLS1, run <code>ip dhcp</code> on VPC9 (no address, no gateway) and restore it. Then remove VLAN 30 from the trunk's allowed list and see what happens to the IT hosts.</>,
    <>Save with <code>write memory</code> (or <code>copy running-config startup-config</code>) and test <code>reload</code>.</>,
  ],
  explain: (
    <>
      MLS1 is a Layer 3 switch. Each SVI (<code>interface vlan X</code>) is a virtual router interface inside VLAN X with the
      gateway address <code>.1</code>. With <code>ip routing</code> enabled, MLS1 routes between the SVIs, so there are no
      sub-interfaces and no extra router. DHCP works the same way as on a router: the Discover arrives in VLAN X and the pool
      whose <code>network</code> matches the SVI answers. An SVI is only up/up if the VLAN exists and at least one port in
      that VLAN is up, which is true here because the trunk to SW2 carries the VLAN.
    </>
  ),
  expected: (
    <>
      <code>show ip interface brief</code> on MLS1 shows Vlan10, Vlan20 and Vlan30 up/up with their <code>.1</code> addresses.{" "}
      <code>show ip dhcp binding</code> lists six leases, for example 10.10.10.11 and .12 for the Sales VPCs.{" "}
      <code>trace 10.10.20.11</code> from VPC7 shows 10.10.10.1 as hop 1.
    </>
  ),
};

/* ───────────────────────── answer key builder ───────────────────────── */

function dhcpLines(lab: Lab): Line[] {
  const out: Line[] = [];
  DEPTS.forEach((d, i) =>
    out.push(
      L(
        `ip dhcp excluded-address ${net(lab, d.vlan)}.1 ${net(lab, d.vlan)}.10`,
        i === 0 ? "keep .1 to .10 for fixed devices (do this BEFORE the pools)" : undefined,
      ),
    ),
  );
  for (const d of DEPTS) {
    out.push(L(`ip dhcp pool VLAN${d.vlan}`, `${d.name} · step 1: create the pool`));
    out.push(L(` network ${net(lab, d.vlan)}.0 255.255.255.0`, "step 2: network"));
    out.push(L(` default-router ${net(lab, d.vlan)}.${lab.gw}`, "step 3: gateway"));
    out.push(L(` dns-server ${DNS}`, "step 4: DNS"));
    out.push(L(` domain-name ${DOMAIN}`, "step 5: domain"));
    out.push(L(` ${d.lease}`, `step 6: ${d.leaseText}`));
  }
  return out;
}

function vlanLines(): Line[] {
  const lines: Line[] = [];
  for (const d of DEPTS) {
    lines.push(L(`vlan ${d.vlan}`));
    lines.push(L(` name ${d.name.toUpperCase()}`));
  }
  return lines;
}

function trunkLines(peer: string): Line[] {
  return [
    L(`interface ${TRUNK}`, `trunk to ${peer}`),
    L(" switchport trunk encapsulation dot1q", "IOL needs this before 'mode trunk'"),
    L(" switchport mode trunk"),
    L(" switchport trunk allowed vlan 10,20,30"),
    L(" no shutdown"),
  ];
}

function buildKey(lab: Lab): KeyDevice[] {
  const key: KeyDevice[] = [];

  if (lab.kind === "router") {
    const lines: Line[] = [L(`interface ${TRUNK}`, "physical port: no IP address"), L(" no shutdown")];
    for (const d of DEPTS) {
      lines.push(L(`interface ${TRUNK}.${d.vlan}`, `${d.name} gateway`));
      lines.push(L(` encapsulation dot1Q ${d.vlan}`));
      lines.push(L(` ip address ${net(lab, d.vlan)}.${lab.gw} 255.255.255.0`));
      lines.push(L(" no shutdown"));
    }
    lines.push(...dhcpLines(lab));
    key.push({ id: lab.gwId, kind: "router", lines });
  } else {
    const lines: Line[] = [...vlanLines(), L("ip routing", "turns the switch into a router")];
    lines.push(...trunkLines(lab.swId));
    for (const d of DEPTS) {
      lines.push(L(`interface vlan ${d.vlan}`, `${d.name} gateway (SVI)`));
      lines.push(L(` ip address ${net(lab, d.vlan)}.${lab.gw} 255.255.255.0`));
      lines.push(L(" no shutdown"));
    }
    lines.push(...dhcpLines(lab));
    key.push({ id: lab.gwId, kind: "switch", lines });
  }

  // access switch
  const sw: Line[] = [...vlanLines()];
  ACCESS.forEach((port, i) => {
    const d = deptOf(i);
    sw.push(L(`interface ${port}`, `${lab.hosts[i]} · VLAN ${d.vlan} (${d.name})`));
    sw.push(L(" switchport mode access"));
    sw.push(L(` switchport access vlan ${d.vlan}`));
    sw.push(L(" no shutdown"));
  });
  sw.push(...trunkLines(lab.gwId));
  key.push({ id: lab.swId, kind: "switch", lines: sw });

  for (const h of lab.hosts)
    key.push({ id: h, kind: "pc", lines: [L("ip dhcp", "gets address, mask, gateway and DNS")] });

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
  const color = first === "interface" || first === "vlan" || isPool ? "var(--primary)" : BLUE.has(first) ? "var(--accent)" : "inherit";
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
      className="group flex items-center rounded-md px-2 py-[3px] cursor-pointer transition-colors hover:bg-primary/10"
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
        <span onClick={() => setOpen((o) => !o)} style={{ flex: 1, cursor: "pointer", userSelect: "none" }}>
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

/* ───────────────────────── static topology image (not clickable) ───────────────────────── */

type IconKind = "pc" | "switch" | "router" | "mls";

function Icon({ kind, stroke, w }: { kind: IconKind; stroke: string; w: number }) {
  const p = { stroke, strokeWidth: w, className: "fill-background" };
  if (kind === "pc")
    return (
      <g>
        <rect x={-32} y={-30} width={64} height={42} rx={4} {...p} />
        <rect x={-26} y={-24} width={52} height={30} rx={2} fill="currentColor" fillOpacity={0.12} />
        <path d="M-18 -15 l6 5 -6 5 M-6 -4 h10" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" />
        <rect x={-6} y={12} width={12} height={8} {...p} />
        <rect x={-20} y={20} width={40} height={5} rx={2} {...p} />
      </g>
    );
  if (kind === "switch" || kind === "mls")
    return (
      <g>
        <rect x={-46} y={-16} width={92} height={32} rx={5} {...p} />
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={i}>
            <rect x={-38 + i * 10} y={-4} width={7} height={9} rx={1} fill="currentColor" fillOpacity={0.55} />
            <circle cx={-34.5 + i * 10} cy={-9} r={1.6} fill={GREEN} />
          </g>
        ))}
        {kind === "mls" && (
          <text x={46} y={-20} textAnchor="end" fontSize={11} fontWeight={700} fill={AMBER}>
            L3
          </text>
        )}
      </g>
    );
  return (
    <g>
      <path d="M-38 -12 V14 A38 12 0 0 0 38 14 V-12" {...p} />
      <ellipse cx={0} cy={-12} rx={38} ry={12} {...p} />
      <path
        d="M-16 -15 H16 M10 -20 L16 -15 L10 -10 M16 -9 H-16 M-10 -14 L-16 -9 L-10 -4"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

const IMG_GW = { x: 420, y: 75 };
const IMG_SW = { x: 420, y: 245 };
const IMG_PC_X = [100, 230, 380, 510, 645, 775];
const IMG_PC_Y = 410;
const IMG_BANDS = [
  { x: 30, w: 270 },
  { x: 310, w: 270 },
  { x: 590, w: 240 },
];
const RADIUS: Record<IconKind, number> = { pc: 40, switch: 34, router: 40, mls: 34 };

function seg(a: { x: number; y: number }, ar: number, b: { x: number; y: number }, br: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return { x0: a.x + ux * ar, y0: a.y + uy * ar, x1: b.x - ux * br, y1: b.y - uy * br };
}

/** Reference picture of the lab. Purely visual: no handlers, no pointer events. */
function TopologyImage({ lab }: { lab: Lab }) {
  const gwKind: IconKind = lab.kind === "router" ? "router" : "mls";
  const trunk = seg(IMG_GW, RADIUS[gwKind], IMG_SW, RADIUS.switch);
  const halo = { paintOrder: "stroke" as const, strokeWidth: 3, strokeLinejoin: "round" as const };

  return (
    <div
      className="rounded-xl border bg-background p-3"
      style={{ pointerEvents: "none", userSelect: "none" }}
      aria-hidden={false}
    >
      <svg
        viewBox="0 0 840 510"
        className="mx-auto w-full max-w-[880px]"
        role="img"
        aria-label={`${lab.gwId} connected by a trunk to ${lab.swId}, with six VPCs in Sales, HR and IT VLANs`}
      >
        {/* department bands */}
        {DEPTS.map((d, i) => {
          const b = IMG_BANDS[i];
          return (
            <g key={d.vlan}>
              <rect x={b.x} y={335} width={b.w} height={160} rx={12} fill={d.color} fillOpacity={0.07} stroke={d.color} strokeOpacity={0.6} strokeDasharray="5 4" />
              <text x={b.x + b.w / 2} y={486} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace" fontWeight={600} fill={d.color}>
                {d.name} · VLAN {d.vlan} · {net(lab, d.vlan)}.0/24
              </text>
            </g>
          );
        })}

        {/* trunk */}
        <line x1={trunk.x0} y1={trunk.y0} x2={trunk.x1} y2={trunk.y1} stroke="currentColor" strokeOpacity={0.55} strokeWidth={4} />
        <text x={430} y={132} fontSize={10} fontFamily="ui-monospace, monospace" className="fill-foreground">{TRUNK}</text>
        <text x={430} y={206} fontSize={10} fontFamily="ui-monospace, monospace" className="fill-foreground">{TRUNK}</text>
        <text x={412} y={168} textAnchor="end" fontSize={11} fontFamily="ui-monospace, monospace" fontWeight={700} fill={AMBER}>
          TRUNK · VLAN 10,20,30
        </text>

        {/* host cables + port labels */}
        {IMG_PC_X.map((x, i) => {
          const s = seg(IMG_SW, RADIUS.switch, { x, y: IMG_PC_Y }, RADIUS.pc);
          return (
            <g key={i}>
              <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1} stroke="currentColor" strokeOpacity={0.45} strokeWidth={2} />
              <text
                x={s.x1 + (s.x0 - s.x1) * 0.2}
                y={s.y1 + (s.y0 - s.y1) * 0.2}
                textAnchor="middle"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                className="fill-foreground stroke-background"
                style={halo}
              >
                {ACCESS[i]}
              </text>
            </g>
          );
        })}

        {/* gateway interfaces */}
        {DEPTS.map((d, i) => (
          <text key={d.vlan} x={490} y={62 + i * 18} fontSize={11} fontFamily="ui-monospace, monospace" fontWeight={600} fill={d.color}>
            {lab.kind === "router" ? `${TRUNK}.${d.vlan}` : `Vlan${d.vlan}`} {net(lab, d.vlan)}.{lab.gw}
          </text>
        ))}

        {/* gateway device */}
        <g transform={`translate(${IMG_GW.x} ${IMG_GW.y})`}>
          <Icon kind={gwKind} stroke={GREEN} w={3.5} />
        </g>
        <text x={IMG_GW.x - 58} y={IMG_GW.y - 8} textAnchor="end" fontSize={14} fontWeight={600} className="fill-foreground">
          {lab.gwId}
        </text>
        <text x={IMG_GW.x - 58} y={IMG_GW.y + 8} textAnchor="end" fontSize={11} fontFamily="ui-monospace, monospace" className="fill-foreground">
          {lab.kind === "router" ? "router-on-a-stick" : "ip routing · SVIs"}
        </text>
        <text x={IMG_GW.x - 58} y={IMG_GW.y + 26} textAnchor="end" fontSize={12} fontWeight={700} fill={GREEN}>
          ✓ DHCP server · gateway .{lab.gw}
        </text>

        {/* access switch */}
        <g transform={`translate(${IMG_SW.x} ${IMG_SW.y})`}>
          <Icon kind="switch" stroke="currentColor" w={2.2} />
        </g>
        <text x={IMG_SW.x + 58} y={IMG_SW.y + 5} fontSize={14} fontWeight={600} className="fill-foreground">
          {lab.swId}
        </text>

        {/* hosts */}
        {IMG_PC_X.map((x, i) => (
          <g key={i}>
            <g transform={`translate(${x} ${IMG_PC_Y})`}>
              <Icon kind="pc" stroke="currentColor" w={2.2} />
            </g>
            <text x={x} y={IMG_PC_Y + 44} textAnchor="middle" fontSize={13} fontWeight={600} className="fill-foreground">
              {lab.hosts[i]}
            </text>
            <text x={x} y={IMG_PC_Y + 60} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace" className="fill-foreground" opacity={0.6}>
              ip dhcp
            </text>
          </g>
        ))}
      </svg>
      <p style={{ margin: "6px 0 0", font: "11px/1.4 ui-sans-serif,system-ui", opacity: 0.6, textAlign: "center" }}>
        Reference diagram (not interactive). Build it in the simulator below.
      </p>
    </div>
  );
}

/* ───────────────────────── shared explanation panels ───────────────────────── */

const DORA_ROWS: string[][] = [
  ["D · Discover", "Broadcast", "68 → 67", "0.0.0.0 → 255.255.255.255", "client MAC → FFFF.FFFF.FFFF"],
  ["O · Offer", "To client MAC", "67 → 68", "gateway IP → 255.255.255.255", "gateway MAC → client MAC"],
  ["R · Request", "Broadcast", "68 → 67", "0.0.0.0 → 255.255.255.255", "client MAC → FFFF.FFFF.FFFF"],
  ["A · Acknowledgment", "To client MAC", "67 → 68", "gateway IP → 255.255.255.255", "gateway MAC → client MAC"],
];

function DoraPanel() {
  return (
    <details className="ccna-lab__panel" style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>How DHCP works (D-O-R-A)</summary>
      <div style={{ marginTop: 8 }}>
        <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
          A VPC with no IP has to broadcast. The gateway device sees the Discover on the interface of the client's VLAN
          and picks the first free address (after the excluded range) from the pool whose network matches.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 560 }}>
            <thead>
              <tr style={{ background: "rgba(128,128,128,.12)" }}>
                <th style={CELL}>Message</th>
                <th style={CELL}>Cast</th>
                <th style={CELL}>UDP ports</th>
                <th style={CELL}>IP</th>
                <th style={CELL}>MAC</th>
              </tr>
            </thead>
            <tbody>
              {DORA_ROWS.map((r) => (
                <tr key={r[0]} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                  {r.map((c, i) => (
                    <td key={i} style={i === 0 ? { ...CELL, fontWeight: 600 } : { ...CELL, font: MONO }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

function TroubleshootPanel({ lab }: { lab: Lab }) {
  return (
    <details className="ccna-lab__panel" style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>Why a VPC gets no IP</summary>
      <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
        <li>You forgot to type <code>ip dhcp</code> on that VPC (VPCS never asks by itself).</li>
        <li>
          The trunk is down or <code>no shutdown</code> is missing, so {lab.gwId} never sees the Discover. Check{" "}
          <code>show interfaces trunk</code>.
        </li>
        <li>The VPC port is in the wrong VLAN, so it gets the wrong pool (or none). Check <code>show vlan brief</code>.</li>
        <li>
          The pool <code>network</code> does not match the {lab.kind === "router" ? "sub-interface" : "SVI"} network, so{" "}
          {lab.gwId} cannot pick the pool.
        </li>
        {lab.kind === "mls" && (
          <li>
            <code>ip routing</code> is missing, or the VLAN does not exist on {lab.gwId}, so the SVI stays down.
          </li>
        )}
        <li>The pool is full, or the excluded range removed too many addresses.</li>
      </ul>
    </details>
  );
}

/* ───────────────────────── one lab (generic view) ───────────────────────── */

const HOST_X = [100, 260, 420, 580, 740, 900];
const GW_POS = { x: 500, y: 80 };
const SW_POS = { x: 500, y: 330 };
const HOST_Y = 620;

function LabView({ lab }: { lab: Lab }) {
  const key = buildKey(lab);
  const vlanRows = DEPTS.map((d, i) => ({
    d,
    hosts: `${lab.hosts[i * 2]} · ${lab.hosts[i * 2 + 1]}`,
    ports: `${ACCESS[i * 2]}, ${ACCESS[i * 2 + 1]}`,
  }));

  return (
    <div className="ccna-lab" style={{ display: "grid", gap: 14, maxWidth: "100%", gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      {/* static reference image */}
      <TopologyImage lab={lab} />

      <div style={{ overflowX: "clip" }}>
        <NetLab title={lab.title} width={1000} height={780}>
          <Note x={500} y={25} size={22}>{lab.site}</Note>

          {/* gateway ↔ access switch: one trunk */}
          <Cable a={`${lab.gwId}:${TRUNK}`} b={`${lab.swId}:${TRUNK}`} />

          {/* host cables */}
          {lab.hosts.map((h, i) => (
            <Cable key={`h-${h}`} a={`${lab.swId}:${ACCESS[i]}`} b={`${h}:eth0`} />
          ))}

          {/* labels: beside the cables, never on them */}
          <Note x={680} y={(GW_POS.y + SW_POS.y) / 2}>Trunk · VLAN 10,20,30 · dot1q</Note>
          {lab.kind === "router" ? (
            <Note x={740} y={45}>{lab.gwId} · DHCP server · gateway .{lab.gw}</Note>
          ) : (
            <Note x={740} y={45}>{lab.gwId} · SVIs .{lab.gw} · DHCP server</Note>
          )}
          {DEPTS.map((d, i) => (
            <Note key={`n-${d.vlan}`} x={(HOST_X[i * 2] + HOST_X[i * 2 + 1]) / 2} y={HOST_Y + 95}>
              {`${d.name} · VLAN ${d.vlan} · DHCP ${net(lab, d.vlan)}.x`}
            </Note>
          ))}

          {/* devices */}
          {lab.kind === "router" ? (
            <Router id={lab.gwId} x={GW_POS.x} y={GW_POS.y} ports={[fullName(TRUNK)]} />
          ) : (
            <Switch id={lab.gwId} x={GW_POS.x} y={GW_POS.y} ports={PORTS8.map(fullName)} />
          )}
          <Switch id={lab.swId} x={SW_POS.x} y={SW_POS.y} ports={PORTS8.map(fullName)} />
          {lab.hosts.map((h, i) => (
            <VPC key={`v-${h}`} id={h} x={HOST_X[i]} y={HOST_Y} />
          ))}
        </NetLab>
      </div>

      <details className="ccna-lab__panel" style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          {lab.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ol>
      </details>

      <details className="ccna-lab__panel" style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What the network should look like</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>{lab.explain}</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 560 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>VLAN</th>
                  <th style={CELL}>Subnet</th>
                  <th style={CELL}>Gateway</th>
                  <th style={CELL}>Excluded</th>
                  <th style={CELL}>Lease</th>
                  <th style={CELL}>Hosts (ports)</th>
                </tr>
              </thead>
              <tbody>
                {vlanRows.map(({ d, hosts, ports }) => (
                  <tr key={d.vlan} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{`${d.vlan} · ${d.name}`}</td>
                    <td style={{ ...CELL, font: MONO }}>{`${net(lab, d.vlan)}.0/24`}</td>
                    <td style={{ ...CELL, font: MONO }}>{`${net(lab, d.vlan)}.${lab.gw} (${lab.gwOwner(d.vlan)})`}</td>
                    <td style={{ ...CELL, font: MONO }}>.1 to .10</td>
                    <td style={CELL}>{d.leaseText}</td>
                    <td style={CELL}>{`${hosts} (${ports})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: <code>show interfaces trunk</code> lists <code>e0/0</code> as trunking with VLANs 10,20,30 allowed and
            forwarding. {lab.expected}
          </p>
        </div>
      </details>

      <DoraPanel />
      <TroubleshootPanel lab={lab} />

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

/* ───────────────────────── exports ───────────────────────── */

export function BsoftRoasLab() {
  return <LabView lab={ROAS} />;
}

export function BsoftSviLab() {
  return <LabView lab={SVI} />;
}

const COMPARE: string[][] = [
  ["Gateway device", "R1 (router)", "MLS1 (Layer 3 switch)"],
  ["Gateway interface", "Sub-interface e0/0.X + encapsulation dot1Q X", "SVI: interface vlan X (needs ip routing)"],
  ["VLANs on the gateway device", "Not created (the tag comes from the trunk)", "Must be created on MLS1 too"],
  ["Trunk e0/0 on the gateway side", "Router port, no trunk command (sub-interfaces)", "switchport trunk … on MLS1 e0/0"],
  ["DHCP pool commands", "Same", "Same"],
];

/** Both labs, one after the other. */
export function DhcpServerLabs() {
  const H2: React.CSSProperties = { font: "600 18px ui-sans-serif,system-ui", margin: "0 0 10px" };
  return (
    <div className="ccna-lab" style={{ display: "grid", gap: 48, width: "100%" }}>
      <section>
        <h2 style={H2}>BSOFT · 192.168.XX.0/24 · gateway .1 · Router-on-a-Stick + DHCP</h2>
        <BsoftRoasLab />
      </section>
      <section>
        <h2 style={H2}>BSOFT · 10.10.XX.0/24 · gateway .1 · MLS (SVI) + DHCP</h2>
        <BsoftSviLab />
      </section>
      <section>
        <h2 style={H2}>Router-on-a-stick vs SVI</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 560 }}>
            <thead>
              <tr style={{ background: "rgba(128,128,128,.12)" }}>
                <th style={CELL}></th>
                <th style={CELL}>Router-on-a-stick</th>
                <th style={CELL}>MLS with SVIs</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r[0]} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                  {r.map((c, i) => (
                    <td key={i} style={i === 0 ? { ...CELL, fontWeight: 600 } : CELL}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DhcpServerLabs;