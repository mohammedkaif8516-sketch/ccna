"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * EtherChannel fundamentals, formation conditions, configuration & verification: interactive lab (CCNA)
 * Visuals only. Light/dark aware through CSS variables. Same look as TrunkConfigLab.
 * Usage: <EtherChannelLab />
 */

const THEME_CSS = `
  .sw {
    --ink:#1b2330; --muted:#445063; --faint:#5f6b7d;
    --line:#dde2ea; --line-strong:#b9c1cd; --panel:#f8f9fb; --surface:#ffffff; --head:#f1f3f7;
    --link:#8b95a5; --ok:#15803d; --t-ok:#e6f6ec;
    --c-blue:#2b5fd9; --t-blue:#eaf0fd; --on-blue:#ffffff;
    --c-orange:#c2410c; --t-orange:#fdeee5;
    --c-teal:#0f7f6c; --t-teal:#e3f4f0;
    --c-purple:#7c3aed; --t-purple:#f1ebfd;
    --c-pink:#be185d; --t-pink:#fce7f3;
    --c-amber:#a16207; --t-amber:#fef3c7;
    --c-red:#e11d48;
    --err:#b91c1c; --err-bg:#fde8e8;
    color:var(--ink);
  }
  @media (prefers-color-scheme: dark) {
    :root:not(.light):not([data-theme="light"]) .sw {
      --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
      --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
      --link:#6b7686; --ok:#4ade80; --t-ok:#12301f;
      --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
      --c-orange:#ff935f; --t-orange:#3a2116;
      --c-teal:#3fd0b5; --t-teal:#10302b;
      --c-purple:#b49cff; --t-purple:#271d45;
      --c-pink:#f472b6; --t-pink:#3b1a2c;
      --c-amber:#facc15; --t-amber:#3a2f0a;
      --c-red:#fb7185;
      --err:#ff8a8a; --err-bg:#3a1b1e;
    }
  }
  :root.dark .sw, .dark .sw, [data-theme="dark"] .sw {
    --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
    --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
    --link:#6b7686; --ok:#4ade80; --t-ok:#12301f;
    --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
    --c-orange:#ff935f; --t-orange:#3a2116;
    --c-teal:#3fd0b5; --t-teal:#10302b;
    --c-purple:#b49cff; --t-purple:#271d45;
    --c-pink:#f472b6; --t-pink:#3b1a2c;
    --c-amber:#facc15; --t-amber:#3a2f0a;
    --c-red:#fb7185;
    --err:#ff8a8a; --err-bg:#3a1b1e;
  }

  @keyframes ec-r    { from { transform: translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } to { transform: translateX(336px); opacity:0; } }
  @keyframes ec-l    { from { transform: translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } to { transform: translateX(-336px); opacity:0; } }
  @keyframes ec-pop  { 0% { transform: scale(.5); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
  @keyframes ec-line { from { opacity:0; transform: translateY(3px); } to { opacity:1; transform:none; } }
  .ec-r { animation: ec-r 2.2s linear infinite; }
  .ec-l { animation: ec-l 2.2s linear infinite; }
  .ec-pop { animation: ec-pop .4s ease-out both; display:inline-flex; }
  .ec-line { animation: ec-line .25s ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    .ec-r,.ec-l,.ec-pop,.ec-line { animation-duration: .01s; animation-iteration-count: 1; }
  }
`;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// ---------- model ----------
const N = 4; // member links in the lab: Fa0/0 - Fa0/3
type Mode = "on" | "active" | "passive" | "desirable" | "auto";
type Proto = "manual" | "lacp" | "pagp";
type ChP = "none" | "lacp" | "pagp";
type Stp = "pvst" | "rapid-pvst" | "mst";
type Idx = 0 | 1;

interface Line { k: "cmd" | "out" | "err"; t: string; p?: string }
interface Port {
  desc: string; shut: boolean; group: number | null; mode: Mode | null; chp: ChP;
  speed: 10 | 100; duplex: "full" | "half"; type: "fa" | "gi";
}
interface Pc {
  desc: string; shut: boolean; mode: "trunk" | "l3"; encap: "dot1q" | "isl";
  native: number; allowed: Set<number>; ip: string | null;
}
type Ctx = { k: "config" } | { k: "if"; ports: number[] } | { k: "pc" };
interface Sw {
  name: string; ctx: Ctx; stp: Stp; pcNum: number | null; ports: Port[]; pc: Pc; hist: Line[]; log: string[];
}
interface Lab { cable: boolean[]; tick: number; sw: [Sw, Sw] }

const MODES: Mode[] = ["on", "active", "passive", "desirable", "auto"];
const protoOf = (m: Mode): Proto => (m === "on" ? "manual" : m === "active" || m === "passive" ? "lacp" : "pagp");
const protoName = (p: Proto | null) => (p === "lacp" ? "LACP" : p === "pagp" ? "PAgP" : p === "manual" ? "manual" : "-");
const modeOk = (x: Mode, y: Mode) =>
  protoOf(x) === protoOf(y) && (x === "on" ? y === "on" : !((x === "passive" || x === "auto") && (y === "passive" || y === "auto")));

const pn = (k: number) => `Fa0/${k}`;
const pf = (k: number) => `FastEthernet0/${k}`;
const ALL = () => { const s = new Set<number>(); for (let i = 1; i <= 4094; i++) s.add(i); return s; };

function compress(s: Set<number>): string {
  if (s.size === 0) return "none";
  const out: string[] = [];
  let i = 1;
  while (i <= 4094) {
    if (s.has(i)) {
      let j = i;
      while (j + 1 <= 4094 && s.has(j + 1)) j++;
      out.push(i === j ? `${i}` : `${i}-${j}`);
      i = j + 1;
    } else i++;
  }
  return out.join(",");
}
function parseSpec(spec: string): Set<number> | null {
  const set = new Set<number>();
  for (const tok of spec.split(",")) {
    const m = tok.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return null;
    const a = +m[1], b = m[2] !== undefined ? +m[2] : a;
    if (a < 1 || b > 4094 || b < a) return null;
    for (let v = a; v <= b; v++) set.add(v);
  }
  return set.size ? set : null;
}
const sameSet = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((x) => b.has(x));

const mkPort = (): Port => ({ desc: "", shut: true, group: null, mode: null, chp: "none", speed: 100, duplex: "full", type: "fa" });
const mkSw = (n: 1 | 2): Sw => ({
  name: `SW${n}`, ctx: { k: "config" }, stp: "pvst", pcNum: null,
  ports: Array.from({ length: N }, mkPort),
  pc: { desc: "", shut: false, mode: "trunk", encap: "dot1q", native: 1, allowed: ALL(), ip: null },
  hist: [], log: [],
});
const mkLab = (): Lab => ({ cable: Array(N).fill(true), tick: 0, sw: [mkSw(1), mkSw(2)] });
const cloneSw = (s: Sw): Sw => ({
  ...s,
  ctx: s.ctx.k === "if" ? { k: "if", ports: [...s.ctx.ports] } : { ...s.ctx },
  ports: s.ports.map((p) => ({ ...p })),
  pc: { ...s.pc, allowed: new Set(s.pc.allowed) },
  hist: [...s.hist], log: [...s.log],
});
const setSw = (lab: Lab, i: Idx, s: Sw): Lab => ({ ...lab, sw: i === 0 ? [s, lab.sw[1]] : [lab.sw[0], s] });
const edit = (l: Lab, i: Idx, f: (s: Sw) => void): Lab => { const s = cloneSw(l.sw[i]); f(s); return setSw(l, i, s); };
const refOf = (s: Sw) => s.ports.find((p) => p.group !== null);

