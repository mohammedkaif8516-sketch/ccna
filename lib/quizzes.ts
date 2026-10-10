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

      {
  id: "introduction-to-networking-final",
  topicSlug: "introduction-to-networking",
  final: true,
  title: "Introduction to Networking Quiz",
  questions: [
    {
      id: "q1",
      prompt: "Which of the following best describes the primary purpose of a computer network?",
      options: [
        "To isolate devices for security",
        "To exchange information and share services",
        "To increase the processing power of individual computers",
        "To replace physical hard drives"
      ],
      answer: 1,
      explanation: "A computer network is defined as a collection of devices connected to exchange information and services."
    },
    {
      id: "q2",
      prompt: "Which list correctly identifies common devices found on a computer network?",
      options: [
        "Computers, servers, printers, and authentication devices",
        "Only computers and servers",
        "Printers, monitors, and keyboards",
        "CCTV cameras and standalone power supplies"
      ],
      answer: 0,
      explanation: "Network devices include computers, mobile phones, printers, servers, authentication devices, and CCTV cameras."
    },
    {
      id: "q3",
      prompt: "If a company installs a group of computers in a room but does not connect them with any wired or wireless medium, do they form a network?",
      options: [
        "Yes, because they are in the same geographical area.",
        "Yes, because they are capable of processing data.",
        "No, because a network requires a medium to connect devices.",
        "No, because they do not have a server."
      ],
      answer: 2,
      explanation: "A network must include a wired or wireless medium connecting the devices to allow information exchange."
    },
    {
      id: "q4",
      prompt: "Which of the following is NOT typically listed as a service or information carried over a network?",
      options: [
        "Streaming audio and video",
        "Storing and accessing databases",
        "Instant messaging (IM)",
        "Local CPU clock cycle generation"
      ],
      answer: 3,
      explanation: "Clock cycle generation is a local hardware function, whereas documents, emails, IM, and databases are shared over a network."
    },
    {
      id: "q5",
      prompt: "How are protocols defined in the context of networking?",
      options: [
        "Hardware devices that connect networks together",
        "The physical cables used to transmit data",
        "Centralized storage devices for databases",
        "Sets of rules that enable communication between devices"
      ],
      answer: 3,
      explanation: "Protocols are the specific sets of rules that allow network devices to successfully communicate."
    },
    {
      id: "q6",
      prompt: "Which of the following is a correct example of a network protocol?",
      options: [
        "OSI",
        "TCP/IP",
        "HTTPS",
        "LAN"
      ],
      answer: 2,
      explanation: "HTTPS is a protocol, whereas OSI and TCP/IP are reference models, and LAN is a network type."
    },
    {
      id: "q7",
      prompt: "What is the primary function of a reference model like OSI or TCP/IP?",
      options: [
        "To act as a blueprint allowing products from different vendors to interoperate",
        "To physically connect different LANs over long distances",
        "To encrypt private traffic across the public internet",
        "To serve as a central powerhouse for data processing"
      ],
      answer: 0,
      explanation: "Reference models serve as detailed standards so devices from different manufacturers can work together in a network."
    },
    {
      id: "q8",
      prompt: "An organization buys switches from Cisco and routers from Juniper. What allows these different devices to successfully exchange data?",
      options: [
        "They both use the exact same hardware components.",
        "They require a Mainframe to translate the signals.",
        "They are connected to a Storage Area Network (SAN).",
        "They adhere to common reference models and standard protocols."
      ],
      answer: 3,
      explanation: "Reference models like OSI and TCP/IP provide the blueprint that ensures devices from different vendors can interoperate."
    },
    {
      id: "q9",
      prompt: "Which two reference models are most widely recognized in networking?",
      options: [
        "HTTP and FTP",
        "LAN and WAN",
        "OSI and TCP/IP",
        "Client and Server"
      ],
      answer: 2,
      explanation: "The OSI reference model and the TCP/IP model are the core blueprints for network communication."
    },
    {
      id: "q10",
      prompt: "Which of the following best describes a Local Area Network (LAN)?",
      options: [
        "A collection of LANs spanning a large geographical area",
        "A public network that spans across a city",
        "A single network or collection of networks in a small geographical area",
        "A virtual tunnel through the internet"
      ],
      answer: 2,
      explanation: "A LAN is typically a private, high-speed network confined to a small geographical area like a home, office, or campus."
    },
    {
      id: "q11",
      prompt: "Who typically manages a Local Area Network (LAN)?",
      options: [
        "An Internet Service Provider (ISP)",
        "A public telecommunications company",
        "A person, administrator, or group of engineers within an organization",
        "The global internet registry"
      ],
      answer: 2,
      explanation: "LANs are private networks managed internally by a person or a team of engineers belonging to that specific organization."
    },
    {
      id: "q12",
      prompt: "What is the simplest way to describe a Wide Area Network (WAN)?",
      options: [
        "A personal area network inside a single room",
        "A network dedicated exclusively to high-speed storage",
        "A centralized mainframe environment",
        "A collection of LANs spread over a large geographical area, such as the internet"
      ],
      answer: 3,
      explanation: "A WAN covers a large geographical area and connects multiple LANs together; the internet is the largest WAN."
    },
    {
      id: "q13",
      prompt: "Which type of network is specifically designed to cover a city and is often a public network?",
      options: [
        "SAN (Storage Area Network)",
        "PAN (Personal Area Network)",
        "MAN (Metropolitan Area Network)",
        "CAN (Campus Area Network)"
      ],
      answer: 2,
      explanation: "A MAN is a public network that spans across a city, with examples including ACT Fibernet or Hathway."
    },
    {
      id: "q14",
      prompt: "A Data Center Network that features high-capacity devices, high speed, and low-loss connectivity for storing and accessing information is known as a:",
      options: [
        "SAN",
        "VPN",
        "PAN",
        "MAN"
      ],
      answer: 0,
      explanation: "A SAN (Storage Area Network) is built for a single purpose: high-speed, low-loss storage and data access."
    },
    {
      id: "q15",
      prompt: "What is the key difference between a CAN and a PAN?",
      options: [
        "A CAN spans multiple buildings within a campus, while a PAN is a personal network typically used at home.",
        "A CAN is used for storage, while a PAN is used for wide area routing.",
        "A CAN is entirely wireless, while a PAN requires fiber optic cables.",
        "A CAN connects different cities, while a PAN connects different countries."
      ],
      answer: 0,
      explanation: "CAN stands for Campus Area Network (connecting multiple buildings), whereas PAN is a Personal Area Network for an individual user's devices."
    },
    {
      id: "q16",
      prompt: "A company wants to connect its branch office in London directly and securely to its headquarters in New York over the internet. Which technology should they use?",
      options: [
        "Remote access VPN",
        "Storage Area Network (SAN)",
        "Campus Area Network (CAN)",
        "Site-to-site VPN"
      ],
      answer: 3,
      explanation: "A site-to-site VPN is designed to securely connect an entire branch office network to the main headquarters over the internet."
    },
    {
      id: "q17",
      prompt: "An employee traveling for work needs to securely connect their laptop to the company's internal network from a coffee shop. What should they use?",
      options: [
        "Site-to-site VPN",
        "Remote access VPN / SSL VPN",
        "Mainframe architecture",
        "SAN"
      ],
      answer: 1,
      explanation: "A remote access (or SSL) VPN connects individual client machines securely to the office network."
    },
    {
      id: "q18",
      prompt: "Aside from corporate connectivity, what is another common use for a VPN?",
      options: [
        "Masking the original IP address to change apparent location and provide anonymity",
        "Converting a LAN into a SAN to increase storage speed",
        "Replacing physical routers with virtual mainframes",
        "Upgrading a peer-to-peer network into a client/server architecture"
      ],
      answer: 0,
      explanation: "VPNs can mask the user's original IP with another IP, granting anonymity and changing the apparent geographical location."
    },
    {
      id: "q19",
      prompt: "How is a \"host\" defined in a networking context?",
      options: [
        "Any device that supplies power to the network switches",
        "Only the central server in a client/server architecture",
        "The medium through which wireless signals travel",
        "Any client device with an assigned IP address that generates and receives traffic"
      ],
      answer: 3,
      explanation: "A host is any device on the network (like a PC, printer, or server) with an IP address that sends or receives traffic."
    },
    {
      id: "q20",
      prompt: "In a network, what is the primary role of a \"client\"?",
      options: [
        "To provide information and services to other devices",
        "To request information or services from a server",
        "To route traffic between different LANs",
        "To act as a dumb terminal with no IP address"
      ],
      answer: 1,
      explanation: "A client is a device that requests information or services from the network."
    },
    {
      id: "q21",
      prompt: "Which host device role involves both requesting and providing information and services simultaneously?",
      options: [
        "Mainframe",
        "Client",
        "Server",
        "Peer"
      ],
      answer: 3,
      explanation: "A peer can act as both a client (requesting services) and a server (providing services) at the same time."
    },
    {
      id: "q22",
      prompt: "Can a printer or an IoT device be considered a network host?",
      options: [
        "No, because they do not have display screens.",
        "No, only computers and servers can be hosts.",
        "Yes, as long as they have an assigned IP address and process network traffic.",
        "Yes, but only if they are part of a Mainframe architecture."
      ],
      answer: 2,
      explanation: "Any device with an assigned IP address that generates and receives network traffic is classified as a host."
    },
    {
      id: "q23",
      prompt: "Which architecture relies on a centralized device for storage and management, where other devices connect to request resources?",
      options: [
        "Peer-to-Peer architecture",
        "Mainframe / Terminal architecture",
        "Client/Server architecture",
        "CAN architecture"
      ],
      answer: 2,
      explanation: "Client/Server architecture centralizes data management and services onto a server, which clients access."
    },
    {
      id: "q24",
      prompt: "What is a significant disadvantage of the Client/Server architecture?",
      options: [
        "It requires every device to act as a server.",
        "It is very difficult to manage and secure compared to P2P.",
        "Terminals have no processing power at all.",
        "It is a single point of failure; if the server goes down, data may be inaccessible."
      ],
      answer: 3,
      explanation: "Because it is centralized, the primary disadvantage is that a server failure can make all centralized data inaccessible."
    },
    {
      id: "q25",
      prompt: "How is a Mainframe / Terminal architecture different from a typical Client/Server setup?",
      options: [
        "Mainframes use decentralized storage, while servers are centralized.",
        "The terminal is a \"dumb device\" purely for input and output, with no local processing power.",
        "Terminals handle all the computing, while the Mainframe only provides display output.",
        "There is no difference; the terms are completely interchangeable."
      ],
      answer: 1,
      explanation: "In a mainframe setup, all processing happens centrally. The terminal only provides a keyboard (input) and screen (output)."
    },
    {
      id: "q26",
      prompt: "A small startup has 5 employees. Instead of buying a dedicated server, they share files directly from their individual computer hard drives. What architecture are they using?",
      options: [
        "Mainframe / Terminal",
        "Client/Server",
        "Peer-to-Peer (P2P)",
        "Storage Area Network (SAN)"
      ],
      answer: 2,
      explanation: "In P2P architecture, every host device acts as both a client and a server, sharing its own local resources."
    },
    {
      id: "q27",
      prompt: "Which network architecture is known for being centralized, cost-effective, and offering easily managed security?",
      options: [
        "Client/Server",
        "Peer-to-Peer",
        "MAN",
        "Terminal-only"
      ],
      answer: 0,
      explanation: "Client/Server offers centralized security and data management, making it easier to administer than a distributed P2P setup."
    },
    {
      id: "q28",
      prompt: "If an enterprise wants to mitigate the single point of failure inherent in a Client/Server architecture, what is the recommended solution?",
      options: [
        "Convert all servers into dumb terminals.",
        "Have a backup server spread across different locations.",
        "Switch entirely to a Peer-to-Peer network model.",
        "Remove all IP addresses from the network hosts."
      ],
      answer: 1,
      explanation: "Having a backup server spread across locations ensures data remains accessible even if the primary server fails."
    },
    {
      id: "q29",
      prompt: "When designing a network, why might an engineer choose a Site-to-Site VPN over a dedicated physical WAN link between two offices?",
      options: [
        "VPNs utilize a virtual tunnel through the public internet, which is often more cost-effective than private leased lines.",
        "VPNs operate completely without reference models.",
        "Site-to-Site VPNs do not require routers.",
        "A VPN physically runs a new cable between the two offices."
      ],
      answer: 0,
      explanation: "VPNs forward private traffic securely through the public domain (internet), avoiding the high costs of installing dedicated physical WAN links."
    },
    {
      id: "q30",
      prompt: "In a corporate network, which protocol is typically used in conjunction with a Remote Access SSL VPN to securely encrypt the web-based traffic?",
      options: [
        "TFTP",
        "HTTPS",
        "SMTP",
        "FTP"
      ],
      answer: 1,
      explanation: "SSL VPNs rely on TLS/SSL encryption, which is the underlying security mechanism for HTTPS, to secure remote user traffic."
    },
    {
      id: "q31",
      prompt: "While a SAN is optimized for storage, what common specialized protocol is frequently used in Enterprise SANs to encapsulate storage commands over high-speed networks?",
      options: [
        "Fibre Channel (FC) or iSCSI",
        "Hypertext Transfer Protocol (HTTP)",
        "Simple Mail Transfer Protocol (SMTP)",
        "Trivial File Transfer Protocol (TFTP)"
      ],
      answer: 0,
      explanation: "Fibre Channel and iSCSI are specialized block-storage protocols used heavily in Storage Area Networks (SANs) for low-latency data access."
    },
    {
      id: "q32",
      prompt: "An administrator notices that a host is unable to reach the internet, but can reach other devices on the same local switch. In terms of network types, which of the following is functioning correctly?",
      options: [
        "The WAN connection",
        "The Site-to-Site VPN",
        "The Storage Area Network",
        "The LAN connection"
      ],
      answer: 3,
      explanation: "Because the host can reach other devices on the same switch, the local area network (LAN) is functioning, but the wide area network (WAN) routing is likely failing."
    }
  ]
},

  {
  "id": "osi-reference-model-final",
  "topicSlug": "osi-reference-model",
  "final": true,
  "title": "The OSI Reference Model Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "Which OSI layer acts as an interface between the user and the network?",
      "options": [
        "Application",
        "Presentation",
        "Session",
        "Transport"
      ],
      "answer": 0,
      "explanation": "The Application layer (Layer 7) is where the user interacts with network-based applications like web browsers and email clients."
    },
    {
      "id": "q2",
      "prompt": "What is the primary responsibility of the Presentation layer?",
      "options": [
        "Establishing connection sessions",
        "Translating, encrypting, and compressing data",
        "Physical addressing and framing",
        "Logical routing and IP addressing"
      ],
      "answer": 1,
      "explanation": "The Presentation layer translates machine data back into user data formats, and also manages encryption and compression."
    },
    {
      "id": "q3",
      "prompt": "At which layer of the OSI model do protocols like HTTP, HTTPS, FTP, and SMTP operate?",
      "options": [
        "Transport",
        "Network",
        "Application",
        "Presentation"
      ],
      "answer": 2,
      "explanation": "These protocols operate at the Application layer and control the user applications we interact with."
    },
    {
      "id": "q4",
      "prompt": "If a file has an extension like .mp4 or .jpg, which layer is responsible for removing these syntaxes on the sender side and reattaching them on the receiver side?",
      "options": [
        "Session",
        "Application",
        "Transport",
        "Presentation"
      ],
      "answer": 3,
      "explanation": "The Presentation layer deals with syntaxes and extensions, converting user data into machine data and vice versa."
    },
    {
      "id": "q5",
      "prompt": "Which OSI layer establishes, manages, and terminates connection sessions between devices?",
      "options": [
        "Session",
        "Transport",
        "Network",
        "Data-Link"
      ],
      "answer": 0,
      "explanation": "The Session layer (Layer 5) establishes, maintains, terminates, and recovers communication sessions between a client and a server."
    },
    {
      "id": "q6",
      "prompt": "A walkie-talkie is an example of which type of communication?",
      "options": [
        "Simplex",
        "Half-Duplex",
        "Full-Duplex",
        "Multi-Duplex"
      ],
      "answer": 1,
      "explanation": "Half-Duplex is two-way communication, but not simultaneous, just like a walkie-talkie."
    },
    {
      "id": "q7",
      "prompt": "Which type of communication allows for simultaneous two-way traffic, like a mobile phone conversation?",
      "options": [
        "Simplex",
        "Half-Duplex",
        "Complex",
        "Full-Duplex"
      ],
      "answer": 3,
      "explanation": "Full-Duplex communication allows data to flow in both directions at the exact same time."
    },
    {
      "id": "q8",
      "prompt": "What is the name of the Protocol Data Unit (PDU) at the Transport layer?",
      "options": [
        "Segment",
        "Packet",
        "Frame",
        "Bits"
      ],
      "answer": 0,
      "explanation": "The Transport layer's PDU is called a Segment."
    },
    {
      "id": "q9",
      "prompt": "What is the default Maximum Transmission Unit (MTU) configured on most standard network devices?",
      "options": [
        "1024 bytes",
        "1500 bytes",
        "9216 bytes",
        "4096 bytes"
      ],
      "answer": 1,
      "explanation": "By default, the MTU is configured to 1500 bytes."
    },
    {
      "id": "q10",
      "prompt": "Which Transport layer protocol uses Acknowledgements (ACK) to confirm data was received without issues?",
      "options": [
        "UDP",
        "IP",
        "ICMP",
        "TCP"
      ],
      "answer": 3,
      "explanation": "TCP sends a receipt (ACK) to confirm successful delivery, ensuring reliable communication. UDP does not do this."
    },
    {
      "id": "q11",
      "prompt": "How does the Transport layer ensure data integrity when using TCP?",
      "options": [
        "By encrypting the payload",
        "By generating a hash value and attaching it to the header",
        "By negotiating the MTU size",
        "By assigning sequence numbers to the frames"
      ],
      "answer": 1,
      "explanation": "The sender generates a hash value based on the data. If it matches the receiver's hash, the data is intact."
    },
    {
      "id": "q12",
      "prompt": "Flow control is used to ensure smoother communication. Which protocol implements flow control?",
      "options": [
        "TCP only",
        "UDP only",
        "Both TCP and UDP",
        "Neither TCP nor UDP"
      ],
      "answer": 0,
      "explanation": "Flow control is heavily utilized in TCP to manage traffic rates; there is no flow control mechanism in UDP."
    },
    {
      "id": "q13",
      "prompt": "In a sliding windowing mechanism, what happens if a packet goes missing during transmission?",
      "options": [
        "The sender increases the window size immediately.",
        "The connection is fully terminated and re-established.",
        "The sender reverts to the previous window size and retransmits the missing packet.",
        "The receiver ignores the missing packet and waits for the next one."
      ],
      "answer": 2,
      "explanation": "The sender continuously negotiates a larger window until a packet drops, at which point it reverts to the last successful size and retransmits."
    },
    {
      "id": "q14",
      "prompt": "What is the payload size of a jumbo frame?",
      "options": [
        "1500 bytes",
        "2048 bytes",
        "4096 bytes",
        "9216 bytes"
      ],
      "answer": 3,
      "explanation": "A jumbo frame extends the MSS payload capacity up to 9216 bytes."
    },
    {
      "id": "q15",
      "prompt": "According to standard network memory units, how many bytes are in 1 Kilobyte?",
      "options": [
        "1000 Bytes",
        "1024 Bytes",
        "1048 Bytes",
        "2048 Bytes"
      ],
      "answer": 1,
      "explanation": "1 Kilobyte is equivalent to 1024 Bytes in standard computing calculation."
    },
    {
      "id": "q16",
      "prompt": "Which process at the Transport layer assigns an ordered number to every piece of segmented data?",
      "options": [
        "Sequencing",
        "Segmentation",
        "Windowing",
        "Hashing"
      ],
      "answer": 0,
      "explanation": "Sequencing assigns an ordered number to segments so the receiving device can correctly reassemble the fragmented data."
    },
    {
      "id": "q17",
      "prompt": "During the TCP integrity check, what happens if a single bit changes in transit?",
      "options": [
        "The receiver fixes the broken bit.",
        "The packet is delivered anyway.",
        "The hash values will fail to match.",
        "The sender increases the MTU size."
      ],
      "answer": 2,
      "explanation": "Even a 1-bit change produces a completely different hash value, causing the integrity check to fail."
    },
    {
      "id": "q18",
      "prompt": "What is the Protocol Data Unit (PDU) called at the Network layer?",
      "options": [
        "Segment",
        "Packet",
        "Frame",
        "Datagram"
      ],
      "answer": 1,
      "explanation": "At Layer 3 (Network layer), the data unit is referred to as a Packet."
    },
    {
      "id": "q19",
      "prompt": "Which hardware device natively operates at Layer 3 of the OSI model?",
      "options": [
        "Router",
        "Hub",
        "Switch",
        "Transceiver"
      ],
      "answer": 0,
      "explanation": "A router operates at the Network layer to forward packets based on logical IP addressing."
    },
    {
      "id": "q20",
      "prompt": "Once a router calculates the best path between networks, where does it store this information?",
      "options": [
        "In the CAM table",
        "In the routing table",
        "In the MAC address table",
        "In the TCP header"
      ],
      "answer": 1,
      "explanation": "The best paths are stored in the routing table, which the router checks to forward traffic."
    },
    {
      "id": "q21",
      "prompt": "Before the widespread use of IP, which of the following were used as Network layer protocols?",
      "options": [
        "HTTP and FTP",
        "IPX and AppleTalk",
        "TCP and UDP",
        "MAC and OUI"
      ],
      "answer": 1,
      "explanation": "IPX (Internetwork Packet Exchange) and AppleTalk are older legacy protocols that previously served the Network layer's function."
    },
    {
      "id": "q22",
      "prompt": "How long is a standard MAC address?",
      "options": [
        "24 bits",
        "32 bits",
        "64 bits",
        "48 bits"
      ],
      "answer": 3,
      "explanation": "A MAC address is a 48-bit address, typically written in hexadecimal format."
    },
    {
      "id": "q23",
      "prompt": "What does the first 24 bits of a MAC address represent?",
      "options": [
        "The Organisationally Unique Identifier (OUI)",
        "The Host ID",
        "The network portion of the address",
        "The IP address mapping"
      ],
      "answer": 0,
      "explanation": "The first 24 bits make up the OUI, which represents the device's manufacturer."
    },
    {
      "id": "q24",
      "prompt": "What is the default aging time for a MAC address stored in a switch's CAM table?",
      "options": [
        "300 seconds",
        "600 seconds",
        "120 seconds",
        "60 seconds"
      ],
      "answer": 0,
      "explanation": "The default MAC address aging time in switches is 300 seconds (5 minutes)."
    },
    {
      "id": "q25",
      "prompt": "Which device relies on a CAM table to make forwarding decisions based on Layer 2 headers?",
      "options": [
        "Router",
        "Hub",
        "Switch",
        "CCTV Camera"
      ],
      "answer": 2,
      "explanation": "A switch is a Layer 2 device that maintains a CAM (MAC address) table to forward frames directly to the correct switchport."
    },
    {
      "id": "q26",
      "prompt": "At which layer is data transferred through the physical medium in raw binary format?",
      "options": [
        "Data-Link",
        "Physical",
        "Network",
        "Transport"
      ],
      "answer": 1,
      "explanation": "The Physical layer (Layer 1) sends and receives data as raw binary bits over physical mediums like cables."
    },
    {
      "id": "q27",
      "prompt": "Which of the following devices is considered 'dumb' hardware operating at the Physical layer?",
      "options": [
        "Router",
        "Layer 3 Switch",
        "Firewall",
        "Hub"
      ],
      "answer": 3,
      "explanation": "Hubs, cables, transceivers, and consoles have no intelligence capability and operate purely at Layer 1."
    },
    {
      "id": "q28",
      "prompt": "When data is sent from a source to a destination, how does it move through the OSI layers on the sender's side?",
      "options": [
        "It travels from Layer 1 up to Layer 7.",
        "It travels from Layer 7 down to Layer 1.",
        "It bypasses the middle layers and goes straight to Layer 1.",
        "It stays at Layer 4 and is segmented."
      ],
      "answer": 1,
      "explanation": "Data travels down the layers (Application to Physical) on the sender's side as headers are encapsulated onto the payload."
    },
    {
      "id": "q29",
      "prompt": "If a malicious user performs a MAC flooding attack and fills the switch's CAM table completely, how will the switch behave?",
      "options": [
        "It shuts down all switchports to protect the network.",
        "It behaves like a hub and floods incoming frames out of all ports.",
        "It begins dropping all new incoming frames.",
        "It asks the router to block the malicious MAC address."
      ],
      "answer": 1,
      "explanation": "When a CAM table is full, the switch cannot map new MAC addresses to specific ports, so it fails open and floods unknown unicast frames out of all ports."
    },
    {
      "id": "q30",
      "prompt": "Why is UDP widely used for real-time applications like live voice and video streaming instead of TCP?",
      "options": [
        "UDP provides superior error correction for video frames.",
        "UDP includes built-in flow control to prevent stuttering.",
        "UDP avoids the overhead of ACKs and retransmissions, favoring lower latency.",
        "UDP automatically compresses video data at the Transport layer."
      ],
      "answer": 2,
      "explanation": "For live streaming, occasional packet loss is preferable to the network delay (latency) that would be caused by TCP's constant retransmissions and acknowledgments."
    },
    {
      "id": "q31",
      "prompt": "What happens if a sender transmits an IP packet larger than the MTU of a router along the transmission path?",
      "options": [
        "The router automatically increases its MTU to accommodate the packet.",
        "The router drops the packet and ends the session immediately.",
        "The packet must be fragmented by the router unless the 'Don't Fragment' (DF) flag is set.",
        "The router converts the packet into a jumbo frame."
      ],
      "answer": 2,
      "explanation": "If a packet exceeds a link's MTU, it is fragmented into smaller packets. If the DF flag is set, the router drops it and replies with an error."
    }
  ]
},
  {
  "id": "ethernet-network-cabling-final",
  "topicSlug": "ethernet-network-cabling",
  "final": true,
  "title": "Ethernet & Network Cabling Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "Which company originally invented Ethernet for the LAN environment?",
      "options": [
        "Microsoft",
        "IBM",
        "Cisco",
        "Xerox"
      ],
      "answer": 3,
      "explanation": "Ethernet was originally invented by Xerox and operated at 2.94 Mbps before being developed further by a consortium."
    },
    {
      "id": "q2",
      "prompt": "At what speed does the Fast Ethernet standard operate?",
      "options": [
        "10 Mbps",
        "100 Mbps",
        "1000 Mbps",
        "10 Gbps"
      ],
      "answer": 1,
      "explanation": "Fast Ethernet operates at 100 Mbps, which was a significant upgrade from the original 10 Mbps Ethernet standard."
    },
    {
      "id": "q3",
      "prompt": "Which of the following describes a primary advantage of Ethernet technologies?",
      "options": [
        "It relies on proprietary hardware from a single vendor.",
        "It uses complex token-passing mechanisms for security.",
        "It is open-source, scalable, and inexpensive.",
        "It operates exclusively over fiber optic cables."
      ],
      "answer": 2,
      "explanation": "Ethernet is open-source, simple to install, inexpensive, scalable, and allows for easy interoperability between multiple vendors."
    },
    {
      "id": "q4",
      "prompt": "How many total individual wires are contained within a standard twisted pair network cable?",
      "options": [
        "4 wires",
        "6 wires",
        "8 wires",
        "12 wires"
      ],
      "answer": 2,
      "explanation": "A standard twisted pair cable contains 8 wires grouped into 4 pairs, each with a specific color code."
    },
    {
      "id": "q5",
      "prompt": "What structural difference distinguishes Category 5e cabling from Category 5?",
      "options": [
        "Cat 5e uses a thicker glass core instead of copper.",
        "Cat 5e pairs are also twisted around each other.",
        "Cat 5e features three additional layers of metallic mesh.",
        "Cat 5e reduces the twists per inch to zero."
      ],
      "answer": 1,
      "explanation": "While both use twisting to reduce interference, Cat 5e pairs are additionally twisted around each other to further improve signal integrity."
    },
    {
      "id": "q6",
      "prompt": "You are designing a network layout for a new office floor. What is the maximum distance you can run a single twisted pair cable before signal degradation becomes an issue?",
      "options": [
        "50 metres",
        "100 metres",
        "300 metres",
        "500 metres"
      ],
      "answer": 1,
      "explanation": "Standard twisted pair cabling has a strict maximum distance limitation of 100 metres."
    },
    {
      "id": "q7",
      "prompt": "In a shielded twisted pair (STP) cable, where are the three layers of insulation located?",
      "options": [
        "Above the copper wire, above each pair, and above all pairs.",
        "Above the copper wire, inside the RJ-45 jack, and outside the sheath.",
        "Between the plastic separator, outside the sheath, and inside the jack.",
        "Only surrounding the specific transmit (Tx) and receive (Rx) wires."
      ],
      "answer": 0,
      "explanation": "STP features three protective layers: one immediately over the thin copper wire, one around each individual pair, and one outer layer wrapping all the pairs."
    },
    {
      "id": "q8",
      "prompt": "Which type of cable consists of a thick copper wire protected by synthetic rubber, a metallic mesh, and plastic insulation?",
      "options": [
        "Category 6 Twisted Pair",
        "Single-mode Fibre",
        "Multi-mode Fibre",
        "Coaxial Cable"
      ],
      "answer": 3,
      "explanation": "Coaxial cable uses a single thick copper conductor protected by three dense layers of insulation. It is rarely used in networking today but remains common for television services."
    },
    {
      "id": "q9",
      "prompt": "Why is multi-mode fibre typically chosen over single-mode fibre for connecting devices within a LAN environment?",
      "options": [
        "It can transmit signals over vast distances measured in kilometers.",
        "It transmits a single, highly focused ray of light.",
        "It transmits multiple rays of light over shorter distances.",
        "It is completely immune to physical breaks and bending."
      ],
      "answer": 2,
      "explanation": "Multi-mode fibre has a larger glass core that accommodates multiple rays of light, making it ideal for the shorter distances typical of LAN and WAN environments."
    },
    {
      "id": "q10",
      "prompt": "What is the maximum speed rating of a standard QSFP transceiver module?",
      "options": [
        "1 Gbps",
        "10 Gbps",
        "40 Gbps",
        "100 Gbps"
      ],
      "answer": 3,
      "explanation": "A QSFP (Quad Small Form-factor Pluggable) transceiver is designed to handle speeds up to 100 Gbps."
    },
    {
      "id": "q11",
      "prompt": "A network engineer needs to securely connect two office buildings that are 40 kilometers apart. Which type of cabling is the only viable option?",
      "options": [
        "Category 6 Twisted Pair",
        "Coaxial Cable",
        "Single-mode Fibre",
        "Multi-mode Fibre"
      ],
      "answer": 2,
      "explanation": "Single-mode fibre uses a small glass core to transmit a single ray of light over very long distances, measured in kilometers (e.g., 40 KM, 100 KM)."
    },
    {
      "id": "q12",
      "prompt": "What term describes the process of permanently attaching an RJ-45 connector to the end of a twisted pair cable?",
      "options": [
        "Splicing",
        "Crimping",
        "Terminating",
        "Punching"
      ],
      "answer": 1,
      "explanation": "Crimping is the physical process of attaching an RJ-45 (Registered Jack) connector onto the 8 wires of a twisted pair cable."
    },
    {
      "id": "q13",
      "prompt": "Although a standard Ethernet twisted pair cable contains 8 wires, how many of those wires are actually utilized for data transmission (Tx and Rx)?",
      "options": [
        "2 wires",
        "4 wires",
        "6 wires",
        "8 wires"
      ],
      "answer": 1,
      "explanation": "The Ethernet standard only uses 4 of the 8 wires for actual data transmission—specifically the transmit (Tx) and receive (Rx) pins."
    },
    {
      "id": "q14",
      "prompt": "According to the EIA/TIA-568B standard, what color is assigned to Pin 1?",
      "options": [
        "Orange",
        "Orange White",
        "Green White",
        "Blue"
      ],
      "answer": 1,
      "explanation": "In the 568B standard, the sequence begins with Orange White on Pin 1."
    },
    {
      "id": "q15",
      "prompt": "You are inspecting a freshly crimped RJ-45 connector and notice Pin 6 is a solid Green wire. Based on standard pinouts, which color code standard was used?",
      "options": [
        "EIA/TIA-568B",
        "Auto MDI-X Standard",
        "Single-mode Standard",
        "Crossover Standard Side 2"
      ],
      "answer": 0,
      "explanation": "In the EIA/TIA-568B standard, Pin 6 is solid Green. (In a crossover cable's second side, Pin 6 is Orange)."
    },
    {
      "id": "q16",
      "prompt": "You are tasked with connecting a core Router directly to a hardware Firewall. According to traditional cabling rules, what type of cable should be used?",
      "options": [
        "Crossover Cable",
        "Console Cable",
        "Rollover Cable",
        "Straight-Through Cable"
      ],
      "answer": 3,
      "explanation": "A straight-through cable is used to connect different types of devices, such as Router to Firewall, Switch to Router, or Switch to PC."
    },
    {
      "id": "q17",
      "prompt": "Historically, why was a crossover cable explicitly required when connecting a Switch directly to another Switch?",
      "options": [
        "Because they operate at completely different OSI layers.",
        "Because they are the same type of device.",
        "Because switches can only support half-duplex communication.",
        "Because a switch cannot negotiate Power over Ethernet on straight-through cables."
      ],
      "answer": 1,
      "explanation": "Crossover cables cross the Tx and Rx pins to allow communication between devices of the same type (like Switch to Switch or Router to Router)."
    },
    {
      "id": "q18",
      "prompt": "How does the Auto MDI-X feature simplify modern network cabling?",
      "options": [
        "It automatically boosts the PoE wattage if the cable length exceeds 100 metres.",
        "It negotiates the link speed dynamically between 10Mbps and 1000Mbps.",
        "It automatically encrypts unsecure data crossing the physical link.",
        "It allows devices to identify neighbors and adjust Tx/Rx pins automatically."
      ],
      "answer": 3,
      "explanation": "Auto MDI-X allows newer devices to automatically adapt their transmit and receive pins, meaning a straight-through cable can be used even between the same type of devices."
    },
    {
      "id": "q19",
      "prompt": "In the context of Power over Ethernet, what does the acronym 'PSE' stand for?",
      "options": [
        "Power Sourcing Equipment",
        "Powered Switch Ethernet",
        "Primary Source Engine",
        "Phantom Supply Energy"
      ],
      "answer": 0,
      "explanation": "PSE stands for Power Sourcing Equipment, which refers to the device that provides the electrical power, such as a PoE switch."
    },
    {
      "id": "q20",
      "prompt": "What happens if you accidentally plug a standard, non-PoE laptop into a fully active PoE switch port?",
      "options": [
        "The laptop's network interface card will be damaged by the power surge.",
        "The switch will send power blindly, but the laptop will ignore it.",
        "The switch detects the device does not support PoE and sends no power.",
        "The switch port will immediately enter an error-disabled state."
      ],
      "answer": 2,
      "explanation": "A PoE switch safely sends a small test signal first. If the end device does not ask for power, the switch only sends data, keeping ordinary devices safe."
    },
    {
      "id": "q21",
      "prompt": "Which IEEE standard governs 'PoE+' and delivers up to 30 Watts of power per port?",
      "options": [
        "802.3af",
        "802.3at",
        "802.3bt (Type 3)",
        "802.3bt (Type 4)"
      ],
      "answer": 1,
      "explanation": "802.3at is the standard for PoE+, providing a maximum of 30 W per port."
    },
    {
      "id": "q22",
      "prompt": "You are deploying an advanced outdoor PTZ IP camera equipped with internal heaters that requires 85 Watts of power. Which PoE standard must your switch support?",
      "options": [
        "802.3af",
        "802.3at",
        "802.3bt (Type 3)",
        "802.3bt (Type 4)"
      ],
      "answer": 3,
      "explanation": "To deliver 85 Watts, the switch must support 802.3bt (Type 4), also known as PoE++, which provides up to 90 W per port."
    },
    {
      "id": "q23",
      "prompt": "What is the primary operational function of a fibre optic transceiver?",
      "options": [
        "To convert AC power into DC power for fiber links.",
        "To convert digital signals into light signals and vice versa.",
        "To split a single incoming light ray into multiple rays.",
        "To detect PoE capability over a fiber optic connection."
      ],
      "answer": 1,
      "explanation": "A transceiver (Transmitter + Receiver) converts a networking device's digital electrical signals into light pulses for the fibre cable, and translates incoming light back into digital signals."
    },
    {
      "id": "q24",
      "prompt": "Which of the following devices is LEAST likely to be powered by Power over Ethernet (PoE) as a Powered Device (PD)?",
      "options": [
        "Wireless access points (Wi-Fi APs)",
        "Core routing switches",
        "IP cameras (CCTV)",
        "IP phones (VoIP phones)"
      ],
      "answer": 1,
      "explanation": "Core routing switches require far too much electricity to be powered via PoE. PoE is designed for edge devices like access points, phones, and cameras."
    },
    {
      "id": "q25",
      "prompt": "According to the provided notes, what are the two main physical limitations of standard twisted pair cables?",
      "options": [
        "A maximum distance of 100 metres and a maximum speed of 1 Gbps.",
        "A maximum distance of 50 metres and a maximum speed of 10 Gbps.",
        "High installation costs and complex maintenance requirements.",
        "Susceptibility to water damage and low wattage capacity."
      ],
      "answer": 0,
      "explanation": "The primary limitations of standard twisted pair cabling are a 100-metre maximum distance and a 1 Gbps maximum speed limit."
    },
    {
      "id": "q26",
      "prompt": "What does the acronym 'SFP' stand for in the context of fibre optic modules?",
      "options": [
        "Single Fibre Protocol",
        "Small Form-factor Pluggable",
        "Standard Frame Processor",
        "Synchronous Fast Port"
      ],
      "answer": 1,
      "explanation": "SFP stands for Small Form-factor Pluggable, which is a modular transceiver operating typically at 1 Gbps."
    },
    {
      "id": "q27",
      "prompt": "Which organization standardized Ethernet as 'Ethernet Version 2' for public use?",
      "options": [
        "Xerox",
        "IETF",
        "IEEE",
        "ISO"
      ],
      "answer": 2,
      "explanation": "The IEEE (Institute of Electrical and Electronic Engineers) officially standardized Ethernet for the public."
    },
    {
      "id": "q28",
      "prompt": "How are the different categories of twisted pair cables (such as Cat 3, Cat 5, Cat 6) primarily defined?",
      "options": [
        "By the thickness of their outer plastic insulation.",
        "By the number of twists on a wire pair, per inch.",
        "By the type of conductive metal used in the core.",
        "By the specific color code standard they follow."
      ],
      "answer": 1,
      "explanation": "Twisted pair categories are defined technically by the frequency of twists per inch, which dictates their resistance to interference."
    },
    {
      "id": "q29",
      "prompt": "A network technician is crimping a crossover cable. Side 1 is wired with Orange White on Pin 1. According to the crossover pinout, what color should Pin 1 be on Side 2?",
      "options": [
        "Orange White",
        "Green White",
        "Blue",
        "Brown"
      ],
      "answer": 1,
      "explanation": "In a crossover cable, Pin 1 on the second side must be Green White, crossing over from the orange pair on Side 1."
    },
    {
      "id": "q30",
      "prompt": "Before a PoE switch provides full operational power to a connected device, how does it ensure the device actually supports PoE?",
      "options": [
        "It sends a massive 60W burst and monitors the cable temperature.",
        "It verifies the connected device's MAC address OUI against a database.",
        "It sends a small test signal to detect a specific electrical signature.",
        "It relies entirely on the administrator to manually enable power on the port."
      ],
      "answer": 2,
      "explanation": "A PoE switch acts safely by sending a low-voltage test signal first to confirm the device is a valid PD (Powered Device) before sending full power."
    },
    {
      "id": "q31",
      "prompt": "If a fibre optic cable is bent too sharply around a corner in a server rack, causing the light to leak out of the core and dropping the link, what is the technical term for this loss?",
      "options": [
        "Macrobending",
        "Impedance mismatch",
        "Electromagnetic interference",
        "Near-end crosstalk"
      ],
      "answer": 0,
      "explanation": "Macrobending occurs when a fibre optic cable is bent past its minimum bend radius, allowing the light to refract out of the core and causing signal loss."
    },
    {
      "id": "q32",
      "prompt": "You are deploying a copper network in a factory floor heavily populated with industrial machinery that generates strong magnetic fields. Which type of copper cable should be installed to prevent data corruption?",
      "options": [
        "UTP Category 5e",
        "UTP Category 6",
        "STP (Shielded Twisted Pair)",
        "Unshielded Coaxial"
      ],
      "answer": 2,
      "explanation": "STP (Shielded Twisted Pair) uses metallic foil shielding to protect the internal data wires from outside Electromagnetic Interference (EMI) common in industrial environments."
    },
    {
      "id": "q33",
      "prompt": "When a PoE switch successfully detects a valid powered device (PD), it initiates a phase called 'classification'. What is the primary purpose of this classification phase?",
      "options": [
        "To assign a temporary IP address to the PD for management.",
        "To negotiate the data speed (10/100/1000 Mbps) of the physical link.",
        "To determine the exact wattage/power class the PD requires before delivering full voltage.",
        "To verify the manufacturer's security certificate of the PD."
      ],
      "answer": 2,
      "explanation": "The classification phase allows the switch to figure out exactly how much power (Class 0 through Class 8) the device requires so the switch can budget its total power appropriately."
    }
  ]
},
  {
  "id": "network-devices-traffic-flow-final",
  "topicSlug": "network-devices-traffic-flow",
  "final": true,
  "title": "Network Devices & Traffic Flow Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "Which OSI layer does a network hub belong to?",
      "options": [
        "Layer 1 (Physical)",
        "Layer 2 (Data-Link)",
        "Layer 3 (Network)",
        "Layer 4 (Transport)"
      ],
      "answer": 0,
      "explanation": "A hub is a 'dumb' device that operates at the Physical layer (Layer 1) and simply repeats electrical signals."
    },
    {
      "id": "q2",
      "prompt": "Why does a hub broadcast all incoming traffic to every other port?",
      "options": [
        "Because it is designed to securely encrypt the traffic.",
        "Because it uses Spanning Tree Protocol by default.",
        "Because it lacks a MAC address table to make intelligent forwarding decisions.",
        "Because it operates in full-duplex mode."
      ],
      "answer": 2,
      "explanation": "Hubs have no memory or table to track connected devices, so they blindly flood (broadcast) incoming traffic out of all other ports."
    },
    {
      "id": "q3",
      "prompt": "In a network connected entirely by a single hub, what happens when two devices transmit data simultaneously?",
      "options": [
        "The hub buffers one transmission until the other is finished.",
        "The frames collide because a hub operates in a single collision domain.",
        "The hub routes the frames based on their IP addresses.",
        "The frames are encrypted and delivered safely."
      ],
      "answer": 1,
      "explanation": "All ports on a hub belong to a single collision domain, meaning simultaneous transmissions will collide and corrupt the data."
    },
    {
      "id": "q4",
      "prompt": "What does CSMA/CD stand for in Ethernet networking?",
      "options": [
        "Carrier Sense Multiple Access / Collision Detection",
        "Carrier Signal Management Access / Collision Domain",
        "Central Switch Memory Allocation / Collision Detection",
        "Carrier Sense Multiple Access / Collision Avoidance"
      ],
      "answer": 0,
      "explanation": "CSMA/CD stands for Carrier Sense Multiple Access / Collision Detection, an algorithm used to handle collisions on shared mediums."
    },
    {
      "id": "q5",
      "prompt": "In a topology consisting of multiple hubs connected in a closed loop, what is the expected outcome?",
      "options": [
        "The hubs will dynamically route traffic over the shortest path.",
        "The hubs will negotiate a master-slave relationship.",
        "An infinite traffic loop will form, consuming all available bandwidth.",
        "The hubs will use STP to block one of the redundant links."
      ],
      "answer": 2,
      "explanation": "Because hubs do not run Spanning Tree Protocol (STP) to prevent loops, any closed physical connection will create an infinite broadcast loop."
    },
    {
      "id": "q6",
      "prompt": "At which OSI layer does a standard network switch operate?",
      "options": [
        "Layer 1 (Physical)",
        "Layer 2 (Data-Link)",
        "Layer 3 (Network)",
        "Layer 4 (Transport)"
      ],
      "answer": 1,
      "explanation": "A standard switch operates at the Data-Link layer (Layer 2) to forward frames based on MAC addresses."
    },
    {
      "id": "q7",
      "prompt": "Which of the following is stored in a switch's CAM table?",
      "options": [
        "IP address and Routing Protocol",
        "MAC address and Switch port",
        "TCP sequence numbers",
        "BGP Autonomous System Numbers"
      ],
      "answer": 1,
      "explanation": "The CAM (Content Addressable Memory) table, or MAC table, maps learned MAC addresses to their corresponding switch ports."
    },
    {
      "id": "q8",
      "prompt": "When a switch receives a frame with an unknown destination MAC address, what action does it take?",
      "options": [
        "It drops the frame entirely.",
        "It sends an ARP request back to the sender.",
        "It broadcasts the frame out of all ports except the incoming port.",
        "It forwards the frame to the default gateway."
      ],
      "answer": 2,
      "explanation": "If the destination MAC is not in the CAM table, the switch performs 'unknown unicast flooding' by broadcasting it out of all other ports."
    },
    {
      "id": "q9",
      "prompt": "How does a switch dynamically learn a device's MAC address?",
      "options": [
        "By observing the source MAC address of an incoming frame.",
        "By querying a DNS server.",
        "By observing the destination MAC address of an incoming frame.",
        "By requiring the user to manually configure it."
      ],
      "answer": 0,
      "explanation": "A switch learns by looking at the *source* MAC address of every frame entering a port and adding that MAC to its CAM table."
    },
    {
      "id": "q10",
      "prompt": "What is the primary difference between a non-manageable switch and a manageable switch?",
      "options": [
        "Non-manageable switches operate at Layer 3.",
        "Manageable switches lack a CAM table.",
        "Non-manageable switches cannot be configured and have no console port.",
        "Manageable switches only support half-duplex communication."
      ],
      "answer": 2,
      "explanation": "Non-manageable switches provide basic plug-and-play forwarding, while manageable switches have a console port and can be configured for advanced features."
    },
    {
      "id": "q11",
      "prompt": "What capability defines a Multi-Layer Switch (MLS) compared to a standard Layer 2 switch?",
      "options": [
        "An MLS uses CSMA/CA instead of CSMA/CD.",
        "An MLS cannot process VLANs.",
        "An MLS provides both switching (L2) and routing (L3) functionality.",
        "An MLS lacks an ASIC chip."
      ],
      "answer": 2,
      "explanation": "An L3 switch, or Multi-Layer Switch, can forward frames using a MAC table and also route packets using a routing table."
    },
    {
      "id": "q12",
      "prompt": "By default, what is the status of the routing capability on a new Cisco Layer 3 switch?",
      "options": [
        "Enabled and running OSPF.",
        "Enabled only for IPv6 traffic.",
        "Disabled by default.",
        "Enabled but restricted to static routes."
      ],
      "answer": 2,
      "explanation": "Routing is disabled by default on an L3 switch and must be manually enabled (typically using the `ip routing` command)."
    },
    {
      "id": "q13",
      "prompt": "In modern switches, what hardware component is responsible for high-speed data traffic forwarding?",
      "options": [
        "The CPU",
        "The ASIC (Application Specific Integrated Circuit)",
        "The ROMMON chip",
        "The Flash memory"
      ],
      "answer": 1,
      "explanation": "An ASIC is a specialized hardware circuit designed specifically to process and forward network traffic at wire speeds."
    },
    {
      "id": "q14",
      "prompt": "How are collision domains defined on a standard Layer 2 switch?",
      "options": [
        "All ports share a single collision domain.",
        "Every switch port has its own separate collision domain.",
        "Collision domains do not exist on switches.",
        "Collision domains are defined by the VLAN configuration."
      ],
      "answer": 1,
      "explanation": "Unlike a hub, every port on a switch creates its own isolated collision domain, enabling full-duplex communication."
    },
    {
      "id": "q15",
      "prompt": "How are broadcast domains defined on a standard Layer 2 switch (assuming no VLANs are configured)?",
      "options": [
        "Every port has its own broadcast domain.",
        "Broadcast domains are only created by routers.",
        "All ports belong to a single, shared broadcast domain.",
        "Broadcast domains are determined by the ASIC."
      ],
      "answer": 2,
      "explanation": "By default, all ports on a switch share the same broadcast domain; a broadcast sent in one port will flood out all other ports."
    },
    {
      "id": "q16",
      "prompt": "What is the purpose of the Spanning Tree Protocol (STP) on a switch?",
      "options": [
        "To route packets to the internet.",
        "To dynamically assign IP addresses to hosts.",
        "To prevent Layer 2 traffic looping by disabling redundant paths.",
        "To compress data frames to save bandwidth."
      ],
      "answer": 2,
      "explanation": "STP prevents infinite broadcast storms by calculating a loop-free topology and temporarily blocking redundant links."
    },
    {
      "id": "q17",
      "prompt": "Which OSI layer does a router belong to?",
      "options": [
        "Layer 2 (Data-Link)",
        "Layer 3 (Network)",
        "Layer 4 (Transport)",
        "Layer 7 (Application)"
      ],
      "answer": 1,
      "explanation": "A router is a Layer 3 device responsible for forwarding packets between different networks."
    },
    {
      "id": "q18",
      "prompt": "When a router receives a packet, what information does it primarily use to make a forwarding decision?",
      "options": [
        "The destination MAC address and the CAM table.",
        "The destination IP address and the routing table.",
        "The source MAC address and the ARP cache.",
        "The TCP sequence number and the session table."
      ],
      "answer": 1,
      "explanation": "A router inspects the Layer 3 header (destination IP address) and compares it against its routing table to find the best path."
    },
    {
      "id": "q19",
      "prompt": "Which statement correctly describes collision and broadcast domains on a router?",
      "options": [
        "All router ports share one broadcast domain.",
        "All router ports share one collision domain.",
        "Every router port has its own broadcast domain and its own collision domain.",
        "Routers do not have broadcast or collision domains."
      ],
      "answer": 2,
      "explanation": "Each interface on a router connects to a separate network, meaning each port establishes its own collision domain and its own broadcast domain."
    },
    {
      "id": "q20",
      "prompt": "Which type of communication involves sending traffic from one device directly to a specific group of devices?",
      "options": [
        "Unicast",
        "Multicast",
        "Broadcast",
        "Anycast"
      ],
      "answer": 1,
      "explanation": "Multicast is a one-to-group communication method where only devices subscribed to the group receive the traffic."
    },
    {
      "id": "q21",
      "prompt": "Which type of communication involves sending traffic from one device to all devices on the local network segment?",
      "options": [
        "Unicast",
        "Multicast",
        "Broadcast",
        "Anycast"
      ],
      "answer": 2,
      "explanation": "Broadcast is one-to-all communication; the message is sent to the broadcast address and processed by every device in the domain."
    },
    {
      "id": "q22",
      "prompt": "What major change regarding communication types was introduced in IPv6?",
      "options": [
        "Unicast was replaced by Anycast.",
        "Broadcasting was completely removed and replaced heavily by multicasting.",
        "Multicasting was deprecated.",
        "Anycast was removed for security reasons."
      ],
      "answer": 1,
      "explanation": "IPv6 does not use broadcasts; it relies on multicast to perform functions that broadcasting used to handle in IPv4."
    },
    {
      "id": "q23",
      "prompt": "Which communication type routes traffic to the single 'nearest' or 'best' destination among a group of servers sharing the same IP address?",
      "options": [
        "Unicast",
        "Multicast",
        "Broadcast",
        "Anycast"
      ],
      "answer": 3,
      "explanation": "Anycast is a one-to-nearest communication method, often used by DNS networks, where routing protocols determine which node is geographically or topologically closest."
    },
    {
      "id": "q24",
      "prompt": "A switch's interface buffer memory is primarily used for what function?",
      "options": [
        "Storing the entire iOS operating system.",
        "Running the Spanning Tree algorithm.",
        "Holding frames temporarily to perform error checking on headers before forwarding.",
        "Storing the router's routing table."
      ],
      "answer": 2,
      "explanation": "Switch ports use buffer memory to briefly hold frames, calculate their checksums, and drop corrupted frames rather than forwarding them."
    },
    {
      "id": "q25",
      "prompt": "What type of device utilizes CSMA/CA to prevent data collisions?",
      "options": [
        "Layer 2 Ethernet Switches",
        "Ethernet Hubs",
        "Wireless Access Points and Wi-Fi Clients",
        "Core Network Routers"
      ],
      "answer": 2,
      "explanation": "CSMA/CA (Collision Avoidance) is the wireless equivalent of CSMA/CD, used extensively in Wi-Fi networks where devices cannot simultaneously transmit and listen to detect collisions."
    },
    {
      "id": "q26",
      "prompt": "If a network has 1 Router with 3 interfaces in use, and each router interface connects to a Switch, how many broadcast domains exist?",
      "options": [
        "1",
        "2",
        "3",
        "4"
      ],
      "answer": 2,
      "explanation": "Every active router interface establishes its own broadcast domain. Therefore, 3 router interfaces equal 3 broadcast domains."
    },
    {
      "id": "q27",
      "prompt": "You issue a command on a switch to view the CAM table and see 'DYNAMIC' listed next to a MAC address. What does this mean?",
      "options": [
        "The switch learned the MAC address by observing incoming traffic on a port.",
        "The network administrator typed the MAC address into the configuration.",
        "The MAC address is actively changing due to a spoofing attack.",
        "The MAC address belongs to the switch's own internal CPU."
      ],
      "answer": 0,
      "explanation": "'DYNAMIC' indicates the switch automatically learned the MAC address by reading the source MAC of a frame entering that port."
    },
    {
      "id": "q28",
      "prompt": "A PC sends an ARP Request. An ARP Request is a broadcast frame. If this frame hits a switch, how will the switch process it?",
      "options": [
        "It forwards the frame only to the router.",
        "It floods the frame out of all active ports except the port it received it on.",
        "It drops the frame to prevent a broadcast storm.",
        "It sends an ARP Reply back on behalf of the destination."
      ],
      "answer": 1,
      "explanation": "A switch must flood broadcast frames (destination MAC FF:FF:FF:FF:FF:FF) out of all ports within the same broadcast domain/VLAN, except the incoming port."
    },
    {
      "id": "q29",
      "prompt": "In an older network, you replace an 8-port hub with an 8-port unmanaged switch. Assuming 8 PCs are connected, how does the number of collision domains change?",
      "options": [
        "It changes from 8 collision domains to 1 collision domain.",
        "It remains at 1 collision domain.",
        "It remains at 8 collision domains.",
        "It changes from 1 collision domain to 8 collision domains."
      ],
      "answer": 3,
      "explanation": "A hub operates as a single collision domain regardless of port count. A switch provides a dedicated collision domain per port, so an 8-port switch provides 8 collision domains."
    },
    {
      "id": "q30",
      "prompt": "If an attacker continuously sends frames with fake source MAC addresses to a switch faster than they age out, what type of attack is occurring?",
      "options": [
        "ARP Spoofing",
        "MAC Flooding (CAM Table Overflow)",
        "Spanning Tree Hijacking",
        "Anycast Routing Loop"
      ],
      "answer": 1,
      "explanation": "This is a MAC flooding attack. By filling the CAM table with fake addresses, legitimate entries are pushed out, forcing the switch to flood all incoming unicast traffic like a hub."
    }
  ]
},
  {
  "id": "ip-addressing-subnetting-final",
  "topicSlug": "ip-addressing-subnetting",
  "final": true,
  "title": "IP Addressing & Subnetting Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "How many total bits make up an IPv4 address?",
      "options": [
        "16 bits",
        "32 bits",
        "64 bits",
        "128 bits"
      ],
      "answer": 1,
      "explanation": "An IPv4 address is a 32-bit address, which allows for approximately 4 billion total addresses globally."
    },
    {
      "id": "q2",
      "prompt": "Which of the following best describes the structural format of an IPv6 address?",
      "options": [
        "32-bit address written in decimal octets.",
        "64-bit address written in binary strings.",
        "128-bit address written in hexadecimal format.",
        "128-bit address written in dotted-decimal format."
      ],
      "answer": 2,
      "explanation": "IPv6 addresses are 128 bits long and are written in hexadecimal, separated by colons into 8 fields."
    },
    {
      "id": "q3",
      "prompt": "Every IP address is divided into two logical sections. What are they?",
      "options": [
        "The MAC side and the IP side",
        "The Public side and the Private side",
        "The Routing side and the Switching side",
        "The Network side and the Host side"
      ],
      "answer": 3,
      "explanation": "An IP address consists of a network portion (identifying the specific LAN/WAN) and a host portion (identifying the specific device)."
    },
    {
      "id": "q4",
      "prompt": "An IPv6 address is divided into 8 fields. How many bits are in each of these fields (often called a 'nibble' in hexadecimal context)?",
      "options": [
        "4 bits",
        "8 bits",
        "16 bits",
        "32 bits"
      ],
      "answer": 2,
      "explanation": "Each of the 8 fields in an IPv6 address contains 16 bits (represented by 4 hexadecimal digits)."
    },
    {
      "id": "q5",
      "prompt": "When converting between number systems, one hexadecimal digit maps exactly to how many binary bits?",
      "options": [
        "2 bits",
        "4 bits",
        "8 bits",
        "16 bits"
      ],
      "answer": 1,
      "explanation": "A single hexadecimal digit directly corresponds to exactly 4 binary bits, also known as a nibble."
    },
    {
      "id": "q6",
      "prompt": "How many hexadecimal digits are required to represent a single byte (8 bits) of data?",
      "options": [
        "One",
        "Two",
        "Four",
        "Eight"
      ],
      "answer": 1,
      "explanation": "Because one hex digit equals 4 bits, two hex digits combine to represent 8 bits (one byte)."
    },
    {
      "id": "q7",
      "prompt": "What are the specific place values used to convert a 4-bit binary nibble into a single hexadecimal digit?",
      "options": [
        "1-2-3-4",
        "2-4-6-8",
        "8-4-2-1",
        "16-8-4-2"
      ],
      "answer": 2,
      "explanation": "The place values for a 4-bit nibble from left to right are 8, 4, 2, and 1."
    },
    {
      "id": "q8",
      "prompt": "What is the default subnet mask for a Class A IP address?",
      "options": [
        "255.0.0.0 (/8)",
        "255.255.0.0 (/16)",
        "255.255.255.0 (/24)",
        "255.255.255.255 (/32)"
      ],
      "answer": 0,
      "explanation": "Class A addresses have a default structure of N|H|H|H, which corresponds to the subnet mask 255.0.0.0 or /8."
    },
    {
      "id": "q9",
      "prompt": "Which numerical range in the first octet indicates a Class B IP address?",
      "options": [
        "1 – 126",
        "128 – 191",
        "192 – 223",
        "224 – 239"
      ],
      "answer": 1,
      "explanation": "The Class B range spans from 128 to 191 in the first octet."
    },
    {
      "id": "q10",
      "prompt": "What is the primary operational purpose of Class D IP addresses (224.0.0.0 – 239.255.255.255)?",
      "options": [
        "They are reserved for local loopback testing.",
        "They are used exclusively for private LANs.",
        "They are reserved for multicasting purposes.",
        "They are reserved for scientific research."
      ],
      "answer": 2,
      "explanation": "Class D is not used for standard host addressing; it is reserved entirely for multicast groups."
    },
    {
      "id": "q11",
      "prompt": "How many usable host IP addresses are available in a standard Class C network (/24)?",
      "options": [
        "126",
        "254",
        "256",
        "65534"
      ],
      "answer": 1,
      "explanation": "A /24 network has 8 host bits. 2^8 = 256 total addresses. Subtracting the network and broadcast addresses leaves 254 usable host IPs."
    },
    {
      "id": "q12",
      "prompt": "Which IP class features a default network/host boundary structure of N | N | H | H?",
      "options": [
        "Class A",
        "Class B",
        "Class C",
        "Class D"
      ],
      "answer": 1,
      "explanation": "Class B uses the first two octets for the network and the last two octets for hosts, giving it a default /16 mask."
    },
    {
      "id": "q13",
      "prompt": "Why do Class E IP addresses lack a network address, broadcast address, and standard subnet mask?",
      "options": [
        "Because they are entirely reserved for scientific and research purposes.",
        "Because they are used exclusively for APIPA (Automatic Private IP Addressing).",
        "Because they are legacy addresses replaced by IPv6.",
        "Because they are strictly used for physical MAC address mappings."
      ],
      "answer": 0,
      "explanation": "Class E (240-255) is an experimental block reserved for research, so standard subnetting rules do not apply to it."
    },
    {
      "id": "q14",
      "prompt": "Which of the following is the reserved private network block under Class A addressing?",
      "options": [
        "10.0.0.0/8",
        "127.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16"
      ],
      "answer": 0,
      "explanation": "10.0.0.0/8 is the globally recognized private IP address range for Class A networks."
    },
    {
      "id": "q15",
      "prompt": "What is the primary reason private IP networks (like 192.168.x.x) were created?",
      "options": [
        "To provide high-speed military communication links.",
        "To allow private users to communicate securely over the public internet without routers.",
        "To be used for private communication in a local environment (LAN) without consuming public IP space.",
        "To replace standard MAC addressing on internal switches."
      ],
      "answer": 2,
      "explanation": "Private IPs allow organizations to build large internal networks without exhausting the limited pool of globally routable public IPv4 addresses."
    },
    {
      "id": "q16",
      "prompt": "What is the specific purpose of the 127.0.0.0/8 address block?",
      "options": [
        "It is used for multicast video streaming.",
        "It is the loopback address used by a device to test its own network stack.",
        "It is the default gateway address assigned by ISPs.",
        "It is reserved for automatic IP assignment when DHCP fails."
      ],
      "answer": 1,
      "explanation": "The 127.0.0.0/8 range (commonly 127.0.0.1) is the loopback address, which allows a device to ping itself to ensure TCP/IP is functioning."
    },
    {
      "id": "q17",
      "prompt": "Which organization sits at the very top of the global IP address hierarchy and coordinates initial block allocations?",
      "options": [
        "IEEE",
        "IANA",
        "RIR",
        "ISP"
      ],
      "answer": 1,
      "explanation": "IANA (Internet Assigned Numbers Authority) coordinates global IP address allocation and delegates large blocks down to Regional Internet Registries (RIRs)."
    },
    {
      "id": "q18",
      "prompt": "In the IP address distribution flow, what entity directly receives large address blocks from IANA to distribute to local ISPs?",
      "options": [
        "The end customer",
        "The United Nations",
        "Regional Internet Registries (RIRs)",
        "Cisco Systems"
      ],
      "answer": 2,
      "explanation": "RIRs (like ARIN, RIPE, APNIC) receive large allocations from IANA and distribute them to ISPs and large organizations in their specific geographical regions."
    },
    {
      "id": "q19",
      "prompt": "What is the defining characteristic of FLSM (Fixed Length Subnet Mask)?",
      "options": [
        "It assigns a different subnet mask to every router interface.",
        "It subnets a network into variable block sizes based on host requirements.",
        "It subnets a network into equal-sized blocks.",
        "It dynamically changes the subnet mask based on network traffic."
      ],
      "answer": 2,
      "explanation": "FLSM divides a larger network into multiple smaller subnets that are all exactly the same size."
    },
    {
      "id": "q20",
      "prompt": "Why is VLSM (Variable Length Subnet Mask) preferred over FLSM in network design?",
      "options": [
        "It is the only subnetting method supported by IPv6.",
        "It avoids IP address waste by tailoring subnet block sizes to actual host requirements.",
        "It automatically negotiates the subnet mask with connected switches.",
        "It prevents network loops without requiring Spanning Tree Protocol."
      ],
      "answer": 1,
      "explanation": "VLSM allows engineers to create small subnets (like /30 for point-to-point) and large subnets (like /24 for user floors) out of the same major network, saving IP space."
    },
    {
      "id": "q21",
      "prompt": "How many total IP addresses are contained within a /28 subnet block?",
      "options": [
        "8",
        "16",
        "32",
        "64"
      ],
      "answer": 1,
      "explanation": "A /28 mask leaves 4 bits for hosts (32 - 28 = 4). 2^4 equals 16 total addresses (14 usable)."
    },
    {
      "id": "q22",
      "prompt": "If you need a subnet block that provides exactly 64 total addresses, which CIDR prefix should you use?",
      "options": [
        "/25",
        "/26",
        "/27",
        "/28"
      ],
      "answer": 1,
      "explanation": "A /26 prefix leaves 6 bits for the host portion (32 - 26 = 6). 2^6 equals 64 total addresses per block."
    },
    {
      "id": "q23",
      "prompt": "What is the dotted-decimal representation of a /25 subnet mask?",
      "options": [
        "255.255.255.128",
        "255.255.255.192",
        "255.255.255.224",
        "255.255.255.240"
      ],
      "answer": 0,
      "explanation": "A /25 mask is 25 bits of ones. The last octet has one bit turned on (value 128), making the mask 255.255.255.128."
    },
    {
      "id": "q24",
      "prompt": "In subnetting calculations, how is the 'Network Address' of a subnet determined mathematically?",
      "options": [
        "By setting all host bits to 1.",
        "By setting all host bits to 0.",
        "By adding the mask value to the broadcast address.",
        "By dividing the block size by 2."
      ],
      "answer": 1,
      "explanation": "The network address is always the very first address in a block, which occurs when all the binary bits in the host portion are 0."
    },
    {
      "id": "q25",
      "prompt": "If you subnet 192.168.10.0/24 into two equal /25 networks, what is the block size of each subnet?",
      "options": [
        "64",
        "128",
        "192",
        "256"
      ],
      "answer": 1,
      "explanation": "A /25 leaves 7 bits for the host (2^7 = 128). Therefore, the network is split into two blocks of 128."
    },
    {
      "id": "q26",
      "prompt": "A network requires distinct subnets for four departments of the following sizes: 35 PCs, 40 PCs, 50 PCs, and 45 PCs. If you are using FLSM on a /24 network, which prefix will perfectly accommodate all four departments in equal blocks?",
      "options": [
        "/25",
        "/26",
        "/27",
        "/28"
      ],
      "answer": 1,
      "explanation": "A /26 provides 4 blocks of 64 total addresses (62 usable). This comfortably fits the requirement of 35, 40, 45, and 50 PCs in four equal blocks."
    },
    {
      "id": "q27",
      "prompt": "You are given the subnet 192.168.10.64/26. What is the broadcast address for this specific subnet?",
      "options": [
        "192.168.10.126",
        "192.168.10.127",
        "192.168.10.128",
        "192.168.10.255"
      ],
      "answer": 1,
      "explanation": "A /26 has a block size of 64. The network starts at .64, making the next network .128. The broadcast address is one less than the next network: .127."
    },
    {
      "id": "q28",
      "prompt": "If an IP address has a subnet mask of 255.255.255.192 (/26), what is the block size in the interesting octet?",
      "options": [
        "16",
        "32",
        "64",
        "128"
      ],
      "answer": 2,
      "explanation": "The block size is calculated by subtracting the mask value in the interesting octet from 256. 256 - 192 = 64."
    },
    {
      "id": "q29",
      "prompt": "Which formula correctly calculates the number of *usable* host IPs in an IPv4 subnet?",
      "options": [
        "2^(network bits) - 2",
        "2^(host bits) - 2",
        "2^(host bits) / 2",
        "2^(32 - network bits)"
      ],
      "answer": 1,
      "explanation": "You calculate 2 to the power of the host bits to find the total block size, then subtract 2 to exclude the network and broadcast addresses."
    },
    {
      "id": "q30",
      "prompt": "How many separate /28 subnets can you create from a single /24 Class C network?",
      "options": [
        "4 blocks",
        "8 blocks",
        "16 blocks",
        "32 blocks"
      ],
      "answer": 2,
      "explanation": "A /24 block contains 256 addresses. A /28 block contains 16 addresses. 256 divided by 16 equals exactly 16 blocks."
    },
    {
      "id": "q31",
      "prompt": "Normally, the usable host formula requires subtracting 2. However, RFC 3021 defines an exception for point-to-point links where you do NOT subtract 2, allowing all available IPs in the block to be assigned. Which prefix length does this apply to?",
      "options": [
        "/29",
        "/31",
        "/30",
        "/32"
      ],
      "answer": 1,
      "explanation": "A /31 provides exactly 2 IP addresses. RFC 3021 allows these to be used as host addresses on point-to-point links to prevent wasting addresses with a /30."
    },
    {
      "id": "q32",
      "prompt": "A technician attempts to assign the IP address `192.168.10.127` with a subnet mask of `255.255.255.128` (/25) to a server. What happens?",
      "options": [
        "The server successfully connects to the network as the last host.",
        "The OS rejects the IP because it overlaps with the loopback range.",
        "The OS rejects the IP because it is the broadcast address of the subnet.",
        "The OS accepts it, but the switch port disables itself due to STP."
      ],
      "answer": 2,
      "explanation": "A /25 network block starting at .0 ranges from .0 to .127. Because .127 is the exact broadcast address for that block, an OS will not allow it to be assigned to a host interface."
    },
    {
      "id": "q33",
      "prompt": "IPv4 uses the `127.0.0.0/8` range for testing a device's own TCP/IP stack (loopback). What is the exact equivalent standardized loopback address in IPv6?",
      "options": [
        "::1",
        "FE80::1",
        "FF02::1",
        "2001::1"
      ],
      "answer": 0,
      "explanation": "In IPv6, the address `::1` (all zeros with a final 1) is strictly reserved as the local loopback address, serving the identical function to 127.0.0.1 in IPv4."
    }
  ]
},
  {
  "id": "transport-layer-protocols-ports-final",
  "topicSlug": "transport-layer-protocols-ports",
  "final": true,
  "title": "Transport Layer Protocols & Ports Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "What does the acronym MSS stand for in the context of transport layer protocols?",
      "options": [
        "Maximum Segment Size",
        "Minimum Session Security",
        "Maximum Synchronization Sequence",
        "Multiple Streaming Sessions"
      ],
      "answer": 0,
      "explanation": "MSS stands for Maximum Segment Size, which represents the usable payload size once headers are subtracted from the total MTU."
    },
    {
      "id": "q2",
      "prompt": "At what stage in network communication is the Maximum Segment Size (MSS) negotiated?",
      "options": [
        "During the physical link establishment",
        "During the DNS resolution process",
        "During the TCP 3-way handshake",
        "During the 4-way termination handshake"
      ],
      "answer": 2,
      "explanation": "During the TCP 3-way handshake, both devices negotiate network parameters and settle on an MSS supported by both."
    },
    {
      "id": "q3",
      "prompt": "A client with a 1500 MTU connects over the internet. During the handshake, the devices settle on a supported MSS of 1360 bytes. Based on typical headers, what is the effective MTU actually used for this communication?",
      "options": [
        "1500 bytes",
        "1360 bytes",
        "1400 bytes",
        "1380 bytes"
      ],
      "answer": 2,
      "explanation": "With an MSS of 1360, adding the standard 40 bytes of TCP and IP headers results in an effective MTU of 1400 bytes."
    },
    {
      "id": "q4",
      "prompt": "What is the size of the header in a standard UDP datagram?",
      "options": [
        "16 bytes",
        "20 bytes",
        "32 bytes",
        "8 bytes"
      ],
      "answer": 3,
      "explanation": "UDP is a lightweight protocol with a very small 8-byte header, omitting features like flow control and sequence numbers."
    },
    {
      "id": "q5",
      "prompt": "What is the minimum header size for a TCP segment?",
      "options": [
        "8 bytes",
        "20 bytes",
        "16 bytes",
        "32 bytes"
      ],
      "answer": 1,
      "explanation": "A TCP header has a minimum size of 20 bytes because it includes complex fields for sequence numbers, acknowledgements, and flags."
    },
    {
      "id": "q6",
      "prompt": "Which of the following is a key characteristic of the User Datagram Protocol (UDP)?",
      "options": [
        "It provides guaranteed delivery of packets.",
        "It includes a complex flow control mechanism.",
        "It is connectionless and does not require a handshake.",
        "It reorders packets that arrive out of sequence."
      ],
      "answer": 2,
      "explanation": "UDP is a fast, connectionless protocol that does not establish a handshake or guarantee delivery."
    },
    {
      "id": "q7",
      "prompt": "You need to transfer a critical configuration file to a router where data corruption or loss is unacceptable. Which protocol is utilized for such operations?",
      "options": [
        "TFTP",
        "RTP",
        "UDP",
        "TCP"
      ],
      "answer": 3,
      "explanation": "TCP is connection-oriented and provides guaranteed delivery and advanced error checking, making it ideal for critical file transfers."
    },
    {
      "id": "q8",
      "prompt": "Which of the following sets of protocols relies exclusively on UDP?",
      "options": [
        "HTTP, HTTPS, FTP",
        "SMTP, FTP, RTCP",
        "TFTP, RTP, DHCP",
        "HTTPS, SMTP, TFTP"
      ],
      "answer": 2,
      "explanation": "TFTP, RTP, and DHCP are fast, connectionless protocols that rely on UDP for transport."
    },
    {
      "id": "q9",
      "prompt": "In terms of managing network congestion, how do TCP and UDP differ?",
      "options": [
        "UDP uses sliding window flow control, while TCP relies on hardware buffers.",
        "Both protocols use identical flow control, but TCP adds encryption.",
        "TCP utilizes a flow control mechanism, while UDP has no flow control.",
        "UDP manages congestion via the URG flag, while TCP uses the PSH flag."
      ],
      "answer": 2,
      "explanation": "TCP constantly monitors and adjusts traffic speeds using a flow control mechanism, whereas UDP sends traffic as fast as possible with no flow control."
    },
    {
      "id": "q10",
      "prompt": "What is the primary purpose of the TCP three-way handshake?",
      "options": [
        "To ensure a connection is in place before sending any traffic.",
        "To securely encrypt the payload data before transmission.",
        "To exchange MAC addresses between a client and a server.",
        "To permanently assign an ephemeral port to an application."
      ],
      "answer": 0,
      "explanation": "Because TCP is connection-oriented, the 3-way handshake guarantees that both sides are ready to communicate before any payload data is transmitted."
    },
    {
      "id": "q11",
      "prompt": "In a graceful TCP connection termination (four-way handshake), what immediately follows the first FIN packet sent by the client?",
      "options": [
        "The server sends a SYN-ACK.",
        "The server sends the 1st ACK.",
        "The server immediately sends a RST packet.",
        "The client sends a 2nd FIN."
      ],
      "answer": 1,
      "explanation": "The 4-way termination sequence is: 1st FIN (Client) -> 1st ACK (Server) -> 2nd FIN (Server) -> 2nd ACK (Client)."
    },
    {
      "id": "q12",
      "prompt": "Which TCP flag is utilized to request the establishment of a new connection between two devices?",
      "options": [
        "ACK",
        "PSH",
        "SYN",
        "URG"
      ],
      "answer": 2,
      "explanation": "The SYN (Synchronization) flag indicates that a device wants to initiate a new TCP connection."
    },
    {
      "id": "q13",
      "prompt": "When a device successfully receives a TCP segment, which flag does it use in its response to ensure reliable communication?",
      "options": [
        "PSH",
        "FIN",
        "SYN",
        "ACK"
      ],
      "answer": 3,
      "explanation": "The ACK (Acknowledgement) flag is used to confirm that a packet was successfully received."
    },
    {
      "id": "q14",
      "prompt": "A network administrator wants to forcefully terminate a TCP connection due to too many packet retransmissions, skipping the normal handshake process. Which flag is used?",
      "options": [
        "FIN",
        "RST",
        "URG",
        "PSH"
      ],
      "answer": 1,
      "explanation": "The RST (Reset) flag immediately drops a TCP connection without completing the standard 4-way termination handshake."
    },
    {
      "id": "q15",
      "prompt": "What is the primary functional difference between the PSH (Push) and URG (Urgent) flags?",
      "options": [
        "PSH is used for audio streaming, while URG is used for video streaming.",
        "PSH bypasses the sequence number order entirely, while URG respects sequence numbers.",
        "PSH terminates a connection softly, while URG terminates it forcefully.",
        "PSH forwards data immediately based on sequence number, while URG bypasses sequence number waiting."
      ],
      "answer": 3,
      "explanation": "Both push data to the application, but URG bypasses the TCP queue entirely regardless of sequence numbering, whereas PSH respects the sequence order."
    },
    {
      "id": "q16",
      "prompt": "If a user presses Ctrl+C in a terminal window to immediately halt a network process, which TCP flag is most likely triggered to send this signal?",
      "options": [
        "SYN",
        "PSH",
        "FIN",
        "URG"
      ],
      "answer": 3,
      "explanation": "The URG flag is used for out-of-band signaling, such as aborting a process via Ctrl+C, allowing the signal to jump ahead of normal traffic."
    },
    {
      "id": "q17",
      "prompt": "What does a Protocol Number specifically identify in an IP header?",
      "options": [
        "The physical medium over which the frame is transmitted.",
        "The application layer service, such as HTTP or HTTPS.",
        "The routing protocol, such as OSPF or EIGRP.",
        "The Transport layer protocol being used, such as TCP or UDP."
      ],
      "answer": 3,
      "explanation": "The protocol number (e.g., 6 for TCP or 17 for UDP) tells the receiving Network layer which Transport protocol should process the payload."
    },
    {
      "id": "q18",
      "prompt": "Which of the following correctly maps the transport protocols to their standardized protocol numbers?",
      "options": [
        "TCP = 1, UDP = 2",
        "TCP = 6, UDP = 17",
        "TCP = 17, UDP = 6",
        "TCP = 80, UDP = 443"
      ],
      "answer": 1,
      "explanation": "TCP is assigned protocol number 6, and UDP is assigned protocol number 17."
    },
    {
      "id": "q19",
      "prompt": "What is the standardized protocol number for ICMP?",
      "options": [
        "1",
        "2",
        "6",
        "17"
      ],
      "answer": 0,
      "explanation": "ICMP (Internet Control Message Protocol) uses protocol number 1."
    },
    {
      "id": "q20",
      "prompt": "How large is the field allocated for source and destination Port Numbers in TCP and UDP headers?",
      "options": [
        "8 bits",
        "24 bits",
        "32 bits",
        "16 bits"
      ],
      "answer": 3,
      "explanation": "Port numbers are 16-bit values, allowing for a total range of 0 to 65535."
    },
    {
      "id": "q21",
      "prompt": "Which port range is categorized as 'Well-known port numbers'?",
      "options": [
        "0 \u2013 1023",
        "1024 \u2013 49151",
        "49152 \u2013 65535",
        "0 \u2013 65535"
      ],
      "answer": 0,
      "explanation": "Well-known ports range from 0 to 1023 and are reserved for common, standardized services like HTTP (80) and HTTPS (443)."
    },
    {
      "id": "q22",
      "prompt": "A database server is configured to run MySQL on port 3306 and Remote Desktop Protocol (RDP) on port 3389. Which port category do these belong to?",
      "options": [
        "Well-known port numbers",
        "Registered port numbers",
        "Ephemeral port numbers",
        "Dynamic protocol numbers"
      ],
      "answer": 1,
      "explanation": "Ports 1024 through 49151 are Registered ports, frequently used by specific applications like databases and remote management tools."
    },
    {
      "id": "q23",
      "prompt": "When a client PC opens a web browser to access a server on port 80, it dynamically selects a local source port for the return traffic. Which port range does it typically use for this?",
      "options": [
        "0 \u2013 1023",
        "1024 \u2013 10000",
        "1024 \u2013 49151",
        "49152 \u2013 65535"
      ],
      "answer": 3,
      "explanation": "Client operating systems dynamically assign a high, temporary port from the Ephemeral range (49152 \u2013 65535) for outbound connections."
    },
    {
      "id": "q24",
      "prompt": "Which transport layer feature allows a protocol to reassemble incoming segments that arrive out of order?",
      "options": [
        "Flow control mechanism",
        "Packet reordering mechanism",
        "Three-way handshake",
        "Acknowledgement mechanism"
      ],
      "answer": 1,
      "explanation": "TCP features a packet reorder mechanism (using sequence numbers) to correctly reconstruct the data payload if packets arrive out of order. UDP lacks this."
    },
    {
      "id": "q25",
      "prompt": "Why might a device intentionally generate a TCP RST (Reset) packet instead of a FIN packet?",
      "options": [
        "To establish a secondary backup connection.",
        "To quickly clear a session experiencing too much delay or corruption.",
        "To negotiate a larger Maximum Segment Size (MSS).",
        "To pause data flow while a buffer empties."
      ],
      "answer": 1,
      "explanation": "An RST is a hard abort used when a connection becomes unreliable, corrupted, drops too many packets, or needs to be instantly killed."
    },
    {
      "id": "q26",
      "prompt": "What happens to packets handled by UDP if they are lost in transit?",
      "options": [
        "UDP automatically retransmits the lost packets using sequence numbers.",
        "The router buffers the packets and tries a different path.",
        "The application layer is entirely responsible for detecting and handling the loss.",
        "UDP converts the session to a TCP connection to ensure delivery."
      ],
      "answer": 2,
      "explanation": "Because UDP has no acknowledgement or retransmission mechanisms, any lost data must be managed entirely by the software application above it."
    },
    {
      "id": "q27",
      "prompt": "What distinguishes the FIN flag from the RST flag during connection teardown?",
      "options": [
        "FIN is sent by the server, while RST is sent by the client.",
        "FIN indicates a graceful teardown with no more data to send, while RST forcefully drops the connection immediately.",
        "FIN bypasses the connection queue, while RST waits for sequence numbers.",
        "FIN requires a 3-way handshake, while RST requires a 4-way handshake."
      ],
      "answer": 1,
      "explanation": "FIN is a polite request to close the connection after all data is sent (graceful), whereas RST is an immediate, unceremonious termination."
    },
    {
      "id": "q28",
      "prompt": "Which protocol provides only basic error checking rather than advanced error checking and recovery?",
      "options": [
        "FTP",
        "HTTPS",
        "UDP",
        "TCP"
      ],
      "answer": 2,
      "explanation": "UDP provides very basic error checking (a simple checksum) but lacks TCP's advanced mechanisms for tracking and recovering lost data."
    },
    {
      "id": "q29",
      "prompt": "A network engineer is analyzing traffic and sees a packet with both the SYN and ACK flags set simultaneously. In the context of a normal TCP session, which device sent this packet?",
      "options": [
        "The client, as the final step of the handshake.",
        "The router, to confirm routing table placement.",
        "The client, to terminate the connection.",
        "The server, as the second step of the 3-way handshake."
      ],
      "answer": 3,
      "explanation": "During the 3-way handshake, the client sends a SYN, and the server responds with a SYN-ACK packet to acknowledge the request and synchronize its own sequence numbers."
    },
    {
      "id": "q30",
      "prompt": "What is the total numeric range available for port numbers in a standard TCP/IP network?",
      "options": [
        "0 \u2013 1023",
        "0 \u2013 49151",
        "0 \u2013 65535",
        "0 \u2013 4,294,967,295"
      ],
      "answer": 2,
      "explanation": "Because a port number is a 16-bit binary value, its decimal equivalents range from 0 up to 65535."
    },
    {
      "id": "q31",
      "prompt": "If an attacker floods a target server with thousands of TCP packets that have the SYN flag set, but never completes the 3-way handshake with an ACK, what resource exhaustion attack is occurring?",
      "options": [
        "UDP Amplification Attack",
        "SYN Flood Attack",
        "Ephemeral Port Exhaustion",
        "Mac Flooding"
      ],
      "answer": 1,
      "explanation": "A SYN Flood attack exploits the 3-way handshake by leaving half-open connections on the server, eventually exhausting its memory resources to track them."
    },
    {
      "id": "q32",
      "prompt": "A firewall receives a stray TCP packet belonging to a session that does not exist in its state table. According to TCP protocol standards, what is the most appropriate flag to send back to explicitly reject this stray traffic?",
      "options": [
        "FIN",
        "PSH",
        "SYN",
        "RST"
      ],
      "answer": 3,
      "explanation": "When a device or firewall receives TCP traffic for a non-existent or blocked connection, it typically responds with a RST (Reset) packet to forcefully close it."
    },
    {
      "id": "q33",
      "prompt": "While UDP does not guarantee delivery, it does provide basic error checking to ensure the data was not corrupted in transit. Which specific field in the 8-byte UDP header handles this?",
      "options": [
        "Sequence Number",
        "Acknowledgement Number",
        "UDP Checksum",
        "Length Field"
      ],
      "answer": 2,
      "explanation": "The UDP Checksum field is used to verify that the payload and header have not been altered or corrupted as they traveled across the network."
    }
  ]
},
  {
  "id": "router-fundamentals-cli-final",
  "topicSlug": "router-fundamentals-cli",
  "final": true,
  "title": "Router Fundamentals & CLI Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "Which type of memory on a Cisco router stores the currently running configuration?",
      "options": [
        "ROM",
        "Flash",
        "NVRAM",
        "RAM"
      ],
      "answer": 3,
      "explanation": "RAM (Random Access Memory) holds the active Running-Config. If the router loses power, anything in RAM that hasn't been saved is lost."
    },
    {
      "id": "q2",
      "prompt": "Where is the saved configuration (Startup-Config) stored so that it survives a device reboot?",
      "options": [
        "NVRAM",
        "ROM",
        "Flash",
        "RAM"
      ],
      "answer": 0,
      "explanation": "NVRAM (Non-Volatile RAM) retains the saved startup configuration even when the device is powered off."
    },
    {
      "id": "q3",
      "prompt": "What is the primary content stored in the Flash memory of a Cisco router?",
      "options": [
        "The ROM Monitor (ROMMON) bootstrap program",
        "The currently running configuration",
        "The Cisco IOS (Internetwork Operating System)",
        "The diagnostic POST results"
      ],
      "answer": 2,
      "explanation": "Flash memory is used to store the Cisco IOS image, which is the router's operating system."
    },
    {
      "id": "q4",
      "prompt": "During the Cisco boot sequence, what is the very first software program loaded when the device is powered on?",
      "options": [
        "The Running-Config",
        "The Bootstrap program (ROMMON)",
        "The Cisco IOS",
        "The TFTP client module"
      ],
      "answer": 1,
      "explanation": "Upon power-up, the device first loads the bootstrap program from ROM, which then initiates hardware tests and looks for the IOS."
    },
    {
      "id": "q5",
      "prompt": "What happens if a Cisco router fails its Power On Self Test (POST) or cannot locate a valid IOS image in Flash?",
      "options": [
        "It boots into a default unconfigured state.",
        "It continuously restarts in an infinite boot loop.",
        "It attempts to load an IOS from NVRAM.",
        "It gets stuck in ROMmon mode."
      ],
      "answer": 3,
      "explanation": "If the POST fails or no valid IOS is found, the bootstrap process halts and drops the user into ROM Monitor (ROMmon) mode for troubleshooting."
    },
    {
      "id": "q6",
      "prompt": "If a router successfully loads the IOS but cannot find a startup configuration in NVRAM, what does it attempt to do next?",
      "options": [
        "It generates a new random configuration based on MAC addresses.",
        "It broadcasts a TFTP request to 255.255.255.255 to find a configuration server.",
        "It shuts down all physical interfaces for security.",
        "It re-runs the POST diagnostics."
      ],
      "answer": 1,
      "explanation": "Before defaulting to a completely blank configuration, the router broadcasts a request over the network to see if a TFTP server has a configuration file for it."
    },
    {
      "id": "q7",
      "prompt": "What is the primary difference between a router's 'interfaces' and its 'lines'?",
      "options": [
        "Interfaces are exclusively virtual, while lines are physical connections.",
        "Interfaces operate at Layer 3, while lines operate at Layer 2.",
        "Interfaces forward data traffic, while lines are used purely for managing the device.",
        "Interfaces use Telnet, while lines use SSH."
      ],
      "answer": 2,
      "explanation": "Interfaces connect to other networks to route data traffic, whereas line ports (like console and VTY) handle management traffic to configure the device."
    },
    {
      "id": "q8",
      "prompt": "On a modular Cisco switch, what does the interface designation `f0/1/2` signify?",
      "options": [
        "FastEthernet interface 0, switch 1, VLAN 2",
        "FastEthernet interface 0, module 1, slot 2",
        "Fiber interface 0, module 1, speed 2 Gbps",
        "FastEthernet stack 0, priority 1, port 2"
      ],
      "answer": 1,
      "explanation": "On modular devices, the naming convention extends to identify the interface type, the module, and the specific slot."
    },
    {
      "id": "q9",
      "prompt": "What is a VTY (Virtual Tele Type) line used for on a Cisco device?",
      "options": [
        "Routing traffic between virtual LANs (VLANs).",
        "Connecting directly to the device via a physical console cable.",
        "Creating a virtual private network (VPN) tunnel.",
        "Configuring and managing the device remotely using protocols like Telnet or SSH."
      ],
      "answer": 3,
      "explanation": "VTY lines are virtual ports used for remote management sessions over the network via Telnet or SSH."
    },
    {
      "id": "q10",
      "prompt": "Which TCP port number is utilized by the Telnet protocol?",
      "options": [
        "Port 21",
        "Port 22",
        "Port 23",
        "Port 80"
      ],
      "answer": 2,
      "explanation": "Telnet operates on TCP port 23."
    },
    {
      "id": "q11",
      "prompt": "Why is SSH strictly recommended over Telnet for managing network devices?",
      "options": [
        "SSH provides significantly faster remote connections.",
        "SSH traffic is encrypted using asymmetric encryption (RSA), while Telnet sends traffic in plain text.",
        "SSH does not require a password, whereas Telnet does.",
        "SSH operates at the physical layer, avoiding IP routing issues."
      ],
      "answer": 1,
      "explanation": "Telnet transmits all data, including administrative passwords, in unencrypted plain text. SSH encrypts the session, keeping credentials and configurations secure."
    },
    {
      "id": "q12",
      "prompt": "Which CLI prompt indicates that a user is currently in Privilege mode (Enable mode)?",
      "options": [
        "Router>",
        "Router#",
        "(Router-config)#",
        "Router(config-if)#"
      ],
      "answer": 1,
      "explanation": "The `#` symbol at the end of the prompt indicates Privilege EXEC mode, which allows show commands but not configuration commands."
    },
    {
      "id": "q13",
      "prompt": "If you are in User EXEC mode (`Router>`), which command transitions the session into Privilege mode?",
      "options": [
        "configure terminal",
        "enable",
        "privileged",
        "admin"
      ],
      "answer": 1,
      "explanation": "Typing `enable` moves the user from User EXEC mode (Idle mode) to Privilege mode."
    },
    {
      "id": "q14",
      "prompt": "Which of the following actions is permitted while in Privilege mode (`Router#`)?",
      "options": [
        "Changing the device hostname",
        "Assigning an IP address to an interface",
        "Executing show commands, ping, and traceroute",
        "Generating SSH RSA crypto keys"
      ],
      "answer": 2,
      "explanation": "Privilege mode allows for verification and troubleshooting commands (like show, ping, traceroute) but does not allow structural configuration changes."
    },
    {
      "id": "q15",
      "prompt": "You are currently configuring an interface at the `(Router-config-if)#` prompt. Which command will instantly drop you all the way back to Privilege mode (`Router#`)?",
      "options": [
        "exit",
        "disable",
        "end",
        "logout"
      ],
      "answer": 2,
      "explanation": "The `end` command (or pressing Ctrl+Z) exits out of all configuration sub-modes directly back to Privilege mode. `exit` only moves you back one level."
    },
    {
      "id": "q16",
      "prompt": "Why is it important to assign a unique hostname to a router using the `hostname` command?",
      "options": [
        "It dictates the DNS suffix for the router's interfaces.",
        "It is required before the router can route packets to the internet.",
        "It prevents IP address conflicts on the management VLAN.",
        "It prevents multiple devices from sharing the default name, making them easier to identify remotely."
      ],
      "answer": 3,
      "explanation": "If all devices are left as 'Router', administrators cannot easily identify which device they are remotely connected to during troubleshooting."
    },
    {
      "id": "q17",
      "prompt": "Which sequence of commands correctly configures an IP address on an interface?",
      "options": [
        "interface f0/0 -> ip address 192.168.1.1 255.255.255.0 -> no shutdown",
        "interface f0/0 -> assign ip 192.168.1.1/24 -> up",
        "ip address 192.168.1.1 255.255.255.0 -> interface f0/0 -> enable",
        "interface f0/0 -> ip 192.168.1.1 mask 255.255.255.0 -> no shut"
      ],
      "answer": 0,
      "explanation": "You must first enter the interface configuration mode, type `ip address <ip> <mask>`, and then bring the interface up with `no shutdown`."
    },
    {
      "id": "q18",
      "prompt": "What does the `no shutdown` command do when applied to a router interface?",
      "options": [
        "It prevents the router from rebooting accidentally.",
        "It disables the interface administratively.",
        "It brings the interface up from a disabled state to an active state.",
        "It disables the automatic shutdown timer on the VTY lines."
      ],
      "answer": 2,
      "explanation": "Cisco router interfaces are administratively disabled (shutdown) by default. The `no shutdown` command enables them to forward traffic."
    },
    {
      "id": "q19",
      "prompt": "Which command is a valid way to save the active running configuration to NVRAM?",
      "options": [
        "save running-config",
        "copy start run",
        "copy running-config startup-config",
        "commit configuration"
      ],
      "answer": 2,
      "explanation": "`copy running-config startup-config` (often shortened to `copy run start`) saves the active RAM config into NVRAM. `write` is also an accepted alternative."
    },
    {
      "id": "q20",
      "prompt": "If you make a mistake in configuration and want to revert to the saved NVRAM configuration without rebooting, which command retrieves it?",
      "options": [
        "copy startup-config running-config",
        "restore nvram",
        "copy running-config startup-config",
        "reload saved-config"
      ],
      "answer": 0,
      "explanation": "`copy startup-config running-config` pulls the saved NVRAM configuration and merges it into the active RAM."
    },
    {
      "id": "q21",
      "prompt": "While typing a long command in the Cisco CLI, which keyboard shortcut allows you to instantly autocomplete a partially typed keyword?",
      "options": [
        "Ctrl + A",
        "Enter",
        "Tab",
        "Spacebar"
      ],
      "answer": 2,
      "explanation": "Pressing the Tab key auto-completes unique keywords, saving time and preventing spelling errors."
    },
    {
      "id": "q22",
      "prompt": "You are trying to configure an interface but forgot the exact syntax for the IP address command. What should you type to browse the available keywords?",
      "options": [
        "help",
        "?",
        "man ip",
        "show commands"
      ],
      "answer": 1,
      "explanation": "Typing `?` at any point in the CLI lists all available commands or keywords for the current mode or command sequence."
    },
    {
      "id": "q23",
      "prompt": "How do you completely remove a previously configured IP address from a router interface?",
      "options": [
        "delete ip address",
        "remove ip address 192.168.1.1",
        "no ip address",
        "clear interface f0/0"
      ],
      "answer": 2,
      "explanation": "Preceding almost any configuration command with the `no` keyword deletes or disables that specific setting."
    },
    {
      "id": "q24",
      "prompt": "Which keyboard shortcut allows you to quickly move your cursor to the very front of the command line?",
      "options": [
        "Ctrl + E",
        "Ctrl + U",
        "Ctrl + A",
        "Ctrl + W"
      ],
      "answer": 2,
      "explanation": "Ctrl + A jumps the cursor to the beginning of the line, while Ctrl + E jumps it to the end."
    },
    {
      "id": "q25",
      "prompt": "You type a long string of configuration but realize you are in the wrong interface. Which keyboard shortcut immediately deletes the entire current command line?",
      "options": [
        "Ctrl + Z",
        "Ctrl + C",
        "Ctrl + U",
        "Ctrl + W"
      ],
      "answer": 2,
      "explanation": "Ctrl + U deletes the entire line of text you are currently typing."
    },
    {
      "id": "q26",
      "prompt": "In the 4-router diamond lab topology, the point-to-point links between routers use `/30` subnets from the `10.10.10.0/24` network. How many total `/30` subnets can be created from a `/24` block?",
      "options": [
        "16",
        "32",
        "64",
        "128"
      ],
      "answer": 2,
      "explanation": "A `/30` has a block size of 4 addresses. Dividing a `/24` block (256 addresses) by 4 yields exactly 64 subnets."
    },
    {
      "id": "q27",
      "prompt": "A router-to-router link is configured with the subnet `10.10.10.4/30`. What are the two usable IP addresses available for the router interfaces on this link?",
      "options": [
        ".4 and .5",
        ".5 and .6",
        ".6 and .7",
        ".4 and .7"
      ],
      "answer": 1,
      "explanation": "The network address is .4. The usable host addresses are .5 and .6. The broadcast address is .7."
    },
    {
      "id": "q28",
      "prompt": "In the diamond lab, the local LANs are assigned `/26` subnets from `192.168.10.0/24`. What is the block size (total addresses) for each `/26` LAN?",
      "options": [
        "16",
        "32",
        "64",
        "128"
      ],
      "answer": 2,
      "explanation": "A `/26` subnet borrows 2 bits for the network, leaving 6 bits for the host. 2 to the power of 6 equals a block size of 64."
    },
    {
      "id": "q29",
      "prompt": "According to the notes, the gateway IP for each LAN is always configured as the first usable IP of its block. If LAN3 uses the third `/26` subnet block of `192.168.10.0/24`, what IP address is assigned to LAN3's gateway?",
      "options": [
        "192.168.10.128",
        "192.168.10.129",
        "192.168.10.130",
        "192.168.10.191"
      ],
      "answer": 1,
      "explanation": "The third block ranges from 128 to 191. The network ID is .128, so the first usable IP (the gateway) is .129."
    },
    {
      "id": "q30",
      "prompt": "What happens if an administrator mistakenly types `copy startup-config running-config` on a router that is already actively running and configured?",
      "options": [
        "It permanently deletes the active RAM configuration.",
        "The router reboots immediately to apply the startup config.",
        "It overwrites the NVRAM with the active RAM configuration.",
        "It merges the saved configuration from NVRAM with the active configuration in RAM."
      ],
      "answer": 3,
      "explanation": "Copying into the running-config does not strictly overwrite it; Cisco IOS dynamically merges the loaded commands into the active configuration, which can sometimes cause conflicting overlapping settings."
    },
    {
      "id": "q31",
      "prompt": "During a password recovery procedure, an administrator interrupts the boot sequence to enter ROMMON mode. What must they modify to force the router to bypass the startup-config in NVRAM on its next boot?",
      "options": [
        "The Configuration Register (e.g., to 0x2142)",
        "The POST diagnostic threshold",
        "The Flash memory file system format",
        "The active TCP port for Telnet"
      ],
      "answer": 0,
      "explanation": "Changing the configuration register to `0x2142` tells the bootstrap program to ignore the NVRAM contents and boot into an empty running-config, allowing the administrator to bypass lost passwords."
    },
    {
      "id": "q32",
      "prompt": "In the diamond topology lab, asymmetric routing occurs when traffic from LAN1 to LAN3 goes via R2, but return traffic from LAN3 to LAN1 comes back via R4. While routers handle this natively, what common network security device will actively drop this traffic if placed in the middle?",
      "options": [
        "A Layer 2 unmanaged switch",
        "A Stateful Firewall",
        "A Wireless LAN Controller",
        "An Ethernet Hub"
      ],
      "answer": 1,
      "explanation": "A stateful firewall monitors the full state of connections (like the TCP 3-way handshake). If it only sees the return half of the traffic (asymmetric routing), it will drop it as an invalid or malicious session."
    },
    {
      "id": "q33",
      "prompt": "When you execute a command in Global Configuration mode (e.g., changing a hostname or setting an IP address), when does the change actually take effect on the router?",
      "options": [
        "Immediately, modifying the running-config in RAM.",
        "After the user types the `commit` command.",
        "After the `write` command saves it to NVRAM.",
        "After the next device reboot."
      ],
      "answer": 0,
      "explanation": "Unlike some other vendor platforms, standard Cisco IOS applies configuration commands immediately to the active running-config in RAM."
    }
  ]
},
  {
  "id": "routing-basics",
  "topicSlug": "routing",
  "group": "Routing Basics",
  "title": "Routing Basics Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "What is the primary function of routing in a network?",
      "options": [
        "To encrypt data payloads for secure transmission over the internet.",
        "To forward traffic from one network to another network.",
        "To translate private IP addresses into public IP addresses.",
        "To assign IP addresses dynamically to client machines."
      ],
      "answer": 1,
      "explanation": "Routing is the foundational process of determining the best path and forwarding traffic between different networks."
    },
    {
      "id": "q2",
      "prompt": "At which OSI layer does a router operate to perform its routing functions?",
      "options": [
        "Data-Link layer",
        "Transport layer",
        "Application layer",
        "Network layer"
      ],
      "answer": 3,
      "explanation": "A router is a Layer 3 device that operates at the Network layer, using logical IP addressing to make forwarding decisions."
    },
    {
      "id": "q3",
      "prompt": "When a router has an interface configured with an IP address and connected to a live switch, how does that network appear in its routing table?",
      "options": [
        "As a Static (S) route",
        "As an Unknown (U) route",
        "As a Connected (C) route",
        "As a Default (D) route"
      ],
      "answer": 2,
      "explanation": "Networks that are directly attached to the router are automatically known and appear in the routing table as Connected (C)."
    },
    {
      "id": "q4",
      "prompt": "In a routing table, what does the letter 'S' next to a route entry denote?",
      "options": [
        "A route learned via Spanning Tree Protocol",
        "A statically configured route",
        "A dynamically learned summary route",
        "A securely encrypted path"
      ],
      "answer": 1,
      "explanation": "The 'S' stands for Static, indicating that a network engineer manually configured this path to an unknown network."
    },
    {
      "id": "q5",
      "prompt": "Which of the following is the correct configuration syntax for creating a standard IPv4 static route?",
      "options": [
        "ip route <next-hop IP> <subnet mask> <destination network>",
        "ip route <destination network> <next-hop IP> <subnet mask>",
        "ip static <destination network> <subnet mask> <next-hop IP>",
        "ip route <destination network> <subnet mask> <next-hop IP>"
      ],
      "answer": 3,
      "explanation": "The correct command order is `ip route` followed by the destination network, the destination subnet mask, and finally the next-hop IP."
    },
    {
      "id": "q6",
      "prompt": "You need to manually route traffic to the `10.5.0.0/24` network via a neighboring router at `192.168.1.5`. Which command correctly achieves this?",
      "options": [
        "ip route 10.5.0.0 255.255.0.0 192.168.1.5",
        "ip route 10.5.0.0 255.255.255.0 192.168.1.5",
        "ip route 192.168.1.5 255.255.255.0 10.5.0.0",
        "route add 10.5.0.0 255.255.255.0 via 192.168.1.5"
      ],
      "answer": 1,
      "explanation": "The destination is `10.5.0.0`, the `/24` mask is `255.255.255.0`, and the next-hop is `192.168.1.5`."
    },
    {
      "id": "q7",
      "prompt": "Which of the following is considered a primary advantage of static routing?",
      "options": [
        "It automatically reroutes traffic if a network link goes down.",
        "It generates minimal CPU and processor overhead.",
        "It scales easily in very large enterprise environments.",
        "It dynamically detects changes in the network topology."
      ],
      "answer": 1,
      "explanation": "Static routing does not require the router to run complex algorithms or exchange updates, so it generates minimal CPU overhead."
    },
    {
      "id": "q8",
      "prompt": "What is a major disadvantage of using static routing in a growing network?",
      "options": [
        "It consumes excessive bandwidth to share routing updates.",
        "It places a heavy processing load on the router's ASIC.",
        "It provides no fault tolerance if a configured link goes down.",
        "It allows routing protocols to override administrative control."
      ],
      "answer": 2,
      "explanation": "If a link goes down, a static route does not dynamically find an alternate path. The traffic will fail until an administrator manually changes the route."
    },
    {
      "id": "q9",
      "prompt": "Why might a network administrator choose dynamic routing over static routing?",
      "options": [
        "Dynamic routing automatically finds an alternate path if the best path fails.",
        "Dynamic routing requires less RAM and CPU power than static routing.",
        "Dynamic routing prevents asymmetric routing from occurring.",
        "Dynamic routing gives the engineer total manual control over every path."
      ],
      "answer": 0,
      "explanation": "Dynamic routing protocols offer fault tolerance by automatically calculating and switching to an alternate path if the primary link goes down."
    },
    {
      "id": "q10",
      "prompt": "Which of the following describes a known disadvantage of dynamic routing protocols?",
      "options": [
        "They are extremely difficult to configure in large environments.",
        "They consume network bandwidth to share updates and network information.",
        "They require manual reconfiguration every time a new subnet is added.",
        "They limit the network size to a maximum of 15 routers."
      ],
      "answer": 1,
      "explanation": "Dynamic routing protocols must send periodic or triggered updates across the network, which consumes available bandwidth."
    },
    {
      "id": "q11",
      "prompt": "If multiple potential routes exist to a destination network, what rule does the routing table use to define the 'best' path?",
      "options": [
        "The path with the highest bandwidth is always selected.",
        "The path with the lowest metric value is selected.",
        "The path with the highest metric value is selected.",
        "The path with the most hop counts is selected."
      ],
      "answer": 1,
      "explanation": "In a routing table, the route with the lowest metric value is considered the best path to a destination."
    },
    {
      "id": "q12",
      "prompt": "You are examining R2's routing table and see the entry: `S - 192.168.6.0/24 -> 192.168.4.1`. What does `192.168.4.1` represent?",
      "options": [
        "The subnet mask of the destination network.",
        "The IP address of the source machine sending the traffic.",
        "The loopback address of R2.",
        "The IP address of the next-hop router."
      ],
      "answer": 3,
      "explanation": "In the static route output, the IP address following the arrow (`->`) indicates the next-hop router that R2 will forward the traffic to."
    },
    {
      "id": "q13",
      "prompt": "What does the term 'asymmetric routing' refer to in a network topology?",
      "options": [
        "When a router uses different subnet masks for different interfaces.",
        "When traffic from A to B takes one path, but the return traffic from B to A takes a completely different path.",
        "When a dynamic protocol load-balances across paths of unequal cost.",
        "When static routes are used on one router and dynamic routes on another."
      ],
      "answer": 1,
      "explanation": "Asymmetric routing occurs when traffic leaves via one path (e.g., through R2) but returns via another (e.g., through R4), often configured deliberately or resulting from differing routing decisions."
    },
    {
      "id": "q14",
      "prompt": "If a router receives a packet destined for a network that is completely 'unknown' to it, what must happen for the packet to be delivered?",
      "options": [
        "The router will automatically flood it out of all interfaces.",
        "The router will send an ARP request to the destination IP.",
        "A route must be configured (statically or dynamically) in the routing table, otherwise the packet is dropped.",
        "The router will temporarily store the packet in NVRAM."
      ],
      "answer": 2,
      "explanation": "Routers only forward traffic to known networks listed in their routing table. If no specific or default route exists for an unknown network, the router drops the packet."
    },
    {
      "id": "q15",
      "prompt": "An administrator wants to route traffic across the internet but doesn't want the network to calculate best paths automatically. What routing approach provides total manual control with zero bandwidth overhead?",
      "options": [
        "Distance-Vector Routing",
        "Link-State Routing",
        "Static Routing",
        "Hybrid Routing"
      ],
      "answer": 2,
      "explanation": "Static routing uses no bandwidth for updates and gives the administrator 100% control over exactly where traffic goes."
    },
    {
      "id": "q16",
      "prompt": "You execute `ip route 172.16.20.0 255.255.255.128 10.1.1.2`. What does `255.255.255.128` define in this command?",
      "options": [
        "The administrative distance of the route.",
        "The subnet mask of the target destination network.",
        "The wildcard mask of the local router's exit interface.",
        "The subnet mask of the next-hop router's interface."
      ],
      "answer": 1,
      "explanation": "The second argument in the `ip route` command dictates the subnet mask of the remote destination network you are trying to reach."
    },
    {
      "id": "q17",
      "prompt": "Which of the following statements accurately contrasts static and dynamic routing?",
      "options": [
        "Static routing adapts to topology changes, while dynamic routing relies on manual intervention.",
        "Static routing consumes heavy CPU cycles, while dynamic routing has zero CPU overhead.",
        "Dynamic routing requires manual path updates, while static routing is plug-and-play.",
        "Dynamic routing handles fault tolerance automatically, while static routing fails if the specific link breaks."
      ],
      "answer": 3,
      "explanation": "Dynamic routing protocols dynamically adapt to link failures to maintain connectivity, whereas a static route is a hardcoded path that cannot adapt on its own."
    },
    {
      "id": "q18",
      "prompt": "When configuring a static route, what happens if the next-hop IP address belongs to a network that the router is not directly connected to and cannot reach?",
      "options": [
        "The router automatically changes the next-hop to its default gateway.",
        "The router installs the route but marks it with an 'X'.",
        "The route is not installed in the active routing table because the next-hop is unresolved.",
        "The router uses an ARP broadcast to find the unreachable IP."
      ],
      "answer": 2,
      "explanation": "For a static route to be active and placed in the routing table, the router must be able to recursively resolve the next-hop IP address to a valid exit interface."
    },
    {
      "id": "q19",
      "prompt": "What happens to a static route in the routing table if the physical interface leading to its next-hop goes down?",
      "options": [
        "The static route remains in the table but traffic is dropped.",
        "The static route is automatically removed from the routing table.",
        "The router converts the static route into an active dynamic route.",
        "The router freezes the routing table to prevent loops."
      ],
      "answer": 1,
      "explanation": "If the exit interface goes down, the router can no longer reach the next-hop IP. Consequently, the static route is immediately removed from the routing table to prevent black-holing traffic."
    },
    {
      "id": "q20",
      "prompt": "Instead of specifying a next-hop IP address, which of the following is a valid, widely-used alternative when configuring a static route?",
      "options": [
        "The local exit interface (e.g., `GigabitEthernet0/1`)",
        "The MAC address of the destination PC",
        "The loopback address of the target machine",
        "The AS number of the destination network"
      ],
      "answer": 0,
      "explanation": "A static route can be configured to point to a local exit interface (e.g., `ip route 192.168.2.0 255.255.255.0 GigabitEthernet0/1`), which is especially useful on point-to-point links."
    },
    {
      "id": "q21",
      "prompt": "Why is static routing generally considered impractical for large enterprise environments?",
      "options": [
        "It cannot route IPv4 packets.",
        "It limits the network speed to 100 Mbps.",
        "It requires manually updating the routing table on every router whenever the topology changes.",
        "It creates massive broadcast storms across the core network."
      ],
      "answer": 2,
      "explanation": "In large environments, networks are frequently added, removed, or changed. Manually updating static routes on dozens or hundreds of routers creates an unsustainable administrative burden."
    },
    {
      "id": "q22",
      "prompt": "In a scenario where a router learns about the exact same destination network from a static route and a dynamic routing protocol, which factor ultimately decides which path is trusted?",
      "options": [
        "The interface bandwidth",
        "The routing protocol's metric",
        "The Administrative Distance (AD)",
        "The subnet mask length"
      ],
      "answer": 2,
      "explanation": "When the prefix length is identical, the router uses Administrative Distance (AD) to decide which route source is more trustworthy. (Static routes have an AD of 1, which beats dynamic protocols)."
    }
  ]
},
{
  "id": "static-default-routing",
  "topicSlug": "routing",
  "group": "Static & Default Routing",
  "title": "Static & Default Routing Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "According to standard route decision criteria, what is the very first attribute a router checks when selecting a path from the routing table?",
      "options": [
        "The lowest Administrative Distance (AD)",
        "The highest bandwidth metric",
        "The longest subnet prefix match",
        "The lowest metric value"
      ],
      "answer": 2,
      "explanation": "The highest prefix (longest subnet match) always wins first. A router will always choose a /25 route over a /24 route for a destination, regardless of AD or metric."
    },
    {
      "id": "q2",
      "prompt": "A router has a static route to 192.168.30.0/24 (AD 1) and an OSPF route to 192.168.30.0/25 (AD 110). If a packet is destined for 192.168.30.1, which route will the router use?",
      "options": [
        "The static route, because AD 1 is lower than AD 110.",
        "The OSPF route, because it has a longer prefix match (/25).",
        "It will load-balance across both routes.",
        "It will drop the packet due to a routing conflict."
      ],
      "answer": 1,
      "explanation": "The longest prefix match rule is evaluated before Administrative Distance. Since /25 is a longer match than /24, the OSPF route wins despite having a higher AD."
    },
    {
      "id": "q3",
      "prompt": "A router needs to send a packet to 192.168.30.254. The routing table contains a route for 192.168.30.0/25 via R1 and a route for 192.168.30.0/24 via R2. Where does the router send the packet?",
      "options": [
        "To R1, because /25 is the longest prefix match.",
        "To R2, because the IP .254 does not fall inside the /25 range.",
        "It broadcasts the packet to both R1 and R2.",
        "It drops the packet because .254 is a broadcast address."
      ],
      "answer": 1,
      "explanation": "While /25 is a longer prefix, the address 192.168.30.254 falls outside the 192.168.30.0/25 block (which ends at .127). Therefore, the /24 route is the only valid match."
    },
    {
      "id": "q4",
      "prompt": "What is the primary purpose of Administrative Distance (AD) in a Cisco router?",
      "options": [
        "To determine the physical distance to the destination network.",
        "To break ties between routes learned from the exact same routing protocol.",
        "To decide which route source is more trustworthy when prefixes tie.",
        "To calculate the total bandwidth cost of a path."
      ],
      "answer": 2,
      "explanation": "AD determines the trustworthiness of the source. If a router learns about the exact same network from OSPF and EIGRP, it uses AD to decide which protocol to trust."
    },
    {
      "id": "q5",
      "prompt": "Which of the following routing sources has the lowest (most trusted) default Administrative Distance?",
      "options": [
        "Static Route",
        "Connected Route",
        "EIGRP Internal",
        "OSPF"
      ],
      "answer": 1,
      "explanation": "A Directly Connected route has an AD of 0, which is the most trusted source possible, beating a Static route's AD of 1."
    },
    {
      "id": "q6",
      "prompt": "What is the default Administrative Distance for a standard EIGRP Internal route?",
      "options": [
        "90",
        "110",
        "120",
        "170"
      ],
      "answer": 0,
      "explanation": "EIGRP Internal routes have a default AD of 90, making them preferred over OSPF (110) and RIP (120)."
    },
    {
      "id": "q7",
      "prompt": "If an autonomous system is running both OSPF and RIP, and both protocols learn a route to the exact same /24 network, which route will be placed in the routing table?",
      "options": [
        "The RIP route, because its metric is lower.",
        "The OSPF route, because its AD (110) is lower than RIP (120).",
        "The RIP route, because its AD (120) is higher than OSPF.",
        "Both routes will be installed for load balancing."
      ],
      "answer": 1,
      "explanation": "OSPF has a default AD of 110, while RIP is 120. The router trusts OSPF more, so the OSPF route is installed."
    },
    {
      "id": "q8",
      "prompt": "A router has two static routes to the same /24 network pointing to two different next-hop IPs. Both routes have the default AD of 1. How does the router handle traffic to this destination?",
      "options": [
        "It treats one as primary and the other as a floating backup.",
        "It load-balances traffic across both routes as primary paths.",
        "It disables both routes to prevent a network loop.",
        "It uses the route with the highest next-hop IP address."
      ],
      "answer": 1,
      "explanation": "If two static routes have the exact same prefix and the exact same AD, the router treats them both as equal-cost primary paths and load-balances traffic across them."
    },
    {
      "id": "q9",
      "prompt": "Which AD values correctly represent EBGP and IBGP, respectively?",
      "options": [
        "90 and 170",
        "110 and 120",
        "20 and 200",
        "1 and 5"
      ],
      "answer": 2,
      "explanation": "EBGP (External BGP) has an AD of 20, making it highly trusted, while IBGP (Internal BGP) has a very high AD of 200."
    },
    {
      "id": "q10",
      "prompt": "What is the primary function of a 'floating' static route?",
      "options": [
        "To load-balance traffic across multiple equal-cost links.",
        "To discard unwanted traffic directed to a specific network.",
        "To create a backup path that only activates when the primary path fails.",
        "To automatically summarize routing tables between ABRs."
      ],
      "answer": 2,
      "explanation": "A floating static route is configured with a higher-than-default AD so it remains hidden in the background, only floating into the routing table if the primary route goes down."
    },
    {
      "id": "q11",
      "prompt": "You want to configure a floating static route to 192.168.30.0/24 via 192.168.3.4 that will serve as a backup to an OSPF route. Which command achieves this?",
      "options": [
        "ip route 192.168.30.0 255.255.255.0 192.168.3.4",
        "ip route 192.168.30.0 255.255.255.0 192.168.3.4 90",
        "ip route 192.168.30.0 255.255.255.0 192.168.3.4 120",
        "ip route 192.168.30.0 255.255.255.0 192.168.3.4 backup"
      ],
      "answer": 2,
      "explanation": "OSPF has an AD of 110. To make the static route act as a backup to OSPF, it must have an AD higher than 110 (such as 120)."
    },
    {
      "id": "q12",
      "prompt": "What is the purpose of a Null0 static route?",
      "options": [
        "To dynamically learn unknown networks without a routing protocol.",
        "To deliberately discard or 'black-hole' traffic destined for a specific network.",
        "To reset the router's active configuration to default.",
        "To act as a gateway of last resort for the internet."
      ],
      "answer": 1,
      "explanation": "A Null0 route directs traffic to a virtual 'trash can' interface. Any traffic matching a Null0 route is silently discarded."
    },
    {
      "id": "q13",
      "prompt": "Which configuration command successfully drops all traffic headed to the `10.0.0.0/8` network?",
      "options": [
        "ip route 10.0.0.0 255.0.0.0 drop",
        "ip route 10.0.0.0 255.0.0.0 0.0.0.0",
        "ip route 10.0.0.0 255.0.0.0 null0",
        "ip route 10.0.0.0 255.0.0.0 discard"
      ],
      "answer": 2,
      "explanation": "The correct syntax to discard traffic using static routing is to point the next-hop to the virtual `null0` interface."
    },
    {
      "id": "q14",
      "prompt": "What terminology does Cisco use to describe the default route of a device?",
      "options": [
        "The Primary Floating Route",
        "The Gateway of Last Resort",
        "The Null0 Boundary",
        "The Exterior Gateway Route"
      ],
      "answer": 1,
      "explanation": "In Cisco IOS, the default route (0.0.0.0/0) is commonly referred to as the 'gateway of last resort' because it is used only when no other specific routes match."
    },
    {
      "id": "q15",
      "prompt": "What is the Administrative Distance (AD) of a standard default route?",
      "options": [
        "0",
        "1",
        "5",
        "255"
      ],
      "answer": 1,
      "explanation": "A manually configured default route acts as a static route, meaning it carries the standard static AD of 1."
    },
    {
      "id": "q16",
      "prompt": "A router receives a packet for 192.168.1.50. The routing table has a static route for 192.168.1.0/24 (AD 1) and a default route 0.0.0.0/0 (AD 1). How does the router forward the packet?",
      "options": [
        "It uses the default route because 0.0.0.0 encompasses all traffic.",
        "It uses the static route because /24 is a longer prefix match than /0.",
        "It load-balances between the two routes since both have an AD of 1.",
        "It drops the packet due to a prefix conflict."
      ],
      "answer": 1,
      "explanation": "A default route (0.0.0.0/0) has a prefix length of 0. The router will always prefer the more specific /24 match over the default route."
    },
    {
      "id": "q17",
      "prompt": "In enterprise ISP deployments, why is a default route typically used between a CE (Customer Edge) and a PE (Provider Edge) router?",
      "options": [
        "To force the PE router to use OSPF instead of BGP.",
        "To establish a secure, encrypted tunnel to the provider.",
        "So the customer device doesn't need to process and store the massive full BGP internet routing table.",
        "To assign dynamic IP addresses to the customer's internal endpoints."
      ],
      "answer": 2,
      "explanation": "Instead of overwhelming the CE router's memory with millions of internet routes, a single default route is used to point all unknown traffic to the ISP's PE router."
    },
    {
      "id": "q18",
      "prompt": "What is the correct configuration command to establish a default route pointing toward the next-hop IP 203.0.113.1?",
      "options": [
        "ip route default 203.0.113.1",
        "ip route 0.0.0.0 255.255.255.255 203.0.113.1",
        "ip route 0.0.0.0 0.0.0.0 203.0.113.1",
        "ip route any any 203.0.113.1"
      ],
      "answer": 2,
      "explanation": "A default route is configured using the network address `0.0.0.0` and the subnet mask `0.0.0.0`, followed by the next-hop IP."
    },
    {
      "id": "q19",
      "prompt": "Which Administrative Distance represents an EIGRP Summary route?",
      "options": [
        "1",
        "5",
        "90",
        "170"
      ],
      "answer": 1,
      "explanation": "An EIGRP Summary route has an AD of 5, which is highly preferred to prevent routing loops during summarization."
    },
    {
      "id": "q20",
      "prompt": "When discussing EIGRP, what is the difference in Administrative Distance between Internal and External routes?",
      "options": [
        "Internal is 90, External is 170.",
        "Internal is 100, External is 200.",
        "Internal is 110, External is 120.",
        "Internal is 5, External is 90."
      ],
      "answer": 0,
      "explanation": "EIGRP assigns an AD of 90 to internal routes (learned within the AS) and an AD of 170 to external routes (redistributed from other protocols)."
    },
    {
      "id": "q21",
      "prompt": "If a static route is configured with a next-hop IP address (e.g., `ip route 10.1.1.0 255.255.255.0 192.168.2.2`), what hidden step must the router perform before it can actually forward the frame out of an interface?",
      "options": [
        "It must ping the next-hop to ensure it is alive.",
        "It must perform a recursive route lookup to find the physical exit interface for the next-hop IP.",
        "It must convert the static route into an active OSPF LSA.",
        "It must check the Null0 interface for matching prefix lists."
      ],
      "answer": 1,
      "explanation": "The router must perform a recursive lookup. It checks the routing table a second time to find out which physical exit interface is connected to the network of the next-hop IP."
    },
    {
      "id": "q22",
      "prompt": "When you configure a static route using a multi-access exit interface instead of a next-hop IP (e.g., `ip route 10.1.1.0 255.255.255.0 GigabitEthernet0/0`), what Layer 2 mechanism must the downstream router support for communication to work smoothly?",
      "options": [
        "VLAN Tagging (802.1Q)",
        "Spanning Tree Protocol (STP)",
        "Proxy ARP",
        "MACsec Encryption"
      ],
      "answer": 2,
      "explanation": "If pointed directly to an Ethernet interface, the router assumes the destination is directly connected and sends an ARP request for the final destination IP. The downstream router must use Proxy ARP to reply on behalf of that remote network."
    },
    {
      "id": "q23",
      "prompt": "Can a network engineer configure a 'floating' default route to provide redundant internet access?",
      "options": [
        "No, default routes are permanently locked to an AD of 1.",
        "No, floating routes can only be applied to specific /24 or smaller prefixes.",
        "Yes, by configuring a secondary `0.0.0.0 0.0.0.0` route with a higher AD than the primary internet route.",
        "Yes, but it requires enabling BGP on the Customer Edge router."
      ],
      "answer": 2,
      "explanation": "Yes. A floating default route (e.g., `ip route 0.0.0.0 0.0.0.0 10.2.2.2 200`) acts as a backup internet gateway, activating only if the primary default route goes down."
    }
  ]
},
{
  "id": "dynamic-rip",
  "topicSlug": "routing",
  "group": "Dynamic & RIP",
  "title": "Dynamic & RIP Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "In the context of dynamic routing, what defines an Autonomous System (AS)?",
      "options": [
        "A single router that dynamically load-balances across the internet.",
        "A collection of devices, routers, and networks managed under a single organization.",
        "A group of network protocols that share the same Administrative Distance.",
        "A proprietary Cisco algorithm used to calculate link-state updates."
      ],
      "answer": 1,
      "explanation": "An Autonomous System (AS) is a network or collection of networks operating under a single administrative domain or organization, such as an ISP or a corporate environment."
    },
    {
      "id": "q2",
      "prompt": "Which of the following routing protocols is classified as an Exterior Gateway Protocol (EGP)?",
      "options": [
        "EIGRP",
        "OSPF",
        "BGP",
        "RIP"
      ],
      "answer": 2,
      "explanation": "BGP (Border Gateway Protocol) is an EGP designed to route traffic between different organizations across the internet, unlike IGPs which route inside a single organization."
    },
    {
      "id": "q3",
      "prompt": "Which specific algorithm does the RIP routing protocol use to calculate its best path?",
      "options": [
        "Dijkstra's Shortest Path First",
        "Diffusing Update Algorithm (DUAL)",
        "Spanning Tree Algorithm",
        "Bellman-Ford Algorithm"
      ],
      "answer": 3,
      "explanation": "RIP uses the Bellman-Ford algorithm to evaluate update packets and select the path with the lowest hop count."
    },
    {
      "id": "q4",
      "prompt": "What is the maximum number of hops allowed for a valid route inside a RIP autonomous system?",
      "options": [
        "15 hops",
        "16 hops",
        "100 hops",
        "255 hops"
      ],
      "answer": 0,
      "explanation": "RIP has a strict hop count limitation. It supports a maximum of 15 routers; a metric of 16 is considered infinite and unreachable."
    },
    {
      "id": "q5",
      "prompt": "How does RIP transport its routing updates across the network?",
      "options": [
        "Using TCP port 179",
        "Using its own proprietary Protocol 88",
        "Using UDP port 520",
        "Using ICMP broadcast messages"
      ],
      "answer": 2,
      "explanation": "RIP is a distance-vector protocol that shares its periodic updates over the network using UDP port 520."
    },
    {
      "id": "q6",
      "prompt": "What is the default Administrative Distance (AD) of a route learned via RIP?",
      "options": [
        "90",
        "110",
        "120",
        "170"
      ],
      "answer": 2,
      "explanation": "The AD for RIP is 120, making it less preferred than OSPF (110) or EIGRP Internal (90) if they advertise the same network."
    },
    {
      "id": "q7",
      "prompt": "A router running RIP learns two separate paths to the 192.168.4.0/24 network, both exactly 3 hops away. What is RIP's default behavior in this scenario?",
      "options": [
        "It disables the slower physical interface to prevent loops.",
        "It load-balances the traffic across both paths.",
        "It uses the path with the highest next-hop IP address and places the other in hold-down.",
        "It sends a Query packet to neighbor routers to break the tie."
      ],
      "answer": 1,
      "explanation": "When two or more paths have the exact same hop count, RIP performs equal-cost load balancing by default."
    },
    {
      "id": "q8",
      "prompt": "Which of the following is a key difference between RIPv1 and RIPv2?",
      "options": [
        "RIPv1 supports VLSM, while RIPv2 is strictly classful.",
        "RIPv1 uses multicast updates, while RIPv2 uses unicast updates.",
        "RIPv1 is classful and uses broadcast, while RIPv2 is classless and uses multicast.",
        "RIPv1 supports IPv6, while RIPv2 only supports IPv4."
      ],
      "answer": 2,
      "explanation": "RIPv2 improved upon RIPv1 by adding support for classless addressing (VLSM) and changing the update method from broadcast (255.255.255.255) to multicast (224.0.0.9)."
    },
    {
      "id": "q9",
      "prompt": "What is the default Update Timer for the RIP routing protocol?",
      "options": [
        "10 seconds",
        "30 seconds",
        "60 seconds",
        "180 seconds"
      ],
      "answer": 1,
      "explanation": "RIP is a periodic-updating protocol that broadcasts or multicasts its entire routing table every 30 seconds."
    },
    {
      "id": "q10",
      "prompt": "In RIP, what happens to a route immediately after the Invalid Timer (180 seconds) expires?",
      "options": [
        "The route is permanently deleted from the router's memory.",
        "The route's metric is changed to 16 (unreachable) and it enters the hold-down state.",
        "The router sends a targeted unicast request to the neighbor to refresh the route.",
        "The route is promoted to an Administrative Distance of 1."
      ],
      "answer": 1,
      "explanation": "If no update is received for 180 seconds, the route is marked invalid, its hop count is forced to 16, and it enters the hold-down period where new updates are suppressed."
    },
    {
      "id": "q11",
      "prompt": "How long is the default Flush Timer in RIP?",
      "options": [
        "180 seconds",
        "200 seconds",
        "240 seconds",
        "300 seconds"
      ],
      "answer": 2,
      "explanation": "The Flush Timer is 240 seconds. Once a route leaves the hold-down state, it is completely flushed from the routing table 60 seconds later (180 + 60 = 240)."
    },
    {
      "id": "q12",
      "prompt": "An administrator configures `passive-interface default` under the `router rip` configuration mode. What is the result?",
      "options": [
        "The router stops participating in RIP entirely and deletes its routing table.",
        "The router stops sending and receiving all RIP updates on all interfaces.",
        "The router prevents RIP updates from being sent out any interface, but still receives them.",
        "The router sends RIP updates via unicast instead of multicast."
      ],
      "answer": 2,
      "explanation": "The passive-interface command suppresses outbound routing updates to prevent sending unnecessary traffic to end hosts, but the interface continues to listen for incoming updates."
    },
    {
      "id": "q13",
      "prompt": "When configuring RIPv2, why is the `no auto-summary` command almost always required?",
      "options": [
        "Because RIPv2 automatically condenses classless subnets back to their classful boundaries by default.",
        "Because RIPv2 cannot load-balance without it.",
        "Because it prevents RIP from authenticating neighbor routers.",
        "Because it allows RIP to summarize IPv6 routes natively."
      ],
      "answer": 0,
      "explanation": "By default, RIPv2 acts like RIPv1 at network boundaries and summarizes classless networks (like /26s) back to their default classful mask. `no auto-summary` disables this behavior."
    },
    {
      "id": "q14",
      "prompt": "A router running RIP needs to reach the 10.0.0.0/8 network. Path A is a fast 1 Gbps fiber link that goes through 4 routers. Path B is a slow 10 Mbps copper link that goes through 2 routers. Which path will RIP choose and why?",
      "options": [
        "Path A, because 1 Gbps provides a significantly better cost metric.",
        "Path A, because fiber optics have a lower delay value.",
        "Path B, because RIP's only metric is hop count, making the 2-hop path preferred.",
        "It will load balance between both paths because RIP ignores bandwidth."
      ],
      "answer": 2,
      "explanation": "RIP is purely a distance-vector protocol using hop count. It completely ignores bandwidth and link speed, meaning it will pick the slower 2-hop path over the much faster 4-hop path."
    },
    {
      "id": "q15",
      "prompt": "Which IOS command displays the current active routing protocol, including its timers (Update, Invalid, Hold-down, Flush)?",
      "options": [
        "show ip route rip",
        "show ip protocols",
        "show run | section timers",
        "show interface fastethernet 0/0"
      ],
      "answer": 1,
      "explanation": "The `show ip protocols` command is a vital verification tool that displays the active dynamic routing protocol, its timers, and the networks it is advertising."
    },
    {
      "id": "q16",
      "prompt": "What is the consequence of manually changing the basic RIP timers (e.g., `timers basic 5 15 20 30`) on only one router in a multi-router RIP topology?",
      "options": [
        "That router will dynamically force all other routers to adopt its timers.",
        "A massive network instability issue can occur due to mismatched update and expiration expectations.",
        "RIP will automatically revert the timers back to default after 240 seconds.",
        "The router will convert from RIPv2 back to RIPv1."
      ],
      "answer": 1,
      "explanation": "Timers should match on every router in the RIP topology. If one router updates every 30 seconds while another expects updates every 5 seconds, routes will constantly drop and flap."
    },
    {
      "id": "q17",
      "prompt": "Which classification correctly describes the EIGRP routing protocol?",
      "options": [
        "An Exterior Gateway Protocol (EGP) using distance-vector logic.",
        "A pure Link-State protocol using the Dijkstra algorithm.",
        "An Advanced Distance Vector (or Hybrid) protocol used as an IGP.",
        "A Classful Path Vector protocol."
      ],
      "answer": 2,
      "explanation": "EIGRP is classified as an Advanced Distance Vector (or hybrid) protocol because it combines the simplicity of distance-vector protocols with link-state features like triggered updates and bandwidth metrics."
    },
    {
      "id": "q18",
      "prompt": "In distance vector protocols like RIP, what is the term for deliberately advertising a newly failed route to neighbors with an infinite metric (16) to ensure they immediately remove it?",
      "options": [
        "LSA Flushing",
        "Route Poisoning",
        "Split Horizon",
        "Passive Interface"
      ],
      "answer": 1,
      "explanation": "Route poisoning is a loop-prevention mechanism where a failed route is immediately broadcasted with an unreachable metric (16 in RIP) to poison the route in neighbors' tables."
    },
    {
      "id": "q19",
      "prompt": "A router running RIP receives a routing update for network 192.168.100.0/24 with a hop count of 15. The router must forward this update to the next downstream neighbor. What hop count will the downstream neighbor receive?",
      "options": [
        "14",
        "15",
        "16 (Unreachable)",
        "0"
      ],
      "answer": 2,
      "explanation": "Every router increments the hop count by 1 before advertising it. Since 15 + 1 = 16, and 16 is the infinite/unreachable metric in RIP, the downstream neighbor will drop the route."
    },
    {
      "id": "q20",
      "prompt": "You configure `router rip`, `version 2`, and `network 10.0.0.0` on a router. You notice that routing updates are reaching some neighbors, but you want to stop the router from blindly broadcasting to legacy RIPv1 devices. How does RIPv2 naturally prevent this?",
      "options": [
        "By enforcing mandatory AES encryption on all packets.",
        "By encapsulating updates inside TCP segment headers.",
        "By using the multicast address 224.0.0.9 instead of the 255.255.255.255 broadcast address.",
        "By checking the Administrative Distance before transmitting."
      ],
      "answer": 2,
      "explanation": "RIPv2 inherently reduces unnecessary network noise by sending updates to the specific multicast address 224.0.0.9, ensuring only routers actively listening for RIPv2 process the packets."
    },
    {
      "id": "q21",
      "prompt": "If load balancing is generally enabled by default in dynamic routing protocols like RIP and OSPF, which major dynamic protocol is the explicit exception where load balancing is disabled by default?",
      "options": [
        "IS-IS",
        "EIGRP",
        "BGP",
        "IGRP"
      ],
      "answer": 2,
      "explanation": "As noted in the dynamic routing comparisons, BGP is the exception where equal-cost load balancing is disabled by default and must be explicitly configured."
    },
    {
      "id": "q22",
      "prompt": "A network engineer needs to summarize five consecutive /24 networks (10.10.10.0/24 through 10.10.14.0/24) into a single route to optimize the RIP routing table. What is this process called?",
      "options": [
        "Route Summarization",
        "Passive Interface Filtering",
        "Route Poisoning",
        "Equal-Cost Load Balancing"
      ],
      "answer": 0,
      "explanation": "Summarization is the process of condensing multiple specific routes (like several /24s) into a single larger route (like a /16 or /20) to optimize routing table size and memory."
    }
  ]
},
{
  "id": "eigrp-theory",
  "topicSlug": "routing",
  "group": "EIGRP Theory",
  "title": "EIGRP Theory Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "How is the EIGRP routing protocol classified in terms of its underlying algorithmic behavior?",
      "options": [
        "As a pure Distance-Vector protocol based entirely on hop count.",
        "As a pure Link-State protocol using the Shortest Path First algorithm.",
        "As an Advanced Distance-Vector (or Hybrid) routing protocol.",
        "As an Exterior Gateway Protocol used for internet routing."
      ],
      "answer": 2,
      "explanation": "EIGRP is considered an advanced distance-vector or hybrid protocol because it blends distance-vector concepts with link-state characteristics like bandwidth consideration and triggered updates."
    },
    {
      "id": "q2",
      "prompt": "Which algorithm does EIGRP use to calculate the best path to a destination network?",
      "options": [
        "Diffusing Update Algorithm (DUAL)",
        "Dijkstra's Algorithm",
        "Bellman-Ford Algorithm",
        "Spanning Tree Algorithm"
      ],
      "answer": 0,
      "explanation": "EIGRP uses the Diffusing Update Algorithm (DUAL) to determine best paths, identify backup paths, and guarantee a loop-free topology."
    },
    {
      "id": "q3",
      "prompt": "Unlike RIP, which uses UDP, how does EIGRP transport its routing updates across the network?",
      "options": [
        "It uses TCP port 179.",
        "It uses its own dedicated protocol, Protocol number 88.",
        "It uses ICMP echo requests and replies.",
        "It encapsulates its updates inside standard OSPF packets."
      ],
      "answer": 1,
      "explanation": "EIGRP does not rely on TCP or UDP; it operates using its own transport protocol, IP Protocol 88, alongside the Reliable Transport Protocol (RTP)."
    },
    {
      "id": "q4",
      "prompt": "What is the absolute maximum hop count limitation supported by EIGRP inside an autonomous system before a route is considered unreachable?",
      "options": [
        "15",
        "100",
        "128",
        "255"
      ],
      "answer": 3,
      "explanation": "While EIGRP defaults to a hop limit of 100, the protocol can support a maximum of 255 routers (hops) inside an autonomous system."
    },
    {
      "id": "q5",
      "prompt": "Which specific multicast IP address does EIGRP use to share hello packets and partial updates?",
      "options": [
        "224.0.0.10",
        "224.0.0.9",
        "224.0.0.5",
        "255.255.255.255"
      ],
      "answer": 0,
      "explanation": "EIGRP uses the reserved multicast address 224.0.0.10 to dynamically discover neighbors and share certain routing updates."
    },
    {
      "id": "q6",
      "prompt": "What is the default Administrative Distance (AD) assigned to an EIGRP Internal route?",
      "options": [
        "90",
        "110",
        "120",
        "170"
      ],
      "answer": 0,
      "explanation": "EIGRP Internal routes (routes originating inside the autonomous system) are highly trusted and are assigned an AD of 90."
    },
    {
      "id": "q7",
      "prompt": "When a route is redistributed into EIGRP from another routing protocol, how does it appear in the routing table and what is its default AD?",
      "options": [
        "As an Internal route (D) with an AD of 90.",
        "As an External route (EX) with an AD of 170.",
        "As a Summarized route (Summ) with an AD of 5.",
        "As an External route (E2) with an AD of 110."
      ],
      "answer": 1,
      "explanation": "Routes learned from outside the EIGRP autonomous system are marked as External (EX) and given a much higher AD of 170 to signify they are less trusted than internal routes."
    },
    {
      "id": "q8",
      "prompt": "Which type of EIGRP route is assigned a highly trusted Administrative Distance of 5?",
      "options": [
        "Directly connected routes",
        "Static floating routes",
        "External redistributed routes",
        "Summarized routes"
      ],
      "answer": 3,
      "explanation": "EIGRP supports 'any-point summarization' and assigns summarized routes an AD of 5 to ensure the router strongly prefers its own summary over routes learned from peers."
    },
    {
      "id": "q9",
      "prompt": "EIGRP uses an Autonomous System (AS) number to separate routing domains. What is the valid range for this AS number?",
      "options": [
        "1 to 15",
        "1 to 255",
        "1 to 65536",
        "0 to 4.2 billion"
      ],
      "answer": 2,
      "explanation": "The EIGRP AS number is a 16-bit identifier, meaning it can range from 1 to 65536. Neighboring routers must be configured with the exact same AS number to form an adjacency."
    },
    {
      "id": "q10",
      "prompt": "EIGRP maintains three separate tables. Which table contains both the best paths and all available backup paths for every network in the autonomous system?",
      "options": [
        "The Routing table",
        "The Topology table",
        "The Neighbourhood table",
        "The DUAL table"
      ],
      "answer": 1,
      "explanation": "The Topology table stores every learned route, including both the actively used best paths (Successors) and any pre-calculated backup paths (Feasible Successors)."
    },
    {
      "id": "q11",
      "prompt": "Which command should a network engineer use to verify the packet transmission rates and interface information between locally connected EIGRP peers?",
      "options": [
        "show ip eigrp neighbors",
        "show ip route eigrp",
        "show ip eigrp topology",
        "show ip protocols"
      ],
      "answer": 0,
      "explanation": "The `show ip eigrp neighbors` command displays the Neighbourhood table, detailing all established peer relationships and their connection statuses."
    },
    {
      "id": "q12",
      "prompt": "Although EIGRP can calculate metrics using five different 'K-values', which two are enabled and used by default?",
      "options": [
        "K2 (Load) and K4 (Reliability)",
        "K1 (Bandwidth) and K5 (MTU)",
        "K4 (Reliability) and K5 (MTU)",
        "K1 (Bandwidth) and K3 (Delay)"
      ],
      "answer": 3,
      "explanation": "By default, EIGRP simplifies its metric calculation by only utilizing K1 (Bandwidth) and K3 (Delay), leaving Load, Reliability, and MTU disabled (set to 0)."
    },
    {
      "id": "q13",
      "prompt": "If a network engineer wanted EIGRP to dynamically route traffic away from heavily congested links, which K-value (currently disabled by default) would represent the cumulative traffic load on an interface?",
      "options": [
        "K1",
        "K2",
        "K4",
        "K5"
      ],
      "answer": 1,
      "explanation": "K2 represents the Load parameter, an 8-bit value (0-255) indicating how much traffic an interface is currently handling."
    },
    {
      "id": "q14",
      "prompt": "In the standard default EIGRP metric equation, how is the Delay component mathematically factored?",
      "options": [
        "delay(ms) * 10",
        "delay(µs) * 256",
        "delay(µs) / 10",
        "delay(kbps) / 1000"
      ],
      "answer": 2,
      "explanation": "The formula divides the cumulative delay (in microseconds, µs) by 10 before incorporating it into the final metric calculation."
    },
    {
      "id": "q15",
      "prompt": "What terminology does EIGRP use to describe the absolute best, loop-free path to a destination network that gets installed into the routing table?",
      "options": [
        "Successor",
        "Feasible Successor",
        "Primary ASBR",
        "Designated Route"
      ],
      "answer": 0,
      "explanation": "The Successor is EIGRP's term for the path with the lowest calculated metric, which is actively used to forward traffic."
    },
    {
      "id": "q16",
      "prompt": "For an alternate route to be stored as a guaranteed loop-free backup (Feasible Successor), it must pass the Feasibility Condition. What is the mathematical rule for this condition?",
      "options": [
        "AD > FD",
        "FD = AD",
        "FD > AD",
        "FD < AD"
      ],
      "answer": 2,
      "explanation": "The Feasibility Condition dictates that the router's own Feasible Distance (FD) must be strictly greater than the neighbor's Advertised Distance (AD)."
    },
    {
      "id": "q17",
      "prompt": "When analyzing an EIGRP topology table, what exactly does the 'Advertised Distance' (AD) represent?",
      "options": [
        "The administrative preference of the EIGRP protocol (always 90).",
        "The metric value of a network as calculated and advertised by the neighbor.",
        "The router's own total calculated cost to reach the destination.",
        "The physical distance in kilometers of a single-mode fiber link."
      ],
      "answer": 1,
      "explanation": "The Advertised Distance (AD), also called the Reported Distance, is the metric strictly from the neighbor router's perspective to the destination network."
    },
    {
      "id": "q18",
      "prompt": "Which EIGRP packet type is transmitted periodically (by default every 5 seconds) to discover new peers and verify that existing peers are still alive?",
      "options": [
        "Update packet",
        "Query packet",
        "SIA Query packet",
        "Hello packet"
      ],
      "answer": 3,
      "explanation": "Hello packets are small keepalive messages exchanged constantly between routers to maintain their EIGRP neighborship."
    },
    {
      "id": "q19",
      "prompt": "If a router's primary Successor route fails and the Topology table contains no Feasible Successor, how does the router react?",
      "options": [
        "It silently drops the network and flushes it from the routing table.",
        "It sends an SIA Reply to terminate the process.",
        "It broadcasts a full routing table Update.",
        "It sends a Query packet to its neighbors asking for an alternate route."
      ],
      "answer": 3,
      "explanation": "When a route is lost with no backup available, the router places the route in an 'Active' state and multicasts a Query packet asking if any neighbor knows a path to the lost network."
    },
    {
      "id": "q20",
      "prompt": "If a router sends a Query packet but does not receive a Reply after 60 seconds, it does not instantly tear down the neighborship. What does it do instead?",
      "options": [
        "It drops its own Router-ID and forces an election.",
        "It sends an SIA (Stuck In Active) Query to check if the neighbor is still working on the request.",
        "It assumes the route is dead and transitions it directly to Passive state.",
        "It changes the K-values to artificially inflate the path metric."
      ],
      "answer": 1,
      "explanation": "Rather than killing the adjacency prematurely, EIGRP sends an SIA Query to ask the unresponsive neighbor, 'Are you still calculating my original query?'"
    },
    {
      "id": "q21",
      "prompt": "How many Stuck In Active (SIA) Query/Reply cycles will EIGRP tolerate before finally giving up and removing the queried route from the topology table?",
      "options": [
        "1 cycle (60 seconds)",
        "3 cycles (180 seconds)",
        "5 cycles (300 seconds)",
        "Unlimited cycles"
      ],
      "answer": 1,
      "explanation": "EIGRP will attempt this SIA follow-up 3 times (every 60 seconds). If 180 seconds pass without a resolution, the route is permanently removed."
    },
    {
      "id": "q22",
      "prompt": "In a healthy, fully converged EIGRP network where all best paths have been successfully calculated, what state should every route in the topology table be in?",
      "options": [
        "Passive state",
        "Active state",
        "SIA state",
        "Query state"
      ],
      "answer": 0,
      "explanation": "Passive state means the router has finished learning and calculating the path, and the route is stable and ready to forward traffic."
    },
    {
      "id": "q23",
      "prompt": "What does it indicate if an administrator notices a route is stuck in the 'Active' state within the EIGRP topology table?",
      "options": [
        "The route is functioning perfectly and actively forwarding heavy traffic.",
        "The router is currently processing an initial full routing update.",
        "The interface MTU has mismatched with a neighbor.",
        "The router has lost its best path and is actively searching the network for a replacement."
      ],
      "answer": 3,
      "explanation": "Active state is a learning phase. If a route stays in Active state, it means the router sent a Query for a lost route and is still waiting for Replies from its neighbors."
    },
    {
      "id": "q24",
      "prompt": "EIGRP relies on the Reliable Transport Protocol (RTP) to guarantee the delivery of critical routing information. Which of the following EIGRP packet types explicitly require an acknowledgment (ACK) to ensure reliable delivery?",
      "options": [
        "Hello packets and ACK packets",
        "Update, Query, and Reply packets",
        "Only SIA Query packets",
        "Only the initial full routing table Updates"
      ],
      "answer": 1,
      "explanation": "RTP ensures reliability by requiring acknowledgments for Updates, Queries, Replies, SIA-Queries, and SIA-Replies. Routine Hello packets and ACK packets themselves do not require acknowledgment."
    },
    {
      "id": "q25",
      "prompt": "A router has a Successor route with a Feasible Distance (FD) of 2000. A neighboring router advertises an alternate path with an Advertised Distance (AD) of exactly 2000. According to the DUAL algorithm, does this alternate path qualify as a Feasible Successor?",
      "options": [
        "Yes, because the AD is less than or equal to the FD.",
        "Yes, because EIGRP automatically load-balances equal-cost paths.",
        "No, because the Feasibility Condition requires the AD to be strictly less than the FD.",
        "No, because the AD must be strictly greater than the FD."
      ],
      "answer": 2,
      "explanation": "The Feasibility Condition uses strict inequality (FD > AD). If the neighbor's Advertised Distance is equal to the current FD, it fails the condition and is not mathematically guaranteed to be loop-free."
    }
  ]
},
{
  "id": "eigrp-setup",
  "topicSlug": "routing",
  "group": "EIGRP Setup",
  "title": "EIGRP Setup Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "What is the primary characteristic of a loopback interface on a Cisco router?",
      "options": [
        "A dedicated physical port used for out-of-band management.",
        "A virtual/logical interface that has no physical connection constraints.",
        "A specialized interface designed solely to forward EIGRP multicast packets.",
        "A hardware port used exclusively to connect to an ISP."
      ],
      "answer": 1,
      "explanation": "A loopback is a virtual interface created in software. Because it is virtual, no physical cables connect to it, making it immune to physical link failures."
    },
    {
      "id": "q2",
      "prompt": "Why is a `/32` subnet mask (255.255.255.255) most commonly used when assigning an IP address to a loopback interface?",
      "options": [
        "Because loopback interfaces natively require broadcast capabilities to function.",
        "Because EIGRP mandates a /32 mask for its Router-ID selection.",
        "Because a /32 mask allows the loopback to override standard routing tables.",
        "Because no user machines connect to a loopback, preventing the waste of usable host IP addresses."
      ],
      "answer": 3,
      "explanation": "A /32 mask specifies a network of exactly one host. Since a loopback doesn't physically connect to a LAN of users, there is no need to assign a larger subnet block."
    },
    {
      "id": "q3",
      "prompt": "Which sequence of commands correctly creates and configures a new loopback interface?",
      "options": [
        "interface virtual 0 -> ip address 1.1.1.1 255.255.255.255 -> no shutdown",
        "loopback 0 -> ip 1.1.1.1/32 -> no shutdown",
        "interface loopback 0 -> ip address 1.1.1.1 255.255.255.255 -> no shutdown",
        "interface lo0 -> ip address 1.1.1.1 mask 255.255.255.255 -> no shut"
      ],
      "answer": 2,
      "explanation": "You enter the interface using `interface loopback <number>`, then assign the IP address using standard `ip address <ip> <mask>` syntax."
    },
    {
      "id": "q4",
      "prompt": "In EIGRP, what is the format of the Router-ID used to uniquely identify a router inside the autonomous system?",
      "options": [
        "A 16-bit integer matching the AS number.",
        "A 48-bit hexadecimal MAC address.",
        "A dynamic string based on the router's hostname.",
        "A 32-bit value written in IPv4 address format."
      ],
      "answer": 3,
      "explanation": "The EIGRP Router-ID is a 32-bit value, meaning it is formatted identically to a standard IPv4 address (e.g., 1.1.1.1)."
    },
    {
      "id": "q5",
      "prompt": "If a network engineer does NOT manually configure an EIGRP Router-ID, what is the router's very first fallback method to select one?",
      "options": [
        "It uses the highest IP address configured on any active loopback interface.",
        "It uses the lowest IP address of any active physical interface.",
        "It randomly generates a unique 32-bit ID.",
        "It uses the MAC address of the FastEthernet 0/0 interface."
      ],
      "answer": 0,
      "explanation": "If no manual Router-ID is set, the router automatically selects the highest IP address assigned to a loopback interface."
    },
    {
      "id": "q6",
      "prompt": "A router is configured with physical interface IPs `192.168.1.1` and `10.0.0.1`. It also has loopback interfaces configured with IPs `2.2.2.2` and `3.3.3.3`. No manual EIGRP Router-ID is set. Which IP becomes the Router-ID?",
      "options": [
        "192.168.1.1",
        "10.0.0.1",
        "2.2.2.2",
        "3.3.3.3"
      ],
      "answer": 3,
      "explanation": "Loopbacks take priority over physical interfaces. Between the two loopbacks, the router selects the highest IP address, which is 3.3.3.3."
    },
    {
      "id": "q7",
      "prompt": "A router has no loopback interfaces configured. Its active physical interfaces are `172.16.1.1` and `192.168.100.1`. If EIGRP is enabled without a manual Router-ID, what will the Router-ID become?",
      "options": [
        "172.16.1.1",
        "192.168.100.1",
        "0.0.0.0",
        "255.255.255.255"
      ],
      "answer": 1,
      "explanation": "In the absence of a manual configuration or a loopback interface, the router falls back to the highest active physical interface IP, which is 192.168.100.1."
    },
    {
      "id": "q8",
      "prompt": "Which command configuration correctly sets the EIGRP Router-ID manually?",
      "options": [
        "router eigrp 100 -> router-id 1.1.1.1",
        "eigrp process 100 -> set router-id 1.1.1.1",
        "interface eigrp 100 -> id 1.1.1.1",
        "router eigrp 100 -> eigrp router-id 1.1.1.1"
      ],
      "answer": 3,
      "explanation": "Inside the EIGRP routing process configuration mode, the specific command to set the ID is `eigrp router-id <address>`."
    },
    {
      "id": "q9",
      "prompt": "For two EIGRP routers to successfully form a neighborship, which of the following statements about their configuration is strictly TRUE?",
      "options": [
        "They must belong to different Autonomous Systems.",
        "They must both be configured with the exact same Autonomous System (AS) number.",
        "They must use different K-values to prevent routing loops.",
        "They must have identical IP addresses on their connecting interfaces."
      ],
      "answer": 1,
      "explanation": "EIGRP routers will only form an adjacency if they are in the exact same Autonomous System (e.g., both configured with `router eigrp 100`)."
    },
    {
      "id": "q10",
      "prompt": "What happens if two directly connected routers running EIGRP are configured with different metric K-values?",
      "options": [
        "They will successfully form a neighborship and average their K-values.",
        "They will form a neighborship but disable dynamic metric calculation.",
        "They will refuse to form an EIGRP neighborship.",
        "They will form a neighborship but route traffic asymmetrically."
      ],
      "answer": 2,
      "explanation": "Matching K-values is a strict prerequisite for EIGRP neighborship. If they differ, the routers will continuously log errors and drop the adjacency."
    },
    {
      "id": "q11",
      "prompt": "Which command is most efficient to quickly verify if two neighboring EIGRP routers are using matching K-values?",
      "options": [
        "show ip eigrp neighbors",
        "show ip route",
        "show ip protocols",
        "test cable-diagnostics tdr"
      ],
      "answer": 2,
      "explanation": "`show ip protocols` displays detailed information about the active routing protocol, including the specific K-values currently in use by the router."
    },
    {
      "id": "q12",
      "prompt": "In EIGRP configuration, what is the practical effect of using the network statement `network 0.0.0.0`?",
      "options": [
        "It advertises a default route (gateway of last resort) to all EIGRP neighbors.",
        "It uses a wildcard match to automatically enable EIGRP on any interface using its own configured IP and mask.",
        "It resets the EIGRP Router-ID to 0.0.0.0.",
        "It disables EIGRP routing on all interfaces simultaneously."
      ],
      "answer": 1,
      "explanation": "Using `network 0.0.0.0` acts as a catch-all wildcard shortcut, instructing the router to enable EIGRP on all active interfaces based on their existing IP addresses."
    },
    {
      "id": "q13",
      "prompt": "When verifying EIGRP neighborship prerequisites, which command helps verify that a shared authentication password is configured correctly on the device?",
      "options": [
        "show ip eigrp traffic",
        "show ip protocols",
        "show run | section key chain",
        "show ip eigrp topology"
      ],
      "answer": 2,
      "explanation": "EIGRP passwords rely on key chains. Viewing the running configuration specifically for the `key chain` section will display the configured authentication strings."
    },
    {
      "id": "q14",
      "prompt": "Two routers are physically connected and configured for EIGRP, but the neighborship will not form. You suspect a Layer 1 cable issue. Which specific command from the notes can run a hardware diagnostic on the cable?",
      "options": [
        "test cable-diagnostics tdr interface f0/0",
        "show cable-status interface f0/0",
        "debug ip eigrp layer1",
        "ping 255.255.255.255 interface f0/0"
      ],
      "answer": 0,
      "explanation": "The Time Domain Reflectometer (TDR) test (`test cable-diagnostics tdr interface f0/0`) can diagnose physical layer issues like broken pairs or cable length problems."
    },
    {
      "id": "q15",
      "prompt": "Why are loopback interfaces often used to provide reachability to critical services, such as an NTP server in a multi-router topology?",
      "options": [
        "Because loopbacks automatically encrypt traffic using RSA.",
        "Because loopbacks have a default Administrative Distance of 0.",
        "Because a loopback never goes down due to a physical link failure, providing continuous redundancy.",
        "Because loopbacks bypass the EIGRP 255 hop-count limit."
      ],
      "answer": 2,
      "explanation": "Because a loopback is virtual, its status remains 'up' as long as the router is powered on. If one physical path to the router fails, dynamic routing can find an alternate path to the stable loopback IP."
    },
    {
      "id": "q16",
      "prompt": "If an administrator applies the command `network 192.168.1.0 255.255.255.0` under the EIGRP process, what is occurring?",
      "options": [
        "The router is setting the EIGRP Router-ID to 192.168.1.0.",
        "The router is configuring a static route into the EIGRP topology.",
        "The router is advertising a specific network using an explicit subnet mask.",
        "The router is filtering the 192.168.1.0 network using a wildcard mask."
      ],
      "answer": 2,
      "explanation": "This specific syntax explicitly tells EIGRP to enable the routing process for the exact network and subnet mask provided."
    },
    {
      "id": "q17",
      "prompt": "Which of the following is NOT an explicit requirement for two routers to form an EIGRP neighborship?",
      "options": [
        "They must use the exact same Router-ID.",
        "They must have proper Layer 1 connectivity (MTU, speed, duplex in order).",
        "They must be in the same subnet.",
        "They must have the same password (if authentication is configured)."
      ],
      "answer": 0,
      "explanation": "EIGRP routers must actually have *unique* Router-IDs. If the IDs are identical, it can cause routing anomalies or prevent the adjacency from forming correctly."
    },
    {
      "id": "q18",
      "prompt": "You want to verify that your router has been assigned the correct EIGRP AS number. Which verification command will clearly display the AS number the local router is using?",
      "options": [
        "show ip int brief",
        "show run interface f0/0",
        "test eigrp process",
        "show ip protocol"
      ],
      "answer": 3,
      "explanation": "The `show ip protocol` (or `protocols`) command gives a summary of the active routing protocol, specifically highlighting the configured AS number."
    },
    {
      "id": "q19",
      "prompt": "While OSPF strictly requires Hello and Dead timers to match between neighbors to form an adjacency, how does EIGRP handle mismatched Hello/Hold timers between peers?",
      "options": [
        "EIGRP will immediately shut down the affected interface.",
        "EIGRP will successfully form the neighborship, as EIGRP does not require timers to match.",
        "EIGRP will log a 'Timer Mismatch' error and refuse to form the neighborship.",
        "EIGRP will automatically negotiate the timers to the lowest common denominator."
      ],
      "answer": 1,
      "explanation": "Unlike OSPF, EIGRP does not require Hello and Hold-down timers to match between neighbors. The routers simply respect the hold-time instructed by their peer's Hello packet."
    },
    {
      "id": "q20",
      "prompt": "You configure two EIGRP routers but accidentally manipulate the metric weights so the K-values no longer match. Which specific log message will the Cisco IOS console generate continuously until it is fixed?",
      "options": [
        "%DUAL-5-NBRCHANGE: IP-EIGRP: Neighbor ... is down: K-value mismatch",
        "%EIGRP-3-MTU_MISMATCH",
        "%EIGRP-4-ROUTER_ID_DUP",
        "%OSPF-5-ADJCHG: Process 100, Nbr ... FULL to DOWN"
      ],
      "answer": 0,
      "explanation": "When K-values do not match, EIGRP immediately drops the adjacency and logs a clear `K-value mismatch` message to the console."
    },
    {
      "id": "q21",
      "prompt": "While configuring a large EIGRP network, an engineer accidentally configures the exact same manual EIGRP Router-ID on two different routers. What is a known negative consequence of duplicate EIGRP Router-IDs?",
      "options": [
        "The routers will automatically generate a new ID from their loopbacks to resolve the conflict.",
        "External (redistributed) routes advertised by one router will be dropped by the other as a loop prevention measure.",
        "The routers will immediately crash and reboot into ROMMON mode.",
        "The entire AS number will increment by 1."
      ],
      "answer": 1,
      "explanation": "EIGRP uses the Router-ID as a loop prevention mechanism for external routes. If a router receives an external route tagged with its own Router-ID, it assumes a loop and drops the route."
    },
    {
      "id": "q22",
      "prompt": "A router has a single physical interface (10.1.1.1) and a loopback interface (10.1.1.2). If you manually enter the command `eigrp router-id 1.1.1.1` under the EIGRP process, what will the router's active EIGRP Router-ID be?",
      "options": [
        "10.1.1.1",
        "10.1.1.2",
        "0.0.0.0",
        "1.1.1.1"
      ],
      "answer": 3,
      "explanation": "Manual configuration of the Router-ID overrides all automatic selection processes, regardless of what physical or loopback IP addresses exist on the device."
    }
  ]
},
{
  "id": "eigrp-tuning",
  "topicSlug": "routing",
  "group": "EIGRP Tuning",
  "title": "EIGRP Tuning Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "What is the default ratio between the EIGRP Hello Timer and the Hold-down Timer?",
      "options": [
        "1:2",
        "1:3",
        "1:4",
        "1:5"
      ],
      "answer": 1,
      "explanation": "EIGRP maintains a strict 1:3 ratio for its keepalive mechanisms. For every hello interval, the router waits three times that long before declaring a silent neighbor dead."
    },
    {
      "id": "q2",
      "prompt": "On standard network interfaces, what are the default values for the EIGRP Hello and Hold-down timers?",
      "options": [
        "Hello 10 seconds, Hold-down 40 seconds",
        "Hello 30 seconds, Hold-down 180 seconds",
        "Hello 5 seconds, Hold-down 15 seconds",
        "Hello 60 seconds, Hold-down 180 seconds"
      ],
      "answer": 2,
      "explanation": "By default, EIGRP sends Hello packets every 5 seconds and holds the neighbor active for 15 seconds without a response."
    },
    {
      "id": "q3",
      "prompt": "When a network engineer wants to change the EIGRP timers to speed up network convergence, where must these commands be applied?",
      "options": [
        "Under the global routing process (e.g., `router eigrp 100`).",
        "On the specific interface connecting to the neighbor (e.g., `interface f0/0`).",
        "Within the global configuration mode directly.",
        "Under the line vty configuration."
      ],
      "answer": 1,
      "explanation": "EIGRP timers are configured per-interface, allowing different links (like a fast LAN vs a slow WAN) to utilize different timer settings."
    },
    {
      "id": "q4",
      "prompt": "Which command correctly modifies the EIGRP hold-down timer to 6 seconds on an interface?",
      "options": [
        "eigrp hold-time 6",
        "ip hold-down eigrp 6",
        "ip eigrp hold-time 6",
        "timers basic 2 6"
      ],
      "answer": 2,
      "explanation": "The correct interface-level syntax is `ip eigrp hold-time <seconds>`."
    },
    {
      "id": "q5",
      "prompt": "Which configuration command restricts EIGRP from using more than 40% of an interface's configured bandwidth for its routing updates?",
      "options": [
        "bandwidth-limit eigrp 100 40",
        "ip bandwidth-percent eigrp 100 40",
        "eigrp traffic-share 40",
        "ip eigrp bandwidth 40"
      ],
      "answer": 1,
      "explanation": "The `ip bandwidth-percent eigrp <AS> <percent>` command allows administrators to cap how much interface bandwidth EIGRP control traffic can consume."
    },
    {
      "id": "q6",
      "prompt": "EIGRP can calculate metrics using up to five K-values, but which two are enabled by default?",
      "options": [
        "K1 (Bandwidth) and K3 (Delay)",
        "K2 (Load) and K4 (Reliability)",
        "K3 (Delay) and K5 (MTU)",
        "K1 (Bandwidth) and K2 (Load)"
      ],
      "answer": 0,
      "explanation": "By default, EIGRP simplifies path calculation by heavily weighing K1 (Bandwidth) and K3 (Delay), leaving Load, Reliability, and MTU disabled."
    },
    {
      "id": "q7",
      "prompt": "Which command syntax is used to manually alter the active K-values for an EIGRP autonomous system?",
      "options": [
        "k-values 0 1 0 1 0 1",
        "metric weights 0 1 0 1 0 1",
        "eigrp metric 0 1 0 1 0 1",
        "timers metric 0 1 0 1 0 1"
      ],
      "answer": 1,
      "explanation": "The `metric weights` command, followed by the Type of Service (usually 0) and the five K-values, is used to enable or disable specific metric parameters."
    },
    {
      "id": "q8",
      "prompt": "What is a strict rule when modifying EIGRP K-values in a live network?",
      "options": [
        "They must only be modified on the Designated Router (DR).",
        "They require an immediate device reboot to take effect.",
        "They must be configured identically on every router in the autonomous system.",
        "They cannot be modified once the router has established an adjacency."
      ],
      "answer": 2,
      "explanation": "Matching K-values is a strict EIGRP neighborship condition. If K-values differ between two routers, they will instantly drop their adjacency."
    },
    {
      "id": "q9",
      "prompt": "What is the recommended, safest method for an administrator to manually manipulate EIGRP path selection?",
      "options": [
        "Changing the MTU on the interface.",
        "Changing the administrative distance of the protocol.",
        "Changing the MAC address of the interface.",
        "Changing the delay value on an interface."
      ],
      "answer": 3,
      "explanation": "Manipulating the interface delay directly affects the EIGRP metric calculation without disrupting other network functions, allowing admins to steer traffic away from or toward specific links."
    },
    {
      "id": "q10",
      "prompt": "If a network engineer artificially increases the `delay` on a specific router interface, how does this affect EIGRP's path calculation?",
      "options": [
        "It lowers the metric, making the path more preferred.",
        "It increases the metric, making the path less preferred (acting as a backup).",
        "It forces EIGRP to immediately enter the Stuck-in-Active (SIA) state.",
        "It disables equal-cost load balancing for that link."
      ],
      "answer": 1,
      "explanation": "In EIGRP, a higher metric is worse. Increasing the delay mathematically inflates the route's total metric, pushing EIGRP to prefer alternate routes."
    },
    {
      "id": "q11",
      "prompt": "By default, how many equal-cost paths will EIGRP load-balance traffic across if multiple identical metrics exist to the same destination?",
      "options": [
        "1",
        "2",
        "4",
        "16"
      ],
      "answer": 2,
      "explanation": "EIGRP load-balances across a maximum of 4 equal-cost paths by default."
    },
    {
      "id": "q12",
      "prompt": "What is the absolute maximum number of paths EIGRP can be configured to load-balance across?",
      "options": [
        "4",
        "8",
        "16",
        "32"
      ],
      "answer": 2,
      "explanation": "Using the `maximum-paths` command, an administrator can configure EIGRP to load-balance across up to 16 equal or unequal paths."
    },
    {
      "id": "q13",
      "prompt": "Which command completely disables EIGRP load balancing, forcing the router to use only a single best path?",
      "options": [
        "no load-balance",
        "variance 0",
        "maximum-paths 1",
        "disable equal-cost"
      ],
      "answer": 2,
      "explanation": "Setting `maximum-paths 1` restricts the routing table to installing only a single path per destination network, effectively disabling load balancing."
    },
    {
      "id": "q14",
      "prompt": "What does 'Unequal-cost load balancing' accomplish in an EIGRP network?",
      "options": [
        "It balances traffic between EIGRP and OSPF routes simultaneously.",
        "It allows EIGRP to spread traffic across both the best paths and slightly worse backup paths.",
        "It routes traffic based on packet size rather than path metric.",
        "It balances bandwidth dynamically based on active TCP connections."
      ],
      "answer": 1,
      "explanation": "Unequal-cost load balancing allows EIGRP to actively utilize backup paths (Feasible Successors) alongside the primary best path, spreading traffic proportionally based on their metrics."
    },
    {
      "id": "q15",
      "prompt": "How is unequal-cost load balancing activated in EIGRP?",
      "options": [
        "By enabling K2 (Load) in the metric weights.",
        "By configuring a secondary IP address on the interface.",
        "By changing the variance multiplier from its default of 1.",
        "By issuing the `load-balance unequal` command under the routing process."
      ],
      "answer": 2,
      "explanation": "Unequal-cost load balancing is disabled by default because the `variance` is 1. Changing the variance to 2 or higher instructs the router to include backup paths that fall within that multiplier."
    },
    {
      "id": "q16",
      "prompt": "An EIGRP router has a best path to a network with a Feasible Distance (FD) of 2000. If the administrator configures `variance 3`, what is the maximum metric a backup path can have to qualify for load balancing?",
      "options": [
        "2003",
        "3000",
        "6000",
        "8000"
      ],
      "answer": 2,
      "explanation": "The formula dictates that a backup path qualifies if its metric is ≤ (Variance × FD). 3 × 2000 = 6000."
    },
    {
      "id": "q17",
      "prompt": "When a backup path successfully qualifies for unequal-cost load balancing via the variance command, what notable change occurs within the router's tables?",
      "options": [
        "The backup path is removed from the Topology table to save memory.",
        "The backup path is installed into the active Routing table alongside the best path.",
        "The backup path is promoted to a primary Successor.",
        "The backup path's metric is mathematically reduced to match the primary path."
      ],
      "answer": 1,
      "explanation": "Normally, backup paths only live in the Topology table. When variance enables unequal-cost load balancing, those qualifying backup paths are elevated into the active Routing table."
    },
    {
      "id": "q18",
      "prompt": "Which troubleshooting command displays a live stream of EIGRP neighbor events, such as adjacencies forming or dropping?",
      "options": [
        "debug ip eigrp neighbors",
        "show ip eigrp traffic",
        "trace ip eigrp adjacency",
        "monitor eigrp peers"
      ],
      "answer": 0,
      "explanation": "`debug ip eigrp neighbors` provides real-time console logs whenever a neighbor adjacency state changes, which is vital for troubleshooting unstable links."
    },
    {
      "id": "q19",
      "prompt": "After finishing a troubleshooting session with active debugs running, which command ensures all live logging to the console stops immediately?",
      "options": [
        "stop debug",
        "no logging console",
        "undebug all",
        "clear ip eigrp events"
      ],
      "answer": 2,
      "explanation": "`undebug all` (or `u all`) is the universal command to instantly stop all active debug processes, preventing the router's CPU from being overwhelmed by log generation."
    },
    {
      "id": "q20",
      "prompt": "According to the EIGRP interface bandwidth formula (`10^7 / bandwidth in kbps`), what is the resulting base bandwidth calculation for a Fast Ethernet (100 Mbps) interface?",
      "options": [
        "1",
        "10",
        "100",
        "1000"
      ],
      "answer": 2,
      "explanation": "100 Mbps equals 100,000 kbps. Therefore, 10,000,000 divided by 100,000 yields a base bandwidth result of 100."
    },
    {
      "id": "q21",
      "prompt": "Why is it highly recommended to use the `delay` command rather than the `bandwidth` command to manipulate EIGRP routing paths?",
      "options": [
        "Because the bandwidth command requires a router reboot to take effect.",
        "Because EIGRP ignores manual bandwidth statements entirely.",
        "Because altering bandwidth can inadvertently negatively impact QoS policies and other routing protocols like OSPF.",
        "Because delay calculations happen at Layer 2, which is faster for the ASIC to process."
      ],
      "answer": 2,
      "explanation": "Many other router features, such as Quality of Service (QoS) queues and OSPF metric calculations, rely on the configured interface bandwidth. Changing delay safely affects only EIGRP metric calculations."
    },
    {
      "id": "q22",
      "prompt": "You configure `ip bandwidth-percent eigrp 100 25` on a very slow 64 kbps serial WAN link. What exactly does this configuration achieve?",
      "options": [
        "It caps all physical user traffic on the link to 25% to reserve bandwidth for routing updates.",
        "It restricts EIGRP's own routing protocol control traffic (updates, queries) to a maximum of 25% of the link capacity.",
        "It reserves a guaranteed 25 kbps specifically for EIGRP Hello packets.",
        "It drops EIGRP packets if the CPU utilization exceeds 25%."
      ],
      "answer": 1,
      "explanation": "By default, EIGRP can use up to 50% of a link's bandwidth for its own protocol traffic. This command strictly limits EIGRP control traffic so it does not choke a slow WAN connection."
    },
    {
      "id": "q23",
      "prompt": "An EIGRP router has a best path with an FD of 1000. A secondary backup path exists with an Advertised Distance (AD) of 1500 and an FD of 2500. If `variance 3` is applied, will this secondary path be installed for load balancing?",
      "options": [
        "Yes, because its metric (2500) is less than the variance maximum (3000).",
        "Yes, because variance automatically overrides the feasibility condition.",
        "No, because its Advertised Distance (1500) is greater than the best path's FD (1000), failing the Feasibility Condition.",
        "No, because unequal-cost load balancing only supports a maximum variance of 2."
      ],
      "answer": 2,
      "explanation": "Variance only applies to paths that are already loop-free Feasible Successors. Since the secondary path's AD (1500) is greater than the current best path's FD (1000), it fails the Feasibility Condition and cannot be used for load balancing, regardless of the variance multiplier."
    }
  ]
},
{
  "id": "ospf-theory",
  "topicSlug": "routing",
  "group": "OSPF Theory",
  "title": "OSPF Theory Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "Which of the following best describes the Open Shortest Path First (OSPF) routing protocol?",
      "options": [
        "A proprietary distance-vector protocol using hop count.",
        "An open-standard link-state protocol using bandwidth to calculate cost.",
        "An Exterior Gateway Protocol (EGP) used for routing between autonomous systems.",
        "A hybrid protocol utilizing the DUAL algorithm."
      ],
      "answer": 1,
      "explanation": "OSPF is an open-standard link-state Interior Gateway Protocol (IGP) developed by the IETF that uses interface bandwidth to calculate its routing metric, known as 'cost'."
    },
    {
      "id": "q2",
      "prompt": "What is the primary reason network engineers must often change the default OSPF reference bandwidth in modern networks?",
      "options": [
        "To prevent OSPF from sending updates over slow serial links.",
        "To allow OSPFv2 to support IPv6 addressing.",
        "Because FastEthernet (100 Mbps) and GigabitEthernet (1 Gbps) both result in a default cost of 1, distorting path calculation.",
        "Because the default reference bandwidth restricts the network to a maximum of 50 routers per area."
      ],
      "answer": 2,
      "explanation": "OSPF cost cannot be a fraction. With the default reference bandwidth of 100 Mbps, a 1 Gbps link calculates to 0.1, which rounds up to 1—making it mathematically identical to a 100 Mbps link. Raising the reference bandwidth fixes this."
    },
    {
      "id": "q3",
      "prompt": "If a network engineer configures `auto-cost reference-bandwidth 1000` on an OSPF router, what will be the calculated OSPF cost for a FastEthernet (100 Mbps) interface?",
      "options": [
        "1",
        "10",
        "100",
        "1000"
      ],
      "answer": 1,
      "explanation": "The formula is Reference Bandwidth / Interface Bandwidth. 1000 Mbps / 100 Mbps = an OSPF cost of 10."
    },
    {
      "id": "q4",
      "prompt": "How does an OSPF Process ID fundamentally differ from an EIGRP Autonomous System (AS) number?",
      "options": [
        "The OSPF Process ID is a 32-bit value, while EIGRP uses 16-bit values.",
        "The OSPF Process ID must match exactly between neighbors, whereas EIGRP AS numbers do not.",
        "The OSPF Process ID is only locally significant to the router and does not need to match between neighbors.",
        "The OSPF Process ID is used as the tiebreaker in DR/BDR elections."
      ],
      "answer": 2,
      "explanation": "Unlike EIGRP AS numbers, which are strictly verified in hello packets, the OSPF Process ID is locally significant. Two routers with different Process IDs can successfully form an adjacency."
    },
    {
      "id": "q5",
      "prompt": "In a multi-area OSPF design, what is the strict architectural requirement regarding Area 0?",
      "options": [
        "It must only contain ASBRs performing redistribution.",
        "Every other standard area must connect directly to Area 0 for inter-area communication to function.",
        "It must be configured as a Totally Stubby Area to save memory.",
        "It must only use GigabitEthernet or faster physical interfaces."
      ],
      "answer": 1,
      "explanation": "Area 0 is the mandatory backbone area. All non-backbone areas must physically or logically (via virtual links) attach to Area 0 to exchange routing information."
    },
    {
      "id": "q6",
      "prompt": "What is the primary function of OSPF Database Descriptor (DBD) packets?",
      "options": [
        "To periodically broadcast the entire routing table every 30 seconds.",
        "To request specific missing LSAs from a neighbor.",
        "To acknowledge the successful receipt of a Link-State Update.",
        "To provide a summarized view of the router's Link-State Database (LSDB) so neighbors can compare topologies."
      ],
      "answer": 3,
      "explanation": "During the Exchange state, routers swap DBD packets, which act as a 'table of contents' for their LSDBs, allowing them to determine if they need to request newer information."
    },
    {
      "id": "q7",
      "prompt": "If two connected OSPF routers are configured with mismatched interface MTU sizes, at which adjacency state will they typically become stuck?",
      "options": [
        "Init",
        "Two-Way",
        "ExStart",
        "Loading"
      ],
      "answer": 2,
      "explanation": "During the ExStart state, routers negotiate the master/slave relationship and verify MTU sizes. An MTU mismatch prevents the DBD exchange, leaving the routers stuck in ExStart."
    },
    {
      "id": "q8",
      "prompt": "During which OSPF adjacency state is the Designated Router (DR) and Backup Designated Router (BDR) election performed on a broadcast network?",
      "options": [
        "Init",
        "Two-Way",
        "Exchange",
        "Full"
      ],
      "answer": 1,
      "explanation": "The Two-Way state indicates bidirectional communication has been established. This is the minimum state required, and the exact phase, where the DR/BDR election occurs."
    },
    {
      "id": "q9",
      "prompt": "Which OSPF LSA Type is generated exclusively by an Area Border Router (ABR) to advertise networks from one area into another?",
      "options": [
        "Type 1 (Router LSA)",
        "Type 2 (Network LSA)",
        "Type 3 (Summary LSA)",
        "Type 5 (External LSA)"
      ],
      "answer": 2,
      "explanation": "A Type 3 Summary LSA is generated by an ABR to represent inter-area routes, allowing routers in one area to know about subnets in another area without knowing their exact topology."
    },
    {
      "id": "q10",
      "prompt": "An external route is redistributed into OSPF. By default, it appears in the routing table as an 'E2' route. What is the defining characteristic of an OSPF E2 route?",
      "options": [
        "It includes both the external cost and the internal OSPF cost to reach the ASBR.",
        "It carries only the external metric, ignoring the internal cost to reach the ASBR.",
        "It is only propagated inside NSSA stub areas.",
        "It automatically overrides any directly connected routes."
      ],
      "answer": 1,
      "explanation": "By default, external routes are Type 2 (E2), meaning their metric stays constant throughout the OSPF domain and does not increment to reflect internal link costs. (E1 routes do add internal cost)."
    },
    {
      "id": "q11",
      "prompt": "If you want to configure OSPF using the network statement `network 10.1.1.0 <wildcard> area 0` for a `/30` point-to-point link, which wildcard mask should you use?",
      "options": [
        "0.0.0.3",
        "0.0.0.15",
        "0.0.0.63",
        "0.0.0.252"
      ],
      "answer": 0,
      "explanation": "A `/30` subnet mask is 255.255.255.252. Subtracting this from 255.255.255.255 yields a wildcard mask of 0.0.0.3."
    },
    {
      "id": "q12",
      "prompt": "Which of the following is NOT a required parameter that must match exactly for two routers to form an OSPF neighborship?",
      "options": [
        "OSPF Area ID",
        "Hello and Dead Timers",
        "OSPF Process ID",
        "Subnet Mask (Same Network)"
      ],
      "answer": 2,
      "explanation": "The OSPF Process ID is locally significant to the router itself. Neighbors must agree on Area, Subnet, Timers, MTU, Authentication, and Stub flags, but their Process IDs can differ."
    },
    {
      "id": "q13",
      "prompt": "What is the exact behavior of an interface when it is configured as an OSPF `passive-interface`?",
      "options": [
        "It stops advertising its connected network into the OSPF domain entirely.",
        "It listens for incoming Hello packets but stops sending its own.",
        "It stops sending and receiving Hello packets, preventing adjacencies, but still advertises its subnet into OSPF.",
        "It only forms adjacencies if the connecting device is an end-user PC."
      ],
      "answer": 2,
      "explanation": "A passive interface suppresses OSPF Hello packets, meaning no neighborships can form on that link. However, the router still advertises that interface's network into the OSPF topology."
    },
    {
      "id": "q14",
      "prompt": "You are configuring a Virtual Link to connect Area 51 through Area 11 back to Area 0. On which routers must the Virtual Link be configured?",
      "options": [
        "Only on the ABR attached to Area 51.",
        "Only on the DR of the transit area.",
        "On both ABRs at opposite ends of the transit Area 11.",
        "On every router inside Area 11."
      ],
      "answer": 2,
      "explanation": "Virtual links must be configured bidirectionally. Both ABRs spanning the transit area must be configured to point to the other's Router-ID."
    },
    {
      "id": "q15",
      "prompt": "In a standard OSPF Stub Area, which Link-State Advertisements (LSAs) are explicitly blocked from entering by the ABR?",
      "options": [
        "LSA 1 and LSA 2",
        "LSA 3 and LSA 4",
        "LSA 4 and LSA 5",
        "LSA 5 and LSA 7"
      ],
      "answer": 2,
      "explanation": "A standard Stub Area blocks external routes, specifically LSA Type 4 (ASBR Summary) and LSA Type 5 (External). It allows LSA 3 (Inter-area) routes and injects a default route."
    },
    {
      "id": "q16",
      "prompt": "How does a 'Total Stub' area differ from a standard 'Stub' area in OSPF?",
      "options": [
        "A Total Stub area allows LSA 5 external routes to be redistributed into it.",
        "A Total Stub area requires a Virtual Link to function.",
        "A Total Stub area blocks LSA 3 (Inter-area routes) in addition to LSA 4 and LSA 5.",
        "A Total Stub area uses LSA 7 instead of a default route."
      ],
      "answer": 2,
      "explanation": "Configured with the `no-summary` keyword on the ABR, a Total Stub area blocks LSA 3, 4, and 5, leaving only intra-area routes and a single default route, saving maximum memory."
    },
    {
      "id": "q17",
      "prompt": "Why was the Not-So-Stubby Area (NSSA) concept introduced into OSPF?",
      "options": [
        "To allow stub areas to be used as transit areas for virtual links.",
        "To allow an ASBR to exist inside a stub-like area by converting external routes (LSA 5) into a special LSA 7.",
        "To disable the DR/BDR election process on slow WAN links.",
        "To automatically summarize all intra-area routes into a single /16 prefix."
      ],
      "answer": 1,
      "explanation": "Standard stub areas block LSA 5, meaning you cannot place an ASBR inside one. NSSA allows an ASBR to inject external routes as LSA 7, which the ABR later translates back into LSA 5 for the rest of the network."
    },
    {
      "id": "q18",
      "prompt": "What is the correct default ratio between the OSPF Hello Timer and Dead Timer?",
      "options": [
        "1:2",
        "1:3",
        "1:4",
        "1:5"
      ],
      "answer": 2,
      "explanation": "OSPF maintains a 1:4 ratio. By default on broadcast networks, Hellos are sent every 10 seconds, and the Dead timer is 40 seconds."
    },
    {
      "id": "q19",
      "prompt": "When two OSPF routers connect over a point-to-point interface, what unique behavior occurs during the adjacency progression?",
      "options": [
        "They skip the ExStart and Exchange states entirely.",
        "They skip the DR/BDR election and proceed directly to ExStart from Two-Way.",
        "They require a manual Router-ID to progress past the Init state.",
        "They automatically adjust their Hello timers to 30 seconds."
      ],
      "answer": 1,
      "explanation": "Because there are only two routers on a point-to-point link, there is no need to elect a Designated Router. They bypass the election and transition straight to master/slave negotiation in ExStart."
    },
    {
      "id": "q20",
      "prompt": "Which OSPF state signifies that two routers have successfully exchanged all missing Link-State Advertisements and now possess completely identical LSDBs?",
      "options": [
        "Two-Way",
        "Exchange",
        "Loading",
        "Full"
      ],
      "answer": 3,
      "explanation": "The Full state indicates that OSPF has completely converged on that link, and the routers have perfectly synchronized Link-State Databases."
    },
    {
      "id": "q21",
      "prompt": "A network engineer issues the command `network 192.168.1.50 0.0.0.0 area 0` inside the OSPF process. What is the specific effect of using an all-zero wildcard mask?",
      "options": [
        "It advertises a default route to the entire OSPF domain.",
        "It disables OSPF on all interfaces matching the 192.168.1.0/24 subnet.",
        "It acts as a host match, explicitly enabling OSPF only on the single interface configured with the IP address 192.168.1.50.",
        "It forces the router to perform auto-summarization at the ABR."
      ],
      "answer": 2,
      "explanation": "A wildcard mask of 0.0.0.0 means 'match every bit exactly'. This tells OSPF to enable the routing process exclusively on the interface holding that exact IP address, regardless of its actual subnet mask."
    },
    {
      "id": "q22",
      "prompt": "An administrator attempts to configure an OSPF Virtual Link, but the configuration is rejected. The transit area specified in the command is Area 20, which was previously configured with the `area 20 stub` command. Why did this fail?",
      "options": [
        "Virtual Links require an IPsec tunnel when crossing a stub area.",
        "OSPF design rules strictly dictate that a transit area cannot be configured as a stub area.",
        "The ABR must have a loopback interface configured before crossing a stub area.",
        "Virtual Links can only transit Area 0."
      ],
      "answer": 1,
      "explanation": "A fundamental rule of OSPF is that transit areas used for Virtual Links cannot be stub, total stub, or NSSA areas. They must be standard areas capable of carrying Type 5 LSAs."
    },
    {
      "id": "q23",
      "prompt": "A router sends an OSPF Hello packet to a neighbor. The neighbor receives it and transitions the connection to the 'Init' state. What specific condition must be met for the neighbor to transition the adjacency to the 'Two-Way' state?",
      "options": [
        "The neighbor must receive an LSAck packet verifying the Hello.",
        "The neighbor must verify that the MTU matches.",
        "The neighbor must see its own Router-ID listed in the incoming Hello packet.",
        "The neighbor must win the DR election."
      ],
      "answer": 2,
      "explanation": "The 'Init' state means a Hello was received, but bidirectional communication is not confirmed. Once a router sees its own Router-ID in a neighbor's Hello packet, it knows the neighbor can hear it, and transitions to 'Two-Way'."
    }
  ]
},
{
  "id": "ospf-operation",
  "topicSlug": "routing",
  "group": "OSPF Operation",
  "title": "OSPF Operation Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "If an OSPF Router-ID is not manually configured, what is the router's first fallback mechanism for selecting one?",
      "options": [
        "It uses the lowest IP address of any active physical interface.",
        "It uses the highest IP address configured on any loopback interface.",
        "It randomly generates a 32-bit ID.",
        "It uses the highest MAC address of its active physical interfaces."
      ],
      "answer": 1,
      "explanation": "If no manual Router-ID is specified, OSPF automatically selects the highest IP address assigned to a loopback interface. If no loopbacks exist, it falls back to the highest active physical interface IP."
    },
    {
      "id": "q2",
      "prompt": "A router has active physical interfaces at `192.168.100.1` and `10.1.1.1`, and a loopback interface at `2.2.2.2`. If OSPF is enabled without a manual Router-ID, what will the Router-ID become?",
      "options": [
        "2.2.2.2",
        "10.1.1.1",
        "192.168.100.1",
        "0.0.0.0"
      ],
      "answer": 0,
      "explanation": "Loopback interfaces always take priority over physical interfaces in OSPF automatic Router-ID selection, regardless of whether the physical IP address is numerically higher."
    },
    {
      "id": "q3",
      "prompt": "You manually configure the Router-ID using `router-id 1.1.1.1` on an active OSPF router that already established a Router-ID automatically. What additional step must you take for the new Router-ID to take effect?",
      "options": [
        "Execute the `clear ip ospf process` command in Privilege mode.",
        "Save the configuration using `write`.",
        "Shut down and bring back up all physical interfaces.",
        "Issue the `restart ospf routing` command."
      ],
      "answer": 0,
      "explanation": "The Router-ID election happens once and is non-preemptive. A new manual Router-ID will not take effect until the OSPF process is explicitly restarted using the `clear ip ospf process` command."
    },
    {
      "id": "q4",
      "prompt": "In OSPF terminology, what is the specific role of an Area Border Router (ABR)?",
      "options": [
        "It connects two completely different autonomous systems together.",
        "It connects a standard OSPF area to the Area 0 backbone.",
        "It performs the DR/BDR election on a broadcast segment.",
        "It acts as a gateway of last resort for stub areas."
      ],
      "answer": 1,
      "explanation": "An ABR (Area Border Router) is a router that has interfaces in multiple areas, functioning specifically to connect standard OSPF areas back to the Area 0 backbone."
    },
    {
      "id": "q5",
      "prompt": "Which type of OSPF router is responsible for connecting the OSPF domain to an external routing domain (such as EIGRP or the internet) and handling route redistribution?",
      "options": [
        "ABR (Area Border Router)",
        "DR (Designated Router)",
        "ASBR (Autonomous System Border Router)",
        "BDR (Backup Designated Router)"
      ],
      "answer": 2,
      "explanation": "An ASBR sits at the boundary of the OSPF autonomous system and a different routing domain, making it the router where redistribution configuration takes place."
    },
    {
      "id": "q6",
      "prompt": "Why does OSPF elect a Designated Router (DR) and Backup Designated Router (BDR) on Broadcast Multi-Access (BMA) networks like Ethernet?",
      "options": [
        "To provide a backup default gateway for PC clients.",
        "To encrypt OSPF updates across the local network.",
        "To enforce the split-horizon rule on the LAN.",
        "To prevent massive LSA flooding caused by every router forming a full mesh adjacency."
      ],
      "answer": 3,
      "explanation": "On a broadcast segment, a full mesh of adjacencies creates excessive LSA flooding. OSPF solves this by electing a DR and BDR; all other routers (DROthers) only form full adjacencies with those two."
    },
    {
      "id": "q7",
      "prompt": "When a DROther router needs to send a routing update, which multicast address does it use to ensure only the DR and BDR process the packet?",
      "options": [
        "224.0.0.5",
        "224.0.0.6",
        "224.0.0.9",
        "224.0.0.10"
      ],
      "answer": 1,
      "explanation": "DROther routers send their updates to the multicast address 224.0.0.6, which is explicitly listened to only by the Designated Router (DR) and Backup Designated Router (BDR)."
    },
    {
      "id": "q8",
      "prompt": "After receiving an update from a DROther, which multicast address does the Designated Router (DR) use to flood that update to the rest of the routers on the segment?",
      "options": [
        "224.0.0.5",
        "224.0.0.6",
        "224.0.0.9",
        "224.0.0.10"
      ],
      "answer": 0,
      "explanation": "The DR forwards updates back out to all other OSPF routers on the segment using the 'All OSPF Routers' multicast address, 224.0.0.5."
    },
    {
      "id": "q9",
      "prompt": "What is the primary criteria OSPF uses to elect the DR and BDR on a broadcast segment?",
      "options": [
        "The highest active loopback IP address.",
        "The lowest configured Router-ID.",
        "The highest OSPF interface priority.",
        "The highest interface bandwidth."
      ],
      "answer": 2,
      "explanation": "The very first criteria evaluated in a DR/BDR election is the OSPF interface priority (0-255). The router with the highest priority wins."
    },
    {
      "id": "q10",
      "prompt": "If multiple routers on an Ethernet segment are left with the default OSPF priority of 1, how does OSPF break the tie to elect the DR?",
      "options": [
        "The router with the highest Router-ID wins.",
        "The router with the lowest Router-ID wins.",
        "The router that booted up first automatically wins.",
        "The router with the highest MAC address wins."
      ],
      "answer": 0,
      "explanation": "If priorities tie (which is common, since the default is 1), OSPF uses the highest Router-ID as the tiebreaker to elect the DR."
    },
    {
      "id": "q11",
      "prompt": "You want to ensure that a low-end branch router never becomes the Designated Router on a shared LAN segment. Which interface configuration command accomplishes this?",
      "options": [
        "ip ospf priority 0",
        "ip ospf dr-disable",
        "ip ospf priority 255",
        "ospf election participate false"
      ],
      "answer": 0,
      "explanation": "Setting the OSPF priority to 0 completely removes a router from participating in the DR/BDR election, ensuring it will permanently remain a DROther."
    },
    {
      "id": "q12",
      "prompt": "What happens if a new router boots up on an OSPF broadcast segment with a priority of 255, but a DR and BDR have already been elected?",
      "options": [
        "The new router immediately preempts the current DR and takes over.",
        "The new router becomes the BDR, and the old BDR is demoted.",
        "The new router forces the segment to restart the OSPF process.",
        "The election is non-preemptive; the new router becomes a DROther until the DR or BDR fails."
      ],
      "answer": 3,
      "explanation": "OSPF DR/BDR elections are non-preemptive. Once a DR and BDR are established, a new router will not overthrow them, even if it has a vastly superior priority or Router-ID."
    },
    {
      "id": "q13",
      "prompt": "According to OSPF operation rules, which role is actually elected first on a broadcast multi-access network?",
      "options": [
        "The Designated Router (DR)",
        "The Backup Designated Router (BDR)",
        "The Area Border Router (ABR)",
        "The DROther"
      ],
      "answer": 1,
      "explanation": "During the election process, OSPF actually elects the Backup Designated Router (BDR) first, and then promotes a router to the Designated Router (DR) role."
    },
    {
      "id": "q14",
      "prompt": "If you execute `show ip ospf neighbor` and see a neighbor state of `FULL/DROTHER`, what does this indicate about the relationship?",
      "options": [
        "The local router is a DROther, but the neighbor is the DR.",
        "The neighbor is a DROther, and it has successfully formed a complete adjacency with the local router (which is likely a DR or BDR).",
        "The adjacency has failed and dropped to the Two-Way state.",
        "The network is a point-to-point link with no DR election."
      ],
      "answer": 1,
      "explanation": "The output describes the neighbor's role (DROTHER) and the state of the adjacency (FULL). A DROther only reaches FULL state with a DR or BDR."
    },
    {
      "id": "q15",
      "prompt": "What is the expected maximum OSPF adjacency state between two DROther routers on the same broadcast segment?",
      "options": [
        "Init",
        "ExStart",
        "Two-Way",
        "Full"
      ],
      "answer": 2,
      "explanation": "Two DROthers do not exchange full routing databases directly with each other. They stop progressing at the 'Two-Way' state, which is perfectly normal and expected."
    },
    {
      "id": "q16",
      "prompt": "You are troubleshooting an OSPF link connecting two routers via a direct serial cable. When you check the neighbor table, you see the state listed as `FULL/ -`. What does the hyphen (`-`) signify?",
      "options": [
        "The neighbor's Router-ID is currently missing.",
        "The OSPF process is currently stuck in the Loading phase.",
        "The link is a point-to-point network, so no DR/BDR election occurred.",
        "The neighbor has been configured with an OSPF priority of 0."
      ],
      "answer": 2,
      "explanation": "On point-to-point networks, there is no LSA flooding problem because there are only two routers. Therefore, OSPF skips the DR/BDR election entirely, leaving the role blank (`-`)."
    },
    {
      "id": "q17",
      "prompt": "Which of the following routing protocols explicitly utilizes the 'split-horizon' rule to prevent routing loops on a Broadcast Multi-Access (BMA) network, whereas OSPF does not?",
      "options": [
        "BGP and IS-IS",
        "EIGRP and RIP",
        "Static Routing and OSPFv3",
        "Only Link-State protocols"
      ],
      "answer": 1,
      "explanation": "Distance-vector protocols like RIP and EIGRP rely on split-horizon (never advertising a route back out the interface it was learned on). OSPF solves the LAN flooding issue using the DR/BDR mechanism instead."
    },
    {
      "id": "q18",
      "prompt": "If a network uses OSPF over an Ethernet switch, what determines which routers will participate in the initial DR/BDR election?",
      "options": [
        "Only routers that reach the 'Full' state.",
        "Any router that reaches at least the 'Two-Way' state during the initial wait period.",
        "Only routers manually configured with a priority greater than 100.",
        "Any router that successfully authenticates via MD5."
      ],
      "answer": 1,
      "explanation": "The election occurs during the Two-Way state. Any router that reaches bidirectional communication (Two-Way) before the Wait Timer expires is considered a candidate for the election."
    },
    {
      "id": "q19",
      "prompt": "Which command must be executed on a router interface to manually force its OSPF priority to 50?",
      "options": [
        "ospf priority 50",
        "ip ospf priority 50",
        "router ospf priority 50",
        "set priority 50 ospf"
      ],
      "answer": 1,
      "explanation": "The OSPF priority is an interface-level command, applied using `ip ospf priority <0-255>`."
    },
    {
      "id": "q20",
      "prompt": "In an OSPF network, router R1 is elected as the DR. Some time later, a network administrator changes R1's interface priority to 0. What immediately happens?",
      "options": [
        "Nothing happens until the OSPF process is manually cleared.",
        "R1 immediately loses its DR status because priority 0 makes it ineligible, forcing a new election.",
        "The BDR ignores the change because the election is strictly non-preemptive.",
        "R1 becomes the BDR, and the previous BDR is promoted to DR."
      ],
      "answer": 1,
      "explanation": "While standard OSPF elections are non-preemptive, changing an active DR or BDR's priority to 0 is an exception. Priority 0 means 'cannot participate', so the router instantly steps down, triggering a new election."
    },
    {
      "id": "q21",
      "prompt": "Two routers are connected back-to-back via an Ethernet cable. R1's interface is configured with the OSPF network type 'Point-to-Point', while R2's interface remains at the default 'Broadcast'. What is the resulting OSPF behavior?",
      "options": [
        "The routers will fail to reach the Two-Way state.",
        "The routers will constantly flap between the ExStart and Exchange states.",
        "The routers will form a FULL adjacency, but routes will not be installed in the routing table because the network types mismatch.",
        "The routers will negotiate and automatically fall back to the Broadcast network type."
      ],
      "answer": 2,
      "explanation": "This is a classic OSPF trap. A mismatch between Broadcast and P2P network types still allows timers (if adjusted to match) to establish a FULL adjacency. However, because they generate different LSA types (Network LSA vs Router LSA links), the SPF algorithm cannot resolve the topology, and routes are not installed."
    },
    {
      "id": "q22",
      "prompt": "When an engineer configures `router-id 4.4.4.4` on a router that has already established OSPF adjacencies using the automatic ID `192.168.1.1`, what message or action occurs immediately?",
      "options": [
        "All adjacencies drop instantly and reform with the new ID.",
        "The router logs a warning that the OSPF process must be cleared for the change to take effect.",
        "The router sends a specialized LSA to inform neighbors of the ID change.",
        "The router immediately changes the ID but keeps current adjacencies alive."
      ],
      "answer": 1,
      "explanation": "The Cisco IOS immediately prompts the user with a console message stating that `clear ip ospf process` must be executed before the new Router-ID will be actively used."
    },
    {
      "id": "q23",
      "prompt": "Why is it considered a best practice to use a `/32` subnet mask when creating a loopback interface intended to serve as an OSPF Router-ID?",
      "options": [
        "Because OSPF will refuse to use a loopback interface if it has a subnet mask larger than /32.",
        "Because loopback interfaces do not support standard classful or classless subnet masks.",
        "To prevent OSPF from attempting to perform a DR/BDR election on the loopback itself.",
        "To preserve IP address space, since a loopback connects to no physical devices, and OSPF advertises loopbacks as /32 host routes by default anyway."
      ],
      "answer": 3,
      "explanation": "Since a loopback has no physical link, assigning it a /24 wastes 253 IP addresses. Furthermore, regardless of the configured mask, OSPF defaults to advertising loopback interfaces as /32 host routes."
    }
  ]
},
{
  "id": "ospf-advanced",
  "topicSlug": "routing",
  "group": "OSPF Advanced",
  "title": "OSPF Advanced Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "On a standard broadcast network segment, what are the default values for the OSPF Hello and Dead intervals?",
      "options": [
        "Hello 5 seconds, Dead 15 seconds",
        "Hello 10 seconds, Dead 40 seconds",
        "Hello 30 seconds, Dead 120 seconds",
        "Hello 60 seconds, Dead 180 seconds"
      ],
      "answer": 1,
      "explanation": "By default on broadcast and point-to-point links, OSPF sends a Hello packet every 10 seconds and waits 40 seconds before declaring a silent neighbor dead."
    },
    {
      "id": "q2",
      "prompt": "OSPF maintains a strict mathematical ratio between its Hello timer and its Dead timer. What is this default ratio?",
      "options": [
        "1:2",
        "1:3",
        "1:4",
        "1:5"
      ],
      "answer": 2,
      "explanation": "OSPF uses a 1:4 ratio. The Dead timer is always four times the length of the Hello interval by default (e.g., 10s and 40s)."
    },
    {
      "id": "q3",
      "prompt": "Two OSPF routers are connected to the same switch. R1 is configured with a Hello interval of 10s, while R2 is manually configured with a Hello interval of 5s. What is the result?",
      "options": [
        "The routers will dynamically negotiate to use the lowest timer (5s).",
        "The routers will form an adjacency but log continuous warning messages.",
        "The routers will completely fail to form an OSPF adjacency.",
        "The Designated Router (DR) will force R2 to adopt the 10s timer."
      ],
      "answer": 2,
      "explanation": "Matching OSPF timers is a strict neighborship condition. If the Hello or Dead intervals do not match exactly, the routers will ignore each other's Hello packets and no adjacency will form."
    },
    {
      "id": "q4",
      "prompt": "Which configuration command correctly changes the OSPF Hello timer to 5 seconds on a specific interface?",
      "options": [
        "ip ospf hello-interval 5",
        "ospf timer hello 5",
        "timers basic 5 20",
        "router ospf hello 5"
      ],
      "answer": 0,
      "explanation": "OSPF timers are modified at the interface level using the `ip ospf hello-interval <seconds>` command."
    },
    {
      "id": "q5",
      "prompt": "When OSPF performs a DR/BDR election on a Broadcast Multi-Access network, which two criteria are used to determine the winner, in correct order of evaluation?",
      "options": [
        "Highest Router-ID, then highest Priority",
        "Lowest Priority, then lowest Router-ID",
        "Highest Priority, then highest Router-ID",
        "Lowest Router-ID, then highest Priority"
      ],
      "answer": 2,
      "explanation": "OSPF first compares interface Priority (0-255). If there is a tie (e.g., both have the default priority of 1), it uses the highest Router-ID as the tiebreaker."
    },
    {
      "id": "q6",
      "prompt": "What is the specific effect of configuring `ip ospf priority 0` on a router's interface?",
      "options": [
        "It makes the router the absolute highest candidate for Designated Router.",
        "It resets the OSPF process on that specific interface.",
        "It forces the router to permanently remain a DROther and never participate in the election.",
        "It disables OSPF routing completely on that interface."
      ],
      "answer": 2,
      "explanation": "A priority of 0 explicitly removes the router from the DR/BDR election process, ensuring it will never assume the DR or BDR role."
    },
    {
      "id": "q7",
      "prompt": "If an administrator does not manually configure OSPF interface priorities, what default priority value is used by all routers during the DR/BDR election?",
      "options": [
        "0",
        "1",
        "100",
        "255"
      ],
      "answer": 1,
      "explanation": "The default OSPF priority on all broadcast interfaces is 1, which is why DR/BDR elections almost always fall back to the Router-ID tiebreaker."
    },
    {
      "id": "q8",
      "prompt": "R1 is currently the active Designated Router (DR) for a LAN segment. R2, a newly installed router, boots up with an OSPF priority of 255. What happens immediately to the DR role?",
      "options": [
        "R2 immediately preempts R1 and becomes the new DR.",
        "R1 remains the DR, because the OSPF DR/BDR election is strictly non-preemptive.",
        "R1 and R2 both act as DRs and load-balance the LSA updates.",
        "The OSPF process crashes and re-initiates the Two-Way state across the segment."
      ],
      "answer": 1,
      "explanation": "OSPF DR/BDR elections are non-preemptive. Once a DR is elected, it retains the role until it fails or its OSPF process is restarted, regardless of a new router joining with a superior priority."
    },
    {
      "id": "q9",
      "prompt": "According to the internal mechanics of the OSPF DR/BDR election process, which role is actually elected first?",
      "options": [
        "The Designated Router (DR)",
        "The Backup Designated Router (BDR)",
        "The DROther",
        "The Area Border Router (ABR)"
      ],
      "answer": 1,
      "explanation": "During the election sequence, routers technically elect the Backup Designated Router (BDR) first. If there is no existing DR, the newly elected BDR is immediately promoted to DR, and a new BDR election takes place."
    },
    {
      "id": "q10",
      "prompt": "An administrator manually configures a new Router-ID using the `router-id 1.1.1.1` command on an active OSPF router. What additional action must be taken for this new ID to become actively used?",
      "options": [
        "Execute `write memory` to save the configuration.",
        "Wait for the Hello timer to expire.",
        "Execute `clear ip ospf process`.",
        "Shut down and re-enable the physical interface."
      ],
      "answer": 2,
      "explanation": "Because the Router-ID election only happens once at startup, any manual changes require restarting the OSPF routing process using the `clear ip ospf process` command."
    },
    {
      "id": "q11",
      "prompt": "Which interface-level command allows an administrator to explicitly define the OSPF cost of a link, completely bypassing the standard mathematical calculation?",
      "options": [
        "ip ospf cost <value>",
        "ospf metric <value>",
        "bandwidth <value>",
        "auto-cost <value>"
      ],
      "answer": 0,
      "explanation": "The `ip ospf cost <value>` command hardcodes the cost metric for that specific interface, which is useful for manual path manipulation without affecting QoS bandwidth parameters."
    },
    {
      "id": "q12",
      "prompt": "When analyzing the OSPF topology table, how does the protocol ultimately decide which path becomes the 'best path' installed in the routing table?",
      "options": [
        "The path with the highest cumulative bandwidth.",
        "The path with the lowest cumulative cost.",
        "The path with the highest Router-ID.",
        "The path traversing the fewest number of hops."
      ],
      "answer": 1,
      "explanation": "In OSPF, lower is better. The router calculates the cost of every link along a route and selects the path with the lowest total cumulative cost."
    },
    {
      "id": "q13",
      "prompt": "Using OSPF's default reference bandwidth of 100 Mbps, what calculated cost value is assigned to a GigabitEthernet (1 Gbps) interface?",
      "options": [
        "0.1",
        "1",
        "10",
        "100"
      ],
      "answer": 1,
      "explanation": "The formula is 100 / 1000 = 0.1. However, OSPF cannot use fractional costs and rounds any value less than 1 up to 1. This causes both FastEthernet and GigabitEthernet to appear equal."
    },
    {
      "id": "q14",
      "prompt": "An administrator wants to ensure that OSPF correctly differentiates between FastEthernet and GigabitEthernet links. Which command correctly adjusts the reference bandwidth to 1000 Mbps?",
      "options": [
        "ip ospf reference-bandwidth 1000",
        "ospf cost-reference 1000",
        "auto-cost reference-bandwidth 1000",
        "bandwidth-reference 1000"
      ],
      "answer": 2,
      "explanation": "The `auto-cost reference-bandwidth <Mbps>` command is issued in router configuration mode to change the numerator of the OSPF cost calculation."
    },
    {
      "id": "q15",
      "prompt": "What is a critical network-wide rule when altering the OSPF `auto-cost reference-bandwidth`?",
      "options": [
        "It must be configured identically on every single router within the OSPF domain.",
        "It must be applied strictly to Area Border Routers (ABRs).",
        "It must only be used if IPv6 (OSPFv3) is actively routing.",
        "It must be an exact multiple of the interface's MTU size."
      ],
      "answer": 0,
      "explanation": "If routers in the same network use different reference bandwidths, they will calculate path costs differently, leading to sub-optimal routing, asymmetric traffic flows, or routing loops."
    },
    {
      "id": "q16",
      "prompt": "What is the exact mathematical formula OSPF uses to dynamically calculate the cost of an interface?",
      "options": [
        "Interface Bandwidth / Reference Bandwidth",
        "Reference Bandwidth / Interface Bandwidth",
        "Reference Bandwidth * 10 / Delay",
        "10^7 / Interface Bandwidth"
      ],
      "answer": 1,
      "explanation": "OSPF divides the Reference Bandwidth (default 100 Mbps) by the configured Interface Bandwidth."
    },
    {
      "id": "q17",
      "prompt": "Router A and Router B connect via Ethernet with default OSPF priorities. Router A has a physical IP of `192.168.1.1` and a loopback IP of `10.1.1.1`. Router B has a physical IP of `192.168.2.2` and no loopback. Who wins the DR election?",
      "options": [
        "Router A, because loopback IPs always automatically win DR elections.",
        "Router A, because 192.168.1.1 is numerically lower than 192.168.2.2.",
        "Router B, because its active physical IP (192.168.2.2) is numerically higher than Router A's active loopback (10.1.1.1).",
        "Router B, because routers without loopbacks are preferred in elections."
      ],
      "answer": 2,
      "explanation": "The tiebreaker is the highest Router-ID. Router A's Router-ID is 10.1.1.1 (the loopback). Router B's Router-ID is 192.168.2.2 (its highest physical IP). Because 192.168.2.2 is mathematically higher than 10.1.1.1, Router B wins."
    },
    {
      "id": "q18",
      "prompt": "In which Cisco CLI configuration modes are the `ip ospf cost <value>` and `auto-cost reference-bandwidth <value>` commands entered, respectively?",
      "options": [
        "Both are entered in Global Configuration mode.",
        "Both are entered in Router Configuration mode.",
        "Interface Configuration mode and Router Configuration mode.",
        "Router Configuration mode and Interface Configuration mode."
      ],
      "answer": 2,
      "explanation": "The `ip ospf cost` command modifies a specific link, so it goes under the interface. The `auto-cost reference-bandwidth` command affects the entire OSPF process, so it goes under the `router ospf` configuration mode."
    },
    {
      "id": "q19",
      "prompt": "An engineer configures `ip ospf cost 50` on an interface. Later, they modify the interface's actual bandwidth using the `bandwidth 10000` command. What is the resulting OSPF cost of the interface?",
      "options": [
        "10",
        "50",
        "1",
        "100"
      ],
      "answer": 1,
      "explanation": "The `ip ospf cost` command statically overrides the dynamic calculation. Changing the underlying interface bandwidth afterward will not alter the hardcoded OSPF cost of 50."
    },
    {
      "id": "q20",
      "prompt": "On standard Cisco IOS, if an administrator changes the OSPF Hello interval on an interface from 10 to 5 seconds using `ip ospf hello-interval 5`, what happens to the Dead interval if it is not manually changed?",
      "options": [
        "It remains at the default 40 seconds, causing a ratio mismatch.",
        "It automatically adjusts to 20 seconds to maintain the 1:4 ratio.",
        "It automatically drops to 15 seconds to emulate EIGRP behavior.",
        "The router rejects the command until the dead-interval is configured simultaneously."
      ],
      "answer": 1,
      "explanation": "Cisco IOS is designed to automatically adjust the Dead interval to exactly four times the configured Hello interval, ensuring the 1:4 ratio is maintained to prevent accidental neighborship drops."
    },
    {
      "id": "q21",
      "prompt": "R1 is the active DR and R2 is the active BDR on a LAN segment. R1 suffers a power failure and goes offline, so R2 is promoted to DR. Five minutes later, R1 boots back up. What OSPF role does R1 assume upon rejoining the segment?",
      "options": [
        "Designated Router (DR)",
        "Backup Designated Router (BDR)",
        "DROther",
        "Area Border Router (ABR)"
      ],
      "answer": 1,
      "explanation": "Because DR/BDR elections are non-preemptive, R2 remains the DR even when R1 returns. R1 boots up, accepts R2 as the DR, and takes the vacant BDR role."
    }
  ]
},
{
  "id": "redistribution",
  "topicSlug": "routing",
  "group": "Redistribution",
  "title": "Route Redistribution Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "Which specific router role is required to perform route redistribution between two different routing domains, such as OSPF and EIGRP?",
      "options": [
        "Area Border Router (ABR)",
        "Designated Router (DR)",
        "Autonomous System Border Router (ASBR)",
        "Provider Edge Router (PE)"
      ],
      "answer": 2,
      "explanation": "An ASBR (Autonomous System Border Router) sits at the boundary between two different autonomous systems or routing domains, making it the exact location where redistribution is configured."
    },
    {
      "id": "q2",
      "prompt": "When redistributing routes from one OSPF process into another OSPF process, which keyword is critical to include so that classless (VLSM) networks are successfully redistributed?",
      "options": [
        "classless",
        "subnets",
        "metric-type 1",
        "auto-summary"
      ],
      "answer": 1,
      "explanation": "The `subnets` keyword forces OSPF to redistribute subnetted (classless) networks. Without it, OSPF will only redistribute major classful networks."
    },
    {
      "id": "q3",
      "prompt": "Why is it NOT necessary to manually define a seed metric when redistributing routes from EIGRP AS 100 into EIGRP AS 200?",
      "options": [
        "Because EIGRP automatically summarizes all routes between autonomous systems.",
        "Because both processes are EIGRP, meaning their metrics are fully compatible and carried across automatically.",
        "Because EIGRP strictly uses hop count, which resets to 0 at the AS boundary.",
        "Because EIGRP AS 200 uses the bandwidth of its own interfaces to override the incoming metric."
      ],
      "answer": 1,
      "explanation": "When redistributing between two processes of the exact same protocol (like EIGRP to EIGRP), the metric formulas match, so the detailed metric parameters transfer seamlessly."
    },
    {
      "id": "q4",
      "prompt": "Why MUST an administrator supply manual metric parameters when redistributing OSPF routes into an EIGRP domain?",
      "options": [
        "Because OSPF uses cost based on bandwidth, while EIGRP uses a composite metric requiring bandwidth, delay, reliability, load, and MTU.",
        "Because OSPF routes lack a subnet mask, which EIGRP requires.",
        "Because EIGRP only accepts routes with an Administrative Distance of 90.",
        "Because OSPF limits hop counts to 15, while EIGRP supports up to 255."
      ],
      "answer": 0,
      "explanation": "OSPF and EIGRP calculate metrics completely differently. EIGRP cannot translate OSPF's single 'cost' value into its complex 5-vector composite metric without manual input."
    },
    {
      "id": "q5",
      "prompt": "Which command successfully redistributes EIGRP AS 200 routes into OSPF Process 100 while ensuring all subnetted networks are included?",
      "options": [
        "redistribute eigrp 200",
        "redistribute eigrp 200 subnets",
        "redistribute ospf 100 subnets",
        "ip route eigrp 200 ospf 100"
      ],
      "answer": 1,
      "explanation": "This command must be entered under the `router ospf 100` process. It points to the source protocol (`eigrp 200`) and includes the `subnets` keyword to ensure VLSM networks are injected."
    },
    {
      "id": "q6",
      "prompt": "An administrator is configuring `redistribute ospf 100 metric 10000 100 255 1 1500` under the EIGRP routing process. What specific metric component does the `255` represent?",
      "options": [
        "Bandwidth",
        "Delay",
        "Reliability",
        "MTU"
      ],
      "answer": 2,
      "explanation": "The order of EIGRP metric parameters is Bandwidth, Delay, Reliability, Load, MTU. The `255` indicates maximum reliability."
    },
    {
      "id": "q7",
      "prompt": "In the command `redistribute ospf 100 metric 10000 100 255 1 1500`, what does the `1` represent?",
      "options": [
        "Load",
        "Delay",
        "Administrative Distance",
        "Hop Count"
      ],
      "answer": 0,
      "explanation": "The fourth value in the command syntax is Load. A value of 1 represents the lowest (best) possible load on the link."
    },
    {
      "id": "q8",
      "prompt": "In the command `redistribute ospf 100 metric 10000 100 255 1 1500`, what happens to the MTU value (1500) within the EIGRP domain?",
      "options": [
        "It is the primary tiebreaker if Bandwidth and Delay are identical.",
        "It is actively used to calculate the Feasible Distance.",
        "It is ignored completely and not carried in the update packet.",
        "It is carried in the routing update but is NOT used in the default metric calculation."
      ],
      "answer": 3,
      "explanation": "EIGRP carries the MTU value in its update packets for path tracking, but the default K-values (K5=0) dictate that MTU is completely ignored during the actual metric calculation."
    },
    {
      "id": "q9",
      "prompt": "If you are configuring a router to take routes learned from OSPF and inject them into EIGRP, which configuration mode must you be in when you type the `redistribute` command?",
      "options": [
        "Global configuration mode",
        "Router OSPF configuration mode (`router ospf <pid>`)",
        "Router EIGRP configuration mode (`router eigrp <as>`)",
        "Interface configuration mode on the boundary link"
      ],
      "answer": 2,
      "explanation": "Redistribution is configured in the destination routing protocol. To inject routes INTO EIGRP, you must execute the command under the `router eigrp <as>` process."
    },
    {
      "id": "q10",
      "prompt": "An administrator redistributes EIGRP into OSPF. However, users complain that several specific department VLANs are unreachable, while main summarized networks work fine. What is the most likely configuration mistake?",
      "options": [
        "The administrator forgot the `subnets` keyword.",
        "The administrator used the wrong EIGRP AS number.",
        "The OSPF reference bandwidth is mismatched.",
        "The EIGRP internal AD of 90 is overriding OSPF."
      ],
      "answer": 0,
      "explanation": "If the `subnets` keyword is omitted when redistributing into OSPF, only major classful networks are redistributed. All classless, subnetted department VLANs are filtered out."
    },
    {
      "id": "q11",
      "prompt": "Which verification command allows an engineer to see a high-level summary of active routing processes and confirm which protocols are actively being redistributed?",
      "options": [
        "show ip route",
        "show ip protocols",
        "show ip ospf neighbor",
        "show ip eigrp topology"
      ],
      "answer": 1,
      "explanation": "`show ip protocols` provides an excellent overview of the routing protocols running on the device, including K-values, AS numbers, and explicitly listed redistribution settings."
    },
    {
      "id": "q12",
      "prompt": "When OSPF routes are successfully redistributed into EIGRP, how will they appear in the routing tables of other EIGRP routers, and what will their Administrative Distance (AD) be?",
      "options": [
        "Internal routes (D) with an AD of 90",
        "External routes (EX) with an AD of 170",
        "External routes (E2) with an AD of 110",
        "Summarized routes (Summ) with an AD of 5"
      ],
      "answer": 1,
      "explanation": "Routes brought into EIGRP from an outside source via redistribution are marked as External (EX) and are assigned a highly untrusted AD of 170."
    },
    {
      "id": "q13",
      "prompt": "What happens if a network engineer attempts to redistribute OSPF into EIGRP but totally forgets to include the `metric` parameters?",
      "options": [
        "EIGRP defaults to a metric of 0, making them the most preferred routes.",
        "EIGRP automatically borrows the interface bandwidth and delay of the ASBR's egress port.",
        "EIGRP assigns them an infinite metric, meaning the routes will be considered unreachable and will not be installed.",
        "EIGRP prompts the engineer with a CLI wizard to input the values."
      ],
      "answer": 2,
      "explanation": "EIGRP uses an 'infinite' seed metric for routes redistributed from other IGPs. Without manually defining a seed metric, the routes are considered infinitely far away and will fail to propagate."
    },
    {
      "id": "q14",
      "prompt": "When an ASBR redistributes EIGRP routes into OSPF, which specific Link-State Advertisement (LSA) type does the ASBR generate to flood these external routes across the OSPF domain?",
      "options": [
        "Type 1 Router LSA",
        "Type 3 Summary LSA",
        "Type 4 ASBR Summary LSA",
        "Type 5 External LSA"
      ],
      "answer": 3,
      "explanation": "An ASBR generates Type 5 External LSAs to represent routes learned from an external routing domain (like EIGRP) and floods them throughout the OSPF autonomous system."
    },
    {
      "id": "q15",
      "prompt": "If EIGRP routes are redistributed into OSPF, how do they normally appear in the OSPF routing table by default?",
      "options": [
        "As [O] Intra-area routes",
        "As [O IA] Inter-area routes",
        "As [E2] External Type 2 routes",
        "As [D EX] EIGRP External routes"
      ],
      "answer": 2,
      "explanation": "By default, routes redistributed into OSPF are imported as Type 2 External (E2) routes, which do not increment internal link costs as they propagate."
    },
    {
      "id": "q16",
      "prompt": "What is a major risk when configuring 'mutual redistribution' (redistributing OSPF into EIGRP, and simultaneously EIGRP into OSPF) at multiple boundary routers without applying route tags or filtering?",
      "options": [
        "The MTU on the connecting interfaces will dynamically decrease.",
        "Routing loops and suboptimal routing can occur due to Administrative Distance confusion.",
        "The routers will automatically shut down the boundary interfaces to protect the CPU.",
        "EIGRP will convert the OSPF backbone Area 0 into a Stub area."
      ],
      "answer": 1,
      "explanation": "Mutual redistribution at multiple points is notoriously dangerous. Because OSPF (AD 110) beats EIGRP External (AD 170), an EIGRP router might prefer an external path back into its own domain over its own native routes, causing severe routing loops."
    },
    {
      "id": "q17",
      "prompt": "Which of the following EIGRP metric components is technically configured in 'tens of microseconds' when applying the redistribution command?",
      "options": [
        "Bandwidth",
        "Reliability",
        "Delay",
        "Load"
      ],
      "answer": 2,
      "explanation": "In the `redistribute` and `default-metric` commands, the delay parameter is input in tens of microseconds. For example, entering `100` equates to 1000 microseconds of delay."
    },
    {
      "id": "q18",
      "prompt": "When redistributing from another IGP (like EIGRP or RIP) into OSPF, what default 'seed cost' does OSPF assign to the external routes if the administrator does not manually specify a metric?",
      "options": [
        "1",
        "10",
        "20",
        "Infinite"
      ],
      "answer": 2,
      "explanation": "Unlike EIGRP (which defaults to infinite), OSPF automatically assigns a default seed metric of 20 to all redistributed external routes (except BGP, which gets a default of 1)."
    },
    {
      "id": "q19",
      "prompt": "An ASBR has `redistribute ospf 100 metric 10000 100 255 1 1500` applied under its EIGRP configuration. Why is the bandwidth (10000) and delay (100) critical for EIGRP's DUAL algorithm?",
      "options": [
        "They are the only two values actually utilized by default (K1 and K3) to calculate the Feasible Distance.",
        "They define the maximum number of hops the redistributed route can take.",
        "They force EIGRP to override OSPF's internal DR/BDR election.",
        "They determine the Administrative Distance assigned to the external route."
      ],
      "answer": 0,
      "explanation": "Because EIGRP uses K1 (Bandwidth) and K3 (Delay) by default to calculate path metrics, supplying these two values allows DUAL to properly map the incoming OSPF route to an EIGRP metric."
    },
    {
      "id": "q20",
      "prompt": "To check if an OSPF router successfully imported an EIGRP route into its link-state database as an external LSA, which command is most precise?",
      "options": [
        "show ip eigrp topology",
        "show ip ospf database",
        "show run | section redistribute",
        "show ip ospf neighbor"
      ],
      "answer": 1,
      "explanation": "The `show ip ospf database` command allows you to view all LSAs currently held by the router, including the Type 5 External LSAs generated by redistribution."
    },
    {
      "id": "q21",
      "prompt": "If you view the routing table of an internal EIGRP router and see a route marked `D EX`, what does this explicitly confirm?",
      "options": [
        "The route is experiencing high Delay and is Exhausted.",
        "The route is actively experiencing an equal-cost load-balancing Exception.",
        "The route originated in a different routing protocol and was redistributed into EIGRP.",
        "The route is an internal EIGRP route currently in the Active execution state."
      ],
      "answer": 2,
      "explanation": "`D EX` stands for EIGRP External. It confirms that an ASBR brought this route into the EIGRP domain from another source, like OSPF or a static route."
    },
    {
      "id": "q22",
      "prompt": "When configuring redistribution on an ASBR to pass routes between OSPF 10 and OSPF 20, why might an administrator do this instead of just merging them into a single process?",
      "options": [
        "To allow OSPF to utilize unequal-cost load balancing via variance.",
        "To segment large routing domains, isolate topology changes, and keep LSDB sizes manageable.",
        "To automatically convert OSPF into a distance-vector protocol.",
        "To bypass the requirement of connecting every area to Area 0."
      ],
      "answer": 1,
      "explanation": "Running multiple OSPF processes and redistributing between them is a common design to isolate distinct routing domains (like after a company merger), preventing LSA floods in one domain from impacting the other."
    }
  ]
},
{
  "id": "packet-flow-final",
  "topicSlug": "packet-flow",
  "final": true,
  "title": "Packet Flow Quiz",
  "questions": [
    {
      "id": "q1",
      "prompt": "When PC1 prepares to send data to PC2, what is the specific purpose of the initial 'AND' operation?",
      "options": [
        "To calculate the shortest path to the default gateway.",
        "To determine if the destination IP is in the same local network or a remote network.",
        "To discover the MAC address of PC2.",
        "To verify the integrity of the data payload."
      ],
      "answer": 1,
      "explanation": "The AND operation allows the source device to mathematically check if the target IP resides on its own local subnet or if the packet must be sent to a router."
    },
    {
      "id": "q2",
      "prompt": "How does a host mathematically perform the AND operation to determine the destination network?",
      "options": [
        "By combining its own IP address with the destination MAC address.",
        "By multiplying the destination IP address by the default gateway IP.",
        "By subtracting its own subnet mask from 255.255.255.255.",
        "By combining the destination IP address with its own subnet mask in binary."
      ],
      "answer": 3,
      "explanation": "The host aligns the destination IP address and its own subnet mask in binary, resulting in the network address of the destination. If this matches the host's own network address, the destination is local."
    },
    {
      "id": "q3",
      "prompt": "Which of the following represents the Layer 2 (MAC) broadcast address used during an ARP request?",
      "options": [
        "255.255.255.255",
        "0.0.0.0",
        "ffff.ffff.ffff",
        "01:00:5e:00:00:00"
      ],
      "answer": 2,
      "explanation": "The MAC address `ffff.ffff.ffff` is the Layer 2 broadcast address, which forces the switch to flood the frame out to all connected devices."
    },
    {
      "id": "q4",
      "prompt": "What is the standard Layer 3 broadcast address used in IPv4 networks?",
      "options": [
        "255.255.255.255",
        "ffff.ffff.ffff",
        "127.0.0.1",
        "0.0.0.0"
      ],
      "answer": 0,
      "explanation": "The IP address `255.255.255.255` acts as the universal Layer 3 broadcast address for a local network."
    },
    {
      "id": "q5",
      "prompt": "When a switch receives an initial ARP request frame from PC1 on port 0/0, what does it learn and store in its MAC address table?",
      "options": [
        "The destination IP address.",
        "The source MAC address of PC1.",
        "The destination MAC address (`ffff.ffff.ffff`).",
        "The source IP address of PC1."
      ],
      "answer": 1,
      "explanation": "Switches build their MAC address tables by looking at the source MAC address of incoming frames and mapping it to the port the frame arrived on."
    },
    {
      "id": "q6",
      "prompt": "How does a standard network switch handle an incoming frame destined for the MAC address `ffff.ffff.ffff`?",
      "options": [
        "It floods the frame out of all other active ports except the incoming port.",
        "It drops the frame immediately for security.",
        "It routes the frame to the default gateway.",
        "It sends an ARP reply back to the sender."
      ],
      "answer": 0,
      "explanation": "Because `ffff.ffff.ffff` is the broadcast address, the switch must flood it everywhere (except the port it arrived on) to ensure the intended target receives it."
    },
    {
      "id": "q7",
      "prompt": "How does PC2 properly respond to an ARP request from PC1?",
      "options": [
        "With an ICMP Echo Reply.",
        "With a broadcast ARP reply to all hosts.",
        "With an ARP request of its own to verify PC1's identity.",
        "With a unicast ARP reply directed specifically to PC1's MAC address."
      ],
      "answer": 3,
      "explanation": "Because the ARP request included PC1's source MAC address, PC2 learns it and can send the ARP reply directly back to PC1 via a unicast frame."
    },
    {
      "id": "q8",
      "prompt": "When a packet flows between different networks across multiple routers, which 'golden rule' of addressing applies?",
      "options": [
        "Both IP and MAC addresses change at every router hop.",
        "IP addresses change at every hop, but MAC addresses stay the same end-to-end.",
        "IP addresses stay the same end-to-end, but MAC addresses change at every hop.",
        "Both IP and MAC addresses stay the same end-to-end."
      ],
      "answer": 2,
      "explanation": "Logical IP addresses track the original source and final destination, while physical MAC addresses are stripped and rebuilt by each router to move the frame across the local data link."
    },
    {
      "id": "q9",
      "prompt": "PC1 (192.168.1.1) wants to ping remote PC3 (192.168.2.1). Whose MAC address does PC1 target in its initial ARP request?",
      "options": [
        "The MAC address of PC3 directly.",
        "The MAC address of the destination switch.",
        "The MAC address of its own default gateway.",
        "It does not use ARP for remote networks."
      ],
      "answer": 2,
      "explanation": "Because PC1 knows PC3 is on a different network, Layer 2 Ethernet cannot reach it directly. PC1 must send the frame to its default gateway, so it ARPs for the gateway's MAC address."
    },
    {
      "id": "q10",
      "prompt": "What is the first action a router takes when it receives an incoming frame destined for its own MAC address?",
      "options": [
        "It removes the MAC header and reads the destination IP address to perform a route lookup.",
        "It modifies the destination IP address to match the next hop.",
        "It forwards the frame exactly as it was received.",
        "It sends an ICMP echo reply back to the sender."
      ],
      "answer": 0,
      "explanation": "The router accepts the frame, strips away the Layer 2 Ethernet header, and inspects the Layer 3 IP packet inside to determine where to route the traffic."
    },
    {
      "id": "q11",
      "prompt": "After R1 determines that a packet must be forwarded to R2 (next-hop 192.168.3.2) to reach PC3, what does R1 use as the target in its ARP request?",
      "options": [
        "The IP address of PC3.",
        "The MAC address of PC1.",
        "The IP address of the destination switch.",
        "The IP address of R2."
      ],
      "answer": 3,
      "explanation": "R1 must build a new Ethernet frame to reach R2. Since R2 is the next hop on the directly connected 3.0 network, R1 sends an ARP request for R2's IP address (192.168.3.2)."
    },
    {
      "id": "q12",
      "prompt": "In a topology where PC1 pings PC3 across two intermediate routers (R1 and R2), how many total ARP requests are generated on the forward path, assuming all ARP caches are initially empty?",
      "options": [
        "1",
        "2",
        "3",
        "4"
      ],
      "answer": 2,
      "explanation": "Three ARPs occur: PC1 ARPs for the gateway (R1), R1 ARPs for the next hop (R2), and R2 ARPs for the final destination (PC3)."
    },
    {
      "id": "q13",
      "prompt": "What happens to the Time To Live (TTL) value of a packet as it travels from PC1 to PC3 through intermediate routers?",
      "options": [
        "It is reduced by 1 at every router hop.",
        "It remains unchanged end-to-end.",
        "It increases by 1 at every switch hop.",
        "It is reduced by 1 only at the final destination."
      ],
      "answer": 0,
      "explanation": "Every time a router processes and forwards an IP packet, it decrements the TTL value by 1. This prevents packets from circulating forever in a routing loop."
    },
    {
      "id": "q14",
      "prompt": "When PC3 sends an echo reply back to PC1 along the exact same path, why are zero ARP requests generated?",
      "options": [
        "Because echo replies bypass the Data Link layer.",
        "Because the forward path already populated the ARP caches of all devices.",
        "Because ARP is only used for ICMP echo requests, not replies.",
        "Because the routers use Proxy ARP for all return traffic."
      ],
      "answer": 1,
      "explanation": "During the forward path, every device learned the MAC addresses of its neighbors from the incoming frames and ARP replies, so their caches are fully populated for the return trip."
    },
    {
      "id": "q15",
      "prompt": "On the reply path, PC3 (192.168.2.1) sends a packet back to PC1 (192.168.1.1). What are the destination IP and destination MAC on the frame leaving PC3?",
      "options": [
        "Dest IP: 192.168.1.1, Dest MAC: PC1's MAC",
        "Dest IP: Gateway's IP, Dest MAC: Gateway's MAC",
        "Dest IP: 192.168.1.1, Dest MAC: Gateway's MAC",
        "Dest IP: Gateway's IP, Dest MAC: PC1's MAC"
      ],
      "answer": 2,
      "explanation": "The destination IP stays the same end-to-end (PC1: 192.168.1.1). Because PC1 is remote, the destination MAC address must be the local default gateway's MAC."
    },
    {
      "id": "q16",
      "prompt": "During the reply path, SW2 receives a unicast frame from PC3 destined for the gateway's MAC address. How does SW2 handle this frame?",
      "options": [
        "It floods the frame because it is return traffic.",
        "It drops the frame if it didn't initiate the session.",
        "It sends the frame out of all ports connecting to routers.",
        "It checks its MAC table, finds the gateway's MAC, and forwards it only out of that specific port."
      ],
      "answer": 3,
      "explanation": "Because SW2 already learned the gateway's MAC address on port 0/0 during the forward path, it can efficiently unicast the frame directly out of port 0/0."
    },
    {
      "id": "q17",
      "prompt": "What does the acronym PDU stand for in networking?",
      "options": [
        "Protocol Data Unit",
        "Packet Data Unit",
        "Physical Device Unit",
        "Primary Data Unit"
      ],
      "answer": 0,
      "explanation": "A Protocol Data Unit (PDU) is the generic term for the specific chunk of data processed at any single layer of the OSI model."
    },
    {
      "id": "q18",
      "prompt": "What is the correct Protocol Data Unit (PDU) name for data processed at Layer 4 (Transport layer)?",
      "options": [
        "Bits",
        "Frame",
        "Segment or Datagram",
        "Packet"
      ],
      "answer": 2,
      "explanation": "At Layer 4, data is broken down into Segments (when using TCP) or Datagrams (when using UDP)."
    },
    {
      "id": "q19",
      "prompt": "Which Protocol Data Unit (PDU) is associated with Layer 3 (Network layer), where IP addresses are the primary focus?",
      "options": [
        "Frame",
        "Segment",
        "Bits",
        "Packet"
      ],
      "answer": 3,
      "explanation": "A Packet is the Layer 3 PDU. A router reads the destination IP address on the packet to make forwarding decisions."
    },
    {
      "id": "q20",
      "prompt": "When a switch processes data using MAC addresses, which Protocol Data Unit (PDU) name is technically correct to use?",
      "options": [
        "Frame",
        "Datagram",
        "Packet",
        "Bits"
      ],
      "answer": 0,
      "explanation": "A Frame is the Layer 2 PDU. Switches inspect the Ethernet header of the frame to read MAC addresses."
    },
    {
      "id": "q21",
      "prompt": "According to the notes, how does an ARP message travel across the local network?",
      "options": [
        "It travels inside an IP packet.",
        "It travels directly inside an Ethernet frame.",
        "It travels inside a TCP segment.",
        "It is sent as raw bits bypassing Layer 2 entirely."
      ],
      "answer": 1,
      "explanation": "ARP operates between Layer 2 and Layer 3 and is encapsulated directly into an Ethernet frame. It does not possess an IP header."
    },
    {
      "id": "q22",
      "prompt": "When R1 receives an ICMP echo from PC1 and forwards it to R2, what does R1 do to the Layer 2 addressing?",
      "options": [
        "It keeps the source MAC as PC1 and changes the destination MAC to R2.",
        "It changes the source MAC to its own exit interface and the destination MAC to R2.",
        "It encrypts the MAC header for security.",
        "It removes the MAC header entirely and relies only on the IP header for the next hop."
      ],
      "answer": 1,
      "explanation": "Routers rebuild the frame at every hop. R1 strips the incoming frame and creates a new one with its own outgoing interface MAC as the source and R2's MAC as the destination."
    },
    {
      "id": "q23",
      "prompt": "If PC1 has the IP address `10.1.1.5` with a subnet mask of `255.255.255.0`, and it attempts to ping `10.1.2.5`, what will the AND operation dictate?",
      "options": [
        "The destination is remote; send ARP for `10.1.2.5`.",
        "The destination is local; send ARP for `10.1.2.5`.",
        "The destination is invalid; drop the packet.",
        "The destination is remote; send ARP for the default gateway."
      ],
      "answer": 3,
      "explanation": "The AND operation shows `10.1.2.5` is on a different subnet (`10.1.2.0` vs `10.1.1.0`). Therefore, the destination is remote and PC1 must ARP for its default gateway."
    },
    {
      "id": "q24",
      "prompt": "What is the primary purpose of a device's ARP cache?",
      "options": [
        "To store routing tables dynamically.",
        "To keep track of active TCP sessions.",
        "To temporarily store recent IP-to-MAC address mappings to avoid redundant broadcasts.",
        "To buffer incoming ICMP echo requests."
      ],
      "answer": 2,
      "explanation": "The ARP cache saves known IP-to-MAC resolutions so the device doesn't have to flood the network with broadcast requests every time it sends a packet."
    },
    {
      "id": "q25",
      "prompt": "What does a switch do when it receives a unicast frame destined for a MAC address that is already stored in its MAC table?",
      "options": [
        "It floods it to refresh the table.",
        "It sends an ARP request to confirm the device is still there.",
        "It passes the frame to the local router.",
        "It forwards the frame exclusively out of the port mapped to that MAC address."
      ],
      "answer": 3,
      "explanation": "Once a switch has learned a MAC address, it stops flooding traffic for that destination and efficiently forwards the frame only out of the specific learned port."
    },
    {
      "id": "q26",
      "prompt": "Why must a host (like PC1) send an ARP request for the default gateway's MAC address when communicating with a remote network?",
      "options": [
        "Because Layer 2 communication (Ethernet) can only deliver frames to devices on the same local physical segment.",
        "Because routers do not process IP addresses.",
        "Because the gateway's IP address must replace the destination IP address in the packet.",
        "Because the switch requires the gateway's MAC to perform IP routing."
      ],
      "answer": 0,
      "explanation": "Layer 2 frames cannot cross router boundaries. To get the packet off the local subnet, the host must wrap it in a frame addressed to the local router's MAC address."
    },
    {
      "id": "q27",
      "prompt": "In the full ICMP ping process between PC1 and PC2 on the same network, which protocol directly handles the generation of the 'echo' and 'echo reply' messages?",
      "options": [
        "ARP",
        "ICMP",
        "AND",
        "TCP"
      ],
      "answer": 1,
      "explanation": "ICMP (Internet Control Message Protocol) is the protocol specifically responsible for diagnostic messages like echo requests (pings) and echo replies."
    },
    {
      "id": "q28",
      "prompt": "In a scenario where PC1 (`192.168.1.1/24`) tries to ping remote PC3 (`192.168.2.1`), but PC1 has NO default gateway configured in its OS, at what step will the communication fail?",
      "options": [
        "PC1 will successfully send the packet, but the switch will drop it.",
        "PC1's AND operation determines the target is remote, but lacking a gateway, it will immediately fail to build the packet.",
        "R1 will drop the packet because PC1 is unauthorized.",
        "PC1 will continuously broadcast ARP requests for PC3's MAC address."
      ],
      "answer": 1,
      "explanation": "When the AND operation yields a remote network, the OS looks for a default gateway. If none is configured, the OS realizes it has no way off the subnet and fails instantly (e.g., 'Destination host unreachable')."
    },
    {
      "id": "q29",
      "prompt": "If a routing loop accidentally forms between R1 and R2 during the forward path of a packet, what prevents the packet from circling infinitely and crashing the network?",
      "options": [
        "The switch's MAC address table will automatically age out the frame.",
        "The ARP cache timeout will stop the transmission.",
        "The routers will automatically negotiate an STP block.",
        "The Time To Live (TTL) value in the IP header will reach 0 and the packet will be discarded."
      ],
      "answer": 3,
      "explanation": "Because the TTL decrements by 1 at every hop, a looping packet will eventually hit a TTL of 0. At that point, the router drops the packet and typically sends an 'ICMP Time Exceeded' message."
    },
    {
      "id": "q30",
      "prompt": "If a switch's MAC address table is cleared (flushed) while active traffic is currently flowing from PC1 to PC2 on the same subnet, what happens to the very next unicast frame PC1 sends to PC2?",
      "options": [
        "PC1 must send a new ARP request.",
        "The switch will treat it as an unknown unicast frame and flood it out of all other ports.",
        "The switch will temporarily drop the frame.",
        "The switch will send the frame to the default gateway."
      ],
      "answer": 1,
      "explanation": "Because PC1 already has PC2's MAC in its ARP cache, it sends a unicast frame. However, because the switch's MAC table is empty, the switch must flood the 'unknown unicast' frame out all ports to ensure delivery."
    }
  ]
},
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
