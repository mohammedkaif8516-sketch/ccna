/**
 * Vpn.tsx — site-to-site VPNs between two routers.
 *
 *  • GRE tunnel        interface tunnel N · tunnel source/destination · tunnel mode gre ip
 *  • IPsec VTI         tunnel mode ipsec ipv4 · tunnel protection ipsec profile P
 *  • IPsec crypto map  crypto isakmp policy/key · crypto ipsec transform-set · crypto map … · crypto map X on the interface
 *
 * Forwarding (hooks.tun in route()): the packet jumps to the far router; the underlay between the two public
 * addresses is routed by a nested route() call, so a missing ISP route or a blocking ACL kills the tunnel.
 * IPsec only works if BOTH sides match: ISAKMP policy (enc/hash/auth/group), pre-shared key for each other's
 * address, transform-set, and (crypto map) peer address + mirrored ACL. `show crypto isakmp sa` fills in once
 * interesting traffic has flowed. Dynamic routing across the tunnel is not simulated — use static routes.
 */
import {
  type Ctx,
  type Dev,
  type E,
  type H,
  type Iface,
  type Peer,
  type Pkt,
  type State,
  type Fx,
  hooks,
  route,
  findIf,
  ifUp,
  isIp,
} from "@/components/simulator/netsim";
import { aclPermits } from "./Acl";

const noop: H = () => {};
const cr = (c: Ctx) =>
  (c.dev.crypto ??= { policies: [], keys: [], ts: {}, maps: [], profiles: {} });

/* ───────────── forwarding ───────────── */
const ownerOf = (s: State, ip: string) => {
  for (const d of Object.values(s.devs))
    for (const [n, i] of Object.entries(d.ifaces))
      if (i.ip === ip && !n.startsWith("Tunnel") && ifUp(s, d.id, n)) return { d, n };
};
const tunSrc = (d: Dev, t: NonNullable<Iface["tun"]>) =>
  t.src ? (isIp(t.src) ? t.src : d.ifaces[t.src]?.ip) : undefined;
const count = (fx: Fx[], id: string, peer: string, k: "enc" | "dec") =>
  fx.push((st) =>
    st.update(id, (x) => {
      const r = ((x.rt ??= {}).ipsec ??= {});
      (r[peer] ??= { enc: 0, dec: 0 })[k]++;
    }),
  );
