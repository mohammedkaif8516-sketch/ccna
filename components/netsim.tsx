/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * netsim.tsx — shared core for every lab.
 *
 *  1. address helpers          5. packet forwarding (route / probe / traceroute)
 *  2. types + per-lab store    6. CLI toolkit (parser, `?`, Tab, prompts, telnet/ssh)
 *  3. topology (links, L2)     7. shared Cisco IOS commands
 *  4. routing table (+ 4b: RIP / EIGRP / OSPF)   8. UI: <NetLab>, <Cable>, <DeviceNode>, <Note>, terminal
 *
 * Router.tsx / Switch.tsx / VPC.tsx import from here and register their CLI engine.
 */
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/* ════════════════════════ 1. address helpers ════════════════════════ */
export const ip2n = (ip: string) =>
  ip.split(".").reduce((a, o) => a * 256 + +o, 0);
export const n2ip = (n: number) =>
  [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
export const isIp = (s?: string): s is string =>
  !!s &&
  /^\d{1,3}(\.\d{1,3}){3}$/.test(s) &&
  s.split(".").every((o) => +o < 256);
export const isMask = (m?: string): m is string =>
  isIp(m) && /^1*0*$/.test(ip2n(m).toString(2).padStart(32, "0"));
export const maskLen = (m: string) =>
  ip2n(m).toString(2).replace(/0/g, "").length;
export const lenMask = (l: number) =>
  n2ip(l === 0 ? 0 : 2 ** 32 - 2 ** (32 - l));
export const netOf = (ip: string, m: string) =>
  n2ip((ip2n(ip) & ip2n(m)) >>> 0);
export const bcastOf = (ip: string, m: string) =>
  n2ip(((ip2n(ip) & ip2n(m)) | ~ip2n(m)) >>> 0);
export const inNet = (ip: string, net: string, m: string) =>
  netOf(ip, m) === net;
export const classLen = (ip: string) =>
  +ip.split(".")[0] < 128 ? 8 : +ip.split(".")[0] < 192 ? 16 : 24;
export const clone = <T,>(o: T): T => structuredClone(o);

export function parseVlans(spec: string): number[] {
  const out: number[] = [];
  for (const p of spec.split(",")) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(p.trim());
    if (!m) continue;
    for (let v = +m[1]; v <= Math.min(+(m[2] ?? m[1]), 4094); v++) out.push(v);
  }
  return out;
}
export function rangeStr(n: number[]): string {
  const a = [...new Set(n)].sort((x, y) => x - y),
    r: string[] = [];
  for (let i = 0; i < a.length; ) {
    let j = i;
    while (a[j + 1] === a[j] + 1) j++;
    r.push(i === j ? `${a[i]}` : `${a[i]}-${a[j]}`);
    i = j + 1;
  }
  return r.join(",") || "none";
}
export const vlanAllowed = (spec: string | undefined, v: number) =>
  !spec || spec === "all" || parseVlans(spec).includes(v);

const hash32 = (s: string) => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
export const macOf = (id: string, port: string) => {
  const h = hash32(id + "|" + port)
    .toString(16)
    .padStart(8, "0");
  return `aabb.cc${h.slice(0, 2)}.${h.slice(2, 6)}`;
};
export const macColon = (m: string) =>
  m.replace(/\./g, "").replace(/(..)(?=.)/g, "$1:");
export const fakeHash = (pw: string) =>
  `$1$${hash32(pw).toString(36).slice(0, 4)}$${hash32(pw + "x").toString(36)}${hash32(pw + "y").toString(36)}`.slice(
    0,
    30,
  );
export const shortIf = (n: string) =>
  n
    .replace(/^Ethernet/, "Et")
    .replace(/^GigabitEthernet/, "Gi")
    .replace(/^FastEthernet/, "Fa")
    .replace(/^Loopback/, "Lo");
export function stamp() {
  const d = new Date(),
    p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `*${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} ${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

/* ════════════════════════ 2. types + store ════════════════════════ */
export type Kind = "router" | "switch" | "vpc";
export interface Iface {
  ip?: string;
  mask?: string;
  shut: boolean;
  desc?: string;
  mode?: "access" | "trunk" | "auto" | "desirable";
  vlan?: number;
  channelGroup?: number;
  channelMode?: "active" | "passive" | "desirable" | "auto" | "on";
  allowed?: string;
  native?: number;
  nonegotiate?: boolean;
  enc?: number;
  bw?: number;
  delay?: number;
  ospfCost?: number;
  ospfPri?: number;
  ospfHello?: number;
  ospfNetwork?: "point-to-point";
  helper?: string[];
}
export interface Route {
  net: string;
  mask: string;
  nh?: string;
  iface?: string;
  ad: number;
}
export interface DhcpPool {
  net?: string;
  mask?: string;
  gw: string[];
  dns: string[];
  domain?: string;
  lease?: { d: number; h: number; m: number } | "infinite";
}
export interface DhcpCfg {
  off?: boolean;
  pools: Record<string, DhcpPool>;
  excluded: { from: string; to: string }[];
}
export interface DhcpBind {
  ip: string;
  mac: string;
  pool: string;
  at: number;
  ms: number;
}
export interface VtpCfg {
  mode: "server" | "client" | "transparent" | "off";
  domain?: string;
  pw?: string;
  version: 1 | 2 | 3;
  rev: number;
  sig?: string;
}
export interface Sec {
  enable?: string;
  enableType?: "secret" | "password";
  con: { pw?: string; login?: boolean };
  vty: {
    pw?: string;
    login: "pw" | "local" | "none";
    transport: "all" | "telnet" | "ssh" | "none";
  };
  users: { name: string; pw: string }[];
  domain?: string;
  rsa?: boolean;
  banner?: string;
  lookup: boolean;
}
export interface Cli {
  mode: string;
  ifs?: string[];
  line?: string;
  vlan?: number;
  pool?: string;
}
export interface Prompt {
  text: string;
  kind: string;
  secret?: boolean;
  data?: any;
}
export interface Session {
  lines: string[];
  hist: string[];
  cli: Cli;
  prompt?: Prompt;
  remote?: { id: string; cli: Cli; ip: string };
}
/** dynamic routing configuration (one process per protocol) */
export interface RipCfg {
  version: 1 | 2;
  networks: string[];
  auto: boolean;
  passive: string[];
}
export interface EigrpCfg {
  as: number;
  rid?: string;
  networks: { net: string; wild: string }[];
  passive: string[];
  variance: number;
  maxPaths: number;
}
export interface OspfCfg {
  pid: number;
  rid?: string;
  networks: { net: string; wild: string; area: number }[];
  passive: string[];
  refBw: number;
}
export interface Dev {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  hostname: string;
  ifaces: Record<string, Iface>;
  routes: Route[];
  vlans: Record<number, string>;
  gw?: string;
  sec: Sec;
  l3?: boolean;
  rip?: RipCfg;
  eigrp?: EigrpCfg;
  ospf?: OspfCfg;
  dhcp?: DhcpCfg;
  bindings?: DhcpBind[];
  vtp?: VtpCfg;
  arp: Record<string, { mac: string; iface: string }>;
  macTable: { vlan: number; mac: string; port: string }[];
  startup?: string;
  blank: string;
  session: Session;
}
export interface Link {
  a: [string, string];
  b: [string, string];
}
export interface State {
  devs: Record<string, Dev>;
  links: Link[];
}

const CFG = [
  "hostname",
  "ifaces",
  "routes",
  "vlans",
  "gw",
  "sec",
  "l3",
  "rip",
  "eigrp",
  "ospf",
  "dhcp",
  "vtp",
] as const;
const cfgObj = (d: Dev) =>
  Object.fromEntries(CFG.map((k) => [k, (d as any)[k]]));
const stable = (o: any): string =>
  JSON.stringify(o, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : v,
  );
export const snapshot = (d: Dev) => JSON.stringify(cfgObj(d));
/** put a saved config back; keys that were unset when it was saved (a routing process, a gateway) are removed again */
export const restore = (d: Dev, snap: string) => {
  const p = JSON.parse(snap);
  for (const k of CFG) if (!(k in p)) delete (d as any)[k];
  Object.assign(d, p);
};
export const isDirty = (d: Dev) =>
  stable(cfgObj(d)) !== stable(JSON.parse(d.startup ?? d.blank));

export function newDev(
  kind: Kind,
  id: string,
  x: number,
  y: number,
  hostname: string,
  ifaces: Record<string, Iface>,
  banner: string[],
): Dev {
  const d: Dev = {
    id,
    kind,
    x,
    y,
    hostname,
    ifaces,
    routes: [],
    vlans: kind === "switch" ? { 1: "default" } : {},
    sec: {
      con: {},
      vty: { login: "pw", transport: "all" },
      users: [],
      lookup: true,
    },
    arp: {},
    macTable: [],
    blank: "",
    session: { lines: banner, hist: [], cli: { mode: "user" } },
  };
  d.blank = snapshot(d);
  return d;
}
/** apply a lab author's pre-configuration and treat it as the saved startup-config */
export function preconfigure(d: Dev, init?: (d: Dev) => void) {
  if (init) {
    init(d);
    d.startup = snapshot(d);
  }
  return d;
}

export const isL3 = (d: Dev) =>
  d.kind === "router" || (d.kind === "switch" && !!d.l3);

export type Fx = (st: Store) => void;
export type Store = ReturnType<typeof createStore>;
export function createStore() {
  let s: State = { devs: {}, links: [] };
  const defs: Record<string, Dev> = {},
    ls = new Set<() => void>();
  const emit = () => ls.forEach((f) => f());
  return {
    get: () => s,
    subscribe: (f: () => void) => {
      ls.add(f);
      return () => {
        ls.delete(f);
      };
    },
    register(d: Dev) {
      defs[d.id] = clone(d);
      s = { ...s, devs: { ...s.devs, [d.id]: clone(d) } };
      emit();
    },
    unregister(id: string) {
      delete defs[id];
      const devs = { ...s.devs };
      delete devs[id];
      s = { ...s, devs };
      emit();
    },
    link(a: string, b: string) {
      const A = a.split(":") as [string, string],
        B = b.split(":") as [string, string];
      if (
        s.links.some((l) => l.a.join() === A.join() && l.b.join() === B.join())
      )
        return;
      s = { ...s, links: [...s.links, { a: A, b: B }] };
      emit();
    },
    update(id: string, fn: (d: Dev) => void) {
      const d = s.devs[id];
      if (!d) return;
      const c = clone(d);
      fn(c);
      s = { ...s, devs: { ...s.devs, [id]: c } };
      emit();
    },
    put(d: Dev) {
      s = { ...s, devs: { ...s.devs, [d.id]: d } };
      emit();
    },
    reset() {
      const devs: Record<string, Dev> = {};
      for (const k in defs) devs[k] = clone(defs[k]);
      s = { ...s, devs };
      emit();
    },
  };
}
export const applyFx = (st: Store, fx: Fx[]) => fx.forEach((f) => f(st));

/* Vtp.tsx pushes a hook here so it runs after every command / link change */
export const afterSubmit: Array<(st: Store) => void> = [];
export const runAfter = (st: Store) => afterSubmit.forEach((f) => f(st));
/* ════════════════════════ 3. topology ════════════════════════ */
const base = (n: string) => n.split(".")[0];
const famOf = (n: string) => /^[A-Za-z]+/.exec(n)![0].toLowerCase();
const numOf = (n: string) => n.replace(/^[A-Za-z]+/, "");
const IFRE = /^([a-z-]+)\s*(\d[\d/]*)(?:\.(\d+))?$/i;

/** "e0/0", "eth0/0", "Ethernet0/0.10" -> canonical existing interface name */
export function findIf(d: Dev | undefined, tok: string): string | undefined {
  const m = d && IFRE.exec(tok.trim());
  if (!d || !m) return;
  const key = m[2] + (m[3] ? "." + m[3] : "");
  return Object.keys(d.ifaces).find(
    (n) => numOf(n) === key && famOf(n).startsWith(m[1].toLowerCase()),
  );
}
/** like findIf, but creates Loopbacks (router), SVIs (switch) and sub-interfaces (router) on demand */
export function ensureIf(d: Dev, tok: string): string | undefined {
  const f = findIf(d, tok);
  if (f) return f;
  const m = IFRE.exec(tok.trim());
  if (!m) return;
  const fam = m[1].toLowerCase(),
    num = m[2],
    sub = m[3];
  if (
    (d.kind === "router" || d.kind === "switch") &&
    fam.length >= 2 &&
    "loopback".startsWith(fam) &&
    !sub
  ) {
    d.ifaces["Loopback" + num] = { shut: false };
    return "Loopback" + num;
  }
  if (
    d.kind === "switch" &&
    fam.length >= 2 &&
    "vlan".startsWith(fam) &&
    !sub &&
    !num.includes("/")
  ) {
    d.ifaces["Vlan" + num] = { shut: false };
    return "Vlan" + num;
  }
    if (d.kind === "router" && sub) {
    const p = findIf(d, m[1] + num);
    if (p && !p.includes(".")) {
      d.ifaces[`${p}.${sub}`] = { shut: false };
      return `${p}.${sub}`;
    }
  }
  if (d.kind === "switch" && fam.length >= 2 && "port-channel".startsWith(fam) && !sub) {
    d.ifaces["Port-channel" + num] = { shut: false };
    return "Port-channel" + num;
  }
}
export function peerOf(s: State, id: string, port: string) {
  const d = s.devs[id],
    p = base(port);
  for (const l of s.links)
    for (const [x, y] of [
      [l.a, l.b],
      [l.b, l.a],
    ] as const) {
      if (x[0] === id && findIf(d, x[1]) === p) {
        const pp = findIf(s.devs[y[0]], y[1]);
        if (pp) return { id: y[0], port: pp };
      }
    }
}
/** interface is administratively up AND (for physical ports) the cable's other end is up too */
export function ifUp(s: State, id: string, name: string): boolean {
  const d = s.devs[id],
    i = d?.ifaces[name];
  if (!i || i.shut) return false;
  if (name.startsWith("Loopback")) return true;
  if (name.startsWith("Vlan")) return !!d.vlans[+name.slice(4)];
  const b = d.ifaces[base(name)];
  if (!b || b.shut) return false;
  const pe = peerOf(s, id, base(name));
  if (!pe) return false;
  return !s.devs[pe.id].ifaces[pe.port].shut;
}
/** DTP outcome for a switchport */
export function operMode(
  s: State,
  id: string,
  port: string,
): "access" | "trunk" {
  const i = s.devs[id].ifaces[port],
    m = i.mode ?? "auto";
  if (m === "access" || m === "trunk") return m;
  const pe = peerOf(s, id, port),
    pd = pe && s.devs[pe.id];
  if (!pd || pd.kind !== "switch") return "access";
  const pi = pd.ifaces[pe!.port],
    pm = pi.mode ?? "auto";
  if (i.nonegotiate || (pm === "trunk" && pi.nonegotiate)) return "access";
  if (pm === "trunk") return "trunk";
  return (m === "desirable" && (pm === "auto" || pm === "desirable")) ||
    (m === "auto" && pm === "desirable")
    ? "trunk"
    : "access";
}

export interface Hop {
  sw: string;
  inPort?: string;
  outPort?: string;
  vlan: number;
}
export interface EP {
  id: string;
  port: string;
  path: Hop[];
}
/** every L3 interface that can hear a broadcast sent out of (id, port) — walks switches, honours VLANs/trunks */
export function l2domain(s: State, id: string, port: string): EP[] {
  const d = s.devs[id];
  if (!d || !ifUp(s, id, port)) return [];
  type Q = {
    dev: string;
    inp?: string;
    tag?: number;
    vlan?: number;
    path: Hop[];
  };
  const q: Q[] = [],
    out: EP[] = [],
    seen = new Set<string>();
  if (d.kind === "switch") {
    const m = /^Vlan(\d+)$/.exec(port);
    if (!m) return [];
    q.push({ dev: id, vlan: +m[1], path: [] });
  } else {
    const pe = peerOf(s, id, port);
    if (!pe) return [];
    q.push({ dev: pe.id, inp: pe.port, tag: d.ifaces[port].enc, path: [] });
  }
  while (q.length) {
    const it = q.shift()!,
      dd = s.devs[it.dev];
    if (dd.kind !== "switch") {
      let name = it.inp!;
      if (dd.kind === "router" && it.tag !== undefined) {
        const sub = Object.keys(dd.ifaces).find(
          (n) => n.startsWith(it.inp + ".") && dd.ifaces[n].enc === it.tag,
        );
        if (!sub) continue;
        name = sub;
      } else if (dd.kind === "vpc" && it.tag !== undefined) continue;
      if (ifUp(s, dd.id, name))
        out.push({ id: dd.id, port: name, path: it.path });
      continue;
    }
    let vlan = it.vlan!;
    if (it.inp) {
      const ii = dd.ifaces[it.inp];
      if (!ii || !ifUp(s, dd.id, it.inp)) continue;
      if (operMode(s, dd.id, it.inp) === "trunk") {
        vlan = it.tag ?? ii.native ?? 1;
        if (!vlanAllowed(ii.allowed, vlan)) continue;
      } else {
        if (it.tag !== undefined) continue;
        vlan = ii.vlan ?? 1;
      }
      if (!dd.vlans[vlan]) continue;
    }
    const key = `${dd.id}|${it.inp ?? "svi"}|${vlan}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (it.inp && dd.ifaces["Vlan" + vlan]?.ip && ifUp(s, dd.id, "Vlan" + vlan))
      out.push({
        id: dd.id,
        port: "Vlan" + vlan,
        path: [...it.path, { sw: dd.id, inPort: it.inp, vlan }],
      });
    for (const [pn, pi] of Object.entries(dd.ifaces)) {
      if (pn === it.inp || pn.startsWith("Vlan") || !ifUp(s, dd.id, pn))
        continue;
      const pe = peerOf(s, dd.id, pn);
      if (!pe) continue;
      let tag: number | undefined;
      if (operMode(s, dd.id, pn) === "trunk") {
        if (!vlanAllowed(pi.allowed, vlan)) continue;
        tag = vlan === (pi.native ?? 1) ? undefined : vlan;
      } else if ((pi.vlan ?? 1) !== vlan) continue;
      q.push({
        dev: pe.id,
        inp: pe.port,
        tag,
        path: [...it.path, { sw: dd.id, inPort: it.inp, outPort: pn, vlan }],
      });
    }
  }
  return out;
}

