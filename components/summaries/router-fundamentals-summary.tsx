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
 * RouterCliExplainer  (CCNA Topic 07)
 *   1 Memory          : ROM, RAM, NVRAM, Flash. Change, save and reload to see what survives
 *   2 Boot process    : animated boot, with four scenarios (normal, POST fail, no IOS, no config)
 *   3 CLI practice    : a live router terminal that moves through the modes
 *   4 Interfaces, lines, SSH : name builder, Telnet vs SSH sniffer, SSH setup
 *   5 Verify and shortcuts   : read show ip interface brief, line-editing shortcuts demo
 *   6 Common mistakes : wrong belief on the front, the truth on the back
 *   7 Interview prep  : 30-second answer and the usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";

const TABS = [
  { id: "mem", label: "1 · Memory" },
  { id: "boot", label: "2 · Boot process" },
  { id: "cli", label: "3 · CLI practice" },
  { id: "lines", label: "4 · Interfaces, lines, SSH" },
  { id: "verify", label: "5 · Verify and shortcuts" },
  { id: "myths", label: "6 · Common mistakes" },
  { id: "interview", label: "7 · Interview prep" },
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
      <p className="break-words text-xs font-medium" style={color ? { color } : undefined}>{v}</p>
    </div>
  );
}

/* ───────────────────────── 1 · memory ───────────────────────── */

const CHANGES = ["hostname R1", "interface f0/0", " ip address 192.168.1.1 255.255.255.0", " no shutdown"];

function MemBox({ title, sub, keep, color, children, anim }: { title: string; sub: string; keep: boolean; color: string; children: React.ReactNode; anim?: string }) {
  return (
    <div className={`rounded-xl border p-3 ${anim ?? ""}`} style={{ borderColor: color }}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="text-sm font-bold" style={{ color }}>{title}</p>
        <Badge variant="secondary" style={{ color: keep ? GREEN : RED }}>{keep ? "survives reload" : "wiped on reload"}</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
      <div className="mt-2 min-h-[5.5rem] rounded-md bg-muted/40 p-2 font-mono text-[11px] leading-5">{children}</div>
    </div>
  );
}

