"use client";

/**
 * VTP Labs (3 parts in ONE file) — every part uses router-on-a-stick for inter-VLAN routing.
 *
 *  LAB-1  SW1 (server) ─ SW2 (server) ─ SW3 (server)       any server can create / modify / delete VLANs
 *  LAB-2  SW4 (server) ─ SW5 (client) ─ SW6 (client)       clients only listen
 *  LAB-3  SW7 (server) ─ SW8 (transparent) ─ SW9 (client)  transparent: local VLANs, forwards advertisements
 *
 * In each part a router (R1 / R2 / R3) is connected to the first switch with ONE trunk and has one sub-interface
 * per routed VLAN (gateway 192.168.N.254, where N = VLAN / 100). VLANs are NOT typed on every switch: you create
 * them on a server and watch VTP spread them. Host ports are assigned AFTER the VLAN has arrived.
 *
 * Answer-key cards are numbered by stage: 1 VTP + trunks → 2 create VLANs → 3 host ports (→ 4 only in LAB-3).
 * Run the stages in order on all switches.
 *
 * Every device starts in its factory state. Click a device → console. Do the lab for real.
 * Needs NetLab / Cable / Note from netsim.tsx, plus Router, Switch and VPC components.
 * Device ids are unique across the three parts because the "netlab:run" event is global.
 */
import { NetLab, Cable, Note } from "@/components/simulator/netsim";
import Router from "@/components/simulator/Router";
import Switch from "@/components/simulator/Switch"; import VPC from "@/components/simulator/VPC";

import { useState } from "react";
import { Copy, Check, Play } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = {
  padding: "6px 10px",
  textAlign: "left",
  verticalAlign: "top",
};

const DOMAIN = "BSOFT";
const PASSWORD = "cisco123";
const UPLINK = "e2/0"; // trunk port of the first switch towards the router

/* ───────────────────────── data model ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = {
  id: string;
  title?: string;
  kind: "switch" | "router" | "pc";
  lines: Line[];
};
const L = (cmd: string, note?: string): Line => ({ cmd, note });

type Role = "server" | "client" | "transparent";
type HostSpec = { id: string; port: string; vlan: number; n: number };
type SwitchSpec = {
  id: string;
  label: string;
  role: Role;
  y: number;
  ports: string[];
  /** VLANs created on this switch in stage 2 */
  creates: number[];
  hosts: HostSpec[];
  /** optional stage 4 card */
  late?: { title: string; lines: Line[] };
};
type Link = { a: string; ap: string; b: string; bp: string };
type Lab = {
  key: string;
  heading: string;
  title: string;
  router: string;
  /** VLANs that get a router sub-interface */
  subs: number[];
  height: number;
  switches: SwitchSpec[];
  links: Link[];
  objectives: React.ReactNode[];
  explain: React.ReactNode;
  expected: React.ReactNode;
};

const VNAME: Record<number, string> = {
  100: "Sales",
  200: "Engineering",
  300: "Finance",
  400: "Support",
  600: "Guests",
  700: "Lab",
};
const net = (v: number) => `192.168.${v / 100}`; // VLAN 100 → 192.168.1, 400 → 192.168.4 …

const PORTS12 = [
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
];
const PORTS8 = PORTS12.slice(0, 8);
const fullName = (p: string) => "Ethernet" + p.slice(1);

// the three switches of every part use the same cabling: SW(a):e1/3 ↔ SW(b):e2/0 and SW(b):e2/3 ↔ SW(c):e1/3
const chain = (a: string, b: string, c: string): Link[] => [
  { a, ap: "e1/3", b, bp: "e2/0" },
  { a: b, ap: "e2/3", b: c, bp: "e1/3" },
];

/* ───────────────────────── the three labs ───────────────────────── */

