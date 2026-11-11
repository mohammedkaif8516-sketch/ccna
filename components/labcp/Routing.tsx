/**
 * routing.ts — RIP / EIGRP / OSPF commands for the router console.
 *
 * Router.tsx spreads these tables into its own (see the edit list). The route computation itself
 * lives in netsim.tsx (section 4b), so every show command reads the same results the forwarding
 * engine uses.
 */
import {
  classLen,
  findIf,
  getDyn,
  ip2n,
  isIp,
  ifUp,
  lenMask,
  majorNet,
  maskLen,
  n2ip,
  netOf,
  routeTable,
  shortIf,
  wildOf,
  type Ctx,
  type Dev,
  type E,
  type H,
  type Iface,
  type RE,
} from "@/components/simulator/netsim";

const noop: H = () => {};
const int = (s: string, lo: number, hi: number) => {
  const v = +s;
  return Number.isInteger(v) && v >= lo && v <= hi ? v : undefined;
};
const isWild = (m?: string): m is string =>
  isIp(m) && /^0*1*$/.test(ip2n(m).toString(2).padStart(32, "0"));
const wildLen = (w: string) =>
  32 - ip2n(w).toString(2).replace(/0/g, "").length;
const ifEach = (c: Ctx, fn: (i: Iface, n: string) => void) =>
  c.cli.ifs!.forEach((n) => fn(c.dev.ifaces[n], n));

/* ═════════════════════ entering / leaving a routing process (global config) ═════════════════════ */
export const routingGlobalX: E[] = [
  [
    "router rip",
    (c) => {
      c.dev.rip ??= { version: 1, networks: [], auto: true, passive: [] };
      c.cli.mode = "config-router-rip";
      delete c.cli.ifs;
    },
    "Routing Information Protocol (RIP)",
  ],
  [
    "router eigrp <as>",
    (c, a) => {
      const as = int(a[0], 1, 65535);
      if (as === undefined) return c.bad(2);
      if (c.dev.eigrp && c.dev.eigrp.as !== as)
        return c.out(
          `% EIGRP ${c.dev.eigrp.as} is already running; this lab supports one EIGRP process`,
        );
      c.dev.eigrp ??= {
        as,
        networks: [],
        passive: [],
        variance: 1,
        maxPaths: 4,
      };
      c.cli.mode = "config-router-eigrp";
      delete c.cli.ifs;
    },
    "Enhanced Interior Gateway Routing Protocol (EIGRP)",
  ],
  [
    "router ospf <pid>",
    (c, a) => {
      const pid = int(a[0], 1, 65535);
      if (pid === undefined) return c.bad(2);
      if (c.dev.ospf && c.dev.ospf.pid !== pid)
        return c.out(
          `% OSPF ${c.dev.ospf.pid} is already running; this lab supports one OSPF process`,
        );
      c.dev.ospf ??= { pid, networks: [], passive: [], refBw: 100 };
      c.cli.mode = "config-router-ospf";
      delete c.cli.ifs;
    },
    "Open Shortest Path First (OSPF)",
  ],
  [
    "no router rip",
    (c) => {
      delete c.dev.rip;
    },
    "Remove RIP",
  ],
  [
    "no router eigrp <as>",
    (c, a) => {
      if (c.dev.eigrp?.as === +a[0]) delete c.dev.eigrp;
      else c.out("% Invalid autonomous system number");
    },
    "Remove EIGRP",
  ],
  [
    "no router ospf <pid>",
    (c, a) => {
      if (c.dev.ospf?.pid === +a[0]) delete c.dev.ospf;
      else c.out("% Invalid process id");
    },
    "Remove OSPF",
  ],
];

const passive =
  (key: "rip" | "eigrp" | "ospf", on: boolean): H =>
  (c, a) => {
    const n = findIf(c.dev, a[0]);
    if (!n) return c.bad(on ? 1 : 2);
    const p = c.dev[key]!;
    p.passive = on
      ? [...new Set([...p.passive, n])]
      : p.passive.filter((x) => x !== n);
  };

