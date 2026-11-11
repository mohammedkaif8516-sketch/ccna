"use client";

/**
 * Asymmetric Routing Lab 2 — 4 routers in a ring (R1–R2–R3–R4), a switch + 1 PC behind each.
 *
 *   Router links: 10.10.10.XX/30     LANs: 192.168.10.XX/26
 *
 * Every device starts in its factory state (routers: all interfaces shut, no IPs; PCs: no IP).
 * Click a device → console. Address everything, then steer VPC9 → VPC11 over the top (R2)
 * and the reply VPC11 → VPC9 along the bottom (R4).
 */
import { NetLab, Cable, Note } from "@/components/simulator/netsim";
import Router from "@/components/simulator/Router";
import Switch from "@/components/simulator/Switch"; import VPC from "@/components/simulator/VPC";

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
      L(" ip address 10.10.10.1 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/1", "to R4"),
      L(" ip address 10.10.10.14 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC9)"),
      L(" ip address 192.168.10.1 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 192.168.10.64 255.255.255.192 10.10.10.2", "R2 LAN, direct neighbour"),
      L("ip route 192.168.10.128 255.255.255.192 10.10.10.2", "R3 LAN: forward path goes over the top (R2)"),
      L("ip route 192.168.10.192 255.255.255.192 10.10.10.13", "R4 LAN, direct neighbour"),
    ],
  },
  {
    id: "R2",
    kind: "router",
    lines: [
      L("interface e0/0", "to R1"),
      L(" ip address 10.10.10.2 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/1", "to R3"),
      L(" ip address 10.10.10.5 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC10)"),
      L(" ip address 192.168.10.65 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 192.168.10.0 255.255.255.192 10.10.10.1", "R1 LAN"),
      L("ip route 192.168.10.128 255.255.255.192 10.10.10.6", "R3 LAN"),
      L("ip route 192.168.10.192 255.255.255.192 10.10.10.6", "R4 LAN: goes via R3, the reply comes back via R1"),
    ],
  },
  {
    id: "R3",
    kind: "router",
    lines: [
      L("interface e0/0", "to R2"),
      L(" ip address 10.10.10.6 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/1", "to R4"),
      L(" ip address 10.10.10.9 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC11)"),
      L(" ip address 192.168.10.129 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 192.168.10.0 255.255.255.192 10.10.10.10", "R1 LAN: the reply goes under (R4), not back through R2"),
      L("ip route 192.168.10.64 255.255.255.192 10.10.10.5", "R2 LAN"),
      L("ip route 192.168.10.192 255.255.255.192 10.10.10.10", "R4 LAN"),
    ],
  },
  {
    id: "R4",
    kind: "router",
    lines: [
      L("interface e0/0", "to R3"),
      L(" ip address 10.10.10.10 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/1", "to R1"),
      L(" ip address 10.10.10.13 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/2", "LAN (gateway of VPC12)"),
      L(" ip address 192.168.10.193 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 192.168.10.0 255.255.255.192 10.10.10.14", "R1 LAN"),
      L("ip route 192.168.10.64 255.255.255.192 10.10.10.14", "R2 LAN: via R1 (the request came via R3, so this pair is asymmetric too)"),
      L("ip route 192.168.10.128 255.255.255.192 10.10.10.9", "R3 LAN"),
    ],
  },
  { id: "VPC9", kind: "pc", lines: [L("ip 192.168.10.10/26 192.168.10.1")] },
  { id: "VPC10", kind: "pc", lines: [L("ip 192.168.10.74/26 192.168.10.65")] },
  { id: "VPC11", kind: "pc", lines: [L("ip 192.168.10.138/26 192.168.10.129")] },
  { id: "VPC12", kind: "pc", lines: [L("ip 192.168.10.202/26 192.168.10.193")] },
];

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
    first === "interface" ? "#c084fc" : first === "ip" || first === "no" ? "#38bdf8" : "inherit";
  return (
    <span style={{ whiteSpace: "pre-wrap", flexShrink: 1, minWidth: 0 }}>
      {" ".repeat(indent)}
      <span style={{ color, fontWeight: 600 }}>{first}</span> {rest.join(" ")}
    </span>
  );
}

function KeyLine({ device, index }: { device: KeyDevice; index: number }) {
  const [state, setState] = useState<"idle" | "ran" | "copied">("idle");
  const { lines } = device;
  const { cmd, note } = lines[index];

  // An indented line needs its parent ("interface e0/0") so it works from any mode.
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
            minWidth: 0,
            flex: "1 1 0%",
          }}
        >
          {note}
        </span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-2 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div
        style={{
          padding: 6,
          display: open ? "block" : "none",
          font: "12px/1.5 ui-monospace,Menlo,Consolas,monospace",
          width: "100%",
          overflowX: "auto",
        }}
      >
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── Path explainer ───────────────────────────── */

