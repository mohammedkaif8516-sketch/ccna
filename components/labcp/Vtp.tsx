/**
 * Vtp.tsx — VTP (server / client / transparent / off) for the netsim switches.
 *
 * Sync rules (run after every CLI line and when cables are drawn):
 *   • advertisements only cross links that are UP trunks at both ends, with the native VLAN allowed on both
 *   • sender must be server/client with a domain; receiver must be server/client (a transparent switch only forwards)
 *   • same domain (a switch with no domain adopts it), same password, same version
 *   • the receiver takes the VLAN database only if the sender's revision is HIGHER
 *   • each VLAN add/remove/rename on a server raises its revision by 1; changing the domain resets it to 0
 *
 * Exports: vtpGlobalX, vtpPrivX, renderVtp, vtpBlocked, vtpSync
 */
import {
  type Ctx,
  type Dev,
  type E,
  type H,
  type State,
  type Store,
  type VtpCfg,
  afterSubmit,
  ifUp,
  operMode,
  peerOf,
  vlanAllowed,
  fakeHash,
  macOf,
} from "@/components/simulator/netsim";

const mk = (): VtpCfg => ({ mode: "server", version: 2, rev: 0 });
const eff = (d: Dev): VtpCfg => d.vtp ?? mk();
const cfgOf = (c: Ctx) => (c.dev.vtp ??= mk());
const DEFSIG = JSON.stringify({ 1: "default" });

/** call at the top of vlan / no vlan / access-vlan-creation handlers */
export const vtpBlocked = (c: Ctx) => {
  if (eff(c.dev).mode !== "client") return false;
  c.out("VTP VLAN configuration not allowed when device is in CLIENT mode.");
  return true;
};

/* ───────────── config commands ───────────── */
const MODES: [VtpCfg["mode"], string][] = [
  ["server", "Server"],
  ["client", "Client"],
  ["transparent", "Transparent"],
  ["off", "Off"],
];
const modeX = MODES.map<E>(([m, label]) => [
  `vtp mode ${m}`,
  (c) => {
    cfgOf(c).mode = m;
    c.out(`Setting device to VTP ${label} mode for VLANS.`);
  },
  `Set the device to ${label.toLowerCase()} mode`,
]);

export const vtpGlobalX: E[] = [
  ...modeX,
  [
    "vtp domain <name>",
    (c, a) => {
      const t = cfgOf(c);
      if (t.domain === a[0]) return c.out(`Domain name already set to ${a[0]}.`);
      c.out(`Changing VTP domain name from ${t.domain ?? "NULL"} to ${a[0]}`);
      t.domain = a[0];
      t.rev = 0; // a new domain resets the configuration revision
    },
    "Set the VTP domain name (case-sensitive)",
  ],
  [
    "vtp password <pw>",
    (c, a) => {
      cfgOf(c).pw = a[0];
      c.out(`Setting device VLAN database password to ${a[0]}`);
    },
    "Set the VTP password (case-sensitive, MD5)",
  ],
  [
    "no vtp password",
    (c) => {
      cfgOf(c).pw = undefined;
      c.out("Clearing device VLAN database password.");
    },
    "Remove the VTP password",
  ],
  [
    "vtp version <n>",
    (c, a) => {
      if (!["1", "2", "3"].includes(a[0])) return c.bad(2);
      cfgOf(c).version = +a[0] as 1 | 2 | 3;
    },
    "Set the VTP version (1 | 2 | 3)",
  ],
];

/* ───────────── show commands ───────────── */
const digest = (d: Dev) => {
  const h = fakeHash(JSON.stringify(d.vlans));
  return Array.from(
    { length: 16 },
    (_, i) =>
      "0x" +
      ((h.charCodeAt(i % h.length) * (i + 7)) & 255)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase(),
  );
};
const showStatus: H = (c) => {
  const d = c.dev,
    t = eff(d),
    md5 = digest(d),
    label = MODES.find(([m]) => m === t.mode)![1];
  c.out(
    "VTP Version capable             : 1 to 3",
    `VTP version running             : ${t.version}`,
    `VTP Domain Name                 : ${t.domain ?? ""}`,
    "VTP Pruning Mode                : Disabled",
    "VTP Traps Generation            : Disabled",
    `Device ID                       : ${macOf(d.id, "bridge")}`,
    "Configuration last modified by 0.0.0.0 at 0-0-00 00:00:00",
    "Local updater ID is 0.0.0.0 (no valid interface found)",
    "",
    "Feature VLAN:",
    "--------------",
    `VTP Operating Mode                : ${label}`,
    "Maximum VLANs supported locally   : 1005",
    `Number of existing VLANs          : ${Object.keys(d.vlans).length + 4}`,
    `Configuration Revision            : ${t.rev}`,
    `MD5 digest                        : ${md5.slice(0, 8).join(" ")}`,
    `                                    ${md5.slice(8).join(" ")}`,
  );
};
export const vtpPrivX: E[] = [
  ["show vtp status", showStatus, "VTP domain status"],
  [
    "show vtp password",
    (c) =>
      c.out(
        eff(c.dev).pw
          ? `VTP Password: ${eff(c.dev).pw}`
          : "The VTP password is not configured.",
      ),
    "VTP password",
  ],
];

