import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Trunk configuration, verification, troubleshooting & DTP: interactive lab (CCNA)
 * Visuals only. Light/dark aware through CSS variables. Same look as AccessPortLab / TrunkPortLab.
 * Usage: <TrunkConfigLab />
 */

const THEME_CSS = `
  .sw {
    --ink:#1b2330; --muted:#445063; --faint:#5f6b7d;
    --line:#dde2ea; --line-strong:#b9c1cd; --panel:#f8f9fb; --surface:#ffffff; --head:#f1f3f7;
    --link:#8b95a5; --ok:#15803d; --t-ok:#e6f6ec;
    --c-blue:#2b5fd9; --t-blue:#eaf0fd; --on-blue:#ffffff;
    --c-orange:#c2410c; --t-orange:#fdeee5; --on-orange:#ffffff;
    --c-teal:#0f7f6c; --t-teal:#e3f4f0; --on-teal:#ffffff;
    --c-purple:#7c3aed; --t-purple:#f1ebfd; --on-purple:#ffffff;
    --c-pink:#be185d; --t-pink:#fce7f3; --on-pink:#ffffff;
    --c-amber:#a16207; --t-amber:#fef3c7; --on-amber:#ffffff;
    --c-gray:#5a6577; --t-gray:#eef0f4; --on-gray:#ffffff;
    --c-red:#e11d48; --t-red:#fdecef;
    --err:#b91c1c; --err-bg:#fde8e8;
    color:var(--ink);
  }
  @media (prefers-color-scheme: dark) {
    :root:not(.light):not([data-theme="light"]) .sw {
      --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
      --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
      --link:#6b7686; --ok:#4ade80; --t-ok:#12301f;
      --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
      --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
      --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
      --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
      --c-pink:#f472b6; --t-pink:#3b1a2c; --on-pink:#2a0a1b;
      --c-amber:#facc15; --t-amber:#3a2f0a; --on-amber:#241c02;
      --c-gray:#9aa6b8; --t-gray:#232b37; --on-gray:#0f1620;
      --c-red:#fb7185; --t-red:#3a1a22;
      --err:#ff8a8a; --err-bg:#3a1b1e;
    }
  }
  :root.dark .sw, .dark .sw, [data-theme="dark"] .sw {
    --ink:#e6eaf0; --muted:#b4bdcb; --faint:#98a3b5;
    --line:#2f3745; --line-strong:#465064; --panel:#1a212b; --surface:#11161d; --head:#1f2733;
    --link:#6b7686; --ok:#4ade80; --t-ok:#12301f;
    --c-blue:#7aa2ff; --t-blue:#16233f; --on-blue:#0b1220;
    --c-orange:#ff935f; --t-orange:#3a2116; --on-orange:#1c0d05;
    --c-teal:#3fd0b5; --t-teal:#10302b; --on-teal:#04201b;
    --c-purple:#b49cff; --t-purple:#271d45; --on-purple:#150b33;
    --c-pink:#f472b6; --t-pink:#3b1a2c; --on-pink:#2a0a1b;
    --c-amber:#facc15; --t-amber:#3a2f0a; --on-amber:#241c02;
    --c-gray:#9aa6b8; --t-gray:#232b37; --on-gray:#0f1620;
    --c-red:#fb7185; --t-red:#3a1a22;
    --err:#ff8a8a; --err-bg:#3a1b1e;
  }

  @keyframes tc-r    { from { transform: translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } to { transform: translateX(330px); opacity:0; } }
  @keyframes tc-l    { from { transform: translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } to { transform: translateX(-330px); opacity:0; } }
  @keyframes tc-pop  { 0% { transform: scale(.5); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
  @keyframes tc-line { from { opacity:0; transform: translateY(3px); } to { opacity:1; transform:none; } }
  @keyframes tc-flash{ 0% { opacity:0; transform: scale(.4); } 60% { opacity:1; transform: scale(1.2); } 100% { opacity:1; transform: scale(1); } }
  @keyframes tc-ping { 0% { transform: scale(1); opacity:.9; } 100% { transform: scale(2.6); opacity:0; } }
  .tc-r { animation: tc-r 2.4s linear infinite; }
  .tc-l { animation: tc-l 2.4s linear infinite; }
  .tc-pop { animation: tc-pop .4s ease-out both; display:inline-flex; }
  .tc-line { animation: tc-line .25s ease-out both; }
  .tc-flash { animation: tc-flash .45s ease-out both; transform-box: fill-box; transform-origin: center; }
  .tc-ping { animation: tc-ping .8s ease-out both; transform-box: fill-box; transform-origin: center; }
  @media (prefers-reduced-motion: reduce) {
    .tc-r,.tc-l,.tc-pop,.tc-line,.tc-flash,.tc-ping { animation-duration: .01s; animation-iteration-count: 1; }
  }
`;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// ---------- model ----------
type Mode = "trunk" | "dynamic desirable" | "dynamic auto";
type Encap = "auto" | "dot1q" | "isl";
type Gen = "old" | "new";
type Idx = 0 | 1;

interface Line { k: "cmd" | "out" | "err"; t: string; p?: string }
interface Sw {
  name: string; port: string; fname: string; short: string;
  ctx: "config" | "if";
  encap: Encap; mode: Mode; native: number; allowed: Set<number>; nonego: boolean; shut: boolean;
  speed: 10 | 100; duplex: "full" | "half";
  hist: Line[]; log: string[];
}
interface Lab { gen: Gen; cable: boolean; tick: number; sw: [Sw, Sw] }

const ALL = () => { const s = new Set<number>(); for (let i = 1; i <= 4094; i++) s.add(i); return s; };
const EXISTING = new Set([1, 10, 20, 30, 31, 32, 33, 34, 35, 40, 50]);
const VNAMES: Record<number, string> = { 1: "default", 10: "HR", 20: "IT", 30: "Marketing", 40: "Management", 50: "Sales" };

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

const mkSw = (n: 1 | 2): Sw => ({
  name: `SW${n}`, port: n === 1 ? "f0/0" : "f0/1", fname: n === 1 ? "FastEthernet0/0" : "FastEthernet0/1",
  short: n === 1 ? "Fa0/0" : "Fa0/1", ctx: "config", encap: "auto", mode: "dynamic auto", native: 1,
  allowed: ALL(), nonego: false, shut: true, speed: 100, duplex: "full", hist: [], log: [],
});
const mkLab = (gen: Gen): Lab => ({ gen, cable: true, tick: 0, sw: [mkSw(1), mkSw(2)] });
const cloneSw = (s: Sw): Sw => ({ ...s, allowed: new Set(s.allowed), hist: [...s.hist], log: [...s.log] });
const setSw = (lab: Lab, i: Idx, s: Sw): Lab => ({ ...lab, sw: i === 0 ? [s, lab.sw[1]] : [lab.sw[0], s] });