const LAB1: Lab = {
  key: "lab1",
  heading: "LAB-1 · Three VTP servers",
  title: "VTP Lab 1 · Multi-Server",
  router: "R1",
  subs: [100, 200, 300],
  height: 960,
  switches: [
    {
      id: "SW1",
      label: "VTP Server 1",
      role: "server",
      y: 230,
      ports: PORTS12,
      creates: [100],
      hosts: [
        { id: "VPC1", port: "e0/3", vlan: 100, n: 1 },
        { id: "VPC2", port: "e1/0", vlan: 200, n: 1 },
        { id: "VPC3", port: "e0/0", vlan: 300, n: 1 },
      ],
    },
    {
      id: "SW2",
      label: "VTP Server 2",
      role: "server",
      y: 500,
      ports: PORTS12,
      creates: [200],
      hosts: [
        { id: "VPC4", port: "e0/2", vlan: 100, n: 2 },
        { id: "VPC5", port: "e0/3", vlan: 200, n: 2 },
        { id: "VPC6", port: "e1/0", vlan: 300, n: 2 },
      ],
    },
    {
      id: "SW3",
      label: "VTP Server 3",
      role: "server",
      y: 770,
      ports: PORTS8,
      creates: [300],
      hosts: [
        { id: "VPC7", port: "e0/1", vlan: 100, n: 3 },
        { id: "VPC8", port: "e0/2", vlan: 200, n: 3 },
        { id: "VPC9", port: "e0/3", vlan: 300, n: 3 },
      ],
    },
  ],
  links: chain("SW1", "SW2", "SW3"),
  objectives: [
    <>
      On SW1, SW2 and SW3 configure VTP: <code>vtp domain BSOFT</code>,{" "}
      <code>vtp version 2</code>, <code>vtp password cisco123</code> and{" "}
      <code>vtp mode server</code> (server is the default, type it anyway).
      Every switch needs the <strong>same domain and password</strong>.
    </>,
    <>
      Configure the three trunks (SW1 <code>e2/0</code> to R1, SW1–SW2, SW2–SW3)
      with <code>switchport trunk encapsulation dot1q</code> and{" "}
      <code>switchport mode trunk</code>. Do not limit the allowed VLANs. VTP
      only travels over trunks.
    </>,
    <>
      On R1 bring up <code>e0/0</code> (no IP address) and create the
      sub-interfaces <code>e0/0.100</code>, <code>.200</code> and{" "}
      <code>.300</code> with <code>encapsulation dot1Q X</code> and the gateways{" "}
      <code>192.168.1.254</code>, <code>192.168.2.254</code> and{" "}
      <code>192.168.3.254</code> (/24).
    </>,
    <>
      Run <code>show vtp status</code> and <code>show vtp password</code> on all
      three switches: mode Server, domain BSOFT, configuration revision{" "}
      <code>0</code>, same password. Run <code>show vlan brief</code>: only the
      default VLANs.
    </>,
    <>
      Create <strong>VLAN 100</strong> (Sales) on SW1 only. Run{" "}
      <code>show vlan brief</code> on SW2 and SW3: the VLAN is already there.
      Compare the revision number with <code>show vtp status</code>.
    </>,
    <>
      Create <strong>VLAN 200</strong> (Engineering) on SW2 and{" "}
      <strong>VLAN 300</strong> (Finance) on SW3. Check all three switches:
      VLANs 100, 200 and 300 exist everywhere and the revision number is{" "}
      <strong>the same</strong> on all of them.
    </>,
    <>
      Put the host ports in their VLANs (<code>switchport mode access</code>,{" "}
      <code>switchport access vlan X</code>). This works on every switch because
      the VLANs arrived through VTP.
    </>,
    <>
      Give each VPC its address and the gateway of its VLAN (for example{" "}
      <code>ip 192.168.1.1/24 192.168.1.254</code>).
    </>,
    <>
      Test the same VLAN across switches (<code>VPC1 → VPC4 → VPC7</code>) and
      between VLANs through the router (<code>VPC1 → VPC2</code>,{" "}
      <code>VPC1 → VPC9</code>). Run <code>trace</code> and read the first hop.
    </>,
    <>
      Break something on purpose: on SW1 type <code>no vlan 300</code> (a server
      that did not create it). VLAN 300 disappears from SW2 and SW3 too, and the
      ports of VPC3, VPC6 and VPC9 become inactive. Create it again.
    </>,
    <>
      Save with <code>copy running-config startup-config</code> and test{" "}
      <code>reload</code>. The VLAN database is stored in
      <code> vlan.dat</code> on flash, so the VLANs come back.
    </>,
  ],
  explain: (
    <>
      VTP copies the VLAN database from switch to switch, so you create a VLAN
      once instead of on every switch. It works inside a{" "}
      <strong>VTP domain</strong> (same name and password) and only over trunks.
      Every change to the VLAN database increases the{" "}
      <strong>configuration revision number</strong>. A switch accepts an
      advertisement only if it comes from its own domain, passes the password
      check and carries a <strong>higher revision</strong> than its own, and
      then it overwrites its VLAN database. When all switches are in server
      mode, every one of them may create, modify and delete VLANs, and the last
      change wins everywhere. That is convenient and dangerous: a switch with a
      higher revision number overwrites the whole domain, which is why a used
      switch should always be reset to revision 0 before you connect it.
      Router-on-a-stick is unchanged: R1 is not part of VTP, its sub-interface
      for a VLAN only works once that VLAN exists in the database of SW1.
    </>
  ),
  expected: (
    <>
      <code>show vtp status</code> on all three switches shows mode Server,
      domain BSOFT, the same revision number and{" "}
      <code>Number of existing VLANs: 8</code> (5 default + 100, 200, 300).{" "}
      <code>show ip route</code> on R1 lists three <code>C</code> networks via{" "}
      <code>Ethernet0/0.100</code>, <code>.200</code> and <code>.300</code>.
      Every VPC reaches every other VPC.
    </>
  ),
};