/** only transparent / off appear in running-config on real IOS (the rest lives in vlan.dat) */
export const renderVtp = (d: Dev): string[] => {
  const m = d.vtp?.mode;
  return m === "transparent" || m === "off" ? [`vtp mode ${m}`, "!"] : [];
};

/* ───────────── advertisement sync ───────────── */
const isPhys = (n: string) => !n.startsWith("Vlan") && !n.startsWith("Loopback");
/** VTP frames need an UP trunk whose native VLAN is allowed on it */
const trunkOk = (s: State, id: string, p: string) => {
  const i = s.devs[id]?.ifaces[p];
  return (
    !!i &&
    ifUp(s, id, p) &&
    operMode(s, id, p) === "trunk" &&
    vlanAllowed(i.allowed, i.native ?? 1)
  );
};
/** switches that hear `id`'s advertisements — transparent switches pass them along but don't take them */
function peers(s: State, id: string): string[] {
  const out = new Set<string>(),
    seen = new Set([id]),
    q = [id];
  while (q.length) {
    const u = q.shift()!;
    for (const n of Object.keys(s.devs[u].ifaces)) {
      if (!isPhys(n) || !trunkOk(s, u, n)) continue;
      const pe = peerOf(s, u, n),
        pd = pe && s.devs[pe.id];
      if (!pe || !pd || pd.kind !== "switch" || seen.has(pe.id)) continue;
      if (!trunkOk(s, pe.id, pe.port)) continue;
      seen.add(pe.id);
      const m = eff(pd).mode;
      if (m === "transparent") q.push(pe.id);
      else if (m !== "off") out.add(pe.id);
    }
  }
  return [...out];
}
const diffCount = (a: string, b: string) => {
  const x = JSON.parse(a) as Record<string, string>,
    y = JSON.parse(b) as Record<string, string>;
  let n = 0;
  for (const k in y) if (x[k] !== y[k]) n++;
  for (const k in x) if (!(k in y)) n++;
  return n;
};

export function vtpSync(st: Store) {
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;

    // 1) local VLAN edits: a server's revision goes up by one per change
    for (const d of Object.values(st.get().devs)) {
      if (d.kind !== "switch") continue;
      const cur = JSON.stringify(d.vlans),
        old = d.vtp?.sig ?? DEFSIG;
      if (cur === old) continue;
      const n = diffCount(old, cur);
      st.update(d.id, (x) => {
        const t = (x.vtp ??= mk());
        if (t.mode === "server") t.rev += n;
        t.sig = cur;
      });
      changed = true;
    }

    // 2) advertisements
    for (const id of Object.keys(st.get().devs)) {
      const X0 = st.get().devs[id];
      if (!X0 || X0.kind !== "switch") continue;
      const xt0 = eff(X0);
      if (!xt0.domain || (xt0.mode !== "server" && xt0.mode !== "client")) continue;
      for (const yid of peers(st.get(), id)) {
        const X = st.get().devs[id],
          Y = st.get().devs[yid],
          xt = eff(X),
          yt = eff(Y),
          adopt = !yt.domain;
        if (!adopt && yt.domain !== xt.domain) continue; // different domain
        if ((yt.pw ?? "") !== (xt.pw ?? "")) continue; // password / MD5 mismatch
        if (yt.version !== xt.version) continue; // versions are not compatible
        const newer = yt.rev < xt.rev;
        if (!adopt && !newer) continue;
        st.update(yid, (y) => {
          const t = (y.vtp ??= mk());
          if (adopt) t.domain = xt.domain;
          if (newer) {
            t.rev = xt.rev;
            y.vlans = { ...X.vlans };
            t.sig = JSON.stringify(X.vlans);
          }
        });
        changed = true;
      }
    }
    if (!changed) break;
  }
}
if (!afterSubmit.includes(vtpSync)) afterSubmit.push(vtpSync);