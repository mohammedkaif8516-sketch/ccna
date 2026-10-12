"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  AlertTriangle,
  ArrowUp,
  Cable,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lightbulb,
  Link2,
  Lock,
  MessageCircleQuestion, 
  Network,
  Pause,
  Play,
  RotateCcw,
  Route,
  Terminal,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";

/* ═════════════════════════════════════════════════════════════
   OSI model explainer
   Drop-in client component for the CCNA notes app.
   Uses the app's theme tokens (bg-card, border, --accent-soft…),
   so light/dark follows the `.dark` class on <html>.
   ═════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

/** Sets the per-layer hue used by the .osi-* helper classes below. */
const hue = (h: number) => ({ "--h": h }) as CSSProperties;

function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const OSI_CSS = `
.osi-root .osi-tint{background:hsl(var(--h) 85% 55% / .12);border-color:hsl(var(--h) 85% 55% / .4)}
.osi-root .osi-ink{color:hsl(var(--h) 72% 34%)}
.dark .osi-root .osi-ink{color:hsl(var(--h) 92% 79%)}
.osi-root .osi-solid{background:hsl(var(--h) 72% 44%);color:#fff}
.dark .osi-root .osi-solid{background:hsl(var(--h) 68% 52%)}
@keyframes osiPop{from{opacity:0;transform:scale(.95) translateY(5px)}to{opacity:1;transform:none}}
@keyframes osiFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.osi-root .osi-pop{animation:osiPop .38s cubic-bezier(.2,.9,.3,1.1) both}
.osi-root .osi-fade{animation:osiFade .22s ease-out both}
@media (prefers-reduced-motion:reduce){.osi-root .osi-pop,.osi-root .osi-fade{animation:none}}
`;

// ─────────────────────────────────────────────────────────────
// Layer data
// ─────────────────────────────────────────────────────────────

type LayerNum = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Layer {
  n: LayerNum;
  name: string;
  short: string;
  hue: number;
  icon: LucideIcon;
  pdu: string;
  pduShort: string;
  tcpip: string;
  address: string;
  summary: string;
  does: string[];
  protocols: string[];
  devices: string[];
  example: string;
  analogy: string;
  interview: string[];
  fails: string[];
  tools: string[];
  hook: string;
}

