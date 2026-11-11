/**
 * Extras.tsx — one import for Router.tsx and Switch.tsx.
 *
 *   routerX  : ACL · NAT · HSRP/VRRP · VPN (GRE / IPsec)
 *   switchX  : ACL (SVIs) · HSRP/VRRP (SVIs) · EtherChannel · port-security · DHCP snooping
 *
 * Each bundle has: global / ifc / priv command lists, modes(m) for the extra config sub-modes,
 * render(d) for global running-config lines and renderIf(i) for per-interface lines.
 */
import type { Dev, E, Iface } from "./netsim";
import { aclGlobalX, aclIfX, aclPrivX, aclModeX, renderAcls, ifAcl } from "./Acl";
import { natGlobalX, natIfX, natPrivX, renderNat, ifNat } from "./Nat";
import { fhrpIfX, fhrpPrivX, ifFhrp } from "./Fhrp";
import { echIfX, echPrivX, ifEch } from "./EtherChannel";
import {
  psIfX, snoopGlobalX, snoopIfX, l2secPrivX, renderSnoop, ifL2sec,
} from "./L2Security";
import {
  vpnGlobalX, vpnIfX, vpnPrivX, isakmpX, transX, cmapX, profX, renderCrypto, ifVpn,
} from "./Vpn";

export interface Bundle {
  global: E[];
  ifc: E[];
  priv: E[];
  modes: (m: string) => E[] | undefined;
  render: (d: Dev) => string[];
  renderIf: (i: Iface) => string[];
}

export const routerX: Bundle = {
  global: [...aclGlobalX, ...natGlobalX, ...vpnGlobalX],
  ifc: [...aclIfX, ...natIfX, ...fhrpIfX, ...vpnIfX],
  priv: [...aclPrivX, ...natPrivX, ...fhrpPrivX, ...vpnPrivX],
  modes: (m) =>
    ({
      "config-std-nacl": aclModeX,
      "config-ext-nacl": aclModeX,
      "config-isakmp": isakmpX,
      "config-crypto-trans": transX,
      "config-crypto-map": cmapX,
      "config-ipsec-profile": profX,
    } as Record<string, E[]>)[m],
  render: (d) => [...renderCrypto(d), ...renderNat(d), ...renderAcls(d)],
  renderIf: (i) => [...ifAcl(i), ...ifNat(i), ...ifFhrp(i), ...ifVpn(i)],
};

export const switchX: Bundle = {
  global: [...aclGlobalX, ...snoopGlobalX],
  ifc: [...aclIfX, ...fhrpIfX, ...echIfX, ...psIfX, ...snoopIfX],
  priv: [...aclPrivX, ...fhrpPrivX, ...echPrivX, ...l2secPrivX],
  modes: (m) =>
    ({ "config-std-nacl": aclModeX, "config-ext-nacl": aclModeX } as Record<string, E[]>)[m],
  render: (d) => [...renderSnoop(d), ...renderAcls(d)],
  renderIf: (i) => [...ifEch(i), ...ifL2sec(i), ...ifAcl(i), ...ifFhrp(i)],
};