/* ════════════════════════ 4. routing table ════════════════════════ */
export interface RE {
  t: "C" | "L" | "S" | "R" | "D" | "O";
  net: string;
  len: number;
  ad: number;
  iface: string;
  via?: string;
  exit?: boolean;
  metric?: number;
  ia?: boolean; // dynamic routes: protocol metric, and OSPF inter-area flag
}
export const bestRoute = (rows: RE[], ip: string) =>
  rows
    .filter((r) => inNet(ip, r.net, lenMask(r.len)))
    .sort((a, b) => b.len - a.len || a.ad - b.ad)[0];
/** installed routes: connected + local + RIP/EIGRP/OSPF + statics whose next hop is resolvable.
 *  Lowest administrative distance wins per prefix, so floating statics appear only when the better route dies. */
export function routeTable(s: State, d: Dev): RE[] {
  const rows: RE[] = [];
  for (const [n, i] of Object.entries(d.ifaces)) {
    if (!i.ip || !i.mask || !ifUp(s, d.id, n)) continue;
    rows.push(
      {
        t: "C",
        net: netOf(i.ip, i.mask),
        len: maskLen(i.mask),
        ad: 0,
        iface: n,
      },
      { t: "L", net: i.ip, len: 32, ad: 0, iface: n },
    );
  }
  for (const r of getDyn(s).routes[d.id] ?? []) {
    if (rows.some((x) => x.net === r.net && x.len === r.len && x.t === "C"))
      continue;
    for (const p of r.paths)
      rows.push({
        t: r.t,
        net: r.net,
        len: r.len,
        ad: r.ad,
        iface: p.iface,
        via: p.via,
        metric: p.metric,
        ia: r.ia,
      });
  }
  const sorted = [...d.routes].sort((a, b) => a.ad - b.ad);
  for (let pass = 0; pass < 3; pass++)
    for (const r of sorted) {
      const len = maskLen(r.mask);
      if (rows.some((x) => x.net === r.net && x.len === len && x.ad <= r.ad))
        continue;
      let row: RE | undefined;
      if (r.iface) {
        if (r.iface === "Null0" || ifUp(s, d.id, r.iface))
          row = {
            t: "S",
            net: r.net,
            len,
            ad: r.ad,
            iface: r.iface,
            exit: true,
          };
      } else {
        const h = bestRoute(rows, r.nh!);
        if (h && h.t !== "L")
          row = {
            t: "S",
            net: r.net,
            len,
            ad: r.ad,
            iface: h.iface,
            via: r.nh,
          };
      }
      if (!row) continue;
      for (let k = rows.length - 1; k >= 0; k--)
        if (rows[k].net === r.net && rows[k].len === len && rows[k].ad > r.ad)
          rows.splice(k, 1);
      rows.push(row);
    }
  return rows;
}

/* ════════════════════════ 4b. dynamic routing: RIP / EIGRP / OSPF ════════════════════════
 * Convergence is instant and derived from the live topology every time, so shutting an interface
 * or removing a `network` statement changes every router's table immediately (no timers).
 * Results are cached per State object, so a ping / traceroute / matrix computes them once. */
export const majorNet = (ip: string) => netOf(ip, lenMask(classLen(ip)));
export const wildOf = (ip: string) => n2ip(~ip2n(lenMask(classLen(ip))) >>> 0);
const wildMatch = (ip: string, net: string, wild: string) =>
  ((ip2n(ip) ^ ip2n(net)) & ~ip2n(wild)) >>> 0 === 0;
const isLo = (n: string) => n.startsWith("Loopback");
export const ifBw = (n: string, i: Iface) =>
  i.bw ?? (isLo(n) ? 8000000 : 10000);
export const ifDelay = (n: string, i: Iface) =>
  i.delay ?? (isLo(n) ? 500 : 100);
export const ifCost = (d: Dev, n: string, i: Iface) =>
  i.ospfCost ??
  (isLo(n)
    ? 1
    : Math.max(1, Math.floor(((d.ospf?.refBw ?? 100) * 1000) / ifBw(n, i))));
export const eigrpMetric = (bw: number, dly: number) =>
  256 * (Math.floor(1e7 / bw) + dly);

export interface DynPath {
  via: string;
  iface: string;
  nbr: string;
  metric: number;
}
export interface DynRoute {
  t: "R" | "D" | "O";
  net: string;
  len: number;
  ad: number;
  metric: number;
  ia?: boolean;
  paths: DynPath[];
}
export interface RipEnt {
  net: string;
  len: number;
  m: number;
  conn?: string;
  paths: { via: string; iface: string }[];
}
export interface EigrpTopoEnt {
  via: string;
  iface: string;
  fd: number;
  rd: number;
  succ: boolean;
  feasible: boolean;
}
export interface EigrpTopo {
  net: string;
  len: number;
  fd: number;
  conn?: string;
  ent: EigrpTopoEnt[];
}
export interface OspfNbr {
  rid: string;
  pri: number;
  state: string;
  role: string;
  addr: string;
  iface: string;
}
export interface OspfIf {
  name: string;
  area: number;
  cost: number;
  state: string;
  full: number;
  total: number;
}
export interface Dyn {
  routes: Record<string, DynRoute[]>;
  ripDb: Record<string, RipEnt[]>;
  eigrpNbrs: Record<string, { ip: string; iface: string; nbr: string }[]>;
  eigrpTopo: Record<string, EigrpTopo[]>;
  eigrpRid: Record<string, string>;
  ospfRid: Record<string, string>;
  ospfNbrs: Record<string, OspfNbr[]>;
  ospfIfs: Record<string, OspfIf[]>;
}

/** routers that share a subnet with (id, ifn), seen through any switches in between */
function lanNbrs(
  s: State,
  id: string,
  ifn: string,
): { id: string; port: string; ip: string }[] {
  const me = s.devs[id].ifaces[ifn];
  if (!me?.ip || !me.mask) return [];
  const seen = new Set<string>(),
    out: { id: string; port: string; ip: string }[] = [];
  for (const e of l2domain(s, id, ifn)) {
    const o = s.devs[e.id],
      oi = o?.ifaces[e.port],
      k = e.id + "|" + e.port;
    if (
      !o ||
      !isL3(o) ||
      !oi?.ip ||
      !oi.mask ||
      oi.mask !== me.mask ||
      netOf(oi.ip, oi.mask) !== netOf(me.ip, me.mask) ||
      seen.has(k)
    )
      continue;
    seen.add(k);
    out.push({ id: e.id, port: e.port, ip: oi.ip });
  }
  return out;
}
/** router-id when none is configured: highest loopback, else highest active interface address */
function autoRid(s: State, d: Dev): string {
  const up = Object.entries(d.ifaces)
    .filter(([n, i]) => i.ip && ifUp(s, d.id, n))
    .map(([n, i]) => ({ lo: isLo(n), ip: i.ip! }));
  const top = (a: { ip: string }[]) =>
    a.map((x) => x.ip).sort((x, y) => ip2n(y) - ip2n(x))[0];
  return top(up.filter((x) => x.lo)) ?? top(up) ?? "0.0.0.0";
}
const byNet = (
  a: { net: string; len: number },
  b: { net: string; len: number },
) => ip2n(a.net) - ip2n(b.net) || a.len - b.len;

