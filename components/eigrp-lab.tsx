"use client";

/**
 * EIGRP 100 Lab — 8 routers: R3 and R6 are joined by a shared segment (SW9) together with R4 and R5,
 * R1 and R2 hang off R3, and R7 and R8 share a second segment (SW10) with R6. There are no PCs: every
 * router has four loopbacks to ping and trace to.
 *
 *   Router links: 150.10.XX.0/24     Loopbacks: N.N.N.1–4/32 on router N
 *
 * Every device starts in its factory state (routers: all interfaces shut, no IPs, no routing protocol).
 * Click a device → console. Address everything, then let EIGRP learn the routes.
 *
 * Note: this lab needs `router eigrp`, `network <ip> <wildcard>`, `eigrp router-id`,
 * `show ip eigrp neighbors|topology`, `show ip route eigrp` (D routes, AD 90), loopback interfaces,
 * a router with an Ethernet1/0 port (R3) and a switch with 4 ports (SW9).
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

/* ───────────────────────────── Answer key data ───────────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "router" | "pc"; lines: Line[] };

const L = (cmd: string, note?: string): Line => ({ cmd, note });

type IfDef = { name: string; ip: string; note: string };

/** Builds one router's key: 4 loopbacks, its Ethernet interfaces, then EIGRP 100. */
function router(n: number, ifs: IfDef[], nets: number[]): KeyDevice {
  const lines: Line[] = [];
  for (let i = 0; i < 4; i++) {
    lines.push(
      L(`interface loopback${i}`, i === 0 ? `loopbacks ${n}.${n}.${n}.1–4` : undefined),
      L(` ip address ${n}.${n}.${n}.${i + 1} 255.255.255.255`)
    );
  }
  for (const f of ifs) {
    lines.push(L(`interface ${f.name}`, f.note), L(` ip address ${f.ip} 255.255.255.0`), L(" no shutdown"));
  }
  lines.push(L("router eigrp 100", "autonomous system 100"));
  lines.push(L(` eigrp router-id ${n}.${n}.${n}.1`, "set first, so neighbours see it from the start"));
  for (let i = 0; i < 4; i++) {
    lines.push(L(` network ${n}.${n}.${n}.${i + 1} 0.0.0.0`, i === 0 ? "each loopback, exact match" : undefined));
  }
  nets.forEach((x, i) => {
    lines.push(L(` network 150.10.${x}.0 0.0.0.255`, i === 0 ? "connected links, whole /24" : undefined));
  });
  return { id: `R${n}`, kind: "router", lines };
}

const ANSWER_KEY: KeyDevice[] = [
  router(1, [{ name: "e0/0", ip: "150.10.1.1", note: "to R3" }], [1]),
  router(2, [{ name: "e0/0", ip: "150.10.2.2", note: "to R3" }], [2]),
  router(
    3,
    [
      { name: "e0/0", ip: "150.10.7.3", note: "segment 7.0 (via SW9)" },
      { name: "e0/1", ip: "150.10.3.3", note: "to R4" },
      { name: "e0/2", ip: "150.10.5.3", note: "to R5" },
      { name: "e0/3", ip: "150.10.1.3", note: "to R1" },
      { name: "e1/0", ip: "150.10.2.3", note: "to R2" },
    ],
    [1, 2, 3, 5, 7]
  ),
  router(
    4,
    [
      { name: "e0/0", ip: "150.10.7.4", note: "segment 7.0 (via SW9)" },
      { name: "e0/1", ip: "150.10.3.4", note: "to R3" },
      { name: "e0/2", ip: "150.10.4.4", note: "to R6" },
    ],
    [3, 4, 7]
  ),
  router(
    5,
    [
      { name: "e0/0", ip: "150.10.7.5", note: "segment 7.0 (via SW9)" },
      { name: "e0/1", ip: "150.10.5.5", note: "to R3" },
      { name: "e0/2", ip: "150.10.6.5", note: "to R6" },
    ],
    [5, 6, 7]
  ),
  router(
    6,
    [
      { name: "e0/0", ip: "150.10.7.6", note: "segment 7.0 (via SW9)" },
      { name: "e0/1", ip: "150.10.4.6", note: "to R4" },
      { name: "e0/2", ip: "150.10.6.6", note: "to R5" },
      { name: "e0/3", ip: "150.10.8.6", note: "segment 8.0 (via SW10)" },
    ],
    [4, 6, 7, 8]
  ),
  router(7, [{ name: "e0/0", ip: "150.10.8.7", note: "segment 8.0 (via SW10)" }], [8]),
  router(8, [{ name: "e0/0", ip: "150.10.8.8", note: "segment 8.0 (via SW10)" }], [8]),
];

/* What each router should end up with. */
const SUMMARY = [
  { r: "R1", nb: "1 (R3)", routes: 35 },
  { r: "R2", nb: "1 (R3)", routes: 35 },
  { r: "R3", nb: "7 (R1, R2, R4 ×2, R5 ×2, R6)", routes: 31 },
  { r: "R4", nb: "5 (R3 ×2, R5, R6 ×2)", routes: 33 },
  { r: "R5", nb: "5 (R3 ×2, R4, R6 ×2)", routes: 33 },
  { r: "R6", nb: "7 (R3, R4 ×2, R5 ×2, R7, R8)", routes: 32 },
  { r: "R7", nb: "2 (R6, R8)", routes: 35 },
  { r: "R8", nb: "2 (R6, R7)", routes: 35 },
];

