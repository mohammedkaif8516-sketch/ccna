/**
 * Acl.tsx — standard / extended, numbered / named access lists, `ip access-group <acl> in|out`.
 *
 * Enforced inside route() through hooks.acl: inbound on the interface the packet arrives on, outbound on the
 * interface it leaves from. Traffic originated by the router itself is not filtered by outbound ACLs (as on IOS).
 * A missing ACL permits everything; a real one ends with an implicit deny.
 * Simulated traffic: ICMP echo / echo-reply, and TCP 22/23 for telnet & ssh.
 */
import {
  type Ctx,
  type Dev,
  type E,
  type H,
  type Iface,
  type Pkt,
  type Fx,
  hooks,
  isIp,
  ip2n,
} from "./netsim";

const noop: H = () => {};
const PORTS: Record<string, number> = {
  www: 80, http: 80, https: 443, telnet: 23, ssh: 22, domain: 53, smtp: 25, ftp: 21,
  "ftp-data": 20, bootps: 67, bootpc: 68, pop3: 110, ntp: 123, snmp: 161, tftp: 69,
};
const portNum = (t?: string) => {
  if (!t) return NaN;
  const k = PORTS[t.toLowerCase()];
  return k ?? (/^\d+$/.test(t) ? +t : NaN);
};
const isWild = (w?: string): w is string =>
  isIp(w) && /^0*1*$/.test(ip2n(w).toString(2).padStart(32, "0"));

type Addr = { any: true } | { ip: string; wild: string };
type PortSpec = { op: string; a: number; b?: number };
interface Parsed {
  permit: boolean;
  proto: string;
  src: Addr;
  dst?: Addr;
  sp?: PortSpec;
  dp?: PortSpec;
  icmp?: string;
}
const ICMP = ["echo", "echo-reply", "unreachable", "time-exceeded", "ttl-exceeded"];
const PROTO = ["ip", "icmp", "tcp", "udp", "gre", "esp", "ahp", "ospf", "eigrp"];

function addr(w: string[], i: number): { a: Addr; n: number } | undefined {
  const t = w[i]?.toLowerCase();
  if (t === "any") return { a: { any: true }, n: 1 };
  if (t === "host")
    return isIp(w[i + 1])
      ? { a: { ip: w[i + 1], wild: "0.0.0.0" }, n: 2 }
      : undefined;
  if (!isIp(w[i])) return undefined;
  return isWild(w[i + 1])
    ? { a: { ip: w[i], wild: w[i + 1] }, n: 2 }
    : { a: { ip: w[i], wild: "0.0.0.0" }, n: 1 };
}
function port(w: string[], i: number): { p?: PortSpec; n: number } | undefined {
  const op = w[i]?.toLowerCase();
  if (!["eq", "neq", "gt", "lt", "range"].includes(op)) return { n: 0 };
  const a = portNum(w[i + 1]);
  if (isNaN(a)) return undefined;
  if (op === "range") {
    const b = portNum(w[i + 2]);
    return isNaN(b) ? undefined : { p: { op, a, b }, n: 3 };
  }
  return { p: { op, a }, n: 2 };
}
/** `bad` is the index (inside the rule text) of the first token that could not be parsed */
export function parseRule(
  kind: "std" | "ext",
  text: string,
): Parsed | { bad: number } {
  const w = text.split(/\s+/).filter(Boolean),
    v = w[0]?.toLowerCase();
  if (v !== "permit" && v !== "deny") return { bad: 0 };
  const permit = v === "permit";
  if (kind === "std") {
    const s = addr(w, 1);
    if (!s) return { bad: 1 };
    const rest = w.slice(1 + s.n).filter((x) => x.toLowerCase() !== "log");
    return rest.length ? { bad: 1 + s.n } : { permit, proto: "ip", src: s.a };
  }
  const proto = w[1]?.toLowerCase();
  if (!PROTO.includes(proto)) return { bad: 1 };
  let i = 2,
    sp: PortSpec | undefined,
    dp: PortSpec | undefined,
    icmp: string | undefined;
  const s = addr(w, i);
  if (!s) return { bad: i };
  i += s.n;
  const l4 = proto === "tcp" || proto === "udp";
  if (l4) {
    const r = port(w, i);
    if (!r) return { bad: i };
    sp = r.p;
    i += r.n;
  }
  const d = addr(w, i);
  if (!d) return { bad: i };
  i += d.n;
  if (l4) {
    const r = port(w, i);
    if (!r) return { bad: i };
    dp = r.p;
    i += r.n;
  }
  if (proto === "icmp" && ICMP.includes(w[i]?.toLowerCase())) {
    icmp = w[i].toLowerCase().replace("ttl-exceeded", "time-exceeded");
    i++;
  }
  while (w[i] && ["established", "log", "log-input"].includes(w[i].toLowerCase())) i++;
  return i < w.length
    ? { bad: i }
    : { permit, proto, src: s.a, dst: d.a, sp, dp, icmp };
}

