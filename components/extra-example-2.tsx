"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * DNS – interactive study component (Next.js, Tailwind, no extra deps)
 * Sections: 1) Lookup player (with cache scenarios)  2) Who's who  3) Read a domain  4) Record types  5) Memory + gotchas
 */

type NodeId = "browser" | "os" | "resolver" | "root" | "tld" | "auth";

const NODES: Record<NodeId, { label: string; emoji: string; color: string; knows: string; says: string; who: string }> = {
  browser: { label: "Browser", emoji: "🌐", color: "#4a78d6", who: "Your browser's own cache. Only that browser can use it.", knows: "Sites you visited recently (until the TTL runs out).", says: "Hit: use the IP. Miss: ask the OS." },
  os: { label: "Operating system", emoji: "💻", color: "#8a62c9", who: "The OS cache, shared by every app on the computer (browser, Slack, etc.). The hosts file is also checked here.", knows: "Answers any app on this computer looked up recently.", says: "Hit: use the IP. Miss: ask the DNS server." },
  resolver: { label: "Recursive resolver", emoji: "🧑‍💼", color: "#e88a3c", who: "The DNS server your computer was told to use (usually your ISP's, or one like 8.8.8.8 / 1.1.1.1). It does all the hard work for you.", knows: "A big shared cache, plus the addresses of the 13 root server groups.", says: "'Let me find that out and come back to you.'" },
  root: { label: "Root server", emoji: "🌳", color: "#d4a72c", who: "Top of the hierarchy (the dot at the end of a name). 13 named root server groups (A to M), run on hundreds of servers worldwide.", knows: "Which servers handle each top-level domain (.com, .org, .in ...). NOT website IPs.", says: "'I don't know google.com, but ask the .com servers. Here are their addresses.'" },
  tld: { label: "TLD server (.com)", emoji: "🏢", color: "#2f9fb5", who: "Handles one top-level domain such as .com, .org or .net.", knows: "Which name servers each domain under it registered (e.g. google.com).", says: "'I don't know the IP, but ask ns1.google.com. Here is its address.'" },
  auth: { label: "Authoritative server", emoji: "📖", color: "#4fa36b", who: "Holds the official DNS records for a domain (here, google.com). The final source of truth.", knows: "The real IP address of google.com and its other records.", says: "'google.com is 142.250.x.x' (the final answer)." },
};

type Scenario = "none" | "browser" | "os" | "resolver";

type Step = { node: NodeId; kind: "miss" | "hit" | "ask" | "refer" | "answer" | "return" | "connect"; title: string; text: string; tag: string };

function buildSteps(sc: Scenario): Step[] {
  const s: Step[] = [];
  const hit = (node: NodeId, t: string): Step => ({ node, kind: "hit", title: `${NODES[node].label} cache: HIT`, text: t, tag: "Cache hit" });
  s.push(sc === "browser" ? hit("browser", "Browser already knows the IP from a recent visit. Lookup over, no network needed.") : { node: "browser", kind: "miss", title: "Browser cache: miss", text: "No saved IP for google.com (or it expired). Ask the operating system.", tag: "Cache miss" });
  if (sc !== "browser") {
    s.push(sc === "os" ? hit("os", "The OS cache has it, maybe from another app. It hands the IP to the browser.") : { node: "os", kind: "miss", title: "OS cache: miss", text: "The OS doesn't have it either. Send a request to the DNS server it was configured with.", tag: "Cache miss" });
  }
  if (sc === "none" || sc === "resolver") {
    s.push({ node: "resolver", kind: "ask", title: "Ask the recursive resolver", text: "Your computer sends ONE query (usually UDP port 53) and then waits. It learned this server's address from DHCP when joining the network.", tag: "Query" });
    if (sc === "resolver") s.push(hit("resolver", "The resolver already has google.com cached from someone's earlier lookup. It answers straight away."));
    else {
      s.push({ node: "root", kind: "refer", title: "Resolver asks a root server", text: "Root: 'I don't know google.com, but the .com servers do. Here are their addresses.' This is a referral, not an answer.", tag: "Referral" });
      s.push({ node: "tld", kind: "refer", title: "Resolver asks the .com server", text: "TLD: 'I don't know the IP either, but google.com's name server is ns1.google.com. Here is its address.'", tag: "Referral" });
      s.push({ node: "auth", kind: "answer", title: "Resolver asks Google's name server", text: "Authoritative server holds the official records and replies with the IP address of google.com.", tag: "Answer" });
    }
    s.push({ node: "resolver", kind: "return", title: "Resolver replies to your computer", text: "The resolver caches the answer (for its TTL) and sends the IP back. Your OS and browser cache it too.", tag: "Reply" });
  } else if (sc === "os") {
    s.push({ node: "browser", kind: "return", title: "OS passes the IP to the browser", text: "The browser caches it too.", tag: "Reply" });
  }
  s.push({ node: "browser", kind: "connect", title: "Now the browser has the IP", text: "Only now can it start the TCP handshake with Google's server (then TLS, then HTTP). DNS just answers 'where?'", tag: "Done" });
  return s;
}

