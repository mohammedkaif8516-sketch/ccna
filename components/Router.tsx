/**
 * Router.tsx — a clickable Cisco-style router with a working IOS CLI.
 *
 *   <Router id="R1" x={150} y={130} />                         // Ethernet0/0 … 0/3, all shutdown (factory default)
 *   <Router id="R2" x={440} y={130} ports={4} label="HQ" init={(d) => { … }} />
 *
 * CLI: user/priv/config/config-if/config-line modes, `?`, Tab, ↑/↓ history, abbreviations,
 *      ip address, no shutdown, ip route (next-hop / exit-if / Null0 / floating AD), loopbacks,
 *      dot1q sub-interfaces, show ip route / int brief / run / start, copy run start, reload,
 *      enable secret, line con/vty, telnet & ssh, ping & traceroute that follow the real tables.
 */
import {
  type Dev, type Iface, type E, type Ctx, type H, DeviceNode, newDev, preconfigure, registerEngine, useRegister,
  iosShared, iosEngine, userFilter, ensureIf, findIf, ifUp, routeTable, isIp, isMask, maskLen, lenMask, netOf, bcastOf,
  macOf, fakeHash, shortIf, classLen, ip2n,
} from "./netsim";

/* ───────────── icon ───────────── */
export function RouterIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.78} viewBox="0 0 64 50" aria-hidden>
      <ellipse cx="32" cy="38" rx="27" ry="9" fill="#2b3a47" /><rect x="5" y="16" width="54" height="22" fill="#2b3a47" />
      <ellipse cx="32" cy="16" rx="27" ry="10" fill="#4a5d6e" />
      <g stroke="#e9f1f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M32 9v14M25.5 13 32 8.5 38.5 13M25.5 19 32 23.5 38.5 19" /><path d="M20 16h24M24 11.5 19.5 16 24 20.5M40 11.5 44.5 16 40 20.5" />
      </g>
    </svg>
  );
}

/* ───────────── show helpers ───────────── */
const NAT = (ip: string) => classLen(ip);
const cisIpErr = (c: Ctx, i: number, msg?: string) => (msg ? c.out(msg) : c.bad(i));

