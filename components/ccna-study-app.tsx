"use client";

import { Suspense, lazy, createContext, useContext, useCallback, useEffect, useId, useMemo, useRef, useState, useTransition, type ComponentType, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

// UI Components
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Icons
import {
  ArrowDown, ArrowLeft, ArrowRightLeft, ArrowUp, BookOpen, Brackets,
  Cable, Check, ChevronLeft, ChevronRight, Copy, CornerDownLeft,
  Layers3, ListChecks, Menu, Moon, Network, Orbit, Palette, PanelLeft,
  Route, Router, Search, Sparkles, Sun, Terminal, X
} from "lucide-react";

// Lib & Hooks
import { topics, type Diagram, type NoteBlock, type Subtopic, type Topic } from "@/lib/topics";
import { quizById, quizFor, quizzes, type Quiz } from "@/lib/quizzes";
import { useCompletedTopics, progressKey } from "@/lib/use-completed";
import { useQuizScores, type QuizScore } from "@/lib/use-quiz-score";
import { useVisitHistory, type VisitEntry } from "@/lib/use-visit-history";
import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

// Non-lazy components (small, used frequently)
import { QuizView } from "@/components/simulator/quiz-view";
import { VisitTree } from "@/components/simulator/visit-tree";
import { TopicLanding } from "@/components/simulator/topic-landing";

// Summaries (kept static because they are mostly text/light)
import { IntroNetworkingSummary } from "@/components/summaries/intro-networking-summary";
import { OsiModelExplainer } from "@/components/summaries/osi-model-explainer-summary";
import { EthernetCablingSummary } from "@/components/summaries/ethernet-cabling-summary";
import { SwitchingVlanExplainer } from "@/components/summaries/switching-summary";
import { NetworkDevicesSummary } from "@/components/summaries/network-devices-summary";
import { IpAddressingSummary } from "@/components/summaries/ip-addressing-summary";
import { TransportLayerSummary } from "@/components/summaries/transport-layer-summary";
import { RouterFundamentalsSummary } from "@/components/summaries/router-fundamentals-summary";
import { RoutingSummary } from "@/components/summaries/routing-summary";
import { PacketFlowSummary } from "@/components/summaries/packet-flow-summary";
import { ThreeTierArchitecture } from "@/components/summaries/3-tier-summary";

// ═══════════════════════════════════════════════════════════════
// LAZY LOADED COMPONENTS
// (Heavy labs, simulators, and interactive tools)
// ═══════════════════════════════════════════════════════════════

// Extras & Simulators
const NumberSystemConverter = lazy(() => import("@/components/extras/number-system-converter").then(m => ({ default: m.NumberSystemConverter })));
const IpClassesExplorer = lazy(() => import("@/components/extras/ip-classes-explorer").then(m => ({ default: m.IpClassesExplorer })));
const TcpSimulator = lazy(() => import("@/components/extras/tcp-simulator").then(m => ({ default: m.TcpSimulator })));
const DoraExplorer = lazy(() => import("@/components/extras/dhcp-dora").then(m => ({ default: m.default })));
const DhcpServerConfig = lazy(() => import("@/components/extras/dhcp-conf").then(m => ({ default: m.default })));
const OsiModel = lazy(() => import("@/components/extras/extra-example").then(m => ({ default: m.OsiModel })));
const DnsResolution = lazy(() => import("@/components/extras/extra-example-2").then(m => ({ default: m.DnsResolution })));
const TcpHttp = lazy(() => import("@/components/extras/extra-example-3").then(m => ({ default: m.TcpHttp })));

// Misc / Packet Flows
const PacketFlowSimulator = lazy(() => import("@/components/misc/packet-flow-intra").then(m => ({ default: m.PacketFlowSimulator })));
const ReplyPacketFlow = lazy(() => import("@/components/misc/packet-flow-inter-2").then(m => ({ default: m.ReplyPacketFlow })));
const RoutedPacketFlow = lazy(() => import("@/components/misc/packet-flow-inter-1").then(m => ({ default: m.RoutedPacketFlow })));
const VlanConcepts = lazy(() => import("@/components/misc/vlan-basics").then(m => ({ default: m.VlanConcepts })));
const AccessPortLab = lazy(() => import("@/components/misc/access-port").then(m => ({ default: m.AccessPortLab })));
const TrunkPortLab = lazy(() => import("@/components/misc/trunk-port").then(m => ({ default: m.TrunkPortLab })));
const TrunkConfigLab = lazy(() => import("@/components/misc/trunk-lab").then(m => ({ default: m.TrunkConfigLab })));
const InterVlanRoutingLab = lazy(() => import("@/components/misc/inter-vlan-lab"));
const MlsEigrpOspfLab = lazy(() => import("@/components/misc/MlsEigrpOspfLab"));

// Labs
const StaticRoutingLab = lazy(() => import("@/components/labs/static-routing-lab").then(m => ({ default: m.StaticRoutingLab })));
const AsymmetricRoutingLab = lazy(() => import("@/components/labs/assymetric-lab2").then(m => ({ default: m.AsymmetricRoutingLab })));
const AsymmetricRoutingLab3 = lazy(() => import("@/components/labs/assymetric-lab-3").then(m => ({ default: m.AsymmetricRoutingLab3 })));
const RipV1Lab = lazy(() => import("@/components/labs/rip-v1").then(m => ({ default: m.RipV1Lab })));
const RipV2Lab = lazy(() => import("@/components/labs/rip-v2").then(m => ({ default: m.RipV2Lab })));
const EigrpLab = lazy(() => import("@/components/labs/eigrp-lab").then(m => ({ default: m.EigrpLab })));
const OspfLab = lazy(() => import("@/components/labs/ospf-lab").then(m => ({ default: m.OspfLab })));
const AccessPortLabS = lazy(() => import("@/components/labs/access-port-lab").then(m => ({ default: m.AccessPortLabS })));
const TrunkLab = lazy(() => import("@/components/labs/manual-trunk-lab"));
const DtpTrunkLab = lazy(() => import("@/components/labs/dtp-trunk-lab"));
const InterVlanLab = lazy(() => import("@/components/labs/intervlan-lab"));
const EtherChannelLab = lazy(() => import("@/components/labs/etherch-lab"));
const PhysicalLogicalLab = lazy(() => import("@/components/labs/phy-log"));
const MlsRingLab = lazy(() => import("@/components/labs/mls-ring-lab"));
const RouterOnAStickLab = lazy(() => import("@/components/labs/inter-vlan-sticl-subinterface"));
const DhcpInterVlanLabs = lazy(() => import("@/components/labs/dhcpintervlanlab"));
const DhcpRelayOspfLab = lazy(() => import("@/components/labs/dhcpospflab"));
const DhcpRelayOspfLabAcl = lazy(() => import("@/components/labs/dhcpospflabacl"));
const VtpLabs = lazy(() => import("@/components/labs/vtp-labs"));
const DhcpServerLabs = lazy(() => import("@/components/labs/dhcp-server-lab"));
const NatOspfDiamondLab = lazy(() => import("@/components/labs/nat-ospf-lab"));
const SwitchForwardingMethods = lazy(() => import("@/components/labcp/sw-fw").then(m => ({ default: m.SwitchForwardingMethods })));

// Sections (Simulator)
const Section01Intro = lazy(() => import("@/components/simulator/Section01Intro"));
const Section02PhysicalLayer = lazy(() => import("@/components/simulator/Section02PhysicalLayer"));
const Section03DataLinkLayer = lazy(() => import("@/components/simulator/Section03DataLinkLayer"));
const Section04VlansTrunks = lazy(() => import("@/components/simulator/Section04VlansTrunks"));
const Section05LoopsStpLacp = lazy(() => import("@/components/simulator/Section05LoopsStpLacp"));
const Section06NetworkLayerArp = lazy(() => import("@/components/simulator/Section06NetworkLayerIpArp"));
const Section07Routers = lazy(() => import("@/components/simulator/Section07Routers"));
const Section08DhcpDns = lazy(() => import("@/components/simulator/Section08DhcpDns"));
const Section09PrivateIpNat = lazy(() => import("@/components/simulator/Section09PrivateIpNat"));
const Section10TransportLayer = lazy(() => import("@/components/simulator/Section10TransportLayer"));
const Section11SecurityOutro = lazy(() => import("@/components/simulator/Section11SecurityOutro"));

const NetworkTypes = lazy(() => import("./simulator/network-types"));
const NetworkArchitectures = lazy(() => import("./simulator/network-architecture"));
const NetworkCabling = lazy(() => import("./simulator/network-cabling"));
const ApplicationPresentationLayers = lazy(() => import("./simulator/application-presentation"));
const SessionLayer = lazy(() => import("./simulator/session-layer"));
const TransportLayer = lazy(() => import("./simulator/transport-layer"));
const NetworkLayer = lazy(() => import("./simulator/network-layer").then(m => ({ default: m.default })));
const DataLinkLayer = lazy(() => import("./simulator/data-link-layer"));
const PhysicalLayer = lazy(() => import("./simulator/physical-layer"));
const Hubs = lazy(() => import("./simulator/hubs"));
const Switches = lazy(() => import("./simulator/switches"));
const Routers = lazy(() => import("./simulator/Routers"));
// ─────────────────────────────────────────────────────────────
// Animations preference (hydration-safe)
// ─────────────────────────────────────────────────────────────
const ANIM_STORAGE_KEY = "app-animations";

type AnimationsCtx = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  toggle: () => void;
};

