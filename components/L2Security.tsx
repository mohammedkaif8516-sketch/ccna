/**
 * L2Security.tsx — port-security and DHCP snooping for the switches.
 *
 * Port-security: checked in route() (hooks.l2) for every frame entering an access port. Allowed MACs =
 * static + sticky (saved in config) + dynamic (runtime). Over the limit → violation: shutdown puts the port in
 * err-disabled (recover with `shutdown` then `no shutdown`), restrict drops + counts, protect drops silently.
 *
 * DHCP snooping: a DHCP offer only passes through a switch (on a snooped VLAN) if it enters on a TRUSTED port,
 * and the switch records a binding (MAC, IP, VLAN, port). Used by dhcpDiscover() in Dhcp.tsx.
 */
import {
  type Ctx,
  type Dev,
  type E,
  type H,
  type Hop,
  type Iface,
  type State,
  type Fx,
  hooks,
  ifUp,
  findIf,
  shortIf,
  stamp,
  parseVlans,
  rangeStr,
  macColon,
} from "./netsim";

const noop: H = () => {};
const MAC = /^[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}$/i;
type Ps = NonNullable<Iface["ps"]>;

/* ───────────── port-security: enforcement ───────────── */
const guard = (s: State, sw: string, port: string, mac: string, fx: Fx[]): boolean => {
  const d = s.devs[sw],
    ps = d?.ifaces[port]?.ps;
  if (!ps) return true;
  const dyn = d.rt?.secMacs?.[port] ?? [];
  if (ps.macs.includes(mac) || ps.learned.includes(mac) || dyn.includes(mac)) return true;
  if (ps.macs.length + ps.learned.length + dyn.length < ps.max) {
    fx.push((st) =>
      st.update(sw, (x) => {
        const p = x.ifaces[port].ps;
        if (!p) return;
        if (p.sticky) {
          if (!p.learned.includes(mac)) p.learned.push(mac);
        } else {
          const m = ((x.rt ??= {}).secMacs ??= {});
          m[port] ??= [];
          if (!m[port].includes(mac)) m[port].push(mac);
        }
      }),
    );
    return true;
  }
  fx.push((st) =>
    st.update(sw, (x) => {
      const rt = (x.rt ??= {}),
        v = (rt.psViol ??= {}),
        sh = shortIf(port);
      if (ps.violation !== "protect") v[port] = (v[port] ?? 0) + 1;
      if (ps.violation === "shutdown") {
        const e = (rt.errdis ??= []);
        if (!e.includes(port)) {
          e.push(port);
          x.session.lines.push(
            `${stamp()}: %PM-4-ERR_DISABLE: psecure-violation error detected on ${sh}, putting ${sh} in err-disable state`,
            `${stamp()}: %PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address ${mac} on port ${sh}.`,
          );
        }
      } else if (ps.violation === "restrict" && v[port] === 1)
        x.session.lines.push(
          `${stamp()}: %PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address ${mac} on port ${sh}.`,
        );
    }),
  );
  return false;
};
if (!hooks.l2.includes(guard as never)) hooks.l2.push(guard as never);

/* ───────────── port-security: config ───────────── */
const ps = (c: Ctx, fn: (p: Ps) => void) =>
  c.cli.ifs!.forEach((n) => {
    const i = c.dev.ifaces[n];
    i.ps ??= { max: 1, violation: "shutdown", sticky: false, macs: [], learned: [] };
    fn(i.ps);
  });
const needAccess = (c: Ctx) => {
  const bad = c.cli.ifs!.find((n) => c.dev.ifaces[n].mode !== "access");
  if (!bad) return false;
  c.out(`% Command rejected: ${shortIf(bad)} is a ${c.dev.ifaces[bad].mode === "trunk" ? "trunk" : "dynamic"} port.`);
  return true;
};
const guarded = (fn: (c: Ctx, a: string[]) => void): H => (c, a) => {
  if (!needAccess(c)) fn(c, a);
};
export const psIfX: E[] = [
  ["switchport port-security", guarded((c) => ps(c, () => {})), "Enable port security"],
  [
    "switchport port-security maximum <n>",
    guarded((c, a) => {
      const n = +a[0];
      if (!(n >= 1 && n <= 132)) return c.bad(3);
      ps(c, (p) => { p.max = n; });
    }),
    "Maximum secure MAC addresses",
  ],
  ...(["shutdown", "restrict", "protect"] as const).map<E>((v) => [
    `switchport port-security violation ${v}`,
    guarded((c) => ps(c, (p) => { p.violation = v; })),
    `Violation mode: ${v}`,
  ]),
  [
    "switchport port-security mac-address sticky",
    guarded((c) => ps(c, (p) => { p.sticky = true; })),
    "Learn MACs and save them in the running-config",
  ],
  [
    "switchport port-security mac-address <mac>",
    guarded((c, a) => {
      if (!MAC.test(a[0])) return c.bad(3);
      ps(c, (p) => { if (!p.macs.includes(a[0].toLowerCase())) p.macs.push(a[0].toLowerCase()); });
    }),
    "Static secure MAC address (xxxx.xxxx.xxxx)",
  ],
  [
    "no switchport port-security",
    (c) => c.cli.ifs!.forEach((n) => { c.dev.ifaces[n].ps = undefined; }),
    "Disable port security",
  ],
  [
    "no switchport port-security mac-address sticky",
    (c) => ps(c, (p) => { p.sticky = false; }),
  ],
  ["switchport port-security <*>", noop], // aging …
];

