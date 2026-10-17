"use client";

import { useState } from "react";
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
 * OsiReferenceModel  (CCNA Topic 02)
 *   1 The seven layers     : tap a layer for purpose, PDU, protocols, devices, failures, tools
 *   2 Data journey         : encapsulation (7 to 1) and decapsulation (1 to 7), step by step
 *   3 Who sees what        : which device reads which layer, hop by hop vs end to end
 *   4 OSI vs TCP/IP        : side-by-side layer mapping
 *   5 Troubleshooting      : approaches and the ping ladder
 *   6 Common mistakes      : wrong belief on the front, the truth on the back
 *   7 Interview prep       : 30-second answer and the sixteen usual questions
 */

const RED = "#c92a2a";
const BLUE = "#1971c2";
const GREEN = "#2f9e44";
const AMBER = "#f08c00";
const PURPLE = "#9c36b5";

const TABS = [
  { id: "layers", label: "1 · The seven layers" },
  { id: "journey", label: "2 · Data journey" },
  { id: "who", label: "3 · Who sees what" },
  { id: "tcpip", label: "4 · OSI vs TCP/IP" },
  { id: "trouble", label: "5 · Troubleshooting" },
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

/* ───────────────────────── layer data ───────────────────────── */

type Layer = {
  n: number;
  name: string;
  hook: string;
  purpose: string;
  pdu: string;
  tcpip: string;
  addressing: string;
  does: string[];
  protocols: string[];
  devices: string[];
  example: string;
  analogy: string;
  points: string[];
  fails: string[];
  tools: string[];
  down: string; // mnemonic word, top to bottom
  up: string; // mnemonic word, bottom to top
};

const LAYERS: Layer[] = [
  {
    n: 7,
    name: "Application",
    hook: "Apps ask here.",
    purpose: "The doorway between software and the network. It is not Chrome or Outlook themselves, it is the protocols those programs use to ask the network for something.",
    pdu: "Data",
    tcpip: "Application",
    addressing: "Names: URLs, hostnames, email addresses",
    does: [
      "Provides network services to applications: web, email, file transfer, name lookup",
      "Defines how requests and replies look (HTTP methods, SMTP commands, DNS queries)",
      "Identifies the communication partner and checks the resource is reachable",
      "Handles application-level authentication",
    ],
    protocols: ["HTTP", "HTTPS", "FTP", "SMTP", "POP3", "IMAP", "DNS", "DHCP", "SSH", "Telnet", "SNMP", "NTP"],
    devices: ["End hosts", "Web and mail servers", "Proxies", "Layer 7 firewalls / WAFs", "Layer 7 load balancers"],
    example: "You type google.com and press Enter. The browser builds an HTTP GET request. DNS, a Layer 7 protocol too, turned the name into an IP address first.",
    analogy: "The General writes the order.",
    points: [
      "Layer 7 is the protocol the app uses, not the app itself.",
      "DNS and DHCP are application-layer protocols even though they support the network.",
      "A site that opens by IP but not by name points to DNS, a Layer 7 problem.",
    ],
    fails: ["HTTP 404 / 500 errors", "Name does not resolve", "Wrong mail server settings", "Login or authentication fails"],
    tools: ["curl", "nslookup / dig", "Browser dev tools", "Application logs"],
    down: "All",
    up: "Away",
  },
  {
    n: 6,
    name: "Presentation",
    hook: "Format and protect.",
    purpose: "The translator. Makes sure data sent by one system can be read by another, and can protect or shrink the data on the way.",
    pdu: "Data",
    tcpip: "Application",
    addressing: "None. It works on the format of the data.",
    does: [
      "Translation between formats and character sets (ASCII, Unicode, JSON, XML)",
      "Encryption and decryption (TLS is usually explained here)",
      "Compression and decompression",
      "Data serialization, such as image and video formats",
    ],
    protocols: ["TLS / SSL (usually mapped here)", "ASCII", "Unicode", "JPEG", "GIF", "PNG", "MPEG", "JSON / XML"],
    devices: ["End hosts (OS and libraries)", "TLS offload appliances"],
    example: "Browser and server agree on TLS. Your request is encrypted, so anyone sniffing the cable sees random bytes instead of your data.",
    analogy: "The cipher clerk turns the order into secret code.",
    points: [
      "TLS does not map cleanly to one layer. Layer 6 is the common answer, and it helps to mention that TCP/IP lumps it into Application.",
      "Presentation answers: what format is this data, and is it protected?",
      "Layers 5 to 7 collapse into one Application layer in TCP/IP.",
    ],
    fails: ["Certificate errors", "Garbled characters (wrong encoding)", "Unsupported image or video codec", "TLS version or cipher mismatch"],
    tools: ["openssl s_client", "Browser certificate viewer", "Wireshark (TLS handshake)"],
    down: "People",
    up: "Pizza",
  },
  {
    n: 5,
    name: "Session",
    hook: "Start, keep, stop the conversation.",
    purpose: "The conversation manager. Sets up a session between two applications, keeps it alive, decides who talks when, and shuts it down cleanly.",
    pdu: "Data",
    tcpip: "Application",
    addressing: "Session IDs",
    does: [
      "Establishes, maintains and terminates sessions",
      "Dialog control: simplex, half-duplex or full-duplex",
      "Checkpoints, so a long transfer can resume instead of restarting",
      "Recovery after an interruption",
    ],
    protocols: ["NetBIOS", "RPC", "SIP", "PPTP", "SMB / NFS sessions"],
    devices: ["End hosts (operating system)", "Session-aware servers"],
    example: "After you log in, the server tracks your session so the next click does not ask for a password again. A call that drops for a second can resume.",
    analogy: "The telephone operator connects the two headquarters, keeps the line open, then hangs up.",
    points: [
      "Simplex is one way (TV broadcast). Half-duplex is two ways, one at a time (walkie-talkie). Full-duplex is both at once (phone call).",
      "A session is not a TCP connection. The TCP connection is Layer 4, and one session can outlive several connections.",
      "Keywords to remember: dialog control and checkpoints.",
    ],
    fails: ["Sessions time out unexpectedly", "Mapped drives drop and need re-authentication", "VoIP calls drop mid-conversation", "RPC errors"],
    tools: ["netstat / ss", "Server session logs", "Wireshark"],
    down: "Should",
    up: "Sausage",
  },
  {
    n: 4,
    name: "Transport",
    hook: "Ports and reliability.",
    purpose: "Moves data between two processes on two hosts. TCP gives reliability, UDP gives speed, and port numbers say which application the data belongs to.",
    pdu: "Segment (TCP) or datagram (UDP)",
    tcpip: "Transport",
    addressing: "Port numbers (0 to 65535)",
    does: [
      "Segmentation and reassembly",
      "Port-based multiplexing: many apps share one IP address",
      "TCP: three-way handshake, sequencing, acknowledgments, retransmission, flow control (windowing)",
      "UDP: connectionless, low overhead, no delivery guarantee",
    ],
    protocols: ["TCP", "UDP", "SCTP", "QUIC (built on UDP)"],
    devices: ["End hosts (OS network stack)", "Stateful firewalls", "Layer 4 load balancers", "PAT / NAT overload devices"],
    example: "The browser opens a TCP connection to port 443: SYN, SYN-ACK, ACK. Its own source port is a random high number such as 51514.",
    analogy: "The courier service splits the order into numbered envelopes and confirms each one arrived.",
    points: [
      "TCP is reliable, ordered and connection-oriented (web, email, SSH). UDP is fast and best-effort (DNS queries, VoIP, streaming, games).",
      "Three-way handshake: SYN, SYN-ACK, ACK. Closing uses FIN and ACK, or RST to abort.",
      "Well-known ports are 0 to 1023, registered ports 1024 to 49151, dynamic ports 49152 to 65535.",
      "The IP address finds the host. The port finds the application.",
    ],
    fails: ["Port blocked by firewall or ACL", "Connection refused or timed out", "Slow transfers from retransmissions", "Port already in use"],
    tools: ["netstat / ss", "nc -zv host port", "telnet host port", "Wireshark"],
    down: "Try",
    up: "Throw",
  },
  {
    n: 3,
    name: "Network",
    hook: "IP and routers.",
    purpose: "Gets packets across different networks. Adds source and destination IP addresses, and routers pick the best path hop by hop.",
    pdu: "Packet",
    tcpip: "Internet",
    addressing: "IP address (IPv4 is 32-bit, IPv6 is 128-bit), logical",
    does: [
      "Logical (IP) addressing",
      "Routing: choosing the best path from a routing table",
      "Forwarding packets between networks and subnets",
      "Fragmentation when a packet exceeds the MTU",
      "Diagnostics and error reporting with ICMP",
    ],
    protocols: ["IPv4", "IPv6", "ICMP", "IPsec", "OSPF", "EIGRP"],
    devices: ["Routers", "Layer 3 switches", "Firewalls in routed mode"],
    example: "The PC puts source 192.168.1.10 and destination 10.0.2.20 into the IP header. Each router along the way reads the destination and picks the next hop.",
    analogy: "The mail room writes the building and street address and chooses the route.",
    points: [
      "Routers separate broadcast domains. A switch does not by default (VLANs can split them).",
      "TTL drops by one at every router. At zero the packet is discarded and ICMP Time Exceeded is returned, which is how traceroute works.",
      "IP addresses stay the same end to end (unless NAT). MAC addresses change at every hop.",
      "Ping uses ICMP, so it is a Layer 3 tool.",
    ],
    fails: ["Wrong IP, subnet mask or default gateway", "No route to destination", "Routing loops or TTL exceeded", "IP address conflicts or NAT problems"],
    tools: ["ping", "traceroute / tracert", "ipconfig / ip addr", "show ip route"],
    down: "New",
    up: "Not",
  },
  {
    n: 2,
    name: "Data Link",
    hook: "MAC and switches.",
    purpose: "Delivers frames between two directly connected devices. Uses MAC addresses to say who is next on the local link, and detects damaged frames.",
    pdu: "Frame",
    tcpip: "Network Access",
    addressing: "MAC address (48-bit, burned into the NIC)",
    does: [
      "Physical (MAC) addressing",
      "Framing: adds a header and a trailer (FCS)",
      "Error detection with the FCS / CRC (detects, does not correct)",
      "Media access control (CSMA/CD on classic Ethernet, CSMA/CA on Wi-Fi)",
      "Switching with a MAC address (CAM) table",
      "VLAN tagging (802.1Q) and loop prevention (STP)",
    ],
    protocols: ["Ethernet (802.3)", "Wi-Fi (802.11)", "PPP", "HDLC", "802.1Q VLANs", "STP", "LLC (802.2)", "ARP (sits between Layers 2 and 3)"],
    devices: ["Switches", "Bridges", "NICs", "Wireless access points"],
    example: "The NIC wraps the packet in an Ethernet frame. The destination MAC is not the server's, it is the router's, because the router is the next hop.",
    analogy: "The local delivery driver only knows the door number of the next building.",
    points: [
      "Two sublayers: LLC (faces up, identifies the Layer 3 protocol) and MAC (addressing and access to the medium).",
      "A switch learns source MACs into its MAC / CAM table, forwards known unicast out one port, and floods unknown or broadcast frames.",
      "Frames have a trailer (FCS). Packets and segments do not.",
      "Hub is Layer 1 (repeats to every port). Switch is Layer 2 (forwards intelligently).",
    ],
    fails: ["VLAN mismatch", "Duplex or speed mismatch, CRC errors", "MAC table or port-security problems", "Layer 2 loops and broadcast storms"],
    tools: ["show mac address-table", "show vlan / show interfaces", "arp -a", "Wireshark"],
    down: "Domino's",
    up: "Do",
  },
  {
    n: 1,
    name: "Physical",
    hook: "Bits, cables, signals.",
    purpose: "The actual medium. Turns the frame into electrical signals, light pulses or radio waves, and defines the cables, connectors and signaling.",
    pdu: "Bits",
    tcpip: "Network Access",
    addressing: "None",
    does: [
      "Transmits raw bits (0s and 1s)",
      "Signal encoding and modulation",
      "Cables, connectors and pinouts (RJ45)",
      "Data rates, topology and transmission mode (simplex, half, full)",
      "Media: copper (UTP, coax), fiber, wireless",
    ],
    protocols: ["Ethernet PHY standards (1000BASE-T and others)", "RJ45", "DSL", "SONET", "802.11 radio", "Bluetooth radio"],
    devices: ["Hubs", "Repeaters", "Cables and connectors", "Media converters", "Modems"],
    example: "The NIC turns the frame into voltage changes on the copper pairs of the Ethernet cable, light in fiber, or radio in Wi-Fi.",
    analogy: "The roads, trucks and telephone wires.",
    points: [
      "Layer 1 has no addressing and no intelligence. A hub just repeats bits out every port, so all ports share one collision domain.",
      "A UTP Ethernet segment is limited to 100 m. Fiber covers longer distances.",
      "Dead link light, unplugged cable, bad SFP: check Layer 1 first.",
    ],
    fails: ["Cable unplugged or damaged", "Bad connector or port", "Interference, attenuation, run too long", "Wrong cable or transceiver type"],
    tools: ["Cable tester", "show interfaces (up/down)", "Link LEDs", "Optical power meter"],
    down: "Pizza",
    up: "Please",
  },
];

/* ───────────────────────── 1 · the seven layers ───────────────────────── */

function LayersSection() {
  const [sel, setSel] = useState(7);
  const [mn, setMn] = useState<"off" | "down" | "up">("off");
  const [sheet, setSheet] = useState(false);
  const L = LAYERS.find((x) => x.n === sel)!;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">A seven-layer reference model, published by ISO in 1984</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          It splits network communication into layers, each doing one job. Vendors can build products that work together,
          engineers can troubleshoot one layer at a time, and a change in one layer does not break the others.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">OSI = theory, used for teaching and troubleshooting</Badge>
          <Badge variant="secondary">TCP/IP = what the internet actually runs on</Badge>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">Tap a layer</p>
          <span className="text-xs text-muted-foreground">Mnemonic:</span>
          <Pick active={mn === "off"} onClick={() => setMn("off")}>Off</Pick>
          <Pick active={mn === "down"} onClick={() => setMn("down")}>Top to bottom</Pick>
          <Pick active={mn === "up"} onClick={() => setMn("up")}>Bottom to top</Pick>
        </div>
        {mn !== "off" && (
          <p className="n2-fade mt-2 text-xs font-medium text-primary">
            {mn === "down"
              ? "All People Should Try New Domino's Pizza (layer 7 down to 1)"
              : "Please Do Not Throw Sausage Pizza Away (layer 1 up to 7)"}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          {LAYERS.map((l) => {
            const on = l.n === sel;
            return (
              <button
                key={l.n}
                type="button"
                onClick={() => setSel(l.n)}
                className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  on ? "border-primary bg-primary/10" : "hover:border-primary/50"
                }`}
              >
                <span className="w-5 font-mono text-sm font-bold">{l.n}</span>
                <span className="w-28 text-sm font-semibold">{l.name}</span>
                <Badge variant="secondary">{l.pdu.split(" ")[0]}</Badge>
                <span className="hidden flex-1 text-muted-foreground sm:block">{l.hook}</span>
                {mn !== "off" && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground">
                    {mn === "down" ? l.down : l.up}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel key={sel} className="n2-fade">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold">
            Layer {L.n} <span className="text-sm font-normal text-muted-foreground">{L.name}</span>
          </p>
          <Badge variant="secondary">{L.hook}</Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{L.purpose}</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["Data unit (PDU)", L.pdu],
            ["TCP/IP layer", L.tcpip],
            ["Addressing", L.addressing],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="text-xs font-medium">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">What it does</p>
            <Bullets items={L.does} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">Interview points</p>
            <Bullets items={L.points} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold">Protocols</p>
            <div className="flex flex-wrap gap-1.5">
              {L.protocols.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold">Devices</p>
            <div className="flex flex-wrap gap-1.5">
              {L.devices.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Example</p>
            <p className="mt-1 text-xs leading-5">{L.example}</p>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Analogy</p>
            <p className="mt-1 text-xs leading-5">{L.analogy}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold" style={{ color: RED }}>When it fails</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
              {L.fails.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold" style={{ color: GREEN }}>Tools to check it</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {L.tools.map((f) => <Badge key={f} variant="secondary" className="font-mono">{f}</Badge>)}
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setSheet((s) => !s)}>
          {sheet ? "Hide cheat sheet" : "Show one-glance cheat sheet"}
        </Button>
      </div>
      {sheet && (
        <div className="n2-fade">
          <SimpleTable
            head={["Layer", "Name", "Data unit", "Address", "Key protocols", "Devices"]}
            rows={[
              ["7", "Application", "Data", "Names (URLs)", "HTTP, HTTPS, FTP, SMTP", "End hosts, WAFs"],
              ["6", "Presentation", "Data", "None", "TLS/SSL, JPEG, ASCII", "End hosts"],
              ["5", "Session", "Data", "Session IDs", "NetBIOS, RPC, SIP", "End hosts"],
              ["4", "Transport", "Segment / Datagram", "Port numbers", "TCP, UDP", "Firewalls, L4 load balancers"],
              ["3", "Network", "Packet", "IP address", "IPv4, IPv6, ICMP, OSPF", "Routers, L3 switches"],
              ["2", "Data Link", "Frame", "MAC address", "Ethernet, Wi-Fi, STP, ARP", "Switches, bridges, NICs"],
              ["1", "Physical", "Bits", "None", "Ethernet PHY, RJ45", "Hubs, repeaters, cables"],
            ]}
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── 2 · data journey ───────────────────────── */

type PieceKind = "l2" | "l3" | "l4" | "data" | "sec";
type Piece = { label: string; sub?: string; k: PieceKind };
const KCOLOR: Record<PieceKind, string> = { l2: PURPLE, l3: BLUE, l4: GREEN, data: AMBER, sec: RED };

const P_DATA: Piece = { label: "Data", sub: "GET / (HTTP request)", k: "data" };
const P_ENC: Piece = { label: "Data", sub: "encoded, compressed, TLS-encrypted", k: "sec" };
const P_TCP: Piece = { label: "TCP header", sub: "src port 51514, dst port 443", k: "l4" };
const P_IP: Piece = { label: "IP header", sub: "192.168.1.10 to 10.0.2.20, TTL 64", k: "l3" };
const P_ETH: Piece = { label: "Ethernet header", sub: "dst MAC = R1 (found with ARP)", k: "l2" };
const P_FCS: Piece = { label: "FCS", sub: "error check", k: "l2" };
const P_BITS: Piece = { label: "0 1 0 1 1 0 1 0 ...", sub: "electrical signal, light or radio", k: "data" };

type JStep = { layer: number; name: string; pdu: string; title: string; text: string; pieces: Piece[]; removed?: string; note?: string };

const ENCAP: JStep[] = [
  {
    layer: 7, name: "Application", pdu: "Data",
    title: "The application creates the data",
    text: "PC-A's browser needs a page from Server-B, so HTTP builds a request: GET / with the host name. Nothing is addressed yet. It is just data.",
    pieces: [P_DATA],
  },
  {
    layer: 6, name: "Presentation", pdu: "Data",
    title: "Presentation encodes and protects it",
    text: "The request is encoded (UTF-8), can be compressed, and is encrypted by TLS. Anyone sniffing the cable sees random-looking bytes.",
    pieces: [P_ENC],
  },
  {
    layer: 5, name: "Session", pdu: "Data",
    title: "Session keeps the dialog open",
    text: "A session is set up and tracked (session IDs, TLS session). It decides who talks when, so the conversation can continue and later close cleanly.",
    pieces: [{ ...P_ENC, sub: "encrypted, and tracked as part of a session" }],
  },
  {
    layer: 4, name: "Transport", pdu: "Segment",
    title: "Transport adds ports and makes a segment",
    text: "TCP numbers the data and adds a TCP header: source port 51514 (random) and destination port 443 (HTTPS). The three-way handshake (SYN, SYN-ACK, ACK) already created this connection.",
    pieces: [P_TCP, P_ENC],
  },
  {
    layer: 3, name: "Network", pdu: "Packet",
    title: "Network adds IP addresses and makes a packet",
    text: "IP adds source 192.168.1.10 and destination 10.0.2.20. The server is on another network, so the next hop is the default gateway, R1. TTL starts at 64.",
    pieces: [P_IP, P_TCP, P_ENC],
  },
  {
    layer: 2, name: "Data Link", pdu: "Frame",
    title: "Data Link adds MAC addresses and makes a frame",
    text: "Ethernet wraps the packet. The destination MAC is R1's interface (found with ARP), not the server's, because MAC addresses only work on the local link. The trailer carries the FCS so the receiver can detect corruption.",
    pieces: [P_ETH, P_IP, P_TCP, P_ENC, P_FCS],
    note: "IP addresses stay the same all the way to Server-B. MAC addresses are rewritten at every router.",
  },
  {
    layer: 1, name: "Physical", pdu: "Bits",
    title: "Physical sends the bits",
    text: "The NIC converts the frame into bits and sends them as electrical signals on copper, light in fiber, or radio in Wi-Fi. Each router on the way unwraps the frame up to Layer 3, picks the next hop, and builds a brand-new frame.",
    pieces: [P_BITS],
  },
];

const DECAP: JStep[] = [
  {
    layer: 1, name: "Physical", pdu: "Bits",
    title: "Server-B's NIC receives the bits",
    text: "The NIC detects the signal, turns it back into bits, then groups the bits into a frame.",
    pieces: [P_BITS],
  },
  {
    layer: 2, name: "Data Link", pdu: "Packet left",
    title: "Data Link checks the frame",
    text: "The NIC confirms the destination MAC is its own (DE:AD:BE:EF:00:20), verifies the FCS (damaged frames are dropped), and strips the Ethernet header and trailer. What is left is a packet.",
    pieces: [P_IP, P_TCP, P_ENC],
    removed: "Ethernet header + FCS",
    note: "This frame came from R2, not from PC-A. PC-A's original frame was discarded at R1, and a new frame was built at each router.",
  },
  {
    layer: 3, name: "Network", pdu: "Segment left",
    title: "Network checks the packet",
    text: "IP confirms the destination 10.0.2.20 is this host, validates the header, strips it, and reads the protocol field (6 means TCP) to know who gets the payload. What is left is a segment.",
    pieces: [P_TCP, P_ENC],
    removed: "IP header",
  },
  {
    layer: 4, name: "Transport", pdu: "Data left",
    title: "Transport hands the data to the right process",
    text: "TCP uses destination port 443 to find the web server process, reorders segments by sequence number, sends ACKs, and asks for anything missing. Stripping the TCP header leaves the data.",
    pieces: [P_ENC],
    removed: "TCP header",
  },
  {
    layer: 5, name: "Session", pdu: "Data",
    title: "Session matches the dialog",
    text: "The data is matched to the existing session, so the server knows which client conversation it belongs to and keeps the dialog going.",
    pieces: [{ ...P_ENC, sub: "matched to the existing session" }],
  },
  {
    layer: 6, name: "Presentation", pdu: "Data",
    title: "Presentation decrypts and decodes",
    text: "TLS decrypts the bytes, then the data is decompressed and decoded. The server can finally read the request.",
    pieces: [P_DATA],
  },
  {
    layer: 7, name: "Application", pdu: "Data",
    title: "The application handles the request",
    text: "The web server application reads GET / and builds a response. That response now makes the same trip in reverse: down Server-B's stack and up PC-A's.",
    pieces: [P_DATA],
  },
];

function JourneySection() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [i, setI] = useState(0);
  const steps = mode === "enc" ? ENCAP : DECAP;
  const s = steps[i];

  return (
    <div className="flex flex-col gap-4">
      <style>{`.n2-piece{animation:n2-fade .5s ease-out both}`}</style>
      <Panel>
        <p className="text-sm font-semibold">Lab setup</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">PC-A (192.168.1.10) , Switch , R1 = R2 , Switch , Server-B (10.0.2.20)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={mode === "enc"} onClick={() => { setMode("enc"); setI(0); }}>Sending: encapsulation (7 to 1)</Pick>
          <Pick active={mode === "dec"} onClick={() => { setMode("dec"); setI(0); }}>Receiving: decapsulation (1 to 7)</Pick>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        {steps.map((st, k) => (
          <Pick key={k} active={k === i} onClick={() => setI(k)}>L{st.layer}</Pick>
        ))}
      </div>

      <Panel>
        <div key={`${mode}-${i}`} className="n2-fade flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">Step {i + 1} of {steps.length}</p>
            <Badge variant="secondary">Layer {s.layer} · {s.name}</Badge>
            <Badge variant="secondary" style={{ color: GREEN }}>{mode === "enc" ? "Becomes" : "Now"}: {s.pdu}</Badge>
          </div>
          <p className="text-sm font-semibold">{s.title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{s.text}</p>

          <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3">
            <div className="flex min-w-max items-stretch gap-1.5">
              {s.pieces.map((p, k) => {
                const c = KCOLOR[p.k];
                return (
                  <div key={`${p.label}${k}`} className="n2-piece rounded-md border px-3 py-2" style={{ borderColor: c, background: `${c}14`, animationDelay: `${k * 0.08}s` }}>
                    <p className="text-xs font-semibold" style={{ color: c }}>{p.label}</p>
                    {p.sub && <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.sub}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {s.removed && (
            <p className="text-xs font-medium" style={{ color: RED }}>Removed at this layer: {s.removed}</p>
          )}
          {s.note && <Tip title="Note">{s.note}</Tip>}
        </div>
      </Panel>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>Back</Button>
        <Button size="sm" disabled={i === steps.length - 1} onClick={() => setI((v) => Math.min(steps.length - 1, v + 1))}>Next step</Button>
        {i === steps.length - 1 && mode === "enc" && (
          <Button size="sm" variant="outline" onClick={() => { setMode("dec"); setI(0); }}>Now the receiver</Button>
        )}
      </div>

      <Tip>
        Going down the stack, each layer wraps the data with its own header (Layer 2 also adds a trailer). Going up, each
        layer reads and removes its own header and passes the payload up. Data, then segment, then packet, then frame, then bits.
      </Tip>
    </div>
  );
}

/* ───────────────────────── 3 · who sees what ───────────────────────── */

const PATH = [
  { name: "PC-A", max: 7 },
  { name: "SW1", max: 2 },
  { name: "R1", max: 3 },
  { name: "R2", max: 3 },
  { name: "SW2", max: 2 },
  { name: "Server-B", max: 7 },
];
const DEV_TABLE = [
  ["Hub / repeater", "1", "Nothing. Repeats the signal out of every port."],
  ["Switch", "2", "Destination MAC in the frame header."],
  ["Router", "3", "Destination IP in the packet header."],
  ["End host", "7", "Everything, up to the application data."],
];
const HOPS_T = [
  { name: "PC-A to R1", sMac: "PC-A NIC", dMac: "R1 (LAN side)" },
  { name: "R1 to R2", sMac: "R1 (WAN side)", dMac: "R2 (WAN side)" },
  { name: "R2 to Server-B", sMac: "R2 (LAN side)", dMac: "Server-B (DE:AD:BE:EF:00:20)" },
];

function WhoSection() {
  const [f, setF] = useState<"all" | "hop" | "e2e">("all");
  const [hop, setHop] = useState(0);
  const h = HOPS_T[hop];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Which device handles which layer?</p>
        <p className="mt-1 text-xs text-muted-foreground">Each column is a device on the path. A filled cell means that device processes that layer.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pick active={f === "all"} onClick={() => setF("all")}>All layers</Pick>
          <Pick active={f === "hop"} onClick={() => setF("hop")}>Layers 1 to 3: hop by hop</Pick>
          <Pick active={f === "e2e"} onClick={() => setF("e2e")}>Layers 4 to 7: end to end</Pick>
        </div>

        <div className="mt-3 overflow-x-auto">
          <div className="grid min-w-[520px] gap-1" style={{ gridTemplateColumns: "110px repeat(6, 1fr)" }}>
            <div />
            {PATH.map((d) => (
              <div key={d.name} className="text-center text-xs font-semibold">{d.name}</div>
            ))}
            {LAYERS.map((l) => {
              const inFilter = f === "all" || (f === "hop" ? l.n <= 3 : l.n >= 4);
              return (
                <div key={l.n} className="contents">
                  <div className="flex items-center gap-2 text-xs" style={{ opacity: inFilter ? 1 : 0.35 }}>
                    <span className="w-4 font-mono font-bold">{l.n}</span>
                    {l.name}
                  </div>
                  {PATH.map((d) => {
                    const on = l.n <= d.max;
                    return (
                      <div
                        key={d.name}
                        className="h-8 rounded-md border transition-all"
                        style={{
                          background: on ? (l.n <= 3 ? `${BLUE}30` : `${GREEN}30`) : undefined,
                          borderColor: on ? (l.n <= 3 ? BLUE : GREEN) : undefined,
                          opacity: inFilter ? 1 : 0.2,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Layers 1 to 3 are <span className="font-semibold" style={{ color: BLUE }}>hop by hop</span>: every device on the
          path handles them. Layers 4 to 7 are <span className="font-semibold" style={{ color: GREEN }}>end to end</span>:
          only the two hosts handle them (unless a firewall, NAT device, proxy or load balancer in the middle looks higher).
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">How far up does each device read?</p>
        <div className="mt-3">
          <SimpleTable head={["Device", "Max layer", "Reads"]} rows={DEV_TABLE} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">IP stays, MAC changes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOPS_T.map((x, k) => (
            <Pick key={x.name} active={hop === k} onClick={() => setHop(k)}>{x.name}</Pick>
          ))}
        </div>
        <div key={hop} className="n2-fade mt-3 grid gap-2 sm:grid-cols-2">
          {[
            ["Src IP", "192.168.1.10", false],
            ["Dest IP", "10.0.2.20", false],
            ["Src MAC", h.sMac, true],
            ["Dest MAC", h.dMac, true],
          ].map(([k, v, changes]) => (
            <div key={String(k)} className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="text-xs font-semibold" style={{ color: changes ? BLUE : undefined }}>{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The IPs are the same on every hop (unless NAT changes them). Both MACs are new on every hop, because MAC addresses only work on the local link.
        </p>
      </Panel>
    </div>
  );
}

/* ───────────────────────── 4 · OSI vs TCP/IP ───────────────────────── */

const TCPIP = [
  { name: "Application", rows: [7, 6, 5], ex: "HTTP, DNS, DHCP, SSH, SMTP, TLS" },
  { name: "Transport", rows: [4], ex: "TCP, UDP" },
  { name: "Internet", rows: [3], ex: "IP, ICMP, routing" },
  { name: "Network Access", rows: [2, 1], ex: "Ethernet, Wi-Fi, cables" },
];

function TcpipSection() {
  const [sel, setSel] = useState<string | null>("Internet");
  const hi = TCPIP.find((t) => t.name === sel)?.rows ?? [];
  const chosen = TCPIP.find((t) => t.name === sel);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Tap a TCP/IP layer to see which OSI layers it covers</p>
        <div className="mt-3 overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-[150px_1fr] gap-x-3">
            <p className="pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">TCP/IP (4)</p>
            <p className="pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">OSI (7)</p>
          </div>
          <div className="grid min-w-[520px] grid-cols-[150px_1fr] gap-x-3 gap-y-1" style={{ gridTemplateRows: "repeat(7, auto)" }}>
            {TCPIP.map((t) => {
              const top = 7 - Math.max(...t.rows) + 1;
              const on = sel === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSel(on ? null : t.name)}
                  style={{ gridColumn: 1, gridRow: `${top} / span ${t.rows.length}` }}
                  className={`rounded-lg border px-2 text-xs font-semibold transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-muted/40 hover:border-primary/50"}`}
                >
                  {t.name}
                </button>
              );
            })}
            {LAYERS.map((l, idx) => {
              const on = hi.includes(l.n);
              return (
                <div
                  key={l.n}
                  style={{ gridColumn: 2, gridRow: idx + 1 }}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors ${on ? "border-primary bg-primary/10" : sel ? "opacity-50" : ""}`}
                >
                  <span className="w-5 font-mono font-bold">{l.n}</span>
                  <span className="w-24 font-semibold">{l.name}</span>
                  <span className="hidden flex-1 text-muted-foreground sm:block">{l.protocols.slice(0, 4).join(", ")}</span>
                </div>
              );
            })}
          </div>
        </div>
        {chosen && (
          <p className="n2-fade mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{chosen.name}</span> covers OSI layer{chosen.rows.length > 1 ? "s" : ""} {[...chosen.rows].sort().join(", ")}. Examples: {chosen.ex}.
          </p>
        )}
      </Panel>

      <SimpleTable
        head={["Aspect", "OSI", "TCP/IP"]}
        rows={[
          ["Number of layers", "7", "4 (some books split Network Access to make 5)"],
          ["Origin", "ISO, published 1984", "US Department of Defense research, 1970s"],
          ["Nature", "Reference model, independent of any protocol", "Practical model built around the protocols the internet really uses"],
          ["Layers 5 to 7", "Three separate layers", "Merged into one Application layer"],
          ["Layers 1 and 2", "Two separate layers", "Merged into one Network Access layer"],
          ["Best used for", "Teaching, design talk, troubleshooting vocabulary", "Describing what actually runs on real networks"],
        ]}
      />

      <Tip title="Interview phrasing">
        "We describe and troubleshoot with the OSI model, but the internet actually runs on TCP/IP."
      </Tip>
    </div>
  );
}

/* ───────────────────────── 5 · troubleshooting ───────────────────────── */

const APPROACHES = [
  { id: "bu", name: "Bottom-up", when: "You suspect hardware, or have no idea where to start.", how: "Check cables and links first, then VLAN and MAC, then IP, then ports, then the application.", order: [1, 2, 3, 4, 7] },
  { id: "td", name: "Top-down", when: "Only one application is broken and everything else works.", how: "Start with the app and its settings, then go down until you find the first failing layer.", order: [7, 4, 3, 2, 1] },
  { id: "dc", name: "Divide and conquer", when: "You are an experienced engineer with a gut feeling.", how: "Start at Layer 3 with ping. If it works, look up. If it fails, look down.", order: [3] },
];

const LADDER = [
  { cmd: "ping 127.0.0.1", proves: "The TCP/IP stack on this computer works.", fail: "The TCP/IP stack on this computer is broken or not installed. Fix the host itself." },
  { cmd: "ping 192.168.1.10 (your own IP)", proves: "The IP address is configured on this host.", fail: "No IP address is configured, or the NIC is disabled. This traffic never leaves the machine, so it cannot prove the cable is good." },
  { cmd: "ping 192.168.1.1 (default gateway)", proves: "Layers 1 and 2 on the local network work, and the gateway answers.", fail: "Look at Layers 1 and 2: cable, link light, VLAN, switch port. Also check the IP, mask and gateway address, and that the gateway is up." },
  { cmd: "ping 8.8.8.8 (a remote IP)", proves: "Routing beyond your network works (Layer 3).", fail: "Layer 3 beyond your network: no route or default route, the gateway cannot reach the internet, or something blocks ICMP." },
  { cmd: "ping google.com", proves: "DNS works too (Layer 7 name resolution).", fail: "The remote IP works but the name does not, so it is a DNS problem (Layer 7). Check the configured DNS servers." },
];

function TroubleSection() {
  const [ap, setAp] = useState("bu");
  const [fail, setFail] = useState<number | null>(null);
  const a = APPROACHES.find((x) => x.id === ap)!;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <p className="text-sm font-semibold">Pick an approach</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {APPROACHES.map((x) => (
            <Pick key={x.id} active={ap === x.id} onClick={() => setAp(x.id)}>{x.name}</Pick>
          ))}
        </div>
        <div key={ap} className="n2-fade mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Use it when</p>
            <p className="text-xs font-medium">{a.when}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">How</p>
            <p className="text-xs font-medium">{a.how}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Order of checks:</span>
          {a.order.map((n, k) => (
            <span key={k} className="flex items-center gap-2">
              <Badge variant="secondary">L{n}</Badge>
              {k < a.order.length - 1 && <span className="text-muted-foreground">→</span>}
            </span>
          ))}
          {a.id === "dc" && <span className="text-muted-foreground">then up or down</span>}
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">The ping ladder</p>
        <p className="mt-1 text-xs text-muted-foreground">Run the steps in order. Tap the step that fails first to see what it tells you.</p>
        <div className="mt-3 flex flex-col gap-1.5">
          {LADDER.map((s, k) => {
            const bad = fail === k;
            const ok = fail !== null && k < fail;
            return (
              <button
                key={s.cmd}
                type="button"
                onClick={() => setFail(bad ? null : k)}
                className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:border-primary/50"
                style={{ borderColor: bad ? RED : ok ? GREEN : undefined, background: bad ? `${RED}10` : ok ? `${GREEN}10` : undefined, opacity: fail !== null && k > fail ? 0.45 : 1 }}
              >
                <span className="w-4 font-mono font-bold">{k + 1}</span>
                <span className="font-mono font-semibold">{s.cmd}</span>
                <span className="flex-1 text-muted-foreground">{s.proves}</span>
                <span className="font-semibold" style={{ color: bad ? RED : ok ? GREEN : undefined }}>{bad ? "✕ fails" : ok ? "✓ works" : ""}</span>
              </button>
            );
          })}
        </div>
        {fail !== null && (
          <div className="n2-fade mt-3 rounded-lg border px-3 py-2 text-xs leading-5" style={{ borderColor: RED }}>
            <span className="font-semibold" style={{ color: RED }}>Step {fail + 1} fails first. </span>
            {LADDER[fail].fail}
          </div>
        )}
        <p className="mt-3 text-xs font-medium">The first step that fails tells you which layer to look at.</p>
      </Panel>

      <Panel>
        <p className="text-sm font-semibold">What fails, and what to check, at each layer</p>
        <div className="mt-3">
          <SimpleTable
            head={["Layer", "Common failures", "Tools"]}
            rows={LAYERS.map((l) => [`${l.n} ${l.name}`, l.fails.join("; "), l.tools.join(", ")])}
          />
        </div>
      </Panel>

      <Tip title="Careful">
        A successful ping only proves Layers 1 to 3. The web server can still be down on port 443 (Layer 4) or returning a 500 (Layer 7).
      </Tip>
    </div>
  );
}

/* ───────────────────────── 6 · common mistakes ───────────────────────── */

const MYTHS = [
  { wrong: "OSI is the model the internet runs on.", right: "TCP/IP is what actually runs. OSI is the reference model we use to talk, teach and troubleshoot." },
  { wrong: "A layer only ever talks to the layer directly above and below it.", right: "True inside a host, but a router at Layer 3 reads the IP header without ever unpacking Layers 4 to 7." },
  { wrong: "Layers 4 to 7 are hop by hop.", right: "Layers 1 to 3 are hop by hop (switches and routers handle them). Layers 4 to 7 are end to end: only the two hosts process them." },
  { wrong: "MAC addresses stay the same end to end.", right: "MAC addresses are rewritten at every router. IP addresses stay the same end to end (unless NAT changes them)." },
  { wrong: "The IP address identifies the application.", right: "IP finds the host. The port number finds the application on that host. You need both." },
  { wrong: "HTTPS lives at Layer 7 only.", right: "HTTPS is HTTP (Layer 7) wrapped in TLS (usually mapped to Layer 6). Saying only Layer 7 ignores the encryption." },
  { wrong: "Layer 1 sends packets.", right: "Layer 1 sends bits: electrical signals, light pulses or radio waves. Frames are Layer 2, packets are Layer 3." },
  { wrong: "A switch is a Layer 3 device.", right: "A traditional switch is Layer 2 (MAC-based). A Layer 3 switch can route by IP, but a plain switch does not." },
  { wrong: "Ping succeeds, so the network is fine.", right: "Ping only proves Layers 1 to 3. The web server can still be down on port 443 (Layer 4) or returning a 500 (Layer 7)." },
  { wrong: "TLS lives at exactly one layer.", right: "There is no perfect answer. Layer 6 is the common reply, but TLS also depends on a Layer 5 session and runs on top of TCP at Layer 4. Saying Layer 6, and that TCP/IP lumps it into Application, shows you know the model's limits." },
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
                <div className="n2-fade mt-3 border-t pt-3">
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
  { q: "What is the OSI model and why do we use it?", a: ["OSI (Open Systems Interconnection) is a seven-layer reference model published by ISO in 1984. It splits network communication into layers that each do one job.", "It helps vendors build products that work together, lets engineers troubleshoot one layer at a time, and means a change in one layer does not break the others."] },
  { q: "List the seven layers top to bottom with the data unit at each.", a: ["Application, Presentation and Session work on data. Transport uses segments (TCP) or datagrams (UDP). Network uses packets. Data Link uses frames. Physical uses bits.", "Mnemonic: All People Should Try New Domino's Pizza."] },
  { q: "What is encapsulation?", a: ["As data goes down the stack, each layer wraps what it got from above with its own header (Layer 2 also adds a trailer): data, then segment, then packet, then frame, then bits.", "The receiver does the reverse, called decapsulation. Each layer reads and removes its own header and passes the payload up."] },
  { q: "What is the difference between OSI and TCP/IP?", a: ["OSI is a seven-layer theoretical reference model. TCP/IP is a four-layer practical model built around the protocols the internet uses.", "TCP/IP merges OSI layers 5 to 7 into Application and layers 1 and 2 into Network Access."] },
  { q: "What is the difference between a switch and a router?", a: ["A switch works at Layer 2. It forwards frames inside one network using the MAC address table.", "A router works at Layer 3. It forwards packets between networks using IP addresses and a routing table, and it separates broadcast domains. A Layer 3 switch does both."] },
  { q: "TCP vs UDP: when do you use which?", a: ["TCP is connection-oriented and reliable: handshake, sequence numbers, acknowledgments, retransmission and flow control. Use it when accuracy matters: web, email, file transfer, SSH.", "UDP is connectionless with less overhead and no guarantees. Use it when speed matters more than perfection: DNS queries, VoIP, video streaming, games."] },
  { q: "Explain the TCP three-way handshake.", a: ["1. SYN: the client asks to connect and sends its starting sequence number.", "2. SYN-ACK: the server acknowledges that number and sends its own.", "3. ACK: the client acknowledges the server's number. The connection is established.", "Closing uses FIN and ACK messages, or RST to abort."] },
  { q: "Why do we need both MAC and IP addresses?", a: ["A MAC address (Layer 2) identifies a NIC on the local link and is used for hop-by-hop delivery. It has no structure that helps find a path across networks.", "An IP address (Layer 3) is logical and hierarchical, so routers can find a path across networks. At every hop the MAC addresses are rewritten. The IP addresses stay the same end to end, unless NAT changes them."] },
  { q: "What happens when you type a URL and press Enter?", a: ["Layer 7: the browser checks its cache, then asks DNS for the IP address.", "Layers 3 and 2: the host checks whether the server is local. If not, it uses ARP to find the MAC address of the default gateway.", "Layer 4: a TCP three-way handshake opens a connection to port 443 (80 for plain HTTP).", "Layers 6 and 5: the TLS handshake agrees on keys and the session starts.", "Layer 7: the browser sends an HTTP GET, the server replies with the page, and the browser fetches the remaining resources.", "Every packet is encapsulated down the stack, and each router builds a new frame and lowers the TTL."] },
  { q: "What are the sublayers of the Data Link layer?", a: ["LLC (Logical Link Control, 802.2) faces upward and identifies which Layer 3 protocol is inside the frame.", "MAC (Media Access Control) handles addressing and controlling access to the medium."] },
  { q: "At which layer does ping work?", a: ["Ping sends ICMP echo requests, which is Layer 3.", "A successful ping proves Layers 1 to 3 work between two hosts. It says nothing about ports or applications, so a web server can still be down while ping works."] },
  { q: "What does end to end versus hop by hop mean?", a: ["Layers 4 to 7 are end to end: only the two communicating hosts process them.", "Layers 1 to 3 are hop by hop: every device on the path, such as switches and routers, handles them."] },
  { q: "Where do firewalls fit in the model?", a: ["Basic packet filters look at Layers 3 and 4 (IP addresses, ports, protocols). Stateful firewalls track Layer 4 connections.", "Next-generation firewalls and web application firewalls inspect up to Layer 7: applications, URLs and content."] },
  { q: "Where do SSL/TLS fit?", a: ["There is no perfect answer. TLS encrypts data (Presentation, Layer 6), sets up a secure session (Layer 5), runs on top of TCP (Layer 4) and carries HTTP (Layer 7).", "Saying Layer 6 and mentioning that TCP/IP lumps it into Application shows you understand the model's limits."] },
  { q: "How would you troubleshoot a network problem using the OSI model?", a: ["Choose an approach: bottom-up, top-down or divide and conquer. Then ask which is the first layer that fails.", "Example: link light on (Layer 1), correct VLAN and MAC learned (Layer 2), valid IP, mask and gateway with ping working (Layer 3), port reachable (Layer 4), then application and DNS settings (Layers 5 to 7)."] },
  { q: "The internet runs on TCP/IP. Is OSI still relevant?", a: ["Yes. It is the shared vocabulary of networking: people say it is a Layer 2 problem, or a Layer 7 load balancer, and everyone knows what is meant.", "It also gives a systematic way to troubleshoot."] },
];

function InterviewSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="border-primary/30 bg-primary/5">
        <p className="text-sm font-semibold">Your 30-second answer</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          The OSI model is a seven-layer reference model that describes how data travels across a network. The top three
          layers, Application, Presentation and Session, deal with software and data. Transport handles end-to-end
          delivery using ports, with TCP for reliability and UDP for speed. Network handles logical addressing and routing
          with IP. Data Link handles delivery on the local network using MAC addresses and frames. Physical sends the raw
          bits. On the sender, data is encapsulated as it moves down the layers. On the receiver, it is decapsulated as it
          moves up. TCP/IP is the practical four-layer version that the internet actually uses.
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
                <ul className="n2-fade list-disc space-y-1 border-t px-8 py-3 text-xs leading-5 text-muted-foreground">
                  {x.a.map((l) => <li key={l}>{l}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Tip title="Rule of thumb">Layers 1 to 3 are hop by hop, layers 4 to 7 are end to end. IP stays, MAC changes.</Tip>
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function OsiModelExplainer() {
  const [tab, setTab] = useState<TabId>("layers");

  return (
    <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
      <style>{`
        @keyframes n2-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .n2-fade { animation: n2-fade .5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .n2-fade, .n2-piece { animation: none; opacity: 1; } }
      `}</style>

      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Topic 02: The OSI reference model</CardTitle>
            <CardDescription className="mt-1">
              Seven layers, one job each. Seven short sections, tap through them in any order.
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
          {tab === "layers" && <LayersSection />}
          {tab === "journey" && <JourneySection />}
          {tab === "who" && <WhoSection />}
          {tab === "tcpip" && <TcpipSection />}
          {tab === "trouble" && <TroubleSection />}
          {tab === "myths" && <MythsSection />}
          {tab === "interview" && <InterviewSection />}
        </div>
      </CardContent>
    </Card>
  );
}