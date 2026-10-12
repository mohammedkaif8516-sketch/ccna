"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  Boxes,
  ChevronRight,
  CircleDot,
  Cpu,
  EthernetPort,
  Gauge,
  HardDrive,
  KeyRound,
  Layers,
  Lightbulb,
  Lock,
  MemoryStick,
  MessageCircleQuestion,
  Network,
  Plug,
  Save,
  ShieldCheck,
  Terminal,
  Unplug,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   Router Fundamentals & CLI — Summary
   Structure: Big Picture · Cheat Sheet · How It Works ·
              Misconceptions · CLI Ladder (signature) ·
              Interview Prep
   Register as SUMMARY_VIEWS.router = RouterFundamentalsSummary.
   ═════════════════════════════════════════════════════════════ */

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const hue = (h: number) => ({ "--h": h }) as CSSProperties;

const RF_CSS = `
.rf-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.rf-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .rf-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.rf-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .rf-root .osi-solid{background:hsl(var(--h) 68% 52%)}
.rf-root .rf-prompt{background:#0d1117;color:#7ee787;border-color:#30363d}
.dark .rf-root .rf-prompt{background:#050810;color:#7ee787}
@keyframes rfFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.rf-root .osi-fade{animation:rfFade .22s ease-out both}
@media (prefers-reduced-motion:reduce){.rf-root .osi-fade{animation:none}}
`;

