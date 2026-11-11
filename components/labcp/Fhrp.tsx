/**
 * Fhrp.tsx — HSRP (`standby …`) and VRRP (`vrrp …`), one group per interface.
 *
 * Only the ACTIVE / MASTER router owns the virtual IP: it answers ARP for it and accepts packets sent to it
 * (see owns / arpFind in forwarding). Election runs after every CLI line and when cables are drawn:
 * highest priority wins, then highest interface IP. Without `preempt` an existing active router keeps its role
 * (HSRP default); VRRP preempts by default and the router that owns the virtual address gets priority 255.
 * One group per interface (a second group replaces the first).
 */
import {
  type Ctx,
  type Dev,
  type E,
  type H,
  type Iface,
  type State,
  type Store,
  afterSubmit,
  ifUp,
  l2domain,
  isIp,
  ip2n,
  shortIf,
} from "@/components/simulator/netsim";

type St = "init" | "listen" | "standby" | "active";
interface Mem { id: string; n: string }

const eff = (i: Iface) => {
  const f = i.fhrp!;
  return f.proto === "vrrp" && f.vip && f.vip === i.ip ? 255 : f.pri;
};
/** this interface plus every interface on the same segment that runs the same protocol + group */
function members(s: State, id: string, n: string): Mem[] {
  const f = s.devs[id].ifaces[n].fhrp!,
    out: Mem[] = [{ id, n }];
  for (const e of l2domain(s, id, n)) {
    const x = s.devs[e.id]?.ifaces[e.port];
    if (e.id !== id && x?.fhrp && x.fhrp.proto === f.proto && x.fhrp.group === f.group)
      out.push({ id: e.id, n: e.port });
  }
  return out;
}
const rank = (s: State, m: Mem) => {
  const i = s.devs[m.id].ifaces[m.n];
  return eff(i) * 2 ** 32 + ip2n(i.ip ?? "0.0.0.0");
};
const stOf = (s: State, m: Mem): St => s.devs[m.id].rt?.fhrp?.[m.n] ?? "init";

export function fhrpSync(st: Store) {
  for (let pass = 0; pass < 6; pass++) {
    const s = st.get(),
      seen = new Set<string>();
    let changed = false;
    for (const d of Object.values(s.devs))
      for (const [n, i] of Object.entries(d.ifaces)) {
        if (!i.fhrp || seen.has(d.id + "|" + n)) continue;
        const mem = members(s, d.id, n);
        mem.forEach((m) => seen.add(m.id + "|" + m.n));
        const cand = mem
          .filter((m) => {
            const x = s.devs[m.id].ifaces[m.n];
            return !!x.fhrp?.vip && !!x.ip && ifUp(s, m.id, m.n);
          })
          .sort((a, b) => rank(s, b) - rank(s, a));
        const best = cand[0];
        let act = cand.find((m) => stOf(s, m) === "active");
        if (
          best &&
          (!act ||
            (s.devs[best.id].ifaces[best.n].fhrp!.preempt && rank(s, best) > rank(s, act)))
        )
          act = best;
        const stby = cand.find((m) => m !== act);
        for (const m of mem) {
          const ns: St =
            m === act ? "active" : m === stby ? "standby" : cand.includes(m) ? "listen" : "init";
          if (stOf(s, m) !== ns) {
            st.update(m.id, (x) => {
              ((x.rt ??= {}).fhrp ??= {})[m.n] = ns;
            });
            changed = true;
          }
        }
      }
    if (!changed) break;
  }
}
if (!afterSubmit.includes(fhrpSync)) afterSubmit.push(fhrpSync);

/* ───────────── config ───────────── */
const noop: H = () => {};
const each = (c: Ctx, fn: (i: Iface) => void) =>
  c.cli.ifs!.forEach((n) => fn(c.dev.ifaces[n]));
const get = (i: Iface, proto: "hsrp" | "vrrp", g: number) =>
  (i.fhrp =
    i.fhrp?.proto === proto && i.fhrp.group === g
      ? i.fhrp
      : { proto, group: g, pri: 100, preempt: proto === "vrrp" });