// ---------- what the bundle is doing ----------
type LinkSt = "down" | "bundled" | "susp" | "stp-fwd" | "stp-blk" | "idle";
interface Derived {
  phys: boolean[]; negOk: boolean; why: string;
  flags: [string[], string[]]; why2: [string[], string[]];
  link: LinkSt[]; refK: number; bundled: number[]; pcBad: string[];
  layerBad: boolean; poUp: boolean; formed: boolean; use: number[]; bw: number; fwd: number;
}
function derive(lab: Lab): Derived {
  const [a, b] = lab.sw;
  const phys = Array.from({ length: N }, (_, k) => lab.cable[k] && !a.ports[k].shut && !b.ports[k].shut);
  const ra = refOf(a), rb = refOf(b);
  const flags: [string[], string[]] = [Array(N).fill("-"), Array(N).fill("-")];
  const why2: [string[], string[]] = [Array(N).fill(""), Array(N).fill("")];
  let why = "", negOk = false;
  if (!ra && !rb) why = "No channel-group is configured on either switch.";
  else if (!ra || !rb) why = `${!ra ? a.name : b.name} has no channel-group, so there is no partner to bundle with.`;
  else if (ra.group !== rb.group) why = `Channel-group numbers differ (${a.name} ${ra.group}, ${b.name} ${rb.group}).`;
  else if (protoOf(ra.mode!) !== protoOf(rb.mode!))
    why = `Protocol mismatch (${a.name} ${ra.mode}, ${b.name} ${rb.mode}). Both ends must use the same protocol, and "on" never negotiates.`;
  else if (!modeOk(ra.mode!, rb.mode!)) why = `Both ends are ${ra.mode}: nobody starts the negotiation.`;
  else negOk = true;

  const pcBad: string[] = [];
  let refK = -1;
  const cand: number[] = [];
  if (!negOk) {
    for (let k = 0; k < N; k++)
      ([0, 1] as Idx[]).forEach((i) => {
        if (lab.sw[i].ports[k].group !== null) { flags[i][k] = phys[k] ? "I" : "D"; why2[i][k] = phys[k] ? why : ""; }
      });
  } else {
    if (a.stp !== b.stp) pcBad.push(`STP mode differs (${a.stp} vs ${b.stp})`);
    if (a.pc.encap !== b.pc.encap) pcBad.push(`trunk encapsulation differs (${a.pc.encap} vs ${b.pc.encap})`);
    if (!sameSet(a.pc.allowed, b.pc.allowed)) pcBad.push("allowed VLANs differ");
    if (a.pc.native !== b.pc.native) pcBad.push(`native VLAN differs (${a.pc.native} vs ${b.pc.native})`);
    for (let k = 0; k < N; k++) {
      const ga = a.ports[k].group !== null, gb = b.ports[k].group !== null;
      if (!ga && !gb) continue;
      if (!phys[k]) { if (ga) flags[0][k] = "D"; if (gb) flags[1][k] = "D"; continue; }
      if (!ga || !gb) { const i = ga ? 0 : 1; flags[i][k] = "I"; why2[i][k] = "partner port has no channel-group"; continue; }
      cand.push(k);
    }
    refK = cand.length ? cand[0] : -1;
    cand.forEach((k) => {
      const pa = a.ports[k], pb = b.ports[k], r = a.ports[refK];
      const rs = [...pcBad];
      if (pa.type !== r.type || pb.type !== r.type) rs.push("interface type differs from the first member");
      if (pa.speed !== r.speed || pb.speed !== r.speed || pa.duplex !== r.duplex || pb.duplex !== r.duplex)
        rs.push(`speed/duplex differs (${pb.speed}Mb/s ${pb.duplex} vs ${r.speed}Mb/s ${r.duplex})`);
      const f = rs.length ? "s" : "P";
      flags[0][k] = f; flags[1][k] = f; why2[0][k] = rs.join("; "); why2[1][k] = rs.join("; ");
    });
  }
  const bundled = cand.filter((k) => flags[0][k] === "P");
  const formed = bundled.length > 0;
  const layerBad = a.pc.mode !== b.pc.mode;
  const poUp = formed && !a.pc.shut && !b.pc.shut;
  let fwd = -1;
  const link: LinkSt[] = Array.from({ length: N }, (_, k) => {
    if (!phys[k]) return "down";
    if (negOk) return flags[0][k] === "P" ? "bundled" : flags[0][k] === "s" ? "susp" : "idle";
    if (fwd < 0) { fwd = k; return "stp-fwd"; }
    return "stp-blk";
  });
  const use = poUp && !layerBad ? bundled : !negOk && fwd >= 0 ? [fwd] : [];
  const bw = use.reduce((n, k) => n + Math.min(a.ports[k].speed, b.ports[k].speed), 0);
  return { phys, negOk, why, flags, why2, link, refK, bundled, pcBad, layerBad, poUp, formed, use, bw, fwd };
}

// ---------- logging ----------
const stamp = (tick: number) => {
  const sec = tick * 7;
  return `*Mar  1 00:${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}.${100 + ((tick * 37) % 900)}:`;
};
function addLogs(prev: Lab, next: Lab): Lab {
  const dp = derive(prev), dn = derive(next);
  let tick = next.tick;
  const sw: [Sw, Sw] = [cloneSw(next.sw[0]), cloneSw(next.sw[1])];
  const push = (i: Idx, t: string) => { tick++; sw[i].log.push(`${stamp(tick)} ${t}`); };
  ([0, 1] as Idx[]).forEach((i) => {
    const n = next.sw[i], p = prev.sw[i];
    const pcn = n.pcNum ?? p.pcNum;
    for (let k = 0; k < N; k++) {
      if (!p.ports[k].shut && n.ports[k].shut) {
        push(i, `%LINK-5-CHANGED: Interface ${pf(k)}, changed state to administratively down`);
        push(i, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${pf(k)}, changed state to down`);
      } else if (dp.phys[k] !== dn.phys[k]) {
        const st = dn.phys[k] ? "up" : "down";
        push(i, `%LINK-3-UPDOWN: Interface ${pf(k)}, changed state to ${st}`);
        push(i, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${pf(k)}, changed state to ${st}`);
      }
      const fp = dp.flags[i][k], fn = dn.flags[i][k];
      if (pcn !== null) {
        if (fn === "P" && fp !== "P") push(i, `%EC-5-BUNDLE: Interface ${pn(k)} joined port-channel Po${pcn}`);
        else if (fp === "P" && fn !== "P") push(i, `%EC-5-UNBUNDLE: Interface ${pn(k)} left the port-channel Po${pcn}`);
        if (fn === "s" && fp !== "s")
          push(i, `%EC-5-CANNOT_BUNDLE2: ${pn(k)} is not compatible with ${pn(Math.max(dn.refK, 0))} and will be suspended (${dn.why2[i][k]})`);
        if (fn === "I" && fp !== "I" && dn.phys[k])
          push(i, `%EC-5-CANNOT_BUNDLE1: ${pn(k)} is not compatible with port-channel Po${pcn} and stays stand-alone`);
      }
    }
    if (pcn !== null && dp.poUp !== dn.poUp) {
      const st = dn.poUp ? "up" : "down";
      push(i, `%LINK-3-UPDOWN: Interface Port-channel${pcn}, changed state to ${st}`);
      push(i, `%LINEPROTO-5-UPDOWN: Line protocol on Interface Port-channel${pcn}, changed state to ${st}`);
    }
  });
  return { ...next, sw, tick };
}

// ---------- CLI ----------
const ERR = "% Invalid input detected at '^' marker.";
const promptOf = (s: Sw) =>
  `${s.name}${s.ctx.k === "config" ? "(config)" : s.ctx.k === "if" && s.ctx.ports.length > 1 ? "(config-if-range)" : "(config-if)"}#`;

