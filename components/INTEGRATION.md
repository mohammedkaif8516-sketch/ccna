# Integration — ACL · NAT · EtherChannel · HSRP/VRRP · Port-security · DHCP snooping · VPN

New files (put next to `netsim.tsx`): `Acl.tsx` `Nat.tsx` `Fhrp.tsx` `EtherChannel.tsx` `L2Security.tsx` `Vpn.tsx` `Extras.tsx`
(`Dhcp.tsx` and `Vtp.tsx` were already updated earlier.)  Do the steps in order.

---------------------------------------------------------------------------------------------------

## A. `netsim.tsx`

### A1. Types

```ts
// Iface — add
nat?: "inside" | "outside";
aclIn?: string; aclOut?: string;
cg?: number; cgMode?: "active" | "passive" | "desirable" | "auto" | "on";
fhrp?: { proto: "hsrp" | "vrrp"; group: number; vip?: string; pri: number; preempt: boolean };
ps?: { max: number; violation: "shutdown" | "restrict" | "protect"; sticky: boolean; macs: string[]; learned: string[] };
snoopTrust?: boolean;
tun?: { src?: string; dst?: string; mode: "gre" | "ipsec"; prof?: string };
cmap?: string;

// Cli — add
ctx?: string;

// new interfaces (put near Route / Sec)
export interface AclRule { seq: number; text: string }
export interface Acl { kind: "std" | "ext"; named: boolean; rules: AclRule[] }
export interface NatRule { kind: "static" | "list"; local?: string; global?: string; acl?: string; pool?: string; ifn?: string; overload?: boolean }
export interface NatCfg { pools: Record<string, { start: string; end: string; mask: string }>; rules: NatRule[] }
export interface Xlat { kind: "static" | "dynamic" | "pat"; local: string; global: string; id?: number; dst?: string; proto?: string }
export interface CryptoCfg {
  policies: { n: number; enc: string; hash: string; auth: string; group: number }[];
  keys: { peer: string; key: string }[];
  ts: Record<string, string>;
  maps: { name: string; seq: number; peer?: string; ts?: string; acl?: string }[];
  profiles: Record<string, { ts?: string }>;
}
/** runtime state — NOT part of the saved config (cleared on reload) */
export interface Rt {
  fhrp?: Record<string, "init" | "listen" | "standby" | "active">;
  errdis?: string[];
  secMacs?: Record<string, string[]>;
  psViol?: Record<string, number>;
  snoopB?: { mac: string; ip: string; vlan: number; port: string; at: number; ms: number }[];
  xlat?: Xlat[];
  aclHits?: Record<string, Record<number, number>>;
  ipsec?: Record<string, { enc: number; dec: number }>;
}

// Dev — add
acls?: Record<string, Acl>; nat?: NatCfg; snoop?: { on: boolean; vlans: string }; crypto?: CryptoCfg; rt?: Rt;

// CFG array — add "acls", "nat", "snoop", "crypto"
```

(Also from the earlier DHCP / VTP steps: `Iface.helper`, `Dev.dhcp`, `Dev.bindings`, `Dev.vtp`, `afterSubmit` / `runAfter`.)

### A2. Interface names (Port-channel, Tunnel)

```ts
const famOf = (n: string) => /^[A-Za-z-]+/.exec(n)![0].toLowerCase();   // was [A-Za-z]+
const numOf = (n: string) => n.replace(/^[A-Za-z-]+/, "");              // was ^[A-Za-z]+

// shortIf: add
.replace(/^Port-channel/, "Po").replace(/^Tunnel/, "Tu")
```

In `ensureIf`, add before the router sub-interface block (`if (d.kind === "router" && sub)`):

```ts
if (d.kind === "switch" && fam.length >= 2 && "port-channel".startsWith(fam) && !sub && !num.includes("/")) {
  d.ifaces["Port-channel" + num] = { shut: false };
  return "Port-channel" + num;
}
if (d.kind === "router" && fam.length >= 2 && "tunnel".startsWith(fam) && !sub && !num.includes("/")) {
  d.ifaces["Tunnel" + num] = { shut: false, tun: { mode: "gre" } };
  return "Tunnel" + num;
}
```