/* ─── RIP: hop count, AD 120, split horizon, v1 classful / v2 with optional auto-summary ─── */
function ripCompute(s: State, dyn: Dyn) {
  const rs = Object.values(s.devs).filter((d) => isL3(d) && d.rip);
  if (!rs.length) return;
  type Ent = RipEnt & { conn?: string };
  const on = (d: Dev, n: string) => {
    const i = d.ifaces[n];
    return (
      !!i?.ip &&
      !!i.mask &&
      ifUp(s, d.id, n) &&
      d.rip!.networks.includes(majorNet(i.ip))
    );
  };
  const conn = (d: Dev) => {
    const m = new Map<string, Ent>();
    for (const [n, i] of Object.entries(d.ifaces))
      if (on(d, n)) {
        const net = netOf(i.ip!, i.mask!),
          len = maskLen(i.mask!);
        m.set(`${net}/${len}`, { net, len, m: 0, conn: n, paths: [] });
      }
    return m;
  };
  /** what router `n` sends out `port`: split horizon, then classful rules (v1) or auto-summary (v2) */
  const adv = (n: Dev, port: string, t: Map<string, Ent>) => {
    const oi = n.ifaces[port],
      outMajor = majorNet(oi.ip!),
      outLen = maskLen(oi.mask!),
      v = n.rip!.version,
      res = new Map<string, { net: string; len: number; m: number }>();
    const put = (net: string, len: number, m: number) => {
      const k = `${net}/${len}`,
        o = res.get(k);
      if (!o || m < o.m) res.set(k, { net, len, m });
    };
    for (const e of t.values()) {
      if (e.paths.some((p) => p.iface === port)) continue;
      const same = majorNet(e.net) === outMajor;
      if (v === 1) {
        if (same) {
          if (e.len === outLen) put(e.net, e.len, e.m);
        } else put(majorNet(e.net), classLen(e.net), e.m);
      } else if (n.rip!.auto && !same)
        put(majorNet(e.net), classLen(e.net), e.m);
      else put(e.net, e.len, e.m);
    }
    return res;
  };
  let tbl: Record<string, Map<string, Ent>> = {};
  for (const d of rs) tbl[d.id] = conn(d);
  const sig = (t: Record<string, Map<string, Ent>>) =>
    JSON.stringify(
      Object.entries(t).map(([id, m]) => [
        id,
        [...m].map(([k, e]) => [k, e.m, e.paths.map((p) => p.via + p.iface)]),
      ]),
    );
  for (let pass = 0; pass < 20; pass++) {
    const next: Record<string, Map<string, Ent>> = {};
    for (const d of rs) {
      const m = conn(d),
        cand = new Map<string, Ent>();
      for (const [n] of Object.entries(d.ifaces)) {
        if (!on(d, n) || isLo(n)) continue;
        for (const nb of lanNbrs(s, d.id, n)) {
          const nd = s.devs[nb.id];
          if (!nd.rip || !on(nd, nb.port) || nd.rip.passive.includes(nb.port))
            continue; // a passive interface sends no updates
          for (const a of adv(nd, nb.port, tbl[nb.id]).values()) {
            const k = `${a.net}/${a.len}`,
              mm = a.m + 1;
            if (mm >= 16 || m.has(k)) continue;
            const o = cand.get(k),
              p = { via: nb.ip, iface: n };
            if (!o || mm < o.m)
              cand.set(k, { net: a.net, len: a.len, m: mm, paths: [p] });
            else if (
              mm === o.m &&
              o.paths.length < 4 &&
              !o.paths.some((x) => x.via === p.via && x.iface === p.iface)
            )
              o.paths.push(p);
          }
        }
      }
      for (const [k, e] of cand) m.set(k, e);
      next[d.id] = m;
    }
    const same = sig(next) === sig(tbl);
    tbl = next;
    if (same) break;
  }
  for (const d of rs) {
    const all = [...tbl[d.id].values()].sort(byNet);
    dyn.ripDb[d.id] = all;
    (dyn.routes[d.id] ??= []).push(
      ...all
        .filter((e) => !e.conn)
        .map((e) => ({
          t: "R" as const,
          net: e.net,
          len: e.len,
          ad: 120,
          metric: e.m,
          paths: e.paths.map((p) => ({ ...p, nbr: "", metric: e.m })),
        })),
    );
  }
}

/* ─── EIGRP: metric = 256 × (10^7 / lowest bandwidth + total delay), AD 90, split horizon,
 *     successors = equal-cost (or within `variance`) paths that satisfy the feasibility condition ─── */
function eigrpCompute(s: State, dyn: Dyn) {
  const rs = Object.values(s.devs).filter((d) => isL3(d) && d.eigrp);
  if (!rs.length) return;
  type V = { bw: number; dly: number };
  type Cand = {
    via: string;
    iface: string;
    nbr: string;
    metric: number;
    rd: number;
    vec: V;
  };
  type Ent = {
    net: string;
    len: number;
    vec: V;
    fd: number;
    conn?: string;
    succ: Cand[];
    all: Cand[];
  };
  const on = (d: Dev, n: string) => {
    const i = d.ifaces[n];
    if (!i?.ip || !i.mask || !ifUp(s, d.id, n)) return false;
    return d.eigrp!.networks.some(
      (x) =>
        (x.net === "0.0.0.0" && x.wild === "255.255.255.255") ||
        wildMatch(i.ip!, x.net, x.wild),
    );
  };
  const conn = (d: Dev) => {
    const m = new Map<string, Ent>();
    for (const [n, i] of Object.entries(d.ifaces))
      if (on(d, n)) {
        const net = netOf(i.ip!, i.mask!),
          len = maskLen(i.mask!),
          vec = { bw: ifBw(n, i), dly: ifDelay(n, i) };
        m.set(`${net}/${len}`, {
          net,
          len,
          vec,
          fd: eigrpMetric(vec.bw, vec.dly),
          conn: n,
          succ: [],
          all: [],
        });
      }
    return m;
  };
  /** neighbours on interface n: EIGRP routers in the same AS that run EIGRP on the far interface and are not passive */
  const peers = (d: Dev, n: string) => {
    if (!on(d, n) || isLo(n) || d.eigrp!.passive.includes(n)) return [];
    return lanNbrs(s, d.id, n).filter((nb) => {
      const nd = s.devs[nb.id];
      return (
        !!nd.eigrp &&
        nd.eigrp.as === d.eigrp!.as &&
        on(nd, nb.port) &&
        !nd.eigrp.passive.includes(nb.port)
      );
    });
  };
  let tbl: Record<string, Map<string, Ent>> = {};
  for (const d of rs) tbl[d.id] = conn(d);
  const sig = (t: Record<string, Map<string, Ent>>) =>
    JSON.stringify(
      Object.entries(t).map(([id, m]) => [
        id,
        [...m].map(([k, e]) => [k, e.fd, e.succ.map((c) => c.via + c.iface)]),
      ]),
    );
  for (let pass = 0; pass < 32; pass++) {
    const next: Record<string, Map<string, Ent>> = {};
    for (const d of rs) {
      const m = conn(d),
        cands = new Map<string, { net: string; len: number; cs: Cand[] }>();
      for (const [n, i] of Object.entries(d.ifaces))
        for (const nb of peers(d, n))
          for (const e of tbl[nb.id].values()) {
            const k = `${e.net}/${e.len}`;
            if (m.has(k) || e.succ.some((p) => p.iface === nb.port)) continue; // already connected, or split horizon
            const vec = {
              bw: Math.min(e.vec.bw, ifBw(n, i)),
              dly: e.vec.dly + ifDelay(n, i),
            };
            const c: Cand = {
              via: nb.ip,
              iface: n,
              nbr: nb.id,
              vec,
              metric: eigrpMetric(vec.bw, vec.dly),
              rd: e.fd,
            };
            const o = cands.get(k);
            if (o) o.cs.push(c);
            else cands.set(k, { net: e.net, len: e.len, cs: [c] });
          }
      const ec = d.eigrp!;
      for (const [k, { net, len, cs }] of cands) {
        cs.sort((a, b) => a.metric - b.metric || ip2n(a.via) - ip2n(b.via));
        const best = cs[0],
          fd = best.metric;
        const succ = cs
          .filter(
            (c) => c === best || (c.rd < fd && c.metric <= fd * ec.variance),
          )
          .slice(0, ec.maxPaths);
        m.set(k, { net, len, vec: best.vec, fd, succ, all: cs });
      }
      next[d.id] = m;
    }
    const same = sig(next) === sig(tbl);
    tbl = next;
    if (same) break;
  }
  for (const d of rs) {
    dyn.eigrpRid[d.id] = d.eigrp!.rid ?? autoRid(s, d);
    dyn.eigrpNbrs[d.id] = Object.keys(d.ifaces).flatMap((n) =>
      peers(d, n).map((p) => ({ ip: p.ip, iface: n, nbr: p.id })),
    );
    const routes: DynRoute[] = [],
      topo: EigrpTopo[] = [];
    for (const e of [...tbl[d.id].values()].sort(byNet)) {
      if (e.conn) {
        topo.push({ net: e.net, len: e.len, fd: e.fd, conn: e.conn, ent: [] });
        continue;
      }
      routes.push({
        t: "D",
        net: e.net,
        len: e.len,
        ad: 90,
        metric: e.fd,
        paths: e.succ.map((c) => ({
          via: c.via,
          iface: c.iface,
          nbr: c.nbr,
          metric: c.metric,
        })),
      });
      topo.push({
        net: e.net,
        len: e.len,
        fd: e.fd,
        ent: e.all.map((c) => ({
          via: c.via,
          iface: c.iface,
          fd: c.metric,
          rd: c.rd,
          succ: e.succ.includes(c),
          feasible: c.rd < e.fd,
        })),
      });
    }
    dyn.eigrpTopo[d.id] = topo;
    (dyn.routes[d.id] ??= []).push(...routes);
  }
}

/* ─── OSPF: cost = reference bandwidth / interface bandwidth, AD 110, shortest-path tree per router,
 *     DR/BDR election per segment, areas matched per interface (inter-area routes are shown as O IA) ─── */
