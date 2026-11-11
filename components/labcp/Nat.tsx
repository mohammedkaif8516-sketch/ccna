/**
 * Nat.tsx — static NAT, dynamic NAT (pool) and PAT (overload on an interface or a pool address).
 *
 * inside → outside: after the routing lookup the source is rewritten (hooks.xout) and recorded on the packet;
 * the reply is routed to the translated address and un-translated on the NAT router (hooks.xin).
 * Static entries also work for connections started from the outside.
 */
import {
  type Ctx,
  type Dev,
  type E,
  type H,
  type Iface,
  type NatRule,
  type Pkt,
  type State,
  type Fx,
  type Xlat,
  hooks,
  findIf,
  isIp,
  isMask,
  ip2n,
  n2ip,
  shortIf,
} from "@/components/simulator/netsim";
import { aclPermits } from "./Acl";

const natOf = (c: Ctx) => (c.dev.nat ??= { pools: {}, rules: [] });

/* ───────────── translation ───────────── */
const xout = (_s: State, d: Dev, inIf: string, outIf: string, p: Pkt, fx: Fx[]): boolean => {
  const nat = d.nat;
  if (!nat || d.ifaces[inIf]?.nat !== "inside" || d.ifaces[outIf]?.nat !== "outside")
    return true;
  const local = p.src,
    dst = p.dst,
    proto = p.proto;
  const rec = (global: string, kind: Xlat["kind"]) => {
    p.xl.push({ router: d.id, local, global });
    p.src = global;
    fx.push((st) =>
      st.update(d.id, (x) => {
        const t = ((x.rt ??= {}).xlat ??= []),
          pat = kind === "pat";
        if (!t.some((e) => e.local === local && e.global === global && e.dst === (pat ? dst : undefined)))
          t.push({
            kind, local, global,
            dst: pat ? dst : undefined,
            proto: pat ? proto : undefined,
            id: pat ? 1000 + t.length : undefined,
          });
      }),
    );
    return true;
  };
  const st = nat.rules.find((r) => r.kind === "static" && r.local === local);
  if (st) {
    p.xl.push({ router: d.id, local, global: st.global! });
    p.src = st.global!;
    return true;
  }
  for (const r of nat.rules) {
    if (r.kind !== "list" || !d.acls?.[r.acl!] || !aclPermits(d, r.acl!, p, fx)) continue;
    if (r.ifn) {
      const g = d.ifaces[r.ifn]?.ip;
      return g ? rec(g, "pat") : false;
    }
    const pool = nat.pools[r.pool!];
    if (!pool) return false;
    if (r.overload) return rec(pool.start, "pat");
    const used = d.rt?.xlat ?? [],
      mine = used.find((e) => e.kind === "dynamic" && e.local === local);
    if (mine) return rec(mine.global, "dynamic");
    for (let n = ip2n(pool.start); n <= ip2n(pool.end); n++)
      if (!used.some((e) => e.global === n2ip(n))) return rec(n2ip(n), "dynamic");
    return false; // pool exhausted: the packet is dropped
  }
  return true;
};
const xin = (_s: State, d: Dev, inIf: string, p: Pkt) => {
  const nat = d.nat;
  if (!nat || d.ifaces[inIf]?.nat !== "outside") return;
  const rec = p.xl.find((r) => r.router === d.id && r.global === p.dst);
  if (rec) return void (p.dst = rec.local);
  const st = nat.rules.find((r) => r.kind === "static" && r.global === p.dst);
  if (st) p.dst = st.local!;
};
if (!hooks.xout.includes(xout as never)) hooks.xout.push(xout as never);
if (!hooks.xin.includes(xin as never)) hooks.xin.push(xin as never);