// ─────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] leading-4 text-foreground/80">
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-sm leading-relaxed">
          <ChevronRight className="mt-1 size-3 shrink-0 text-muted-foreground" />
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({
  children,
  icon: Icon = Lightbulb,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex gap-2.5 rounded-xl border bg-[var(--accent-soft)] px-3.5 py-3 text-sm leading-relaxed">
      <Icon className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="rf-prompt overflow-x-auto rounded-xl border px-3.5 py-3 font-mono text-[11px] leading-5">
      <code>{children}</code>
    </pre>
  );
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const MEMORY = [
  {
    name: "ROM",
    full: "Read-Only Memory",
    hue: 335,
    icon: HardDrive,
    contents: "Bootstrap program (ROM Monitor / ROMMON)",
    role: "Loads first on power-up, runs POST, finds and loads the IOS.",
    volatile: false,
  },
  {
    name: "RAM",
    full: "Random Access Memory",
    hue: 150,
    icon: MemoryStick,
    contents: "Running-config",
    role: "Working memory. Holds the live configuration — anything here is lost on reload.",
    volatile: true,
  },
  {
    name: "NVRAM",
    full: "Non-Volatile RAM",
    hue: 215,
    icon: Save,
    contents: "Startup-config",
    role: "Persistent config storage. Survives a reload. Loaded into RAM on boot.",
    volatile: false,
  },
  {
    name: "Flash",
    full: "Flash Memory",
    hue: 290,
    icon: Cpu,
    contents: "Cisco IOS",
    role: "Holds the operating system image. Copied to RAM to run.",
    volatile: false,
  },
];

const BOOT_STEPS = [
  "Device is powered on.",
  "Bootstrap program (ROM Monitor) is loaded from ROM.",
  "Bootstrap runs the hardware diagnostic test — POST (Power On Self Test).",
  "POST failure → device gets stuck in ROMmon mode.",
  "POST success → bootstrap tries to load the Cisco IOS from Flash into RAM.",
  "IOS missing or corrupted → device stuck in ROMmon mode.",
  "IOS found in Flash → loaded and booted into RAM.",
  "IOS looks for startup-config in NVRAM and loads it into RAM.",
  "No startup-config found → device broadcasts a TFTP request to 255.255.255.255.",
  "TFTP server responds → that config is loaded into RAM as the running-config.",
  "No TFTP response → router enters initial configuration mode (no config).",
];

const CLI_MODES = [
  {
    name: "User EXEC",
    nick: "Idle mode",
    prompt: "Router>",
    hue: 150,
    can: [
      "A few limited show commands",
      "No configuration",
      "No privileged commands",
    ],
    enter: "This is the default mode after console or SSH login.",
  },
  {
    name: "Privilege EXEC",
    nick: "Enable mode",
    prompt: "Router#",
    hue: 215,
    can: [
      "All show commands",
      "ping, traceroute",
      "copy, reload, debug",
      "No configuration yet",
    ],
    enter: "From user mode, type: enable",
  },
  {
    name: "Global Configuration",
    nick: "Config mode",
    prompt: "(Router-config)#",
    hue: 335,
    can: [
      "hostname, banner, service settings",
      "Enter interface / line / routing sub-modes",
      "All device configuration",
    ],
    enter: "From privilege mode, type: configure terminal",
  },
  {
    name: "Sub-modes",
    nick: "Interface / line / protocol",
    prompt: "(Router-config-if)#",
    hue: 290,
    can: [
      "ip address, no shutdown — interface",
      "password, login — line (console / VTY)",
      "network, router-id — routing protocols",
    ],
    enter: "From global config, enter the target object (interface, line, router, etc.)",
  },
];

const INTERFACES_VS_LINES = [
  {
    kind: "Interfaces",
    hue: 215,
    icon: EthernetPort,
    purpose: "Forward and receive data traffic.",
    examples: ["Serial 0/0/0", "FastEthernet 0/0", "GigabitEthernet 0/0/0"],
    format: "interface/module — f0/0. Modular: interface/module/slot — f0/0/0.",
  },
  {
    kind: "Lines",
    hue: 290,
    icon: Plug,
    purpose: "Access and manage the device itself — management traffic.",
    examples: ["Console (physical)", "VTY (virtual — Telnet / SSH)"],
    format: "line console 0  ·  line vty 0 4",
  },
];

const REMOTE = [
  {
    name: "Telnet",
    hue: 335,
    icon: Unplug,
    port: "23",
    secure: false,
    notes: [
      "TCP-based remote management protocol",
      "Plain-text — anyone sniffing sees the password",
      "Faster than SSH",
    ],
  },
  {
    name: "SSH",
    hue: 150,
    icon: Lock,
    port: "22",
    secure: true,
    notes: [
      "TCP-based remote management protocol",
      "Encrypted using asymmetric encryption (RSA)",
      "Slightly slower than Telnet",
    ],
  },
];

const SHORTCUTS = [
  { key: "Tab", action: "Autocomplete a keyword" },
  { key: "?", action: "List available keywords at this point" },
  { key: "no <cmd>", action: "Delete or disable a setting" },
  { key: "↑ / ↓", action: "Recall previous commands" },
  { key: "Ctrl + A", action: "Cursor to the front of the line" },
  { key: "Ctrl + E", action: "Cursor to the end of the line" },
  { key: "Ctrl + U", action: "Delete the entire line" },
  { key: "Ctrl + W", action: "Delete one keyword" },
  { key: "Ctrl + Z", action: "Exit from all modes" },
  { key: "Ctrl + C", action: "Break the current process" },
];

// ─────────────────────────────────────────────────────────────
// Tab · Big Picture
// ─────────────────────────────────────────────────────────────

function BigPictureTab() {
  return (
    <div className="space-y-6">
      <div style={hue(215)} className="osi-tint rounded-xl border px-3.5 py-3.5">
        <p className="osi-ink text-xs font-semibold">
          What a Cisco router actually is
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          A purpose-built computer. It has the same basic parts as any PC —
          memory, an operating system, interfaces — but everything is tuned
          for one job: forwarding packets between networks. To use one, you
          have to talk to it. The way you talk to it is the CLI, and the CLI
          has its own language, modes, and shortcuts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div style={hue(150)} className="osi-tint rounded-xl border px-3.5 py-3">
          <p className="osi-ink text-sm font-semibold">The four memory types</p>
          <Bullets
            items={[
              "ROM — bootstrap / ROMMON, runs first",
              "RAM — running-config, wiped on reload",
              "NVRAM — startup-config, survives a reload",
              "Flash — the IOS operating system image",
            ]}
          />
          <p className="mt-2 text-[11px] italic text-muted-foreground">
            Save to NVRAM or your config dies with the power.
          </p>
        </div>

        <div style={hue(290)} className="osi-tint rounded-xl border px-3.5 py-3">
          <p className="osi-ink text-sm font-semibold">The CLI has a ladder</p>
          <Bullets
            items={[
              "User EXEC — Router> — look only",
              "Privilege — Router# — enable for real commands",
              "Global Config — (Router-config)# — start configuring",
              "Sub-modes — (Router-config-if)# etc.",
            ]}
          />
          <p className="mt-2 text-[11px] italic text-muted-foreground">
            Each `exit` goes up one step. `end` jumps straight to privilege.
          </p>
        </div>
      </div>

      <div>
        <Label>Interfaces vs lines — the key distinction</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTERFACES_VS_LINES.map((i) => {
            const Icon = i.icon;
            return (
              <div
                key={i.kind}
                style={hue(i.hue)}
                className="osi-tint rounded-xl border px-3.5 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="osi-solid flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <p className="osi-ink text-sm font-semibold">{i.kind}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{i.purpose}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {i.examples.map((e) => (
                    <Chip key={e}>{e}</Chip>
                  ))}
                </div>
                <p className="mt-2 text-[11px] italic text-muted-foreground">
                  {i.format}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <Callout icon={Terminal}>
  Remember: the prompt tells you where you are.{" "}
  <code className="font-mono">&gt;</code> user,{" "}
  <code className="font-mono">#</code> privilege,{" "}
  <code className="font-mono">(config)#</code> global,{" "}
  <code className="font-mono">(config-if)#</code> interface. If the prompt
  looks wrong, your next command will fail.
</Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Cheat Sheet
// ─────────────────────────────────────────────────────────────

function CheatSheetTab() {
  return (
    <div className="space-y-6">
      <div>
        <Label>Memory types</Label>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Memory</th>
                <th className="px-3 py-2 font-medium">Contents</th>
                <th className="px-3 py-2 font-medium">Survives reload?</th>
              </tr>
            </thead>
            <tbody>
              {MEMORY.map((m) => (
                <tr key={m.name} className="border-t">
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {m.contents}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {m.volatile ? "No" : "Yes"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <Label>CLI modes at a glance</Label>
        <div className="overflow-hidden rounded-xl border bg-card">
          {CLI_MODES.map((m, i, arr) => (
            <div
              key={m.name}
              style={hue(m.hue)}
              className={cx(
                "grid grid-cols-[1fr_120px] items-start gap-3 px-3.5 py-2.5",
                i !== arr.length - 1 && "border-b",
              )}
            >
              <div className="min-w-0">
                <p className="osi-ink text-sm font-semibold">{m.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {m.nick}
                </p>
              </div>
              <code className="osi-tint truncate rounded border px-2 py-1 font-mono text-[11px]">
                {m.prompt}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Interfaces vs lines</Label>
          <div className="space-y-2">
            {INTERFACES_VS_LINES.map((i) => (
              <div
                key={i.kind}
                style={hue(i.hue)}
                className="osi-tint rounded-lg border px-3 py-2.5"
              >
                <p className="osi-ink text-xs font-semibold">{i.kind}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  {i.purpose}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {i.format}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Telnet vs SSH</Label>
          <div className="space-y-2">
            {REMOTE.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.name}
                  style={hue(r.hue)}
                  className="osi-tint rounded-lg border px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="osi-ink size-3.5 shrink-0" />
                    <p className="osi-ink text-xs font-semibold">{r.name}</p>
                    <span className="ml-auto rounded bg-card px-1.5 py-0.5 font-mono text-[10px]">
                      Port {r.port}
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {r.notes.map((n) => (
                      <li
                        key={n}
                        className="text-[11px] leading-4 text-muted-foreground"
                      >
                        · {n}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <Label>Commands worth remembering</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { cmd: "enable", why: "Enter privilege mode" },
            { cmd: "configure terminal", why: "Enter global config mode" },
            { cmd: "hostname <name>", why: "Set the device name" },
            { cmd: "interface f0/0", why: "Enter an interface sub-mode" },
            { cmd: "ip address <ip> <mask>", why: "Assign an IP to the interface" },
            { cmd: "no shutdown", why: "Bring the interface up" },
            { cmd: "shutdown", why: "Disable the interface" },
            { cmd: "exit / end", why: "Back up one step / to privilege mode" },
            { cmd: "copy run start", why: "Save running-config to NVRAM" },
            { cmd: "write", why: "Same as copy run start" },
            { cmd: "show ip interface brief", why: "Verify interfaces up/down + IPs" },
            { cmd: "show running-config", why: "See the live configuration" },
          ].map((c) => (
            <div
              key={c.cmd}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
            >
              <code className="shrink-0 font-mono text-[11px] font-medium">
                {c.cmd}
              </code>
              <span className="truncate text-[10px] text-muted-foreground">
                {c.why}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Keyboard shortcuts</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
            >
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
                {s.key}
              </code>
              <span className="truncate text-[10px] text-muted-foreground">
                {s.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Callout icon={Network}>
        If you can write the four memory types, the three main CLI modes,
        and the save-config command from memory, the CLI questions stop being
        tricky.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · How It Works
// ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    title: "Power on",
    hue: 215,
    text: "You plug in the device. The power supply stabilizes and the CPU starts executing code from ROM — nothing user-configurable is happening yet.",
  },
  {
    title: "Bootstrap runs POST",
    hue: 150,
    text: "ROM's bootstrap program runs the Power On Self Test. It checks CPU, memory, and interfaces. If any critical hardware fails, the device drops into ROMmon.",
  },
  {
    title: "IOS is loaded from Flash",
    hue: 185,
    text: "If POST passes, the bootstrap finds the IOS image in Flash and decompresses it into RAM. If the image is missing or corrupted, you land in ROMmon again.",
  },
  {
    title: "Startup-config loads from NVRAM",
    hue: 255,
    text: "The booted IOS looks in NVRAM for the saved startup-config. If found, it is copied into RAM and becomes the running-config.",
  },
  {
    title: "No config? Try TFTP",
    hue: 290,
    text: "If NVRAM is empty, the device sends a broadcast TFTP request to 255.255.255.255. If a TFTP server responds with a config, that becomes the running-config.",
  },
  {
    title: "Still nothing? Setup mode",
    hue: 335,
    text: "No TFTP server either? The device drops into initial configuration mode — a blank slate. You configure it from scratch over the console.",
  },
];

function HowItWorksTab() {
  const [step, setStep] = useState(0);
  const current = HOW_STEPS[step];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        What happens between the moment you flip the power switch and the
        moment the router is ready to forward packets. Use Next / Previous or
        click any step below.
      </p>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {HOW_STEPS.length}
          </span>
          <span>{current.title}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${((step + 1) / HOW_STEPS.length) * 100}%` }}
          />
        </div>
        <div
          style={hue(current.hue)}
          className="osi-tint osi-fade mt-4 rounded-xl border px-3.5 py-3.5"
        >
          <p className="osi-ink text-xs font-semibold">Step {step + 1}</p>
          <p className="mt-1 text-sm leading-relaxed">{current.text}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setStep((s) => Math.min(HOW_STEPS.length - 1, s + 1))
            }
            disabled={step === HOW_STEPS.length - 1}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <ol className="space-y-2">
        {HOW_STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => setStep(i)}
              style={hue(s.hue)}
              className={cx(
                "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                i === step
                  ? "osi-tint"
                  : "bg-card hover:bg-[var(--accent-soft)]",
              )}
            >
              <span
                className={cx(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  i === step ? "osi-solid" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Common Misconceptions
// ─────────────────────────────────────────────────────────────

const MISCONCEPTIONS = [
  {
    wrong: "RAM and NVRAM are basically the same.",
    right:
      "RAM holds the running-config and is wiped on reload. NVRAM holds the startup-config and survives power cycles. That is why you save.",
  },
  {
    wrong: "The IOS lives in NVRAM.",
    right:
      "The IOS lives in Flash. NVRAM holds only the startup-config. RAM holds the running-config and the running IOS.",
  },
  {
    wrong: "POST failure just makes the device slow.",
    right:
      "POST failure drops the device into ROMmon mode. It never finishes booting and cannot forward traffic.",
  },
  {
    wrong: "Show commands and config commands work in every mode.",
    right:
      "User EXEC is read-only and very limited. Privilege EXEC allows show and diagnostics. Only Global Config and sub-modes allow configuration changes.",
  },
  {
    wrong: "Console port and VTY are the same kind of line.",
    right:
      "Console is a physical line — direct cable, no network needed. VTY is a virtual line — Telnet / SSH over the network. They are configured separately.",
  },
  {
    wrong: "Telnet is secure because it uses TCP.",
    right:
      "Telnet sends everything in plain text, including passwords. TCP gives reliability, not encryption. SSH is the secure option.",
  },
  {
    wrong: "If you configure an interface, it comes up automatically.",
    right:
      "Interfaces are administratively down by default on many platforms. You must issue `no shutdown` to bring them up.",
  },
  {
    wrong: "Saving is automatic.",
    right:
      "Nothing is saved until you run `copy run start` or `write`. A reboot wipes any unsaved changes.",
  },
  {
    wrong: "`exit` and `end` do the same thing.",
    right:
      "`exit` goes up one level. `end` (or Ctrl+Z) jumps directly to Privilege EXEC mode from anywhere.",
  },
  {
    wrong: "Numbering starts from 1 on Cisco interfaces.",
    right:
      "Cisco starts at 0 — f0/0, g0/0/0. Other vendors sometimes start at 1, so always check the platform.",
  },
];

function MisconceptionsTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        The small confusions that quietly cost marks. Read the wrong line,
        then read the right one.
      </p>

      <div className="space-y-2">
        {MISCONCEPTIONS.map((m, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-start gap-2.5 border-b border-destructive/30 bg-destructive/5 px-3.5 py-2.5">
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                ✗ Wrong
              </span>
              <p className="min-w-0 text-sm">{m.wrong}</p>
            </div>
            <div className="flex items-start gap-2.5 bg-emerald-500/5 px-3.5 py-2.5">
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                ✓ Right
              </span>
              <p className="min-w-0 text-sm">{m.right}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout icon={AlertTriangle}>
        If you can explain all ten of these in your own words, the CLI stops
        feeling like trivia and starts feeling like a tool.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · CLI Ladder (signature)
// ─────────────────────────────────────────────────────────────

type LadderStep = {
  mode: string;
  prompt: string;
  hue: number;
  desc: string;
  commands: { cmd: string; why: string; goto?: number }[];
};

const LADDER_STEPS: LadderStep[] = [
  {
    mode: "User EXEC",
    prompt: "Router>",
    hue: 150,
    desc: "Just logged in over the console or SSH. Very limited — a few show commands and that is it. Think of this as 'look only' mode.",
    commands: [
      { cmd: "enable", why: "Go up to Privilege EXEC mode.", goto: 1 },
    ],
  },
  {
    mode: "Privilege EXEC",
    prompt: "Router#",
    hue: 215,
    desc: "Real commands work here: show, ping, traceroute, copy, reload, debug. But you still cannot change the configuration.",
    commands: [
      { cmd: "show ip interface brief", why: "Verify interfaces — up/down and IP." },
      { cmd: "show running-config", why: "See the live configuration." },
      { cmd: "configure terminal", why: "Enter Global Config mode.", goto: 2 },
    ],
  },
  {
    mode: "Global Config",
    prompt: "(Router-config)#",
    hue: 335,
    desc: "The top of the configuration hierarchy. From here you can set device-wide settings or dive into interface, line, and routing sub-modes.",
    commands: [
      { cmd: "hostname R1", why: "Rename the device. Device-wide setting." },
      { cmd: "interface f0/0", why: "Enter an interface sub-mode.", goto: 3 },
      { cmd: "line console 0", why: "Enter a line sub-mode for console access." },
      { cmd: "no ip domain-lookup", why: "Disable DNS lookups on typos (a common first step)." },
    ],
  },
  {
    mode: "Interface Sub-mode",
    prompt: "(R1-config-if)#",
    hue: 290,
    desc: "Inside an interface. This is where you assign IPs, add descriptions, and turn the interface on or off. Each interface has its own sub-mode.",
    commands: [
      { cmd: "description LAN1-GW", why: "Label the interface (helps you later)." },
      { cmd: "ip address 192.168.1.1 255.255.255.0", why: "Assign an IP and mask." },
      { cmd: "no shutdown", why: "Bring the interface administratively up." },
      { cmd: "exit", why: "Back up to Global Config." },
    ],
  },
];

function LadderTab() {
  const [activeStep, setActiveStep] = useState(0);
  const step = LADDER_STEPS[activeStep];

  const goTo = (i: number) => setActiveStep(i);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        The CLI is a ladder. Start at the bottom (User EXEC), climb up
        through Privilege and Global Config, and land in a sub-mode. Click
        any prompt to jump there, or use the commands to climb naturally.
      </p>

      {/* Ladder visualization */}
      <div className="space-y-2">
        {LADDER_STEPS.map((s, i) => {
          const active = i === activeStep;
          return (
            <button
              key={s.mode}
              type="button"
              onClick={() => setActiveStep(i)}
              style={hue(s.hue)}
              className={cx(
                "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                active
                  ? "osi-tint"
                  : "bg-card hover:bg-[var(--accent-soft)]",
              )}
            >
              <span
                className={cx(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  active ? "osi-solid" : "bg-muted text-muted-foreground",
                )}
              >
                {i}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cx(
                    "truncate text-sm font-semibold",
                    active && "osi-ink",
                  )}
                >
                  {s.mode}
                </p>
                <code className="truncate font-mono text-[11px] text-muted-foreground">
                  {s.prompt}
                </code>
              </div>
              {i < LADDER_STEPS.length - 1 && (
                <ArrowDown className="size-3.5 shrink-0 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {/* Terminal panel */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p
            style={hue(step.hue)}
            className="osi-ink text-sm font-semibold"
          >
            {step.mode}
          </p>
          <span className="text-[11px] text-muted-foreground">
            Step {activeStep + 1} of {LADDER_STEPS.length}
          </span>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {step.desc}
        </p>

<CodeBlock>{step.prompt} ▊</CodeBlock>
        <div className="mt-4">
          <Label>Commands available here</Label>
          <div className="space-y-1.5">
            {step.commands.map((c) => (
              <button
                key={c.cmd}
                type="button"
                onClick={() => c.goto !== undefined && goTo(c.goto)}
                disabled={c.goto === undefined}
                className={cx(
                  "flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-left outline-none transition-colors",
                  c.goto !== undefined
                    ? "cursor-pointer hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
                    : "cursor-default",
                )}
              >
                <code className="shrink-0 font-mono text-[11px] font-medium">
                  {c.cmd}
                </code>
                <span className="min-w-0 flex-1 truncate text-right text-[10px] text-muted-foreground">
                  {c.why}
                </span>
                {c.goto !== undefined && (
                  <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
            disabled={activeStep === 0}
            className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
          >
            Previous mode
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveStep((s) => Math.min(LADDER_STEPS.length - 1, s + 1))
            }
            disabled={activeStep === LADDER_STEPS.length - 1}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            Next mode
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(0)}
            className="rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
          >
            Reset
          </button>
        </div>
      </div>

      <Callout icon={Terminal}>
  Remember: the prompt tells you where you are.{" "}
  <code className="font-mono">&gt;</code> user,{" "}
  <code className="font-mono">#</code> privilege,{" "}
  <code className="font-mono">(config)#</code> global,{" "}
  <code className="font-mono">(config-if)#</code> interface. If the
  prompt looks wrong, your next command will fail.
</Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab · Interview Prep
// ─────────────────────────────────────────────────────────────

const PITCH =
  "A Cisco router has four memory types. ROM holds the bootstrap / ROM Monitor that runs first. RAM holds the running-config and the running IOS. NVRAM holds the startup-config and survives reloads. Flash holds the IOS image. On boot: POST runs, then the IOS loads from Flash, then the startup-config loads from NVRAM. If there is no config, the device tries TFTP and finally drops into setup mode. The CLI has three main modes: User EXEC (`>`), Privilege EXEC (`#`), and Global Config (`(config)#`) plus sub-modes for interfaces and lines. Interfaces carry data traffic; lines are for management — console is physical, VTY is virtual for Telnet or SSH. Telnet is port 23 and unencrypted; SSH is port 22 and encrypted with RSA.";

const QA: Array<{ q: string; a: string[] }> = [
  {
    q: "Name the four memory types and what lives in each.",
    a: [
      "ROM — bootstrap / ROM Monitor (ROMMON).",
      "RAM — running-config, plus the running IOS after boot.",
      "NVRAM — startup-config, survives reloads.",
      "Flash — the Cisco IOS image.",
    ],
  },
  {
    q: "What is POST and what happens if it fails?",
    a: [
      "Power On Self Test — the hardware check the bootstrap runs at power-up.",
      "It tests CPU, memory, and interfaces.",
      "If it fails, the device drops into ROMmon mode and never finishes booting.",
    ],
  },
  {
    q: "What happens if the IOS in Flash is missing or corrupted?",
    a: [
      "The bootstrap cannot load the operating system.",
      "The device gets stuck in ROMmon mode.",
      "From there you can recover by loading an IOS image via TFTP or USB.",
    ],
  },
  {
    q: "What happens if NVRAM is empty at boot?",
    a: [
      "The IOS broadcasts a TFTP request to 255.255.255.255.",
      "If a TFTP server responds with a config, it becomes the running-config.",
      "If not, the router enters initial configuration (setup) mode with no config.",
    ],
  },
  {
    q: "What is the difference between running-config and startup-config?",
    a: [
      "running-config is the live configuration held in RAM. Changes take effect immediately.",
      "startup-config is the saved configuration in NVRAM. It is loaded into RAM on boot.",
      "`copy run start` (or `write`) promotes running-config to startup-config.",
    ],
  },
  {
    q: "Walk me through the three main CLI modes.",
    a: [
      "User EXEC (Router>) — look only, limited show commands.",
      "Privilege EXEC (Router#) — all show and diagnostic commands, no configuration.",
      "Global Configuration ((Router-config)#) — all configuration, entered with `configure terminal`.",
    ],
  },
  {
    q: "What are interfaces and lines, and how do they differ?",
    a: [
      "Interfaces forward and receive data traffic — f0/0, g0/0/0, s0/0/0.",
      "Lines manage the device itself: console (physical) and VTY (virtual — Telnet / SSH).",
      "Configuring them is separate, and they serve different purposes.",
    ],
  },
  {
    q: "Compare Telnet and SSH.",
    a: [
      "Telnet — port 23, plain text. Fast but insecure.",
      "SSH — port 22, encrypted with asymmetric encryption (RSA). Slightly slower, but the right choice.",
    ],
  },
  {
    q: "How do you assign an IP to an interface?",
    a: [
      "Enter global config with `configure terminal`.",
      "Enter the interface sub-mode: `interface f0/0`.",
      "Assign: `ip address 192.168.1.1 255.255.255.0`.",
      "Bring it up: `no shutdown`.",
      "Save: `copy run start` or `write`.",
    ],
  },
  {
    q: "Why do you have to type `no shutdown`?",
    a: [
      "Many Cisco interfaces come up administratively down by default.",
      "`no shutdown` clears that state, allowing the interface to come up if the physical link is good.",
    ],
  },
  {
    q: "What does `show ip interface brief` show?",
    a: [
      "Each interface's IP address, its status (administratively up / down), the protocol status (line protocol up / down), and its name.",
      "The fastest single command to confirm whether an interface is configured and alive.",
    ],
  },
  {
    q: "What are the most useful CLI shortcuts?",
    a: [
      "Tab — autocomplete.",
      "? — list keywords available at this point.",
      "↑ / ↓ — recall previous commands.",
      "Ctrl+A / Ctrl+E — jump to line start / end.",
      "Ctrl+U — delete the whole line.",
      "Ctrl+Z — exit to Privilege EXEC from anywhere.",
    ],
  },
];

function InterviewPrepTab() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-6">
      <section>
        <Label>Your 30-second answer</Label>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm leading-relaxed">{PITCH}</p>
        </div>
      </section>

      <section>
        <Label>Questions interviewers ask</Label>
        <div className="space-y-2">
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full min-w-0 items-center gap-3 px-3.5 py-3 text-left outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <MessageCircleQuestion className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {item.q}
                  </span>
                  <ChevronRight
                    className={cx(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="osi-fade space-y-2 border-t px-3.5 pb-3.5 pt-3 text-sm leading-relaxed">
                    {item.a.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Callout icon={ShieldCheck}>
        Practice the 30-second pitch out loud until it flows without notes.
        Every follow-up question below is now answerable.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "big", label: "Big Picture" },
  { id: "cheat", label: "Cheat Sheet" },
  { id: "how", label: "How It Works" },
  { id: "misconceptions", label: "Misconceptions" },
  { id: "ladder", label: "CLI Ladder" },
  { id: "prep", label: "Interview Prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function RouterFundamentalsSummary() {
  const [tab, setTab] = useState<TabId>("big");

  return (
    <div className="rf-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{RF_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 07 · Summary
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Router Fundamentals & CLI
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Memory, boot order, interfaces and lines, and the CLI ladder you
          climb every time you configure a device.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Router fundamentals sections"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-card p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "shrink-0 rounded-lg px-3.5 py-2 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
              tab === t.id
                ? "bg-[var(--accent)] font-medium text-white"
                : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-w-0">
        {tab === "big" && <BigPictureTab />}
        {tab === "cheat" && <CheatSheetTab />}
        {tab === "how" && <HowItWorksTab />}
        {tab === "misconceptions" && <MisconceptionsTab />}
        {tab === "ladder" && <LadderTab />}
        {tab === "prep" && <InterviewPrepTab />}
      </div>
    </div>
  );
}