function ospfCompute(s: State, dyn: Dyn) {
  const rs = Object.values(s.devs).filter((d) => isL3(d) && d.ospf);
  if (!rs.length) return;
  const areaOf = (d: Dev, n: string) => {
    const i = d.ifaces[n];
    if (!i?.ip || !ifUp(s, d.id, n)) return undefined;
    return d.ospf!.networks.find((x) => wildMatch(i.ip!, x.net, x.wild))?.area;
  };
  const helloOf = (d: Dev, n: string) => d.ifaces[n].ospfHello ?? 10;

  const networkOf = (d: Dev, n: string) =>
    d.ifaces[n].ospfNetwork ?? "broadcast";
  const rid: Record<string, string> = {};
  for (const d of rs)
    rid[d.id] = dyn.ospfRid[d.id] = d.ospf!.rid ?? autoRid(s, d);
  /** adjacent routers on interface n: same area, same subnet, and neither side passive */
  const peers = (d: Dev, n: string) => {
    const a = areaOf(d, n);

    if (a === undefined || isLo(n) || d.ospf!.passive.includes(n)) {
      return [];
    }

    return lanNbrs(s, d.id, n).filter((nb) => {
      const nd = s.devs[nb.id];

      if (
        !nd.ospf ||
        areaOf(nd, nb.port) !== a ||
        nd.ospf.passive.includes(nb.port)
      ) {
        return false;
      }

      // OSPF hello intervals must match.
      if (helloOf(d, n) !== helloOf(nd, nb.port)) {
        return false;
      }

      // OSPF network types must match.
      if (networkOf(d, n) !== networkOf(nd, nb.port)) {
        return false;
      }

      return true;
    });
  };
  type Edge = { to: string; cost: number; iface: string; via: string };
  const edges: Record<string, Edge[]> = {},
    origins = new Map<string, { r: string; area: number; cost: number }[]>();
  for (const d of rs) {
    edges[d.id] = [];
    for (const [n, i] of Object.entries(d.ifaces)) {
      const a = areaOf(d, n);
      if (a === undefined) continue;
      const cost = ifCost(d, n, i),
        len = isLo(n) ? 32 : maskLen(i.mask!),
        net = isLo(n) ? i.ip! : netOf(i.ip!, i.mask!),
        k = `${net}/${len}`;
      (origins.get(k) ?? origins.set(k, []).get(k)!).push({
        r: d.id,
        area: a,
        cost,
      });
      for (const nb of peers(d, n))
        edges[d.id].push({ to: nb.id, cost, iface: n, via: nb.ip });
    }
  }
  const spf = (src: string) => {
    const dist = new Map<string, number>([[src, 0]]),
      hops = new Map<string, DynPath[]>([[src, []]]),
      done = new Set<string>();
    for (;;) {
      let u: string | undefined,
        best = Infinity;
      for (const [k, v] of dist)
        if (!done.has(k) && v < best) {
          best = v;
          u = k;
        }
      if (u === undefined) break;
      done.add(u);
      for (const e of edges[u] ?? []) {
        const nd = best + e.cost,
          cur = dist.get(e.to),
          h: DynPath[] =
            u === src
              ? [{ via: e.via, iface: e.iface, nbr: e.to, metric: 0 }]
              : hops.get(u)!;
        if (cur === undefined || nd < cur) {
          dist.set(e.to, nd);
          hops.set(e.to, [...h]);
        } else if (nd === cur) {
          const o = hops.get(e.to)!;
          for (const x of h)
            if (!o.some((y) => y.via === x.via && y.iface === x.iface))
              o.push(x);
        }
      }
    }
    return { dist, hops };
  };
  for (const d of rs) {
    // neighbours, DR/BDR election per segment
    const nbrs: OspfNbr[] = [],
      ifs: OspfIf[] = [],
      pri = (x: Dev, n: string) => x.ifaces[n].ospfPri ?? 1;
    for (const [n, i] of Object.entries(d.ifaces)) {
      const a = areaOf(d, n);
      if (a === undefined) continue;
      const cost = ifCost(d, n, i);
      if (isLo(n)) {
        ifs.push({ name: n, area: a, cost, state: "LOOP", full: 0, total: 0 });
        continue;
      }
      const ps = peers(d, n);

      // Point-to-point networks do not elect DR or BDR.
      if (networkOf(d, n) === "point-to-point") {
        for (const p of ps) {
          nbrs.push({
            rid: rid[p.id],
            pri: pri(s.devs[p.id], p.port),
            state: "FULL",
            role: "-",
            addr: p.ip,
            iface: n,
          });
        }

        ifs.push({
          name: n,
          area: a,
          cost,
          state: "POINTTOPOINT",
          full: ps.length,
          total: ps.length,
        });

        continue;
      }

      // Broadcast network: elect DR and BDR.
      const mem = [
        { id: d.id, p: pri(d, n), r: rid[d.id] },
        ...ps.map((p) => ({
          id: p.id,
          p: pri(s.devs[p.id], p.port),
          r: rid[p.id],
        })),
      ];

      const el = mem
        .filter((m) => m.p > 0)
        .sort((x, y) => y.p - x.p || ip2n(y.r) - ip2n(x.r));

      const dr = el[0]?.id;
      const bdr = el[1]?.id;

      const role = (id: string) =>
        id === dr ? "DR" : id === bdr ? "BDR" : "DROTHER";

      let full = 0;

      for (const p of ps) {
        const st =
          role(d.id) !== "DROTHER" || role(p.id) !== "DROTHER"
            ? "FULL"
            : "2WAY";

        if (st === "FULL") full++;

        nbrs.push({
          rid: rid[p.id],
          pri: pri(s.devs[p.id], p.port),
          state: st,
          role: role(p.id),
          addr: p.ip,
          iface: n,
        });
      }

      const mine = role(d.id);

      ifs.push({
        name: n,
        area: a,
        cost,
        state: mine === "DROTHER" ? "DROTH" : mine,
        full,
        total: ps.length,
      });
    }
    dyn.ospfNbrs[d.id] = nbrs;
    dyn.ospfIfs[d.id] = ifs;
    // routes
    const { dist, hops } = spf(d.id),
      mine = new Set(ifs.map((x) => x.area)),
      out: DynRoute[] = [];
    for (const [k, orig] of origins) {
      if (orig.some((o) => o.r === d.id)) continue;
      let best = Infinity,
        hs: DynPath[] = [],
        areas: number[] = [];
      for (const o of orig) {
        const dd = dist.get(o.r);
        if (dd === undefined) continue;
        const c = dd + o.cost;
        if (c < best) {
          best = c;
          hs = [...hops.get(o.r)!];
          areas = [o.area];
        } else if (c === best) {
          for (const x of hops.get(o.r)!)
            if (!hs.some((y) => y.via === x.via && y.iface === x.iface))
              hs.push(x);
          areas.push(o.area);
        }
      }
      if (best === Infinity) continue;
      const [net, len] = k.split("/");
      out.push({
        t: "O",
        net,
        len: +len,
        ad: 110,
        metric: best,
        ia: !areas.some((a) => mine.has(a)),
        paths: hs.slice(0, 4).map((h) => ({ ...h, metric: best })),
      });
    }
    (dyn.routes[d.id] ??= []).push(...out);
  }
}

function computeDyn(s: State): Dyn {
  const dyn: Dyn = {
    routes: {},
    ripDb: {},
    eigrpNbrs: {},
    eigrpTopo: {},
    eigrpRid: {},
    ospfRid: {},
    ospfNbrs: {},
    ospfIfs: {},
  };
  ripCompute(s, dyn);
  eigrpCompute(s, dyn);
  ospfCompute(s, dyn);
  for (const id in dyn.routes) {
    // one winner per prefix: lowest administrative distance
    const best = new Map<string, DynRoute>();
    for (const r of dyn.routes[id]) {
      const k = `${r.net}/${r.len}`,
        o = best.get(k);
      if (!o || r.ad < o.ad) best.set(k, r);
    }
    dyn.routes[id] = [...best.values()];
  }
  return dyn;
}
const dynMemo = new WeakMap<State, Dyn>();
export function getDyn(s: State): Dyn {
  let r = dynMemo.get(s);
  if (!r) {
    r = computeDyn(s);
    dynMemo.set(s, r);
  }
  return r;
}

/* ════════════════════════ 5. forwarding ════════════════════════ */
const owns = (s: State, d: Dev, ip: string) =>
  Object.entries(d.ifaces).some(([n, i]) => i.ip === ip && ifUp(s, d.id, n));
function hostPick(
  d: Dev,
  dst: string,
): { iface: string; nh: string } | undefined {
  for (const [n, i] of Object.entries(d.ifaces)) {
    if (
      !i.ip ||
      !i.mask ||
      i.shut ||
      (d.kind === "switch" && !n.startsWith("Vlan"))
    )
      continue;
    if (inNet(dst, netOf(i.ip, i.mask), i.mask)) return { iface: n, nh: dst };
    if (d.gw && inNet(d.gw, netOf(i.ip, i.mask), i.mask))
      return { iface: n, nh: d.gw };
  }
}
function arpFind(
  s: State,
  id: string,
  iface: string,
  nh: string,
  proxy: boolean,
  dst: string,
) {
  const eps = l2domain(s, id, iface);
  let hit = eps.find(
    (e) => e.id !== id && s.devs[e.id].ifaces[e.port]?.ip === nh,
  );
  if (!hit && proxy)
    hit = eps.find((e) => {
      // proxy-ARP for statics that point at an exit interface
      const r = s.devs[e.id];
      if (!isL3(r) || e.id === id) return false;
      const b = bestRoute(routeTable(s, r), dst);
      return !!b && b.iface !== e.port && b.iface !== "Null0";
    });
  return hit;
}
const upsert = (d: Dev, vlan: number, mac: string, port: string) => {
  const m = d.macTable.find((e) => e.vlan === vlan && e.mac === mac);
  if (m) m.port = port;
  else d.macTable.push({ vlan, mac, port });
};
export interface Trace {
  status: "ok" | "noroute" | "unreach" | "ttl" | "noip" | "null";
  at: string;
  inIf: string;
  hops: string[];
  routers: number;
  first?: { iface: string; nh: string; srcIp?: string };
}
/** push one packet from `start` toward `dst`. TTL is decremented per router (not at the origin). */
export function route(
  s: State,
  start: string,
  dst: string,
  ttl: number,
  fx: Fx[],
): Trace {
  let cur = start,
    inIf = "",
    t = ttl,
    routers = 0,
    first: Trace["first"];
  const hops = [start],
    res = (status: Trace["status"]): Trace => ({
      status,
      at: cur,
      inIf,
      hops,
      routers,
      first,
    });
  for (let g = 0; g < 48; g++) {
    const d = s.devs[cur];
    if (owns(s, d, dst)) return res("ok");
    let eg: { iface: string; nh: string } | undefined,
      proxy = false;
    if (isL3(d)) {
      if (cur !== start) {
        t--;
        routers++;
        if (t <= 0) return res("ttl");
      }
      const r = bestRoute(routeTable(s, d), dst);
      if (!r) return res("noroute");
      if (r.iface === "Null0") return res("null");
      eg = { iface: r.iface, nh: r.via ?? dst };
      proxy = !!r.exit;
    } else {
      eg = hostPick(d, dst);
      if (!eg) return res("noip");
    }
    if (!first)
      first = { iface: eg.iface, nh: eg.nh, srcIp: d.ifaces[eg.iface]?.ip };
    const hit = arpFind(s, cur, eg.iface, eg.nh, proxy, dst);
    if (!hit) return res("unreach");
    const from = cur,
      e = eg,
      mA = macOf(from, e.iface),
      mB = macOf(hit.id, hit.port),
      srcIp = d.ifaces[e.iface]?.ip;
    fx.push((st) => {
      st.update(from, (x) => {
        x.arp[e.nh] = { mac: mB, iface: e.iface };
      });
      st.update(hit.id, (x) => {
        if (srcIp) x.arp[srcIp] = { mac: mA, iface: hit.port };
      });
      for (const h of hit.path)
        st.update(h.sw, (x) => {
          if (h.inPort) upsert(x, h.vlan, mA, h.inPort);
          if (h.outPort) upsert(x, h.vlan, mB, h.outPort);
        });
    });
    cur = hit.id;
    inIf = hit.port;
    hops.push(cur);
  }
  return res("ttl");
}
export interface Probe {
  kind: "reply" | "local" | "timeout" | "net" | "host";
  why?: string;
  from?: string;
  ttl?: number;
  ms: number;
  srcIp?: string;
  firstNh?: string;
}
/** one ICMP echo, round trip. A missing return route => timeout (exactly like real life). */
export function probe(s: State, src: string, dst: string, fx: Fx[]): Probe {
  const sd = s.devs[src],
    f = route(s, src, dst, isL3(sd) ? 255 : 64, fx);
  const srcIp = f.first?.srcIp,
    hops = f.hops.length - 1,
    ms = Math.round((0.35 + hops * 0.92) * 1000) / 1000,
    firstNh = f.first?.nh;
  if (f.status === "ok") {
    if (hops === 0)
      return {
        kind: "reply",
        ttl: isL3(sd) ? 255 : 64,
        ms: 0.05,
        srcIp: dst,
      };
    const init = isL3(s.devs[f.at]) ? 255 : 64;
    const b = route(s, f.at, srcIp!, init, fx);
    return b.status === "ok"
      ? { kind: "reply", ttl: init - b.routers, ms, srcIp, firstNh }
      : { kind: "timeout", ms, srcIp, firstNh, why: "no return route" };
  }
  if (f.at === src) return { kind: "local", why: f.status, ms, srcIp };
  if (f.status === "ttl" || !srcIp) return { kind: "timeout", ms, srcIp };
  const b = route(s, f.at, srcIp, 255, []);
  if (b.status !== "ok")
    return { kind: "timeout", ms, srcIp, why: "ICMP error lost" };
  return {
    kind: f.status === "unreach" ? "host" : "net",
    from: s.devs[f.at].ifaces[f.inIf]?.ip,
    ttl: 255 - b.routers,
    ms,
    srcIp,
  };
}
export interface TraceRow {
  ip?: string;
  mark?: string;
  done?: boolean;
}
export function traceRoute(
  s: State,
  src: string,
  dst: string,
  fx: Fx[],
  max = 30,
): TraceRow[] {
  const rows: TraceRow[] = [];
  let dead = 0;
  for (let ttl = 1; ttl <= max; ttl++) {
    const f = route(s, src, dst, ttl, fx),
      srcIp = f.first?.srcIp;
    if (f.at === src && f.status !== "ok") {
      rows.push({});
      break;
    }
    const back = srcIp ? route(s, f.at, srcIp, 255, []).status === "ok" : false;
    const ip = f.status === "ok" ? dst : s.devs[f.at].ifaces[f.inIf]?.ip;
    if (!back || !ip) {
      rows.push({});
      if (++dead >= 4) break;
      continue;
    }
    dead = 0;
    if (f.status === "ok") {
      rows.push({ ip, done: true });
      break;
    }
    if (f.status === "ttl") {
      rows.push({ ip });
      continue;
    }
    rows.push({ ip, mark: f.status === "unreach" ? "!H" : "!N", done: true });
    break;
  }
  return rows;
}