const R1_EXPECTED = `D    150.10.2.0/24 [90/307200] via 150.10.1.3, Ethernet0/0
D    150.10.3.0/24 [90/307200] via 150.10.1.3, Ethernet0/0
D    150.10.4.0/24 [90/332800] via 150.10.1.3, Ethernet0/0
D    150.10.5.0/24 [90/307200] via 150.10.1.3, Ethernet0/0
D    150.10.6.0/24 [90/332800] via 150.10.1.3, Ethernet0/0
D    150.10.7.0/24 [90/307200] via 150.10.1.3, Ethernet0/0
D    150.10.8.0/24 [90/332800] via 150.10.1.3, Ethernet0/0`;

const ECMP_EXPECTED = `R3:  D 150.10.4.0/24 [90/307200] via 150.10.3.4, Ethernet0/1
                          [90/307200] via 150.10.7.4, Ethernet0/0
                          [90/307200] via 150.10.7.6, Ethernet0/0
R4:  D 150.10.8.0/24 [90/307200] via 150.10.7.6, Ethernet0/0
                          [90/307200] via 150.10.4.6, Ethernet0/2
R4:  D 150.10.6.0/24 [90/307200] via 150.10.7.5, Ethernet0/0
                          [90/307200] via 150.10.7.6, Ethernet0/0
                          [90/307200] via 150.10.4.6, Ethernet0/2`;

/* ───────────────────────────── Console bridge ─────────────────────────────
 * Fires the "netlab:run" event handled by the listener in NetLab (netsim.tsx).
 * config=true → the listener enters enable / configure terminal first if needed. */
function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(new CustomEvent("netlab:run", { detail: { device, commands, config } }));
}

/* ───────────────────────────── Answer key UI ───────────────────────────── */

