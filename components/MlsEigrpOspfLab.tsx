"use client";
import { useState, type CSSProperties } from "react";

/**
 * Four MLS in a square: LACP bundles, trunks, VLANs, STP root, SVIs, EIGRP + OSPF.
 * A guided build: every step shows the commands, WHY they are written that way, and a "try it" control
 * that breaks the step so you can see the consequence on the diagram. Built from MLS_1234_EIGRP_OSPF.unl.
 * Visuals only. Light/dark aware through CSS variables. Same look as the other labs.
 * Usage: <MlsEigrpOspfLab />
 */

const THEME_CSS = `
  .sw {
    --ink:#1b2330; --muted:#445063; --faint:#5f6b7d;
    --line:#dde2ea; --line-strong:#b9c1cd; --panel:#f8f9fb; --surface:#ffffff; --head:#f1f3f7;
    --link:#8b95a5; --ok:#15803d; --t-ok:#e6f6ec;
    --c-blue:#2b5fd9; --t-blue:#eaf0fd;
    --c-orange:#c2410c; --t-orange:#fdeee5;
    --c-teal:#0f7f6c; --t-teal:#e3f4f0;
    --c-amber:#a16207; --t-amber:#fef3c7;
    --err:#b91c1c; --err-bg:#fde8e8;
    color:var(--ink);
  }
  @media (prefers-color-scheme: dark) {
    :root:not(.light):not([data-theme="light"]) .sw {
      --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
      --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
      --link:#6b7686; --ok:#4ade80; --t-ok:#12301f;
      --c-blue:#7aa2ff; --t-blue:#16233f;
      --c-orange:#ff935f; --t-orange:#3a2116;
      --c-teal:#3fd0b5; --t-teal:#10302b;
      --c-amber:#facc15; --t-amber:#3a2f0a;
      --err:#ff8a8a; --err-bg:#3a1b1e;
    }
  }
  :root.dark .sw, .dark .sw, [data-theme="dark"] .sw {
    --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
    --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
    --link:#6b7686; --ok:#4ade80; --t-ok:#12301f;
    --c-blue:#7aa2ff; --t-blue:#16233f;
    --c-orange:#ff935f; --t-orange:#3a2116;
    --c-teal:#3fd0b5; --t-teal:#10302b;
    --c-amber:#facc15; --t-amber:#3a2f0a;
    --err:#ff8a8a; --err-bg:#3a1b1e;
  }
  @keyframes ml-line { from { opacity:0; transform: translateY(3px); } to { opacity:1; transform:none; } }
  .ml-line { animation: ml-line .25s ease-out both; }
  @media (prefers-reduced-motion: reduce) { .ml-line { animation-duration: .01s; } }
`;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// ---------- the lab (taken from the .unl) ----------
type SwId = 1 | 2 | 3 | 4;
type BId = "12" | "13" | "24" | "34";
type Md = "active" | "passive" | "on";
const SWS: SwId[] = [1, 2, 3, 4];
const BIDS: BId[] = ["12", "13", "24", "34"];
const ENDS: Record<BId, [SwId, SwId]> = { "12": [1, 2], "13": [1, 3], "24": [2, 4], "34": [3, 4] };
const PORTS: Record<BId, [[string, string], [string, string]]> = {
  "12": [["e0/0", "e0/2"], ["e0/0", "e0/2"]],
  "13": [["e0/1", "e0/3"], ["e0/0", "e0/2"]],
  "24": [["e0/1", "e0/3"], ["e0/0", "e0/2"]],
  "34": [["e0/1", "e0/3"], ["e0/1", "e0/3"]],
};
const LAB_MODES: Record<BId, [Md, Md]> = { "12": ["active", "passive"], "13": ["active", "passive"], "24": ["passive", "active"], "34": ["passive", "active"] };
const LAB_PRIO: Record<SwId, number> = { 1: 4096, 2: 8192, 3: 16384, 4: 32768 };
const LO: Record<SwId, string> = { 1: "1.1.1.1", 2: "2.2.2.2", 3: "3.3.3.3", 4: "4.4.4.4" };
const SVI_V: Record<SwId, 14 | 23> = { 1: 14, 2: 23, 3: 23, 4: 14 };
const SVI_IP: Record<SwId, string> = { 1: "10.1.4.1", 2: "10.2.3.2", 3: "10.2.3.3", 4: "10.1.4.4" };
const PARTNER: Record<SwId, SwId> = { 1: 4, 4: 1, 2: 3, 3: 2 };
const MAC: Record<SwId, number> = { 1: 3, 2: 2, 3: 4, 4: 1 }; // assumed MAC order (SW4 oldest) for the "no priorities set" case
const POS: Record<SwId, [number, number]> = { 1: [120, 80], 2: [580, 80], 3: [120, 320], 4: [580, 320] };
const isEigrp = (s: SwId) => s === 1 || s === 4;
const portsOf = (b: BId, s: SwId) => PORTS[b][ENDS[b][0] === s ? 0 : 1];
const et = (p: string) => `Et${p.slice(1)}`;

interface X {
  modes: Record<BId, [Md, Md]>; trunk: Record<BId, boolean>;
  vlan: Record<SwId, { 14: boolean; 23: boolean }>; prio: Record<SwId, number>;
  routing: Record<SwId, boolean>; sviUp: Record<SwId, boolean>; as4: number; area3: number;
}
const fresh = (): X => ({
  modes: JSON.parse(JSON.stringify(LAB_MODES)),
  trunk: { "12": true, "13": true, "24": true, "34": true },
  vlan: { 1: { 14: true, 23: true }, 2: { 14: true, 23: true }, 3: { 14: true, 23: true }, 4: { 14: true, 23: true } },
  prio: { ...LAB_PRIO }, routing: { 1: true, 2: true, 3: true, 4: true }, sviUp: { 1: true, 2: true, 3: true, 4: true },
  as4: 1, area3: 0,
});

