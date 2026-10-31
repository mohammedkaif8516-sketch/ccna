"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * SwitchingVlanExplainer  (CCNA Topic 10, ongoing)
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ HOW TO ADD THE NEXT SUBTOPIC (search for the numbered markers below)     │
 * │                                                                          │
 * │  (1/5) TABS            add { id, label } to the TABS array               │
 * │  (2/5) SECTION         write a new <XxxSection /> function. Copy any     │
 * │                        existing section as a template. Each section is   │
 * │                        a self-contained function with its own state.     │
 * │  (3/5) RENDER          render it in the tab switch in the main component │
 * │  (4/5) NOTES DATA      add rows to CMD_ROWS, MYTHS and QA, and add the   │
 * │                        new subtopic name to GROUPS (the filter pills)    │
 * │  (5/5) CSS             new animations go in the <style> block at the end │
 * │                                                                          │
 * │ Likely next subtopics: VTP, STP, EtherChannel, inter-VLAN routing        │
 * │ (router-on-a-stick, SVI), voice VLAN, port security.                     │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Current sections
 *   1 Forwarding      : store and forward, fragment-free, cut-through (animated race)
 *   2 MLS and ports   : ip routing, switchport vs routed port, default interface
 *   3 VLAN basics     : broadcast domains, ranges, advantages, static vs dynamic (VMPS)
 *   4 VLAN config     : create, delete, vlan.dat, show vlan brief (live switch)
 *   5 Access ports    : one VLAN per port, the missing-VLAN-on-a-transit-switch case
 *   6 Trunks, tagging : ISL vs 802.1Q, tag anatomy, tagged vs untagged hops
 *   7 Trunk config    : allowed VLAN list builder, trunk troubleshooting checklist
 *   8 Native VLAN     : default vs native, double tagging attack and fixes
 *   9 DTP             : mode combination matrix, timers, disabling negotiation
 *  10 Commands        : searchable cheat sheet
 *  11 Common mistakes : wrong belief on the front, the truth on the back
 *  12 Interview prep  : 30-second answer and the usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";
const GREY = "#868e96";