function showOutput(lab: Lab, i: Idx, low: string): string[] | null {
  const s = lab.sw[i], d = derive(lab), fl = d.flags[i];
  const g = refOf(s);
  const pcn = s.pcNum;
  const stOf = (k: number) =>
    s.ports[k].shut ? { adm: "administratively down", line: "down", st: "disabled" }
    : !d.phys[k] ? { adm: "down", line: "down", st: "notconnect" }
    : fl[k] === "s" ? { adm: "up", line: "down", st: "suspended" }
    : { adm: "up", line: "up", st: "connected" };
  const poSt = d.poUp ? "up" : "down";

  if (/^show etherchannel sum(mary)?$/.test(low)) {
    const head = [
      "Flags:  D - down        P - bundled in port-channel",
      "        I - stand-alone s - suspended",
      "        H - Hot-standby (LACP only)",
      "        R - Layer3      S - Layer2",
      "        U - in use      N - not in use, no aggregation",
      "",
      `Number of channel-groups in use: ${g ? 1 : 0}`,
      `Number of aggregators:           ${g ? 1 : 0}`,
      "",
    ];
    if (!g) return head;
    const ports = s.ports.map((p, k) => (p.group !== null ? `${pn(k)}(${fl[k]})` : "")).filter(Boolean).join("  ");
    const po = `Po${g.group}(${s.pc.mode === "l3" ? "R" : "S"}${d.poUp ? "U" : "D"})`;
    return [
      ...head,
      "Group  Port-channel  Protocol    Ports",
      "------+-------------+-----------+----------------------------------------",
      `${String(g.group).padEnd(7)}${po.padEnd(14)}${protoName(protoOf(g.mode!) === "manual" ? null : protoOf(g.mode!)).padEnd(12)}${ports}`,
    ];
  }
  const det = low.match(/^show etherchannel(?: (\d+))? detail$/);
  if (det) {
    if (!g || (det[1] && +det[1] !== g.group)) return ["% Channel-group not found."];
    const members = s.ports.map((p, k) => ({ p, k })).filter((x) => x.p.group !== null);
    const out = [
      `Group state = ${s.pc.mode === "l3" ? "L3" : "L2"}`,
      `Ports: ${members.length}   Maxports = ${protoOf(g.mode!) === "lacp" ? 16 : 8}`,
      "Port-channels: 1 Max Port-channels = 16",
      `Protocol:   ${protoName(protoOf(g.mode!) === "manual" ? null : protoOf(g.mode!))}`,
      "",
    ];
    members.forEach(({ p, k }) => {
      const f = fl[k];
      out.push(`Port: ${pn(k)}`, "------------",
        `Port state    = ${f === "P" ? "Up Mstr In-Bndl" : f === "s" ? "Up Mstr Not-in-Bndl (suspended)" : f === "I" ? "Up Stand-alone" : "Down"}`,
        `Channel group = ${p.group}    Mode = ${p.mode}`,
        `Port-channel  = Po${p.group}`, "");
    });
    return out;
  }
  if (/^show ip int(erface)? br(ief)?$/.test(low)) {
    const row = (n: string, ip: string, a: string, l: string) => `${n.padEnd(23)}${ip.padEnd(16)}${"YES".padEnd(5)}${"unset".padEnd(7)}${a.padEnd(22)}${l}`;
    return [
      "Interface              IP-Address      OK? Method Status                Protocol",
      ...s.ports.map((_, k) => { const t = stOf(k); return row(pf(k), "unassigned", t.adm, t.line); }),
      ...(pcn !== null ? [row(`Port-channel${pcn}`, s.pc.ip ?? "unassigned", s.pc.shut ? "administratively down" : poSt, s.pc.shut ? "down" : poSt)] : []),
    ];
  }
  if (/^show interfaces? status$/.test(low)) {
    return [
      "Port      Name               Status       Vlan       Duplex  Speed Type",
      ...s.ports.map((p, k) => `${pn(k).padEnd(10)}${p.desc.slice(0, 18).padEnd(19)}${stOf(k).st.padEnd(13)}${(p.group !== null ? `in Po${p.group}` : "1").padEnd(11)}${(p.duplex === "full" ? "a-full" : "half").padEnd(8)}${("a-" + p.speed).padEnd(6)}10/100BaseTX`),
      ...(pcn !== null ? [`${("Po" + pcn).padEnd(10)}${s.pc.desc.slice(0, 18).padEnd(19)}${(d.poUp ? "connected" : "notconnect").padEnd(13)}${(s.pc.mode === "l3" ? "routed" : "trunk").padEnd(11)}${"a-full".padEnd(8)}${("a-" + d.bw).padEnd(6)}`] : []),
    ];
  }
  const poLines = (): string[] => pcn === null ? [] : [
    `Port-channel${pcn} is ${s.pc.shut ? "administratively down" : poSt}, line protocol is ${s.pc.shut ? "down" : poSt} (${d.poUp ? "connected" : "notconnect"})`,
    "  Hardware is EtherChannel",
    ...(s.pc.desc ? [`  Description: ${s.pc.desc}`] : []),
    ...(s.pc.ip ? [`  Internet address is ${s.pc.ip}`] : []),
    `  MTU 1500 bytes, BW ${d.bw * 1000} Kbit`,
    `  Members in this channel: ${s.ports.map((p, k) => (p.group !== null && fl[k] === "P" ? pn(k) : "")).filter(Boolean).join(" ") || "none"}`,
  ];
  const portLines = (k: number): string[] => {
    const p = s.ports[k], t = stOf(k), o = lab.sw[1 - i].ports[k];
    const bad = d.phys[k] && (p.speed !== o.speed || p.duplex !== o.duplex);
    return [
      `${pf(k)} is ${t.adm}, line protocol is ${t.line} (${t.st})`,
      `  Hardware is ${p.type === "gi" ? "Gigabit" : "Fast"} Ethernet, address is 0050.0f${i === 0 ? "11" : "22"}.000${k}`,
      ...(p.desc ? [`  Description: ${p.desc}`] : []),
      ...(p.group !== null ? [`  Member of Port-channel${p.group}`] : []),
      `  ${p.duplex === "full" ? "Full" : "Half"}-duplex, ${p.speed}Mb/s, media type is 10/100BaseTX`,
      `  ${bad ? "57 input errors, 57 CRC, 0 frame" : "0 input errors, 0 CRC, 0 frame"}, ${bad ? "23 collisions" : "0 collisions"}`,
    ];
  };
  if (low === "show interfaces") return [...poLines(), ...s.ports.flatMap((_, k) => portLines(k))];
  let m = low.match(/^show interfaces? (?:port-channel|po) ?(\d+)$/);
  if (m) return pcn !== null && +m[1] === pcn ? poLines() : ["% Port-channel not configured on this switch."];
  m = low.match(/^show interfaces? (?:fastethernet|fa|f) ?0\/(\d)$/);
  if (m) return +m[1] < N ? portLines(+m[1]) : ["% Only Fa0/0 - Fa0/3 exist in this lab."];

  m = low.match(/^show (?:run|running-config) interface (?:(?:fastethernet|fa|f) ?0\/(\d)|(?:port-channel|po) ?(\d+))$/);
  if (m) {
    let body: string[];
    if (m[1] !== undefined) {
      const k = +m[1];
      if (k >= N) return ["% Only Fa0/0 - Fa0/3 exist in this lab."];
      const p = s.ports[k];
      body = [
        `interface ${pf(k)}`,
        ...(p.desc ? [` description ${p.desc}`] : []),
        ...(p.speed !== 100 ? [` speed ${p.speed}`] : []),
        ...(p.duplex !== "full" ? [` duplex ${p.duplex}`] : []),
        ...(p.chp !== "none" ? [` channel-protocol ${p.chp}`] : []),
        ...(p.group !== null ? [` channel-group ${p.group} mode ${p.mode}`] : []),
        ...(p.shut ? [" shutdown"] : []),
      ];
    } else {
      if (pcn === null || +m[2] !== pcn) return ["% Port-channel not configured on this switch."];
      body = [
        `interface Port-channel${pcn}`,
        ...(s.pc.desc ? [` description ${s.pc.desc}`] : []),
        ...(s.pc.mode === "l3"
          ? [" no switchport", ...(s.pc.ip ? [` ip address ${s.pc.ip}`] : [])]
          : [
              ...(s.pc.encap !== "dot1q" ? [` switchport trunk encapsulation ${s.pc.encap}`] : []),
              ...(s.pc.native !== 1 ? [` switchport trunk native vlan ${s.pc.native}`] : []),
              ...(s.pc.allowed.size !== 4094 ? [` switchport trunk allowed vlan ${compress(s.pc.allowed)}`] : []),
              " switchport mode trunk",
            ]),
        ...(s.pc.shut ? [" shutdown"] : []),
      ];
    }
    return ["Building configuration...", "", `Current configuration : ${body.join("\n").length} bytes`, "!", ...body, "end"];
  }
  const lg = low.match(/^show log(?:ging)?\s*\|\s*(?:include|inc|i)\s+(.+)$/);
  if (lg) {
    const pat = lg[1].trim();
    const po = pat.match(/^(?:port-channel|po) ?(\d+)$/);
    const fa = pat.match(/^(?:fastethernet|fa|f) ?(\d+\/\d+)$/);
    return s.log.filter((l) => {
      const ll = l.toLowerCase();
      if (po) return ll.includes(`po${po[1]}`) || ll.includes(`port-channel${po[1]}`);
      if (fa) return ll.includes(`fastethernet${fa[1]}`) || ll.includes(`fa${fa[1]}`);
      return ll.includes(pat);
    });
  }
  return null;
}

