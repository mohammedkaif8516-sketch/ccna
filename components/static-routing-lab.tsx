"use client";

/**
 * Static Routing Lab 1 — 3 routers in a line, a switch + 2 PCs behind each, 192.168.XX.0/24 addressing.
 *
 * Every device starts in its factory state (routers: all interfaces shut, no IPs; PCs: no IP).
 * Click a device → console. Do the lab for real: addressing, no shutdown, ip route, ping.
 *
 * To build another lab, copy this file: change the coordinates, the <Cable>s and the notes.
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import VPC from "./VPC";
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
    <span style={{ whiteSpace: "pre" }}>
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
      <span className="ml-auto flex items-center gap-2 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
  return (
    <div
      style={{
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
        {device.id}
        <button
          onClick={() =>
            runOnDevice(
              device.id,
              device.lines.map((l) => l.trim()),
              device.kind === "router",
            )
          }
          className="ml-auto inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-[11px] text-white hover:bg-sky-500"
        >
          <Zap className="size-3" /> Run all
        </button>
      </div>
      <div
        style={{
          padding: 6,
          font: "12px/1.5 ui-monospace,Menlo,Consolas,monospace",
        }}
      >
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

export function StaticRoutingLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 940 }}>
      <NetLab title="Static Routing Lab 1" width={880} height={600}>
        <Note x={440} y={34} size={22}>
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

        <Note x={295} y={78}>
          4.0/24
        </Note>
        <Note x={585} y={78}>
          5.0/24
        </Note>
        <Note x={150} y={572}>
          1.0/24
        </Note>
        <Note x={440} y={572}>
          2.0/24
        </Note>
        <Note x={730} y={572}>
          3.0/24
        </Note>

        <Router id="R1" x={150} y={130} />
        <Router id="R2" x={440} y={130} />
        <Router id="R3" x={730} y={130} />
        <Switch id="SW4" x={150} y={300} />
        <Switch id="SW5" x={440} y={300} />
        <Switch id="SW6" x={730} y={300} />
        <VPC id="VPC7" x={60} y={470} />
        <VPC id="VPC8" x={240} y={470} />
        <VPC id="VPC9" x={350} y={470} />
        <VPC id="VPC10" x={530} y={470} />
        <VPC id="VPC11" x={640} y={470} />
        <VPC id="VPC12" x={820} y={470} />
      </NetLab>

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
