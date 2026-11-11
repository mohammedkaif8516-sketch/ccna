"use client";

import React, { useEffect, useState } from "react";

/**
 * OSI Model – interactive study component (Next.js, Tailwind, no extra deps)
 * Sections: 1) Journey player  2) Layer explorer  3) Memory tricks  4) Troubleshooting  5) Gotchas
 */

type Layer = {
  n: number;
  name: string;
  color: string;
  job: string;
  analogy: string;
  pdu: string;
  protocols: string;
  devices: string;
  down: string; // what happens at the sender
  up: string; // what happens at the receiver
  wrap: string; // label shown on the packet
};

const LAYERS: Layer[] = [
  { n: 7, name: "Application", color: "#e0556b", job: "Where apps and users meet the network. Gives apps services like web, email, file transfer, name lookup.", analogy: "You writing the letter.", pdu: "Data", protocols: "HTTP, HTTPS, DNS, FTP, SMTP, DHCP, SSH", devices: "Hosts, firewalls (L7)", down: "Lena's app says: send this photo to my brother.", up: "The app shows the cat photo to her brother.", wrap: "App data" },
  { n: 6, name: "Presentation", color: "#e88a3c", job: "Formats, compresses and encrypts data so both sides understand it (JPEG, ASCII, TLS).", analogy: "Translating and sealing the letter in a locked envelope.", pdu: "Data", protocols: "JPEG, GIF, MPEG, ASCII, TLS/SSL*", devices: "Hosts", down: "Photo is compressed and encrypted: packed and locked.", up: "Photo is decrypted and decompressed: unlocked.", wrap: "Encrypted" },
  { n: 5, name: "Session", color: "#d4a72c", job: "Opens, manages and closes the conversation between two apps.", analogy: "A phone call that stays open while you talk.", pdu: "Data", protocols: "NetBIOS, RPC, SQL sessions", devices: "Hosts", down: "Phone and app server open a conversation.", up: "The conversation is matched to the right app and closed when done.", wrap: "Session" },
  { n: 4, name: "Transport", color: "#4fa36b", job: "Splits data into pieces, numbers them, and decides how reliable delivery must be. Uses port numbers to reach the right app.", analogy: "Cutting a big parcel into numbered boxes.", pdu: "Segment (TCP) / Datagram (UDP)", protocols: "TCP (reliable), UDP (fast, no resend)", devices: "Hosts, firewalls (L4)", down: "Photo is cut into numbered pieces (TCP). Lost piece? It gets resent.", up: "Pieces are put back in order; missing ones requested again.", wrap: "TCP hdr" },
  { n: 3, name: "Network", color: "#2f9fb5", job: "Logical addressing and routing: picks the best path across networks using IP addresses.", analogy: "Writing the final destination address on the box.", pdu: "Packet", protocols: "IP, ICMP, OSPF, EIGRP", devices: "Routers, Layer 3 switches", down: "Each piece gets a label: source + destination IP address.", up: "Destination IP checked: yes, this is for me.", wrap: "IP hdr" },
  { n: 2, name: "Data Link", color: "#4a78d6", job: "Delivers frames to the next device on the same local network using MAC addresses. Adds error check (FCS).", analogy: "'First, take this to the post office down the street.'", pdu: "Frame", protocols: "Ethernet, Wi-Fi (802.11), PPP, ARP*", devices: "Switches, bridges, NICs, access points", down: "Piece gets a local label: MAC addresses for the next hop (her router).", up: "MAC address and error check verified, frame header removed.", wrap: "Frame" },
  { n: 1, name: "Physical", color: "#8a62c9", job: "Moves raw bits as electrical signals, light or radio waves.", analogy: "The road, the cable, the air itself.", pdu: "Bits", protocols: "Ethernet cables, fiber, Wi-Fi radio, USB", devices: "Cables, hubs, repeaters, NICs", down: "Frame becomes radio waves, then electrical signals, then flashes of light.", up: "Signals are turned back into ones and zeros.", wrap: "Bits" },
];

const byN = (n: number) => LAYERS.find((l) => l.n === n)!;

