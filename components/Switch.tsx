/**
 * Switch.tsx — a clickable Cisco-style Layer-2 switch with a working IOS CLI.
 *
 *   <Switch id="SW4" x={150} y={300} />                 // Ethernet0/0 … 0/3, all up, VLAN 1, DTP auto
 *
 * CLI: everything the router has for modes/help/history/saving/remote-access, plus
 *      vlan <n> / name, switchport mode access|trunk|dynamic, access vlan, trunk allowed/native,
 *      nonegotiate, interface range, interface vlan <n> (management SVI) + ip default-gateway,
 *      show vlan brief, show mac address-table (learned from real traffic), show interfaces trunk /
 *      status / switchport, clear mac address-table.
 */
import {
  type Dev, type Iface, type E, type Ctx, type H, DeviceNode, newDev, preconfigure, registerEngine, useRegister,
  iosShared, iosEngine, userFilter, ensureIf, findIf, ifUp, operMode, parseVlans, rangeStr, vlanAllowed, isIp, isMask, maskLen,
  macOf, shortIf, fakeHash,
} from "./netsim";

export function SwitchIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 64 40" aria-hidden>
      <path d="M6 14 14 5h44l-6 9z" fill="#4a5d6e" /><rect x="6" y="14" width="46" height="20" fill="#2b3a47" /><path d="M52 14 58 5v20l-6 9z" fill="#394a58" />
      <g stroke="#e9f1f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M14 20h28M38 16l4 4-4 4M14 28h28M18 24l-4 4 4 4" />
      </g>
    </svg>
  );
}

const physical = (d: Dev) => Object.keys(d.ifaces).filter((n) => !n.startsWith("Vlan"));

/* ───────────── running-config ───────────── */
export function renderSwitch(d: Dev): string[] {
  const L = ["!", "version 15.2", "no service password-encryption", "!", `hostname ${d.hostname}`, "!"];
  if (d.sec.enable) L.push(d.sec.enableType === "password" ? `enable password ${d.sec.enable}` : `enable secret 5 ${fakeHash(d.sec.enable)}`, "!");
  if (!d.sec.lookup) L.push("no ip domain-lookup");
  if (d.sec.domain) L.push(`ip domain-name ${d.sec.domain}`);
  for (const u of d.sec.users) L.push(`username ${u.name} secret 5 ${fakeHash(u.pw)}`);
  L.push("!", "spanning-tree mode rapid-pvst", "!");
  for (const [v, n] of Object.entries(d.vlans)) if (+v !== 1) L.push(`vlan ${v}`, ` name ${n}`, "!");
  for (const [n, i] of Object.entries(d.ifaces)) {
    L.push(`interface ${n}`);
    if (i.desc) L.push(` description ${i.desc}`);
    if (n.startsWith("Vlan")) L.push(i.ip ? ` ip address ${i.ip} ${i.mask}` : " no ip address");
    else {
      if (i.mode === "trunk") L.push(" switchport trunk encapsulation dot1q");
      if (i.native && i.native !== 1) L.push(` switchport trunk native vlan ${i.native}`);
      if (i.allowed && i.allowed !== "all") L.push(` switchport trunk allowed vlan ${i.allowed}`);
      if (i.vlan && i.vlan !== 1) L.push(` switchport access vlan ${i.vlan}`);
      if (i.mode === "trunk" || i.mode === "access") L.push(` switchport mode ${i.mode}`);
      else if (i.mode === "desirable") L.push(" switchport mode dynamic desirable");
      if (i.nonegotiate) L.push(" switchport nonegotiate");
    }
    if (i.shut) L.push(" shutdown");
    L.push("!");
  }
  if (d.gw) L.push(`ip default-gateway ${d.gw}`, "!");
  if (d.sec.banner) L.push(`banner motd ^C${d.sec.banner}^C`, "!");
  const s = d.sec;
  L.push("line con 0", ...(s.con.pw ? [` password ${s.con.pw}`] : []), ...(s.con.login ? [" login"] : []), "line vty 0 4",
    ...(s.vty.pw ? [` password ${s.vty.pw}`] : []), ...(s.vty.login === "pw" ? [" login"] : s.vty.login === "local" ? [" login local"] : []), ` transport input ${s.vty.transport}`, "!", "end");
  return L;
}