### A3. MAC addresses of VPCs look like VPCS (0050.79xx.xxxx)

```ts
export const macOf = (id: string, port: string) => {
  const h = hash32(id + "|" + port).toString(16).padStart(8, "0");
  return `${port === "eth0" ? "0050.79" : "aabb.cc"}${h.slice(0, 2)}.${h.slice(2, 6)}`;
};
```

### A4. `ifUp` — replace the whole function, and add the helpers above it

```ts
const lacp = (m?: string) => m === "active" || m === "passive";
const pagp = (m?: string) => m === "desirable" || m === "auto";
function chanOk(a?: string, b?: string) {
  if (!a || !b) return false;
  if (a === "on" || b === "on") return a === b;
  if (lacp(a) && lacp(b)) return a === "active" || b === "active";
  if (pagp(a) && pagp(b)) return a === "desirable" || b === "desirable";
  return false;
}
/** P = bundled, s = suspended (link down), I = stand-alone (works as a normal port) */
export function bundleState(s: State, id: string, name: string): "P" | "s" | "I" {
  const i = s.devs[id].ifaces[name],
    pe = peerOf(s, id, name),
    pi = pe && s.devs[pe.id].ifaces[pe.port];
  if (!pi) return "I";
  if (pi.cg !== undefined && chanOk(i.cgMode, pi.cgMode)) return "P";
  return i.cgMode === "on" || (pi.cg !== undefined && pi.cgMode === "on") || (pi.cg === undefined && i.cgMode === "on") ? "s" : "I";
}
/** is `ip` reachable from d through connected nets / statics (tunnel interfaces excluded, so no recursion) */
function reach(s: State, d: Dev, ip: string): boolean {
  const conn = (x: string) =>
    Object.entries(d.ifaces).some(([n, i]) => i.ip && i.mask && !n.startsWith("Tunnel") && ifUp(s, d.id, n) && inNet(x, netOf(i.ip, i.mask), i.mask));
  return (
    conn(ip) ||
    d.routes.some(
      (r) =>
        inNet(ip, r.net, r.mask) &&
        (r.iface ? r.iface !== "Null0" && !r.iface.startsWith("Tunnel") && ifUp(s, d.id, r.iface) : !!r.nh && conn(r.nh)),
    )
  );
}
function tunnelUp(s: State, d: Dev, i: Iface): boolean {
  const t = i.tun;
  if (!t?.src || !t.dst) return false;
  const sIf = isIp(t.src) ? undefined : findIf(d, t.src),
    srcOk = sIf
      ? ifUp(s, d.id, sIf) && !!d.ifaces[sIf].ip
      : Object.entries(d.ifaces).some(([n, x]) => x.ip === t.src && !n.startsWith("Tunnel") && ifUp(s, d.id, n));
  return srcOk && reach(s, d, t.dst);
}
export function ifUp(s: State, id: string, name: string): boolean {
  const d = s.devs[id],
    i = d?.ifaces[name];
  if (!i || i.shut || d.rt?.errdis?.includes(name)) return false;
  if (name.startsWith("Loopback")) return true;
  if (name.startsWith("Vlan")) return !!d.vlans[+name.slice(4)];
  if (name.startsWith("Port-channel"))
    return Object.entries(d.ifaces).some(([n, m]) => m.cg === +name.slice(12) && bundleState(s, id, n) === "P" && ifUp(s, id, n));
  if (name.startsWith("Tunnel")) return tunnelUp(s, d, i);
  const b = d.ifaces[base(name)];
  if (!b || b.shut) return false;
  const pe = peerOf(s, id, base(name));
  if (!pe) return false;
  const pi = s.devs[pe.id];
  if (pi.ifaces[pe.port].shut || pi.rt?.errdis?.includes(pe.port)) return false;
  return !(b.cg !== undefined && bundleState(s, id, base(name)) === "s");
}
```