const LAB2: Lab = {
  key: "lab2",
  heading: "LAB-2 · Server and clients",
  title: "VTP Lab 2 · Server + Clients",
  router: "R2",
  subs: [400],
  height: 780,
  switches: [
    {
      id: "SW4",
      label: "VTP Server 1",
      role: "server",
      y: 230,
      ports: PORTS12,
      creates: [400],
      hosts: [{ id: "VPC10", port: "e0/3", vlan: 400, n: 1 }],
    },
    {
      id: "SW5",
      label: "VTP Client 1",
      role: "client",
      y: 420,
      ports: PORTS12,
      creates: [],
      hosts: [{ id: "VPC11", port: "e0/2", vlan: 400, n: 2 }],
    },
    {
      id: "SW6",
      label: "VTP Client 2",
      role: "client",
      y: 610,
      ports: PORTS8,
      creates: [],
      hosts: [{ id: "VPC12", port: "e0/1", vlan: 400, n: 3 }],
    },
  ],
  links: chain("SW4", "SW5", "SW6"),
  objectives: [
    <>
      Configure VTP on all three switches with domain <code>BSOFT</code>,
      version 2 and password <code>cisco123</code>. SW4 is{" "}
      <code>vtp mode server</code>, SW5 and SW6 are <code>vtp mode client</code>
      .
    </>,
    <>
      Configure the trunks (SW4 <code>e2/0</code> to R2, SW4–SW5, SW5–SW6) with{" "}
      <code>switchport trunk encapsulation dot1q</code> and{" "}
      <code>switchport mode trunk</code>.
    </>,
    <>
      On R2 bring up <code>e0/0</code> and create the sub-interface{" "}
      <code>e0/0.400</code> with <code>encapsulation dot1Q 400</code> and{" "}
      <code>192.168.4.254 255.255.255.0</code>.
    </>,
    <>
      Check <code>show vtp status</code> on SW5 and SW6: Operating Mode Client,
      revision <code>0</code>.
    </>,
    <>
      Create <strong>VLAN 400</strong> (Support) on SW4. Run{" "}
      <code>show vlan brief</code> on SW5 and SW6: VLAN 400 is in their
      database, and <code>show vtp status</code> shows the same revision number
      as SW4.
    </>,
    <>
      On SW5 try to create a VLAN (<code>vlan 500</code>) or delete VLAN 400.
      The switch refuses: a client cannot create, modify or delete VLANs, it can
      only listen.
    </>,
    <>
      Put the three host ports in VLAN 400 (<code>switchport mode access</code>,{" "}
      <code>switchport access vlan 400</code>). This works on the clients
      because the VLAN exists in their database.
    </>,
    <>
      Give each VPC an address in 192.168.4.0/24 with the gateway{" "}
      <code>192.168.4.254</code>, then ping across all three switches and the
      gateway. Run <code>trace</code> from VPC12.
    </>,
    <>
      Break something on purpose: on SW6 change the password (
      <code>vtp password wrong</code>), create VLAN 401 on SW4 and see that SW5
      learns it but SW6 does not (MD5 mismatch, its revision does not change).
      Fix the password on SW6.
    </>,
    <>
      On SW4 delete VLAN 400: it disappears from both clients and the host ports
      become inactive. Create it again.
    </>,
    <>
      Save with <code>copy running-config startup-config</code> on every device
      and test <code>reload</code>.
    </>,
  ],
  explain: (
    <>
      The usual design: one or two servers, all other switches are clients. A
      client does not accept local VLAN changes. It listens to the
      advertisements of the server, copies the VLAN database and the revision
      number, and forwards the advertisements to the next switch. Because SW5 is
      a client, it passes the advertisements on to SW6 over the second trunk. A
      client does not store VLANs in the same way as a server, but it can still
      use them: you can put a port into a VLAN that arrived through VTP. If the
      password or the domain does not match, the advertisement is ignored and
      the switch is left with an old database, which is a typical reason for a
      missing VLAN.
    </>
  ),
  expected: (
    <>
      <code>show vtp status</code> on SW5 and SW6 shows Operating Mode Client
      and the same revision number as SW4, with{" "}
      <code>Number of existing VLANs: 6</code>. A <code>vlan 500</code> on a
      client prints a message that VTP VLAN configuration is not allowed in
      client mode. All three VPCs ping each other and 192.168.4.254.
    </>
  ),
};

