/**
 * Dhcp.tsx — DHCP server (router / L3 switch) and client (VPC `ip dhcp`) for the netsim labs.
 *
 * A server answers a DISCOVER only on an interface that is UP, has an IP, and whose subnet matches a pool's
 * `network` — exactly like real IOS (no relay). The broadcast is walked with l2domain(), so VLANs, trunks and
 * switches in between are honoured.
 *
 * Exports:
 *   dhcpGlobalX  global-config commands   (ip dhcp pool / excluded-address, service dhcp)
 *   dhcpPoolX    config-dhcp commands     (network, default-router, dns-server, domain-name, lease)
 *   dhcpPrivX    exec commands            (show ip dhcp pool|binding, clear ip dhcp binding)
 *   renderDhcp   running-config text
 *   dhcpClient / dhcpRelease   handlers for the VPC engine (`ip dhcp`, `ip dhcp -r`)
 */
import {
  type Ctx,
  type Dev,
  type E,
  type H,
  type State,
  type Fx,
  type DhcpPool,
  type DhcpBind,
  l2domain,
  isIp,
  isMask,
  netOf,
  bcastOf,
  maskLen,
  ip2n,
  n2ip,
  macOf,
} from "./netsim";

/* ───────────── helpers ───────────── */
const cfgOf = (c: Ctx) => (c.dev.dhcp ??= { pools: {}, excluded: [] });
const leaseMs = (l?: DhcpPool["lease"]) =>
  l === "infinite" ? -1 : l ? ((l.d * 24 + l.h) * 60 + l.m) * 60000 : 86400000;
const live = (b: DhcpBind, now: number) => b.ms < 0 || b.at + b.ms > now;
export const activeBindings = (d: Dev, now = Date.now()) =>
  (d.bindings ?? []).filter((b) => live(b, now));
const isExcluded = (d: Dev, ip: string) =>
  (d.dhcp?.excluded ?? []).some(
    (e) => ip2n(ip) >= ip2n(e.from) && ip2n(ip) <= ip2n(e.to),
  );
const range = (p: DhcpPool) => {
  if (!p.net || !p.mask) return undefined;
  const first = ip2n(p.net) + 1,
    last = ip2n(bcastOf(p.net, p.mask)) - 1;
  return last >= first ? { first, last, total: last - first + 1 } : undefined;
};
/** lowest address in the pool that is not excluded, not leased to someone else, and not one of the server's own */
function freeAddr(d: Dev, p: DhcpPool, mac: string, now: number) {
  const r = range(p);
  if (!r) return undefined;
  const used = new Set(
    activeBindings(d, now)
      .filter((b) => b.mac !== mac)
      .map((b) => b.ip),
  );
  for (const i of Object.values(d.ifaces)) if (i.ip) used.add(i.ip);
  for (let n = r.first; n <= r.last; n++) {
    const ip = n2ip(n);
    if (!isExcluded(d, ip) && !used.has(ip)) return ip;
  }
}
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtTime = (ms: number) => {
  const t = new Date(ms),
    p = (n: number) => String(n).padStart(2, "0");
  return `${MON[t.getMonth()]} ${p(t.getDate())} ${t.getFullYear()} ${p(t.getHours() % 12 || 12)}:${p(t.getMinutes())} ${t.getHours() < 12 ? "AM" : "PM"}`;
};
/** Client-ID = 01 + MAC, written aabb.ccdd.eeff.gg like IOS */
const clientId = (mac: string) =>
  ("01" + mac.replace(/\./g, "")).replace(/(.{4})(?=.)/g, "$1.");