// ---------- what the link is doing ----------
interface Derived {
  phys: boolean; sd: boolean; trunk: [boolean, boolean];
  status: "down" | "access" | "trunk" | "mismatch";
  encap: "dot1q" | "isl" | null; encapBad: boolean; negotiated: boolean;
  nativeBad: boolean; allowedBad: boolean;
}
function sideTrunk(x: { mode: Mode }, y: { mode: Mode; nonego: boolean }): boolean {
  if (x.mode === "trunk") return true;
  const yInit = y.mode === "dynamic desirable" || (y.mode === "trunk" && !y.nonego);
  const yResp = y.mode !== "trunk" || !y.nonego;
  return x.mode === "dynamic desirable" ? yResp : yInit;
}
function derive(lab: Lab): Derived {
  const [a, b] = lab.sw;
  const phys = lab.cable && !a.shut && !b.shut;
  const sd = a.speed === b.speed && a.duplex === b.duplex;
  const ta = phys && sideTrunk(a, b);
  const tb = phys && sideTrunk(b, a);
  const status = !phys ? "down" : ta && tb ? "trunk" : !ta && !tb ? "access" : "mismatch";
  const eff = (x: Sw): "dot1q" | "isl" => (x.encap === "auto" ? (lab.gen === "new" ? "dot1q" : "isl") : x.encap);
  const staticBoth = a.mode === "trunk" && b.mode === "trunk";
  let encap: "dot1q" | "isl" | null = null;
  let encapBad = false;
  if (status === "trunk") {
    if (staticBoth) { encap = eff(a); encapBad = eff(a) !== eff(b); }
    else {
      const s = a.mode === "trunk" ? a : b.mode === "trunk" ? b : null;
      encap = s ? eff(s) : eff(a) === eff(b) ? eff(a) : a.encap !== "auto" ? eff(a) : eff(b);
    }
  }
  return {
    phys, sd, trunk: [ta, tb], status, encap, encapBad, negotiated: !staticBoth,
    nativeBad: status === "trunk" && a.native !== b.native,
    allowedBad: !sameSet(a.allowed, b.allowed),
  };
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
    const n = next.sw[i], p = prev.sw[i], o = next.sw[1 - i];
    if (!p.shut && n.shut && dp.phys) {
      push(i, `%LINK-5-CHANGED: Interface ${n.fname}, changed state to administratively down`);
      push(i, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n.fname}, changed state to down`);
    } else if (dp.phys !== dn.phys) {
      const s = dn.phys ? "up" : "down";
      push(i, `%LINK-3-UPDOWN: Interface ${n.fname}, changed state to ${s}`);
      push(i, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n.fname}, changed state to ${s}`);
    }
    if (dp.trunk[i] !== dn.trunk[i]) {
      push(i, dn.trunk[i]
        ? `%DTP-5-TRUNKPORTON: Port ${n.short} has become ${dn.encap ?? "dot1q"} trunk`
        : `%DTP-5-NONTRUNKPORTON: Port ${n.short} has become non-trunk`);
    }
    if (!dp.nativeBad && dn.nativeBad) {
      push(i, `%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on ${n.fname} (${n.native}), with ${o.name} ${o.fname} (${o.native}).`);
    }
  });
  return { ...next, sw, tick };
}

// ---------- CLI ----------
const ERR = "% Invalid input detected at '^' marker.";
const portNum = (s: Sw) => s.port.slice(1); // "0/0"
const encName = (e: "dot1q" | "isl") => (e === "dot1q" ? "802.1q" : "isl");