/** undefined = both ends agree; otherwise the reason negotiation fails */
function chk(a: Dev, b: Dev, aPeer: string, bPeer: string, tsA?: string, tsB?: string) {
  const x = a.crypto,
    y = b.crypto;
  if (!x || !y) return "no crypto configuration";
  if (!x.policies.some((p) => y.policies.some((q) => p.enc === q.enc && p.hash === q.hash && p.auth === q.auth && p.group === q.group)))
    return "ISAKMP policy mismatch";
  const ka = x.keys.find((k) => k.peer === aPeer),
    kb = y.keys.find((k) => k.peer === bPeer);
  if (!ka || !kb || ka.key !== kb.key) return "pre-shared key mismatch";
  const sa = tsA && x.ts[tsA],
    sb = tsB && y.ts[tsB];
  if (!sa || !sb || sa !== sb) return "transform-set mismatch";
}
function gre(s: State, d: Dev, i: Iface, fx: Fx[]): Peer | "drop" {
  const t = i.tun!,
    me = tunSrc(d, t);
  if (!me || !t.dst) return "drop";
  const ow = ownerOf(s, t.dst);
  if (!ow) return "drop";
  const pd = ow.d,
    back = Object.entries(pd.ifaces).find(([n, x]) => n.startsWith("Tunnel") && x.tun?.dst === me);
  if (!back || !ifUp(s, pd.id, back[0])) return "drop";
  const prot = t.mode === "ipsec";
  if (prot) {
    const bt = back[1].tun!;
    if (bt.mode !== "ipsec" || chk(d, pd, t.dst, me, d.crypto?.profiles[t.prof ?? ""]?.ts, pd.crypto?.profiles[bt.prof ?? ""]?.ts))
      return "drop";
  }
  if (route(s, d.id, t.dst, 255, fx, { proto: prot ? "esp" : "gre" }).status !== "ok") return "drop";
  if (prot) {
    count(fx, d.id, t.dst, "enc");
    count(fx, pd.id, me, "dec");
  }
  return { id: pd.id, port: back[0] };
}
function cmap(s: State, d: Dev, i: Iface, p: Pkt, fx: Fx[]): Peer | "drop" | undefined {
  const m = (d.crypto?.maps ?? [])
    .filter((e) => e.name === i.cmap)
    .sort((a, b) => a.seq - b.seq)
    .find((e) => e.acl && aclPermits(d, e.acl, p, [])); // "interesting traffic"
  if (!m || !m.peer || !m.ts) return; // not interesting / incomplete map → sent in clear, like IOS
  const me = i.ip;
  if (!me) return "drop";
  const ow = ownerOf(s, m.peer);
  if (!ow) return "drop";
  const pd = ow.d,
    rev: Pkt = { ...p, src: p.dst, dst: p.src, sport: p.dport, dport: p.sport },
    pm = (pd.crypto?.maps ?? []).find(
      (x) => x.name === pd.ifaces[ow.n].cmap && x.peer === me && x.acl && aclPermits(pd, x.acl, rev, []),
    );
  if (!pm || chk(d, pd, m.peer, me, m.ts, pm.ts)) return "drop";
  if (route(s, d.id, m.peer, 255, fx, { proto: "esp" }).status !== "ok") return "drop";
  count(fx, d.id, m.peer, "enc");
  count(fx, pd.id, me, "dec");
  return { id: pd.id, port: ow.n };
}
const tunHook = (s: State, d: Dev, outIf: string, p: Pkt, fx: Fx[]) => {
  const i = d.ifaces[outIf];
  if (i?.tun) return gre(s, d, i, fx);
  if (i?.cmap) return cmap(s, d, i, p, fx);
};
if (!hooks.tun.includes(tunHook as never)) hooks.tun.push(tunHook as never);

/* ───────────── global config ───────────── */
const pol = (c: Ctx) => c.dev.crypto?.policies.find((p) => p.n === +(c.cli.ctx ?? ""));
const cmEntry = (c: Ctx) => {
  const [n, q] = (c.cli.ctx ?? "|").split("|");
  return c.dev.crypto?.maps.find((m) => m.name === n && m.seq === +q);
};
export const vpnGlobalX: E[] = [
  [
    "crypto isakmp policy <n>",
    (c, a) => {
      const n = +a[0];
      if (!(n >= 1 && n <= 10000)) return c.bad(3);
      const k = cr(c);
      if (!k.policies.some((p) => p.n === n))
        k.policies.push({ n, enc: "des", hash: "sha", auth: "rsa-sig", group: 1 });
      k.policies.sort((x, y) => x.n - y.n);
      c.cli.mode = "config-isakmp";
      c.cli.ctx = a[0];
      delete c.cli.ifs;
    },
    "IKE phase-1 policy",
  ],
  [
    "crypto isakmp key <key> address <ip>",
    (c, a) => {
      if (!isIp(a[1])) return c.bad(5);
      const k = cr(c);
      k.keys = k.keys.filter((x) => x.peer !== a[1]).concat({ peer: a[1], key: a[0] });
    },
    "Pre-shared key for a peer address",
  ],
  [
    "no crypto isakmp key <key> address <ip>",
    (c, a) => { const k = cr(c); k.keys = k.keys.filter((x) => x.peer !== a[1]); },
  ],
  [
    "crypto ipsec transform-set <name> <*>",
    (c, a) => {
      cr(c).ts[a[0]] = a[1].toLowerCase();
      c.cli.mode = "config-crypto-trans";
      c.cli.ctx = a[0];
      delete c.cli.ifs;
    },
    "e.g. esp-aes esp-sha-hmac",
  ],
  [
    "crypto map <name> <seq> ipsec-isakmp",
    (c, a) => {
      const k = cr(c),
        q = +a[1];
      if (!(q >= 1)) return c.bad(3);
      if (!k.maps.some((m) => m.name === a[0] && m.seq === q)) k.maps.push({ name: a[0], seq: q });
      c.cli.mode = "config-crypto-map";
      c.cli.ctx = `${a[0]}|${q}`;
      delete c.cli.ifs;
      c.out("% NOTE: This new crypto map will remain disabled until a peer and a valid access list have been configured.");
    },
    "Crypto map entry (phase 2)",
  ],
  [
    "crypto ipsec profile <name>",
    (c, a) => {
      cr(c).profiles[a[0]] ??= {};
      c.cli.mode = "config-ipsec-profile";
      c.cli.ctx = a[0];
      delete c.cli.ifs;
    },
    "IPsec profile (for tunnel protection)",
  ],
];

