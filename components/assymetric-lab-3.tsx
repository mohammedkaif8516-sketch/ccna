"use client";

/**
 * Asymmetric Routing Lab 3 — Lab 2's ring (R1–R2–R3–R4) plus two stub routers:
 * R5 hangs off R1 and R6 hangs off R3. The stubs only have one way out, so they
 * use a single default route instead of a route per network.
 *
 *   Router links: 10.10.10.XX/30     LANs: 192.168.10.XX/26 (ring) and 192.168.20.XX/26 (stubs)
 *
 * Every device starts in its factory state (routers: all interfaces shut, no IPs; PCs: no IP).
 * Click a device → console. Address everything, then steer the request over the top (R2)
 * and the reply along the bottom (R4).
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
      L(" ip address 10.10.10.1 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/1", "to R4"),
      L(" ip address 10.10.10.14 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/2", "to R5"),
      L(" ip address 10.10.10.17 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/3", "LAN (gateway of VPC13)"),
      L(" ip address 192.168.10.1 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 10.10.10.4 255.255.255.252 10.10.10.2", "R2–R3 link"),
      L("ip route 10.10.10.8 255.255.255.252 10.10.10.2", "R3–R4 link"),
      L("ip route 10.10.10.20 255.255.255.252 10.10.10.2", "R3–R6 link"),
      L("ip route 192.168.10.64 255.255.255.192 10.10.10.2", "R2 LAN"),
      L("ip route 192.168.10.128 255.255.255.192 10.10.10.2", "R3 LAN: forward path goes over the top (R2)"),
      L("ip route 192.168.10.192 255.255.255.192 10.10.10.13", "R4 LAN, direct neighbour"),
      L("ip route 192.168.20.0 255.255.255.192 10.10.10.18", "R5 LAN, direct neighbour"),
      L("ip route 192.168.20.64 255.255.255.192 10.10.10.13", "R6 LAN: goes under, via R4"),
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
      L("interface e0/2", "LAN (gateway of VPC14)"),
      L(" ip address 192.168.10.65 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 10.10.10.8 255.255.255.252 10.10.10.6", "R3–R4 link"),
      L("ip route 10.10.10.12 255.255.255.252 10.10.10.6", "R4–R1 link"),
      L("ip route 10.10.10.16 255.255.255.252 10.10.10.1", "R1–R5 link"),
      L("ip route 10.10.10.20 255.255.255.252 10.10.10.6", "R3–R6 link"),
      L("ip route 192.168.10.0 255.255.255.192 10.10.10.1", "R1 LAN"),
      L("ip route 192.168.10.128 255.255.255.192 10.10.10.6", "R3 LAN"),
      L("ip route 192.168.10.192 255.255.255.192 10.10.10.6", "R4 LAN, via R3"),
      L("ip route 192.168.20.0 255.255.255.192 10.10.10.1", "R5 LAN, via R1"),
      L("ip route 192.168.20.64 255.255.255.192 10.10.10.6", "R6 LAN, via R3"),
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
      L("interface e0/2", "to R6"),
      L(" ip address 10.10.10.21 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/3", "LAN (gateway of VPC15)"),
      L(" ip address 192.168.10.129 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 10.10.10.0 255.255.255.252 10.10.10.10", "R1–R2 link"),
      L("ip route 10.10.10.12 255.255.255.252 10.10.10.10", "R4–R1 link"),
      L("ip route 10.10.10.16 255.255.255.252 10.10.10.10", "R1–R5 link"),
      L("ip route 192.168.10.0 255.255.255.192 10.10.10.10", "R1 LAN: the reply goes under (R4), not back through R2"),
      L("ip route 192.168.10.64 255.255.255.192 10.10.10.5", "R2 LAN"),
      L("ip route 192.168.10.192 255.255.255.192 10.10.10.10", "R4 LAN"),
      L("ip route 192.168.20.0 255.255.255.192 10.10.10.10", "R5 LAN: replies to R5 also go under, via R4"),
      L("ip route 192.168.20.64 255.255.255.192 10.10.10.22", "R6 LAN, direct neighbour"),
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
      L("interface e0/2", "LAN (gateway of VPC16)"),
      L(" ip address 192.168.10.193 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 10.10.10.0 255.255.255.252 10.10.10.14", "R1–R2 link"),
      L("ip route 10.10.10.4 255.255.255.252 10.10.10.14", "R2–R3 link"),
      L("ip route 10.10.10.16 255.255.255.252 10.10.10.14", "R1–R5 link"),
      L("ip route 10.10.10.20 255.255.255.252 10.10.10.9", "R3–R6 link"),
      L("ip route 192.168.10.0 255.255.255.192 10.10.10.14", "R1 LAN"),
      L("ip route 192.168.10.64 255.255.255.192 10.10.10.14", "R2 LAN, via R1"),
      L("ip route 192.168.10.128 255.255.255.192 10.10.10.9", "R3 LAN"),
      L("ip route 192.168.20.0 255.255.255.192 10.10.10.14", "R5 LAN, via R1"),
      L("ip route 192.168.20.64 255.255.255.192 10.10.10.9", "R6 LAN, via R3"),
    ],
  },
  {
    id: "R5",
    kind: "router",
    lines: [
      L("interface e0/0", "to R1 (the only way out)"),
      L(" ip address 10.10.10.18 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/1", "LAN (gateway of VPC17)"),
      L(" ip address 192.168.20.1 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 0.0.0.0 0.0.0.0 10.10.10.17", "default route: everything not local leaves via R1"),
    ],
  },
  {
    id: "R6",
    kind: "router",
    lines: [
      L("interface e0/0", "to R3 (the only way out)"),
      L(" ip address 10.10.10.22 255.255.255.252"),
      L(" no shutdown"),
      L("interface e0/1", "LAN (gateway of VPC18)"),
      L(" ip address 192.168.20.65 255.255.255.192"),
      L(" no shutdown"),
      L("ip route 0.0.0.0 0.0.0.0 10.10.10.21", "default route: everything not local leaves via R3"),
    ],
  },
  { id: "VPC13", kind: "pc", lines: [L("ip 192.168.10.2/26 192.168.10.1")] },
  { id: "VPC14", kind: "pc", lines: [L("ip 192.168.10.66/26 192.168.10.65")] },
  { id: "VPC15", kind: "pc", lines: [L("ip 192.168.10.130/26 192.168.10.129")] },
  { id: "VPC16", kind: "pc", lines: [L("ip 192.168.10.194/26 192.168.10.193")] },
  { id: "VPC17", kind: "pc", lines: [L("ip 192.168.20.2/26 192.168.20.1")] },
  { id: "VPC18", kind: "pc", lines: [L("ip 192.168.20.66/26 192.168.20.65")] },
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
const SKY = "#38bdf8";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";

export function AsymmetricRoutingLab3() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 1840 }}>
  <div style={{ overflowX: "auto" }}>
    <NetLab title="Asymmetric Routing Lab 3" width={1800} height={1180}>
      <Note x={300} y={30}>192.168.10.XX/26 and 192.168.20.XX/26 LANs</Note>
      <Note x={300} y={54}>10.10.10.XX/30 router links</Note>

      {/* ring */}
      <Cable a="R1:e0/0" b="R2:e0/0" aTag=".1" bTag=".2" />
      <Cable a="R2:e0/1" b="R3:e0/0" aTag=".5" bTag=".6" />
      <Cable a="R3:e0/1" b="R4:e0/0" aTag=".9" bTag=".10" />
      <Cable a="R4:e0/1" b="R1:e0/1" aTag=".13" bTag=".14" />
      {/* stub routers */}
      <Cable a="R1:e0/2" b="R5:e0/0" aTag=".17" bTag=".18" />
      <Cable a="R3:e0/2" b="R6:e0/0" aTag=".21" bTag=".22" />
      {/* router ↔ switch */}
      <Cable a="R1:e0/3" b="SW7:e0/0" aTag=".1" />
      <Cable a="R2:e0/2" b="SW8:e0/0" aTag=".65" />
      <Cable a="R3:e0/3" b="SW9:e0/0" aTag=".129" />
      <Cable a="R4:e0/2" b="SW10:e0/0" aTag=".193" />
      <Cable a="R5:e0/1" b="SW11:e0/0" aTag=".1" />
      <Cable a="R6:e0/1" b="SW12:e0/0" aTag=".65" />
      {/* switch ↔ PC */}
      <Cable a="SW7:e0/1" b="VPC13:eth0" bTag=".2" />
      <Cable a="SW8:e0/1" b="VPC14:eth0" bTag=".66" />
      <Cable a="SW9:e0/1" b="VPC15:eth0" bTag=".130" />
      <Cable a="SW10:e0/1" b="VPC16:eth0" bTag=".194" />
      <Cable a="SW11:e0/1" b="VPC17:eth0" bTag=".2" />
      <Cable a="SW12:e0/1" b="VPC18:eth0" bTag=".66" />

      {/* router-link subnets: outside the diamond, clear of the cables */}
      <Note x={620}  y={330}>10.10.10.0/30</Note>
      <Note x={1180} y={330}>10.10.10.4/30</Note>
      <Note x={1180} y={680}>10.10.10.8/30</Note>
      <Note x={620}  y={680}>10.10.10.12/30</Note>
      <Note x={320}  y={650}>10.10.10.16/30</Note>
      <Note x={1480} y={650}>10.10.10.20/30</Note>

      {/* LAN subnets: beside their switch-to-PC cable */}
      <Note x={370}  y={330}>192.168.10.0/26</Note>
      <Note x={1080} y={112}>192.168.10.64/26</Note>
      <Note x={1695} y={360}>192.168.10.128/26</Note>
      <Note x={1080} y={972}>192.168.10.192/26</Note>
      <Note x={240}  y={1125}>192.168.20.0/26</Note>
      <Note x={1570} y={1125}>192.168.20.64/26</Note>

      {/* ring routers (diamond) */}
      <Router id="R1" x={560}  y={500} />
      <Router id="R2" x={900}  y={310} />
      <Router id="R3" x={1240} y={500} />
      <Router id="R4" x={900}  y={690} />

      {/* stub routers */}
      <Router id="R5" x={400}  y={820} />
      <Router id="R6" x={1400} y={820} />

      {/* LANs: ring */}
      <Switch id="SW7"  x={230}  y={500} />
      <VPC    id="VPC13" x={230}  y={230} />

      <Switch id="SW8"  x={900}  y={70} />
      <VPC    id="VPC14" x={1250} y={70} />

      <Switch id="SW9"  x={1570} y={500} />
      <VPC    id="VPC15" x={1570} y={230} />

      <Switch id="SW10" x={900}  y={940} />
      <VPC    id="VPC16" x={1250} y={940} />

      {/* LANs: stubs */}
      <Switch id="SW11" x={400}  y={1080} />
      <VPC    id="VPC17" x={60}   y={1080} />

      <Switch id="SW12" x={1400} y={1080} />
      <VPC    id="VPC18" x={1740} y={1080} />
    </NetLab>
  </div>


      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>Address every router interface and every PC from the diagram (each router takes the first usable address of its LAN, and each PC takes the next one).</li>
          <li>Bring the interfaces up and confirm with <code>show ip interface brief</code>.</li>
          <li>
            Configure R1–R4 with specific static routes, so that <strong>VPC13 → VPC15</strong> goes over the top
            (R1 → R2 → R3) and the reply comes back along the bottom (R3 → R4 → R1).
          </li>
          <li>
            Configure R5 and R6 with <strong>one default route each</strong> instead of a route per network, then
            check <code>show ip route</code> for "Gateway of last resort".
          </li>
          <li>Make every PC ping every other PC (watch the <em>Ping matrix</em> turn green).</li>
          <li>
            Run <code>trace</code> in both directions for VPC13 ↔ VPC15, then for VPC17 ↔ VPC15, and compare the
            paths with VPC13 ↔ VPC18.
          </li>
          <li>
            Break something on purpose: delete R5's default route and compare what VPC17 sees when it pings
            inside its own LAN, a ring LAN and VPC18.
          </li>
          <li>Save with <code>copy running-config startup-config</code> and test <code>reload</code>.</li>
        </ol>
      </details>

      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What the paths should look like</summary>
        <div style={{ marginTop: 8 }}>
          <PathRow label="VPC13 → VPC15" color={SKY} hops={["VPC13", "R1", "R2", "R3", "VPC15"]} />
          <PathRow label="VPC15 → VPC13" color={AMBER} hops={["VPC15", "R3", "R4", "R1", "VPC13"]} />
          <div style={{ height: 6 }} />
          <PathRow label="VPC17 → VPC15" color={SKY} hops={["VPC17", "R5", "R1", "R2", "R3", "VPC15"]} />
          <PathRow label="VPC15 → VPC17" color={AMBER} hops={["VPC15", "R3", "R4", "R1", "R5", "VPC17"]} />
          <div style={{ height: 6 }} />
          <PathRow label="VPC13 ↔ VPC18" color={GREEN} hops={["VPC13", "R1", "R4", "R3", "R6", "VPC18"]} />
          <p style={{ margin: "8px 0 0", opacity: 0.75 }}>
            The first two pairs are asymmetric: each router only decides where to send the next packet, so
            the reply doesn't have to retrace the request. The green row is a symmetric control, where R1 and R3
            both pick the bottom path, so request and reply share the same links. R5 and R6 never choose a side
            themselves: their default route hands every packet to the only router they are attached to, and R1
            and R3 make the real decision.
          </p>
          <p style={{ margin: "8px 0 0", opacity: 0.75 }}>
            In the <code>trace</code> output, look for R2's <code>10.10.10.2</code> on the way out and R4's{" "}
            <code>10.10.10.10</code> on the way back for VPC13 ↔ VPC15.
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