// ---------- what the network is doing ----------
function derive(stage: number, x: X) {
  const modeOk = (a: Md, b: Md) => (a === "on" && b === "on") || (a !== "on" && b !== "on" && !(a === "passive" && b === "passive"));
  const formed = {} as Record<BId, boolean>;
  const bwhy = {} as Record<BId, string>;
  BIDS.forEach((b) => {
    const [ma, mb] = x.modes[b];
    formed[b] = stage >= 2 && modeOk(ma, mb);
    bwhy[b] = ma === "passive" && mb === "passive" ? "both ends are passive, so nobody starts LACP"
      : (ma === "on") !== (mb === "on") ? "\"on\" does not negotiate with LACP" : "";
  });
  const cost = (b: BId) => (formed[b] ? 10 : 20); // simplified: a bundle is cheaper than one link
  const prio = (s: SwId) => (stage >= 5 ? x.prio[s] : 32768);
  const key = (s: SwId) => prio(s) * 10 + MAC[s];
  let root: SwId = 1;
  for (const s of SWS) if (key(s) < key(root)) root = s;
  const dist: Record<number, number> = { 1: 99, 2: 99, 3: 99, 4: 99 };
  dist[root] = 0;
  for (let i = 0; i < 4; i++)
    for (const b of BIDS) {
      const [p, q] = ENDS[b];
      if (dist[p] + cost(b) < dist[q]) dist[q] = dist[p] + cost(b);
      if (dist[q] + cost(b) < dist[p]) dist[p] = dist[q] + cost(b);
    }
  const rp: Record<number, BId | null> = { 1: null, 2: null, 3: null, 4: null };
  for (const s of SWS) {
    if (s === root) continue;
    let bc = 1e9, bk = 1e9, bb: BId | null = null;
    for (const b of BIDS) {
      if (!ENDS[b].includes(s)) continue;
      const n = ENDS[b][0] === s ? ENDS[b][1] : ENDS[b][0];
      const c = dist[n] + cost(b), k = key(n);
      if (c < bc || (c === bc && (k < bk || (k === bk && bb !== null && b < bb)))) { bc = c; bk = k; bb = b; }
    }
    rp[s] = bb;
  }
  const role = {} as Record<BId, Record<number, "R" | "D" | "A">>;
  for (const b of BIDS) {
    const [p, q] = ENDS[b];
    const r: Record<number, "R" | "D" | "A"> = {};
    if (rp[p] === b) { r[p] = "R"; r[q] = "D"; }
    else if (rp[q] === b) { r[q] = "R"; r[p] = "D"; }
    else if (dist[p] < dist[q] || (dist[p] === dist[q] && key(p) < key(q))) { r[p] = "D"; r[q] = "A"; }
    else { r[q] = "D"; r[p] = "A"; }
    role[b] = r;
  }
  const blocked = (b: BId): SwId | null => (role[b][ENDS[b][0]] === "A" ? ENDS[b][0] : role[b][ENDS[b][1]] === "A" ? ENDS[b][1] : null);

  const treePath = (a: SwId, c: SwId) => {
    const prev: Record<number, { n: SwId; e: BId } | null> = { [a]: null };
    const q: SwId[] = [a];
    while (q.length) {
      const n = q.shift()!;
      for (const b of BIDS) {
        if (blocked(b) !== null || !ENDS[b].includes(n)) continue;
        const m = ENDS[b][0] === n ? ENDS[b][1] : ENDS[b][0];
        if (!(m in prev)) { prev[m] = { n, e: b }; q.push(m); }
      }
    }
    const nodes: SwId[] = [c], edges: BId[] = [];
    let cur: SwId = c;
    while (prev[cur]) { const p = prev[cur]!; edges.unshift(p.e); nodes.unshift(p.n); cur = p.n; }
    return { nodes, edges };
  };
  const vpath = (v: 14 | 23, a: SwId, c: SwId) => {
    const p = treePath(a, c);
    let why = "";
    if (stage < 3) why = "there are no trunks yet, so the links carry only VLAN 1";
    else
      for (let i = 0; i < p.nodes.length && !why; i++) {
        const n = p.nodes[i];
        if (stage < 4 || !x.vlan[n][v]) { why = `SW${n} has no VLAN ${v}${i > 0 && i < p.nodes.length - 1 ? " (a transit switch still needs it)" : ""}`; break; }
        const e = p.edges[i];
        if (e && !x.trunk[e]) why = `Po${e} is not a trunk`;
      }
    return { ...p, ok: !why, why };
  };
  const sviUp = (s: SwId) => stage >= 6 && x.sviUp[s] && x.vlan[s][SVI_V[s]];
  const adj = (a: SwId, c: SwId, v: 14 | 23) => {
    const p = vpath(v, a, c);
    let why = "";
    for (const s of [a, c])
      if (!why && stage >= 6 && !sviUp(s)) why = `Vlan${v} on SW${s} is down (${x.sviUp[s] ? `VLAN ${v} is missing` : "shutdown"})`;
    if (stage < 6) why = "the SVIs are not configured yet";
    else if (!why && !p.ok) why = p.why;
    return { p, ok: !why, why };
  };
  const a14 = adj(1, 4, 14), a23 = adj(2, 3, 23);
  let ew = "";
  if (stage < 7) ew = "routing is not configured yet";
  else if (!a14.ok) ew = a14.why;
  else if (!x.routing[1] || !x.routing[4]) ew = "ip routing is off on a switch";
  else if (x.as4 !== 1) ew = `AS mismatch (SW1 AS 1, SW4 AS ${x.as4})`;
  let ow = "";
  if (stage < 7) ow = "routing is not configured yet";
  else if (!a23.ok) ow = a23.why;
  else if (!x.routing[2] || !x.routing[3]) ow = "ip routing is off on a switch";
  else if (x.area3 !== 0) ow = `area mismatch (SW2 area 0, SW3 area ${x.area3})`;
  const nbr: Record<number, boolean> = { 1: !ew, 4: !ew, 2: !ow, 3: !ow };
  const linkFwd = BIDS.reduce((n, b) => n + (blocked(b) === null ? (formed[b] ? 2 : 1) : 0), 0);
  return { formed, bwhy, root, rp, role, blocked, prio, vp14: a14.p, vp23: a23.p, a14, a23, sviUp, ew, ow, nbr, linkFwd };
}
type D = ReturnType<typeof derive>;