const LAB3: Lab = {
  key: "lab3",
  heading: "LAB-3 · Transparent in the middle",
  title: "VTP Lab 3 · Transparent",
  router: "R3",
  subs: [600],
  height: 780,
  switches: [
    {
      id: "SW7",
      label: "VTP Server",
      role: "server",
      y: 230,
      ports: PORTS12,
      creates: [600],
      hosts: [{ id: "VPC13", port: "e0/3", vlan: 600, n: 1 }],
    },
    {
      id: "SW8",
      label: "VTP Transparent",
      role: "transparent",
      y: 420,
      ports: PORTS12,
      creates: [700],
      hosts: [
        { id: "VPC14", port: "e0/2", vlan: 700, n: 1 },
        { id: "VPC15", port: "e0/3", vlan: 700, n: 2 },
      ],
      late: {
        title: "SW8 · 4 create VLAN 600 (data path)",
        lines: [
          L(
            "vlan 600",
            "a transparent switch never learns it: create it by hand",
          ),
          L(` name ${VNAME[600]}`),
        ],
      },
    },
    {
      id: "SW9",
      label: "VTP Client",
      role: "client",
      y: 610,
      ports: PORTS8,
      creates: [],
      hosts: [{ id: "VPC16", port: "e0/1", vlan: 600, n: 3 }],
    },
  ],
  links: chain("SW7", "SW8", "SW9"),
  objectives: [
    <>
      Configure VTP with domain <code>BSOFT</code>, version 2 and password{" "}
      <code>cisco123</code> on all three switches. SW7 is{" "}
      <code>vtp mode server</code>, SW8 is <code>vtp mode transparent</code> and
      SW9 is <code>vtp mode client</code>.
    </>,
    <>
      Configure the trunks (SW7 <code>e2/0</code> to R3, SW7–SW8, SW8–SW9). On
      R3 bring up <code>e0/0</code> and create only <code>e0/0.600</code> (
      <code>encapsulation dot1Q 600</code>,{" "}
      <code>192.168.6.254 255.255.255.0</code>). VLAN 700 stays local to SW8 and
      has no gateway.
    </>,
    <>
      Check <code>show vtp status</code>: SW8 shows Operating Mode Transparent
      and revision <code>0</code>.
    </>,
    <>
      Create <strong>VLAN 600</strong> (Guests) on SW7. Check the other two
      switches: it <strong>arrives on SW9</strong>, but it does{" "}
      <strong>not appear on SW8</strong> (<code>show vlan brief</code>). The
      advertisement passed through SW8 without being stored.
    </>,
    <>
      Create <strong>VLAN 700</strong> (Lab) locally on SW8. It exists only
      there: SW7 and SW9 do not get it. Check that the revision number of SW8 is
      still <code>0</code> and that SW7 and SW9 did not change.
    </>,
    <>
      Put the host ports in their VLANs (VPC13 and VPC16 in VLAN 600, VPC14 and
      VPC15 in VLAN 700) and give the VPCs their addresses. VPC13 and VPC16 use
      the gateway <code>192.168.6.254</code>, the VLAN 700 hosts have no
      gateway.
    </>,
    <>
      Ping <code>VPC14 → VPC15</code>: it works, VLAN 700 lives on SW8. Then
      ping <code>VPC13 → VPC16</code> in VLAN 600 and also the gateway from
      VPC16: it <strong>fails</strong>. The VTP advertisement crossed SW8, but
      the data frames of VLAN 600 cannot, because SW8 does not have VLAN 600.
    </>,
    <>
      Create VLAN 600 on SW8 by hand (stage 4). Repeat the pings:{" "}
      <code>VPC13 → VPC16</code> and <code>VPC16 → 192.168.6.254</code> now
      work. A transparent switch must hold every VLAN that has to cross it.
    </>,
    <>
      Break something on purpose: on SW7 type <code>no vlan 600</code>. VLAN 600
      disappears from SW9, but SW8 keeps its own local copy. Create it again on
      SW7.
    </>,
    <>
      Save with <code>copy running-config startup-config</code> and test{" "}
      <code>reload</code>. A transparent switch keeps its VLANs in the running
      configuration, too.
    </>,
  ],
  explain: (
    <>
      In transparent mode a switch keeps its own, local VLAN database and
      ignores the content of VTP advertisements: it does not copy their VLANs,
      it does not send its own, and its revision number stays at 0. It still{" "}
      <strong>forwards</strong> the advertisements it receives on one trunk out
      of its other trunks, so the switches behind it are still part of the
      domain (with VTP version 2 a transparent switch forwards them whatever its
      domain name is, with version 1 only when the domain matches). A VLAN
      created on a transparent switch therefore never leaves it. One thing is
      easy to miss: VTP advertisements travel in VLAN 1, but user traffic is
      tagged with its own VLAN, and a trunk only carries the VLANs that exist on
      the switch. So a VLAN that crosses a transparent switch has to be created
      on it as well, even though it never learns it.
    </>
  ),
  expected: (
    <>
      <code>show vtp status</code> on SW8 shows Transparent mode and revision 0,
      with <code>Number of existing VLANs: 6</code> (5 default + 700), and 7
      after you create VLAN 600. SW7 and SW9 show 6 (5 default + 600) and the
      same revision number. <code>show vlan brief</code> on SW9 lists VLAN 600
      but never VLAN 700.
    </>
  ),
};

