"use client";
import { normalizeKey, type LabExport } from "@/lib/lab-registry";

/**
 * Static Routing Lab 1 — 3 routers in a line, a switch + 2 PCs behind each, 192.168.XX.0/24 addressing.
 *
 * Every device starts in its factory state (routers: all interfaces shut, no IPs; PCs: no IP).
 * Click a device → console. Do the lab for real: addressing, no shutdown, ip route, ping.
 *
 * To build another lab, copy this file: change the coordinates, the <Cable>s and the notes.
 */
import { NetLab, Cable, Note } from "@/components/simulator/netsim";
import Router from "@/components/simulator/Router";
import Switch from "@/components/simulator/Switch"; import VPC from "@/components/simulator/VPC";

import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

type KeyDevice = { id: string; kind: "router" | "pc"; lines: string[] };

const ANSWER_KEY: KeyDevice[] = [
  {
    id: "R1",
    kind: "router",
    lines: [
      "interface e0/0",
      " ip address 192.168.4.1 255.255.255.0",
      " no shutdown",
      "interface e0/1",
      " ip address 192.168.1.100 255.255.255.0",
      " no shutdown",
      "ip route 192.168.2.0 255.255.255.0 192.168.4.2",
      "ip route 192.168.3.0 255.255.255.0 192.168.4.2",
      "ip route 192.168.5.0 255.255.255.0 192.168.4.2",
    ],
  },
  {
    id: "R2",
    kind: "router",
    lines: [
      "interface e0/0",
      " ip address 192.168.4.2 255.255.255.0",
      " no shutdown",
      "interface e0/1",
      " ip address 192.168.5.2 255.255.255.0",
      " no shutdown",
      "interface e0/2",
      " ip address 192.168.2.100 255.255.255.0",
      " no shutdown",
      "ip route 192.168.1.0 255.255.255.0 192.168.4.1",
      "ip route 192.168.3.0 255.255.255.0 192.168.5.3",
    ],
  },
  {
    id: "R3",
    kind: "router",
    lines: [
      "interface e0/0",
      " ip address 192.168.5.3 255.255.255.0",
      " no shutdown",
      "interface e0/1",
      " ip address 192.168.3.100 255.255.255.0",
      " no shutdown",
      "ip route 192.168.1.0 255.255.255.0 192.168.5.2",
      "ip route 192.168.2.0 255.255.255.0 192.168.5.2",
      "ip route 192.168.4.0 255.255.255.0 192.168.5.2",
    ],
  },
  { id: "VPC7", kind: "pc", lines: ["ip 192.168.1.1/24 192.168.1.100"] },
  { id: "VPC8", kind: "pc", lines: ["ip 192.168.1.2/24 192.168.1.100"] },
  { id: "VPC9", kind: "pc", lines: ["ip 192.168.2.1/24 192.168.2.100"] },
  { id: "VPC10", kind: "pc", lines: ["ip 192.168.2.2/24 192.168.2.100"] },
  { id: "VPC11", kind: "pc", lines: ["ip 192.168.3.1/24 192.168.3.100"] },
  { id: "VPC12", kind: "pc", lines: ["ip 192.168.3.2/24 192.168.3.100"] },
];

// config=true → the listener enters config mode first if the router isn't already there.
function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(
    new CustomEvent("netlab:run", { detail: { device, commands, config } }),
  );
}

function Colored({ line }: { line: string }) {
  const indent = line.length - line.trimStart().length;
  const [first, ...rest] = line.trim().split(" ");
  const color =
    first === "interface"
      ? "#c084fc"
      : first === "ip" || first === "no"
        ? "#38bdf8"
        : "inherit";
  return (
    <span style={{ whiteSpace: "pre-wrap", flexShrink: 1, minWidth: 0 }}>
      {" ".repeat(indent)}
      <span style={{ color, fontWeight: 600 }}>{first}</span> {rest.join(" ")}
    </span>
  );
}