function exec(lab: Lab, i: Idx, raw: string): Lab {
  const c = raw.trim().replace(/\s+/g, " ");
  if (!c) return lab;
  const s = cloneSw(lab.sw[i]);
  s.hist.push({ k: "cmd", p: promptOf(s), t: c });
  const err = (t: string) => s.hist.push({ k: "err", t });

  let low = c.toLowerCase();
  if (low.startsWith("do ")) low = low.slice(3);
  low = low.replace(/^(sh|sho|show)\b/, "show").replace(/^int\b/, "interface").replace(/^desc\b/, "description");
  if (/^no sh(ut(down)?)?$/.test(low)) low = "no shutdown";
  if (/^shut(down)?$/.test(low)) low = "shutdown";

  if (low.startsWith("show")) {
    const lines = showOutput(lab, i, low);
    if (lines === null) err(ERR); else lines.forEach((t) => s.hist.push({ k: "out", t }));
    return setSw(lab, i, s);
  }
  if (low === "exit" || low === "end") {
    s.ctx = { k: "config" };
    return setSw(lab, i, s);
  }

  let m: RegExpMatchArray | null;
  if ((m = low.match(/^interface range (?:fastethernet|fa|f) ?0\/(\d)\s?-\s?(\d)$/))) {
    const lo = +m[1], hi = +m[2];
    if (lo > hi || hi >= N) err(`% Port range out of bounds. This lab has Fa0/0-${N - 1}.`);
    else s.ctx = { k: "if", ports: Array.from({ length: hi - lo + 1 }, (_, x) => lo + x) };
    return setSw(lab, i, s);
  }
  if ((m = low.match(/^interface (?:fastethernet|fa|f) ?0\/(\d)$/))) {
    if (+m[1] < N) s.ctx = { k: "if", ports: [+m[1]] }; else err("% Only Fa0/0 - Fa0/3 exist in this lab.");
    return setSw(lab, i, s);
  }
  if ((m = low.match(/^interface (?:port-channel|po) ?(\d+)$/))) {
    const n = +m[1];
    if (s.pcNum === null || n === s.pcNum) { s.pcNum = n; s.ctx = { k: "pc" }; }
    else err(`% This lab uses one port-channel per switch (Po${s.pcNum}).`);
    return setSw(lab, i, s);
  }

  if (s.ctx.k === "config") {
    if ((m = low.match(/^spanning-tree mode (pvst|rapid-pvst|mst)$/))) s.stp = m[1] as Stp;
    else err(ERR);
    return setSw(lab, i, s);
  }

  const dtext = c.replace(/^\S+\s+/, "");
  if (s.ctx.k === "if") {
    const ks = s.ctx.ports;
    if (/^description .+/.test(low)) ks.forEach((k) => (s.ports[k].desc = dtext));
    else if (low === "no shutdown") ks.forEach((k) => (s.ports[k].shut = false));
    else if (low === "shutdown") ks.forEach((k) => (s.ports[k].shut = true));
    else if ((m = low.match(/^speed (10|100|auto)$/))) ks.forEach((k) => (s.ports[k].speed = m![1] === "10" ? 10 : 100));
    else if ((m = low.match(/^duplex (full|half|auto)$/))) ks.forEach((k) => (s.ports[k].duplex = m![1] === "half" ? "half" : "full"));
    else if (low === "no switchport") { /* member ports of an L3 bundle: accepted, nothing to model */ }
    else if ((m = low.match(/^channel-protocol (lacp|pagp)$/))) {
      const want = m[1] as ChP;
      if (ks.some((k) => s.ports[k].mode && protoOf(s.ports[k].mode!) !== want)) err("Command rejected: channel-protocol conflicts with the channel-group mode.");
      else ks.forEach((k) => (s.ports[k].chp = want));
    } else if ((m = low.match(/^channel-group (\d+) mode (on|active|passive|desirable|auto)$/))) {
      const n = +m[1], md = m[2] as Mode;
      const clash = s.ports.find((p, k) => !ks.includes(k) && p.group !== null && (p.group !== n || p.mode !== md));
      const bad = ks.find((k) => s.ports[k].chp !== "none" && (md === "on" || protoOf(md) !== s.ports[k].chp));
      if (n < 1 || n > 64) err(ERR);
      else if (bad !== undefined) err(`Command rejected: channel-protocol ${s.ports[bad].chp} conflicts with mode ${md}.`);
      else if (clash) err(`Command rejected: the other members use channel-group ${clash.group} mode ${clash.mode}. Run 'no channel-group' on all members first.`);
      else { ks.forEach((k) => { s.ports[k].group = n; s.ports[k].mode = md; }); s.pcNum = n; }
    } else if (low === "no channel-group") {
      ks.forEach((k) => { s.ports[k].group = null; s.ports[k].mode = null; });
      if (!s.ports.some((p) => p.group !== null)) s.pcNum = null;
    } else err(ERR);
    return setSw(lab, i, s);
  }

  // port-channel context
  const pc = s.pc;
  if (/^description .+/.test(low)) pc.desc = dtext;
  else if (low === "no shutdown") pc.shut = false;
  else if (low === "shutdown") pc.shut = true;
  else if (low === "no switchport") pc.mode = "l3";
  else if (low === "switchport" || low === "switchport mode trunk") pc.mode = "trunk";
  else if ((m = low.match(/^ip address (\d+\.\d+\.\d+\.\d+) (\d+\.\d+\.\d+\.\d+)$/))) {
    if (pc.mode !== "l3") err("% IP addresses may not be configured on L2 links. Use 'no switchport' first.");
    else pc.ip = `${m[1]} ${m[2]}`;
  } else if (low.startsWith("switchport trunk") && pc.mode === "l3") err("% Not a switching port.");
  else if ((m = low.match(/^switchport trunk encapsulation (isl|dot1q)$/))) pc.encap = m[1] as "isl" | "dot1q";
  else if ((m = low.match(/^switchport trunk native vlan (\d+)$/))) {
    const v = +m[1];
    if (v < 1 || v > 4094) err(ERR); else pc.native = v;
  } else if ((m = low.match(/^switchport trunk allowed vlan (.+)$/))) {
    const arg = m[1].trim();
    let r: RegExpMatchArray | null;
    if (arg === "none") pc.allowed = new Set();
    else if (arg === "all") pc.allowed = ALL();
    else if ((r = arg.match(/^add (.+)$/))) { const sp = parseSpec(r[1]); if (!sp) err(ERR); else sp.forEach((v) => pc.allowed.add(v)); }
    else if ((r = arg.match(/^remove (.+)$/))) { const sp = parseSpec(r[1]); if (!sp) err(ERR); else sp.forEach((v) => pc.allowed.delete(v)); }
    else { const sp = parseSpec(arg); if (!sp) err(ERR); else pc.allowed = sp; }
  } else err(ERR);
  return setSw(lab, i, s);
}