/* ───────────── show commands ───────────── */
const portsIn = (c: Ctx, vlan: number) => physical(c.dev).filter((n) => operMode(c.view(), c.dev.id, n) === "access" && (c.dev.ifaces[n].vlan ?? 1) === vlan).map(shortIf).join(", ");
const showVlan: H = (c) => {
  const L = ["VLAN Name                             Status    Ports", "---- -------------------------------- --------- -------------------------------"];
  for (const [v, n] of Object.entries(c.dev.vlans).sort((a, b) => +a[0] - +b[0])) L.push(`${v.padEnd(5)}${n.padEnd(33)}${"active".padEnd(10)}${portsIn(c, +v)}`);
  for (const [v, n] of [[1002, "fddi-default"], [1003, "token-ring-default"], [1004, "fddinet-default"], [1005, "trnet-default"]]) L.push(`${String(v).padEnd(5)}${String(n).padEnd(33)}act/unsup`);
  c.out(...L);
};
const showMac: H = (c, a) => {
  const vf = a[0] ? +a[0] : undefined, rows = c.dev.macTable.filter((e) => vf === undefined || e.vlan === vf);
  c.out("          Mac Address Table", "-------------------------------------------", "", "Vlan    Mac Address       Type        Ports", "----    -----------       --------    -----",
    ...rows.map((e) => `${String(e.vlan).padStart(4)}    ${e.mac}    DYNAMIC     ${shortIf(e.port)}`), `Total Mac Addresses for this criterion: ${rows.length}`);
};
const showTrunk: H = (c) => {
  const v = c.view(), tr = physical(c.dev).filter((n) => ifUp(v, c.dev.id, n) && operMode(v, c.dev.id, n) === "trunk");
  if (!tr.length) return;
  const act = Object.keys(c.dev.vlans).map(Number);
  const L = ["Port        Mode             Encapsulation  Status        Native vlan"];
  tr.forEach((n) => { const i = c.dev.ifaces[n]; L.push(`${shortIf(n).padEnd(12)}${(i.mode === "trunk" ? "on" : i.mode ?? "auto").padEnd(17)}${"802.1q".padEnd(15)}${"trunking".padEnd(14)}${i.native ?? 1}`); });
  L.push("", "Port        Vlans allowed on trunk"); tr.forEach((n) => L.push(`${shortIf(n).padEnd(12)}${c.dev.ifaces[n].allowed ?? "1-4094"}`));
  L.push("", "Port        Vlans allowed and active in management domain");
  tr.forEach((n) => L.push(`${shortIf(n).padEnd(12)}${rangeStr(act.filter((x) => vlanAllowed(c.dev.ifaces[n].allowed, x)))}`));
  c.out(...L);
};
const showStatus: H = (c) => {
  const v = c.view(), L = ["Port      Name               Status       Vlan       Duplex  Speed Type"];
  physical(c.dev).forEach((n) => {
    const i = c.dev.ifaces[n], up = ifUp(v, c.dev.id, n), tr = operMode(v, c.dev.id, n) === "trunk";
    L.push(`${shortIf(n).padEnd(10)}${(i.desc ?? "").slice(0, 18).padEnd(19)}${(i.shut ? "disabled" : up ? "connected" : "notconnect").padEnd(13)}${(tr ? "trunk" : String(i.vlan ?? 1)).padEnd(11)}auto    auto  10/100BaseTX`);
  });
  c.out(...L);
};
const showSwitchport: H = (c, a) => {
  const n = findIf(c.dev, a[0]); if (!n || n.startsWith("Vlan")) return c.bad(2);
  const i = c.dev.ifaces[n], v = c.view(), tr = operMode(v, c.dev.id, n) === "trunk";
  c.out(`Name: ${shortIf(n)}`, "Switchport: Enabled", `Administrative Mode: ${i.mode === "trunk" ? "trunk" : i.mode === "access" ? "static access" : `dynamic ${i.mode ?? "auto"}`}`,
    `Operational Mode: ${ifUp(v, c.dev.id, n) ? (tr ? "trunk" : "static access") : "down"}`, `Negotiation of Trunking: ${i.nonegotiate ? "Off" : "On"}`,
    `Access Mode VLAN: ${i.vlan ?? 1} (${c.dev.vlans[i.vlan ?? 1] ?? "inactive"})`, `Trunking Native Mode VLAN: ${i.native ?? 1}`, `Trunking VLANs Enabled: ${i.allowed === undefined ? "ALL" : i.allowed}`);
};
const showBrief: H = (c) => {
  const v = c.view(), L = ["Interface                  IP-Address      OK? Method Status                Protocol"];
  for (const [n, i] of Object.entries(c.dev.ifaces)) {
    const up = ifUp(v, c.dev.id, n), st = i.shut ? "administratively down" : up ? "up" : "down";
    L.push(`${n.padEnd(27)}${(i.ip ?? "unassigned").padEnd(16)}YES ${(i.ip ? "manual" : "unset").padEnd(7)}${st.padEnd(22)}${up ? "up" : "down"}`);
  }
  c.out(...L);
};