/* ═════════════════════ router rip ═════════════════════ */
export const ripX: E[] = [
  [
    "version <v>",
    (c, a) => {
      if (a[0] !== "1" && a[0] !== "2") return c.bad(1);
      c.dev.rip!.version = +a[0] as 1 | 2;
    },
    "Set routing protocol version",
  ],
  [
    "network <ip>",
    (c, a) => {
      if (!isIp(a[0])) return c.bad(1);
      const r = c.dev.rip!,
        n = majorNet(a[0]);
      if (!r.networks.includes(n)) r.networks.push(n);
    },
    "Enable routing on an IP network",
  ],
  [
    "no network <ip>",
    (c, a) => {
      if (!isIp(a[0])) return c.bad(2);
      const r = c.dev.rip!;
      r.networks = r.networks.filter((x) => x !== majorNet(a[0]));
    },
    "Remove a network",
  ],
  [
    "auto-summary",
    (c) => {
      c.dev.rip!.auto = true;
    },
    "Enable automatic network number summarization",
  ],
  [
    "no auto-summary",
    (c) => {
      c.dev.rip!.auto = false;
    },
    "Disable automatic network number summarization",
  ],
  [
    "passive-interface <if>",
    passive("rip", true),
    "Suppress routing updates on an interface",
  ],
  [
    "no passive-interface <if>",
    passive("rip", false),
    "Allow routing updates on an interface",
  ],
  ["default-information <*>", noop],
  ["maximum-paths <n>", noop],
  ["timers <*>", noop],
  ["neighbor <ip>", noop],
  ["redistribute <*>", noop],
  ["distance <*>", noop],
  ["no default-information <*>", noop],
];

/* ═════════════════════ router eigrp ═════════════════════ */
const eigrpNet = (c: Ctx, ip: string, wild?: string) => {
  if (!isIp(ip)) return c.bad(1);
  if (wild !== undefined && !isWild(wild)) return c.bad(2);
  const e = c.dev.eigrp!;

  // Support for `network 0.0.0.0`
  if (ip === "0.0.0.0" && (!wild || wild === "255.255.255.255")) {
    if (
      !e.networks.some(
        (x) => x.net === "0.0.0.0" && x.wild === "255.255.255.255",
      )
    ) {
      e.networks.push({ net: "0.0.0.0", wild: "255.255.255.255" });
    }
    return;
  }

  // Standard network command
  const net = wild ? ip : majorNet(ip),
    w = wild ?? wildOf(ip);
  if (!e.networks.some((x) => x.net === net && x.wild === w))
    e.networks.push({ net, wild: w });
};
const eigrpNoNet = (c: Ctx, ip: string, wild?: string) => {
  if (!isIp(ip)) return c.bad(2);
  if (wild !== undefined && !isWild(wild)) return c.bad(3);
  const e = c.dev.eigrp!,
    net = wild ? ip : majorNet(ip),
    w = wild ?? wildOf(ip);
  e.networks = e.networks.filter((x) => !(x.net === net && x.wild === w));
};
const setRid =
  (key: "eigrp" | "ospf"): H =>
  (c, a) => {
    if (!isIp(a[0])) return c.bad(1);
    c.dev[key]!.rid = a[0];
  };
// In routing.ts