const SYMPTOMS = [
  { s: "No signal / cable unplugged / Wi-Fi off", n: 1 },
  { s: "Can't reach the router or other devices on my LAN", n: 2 },
  { s: "Can reach LAN but not other networks (wrong IP, gateway, routing)", n: 3 },
  { s: "Connection works but data is missing or a port is blocked", n: 4 },
  { s: "Everything connects but the app shows an error", n: 7 },
];

const GOTCHAS = [
  "IP address stays the same end to end. The MAC address changes at every hop (router to router).",
  "PDU names: Data, Segment, Packet, Frame, Bits. Layers 5-7 are all just 'Data'.",
  "TLS doesn't fit one OSI layer neatly. It's usually placed at Layer 6 (some say 5). Either is accepted in study material, just know the idea: it encrypts.",
  "ARP is the classic 'between 2 and 3' protocol. Many books list it at Layer 2, others at 3. Know what it does: maps IP to MAC.",
  "OSI is a reference model for learning and troubleshooting. Real networks run TCP/IP (4 layers), which squeezes OSI 5-6-7 into one 'Application' layer and 1-2 into 'Network Access'.",
  "Routers work at Layer 3, switches at Layer 2 (Layer 3 switches also route), hubs at Layer 1.",
];

const TOTAL = 15; // 7 down + 1 wire + 7 up

function stepInfo(step: number) {
  if (step < 7) return { side: "send" as const, layer: byN(7 - step), text: byN(7 - step).down };
  if (step === 7) return { side: "wire" as const, layer: byN(1), text: "Bits race across cables, Wi-Fi and fiber. Routers on the way read only the IP label and decide the next hop." };
  const l = byN(step - 7);
  return { side: "recv" as const, layer: l, text: l.up };
}