/* ════════════════════════ 6. CLI toolkit ════════════════════════ */
export type H = (c: Ctx, a: string[]) => void;
/** [pattern, handler, help]. Pattern words: keyword | <arg> | <*> (rest of line, joined) */
export type E = [string, H, string?];
export interface Ctx {
  store: Store;
  s: State;
  dev: Dev;
  cli: Cli;
  raw: string;
  pl: number;
  words: string[];
  toks: { t: string; pos: number }[];
  hist: string[];
  remote: boolean;
  fx: Fx[];
  out: (...l: string[]) => void;
  ask: (p: Prompt) => void;
  view: () => State;
  bad: (i: number) => void;
  sub?: (mode: string, line: string) => void;
  flags: {
    exit?: boolean;
    cls?: boolean;
    remote?: { via: "telnet" | "ssh"; ip: string; user?: string };
  };
}
export interface Engine {
  prompt(d: Dev, cli: Cli): string;
  run(c: Ctx, line: string): void;
  answer(c: Ctx, p: Prompt, line: string): void;
  help(c: Ctx, line: string): string[];
  complete(c: Ctx, line: string): string | undefined;
  render?(d: Dev): string[];
}
export const ENGINES: Partial<Record<Kind, Engine>> = {};
export const registerEngine = (k: Kind, e: Engine) => {
  ENGINES[k] = e;
};

const isKw = (p: string) => !p.startsWith("<");
function walk(entries: E[], toks: string[]) {
  let cands = entries.map((e) => ({ e, p: e[0].split(" ") }));
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i].toLowerCase();
    const m = cands.filter((x) => {
      const r = x.p.indexOf("<*>");
      if (r >= 0 && i >= r) return true;
      const q = x.p[i];
      return q !== undefined && (!isKw(q) || q.startsWith(t));
    });
    if (!m.length) return { cands, err: { kind: "invalid" as const, i } };
    const kw = m.filter((x) => x.p[i] && isKw(x.p[i])),
      exact = kw.filter((x) => x.p[i] === t);
    if (!exact.length && new Set(kw.map((x) => x.p[i])).size > 1)
      return { cands: kw, err: { kind: "ambiguous" as const, i } };
    cands = exact.length ? exact : kw.length ? kw : m;
  }
  return { cands, err: undefined };
}
export function dispatch(c: Ctx, entries: E[], line: string) {
  const toks = [...line.matchAll(/\S+/g)].map((m) => ({
      t: m[0],
      pos: m.index!,
    })),
    w = toks.map((x) => x.t);
  c.words = w;
  c.toks = toks;
  c.raw = line;
  const { cands, err } = walk(entries, w);
  if (err?.kind === "ambiguous")
    return c.out(`% Ambiguous command:  "${w.slice(0, err.i + 1).join(" ")}"`);
  if (err) return c.bad(err.i);
  const fin = cands.filter((x) => {
    const r = x.p.indexOf("<*>");
    return r >= 0 ? r < w.length : x.p.length === w.length;
  });
  if (!fin.length) return c.out("% Incomplete command.");
  const a: string[] = [];
  fin[0].p.forEach((p, i) => {
    if (!isKw(p)) a.push(p === "<*>" ? w.slice(i).join(" ") : w[i]);
  });
  fin[0].e[1](c, a);
}
export function helpLines(entries: E[], line: string): string[] {
  const trailing = line === "" || /\s$/.test(line),
    w = line.trim().split(/\s+/).filter(Boolean);
  const pre = trailing ? w : w.slice(0, -1),
    part = trailing ? "" : w[w.length - 1].toLowerCase();
  const { cands, err } = walk(entries, pre);
  if (err) return ["% Unrecognized command"];
  const nxt = new Map<string, string>();
  let cr = false;
  for (const x of cands) {
    const r = x.p.indexOf("<*>"),
      q = r >= 0 && pre.length >= r ? "<*>" : x.p[pre.length];
    if (q === undefined) {
      cr = true;
      continue;
    }
    if (isKw(q)) {
      if (q.startsWith(part)) nxt.set(q, x.e[2] ?? "");
    } else if (!part) nxt.set(q === "<*>" ? "LINE" : q, x.e[2] ?? "");
  }
  if (part)
    return nxt.size ? [[...nxt.keys()].join("  ")] : ["% Unrecognized command"];
  const L = [...nxt].map(([k, v]) => `  ${k.padEnd(14)}${v}`);
  if (cr) L.push("  <cr>");
  return L;
}
export function completeLine(entries: E[], line: string): string | undefined {
  if (/\s$/.test(line) || !line.trim()) return;
  const w = line.trim().split(/\s+/),
    { cands, err } = walk(entries, w.slice(0, -1));
  if (err) return;
  const k = new Set<string>();
  for (const x of cands) {
    const q = x.p[w.length - 1];
    if (q && isKw(q) && q.startsWith(w[w.length - 1].toLowerCase())) k.add(q);
  }
  return k.size === 1
    ? [...w.slice(0, -1), [...k][0]].join(" ") + " "
    : undefined;
}

/* ─── session executor: one line typed into device `id`'s terminal ─── */
function makeCtx(store: Store, id: string) {
  const s = store.get(),
    o = s.devs[id],
    ses = o.session,
    tid = ses.remote?.id ?? id,
    t = s.devs[tid];
  const eng = ENGINES[t.kind]!,
    cli = clone(ses.remote ? ses.remote.cli : ses.cli),
    draft = clone(t),
    out: string[] = [],
    fx: Fx[] = [];
  let asked: Prompt | undefined;
  const c: Ctx = {
    store,
    s,
    dev: draft,
    cli,
    raw: "",
    pl: 0,
    words: [],
    toks: [],
    hist: ses.hist,
    remote: !!ses.remote,
    fx,
    flags: {},
    out: (...l) => out.push(...l.flatMap((x) => x.split("\n"))),
    ask: (p) => {
      asked = p;
    },
    view: () => ({ ...s, devs: { ...s.devs, [tid]: draft } }),
    bad: (i) => {
      c.out(
        " ".repeat(c.pl + (c.toks[i]?.pos ?? 0)) + "^",
        "% Invalid input detected at '^' marker.",
        "",
      );
    },
  };
  return { c, eng, ses, tid, t, out, fx, draft, cli, asked: () => asked };
}
export function submit(store: Store, id: string, line: string) {
  const { c, eng, ses, tid, t, out, fx, draft, cli, asked } = makeCtx(
      store,
      id,
    ),
    pr = ses.prompt;
  const ptxt = pr ? pr.text : eng.prompt(t, cli);
  c.pl = ptxt.length;
  out.push(ptxt + (pr?.secret ? "" : line));
  let opened: { id: string; ip: string } | undefined;
  if (pr?.kind === "vty-pw") {
    const rd = c.s.devs[pr.data.id],
      v = rd.sec.vty;
    const ok =
      pr.data.via === "ssh" && v.login === "local"
        ? rd.sec.users.some((u) => u.name === pr.data.user && u.pw === line)
        : line === v.pw;
    if (ok) opened = { id: rd.id, ip: pr.data.ip };
    else
      out.push(
        "% Bad passwords",
        `[Connection to ${pr.data.ip} closed by foreign host]`,
      );
  } else if (pr) eng.answer(c, pr, line.trim());
  else if (line.trim()) eng.run(c, line);
  store.put(draft);
  let newPrompt = asked();
  if (c.flags.remote) {
    const r = openRemote(c, c.flags.remote, tid);
    out.push(...r.msgs);
    newPrompt = r.ask;
    opened = r.open ?? opened;
  }
  store.update(id, (d) => {
    const se = d.session;
    se.lines.push(...out);
    if (se.lines.length > 700) se.lines.splice(0, se.lines.length - 700);
    if (!pr && line.trim() && se.hist[se.hist.length - 1] !== line)
      se.hist.push(line);
    se.prompt = newPrompt;
    if (opened) {
      const rd = d.id === opened.id ? d : c.s.devs[opened.id];
      se.remote = { id: rd.id, cli: { mode: "user" }, ip: opened.ip };
      if (rd.sec.banner) se.lines.push(rd.sec.banner);
    } else if (se.remote) se.remote.cli = cli;
    else se.cli = cli;
    if (c.flags.exit && se.remote && !opened) {
      se.lines.push(`[Connection to ${se.remote.ip} closed by foreign host]`);
      se.remote = undefined;
    }
    if (c.flags.cls) se.lines = [];
  });
  applyFx(store, fx);
  runAfter(store);
}
function openRemote(
  c: Ctx,
  req: NonNullable<Ctx["flags"]["remote"]>,
  fromId: string,
): { msgs: string[]; ask?: Prompt; open?: { id: string; ip: string } } {
  const s = c.view(),
    msgs: string[] = [`Trying ${req.ip} ... `],
    f: Fx[] = [];
  const p = probe(s, fromId, req.ip, f),
    tr = route(s, fromId, req.ip, 64, []);
  if (p.kind !== "reply")
    return {
      msgs: [...msgs, "% Connection timed out; remote host not responding"],
    };
  c.fx.push(...f);
  const rd = s.devs[tr.at],
    v = rd.sec.vty;
  const refused =
    v.transport === "none" ||
    (v.transport !== "all" && v.transport !== req.via) ||
    (req.via === "ssh" && !rd.sec.rsa);
  if (refused)
    return { msgs: [...msgs, `% Connection refused by remote host`] };
  msgs.push("Open", "");
  if (v.login === "none") return { msgs, open: { id: rd.id, ip: req.ip } };
  if (v.login === "pw" && !v.pw)
    return {
      msgs: [
        ...msgs,
        "Password required, but none set",
        "",
        `[Connection to ${req.ip} closed by foreign host]`,
      ],
    };
  if (rd.sec.banner) msgs.push(rd.sec.banner);
  msgs.push("", "User Access Verification", "");
  return {
    msgs,
    ask: {
      kind: "vty-pw",
      text: "Password: ",
      secret: true,
      data: { id: rd.id, via: req.via, user: req.user, ip: req.ip },
    },
  };
}
export const termHelp = (store: Store, id: string, line: string) => {
  const k = makeCtx(store, id);
  return k.eng.help(k.c, line);
};
export const termComplete = (store: Store, id: string, line: string) => {
  const k = makeCtx(store, id);
  return k.eng.complete(k.c, line);
};
export const termPrompt = (s: State, id: string) => {
  const o = s.devs[id],
    ses = o.session;
  if (ses.prompt) return ses.prompt.text;
  const t = s.devs[ses.remote?.id ?? id];
  return ENGINES[t.kind]!.prompt(t, ses.remote ? ses.remote.cli : ses.cli);
};