export const eigrpX: E[] = [
  [
    "network <ip>",
    (c, a) => eigrpNet(c, a[0]),
    "Enable routing on an IP network (classful)",
  ],
  [
    "network <ip> <wild>",
    (c, a) => eigrpNet(c, a[0], a[1]),
    "Enable routing on an IP network with a wildcard mask",
  ],
  [
    "no network <ip>",
    (c, a) => {
      if (!isIp(a[0])) return c.bad(1);
      const e = c.dev.eigrp!;
      e.networks = e.networks.filter((x) => x.net !== majorNet(a[0]));
    },
    "Remove a network",
  ],
  [
    "no network <ip> <wild>",
    (c, a) => {
      if (!isIp(a[0])) return c.bad(1);
      const e = c.dev.eigrp!;
      const net = a[0] === "0.0.0.0" ? "0.0.0.0" : a[0];
      const w = a[0] === "0.0.0.0" ? "255.255.255.255" : a[1];
      e.networks = e.networks.filter((x) => !(x.net === net && x.wild === w));
    },
    "Remove a network",
  ],
  ["eigrp router-id <ip>", setRid("eigrp"), "Router ID for this EIGRP process"],
  ["router-id <ip>", setRid("eigrp"), "Router ID for this EIGRP process"],
  [
    "passive-interface <if>",
    passive("eigrp", true),
    "Suppress routing updates on an interface",
  ],
  [
    "no passive-interface <if>",
    passive("eigrp", false),
    "Allow routing updates on an interface",
  ],
  [
    "variance <n>",
    (c, a) => {
      const v = int(a[0], 1, 128);
      if (v === undefined) return c.bad(1);
      c.dev.eigrp!.variance = v;
    },
    "Control load balancing variance",
  ],
  [
    "no variance",
    (c) => {
      c.dev.eigrp!.variance = 1;
    },
    "Reset to equal-cost load balancing",
  ],
  [
    "maximum-paths <n>",
    (c, a) => {
      const v = int(a[0], 1, 32);
      if (v === undefined) return c.bad(1);
      c.dev.eigrp!.maxPaths = v;
    },
    "Forward packets over multiple paths",
  ],
  [
    "no maximum-paths",
    (c) => {
      c.dev.eigrp!.maxPaths = 4;
    },
    "Reset to the default",
  ],
  ["auto-summary", noop],
  ["no auto-summary", noop],
  ["metric <*>", noop],
  ["eigrp <*>", noop],
  ["traffic-share <*>", noop],
  ["redistribute <*>", noop],
  ["distance <*>", noop],
  ["default-information <*>", noop],
];

/* ═════════════════════ router ospf ═════════════════════ */
const ospfNet =
  (add: boolean): H =>
  (c, a) => {
    if (!isIp(a[0])) return c.bad(add ? 1 : 2);
    if (!isWild(a[1])) return c.bad(add ? 2 : 3);
    const area = isIp(a[2]) ? ip2n(a[2]) : int(a[2], 0, 4294967295);
    if (area === undefined) return c.bad(add ? 4 : 5);
    const o = c.dev.ospf!,
      same = (x: { net: string; wild: string; area: number }) =>
        x.net === a[0] && x.wild === a[1] && x.area === area;
    if (add) {
      if (!o.networks.some(same))
        o.networks.push({ net: a[0], wild: a[1], area });
    } else o.networks = o.networks.filter((x) => !same(x));
  };
export const ospfX: E[] = [
  ["router-id <ip>", setRid("ospf"), "OSPF router-id in IP address format"],
  [
    "network <ip> <wild> area <a>",
    ospfNet(true),
    "Enable routing on an IP network",
  ],
  ["no network <ip> <wild> area <a>", ospfNet(false), "Remove a network"],
  [
    "passive-interface <if>",
    passive("ospf", true),
    "Suppress routing updates on an interface",
  ],
  [
    "no passive-interface <if>",
    passive("ospf", false),
    "Allow routing updates on an interface",
  ],
  [
    "auto-cost reference-bandwidth <mbps>",
    (c, a) => {
      const v = int(a[0], 1, 4294967);
      if (v === undefined) return c.bad(2);
      c.dev.ospf!.refBw = v;
      c.out(
        "% OSPF: Reference bandwidth is changed.",
        "        Please ensure reference bandwidth is consistent across all routers.",
      );
    },
    "Use reference bandwidth method to assign OSPF cost",
  ],
  ["maximum-paths <n>", noop],
  ["default-information <*>", noop],
  ["log-adjacency-changes <*>", noop],
  ["redistribute <*>", noop],
  ["distance <*>", noop],
  ["area <*>", noop],
];

