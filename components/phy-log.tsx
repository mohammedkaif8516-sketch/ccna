"use client";

/**
 * Physical Works as Logical Lab — ONE switch (SW) and 8 routers, each router has a SINGLE cable (its e0/0) to SW.
 * Yet the routers must behave like the OSPF 1024 network (8 routers, areas 10/20/0/30, shared segments 7.0 and 8.0).
 *
 * How: every logical link 200.10.N.0/24 becomes its own VLAN (100+N). The switch ports facing the routers are trunks
 * that carry only the VLANs of that router, and each router has one dot1Q sub-interface (e0/0.10N) per logical link.
 *
 *   PHYSICAL (the real, clickable lab)  → the star below
 *   LOGICAL  (picture only, not clickable) → the OSPF topology the star must behave like
 *
 * Every device starts in its factory state. Click a device in the PHYSICAL diagram → console.
 * Needs NetLab / Cable / Note from netsim.tsx, plus Router and Switch components.
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = { padding: "6px 10px", textAlign: "left", verticalAlign: "top" };

/* ───────────────────────── answer key data ───────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "switch" | "router"; lines: Line[] };
const L = (cmd: string, note?: string): Line => ({ cmd, note });

const vlanOf = (net: number) => 100 + net; // logical link 200.10.N.0/24  →  VLAN 10N

// [network number (200.10.N.0/24), host, ospf priority?]
type Iface = [number, number, number?];
const ROUTERS: Record<string, Iface[]> = {
  R1: [[1, 1]],
  R2: [[2, 2]],
  R3: [[7, 3, 0], [3, 3], [5, 3], [1, 3], [2, 3]],
  R4: [[7, 4, 255], [3, 4], [4, 4]],
  R5: [[7, 5, 0], [5, 5], [6, 5]],
  R6: [[7, 6, 100], [4, 6], [6, 6], [8, 6, 255]],
  R7: [[8, 7, 100]],
  R8: [[8, 8, 0]],
};

// physical star: SW port → router (every router uses its e0/0)
const SW_PORT: Record<string, string> = {
  R1: "e0/0", R2: "e0/1", R3: "e0/2", R4: "e0/3", R5: "e1/0", R6: "e1/1", R7: "e1/2", R8: "e1/3",
};

// [network, wildcard, area]. Loopbacks N.N.N.1–4 are covered by N.N.N.0 0.0.0.7.
type Net = [string, string, number];
const Lo = (n: number, area: number): Net => [`${n}.${n}.${n}.0`, "0.0.0.7", area];
const K = (net: number, area: number): Net => [`200.10.${net}.0`, "0.0.0.255", area];
const OSPF_NETS: Record<string, Net[]> = {
  R1: [K(1, 10), Lo(1, 10)],
  R2: [K(2, 20), Lo(2, 20)],
  R3: [K(1, 10), K(2, 20), K(3, 0), K(5, 0), K(7, 0), Lo(3, 0)],
  R4: [K(3, 0), K(4, 0), K(7, 0), Lo(4, 0)],
  R5: [K(5, 0), K(6, 0), K(7, 0), Lo(5, 0)],
  R6: [K(4, 0), K(6, 0), K(7, 0), K(8, 30), Lo(6, 0)],
  R7: [K(8, 30), Lo(7, 30)],
  R8: [K(8, 30), Lo(8, 30)],
};

const SWITCH_KEY: KeyDevice = (() => {
  const lines: Line[] = [];
  for (let n = 1; n <= 8; n++) {
    lines.push(L(`vlan ${vlanOf(n)}`, `logical link 200.10.${n}.0/24`));
    lines.push(L(` name LINK${n}`));
  }
  for (const [r, ifs] of Object.entries(ROUTERS)) {
    const vlans = ifs.map(([net]) => vlanOf(net)).sort((a, b) => a - b);
    lines.push(L(`interface ${SW_PORT[r]}`, `to ${r} · VLAN ${vlans.join(", ")}`));
    lines.push(L(" switchport trunk encapsulation dot1q", "must come first on this switch image"));
    lines.push(L(" switchport mode trunk"));
    lines.push(L(` switchport trunk allowed vlan ${vlans.join(",")}`));
    lines.push(L(" no shutdown"));
  }
  return { id: "SW", kind: "switch", lines };
})();

const ROUTER_KEYS: KeyDevice[] = Object.entries(ROUTERS).map(([id, ifs]) => {
  const n = id.slice(1);
  const lines: Line[] = [];
  for (let i = 0; i < 4; i++) {
    lines.push(L(`interface loopback${i}`));
    lines.push(L(` ip address ${n}.${n}.${n}.${i + 1} 255.255.255.255`));
  }
  lines.push(L("interface e0/0", "physical port: no IP, just up"));
  lines.push(L(" no shutdown"));
  for (const [net, host, prio] of ifs) {
    lines.push(L(`interface e0/0.${vlanOf(net)}`, `logical link 200.10.${net}.0/24`));
    lines.push(L(` encapsulation dot1Q ${vlanOf(net)}`, "VLAN tag of this link"));
    lines.push(L(` ip address 200.10.${net}.${host} 255.255.255.0`));
    if (prio !== undefined) lines.push(L(` ip ospf priority ${prio}`));
    if (net <= 6) lines.push(L(" ip ospf network point-to-point", "two routers only: no DR/BDR"));
  }
  lines.push(L("router ospf 1"));
  lines.push(L(` router-id ${n}.${n}.${n}.1`));
  for (const [net, wc, area] of OSPF_NETS[id]) lines.push(L(` network ${net} ${wc} area ${area}`));
  return { id, kind: "router", lines };
});

const ANSWER_KEY: KeyDevice[] = [SWITCH_KEY, ...ROUTER_KEYS];

// logical link → VLAN → who is on it
const LINKS = [
  { net: 1, who: "R1, R3", area: "10" },
  { net: 2, who: "R2, R3", area: "20" },
  { net: 3, who: "R3, R4", area: "0" },
  { net: 4, who: "R4, R6", area: "0" },
  { net: 5, who: "R3, R5", area: "0" },
  { net: 6, who: "R5, R6", area: "0" },
  { net: 7, who: "R3, R4, R5, R6 (shared)", area: "0" },
  { net: 8, who: "R6, R7, R8 (shared)", area: "30" },
];

const ELECTION = [
  { seg: "200.10.7.0/24 (VLAN 107)", dr: "R4 (200.10.7.4)", bdr: "R6 (200.10.7.6)", other: "R3, R5" },
  { seg: "200.10.8.0/24 (VLAN 108)", dr: "R6 (200.10.8.6)", bdr: "R7 (200.10.8.7)", other: "R8" },
];

const SW_PORT_NAMES = ["e0/0", "e0/1", "e0/2", "e0/3", "e1/0", "e1/1", "e1/2", "e1/3"];
const fullName = (p: string) => "Ethernet" + p.slice(1);

/* ───────────────────────── helpers ───────────────────────── */

