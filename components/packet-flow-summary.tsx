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
 * PacketFlowExplainer (CCNA Topic: Packet Flow)
 *   1 Same network  : AND check, ARP request/reply, ICMP echo — 5 packets, step by step
 *   2 Between nets  : gateway ARP, hop-by-hop MAC rewrite, TTL decrement, reply with 0 ARPs
 *   3 PDU names     : Segment vs Packet vs Frame vs Bits — which word, and why
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";

const TABS = [
  { id: "same", label: "1 · Same network" },
  { id: "between", label: "2 · Between networks" },
  { id: "pdu", label: "3 · PDU names" },
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
      <table className="w-full min-w-[420px] text-xs">
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
      <p className="break-words text-xs font-medium" style={color ? { color } : undefined}>{v}</p>
    </div>
  );
}

function Code({ lines }: { lines: string[] }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300">
      {lines.join("\n")}
    </pre>
  );
}

function MythList({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(([w, r]) => (
        <div key={w} className="rounded-lg border p-2 text-xs">
          <p style={{ color: RED }}>✕ {w}</p>
          <p className="mt-1 text-muted-foreground">✓ {r}</p>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── 1 · same network ───────────────────────── */

type Step = {
  t: string;
  short: string;
  d: string;
  wire: string;
  dot: number;
  color: string;
  learn: string[];
  frame: { srcIp: string; dstIp: string; srcMac: string; dstMac: string };
};

const SAME_STEPS: Step[] = [
  {
    t: "Step 1 — AND check (nothing on the wire yet)",
    short: "AND check",
    d: "Before PC1 sends anything, it asks one question: is PC2 on my own network? It takes PC2's IP and ANDs it with its own subnet mask. 192.168.1.2 AND 255.255.255.0 = 192.168.1.0. That equals PC1's own network, so PC2 is local. That means: deliver directly, no gateway involved.",
    wire: "Nothing is sent. This is pure local calculation inside PC1.",
    dot: 0,
    color: GREEN,
    learn: ["PC1: PC2 is local → I need PC2's MAC, not the gateway's."],
    frame: { srcIp: "—", dstIp: "192.168.1.2", srcMac: "—", dstMac: "unknown" },
  },
  {
    t: "Step 2 — ARP request (broadcast)",
    short: "ARP request",
    d: "PC1 knows PC2's IP but not its MAC, and it cannot build an Ethernet frame without a destination MAC. So it broadcasts: 'Who has 192.168.1.2? Tell aaa.' The destination MAC is ffff.ffff.ffff — every device on the segment must look at it. The switch sees the frame come in on port 0/0, learns that aaa lives there, and floods it out every other port.",
    wire: "Src 192.168.1.1 → Target 192.168.1.2 · Src MAC aaa → Dest MAC ffff.ffff.ffff",
    dot: 0,
    color: BLUE,
    learn: ["SW1: aaa = port 0/0", "Every host on the LAN receives the frame."],
    frame: { srcIp: "192.168.1.1", dstIp: "192.168.1.2", srcMac: "aaa", dstMac: "ffff.ffff.ffff" },
  },
  {
    t: "Step 3 — ARP reply (unicast)",
    short: "ARP reply",
    d: "PC2 sees its own IP in the request, so it answers — but not by broadcast. It already knows PC1's MAC (aaa) because it read it from the request. So the reply is unicast, straight back to aaa: '192.168.1.2 is at bbb.' The switch learns bbb on port 0/2 and forwards the frame out only PC1's port.",
    wire: "Src 192.168.1.2 → Dest 192.168.1.1 · Src MAC bbb → Dest MAC aaa",
    dot: 100,
    color: GREEN,
    learn: ["PC1: 192.168.1.2 = bbb", "PC2: 192.168.1.1 = aaa", "SW1: bbb = port 0/2"],
    frame: { srcIp: "192.168.1.2", dstIp: "192.168.1.1", srcMac: "bbb", dstMac: "aaa" },
  },
  {
    t: "Step 4 — ICMP echo (the real ping)",
    short: "ICMP echo",
    d: "Now PC1 has everything it needs. It builds the actual ping: source IP 192.168.1.1, destination IP 192.168.1.2, source MAC aaa, destination MAC bbb. The switch already knows where bbb lives, so this is a known unicast and goes out only PC2's port — no flooding.",
    wire: "Src 1.1 → Dest 1.2 · Src MAC aaa → Dest MAC bbb",
    dot: 0,
    color: PURPLE,
    learn: ["Known unicast: forwarded out one port only."],
    frame: { srcIp: "192.168.1.1", dstIp: "192.168.1.2", srcMac: "aaa", dstMac: "bbb" },
  },
  {
    t: "Step 5 — ICMP echo reply (ping succeeds)",
    short: "Echo reply",
    d: "PC2 answers the ping. It does not need ARP — it already has PC1's MAC from the request it answered in step 3. The frame goes bbb → aaa and the switch forwards out only PC1's port. PC1 receives it and prints the familiar 'Reply from 192.168.1.2'.",
    wire: "Src 1.2 → Dest 1.1 · Src MAC bbb → Dest MAC aaa",
    dot: 100,
    color: AMBER,
    learn: ["Ping success. No ARP in steps 4 or 5 — caches were already full."],
    frame: { srcIp: "192.168.1.2", dstIp: "192.168.1.1", srcMac: "bbb", dstMac: "aaa" },
  },
];

function SameSection() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const s = SAME_STEPS[step];

  useEffect(() => {
    if (!playing) return;
    if (step >= SAME_STEPS.length - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setStep((v) => v + 1), 4000);
    return () => clearTimeout(id);
  }, [playing, step]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Every send = three questions, in order</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Mini k="1 · AND" v="Is the destination local or remote?" color={GREEN} />
          <Mini k="2 · ARP" v="What MAC address do I need?" color={BLUE} />
          <Mini k="3 · Traffic" v="Send the actual data." color={PURPLE} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Same subnet → ARP for the destination. Different subnet → ARP for the default gateway.
          That one sentence answers half the exam questions, so it is worth memorising exactly like that.
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">PC1 pings PC2 on the same LAN</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Five packets on the wire. Each step shows what is being sent, what it looks like on the wire,
          and what every device learns. Use Play to watch the whole sequence.
        </p>

        {/* topology */}
        <div className="relative mx-8 mt-6 h-24">
          <div className="absolute left-0 right-0 top-10 h-0.5 bg-border" />
          <div className="absolute left-0 top-4 -translate-x-1/2 rounded-md border bg-background px-2 py-1 text-xs font-bold" style={{ borderColor: step === 0 || step === 3 ? GREEN : undefined }}>PC1</div>
          <div className="absolute right-0 top-4 translate-x-1/2 rounded-md border bg-background px-2 py-1 text-xs font-bold" style={{ borderColor: step === 2 || step === 4 ? GREEN : undefined }}>PC2</div>
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-md border bg-muted/40 px-2 py-1 text-[11px] font-bold text-muted-foreground">SW1</div>
          <div
            className="absolute top-[34px] h-3.5 w-3.5 -translate-x-1/2 rounded-full transition-all duration-[1400ms] ease-in-out"
            style={{ left: `${s.dot}%`, background: s.color, boxShadow: `0 0 0 4px ${s.color}30` }}
          />
          <div className="absolute left-1/2 top-[60px] w-full -translate-x-1/2 text-center text-[10px] font-medium" style={{ color: s.color }}>
            {s.wire}
          </div>
          <div className="absolute left-1/2 top-[78px] w-full -translate-x-1/2 text-center text-[10px] text-muted-foreground">
            {step === 1 && "flooded out every port except 0/0"}
            {step === 2 && "forwarded out one port"}
            {step === 3 && "known unicast → one port"}
            {step === 4 && "known unicast → one port"}
          </div>
        </div>

        {/* controls */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => { if (step >= SAME_STEPS.length - 1) setStep(0); setPlaying((p) => !p); }}>
            {playing ? "Pause" : step >= SAME_STEPS.length - 1 ? "Replay" : "Play"}
          </Button>
          <Button size="sm" variant="outline" disabled={step === 0} onClick={() => { setPlaying(false); setStep((v) => v - 1); }}>Back</Button>
          <Button size="sm" variant="outline" disabled={step >= SAME_STEPS.length - 1} onClick={() => { setPlaying(false); setStep((v) => v + 1); }}>Next</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setStep(0); }}>Reset</Button>
          <span className="font-mono text-xs font-bold">{step + 1} / {SAME_STEPS.length}</span>
        </div>

        {/* step dots */}
        <div className="mt-3 flex gap-1">
          {SAME_STEPS.map((x, i) => (
            <button
              key={x.short}
              type="button"
              onClick={() => { setPlaying(false); setStep(i); }}
              className="flex-1 rounded py-1 text-[10px] font-medium transition-colors"
              style={{
                background: i === step ? `${s.color}22` : undefined,
                color: i === step ? s.color : undefined,
                border: `1px solid ${i === step ? s.color : "var(--border, #ddd)"}`,
                opacity: i > step ? 0.55 : 1,
              }}
            >
              {i + 1}. {x.short}
            </button>
          ))}
        </div>

        {/* current step */}
        <div key={step} className="n8-fade mt-4 rounded-lg border px-3 py-3" style={{ borderColor: s.color }}>
          <p className="text-sm font-semibold" style={{ color: s.color }}>{s.t}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{s.d}</p>
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[440px] text-xs">
              <thead className="bg-muted/50">
                <tr>{["Field", "Value in this step"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {[
                  ["Source IP", s.frame.srcIp],
                  ["Destination IP", s.frame.dstIp],
                  ["Source MAC", s.frame.srcMac],
                  ["Destination MAC", s.frame.dstMac],
                ].map(([k, v]) => (
                  <tr key={k} className="border-t">
                    <td className="px-3 py-2 font-semibold">{k}</td>
                    <td className="px-3 py-2 font-mono">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What is learned here</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {s.learn.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">AND truth table</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            AND gives 1 only when both inputs are 1. When you AND an IP with a mask,
            the 1-bits of the mask keep that part of the address, and the 0-bits blank the host part.
            If the result equals the host's own network, the destination is local.
          </p>
          <div className="mt-3">
            <SimpleTable head={["A", "B", "A AND B"]} rows={[["0", "0", "0"], ["0", "1", "0"], ["1", "0", "0"], ["1", "1", "1"]]} hit={3} />
          </div>
          <div className="mt-3">
            <Code lines={[
              "  192.168.1.2   → 11000000.10101000.00000001.00000010",
              "  255.255.255.0 → 11111111.11111111.11111111.00000000",
              "  AND           → 11000000.10101000.00000001.00000000",
              "                = 192.168.1.0  = PC1's own network → local",
            ]} />
          </div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">ARP messages, side by side</p>
          <div className="mt-3">
            <SimpleTable
              head={["Message", "Src IP", "Target IP", "Src MAC", "Dest MAC"]}
              rows={[
                ["Request", "192.168.1.1", "192.168.1.2", "aaa", "ffff.ffff.ffff"],
                ["Reply", "192.168.1.2", "192.168.1.1", "bbb", "aaa"],
              ]}
            />
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
            <li>Request = broadcast (everyone must look at it).</li>
            <li>Reply = unicast (the responder already knows the requester's MAC).</li>
            <li>The switch learns from the SOURCE MAC of both frames — it never cares about the message type.</li>
          </ul>
        </Panel>
      </div>

      <Panel>
        <p className="text-sm font-semibold">What each device ends up knowing</p>
        <div className="mt-3">
          <SimpleTable
            head={["Device", "Table after the ping"]}
            rows={[
              ["PC1 ARP cache", "192.168.1.2 = bbb"],
              ["PC2 ARP cache", "192.168.1.1 = aaa"],
              ["SW1 MAC table", "aaa = 0/0, bbb = 0/2"],
            ]}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">ARP entries age out after a few minutes, so a long-lived conversation rarely ARPs again.</p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Common misconceptions</p>
        <div className="mt-3">
          <MythList items={[
            ["ARP is only used between networks.", "ARP is used any time a host needs a MAC. Same network = ARP for the destination; different network = ARP for the gateway."],
            ["The ARP reply is also a broadcast.", "The request is a broadcast. The reply is unicast — the responder already knows the requester's MAC from the request frame."],
            ["A switch always floods every frame.", "A switch only floods broadcast, multicast, and unknown-unicast. Once it knows a MAC, it forwards out only the correct port."],
            ["ARP replies let the switch learn MACs.", "The switch learns from the SOURCE MAC of every frame — requests and replies alike. It doesn't care about the message type."],
            ["Hosts always ARP for the destination IP.", "Only if the destination is on the same subnet. If it is remote, they ARP for the gateway."],
          ]} />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 2 · between networks ───────────────────────── */

type Hop = {
  hop: string;
  srcIp: string;
  dstIp: string;
  srcMac: string;
  dstMac: string;
  arp: string;
  what: string;
  ttl: string;
};

const FWD: Hop[] = [
  { hop: "PC1 → R1", srcIp: "192.168.1.1", dstIp: "192.168.2.1", srcMac: "aaa (PC1)", dstMac: "ccc (R1)", arp: "yes — for gateway 1.100", what: "PC1 ANDs 2.1 with its /24 → 192.168.2.0 ≠ 1.0, so PC3 is remote. PC1 ARPs for its gateway 1.100 and gets ccc. The echo is addressed to R1's MAC — not PC3's.", ttl: "64" },
  { hop: "R1 → R2", srcIp: "192.168.1.1", dstIp: "192.168.2.1", srcMac: "ddd (R1)", dstMac: "eee (R2)", arp: "yes — for next hop 3.2", what: "R1 checks the Dest MAC is its own, strips the frame, reads Dest IP 2.1, finds the route via next hop 3.2 and ARPs for 3.2 — NOT for PC3. New frame, TTL 63.", ttl: "63" },
  { hop: "R2 → PC3", srcIp: "192.168.1.1", dstIp: "192.168.2.1", srcMac: "nnn (R2)", dstMac: "ggg (PC3)", arp: "yes — for PC3", what: "R2 reads Dest IP 2.1, sees 192.168.2.0 is directly connected, ARPs for PC3 and gets ggg. New frame, TTL 62. PC3 receives the echo.", ttl: "62" },
];

const BACK: Hop[] = [
  { hop: "PC3 → R2", srcIp: "192.168.2.1", dstIp: "192.168.1.1", srcMac: "ggg (PC3)", dstMac: "nnn (R2)", arp: "no — cached", what: "PC3 ANDs 1.1 with its mask → 1.0 ≠ 2.0, so PC1 is remote. PC3 needs its gateway's MAC — and it already learned nnn from the forward path. No ARP.", ttl: "62" },
  { hop: "R2 → R1", srcIp: "192.168.2.1", dstIp: "192.168.1.1", srcMac: "eee (R2)", dstMac: "ddd (R1)", arp: "no — cached", what: "R2 reads Dest IP 1.1, finds next hop 3.1, and its ARP cache already has ddd. Strip, rebuild, TTL 61.", ttl: "61" },
  { hop: "R1 → PC1", srcIp: "192.168.2.1", dstIp: "192.168.1.1", srcMac: "ccc (R1)", dstMac: "aaa (PC1)", arp: "no — cached", what: "R1 reads Dest IP 1.1, sees 1.0 is directly connected, and its cache already has aaa. Strip, rebuild, TTL 60. PC1 receives the reply.", ttl: "60" },
];

function BetweenSection() {
  const [back, setBack] = useState(false);
  const [hop, setHop] = useState(0);
  const [playing, setPlaying] = useState(false);
  const hops = back ? BACK : FWD;
  const h = hops[hop];

  useEffect(() => {
    if (!playing) return;
    if (hop >= hops.length - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setHop((v) => v + 1), 3600);
    return () => clearTimeout(id);
  }, [playing, hop, hops.length]);

  const nodes = back ? ["PC3", "R2", "R1", "PC1"] : ["PC1", "R1", "R2", "PC3"];
  const dotLeft = hop * (100 / 3);
  const color = back ? GREEN : BLUE;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">The golden rule between networks</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Mini k="Stays the same" v="Source IP, destination IP, payload" color={GREEN} />
          <Mini k="Changes every hop" v="Source MAC, destination MAC, TTL (drops by 1)" color={AMBER} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          A router receives a frame, strips the Ethernet header, looks at the destination IP, picks the next hop from its routing table,
          ARPs for that next hop, then builds a brand-new frame. The packet inside never changes — only the envelope does.
        </p>
        <p className="mt-2 text-xs font-bold" style={{ color: PURPLE }}>IP = end to end. MAC = hop by hop.</p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">PC1 pings PC3 across two routers</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={!back} onClick={() => { setBack(false); setHop(0); setPlaying(false); }}>Forward (PC1 → PC3)</Pick>
          <Pick active={back} onClick={() => { setBack(true); setHop(0); setPlaying(false); }}>Reply (PC3 → PC1)</Pick>
        </div>

        {/* topology */}
        <div className="relative mx-6 mt-6 h-24">
          <div className="absolute left-0 right-0 top-10 h-0.5 bg-border" />
          {nodes.map((n, i) => (
            <div key={n} className="absolute top-4 -translate-x-1/2 rounded-md border bg-background px-2 py-1 text-xs font-bold" style={{ left: `${i * (100 / 3)}%`, borderColor: i <= hop ? color : undefined }}>{n}</div>
          ))}
          <div
            className="absolute top-[34px] h-3.5 w-3.5 -translate-x-1/2 rounded-full transition-all duration-[1400ms] ease-in-out"
            style={{ left: `${dotLeft}%`, background: color, boxShadow: `0 0 0 4px ${color}30` }}
          />
          <p className="absolute left-1/2 top-[56px] -translate-x-1/2 font-mono text-[11px] font-bold">TTL {h.ttl}</p>
          <p className="absolute left-1/2 top-[74px] w-full -translate-x-1/2 text-center text-[10px] text-muted-foreground">{h.what}</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => { if (hop >= hops.length - 1) setHop(0); setPlaying((p) => !p); }}>
            {playing ? "Pause" : hop >= hops.length - 1 ? "Replay" : "Play"}
          </Button>
          <Button size="sm" variant="outline" disabled={hop === 0} onClick={() => { setPlaying(false); setHop((v) => v - 1); }}>Back</Button>
          <Button size="sm" variant="outline" disabled={hop >= hops.length - 1} onClick={() => { setPlaying(false); setHop((v) => v + 1); }}>Next</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setHop(0); }}>Reset</Button>
        </div>

        <div key={`${back}-${hop}`} className="n8-fade mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="bg-muted/50">
              <tr>{["Hop", "Src IP", "Dest IP", "Src MAC", "Dest MAC", "ARP?"].map((x) => <th key={x} className="px-3 py-2 text-left font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {hops.map((r, i) => (
                <tr key={r.hop} className="border-t" style={{ background: i === hop ? `${color}14` : undefined, opacity: i > hop ? 0.35 : 1 }}>
                  <td className="px-3 py-2 font-semibold">{r.hop}</td>
                  <td className="px-3 py-2 font-mono">{r.srcIp}</td>
                  <td className="px-3 py-2 font-mono">{r.dstIp}</td>
                  <td className="px-3 py-2 font-mono">{r.srcMac}</td>
                  <td className="px-3 py-2 font-mono">{r.dstMac}</td>
                  <td className="px-3 py-2" style={{ color: r.arp.startsWith("yes") ? AMBER : GREEN }}>{r.arp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div key={`${back}-d${hop}`} className="n8-fade mt-3 rounded-lg border px-3 py-2" style={{ borderColor: color }}>
          <p className="text-xs font-semibold" style={{ color }}>
            {back ? "Reply" : "Forward"} · {h.hop} · TTL {h.ttl}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{h.what}</p>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="text-sm font-semibold">What a router does, one line each</p>
          <Bullets items={[
            "Check the Dest MAC is my own — if not, drop the frame.",
            "Strip the old Ethernet header.",
            "Read the destination IP.",
            "Look it up in the routing table — pick the next hop.",
            "ARP for the NEXT HOP (not the final target).",
            "Build a brand-new frame with new MACs.",
            "Decrement TTL. If it reaches 0, drop and send ICMP Time Exceeded.",
            "Forward.",
          ]} />
          <div className="mt-3">
            <Tip title="Careful">
              If the routing table has no match and no default route, the router drops the packet and sends ICMP Destination Unreachable back to the source.
            </Tip>
          </div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">ARP count per direction</p>
          <div className="mt-3">
            <SimpleTable
              head={["Direction", "ARPs", "Why"]}
              rows={[
                ["Forward", "3", "PC1 for gateway, R1 for R2, R2 for PC3"],
                ["Reply", "0", "All caches already filled by the forward path"],
              ]}
              hit={1}
            />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            The reply is faster precisely because the forward path did all the discovery work. That is also why real pings show a slightly longer first reply.
          </p>
        </Panel>
      </div>

      <Panel>
        <p className="text-sm font-semibold">Table state after the forward path</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <SimpleTable
            head={["Device", "ARP cache"]}
            rows={[
              ["PC1", "1.100 = ccc"],
              ["R1", "1.1 = aaa, 3.2 = eee"],
              ["R2", "3.1 = ddd, 2.1 = ggg"],
              ["PC3", "2.100 = nnn"],
            ]}
          />
          <SimpleTable
            head={["Switch", "MAC table"]}
            rows={[
              ["SW1", "aaa = 0/0, ccc = 0/3"],
              ["SW2", "nnn = 0/0, ggg = 0/1"],
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Common misconceptions</p>
        <div className="mt-3">
          <MythList items={[
            ["MAC addresses stay the same end to end.", "MACs change at every router hop. Each router strips the old frame and builds a new one."],
            ["IP addresses change at every hop.", "IPs stay the same end to end (unless NAT is involved). Only MACs change."],
            ["Routers ARP for the final destination.", "Routers ARP for the NEXT HOP only. R1 ARPs for R2 (3.2), not for PC3 (2.1)."],
            ["TTL stays the same across the network.", "TTL drops by 1 at every router. At zero the packet is discarded and ICMP Time Exceeded is returned."],
            ["PC1 sends the ICMP echo directly to PC3.", "PC1 sends it to the gateway's MAC. PC3 is the destination IP, but the frame is addressed to R1."],
            ["The reply path needs 3 new ARPs too.", "Zero new ARPs — the forward path already filled every cache. That is why the reply is faster."],
          ]} />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 3 · PDU names ───────────────────────── */

type PduLayer = { n: number; layer: string; name: string; color: string; what: string; focus: string; example: string };

const PDU_LAYERS: PduLayer[] = [
  { n: 1, layer: "L1 Physical", name: "Bits", color: AMBER, what: "Raw voltage, light, or radio pulses on the wire.", focus: "NIC, cable, wireless", example: "010101110…" },
  { n: 2, layer: "L2 Data Link", name: "Frame", color: GREEN, what: "Ethernet header (MACs) + payload + FCS trailer.", focus: "Switches, ARP, Ethernet", example: "[dstMAC | srcMAC | type | data | FCS]" },
  { n: 3, layer: "L3 Network", name: "Packet", color: BLUE, what: "IP header (IPs, TTL, protocol) + payload.", focus: "Routers, routing tables", example: "[dstIP | srcIP | TTL | proto | data]" },
  { n: 4, layer: "L4 Transport", name: "Segment (TCP) / Datagram (UDP)", color: PURPLE, what: "TCP or UDP header (ports, sequence) + data.", focus: "Applications, reliability", example: "[dstPort | srcPort | seq | data]" },
];

const PDU_QUIZ = [
  { q: "Switch reads the destination MAC address.", a: "Frame (Layer 2)", c: GREEN },
  { q: "Router checks the routing table.", a: "Packet (Layer 3)", c: BLUE },
  { q: "TCP assigns sequence numbers.", a: "Segment (Layer 4)", c: PURPLE },
  { q: "UDP checksum is calculated.", a: "Datagram (Layer 4)", c: PURPLE },
  { q: "ARP reply arrives at PC1.", a: "Frame (Layer 2) — ARP rides inside Ethernet", c: GREEN },
  { q: "The NIC transmits voltage on the wire.", a: "Bits (Layer 1)", c: AMBER },
  { q: "ICMP echo request is built.", a: "Packet (Layer 3)", c: BLUE },
  { q: "An FCS is appended to detect corruption.", a: "Frame (Layer 2)", c: GREEN },
];

function PduSection() {
  const [layers, setLayers] = useState(4);
  const [qi, setQi] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const visible = PDU_LAYERS.slice(0, layers);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">One chunk of data, four names</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          The bytes are exactly the same. What changes is the word you use — and that depends on
          <span className="font-semibold text-foreground"> which layer you are talking about</span>.
          Each layer adds its own header as the data moves down the stack, and that header is what earns the new name.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Mini k="If IP is in focus" v="→ say packet (routers, routing tables, Dest IP)" color={BLUE} />
          <Mini k="If MAC is in focus" v="→ say frame (switches, ARP, Ethernet headers)" color={GREEN} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Build the encapsulation, layer by layer</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap a layer count to see the stack grow from the wire up to the app.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => (
            <Pick key={n} active={layers === n} onClick={() => setLayers(n)}>{n} layer{n > 1 ? "s" : ""}</Pick>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          {visible.map((p, i) => (
            <div key={p.layer} className="n8-pop flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: p.color, background: `${p.color}10` }}>
              <span className="w-24 font-mono text-[11px] font-bold" style={{ color: p.color }}>{p.layer}</span>
              <span className="font-semibold">{p.name}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{p.focus}</span>
              {i === layers - 1 && <Badge variant="secondary">new header added</Badge>}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Code lines={[
            "Application data",
            "  ↓ TCP header added      → Segment",
            "  ↓ IP header added       → Packet",
            "  ↓ Ethernet header + FCS → Frame",
            "  ↓ Converted to signal   → Bits",
          ]} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The four names, side by side</p>
        <div className="mt-3">
          <SimpleTable
            head={["Layer", "PDU name", "What it is", "What it looks like"]}
            rows={PDU_LAYERS.map((p) => [p.layer, p.name, p.what, p.example])}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Where ARP fits</p>
        <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-5 text-muted-foreground">
          ARP sits between Layer 2 and Layer 3. It carries an IP address in its payload, but it travels inside an Ethernet frame — so the switch sees it as a <span className="font-semibold text-foreground">frame</span>.
          It is correct to say <span className="font-mono">ARP reply frame</span> when talking about what the switch does. Saying "ARP packet" is also heard, but the switch processes the frame.
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Name the PDU</p>
        <p className="mt-1 text-xs text-muted-foreground">Read the sentence. Think about which layer is doing the work. Then reveal.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PDU_QUIZ.map((_, i) => <Pick key={i} active={qi === i} onClick={() => { setQi(i); setRevealed(false); }}>{i + 1}</Pick>)}
        </div>
        <div key={qi} className="n8-fade mt-3 rounded-lg border px-3 py-3">
          <p className="text-sm font-medium">{PDU_QUIZ[qi].q}</p>
          {revealed ? (
            <p className="n8-fade mt-2 text-sm font-bold" style={{ color: PDU_QUIZ[qi].c }}>→ {PDU_QUIZ[qi].a}</p>
          ) : (
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setRevealed(true)}>Show answer</Button>
          )}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Common misconceptions</p>
        <div className="mt-3">
          <MythList items={[
            ["Packet and frame are interchangeable.", "A packet is Layer 3 (IP addressing). A frame is Layer 2 (MAC addressing). Use the layer to pick the word."],
            ["A segment is what the switch sees.", "A switch sees a frame — it reads the MAC addresses in the Ethernet header, not the TCP header."],
            ["ARP is a Layer 3 protocol so it travels as a packet.", "ARP travels inside an Ethernet frame. The switch processes it as a frame."],
            ["UDP produces segments.", "TCP produces segments. UDP produces datagrams. The Transport PDU name depends on the protocol."],
            ["'Bits' and 'frame' mean the same thing.", "Bits are the raw signal at Layer 1. A frame is the structured Layer 2 unit that becomes bits when transmitted."],
          ]} />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function PacketFlowSummary() {
  const [tab, setTab] = useState<TabId>("same");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n8-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes n8-pop { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
        .n8-fade { animation: n8-fade .9s ease-out both; }
        .n8-pop { animation: n8-pop .8s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .n8-fade, .n8-pop { animation: none; opacity: 1; }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Packet Flow</CardTitle>
            <CardDescription className="mt-1">
              What actually happens when one host pings another — same LAN, across routers, and what to call the data at each layer.
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
          {tab === "same" && <SameSection />}
          {tab === "between" && <BetweenSection />}
          {tab === "pdu" && <PduSection />}
        </div>
      </CardContent>
    </Card>
  );
}