/* ════════════════════════ 7. shared Cisco IOS commands ════════════════════════ */
export function toggle(c: Ctx, names: string[], shut: boolean) {
  for (const n of names) {
    const i = c.dev.ifaces[n];
    if (i.shut === shut) continue;
    const before = ifUp(c.view(), c.dev.id, n);
    i.shut = shut;
    const after = ifUp(c.view(), c.dev.id, n);
    if (shut) {
      c.out(
        `${stamp()}: %LINK-5-CHANGED: Interface ${n}, changed state to administratively down`,
      );
      if (before)
        c.out(
          `${stamp()}: %LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to down`,
        );
    } else if (after && !before)
      c.out(
        `${stamp()}: %LINK-3-UPDOWN: Interface ${n}, changed state to up`,
        `${stamp()}: %LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to up`,
      );
  }
}
export function ciscoPing(c: Ctx, ip: string) {
  if (!isIp(ip))
    return c.out(
      `Translating "${ip}"`,
      "% Unrecognized host or address, or protocol not running.",
      "",
    );
  const fx: Fx[] = [],
    p = probe(c.view(), c.dev.id, ip, fx),
    n = 5;
  let ch: string;
  if (p.kind === "reply")
    ch = (p.firstNh && !c.dev.arp[p.firstNh] ? "." : "!") + "!".repeat(n - 1);
  else if (p.kind === "net" || p.kind === "host") ch = "U.U.U";
  else ch = ".".repeat(n);
  const ok = [...ch].filter((x) => x === "!").length,
    ms = Math.max(1, Math.round(p.ms));
  c.out(
    "Type escape sequence to abort.",
    `Sending ${n}, 100-byte ICMP Echos to ${ip}, timeout is 2 seconds:`,
    ch,
    `Success rate is ${Math.round((ok * 100) / n)} percent (${ok}/${n})` +
      (ok ? `, round-trip min/avg/max = ${ms}/${ms + 1}/${ms + 3} ms` : ""),
  );
  c.fx.push(...fx);
}
export function ciscoTrace(c: Ctx, ip: string) {
  if (!isIp(ip))
    return c.out(
      `Translating "${ip}"`,
      "% Unrecognized host or address, or protocol not running.",
      "",
    );
  const fx: Fx[] = [],
    rows = traceRoute(c.view(), c.dev.id, ip, fx);
  c.out(
    "Type escape sequence to abort.",
    `Tracing the route to ${ip}`,
    "VRF info: (vrf in name/id, vrf out name/id)",
  );
  rows.forEach((r, i) => {
    const m = 3 + i * 2;
    c.out(
      `  ${i + 1} ${r.ip ? `${r.ip} ${m} msec ${m + 1} msec ${m} msec` : "* * *"}${r.mark ? "  " + r.mark : ""}`,
    );
  });
  c.fx.push(...fx);
}
export function showArp(c: Ctx) {
  const d = c.dev,
    L = [
      "Protocol  Address          Age (min)  Hardware Addr   Type   Interface",
    ];
  for (const [n, i] of Object.entries(d.ifaces))
    if (i.ip)
      L.push(
        `Internet  ${i.ip.padEnd(16)}${"-".padStart(9)}  ${macOf(d.id, n)}  ARPA   ${n}`,
      );
  for (const [ip, e] of Object.entries(d.arp))
    L.push(
      `Internet  ${ip.padEnd(16)}${"0".padStart(9)}  ${e.mac}  ARPA   ${e.iface}`,
    );
  c.out(...L);
}
const rsaGen = (c: Ctx) => {
  if (!c.dev.sec.domain) return c.out("% Please define a domain-name first.");
  c.ask({ kind: "rsa", text: "How many bits in the modulus [512]: " });
  c.out(
    `The name for the keys will be: ${c.dev.hostname}.${c.dev.sec.domain}`,
    "Choose the size of the key modulus in the range of 360 to 4096 for your",
    "  General Purpose Keys. Choosing a key modulus greater than 512 may take",
    "  a few minutes.",
    "",
  );
};
const doSave = (c: Ctx) => {
  c.out("Building configuration...");
  c.dev.startup = snapshot(c.dev);
  c.out("[OK]");
};
const askReload = (c: Ctx) =>
  c.ask({ kind: "reload", text: "Proceed with reload? [confirm]" });
const lineSet = (c: Ctx, fn: (t: any) => void) =>
  fn(c.cli.line === "con" ? c.dev.sec.con : c.dev.sec.vty);
const noop: H = () => {};

export function iosAnswer(c: Ctx, p: Prompt, line: string) {
  const yes = line === "" || /^y/i.test(line);
  switch (p.kind) {
    case "enable-pw": {
      const ok = line === c.dev.sec.enable;
      c.cli.mode = ok ? "priv" : c.cli.mode;
      if (!ok) c.out("% Bad secrets");
      break;
    }
    case "rsa":
      c.out(
        "",
        `% Generating 1024 bit RSA keys, keys will be non-exportable...`,
        "[OK] (elapsed time was 1 seconds)",
        "",
        `${stamp()}: %SSH-5-ENABLED: SSH 1.99 has been enabled`,
      );
      c.dev.sec.rsa = true;
      break;
    case "copy":
      doSave(c);
      break;
    case "erase":
      if (yes) {
        c.dev.startup = undefined;
        c.out(
          "[OK]",
          "Erase of nvram: complete",
          `${stamp()}: %SYS-7-NV_BLOCK_INIT: Initialized the geometry of nvram`,
        );
      }
      break;
    case "reload-save":
      if (/^y/i.test(line)) doSave(c);
      else if (!/^n/i.test(line))
        return (c.out("Please answer 'yes' or 'no'."), c.ask(p));
      askReload(c);
      break;
    case "reload":
      if (!yes) break;
      restore(c.dev, c.dev.startup ?? c.dev.blank);
      c.dev.arp = {};
      c.dev.macTable = [];
      c.dev.bindings = [];
      c.cli.mode = "user";
      delete c.cli.ifs;
      c.out(
        "",
        "*** System restarting ***",
        "Reading startup-config...",
        c.dev.startup
          ? "Restricted Rights Legend loaded; startup-config applied."
          : "No startup-config found; using factory defaults.",
        "",
        "Press RETURN to get started!",
        "",
      );
      if (c.remote) c.flags.exit = true;
      break;
  }
}

/** commands shared by routers and switches. `render` produces `show running-config` text */
export function iosShared(render: (d: Dev) => string[]) {
  const hostIf = (c: Ctx) => c.cli.ifs!;
  const showRun: H = (c) => {
    const L = render(c.dev);
    c.out(
      "Building configuration...",
      "",
      `Current configuration : ${L.join("\n").length} bytes`,
      ...L,
    );
  };
  const showStart: H = (c) => {
    if (!c.dev.startup) return c.out("startup-config is not present");
    const tmp = clone(c.dev);
    restore(tmp, c.dev.startup);
    const L = render(tmp);
    c.out(`Using ${L.join("\n").length} out of 262144 bytes`, ...L);
  };
  const exitH: H = (c) => {
    const m = c.cli.mode;
    if (m === "config") c.cli.mode = "priv";
    else if (m.startsWith("config")) {
      c.cli.mode = "config";
      delete c.cli.ifs;
    } else if (c.remote) c.flags.exit = true;
    else c.cli.mode = "user";
  };
  const mem = (c: Ctx) =>
    c.out(
      `${c.dev.hostname} uptime is 2 hours, 14 minutes`,
      "ROM: Bootstrap program is IOS-XE ROMMON (read-only; holds POST + bootstrap)",
      'System image file is "flash0:/i86bi-linux-l3-adventerprisek9-15.4.bin" (IOS image lives in Flash)',
      "",
      "256K bytes of ROM, 512MB of DRAM (RAM: running-config, ARP, routing table)",
      "1024K bytes of NVRAM (startup-config)",
      "64MB of Flash (IOS image)",
      "Configuration register is 0x2102 (boot IOS from Flash, load startup-config from NVRAM)",
    );
  const priv: E[] = [
    [
      "disable",
      (c) => {
        c.cli.mode = "user";
      },
      "Turn off privileged commands",
    ],
    [
      "configure terminal",
      (c) => {
        c.cli.mode = "config";
        c.out("Enter configuration commands, one per line.  End with CNTL/Z.");
      },
      "Configure from the terminal",
    ],
    ["show running-config", showRun, "Current operating configuration (RAM)"],
    [
      "show startup-config",
      showStart,
      "Contents of startup configuration (NVRAM)",
    ],
    [
      "show history",
      (c) => c.out(...c.hist.slice(-20)),
      "Display the session command history",
    ],
    [
      "copy running-config startup-config",
      (c) =>
        c.ask({
          kind: "copy",
          text: "Destination filename [startup-config]? ",
        }),
      "Save RAM config to NVRAM",
    ],
    ["write memory", doSave, "Write to NV memory"],
    ["write", doSave, "Write to NV memory"],
    [
      "erase startup-config",
      (c) =>
        c.ask({
          kind: "erase",
          text: "Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]",
        }),
      "Erase NVRAM",
    ],
    [
      "reload",
      (c) =>
        isDirty(c.dev)
          ? c.ask({
              kind: "reload-save",
              text: "System configuration has been modified. Save? [yes/no]: ",
            })
          : askReload(c),
      "Halt and perform a cold restart",
    ],
    [
      "clear arp-cache",
      (c) => {
        c.dev.arp = {};
      },
      "Clear the ARP cache",
    ],
    [
      "clear arp",
      (c) => {
        c.dev.arp = {};
      },
      "Clear the ARP cache",
    ],
    ["terminal <*>", noop, "Set terminal line parameters"],
    [
      "show flash:",
      (c) =>
        c.out(
          "System flash directory:",
          "File  Length   Name/status",
          "  1   87654321 i86bi-linux-l3-adventerprisek9-15.4.bin",
          "[87654321 bytes used, 46463279 available, 134217600 total]",
        ),
      "Flash filesystem (IOS image)",
    ],
    [
      "show flash",
      (c) =>
        c.out(
          "System flash directory:",
          "File  Length   Name/status",
          "  1   87654321 i86bi-linux-l3-adventerprisek9-15.4.bin",
          "[87654321 bytes used, 46463279 available, 134217600 total]",
        ),
      "Flash filesystem (IOS image)",
    ],
    [
      "show running-config interface <if>",
      (c, a) => {
        const n = findIf(c.dev, a[0]);
        if (!n) return c.bad(3);
        const L = render(c.dev),
          i = L.indexOf(`interface ${n}`),
          blk: string[] = [];
        for (let k = i + 1; k < L.length && L[k] !== "!"; k++) blk.push(L[k]);
        c.out(
          "Building configuration...",
          "",
          `Current configuration : ${blk.join("\n").length} bytes`,
          "!",
          `interface ${n}`,
          ...blk,
          "end",
        );
      },
      "Show one interface's configuration",
    ],
  ];
  const user: E[] = [
    [
      "enable",
      (c) => {
        if (c.dev.sec.enable)
          c.ask({ kind: "enable-pw", text: "Password: ", secret: true });
        else if (c.remote) c.out("% No password set");
        else c.cli.mode = "priv";
      },
      "Turn on privileged commands",
    ],
    ["exit", exitH, "Exit from the EXEC"],
    ["logout", exitH, "Exit from the EXEC"],
    ["ping <ip>", (c, a) => ciscoPing(c, a[0]), "Send echo messages"],
    [
      "traceroute <ip>",
      (c, a) => ciscoTrace(c, a[0]),
      "Trace route to destination",
    ],
    [
      "telnet <ip>",
      (c, a) => {
        c.flags.remote = { via: "telnet", ip: a[0] };
      },
      "Open a telnet connection",
    ],
    [
      "ssh -l <user> <ip>",
      (c, a) => {
        c.flags.remote = { via: "ssh", ip: a[1], user: a[0] };
      },
      "Open a secure shell client connection",
    ],
    ["show version", mem, "System hardware and software status"],
    [
      "show clock",
      (c) => c.out(`${stamp().slice(1)} UTC`),
      "Display the system clock",
    ],
    ["show arp", showArp, "ARP table"],
    ["show ip arp", showArp, "IP ARP table"],
  ];
  const global: E[] = [
    ["exit", exitH, "Exit from configure mode"],
    [
      "end",
      (c) => {
        c.cli.mode = "priv";
        delete c.cli.ifs;
      },
      "Exit to privileged EXEC",
    ],
    ["do <*>", (c, a) => c.sub!("priv", a[0]), "Run an EXEC command"],
    [
      "hostname <name>",
      (c, a) => {
        c.dev.hostname = a[0];
      },
      "Set system's network name",
    ],
    [
      "enable secret <*>",
      (c, a) => {
        c.dev.sec.enable = a[0].split(" ").pop();
        c.dev.sec.enableType = "secret";
      },
      "Assign the privileged level secret (hashed)",
    ],
    [
      "enable password <*>",
      (c, a) => {
        c.dev.sec.enable = a[0].split(" ").pop();
        c.dev.sec.enableType = "password";
      },
      "Assign the privileged level password (plain)",
    ],
    [
      "no enable <*>",
      (c) => {
        c.dev.sec.enable = undefined;
      },
      "Remove enable password/secret",
    ],
    [
      "banner motd <*>",
      (c, a) => {
        const d = a[0][0];
        c.dev.sec.banner = a[0].split(d)[1] ?? a[0];
      },
      "Set message of the day banner",
    ],
    [
      "ip domain-name <name>",
      (c, a) => {
        c.dev.sec.domain = a[0];
      },
      "Define the default domain name",
    ],
    [
      "ip domain name <name>",
      (c, a) => {
        c.dev.sec.domain = a[0];
      },
      "Define the default domain name",
    ],
    [
      "no ip domain-lookup",
      (c) => {
        c.dev.sec.lookup = false;
      },
      "Disable DNS lookup of mistyped commands",
    ],
    [
      "no ip domain lookup",
      (c) => {
        c.dev.sec.lookup = false;
      },
      "Disable DNS lookup of mistyped commands",
    ],
    [
      "ip domain-lookup",
      (c) => {
        c.dev.sec.lookup = true;
      },
      "Enable DNS lookup",
    ],
    ["ip ssh <*>", noop, "Configure SSH"],
    ["service <*>", noop, "Modify use of network based services"],
    ["no service <*>", noop, "Modify use of network based services"],
    ["crypto key generate rsa", rsaGen, "Generate RSA keys (needed for SSH)"],
    [
      "username <u> secret <*>",
      (c, a) => {
        c.dev.sec.users = c.dev.sec.users
          .filter((u) => u.name !== a[0])
          .concat({ name: a[0], pw: a[1].split(" ").pop()! });
      },
      "Local user with hashed secret",
    ],
    [
      "username <u> password <*>",
      (c, a) => {
        c.dev.sec.users = c.dev.sec.users
          .filter((u) => u.name !== a[0])
          .concat({ name: a[0], pw: a[1].split(" ").pop()! });
      },
      "Local user with plain password",
    ],
    [
      "line console 0",
      (c) => {
        c.cli.mode = "config-line";
        c.cli.line = "con";
      },
      "Primary terminal line",
    ],
    [
      "line vty <first> <last>",
      (c) => {
        c.cli.mode = "config-line";
        c.cli.line = "vty";
      },
      "Virtual terminal (Telnet/SSH)",
    ],
  ];
  const line: E[] = [
    [
      "password <*>",
      (c, a) =>
        lineSet(c, (t) => {
          t.pw = a[0].split(" ").pop();
        }),
      "Set a password",
    ],
    [
      "no password",
      (c) =>
        lineSet(c, (t) => {
          t.pw = undefined;
        }),
      "Remove password",
    ],
    [
      "login",
      (c) =>
        lineSet(c, (t) => {
          t.login = c.cli.line === "con" ? true : "pw";
        }),
      "Enable password checking",
    ],
    [
      "login local",
      (c) =>
        lineSet(c, (t) => {
          t.login = "local";
        }),
      "Local username/password database",
    ],
    [
      "no login",
      (c) =>
        lineSet(c, (t) => {
          t.login = c.cli.line === "con" ? false : "none";
        }),
      "Disable password checking",
    ],
    [
      "transport input <*>",
      (c, a) => {
        if (c.cli.line !== "vty") return c.bad(0);
        const w = a[0].split(" "),
          tel = w.includes("telnet"),
          ssh = w.includes("ssh");
        c.dev.sec.vty.transport = w.includes("none")
          ? "none"
          : w.includes("all") || (tel && ssh)
            ? "all"
            : tel
              ? "telnet"
              : "ssh";
      },
      "Define which protocols to use (telnet, ssh, all, none)",
    ],
    ["exec-timeout <*>", noop, "Set the EXEC timeout"],
    ["logging synchronous", noop, "Synchronized message output"],
  ];
  const ifc: E[] = [
    [
      "description <*>",
      (c, a) =>
        hostIf(c).forEach((n) => {
          c.dev.ifaces[n].desc = a[0];
        }),
      "Interface specific description",
    ],
    [
      "no description",
      (c) =>
        hostIf(c).forEach((n) => {
          c.dev.ifaces[n].desc = undefined;
        }),
    ],
    [
      "shutdown",
      (c) => toggle(c, hostIf(c), true),
      "Shutdown the selected interface",
    ],
    ["no shutdown", (c) => toggle(c, hostIf(c), false), "Enable the interface"],
    ["duplex <*>", noop],
    ["speed <*>", noop],
    ["bandwidth <*>", noop],
    ["mtu <*>", noop],
    ["cdp <*>", noop],
  ];
  return { priv, user, global, line, ifc, exitH, mem };
}
export function iosPrompt(d: Dev, cli: Cli) {
  const m: Record<string, string> = {
    user: ">",
    priv: "#",
    config: "(config)#",
    "config-if":
      cli.ifs && cli.ifs.length > 1 ? "(config-if-range)#" : "(config-if)#",
    "config-line": "(config-line)#",
    "config-vlan": "(config-vlan)#",
    "config-dhcp": "(dhcp-config)#",
    "config-router-rip": "(config-router)#",
    "config-router-eigrp": "(config-router)#",
    "config-router-ospf": "(config-router)#",
  };
  return d.hostname + m[cli.mode];
}
const USER_BLOCK =
  /^(show (run|start|hist)|conf|copy|write|erase|reload|disable|clear|terminal)/;