function PathRow({ label, color, hops }: { label: string; color: string; hops: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
      <span style={{ width: 150, fontWeight: 600, color }}>{label}</span>
      {hops.map((h, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              padding: "1px 8px",
              borderRadius: 999,
              border: `1px solid ${color}`,
              font: "600 12px ui-monospace,Menlo,Consolas,monospace",
            }}
          >
            {h}
          </span>
          {i < hops.length - 1 && <span style={{ opacity: 0.5 }}>›</span>}
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────────── The lab ───────────────────────────── */

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";

export function AsymmetricRoutingLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: "100%" }}>
  <div style={{ overflowX: "clip" }}>
    <NetLab title="Asymmetric Routing Lab 2" width={1560} height={1020}>
      <Note x={200} y={30}>192.168.10.XX/26 LANs</Note>
      <Note x={200} y={54}>10.10.10.XX/30 router links</Note>

      {/* ring */}
      <Cable a="R1:e0/0" b="R2:e0/0" aTag=".1" bTag=".2" />
      <Cable a="R2:e0/1" b="R3:e0/0" aTag=".5" bTag=".6" />
      <Cable a="R3:e0/1" b="R4:e0/0" aTag=".9" bTag=".10" />
      <Cable a="R4:e0/1" b="R1:e0/1" aTag=".13" bTag=".14" />
      {/* router ↔ switch */}
      <Cable a="R1:e0/2" b="SW5:e0/0" aTag=".1" />
      <Cable a="R2:e0/2" b="SW6:e0/0" aTag=".65" />
      <Cable a="R3:e0/2" b="SW7:e0/0" aTag=".129" />
      <Cable a="R4:e0/2" b="SW8:e0/0" aTag=".193" />
      {/* switch ↔ PC */}
      <Cable a="SW5:e0/1" b="VPC9:eth0" bTag=".10" />
      <Cable a="SW6:e0/1" b="VPC10:eth0" bTag=".74" />
      <Cable a="SW7:e0/1" b="VPC11:eth0" bTag=".138" />
      <Cable a="SW8:e0/1" b="VPC12:eth0" bTag=".202" />

      {/* router-link subnets: outside the diamond, clear of the cables */}
      <Note x={615}  y={350}>10.10.10.0/30</Note>
      <Note x={1025} y={350}>10.10.10.4/30</Note>
      <Note x={1025} y={670}>10.10.10.8/30</Note>
      <Note x={615}  y={670}>10.10.10.12/30</Note>

      {/* LAN subnets: beside their switch-to-PC cable */}
      <Note x={310}  y={640}>192.168.10.0/26</Note>
      <Note x={960}  y={135}>192.168.10.64/26</Note>
      <Note x={1330} y={640}>192.168.10.128/26</Note>
      <Note x={960}  y={975}>192.168.10.192/26</Note>

      {/* routers (diamond) */}
      <Router id="R1" x={500}  y={510} />
      <Router id="R2" x={820}  y={320} />
      <Router id="R3" x={1140} y={510} />
      <Router id="R4" x={820}  y={700} />

      {/* LAN switches and PCs */}
      <Switch id="SW5" x={170}  y={510} />
      <VPC id="VPC9"  x={170}  y={760} />

      <Switch id="SW6" x={820}  y={90} />
      <VPC id="VPC10" x={1180} y={90} />

      <Switch id="SW7" x={1470} y={510} />
      <VPC id="VPC11" x={1470} y={760} />

      <Switch id="SW8" x={820}  y={930} />
      <VPC id="VPC12" x={1180} y={930} />
    </NetLab>
  </div>

      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>Address every router interface and every PC from the diagram (each router takes the first usable address of its LAN).</li>
          <li>Bring the interfaces up and confirm with <code>show ip interface brief</code>.</li>
          <li>
            Add static routes so every PC can ping every other PC, with <strong>VPC9 → VPC11</strong> going
            over the top (R1 → R2 → R3) and the reply coming back along the bottom (R3 → R4 → R1).
          </li>
          <li>
            Run <code>trace</code> from VPC9 to VPC11, then from VPC11 to VPC9, and compare the two paths.
          </li>
          <li>
            Break something on purpose: delete R4's route to <code>192.168.10.0/26</code> and see which
            direction fails even though the request still arrives.
          </li>
          <li>Save with <code>copy running-config startup-config</code> and test <code>reload</code>.</li>
        </ol>
      </details>

      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What asymmetric routing should look like</summary>
        <div style={{ marginTop: 8 }}>
          <PathRow label="VPC9 → VPC11" color="#38bdf8" hops={["VPC9", "R1", "R2", "R3", "VPC11"]} />
          <PathRow label="VPC11 → VPC9" color="#f59e0b" hops={["VPC11", "R3", "R4", "R1", "VPC9"]} />
          <p style={{ margin: "8px 0 0", opacity: 0.75 }}>
            Static routes are stateless, so each router decides only where to send the next packet.
            Nothing forces the reply to retrace the request, which is why both directions work even though
            they use different links. The two <code>trace</code> outputs show the difference: the first
            should list R2's <code>10.10.10.2</code>, the second R4's <code>10.10.10.10</code>.
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
            maxHeight: 460,
            overflowY: "auto",
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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