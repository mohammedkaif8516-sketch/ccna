"use client";

import React, { useEffect, useState } from "react";

/**
 * TCP + TLS + HTTP: how they work together (Next.js, Tailwind, no extra deps)
 * 1) Full journey player  2) Inside one request (layer wrapping)  3) TCP deep dive (tabs)
 * 4) HTTP deep dive (tabs)  5) Ports cheat sheet  6) Remember + gotchas
 */

const COL = { dns: "#e88a3c", tcp: "#4a78d6", tls: "#4fa36b", http: "#e0556b", ip: "#8a62c9" };
type Phase = "DNS" | "TCP" | "TLS" | "HTTP";
const PH: Record<Phase, { color: string; job: string }> = {
  DNS: { color: COL.dns, job: "Where is the server?" },
  TCP: { color: COL.tcp, job: "Make a reliable connection" },
  TLS: { color: COL.tls, job: "Secure the connection" },
  HTTP: { color: COL.http, job: "Ask for the page" },
};
const STACK: { id: string; color: string }[] = [
  { id: "HTTP", color: COL.http }, { id: "TLS", color: COL.tls }, { id: "TCP", color: COL.tcp }, { id: "IP", color: COL.ip },
];

type Step = { phase: Phase; title: string; text: string; dir: "c2s" | "s2c" | "local"; pkt: string; c: string[]; s: string[]; peer?: string };

const STEPS: Step[] = [
  { phase: "DNS", title: "Browser needs an IP address", text: "You type google.com. You never typed http or https, but Chrome normally tries HTTPS, which means port 443. Before it can connect, it needs Google's IP: it checks its own cache, then the OS, then asks the DNS resolver.", dir: "local", pkt: "", c: ["HTTP"], s: [], peer: "DNS resolver" },
  { phase: "DNS", title: "DNS lookup finishes", text: "DNS answers with Google's IP address (see the DNS lesson for the full chain). DNS only tells the browser WHERE the server is. Nothing has been sent to Google yet.", dir: "s2c", pkt: "DNS answer: google.com = IP", c: ["HTTP"], s: [], peer: "DNS resolver" },
  { phase: "TCP", title: "1. SYN", text: "The browser picks a random source port (like 52311) and sends a SYN to Google's IP on port 443: 'I'd like to connect. My byte numbering starts at x.'", dir: "c2s", pkt: "SYN  (seq = x)", c: ["TCP", "IP"], s: ["IP", "TCP"] },
  { phase: "TCP", title: "2. SYN-ACK", text: "Google replies with ONE packet that has both flags set: 'I got your SYN (ack = x+1). My byte numbering starts at y.'", dir: "s2c", pkt: "SYN + ACK  (seq = y, ack = x+1)", c: ["IP", "TCP"], s: ["TCP", "IP"] },
  { phase: "TCP", title: "3. ACK: connection established", text: "The browser answers 'got it' (ack = y+1). This is the three-way handshake. Now both sides know the other can send and receive, and they agree on starting sequence numbers. The connection is reliable and ordered, but NOT encrypted.", dir: "c2s", pkt: "ACK  (ack = y+1)", c: ["TCP", "IP"], s: ["IP", "TCP"] },
  { phase: "TLS", title: "TLS Client Hello", text: "Before sending anything private, the browser starts the TLS handshake: it lists the encryption methods it supports and sends its public key-exchange information.", dir: "c2s", pkt: "ClientHello: ciphers + key share", c: ["TLS", "TCP", "IP"], s: ["IP", "TCP", "TLS"] },
  { phase: "TLS", title: "TLS Server Hello + certificate", text: "Google picks a cipher, sends its own key-exchange information and its certificate (proof of identity, signed by a trusted authority).", dir: "s2c", pkt: "ServerHello + certificate + key share", c: ["IP", "TCP", "TLS"], s: ["TLS", "TCP", "IP"] },
  { phase: "TLS", title: "Browser checks the certificate and makes keys", text: "The browser verifies the certificate is valid for google.com, not expired, and issued by a trusted authority. Then both sides use the exchanged information to calculate the same encryption keys. The keys themselves are NEVER sent over the network.", dir: "local", pkt: "", c: ["TLS"], s: ["TLS"] },
  { phase: "TLS", title: "Secure channel ready", text: "Both sides confirm with a Finished message. From now on everything is encrypted. This whole TLS handshake is the first step of an HTTPS request.", dir: "c2s", pkt: "Finished (encrypted)", c: ["TLS", "TCP", "IP"], s: ["IP", "TCP", "TLS"] },
  { phase: "HTTP", title: "Browser creates the HTTP GET request", text: "At last the real request: GET / HTTP/1.1 with headers like Host: google.com. It is plain HTTP text at this point.", dir: "local", pkt: "", c: ["HTTP"], s: [] },
  { phase: "HTTP", title: "Down the stack and across the network", text: "TLS encrypts the request. TCP cuts the encrypted bytes into segments and numbers them with sequence numbers. IP adds source and destination IP addresses. Routers forward the packets toward Google using only the IP header.", dir: "c2s", pkt: "IP | TCP seq | 🔒 encrypted GET", c: ["HTTP", "TLS", "TCP", "IP"], s: ["IP"] },
  { phase: "HTTP", title: "Server unwraps in reverse", text: "IP confirms the packets are for this server. TCP puts bytes back in the correct order (packets may arrive shuffled). TLS decrypts. Finally the HTTP layer reads the original GET request.", dir: "local", pkt: "", c: [], s: ["IP", "TCP", "TLS", "HTTP"] },
  { phase: "HTTP", title: "HTTP response travels back", text: "Google builds an HTTP response: 200 OK plus the HTML of the homepage. It goes through HTTP, TLS, TCP and IP again and travels back to the browser.", dir: "s2c", pkt: "HTTP 200 OK + HTML (encrypted)", c: ["IP"], s: ["HTTP", "TLS", "TCP", "IP"] },
  { phase: "HTTP", title: "Browser unwraps and renders", text: "The browser reverses the same steps, reads the HTML, then requests the CSS, images and scripts it mentions, usually reusing this same open connection (keep-alive). When finished, TCP closes with FIN packets.", dir: "local", pkt: "", c: ["IP", "TCP", "TLS", "HTTP"], s: [] },
];