function KeyLine({ device, index }: { device: KeyDevice; index: number }) {
  const [state, setState] = useState<"idle" | "ran" | "copied">("idle");
  const lines = device.lines,
    line = lines[index];

  // Indented line → include its parent "interface ..." line so it works anywhere.
  let cmds = [line.trim()];
  if (line.startsWith(" "))
    for (let i = index - 1; i >= 0; i--)
      if (!lines[i].startsWith(" ")) {
        cmds = [lines[i].trim(), line.trim()];
        break;
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
      style={{
        background: state === "ran" ? "rgba(34,197,94,.18)" : undefined,
      }}
    >
      <Colored line={line} />
      <span className="ml-auto flex shrink-0 items-center gap-2 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title="Copy only"
          className="text-muted-foreground hover:text-foreground"
          onClick={async (e) => {
            e.stopPropagation();
            await navigator.clipboard.writeText(line.trim());
            flash("copied");
          }}
        >
          {state === "copied" ? (
            <Check className="size-3.5 text-green-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        {state === "ran" ? (
          <Check className="size-3.5 text-green-500" />
        ) : (
          <Play className="size-3.5 text-sky-500" />
        )}
      </span>
    </div>
  );
}

function DeviceCard({ device }: { device: KeyDevice }) {
  const [ran, setRan] = useState(false);
  const [open, setOpen] = useState(false); // collapsed by default
  return (
    <div
      style={{
        alignSelf: "start",
        border: "1px solid rgba(128,128,128,.25)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
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
          onClick={() => {
            runOnDevice(
              device.id,
              device.lines.map((l) => l.trim()),
              device.kind === "router",
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
const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const SKY = "#38bdf8";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";

function PathRow({
  label,
  color,
  hops,
}: {
  label: string;
  color: string;
  hops: string[];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        margin: "5px 0",
      }}
    >
      <span style={{ minWidth: 130, color, fontWeight: 600 }}>{label}</span>
      {hops.map((h, i) => (
        <span
          key={i}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {i > 0 && <span style={{ opacity: 0.5 }}>›</span>}
          <span
            style={{
              border: `1.5px solid ${color}`,
              borderRadius: 999,
              padding: "1px 10px",
              font: "600 12px ui-monospace,Menlo,Consolas,monospace",
            }}
          >
            {h}
          </span>
        </span>
      ))}
    </div>
  );
}
export function StaticRoutingLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: "100%" }}>
      <div style={{ overflowX: "clip" }}>
        <NetLab title="Static Routing Lab 1" width={1200} height={740}>
          <Note x={600} y={34} size={22}>
            192.168.XX.0/24
          </Note>

          {/* backbone */}
          <Cable a="R1:e0/0" b="R2:e0/0" aTag=".1" bTag=".2" />
          <Cable a="R2:e0/1" b="R3:e0/0" aTag=".2" bTag=".3" />
          {/* router ↔ switch */}
          <Cable a="R1:e0/1" b="SW4:e0/0" aTag=".100" />
          <Cable a="R2:e0/2" b="SW5:e0/0" aTag=".100" />
          <Cable a="R3:e0/1" b="SW6:e0/0" aTag=".100" />
          {/* switch ↔ PCs */}
          <Cable a="SW4:e0/1" b="VPC7:eth0" bTag=".1" />
          <Cable a="SW4:e0/2" b="VPC8:eth0" bTag=".2" />
          <Cable a="SW5:e0/2" b="VPC9:eth0" bTag=".1" />
          <Cable a="SW5:e0/1" b="VPC10:eth0" bTag=".2" />
          <Cable a="SW6:e0/1" b="VPC11:eth0" bTag=".1" />
          <Cable a="SW6:e0/2" b="VPC12:eth0" bTag=".2" />

          {/* subnet labels: backbone above the cable, LANs under the PCs */}
          <Note x={400} y={88}>
            4.0/24
          </Note>
          <Note x={800} y={88}>
            5.0/24
          </Note>
          <Note x={200} y={705}>
            1.0/24
          </Note>
          <Note x={600} y={705}>
            2.0/24
          </Note>
          <Note x={1000} y={705}>
            3.0/24
          </Note>

          {/* routers */}
          <Router id="R1" x={200} y={130} />
          <Router id="R2" x={600} y={130} />
          <Router id="R3" x={1000} y={130} />

          {/* switches */}
          <Switch id="SW4" x={200} y={370} />
          <Switch id="SW5" x={600} y={370} />
          <Switch id="SW6" x={1000} y={370} />

          {/* PCs: 90px outward from each switch, 230px down */}
          <VPC id="VPC7" x={90} y={600} />
          <VPC id="VPC8" x={310} y={600} />
          <VPC id="VPC9" x={490} y={600} />
          <VPC id="VPC10" x={710} y={600} />
          <VPC id="VPC11" x={890} y={600} />
          <VPC id="VPC12" x={1110} y={600} />
        </NetLab>
      </div>
      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Objectives
        </summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Address every router interface and every PC from the diagram. The
            backbone uses the router number as the host part (R2 is{" "}
            <code>.2</code>), each router takes <code>.100</code> on its LAN,
            and the PCs use <code>.1</code> and <code>.2</code> with the router
            as their gateway.
          </li>
          <li>
            Bring the interfaces up and confirm with{" "}
            <code>show ip interface brief</code>.
          </li>
          <li>
            Add static routes so every PC can ping every other PC. R1 and R3
            each need 3 routes and R2 needs 2. Work out why before you type
            them, and check them with <code>show ip route static</code>.
          </li>
          <li>
            Make every PC ping every other PC (watch the <em>Ping matrix</em>{" "}
            turn green).
          </li>
          <li>
            Run <code>trace</code> from VPC7 to VPC12, then from VPC12 to VPC7,
            and compare the two paths.
          </li>
          <li>
            Break something on purpose: delete R2's route to{" "}
            <code>192.168.3.0/24</code> and see which direction fails even
            though the request still arrives.
          </li>
          <li>
            Save with <code>copy running-config startup-config</code> and test{" "}
            <code>reload</code>.
          </li>
        </ol>
      </details>

      <details style={{ font: FONT }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          What static routing should look like
        </summary>
        <div style={{ marginTop: 8 }}>
          <PathRow
            label="VPC7 → VPC12"
            color={SKY}
            hops={["VPC7", "R1", "R2", "R3", "VPC12"]}
          />
          <PathRow
            label="VPC12 → VPC7"
            color={AMBER}
            hops={["VPC12", "R3", "R2", "R1", "VPC7"]}
          />
          <PathRow
            label="VPC7 → VPC8"
            color={GREEN}
            hops={["VPC7", "SW4", "VPC8"]}
          />
          <p style={{ margin: "8px 0 0", opacity: 0.75 }}>
            Static routes are stateless, so each router decides only where to
            send the next packet, and the reply needs its own routes on the way
            back. Here there is only one path through the line, so both
            directions use the same routers. The green row never leaves the LAN:
            both PCs are in the same subnet, so the switch delivers the frame
            and no router is involved. The two <code>trace</code> outputs show
            the difference: the first should list R1's{" "}
            <code>192.168.1.100</code>, R2's <code>192.168.4.2</code> and R3's{" "}
            <code>192.168.5.3</code>, and the second should list R3's{" "}
            <code>192.168.3.100</code>, R2's <code>192.168.5.2</code> and R1's{" "}
            <code>192.168.4.1</code>.
          </p>
        </div>
      </details>

      <details style={{ font: "13px/1.5 ui-sans-serif,system-ui,sans-serif" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Answer key (click a line to run it, or "Run all" per device)
        </summary>
        <div
          style={{
            marginTop: 8,
            maxHeight: 420,
            overflowY: "auto",
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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

export const LAB_EXPORT: LabExport = { answerKey: normalizeKey(ANSWER_KEY) };