function runScript(lab: Lab, steps: [Idx, string][]): Lab {
  let l = lab;
  steps.forEach(([i, cmd]) => { l = addLogs(l, exec(l, i, cmd)); });
  return l;
}
function presetSteps(kind: Proto): [Idx, string][] {
  const modes: [Mode, Mode] = kind === "lacp" ? ["active", "passive"] : kind === "pagp" ? ["desirable", "auto"] : ["on", "on"];
  const side = (i: Idx): [Idx, string][] => [
    [i, "interface range f0/0-3"],
    [i, `description ${kind === "manual" ? "port channel 10" : kind === "lacp" ? "LACP_SW" + (i ? 1 : 2) : "PAgP_SW" + (i ? 1 : 2)}`],
    ...(kind === "manual" ? [] : ([[i, `channel-protocol ${kind}`]] as [Idx, string][])),
    [i, `channel-group 10 mode ${modes[i]}`], [i, "no sh"], [i, "exit"],
    [i, "interface port-channel 10"], [i, `description Trunk-switch${i ? 1 : 2}`],
    [i, "switchport trunk allowed vlan 1,10,20,30,40"], [i, "no sh"], [i, "exit"],
  ];
  return [...side(0), ...side(1)];
}

// ---------- topology ----------
const SEGS = [
  { id: "srv", label: "Server to SW1", l3: false, bundle: true, note: "L2 EtherChannel (trunk)" },
  { id: "s12", label: "SW1 to SW2 (MLS)", l3: false, bundle: true, note: "L2 EtherChannel (trunk)" },
  { id: "s2r", label: "SW2 (MLS) to Router", l3: true, bundle: true, note: "L3 EtherChannel (.10.1 / .10.2)" },
  { id: "rfw", label: "Router to Firewall", l3: true, bundle: false, note: "Single routed link (.20.1 / .20.2)" },
];
function snippet(l3: boolean, proto: Proto): string[] {
  const md = proto === "manual" ? "on" : proto === "lacp" ? "active" : "desirable";
  const dsc = proto === "manual" ? "port channel 10" : proto === "lacp" ? "LACP_peer" : "PAgP_peer";
  return [
    "! Step 1: bundle the physical ports (creates Po10)",
    "(conf)# interface range f0/0-3",
    `(conf-if)# description ${dsc}`,
    ...(l3 ? ["(conf-if)# no switchport"] : []),
    ...(proto === "manual" ? [] : [`(conf-if)# channel-protocol ${proto}`]),
    `(conf-if)# channel-group 10 mode ${md}`,
    "(conf-if)# no sh",
    "(conf-if)# exit",
    "! Step 2: configure the logical interface",
    "(conf)# interface port-channel 10",
    ...(l3
      ? ["(conf-if)# no switchport", "(conf-if)# ip address 10.0.10.1 255.255.255.0", "(conf-if)# no sh"]
      : ["(conf-if)# description Trunk-switch2", "(conf-if)# switchport trunk allowed vlan 1,10,20,30,40", "(conf-if)# no sh"]),
    "(conf-if)# exit",
  ];
}