function Card({ title, sub, children, tone }: { title: string; sub?: string; children: React.ReactNode; tone?: "amber" }) {
  return (
    <section className={`rounded-2xl border p-5 ${tone === "amber" ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
      <h2 className={`text-xl font-bold ${tone === "amber" ? "text-amber-900 dark:text-amber-100" : "text-slate-900 dark:text-white"}`}>{title}</h2>
      {sub && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sub}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Pill({ on, onClick, children, color }: { on: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${on ? "text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`} style={on ? { background: color || "#4f46e5" } : undefined}>{children}</button>
  );
}

const Ghost = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:text-slate-200">{children}</button>
);

function StackCol({ lit }: { lit: string[] }) {
  return (
    <div className="space-y-1">
      {STACK.map((l) => {
        const on = lit.includes(l.id);
        return (
          <div key={l.id} className="rounded-md py-1 text-center text-xs font-bold transition-all" style={{ background: on ? l.color : `${l.color}18`, color: on ? "#fff" : l.color, transform: on ? "scale(1.06)" : "none" }}>{l.id}</div>
        );
      })}
    </div>
  );
}

/* ---------------- 1. Journey ---------------- */
function Journey() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (i >= STEPS.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 3200);
    return () => clearTimeout(t);
  }, [playing, i]);

  const s = STEPS[i];
  const color = PH[s.phase].color;
  const phases = Object.keys(PH) as Phase[];

  return (
    <Card title="Follow one HTTPS page load" sub="Four jobs, always in this order: DNS finds the server, TCP connects, TLS secures, HTTP asks for the page.">
      <div className="flex flex-wrap gap-2">
        {phases.map((p) => (
          <Pill key={p} on={s.phase === p} color={PH[p].color} onClick={() => { setPlaying(false); setI(STEPS.findIndex((x) => x.phase === p)); }}>{p}: {PH[p].job}</Pill>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[72px_1fr_72px] items-center gap-2 sm:grid-cols-[110px_1fr_110px] sm:gap-4">
        <div>
          <div className="mb-1 text-center text-xs font-semibold text-slate-500">Your browser</div>
          <StackCol lit={s.c} />
        </div>
        <div className="relative h-16">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-300 dark:bg-slate-600" />
          {s.dir !== "local" && (
            <div key={i} className={`absolute top-1/2 -mt-3 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${s.dir === "c2s" ? "tcp-ltr" : "tcp-rtl"}`} style={{ background: color }}>✉</div>
          )}
          <div className="absolute inset-x-0 bottom-0 text-center text-[11px] font-semibold" style={{ color }}>{s.pkt || (s.dir === "local" ? "(happens on one machine)" : "")}</div>
        </div>
        <div>
          <div className="mb-1 text-center text-xs font-semibold text-slate-500">{s.peer || "Google server"}</div>
          <StackCol lit={s.s} />
        </div>
      </div>

      <div key={`t${i}`} className="tcp-fade mt-4 rounded-xl p-3" style={{ background: `${color}1c`, borderLeft: `4px solid ${color}` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</div>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: color }}>{s.phase}</span>
        </div>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{s.text}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => { if (i >= STEPS.length - 1) setI(0); setPlaying((p) => !p); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">{playing ? "Pause" : i >= STEPS.length - 1 ? "Replay" : "Play"}</button>
        <Ghost onClick={() => { setPlaying(false); setI((x) => Math.max(0, x - 1)); }}>Back</Ghost>
        <Ghost onClick={() => { setPlaying(false); setI((x) => Math.min(STEPS.length - 1, x + 1)); }}>Next</Ghost>
        <Ghost onClick={() => { setPlaying(false); setI(0); }}>Reset</Ghost>
        <div className="ml-auto flex gap-1">
          {STEPS.map((x, k) => <button key={k} aria-label={`Step ${k + 1}`} onClick={() => { setPlaying(false); setI(k); }} className="h-2.5 w-2.5 rounded-full" style={{ background: k <= i ? PH[x.phase].color : "#94a3b855" }} />)}
        </div>
      </div>
    </Card>
  );
}

/* ---------------- 2. Inside one request ---------------- */
function Wrapping() {
  const [mode, setMode] = useState<"send" | "recv">("send");
  const [st, setSt] = useState(0);
  const wraps = mode === "send" ? st : 3 - st;
  const capSend = ["HTTP builds the GET request (plain text).", "TLS encrypts it into protected records.", "TCP splits the bytes into segments and numbers them (seq). Adds ports: your random port to 443.", "IP adds source and destination IP addresses. Routers only read this label."];
  const capRecv = ["IP: this packet is addressed to me, remove the IP header.", "TCP: put segments in the right order using seq numbers, send an ACK, remove the TCP header.", "TLS: decrypt with the shared keys.", "HTTP: read the original GET request. Time to build a response."];
  const cap = (mode === "send" ? capSend : capRecv)[st];

  let node: React.ReactNode = (
    <div className="rounded-lg bg-slate-100 p-2 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100">GET / HTTP/1.1<br />Host: google.com</div>
  );
  const layers = [
    { n: 1, label: "TLS: encrypted", c: COL.tls },
    { n: 2, label: "TCP: src port 52311, dst port 443, seq, ack", c: COL.tcp },
    { n: 3, label: "IP: src 192.168.x.x, dst Google IP", c: COL.ip },
  ];
  layers.forEach((l) => {
    if (l.n > wraps) return;
    // TLS replaces the readable text with scrambled bytes; TCP and IP wrap around that
    const inner = l.n === 1
      ? <div className="rounded-lg bg-slate-200 p-2 text-center font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-100">🔒 x9F3a...7Qe</div>
      : node;
    node = (
      <div className="tcp-pop rounded-xl p-2" style={{ border: `2px solid ${l.c}`, background: `${l.c}18` }}>
        <div className="mb-1 text-[11px] font-semibold" style={{ color: l.c }}>{l.label}</div>
        {inner}
      </div>
    );
  });

  return (
    <Card title="Inside one request" sub="Each layer wraps the request, like a parcel inside a parcel. The server unwraps it in reverse order.">
      <div className="flex gap-2">
        <Pill on={mode === "send"} onClick={() => { setMode("send"); setSt(0); }}>Browser sends</Pill>
        <Pill on={mode === "recv"} onClick={() => { setMode("recv"); setSt(0); }}>Server receives</Pill>
      </div>
      <div className="mx-auto mt-3 max-w-md" key={`${mode}${st}`}>{node}</div>
      <p className="tcp-fade mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{cap}</p>
      <div className="mt-3 flex items-center gap-3">
        <input aria-label="Stage" type="range" min={0} max={3} value={st} onChange={(e) => setSt(+e.target.value)} className="w-full accent-indigo-600" />
        <span className="w-14 text-xs text-slate-500">Stage {st + 1}/4</span>
      </div>
    </Card>
  );
}

/* ---------------- 3. TCP deep dive ---------------- */
function Handshake() {
  const [n, setN] = useState(1);
  const rows = [
    { from: "Client", to: "Server", f: "SYN", d: "seq=1000", say: "Hi, I want to talk. My byte numbering starts at 1000.", c: COL.tcp },
    { from: "Server", to: "Client", f: "SYN + ACK", d: "seq=5000, ack=1001", say: "Okay. I got your 1000, so I expect 1001 next. My numbering starts at 5000.", c: COL.tls },
    { from: "Client", to: "Server", f: "ACK", d: "seq=1001, ack=5001", say: "Got it. I expect 5001 next. Connection established.", c: COL.tcp },
  ];
  return (
    <div>
      <div className="space-y-2">
        {rows.slice(0, n).map((r, k) => (
          <div key={k} className="tcp-fade rounded-xl p-3 text-sm" style={{ background: `${r.c}18`, borderLeft: `4px solid ${r.c}` }}>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
              {k + 1}. {r.from} → {r.to}
              <span className="rounded-full px-2 py-0.5 text-[11px] text-white" style={{ background: r.c }}>{r.f}</span>
              <code className="text-xs font-normal text-slate-600 dark:text-slate-300">{r.d}</code>
            </div>
            <p className="mt-1 text-slate-700 dark:text-slate-200">{r.say}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => setN((x) => Math.min(3, x + 1))} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Next packet</button>
        <Ghost onClick={() => setN(1)}>Reset</Ghost>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
        <li><b>Why three steps?</b> Each side must prove it can both send and receive, and the two sides swap starting sequence numbers (ISNs).</li>
        <li>The ISN is random, not 0. The ack number always means "the next byte I expect".</li>
        <li>The SYN flag takes up one sequence number, which is why ack = seq + 1.</li>
        <li>The client uses a random temporary (ephemeral) port; the server uses a well-known port such as 443.</li>
      </ul>
    </div>
  );
}

function Reliability() {
  const [lost, setLost] = useState<number>(3);
  const [stage, setStage] = useState(0);
  const arrival = [2, 1, 4, 3, 6, 5];
  const arrived = arrival.filter((x) => x !== lost);
  const sorted = [...arrived].sort((a, b) => a - b);
  let contiguous = 0;
  while (sorted.includes(contiguous + 1)) contiguous++;
  const box = (label: string, bg: string, key?: string) => <span key={key || label} className="tcp-pop inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: bg }}>{label}</span>;

  const captions = [
    "The sender has 6 segments. Each carries a range of byte numbers (seq).",
    lost ? `Sent! The network shuffles the arrival order, and segment ${lost} gets lost on the way.` : "Sent! The network shuffles the arrival order, but nothing is lost.",
    lost ? `TCP sorts what arrived. It can only ACK up to segment ${contiguous}: the receiver keeps saying 'I still need ${contiguous + 1}' (duplicate ACKs).` : "TCP sorts the segments into the right order and ACKs all of them.",
    lost ? `The sender notices (timeout or repeated ACKs) and resends segment ${lost}. Now the app gets all 6, in order.` : "The application receives all bytes in the correct order. Nothing needed resending.",
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        Lose segment:
        {[0, 1, 2, 3, 4, 5, 6].map((x) => <Pill key={x} on={lost === x} color="#e0556b" onClick={() => { setLost(x); setStage(0); }}>{x === 0 ? "none" : x}</Pill>)}
      </div>
      <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
        <div className="text-xs font-semibold text-slate-500">Sender</div>
        <div className="flex gap-1.5">{[1, 2, 3, 4, 5, 6].map((x) => box(String(x), x === lost && stage >= 1 && stage < 3 ? "#e0556b" : COL.tcp, `s${x}`))}</div>
        {stage >= 1 && <><div className="text-xs font-semibold text-slate-500">Arrival order at the receiver</div>
          <div className="flex gap-1.5">{arrived.map((x) => box(String(x), "#94a3b8", `a${x}`))}</div></>}
        {stage >= 2 && <><div className="text-xs font-semibold text-slate-500">After TCP reordering</div>
          <div className="flex gap-1.5">{[1, 2, 3, 4, 5, 6].map((x) => sorted.includes(x) || stage >= 3 ? box(String(x), COL.tls, `r${x}`) : <span key={`g${x}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-dashed border-rose-400 text-sm font-bold text-rose-500">?</span>)}</div></>}
      </div>
      <p key={stage} className="tcp-fade mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-slate-800 dark:bg-indigo-950 dark:text-slate-100">{captions[stage]}</p>
      <div className="mt-2 flex gap-2">
        <button onClick={() => setStage((x) => Math.min(3, x + 1))} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Next</button>
        <Ghost onClick={() => setStage(0)}>Reset</Ghost>
      </div>
      <p className="mt-2 text-xs text-slate-500">Real TCP numbers every BYTE, not whole segments. Segments are used here to keep the picture simple.</p>
    </div>
  );
}

function Window() {
  const [w, setW] = useState(3);
  return (
    <div>
      <p className="text-sm text-slate-700 dark:text-slate-200">The receiver tells the sender how much data it can accept before an ACK (the <b>window size</b>). A bigger window means more data in flight, faster transfer. A small window slows the sender so the receiver isn't overwhelmed. This is <b>flow control</b>.</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs text-slate-500">Window</span>
        <input type="range" min={1} max={6} value={w} onChange={(e) => setW(+e.target.value)} className="w-40 accent-indigo-600" aria-label="Window size" />
        <b className="text-sm text-slate-800 dark:text-slate-100">{w} segment{w > 1 ? "s" : ""}</b>
      </div>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => <span key={x} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold" style={{ background: x <= w ? COL.tcp : "#94a3b833", color: x <= w ? "#fff" : "#64748b" }}>{x}</span>)}
      </div>
      <p className="mt-2 text-xs text-slate-500">Blue = allowed to send without waiting for an ACK. As ACKs arrive, the window slides forward. <b>Congestion control</b> is related but different: the sender slows down if the NETWORK seems overloaded.</p>
    </div>
  );
}

function TcpDeep() {
  const tabs = ["3-way handshake", "Reliability", "Flow control", "Closing", "Header & flags"];
  const [t, setT] = useState(0);
  return (
    <Card title="TCP deep dive" sub="Transport layer (Layer 4). Connection-oriented, reliable, ordered. Slower to start than UDP, but nothing is lost silently.">
      <div className="mb-3 flex flex-wrap gap-2">{tabs.map((x, k) => <Pill key={x} on={t === k} color={COL.tcp} onClick={() => setT(k)}>{x}</Pill>)}</div>
      {t === 0 && <Handshake />}
      {t === 1 && <Reliability />}
      {t === 2 && <Window />}
      {t === 3 && (
        <div className="text-sm text-slate-700 dark:text-slate-200">
          <p>Closing is a <b>four-step</b> exchange, because each direction is closed on its own:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Side A sends <b>FIN</b>: "I'm done sending."</li>
            <li>Side B sends <b>ACK</b>: "Noted."</li>
            <li>Side B sends its own <b>FIN</b> when it is done.</li>
            <li>Side A sends <b>ACK</b>, then waits briefly (TIME-WAIT) in case that last ACK was lost.</li>
          </ol>
          <p className="mt-2"><b>RST</b> is the abrupt option: "Reset, this connection is invalid" (for example, a connection to a closed port).</p>
        </div>
      )}
      {t === 4 && (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["Source / destination port", "Which app on each side. Example: 52311 to 443."],
            ["Sequence number", "Number of the first byte in this segment."],
            ["Acknowledgment number", "The next byte I expect from you."],
            ["Flags", "SYN start, ACK acknowledge, FIN finish, RST reset, PSH push data now."],
            ["Window size", "How many bytes I can accept (flow control)."],
            ["Checksum", "Detects corrupted segments."],
          ].map(([a, b]) => (
            <div key={a} className="rounded-lg p-2" style={{ background: `${COL.tcp}14` }}><b style={{ color: COL.tcp }}>{a}</b><div className="text-slate-700 dark:text-slate-200">{b}</div></div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------------- 4. HTTP deep dive ---------------- */
const REQ = [
  { l: "GET /search?q=ccna HTTP/1.1", e: "Request line: method (GET), path and query (/search?q=ccna), protocol version." },
  { l: "Host: google.com", e: "Which website you want. One server (one IP) can host many sites, so this is required in HTTP/1.1." },
  { l: "User-Agent: Chrome/…", e: "Which client is asking." },
  { l: "Accept: text/html", e: "What content types the client can handle." },
  { l: "Cookie: session=abc123", e: "Cookies sent back to the server. HTTP is stateless, so cookies are how a site remembers you." },
  { l: "(blank line, then optional body)", e: "A blank line ends the headers. GET usually has no body; POST carries form or JSON data here." },
];
const RES = [
  { l: "HTTP/1.1 200 OK", e: "Status line: version, status code (200), reason text." },
  { l: "Content-Type: text/html", e: "What kind of data the body is." },
  { l: "Content-Length: 15432", e: "Size of the body in bytes." },
  { l: "Set-Cookie: session=abc123", e: "Server asks the browser to store a cookie." },
  { l: "(blank line)", e: "End of headers." },
  { l: "<html>…homepage…</html>", e: "The body: the HTML the browser will render." },
];
const CODES: Record<string, { c: string; list: [string, string][] }> = {
  "1xx Info": { c: "#94a3b8", list: [["100 Continue", "Keep sending the body."], ["101 Switching Protocols", "e.g. upgrading to WebSocket."]] },
  "2xx Success": { c: "#4fa36b", list: [["200 OK", "Request worked."], ["201 Created", "A new resource was made."], ["204 No Content", "Success, nothing to send back."]] },
  "3xx Redirect": { c: "#d4a72c", list: [["301 Moved Permanently", "Use the new URL from now on."], ["302 Found", "Temporary redirect."], ["304 Not Modified", "Your cached copy is still good."]] },
  "4xx Client error": { c: "#e88a3c", list: [["400 Bad Request", "Malformed request."], ["401 Unauthorized", "Log in first."], ["403 Forbidden", "Logged in but not allowed."], ["404 Not Found", "No such page."], ["429 Too Many Requests", "Slow down."]] },
  "5xx Server error": { c: "#e0556b", list: [["500 Internal Server Error", "Server crashed on this request."], ["502 Bad Gateway", "Upstream server gave a bad reply."], ["503 Service Unavailable", "Overloaded or down."], ["504 Gateway Timeout", "Upstream took too long."]] },
};
const METHODS = [
  ["GET", "Read a resource", "Yes", "Yes"], ["HEAD", "Like GET, headers only", "Yes", "Yes"], ["POST", "Create / submit data", "No", "No"],
  ["PUT", "Replace a resource", "No", "Yes"], ["PATCH", "Partly update", "No", "Not guaranteed"], ["DELETE", "Remove a resource", "No", "Yes"],
];

function Anatomy() {
  const [sel, setSel] = useState<string>("");
  const block = (title: string, lines: { l: string; e: string }[], c: string) => (
    <div>
      <div className="mb-1 text-sm font-bold" style={{ color: c }}>{title}</div>
      <div className="rounded-xl bg-slate-900 p-2 font-mono text-xs">
        {lines.map((x) => (
          <button key={x.l} onClick={() => setSel(x.l)} className="block w-full rounded px-2 py-1 text-left text-slate-100" style={{ background: sel === x.l ? `${c}66` : "transparent" }}>{x.l}</button>
        ))}
      </div>
    </div>
  );
  const all = [...REQ, ...RES].find((x) => x.l === sel);
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">{block("Request (browser to server)", REQ, COL.http)}{block("Response (server to browser)", RES, COL.tls)}</div>
      <p className="tcp-fade mt-3 min-h-[3rem] rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200" key={sel}>{all ? all.e : "Tap any line to see what it means."}</p>
    </div>
  );
}

function Codes() {
  const [k, setK] = useState("2xx Success");
  const g = CODES[k];
  return (
    <div>
      <div className="flex flex-wrap gap-2">{Object.keys(CODES).map((x) => <Pill key={x} on={k === x} color={CODES[x].c} onClick={() => setK(x)}>{x}</Pill>)}</div>
      <div key={k} className="tcp-fade mt-3 space-y-1.5">
        {g.list.map(([a, b]) => (
          <div key={a} className="rounded-lg p-2 text-sm" style={{ background: `${g.c}1c`, borderLeft: `4px solid ${g.c}` }}><b className="text-slate-900 dark:text-white">{a}</b> <span className="text-slate-600 dark:text-slate-300">: {b}</span></div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Trick: the first digit tells the story. 2 = good, 3 = go elsewhere, 4 = your fault, 5 = server's fault.</p>
    </div>
  );
}

function HttpDeep() {
  const tabs = ["Request & response", "Status codes", "Methods", "HTTP vs HTTPS", "Versions"];
  const [t, setT] = useState(0);
  return (
    <Card title="HTTP deep dive" sub="Application layer (Layer 7). A simple request and response language. HTTP itself has no idea about connections or encryption: it relies on TCP and TLS below it.">
      <div className="mb-3 flex flex-wrap gap-2">{tabs.map((x, k) => <Pill key={x} on={t === k} color={COL.http} onClick={() => setT(k)}>{x}</Pill>)}</div>
      {t === 0 && <Anatomy />}
      {t === 1 && <Codes />}
      {t === 2 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-800 dark:text-slate-100">
            <thead><tr className="border-b border-slate-300 dark:border-slate-600"><th className="py-1 pr-3">Method</th><th className="pr-3">Use</th><th className="pr-3">Safe</th><th>Idempotent</th></tr></thead>
            <tbody>{METHODS.map((m) => <tr key={m[0]} className="border-b border-slate-100 dark:border-slate-800"><td className="py-1 pr-3 font-mono font-bold" style={{ color: COL.http }}>{m[0]}</td><td className="pr-3">{m[1]}</td><td className="pr-3">{m[2]}</td><td>{m[3]}</td></tr>)}</tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">Safe = doesn't change anything on the server. Idempotent = repeating it has the same effect as doing it once.</p>
        </div>
      )}
      {t === 3 && (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl p-3" style={{ background: `${COL.http}14` }}><b style={{ color: COL.http }}>HTTP (port 80)</b><p className="text-slate-700 dark:text-slate-200">Runs straight on TCP. Anyone on the path can read or change the data. Passwords and cookies are exposed.</p></div>
          <div className="rounded-xl p-3" style={{ background: `${COL.tls}14` }}><b style={{ color: COL.tls }}>HTTPS (port 443)</b><p className="text-slate-700 dark:text-slate-200">The same HTTP, but inside TLS. You get <b>encryption</b> (no snooping), <b>integrity</b> (no tampering) and <b>authentication</b> (the certificate proves it's really google.com).</p></div>
          <p className="text-xs text-slate-500 sm:col-span-2">HTTPS = HTTP + TLS. The messages are identical; they are just encrypted before TCP carries them.</p>
        </div>
      )}
      {t === 4 && (
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <li><b>HTTP/1.0:</b> a new TCP connection for every single request. Slow.</li>
          <li><b>HTTP/1.1:</b> persistent connections (keep-alive) reuse one TCP connection for many requests. Host header required.</li>
          <li><b>HTTP/2:</b> many requests at the same time over one TCP connection (multiplexing), binary format, header compression. Normally used with TLS.</li>
          <li><b>HTTP/3:</b> runs over <b>QUIC on UDP</b>, not TCP, with TLS 1.3 built in. Avoids TCP's head-of-line blocking. So "HTTP always uses TCP" is true for HTTP/1.x and 2 only.</li>
        </ul>
      )}
    </Card>
  );
}

/* ---------------- 5. Ports ---------------- */
const PORTS: [string, string, string][] = [
  ["20 / 21", "FTP (data / control)", "TCP"], ["22", "SSH", "TCP"], ["23", "Telnet", "TCP"], ["25", "SMTP (send mail)", "TCP"],
  ["53", "DNS", "UDP (and TCP)"], ["67 / 68", "DHCP server / client", "UDP"], ["69", "TFTP", "UDP"], ["80", "HTTP", "TCP"],
  ["110", "POP3", "TCP"], ["123", "NTP", "UDP"], ["143", "IMAP", "TCP"], ["161 / 162", "SNMP / traps", "UDP"], ["443", "HTTPS", "TCP"],
];

function Ports() {
  const [q, setQ] = useState("");
  const rows = PORTS.filter((p) => (p.join(" ")).toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Ports to know for CCNA" sub="A port picks the application on a device. IP address finds the machine; port finds the program.">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: 443, dns, mail…" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((p) => (
          <div key={p[0]} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-800">
            <span className="w-16 font-mono font-bold text-indigo-600 dark:text-indigo-300">{p[0]}</span>
            <span className="flex-1 text-slate-800 dark:text-slate-100">{p[1]}</span>
            <span className="text-xs text-slate-500">{p[2]}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">Nothing matches. Try another search.</p>}
      </div>
      <p className="mt-2 text-xs text-slate-500">Ranges: 0-1023 well-known, 1024-49151 registered, 49152-65535 dynamic. Your browser's own port (like 52311) comes from the dynamic range.</p>
    </Card>
  );
}

/* ---------------- 6. TCP vs UDP + remember ---------------- */
function Remember() {
  const rows = [
    ["Connection", "Handshake first", "None, just send"],
    ["Reliability", "Resends lost data", "Lost data is skipped"],
    ["Order", "Guaranteed", "Not guaranteed"],
    ["Speed / overhead", "Slower, more overhead", "Faster, lighter"],
    ["Used by", "Web, email, SSH, file transfer", "DNS, DHCP, video calls, streaming"],
  ];
  return (
    <>
      <Card title="TCP vs UDP">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-800 dark:text-slate-100">
          <thead><tr className="border-b border-slate-300 dark:border-slate-600"><th className="py-1"></th><th style={{ color: COL.tcp }}>TCP</th><th style={{ color: COL.dns }}>UDP</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]} className="border-b border-slate-100 dark:border-slate-800"><td className="py-1 pr-3 font-semibold">{r[0]}</td><td className="pr-3">{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
        </table></div>
      </Card>
      <Card tone="amber" title="Remember this">
        <p className="text-sm text-amber-900 dark:text-amber-100"><b>Where, Connect, Secure, Ask.</b> DNS tells you WHERE the server is. TCP CONNECTS reliably. TLS makes it SECURE. HTTP ASKS for the page.</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-amber-900 dark:text-amber-100">
          <li>TCP gives reliability and order but <b>no encryption</b>. That is why TLS exists.</li>
          <li>TLS keys are calculated on both sides. They are never sent over the network.</li>
          <li>Going down the stack: HTTP, then TLS, then TCP, then IP. Going up on the server is the exact reverse.</li>
          <li>Routers look only at the IP header. They cannot read the encrypted HTTP request.</li>
          <li>The SYN-ACK is one packet with two flags, not two separate packets.</li>
          <li>TLS 1.3 completes its handshake in one round trip; TLS 1.2 needs two. Either way it happens after TCP, before HTTP.</li>
          <li>HTTP is stateless. Cookies let a site remember you across requests.</li>
          <li>OSI mapping: HTTP is Layer 7, TLS roughly Layer 6, TCP Layer 4, IP Layer 3.</li>
        </ul>
      </Card>
    </>
  );
}

export function TcpHttp() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4">
      <style>{`
        @keyframes tcpLtr{0%{left:0;transform:translateX(0)}100%{left:100%;transform:translateX(-100%)}}
        @keyframes tcpRtl{0%{left:100%;transform:translateX(-100%)}100%{left:0;transform:translateX(0)}}
        @keyframes tcpPop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes tcpFade{0%{opacity:0;transform:translateY(-4px)}100%{opacity:1;transform:none}}
        .tcp-ltr{animation:tcpLtr 2.2s ease-in-out forwards}
        .tcp-rtl{animation:tcpRtl 2.2s ease-in-out forwards}
        .tcp-pop{animation:tcpPop .35s ease-out}
        .tcp-fade{animation:tcpFade .3s ease-out}
        @media (prefers-reduced-motion: reduce){.tcp-ltr,.tcp-rtl{animation:none;left:50%}.tcp-pop,.tcp-fade{animation:none}}
      `}</style>
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">TCP, TLS and HTTP together</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Many people know "TCP connects, HTTP gets data" but mix up the order. Here it is: <b>DNS</b> finds the server, <b>TCP</b> connects, <b>TLS</b> secures, <b>HTTP</b> asks for the page.</p>
      </header>
      <Journey />
      <Wrapping />
      <TcpDeep />
      <HttpDeep />
      <Ports />
      <Remember />
    </div>
  );
}