/* ───────────── config commands ───────────── */
const each = (c: Ctx, fn: (i: Iface, n: string) => void) => c.cli.ifs!.forEach((n) => fn(c.dev.ifaces[n], n));
const needL2 = (c: Ctx) => { if (c.cli.ifs!.some((n) => n.startsWith("Vlan"))) { c.out("% Invalid input detected at '^' marker (not a switchport)."); return true; } return false; };
const ensureVlan = (c: Ctx, v: number) => { if (!c.dev.vlans[v]) { c.dev.vlans[v] = `VLAN${String(v).padStart(4, "0")}`; return true; } return false; };

function ranger(c: Ctx, spec: string): string[] | undefined {
  const out: string[] = [];
  for (const part of spec.split(",").map((p) => p.trim()).filter(Boolean)) {
    const m = /^(\S+?)\s*-\s*(\S+)$/.exec(part.replace(/\s*-\s*/, "-"));
    if (!m) { const n = findIf(c.dev, part); if (!n) return; out.push(n); continue; }
    const first = findIf(c.dev, m[1]); if (!first) return;
    const pre = first.replace(/\d+$/, ""), from = +/\d+$/.exec(first)![0];
    const to = /^\d+$/.test(m[2]) ? +m[2] : +/\d+$/.exec(findIf(c.dev, m[2]) ?? "")?.[0]!;
    if (!(to >= from)) return;
    for (let k = from; k <= to; k++) { const n = pre + k; if (!c.dev.ifaces[n]) return; out.push(n); }
  }
  return out.length ? out : undefined;
}