const LABS = [LAB1, LAB2, LAB3];

/* ───────────────────────── answer key builder ───────────────────────── */

const ROLE_NOTE: Record<Role, string> = {
  server: "can create, modify and delete VLANs",
  client: "cannot change VLANs, only listens",
  transparent: "local VLANs only, forwards advertisements",
};

function trunkPorts(lab: Lab, s: SwitchSpec): [string, string][] {
  const out: [string, string][] = [];
  if (lab.switches[0].id === s.id)
    out.push([UPLINK, `trunk to ${lab.router} e0/0`]);
  for (const k of lab.links) {
    if (k.a === s.id) out.push([k.ap, `trunk to ${k.b} ${k.bp}`]);
    if (k.b === s.id) out.push([k.bp, `trunk to ${k.a} ${k.ap}`]);
  }
  return out;
}

function buildKey(lab: Lab): KeyDevice[] {
  const key: KeyDevice[] = [];

  // router-on-a-stick
  const r: Line[] = [
    L("interface e0/0", "physical port: no IP address"),
    L(" no shutdown"),
  ];
  for (const v of lab.subs) {
    r.push(L(`interface e0/0.${v}`, `${VNAME[v]} gateway`));
    r.push(L(` encapsulation dot1Q ${v}`));
    r.push(L(` ip address ${net(v)}.254 255.255.255.0`));
    r.push(L(" no shutdown"));
  }
  key.push({ id: lab.router, kind: "router", lines: r });

  // stage 1: VTP + trunks
  for (const s of lab.switches) {
    const lines: Line[] = [
      L(`vtp domain ${DOMAIN}`, "same domain on every switch"),
      L("vtp version 2"),
      L(`vtp password ${PASSWORD}`, "same password on every switch"),
      L(`vtp mode ${s.role}`, ROLE_NOTE[s.role]),
    ];
    for (const [port, note] of trunkPorts(lab, s)) {
      lines.push(L(`interface ${port}`, note));
      lines.push(
        L(
          " switchport trunk encapsulation dot1q",
          "must come first on this switch image",
        ),
      );
      lines.push(L(" switchport mode trunk"));
      lines.push(L(" no shutdown"));
    }
    key.push({
      id: s.id,
      title: `${s.id} · 1 VTP + trunks`,
      kind: "switch",
      lines,
    });
  }

  // stage 2: create the VLANs (the experiment)
  for (const s of lab.switches) {
    if (!s.creates.length) continue;
    const lines: Line[] = [];
    for (const v of s.creates) {
      lines.push(
        L(
          `vlan ${v}`,
          s.role === "transparent"
            ? "stays local: it will not spread"
            : "spreads to the other switches",
        ),
      );
      lines.push(L(` name ${VNAME[v]}`));
    }
    key.push({
      id: s.id,
      title: `${s.id} · 2 create VLAN ${s.creates.join(", ")}`,
      kind: "switch",
      lines,
    });
  }

  // stage 3: host ports (after the VLANs have arrived)
  for (const s of lab.switches) {
    const lines: Line[] = [];
    for (const h of s.hosts) {
      lines.push(L(`interface ${h.port}`, `${h.id} · VLAN ${h.vlan}`));
      lines.push(L(" switchport mode access"));
      lines.push(L(` switchport access vlan ${h.vlan}`));
      lines.push(L(" no shutdown"));
    }
    key.push({
      id: s.id,
      title: `${s.id} · 3 host ports`,
      kind: "switch",
      lines,
    });
  }

  // stage 4: optional
  for (const s of lab.switches)
    if (s.late)
      key.push({
        id: s.id,
        title: s.late.title,
        kind: "switch",
        lines: s.late.lines,
      });

  // hosts
  for (const s of lab.switches)
    for (const h of s.hosts) {
      const gw = lab.subs.includes(h.vlan) ? ` ${net(h.vlan)}.254` : "";
      key.push({
        id: h.id,
        kind: "pc",
        lines: [L(`ip ${net(h.vlan)}.${h.n}/24${gw}`)],
      });
    }

  return key;
}

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(
    new CustomEvent("netlab:run", { detail: { device, commands, config } }),
  );
}