/* ═════════════════════ interface commands that feed the metrics ═════════════════════ */
export const routingIfX: E[] = [
  [
    "bandwidth <kbps>",
    (c, a) => {
      const v = int(a[0], 1, 10000000);
      if (v === undefined) return c.bad(1);
      ifEach(c, (i) => {
        i.bw = v;
      });
    },
    "Set bandwidth informational value (kbit/s)",
  ],
  [
    "no bandwidth",
    (c) =>
      ifEach(c, (i) => {
        delete i.bw;
      }),
    "Reset the bandwidth",
  ],
  [
    "delay <tens>",
    (c, a) => {
      const v = int(a[0], 1, 16777215);
      if (v === undefined) return c.bad(1);
      ifEach(c, (i) => {
        i.delay = v;
      });
    },
    "Specify interface throughput delay (tens of microseconds)",
  ],
  [
    "no delay",
    (c) =>
      ifEach(c, (i) => {
        delete i.delay;
      }),
    "Reset the delay",
  ],
  [
    "ip ospf cost <n>",
    (c, a) => {
      const v = int(a[0], 1, 65535);
      if (v === undefined) return c.bad(3);
      ifEach(c, (i) => {
        i.ospfCost = v;
      });
    },
    "Interface cost",
  ],
  [
    "no ip ospf cost",
    (c) =>
      ifEach(c, (i) => {
        delete i.ospfCost;
      }),
    "Reset the OSPF cost",
  ],
  [
    "ip ospf priority <n>",
    (c, a) => {
      const v = int(a[0], 0, 255);
      if (v === undefined) return c.bad(3);
      ifEach(c, (i) => {
        i.ospfPri = v;
      });
    },
    "Router priority (DR election)",
  ],
  [
    "no ip ospf priority",
    (c) =>
      ifEach(c, (i) => {
        delete i.ospfPri;
      }),
    "Reset the OSPF priority",
  ],
  [
    "ip ospf hello-interval <seconds>",
    (c, a) => {
      const v = int(a[0], 1, 65535);
      if (v === undefined) return c.bad(3);

      ifEach(c, (i) => {
        i.ospfHello = v;
      });
    },
    "Set OSPF hello interval in seconds",
  ],
  [
    "no ip ospf hello-interval",
    (c) =>
      ifEach(c, (i) => {
        delete i.ospfHello;
      }),
    "Restore the default OSPF hello interval",
  ],
  [
    "ip ospf network point-to-point",
    (c) =>
      ifEach(c, (i) => {
        i.ospfNetwork = "point-to-point";
      }),
    "Configure OSPF point-to-point network type",
  ],
  [
    "no ip ospf network",
    (c) =>
      ifEach(c, (i) => {
        delete i.ospfNetwork;
      }),
    "Restore the default OSPF network type",
  ],
];

/* ═════════════════════ show commands ═════════════════════ */
const FILTERS: Record<string, string> = {
  static: "S",
  connected: "C",
  rip: "R",
  eigrp: "D",
  ospf: "O",
};