/* ───────────── protocol: DISCOVER → OFFER → REQUEST → ACK ───────────── */
export interface DhcpLease {
  ip: string;
  mask: string;
  gw?: string;
  dns: string[];
  domain?: string;
  server: string;
  serverId: string;
}
export function dhcpDiscover(
  s: State,
  clientDev: string,
  ifn: string,
  fx: Fx[],
): DhcpLease | undefined {
  const mac = macOf(clientDev, ifn),
    now = Date.now();
  for (const e of l2domain(s, clientDev, ifn)) {
    const sd = s.devs[e.id],
      si = sd?.ifaces[e.port];
    if (e.id === clientDev || !sd?.dhcp || sd.dhcp.off || !si?.ip || !si.mask)
      continue;
    // the pool is chosen by the subnet of the interface the DISCOVER arrived on
    const entry = Object.entries(sd.dhcp.pools).find(
      ([, p]) => p.net && p.mask && netOf(si.ip!, p.mask) === p.net,
    );
    if (!entry) continue;
    const [name, p] = entry,
      prev = activeBindings(sd, now).find((b) => b.mac === mac && b.pool === name),
      ip = prev?.ip ?? freeAddr(sd, p, mac, now);
    if (!ip) continue; // pool exhausted
    const bind: DhcpBind = { ip, mac, pool: name, at: now, ms: leaseMs(p.lease) };
    fx.push((st) =>
      st.update(e.id, (x) => {
        x.bindings = [
          ...(x.bindings ?? []).filter((b) => b.mac !== mac && b.ip !== ip),
          bind,
        ];
      }),
    );
    return {
      ip,
      mask: p.mask!,
      gw: p.gw[0],
      dns: p.dns,
      domain: p.domain,
      server: si.ip,
      serverId: e.id,
    };
  }
}

/** VPC `ip dhcp` */
export function dhcpClient(c: Ctx, ifn = "eth0") {
  const me = c.dev.ifaces[ifn];
  if (!me) return c.out(`% No interface ${ifn}`);
  const fx: Fx[] = [],
    r = dhcpDiscover(c.view(), c.dev.id, ifn, fx);
  if (!r) return c.out("Can't find dhcp server");
  me.ip = r.ip;
  me.mask = r.mask;
  c.dev.gw = r.gw;
  c.fx.push(...fx);
  c.out(`DORA IP ${r.ip}/${maskLen(r.mask)}${r.gw ? ` GW ${r.gw}` : ""}`);
}
/** VPC `ip dhcp -r` */
export function dhcpRelease(c: Ctx, ifn = "eth0") {
  const me = c.dev.ifaces[ifn];
  if (!me) return;
  const mac = macOf(c.dev.id, ifn);
  for (const d of Object.values(c.view().devs))
    if (d.bindings?.some((b) => b.mac === mac))
      c.fx.push((st) =>
        st.update(d.id, (x) => {
          x.bindings = (x.bindings ?? []).filter((b) => b.mac !== mac);
        }),
      );
  me.ip = me.mask = undefined;
  c.dev.gw = undefined;
  c.out("DHCP release");
}

/* ───────────── global config ───────────── */
const exclude: H = (c, a) => {
  const [from, to = a[0]] = a;
  if (!isIp(from)) return c.bad(3);
  if (!isIp(to)) return c.bad(4);
  if (ip2n(to) < ip2n(from)) return c.out("% Invalid address range");
  const g = cfgOf(c);
  if (!g.excluded.some((e) => e.from === from && e.to === to))
    g.excluded.push({ from, to });
};
const unexclude: H = (c, a) => {
  const [from, to = a[0]] = a,
    g = cfgOf(c),
    n = g.excluded.length;
  g.excluded = g.excluded.filter((e) => !(e.from === from && e.to === to));
  if (g.excluded.length === n) c.out("% Address range not found");
};
export const dhcpGlobalX: E[] = [
  [
    "ip dhcp pool <name>",
    (c, a) => {
      cfgOf(c).pools[a[0]] ??= { dns: [], gw: [] };
      c.cli.mode = "config-dhcp";
      c.cli.pool = a[0];
      delete c.cli.ifs;
    },
    "Configure DHCP address pools",
  ],
  [
    "no ip dhcp pool <name>",
    (c, a) => {
      const g = cfgOf(c);
      if (!g.pools[a[0]]) return c.out(`% Pool ${a[0]} not found`);
      delete g.pools[a[0]];
      c.dev.bindings = (c.dev.bindings ?? []).filter((b) => b.pool !== a[0]);
    },
    "Delete a DHCP pool",
  ],
  ["ip dhcp excluded-address <a>", exclude, "Prevent DHCP from assigning certain addresses"],
  ["ip dhcp excluded-address <a> <b>", exclude, "…an address range"],
  ["no ip dhcp excluded-address <a>", unexclude],
  ["no ip dhcp excluded-address <a> <b>", unexclude],
  [
    "service dhcp",
    (c) => {
      cfgOf(c).off = false;
    },
    "Enable the DHCP server",
  ],
  [
    "no service dhcp",
    (c) => {
      cfgOf(c).off = true;
    },
    "Disable the DHCP server",
  ],
];

