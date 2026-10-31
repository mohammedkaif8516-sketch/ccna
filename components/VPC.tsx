/**
 * VPC.tsx — a clickable end host with a VPCS-style console (as used in EVE-NG / GNS3).
 *
 *   <VPC id="VPC7" x={60} y={470} />
 *   <VPC id="VPC8" x={240} y={470} init={(d) => { d.ifaces.eth0.ip = "192.168.1.2"; d.ifaces.eth0.mask = "255.255.255.0"; d.gw = "192.168.1.100"; }} />
 *
 * Commands: ip <addr>[/len] [gateway] · show · show ip · ping <ip> [-c n] · trace <ip> · arp · clear arp|ip
 *           save · load · set pcname <name> · dhcp · version · help · cls     (Tab completes, ↑/↓ history)
 */
import {
  type Dev, type Engine, type Ctx, type Fx, DeviceNode, newDev, preconfigure, registerEngine, useRegister, useDev,
  isIp, isMask, lenMask, maskLen, netOf, macOf, macColon, probe, traceRoute, snapshot, restore,
} from "./netsim";

export function VPCIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 56 46" aria-hidden>
      <rect x="8" y="2" width="36" height="28" rx="2" fill="#2b3a47" /><rect x="12" y="6" width="28" height="19" fill="#9fb6c6" />
      <path d="M12 6h28v6L12 25z" fill="#c9d9e4" opacity=".55" />
      <path d="M4 34h44l4 8H0z" fill="#4a5d6e" /><rect x="14" y="36.5" width="24" height="2" rx="1" fill="#2b3a47" />
    </svg>
  );
}

const COMMANDS: [string, string][] = [
  ["ip", "ip <addr>[/len] [gateway]   set the address (e.g. ip 192.168.1.1/24 192.168.1.100)"],
  ["show", "show [ip | arp]           display addressing"], ["ping", "ping <ip> [-c count]      send ICMP echo requests"],
  ["trace", "trace <ip>                trace the path to a host"], ["arp", "arp                       show the ARP cache"],
  ["clear", "clear ip | arp            remove the address / flush ARP"], ["save", "save                      write config to startup (survives load)"],
  ["load", "load                      restore the saved config"], ["set", "set pcname <name>        rename this host"],
  ["dhcp", "dhcp                      request an address (no DHCP server in this lab)"], ["version", "version                   show version"],
  ["cls", "cls                       clear the screen"], ["help", "help                      this list"],
];
const vmac = (d: Dev) => "00:50:79:" + macColon(macOf(d.id, "eth0")).slice(9);
const cidr = (d: Dev) => (d.ifaces.eth0.ip ? `${d.ifaces.eth0.ip}/${maskLen(d.ifaces.eth0.mask!)}` : "0.0.0.0/0");

function setIp(c: Ctx, args: string[]) {
  const d = c.dev, i = d.ifaces.eth0;
  if (!args.length) return c.out("Usage: ip <addr>[/len] [gateway]");
  const [a0, ...rest] = args, [ip, l0] = a0.split("/");
  if (!isIp(ip)) return c.out(`Invalid address: ${a0}`);
  let len = l0 ? +l0 : 24, gw: string | undefined, mask: string | undefined;
  for (const r of rest) { if (/^\d{1,2}$/.test(r)) len = +r; else if (isMask(r) && !gw && r.startsWith("255")) mask = r; else if (isIp(r)) gw = r; else return c.out(`Invalid argument: ${r}`); }
  if (!(len >= 1 && len <= 32)) return c.out("Invalid mask length");
  mask = mask ?? lenMask(len);
  if (gw && netOf(gw, mask) !== netOf(ip, mask)) return c.out(`Gateway ${gw} is not in the same subnet as ${ip}`);
  i.ip = ip; i.mask = mask; d.gw = gw;
  c.out("Checking for duplicate address...", `${d.hostname} : ${ip} ${mask}${gw ? ` gateway ${gw}` : ""}`);
}
function doPing(c: Ctx, args: string[]) {
  const dst = args[0]; if (!isIp(dst)) return c.out(dst ? `Invalid address: ${dst}` : "Usage: ping <ip> [-c count]");
  const ci = args.indexOf("-c"), n = ci > 0 ? Math.min(Math.max(+args[ci + 1] || 5, 1), 20) : 5;
  const fx: Fx[] = [], p = probe(c.view(), c.dev.id, dst, fx);
  if (p.kind === "local") return c.out(`host (${c.dev.gw && p.why !== "noip" ? c.dev.gw : dst}) not reachable`);
  for (let k = 1; k <= n; k++) {
    const ms = (p.ms * (1 + (k % 3) * 0.08) + (k === 1 ? 0.4 : 0)).toFixed(3);
    if (p.kind === "reply") c.out(`84 bytes from ${dst} icmp_seq=${k} ttl=${p.ttl} time=${ms} ms`);
    else if (p.kind === "timeout") c.out(`${dst} icmp_seq=${k} timeout`);
    else c.out(`*${p.from} icmp_seq=${k} ttl=${p.ttl} time=${ms} ms (ICMP type:3, code:${p.kind === "net" ? 0 : 1}, Destination ${p.kind} unreachable)`);
  }
  c.fx.push(...fx);
}
function doTrace(c: Ctx, args: string[]) {
  const dst = args[0]; if (!isIp(dst)) return c.out("Usage: trace <ip>");
  const fx: Fx[] = [], rows = traceRoute(c.view(), c.dev.id, dst, fx, 8);
  if (rows.length === 1 && !rows[0].ip) return c.out(`host (${dst}) not reachable`);
  c.out(`trace to ${dst}, 8 hops max, press Ctrl+C to stop`);
  rows.forEach((r, i) => {
    const t = (3 + i * 2) / 10;
    c.out(r.ip ? ` ${i + 1}   ${r.mark ? "*" : ""}${r.ip}   ${t.toFixed(3)} ms  ${(t + 0.1).toFixed(3)} ms  ${(t + 0.05).toFixed(3)} ms${r.mark ? `  (ICMP type:3, code:${r.mark === "!N" ? 0 : 1})` : ""}` : ` ${i + 1}   *  *  *`);
  });
  c.fx.push(...fx);
}