const wm = (ip: string, a: Addr) =>
  "any" in a || (((ip2n(ip) ^ ip2n(a.ip)) & ~ip2n(a.wild)) >>> 0) === 0;
const pm = (v: number | undefined, s?: PortSpec) =>
  !s ||
  (v !== undefined &&
    (s.op === "eq" ? v === s.a
      : s.op === "neq" ? v !== s.a
      : s.op === "gt" ? v > s.a
      : s.op === "lt" ? v < s.a
      : v >= s.a && v <= s.b!));
function matches(r: Parsed, kind: "std" | "ext", p: Pkt) {
  if (!wm(p.src, r.src)) return false;
  if (kind === "std") return true;
  if (!r.dst || !wm(p.dst, r.dst)) return false;
  if (r.proto !== "ip" && r.proto !== p.proto) return false;
  if (r.proto === "icmp" && r.icmp && r.icmp !== p.icmp) return false;
  return pm(p.sport, r.sp) && pm(p.dport, r.dp);
}
/** first matching line wins; no match = implicit deny; unknown ACL = permit (IOS behaviour) */
export function aclPermits(d: Dev, name: string, p: Pkt, fx: Fx[]): boolean {
  const a = d.acls?.[name];
  if (!a) return true;
  for (const r of a.rules) {
    const q = parseRule(a.kind, r.text);
    if ("bad" in q || !matches(q, a.kind, p)) continue;
    fx.push((st) =>
      st.update(d.id, (x) => {
        const h = (((x.rt ??= {}).aclHits ??= {})[name] ??= {});
        h[r.seq] = (h[r.seq] ?? 0) + 1;
      }),
    );
    return q.permit;
  }
  return false;
}
const hook = (_s: unknown, d: Dev, ifn: string, dir: "in" | "out", p: Pkt, fx: Fx[]) => {
  const i = d.ifaces[ifn],
    name = dir === "in" ? i?.aclIn : i?.aclOut;
  return !name || aclPermits(d, name, p, fx);
};
if (!hooks.acl.includes(hook as never)) hooks.acl.push(hook as never);

/* ───────────── config ───────────── */
const kindOf = (n: number): "std" | "ext" | undefined =>
  (n >= 1 && n <= 99) || (n >= 1300 && n <= 1999) ? "std"
  : (n >= 100 && n <= 199) || (n >= 2000 && n <= 2699) ? "ext"
  : undefined;

/** `off` = index of the rule's first word on the command line (for the ^ marker) */
function put(
  c: Ctx, name: string, kind: "std" | "ext", named: boolean,
  text: string, off: number, seq?: number,
) {
  const r = parseRule(kind, text);
  if ("bad" in r) return c.bad(off + r.bad);
  const a = ((c.dev.acls ??= {})[name] ??= { kind, named, rules: [] }),
    w = text.trim().split(/\s+/);
  w[0] = w[0].toLowerCase();
  const s = seq ?? (a.rules.length ? a.rules[a.rules.length - 1].seq : 0) + 10;
  if (a.rules.some((x) => x.seq === s)) return c.out("% Duplicate sequence number");
  a.rules.push({ seq: s, text: w.join(" ") });
  a.rules.sort((x, y) => x.seq - y.seq);
}
const nacl = (kind: "std" | "ext"): H => (c, a) => {
  const t = (c.dev.acls ??= {});
  if (t[a[0]] && t[a[0]].kind !== kind) return c.out("% Access-list type mismatch");
  t[a[0]] ??= { kind, named: true, rules: [] };
  c.cli.mode = kind === "std" ? "config-std-nacl" : "config-ext-nacl";
  c.cli.ctx = a[0];
  delete c.cli.ifs;
};
export const aclGlobalX: E[] = [
  [
    "access-list <n> <*>",
    (c, a) => {
      const kind = kindOf(+a[0]);
      if (!kind) return c.bad(1);
      if (a[1].split(" ")[0].toLowerCase() === "remark") return;
      put(c, a[0], kind, false, a[1], 2);
    },
    "Numbered ACL: 1-99 standard, 100-199 extended",
  ],
  ["no access-list <n>", (c, a) => { if (c.dev.acls) delete c.dev.acls[a[0]]; }, "Delete an ACL"],
  ["ip access-list standard <name>", nacl("std"), "Named standard ACL"],
  ["ip access-list extended <name>", nacl("ext"), "Named extended ACL"],
  ["no ip access-list standard <name>", (c, a) => { if (c.dev.acls) delete c.dev.acls[a[0]]; }],
  ["no ip access-list extended <name>", (c, a) => { if (c.dev.acls) delete c.dev.acls[a[0]]; }],
];