/* ───────────── sub-modes ───────────── */
const ENCS = ["des", "3des", "aes", "aes 128", "aes 192", "aes 256"];
export const isakmpX: E[] = [
  [
    "encryption <*>",
    (c, a) => {
      const e = a[0].toLowerCase() === "aes" ? "aes 128" : a[0].toLowerCase();
      if (!ENCS.includes(e)) return c.bad(1);
      const p = pol(c);
      if (p) p.enc = e;
    },
    "des | 3des | aes [128|192|256]",
  ],
  [
    "hash <h>",
    (c, a) => {
      if (!["sha", "md5"].includes(a[0])) return c.bad(1);
      const p = pol(c);
      if (p) p.hash = a[0];
    },
    "sha | md5",
  ],
  [
    "authentication <a>",
    (c, a) => {
      if (!["pre-share", "rsa-sig", "rsa-encr"].includes(a[0])) return c.bad(1);
      const p = pol(c);
      if (p) p.auth = a[0];
    },
    "pre-share | rsa-sig",
  ],
  [
    "group <g>",
    (c, a) => {
      if (![1, 2, 5, 14, 19, 20, 24].includes(+a[0])) return c.bad(1);
      const p = pol(c);
      if (p) p.group = +a[0];
    },
    "Diffie-Hellman group",
  ],
  ["lifetime <s>", noop, "SA lifetime (seconds)"],
];
export const transX: E[] = [["mode <m>", noop, "tunnel | transport"]];
export const cmapX: E[] = [
  [
    "set peer <ip>",
    (c, a) => {
      if (!isIp(a[0])) return c.bad(2);
      const m = cmEntry(c);
      if (m) m.peer = a[0];
    },
    "Peer address",
  ],
  [
    "set transform-set <name>",
    (c, a) => {
      const m = cmEntry(c);
      if (!m) return;
      if (!c.dev.crypto?.ts[a[0]]) c.out(`% Transform set ${a[0]} does not exist yet`);
      m.ts = a[0];
    },
    "Transform-set to use",
  ],
  [
    "match address <acl>",
    (c, a) => {
      const m = cmEntry(c);
      if (m) m.acl = a[0];
    },
    "ACL that selects the traffic to protect",
  ],
  ["set <*>", noop], // pfs, security-association lifetime …
];
export const profX: E[] = [
  [
    "set transform-set <name>",
    (c, a) => {
      const p = c.dev.crypto?.profiles[c.cli.ctx ?? ""];
      if (p) p.ts = a[0];
    },
    "Transform-set to use",
  ],
  ["set <*>", noop],
];

