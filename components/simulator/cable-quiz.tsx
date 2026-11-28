"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { C, NcStyles, Shell } from "./_shared";

/* ───────────────────────── 8. quiz ───────────────────────── */

const QS: { q: string; o: string[]; a: number; why: string }[] = [
  { q: "How many wires are inside a twisted pair cable?", o: ["4", "8", "12", "2"], a: 1, why: "8 wires in 4 pairs, each with a colour code." },
  { q: "Which category has 6 twists per inch and improved insulation?", o: ["Category 3", "Category 5", "Cat 5e", "Category 6"], a: 3, why: "Category 6." },
  { q: "What is the maximum distance of twisted pair?", o: ["10 m", "100 m", "1 km", "40 km"], a: 1, why: "100 metres, with a maximum speed of 1 Gbps." },
  { q: "How many layers of insulation does a shielded twisted pair have?", o: ["1", "2", "3", "4"], a: 2, why: "One above each wire, one above each pair, one above all pairs." },
  { q: "Which cable still brings television service but is not used in networking anymore?", o: ["Coaxial", "Single-mode fibre", "Cat 6", "Crossover"], a: 0, why: "Coaxial cable." },
  { q: "Which fibre connects countries and distant locations?", o: ["Multi-mode", "Single-mode", "Coaxial", "Cat 5e"], a: 1, why: "Single-mode: small core, one ray of light, distances in km." },
  { q: "Which transceiver gives 10 Gbps?", o: ["SFP", "SFP+", "QSFP", "RJ-45"], a: 1, why: "SFP is 1 Gbps, SFP+ is 10 Gbps and QSFP is 100 Gbps." },
  { q: "What colour is pin 1 in EIA/TIA-568B?", o: ["Orange White", "Orange", "Green White", "Blue"], a: 0, why: "Pin 1 is Orange White." },
  { q: "Which cable normally connects a switch to a PC?", o: ["Crossover", "Straight-through", "Coaxial", "Console"], a: 1, why: "Different device types use straight-through." },
  { q: "An IP camera powered by a PoE switch is the…", o: ["PSE", "PD", "MDI-X", "SFP"], a: 1, why: "The camera receives power, so it is the PD. The switch is the PSE." },
  { q: "Which standard gives up to 60 W or 90 W per port?", o: ["802.3af", "802.3at", "802.3bt", "None"], a: 2, why: "802.3bt: PoE++ Type 3 (60 W) and Type 4 (90 W)." },
];

export function CableQuiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QS.length;
  const q = QS[Math.min(i, QS.length - 1)];

  return (
    <Shell title="Cable check" desc="Eleven quick questions on cables, pinouts and PoE." badge="Practice">
      {done ? (
        <div className="nc-fade rounded-xl border bg-background p-4 text-sm">
          <p className="font-semibold">You scored {score} out of {QS.length}.</p>
          <p className="mt-1 text-xs text-muted-foreground">{score === QS.length ? "Perfect score." : "Revisit the labs above for the ones you missed."}</p>
        </div>
      ) : (
        <div key={i} className="nc-fade rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Question {i + 1} of {QS.length}</p>
          <p className="mt-1 text-sm font-medium">{q.q}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.o.map((o, k) => {
              const right = pick !== null && k === q.a;
              const wrong = pick === k && k !== q.a;
              return (
                <Button key={o} size="sm" variant="outline" disabled={pick !== null} onClick={() => { setPick(k); if (k === q.a) setScore((s) => s + 1); }}
                  style={right ? { background: C.GREEN, color: "#fff", opacity: 1 } : wrong ? { background: C.RED, color: "#fff", opacity: 1 } : undefined}>
                  {o}
                </Button>
              );
            })}
          </div>
          {pick !== null && (
            <p className="nc-fade mt-3 text-xs leading-5" style={{ color: pick === q.a ? C.GREEN : C.RED }}>
              {pick === q.a ? "Correct. " : "Not quite. "}<span className="text-muted-foreground">{q.why}</span>
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {!done && pick !== null && <Button size="sm" onClick={() => { setPick(null); setI((x) => x + 1); }}>{i === QS.length - 1 ? "See score" : "Next question"}</Button>}
        <Button size="sm" variant="ghost" onClick={() => { setI(0); setPick(null); setScore(0); }}>Restart</Button>
      </div>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <CableQuiz />
    </>
  );
}