// ---------- commands per step & switch (from the saved configs) ----------
function cmds(step: number, s: SwId): string[] {
  const my = BIDS.filter((b) => ENDS[b].includes(s));
  const idx = (b: BId) => (ENDS[b][0] === s ? 0 : 1);
  const rng = (b: BId) => `interface range ${portsOf(b, s)[0]} , ${portsOf(b, s)[1]}`;
  if (step === 2) return my.flatMap((b) => [rng(b), ` channel-group ${b} mode ${LAB_MODES[b][idx(b)]}`, " no shutdown", "exit"]);
  if (step === 3) return my.flatMap((b) => [
    `interface port-channel ${b}`, " switchport trunk encapsulation dot1q", " switchport mode trunk", "exit",
    `${rng(b)}   ! members carry the same two lines`, " switchport trunk encapsulation dot1q", " switchport mode trunk", "exit"]);
  if (step === 4) return ["vlan 14", "exit", "vlan 23", "exit"];
  if (step === 5) return ["spanning-tree mode rapid-pvst", ...(s === 4 ? ["! no priority line: SW4 stays at the default 32768"] : [`spanning-tree vlan 1,14,23 priority ${LAB_PRIO[s]}`])];
  if (step === 6) return ["ip routing", `interface vlan ${SVI_V[s]}`, ` ip address ${SVI_IP[s]} 255.255.255.0`, " no shutdown", "exit"];
  if (step === 7) {
    const base = ["interface loopback 1", ` ip address ${LO[s]} 255.255.255.255`, "exit"];
    return isEigrp(s)
      ? [...base, "router eigrp 1", ` network ${LO[s]} 0.0.0.0`, ` network ${SVI_IP[s].replace(/\d+$/, "0")} 0.0.0.255`]
      : [...base, "router ospf 1", ` router-id ${LO[s]}`, ` network ${LO[s]} 0.0.0.0 area 0`, ` network ${SVI_IP[s].replace(/\d+$/, "0")} 0.0.0.255 area 0`];
  }
  return [];
}

// ---------- verify output ----------
function verify(sw: SwId, cmd: string, stage: number, x: X, d: D): string[] {
  const my = BIDS.filter((b) => ENDS[b].includes(sw));
  const i0 = (b: BId) => (ENDS[b][0] === sw ? 0 : 1);
  const v = SVI_V[sw];
  if (cmd === "ec") {
    if (stage < 2) return ["Number of channel-groups in use: 0", "Number of aggregators:           0"];
    return [
      "Flags:  D - down   P - bundled in port-channel   I - stand-alone   S - Layer2   U - in use", "",
      `Number of channel-groups in use: ${my.length}`, "",
      "Group  Port-channel  Protocol    Ports", "------+-------------+-----------+---------------------------",
      ...my.map((b) => {
        const f = d.formed[b], ps = portsOf(b, sw).map((p) => `${et(p)}(${f ? "P" : "I"})`).join("  ");
        return `${b.padEnd(7)}${`Po${b}(${f ? "SU" : "SD"})`.padEnd(14)}${(x.modes[b][i0(b)] === "on" ? "-" : "LACP").padEnd(12)}${ps}`;
      }),
    ];
  }
  if (cmd === "stp") {
    if (stage < 2) return ["% Run step 2 first: no links are bundled yet."];
    const rows: string[] = [];
    my.forEach((b) => {
      const r = d.role[b][sw], nm = r === "R" ? "Root" : r === "D" ? "Desg" : "Altn", sts = r === "A" ? "BLK" : "FWD";
      if (d.formed[b]) rows.push(`${`Po${b}`.padEnd(20)}${nm.padEnd(5)}${sts} P2p`);
      else portsOf(b, sw).forEach((p, k) => rows.push(`${et(p).padEnd(20)}${(k === 0 ? nm : "Altn").padEnd(5)}${k === 0 ? sts : "BLK"} P2p`));
    });
    return [
      `VLAN00${v}`, "  Spanning tree enabled protocol rstp",
      `  Root ID    Priority    ${d.prio(d.root) + v}`,
      d.root === sw ? "             This bridge is the root" : `             Root port: Po${d.rp[sw]}`,
      `  Bridge ID  Priority    ${d.prio(sw) + v}  (priority ${d.prio(sw)} sys-id-ext ${v})`, "",
      "Interface           Role Sts Type", "------------------- ---- --- --------", ...rows,
    ];
  }
  if (cmd === "route") {
    const L = ["Codes: C - connected, D - EIGRP, O - OSPF   (simplified)", ""];
    if (d.sviUp(sw)) L.push(`C        ${SVI_IP[sw].replace(/\d+$/, "0")}/24 is directly connected, Vlan${v}`);
    if (stage >= 7) L.push(`C        ${LO[sw]}/32 is directly connected, Loopback1`);
    if (d.nbr[sw]) L.push(`${isEigrp(sw) ? "D" : "O"}        ${LO[PARTNER[sw]]}/32 via ${SVI_IP[PARTNER[sw]]}, Vlan${v}`);
    if (L.length === 2) L.push("(no routes yet)");
    return L;
  }
  if (cmd === "nbr") {
    if (isEigrp(sw))
      return ["EIGRP-IPv4 Neighbors for AS(1)", "H   Address         Interface   State", d.nbr[sw] ? `0   ${SVI_IP[PARTNER[sw]]}       Vl14        up` : "(no neighbors)"];
    return ["Neighbor ID     Pri   State        Address         Interface",
      d.nbr[sw] ? `${LO[PARTNER[sw]]}         1   FULL/${sw === 2 ? "DR " : "BDR"}     ${SVI_IP[PARTNER[sw]]}       Vlan23` : "(no neighbors)"];
  }
  if (cmd.startsWith("ping ")) {
    const t = cmd.slice(5);
    const ok = stage >= 7 && d.nbr[sw] && LO[PARTNER[sw]] === t;
    return [`Sending 5, 100-byte ICMP Echos to ${t}, timeout is 2 seconds:`, ok ? "!!!!!" : ".....", `Success rate is ${ok ? "100 percent (5/5)" : "0 percent (0/5)"}`];
  }
  return [];
}