### A5. Forwarding

Replace the whole **"5. forwarding"** section (from `const owns` to the end of `traceRoute`) with the contents of
`netsim_section5.ts`.

### A6. Small edits

```ts
// toggle(): first line inside the for-loop, right after `if (i.shut === shut) continue;`
if (c.dev.rt?.errdis) c.dev.rt.errdis = c.dev.rt.errdis.filter((x) => x !== n);   // shutdown + no shutdown recovers err-disabled

// iosPrompt map — add
"config-std-nacl": "(config-std-nacl)#", "config-ext-nacl": "(config-ext-nacl)#",
"config-isakmp": "(config-isakmp)#", "config-crypto-trans": "(cfg-crypto-trans)#",
"config-crypto-map": "(config-crypto-map)#", "config-ipsec-profile": "(ipsec-profile)#",
// ("config-dhcp": "(dhcp-config)#" from the DHCP step)

// iosAnswer, case "reload": make it
c.dev.bindings = []; c.dev.rt = undefined;

// openRemote(): telnet / ssh are TCP, so ACLs can block them
const p = probe(s, fromId, req.ip, f, { proto: "tcp", dport: req.via === "ssh" ? 22 : 23 }),

// ciscoPing(): treat an ACL drop like a router "unreachable"
else if (p.kind === "net" || p.kind === "host" || p.kind === "admin") ch = "U.U.U";
```

---------------------------------------------------------------------------------------------------

## B. `Router.tsx`

```ts
import { routerX as rX } from "./Extras";

// globalX: append at the end            ...rX.global,
// ifX:     append at the end            ...rX.ifc,

// routerTables
case "priv":
  return [...priv, ...routingPrivX, ...dhcpPrivX, ...rX.priv, ...sh.user.filter((e) => e[0] !== "enable")];
// replace `default: return [];` with
default: {
  const ex = rX.modes(m);
  return ex ? [...ex, ...globalX, ...routingGlobalX, ...sh.global] : [];
}

// renderRouter — inside the interface loop, right after the `ip helper-address` / `ip address` lines
L.push(...rX.renderIf(i));
// …and after the static routes, next to renderDhcp / renderRouting
L.push(...rX.render(d));
```

(`ip nat` and `ip access-group` used to be swallowed by `["ip <*>", () => {}]`; the new exact commands win over it.)

---------------------------------------------------------------------------------------------------

## C. `Switch.tsx`

```ts
import { switchX as sX } from "./Extras";

// 1) keep Port-channels out of the "physical port" lists
const physical = (d: Dev) => Object.keys(d.ifaces).filter((n) => !/^(Vlan|Loopback|Port-channel)/.test(n));
// in stpNbrs(): replace the filter by   .filter((n) => !/^(Vlan|Loopback|Port-channel)/.test(n) && carries(s, id, n, v))

// 2) settings on a Port-channel are applied to its member ports too
const each = (c: Ctx, fn: (i: Iface, n: string) => void) =>
  c.cli.ifs!.forEach((n) => {
    fn(c.dev.ifaces[n], n);
    if (n.startsWith("Port-channel"))
      for (const [m, mi] of Object.entries(c.dev.ifaces)) if (mi.cg === +n.slice(12)) fn(mi, m);
  });

// 3) command lists
// globalX: append ...sX.global      ifX: append ...sX.ifc      privX: append ...sX.priv
// switchTables: replace `default: return [];` with
default: { const ex = sX.modes(m); return ex ? [...ex, ...globalX, ...sh.global] : []; }

// 4) renderSwitch — in the interface loop, after the `ip address` / switchport lines and before `shutdown`:
L.push(...sX.renderIf(i));
// …and next to renderVtp:   L.push(...sX.render(d));

// 5) show interfaces status: show err-disabled ports
(i.shut ? "disabled" : d.rt?.errdis?.includes(n) ? "err-disabled" : up ? "connected" : "notconnect")
//   (in showStatus use c.dev.rt?.errdis in place of d.rt)
```