// ---------- component ----------
export function EtherChannelLabS() {
  const [lab, setLab] = useState<Lab>(mkLab);
  const [tab, setTab] = useState<Idx>(0);
  const [cmd, setCmd] = useState("");
  const [traffic, setTraffic] = useState(true);
  const [bk, setBk] = useState(2);
  const [seg, setSeg] = useState("s12");
  const [segProto, setSegProto] = useState<Record<string, Proto>>({ srv: "lacp", s12: "lacp", s2r: "lacp", rfw: "manual" });
  const [lim, setLim] = useState<{ proto: "lacp" | "pagp"; n: number }>({ proto: "lacp", n: 10 });
  const termRef = useRef<HTMLDivElement>(null);

  const d = derive(lab);
  const [a, b] = lab.sw;
  const sw = lab.sw[tab];
  const update = (fn: (l: Lab) => Lab) => setLab((prev) => addLogs(prev, fn(prev)));
  const run = (text: string) => update((l) => exec(l, tab, text));

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sw.hist.length, tab]);

  const btn = (on: boolean, c = "var(--c-blue)", t = "var(--t-blue)"): CSSProperties => ({
    borderColor: on ? c : "var(--line)",
    background: on ? t : "var(--surface)",
  });
  const h2 = "mt-8 text-lg font-semibold";
  const box = { borderColor: "var(--line)" };
  const ghost: CSSProperties = { borderColor: "var(--line-strong)", background: "var(--surface)" };

  // ----- status text -----
  const ra = refOf(a), rb = refOf(b);
  const proto = ra ? protoOf(ra.mode!) : null;
  const pcNum = a.pcNum ?? b.pcNum;
  const blocked = d.link.filter((x) => x === "stp-blk").length;
  const statusLabel = d.formed && d.poUp ? `Po${pcNum} up (SU)` : d.formed ? `Po${pcNum} down (SD)` : d.negOk ? "All members suspended" : "No EtherChannel";
  const statusColor = d.formed && d.poUp && !d.layerBad ? "var(--ok)" : d.formed || d.negOk ? "var(--c-amber)" : "var(--err)";
  const msg = (() => {
    if (d.formed && d.layerBad) return { tone: "bad", t: "One end is a routed (L3) port-channel and the other is L2. The bundle is up, but no traffic passes." };
    if (d.formed && !d.poUp) return { tone: "warn", t: `Port-channel ${pcNum} is shut down on one switch, so the whole bundle carries nothing.` };
    if (d.formed) return { tone: "ok", t: `${d.bundled.length} link${d.bundled.length > 1 ? "s" : ""} bundled: ${d.bw} Mb/s over one logical link. STP sees a single link, so nothing is blocked. Unplug a member and traffic keeps flowing on the rest, with no STP recalculation.` };
    if (d.negOk) return { tone: "bad", t: `Every member is suspended: ${d.pcBad.join("; ") || "member settings do not match"}.` };
    if (d.fwd >= 0) return { tone: "bad", t: `${d.why} The ports stay stand-alone, so STP forwards on ${pn(d.fwd)} and blocks ${blocked} other link${blocked === 1 ? "" : "s"}: only ${d.bw} Mb/s usable.` };
    return { tone: "warn", t: d.phys.some(Boolean) ? d.why : "No link is up yet. Configure both switches, or load an example." };
  })();
  const toneC = msg.tone === "ok" ? ["var(--ok)", "var(--t-ok)"] : msg.tone === "warn" ? ["var(--c-amber)", "var(--t-amber)"] : ["var(--err)", "var(--err-bg)"];
  const whyLines = ([0, 1] as Idx[]).flatMap((i) =>
    d.flags[i].map((f, k) => (f === "s" || f === "I") && d.why2[i][k] ? `${lab.sw[i].name} ${pn(k)} (${f}): ${d.why2[i][k]}` : "")
  ).filter(Boolean);

  // ----- checklist -----
  const mem = (s: Sw) => { const g = s.ports.filter((p) => p.group !== null); return g.length ? g : s.ports; };
  const cnt = (s: Sw) => { const m = mem(s); const gi = m.filter((p) => p.type === "gi").length; return `FE×${m.length - gi}${gi ? ` GE×${gi}` : ""}`; };
  const sd = (p: Port) => `${p.speed}/${p.duplex}`;
  const allMem = [...mem(a), ...mem(b)];
  const memK = (() => { const ks = Array.from({ length: N }, (_, k) => k).filter((k) => a.ports[k].group !== null || b.ports[k].group !== null); return ks.length ? ks : Array.from({ length: N }, (_, k) => k); })();
  const sync = (l: Lab) => {
    const r = refOf(l.sw[0]);
    return r ? edit(l, 1, (s) => { l.sw[0].ports.forEach((pa, k) => { if (pa.group !== null || s.ports[k].group !== null) { s.ports[k].group = r.group; s.ports[k].mode = r.mode; s.ports[k].chp = "none"; } }); s.pcNum = r.group; }) : l;
  };
  const checks = [
    { id: "i", name: "Same type of interfaces", ok: new Set(allMem.map((p) => p.type)).size === 1, detail: `SW1 ${cnt(a)} / SW2 ${cnt(b)}`,
      fix: () => update((l) => { const t = mem(l.sw[0])[0].type; return edit(edit(l, 0, (s) => s.ports.forEach((p) => (p.type = t))), 1, (s) => s.ports.forEach((p) => (p.type = t))); }) },
    { id: "ii", name: "Same EtherChannel number", ok: !!ra && !!rb && ra.group === rb.group, detail: `SW1 ${ra?.group ?? "none"} / SW2 ${rb?.group ?? "none"}`, fix: () => update(sync) },
    { id: "iii", name: "Same type of Spanning Tree", ok: a.stp === b.stp, detail: `SW1 ${a.stp} / SW2 ${b.stp}`,
      fix: () => update((l) => edit(l, 1, (s) => (s.stp = l.sw[0].stp))) },
    { id: "iv", name: "Same speed and duplex on all members", ok: new Set(allMem.map(sd)).size === 1, detail: `SW1 ${[...new Set(mem(a).map(sd))].join(" ")} / SW2 ${[...new Set(mem(b).map(sd))].join(" ")}`,
      fix: () => update((l) => { const r = mem(l.sw[0])[0]; const f = (s: Sw) => s.ports.forEach((p) => { p.speed = r.speed; p.duplex = r.duplex; }); return edit(edit(l, 0, f), 1, f); }) },
    { id: "v", name: "Same protocol, compatible modes", ok: !!ra && !!rb && modeOk(ra.mode!, rb.mode!), detail: `SW1 ${ra?.mode ?? "none"} / SW2 ${rb?.mode ?? "none"}`, fix: () => update(sync) },
    { id: "vi", name: "Same trunk encapsulation", ok: a.pc.encap === b.pc.encap, detail: `SW1 ${a.pc.encap} / SW2 ${b.pc.encap}`,
      fix: () => update((l) => edit(l, 1, (s) => (s.pc.encap = l.sw[0].pc.encap))) },
    { id: "vii", name: "Same allowed VLANs", ok: sameSet(a.pc.allowed, b.pc.allowed), detail: `SW1 ${compress(a.pc.allowed)} / SW2 ${compress(b.pc.allowed)}`,
      fix: () => update((l) => edit(l, 1, (s) => (s.pc.allowed = new Set(l.sw[0].pc.allowed)))) },
    { id: "viii", name: "Same native VLAN", ok: a.pc.native === b.pc.native, detail: `SW1 ${a.pc.native} / SW2 ${b.pc.native}`,
      fix: () => update((l) => edit(l, 1, (s) => (s.pc.native = l.sw[0].pc.native))) },
    { id: "ix", name: "Layer 1 is up", ok: memK.every((k) => d.phys[k]), detail: `${memK.filter((k) => d.phys[k]).length} of ${memK.length} member links up`,
      fix: () => update((l) => { const f = (s: Sw) => memK.forEach((k) => (s.ports[k].shut = false)); return edit(edit({ ...l, cable: l.cable.map(() => true) }, 0, f), 1, f); }) },
  ];
  const allOk = checks.every((c) => c.ok);

  // ----- svg bits -----
  const linkY = (k: number) => 82 + k * 46;
  const stCol: Record<LinkSt, string> = { bundled: "var(--ok)", susp: "var(--c-amber)", "stp-fwd": "var(--c-blue)", "stp-blk": "var(--err)", down: "var(--link)", idle: "var(--link)" };
  const stTxt = (k: number) => ({ bundled: "bundled (P)", susp: "suspended (s)", "stp-fwd": "STP forwarding", "stp-blk": "STP blocking", down: "down (D)", idle: "not in bundle" }[d.link[k]]);
  const flows = traffic && d.use.length ? Array.from({ length: 8 }, (_, f) => ({ f, k: d.use[f % d.use.length], dir: f % 2 })) : [];

  const setModes = (ma: Mode, mb: Mode) =>
    update((l) => {
      const n = l.sw[0].pcNum ?? l.sw[1].pcNum ?? 10;
      const f = (m: Mode) => (s: Sw) => { s.ports.forEach((p) => { p.group = n; p.mode = m; p.chp = "none"; }); s.pcNum = n; };
      return edit(edit(l, 0, f(ma)), 1, f(mb));
    });

  const segObj = SEGS.find((x) => x.id === seg)!;
  const nodes = [["Server", 60], ["SW1", 205], ["SW2 (MLS)", 350], ["Router", 495], ["FW", 640]] as [string, number][];

  return (
    <div
      className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", color: "var(--ink)", borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <style>{THEME_CSS}</style>

      <h1 className="text-2xl font-bold sm:text-3xl">EtherChannel lab</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Bundle four parallel links into one logical link, then break it and see which member gets suspended.
      </p>

      {/* ---------- setup row ---------- */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {([["lacp", "Load LACP example", "blue"], ["pagp", "Load PAgP example", "teal"], ["manual", "Load manual (on)", "purple"]] as [Proto, string, string][]).map(([k, label, c]) => (
          <button key={k} onClick={() => setLab(runScript(mkLab(), presetSteps(k)))} className="rounded-lg border-2 px-3 py-1.5 font-semibold"
            style={{ borderColor: `var(--c-${c})`, background: `var(--t-${c})`, color: `var(--c-${c})` }}>
            {label}
          </button>
        ))}
        <button onClick={() => setLab(mkLab())} className="rounded-lg border px-3 py-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          Reset lab
        </button>
      </div>

      {/* ---------- diagram ---------- */}
      <div className="mt-3 rounded-xl border p-2 sm:p-3" style={box}>
        <div className="flex flex-wrap items-center gap-2 px-1 pb-1 text-sm">
          <span className="rounded-full px-3 py-0.5 text-xs font-bold" style={{ border: `2px solid ${statusColor}`, color: statusColor }}>{statusLabel}</span>
          {proto && <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{protoName(proto)}</span>}
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{d.bw} Mb/s usable</span>
          {d.layerBad && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "var(--err-bg)", color: "var(--err)" }}>L2 / L3 mismatch</span>}
          {!d.negOk && d.fwd >= 0 && blocked > 0 && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "var(--err-bg)", color: "var(--err)" }}>STP blocks {blocked}</span>}
        </div>

        <svg viewBox="0 0 700 300" className="block h-auto w-full" role="img" aria-label="Two switches joined by four parallel links that may form one port-channel">
          {lab.sw.map((s, i) => {
            const x = i === 0 ? 20 : 530;
            const g = refOf(s);
            const rows: [string, string][] = [
              ["group", g ? String(g.group) : "none"],
              ["mode", g ? g.mode! : "none"],
              ["protocol", g ? protoName(protoOf(g.mode!)) : "-"],
              ["stp", s.stp],
              ["native", String(s.pc.native)],
              ["port-ch", s.pcNum === null ? "-" : s.pc.shut ? "shutdown" : s.pc.mode === "l3" ? "routed" : "trunk"],
            ];
            return (
              <g key={s.name}>
                <rect x={x} y={20} width={150} height={260} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
                <text x={x + 75} y={44} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">{s.name}</text>
                {/* side labels: written on the far side from the ports */}
                {rows.map(([k, v], r) => (
                  <g key={`t${k}`}>
                    <text x={i === 0 ? x + 10 : x + 140} y={70 + r * 22} textAnchor={i === 0 ? "start" : "end"} fontSize={9.5} fill="var(--faint)">{k}</text>
                    <text x={i === 0 ? x + 10 : x + 140} y={82 + r * 22} textAnchor={i === 0 ? "start" : "end"} fontSize={11} fontWeight={700} fill="var(--ink)">{v}</text>
                  </g>
                ))}
              </g>
            );
          })}

          {/* port-channel bracket */}
          {d.formed && (
            <g>
              <rect x={262} y={58} width={176} height={200} rx={16} fill="none" stroke={d.poUp && !d.layerBad ? "var(--ok)" : "var(--c-amber)"} strokeWidth={2} strokeDasharray="6 5" />
              <text x={350} y={52} textAnchor="middle" fontSize={11} fontWeight={700} fill={d.poUp && !d.layerBad ? "var(--ok)" : "var(--c-amber)"}>
                Po{pcNum} · {protoName(proto)}
              </text>
            </g>
          )}

          {/* member links */}
          {Array.from({ length: N }, (_, k) => {
            const y = linkY(k), st = d.link[k], col = stCol[st];
            const live = st === "bundled" || st === "stp-fwd";
            return (
              <g key={k}>
                <line x1={182} x2={518} y1={y} y2={y} stroke={col} strokeWidth={live ? 5 : 3} strokeLinecap="round"
                  strokeDasharray={st === "susp" || st === "stp-blk" ? "9 6" : st === "down" || st === "idle" ? "3 7" : undefined}
                  style={{ transition: "stroke .4s, stroke-width .4s" }} />
                {([0, 1] as Idx[]).map((i) => (
                  <g key={i}>
                    <rect x={i === 0 ? 162 : 518} y={y - 10} width={20} height={20} rx={5} fill="var(--ink)" />
                    <text x={i === 0 ? 172 : 528} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--surface)">{d.flags[i][k]}</text>
                  </g>
                ))}
                <rect x={285} y={y - 11} width={130} height={22} rx={11} fill="var(--surface)" stroke={col} strokeWidth={1.5} />
                <text x={350} y={y + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={st === "down" || st === "idle" ? "var(--faint)" : col}>{pn(k)} · {stTxt(k)}</text>
                {st === "stp-blk" && <text x={350} y={y - 16} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--err)">× no forwarding</text>}
              </g>
            );
          })}

          {/* traffic */}
          {flows.map(({ f, k, dir }) => (
            <circle key={`${f}-${k}`} cx={dir === 0 ? 182 : 518} cy={linkY(k)} r={5} fill={dir === 0 ? "var(--c-purple)" : "var(--c-pink)"}
              className={dir === 0 ? "ec-r" : "ec-l"} style={{ animationDelay: `${(f * 0.27).toFixed(2)}s` }} />
          ))}
        </svg>

        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 text-sm">
          <span className="font-semibold">Cables</span>
          {Array.from({ length: N }, (_, k) => (
            <button key={k} onClick={() => update((l) => ({ ...l, cable: l.cable.map((c, x) => (x === k ? !c : c)) }))} aria-pressed={!lab.cable[k]}
              className="rounded-full border-2 px-3 py-1 text-xs font-bold"
              style={{ borderColor: lab.cable[k] ? "var(--line-strong)" : "var(--err)", background: lab.cable[k] ? "var(--surface)" : "var(--err-bg)", color: lab.cable[k] ? "var(--ink)" : "var(--err)" }}>
              {pn(k)} {lab.cable[k] ? "plugged" : "unplugged"}
            </button>
          ))}
          <button onClick={() => setTraffic((t) => !t)} aria-pressed={traffic} className="ml-auto rounded-lg border-2 px-4 py-1.5 font-semibold"
            style={{ borderColor: "var(--c-blue)", background: traffic ? "var(--t-blue)" : "var(--surface)", color: "var(--c-blue)" }}>
            Traffic {traffic ? "on" : "off"}
          </button>
        </div>
        <div className="mx-1 mt-2 rounded-lg border-2 px-3 py-2 text-sm font-medium" style={{ borderColor: toneC[0], background: toneC[1] }} aria-live="polite">
          {msg.t}
          {whyLines.length > 0 && (
            <div className="mt-1 text-xs font-normal" style={{ fontFamily: MONO }}>
              {whyLines.map((w) => <div key={w}>{w}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* ---------- terminal ---------- */}
      <h2 className={h2}>Command line</h2>
      <div className="mt-2 flex gap-2">
        {lab.sw.map((s, i) => (
          <button key={s.name} onClick={() => setTab(i as Idx)} aria-pressed={tab === i}
            className="rounded-lg border-2 px-4 py-1.5 text-sm font-bold focus:outline-none focus-visible:ring-2"
            style={{ ...btn(tab === i), color: tab === i ? "var(--c-blue)" : "var(--ink)" }}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-1.5">
        {([
          ["Step 1: bundle", ["interface range f0/0-3", "description port channel 10", "channel-protocol lacp", "channel-protocol pagp", "channel-group 10 mode on", "channel-group 10 mode active", "channel-group 10 mode passive", "channel-group 10 mode desirable", "channel-group 10 mode auto", "no channel-group", "no sh", "exit"]],
          ["Step 2: Po", ["interface port-channel 10", "description Trunk-switch2", "switchport trunk allowed vlan 1,10,20,30,40", "switchport trunk native vlan 10", "switchport trunk encapsulation dot1q", "no switchport", "ip address 10.0.10.1 255.255.255.0", "no sh", "exit"]],
          ["Global", ["spanning-tree mode pvst", "spanning-tree mode rapid-pvst", "spanning-tree mode mst"]],
          ["Verify", ["show etherchannel summary", "show etherchannel 10 detail", "show run interface f0/0", "show run interface port-channel 10", "show ip int br", "show int", "show interface status", "show log | include port-channel 10"]],
        ] as [string, string[]][]).map(([label, cmds]) => (
          <div key={label} className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 shrink-0 text-xs font-semibold" style={{ color: "var(--muted)" }}>{label}</span>
            {cmds.map((c) => (
              <button key={c} onClick={() => run(c)} className="rounded-md border px-2 py-1 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 sm:text-xs"
                style={{ borderColor: label === "Verify" ? "var(--c-teal)" : "var(--line-strong)", background: label === "Verify" ? "var(--t-teal)" : "var(--surface)", fontFamily: MONO }}>
                {c}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div ref={termRef} className="mt-3 max-h-80 min-h-[10rem] overflow-auto rounded-t-lg p-3 text-[11px] leading-relaxed sm:text-xs"
        style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: MONO }}>
        {sw.hist.length === 0 && <div style={{ color: "#7b8aa0" }}>Click a command above, or type one below. Pick the switch tab first.</div>}
        {sw.hist.map((l, i) => (
          <div key={i} className="ec-line" style={{ whiteSpace: "pre", color: l.k === "err" ? "#ff8a8a" : l.k === "out" ? "#d7e0ee" : "#ffffff" }}>
            {l.k === "cmd" && <span style={{ color: "#7fe6d0" }}>{l.p} </span>}
            {l.t || " "}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-b-lg px-3 py-2 text-xs sm:text-sm" style={{ background: "#0e141b", borderTop: "1px solid #25303f", fontFamily: MONO }}>
        <span style={{ color: "#7fe6d0" }}>{promptOf(sw)}</span>
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { run(cmd); setCmd(""); } }}
          spellCheck={false} autoCapitalize="off" aria-label="Type a command" placeholder="type a command and press Enter"
          className="min-w-0 flex-1 bg-transparent outline-none" style={{ color: "#f5c26b" }} />
      </div>

      {/* ---------- troubleshooting ---------- */}
      <h2 className={h2}>Formation checklist</h2>
      <div className="mt-2 rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Break SW2</span>
          {Array.from({ length: N }, (_, k) => (
            <button key={k} onClick={() => setBk(k)} aria-pressed={bk === k} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={btn(bk === k)}>{pn(k)}</button>
          ))}
          <button onClick={() => update((l) => edit(l, 1, (s) => (s.ports[bk].speed = s.ports[bk].speed === 100 ? 10 : 100)))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>
            speed: {b.ports[bk].speed}
          </button>
          <button onClick={() => update((l) => edit(l, 1, (s) => (s.ports[bk].duplex = s.ports[bk].duplex === "full" ? "half" : "full")))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>
            duplex: {b.ports[bk].duplex}
          </button>
          <button onClick={() => update((l) => edit(l, 1, (s) => (s.ports[bk].type = s.ports[bk].type === "fa" ? "gi" : "fa")))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>
            type: {b.ports[bk].type === "fa" ? "FastEthernet" : "Gigabit"}
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border-2 px-3 py-2"
              style={{ borderColor: c.ok ? "var(--ok)" : "var(--err)", background: c.ok ? "var(--t-ok)" : "var(--err-bg)", transition: "background .3s, border-color .3s" }}>
              <span key={`${c.id}-${c.ok}`} className="ec-pop h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: c.ok ? "var(--ok)" : "var(--err)", color: "var(--surface)" }} aria-label={c.ok ? "OK" : "Problem"}>
                {c.ok ? "✓" : "×"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">({c.id}) {c.name}</div>
                <div className="truncate text-xs" style={{ color: "var(--muted)", fontFamily: MONO }}>{c.detail}</div>
              </div>
              {!c.ok && (
                <button onClick={c.fix} className="rounded-lg border-2 px-3 py-1 text-xs font-bold" style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}>
                  Fix
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-2 text-sm font-semibold" style={{ color: allOk ? "var(--ok)" : "var(--faint)" }}>
          {allOk ? "All nine conditions match." : "A port that does not match the others is suspended (s) while the rest keep working."}
        </div>
      </div>

      {/* ---------- protocols ---------- */}
      <h2 className={h2}>LACP vs PAgP</h2>
      <div className="mt-2 grid items-stretch gap-3 md:grid-cols-2">
        <div className="flex h-full flex-col rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
          <div className="text-sm font-semibold">Mode combinations</div>
          <div className="mt-2 grid grid-cols-6 gap-1 text-[11px]">
            <div />
            {MODES.map((c) => <div key={c} className="px-0.5 text-center font-bold" style={{ color: "var(--muted)" }}>{c}</div>)}
            {MODES.map((r) => (
              <div key={r} className="contents">
                <div className="flex items-center font-bold" style={{ color: "var(--muted)" }}>{r}</div>
                {MODES.map((c) => {
                  const ok = modeOk(r, c);
                  const cur = ra?.mode === r && rb?.mode === c;
                  return (
                    <button key={c} onClick={() => setModes(r, c)} aria-pressed={cur} aria-label={`SW1 ${r}, SW2 ${c}: ${ok ? "EtherChannel" : "no EtherChannel"}`}
                      className="flex h-9 items-center justify-center rounded-md border-2 text-xs font-bold focus:outline-none focus-visible:ring-2"
                      style={{ borderColor: ok ? "var(--ok)" : "var(--err)", background: ok ? "var(--t-ok)" : "var(--err-bg)", color: ok ? "var(--ok)" : "var(--err)", boxShadow: cur ? "0 0 0 3px var(--c-blue)" : "none" }}>
                      {ok ? "✓" : "×"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--faint)" }}>
            Rows are SW1, columns are SW2. Click a cell to set every member port on both switches. LACP uses active/passive, PAgP uses desirable/auto, and on never negotiates.
          </p>
        </div>

        <div className="flex h-full flex-col rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">Bundle size limits</div>
            <span className="ml-auto inline-flex gap-1.5">
              {(["lacp", "pagp"] as const).map((p) => (
                <button key={p} onClick={() => setLim((x) => ({ ...x, proto: p }))} aria-pressed={lim.proto === p} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={btn(lim.proto === p)}>
                  {protoName(p)}
                </button>
              ))}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {Array.from({ length: 16 }, (_, k) => {
              const used = k < lim.n;
              const kind = !used ? "free" : k < 8 ? "active" : lim.proto === "lacp" ? "standby" : "denied";
              const cc = { free: ["var(--line)", "var(--surface)", "var(--faint)"], active: ["var(--ok)", "var(--t-ok)", "var(--ok)"], standby: ["var(--c-amber)", "var(--t-amber)", "var(--c-amber)"], denied: ["var(--err)", "var(--err-bg)", "var(--err)"] }[kind];
              return (
                <div key={k} className="flex h-9 items-center justify-center rounded-md border-2 text-[11px] font-bold" style={{ borderColor: cc[0], background: cc[1], color: cc[2] }}>
                  {used ? (kind === "active" ? "A" : kind === "standby" ? "H" : "×") : k + 1}
                </div>
              );
            })}
          </div>
          <label className="mt-3 flex items-center gap-3 text-xs font-semibold">
            Links
            <input type="range" min={1} max={16} value={lim.n} onChange={(e) => setLim((x) => ({ ...x, n: +e.target.value }))} className="flex-1" aria-label="Number of links in the bundle" />
            <span style={{ fontFamily: MONO }}>{lim.n}</span>
          </label>
          <p className="mt-2 text-xs" style={{ color: lim.proto === "pagp" && lim.n > 8 ? "var(--err)" : "var(--faint)" }}>
            {lim.proto === "lacp"
              ? `LACP (IEEE 802.3ad, open standard) holds 16 links: ${Math.min(lim.n, 8)} active, ${Math.max(lim.n - 8, 0)} hot-standby (H).`
              : lim.n > 8 ? "PAgP (Cisco only) takes at most 8 links. The extra ones are rejected." : `PAgP (Cisco only) holds 8 links and all ${lim.n} are active.`}
          </p>
        </div>
      </div>

      {/* ---------- topology ---------- */}
      <h2 className={h2}>Topology</h2>
      <div className="mt-2 rounded-xl border p-2 sm:p-3" style={box}>
        <svg viewBox="0 0 700 170" className="block h-auto w-full" role="img" aria-label="Server, SW1, SW2 multilayer switch, router and firewall connected in a row">
          {SEGS.map((sg, n) => {
            const x1 = nodes[n][1] + 45, x2 = nodes[n + 1][1] - 45, on = sg.id === seg;
            const col = sg.l3 ? "var(--c-purple)" : "var(--c-blue)";
            return (
              <g key={sg.id} onClick={() => setSeg(sg.id)} style={{ cursor: "pointer" }} role="button" tabIndex={0} aria-label={sg.label}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSeg(sg.id); }}>
                <rect x={x1 - 4} y={50} width={x2 - x1 + 8} height={70} rx={8} fill={on ? "var(--panel)" : "transparent"} stroke={on ? col : "transparent"} strokeWidth={2} />
                {(sg.bundle ? [-5, 5] : [0]).map((o) => <line key={o} x1={x1} x2={x2} y1={85 + o} y2={85 + o} stroke={col} strokeWidth={3} strokeLinecap="round" />)}
                {sg.bundle && <text x={(x1 + x2) / 2} y={68} textAnchor="middle" fontSize={10} fontWeight={700} fill={col}>{sg.l3 ? "L3 Po" : "L2 Po"}</text>}
                {sg.l3 && (
                  <>
                    <text x={x1 + 2} y={108} fontSize={10} fontWeight={700} fill="var(--ink)">{sg.id === "s2r" ? ".10.1" : ".20.1"}</text>
                    <text x={x2 - 2} y={108} textAnchor="end" fontSize={10} fontWeight={700} fill="var(--ink)">{sg.id === "s2r" ? ".10.2" : ".20.2"}</text>
                  </>
                )}
              </g>
            );
          })}
          {nodes.map(([name, x]) => (
            <g key={name}>
              <rect x={x - 45} y={55} width={90} height={60} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
              <text x={x} y={90} textAnchor="middle" fontSize={name.length > 6 ? 11 : 13} fontWeight={700} fill="var(--ink)">{name}</text>
            </g>
          ))}
          <text x={350} y={150} textAnchor="middle" fontSize={11} fill="var(--faint)">Click a link to see its configuration. Each segment may use a different protocol; both ends must match.</text>
        </svg>

        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 text-sm">
          <span className="font-semibold">{segObj.label}</span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{segObj.note}</span>
          {segObj.bundle && (
            <span className="ml-auto inline-flex gap-1.5">
              {(["lacp", "pagp", "manual"] as Proto[]).map((p) => (
                <button key={p} onClick={() => setSegProto((x) => ({ ...x, [seg]: p }))} aria-pressed={segProto[seg] === p} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={btn(segProto[seg] === p)}>
                  {protoName(p)}
                </button>
              ))}
            </span>
          )}
        </div>
        <pre className="mx-1 mt-2 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed sm:text-xs" style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: MONO }}>
          {segObj.bundle
            ? snippet(segObj.l3, segProto[seg]).join("\n") + (segProto[seg] === "manual" ? "\n! Other end: mode on" : segProto[seg] === "lacp" ? "\n! Other end: mode active or passive" : "\n! Other end: mode desirable or auto")
            : "(conf)# interface f0/0\n(conf-if)# no switchport\n(conf-if)# ip address 10.0.20.1 255.255.255.0\n(conf-if)# no sh\n! No EtherChannel on this link."}
        </pre>
      </div>
    </div>
  );
}

export default EtherChannelLabS;