// ---------- step text ----------
const STEPS: { n: string; t: string; goal: string; why: string[]; wrong: string }[] = [
  { n: "Design", t: "Read the design first", goal: "Four multilayer switches in a square, two parallel cables on every side. Two routing domains sit on top: EIGRP between SW1 and SW4, OSPF between SW2 and SW3.",
    why: [
      "SW1 and SW4 are diagonal, and so are SW2 and SW3. No cable joins them, so each routing pair must meet over a VLAN that is trunked through the switches in between.",
      "One VLAN per domain keeps the two adjacencies apart: VLAN 14 and 10.1.4.0/24 for EIGRP, VLAN 23 and 10.2.3.0/24 for OSPF. The VLAN number is just the two switch numbers.",
      "Each switch gets a /32 loopback (1.1.1.1 to 4.4.4.4). It never goes down with a cable, so it is a stable router ID and a stable ping target.",
      "The build order is bottom-up: bundles, trunks, VLANs, STP, then SVIs and routing. Every layer depends on the one below, so you troubleshoot in the same order.",
    ], wrong: "Click the numbered steps (or Next). Each step adds its configuration to the diagram." },
  { n: "Bundles", t: "Bundle the parallel links with LACP", goal: "Turn each pair of cables into one logical link: Po12, Po13, Po24, Po34.",
    why: [
      "Without bundles STP sees 8 separate links. A tree over four switches needs only 3, so 5 links would sit blocked. With bundles it sees a ring of four logical links and blocks just one.",
      "LACP (open standard) negotiates, so a mismatched port is suspended instead of silently looping. Mode \"on\" does not negotiate and would hide mistakes.",
      "At least one end must be active. Here SW1 and SW4 are active and SW2 and SW3 are passive, so every bundle is active + passive. Passive + passive never starts.",
      "The group number is the two switch numbers (12, 13, 24, 34). Use the same number on both ends: your formation checklist requires it, and it makes show output easy to read.",
      "Configure while the ports are shut, then bring them up. Two parallel links between the same switches form a loop until they are bundled.",
    ], wrong: "Set both ends of a bundle to passive below, or one end to on, and watch what STP does with the leftover links." },
  { n: "Trunks", t: "Make each bundle a trunk", goal: "Let one bundle carry VLAN 14, VLAN 23 and VLAN 1 at the same time.",
    why: [
      "VLAN 14 and 23 must cross switches that never route them. A dot1q trunk tags every frame, so one bundle carries several VLANs.",
      "`switchport trunk encapsulation dot1q` comes first: this switch image also supports ISL, so it refuses `mode trunk` until you pick one.",
      "`mode trunk` is static on purpose. Both ends are yours, so there is nothing to negotiate, and DTP cannot leave one side as an access port.",
      "Configure it on the Port-channel. Members and Po must agree on encapsulation, mode, allowed VLANs and native VLAN (conditions vi to viii), so the saved config repeats the lines on every member.",
      "There is no `allowed vlan` list. The default allows everything, so a new VLAN works without touching eight interfaces. Restrict it only when the design asks for it.",
    ], wrong: "Turn a trunk off below. Any VLAN that needs that bundle is cut, even though the bundle itself is healthy." },
  { n: "VLANs", t: "Create VLAN 14 and 23 on all four switches", goal: "Make both VLANs exist everywhere, including the switches that only pass them along.",
    why: [
      "An SVI never comes up unless its VLAN exists in the VLAN database (step 2 of your SVI notes).",
      "Transit switches need the VLANs too. A trunk only forwards VLANs that exist on that switch, so VLAN 14 must exist on SW2 or SW3 and VLAN 23 on SW1, even though none of them route that VLAN.",
      "No exported config here has a `vlan` line, and nothing in this lab distributes VLANs for you, so type both on every switch.",
    ], wrong: "Untick VLAN 14 on a transit switch below, then jump to step 6 and watch the EIGRP pair lose its path." },
  { n: "STP", t: "Choose the spanning-tree root on purpose", goal: "Decide which bundle gets blocked and which path the VLANs take.",
    why: [
      "A ring of four bundles forces STP to block one. Without priorities the lowest MAC wins and the blocked bundle lands wherever that happens to be. Here we assume SW4 has the lowest MAC.",
      "Rapid-PVST converges in about a second instead of 30 to 50, and every switch must run the same mode (checklist iii).",
      "Priorities step 4096, 8192, 16384, then default 32768. Lower wins and values are multiples of 4096. SW1 is root, SW2 is next best, SW4 is last.",
      "They are set for VLANs 1,14,23, the VLANs in use. PVST builds one tree per VLAN, and identical priorities give all three the same tree.",
      "SW4 reaches the root through SW2 or SW3 at equal cost. The tie goes to the neighbour with the lower bridge ID, so SW2 (8192) beats SW3 (16384): Po24 becomes SW4's root port and Po34 is blocked at SW4's end.",
    ], wrong: "Change a priority below and see how the root, the blocked bundle and the VLAN paths move." },
  { n: "SVIs", t: "SVIs: the L3 endpoints of the VLANs", goal: "Give each switch an IP gateway interface in its own domain's VLAN.",
    why: [
      "`ip routing` comes first. Your notes say a MLS has it off by default, and it does not appear in these exported configs, so type it.",
      "Each switch has one SVI, in its own domain's VLAN: Vlan14 on SW1 and SW4, Vlan23 on SW2 and SW3. The other VLAN only transits the switch at L2.",
      "The last octet matches the switch number (.1 and .4, .2 and .3) and both ends use /24, so each pair shares one subnet.",
      "The SVI is up only if the VLAN exists and the interface is not shut, so `no shutdown` matters as much as the VLAN.",
      "Ping already works before any routing protocol. The frame follows the STP tree: look at the highlighted path, because that is the real route the adjacency will use.",
    ], wrong: "Shut an SVI or switch off ip routing below, then compare the path highlight and the status chips." },
  { n: "Routing", t: "EIGRP and OSPF over the SVI subnets", goal: "Bring up one EIGRP adjacency (VLAN 14) and one OSPF adjacency (VLAN 23).",
    why: [
      "Loopbacks come first so each protocol has something to advertise and, for OSPF, a fixed router ID.",
      "`network 1.1.1.1 0.0.0.0` uses a wildcard mask (the inverse of a subnet mask): 0.0.0.0 means an exact host match, so it enables the protocol on the loopback only. `0.0.0.255` matches the whole /24 and picks up the SVI.",
      "EIGRP needs the same AS number on both ends (1 here). OSPF's process ID is only local, but the area must match (area 0 on both), and the router-id is set by hand so it never changes when an interface flaps.",
      "OSPF elects a DR on this shared VLAN. The output assumes SW3, the higher router ID, won.",
      "No switch runs both protocols and nothing is redistributed, so SW1 never learns 2.2.2.2. The domains share cables but not routes.",
    ], wrong: "Change SW4's EIGRP AS or SW3's OSPF area below and the neighbor disappears." },
  { n: "Verify", t: "Verify bottom-up", goal: "Check each layer in order: bundles, STP, SVI reachability, neighbors, routes, ping.",
    why: [
      "`show etherchannel summary`: every group SU, every port (P). Anything else is a formation-condition problem.",
      "`show spanning-tree vlan 14`: SW1 is root and exactly one bundle is Altn/BLK (Po34 at SW4).",
      "Neighbors, then routes: each switch learns exactly one extra loopback, its partner's.",
      "A cross-domain ping such as SW1 to 2.2.2.2 fails by design. If a same-domain ping fails, walk back down the layers instead of guessing at the routing config.",
    ], wrong: "Use the Verify panel below, and keep breaking things from earlier steps to see which layer shows the symptom first." },
];

