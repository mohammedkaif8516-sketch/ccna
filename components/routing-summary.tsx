"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * RoutingExplainer  (CCNA Topic 08)
 *   1 Static routing   : routing table, route codes, a ping that needs routes both ways
 *   2 Best route       : longest prefix, AD, metric lookup tool, AD bars, floating static, default and Null0
 *   3 Dynamic and RIP  : IGP vs EGP, hop count, timer lifecycle, RIPv1 vs RIPv2
 *   4 EIGRP            : neighbor checker, metric builder, successor and feasible successor, DUAL steps
 *   5 OSPF             : cost, adjacency states, DR/BDR election, areas, wildcard masks
 *   6 OSPF advanced    : LSA types, stub area chooser, virtual links, E1 vs E2, path control
 *   7 Redistribution   : an ASBR translating routes between domains
 *   8 Common mistakes  : wrong belief on the front, the truth on the back
 *   9 Interview prep   : 30-second answer and the usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";

const TABS = [
  { id: "static", label: "1 · Static routing" },
  { id: "best", label: "2 · Best route" },
  { id: "rip", label: "3 · Dynamic and RIP" },
  { id: "eigrp", label: "4 · EIGRP" },
  { id: "ospf", label: "5 · OSPF" },
  { id: "adv", label: "6 · OSPF advanced" },
  { id: "redist", label: "7 · Redistribution" },
  { id: "myths", label: "8 · Common mistakes" },
  { id: "interview", label: "9 · Interview prep" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ───────────────────────── small helpers ───────────────────────── */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-background p-4 ${className}`}>{children}</div>;
}

function Tip({ title = "Remember", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-primary">{title}: </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function SimpleTable({ head, rows, hit }: { head: string[]; rows: string[][]; hit?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[480px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t" style={hit === i ? { color: GREEN, fontWeight: 600 } : undefined}>
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold" : ""}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

function Mini({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
      <p className="break-words text-xs font-medium" style={color ? { color } : undefined}>{v}</p>
    </div>
  );
}

function Code({ lines }: { lines: string[] }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300">
      {lines.join("\n")}
    </pre>
  );
}

const ipInt = (s: string) => {
  const p = s.trim().split(".").map(Number);
  if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return null;
  return (((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0);
};
const maskOf = (l: number) => (l === 0 ? 0 : (0xffffffff << (32 - l)) >>> 0);
const toIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");

/* ───────────────────────── 1 · static routing ───────────────────────── */

const NODES = ["PC1", "R1", "R2", "R3", "PC3"];
const TL = [0, 1, 2, 3, 4, 3, 2, 1, 0];

const STATICS = [
  { k: "a", r: "R1", cmd: "ip route 192.168.3.0 255.255.255.0 192.168.4.2", dir: "way there" },
  { k: "b", r: "R2", cmd: "ip route 192.168.3.0 255.255.255.0 192.168.5.2", dir: "way there" },
  { k: "c", r: "R3", cmd: "ip route 192.168.1.0 255.255.255.0 192.168.5.1", dir: "way back" },
  { k: "d", r: "R2", cmd: "ip route 192.168.1.0 255.255.255.0 192.168.4.1", dir: "way back" },
] as const;
type SK = (typeof STATICS)[number]["k"];

const CONNECTED: Record<string, string[]> = {
  R1: ["192.168.1.0/24  f0/0", "192.168.4.0/24  f0/1"],
  R2: ["192.168.4.0/24  f0/0", "192.168.5.0/24  f0/1", "192.168.2.0/24  f0/2"],
  R3: ["192.168.5.0/24  f0/0", "192.168.3.0/24  f0/1"],
};
const STATIC_ROWS: Record<string, { k: SK; t: string }[]> = {
  R1: [{ k: "a", t: "192.168.3.0/24 [1/0] via 192.168.4.2" }],
  R2: [{ k: "b", t: "192.168.3.0/24 [1/0] via 192.168.5.2" }, { k: "d", t: "192.168.1.0/24 [1/0] via 192.168.4.1" }],
  R3: [{ k: "c", t: "192.168.1.0/24 [1/0] via 192.168.5.1" }],
};

const CODES = [
  ["C", "Connected"], ["S", "Static"], ["S*", "Static default route"], ["R", "RIP"], ["D", "EIGRP internal"],
  ["D EX", "EIGRP external"], ["O", "OSPF intra-area"], ["O IA", "OSPF inter-area"], ["O E1 / O E2", "OSPF external"],
];

function StaticSection() {
  const [on, setOn] = useState<Record<SK, boolean>>({ a: false, b: false, c: false, d: false });
  const [t, setT] = useState(0);
  const [st, setSt] = useState<"idle" | "run" | "fail" | "ok">("idle");
  const [rt, setRt] = useState("R1");

  const fails = (i: number) => (i === 1 && !on.a) || (i === 2 && !on.b) || (i === 5 && !on.c) || (i === 6 && !on.d);

  useEffect(() => {
    if (st !== "run") return;
    const id = setTimeout(() => {
      const nt = t + 1;
      setT(nt);
      if (fails(nt)) setSt("fail");
      else if (nt === 8) setSt("ok");
    }, 850);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, t]);

  const send = () => { setT(0); setSt("run"); };
  const reset = () => { setT(0); setSt("idle"); };
  const flip = (k: SK) => { setOn((o) => ({ ...o, [k]: !o[k] })); reset(); };
  const failNode = NODES[TL[t]];
  const goingBack = t > 4;
  const dotColor = st === "fail" ? RED : goingBack ? GREEN : BLUE;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">A router forwards using its routing table</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The table holds the best-known path to every reachable network. A router knows its <span className="font-semibold text-foreground">connected</span> networks
          for free (code C). Everything else is <span className="font-semibold text-foreground">unknown</span> until you add a route: by hand (static, S) or learned from a
          routing protocol (dynamic). With no matching entry, the router drops the packet.
        </p>
        <div className="mt-3"><Code lines={["(config)# ip route <network> <mask> <next-hop>", "(config)# ip route 192.168.2.0 255.255.255.0 192.168.4.2"]} /></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Ping across three routers</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          PC1 (192.168.1.0/24) pings PC3 (192.168.3.0/24). Static routes do not propagate, and a ping needs a route <span className="font-semibold text-foreground">both ways</span>.
          Switch routes on, then send the ping.
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {STATICS.map((s) => (
            <button
              key={s.k}
              type="button"
              onClick={() => flip(s.k)}
              className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors"
              style={{ borderColor: on[s.k] ? GREEN : undefined, background: on[s.k] ? `${GREEN}10` : undefined }}
            >
              <span className="w-7 text-xs font-bold">{s.r}</span>
              <span className="flex-1 font-mono text-[11px]">{s.cmd}</span>
              <Badge variant="secondary">{s.dir}</Badge>
              <span className="w-8 text-right text-xs font-semibold" style={{ color: on[s.k] ? GREEN : RED }}>{on[s.k] ? "ON" : "OFF"}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setOn({ a: true, b: true, c: true, d: true }); reset(); }}>Add all four</Button>
          <Button size="sm" variant="outline" onClick={() => { setOn({ a: false, b: false, c: false, d: false }); reset(); }}>Clear all</Button>
        </div>

        <div className="relative mx-6 mt-8 h-20">
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-border" />
          {NODES.map((n, i) => (
            <div key={n} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${i * 25}%` }}>
              <div className="rounded-md border bg-background px-2 py-1 text-xs font-bold" style={{ borderColor: st === "fail" && n === failNode && TL[t] === i ? RED : undefined }}>{n}</div>
            </div>
          ))}
          <div
            className="absolute top-[18px] h-3.5 w-3.5 -translate-x-1/2 rounded-full transition-all duration-700"
            style={{ left: `${TL[t] * 25}%`, background: dotColor, boxShadow: `0 0 0 4px ${dotColor}30` }}
          />
          {st === "fail" && (
            <p className="n8-pop absolute top-10 -translate-x-1/2 text-xs font-bold" style={{ left: `${TL[t] * 25}%`, color: RED }}>✕ dropped</p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={st === "run"} onClick={send}>Send ping</Button>
          <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
        </div>
        <p key={`${st}-${t}`} className="n8-fade mt-3 min-h-[2.5rem] text-xs leading-5" style={{ color: st === "fail" ? RED : st === "ok" ? GREEN : undefined }}>
          {st === "idle" && <span className="text-muted-foreground">Press Send ping.</span>}
          {st === "run" && <span className="text-muted-foreground">{goingBack ? "Reply travelling back" : "Request travelling"}... now at {NODES[TL[t]]}.</span>}
          {st === "ok" && "Success: the request got there and the reply got home. Routes exist in both directions."}
          {st === "fail" && !goingBack && `${failNode} has no route to 192.168.3.0, so it drops the packet and sends back "Destination host unreachable".`}
          {st === "fail" && goingBack && `The request arrived, but ${failNode} has no route back to 192.168.1.0. The reply dies, and PC1 just sees "Request timed out".`}
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Look at a routing table</p>
        <div className="mt-3 flex gap-2">
          {["R1", "R2", "R3"].map((r) => <Pick key={r} active={rt === r} onClick={() => setRt(r)}>{r}</Pick>)}
        </div>
        <div key={rt} className="n8-fade mt-3 rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300">
          {CONNECTED[rt].map((c) => <p key={c}>C  {c}</p>)}
          {STATIC_ROWS[rt].filter((x) => on[x.k]).map((x) => <p key={x.k} className="n8-pop text-white">S  {x.t}</p>)}
          {STATIC_ROWS[rt].every((x) => !on[x.k]) && <p className="text-green-300/60">(no static routes yet. Turn some on above.)</p>}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">Route codes</p>
          <div className="mt-3"><SimpleTable head={["Code", "Meaning"]} rows={CODES} /></div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Static vs dynamic</p>
          <div className="mt-3">
            <SimpleTable
              head={["", "Static", "Dynamic"]}
              rows={[
                ["Config", "Per router, per network", "Once per router"],
                ["CPU", "Minimal", "Higher"],
                ["Bandwidth", "None", "Used for updates"],
                ["Failure", "No reaction (unless floating)", "Reroutes automatically"],
                ["Control", "Total", "Protocol decides"],
                ["Fits", "Small or stable", "Large or changing"],
              ]}
            />
          </div>
        </Panel>
      </div>

      <Tip title="Careful">
        The next hop must be reachable, usually on a directly connected subnet. You can also give an exit interface instead of a next hop. Static routing is preferred for small stable networks, default routes toward an ISP, and paths you want deterministic.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 2 · best route ───────────────────────── */

type Rt = { net: string; len: number; src: string; ad: number; metric: number; via: string };
const SETS: { id: string; name: string; dests: string[]; routes: Rt[]; note: string }[] = [
  {
    id: "A", name: "Prefix vs the rest", dests: ["192.168.30.1", "192.168.30.254", "8.8.8.8"],
    note: "Both statics have AD 1. Which one covers the destination decides.",
    routes: [
      { net: "192.168.30.0", len: 24, src: "S", ad: 1, metric: 0, via: "R2" },
      { net: "192.168.30.0", len: 25, src: "S", ad: 1, metric: 0, via: "R4" },
      { net: "0.0.0.0", len: 0, src: "S*", ad: 1, metric: 0, via: "ISP" },
    ],
  },
  {
    id: "B", name: "Same protocol, metric", dests: ["192.168.30.50"], note: "Same prefix, same protocol, same AD. The lower metric wins.",
    routes: [
      { net: "192.168.30.0", len: 24, src: "D", ad: 90, metric: 1000, via: "R2" },
      { net: "192.168.30.0", len: 24, src: "D", ad: 90, metric: 2000, via: "R3" },
    ],
  },
  {
    id: "C", name: "Different protocols, AD", dests: ["192.168.30.50"], note: "Metrics are not comparable across protocols, so the lowest AD decides.",
    routes: [
      { net: "192.168.30.0", len: 24, src: "D", ad: 90, metric: 3000, via: "R2" },
      { net: "192.168.30.0", len: 24, src: "O", ad: 110, metric: 20, via: "R3" },
      { net: "192.168.30.0", len: 24, src: "S", ad: 1, metric: 0, via: "R4" },
      { net: "192.168.30.0", len: 24, src: "R", ad: 120, metric: 2, via: "R5" },
    ],
  },
  {
    id: "D", name: "Equal cost", dests: ["192.168.30.50"], note: "Identical in every way, so the router load-balances.",
    routes: [
      { net: "192.168.30.0", len: 24, src: "S", ad: 1, metric: 0, via: "R2" },
      { net: "192.168.30.0", len: 24, src: "S", ad: 1, metric: 0, via: "R3" },
    ],
  },
];

function decide(dest: string, routes: Rt[]) {
  const d = ipInt(dest);
  if (d === null) return null;
  const lab: { t: string; c: string }[] = routes.map(() => ({ t: "no match", c: "" }));
  let alive = routes.map((r, i) => i).filter((i) => ((d & maskOf(routes[i].len)) >>> 0) === ipInt(routes[i].net));
  if (alive.length === 0) return { lab, winners: 0, msg: "No route matches and there is no default route, so the packet is dropped." };
  const step = (filter: (i: number) => boolean, why: string) => {
    const next = alive.filter(filter);
    alive.filter((i) => !next.includes(i)).forEach((i) => (lab[i] = { t: why, c: RED }));
    alive = next;
  };
  const maxLen = Math.max(...alive.map((i) => routes[i].len));
  step((i) => routes[i].len === maxLen, "lost: shorter prefix");
  const minAd = Math.min(...alive.map((i) => routes[i].ad));
  step((i) => routes[i].ad === minAd, "lost: higher AD");
  const minM = Math.min(...alive.map((i) => routes[i].metric));
  step((i) => routes[i].metric === minM, "lost: higher metric");
  alive.forEach((i) => (lab[i] = { t: alive.length > 1 ? "WINNER (load-balanced)" : "WINNER", c: GREEN }));
  routes.forEach((_, i) => { if (lab[i].t === "no match") lab[i].c = ""; });
  return { lab, winners: alive.length, msg: alive.length > 1 ? "Tied on prefix, AD and metric: traffic is shared across all winners." : `Traffic goes via ${routes[alive[0]].via}.` };
}

const ADS: [string, number][] = [
  ["Connected", 0], ["Static / default static", 1], ["EIGRP summary", 5], ["eBGP", 20], ["EIGRP internal", 90],
  ["OSPF", 110], ["IS-IS", 115], ["RIP", 120], ["EIGRP external", 170], ["iBGP", 200],
];

function BestSection() {
  const [si, setSi] = useState(0);
  const [dest, setDest] = useState("192.168.30.1");
  const [fail, setFail] = useState(false);
  const set = SETS[si];
  const res = decide(dest, set.routes);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">How a router picks the best route</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Mini k="1 · Longest prefix match" v="The most specific route that contains the destination always wins. Nothing beats it." color={GREEN} />
          <Mini k="2 · Lowest Administrative Distance" v="Same prefix but different sources: the more trusted source wins." color={BLUE} />
          <Mini k="3 · Lowest metric" v="Same prefix and same protocol: the better metric wins." color={AMBER} />
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            Many notes list metric before AD. It is the other way round: metrics from different protocols cannot be compared, so AD is checked first, and the metric only breaks ties inside one protocol.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Route lookup tool</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SETS.map((x, i) => <Pick key={x.id} active={si === i} onClick={() => { setSi(i); setDest(x.dests[0]); }}>{x.name}</Pick>)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{set.note}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold">Destination:</span>
          <input value={dest} onChange={(e) => setDest(e.target.value)} className="w-40 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs" aria-label="Destination IP" />
          {set.dests.map((d) => <Pick key={d} active={dest === d} onClick={() => setDest(d)}>{d}</Pick>)}
        </div>

        {res ? (
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[520px] text-xs">
              <thead className="bg-muted/50">
                <tr>{["Route", "Source", "AD / metric", "Via", "Result"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {set.routes.map((r, i) => (
                  <tr key={`${dest}-${si}-${i}`} className="n8-fade border-t" style={{ background: res.lab[i].c === GREEN ? `${GREEN}12` : undefined, opacity: res.lab[i].t === "no match" ? 0.45 : 1 }}>
                    <td className="px-3 py-2 font-mono font-semibold">{r.net}/{r.len}</td>
                    <td className="px-3 py-2">{r.src}</td>
                    <td className="px-3 py-2 font-mono">[{r.ad}/{r.metric}]</td>
                    <td className="px-3 py-2">{r.via}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: res.lab[i].c || undefined }}>{res.lab[i].t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-xs" style={{ color: RED }}>Enter a valid IPv4 address.</p>
        )}
        {res && <p key={`${dest}-${si}`} className="n8-fade mt-3 text-xs font-medium">{res.msg}</p>}
        <div className="mt-3">
          <Tip title="Try this">Set A with .30.1 and then .30.254. The /25 only covers .0 to .127, so .254 falls back to the /24.</Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Default Administrative Distances</p>
        <p className="mt-1 text-xs text-muted-foreground">Lower means more trusted. It is only used to break ties, after prefix length.</p>
        <div className="mt-3 flex flex-col gap-1.5">
          {ADS.map(([n, v]) => (
            <div key={n} className="flex items-center gap-3 text-xs">
              <span className="w-40 font-semibold">{n}</span>
              <span className="w-8 font-mono">{v}</span>
              <div className="h-3 flex-1 rounded bg-muted/40">
                <div className="n8-grow h-full rounded" style={{ width: `${Math.max((v / 255) * 100, 1.5)}%`, background: v <= 1 ? GREEN : v < 100 ? BLUE : v < 150 ? AMBER : PURPLE }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Floating static route (backup path)</p>
        <p className="mt-1 text-xs text-muted-foreground">Same ip route command with a higher AD on the end. It sits unused until the primary route disappears.</p>
        <div className="mt-3"><Code lines={["ip route 10.0.0.0 255.0.0.0 192.168.2.2", "ip route 10.0.0.0 255.0.0.0 192.168.3.2 200   ! floating, AD 200"]} /></div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant={fail ? "outline" : "default"} onClick={() => setFail((f) => !f)}>{fail ? "Repair primary link" : "Fail the primary link"}</Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center text-xs">
          <div className="rounded-lg border p-3 transition-all duration-500" style={{ borderColor: fail ? RED : GREEN, opacity: fail ? 0.4 : 1 }}>
            <p className="font-semibold">Primary via R2</p>
            <p className="text-muted-foreground">AD 1</p>
            <p className="font-bold" style={{ color: fail ? RED : GREEN }}>{fail ? "DOWN" : "in use"}</p>
          </div>
          <div className="rounded-lg border p-3 transition-all duration-500" style={{ borderColor: fail ? GREEN : undefined, opacity: fail ? 1 : 0.5 }}>
            <p className="font-semibold">Floating via R3</p>
            <p className="text-muted-foreground">AD 200</p>
            <p className="font-bold" style={{ color: fail ? GREEN : undefined }}>{fail ? "in use" : "standby (not in table)"}</p>
          </div>
        </div>
        <div key={String(fail)} className="n8-fade mt-3 rounded-lg border bg-black/90 p-3 font-mono text-[11px] text-white">
          S  10.0.0.0/8 [{fail ? "200" : "1"}/0] via {fail ? "192.168.3.2" : "192.168.2.2"}
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            A static route only disappears when its exit interface or next hop becomes unreachable. If the far end fails behind a switch while your port stays up, the route stays. Tracking (IP SLA) solves that.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Default route and Null0</p>
        <div className="mt-3">
          <SimpleTable
            head={["Concept", "Command", "Notes"]}
            rows={[
              ["Default route", "ip route 0.0.0.0 0.0.0.0 <next-hop>", "Used only when nothing more specific matches. AD 1. Shows as S*."],
              ["Null0 route", "ip route <net> <mask> null0", "Discards traffic for that one network only. A controlled blackhole, used to stop loops after summarization."],
              ["Load balancing", "two routes, same prefix and AD", "Equal-cost sharing across both, automatic."],
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 3 · dynamic and RIP ───────────────────────── */

const PROTOS = [
  { n: "RIP", scope: "IGP", algo: "Distance vector", note: "Counts hops. Simple, small networks. Bellman-Ford." },
  { n: "EIGRP", scope: "IGP", algo: "Advanced distance vector (hybrid)", note: "Bandwidth and delay. DUAL gives fast backups." },
  { n: "OSPF", scope: "IGP", algo: "Link state", note: "Full map of the area, runs Shortest Path First." },
  { n: "BGP", scope: "EGP", algo: "Path vector", note: "Routes between organizations, the internet." },
];

const TIMERS = [
  ["Update", "30 s", "How often the full table is sent"],
  ["Invalid", "180 s", "No update heard: route marked unreachable (metric 16)"],
  ["Hold-down", "180 s", "Starts at invalid. New info about the route is distrusted"],
  ["Flush", "240 s", "Counted from the last update: the route is removed"],
];

function RipSection() {
  const [pi, setPi] = useState(0);
  const [hop, setHop] = useState(5);
  const [sec, setSec] = useState(0);
  const [play, setPlay] = useState(false);
  const [dsg, setDsg] = useState(0);
  const [ver, setVer] = useState(2);

  useEffect(() => {
    if (!play) return;
    if (sec >= 250) { setPlay(false); return; }
    const id = setTimeout(() => setSec((s) => Math.min(250, s + 2)), 70);
    return () => clearTimeout(id);
  }, [play, sec]);

  const p = PROTOS[pi];
  const phase = sec < 180 ? { t: "Valid. Updates are being missed, but the route is still trusted.", c: BLUE } : sec < 240 ? { t: "Invalid: metric 16 (unreachable), in hold-down, still advertised as unreachable.", c: AMBER } : { t: "Flushed: removed from the routing table.", c: RED };
  const missed = Math.floor(Math.min(sec, 180) / 30);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Dynamic routing protocols</p>
        <p className="mt-1 text-xs text-muted-foreground">Two families by scope: IGPs route inside one organization, EGPs route between organizations. Tap a protocol.</p>
        <div className="mt-3 flex flex-wrap gap-2">{PROTOS.map((x, i) => <Pick key={x.n} active={pi === i} onClick={() => setPi(i)}>{x.n}</Pick>)}</div>
        <div key={pi} className="n8-fade mt-3 grid gap-2 sm:grid-cols-3">
          <Mini k="Scope" v={p.scope === "IGP" ? "IGP: interior (inside one organization)" : "EGP: exterior (between organizations)"} color={p.scope === "IGP" ? GREEN : PURPLE} />
          <Mini k="Algorithm" v={p.algo} />
          <Mini k="In short" v={p.note} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">RIP facts</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Mini k="Metric" v="Hop count" />
          <Mini k="Max hops" v="15 (16 = unreachable)" color={RED} />
          <Mini k="Update" v="Every 30 s, full table" />
          <Mini k="Transport" v="UDP port 520" />
          <Mini k="AD" v="120" />
          <Mini k="Load balancing" v="Equal-cost, up to 4 paths by default" />
          <Mini k="v1 sends to" v="255.255.255.255 (broadcast)" />
          <Mini k="v2 sends to" v="224.0.0.9 (multicast)" />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The 15-hop limit</p>
        <label className="mt-3 flex items-center gap-3 text-xs">
          Routers to cross: <span className="w-6 font-mono font-bold">{hop}</span>
          <input type="range" min={1} max={16} value={hop} onChange={(e) => setHop(Number(e.target.value))} className="flex-1 accent-primary" aria-label="Hop count" />
        </label>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <div key={n} className="flex h-8 flex-1 items-center justify-center rounded text-[10px] font-bold transition-all duration-300" style={{ background: n <= hop ? (hop >= 16 ? RED : BLUE) : undefined, color: n <= hop ? "#fff" : undefined, border: n <= hop ? undefined : "1px solid var(--border, #ddd)", opacity: n <= hop ? 1 : 0.5 }}>{n}</div>
          ))}
        </div>
        <p key={hop >= 16 ? "u" : "r"} className="n8-fade mt-3 text-xs font-medium" style={{ color: hop >= 16 ? RED : GREEN }}>
          {hop >= 16 ? "16 hops = infinity. The network is unreachable. Big networks need EIGRP or OSPF." : `Reachable with metric ${hop}.`}
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Timer lifecycle: a neighbor goes silent at 0 s</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => { if (sec >= 250) setSec(0); setPlay((v) => !v); }}>{play ? "Pause" : sec >= 250 ? "Replay" : "Play"}</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlay(false); setSec(0); }}>Reset</Button>
          <span className="font-mono text-sm font-bold">{sec} s</span>
        </div>
        <div className="relative mt-5 h-3 rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${(sec / 250) * 100}%`, background: phase.c, transition: "background .3s" }} />
          {[30, 60, 90, 120, 150].map((m) => (
            <span key={m} className="absolute top-4 -translate-x-1/2 text-[10px] text-muted-foreground" style={{ left: `${(m / 250) * 100}%`, opacity: sec >= m ? 0.4 : 1, textDecoration: sec >= m ? "line-through" : undefined }}>{m}</span>
          ))}
          <span className="absolute top-4 -translate-x-1/2 text-[10px] font-bold" style={{ left: `${(180 / 250) * 100}%`, color: AMBER }}>180 invalid</span>
          <span className="absolute top-4 -translate-x-1/2 text-[10px] font-bold" style={{ left: `${(240 / 250) * 100}%`, color: RED }}>240 flush</span>
        </div>
        <p key={phase.t} className="n8-fade mt-9 rounded-lg border px-3 py-2 text-xs leading-5" style={{ borderColor: phase.c, color: phase.c }}>
          {phase.t} <span className="text-muted-foreground">(updates missed: {missed})</span>
        </p>
        <div className="mt-3"><SimpleTable head={["Timer", "Default", "What it does"]} rows={TIMERS} /></div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Careful">Flush is counted from the last update, so it fires only 60 s after the invalid timer, while hold-down is still running.</Tip>
          <Tip title="Rule">Timers must match on every router. Change them with timers basic update invalid holddown flush, everywhere, or convergence becomes unstable.</Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">RIPv1 vs RIPv2</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={dsg === 0} onClick={() => setDsg(0)}>Three separate /24 networks</Pick>
          <Pick active={dsg === 1} onClick={() => setDsg(1)}>One /24 split into /26 subnets</Pick>
        </div>
        <div className="mt-2 flex gap-2">
          <Pick active={ver === 1} onClick={() => setVer(1)}>RIPv1</Pick>
          <Pick active={ver === 2} onClick={() => setVer(2)}>RIPv2</Pick>
        </div>
        <div key={`${dsg}-${ver}`} className="n8-fade mt-3 flex flex-col gap-1.5 font-mono text-[11px]">
          {(dsg === 0 ? ["192.168.1.0/24", "192.168.2.0/24", "192.168.3.0/24"] : ["192.168.1.0/26", "192.168.1.64/26", "192.168.1.128/26"]).map((r) => (
            <div key={r} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5">
              <span className="font-bold">C {r}</span>
              <span className="text-muted-foreground">→</span>
              {ver === 1 ? (
                dsg === 1 ? <span style={{ color: RED }}>sent as classful 192.168.1.0 only, subnet lost</span> : <span>classful entry, broadcast to 255.255.255.255</span>
              ) : (
                <span style={{ color: GREEN }}>classless entry with mask, multicast to 224.0.0.9</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium" style={{ color: ver === 1 && dsg === 1 ? RED : GREEN }}>
          {ver === 1 && dsg === 1 ? "RIPv1 is classful: it cannot carry masks, so VLSM and subnetted designs break." : "Works."}
        </p>
        <div className="mt-3">
          <SimpleTable
            head={["Feature", "RIPv1", "RIPv2"]}
            rows={[["Addressing", "Classful", "Classless"], ["VLSM / subnets", "Not supported", "Supported"], ["Updates", "Broadcast 255.255.255.255", "Multicast 224.0.0.9"], ["Authentication", "No", "Yes"]]}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Key RIP commands</p>
        <div className="mt-3">
          <Code lines={["router rip", " version 2", " network 192.168.1.0", " no auto-summary", " passive-interface default", " no passive-interface f0/0", " timers basic 30 180 180 240"]} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Passive interface">It stops RIP sending updates out that interface (toward end-user LANs with no routers). The connected network is still advertised out the other interfaces. RIP has no hellos.</Tip>
          <Tip title="auto-summary">It summarizes back to classful boundaries, which breaks VLSM. Turn it off with RIPv2 (older IOS has it on by default).</Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 4 · EIGRP ───────────────────────── */

const LINKS = [
  { n: "Ethernet 10 Mbps", bw: 10000, d: 1000 },
  { n: "FastEthernet", bw: 100000, d: 100 },
  { n: "GigabitEthernet", bw: 1000000, d: 10 },
  { n: "T1 serial", bw: 1544, d: 20000 },
];

type Nb = { n: string; ad: number; cost: number };
const NB0: Nb[] = [
  { n: "R5", ad: 2000, cost: 1000 },
  { n: "R2", ad: 2500, cost: 1500 },
  { n: "R6", ad: 3500, cost: 1500 },
];

const DUAL_STEPS = [
  { t: "Hello exchange", d: "R1 sends multicast Hellos to 224.0.0.10. If subnet, AS, K-values and authentication match, a neighborship forms." },
  { t: "Neighbor up", d: "Both appear in each other's neighbor table. Default Hello 5 s, hold time 15 s (60 s and 180 s on slow multipoint links)." },
  { t: "Full update (unicast)", d: "The two new neighbors exchange everything they know. This first update is unicast over RTP. Later changes are sent as partial updates, multicast to 224.0.0.10." },
  { t: "ACK back", d: "Every reliable packet (Update, Query, Reply) is acknowledged with a unicast ACK." },
  { t: "DUAL runs", d: "Each router picks the best loop-free path as the Successor and any qualifying backups as Feasible Successors." },
  { t: "Converged", d: "Routes sit in the topology table as Passive (stable). Active means the router is searching for a path." },
];

function EigrpSection() {
  const [cond, setCond] = useState({ as: true, k: true, auth: true, sub: true, link: true });
  const [hn, setHn] = useState(0);
  const [path, setPath] = useState<number[]>([1, 1]);
  const [nb, setNb] = useState<Nb[]>(NB0);
  const [failed, setFailed] = useState(false);
  const [si, setSi] = useState(0);

  const reasons = [!cond.link && "Layer 1 is down", !cond.sub && "Not on the same subnet", !cond.as && "Different AS numbers", !cond.k && "K-values do not match", !cond.auth && "Authentication does not match"].filter(Boolean) as string[];
  const up = reasons.length === 0;
  const flip = (k: keyof typeof cond) => { setCond((c) => ({ ...c, [k]: !c[k] })); setHn((v) => v + 1); };

  const minBw = path.length ? Math.min(...path.map((i) => LINKS[i].bw)) : 0;
  const sumD = path.reduce((a, i) => a + LINKS[i].d, 0);
  const bwT = minBw ? Math.floor(1e7 / minBw) : 0;
  const dT = sumD / 10;
  const metric = 256 * (bwT + dT);

  const calc = nb.map((x) => ({ ...x, fd: x.ad + x.cost }));
  const succ = calc.reduce((a, b) => (b.fd < a.fd ? b : a), calc[0]);
  const feas = (x: (typeof calc)[number]) => x.n !== succ.n && x.ad < succ.fd;
  const pool = failed ? calc.filter((x) => x.n !== succ.n && x.ad < succ.fd) : [];
  const newSucc = pool.length ? pool.reduce((a, b) => (b.fd < a.fd ? b : a), pool[0]) : null;
  const adj = (i: number, f: "ad" | "cost", d: number) => { setNb((l) => l.map((x, k) => (k === i ? { ...x, [f]: Math.max(500, x[f] + d) } : x))); setFailed(false); };
  const maxFd = Math.max(...calc.map((x) => x.fd));

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">EIGRP: simple like distance vector, smart like link state</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Called hybrid, or advanced distance vector. Classless (VLSM works), sends triggered updates only when the topology changes, and runs its own transport on IP protocol 88
          (not TCP or UDP) with Reliable Transport Protocol (RTP). Cisco opened it in 2013, and it is documented in RFC 7868.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Mini k="Algorithm" v="DUAL" />
          <Mini k="Multicast" v="224.0.0.10" />
          <Mini k="Hello / Hold" v="5 s / 15 s" />
          <Mini k="AS number" v="1 to 65535 (16-bit)" />
          <Mini k="AD" v="90 internal, 170 external, 5 summary" />
          <Mini k="Load balancing" v="4 paths default, 16 max" />
          <Mini k="Max hops" v="255 (default 100)" />
          <Mini k="Route codes" v="D, EX, D* (candidate default)" />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Will these two routers become neighbors?</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap each condition to break or fix it.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={cond.link} onClick={() => flip("link")}>{cond.link ? "Link up" : "Link down"}</Pick>
          <Pick active={cond.sub} onClick={() => flip("sub")}>{cond.sub ? "Same subnet" : "Different subnet"}</Pick>
          <Pick active={cond.as} onClick={() => flip("as")}>{cond.as ? "Same AS (100)" : "AS 100 vs 200"}</Pick>
          <Pick active={cond.k} onClick={() => flip("k")}>{cond.k ? "K-values match" : "K-values differ"}</Pick>
          <Pick active={cond.auth} onClick={() => flip("auth")}>{cond.auth ? "Auth matches" : "Auth differs"}</Pick>
        </div>
        <div className="relative mt-5 h-16">
          <div className="absolute left-16 right-16 top-1/2 h-0.5 transition-colors duration-500" style={{ background: up ? GREEN : RED }} />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-lg border px-3 py-2 text-xs font-bold">R1</div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-lg border px-3 py-2 text-xs font-bold">R2</div>
          <div className="absolute left-16 right-16 top-0 h-full">
            <span key={`a${hn}`} className="n8-flyR absolute top-1 rounded bg-blue-600 px-1.5 text-[10px] font-bold text-white">Hello</span>
            <span key={`b${hn}`} className="n8-flyL absolute bottom-1 rounded bg-purple-600 px-1.5 text-[10px] font-bold text-white">Hello</span>
          </div>
        </div>
        <p key={String(up) + reasons.join()} className="n8-fade mt-2 text-xs font-semibold" style={{ color: up ? GREEN : RED }}>
          {up ? "Neighbors up. The adjacency forms and they exchange routes." : `No adjacency: ${reasons.join("; ")}.`}
        </p>
        <div className="mt-3">
          <Tip title="Careful">Unlike OSPF, EIGRP Hello and hold timers do not have to match for a neighbor to form. A mismatch just makes the adjacency flap.</Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Metric builder</p>
        <p className="mt-1 text-xs text-muted-foreground">Add the links along a path. Default K-values use only bandwidth (K1) and delay (K3).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LINKS.map((l, i) => <Pick key={l.n} active={false} onClick={() => setPath((p) => (p.length < 6 ? [...p, i] : p))}>+ {l.n}</Pick>)}
          <Button size="sm" variant="outline" onClick={() => setPath((p) => p.slice(0, -1))}>Remove last</Button>
          <Button size="sm" variant="outline" onClick={() => setPath([])}>Clear</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {path.map((i, k) => <Badge key={k} variant="secondary" className="n8-pop">{LINKS[i].n}</Badge>)}
          {path.length === 0 && <span className="text-xs text-muted-foreground">No links yet.</span>}
        </div>
        {path.length > 0 && (
          <div key={path.join()} className="n8-fade mt-3 flex flex-col gap-1 rounded-lg border bg-muted/30 p-3 font-mono text-xs">
            <p>Lowest bandwidth on the path = {minBw} kbps</p>
            <p>Bandwidth term = 10^7 / {minBw} = {bwT}</p>
            <p>Delay term = {sumD} µs / 10 = {dT}</p>
            <p className="font-bold" style={{ color: GREEN }}>Metric = 256 × ({bwT} + {dT}) = {metric.toLocaleString()}</p>
          </div>
        )}
        <div className="mt-3">
          <SimpleTable head={["K", "Parameter", "Default"]} rows={[["K1", "Bandwidth", "1 (on)"], ["K2", "Load", "0 (off)"], ["K3", "Delay", "1 (on)"], ["K4", "Reliability", "0 (off)"], ["K5", "MTU", "0 (off)"]]} />
        </div>
        <div className="mt-3"><Tip>Bandwidth uses the slowest link on the path. Delay is the sum of all delays on the path.</Tip></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Successor and Feasible Successor</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Each neighbor reports its own distance to the destination (Advertised Distance, AD, also called Reported Distance). Your Feasible Distance (FD) via that neighbor is its AD plus your link cost.
          A backup qualifies only if its <span className="font-semibold text-foreground">AD is lower than the successor's FD</span>. That guarantees it is loop-free.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {calc.map((x, i) => {
            const isS = x.n === succ.n;
            const isF = feas(x);
            const gone = failed && isS;
            const nowS = failed && newSucc?.n === x.n;
            const tag = gone ? "FAILED" : nowS ? "NEW SUCCESSOR" : isS ? "Successor" : isF ? "Feasible successor" : "Not feasible";
            const c = gone ? RED : isS || nowS ? GREEN : isF ? BLUE : AMBER;
            return (
              <div key={x.n} className="rounded-lg border p-2 transition-all duration-500" style={{ borderColor: c, opacity: gone ? 0.4 : 1 }}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="w-8 font-bold">{x.n}</span>
                  <span className="font-mono">AD {x.ad}</span>
                  <span className="flex items-center gap-1">
                    <button type="button" className="rounded border px-1" onClick={() => adj(i, "ad", -500)}>−</button>
                    <button type="button" className="rounded border px-1" onClick={() => adj(i, "ad", 500)}>+</button>
                  </span>
                  <span className="font-mono">+ link {x.cost}</span>
                  <span className="flex items-center gap-1">
                    <button type="button" className="rounded border px-1" onClick={() => adj(i, "cost", -500)}>−</button>
                    <button type="button" className="rounded border px-1" onClick={() => adj(i, "cost", 500)}>+</button>
                  </span>
                  <span className="font-mono font-bold">= FD {x.fd}</span>
                  <span className="ml-auto font-semibold" style={{ color: c }}>{tag}</span>
                </div>
                <div className="mt-1.5 flex h-2 overflow-hidden rounded bg-muted/40">
                  <div className="h-full transition-all duration-500" style={{ width: `${(x.ad / maxFd) * 100}%`, background: `${c}99` }} />
                  <div className="h-full transition-all duration-500" style={{ width: `${(x.cost / maxFd) * 100}%`, background: c }} />
                </div>
                {!isS && <p className="mt-1 text-[11px] text-muted-foreground">AD {x.ad} {x.ad < succ.fd ? "<" : "≥"} successor FD {succ.fd}: {isF ? "feasible" : "fails the feasibility condition"}.</p>}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant={failed ? "outline" : "default"} onClick={() => setFailed((f) => !f)}>{failed ? "Restore successor" : "Fail the successor"}</Button>
        </div>
        {failed && (
          <p key={newSucc?.n ?? "none"} className="n8-fade mt-3 rounded-lg border px-3 py-2 text-xs font-medium" style={{ borderColor: newSucc ? GREEN : RED, color: newSucc ? GREEN : RED }}>
            {newSucc ? `${newSucc.n} takes over instantly. DUAL already knew a loop-free backup, so no queries are sent.` : "No feasible successor. The route goes Active: the router sends Query packets and waits for Replies."}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Unequal-cost">Set variance with the variance command. Extra paths are used if their FD is at most variance × the best FD, and they must also be feasible successors.</Tip>
          <Tip title="Stuck in active">If a Query goes unanswered for the 3-minute active timer, the router declares the route stuck in active and resets that neighbor, flushing routes learned through it.</Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">From neighbor to converged</p>
        <div className="mt-3 flex flex-wrap gap-2">{DUAL_STEPS.map((_, k) => <Pick key={k} active={si === k} onClick={() => setSi(k)}>{k + 1}</Pick>)}</div>
        <div key={si} className="n8-fade mt-3">
          <p className="text-sm font-semibold">{DUAL_STEPS[si].t}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{DUAL_STEPS[si].d}</p>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" disabled={si === 0} onClick={() => setSi((v) => v - 1)}>Back</Button>
          <Button size="sm" disabled={si === DUAL_STEPS.length - 1} onClick={() => setSi((v) => v + 1)}>Next step</Button>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Reference</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <SimpleTable head={["Term", "Meaning"]} rows={[["Successor", "Best path"], ["Feasible successor", "Loop-free backup"], ["Advertised distance", "Metric as reported by the neighbor"], ["Feasible distance", "Your own best metric to the destination"], ["Feasibility condition", "Candidate AD < successor FD"]]} />
          <SimpleTable head={["Packet types (7)", "Use"]} rows={[["Hello", "Find and keep neighbors"], ["Update", "Send routes"], ["ACK", "Confirm reliable packets"], ["Query", "Ask neighbors for a path"], ["Reply", "Answer a query"], ["SIA Query / Reply", "Check a slow query"]]} />
        </div>
        <div className="mt-3"><Code lines={["router eigrp 100", " network 192.168.1.0 0.0.0.255", " no auto-summary", " eigrp router-id 1.1.1.1"]} /></div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 5 · OSPF ───────────────────────── */

const OLINKS = [{ n: "Ethernet", bw: 10 }, { n: "Fast Ethernet", bw: 100 }, { n: "Gigabit", bw: 1000 }, { n: "10 Gigabit", bw: 10000 }];

const ADJ = [
  { a: "Down", b: "Down", pkt: "", d: "No Hellos received. The routers do not know each other." },
  { a: "Down", b: "Init", pkt: "Hello", d: "R2 hears R1's Hello but does not see its own ID in it yet, so R2 moves to Init." },
  { a: "2-Way", b: "2-Way", pkt: "Hello", d: "Each Hello now lists the other. Bidirectional. On broadcast networks the DR/BDR election happens here." },
  { a: "ExStart", b: "ExStart", pkt: "DBD", d: "Master and slave are chosen, and they agree the starting DBD sequence number." },
  { a: "Exchange", b: "Exchange", pkt: "DBD", d: "Database Descriptors summarize each LSDB so each side learns what it is missing." },
  { a: "Loading", b: "Loading", pkt: "LSR / LSU", d: "Link State Requests ask for missing LSAs, Link State Updates deliver them, LSAcks confirm." },
  { a: "Full", b: "Full", pkt: "LSAck", d: "LSDBs are identical. Routes can be installed. The adjacency is complete." },
];

type OR = { n: string; rid: string; pri: number };
const ORS: OR[] = [
  { n: "R1", rid: "1.1.1.1", pri: 1 },
  { n: "R2", rid: "2.2.2.2", pri: 1 },
  { n: "R3", rid: "3.3.3.3", pri: 1 },
  { n: "R4", rid: "4.4.4.4", pri: 100 },
];
function elect(rs: OR[]) {
  const el = rs.filter((r) => r.pri > 0).sort((a, b) => b.pri - a.pri || (ipInt(b.rid) ?? 0) - (ipInt(a.rid) ?? 0));
  return { dr: el[0]?.n, bdr: el[1]?.n };
}

function OspfSection() {
  const [ref, setRef] = useState(100);
  const [ai, setAi] = useState(0);
  const [play, setPlay] = useState(false);
  const [rs, setRs] = useState<OR[]>(ORS);
  const [late, setLate] = useState(false);
  const [pre, setPre] = useState(24);

  useEffect(() => {
    if (!play) return;
    if (ai >= ADJ.length - 1) { setPlay(false); return; }
    const id = setTimeout(() => setAi((v) => v + 1), 1300);
    return () => clearTimeout(id);
  }, [play, ai]);

  const cost = (bw: number) => Math.max(1, Math.floor(ref / bw));
  const first = late ? elect(rs.slice(0, 3)) : elect(rs);
  const dr = first.dr, bdr = first.bdr;
  const role = (n: string) => (n === dr ? "DR" : n === bdr ? "BDR" : "DROther");
  const cyc = (i: number) => setRs((l) => l.map((r, k) => (k === i ? { ...r, pri: r.pri === 1 ? 100 : r.pri === 100 ? 0 : 1 } : r)));
  const wm = (~maskOf(pre) >>> 0);
  const a = ADJ[ai];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">OSPF builds a full map, then runs Shortest Path First</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Link state: every router floods information about its own links, so each router in an area has the same database (LSDB) and computes its own best paths. Open standard (IETF),
          an IGP, metric is cost. OSPFv2 is for IPv4, OSPFv3 for IPv6. Areas keep the database small.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Mini k="Hello / Dead" v="10 s / 40 s on broadcast and point-to-point (30 / 120 on NBMA)" />
          <Mini k="Multicast" v="224.0.0.5 all OSPF routers. 224.0.0.6 DR and BDR" />
          <Mini k="AD" v="110" />
          <Mini k="Process ID" v="1 to 65535, locally significant" />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Cost and the reference bandwidth</p>
        <p className="mt-1 text-xs text-muted-foreground">Cost = reference bandwidth / interface bandwidth, never below 1. Change the reference.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[100, 1000, 10000].map((r) => <Pick key={r} active={ref === r} onClick={() => setRef(r)}>{r === 100 ? "100 Mbps (default)" : `${r} Mbps`}</Pick>)}
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          {OLINKS.map((l) => {
            const raw = ref / l.bw;
            const c = cost(l.bw);
            const dup = ref === 100 && l.bw >= 100;
            return (
              <div key={l.n} className="flex items-center gap-3 text-xs">
                <span className="w-24 font-semibold">{l.n}</span>
                <span className="w-32 font-mono text-muted-foreground">{ref}/{l.bw} = {raw < 1 ? raw.toFixed(raw < 0.01 ? 3 : 2) : raw}</span>
                <div className="h-3 flex-1 rounded bg-muted/40">
                  <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.min(100, (c / 10) * 100)}%`, background: dup ? RED : BLUE }} />
                </div>
                <span className="w-16 font-mono font-bold" style={{ color: dup ? RED : undefined }}>cost {c}</span>
              </div>
            );
          })}
        </div>
        <p key={ref} className="n8-fade mt-3 text-xs font-medium" style={{ color: ref === 100 ? RED : GREEN }}>
          {ref === 100 ? "Problem: Fast Ethernet, Gigabit and 10 Gigabit all cost 1, so OSPF cannot tell them apart." : "Better: faster links now cost less. Set the same value on every router."}
        </p>
        <div className="mt-3"><Code lines={["router ospf 100", " auto-cost reference-bandwidth 1000"]} /></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Adjacency states</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { if (ai >= ADJ.length - 1) setAi(0); setPlay((v) => !v); }}>{play ? "Pause" : ai >= ADJ.length - 1 ? "Replay" : "Play"}</Button>
          <Button size="sm" variant="outline" disabled={ai === 0} onClick={() => { setPlay(false); setAi((v) => v - 1); }}>Back</Button>
          <Button size="sm" variant="outline" disabled={ai >= ADJ.length - 1} onClick={() => { setPlay(false); setAi((v) => v + 1); }}>Next</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlay(false); setAi(0); }}>Reset</Button>
        </div>
        <div className="mt-4 grid grid-cols-[90px_1fr_90px] items-center gap-2">
          <div className="text-center">
            <p className="text-xs font-bold">R1</p>
            <p key={a.a} className="n8-pop rounded-md border px-1 py-1 font-mono text-[11px] font-bold" style={{ color: ai === 6 ? GREEN : BLUE, borderColor: ai === 6 ? GREEN : BLUE }}>{a.a}</p>
          </div>
          <div className="relative h-8">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            {a.pkt && <span key={ai} className={`${ai % 2 ? "n8-flyL" : "n8-flyR"} absolute top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white`}>{a.pkt}</span>}
          </div>
          <div className="text-center">
            <p className="text-xs font-bold">R2</p>
            <p key={a.b} className="n8-pop rounded-md border px-1 py-1 font-mono text-[11px] font-bold" style={{ color: ai === 6 ? GREEN : PURPLE, borderColor: ai === 6 ? GREEN : PURPLE }}>{a.b}</p>
          </div>
        </div>
        <p key={`d${ai}`} className="n8-fade mt-3 text-xs leading-5 text-muted-foreground">{a.d}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Hello", "DBD", "LSR", "LSU", "LSAck"].map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">DR and BDR election</p>
        <p className="mt-1 text-xs text-muted-foreground">Highest priority wins, ties go to the highest router ID. Priority 0 never participates. Tap a priority to cycle 1, 100, 0.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={!late} onClick={() => setLate(false)}>All routers boot together</Pick>
          <Pick active={late} onClick={() => setLate(true)}>R4 joins after R1 to R3 are up</Pick>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {rs.map((r, i) => {
            const ro = late && i === 3 ? "DROther" : role(r.n);
            const c = ro === "DR" ? GREEN : ro === "BDR" ? BLUE : undefined;
            return (
              <div key={r.n} className="rounded-lg border p-2 text-center transition-all duration-500" style={{ borderColor: c, background: c ? `${c}12` : undefined }}>
                <p className="text-sm font-bold">{r.n}</p>
                <p className="font-mono text-[10px] text-muted-foreground">RID {r.rid}</p>
                <button type="button" onClick={() => cyc(i)} className="mt-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">priority {r.pri}</button>
                <p key={ro} className="n8-pop mt-1 text-xs font-bold" style={{ color: c }}>{r.pri === 0 ? "never DR" : ro}</p>
              </div>
            );
          })}
        </div>
        {late && <p className="mt-3 text-xs font-medium" style={{ color: AMBER }}>Non-preemptive: R4 has the best priority but cannot take over. It stays DROther until the DR fails.</p>}
        <div className="mt-3"><Tip title="Careful">Two DROthers on the same segment stay at Two-Way with each other. They form Full adjacencies only with the DR and BDR.</Tip></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Wildcard masks</p>
        <label className="mt-3 flex items-center gap-3 text-xs">
          Prefix /<span className="w-6 font-mono font-bold">{pre}</span>
          <input type="range" min={8} max={32} value={pre} onChange={(e) => setPre(Number(e.target.value))} className="flex-1 accent-primary" aria-label="Prefix" />
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Mini k="Subnet mask" v={toIp(maskOf(pre))} />
          <Mini k="Wildcard = 255.255.255.255 − mask" v={toIp(wm)} color={GREEN} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Neighbor conditions and setup</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">All must match</p>
            <Bullets items={["Same area ID", "Same subnet and mask", "Same Hello and Dead timers", "Same MTU", "Same authentication", "Same stub flag", "Different router ID (it must be unique)"]} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">Router ID choice, in order</p>
            <Bullets items={["Manual: router-id command", "Highest loopback IP", "Highest active interface IP"]} />
            <p className="mb-1 mt-3 text-xs font-semibold">Router types</p>
            <Bullets items={["ABR: connects an area to the backbone (Area 0)", "ASBR: redistributes routes from another routing domain", "DR / BDR: segment coordinators", "DROther: everyone else"]} />
          </div>
        </div>
        <div className="mt-3">
          <Code lines={["interface loopback 0", " ip address 1.1.1.1 255.255.255.255", "router ospf 100", " router-id 1.1.1.1", " network 192.168.1.0 0.0.0.255 area 1", " passive-interface default", " no passive-interface f0/0"]} />
        </div>
        <div className="mt-3">
          <SimpleTable
            head={["Area", "Purpose"]}
            rows={[["Area 0 (backbone)", "The hub. Every other area must connect to it"], ["Standard", "Normal area. Keep it to a manageable size (Cisco suggests about 50 routers)"], ["Stub, total stub, NSSA, total NSSA", "Filter LSAs to shrink small areas (see the next tab)"]]}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 6 · OSPF advanced ───────────────────────── */

const LSAS = [
  { t: "1", n: "Router", by: "Every OSPF router", p: "Its links inside the area", sc: "Within its area" },
  { t: "2", n: "Network", by: "DR", p: "Routers attached to a broadcast segment", sc: "Within its area" },
  { t: "3", n: "Summary", by: "ABR", p: "Inter-area routes", sc: "Other areas" },
  { t: "4", n: "ASBR summary", by: "ABR", p: "How to reach the ASBR", sc: "Other areas" },
  { t: "5", n: "External", by: "ASBR", p: "Routes from outside OSPF", sc: "Whole AS (not stub areas)" },
  { t: "7", n: "NSSA external", by: "ASBR inside an NSSA", p: "External routes found in an NSSA", sc: "That NSSA only (ABR converts 7 to 5)" },
];

type AreaT = { n: string; allow: number[]; def: string; cmd: string[]; note: string };
const AREAS: AreaT[] = [
  { n: "Standard", allow: [1, 2, 3, 4, 5], def: "No", cmd: ["(nothing special)"], note: "Everything floods in." },
  { n: "Stub", allow: [1, 2, 3], def: "Yes, from the ABR", cmd: ["area 20 stub    ! every router in the area"], note: "Blocks external routes (LSA 4 and 5). The ABR injects one default route instead." },
  { n: "Total stub", allow: [1, 2], def: "Yes, replaces everything", cmd: ["area 20 stub         ! all routers", "area 20 stub no-summary   ! ABR only"], note: "Also blocks inter-area routes (LSA 3). Cisco-proprietary." },
  { n: "NSSA", allow: [1, 2, 3, 7], def: "No (add default-information-originate)", cmd: ["area 20 nssa", "area 20 nssa default-information-originate  ! ABR"], note: "Like a stub, but the ASBR inside may inject externals as LSA 7." },
  { n: "Total NSSA", allow: [1, 2, 7], def: "Yes", cmd: ["area 20 nssa         ! all routers", "area 20 nssa no-summary   ! ABR only"], note: "NSSA that also blocks LSA 3." },
];

function AdvSection() {
  const [li, setLi] = useState(2);
  const [ai, setAi] = useState(1);
  const [vl, setVl] = useState(false);
  const [ic, setIc] = useState(30);
  const l = LSAS[li];
  const ar = AREAS[ai];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">The OSPF toolkit</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Mini k="Stub areas" v="Filter externals to save memory and CPU" />
          <Mini k="Virtual links" v="Reconnect a stranded area to Area 0" />
          <Mini k="LSA types" v="What floods, and where" />
          <Mini k="Path control" v="Change cost to steer traffic" />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">LSA types</p>
        <div className="mt-3 flex flex-wrap gap-2">{LSAS.map((x, i) => <Pick key={x.t} active={li === i} onClick={() => setLi(i)}>Type {x.t}</Pick>)}</div>
        <div key={li} className="n8-fade mt-3 grid gap-2 sm:grid-cols-4">
          <Mini k="Name" v={l.n} color={BLUE} />
          <Mini k="Generated by" v={l.by} />
          <Mini k="Carries" v={l.p} />
          <Mini k="Flooded to" v={l.sc} color={GREEN} />
        </div>
        <div className="mt-3"><Tip title="Careful">OSPFv2 defines types 1 to 11. Type 6 (MOSPF) is not used in practice, type 8 is unused, and 9 to 11 are opaque LSAs.</Tip></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Stub area chooser</p>
        <div className="mt-3 flex flex-wrap gap-2">{AREAS.map((x, i) => <Pick key={x.n} active={ai === i} onClick={() => setAi(i)}>{x.n}</Pick>)}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[1, 2, 3, 4, 5, 7].map((t) => {
            const ok = ar.allow.includes(t);
            const na = t === 7 && !ok && ai < 3;
            return (
              <div
                key={t}
                className="rounded-lg border py-3 text-center transition-all duration-500"
                style={{ borderColor: na ? undefined : ok ? GREEN : RED, background: na ? undefined : ok ? `${GREEN}14` : `${RED}10`, opacity: na ? 0.3 : ok ? 1 : 0.55, transform: ok ? "scale(1)" : "scale(.92)" }}
              >
                <p className="font-mono text-sm font-bold" style={{ color: na ? undefined : ok ? GREEN : RED }}>LSA {t}</p>
                <p className="text-[10px] font-semibold" style={{ color: na ? undefined : ok ? GREEN : RED }}>{na ? "n/a" : ok ? "allowed" : "blocked"}</p>
              </div>
            );
          })}
        </div>
        <div key={ai} className="n8-fade mt-3 flex flex-col gap-2">
          <p className="text-xs leading-5 text-muted-foreground">{ar.note}</p>
          <Mini k="Default route" v={ar.def} />
          <Code lines={ar.cmd} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Rule">The stub setting is a neighbor condition: it must match on every router in the area. Area 0 can never be a stub.</Tip>
          <Tip title="Why NSSA">If an ASBR sits inside an area, that area cannot be stub or total stub, because an ASBR needs to generate LSA 5. Use NSSA (LSA 7, converted to 5 at the ABR).</Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Virtual link</p>
        <p className="mt-1 text-xs text-muted-foreground">Area 2 is not touching Area 0. A virtual link tunnels the adjacency between the two ABRs through the transit area.</p>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant={vl ? "outline" : "default"} onClick={() => setVl((v) => !v)}>{vl ? "Remove virtual link" : "Add virtual link"}</Button>
        </div>
        <div className="relative mt-5">
          <div className="flex items-center justify-between gap-1 text-center text-[11px] font-semibold">
            <div className="rounded-lg border p-2" style={{ borderColor: BLUE }}>Area 0<br />backbone</div>
            <div className="rounded-lg border p-2">ABR1</div>
            <div className="flex-1 rounded-lg border border-dashed p-2">Area 1<br />(transit)</div>
            <div className="rounded-lg border p-2">ABR2</div>
            <div className="rounded-lg border p-2" style={{ borderColor: vl ? GREEN : RED, transition: "border-color .5s" }}>Area 2</div>
          </div>
          <div className="mx-[22%] mt-1 h-5 overflow-hidden">
            {vl && <div className="n8-grow h-full rounded-b-2xl border-x-2 border-b-2 border-dashed" style={{ borderColor: PURPLE }} />}
          </div>
          {vl && <p className="n8-fade text-center text-[11px] font-bold" style={{ color: PURPLE }}>virtual link (through Area 1)</p>}
        </div>
        <p key={String(vl)} className="n8-fade mt-3 text-xs font-semibold" style={{ color: vl ? GREEN : RED }}>
          {vl ? "Area 2 now reaches the backbone logically. Routes flow." : "Area 2 is stranded from Area 0. Its routes do not reach the rest of the network."}
        </p>
        <div className="mt-3">
          <Code lines={["! on both ABRs", "router ospf 100", " area 1 virtual-link <remote-ABR-router-id>", "", "show ip ospf virtual-link"]} />
        </div>
        <div className="mt-3"><Tip title="Careful">The transit area cannot be a stub. A virtual link fixes a stranded area, not broken neighbor conditions.</Tip></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">E1 vs E2 external routes</p>
        <label className="mt-3 flex items-center gap-3 text-xs">
          Internal cost to reach the ASBR: <span className="w-8 font-mono font-bold">{ic}</span>
          <input type="range" min={0} max={100} value={ic} onChange={(e) => setIc(Number(e.target.value))} className="flex-1 accent-primary" aria-label="Internal cost" />
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Mini k="E2 (default): stays fixed" v={`20 (seed cost only), whatever the internal cost`} color={AMBER} />
          <Mini k="E1: seed + internal cost" v={`20 + ${ic} = ${20 + ic}`} color={BLUE} />
        </div>
        <div className="mt-3"><Tip>E1 grows as the route crosses the network, so it reflects the whole path. If both exist for the same destination, E1 is preferred. With E2, internal cost only breaks ties.</Tip></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Path control and when to reach for each feature</p>
        <div className="mt-3"><Code lines={["interface f0/0", " ip ospf cost 50", "", "router ospf 100", " auto-cost reference-bandwidth 1000   ! same on every router"]} /></div>
        <div className="mt-3">
          <SimpleTable
            head={["Situation", "Reach for"]}
            rows={[
              ["Slow convergence in a small branch", "Make the branch area stub"],
              ["An area got separated from Area 0", "Virtual link through the transit area"],
              ["ASBR inside what used to be a stub", "NSSA"],
              ["Fast and Gig links look identical", "Raise the reference bandwidth"],
              ["Primary path is not being used", "Lower cost on the preferred link or raise it on the backup"],
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 7 · redistribution ───────────────────────── */

const PAIRS = [
  { id: "oo", from: "OSPF 200", to: "OSPF 100", cmd: ["router ospf 100", " redistribute ospf 200 subnets"], need: "The subnets keyword. No metric needed.", a: "O 10.1.0.0/16", b: "O E2 10.1.0.0/16 [110/20]", note: "Same protocol, different process. Arrives as an external route (E2, default seed cost 20)." },
  { id: "ee", from: "EIGRP 200", to: "EIGRP 100", cmd: ["router eigrp 100", " redistribute eigrp 200"], need: "No metric needed. It is carried across because both use the same format.", a: "D 10.1.0.0/16", b: "D EX 10.1.0.0/16 [170/...]", note: "Same protocol, different AS. Arrives as external EIGRP, AD 170." },
  { id: "oe", from: "OSPF 100", to: "EIGRP 200", cmd: ["router eigrp 200", " redistribute ospf 100 metric 10000 100 255 1 1500"], need: "A seed metric: bandwidth, delay, reliability, load, MTU.", a: "O 10.1.0.0/16", b: "D EX 10.1.0.0/16 [170/...]", note: "Different protocols and metrics, so EIGRP needs you to supply one." },
  { id: "eo", from: "EIGRP 200", to: "OSPF 100", cmd: ["router ospf 100", " redistribute eigrp 200 subnets"], need: "The subnets keyword. OSPF gives a default seed cost of 20.", a: "D 10.1.0.0/16", b: "O E2 10.1.0.0/16 [110/20]", note: "Arrives in OSPF as an external route (E2). Use metric-type 1 for E1." },
];

function RedistSection() {
  const [pi, setPi] = useState(2);
  const [n, setN] = useState(1);
  const p = PAIRS[pi];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Redistribution shares routes between routing domains</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Each domain speaks its own protocol. One router touching both, the ASBR, is configured to translate. You configure it per direction, per router.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Pick a direction on the ASBR</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PAIRS.map((x, i) => <Pick key={x.id} active={pi === i} onClick={() => { setPi(i); setN((v) => v + 1); }}>{x.from} into {x.to}</Pick>)}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_90px_1fr] items-center gap-2 text-center">
          <div className="rounded-lg border p-3" style={{ borderColor: BLUE }}>
            <p className="text-xs font-bold" style={{ color: BLUE }}>{p.from}</p>
            <p className="text-[10px] text-muted-foreground">source domain</p>
          </div>
          <div className="rounded-lg border-2 p-2" style={{ borderColor: AMBER }}>
            <p className="text-xs font-bold" style={{ color: AMBER }}>ASBR</p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: PURPLE }}>
            <p className="text-xs font-bold" style={{ color: PURPLE }}>{p.to}</p>
            <p className="text-[10px] text-muted-foreground">target domain</p>
          </div>
        </div>
        <div className="relative mt-2 h-9 overflow-hidden">
          <span key={`a${pi}-${n}`} className="n8-rdA absolute top-1 whitespace-nowrap rounded px-2 py-1 font-mono text-[10px] font-bold text-white" style={{ background: BLUE }}>{p.a}</span>
          <span key={`b${pi}-${n}`} className="n8-rdB absolute top-1 whitespace-nowrap rounded px-2 py-1 font-mono text-[10px] font-bold text-white" style={{ background: PURPLE }}>{p.b}</span>
        </div>
        <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setN((v) => v + 1)}>Replay</Button></div>

        <div key={pi} className="n8-fade mt-3 flex flex-col gap-2">
          <Code lines={p.cmd} />
          <Mini k="What you must give" v={p.need} color={GREEN} />
          <p className="text-xs leading-5 text-muted-foreground">{p.note}</p>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Seed metric fields (OSPF into EIGRP)</p>
        <div className="mt-3">
          <SimpleTable
            head={["Field", "Example", "Notes"]}
            rows={[["Bandwidth (kbps)", "10000", "10 Mbps"], ["Delay (tens of µs)", "100", "1 ms"], ["Reliability", "255", "255 = most reliable"], ["Load", "1", "1 = lowest load"], ["MTU", "1500", "Ethernet default"]]}
          />
        </div>
        <div className="mt-3"><Tip>Pick values that make sense for your network. Wrong seed values give wrong metrics and wrong best paths.</Tip></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Both directions on one ASBR</p>
        <div className="mt-3">
          <Code lines={["! pull EIGRP into OSPF", "router ospf 100", " redistribute eigrp 200 subnets", "", "! push OSPF into EIGRP (metric required)", "router eigrp 200", " redistribute ospf 100 metric 10000 100 255 1 1500"]} />
        </div>
        <div className="mt-3">
          <SimpleTable
            head={["Step", "Action"]}
            rows={[["1", "Find the ASBR: the router touching both domains"], ["2", "Enter the target protocol's router config"], ["3", "Issue redistribute <source>, with a metric if the target is EIGRP"], ["4", "Verify: show ip route, show ip protocols, show run | section ospf, show run | section eigrp"]]}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Careful">Without subnets, OSPF redistributes only classful networks. Almost every real network needs it.</Tip>
          <Tip title="Loop risk">With two ASBRs redistributing in both directions, routes can loop back. Real designs use route tags and route-maps to stop that.</Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 8 · common mistakes ───────────────────────── */

type Myth = { g: string; wrong: string; right: string };
const MYTHS: Myth[] = [
  { g: "Static", wrong: "A router automatically knows every network.", right: "It only knows connected networks until you add static routes or run a dynamic protocol." },
  { g: "Static", wrong: "One static route is enough for the whole network.", right: "Every router between source and destination needs its own route, and the way back needs routes too. Statics do not propagate." },
  { g: "Static", wrong: "Static routing is old. Dynamic is always better.", right: "Static is preferred for small stable networks, default routes and deterministic paths." },
  { g: "Static", wrong: "Any next-hop IP works in a static route.", right: "The next hop must be reachable, usually on a directly connected subnet." },
  { g: "Selection", wrong: "The router checks metric, then AD.", right: "Prefix length first, then AD, then metric. Metrics from different protocols are not comparable, so AD comes before metric." },
  { g: "Selection", wrong: "Lower AD always wins.", right: "Only among routes with the same prefix length. Longest prefix beats everything." },
  { g: "Selection", wrong: "Floating static routes use a special command.", right: "Same ip route command with a higher AD on the end. Higher AD means less preferred, so it is the backup." },
  { g: "Selection", wrong: "A default route overrides specific routes.", right: "Specific routes always win. The default route is used only when nothing else matches." },
  { g: "Selection", wrong: "Null0 drops all traffic to the router.", right: "Only traffic for the network you pointed at Null0 is discarded." },
  { g: "Selection", wrong: "Two statics to the same destination: one wins, one fails.", right: "Same AD means equal-cost load balancing across both, unless one has a higher AD." },
  { g: "RIP", wrong: "RIP works for networks of any size.", right: "15 hops is the limit. 16 means unreachable." },
  { g: "RIP", wrong: "RIPv1 supports subnetting and VLSM.", right: "RIPv1 is classful. Use RIPv2 for VLSM." },
  { g: "RIP", wrong: "Passive interface stops advertising the network.", right: "It stops RIP sending updates out that interface. The network is still advertised out the others." },
  { g: "RIP", wrong: "auto-summary is a good default.", right: "It summarizes to classful boundaries and breaks VLSM designs. Turn it off." },
  { g: "RIP", wrong: "RIP timers can differ per router.", right: "They must match on every router, or convergence becomes unstable." },
  { g: "EIGRP", wrong: "EIGRP uses TCP or UDP.", right: "It runs directly over IP as protocol 88, with its own reliable transport." },
  { g: "EIGRP", wrong: "EIGRP sends periodic updates like RIP.", right: "Updates are triggered only by topology changes. Hellos keep neighbors alive." },
  { g: "EIGRP", wrong: "The AS number is optional.", right: "It must match between neighbors, or no adjacency forms." },
  { g: "EIGRP", wrong: "Any neighbor can be a feasible successor.", right: "Only if its advertised distance is lower than the successor's feasible distance." },
  { g: "EIGRP", wrong: "Hello timers must match for EIGRP neighbors.", right: "They do not have to match (unlike OSPF), but a mismatch can make the adjacency flap." },
  { g: "OSPF", wrong: "OSPF uses hop count.", right: "OSPF uses cost, derived from interface bandwidth." },
  { g: "OSPF", wrong: "The OSPF process ID must match on neighbors.", right: "It is locally significant. Area IDs must match." },
  { g: "OSPF", wrong: "224.0.0.5 is the DR address.", right: "224.0.0.5 is all OSPF routers. 224.0.0.6 is the DR and BDR address." },
  { g: "OSPF", wrong: "The DR is re-elected whenever a better router appears.", right: "Election is non-preemptive. A late router with higher priority waits until the DR fails." },
  { g: "OSPF", wrong: "A DROther forms Full adjacency with every other DROther.", right: "DROthers reach only Two-Way with each other. Full adjacency is with the DR and BDR." },
  { g: "OSPF", wrong: "Fast Ethernet and Gigabit have different OSPF costs by default.", right: "With the default 100 Mbps reference both cost 1. Raise the reference bandwidth on every router." },
  { g: "Advanced", wrong: "There is one kind of stub area.", right: "Four: stub, total stub, NSSA and total NSSA. Each blocks a different set of LSAs." },
  { g: "Advanced", wrong: "Plain NSSA gets a default route automatically.", right: "It does not. Use no-summary or default-information-originate." },
  { g: "Advanced", wrong: "Virtual links can fix any OSPF problem.", right: "They only reconnect an area stranded from Area 0 through a transit area." },
  { g: "Advanced", wrong: "E1 and E2 are the same.", right: "E2 stays fixed. E1 adds internal cost along the path, and is preferred if both exist." },
  { g: "Redistribution", wrong: "Redistribution works both ways automatically.", right: "You configure each direction on the ASBR separately." },
  { g: "Redistribution", wrong: "OSPF into EIGRP needs no metric.", right: "EIGRP needs a seed metric (or default-metric). OSPF into OSPF and EIGRP into EIGRP do not." },
  { g: "Redistribution", wrong: "The subnets keyword is optional.", right: "Without it, OSPF redistributes only classful routes." },
];

const GROUPS = ["All", "Static", "Selection", "RIP", "EIGRP", "OSPF", "Advanced", "Redistribution"];

function MythsSection() {
  const [g, setG] = useState("All");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const list = MYTHS.map((m, i) => ({ m, i })).filter(({ m }) => g === "All" || m.g === g);
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const allOpen = list.every(({ i }) => open.has(i));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">{GROUPS.map((x) => <Pick key={x} active={g === x} onClick={() => setG(x)}>{x}</Pick>)}</div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Tap a card to flip it from the wrong belief to the truth.</p>
        <Button size="sm" variant="outline" onClick={() => setOpen((s) => { const n = new Set(s); list.forEach(({ i }) => (allOpen ? n.delete(i) : n.add(i))); return n; })}>
          {allOpen ? "Hide all" : "Show all"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map(({ m, i }) => {
          const shown = open.has(i);
          return (
            <button key={i} type="button" onClick={() => toggle(i)} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50" style={{ borderColor: shown ? GREEN : undefined }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: RED }}>✕ Wrong</p>
                <Badge variant="secondary">{m.g}</Badge>
              </div>
              <p className="mt-1 text-sm font-medium">{m.wrong}</p>
              {shown ? (
                <div className="n8-fade mt-3 border-t pt-3">
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>✓ Right</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.right}</p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">Tap to see the truth</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 9 · interview prep ───────────────────────── */

type QAi = { g: string; q: string; a: string[] };
const QA: QAi[] = [
  { g: "Static", q: "What is a routing table?", a: ["A database of the best paths to every reachable destination network.", "It is filled from connected interfaces, static routes and dynamic protocols. Forwarding decisions come from it."] },
  { g: "Static", q: "Connected vs unknown networks?", a: ["Connected networks are directly attached and known automatically (code C).", "Unknown networks need routes added manually (S) or learned dynamically."] },
  { g: "Static", q: "When would you prefer static routing?", a: ["Small, stable networks.", "Default routes toward an ISP.", "Paths where you want deterministic forwarding."] },
  { g: "Selection", q: "How does the router choose between routes to the same network?", a: ["1. Longest prefix match.", "2. Lowest Administrative Distance, if the routes come from different sources.", "3. Lowest metric, within the same protocol."] },
  { g: "Selection", q: "What is Administrative Distance?", a: ["A trust rating for the source of a route. Lower is more trusted.", "Connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120, EIGRP external 170, iBGP 200."] },
  { g: "Selection", q: "What is a floating static route?", a: ["A static route with a higher AD than the primary, so it only enters the table when the primary disappears.", "It is a simple primary and backup design."] },
  { g: "Selection", q: "What is a Null0 route for?", a: ["Discarding traffic for a specific network: a controlled blackhole.", "Common with summarization, to prevent loops."] },
  { g: "RIP", q: "What is RIP's metric and hard limit?", a: ["Hop count. 15 is the maximum, and 16 means unreachable."] },
  { g: "RIP", q: "Why does RIPv2 exist?", a: ["RIPv1 is classful and cannot handle VLSM.", "RIPv2 is classless, supports authentication, and uses multicast 224.0.0.9 instead of broadcast."] },
  { g: "RIP", q: "Why is passive-interface useful?", a: ["It stops routing updates going out toward LANs with no routers.", "That saves bandwidth and improves security."] },
  { g: "EIGRP", q: "Why is EIGRP called hybrid?", a: ["It keeps distance-vector simplicity but uses bandwidth and delay in its metric and a smarter algorithm (DUAL)."] },
  { g: "EIGRP", q: "What is the feasibility condition?", a: ["A neighbor's advertised distance must be lower than the current successor's feasible distance.", "That guarantees the backup path is loop-free."] },
  { g: "EIGRP", q: "What are the EIGRP neighbor conditions?", a: ["Layer 1 up, same subnet, same AS number, same K-values, matching authentication.", "Hello and hold timers do not have to match."] },
  { g: "EIGRP", q: "Equal-cost vs unequal-cost load balancing?", a: ["Equal-cost is automatic across identical metrics.", "Unequal-cost needs variance: a path is used if its FD is at most variance × the best FD, and it is a feasible successor."] },
  { g: "EIGRP", q: "What does stuck-in-active mean?", a: ["The best path failed, no feasible successor exists, and a Query is still unanswered.", "After the 3-minute active timer the router gives up, resets that neighbor and flushes its routes."] },
  { g: "OSPF", q: "Why is OSPF called link-state?", a: ["Every router floods its own links, so each builds a full map of the area and runs SPF on it."] },
  { g: "OSPF", q: "What are the OSPF neighbor conditions?", a: ["Same area, subnet, timers, MTU, authentication and stub flag, and a unique router ID."] },
  { g: "OSPF", q: "What is the DR/BDR election based on?", a: ["Highest priority (default 1, range 0 to 255), then highest router ID. Priority 0 never participates.", "It is non-preemptive."] },
  { g: "OSPF", q: "Why is the default reference bandwidth a problem?", a: ["At 100 Mbps, Fast Ethernet and anything faster all get cost 1.", "Raise it, for example to 1000, on every router."] },
  { g: "OSPF", q: "What do the ABR and ASBR do?", a: ["The ABR connects areas to the backbone and generates LSA 3 and LSA 4.", "The ASBR redistributes external routes and generates LSA 5 (LSA 7 in an NSSA)."] },
  { g: "Advanced", q: "How does a stub area save memory?", a: ["It blocks LSA 4 and 5. The ABR injects one default route in place of many external routes."] },
  { g: "Advanced", q: "When do you use a virtual link?", a: ["When an area is separated from Area 0 by another area. It tunnels the adjacency between two ABRs through the transit area."] },
  { g: "Advanced", q: "E1 vs E2?", a: ["E2 stays at the seed cost. E1 adds the internal cost to the ASBR.", "E2 is the default. E1 is preferred if both exist."] },
  { g: "Redistribution", q: "What is redistribution, and why does OSPF into EIGRP need a metric?", a: ["Sharing routes between routing domains, done on the ASBR.", "OSPF uses cost and EIGRP uses bandwidth and delay, so you must supply a seed metric for EIGRP."] },
  { g: "Redistribution", q: "What does the subnets keyword do?", a: ["Without it OSPF redistributes only classful networks. With it, classless subnets are included, which is what you normally want."] },
];

function InterviewSection() {
  const [g, setG] = useState("All");
  const [open, setOpen] = useState<number | null>(0);
  const list = QA.filter((x) => g === "All" || x.g === g);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          A router forwards using its routing table. It knows connected networks automatically. Other networks come from static routes or a dynamic protocol.
          When several routes match, it picks the longest prefix first, then the lowest administrative distance, then the lowest metric. RIP is distance vector, counts hops
          and stops at 15. EIGRP is a hybrid that uses bandwidth and delay, and DUAL gives it loop-free backup paths. OSPF is link state: every router builds a map of its area
          and runs SPF, using cost. Areas keep OSPF scalable, and stub variants filter routes. Where two domains meet, an ASBR redistributes routes between them.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">Practice it out loud until it flows without notes.</p>
      </Panel>

      <div className="flex flex-wrap gap-2">{GROUPS.map((x) => <Pick key={x} active={g === x} onClick={() => { setG(x); setOpen(null); }}>{x}</Pick>)}</div>

      <div className="flex flex-col gap-2">
        {list.map((x, i) => {
          const isOpen = open === i;
          return (
            <div key={x.q} className="rounded-xl border bg-background">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                  {x.q}
                </span>
                <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <ul className="n8-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">Prefix, then AD, then metric. Statics do not propagate. RIP counts hops, EIGRP has backups ready, OSPF knows the whole map.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function RoutingSummary() {
  const [tab, setTab] = useState<TabId>("static");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n8-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes n8-pop { from { opacity: 0; transform: scale(.88); } to { opacity: 1; transform: none; } }
        @keyframes n8-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes n8-flyR { from { left: 0; opacity: 0; } 15% { opacity: 1; } to { left: calc(100% - 2.5rem); opacity: 1; } }
        @keyframes n8-flyL { from { left: calc(100% - 2.5rem); opacity: 0; } 15% { opacity: 1; } to { left: 0; opacity: 1; } }
        @keyframes n8-rdA { 0% { left: 0; opacity: 0; } 15% { opacity: 1; } 100% { left: 38%; opacity: 1; } }
        @keyframes n8-rdB { 0%,45% { left: 38%; opacity: 0; } 55% { opacity: 1; } 100% { left: 62%; opacity: 1; } }
        .n8-fade { animation: n8-fade .45s ease-out both; }
        .n8-pop { animation: n8-pop .35s ease-out both; }
        .n8-grow { transform-origin: left; animation: n8-grow .8s ease-out both; }
        .n8-flyR { animation: n8-flyR 1.1s ease-in-out both; }
        .n8-flyL { animation: n8-flyL 1.1s ease-in-out .3s both; }
        .n8-rdA { animation: n8-rdA 1.2s ease-in-out both; }
        .n8-rdB { animation: n8-rdB 2.4s ease-in-out both; }
        @media (prefers-reduced-motion: reduce) {
          .n8-fade, .n8-pop, .n8-grow, .n8-flyR, .n8-flyL, .n8-rdA, .n8-rdB { animation: none; opacity: 1; }
          .n8-flyR, .n8-rdA { left: 10%; }
          .n8-flyL { left: 60%; }
          .n8-rdB { left: 62%; }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 08: Routing</CardTitle>
            <CardDescription className="mt-1">
              Static, RIP, EIGRP, OSPF and redistribution. Nine short sections, tap through them in any order.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Pick key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pick>
          ))}
        </div>

        <div key={tab}>
          {tab === "static" && <StaticSection />}
          {tab === "best" && <BestSection />}
          {tab === "rip" && <RipSection />}
          {tab === "eigrp" && <EigrpSection />}
          {tab === "ospf" && <OspfSection />}
          {tab === "adv" && <AdvSection />}
          {tab === "redist" && <RedistSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}