/* ───────────── config ───────────── */
const addSrc: H = (c, a) => {
  const w = a[0].split(" "),
    nat = natOf(c),
    k = w[0].toLowerCase();
  if (k === "static") {
    if (!isIp(w[1])) return c.bad(5);
    if (!isIp(w[2])) return c.bad(6);
    nat.rules = nat.rules.filter((r) => !(r.kind === "static" && r.local === w[1]));
    nat.rules.push({ kind: "static", local: w[1], global: w[2] });
    return;
  }
  if (k !== "list" || !w[1]) return c.bad(4);
  const rule: NatRule = { kind: "list", acl: w[1], overload: w.slice(2).includes("overload") };
  const how = w[2]?.toLowerCase();
  if (how === "pool") {
    if (!nat.pools[w[3]]) return c.out(`%Pool ${w[3] ?? ""} not found`);
    rule.pool = w[3];
  } else if (how === "interface") {
    const n = findIf(c.dev, w[3] ?? "");
    if (!n) return c.bad(7);
    rule.ifn = n;
    rule.overload = true;
  } else return c.bad(6);
  nat.rules = nat.rules.filter((r) => !(r.kind === "list" && r.acl === rule.acl));
  nat.rules.push(rule);
};
export const natGlobalX: E[] = [
  [
    "ip nat pool <name> <start> <end> netmask <mask>",
    (c, a) => {
      const [name, start, end, mask] = a;
      if (!isIp(start)) return c.bad(4);
      if (!isIp(end)) return c.bad(5);
      if (!isMask(mask)) return c.bad(7);
      if (ip2n(end) < ip2n(start)) return c.out("%End address less than start address");
      natOf(c).pools[name] = { start, end, mask };
    },
    "Define a pool of global addresses",
  ],
  ["no ip nat pool <name>", (c, a) => { if (c.dev.nat) delete c.dev.nat.pools[a[0]]; }],
  [
    "ip nat inside source <*>",
    addSrc,
    "list <acl> pool <p> [overload] | list <acl> interface <if> overload | static <local> <global>",
  ],
  [
    "no ip nat inside source <*>",
    (c, a) => {
      const w = a[0].split(" "),
        nat = c.dev.nat;
      if (!nat) return;
      const n = nat.rules.length;
      nat.rules = nat.rules.filter((r) =>
        w[0] === "static" ? !(r.kind === "static" && r.local === w[1])
        : w[0] === "list" ? !(r.kind === "list" && r.acl === w[1])
        : true,
      );
      if (nat.rules.length === n) c.out("%No matching translation rule");
    },
  ],
];
const side = (c: Ctx, v: Iface["nat"]) =>
  c.cli.ifs!.forEach((n) => { c.dev.ifaces[n].nat = v; });
export const natIfX: E[] = [
  ["ip nat inside", (c) => side(c, "inside"), "Inside interface for address translation"],
  ["ip nat outside", (c) => side(c, "outside"), "Outside interface for address translation"],
  ["no ip nat inside", (c) => side(c, undefined)],
  ["no ip nat outside", (c) => side(c, undefined)],
];

/* ───────────── show / clear ───────────── */
const col = (x: string) => x.padEnd(19);
const showTrans: H = (c) => {
  const d = c.dev,
    L = ["Pro Inside global      Inside local       Outside local      Outside global"];
  for (const r of d.nat?.rules ?? [])
    if (r.kind === "static")
      L.push(`${"---".padEnd(4)}${col(r.global!)}${col(r.local!)}${col("---")}---`);
  for (const e of d.rt?.xlat ?? [])
    L.push(
      e.kind === "pat"
        ? `${(e.proto ?? "icmp").padEnd(4)}${col(`${e.global}:${e.id}`)}${col(`${e.local}:${e.id}`)}${col(`${e.dst}:${e.id}`)}${e.dst}:${e.id}`
        : `${"---".padEnd(4)}${col(e.global)}${col(e.local)}${col("---")}---`,
    );
  c.out(...L);
};
const showStats: H = (c) => {
  const d = c.dev,
    st = (d.nat?.rules ?? []).filter((r) => r.kind === "static").length,
    dyn = (d.rt?.xlat ?? []).length,
    names = (v: string) =>
      Object.entries(d.ifaces).filter(([, i]) => i.nat === v).map(([n]) => `  ${n}`);
  c.out(
    `Total active translations: ${st + dyn} (${st} static, ${dyn} dynamic; ${(d.rt?.xlat ?? []).filter((e) => e.kind === "pat").length} extended)`,
    "Outside interfaces:", ...names("outside"),
    "Inside interfaces:", ...names("inside"),
  );
};
export const natPrivX: E[] = [
  ["show ip nat translations", showTrans, "Translation table"],
  ["show ip nat statistics", showStats, "Translation statistics"],
  [
    "clear ip nat translation <x>",
    (c, a) => {
      if (a[0] !== "*") return c.bad(4);
      c.dev.rt = { ...(c.dev.rt ?? {}), xlat: [] };
    },
    "Clear dynamic translations (*)",
  ],
];

/* ───────────── running-config ───────────── */
export function renderNat(d: Dev): string[] {
  const n = d.nat,
    L: string[] = [];
  if (!n) return L;
  for (const [k, p] of Object.entries(n.pools))
    L.push(`ip nat pool ${k} ${p.start} ${p.end} netmask ${p.mask}`);
  for (const r of n.rules)
    L.push(
      r.kind === "static"
        ? `ip nat inside source static ${r.local} ${r.global}`
        : `ip nat inside source list ${r.acl} ${r.pool ? "pool " + r.pool : "interface " + r.ifn}${r.overload ? " overload" : ""}`,
    );
  if (L.length) L.push("!");
  return L;
}
export const ifNat = (i: Iface): string[] => (i.nat ? [` ip nat ${i.nat}`] : []);
void shortIf;