// Ordered top → bottom (7 → 1)
const LAYERS: Layer[] = [
  {
    n: 7,
    name: "Application",
    short: "Network services for your apps",
    hue: 335,
    icon: Globe,
    pdu: "Data",
    pduShort: "Data",
    tcpip: "Application",
    address: "Names: URLs, hostnames, email addresses",
    summary:
      "The doorway between software and the network. Layer 7 is not Chrome or Outlook themselves. It is the protocols those programs use to ask the network for something.",
    does: [
      "Provides network services to applications: web, email, file transfer, name lookup",
      "Defines how requests and replies look (HTTP methods, SMTP commands, DNS queries)",
      "Identifies the communication partner and checks the resource is reachable",
      "Handles application-level authentication",
    ],
    protocols: [
      "HTTP",
      "HTTPS",
      "FTP",
      "SMTP",
      "POP3",
      "IMAP",
      "DNS",
      "DHCP",
      "SSH",
      "Telnet",
      "SNMP",
      "NTP",
    ],
    devices: [
      "End hosts",
      "Web and mail servers",
      "Proxies",
      "Layer 7 firewalls / WAFs",
      "Layer 7 load balancers",
    ],
    example:
      "You type google.com and press Enter. The browser builds an HTTP GET request. DNS, a Layer 7 protocol too, turned the name into an IP address first.",
    analogy: "The General writes the order.",
    interview: [
      "Layer 7 is the protocol the app uses, not the app itself.",
      "DNS and DHCP are application-layer protocols even though they support the network.",
      "A site that opens by IP but not by name points to DNS, a Layer 7 problem.",
    ],
    fails: [
      "HTTP 404 or 500 errors",
      "Name does not resolve",
      "Wrong mail server settings",
      "Login or authentication fails",
    ],
    tools: ["curl", "nslookup / dig", "Browser dev tools", "Application logs"],
    hook: "Apps ask here.",
  },
  {
    n: 6,
    name: "Presentation",
    short: "Translate, encrypt, compress",
    hue: 290,
    icon: Lock,
    pdu: "Data",
    pduShort: "Data",
    tcpip: "Application",
    address: "None. It works on the format of the data",
    summary:
      "The translator. It makes sure data sent by one system can be read by another, and it can protect or shrink the data on the way.",
    does: [
      "Translation between formats and character sets (ASCII, Unicode, JSON, XML)",
      "Encryption and decryption (TLS is usually explained here)",
      "Compression and decompression",
      "Data serialization, such as image and video formats",
    ],
    protocols: [
      "TLS / SSL (usually mapped here)",
      "ASCII",
      "Unicode",
      "JPEG",
      "GIF",
      "PNG",
      "MPEG",
      "JSON / XML",
    ],
    devices: ["End hosts (OS and libraries)", "TLS offload appliances"],
    example:
      "Browser and server agree on TLS. Your request is encrypted, so anyone sniffing the cable sees random bytes instead of your data.",
    analogy: "The cipher clerk turns the order into secret code.",
    interview: [
      "TLS does not map cleanly to one layer. Layer 6 is the common answer, and it helps to mention that TCP/IP lumps it into Application.",
      "Presentation answers: what format is this data, and is it protected?",
      "Layers 5 to 7 collapse into one Application layer in TCP/IP.",
    ],
    fails: [
      "Certificate errors",
      "Garbled characters (wrong encoding)",
      "Unsupported image or video codec",
      "TLS version or cipher mismatch",
    ],
    tools: [
      "openssl s_client",
      "Browser certificate viewer",
      "Wireshark (TLS handshake)",
    ],
    hook: "Format and protect.",
  },
  {
    n: 5,
    name: "Session",
    short: "Open, manage and close the dialog",
    hue: 255,
    icon: Link2,
    pdu: "Data",
    pduShort: "Data",
    tcpip: "Application",
    address: "Session IDs",
    summary:
      "The conversation manager. It sets up a session between two applications, keeps it alive, decides who talks when, and shuts it down cleanly.",
    does: [
      "Establishes, maintains and terminates sessions",
      "Dialog control: simplex, half-duplex or full-duplex",
      "Checkpoints, so a long transfer can resume instead of restarting",
      "Recovery after an interruption",
    ],
    protocols: ["NetBIOS", "RPC", "SIP", "PPTP", "SMB / NFS sessions"],
    devices: ["End hosts (operating system)", "Session-aware servers"],
    example:
      "After you log in, the server tracks your session so the next click does not ask for a password again. A call that drops for a second can resume.",
    analogy:
      "The telephone operator connects the two headquarters, keeps the line open, then hangs up.",
    interview: [
      "Simplex is one way (TV broadcast). Half-duplex is two ways, one at a time (walkie-talkie). Full-duplex is both at once (phone call).",
      "A session is not a TCP connection. The TCP connection is Layer 4, and one session can outlive several connections.",
      "Keywords to remember: dialog control and checkpoints.",
    ],
    fails: [
      "Sessions time out unexpectedly",
      "Mapped drives drop and need re-authentication",
      "VoIP calls drop mid-conversation",
      "RPC errors",
    ],
    tools: ["netstat / ss", "Server session logs", "Wireshark"],
    hook: "Start, keep, stop the conversation.",
  },
  {
    n: 4,
    name: "Transport",
    short: "End-to-end delivery with ports",
    hue: 215,
    icon: Truck,
    pdu: "Segment (TCP) or datagram (UDP)",
    pduShort: "Segment",
    tcpip: "Transport",
    address: "Port numbers (0 to 65535)",
    summary:
      "Moves data between two processes on two hosts. TCP gives reliability, UDP gives speed, and port numbers say which application the data belongs to.",
    does: [
      "Segmentation and reassembly",
      "Port-based multiplexing: many apps share one IP address",
      "TCP: three-way handshake, sequencing, acknowledgments, retransmission, flow control (windowing)",
      "UDP: connectionless, low overhead, no delivery guarantee",
    ],
    protocols: ["TCP", "UDP", "SCTP", "QUIC (built on UDP)"],
    devices: [
      "End hosts (OS network stack)",
      "Stateful firewalls",
      "Layer 4 load balancers",
      "PAT / NAT overload devices",
    ],
    example:
      "The browser opens a TCP connection to port 443: SYN, SYN-ACK, ACK. Its own source port is a random high number such as 51514.",
    analogy:
      "The courier service splits the order into numbered envelopes and confirms each one arrived.",
    interview: [
      "TCP is reliable, ordered and connection-oriented (web, email, SSH). UDP is fast and best-effort (DNS queries, VoIP, streaming, games).",
      "Three-way handshake: SYN, SYN-ACK, ACK. Closing uses FIN and ACK, or RST to abort.",
      "Well-known ports are 0 to 1023, registered ports 1024 to 49151, dynamic ports 49152 to 65535.",
      "The IP address finds the host. The port finds the application.",
    ],
    fails: [
      "Port blocked by a firewall or ACL",
      "Connection refused or timed out",
      "Slow transfers from retransmissions",
      "Port already in use",
    ],
    tools: ["netstat / ss", "nc -zv host port", "telnet host port", "Wireshark"],
    hook: "Ports and reliability.",
  },
  {
    n: 3,
    name: "Network",
    short: "Logical addressing and routing",
    hue: 185,
    icon: Route,
    pdu: "Packet",
    pduShort: "Packet",
    tcpip: "Internet",
    address: "IP address (IPv4 is 32-bit, IPv6 is 128-bit), logical",
    summary:
      "Gets packets across different networks. It adds source and destination IP addresses, and routers pick the best path hop by hop.",
    does: [
      "Logical (IP) addressing",
      "Routing: choosing the best path from a routing table",
      "Forwarding packets between networks and subnets",
      "Fragmentation when a packet exceeds the MTU",
      "Diagnostics and error reporting with ICMP",
    ],
    protocols: ["IPv4", "IPv6", "ICMP", "IPsec", "OSPF", "EIGRP"],
    devices: ["Routers", "Layer 3 switches", "Firewalls in routed mode"],
    example:
      "The PC puts source 192.168.1.10 and destination 10.0.2.20 into the IP header. Each router along the way reads the destination and picks the next hop.",
    analogy:
      "The mail room writes the building and street address and chooses the route.",
    interview: [
      "Routers separate broadcast domains. Switches do not.",
      "TTL drops by one at every router. At zero the packet is discarded and ICMP Time Exceeded is returned, which is how traceroute works.",
      "IP addresses stay the same end to end (unless NAT). MAC addresses change at every hop.",
      "Ping uses ICMP, so it is a Layer 3 tool.",
    ],
    fails: [
      "Wrong IP, subnet mask or default gateway",
      "No route to the destination",
      "Routing loops, TTL exceeded",
      "IP address conflicts, NAT problems",
    ],
    tools: ["ping", "traceroute / tracert", "ipconfig / ip addr", "show ip route"],
    hook: "IP and routers.",
  },
  {
    n: 2,
    name: "Data Link",
    short: "Node-to-node delivery on one network",
    hue: 150,
    icon: Network,
    pdu: "Frame",
    pduShort: "Frame",
    tcpip: "Network Access",
    address: "MAC address (48-bit, burned into the NIC)",
    summary:
      "Delivers frames between two directly connected devices. It uses MAC addresses to say who is next on the local link, and it detects damaged frames.",
    does: [
      "Physical (MAC) addressing",
      "Framing: adds a header and a trailer (FCS)",
      "Error detection with the FCS/CRC (detects, does not correct)",
      "Media access control (CSMA/CD on classic Ethernet, CSMA/CA on Wi-Fi)",
      "Switching with a MAC address (CAM) table",
      "VLAN tagging (802.1Q) and loop prevention (STP)",
    ],
    protocols: [
      "Ethernet (802.3)",
      "Wi-Fi (802.11)",
      "PPP",
      "HDLC",
      "802.1Q VLANs",
      "STP",
      "LLC (802.2)",
      "ARP (sits between Layers 2 and 3)",
    ],
    devices: ["Switches", "Bridges", "NICs", "Wireless access points"],
    example:
      "The NIC wraps the packet in an Ethernet frame. The destination MAC is not the server's. It is the router's, because the router is the next hop.",
    analogy:
      "The local delivery driver only knows the door number of the next building.",
    interview: [
      "Two sublayers: LLC (faces up, identifies the Layer 3 protocol) and MAC (addressing and access to the medium).",
      "A switch learns source MACs into its MAC/CAM table, forwards known unicast out one port, and floods unknown or broadcast frames.",
      "Frames have a trailer (FCS). Packets and segments do not.",
      "Hub is Layer 1 (repeats to every port). Switch is Layer 2 (forwards intelligently).",
    ],
    fails: [
      "VLAN mismatch",
      "Duplex or speed mismatch, CRC errors",
      "MAC table or port-security problems",
      "Layer 2 loops and broadcast storms",
    ],
    tools: [
      "show mac address-table",
      "show vlan / show interfaces",
      "arp -a",
      "Wireshark",
    ],
    hook: "MAC and switches.",
  },
  {
    n: 1,
    name: "Physical",
    short: "Bits on the wire",
    hue: 35,
    icon: Cable,
    pdu: "Bits",
    pduShort: "Bits",
    tcpip: "Network Access",
    address: "None",
    summary:
      "The actual medium. It turns the frame into electrical signals, light pulses or radio waves, and defines the cables, connectors and signaling.",
    does: [
      "Transmits raw bits (0s and 1s)",
      "Signal encoding and modulation",
      "Cables, connectors and pinouts (RJ45)",
      "Data rates, topology and transmission mode (simplex, half, full)",
      "Media: copper (UTP, coax), fiber, wireless",
    ],
    protocols: [
      "Ethernet PHY standards (1000BASE-T and others)",
      "RJ45",
      "DSL",
      "SONET",
      "802.11 radio",
      "Bluetooth radio",
    ],
    devices: [
      "Hubs",
      "Repeaters",
      "Cables and connectors",
      "Media converters",
      "Modems",
    ],
    example:
      "The NIC turns the frame into voltage changes on the copper pairs of the Ethernet cable, light in fiber, or radio in Wi-Fi.",
    analogy: "The roads, trucks and telephone wires.",
    interview: [
      "Layer 1 has no addressing and no intelligence. A hub just repeats bits out every port, so all ports share one collision domain.",
      "A UTP Ethernet segment is limited to 100 m. Fiber covers longer distances.",
      "Dead link light, unplugged cable, bad SFP: check Layer 1 first.",
    ],
    fails: [
      "Cable unplugged or damaged",
      "Bad connector or port",
      "Interference, attenuation, run too long",
      "Wrong cable or transceiver type",
    ],
    tools: [
      "Cable tester",
      "show interfaces (up/down)",
      "Link LEDs",
      "Optical power meter",
    ],
    hook: "Bits, cables, signals.",
  },
];

