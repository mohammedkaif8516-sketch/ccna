"use client";

import { useState } from "react";
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
 * EthernetCablingExplainer  (CCNA Topic 03)
 *   1 Big picture        : what Ethernet is, where it came from, why it won, the speed ladder
 *   2 Cable types        : twisted pair, coax, fiber, categories, fiber modes, transceivers
 *   3 Wiring             : 568B pinout, which pins carry data, straight-through vs crossover
 *   4 Power over Ethernet: standards, PSE and PD, "will this device work?" checker
 *   5 How it works       : the five-step journey of a frame
 *   6 Which cable?       : scenario guide (tap a scenario to see the answer and why)
 *   7 Common mistakes    : wrong belief on the front, the truth on the back
 *   8 Interview prep     : 30-second answer and the usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";

const TABS = [
  { id: "big", label: "1 · Big picture" },
  { id: "cables", label: "2 · Cable types" },
  { id: "wiring", label: "3 · Wiring" },
  { id: "poe", label: "4 · PoE" },
  { id: "how", label: "5 · How it works" },
  { id: "pick", label: "6 · Which cable?" },
  { id: "myths", label: "7 · Common mistakes" },
  { id: "interview", label: "8 · Interview prep" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ───────────────────────── small helpers ───────────────────────── */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-background p-4 ${className}`}>{children}</div>;
}

function Tip({ title = "Remember", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs leading-5">
      <span className="font-semibold text-primary">{title}: </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function SimpleTable({ head, rows, hit }: { head: string[]; rows: string[][]; hit?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[480px] text-xs">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t" style={hit === i ? { color: GREEN, fontWeight: 600 } : undefined}>
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold" : ""}`}>{c}</td>
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
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
      <p className="text-xs font-medium" style={color ? { color } : undefined}>{v}</p>
    </div>
  );
}

/* ───────────────────────── 1 · big picture ───────────────────────── */

const HISTORY = [
  { who: "Xerox", what: "First version at 2.94 Mbps, built for a LAN." },
  { who: "DIX consortium", what: "Digital, Intel and Xerox released the first public version at 10 Mbps (Ethernet II)." },
  { who: "IEEE", what: "Standardized it as IEEE 802.3. That is why the family is called 802.3 Ethernet." },
  { who: "Today", what: "An open standard. Anyone can build Ethernet gear, and it all works together." },
];

const WHY = [
  { t: "Inexpensive", d: "Cheap hardware and cheap cable." },
  { t: "Simple to install", d: "Crimp an RJ-45 connector and plug in." },
  { t: "Flexible and scalable", d: "10 Mbps to 400 Gbps, same basic idea." },
  { t: "Multi-vendor", d: "Open standard means every vendor interoperates." },
];

const SPEEDS = [
  { name: "Ethernet", label: "10 Mbps", mbps: 10 },
  { name: "Fast Ethernet", label: "100 Mbps", mbps: 100 },
  { name: "Gigabit Ethernet", label: "1 Gbps", mbps: 1000 },
  { name: "10 Gigabit", label: "10 Gbps", mbps: 10000 },
  { name: "25 Gigabit", label: "25 Gbps", mbps: 25000 },
  { name: "40 Gigabit", label: "40 Gbps", mbps: 40000 },
  { name: "100 Gigabit", label: "100 Gbps", mbps: 100000 },
  { name: "200 Gigabit", label: "200 Gbps", mbps: 200000 },
  { name: "400 Gigabit", label: "400 Gbps", mbps: 400000 },
];