export function iosEngine(
  tables: (mode: string) => E[],
  render: (d: Dev) => string[],
): Engine {
  const tbl = (m: string) => tables(m);
  return {
    prompt: iosPrompt,
    render,
    run(c, line) {
      c.sub = (m, l) => dispatch(c, tbl(m), l);
      dispatch(c, tbl(c.cli.mode), line);
    },
    answer: iosAnswer,
    help: (c, line) => helpLines(tbl(c.cli.mode), line),
    complete: (c, line) => completeLine(tbl(c.cli.mode), line),
  };
}
export const userFilter = (e: E[]) => e.filter((x) => !USER_BLOCK.test(x[0]));

/* ════════════════════════ 8. UI ════════════════════════ */
interface LabCtx {
  store: Store;
  open: (id: string) => void;
  active?: string;
  w: number;
  h: number;
}
const Lab = createContext<LabCtx | null>(null);
export const useLab = () => {
  const c = useContext(Lab);
  if (!c) throw new Error("Device components must be rendered inside <NetLab>");
  return c;
};
export const useDev = (id: string) => {
  const { store } = useLab();
  return useSyncExternalStore(store.subscribe, () => store.get().devs[id]);
};
export function useRegister(make: () => Dev) {
  const { store } = useLab();
  useEffect(() => {
    const d = make();
    store.register(d);
    return () => store.unregister(d.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function DeviceNode({
  id,
  icon,
  sub,
}: {
  id: string;
  icon: ReactNode;
  sub?: string;
}) {
  const { open, active } = useLab(),
    d = useDev(id);
  if (!d) return null;
  return (
    <button
      className={"ns-node" + (active === id ? " on" : "")}
      style={{ left: d.x, top: d.y }}
      onClick={() => open(id)}
      aria-label={`Open console of ${d.hostname}`}
    >
      {icon}
      <span className="ns-name">
        <i
          className={"ns-dot" + (isDirty(d) ? " dirty" : "")}
          title={isDirty(d) ? "Unsaved changes (running ≠ startup)" : "Saved"}
        />
        {d.hostname}
      </span>
      {sub && <span className="ns-sub">{sub}</span>}
    </button>
  );
}
export const Note = ({
  x,
  y,
  size = 15,
  children,
}: {
  x: number;
  y: number;
  size?: number;
  children: ReactNode;
}) => (
  <div className="ns-note" style={{ left: x, top: y, fontSize: size }}>
    {children}
  </div>
);

export function Cable({
  a,
  b,
  aTag,
  bTag,
  offset = 0,
}: {
  a: string;
  b: string;
  aTag?: string;
  bTag?: string;
  offset?: number;
}) {
  const { store, w, h } = useLab(),
    s = useSyncExternalStore(store.subscribe, store.get);
  useEffect(() => {
    store.link(a, b);
    runAfter(store);
  }, [a, b, store]);
  const [ai, ap] = a.split(":"),
    [bi, bp] = b.split(":"),
    A = s.devs[ai],
    B = s.devs[bi];
  if (!A || !B) return null;
  const L = Math.hypot(B.x - A.x, B.y - A.y) || 1,
    ux = (B.x - A.x) / L,
    uy = (B.y - A.y) / L;
  // sideways shift for parallel cables (positive = right when A is above B)
  const sx = uy * offset,
    sy = -ux * offset;
  const st = (d: Dev, raw: string) => {
    const p = findIf(d, raw);
    return !p
      ? "x"
      : d.ifaces[p].shut
        ? "down"
        : ifUp(s, d.id, p)
          ? "up"
          : "wait";
  };
  const sa = st(A, ap),
    sb = st(B, bp),
    live = sa === "up" && sb === "up",
    anyDown = sa === "down" || sb === "down";
  const col = live
    ? "var(--ns-up)"
    : anyDown
      ? "var(--ns-down)"
      : "var(--ns-warn)";

  // interface pill: port name only (unchanged from the original)
  const pill = (
    d: Dev,
    raw: string,
    ux2: number,
    uy2: number,
    state: string,
    key: string,
  ) => {
    const wdt = raw.length * 6.6 + 24;
    const x =
      d.x + ux2 * 62 + sx - (ux2 < -0.3 ? wdt : ux2 > 0.3 ? 0 : wdt / 2);
    const y = d.y + uy2 * 62 + sy - 9 + (Math.abs(uy2) > 0.7 ? uy2 * 6 : 0);
    const dot =
      state === "up"
        ? "var(--ns-up)"
        : state === "down"
          ? "var(--ns-down)"
          : "var(--ns-warn)";
    return (
      <g key={key} transform={`translate(${x},${y})`}>
        <rect
          width={wdt}
          height={18}
          rx={9}
          fill="var(--ns-chip)"
          stroke={col}
          strokeWidth={1.4}
        />
        <circle cx={9} cy={9} r={3.4} fill={dot} />
        <text
          x={16}
          y={13}
          fontSize={11}
          fontFamily="var(--ns-mono)"
          fill="var(--ns-ink)"
        >
          {raw}
        </text>
      </g>
    );
  };

  // IP host tag: separate chip on the cable, placed just beyond the pill
  const tag = (
    d: Dev,
    raw: string,
    t: string | undefined,
    ux2: number,
    uy2: number,
    key: string,
  ) => {
    if (!t) return null;
    const wdt = raw.length * 6.6 + 24;
    const dist = 62 + Math.abs(ux2) * (wdt + 22) + Math.abs(uy2) * 34;
    const tw = t.length * 9 + 14;
    return (
      <g
        key={key}
        transform={`translate(${d.x + ux2 * dist + sx},${d.y + uy2 * dist + sy})`}
      >
        <rect
          x={-tw / 2}
          y={-11}
          width={tw}
          height={22}
          rx={5}
          fill="var(--ns-chip)"
          stroke={col}
          strokeWidth={1.4}
        />
        <text
          y={5}
          fontSize={14}
          fontWeight={700}
          textAnchor="middle"
          fontFamily="var(--ns-mono)"
          fill="var(--ns-ink)"
        >
          {t}
        </text>
      </g>
    );
  };

  return (
    <svg
      className="ns-cable"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      <polyline
        points={`${A.x},${A.y} ${A.x + ux * 68 + sx},${A.y + uy * 68 + sy} ${B.x - ux * 68 + sx},${B.y - uy * 68 + sy} ${B.x},${B.y}`}
        fill="none"
        stroke={col}
        strokeWidth={2.2}
        strokeDasharray={live ? undefined : "6 5"}
      />
      {pill(A, ap, ux, uy, sa, "pa")}
      {pill(B, bp, -ux, -uy, sb, "pb")}
      {tag(A, ap, aTag, ux, uy, "ta")}
      {tag(B, bp, bTag, -ux, -uy, "tb")}
    </svg>
  );
}

function Term({ id }: { id: string }) {
  const { store } = useLab(),
    s = useSyncExternalStore(store.subscribe, store.get),
    d = s.devs[id];
  const [val, setVal] = useState(""),
    [hi, setHi] = useState(-1),
    box = useRef<HTMLDivElement>(null),
    inp = useRef<HTMLInputElement>(null);

  // State to track copy feedback
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSel, setCopiedSel] = useState(false);

  const ses = d?.session,
    prompt = d ? termPrompt(s, id) : "";

  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ses?.lines.length, id]);
  useEffect(() => {
    inp.current?.focus();
  }, [id]);

  if (!d || !ses) return null;

  const push = (...l: string[]) =>
    store.update(id, (x) => {
      x.session.lines.push(...l);
    });
  const go = (line: string) => {
    submit(store, id, line);
    setVal("");
    setHi(-1);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const k = e.key,
      ctrl = e.ctrlKey;
    if (k === "Enter") {
      e.preventDefault();
      go(val);
    } else if (k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault();
      const H = ses.hist;
      if (!H.length) return;
      const n =
        k === "ArrowUp"
          ? hi < 0
            ? H.length - 1
            : Math.max(0, hi - 1)
          : hi < 0
            ? -1
            : hi + 1;
      if (n < 0 || n >= H.length) {
        setHi(-1);
        setVal("");
      } else {
        setHi(n);
        setVal(H[n]);
      }
    } else if (k === "Tab") {
      e.preventDefault();
      if (!ses.prompt) {
        const r = termComplete(store, id, val);
        if (r) setVal(r);
      }
    } else if (k === "?" && !ses.prompt && ses.cli) {
      e.preventDefault();
      push(prompt + val + "?", ...termHelp(store, id, val));
    } else if (ctrl && k === "z") {
      e.preventDefault();
      if (
        !ses.prompt &&
        (ses.remote ? ses.remote.cli : ses.cli).mode.startsWith("config")
      )
        go("end");
    } else if (ctrl && k === "c") {
      // If text is selected, let the browser copy it. Otherwise, act as Ctrl+C.
      const sel = window.getSelection()?.toString();
      if (!sel) {
        e.preventDefault();
        push(prompt + val + "^C");
        store.update(id, (x) => {
          x.session.prompt = undefined;
        });
        setVal("");
      }
    } else if (ctrl && k === "a") {
      const sel = window.getSelection()?.toString();
      if (!sel) {
        e.preventDefault();
        inp.current?.setSelectionRange(0, 0);
      }
    } else if (ctrl && k === "e") {
      e.preventDefault();
      inp.current?.setSelectionRange(val.length, val.length);
    } else if (ctrl && k === "u") {
      e.preventDefault();
      setVal("");
    } else if (ctrl && k === "w") {
      e.preventDefault();
      setVal(val.replace(/\S*\s*$/, ""));
    } else if (ctrl && k === "l") {
      e.preventDefault();
      store.update(id, (x) => {
        x.session.lines = [];
      });
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(ses.lines.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const copySelection = () => {
    const sel = window.getSelection()?.toString();
    if (sel) {
      navigator.clipboard.writeText(sel);
      setCopiedSel(true);
      setTimeout(() => setCopiedSel(false), 1500);
    }
  };

  const handleTermClick = () => {
    const sel = window.getSelection()?.toString();
    if (!sel) {
      inp.current?.focus();
    }
  };

  return (
    <div
      className="ns-tbody"
      ref={box}
      onClick={handleTermClick}
      onContextMenu={(e) => {
        const sel = window.getSelection()?.toString();
        if (sel) {
          e.preventDefault();
          navigator.clipboard.writeText(sel);
          setCopiedSel(true);
          setTimeout(() => setCopiedSel(false), 1500);
        }
      }}
    >
      {/* Floating toolbar for copying */}
      <div
        style={{
          position: "sticky",
          top: 0,
          right: 0,
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          padding: "4px 0",
          zIndex: 10,
        }}
      >
        <button
          onClick={copySelection}
          style={{
            background: copiedSel ? "var(--ns-up)" : "var(--ns-chip)",
            color: copiedSel ? "#fff" : "var(--ns-ink)",
            border: "1px solid var(--ns-edge)",
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: 11,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copiedSel ? "✓ Copied" : "Copy Selected"}
        </button>
        <button
          onClick={copyAll}
          style={{
            background: copiedAll ? "var(--ns-up)" : "var(--ns-chip)",
            color: copiedAll ? "#fff" : "var(--ns-ink)",
            border: "1px solid var(--ns-edge)",
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: 11,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copiedAll ? "✓ Copied" : "Copy All"}
        </button>
      </div>

      <pre className="ns-out">{ses.lines.join("\n")}</pre>
      <label className="ns-in">
        <span className="ns-pr">{prompt}</span>
        <input
          ref={inp}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKey}
          type={ses.prompt?.secret ? "password" : "text"}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label={`${d.hostname} console input`}
        />
      </label>
    </div>
  );
}

function Matrix({ store }: { store: Store }) {
  const s = useSyncExternalStore(store.subscribe, store.get);
  const v = Object.values(s.devs)
    .filter((d) => d.kind === "vpc")
    .sort((a, b) => a.x - b.x);
  const ok = (a: Dev, b: Dev) => {
    const ip = b.ifaces.eth0?.ip;
    return (
      !!ip && !!a.ifaces.eth0?.ip && probe(s, a.id, ip, []).kind === "reply"
    );
  };
  if (v.length < 2)
    return (
      <div className="ns-pop">
        Add two or more VPCs to see a reachability matrix.
      </div>
    );
  return (
    <div className="ns-pop">
      <table>
        <thead>
          <tr>
            <th>from \ to</th>
            {v.map((d) => (
              <th key={d.id}>{d.hostname}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.map((a) => (
            <tr key={a.id}>
              <th>{a.hostname}</th>
              {v.map((b) =>
                a === b ? (
                  <td key={b.id} className="self">
                    –
                  </td>
                ) : (
                  <td key={b.id} className={ok(a, b) ? "yes" : "no"}>
                    {ok(a, b) ? "✓" : "✕"}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CSS = `
.ns-lab{--ns-ink:#14212c;--ns-paper:#e6ecec;--ns-gridc:rgba(20,33,44,.08);--ns-edge:#b9c7c8;--ns-chip:#f8fbfa;--ns-up:#17917f;--ns-warn:#d28a17;--ns-down:#c1433a;--ns-term:#0d1822;--ns-termtx:#d3e2ec;--ns-amber:#efb04b;--ns-accent:#1f6fa8;--ns-mono:ui-monospace,"JetBrains Mono","Cascadia Code",Menlo,Consolas,monospace;
font:13px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ns-ink);background:var(--ns-paper);border:1px solid var(--ns-edge);border-radius:10px;overflow:hidden;max-width:100%}
@media(prefers-color-scheme:dark){.ns-lab{--ns-ink:#dae6ee;--ns-paper:#101b24;--ns-gridc:rgba(218,230,238,.07);--ns-edge:#26384a;--ns-chip:#172531;--ns-term:#070d13;--ns-accent:#58a6dc}}
.ns-lab *{box-sizing:border-box}
.ns-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--ns-edge);flex-wrap:wrap}
.ns-bar h2{font:650 15px/1 ui-sans-serif,system-ui,sans-serif;margin:0 auto 0 0}
.ns-btn{font:inherit;color:inherit;background:var(--ns-chip);border:1px solid var(--ns-edge);border-radius:6px;padding:4px 10px;cursor:pointer}
.ns-btn:hover{border-color:var(--ns-accent)}
.ns-btn:focus-visible,.ns-node:focus-visible,.ns-in input:focus-visible{outline:2px solid var(--ns-accent);outline-offset:2px}
.ns-scroll{overflow:auto}
.ns-canvas{position:relative;background-color:var(--ns-paper);background-image:linear-gradient(var(--ns-gridc) 1px,transparent 1px),linear-gradient(90deg,var(--ns-gridc) 1px,transparent 1px);background-size:20px 20px}
.ns-cable{position:absolute;left:0;top:0;pointer-events:none;z-index:1}
.ns-node{position:absolute;transform:translate(-50%,-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 8px 3px;border:1px solid transparent;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font:inherit}
.ns-node:hover{background:var(--ns-chip);border-color:var(--ns-edge)}.ns-node.on{background:var(--ns-chip);border-color:var(--ns-accent)}
.ns-name{font:600 12px var(--ns-mono);display:flex;align-items:center;gap:5px}.ns-sub{font-size:11px;opacity:.7}
.ns-dot{width:7px;height:7px;border-radius:2px;background:var(--ns-up);display:inline-block}.ns-dot.dirty{background:var(--ns-warn)}
.ns-note{position:absolute;transform:translate(-50%,-50%);font-family:var(--ns-mono);white-space:nowrap;z-index:0;pointer-events:none}
.ns-tabs{display:flex;gap:2px;padding:6px 8px 0;border-top:1px solid var(--ns-edge);background:var(--ns-paper);overflow-x:auto}
.ns-tab{display:flex;align-items:center;gap:6px;padding:4px 6px 4px 10px;font:12px var(--ns-mono);border:1px solid var(--ns-edge);border-bottom:0;border-radius:6px 6px 0 0;background:var(--ns-chip);cursor:pointer;color:inherit}
.ns-tab.on{background:var(--ns-term);color:var(--ns-termtx);border-color:var(--ns-term)}.ns-tab button{all:unset;cursor:pointer;opacity:.6;padding:0 3px}.ns-tab button:hover{opacity:1}
.ns-term{background:var(--ns-term);color:var(--ns-termtx);font:13px/1.4 var(--ns-mono)}
.ns-tbody{height:300px;overflow:auto;padding:10px 14px}.ns-out{margin:0;white-space:pre-wrap;word-break:break-word;font:inherit;user-select: text;
  cursor: text;}
.ns-in{display:flex;gap:0}.ns-pr{color:var(--ns-amber);white-space:pre}
.ns-in input{flex:1;min-width:0;background:transparent;border:0;color:inherit;font:inherit;padding:0;caret-color:var(--ns-amber)}.ns-in input:focus{outline:none}
.ns-empty{padding:26px;text-align:center;opacity:.75;background:var(--ns-term);color:var(--ns-termtx)}
.ns-pop{position:absolute;right:12px;top:44px;z-index:20;background:var(--ns-chip);border:1px solid var(--ns-edge);border-radius:8px;padding:10px;box-shadow:0 6px 24px rgba(0,0,0,.18)}
.ns-pop table{border-collapse:collapse;font:12px var(--ns-mono)}.ns-pop th,.ns-pop td{padding:3px 9px;text-align:center}.ns-pop td.yes{color:var(--ns-up);font-weight:700}.ns-pop td.no{color:var(--ns-down);font-weight:700}.ns-pop td.self{opacity:.4}
@media(prefers-reduced-motion:no-preference){.ns-node{transition:background .12s,border-color .12s}}
`;

export function NetLab({
  title,
  width = 900,
  height = 560,
  children,
}: {
  title: string;
  width?: number;
  height?: number;
  children: ReactNode;
}) {
  const store = useMemo(createStore, []);
  const [tabs, setTabs] = useState<string[]>([]),
    [active, setActive] = useState<string>(),
    [mx, setMx] = useState(false);
  const s = useSyncExternalStore(store.subscribe, store.get);
  // remembers the last "interface ..." / "router ..." line clicked per device
  const lastCtx = useRef<Record<string, string>>({});

  useEffect(() => {
    const onRun = (e: Event) => {
      const { device, commands, config } = (e as CustomEvent).detail as {
        device: string;
        commands: string[];
        config: boolean;
      };
      const d = store.get().devs[device];
      if (!d) return;
      setActive(device); // open that device's tab

      const cli = d.session.cli;
      const mode: string = cli?.mode ?? "";

      // Enter config mode only if the router isn't there yet.
      const pre: string[] = [];
      if (config) {
        if (mode === "user") pre.push("enable");
        if (mode === "user" || mode === "priv") pre.push("configure terminal");
      }

      // A click on an indented line arrives as [parent, child]. Drop the parent
      // if the device is already inside it.
      let cmds = commands;
      const parent = commands[0] ?? "";
      const isContext = /^(interface|router)\s/.test(parent);
      if (isContext && commands.length === 2) {
        const [kw, arg = ""] = parent.split(/\s+/);
        let already = false;
        if (kw === "interface" && mode === "config-if") {
          // "e0/0" vs "Ethernet0/0": same letters at the start, same numbers at the end
          const cur = (cli?.ifs?.[0] ?? "").toLowerCase();
          const m = arg.toLowerCase().match(/^([a-z]+)(.*)$/);
          already = !!m && cur.startsWith(m[1]) && cur.endsWith(m[2]);
        } else if (kw === "router") {
          already =
            mode.includes("router") && lastCtx.current[device] === parent;
        }
        if (already) cmds = commands.slice(1);
      }
      if (isContext) lastCtx.current[device] = parent;

      [...pre, ...cmds].forEach((line) => submit(store, device, line));
    };
    window.addEventListener("netlab:run", onRun);
    return () => window.removeEventListener("netlab:run", onRun);
  }, [store]);

  const open = (id: string) => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActive(id);
  };
  const close = (id: string) => {
    setTabs((t) => t.filter((x) => x !== id));
    if (active === id) setActive(tabs.filter((x) => x !== id).pop());
  };
  const live = tabs.filter((t) => s.devs[t]);
  return (
    <Lab.Provider value={{ store, open, active, w: width, h: height }}>
      <style>{CSS}</style>
      <section
        className="ns-lab"
        aria-label={title}
        style={{ position: "relative" }}
      >
        <div className="ns-bar">
          <h2>{title}</h2>
          <span style={{ opacity: 0.7 }}>
            Click any device to open its console
          </span>
          <button
            className="ns-btn"
            onClick={() => setMx((m) => !m)}
            aria-expanded={mx}
          >
            Ping matrix
          </button>
          <button
            className="ns-btn"
            onClick={() => {
              store.reset();
              runAfter(store);
            }}
          >
            Reset lab
          </button>
        </div>
        {mx && <Matrix store={store} />}
        <div className="ns-scroll">
          <div className="ns-canvas" style={{ width, height }}>
            {children}
          </div>
        </div>
        {live.length > 0 && (
          <>
            <div className="ns-tabs" role="tablist">
              {live.map((t) => (
                <div
                  key={t}
                  role="tab"
                  aria-selected={active === t}
                  tabIndex={0}
                  className={"ns-tab" + (active === t ? " on" : "")}
                  onClick={() => setActive(t)}
                  onKeyDown={(e) => e.key === "Enter" && setActive(t)}
                >
                  {s.devs[t].session.remote
                    ? `${s.devs[t].hostname} ⇒ ${s.devs[s.devs[t].session.remote!.id].hostname}`
                    : s.devs[t].hostname}
                  <button
                    aria-label={`Close ${t}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      close(t);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="ns-term">
              {active && s.devs[active] ? (
                <Term id={active} />
              ) : (
                <div className="ns-empty">Pick a tab</div>
              )}
            </div>
          </>
        )}
      </section>
    </Lab.Provider>
  );
}