const cur = (c: Ctx) => c.dev.acls?.[c.cli.ctx ?? ""];
const line = (verb: string, withSeq: boolean): H => (c, a) => {
  const x = cur(c);
  if (!x) return;
  if (!withSeq) return put(c, c.cli.ctx!, x.kind, true, `${verb} ${a[0]}`, 1);
  if (!Number.isInteger(+a[0]) || +a[0] < 1) return c.bad(0);
  put(c, c.cli.ctx!, x.kind, true, `${verb} ${a[1]}`, 2, +a[0]);
};
/** shared by config-std-nacl and config-ext-nacl */
export const aclModeX: E[] = [
  ["permit <*>", line("permit", false), "Specify packets to forward"],
  ["deny <*>", line("deny", false), "Specify packets to reject"],
  ["<seq> permit <*>", line("permit", true)],
  ["<seq> deny <*>", line("deny", true)],
  ["remark <*>", noop],
  [
    "no <seq>",
    (c, a) => {
      const x = cur(c);
      if (!x || !Number.isInteger(+a[0])) return c.bad(1);
      const n = x.rules.length;
      x.rules = x.rules.filter((r) => r.seq !== +a[0]);
      if (x.rules.length === n) c.out("% Invalid sequence number");
    },
    "Remove a line by its sequence number",
  ],
];

const grp = (c: Ctx, name: string, dir: "in" | "out", on: boolean) =>
  c.cli.ifs!.forEach((n) => {
    const i = c.dev.ifaces[n];
    if (dir === "in") i.aclIn = on ? name : undefined;
    else i.aclOut = on ? name : undefined;
  });
export const aclIfX: E[] = (["in", "out"] as const).flatMap<E>((dir) => [
  [`ip access-group <acl> ${dir}`, (c, a) => grp(c, a[0], dir, true), "Apply an ACL to this interface"],
  [`no ip access-group <acl> ${dir}`, (c, a) => grp(c, a[0], dir, false)],
]);

/* ───────────── show / render ───────────── */
const showAcl: H = (c, a) => {
  const t = c.dev.acls ?? {},
    names = a[0]
      ? [a[0]]
      : Object.keys(t).sort((x, y) => (+x || 1e9) - (+y || 1e9) || (x < y ? -1 : 1));
  for (const n of names) {
    const x = t[n];
    if (!x) {
      c.out(`% Access list ${n} not found`);
      continue;
    }
    c.out(
      `${x.kind === "std" ? "Standard" : "Extended"} IP access list ${n}`,
      ...x.rules.map((r) => {
        const h = c.dev.rt?.aclHits?.[n]?.[r.seq];
        return `    ${r.seq} ${r.text}${h ? ` (${h} matches)` : ""}`;
      }),
    );
  }
};
export const aclPrivX: E[] = [
  ["show ip access-lists", showAcl, "List IP access lists"],
  ["show ip access-lists <name>", showAcl],
  ["show access-lists", showAcl, "List access lists"],
  ["show access-lists <name>", showAcl],
];
export function renderAcls(d: Dev): string[] {
  const L: string[] = [];
  for (const [n, a] of Object.entries(d.acls ?? {})) {
    if (a.named) {
      L.push(`ip access-list ${a.kind === "std" ? "standard" : "extended"} ${n}`);
      a.rules.forEach((r) => L.push(` ${r.seq} ${r.text}`));
      L.push("!");
    } else a.rules.forEach((r) => L.push(`access-list ${n} ${r.text}`));
  }
  if (Object.values(d.acls ?? {}).some((a) => !a.named)) L.push("!");
  return L;
}
export const ifAcl = (i: Iface): string[] => [
  ...(i.aclIn ? [` ip access-group ${i.aclIn} in`] : []),
  ...(i.aclOut ? [` ip access-group ${i.aclOut} out`] : []),
];