function BigSection() {
  const [h, setH] = useState(0);
  const [sp, setSp] = useState(2);
  const s = SPEEDS[sp];
  const times = (mbps: number) => {
    const sec = (1000 * 8) / mbps; // 1 GB = 8000 megabits
    if (sec >= 1) return `${sec.toFixed(sec >= 10 ? 0 : 1)} seconds`;
    return `${(sec * 1000).toFixed(sec * 1000 >= 10 ? 0 : 1)} milliseconds`;
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Ethernet is a family of standards, not one cable or one speed</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          It decides how devices on a network build frames, address each other with MAC addresses, and share the wire.
          It is standardized by the IEEE (802.3) and used mostly in LANs. It also appears in WAN links, for example
          Metro Ethernet from a provider.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">Speed changes. The idea does not.</Badge>
          <Badge variant="secondary">Layers 1 and 2 of OSI</Badge>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Where it came from</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HISTORY.map((x, i) => (
            <Pick key={x.who} active={h === i} onClick={() => setH(i)}>{x.who}</Pick>
          ))}
        </div>
        <p key={h} className="n3-fade mt-3 text-xs leading-5 text-muted-foreground">{HISTORY[h].what}</p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Why Ethernet won</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {WHY.map((w) => (
            <Mini key={w.t} k={w.t} v={w.d} />
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The speed ladder</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap a speed. Bars use a log scale, so each step is a big jump.</p>
        <div className="mt-3 flex flex-col gap-1.5">
          {SPEEDS.map((x, i) => (
            <button
              key={x.name}
              type="button"
              onClick={() => setSp(i)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${
                sp === i ? "border-primary bg-primary/10" : "hover:border-primary/50"
              }`}
            >
              <span className="w-32 font-semibold">{x.name}</span>
              <span className="w-16 font-mono">{x.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(Math.log10(x.mbps) / Math.log10(400000)) * 100}%`, background: sp === i ? BLUE : `${BLUE}70` }}
                />
              </span>
            </button>
          ))}
        </div>
        <p key={sp} className="n3-fade mt-3 text-xs text-muted-foreground">
          At <span className="font-semibold text-foreground">{s.label}</span>, a 1 GB file needs about{" "}
          <span className="font-semibold" style={{ color: GREEN }}>{times(s.mbps)}</span> in theory (real links lose a little to overhead).
        </p>
      </Panel>

      <Tip>
        A 400 Gbps link and a 10 Mbps link both send frames with a source and destination MAC address. Upgrades change
        the encoding and the medium, never the idea.
      </Tip>
      <Tip title="Also good to know">
        Between 1 and 10 Gbps there are also 2.5 and 5 Gbps copper speeds (multigigabit). They exist so old Cat 5e cable can go faster.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 2 · cable types ───────────────────────── */

const CABLES = [
  {
    id: "tp", name: "Twisted pair (UTP / STP)", carries: "Electrical signal", built: "8 wires in 4 twisted pairs, with a plastic jacket",
    best: "Short runs (up to 100 m) and cheap LAN cabling", avoid: "Long distances and very noisy factories (unless shielded)",
    hook: "The everyday LAN cable.",
    extra: ["UTP = unshielded. STP = shielded: an extra foil or braid around the pairs blocks interference (EMI).", "Twisting the pairs cancels out interference between them."],
  },
  {
    id: "coax", name: "Coaxial", carries: "Electrical signal", built: "Copper core, insulation, a metal shield and an outer jacket",
    best: "Cable TV and cable internet service today", avoid: "New data networks inside buildings. It is legacy there.",
    hook: "Dead for LANs, alive for TV.",
    extra: ["Early Ethernet (10BASE2, 10BASE5) ran on coax.", "Your ISP may still bring cable internet to the home on coax. A cable modem then gives you Ethernet."],
  },
  {
    id: "fiber", name: "Fiber optic", carries: "Light", built: "Glass core surrounded by cladding, plus a protective jacket",
    best: "Long distance, high speed, and places with electrical interference", avoid: "Cheap short runs where copper is fine",
    hook: "Light, not electricity.",
    extra: ["Immune to EMI, because there is no electricity to disturb.", "Harder to tap than copper, so it is also more secure.", "Needs transceivers to turn electrical signals into light."],
  },
];

const CATS = [
  { cat: "Cat 3", speed: "10 Mbps", dist: "100 m", use: "Old phone lines and 10BASE-T. Obsolete.", rank: 1 },
  { cat: "Cat 5", speed: "100 Mbps", dist: "100 m", use: "Fast Ethernet (100BASE-TX). Obsolete.", rank: 2 },
  { cat: "Cat 5e", speed: "1 Gbps", dist: "100 m", use: "Gigabit Ethernet. Stricter crosstalk limits than Cat 5.", rank: 3 },
  { cat: "Cat 6", speed: "1 Gbps (10 Gbps up to about 55 m)", dist: "100 m at 1 Gbps", use: "Tighter tolerances, often with a separator inside.", rank: 4 },
  { cat: "Cat 6a", speed: "10 Gbps", dist: "100 m", use: "10 Gbps over a full 100 m run.", rank: 5 },
];

const MODES = [
  { id: "sm", name: "Single-mode", core: "Very small core (about 9 micrometres)", light: "One ray of light", dist: "Very long: 10, 40, 100 km or more", use: "Between buildings, cities and countries", cost: "Cheaper cable, but more expensive optics (lasers)" },
  { id: "mm", name: "Multi-mode", core: "Larger core (50 or 62.5 micrometres)", light: "Many rays of light at once", dist: "Short: roughly 100 to 550 m depending on speed", use: "Inside one building or campus, data centers", cost: "Cheaper optics, so cheaper for short runs" },
];

const XCVR = [
  ["SFP", "1 Gbps", "Small Form-factor Pluggable. The original."],
  ["SFP+", "10 Gbps", "Same size as SFP, 10 times faster."],
  ["SFP28", "25 Gbps", "Same size again, 25 Gbps."],
  ["QSFP+", "40 Gbps", "Quad (4 lanes of 10 Gbps)."],
  ["QSFP28", "100 Gbps", "Quad (4 lanes of 25 Gbps)."],
  ["QSFP-DD", "400 Gbps", "Double-density, 8 lanes. Used in data centers."],
];

function CablesSection() {
  const [c, setC] = useState("tp");
  const [m, setM] = useState("sm");
  const [cat, setCat] = useState(2);
  const cable = CABLES.find((x) => x.id === c)!;
  const mode = MODES.find((x) => x.id === m)!;
  const ct = CATS[cat];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Three kinds of cable</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CABLES.map((x) => (
            <Pick key={x.id} active={c === x.id} onClick={() => setC(x.id)}>{x.name}</Pick>
          ))}
        </div>
        <div key={c} className="n3-fade mt-3 flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">{cable.hook}</Badge>
          <div className="grid gap-2 sm:grid-cols-2">
            <Mini k="Carries" v={cable.carries} color={BLUE} />
            <Mini k="Built from" v={cable.built} />
            <Mini k="Best for" v={cable.best} color={GREEN} />
            <Mini k="Avoid for" v={cable.avoid} color={RED} />
          </div>
          <Bullets items={cable.extra} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Twisted pair categories</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap a category. Higher number means a better cable.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((x, i) => (
            <Pick key={x.cat} active={cat === i} onClick={() => setCat(i)}>{x.cat}</Pick>
          ))}
        </div>
        <div key={cat} className="n3-fade mt-3 grid gap-2 sm:grid-cols-3">
          <Mini k="Typical use" v={ct.use} />
          <Mini k="Speed" v={ct.speed} color={GREEN} />
          <Mini k="Max run" v={ct.dist} color={AMBER} />
        </div>
        <div className="mt-3">
          <SimpleTable head={["Category", "Speed", "Max run"]} rows={CATS.map((x) => [x.cat, x.speed, x.dist])} hit={cat} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Careful">
            Notes often say Cat 3 = 3 twists per inch, Cat 5 = 5, Cat 6 = 6. It is a handy memory hook, but not an exact
            rule. What really changes is the twist tightness, the quality and the crosstalk limits, so each category is
            certified for a higher frequency.
          </Tip>
          <Tip title="Limit">
            Twisted pair is limited to 100 m. The speed limit depends on the category, not on twisted pair itself: 1 Gbps
            for Cat 5e, 10 Gbps for Cat 6a.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Fiber: single-mode vs multi-mode</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODES.map((x) => (
            <Pick key={x.id} active={m === x.id} onClick={() => setM(x.id)}>{x.name}</Pick>
          ))}
        </div>
        <div key={m} className="n3-fade mt-3 grid gap-2 sm:grid-cols-2">
          <Mini k="Core" v={mode.core} />
          <Mini k="Light" v={mode.light} />
          <Mini k="Distance" v={mode.dist} color={GREEN} />
          <Mini k="Used for" v={mode.use} />
          <Mini k="Cost" v={mode.cost} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Memory hook: <span className="font-semibold text-foreground">single</span> ray goes the <span className="font-semibold text-foreground">longest</span> way.
          Both can carry very high speeds. The real difference is distance and cost.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Fiber transceivers</p>
        <p className="mt-1 text-xs text-muted-foreground">A transceiver (transmitter + receiver) plugs into a switch port and turns electrical signals into light and back.</p>
        <div className="mt-3">
          <SimpleTable head={["Name", "Speed", "Note"]} rows={XCVR} />
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            A plain QSFP is 40 Gbps in most books. 100 Gbps needs QSFP28. Each plug size has a Gbps number, so learn them as pairs.
          </Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 3 · wiring ───────────────────────── */

type Pin = { n: number; name: string; color: string; stripe: boolean; pair: string; fe: string; ge: string };
const PINS: Pin[] = [
  { n: 1, name: "Orange / White", color: "#f08c00", stripe: true, pair: "Orange pair", fe: "Tx+", ge: "Pair 1 (BI_DA)" },
  { n: 2, name: "Orange", color: "#f08c00", stripe: false, pair: "Orange pair", fe: "Tx−", ge: "Pair 1 (BI_DA)" },
  { n: 3, name: "Green / White", color: "#2f9e44", stripe: true, pair: "Green pair", fe: "Rx+", ge: "Pair 2 (BI_DB)" },
  { n: 4, name: "Blue", color: "#1971c2", stripe: false, pair: "Blue pair", fe: "Unused", ge: "Pair 3 (BI_DC)" },
  { n: 5, name: "Blue / White", color: "#1971c2", stripe: true, pair: "Blue pair", fe: "Unused", ge: "Pair 3 (BI_DC)" },
  { n: 6, name: "Green", color: "#2f9e44", stripe: false, pair: "Green pair", fe: "Rx−", ge: "Pair 2 (BI_DB)" },
  { n: 7, name: "Brown / White", color: "#8a5a2b", stripe: true, pair: "Brown pair", fe: "Unused", ge: "Pair 4 (BI_DD)" },
  { n: 8, name: "Brown", color: "#8a5a2b", stripe: false, pair: "Brown pair", fe: "Unused", ge: "Pair 4 (BI_DD)" },
];

const bg = (p: Pin) =>
  p.stripe ? `repeating-linear-gradient(45deg, ${p.color} 0 5px, #ffffff 5px 10px)` : p.color;

const STRAIGHT: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 };
const CROSS_FE: Record<number, number> = { 1: 3, 2: 6, 3: 1, 4: 4, 5: 5, 6: 2, 7: 7, 8: 8 };
const CROSS_GE: Record<number, number> = { 1: 3, 2: 6, 3: 1, 4: 7, 5: 8, 6: 2, 7: 4, 8: 5 };

