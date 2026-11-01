"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Inter-VLAN routing: Router on a Stick and MLS / SVI: interactive lab (CCNA)
 * Visuals only. Light/dark aware through CSS variables. Same look as TrunkConfigLab / EtherChannelLab.
 * Usage: <InterVlanRoutingLab />
 */

const THEME_CSS = `
  .sw {
    --ink:#1b2330; --muted:#445063; --faint:#5f6b7d;
    --line:#dde2ea; --line-strong:#b9c1cd; --panel:#f8f9fb; --surface:#ffffff; --head:#f1f3f7;
    --link:#8b95a5; --ok:#15803d; --t-ok:#e6f6ec;
    --c-blue:#2b5fd9; --t-blue:#eaf0fd;
    --c-orange:#c2410c; --t-orange:#fdeee5;
    --c-teal:#0f7f6c; --t-teal:#e3f4f0;
    --c-purple:#7c3aed; --t-purple:#f1ebfd;
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
      --c-purple:#b49cff; --t-purple:#271d45;
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
    --c-purple:#b49cff; --t-purple:#271d45;
    --c-amber:#facc15; --t-amber:#3a2f0a;
    --err:#ff8a8a; --err-bg:#3a1b1e;
  }
  @keyframes iv-pop  { 0% { transform: scale(.5); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
  @keyframes iv-line { from { opacity:0; transform: translateY(3px); } to { opacity:1; transform:none; } }
  @keyframes iv-flash{ 0% { opacity:0; transform: scale(.4); } 60% { opacity:1; transform: scale(1.2); } 100% { opacity:1; transform: scale(1); } }
  .iv-pop { animation: iv-pop .4s ease-out both; display:inline-flex; }
  .iv-line { animation: iv-line .25s ease-out both; }
  .iv-flash { animation: iv-flash .45s ease-out both; transform-box: fill-box; transform-origin: center; }
  @media (prefers-reduced-motion: reduce) { .iv-pop,.iv-line,.iv-flash { animation-duration: .01s; animation-iteration-count: 1; } }
`;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const VLANS = [10, 20, 30, 40];
const VC = ["blue", "teal", "orange", "purple"];
const vcol = (v: number) => `var(--c-${VC[VLANS.indexOf(v)] ?? "blue"})`;
const hy = (v: number) => 70 + VLANS.indexOf(v) * 58;
const gw = (v: number) => `192.168.${v}.100`;
const want = (v: number) => `${gw(v)} 255.255.255.0`;
const ERR = "% Invalid input detected at '^' marker.";
const SUB_ERR = "% Configuring IP routing on a LAN subinterface is only allowed if that subinterface is already configured as part of an IEEE 802.10, IEEE 802.1Q, or ISL vLAN.";