function showOutput(lab: Lab, i: Idx, low: string): string[] | null {
  const s = lab.sw[i];
  const d = derive(lab);
  const trunking = d.trunk[i];
  const state = !lab.cable || (s.shut ? false : lab.sw[1 - i].shut)
    ? { adm: s.shut ? "administratively down" : "down", line: "down", st: s.shut ? "disabled" : "notconnect" }
    : s.shut ? { adm: "administratively down", line: "down", st: "disabled" }
    : d.phys ? { adm: "up", line: "up", st: "connected" }
    : { adm: "down", line: "down", st: "notconnect" };

  if (/^show interfaces? trunk$/.test(low)) {
    if (!trunking) return [];
    const modeTxt = s.mode === "trunk" ? "on" : s.mode === "dynamic desirable" ? "desirable" : "auto";
    const enc = d.encap ?? "dot1q";
    const encTxt = (s.mode === "trunk" && lab.sw[1 - i].mode === "trunk" ? "" : "n-") + encName(enc);
    const pad = (x: string, n: number) => x.padEnd(n);
    const act = new Set([...s.allowed].filter((v) => EXISTING.has(v)));
    return [
      "Port        Mode             Encapsulation  Status        Native vlan",
      `${pad(s.short, 12)}${pad(modeTxt, 17)}${pad(encTxt, 15)}${pad("trunking", 14)}${s.native}`,
      "",
      "Port        Vlans allowed on trunk",
      `${pad(s.short, 12)}${compress(s.allowed)}`,
      "",
      "Port        Vlans allowed and active in management domain",
      `${pad(s.short, 12)}${compress(act)}`,
      "",
      "Port        Vlans in spanning tree forwarding state and not pruned",
      `${pad(s.short, 12)}${compress(act)}`,
    ];
  }
  if (/^show ip int(erface)? br(ief)?$/.test(low)) {
    return [
      "Interface              IP-Address      OK? Method Status                Protocol",
      `${s.fname.padEnd(23)}${"unassigned".padEnd(16)}${"YES".padEnd(5)}${"unset".padEnd(7)}${state.adm.padEnd(22)}${state.line}`,
    ];
  }
  if (/^show interfaces? status$/.test(low)) {
    const sp = s.speed === 100 ? "a-100" : String(s.speed);
    const du = s.duplex === "full" ? "a-full" : "half";
    return [
      "Port      Name               Status       Vlan       Duplex  Speed Type",
      `${s.short.padEnd(10)}${"".padEnd(19)}${state.st.padEnd(13)}${(trunking ? "trunk" : "1").padEnd(11)}${du.padEnd(8)}${sp.padEnd(6)}10/100BaseTX`,
    ];
  }
  if (/^show vlan( brief)?$/.test(low)) {
    const list = [1, 10, 20, 30, 40, 50];
    return [
      "VLAN Name                             Status    Ports",
      "---- -------------------------------- --------- -------------------------------",
      ...list.map((v) => `${String(v).padEnd(5)}${(VNAMES[v] ?? "").padEnd(33)}${"active".padEnd(10)}${v === 1 && !trunking ? s.short : ""}`),
    ];
  }
  const run = low.match(/^show (?:run|running-config) int(?:erface)? (?:f|fa|fastethernet) ?(\d+\/\d+)$/);
  if (run) {
    if (run[1] !== portNum(s)) return ["% Only this lab's port is configured on this switch."];
    const body = [
      "!",
      `interface ${s.fname}`,
      ...(s.encap !== "auto" ? [` switchport trunk encapsulation ${s.encap}`] : []),
      ...(s.native !== 1 ? [` switchport trunk native vlan ${s.native}`] : []),
      ...(s.allowed.size !== 4094 ? [` switchport trunk allowed vlan ${compress(s.allowed)}`] : []),
      ...(s.mode !== "dynamic auto" ? [` switchport mode ${s.mode}`] : []),
      ...(s.nonego ? [" switchport nonegotiate"] : []),
      ...(s.shut ? [" shutdown"] : []),
      "end",
    ];
    return ["Building configuration...", "", `Current configuration : ${body.join("\n").length} bytes`, ...body];
  }
  const si = low.match(/^show interfaces? (?:f|fa|fastethernet) ?(\d+\/\d+)$/);
  if (si) {
    if (si[1] !== portNum(s)) return ["% Only this lab's port is configured on this switch."];
    const bad = d.phys && !d.sd;
    return [
      `${s.fname} is ${state.adm}, line protocol is ${state.line} (${state.st})`,
      `  Hardware is Fast Ethernet, address is 0050.0f${i === 0 ? "11" : "22"}.0001`,
      "  MTU 1500 bytes, BW 100000 Kbit, DLY 100 usec,",
      "  Encapsulation ARPA, loopback not set",
      `  ${s.duplex === "full" ? "Full" : "Half"}-duplex, ${s.speed}Mb/s, media type is 10/100BaseTX`,
      `  ${bad ? "57 input errors, 57 CRC, 0 frame, 0 overrun, 0 ignored" : "0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored"}`,
      `  ${bad ? "23 collisions, 0 interface resets, 19 late collision" : "0 collisions, 0 interface resets, 0 late collision"}`,
    ];
  }
  const lg = low.match(/^show log(?:ging)?\s*\|\s*(?:include|inc|i)\s+(\S+)$/);
  if (lg) {
    const pat = lg[1];
    const alias = pat.match(/^f(?:a|astethernet)?(\d+\/\d+)$/);
    return s.log.filter((l) => {
      const ll = l.toLowerCase();
      return alias ? ll.includes(`fastethernet${alias[1]}`) || ll.includes(`fa${alias[1]}`) : ll.includes(pat.toLowerCase());
    });
  }
  return null;
}

function exec(lab: Lab, i: Idx, raw: string): Lab {
  const c = raw.trim().replace(/\s+/g, " ");
  if (!c) return lab;
  const s = cloneSw(lab.sw[i]);
  const prompt = `${s.name}${s.ctx === "if" ? "(config-if)" : "(config)"}#`;
  s.hist.push({ k: "cmd", p: prompt, t: c });
  const err = (t: string) => s.hist.push({ k: "err", t });
  const out = (ls: string[]) => ls.forEach((t) => s.hist.push({ k: "out", t }));

  let low = c.toLowerCase();
  if (low.startsWith("do ")) low = low.slice(3);
  low = low.replace(/^(sh|sho|show)\b/, "show").replace(/^int\b/, "interface");
  if (/^no sh(ut(down)?)?$/.test(low)) low = "no shutdown";
  if (/^shut(down)?$/.test(low)) low = "shutdown";

  let next: Lab;

  if (low.startsWith("show")) {
    const lines = showOutput(lab, i, low);
    next = setSw(lab, i, s);
    if (lines === null) err(ERR); else out(lines);
    return setSw(lab, i, s) && next;
  }

  if (low === "exit") {
    if (s.ctx === "if") s.ctx = "config";
    return setSw(lab, i, s);
  }

  const ifm = low.match(/^interface (?:f|fa|fastethernet) ?(\d+\/\d+)$/);
  if (ifm) {
    if (ifm[1] === portNum(s)) s.ctx = "if";
    else err(`% Interface FastEthernet${ifm[1]} is not part of this lab.`);
    return setSw(lab, i, s);
  }
  if (s.ctx !== "if") { err(ERR); return setSw(lab, i, s); }

  let m: RegExpMatchArray | null;
  if ((m = low.match(/^switchport trunk encapsulation (isl|dot1q)$/))) {
    if (lab.gen === "new") err(ERR);
    else s.encap = m[1] as Encap;
  } else if (low === "switchport mode trunk") {
    if (lab.gen === "old" && s.encap === "auto")
      err('Command rejected: An interface whose trunk encapsulation is "Auto" can not be configured to "trunk" mode.');
    else s.mode = "trunk";
  } else if ((m = low.match(/^switchport mode dynamic (desirable|auto)$/))) {
    if (s.nonego) err("Command rejected: Conflict between 'nonegotiate' and 'dynamic' status.");
    else s.mode = `dynamic ${m[1]}` as Mode;
  } else if (low === "switchport nonegotiate") {
    if (s.mode !== "trunk") err("Command rejected: Conflict between 'nonegotiate' and 'dynamic' status.");
    else s.nonego = true;
  } else if (low === "no switchport nonegotiate") {
    s.nonego = false;
  } else if ((m = low.match(/^switchport trunk native vlan (\d+)$/))) {
    const v = +m[1];
    if (v < 1 || v > 4094) err(ERR); else s.native = v;
  } else if ((m = low.match(/^switchport trunk allowed vlan (.+)$/))) {
    const arg = m[1].trim();
    let r: RegExpMatchArray | null;
    if (arg === "none") s.allowed = new Set();
    else if (arg === "all") s.allowed = ALL();
    else if ((r = arg.match(/^add (.+)$/))) {
      const sp = parseSpec(r[1]);
      if (!sp) err(ERR); else sp.forEach((v) => s.allowed.add(v));
    } else if ((r = arg.match(/^remove (.+)$/))) {
      const sp = parseSpec(r[1]);
      if (!sp) err(ERR); else sp.forEach((v) => s.allowed.delete(v));
    } else {
      const sp = parseSpec(arg);
      if (!sp) err(ERR); else s.allowed = sp;
    }
  } else if (low === "no shutdown") s.shut = false;
  else if (low === "shutdown") s.shut = true;
  else err(ERR);

  return setSw(lab, i, s);
}