const layerOf = (n: number): Layer => LAYERS[7 - n];

// ─────────────────────────────────────────────────────────────
// Shared UI bits
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

function Mnemonic({
  label,
  words,
  layers,
}: {
  label: string;
  words: string[];
  layers: number[];
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-card px-3.5 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-sm">
        {words.map((w, i) => {
          const l = layerOf(layers[i]);
          return (
            <span
              key={`${w}-${i}`}
              style={hue(l.hue)}
              title={`Layer ${l.n}: ${l.name}`}
              className="inline-flex items-baseline"
            >
              <span className="osi-ink text-base font-bold">{w[0]}</span>
              <span className="text-foreground/80">{w.slice(1)}</span>
            </span>
          );
        })}
      </p>
      <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
        {layers.map((n) => layerOf(n).name).join(", ")}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 1: the seven layers
// ─────────────────────────────────────────────────────────────

function LayerDetail({ layer }: { layer: Layer }) {
  return (
    <div className="osi-fade space-y-4 border-t px-3 pb-4 pt-4 sm:px-4">
      <p className="text-sm leading-relaxed">{layer.summary}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Data unit (PDU)</p>
          <p className="text-sm font-medium">{layer.pdu}</p>
        </div>
        <div className="rounded-lg border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Addressing</p>
          <p className="text-sm font-medium">{layer.address}</p>
        </div>
        <div className="rounded-lg border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">TCP/IP equivalent</p>
          <p className="text-sm font-medium">{layer.tcpip}</p>
        </div>
        <div className="rounded-lg border bg-muted/40 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">One-line memory hook</p>
          <p className="text-sm font-medium">{layer.hook}</p>
        </div>
      </div>

      <div>
        <Label>What it does</Label>
        <Bullets items={layer.does} />
      </div>

      <div>
        <Label>Protocols and standards</Label>
        <div className="flex flex-wrap gap-1.5">
          {layer.protocols.map((p) => (
            <Chip key={p}>{p}</Chip>
          ))}
        </div>
      </div>

      <div>
        <Label>Devices and software here</Label>
        <div className="flex flex-wrap gap-1.5">
          {layer.devices.map((d) => (
            <Chip key={d}>{d}</Chip>
          ))}
        </div>
      </div>

      <div className="osi-tint rounded-xl border px-3.5 py-3">
        <p className="osi-ink text-xs font-semibold">Real example</p>
        <p className="mt-1 text-sm leading-relaxed">{layer.example}</p>
      </div>

      <div>
        <Label>Interview points</Label>
        <Bullets items={layer.interview} />
      </div>
    </div>
  );
}

function LayerCard({
  layer,
  open,
  onToggle,
}: {
  layer: Layer;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = layer.icon;
  return (
    <div style={hue(layer.hue)} className="overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full min-w-0 items-center gap-3 px-3 py-3 text-left outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring sm:px-4"
      >
        <span className="osi-solid flex size-11 shrink-0 flex-col items-center justify-center rounded-lg leading-none">
          <span className="text-[9px] opacity-80">Layer</span>
          <span className="text-lg font-bold">{layer.n}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <Icon className="osi-ink size-4 shrink-0" />
            <span className="truncate text-sm font-semibold">{layer.name}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {layer.short}
          </span>
        </span>
        <span className="osi-tint osi-ink hidden shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium sm:inline">
          {layer.pduShort}
        </span>
        <ChevronDown
          className={cx(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <LayerDetail layer={layer} />}
    </div>
  );
}

function LayersTab() {
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium">Memory hooks</p>
        <div className="grid gap-2 md:grid-cols-3">
          <Mnemonic
            label="Top to bottom"
            words={["All", "People", "Should", "Try", "New", "Domino's", "Pizza"]}
            layers={[7, 6, 5, 4, 3, 2, 1]}
          />
          <Mnemonic
            label="Bottom to top"
            words={["Please", "Do", "Not", "Throw", "Sausage", "Pizza", "Away"]}
            layers={[1, 2, 3, 4, 5, 6, 7]}
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ArrowDown className="size-3.5" /> Sender goes 7 to 1
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowUp className="size-3.5" /> Receiver goes 1 to 7
            </span>
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setOpen(new Set(LAYERS.map((l) => l.n)))}
              className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-[var(--accent-soft)]"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={() => setOpen(new Set())}
              className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-[var(--accent-soft)]"
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {LAYERS.map((layer) => (
            <LayerCard
              key={layer.n}
              layer={layer}
              open={open.has(layer.n)}
              onToggle={() => toggle(layer.n)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">One-glance cheat sheet</p>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th className="px-3 py-2 font-medium">Layer</th>
                <th className="px-3 py-2 font-medium">Data unit</th>
                <th className="px-3 py-2 font-medium">Address</th>
                <th className="px-3 py-2 font-medium">Key protocols</th>
                <th className="px-3 py-2 font-medium">Devices</th>
              </tr>
            </thead>
            <tbody>
              {LAYERS.map((l) => (
                <tr key={l.n} style={hue(l.hue)} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="osi-solid inline-flex size-5 items-center justify-center rounded text-[11px] font-bold">
                        {l.n}
                      </span>
                      {l.name}
                    </span>
                  </td>
                  <td className="px-3 py-2">{l.pduShort}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {l.n === 2
                      ? "MAC"
                      : l.n === 3
                        ? "IP"
                        : l.n === 4
                          ? "Port"
                          : "None"}
                  </td>
                  <td className="px-3 py-2">
                    {l.protocols.slice(0, 4).join(", ")}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {l.devices.slice(0, 2).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 2: data journey (encapsulation / decapsulation)
// ─────────────────────────────────────────────────────────────

const EX = {
  pcIp: "192.168.1.10",
  pcMac: "AA:BB:CC:11:22:33",
  r1Mac: "00:1A:2B:3C:4D:5E",
  r2Mac: "00:50:56:AA:BB:CC",
  srvIp: "10.0.2.20",
  srvMac: "DE:AD:BE:EF:00:20",
  srcPort: "51514",
  dstPort: "443",
  request: "GET / HTTP/1.1 (Host: app.example.com)",
};

type Dir = "send" | "recv";

interface Step {
  layer: LayerNum;
  title: string;
  text: string;
  note?: string;
}

const SEND_STEPS: Step[] = [
  {
    layer: 7,
    title: "Application creates the data",
    text: "PC-A's browser needs a page from Server-B, so HTTP builds a request: GET / with the host name. Nothing is addressed yet. It is just data.",
  },
  {
    layer: 6,
    title: "Presentation encodes and protects it",
    text: "The request is encoded (UTF-8), can be compressed, and is encrypted by TLS. Anyone sniffing the cable sees random-looking bytes.",
  },
  {
    layer: 5,
    title: "Session keeps the dialog open",
    text: "A session is set up and tracked (session IDs, cookies, TLS session). It decides who talks when, so the conversation can continue and later close cleanly.",
  },
  {
    layer: 4,
    title: "Transport adds ports and makes a segment",
    text: `TCP numbers the data and adds a TCP header: source port ${EX.srcPort} (random) and destination port ${EX.dstPort} (HTTPS). The three-way handshake (SYN, SYN-ACK, ACK) already created this connection.`,
  },
  {
    layer: 3,
    title: "Network adds IP addresses and makes a packet",
    text: `IP adds source ${EX.pcIp} and destination ${EX.srvIp}. The server is on another network, so the next hop is the default gateway, R1. TTL starts at 64.`,
  },
  {
    layer: 2,
    title: "Data Link adds MAC addresses and makes a frame",
    text: "Ethernet wraps the packet. The destination MAC is R1's interface (found with ARP), not the server's, because MAC addresses only work on the local link. The trailer carries the FCS so the receiver can detect corruption.",
    note: "IP addresses stay the same all the way to Server-B. MAC addresses are rewritten at every router.",
  },
  {
    layer: 1,
    title: "Physical sends bits",
    text: "The NIC converts the frame into bits and sends them as electrical signals on copper, light in fiber, or radio in Wi-Fi. Each router on the way unwraps the frame up to Layer 3, picks the next hop, and builds a brand-new frame.",
  },
];

const RECV_STEPS: Step[] = [
  {
    layer: 1,
    title: "Physical receives bits",
    text: "Server-B's NIC detects the signal and turns it back into bits, then groups them into a frame.",
  },
  {
    layer: 2,
    title: "Data Link checks the frame",
    text: `The NIC confirms the destination MAC is its own (${EX.srvMac}), verifies the FCS (damaged frames are dropped), and strips the Ethernet header and trailer. What is left is a packet.`,
    note: "This frame came from R2, not from PC-A. PC-A's original frame was discarded at R1, and a new frame was built at each router.",
  },
  {
    layer: 3,
    title: "Network checks the packet",
    text: `IP confirms the destination ${EX.srvIp} is this host, validates the header, strips it, and reads the protocol field (6 means TCP) to know who gets the payload. What is left is a segment.`,
  },
  {
    layer: 4,
    title: "Transport hands data to the right process",
    text: `TCP uses destination port ${EX.dstPort} to find the web server process, reorders segments by sequence number, sends ACKs, and asks for anything missing. Stripping the TCP header leaves the data.`,
  },
  {
    layer: 5,
    title: "Session matches the dialog",
    text: "The data is matched to the existing session, so the server knows which client conversation it belongs to and keeps the dialog going.",
  },
  {
    layer: 6,
    title: "Presentation decrypts and decodes",
    text: "TLS decrypts the bytes, then the data is decompressed and decoded. The server can finally read the request.",
  },
  {
    layer: 7,
    title: "Application handles the request",
    text: "The web server application reads GET / and builds a response. That response now makes the same trip in reverse: down Server-B's stack and up PC-A's.",
  },
];

function Envelope({
  layer,
  title,
  header,
  trailer,
  fresh,
  children,
}: {
  layer: LayerNum;
  title: string;
  header: string;
  trailer?: string;
  fresh: boolean;
  children: ReactNode;
}) {
  const l = layerOf(layer);
  return (
    <div
      style={hue(l.hue)}
      className={cx(
        "osi-tint rounded-lg border p-2 sm:p-2.5",
        fresh && "osi-pop",
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="osi-ink text-xs font-bold">
          Layer {layer} {title}
        </span>
        <span className="min-w-0 break-words font-mono text-[11px] leading-4 text-foreground/80">
          {header}
        </span>
      </div>
      <div className="mt-2">{children}</div>
      {trailer && (
        <div className="mt-2 border-t border-dashed pt-1.5 text-[11px] leading-4">
          <span className="osi-ink font-bold">Trailer </span>
          <span className="font-mono text-foreground/80">{trailer}</span>
        </div>
      )}
    </div>
  );
}

function Anatomy({ dir, step }: { dir: Dir; step: number }) {
  const send = dir === "send";

  const hasTcp = send ? step >= 4 : step < 4;
  const hasIp = send ? step >= 5 : step < 3;
  const hasEth = send ? step >= 6 : step < 2;
  const showBits = send ? step === 7 : step === 1;
  const encrypted = send ? step >= 2 : step < 6;
  const sessioned = send && step >= 3;
  const dataLayer = (
    send ? (step === 1 ? 7 : step === 2 ? 6 : 5) : step <= 5 ? 5 : step === 6 ? 6 : 7
  ) as LayerNum;
  const freshLayer = send ? 8 - step : 0;

  const eth = send
    ? { dst: EX.r1Mac, dstName: "R1", src: EX.pcMac, srcName: "PC-A" }
    : { dst: EX.srvMac, dstName: "Server-B", src: EX.r2Mac, srcName: "R2" };

  const dl = layerOf(dataLayer);

  let node: ReactNode = (
    <div
      key={`data-${dataLayer}-${encrypted}`}
      style={hue(dl.hue)}
      className="osi-tint osi-pop rounded-md border px-2.5 py-2"
    >
      <p className="osi-ink text-xs font-bold">
        Layer {dataLayer} Data{sessioned ? " (session tracked)" : ""}
      </p>
      <p className="mt-0.5 break-words font-mono text-[11px] leading-4">
        {encrypted ? "x9Q#7fA2 ... TLS-encrypted bytes ... 4kLm" : EX.request}
      </p>
    </div>
  );

  if (hasTcp) {
    node = (
      <Envelope
        key="tcp"
        layer={4}
        title="TCP header"
        header={`src port ${EX.srcPort}, dst port ${EX.dstPort}, SEQ/ACK numbers`}
        fresh={freshLayer === 4}
      >
        {node}
      </Envelope>
    );
  }
  if (hasIp) {
    node = (
      <Envelope
        key="ip"
        layer={3}
        title="IP header"
        header={`src ${EX.pcIp}, dst ${EX.srvIp}, TTL 64`}
        fresh={freshLayer === 3}
      >
        {node}
      </Envelope>
    );
  }
  if (hasEth) {
    node = (
      <Envelope
        key="eth"
        layer={2}
        title="Ethernet header"
        header={`dst ${eth.dst} (${eth.dstName}), src ${eth.src} (${eth.srcName})`}
        trailer="FCS (CRC check)"
        fresh={freshLayer === 2}
      >
        {node}
      </Envelope>
    );
  }

  const bits = (
    <div
      style={hue(layerOf(1).hue)}
      className={cx(
        "osi-tint break-all rounded-md border px-2.5 py-2 font-mono text-[11px] leading-4",
        "osi-pop",
      )}
    >
      <span className="osi-ink font-bold">Layer 1 Bits </span>
      10110010 01110100 11001001 00101110 01011011 ...
    </div>
  );

  return (
    <div className="space-y-2">
      {showBits && !send && bits}
      {node}
      {showBits && send && bits}
    </div>
  );
}

function pduAt(dir: Dir, step: number): string {
  const layer = (dir === "send" ? 8 - step : step) as LayerNum;
  return layerOf(layer).pduShort;
}

const DEVICES = [
  {
    name: "Hub or repeater",
    max: 1,
    reads: "Nothing. It repeats the signal out of every port.",
  },
  {
    name: "Switch",
    max: 2,
    reads: "Destination MAC in the frame header.",
  },
  {
    name: "Router",
    max: 3,
    reads: "Destination IP in the packet header.",
  },
  {
    name: "End host",
    max: 7,
    reads: "Everything, up to the application data.",
  },
];

function JourneyTab() {
  const [dir, setDir] = useState<Dir>("send");
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);

  const steps = dir === "send" ? SEND_STEPS : RECV_STEPS;
  const current = steps[step - 1];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((s) => Math.min(7, s + 1)), 1800);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && step >= 7) setPlaying(false);
  }, [playing, step]);

  const changeDir = (d: Dir) => {
    setDir(d);
    setStep(1);
    setPlaying(false);
  };

  const onPlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (step >= 7) setStep(1);
    setPlaying(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Follow one HTTPS request from PC-A to Server-B in a lab with two
          routers. Step through it and watch the data get wrapped on the way
          down and unwrapped on the way up.
        </p>
        <p className="overflow-x-auto whitespace-nowrap rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[11px]">
          PC-A (192.168.1.10) - Switch - R1 = R2 - Switch - Server-B (10.0.2.20)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border p-0.5" role="group" aria-label="Direction">
          {(
            [
              { id: "send", label: "Sending", icon: ArrowDown },
              { id: "recv", label: "Receiving", icon: ArrowUp },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => changeDir(o.id)}
              aria-pressed={dir === o.id}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                dir === o.id
                  ? "bg-[var(--accent)] font-medium text-white"
                  : "hover:bg-[var(--accent-soft)]",
              )}
            >
              <o.icon className="size-3.5" />
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {dir === "send"
            ? "Encapsulation: each layer adds its header"
            : "Decapsulation: each layer removes its header"}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">What is on the wire at this step</p>
          <span
            style={hue(layerOf(current.layer).hue)}
            className="osi-tint osi-ink rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
          >
            Data unit: {pduAt(dir, step)}
          </span>
        </div>

        <Anatomy dir={dir} step={step} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.max(1, s - 1));
              }}
              disabled={step === 1}
              aria-label="Previous step"
              className="inline-flex size-9 items-center justify-center rounded-lg border outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={onPlay}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 text-xs font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {playing ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.min(7, s + 1));
              }}
              disabled={step === 7}
              aria-label="Next step"
              className="inline-flex size-9 items-center justify-center rounded-lg border outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep(1);
              }}
              aria-label="Restart"
              className="inline-flex size-9 items-center justify-center rounded-lg border outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 7</p>
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((s, i) => {
          const n = i + 1;
          const l = layerOf(s.layer);
          const state = n === step ? "now" : n < step ? "done" : "next";
          return (
            <li key={n} style={hue(l.hue)}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStep(n);
                }}
                aria-current={state === "now" ? "step" : undefined}
                className={cx(
                  "flex w-full min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                  state === "now"
                    ? "osi-tint"
                    : "bg-card hover:bg-[var(--accent-soft)]",
                  state === "next" && "opacity-60",
                )}
              >
                <span
                  className={cx(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    state === "done"
                      ? "bg-muted text-muted-foreground"
                      : "osi-solid",
                  )}
                >
                  {state === "done" ? <Check className="size-4" /> : l.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{s.title}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Layer {l.n}, {l.name}
                  </span>
                  {state === "now" && (
                    <span className="osi-fade mt-2 block space-y-2">
                      <span className="block text-sm leading-relaxed">
                        {s.text}
                      </span>
                      {s.note && (
                        <span className="block rounded-lg border bg-card px-3 py-2 text-xs leading-relaxed">
                          <span className="font-semibold">Remember: </span>
                          {s.note}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div>
        <p className="mb-1 text-sm font-medium">Who looks at which layer?</p>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Layers 1 to 3 are hop by hop: every device on the path handles them.
          Layers 4 to 7 are end to end: only the two hosts handle them.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DEVICES.map((d) => (
            <div key={d.name} className="min-w-0 rounded-xl border bg-card p-3">
              <p className="text-sm font-medium">{d.name}</p>
              <div className="mt-2 flex flex-col gap-1">
                {LAYERS.map((l) => {
                  const active = l.n <= d.max;
                  return (
                    <div
                      key={l.n}
                      style={hue(l.hue)}
                      className={cx(
                        "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] leading-4",
                        active
                          ? "osi-solid"
                          : "bg-muted text-muted-foreground/60",
                      )}
                    >
                      <span className="font-bold">{l.n}</span>
                      <span className="truncate">{l.name}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                {d.reads}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 3: OSI vs TCP/IP
// ─────────────────────────────────────────────────────────────

const TCPIP_BLOCKS = [
  {
    name: "Application",
    rows: "1 / span 3",
    hue: 335,
    note: "HTTP, DNS, DHCP, SSH, SMTP, TLS",
    covers: "OSI 5, 6, 7",
  },
  {
    name: "Transport",
    rows: "4 / span 1",
    hue: 215,
    note: "TCP, UDP",
    covers: "OSI 4",
  },
  {
    name: "Internet",
    rows: "5 / span 1",
    hue: 185,
    note: "IP, ICMP, routing",
    covers: "OSI 3",
  },
  {
    name: "Network Access",
    rows: "6 / span 2",
    hue: 150,
    note: "Ethernet, Wi-Fi, cables",
    covers: "OSI 1, 2",
  },
];

const COMPARE_ROWS = [
  ["Number of layers", "7", "4 (some books split Network Access to make 5)"],
  ["Origin", "ISO, published 1984", "US Department of Defense research, 1970s"],
  [
    "Nature",
    "Reference model, independent of any protocol",
    "Practical model built around the protocols the internet really uses",
  ],
  [
    "Layers 5 to 7",
    "Three separate layers",
    "Merged into one Application layer",
  ],
  [
    "Layers 1 and 2",
    "Two separate layers",
    "Merged into one Network Access layer",
  ],
  [
    "Best used for",
    "Teaching, design talk, troubleshooting vocabulary",
    "Describing what actually runs on real networks",
  ],
];

function CompareTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-3 sm:p-4">
        <div className="mb-3 grid grid-cols-2 gap-2 text-center text-sm font-medium sm:gap-3">
          <p>OSI model</p>
          <p>TCP/IP model</p>
        </div>
        <div
          className="grid grid-cols-2 gap-2 sm:gap-3"
          style={{ gridTemplateRows: "repeat(7, minmax(54px, auto))" }}
        >
          {LAYERS.map((l, i) => (
            <div
              key={l.n}
              style={{ ...hue(l.hue), gridColumn: 1, gridRow: i + 1 }}
              className="osi-tint flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 sm:gap-3 sm:px-3"
            >
              <span className="osi-solid flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-bold">
                {l.n}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {l.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {l.pduShort}
                </span>
              </span>
            </div>
          ))}
          {TCPIP_BLOCKS.map((b) => (
            <div
              key={b.name}
              style={{ ...hue(b.hue), gridColumn: 2, gridRow: b.rows }}
              className="osi-tint flex min-w-0 flex-col justify-center rounded-lg border px-3 py-2"
            >
              <p className="osi-ink text-sm font-semibold">{b.name}</p>
              <p className="text-[11px] text-muted-foreground">{b.covers}</p>
              <p className="mt-1 break-words text-[11px] leading-4">{b.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium"> </th>
              <th className="px-3 py-2 font-medium">OSI</th>
              <th className="px-3 py-2 font-medium">TCP/IP</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map(([a, o, t]) => (
              <tr key={a} className="border-b align-top last:border-0">
                <td className="px-3 py-2 text-xs font-medium">{a}</td>
                <td className="px-3 py-2 text-xs leading-relaxed">{o}</td>
                <td className="px-3 py-2 text-xs leading-relaxed">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout>
        In an interview, say it like this: we describe and troubleshoot with the
        OSI model, but the internet actually runs on TCP/IP.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 4: troubleshooting by layer
// ─────────────────────────────────────────────────────────────

const APPROACHES = [
  {
    name: "Bottom-up",
    when: "You suspect hardware, or you have no idea where to start.",
    how: "Check cables and links first, then VLAN and MAC, then IP, then ports, then the application.",
  },
  {
    name: "Top-down",
    when: "Only one application is broken and everything else works.",
    how: "Start with the app and its settings, then go down until you find the first failing layer.",
  },
  {
    name: "Divide and conquer",
    when: "You are an experienced engineer with a gut feeling.",
    how: "Start at Layer 3 with ping. If it works, look up. If it fails, look down.",
  },
];

const PING_LADDER = [
  {
    cmd: "ping 127.0.0.1",
    proves: "The TCP/IP stack on this computer works.",
  },
  {
    cmd: "ping 192.168.1.10 (your own IP)",
    proves: "The NIC and its IP configuration are fine.",
  },
  {
    cmd: "ping 192.168.1.1 (default gateway)",
    proves: "Layers 1 and 2 on the local network work, and the gateway answers.",
  },
  {
    cmd: "ping 8.8.8.8 (a remote IP)",
    proves: "Routing beyond your network works (Layer 3).",
  },
  {
    cmd: "ping google.com",
    proves: "DNS works too (Layer 7 name resolution).",
  },
];

function DebugTab() {
  const bottomUp = [...LAYERS].reverse();
  return (
    <div className="space-y-6">
      <div className="grid gap-2 md:grid-cols-3">
        {APPROACHES.map((a) => (
          <div key={a.name} className="rounded-xl border bg-card p-3.5">
            <p className="text-sm font-semibold">{a.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {a.when}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{a.how}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">The ping ladder</p>
        <div className="space-y-2">
          {PING_LADDER.map((p, i) => (
            <div
              key={p.cmd}
              className="flex min-w-0 items-start gap-3 rounded-xl border bg-card px-3 py-2.5"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="break-words font-mono text-xs">{p.cmd}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {p.proves}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The first step that fails tells you which layer to look at.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Symptoms and tools by layer</p>
        <div className="space-y-2">
          {bottomUp.map((l) => (
            <div
              key={l.n}
              style={hue(l.hue)}
              className="rounded-xl border bg-card p-3.5"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="osi-solid flex size-6 items-center justify-center rounded-md text-xs font-bold">
                  {l.n}
                </span>
                {l.name}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Typical symptoms</Label>
                  <Bullets items={l.fails} />
                </div>
                <div>
                  <Label>First things to check</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {l.tools.map((t) => (
                      <span
                        key={t}
                        className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-[11px]"
                      >
                        <Terminal className="size-3 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 break-words">{t}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 5: interview prep (pitch, Q&A, layer drill)
// ─────────────────────────────────────────────────────────────

const PITCH =
  "The OSI model is a seven-layer reference model that describes how data travels across a network. The top three layers, Application, Presentation and Session, deal with software and data. Transport handles end-to-end delivery using ports, with TCP for reliability and UDP for speed. Network handles logical addressing and routing with IP. Data Link handles delivery on the local network using MAC addresses and frames. Physical sends the raw bits. On the sender, data is encapsulated as it moves down the layers. On the receiver, it is decapsulated as it moves up. TCP/IP is the practical four-layer version that the internet actually uses.";

const QA: Array<{ q: string; a: string[] }> = [
  {
    q: "What is the OSI model and why do we use it?",
    a: [
      "OSI (Open Systems Interconnection) is a seven-layer reference model published by ISO in 1984. It splits network communication into layers that each do one job.",
      "That helps vendors build products that work together, lets engineers troubleshoot one layer at a time, and means a change in one layer does not break the others.",
    ],
  },
  {
    q: "List the seven layers top to bottom with the data unit at each.",
    a: [
      "Application, Presentation and Session work on data. Transport uses segments (TCP) or datagrams (UDP). Network uses packets. Data Link uses frames. Physical uses bits.",
      "Mnemonic: All People Should Try New Dominos Pizza.",
    ],
  },
  {
    q: "What is encapsulation?",
    a: [
      "As data goes down the stack, each layer wraps what it got from the layer above with its own header (and at Layer 2, also a trailer): data, then segment, then packet, then frame, then bits.",
      "The receiver does the reverse, called decapsulation. Each layer reads and removes its own header and passes the payload up.",
    ],
  },
  {
    q: "What is the difference between OSI and TCP/IP?",
    a: [
      "OSI is a seven-layer theoretical reference model. TCP/IP is a four-layer practical model built around the protocols the internet uses.",
      "TCP/IP merges OSI layers 5 to 7 into Application and layers 1 and 2 into Network Access.",
    ],
  },
  {
    q: "What is the difference between a switch and a router?",
    a: [
      "A switch works at Layer 2. It forwards frames inside one network using the MAC address table.",
      "A router works at Layer 3. It forwards packets between networks using IP addresses and a routing table, and it separates broadcast domains. A Layer 3 switch does both.",
    ],
  },
  {
    q: "TCP vs UDP: when do you use which?",
    a: [
      "TCP is connection-oriented and reliable: handshake, sequence numbers, acknowledgments, retransmission and flow control. Use it when accuracy matters, such as web, email, file transfer and SSH.",
      "UDP is connectionless and has less overhead but no guarantees. Use it when speed matters more than perfection, such as DNS queries, VoIP, video streaming and games.",
    ],
  },
  {
    q: "Explain the TCP three-way handshake.",
    a: [
      "1. SYN: the client asks to connect and sends its starting sequence number.",
      "2. SYN-ACK: the server acknowledges that number and sends its own.",
      "3. ACK: the client acknowledges the server's number. The connection is established.",
      "Closing uses FIN and ACK messages, or RST to abort.",
    ],
  },
  {
    q: "Why do we need both MAC and IP addresses?",
    a: [
      "A MAC address (Layer 2) identifies a NIC on the local link and is used for hop-by-hop delivery. It has no structure that helps find a path across networks.",
      "An IP address (Layer 3) is logical and hierarchical, so routers can find a path across networks. At every hop the MAC addresses are rewritten. The IP addresses stay the same end to end, unless NAT changes them.",
    ],
  },
  {
    q: "What happens when you type a URL and press Enter?",
    a: [
      "1. Layer 7: the browser checks its cache, then asks DNS for the IP address.",
      "2. Layers 3 and 2: the host checks whether the server is local. If not, it uses ARP to find the MAC address of the default gateway.",
      "3. Layer 4: a TCP three-way handshake opens a connection to port 443 (80 for plain HTTP).",
      "4. Layers 6 and 5: the TLS handshake agrees on keys and the session starts.",
      "5. Layer 7: the browser sends an HTTP GET, the server replies with the page, and the browser fetches the remaining resources.",
      "Every packet is encapsulated down the stack, and each router on the way builds a new frame and lowers the TTL.",
    ],
  },
  {
    q: "What are the sublayers of the Data Link layer?",
    a: [
      "LLC (Logical Link Control, 802.2) faces upward and identifies which Layer 3 protocol is inside the frame.",
      "MAC (Media Access Control) handles addressing and controlling access to the medium.",
    ],
  },
  {
    q: "At which layer does ping work?",
    a: [
      "Ping sends ICMP echo requests, which is Layer 3. A successful ping proves Layers 1 to 3 work between two hosts. It says nothing about ports or applications, so a web server can still be down while ping works.",
    ],
  },
  {
    q: "What does end-to-end versus hop-by-hop mean?",
    a: [
      "Layers 4 to 7 are end to end: only the two communicating hosts process them.",
      "Layers 1 to 3 are hop by hop: every device on the path, such as switches and routers, handles them.",
    ],
  },
  {
    q: "Where do firewalls fit in the model?",
    a: [
      "Basic packet filters look at Layers 3 and 4 (IP addresses, ports, protocols). Stateful firewalls track Layer 4 connections.",
      "Next-generation firewalls and web application firewalls inspect up to Layer 7: applications, URLs and content.",
    ],
  },
  {
    q: "Where do SSL/TLS fit?",
    a: [
      "There is no perfect answer. TLS encrypts data (Presentation, Layer 6), sets up a secure session (Layer 5), runs on top of TCP (Layer 4) and carries HTTP (Layer 7).",
      "Saying Layer 6 and mentioning that TCP/IP lumps it into Application shows you understand the model's limits.",
    ],
  },
  {
    q: "How would you troubleshoot a network problem using the OSI model?",
    a: [
      "Choose an approach: bottom-up, top-down or divide and conquer. Then ask which is the first layer that fails.",
      "Example: link light on (Layer 1), correct VLAN and MAC learned (Layer 2), valid IP, mask and gateway with ping working (Layer 3), port reachable (Layer 4), then application and DNS settings (Layers 5 to 7).",
    ],
  },
  {
    q: "The internet runs on TCP/IP. Is OSI still relevant?",
    a: [
      "Yes. It is the shared vocabulary of networking: people say it is a Layer 2 problem, or a Layer 7 load balancer, and everyone knows what is meant. It also gives a systematic way to troubleshoot.",
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Tab 6: common misconceptions
// ─────────────────────────────────────────────────────────────

const MISCONCEPTIONS = [
  {
    wrong: "OSI is the model the internet runs on.",
    right:
      "TCP/IP is what actually runs. OSI is the reference model we use to talk, teach, and troubleshoot.",
  },
  {
    wrong: "A layer only talks to the layer directly above and below it.",
    right:
      "True on the sending host, but a router at Layer 3 reads the IP header without ever unpacking Layers 4–7.",
  },
  {
    wrong: "Layers 4–7 are hop-by-hop.",
    right:
      "Layers 1–3 are hop-by-hop (switches and routers see them). Layers 4–7 are end-to-end — only the two hosts process them.",
  },
  {
    wrong: "MAC addresses stay the same end to end.",
    right:
      "MAC addresses are rewritten at every router. IP addresses stay the same end to end (unless NAT changes them).",
  },
  {
    wrong: "The IP address identifies the application.",
    right:
      "IP finds the host. The port number finds the application on that host. You need both.",
  },
  {
    wrong: "HTTPS is a protocol at Layer 7 only.",
    right:
      "HTTPS is HTTP (Layer 7) wrapped in TLS (usually mapped to Layer 6). Saying 'it lives at Layer 7' ignores the encryption.",
  },
  {
    wrong: "Layer 1 sends packets.",
    right:
      "Layer 1 sends bits — electrical signals, light pulses, or radio waves. Frames are Layer 2, packets are Layer 3.",
  },
  {
    wrong: "A switch is a Layer 3 device.",
    right:
      "A traditional switch is Layer 2 (MAC-based). A Layer 3 switch can route by IP, but plain switches do not.",
  },
  {
    wrong: "Ping succeeds, so the network is fine.",
    right:
      "Ping only proves Layers 1–3. The web server can still be down on port 443 (Layer 4) or returning a 500 (Layer 7).",
  },
  {
    wrong: "TLS lives at exactly one layer.",
    right:
      "There is no perfect answer. Layer 6 is the common reply, but TLS also depends on a Layer 5 session and runs on top of TCP at Layer 4. Saying 'Layer 6, and TCP/IP lumps it into Application' shows you know the model's limits.",
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

      
    </div>
  );
}

type DrillKind = "Protocol" | "Device" | "Data unit" | "Address" | "Concept";

interface DrillItem {
  clue: string;
  kind: DrillKind;
  layer: LayerNum;
  why: string;
}

const DRILL: DrillItem[] = [
  { clue: "HTTP", kind: "Protocol", layer: 7, why: "Web request and response protocol, application layer." },
  { clue: "DNS", kind: "Protocol", layer: 7, why: "Name resolution is an application-layer service." },
  { clue: "SMTP", kind: "Protocol", layer: 7, why: "Email sending protocol, application layer." },
  { clue: "DHCP", kind: "Protocol", layer: 7, why: "Runs over UDP but is an application-layer protocol." },
  { clue: "SSH", kind: "Protocol", layer: 7, why: "Remote login service, application layer." },
  { clue: "URL such as https://example.com", kind: "Address", layer: 7, why: "Application-level names identify resources." },
  { clue: "TLS / SSL encryption", kind: "Protocol", layer: 6, why: "Encryption is the Presentation layer's job (the usual answer)." },
  { clue: "JPEG / MPEG formats", kind: "Protocol", layer: 6, why: "Data formats and codecs belong to Presentation." },
  { clue: "ASCII / Unicode character encoding", kind: "Concept", layer: 6, why: "Translating data representation is Presentation." },
  { clue: "Compressing data before sending", kind: "Concept", layer: 6, why: "Compression is a Presentation function." },
  { clue: "RPC", kind: "Protocol", layer: 5, why: "Remote procedure calls rely on session management." },
  { clue: "NetBIOS", kind: "Protocol", layer: 5, why: "A classic session-layer service." },
  { clue: "Dialog control: simplex, half-duplex, full-duplex", kind: "Concept", layer: 5, why: "Who talks when is Session layer dialog control." },
  { clue: "Checkpoints so a transfer can resume", kind: "Concept", layer: 5, why: "Synchronization and checkpointing are Session features." },
  { clue: "TCP", kind: "Protocol", layer: 4, why: "Reliable, connection-oriented transport." },
  { clue: "UDP", kind: "Protocol", layer: 4, why: "Fast, connectionless transport." },
  { clue: "Port number 443", kind: "Address", layer: 4, why: "Ports identify the application, in the Transport header." },
  { clue: "Three-way handshake (SYN, SYN-ACK, ACK)", kind: "Concept", layer: 4, why: "TCP connection setup is Layer 4." },
  { clue: "Windowing and flow control", kind: "Concept", layer: 4, why: "TCP controls the sending rate at Layer 4." },
  { clue: "Segmentation and reassembly", kind: "Concept", layer: 4, why: "Transport splits data into segments and puts them back." },
  { clue: "Segment", kind: "Data unit", layer: 4, why: "The Transport layer's PDU (TCP)." },
  { clue: "Datagram (UDP)", kind: "Data unit", layer: 4, why: "The UDP version of a Transport PDU." },
  { clue: "IP", kind: "Protocol", layer: 3, why: "Logical addressing and routing." },
  { clue: "ICMP (ping)", kind: "Protocol", layer: 3, why: "Control and error messages for IP." },
  { clue: "OSPF", kind: "Protocol", layer: 3, why: "A routing protocol that builds routing tables." },
  { clue: "IP address", kind: "Address", layer: 3, why: "Logical address used by routers." },
  { clue: "Packet", kind: "Data unit", layer: 3, why: "The Network layer's PDU." },
  { clue: "Router", kind: "Device", layer: 3, why: "Forwards packets between networks using IP." },
  { clue: "Layer 3 switch", kind: "Device", layer: 3, why: "A switch that can also route by IP address." },
  { clue: "TTL decreasing at each hop", kind: "Concept", layer: 3, why: "TTL lives in the IP header." },
  { clue: "Choosing the best path", kind: "Concept", layer: 3, why: "Routing is a Network layer job." },
  { clue: "Ethernet (802.3) framing", kind: "Protocol", layer: 2, why: "Ethernet frames and addressing are Layer 2." },
  { clue: "PPP", kind: "Protocol", layer: 2, why: "A Data Link protocol for point-to-point links." },
  { clue: "802.1Q VLAN tagging", kind: "Protocol", layer: 2, why: "VLAN tags are added to Ethernet frames." },
  { clue: "Spanning Tree Protocol (STP)", kind: "Protocol", layer: 2, why: "Prevents Layer 2 loops." },
  { clue: "MAC address", kind: "Address", layer: 2, why: "Physical address of a NIC." },
  { clue: "Frame", kind: "Data unit", layer: 2, why: "The Data Link layer's PDU." },
  { clue: "Switch", kind: "Device", layer: 2, why: "Forwards frames using the MAC address table." },
  { clue: "Bridge", kind: "Device", layer: 2, why: "Connects segments and forwards by MAC address." },
  { clue: "MAC address table (CAM table)", kind: "Concept", layer: 2, why: "Switches learn which MAC is on which port." },
  { clue: "FCS / CRC error detection", kind: "Concept", layer: 2, why: "The frame trailer lets the receiver detect corruption." },
  { clue: "CSMA/CD", kind: "Concept", layer: 2, why: "Media access control belongs to the MAC sublayer." },
  { clue: "Hub", kind: "Device", layer: 1, why: "Repeats electrical signals to every port." },
  { clue: "Repeater", kind: "Device", layer: 1, why: "Regenerates the signal and knows nothing else." },
  { clue: "RJ45 connector and UTP cable", kind: "Device", layer: 1, why: "Physical media and connectors." },
  { clue: "Bits", kind: "Data unit", layer: 1, why: "The Physical layer's unit." },
  { clue: "Voltage, light pulses or radio waves", kind: "Concept", layer: 1, why: "Signal encoding is Layer 1." },
];

function QaList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {QA.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="overflow-hidden rounded-xl border bg-card">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full min-w-0 items-center gap-3 px-3.5 py-3 text-left outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1 text-sm font-medium">{item.q}</span>
              <ChevronDown
                className={cx(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
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
  );
}

function Drill() {
  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");
  const [pool, setPool] = useState<DrillItem[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<DrillItem[]>([]);

  const start = (size: number) => {
    setPool(shuffle(DRILL).slice(0, size));
    setI(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    setPhase("play");
  };

  const item = pool[i];

  const answer = (n: number) => {
    if (picked !== null || !item) return;
    setPicked(n);
    if (n === item.layer) setScore((s) => s + 1);
    else setMissed((m) => [...m, item]);
  };

  const next = () => {
    if (i + 1 < pool.length) {
      setI(i + 1);
      setPicked(null);
    } else {
      setPhase("done");
    }
  };

  if (phase === "idle") {
    return (
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm leading-relaxed">
          You get a protocol, device, address, data unit or concept. Pick the
          layer it belongs to. Missed items are listed at the end so you can
          review them.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[10, 20, DRILL.length].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => start(n)}
              className="rounded-lg border px-4 py-2 text-sm outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
            >
              <span className="font-semibold">{n === DRILL.length ? "All" : n}</span>{" "}
              <span className="text-muted-foreground">
                {n === DRILL.length ? `${n} questions` : "questions"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const total = pool.length;
    return (
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <p className="text-4xl font-semibold tabular-nums">
          {score}/{total}
        </p>
        <p className="text-sm text-muted-foreground">
          {score === total
            ? "Perfect. The layers are solid."
            : score >= Math.ceil(total * 0.8)
              ? "Strong. Review the few you missed below."
              : "Keep going. Go through the layers tab, then try again."}
        </p>
        {missed.length > 0 && (
          <div>
            <Label>Review these</Label>
            <div className="space-y-1.5">
              {missed.map((m) => {
                const l = layerOf(m.layer);
                return (
                  <div
                    key={m.clue}
                    style={hue(l.hue)}
                    className="flex min-w-0 items-start gap-2.5 rounded-lg border px-3 py-2"
                  >
                    <span className="osi-solid mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-bold">
                      {l.n}
                    </span>
                    <p className="min-w-0 text-sm">
                      <span className="font-medium">{m.clue}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        is Layer {l.n} ({l.name}). {m.why}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => start(pool.length)}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="rounded-lg border px-4 py-2 text-sm outline-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:ring-1 focus-visible:ring-ring"
          >
            Change length
          </button>
        </div>
      </div>
    );
  }

  const correct = picked !== null && picked === item.layer;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {i + 1} of {pool.length}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${(i / pool.length) * 100}%` }}
        />
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Which layer does this belong to? ({item.kind.toLowerCase()})
      </p>
      <p className="mt-1 break-words text-xl font-semibold">{item.clue}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LAYERS.map((l) => {
          const isRight = picked !== null && l.n === item.layer;
          const isWrongPick = picked === l.n && l.n !== item.layer;
          return (
            <button
              key={l.n}
              type="button"
              onClick={() => answer(l.n)}
              disabled={picked !== null}
              style={hue(l.hue)}
              className={cx(
                "flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                picked === null && "hover:bg-[var(--accent-soft)]",
                isRight && "border-emerald-500 bg-emerald-500/10",
                isWrongPick && "border-destructive bg-destructive/10",
                picked !== null && !isRight && !isWrongPick && "opacity-50",
              )}
            >
              <span className="osi-solid flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold">
                {l.n}
              </span>
              <span className="min-w-0 truncate">{l.name}</span>
              {isRight && <Check className="ml-auto size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
              {isWrongPick && <X className="ml-auto size-4 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="osi-fade mt-4 space-y-3">
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm leading-relaxed">
            <span className="font-semibold">
              {correct ? "Correct. " : `It is Layer ${item.layer} (${layerOf(item.layer).name}). `}
            </span>
            {item.why}
          </p>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {i + 1 < pool.length ? "Next question" : "See results"}
          </button>
        </div>
      )}
    </div>
  );
}

function PrepTab() {
  return (
    <div className="space-y-8">
      <section>
        <p className="mb-2 text-sm font-medium">Your 30-second answer</p>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm leading-relaxed">{PITCH}</p>
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-medium">Questions interviewers ask</p>
        <QaList />
      </section>

      <section>
        <p className="mb-2 text-sm font-medium">Layer drill</p>
        <Drill />
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// The component
// ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "layers", label: "The 7 layers" },
  { id: "journey", label: "Data journey" },
  { id: "compare", label: "OSI vs TCP/IP" },
  { id: "debug", label: "Troubleshooting" },
  { id: "misconceptions", label: "Misconceptions" },
  { id: "prep", label: "Interview prep" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function OsiModelExplainer() {
  const [tab, setTab] = useState<TabId>("layers");

  return (
    <div className="osi-root mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6">
      <style>{OSI_CSS}</style>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Topic 02 · Summary
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          The OSI reference model
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Seven layers, one job each. Learn what every layer does, watch data
          travel through them, then practice the questions interviewers
          actually ask.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="OSI model sections"
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
        {tab === "layers" && <LayersTab />}
        {tab === "journey" && <JourneyTab />}
        {tab === "compare" && <CompareTab />}
        {tab === "debug" && <DebugTab />}
        {tab === "misconceptions" && <MisconceptionsTab />}
        {tab === "prep" && <PrepTab />}
      </div>
    </div>
  );
}