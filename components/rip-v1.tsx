"use client";

/**
 * RIP v1 Lab — 5 routers in a ring (pentagon), a switch + 1 PC behind each, 192.168.XX.0/24 addressing.
 *
 * Every device starts in its factory state (routers: all interfaces shut, no IPs, no routing protocol;
 * PCs: no IP). Click a device → console. Address everything, then let RIP learn the routes.
 *
 * Note: this lab needs `router rip`, `network`, `show ip route rip` and `show ip protocols` support
 * in the router engine.
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import VPC from "./VPC";
import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

/* ───────────────────────────── Answer key data ───────────────────────────── */

type Line = { cmd: string; note?: string };
type KeyDevice = { id: string; kind: "router" | "pc"; lines: Line[] };

const L = (cmd: string, note?: string): Line => ({ cmd, note });

const ANSWER_KEY: KeyDevice[] = [
  {
    id: "R1",
    kind: "router",
    lines: [
      L("interface e0/0", "to R2"),
      L(" ip address 192.168.10.1 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/1", "to R5"),
      L(" ip address 192.168.50.1 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC11)"),
      L(" ip address 192.168.1.1 255.255.255.0"),
      L(" no shutdown"),
      L("router rip", "RIP version 1 is the default"),
      L(" network 192.168.1.0", "LAN"),
      L(" network 192.168.10.0", "link to R2"),
      L(" network 192.168.50.0", "link to R5"),
    ],
  },
  {
    id: "R2",
    kind: "router",
    lines: [
      L("interface e0/0", "to R1"),
      L(" ip address 192.168.10.2 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/1", "to R3"),
      L(" ip address 192.168.20.2 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC12)"),
      L(" ip address 192.168.2.1 255.255.255.0"),
      L(" no shutdown"),
      L("router rip"),
      L(" network 192.168.2.0", "LAN"),
      L(" network 192.168.10.0", "link to R1"),
      L(" network 192.168.20.0", "link to R3"),
    ],
  },
  {
    id: "R3",
    kind: "router",
    lines: [
      L("interface e0/0", "to R2"),
      L(" ip address 192.168.20.3 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/1", "to R4"),
      L(" ip address 192.168.30.3 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC13)"),
      L(" ip address 192.168.3.1 255.255.255.0"),
      L(" no shutdown"),
      L("router rip"),
      L(" network 192.168.3.0", "LAN"),
      L(" network 192.168.20.0", "link to R2"),
      L(" network 192.168.30.0", "link to R4"),
    ],
  },
  {
    id: "R4",
    kind: "router",
    lines: [
      L("interface e0/0", "to R5"),
      L(" ip address 192.168.40.4 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/1", "to R3"),
      L(" ip address 192.168.30.4 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC14)"),
      L(" ip address 192.168.4.1 255.255.255.0"),
      L(" no shutdown"),
      L("router rip"),
      L(" network 192.168.4.0", "LAN"),
      L(" network 192.168.30.0", "link to R3"),
      L(" network 192.168.40.0", "link to R5"),
    ],
  },
  {
    id: "R5",
    kind: "router",
    lines: [
      L("interface e0/0", "to R1"),
      L(" ip address 192.168.50.5 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/1", "to R4"),
      L(" ip address 192.168.40.5 255.255.255.0"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC15)"),
      L(" ip address 192.168.5.1 255.255.255.0"),
      L(" no shutdown"),
      L("router rip"),
      L(" network 192.168.5.0", "LAN"),
      L(" network 192.168.40.0", "link to R4"),
      L(" network 192.168.50.0", "link to R1"),
    ],
  },
  { id: "VPC11", kind: "pc", lines: [L("ip 192.168.1.10/24 192.168.1.1")] },
  { id: "VPC12", kind: "pc", lines: [L("ip 192.168.2.10/24 192.168.2.1")] },
  { id: "VPC13", kind: "pc", lines: [L("ip 192.168.3.10/24 192.168.3.1")] },
  { id: "VPC14", kind: "pc", lines: [L("ip 192.168.4.10/24 192.168.4.1")] },
  { id: "VPC15", kind: "pc", lines: [L("ip 192.168.5.10/24 192.168.5.1")] },
];