function runScript(lab: Lab, steps: [Idx, string][]): Lab {
  let l = lab;
  steps.forEach(([i, cmd]) => { l = addLogs(l, exec(l, i, cmd)); });
  return l;
}
function presetSteps(kind: "dtp" | "manual", gen: Gen): [Idx, string][] {
  const enc = (i: Idx): [Idx, string][] => (gen === "old" ? [[i, "switchport trunk encapsulation dot1q"]] : []);
  if (kind === "dtp")
    return [
      [0, "interface f0/0"], ...enc(0),
      [0, "switchport trunk native vlan 10"], [0, "switchport trunk allowed vlan 10,20,30,40"],
      [0, "switchport mode dynamic desirable"], [0, "no sh"], [0, "exit"],
      [1, "interface f0/1"], [1, "switchport mode dynamic auto"], [1, "no sh"], [1, "exit"],
    ];
  return [
    [0, "interface f0/0"], ...enc(0), [0, "switchport mode trunk"], [0, "switchport trunk native vlan 10"],
    [0, "switchport trunk allowed vlan 10,20,30"], [0, "switchport nonegotiate"], [0, "no sh"], [0, "exit"],
    [1, "interface f0/1"], ...enc(1), [1, "switchport mode trunk"], [1, "switchport trunk native vlan 10"],
    [1, "switchport trunk allowed vlan 10,20,30"], [1, "switchport nonegotiate"], [1, "no sh"], [1, "exit"],
  ];
}

// ---------- lanes & test frames ----------
const LANES = [
  { lo: 10, hi: 10, label: "VLAN 10", c: "blue" },
  { lo: 20, hi: 20, label: "VLAN 20", c: "teal" },
  { lo: 30, hi: 30, label: "VLAN 30", c: "orange" },
  { lo: 31, hi: 35, label: "VLAN 31-35", c: "pink" },
  { lo: 40, hi: 40, label: "VLAN 40", c: "purple" },
  { lo: 50, hi: 50, label: "VLAN 50", c: "amber" },
];
const laneY = (k: number) => 70 + k * 30;
const laneOf = (v: number) => Math.max(0, LANES.findIndex((l) => v >= l.lo && v <= l.hi));
const colOf = (v: number) => `var(--c-${LANES[laneOf(v)].c})`;
const onOf = (v: number) => `var(--on-${LANES[laneOf(v)].c})`;
const TEST_VLANS = [10, 20, 30, 33, 40, 50];

function laneState(s: Sw, k: number): "full" | "part" | "none" {
  const l = LANES[k];
  let n = 0;
  for (let v = l.lo; v <= l.hi; v++) if (s.allowed.has(v)) n++;
  return n === 0 ? "none" : n === l.hi - l.lo + 1 ? "full" : "part";
}

interface TestRes { kind: "ok" | "leak" | "drop"; stop: "src" | "mid" | "dst" | "done"; why: string; leakTo?: number }
function evalTest(lab: Lab, d: Derived, src: Idx, v: number): TestRes {
  const s = lab.sw[src], t = lab.sw[(1 - src) as Idx];
  const drop = (stop: TestRes["stop"], why: string): TestRes => ({ kind: "drop", stop, why });
  if (!lab.cable) return drop("mid", "No link at Layer 1. Check the cable and transceiver.");
  if (s.shut) return drop("src", `${s.name}'s port is shut down.`);
  if (t.shut) return drop("mid", `${t.name}'s port is shut down, so there is no link.`);
  if (!d.sd) return drop("mid", "Speed/duplex mismatch: collisions and CRC errors, so the frame is lost.");
  if (d.status === "access") {
    return v === 1 ? { kind: "ok", stop: "done", why: "Access ports, VLAN 1." }
      : drop("src", `No trunk formed. Two access ports only carry VLAN 1, so VLAN ${v} stops here.`);
  }
  if (d.status === "mismatch") return drop("mid", "Only one side is a trunk. The other side is an access port and cannot read tagged frames.");
  if (d.encapBad) return drop("mid", "Encapsulation mismatch: the two ends tag frames differently.");
  if (d.encap === "isl" && v > 1005) return drop("src", "ISL only supports VLANs 1-1005.");
  if (!s.allowed.has(v)) return drop("src", `VLAN ${v} is not allowed on ${s.name}'s trunk.`);
  if (d.encap === "dot1q" && v === s.native) {
    if (t.native !== v) return { kind: "leak", stop: "done", leakTo: t.native, why: `VLAN ${v} is ${s.name}'s native VLAN, so it crosses untagged. ${t.name} treats untagged frames as VLAN ${t.native}: the frame leaks into the wrong VLAN.` };
    if (!t.allowed.has(v)) return drop("dst", `VLAN ${v} is not allowed on ${t.name}'s trunk.`);
    return { kind: "ok", stop: "done", why: `VLAN ${v} crossed untagged (native VLAN) and was delivered.` };
  }
  if (!t.allowed.has(v)) return drop("dst", `VLAN ${v} is not allowed on ${t.name}'s trunk.`);
  return { kind: "ok", stop: "done", why: `VLAN ${v} crossed tagged and was delivered to ${t.name}.` };
}

const DTP_MODES: { m: Mode; label: string }[] = [
  { m: "trunk", label: "Trunk" },
  { m: "dynamic desirable", label: "Dyn Desirable" },
  { m: "dynamic auto", label: "Dyn Auto" },
];