const AnimationsContext = createContext<AnimationsCtx>({
  enabled: true,
  setEnabled: () => {},
  toggle: () => {},
});

function AnimationsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  // First visit: respect OS "reduce motion". Otherwise use saved value.
  useEffect(() => {
    let initial = true;
    try {
      const stored = localStorage.getItem(ANIM_STORAGE_KEY);
      initial =
        stored !== null
          ? stored === "true"
          : !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    setEnabledState(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.animations = enabled ? "on" : "off";
    try {
      localStorage.setItem(ANIM_STORAGE_KEY, String(enabled));
    } catch {}
  }, [enabled, ready]);

  const setEnabled = useCallback((v: boolean) => setEnabledState(v), []);
  const toggle = useCallback(() => setEnabledState((v) => !v), []);

  const value = useMemo(
    () => ({ enabled, setEnabled, toggle }),
    [enabled, setEnabled, toggle],
  );

  return (
    <AnimationsContext.Provider value={value}>
      {children}
    </AnimationsContext.Provider>
  );
}

const useAnimations = () => useContext(AnimationsContext);
// ─────────────────────────────────────────────────────────────
// Summary pages
// ─────────────────────────────────────────────────────────────
const SUMMARY_VIEWS: Record<string, ComponentType> = {
  intro: IntroNetworkingSummary,
  osi: OsiModelExplainer,
  ethernet: EthernetCablingSummary,
  devices: NetworkDevicesSummary,
  ip: IpAddressingSummary,
  transport: TransportLayerSummary,
  router: RouterFundamentalsSummary,
  routing: RoutingSummary,
  packetflow: PacketFlowSummary,
  switching: SwitchingVlanExplainer,
};

const THEMES = [
  { id: "glass", label: "Default Glass", colors: ["#6D28D9", "#3B82F6"] },
  { id: "synthwave", label: "Synthwave", colors: ["#ff2e97", "#00f0ff"] },
  { id: "terminal", label: "Terminal", colors: ["#39ff6a", "#ffb000"] },
  { id: "deco", label: "Art Deco", colors: ["#d9b45a", "#0f5c4a"] },
  { id: "biolum", label: "Bioluminescent", colors: ["#19e3d0", "#7dff9b"] },
  { id: "ink", label: "Japanese Ink", colors: ["#c63d2f", "#2c4a6e"] },
  { id: "forest", label: "Autumn Forest", colors: ["#c2571a", "#5b7a3a"] },
  { id: "blueprint", label: "Blueprint", colors: ["#1d4ed8", "#e8590c"] },
] as const;

const STORAGE_KEY = "app-theme";

function useColorTheme() {
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "glass";
    } catch {
      return "glass";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  return [theme, setTheme] as const;
}


function AnimationToggle() {
  const { enabled, toggle } = useAnimations();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = () => {
    toggle();
    setShowTooltip(true);
  };

  useEffect(() => {
    if (!showTooltip) return;
    const timer = setTimeout(() => setShowTooltip(false), 2000);
    return () => clearTimeout(timer);
  }, [showTooltip]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative group"
      aria-label={enabled ? "Turn animations off" : "Turn animations on"}
      aria-pressed={enabled}
      onClick={handleToggle}
    >
      <Sparkles
        className={`size-4 transition-colors ${
          enabled ? "text-primary" : "text-muted-foreground"
        }`}
      />
      {!enabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded bg-muted-foreground"
        />
      )}

      <span
        role="status"
        className={`pointer-events-none absolute top-full mt-2 right-0 z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background shadow transition-opacity duration-200 ${
          showTooltip ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {enabled ? "Animations: on" : "Animations: off"}
      </span>
    </Button>
  );
}
function ThemeSwitcher() {
  const [theme, setTheme] = useColorTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          role="menu"
          className="w-56 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="menuitemradio"
              aria-checked={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex -space-x-1">
                {t.colors.map((c) => (
                  <span
                    key={c}
                    className="size-4 rounded-full ring-2 ring-popover"
                    style={{ background: c }}
                  />
                ))}
              </span>
              <span className="flex-1">{t.label}</span>
              {theme === t.id && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        aria-expanded={open}
        className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Palette className="size-5" />
      </button>
    </div>
  );
}
const ExtraPlaceholder = () => (
  <div className="p-4 border rounded-xl mt-6">Extra content coming soon...</div>
);

// Mapping of subtopic slugs to their Extra components
const EXTRA_VIEWS: Record<string, ComponentType> = {
  "physical-layer-binary-format-physical-transmission": OsiModel,
  "network-architectures-client-server-mainframe-terminal-peer-to-peer":
    DnsResolution,
  "protocol-numbers-and-port-ranges-well-known-registered-ephemeral": TcpHttp,
};
// ─────────────────────────────────────────────────────────────
// Lab registry — slug → component. Replaces the slug === chain.
// ─────────────────────────────────────────────────────────────
const group = (C: ComponentType<any>, slugs: string[]) =>
  Object.fromEntries(slugs.map((s) => [s, C])) as Record<
    string,
    ComponentType<any>
  >;

const LAB_VIEWS: Record<string, ComponentType<any>> = {
  // ── Interactive calculators / single-subtopic labs ──
  "subnetting-calculations": SubnetCalculator,
  "number-system-conversions-hex-to-binary": NumberSystemConverter,
  "ip-address-classes-a-b-c-d-e-and-default-subnet-masks": IpClassesExplorer,
  "tcp-handshakes-3-way-4-way": TcpSimulator,
  "packet-flow-within-the-same-network": PacketFlowSimulator,
  "upper-layers-application-presentation": ApplicationPresentationLayers,
  "session-layer-simplex-half-duplex-full-duplex": SessionLayer,
  "transport-layer-segmentation-sequencing-mtu-pdu-tcp-vs-udp-error-control-flow-control-sliding-windowing":
    TransportLayer,
  "network-layer-packets-ip-headers-routing-basics": NetworkLayer,
  "data-link-layer-frames-mac-addressing-oui-cam-tables": DataLinkLayer,
  "physical-layer-binary-format-physical-transmission": PhysicalLayer,
  "hubs-csma-cd-half-duplex-broadcast-collision-domains": Hubs,
  "switches-mac-cam-tables-intelligent-forwarding-manageable-vs-non-manageable-layer-2-vs-layer-3-mls-asic":
    Switches,
  "routers-routing-tables-l3-forwarding-decisions": Routers,
  "types-of-communication-unicast-multicast-broadcast-anycast": Switches,
  "packet-flow-between-networks-forward-path": RoutedPacketFlow,
  "packet-flow-between-networks-reply-path": ReplyPacketFlow,
  "dhcp-dora-process-frame-structure": DoraExplorer,
  "dhcp-configuration-on-cisco-router-mls": DhcpServerConfig,
  "static-routing-lab-1": StaticRoutingLab,
  "traffic-forwarding-methods-in-switches": SwitchForwardingMethods,
  "cisco-3-tier-network-architecture": ThreeTierArchitecture,
  "vlan-concepts-ranges-and-advantages": VlanConcepts,
  "types-of-networks-lan-wan-man-san-can-pan-vpn": NetworkTypes,
  "network-architectures-client-server-mainframe-terminal-peer-to-peer":
    NetworkArchitectures,
  "power-over-ethernet-poe": NetworkCabling,
  "vlan-ports-access-port-configuration": AccessPortLab,
  "trunk-ports-and-frame-tagging-isl-vs-dot1q": TrunkPortLab,
  "trunk-configuration-verification-and-troubleshooting": TrunkConfigLab,
  "dhcp-intervlan-labs": DhcpInterVlanLabs,
  "dhcp-server-labs": DhcpServerLabs,
  "inter-vlan-routing-mls-and-svi": InterVlanRoutingLab,
  "mls-eigrp-ospf-lab": MlsEigrpOspfLab,
  "asymmetric-routing-lab-2": AsymmetricRoutingLab,
  "asymmetric-routing-lab-3": AsymmetricRoutingLab3,
  "rip-v1-lab": RipV1Lab,
  "rip-v2-lab": RipV2Lab,
  "eigrp-lab": EigrpLab,
  "ospf-lab": OspfLab,
  "access-port-lab": AccessPortLabS,
  "trunk-lab": TrunkLab,
  "dtp-trunk-lab": DtpTrunkLab,
  "etherchannel-lab": EtherChannelLab,
  "intervlan-lab": InterVlanLab,
  "dhcp-relay-ospf-lab-acl": DhcpRelayOspfLabAcl,
  "physical-logical-lab": PhysicalLogicalLab,
  "mls-ring-all-vlans": MlsRingLab,
  "router-on-a-stick-lab": RouterOnAStickLab,
  "dhcp-relay-ospf-lab": DhcpRelayOspfLab,
  "vtp-labs": VtpLabs,
  "nat-ospf-diamond-lab": NatOspfDiamondLab,
  "subnet-masks-network-and-host-portions": Section06NetworkLayerArp,
  "arp-and-the-arp-table": Section06NetworkLayerArp,
  "life-of-a-packet-on-one-network": Section06NetworkLayerArp,
  "routers-and-the-default-gateway": Section07Routers,
  "routing-tables": Section07Routers,
  "static-dynamic-and-default-routes": Section07Routers,
  "dhcp-and-the-dora-process": Section08DhcpDns,
  "dns-names-to-ip-addresses": Section08DhcpDns,
  "private-and-public-ip-addresses": Section09PrivateIpNat,
  "ipv4-exhaustion-and-ipv6": Section09PrivateIpNat,
  "nat-and-pat": Section09PrivateIpNat,
  "ports-and-common-services": Section10TransportLayer,
  segments: Section10TransportLayer,
  "tcp-vs-udp": Section10TransportLayer,
  "access-control-lists": Section11SecurityOutro,
  firewalls: Section11SecurityOutro,

  // ── Section groups (one component, several slugs) ──
  ...group(Section01Intro, [
    "mac-address-the-foundation-of-networking",
    "the-four-layers-from-the-ground-up",
  ]),
  ...group(Section02PhysicalLayer, [
    "bits-bytes-and-point-to-point-networks",
    "copper-fiber-and-wi-fi",
    "why-you-cannot-cable-every-device",
  ]),
  ...group(Section03DataLinkLayer, [
    "switches-and-frames",
    "unicast-broadcast-and-multicast",
    "mac-address-table-learning-forwarding-and-flooding",
  ]),
  ...group(Section04VlansTrunks, [
    "why-vlans-exist",
    "assigning-ports-to-vlans",
    "trunk-ports-and-vlan-tags",
  ]),
  ...group(Section05LoopsStpLacp, [
    "switch-loops-and-broadcast-storms",
    "spanning-tree-protocol",
    "bottlenecks-and-lacp",
  ]),
  ...group(Section06NetworkLayerArp, [
    "why-ip-addresses",
    "subnet-masks-network-and-host-portions",
    "arp-and-the-arp-table",
    "life-of-a-packet-on-one-network",
  ]),
  ...group(Section07Routers, [
    "routers-and-the-default-gateway",
    "routing-tables",
    "static-dynamic-and-default-routes",
  ]),
  ...group(Section08DhcpDns, [
    "dhcp-and-the-dora-process",
    "dns-names-to-ip-addresses",
  ]),
  ...group(Section09PrivateIpNat, [
    "private-and-public-ip-addresses",
    "ipv4-exhaustion-and-ipv6",
    "nat-and-pat",
  ]),
  ...group(Section10TransportLayer, [
    "ports-and-common-services",
    "segments",
    "tcp-vs-udp",
  ]),
  ...group(Section11SecurityOutro, ["access-control-lists", "firewalls"]),
};

// Tools and labs that should always render, even with animations off.
const ALWAYS_RENDER = new Set([
  // Interactive tools / calculators
  "subnetting-calculations",
  "number-system-conversions-hex-to-binary",
  "ip-address-classes-a-b-c-d-e-and-default-subnet-masks",
  
  // Routing Labs
  "static-routing-lab-1",
  "asymmetric-routing-lab-2",
  "asymmetric-routing-lab-3",
  "rip-v1-lab",
  "rip-v2-lab",
  "eigrp-lab",
  "ospf-lab",

  // Switching Labs
  "access-port-lab",
  "trunk-lab",
  "dtp-trunk-lab",
  "etherchannel-lab",
  "intervlan-lab",
  "router-on-a-stick-lab",
  "physical-logical-lab",
  "mls-ring-all-vlans",
  "dhcp-intervlan-labs",
  "dhcp-server-labs",
  "dhcp-relay-ospf-lab",
  "vtp-labs",
  "dhcp-relay-ospf-lab-acl",
  "nat-ospf-diamond-lab",
]);

function LabStage({ slug }: { slug: string }) {
  const { enabled, setEnabled } = useAnimations();
  const LabView = LAB_VIEWS[slug];
  if (!LabView) return null;

  if (!enabled && !ALWAYS_RENDER.has(slug)) {
    return null;
  }

  return (
    <div className="mt-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/40" />}>
        <LabView key={slug} />
      </Suspense>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
// Helper: convert dotted IP to 32-bit uint and back
// ─────────────────────────────────────────────────────────────
function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums.reduce((acc, n) => (acc * 256 + n) >>> 0, 0);
}

function intToIp(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function prefixForHosts(hosts: number): number {
  let needed = 1;
  while (needed < hosts + 2) needed *= 2;
  return 32 - Math.log2(needed);
}

type GroupBlock = {
  name: string | null;
  items: Subtopic[];
  quiz?: Quiz;
};

type Block = {
  label: string;
  requested: number;
  prefix: number;
  blockSize: number;
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  usable: number;
  waste: number;
};

type SearchItem = {
  topic: Topic;
  subtopic: Subtopic;
  haystack: string;
  title: string;
};

const MAX_RESULTS = 10;

export function SubnetPlanner() {
  const [baseIp, setBaseIp] = useState("192.168.10.0");
  const [baseCidr, setBaseCidr] = useState("24");
  const [needsText, setNeedsText] = useState("35, 40, 50, 45");
  const [mode, setMode] = useState<"vlsm" | "flsm">("vlsm");

  const result = useMemo(() => {
    const baseInt = ipToInt(baseIp);
    const basePrefix = Number(baseCidr);
    if (baseInt === null) return { error: "Enter a valid base IPv4 address." };
    if (!Number.isInteger(basePrefix) || basePrefix < 0 || basePrefix > 32)
      return { error: "CIDR must be a whole number from 0 to 32." };

    const needs = needsText
      .split(/[\s,]+/)
      .map((x) => Number(x))
      .filter((x) => x > 0);
    if (needs.length === 0)
      return { error: "Enter at least one host requirement." };
    if (needs.some((n) => !Number.isInteger(n)))
      return { error: "Host requirements must be whole numbers." };

    const baseMask =
      basePrefix === 0 ? 0 : (0xffffffff << (32 - basePrefix)) >>> 0;
    const parentNetwork = (baseInt & baseMask) >>> 0;
    const parentSize = 2 ** (32 - basePrefix);

    const sorted = [...needs].sort((a, b) => b - a);
    const uniformPrefix = mode === "flsm" ? prefixForHosts(sorted[0]) : null;

    const blocks: Block[] = [];
    let cursor = parentNetwork;
    const parentEnd = parentNetwork + parentSize - 1;

    for (let i = 0; i < sorted.length; i++) {
      const requested = sorted[i];
      const prefix =
        mode === "flsm" ? uniformPrefix! : prefixForHosts(requested);

      if (prefix < basePrefix) {
        return {
          error: `Block ${i + 1} needs ${requested} hosts, which is larger than the /${basePrefix} parent network.`,
        };
      }
      const blockSize = 2 ** (32 - prefix);
      const aligned = Math.ceil(cursor / blockSize) * blockSize;
      const network = aligned;
      const broadcast = network + blockSize - 1;
      if (broadcast > parentEnd) {
        return {
          error: "Not enough space in the parent network for all requirements.",
        };
      }
      const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : blockSize - 2;
      blocks.push({
        label: `N${i + 1}`,
        requested,
        prefix,
        blockSize,
        network,
        broadcast,
        firstHost: prefix >= 31 ? network : network + 1,
        lastHost: prefix >= 31 ? broadcast : broadcast - 1,
        usable,
        waste: usable - requested,
      });
      cursor = broadcast + 1;
    }

    const used = cursor - parentNetwork;
    const free = parentSize - used;

    return {
      error: "",
      basePrefix,
      parentNetwork,
      parentSize,
      blocks,
      used,
      free,
      uniformPrefix,
    };
  }, [baseIp, baseCidr, needsText, mode]);

  const colors = [
    "#1971c2",
    "#2f9e44",
    "#e8590c",
    "#862e9c",
    "#c92a2a",
    "#0c8599",
    "#f08c00",
    "#5f3dc4",
  ];

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Subnet planner</CardTitle>
            <CardDescription className="mt-1">
              Enter a base network and how many PCs each subnet needs.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-5 inline-flex rounded-lg border bg-background p-1">
          <button
            type="button"
            onClick={() => setMode("flsm")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "flsm"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            FLSM — fixed size
          </button>
          <button
            type="button"
            onClick={() => setMode("vlsm")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "vlsm"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            VLSM — variable size
          </button>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid gap-4 sm:grid-cols-[1fr_140px_2fr]"
        >
          <label className="text-xs font-medium">
            Base network
            <Input
              value={baseIp}
              onChange={(e) => setBaseIp(e.target.value)}
              className="mt-2 bg-background"
              placeholder="192.168.10.0"
            />
          </label>
          <label className="text-xs font-medium">
            CIDR
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                /
              </span>
              <Input
                value={baseCidr}
                onChange={(e) => setBaseCidr(e.target.value)}
                className="bg-background pl-7"
                inputMode="numeric"
              />
            </div>
          </label>
          <label className="text-xs font-medium">
            Hosts per subnet (comma separated)
            <Input
              value={needsText}
              onChange={(e) => setNeedsText(e.target.value)}
              className="mt-2 bg-background"
              placeholder="35, 40, 50, 45"
            />
          </label>
        </form>

        {result.error && (
          <p role="alert" className="mt-4 text-xs font-medium text-destructive">
            {result.error}
          </p>
        )}

        {!result.error && "blocks" in result && (
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-xs text-muted-foreground">
              {mode === "flsm" ? (
                <>
                  <span className="font-semibold text-foreground">FLSM:</span>{" "}
                  every subnet gets the same size — /{result.uniformPrefix} —
                  because it fits the largest requirement.
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">VLSM:</span>{" "}
                  each subnet gets the smallest block that fits its own
                  requirement.
                </>
              )}
            </p>

            <VerticalSubnetLine
              blocks={result.blocks!}
              parentNetwork={result.parentNetwork!}
              parentSize={result.parentSize!}
              free={result.free!}
              basePrefix={result.basePrefix!}
              colors={colors}
              intToIp={intToIp}
            />

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Block</th>
                    <th className="px-3 py-2 text-left font-medium">Needs</th>
                    <th className="px-3 py-2 text-left font-medium">Prefix</th>
                    <th className="px-3 py-2 text-left font-medium">Size</th>
                    <th className="px-3 py-2 text-left font-medium">Network</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Host range
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Broadcast
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Waste</th>
                  </tr>
                </thead>
                <tbody>
                  {result.blocks!.map((b, i) => (
                    <tr key={b.label} className="border-t">
                      <td
                        className="px-3 py-2 font-semibold"
                        style={{ color: colors[i % colors.length] }}
                      >
                        {b.label}
                      </td>
                      <td className="px-3 py-2">{b.requested}</td>
                      <td className="px-3 py-2 font-mono">/{b.prefix}</td>
                      <td className="px-3 py-2 font-mono">{b.blockSize}</td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(b.network)}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(b.firstHost)} – {intToIp(b.lastHost)}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {intToIp(b.broadcast)}
                      </td>
                      <td className="px-3 py-2 font-mono">{b.waste}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Allocated {result.used} of {result.parentSize} addresses ·{" "}
              {result.free} still free.
              {mode === "flsm"
                ? " FLSM wastes more addresses when requirements differ in size."
                : " Blocks are sorted largest-first so smaller subnets pack into the gaps."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const iconMap = {
  network: Network,
  layers: Layers3,
  cable: Cable,
  router: Router,
  brackets: Brackets,
  terminal: Terminal,
  route: Route,
  "arrow-right-left": ArrowRightLeft,
  orbit: Orbit,
};

function SquareLoader() {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2.5 animate-pulse rounded-[3px] bg-primary"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function DiagramLightbox({
  diagram,
  onClose,
}: {
  diagram: Diagram | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!diagram) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [diagram, onClose]);

  if (!diagram) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={diagram.alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm sm:p-8"
    >
      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-4">
          <img
            src={diagram.src}
            alt={diagram.alt}
            className="max-h-[80vh] w-auto max-w-full object-contain"
          />
        </div>
        {diagram.caption && (
          <figcaption className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
            {diagram.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

function groupSubtopicsWithQuiz(
  subtopics: Subtopic[],
  topicSlug: string,
): GroupBlock[] {
  const groups: GroupBlock[] = [];

  // 1. Custom ordered grouping for Switching
  if (topicSlug === "switching-vlans-and-trunking") {
    const preferredOrder = [
      "Network Design & Switching Architecture",
      "VLAN Fundamentals & Port Membership",
      "VLAN Security & Operations",
      "Layer 3 Services & Inter-VLAN Routing",
      "Trunking Protocols & Operations",
      "EtherChannel (Link Aggregation)",
      "DHCP (Dynamic Host Configuration Protocol)",
    ];

    const seen = new Set<string>();

    // First pass: emit groups in the preferred order
    for (const groupName of preferredOrder) {
      const items = subtopics.filter((s) => s.group === groupName);
      if (items.length === 0) continue;
      seen.add(groupName);
      const group: GroupBlock = { name: groupName, items };
      const q = quizFor(topicSlug, groupName);
      if (q) group.quiz = q;
      groups.push(group);
    }

    // Second pass: catch any group not listed in preferredOrder so nothing
    // is ever silently dropped from the sidebar
    for (const s of subtopics) {
      const name = s.group;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const items = subtopics.filter((x) => x.group === name);
      const group: GroupBlock = { name, items };
      const q = quizFor(topicSlug, name);
      if (q) group.quiz = q;
      groups.push(group);
    }

    return groups;
  }

  // 2. Original logic for all other topics
  const byName = new Map<string | null, GroupBlock>();
  for (const s of subtopics) {
    const name = s.group ?? null;
    let group = byName.get(name);
    if (!group) {
      group = { name, items: [] };
      byName.set(name, group);
      groups.push(group);
    }
    group.items.push(s);
  }

  for (const group of groups) {
    if (!group.name) continue;
    const q = quizFor(topicSlug, group.name);
    if (q) group.quiz = q;
  }

  const hasGroups = subtopics.some((s) => s.group != null);
  const finalQuiz = quizzes.find(
    (q) => q.topicSlug === topicSlug && q.final === true,
  );

  if (
    !hasGroups &&
    !finalQuiz &&
    groups.length === 1 &&
    groups[0].name === null
  ) {
    const topicWideQuiz = quizFor(topicSlug, null);
    if (topicWideQuiz) groups[0].quiz = topicWideQuiz;
  }

  if (!hasGroups && finalQuiz) {
    groups.push({ name: null, items: [], quiz: finalQuiz });
  }

  return groups;
}
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>;
  const re = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded-[2px] bg-primary/15 font-semibold text-foreground"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

function GlobalSearch({
  onSelect,
}: {
  onSelect: (topic: Topic, subtopic: Subtopic) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");

    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);
  const listId = useId();

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform));
  }, []);

  // Global shortcuts: Ctrl/⌘+K and "/"
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        if (query.trim()) setIsOpen(true);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: PointerEvent) {
      const target = e.target as Node;

      const insideSearch = containerRef.current?.contains(target);
      const insideResults = listRef.current?.contains(target);

      if (!insideSearch && !insideResults) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", onDown);

    return () => {
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  // Index built once
  const index = useMemo<SearchItem[]>(
    () =>
      topics.flatMap((topic) =>
        topic.subtopics.map((subtopic) => ({
          topic,
          subtopic,
          title: subtopic.title.toLowerCase(),
          haystack: [
            topic.slug,
            topic.title,
            subtopic.slug,
            subtopic.title,
            subtopic.group || "",
          ]
            .join(" ")
            .toLowerCase(),
        })),
      ),
    [],
  );

  const words = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );

  // Ranked results (best matches first)
  const results = useMemo(() => {
    if (words.length === 0) return [];
    const phrase = words.join(" ");

    return index
      .filter((item) => words.every((w) => item.haystack.includes(w)))
      .map((item) => {
        let score = 0;
        if (item.title === phrase) score += 100;
        if (item.title.startsWith(phrase)) score += 40;
        if (item.title.includes(phrase)) score += 20;
        // Each word that appears in the subtopic title counts for more
        // than a match buried in the slug or group.
        for (const w of words) {
          if (item.title.includes(w)) score += 5;
          if (new RegExp(`\\b${escapeRegExp(w)}`).test(item.title)) score += 3;
        }
        return { ...item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);
  }, [index, words]);

  // Group by topic while keeping a flat index for keyboard navigation
  const groups = useMemo(() => {
    const map = new Map<string, { topic: Topic; items: typeof results }>();
    for (const r of results) {
      const g = map.get(r.topic.slug);
      if (g) g.items.push(r);
      else map.set(r.topic.slug, { topic: r.topic, items: [r] });
    }
    let i = 0;
    return [...map.values()].map((g) => ({
      topic: g.topic,
      items: g.items.map((r) => ({ ...r, flatIndex: i++ })),
    }));
  }, [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Keep the active row visible when navigating by keyboard
  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const commit = useCallback(
    (topic: Topic, subtopic: Subtopic) => {
      onSelect(topic, subtopic);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (query) {
        setQuery("");
      } else {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((p) => (p + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((p) => (p - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      const r = results[activeIndex];
      if (r) commit(r.topic, r.subtopic);
    }
  };
  const resultsPanel = (
    <div className="overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl">
      {results.length > 0 ? (
        <>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Search results"
            className="max-h-[calc(100dvh-150px)] overflow-y-auto overscroll-contain p-1.5"
          >
            {groups.map((group) => (
              <li
                key={group.topic.slug}
                role="presentation"
                className="mb-1 last:mb-0"
              >
                <div className="px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                  <Highlight text={group.topic.title} words={words} />
                </div>

                <ul role="presentation">
                  {group.items.map((r) => {
                    const active = r.flatIndex === activeIndex;

                    return (
                      <li
                        key={`${r.topic.slug}-${r.subtopic.slug}`}
                        id={`${listId}-opt-${r.flatIndex}`}
                        data-index={r.flatIndex}
                        role="option"
                        aria-selected={active}
                      >
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(r.flatIndex)}
                          onClick={() => commit(r.topic, r.subtopic)}
                          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-3 text-left text-sm ${
                            active
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground"
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              <Highlight
                                text={r.subtopic.title}
                                words={words}
                              />
                            </span>

                            {r.subtopic.group && (
                              <span className="block truncate text-xs text-muted-foreground">
                                <Highlight
                                  text={r.subtopic.group}
                                  words={words}
                                />
                              </span>
                            )}
                          </span>

                          <CornerDownLeft
                            aria-hidden
                            className={`size-3.5 shrink-0 text-muted-foreground ${
                              active ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>

          <div className="hidden items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:flex">
            <span>↑ ↓ Navigate · Enter Open · Esc Close</span>

            <span aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"}
            </span>
          </div>
        </>
      ) : (
        <div
          className="flex flex-col items-center gap-1 px-6 py-8 text-center"
          role="status"
        >
          <Search className="mb-2 size-5 text-muted-foreground" />

          <p className="text-sm font-medium">
            No topics match “{query.trim()}”
          </p>

          <p className="text-xs text-muted-foreground">
            Try a shorter term or an abbreviation, like “ospf” or “vlan”.
          </p>
        </div>
      )}
    </div>
  );
  const showPanel = isOpen && query.trim() !== "";
  const activeId = results[activeIndex]
    ? `${listId}-opt-${activeIndex}`
    : undefined;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[220px] sm:w-72 sm:max-w-none"
    >
      {/* Input */}
      <div className="group relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground"
        />
        <Input
          ref={inputRef}
          role="combobox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search topics"
          aria-label="Search topics"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          className="h-9 rounded-sm bg-muted/50 pl-9 pr-16 text-sm shadow-none transition-all focus-visible:bg-background focus-visible:shadow-sm"
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <span className="hidden items-center gap-0.5 sm:flex" aria-hidden>
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </span>
          )}
        </div>
      </div>

      {/* Results panel */}
      {showPanel &&
        createPortal(
          <>
            {/* Mobile backdrop */}
            {isMobile && (
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[9998] bg-black/50"
              />
            )}

            {/* Search results overlay */}
            <div className="fixed inset-x-3 top-[76px] z-[9999] mx-auto max-w-lg overflow-hidden rounded-sm border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 sm:inset-x-auto sm:right-4 sm:top-16 sm:mx-0 sm:w-[400px]">
              {results.length > 0 ? (
                <>
                  <ul
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-label="Search results"
                    className="max-h-[min(60vh,360px)] overflow-y-auto p-1.5"
                  >
                    {groups.map((group) => (
                      <li
                        key={group.topic.slug}
                        role="presentation"
                        className="mb-1 last:mb-0"
                      >
                        <div className="px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                          <Highlight text={group.topic.title} words={words} />
                        </div>
                        <ul role="presentation">
                          {group.items.map((r) => {
                            const active = r.flatIndex === activeIndex;
                            return (
                              <li
                                key={`${r.topic.slug}-${r.subtopic.slug}`}
                                id={`${listId}-opt-${r.flatIndex}`}
                                data-index={r.flatIndex}
                                role="option"
                                aria-selected={active}
                              >
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onMouseEnter={() =>
                                    setActiveIndex(r.flatIndex)
                                  }
                                  onClick={() => commit(r.topic, r.subtopic)}
                                  className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors ${
                                    active
                                      ? "bg-foreground/[0.06] text-foreground"
                                      : "text-foreground/90"
                                  }`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">
                                      <Highlight
                                        text={r.subtopic.title}
                                        words={words}
                                      />
                                    </span>
                                    {r.subtopic.group && (
                                      <span className="block truncate text-xs text-muted-foreground">
                                        <Highlight
                                          text={r.subtopic.group}
                                          words={words}
                                        />
                                      </span>
                                    )}
                                  </span>
                                  <CornerDownLeft
                                    aria-hidden
                                    className={`size-3.5 shrink-0 text-muted-foreground transition-opacity ${
                                      active ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>

                  {/* Footer: keyboard hints (desktop only) */}
                  <div className="hidden items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:flex">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Kbd>
                          <ArrowUp className="size-3" />
                        </Kbd>
                        <Kbd>
                          <ArrowDown className="size-3" />
                        </Kbd>
                        Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <Kbd>
                          <CornerDownLeft className="size-3" />
                        </Kbd>
                        Open
                      </span>
                      <span className="flex items-center gap-1">
                        <Kbd>Esc</Kbd>
                        Close
                      </span>
                    </span>
                    <span aria-live="polite">
                      {results.length}{" "}
                      {results.length === 1 ? "result" : "results"}
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className="flex flex-col items-center gap-1 px-6 py-8 text-center"
                  role="status"
                >
                  <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted">
                    <Search className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">
                    No topics match “{query.trim()}”
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try a shorter term or an abbreviation, like “ospf” or
                    “vlan”.
                  </p>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function StatusDot({ done, active }: { done: boolean; active?: boolean }) {
  return done ? (
    <span className="mt-[3px] grid size-3.5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-2.5" strokeWidth={3} />
    </span>
  ) : (
    <span
      className={`mt-[3px] size-3.5 shrink-0 rounded-full border-[1.5px] transition-colors ${
        active ? "border-primary" : "border-muted-foreground/30"
      }`}
    />
  );
}

const ROW =
  "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs leading-5 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring";
const rowTone = (active: boolean) =>
  active
    ? "bg-primary/10 font-medium text-primary"
    : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground";

/* ───────────────────────── Dashboard ───────────────────────── */

function Dashboard({
  visitHistory,
  onSelectVisit,
  onClearHistory,
}: {
  visitHistory: VisitEntry[];
  onSelectVisit: (entry: VisitEntry) => void;
  onClearHistory: () => void;
}) {
  if (visitHistory.length === 0) {
    return (
      <>
        <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-background px-6">
          <div className="flex max-w-md flex-col items-center text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-[var(--accent-soft)] text-primary ring-1 ring-primary/15">
              <BookOpen className="size-8" strokeWidth={1.5} />
            </span>
            <h1 className="mt-7 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Pick a topic to begin
            </h1>
            <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Choose anything from the curriculum and it opens here. The pages
              you visit are collected on this screen, so you can jump back in
              later.
            </p>
            <p className="mt-6 hidden items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground lg:inline-flex">
              <ArrowLeft className="size-3.5 text-primary" />
              The curriculum is in the sidebar
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground lg:hidden">
              Open the menu to see the curriculum
            </p>
          </div>
        </div>
        <ThemeSwitcher />
      </>
    );
  }

  return (
    <>
      <div className="glass-canvas min-h-full w-full px-4 py-10 sm:px-6 lg:px-10">
        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <VisitTree
            entries={visitHistory}
            onSelect={onSelectVisit}
            onClear={onClearHistory}
          />
        </div>
      </div>
      <ThemeSwitcher />
    </>
  );
}

/* ───────────────────────── Sidebar ───────────────────────── */

function Sidebar({
  selected,
  selectedQuizId,
  selectedSummary,
  selectedTopic,
  onSelect,
  onSelectTopic,
  onSelectQuiz,
  onSelectSummary,
  onSelectExtra,
  selectedExtra,
  openedExtras,
  completed,
  bestFor,
  mobile = false,
  isOpen = false,
}: {
  selected?: string;
  selectedQuizId?: string;
  /** Slug of the topic whose Summary page is open */
  selectedSummary?: string;
  /** Slug of the topic whose landing page is open */
  selectedTopic?: string;
  onSelect: (topic: Topic, subtopic: Subtopic) => void;
  onSelectTopic?: (topic: Topic) => void;
  onSelectQuiz: (quizId: string) => void;
  onSelectSummary: (topicSlug: string) => void;
  onSelectExtra: (topic: Topic, subtopic: Subtopic) => void;
  selectedExtra?: string;
  openedExtras: Set<string>;
  completed: Set<string>;
  bestFor: (quizId: string) => QuizScore | undefined;
  mobile?: boolean;
  isOpen?: boolean;
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const topicWithActive = useMemo(() => {
    if (selectedTopic) return selectedTopic;
    if (selectedSummary) return selectedSummary;
    if (!selected) return null;
    for (const topic of topics) {
      if (topic.subtopics.some((s) => s.slug === selected)) return topic.slug;
    }
    return null;
  }, [selected, selectedSummary, selectedTopic]);

  const [openTopics, setOpenTopics] = useState<string[]>(() =>
    topics.map((t) => t.slug),
  );

  useEffect(() => {
    if (!topicWithActive) return;
    setOpenTopics((prev) =>
      prev.includes(topicWithActive) ? prev : [...prev, topicWithActive],
    );
  }, [topicWithActive]);

  const activeKey =
    selectedExtra ??
    selected ??
    selectedQuizId ??
    selectedSummary ??
    selectedTopic;

  // Sort topics so the LABS topic is always last
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      if (a.slug === "labs") return 1;
      if (b.slug === "labs") return -1;
      return 0;
    });
  }, []);

  useEffect(() => {
    if (mobile && !isOpen) return;
    if (!activeKey) return;

    let attempts = 0;
    let raf = 0;

    const tryScroll = () => {
      attempts++;
      const el = activeRef.current;
      const container = scrollRef.current;

      if (el && container && el.offsetParent !== null) {
        if (container.scrollHeight > container.clientHeight) {
          const elRect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const target =
            container.scrollTop +
            (elRect.top - containerRect.top) -
            container.clientHeight / 2 +
            elRect.height / 2;
          container.scrollTo({
            top: Math.max(0, target),
            behavior: "instant" as ScrollBehavior,
          });
        } else {
          el.scrollIntoView({ block: "center", behavior: "instant" });
        }
        return;
      }

      if (attempts < 15) raf = requestAnimationFrame(tryScroll);
    };

    // Wait for Sheet portal & expanded topic layout to settle
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(tryScroll);
    });

    return () => cancelAnimationFrame(raf);
  }, [activeKey, mobile, isOpen]);

  return (
    <aside
      className={
        mobile
          ? "flex h-full min-h-0 flex-col overflow-hidden bg-background"
          : "hidden h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden border-r bg-sidebar/40 lg:flex"
      }
    >
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <h2 className="px-3 pb-4 text-sm font-semibold tracking-tight">
          Curriculum
        </h2>

        <div className="space-y-1">
          {sortedTopics.map((topic) => {
            const Icon = iconMap[topic.icon as keyof typeof iconMap] ?? Network;
            const doneCount = topic.subtopics.filter((s) =>
              completed.has(progressKey(topic.slug, s.slug)),
            ).length;
            const totalCount = topic.subtopics.length;
            const topicPercent =
              totalCount === 0 ? 0 : (doneCount / totalCount) * 100;
            const hasSummary =
              !!topic.summary && !!SUMMARY_VIEWS[topic.summary];
            const isSummaryActive = selectedSummary === topic.slug;
            const isTopicActive = selectedTopic === topic.slug;
            const open = openTopics.includes(topic.slug);
            const toggle = () =>
              setOpenTopics((prev) =>
                prev.includes(topic.slug)
                  ? prev.filter((s) => s !== topic.slug)
                  : [...prev, topic.slug],
              );

            return (
              <div key={topic.slug} className="relative pl-2.5">
                {/* progress rail */}
                <div className="absolute bottom-1 left-0 top-1 w-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`w-full rounded-full transition-all duration-500 ${
                      topicPercent === 100 ? "bg-primary" : "bg-primary/60"
                    }`}
                    style={{ height: `${topicPercent}%` }}
                  />
                </div>

                {/* topic header: title navigates, chevron expands */}
                <div className="flex items-center gap-0.5">
                  <button
                    ref={isTopicActive ? activeRef : null}
                    type="button"
                    onClick={() =>
                      onSelectTopic ? onSelectTopic(topic) : toggle()
                    }
                    aria-current={isTopicActive ? "page" : undefined}
                    className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring ${
                      isTopicActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-[var(--accent-soft)]"
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${isTopicActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="flex-1 truncate">{topic.title}</span>
                    <span className="shrink-0 text-[10px] font-normal tabular-nums text-muted-foreground">
                      {doneCount}/{totalCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`${open ? "Collapse" : "Expand"} ${topic.title}`}
                    aria-expanded={open}
                    onClick={toggle}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-[var(--accent-soft)] hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <ChevronRight
                      className={`size-3.5 transition-transform duration-200 motion-reduce:transition-none ${
                        open ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* collapsible body (grid-rows trick = smooth height, no JS measuring) */}
                <div
                  className={`grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none ${
                    open
                      ? "visible grid-rows-[1fr]"
                      : "invisible grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="ml-5 mt-0.5 border-l pb-2 pl-2">
                      {groupSubtopicsWithQuiz(topic.subtopics, topic.slug).map(
                        (group, gi) => {
                          const groupDone = group.items.filter((s) =>
                            completed.has(progressKey(topic.slug, s.slug)),
                          ).length;
                          const isQuizActive =
                            group.quiz?.id === selectedQuizId;
                          const score = group.quiz
                            ? bestFor(group.quiz.id)
                            : undefined;

                          return (
                            <div
                              key={`${group.name ?? "tail"}-${gi}`}
                              className={group.name && gi > 0 ? "mt-3" : ""}
                            >
                              {group.name && (
                                <p className="flex items-center justify-between px-2.5 pb-1 pt-1 text-[11px] font-medium text-muted-foreground">
                                  <span>{group.name}</span>
                                  <span className="font-normal tabular-nums text-muted-foreground/70">
                                    {groupDone}/{group.items.length}
                                  </span>
                                </p>
                              )}

                              {group.items.map((subtopic, index) => {
                                const isExtraActive =
                                  selectedExtra === subtopic.slug;
                                const isActive =
                                  selected === subtopic.slug && !isExtraActive;
                                const isDone = completed.has(
                                  progressKey(topic.slug, subtopic.slug),
                                );

                                return (
                                  <div key={`${subtopic.slug}-${index}`}>
                                    <button
                                      ref={isActive ? activeRef : null}
                                      onClick={() => onSelect(topic, subtopic)}
                                      className={`${ROW} ${rowTone(isActive)}`}
                                    >
                                      <StatusDot
                                        done={isDone}
                                        active={isActive}
                                      />
                                      <span className="flex-1">
                                        {subtopic.title}
                                      </span>
                                    </button>

                                    {/* Only exists while the Extra page is open */}
                                    {openedExtras.has(subtopic.slug) && (
                                      <button
                                        ref={isExtraActive ? activeRef : null}
                                        onClick={() =>
                                          onSelectExtra(topic, subtopic)
                                        }
                                        className={`${ROW} ml-5 w-[calc(100%-1.25rem)] ${rowTone(isExtraActive)}`}
                                      >
                                        <span className="mt-[3px] grid size-3.5 shrink-0 place-items-center rounded bg-primary/15 text-[9px] font-bold leading-none text-primary">
                                          E
                                        </span>
                                        <span className="flex-1">
                                          {subtopic.title}-Extra
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {group.quiz && (
                                <button
                                  ref={isQuizActive ? activeRef : null}
                                  onClick={() => onSelectQuiz(group.quiz!.id)}
                                  className={`${ROW} mt-1 items-center ${
                                    isQuizActive
                                      ? "bg-primary/10 font-medium text-primary"
                                      : "text-foreground/80 hover:bg-[var(--accent-soft)]"
                                  }`}
                                >
                                  <ListChecks className="size-3.5 shrink-0 text-primary" />
                                  <span className="flex-1 font-medium">
                                    Quiz
                                  </span>
                                  <span
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                                      score
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {score
                                      ? `${score.best}/${score.total}`
                                      : "Not taken"}
                                  </span>
                                </button>
                              )}
                            </div>
                          );
                        },
                      )}

                      {hasSummary && (
                        <button
                          ref={isSummaryActive ? activeRef : null}
                          onClick={() => onSelectSummary(topic.slug)}
                          className={`${ROW} mt-1 items-center ${
                            isSummaryActive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-foreground/80 hover:bg-[var(--accent-soft)]"
                          }`}
                        >
                          <BookOpen className="size-3.5 shrink-0 text-primary" />
                          <span className="flex-1 font-medium">Summary</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
type DiagramSlotProps = {
  diagram: {
    src: string;
    alt: string;
    caption?: string;
    placeholder?: boolean;
  };
  onOpen: (d: { src: string; alt: string; caption?: string }) => void;
  wide?: boolean;
};

function DiagramSlot({ diagram, onOpen, wide = false }: DiagramSlotProps) {
  if (diagram.placeholder || !diagram.src) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border bg-background">
          <PanelLeft className="size-4 text-muted-foreground" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          {diagram.caption}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Image not yet added
        </p>
      </div>
    );
  }

  return (
    <figure
      className={
        wide
          ? "flex flex-col overflow-hidden rounded-xl border bg-card"
          : "flex h-80 flex-col overflow-hidden rounded-xl border bg-card"
      }
    >
      <button
        type="button"
        onClick={() => onOpen(diagram)}
        aria-label={`Open ${diagram.alt} larger`}
        className="flex min-h-0 flex-1 cursor-zoom-in items-center justify-center bg-background p-3 transition-colors hover:bg-accent/30"
      >
        <img
          src={diagram.src}
          alt={diagram.alt}
          className={wide ? "h-auto w-full" : "h-full w-full object-contain"}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </button>
      {diagram.caption && (
        <figcaption className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
          {diagram.caption}
        </figcaption>
      )}
    </figure>
  );
}

function CodeBlockView({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-muted/50">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border bg-background p-1.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="size-3.5 text-primary" />
        ) : (
          <Copy className="size-3.5 text-muted-foreground" />
        )}
      </button>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function NoteBlockView({ block }: { block: NoteBlock }) {
  if (block.type === "heading")
    return (
      <h2 className="mt-8 text-lg font-semibold tracking-tight first:mt-0">
        {block.text}
      </h2>
    );
  if (block.type === "paragraph")
    return (
      <p className="text-sm leading-7 text-muted-foreground">{block.text}</p>
    );
  if (block.type === "bullets")
    return (
      <ul className="flex flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-primary">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  if (block.type === "code") {
    const codeString =
      (block as any).code || (block as any).items?.join("\n") || "";
    return (
      <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-6 text-foreground">
        <code>{codeString}</code>
      </pre>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {block.headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rows.map((row, rowIndex) => (
            <TableRow key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function QuickReference({ items }: { items: Subtopic["quickReference"] }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        Quick Reference
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <Separator />
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

function SubnetCalculator() {
  const [ip, setIp] = useState("10.20.30.77");
  const [cidr, setCidr] = useState("26");
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | Record<string, string>>(null);

  const calculate = (event: React.FormEvent) => {
    event.preventDefault();
    const octets = ip.trim().split(".").map(Number);
    const prefix = Number(cidr);
    if (
      octets.length !== 4 ||
      octets.some(
        (octet) => !Number.isInteger(octet) || octet < 0 || octet > 255,
      ) ||
      !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())
    ) {
      setError("Enter a valid IPv4 address, such as 192.168.10.14.");
      setResult(null);
      return;
    }
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      setError("CIDR must be a whole number from 0 to 32.");
      setResult(null);
      return;
    }
    const value = octets.reduce((acc, octet) => acc * 256 + octet, 0) >>> 0;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (value & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const format = (num: number) =>
      [num >>> 24, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
    const total = 2 ** (32 - prefix);
    const usable =
      prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.max(0, total - 2);
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;
    const dotted = format(mask);
    setError("");
    setResult({
      network: `${format(network)}/${prefix}`,
      broadcast: format(broadcast),
      first: format(first),
      last: format(last),
      hosts: usable.toLocaleString(),
      mask: dotted,
    });
  };

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Subnetting calculator</CardTitle>
            <CardDescription className="mt-1">
              Check your block boundaries as you study.
            </CardDescription>
          </div>
          <Badge variant="secondary">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={calculate}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <label className="flex-1 text-xs font-medium">
            IP address
            <Input
              value={ip}
              onChange={(event) => setIp(event.target.value)}
              className="mt-2 bg-background"
              placeholder="192.168.10.14"
            />
          </label>
          <label className="w-full text-xs font-medium sm:w-32">
            CIDR prefix
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                /
              </span>
              <Input
                value={cidr}
                onChange={(event) => setCidr(event.target.value)}
                className="bg-background pl-7"
                inputMode="numeric"
              />
            </div>
          </label>
          <Button type="submit" className="sm:w-auto">
            Calculate
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
        {result && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Network address", result.network],
              ["Broadcast address", result.broadcast],
              ["First usable host", result.first],
              ["Last usable host", result.last],
              ["Total usable hosts", result.hosts],
              ["Subnet mask", result.mask],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 break-all font-mono text-xs font-medium">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CcnaStudyAppInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dark, toggleTheme } = useTheme();
  const [lightbox, setLightbox] = useState<Diagram | null>(null);
  const { completed, isCompleted, toggle } = useCompletedTopics();
  const { bestFor, saveScore } = useQuizScores();
  const {
    entries: visitHistory,
    record: recordVisit,
    clear: clearVisitHistory,
  } = useVisitHistory();
  const [isPending, startTransition] = useTransition();
  const mainRef = useRef<HTMLElement | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  const topicSlug = searchParams.get("topic");
  const subSlug = searchParams.get("sub");
  const quizParam = searchParams.get("quiz");
  const summaryParam = searchParams.get("summary");
  const [openedExtras, setOpenedExtras] = useState<Set<string>>(new Set());
  const extraParam = searchParams.get("extra");

  const selected = useMemo(() => {
    if (!topicSlug || !subSlug) return null;
    const topic = topics.find((t) => t.slug === topicSlug);
    if (!topic) return null;
    const subtopic = topic.subtopics.find((s) => s.slug === subSlug);
    if (!subtopic) return null;
    return { topic, subtopic };
  }, [topicSlug, subSlug]);

  const selectedTopicOnly = useMemo(() => {
    if (!topicSlug || subSlug) return null;
    const topic = topics.find((t) => t.slug === topicSlug);
    return topic ?? null;
  }, [topicSlug, subSlug]);

  const selectedQuiz = useMemo(() => {
    if (!quizParam) return null;
    return quizById(quizParam) ?? null;
  }, [quizParam]);

  const selectedSummary = useMemo(() => {
    if (!summaryParam) return null;
    const topic = topics.find((t) => t.slug === summaryParam);
    if (!topic?.summary || !SUMMARY_VIEWS[topic.summary]) return null;
    return { topic, viewKey: topic.summary };
  }, [summaryParam]);

  const selectedExtra = useMemo(() => {
    if (!extraParam) return null;
    const topic = topics.find((t) => t.slug === topicSlug);
    if (!topic) return null;
    const subtopic = topic.subtopics.find((s) => s.slug === subSlug);
    if (!subtopic || !EXTRA_VIEWS[subtopic.slug]) return null;
    return { topic, subtopic, viewKey: subtopic.slug };
  }, [extraParam, topicSlug, subSlug]);

  const ExtraView = selectedExtra ? EXTRA_VIEWS[selectedExtra.viewKey] : null;
  const SummaryView = selectedSummary
    ? SUMMARY_VIEWS[selectedSummary.viewKey]
    : null;

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [summaryParam]);

  useEffect(() => {
    if (!selectedExtra) return;
    setOpenedExtras((prev) =>
      prev.has(selectedExtra.subtopic.slug)
        ? prev
        : new Set(prev).add(selectedExtra.subtopic.slug),
    );
  }, [selectedExtra]);

  const selectQuiz = (quizId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quiz", quizId);
    params.delete("summary");
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setMobileOpen(false);
  };

  const selectExtra = (topic: Topic, subtopic: Subtopic) => {
    setOpenedExtras((prev) => new Set(prev).add(subtopic.slug));
    const params = new URLSearchParams(searchParams.toString());
    params.set("extra", subtopic.slug);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setMobileOpen(false);
  };

  const selectSummary = (slug: string) => {
    const params = new URLSearchParams();
    params.set("summary", slug);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setMobileOpen(false);
  };

  const selectTopic = (topic: Topic) => {
    const params = new URLSearchParams();
    params.set("topic", topic.slug);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setMobileOpen(false);
  };

  const select = (topic: Topic, subtopic: Subtopic) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("topic", topic.slug);
    params.set("sub", subtopic.slug);
    params.delete("quiz");
    params.delete("summary");
    params.delete("extra");
    recordVisit({
      slug: subtopic.slug,
      topicSlug: topic.slug,
      title: subtopic.title,
      topicTitle: topic.title,
      group: subtopic.group,
    });
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setMobileOpen(false);
  };

  const flatList = useMemo(
    () =>
      topics.flatMap((t) =>
        t.subtopics.map((s) => ({ topic: t, subtopic: s })),
      ),
    [],
  );
  const currentIndex = useMemo(() => {
    if (!selected) return -1;
    return flatList.findIndex(
      (item) =>
        item.topic.slug === selected.topic.slug &&
        item.subtopic.slug === selected.subtopic.slug,
    );
  }, [flatList, selected]);
  const prevItem = currentIndex > 0 ? flatList[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < flatList.length - 1
      ? flatList[currentIndex + 1]
      : null;

  const goHome = () => {
    startTransition(() => {
      router.push("/", { scroll: false });
    });
    setMobileOpen(false);
  };
  const current = selected?.subtopic;
  const currentIcon = selected
    ? iconMap[selected.topic.icon as keyof typeof iconMap]
    : null;

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--accent-soft)] hover:text-foreground"
                aria-label="Open curriculum"
              >
                <Menu />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 overflow-hidden p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <SheetTitle className="sr-only">CCNA curriculum</SheetTitle>
                <Sidebar
                  selected={current?.slug}
                  selectedQuizId={selectedQuiz?.id}
                  selectedSummary={selectedSummary?.topic.slug}
                  selectedTopic={selectedTopicOnly?.slug}
                  onSelect={select}
                  onSelectQuiz={selectQuiz}
                  onSelectSummary={selectSummary}
                  onSelectExtra={selectExtra}
                  onSelectTopic={selectTopic}
                  openedExtras={openedExtras}
                  selectedExtra={selectedExtra?.subtopic.slug}
                  completed={completed}
                  bestFor={bestFor}
                  mobile
                  isOpen={mobileOpen}
                />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb navigation - hidden on very small screens to save space */}
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex shrink-0">
              <button
                type="button"
                onClick={goHome}
                className="transition-colors hover:text-foreground"
              >
                CCNA Notes
              </button>
              {selected && (
                <>
                  <ChevronRight className="size-3" />
                  <button
                    type="button"
                    onClick={() => selectTopic(selected.topic)}
                    className="transition-colors hover:text-foreground"
                  >
                    {selected.topic.title}
                  </button>
                  <ChevronRight className="size-3" />
                  <span className="truncate max-w-[200px] text-foreground">
                    {selected.subtopic.title}
                  </span>
                </>
              )}
              {selectedTopicOnly && (
                <>
                  <ChevronRight className="size-3" />
                  <span className="truncate max-w-[200px] text-foreground">
                    {selectedTopicOnly.title}
                  </span>
                </>
              )}
              {!selected && selectedSummary && (
                <>
                  <ChevronRight className="size-3" />
                  <button
                    type="button"
                    onClick={goHome}
                    className="transition-colors hover:text-foreground"
                  >
                    {selectedSummary.topic.title}
                  </button>
                  <ChevronRight className="size-3" />
                  <span className="text-foreground">Summary</span>
                </>
              )}
            </div>

            {/* Right side: Search + Animations + Theme toggle */}
            <div className="ml-auto flex items-center gap-2">
              <GlobalSearch onSelect={select} />
              <AnimationToggle />
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  dark ? "Switch to light mode" : "Switch to dark mode"
                }
                onClick={toggleTheme}
              >
                {dark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </header>
                    <main
            ref={mainRef}
            className="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-x-contain"
          >
            {isPending && (
              <div className="absolute inset-0 z-20 flex items-start justify-center bg-background/70 pt-24 backdrop-blur-[1px]">
                <SquareLoader />
              </div>
            )}

            {selectedExtra && ExtraView ? (
              <>
                <div className="w-full px-4 pt-6 sm:px-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      select(selectedExtra.topic, selectedExtra.subtopic)
                    }
                    className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="size-4 rotate-180" />
                    Back to notes
                  </Button>
                </div>
                <div className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
                  <Suspense
                    fallback={
                      <div className="flex h-64 items-center justify-center">
                        <SquareLoader />
                      </div>
                    }
                  >
                    <ExtraView />
                  </Suspense>
                </div>
              </>
            ) : selectedSummary && SummaryView ? (
              <>
                <div className="w-full px-4 pt-6 sm:px-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goHome}
                    className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="size-4 rotate-180" />
                    Back to Dashboard
                  </Button>
                </div>
                <Suspense
                  fallback={
                    <div className="flex h-64 items-center justify-center">
                      <SquareLoader />
                    </div>
                  }
                >
                  <SummaryView />
                </Suspense>
              </>
            ) : selectedQuiz ? (
              <QuizView
                quiz={selectedQuiz}
                best={bestFor(selectedQuiz.id)}
                onFinish={(score, total, length) =>
                  saveScore(selectedQuiz.id, score, total, length)
                }
                onBack={goHome}
              />
            ) : selectedTopicOnly ? (
              <TopicLanding
                topic={{
                  ...selectedTopicOnly,
                  icon: (iconMap[
                    selectedTopicOnly.icon as keyof typeof iconMap
                  ] ?? BookOpen) as any,
                }}
                completed={completed}
                progressKey={progressKey}
                onSelect={select}
                onBack={goHome}
              />
            ) : current ? (
              <article
                className={`mx-auto px-6 py-10 lg:px-10 ${
                  selected?.topic.wide ? "max-w-none" : "max-w-4xl"
                }`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goHome}
                  className="mb-6 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="size-4 rotate-180" />
                  Back to Dashboard
                </Button>
                <div className="mb-8 flex items-start gap-4">
                  <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                    {currentIcon &&
                      (() => {
                        const Icon = currentIcon;
                        return <Icon className="size-5" />;
                      })()}
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{selected.topic.title}</Badge>
                      <span className="text-xs text-muted-foreground">
                        · Notes
                      </span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                      {current.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {current.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  {current.blocks.map((block, index) => (
                    <NoteBlockView
                      block={block}
                      key={`${block.type}-${index}`}
                    />
                  ))}
                </div>
                {current.diagrams && (
                  <div className="mt-8 flex flex-col gap-4">
                    {(() => {
                      const normalized = current.diagrams.map((d, i) =>
                        typeof d === "string"
                          ? {
                              src: "",
                              alt: d,
                              caption: d,
                              placeholder: true,
                              _key: `str-${i}-${d}`,
                            }
                          : { ...d, _key: d.src },
                      );

                      const onlyOne = normalized.length === 1;
                      const isWide = (d: { src: string }) =>
                        onlyOne || d.src.includes("_wide");

                      const narrow = normalized.filter((d) => !isWide(d));
                      const wide = normalized.filter((d) => isWide(d));

                      return (
                        <>
                          {narrow.length > 0 && (
                            <div
                              className={
                                narrow.length === 1
                                  ? ""
                                  : "grid gap-4 sm:grid-cols-2"
                              }
                            >
                              {narrow.map((diagram) => (
                                <DiagramSlot
                                  key={diagram._key}
                                  diagram={diagram}
                                  onOpen={setLightbox}
                                />
                              ))}
                            </div>
                          )}
                          {wide.map((diagram) => (
                            <DiagramSlot
                              key={diagram._key}
                              diagram={diagram}
                              onOpen={setLightbox}
                              wide
                            />
                          ))}
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════════════
                    REPLACED 150+ LINES OF SLUG CHECKS WITH THIS SINGLE LINE 
                    ═══════════════════════════════════════════════════════════ */}
                <LabStage slug={current.slug} />

                <div className="mt-10 flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      prevItem && select(prevItem.topic, prevItem.subtopic)
                    }
                    disabled={!prevItem}
                    aria-label={
                      prevItem
                        ? `Previous: ${prevItem.subtopic.title}`
                        : "No previous topic"
                    }
                    title={prevItem ? prevItem.subtopic.title : undefined}
                    className="flex w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-colors hover:bg-[var(--accent-soft)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <div className="flex-1">
                    <QuickReference items={current.quickReference} />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      nextItem && select(nextItem.topic, nextItem.subtopic)
                    }
                    disabled={!nextItem}
                    aria-label={
                      nextItem
                        ? `Next: ${nextItem.subtopic.title}`
                        : "No next topic"
                    }
                    title={nextItem ? nextItem.subtopic.title : undefined}
                    className="flex w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-colors hover:bg-[var(--accent-soft)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  {EXTRA_VIEWS[current.slug] && (
                    <button
                      type="button"
                      onClick={() => selectExtra(selected.topic, current)}
                      aria-label={`Open extra examples for ${current.title}`}
                      title="Extra examples"
                      className="flex w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-sm font-semibold text-muted-foreground transition-colors hover:bg-[var(--accent-soft)] hover:text-foreground"
                    >
                      E
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      toggle(progressKey(selected.topic.slug, current.slug))
                    }
                    aria-label={
                      isCompleted(
                        progressKey(selected.topic.slug, current.slug),
                      )
                        ? "Mark as not completed"
                        : "Mark as completed"
                    }
                    className="group relative flex w-11 shrink-0 items-center justify-center transition-transform hover:scale-110"
                  >
                    <Check
                      strokeWidth={3}
                      className={`size-6 transition-colors ${
                        isCompleted(
                          progressKey(selected.topic.slug, current.slug),
                        )
                          ? "text-primary"
                          : "text-muted-foreground/40 group-hover:text-muted-foreground"
                      }`}
                    />
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background opacity-0 shadow transition-opacity group-hover:opacity-100">
                      {isCompleted(
                        progressKey(selected.topic.slug, current.slug),
                      )
                        ? "Completed"
                        : "Mark as completed"}
                    </span>
                  </button>
                </div>
              </article>
            ) : (
              <Dashboard
                visitHistory={visitHistory}
                onClearHistory={clearVisitHistory}
                onSelectVisit={(entry) => {
                  const topic = topics.find((t) => t.slug === entry.topicSlug);
                  const subtopic = topic?.subtopics.find(
                    (s) => s.slug === entry.slug,
                  );
                  if (topic && subtopic) select(topic, subtopic);
                }}
              />
            )}
          </main>
        </div>
      </div>
      <DiagramLightbox diagram={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
export default function CcnaStudyApp() {
  return (
    <AnimationsProvider>
      <CcnaStudyAppInner />
    </AnimationsProvider>
  );
}