function Packet({ step }: { step: number }) {
  const bitsMode = step === 6 || step === 7 || step === 8;
  let minN: number;
  if (step < 7) minN = Math.max(2, 7 - step);
  else if (step === 7) minN = 2;
  else minN = step - 6; // step 8 -> 2, step 9 -> 3 ...
  const newest = step < 7 ? 7 - step : -1;

  let node: React.ReactNode = (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
      {step >= 14 ? "🐱 Cat photo shown!" : "🐱 Cat photo"}
    </div>
  );
  for (let n = 7; n >= 2; n--) {
    if (n < minN) continue;
    const l = byN(n);
    const inner = node;
    node = (
      <div
        key={`${n}-${step < 7 && n === newest ? step : "s"}`}
        className={n === newest ? "osi-pop" : ""}
        style={{ border: `2px solid ${l.color}`, background: `${l.color}1a`, borderRadius: 12, padding: 8 }}
      >
        <div className="mb-1 text-[11px] font-semibold" style={{ color: l.color }}>
          L{n} {l.wrap}
        </div>
        {inner}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className={bitsMode ? "opacity-40 transition-opacity" : "transition-opacity"}>{node}</div>
      {bitsMode && (
        <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden rounded-xl">
          <div className="osi-bits whitespace-nowrap font-mono text-lg font-bold text-violet-500">
            0110100101 1100101001 0011010110 1010011100 0110100101 1100101001 0011010110 1010011100
          </div>
        </div>
      )}
    </div>
  );
}

function Journey() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (step >= TOTAL - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), 2600);
    return () => clearTimeout(t);
  }, [playing, step]);

  const info = stepInfo(step);
  const title = info.side === "wire" ? "On the wire" : `${info.side === "send" ? "Lena's phone" : "Brother's phone"}: Layer ${info.layer.n} ${info.layer.name}`;
  const color = info.layer.color;
  const phase = info.side === "send" ? "Encapsulation (adding labels)" : info.side === "recv" ? "De-encapsulation (removing labels)" : "In transit";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Follow the photo</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Lena taps send on a cat photo. Her brother in Tokyo sees it a second later. Press play and watch what each layer does.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[150px_1fr_150px]">
        {/* sender stack */}
        <div className="order-2 md:order-1">
          <div className="mb-1 text-center text-xs font-semibold text-slate-500">Lena (sender)</div>
          {LAYERS.map((l) => {
            const active = info.side === "send" && info.layer.n === l.n;
            const done = info.side !== "send" || 7 - l.n < step;
            return (
              <div key={l.n} className="mb-1 rounded-md px-2 py-1 text-xs font-medium transition-all"
                style={{ background: active ? l.color : `${l.color}${done ? "40" : "15"}`, color: active ? "#fff" : undefined, transform: active ? "scale(1.06)" : "none" }}>
                <span className="text-slate-800 dark:text-slate-100" style={{ color: active ? "#fff" : undefined }}>{l.n} {l.name}</span>
              </div>
            );
          })}
        </div>

        {/* middle */}
        <div className="order-1 md:order-2">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: color }}>{phase}</span>
            <span className="text-slate-500">Step {step + 1} of {TOTAL}</span>
          </div>
          <Packet step={step} />
          <div className="mt-3 rounded-xl p-3" style={{ background: `${color}18`, borderLeft: `4px solid ${color}` }}>
            <div className="text-sm font-bold" style={{ color }}>{title}</div>
            <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{info.text}</p>
            {info.side !== "wire" && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDU name here: <b>{info.layer.pdu}</b></p>
            )}
          </div>
        </div>

        {/* receiver stack */}
        <div className="order-3">
          <div className="mb-1 text-center text-xs font-semibold text-slate-500">Brother (receiver)</div>
          {LAYERS.map((l) => {
            const active = info.side === "recv" && info.layer.n === l.n;
            const done = info.side === "recv" && l.n < step - 7;
            return (
              <div key={l.n} className="mb-1 rounded-md px-2 py-1 text-xs font-medium transition-all"
                style={{ background: active ? l.color : `${l.color}${done ? "40" : "15"}`, transform: active ? "scale(1.06)" : "none" }}>
                <span className="text-slate-800 dark:text-slate-100" style={{ color: active ? "#fff" : undefined }}>{l.n} {l.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => { if (step >= TOTAL - 1) setStep(0); setPlaying((p) => !p); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          {playing ? "Pause" : step >= TOTAL - 1 ? "Replay" : "Play"}
        </button>
        <button onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-200">Back</button>
        <button onClick={() => { setPlaying(false); setStep((s) => Math.min(TOTAL - 1, s + 1)); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-200">Next</button>
        <button onClick={() => { setPlaying(false); setStep(0); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-200">Reset</button>
        <div className="ml-auto flex gap-1">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button key={i} aria-label={`Go to step ${i + 1}`} onClick={() => { setPlaying(false); setStep(i); }}
              className="h-2.5 w-2.5 rounded-full" style={{ background: i <= step ? color : "#94a3b855" }} />
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Each layer wraps the data in its own header (a package inside a package). The receiver unwraps in reverse. Routers in the middle only open the Layer 3 label.
      </p>
    </section>
  );
}

function Explorer() {
  const [open, setOpen] = useState<number>(4);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">The 7 layers</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Tap a layer. Sending goes 7 down to 1. Receiving goes 1 up to 7.</p>
      <div className="mt-3 space-y-2">
        {LAYERS.map((l) => {
          const isOpen = open === l.n;
          return (
            <div key={l.n} className="overflow-hidden rounded-xl border" style={{ borderColor: isOpen ? l.color : "#94a3b844" }}>
              <button onClick={() => setOpen(isOpen ? 0 : l.n)} className="flex w-full items-center gap-3 px-3 py-2 text-left" style={{ background: isOpen ? `${l.color}22` : undefined }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: l.color }}>{l.n}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{l.name}</span>
                <span className="ml-auto hidden text-xs text-slate-500 sm:block">{l.pdu}</span>
                <span className="text-slate-400 transition-transform" style={{ transform: isOpen ? "rotate(90deg)" : "none" }}>▸</span>
              </button>
              {isOpen && (
                <div className="osi-fade space-y-2 px-4 pb-3 pt-1 text-sm text-slate-700 dark:text-slate-200">
                  <p>{l.job}</p>
                  <p><b>Think of it as:</b> {l.analogy}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Chip label="PDU" v={l.pdu} c={l.color} />
                    <Chip label="Protocols" v={l.protocols} c={l.color} />
                    <Chip label="Devices" v={l.devices} c={l.color} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Chip({ label, v, c }: { label: string; v: string; c: string }) {
  return (
    <div className="rounded-lg p-2 text-xs" style={{ background: `${c}15` }}>
      <div className="font-bold" style={{ color: c }}>{label}</div>
      <div className="text-slate-700 dark:text-slate-200">{v}</div>
    </div>
  );
}

function Memory() {
  const [dir, setDir] = useState<"down" | "up">("down");
  const down = ["All", "People", "Seem", "To", "Need", "Data", "Processing"]; // 7 -> 1
  const up = ["Please", "Do", "Not", "Throw", "Sausage", "Pizza", "Away"]; // 1 -> 7
  const words = dir === "down" ? down : up;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Memory tricks</h2>
      <div className="mt-2 flex gap-2">
        {(["down", "up"] as const).map((d) => (
          <button key={d} onClick={() => setDir(d)} className={`rounded-full px-3 py-1 text-sm font-semibold ${dir === d ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            {d === "down" ? "Top to bottom (7 to 1)" : "Bottom to top (1 to 7)"}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((w, i) => {
          const n = dir === "down" ? 7 - i : i + 1;
          const l = byN(n);
          return (
            <div key={w} className="osi-fade rounded-xl px-3 py-2 text-center" style={{ background: `${l.color}22`, border: `2px solid ${l.color}` }}>
              <div className="text-base font-bold text-slate-900 dark:text-white">{w}</div>
              <div className="text-[11px]" style={{ color: l.color }}>L{n} {l.name}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Data journey: <b>Data, Segment, Packet, Frame, Bits</b> (Layers 7-5, 4, 3, 2, 1).
        Story hook: <b>Letter (7), sealed (6), phone call (5), numbered boxes (4), address (3), local post office (2), road (1).</b>
      </p>
    </section>
  );
}

function Troubleshoot() {
  const [pick, setPick] = useState<number | null>(null);
  const l = pick ? byN(pick) : null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Use the layers to troubleshoot</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Pick what is going wrong. The model tells you where to look.</p>
      <div className="mt-3 grid gap-2">
        {SYMPTOMS.map((x) => (
          <button key={x.s} onClick={() => setPick(x.n)} className={`rounded-lg border px-3 py-2 text-left text-sm ${pick === x.n ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-slate-200 dark:border-slate-700"} text-slate-800 dark:text-slate-100`}>
            {x.s}
          </button>
        ))}
      </div>
      {l && (
        <div className="osi-fade mt-3 rounded-xl p-3 text-sm" style={{ background: `${l.color}20`, borderLeft: `4px solid ${l.color}` }}>
          <b style={{ color: l.color }}>Layer {l.n}: {l.name}</b>
          <p className="mt-1 text-slate-700 dark:text-slate-200">Start with: {l.devices}. Protocols involved: {l.protocols}.</p>
        </div>
      )}
    </section>
  );
}

export function OsiModel() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4">
      <style>{`
        @keyframes osiPop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes osiFade{0%{opacity:0;transform:translateY(-4px)}100%{opacity:1;transform:none}}
        @keyframes osiBits{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .osi-pop{animation:osiPop .45s ease-out}
        .osi-fade{animation:osiFade .3s ease-out}
        .osi-bits{animation:osiBits 3s linear infinite}
        @media (prefers-reduced-motion: reduce){.osi-pop,.osi-fade,.osi-bits{animation:none}}
      `}</style>

      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">OSI Model</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Open Systems Interconnection: 7 layers, 7 jobs. It is a map that splits "how data travels" into small pieces so you can learn, design and troubleshoot networks one layer at a time.
        </p>
      </header>

      <Journey />
      <Explorer />
      <Memory />
      <Troubleshoot />

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">Exam gotchas</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-amber-900 dark:text-amber-100">
          {GOTCHAS.map((g) => <li key={g}>{g}</li>)}
        </ul>
        <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">* Placement varies slightly between textbooks. Know the function, not just the layer number.</p>
      </section>
    </div>
  );
}