function showRoute(c: Ctx, filter?: string) {
  const d = c.dev,
    want = filter ? FILTERS[filter] : undefined;
  const rows = routeTable(c.view(), d).filter((r) => !want || r.t === want);
  const gw = rows.find(
    (r) => r.len === 0 && r.net === "0.0.0.0" && r.t !== "C",
  );
  const L = [
    "Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP",
    "       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area",
    "       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2",
    "       E1 - OSPF external type 1, E2 - OSPF external type 2",
    "       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2",
    "       ia - IS-IS inter area, * - candidate default, U - per-user static route",
    "       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP",
    "       + - replicated route, % - next hop override",
    "",
    gw
      ? `Gateway of last resort is ${gw.via ?? "0.0.0.0"} to network 0.0.0.0`
      : "Gateway of last resort is not set",
    "",
  ];
  const groups = new Map<string, RE[]>();
  for (const r of rows) {
    const k = r.len === 0 ? "default" : netOf(r.net, lenMask(classLen(r.net)));
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const code = (r: RE) =>
    (r.t === "O" && r.ia ? "O IA" : r.t) +
    (r.len === 0 && r.net === "0.0.0.0" && r.t !== "C" ? "*" : "");
  const line = (r: RE, indent: boolean, cont: boolean) => {
    const w = indent ? 9 : 6,
      p = `${r.net}/${r.len}`;
    if (cont)
      return (
        " ".repeat(w + p.length + 1) +
        `[${r.ad}/${r.metric ?? 0}] via ${r.via}, ${r.iface}`
      ); // 2nd+ equal-cost path
    const cd = code(r).padEnd(w);
    if (r.t === "C" || r.t === "L" || r.exit)
      return `${cd}${p} is directly connected, ${r.iface}`;
    const dynamic = r.t === "R" || r.t === "D" || r.t === "O";
    return `${cd}${p} [${r.ad}/${r.metric ?? 0}] via ${r.via}${dynamic ? `, ${r.iface}` : ""}`;
  };
  const emit = (g: RE[], indent: boolean) => {
    let prev = "";
    for (const r of g) {
      const k = `${r.net}/${r.len}`;
      L.push(line(r, indent, k === prev));
      prev = k;
    }
  };
  [...groups.entries()]
    .sort(
      (a, b) =>
        ip2n(a[0] === "default" ? "0.0.0.0" : a[0]) -
        ip2n(b[0] === "default" ? "0.0.0.0" : b[0]),
    )
    .forEach(([k, g]) => {
      g.sort((a, b) => ip2n(a.net) - ip2n(b.net) || a.len - b.len);
      if (k === "default") return emit(g, false);
      const prefixes = new Set(g.map((r) => `${r.net}/${r.len}`)),
        masks = new Set(g.map((r) => r.len)),
        nat = classLen(g[0].net);
      const natural = prefixes.size === 1 && g[0].len === nat;
      if (!natural)
        L.push(
          masks.size > 1
            ? `      ${k}/${nat} is variably subnetted, ${prefixes.size} subnets, ${masks.size} masks`
            : `      ${k}/${[...masks][0]} is subnetted, ${prefixes.size} subnets`,
        );
      emit(g, !natural);
    });
  c.out(...L);
}

const showRouteArg: H = (c, a) => {
  const x = a[0].toLowerCase();
  if (isIp(a[0])) {
    const cover = routeTable(c.view(), c.dev).filter(
      (q) => netOf(a[0], lenMask(q.len)) === q.net,
    );
    if (!cover.length) return c.out("% Network not in table");
    const bl = Math.max(...cover.map((q) => q.len)),
      top = cover.filter((q) => q.len === bl),
      ad = Math.min(...top.map((q) => q.ad));
    const b = top.filter((q) => q.ad === ad),
      f = b[0];
    const via = {
      S: "static",
      C: "connected",
      L: "local",
      R: "rip",
      D: `eigrp ${c.dev.eigrp?.as}`,
      O: `ospf ${c.dev.ospf?.pid}`,
    }[f.t];
    return c.out(
      `Routing entry for ${f.net}/${f.len}`,
      `  Known via "${via}", distance ${f.ad}, metric ${f.metric ?? 0}`,
      "  Routing Descriptor Blocks:",
      ...b.map(
        (q, i) =>
          `  ${i === 0 ? "*" : " "} ${q.via ?? "directly connected"}, via ${q.iface}`,
      ),
      `      Route metric is ${f.metric ?? 0}, traffic share count is 1`,
    );
  }
  const k = Object.keys(FILTERS).find((n) => n.startsWith(x));
  if (k) return showRoute(c, k);
  c.bad(3);
};

const showProtocols: H = (c) => {
  const d = c.dev,
    dyn = getDyn(c.view()),
    L: string[] = ["*** IP Routing is NSF aware ***", ""];
  if (!d.rip && !d.eigrp && !d.ospf)
    return c.out(
      ...L,
      "No dynamic routing protocols are running (static routing only).",
    );
  const pass = (p: string[]) =>
    p.length ? ["  Passive Interface(s):", ...p.map((n) => `    ${n}`)] : [];
  if (d.rip) {
    const r = d.rip,
      on = Object.entries(d.ifaces).filter(
        ([n, i]) =>
          i.ip &&
          !r.passive.includes(n) &&
          r.networks.includes(majorNet(i.ip)) &&
          !n.startsWith("Loopback"),
      );
    const gws = [
      ...new Set(
        (dyn.routes[d.id] ?? [])
          .filter((x) => x.t === "R")
          .flatMap((x) => x.paths.map((p) => p.via)),
      ),
    ];
    L.push(
      'Routing Protocol is "rip"',
      "  Outgoing update filter list for all interfaces is not set",
      "  Incoming update filter list for all interfaces is not set",
      "  Sending updates every 30 seconds, next due in 12 seconds",
      "  Invalid after 180 seconds, hold down 180, flushed after 240",
      "  Redistributing: rip",
      `  Default version control: send version ${r.version}, receive ${r.version === 1 ? "any version" : "version 2"}`,
      "    Interface             Send  Recv  Triggered RIP  Key-chain",
      ...on.map(
        ([n]) =>
          `    ${n.padEnd(22)}${r.version}     ${r.version === 1 ? "1 2" : "2"}`,
      ),
      `  Automatic network summarization is ${r.auto ? "in effect" : "not in effect"}`,
      "  Maximum path: 4",
      "  Routing for Networks:",
      ...r.networks.map((x) => `    ${x}`),
      ...pass(r.passive),
      "  Routing Information Sources:",
      "    Gateway         Distance      Last Update",
      ...gws.map((g) => `    ${g.padEnd(16)}120      00:00:12`),
      "  Distance: (default is 120)",
      "",
    );
  }
  if (d.eigrp) {
    const e = d.eigrp,
      srcs = [...new Set((dyn.eigrpNbrs[d.id] ?? []).map((n) => n.ip))];
    L.push(
      `Routing Protocol is "eigrp ${e.as}"`,
      "  Outgoing update filter list for all interfaces is not set",
      "  Incoming update filter list for all interfaces is not set",
      "  Default networks flagged in outgoing updates",
      "  Default networks accepted from incoming updates",
      `  EIGRP-IPv4 Protocol for AS(${e.as})`,
      "    Metric weight K1=1, K2=0, K3=1, K4=0, K5=0",
      "    NSF-aware route hold timer is 240",
      `    Router-ID: ${dyn.eigrpRid[d.id]}`,
      "    Topology : 0 (base)",
      "      Active Timer: 3 min",
      "      Distance: internal 90 external 170",
      `      Maximum path: ${e.maxPaths}`,
      "      Maximum hopcount 100",
      `      Maximum metric variance ${e.variance}`,
      "",
      "  Automatic Summarization: disabled",
      `  Maximum path: ${e.maxPaths}`,
      "  Routing for Networks:",
      ...e.networks.map((x) => `    ${x.net}/${wildLen(x.wild)}`),
      ...pass(e.passive),
      "  Routing Information Sources:",
      "    Gateway         Distance      Last Update",
      ...srcs.map((g) => `    ${g.padEnd(16)}90      00:05:12`),
      "  Distance: internal 90 external 170",
      "",
    );
  }
  if (d.ospf) {
    const o = d.ospf,
      areas = new Set((dyn.ospfIfs[d.id] ?? []).map((x) => x.area)),
      srcs = [...new Set((dyn.ospfNbrs[d.id] ?? []).map((n) => n.rid))];
    L.push(
      `Routing Protocol is "ospf ${o.pid}"`,
      "  Outgoing update filter list for all interfaces is not set",
      "  Incoming update filter list for all interfaces is not set",
      `  Router ID ${dyn.ospfRid[d.id]}`,
      `  Number of areas in this router is ${areas.size}. ${areas.size} normal 0 stub 0 nssa`,
      "  Maximum path: 4",
      "  Routing for Networks:",
      ...o.networks.map((x) => `    ${x.net} ${x.wild} area ${x.area}`),
      ...pass(o.passive),
      "  Routing Information Sources:",
      "    Gateway         Distance      Last Update",
      ...srcs.map((g) => `    ${g.padEnd(16)}110      00:01:22`),
      "  Distance: (default is 110)",
      "",
    );
  }
  c.out(...L);
};

const showRipDb: H = (c) => {
  if (!c.dev.rip) return c.out("% RIP is not running");
  const L: string[] = [];
  for (const e of getDyn(c.view()).ripDb[c.dev.id] ?? []) {
    if (e.conn) L.push(`${e.net}/${e.len}    directly connected, ${e.conn}`);
    else {
      L.push(`${e.net}/${e.len}`);
      for (const p of e.paths)
        L.push(`    [${e.m}] via ${p.via}, 00:00:12, ${p.iface}`);
    }
  }
  c.out(...L);
};

const showEigrpNbrs: H = (c) => {
  const e = c.dev.eigrp;
  if (!e) return c.out("% EIGRP is not running");
  const nb = getDyn(c.view()).eigrpNbrs[c.dev.id] ?? [];
  c.out(
    `EIGRP-IPv4 Neighbors for AS(${e.as})`,
    "H   Address                 Interface              Hold Uptime   SRTT   RTO  Q  Seq",
    "                                                   (sec)         (ms)       Cnt Num",
    ...nb.map(
      (n, k) =>
        `${String(k).padEnd(4)}${n.ip.padEnd(24)}${shortIf(n.iface).padEnd(23)}${"13".padStart(4)} 00:10:00${"1".padStart(7)}${"100".padStart(5)}  0  ${k + 1}`,
    ),
  );
};

const showEigrpTopo: H = (c) => {
  const e = c.dev.eigrp;
  if (!e) return c.out("% EIGRP is not running");
  const dyn = getDyn(c.view());
  const L = [
    `EIGRP-IPv4 Topology Table for AS(${e.as})/ID(${dyn.eigrpRid[c.dev.id]})`,
    "Codes: P - Passive, A - Active, U - Update, Q - Query, R - Reply,",
    "       r - reply Status, s - sia Status",
    "",
  ];
  for (const t of dyn.eigrpTopo[c.dev.id] ?? []) {
    if (t.conn) {
      L.push(
        `P ${t.net}/${t.len}, 1 successors, FD is ${t.fd}`,
        `        via Connected, ${t.conn}`,
      );
      continue;
    }
    L.push(
      `P ${t.net}/${t.len}, ${t.ent.filter((x) => x.succ).length} successors, FD is ${t.fd}`,
    );
    for (const x of t.ent.filter((y) => y.succ || y.feasible))
      L.push(`        via ${x.via} (${x.fd}/${x.rd}), ${x.iface}`);
  }
  c.out(...L);
};

const showOspfNbr: H = (c) => {
  if (!c.dev.ospf) return c.out("% OSPF is not running");
  const nb = getDyn(c.view()).ospfNbrs[c.dev.id] ?? [];
  c.out(
    "Neighbor ID     Pri   State           Dead Time   Address         Interface",
    ...nb.map(
      (n) =>
        `${n.rid.padEnd(16)}${String(n.pri).padStart(3)}   ${(n.state + "/" + n.role).padEnd(16)}00:00:33    ${n.addr.padEnd(16)}${n.iface}`,
    ),
  );
};

const showOspfIfBrief: H = (c) => {
  const o = c.dev.ospf;
  if (!o) return c.out("% OSPF is not running");
  const ifs = getDyn(c.view()).ospfIfs[c.dev.id] ?? [];
  c.out(
    "Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C",
    ...ifs.map((x) => {
      const i = c.dev.ifaces[x.name];
      return `${shortIf(x.name).padEnd(13)}${String(o.pid).padEnd(6)}${String(x.area).padEnd(16)}${`${i.ip}/${maskLen(i.mask!)}`.padEnd(19)}${String(x.cost).padEnd(6)}${x.state.padEnd(6)}${x.full}/${x.total}`;
    }),
  );
};

const showOspf: H = (c) => {
  const o = c.dev.ospf;
  if (!o) return c.out("% OSPF is not running");
  const dyn = getDyn(c.view()),
    areas = [...new Set((dyn.ospfIfs[c.dev.id] ?? []).map((x) => x.area))].sort(
      (a, b) => a - b,
    );
  c.out(
    ` Routing Process "ospf ${o.pid}" with ID ${dyn.ospfRid[c.dev.id]}`,
    " Supports only single TOS(TOS0) routes",
    ` Reference bandwidth unit is ${o.refBw} mbps`,
    ` Number of areas in this router is ${areas.length}. ${areas.length} normal 0 stub 0 nssa`,
    ...areas.map((a) => `    Area ${a}`),
  );
};

export const routingPrivX: E[] = [
  ["show ip route", (c) => showRoute(c), "IP routing table"],
  [
    "show ip route <x>",
    showRouteArg,
    "Filter: static | connected | rip | eigrp | ospf | address",
  ],
  [
    "show ip protocols",
    showProtocols,
    "IP routing protocol process parameters and statistics",
  ],
  ["show ip rip database", showRipDb, "RIP database"],
  ["show ip eigrp neighbors", showEigrpNbrs, "IP-EIGRP neighbors"],
  ["show ip eigrp topology", showEigrpTopo, "IP-EIGRP topology table"],
  ["show ip ospf neighbor", showOspfNbr, "Neighbor list"],
  ["show ip ospf interface brief", showOspfIfBrief, "Brief interface summary"],
  ["show ip ospf", showOspf, "OSPF information"],
  [
    "show ip eigrp interfaces",
    (c) => {
      if (!c.dev.eigrp) return c.out("% EIGRP is not running");
      const L = [
        "EIGRP-IPv4 Interfaces for AS(" + c.dev.eigrp.as + ")",
        "Interface        Peers  Passive Admin/Oper Bandwidth  Delay",
      ];
      for (const [n, i] of Object.entries(c.dev.ifaces)) {
        if (!i.ip || !i.mask || !ifUp(c.view(), c.dev.id, n)) continue;
        const pass = c.dev.eigrp.passive.includes(n) ? "Yes" : "No";
        const b = i.bw ?? 10000,
          dly = i.delay ?? 100;
        L.push(
          `${shortIf(n).padEnd(16)}0      ${pass.padEnd(7)}Yes/Yes  ${String(b).padEnd(10)}${dly}`,
        );
      }
      c.out(...L);
    },
  ],
  [
    "show run interface <if>",
    (c, a) => {
      const n = findIf(c.dev, a[0]);
      if (!n) return c.bad(3);
      c.out(
        `Building configuration...`,
        "",
        `Current configuration : 120 bytes`,
        "!",
        `interface ${n}`,
        ` ip address ${c.dev.ifaces[n].ip} ${c.dev.ifaces[n].mask}`,
        "!",
      );
    },
  ],
  [
    "show log",
    (c) =>
      c.out(
        "Syslog logging: enabled (0 messages dropped, 3 messages rate-limited)",
        "    Console logging: level debugging, 5 messages logged",
        "    Monitor logging: level debugging, 0 messages logged",
        "",
        "*Mar  1 00:00:12.005: %DUAL-5-NBRCHANGE: EIGRP-IPv4 100: Neighbor 150.10.1.2 (Ethernet0/0) is up: new adjacency",
      ),
  ],
];

/* ═════════════════════ running-config ═════════════════════ */
export function renderIfExtra(i: Iface): string[] {
  const L: string[] = [];
  if (i.bw !== undefined) L.push(` bandwidth ${i.bw}`);
  if (i.delay !== undefined) L.push(` delay ${i.delay}`);
  if (i.ospfCost !== undefined) L.push(` ip ospf cost ${i.ospfCost}`);
  if (i.ospfPri !== undefined) L.push(` ip ospf priority ${i.ospfPri}`);
  if (i.ospfHello !== undefined)
    L.push(` ip ospf hello-interval ${i.ospfHello}`);

  if (i.ospfNetwork === "point-to-point")
    L.push(" ip ospf network point-to-point");
  return L;
}

export function renderRouting(d: Dev): string[] {
  const L: string[] = [];
  if (d.rip) {
    const r = d.rip;
    L.push("router rip");
    if (r.version === 2) L.push(" version 2");
    r.passive.forEach((n) => L.push(` passive-interface ${n}`));
    r.networks.forEach((n) => L.push(` network ${n}`));
    if (!r.auto) L.push(" no auto-summary");
    L.push("!");
  }
  if (d.eigrp) {
    const e = d.eigrp;
    L.push(`router eigrp ${e.as}`);
    e.networks.forEach((n) => L.push(` network ${n.net} ${n.wild}`));
    e.passive.forEach((n) => L.push(` passive-interface ${n}`));
    if (e.variance !== 1) L.push(` variance ${e.variance}`);
    if (e.maxPaths !== 4) L.push(` maximum-paths ${e.maxPaths}`);
    if (e.rid) L.push(` eigrp router-id ${e.rid}`);
    L.push("!");
  }
  if (d.ospf) {
    const o = d.ospf;
    L.push(`router ospf ${o.pid}`);
    if (o.rid) L.push(` router-id ${o.rid}`);
    if (o.refBw !== 100) L.push(` auto-cost reference-bandwidth ${o.refBw}`);
    o.passive.forEach((n) => L.push(` passive-interface ${n}`));
    o.networks.forEach((n) =>
      L.push(` network ${n.net} ${n.wild} area ${n.area}`),
    );
    L.push("!");
  }
  return L;
}

// keep the helper imports used even if a build strips unused ones
void n2ip;