const KIND_COLOR: Record<Step["kind"], string> = { miss: "#94a3b8", hit: "#4fa36b", ask: "#e88a3c", refer: "#d4a72c", answer: "#4fa36b", return: "#4a78d6", connect: "#8a62c9" };

function NodeCard({ id, active, visited }: { id: NodeId; active: boolean; visited: boolean }) {
  const n = NODES[id];
  return (
    <div className="relative rounded-xl border-2 p-2 text-center transition-all" style={{ borderColor: active ? n.color : "#94a3b844", background: active ? `${n.color}26` : visited ? `${n.color}10` : undefined, transform: active ? "scale(1.05)" : "none", opacity: visited || active ? 1 : 0.55 }}>
      {active && <span className="dns-ring absolute inset-0 rounded-xl" style={{ border: `2px solid ${n.color}` }} />}
      <div className="text-2xl">{n.emoji}</div>
      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{n.label}</div>
    </div>
  );
}

function Lookup() {
  const [sc, setSc] = useState<Scenario>("none");
  const steps = useMemo(() => buildSteps(sc), [sc]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { setI(0); setPlaying(false); }, [sc]);
  useEffect(() => {
    if (!playing) return;
    if (i >= steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 2800);
    return () => clearTimeout(t);
  }, [playing, i, steps.length]);

  const cur = steps[i];
  const visitedNodes = new Set(steps.slice(0, i + 1).map((s) => s.node));
  const order: NodeId[] = ["browser", "os", "resolver", "root", "tld", "auth"];
  const scs: { id: Scenario; label: string }[] = [
    { id: "none", label: "First ever lookup" },
    { id: "resolver", label: "Resolver has it" },
    { id: "os", label: "OS has it" },
    { id: "browser", label: "Browser has it" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">What happens when you type google.com</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">DNS is not one giant server that knows everything. It is a chain of helpers, and each knows a small piece. Pick where the answer is already saved, then press play.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {scs.map((x) => (
          <button key={x.id} onClick={() => setSc(x.id)} className={`rounded-full px-3 py-1 text-sm font-semibold ${sc === x.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>{x.label}</button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {order.map((id) => <NodeCard key={id} id={id} active={cur.node === id} visited={visitedNodes.has(id)} />)}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-3 text-center text-[11px] text-slate-500">
        <span>Your computer</span><span className="col-span-2">DNS servers (hierarchy, top to bottom: root, TLD, authoritative)</span>
      </div>

      <div key={i} className="dns-fade mt-4 rounded-xl p-3" style={{ background: `${KIND_COLOR[cur.kind]}1c`, borderLeft: `4px solid ${KIND_COLOR[cur.kind]}` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-bold text-slate-900 dark:text-white">{cur.title}</div>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: KIND_COLOR[cur.kind] }}>{cur.tag}</span>
        </div>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{cur.text}</p>
      </div>

      <ol className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
        {steps.slice(0, i + 1).map((s, k) => (
          <li key={k} className="flex items-center gap-2"><span style={{ color: KIND_COLOR[s.kind] }}>●</span>{s.title}</li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => { if (i >= steps.length - 1) setI(0); setPlaying((p) => !p); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">{playing ? "Pause" : i >= steps.length - 1 ? "Replay" : "Play"}</button>
        <button onClick={() => { setPlaying(false); setI((x) => Math.max(0, x - 1)); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-200">Back</button>
        <button onClick={() => { setPlaying(false); setI((x) => Math.min(steps.length - 1, x + 1)); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-200">Next</button>
        <button onClick={() => { setPlaying(false); setI(0); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-200">Reset</button>
        <span className="ml-auto text-xs text-slate-500">Step {i + 1} of {steps.length}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Your computer asks once and waits. The resolver does all the legwork, which is why it is called a <b>recursive</b> resolver. Notice the root and TLD servers never give the IP: they only point to the next server.
      </p>
    </section>
  );
}

function WhosWho() {
  const [sel, setSel] = useState<NodeId>("resolver");
  const n = NODES[sel];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Who is who</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(Object.keys(NODES) as NodeId[]).map((id) => (
          <button key={id} onClick={() => setSel(id)} className="rounded-lg border-2 px-1 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100" style={{ borderColor: sel === id ? NODES[id].color : "#94a3b844", background: sel === id ? `${NODES[id].color}22` : undefined }}>
            <div className="text-xl">{NODES[id].emoji}</div>{NODES[id].label}
          </button>
        ))}
      </div>
      <div key={sel} className="dns-fade mt-3 space-y-1.5 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200" style={{ background: `${n.color}18`, borderLeft: `4px solid ${n.color}` }}>
        <p><b>What it is:</b> {n.who}</p>
        <p><b>What it knows:</b> {n.knows}</p>
        <p><b>What it says:</b> {n.says}</p>
      </div>
    </section>
  );
}

const PARTS = [
  { t: ".", name: "Root", note: "The invisible dot at the very end. Root servers sit here.", c: "#d4a72c" },
  { t: "com", name: "Top-level domain (TLD)", note: "Handled by the TLD servers. Others: org, net, in, edu.", c: "#2f9fb5" },
  { t: "google", name: "Domain (second-level)", note: "Registered by the owner. Their authoritative servers hold the records.", c: "#4fa36b" },
  { t: "www", name: "Host / subdomain", note: "A specific machine or service inside the domain.", c: "#e0556b" },
];

function ReadDomain() {
  const [k, setK] = useState(3);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Read a domain name right to left</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The resolver follows the name from the right. Tap each part.</p>
      <div className="mt-3 flex items-end justify-center font-mono text-2xl font-bold sm:text-3xl">
        {[3, 2, 1, 0].map((idx, pos) => (
          <React.Fragment key={idx}>
            <button onClick={() => setK(idx)} className="rounded-md px-1.5 py-1 transition-all" style={{ background: k === idx ? PARTS[idx].c : "transparent", color: k === idx ? "#fff" : PARTS[idx].c }}>{PARTS[idx].t === "." ? "" : PARTS[idx].t}</button>
            {pos < 3 && <span className="text-slate-400">.</span>}
          </React.Fragment>
        ))}
        <button onClick={() => setK(0)} className="rounded-md px-1.5 py-1 text-slate-400" style={{ background: k === 0 ? PARTS[0].c : "transparent", color: k === 0 ? "#fff" : undefined }}>.</button>
      </div>
      <div key={k} className="dns-fade mt-3 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200" style={{ background: `${PARTS[k].c}1c`, borderLeft: `4px solid ${PARTS[k].c}` }}>
        <b style={{ color: PARTS[k].c }}>{PARTS[k].name}</b>
        <p>{PARTS[k].note}</p>
      </div>
      <p className="mt-2 text-xs text-slate-500">Order of asking: root (.) then com then google, which is exactly the root, TLD, authoritative chain.</p>
    </section>
  );
}

const RECORDS = [
  { r: "A", d: "Name to IPv4 address", e: "google.com  A  142.250.x.x" },
  { r: "AAAA", d: "Name to IPv6 address", e: "google.com  AAAA  2404:6800:..." },
  { r: "CNAME", d: "Alias: one name points to another name", e: "www.site.com  CNAME  site.com" },
  { r: "MX", d: "Mail server for the domain", e: "gmail.com  MX  10 smtp.gmail.com" },
  { r: "NS", d: "Which name servers are authoritative", e: "google.com  NS  ns1.google.com" },
  { r: "PTR", d: "Reverse lookup: IP to name", e: "8.8.8.8  PTR  dns.google" },
  { r: "TXT", d: "Free text, often email/domain verification", e: "example.com  TXT  \"v=spf1 ...\"" },
];

function Records() {
  const [r, setR] = useState("A");
  const cur = RECORDS.find((x) => x.r === r)!;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Common record types</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {RECORDS.map((x) => (
          <button key={x.r} onClick={() => setR(x.r)} className={`rounded-lg px-3 py-1.5 font-mono text-sm font-bold ${r === x.r ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>{x.r}</button>
        ))}
      </div>
      <div key={r} className="dns-fade mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
        <p className="text-slate-800 dark:text-slate-100"><b>{cur.r}</b>: {cur.d}</p>
        <code className="mt-1 block text-xs text-indigo-600 dark:text-indigo-300">{cur.e}</code>
      </div>
    </section>
  );
}

const FACTS = [
  { q: "Why isn't the internet slow with 4-5 servers per lookup?", a: "Caching. Answers are saved in the browser, OS and resolver, and the resolver almost never needs the root. Each saved answer lives only for its TTL (time to live) set by the domain owner, then it expires and is fetched fresh." },
  { q: "How does my laptop know the resolver's address?", a: "From DHCP when you join the network. The router/ISP hands out your IP address, gateway and DNS server. You can also set your own (8.8.8.8, 1.1.1.1)." },
  { q: "Which port and protocol?", a: "UDP port 53 for normal queries. TCP port 53 is used when the response is too large and for zone transfers between DNS servers. DNS over HTTPS/TLS exist for privacy." },
  { q: "Recursive vs iterative?", a: "Your computer sends a recursive query ('get me the final answer'). The resolver then sends iterative queries to root, TLD and authoritative servers, each of which just answers or points onward." },
];

function Facts() {
  const [open, setOpen] = useState(0);
  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950">
      <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">Remember this</h2>
      <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">
        <b>Order:</b> Browser, OS, Resolver, Root, TLD, Authoritative. Memory hook: the resolver is your <b>personal assistant</b>. You ask once, it phones the receptionist (root), then the building (.com), then the person (authoritative).
      </p>
      <div className="mt-3 space-y-2">
        {FACTS.map((f, k) => (
          <div key={k} className="rounded-lg bg-white/70 dark:bg-slate-900/60">
            <button onClick={() => setOpen(open === k ? -1 : k)} className="flex w-full justify-between px-3 py-2 text-left text-sm font-semibold text-slate-900 dark:text-white">{f.q}<span>{open === k ? "−" : "+"}</span></button>
            {open === k && <p className="dns-fade px-3 pb-3 text-sm text-slate-700 dark:text-slate-200">{f.a}</p>}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
        <b>Try it yourself:</b> <code>nslookup google.com</code> (Windows/Linux/macOS). On a Cisco router: <code>ip name-server 8.8.8.8</code> sets the DNS server and <code>ip domain-lookup</code> enables name lookups.
      </div>
    </section>
  );
}

export  function DnsResolution() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4">
      <style>{`
        @keyframes dnsRing{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.25);opacity:0}}
        @keyframes dnsFade{0%{opacity:0;transform:translateY(-4px)}100%{opacity:1;transform:none}}
        .dns-ring{animation:dnsRing 1.4s ease-out infinite}
        .dns-fade{animation:dnsFade .3s ease-out}
        @media (prefers-reduced-motion: reduce){.dns-ring,.dns-fade{animation:none}}
      `}</style>
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">DNS: Domain Name System</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">DNS turns names people remember (google.com) into IP addresses computers use. Think of it as the internet's phone book, split across many servers.</p>
      </header>
      <Lookup />
      <WhosWho />
      <ReadDomain />
      <Records />
      <Facts />
    </div>
  );
}