function showRoute(c: Ctx, filter?: string) {
  const d = c.dev, rows = routeTable(c.view(), d).filter((r) => !filter || (filter === "static" ? r.t === "S" : filter === "connected" ? r.t === "C" : true));
  const gw = rows.find((r) => r.t === "S" && r.len === 0 && r.net === "0.0.0.0");
  const L = [
    "Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP", "       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area",
    "       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2", "       E1 - OSPF external type 1, E2 - OSPF external type 2",
    "       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2", "       ia - IS-IS inter area, * - candidate default, U - per-user static route",
    "       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP", "       + - replicated route, % - next hop override", "",
    gw ? `Gateway of last resort is ${gw.via ?? "0.0.0.0"} to network 0.0.0.0` : "Gateway of last resort is not set", "",
  ];
  const groups = new Map<string, typeof rows>();
  for (const r of rows) { const k = r.len === 0 ? "default" : netOf(r.net, lenMask(NAT(r.net))); groups.set(k, [...(groups.get(k) ?? []), r]); }
  const line = (r: (typeof rows)[0], indent: boolean) => {
    const code = (r.t + (r.t === "S" && r.len === 0 ? "*" : "")).padEnd(indent ? 9 : 6), p = `${r.net}/${r.len}`;
    if (r.t === "C" || r.t === "L") return `${code}${p} is directly connected, ${r.iface}`;
    if (r.exit) return `${code}${p} is directly connected, ${r.iface}`;
    return `${code}${p} [${r.ad}/0] via ${r.via}`;
  };
  [...groups.entries()].sort((a, b) => ip2n(a[0] === "default" ? "0.0.0.0" : a[0]) - ip2n(b[0] === "default" ? "0.0.0.0" : b[0])).forEach(([k, g]) => {
    g.sort((a, b) => ip2n(a.net) - ip2n(b.net) || a.len - b.len);
    if (k === "default") return g.forEach((r) => L.push(line(r, false)));
    const masks = new Set(g.map((r) => r.len)), nat = NAT(g[0].net), natural = g.length === 1 && g[0].len === nat;
    if (!natural) L.push(masks.size > 1 ? `      ${k}/${nat} is variably subnetted, ${g.length} subnets, ${masks.size} masks` : `      ${k}/${[...masks][0]} is subnetted, ${g.length} subnets`);
    g.forEach((r) => L.push(line(r, !natural)));
  });
  c.out(...L);
}
const showBrief: H = (c) => {
  const L = ["Interface                  IP-Address      OK? Method Status                Protocol"], v = c.view();
  for (const [n, i] of Object.entries(c.dev.ifaces)) {
    const up = ifUp(v, c.dev.id, n), st = i.shut ? "administratively down" : up ? "up" : "down";
    L.push(`${n.padEnd(27)}${(i.ip ?? "unassigned").padEnd(16)}YES ${(i.ip ? "manual" : "unset").padEnd(7)}${st.padEnd(22)}${up ? "up" : "down"}`);
  }
  c.out(...L);
};
const showIf = (c: Ctx, name?: string) => {
  const v = c.view();
  const names = name ? [findIf(c.dev, name)].filter(Boolean) as string[] : Object.keys(c.dev.ifaces);
  if (name && !names.length) return c.bad(2);
  for (const n of names) {
    const i = c.dev.ifaces[n], up = ifUp(v, c.dev.id, n);
    c.out(`${n} is ${i.shut ? "administratively down" : up ? "up" : "down"}, line protocol is ${up ? "up" : "down"}`,
      `  Hardware is AmdP2, address is ${macOf(c.dev.id, n)} (bia ${macOf(c.dev.id, n)})`, ...(i.desc ? [`  Description: ${i.desc}`] : []),
      i.ip ? `  Internet address is ${i.ip}/${maskLen(i.mask!)}` : "  No Internet address", "  MTU 1500 bytes, BW 10000 Kbit/sec, DLY 1000 usec,",
      "     reliability 255/255, txload 1/255, rxload 1/255", `  Encapsulation ${i.enc ? `802.1Q Virtual LAN, Vlan ID ${i.enc}` : "ARPA"}, loopback not set`, "");
  }
};
const showRouteArg: H = (c, a) => {
  const x = a[0].toLowerCase();
  if (isIp(a[0])) {
    const r = routeTable(c.view(), c.dev).filter((q) => q.t !== "L").concat(routeTable(c.view(), c.dev).filter((q) => q.t === "L"));
    const b = r.filter((q) => netOf(a[0], lenMask(q.len)) === q.net).sort((p, q) => q.len - p.len)[0];
    if (!b) return c.out(`% Network not in table`);
    return c.out(`Routing entry for ${b.net}/${b.len}`, `  Known via "${b.t === "S" ? "static" : b.t === "C" ? "connected" : "local"}", distance ${b.ad}, metric 0`, "  Routing Descriptor Blocks:", `  * ${b.via ?? "directly connected"}, via ${b.iface}`, "      Route metric is 0, traffic share count is 1");
  }
  if ("static".startsWith(x) || "connected".startsWith(x)) return showRoute(c, "static".startsWith(x) ? "static" : "connected");
  c.bad(3);
};