/* What each router should end up with: one network is reachable two ways at equal cost. */
const EQUAL_COST = [
  { r: "R1", net: "192.168.30.0", via: "192.168.10.2 (R2) and 192.168.50.5 (R5)" },
  { r: "R2", net: "192.168.40.0", via: "192.168.10.1 (R1) and 192.168.20.3 (R3)" },
  { r: "R3", net: "192.168.50.0", via: "192.168.20.2 (R2) and 192.168.30.4 (R4)" },
  { r: "R4", net: "192.168.10.0", via: "192.168.30.3 (R3) and 192.168.40.5 (R5)" },
  { r: "R5", net: "192.168.20.0", via: "192.168.50.1 (R1) and 192.168.40.4 (R4)" },
];

const R1_EXPECTED = `R    192.168.2.0/24 [120/1] via 192.168.10.2, Ethernet0/0
R    192.168.3.0/24 [120/2] via 192.168.10.2, Ethernet0/0
R    192.168.4.0/24 [120/2] via 192.168.50.5, Ethernet0/1
R    192.168.5.0/24 [120/1] via 192.168.50.5, Ethernet0/1
R    192.168.20.0/24 [120/1] via 192.168.10.2, Ethernet0/0
R    192.168.30.0/24 [120/2] via 192.168.50.5, Ethernet0/1
                     [120/2] via 192.168.10.2, Ethernet0/0
R    192.168.40.0/24 [120/1] via 192.168.50.5, Ethernet0/1`;

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
      : first === "ip" || first === "no" || first === "network"
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

  // An indented line needs its parent ("interface e0/0", "router rip") so it works from any mode.
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
  const [ran, setRan] = useState(false);
  const [open, setOpen] = useState(false); // collapsed by default

  return (
    <div style={{ alignSelf: "start", border: "1px solid rgba(128,128,128,.25)", borderRadius: 10, overflow: "hidden" }}>
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
              device.kind === "router"
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
      <div style={{ padding: 6, display: open ? "block" : "none", font: "12px/1.5 ui-monospace,Menlo,Consolas,monospace" }}>
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

export function RipV1Lab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 1420, gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
  <div style={{ overflowX: "auto" }}>
    <NetLab title="RIP v1 Lab" width={1230} height={1140}>
      <Note x={220} y={40} size={22}>192.168.XX.0/24 – RIP v1</Note>

      {/* ring */}
      <Cable a="R1:e0/0" b="R2:e0/0" aTag=".1" bTag=".2" />
      <Cable a="R2:e0/1" b="R3:e0/0" aTag=".2" bTag=".3" />
      <Cable a="R3:e0/1" b="R4:e0/1" aTag=".3" bTag=".4" />
      <Cable a="R4:e0/0" b="R5:e0/1" aTag=".4" bTag=".5" />
      <Cable a="R5:e0/0" b="R1:e0/1" aTag=".5" bTag=".1" />
      {/* router ↔ switch */}
      <Cable a="R1:e0/2" b="SW6:e0/0" aTag=".1" />
      <Cable a="R2:e0/2" b="SW7:e0/0" aTag=".1" />
      <Cable a="R3:e0/2" b="SW8:e0/0" aTag=".1" />
      <Cable a="R4:e0/2" b="SW10:e0/0" aTag=".1" />
      <Cable a="R5:e0/2" b="SW9:e0/0" aTag=".1" />
      {/* switch ↔ PC */}
      <Cable a="SW6:e0/1" b="VPC11:eth0" bTag=".10" />
      <Cable a="SW7:e0/1" b="VPC12:eth0" bTag=".10" />
      <Cable a="SW8:e0/1" b="VPC13:eth0" bTag=".10" />
      <Cable a="SW10:e0/1" b="VPC14:eth0" bTag=".10" />
      <Cable a="SW9:e0/1" b="VPC15:eth0" bTag=".10" />

      {/* ring subnets: outside the pentagon */}
      <Note x={434} y={376}>192.168.10.0/24</Note>
      <Note x={766} y={376}>192.168.20.0/24</Note>
      <Note x={897} y={702}>192.168.30.0/24</Note>
      <Note x={600} y={875}>192.168.40.0/24</Note>
      <Note x={303} y={702}>192.168.50.0/24</Note>

      {/* LAN subnets: under their switch-to-PC cable */}
      <Note x={194}  y={335}>192.168.1.0/24</Note>
      <Note x={745}  y={145}>192.168.2.0/24</Note>
      <Note x={1006} y={335}>192.168.3.0/24</Note>
      <Note x={907}  y={1082}>192.168.4.0/24</Note>
      <Note x={293}  y={1082}>192.168.5.0/24</Note>

      {/* routers (pentagon) */}
      <Router id="R1" x={339} y={520} />
      <Router id="R2" x={600} y={330} />
      <Router id="R3" x={861} y={520} />
      <Router id="R4" x={762} y={827} />
      <Router id="R5" x={438} y={827} />

      {/* LANs */}
      <Switch id="SW6"   x={339}  y={300} />
      <VPC    id="VPC11" x={49}   y={300} />

      <Switch id="SW7"   x={600}  y={110} />
      <VPC    id="VPC12" x={890}  y={110} />

      <Switch id="SW8"   x={861}  y={300} />
      <VPC    id="VPC13" x={1151} y={300} />

      <Switch id="SW10"  x={762}  y={1047} />
      <VPC    id="VPC14" x={1052} y={1047} />

      <Switch id="SW9"   x={438}  y={1047} />
      <VPC    id="VPC15" x={148}  y={1047} />
    </NetLab>
  </div>




      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>Address every router interface and every PC from the diagram (each router uses .1 on its LAN, the PCs use .10).</li>
          <li>Bring the interfaces up and confirm with <code>show ip interface brief</code>.</li>
          <li>
            Enable RIP on every router with <code>router rip</code> and one <code>network</code> statement for
            each directly connected network. Do not configure any static routes.
          </li>
          <li>
            Check <code>show ip route rip</code> and <code>show ip protocols</code> on each router. Every router
            should learn 7 remote networks.
          </li>
          <li>Make every PC ping every other PC (watch the <em>Ping matrix</em> turn green).</li>
          <li>
            Find the one network on each router that has two equal-cost paths, and confirm that{" "}
            <code>trace</code> picks one of them.
          </li>
          <li>
            Break something on purpose: shut down R2's <code>e0/1</code> (the R2–R3 link) and watch the tables on
            R1 and R4 change while you ping VPC11 → VPC13.
          </li>
          <li>Save with <code>copy running-config startup-config</code> and test <code>reload</code>.</li>
        </ol>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What RIP should have learned</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            RIP's metric is the hop count, and its administrative distance is 120. Each router has 3 connected
            networks and learns the other 7. In a ring of five, exactly one of those 7 is the same distance away
            in both directions, so it is installed with two next hops:
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
              <thead>
                <tr style={{ background: "rgba(128,128,128,.12)" }}>
                  <th style={CELL}>Router</th>
                  <th style={CELL}>Equal-cost network</th>
                  <th style={CELL}>Next hops</th>
                </tr>
              </thead>
              <tbody>
                {EQUAL_COST.map((e) => (
                  <tr key={e.r} style={{ borderTop: "1px solid rgba(128,128,128,.25)" }}>
                    <td style={{ ...CELL, fontWeight: 600 }}>{e.r}</td>
                    <td style={{ ...CELL, font: "12px ui-monospace,Menlo,Consolas,monospace" }}>{e.net}</td>
                    <td style={CELL}>{e.via}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 6px", opacity: 0.75 }}>
            Expected <code>show ip route rip</code> on R1:
          </p>
          <pre
            style={{
              margin: 0,
              padding: 10,
              borderRadius: 8,
              background: "rgba(128,128,128,.12)",
              overflowX: "auto",
              font: "12px/1.5 ui-monospace,Menlo,Consolas,monospace",
            }}
          >
            {R1_EXPECTED}
          </pre>
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