/* ───────────── port-security: show ───────────── */
const secured = (d: Dev) => Object.entries(d.ifaces).filter(([, i]) => i.ps) as [string, Iface][];
const total = (d: Dev, n: string, p: Ps) =>
  p.macs.length + p.learned.length + (d.rt?.secMacs?.[n]?.length ?? 0);
const showPs: H = (c) => {
  const d = c.dev;
  c.out(
    "Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action",
    "                (Count)       (Count)          (Count)",
    "--------------------------------------------------------------------",
    ...secured(d).map(
      ([n, i]) =>
        `${shortIf(n).padStart(12)}${String(i.ps!.max).padStart(15)}${String(total(d, n, i.ps!)).padStart(13)}${String(d.rt?.psViol?.[n] ?? 0).padStart(19)}${(i.ps!.violation[0].toUpperCase() + i.ps!.violation.slice(1)).padStart(17)}`,
    ),
    "----------------------------------------------------------------------",
    "Max Addresses limit in System (excluding one mac per port) : 4096",
  );
};
const showPsIf: H = (c, a) => {
  const n = findIf(c.dev, a[0]);
  if (!n) return c.bad(3);
  const d = c.dev,
    p = d.ifaces[n].ps;
  if (!p) return c.out("Port Security              : Disabled");
  const v = c.view();
  c.out(
    "Port Security              : Enabled",
    `Port Status                : ${d.rt?.errdis?.includes(n) ? "Secure-shutdown" : ifUp(v, d.id, n) ? "Secure-up" : "Secure-down"}`,
    `Violation Mode             : ${p.violation[0].toUpperCase() + p.violation.slice(1)}`,
    "Aging Time                 : 0 mins",
    "Aging Type                 : Absolute",
    "SecureStatic Address Aging : Disabled",
    `Maximum MAC Addresses      : ${p.max}`,
    `Total MAC Addresses        : ${total(d, n, p)}`,
    `Configured MAC Addresses   : ${p.macs.length}`,
    `Sticky MAC Addresses       : ${p.learned.length}`,
    "Last Source Address:Vlan   : 0000.0000.0000:0",
    `Security Violation Count   : ${d.rt?.psViol?.[n] ?? 0}`,
  );
};
const showPsAddr: H = (c) => {
  const d = c.dev,
    L = [
      "          Secure Mac Address Table",
      "-----------------------------------------------------------------------------",
      "Vlan    Mac Address       Type                          Ports   Remaining Age",
      "                                                                   (mins)",
      "----    -----------       ----                          -----   -------------",
    ];
  for (const [n, i] of secured(d)) {
    const v = String(i.vlan ?? 1).padStart(4),
      row = (m: string, t: string) => L.push(`${v}    ${m}    ${t.padEnd(30)}${shortIf(n).padEnd(8)}-`);
    i.ps!.macs.forEach((m) => row(m, "SecureConfigured"));
    i.ps!.learned.forEach((m) => row(m, "SecureSticky"));
    (d.rt?.secMacs?.[n] ?? []).forEach((m) => row(m, "SecureDynamic"));
  }
  c.out(...L);
};

/* ───────────── DHCP snooping ───────────── */
export const snoopOn = (d: Dev, vlan: number) =>
  !!d.snoop?.on && parseVlans(d.snoop.vlans).includes(vlan);