function Colored({ cmd }: { cmd: string }) {
  const indent = cmd.length - cmd.trimStart().length;
  const [first, ...rest] = cmd.trim().split(" ");
  const color =
    first === "interface" || first === "router"
      ? "#c084fc"
      : first === "ip" || first === "no" || first === "network" || first === "eigrp"
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

  // An indented line needs its parent ("interface e0/0", "router eigrp 100") so it works from any mode.
  let cmds = [cmd.trim()];
  if (cmd.startsWith(" ")) {
    for (let i = index - 1; i >= 0; i--) {
      if (!lines[i].cmd.startsWith(" ")) {
        cmds = [lines[i].cmd.trim(), cmd.trim()];
        break;
      }
    }
  }

  const flash = (s: "ran" | "copied") => {
    setState(s);
    setTimeout(() => setState("idle"), 1200);
  };

  return (
    <div
      onClick={() => {
        runOnDevice(device.id, cmds, device.kind === "router");
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
  return (
    <div style={{ border: "1px solid rgba(128,128,128,.25)", borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: "rgba(128,128,128,.12)",
          font: "600 12px ui-sans-serif,system-ui",
        }}
      >
        {device.id}
        <button
          onClick={() =>
            runOnDevice(
              device.id,
              device.lines.map((l) => l.cmd.trim()),
              device.kind === "router"
            )
          }
          className="ml-auto inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-[11px] text-white hover:bg-sky-500"
        >
          <Zap className="size-3" /> Run all
        </button>
      </div>
      <div style={{ padding: 6, font: "12px/1.5 ui-monospace,Menlo,Consolas,monospace" }}>
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── The lab ───────────────────────────── */

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const CELL: React.CSSProperties = { padding: "4px 10px", textAlign: "left", verticalAlign: "top" };
const PRE: React.CSSProperties = {
  margin: 0,
  padding: 10,
  borderRadius: 8,
  background: "rgba(128,128,128,.12)",
  overflowX: "auto",
  font: "12px/1.5 ui-monospace,Menlo,Consolas,monospace",
};

export function EigrpLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 1420, gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
   <NetLab title="EIGRP 100 Lab" width={1440} height={800}>
  <Note x={140} y={30} size={22}>EIGRP 100</Note>
  <Note x={140} y={58}>R–R: 150.10.XX.0/24</Note>
  <Note x={140} y={80}>loopbacks N.N.N.1–4/32</Note>

  {/* point-to-point links */}
  <Cable a="R1:e0/0" b="R3:e0/3" aTag=".1" bTag=".3" />
  <Cable a="R2:e0/0" b="R3:e1/0" aTag=".2" bTag=".3" />
  <Cable a="R3:e0/1" b="R4:e0/1" aTag=".3" bTag=".4" />
  <Cable a="R3:e0/2" b="R5:e0/1" aTag=".3" bTag=".5" />
  <Cable a="R4:e0/2" b="R6:e0/1" aTag=".4" bTag=".6" />
  <Cable a="R5:e0/2" b="R6:e0/2" aTag=".5" bTag=".6" />

  {/* shared segment 7.0 (SW9) */}
  <Cable a="R3:e0/0" b="SW9:e0/3" aTag=".3" />
  <Cable a="R4:e0/0" b="SW9:e0/0" aTag=".4" />
  <Cable a="R5:e0/0" b="SW9:e0/1" aTag=".5" />
  <Cable a="R6:e0/0" b="SW9:e0/2" aTag=".6" />

  {/* shared segment 8.0 (SW10) */}
  <Cable a="R6:e0/3" b="SW10:e0/0" aTag=".6" />
  <Cable a="R7:e0/0" b="SW10:e0/1" aTag=".7" />
  <Cable a="R8:e0/0" b="SW10:e0/2" aTag=".8" />

  {/* subnet labels, each beside its link, never on it */}
  <Note x={75}   y={285}>150.10.1.0/24</Note>
  <Note x={75}   y={525}>150.10.2.0/24</Note>
  <Note x={380}  y={215}>150.10.3.0/24</Note>
  <Note x={380}  y={585}>150.10.5.0/24</Note>
  <Note x={930}  y={230}>150.10.4.0/24</Note>
  <Note x={930}  y={535}>150.10.6.0/24</Note>
  <Note x={800}  y={345}>150.10.7.0/24</Note>
  <Note x={1195} y={345}>150.10.8.0/24</Note>

  {/* routers */}
  <Router id="R1" x={60}   y={140} />
  <Router id="R2" x={60}   y={660} />
  <Router id="R3" x={260}  y={400}
    ports={["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3", "Ethernet1/0"]} />
  <Router id="R4" x={640}  y={130} />
  <Router id="R5" x={640}  y={670} />
  <Router id="R6" x={1010} y={400} />
  <Router id="R7" x={1300} y={130} />
  <Router id="R8" x={1300} y={670} />

  {/* switches */}
  <Switch id="SW9"  x={640}  y={400} />
  <Switch id="SW10" x={1300} y={400} />
</NetLab>

      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Address every Ethernet interface from the diagram (/24, with the router number as the last octet) and
            give each router four loopbacks, <code>N.N.N.1</code> to <code>N.N.N.4</code> with a /32 mask.
          </li>
          <li>Bring the Ethernet interfaces up and confirm with <code>show ip interface brief</code>.</li>
          <li>
            Enable <strong>EIGRP 100</strong> on every router. Set the router ID to the first loopback and advertise
            each interface with a <code>network</code> statement and a wildcard mask: an exact match for the loopbacks
            and <code>0.0.0.255</code> for the 150.10 links.
          </li>
          <li>
            Check <code>show ip eigrp neighbors</code>. R3 and R6 should each have 7 neighbours, even though they
            only have 5 and 4 neighbouring routers. Work out why.
          </li>
          <li>
            Look at <code>show ip eigrp topology</code> and <code>show ip route eigrp</code>. Every route should
            carry an administrative distance of 90 and a metric you can explain.
          </li>
          <li>
            From R1, ping and trace to a loopback on R8 (for example <code>8.8.8.4</code>). Then find the routes with
            more than one equal-cost next hop on R3 and R4.
          </li>
          <li>
            Break something on purpose: shut down R3's <code>e0/0</code> (the shared 7.0 segment) and compare R1's
            metric to <code>150.10.8.0</code> before and after.
          </li>
          <li>Save with <code>copy running-config startup-config</code> and test <code>reload</code>.</li>
        </ol>
      </details>

      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What EIGRP should have learned</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            Neighbours are counted per interface, so a router on the shared 7.0 or 8.0 segment sees every other
            router there as a separate neighbour. The 150.10 links are one /24 each, and each router has 4 loopbacks,
            so every router also learns the 28 loopback routes of the other seven routers.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 520 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Router</th>
                  <th style={CELL}>Neighbours</th>
                  <th style={CELL}>EIGRP routes (D)</th>
                </tr>
              </thead>
              <tbody>
                {SUMMARY.map((s) => (
                  <tr key={s.r} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{s.r}</td>
                    <td style={CELL}>{s.nb}</td>
                    <td style={CELL}>{s.routes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 6px", opacity: 0.75 }}>
            Expected 150.10 routes in <code>show ip route eigrp</code> on R1. R1's loopback routes follow the same
            pattern: 409600 for R3's, 435200 for R2, R4, R5 and R6, and 460800 for R7 and R8.
          </p>
          <pre style={PRE}>{R1_EXPECTED}</pre>
          <p style={{ margin: "12px 0 6px", opacity: 0.75 }}>
            Equal-cost examples. EIGRP installs up to four equal-cost paths by default:
          </p>
          <pre style={PRE}>{ECMP_EXPECTED}</pre>
          <p style={{ margin: "12px 0 0", opacity: 0.75 }}>
            All metrics use the default Ethernet values (10 Mbps, 1000 µs) and the loopback delay of 5000 µs. Each
            extra Ethernet hop adds 25600 to the metric.
          </p>
        </div>
      </details>

      <details style={{ font: FONT }}>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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