const BLUE = new Set([
  "switchport",
  "no",
  "name",
  "ip",
  "encapsulation",
  "vtp",
]);

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const color =
    first === "interface" || first === "vlan"
      ? "#c084fc"
      : BLUE.has(first)
        ? "#38bdf8"
        : "inherit";
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
      className="group flex flex-wrap items-center rounded-md px-2 py-[3px] cursor-pointer transition-colors hover:bg-sky-500/10"
      style={{
        background: state === "ran" ? "rgba(34,197,94,.18)" : undefined,
        minWidth: 0,
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
            flex: "1 1 120px",
            minWidth: 120,
            overflowWrap: "break-word",
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

function DeviceCard({ device }: { device: KeyDevice }) {
  const [ran, setRan] = useState(false);
  const [open, setOpen] = useState(false); // collapsed by default
  return (
    <div
      style={{
        alignSelf: "start",
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
        <span
          onClick={() => setOpen((o) => !o)}
          style={{ flex: 1, cursor: "pointer", userSelect: "none" }}
        >
          {open ? "▾" : "▸"} {device.title ?? device.id}
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

/* ───────────────────────── one lab (generic view) ───────────────────────── */

// host slots relative to the switch column (cx = 500): [x, dy] and the label slot beside each host
const HOST_SLOT: [number, number][] = [
  [150, -40],
  [150, 100],
  [850, -40],
  [850, 100],
];
const NOTE_SLOT: [number, number][] = [
  [110, -80],
  [110, 60],
  [890, -80],
  [890, 60],
];
const ROUTER_Y = 70;

function LabView({ lab }: { lab: Lab }) {
  const key = buildKey(lab);
  const first = lab.switches[0];
  const yOf = (id: string) => lab.switches.find((s) => s.id === id)!.y;
  const roleRows = lab.switches.map((s) => ({
    id: s.id,
    label: s.label,
    role: s.role,
  }));

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        maxWidth: "100%",
        gridTemplateColumns: "minmax(0, 1fr)",
        width: "100%",
      }}
    >
      <div style={{ overflowX: "clip" }}>
        <NetLab title={lab.title} width={1000} height={lab.height}>
          <Note x={500} y={25} size={22}>
            {lab.title}
          </Note>

          {/* router ↔ first switch, and the switch chain: single trunks */}
          <Cable a={`${lab.router}:e0/0`} b={`${first.id}:${UPLINK}`} />
          {lab.links.map((k, i) => (
            <Cable key={`l${i}`} a={`${k.a}:${k.ap}`} b={`${k.b}:${k.bp}`} />
          ))}

          {/* host cables */}
          {lab.switches.flatMap((s) =>
            s.hosts.map((h) => (
              <Cable
                key={`h-${h.id}`}
                a={`${s.id}:${h.port}`}
                b={`${h.id}:eth0`}
                bTag={`.${h.n}`}
              />
            )),
          )}

          {/* trunk labels */}
          <Note x={640} y={(ROUTER_Y + first.y) / 2}>
            Trunk · dot1q
          </Note>
          {lab.links.map((k, i) => (
            <Note key={`tn${i}`} x={640} y={(yOf(k.a) + yOf(k.b)) / 2}>
              Trunk · dot1q · VTP
            </Note>
          ))}
          <Note x={700} y={50}>
            {`${lab.subs.map((v) => `e0/0.${v}`).join(" · ")} = gateways (.254)`}
          </Note>

          {/* role label beside every switch */}
          {lab.switches.map((s) => (
            <Note
              key={`r-${s.id}`}
              x={710}
              y={s.y + 40}
            >{`${s.label} · ${s.role}`}</Note>
          ))}

          {/* VLAN / IP labels beside every VPC */}
          {lab.switches.flatMap((s) =>
            s.hosts.map((h, i) => (
              <Note
                key={`t-${h.id}`}
                x={NOTE_SLOT[i][0]}
                y={s.y + NOTE_SLOT[i][1]}
              >
                {`VLAN ${h.vlan} · ${net(h.vlan)}.${h.n}`}
              </Note>
            )),
          )}

          {/* devices */}
          <Router
            id={lab.router}
            x={500}
            y={ROUTER_Y}
            ports={["Ethernet0/0"]}
          />
          {lab.switches.map((s) => (
            <Switch
              key={s.id}
              id={s.id}
              x={500}
              y={s.y}
              ports={s.ports.map(fullName)}
            />
          ))}
          {lab.switches.flatMap((s) =>
            s.hosts.map((h, i) => (
              <VPC
                key={`v-${h.id}`}
                id={h.id}
                x={HOST_SLOT[i][0]}
                y={s.y + HOST_SLOT[i][1]}
              />
            )),
          )}
        </NetLab>
      </div>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Objectives
        </summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          {lab.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ol>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          What the network should look like
        </summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>{lab.explain}</p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}
            >
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Switch</th>
                  <th style={CELL}>VTP mode</th>
                  <th style={CELL}>Creates</th>
                  <th style={CELL}>Hosts (VLAN · address)</th>
                </tr>
              </thead>
              <tbody>
                {lab.switches.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}
                  >
                    <td
                      style={{ ...CELL, fontWeight: 600 }}
                    >{`${s.id} (${s.label})`}</td>
                    <td style={CELL}>{s.role}</td>
                    <td style={CELL}>
                      {s.creates.length
                        ? s.creates
                            .map((v) => `VLAN ${v} ${VNAME[v]}`)
                            .join(", ")
                        : "nothing: it only listens"}
                    </td>
                    <td style={{ ...CELL, font: MONO }}>
                      {s.hosts
                        .map(
                          (h) => `${h.id} · ${h.vlan} · ${net(h.vlan)}.${h.n}`,
                        )
                        .join("  |  ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            VTP domain <code>{DOMAIN}</code>, version 2, password{" "}
            <code>{PASSWORD}</code>. Gateways on {lab.router}:{" "}
            {lab.subs.map((v) => `e0/0.${v} = ${net(v)}.254`).join(", ")}.{" "}
            {lab.expected}
          </p>
        </div>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Answer key (run stage 1, then 2, then 3 on all switches; click a line
          to run it, or "Run all" per card)
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
            alignItems: "start",
          }}
        >
          {key.map((d, i) => (
            <DeviceCard key={`${d.id}-${i}`} device={d} />
          ))}
        </div>
      </details>
    </div>
  );
}

/* ───────────────────────── exports ───────────────────────── */

export function VtpLab1() {
  return <LabView lab={LAB1} />;
}
export function VtpLab2() {
  return <LabView lab={LAB2} />;
}
export function VtpLab3() {
  return <LabView lab={LAB3} />;
}

/** All three parts, one after the other. */
export function VtpLabs() {
  const H2: React.CSSProperties = {
    font: "600 18px ui-sans-serif,system-ui",
    margin: "0 0 10px",
  };
  return (
    <div style={{ display: "grid", gap: 48, width: "100%" }}>
      {LABS.map((lab) => (
        <section key={lab.key}>
          <h2 style={H2}>{lab.heading}</h2>
          <LabView lab={lab} />
        </section>
      ))}
    </div>
  );
}

export default VtpLabs;
