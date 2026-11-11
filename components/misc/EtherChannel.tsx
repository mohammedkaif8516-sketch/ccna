/**
 * EtherChannel.tsx — `channel-group <n> mode active|passive|desirable|auto|on`, Port-channel interfaces,
 * `show etherchannel summary`.
 *
 * Bundling rules (bundleState() in netsim): LACP needs active↔active or active↔passive, PAgP needs
 * desirable↔desirable or desirable↔auto, `on` needs `on` on the other side. A mismatch involving `on` suspends
 * the port (s, link down); other mismatches leave it stand-alone (I) and it keeps working as a normal port.
 * The Port-channel is up while at least one member is bundled (P) and up.
 */
import {
  type Ctx,
  type E,
  type H,
  type Iface,
  type State,
  bundleState,
  ifUp,
  peerOf,
  shortIf,
} from "@/components/simulator/netsim";

const MODES = ["active", "passive", "desirable", "auto", "on"] as const;
const L2KEYS = ["mode", "vlan", "allowed", "native", "nonegotiate"] as const;

export const echIfX: E[] = [
  ...MODES.map<E>((m) => [
    `channel-group <n> mode ${m}`,
    (c: Ctx, a: string[]) => {
      const n = +a[0];
      if (!(n >= 1 && n <= 64)) return c.bad(1);
      const names = c.cli.ifs!;
      if (names.some((x) => /^(Vlan|Loopback|Port-channel)/.test(x)))
        return c.out("% Only physical ports can join a channel-group");
      const po = "Port-channel" + n;
      if (!c.dev.ifaces[po]) {
        c.dev.ifaces[po] = { shut: false };
        c.out(`Creating a port-channel interface Port-channel ${n}`);
      }
      const p = c.dev.ifaces[po];
      names.forEach((x) => {
        const i = c.dev.ifaces[x];
        i.cg = n;
        i.cgMode = m;
        // members take over whatever switchport settings the port-channel already has
        for (const k of L2KEYS)
  if (p[k] !== undefined) (i as unknown as Record<string, unknown>)[k] = p[k];
      });
    },
    m === "on" ? "Join a static channel (no protocol)" : `Join a channel-group, ${m}`,
  ]),
  [
    "no channel-group",
    (c) =>
      c.cli.ifs!.forEach((x) => {
        const i = c.dev.ifaces[x];
        i.cg = undefined;
        i.cgMode = undefined;
      }),
    "Remove the port from its channel-group",
  ],
  ["channel-protocol <*>", () => {}],
  ["port-channel <*>", () => {}], // load-balance …
];

const linkUp = (s: State, id: string, n: string) => {
  const i = s.devs[id].ifaces[n],
    pe = peerOf(s, id, n);
  return !!pe && !i.shut && !s.devs[pe.id].ifaces[pe.port].shut;
};
const showSum: H = (c) => {
  const s = c.view(),
    d = c.dev,
    groups = new Map<number, string[]>();
  for (const [n, i] of Object.entries(d.ifaces as Record<string, Iface>))
    if (i.cg !== undefined) groups.set(i.cg, [...(groups.get(i.cg) ?? []), n]);
  const L = [
    "Flags:  D - down        P - bundled in port-channel",
    "        I - stand-alone s - suspended",
    "        H - Hot-standby (LACP only)",
    "        R - Layer3      S - Layer2",
    "        U - in use      f - failed to allocate aggregator",
    "",
    "        M - not in use, minimum links not met",
    "        u - unsuitable for bundling",
    "        w - waiting to be aggregated",
    "        d - default port",
    "",
    "",
    `Number of channel-groups in use: ${groups.size}`,
    `Number of aggregators:           ${groups.size}`,
    "",
    "Group  Port-channel  Protocol    Ports",
    "------+-------------+-----------+-----------------------------------------------",
  ];
  for (const [g, ms] of [...groups].sort((a, b) => a[0] - b[0])) {
    const mode = d.ifaces[ms[0]].cgMode,
      proto = mode === "on" ? "-" : mode === "active" || mode === "passive" ? "LACP" : "PAgP",
      po = `Po${g}(${ifUp(s, d.id, "Port-channel" + g) ? "SU" : "SD"})`,
      ports = ms.map((n) => {
        const st = bundleState(s, d.id, n);
        return `${shortIf(n)}(${!linkUp(s, d.id, n) ? "D" : st})`;
      });
    L.push(`${String(g).padEnd(7)}${po.padEnd(14)}${proto.padEnd(12)}${ports.join("    ")}`);
  }
  c.out(...L);
};
export const echPrivX: E[] = [
  ["show etherchannel summary", showSum, "One-line summary per channel-group"],
  ["show etherchannel", showSum, "EtherChannel information"],
];
export const ifEch = (i: Iface): string[] =>
  i.cg !== undefined && i.cgMode ? [` channel-group ${i.cg} mode ${i.cgMode}`] : [];