/* ▼▼▼ (1/5) TABS: add the next subtopic tab here ▼▼▼ */
const TABS = [
  { id: "fwd", label: "1 · Forwarding" },
  { id: "mls", label: "2 · MLS and ports" },
  { id: "vlan", label: "3 · VLAN basics" },
  { id: "cfg", label: "4 · VLAN config" },
  { id: "access", label: "5 · Access ports" },
  { id: "trunk", label: "6 · Trunks and tagging" },
  { id: "tcfg", label: "7 · Trunk config" },
  { id: "native", label: "8 · Native VLAN" },
  { id: "dtp", label: "9 · DTP" },
  { id: "ech", label: "10 · EtherChannel" },
  { id: "echcfg", label: "11 · EtherChannel config" },
  { id: "ivr", label: "12 · Inter-VLAN routing" },
  { id: "tier", label: "13 · 3-tier design" },
  // ▲ ADD NEW TABS ABOVE THIS LINE, for example: { id: "vtp", label: "10 · VTP" },
  { id: "cmds", label: "Commands" },
  { id: "myths", label: "Common mistakes" },
  { id: "interview", label: "Interview prep" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ───────────────────────── small helpers ───────────────────────── */

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border bg-background p-4 ${className}`}>
      {children}
    </div>
  );
}

function Tip({
  title = "Remember",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-primary">{title}: </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function Pick({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function SimpleTable({
  head,
  rows,
  hit,
}: {
  head: string[];
  rows: string[][];
  hit?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-t"
              style={hit === i ? { color: GREEN, fontWeight: 600 } : undefined}
            >
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`px-3 py-2 ${j === 0 ? "font-semibold" : ""}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

function Mini({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {k}
      </p>
      <p
        className="break-words text-xs font-medium"
        style={color ? { color } : undefined}
      >
        {v}
      </p>
    </div>
  );
}

function Code({ lines }: { lines: string[] }) {
  return (
    <pre className="whitespace-pre-wrap break-words rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300">
      {lines.join("\n")}
    </pre>
  );
}

/* ───────────────────────── 1 · forwarding methods ───────────────────────── */

const FR = 40; // the frame is drawn as 40 cells of roughly 38 bytes each
type Dmg = "none" | "early" | "late";
const FMETH = [
  {
    id: "sf",
    name: "Store and forward",
    thr: FR,
    reads: "The entire frame, then checks the CRC (FCS)",
    speed: "Slowest start, highest latency",
    errs: "Catches every damaged frame",
    use: "Sensitive environments, mixed port speeds",
    c: BLUE,
  },
  {
    id: "ff",
    name: "Fragment-free (modified cut-through)",
    thr: 2,
    reads: "The first 64 bytes",
    speed: "In between",
    errs: "Catches collision fragments and damage in the first 64 bytes",
    use: "A compromise",
    c: PURPLE,
  },
  {
    id: "ct",
    name: "Cut-through",
    thr: 1,
    reads: "Only the destination MAC (the first 6 bytes)",
    speed: "Fastest, lowest latency",
    errs: "None: damaged frames are forwarded too",
    use: "Real-time traffic such as voice and video",
    c: GREEN,
  },
];

function ForwardSection() {
  const [dmg, setDmg] = useState<Dmg>("none");
  const [t, setT] = useState(0);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!play) return;
    if (t >= FR * 2) {
      setPlay(false);
      return;
    }
    const id = setTimeout(() => setT((v) => v + 1), 60);
    return () => clearTimeout(id);
  }, [play, t]);

  const rec = Math.min(t, FR);
  const dIdx = dmg === "early" ? 1 : dmg === "late" ? FR - 1 : -1;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          Three ways a switch forwards a frame
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          They trade speed against error checking. The question is how much of
          the frame the switch reads before it starts sending it out.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Race the three methods</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Blue = received. Green = already forwarded. The amber underline is
          where each method decides. Choose a damaged frame to see who catches
          it.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pick
            active={dmg === "none"}
            onClick={() => {
              setDmg("none");
              setT(0);
              setPlay(false);
            }}
          >
            Healthy frame
          </Pick>
          <Pick
            active={dmg === "early"}
            onClick={() => {
              setDmg("early");
              setT(0);
              setPlay(false);
            }}
          >
            Damaged in the first 64 bytes
          </Pick>
          <Pick
            active={dmg === "late"}
            onClick={() => {
              setDmg("late");
              setT(0);
              setPlay(false);
            }}
          >
            Damaged near the end (bad FCS)
          </Pick>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (t >= FR * 2) setT(0);
              setPlay((p) => !p);
            }}
          >
            {play
              ? "Pause"
              : t >= FR * 2
                ? "Replay"
                : t === 0
                  ? "Send frame"
                  : "Resume"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPlay(false);
              setT(0);
            }}
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {FMETH.map((m) => {
            const dropped =
              m.id === "sf"
                ? dmg !== "none"
                : m.id === "ff"
                  ? dmg === "early"
                  : false;
            const decided = rec >= m.thr;
            const fwd = decided && !dropped ? Math.min(FR, t - m.thr + 1) : 0;
            return (
              <div key={m.id}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold" style={{ color: m.c }}>
                    {m.name}
                  </span>
                  {decided && (
                    <span
                      key={`${dmg}-${dropped}`}
                      className="n10-pop rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        color: dropped ? RED : dmg !== "none" ? AMBER : GREEN,
                        borderColor: dropped
                          ? RED
                          : dmg !== "none"
                            ? AMBER
                            : GREEN,
                      }}
                    >
                      {dropped
                        ? "Dropped: error caught"
                        : dmg !== "none"
                          ? "Forwarded the damaged frame"
                          : "Forwarded"}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex gap-px">
                  {Array.from({ length: FR }, (_, i) => (
                    <div
                      key={i}
                      className="h-4 flex-1 transition-colors duration-150"
                      style={{
                        background:
                          i < fwd
                            ? GREEN
                            : i < rec
                              ? dropped && decided
                                ? `${RED}80`
                                : BLUE
                              : "rgba(128,128,128,.18)",
                        outline:
                          i === dIdx && rec > i
                            ? `2px solid ${RED}`
                            : undefined,
                        borderBottom:
                          i === Math.min(m.thr, FR) - 1
                            ? `3px solid ${AMBER}`
                            : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            Cut-through never looks at the FCS, so a corrupted frame is passed
            on. Fragment-free only catches damage inside the first 64 bytes,
            where collisions leave their mark. Store and forward is the only
            method that checks the whole frame.
          </Tip>
        </div>
      </Panel>

      <SimpleTable
        head={["Method", "Reads", "Speed", "Error checking", "Suits"]}
        rows={FMETH.map((m) => [m.name, m.reads, m.speed, m.errs, m.use])}
      />
      <Tip title="Also good to know">
        Store and forward is the only method that works between ports of
        different speeds, because the whole frame is already buffered. The real
        latency gap between methods is only microseconds.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 2 · MLS and ports ───────────────────────── */

function MlsSection() {
  const [routing, setRouting] = useState(false);
  const [p0, setP0] = useState(false);
  const [p1, setP1] = useState(false);
  const [t, setT] = useState(0);
  const [st, setSt] = useState<"idle" | "run" | "fail" | "ok">("idle");

  const why = !routing
    ? "ip routing is off (the default). The switch only switches and will not route between interfaces."
    : !p0
      ? "f0/0 is still a switchport (Layer 2). It cannot hold an IP address or route."
      : !p1
        ? "f0/1 is still a switchport (Layer 2). It cannot hold an IP address or route."
        : "";

  useEffect(() => {
    if (st !== "run") return;
    const id = setTimeout(() => {
      if (t === 0) setT(1);
      else if (t === 1) {
        if (why) setSt("fail");
        else {
          setT(2);
          setSt("ok");
        }
      }
    }, 800);
    return () => clearTimeout(id);
  }, [st, t, why]);

  const reset = () => {
    setT(0);
    setSt("idle");
  };
  const cfg = [
    ...(routing ? ["Switch(config)# ip routing"] : []),
    ...(p0
      ? [
          "Switch(config)# interface f0/0",
          "Switch(config-if)# no switchport",
          "Switch(config-if)# ip address 192.168.1.1 255.255.255.0",
          "Switch(config-if)# no shutdown",
        ]
      : []),
    ...(p1
      ? [
          "Switch(config)# interface f0/1",
          "Switch(config-if)# no switchport",
          "Switch(config-if)# ip address 192.168.2.1 255.255.255.0",
          "Switch(config-if)# no shutdown",
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          A multilayer switch can route, but routing starts switched off
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          To make a multilayer switch (MLS) route, turn on ip routing and
          convert the ports you want to routed (Layer 3) ports.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">
          Can PC-A (192.168.1.0/24) reach PC-B (192.168.2.0/24)?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick
            active={routing}
            onClick={() => {
              setRouting((v) => !v);
              reset();
            }}
          >
            {routing ? "ip routing: ON" : "ip routing: OFF"}
          </Pick>
          <Pick
            active={p0}
            onClick={() => {
              setP0((v) => !v);
              reset();
            }}
          >
            {p0 ? "f0/0: routed (no switchport)" : "f0/0: switchport (L2)"}
          </Pick>
          <Pick
            active={p1}
            onClick={() => {
              setP1((v) => !v);
              reset();
            }}
          >
            {p1 ? "f0/1: routed (no switchport)" : "f0/1: switchport (L2)"}
          </Pick>
        </div>

        <div className="relative mx-6 mt-8 h-16">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
          {["PC-A", "Multilayer switch", "PC-B"].map((n, i) => (
            <div
              key={n}
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md border bg-background px-2 py-1 text-xs font-bold"
              style={{
                left: `${i * 50}%`,
                borderColor:
                  st === "fail" && t === 1 && i === 1 ? RED : undefined,
              }}
            >
              {n}
            </div>
          ))}
          <div
            className="absolute top-[13px] h-3.5 w-3.5 -translate-x-1/2 rounded-full transition-all duration-700"
            style={{
              left: `${t * 50}%`,
              background: st === "fail" ? RED : BLUE,
            }}
          />
          {st === "fail" && (
            <p
              className="n10-pop absolute top-9 text-xs font-bold"
              style={{ left: "50%", transform: "translateX(-50%)", color: RED }}
            >
              ✕ dropped
            </p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            disabled={st === "run"}
            onClick={() => {
              setT(0);
              setSt("run");
            }}
          >
            Ping A to B
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>
        <p
          key={st + t}
          className="n10-fade mt-3 min-h-[2.5rem] text-xs leading-5"
          style={{
            color: st === "fail" ? RED : st === "ok" ? GREEN : undefined,
          }}
        >
          {st === "idle" && (
            <span className="text-muted-foreground">
              Set things up, then press Ping.
            </span>
          )}
          {st === "run" && (
            <span className="text-muted-foreground">Packet in flight...</span>
          )}
          {st === "ok" &&
            "Routed. Both ports are Layer 3 and routing is enabled, so the switch forwards between the two networks."}
          {st === "fail" && why}
        </p>
        <div className="mt-3">
          {cfg.length ? (
            <Code lines={cfg} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Your configuration will appear here as you switch things on.
            </p>
          )}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Switchport vs routed port</p>
        <div className="mt-3">
          <SimpleTable
            head={["", "Layer 2 port (switchport)", "Layer 3 port (routed)"]}
            rows={[
              ["Command", "switchport", "no switchport"],
              ["IP address", "Not allowed", "Allowed"],
              [
                "VLAN membership",
                "Yes (access or trunk)",
                "None. It is not part of any VLAN",
              ],
              ["Forwards by", "MAC address", "IP address (routing)"],
            ]}
          />
        </div>
        <div className="mt-3">
          <Code
            lines={[
              "! back to a Layer 2 port",
              "(conf)# interface f0/0",
              "(conf-if)# switchport",
              "(conf-if)# no shutdown",
              "",
              "! wipe an interface to factory defaults",
              "(conf)# default interface f0/0",
              "(conf)# default interface range f0/0-3, f2/1-2, f3/0",
            ]}
          />
        </div>
      </Panel>

      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example SVIs and inter-VLAN routing on an MLS ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 3 · VLAN basics ───────────────────────── */

const VCOL: Record<number, string> = {
  1: GREY,
  10: BLUE,
  20: GREEN,
  30: AMBER,
};
const VNAMES = ["PC1", "PC2", "PC3", "PC4", "PC5", "PC6"];

const MEMBER_STEPS: Record<
  "static" | "dynamic",
  { t: string; d: string; chip?: "r" | "l" }[]
> = {
  static: [
    {
      t: "Admin configures the port",
      d: "switchport access vlan 10 is typed on the port by hand.",
    },
    {
      t: "Port joins at once",
      d: "The port is immediately a member of VLAN 10. No negotiation, nothing to wait for.",
    },
  ],
  dynamic: [
    {
      t: "A host plugs in",
      d: "The switch does not know yet which VLAN the port belongs to.",
    },
    {
      t: "VMPS request",
      d: "The switch sends a request to the VMPS server with the host MAC address.",
      chip: "r",
    },
    {
      t: "Server looks it up",
      d: "The VMPS server finds that MAC in its VLAN database.",
    },
    {
      t: "VMPS reply",
      d: "The server answers with the VLAN number.",
      chip: "l",
    },
    {
      t: "Port joins the VLAN",
      d: "Only now does the port become a member. Slow, complex and Cisco proprietary, so rarely used.",
    },
  ],
};

function VlanSection() {
  const [vl, setVl] = useState<number[]>([10, 10, 20, 20, 30, 30]);
  const [sender, setSender] = useState(0);
  const [bn, setBn] = useState(1);
  const [mode, setMode] = useState<"static" | "dynamic">("dynamic");
  const [ms, setMs] = useState(0);
  const [ref, setRef] = useState(0);
  const steps = MEMBER_STEPS[mode];

  const hears = (i: number) => i !== sender && vl[i] === vl[sender];
  const count = vl.filter((_, i) => hears(i)).length;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">A VLAN is a broadcast domain</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          By default every port is in one broadcast domain,{" "}
          <span className="font-semibold text-foreground">VLAN 1</span>, the
          default VLAN, which cannot be deleted. VLANs let you split a switch
          into logical networks. Devices in the same VLAN talk by switching.
          Devices in different VLANs are on different networks and need a Layer
          3 device (inter-VLAN routing).
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Who hears a broadcast?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a sender, change any PC&apos;s VLAN, then send a broadcast.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VNAMES.map((n, i) => {
            const on = hears(i);
            const isS = i === sender;
            return (
              <div
                key={`${n}-${bn}-${on}`}
                className={`rounded-lg border-2 p-2 text-center transition-all duration-300 ${on ? "n10-ring" : ""}`}
                style={{
                  borderColor: VCOL[vl[i]],
                  opacity: isS || on || bn === 1 ? 1 : 0.4,
                  background: on ? `${VCOL[vl[i]]}22` : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSender(i);
                    setBn(1);
                  }}
                  className="text-sm font-bold"
                >
                  {n} {isS ? "📣" : ""}
                </button>
                <div className="mt-1 flex justify-center gap-1">
                  {[1, 10, 20, 30].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setVl((a) => a.map((x, k) => (k === i ? v : x)));
                        setBn(1);
                      }}
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white transition-opacity"
                      style={{
                        background: VCOL[v],
                        opacity: vl[i] === v ? 1 : 0.3,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {bn > 1 && (
                  <p
                    className="n10-pop mt-1 text-[11px] font-semibold"
                    style={{ color: on ? GREEN : isS ? BLUE : RED }}
                  >
                    {isS ? "sender" : on ? "hears it" : "never sees it"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={() => setBn((v) => v + 1)}>
            Send broadcast from {VNAMES[sender]}
          </Button>
        </div>
        {bn > 1 && (
          <p key={bn} className="n10-fade mt-2 text-xs font-medium">
            {count} other PC{count === 1 ? "" : "s"} in VLAN {vl[sender]}{" "}
            received it. Everyone else never saw it: less broadcast traffic,
            better performance.
          </p>
        )}
        <div className="mt-3">
          <Tip>
            Two PCs in different VLANs cannot reach each other through the
            switch alone. Each VLAN is its own network and needs inter-VLAN
            routing.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Static vs dynamic membership</p>
        <div className="mt-3 flex gap-2">
          <Pick
            active={mode === "static"}
            onClick={() => {
              setMode("static");
              setMs(0);
            }}
          >
            Static
          </Pick>
          <Pick
            active={mode === "dynamic"}
            onClick={() => {
              setMode("dynamic");
              setMs(0);
              setRef((v) => v + 1);
            }}
          >
            Dynamic (VMPS)
          </Pick>
        </div>
        <div className="mt-4 grid grid-cols-[100px_1fr_100px] items-center gap-2">
          <div className="rounded-lg border p-2 text-center text-xs font-bold">
            Switch
          </div>
          <div className="relative h-8">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            {steps[ms].chip && (
              <span
                key={`${mode}${ms}${ref}`}
                className={`${steps[ms].chip === "r" ? "n10-flyR" : "n10-flyL"} absolute top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white`}
              >
                {steps[ms].chip === "r" ? "VMPS request" : "VLAN reply"}
              </span>
            )}
          </div>
          <div
            className="rounded-lg border p-2 text-center text-xs font-bold"
            style={{ opacity: mode === "dynamic" ? 1 : 0.3 }}
          >
            VMPS server
          </div>
        </div>
        <div key={`${mode}-${ms}`} className="n10-fade mt-3">
          <p className="text-xs text-muted-foreground">
            Step {ms + 1} of {steps.length}
          </p>
          <p className="text-sm font-semibold">{steps[ms].t}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {steps[ms].d}
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={ms === 0}
            onClick={() => setMs((v) => v - 1)}
          >
            Back
          </Button>
          <Button
            size="sm"
            disabled={ms === steps.length - 1}
            onClick={() => {
              setMs((v) => v + 1);
              setRef((v) => v + 1);
            }}
          >
            Next step
          </Button>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">VLAN ranges</p>
          <div className="mt-3">
            <SimpleTable
              head={["Range", "VLANs", "Notes"]}
              rows={[
                [
                  "Normal",
                  "1 to 1005",
                  "1002 to 1005 are reserved defaults. Stored in vlan.dat",
                ],
                [
                  "Extended",
                  "1006 to 4094",
                  "Needs VTP transparent or off mode on many switches",
                ],
              ]}
            />
          </div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Example VLAN plan</p>
          <div className="mt-3">
            <SimpleTable
              head={["VLAN", "Department", "Subnet"]}
              rows={[
                ["10", "HR", "192.168.10.0/24"],
                ["20", "IT", "192.168.20.0/24"],
                ["30", "Mgmt", "192.168.30.0/24"],
                ["40", "R&D", "192.168.40.0/24"],
                ["50", "Sales", "192.168.50.0/24"],
                ["60", "CCTV", "192.168.60.0/24"],
                [
                  "999",
                  "Unused ports",
                  "Park unused ports here (and shut them down)",
                ],
              ]}
            />
          </div>
        </Panel>
      </div>

      <Panel>
        <p className="text-sm font-semibold">Advantages of VLANs</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Mini
            k="Performance"
            v="Less unnecessary broadcast traffic"
            color={BLUE}
          />
          <Mini
            k="Security"
            v="Users and departments are separated, and ACLs can control inter-VLAN traffic"
            color={GREEN}
          />
          <Mini
            k="Flexibility"
            v="No physical boundaries: a user can sit anywhere"
            color={AMBER}
          />
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example VTP or voice VLAN ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 4 · VLAN config ───────────────────────── */

const DEF_VLANS: [number, string][] = [
  [1002, "fddi-default"],
  [1003, "token-ring-default"],
  [1004, "fddinet-default"],
  [1005, "trnet-default"],
];

function parseIds(s: string): number[] | null {
  const out: number[] = [];
  for (const part of s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b > 4094 || b < a || b - a > 200) return null;
    for (let i = a; i <= b; i++) out.push(i);
  }
  return out.length ? out : null;
}

function CfgSection() {
  const [vlans, setVlans] = useState<Record<number, string>>({
    1: "default",
    10: "HR",
    20: "IT",
  });
  const [ports, setPorts] = useState<number[]>([10, 10, 20, 20, 1, 1, 1, 1]);
  const [ids, setIds] = useState("30");
  const [name, setName] = useState("Mgmt");
  const [msg, setMsg] = useState<{ t: string; bad?: boolean }>({
    t: "Type a VLAN number (or a list like 10-12,20), then create or delete it.",
  });

  const pad = (n: number) => `VLAN${String(n).padStart(4, "0")}`;
  const create = () => {
    const l = parseIds(ids);
    if (!l)
      return setMsg({
        t: "Enter VLAN numbers from 1 to 4094, like 30 or 10-12,20.",
        bad: true,
      });
    const skip = l.filter((x) => x >= 1002 && x <= 1005);
    const ok = l.filter((x) => !(x >= 1002 && x <= 1005));
    setVlans((v) => {
      const n = { ...v };
      ok.forEach((x) => {
        n[x] =
          x === 1
            ? "default"
            : l.length === 1 && name.trim()
              ? name.trim()
              : (v[x] ?? pad(x));
      });
      return n;
    });
    setMsg({
      t: `vlan ${ids}${l.length === 1 && name.trim() ? ` / name ${name.trim()}` : ""}: created or updated ${ok.length} VLAN${ok.length === 1 ? "" : "s"}.${skip.length ? " (1002 to 1005 already exist.)" : ""}`,
    });
  };
  const del = () => {
    const l = parseIds(ids);
    if (!l)
      return setMsg({
        t: "Enter VLAN numbers from 1 to 4094, like 30 or 10-12,20.",
        bad: true,
      });
    if (l.some((x) => x === 1 || (x >= 1002 && x <= 1005)))
      return setMsg({
        t: "Default VLANs (1 and 1002 to 1005) cannot be deleted.",
        bad: true,
      });
    setVlans((v) => {
      const n = { ...v };
      l.forEach((x) => delete n[x]);
      return n;
    });
    const hit = ports.filter((p) => l.includes(p)).length;
    setMsg({
      t: `no vlan ${ids}: deleted.${hit ? ` ${hit} port${hit > 1 ? "s" : ""} assigned to it ${hit > 1 ? "are" : "is"} now inactive (they are NOT moved to VLAN 1).` : ""}`,
    });
  };
  const cycle = (i: number) => {
    const list = Object.keys(vlans)
      .map(Number)
      .sort((a, b) => a - b);
    const k = list.indexOf(ports[i]);
    const nxt = list[(k + 1) % list.length];
    setPorts((p) => p.map((x, j) => (j === i ? nxt : x)));
    setMsg({ t: `interface Fa0/${i + 1}: switchport access vlan ${nxt}` });
  };

  const sorted = Object.entries(vlans)
    .map(([k, v]) => [Number(k), v] as [number, string])
    .sort((a, b) => a[0] - b[0]);
  const portsIn = (v: number) =>
    ports
      .map((p, i) => (p === v ? `Fa0/${i + 1}` : ""))
      .filter(Boolean)
      .join(", ");

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Create, delete and check VLANs</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The VLAN database (normal range) lives in flash as a file called{" "}
          <span className="font-mono font-semibold text-foreground">
            vlan.dat
          </span>
          . Each VLAN also gets its own MAC address table, created with the VLAN
          and deleted with it.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">A live switch</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={ids}
            onChange={(e) => setIds(e.target.value)}
            className="w-40 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
            aria-label="VLAN ids"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name"
            className="w-32 rounded-lg border bg-background px-3 py-1.5 text-xs"
            aria-label="VLAN name"
          />
          <Button size="sm" onClick={create}>
            vlan (create)
          </Button>
          <Button size="sm" variant="outline" onClick={del}>
            no vlan (delete)
          </Button>
        </div>
        <p
          key={msg.t}
          className="n10-fade mt-2 text-xs leading-5"
          style={{ color: msg.bad ? RED : undefined }}
        >
          {msg.t}
        </p>

        <p className="mt-4 text-xs font-semibold">
          Ports (tap a port to change its access VLAN)
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {ports.map((p, i) => {
            const inactive = !(p in vlans);
            return (
              <button
                key={i}
                type="button"
                onClick={() => cycle(i)}
                className="rounded-lg border-2 px-1 py-2 text-center transition-all duration-500"
                style={{
                  borderColor: inactive ? RED : (VCOL[p] ?? PURPLE),
                  opacity: inactive ? 0.5 : 1,
                  background: inactive ? `${RED}10` : undefined,
                }}
              >
                <p className="font-mono text-[11px] font-bold">Fa0/{i + 1}</p>
                <p
                  className="text-[10px]"
                  style={{ color: inactive ? RED : undefined }}
                >
                  {inactive ? `inactive (${p})` : `VLAN ${p}`}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs font-semibold">Switch# show vlan brief</p>
        <div className="mt-1 overflow-x-auto rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300">
          <pre className="m-0 font-mono">
            {"VLAN Name                 Status    Ports"}
          </pre>
          {sorted.map(([v, n]) => (
            <pre
              key={`${v}-${n}-${portsIn(v)}`}
              className="n10-fade m-0 whitespace-pre-wrap font-mono"
            >{`${String(v).padEnd(5)}${n.padEnd(19)}active    ${portsIn(v)}`}</pre>
          ))}
          {DEF_VLANS.map(([v, n]) => (
            <pre
              key={v}
              className="m-0 font-mono text-green-300/70"
            >{`${String(v).padEnd(5)}${n.padEnd(19)}act/unsup`}</pre>
          ))}
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            Deleting a VLAN does not move its ports to VLAN 1. They become
            inactive and pass no traffic until you assign them to a VLAN that
            exists.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Commands</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Code
            lines={[
              "(conf)# vlan 10",
              "(conf-vlan)# name HR",
              "(conf-vlan)# exit",
              "",
              "! several at once (no spaces)",
              "(conf)# vlan 10-20,25-30,36,60-90",
            ]}
          />
          <Code
            lines={[
              "(conf)# no vlan 10",
              "(conf)# no vlan 15-17,20-32,41,45",
              "",
              "# show vlan brief",
              "# show vlan id 10",
              "# show vlan name HR",
              "# show flash        ! find vlan.dat",
            ]}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Careful">
            Normal-range VLANs are stored in vlan.dat, not in the
            running-config, so show run may not list them (it does in VTP
            transparent or off mode). Use show vlan brief.
          </Tip>
          <Tip title="Reset">
            Deleting flash:vlan.dat and reloading wipes the VLAN database back
            to the defaults.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example VTP modes and VTP domains ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 5 · access ports ───────────────────────── */

const SW_NODES = ["PC-A", "SW1", "SW2", "SW3", "PC-B"];

function AccessSection() {
  const [c, setC] = useState({ a12: true, e2: true, a23: true, e3: true });
  const [i, setI] = useState(-1);
  const [st, setSt] = useState<"idle" | "run" | "fail" | "ok">("idle");

  const ev = [
    { pos: 1, ok: true, why: "" },
    {
      pos: 2,
      ok: c.a12,
      why: "VLAN 30 is not allowed on the SW1 to SW2 trunk, so SW1 will not send it.",
    },
    {
      pos: 2,
      ok: c.e2,
      why: "SW2 has no VLAN 30 in its database, so it drops the frame.",
    },
    {
      pos: 3,
      ok: c.a23,
      why: "VLAN 30 is not allowed on the SW2 to SW3 trunk, so SW2 will not forward it.",
    },
    {
      pos: 3,
      ok: c.e3,
      why: "SW3 has no VLAN 30 in its database, so it drops the frame.",
    },
    { pos: 4, ok: true, why: "" },
  ];
  const pos =
    i < 0 ? 0 : st === "fail" ? (i > 0 ? ev[i - 1].pos : 0) : ev[i].pos;

  useEffect(() => {
    if (st !== "run") return;
    const id = setTimeout(() => {
      const n = i + 1;
      setI(n);
      if (!ev[n].ok) setSt("fail");
      else if (n === ev.length - 1) setSt("ok");
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, i]);

  const reset = () => {
    setI(-1);
    setSt("idle");
  };
  const flip = (k: keyof typeof c) => {
    setC((v) => ({ ...v, [k]: !v[k] }));
    reset();
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          An access port belongs to one VLAN
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          It carries only that VLAN&apos;s traffic, untagged. All hosts and
          clients connect to access ports. The other port type is the trunk,
          which carries many VLANs.
        </p>
        <div className="mt-3">
          <Code
            lines={[
              "# interface f0/0",
              "# description CCTV-VLAN30",
              "# switchport mode access        ! step 1: make it an access port",
              "# switchport access vlan 30    ! step 2: pick the VLAN",
              "# no shutdown",
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Why can PC-A not reach PC-B?</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Both PCs are in VLAN 30, on SW1 and SW3, with SW2 in between. Switch
          conditions on and off, then send a frame.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={c.a12} onClick={() => flip("a12")}>
            {c.a12 ? "SW1–SW2 trunk allows 30" : "SW1–SW2 trunk blocks 30"}
          </Pick>
          <Pick active={c.e2} onClick={() => flip("e2")}>
            {c.e2 ? "SW2 has VLAN 30" : "SW2 has NO VLAN 30"}
          </Pick>
          <Pick active={c.a23} onClick={() => flip("a23")}>
            {c.a23 ? "SW2–SW3 trunk allows 30" : "SW2–SW3 trunk blocks 30"}
          </Pick>
          <Pick active={c.e3} onClick={() => flip("e3")}>
            {c.e3 ? "SW3 has VLAN 30" : "SW3 has NO VLAN 30"}
          </Pick>
        </div>

        <div className="relative mx-6 mt-8 h-20">
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-border" />
          {SW_NODES.map((n, k) => (
            <div
              key={n}
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${k * 25}%` }}
            >
              <div
                className="rounded-md border bg-background px-2 py-1 text-xs font-bold"
                style={{
                  borderColor: st === "fail" && pos === k ? RED : undefined,
                }}
              >
                {n}
              </div>
            </div>
          ))}
          <div
            className="absolute top-[18px] h-3.5 w-3.5 -translate-x-1/2 rounded-full transition-all duration-700"
            style={{
              left: `${pos * 25}%`,
              background: st === "fail" ? RED : AMBER,
              boxShadow: `0 0 0 4px ${st === "fail" ? RED : AMBER}30`,
            }}
          />
          {st === "fail" && (
            <p
              className="n10-pop absolute top-10 -translate-x-1/2 text-xs font-bold"
              style={{ left: `${pos * 25}%`, color: RED }}
            >
              ✕ dropped
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={st === "run"}
            onClick={() => {
              setI(-1);
              setSt("run");
            }}
          >
            Send frame (VLAN 30)
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>
        <p
          key={`${st}-${i}`}
          className="n10-fade mt-3 min-h-[2.5rem] text-xs leading-5"
          style={{
            color: st === "fail" ? RED : st === "ok" ? GREEN : undefined,
          }}
        >
          {st === "idle" && (
            <span className="text-muted-foreground">Press Send frame.</span>
          )}
          {st === "run" && (
            <span className="text-muted-foreground">Frame travelling...</span>
          )}
          {st === "ok" &&
            "Delivered. Every switch on the path has VLAN 30 and every trunk allows it."}
          {st === "fail" && ev[i].why}
        </p>
        <div className="mt-3">
          <Tip title="Rule">
            A switch in the middle still needs the VLAN in its database and on
            its trunks. The VLAN must exist on every switch along the path, not
            only at the ends.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Port types and verification</p>
        <div className="mt-3">
          <SimpleTable
            head={["", "Access port", "Trunk port"]}
            rows={[
              ["VLANs carried", "One", "Many"],
              ["Tagging", "Untagged", "Tagged (except the native VLAN)"],
              ["Connects", "Hosts and clients", "Switch to switch, uplinks"],
              ["Command", "switchport mode access", "switchport mode trunk"],
            ]}
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Code
            lines={[
              "! configure many ports at once",
              "# interface range f0/0-3, f1/2-3, f2/0-2, f4/3",
            ]}
          />
          <Code
            lines={[
              "# show vlan brief",
              "# show ip interface brief",
              "# show interfaces status",
              "# show run interface f0/0",
            ]}
          />
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            show vlan brief lists only access ports. Trunk ports do not appear
            there, use show interfaces trunk.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example voice VLAN on an access port ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 6 · trunks and tagging ───────────────────────── */

const TAGF = [
  {
    f: "TPID",
    bits: 16,
    v: "0x8100",
    d: "Tag Protocol Identifier. 0x8100 tells the receiver this is an 802.1Q tagged frame.",
    c: PURPLE,
  },
  {
    f: "PCP",
    bits: 3,
    v: "priority",
    d: "Priority Code Point: a 3-bit class of service value used for QoS.",
    c: AMBER,
  },
  {
    f: "DEI",
    bits: 1,
    v: "drop flag",
    d: "Drop Eligible Indicator: marks frames that may be dropped first in congestion.",
    c: GREY,
  },
  {
    f: "VID",
    bits: 12,
    v: "VLAN ID",
    d: "VLAN Identifier. 12 bits give 4096 values. 0 and 4095 are reserved, so VLANs 1 to 4094 are usable.",
    c: BLUE,
  },
];

function TrunkSection() {
  const [hop, setHop] = useState(1);
  const [vid, setVid] = useState(20);
  const [tf, setTf] = useState(3);
  const native = 1;
  const tagged = hop === 1 && vid !== native;
  const cells = [
    { l: "Dst MAC", c: GREY },
    { l: "Src MAC", c: GREY },
    ...(tagged ? [{ l: `802.1Q tag (4 B) VLAN ${vid}`, c: PURPLE }] : []),
    { l: "EtherType", c: GREY },
    { l: "Payload", c: BLUE },
    { l: "FCS", c: RED },
  ];
  const hops = [
    "PC to switch (access port)",
    "Across the trunk",
    "Switch to PC (far access port)",
  ];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          A trunk carries many VLANs over one link
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          It is not a member of a single VLAN. Trunks build the uplinks between
          switches. To keep the VLANs apart, the sending trunk port attaches a
          VLAN tag, and the receiving trunk port reads it to know which VLAN the
          frame belongs to. Frames are tagged only on trunks and untagged on
          access ports.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Follow a frame</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hops.map((h, i) => (
            <Pick key={h} active={hop === i} onClick={() => setHop(i)}>
              {h}
            </Pick>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[10, 20, 1].map((v) => (
            <Pick key={v} active={vid === v} onClick={() => setVid(v)}>
              {v === native ? "VLAN 1 (the native VLAN)" : `VLAN ${v}`}
            </Pick>
          ))}
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border bg-muted/30 p-3">
          <div className="flex min-w-max items-stretch gap-1.5">
            {cells.map((x) => (
              <div
                key={`${x.l}-${hop}-${vid}`}
                className="n10-pop rounded-md border px-2 py-2 text-[11px] font-semibold"
                style={{ borderColor: x.c, background: `${x.c}18`, color: x.c }}
              >
                {x.l}
              </div>
            ))}
          </div>
        </div>
        <p
          key={`${hop}-${vid}`}
          className="n10-fade mt-3 text-xs leading-5 text-muted-foreground"
        >
          {hop !== 1
            ? "On an access port the frame is untagged. The switch adds or removes the VLAN association itself, and the host never sees a tag."
            : tagged
              ? `The trunk port inserts a 4-byte 802.1Q tag for VLAN ${vid} after the source MAC, and recalculates the FCS. The far switch reads it to pick the VLAN.`
              : "VLAN 1 is the native VLAN here, so on a dot1q trunk its frames travel untagged. Only the other VLANs get a tag."}
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">
          Anatomy of the 802.1Q tag (32 bits)
        </p>
        <div className="mt-3 flex gap-1">
          {TAGF.map((x, i) => (
            <button
              key={x.f}
              type="button"
              onClick={() => setTf(i)}
              className="rounded-md border-2 py-3 text-center text-xs font-bold transition-all"
              style={{
                flex: x.bits,
                borderColor: x.c,
                background: tf === i ? x.c : `${x.c}14`,
                color: tf === i ? "#fff" : x.c,
              }}
            >
              {x.f}
              <br />
              <span className="text-[10px] font-normal">{x.bits} bits</span>
            </button>
          ))}
        </div>
        <div key={tf} className="n10-fade mt-3 grid gap-2 sm:grid-cols-3">
          <Mini
            k="Field"
            v={`${TAGF[tf].f} (${TAGF[tf].bits} bits)`}
            color={TAGF[tf].c}
          />
          <Mini k="Example value" v={TAGF[tf].v} />
          <Mini k="Meaning" v={TAGF[tf].d} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">ISL vs IEEE 802.1Q</p>
        <div className="mt-3">
          <SimpleTable
            head={["", "ISL", "802.1Q (dot1q)"]}
            rows={[
              [
                "Owner",
                "Cisco proprietary, Cisco devices only",
                "IEEE open standard, every vendor",
              ],
              [
                "How",
                "Encapsulates the whole frame: 26-byte header plus 4-byte trailer",
                "Inserts a 4-byte tag into the frame",
              ],
              ["VLAN range", "1 to 1005", "1 to 4094"],
              [
                "Native VLAN",
                "None: every VLAN is tagged",
                "One untagged VLAN",
              ],
              [
                "Today",
                "Deprecated, missing on newer switches",
                "The default and the standard",
              ],
            ]}
          />
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            Many notes say ISL adds a 26-byte tag. Strictly it adds a 26-byte
            header and a 4-byte trailer, 30 bytes in all. Either way it is
            heavier than dot1q&apos;s 4 bytes.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 7 · trunk config ───────────────────────── */

const VLIST = [1, 10, 20, 30, 40, 50];
const ISSUES = [
  {
    k: "l1",
    ok: "Layer 1 up (cable, transceiver)",
    bad: "Layer 1 down",
    out: "The link is down: no trunk at all. Check the cable and transceiver.",
    sev: "down",
  },
  {
    k: "sd",
    ok: "Speed and duplex match",
    bad: "Speed or duplex mismatch",
    out: "The link may come up but suffers CRC errors, late collisions and slow throughput.",
    sev: "warn",
  },
  {
    k: "en",
    ok: "Same encapsulation",
    bad: "ISL on one end, dot1q on the other",
    out: "The two ends cannot read each other's tagged frames, so VLAN traffic does not pass properly.",
    sev: "down",
  },
  {
    k: "nv",
    ok: "Same native VLAN",
    bad: "Native VLAN mismatch",
    out: "The trunk stays up, but untagged frames land in a different VLAN on each side (a VLAN leak). CDP and spanning tree log warnings.",
    sev: "warn",
  },
  {
    k: "al",
    ok: "Same allowed VLANs",
    bad: "Allowed VLANs differ",
    out: "The trunk stays up, but any VLAN allowed on only one side cannot pass: its traffic is blocked.",
    sev: "warn",
  },
] as const;

function TcfgSection() {
  const [allowed, setAllowed] = useState<number[]>(VLIST);
  const [last, setLast] = useState("(default) all VLANs are allowed");
  const [note, setNote] = useState("");
  const [ok, setOk] = useState<Record<string, boolean>>({
    l1: true,
    sd: true,
    en: true,
    nv: true,
    al: true,
  });

  const run = (cmd: string, next: number[], warn = "") => {
    setAllowed(next);
    setLast(cmd);
    setNote(warn);
  };
  const list =
    allowed.length === VLIST.length
      ? "1-4094 (all)"
      : allowed.length
        ? allowed.join(",")
        : "none";
  const bad = ISSUES.filter((x) => !ok[x.k]);
  const down = bad.some((x) => x.sev === "down");

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          Configure a trunk in three steps
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Mini
            k="1 · Encapsulation"
            v="switchport trunk encapsulation dot1q (only on switches that also support ISL)"
          />
          <Mini k="2 · Mode" v="switchport mode trunk" />
          <Mini
            k="3 · Allowed VLANs"
            v="Filter which VLANs may cross. All VLANs are allowed by default."
          />
        </div>
        <div className="mt-3">
          <Code
            lines={[
              "# interface f0/0",
              "# switchport trunk encapsulation dot1q",
              "# switchport mode trunk",
              "# switchport trunk allowed vlan 10,20,30",
              "# no shutdown",
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Allowed VLAN list builder</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Run commands and watch the list. Pay attention to the first two.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              run(
                "switchport trunk allowed vlan 10",
                [10],
                allowed.length > 1
                  ? "That REPLACED the whole list. Every other VLAN is now blocked."
                  : "",
              )
            }
          >
            allowed vlan 10
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              run(
                "switchport trunk allowed vlan 10,20,30",
                [10, 20, 30],
                "Replaced the list with 10, 20 and 30.",
              )
            }
          >
            allowed vlan 10,20,30
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              run(
                "switchport trunk allowed vlan add 50",
                Array.from(new Set([...allowed, 50])).sort((a, b) => a - b),
              )
            }
          >
            allowed vlan add 50
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              run(
                "switchport trunk allowed vlan remove 40",
                allowed.filter((x) => x !== 40),
              )
            }
          >
            allowed vlan remove 40
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run("switchport trunk allowed vlan none", [])}
          >
            allowed vlan none
          </Button>
          <Button
            size="sm"
            onClick={() => run("switchport trunk allowed vlan all", VLIST)}
          >
            allowed vlan all (reset)
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {VLIST.map((v) => {
            const on = allowed.includes(v);
            return (
              <div
                key={v}
                className="rounded-lg border-2 py-3 text-center transition-all duration-500"
                style={{
                  borderColor: on ? GREEN : RED,
                  background: on ? `${GREEN}14` : `${RED}0f`,
                  opacity: on ? 1 : 0.5,
                  transform: on ? "scale(1)" : "scale(.93)",
                }}
              >
                <p
                  className="font-mono text-sm font-bold"
                  style={{ color: on ? GREEN : RED }}
                >
                  VLAN {v}
                </p>
                <p
                  className="text-[10px] font-semibold"
                  style={{ color: on ? GREEN : RED }}
                >
                  {on ? "crosses" : "blocked"}
                </p>
              </div>
            );
          })}
        </div>
        <div
          key={last + list}
          className="n10-fade mt-3 rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300"
        >
          <p>Switch(config-if)# {last}</p>
          <p className="text-white">Allowed on trunk: {list}</p>
        </div>
        {note && (
          <p
            className="n10-fade mt-2 text-xs font-semibold"
            style={{ color: AMBER }}
          >
            {note}
          </p>
        )}
        <div className="mt-3">
          <Tip title="Careful">
            Filtering VLANs by hand like this is often called pruning. It is
            separate from VTP pruning, which is an automatic feature of VTP.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Trunk troubleshooting checklist</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Break each condition and read the symptom.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ISSUES.map((x) => (
            <Pick
              key={x.k}
              active={ok[x.k]}
              onClick={() => setOk((o) => ({ ...o, [x.k]: !o[x.k] }))}
            >
              {ok[x.k] ? x.ok : x.bad}
            </Pick>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-1.5 flex-1 rounded-full transition-colors duration-500"
            style={{
              background: bad.length === 0 ? GREEN : down ? RED : AMBER,
            }}
          />
          <span
            key={bad.length + String(down)}
            className="n10-pop text-xs font-bold"
            style={{ color: bad.length === 0 ? GREEN : down ? RED : AMBER }}
          >
            {bad.length === 0
              ? "Healthy trunk"
              : down
                ? "Trunk broken"
                : "Trunk up, but with problems"}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          {bad.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Everything matches. Both ends agree.
            </p>
          )}
          {bad.map((x) => (
            <p
              key={x.k}
              className="n10-fade rounded-lg border px-3 py-2 text-xs leading-5"
              style={{ borderColor: x.sev === "down" ? RED : AMBER }}
            >
              <span className="font-semibold">{x.bad}: </span>
              <span className="text-muted-foreground">{x.out}</span>
            </p>
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Verification</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Code
            lines={[
              "# show interfaces trunk",
              "# show interfaces status",
              "# show ip interface brief",
              "# show vlan brief",
            ]}
          />
          <Code
            lines={[
              "# show run interface f0/0",
              "# show interfaces f0/0",
              "# show log | include f0/0",
            ]}
          />
        </div>
        <div className="mt-3">
          <Tip>
            show interfaces trunk shows the mode, encapsulation, status, native
            VLAN, allowed VLANs, and which VLANs are allowed and active.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example EtherChannel trunks ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 8 · native VLAN ───────────────────────── */

type Layer = { l: string; c: string };
const T1: Layer = { l: "Outer tag: VLAN 1", c: PURPLE };
const T20: Layer = { l: "Inner tag: VLAN 20", c: AMBER };
const DATA: Layer = { l: "Data", c: BLUE };

const ATTACK: Record<
  "none" | "changed" | "tagged",
  {
    name: string;
    steps: { t: string; d: string; layers: Layer[] }[];
    end: string;
    ok: boolean;
  }
> = {
  none: {
    name: "No protection (native VLAN 1)",
    steps: [
      {
        t: "Attacker crafts a double-tagged frame",
        d: "The attacker sits on an access port in VLAN 1, which is also the trunk's native VLAN. The frame carries two tags: outer VLAN 1, inner VLAN 20.",
        layers: [T1, T20, DATA],
      },
      {
        t: "SW1 strips the outer tag",
        d: "The outer tag matches the native VLAN, and native VLAN frames travel untagged on the trunk. So SW1 removes it and sends the frame across.",
        layers: [T20, DATA],
      },
      {
        t: "SW2 reads the inner tag",
        d: "SW2 sees a tagged frame for VLAN 20 and treats it as normal VLAN 20 traffic.",
        layers: [DATA],
      },
      {
        t: "Delivered to the victim",
        d: "The frame lands in VLAN 20 even though the attacker was never in it.",
        layers: [DATA],
      },
    ],
    end: "Attack succeeded. It is one-way (replies cannot come back), but that is enough for a denial of service.",
    ok: false,
  },
  changed: {
    name: "Native VLAN changed to an unused VLAN",
    steps: [
      {
        t: "Attacker crafts the same frame",
        d: "Outer tag VLAN 1, inner tag VLAN 20. The native VLAN on the trunk is now VLAN 99, which nobody uses.",
        layers: [T1, T20, DATA],
      },
      {
        t: "SW1 keeps the outer tag",
        d: "VLAN 1 is no longer the native VLAN, so its frames are tagged on the trunk. The outer tag stays.",
        layers: [T1, T20, DATA],
      },
      {
        t: "SW2 reads the outer tag",
        d: "SW2 sees VLAN 1 and forwards it in VLAN 1. The inner tag is just payload now.",
        layers: [T20, DATA],
      },
      {
        t: "Stopped",
        d: "The frame never reaches VLAN 20.",
        layers: [T20, DATA],
      },
    ],
    end: "Attack failed. Caution: it would work again for an attacker sitting in the new native VLAN, so keep hosts out of it.",
    ok: true,
  },
  tagged: {
    name: "Native VLAN tagged too",
    steps: [
      {
        t: "Attacker crafts the same frame",
        d: "Outer tag VLAN 1, inner tag VLAN 20. The switches are configured to tag the native VLAN as well.",
        layers: [T1, T20, DATA],
      },
      {
        t: "SW1 never strips a tag",
        d: "With the native VLAN tagged, nothing travels untagged on the trunk, so the outer tag is not removed.",
        layers: [T1, T20, DATA],
      },
      {
        t: "SW2 reads the outer tag",
        d: "SW2 sees VLAN 1 and forwards it there. The inner tag is just payload.",
        layers: [T20, DATA],
      },
      {
        t: "Stopped",
        d: "The frame never reaches VLAN 20.",
        layers: [T20, DATA],
      },
    ],
    end: "Attack failed, and this is the more effective fix because no VLAN is left untagged.",
    ok: true,
  },
};

function NativeSection() {
  const [mode, setMode] = useState<"none" | "changed" | "tagged">("none");
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const a = ATTACK[mode];
  const last = a.steps.length - 1;

  useEffect(() => {
    if (!play) return;
    if (i >= last) {
      setPlay(false);
      return;
    }
    const id = setTimeout(() => setI((v) => v + 1), 1500);
    return () => clearTimeout(id);
  }, [play, i, last]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Default VLAN vs native VLAN</p>
        <div className="mt-3">
          <SimpleTable
            head={["", "Default VLAN", "Native VLAN"]}
            rows={[
              [
                "What it is",
                "VLAN 1: where every port starts",
                "The untagged VLAN on a dot1q trunk",
              ],
              ["Can change?", "No. It cannot be deleted", "Yes, to any VLAN"],
              [
                "On a trunk",
                "Tagged unless it is also the native VLAN",
                "Untagged (all others are tagged)",
              ],
              [
                "Carries",
                "Ordinary user traffic",
                "Control frames such as CDP, DTP and VTP, and spanning tree BPDUs",
              ],
            ]}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Rule">
            The native VLAN must match on both ends of a trunk. A mismatch does
            not bring the trunk down, it leaks traffic between VLANs.
          </Tip>
          <Tip title="Careful">
            By default the native VLAN is VLAN 1, but it can be any VLAN.
            Changing it is done per trunk port: switchport trunk native vlan 99.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The double tagging attack</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Untagged native VLAN traffic is the weak spot. An attacker adds two
          tags, the first switch strips the outer one, and the frame lands in a
          victim VLAN. Pick a defense and play.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(ATTACK) as (keyof typeof ATTACK)[]).map((k) => (
            <Pick
              key={k}
              active={mode === k}
              onClick={() => {
                setMode(k);
                setI(0);
                setPlay(false);
              }}
            >
              {ATTACK[k].name}
            </Pick>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (i >= last) setI(0);
              setPlay((p) => !p);
            }}
          >
            {play ? "Pause" : i >= last ? "Replay" : "Play"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={i === 0}
            onClick={() => {
              setPlay(false);
              setI((v) => v - 1);
            }}
          >
            Back
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={i >= last}
            onClick={() => {
              setPlay(false);
              setI((v) => v + 1);
            }}
          >
            Next step
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-[90px_1fr_90px] items-center gap-2 text-center text-[11px] font-bold">
          <div className="rounded-lg border p-2">
            Attacker
            <br />
            <span className="font-normal text-muted-foreground">VLAN 1</span>
          </div>
          <div className="rounded-lg border border-dashed p-2">
            SW1 ⇄ trunk ⇄ SW2
          </div>
          <div className="rounded-lg border p-2">
            Victim
            <br />
            <span className="font-normal text-muted-foreground">VLAN 20</span>
          </div>
        </div>
        <div key={`${mode}-${i}`} className="n10-fade mt-3">
          <p className="text-xs text-muted-foreground">
            Step {i + 1} of {a.steps.length}
          </p>
          <p className="text-sm font-semibold">{a.steps[i].t}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {a.steps[i].d}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-3">
            {a.steps[i].layers.map((x, k) => (
              <span
                key={`${x.l}${k}`}
                className="n10-pop rounded-md border px-2 py-1.5 text-[11px] font-semibold"
                style={{ borderColor: x.c, background: `${x.c}18`, color: x.c }}
              >
                {x.l}
              </span>
            ))}
          </div>
        </div>
        {i >= last && (
          <p
            className="n10-pop mt-3 rounded-lg border px-3 py-2 text-xs font-semibold"
            style={{
              borderColor: a.ok ? GREEN : RED,
              color: a.ok ? GREEN : RED,
              background: `${a.ok ? GREEN : RED}10`,
            }}
          >
            {a.end}
          </p>
        )}
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The fixes</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">
              1 · Move the native VLAN
            </p>
            <Code
              lines={[
                "# interface f0/0",
                "# switchport trunk native vlan 99",
                "",
                "! use a VLAN with no hosts, and set it on both ends",
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">
              2 · Tag the native VLAN (more effective)
            </p>
            <Code
              lines={[
                "(conf)# vlan dot1q tag native",
                "",
                "! global command, tags every native VLAN",
                "! frame on all dot1q trunks",
              ]}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Careful">
            Do not make a user VLAN (like VLAN 10) the native VLAN. Pick an
            unused one. The tag-native command is global, not a switchport trunk
            setting.
          </Tip>
          <Tip title="Good to know">
            ISL is not affected, because it tags every VLAN. Also keep unused
            ports shut down in an unused VLAN, and keep hosts off the native
            VLAN.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example VLAN hopping by switch spoofing ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 9 · DTP ───────────────────────── */

type DM = "a" | "d" | "r" | "t" | "n";
const DMODES: { id: DM; name: string; cmd: string }[] = [
  { id: "a", name: "Access", cmd: "switchport mode access" },
  { id: "d", name: "Dynamic auto", cmd: "switchport mode dynamic auto" },
  {
    id: "r",
    name: "Dynamic desirable",
    cmd: "switchport mode dynamic desirable",
  },
  { id: "t", name: "Trunk", cmd: "switchport mode trunk" },
  {
    id: "n",
    name: "Trunk + nonegotiate",
    cmd: "switchport mode trunk  +  switchport nonegotiate",
  },
];
const OUT: Record<string, "trunk" | "access" | "mismatch"> = {
  aa: "access",
  ad: "access",
  ar: "access",
  at: "mismatch",
  an: "mismatch",
  dd: "access",
  dr: "trunk",
  dt: "trunk",
  dn: "mismatch",
  rr: "trunk",
  rt: "trunk",
  rn: "mismatch",
  tt: "trunk",
  tn: "trunk",
  nn: "trunk",
};
const outOf = (x: DM, y: DM) => OUT[x + y] ?? OUT[y + x];
const OTXT = {
  trunk: { t: "Trunk forms", c: GREEN },
  access: { t: "No trunk: both ports end up as access ports", c: BLUE },
  mismatch: {
    t: "Mismatch: one side is a trunk, the other is not. Only native VLAN traffic works",
    c: RED,
  },
};

function DtpSection() {
  const [a, setA] = useState<DM>("r");
  const [b, setB] = useState<DM>("d");
  const [n, setN] = useState(1);
  const res = outOf(a, b);
  const o = OTXT[res];
  const quiet = a === "n" || b === "n" || a === "a" || b === "a";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          DTP lets two switches negotiate a trunk
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Dynamic Trunking Protocol negotiates two things: whether the link
          becomes a trunk or stays access, and which tagging protocol (ISL or
          dot1q) it uses. It does not negotiate the native VLAN or the allowed
          VLAN list. Those stay manual.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Mini
            k="Dynamic desirable"
            v="Actively asks the neighbor to trunk, sending DTP frames"
            color={GREEN}
          />
          <Mini
            k="Dynamic auto"
            v="Waits and only answers. Never starts it"
            color={BLUE}
          />
          <Mini k="Hello timer" v="30 s: how often DTP frames are sent" />
          <Mini k="Hold timer" v="300 s: how long DTP info is kept" />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Combine two modes</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">SW1</p>
            <div className="flex flex-wrap gap-1.5">
              {DMODES.map((m) => (
                <Pick
                  key={m.id}
                  active={a === m.id}
                  onClick={() => {
                    setA(m.id);
                    setN((v) => v + 1);
                  }}
                >
                  {m.name}
                </Pick>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">SW2</p>
            <div className="flex flex-wrap gap-1.5">
              {DMODES.map((m) => (
                <Pick
                  key={m.id}
                  active={b === m.id}
                  onClick={() => {
                    setB(m.id);
                    setN((v) => v + 1);
                  }}
                >
                  {m.name}
                </Pick>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-5 h-16">
          <div
            className="absolute left-14 right-14 top-1/2 h-1 rounded transition-colors duration-500"
            style={{ background: o.c }}
          />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-lg border px-3 py-2 text-xs font-bold">
            SW1
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-lg border px-3 py-2 text-xs font-bold">
            SW2
          </div>
          <div className="absolute left-14 right-14 top-0 h-full">
            {!quiet || a === "r" || a === "d" || a === "t" ? (
              <span
                key={`a${n}`}
                className="n10-flyR absolute top-1 rounded bg-blue-600 px-1.5 text-[10px] font-bold text-white"
              >
                DTP
              </span>
            ) : null}
            {!quiet || b === "r" || b === "d" || b === "t" ? (
              <span
                key={`b${n}`}
                className="n10-flyL absolute bottom-1 rounded bg-purple-600 px-1.5 text-[10px] font-bold text-white"
              >
                DTP
              </span>
            ) : null}
          </div>
        </div>
        <p
          key={`${a}${b}`}
          className="n10-fade mt-2 text-xs font-semibold"
          style={{ color: o.c }}
        >
          {o.t}.
        </p>

        <div className="mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[520px] text-center text-[11px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left">SW1 \ SW2</th>
                {DMODES.map((m) => (
                  <th key={m.id} className="px-2 py-2 font-medium">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DMODES.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-2 py-2 text-left font-semibold">
                    {r.name}
                  </td>
                  {DMODES.map((c) => {
                    const v = outOf(r.id, c.id);
                    const sel = r.id === a && c.id === b;
                    return (
                      <td
                        key={c.id}
                        className="px-2 py-2 font-semibold transition-all"
                        style={{
                          color: OTXT[v].c,
                          background: sel ? `${OTXT[v].c}25` : undefined,
                          outline: sel ? `2px solid ${OTXT[v].c}` : undefined,
                        }}
                      >
                        {v === "trunk"
                          ? "Trunk"
                          : v === "access"
                            ? "Access"
                            : "Mismatch"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Memory hook">
            Only dynamic auto with dynamic auto fails to trunk, because nobody
            starts the conversation. Anything with desirable or trunk on one
            side makes a trunk (unless the other side is access or nonegotiate).
          </Tip>
          <Tip title="Careful">
            Switches in different VTP domains do not negotiate DTP unless one
            has no domain name. The default mode varies by platform (often
            dynamic auto).
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Configuration</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">
              SW1 (dynamic desirable)
            </p>
            <Code
              lines={[
                "# interface f0/0",
                "# switchport trunk encapsulation dot1q",
                "# switchport trunk native vlan 99",
                "# switchport trunk allowed vlan 10,20,30,40",
                "# switchport mode dynamic desirable",
                "# no shutdown",
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">SW2 (dynamic auto)</p>
            <Code
              lines={[
                "# interface f0/1",
                "# switchport mode dynamic auto",
                "# no shutdown",
                "",
                "# show interfaces trunk",
                "# show run interface f0/0",
              ]}
            />
          </div>
        </div>
        <div className="mt-3">
          <Code
            lines={[
              "! best practice: configure trunks by hand and turn DTP off",
              "# interface f0/0",
              "# switchport mode trunk",
              "# switchport nonegotiate",
            ]}
          />
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            switchport nonegotiate only works when the port is a static trunk or
            access port. It is rejected on dynamic modes. Manual trunks avoid
            negotiation delays and errors.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example VTP or PAgP/LACP negotiation ▼▼▼ */}
    </div>
  );
}
/* ───────────────────────── 10 · EtherChannel ───────────────────────── */

type EProto = "lacp" | "pagp" | "on";
const EMODES: Record<EProto, string[]> = {
  lacp: ["Active", "Passive"],
  pagp: ["Desirable", "Auto"],
  on: ["On"],
};

function EtherChannelSection() {
  const [bundled, setBundled] = useState(false);
  const [down, setDown] = useState<number[]>([]);
  const [proto, setProto] = useState<EProto>("lacp");
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);

  const live = [0, 1, 2, 3].filter((i) => !down.includes(i));
  const fwd = bundled ? live : live.slice(0, 1);
  const stpReconv = !bundled && down.includes(0) && live.length > 0;

  const modes = EMODES[proto];
  const ma = Math.min(a, modes.length - 1);
  const mb = Math.min(b, modes.length - 1);
  const formed = proto === "on" ? true : ma === 0 || mb === 0;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          EtherChannel bundles several links into one logical link
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Also called Port-Channel, LAG or Port-Aggregation (EtherChannel is the
          Cisco term). It gives uplinks more bandwidth and redundancy. STP
          treats the bundle as a single link, so no member port is blocked.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Why do we need it?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Four parallel links between SW1 and SW2. Tap a link to fail or restore
          it.
        </p>
        <div className="mt-3 flex gap-2">
          <Pick active={!bundled} onClick={() => setBundled(false)}>
            Without EtherChannel
          </Pick>
          <Pick active={bundled} onClick={() => setBundled(true)}>
            With EtherChannel
          </Pick>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => {
            const isDown = down.includes(i);
            const isFwd = fwd.includes(i);
            const c = isDown ? RED : isFwd ? GREEN : AMBER;
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setDown((d) =>
                    d.includes(i) ? d.filter((x) => x !== i) : [...d, i],
                  )
                }
                className="flex items-center gap-2 text-left"
              >
                <span className="w-10 text-xs font-bold">SW1</span>
                <span
                  className="h-1.5 flex-1 rounded transition-colors duration-500"
                  style={{ background: c, opacity: isDown ? 0.4 : 1 }}
                />
                <span className="w-10 text-right text-xs font-bold">SW2</span>
                <span
                  className="w-28 text-[11px] font-semibold"
                  style={{ color: c }}
                >
                  Link {i + 1}:{" "}
                  {isDown ? "down" : isFwd ? "forwarding" : "STP blocked"}
                </span>
              </button>
            );
          })}
        </div>
        <p
          key={`${bundled}-${down.join()}`}
          className="n10-fade mt-3 text-xs leading-5 font-medium"
        >
          Usable bandwidth: {fwd.length} link{fwd.length === 1 ? "" : "s"}.{" "}
          {!bundled &&
            live.length > 1 &&
            "STP blocks every redundant link, so the bandwidth is wasted. "}
          {stpReconv &&
            "The forwarding link failed, so STP has to recalculate and unblock another one (traffic pauses). "}
          {bundled &&
            down.length > 0 &&
            live.length > 0 &&
            "A member failed, traffic continues over the rest with no STP recalculation. "}
          {live.length === 0 && "All links are down."}
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Will the bundle form?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick
            active={proto === "lacp"}
            onClick={() => {
              setProto("lacp");
              setA(0);
              setB(1);
            }}
          >
            LACP
          </Pick>
          <Pick
            active={proto === "pagp"}
            onClick={() => {
              setProto("pagp");
              setA(0);
              setB(1);
            }}
          >
            PAgP
          </Pick>
          <Pick
            active={proto === "on"}
            onClick={() => {
              setProto("on");
              setA(0);
              setB(0);
            }}
          >
            Manual (on)
          </Pick>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">SW1</p>
            <div className="flex flex-wrap gap-1.5">
              {modes.map((m, i) => (
                <Pick key={m} active={ma === i} onClick={() => setA(i)}>
                  {m}
                </Pick>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">SW2</p>
            <div className="flex flex-wrap gap-1.5">
              {modes.map((m, i) => (
                <Pick key={m} active={mb === i} onClick={() => setB(i)}>
                  {m}
                </Pick>
              ))}
            </div>
          </div>
        </div>
        <p
          key={`${proto}${ma}${mb}`}
          className="n10-pop mt-3 text-xs font-bold"
          style={{ color: formed ? GREEN : RED }}
        >
          {proto === "on"
            ? "On + On: EtherChannel forms with no negotiation."
            : formed
              ? `${modes[ma]} + ${modes[mb]}: EtherChannel forms.`
              : `${modes[ma]} + ${modes[mb]}: nobody starts negotiating, so no EtherChannel.`}
        </p>
        <div className="mt-3">
          <Tip title="Careful">
            On does not negotiate with LACP or PAgP. On + Active (or On +
            Desirable) never forms a bundle. Protocols can differ per segment,
            but both ends of one bundle must match.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">LACP vs PAgP</p>
        <div className="mt-3">
          <SimpleTable
            head={["", "LACP", "PAgP"]}
            rows={[
              ["Owner", "Open standard (IEEE 802.3ad)", "Cisco proprietary"],
              ["Max links", "16 (only 8 active, 8 standby)", "8 (all active)"],
              ["Starts negotiation", "Active", "Desirable"],
              ["Only answers", "Passive", "Auto"],
              ["No bundle", "Passive + Passive", "Auto + Auto"],
            ]}
          />
        </div>
        <div className="mt-3">
          <Tip title="Memory hook">
            It is the same pattern as DTP: one side must ask. Active and
            Desirable ask. Passive and Auto only answer.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 11 · EtherChannel config ───────────────────────── */

const ECONDS = [
  {
    k: "ty",
    ok: "Same interface type",
    bad: "Fast Ethernet mixed with Gigabit",
    out: "Different interface types cannot be bundled.",
  },
  {
    k: "no",
    ok: "Same bundle number",
    bad: "Bundle number differs per side",
    out: "The two sides do not see the same channel, so the bundle does not form.",
  },
  {
    k: "stp",
    ok: "Same STP type",
    bad: "Different STP types",
    out: "Both switches must run the same spanning tree type.",
  },
  {
    k: "sd",
    ok: "Same speed and duplex",
    bad: "Speed or duplex mismatch",
    out: "The mismatched member is suspended from the bundle.",
  },
  {
    k: "pr",
    ok: "Same protocol",
    bad: "LACP on one side, PAgP on the other",
    out: "The ends cannot negotiate, so no bundle forms.",
  },
  {
    k: "en",
    ok: "Same trunk encapsulation",
    bad: "Encapsulation differs",
    out: "The mismatched member is suspended from the bundle.",
  },
  {
    k: "al",
    ok: "Same allowed VLANs",
    bad: "Allowed VLANs differ",
    out: "The mismatched member is suspended from the bundle.",
  },
  {
    k: "nv",
    ok: "Same native VLAN",
    bad: "Native VLAN differs",
    out: "The mismatched member is suspended from the bundle.",
  },
  {
    k: "l1",
    ok: "Layer 1 up",
    bad: "Layer 1 down",
    out: "A down link cannot join. Check the cable and transceiver first.",
  },
] as const;

function EchCfgSection() {
  const [ok, setOk] = useState<Record<string, boolean>>(
    Object.fromEntries(ECONDS.map((x) => [x.k, true])),
  );
  const [proto, setProto] = useState<EProto>("lacp");
  const bad = ECONDS.filter((x) => !ok[x.k]);

  const step1: Record<EProto, string[]> = {
    on: [
      "(conf)# interface range f0/0-3",
      "(conf-if)# description port channel 10",
      "(conf-if)# channel-group 10 mode on",
      "(conf-if)# no sh",
    ],
    lacp: [
      "(conf)# interface range f0/0-3",
      "(conf-if)# description LACP_SW2",
      "(conf-if)# channel-protocol lacp",
      "(conf-if)# channel-group 10 mode active   ! or passive",
      "(conf-if)# no sh",
    ],
    pagp: [
      "(conf)# interface range f0/0-3",
      "(conf-if)# description PAgP_SW2",
      "(conf-if)# channel-protocol pagp",
      "(conf-if)# channel-group 10 mode desirable   ! or auto",
      "(conf-if)# no sh",
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          Two steps: build the bundle, then configure the logical port
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Mini
            k="Step 1"
            v="channel-group on the physical interfaces. This creates the port-channel interface."
          />
          <Mini
            k="Step 2"
            v="Configure interface port-channel as trunk, access or L3. Step 2 is the same for every method."
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Configuration</p>
        <div className="mt-3 flex gap-2">
          <Pick active={proto === "on"} onClick={() => setProto("on")}>
            Manual
          </Pick>
          <Pick active={proto === "lacp"} onClick={() => setProto("lacp")}>
            LACP
          </Pick>
          <Pick active={proto === "pagp"} onClick={() => setProto("pagp")}>
            PAgP
          </Pick>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">
              Step 1 · bundle (changes per method)
            </p>
            <Code lines={step1[proto]} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">
              Step 2 · logical interface (same always)
            </p>
            <Code
              lines={[
                "(conf)# interface port-channel 10",
                "(conf-if)# description Trunk-switch2",
                "(conf-if)# switchport trunk allowed vlan 1,10,20,30,40",
                "(conf-if)# no sh",
              ]}
            />
          </div>
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            Configure the trunk settings on the port-channel interface, not on
            each member. The channel-group number only has to match the
            port-channel number locally, but keep it identical on both sides to
            avoid confusion.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">
          Formation conditions: break one and see
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ECONDS.map((x) => (
            <Pick
              key={x.k}
              active={ok[x.k]}
              onClick={() => setOk((o) => ({ ...o, [x.k]: !o[x.k] }))}
            >
              {ok[x.k] ? x.ok : x.bad}
            </Pick>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-1.5 flex-1 rounded-full transition-colors duration-500"
            style={{ background: bad.length ? RED : GREEN }}
          />
          <span
            key={bad.length}
            className="n10-pop text-xs font-bold"
            style={{ color: bad.length ? RED : GREEN }}
          >
            {bad.length
              ? "Member port suspended / bundle problem"
              : "Bundle healthy"}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          {bad.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Every member matches.
            </p>
          )}
          {bad.map((x) => (
            <p
              key={x.k}
              className="n10-fade rounded-lg border px-3 py-2 text-xs leading-5"
              style={{ borderColor: RED }}
            >
              <span className="font-semibold">{x.bad}: </span>
              <span className="text-muted-foreground">{x.out}</span>
            </p>
          ))}
        </div>
        <div className="mt-3">
          <Tip>
            A non-matching member shows as s or I in show etherchannel summary,
            while the remaining links keep working.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Verification</p>
        <div className="mt-3">
          <Code
            lines={[
              "# show etherchannel summary",
              "# show etherchannel 10 detail",
              "# show run interface",
              "# show ip int br",
              "# show log | include port-channel 10",
            ]}
          />
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here, for example L3 EtherChannel (no switchport + ip address on the port-channel) ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 12 · inter-VLAN routing ───────────────────────── */

function IvrSection() {
  const [m, setM] = useState<"roas" | "svi">("roas");
  const [r, setR] = useState({ trunk: true, sub: true });
  const [s, setS] = useState({ route: true, vlan: true });

  const roasWhy = !r.trunk
    ? "The switch port facing the router is not a trunk, so tagged multi-VLAN traffic never reaches the router."
    : !r.sub
      ? "No subinterface with encapsulation dot1q and an IP address exists for the VLAN, so there is no gateway."
      : "";
  const sviWhy = !s.route
    ? "ip routing is off (the default on an MLS), so the switch will not route between SVIs."
    : !s.vlan
      ? "The VLAN does not exist in the VLAN database, so the SVI stays down."
      : "";
  const why = m === "roas" ? roasWhy : sviWhy;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          Different VLANs need a Layer 3 device
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Two options. A router with subinterfaces (router on a stick) when the
          switches are L2 only, or a multilayer switch with one SVI per VLAN. In
          both cases the interface IP address is the default gateway of that
          VLAN.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Can VLAN 10 reach VLAN 20?</p>
        <div className="mt-3 flex gap-2">
          <Pick active={m === "roas"} onClick={() => setM("roas")}>
            Router on a stick
          </Pick>
          <Pick active={m === "svi"} onClick={() => setM("svi")}>
            MLS and SVI
          </Pick>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {m === "roas" ? (
            <>
              <Pick
                active={r.trunk}
                onClick={() => setR((v) => ({ ...v, trunk: !v.trunk }))}
              >
                {r.trunk
                  ? "Switch port to router: trunk"
                  : "Switch port to router: access"}
              </Pick>
              <Pick
                active={r.sub}
                onClick={() => setR((v) => ({ ...v, sub: !v.sub }))}
              >
                {r.sub ? "Subinterfaces: configured" : "Subinterfaces: missing"}
              </Pick>
            </>
          ) : (
            <>
              <Pick
                active={s.route}
                onClick={() => setS((v) => ({ ...v, route: !v.route }))}
              >
                {s.route ? "ip routing: ON" : "ip routing: OFF"}
              </Pick>
              <Pick
                active={s.vlan}
                onClick={() => setS((v) => ({ ...v, vlan: !v.vlan }))}
              >
                {s.vlan
                  ? "VLAN exists in database"
                  : "VLAN missing from database"}
              </Pick>
            </>
          )}
        </div>
        <p
          key={`${m}${why}`}
          className="n10-pop mt-3 rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: why ? RED : GREEN, color: why ? RED : GREEN }}
        >
          {why
            ? `✕ ${why}`
            : "✓ Routed. Hosts use the interface IP as gateway and inter-VLAN traffic flows."}
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">Router on a stick</p>
          <div className="mt-3">
            <Code
              lines={[
                "# int f0/0",
                "# no sh",
                "",
                "(conf)# interface f0/0.10",
                "(conf-if)# description GW - vlan 10",
                "(conf-if)# encapsulation dot1q 10",
                "(conf-if)# ip address 192.168.10.100 255.255.255.0",
                "(conf-if)# no sh",
                "",
                "! repeat for 20, 30, 40",
                "! switch side: switchport mode trunk",
              ]}
            />
          </div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">SVI on a multilayer switch</p>
          <div className="mt-3">
            <Code
              lines={[
                "(conf)# ip routing",
                "(conf)# vlan 10",
                "",
                "(conf)# interface vlan 10",
                "(conf-if)# description GW-VLAN10",
                "(conf-if)# ip address 192.168.10.100 255.255.255.0",
                "(conf-if)# no sh",
                "",
                "# show ip interface brief",
                "# show ip route",
              ]}
            />
          </div>
        </Panel>
      </div>

      <SimpleTable
        head={["", "Router on a stick", "SVI"]}
        rows={[
          ["Device", "External router", "Inside the multilayer switch"],
          ["Used with", "L2 switches", "L3 (multilayer) switches"],
          [
            "Link",
            "Single trunk, a possible bottleneck",
            "No physical port used",
          ],
          ["Gateway", "Subinterface IP", "SVI IP"],
          ["Today", "Small or legacy designs", "Preferred in modern networks"],
        ]}
      />
      <Tip title="Careful">
        The SVI will not come up unless the VLAN exists in the VLAN database. A
        variant of router on a stick uses one access port per VLAN to its own
        router interface, which wastes physical ports.
      </Tip>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 13 · 3-tier architecture ───────────────────────── */

const TIERS = [
  {
    id: "core",
    name: "Core",
    c: RED,
    role: "High-speed backbone. Connects the distribution layers and the edge routers to the ISPs.",
    keys: [
      "Speed and availability above all",
      "Edge routers link it to the ISPs",
    ],
  },
  {
    id: "dist",
    name: "Distribution",
    c: AMBER,
    role: "Policy enforcement, inter-VLAN routing and aggregation of access switches.",
    keys: [
      "SVIs on multilayer switches live here",
      "ACLs and policies",
      "EtherChannel uplinks down to access and up to core",
    ],
  },
  {
    id: "acc",
    name: "Access",
    c: GREEN,
    role: "Connects end devices such as PCs and servers. L2 switching and VLAN access ports.",
    keys: [
      "Access ports and VLAN membership",
      "Port security and unused-port shutdown",
    ],
  },
];

function TierSection() {
  const [sel, setSel] = useState("dist");
  const t = TIERS.find((x) => x.id === sel) ?? TIERS[1];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">
          Cisco 3-tier model: Core, Distribution, Access
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Splitting the network into layers keeps each job simple. Traffic flows
          Access to Distribution to Core, and edge routers connect the core to
          the ISPs. Tap a layer.
        </p>
      </Panel>

      <Panel>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-lg border border-dashed px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
            ISP 1 · ISP 2 (via edge routers)
          </div>
          {TIERS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setSel(x.id)}
              className="w-full rounded-xl border-2 py-4 text-center text-sm font-bold transition-all"
              style={{
                borderColor: x.c,
                background: sel === x.id ? x.c : `${x.c}14`,
                color: sel === x.id ? "#fff" : x.c,
              }}
            >
              {x.name}
            </button>
          ))}
          <div className="rounded-lg border border-dashed px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
            Servers · PCs
          </div>
        </div>
        <div key={sel} className="n10-fade mt-4">
          <p className="text-sm font-semibold" style={{ color: t.c }}>
            {t.name} layer
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t.role}
          </p>
          <div className="mt-2">
            <Bullets items={t.keys} />
          </div>
        </div>
        <div className="mt-3">
          <Tip title="Good to know">
            Redundant links and devices at every layer avoid a single point of
            failure. EtherChannel stops STP from blocking the extra uplinks.
          </Tip>
        </div>
      </Panel>
      {/* ▼▼▼ (2/5) ADD NEXT NOTES for this subtopic here ▼▼▼ */}
    </div>
  );
}

/* ───────────────────────── 10 · commands cheat sheet ───────────────────────── */

/* ▼▼▼ (4/5) NOTES DATA: add rows as [group, task, command]. Group must be one of GROUPS ▼▼▼ */
const CMD_ROWS: string[][] = [
  [
    "Forwarding",
    "(no commands: switch hardware setting)",
    "store-and-forward is the usual default",
  ],
  ["MLS", "Enable routing on a multilayer switch", "ip routing"],
  ["MLS", "Layer 2 port to Layer 3 port", "no switchport"],
  ["MLS", "Layer 3 port back to Layer 2", "switchport"],
  ["MLS", "Reset an interface", "default interface f0/0"],
  ["VLAN", "Create a VLAN", "vlan 10  then  name HR"],
  ["VLAN", "Create several VLANs", "vlan 10-20,25-30"],
  ["VLAN", "Delete a VLAN", "no vlan 10"],
  ["VLAN", "Verify VLANs", "show vlan brief  |  show vlan id 10"],
  [
    "Access",
    "Configure an access port",
    "switchport mode access  +  switchport access vlan 30",
  ],
  ["Access", "Configure many ports", "interface range f0/0-3, f1/2-3"],
  ["Trunk", "Set the encapsulation", "switchport trunk encapsulation dot1q"],
  ["Trunk", "Make a trunk", "switchport mode trunk"],
  [
    "Trunk",
    "Allowed VLANs",
    "switchport trunk allowed vlan 10,20,30  |  add 50  |  remove 40  |  none",
  ],
  ["Trunk", "Verify trunks", "show interfaces trunk"],
  ["Native", "Change the native VLAN", "switchport trunk native vlan 99"],
  ["Native", "Tag the native VLAN", "vlan dot1q tag native   (global)"],
  ["DTP", "Dynamic modes", "switchport mode dynamic desirable  |  auto"],
  [
    "DTP",
    "Disable DTP",
    "switchport nonegotiate   (static trunk or access only)",
  ],
  [
    "EtherChannel",
    "Manual bundle",
    "interface range f0/0-3  +  channel-group 10 mode on",
  ],
  [
    "EtherChannel",
    "LACP bundle",
    "channel-protocol lacp  +  channel-group 10 mode active | passive",
  ],
  [
    "EtherChannel",
    "PAgP bundle",
    "channel-protocol pagp  +  channel-group 10 mode desirable | auto",
  ],
  [
    "EtherChannel",
    "Configure the logical port",
    "interface port-channel 10  +  switchport trunk allowed vlan ...",
  ],
  [
    "EtherChannel",
    "Verify",
    "show etherchannel summary  |  show etherchannel 10 detail",
  ],
  [
    "Inter-VLAN",
    "Router on a stick subinterface",
    "interface f0/0.10  +  encapsulation dot1q 10  +  ip address ...",
  ],
  ["Inter-VLAN", "Enable routing for SVIs", "ip routing"],
  [
    "Inter-VLAN",
    "Create an SVI",
    "interface vlan 10  +  ip address ...  +  no sh",
  ],
  ["Inter-VLAN", "Verify", "show ip interface brief  |  show ip route"],
  // ▲ ADD NEW ROWS ABOVE THIS LINE
];
/* ▼▼▼ (4/5) NOTES DATA: when you add a subtopic, add its name here so the filter pills show it ▼▼▼ */
const GROUPS = [
  "All",
  "Forwarding",
  "MLS",
  "VLAN",
  "Access",
  "Trunk",
  "Native",
  "DTP",
  "EtherChannel",
  "Inter-VLAN",
  "3-Tier",
];

function CmdsSection() {
  const [g, setG] = useState("All");
  const [q, setQ] = useState("");
  const rows = CMD_ROWS.filter(
    (r) =>
      (g === "All" || r[0] === g) &&
      (!q || r.join(" ").toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((x) => (
          <Pick key={x} active={g === x} onClick={() => setG(x)}>
            {x}
          </Pick>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search commands..."
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        aria-label="Search commands"
      />
      <SimpleTable head={["Topic", "Task", "Command"]} rows={rows} />
      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">Nothing matches.</p>
      )}
      <Tip title="Reading the prompts">
        In notes, # stands for Switch# (privilege EXEC) or a config prompt,
        depending on the mode you are in. The prompt always tells you where you
        are.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 11 · common mistakes ───────────────────────── */

type Myth = { g: string; wrong: string; right: string };
/* ▼▼▼ (4/5) NOTES DATA: add new wrong/right cards here. g must be one of GROUPS ▼▼▼ */
const MYTHS: Myth[] = [
  {
    g: "Forwarding",
    wrong: "Cut-through checks the CRC.",
    right:
      "It reads only the destination MAC and starts forwarding. It never checks the FCS, so damaged frames are passed on.",
  },
  {
    g: "Forwarding",
    wrong: "Fragment-free reads only the destination MAC.",
    right:
      "It reads the first 64 bytes, enough to catch collision fragments and early damage.",
  },
  {
    g: "Forwarding",
    wrong: "Store and forward is always the best choice.",
    right:
      "It has the most checking but the most latency. Cut-through is used where the lowest latency matters.",
  },
  {
    g: "MLS",
    wrong: "Routing is on by default on a multilayer switch.",
    right: "It is off. Turn it on with ip routing.",
  },
  {
    g: "MLS",
    wrong: "A port with an IP address is automatically a routed port.",
    right:
      "It stays a switchport (and refuses the address) until you enter no switchport.",
  },
  {
    g: "VLAN",
    wrong: "VLAN 1 can be deleted once you have your own VLANs.",
    right: "VLAN 1, and 1002 to 1005, cannot be deleted.",
  },
  {
    g: "VLAN",
    wrong: "Hosts in different VLANs can talk through the switch.",
    right:
      "Each VLAN is its own network. They need a Layer 3 device for inter-VLAN routing.",
  },
  {
    g: "VLAN",
    wrong: "All VLANs 1 to 4094 are the normal range.",
    right: "Normal is 1 to 1005. Extended is 1006 to 4094.",
  },
  {
    g: "VLAN",
    wrong: "Deleting a VLAN moves its ports to VLAN 1.",
    right: "The ports become inactive and pass no traffic until reassigned.",
  },
  {
    g: "VLAN",
    wrong: "show run lists every VLAN.",
    right: "Normal-range VLANs live in vlan.dat. Use show vlan brief.",
  },
  {
    g: "VLAN",
    wrong: "Dynamic VLAN assignment (VMPS) is the standard approach.",
    right:
      "Static assignment is standard. VMPS is complex, Cisco proprietary and rarely used.",
  },
  {
    g: "Access",
    wrong: "An access port can carry several VLANs.",
    right: "It carries one data VLAN, untagged. Trunks carry many.",
  },
  {
    g: "Access",
    wrong:
      "A switch in the middle does not need the VLAN, only the end switches do.",
    right:
      "Every switch on the path needs the VLAN in its database and on its trunk allowed lists, or it drops the frames.",
  },
  {
    g: "Trunk",
    wrong: "ISL and dot1q both add a 4-byte tag.",
    right:
      "dot1q inserts a 4-byte tag. ISL encapsulates the frame with a 26-byte header and a 4-byte trailer.",
  },
  {
    g: "Trunk",
    wrong: "A dot1q trunk tags every VLAN.",
    right: "The native VLAN travels untagged. All others are tagged.",
  },
  {
    g: "Trunk",
    wrong: "switchport trunk allowed vlan 50 adds VLAN 50.",
    right: "It replaces the whole list with just 50. Use allowed vlan add 50.",
  },
  {
    g: "Trunk",
    wrong: "A PC on a trunk port can use any VLAN.",
    right:
      "A PC does not understand tags, so it only works in the native (untagged) VLAN.",
  },
  {
    g: "Native",
    wrong: "The native VLAN has to be VLAN 1.",
    right:
      "It defaults to VLAN 1 but can be any VLAN, and should be an unused one.",
  },
  {
    g: "Native",
    wrong: "A native VLAN mismatch brings the trunk down.",
    right:
      "The trunk stays up, but untagged traffic leaks between different VLANs, and warnings are logged.",
  },
  {
    g: "Native",
    wrong: "Changing the native VLAN completely stops double tagging.",
    right:
      "It helps, but tagging the native VLAN too (vlan dot1q tag native) is more effective, and hosts must stay out of the native VLAN.",
  },
  {
    g: "DTP",
    wrong: "DTP negotiates the native VLAN and allowed VLANs.",
    right:
      "It negotiates only trunk or access, and ISL or dot1q. Everything else is manual.",
  },
  {
    g: "DTP",
    wrong: "Dynamic auto and dynamic auto form a trunk.",
    right: "Neither side starts negotiation, so no trunk forms.",
  },
  {
    g: "DTP",
    wrong: "switchport nonegotiate works on dynamic modes.",
    right: "It needs a static trunk or access port.",
  },
  {
    g: "EtherChannel",
    wrong: "With parallel links, STP lets all of them forward.",
    right:
      "STP blocks all but one. EtherChannel makes them one logical link, so none is blocked.",
  },
  {
    g: "EtherChannel",
    wrong: "LACP supports 16 active links.",
    right:
      "16 links can join, but only 8 are active. The other 8 stay in standby.",
  },
  {
    g: "EtherChannel",
    wrong: "Passive + Passive forms a bundle (same for Auto + Auto).",
    right: "Nobody starts negotiation, so no bundle forms.",
  },
  {
    g: "EtherChannel",
    wrong: "Mode on works with an LACP neighbor.",
    right: "On does not negotiate. It only bundles with another On.",
  },
  {
    g: "EtherChannel",
    wrong: "One mismatched member breaks the whole bundle.",
    right:
      "That member is suspended (s or I in show etherchannel summary). The others keep working.",
  },
  {
    g: "Inter-VLAN",
    wrong: "An SVI comes up as soon as you create it.",
    right:
      "The VLAN must exist in the VLAN database, ip routing must be on, and it needs no sh.",
  },
  {
    g: "Inter-VLAN",
    wrong: "Router on a stick needs one router port per VLAN.",
    right:
      "One physical port is split into dot1q subinterfaces, and the switch port is a trunk.",
  },
  {
    g: "3-Tier",
    wrong: "Inter-VLAN routing normally happens at the access layer.",
    right: "It typically lives at the distribution layer (SVIs on MLS).",
  },
  // ▲ ADD NEW CARDS ABOVE THIS LINE
];

function MythsSection() {
  const [g, setG] = useState("All");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const list = MYTHS.map((m, i) => ({ m, i })).filter(
    ({ m }) => g === "All" || m.g === g,
  );
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const allOpen = list.length > 0 && list.every(({ i }) => open.has(i));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((x) => (
          <Pick key={x} active={g === x} onClick={() => setG(x)}>
            {x}
          </Pick>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">
          Tap a card to flip it from the wrong belief to the truth.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setOpen((s) => {
              const n = new Set(s);
              list.forEach(({ i }) => (allOpen ? n.delete(i) : n.add(i)));
              return n;
            })
          }
        >
          {allOpen ? "Hide all" : "Show all"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map(({ m, i }) => {
          const shown = open.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50"
              style={{ borderColor: shown ? GREEN : undefined }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: RED }}>
                  ✕ Wrong
                </p>
                <Badge variant="secondary">{m.g}</Badge>
              </div>
              <p className="mt-1 text-sm font-medium">{m.wrong}</p>
              {shown ? (
                <div className="n10-fade mt-3 border-t pt-3">
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>
                    ✓ Right
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {m.right}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Tap to see the truth
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 12 · interview prep ───────────────────────── */

type QAi = { g: string; q: string; a: string[] };
/* ▼▼▼ (4/5) NOTES DATA: add new interview questions here. g must be one of GROUPS ▼▼▼ */
const QA: QAi[] = [
  {
    g: "Forwarding",
    q: "Compare the three switch forwarding methods.",
    a: [
      "Store and forward: copies the whole frame, checks the CRC, then forwards. Most reliable, highest latency.",
      "Cut-through: reads only the destination MAC (first 6 bytes) and forwards at once. Lowest latency, no error checking.",
      "Fragment-free: reads the first 64 bytes, so it catches collision fragments. A balance of the two.",
    ],
  },
  {
    g: "MLS",
    q: "How do you enable routing on a multilayer switch, and make a routed port?",
    a: [
      "Routing is off by default: ip routing in global config.",
      "On the port: no switchport, then ip address and no shutdown. switchport turns it back into a Layer 2 port.",
      "default interface f0/0 resets a port to factory settings.",
    ],
  },
  {
    g: "VLAN",
    q: "What is a VLAN and why use one?",
    a: [
      "A VLAN is a broadcast domain, a logical network inside the switches.",
      "It improves performance (less broadcast), security (separation, ACLs between VLANs) and flexibility (users anywhere).",
      "Different VLANs need inter-VLAN routing to talk.",
    ],
  },
  {
    g: "VLAN",
    q: "Static vs dynamic VLAN membership?",
    a: [
      "Static: the port is assigned by hand and joins immediately.",
      "Dynamic: a VMPS server maps the host MAC to a VLAN. Complex and Cisco proprietary, so rarely used.",
    ],
  },
  {
    g: "VLAN",
    q: "What are the VLAN ranges and where is the database stored?",
    a: [
      "Normal range 1 to 1005, extended 1006 to 4094. VLAN 1 cannot be deleted.",
      "The normal-range database is the vlan.dat file in flash.",
    ],
  },
  {
    g: "Access",
    q: "User in VLAN 30 on SW1 cannot reach a VLAN 30 user on SW3, through SW2. Why?",
    a: [
      "Most likely SW2 has no VLAN 30 in its database, so it drops the frames.",
      "Also check that VLAN 30 is in the allowed list of both trunks.",
    ],
  },
  {
    g: "Access",
    q: "Access port vs trunk port?",
    a: [
      "An access port carries one VLAN, untagged, and connects hosts.",
      "A trunk carries many VLANs with tags, and connects switches.",
    ],
  },
  {
    g: "Trunk",
    q: "ISL vs 802.1Q?",
    a: [
      "ISL is Cisco proprietary, encapsulates the frame (26-byte header, 4-byte trailer), supports VLANs 1 to 1005 and is rarely used.",
      "802.1Q is the IEEE standard, inserts a 4-byte tag, supports 1 to 4094 and is the default.",
    ],
  },
  {
    g: "Trunk",
    q: "What do you check when a trunk does not work?",
    a: [
      "Layer 1 status and transceiver, speed and duplex.",
      "Same encapsulation, same native VLAN, same allowed VLANs.",
      "Use show interfaces trunk and show interfaces status.",
    ],
  },
  {
    g: "Trunk",
    q: "How do you restrict the VLANs on a trunk?",
    a: [
      "switchport trunk allowed vlan with a list, add, remove, none or all. All VLANs are allowed by default.",
      "Careful: a plain list replaces the existing one.",
    ],
  },
  {
    g: "Native",
    q: "Default VLAN vs native VLAN?",
    a: [
      "Default VLAN is VLAN 1 and cannot be deleted.",
      "The native VLAN is the untagged VLAN on a dot1q trunk and can be changed. It also carries control traffic like CDP, DTP and STP BPDUs.",
    ],
  },
  {
    g: "Native",
    q: "Can a PC communicate through a trunk port?",
    a: [
      "Only in the native VLAN. A PC cannot read tags, so only untagged native VLAN traffic works, and it must be in that subnet.",
    ],
  },
  {
    g: "Native",
    q: "Two switch ports in different VLANs are joined by an untagged link. What happens?",
    a: [
      "The link is an access link, so frames pass between the two VLANs as if they were one segment.",
      "It works at Layer 2 only if the hosts share a subnet, but it merges two VLANs, which is a misconfiguration.",
    ],
  },
  {
    g: "Native",
    q: "Two PCs in the same VLAN over a trunk: 192.168.10.1/24 and 192.168.10.2/25. Can they talk?",
    a: [
      "Yes. Each host ANDs the other's address with its own mask. Both addresses fall in the same network from each point of view.",
      "It would fail if one address were outside the other's mask, for example .130 with a /25.",
    ],
  },
  {
    g: "Native",
    q: "What is the VLAN double tagging attack and how do you stop it?",
    a: [
      "The attacker, sitting in the native VLAN, sends a frame with two tags. The first switch strips the outer one, and the second switch delivers the frame to the victim VLAN. It is one-way, enough for a DoS.",
      "Fix: move the native VLAN to an unused VLAN, and tag the native VLAN too (vlan dot1q tag native). Keep hosts out of the native VLAN.",
    ],
  },
  {
    g: "DTP",
    q: "What is DTP and which mode combinations make a trunk?",
    a: [
      "DTP negotiates trunk or access, and the tagging protocol. Desirable asks, auto only answers.",
      "Desirable with auto, desirable or trunk, and auto with trunk, make a trunk. Auto with auto does not.",
    ],
  },
  {
    g: "DTP",
    q: "How do you turn DTP off?",
    a: [
      "Configure the port as a static trunk (switchport mode trunk) and add switchport nonegotiate.",
      "Best practice is manual trunks with no negotiation.",
    ],
  },
  {
    g: "EtherChannel",
    q: "What is EtherChannel and why use it?",
    a: [
      "It bundles several physical links into one logical link (Port-Channel, LAG). It gives more bandwidth and redundancy.",
      "STP sees one link, so no member is blocked. If a member fails, traffic continues without an STP recalculation.",
    ],
  },
  {
    g: "EtherChannel",
    q: "LACP vs PAgP?",
    a: [
      "LACP: open standard (802.3ad), up to 16 links with 8 active, modes Active and Passive.",
      "PAgP: Cisco proprietary, up to 8 links all active, modes Desirable and Auto.",
      "Passive + Passive and Auto + Auto do not form a bundle.",
    ],
  },
  {
    g: "EtherChannel",
    q: "An EtherChannel will not form. What do you check?",
    a: [
      "Layer 1, same interface type, speed and duplex.",
      "Same channel number, protocol and STP type.",
      "Same trunk encapsulation, allowed VLANs and native VLAN.",
      "A mismatched member is suspended (s or I in show etherchannel summary).",
    ],
  },
  {
    g: "EtherChannel",
    q: "How do you configure an EtherChannel?",
    a: [
      "Step 1: on the physical interfaces, channel-group N mode on | active | passive | desirable | auto (with channel-protocol for LACP or PAgP).",
      "Step 2: configure interface port-channel N as trunk, access or L3.",
      "Verify with show etherchannel summary.",
    ],
  },
  {
    g: "Inter-VLAN",
    q: "How do you route between VLANs?",
    a: [
      "Router on a stick: one trunk to a router, one dot1q subinterface per VLAN. Used with L2 switches.",
      "SVI on a multilayer switch: ip routing, make sure the VLAN exists, then interface vlan N with an IP address. Preferred today.",
    ],
  },
  {
    g: "Inter-VLAN",
    q: "Why is an SVI down?",
    a: [
      "The VLAN is missing from the VLAN database, or the SVI is shut down.",
      "Also check ip routing is enabled for inter-VLAN routing.",
    ],
  },
  {
    g: "3-Tier",
    q: "Describe the Cisco 3-tier architecture.",
    a: [
      "Core: fast backbone linking distribution and edge routers to the ISPs.",
      "Distribution: policies, inter-VLAN routing and aggregation.",
      "Access: end devices, L2 switching and VLAN access ports.",
      "Redundant links, often EtherChannel, at each layer.",
    ],
  },
  // ▲ ADD NEW QUESTIONS ABOVE THIS LINE
];

function InterviewSection() {
  const [g, setG] = useState("All");
  const [open, setOpen] = useState<number | null>(0);
  const list = QA.filter((x) => g === "All" || x.g === g);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          A VLAN is a logical broadcast domain inside a switch. It cuts
          broadcast traffic, separates departments, and removes physical
          boundaries. Hosts connect to access ports, which carry one VLAN
          untagged. Switches connect through trunks, which carry many VLANs
          using 802.1Q tags, except for the native VLAN, which is untagged.
          Trunk ends must agree on encapsulation, native VLAN and allowed VLANs.
          Different VLANs need inter-VLAN routing, for example on a multilayer
          switch with ip routing enabled. For security, move the native VLAN off
          VLAN 1 and tag it to stop double tagging. DTP can negotiate trunks,
          but best practice is manual trunks with nonegotiate.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Practice it out loud until it flows without notes.
        </p>
      </Panel>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((x) => (
          <Pick
            key={x}
            active={g === x}
            onClick={() => {
              setG(x);
              setOpen(null);
            }}
          >
            {x}
          </Pick>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {list.map((x, i) => {
          const isOpen = open === i;
          return (
            <div key={x.q} className="rounded-xl border bg-background">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">
                    {i + 1}.
                  </span>
                  {x.q}
                </span>
                <span className="text-muted-foreground">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <ul className="n10-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">
        Access = one VLAN, untagged. Trunk = many VLANs, tagged (native
        untagged). Match both ends. Avoid DTP.
      </Tip>
    </div>
  );
}

/* ▼▼▼ (2/5) NEW SECTION COMPONENTS GO HERE: function XxxSection() { ... } (copy any section above as a template) ▼▼▼ */

/* ───────────────────────── main component ───────────────────────── */

export function SwitchingVlanExplainer() {
  const [tab, setTab] = useState<TabId>("fwd");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      {/* ▼▼▼ (5/5) CSS: add new keyframes and classes for new animations here (prefix n10-) ▼▼▼ */}
      <style>{`
        @keyframes n10-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes n10-pop { from { opacity: 0; transform: scale(.88); } to { opacity: 1; transform: none; } }
        @keyframes n10-flyR { from { left: 0; opacity: 0; } 15% { opacity: 1; } to { left: calc(100% - 2.75rem); opacity: 1; } }
        @keyframes n10-flyL { from { left: calc(100% - 2.75rem); opacity: 0; } 15% { opacity: 1; } to { left: 0; opacity: 1; } }
        @keyframes n10-ring { 0% { box-shadow: 0 0 0 0 rgba(47,158,68,.5); } 100% { box-shadow: 0 0 0 10px rgba(47,158,68,0); } }
        .n10-fade { animation: n10-fade .45s ease-out both; }
        .n10-pop { animation: n10-pop .35s ease-out both; }
        .n10-flyR { animation: n10-flyR 1.1s ease-in-out both; }
        .n10-flyL { animation: n10-flyL 1.1s ease-in-out .3s both; }
        .n10-ring { animation: n10-ring 1s ease-out 2; }
        @media (prefers-reduced-motion: reduce) {
          .n10-fade, .n10-pop, .n10-flyR, .n10-flyL, .n10-ring { animation: none; opacity: 1; }
          .n10-flyR { left: 10%; }
          .n10-flyL { left: 60%; }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              Topic 10: Switching, VLANs and trunking
            </CardTitle>
            <CardDescription className="mt-1">
              Forwarding, VLANs, access and trunk ports, native VLAN and DTP.
              Tap through the sections in any order.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Pick key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </Pick>
          ))}
        </div>

        <div key={tab}>
          {tab === "fwd" && <ForwardSection />}
          {tab === "mls" && <MlsSection />}
          {tab === "vlan" && <VlanSection />}
          {tab === "cfg" && <CfgSection />}
          {tab === "access" && <AccessSection />}
          {tab === "trunk" && <TrunkSection />}
          {tab === "tcfg" && <TcfgSection />}
          {tab === "native" && <NativeSection />}
          {tab === "dtp" && <DtpSection />}
          {tab === "ech" && <EtherChannelSection />}
          {tab === "echcfg" && <EchCfgSection />}
          {tab === "ivr" && <IvrSection />}
          {tab === "tier" && <TierSection />}
          {/* ▼▼▼ (3/5) RENDER: add new sections here, for example {tab === "vtp" && <VtpSection />} ▼▼▼ */}
          {tab === "cmds" && <CmdsSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}