const globalX: E[] = [
  ["interface <if>", (c, a) => { const n = ensureIf(c.dev, a[0]); if (!n) return c.bad(1); c.cli.mode = "config-if"; c.cli.ifs = [n]; }, "Select an interface to configure"],
  ["interface <fam> <num>", (c, a) => { const n = ensureIf(c.dev, a[0] + a[1]); if (!n) return c.bad(1); c.cli.mode = "config-if"; c.cli.ifs = [n]; }, "e.g. interface vlan 10"],
  ["interface range <*>", (c, a) => { const r = ranger(c, a[0].replace(/^range\s*/i, "")); if (!r) return c.bad(2); c.cli.mode = "config-if"; c.cli.ifs = r; }, "Configure several interfaces at once (e0/1 - 3)"],
  ["no interface <if>", (c, a) => { const n = findIf(c.dev, a[0]); if (n?.startsWith("Vlan")) delete c.dev.ifaces[n]; else c.out("% Only SVIs can be deleted"); }],
  ["vlan <id>", (c, a) => {
    const v = +a[0]; if (!(v >= 1 && v <= 4094)) return c.bad(1);
    ensureVlan(c, v); c.cli.mode = "config-vlan"; c.cli.vlan = v;
  }, "VLAN commands"],
  ["no vlan <id>", (c, a) => { const v = +a[0]; if (v === 1 || (v >= 1002 && v <= 1005)) return c.out("%Default VLAN 1 may not be deleted."); delete c.dev.vlans[v]; }, "Delete a VLAN"],
  ["ip default-gateway <ip>", (c, a) => { if (!isIp(a[0])) return c.bad(2); c.dev.gw = a[0]; }, "Management default gateway"],
  ["no ip default-gateway", (c) => { c.dev.gw = undefined; }],
  ["spanning-tree <*>", () => {}], ["vtp <*>", () => {}], ["no vtp <*>", () => {}],
];
const vlanX: E[] = [
  ["name <name>", (c, a) => { c.dev.vlans[c.cli.vlan!] = a[0]; }, "Set the VLAN name"], ["state <*>", () => {}], ["no name", (c) => { c.dev.vlans[c.cli.vlan!] = `VLAN${String(c.cli.vlan).padStart(4, "0")}`; }],
];
const ifX: E[] = [
  ["switchport", () => {}, "Set switching mode characteristics"],
  ["switchport mode access", (c) => needL2(c) || each(c, (i) => { i.mode = "access"; }), "Set trunking mode to ACCESS unconditionally"],
  ["switchport mode trunk", (c) => needL2(c) || each(c, (i) => { i.mode = "trunk"; }), "Set trunking mode to TRUNK unconditionally"],
  ["switchport mode dynamic auto", (c) => needL2(c) || each(c, (i) => { i.mode = "auto"; }), "Trunk if the neighbour asks (passive DTP)"],
  ["switchport mode dynamic desirable", (c) => needL2(c) || each(c, (i) => { i.mode = "desirable"; }), "Actively ask the neighbour to trunk"],
  ["switchport nonegotiate", (c) => needL2(c) || each(c, (i) => { i.nonegotiate = true; }), "Disable DTP frames"],
  ["no switchport nonegotiate", (c) => each(c, (i) => { i.nonegotiate = false; })],
  ["switchport access vlan <id>", (c, a) => {
    const v = +a[0]; if (!(v >= 1 && v <= 4094)) return c.bad(3); if (needL2(c)) return;
    if (ensureVlan(c, v)) c.out(`% Access VLAN does not exist. Creating vlan ${v}`);
    each(c, (i) => { i.vlan = v; });
  }, "Set VLAN when interface is in access mode"],
  ["switchport trunk encapsulation <*>", () => {}, "dot1q (the only option here)"],
  ["switchport trunk native vlan <id>", (c, a) => { if (!(+a[0] >= 1 && +a[0] <= 4094)) return c.bad(4); each(c, (i) => { i.native = +a[0]; }); }, "Untagged VLAN on this trunk"],
  ["switchport trunk allowed vlan <*>", (c, a) => {
    const w = a[0].split(" "), op = w[0]?.toLowerCase(), list = w.slice(1).join("");
    const cur = (i: Iface) => (!i.allowed || i.allowed === "all" ? parseVlans("1-4094") : i.allowed === "none" ? [] : parseVlans(i.allowed));
    if (!w.length) return c.out("% Incomplete command.");
    each(c, (i) => {
      if (op === "all") i.allowed = undefined;
      else if (op === "none") i.allowed = "none";
      else if (op === "add") i.allowed = rangeStr([...cur(i), ...parseVlans(list)]);
      else if (op === "remove") i.allowed = rangeStr(cur(i).filter((x) => !parseVlans(list).includes(x)));
      else if (op === "except") i.allowed = rangeStr(parseVlans("1-4094").filter((x) => !parseVlans(list).includes(x)));
      else i.allowed = rangeStr(parseVlans(w.join("")));
    });
  }, "Allowed VLANs: 10,20 | add | remove | except | all | none"],
  ["ip address <ip> <mask>", (c, a) => {
    if (!c.cli.ifs![0].startsWith("Vlan")) return c.out("% Invalid input: this is a Layer-2 port (use an SVI: interface vlan 1)");
    if (!isIp(a[0])) return c.bad(2); if (!isMask(a[1])) return c.bad(3);
    c.dev.ifaces[c.cli.ifs![0]].ip = a[0]; c.dev.ifaces[c.cli.ifs![0]].mask = a[1];
  }, "Management IP address on an SVI"],
  ["no ip address", (c) => each(c, (i) => { i.ip = i.mask = undefined; })],
];