export const vpcEngine: Engine = {
  prompt: (d) => `${d.hostname}> `,
  run(c, line) {
    const [cmd, ...a] = line.trim().split(/\s+/), d = c.dev, i = d.ifaces.eth0, k = cmd.toLowerCase();
    c.words = [cmd]; c.toks = [{ t: cmd, pos: 0 }];
    switch (k) {
      case "ip": if (a[0]?.toLowerCase() === "dhcp") return c.out("DDORA: no DHCP server responded"); return setIp(c, a);
      case "dhcp": return c.out("DDORA: no DHCP server responded");
      case "show":
        if (a[0]?.toLowerCase().startsWith("ip")) return c.out(`NAME        : ${d.hostname}[1]`, `IP/MASK     : ${cidr(d)}`, `GATEWAY     : ${d.gw ?? "0.0.0.0"}`, "DNS         :", `MAC         : ${vmac(d)}`, "LPORT       : 20000", "RHOST:PORT  : 127.0.0.1:30000", "MTU         : 1500");
        if (a[0]?.toLowerCase().startsWith("arp")) return vpcEngine.run(c, "arp");
        return c.out("NAME   IP/MASK              GATEWAY           MAC", `${d.hostname.padEnd(7)}${cidr(d).padEnd(21)}${(d.gw ?? "").padEnd(18)}${vmac(d)}`);
      case "ping": return doPing(c, a);
      case "trace": case "tracert": return doTrace(c, a);
      case "arp": {
        const e = Object.entries(d.arp);
        return c.out(...(e.length ? e.map(([ip, v]) => `${"00:50:79:" + macColon(v.mac).slice(9)}  ${ip} expires in ${110 - e.length} seconds`) : ["ARP table is empty"]));
      }
      case "clear":
        if (a[0]?.toLowerCase() === "arp") { d.arp = {}; return; }
        if (a[0]?.toLowerCase() === "ip") { i.ip = i.mask = undefined; d.gw = undefined; return; }
        return c.out("Usage: clear ip | arp");
      case "save": d.startup = snapshot(d); return c.out("Saving startup configuration to startup.vpc", ".  done");
      case "load": restore(d, d.startup ?? d.blank); return c.out("Executing the startup file", d.startup ? "Done" : "(nothing saved yet)");
      case "set": if (a[0] === "pcname" && a[1]) { d.hostname = a[1]; return; } return c.out("Usage: set pcname <name>");
      case "version": return c.out("Welcome to Virtual PC Simulator, version 0.8.2 (netlab)");
      case "cls": c.flags.cls = true; return;
      case "help": case "?": return c.out(...COMMANDS.map((x) => x[1]));
      default: return c.out(`*** Unknown command: ${line.trim()}`);
    }
  },
  answer() {},
  help: (_c, line) => { const p = line.trim().toLowerCase(); return COMMANDS.filter((x) => x[0].startsWith(p)).map((x) => x[1]); },
  complete: (_c, line) => { if (/\s/.test(line) || !line) return; const m = COMMANDS.filter((x) => x[0].startsWith(line.toLowerCase())); return m.length === 1 ? m[0][0] + " " : undefined; },
};
registerEngine("vpc", vpcEngine);

export interface VPCProps {
  id: string; x: number; y: number; label?: string;
  /** pre-configure: set d.ifaces.eth0.ip / .mask and d.gw */
  init?: (d: Dev) => void;
}
export function makeVpc({ id, x, y, label, init }: VPCProps): Dev {
  const h = label ?? id;
  return preconfigure(newDev("vpc", id, x, y, h, { eth0: { shut: false } }, [`${h} — Virtual PC. Try:  ip 192.168.1.1/24 192.168.1.100   then   show ip   and   ping`, ""]), init);
}
export default function VPC(p: VPCProps) {
  useRegister(() => makeVpc(p));
  const d = useDev(p.id);
  return <DeviceNode id={p.id} icon={<VPCIcon />} sub={d?.ifaces.eth0.ip ? cidr(d) : "no ip"} />;
}