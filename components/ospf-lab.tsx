"use client";

/**
 * OSPF 1024 Lab — 8 routers, multi-area (10 / 20 / 0 / 30), two shared segments (SW9 = 200.10.7.0/24,
 * SW10 = 200.10.8.0/24), R–R links 200.10.XX.0/24, four loopbacks per router.
 *
 * Every device starts in its factory state (all interfaces shut, no IPs).
 * Click a device → console. Do the lab for real: addressing, no shutdown, router ospf, DR/BDR election.
 *
 * Needs the Cable from netsim.tsx where the IP tag is a separate chip beyond the interface pill.
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import { useState } from "react";
import { Copy, Check, Play, Zap } from "lucide-react";

const FONT = "13px/1.5 ui-sans-serif,system-ui,sans-serif";
const MONO = "12px/1.5 ui-monospace,Menlo,Consolas,monospace";
const CELL: React.CSSProperties = { padding: "6px 10px", textAlign: "left" };

/* ───────────────────────── answer key ───────────────────────── */

type KeyDevice = { id: string; kind: "router"; lines: string[] };

// [interface, network number (200.10.N.0/24), host, ospf priority?]
type Iface = [string, number, number, number?];

const ROUTERS: Record<string, Iface[]> = {
  R1: [["e0/0", 1, 1]],
  R2: [["e0/0", 2, 2]],
  R3: [["e0/0", 7, 3, 0], ["e0/1", 3, 3], ["e0/2", 5, 3], ["e0/3", 1, 3], ["e1/0", 2, 3]],
  R4: [["e0/0", 7, 4, 255], ["e0/1", 3, 4], ["e0/2", 4, 4]],
  R5: [["e0/0", 7, 5, 0], ["e0/1", 5, 5], ["e0/2", 6, 5]],
  R6: [["e0/0", 7, 6, 100], ["e0/1", 4, 6], ["e0/2", 6, 6], ["e0/3", 8, 6, 255]],
  R7: [["e0/0", 8, 7, 100]],
  R8: [["e0/0", 8, 8, 0]],
};

// [network, wildcard, area]. Loopbacks N.N.N.1–4 are covered by N.N.N.0 0.0.0.7 (matches .0–.7).
type Net = [string, string, number];
const L = (n: number, area: number): Net => [`${n}.${n}.${n}.0`, "0.0.0.7", area];
const K = (net: number, area: number): Net => [`200.10.${net}.0`, "0.0.0.255", area];
const OSPF_NETS: Record<string, Net[]> = {
  R1: [K(1, 10), L(1, 10)],
  R2: [K(2, 20), L(2, 20)],
  R3: [K(1, 10), K(2, 20), K(3, 0), K(5, 0), K(7, 0), L(3, 0)], // ABR: areas 10, 20, 0
  R4: [K(3, 0), K(4, 0), K(7, 0), L(4, 0)],
  R5: [K(5, 0), K(6, 0), K(7, 0), L(5, 0)],
  R6: [K(4, 0), K(6, 0), K(7, 0), K(8, 30), L(6, 0)], // ABR: areas 0, 30
  R7: [K(8, 30), L(7, 30)],
  R8: [K(8, 30), L(8, 30)],
};

const ANSWER_KEY: KeyDevice[] = Object.entries(ROUTERS).map(([id, ifs]) => {
  const n = id.slice(1);
  const lines: string[] = [];
  for (let i = 0; i < 4; i++) {
    lines.push(`interface loopback${i}`);
    lines.push(` ip address ${n}.${n}.${n}.${i + 1} 255.255.255.255`);
  }
  for (const [name, net, host, prio] of ifs) {
    lines.push(`interface ${name}`);
    lines.push(` ip address 200.10.${net}.${host} 255.255.255.0`);
    if (prio !== undefined) lines.push(` ip ospf priority ${prio}`);
    if (net <= 6) lines.push(" ip ospf network point-to-point"); // 1.0–6.0 hold two routers: no DR/BDR
    lines.push(" no shutdown");
  }
  lines.push("router ospf 1");
  lines.push(` router-id ${n}.${n}.${n}.1`);
  for (const [net, wc, area] of OSPF_NETS[id]) lines.push(` network ${net} ${wc} area ${area}`);
  return { id, kind: "router", lines };
});