// ---------- helpers ----------
const ALL = () => { const s = new Set<number>(); for (let i = 1; i <= 4094; i++) s.add(i); return s; };
function compress(s: Set<number>): string {
  if (s.size === 0) return "none";
  const out: string[] = [];
  let i = 1;
  while (i <= 4094) {
    if (s.has(i)) { let j = i; while (j + 1 <= 4094 && s.has(j + 1)) j++; out.push(i === j ? `${i}` : `${i}-${j}`); i = j + 1; } else i++;
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
const ipOk = (s: string) => /^\d+\.\d+\.\d+\.\d+$/.test(s) && s.split(".").every((n) => +n < 256);
const prefixOf = (mask: string) => mask.split(".").reduce((n, o) => n + (+o).toString(2).replace(/0/g, "").length, 0);
const netOf = (ip: string, mask: string) => { const a = ip.split("."), m = mask.split("."); return a.map((x, i) => +x & +m[i]).join("."); };
const pad = (x: string, n: number) => x.padEnd(n);

interface Line { k: "cmd" | "out" | "err"; t: string; p?: string }

// ---------- router on a stick model ----------
interface Sub { desc: string; encap: number | null; ip: string | null; shut: boolean }
type RCtx = { k: "config" } | { k: "phys" } | { k: "sub"; v: number } | { k: "port" };
interface RLab {
  rShut: boolean; subs: Record<number, Sub>;
  trunk: "access" | "trunk"; allowed: Set<number>; swShut: boolean;
  ctx: [RCtx, RCtx]; hist: [Line[], Line[]];
}
const mkR = (): RLab => ({ rShut: true, subs: {}, trunk: "access", allowed: ALL(), swShut: false, ctx: [{ k: "config" }, { k: "config" }], hist: [[], []] });
const cloneR = (l: RLab): RLab => ({
  ...l, subs: Object.fromEntries(Object.entries(l.subs).map(([k, v]) => [k, { ...v }])), allowed: new Set(l.allowed),
  ctx: [{ ...l.ctx[0] }, { ...l.ctx[1] }], hist: [[...l.hist[0]], [...l.hist[1]]],
});
const subOk = (l: RLab, v: number) => { const s = l.subs[v]; return !!s && s.encap === v && s.ip === want(v) && !s.shut; };

// ---------- MLS / SVI model ----------
interface Svi { desc: string; ip: string | null; shut: boolean }
type SCtx = { k: "config" } | { k: "svi"; v: number } | { k: "vlan"; v: number };
interface SLab { routing: boolean; vlans: Record<number, string>; svis: Record<number, Svi>; ctx: SCtx; hist: Line[] }
const mkS = (): SLab => ({ routing: false, vlans: { 1: "default" }, svis: {}, ctx: { k: "config" }, hist: [] });
const cloneS = (l: SLab): SLab => ({ ...l, vlans: { ...l.vlans }, svis: Object.fromEntries(Object.entries(l.svis).map(([k, v]) => [k, { ...v }])), ctx: { ...l.ctx }, hist: [...l.hist] });
const sviUp = (l: SLab, v: number) => !!l.svis[v] && !l.svis[v].shut && v in l.vlans;
const sviOk = (l: SLab, v: number) => sviUp(l, v) && l.svis[v].ip === want(v);

// ---------- CLI: shared ----------
function norm(raw: string) {
  let low = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (low.startsWith("do ")) low = low.slice(3);
  low = low.replace(/^(sh|sho|show)\b/, "show").replace(/^int\b/, "interface").replace(/^desc\b/, "description").replace(/^encap\b/, "encapsulation");
  if (/^no sh(ut(down)?)?$/.test(low)) low = "no shutdown";
  if (/^shut(down)?$/.test(low)) low = "shutdown";
  return low;
}

function routeLines(rows: { net: string; mask: string; ip: string; ifn: string }[]): string[] {
  const out = ["Codes: C - connected, S - static, L - local", "Gateway of last resort is not set", ""];
  const nets = [...new Set(rows.map((r) => `${r.net}/${prefixOf(r.mask)}`))];
  nets.forEach((n) => {
    const r = rows.find((x) => `${x.net}/${prefixOf(x.mask)}` === n)!;
    out.push(`C        ${n} is directly connected, ${r.ifn}`, `L        ${r.ip}/32 is directly connected, ${r.ifn}`);
  });
  return nets.length ? out : [...out.slice(0, 2), "% No routes: no interface is up with an IP address."];
}

// ---------- CLI: router / switch ----------
const rPrompt = (l: RLab, d: 0 | 1) => {
  const c = l.ctx[d];
  return `${d === 0 ? "Router" : "Switch"}${c.k === "config" ? "(config)" : c.k === "sub" ? "(config-subif)" : "(config-if)"}#`;
};
function showR(l: RLab, d: 0 | 1, low: string): string[] | null {
  if (d === 0) {
    if (/^show ip int(erface)? br(ief)?$/.test(low)) {
      const row = (n: string, ip: string, m: string, st: string, pr: string) => `${pad(n, 23)}${pad(ip, 16)}${pad("YES", 5)}${pad(m, 7)}${pad(st, 22)}${pr}`;
      return [
        "Interface              IP-Address      OK? Method Status                Protocol",
        row("FastEthernet0/0", "unassigned", "unset", l.rShut ? "administratively down" : "up", l.rShut ? "down" : "up"),
        ...Object.keys(l.subs).map(Number).sort((a, b) => a - b).map((v) => {
          const s = l.subs[v], down = l.rShut || s.shut;
          return row(`FastEthernet0/0.${v}`, s.ip ? s.ip.split(" ")[0] : "unassigned", s.ip ? "manual" : "unset", s.shut ? "administratively down" : down ? "down" : "up", down ? "down" : "up");
        }),
      ];
    }
    if (/^show ip route$/.test(low)) {
      const rows = Object.keys(l.subs).map(Number).filter((v) => !l.rShut && !l.subs[v].shut && l.subs[v].ip)
        .map((v) => { const [ip, mask] = l.subs[v].ip!.split(" "); return { net: netOf(ip, mask), mask, ip, ifn: `FastEthernet0/0.${v}` }; });
      return routeLines(rows);
    }
    return null;
  }
  if (/^show interfaces? trunk$/.test(low)) {
    if (l.trunk !== "trunk" || l.swShut) return [];
    const act = new Set([...l.allowed].filter((v) => v === 1 || VLANS.includes(v)));
    return [
      "Port        Mode             Encapsulation  Status        Native vlan", `${pad("Fa0/5", 12)}${pad("on", 17)}${pad("802.1q", 15)}${pad("trunking", 14)}1`, "",
      "Port        Vlans allowed on trunk", `${pad("Fa0/5", 12)}${compress(l.allowed)}`, "",
      "Port        Vlans allowed and active in management domain", `${pad("Fa0/5", 12)}${compress(act)}`,
    ];
  }
  if (/^show vlan( brief)?$/.test(low)) {
    return ["VLAN Name                             Status    Ports", "---- -------------------------------- --------- -------------------------------",
      `${pad("1", 5)}${pad("default", 33)}${pad("active", 10)}${l.trunk === "trunk" ? "" : "Fa0/5"}`,
      ...VLANS.map((v) => `${pad(String(v), 5)}${pad(`VLAN${String(v).padStart(4, "0")}`, 33)}${pad("active", 10)}Fa0/${v / 10}`)];
  }
  return null;
}
function execR(lab: RLab, d: 0 | 1, raw: string): RLab {
  const c = raw.trim().replace(/\s+/g, " ");
  if (!c) return lab;
  const l = cloneR(lab);
  const h = l.hist[d];
  h.push({ k: "cmd", p: rPrompt(l, d), t: c });
  const err = (t: string) => h.push({ k: "err", t });
  const low = norm(c);
  const ctx = l.ctx[d];
  const text = c.replace(/^\S+\s+/, "");
  let m: RegExpMatchArray | null;

  if (low.startsWith("show")) { const o = showR(l, d, low); if (o === null) err(ERR); else o.forEach((t) => h.push({ k: "out", t })); return l; }
  if (low === "exit" || low === "end") { l.ctx[d] = { k: "config" }; return l; }

  if (d === 0) {
    if ((m = low.match(/^interface (?:fastethernet|fa|f) ?0\/0\.(\d+)$/))) {
      const v = +m[1];
      if (v < 1 || v > 4094) err(ERR); else { l.subs[v] ??= { desc: "", encap: null, ip: null, shut: false }; l.ctx[0] = { k: "sub", v }; }
    } else if (/^interface (?:fastethernet|fa|f) ?0\/0$/.test(low)) l.ctx[0] = { k: "phys" };
    else if ((m = low.match(/^no interface (?:fastethernet|fa|f) ?0\/0\.(\d+)$/))) delete l.subs[+m[1]];
    else if (ctx.k === "phys") {
      if (low === "no shutdown") l.rShut = false; else if (low === "shutdown") l.rShut = true;
      else if (/^description .+/.test(low)) { /* label only */ } else err(ERR);
    } else if (ctx.k === "sub") {
      const s = l.subs[ctx.v];
      if (/^description .+/.test(low)) s.desc = text;
      else if (low === "no shutdown") s.shut = false;
      else if (low === "shutdown") s.shut = true;
      else if ((m = low.match(/^encapsulation dot1q (\d+)(?: native)?$/))) { const v = +m[1]; if (v < 1 || v > 4094) err(ERR); else s.encap = v; }
      else if ((m = low.match(/^ip address (\S+) (\S+)$/))) {
        if (s.encap === null) err(SUB_ERR);
        else if (!ipOk(m[1]) || !ipOk(m[2])) err(ERR);
        else s.ip = `${m[1]} ${m[2]}`;
      } else if (low === "no ip address") s.ip = null;
      else err(ERR);
    } else err(ERR);
    return l;
  }
  // switch
  if (/^interface (?:fastethernet|fa|f) ?0\/5$/.test(low)) l.ctx[1] = { k: "port" };
  else if (/^interface /.test(low)) err("% Only Fa0/5 (the port facing the router) is configurable in this lab.");
  else if (ctx.k === "port") {
    if (low === "switchport mode trunk") l.trunk = "trunk";
    else if (low === "switchport mode access") l.trunk = "access";
    else if (low === "no shutdown") l.swShut = false;
    else if (low === "shutdown") l.swShut = true;
    else if (/^switchport trunk (encapsulation dot1q|native vlan \d+)$/.test(low)) { /* accepted */ }
    else if ((m = low.match(/^switchport trunk allowed vlan (.+)$/))) {
      const arg = m[1].trim();
      let r: RegExpMatchArray | null;
      if (arg === "none") l.allowed = new Set();
      else if (arg === "all") l.allowed = ALL();
      else if ((r = arg.match(/^add (.+)$/))) { const sp = parseSpec(r[1]); if (!sp) err(ERR); else sp.forEach((v) => l.allowed.add(v)); }
      else if ((r = arg.match(/^remove (.+)$/))) { const sp = parseSpec(r[1]); if (!sp) err(ERR); else sp.forEach((v) => l.allowed.delete(v)); }
      else { const sp = parseSpec(arg); if (!sp) err(ERR); else l.allowed = sp; }
    } else err(ERR);
  } else err(ERR);
  return l;
}

// ---------- CLI: MLS ----------
const sPrompt = (l: SLab) => `MLS${l.ctx.k === "config" ? "(config)" : l.ctx.k === "vlan" ? "(config-vlan)" : "(config-if)"}#`;
function showS(l: SLab, low: string): string[] | null {
  if (/^show ip int(erface)? br(ief)?$/.test(low)) {
    const row = (n: string, ip: string, m: string, st: string, pr: string) => `${pad(n, 23)}${pad(ip, 16)}${pad("YES", 5)}${pad(m, 7)}${pad(st, 22)}${pr}`;
    return ["Interface              IP-Address      OK? Method Status                Protocol",
      ...Object.keys(l.svis).map(Number).sort((a, b) => a - b).map((v) => {
        const s = l.svis[v], up = sviUp(l, v);
        return row(`Vlan${v}`, s.ip ? s.ip.split(" ")[0] : "unassigned", s.ip ? "manual" : "unset", s.shut ? "administratively down" : up ? "up" : "down", up ? "up" : "down");
      })];
  }
  if (/^show ip route$/.test(low)) {
    if (!l.routing) return ["Default gateway is not set", "", "Host               Gateway           Last Use    Total Uses  Interface", "ICMP redirect cache is empty", "! ip routing is disabled, so there is no routing table."];
    const rows = Object.keys(l.svis).map(Number).filter((v) => sviUp(l, v) && l.svis[v].ip)
      .map((v) => { const [ip, mask] = l.svis[v].ip!.split(" "); return { net: netOf(ip, mask), mask, ip, ifn: `Vlan${v}` }; });
    return routeLines(rows);
  }
  if (/^show vlan( brief)?$/.test(low)) {
    return ["VLAN Name                             Status    Ports", "---- -------------------------------- --------- -------------------------------",
      ...Object.keys(l.vlans).map(Number).sort((a, b) => a - b).map((v) => `${pad(String(v), 5)}${pad(l.vlans[v], 33)}${pad("active", 10)}${v === 1 ? "" : `Fa0/${v / 10}`}`)];
  }
  return null;
}
function execS(lab: SLab, raw: string): SLab {
  const c = raw.trim().replace(/\s+/g, " ");
  if (!c) return lab;
  const l = cloneS(lab);
  l.hist.push({ k: "cmd", p: sPrompt(l), t: c });
  const err = (t: string) => l.hist.push({ k: "err", t });
  const low = norm(c);
  const text = c.replace(/^\S+\s+/, "");
  let m: RegExpMatchArray | null;
  if (low.startsWith("show")) { const o = showS(l, low); if (o === null) err(ERR); else o.forEach((t) => l.hist.push({ k: "out", t })); return l; }
  if (low === "exit" || low === "end") { l.ctx = { k: "config" }; return l; }
  if (low === "ip routing") { l.routing = true; return l; }
  if (low === "no ip routing") { l.routing = false; return l; }
  if ((m = low.match(/^vlan (\d+)$/))) {
    const v = +m[1];
    if (v < 1 || v > 4094) err(ERR); else { l.vlans[v] ??= `VLAN${String(v).padStart(4, "0")}`; l.ctx = { k: "vlan", v }; }
    return l;
  }
  if ((m = low.match(/^no vlan (\d+)$/))) { if (+m[1] !== 1) delete l.vlans[+m[1]]; return l; }
  if ((m = low.match(/^interface vlan ?(\d+)$/))) {
    const v = +m[1];
    if (v < 1 || v > 4094) err(ERR); else { l.svis[v] ??= { desc: "", ip: null, shut: true }; l.ctx = { k: "svi", v }; }
    return l;
  }
  if ((m = low.match(/^no interface vlan ?(\d+)$/))) { delete l.svis[+m[1]]; return l; }
  if (l.ctx.k === "vlan") { if (/^name .+/.test(low)) l.vlans[l.ctx.v] = text; else err(ERR); return l; }
  if (l.ctx.k === "svi") {
    const s = l.svis[l.ctx.v];
    if (/^description .+/.test(low)) s.desc = text;
    else if (low === "no shutdown") s.shut = false;
    else if (low === "shutdown") s.shut = true;
    else if ((m = low.match(/^ip address (\S+) (\S+)$/))) { if (!ipOk(m[1]) || !ipOk(m[2])) err(ERR); else s.ip = `${m[1]} ${m[2]}`; }
    else if (low === "no ip address") s.ip = null;
    else err(ERR);
    return l;
  }
  err(ERR);
  return l;
}

function presetR(): [0 | 1, string][] {
  const out: [0 | 1, string][] = [[0, "interface f0/0"], [0, "no sh"], [0, "exit"]];
  VLANS.forEach((v) => out.push([0, `interface f0/0.${v}`], [0, `description GW - vlan ${v}`], [0, `encapsulation dot1q ${v}`], [0, `ip address ${want(v)}`], [0, "no sh"], [0, "exit"]));
  out.push([1, "interface f0/5"], [1, "switchport mode trunk"], [1, "switchport trunk allowed vlan 10,20,30,40"], [1, "exit"]);
  return out;
}
function presetS(): string[] {
  const out = ["ip routing"];
  VLANS.forEach((v) => out.push(`vlan ${v}`, "exit"));
  VLANS.forEach((v) => out.push(`interface vlan ${v}`, `description GW-VLAN${v}`, `ip address ${want(v)}`, "no sh", "exit"));
  return out;
}

// ---------- ping evaluation ----------
interface Ping { ok: boolean; stop: number; why: string; trace: string[] }
function pingR(l: RLab, s: number, d: number): Ping {
  const trace: string[] = [];
  const fail = (stop: number, why: string): Ping => ({ ok: false, stop, why, trace });
  if (l.swShut) return fail(1, "Switch port Fa0/5 is shut down, so nothing reaches the router.");
  if (l.trunk !== "trunk") return fail(1, "Switch port Fa0/5 is an access port. It carries one VLAN untagged, so the router never sees the dot1q tags. Use switchport mode trunk.");
  if (!l.allowed.has(s)) return fail(1, `VLAN ${s} is not allowed on the trunk, so the frame is dropped at the switch.`);
  trace.push(`Host in VLAN ${s} sends to its gateway ${gw(s)}; the switch tags the frame dot1q ${s} on the trunk.`);
  if (l.rShut) return fail(2, "Router Fa0/0 is shut down (step 1: no sh on the physical interface).");
  const chk = (v: number, stop: number): Ping | null => {
    const x = l.subs[v];
    if (!x) return fail(stop, `There is no subinterface for VLAN ${v}. Create Fa0/0.${v}.`);
    if (x.encap === null) return fail(stop, `Fa0/0.${v} has no encapsulation dot1q ${v}, so it cannot match the tagged frames.`);
    if (x.encap !== v) return fail(stop, `Fa0/0.${v} uses encapsulation dot1q ${x.encap}, but the frames carry tag ${v}. The tags must match.`);
    if (!x.ip) return fail(stop, `Fa0/0.${v} has no IP address, so nobody answers at the gateway ${gw(v)}.`);
    if (x.ip !== want(v)) return fail(stop, `Fa0/0.${v} has ${x.ip}, but the hosts in VLAN ${v} use ${want(v)} as their gateway.`);
    if (x.shut) return fail(stop, `Fa0/0.${v} is shut down.`);
    return null;
  };
  let f = chk(s, 3); if (f) return f;
  trace.push(`Fa0/0.${s} receives the tagged frame and routes it.`);
  f = chk(d, 4); if (f) return f;
  trace.push(`The router sends it out Fa0/0.${d}, which re-tags it dot1q ${d}.`);
  if (!l.allowed.has(d)) return fail(6, `VLAN ${d} is not allowed on the trunk, so the routed frame is dropped on its way back.`);
  trace.push(`The same trunk carries it back; the switch delivers it to the host in VLAN ${d}.`);
  return { ok: true, stop: 7, why: `Ping succeeded: VLAN ${s} to VLAN ${d}. The traffic crossed the single trunk twice.`, trace };
}
function pingS(l: SLab, s: number, d: number): Ping {
  const trace: string[] = [];
  const fail = (stop: number, why: string): Ping => ({ ok: false, stop, why, trace });
  const chk = (v: number, stop: number): Ping | null => {
    if (!(v in l.vlans)) return fail(stop, `VLAN ${v} is not in the VLAN database, so the host port is inactive and the SVI cannot come up. Run vlan ${v}.`);
    const x = l.svis[v];
    if (!x) return fail(stop, `There is no SVI for VLAN ${v}. Create interface vlan ${v}.`);
    if (x.shut) return fail(stop, `interface vlan ${v} is shut down. Run no sh.`);
    if (!x.ip) return fail(stop, `interface vlan ${v} has no IP address, so nobody answers at the gateway ${gw(v)}.`);
    if (x.ip !== want(v)) return fail(stop, `interface vlan ${v} has ${x.ip}, but the hosts use ${want(v)} as their gateway.`);
    return null;
  };
  let f = chk(s, s in l.vlans ? 2 : 0); if (f) return f;
  trace.push(`Host in VLAN ${s} sends to its gateway ${gw(s)}, the Vlan${s} SVI on the switch.`);
  if (!l.routing) return fail(2, "ip routing is disabled (the default on a multilayer switch), so the switch will not route between SVIs.");
  f = chk(d, d in l.vlans ? 3 : 4); if (f) return f;
  trace.push(`The switch routes between Vlan${s} and Vlan${d} internally, with no external router.`);
  trace.push(`Vlan${d} delivers the packet to the host in VLAN ${d}.`);
  return { ok: true, stop: 5, why: `Ping succeeded: VLAN ${s} to VLAN ${d}, routed inside the multilayer switch.`, trace };
}
function waypoints(roas: boolean, s: number, d: number) {
  const ys = hy(s), yd = hy(d);
  return roas
    ? [[120, ys], [250, ys], [410, 150], [590, ys], [590, yd], [410, 150], [250, yd], [120, yd]]
    : [[120, ys], [250, ys], [590, ys], [590, yd], [250, yd], [120, yd]];
}

// ---------- component ----------
type Mode = "roas" | "svi";
export function InterVlanRoutingLab() {
  const [mode, setMode] = useState<Mode>("roas");
  const [r, setR] = useState<RLab>(mkR);
  const [s, setS] = useState<SLab>(mkS);
  const [tab, setTab] = useState<0 | 1>(0);
  const [cmd, setCmd] = useState("");
  const [src, setSrc] = useState(10);
  const [dst, setDst] = useState(20);
  const [shot, setShot] = useState<{ id: number; wp: number[][]; res: Ping; hop: number } | null>(null);
  const [flows, setFlows] = useState(3);
  const termRef = useRef<HTMLDivElement>(null);
  const roas = mode === "roas";
  const dev: 0 | 1 = roas ? tab : 0;
  const hist = roas ? r.hist[dev] : s.hist;

  useEffect(() => { const el = termRef.current; if (el) el.scrollTop = el.scrollHeight; }, [hist.length, mode, tab]);
  useEffect(() => {
    if (!shot || shot.hop >= shot.res.stop) return;
    const t = setTimeout(() => setShot((x) => (x && x.id === shot.id ? { ...x, hop: x.hop + 1 } : x)), 520);
    return () => clearTimeout(t);
  }, [shot]);

  const run = (text: string) => { if (roas) setR((l) => execR(l, dev, text)); else setS((l) => execS(l, text)); };
  const runR = (lab: RLab, steps: [0 | 1, string][]) => steps.reduce((l, [d, c]) => execR(l, d, c), lab);
  const loadExample = () => { setShot(null); if (roas) setR(runR(mkR(), presetR())); else setS(presetS().reduce((l, c) => execS(l, c), mkS())); };
  const reset = () => { setShot(null); if (roas) setR(mkR()); else setS(mkS()); };
  const switchMode = (m: Mode) => { setMode(m); setShot(null); setTab(0); };

  const send = () => {
    if (src === dst) return;
    const res = roas ? pingR(r, src, dst) : pingS(s, src, dst);
    setShot({ id: Date.now(), wp: waypoints(roas, src, dst), res, hop: 0 });
  };

  const btn = (on: boolean): CSSProperties => ({ borderColor: on ? "var(--c-blue)" : "var(--line)", background: on ? "var(--t-blue)" : "var(--surface)" });
  const h2 = "mt-8 text-lg font-semibold";
  const box = { borderColor: "var(--line)" };
  const ghost: CSSProperties = { borderColor: "var(--line-strong)", background: "var(--surface)" };

  // ----- checklist -----
  type Check = { id: string; name: string; ok: boolean; detail: string; fix: () => void };
  const setRl = (f: (l: RLab) => void) => setR((p) => { const l = cloneR(p); f(l); return l; });
  const setSl = (f: (l: SLab) => void) => setS((p) => { const l = cloneS(p); f(l); return l; });
  const checks: Check[] = roas
    ? [
        { id: "up", name: "Router Fa0/0 is up", ok: !r.rShut, detail: r.rShut ? "administratively down" : "up / up", fix: () => setRl((l) => (l.rShut = false)) },
        { id: "tr", name: "Switch port Fa0/5 is a trunk", ok: r.trunk === "trunk" && !r.swShut, detail: r.swShut ? "shutdown" : r.trunk, fix: () => setRl((l) => { l.trunk = "trunk"; l.swShut = false; }) },
        { id: "al", name: "Trunk allows VLANs 10, 20, 30, 40", ok: VLANS.every((v) => r.allowed.has(v)), detail: `allowed ${compress(r.allowed).length > 28 ? compress(r.allowed).slice(0, 27) + "…" : compress(r.allowed)}`, fix: () => setRl((l) => VLANS.forEach((v) => l.allowed.add(v))) },
        ...VLANS.map((v) => ({
          id: `v${v}`, name: `VLAN ${v} subinterface`, ok: subOk(r, v),
          detail: r.subs[v] ? `f0/0.${v}  dot1q ${r.subs[v].encap ?? "none"}  ${r.subs[v].ip ?? "no ip"}${r.subs[v].shut ? "  shut" : ""}` : "not created",
          fix: () => setRl((l) => { l.subs[v] = { desc: `GW - vlan ${v}`, encap: v, ip: want(v), shut: false }; }),
        })),
      ]
    : [
        { id: "rt", name: "ip routing is enabled", ok: s.routing, detail: s.routing ? "ip routing" : "no ip routing (default)", fix: () => setSl((l) => (l.routing = true)) },
        ...VLANS.map((v) => ({
          id: `v${v}`, name: `VLAN ${v}: database entry and SVI`, ok: sviOk(s, v),
          detail: `vlan ${v in s.vlans ? "exists" : "missing"} · ${s.svis[v] ? `Vlan${v} ${s.svis[v].shut ? "shut" : sviUp(s, v) ? "up" : "down"} ${s.svis[v].ip ?? "no ip"}` : "no SVI"}`,
          fix: () => setSl((l) => { l.vlans[v] ??= `VLAN${String(v).padStart(4, "0")}`; l.svis[v] = { desc: `GW-VLAN${v}`, ip: want(v), shut: false }; }),
        })),
      ];
  const allOk = checks.every((c) => c.ok);

  // ----- diagram helpers -----
  const hostActive = (v: number) => roas || v in s.vlans;
  const trunkLive = roas && !r.rShut && r.trunk === "trunk" && !r.swShut;
  const failAt = shot && shot.hop >= shot.res.stop && !shot.res.ok;
  const okAt = shot && shot.hop >= shot.res.stop && shot.res.ok;
  const tp = shot ? shot.wp[Math.min(shot.hop, shot.wp.length - 1)] : null;
  const msgC = shot && shot.hop >= shot.res.stop ? (shot.res.ok ? ["var(--ok)", "var(--t-ok)"] : ["var(--err)", "var(--err-bg)"]) : ["var(--line)", "var(--panel)"];
  const offered = flows * 40;

  const tabs = roas ? ["Router", "Switch"] : ["MLS"];
  const groups: [string, string[]][] = roas
    ? dev === 0
      ? [
          ["Step 1", ["interface f0/0", "no sh", "exit"]],
          ["Step 2 (v10)", ["interface f0/0.10", "description GW - vlan 10", "encapsulation dot1q 10", "ip address 192.168.10.100 255.255.255.0", "no sh", "exit"]],
          ["Step 2 (v20)", ["interface f0/0.20", "description GW - vlan 20", "encapsulation dot1q 20", "ip address 192.168.20.100 255.255.255.0", "no sh", "exit"]],
          ["Verify", ["show ip interface brief", "show ip route"]],
        ]
      : [
          ["Port", ["interface f0/5", "switchport mode trunk", "switchport mode access", "no sh", "shutdown", "exit"]],
          ["Allowed", ["switchport trunk allowed vlan 10,20,30,40", "switchport trunk allowed vlan 10,20", "switchport trunk allowed vlan add 30,40", "switchport trunk allowed vlan remove 20"]],
          ["Verify", ["show interface trunk", "show vlan"]],
        ]
    : [
        ["Step 1", ["ip routing", "no ip routing"]],
        ["Step 2", ["vlan 10", "vlan 20", "vlan 30", "vlan 40", "exit", "show vlan"]],
        ["Step 3 (v10)", ["interface vlan 10", "description GW-VLAN10", "ip address 192.168.10.100 255.255.255.0", "no sh", "exit"]],
        ["Step 3 (v20)", ["interface vlan 20", "description GW-VLAN20", "ip address 192.168.20.100 255.255.255.0", "no sh", "exit"]],
        ["Verify", ["show ip interface brief", "show ip route", "show vlan"]],
      ];
  const prompt = roas ? rPrompt(r, dev) : sPrompt(s);

  return (
    <div
      className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", color: "var(--ink)", borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <style>{THEME_CSS}</style>
      <h1 className="text-2xl font-bold sm:text-3xl">Inter-VLAN routing lab</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Hosts in different VLANs cannot talk until something routes between them. Configure it, then ping.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {([["roas", "Router on a stick"], ["svi", "MLS and SVI"]] as [Mode, string][]).map(([m, label]) => (
          <button key={m} onClick={() => switchMode(m)} aria-pressed={mode === m} className="rounded-full border-2 px-3.5 py-1.5 font-bold" style={{ ...btn(mode === m), color: mode === m ? "var(--c-blue)" : "var(--ink)" }}>
            {label}
          </button>
        ))}
        <span className="ml-auto inline-flex gap-2">
          <button onClick={loadExample} className="rounded-lg border-2 px-3 py-1.5 font-semibold" style={{ borderColor: "var(--c-teal)", background: "var(--t-teal)", color: "var(--c-teal)" }}>Load working example</button>
          <button onClick={reset} className="rounded-lg border px-3 py-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>Reset lab</button>
        </span>
      </div>

      {/* ---------- diagram ---------- */}
      <div className="mt-3 rounded-xl border p-2 sm:p-3" style={box}>
        <div className="flex flex-wrap items-center gap-2 px-1 pb-1 text-xs font-semibold" style={{ color: "var(--muted)" }}>
          {roas
            ? "All switches are L2, so an external router routes using one dot1q subinterface per VLAN."
            : "A multilayer switch routes inside itself, using one SVI per VLAN."}
        </div>
        <svg viewBox="0 0 700 300" className="block h-auto w-full" role="img" aria-label={roas ? "Four hosts, an L2 switch, a trunk and a router with subinterfaces" : "Four hosts connected to a multilayer switch with one SVI per VLAN"}>
          {/* hosts */}
          {VLANS.map((v) => {
            const on = hostActive(v);
            return (
              <g key={v}>
                <line x1={105} x2={roas ? 190 : 230} y1={hy(v)} y2={hy(v)} stroke={on ? vcol(v) : "var(--line-strong)"} strokeWidth={on ? 4 : 2.5} strokeDasharray={on ? undefined : "3 6"} strokeLinecap="round" />
                <rect x={10} y={hy(v) - 22} width={100} height={44} rx={8} fill="var(--panel)" stroke={on ? vcol(v) : "var(--line-strong)"} strokeWidth={2} />
                <text x={60} y={hy(v) - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill={on ? vcol(v) : "var(--faint)"}>VLAN {v}</text>
                <text x={60} y={hy(v) + 11} textAnchor="middle" fontSize={9.5} fill="var(--muted)">192.168.{v}.10</text>
              </g>
            );
          })}

          {roas ? (
            <g>
              {/* switch */}
              <rect x={190} y={30} width={120} height={240} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
              <text x={250} y={52} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">L2 switch</text>
              <text x={250} y={262} textAnchor="middle" fontSize={10} fill="var(--faint)">cannot route</text>
              <rect x={310} y={140} width={14} height={20} rx={4} fill="var(--ink)" />
              <text x={317} y={176} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--ink)">Fa0/5</text>
              {/* trunk */}
              <line x1={324} x2={490} y1={150} y2={150} stroke={trunkLive ? "var(--ok)" : "var(--link)"} strokeWidth={trunkLive ? 6 : 3} strokeDasharray={trunkLive ? undefined : "3 7"} strokeLinecap="round" />
              {VLANS.map((v, k) => (
                <g key={v}>
                  <rect x={346 + k * 33} y={118} width={29} height={18} rx={9} fill={trunkLive && r.allowed.has(v) ? vcol(v) : "var(--surface)"} stroke={trunkLive && r.allowed.has(v) ? vcol(v) : "var(--line-strong)"} />
                  <text x={360.5 + k * 33} y={131} textAnchor="middle" fontSize={10} fontWeight={700} fill={trunkLive && r.allowed.has(v) ? "var(--surface)" : "var(--faint)"}>{v}</text>
                </g>
              ))}
              <text x={407} y={174} textAnchor="middle" fontSize={11} fontWeight={700} fill={trunkLive ? "var(--ok)" : "var(--err)"}>
                {r.swShut ? "port shut" : r.trunk === "access" ? "access port, no tags" : r.rShut ? "router port down" : "dot1q trunk"}
              </text>
              {/* router */}
              <rect x={500} y={30} width={185} height={240} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
              <text x={592} y={52} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">Router</text>
              <rect x={490} y={140} width={14} height={20} rx={4} fill="var(--ink)" />
              <circle cx={497} cy={134} r={4.5} fill={r.rShut ? "var(--err)" : "var(--ok)"} stroke="var(--surface)" strokeWidth={1.5} />
              <text x={495} y={176} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--ink)">Fa0/0</text>
              {VLANS.map((v) => {
                const x = r.subs[v], ok = subOk(r, v);
                return (
                  <g key={v}>
                    <rect x={512} y={hy(v) - 20} width={161} height={40} rx={8} fill="var(--surface)" stroke={!x ? "var(--line-strong)" : ok ? "var(--ok)" : "var(--err)"} strokeWidth={2} strokeDasharray={x ? undefined : "4 4"} />
                    <text x={522} y={hy(v) - 4} fontSize={10.5} fontWeight={700} fill={x ? vcol(v) : "var(--faint)"}>{x ? `Fa0/0.${v} · dot1q ${x.encap ?? "?"}` : `Fa0/0.${v} not created`}</text>
                    <text x={522} y={hy(v) + 12} fontSize={10} fill="var(--muted)">{x ? (x.ip ? x.ip.split(" ")[0] : "no ip address") : "-"}</text>
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              <rect x={230} y={30} width={455} height={240} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
              <text x={310} y={52} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">Multilayer switch</text>
              <rect x={520} y={38} width={150} height={22} rx={11} fill={s.routing ? "var(--t-ok)" : "var(--err-bg)"} stroke={s.routing ? "var(--ok)" : "var(--err)"} strokeWidth={1.5} />
              <text x={595} y={53} textAnchor="middle" fontSize={11} fontWeight={700} fill={s.routing ? "var(--ok)" : "var(--err)"}>ip routing {s.routing ? "on" : "off"}</text>
              <rect x={470} y={64} width={8} height={200} rx={4} fill={s.routing ? "var(--ok)" : "var(--line-strong)"} />
              <text x={474} y={280} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--faint)">L3 core</text>
              {VLANS.map((v) => {
                const x = s.svis[v], ok = sviOk(s, v), up = sviUp(s, v);
                return (
                  <g key={v}>
                    <line x1={230} x2={470} y1={hy(v)} y2={hy(v)} stroke={hostActive(v) ? vcol(v) : "var(--line-strong)"} strokeWidth={hostActive(v) ? 3 : 2} strokeDasharray="2 6" strokeLinecap="round" />
                    <rect x={490} y={hy(v) - 20} width={185} height={40} rx={8} fill="var(--surface)" stroke={!x ? "var(--line-strong)" : ok ? "var(--ok)" : "var(--err)"} strokeWidth={2} strokeDasharray={x ? undefined : "4 4"} />
                    <text x={500} y={hy(v) - 4} fontSize={10.5} fontWeight={700} fill={x ? vcol(v) : "var(--faint)"}>{x ? `Vlan${v} · ${x.shut ? "shutdown" : up ? "up" : "down (no VLAN)"}` : `Vlan${v} not created`}</text>
                    <text x={500} y={hy(v) + 12} fontSize={10} fill="var(--muted)">{x ? (x.ip ? x.ip.split(" ")[0] : "no ip address") : v in s.vlans ? "VLAN exists" : "VLAN missing"}</text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ping token */}
          {shot && tp && (
            <g style={{ transform: `translate(${tp[0]}px,${tp[1]}px)`, transition: "transform .5s ease-in-out" }}>
              <circle r={9} fill={vcol(src)} stroke="var(--surface)" strokeWidth={2} opacity={failAt ? 0.4 : 1} />
              {failAt && <text y={-12} textAnchor="middle" fontSize={26} fontWeight={700} fill="var(--err)" className="iv-flash">×</text>}
              {okAt && <circle r={16} fill="none" stroke="var(--ok)" strokeWidth={3} />}
            </g>
          )}
        </svg>

        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 text-sm">
          <span className="font-semibold">Ping from</span>
          {VLANS.map((v) => (
            <button key={v} onClick={() => { setSrc(v); setShot(null); }} aria-pressed={src === v} className="rounded-full border-2 px-3 py-1 text-xs font-bold"
              style={{ borderColor: vcol(v), color: vcol(v), background: src === v ? `color-mix(in srgb, ${vcol(v)} 20%, var(--surface))` : "var(--surface)", boxShadow: src === v ? `0 0 0 2px ${vcol(v)}` : "none" }}>
              {v}
            </button>
          ))}
          <span className="font-semibold">to</span>
          {VLANS.map((v) => (
            <button key={v} onClick={() => { setDst(v); setShot(null); }} aria-pressed={dst === v} className="rounded-full border-2 px-3 py-1 text-xs font-bold"
              style={{ borderColor: vcol(v), color: vcol(v), background: dst === v ? `color-mix(in srgb, ${vcol(v)} 20%, var(--surface))` : "var(--surface)", boxShadow: dst === v ? `0 0 0 2px ${vcol(v)}` : "none" }}>
              {v}
            </button>
          ))}
          <button onClick={send} disabled={src === dst} className="ml-auto rounded-lg border-2 px-4 py-1.5 font-semibold disabled:opacity-50" style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}>
            Ping
          </button>
        </div>
        <div className="mx-1 mt-2 min-h-[2.5rem] rounded-lg border-2 px-3 py-2 text-sm font-medium" style={{ borderColor: msgC[0], background: msgC[1] }} aria-live="polite">
          {src === dst ? "Pick two different VLANs: a ping inside one VLAN never needs routing."
            : shot && shot.hop >= shot.res.stop ? (
              <>
                {shot.res.why}
                {shot.res.trace.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-xs font-normal" style={{ color: "var(--muted)" }}>
                    {shot.res.trace.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                )}
              </>
            ) : shot ? "…" : "Send a ping to see whether the packet is routed."}
        </div>
      </div>

      {/* ---------- terminal ---------- */}
      <h2 className={h2}>Command line</h2>
      <div className="mt-2 flex gap-2">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i as 0 | 1)} aria-pressed={dev === i} className="rounded-lg border-2 px-4 py-1.5 text-sm font-bold focus:outline-none focus-visible:ring-2"
            style={{ ...btn(dev === i), color: dev === i ? "var(--c-blue)" : "var(--ink)" }}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-1.5">
        {groups.map(([label, cmds]) => (
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
      <div ref={termRef} className="mt-3 max-h-80 min-h-[10rem] overflow-auto rounded-t-lg p-3 text-[11px] leading-relaxed sm:text-xs" style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: MONO }}>
        {hist.length === 0 && <div style={{ color: "#7b8aa0" }}>Click a command above, or type one below.</div>}
        {hist.map((l, i) => (
          <div key={i} className="iv-line" style={{ whiteSpace: "pre", color: l.k === "err" ? "#ff8a8a" : l.k === "out" ? "#d7e0ee" : "#ffffff" }}>
            {l.k === "cmd" && <span style={{ color: "#7fe6d0" }}>{l.p} </span>}
            {l.t || " "}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-b-lg px-3 py-2 text-xs sm:text-sm" style={{ background: "#0e141b", borderTop: "1px solid #25303f", fontFamily: MONO }}>
        <span style={{ color: "#7fe6d0" }}>{prompt}</span>
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { run(cmd); setCmd(""); } }}
          spellCheck={false} autoCapitalize="off" aria-label="Type a command" placeholder="type a command and press Enter" className="min-w-0 flex-1 bg-transparent outline-none" style={{ color: "#f5c26b" }} />
      </div>

      {/* ---------- checklist ---------- */}
      <h2 className={h2}>Troubleshooting checklist</h2>
      <div className="mt-2 rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
        {roas && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Break something</span>
            <button onClick={() => setRl((l) => (l.rShut = !l.rShut))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>{r.rShut ? "Router port: shut" : "Shut router port"}</button>
            <button onClick={() => setRl((l) => (l.trunk = l.trunk === "trunk" ? "access" : "trunk"))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>Switch port: {r.trunk}</button>
            <button onClick={() => setRl((l) => { if (l.subs[20]) l.subs[20].encap = 30; })} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>Wrong tag on f0/0.20</button>
          </div>
        )}
        {!roas && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Break something</span>
            <button onClick={() => setSl((l) => (l.routing = !l.routing))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>ip routing: {s.routing ? "on" : "off"}</button>
            <button onClick={() => setSl((l) => { delete l.vlans[20]; })} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>Delete VLAN 20</button>
            <button onClick={() => setSl((l) => { if (l.svis[30]) l.svis[30].shut = true; })} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={ghost}>Shut Vlan30</button>
          </div>
        )}
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border-2 px-3 py-2"
              style={{ borderColor: c.ok ? "var(--ok)" : "var(--err)", background: c.ok ? "var(--t-ok)" : "var(--err-bg)", transition: "background .3s, border-color .3s" }}>
              <span key={`${c.id}-${c.ok}`} className="iv-pop h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: c.ok ? "var(--ok)" : "var(--err)", color: "var(--surface)" }} aria-label={c.ok ? "OK" : "Problem"}>
                {c.ok ? "✓" : "×"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="truncate text-xs" style={{ color: "var(--muted)", fontFamily: MONO }}>{c.detail}</div>
              </div>
              {!c.ok && <button onClick={c.fix} className="rounded-lg border-2 px-3 py-1 text-xs font-bold" style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}>Fix</button>}
            </li>
          ))}
        </ul>
        <div className="mt-2 text-sm font-semibold" style={{ color: allOk ? "var(--ok)" : "var(--faint)" }}>
          {allOk ? "Everything is in place. Every VLAN's gateway is 192.168.<vlan>.100." : "Fix the red items, then ping again."}
        </div>
      </div>

      {/* ---------- comparison ---------- */}
      <h2 className={h2}>Router on a stick vs SVI</h2>
      <div className="mt-2 grid items-stretch gap-3 md:grid-cols-2">
        <div className="flex h-full flex-col rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
          <div className="text-sm font-semibold">Inter-VLAN traffic through each design</div>
          <p className="mt-1 text-xs" style={{ color: "var(--faint)" }}>Each flow offers 40 Mb/s. The router's trunk is 100 Mb/s.</p>
          {[
            { id: "roas", label: "Router on a stick", cap: 100, note: "every routed flow shares one trunk link" },
            { id: "svi", label: "MLS and SVI", cap: 240, note: "routed inside the switch, no shared uplink" },
          ].map((x) => {
            const got = Math.min(offered, x.cap), lost = offered > x.cap;
            return (
              <div key={x.id} className="mt-3">
                <div className="mb-1 flex justify-between text-xs font-bold" style={{ color: lost ? "var(--err)" : "var(--c-blue)" }}>
                  <span>{x.label}</span><span>{got} / {offered} Mb/s</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded" style={{ background: "var(--head)" }}>
                  <div className="h-4" style={{ width: `${(got / 240) * 100}%`, background: lost ? "var(--err)" : "var(--c-blue)", transition: "width .2s" }} />
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: "var(--faint)" }}>{lost ? "Bottleneck: " : ""}{x.note}</div>
              </div>
            );
          })}
          <label className="mt-auto flex items-center gap-3 pt-3 text-xs font-semibold">
            Flows
            <input type="range" min={1} max={6} value={flows} onChange={(e) => setFlows(+e.target.value)} className="flex-1" aria-label="Number of inter-VLAN flows" />
            <span style={{ fontFamily: MONO }}>{flows}</span>
          </label>
        </div>
        <div className="flex h-full flex-col rounded-xl border p-3 text-xs sm:p-4" style={{ ...box, background: "var(--panel)" }}>
          <div className="text-sm font-semibold">When to use which</div>
          {[
            ["Router on a stick", ["External router, one trunk link (a possible bottleneck)", "Switch side is a trunk with the VLANs allowed", "One dot1q subinterface per VLAN, its IP is the gateway", "For L2 switches that cannot route", "Alternative: one access port per VLAN, each to its own router interface (uses more ports)"]],
            ["SVI", ["Routing happens inside the multilayer switch", "No extra router and no switchport wasted", "Run ip routing, create the VLAN first, then the SVI", "SVI IP is the gateway; the CPU handles it", "Preferred in modern networks"]],
          ].map(([t, items], i) => (
            <div key={t as string} className="mt-2 rounded-lg border-2 p-2" style={{ borderColor: (i === 0) === roas ? "var(--c-blue)" : "var(--line)", background: (i === 0) === roas ? "var(--t-blue)" : "var(--surface)" }}>
              <div className="font-bold">{t as string}</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4" style={{ color: "var(--muted)" }}>
                {(items as string[]).map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InterVlanRoutingLab;