const GROUPS = [
  { g: "Group A: transmit on pins 1, 2", items: "PC, server, router, firewall, wireless access point" },
  { g: "Group B: transmit on pins 3, 6", items: "Switch, hub" },
];

function WiringSection() {
  const [spd, setSpd] = useState<"fe" | "ge">("fe");
  const [cab, setCab] = useState<"st" | "cx">("st");
  const [sel, setSel] = useState<number | null>(null);
  const map = cab === "st" ? STRAIGHT : spd === "fe" ? CROSS_FE : CROSS_GE;
  const dataPin = (p: Pin) => (spd === "fe" ? [1, 2, 3, 6].includes(p.n) : true);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">EIA/TIA-568B pinout (RJ-45)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Hold the plug with the clip down and the pins facing you. Pin 1 is on the left. Tap a pin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={spd === "fe"} onClick={() => setSpd("fe")}>10 / 100 Mbps</Pick>
          <Pick active={spd === "ge"} onClick={() => setSpd("ge")}>1 Gbps and faster</Pick>
        </div>

        <div className="mt-3 grid grid-cols-8 gap-1.5">
          {PINS.map((p) => {
            const used = dataPin(p);
            return (
              <button
                key={p.n}
                type="button"
                onClick={() => setSel(sel === p.n ? null : p.n)}
                className="flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all"
                style={{ opacity: used ? 1 : 0.35, borderColor: sel === p.n ? BLUE : undefined, outline: sel === p.n ? `2px solid ${BLUE}` : undefined }}
                aria-label={`Pin ${p.n} ${p.name}`}
              >
                <span className="font-mono text-xs font-bold">{p.n}</span>
                <span className="h-14 w-3 rounded-sm border" style={{ background: bg(p) }} />
                <span className="text-[10px] font-medium">{spd === "fe" ? p.fe : used ? "data" : ""}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {sel ? (
            <div key={sel + spd} className="n3-fade grid gap-2 sm:grid-cols-3">
              <Mini k="Colour" v={PINS[sel - 1].name} />
              <Mini k="Pair" v={PINS[sel - 1].pair} />
              <Mini k={spd === "fe" ? "Job at 10 / 100 Mbps" : "Job at 1 Gbps+"} v={spd === "fe" ? PINS[sel - 1].fe : PINS[sel - 1].ge} color={GREEN} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Faded pins carry no data at this speed.</p>
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {spd === "fe" ? (
            <>At 10 and 100 Mbps only <span className="font-semibold text-foreground">pins 1, 2, 3 and 6</span> carry data: pins 1 and 2 transmit, pins 3 and 6 receive. The other four are spare.</>
          ) : (
            <>Gigabit and faster use <span className="font-semibold text-foreground">all four pairs (all 8 wires)</span>, and each pair sends and receives at the same time. That is why a cable with only 4 wires cannot do Gigabit.</>
          )}
        </p>
        <div className="mt-3">
          <Tip>Colour order for 568B: orange-white, orange, green-white, blue, blue-white, green, brown-white, brown.</Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Straight-through vs crossover</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={cab === "st"} onClick={() => setCab("st")}>Straight-through</Pick>
          <Pick active={cab === "cx"} onClick={() => setCab("cx")}>Crossover</Pick>
        </div>
        <div key={cab + spd} className="n3-fade mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold">{cab === "st" ? "Connects different groups" : "Connects the same group"}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {cab === "st"
                ? "Switch to PC, switch to router, switch to access point. Pin 1 goes to pin 1, 2 to 2, and so on."
                : "Switch to switch, router to router, PC to PC, PC to router. Transmit and receive pairs are swapped so one side's Tx meets the other side's Rx."}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="mb-2 text-xs font-semibold">Pin on end A to pin on end B</p>
            <div className="grid grid-cols-8 gap-1 text-center font-mono text-xs">
              {PINS.map((p) => {
                const swapped = map[p.n] !== p.n;
                return (
                  <div key={p.n} className="rounded-md border py-1" style={{ borderColor: swapped ? AMBER : undefined, background: swapped ? `${AMBER}18` : undefined }}>
                    <p>{p.n}</p>
                    <p className="text-muted-foreground">↓</p>
                    <p className="font-bold" style={{ color: swapped ? AMBER : undefined }}>{map[p.n]}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {cab === "st" ? "Nothing changes: same pin at both ends." : spd === "fe" ? "Swapped: 1 and 3, 2 and 6." : "Gigabit crossover also swaps 4 with 7 and 5 with 8."}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <SimpleTable head={["Group", "Devices"]} rows={GROUPS.map((x) => [x.g, x.items])} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Rule">Different group, straight-through. Same group, crossover.</Tip>
          <Tip title="Today">
            Auto MDI-X lets a port detect and fix the wiring by itself, so on modern gear either cable works. Old switches and routers may still need the right one.
          </Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 4 · PoE ───────────────────────── */

const POE = [
  { std: "802.3af", name: "PoE", pse: 15.4, pd: 12.95 },
  { std: "802.3at", name: "PoE+", pse: 30, pd: 25.5 },
  { std: "802.3bt Type 3", name: "PoE++", pse: 60, pd: 51 },
  { std: "802.3bt Type 4", name: "PoE++", pse: 90, pd: 71.3 },
];

const DEVICES = [
  { name: "VoIP phone", w: 7, note: "A basic desk phone." },
  { name: "Fixed IP camera", w: 10, note: "A normal CCTV camera." },
  { name: "Wi-Fi 6 access point", w: 25, note: "Right at the PoE+ limit, so plan carefully." },
  { name: "PTZ camera with heater", w: 45, note: "Motors and a heater draw a lot." },
  { name: "High-power device", w: 65, note: "For example a large display or a top-end access point." },
  { name: "Laptop (no PoE support)", w: 0, note: "Not a PoE device at all." },
];

const PSE_PD = [
  ["PSE", "Power Sourcing Equipment. It gives the power.", "PoE switch, PoE injector"],
  ["PD", "Powered Device. It receives the power.", "IP camera, access point, VoIP phone"],
];

function PoeSection() {
  const [d, setD] = useState(2);
  const dev = DEVICES[d];
  const ok = (p: (typeof POE)[number]) => dev.w > 0 && dev.w <= p.pd;
  const first = POE.find(ok);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Power over Ethernet sends data and power down one cable</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          No power outlet is needed near the device. That is perfect for ceiling cameras, wall access points and desk phones.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">PSE and PD</p>
        <div className="mt-3">
          <SimpleTable head={["Term", "Meaning", "Example"]} rows={PSE_PD} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Memory hook: <span className="font-semibold text-foreground">S</span>ourcing = <span className="font-semibold text-foreground">S</span>witch side. <span className="font-semibold text-foreground">P</span>owered = <span className="font-semibold text-foreground">P</span>hone side.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">PoE standards</p>
        <div className="mt-3">
          <SimpleTable
            head={["Standard", "Nickname", "Power from switch port", "Power at the device"]}
            rows={POE.map((p) => [p.std, p.name, `${p.pse} W`, `${p.pd} W`])}
          />
        </div>
        <div className="mt-3">
          <Tip title="Careful">
            The headline number (15.4, 30, 60, 90 W) is what the switch port sends. Some power is lost as heat in the cable,
            so the device receives less. Always compare the device's draw with the right-hand column.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Will this device work?</p>
        <p className="mt-1 text-xs text-muted-foreground">Pick a device and see which standards can power it.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEVICES.map((x, i) => (
            <Pick key={x.name} active={d === i} onClick={() => setD(i)}>{x.name}</Pick>
          ))}
        </div>
        <div key={d} className="n3-fade mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {dev.note} {dev.w > 0 && <>It draws about <span className="font-semibold text-foreground">{dev.w} W</span>.</>}
          </p>
          {POE.map((p) => {
            const good = ok(p);
            return (
              <div
                key={p.std}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 text-xs"
                style={{ borderColor: good ? GREEN : undefined, background: good ? `${GREEN}10` : undefined, opacity: good ? 1 : 0.55 }}
              >
                <span className="w-32 font-semibold">{p.std}</span>
                <span className="flex-1 text-muted-foreground">Device gets up to {p.pd} W</span>
                <span className="font-semibold" style={{ color: good ? GREEN : RED }}>{good ? "✓ enough" : "✕ too weak"}</span>
              </div>
            );
          })}
          <p className="text-xs font-medium">
            {dev.w === 0
              ? "A laptop gets data only. The switch tests first and only sends power to a device that answers as PoE-aware."
              : first
              ? `Lowest standard that works: ${first.std} (${first.name}).`
              : "Nothing in this list is enough."}
          </p>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Typical PoE devices</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Wireless access points", "IP cameras (CCTV)", "VoIP phones", "Door access control", "Some LED lighting"].map((x) => (
            <Badge key={x} variant="secondary">{x}</Badge>
          ))}
        </div>
      </Panel>

      <Tip title="Rule">Match the PoE standard to the device's wattage, not to the cable colour or category.</Tip>
    </div>
  );
}

/* ───────────────────────── 5 · how it works ───────────────────────── */

const FLOW = [
  { t: "Bits enter the NIC", d: "The sender's network interface card (NIC) takes the frame and turns it into a signal. Copper uses electricity, fiber uses light. (Wi-Fi uses radio, but that is 802.11, not Ethernet.)", tag: "Layer 2 to 1" },
  { t: "Signal travels on the medium", d: "The cable carries the signal. Copper carries electricity, fiber carries light. Twisted pair stops being reliable past 100 m.", tag: "Layer 1" },
  { t: "Signal reaches the far end", d: "The receiving NIC reads the electrical or light signal and converts it back into bits.", tag: "Layer 1" },
  { t: "Ethernet decodes the frame", d: "The receiver reads the destination MAC and source MAC, and checks the FCS at the end of the frame. If the FCS does not match, the frame is damaged and is discarded.", tag: "Layer 2" },
  { t: "Higher layers take over", d: "If the destination MAC is this device's MAC (or a broadcast or multicast it listens to), the Ethernet header and trailer are removed and the packet goes up to Layer 3. Any other frame is dropped.", tag: "Layer 2 to 3" },
];

function HowSection() {
  const [i, setI] = useState(0);
  const s = FLOW[i];
  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">The journey of one frame</p>
        <p className="mt-1 text-xs text-muted-foreground">Step through it, or tap a number.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FLOW.map((_, k) => (
            <Pick key={k} active={k === i} onClick={() => setI(k)}>{k + 1}</Pick>
          ))}
        </div>
      </Panel>

      <Panel>
        <div key={i} className="n3-fade flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">Step {i + 1} of {FLOW.length}</p>
            <Badge variant="secondary">{s.tag}</Badge>
          </div>
          <p className="text-sm font-semibold">{s.t}</p>
          <p className="text-xs leading-5 text-muted-foreground">{s.d}</p>

          <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
            <div className="flex min-w-max items-stretch gap-1.5">
              {[
                { l: "Dest MAC", c: PURPLE },
                { l: "Source MAC", c: PURPLE },
                { l: "Type", c: PURPLE },
                { l: "Payload (the packet)", c: BLUE },
                { l: "FCS", c: RED },
              ].map((p, k) => {
                const lit =
                  (i === 3 && true) ||
                  (i === 4 && (k <= 1 || k === 3)) ||
                  (i < 3);
                return (
                  <div
                    key={p.l}
                    className="rounded-md border px-3 py-2 text-xs font-semibold transition-opacity"
                    style={{ borderColor: p.c, background: `${p.c}14`, color: p.c, opacity: lit ? 1 : 0.3 }}
                  >
                    {p.l}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">An Ethernet frame. Highlighted parts are the ones used at this step.</p>
        </div>
      </Panel>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>Back</Button>
        <Button size="sm" disabled={i === FLOW.length - 1} onClick={() => setI((v) => Math.min(FLOW.length - 1, v + 1))}>Next step</Button>
      </div>

      <Tip>FCS (Frame Check Sequence) detects damage but does not repair it. A bad frame is simply dropped.</Tip>
    </div>
  );
}

/* ───────────────────────── 6 · which cable ───────────────────────── */

const SCEN = [
  { s: "Gigabit link from a wall jack to a desktop PC, 30 m, normal office.", a: "Cat 5e UTP", w: "Cat 5e handles Gigabit up to 100 m and is the cheapest option that works." },
  { s: "Same office, but 10 Gbps to a workstation 40 m away.", a: "Cat 6 UTP (Cat 6a for a full 100 m)", w: "Cat 6 supports 10 Gbps up to about 55 m. Cat 6a does it for the whole 100 m." },
  { s: "Factory floor with heavy motors causing interference on the cable.", a: "Shielded twisted pair (STP), or fiber", w: "The extra shielding blocks EMI. Fiber is fully immune if the budget allows." },
  { s: "Extend a link from one building to another 8 km away.", a: "Single-mode fiber", w: "Single-mode reaches tens of kilometres. Copper stops at 100 m." },
  { s: "Connect two switches in the same data hall, 20 m apart.", a: "Multi-mode fiber", w: "Multi-mode is cheaper for short runs inside a building or campus." },
  { s: "Cable TV and cable internet service already coming into a house.", a: "Coaxial", w: "Coax is still the standard for TV and cable internet service. A cable modem turns it into Ethernet." },
  { s: "Connect a PC to a wall jack that runs to a switch.", a: "Straight-through", w: "PC (group A) and switch (group B) are different, so straight-through." },
  { s: "Connect two old switches directly, no Auto MDI-X.", a: "Crossover", w: "Same group means crossover. Auto MDI-X makes it optional on modern gear." },
  { s: "Power a small VoIP phone that draws about 7 W.", a: "802.3af (PoE, 15.4 W)", w: "Plenty for a basic phone." },
  { s: "Power a Wi-Fi 6 access point that draws about 25 W.", a: "802.3at (PoE+, 30 W)", w: "Standard choice for modern access points. 802.3af is too weak." },
  { s: "Power a PTZ camera with a heater that draws about 45 W.", a: "802.3bt Type 3 (60 W)", w: "Only 802.3bt goes beyond 30 W. Above about 51 W at the device you need Type 4 (90 W)." },
];

function PickSection() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((p) => {
      const n = new Set(p);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Read the scenario, decide your answer, then tap to check.</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(open.size === SCEN.length ? new Set() : new Set(SCEN.map((_, i) => i)))}>
          {open.size === SCEN.length ? "Hide all answers" : "Show all answers"}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {SCEN.map((x, i) => {
          const shown = open.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="rounded-xl border bg-background p-3 text-left transition-colors hover:border-primary/50"
              style={{ borderColor: shown ? GREEN : undefined }}
            >
              <p className="text-xs font-medium"><span className="mr-2 font-mono text-muted-foreground">{i + 1}.</span>{x.s}</p>
              {shown && (
                <div className="n3-fade mt-2 border-t pt-2">
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>{x.a}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{x.w}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Panel>
        <p className="text-sm font-semibold">Rules of thumb</p>
        <div className="mt-2">
          <Bullets
            items={[
              "Copper for short, fiber for long.",
              "UTP by default, STP when there is noise.",
              "Straight-through for different groups, crossover for the same group.",
              "Match the PoE standard to the wattage, not the cable.",
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 7 · common mistakes ───────────────────────── */

const MYTHS = [
  { wrong: "Ethernet is one speed.", right: "Ethernet is a family: 10 Mbps up to 400 Gbps, all standardized by the IEEE." },
  { wrong: "Cat 5e is just Cat 5 with a fancy name.", right: "Cat 5e is built and tested to much stricter crosstalk limits, which makes reliable Gigabit possible." },
  { wrong: "Fiber is just faster copper.", right: "Fiber carries light, not electricity. It is immune to EMI and works over very long distances." },
  { wrong: "Single-mode fiber is faster than multi-mode.", right: "The real difference is distance. Single-mode goes much farther, multi-mode is cheaper for short runs." },
  { wrong: "Crossover cables are obsolete.", right: "Auto MDI-X made them optional on modern gear, but old equipment may still need them." },
  { wrong: "All 8 wires always carry data, or only 4 ever do.", right: "At 10 and 100 Mbps only pins 1, 2, 3 and 6 carry data. At Gigabit and faster all 8 wires are used." },
  { wrong: "Twisted pair can never go above 1 Gbps.", right: "Cat 5e stops at 1 Gbps, but Cat 6 reaches 10 Gbps up to about 55 m and Cat 6a does 10 Gbps over 100 m." },
  { wrong: "PoE sends power to everything plugged in.", right: "The switch first checks whether the device is PoE-aware. Non-PoE devices get data only." },
  { wrong: "PoE+ and PoE++ are the same.", right: "PoE is 15.4 W, PoE+ is 30 W, PoE++ is 60 W or 90 W. Match the standard to the device." },
  { wrong: "A 30 W PoE+ port gives the device 30 W.", right: "Some power is lost in the cable. A PoE+ device gets up to 25.5 W." },
  { wrong: "Coaxial is dead.", right: "It is dead for new data networks, but still standard for TV and cable internet service." },
  { wrong: "100 metres is a suggestion.", right: "It is the limit for twisted pair Ethernet. Beyond it the signal weakens and frames start getting lost." },
];

function MythsSection() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Tap a card to flip it from the wrong belief to the truth.</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(open.size === MYTHS.length ? new Set() : new Set(MYTHS.map((_, i) => i)))}>
          {open.size === MYTHS.length ? "Hide all" : "Show all"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MYTHS.map((m, i) => {
          const shown = open.has(i);
          return (
            <button key={i} type="button" onClick={() => toggle(i)} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/50" style={{ borderColor: shown ? GREEN : undefined }}>
              <p className="text-xs font-semibold" style={{ color: RED }}>✕ Wrong</p>
              <p className="mt-1 text-sm font-medium">{m.wrong}</p>
              {shown ? (
                <div className="n3-fade mt-3 border-t pt-3">
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>✓ Right</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.right}</p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">Tap to see the truth</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── 8 · interview prep ───────────────────────── */

const QA: { q: string; a: string[] }[] = [
  { q: "What is Ethernet, and who standardized it?", a: ["Ethernet is a family of networking standards that define how devices on a local network frame data, address each other with MAC addresses, and share the medium.", "It started at Xerox, was released publicly at 10 Mbps by the DIX consortium (Digital, Intel, Xerox), and was standardized by the IEEE as 802.3."] },
  { q: "List the Ethernet speeds from slowest to fastest.", a: ["10 Mbps (Ethernet), 100 Mbps (Fast Ethernet), 1 Gbps (Gigabit), then 10, 25, 40, 100, 200 and 400 Gbps.", "Each step is faster, but the frame format and MAC addressing stay the same."] },
  { q: "What is the difference between UTP and STP?", a: ["UTP (Unshielded Twisted Pair) relies only on the twisting of the pairs to reduce interference.", "STP (Shielded Twisted Pair) adds a metal foil or braid around the pairs, which gives extra protection against EMI. It costs more and must be grounded properly."] },
  { q: "What is the difference between Cat 5, Cat 5e and Cat 6?", a: ["Cat 5 supports up to 100 Mbps (Fast Ethernet).", "Cat 5e is tested to stricter crosstalk limits and supports 1 Gbps.", "Cat 6 has tighter tolerances and better construction. It supports 10 Gbps up to about 55 m. Cat 6a does 10 Gbps for the full 100 m."] },
  { q: "What are the limits of twisted pair cable?", a: ["Maximum run of 100 m. Beyond that the signal weakens and frames get lost.", "The speed limit depends on the category: 1 Gbps for Cat 5e, 10 Gbps for Cat 6 (short) and Cat 6a.", "It can pick up interference, so use STP or fiber in noisy places."] },
  { q: "Single-mode vs multi-mode fiber: which one, when?", a: ["Single-mode has a small core and one ray of light. It reaches 10 to 100 km or more, so it is used between buildings, cities and countries.", "Multi-mode has a larger core and many rays. It reaches a few hundred metres, so it is used inside buildings and campuses. Its optics are cheaper."] },
  { q: "What is a transceiver? Name common types.", a: ["A transceiver is a transmitter and receiver in one pluggable module. It converts electrical signals to light and back.", "SFP (1 Gbps), SFP+ (10 Gbps), SFP28 (25 Gbps), QSFP+ (40 Gbps), QSFP28 (100 Gbps), QSFP-DD (400 Gbps)."] },
  { q: "Explain the EIA/TIA-568B standard.", a: ["It defines the colour order of the 8 wires in an RJ-45 connector: orange-white, orange, green-white, blue, blue-white, green, brown-white, brown.", "At 10 and 100 Mbps only pins 1, 2, 3 and 6 carry data (Tx on 1 and 2, Rx on 3 and 6). At Gigabit and faster all 8 wires are used."] },
  { q: "Straight-through vs crossover cable: how do you pick?", a: ["Straight-through connects different groups: PC to switch, router to switch, access point to switch.", "Crossover connects the same group: switch to switch, router to router, PC to PC, PC to router.", "Auto MDI-X on modern gear makes the choice optional."] },
  { q: "What is PoE, and what problem does it solve?", a: ["Power over Ethernet sends data and electrical power over the same Ethernet cable.", "It removes the need for a power outlet near the device, which is critical for ceiling cameras, wall access points and VoIP phones. It also lets you power them from a central UPS-backed switch."] },
  { q: "What are PSE and PD?", a: ["PSE (Power Sourcing Equipment) provides the power, for example a PoE switch or injector.", "PD (Powered Device) receives the power, for example an IP camera or access point."] },
  { q: "Name the PoE standards and their wattages.", a: ["802.3af (PoE): 15.4 W from the port, about 12.95 W at the device.", "802.3at (PoE+): 30 W, about 25.5 W at the device.", "802.3bt (PoE++): Type 3 is 60 W and Type 4 is 90 W."] },
  { q: "Does PoE ever damage a non-PoE device?", a: ["No, not with standard PoE. The switch sends a small detection signal first. Only if the device answers as PoE-aware does it send power.", "A laptop plugged into a PoE switch gets data only. (Old passive PoE gear does not do this detection, so avoid mixing it in.)"] },
  { q: "Why is fiber preferred over copper for long distances?", a: ["Fiber carries light, not electricity, so it is immune to EMI.", "It loses much less signal over distance, so single-mode reaches tens of kilometres, while copper stops at 100 m.", "It is also harder to tap, which makes it more secure."] },
];

function InterviewSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Ethernet is a family of IEEE 802.3 standards that defines how devices on a local network frame data, address each
          other with MAC addresses, and share the medium. It grew from 10 Mbps to 400 Gbps while keeping the same framing.
          Three kinds of cable carry it: twisted pair for short runs up to 100 metres, coaxial for legacy and TV service, and
          fiber for long distance and interference-free links. Twisted pair comes in categories like Cat 5e and Cat 6. Wiring
          follows the 568B standard, with straight-through cables between different device groups and crossover between the
          same. Power over Ethernet sends data and power over one cable, so devices like access points and cameras need no
          separate outlet.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">Practice it out loud until it flows without notes.</p>
      </Panel>

      <div className="flex flex-col gap-2">
        {QA.map((x, i) => {
          const isOpen = open === i;
          return (
            <div key={x.q} className="rounded-xl border bg-background">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                  {x.q}
                </span>
                <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <ul className="n3-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">Copper for short, fiber for long. Different groups straight, same group crossover. Match PoE to watts.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function EthernetCablingSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n3-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .n3-fade { animation: n3-fade .5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .n3-fade { animation: none; opacity: 1; } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 03: Ethernet and network cabling</CardTitle>
            <CardDescription className="mt-1">
              The standard, the cables, the wiring and PoE. Eight short sections, tap through them in any order.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Pick key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pick>
          ))}
        </div>

        <div key={tab}>
          {tab === "big" && <BigSection />}
          {tab === "cables" && <CablesSection />}
          {tab === "wiring" && <WiringSection />}
          {tab === "poe" && <PoeSection />}
          {tab === "how" && <HowSection />}
          {tab === "pick" && <PickSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}