import type { ComponentType } from "react";

export type LabKeyLine = { cmd: string; note?: string };
export type LabKeyDevice = { id: string; title?: string; kind: string; lines: LabKeyLine[] };
export type LabExport = { answerKey: LabKeyDevice[] };
type LabModule = { default: ComponentType; LAB_EXPORT: LabExport };

export const LAB_LOADERS: Record<string, () => Promise<LabModule>> = {
  "static-routing-lab-1":     () => import("@/components/labs/static-routing-lab"),
  "asymmetric-routing-lab-2": () => import("@/components/labs/assymetric-lab2"),
  "asymmetric-routing-lab-3": () => import("@/components/labs/assymetric-lab-3"),
  "access-port-lab":          () => import("@/components/labs/access-port-lab"),
  "trunk-lab":                () => import("@/components/labs/manual-trunk-lab"),
  "dtp-trunk-lab":            () => import("@/components/labs/dtp-trunk-lab"),
  "etherchannel-lab":         () => import("@/components/labs/etherch-lab"),
  "intervlan-lab":            () => import("@/components/labs/intervlan-lab"),
  "router-on-a-stick-lab":    () => import("@/components/labs/inter-vlan-sticl-subinterface"),
  "rip-v1-lab":               () => import("@/components/labs/rip-v1"),
  "rip-v2-lab":               () => import("@/components/labs/rip-v2"),
  "eigrp-lab":                () => import("@/components/labs/eigrp-lab"),
  "ospf-lab":                 () => import("@/components/labs/ospf-lab"),
    "mls-ring-all-vlans":       () => import("@/components/labs/mls-ring-lab"),
  "physical-logical-lab":     () => import("@/components/labs/phy-log"),
  "dhcp-intervlan-labs":      () => import("@/components/labs/dhcpintervlanlab"),
  "dhcp-relay-ospf-lab":      () => import("@/components/labs/dhcpospflab"),
  "vtp-labs":                 () => import("@/components/labs/vtp-labs"),
};
  
export const normalizeKey = (
  key: { id: string; kind: string; title?: string; lines: (string | LabKeyLine)[] }[],
): LabKeyDevice[] =>
  key.map((d) => ({
    ...d,
    lines: d.lines.map((l) => (typeof l === "string" ? { cmd: l } : l)),
  }));