/* ───────────── running-config ───────────── */
export function renderRouter(d: Dev): string[] {
  const L = ["!", "version 15.4", "service timestamps debug datetime msec", "service timestamps log datetime msec", "no service password-encryption", "!", `hostname ${d.hostname}`, "!"];
  if (d.sec.enable) L.push(d.sec.enableType === "password" ? `enable password ${d.sec.enable}` : `enable secret 5 ${fakeHash(d.sec.enable)}`, "!");
  if (!d.sec.lookup) L.push("no ip domain lookup");
  if (d.sec.domain) L.push(`ip domain name ${d.sec.domain}`);
  for (const u of d.sec.users) L.push(`username ${u.name} secret 5 ${fakeHash(u.pw)}`);
  if (d.sec.rsa) L.push("ip ssh version 2");
  L.push("!");
  for (const [n, i] of Object.entries(d.ifaces)) {
    L.push(`interface ${n}`);
    if (i.desc) L.push(` description ${i.desc}`);
    if (i.enc) L.push(` encapsulation dot1q ${i.enc}`);
    L.push(i.ip ? ` ip address ${i.ip} ${i.mask}` : " no ip address");
    if (i.shut) L.push(" shutdown");
    L.push("!");
  }
  for (const r of d.routes) L.push(`ip route ${r.net} ${r.mask} ${r.iface ?? r.nh}${r.ad !== 1 ? " " + r.ad : ""}`);
  L.push("!");
  if (d.sec.banner) L.push(`banner motd ^C${d.sec.banner}^C`, "!");
  const s = d.sec;
  L.push("line con 0", ...(s.con.pw ? [` password ${s.con.pw}`] : []), ...(s.con.login ? [" login"] : []), "line aux 0", "line vty 0 4",
    ...(s.vty.pw ? [` password ${s.vty.pw}`] : []), ...(s.vty.login === "pw" ? [" login"] : s.vty.login === "local" ? [" login local"] : []), ` transport input ${s.vty.transport}`, "!", "end");
  return L;
}

/* ───────────── command tables ───────────── */
const sh = iosShared(renderRouter);

const ifEach = (c: Ctx, fn: (i: Iface, n: string) => void) => c.cli.ifs!.forEach((n) => fn(c.dev.ifaces[n], n));
const setIp: H = (c, a) => {
  const [ip, mask] = a;
  if (!isIp(ip)) return c.bad(2);
  if (!isMask(mask)) return c.bad(3);
  const len = maskLen(mask), net = netOf(ip, mask);
  if (len < 31 && (ip === net || ip === bcastOf(ip, mask))) return c.out(`Bad mask /${len} for address ${ip}`);
  for (const [n, o] of Object.entries(c.dev.ifaces)) {
    if (c.cli.ifs!.includes(n) || !o.ip || !o.mask) continue;
    if (netOf(o.ip, mask) === netOf(ip, mask) || netOf(ip, o.mask) === netOf(o.ip, o.mask)) return c.out(`% ${net} overlaps with ${n}`);
  }
  ifEach(c, (i) => { i.ip = ip; i.mask = mask; });
};
const ipRoute = (c: Ctx, a: string[]) => {
  const [net, mask, nh, adS] = a, ad = adS === undefined ? 1 : +adS;
  if (!isIp(net)) return c.bad(2);
  if (!isMask(mask)) return c.bad(3);
  if (netOf(net, mask) !== net) return c.out("%Inconsistent address and mask");
  const isNull = /^nu(l(l)?)?0$/i.test(nh), ifn = isNull ? "Null0" : isIp(nh) ? undefined : findIf(c.dev, nh);
  if (!isIp(nh) && !ifn) return c.bad(4);
  if (!Number.isInteger(ad) || ad < 1 || ad > 255) return c.bad(5);
  c.dev.routes = c.dev.routes.filter((r) => !(r.net === net && r.mask === mask && (ifn ? r.iface === ifn : r.nh === nh)));
  c.dev.routes.push(ifn ? { net, mask, iface: ifn, ad } : { net, mask, nh, ad });
};
const noRoute = (c: Ctx, a: string[]) => {
  const [net, mask, nh] = a, n0 = c.dev.routes.length, ifn = nh && (/^nu(l(l)?)?0$/i.test(nh) ? "Null0" : findIf(c.dev, nh));
  c.dev.routes = c.dev.routes.filter((r) => !(r.net === net && r.mask === mask && (!nh || (ifn ? r.iface === ifn : r.nh === nh))));
  if (c.dev.routes.length === n0) c.out("%No matching route to delete");
};
const enter: H = (c, a) => {
  const n = ensureIf(c.dev, a[0]);
  if (!n) return c.bad(1);
  c.cli.mode = "config-if"; c.cli.ifs = [n];
};