/* ───────────── interface commands ───────────── */
const tn = (c: Ctx) => {
  const n = c.cli.ifs![0];
  if (!n.startsWith("Tunnel")) {
    c.out("% This command only works on a tunnel interface");
    return undefined;
  }
  return (c.dev.ifaces[n].tun ??= { mode: "gre" });
};
export const vpnIfX: E[] = [
  [
    "crypto map <name>",
    (c, a) => c.cli.ifs!.forEach((n) => { c.dev.ifaces[n].cmap = a[0]; }),
    "Apply a crypto map to this interface",
  ],
  ["no crypto map", (c) => c.cli.ifs!.forEach((n) => { c.dev.ifaces[n].cmap = undefined; })],
  ["no crypto map <name>", (c) => c.cli.ifs!.forEach((n) => { c.dev.ifaces[n].cmap = undefined; })],
  [
    "tunnel source <x>",
    (c, a) => {
      const t = tn(c);
      if (!t) return;
      const f = isIp(a[0]) ? a[0] : findIf(c.dev, a[0]);
      if (!f) return c.bad(2);
      t.src = f;
    },
    "Tunnel source: interface or address",
  ],
  [
    "tunnel destination <ip>",
    (c, a) => {
      const t = tn(c);
      if (!t) return;
      if (!isIp(a[0])) return c.bad(2);
      t.dst = a[0];
    },
    "Tunnel destination address",
  ],
  ["tunnel mode gre ip", (c) => { const t = tn(c); if (t) t.mode = "gre"; }, "GRE over IPv4"],
  ["tunnel mode ipsec ipv4", (c) => { const t = tn(c); if (t) t.mode = "ipsec"; }, "IPsec VTI over IPv4"],
  [
    "tunnel protection ipsec profile <name>",
    (c, a) => { const t = tn(c); if (t) t.prof = a[0]; },
    "Protect the tunnel with an IPsec profile",
  ],
  ["tunnel <*>", noop],
  ["keepalive <*>", noop],
];

/* ───────────── show ───────────── */
const DH: Record<number, string> = { 1: "#1 (768 bit)", 2: "#2 (1024 bit)", 5: "#5 (1536 bit)", 14: "#14 (2048 bit)" };
const showPolicy: H = (c) => {
  const ps = c.dev.crypto?.policies ?? [];
  c.out(
    ...ps.flatMap((p) => [
      `Protection suite of priority ${p.n}`,
      `\tencryption algorithm:\t${p.enc.toUpperCase()}`,
      `\thash algorithm:\t\t${p.hash === "sha" ? "Secure Hash Standard" : "Message Digest 5"}`,
      `\tauthentication method:\t${p.auth === "pre-share" ? "Pre-Shared Key" : "Rivest-Shamir-Adleman Signature"}`,
      `\tDiffie-Hellman group:\t${DH[p.group] ?? "#" + p.group}`,
      "\tlifetime:\t\t86400 seconds, no volume limit",
    ]),
    "Default protection suite",
    "\tencryption algorithm:\tDES - Data Encryption Standard (56 bit keys).",
    "\thash algorithm:\t\tSecure Hash Standard",
    "\tauthentication method:\tRivest-Shamir-Adleman Signature",
    "\tDiffie-Hellman group:\t#1 (768 bit)",
    "\tlifetime:\t\t86400 seconds, no volume limit",
  );
};
/** local address that talks to `peer` (from a crypto map or a tunnel) and the interface it sits on */
function local(d: Dev, peer: string): { ip: string; ifn: string; tag?: string } | undefined {
  for (const [n, i] of Object.entries(d.ifaces)) {
    if (i.tun?.dst === peer && i.tun.mode === "ipsec") return { ip: tunSrc(d, i.tun) ?? "?", ifn: n };
    const m = i.cmap && d.crypto?.maps.find((x) => x.name === i.cmap && x.peer === peer);
    if (m && i.ip) return { ip: i.ip, ifn: n, tag: m.name };
  }
}
const showIsakmpSa: H = (c) => {
  const L = ["IPv4 Crypto ISAKMP SA", "dst             src             state          conn-id status"];
  Object.keys(c.dev.rt?.ipsec ?? {}).forEach((peer, k) => {
    const l = local(c.dev, peer);
    if (l) L.push(`${peer.padEnd(16)}${l.ip.padEnd(16)}${"QM_IDLE".padEnd(15)}${String(1001 + k).padStart(7)} ACTIVE`);
  });
  c.out(...L, "", "IPv6 Crypto ISAKMP SA");
};
const showIpsecSa: H = (c) => {
  const L: string[] = [];
  for (const [peer, n] of Object.entries(c.dev.rt?.ipsec ?? {})) {
    const l = local(c.dev, peer);
    if (!l) continue;
    L.push(
      `interface: ${l.ifn}`,
      l.tag ? `    Crypto map tag: ${l.tag}, local addr ${l.ip}` : `    Tunnel protection, local addr ${l.ip}`,
      "",
      `   current_peer ${peer} port 500`,
      `    #pkts encaps: ${n.enc}, #pkts encrypt: ${n.enc}, #pkts digest: ${n.enc}`,
      `    #pkts decaps: ${n.dec}, #pkts decrypt: ${n.dec}, #pkts verify: ${n.dec}`,
      "",
    );
  }
  c.out(...(L.length ? L : ["No active IPsec SAs (send interesting traffic first)"]));
};
const showMap: H = (c) => {
  const k = c.dev.crypto;
  for (const m of k?.maps ?? [])
    c.out(
      `Crypto Map "${m.name}" ${m.seq} ipsec-isakmp`,
      `\tPeer = ${m.peer ?? "(none)"}`,
      `\tExtended IP access list ${m.acl ?? "(none)"}`,
      `\tTransform sets={ ${m.ts ? `${m.ts}: { ${k?.ts[m.ts] ?? "?"} }` : "(none)"} }`,
      `\tInterfaces using crypto map ${m.name}:`,
      ...Object.entries(c.dev.ifaces).filter(([, i]) => i.cmap === m.name).map(([n]) => `\t\t${n}`),
      "",
    );
};
export const vpnPrivX: E[] = [
  ["show crypto isakmp policy", showPolicy, "IKE policies"],
  ["show crypto isakmp sa", showIsakmpSa, "IKE security associations"],
  ["show crypto ipsec sa", showIpsecSa, "IPsec security associations"],
  ["show crypto map", showMap, "Crypto map configuration"],
];

