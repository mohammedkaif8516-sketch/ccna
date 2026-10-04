// lib/quizzes.ts — TEMPORARY STUB for Step 2, will be replaced in Step 3+


// lib/quizzes.ts
export type QuizQuestion = {
    id: string
    prompt: string
    options: string[]
    answer: number
    explanation: string
}

export type Quiz = {
    id: string
    topicSlug: string
    group?: string
    final?: boolean
    title: string
    questions: QuizQuestion[]
}

export const quizzes: Quiz[] = [

      // ─────────────────────────────────────────────────────────────
  // 01 · INTRODUCTION TO NETWORKING  
  // ─────────────────────────────────────────────────────────────
  {
    id: "introduction-to-networking-final",
    topicSlug: "introduction-to-networking",
    final: true,
    title: "Introduction to Networking  ",
    questions: [
      {
        id: "q1",
        prompt: "What is the simplest definition of a computer network?",
        options: [
          "A group of computers in one room",
          "Devices connected by a medium for the purpose of exchanging information",
          "Any device with an IP address",
          "A system of cables and routers",
        ],
        answer: 1,
        explanation:
          "A network = devices + medium + purpose (exchanging information).",
      },
      {
        id: "q2",
        prompt: "Which network type covers a single office or home?",
        options: ["WAN", "MAN", "LAN", "SAN"],
        answer: 2,
        explanation:
          "LAN = Local Area Network. Small geographic area, private, high speed.",
      },
      {
        id: "q3",
        prompt: "Which of these is a private IP range reserved by RFC 1918?",
        options: ["8.8.8.0/24", "192.168.0.0/16", "1.1.1.0/24", "172.15.0.0/16"],
        answer: 1,
        explanation:
          "Private ranges are 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 02 · THE OSI REFERENCE MODEL  
  // ─────────────────────────────────────────────────────────────
  {
    id: "osi-reference-model-final",
    topicSlug: "osi-reference-model",
    final: true,
    title: "OSI Reference Model  ",
    questions: [
      {
        id: "q1",
        prompt: "How many layers does the OSI model have?",
        options: ["4", "5", "6", "7"],
        answer: 3,
        explanation:
          "OSI is a 7-layer model — Physical, Data-Link, Network, Transport, Session, Presentation, Application.",
      },
      {
        id: "q2",
        prompt: "Which OSI layer handles logical addressing and routing?",
        options: ["Layer 2", "Layer 3", "Layer 4", "Layer 5"],
        answer: 1,
        explanation:
          "Layer 3 (Network) handles IP addressing and routing. The PDU is a packet.",
      },
      {
        id: "q3",
        prompt: "The Transport layer PDU is called a…",
        options: ["Frame", "Packet", "Segment", "Bit"],
        answer: 2,
        explanation:
          "Transport PDU = Segment. Network = Packet. Data-Link = Frame. Physical = Bits.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 03 · ETHERNET & NETWORK CABLING  
  // ─────────────────────────────────────────────────────────────
  {
    id: "ethernet-network-cabling-final",
    topicSlug: "ethernet-network-cabling",
    final: true,
    title: "Ethernet & Network Cabling  ",
    questions: [
      {
        id: "q1",
        prompt: "What is the maximum distance for a twisted-pair Ethernet cable?",
        options: ["10 m", "100 m", "500 m", "1 km"],
        answer: 1,
        explanation:
          "Twisted-pair max distance is 100 metres, with a maximum speed of 1 Gbps.",
      },
      {
        id: "q2",
        prompt: "Which fibre type carries a single ray of light over long distances?",
        options: ["Multi-mode", "Single-mode", "Coaxial", "Twisted pair"],
        answer: 1,
        explanation:
          "Single-mode fibre uses a small core and one ray of light — used for long-haul (KM) links.",
      },
      {
        id: "q3",
        prompt: "Which cable type is used to connect two switches together?",
        options: [
          "Straight-through",
          "Crossover (or straight-through with Auto MDI-X)",
          "Rollover",
          "Coaxial",
        ],
        answer: 1,
        explanation:
          "Same-type devices traditionally used a crossover cable; modern devices with Auto MDI-X can auto-detect and use a straight-through.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 04 · NETWORK DEVICES & TRAFFIC FLOW  
  // ─────────────────────────────────────────────────────────────
  {
    id: "network-devices-traffic-flow-final",
    topicSlug: "network-devices-traffic-flow",
    final: true,
    title: "Network Devices & Traffic Flow  ",
    questions: [
      {
        id: "q1",
        prompt: "Which OSI layer does a switch operate at?",
        options: ["Layer 1", "Layer 2", "Layer 3", "Layer 4"],
        answer: 1,
        explanation:
          "A switch is a Layer 2 device that forwards frames based on MAC addresses.",
      },
      {
        id: "q2",
        prompt: "How many collision domains does a switch have per port?",
        options: ["Zero", "One shared", "One per port", "Two per port"],
        answer: 2,
        explanation:
          "Every switch port has its own collision domain. The broadcast domain is shared across all ports by default.",
      },
      {
        id: "q3",
        prompt: "Which delivery type is one-to-nearest?",
        options: ["Unicast", "Multicast", "Broadcast", "Anycast"],
        answer: 3,
        explanation:
          "Anycast = one-to-nearest. IPv6 uses anycast heavily, and it removes broadcast entirely.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 05 · IP ADDRESSING & SUBNETTING  
  // ─────────────────────────────────────────────────────────────
  {
    id: "ip-addressing-subnetting-final",
    topicSlug: "ip-addressing-subnetting",
    final: true,
    title: "IP Addressing & Subnetting  ",
    questions: [
      {
        id: "q1",
        prompt: "How many bits are in an IPv4 address?",
        options: ["16", "32", "64", "128"],
        answer: 1,
        explanation:
          "IPv4 is 32 bits (four octets of 8 bits). IPv6 is 128 bits.",
      },
      {
        id: "q2",
        prompt: "Which mask corresponds to a /26 prefix?",
        options: [
          "255.255.255.128",
          "255.255.255.192",
          "255.255.255.224",
          "255.255.255.240",
        ],
        answer: 1,
        explanation:
          "/26 = 255.255.255.192, block size 64, 62 usable hosts.",
      },
      {
        id: "q3",
        prompt: "How many usable hosts does a /28 subnet provide?",
        options: ["16", "14", "30", "62"],
        answer: 1,
        explanation:
          "A /28 has 16 addresses total (block size 16), minus network + broadcast = 14 usable hosts.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 06 · TRANSPORT LAYER PROTOCOLS & PORTS  
  // ─────────────────────────────────────────────────────────────
  {
    id: "transport-layer-protocols-ports-final",
    topicSlug: "transport-layer-protocols-ports",
    final: true,
    title: "Transport Layer Protocols & Ports  ",
    questions: [
      {
        id: "q1",
        prompt: "Which protocol is connection-oriented and reliable?",
        options: ["UDP", "TCP", "ICMP", "ARP"],
        answer: 1,
        explanation:
          "TCP is connection-oriented — it establishes a 3-way handshake, guarantees delivery, and provides flow control. UDP is connectionless and unreliable.",
      },
      {
        id: "q2",
        prompt: "Which TCP flag is used to gracefully terminate a connection?",
        options: ["SYN", "ACK", "FIN", "RST"],
        answer: 2,
        explanation:
          "FIN terminates a connection gracefully (via a 4-way handshake). RST forcefully terminates without handshake.",
      },
      {
        id: "q3",
        prompt: "What is the port range for well-known ports?",
        options: ["0 – 1023", "1024 – 49151", "49152 – 65535", "1 – 999"],
        answer: 0,
        explanation:
          "Well-known ports are 0–1023 (HTTP=80, HTTPS=443, Telnet=23, SSH=22). Registered ports are 1024–49151, ephemeral are 49152–65535.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 07 · ROUTER FUNDAMENTALS & CLI  
  // ─────────────────────────────────────────────────────────────
  {
    id: "router-fundamentals-cli-final",
    topicSlug: "router-fundamentals-cli",
    final: true,
    title: "Router Fundamentals & CLI  ",
    questions: [
      {
        id: "q1",
        prompt: "Where is the IOS stored on a Cisco router?",
        options: ["ROM", "RAM", "NVRAM", "Flash"],
        answer: 3,
        explanation:
          "IOS lives in Flash. ROM holds ROMMON, RAM holds running-config, NVRAM holds startup-config.",
      },
      {
        id: "q2",
        prompt: "Which command saves the running-config to NVRAM?",
        options: [
          "copy startup-config running-config",
          "copy running-config startup-config",
          "write erase",
          "save config",
        ],
        answer: 1,
        explanation:
          "copy run start (or just `write`) saves the running-config into NVRAM as startup-config.",
      },
      {
        id: "q3",
        prompt: "What is the port number for SSH?",
        options: ["21", "22", "23", "25"],
        answer: 1,
        explanation:
          "SSH = 22 (encrypted). Telnet = 23 (plain text, unencrypted).",
      },
    ],
  },
    {
        id: "routing-basics",
        topicSlug: "routing",
        group: "Routing Basics",
        title: "Routing Basics Quiz",
        questions: [
            {
                id: "q1",
                prompt: "Which route source has the lowest administrative distance (most trusted)?",
                options: ["RIP", "OSPF", "EIGRP (internal)", "EIGRP (external)"],
                answer: 2,
                explanation: "EIGRP internal is 90. OSPF is 110, RIP is 120, and EIGRP external is 170.",
            },
            {
                id: "q2",
                prompt: "A router learns the same prefix from RIP and OSPF. Which route is installed?",
                options: [
                    "The one with the lowest metric",
                    "The OSPF route, because its AD is lower",
                    "The RIP route, because it was learned first",
                    "Both, load balanced",
                ],
                answer: 1,
                explanation: "Metrics from different protocols are not comparable, so AD decides first. OSPF (110) beats RIP (120).",
            },
            {
                id: "q3",
                prompt: "What is the default administrative distance of a static route?",
                options: ["0", "1", "90", "110"],
                answer: 1,
                explanation: "Connected is 0, static is 1.",
            },
        ],
    },
    {
        id: "static-and-default",
        topicSlug: "routing",
        group: "Static & Default Routing",
        title: "Static & Default Routing Quiz",
        questions: [
            {
                id: "q1",
                prompt: "A floating static route is used for what purpose?",
                options: [
                    "Load balancing between two paths",
                    "Providing a backup path with a higher AD than the primary",
                    "Blocking traffic to a specific subnet",
                    "Summarizing multiple routes",
                ],
                answer: 1,
                explanation: "Floating statics use a higher administrative distance so they stay out of the routing table until the primary path goes down.",
            },
            {
                id: "q2",
                prompt: "What does a Null0 static route do?",
                options: [
                    "Sends matching traffic out the default gateway",
                    "Discards matching traffic silently",
                    "Load-balances the traffic",
                    "Forces traffic through a tunnel",
                ],
                answer: 1,
                explanation: "Null0 is a virtual discard interface — matching traffic is dropped without an ICMP unreachable being sent.",
            },
            {
                id: "q3",
                prompt: "What is the default route in IPv4 written as?",
                options: ["0.0.0.0/0", "255.255.255.255/32", "0.0.0.0/32", "127.0.0.1/8"],
                answer: 0,
                explanation: "0.0.0.0/0 matches every destination that has no more specific route.",
            },
        ],
    },
    {
        id: "dynamic-and-rip",
        topicSlug: "routing",
        group: "Dynamic & RIP",
        title: "Dynamic Routing & RIP Quiz",
        questions: [
            {
                id: "q1",
                prompt: "RIP uses which algorithm to calculate the best path?",
                options: ["Dijkstra", "Bellman-Ford", "DUAL", "Path vector"],
                answer: 1,
                explanation: "RIP is a distance-vector protocol that uses Bellman-Ford, capped at 15 hops.",
            },
            {
                id: "q2",
                prompt: "RIPv2 sends its routing updates to which address?",
                options: ["255.255.255.255", "224.0.0.9", "224.0.0.5", "224.0.0.10"],
                answer: 1,
                explanation: "RIPv2 uses multicast 224.0.0.9. RIPv1 uses broadcast 255.255.255.255.",
            },
            {
                id: "q3",
                prompt: "How many seconds is the default RIP invalid timer?",
                options: ["30", "60", "180", "240"],
                answer: 2,
                explanation: "Update 30s, Invalid 180s, Hold-down 180s, Flush 240s.",
            },
        ],
    },
    {
        id: "eigrp-theory",
        topicSlug: "routing",
        group: "EIGRP Theory",
        title: "EIGRP Theory Quiz",
        questions: [
            {
                id: "q1",
                prompt: "What protocol number does EIGRP use?",
                options: ["6", "17", "88", "89"],
                answer: 2,
                explanation: "EIGRP uses its own transport protocol — IP protocol 88 — not TCP or UDP.",
            },
            {
                id: "q2",
                prompt: "Which EIGRP route is marked with AD 170?",
                options: ["Internal (D)", "External (EX)", "Summarized", "Connected"],
                answer: 1,
                explanation: "External / redistributed EIGRP routes carry AD 170. Internal is 90, summarized is 5.",
            },
            {
                id: "q3",
                prompt: "Which algorithm does EIGRP use?",
                options: ["Bellman-Ford", "Dijkstra", "DUAL", "SPF"],
                answer: 2,
                explanation: "EIGRP uses DUAL (Diffusing Update Algorithm) — it pre-computes a backup path (feasible successor) for every route.",
            },
        ],
    },
    {
        id: "eigrp-setup",
        topicSlug: "routing",
        group: "EIGRP Setup",
        title: "EIGRP Setup Quiz",
        questions: [
            {
                id: "q1",
                prompt: "Two routers must match on which three things before becoming EIGRP neighbours?",
                options: [
                    "AS number, K values, and password",
                    "Hello timer, hold timer, and MTU",
                    "Router ID, hostname, and interface IP",
                    "VLAN, subnet mask, and gateway",
                ],
                answer: 0,
                explanation: "AS number, K values, and password must all match. Timers do NOT need to match to become neighbours.",
            },
            {
                id: "q2",
                prompt: "Which command lets EIGRP summarize a network at any router?",
                options: [
                    "auto-summary",
                    "ip summary-address eigrp",
                    "ip route summary",
                    "distribute-list",
                ],
                answer: 1,
                explanation: "EIGRP supports 'any-point summarization' via ip summary-address eigrp <as> <network> <mask>, on any interface of any router.",
            },
        ],
    },
    {
  id: "eigrp-tuning",
  topicSlug: "routing",
  group: "EIGRP Tuning",
  title: "EIGRP Tuning Quiz",
  questions: [
    {
      id: "q1",
      prompt: "By default, across how many equal-cost paths does EIGRP load-balance?",
      options: ["1", "4", "8", "16"],
      answer: 1,
      explanation:
        "The default is 4 paths. The maximum is 16, set with maximum-paths.",
    },
    {
      id: "q2",
      prompt: "Which setting enables unequal-cost load balancing in EIGRP?",
      options: [
        "maximum-paths 1",
        "variance",
        "passive-interface",
        "auto-summary",
      ],
      answer: 1,
      explanation:
        "Raising variance above 1 lets EIGRP use feasible successors as well as successors.",
    },
    {
      id: "q3",
      prompt: "What does the command `maximum-paths 1` do?",
      options: [
        "Disables load balancing",
        "Disables EIGRP on the router",
        "Enables unequal-cost load balancing",
        "Limits the router to one neighbour",
      ],
      answer: 0,
      explanation:
        "With a maximum of one path, only the single best route is installed — no load balancing.",
    },
    {
      id: "q4",
      prompt: "What is the default EIGRP hello timer interval?",
      options: ["1 second", "5 seconds", "10 seconds", "30 seconds"],
      answer: 1,
      explanation:
        "EIGRP's Hello timer defaults to 5 seconds, with a 15-second hold timer (1:3 ratio).",
    },
    {
      id: "q5",
      prompt: "How can path selection be manipulated in EIGRP?",
      options: [
        "By changing the interface's delay value",
        "By disabling Spanning Tree",
        "By renaming the interface",
        "By clearing the ARP cache",
      ],
      answer: 0,
      explanation:
        "Increasing an interface's delay raises the metric on that path, which can force a different path to be chosen.",
    },
  ],
},
    {
        id: "ospf-concepts",
        topicSlug: "routing",
        group: "OSPF Theory",
        title: "OSPF Concepts Quiz",
        questions: [
            {
                id: "q1",
                prompt: "OSPF uses which metric?",
                options: ["Hop count", "Bandwidth + delay", "Cost", "Reliability"],
                answer: 2,
                explanation: "OSPF's metric is called cost — calculated as reference bandwidth ÷ interface bandwidth, with a minimum of 1.",
            },
            {
                id: "q2",
                prompt: "What is the default reference bandwidth on Cisco routers?",
                options: ["10 Mbps", "100 Mbps", "1000 Mbps", "10000 Mbps"],
                answer: 1,
                explanation: "The default is 100 Mbps. This is why Fast Ethernet and Gigabit both end up with cost 1 unless you raise it.",
            },
            {
                id: "q3",
                prompt: "Which OSPF router sits on the boundary between two areas?",
                options: ["ASBR", "ABR", "DR", "BDR"],
                answer: 1,
                explanation: "ABR = Area Border Router. ASBR connects to a different autonomous system.",
            },
        ],
    },
    {
        id: "ospf-operation",
        topicSlug: "routing",
        group: "OSPF Operation",
        title: "OSPF Operation Quiz",
        questions: [
            {
                id: "q1",
                prompt: "DR/BDR election happens at which OSPF adjacency state?",
                options: ["Init", "Two-Way", "ExStart", "Full"],
                answer: 1,
                explanation: "Election happens at Two-Way — it's the minimum state required before DR/BDR roles can be assigned.",
            },
            {
                id: "q2",
                prompt: "Which multicast address do OSPF routers use to send updates to the DR and BDR?",
                options: ["224.0.0.5", "224.0.0.6", "224.0.0.9", "224.0.0.10"],
                answer: 1,
                explanation: "224.0.0.5 is AllSPFRouters. 224.0.0.6 is AllDRouters — used by DRothers to reach the DR and BDR.",
            },
            {
                id: "q3",
                prompt: "Which of these is the correct OSPF adjacency state order?",
                options: [
                    "Down → Init → Two-Way → ExStart → Exchange → Loading → Full",
                    "Down → Two-Way → Init → Exchange → ExStart → Loading → Full",
                    "Init → Down → Two-Way → ExStart → Loading → Exchange → Full",
                    "Down → Init → ExStart → Two-Way → Exchange → Loading → Full",
                ],
                answer: 0,
                explanation: "Down → Init → Two-Way → ExStart → Exchange → Loading → Full. Two-Way comes before ExStart.",
            },
        ],
    },
    {
  id: "routing-final",
  topicSlug: "routing",
  final: true,
  title: "Routing  ",
  questions: [
    // Mix of questions from Routing Basics, Static, RIP, EIGRP, OSPF
    // Aim for 10–15 questions here since it's the topic-wide test
  ],
}
]



export function quizById(id: string): Quiz | undefined {
    return quizzes.find((q) => q.id === id)
}
export function quizFor(
    topicSlug: string,
    group?: string | null,
): Quiz | undefined {
    return quizzes.find(
        (q) => q.topicSlug === topicSlug && (q.group ?? null) === (group ?? null),
    );
}