// Expected DR / BDR result (the labels from the original drawing).
const ELECTION = [
  { seg: "200.10.7.0/24 (SW9)", dr: "R4 (200.10.7.4)", bdr: "R6 (200.10.7.6)", other: "R3, R5" },
  { seg: "200.10.8.0/24 (SW10)", dr: "R6 (200.10.8.6)", bdr: "R7 (200.10.8.7)", other: "R8" },
];

/* ───────────────────────── helpers ───────────────────────── */

// config=true → the listener enters config mode first if the router isn't already there.
function runOnDevice(device: string, commands: string[], config = false) {
  window.dispatchEvent(new CustomEvent("netlab:run", { detail: { device, commands, config } }));
}

function Colored({ line }: { line: string }) {
  const indent = line.length - line.trimStart().length;
  const [first, ...rest] = line.trim().split(" ");
  const color =
    first === "interface" || first === "router"
      ? "#c084fc"
      : first === "ip" || first === "no" || first === "network" || first === "router-id"
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

  // Indented line → include its parent ("interface …" / "router ospf …") so it works anywhere.
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
        runOnDevice(device.id, cmds, true);
        flash("ran");
      }}
      title="Click to run on this device"
      className="group flex items-center rounded-md px-2 py-[3px] cursor-pointer transition-colors hover:bg-sky-500/10"
      style={{ background: state === "ran" ? "rgba(34,197,94,.18)" : undefined }}
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
              device.lines.map((l) => l.trim()),
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
      <div style={{ padding: 6, display: open ? "block" : "none", font: MONO }}>
        {device.lines.map((_, i) => (
          <KeyLine key={i} device={device} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── the lab ───────────────────────── */

export function OspfLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: "100%", gridTemplateColumns: "minmax(0, 1fr)", width: "100%" }}>
      <div style={{ overflowX: "auto" }}>
        <NetLab title="OSPF 1024 Lab" width={1400} height={720}>
          <Note x={1230} y={30} size={22}>OSPF 1024</Note>
          <Note x={1230} y={58}>R–R: 200.10.XX.0/24</Note>
          <Note x={1230} y={80}>loopbacks N.N.N.1–4/32</Note>

          {/* point-to-point style links */}
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

          {/* subnet labels: beside each link, never on it */}
          <Note x={95} y={262}>Area 10</Note>
          <Note x={110} y={290}>200.10.1.0/24</Note>
          <Note x={110} y={470}>200.10.2.0/24</Note>
          <Note x={95} y={498}>Area 20</Note>
          <Note x={385} y={205}>200.10.3.0/24</Note>
          <Note x={385} y={555}>200.10.5.0/24</Note>
          <Note x={850} y={200}>200.10.4.0/24</Note>
          <Note x={850} y={560}>200.10.6.0/24</Note>
          <Note x={700} y={340}>200.10.7.0/24</Note>
          <Note x={700} y={312}>Area 0</Note>
          <Note x={1335} y={380}>200.10.8.0/24</Note>
          <Note x={1335} y={408}>Area 30</Note>

          {/* routers */}
          <Router id="R1" x={120} y={130} />
          <Router id="R2" x={120} y={630} />
          <Router
            id="R3"
            x={290}
            y={380}
            ports={["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3", "Ethernet1/0"]}
          />
          <Router id="R4" x={610} y={130} />
          <Router id="R5" x={610} y={630} />
          <Router id="R6" x={930} y={380} ports={["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"]} />
          <Router id="R7" x={1240} y={130} />
          <Router id="R8" x={1240} y={630} />

          {/* switches */}
          <Switch id="SW9" x={610} y={380} />
          <Switch id="SW10" x={1240} y={380} />
        </NetLab>
      </div>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>
            Address every router interface from the diagram (<code>200.10.XX.0/24</code>, host part = router number)
            and create <code>Loopback0</code> to <code>Loopback3</code> on each router (<code>N.N.N.1–4/32</code>).
          </li>
          <li>Bring the interfaces up and confirm with <code>show ip interface brief</code>.</li>
          <li>
            Enable <code>router ospf 1</code> on every router, set <code>router-id</code> to the first loopback
            (R1 = 1.1.1.1 … R8 = 8.8.8.1) and advertise each network with a wildcard mask in its area:{" "}
            <strong>Area 10</strong> = R1–R3 link, <strong>Area 20</strong> = R2–R3 link, <strong>Area 0</strong> =
            3.0 to 7.0, <strong>Area 30</strong> = 8.0 segment. Each loopback goes in its router's area (R3 and R6 use area 0).
          </li>
          <li>
            Check <code>show ip ospf neighbor</code> on R3, R4 and R6. Find which neighbors are <code>FULL</code> and
            which stay in <code>2WAY</code>, and explain why.
          </li>
          <li>
            Control the election on the two switch segments with <code>ip ospf priority</code> so that{" "}
            <strong>7.0: R4 = DR, R6 = BDR</strong> and <strong>8.0: R6 = DR, R7 = BDR</strong>. R3, R5 and R8 must never become DR or BDR (priority 0). Use <code>clear ip ospf process</code> if the election already happened (it does not preempt).
          </li>
          <li>
            On the six two-router links (1.0 to 6.0) set <code>ip ospf network point-to-point</code> on{" "}
            <strong>both</strong> ends, so no DR or BDR is elected there. Only 7.0 and 8.0 should end up with a DR and a
            BDR (2 DRs and 2 BDRs in total).
          </li>
          <li>
            Confirm with <code>show ip ospf interface e0/0</code> on R4, R6, R7 and R8 (look at State, DR and BDR).
          </li>
          <li>
            Check <code>show ip ospf</code> on R3 and R6 (they are the ABRs) and <code>show ip route ospf</code> on R1:
            networks from other areas show as <code>O IA</code>. Then run <code>traceroute</code> from R1 to 8.8.8.1.
          </li>
          <li>
            Break something on purpose: shut down R4's <code>e0/0</code> and watch the 7.0 segment elect a new DR.
          </li>
          <li>Save with <code>copy running-config startup-config</code> and test <code>reload</code>.</li>
        </ol>
      </details>

      <details style={{ font: FONT, minWidth: 0, overflowWrap: "anywhere" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>What OSPF should have learned</summary>
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
            R3 and R6 are Area Border Routers: R3 joins areas 10, 20 and 0, and R6 joins areas 0 and 30. R1, R2, R7 and R8 learn
            other areas' networks as inter-area routes (<code>O IA</code>). The six two-router links are set to point-to-point, so they elect no DR or BDR and their neighbors show <code>FULL/  -</code>. Only the two shared segments have more than two routers and elect a DR and BDR, so the whole network has exactly 2 DRs and 2 BDRs:
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", font: FONT, minWidth: 420 }}>
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
            DROTHER routers only form a <code>FULL</code> adjacency with the DR and BDR. So R3 and R5 (priority 0) stay in{" "}
            <code>2WAY</code> with each other on 7.0, while both are <code>FULL</code> with R4 and R6. R8 is{" "}
            <code>2WAY</code> with R7 on 8.0 but <code>FULL</code> with R6 (the DR). Neighbors that sit on two
            links (R3–R4, R3–R5, R4–R6, R5–R6) appear twice in <code>show ip ospf neighbor</code>, once per interface.
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