const sh = iosShared(renderSwitch);
const privX: E[] = [
  ["show vlan", showVlan, "VTP VLAN status"], ["show vlan brief", showVlan, "VTP all VLAN status in brief"],
  ["show mac address-table", showMac, "MAC forwarding table"], ["show mac address-table vlan <id>", showMac],
  ["show mac-address-table", showMac, "MAC forwarding table"],
  ["clear mac address-table dynamic", (c) => { c.dev.macTable = []; }, "Flush the dynamic entries"],
  ["show interfaces trunk", showTrunk, "Interface trunk information"], ["show interfaces status", showStatus, "Line status of interfaces"],
  ["show interfaces <if> switchport", (c, a) => showSwitchport(c, [a[0]]), "Switchport settings"],
  ["show ip interface brief", showBrief, "Brief IP status"],
  ["show spanning-tree", (c) => c.out("(spanning-tree is not simulated in this lab — no loops in the topology)")],
];
const priv = [...sh.priv, ...privX];
export const switchTables = (m: string): E[] => {
  switch (m) {
    case "user": return [...userFilter(priv), ...sh.user];
    case "priv": return [...priv, ...sh.user.filter((e) => e[0] !== "enable")];
    case "config": return [...globalX, ...sh.global];
    case "config-if": return [...ifX, ...sh.ifc, ...globalX, ...sh.global];
    case "config-line": return [...sh.line, ...globalX, ...sh.global];
    case "config-vlan": return [...vlanX, ...globalX, ...sh.global];
    default: return [];
  }
};
export const switchEngine = iosEngine(switchTables, renderSwitch);
registerEngine("switch", switchEngine);

/* ───────────── component ───────────── */
export interface SwitchProps {
  id: string; x: number; y: number;
  /** number of Ethernet0/N ports (default 4) or explicit names */
  ports?: number | string[];
  label?: string;
  init?: (d: Dev) => void;
}
export function makeSwitch({ id, x, y, ports = 4, label, init }: SwitchProps): Dev {
  const names = Array.isArray(ports) ? ports : Array.from({ length: ports }, (_, i) => `Ethernet0/${i}`);
  const ifaces: Record<string, Iface> = Object.fromEntries(names.map((n) => [n, { shut: false }]));
  ifaces.Vlan1 = { shut: true };
  const h = label ?? id;
  return preconfigure(newDev("switch", id, x, y, h, ifaces, [`${h} — Layer-2 switch. All ports are up in VLAN 1 (DTP auto). Type ? for help.`, ""]), init);
}
export default function Switch(p: SwitchProps) {
  useRegister(() => makeSwitch(p));
  return <DeviceNode id={p.id} icon={<SwitchIcon />} />;
}
void maskLen; void macOf;