// ---------- component ----------
export function MlsEigrpOspfLab() {
  const [stage, setStage] = useState(1);
  const [x, setX] = useState<X>(fresh);
  const [tab, setTab] = useState<SwId>(1);
  const [vsw, setVsw] = useState<SwId>(1);
  const [vcmd, setVcmd] = useState("ec");
  const d = derive(stage, x);
  const step = STEPS[stage - 1];
  const upd = (f: (n: X) => void) => setX((p) => { const n: X = JSON.parse(JSON.stringify(p)); f(n); return n; });

  const btn = (on: boolean): CSSProperties => ({ borderColor: on ? "var(--c-blue)" : "var(--line)", background: on ? "var(--t-blue)" : "var(--surface)" });
  const h2 = "mt-8 text-lg font-semibold";
  const box = { borderColor: "var(--line)" };
  const sel: CSSProperties = { borderColor: "var(--line-strong)", background: "var(--surface)", color: "var(--ink)" };
  const blockedList = BIDS.filter((b) => d.blocked(b) !== null).map((b) => `Po${b} at SW${d.blocked(b)}`);
  const trunkOn = (b: BId) => stage >= 3 && x.trunk[b];
  const dom = (s: SwId) => (isEigrp(s) ? "var(--c-blue)" : "var(--c-orange)");

  // ----- status chips -----
  const chips: { l: string; ok: boolean | null; t: string }[] = [];
  if (stage >= 2) chips.push({ l: "Bundles", ok: BIDS.every((b) => d.formed[b]), t: `${BIDS.filter((b) => d.formed[b]).length} of 4 formed` });
  if (stage >= 2) chips.push({ l: "STP", ok: null, t: `root SW${d.root}, blocked: ${blockedList.join(", ") || "none"} (${d.linkFwd} of 8 links forwarding)` });
  if (stage >= 3) chips.push({ l: "VLAN 14 path", ok: d.vp14.ok, t: d.vp14.ok ? d.vp14.nodes.map((n) => `SW${n}`).join(" > ") : d.vp14.why });
  if (stage >= 3) chips.push({ l: "VLAN 23 path", ok: d.vp23.ok, t: d.vp23.ok ? d.vp23.nodes.map((n) => `SW${n}`).join(" > ") : d.vp23.why });
  if (stage >= 7) chips.push({ l: "EIGRP", ok: !d.ew, t: d.ew || "SW1 and SW4 are neighbors" });
  if (stage >= 7) chips.push({ l: "OSPF", ok: !d.ow, t: d.ow || "SW2 and SW3 are neighbors" });
  if (stage === 1) chips.push({ l: "Links", ok: null, t: "8 cables, nothing configured. Without bundles STP would keep 3 forwarding and block 5." });
  const failBundles = BIDS.filter((b) => stage >= 2 && !d.formed[b]);

  // ----- geometry -----
  const geo = (b: BId) => {
    const [a, c] = ENDS[b];
    const [ax, ay] = POS[a], [cx, cy] = POS[c];
    const horiz = ay === cy;
    const L = [-10, 10].map((o) => (horiz ? { x1: ax + 60, y1: ay + o, x2: cx - 60, y2: cy + o } : { x1: ax + o, y1: ay + 32, x2: cx + o, y2: cy - 32 }));
    const A = horiz ? [ax + 78, ay] : [ax, ay + 50];
    const B = horiz ? [cx - 78, cy] : [cx, cy - 50];
    return { L, A, B, M: [(ax + cx) / 2, (ay + cy) / 2], horiz, a, c, ax, ay, cx, cy };
  };
  const modePos = (g: ReturnType<typeof geo>, end: 0 | 1) => {
    const p = end === 0 ? g.A : g.B;
    return g.horiz ? { x: p[0], y: g.ay < 200 ? g.ay - 16 : g.ay + 30, a: "middle" as const } : { x: p[0] + (g.ax < 350 ? -16 : 16), y: p[1] + 3, a: (g.ax < 350 ? "end" : "start") as "end" | "start" };
  };

  const msg = (() => {
    if (stage === 1) return { ok: null as boolean | null, t: "Nothing is configured yet. Step through the build; each step adds its layer to the diagram." };
    if (stage === 2) return failBundles.length
      ? { ok: false, t: `${failBundles.map((b) => `Po${b}: ${d.bwhy[b] || "members differ"}`).join("; ")}. Those ports stay stand-alone, so STP treats them as separate links and blocks one.` }
      : { ok: true, t: `All four bundles formed. STP now sees a ring of 4 logical links and blocks ${blockedList.length} of them (${blockedList.join(", ")}) instead of 5 of 8 cables.` };
    if (stage === 3) return BIDS.every((b) => x.trunk[b]) ? { ok: true, t: "All four bundles are trunks and carry every VLAN." } : { ok: false, t: `${BIDS.filter((b) => !x.trunk[b]).map((b) => `Po${b}`).join(", ")} ${BIDS.filter((b) => !x.trunk[b]).length > 1 ? "are" : "is"} not a trunk: VLAN 14 and 23 cannot cross it.` };
    if (stage === 4) return d.vp14.ok && d.vp23.ok ? { ok: true, t: "VLAN 14 and 23 exist on every switch along both paths." } : { ok: false, t: `${!d.vp14.ok ? `VLAN 14: ${d.vp14.why}. ` : ""}${!d.vp23.ok ? `VLAN 23: ${d.vp23.why}.` : ""}` };
    if (stage === 5) return { ok: null, t: `SW${d.root} is root. Blocked: ${blockedList.join(", ") || "none"}. VLAN 14 takes ${d.vp14.nodes.map((n) => `SW${n}`).join(" > ")}; VLAN 23 takes ${d.vp23.nodes.map((n) => `SW${n}`).join(" > ")}.` };
    if (stage === 6) return d.a14.ok && d.a23.ok ? { ok: true, t: `Both SVI pairs can ping. 10.1.4.x crosses ${d.vp14.nodes.length - 2} transit switch${d.vp14.nodes.length - 2 === 1 ? "" : "es"}, and 10.2.3.x crosses ${d.vp23.nodes.length - 2}.` } : { ok: false, t: `${!d.a14.ok ? `VLAN 14 pair: ${d.a14.why}. ` : ""}${!d.a23.ok ? `VLAN 23 pair: ${d.a23.why}.` : ""}` };
    if (stage === 7) return !d.ew && !d.ow ? { ok: true, t: "Both adjacencies are up. Each switch learned exactly one remote loopback; SW1 still cannot reach 2.2.2.2." } : { ok: false, t: `${d.ew ? `EIGRP: ${d.ew}. ` : ""}${d.ow ? `OSPF: ${d.ow}.` : ""}` };
    return { ok: null, t: "Pick a switch and a command in the Verify panel." };
  })();
  const mc = msg.ok === true ? ["var(--ok)", "var(--t-ok)"] : msg.ok === false ? ["var(--err)", "var(--err-bg)"] : ["var(--line)", "var(--panel)"];

  const vcmds: [string, string][] = [
    ["ec", "show etherchannel summary"], ["stp", `show spanning-tree vlan ${SVI_V[vsw]}`], ["route", "show ip route"],
    ["nbr", isEigrp(vsw) ? "show ip eigrp neighbors" : "show ip ospf neighbor"],
    ...SWS.filter((s) => s !== vsw).map((s): [string, string] => [`ping ${LO[s]}`, `ping ${LO[s]}`]),
  ];
  const out = verify(vsw, vcmd, stage, x, d);

  return (
    <div className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", color: "var(--ink)", borderColor: "var(--line)", background: "var(--surface)" }}>
      <style>{THEME_CSS}</style>
      <h1 className="text-2xl font-bold sm:text-3xl">Four MLS: LACP, STP, EIGRP and OSPF</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Build the lab one layer at a time. Every step shows the commands, why they are written that way, and a control that breaks it.
      </p>

      {/* ---------- stepper ---------- */}
      <div className="mt-4 flex flex-wrap gap-1.5 text-sm" role="tablist" aria-label="Build steps">
        {STEPS.map((s, i) => (
          <button key={s.n} onClick={() => setStage(i + 1)} aria-pressed={stage === i + 1} role="tab"
            className="rounded-full border-2 px-3 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2"
            style={{ borderColor: stage === i + 1 ? "var(--c-blue)" : stage > i + 1 ? "var(--ok)" : "var(--line)", background: stage === i + 1 ? "var(--t-blue)" : stage > i + 1 ? "var(--t-ok)" : "var(--surface)", color: stage === i + 1 ? "var(--c-blue)" : "var(--ink)" }}>
            {i + 1}. {s.n}
          </button>
        ))}
        <button onClick={() => setX(fresh())} className="ml-auto rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          Undo my breakage
        </button>
      </div>

      {/* ---------- diagram ---------- */}
      <div className="mt-3 rounded-xl border p-2 sm:p-3" style={box}>
        <svg viewBox="0 0 700 400" className="block h-auto w-full" role="img" aria-label="Four switches in a square joined by four EtherChannel bundles, with EIGRP and OSPF diagonals">
          {/* VLAN path overlays */}
          {stage >= 3 && ([[d.vp14, "var(--c-blue)", 16], [d.vp23, "var(--c-orange)", 8]] as [typeof d.vp14, string, number][]).map(([p, c, w], k) => (
            <g key={k}>
              {p.edges.map((b) => { const g = geo(b); return <line key={b} x1={g.ax} y1={g.ay} x2={g.cx} y2={g.cy} stroke={p.ok ? c : "var(--err)"} strokeWidth={w} strokeOpacity={p.ok ? 0.35 : 0.5} strokeDasharray={p.ok ? undefined : "4 4"} strokeLinecap="round" />; })}
            </g>
          ))}
          {/* L3 diagonals */}
          {stage >= 6 && ([[1, 4, d.a14.ok, "var(--c-blue)", 258, 150, 442, 250], [2, 3, d.a23.ok, "var(--c-orange)", 442, 150, 258, 250]] as [SwId, SwId, boolean, string, number, number, number, number][]).map(([a, c, ok, col, lx, ly, sx, sy]) => {
            const up = stage >= 7 ? d.nbr[a] : ok;
            const [ax, ay] = POS[a], [cx, cy] = POS[c];
            const sgn = (cx - ax) > 0 ? 1 : -1;
            return (
              <g key={a}>
                <line x1={ax + sgn * 55} y1={ay + 35} x2={cx - sgn * 55} y2={cy - 35} stroke={up ? col : "var(--err)"} strokeWidth={stage >= 7 ? 3.5 : 2} strokeDasharray={up && stage >= 7 ? undefined : "7 6"} strokeLinecap="round" />
                <rect x={lx - 54} y={ly - 11} width={108} height={22} rx={11} fill="var(--surface)" stroke={up ? col : "var(--err)"} strokeWidth={1.5} />
                <text x={lx} y={ly + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={up ? col : "var(--err)"}>
                  {stage >= 7 ? `${a === 1 ? `EIGRP AS ${x.as4 === 1 ? 1 : "1/" + x.as4}` : `OSPF area ${x.area3 === 0 ? 0 : "0/" + x.area3}`} ${up ? "up" : "down"}` : `VLAN ${SVI_V[a]} ping ${ok ? "ok" : "fails"}`}
                </text>
                <text x={sx} y={sy + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--faint)">{SVI_IP[a].replace(/\d+$/, "0")}/24</text>
              </g>
            );
          })}
          {/* bundles / links */}
          {BIDS.map((b) => {
            const g = geo(b), blk = d.blocked(b), formed = d.formed[b];
            const tr = trunkOn(b);
            const lineSt = (i: number) => (formed ? (blk === null ? "fwd" : "blk") : i === 0 && blk === null ? "fwd" : "blk");
            const dir = g.horiz ? "h" : "v";
            return (
              <g key={b}>
                {g.L.map((l, i) => {
                  const st = lineSt(i);
                  return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeLinecap="round" strokeWidth={st === "fwd" ? 4 : 3}
                    stroke={st === "blk" ? "var(--c-amber)" : tr ? "var(--ok)" : "var(--link)"} strokeDasharray={st === "blk" ? "8 6" : undefined} style={{ transition: "stroke .3s" }} />;
                })}
                {formed && (
                  <g>
                    <ellipse cx={g.M[0]} cy={g.M[1]} rx={dir === "h" ? 14 : 24} ry={dir === "h" ? 24 : 14} fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeDasharray="5 4" />
                    <text x={g.M[0] + (dir === "h" ? 0 : g.ax < 350 ? -32 : 32)} y={g.M[1] + (dir === "h" ? (g.ay < 200 ? -32 : 40) : 4)} textAnchor={dir === "h" ? "middle" : g.ax < 350 ? "end" : "start"} fontSize={11} fontWeight={700} fill="var(--ink)">Po{b} · LACP</text>
                  </g>
                )}
                {stage >= 2 && ([0, 1] as const).map((e) => {
                  const p = e === 0 ? g.A : g.B, sw = ENDS[b][e], r = d.role[b][sw], mp = modePos(g, e);
                  return (
                    <g key={e}>
                      <circle cx={p[0]} cy={p[1]} r={9} fill={r === "A" ? "var(--err-bg)" : "var(--surface)"} stroke={r === "A" ? "var(--err)" : "var(--line-strong)"} strokeWidth={1.5} />
                      <text x={p[0]} y={p[1] + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill={r === "A" ? "var(--err)" : "var(--ink)"}>{r}</text>
                      <text x={mp.x} y={mp.y} textAnchor={mp.a} fontSize={9.5} fontWeight={700} fill={formed ? "var(--muted)" : "var(--err)"}>{x.modes[b][e]}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {/* switches */}
          {SWS.map((s) => {
            const [cx, cy] = POS[s];
            const up = stage >= 6 && d.sviUp(s);
            return (
              <g key={s}>
                <rect x={cx - 60} y={cy - 32} width={120} height={64} rx={10} fill="var(--panel)" stroke={stage >= 5 && d.root === s ? "var(--ok)" : "var(--line-strong)"} strokeWidth={stage >= 5 && d.root === s ? 2.5 : 1.5} />
                <text x={cx} y={cy - 15} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">SW{s}</text>
                {stage >= 5 && <text x={cx} y={cy - 2} textAnchor="middle" fontSize={9.5} fill="var(--muted)">priority {d.prio(s)}</text>}
                {stage >= 6 && <text x={cx} y={cy + 11} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={up ? dom(s) : "var(--err)"}>Vlan{SVI_V[s]} {SVI_IP[s]}{up ? "" : " (down)"}</text>}
                {stage >= 7 && <text x={cx} y={cy + 24} textAnchor="middle" fontSize={9.5} fill="var(--muted)">Lo1 {LO[s]}</text>}
                {stage >= 2 && d.root === s && (
                  <g>
                    <rect x={cx - 22} y={cy + (cy < 200 ? -52 : 38)} width={44} height={16} rx={8} fill="var(--t-ok)" stroke="var(--ok)" />
                    <text x={cx} y={cy + (cy < 200 ? -40.5 : 49.5)} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ok)">root</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px]" style={{ color: "var(--muted)" }}>
          <span><b>R</b> root port</span><span><b>D</b> designated</span><span><b style={{ color: "var(--err)" }}>A</b> alternate (blocked)</span>
          <span style={{ color: "var(--c-blue)" }}>blue: VLAN 14 / EIGRP</span><span style={{ color: "var(--c-orange)" }}>orange: VLAN 23 / OSPF</span>
        </div>
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 px-1">
            {chips.map((c) => (
              <span key={c.l} className="rounded-lg border px-2 py-1 text-[11px] font-semibold"
                style={{ borderColor: c.ok === null ? "var(--line-strong)" : c.ok ? "var(--ok)" : "var(--err)", background: c.ok === null ? "var(--panel)" : c.ok ? "var(--t-ok)" : "var(--err-bg)" }}>
                {c.l}: <span className="font-normal">{c.t}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ---------- step card ---------- */}
      <h2 className={h2}>Step {stage}: {step.t}</h2>
      <p className="mt-1 text-sm font-medium">{step.goal}</p>

      {stage === 1 && (
        <div className="mt-3 overflow-x-auto rounded-xl border" style={box}>
          <table className="w-full text-left text-xs" style={{ fontFamily: MONO }}>
            <thead style={{ background: "var(--head)" }}><tr><th className="p-2">Bundle</th><th className="p-2">Cable 1</th><th className="p-2">Cable 2</th></tr></thead>
            <tbody>
              {BIDS.map((b) => (
                <tr key={b} className="border-t" style={box}>
                  <td className="p-2 font-bold">Po{b}</td>
                  {[0, 1].map((k) => <td key={k} className="p-2">SW{ENDS[b][0]} {PORTS[b][0][k]} to SW{ENDS[b][1]} {PORTS[b][1][k]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stage >= 2 && stage <= 7 && (
        <>
          <div className="mt-3 flex gap-2">
            {SWS.map((s) => (
              <button key={s} onClick={() => setTab(s)} aria-pressed={tab === s} className="rounded-lg border-2 px-4 py-1.5 text-sm font-bold focus:outline-none focus-visible:ring-2"
                style={{ ...btn(tab === s), color: tab === s ? "var(--c-blue)" : "var(--ink)" }}>SW{s}</button>
            ))}
          </div>
          <pre className="mt-2 max-h-72 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed sm:text-xs" style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: MONO }}>
            <span style={{ color: "#7fe6d0" }}>SW{tab}# configure terminal{"\n"}</span>
            {cmds(stage, tab).map((l, i) => (
              <span key={i} className="ml-line block" style={{ color: l.startsWith("!") ? "#7b8aa0" : l.startsWith(" ") ? "#f5c26b" : "#ffffff" }}>{l}</span>
            ))}
          </pre>
        </>
      )}

      <h3 className="mt-4 text-sm font-bold">Why it is written this way</h3>
      <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm" style={{ color: "var(--muted)" }}>
        {step.why.map((w) => <li key={w}>{w.split("`").map((p, i) => (i % 2 ? <code key={i} className="rounded px-1 text-xs" style={{ background: "var(--head)", color: "var(--ink)", fontFamily: MONO }}>{p}</code> : p))}</li>)}
      </ul>

      {/* ---------- try it ---------- */}
      {stage > 1 && stage < 8 && (
        <div className="mt-4 rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
          <div className="text-sm font-semibold">Try breaking it</div>
          <p className="text-xs" style={{ color: "var(--faint)" }}>{step.wrong}</p>

          {stage === 2 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {BIDS.map((b) => (
                <div key={b} className="flex flex-wrap items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-semibold"
                  style={{ borderColor: d.formed[b] ? "var(--ok)" : "var(--err)", background: d.formed[b] ? "var(--t-ok)" : "var(--err-bg)" }}>
                  <span>Po{b}</span>
                  {([0, 1] as const).map((e) => (
                    <label key={e} className="flex items-center gap-1">SW{ENDS[b][e]}
                      <select value={x.modes[b][e]} onChange={(ev) => upd((n) => { n.modes[b][e] = ev.target.value as Md; })} className="rounded border px-1 py-0.5" style={sel} aria-label={`Po${b} SW${ENDS[b][e]} mode`}>
                        {(["active", "passive", "on"] as Md[]).map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </label>
                  ))}
                  <span className="ml-auto" style={{ color: d.formed[b] ? "var(--ok)" : "var(--err)" }}>{d.formed[b] ? "bundle forms" : "no bundle"}</span>
                </div>
              ))}
            </div>
          )}

          {stage === 3 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {BIDS.map((b) => (
                <button key={b} onClick={() => upd((n) => { n.trunk[b] = !n.trunk[b]; })} aria-pressed={x.trunk[b]} className="rounded-lg border-2 px-3 py-1.5 text-xs font-bold"
                  style={{ borderColor: x.trunk[b] ? "var(--ok)" : "var(--err)", background: x.trunk[b] ? "var(--t-ok)" : "var(--err-bg)", color: x.trunk[b] ? "var(--ok)" : "var(--err)" }}>
                  Po{b}: {x.trunk[b] ? "trunk" : "access"}
                </button>
              ))}
            </div>
          )}

          {stage === 4 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {SWS.map((s) => (
                <div key={s} className="rounded-lg border p-2 text-center text-xs font-bold" style={box}>
                  SW{s}
                  <div className="mt-1 flex justify-center gap-1">
                    {([14, 23] as const).map((v) => (
                      <button key={v} onClick={() => upd((n) => { n.vlan[s][v] = !n.vlan[s][v]; })} aria-pressed={x.vlan[s][v]} className="rounded border-2 px-1.5 py-0.5"
                        style={{ borderColor: x.vlan[s][v] ? "var(--ok)" : "var(--err)", background: x.vlan[s][v] ? "var(--t-ok)" : "var(--err-bg)", color: x.vlan[s][v] ? "var(--ok)" : "var(--err)" }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {stage === 5 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              {SWS.map((s) => (
                <label key={s} className="flex items-center gap-1">SW{s}
                  <select value={x.prio[s]} onChange={(ev) => upd((n) => { n.prio[s] = +ev.target.value; })} className="rounded border px-1 py-0.5" style={sel} aria-label={`SW${s} priority`}>
                    {[4096, 8192, 16384, 32768].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
              ))}
              <button onClick={() => upd((n) => { n.prio = { 1: 32768, 2: 32768, 3: 32768, 4: 32768 }; })} className="rounded-lg border px-2 py-1" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}>All default</button>
              <button onClick={() => upd((n) => { n.prio = { ...LAB_PRIO }; })} className="rounded-lg border px-2 py-1" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}>Lab values</button>
            </div>
          )}

          {stage === 6 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {SWS.map((s) => (
                <div key={s} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold" style={box}>
                  SW{s}
                  <button onClick={() => upd((n) => { n.routing[s] = !n.routing[s]; })} aria-pressed={x.routing[s]} className="rounded border-2 px-2 py-0.5"
                    style={{ borderColor: x.routing[s] ? "var(--ok)" : "var(--err)", background: x.routing[s] ? "var(--t-ok)" : "var(--err-bg)" }}>ip routing {x.routing[s] ? "on" : "off"}</button>
                  <button onClick={() => upd((n) => { n.sviUp[s] = !n.sviUp[s]; })} aria-pressed={x.sviUp[s]} className="rounded border-2 px-2 py-0.5"
                    style={{ borderColor: x.sviUp[s] ? "var(--ok)" : "var(--err)", background: x.sviUp[s] ? "var(--t-ok)" : "var(--err-bg)" }}>Vlan{SVI_V[s]} {x.sviUp[s] ? "no shut" : "shut"}</button>
                </div>
              ))}
            </div>
          )}

          {stage === 7 && (
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-1">SW4 EIGRP AS
                <select value={x.as4} onChange={(ev) => upd((n) => { n.as4 = +ev.target.value; })} className="rounded border px-1 py-0.5" style={sel}>{[1, 2].map((v) => <option key={v}>{v}</option>)}</select>
              </label>
              <label className="flex items-center gap-1">SW3 OSPF area
                <select value={x.area3} onChange={(ev) => upd((n) => { n.area3 = +ev.target.value; })} className="rounded border px-1 py-0.5" style={sel}>{[0, 1].map((v) => <option key={v}>{v}</option>)}</select>
              </label>
              {[2, 3].map((s) => (
                <button key={s} onClick={() => upd((n) => { n.routing[s as SwId] = !n.routing[s as SwId]; })} className="rounded border px-2 py-0.5" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}>
                  SW{s} ip routing: {x.routing[s as SwId] ? "on" : "off"}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 rounded-lg border-2 px-3 py-2 text-sm font-medium" style={{ borderColor: mc[0], background: mc[1] }} aria-live="polite">{msg.t}</div>
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button onClick={() => setStage((s) => Math.max(1, s - 1))} disabled={stage === 1} className="rounded-lg border-2 px-4 py-1.5 text-sm font-semibold disabled:opacity-40" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}>Back</button>
        <button onClick={() => setStage((s) => Math.min(8, s + 1))} disabled={stage === 8} className="rounded-lg border-2 px-4 py-1.5 text-sm font-semibold disabled:opacity-40" style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}>Next: {STEPS[Math.min(stage, 7)].n}</button>
      </div>

      {/* ---------- verify ---------- */}
      {stage >= 2 && (
        <>
          <h2 className={h2}>Verify</h2>
          <p className="text-xs" style={{ color: "var(--faint)" }}>Output follows the current state, so it changes as you break things above (formatting simplified).</p>
          <div className="mt-2 flex gap-2">
            {SWS.map((s) => (
              <button key={s} onClick={() => setVsw(s)} aria-pressed={vsw === s} className="rounded-lg border-2 px-4 py-1.5 text-sm font-bold" style={{ ...btn(vsw === s), color: vsw === s ? "var(--c-blue)" : "var(--ink)" }}>SW{s}</button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {vcmds.map(([id, label]) => (
              <button key={id} onClick={() => setVcmd(id)} className="rounded-md border px-2 py-1 text-[11px] font-semibold sm:text-xs"
                style={{ borderColor: "var(--c-teal)", background: vcmd === id ? "var(--c-teal)" : "var(--t-teal)", color: vcmd === id ? "var(--surface)" : "var(--ink)", fontFamily: MONO }}>{label}</button>
            ))}
          </div>
          <div className="mt-2 max-h-72 min-h-[7rem] overflow-auto rounded-lg p-3 text-[11px] leading-relaxed sm:text-xs" style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: MONO }}>
            <div style={{ color: "#7fe6d0" }}>SW{vsw}# {vcmds.find((c) => c[0] === vcmd)?.[1] ?? vcmd}</div>
            {out.map((l, i) => <div key={i} style={{ whiteSpace: "pre" }}>{l || " "}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

export default MlsEigrpOspfLab;