/* ───────────── config-dhcp mode ───────────── */
const withPool =
  (fn: (p: DhcpPool, c: Ctx, a: string[]) => void): H =>
  (c, a) => {
    const p = c.dev.dhcp?.pools[c.cli.pool ?? ""];
    if (!p) return c.out("% DHCP pool not found");
    fn(p, c, a);
  };
const ipList = (c: Ctx, a: string[]) => {
  const w = a[0].split(" "),
    i = w.findIndex((x) => !isIp(x));
  if (i >= 0) return void c.bad(1 + i);
  if (w.length > 8) return void c.bad(9);
  return w;
};
export const dhcpPoolX: E[] = [
  [
    "network <net> <mask>",
    withPool((p, c, a) => {
      if (!isIp(a[0])) return c.bad(1);
      if (!isMask(a[1])) return c.bad(2);
      p.net = netOf(a[0], a[1]);
      p.mask = a[1];
    }),
    "Network number and mask",
  ],
  [
    "default-router <*>",
    withPool((p, c, a) => {
      const l = ipList(c, a);
      if (l) p.gw = l;
    }),
    "Default routers (the clients' gateway)",
  ],
  [
    "dns-server <*>",
    withPool((p, c, a) => {
      const l = ipList(c, a);
      if (l) p.dns = l;
    }),
    "DNS servers",
  ],
  [
    "domain-name <name>",
    withPool((p, _c, a) => {
      p.domain = a[0];
    }),
    "Domain name for the client",
  ],
  [
    "lease <*>",
    withPool((p, c, a) => {
      const w = a[0].split(" ");
      if (/^inf/i.test(w[0])) return void (p.lease = "infinite");
      const n = w.map(Number),
        bad = n.findIndex((x) => !Number.isInteger(x) || x < 0);
      if (bad >= 0) return c.bad(1 + bad);
      if (n.length > 3) return c.bad(4);
      if (n.every((x) => x === 0)) return c.out("% Invalid lease time");
      p.lease = { d: n[0], h: n[1] ?? 0, m: n[2] ?? 0 };
    }),
    "Lease: <days> [hours] [minutes] | infinite",
  ],
  ["no network", withPool((p) => { p.net = p.mask = undefined; })],
  ["no default-router", withPool((p) => { p.gw = []; })],
  ["no dns-server", withPool((p) => { p.dns = []; })],
  ["no domain-name", withPool((p) => { p.domain = undefined; })],
  ["no lease", withPool((p) => { p.lease = undefined; })],
];

/* ───────────── show / clear ───────────── */
const HDR = [
  "Bindings from all pools not associated with VRF:",
  "IP address      Client-ID/              Lease expiration        Type",
  "                Hardware address/",
  "                User name",
];
const bindLine = (b: DhcpBind) =>
  `${b.ip.padEnd(16)}${clientId(b.mac).padEnd(24)}${(b.ms < 0 ? "Infinite" : fmtTime(b.at + b.ms)).padEnd(24)}Automatic`;