const num = (c: Ctx, t: string, idx: number, max: number) => {
  const v = +t;
  if (!Number.isInteger(v) || v < 0 || v > max) return void c.bad(idx);
  return v;
};
const build = (kw: string, proto: "hsrp" | "vrrp"): E[] => [
  [
    `${kw} <g> ip <ip>`,
    (c, a) => {
      const g = num(c, a[0], 1, 255);
      if (g === undefined) return;
      if (!isIp(a[1])) return c.bad(3);
      each(c, (i) => { get(i, proto, g).vip = a[1]; });
    },
    "Enable group and set the virtual IP address",
  ],
  [
    `${kw} <g> priority <n>`,
    (c, a) => {
      const g = num(c, a[0], 1, 255),
        p = num(c, a[1], 3, 255);
      if (g === undefined || p === undefined) return;
      each(c, (i) => { get(i, proto, g).pri = p; });
    },
    "Priority of the router (default 100)",
  ],
  [
    `${kw} <g> preempt`,
    (c, a) => {
      const g = num(c, a[0], 1, 255);
      if (g !== undefined) each(c, (i) => { get(i, proto, g).preempt = true; });
    },
    "Overthrow a lower-priority active router",
  ],
  [
    `no ${kw} <g> preempt`,
    (c, a) => {
      const g = num(c, a[0], 2, 255);
      if (g !== undefined) each(c, (i) => { get(i, proto, g).preempt = false; });
    },
  ],
  [
    `no ${kw} <g>`,
    (c, a) => each(c, (i) => { if (i.fhrp?.proto === proto && i.fhrp.group === +a[0]) i.fhrp = undefined; }),
  ],
  [`${kw} <g> <*>`, noop], // timers, name, authentication … accepted and ignored
];
export const fhrpIfX: E[] = [
  ["standby version <v>", noop],
  ...build("standby", "hsrp"),
  ...build("vrrp", "vrrp"),
];

/* ───────────── show ───────────── */
const LBL: Record<St, string> = { active: "Active", standby: "Standby", listen: "Listen", init: "Init" };
const brief = (proto: "hsrp" | "vrrp"): H => (c) => {
  const s = c.view(),
    d = c.dev,
    L =
      proto === "hsrp"
        ? [
            "                     P indicates configured to preempt.",
            "                     |",
            "Interface   Grp  Pri P State   Active          Standby         Virtual IP",
          ]
        : ["Interface          Grp Pri Time  Own Pre State   Master addr     Group addr"];
  for (const [n, i] of Object.entries(d.ifaces)) {
    const f = i.fhrp;
    if (f?.proto !== proto) continue;
    const mem = members(s, d.id, n),
      who = (state: St) => {
        const m = mem.find((x) => stOf(s, x) === state);
        return !m ? "unknown" : m.id === d.id && m.n === n ? "local" : (s.devs[m.id].ifaces[m.n].ip ?? "unknown");
      },
      me = stOf(s, { id: d.id, n });
    if (proto === "hsrp")
      L.push(
        `${shortIf(n).padEnd(12)}${String(f.group).padEnd(5)}${String(f.pri).padEnd(4)}${f.preempt ? "P" : " "} ${LBL[me].padEnd(8)}${who("active").padEnd(16)}${who("standby").padEnd(16)}${f.vip ?? "unknown"}`,
      );
    else
      L.push(
        `${shortIf(n).padEnd(19)}${String(f.group).padEnd(4)}${String(eff(i)).padEnd(4)}${"3570".padEnd(6)}${f.vip === i.ip ? "Y" : " "}   ${f.preempt ? "Y" : " "}  ${(me === "active" ? "Master" : me === "init" ? "Init" : "Backup").padEnd(8)}${who("active").padEnd(16)}${f.vip ?? "unknown"}`,
      );
  }
  c.out(...L);
};
export const fhrpPrivX: E[] = [
  ["show standby brief", brief("hsrp"), "HSRP groups in brief"],
  ["show vrrp brief", brief("vrrp"), "VRRP groups in brief"],
];

/* ───────────── running-config ───────────── */
export const ifFhrp = (i: Iface): string[] => {
  const f = i.fhrp;
  if (!f) return [];
  const kw = f.proto === "hsrp" ? "standby" : "vrrp";
  return [
    ...(f.vip ? [` ${kw} ${f.group} ip ${f.vip}`] : []),
    ...(f.pri !== 100 ? [` ${kw} ${f.group} priority ${f.pri}`] : []),
    ...(f.proto === "hsrp"
      ? f.preempt ? [` standby ${f.group} preempt`] : []
      : f.preempt ? [] : [` no vrrp ${f.group} preempt`]),
  ];
};
void (null as unknown as Dev);