/* ───────────── running-config ───────────── */
export function renderCrypto(d: Dev): string[] {
  const k = d.crypto,
    L: string[] = [];
  if (!k) return L;
  for (const p of k.policies) {
    L.push(`crypto isakmp policy ${p.n}`);
    if (p.enc !== "des") L.push(` encryption ${p.enc === "aes 128" ? "aes" : p.enc}`);
    if (p.hash !== "sha") L.push(` hash ${p.hash}`);
    L.push(` authentication ${p.auth}`);
    if (p.group !== 1) L.push(` group ${p.group}`);
    L.push("!");
  }
  for (const x of k.keys) L.push(`crypto isakmp key ${x.key} address ${x.peer}`);
  if (k.keys.length) L.push("!");
  for (const [n, spec] of Object.entries(k.ts)) L.push(`crypto ipsec transform-set ${n} ${spec}`, " mode tunnel", "!");
  for (const [n, p] of Object.entries(k.profiles))
    L.push(`crypto ipsec profile ${n}`, ...(p.ts ? [` set transform-set ${p.ts}`] : []), "!");
  for (const m of k.maps)
    L.push(
      `crypto map ${m.name} ${m.seq} ipsec-isakmp`,
      ...(m.peer ? [` set peer ${m.peer}`] : []),
      ...(m.ts ? [` set transform-set ${m.ts}`] : []),
      ...(m.acl ? [` match address ${m.acl}`] : []),
      "!",
    );
  return L;
}
export const ifVpn = (i: Iface): string[] => {
  const L: string[] = [];
  if (i.tun) {
    if (i.tun.src) L.push(` tunnel source ${i.tun.src}`);
    if (i.tun.dst) L.push(` tunnel destination ${i.tun.dst}`);
    if (i.tun.mode === "ipsec") L.push(" tunnel mode ipsec ipv4");
    if (i.tun.prof) L.push(` tunnel protection ipsec profile ${i.tun.prof}`);
  }
  if (i.cmap) L.push(` crypto map ${i.cmap}`);
  return L;
};