const showBind: H = (c, a) => {
  const arg = (a[0] ?? "").trim(),
    rows = activeBindings(c.dev).sort((x, y) => ip2n(x.ip) - ip2n(y.ip)),
    L = rows.map((b) => ({ b, t: bindLine(b) }));
  if (!arg) return c.out(...HDR, ...L.map((x) => x.t));
  if (isIp(arg))
    return c.out(...HDR, ...L.filter((x) => x.b.ip === arg).map((x) => x.t));
  // `| include <text>` / `| exclude <text>` — matches the line text or the plain MAC
  const m = /^\|\s*(i\w*|e\w*)\s+(.+)$/i.exec(arg);
  if (!m || !/^(i|e)/i.test(m[1])) return c.bad(4);
  const inc = m[1][0].toLowerCase() === "i",
    q = m[2].trim().toLowerCase();
  c.out(
    ...L.filter(
      (x) => (x.t + " " + x.b.mac).toLowerCase().includes(q) === inc,
    ).map((x) => x.t),
  );
};
const showPool: H = (c, a) => {
  const g = c.dev.dhcp,
    names = a[0] ? [a[0]] : Object.keys(g?.pools ?? {}),
    now = Date.now();
  for (const n of names) {
    const p = g?.pools[n];
    if (!p) {
      c.out(`% Pool ${n} not found`);
      continue;
    }
    const r = range(p),
      leased = activeBindings(c.dev, now).filter((b) => b.pool === n).length,
      idx = freeAddr(c.dev, p, "", now) ?? "0.0.0.0";
    c.out(
      `Pool ${n} :`,
      " Utilization mark (high/low)    : 100 / 0",
      " Subnet size (first/next)       : 0 / 0 ",
      ` Total addresses                : ${r?.total ?? 0}`,
      ` Leased addresses               : ${leased}`,
      " Pending event                  : none",
      ` ${r ? 1 : 0} subnet is currently in the pool :`,
      ...(r
        ? [
            " Current index        IP address range                    Leased addresses",
            ` ${idx.padEnd(21)}${n2ip(r.first).padEnd(17)}- ${n2ip(r.last).padEnd(16)}${leased}`,
          ]
        : []),
      "",
    );
  }
};
const clearBind: H = (c, a) => {
  const x = a[0];
  if (x === "*") {
    c.dev.bindings = [];
    return;
  }
  if (!isIp(x)) return c.bad(4);
  const n = (c.dev.bindings ?? []).length;
  c.dev.bindings = (c.dev.bindings ?? []).filter((b) => b.ip !== x);
  if (c.dev.bindings.length === n) c.out("% Binding not found");
};
export const dhcpPrivX: E[] = [
  ["show ip dhcp pool", showPool, "DHCP pools and utilisation"],
  ["show ip dhcp pool <name>", showPool],
  ["show ip dhcp binding", showBind, "Active leases (MAC ↔ IP ↔ expiry)"],
  ["show ip dhcp binding <*>", showBind, "<ip> or | include <ip|mac>"],
  ["clear ip dhcp binding <x>", clearBind, "Clear one binding (<ip>) or all (*)"],
];

/* ───────────── running-config ───────────── */
export function renderDhcp(d: Dev): string[] {
  const g = d.dhcp;
  if (!g) return [];
  const L: string[] = [];
  if (g.off) L.push("no service dhcp", "!");
  for (const e of g.excluded)
    L.push(`ip dhcp excluded-address ${e.from}${e.to !== e.from ? " " + e.to : ""}`);
  if (g.excluded.length) L.push("!");
  for (const [n, p] of Object.entries(g.pools)) {
    L.push(`ip dhcp pool ${n}`);
    if (p.net) L.push(` network ${p.net} ${p.mask}`);
    if (p.gw.length) L.push(` default-router ${p.gw.join(" ")}`);
    if (p.dns.length) L.push(` dns-server ${p.dns.join(" ")}`);
    if (p.domain) L.push(` domain-name ${p.domain}`);
    if (p.lease)
      L.push(
        p.lease === "infinite"
          ? " lease infinite"
          : ` lease ${p.lease.d} ${p.lease.h}${p.lease.m ? " " + p.lease.m : ""}`,
      );
    L.push("!");
  }
  return L;
}