/** hops are listed client → server; the offer enters each switch through `outPort`, which must be trusted */
export function snoopOk(s: State, path: Hop[]) {
  return path.every((h) => {
    const d = s.devs[h.sw];
    return !snoopOn(d, h.vlan) || !h.outPort || !!d.ifaces[h.outPort]?.snoopTrust;
  });
}
export function snoopRecord(s: State, path: Hop[], mac: string, ip: string, ms: number, fx: Fx[]) {
  const now = Date.now();
  for (const h of path) {
    if (!h.inPort || !snoopOn(s.devs[h.sw], h.vlan)) continue;
    fx.push((st) =>
      st.update(h.sw, (x) => {
        const t = ((x.rt ??= {}).snoopB ??= []).filter((b) => b.mac !== mac);
        t.push({ mac, ip, vlan: h.vlan, port: h.inPort!, at: now, ms });
        x.rt.snoopB = t;
      }),
    );
  }
}
const sn = (c: Ctx) => (c.dev.snoop ??= { on: false, vlans: "" });
export const snoopGlobalX: E[] = [
  ["ip dhcp snooping", (c) => { sn(c).on = true; }, "Enable DHCP snooping"],
  ["no ip dhcp snooping", (c) => { sn(c).on = false; }, "Disable DHCP snooping"],
  [
    "ip dhcp snooping vlan <*>",
    (c, a) => {
      const v = parseVlans(a[0].replace(/\s+/g, ""));
      if (!v.length) return c.bad(4);
      const t = sn(c);
      t.vlans = rangeStr([...parseVlans(t.vlans), ...v]);
    },
    "Snoop these VLANs (10,20 | 10-12)",
  ],
  [
    "no ip dhcp snooping vlan <*>",
    (c, a) => {
      const t = sn(c),
        rm = parseVlans(a[0].replace(/\s+/g, ""));
      t.vlans = rangeStr(parseVlans(t.vlans).filter((x) => !rm.includes(x)));
    },
  ],
  ["ip dhcp snooping <*>", noop], // information option, verify mac-address …
  ["no ip dhcp snooping <*>", noop],
];
export const snoopIfX: E[] = [
  [
    "ip dhcp snooping trust",
    (c) => c.cli.ifs!.forEach((n) => { c.dev.ifaces[n].snoopTrust = true; }),
    "Trust DHCP server messages on this port",
  ],
  [
    "no ip dhcp snooping trust",
    (c) => c.cli.ifs!.forEach((n) => { c.dev.ifaces[n].snoopTrust = undefined; }),
  ],
  ["ip dhcp snooping limit rate <n>", noop],
];
const showSnoop: H = (c) => {
  const d = c.dev,
    v = d.snoop?.vlans && d.snoop.vlans !== "none" ? d.snoop.vlans : "";
  c.out(
    `Switch DHCP snooping is ${d.snoop?.on ? "enabled" : "disabled"}`,
    "DHCP snooping is configured on following VLANs:",
    v || "none",
    "DHCP snooping is operational on following VLANs:",
    d.snoop?.on ? v || "none" : "none",
    "",
    "Interface                  Trusted    Rate limit (pps)",
    "-----------------------    -------    ----------------",
    ...Object.entries(d.ifaces)
      .filter(([n]) => !/^(Vlan|Loopback|Port-channel)/.test(n))
      .map(([n, i]) => `${n.padEnd(27)}${(i.snoopTrust ? "yes" : "no").padEnd(11)}unlimited`),
  );
};
const showSnoopBind: H = (c) => {
  const rows = c.dev.rt?.snoopB ?? [],
    now = Date.now();
  c.out(
    "MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface",
    "------------------  ---------------  ----------  -------------  ----  --------------------",
    ...rows.map(
      (b) =>
        `${macColon(b.mac).toUpperCase().padEnd(20)}${b.ip.padEnd(17)}${String(b.ms < 0 ? "infinite" : Math.max(0, Math.round((b.at + b.ms - now) / 1000))).padEnd(12)}${"dhcp-snooping".padEnd(15)}${String(b.vlan).padEnd(6)}${b.port}`,
    ),
    `Total number of bindings: ${rows.length}`,
  );
};
export const l2secPrivX: E[] = [
  ["show port-security", showPs, "Show secure port information"],
  ["show port-security interface <if>", showPsIf],
  ["show port-security address", showPsAddr],
  ["show ip dhcp snooping", showSnoop, "DHCP snooping configuration"],
  ["show ip dhcp snooping binding", showSnoopBind, "DHCP snooping binding table"],
];

/* ───────────── running-config ───────────── */
export const renderSnoop = (d: Dev): string[] => {
  const t = d.snoop;
  if (!t) return [];
  const L: string[] = [];
  if (t.vlans && t.vlans !== "none") L.push(`ip dhcp snooping vlan ${t.vlans}`);
  if (t.on) L.push("ip dhcp snooping");
  if (L.length) L.push("!");
  return L;
};
export const ifL2sec = (i: Iface): string[] => {
  const L: string[] = [],
    p = i.ps;
  if (p) {
    L.push(" switchport port-security");
    if (p.max !== 1) L.push(` switchport port-security maximum ${p.max}`);
    if (p.violation !== "shutdown") L.push(` switchport port-security violation ${p.violation}`);
    p.macs.forEach((m) => L.push(` switchport port-security mac-address ${m}`));
    if (p.sticky) L.push(" switchport port-security mac-address sticky");
    p.learned.forEach((m) => L.push(` switchport port-security mac-address sticky ${m}`));
  }
  if (i.snoopTrust) L.push(" ip dhcp snooping trust");
  return L;
};