// ---------- component ----------
export function TrunkConfigLab() {
  const [lab, setLab] = useState<Lab>(() => mkLab("old"));
  const [tab, setTab] = useState<Idx>(0);
  const [cmd, setCmd] = useState("");
  const [testV, setTestV] = useState(10);
  const [dir, setDir] = useState<Idx>(0);
  const [shot, setShot] = useState<{ id: number; v: number; dir: Idx; res: TestRes; phase: 0 | 1 | 2 } | null>(null);
  const [tm, setTm] = useState({ hello: 0, hold: 0, frames: 0, alive: true, run: false, expired: false });
  const termRef = useRef<HTMLDivElement>(null);

  const d = derive(lab);
  const update = (fn: (l: Lab) => Lab) => setLab((prev) => addLogs(prev, fn(prev)));
  const run = (text: string) => update((l) => exec(l, tab, text));
  const sw = lab.sw[tab];

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sw.hist.length, tab]);

  // DTP timers (30x speed: each 100 ms tick = 3 simulated seconds)
  useEffect(() => {
    if (!tm.run) return;
    const id = setInterval(() => {
      setTm((t) => {
        if (!t.run || t.expired) return t;
        let hello = t.hello + 3, hold = t.hold + 3, frames = t.frames;
        if (hello >= 30) { hello -= 30; if (t.alive) { hold = 0; frames++; } }
        const expired = hold >= 300;
        return { ...t, hello, hold: Math.min(hold, 300), frames, expired, run: !expired };
      });
    }, 100);
    return () => clearInterval(id);
  }, [tm.run]);

  function sendTest() {
    const res = evalTest(lab, d, dir, testV);
    const id = Date.now();
    setShot({ id, v: testV, dir, res, phase: 0 });
    setTimeout(() => setShot((s) => (s && s.id === id ? { ...s, phase: 1 } : s)), 60);
    setTimeout(() => setShot((s) => (s && s.id === id ? { ...s, phase: 2 } : s)), 1700);
  }
  const clearShot = () => setShot(null);

  // token geometry (mirrored when going SW2 -> SW1)
  const tokenPos = (s: NonNullable<typeof shot>) => {
    const startX = 70;
    const endX = s.res.stop === "src" ? 140 : s.res.stop === "mid" ? 350 : s.res.stop === "dst" ? 510 : 610;
    const x = s.phase === 0 ? startX : endX;
    return s.dir === 0 ? x : 700 - x;
  };

  const btn = (on: boolean, c = "var(--c-blue)", t = "var(--t-blue)"): CSSProperties => ({
    borderColor: on ? c : "var(--line)",
    background: on ? t : "var(--surface)",
  });
  const h2 = "mt-8 text-lg font-semibold";
  const box = { borderColor: "var(--line)" };

  // DTP initiators (for animated hello frames)
  const init = lab.sw.map((x) => d.phys && (x.mode === "dynamic desirable" || (x.mode === "trunk" && !x.nonego))) as [boolean, boolean];
  const anyDyn = lab.sw.some((x) => x.mode !== "trunk");

  const [a, b] = lab.sw;
  const encapSame = (() => {
    if (a.mode === "trunk" && b.mode === "trunk") {
      const e = (x: Sw) => (x.encap === "auto" ? (lab.gen === "new" ? "dot1q" : "isl") : x.encap);
      return e(a) === e(b);
    }
    return true;
  })();
  const checks = [
    { id: "l1", name: "Layer 1: cable and transceiver", ok: lab.cable, detail: lab.cable ? "Link detected" : "No signal on the cable",
      fix: () => update((l) => ({ ...l, cable: true })) },
    { id: "sd", name: "Speed and duplex match", ok: d.sd, detail: `SW1 ${a.speed} ${a.duplex} / SW2 ${b.speed} ${b.duplex}`,
      fix: () => update((l) => setSw(l, 1, { ...cloneSw(l.sw[1]), speed: l.sw[0].speed, duplex: l.sw[0].duplex })) },
    { id: "al", name: "Same allowed VLANs", ok: !d.allowedBad, detail: `SW1 ${compress(a.allowed)} / SW2 ${compress(b.allowed)}`,
      fix: () => update((l) => setSw(l, 1, { ...cloneSw(l.sw[1]), allowed: new Set(l.sw[0].allowed) })) },
    { id: "nv", name: "Same native VLAN", ok: a.native === b.native, detail: `SW1 ${a.native} / SW2 ${b.native}`,
      fix: () => update((l) => setSw(l, 1, { ...cloneSw(l.sw[1]), native: l.sw[0].native })) },
    { id: "en", name: "Same encapsulation", ok: encapSame, detail: `SW1 ${a.encap === "auto" ? "auto" : a.encap} / SW2 ${b.encap === "auto" ? "auto" : b.encap}`,
      fix: () => update((l) => setSw(l, 1, { ...cloneSw(l.sw[1]), encap: l.sw[0].encap })) },
  ];
  const allOk = checks.every((c) => c.ok);

  const statusLabel = d.status === "trunk" ? "Trunk up" : d.status === "access" ? "Access (no trunk)" : d.status === "mismatch" ? "One-sided trunk" : "Link down";
  const statusColor = d.status === "trunk" ? "var(--ok)" : d.status === "down" ? "var(--faint)" : "var(--err)";

  return (
    <div
      className="sw mx-auto w-full max-w-4xl rounded-xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        color: "var(--ink)",
        borderColor: "var(--line)",
        background: "var(--surface)",
      }}
    >
      <style>{THEME_CSS}</style>

      <h1 className="text-2xl font-bold sm:text-3xl">Trunk configuration lab</h1>

      {/* ---------- setup row ---------- */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          onClick={() => { setLab(runScript(mkLab(lab.gen), presetSteps("dtp", lab.gen))); setShot(null); }}
          className="rounded-lg border-2 px-3 py-1.5 font-semibold"
          style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}
        >
          Load DD / DA example
        </button>
        <button
          onClick={() => { setLab(runScript(mkLab(lab.gen), presetSteps("manual", lab.gen))); setShot(null); }}
          className="rounded-lg border-2 px-3 py-1.5 font-semibold"
          style={{ borderColor: "var(--c-teal)", background: "var(--t-teal)", color: "var(--c-teal)" }}
        >
          Load manual trunk + nonegotiate
        </button>
        <button
          onClick={() => { setLab(mkLab(lab.gen)); setShot(null); }}
          className="rounded-lg border px-3 py-1.5"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          Reset lab
        </button>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <span style={{ color: "var(--faint)" }}>Switch model</span>
          {([["old", "Older (ISL + dot1q)"], ["new", "Newer (dot1q only)"]] as [Gen, string][]).map(([g, label]) => (
            <button
              key={g}
              onClick={() => { setLab(mkLab(g)); setShot(null); }}
              aria-pressed={lab.gen === g}
              className="rounded-full border px-2.5 py-1 font-semibold"
              style={btn(lab.gen === g)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- diagram ---------- */}
      <div className="mt-3 rounded-xl border p-2 sm:p-3" style={box}>
        <div className="flex flex-wrap items-center gap-2 px-1 pb-1 text-sm">
          <span className="rounded-full px-3 py-0.5 text-xs font-bold" style={{ border: `2px solid ${statusColor}`, color: statusColor }}>
            {statusLabel}
          </span>
          {d.status === "trunk" && d.encap && (
            <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              {encName(d.encap)}{d.negotiated ? " (negotiated)" : ""}
            </span>
          )}
          {d.nativeBad && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "var(--t-amber)", color: "var(--c-amber)" }}>native VLAN mismatch</span>}
          {d.status === "trunk" && d.allowedBad && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "var(--t-amber)", color: "var(--c-amber)" }}>allowed VLANs differ</span>}
          {d.encapBad && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "var(--err-bg)", color: "var(--err)" }}>encapsulation mismatch</span>}
        </div>

        <svg viewBox="0 0 700 300" className="block h-auto w-full" role="img" aria-label="Two switches joined by a trunk with one lane per VLAN">
          {/* switches */}
          {lab.sw.map((s, i) => {
            const x = i === 0 ? 20 : 530;
            const px = i === 0 ? 170 : 530;
            const light = s.shut ? "var(--err)" : d.phys ? "var(--ok)" : "var(--link)";
            const side = d.trunk[i] ? "trunk" : d.phys ? "access" : "down";
            const rows: [string, string][] = [
              ["mode", s.mode === "trunk" ? "trunk" : s.mode.replace("dynamic ", "dyn ")],
              ["now", side],
              ["encap", s.encap],
              ["native", String(s.native)],
              ["allowed", compress(s.allowed).length > 12 ? compress(s.allowed).slice(0, 11) + "…" : compress(s.allowed)],
              ["speed", `${s.speed} ${s.duplex}`],
            ];
            return (
              <g key={s.name}>
                <rect x={x} y={20} width={150} height={260} rx={10} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth={1.5} />
                <text x={x + 75} y={44} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">{s.name}</text>
                {rows.map(([k, val], r) => (
                  <g key={k}>
                    <text x={x + 12} y={74 + r * 20} fontSize={10.5} fill="var(--faint)">{k}</text>
                    <text
                      x={x + 138}
                      y={74 + r * 20}
                      textAnchor="end"
                      fontSize={11}
                      fontWeight={700}
                      fill={k === "now" ? (side === "trunk" ? "var(--ok)" : side === "access" ? "var(--c-amber)" : "var(--faint)") : "var(--ink)"}
                    >
                      {val}
                    </text>
                  </g>
                ))}
                {s.nonego && (
                  <g>
                    <rect x={x + 22} y={204} width={106} height={17} rx={8.5} fill="var(--t-purple)" stroke="var(--c-purple)" />
                    <text x={x + 75} y={216} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--c-purple)">nonegotiate</text>
                  </g>
                )}
                {s.shut && (
                  <g>
                    <rect x={x + 22} y={228} width={106} height={17} rx={8.5} fill="var(--err-bg)" stroke="var(--err)" />
                    <text x={x + 75} y={240} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--err)">shutdown</text>
                  </g>
                )}
                {/* port tile */}
                <rect x={px - 10} y={55} width={20} height={180} rx={6} fill="var(--ink)" />
                <circle cx={px} cy={68} r={5.5} fill={light} stroke="var(--surface)" strokeWidth={1.5} />
                <text x={px} y={254} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">{s.short}</text>
              </g>
            );
          })}

          {/* DTP hello frames */}
          {d.phys && anyDyn && (
            <g>
              <text x={350} y={38} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--c-purple)">
                {init[0] || init[1] ? "DTP hello" : "DTP: nobody initiates"}
              </text>
              {init[0] && [0, 0.8, 1.6].map((dl) => (
                <circle key={`r${dl}`} cx={188} cy={48} r={4.5} fill="var(--c-purple)" className="tc-r" style={{ animationDelay: `${dl}s` }} />
              ))}
              {init[1] && [0.4, 1.2, 2].map((dl) => (
                <circle key={`l${dl}`} cx={512} cy={48} r={4.5} fill="var(--c-pink)" className="tc-l" style={{ animationDelay: `${dl}s` }} />
              ))}
            </g>
          )}

          {/* lanes */}
          {LANES.map((l, k) => {
            const y = laneY(k);
            const ls = [laneState(a, k), laneState(b, k)];
            const live = d.status === "trunk" && !d.encapBad;
            const col = `var(--c-${l.c})`;
            const half = (side: 0 | 1) => {
              const st = ls[side];
              const on = live && st !== "none";
              return (
                <line
                  x1={side === 0 ? 182 : 350}
                  x2={side === 0 ? 350 : 518}
                  y1={y}
                  y2={y}
                  stroke={on ? col : "var(--line-strong)"}
                  strokeWidth={on ? 5 : 2.5}
                  strokeLinecap="round"
                  strokeDasharray={!on ? "3 7" : st === "part" ? "10 5" : undefined}
                  style={{ transition: "stroke .4s, stroke-width .4s" }}
                />
              );
            };
            const both = live && ls[0] !== "none" && ls[1] !== "none";
            return (
              <g key={l.label}>
                {half(0)}
                {half(1)}
                <rect x={300} y={y - 10} width={100} height={20} rx={10} fill={both ? col : "var(--surface)"} stroke={both ? col : "var(--line-strong)"} strokeWidth={1.5} style={{ transition: "fill .4s" }} />
                <text x={350} y={y + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={both ? `var(--on-${l.c})` : "var(--faint)"}>
                  {l.label}
                </text>
              </g>
            );
          })}
          {d.status !== "trunk" && (
            <g>
              <rect x={262} y={246} width={176} height={26} rx={13} fill="var(--surface)" stroke="var(--err)" strokeWidth={2} />
              <text x={350} y={263} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--err)">
                {d.status === "down" ? "no link" : d.status === "access" ? "no trunk formed" : "trunk on one side only"}
              </text>
            </g>
          )}

          {/* test frame */}
          {shot && (
            <g transform={`translate(0,${laneY(laneOf(shot.v))})`}>
              <g style={{ transform: `translateX(${tokenPos(shot)}px)`, transition: shot.phase === 1 ? "transform 1.5s ease-in-out" : "none" }}>
                <g opacity={shot.res.kind === "drop" && shot.phase === 2 ? 0.35 : 1}>
                  <rect x={-17} y={-11} width={34} height={22} rx={4} fill={shot.res.kind === "leak" && shot.phase === 2 ? colOf(shot.res.leakTo ?? 1) : colOf(shot.v)} stroke="var(--surface)" strokeWidth={1.5} />
                  <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill={onOf(shot.v)}>
                    {shot.res.kind === "leak" && shot.phase === 2 ? shot.res.leakTo : shot.v}
                  </text>
                </g>
                {shot.phase === 2 && shot.res.kind === "drop" && (
                  <text x={0} y={-16} textAnchor="middle" fontSize={32} fontWeight={700} fill="var(--c-red)" className="tc-flash">×</text>
                )}
                {shot.phase === 2 && shot.res.kind === "ok" && (
                  <circle r={14} fill="none" stroke="var(--ok)" strokeWidth={3} className="tc-ping" />
                )}
              </g>
            </g>
          )}
        </svg>

        {/* test controls */}
        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 text-sm">
          <span className="font-semibold">Test frame</span>
          {TEST_VLANS.map((v) => (
            <button
              key={v}
              onClick={() => { setTestV(v); clearShot(); }}
              aria-pressed={testV === v}
              className="rounded-full border-2 px-3 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2"
              style={{ borderColor: colOf(v), background: testV === v ? `color-mix(in srgb, ${colOf(v)} 20%, var(--surface))` : "var(--surface)", color: colOf(v), boxShadow: testV === v ? `0 0 0 2px ${colOf(v)}` : "none" }}
            >
              {v}
            </button>
          ))}
          <span className="ml-2 inline-flex gap-1.5">
            {([[0, "SW1 to SW2"], [1, "SW2 to SW1"]] as [Idx, string][]).map(([v, label]) => (
              <button key={v} onClick={() => { setDir(v); clearShot(); }} aria-pressed={dir === v} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={btn(dir === v)}>
                {label}
              </button>
            ))}
          </span>
          <button
            onClick={sendTest}
            className="ml-auto rounded-lg border-2 px-4 py-1.5 font-semibold"
            style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}
          >
            Send
          </button>
        </div>
        <div
          className="mx-1 mt-2 min-h-[2.5rem] rounded-lg border-2 px-3 py-2 text-sm font-medium"
          style={{
            borderColor: shot && shot.phase === 2 ? (shot.res.kind === "ok" ? "var(--ok)" : shot.res.kind === "leak" ? "var(--c-amber)" : "var(--err)") : "var(--line)",
            background: shot && shot.phase === 2 ? (shot.res.kind === "ok" ? "var(--t-ok)" : shot.res.kind === "leak" ? "var(--t-amber)" : "var(--err-bg)") : "var(--panel)",
          }}
          aria-live="polite"
        >
          {shot && shot.phase === 2 ? shot.res.why : shot ? "…" : "Send a frame to see whether it crosses."}
        </div>
      </div>

      {/* ---------- terminal ---------- */}
      <h2 className={h2}>Command line</h2>
      <div className="mt-2 flex gap-2">
        {lab.sw.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setTab(i as Idx)}
            aria-pressed={tab === i}
            className="rounded-lg border-2 px-4 py-1.5 text-sm font-bold focus:outline-none focus-visible:ring-2"
            style={{ ...btn(tab === i), color: tab === i ? "var(--c-blue)" : "var(--ink)" }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-1.5">
        {[
          ["Interface", [`interface ${sw.port}`, "no sh", "exit"]],
          ["Encapsulation", ["switchport trunk encapsulation dot1q", "switchport trunk encapsulation isl"]],
          ["Mode", ["switchport mode trunk", "switchport mode dynamic desirable", "switchport mode dynamic auto", "switchport nonegotiate"]],
          ["Native", ["switchport trunk native vlan 10"]],
          ["Allowed", ["switchport trunk allowed vlan 10", "switchport trunk allowed vlan 10,20,30-35", "switchport trunk allowed vlan none", "switchport trunk allowed vlan add 50", "switchport trunk allowed vlan remove 40"]],
          ["Verify", ["show interface trunk", "show ip interface brief", "show interface status", "show vlan", `show run interface ${sw.port}`, `show interface ${sw.port}`, `show log | include ${sw.port}`]],
        ].map(([label, cmds]) => (
          <div key={label as string} className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 shrink-0 text-xs font-semibold" style={{ color: "var(--muted)" }}>{label as string}</span>
            {(cmds as string[]).map((c) => (
              <button
                key={c}
                onClick={() => run(c)}
                className="rounded-md border px-2 py-1 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 sm:text-xs"
                style={{ borderColor: label === "Verify" ? "var(--c-teal)" : "var(--line-strong)", background: label === "Verify" ? "var(--t-teal)" : "var(--surface)", fontFamily: MONO }}
              >
                {c}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={termRef}
        className="mt-3 max-h-80 min-h-[10rem] overflow-auto rounded-t-lg p-3 text-[11px] leading-relaxed sm:text-xs"
        style={{ background: "#0e141b", color: "#d7e0ee", fontFamily: MONO }}
      >
        {sw.hist.length === 0 && <div style={{ color: "#7b8aa0" }}>Click a command above, or type one below.</div>}
        {sw.hist.map((l, i) => (
          <div key={i} className="tc-line" style={{ whiteSpace: "pre", color: l.k === "err" ? "#ff8a8a" : l.k === "out" ? "#d7e0ee" : "#ffffff" }}>
            {l.k === "cmd" && <span style={{ color: "#7fe6d0" }}>{l.p} </span>}
            {l.t || " "}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-b-lg px-3 py-2 text-xs sm:text-sm" style={{ background: "#0e141b", borderTop: "1px solid #25303f", fontFamily: MONO }}>
        <span style={{ color: "#7fe6d0" }}>{sw.name}{sw.ctx === "if" ? "(config-if)" : "(config)"}#</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { run(cmd); setCmd(""); } }}
          spellCheck={false}
          autoCapitalize="off"
          aria-label="Type a command"
          placeholder="type a command and press Enter"
          className="min-w-0 flex-1 bg-transparent outline-none"
          style={{ color: "#f5c26b" }}
        />
      </div>

      {/* ---------- troubleshooting ---------- */}
      <h2 className={h2}>Troubleshooting checklist</h2>
      <div className="mt-2 rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Break something:</span>
          <button onClick={() => update((l) => ({ ...l, cable: !l.cable }))} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}>
            {lab.cable ? "Unplug cable" : "Plug cable back"}
          </button>
          <button
            onClick={() => update((l) => setSw(l, 1, { ...cloneSw(l.sw[1]), speed: l.sw[1].speed === 100 ? 10 : 100 }))}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}
          >
            SW2 speed: {b.speed}
          </button>
          <button
            onClick={() => update((l) => setSw(l, 1, { ...cloneSw(l.sw[1]), duplex: l.sw[1].duplex === "full" ? "half" : "full" }))}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--line-strong)", background: "var(--surface)" }}
          >
            SW2 duplex: {b.duplex}
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border-2 px-3 py-2"
              style={{ borderColor: c.ok ? "var(--ok)" : "var(--err)", background: c.ok ? "var(--t-ok)" : "var(--err-bg)", transition: "background .3s, border-color .3s" }}
            >
              <span
                key={`${c.id}-${c.ok}`}
                className="tc-pop h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: c.ok ? "var(--ok)" : "var(--err)", color: "var(--surface)" }}
                aria-label={c.ok ? "OK" : "Problem"}
              >
                {c.ok ? "✓" : "×"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="truncate text-xs" style={{ color: "var(--muted)", fontFamily: MONO }}>{c.detail}</div>
              </div>
              {!c.ok && (
                <button onClick={c.fix} className="rounded-lg border-2 px-3 py-1 text-xs font-bold" style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}>
                  Fix on SW2
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-2 text-sm font-semibold" style={{ color: allOk ? "var(--ok)" : "var(--faint)" }}>
          {allOk ? "All five conditions match." : "Fix the red items, then send a test frame again."}
        </div>
      </div>

      {/* ---------- DTP ---------- */}
      <h2 className={h2}>DTP</h2>
      <div className="mt-2 grid items-stretch gap-3 md:grid-cols-2">
        {/* matrix */}
        <div className="flex h-full flex-col rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
          <div className="text-sm font-semibold">Mode combinations</div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 text-xs">
            <div />
            {DTP_MODES.map((c) => (
              <div key={c.m} className="px-1 text-center font-bold" style={{ color: "var(--muted)" }}>SW2<br />{c.label}</div>
            ))}
            {DTP_MODES.map((r) => (
              <div key={r.m} className="contents">
                <div className="flex items-center font-bold" style={{ color: "var(--muted)" }}>SW1 {r.label}</div>
                {DTP_MODES.map((c) => {
                  const ok = sideTrunk({ mode: r.m }, { mode: c.m, nonego: false }) && sideTrunk({ mode: c.m }, { mode: r.m, nonego: false });
                  const cur = a.mode === r.m && b.mode === c.m;
                  return (
                    <button
                      key={c.m}
                      onClick={() =>
                        update((l) => {
                          const fix = (s: Sw, m: Mode) => ({ ...cloneSw(s), mode: m, nonego: false, encap: m === "trunk" && l.gen === "old" && s.encap === "auto" ? ("dot1q" as Encap) : s.encap });
                          return setSw(setSw(l, 0, fix(l.sw[0], r.m)), 1, fix(l.sw[1], c.m));
                        })
                      }
                      aria-pressed={cur}
                      className="flex h-12 items-center justify-center rounded-md border-2 text-xs font-bold focus:outline-none focus-visible:ring-2"
                      style={{
                        borderColor: ok ? "var(--ok)" : "var(--err)",
                        background: ok ? "var(--t-ok)" : "var(--err-bg)",
                        color: ok ? "var(--ok)" : "var(--err)",
                        boxShadow: cur ? "0 0 0 3px var(--c-blue)" : "none",
                        transition: "box-shadow .2s",
                      }}
                    >
                      {ok ? "Trunk" : "No trunk"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--faint)" }}>Click a cell to set both switches. The blue ring is the live pair.</p>
        </div>

        {/* timers */}
        <div className="flex h-full flex-col rounded-xl border p-3 sm:p-4" style={{ ...box, background: "var(--panel)" }}>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">DTP timers</div>
            <span className="ml-auto text-xs" style={{ color: "var(--faint)" }}>30x speed</span>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs font-bold" style={{ color: "var(--c-blue)" }}>
              <span>Hello timer</span><span>{tm.hello} / 30 s</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded" style={{ background: "var(--head)" }}>
              <div className="h-4" style={{ width: `${(tm.hello / 30) * 100}%`, background: "var(--c-blue)", transition: "width .1s linear" }} />
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs font-bold" style={{ color: tm.expired ? "var(--err)" : "var(--c-purple)" }}>
              <span>Hold timer</span><span>{tm.hold} / 300 s</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded" style={{ background: "var(--head)" }}>
              <div className="h-4" style={{ width: `${(tm.hold / 300) * 100}%`, background: tm.expired ? "var(--err)" : "var(--c-purple)", transition: "width .1s linear" }} />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
            <span key={tm.frames} className={tm.frames > 0 ? "tc-pop" : undefined} style={{ display: "inline-flex", width: 12, height: 12, borderRadius: 6, background: tm.alive && tm.frames > 0 ? "var(--c-blue)" : "var(--line-strong)" }} />
            <span>DTP frames received: {tm.frames}</span>
            <span
              className="ml-auto rounded-full px-2.5 py-0.5"
              style={{ background: tm.expired ? "var(--err-bg)" : "var(--t-ok)", color: tm.expired ? "var(--err)" : "var(--ok)" }}
            >
              {tm.expired ? "DTP info discarded" : "DTP info kept"}
            </span>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-3 text-xs">
            <button
              onClick={() => setTm((t) => (t.expired ? { hello: 0, hold: 0, frames: 0, alive: true, run: true, expired: false } : { ...t, run: !t.run }))}
              className="rounded-lg border-2 px-3 py-1.5 font-bold"
              style={{ borderColor: "var(--c-blue)", background: "var(--t-blue)", color: "var(--c-blue)" }}
            >
              {tm.run ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => setTm((t) => ({ ...t, alive: !t.alive }))}
              aria-pressed={!tm.alive}
              className="rounded-lg border-2 px-3 py-1.5 font-bold"
              style={{ borderColor: tm.alive ? "var(--line-strong)" : "var(--err)", background: tm.alive ? "var(--surface)" : "var(--err-bg)", color: tm.alive ? "var(--ink)" : "var(--err)" }}
            >
              {tm.alive ? "Neighbor stops sending" : "Neighbor is silent"}
            </button>
            <button onClick={() => setTm({ hello: 0, hold: 0, frames: 0, alive: true, run: false, expired: false })} className="rounded-lg border px-3 py-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}