function MemSection() {
  const [running, setRunning] = useState<string[]>(["hostname Router"]);
  const [startup, setStartup] = useState<string[]>(["hostname Router"]);
  const [reloading, setReloading] = useState(false);
  const [saveN, setSaveN] = useState(0);
  const [msg, setMsg] = useState("Make a change, then try reloading without saving.");

  const next = CHANGES.find((c) => !running.includes(c));
  const unsaved = running.filter((l, i) => startup[i] !== l).length;

  const change = () => {
    if (!next) return;
    setRunning((r) => (next === "hostname R1" ? [next] : [...r, next]));
    setMsg(`Typed "${next.trim()}". It took effect at once, but only in RAM.`);
  };
  const save = () => {
    setStartup(running);
    setSaveN((n) => n + 1);
    setMsg("copy running-config startup-config: RAM copied into NVRAM. The change is now saved.");
  };
  const reload = () => {
    const lost = unsaved;
    setReloading(true);
    setMsg("Reloading... power to RAM is gone.");
    setTimeout(() => {
      setRunning(startup);
      setReloading(false);
      setMsg(
        lost > 0
          ? `Back up. ${lost} unsaved line${lost > 1 ? "s were" : " was"} lost, because the router loaded the old startup-config from NVRAM.`
          : "Back up. Nothing was lost, because running-config and startup-config matched."
      );
    }, 1600);
  };
  const reset = () => { setRunning(["hostname Router"]); setStartup(["hostname Router"]); setMsg("Reset. Make a change, then try reloading without saving."); };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">A router is a purpose-built computer</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          It has the same basic parts as a PC (memory, an operating system, interfaces), tuned for one job: forwarding packets between networks.
          To use one, you talk to it through the CLI, which has its own language, modes and shortcuts.
        </p>
        <div className="mt-3"><Tip>Save to NVRAM or your config dies with the power.</Tip></div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Try it: change, save, reload</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={!next || reloading} onClick={change}>Change the config</Button>
          <Button size="sm" variant="outline" disabled={reloading || unsaved === 0} onClick={save}>copy run start</Button>
          <Button size="sm" variant="outline" disabled={reloading} onClick={reload}>Reload the router</Button>
          <Button size="sm" variant="outline" disabled={reloading} onClick={reset}>Reset</Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MemBox title="ROM" sub="Bootstrap (ROM Monitor / ROMMON)" keep color={PURPLE}>
            <p>bootstrap program</p>
            <p>POST (self test)</p>
            <p>ROMMON recovery mode</p>
          </MemBox>
          <MemBox title="Flash" sub="Cisco IOS image" keep color={BLUE}>
            <p>c2900-universalk9.bin</p>
            <p className="text-muted-foreground">(copied into RAM to run)</p>
          </MemBox>
          <MemBox title="RAM" sub="Running-config and the running IOS" keep={false} color={RED} anim={reloading ? "n7-blink" : ""}>
            {reloading ? (
              <p className="text-muted-foreground">(empty, power lost)</p>
            ) : (
              <div key={running.join("|")} className="n7-fade">
                <p style={{ color: BLUE }}>IOS running</p>
                <p className="text-muted-foreground">running-config:</p>
                {running.map((l, i) => (
                  <p key={i} className="whitespace-pre" style={{ color: startup[i] === l ? undefined : AMBER }}>{l}</p>
                ))}
              </div>
            )}
          </MemBox>
          <MemBox title="NVRAM" sub="Startup-config" keep color={GREEN} anim={saveN ? "" : ""}>
            <div key={`${saveN}-${startup.join("|")}`} className="n7-fade">
              <p className="text-muted-foreground">startup-config:</p>
              {startup.map((l, i) => (
                <p key={i} className="whitespace-pre">{l}</p>
              ))}
            </div>
          </MemBox>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {unsaved > 0 && !reloading && <Badge variant="secondary" style={{ color: AMBER }}>{unsaved} unsaved line{unsaved > 1 ? "s" : ""} (orange)</Badge>}
          {unsaved === 0 && !reloading && <Badge variant="secondary" style={{ color: GREEN }}>running = startup</Badge>}
        </div>
        <p key={msg} className="n7-fade mt-2 text-xs leading-5 text-muted-foreground">{msg}</p>
      </Panel>

      <SimpleTable
        head={["Memory", "Contents", "Role", "Survives reload?"]}
        rows={[
          ["ROM", "Bootstrap (ROMMON)", "Loads first, runs POST, finds and loads the IOS", "Yes"],
          ["RAM", "Running-config, running IOS, routing table, ARP cache, buffers", "Working memory", "No"],
          ["NVRAM", "Startup-config", "Persistent config. Loaded into RAM on boot", "Yes"],
          ["Flash", "Cisco IOS image", "Stores the OS. Copied to RAM to run", "Yes"],
        ]}
      />
      <Tip title="Careful">
        The IOS lives in Flash, not NVRAM. When the router runs, a copy of it sits in RAM too.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 2 · boot process ───────────────────────── */

type BStep = { t: string; d: string; mem: string; s: "ok" | "fail" | "warn" };
type Scn = { name: string; steps: BStep[]; end: string; endColor: string };

const POWER: BStep = { t: "Power on", d: "The device is switched on.", mem: "", s: "ok" };
const BOOTSTRAP: BStep = { t: "Bootstrap loads", d: "The bootstrap (ROM Monitor) loads from ROM.", mem: "ROM", s: "ok" };
const POST_OK: BStep = { t: "POST runs", d: "Power On Self Test checks the hardware: CPU, memory, interfaces. It passes.", mem: "ROM", s: "ok" };
const IOS_OK: BStep = { t: "IOS loads", d: "The bootstrap loads the Cisco IOS from Flash into RAM.", mem: "Flash → RAM", s: "ok" };

const SCNS: Record<string, Scn> = {
  normal: {
    name: "Normal boot",
    steps: [
      POWER, BOOTSTRAP, POST_OK, IOS_OK,
      { t: "Startup-config loads", d: "The IOS finds the startup-config in NVRAM and loads it into RAM as the running-config.", mem: "NVRAM → RAM", s: "ok" },
      { t: "Router ready", d: "The router is up and forwarding with its saved configuration.", mem: "RAM", s: "ok" },
    ],
    end: "Router ready.", endColor: GREEN,
  },
  post: {
    name: "POST fails",
    steps: [
      POWER, BOOTSTRAP,
      { t: "POST fails", d: "A hardware fault is found. The boot cannot continue.", mem: "ROM", s: "fail" },
    ],
    end: "Stuck in ROMmon mode. The router never finishes booting and cannot forward traffic.", endColor: RED,
  },
  noios: {
    name: "IOS missing or corrupt",
    steps: [
      POWER, BOOTSTRAP, POST_OK,
      { t: "IOS not found", d: "Flash has no valid IOS image. The router may also try a TFTP server for an image, and that fails too.", mem: "Flash", s: "fail" },
    ],
    end: "Stuck in ROMmon mode. Recover by loading an IOS image over TFTP or from USB.", endColor: RED,
  },
  noconfig: {
    name: "No startup-config",
    steps: [
      POWER, BOOTSTRAP, POST_OK, IOS_OK,
      { t: "NVRAM is empty", d: "There is no startup-config to load.", mem: "NVRAM", s: "warn" },
      { t: "TFTP request", d: "Older IOS versions broadcast a TFTP request to 255.255.255.255 looking for a config.", mem: "network", s: "warn" },
      { t: "No reply", d: "Nothing answers, so the router enters the initial configuration dialog (setup mode) with no config.", mem: "RAM", s: "warn" },
    ],
    end: "Setup mode. The IOS works, but it has no configuration.", endColor: AMBER,
  },
};

function BootSection() {
  const [id, setId] = useState("normal");
  const [n, setN] = useState(0);
  const [play, setPlay] = useState(false);
  const sc = SCNS[id];
  const total = sc.steps.length;

  useEffect(() => {
    if (!play) return;
    if (n >= total) { setPlay(false); return; }
    const t = setTimeout(() => setN((v) => v + 1), 1000);
    return () => clearTimeout(t);
  }, [play, n, total]);

  const pick = (k: string) => { setId(k); setN(0); setPlay(false); };
  const col = (s: BStep["s"]) => (s === "ok" ? GREEN : s === "fail" ? RED : AMBER);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Pick a scenario, then press Play</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(SCNS).map(([k, v]) => (
            <Pick key={k} active={id === k} onClick={() => pick(k)}>{v.name}</Pick>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { if (n >= total) { setN(0); setTimeout(() => { setN(1); setPlay(true); }, 50); } else { if (n === 0) setN(1); setPlay(true); } }}>
            {n >= total ? "Replay" : n === 0 ? "Play" : "Resume"}
          </Button>
          <Button size="sm" variant="outline" disabled={n >= total} onClick={() => { setPlay(false); setN((v) => Math.min(total, v + 1)); }}>Next step</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlay(false); setN(0); }}>Reset</Button>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col">
          {sc.steps.map((s, k) => {
            const shown = k < n;
            const cur = k === n - 1;
            const c = col(s.s);
            return (
              <div key={`${id}-${k}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500 ${cur ? "n7-pulse" : ""}`}
                    style={{ borderColor: shown ? c : undefined, background: shown ? c : undefined, color: shown ? "#fff" : undefined, opacity: shown ? 1 : 0.35 }}
                  >
                    {shown ? (s.s === "ok" ? "✓" : s.s === "fail" ? "✕" : "!") : k + 1}
                  </span>
                  {k < total - 1 && (
                    <span className="w-0.5 flex-1 transition-all duration-700" style={{ minHeight: 18, background: k < n - 1 ? c : undefined, opacity: k < n - 1 ? 1 : 0.2 }} />
                  )}
                </div>
                <div className="pb-4" style={{ opacity: shown ? 1 : 0.3, transition: "opacity .5s" }}>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {s.t}
                    {s.mem && shown && <Badge variant="secondary" className="n7-pop">{s.mem}</Badge>}
                  </p>
                  {shown && <p className="n7-fade text-xs leading-5 text-muted-foreground">{s.d}</p>}
                </div>
              </div>
            );
          })}
        </div>
        {n >= total && (
          <p className="n7-pop mt-1 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: sc.endColor, color: sc.endColor, background: `${sc.endColor}10` }}>
            {sc.end}
          </p>
        )}
      </Panel>

      <Tip title="Boot order">Bootstrap in ROM, then POST, then IOS from Flash into RAM, then startup-config from NVRAM into RAM.</Tip>
      <Tip title="Extra">
        The config register (0x2102 is the usual value) controls where the router looks for the IOS and whether it loads the startup-config. Password recovery uses 0x2142 to skip the startup-config.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 3 · CLI practice ───────────────────────── */

type Mode = "user" | "priv" | "global" | "if" | "line";
type Line = { t: string; k: "cmd" | "out" | "err" };
type Sim = { mode: Mode; host: string; ip: string | null; up: boolean; dirty: boolean; log: Line[] };

const MODES: { id: Mode; name: string; sign: string; hint: string }[] = [
  { id: "user", name: "User EXEC", sign: ">", hint: "Look only. Try: enable" },
  { id: "priv", name: "Privilege EXEC", sign: "#", hint: "Try: show ip interface brief, then configure terminal" },
  { id: "global", name: "Global config", sign: "(config)#", hint: "Try: hostname R1, then interface f0/0" },
  { id: "if", name: "Interface sub-mode", sign: "(config-if)#", hint: "Try: ip address ..., then no shutdown" },
  { id: "line", name: "Line sub-mode", sign: "(config-line)#", hint: "Lines manage the router. Try: exit" },
];

const INVALID = "% Invalid input detected at '^' marker.";
const CMDS = [
  "enable", "configure terminal", "hostname R1", "interface f0/0", "ip address 192.168.1.1 255.255.255.0",
  "no shutdown", "shutdown", "line console 0", "show ip interface brief", "show running-config",
  "do show ip interface brief", "copy run start", "exit", "end", "disable",
];

const prompt = (m: Mode, h: string) => `${h}${m === "user" ? ">" : m === "priv" ? "#" : m === "global" ? "(config)#" : m === "if" ? "(config-if)#" : "(config-line)#"}`;
const pad = (s: string, n: number) => s.padEnd(n, " ");

function brief(s: Sim) {
  return [
    `${pad("Interface", 18)}${pad("IP-Address", 15)}${pad("OK?", 5)}${pad("Method", 8)}${pad("Status", 23)}Protocol`,
    `${pad("FastEthernet0/0", 18)}${pad(s.ip ?? "unassigned", 15)}${pad("YES", 5)}${pad(s.ip ? "manual" : "unset", 8)}${pad(s.up ? "up" : "administratively down", 23)}${s.up ? "up" : "down"}`,
  ];
}

function runCmd(s: Sim, cmd: string): Sim {
  const log: Line[] = [...s.log, { t: `${prompt(s.mode, s.host)} ${cmd}`, k: "cmd" }];
  const out = (lines: string[]): Sim => ({ ...s, log: [...log, ...lines.map((t) => ({ t, k: "out" as const }))] });
  const err = (): Sim => ({ ...s, log: [...log, { t: INVALID, k: "err" }] });
  const to = (mode: Mode, extra: Partial<Sim> = {}): Sim => ({ ...s, ...extra, mode, log });
  const cfg = s.mode === "global" || s.mode === "if" || s.mode === "line";

  if (cmd === "enable") return s.mode === "user" ? to("priv") : s.mode === "priv" ? to("priv") : err();
  if (cmd === "disable") return s.mode === "priv" ? to("user") : err();
  if (cmd === "configure terminal") {
    return s.mode === "priv"
      ? { ...to("global"), log: [...log, { t: "Enter configuration commands, one per line.  End with CNTL/Z.", k: "out" }] }
      : err();
  }
  if (cmd === "hostname R1") return cfg ? to(s.mode, { host: "R1", dirty: true }) : err();
  if (cmd === "interface f0/0") return cfg ? to("if") : err();
  if (cmd === "line console 0") return cfg ? to("line") : err();
  if (cmd === "ip address 192.168.1.1 255.255.255.0") return s.mode === "if" ? to("if", { ip: "192.168.1.1", dirty: true }) : err();
  if (cmd === "no shutdown") return s.mode === "if" ? { ...to("if", { up: true, dirty: true }), log: [...log, { t: "%LINK-5-CHANGED: Interface FastEthernet0/0, changed state to up", k: "out" }] } : err();
  if (cmd === "shutdown") return s.mode === "if" ? to("if", { up: false, dirty: true }) : err();
  if (cmd === "show ip interface brief") return s.mode === "user" || s.mode === "priv" ? out(brief(s)) : err();
  if (cmd === "do show ip interface brief") return cfg ? out(brief(s)) : err();
  if (cmd === "show running-config") {
    if (s.mode !== "priv") return err();
    return out([
      `hostname ${s.host}`, "!", "interface FastEthernet0/0",
      s.ip ? ` ip address ${s.ip} 255.255.255.0` : " no ip address",
      ...(s.up ? [] : [" shutdown"]), "!", "end",
    ]);
  }
  if (cmd === "copy run start") {
    return s.mode === "priv"
      ? { ...s, dirty: false, log: [...log, { t: "Destination filename [startup-config]?", k: "out" }, { t: "Building configuration...", k: "out" }, { t: "[OK]", k: "out" }] }
      : err();
  }
  if (cmd === "exit") {
    if (s.mode === "user") return out(["(a real router would log you out here)"]);
    if (s.mode === "priv") return to("user");
    if (s.mode === "global") return to("priv");
    return to("global");
  }
  if (cmd === "end") return cfg ? to("priv") : err();
  return err();
}

const INIT_SIM: Sim = { mode: "user", host: "Router", ip: null, up: false, dirty: false, log: [] };

function CliSection() {
  const [s, setS] = useState<Sim>(INIT_SIM);
  const mi = MODES.findIndex((m) => m.id === s.mode);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">A live router terminal</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tap commands to run them. Try one in the wrong mode and read the error. The prompt always tells you where you are.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_190px]">
          <div className="min-w-0">
            <div className="h-64 overflow-y-auto rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300">
              {s.log.length === 0 && <p className="text-green-300/60">Press a command below to begin.</p>}
              {s.log.slice(-40).map((l, i) => (
                <pre
                  key={`${s.log.length}-${i}`}
                  className="n7-fade m-0 whitespace-pre-wrap break-words font-mono"
                  style={{ color: l.k === "err" ? "#ff8787" : l.k === "cmd" ? "#d3f9d8" : "#8ce99a" }}
                >
                  {l.t}
                </pre>
              ))}
              <p key={prompt(s.mode, s.host)} className="n7-pop mt-1 text-white">
                {prompt(s.mode, s.host)} <span className="n7-cursor">▌</span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {CMDS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setS((v) => runCmd(v, c))}
                  className="rounded-md border bg-background px-2 py-1 font-mono text-[11px] transition-colors hover:border-primary/60 hover:bg-primary/5"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setS(INIT_SIM)}>Reset router</Button>
              {s.dirty ? <Badge variant="secondary" style={{ color: AMBER }}>unsaved changes</Badge> : <Badge variant="secondary" style={{ color: GREEN }}>nothing unsaved</Badge>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold">You are here</p>
            {MODES.map((m, k) => {
              const on = k === mi;
              return (
                <div
                  key={m.id}
                  className="rounded-lg border px-2 py-1.5 text-[11px] transition-all duration-500"
                  style={{ borderColor: on ? BLUE : undefined, background: on ? `${BLUE}18` : undefined, marginLeft: k >= 2 ? (k - 1) * 8 : 0, opacity: on ? 1 : 0.55, fontWeight: on ? 700 : 500 }}
                >
                  <p>{m.name}</p>
                  <p className="font-mono text-muted-foreground">Router{m.sign}</p>
                </div>
              );
            })}
            <p key={s.mode} className="n7-fade mt-1 text-[11px] leading-4 text-muted-foreground">{MODES[mi].hint}</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The four modes</p>
        <div className="mt-3">
          <SimpleTable
            head={["Mode", "Prompt", "Can do", "How to enter"]}
            rows={[
              ["User EXEC", "Router>", "A few limited show commands. No configuration", "Default after console or SSH login"],
              ["Privilege EXEC", "Router#", "All show commands, ping, traceroute, copy, reload, debug. No configuration yet", "enable"],
              ["Global config", "Router(config)#", "Device-wide settings (hostname, banner). Entry point to sub-modes", "configure terminal"],
              ["Sub-modes", "Router(config-if)#, (config-line)#, (config-router)#", "Interface: ip address, no shutdown. Line: password, login. Routing: network, router-id", "From global config, enter the object"],
            ]}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Exit vs end">exit goes up one level. end (or Ctrl+Z) jumps straight back to Privilege EXEC from any configuration mode.</Tip>
          <Tip title="Handy">
            In configuration modes you cannot run show directly. Put do in front: do show ip interface brief.
          </Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 4 · interfaces, lines, SSH ───────────────────────── */

const ITYPES = [
  { id: "f", long: "FastEthernet", note: "100 Mbps" },
  { id: "g", long: "GigabitEthernet", note: "1 Gbps" },
  { id: "s", long: "Serial", note: "WAN link" },
];

const SSH_STEPS = [
  ["hostname R1", "The device needs a hostname before it can make keys."],
  ["ip domain-name lab.local", "The domain name is also needed to generate keys."],
  ["crypto key generate rsa modulus 2048", "Creates the RSA key pair that SSH uses."],
  ["username admin secret StrongPass1", "A local user to log in with."],
  ["ip ssh version 2", "Use the safer SSH version 2."],
  ["line vty 0 4", "Enter the virtual lines (5 simultaneous remote sessions)."],
  [" login local", "Check the local username database at login."],
  [" transport input ssh", "Allow SSH only, so Telnet is refused."],
];

function LinesSection() {
  const [view, setView] = useState<"if" | "ln">("if");
  const [ty, setTy] = useState(1);
  const [three, setThree] = useState(true);
  const [slot, setSlot] = useState(0);
  const [sub, setSub] = useState(0);
  const [port, setPort] = useState(0);
  const [proto, setProto] = useState<"telnet" | "ssh">("telnet");
  const [sendN, setSendN] = useState(1);
  const t = ITYPES[ty];
  const nums = three ? `${slot}/${sub}/${port}` : `${slot}/${port}`;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Interfaces vs lines</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={view === "if"} onClick={() => setView("if")}>Interfaces</Pick>
          <Pick active={view === "ln"} onClick={() => setView("ln")}>Lines</Pick>
        </div>
        <div key={view} className="n7-fade mt-3 grid gap-2 sm:grid-cols-3">
          {view === "if" ? (
            <>
              <Mini k="Purpose" v="Forward and receive data traffic" color={BLUE} />
              <Mini k="Examples" v="Serial 0/0/0, FastEthernet 0/0, GigabitEthernet 0/0/0" />
              <Mini k="Command" v="interface g0/0/0" />
            </>
          ) : (
            <>
              <Mini k="Purpose" v="Access and manage the device itself (management traffic)" color={GREEN} />
              <Mini k="Examples" v="Console (physical cable), VTY (virtual, Telnet or SSH over the network)" />
              <Mini k="Command" v="line console 0  or  line vty 0 4" />
            </>
          )}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Build an interface name</p>
        <p className="mt-1 text-xs text-muted-foreground">Format: type + slot/port, or on modular routers type + slot/subslot/port. Numbering starts at 0.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ITYPES.map((x, i) => <Pick key={x.id} active={ty === i} onClick={() => setTy(i)}>{x.long}</Pick>)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pick active={!three} onClick={() => setThree(false)}>slot/port</Pick>
          <Pick active={three} onClick={() => setThree(true)}>slot/subslot/port</Pick>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5"><span className="font-semibold" style={{ color: GREEN }}>slot</span>{[0, 1, 2].map((n) => <Pick key={n} active={slot === n} onClick={() => setSlot(n)}>{n}</Pick>)}</div>
          {three && <div className="flex items-center gap-1.5"><span className="font-semibold" style={{ color: PURPLE }}>subslot</span>{[0, 1, 2].map((n) => <Pick key={n} active={sub === n} onClick={() => setSub(n)}>{n}</Pick>)}</div>}
          <div className="flex items-center gap-1.5"><span className="font-semibold" style={{ color: AMBER }}>port</span>{[0, 1, 2, 3].map((n) => <Pick key={n} active={port === n} onClick={() => setPort(n)}>{n}</Pick>)}</div>
        </div>
        <div key={`${ty}-${nums}`} className="n7-pop mt-4 rounded-lg border bg-muted/30 p-3 font-mono text-sm">
          <p>
            interface <span style={{ color: BLUE }}>{t.long}</span>
            <span style={{ color: GREEN }}>{slot}</span>/
            {three && <><span style={{ color: PURPLE }}>{sub}</span>/</>}
            <span style={{ color: AMBER }}>{port}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">short form: interface {t.id}{nums} ({t.note})</p>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Telnet vs SSH: what a sniffer sees</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pick active={proto === "telnet"} onClick={() => { setProto("telnet"); setSendN((n) => n + 1); }}>Telnet (port 23)</Pick>
          <Pick active={proto === "ssh"} onClick={() => { setProto("ssh"); setSendN((n) => n + 1); }}>SSH (port 22)</Pick>
          <Button size="sm" onClick={() => setSendN((n) => n + 1)}>Send login</Button>
        </div>

        <div className="mt-4 grid grid-cols-[80px_1fr_80px] items-center gap-2">
          <div className="rounded-lg border p-2 text-center text-xs font-semibold">Admin PC</div>
          <div className="relative h-16">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            <div
              key={`${proto}-${sendN}`}
              className="n7-fly absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[10px] font-bold text-white"
              style={{ background: proto === "telnet" ? RED : GREEN }}
            >
              {proto === "telnet" ? "admin / cisco123" : "9f3a·c1e7·b04d"}
            </div>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center text-[10px] text-muted-foreground">👁 sniffer</div>
          </div>
          <div className="rounded-lg border p-2 text-center text-xs font-semibold">Router</div>
        </div>
        <p key={`${proto}-${sendN}-t`} className="n7-fade-late mt-3 rounded-lg border px-3 py-2 font-mono text-xs" style={{ borderColor: proto === "telnet" ? RED : GREEN, color: proto === "telnet" ? RED : GREEN }}>
          {proto === "telnet" ? "Sniffer sees: user=admin  password=cisco123  (plain text)" : "Sniffer sees: 9f3a c1e7 b04d 7721... (encrypted, useless)"}
        </p>

        <div className="mt-3">
          <SimpleTable
            head={["", "Telnet", "SSH"]}
            rows={[
              ["Port", "23 (TCP)", "22 (TCP)"],
              ["Secure?", "No. Everything is plain text, passwords included", "Yes. The session is encrypted"],
              ["How", "Nothing hidden. TCP gives reliability, not secrecy", "RSA (asymmetric) keys set up the session and prove identity, then a fast symmetric cipher encrypts the data"],
              ["Use it?", "Only in a lab", "Always for real networks"],
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Setting up SSH on the VTY lines</p>
        <div className="mt-3">
          <SimpleTable head={["Command", "Why"]} rows={SSH_STEPS} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Tip title="Console line">Console access is set up on its own: line console 0, then password and login (or login local). Console and VTY lines are configured separately.</Tip>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 5 · verify and shortcuts ───────────────────────── */

const CMD_TABLE = [
  ["enable", "Enter Privilege EXEC mode"],
  ["configure terminal", "Enter Global Config mode"],
  ["hostname <name>", "Set the device name"],
  ["interface f0/0", "Enter an interface sub-mode"],
  ["ip address <ip> <mask>", "Assign an IP to the interface"],
  ["no shutdown", "Bring the interface up"],
  ["shutdown", "Administratively disable the interface"],
  ["exit / end", "Up one level / straight to Privilege EXEC"],
  ["copy run start (or write)", "Save running-config to NVRAM"],
  ["show ip interface brief", "Verify interface status and IPs"],
  ["show running-config", "See the live configuration"],
  ["no ip domain-lookup", "Stop DNS lookups on typos (common first step)"],
];

const KEYS = [
  ["Tab", "Autocomplete a keyword"],
  ["?", "List the keywords available at this point"],
  ["no <cmd>", "Delete or disable a setting"],
  ["↑ / ↓", "Recall previous commands"],
  ["Ctrl + A", "Cursor to the start of the line"],
  ["Ctrl + E", "Cursor to the end of the line"],
  ["Ctrl + U", "Delete the entire line"],
  ["Ctrl + W", "Delete the word before the cursor"],
  ["Ctrl + Z", "Same as end: back to Privilege EXEC from any config mode"],
  ["Ctrl + C", "Break the current command. To stop a ping or traceroute use Ctrl + Shift + 6"],
];

const LINE0 = "ip address 192.168.1.1 255.255.255.0";

function VerifySection() {
  const [admin, setAdmin] = useState(false);
  const [link, setLink] = useState(true);
  const [l2, setL2] = useState(true);
  const [txt, setTxt] = useState(LINE0);
  const [pos, setPos] = useState(LINE0.length);

  const status = !admin ? "administratively down" : !link ? "down" : "up";
  const protocol = !admin || !link ? "down" : l2 ? "up" : "down";
  const diag = !admin
    ? { c: AMBER, t: "Someone shut it down, or it never was brought up. Fix: no shutdown." }
    : !link
    ? { c: RED, t: "Layer 1 problem: cable unplugged or bad, or the far end is down. Check cables and the other device." }
    : l2
    ? { c: GREEN, t: "Healthy. Layer 1 and Layer 2 are both fine." }
    : { c: RED, t: "Layer 1 is fine but Layer 2 is not: mismatched encapsulation, missing clock rate on a serial link, or no keepalives from the far end." };

  const ctrlW = () => {
    const before = txt.slice(0, pos);
    const nb = before.replace(/\S+\s*$/, "");
    setTxt(nb + txt.slice(pos));
    setPos(nb.length);
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Read show ip interface brief</p>
        <p className="mt-1 text-xs text-muted-foreground">Flip the switches and watch the Status and Protocol columns change.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={admin} onClick={() => setAdmin((v) => !v)}>{admin ? "no shutdown (admin up)" : "shutdown (admin down)"}</Pick>
          <Pick active={link} onClick={() => setLink((v) => !v)}>{link ? "Cable connected, far end up" : "Cable unplugged"}</Pick>
          <Pick active={l2} onClick={() => setL2((v) => !v)}>{l2 ? "Layer 2 settings match" : "Layer 2 mismatch"}</Pick>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border bg-black/90 p-3 font-mono text-[11px] leading-5 text-green-300">
          <pre className="m-0 font-mono">{pad("Interface", 18)}{pad("IP-Address", 15)}{pad("OK?", 5)}{pad("Method", 8)}{pad("Status", 23)}Protocol</pre>
          <pre key={`${status}-${protocol}`} className="n7-pop m-0 font-mono text-white">
            {pad("FastEthernet0/0", 18)}{pad("192.168.1.1", 15)}{pad("YES", 5)}{pad("manual", 8)}
            <span style={{ color: status === "up" ? "#8ce99a" : status === "down" ? "#ff8787" : "#ffd43b" }}>{pad(status, 23)}</span>
            <span style={{ color: protocol === "up" ? "#8ce99a" : "#ff8787" }}>{protocol}</span>
          </pre>
        </div>
        <p key={diag.t} className="n7-fade mt-3 rounded-lg border px-3 py-2 text-xs leading-5" style={{ borderColor: diag.c, color: diag.c }}>
          <span className="font-semibold">{status} / {protocol}: </span>{diag.t}
        </p>
        <div className="mt-3">
          <Tip title="Reading it">Status is the physical side (Layer 1, plus the admin setting). Protocol is the Layer 2 side. You want up / up.</Tip>
        </div>
        <div className="mt-2">
          <Tip title="Careful">
            Cisco routers ship with interfaces shut down, so you must type no shutdown. Switch ports are the opposite: they start enabled.
          </Tip>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Line-editing shortcuts</p>
        <p className="mt-1 text-xs text-muted-foreground">Try them on a command line. The cursor starts at the end.</p>
        <div className="mt-3 rounded-lg border bg-black/90 p-3 font-mono text-xs text-green-300">
          <span className="text-white">R1(config-if)# </span>
          <span>{txt.slice(0, pos)}</span>
          <span className="n7-cursor text-white">▌</span>
          <span>{txt.slice(pos)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setPos(0)}>Ctrl + A</Button>
          <Button size="sm" variant="outline" onClick={() => setPos(txt.length)}>Ctrl + E</Button>
          <Button size="sm" variant="outline" onClick={ctrlW}>Ctrl + W</Button>
          <Button size="sm" variant="outline" onClick={() => { setTxt(""); setPos(0); }}>Ctrl + U</Button>
          <Button size="sm" onClick={() => { setTxt(LINE0); setPos(LINE0.length); }}>Reset line</Button>
        </div>
        <div className="mt-3">
          <SimpleTable head={["Key", "Action"]} rows={KEYS} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">Commands worth remembering</p>
        <div className="mt-3"><SimpleTable head={["Command", "Why"]} rows={CMD_TABLE} /></div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 6 · common mistakes ───────────────────────── */

const MYTHS = [
  { wrong: "RAM and NVRAM are basically the same.", right: "RAM holds the running-config and is wiped on reload. NVRAM holds the startup-config and survives power cycles. That is why you save." },
  { wrong: "The IOS lives in NVRAM.", right: "The IOS lives in Flash. NVRAM holds only the startup-config. RAM holds the running-config and a running copy of the IOS." },
  { wrong: "POST failure just makes the device slow.", right: "A POST failure stops the boot. The device never finishes booting and cannot forward traffic." },
  { wrong: "Show commands and config commands work in every mode.", right: "User EXEC is very limited. Privilege EXEC allows full show and diagnostics. Only Global Config and its sub-modes allow configuration changes." },
  { wrong: "Console and VTY are the same kind of line.", right: "Console is a physical line: a direct cable, no network needed. VTY is virtual: Telnet or SSH over the network. They are configured separately." },
  { wrong: "Telnet is secure because it uses TCP.", right: "Telnet sends everything in plain text, passwords included. TCP gives reliability, not encryption. SSH is the secure option." },
  { wrong: "A configured interface comes up on its own.", right: "Cisco router interfaces are shut down by default. You must type no shutdown. (Switch ports start enabled.)" },
  { wrong: "Saving is automatic.", right: "Nothing is saved until you run copy run start or write. A reboot wipes any unsaved changes." },
  { wrong: "exit and end do the same thing.", right: "exit goes up one level. end (or Ctrl+Z) jumps straight to Privilege EXEC from any config mode." },
  { wrong: "Cisco interface numbers start at 1.", right: "Cisco starts at 0: f0/0, g0/0/0. Other vendors sometimes start at 1, so always check the platform." },
  { wrong: "The global config prompt is (Router-config)#.", right: "It is Router(config)#. The mode name sits in brackets after the hostname: (config-if)#, (config-line)#, (config-router)#." },
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
                <div className="n7-fade mt-3 border-t pt-3">
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

/* ───────────────────────── 7 · interview prep ───────────────────────── */

const QA: { q: string; a: string[] }[] = [
  { q: "Name the four memory types and what lives in each.", a: ["ROM: the bootstrap / ROM Monitor (ROMMON), which also runs POST.", "RAM: the running-config, plus the running IOS, routing table and ARP cache.", "NVRAM: the startup-config, which survives reloads.", "Flash: the Cisco IOS image."] },
  { q: "What is POST and what happens if it fails?", a: ["Power On Self Test: the hardware check the bootstrap runs at power-up.", "It tests things like the CPU, memory and interfaces.", "If it fails, the router stops booting, typically ending up in ROMmon."] },
  { q: "What happens if the IOS in Flash is missing or corrupted?", a: ["The bootstrap cannot load the operating system from Flash. It may try a TFTP server for an image.", "If that fails too, the router stays in ROMmon mode.", "You recover by loading an IOS image over TFTP or from USB."] },
  { q: "What happens if NVRAM is empty at boot?", a: ["There is no startup-config to load.", "Older IOS versions broadcast a TFTP request to 255.255.255.255 looking for a config.", "If nothing answers, the router enters the initial configuration dialog (setup mode)."] },
  { q: "What is the difference between running-config and startup-config?", a: ["running-config is the live configuration in RAM. Changes take effect immediately.", "startup-config is the saved configuration in NVRAM. It is loaded into RAM on boot.", "copy run start (or write) saves running-config into startup-config."] },
  { q: "Walk me through the main CLI modes.", a: ["User EXEC (Router>): look only, a few show commands.", "Privilege EXEC (Router#): all show and diagnostic commands, no configuration.", "Global Config (Router(config)#): all configuration, entered with configure terminal.", "Sub-modes such as (config-if)# and (config-line)# sit under global config."] },
  { q: "What are interfaces and lines, and how do they differ?", a: ["Interfaces forward and receive data traffic: f0/0, g0/0/0, s0/0/0.", "Lines manage the device itself: console (physical) and VTY (virtual, for Telnet or SSH).", "They are configured separately and serve different purposes."] },
  { q: "Compare Telnet and SSH.", a: ["Telnet: port 23, plain text, insecure.", "SSH: port 22, encrypted. RSA keys set up and authenticate the session, then a symmetric cipher protects the data.", "Use SSH on real networks."] },
  { q: "How do you assign an IP to an interface?", a: ["configure terminal", "interface f0/0", "ip address 192.168.1.1 255.255.255.0", "no shutdown", "Save with copy run start (or write)."] },
  { q: "Why do you have to type no shutdown?", a: ["Cisco router interfaces are administratively down by default.", "no shutdown clears that state, so the interface can come up if the physical link is good."] },
  { q: "What does show ip interface brief show?", a: ["For each interface: the IP address, how it was set, the Status and the Protocol.", "Status reflects the physical side and the admin setting. Protocol reflects Layer 2.", "up / up is healthy. administratively down means no shutdown is missing. down / down usually means a cable or far-end problem."] },
  { q: "What are the most useful CLI shortcuts?", a: ["Tab autocompletes and ? lists the keywords available at that point.", "Up and down arrows recall earlier commands.", "Ctrl+A and Ctrl+E jump to the start and end of the line. Ctrl+U deletes the line, Ctrl+W deletes a word.", "Ctrl+Z (or end) returns to Privilege EXEC from any config mode."] },
];

function InterviewSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          A Cisco router has four memory types. ROM holds the bootstrap that runs first. RAM holds the running-config and the running
          IOS. NVRAM holds the startup-config and survives reloads. Flash holds the IOS image. On boot, POST runs, then the IOS loads
          from Flash, then the startup-config loads from NVRAM. If there is no config, the router may try TFTP and finally drops into
          setup mode. The CLI has three main modes: User EXEC, Privilege EXEC and Global Config, plus sub-modes for interfaces and
          lines. Interfaces carry data traffic. Lines are for management: console is physical, VTY is virtual for Telnet or SSH.
          Telnet is port 23 and unencrypted. SSH is port 22 and encrypted.
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
                <ul className="n7-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">RAM forgets, NVRAM remembers. The prompt tells you the mode. Interfaces carry data, lines manage the box.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function RouterFundamentalsSummary() {
  const [tab, setTab] = useState<TabId>("mem");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n7-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        @keyframes n7-pop { from { opacity: 0; transform: scale(.88); } to { opacity: 1; transform: none; } }
        @keyframes n7-fly { from { left: 0; } to { left: calc(100% - 9rem); } }
        @keyframes n7-blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
        @keyframes n7-cursor { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes n7-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
        @keyframes n7-fade-late { 0%,70% { opacity: 0; } 100% { opacity: 1; } }
        .n7-fade { animation: n7-fade .45s ease-out both; }
        .n7-pop { animation: n7-pop .35s ease-out both; }
        .n7-fly { animation: n7-fly 1.2s ease-in-out both; }
        .n7-blink { animation: n7-blink .5s ease-in-out 3; }
        .n7-cursor { animation: n7-cursor 1s steps(1) infinite; }
        .n7-pulse { animation: n7-pulse 1s ease-in-out infinite; }
        .n7-fade-late { animation: n7-fade-late 1.4s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .n7-fade, .n7-pop, .n7-fly, .n7-blink, .n7-cursor, .n7-pulse, .n7-fade-late { animation: none; opacity: 1; }
          .n7-fly { left: calc(100% - 9rem); }
        }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 07: Router fundamentals and the CLI</CardTitle>
            <CardDescription className="mt-1">
              Memory, boot, modes, interfaces and shortcuts. Seven short sections, tap through them in any order.
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
          {tab === "mem" && <MemSection />}
          {tab === "boot" && <BootSection />}
          {tab === "cli" && <CliSection />}
          {tab === "lines" && <LinesSection />}
          {tab === "verify" && <VerifySection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}