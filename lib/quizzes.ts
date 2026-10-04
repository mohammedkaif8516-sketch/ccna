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
        id: "ospf-concepts",
        topicSlug: "routing",
        group: "OSPF Concepts",
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
  title: "Routing — Final Quiz",
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