const privX: E[] = [
  ["show ip route", (c) => showRoute(c), "IP routing table"], ["show ip route <x>", showRouteArg, "Filter: static | connected | address"],
  ["show ip interface brief", showBrief, "Brief summary of IP status"], ["show interfaces", (c) => showIf(c), "Interface status and configuration"], ["show interfaces <if>", (c, a) => showIf(c, a[0])],
  ["show ip protocols", (c) => c.out("*** IP Routing is NSF aware ***", "", "No dynamic routing protocols are running (static routing only)."), "Routing protocol info"],
];
const globalX: E[] = [
  ["interface <if>", enter, "Select an interface to configure"],
  ["interface <fam> <num>", (c, a) => enter(c, [a[0] + a[1]]), "e.g. interface loopback 0"],
  ["no interface <if>", (c, a) => { const n = findIf(c.dev, a[0]); if (n && /^(Loopback|.*\.\d+$)/.test(n)) delete c.dev.ifaces[n]; else c.out("% Only loopbacks and sub-interfaces can be deleted"); }, "Delete a virtual interface"],
  ["ip route <net> <mask> <nh>", ipRoute, "Establish static routes"], ["ip route <net> <mask> <nh> <ad>", ipRoute, "…with administrative distance (floating static)"],
  ["no ip route <net> <mask>", noRoute], ["no ip route <net> <mask> <nh>", noRoute],
  ["ip routing", () => {}], ["ip classless", () => {}], ["no ip cef", () => {}], ["ipv6 <*>", () => {}],
];
const ifX: E[] = [
  ["ip address <ip> <mask>", setIp, "Set the IP address of an interface"],
  ["no ip address", (c) => ifEach(c, (i) => { i.ip = i.mask = undefined; }), "Remove the IP address"],
  ["encapsulation dot1q <vlan>", (c, a) => { if (!c.cli.ifs![0].includes(".")) return c.out("% Encapsulation can only be set on sub-interfaces"); ifEach(c, (i) => { i.enc = +a[0]; }); }, "802.1Q tag for router-on-a-stick"],
  ["shutdown", (c) => { ifEach(c, (i) => { i.shut = true; }); }, "Shutdown the interface"],
  ["no shutdown", (c) => { ifEach(c, (i) => { i.shut = false; }); c.out(`%LINK-5-CHANGED: Interface ${c.cli.ifs![0]}, changed state to up`); }, "Enable the interface"],
  ["no ip route-cache", () => {}], ["ip <*>", () => {}], ["no ip <*>", () => {}],
];

const priv = [...sh.priv, ...privX];
export const routerTables = (m: string): E[] => {
  switch (m) {
    case "user": return [...userFilter(priv), ...sh.user];
    case "priv": return [...priv, ...sh.user.filter((e) => e[0] !== "enable")];
    case "config": return [...globalX, ...sh.global];
    case "config-if": return [...ifX, ...sh.ifc, ...globalX, ...sh.global];
    case "config-line": return [...sh.line, ...globalX, ...sh.global];
    default: return [];
  }
};
export const routerEngine = iosEngine(routerTables, renderRouter);
registerEngine("router", routerEngine);

/* ───────────── component ───────────── */
export interface RouterProps {
  id: string; x: number; y: number;
  /** number of Ethernet0/N ports (default 4) or explicit interface names */
  ports?: number | string[];
  /** display hostname (default = id) */
  label?: string;
  /** pre-configure the device; the result is treated as its saved startup-config */
  init?: (d: Dev) => void;
}
export function makeRouter({ id, x, y, ports = 4, label, init }: RouterProps): Dev {
  const names = Array.isArray(ports) ? ports : Array.from({ length: ports }, (_, i) => `Ethernet0/${i}`);
  const ifaces: Record<string, Iface> = Object.fromEntries(names.map((n) => [n, { shut: true }]));
  const h = label ?? id;
  return preconfigure(newDev("router", id, x, y, h, ifaces, [`${h} — Cisco IOS router. Interfaces start shut down. Type ? for help.`, ""]), init);
}
export default function Router(p: RouterProps) {
  useRegister(() => makeRouter(p));
  return <DeviceNode id={p.id} icon={<RouterIcon />} sub={undefined} />;
}
void shortIf;