Router-on-a-stick / MLS: HSRP and ACLs work on SVIs because they are interfaces like any other.

---------------------------------------------------------------------------------------------------

## D. `VPC.tsx`

```ts
// doPing — the unreachable line
else c.out(`*${p.from} icmp_seq=${k} ttl=${p.ttl} time=${ms} ms (ICMP type:3, code:${p.kind === "net" ? 0 : p.kind === "admin" ? 13 : 1}, ${p.kind === "admin" ? "Communication administratively prohibited" : `Destination ${p.kind} unreachable`})`);

// doTrace — code for the mark
(ICMP type:3, code:${r.mark === "!N" ? 0 : r.mark === "!A" ? 13 : 1})
```

---------------------------------------------------------------------------------------------------

## E. Quick tests

```
# ACL — block PC1 from reaching the server, allow the rest
R1(config)# ip access-list extended BLOCK
R1(config-ext-nacl)# deny icmp host 192.168.10.2 any
R1(config-ext-nacl)# permit ip any any
R1(config)# interface e0/0
R1(config-if)# ip access-group BLOCK in
PC1> ping 10.0.0.1      -> *192.168.10.1 ... (ICMP type:3, code:13, Communication administratively prohibited)
R1# show ip access-lists   -> 10 deny icmp host 192.168.10.2 any (4 matches)

# PAT
R1(config)# access-list 1 permit 192.168.10.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface e0/1 overload
R1(config-if)# ip nat inside      (e0/0)        R1(config-if)# ip nat outside      (e0/1)
PC1> ping 200.1.1.2      R1# show ip nat translations

# EtherChannel (both switches)
SW1(config)# interface range e0/1 - 2
SW1(config-if-range)# channel-group 1 mode active          SW2: mode active|passive
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
SW1# show etherchannel summary     -> Po1(SU)  Et0/1(P) Et0/2(P)

# HSRP
R1(config-if)# standby 1 ip 192.168.10.254   standby 1 priority 110   standby 1 preempt
R2(config-if)# standby 1 ip 192.168.10.254
R1# show standby brief           (shut R1's e0/0 and ping again: R2 becomes Active)

# Port-security
SW1(config-if)# switchport mode access
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security mac-address 0050.7900.0001     <- wrong MAC on purpose
PC1> ping ...   -> timeouts, port goes err-disabled     SW1# show port-security interface e0/1
SW1(config-if)# shutdown / no shutdown   recovers it

# DHCP snooping
SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10
SW1(config)# interface e0/0      (uplink to the real DHCP server)
SW1(config-if)# ip dhcp snooping trust

# GRE (R1 e0/0 = 200.1.1.1, R2 e0/0 = 200.1.1.2, ISP between them, static default routes)
R1(config)# interface tunnel 0
R1(config-if)# ip address 10.0.0.1 255.255.255.252
R1(config-if)# tunnel source e0/0
R1(config-if)# tunnel destination 200.1.1.2
R1(config)# ip route 192.168.2.0 255.255.255.0 10.0.0.2          (mirror on R2)

# IPsec crypto map (both routers, mirrored)
R1(config)# crypto isakmp policy 10
R1(config-isakmp)# encryption aes   authentication pre-share   group 2
R1(config)# crypto isakmp key CISCO123 address 200.1.1.2
R1(config)# crypto ipsec transform-set TS esp-aes esp-sha-hmac
R1(config)# access-list 101 permit ip 192.168.1.0 0.0.0.255 192.168.2.0 0.0.0.255
R1(config)# crypto map VPNMAP 10 ipsec-isakmp
R1(config-crypto-map)# set peer 200.1.1.2   set transform-set TS   match address 101
R1(config-if)# crypto map VPNMAP                                  (on e0/0)
PC1> ping 192.168.2.2        R1# show crypto isakmp sa    R1# show crypto ipsec sa
```