function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(new CustomEvent("netlab:run", { detail: { device, commands, config } }));
}

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const color =
    first === "interface" || first === "vlan" || first === "router"
      ? "#c084fc"
      : first === "switchport" || first === "no" || first === "name" || first === "ip" || first === "encapsulation" || first === "router-id" || first === "network" || first === "channel-group"
        ? "#38bdf8"
        : "inherit";
  return (
    <span style={{ whiteSpace: "pre" }}>
      {" ".repeat(indent)}
      <span style={{ color, fontWeight: 600 }}>{first}</span> {rest.join(" ")}
    </span>
  );
}

function KeyLine({ device, index }: { device: KeyDevice; index: number }) {
  const [state, setState] = useState<"idle" | "ran" | "copied">("idle");
  const { lines } = device;
  const { cmd, note } = lines[index];

  // Indented line → include its parent ("interface …" / "vlan …") so it works from any mode.
  let cmds = [cmd.trim()];
  if (cmd.startsWith(" "))
    for (let i = index - 1; i >= 0; i--)
      if (!lines[i].cmd.startsWith(" ")) {
        cmds = [lines[i].cmd.trim(), cmd.trim()];
        break;
      }

  const flash = (s: "ran" | "copied") => {
    setState(s);
    setTimeout(() => setState("idle"), 1200);
  };

  return (
    <div
      onClick={() => {
        runOnDevice(device.id, cmds, true);
        flash("ran");
      }}
      title="Click to run on this device"
      className="group flex items-center rounded-md px-2 py-[3px] cursor-pointer transition-colors hover:bg-sky-500/10"
      style={{ background: state === "ran" ? "rgba(34,197,94,.18)" : undefined }}
    >
      <Colored cmd={cmd} />
      {note && (
        <span
          style={{
            marginLeft: 12,
            font: "11px/1.3 ui-sans-serif,system-ui,sans-serif",
            opacity: 0.55,
            whiteSpace: "normal",
          }}
        >
          {note}
        </span>
      )}
      <span className="ml-auto flex items-center gap-2 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title="Copy only"
          className="text-muted-foreground hover:text-foreground"
          onClick={async (e) => {
            e.stopPropagation();
            await navigator.clipboard.writeText(cmd.trim());
            flash("copied");
          }}
        >
          {state === "copied" ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
        </button>
        {state === "ran" ? <Check className="size-3.5 text-green-500" /> : <Play className="size-3.5 text-sky-500" />}
      </span>
    </div>
  );
}

function DeviceCard({ device }: { device: KeyDevice }) {
  const [ran, setRan] = useState(false);
  const [open, setOpen] = useState(false); // collapsed by default

  return (
    <div style={{ alignSelf: "start", border: "1px solid rgba(128,128,128,.25)", borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: "6px 10px",
          background: "rgba(128,128,128,.12)",
          font: "600 12px ui-sans-serif,system-ui",
        }}
      >
        <span
          onClick={() => setOpen((o) => !o)}
          style={{ flex: 1, cursor: "pointer", userSelect: "none" }}
        >
          {open ? "▾" : "▸"} {device.id}
        </span>
        
        <button
          type="button"
          onClick={() => {
            runOnDevice(
              device.id,
              device.lines.map((l) => l.cmd.trim()),
              true
            );
            setRan(true);
            setTimeout(() => setRan(false), 2500);
          }}
          className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-white transition-colors ${
            ran
              ? "bg-green-600 hover:bg-green-500"
              : "bg-sky-600 hover:bg-sky-500"
          }`}
        >
          {ran ? "Ran ✓" : "Run all"}
        </button>
      </div>
      <div style={{ padding: 6, display: open ? "block" : "none", font: MONO, overflowX: "auto" }}>
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── logical diagram (picture only) ───────────────────────── */

// Plain SVG on purpose: it is NOT a NetLab, so no device in it can be clicked or opens a console.
type Pt = { x: number; y: number };
const LN: Record<string, Pt> = {
  R1: { x: 90, y: 245 }, R2: { x: 90, y: 475 }, R3: { x: 270, y: 360 }, R4: { x: 470, y: 225 },
  R5: { x: 470, y: 495 }, R6: { x: 670, y: 360 }, R7: { x: 1060, y: 245 }, R8: { x: 1060, y: 490 },
  SW9: { x: 470, y: 360 }, SW10: { x: 880, y: 360 },
};
const LEDGES: [string, string, string, string?][] = [
  // [from, to, tag at from, tag at to]
  ["R1", "R3", ".1", ".3"], ["R2", "R3", ".2", ".3"], ["R3", "R4", ".3", ".4"], ["R4", "R6", ".4", ".6"],
  ["R3", "R5", ".3", ".5"], ["R5", "R6", ".5", ".6"],
  ["R3", "SW9", ".3"], ["R4", "SW9", ".4"], ["R5", "SW9", ".5"], ["R6", "SW9", ".6"],
  ["R6", "SW10", ".6"], ["R7", "SW10", ".7"], ["R8", "SW10", ".8"],
];
const LTAGS: { x: number; y: number; t: string; bold?: boolean }[] = [
  { x: 180, y: 262, t: "1.0 · Area 10", bold: true }, { x: 150, y: 440, t: "2.0 · Area 20", bold: true },
  { x: 345, y: 262, t: "3.0", bold: true }, { x: 600, y: 262, t: "4.0", bold: true },
  { x: 345, y: 470, t: "5.0", bold: true }, { x: 600, y: 470, t: "6.0", bold: true },
  { x: 560, y: 335, t: "7.0 · Area 0", bold: true }, { x: 990, y: 335, t: "8.0 · Area 30", bold: true },
  { x: 540, y: 160, t: "DR  R4" }, { x: 580, y: 392, t: "BDR  R6" },
  { x: 760, y: 392, t: "DR  R6" }, { x: 1105, y: 195, t: "BDR  R7" },
];

function LogicalDiagram() {
  return (
    <svg
      role="img"
      aria-label="Logical OSPF 1024 topology (picture only)"
      viewBox="0 0 1180 620"
      style={{ width: "100%", minWidth: 720, height: "auto", pointerEvents: "none", userSelect: "none", display: "block" }}
    >
      <text x={880} y={40} fontSize={22} fontWeight={700} fill="currentColor">OSPF 1024</text>
      <text x={880} y={64} fontSize={13} fill="currentColor" opacity={0.7}>R–R: 200.10.XX.0/24</text>
      {LEDGES.map(([a, b, ta, tb], i) => {
        const A = LN[a], B = LN[b];
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
        return (
          <g key={i}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#38bdf8" strokeWidth={2.2} opacity={0.85} />
            <text x={A.x + ux * 50} y={A.y + uy * 50 + 4} fontSize={13} fontWeight={700} fill="#22d3ee" textAnchor="middle">{ta}</text>
            {tb && <text x={B.x - ux * 50} y={B.y - uy * 50 + 4} fontSize={13} fontWeight={700} fill="#22d3ee" textAnchor="middle">{tb}</text>}
          </g>
        );
      })}
      {Object.entries(LN).map(([id, p]) => {
        const sw = id.startsWith("SW");
        return (
          <g key={id}>
            {sw ? (
              <rect x={p.x - 30} y={p.y - 14} width={60} height={28} rx={4} fill="rgba(128,128,128,.35)" stroke="currentColor" strokeWidth={1.2} />
            ) : (
              <ellipse cx={p.x} cy={p.y} rx={32} ry={20} fill="rgba(128,128,128,.35)" stroke="currentColor" strokeWidth={1.2} />
            )}
            <text x={p.x} y={p.y + 4} fontSize={13} fontWeight={700} textAnchor="middle" fill="currentColor">{id}</text>
          </g>
        );
      })}
      {LTAGS.map((t) => (
        <text key={t.t} x={t.x} y={t.y} fontSize={t.bold ? 15 : 12} fontWeight={t.bold ? 700 : 400} fill="currentColor" opacity={t.bold ? 1 : 0.8}>
          {t.t}
        </text>
      ))}
    </svg>
  );
}

/* ───────────────────────── the lab ───────────────────────── */

// 8 routers around the switch (octagon)
const RPOS: Record<string, [number, number]> = {
  R1: [120, 380], R2: [250, 130], R3: [500, 60], R4: [750, 130],
  R8: [880, 380], R7: [750, 630], R6: [500, 700], R5: [250, 630],
};

export function PhysicalLogicalLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: "100%", gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: "600 13px ui-sans-serif,system-ui", margin: "0 0 6px" }}>
          Physical (what you build and configure: click a device)
        </div>
        <div style={{ overflowX: "auto" }}>
          <NetLab title="Physical Works as Logical" width={1000} height={760}>
            <Note x={500} y={380} size={16}>one cable per router</Note>

            {Object.keys(RPOS).map((r) => (
              <Cable key={r} a={`SW:${SW_PORT[r]}`} b={`${r}:e0/0`} />
            ))}

            <Switch id="SW" x={500} y={380} ports={SW_PORT_NAMES.map(fullName)} />
            {Object.entries(RPOS).map(([r, [x, y]]) => (
              <Router key={r} id={r} x={x} y={y} ports={["Ethernet0/0"]} />
            ))}
          </NetLab>
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ font: "600 13px ui-sans-serif,system-ui", margin: "0 0 6px" }}>
          Logical (what the network must behave like: picture only, not clickable)
        </div>
        <div style={{ overflowX: "auto", border: "1px solid rgba(128,128,128,.25)", borderRadius: 10, padding: 8 }}>
          <LogicalDiagram />
        </div>
      </div>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Study the two diagrams: physically there is <strong>one switch</strong> and <strong>one cable per router</strong>;
            logically the routers form the OSPF 1024 network. Work out which routers share each logical link.
          </li>
          <li>
            On SW create one VLAN for every logical link: VLAN <code>101</code> to <code>108</code> for{" "}
            <code>200.10.1.0/24</code> to <code>200.10.8.0/24</code> (VLAN = 100 + the third octet).
          </li>
          <li>
            Make every switch port facing a router a <strong>trunk</strong> that carries only the VLANs of that router
            (<code>switchport trunk encapsulation dot1q</code>, <code>switchport mode trunk</code>,{" "}
            <code>switchport trunk allowed vlan …</code>). For example R3 needs 101, 102, 103, 105 and 107.
          </li>
          <li>
            On every router bring up the physical <code>e0/0</code> with <strong>no IP address</strong>, then create one
            sub-interface per logical link: <code>interface e0/0.10N</code>, <code>encapsulation dot1Q 10N</code> and{" "}
            <code>ip address 200.10.N.X 255.255.255.0</code> (X = router number).
          </li>
          <li>Create <code>Loopback0</code> to <code>Loopback3</code> on every router (<code>N.N.N.1–4/32</code>).</li>
          <li>
            Ping the neighbour on every logical link, for example R1 → 200.10.1.3 and R6 → 200.10.8.7, to prove the
            VLANs carry the traffic.
          </li>
          <li>
            Enable <code>router ospf 1</code> on every router with <code>router-id</code> = first loopback, and advertise each
            network in its area: <strong>Area 10</strong> = 1.0, <strong>Area 20</strong> = 2.0, <strong>Area 0</strong> = 3.0
            to 7.0, <strong>Area 30</strong> = 8.0.
          </li>
          <li>
            Set <code>ip ospf network point-to-point</code> on both ends of the six two-router links (1.0 to 6.0) and{" "}
            <code>ip ospf priority</code> on the shared links so that <strong>7.0: R4 = DR, R6 = BDR</strong> and{" "}
            <strong>8.0: R6 = DR, R7 = BDR</strong> (R3, R5 and R8 use priority 0).
          </li>
          <li>
            Check <code>show ip ospf neighbor</code> on R3 and R6, <code>show ip route ospf</code> on R1 (look for{" "}
            <code>O IA</code>) and <code>traceroute 8.8.8.1</code> from R1. The result must match the OSPF 1024 lab.
          </li>
          <li>
            Break something on purpose: remove VLAN 107 from the SW port of R4 with{" "}
            <code>switchport trunk allowed vlan remove 107</code> and watch the 7.0 segment elect a new DR. Then restore it.
          </li>
          <li>
            Save with <code>copy running-config startup-config</code> and test <code>reload</code>.
          </li>
        </ol>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What the network should look like</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            A VLAN is a virtual cable. Every logical link of the OSPF diagram becomes one VLAN, and a router joins a link by
            having a sub-interface in that VLAN. The switch only forwards a frame inside its own VLAN, so two routers hear
            each other only if they share a VLAN, exactly as if they were joined by a real cable. The two shared segments
            (7.0 and 8.0) are VLANs with more than two routers, so they still elect a DR and a BDR; the six two-router VLANs
            run as point-to-point and elect nothing.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Logical link</th>
                  <th style={CELL}>VLAN</th>
                  <th style={CELL}>Routers</th>
                  <th style={CELL}>Area</th>
                </tr>
              </thead>
              <tbody>
                {LINKS.map((l) => (
                  <tr key={l.net} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, font: MONO }}>200.10.{l.net}.0/24</td>
                    <td style={{ ...CELL, fontWeight: 600 }}>{vlanOf(l.net)}</td>
                    <td style={CELL}>{l.who}</td>
                    <td style={CELL}>{l.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 520 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Segment</th>
                  <th style={CELL}>DR</th>
                  <th style={CELL}>BDR</th>
                  <th style={CELL}>DROTHER</th>
                </tr>
              </thead>
              <tbody>
                {ELECTION.map((e) => (
                  <tr key={e.seg} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, font: MONO }}>{e.seg}</td>
                    <td style={{ ...CELL, fontWeight: 600 }}>{e.dr}</td>
                    <td style={CELL}>{e.bdr}</td>
                    <td style={CELL}>{e.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            Expected: <code>show interfaces trunk</code> on SW lists the eight router ports with only their own VLANs allowed.
            R3 and R6 are Area Border Routers and show 7 neighbours each, and R1, R2, R7 and R8 learn the other areas as{" "}
            <code>O IA</code>, the same as in the OSPF 1024 lab, even though only one cable leaves every router.
          </p>
        </div>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Answer key (click a line to run it, or "Run all" per device)
        </summary>
        <div
          style={{
            marginTop: 8,
            maxHeight: 520,
            overflowY: "auto",
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
            alignItems: "start",
          }}
        >
          {ANSWER_KEY.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      </details>
    </div>
  );
}

export default PhysicalLogicalLab;